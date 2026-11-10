import * as Linking from "expo-linking";
import { Alert, NativeModules, Platform } from "react-native";

const { WegrowTelephony } = NativeModules;

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

    // Try direct native SIM call first (places call directly without extra keypad)
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

  async openWhatsAppChat(phoneNumber: string, studentName?: string, course?: string): Promise<boolean> {
    if (this.isBlockedNumber(phoneNumber)) {
      Alert.alert("Blocked", "Messaging 9952337331 is blocked.");
      return false;
    }

    const clean10Digits = this.formatIndianPhoneNumber(phoneNumber);
    const greeting = studentName ? `Hi ${studentName}` : `Hi`;
    const courseText = course ? `regarding the ${course} program` : `regarding Wegrow courses`;
    const message = encodeURIComponent(
      `${greeting}! Greetings from Wegrow Skill Campus. I am contacting you ${courseText}. Please let us know a convenient time to discuss your career goals.`
    );

    const waUrl = `https://wa.me/91${clean10Digits}?text=${message}`;
    try {
      await Linking.openURL(waUrl);
      return true;
    } catch {
      Alert.alert("WhatsApp Error", "Unable to open WhatsApp on this device.");
      return false;
    }
  },
};
