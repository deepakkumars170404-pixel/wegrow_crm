import { NextResponse } from "next/server";
import net from "net";
import os from "os";
import dns from "dns";
import { exec } from "child_process";
import util from "util";
import fs from "fs";

const execPromise = util.promisify(exec);

// Test TCP port reachability with a short timeout
function checkPortReachable(host: string, port: number, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: timeoutMs }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// Dynamically discover JioFiber router gateway IP
async function discoverJioGateway(): Promise<{ reachable: boolean; gatewayIp: string }> {
  // 1. Try resolving jiofiber.local.html (works dynamically on all JioFiber firmware)
  try {
    const resolvedIps = await dns.promises.resolve4("jiofiber.local.html");
    if (resolvedIps && resolvedIps.length > 0) {
      const candidateIp = resolvedIps[0];
      const isReachable = await checkPortReachable(candidateIp, 80, 800);
      if (isReachable) {
        return { reachable: true, gatewayIp: candidateIp };
      }
    }
  } catch {
    // DNS resolution failed or timed out, continue to fallback checks
  }

  // 2. Parallel fallback check on standard JioFiber gateway IPs (192.168.29.1 and 192.168.1.1)
  const candidateIps = ["192.168.29.1", "192.168.1.1"];
  const checks = await Promise.all(
    candidateIps.map(async (ip) => ({
      ip,
      reachable: await checkPortReachable(ip, 80, 800),
    }))
  );

  const active = checks.find((c) => c.reachable);
  if (active) {
    return { reachable: true, gatewayIp: active.ip };
  }

  return { reachable: false, gatewayIp: "" };
}

export async function GET() {
  try {
    // 1. Dynamically check JioFiber Gateway reachability
    const { reachable: gatewayReachable, gatewayIp } = await discoverJioGateway();

    // 2. Inspect active local network interfaces
    const interfaces = os.networkInterfaces();
    let localIp = "";
    let hasPrivateIp = false;

    for (const name of Object.keys(interfaces)) {
      for (const addr of interfaces[name] || []) {
        if (addr.family === "IPv4" && !addr.internal) {
          // Check for private subnet
          if (
            addr.address.startsWith("192.168.") ||
            addr.address.startsWith("10.") ||
            addr.address.startsWith("172.")
          ) {
            hasPrivateIp = true;
            localIp = addr.address;
            break;
          }
        }
      }
      if (hasPrivateIp) break;
    }

    // 3. Retrieve current Wi-Fi SSID & State via netsh
    let wifiSSID = "";
    let wifiState = "disconnected";
    try {
      const { stdout: wlanOut } = await execPromise("netsh wlan show interfaces");
      const ssidMatch = wlanOut.match(/^\s*SSID\s*:\s*(.+)$/m);
      const stateMatch = wlanOut.match(/^\s*State\s*:\s*(.+)$/m);
      if (ssidMatch) wifiSSID = ssidMatch[1].trim();
      if (stateMatch) wifiState = stateMatch[1].trim();
    } catch {
      // Ignore netsh error
    }

    // 4. Check if MicroSIP is currently running
    let microsipRunning = false;
    try {
      const { stdout } = await execPromise('tasklist /FI "IMAGENAME eq microsip.exe" /NH');
      microsipRunning = stdout.toLowerCase().includes("microsip.exe");
    } catch {
      microsipRunning = false;
    }

    // 5. If Wi-Fi is connected and JioFiber Gateway is reachable but MicroSIP is not running, auto-launch in background
    if (gatewayReachable && !microsipRunning) {
      const bridgeExe = "D:\\WEGROW\\MicroSIP\\MicroSIPBridge.exe";
      if (fs.existsSync(bridgeExe)) {
        try {
          exec(`"${bridgeExe}" /start`);
          microsipRunning = true;
        } catch {}
      }
    }

    // 6. Formulate live status
    const isWifiConnected = wifiState.toLowerCase() === "connected" || gatewayReachable;
    let status: "online" | "wifi_disconnected" | "connecting" | "offline" = "offline";
    let message = "";
    let connected = false;

    if (!isWifiConnected || !gatewayReachable) {
      status = "wifi_disconnected";
      connected = false;
      message = "Wi-Fi Disconnected • Reconnect to registered JioFiber Wi-Fi to make calls";
    } else if (microsipRunning) {
      status = "online";
      connected = true;
      message = "JioFiber SIP Online (+91 4562 355214) • Ready to Call";
    } else {
      status = "connecting";
      connected = true; // Gateway reachable, telephony starting up
      message = "MicroSIP Telephony Connecting...";
    }

    return NextResponse.json({
      connected,
      status,
      message,
      gatewayReachable,
      gatewayIp: gatewayIp || (gatewayReachable ? "192.168.29.1" : ""),
      hasJioSubnet: hasPrivateIp,
      localIp,
      wifiSSID: wifiSSID || (connected ? "JioFiber Wi-Fi" : "Disconnected"),
      wifiState: isWifiConnected ? "connected" : wifiState,
      microsipRunning,
      account: "+914562355214@tn.wln.ims.jio.com",
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        status: "offline",
        message: error.message || "Telephony service check failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
