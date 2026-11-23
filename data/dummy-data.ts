import {
  Lead,
  FollowUpTask,
  WhatsAppChat,
  WhatsAppTemplate,
  Telecaller,
  Course,
  AppUser,
} from "@/types";
import { WEGROW_INSTITUTE_COURSES } from "./institute-courses";

// 1. Official WeGrow Institute Courses from Brochure (01 to 34)
export const initialCourses: Course[] = WEGROW_INSTITUTE_COURSES.map((c) => {
  const is6M = c.duration.includes("6");
  const is4M = c.duration.includes("4");
  const is9M = c.duration.includes("9");
  const is3M = c.duration.includes("3");
  const fee = is9M ? 65000 : is6M ? 45000 : is4M ? 35000 : is3M ? 28000 : 18000;

  let icon = "GraduationCap";
  if (c.category.includes("01")) icon = "Code2";
  else if (c.category.includes("02")) icon = "TrendingUp";
  else icon = "BrainCircuit";

  return {
    id: `crs-${c.code}`,
    name: c.displayName,
    category: c.category,
    duration: c.duration,
    fee,
    shortDescription: `${c.name} under ${c.track}. Duration: ${c.duration}.${c.details ? ` Key coverage: ${c.details}.` : ""}`,
    fullDescription: `Official curriculum for ${c.displayName} at WeGrow Skill Campus. Master industry-standard practices, tools, and workflows in ${c.track}.${c.details ? ` Includes comprehensive hands-on practice in ${c.details}.` : ""}`,
    eligibility: "Any Degree / Diploma / Engineering / Arts & Science / School Passout or working professionals",
    curriculum: [
      `Module 1: Foundations & Core Concepts of ${c.name}`,
      `Module 2: Practical Lab Workflows & Real-time Exercises`,
      `Module 3: Advanced ${c.track} Industry Projects`,
      `Module 4: Capstone Execution, Portfolio & Placement Prep`,
    ],
    highlights: [
      "100% Practical Lab Training",
      "Real-time Industry Project Guidance",
      "WeGrow Certificate of Completion",
      "Placement & Career Support",
    ],
    mode: "Classroom / Offline",
    enrolledStudents: 140,
    rating: 4.9,
    iconName: icon,
  };
});

// 2. WeGrow Telecaller Staff Team (Zeroed for Fresh Live Launch)
export const initialTelecallers: Telecaller[] = [
  {
    id: "caller-muthuselvi",
    name: "MuthuSelvi",
    email: "muthuselvi@wegrow.edu",
    phone: "+91 99438 77948",
    avatar: "",
    role: "Senior Telecaller",
    assignedLeads: 0,
    dailyTarget: 60,
    callsCompleted: 0,
    connectedCalls: 0,
    interestedLeads: 0,
    followUpsCompleted: 0,
    admissionsGenerated: 0,
    conversionRate: 0,
    rank: 1,
  },
  {
    id: "caller-devipriya",
    name: "Devi Priya",
    email: "devipriya@wegrow.edu",
    phone: "+91 90923 22803",
    avatar: "",
    role: "Senior Telecaller",
    assignedLeads: 0,
    dailyTarget: 60,
    callsCompleted: 0,
    connectedCalls: 0,
    interestedLeads: 0,
    followUpsCompleted: 0,
    admissionsGenerated: 0,
    conversionRate: 0,
    rank: 2,
  },
  {
    id: "caller-subhashini",
    name: "Subhashini",
    email: "subhashini@wegrow.edu",
    phone: "+91 99438 77948",
    avatar: "",
    role: "Telecalling Executive",
    assignedLeads: 0,
    dailyTarget: 60,
    callsCompleted: 0,
    connectedCalls: 0,
    interestedLeads: 0,
    followUpsCompleted: 0,
    admissionsGenerated: 0,
    conversionRate: 0,
    rank: 3,
  },
  {
    id: "caller-lakshmipriya",
    name: "LakshmiPriya",
    email: "lakshmipriya.caller@wegrow.edu",
    phone: "+91 98431 73678",
    avatar: "",
    role: "Admissions Counsellor",
    assignedLeads: 0,
    dailyTarget: 60,
    callsCompleted: 0,
    connectedCalls: 0,
    interestedLeads: 0,
    followUpsCompleted: 0,
    admissionsGenerated: 0,
    conversionRate: 0,
    rank: 4,
  },
];

// 3. ONLY Real Lead: Rahul (Dummy leads eliminated as requested)
export const initialLeads: Lead[] = [];

// 4. Follow-up for Rahul
export const initialFollowUps: FollowUpTask[] = [];

// 5. WhatsApp Chats
export const initialWhatsAppChats: WhatsAppChat[] = [];

// 6. WhatsApp Templates
export const initialWhatsAppTemplates: WhatsAppTemplate[] = [
  {
    id: "tpl-1",
    title: "Brochure & Curriculum Roadmap",
    category: "Information",
    message: "Hi {StudentName}! 🎓 Greetings from WeGrow Skill Campus. Here is the official curriculum details for {CourseName}. Please let us know if you would like to schedule a campus demo session.",
  },
  {
    id: "tpl-2",
    title: "Campus Lab Visit Invitation",
    category: "Follow-up",
    message: "Dear {StudentName}, We would love to invite you to visit our state-of-the-art WeGrow training facility. You can experience our hands-on coding labs and meet our industry mentors in person.",
  },
  {
    id: "tpl-3",
    title: "Fee Structure & Batch Timing",
    category: "Pricing",
    message: "Hello {StudentName}! The upcoming batch for {CourseName} starts next Monday. Here are the flexible installment options and weekend/weekday schedule options.",
  },
  {
    id: "tpl-4",
    title: "Official Admission Confirmation",
    category: "Onboarding",
    message: "Congratulations {StudentName}! 🎓 Your admission for {CourseName} at WeGrow Skill Campus is officially confirmed. Welcome to the WeGrow changemaker community!",
  },
];

// 7. Leadership & Staff App Users
export const initialUsers: AppUser[] = [
  {
    id: "usr-thavabalan",
    name: "Thavabalan",
    email: "thavabalan@wegrow.edu",
    phone: "+91 98431 73678",
    role: "Owner",
    assignedLeads: 0,
    status: "Active",
    joinedDate: "01 Jan 2023",
    avatar: "",
    lastActive: "Active now",
    pin: "1234",
  },
  {
    id: "usr-lakshmipriya-gm",
    name: "LakshmiPriya (GM)",
    email: "lakshmipriya.gm@wegrow.edu",
    phone: "+91 98431 73678",
    role: "Admin",
    assignedLeads: 0,
    status: "Active",
    joinedDate: "15 Jan 2023",
    avatar: "",
    lastActive: "Active now",
    pin: "1234",
  },
  {
    id: "usr-gopinath-hr",
    name: "Gopinath (HR)",
    email: "gopinath.hr@wegrow.edu",
    phone: "+91 99438 77948",
    role: "Admin",
    assignedLeads: 0,
    status: "Active",
    joinedDate: "01 Feb 2023",
    avatar: "",
    lastActive: "Active now",
    pin: "1234",
  },
  {
    id: "usr-muthuselvi",
    name: "MuthuSelvi",
    email: "muthuselvi@wegrow.edu",
    phone: "+91 99438 77948",
    role: "Telecaller",
    assignedLeads: 0,
    status: "Active",
    joinedDate: "01 Mar 2023",
    avatar: "",
    lastActive: "Active now",
    pin: "1234",
  },
  {
    id: "usr-devipriya",
    name: "Devi Priya",
    email: "devipriya@wegrow.edu",
    phone: "+91 90923 22803",
    role: "Telecaller",
    assignedLeads: 0,
    status: "Active",
    joinedDate: "15 Mar 2023",
    avatar: "",
    lastActive: "Active now",
    pin: "1234",
  },
  {
    id: "usr-subhashini",
    name: "Subhashini",
    email: "subhashini@wegrow.edu",
    phone: "+91 99438 77948",
    role: "Telecaller",
    assignedLeads: 0,
    status: "Active",
    joinedDate: "01 Apr 2023",
    avatar: "",
    lastActive: "Active now",
    pin: "1234",
  },
  {
    id: "usr-lakshmipriya-caller",
    name: "LakshmiPriya",
    email: "lakshmipriya.caller@wegrow.edu",
    phone: "+91 98431 73678",
    role: "Telecaller",
    assignedLeads: 0,
    status: "Active",
    joinedDate: "15 Apr 2023",
    avatar: "",
    lastActive: "Active now",
    pin: "1234",
  },
];

export const dashboardStats = {
  totalLeads: 0,
  activeEnquiries: 0,
  admissionsClosed: 0,
  conversionRate: "0%",
  callsMadeToday: 0,
  pendingFollowUps: 0,
  averageCallDuration: "00:00",
  revenueGenerated: "₹0",
};

export const leadGrowthChartData = [
  { name: "Week 1", leads: 0 },
  { name: "Week 2", leads: 0 },
];

export const monthlyGrowthChartData = [
  { month: "Nov 2026", leads: 0, admissions: 0 },
];

export const leadSourceDistribution: any[] = [];

export const admissionFunnelData = [
  { stage: "Enquiry", count: 0, percentage: 0, color: "#6366f1" },
  { stage: "Connected", count: 0, percentage: 0, color: "#0ea5e9" },
  { stage: "Interested", count: 0, percentage: 0, color: "#f59e0b" },
  { stage: "Visit", count: 0, percentage: 0, color: "#10b981" },
];

export const recentActivityTimeline: any[] = [];
