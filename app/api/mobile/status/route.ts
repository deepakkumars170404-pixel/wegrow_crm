import { NextResponse } from "next/server";
import { MobileBridge } from "@/lib/mobileBridge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const status = await MobileBridge.getStatus();
    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { connected: false, error: err.message || "Failed to get mobile status" },
      { status: 500 }
    );
  }
}
