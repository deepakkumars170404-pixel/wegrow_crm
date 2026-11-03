import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execPromise(
      'tasklist /FI "IMAGENAME eq microsip.exe" /NH'
    );
    const isRunning = stdout.toLowerCase().includes("microsip.exe");

    return NextResponse.json({
      installed: true,
      path: "D:\\WEGROW\\MicroSIP\\microsip.exe",
      running: isRunning,
      network: "JioFiber SIP",
    });
  } catch (error: any) {
    return NextResponse.json({
      installed: false,
      running: false,
      error: error.message,
    });
  }
}

