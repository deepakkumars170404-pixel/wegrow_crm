import { NextResponse } from "next/server";
import net from "net";
import os from "os";
import { exec } from "child_process";
import util from "util";
import fs from "fs";

const execPromise = util.promisify(exec);

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

export async function GET() {
  try {
    // 1. Check local network interfaces for JioFiber subnet (192.168.1.x)
    const interfaces = os.networkInterfaces();
    let hasJioSubnet = false;
    let localIp = "";

    for (const name of Object.keys(interfaces)) {
      for (const addr of interfaces[name] || []) {
        if (addr.family === "IPv4" && !addr.internal && addr.address.startsWith("192.168.1.")) {
          hasJioSubnet = true;
          localIp = addr.address;
          break;
        }
      }
      if (hasJioSubnet) break;
    }

    // 2. Check if JioFiber Gateway (192.168.1.1) is actually reachable
    let gatewayReachable = false;
    if (hasJioSubnet) {
      gatewayReachable = await checkPortReachable("192.168.1.1", 80, 800);
    }

    // 3. Check if MicroSIP is currently running
    let microsipRunning = false;
    try {
      const { stdout } = await execPromise('tasklist /FI "IMAGENAME eq microsip.exe" /NH');
      microsipRunning = stdout.toLowerCase().includes("microsip.exe");
    } catch {
      microsipRunning = false;
    }

    // 4. Retrieve current Wi-Fi SSID
    let wifiSSID = "";
    let wifiState = "disconnected";
    try {
      const { stdout: wlanOut } = await execPromise("netsh wlan show interfaces");
      const ssidMatch = wlanOut.match(/^\s*SSID\s*:\s*(.+)$/m);
      const stateMatch = wlanOut.match(/^\s*State\s*:\s*(.+)$/m);
      if (ssidMatch) wifiSSID = ssidMatch[1].trim();
      if (stateMatch) wifiState = stateMatch[1].trim();
    } catch {
      // Ignore netsh errors
    }

    // 5. If Wi-Fi is reachable but MicroSIP is not running, auto-launch it in background
    if (gatewayReachable && !microsipRunning) {
      const bridgeExe = "D:\\WEGROW\\MicroSIP\\MicroSIPBridge.exe";
      if (fs.existsSync(bridgeExe)) {
        exec(`"${bridgeExe}"`);
        microsipRunning = true; // Auto-started
      }
    }

    // 6. Formulate clear status
    let status: "online" | "wifi_disconnected" | "connecting" | "offline" = "offline";
    let message = "";
    let connected = false;

    if (!hasJioSubnet || !gatewayReachable || wifiState.toLowerCase() !== "connected") {
      status = "wifi_disconnected";
      connected = false;
      message = "Wi-Fi Disconnected • Reconnect to registered JioFiber Wi-Fi to make calls";
    } else if (microsipRunning) {
      status = "online";
      connected = true;
      message = "JioFiber SIP Online (+91 4562 355214) • Ready to Call";
    } else {
      status = "connecting";
      connected = false;
      message = "MicroSIP Telephony Connecting...";
    }

    return NextResponse.json({
      connected,
      status,
      message,
      gatewayReachable,
      hasJioSubnet,
      localIp,
      wifiSSID: wifiSSID || (connected ? "JioFiber Wi-Fi" : "Disconnected"),
      wifiState,
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
