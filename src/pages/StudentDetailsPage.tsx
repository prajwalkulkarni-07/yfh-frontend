import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Save, AlertCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteStudent, getStudentDetails, updateStudent } from "@/services/api"
import type { Student, StudentDetailsResponse, StudentSessionDetail, StudentType } from "@/types"
import { format } from "date-fns"

interface StudentFormData {
  full_name: string
  phone: string
  age: string
  student_type: StudentType | ""
  college_name: string
  branch: string
  semester: string
  company_name: string
  designation: string
  experience: string
  description: string
}

const EMPTY_FORM: StudentFormData = {
  full_name: "",
  phone: "",
  age: "",
  student_type: "",
  college_name: "",
  branch: "",
  semester: "",
  company_name: "",
  designation: "",
  experience: "",
  description: "",
}

export default function StudentDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [details, setDetails] = useState<StudentDetailsResponse | null>(null)
  const [formData, setFormData] = useState<StudentFormData>(EMPTY_FORM)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    getStudentDetails(id)
      .then((data) => {
        setDetails(data)
        setFormData({
          full_name: data.student.full_name ?? "",
          phone: data.student.phone ?? "",
          age: data.student.age ? String(data.student.age) : "",
          student_type: data.student.student_type ?? "",
          college_name: data.student.college_name ?? "",
          branch: data.student.branch ?? "",
          semester: data.student.semester !== undefined && data.student.semester !== null ? String(data.student.semester) : "",
          company_name: data.student.company_name ?? "",
          designation: data.student.designation ?? "",
          experience: data.student.experience !== undefined && data.student.experience !== null ? String(data.student.experience) : "",
          description: data.student.description ?? "",
        })
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load student details")
      })
      .finally(() => setLoading(false))
  }, [id])

  const attendanceRows = useMemo(() => {
    return details?.sessions ?? []
  }, [details])

  const promotionStatus = details?.promotion_status
  const tripHistory = details?.trips ?? []
  const volunteeringHistory = details?.volunteering ?? []

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

  const handleSave = async () => {
    if (!id) return
    if (!formData.full_name.trim()) {
      setFormError("Name is required")
      return
    }
    if (!formData.phone.trim()) {
      setFormError("Phone number is required")
      return
    }
    const parsedAge = Number(formData.age)
    if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
      setFormError("Age must be a positive number")
      return
    }
    if (!formData.student_type) {
      setFormError("Student type is required")
      return
    }
    if (formData.student_type === "studying" && !formData.college_name.trim()) {
      setFormError("College name is required")
      return
    }
    if (formData.student_type === "studying" && !formData.branch.trim()) {
      setFormError("Branch is required")
      return
    }
    const parsedSemester = Number(formData.semester)
    if (formData.student_type === "studying" && (!Number.isFinite(parsedSemester) || parsedSemester <= 0)) {
      setFormError("Semester must be a positive number")
      return
    }
    if (formData.student_type === "working" && !formData.company_name.trim()) {
      setFormError("Company name is required")
      return
    }
    if (formData.student_type === "working" && !formData.designation.trim()) {
      setFormError("Designation is required")
      return
    }
    const parsedExperience = Number(formData.experience)
    if (formData.student_type === "working" && (!Number.isFinite(parsedExperience) || parsedExperience < 0)) {
      setFormError("Experience must be a non-negative number")
      return
    }
    if (formData.student_type === "not_studying_not_working" && !formData.description.trim()) {
      setFormError("Description is required")
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload: Partial<Student> = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        age: parsedAge,
        student_type: formData.student_type,
        college_name:
          formData.student_type === "studying"
            ? formData.college_name.trim()
            : undefined,
        branch:
          formData.student_type === "studying"
            ? formData.branch.trim()
            : undefined,
        semester:
          formData.student_type === "studying"
            ? parsedSemester
            : undefined,
        company_name:
          formData.student_type === "working"
            ? formData.company_name.trim()
            : undefined,
        designation:
          formData.student_type === "working"
            ? formData.designation.trim()
            : undefined,
        experience:
          formData.student_type === "working"
            ? parsedExperience
            : undefined,
        description:
          formData.student_type === "not_studying_not_working"
            ? formData.description.trim()
            : undefined,
      }
      const updated = await updateStudent(id, payload)
      setDetails((prev) =>
        prev ? { ...prev, student: updated } : prev
      )
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save student")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteStudent(id)
      setDeleteOpen(false)
      navigate("/students")
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete student")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Student Details</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and update student profile and attendance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog
            open={deleteOpen}
            onOpenChange={(open) => {
              if (deleting) return
              setDeleteOpen(open)
              if (!open) setDeleteError(null)
            }}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="size-4" />
                Delete Student
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this student?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All attendance records for this student will be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {deleteError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
                  <AlertCircle className="size-4 shrink-0" />
                  {deleteError}
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={(event) => {
                    event.preventDefault()
                    handleDelete()
                  }}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
                  {deleting ? "Deleting…" : "Delete Student"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" onClick={() => navigate("/students")}>
            <ArrowLeft className="size-4" />
            Back to Students
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-full rounded-md bg-muted" />
              ))}
            </div>
          ) : details ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min={1}
                  value={formData.age}
                  onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Student Type *</Label>
                <Select
                  value={formData.student_type}
                  onValueChange={(value) =>
                    setFormData((p) => ({
                      ...p,
                      student_type: value as StudentType,
                        college_name: value === "studying" ? p.college_name : "",
                        branch: value === "studying" ? p.branch : "",
                        semester: value === "studying" ? p.semester : "",
                        company_name: value === "working" ? p.company_name : "",
                        designation: value === "working" ? p.designation : "",
                        experience: value === "working" ? p.experience : "",
                        description: value === "not_studying_not_working" ? p.description : "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studying">Studying</SelectItem>
                    <SelectItem value="working">Working</SelectItem>
                    <SelectItem value="not_studying_not_working">Not Studying/Not Working</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.student_type === "studying" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="college_name">College Name *</Label>
                  <Input
                    id="college_name"
                    value={formData.college_name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, college_name: e.target.value }))
                    }
                  />
                </div>
              )}
              {formData.student_type === "studying" && (
                <>
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="branch">Branch *</Label>
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) => setFormData((p) => ({ ...p, branch: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="semester">Semester *</Label>
                    <Input
                      id="semester"
                      type="number"
                      min={1}
                      value={formData.semester}
                      onChange={(e) => setFormData((p) => ({ ...p, semester: e.target.value }))}
                    />
                  </div>
                </>
              )}
              {formData.student_type === "working" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, company_name: e.target.value }))
                    }
                  />
                </div>
              )}
              {formData.student_type === "working" && (
                <>
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="designation">Designation *</Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData((p) => ({ ...p, designation: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="experience">Experience (Years) *</Label>
                    <Input
                      id="experience"
                      type="number"
                      min={0}
                      step="0.1"
                      value={formData.experience}
                      onChange={(e) => setFormData((p) => ({ ...p, experience: e.target.value }))}
                    />
                  </div>
                </>
              )}
              {formData.student_type === "not_studying_not_working" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="preparing for govt exams"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                </div>
              )}
              <div className="space-y-2 sm:col-span-2">
                <Label>Promotion Status</Label>
                <div className="rounded-md border border-border/60 px-3 py-2 text-sm">
                  {!promotionStatus ? (
                    <span className="text-muted-foreground">No promotion data yet</span>
                  ) : promotionStatus.promoted ? (
                    <span className="font-medium text-blue-700 dark:text-blue-300">Promoted</span>
                  ) : (
                    <span className="font-medium text-muted-foreground">{promotionStatus.summary}</span>
                  )}
                </div>
              </div>
              {formError && (
                <p className="text-sm text-destructive sm:col-span-2">{formError}</p>
              )}
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trip History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-full rounded-md bg-muted" />
              ))}
            </div>
          ) : tripHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Yet to attend a trip.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip Date</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Recorded On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tripHistory.map((row) => (
                  <TableRow key={`${row.trip_date ?? "trip"}-${row.recorded_at ?? "recorded"}`}>
                    <TableCell>{formatDate(row.trip_date)}</TableCell>
                    <TableCell>{row.details ?? "-"}</TableCell>
                    <TableCell>{formatDate(row.recorded_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volunteering History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-full rounded-md bg-muted" />
              ))}
            </div>
          ) : volunteeringHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Yet to volunteer.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Date</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Recorded On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volunteeringHistory.map((row) => (
                  <TableRow key={`${row.service_date ?? "service"}-${row.recorded_at ?? "recorded"}`}>
                    <TableCell>{formatDate(row.service_date)}</TableCell>
                    <TableCell>{row.details ?? "-"}</TableCell>
                    <TableCell>{formatDate(row.recorded_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Class Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-full rounded-md bg-muted" />
              ))}
            </div>
          ) : attendanceRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attended On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRows.map((row: StudentSessionDetail) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
