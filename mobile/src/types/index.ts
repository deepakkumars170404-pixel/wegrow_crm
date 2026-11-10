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
}

export type CallDisposition =
  | "Interested"
  | "Busy"
  | "Call Later"
  | "Counselling Scheduled"
  | "Not Answered"
  | "Lost";

export interface CallRecord {
  id: string;
  leadId: string;
  studentName: string;
  phone: string;
  callerName: string;
  disposition: CallDisposition;
  durationSeconds: number;
  formattedDuration: string;
  notes: string;
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
