import { useState } from "react"
import {
  ArrowUpDown,
  BarChart3,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getAttendanceSummary } from "@/services/api"
import type { AttendanceSummaryItem } from "@/types"
import { format, subDays } from "date-fns"

type SortKey = "name" | "attendance_percentage"

export default function ReportsPage() {
  const today = format(new Date(), "yyyy-MM-dd")
  const defaultFrom = format(subDays(new Date(), 30), "yyyy-MM-dd")

  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(today)
  const [data, setData] = useState<AttendanceSummaryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("attendance_percentage")
  const [sortAsc, setSortAsc] = useState(false)
  const [search, setSearch] = useState("")

  async function handleFetch() {
    setLoading(true)
    setError(null)
    try {
      const result = await getAttendanceSummary(from, to)
      setData(result)
      setFetched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report")
    } finally {
      setLoading(false)
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((a) => !a)
    } else {
      setSortKey(key)
      setSortAsc(key === "name")
    }
  }

  const filtered = data
    .filter((item) =>
      item.student_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aRate = Number(a.attendance_percentage) || 0
      const bRate = Number(b.attendance_percentage) || 0
      const mult = sortAsc ? 1 : -1
      if (sortKey === "name") {
        return mult * a.student_name.localeCompare(b.student_name)
      }
      return mult * (aRate - bRate)
    })

  function rateBadgeClass(pct: number) {
    if (pct >= 80) return "bg-primary/15 text-primary border-0 hover:bg-primary/20"
    if (pct >= 50) return "bg-amber-100 text-amber-700 border-0 hover:bg-amber-100"
    return "bg-destructive/10 text-destructive border-0 hover:bg-destructive/15"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View attendance summaries for any date range
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(e) => setTo(e.target.value)}
                className="w-44"
              />
            </div>
            <Button onClick={handleFetch} disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BarChart3 className="size-4" />
              )}
              {loading ? "Loading…" : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {(loading || fetched) && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">
                {loading ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  `${filtered.length} student${filtered.length !== 1 ? "s" : ""}`
                )}
              </CardTitle>
              {!loading && data.length > 0 && (
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search students…"
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="size-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="size-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium text-foreground">
                  {search ? "No students match your search" : "No data for this period"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search
                    ? "Try a different name."
                    : "Mark attendance for sessions in this date range."}
                </p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="hidden sm:flex items-center gap-4 px-6 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <div className="flex-1">
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => toggleSort("name")}
                    >
                      Student
                      <ArrowUpDown className="size-3" />
                    </button>
                  </div>
                  <div className="w-24 text-center">Sessions</div>
                  <div className="w-20 text-center">Present</div>
                  <div className="w-20 text-center">Absent</div>
                  <div className="w-24 text-right">
                    <button
                      className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                      onClick={() => toggleSort("attendance_percentage")}
                    >
                      Rate
                      <ArrowUpDown className="size-3" />
                    </button>
                  </div>
                </div>

                <div className="divide-y">
                  {filtered.map((item) => {
                    const rate = Number(item.attendance_percentage) || 0
                    return (
                    <div
                      key={item.student_id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 shrink-0 text-xs font-semibold text-primary">
                          {item.student_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">
                          {item.student_name}
                        </span>
                      </div>

                      {/* Mobile: compact stats */}
                      <div className="flex items-center gap-3 sm:contents">
                        <div className="sm:hidden flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{item.total_sessions} sessions</span>
                          <span>•</span>
                          <span className="text-primary font-medium">{item.present} present</span>
                          <span>•</span>
                          <span className="text-destructive font-medium">{item.absent} absent</span>
                        </div>

                        {/* Desktop stats */}
                        <div className="hidden sm:block w-24 text-center text-sm text-muted-foreground">
                          {item.total_sessions}
                        </div>
                        <div className="hidden sm:block w-20 text-center text-sm text-primary font-medium">
                          {item.present}
                        </div>
                        <div className="hidden sm:block w-20 text-center text-sm text-destructive font-medium">
                          {item.absent}
                        </div>

                        <div className="sm:w-24 sm:text-right">
                          <Badge
                            variant="secondary"
                            className={`${rateBadgeClass(rate)} text-xs font-semibold`}
                          >
                            {rate.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
