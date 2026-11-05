import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const event = (searchParams.get("event") || "").toLowerCase();
    const phone = searchParams.get("phone") || "";

    const now = Date.now();

    if (event === "ringing" || event === "start" || event === "outgoing") {
      globalThis.__MICROSIP_ACTIVE_CALL__ = {
        state: "ringing",
        phone,
        updatedAt: now,
        connectedAt: null,
      };
    } else if (event === "connected" || event === "answer") {
      const prevConnected = globalThis.__MICROSIP_ACTIVE_CALL__?.connectedAt || now;
      globalThis.__MICROSIP_ACTIVE_CALL__ = {
        state: "connected",
        phone: phone || globalThis.__MICROSIP_ACTIVE_CALL__?.phone || "",
        updatedAt: now,
        connectedAt: prevConnected,
      };
    } else if (event === "ended" || event === "end" || event === "idle" || event === "busy") {
      globalThis.__MICROSIP_ACTIVE_CALL__ = {
        state: "idle",
        phone: phone || globalThis.__MICROSIP_ACTIVE_CALL__?.phone || "",
        updatedAt: now,
        connectedAt: null,
      };
    }

    return NextResponse.json({
      success: true,
      current: globalThis.__MICROSIP_ACTIVE_CALL__ || { state: "idle" },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

