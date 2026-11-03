# WeGrow Telecalling CRM – Frontend UI Template

A modern, professional, enterprise-grade Telecalling CRM dashboard designed specifically for **WeGrow Skill Campus**. Built with Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, and Recharts.

---

## 🎨 Brand & Design System

- **Brand:** WeGrow Skill Campus
- **Primary Navy Blue:** `#142B52`
- **Secondary Blue:** `#244B7A`
- **Gold Accent:** `#D5A52B`
- **Dashboard Background:** `#F5F7FA`
- **Cards & Surfaces:** `#FFFFFF`
- **Typography:** Inter / System UI with clear enterprise hierarchy
- **Currency & Region:** Indian Rupee (`₹`), Indian phone format (`+91 98451 23098`), realistic student enquiries across major tech hubs (Bangalore, Pune, Hyderabad, Chennai, Mumbai, Delhi NCR).

---

## 🚀 Navigation & Feature Pages

All 11 required navigation sections are completely implemented with rich interactive state and realistic dummy data:

| # | Page / Module | Route | Key Features |
|---|---|---|---|
| 1 | **Executive Dashboard** | `/` or `/dashboard` | 6 KPI cards, weekly/monthly enquiry trend charts, lead source donut chart, 7-stage conversion funnel, recent enquiries table, today's follow-up list, top telecallers, live activity timeline. |
| 2 | **Leads Management** | `/leads` | Filter by course, source, status, caller, priority; search by name/phone; pagination; Add Lead modal; Edit Lead modal; Import CSV/Excel demo modal. |
| 3 | **Student Enquiry Profile** | `/leads/[id]` | Comprehensive profile with 5 interactive tabs: Overview, Call History, Follow-ups, WhatsApp Messages, Internal Notes; right action panel with simulated call, change status, and schedule follow-up. |
| 4 | **Telecaller Workspace** | `/calls` | Dedicated dialer workspace with KPI cards, today's auto-prioritized call queue (left), softphone dialer with active timer, mute, speaker, dialpad, 6 quick disposition buttons, and post-call logging form. |
| 5 | **Follow-up Management** | `/follow-ups` | Categorized tabs (Today, Tomorrow, Overdue, Upcoming, Completed); List view & Calendar view; mark completed; reschedule callback modal with date & time slot. |
| 6 | **Admission Pipeline** | `/admissions` | 8-stage Kanban board (New Enquiry, Contacted, Interested, Counselling Scheduled, Campus Visited, Fee Discussion, Admitted, Lost) with stage conversion counters and one-click stage progression. |
| 7 | **WhatsApp Desk** | `/whatsapp` | 3-panel chat interface: student conversations list (left), active chat with message history & send simulation (center), 6 predefined quick templates + brochure attachment triggers (right). |
| 8 | **Reports & Analytics** | `/reports` | 4 report tabs: Enquiry Reports, Calling Reports, Admission Reports, Performance Reports; Recharts trend visualizations; time filters; Export PDF and Excel triggers. |
| 9 | **Team Performance** | `/team` | Telecaller leaderboard with gold/silver/bronze podium highlights, target progress bars, conversion metrics, and detailed counsellor performance audit modal. |
| 10 | **Course Library** | `/courses` | Tech skill programs (AI Explorer & GenAI, Full Stack Web Dev, Data Science & ML, Digital Marketing, UI/UX Design, Cloud DevOps) with duration, fee structures, syllabus modal, and brochure download. |
| 11 | **Users & Roles** | `/users` | RBAC user management; interactive role switcher demo (Owner / MD, Admin, Team Leader, Telecaller); Add User modal; Edit Role modal; status toggle. |
| 12 | **System Settings** | `/settings` | 7 configuration tabs: Company Profile, Campus Branches, Lead Statuses, Follow-up SLA Settings, Notification Preferences, Calling Rules, WhatsApp API Settings. |

---

## 💻 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Library:** React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom `#142B52` navy and `#D5A52B` gold tokens)
- **Icons:** Lucide React
- **Charts:** Recharts
- **State Management:** Custom React Context (`CRMProvider`) for real-time reactivity across pages

---

## 🏃‍♂️ Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Production Build:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🔒 Notes

This is a **Frontend Template / Demonstration Prototype** designed for showcasing to the Managing Director and Admissions Leadership. It simulates real-time data and interactions locally without requiring external database or third-party telephony/WhatsApp credentials.

