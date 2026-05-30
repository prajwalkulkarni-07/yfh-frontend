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
  phone: string
  age: number
  student_type: "studying" | "working"
  institution_name?: string | null
  company_name?: string | null
  active: boolean
  created_at?: string
}

export interface StudentSessionDetail {
  class_id?: string | null
  class_name?: string | null
  order_index?: number
  status: "present" | "absent"
  attended_on?: string | null
}

export interface StudentDetailsResponse {
  student: Student
  sessions: StudentSessionDetail[]
}

export interface AttendanceSession {
  id: string
  class_date: string
  class_id?: string
  class_name?: string
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

export interface InactiveReportItem {
  id: string
  full_name: string
  phone: string
  class_name?: string | null
  class_date?: string | null
}

export interface EligibleReportItem {
  id: string
  full_name: string
  phone: string
  attended_classes: number
}

export interface ApiError {
  message: string
  status?: number
}
