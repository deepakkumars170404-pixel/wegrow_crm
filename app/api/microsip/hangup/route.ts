import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";

export async function POST() {
  try {
    const bridgeExePath = "D:\\WEGROW\\MicroSIP\\MicroSIPBridge.exe";
    const microsipExePath = "D:\\WEGROW\\MicroSIP\\microsip.exe";
    const jfcExePath = "D:\\WEGROW\\MicroSIP\\JFC-MicroSIP.exe";
    const exeToRun = fs.existsSync(bridgeExePath)
      ? bridgeExePath
      : (fs.existsSync(microsipExePath) ? microsipExePath : jfcExePath);

    if (fs.existsSync(exeToRun)) {
      // Command MicroSIP to hang up active call in background
      const child = spawn(exeToRun, ["/hangupall"], {
        detached: true,
        stdio: "ignore",
        cwd: "D:\\WEGROW\\MicroSIP",
        windowsHide: true,
      });
      child.unref();
    }

    return NextResponse.json({ success: true, message: "MicroSIP hangup triggered" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

