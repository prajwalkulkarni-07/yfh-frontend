export interface User {
  id: string
  email: string
  name?: string
  role?: string
}

export type PortalType = "yfh" | "gita"
export type StudentType = "studying" | "working" | "not_studying_not_working"

export interface Student {
  id: string
  full_name: string
  email?: string
  phone: string
  age: number
  student_type: StudentType
  college_name?: string | null
  branch?: string | null
  semester?: number | null
  company_name?: string | null
  designation?: string | null
  experience?: number | null
  description?: string | null
  active: boolean
  level?: number
  promoted_at?: string | null
  created_at?: string
}

export interface StudentSessionDetail {
  class_id?: string | null
  class_name?: string | null
  order_index?: number
  status: "present" | "absent"
  attended_on?: string | null
  attended_dates?: string[]
}

export interface StudentTripDetail {
  trip_date?: string | null
  details?: string | null
  recorded_at?: string | null
}

export interface StudentVolunteerDetail {
  service_date?: string | null
  details?: string | null
  recorded_at?: string | null
}

export interface PromotionStatus {
  promoted: boolean
  attended_classes: number
  total_classes: number
  attended_trips: number
  volunteered_times: number
  missing: string[]
  summary: string
}

export interface StudentDetailsResponse {
  student: Student
  sessions: StudentSessionDetail[]
  trips?: StudentTripDetail[]
  volunteering?: StudentVolunteerDetail[]
  promotion_status?: PromotionStatus
}

export interface AttendanceSession {
  id: string
  class_date: string
  class_id?: string
  class_name?: string
  created_at?: string
}

export interface GitaAttendanceSession {
  id: string
  session_date: string
  day_of_week?: string
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
  class_date?: string
  session_date?: string
}

export interface GitaAttendanceEntry {
  id: string
  session_id: string
  student_id: string
  status: "present" | "absent"
  session_date: string
}

export interface GitaAttendanceRow {
  session_date: string
  status: "present" | "absent"
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

export interface PromotedReportItem {
  id: string
  full_name: string
  phone: string
  promoted_at?: string | null
  trip_date?: string | null
}

export interface YetToAttendTripReportItem {
  id: string
  full_name: string
  phone: string
  attended_classes?: number
}

export interface YetToVolunteerReportItem {
  id: string
  full_name: string
  phone: string
  attended_classes?: number
}

export interface ClassReportStudent {
  id: string
  full_name: string
  phone?: string | null
}

export interface ClassReportItem {
  class_id: string
  class_name: string
  order_index: number
  students: ClassReportStudent[]
}

export interface AllStudentsReportClass {
  class_id: string
  class_name: string
  order_index: number
  status: "Attended" | "Not Attended"
}

export interface AllStudentsReportItem {
  id: string
  full_name: string
  phone?: string | null
  classes: AllStudentsReportClass[]
  trip: "Attended" | "Not Attended"
  volunteering: "Done" | "Not Done"
  activity_status: "Active" | "Inactive"
  promotion_status: "Promoted" | "Not Promoted"
}

export interface TripParticipant {
  id: string
  full_name: string
  phone?: string | null
}

export interface Trip {
  id: string
  trip_date: string
  details?: string | null
  created_at?: string
  participant_count?: number
  participants?: TripParticipant[]
  is_locked?: boolean
}

export interface VolunteeringParticipant {
  id: string
  full_name: string
  phone?: string | null
}

export interface VolunteeringService {
  id: string
  service_date: string
  details?: string | null
  created_at?: string
  participant_count?: number
  participants?: VolunteeringParticipant[]
}

export interface ApiError {
  message: string
  status?: number
}
