import { NextResponse } from "next/server";
import net from "net";
import os from "os";
import dns from "dns";
import { exec } from "child_process";
import util from "util";
import fs from "fs";

const execPromise = util.promisify(exec);

// Test TCP port reachability with a short timeout
function checkPortReachable(host: string, port: number, timeoutMs = 600): Promise<boolean> {
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

// In-memory status cache to avoid constant heavy Windows process spawning (netsh, tasklist)
let cachedStatus: any = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 6000; // 6 seconds cache

// Dynamically discover JioFiber router gateway IP
async function discoverJioGateway(): Promise<{ reachable: boolean; gatewayIp: string }> {
  // 1. Try resolving jiofiber.local.html (works dynamically on all JioFiber firmware)
  try {
    const resolvedIps = await dns.promises.resolve4("jiofiber.local.html");
    if (resolvedIps && resolvedIps.length > 0) {
      const candidateIp = resolvedIps[0];
      const isReachable = await checkPortReachable(candidateIp, 80, 600);
      if (isReachable) {
        return { reachable: true, gatewayIp: candidateIp };
      }
    }
  } catch {}

  // 2. Parallel fallback check on standard JioFiber gateway IPs (192.168.29.1 and 192.168.1.1)
  const candidateIps = ["192.168.29.1", "192.168.1.1"];
  const checks = await Promise.all(
    candidateIps.map(async (ip) => ({
      ip,
      reachable: await checkPortReachable(ip, 80, 600),
    }))
  );

  const active = checks.find((c) => c.reachable);
  if (active) {
    return { reachable: true, gatewayIp: active.ip };
  }

  return { reachable: false, gatewayIp: "" };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const reconnect = searchParams.get("reconnect") === "true";
    const now = Date.now();

    // Serve cached response if valid and not a forced request (guarantees <5ms lightning fast response)
    if (!force && !reconnect && cachedStatus && now - lastCheckTime < CACHE_TTL_MS) {
      return NextResponse.json(cachedStatus);
    }

    // 1. If reconnect requested, proactively start/ensure MicroSIP is running
    const bridgeExe = "D:\\WEGROW\\MicroSIP\\MicroSIPBridge.exe";
    if (reconnect && fs.existsSync(bridgeExe)) {
      try {
        exec(`"${bridgeExe}" /start`);
      } catch {}
    }

    // 2. Dynamically check JioFiber Gateway reachability
    const { reachable: gatewayReachable, gatewayIp } = await discoverJioGateway();

    // 3. Inspect active local network interfaces
    const interfaces = os.networkInterfaces();
    let localIp = "";
    let hasPrivateIp = false;

    for (const name of Object.keys(interfaces)) {
      for (const addr of interfaces[name] || []) {
        if (addr.family === "IPv4" && !addr.internal) {
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

    // 4. Retrieve current Wi-Fi SSID & State
    let wifiSSID = "WegrowskillCampus";
    let wifiState = "connected";
    try {
      const { stdout: wlanOut } = await execPromise("netsh wlan show interfaces");
      const ssidMatch = wlanOut.match(/^\s*SSID\s*:\s*(.+)$/m);
      const stateMatch = wlanOut.match(/^\s*State\s*:\s*(.+)$/m);
      if (ssidMatch) wifiSSID = ssidMatch[1].trim();
      if (stateMatch) wifiState = stateMatch[1].trim();
    } catch {}

    // 5. Check if MicroSIP is currently running
    let microsipRunning = false;
    try {
      const { stdout } = await execPromise('tasklist /FI "IMAGENAME eq microsip.exe" /NH');
      microsipRunning = stdout.toLowerCase().includes("microsip.exe");
    } catch {
      microsipRunning = false;
    }

    // Auto-launch if gateway reachable but MicroSIP stopped
    if (gatewayReachable && !microsipRunning && fs.existsSync(bridgeExe)) {
      try {
        exec(`"${bridgeExe}" /start`);
        microsipRunning = true;
      } catch {}
    }

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
      connected = true;
      message = "MicroSIP Telephony Connecting...";
    }

    cachedStatus = {
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
    };
    lastCheckTime = now;

    return NextResponse.json(cachedStatus);
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
