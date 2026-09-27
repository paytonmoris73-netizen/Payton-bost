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
}

export interface TimeEntry {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  notes: string;
  userName?: string;
  hours?: number;
}

export type Page =
  | "owner-dashboard"
  | "owner-team"
  | "owner-time"
  | "owner-payroll"
  | "employee-dashboard"
  | "employee-time"
  | "employee-pay";
