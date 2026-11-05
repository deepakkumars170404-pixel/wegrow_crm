import { NextResponse } from "next/server";
import { spawn, execSync } from "child_process";
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

function cleanAndFormatPhone(rawPhone: string): string {
  if (!rawPhone) return "";
  const cleanDigits = String(rawPhone).replace(/\D/g, "");
  if (!cleanDigits) return "";

  // 10 digits Indian mobile (e.g. 9843173678 -> +919843173678)
  if (cleanDigits.length === 10) {
    return `+91${cleanDigits}`;
  }
  // 12 digits starting with 91 (e.g. 919843173678 -> +919843173678)
  if (cleanDigits.length === 12 && cleanDigits.startsWith("91")) {
    return `+${cleanDigits}`;
  }
  // 11 digits starting with 0 (e.g. 09843173678 -> +919843173678, 04562355214 -> +914562355214)
  if (cleanDigits.length === 11 && cleanDigits.startsWith("0")) {
    return `+91${cleanDigits.substring(1)}`;
  }
  // Any international or other format with leading +
  if (String(rawPhone).trim().startsWith("+")) {
    return `+${cleanDigits}`;
  }
  // Default Indian prefix
  return `+91${cleanDigits}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = body.phone;

    if (!rawPhone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const formattedPhone = cleanAndFormatPhone(rawPhone);
    if (!formattedPhone || formattedPhone.replace(/\D/g, "").length < 7) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    const bridgeExePath = "D:\\WEGROW\\MicroSIP\\MicroSIPBridge.exe";
    const microsipExePath = "D:\\WEGROW\\MicroSIP\\microsip.exe";
    const exeToRun = fs.existsSync(bridgeExePath) ? bridgeExePath : microsipExePath;

    if (!fs.existsSync(exeToRun)) {
      return NextResponse.json(
        { error: `MicroSIP executable not found in D:\\WEGROW\\MicroSIP` },
        { status: 500 }
      );
    }

    // Ensure MicroSIP is running; if not, launch via bridge /start
    try {
      const tasklist = execSync('tasklist /FI "IMAGENAME eq microsip.exe" /NH', { encoding: "utf8" });
      if (!tasklist.toLowerCase().includes("microsip.exe") && fs.existsSync(bridgeExePath)) {
        execSync(`"${bridgeExePath}" /start`);
      }
    } catch {}

    // Pre-seed in-memory active call state
    globalThis.__MICROSIP_ACTIVE_CALL__ = {
      state: "ringing",
      phone: formattedPhone,
      updatedAt: Date.now(),
      connectedAt: null,
    };

    // Instant execution passing the exact, clean formatted phone number
    const child = spawn(exeToRun, [formattedPhone], {
      detached: true,
      stdio: "ignore",
      cwd: "D:\\WEGROW\\MicroSIP",
    });
    child.unref();

    return NextResponse.json({
      success: true,
      dialedNumber: formattedPhone,
      message: `MicroSIP dialing ${formattedPhone} instantly via JioFiber`,
    });
  } catch (error: any) {
    console.error("[MicroSIP Call API Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate call via MicroSIP" },
      { status: 500 }
    );
  }
}
