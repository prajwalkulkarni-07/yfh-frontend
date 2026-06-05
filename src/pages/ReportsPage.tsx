import { useEffect, useMemo, useState } from "react"
import { Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllStudentsReport, getClassReport, getEligibleReport, getInactiveReport, getPromotedReport, getStudentDetails, getYetToAttendTripReport, getYetToVolunteerReport } from "@/services/api"
import type { AllStudentsReportItem, ClassReportItem, EligibleReportItem, InactiveReportItem, PromotedReportItem, StudentDetailsResponse, StudentSessionDetail, YetToAttendTripReportItem, YetToVolunteerReportItem } from "@/types"
import { format } from "date-fns"

export default function ReportsPage() {
  const [inactive, setInactive] = useState<InactiveReportItem[]>([])
  const [eligible, setEligible] = useState<EligibleReportItem[]>([])
  const [yetToAttend, setYetToAttend] = useState<YetToAttendTripReportItem[]>([])
  const [yetToVolunteer, setYetToVolunteer] = useState<YetToVolunteerReportItem[]>([])
  const [classReport, setClassReport] = useState<ClassReportItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState("")
  const [promoted, setPromoted] = useState<PromotedReportItem[]>([])
  const [allStudents, setAllStudents] = useState<AllStudentsReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsData, setDetailsData] = useState<StudentDetailsResponse | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getInactiveReport(),
      getEligibleReport(),
      getYetToAttendTripReport(),
      getYetToVolunteerReport(),
      getClassReport(),
      getPromotedReport(),
      getAllStudentsReport(),
    ])
      .then(([inactiveData, eligibleData, yetToAttendData, yetToVolunteerData, classReportData, promotedData, allStudentsData]) => {
        setInactive(inactiveData)
        setEligible(eligibleData)
        setYetToAttend(yetToAttendData)
        setYetToVolunteer(yetToVolunteerData)
        setClassReport(classReportData)
        setSelectedClassId((current) => current || classReportData[0]?.class_id || "")
        setPromoted(promotedData)
        setAllStudents(allStudentsData)
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

  const formatAttendanceDates = (row: StudentSessionDetail) => {
    const dates = row.attended_dates?.length ? row.attended_dates : row.attended_on ? [row.attended_on] : []
    return dates.length > 0 ? dates.map(formatDate).join(", ") : "-"
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

  const escapeHtml = (value: string) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  }

  const downloadExcel = (filename: string, rows: string[][]) => {
    const excelFilename = filename.replace(/\.(csv|xlsx?)$/i, "") + ".xls"
    const tableRows = rows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
      .join("")
    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; }
            td { border: 1px solid #d9cba6; padding: 6px; mso-number-format:"\\@"; }
          </style>
        </head>
        <body><table>${tableRows}</table></body>
      </html>`
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = excelFilename
    link.click()
    URL.revokeObjectURL(url)
  }

  const getStatusClass = (value: string) =>
    ["Active", "Attended", "Done", "Promoted"].includes(value)
      ? "text-emerald-700"
      : "text-red-700"

  const renderStatus = (value: string) => (
    <span className={`font-medium ${getStatusClass(value)}`}>
      {value}
    </span>
  )

  const inactiveRows = useMemo(
    () => inactive.map((item) => [
      item.full_name,
      item.class_name ?? "-",
      formatDate(item.class_date),
      item.phone ?? "-",
    ]),
    [inactive]
  )

  const eligibleRows = useMemo(
    () => eligible.map((item) => [
      item.full_name,
      item.phone ?? "-",
      String(item.attended_classes ?? "-"),
    ]),
    [eligible]
  )

  const promotedRows = useMemo(
    () => promoted.map((item) => [
      item.full_name,
      item.phone ?? "-",
      formatDate(item.trip_date),
      formatDate(item.promoted_at),
    ]),
    [promoted]
  )

  const yetToAttendRows = useMemo(
    () => yetToAttend.map((item) => [
      item.full_name,
      item.phone ?? "-",
      String(item.attended_classes ?? "-"),
    ]),
    [yetToAttend]
  )

  const yetToVolunteerRows = useMemo(
    () => yetToVolunteer.map((item) => [
      item.full_name,
      item.phone ?? "-",
      String(item.attended_classes ?? "-"),
    ]),
    [yetToVolunteer]
  )

  const selectedClassReport = useMemo(
    () => classReport.find((item) => item.class_id === selectedClassId) ?? classReport[0],
    [classReport, selectedClassId]
  )

  const classReportRows = useMemo(
    () => (selectedClassReport?.students ?? []).map((item) => [
      item.full_name,
      item.phone ?? "-",
    ]),
    [selectedClassReport]
  )

  const allStudentClassHeaders = allStudents[0]?.classes ?? []

  const allStudentsRows = useMemo(
    () => allStudents.map((item) => [
      item.full_name,
      item.phone ?? "-",
      ...item.classes.map((classItem) => classItem.status),
      item.trip,
      item.volunteering,
      item.activity_status,
      item.promotion_status,
    ]),
    [allStudents]
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
            <TabsList className="h-auto flex-wrap justify-start">
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="eligible">Eligible for Volunteering</TabsTrigger>
              <TabsTrigger value="yet-to-attend">Yet to Attend Trip</TabsTrigger>
              <TabsTrigger value="yet-to-volunteer">Yet to Volunteer</TabsTrigger>
              <TabsTrigger value="by-class">Report by class</TabsTrigger>
              <TabsTrigger value="promoted">Promoted Students</TabsTrigger>
              <TabsTrigger value="all-students">All Students</TabsTrigger>
            </TabsList>

            <TabsContent value="inactive" className="mt-4">
              <div className="max-h-96 overflow-auto rounded-md border border-border/60">
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
                  onClick={() => downloadExcel(
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
              <div className="max-h-96 overflow-auto rounded-md border border-border/60">
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
                        <TableHead>Classes Attended</TableHead>
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
                          <TableCell>{item.attended_classes ?? "-"}</TableCell>
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
                  onClick={() => downloadExcel(
                    "eligible-volunteering.csv",
                    [["Name", "Phone No", "Classes Attended"], ...eligibleRows]
                  )}
                  disabled={loading || eligibleRows.length === 0}
                >
                  <Download className="size-4" />
                  Download Excel
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="yet-to-attend" className="mt-4">
              <div className="max-h-96 overflow-auto rounded-md border border-border/60">
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
                        <TableHead>Classes Attended</TableHead>
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
                          <TableCell>{item.attended_classes ?? "-"}</TableCell>
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
                  onClick={() => downloadExcel(
                    "yet-to-attend-trip.csv",
                    [["Name", "Phone No", "Classes Attended"], ...yetToAttendRows]
                  )}
                  disabled={loading || yetToAttendRows.length === 0}
                >
                  <Download className="size-4" />
                  Download Excel
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="yet-to-volunteer" className="mt-4">
              <div className="max-h-96 overflow-auto rounded-md border border-border/60">
                {loading ? (
                  <div className="divide-y">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))}
                  </div>
                ) : yetToVolunteer.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-muted-foreground">All eligible students have volunteered.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone No</TableHead>
                        <TableHead>Classes Attended</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yetToVolunteer.map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => openDetails(item.id)}
                        >
                          <TableCell>{item.full_name}</TableCell>
                          <TableCell>{item.phone ?? "-"}</TableCell>
                          <TableCell>{item.attended_classes ?? "-"}</TableCell>
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
                  onClick={() => downloadExcel(
                    "yet-to-volunteer.csv",
                    [["Name", "Phone No", "Classes Attended"], ...yetToVolunteerRows]
                  )}
                  disabled={loading || yetToVolunteerRows.length === 0}
                >
                  <Download className="size-4" />
                  Download Excel
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="by-class" className="mt-4">
              <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <Select value={selectedClassReport?.class_id ?? ""} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classReport.map((item) => (
                      <SelectItem key={item.class_id} value={item.class_id}>
                        {item.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadExcel(
                    `${selectedClassReport?.class_name ?? "class"}-not-attended.csv`,
                    [["Name", "Phone No"], ...classReportRows]
                  )}
                  disabled={loading || classReportRows.length === 0}
                >
                  <Download className="size-4" />
                  Download Excel
                </Button>
              </div>
              <div className="max-h-96 overflow-auto rounded-md border border-border/60">
                {loading ? (
                  <div className="divide-y">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))}
                  </div>
                ) : !selectedClassReport || selectedClassReport.students.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-muted-foreground">All students have attended this class.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone No</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedClassReport.students.map((item) => (
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
            </TabsContent>

            <TabsContent value="promoted" className="mt-4">
              <div className="max-h-96 overflow-auto rounded-md border border-border/60">
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
                  onClick={() => downloadExcel(
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

            <TabsContent value="all-students" className="mt-4">
              <div className="max-h-96 overflow-auto rounded-md border border-border/60">
                {loading ? (
                  <div className="divide-y">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))}
                  </div>
                ) : allStudents.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-muted-foreground">No students found.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone Number</TableHead>
                        {allStudentClassHeaders.map((classItem) => (
                          <TableHead key={classItem.class_id} className="text-center">{classItem.class_name}</TableHead>
                        ))}
                        <TableHead className="text-center">Trip</TableHead>
                        <TableHead className="text-center">Volunteering</TableHead>
                        <TableHead className="text-center">Activity Status</TableHead>
                        <TableHead className="text-center">Promotion Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStudents.map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => openDetails(item.id)}
                        >
                          <TableCell>{item.full_name}</TableCell>
                          <TableCell>{item.phone ?? "-"}</TableCell>
                          {item.classes.map((classItem) => (
                            <TableCell key={classItem.class_id} className="text-center">{renderStatus(classItem.status)}</TableCell>
                          ))}
                          <TableCell className="text-center">{renderStatus(item.trip)}</TableCell>
                          <TableCell className="text-center">{renderStatus(item.volunteering)}</TableCell>
                          <TableCell className="text-center">{renderStatus(item.activity_status)}</TableCell>
                          <TableCell className="text-center">{renderStatus(item.promotion_status)}</TableCell>
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
                  onClick={() => downloadExcel(
                    "all-students-report.csv",
                    [[
                      "Name",
                      "Phone Number",
                      ...allStudentClassHeaders.map((classItem) => classItem.class_name),
                      "Trip",
                      "Volunteering",
                      "Activity Status",
                      "Promotion Status",
                    ], ...allStudentsRows]
                  )}
                  disabled={loading || allStudentsRows.length === 0}
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
            <DialogTitle>
              {detailsData?.student.full_name ? `Student Details - ${detailsData.student.full_name}` : "Student Details"}
            </DialogTitle>
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
                      {row.status === "present" ? formatAttendanceDates(row) : "-"}
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
