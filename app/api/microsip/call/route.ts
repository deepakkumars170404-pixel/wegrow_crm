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

function cleanAndFormatPhone(rawPhone: string): string {
  if (!rawPhone) return "";
  const cleanDigits = String(rawPhone).replace(/\D/g, "");
  if (!cleanDigits) return "";

  // For JioFiber Fixed-Line SIP (TRAI India standard: Prefix '0' for Fixed-to-Mobile calling)
  // 10 digits Indian mobile (e.g. 9843173678 -> 09843173678)
  if (cleanDigits.length === 10) {
    return `0${cleanDigits}`;
  }
  // 12 digits starting with 91 (e.g. 919843173678 -> 09843173678)
  if (cleanDigits.length === 12 && cleanDigits.startsWith("91")) {
    return `0${cleanDigits.substring(2)}`;
  }
  // 11 digits starting with 0 (already formatted: 09843173678)
  if (cleanDigits.length === 11 && cleanDigits.startsWith("0")) {
    return cleanDigits;
  }
  // Direct dial fallback
  return cleanDigits;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = body.phone;

    if (!rawPhone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const rawDigits = String(rawPhone).replace(/\D/g, "");

    // STRICT SAFETY GUARD: PERMANENTLY BLOCK 9952337331 (NEVER CALL)
    if (rawDigits.includes("9952337331")) {
      console.warn("[SAFETY BLOCK] Call to 9952337331 was rejected.");
      return NextResponse.json(
        { error: "Calling 9952337331 is strictly and permanently blocked." },
        { status: 403 }
      );
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

    // Clear any dangling audio session in MicroSIP before immediate dialing (0ms delay)
    try {
      spawn(exeToRun, ["/hangupall"], { detached: true, stdio: "ignore", cwd: "D:\\WEGROW\\MicroSIP" }).unref();
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
