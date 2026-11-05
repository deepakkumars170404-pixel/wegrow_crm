import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";

declare global {
  // eslint-disable-next-line no-var
  var __MICROSIP_ACTIVE_CALL__:
    | {
        state: "idle" | "ringing" | "connected";
        phone: string;
        updatedAt: number;
        connectedAt: number | null;
      }
    | undefined;
}

export async function POST() {
  try {
    const microsipExePath = "D:\\WEGROW\\MicroSIP\\microsip.exe";
    const bridgeExePath = "D:\\WEGROW\\MicroSIP\\MicroSIPBridge.exe";

    // Set memory state to idle immediately
    globalThis.__MICROSIP_ACTIVE_CALL__ = {
      state: "idle",
      phone: "",
      updatedAt: Date.now(),
      connectedAt: null,
    };

    // 1. Send direct /hangupall to terminate connected calls immediately
    if (fs.existsSync(microsipExePath)) {
      try {
        const c1 = spawn(microsipExePath, ["/hangupall"], {
          detached: true,
          stdio: "ignore",
          cwd: "D:\\WEGROW\\MicroSIP",
        });
        c1.unref();
      } catch {}

      // 2. Send direct /hangupcalling to immediately terminate early media / IVR / ringing
      try {
        const c2 = spawn(microsipExePath, ["/hangupcalling"], {
          detached: true,
          stdio: "ignore",
          cwd: "D:\\WEGROW\\MicroSIP",
        });
        c2.unref();
      } catch {}
    }

    // 3. Also trigger via Bridge for window hygiene
    if (fs.existsSync(bridgeExePath)) {
      try {
        const c3 = spawn(bridgeExePath, ["/hangup"], {
          detached: true,
          stdio: "ignore",
          cwd: "D:\\WEGROW\\MicroSIP",
        });
        c3.unref();
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "MicroSIP call cut and terminated instantly",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
