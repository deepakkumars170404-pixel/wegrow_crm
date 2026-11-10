# 📱 Wegrow Telecaller Android App

Dedicated telecalling mobile companion application for **Wegrow Skill Campus CRM**.

Designed for telecallers, academic counsellors, and admissions officers to dial prospective students directly through their **Android SIM Card (Unlimited Calling Plans)**, automatically sync call duration, and log post-call dispositions directly into the Wegrow CRM.

---

## 🚀 Key Features

1. **⚡ 1-Tap SIM Card Dialing**:
   - Dials student numbers instantly using your mobile SIM card (SIM 1 / SIM 2).
   - Zero VoIP jitter, zero Wi-Fi dependencies, 100% crystal-clear voice audio.

2. **📋 Live Prioritized Call Queue**:
   - Auto-syncs today's leads directly from Wegrow CRM (`/api/leads`).
   - Filter by Hot/Warm/Cold, search by student name or course.

3. **⏱️ Automatic Post-Call Disposition Logger**:
   - Pops up immediately after call ends:
     - Exact talk duration (`02:15`)
     - 6 Quick Outcomes: `Interested`, `Counselling Scheduled`, `Call Later`, `Busy`, `Not Answered`, `Lost`
     - Date & Time picker for next scheduled follow-up
     - Counsellor remarks and notes

4. **💬 1-Tap WhatsApp Direct Messaging**:
   - Send course brochure, fee structure, and demo links to the student on WhatsApp without saving their number in phone contacts (`https://wa.me/91XXXXXXXXXX?text=...`).

5. **🛡️ Strict Permanent Safety Block (`9952337331`)**:
   - Hard-coded safety guard. Attempting to call or message `9952337331` is immediately intercepted and blocked.

6. **📊 Telecaller Daily KPIs & Metrics**:
   - Real-time tracker for: Total Calls Made, Total Talk Time, Warm Leads Converted, and Daily Goal Progress Bar.

7. **📶 Offline Resilience & Cloud Auto-Sync**:
   - If mobile internet drops while talking, all call notes and outcomes are saved locally on device and automatically uploaded when network reconnects.

---

## 🛠️ How to Run & Build

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start Live Development (Test on your phone via Expo Go)
```bash
npm start
```
* Download **Expo Go** from Google Play Store on your Android phone.
* Scan the QR code shown in the terminal. The app will launch immediately on your phone!

### 3. Generate Android APK File
To create a standalone installable Android APK (`.apk`):
```bash
npx eas-cli build -p android --profile preview
```
Or for local Gradle build:
```bash
npx expo run:android
```

---

## ⚙️ Configuration
In the **Settings** tab of the app:
* **CRM Server URL**: Enter your laptop's local IP address (e.g. `http://192.168.29.60:3000`) or production domain.
* **Telecaller Name**: e.g., `Priya Sharma` (attached to all saved dispositions).
* Tap **"Test Connection"** to verify real-time handshake with the CRM backend.
