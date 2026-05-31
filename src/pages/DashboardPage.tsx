import { useEffect, useState } from "react"
import {
  Users,
  UserCheck,
  CalendarDays,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getStudents, getSessions, getAttendanceSummary } from "@/services/api"
import { format } from "date-fns"
import { BHAGAVAD_GITA_QUOTES } from "@/data/bhagavadGitaQuotes"

interface Stats {
  totalStudents: number
  activeStudents: number
  lastSessionDate: string | null
  lastSessionName: string | null
  monthlyAttendanceRate: number | null
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const HERO_IMAGE_SRC = "/diety%20pic.png"

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
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const normalizeDateString = (value: string | null | undefined) => {
    if (!value) return null
    return value.split("T")[0].split(" ")[0]
  }

  const toSessionDate = (value: string | null | undefined) => {
    const dateOnly = normalizeDateString(value)
    if (!dateOnly) return null
    const [year, month, day] = dateOnly.split("-").map(Number)
    if (!year || !month || !day) return null
    const dateObj = new Date(year, month - 1, day)
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
          getSessions(),
        ])

        let monthlyAttendanceRate: number | null = null
        const todayKey = format(new Date(), "yyyy-MM-dd")
        const lastSession = sessions
          .flatMap((session) => {
            const dateKey = normalizeDateString(session.class_date)
            if (!dateKey || dateKey > todayKey) return []
            return [{ class_name: session.class_name, dateKey }]
          })
          .sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0] ?? null
        try {
          const today = new Date()
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          const summary = await getAttendanceSummary(
            format(monthStart, "yyyy-MM-dd"),
            format(today, "yyyy-MM-dd")
          )
          const totals = summary.reduce(
            (acc, item) => {
              acc.present += item.present
              acc.absent += item.absent
              return acc
            },
            { present: 0, absent: 0 }
          )
          const totalSessions = totals.present + totals.absent
          if (totalSessions > 0) {
            monthlyAttendanceRate = Math.round((totals.present / totalSessions) * 100)
          }
        } catch {
          // summary optional
        }

        setStats({
          totalStudents: allStudents.length,
          activeStudents: activeStudents.length,
          lastSessionDate: lastSession?.dateKey ?? null,
          lastSessionName: lastSession?.class_name ?? null,
          monthlyAttendanceRate,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const quoteIndex =
    BHAGAVAD_GITA_QUOTES.length > 0
      ? Math.floor(new Date().setHours(0, 0, 0, 0) / MS_PER_DAY) %
        BHAGAVAD_GITA_QUOTES.length
      : 0
  const dailyQuote =
    BHAGAVAD_GITA_QUOTES.length > 0 ? BHAGAVAD_GITA_QUOTES[quoteIndex] : null

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
              <img
                src={HERO_IMAGE_SRC}
                alt="Deity photo"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col justify-center space-y-3">
              <div className="text-base font-semibold text-foreground">Daily Wisdom</div>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : dailyQuote ? (
                <>
                  <p className="text-base italic text-foreground">"{dailyQuote.text}"</p>
                  {dailyQuote.source ? (
                    <p className="text-xs text-muted-foreground">{dailyQuote.source}</p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add your Bhagavad Gita quotes to start the daily rotation.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
                ? `${format(toSessionDate(stats.lastSessionDate) as Date, "EEEE")}${stats.lastSessionName ? ` · ${stats.lastSessionName}` : ""}`
                : "No sessions yet")
              : "No sessions yet"
          }
        />
        <StatCard
          title={`${format(new Date(), "MMMM")} Attendance`}
          value={stats?.monthlyAttendanceRate != null ? `${stats.monthlyAttendanceRate}%` : "—"}
          icon={TrendingUp}
          loading={loading}
          description="Average for current month"
        />
      </div>
    </div>
  )
}
