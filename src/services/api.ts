import type {
  Student,
  AttendanceSession,
  AttendanceRecord,
  AttendanceEntry,
  AttendanceSummaryItem,
  InactiveReportItem,
  EligibleReportItem,
  PromotedReportItem,
  YetToAttendTripReportItem,
  YetToVolunteerReportItem,
  StudentDetailsResponse,
  Trip,
  VolunteeringService,
  User,
  GitaAttendanceSession,
} from "@/types"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

function getToken(): string | null {
  return localStorage.getItem("yoga_token")
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const isLoginRequest = path.startsWith("/api/auth/login")
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  let body: unknown = null
  if (res.status !== 204) {
    body = await res.json().catch(() => null)
  }

  if (res.status === 401) {
    localStorage.removeItem("yoga_token")
    localStorage.removeItem("yoga_user")
    localStorage.removeItem("yoga_portal")
    if (!isLoginRequest) {
      window.location.href = "/login"
    }
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: unknown }).message)
        : "Unauthorized"
    throw new Error(message)
  }

  if (!res.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: unknown }).message)
        : `Request failed: ${res.status}`
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T

  if (typeof body === "object" && body && "data" in body) {
    return (body as { data: T }).data
  }

  return body as T
}

// Auth
export async function login(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function getProfile(): Promise<User> {
  return request("/api/auth/profile")
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  return request("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

// Students
export async function createStudent(data: {
  full_name: string
  phone: string
  age: number
  student_type: "studying" | "working"
  college_name?: string
  branch?: string
  semester?: number
  company_name?: string
  designation?: string
  experience?: number
}): Promise<Student> {
  return request("/api/students", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getStudents(
  active?: boolean,
  includePromoted?: boolean
): Promise<Student[]> {
  const params = new URLSearchParams()
  if (active !== undefined) params.set("active", String(active))
  if (includePromoted) params.set("include_promoted", "true")
  const query = params.toString() ? `?${params}` : ""
  return request(`/api/students${query}`)
}

export async function getStudent(id: string): Promise<Student> {
  return request(`/api/students/${id}`)
}

export async function getStudentDetails(id: string): Promise<StudentDetailsResponse> {
  return request(`/api/students/${id}/details`)
}

export async function updateStudent(
  id: string,
  data: Partial<Student>
): Promise<Student> {
  return request(`/api/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function setStudentStatus(
  id: string,
  active: boolean
): Promise<Student> {
  return request(`/api/students/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  })
}

export async function deleteStudent(id: string): Promise<void> {
  return request(`/api/students/${id}`, {
    method: "DELETE",
  })
}

// Attendance
export async function createSession(classDate: string): Promise<AttendanceSession> {
  return request("/api/attendance/sessions", {
    method: "POST",
    body: JSON.stringify({ class_date: classDate }),
  })
}

export async function getSessions(
  from?: string,
  to?: string
): Promise<AttendanceSession[]> {
  const params = new URLSearchParams()
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  const query = params.toString() ? `?${params}` : ""
  return request(`/api/attendance/sessions${query}`)
}

export async function markAttendance(
  classDate: string,
  records: AttendanceRecord[]
): Promise<void> {
  return request("/api/attendance/mark", {
    method: "POST",
    body: JSON.stringify({ class_date: classDate, records }),
  })
}

export async function getAttendance(
  params: { class_date?: string; session_id?: string }
): Promise<AttendanceEntry[]> {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  )
  return request(`/api/attendance?${query}`)
}

export async function getAttendanceSummary(
  from: string,
  to: string
): Promise<AttendanceSummaryItem[]> {
  const data = await request<AttendanceSummaryItem[] | Array<Record<string, unknown>>>(
    `/api/attendance/summary?from=${from}&to=${to}`
  )

  return (data as Array<Record<string, unknown>>).map((item) => {
    const present =
      typeof item.present === "number"
        ? item.present
        : Number(item.present_count ?? item.present ?? 0)
    const absent =
      typeof item.absent === "number"
        ? item.absent
        : Number(item.absent_count ?? item.absent ?? 0)
    return {
      ...item,
      present,
      absent,
    } as AttendanceSummaryItem
  })
}

export async function getInactiveReport(): Promise<InactiveReportItem[]> {
  return request("/api/reports/inactive")
}

export async function getEligibleReport(): Promise<EligibleReportItem[]> {
  return request("/api/reports/eligible")
}

export async function getPromotedReport(): Promise<PromotedReportItem[]> {
  return request("/api/reports/promoted")
}

export async function getYetToAttendTripReport(): Promise<YetToAttendTripReportItem[]> {
  return request("/api/reports/yet-to-attend-trip")
}

// Bhagavad Gita portal
export async function getGitaStudents(): Promise<Student[]> {
  return request("/api/gita/students")
}

export async function getGitaStudent(id: string): Promise<Student> {
  return request(`/api/gita/students/${id}`)
}

export async function getGitaStudentAttendance(
  id: string
): Promise<Array<{ session_date: string; status: "present" | "absent" }>> {
  return request(`/api/gita/students/${id}/attendance`)
}

export async function createGitaSession(sessionDate: string): Promise<GitaAttendanceSession> {
  return request("/api/gita/attendance/sessions", {
    method: "POST",
    body: JSON.stringify({ session_date: sessionDate }),
  })
}

export async function getGitaSessions(
  from?: string,
  to?: string
): Promise<GitaAttendanceSession[]> {
  const params = new URLSearchParams()
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  const query = params.toString() ? `?${params}` : ""
  return request(`/api/gita/attendance/sessions${query}`)
}

export async function markGitaAttendance(
  sessionDate: string,
  records: AttendanceRecord[]
): Promise<void> {
  return request("/api/gita/attendance/mark", {
    method: "POST",
    body: JSON.stringify({ session_date: sessionDate, records }),
  })
}

export async function getGitaAttendance(
  params: { session_date?: string; session_id?: string }
): Promise<AttendanceEntry[]> {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  )
  return request(`/api/gita/attendance?${query}`)
}

export async function getYetToVolunteerReport(): Promise<YetToVolunteerReportItem[]> {
  return request("/api/reports/yet-to-volunteer")
}

// Trips
export async function getTrips(): Promise<Trip[]> {
  return request("/api/trips")
}

export async function createTrip(
  tripDate: string,
  studentIds: string[],
  details?: string
): Promise<Trip> {
  return request("/api/trips", {
    method: "POST",
    body: JSON.stringify({ trip_date: tripDate, student_ids: studentIds, details }),
  })
}

export async function updateTripParticipants(
  tripId: string,
  studentIds: string[],
  details?: string,
  tripDate?: string
): Promise<{ id: string; participant_count: number }> {
  return request(`/api/trips/${tripId}`, {
    method: "PUT",
    body: JSON.stringify({ student_ids: studentIds, details, trip_date: tripDate }),
  })
}

export async function deleteTrip(tripId: string): Promise<void> {
  return request(`/api/trips/${tripId}`, {
    method: "DELETE",
  })
}

// Volunteering
export async function getVolunteeringServices(): Promise<VolunteeringService[]> {
  return request("/api/volunteering")
}

export async function createVolunteeringService(
  serviceDate: string,
  studentIds: string[],
  details?: string
): Promise<VolunteeringService> {
  return request("/api/volunteering", {
    method: "POST",
    body: JSON.stringify({ service_date: serviceDate, student_ids: studentIds, details }),
  })
}

export async function updateVolunteeringServiceParticipants(
  serviceId: string,
  studentIds: string[],
  details?: string,
  serviceDate?: string
): Promise<{ id: string; participant_count: number }> {
  return request(`/api/volunteering/${serviceId}`, {
    method: "PUT",
    body: JSON.stringify({ student_ids: studentIds, details, service_date: serviceDate }),
  })
}

export async function deleteVolunteeringService(serviceId: string): Promise<void> {
  return request(`/api/volunteering/${serviceId}`, {
    method: "DELETE",
  })
}
