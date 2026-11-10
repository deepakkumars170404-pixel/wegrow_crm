import { NextResponse } from "next/server";
import fs from "fs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneParam = searchParams.get("phone") || "";
    const cleanDigits = phoneParam.replace(/\D/g, "");
    const targetDigits = cleanDigits.length >= 7 ? cleanDigits.slice(-10) : "";

    const logPath = "D:\\WEGROW\\MicroSIP\\microsip_log.txt";

    // If hangup was explicitly triggered by user in CRM, return idle immediately
    if (globalThis.__MICROSIP_ACTIVE_CALL__ && globalThis.__MICROSIP_ACTIVE_CALL__.state === "idle") {
      return NextResponse.json(
        { state: "idle", active: false, lastOutcome: "Call Cut / Hung Up" },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    if (!fs.existsSync(logPath)) {
      return NextResponse.json(
        { state: "idle", active: false, lastOutcome: "Softphone Idle" },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    // Read up to 1MB from the end of the log
    const stat = fs.statSync(logPath);
    const readSize = Math.min(stat.size, 1024 * 1024);
    const buffer = Buffer.alloc(readSize);
    const fd = fs.openSync(logPath, "r");
    fs.readSync(fd, buffer, 0, readSize, stat.size - readSize);
    fs.closeSync(fd);

    const logText = buffer.toString("utf8");
    const lines = logText.split("\n");

    let state: "idle" | "ringing" | "connected" = "idle";
    let lastOutcome = "Call Ended / Disconnected";
    let foundEvent = false;

    // REVERSE SCAN: Scan from the newest log line backwards to find the CURRENT active SIP state.
    // In SIP, the latest transaction event strictly defines what MicroSIP is doing right now!
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];

      // True SIP Disconnect / Terminal events (The call dialog has been cut, declined, or ended)
      if (
        line.includes("[DISCONNECTED]") ||
        line.includes("to DISCONNECTED") ||
        line.includes("Hangup all calls") ||
        line.includes("Shutting down") ||
        line.includes("Request msg BYE") ||
        line.includes("Response msg 200/BYE") ||
        line.includes("Incoming Request msg BYE") ||
        line.includes("Response msg 480") ||
        line.includes("480 Temporarily Unavailable") ||
        line.includes("Response msg 486") ||
        line.includes("486 Busy") ||
        line.includes("Response msg 603") ||
        line.includes("603 Decline") ||
        line.includes("Response msg 487") ||
        line.includes("487 Request Terminated") ||
        line.includes("Sending Request msg CANCEL") ||
        line.includes("Response msg 403") ||
        line.includes("403 Forbidden") ||
        line.includes("Response msg 404") ||
        line.includes("404 Not Found") ||
        line.includes("Response msg 503") ||
        line.includes("503 Service Unavailable") ||
        line.includes("Failed to send Request msg INVITE")
      ) {
        state = "idle";
        if (line.includes("480") || line.includes("Temporarily Unavailable")) {
          lastOutcome = "Call Cut / Not Answered (480)";
        } else if (line.includes("486") || line.includes("Busy")) {
          lastOutcome = "Line Busy (486)";
        } else if (line.includes("603") || line.includes("Decline")) {
          lastOutcome = "Call Declined by Recipient (603)";
        } else if (line.includes("487") || line.includes("CANCEL")) {
          lastOutcome = "Call Cut / Canceled";
        } else if (line.includes("403") || line.includes("Forbidden")) {
          lastOutcome = "Call Forbidden (403)";
        } else if (line.includes("404") || line.includes("Not Found")) {
          lastOutcome = "Number Not Found (404)";
        } else if (line.includes("Failed to send Request msg INVITE")) {
          lastOutcome = "Network Timeout (Please retry)";
        } else {
          lastOutcome = "Call Ended";
        }
        foundEvent = true;
        break; // Most recent event is termination! Stop scanning.
      }

      // Active Connected events
      if (
        line.includes("to CONFIRMED") ||
        line.includes("to CONNECTING") ||
        line.includes("Response msg 200/INVITE") ||
        (line.includes("SIP/2.0 200 OK") && lines.slice(Math.max(0, i - 4), i + 1).some((l) => l.includes("INVITE")))
      ) {
        state = "connected";
        lastOutcome = "Call Answered & Live";
        foundEvent = true;
        break; // Most recent event is active call! Stop scanning.
      }

      // Ringing events
      if (
        line.includes("180 Ringing") ||
        line.includes("183 Session Progress") ||
        line.includes("State changed from CALLING to EARLY") ||
        line.includes("Making call with acc")
      ) {
        state = "ringing";
        lastOutcome = "Ringing Remote Party...";
        foundEvent = true;
        break; // Most recent event is ringing! Stop scanning.
      }
    }

    if (!foundEvent) {
      state = "idle";
      lastOutcome = "Softphone Idle";
    }

    return NextResponse.json(
      {
        state,
        active: state !== "idle",
        lastOutcome,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { state: "idle", error: error.message },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}
