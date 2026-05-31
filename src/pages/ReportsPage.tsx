import { useEffect, useMemo, useState } from "react"
import { Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getEligibleReport, getInactiveReport, getPromotedReport, getStudentDetails, getYetToAttendTripReport } from "@/services/api"
import type { EligibleReportItem, InactiveReportItem, PromotedReportItem, StudentDetailsResponse, StudentSessionDetail, YetToAttendTripReportItem } from "@/types"
import { format } from "date-fns"

export default function ReportsPage() {
  const [inactive, setInactive] = useState<InactiveReportItem[]>([])
  const [eligible, setEligible] = useState<EligibleReportItem[]>([])
  const [yetToAttend, setYetToAttend] = useState<YetToAttendTripReportItem[]>([])
  const [promoted, setPromoted] = useState<PromotedReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsData, setDetailsData] = useState<StudentDetailsResponse | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([getInactiveReport(), getEligibleReport(), getYetToAttendTripReport(), getPromotedReport()])
      .then(([inactiveData, eligibleData, yetToAttendData, promotedData]) => {
        setInactive(inactiveData)
        setEligible(eligibleData)
        setYetToAttend(yetToAttendData)
        setPromoted(promotedData)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load reports")
      })
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "-"
    const dateObj = new Date(value.includes("T") ? value : `${value}T00:00:00`)
    if (Number.isNaN(dateObj.getTime())) return "-"
    return format(dateObj, "MMM d, yyyy")
  }

  const openDetails = async (studentId: string) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const data = await getStudentDetails(studentId)
      setDetailsData(data)
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Failed to load student details")
    } finally {
      setDetailsLoading(false)
    }
  }

  const toCsv = (rows: string[][]) => {
    const escapeCell = (cell: string) => {
      const safe = String(cell ?? "")
      if (safe.includes("\"") || safe.includes(",") || safe.includes("\n")) {
        return `"${safe.replace(/"/g, '""')}"`
      }
      return safe
    }
    return rows.map((row) => row.map(escapeCell).join(",")).join("\n")
  }

  const downloadCsv = (filename: string, rows: string[][]) => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const inactiveRows = useMemo(
    () => inactive.map((item) => [
      item.full_name,
      item.class_name ?? "-",
      formatDate(item.class_date),
      item.phone ? `\t${item.phone}` : "-",
    ]),
    [inactive]
  )

  const eligibleRows = useMemo(
    () => eligible.map((item) => [
      item.full_name,
      item.phone ? `\t${item.phone}` : "-",
    ]),
    [eligible]
  )

  const promotedRows = useMemo(
    () => promoted.map((item) => [
      item.full_name,
      item.phone ? `\t${item.phone}` : "-",
      formatDate(item.trip_date),
      formatDate(item.promoted_at),
    ]),
    [promoted]
  )

  const yetToAttendRows = useMemo(
    () => yetToAttend.map((item) => [
      item.full_name,
      item.phone ? `\t${item.phone}` : "-",
    ]),
    [yetToAttend]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track inactivity, volunteering eligibility, and promotions
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inactive" className="w-full">
            <TabsList>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="eligible">Eligible for Volunteering</TabsTrigger>
              <TabsTrigger value="yet-to-attend">Yet to Attend Trip</TabsTrigger>
              <TabsTrigger value="promoted">Promoted Students</TabsTrigger>
            </TabsList>

            <TabsContent value="inactive" className="mt-4">
              <div className="max-h-96 overflow-y-auto rounded-md border border-border/60">
                {loading ? (
                  <div className="divide-y">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))}
                  </div>
                ) : inactive.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-muted-foreground">No inactive students.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Last Class Attended</TableHead>
                        <TableHead>Attended On</TableHead>
                        <TableHead>Phone No</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inactive.map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => openDetails(item.id)}
                        >
                          <TableCell>{item.full_name}</TableCell>
                          <TableCell>{item.class_name ?? "-"}</TableCell>
                          <TableCell>{formatDate(item.class_date)}</TableCell>
                          <TableCell>{item.phone ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="flex justify-end pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCsv(
                    "inactive-students.csv",
                    [["Name", "Last Class Attended", "Last Class Attended On", "Phone No"], ...inactiveRows]
                  )}
                  disabled={loading || inactiveRows.length === 0}
                >
                  <Download className="size-4" />
                  Download Excel
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="eligible" className="mt-4">
              <div className="max-h-96 overflow-y-auto rounded-md border border-border/60">
                {loading ? (
                  <div className="divide-y">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))}
                  </div>
                ) : eligible.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-muted-foreground">No eligible students.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone No</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eligible.map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => openDetails(item.id)}
                        >
                          <TableCell>{item.full_name}</TableCell>
                          <TableCell>{item.phone ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="flex justify-end pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCsv(
                    "eligible-volunteering.csv",
                    [["Name", "Phone No"], ...eligibleRows]
                  )}
                  disabled={loading || eligibleRows.length === 0}
                >
                  <Download className="size-4" />
                  Download Excel
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="yet-to-attend" className="mt-4">
              <div className="max-h-96 overflow-y-auto rounded-md border border-border/60">
                {loading ? (
                  <div className="divide-y">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))}
                  </div>
                ) : yetToAttend.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-muted-foreground">All eligible students have attended a trip.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone No</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yetToAttend.map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => openDetails(item.id)}
                        >
                          <TableCell>{item.full_name}</TableCell>
                          <TableCell>{item.phone ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="flex justify-end pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCsv(
                    "yet-to-attend-trip.csv",
                    [["Name", "Phone No"], ...yetToAttendRows]
                  )}
                  disabled={loading || yetToAttendRows.length === 0}
                >
                  <Download className="size-4" />
                  Download Excel
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="promoted" className="mt-4">
              <div className="max-h-96 overflow-y-auto rounded-md border border-border/60">
                {loading ? (
                  <div className="divide-y">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))}
                  </div>
                ) : promoted.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-muted-foreground">No promoted students yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone No</TableHead>
                        <TableHead>Trip Date</TableHead>
                        <TableHead>Promoted On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promoted.map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => openDetails(item.id)}
                        >
                          <TableCell>{item.full_name}</TableCell>
                          <TableCell>{item.phone ?? "-"}</TableCell>
                          <TableCell>{formatDate(item.trip_date)}</TableCell>
                          <TableCell>{formatDate(item.promoted_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="flex justify-end pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCsv(
                    "promoted-students.csv",
                    [["Name", "Phone No", "Trip Date", "Promoted On"], ...promotedRows]
                  )}
                  disabled={loading || promotedRows.length === 0}
                >
                  <Download className="size-4" />
                  Download Excel
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsOpen(false)
            setDetailsData(null)
            setDetailsError(null)
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              View class attendance for the selected student.
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : detailsError ? (
            <p className="text-sm text-destructive">{detailsError}</p>
          ) : detailsData ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attended On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailsData.sessions.map((row: StudentSessionDetail) => (
                  <TableRow key={row.class_id ?? row.class_name ?? "class"}>
                    <TableCell>{row.class_name ?? "Class"}</TableCell>
                    <TableCell>
                      {row.status === "present" ? (
                        <span className="text-emerald-600 font-medium">Attended</span>
                      ) : (
                        <span className="text-red-600 font-medium">Not Attended</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.status === "present" ? formatDate(row.attended_on) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
