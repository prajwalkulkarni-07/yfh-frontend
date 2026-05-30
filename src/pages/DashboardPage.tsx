import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users,
  UserCheck,
  CalendarDays,
  TrendingUp,
  CalendarCheck,
  UserPlus,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getStudents, getSessions, getAttendanceSummary } from "@/services/api"
import { format, subDays } from "date-fns"

interface Stats {
  totalStudents: number
  activeStudents: number
  lastSessionDate: string | null
  attendanceRate: number | null
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  description,
  accent,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  loading?: boolean
  description?: string
  accent?: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`flex items-center justify-center size-8 rounded-lg ${accent ? "bg-primary/15" : "bg-muted"}`}>
            <Icon className={`size-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className="h-8 w-24 mt-1" />
        ) : (
          <>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentSessions, setRecentSessions] = useState<{ id: string; class_date: string }[]>([])

  const toSessionDate = (value: string | null | undefined) => {
    if (!value) return null
    const dateOnly = value.split("T")[0]
    const dateObj = new Date(`${dateOnly}T00:00:00`)
    return Number.isNaN(dateObj.getTime()) ? null : dateObj
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [allStudents, activeStudents, sessions] = await Promise.all([
          getStudents(),
          getStudents(true),
          getSessions(
            format(subDays(new Date(), 30), "yyyy-MM-dd"),
            format(new Date(), "yyyy-MM-dd")
          ),
        ])

        const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null
        setRecentSessions(sessions.slice(-5).reverse())

        let attendanceRate: number | null = null
        if (sessions.length > 0 && activeStudents.length > 0) {
          try {
            const summary = await getAttendanceSummary(
              format(subDays(new Date(), 30), "yyyy-MM-dd"),
              format(new Date(), "yyyy-MM-dd")
            )
            if (summary.length > 0) {
              const avg =
                summary.reduce((acc, s) => acc + (Number(s.attendance_percentage) || 0), 0) /
                summary.length
              attendanceRate = Math.round(avg)
            }
          } catch {
            // summary optional
          }
        }

        setStats({
          totalStudents: allStudents.length,
          activeStudents: activeStudents.length,
          lastSessionDate: lastSession?.class_date ?? null,
          attendanceRate,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back. Here's an overview of your classes.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          loading={loading}
          description="Registered in the system"
        />
        <StatCard
          title="Active Students"
          value={stats?.activeStudents ?? 0}
          icon={UserCheck}
          loading={loading}
          accent
          description="Currently enrolled"
        />
        <StatCard
          title="Last Session"
          value={
            stats?.lastSessionDate
              ? (toSessionDate(stats.lastSessionDate)
                ? format(toSessionDate(stats.lastSessionDate) as Date, "MMM d, yyyy")
                : "—")
              : "—"
          }
          icon={CalendarDays}
          loading={loading}
          description={
            stats?.lastSessionDate
              ? (toSessionDate(stats.lastSessionDate)
                ? format(toSessionDate(stats.lastSessionDate) as Date, "EEEE")
                : "No sessions yet")
              : "No sessions yet"
          }
        />
        <StatCard
          title="Attendance Rate"
          value={stats?.attendanceRate != null ? `${stats.attendanceRate}%` : "—"}
          icon={TrendingUp}
          loading={loading}
          description="Last 30 days average"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/attendance")} size="lg">
          <CalendarCheck />
          Mark Attendance
        </Button>
        <Button variant="outline" onClick={() => navigate("/students")} size="lg">
          <UserPlus />
          Add Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No sessions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mark attendance for your first class to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => {
                const date = toSessionDate(session.class_date)
                if (!date) return null
                const dayName = format(date, "EEEE")
                const isFriSat = dayName === "Friday" || dayName === "Saturday"
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/attendance?date=${session.class_date}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
                        <CalendarCheck className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {format(date, "MMMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">{dayName}</p>
                      </div>
                    </div>
                    {isFriSat && (
                      <Badge variant="secondary" className="text-xs">
                        Weekly class
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
