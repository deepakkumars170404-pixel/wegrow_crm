// Wegrow Skill Campus - Official Institute Curriculum Courses
// Extracted accurately from Official Brochure (01 to 34 Courses)

export interface WegrowCourseItem {
  code: string;
  name: string;
  category: "01 IT & Development" | "02 Tech, Business & Communication" | "03 Creative, AI & Future Tech";
  track: string;
  duration: string;
  details?: string;
  displayName: string;
}

export const WEGROW_INSTITUTE_COURSES: WegrowCourseItem[] = [
  // ==========================================
  // 01 IT & Development (Programming • Full Stack • Web)
  // ==========================================
  // Python Programming
  {
    code: "01",
    name: "Basic Python",
    category: "01 IT & Development",
    track: "Python Programming",
    duration: "1 Month",
    displayName: "01. Basic Python (1 Month)",
  },
  {
    code: "02",
    name: "Advanced Python",
    category: "01 IT & Development",
    track: "Python Programming",
    duration: "2 Months",
    details: "Includes Basic Python",
    displayName: "02. Advanced Python - Inc. Basic (2 Months)",
  },
  {
    code: "03",
    name: "AI Python Full Stack Program",
    category: "01 IT & Development",
    track: "Python Programming",
    duration: "6 Months",
    displayName: "03. AI Python Full Stack Program (6 Months)",
  },

  // Java Programming
  {
    code: "04",
    name: "Core Java (Basic)",
    category: "01 IT & Development",
    track: "Java Programming",
    duration: "2 Months",
    displayName: "04. Core Java - Basic (2 Months)",
  },
  {
    code: "05",
    name: "Advanced Java",
    category: "01 IT & Development",
    track: "Java Programming",
    duration: "2 Months",
    details: "Spring, Hibernate",
    displayName: "05. Advanced Java - Spring, Hibernate (2 Months)",
  },
  {
    code: "06",
    name: "AI Java Program",
    category: "01 IT & Development",
    track: "Java Programming",
    duration: "6 Months",
    displayName: "06. AI Java Program (6 Months)",
  },

  // Full Stack Development
  {
    code: "07",
    name: "Full Stack AI",
    category: "01 IT & Development",
    track: "Full Stack Development",
    duration: "9 Months",
    details: "Python + Java",
    displayName: "07. Full Stack AI - Python + Java (9 Months)",
  },
  {
    code: "08",
    name: "Full Stack Development",
    category: "01 IT & Development",
    track: "Full Stack Development",
    duration: "3 Months",
    details: "React, Node, Express, Vue",
    displayName: "08. Full Stack Development - MERN/Vue (3 Months)",
  },

  // PHP & Web Technology
  {
    code: "09",
    name: "Core PHP (Basic)",
    category: "01 IT & Development",
    track: "PHP & Web Technology",
    duration: "2 Months",
    displayName: "09. Core PHP - Basic (2 Months)",
  },
  {
    code: "10",
    name: "Web Technology (Advanced)",
    category: "01 IT & Development",
    track: "PHP & Web Technology",
    duration: "3 Months",
    details: "PHP, MySQL, HTML, Bootstrap, JS - Advanced",
    displayName: "10. Web Technology - PHP, MySQL, JS (3 Months)",
  },

  // ==========================================
  // 02 Tech, Business & Communication
  // ==========================================
  // Programming, Testing & UI/UX
  {
    code: "11",
    name: "C & C++ Programming",
    category: "02 Tech, Business & Communication",
    track: "Programming, Testing & UI/UX",
    duration: "2 Months",
    displayName: "11. C & C++ Programming (2 Months)",
  },
  {
    code: "12",
    name: "Software Testing",
    category: "02 Tech, Business & Communication",
    track: "Programming, Testing & UI/UX",
    duration: "2 Months",
    details: "Manual + Automation",
    displayName: "12. Software Testing - Manual & Auto (2 Months)",
  },
  {
    code: "13",
    name: "UI/UX Design",
    category: "02 Tech, Business & Communication",
    track: "Programming, Testing & UI/UX",
    duration: "2 Months",
    displayName: "13. UI/UX Design (2 Months)",
  },

  // Office, Accounts & Design
  {
    code: "14",
    name: "Office Automation",
    category: "02 Tech, Business & Communication",
    track: "Office, Accounts & Design",
    duration: "2 Months",
    details: "MS Office, Tally",
    displayName: "14. Office Automation - MS Office, Tally (2 Months)",
  },
  {
    code: "15",
    name: "Accounting Software",
    category: "02 Tech, Business & Communication",
    track: "Office, Accounts & Design",
    duration: "2 Months",
    details: "Tally Prime",
    displayName: "15. Accounting Software - Tally Prime (2 Months)",
  },
  {
    code: "16",
    name: "Graphic Design",
    category: "02 Tech, Business & Communication",
    track: "Office, Accounts & Design",
    duration: "2 Months",
    details: "Photoshop, CorelDraw & Illustrator",
    displayName: "16. Graphic Design - Photoshop, Illustrator (2 Months)",
  },

  // Data & Communication
  {
    code: "17",
    name: "Data Analytics",
    category: "02 Tech, Business & Communication",
    track: "Data & Communication",
    duration: "4-6 Months",
    details: "Excel, SQL, Power BI, Python",
    displayName: "17. Data Analytics - Power BI, SQL, Python (4-6 Months)",
  },
  {
    code: "18",
    name: "Professional English",
    category: "02 Tech, Business & Communication",
    track: "Data & Communication",
    duration: "1-2 Months",
    details: "Communication Skills",
    displayName: "18. Professional English - Communication (1-2 Months)",
  },

  // Digital Marketing
  {
    code: "19",
    name: "Digital Marketing (Basic)",
    category: "02 Tech, Business & Communication",
    track: "Digital Marketing",
    duration: "2 Months",
    details: "Basic - Social Media Marketing",
    displayName: "19. Digital Marketing - Social Media (2 Months)",
  },
  {
    code: "20",
    name: "Digital Marketing (Intermediate)",
    category: "02 Tech, Business & Communication",
    track: "Digital Marketing",
    duration: "4 Months",
    displayName: "20. Digital Marketing - Intermediate (4 Months)",
  },
  {
    code: "21",
    name: "Digital Marketing (Expert)",
    category: "02 Tech, Business & Communication",
    track: "Digital Marketing",
    duration: "6 Months",
    displayName: "21. Digital Marketing - Expert (6 Months)",
  },

  // ==========================================
  // 03 Creative, AI & Future Tech
  // ==========================================
  // Video & AI Creation
  {
    code: "22",
    name: "Video Editing",
    category: "03 Creative, AI & Future Tech",
    track: "Video & AI Creation",
    duration: "3 Months",
    details: "Camera Handling",
    displayName: "22. Video Editing & Camera Handling (3 Months)",
  },
  {
    code: "23",
    name: "AI Video Generation",
    category: "03 Creative, AI & Future Tech",
    track: "Video & AI Creation",
    duration: "2 Months",
    displayName: "23. AI Video Generation (2 Months)",
  },
  {
    code: "24",
    name: "Video Editing (Expert)",
    category: "03 Creative, AI & Future Tech",
    track: "Video & AI Creation",
    duration: "6 Months",
    displayName: "24. Video Editing - Expert (6 Months)",
  },

  // Generative AI & LLM
  {
    code: "25",
    name: "LLM + Generative AI",
    category: "03 Creative, AI & Future Tech",
    track: "Generative AI & LLM",
    duration: "3 Months",
    displayName: "25. LLM + Generative AI (3 Months)",
  },
  {
    code: "26",
    name: "LLM & Prompt Engineering (Basic)",
    category: "03 Creative, AI & Future Tech",
    track: "Generative AI & LLM",
    duration: "1 Month",
    displayName: "26. LLM & Prompt Engineering - Basic (1 Month)",
  },
  {
    code: "27",
    name: "LLM & Prompt Engineering (Intermediate)",
    category: "03 Creative, AI & Future Tech",
    track: "Generative AI & LLM",
    duration: "2 Months",
    displayName: "27. LLM & Prompt Engineering - Interm. (2 Months)",
  },
  {
    code: "28",
    name: "LLM & Generative AI (Advanced)",
    category: "03 Creative, AI & Future Tech",
    track: "Generative AI & LLM",
    duration: "3 Months",
    displayName: "28. LLM & Generative AI - Advanced (3 Months)",
  },

  // Cyber Security & Flutter
  {
    code: "29",
    name: "Cyber Security (Basic)",
    category: "03 Creative, AI & Future Tech",
    track: "Cyber Security & Flutter",
    duration: "2 Months",
    displayName: "29. Cyber Security - Basic (2 Months)",
  },
  {
    code: "30",
    name: "Cyber Security (Intermediate)",
    category: "03 Creative, AI & Future Tech",
    track: "Cyber Security & Flutter",
    duration: "4 Months",
    displayName: "30. Cyber Security - Intermediate (4 Months)",
  },
  {
    code: "31",
    name: "Cyber Security (Expert)",
    category: "03 Creative, AI & Future Tech",
    track: "Cyber Security & Flutter",
    duration: "6 Months",
    displayName: "31. Cyber Security - Expert (6 Months)",
  },
  {
    code: "32",
    name: "Flutter (Basic)",
    category: "03 Creative, AI & Future Tech",
    track: "Cyber Security & Flutter",
    duration: "2 Months",
    displayName: "32. Flutter App Dev - Basic (2 Months)",
  },
  {
    code: "33",
    name: "Flutter (Intermediate)",
    category: "03 Creative, AI & Future Tech",
    track: "Cyber Security & Flutter",
    duration: "4 Months",
    displayName: "33. Flutter App Dev - Intermediate (4 Months)",
  },
  {
    code: "34",
    name: "Flutter (Expert)",
    category: "03 Creative, AI & Future Tech",
    track: "Cyber Security & Flutter",
    duration: "6 Months",
    displayName: "34. Flutter App Dev - Expert (6 Months)",
  },
];

export const WEGROW_COURSE_NAMES: string[] = WEGROW_INSTITUTE_COURSES.map(
  (c) => c.displayName
);
