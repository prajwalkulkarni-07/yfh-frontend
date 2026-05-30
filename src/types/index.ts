export interface User {
  id: string
  email: string
  name?: string
  role?: string
}

export interface Student {
  id: string
  full_name: string
  email?: string
  phone?: string
  active: boolean
  created_at?: string
}

export interface AttendanceSession {
  id: string
  class_date: string
  created_at?: string
}

export interface AttendanceRecord {
  student_id: string
  status: "present" | "absent"
}

export interface AttendanceEntry {
  id: string
  session_id: string
  student_id: string
  student?: Student
  status: "present" | "absent"
  class_date: string
}

export interface AttendanceSummaryItem {
  student_id: string
  student_name: string
  total_sessions: number
  present: number
  absent: number
  attendance_percentage: number
}

export interface ApiError {
  message: string
  status?: number
}
