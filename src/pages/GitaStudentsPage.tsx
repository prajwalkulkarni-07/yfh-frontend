import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, AlertCircle, Users, UserPlus, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { createGitaStudent, getGitaStudents } from "@/services/api"
import type { Student, StudentType } from "@/types"

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

export default function GitaStudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [formData, setFormData] = useState<StudentFormData>(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getGitaStudents()
      setStudents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const normalizedSearch = search.trim().toLowerCase()
  const filtered = normalizedSearch
    ? students.filter((student) => {
        const name = student.full_name.toLowerCase()
        const phone = student.phone ?? ""
        return name.includes(normalizedSearch) || phone.includes(normalizedSearch)
      })
    : students

  function openAdd() {
    setFormData(EMPTY_FORM)
    setFormError(null)
    setAddOpen(true)
  }

  async function handleSave() {
    if (!formData.full_name.trim()) {
      setFormError("Full name is required")
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

    setFormLoading(true)
    setFormError(null)
    try {
      await createGitaStudent({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        age: parsedAge,
        student_type: formData.student_type,
        college_name: formData.student_type === "studying" ? formData.college_name.trim() : undefined,
        branch: formData.student_type === "studying" ? formData.branch.trim() : undefined,
        semester: formData.student_type === "studying" ? parsedSemester : undefined,
        company_name: formData.student_type === "working" ? formData.company_name.trim() : undefined,
        designation: formData.student_type === "working" ? formData.designation.trim() : undefined,
        experience: formData.student_type === "working" ? parsedExperience : undefined,
        description: formData.student_type === "not_studying_not_working" ? formData.description.trim() : undefined,
      })
      setAddOpen(false)
      fetchStudents()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save student")
    } finally {
      setFormLoading(false)
    }
  }

  const downloadExcel = () => {
    const csvFilename = "bhagavad-gita-students.csv"
    const csv = [
      ["Name", "Phone Number"],
      ...students.map(student => [student.full_name, student.phone ?? ""])
    ].map(row =>
      row.map(cell => {
        const value = String(cell ?? "")
        return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
      }).join(",")
    ).join("\r\n")
    
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = csvFilename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bhagavad Gita Students</h1>
          <p className="text-sm text-muted-foreground mt-1">Promoted students list</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadExcel} disabled={loading || students.length === 0}>
            <Download />
            Download
          </Button>
          <Button onClick={openAdd}>
            <UserPlus />
            Add Student
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
        <CardHeader className="pb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or phone…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-muted-foreground">
              <Users className="size-6" />
              <p className="text-sm">No students found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className="flex w-full items-center px-4 py-4 text-left hover:bg-muted/40"
                  onClick={() => navigate(`/gita/students/${student.id}`)}
                >
                  <div>
                    <div className="font-medium text-foreground">{student.full_name}</div>
                    <div className="text-xs text-muted-foreground">{student.phone}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          if (!open) setAddOpen(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter the student details to save the record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="gita-full-name">Full Name *</Label>
              <Input
                id="gita-full-name"
                value={formData.full_name}
                onChange={(event) => setFormData((prev) => ({ ...prev, full_name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gita-phone">Phone *</Label>
              <Input
                id="gita-phone"
                type="tel"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gita-age">Age *</Label>
              <Input
                id="gita-age"
                type="number"
                min={1}
                value={formData.age}
                onChange={(event) => setFormData((prev) => ({ ...prev, age: event.target.value }))}
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
                  <SelectValue />
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
                <div className="space-y-2">
                  <Label htmlFor="gita-college">College Name *</Label>
                  <Input
                    id="gita-college"
                    value={formData.college_name}
                    onChange={(event) => setFormData((prev) => ({ ...prev, college_name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gita-branch">Branch *</Label>
                  <Input
                    id="gita-branch"
                    value={formData.branch}
                    onChange={(event) => setFormData((prev) => ({ ...prev, branch: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gita-semester">Semester *</Label>
                  <Input
                    id="gita-semester"
                    type="number"
                    min={1}
                    value={formData.semester}
                    onChange={(event) => setFormData((prev) => ({ ...prev, semester: event.target.value }))}
                  />
                </div>
              </>
            )}
            {formData.student_type === "working" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="gita-company">Company Name *</Label>
                  <Input
                    id="gita-company"
                    value={formData.company_name}
                    onChange={(event) => setFormData((prev) => ({ ...prev, company_name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gita-designation">Designation *</Label>
                  <Input
                    id="gita-designation"
                    value={formData.designation}
                    onChange={(event) => setFormData((prev) => ({ ...prev, designation: event.target.value }))}
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
                    onChange={(event) => setFormData((prev) => ({ ...prev, experience: event.target.value }))}
                  />
                </div>
              </>
            )}
            {formData.student_type === "not_studying_not_working" && (
              <div className="space-y-2">
                <Label htmlFor="gita-description">Description *</Label>
                <Textarea
                  id="gita-description"
                  placeholder="preparing for govt exams"
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
            )}
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={formLoading}>
              {formLoading && <Loader2 className="size-4 animate-spin" />}
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
