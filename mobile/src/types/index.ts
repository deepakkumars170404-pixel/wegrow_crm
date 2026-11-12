export interface Lead {
  id: string;
  studentName: string;
  phone: string;
  email: string;
  courseInterested: string;
  leadSource: string;
  enquiryDate: string;
  nextFollowUpDate: string;
  nextFollowUpTime: string;
  assignedCaller: string;
  status: "New" | "Contacted" | "Interested" | "Follow-up" | "Enrolled" | "Closed";
  priority: "Hot" | "Warm" | "Cold";
  stage: "New Enquiry" | "Call Scheduled" | "Demo Booked" | "Decision Pending" | "Admission Done" | "Lost";
  notes?: string[];
  callCount?: number;
  qualification?: string;
  passedOutYear?: string;
  collegeName?: string;
}

export const WEGROW_STAFF_MEMBERS = [
  "Devi Priya",
  "Subhashini",
  "MuthuSelvi",
  "LakshmiPriya",
  "Muthumeena",
] as const;

export type StaffMember = (typeof WEGROW_STAFF_MEMBERS)[number];

export type CallDisposition =
  | "Interested"
  | "Visit to Institute"
  | "Joined"
  | "Not Interested"
  | "Call Later"
  | "Busy"
  | "Not Answered"
  | "Counselling Scheduled"
  | "Lost";

export interface CallRecord {
  id: string;
  leadId: string;
  studentName: string;
  phone: string;
  studentPhone?: string;
  callerName: string;
  disposition: CallDisposition | string;
  outcome?: string;
  mindset?: string;
  durationSeconds: number;
  duration_seconds?: number;
  formattedDuration: string;
  duration?: string;
  durationFormatted?: string;
  qualification?: string;
  passedOutYear?: string;
  collegeName?: string;
  courseInterested?: string;
  studentCourse?: string;
  callStartTime?: string;
  callEndTime?: string;
  callDate?: string;
  callTime?: string;
  fromTime?: string;
  endTime?: string;
  notes: string;
  remarks?: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  timestamp: number;
  syncedToCrm: boolean;
}

export interface TelecallerStats {
  todayCallsCount: number;
  todayTalkTimeSeconds: number;
  interestedCount: number;
  counsellingScheduledCount: number;
  targetCalls: number;
}

export interface AppSettings {
  crmServerUrl: string; // e.g. "http://192.168.29.60:3000"
  callerName: string; // e.g. "Priya Sharma"
  autoPopupDisposition: boolean;
  strictSafetyBlock: boolean; // 9952337331
  vibrateOnCall: boolean;
}
