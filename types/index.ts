export const WEGROW_STAFF_MEMBERS = [
  "Devi Priya",
  "Subhashini",
  "MuthuSelvi",
  "LakshmiPriya",
  "Muthumeena",
] as const;

export const WEGROW_MANAGEMENT = {
  owner: "Thavabalan",
  adminGM: "LakshmiPriya",
  hr: "Gopi",
  telecallHead: "Muthumeena",
  telecallers: [
    "Devi Priya",
    "MuthuSelvi",
    "LakshmiPriya",
    "Subhashini",
    "Muthumeena",
  ],
} as const;

export type StaffMember = (typeof WEGROW_STAFF_MEMBERS)[number];

export type LeadPriority = "Hot" | "Warm" | "Cold";

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Busy"
  | "Call Later"
  | "Not Interested"
  | "Counselling Scheduled"
  | "Visited Campus"
  | "Fee Discussion"
  | "Admitted"
  | "Lost";

export type PipelineStage =
  | "New Enquiry"
  | "Contacted"
  | "Interested"
  | "Counselling Scheduled"
  | "Campus Visited"
  | "Fee Discussion"
  | "Admitted"
  | "Lost";

export interface Lead {
  id: string;
  studentName: string;
  phone: string;
  email: string;
  courseInterested: string;
  leadSource: "Website" | "Facebook" | "Instagram" | "Walk-in" | "Referral" | "Phone" | "Google Ads";
  assignedCaller: string;
  priority: LeadPriority;
  status: LeadStatus;
  enquiryDate: string;
  nextFollowUpDate: string;
  nextFollowUpTime: string;
  city?: string;
  education?: string;
  qualification?: string;
  passedOutYear?: string;
  collegeName?: string;
  callCount: number;
  lastCallDate?: string;
  lastCallOutcome?: string;
  notes?: NoteItem[];
  callHistory?: CallRecord[];
  stage?: PipelineStage;
}

export interface NoteItem {
  id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface CallRecord {
  id: string;
  callDate: string;
  callTime: string;
  callerName: string;
  duration: string;
  outcome: string; // "Attended Call" | "Not Attended Call"
  mindset?: string; // e.g. "Interested", "Visit to Institute", "Joined"
  qualification?: string;
  passedOutYear?: string;
  collegeName?: string;
  courseInterested?: string;
  studentName?: string;
  remarks: string;
  fromTime?: string;
  endTime?: string;
  durationFormatted?: string;
}

export interface FollowUpTask {
  id: string;
  leadId: string;
  studentName: string;
  phone: string;
  course: string;
  assignedCaller: string;
  lastContacted: string;
  followUpDate: string;
  followUpTime: string;
  status: "Today" | "Tomorrow" | "Overdue" | "Upcoming" | "Completed";
  priority: LeadPriority;
  remarks: string;
}

export interface WhatsAppMessage {
  id: string;
  sender: "student" | "caller";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  attachment?: {
    type: "pdf" | "image" | "doc";
    name: string;
    size: string;
  };
}

export interface WhatsAppChat {
  id: string;
  leadId: string;
  studentName: string;
  phone: string;
  course: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: WhatsAppMessage[];
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: string;
  message: string;
}

export type UserRole = "Owner" | "Owner / MD" | "Admin" | "Telecaller";

export interface Telecaller {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: "Senior Telecaller" | "Telecalling Executive" | "Admissions Counsellor";
  assignedLeads: number;
  dailyTarget: number;
  callsCompleted: number;
  connectedCalls: number;
  interestedLeads: number;
  followUpsCompleted: number;
  admissionsGenerated: number;
  conversionRate: number;
  rank: number;
}

export interface Course {
  id: string;
  name: string;
  category: string;
  duration: string;
  fee: number;
  shortDescription: string;
  fullDescription: string;
  eligibility: string;
  curriculum: string[];
  highlights: string[];
  mode: "Classroom / Offline" | "Hybrid" | "Live Online";
  enrolledStudents: number;
  rating: number;
  iconName: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  assignedLeads: number;
  status: "Active" | "Inactive";
  joinedDate: string;
  avatar: string;
  lastActive: string;
}
