import { NextResponse } from "next/server";
import { MobileBridge } from "@/lib/mobileBridge";

export async function POST() {
  try {
    const result = await MobileBridge.hangup();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Call hung up on mobile device." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to hang up call on mobile" },
      { status: 500 }
    );
  }
}
