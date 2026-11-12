import { exec, execFile } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export interface MobileDevice {
  connected: boolean;
  id?: string;
  model?: string;
  product?: string;
  error?: string;
}

export interface MobileCallStatus {
  connected: boolean;
  state: "idle" | "ringing" | "connected";
  activeDurationSeconds?: number;
  lastCallDurationSeconds?: number;
  lastCallNumber?: string;
  lastCallTimestamp?: number;
  lastCallStartTime?: string;
  lastCallEndTime?: string;
  device?: string;
  model?: string;
  error?: string;
}

// Memory tracker for active call duration
let callActiveStartTime: number | null = null;
let callOffhookStartTime: number | null = null;
let previousCallState: "idle" | "ringing" | "connected" = "idle";
let cachedLastDuration: number = 0;
let cachedLastNumber: string = "";
let cachedLastTimestamp: number = 0;
let lastLogQueryTime: number = 0;

let cachedDevice: MobileDevice | null = null;
let cachedDeviceTimestamp: number = 0;

// In-flight locking and status cache to prevent out-of-order responses over Wi-Fi ADB
let isQueryingStatus = false;
let lastKnownStatus: MobileCallStatus = {
  connected: true,
  state: "idle",
  activeDurationSeconds: 0,
  lastCallDurationSeconds: 0,
};

let lastKnownIpPort = "192.168.29.66:42863";

export const MobileBridge = {
  // STRICT PERMANENT SAFETY GUARD: NEVER CALL 9952337331
  isBlockedNumber(phone: string): boolean {
    const rawDigits = String(phone || "").replace(/\D/g, "");
    return rawDigits.includes("9952337331");
  },

  formatIndianPhoneNumber(rawPhone: string): string {
    const clean = String(rawPhone || "").replace(/\D/g, "");
    if (clean.length === 10) return clean;
    if (clean.length === 12 && clean.startsWith("91")) return clean.substring(2);
    if (clean.length === 11 && clean.startsWith("0")) return clean.substring(1);
    if (clean.length > 10) return clean.slice(-10);
    return clean;
  },

  async getConnectedDevice(): Promise<MobileDevice> {
    if (cachedDevice && Date.now() - cachedDeviceTimestamp < 4000) {
      return cachedDevice;
    }

    try {
      const { stdout } = await execAsync("adb devices -l");
      const lines = stdout.split(/\r?\n/);
      let devices: { id: string; model?: string; product?: string; isIp: boolean }[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("List of devices")) continue;
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2 && parts[1] === "device") {
          const id = parts[0];
          const modelMatch = trimmed.match(/model:(\S+)/);
          const productMatch = trimmed.match(/product:(\S+)/);
          devices.push({
            id,
            model: modelMatch ? modelMatch[1] : undefined,
            product: productMatch ? productMatch[1] : undefined,
            isIp: id.includes(":") && !id.includes("adb-tls"),
          });
        }
      }

      // Auto-heal reconnect if disconnected over Wi-Fi
      if (devices.length === 0) {
        try {
          const { stdout: mdnsOut } = await execAsync("adb mdns services").catch(() => ({ stdout: "" }));
          const mdnsMatches = mdnsOut.match(/(\d+\.\d+\.\d+\.\d+:\d+)/g);
          const candidates: string[] = mdnsMatches ? Array.from(new Set(mdnsMatches)) : [];
          if (lastKnownIpPort && !candidates.includes(lastKnownIpPort)) {
            candidates.push(lastKnownIpPort);
          }

          for (const addr of candidates) {
            await execAsync(`adb connect ${addr}`).catch(() => {});
          }

          const { stdout: retryOut } = await execAsync("adb devices -l");
          const retryLines = retryOut.split(/\r?\n/);
          for (const line of retryLines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("List of devices")) continue;
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 2 && parts[1] === "device") {
              const id = parts[0];
              const modelMatch = trimmed.match(/model:(\S+)/);
              const productMatch = trimmed.match(/product:(\S+)/);
              devices.push({
                id,
                model: modelMatch ? modelMatch[1] : undefined,
                product: productMatch ? productMatch[1] : undefined,
                isIp: id.includes(":") && !id.includes("adb-tls"),
              });
            }
          }
        } catch {}
      }

      if (devices.length === 0) {
        cachedDevice = null;
        return { connected: false, error: "No mobile device connected via ADB." };
      }

      // Prefer direct IP device or first available
      const chosen = devices.find((d) => d.isIp) || devices[0];
      if (chosen.id.includes(":")) {
        lastKnownIpPort = chosen.id;
        execAsync(`adb -s ${chosen.id} reverse tcp:3000 tcp:3000`).catch(() => {});
      }

      const result: MobileDevice = {
        connected: true,
        id: chosen.id,
        model: chosen.model || "Android Phone",
        product: chosen.product,
      };
      cachedDevice = result;
      cachedDeviceTimestamp = Date.now();
      return result;
    } catch (err: any) {
      cachedDevice = null;
      return { connected: false, error: err.message || "ADB command failed." };
    }
  },

  async dial(phoneNumber: string): Promise<{ success: boolean; dialedNumber?: string; device?: string; error?: string }> {
    if (!phoneNumber) {
      return { success: false, error: "Phone number is required." };
    }

    if (this.isBlockedNumber(phoneNumber)) {
      console.warn("[MobileBridge] Call to 9952337331 was strictly rejected.");
      return { success: false, error: "Calling 9952337331 is permanently blocked on Wegrow CRM." };
    }

    const clean = this.formatIndianPhoneNumber(phoneNumber);
    if (clean.length < 7) {
      return { success: false, error: "Phone number must have at least 7 to 10 digits." };
    }

    const dev = await this.getConnectedDevice();
    if (!dev.connected || !dev.id) {
      return {
        success: false,
        error: "Mobile phone is not connected via ADB. Please connect phone via Wi-Fi or USB.",
      };
    }

    try {
      callActiveStartTime = null;
      callOffhookStartTime = Date.now();
      previousCallState = "ringing";
      lastKnownStatus = {
        connected: true,
        state: "ringing",
        activeDurationSeconds: 0,
        lastCallDurationSeconds: cachedLastDuration,
        device: dev.id,
        model: dev.model,
      };

      // Wake up device screen and unlock/dismiss keyguard if sleeping
      await execAsync(`adb -s ${dev.id} shell input keyevent KEYCODE_WAKEUP`).catch(() => {});
      await execAsync(`adb -s ${dev.id} shell wm dismiss-keyguard`).catch(() => {});
      await execAsync(`adb -s ${dev.id} shell input swipe 540 2000 540 500 200`).catch(() => {});

      // Launch direct SIM call
      const cmd = `adb -s ${dev.id} shell am start -a android.intent.action.CALL -d "tel:${clean}"`;
      await execAsync(cmd);

      // Bring Wegrow Telecaller App to front on phone so caller sees live call screen
      setTimeout(() => {
        execAsync(`adb -s ${dev.id} shell am start -n com.wegrow.telecaller/.MainActivity`).catch(() => {});
      }, 500);

      return {
        success: true,
        dialedNumber: clean,
        device: `${dev.model || "Android Phone"} (${dev.id})`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to trigger call on mobile phone.",
      };
    }
  },

  async hangup(): Promise<{ success: boolean; error?: string }> {
    const dev = await this.getConnectedDevice();
    if (!dev.connected || !dev.id) {
      return { success: false, error: "Mobile phone is not connected." };
    }

    try {
      callActiveStartTime = null;
      callOffhookStartTime = null;
      lastKnownStatus.state = "idle";
      await execAsync(`adb -s ${dev.id} shell input keyevent KEYCODE_ENDCALL`).catch(() => {});
      // Bring Wegrow Telecaller App immediately to the front on the phone
      setTimeout(async () => {
        try {
          await execAsync(`adb -s ${dev.id} shell am start -n com.wegrow.telecaller/.MainActivity`);
        } catch {}
      }, 500);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to hangup call." };
    }
  },

  async getStatus(): Promise<MobileCallStatus> {
    if (isQueryingStatus) {
      return lastKnownStatus;
    }

    const dev = await this.getConnectedDevice();
    if (!dev.connected || !dev.id) {
      // If a call is currently active or ringing, PRESERVE call state!
      // A momentary Wi-Fi ADB disconnect must NEVER falsely report an active call as "idle"!
      if (lastKnownStatus.state === "connected" || lastKnownStatus.state === "ringing") {
        return {
          ...lastKnownStatus,
          connected: false,
          error: "Phone Wi-Fi momentarily disconnected (call remains active on mobile SIM)",
        };
      }
      lastKnownStatus = {
        connected: false,
        state: "idle",
        error: "Mobile phone not connected via ADB.",
      };
      return lastKnownStatus;
    }

    isQueryingStatus = true;
    try {
      // Query precise call state via grep with 3s timeout to prevent Wi-Fi hangs
      const { stdout: telOut } = await execAsync(
        `adb -s ${dev.id} shell "dumpsys telephony.registry | grep -E 'mCallState=|mForegroundCallState='"` ,
        { timeout: 3000 }
      ).catch(() => ({ stdout: "" }));

      if (!telOut) {
        // ADB command timed out or had a transient network glitch:
        // Do NOT declare the phone idle! Preserve the active in-call status!
        return lastKnownStatus;
      }

      const isOffhook = /mCallState=2\b/.test(telOut);
      const isIncomingRinging = /mCallState=1\b/.test(telOut);
      const isExplicitlyActive = /mForegroundCallState=1\b/.test(telOut);

      if (isOffhook) {
        lastKnownStatus = {
          connected: true,
          // Once connected, keep connected as long as phone is offhook (even if proximity sensor turns off screen)
          state: isExplicitlyActive || lastKnownStatus.state === "connected" ? "connected" : "ringing",
          activeDurationSeconds: 0,
          lastCallDurationSeconds: cachedLastDuration,
          device: dev.id,
          model: dev.model,
        };
      } else if (isIncomingRinging) {
        lastKnownStatus = {
          connected: true,
          state: "ringing",
          activeDurationSeconds: 0,
          lastCallDurationSeconds: cachedLastDuration,
          device: dev.id,
          model: dev.model,
        };
      } else {
        // If a call was initiated recently, check if phone modem has already hung up and logged it
        const timeSinceDial = callOffhookStartTime ? Date.now() - callOffhookStartTime : 999999;
        
        // Query Android call log if state is idle or changed, or at least every 1.5 seconds
        const now = Date.now();
        if (lastKnownStatus.state !== "idle" || !cachedLastTimestamp || now - lastLogQueryTime > 1500) {
          lastLogQueryTime = now;
          try {
            // Use execFileAsync to bypass Windows cmd.exe and invoke toybox sh inside Android
            const { stdout: logOut } = await execFileAsync(
              "adb",
              [
                "-s",
                dev.id,
                "shell",
                "content query --uri content://call_log/calls --projection duration:date:number --sort 'date DESC' | head -n 3",
              ],
              { timeout: 3500 }
            ).catch(() => ({ stdout: "" }));

            const lines = (logOut || "").split(/\r?\n/).filter((l) => l.includes("duration="));
            if (lines.length > 0) {
              const durMatch = lines[0].match(/duration=(\d+)/);
              const numMatch = lines[0].match(/number=([+\d]+)/);
              const dateMatch = lines[0].match(/date=(\d+)/);
              if (durMatch) cachedLastDuration = parseInt(durMatch[1], 10);
              if (numMatch) cachedLastNumber = numMatch[1];
              if (dateMatch) cachedLastTimestamp = parseInt(dateMatch[1], 10);
            }
          } catch {}
        }

        // If the call was initiated less than 8 seconds ago BUT the call log already has a completed record matching this call,
        // it means the call was short (e.g. 2-5s) and has already finished!
        const callLogMatchesRecentDial =
          cachedLastTimestamp && callOffhookStartTime && cachedLastTimestamp >= callOffhookStartTime - 3000;

        if (timeSinceDial < 8000 && !callLogMatchesRecentDial) {
          lastKnownStatus = {
            connected: true,
            state: "ringing",
            activeDurationSeconds: 0,
            lastCallDurationSeconds: cachedLastDuration,
            device: dev.id,
            model: dev.model,
          };
          return lastKnownStatus;
        }

        let formattedStartTime = "";
        let formattedEndTime = "";
        if (cachedLastTimestamp) {
          const s = new Date(cachedLastTimestamp);
          const e = new Date(cachedLastTimestamp + (cachedLastDuration || 0) * 1000);
          formattedStartTime = s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          formattedEndTime = e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        }

        lastKnownStatus = {
          connected: true,
          state: "idle",
          activeDurationSeconds: 0,
          lastCallDurationSeconds: cachedLastDuration,
          lastCallNumber: cachedLastNumber,
          lastCallTimestamp: cachedLastTimestamp,
          lastCallStartTime: formattedStartTime,
          lastCallEndTime: formattedEndTime,
          device: dev.id,
          model: dev.model,
        };
      }

      return lastKnownStatus;
    } catch {
      return lastKnownStatus;
    } finally {
      isQueryingStatus = false;
    }
  },
};
