import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = body.phone;

    if (!rawPhone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Format phone number specifically for JioFiber SIP (+91 or leading 0 required)
    const digits = String(rawPhone).replace(/\D/g, "");
    let formattedPhone = "";

    if (digits.length === 10) {
      formattedPhone = `+91${digits}`;
    } else if (digits.length === 12 && digits.startsWith("91")) {
      formattedPhone = `+${digits}`;
    } else if (digits.length === 11 && digits.startsWith("0")) {
      formattedPhone = `+91${digits.substring(1)}`;
    } else {
      formattedPhone = rawPhone.trim().startsWith("+") ? rawPhone.trim() : `+91${digits}`;
    }

    // Path to MicroSIP in D:\WEGROW\MicroSIP
    const bridgeExePath = "D:\\WEGROW\\MicroSIP\\MicroSIPBridge.exe";
    const microsipExePath = "D:\\WEGROW\\MicroSIP\\microsip.exe";
    const jfcExePath = "D:\\WEGROW\\MicroSIP\\JFC-MicroSIP.exe";
    const exeToRun = fs.existsSync(bridgeExePath)
      ? bridgeExePath
      : (fs.existsSync(microsipExePath) ? microsipExePath : jfcExePath);

    if (!fs.existsSync(exeToRun)) {
      return NextResponse.json(
        { error: `MicroSIP executable not found in D:\\WEGROW\\MicroSIP` },
        { status: 500 }
      );
    }

    // Execute MicroSIP Bridge to dial strictly in background with zero window display
    const child = spawn(exeToRun, [formattedPhone], {
      detached: true,
      stdio: "ignore",
      cwd: "D:\\WEGROW\\MicroSIP",
      windowsHide: true,
    });
    child.unref();

    return NextResponse.json({
      success: true,
      dialedNumber: formattedPhone,
      message: `MicroSIP dialing ${formattedPhone} via JioFiber`,
    });
  } catch (error: any) {
    console.error("[MicroSIP Call API Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate call via MicroSIP" },
      { status: 500 }
    );
  }
}

