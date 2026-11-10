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
        { state: "idle", active: false, lastOutcome: "Call Ended" },
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
        { state: "idle", active: false, lastOutcome: "Softphone Ready" },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    // Read up to 512KB from the end of the log
    const stat = fs.statSync(logPath);
    const readSize = Math.min(stat.size, 512 * 1024);
    const buffer = Buffer.alloc(readSize);
    const fd = fs.openSync(logPath, "r");
    fs.readSync(fd, buffer, 0, readSize, stat.size - readSize);
    fs.closeSync(fd);

    const logText = buffer.toString("utf8");
    const lines = logText.split("\n");

    // 1. If targetDigits is provided, track strictly THIS call session
    if (targetDigits) {
      let callStartIndex = -1;

      // Scan backwards to find where the call to targetDigits was initiated
      for (let i = lines.length - 1; i >= 0; i--) {
        const l = lines[i];
        if (
          (l.includes("Making call with acc") || l.includes("INVITE sip:") || l.includes("Request msg INVITE")) &&
          l.includes(targetDigits)
        ) {
          callStartIndex = i;
          break;
        }
      }

      // If MicroSIP hasn't yet written the new call to the log file (during initial 0-800ms):
      if (callStartIndex === -1) {
        const isCurrentCall = Boolean(
          globalThis.__MICROSIP_ACTIVE_CALL__ &&
          globalThis.__MICROSIP_ACTIVE_CALL__.phone &&
          globalThis.__MICROSIP_ACTIVE_CALL__.phone.includes(targetDigits)
        );

        if (isCurrentCall && globalThis.__MICROSIP_ACTIVE_CALL__?.state !== "idle") {
          return NextResponse.json(
            {
              state: "ringing",
              active: true,
              lastOutcome: "Ringing Student's Phone...",
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
        }
      } else {
        // Call for targetDigits was found! Scan lines strictly from callStartIndex to the end of log
        let isConnected = false;
        let isDisconnected = false;
        let disconnectOutcome = "Call Ended";

        for (let j = callStartIndex; j < lines.length; j++) {
          const l = lines[j];

          // Call answered & active
          if (
            l.includes("to CONFIRMED") ||
            l.includes("to CONNECTING") ||
            l.includes("Response msg 200/INVITE")
          ) {
            isConnected = true;
          }

          // Call terminated after initiation
          if (
            l.includes("[DISCONNECTED]") ||
            l.includes("to DISCONNECTED") ||
            l.includes("Request msg BYE") ||
            l.includes("Response msg 200/BYE") ||
            l.includes("Response msg 480") ||
            l.includes("480 Temporarily Unavailable") ||
            l.includes("Response msg 486") ||
            l.includes("486 Busy") ||
            l.includes("Response msg 603") ||
            l.includes("603 Decline") ||
            l.includes("Response msg 487") ||
            l.includes("487 Request Terminated") ||
            l.includes("Response msg 403") ||
            l.includes("403 Forbidden") ||
            l.includes("Response msg 404") ||
            l.includes("404 Not Found") ||
            l.includes("Failed to send Request msg INVITE")
          ) {
            isDisconnected = true;
            if (l.includes("480") || l.includes("Temporarily Unavailable")) {
              disconnectOutcome = "Call Cut / Not Answered (480)";
            } else if (l.includes("486") || l.includes("Busy")) {
              disconnectOutcome = "Line Busy (486)";
            } else if (l.includes("603") || l.includes("Decline")) {
              disconnectOutcome = "Call Declined by Recipient (603)";
            } else if (l.includes("487") || l.includes("CANCEL")) {
              disconnectOutcome = "Call Cut / Canceled";
            } else if (l.includes("403") || l.includes("Forbidden")) {
              disconnectOutcome = "Call Forbidden (403)";
            } else if (l.includes("404") || l.includes("Not Found")) {
              disconnectOutcome = "Number Not Found (404)";
            } else {
              disconnectOutcome = "Call Ended";
            }
          }
        }

        if (isDisconnected) {
          return NextResponse.json(
            {
              state: "idle",
              active: false,
              lastOutcome: disconnectOutcome,
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
        }

        if (isConnected) {
          return NextResponse.json(
            {
              state: "connected",
              active: true,
              lastOutcome: "Call Answered & Live",
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
        }

        // Still ringing
        return NextResponse.json(
          {
            state: "ringing",
            active: true,
            lastOutcome: "Ringing Student's Phone...",
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
      }
    }

    // Fallback if no phone specified
    let state: "idle" | "ringing" | "connected" = "idle";
    let lastOutcome = "Softphone Ready";

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];

      if (
        line.includes("[DISCONNECTED]") ||
        line.includes("to DISCONNECTED") ||
        line.includes("Request msg BYE") ||
        line.includes("Response msg 200/BYE") ||
        line.includes("Response msg 480") ||
        line.includes("Response msg 486") ||
        line.includes("Response msg 603") ||
        line.includes("Response msg 487")
      ) {
        state = "idle";
        lastOutcome = "Call Ended";
        break;
      }

      if (
        line.includes("to CONFIRMED") ||
        line.includes("to CONNECTING") ||
        line.includes("Response msg 200/INVITE")
      ) {
        state = "connected";
        lastOutcome = "Call Answered & Live";
        break;
      }

      if (line.includes("180 Ringing") || line.includes("Making call with acc")) {
        state = "ringing";
        lastOutcome = "Ringing Student's Phone...";
        break;
      }
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
