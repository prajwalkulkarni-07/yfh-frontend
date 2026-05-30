import type {
  Student,
  AttendanceSession,
  AttendanceRecord,
  AttendanceEntry,
  AttendanceSummaryItem,
  InactiveReportItem,
  EligibleReportItem,
  StudentDetailsResponse,
  User,
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
  institution_name?: string
  company_name?: string
}): Promise<Student> {
  return request("/api/students", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getStudents(active?: boolean): Promise<Student[]> {
  const query = active !== undefined ? `?active=${active}` : ""
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
