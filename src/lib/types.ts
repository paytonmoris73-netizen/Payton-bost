export interface Company {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: "owner" | "employee";
  hourlyRate: number;
  createdAt: string;
  active: boolean;
  title: string;
}

export interface UserWithStats extends User {
  clockedIn: boolean;
  todayHours: number;
  weekHours: number;
  monthHours: number;
  weekPay: number;
  monthPay: number;
  totalPaid: number;
  totalOwed: number;
}

export interface BreakEntry {
  breakStart: string;
  breakEnd: string | null;
}

export interface TimeEntry {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  notes: string;
  jobId?: string;
  breaks: BreakEntry[];
  userName?: string;
  hours?: number;
}

export interface Shift {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  note: string;
  createdAt: string;
  userName?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: "vacation" | "sick" | "personal" | "other";
  reason: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  reviewedAt: string | null;
  userName?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  type: "info" | "success" | "warning";
  read: boolean;
  createdAt: string;
}

export interface EmployeeNote {
  id: string;
  userId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  payType: "fixed" | "hourly";
  payAmount: number;
  assignedTo: string[];
  status: "open" | "in_progress" | "completed";
  priority: "normal" | "high" | "urgent";
  createdAt: string;
  completedAt: string | null;
  dueDate: string | null;
  clientId?: string;
}

export interface PublicUser {
  id: string;
  name: string;
  title: string;
  role: "owner" | "employee";
  hasPin: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface InvoiceItem { description: string; quantity: number; unitPrice: number; }

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  jobId?: string;
  items: InvoiceItem[];
  taxRate: number;
  status: "draft" | "sent" | "paid";
  issueDate: string;
  dueDate: string;
  notes: string;
  paidAt: string | null;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  total: number;
  overdue: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assigneeName?: string;
  dueDate: string | null;
  done: boolean;
  doneAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface Insight {
  id: string;
  level: "critical" | "warning" | "info" | "success";
  title: string;
  detail: string;
  page?: Page;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  type: "payroll" | "bonus" | "job";
  description: string;
  jobId?: string;
  paidAt: string;
  periodStart?: string;
  periodEnd?: string;
  userName?: string;
}

export interface DailyHours { date: string; label: string; hours: number; }

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  vendor: string;
  notes: string;
  date: string;
  createdAt: string;
  recurring: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  pinned: boolean;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  type: "clock_in" | "clock_out" | "payment" | "job_created" | "job_done" | "announcement";
  ts: string;
  actor: string;
  title: string;
  sub: string;
  meta?: Record<string, string | number>;
}

export type Page =
  | "owner-dashboard"
  | "owner-activity"
  | "owner-jobs"
  | "owner-team"
  | "owner-time"
  | "owner-payroll"
  | "owner-analytics"
  | "owner-payments"
  | "owner-expenses"
  | "owner-announcements"
  | "owner-billing"
  | "owner-settings"
  | "owner-schedule"
  | "owner-leave"
  | "owner-tasks"
  | "owner-clients"
  | "owner-invoices"
  | "employee-dashboard"
  | "employee-jobs"
  | "employee-time"
  | "employee-pay"
  | "employee-payments"
  | "employee-announcements"
  | "employee-schedule"
  | "employee-leave"
  | "employee-tasks";
