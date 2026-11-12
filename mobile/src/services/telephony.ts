import * as Linking from "expo-linking";
import { Alert, NativeEventEmitter, NativeModules, Platform } from "react-native";

const { WegrowTelephony } = NativeModules;
const telephonyEmitter = WegrowTelephony ? new NativeEventEmitter(WegrowTelephony) : null;

export interface NativeCallStateEvent {
  state: "DIALING" | "RINGING" | "CONNECTING" | "ACTIVE" | "DISCONNECTED" | "HOLDING" | "UNKNOWN";
  rawState?: number;
  phoneNumber?: string;
  contactName?: string;
  isIncoming?: boolean;
  durationSeconds?: number;
  activeTimeMs?: number;
  isAttended?: boolean;
  isSpeaker?: boolean;
  isMuted?: boolean;
}

export const TelephonyService = {
  // STRICT PERMANENT SAFETY GUARD
  isBlockedNumber(phone: string): boolean {
    const rawDigits = String(phone || "").replace(/\D/g, "");
    return rawDigits.includes("9952337331");
  },

  formatIndianPhoneNumber(rawPhone: string): string {
    const clean = String(rawPhone || "").replace(/\D/g, "");
    if (clean.length === 10) return clean;
    if (clean.length === 12 && clean.startsWith("91")) return clean.substring(2);
    if (clean.length === 11 && clean.startsWith("0")) return clean.substring(1);
    return clean;
  },

  onCallStateChanged(callback: (event: NativeCallStateEvent) => void) {
    if (!telephonyEmitter) return { remove: () => {} };
    return telephonyEmitter.addListener("onCallStateChanged", callback);
  },

  async getCurrentCallState(): Promise<NativeCallStateEvent | null> {
    if (Platform.OS === "android" && WegrowTelephony?.getCurrentCallState) {
      try {
        return await WegrowTelephony.getCurrentCallState();
      } catch {
        return null;
      }
    }
    return null;
  },

  async dialViaSIM(phoneNumber: string, studentName?: string): Promise<{ success: boolean; error?: string }> {
    if (!phoneNumber) {
      Alert.alert("Invalid Number", "Please provide a valid phone number.");
      return { success: false, error: "Empty phone number" };
    }

    // STRICT SAFETY CHECK
    if (this.isBlockedNumber(phoneNumber)) {
      Alert.alert(
        "Call Blocked",
        "Calling 9952337331 is strictly and permanently blocked on Wegrow CRM."
      );
      return { success: false, error: "Number strictly blocked" };
    }

    const clean10Digits = this.formatIndianPhoneNumber(phoneNumber);
    if (clean10Digits.length < 7) {
      Alert.alert("Invalid Number", "Phone number must have at least 7 to 10 digits.");
      return { success: false, error: "Number too short" };
    }

    // Direct native SIM call
    if (Platform.OS === "android" && WegrowTelephony?.directCall) {
      try {
        await WegrowTelephony.directCall(clean10Digits);
        return { success: true };
      } catch (e: any) {
        console.warn("WegrowTelephony directCall fallback:", e);
      }
    }

    // Fallback to standard Linking intent
    try {
      const telUrl = `tel:${clean10Digits}`;
      await Linking.openURL(telUrl);
      return { success: true };
    } catch (err: any) {
      Alert.alert("Dialing Error", err.message || "Failed to launch phone dialer");
      return { success: false, error: err.message };
    }
  },

  async answerCall(): Promise<boolean> {
    if (Platform.OS === "android" && WegrowTelephony?.answerCall) {
      try {
        return await WegrowTelephony.answerCall();
      } catch (err) {
        console.warn("WegrowTelephony answerCall error:", err);
      }
    }
    return false;
  },

  async endCall(): Promise<boolean> {
    if (Platform.OS === "android" && WegrowTelephony?.endCall) {
      try {
        return await WegrowTelephony.endCall();
      } catch (err) {
        console.warn("WegrowTelephony endCall error:", err);
      }
    }
    return false;
  },

  async setSpeaker(enabled: boolean): Promise<boolean> {
    if (Platform.OS === "android" && WegrowTelephony?.setSpeaker) {
      try {
        return await WegrowTelephony.setSpeaker(enabled);
      } catch (err) {
        console.warn("WegrowTelephony setSpeaker error:", err);
      }
    }
    return false;
  },

  async setMute(enabled: boolean): Promise<boolean> {
    if (Platform.OS === "android" && WegrowTelephony?.setMute) {
      try {
        return await WegrowTelephony.setMute(enabled);
      } catch (err) {
        console.warn("WegrowTelephony setMute error:", err);
      }
    }
    return false;
  },

  async sendDtmf(digit: string): Promise<boolean> {
    if (Platform.OS === "android" && WegrowTelephony?.sendDtmf) {
      try {
        return await WegrowTelephony.sendDtmf(digit);
      } catch (err) {
        console.warn("WegrowTelephony sendDtmf error:", err);
      }
    }
    return false;
  },

  async holdCall(): Promise<boolean> {
    if (Platform.OS === "android" && WegrowTelephony?.holdCall) {
      try {
        return await WegrowTelephony.holdCall();
      } catch (err) {
        console.warn("WegrowTelephony holdCall error:", err);
      }
    }
    return false;
  },

  async unholdCall(): Promise<boolean> {
    if (Platform.OS === "android" && WegrowTelephony?.unholdCall) {
      try {
        return await WegrowTelephony.unholdCall();
      } catch (err) {
        console.warn("WegrowTelephony unholdCall error:", err);
      }
    }
    return false;
  },

  async mergeCalls(): Promise<boolean> {
    if (Platform.OS === "android" && WegrowTelephony?.mergeCalls) {
      try {
        return await WegrowTelephony.mergeCalls();
      } catch (err) {
        console.warn("WegrowTelephony mergeCalls error:", err);
      }
    }
    return false;
  },

  async getContactName(phoneNumber: string): Promise<string> {
    if (Platform.OS === "android" && WegrowTelephony?.getContactName) {
      try {
        return await WegrowTelephony.getContactName(phoneNumber);
      } catch {
        return "";
      }
    }
    return "";
  },

  async checkIsDefaultDialer(): Promise<boolean> {
    if (Platform.OS === "android" && WegrowTelephony?.isDefaultDialer) {
      try {
        return await WegrowTelephony.isDefaultDialer();
      } catch {
        return false;
      }
    }
    return false;
  },

  async promptSetAsDefaultDialer(): Promise<boolean> {
    if (Platform.OS === "android" && WegrowTelephony?.requestDefaultDialer) {
      try {
        await WegrowTelephony.requestDefaultDialer();
        return true;
      } catch (err: any) {
        Alert.alert("Default Dialer", "Please select Wegrow Telecaller in Settings -> Default Apps -> Phone app.");
        return false;
      }
    }
    return false;
  },

  openWhatsAppChat(phone: string, studentName?: string, courseName?: string) {
    const cleanDigits = phone.replace(/\D/g, "");
    const formatted = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const namePart = studentName ? `Hello ${studentName}! ` : "Vanakkam! ";
    const coursePart = courseName ? ` regarding the ${courseName} program.` : ".";
    const msg = encodeURIComponent(
      `${namePart}This is WeGrow Skill Campus${coursePart} How can we help you regarding career training and admissions?`
    );
    Linking.openURL(`https://wa.me/${formatted}?text=${msg}`).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed on this device.");
    });
  },
};
