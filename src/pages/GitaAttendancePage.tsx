import { useEffect, useState, useCallback } from "react"
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  getGitaStudents,
  getGitaSessions,
  markGitaAttendance,
  getGitaAttendance,
  createGitaSession,
} from "@/services/api"
import type { GitaAttendanceSession, Student } from "@/types"
import { format } from "date-fns"

type AttendanceStatus = "present" | "absent"

interface AttendanceRow {
  student: Student
  status: AttendanceStatus
}

function getLatestSundayKey() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - date.getDay())
  return format(date, "yyyy-MM-dd")
}

export default function GitaAttendancePage() {
  const fallbackDate = getLatestSundayKey()
  const [selectedDate, setSelectedDate] = useState(fallbackDate)
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState("")
  const [sessions, setSessions] = useState<GitaAttendanceSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  const loadSessionList = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const data = await getGitaSessions()
      setSessions([...data].reverse())
    } catch {
      // ignore
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessionList()
  }, [loadSessionList])

  const loadAttendance = useCallback(async (date: string) => {
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const [allStudents, existingRecords] = await Promise.all([
        getGitaStudents(),
        getGitaAttendance({ session_date: date }).catch(() => []),
      ])

      const newRows: AttendanceRow[] = allStudents.map((student) => {
        const existing = existingRecords.find((r) => r.student_id === student.id)
        return {
          student,
          status: existing ? existing.status : "absent",
        }
      })
      setRows(newRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAttendance(selectedDate)
  }, [selectedDate, loadAttendance])

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRows((prev) =>
      prev.map((r) =>
        r.student.id === studentId
          ? { ...r, status }
          : r
      )
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await createGitaSession(selectedDate).catch(() => {})
      await markGitaAttendance(
        selectedDate,
        rows.map((r) => ({ student_id: r.student.id, status: r.status }))
      )
      setSaved(true)
      loadSessionList()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save attendance")
    } finally {
      setSaving(false)
    }
  }

  const normalizedSearch = search.trim().toLowerCase()
  const filteredRows = normalizedSearch
    ? rows.filter((row) => {
        const name = row.student.full_name.toLowerCase()
        const phone = row.student.phone ?? ""
        return name.includes(normalizedSearch) || phone.includes(normalizedSearch)
      })
    : rows

  const presentCount = filteredRows.filter((r) => r.status === "present").length
  const absentCount = filteredRows.filter((r) => r.status === "absent").length

  const toSessionDate = (value: string | null | undefined) => {
    if (!value) return null
    const dateOnly = value.split("T")[0]
    const dateObj = new Date(`${dateOnly}T00:00:00`)
    return Number.isNaN(dateObj.getTime()) ? null : dateObj
  }

  const selectedDateObj = toSessionDate(selectedDate) ?? new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isSunday = (date: Date) => date.getDay() === 0

  const toDateKey = (date: Date) => format(date, "yyyy-MM-dd")
  const getNextSunday = (date: Date) => {
    const result = new Date(date)
    const day = result.getDay()
    const diff = (7 - day) % 7
    result.setDate(result.getDate() + diff)
    result.setHours(0, 0, 0, 0)
    return result
  }

  const generateUpcomingSessions = (count: number): GitaAttendanceSession[] => {
    const start = new Date(today)
    start.setDate(start.getDate() + 1)
    let cursor = getNextSunday(start)
    const upcoming: GitaAttendanceSession[] = []
    while (upcoming.length < count) {
      const session_date = toDateKey(cursor)
      upcoming.push({
        id: `future-${session_date}`,
        session_date,
        day_of_week: "Sunday",
      })
      cursor = getNextSunday(new Date(cursor.getTime() + 24 * 60 * 60 * 1000))
    }
    return upcoming
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Bhagavad Gita Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mark attendance for Sunday sessions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1.5">
                  <Label htmlFor="session-date">Session Date (Sunday only)</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="session-date"
                          variant="outline"
                          className="w-52 justify-between border-border/60 bg-muted/40 font-medium"
                        >
                          <span>{format(selectedDateObj, "MMM d, yyyy")}</span>
                          <CalendarDays className="size-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDateObj}
                          disabled={(date) => date > today || !isSunday(date)}
                          onSelect={(date) => {
                            if (!date) return
                            setSelectedDate(format(date, "yyyy-MM-dd"))
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {isSunday(selectedDateObj) ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Sunday Session
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                        Select a Sunday
                      </div>
                    )}
                  </div>
                </div>
                {!loading && rows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="font-semibold text-emerald-600">{presentCount}</span> present
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="font-semibold text-red-600">{absentCount}</span> absent
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {saveError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {saveError}
                </div>
              )}

              {saved && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-100 rounded-lg px-3 py-2 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Attendance saved successfully
                </div>
              )}

              {rows.length > 0 && (
                <Input
                  id="attendance-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search students"
                  className="max-w-sm"
                  aria-label="Search students"
                />
              )}

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarDays className="size-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm font-medium text-foreground">No promoted students found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Promote students in Yoga for Happiness to add them here.
                  </p>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarDays className="size-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm font-medium text-foreground">No students match your search</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different name or phone number.
                  </p>
                </div>
              ) : (
                <div className="max-h-[28rem] overflow-y-auto pr-1 space-y-2">
                  {filteredRows.map(({ student, status }) => (
                    <div
                      key={student.id}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border transition-all text-left ${
                        status === "present"
                          ? "border-emerald-400/40 bg-emerald-50/60 hover:bg-emerald-100/60"
                          : "border-border bg-muted/20 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-center size-9 rounded-full bg-background border shrink-0 text-xs font-semibold text-muted-foreground">
                        {student.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <span className="flex-1 text-sm font-medium text-foreground truncate">
                        {student.full_name}
                      </span>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={status === "present"}
                          onCheckedChange={(checked) =>
                            setStatus(student.id, checked ? "present" : "absent")
                          }
                          className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500"
                          aria-label={`Mark ${student.full_name} as ${status === "present" ? "present" : "absent"}`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            status === "present"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {status === "present" ? "Present" : "Absent"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {rows.length > 0 && (
              <div className="flex justify-end px-6 pb-6">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {saving ? "Saving…" : "Save Attendance"}
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Sundays</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {generateUpcomingSessions(4).map((session) => {
                  const d = toSessionDate(session.session_date)
                  if (!d) return null
                  return (
                    <button
                      key={session.id}
                      disabled
                      title="Attendance cannot be taken for a future date"
                      className="w-full flex items-center gap-3 px-4 py-3 text-left opacity-60 cursor-not-allowed"
                    >
                      <div className="flex items-center justify-center size-8 rounded-md shrink-0 bg-muted">
                        <CalendarDays className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {format(d, "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">Sunday</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Past Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sessionsLoading ? (
                <div className="space-y-2 px-4 pb-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center px-4">
                  <CalendarDays className="size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No sessions recorded yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {sessions.filter((session) => {
                    const d = toSessionDate(session.session_date)
                    return d && d <= today
                  }).slice(0, 4).map((session) => {
                    const d = toSessionDate(session.session_date)
                    if (!d) return null
                    const isSelected = session.session_date === selectedDate
                    return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedDate(session.session_date)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                          isSelected ? "bg-emerald-50" : ""
                        }`}
                      >
                        <div className={`flex items-center justify-center size-8 rounded-md shrink-0 ${isSelected ? "bg-emerald-100" : "bg-muted"}`}>
                          <CalendarDays className={`size-4 ${isSelected ? "text-emerald-700" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? "text-emerald-700" : "text-foreground"}`}>
                            {format(d, "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">Sunday</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
