// ─── User & Roles ──────────────────────────────────────────────
export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserData {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  collegeId?: string;
  createdById?: string;
  // Student-specific
  major?: string;
  stressLevel?: number;
  cognitiveAgilityScore?: number;
  urgentAlerts?: Alert[];
  academic?: {
    year: string;
    branch: string;
    cgpa: number;
    attendance: number;
  };
  gamification?: {
    level: number;
    points: number;
    badges: string[];
    streak: number;
  };
}

// ─── College ───────────────────────────────────────────────────
export interface College {
  id: string;
  name: string;
  adminId: string;
  location?: string;
  image?: string;
  type?: 'college' | 'organization';
}

// ─── Course ────────────────────────────────────────────────────
export type Course = {
  id: string;
  name: string;
  instructor: string;
  attendance: number;
  grade: number;
  credits: number;
  collegeId?: string;
  teacherId?: string;
  studentIds?: string[];
  description?: string;
  schedule?: string; // e.g. "Mon/Wed 10:00-11:30"
};

// ─── Event (Events Pulse / Forum page) ─────────────────────────
export type EventCategory =
  | "All"
  | "Tech"
  | "Cultural"
  | "Sports"
  | "Academic"
  | "Workshop"
  | "Social"
  | "Career";

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  date: string;          // ISO date string "YYYY-MM-DD"
  time: string;          // "10:00 AM"
  location: string;
  category: EventCategory;
  image?: string;
  attendees: number;
  collegeId?: string;
  createdBy?: string;    // teacher or admin uid
}

// ─── Announcement ──────────────────────────────────────────────
export type Announcement = {
  id: string;
  title: string;
  content: string;
  date: Date | string;
  collegeId?: string;
  createdBy?: string;
};

// ─── Upcoming Event (legacy — used by dashboard widget) ────────
export type UpcomingEvent = {
  id: string;
  type: 'Quiz' | 'Assignment' | 'Exam';
  title: string;
  course: string;
  date: Date;
  location?: string;
  collegeId?: string;
};

// ─── Quiz ──────────────────────────────────────────────────────
export type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
};

export type Quiz = {
  id: string;
  title: string;
  course: string;
  questions: Question[];
  coverImageId: string;
  courseId?: string;
  teacherId?: string;
  collegeId?: string;
};

export interface QuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<string, string>; // questionId → selectedAnswer
  score: number;
  total: number;
  submittedAt: string;
}

// ─── Forum (Peer Oracle) ───────────────────────────────────────
export type ForumPost = {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  authorAvatarId: string;
  date: Date | string;
  content: string;
  replies: number;
  course: string;
  tags?: string[];
  isAnonymous?: boolean;
  collegeId?: string;
};

export type ForumReply = {
  id: string;
  author: string;
  authorId?: string;
  authorAvatarId: string;
  date: Date | string;
  content: string;
  parentReplyId?: string;
};

// ─── Memory (Memory Scroll — already on RTDB) ──────────────────
export type MemoryItem = {
  id: string;
  date: string;
  content: string;
  type: 'goal' | 'reflection' | 'achievement';
};

// ─── Timetable ─────────────────────────────────────────────────
export interface TimetableSlot {
  subject: string;
  professor: string;
  startTime: string;  // "09:00"
  endTime: string;    // "10:00"
  room?: string;
}

export interface Timetable {
  id?: string;
  collegeId?: string;
  studentId?: string;
  schedule: Record<string, TimetableSlot[]>; // day → slots
}

// ─── Grade ──────────────────────────────────────────────────────
export interface Grade {
  id: string;
  studentId: string;
  studentName?: string;
  courseId: string;
  courseName?: string;
  teacherId: string;
  score: number;
  maxScore: number;
  type: 'quiz' | 'assignment' | 'exam' | 'project';
  date: string;
  feedback?: string;
}

// ─── Audit Log (Admin) ─────────────────────────────────────────
export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName?: string;
  timestamp: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

// ─── Alert ─────────────────────────────────────────────────────
export interface Alert {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "alert";
  timestamp: Date;
}

// ─── Resource (Teacher) ────────────────────────────────────────
export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'document';
  url?: string;
  courseId: string;
  courseName?: string;
  teacherId: string;
  collegeId?: string;
  uploadedAt: string;
  size?: string;
}
