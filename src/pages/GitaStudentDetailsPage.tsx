import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, AlertCircle, CalendarDays, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Skeleton } from "@/components/ui/skeleton"
import { getGitaStudent, getGitaStudentAttendance, updateStudent } from "@/services/api"
import type { GitaAttendanceRow, Student, StudentType } from "@/types"
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

const getStudentTypeLabel = (type?: Student["student_type"] | null) => {
  if (type === "studying") return "Studying"
  if (type === "working") return "Working"
  if (type === "not_studying_not_working") return "Preparing for govt exams"
  return "-"
}

const getFormData = (student: Student): StudentFormData => ({
  full_name: student.full_name ?? "",
  phone: student.phone ?? "",
  age: student.age ? String(student.age) : "",
  student_type: student.student_type ?? "",
  college_name: student.college_name ?? "",
  branch: student.branch ?? "",
  semester:
    student.semester !== undefined && student.semester !== null
      ? String(student.semester)
      : "",
  company_name: student.company_name ?? "",
  designation: student.designation ?? "",
  experience:
    student.experience !== undefined && student.experience !== null
      ? String(student.experience)
      : "",
  description: student.description ?? "",
})

export default function GitaStudentDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [student, setStudent] = useState<Student | null>(null)
  const [attendance, setAttendance] = useState<GitaAttendanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState<StudentFormData>(EMPTY_FORM)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    Promise.all([getGitaStudent(id), getGitaStudentAttendance(id)])
      .then(([studentData, attendanceData]) => {
        setStudent(studentData)
        setFormData(getFormData(studentData))
        setAttendance(attendanceData)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load student details")
      })
      .finally(() => setLoading(false))
  }, [id])

  const formatDate = (value: string) => {
    const dateObj = new Date(value.includes("T") ? value : `${value}T00:00:00`)
    if (Number.isNaN(dateObj.getTime())) return value
    return format(dateObj, "MMM d, yyyy")
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
    if (
      formData.student_type === "studying" &&
      (!Number.isFinite(parsedSemester) || parsedSemester <= 0)
    ) {
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
    if (
      formData.student_type === "working" &&
      (!Number.isFinite(parsedExperience) || parsedExperience < 0)
    ) {
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
          formData.student_type === "studying" ? formData.branch.trim() : undefined,
        semester: formData.student_type === "studying" ? parsedSemester : undefined,
        company_name:
          formData.student_type === "working"
            ? formData.company_name.trim()
            : undefined,
        designation:
          formData.student_type === "working"
            ? formData.designation.trim()
            : undefined,
        experience:
          formData.student_type === "working" ? parsedExperience : undefined,
        description:
          formData.student_type === "not_studying_not_working"
            ? formData.description.trim()
            : undefined,
      }
      const updated = await updateStudent(id, payload)
      setStudent(updated)
      setFormData(getFormData(updated))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save student")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bhagavad Gita Student</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Attendance record for promoted student
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/gita/students")}
        >
          <ArrowLeft className="size-4" />
          Back to students
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : student ? (
            <div className="space-y-5">
              <div>
                <div className="text-lg font-semibold text-foreground">{student.full_name}</div>
                <div className="text-sm text-muted-foreground">
                  {getStudentTypeLabel(student.student_type)}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gita-full-name">Name *</Label>
                  <Input
                    id="gita-full-name"
                    value={formData.full_name}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, full_name: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gita-phone">Phone *</Label>
                  <Input
                    id="gita-phone"
                    value={formData.phone}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gita-age">Age *</Label>
                  <Input
                    id="gita-age"
                    type="number"
                    min={1}
                    value={formData.age}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, age: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Student Type *</Label>
                  <Select
                    value={formData.student_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        student_type: value as StudentType,
                        college_name: value === "studying" ? prev.college_name : "",
                        branch: value === "studying" ? prev.branch : "",
                        semester: value === "studying" ? prev.semester : "",
                        company_name: value === "working" ? prev.company_name : "",
                        designation: value === "working" ? prev.designation : "",
                        experience: value === "working" ? prev.experience : "",
                        description: value === "not_studying_not_working" ? prev.description : "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studying">Studying</SelectItem>
                      <SelectItem value="working">Working</SelectItem>
                      <SelectItem value="not_studying_not_working">Preparing for govt exams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.student_type === "studying" && (
                  <>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="gita-college">College Name *</Label>
                      <Input
                        id="gita-college"
                        value={formData.college_name}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            college_name: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gita-branch">Branch *</Label>
                      <Input
                        id="gita-branch"
                        value={formData.branch}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, branch: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gita-semester">Semester *</Label>
                      <Input
                        id="gita-semester"
                        type="number"
                        min={1}
                        value={formData.semester}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            semester: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </>
                )}
                {formData.student_type === "working" && (
                  <>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="gita-company">Company Name *</Label>
                      <Input
                        id="gita-company"
                        value={formData.company_name}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            company_name: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gita-designation">Designation *</Label>
                      <Input
                        id="gita-designation"
                        value={formData.designation}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            designation: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gita-experience">Experience (Years) *</Label>
                      <Input
                        id="gita-experience"
                        type="number"
                        min={0}
                        step="0.1"
                        value={formData.experience}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            experience: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </>
                )}
                {formData.student_type === "not_studying_not_working" && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="gita-description">Description *</Label>
                    <Textarea
                      id="gita-description"
                      placeholder="preparing for govt exams"
                      value={formData.description}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>
                )}

                <div className="space-y-1 sm:col-span-2">
                  <div className="text-xs font-medium text-muted-foreground">Promoted On</div>
                  <div className="text-sm font-medium text-foreground">
                    {student.promoted_at ? formatDate(student.promoted_at) : "-"}
                  </div>
                </div>

                {formError && (
                  <p className="text-sm text-destructive sm:col-span-2">{formError}</p>
                )}

                <div className="flex justify-end sm:col-span-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No student found</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : attendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarDays className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No attendance marked yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((row, index) => (
                  <TableRow key={`${row.session_date}-${index}`}>
                    <TableCell className="font-medium">
                      {formatDate(row.session_date)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          row.status === "present" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {row.status}
                      </span>
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
