import { NextResponse } from "next/server";
import { MobileBridge } from "@/lib/mobileBridge";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = body.phone || body.phoneNumber;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const result = await MobileBridge.dial(phone);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      dialedNumber: result.dialedNumber,
      device: result.device,
      message: `Triggered SIM call to ${result.dialedNumber} on ${result.device}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to initiate mobile SIM call" },
      { status: 500 }
    );
  }
}
