import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Save,
  CheckCheck,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  getStudents,
  getSessions,
  markAttendance,
  getAttendance,
  createSession,
} from "@/services/api"
import type { Student } from "@/types"
import { format } from "date-fns"

type AttendanceStatus = "present" | "absent"

interface AttendanceRow {
  student: Student
  status: AttendanceStatus
}

export default function AttendancePage() {
  const [searchParams] = useSearchParams()
  const fallbackDate = format(new Date(), "yyyy-MM-dd")
  const queryDate = searchParams.get("date")
  const defaultDate = queryDate && !Number.isNaN(new Date(queryDate).getTime())
    ? queryDate
    : fallbackDate

  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [sessions, setSessions] = useState<{ id: string; class_date: string }[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  const loadSessionList = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const data = await getSessions()
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
      const [activeStudents, existingRecords] = await Promise.all([
        getStudents(true),
        getAttendance({ class_date: date }).catch(() => []),
      ])

      const newRows: AttendanceRow[] = activeStudents.map((student) => {
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

  function toggle(studentId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.student.id === studentId
          ? { ...r, status: r.status === "present" ? "absent" : "present" }
          : r
      )
    )
  }

  function markAll(status: AttendanceStatus) {
    setRows((prev) => prev.map((r) => ({ ...r, status })))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      // Ensure a session exists for this date
      await createSession(selectedDate).catch(() => {})
      await markAttendance(
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

  const presentCount = rows.filter((r) => r.status === "present").length
  const absentCount = rows.filter((r) => r.status === "absent").length

  const toSessionDate = (value: string | null | undefined) => {
    if (!value) return null
    const dateOnly = value.split("T")[0]
    const dateObj = new Date(`${dateOnly}T00:00:00`)
    return Number.isNaN(dateObj.getTime()) ? null : dateObj
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mark and manage attendance for each session
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main attendance area */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1.5">
                  <Label htmlFor="session-date">Session Date</Label>
                  <Input
                    id="session-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-44"
                  />
                </div>
                {!loading && rows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">{presentCount}</span> present
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="font-semibold text-destructive">{absentCount}</span> absent
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!loading && rows.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAll("present")}
                  >
                    <CheckCheck className="size-4" />
                    Mark All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAll("absent")}
                  >
                    <Ban className="size-4" />
                    Mark All Absent
                  </Button>
                </div>
              )}

              {saveError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {saveError}
                </div>
              )}

              {saved && (
                <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg px-3 py-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Attendance saved successfully
                </div>
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
                  <p className="text-sm font-medium text-foreground">No active students</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add active students to mark attendance.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rows.map(({ student, status }) => (
                    <button
                      key={student.id}
                      onClick={() => toggle(student.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border transition-all text-left ${
                        status === "present"
                          ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                          : "border-border bg-muted/20 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-center size-9 rounded-full bg-background border shrink-0 text-xs font-semibold text-muted-foreground">
                        {student.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <span className="flex-1 text-sm font-medium text-foreground truncate">
                        {student.full_name}
                      </span>
                      {status === "present" ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                          <CheckCircle2 className="size-4" />
                          Present
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <XCircle className="size-4" />
                          Absent
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {rows.length > 0 && (
                <div className="flex justify-end pt-2">
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
            </CardContent>
          </Card>
        </div>

        {/* Past sessions sidebar */}
        <div>
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
                <div className="divide-y max-h-96 overflow-y-auto">
                  {sessions.map((session) => {
                    const d = toSessionDate(session.class_date)
                    if (!d) return null
                    const isSelected = session.class_date === selectedDate
                    const dow = format(d, "EEEE")
                    return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedDate(session.class_date)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className={`flex items-center justify-center size-8 rounded-md shrink-0 ${isSelected ? "bg-primary/15" : "bg-muted"}`}>
                          <CalendarDays className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {format(d, "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">{dow}</p>
                        </div>
                        {(dow === "Friday" || dow === "Saturday") && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            Class
                          </Badge>
                        )}
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
