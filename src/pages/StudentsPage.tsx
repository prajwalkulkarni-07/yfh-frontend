import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  UserPlus,
  AlertCircle,
  Users,
  Loader2,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getStudents,
  createStudent,
} from "@/services/api"
import type { Student } from "@/types"

interface StudentFormData {
  full_name: string
  phone: string
  age: string
  student_type: "studying" | "working" | ""
  college_name: string
  branch: string
  semester: string
  company_name: string
  designation: string
  experience: string
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
}

export default function StudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "promoted">("all")

  const [addOpen, setAddOpen] = useState(false)
  const [formData, setFormData] = useState<StudentFormData>(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStudents(undefined, true)
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

  const filtered = students
    .filter((s) => {
      const q = search.toLowerCase()
      const promoted = (s.level ?? 1) >= 2
      if (statusFilter === "active" && (!s.active || promoted)) return false
      if (statusFilter === "inactive" && (s.active || promoted)) return false
      if (statusFilter === "promoted" && !promoted) return false
      return (
        s.full_name.toLowerCase().includes(q) ||
        (s.phone?.includes(q) ?? false) ||
        (s.college_name?.toLowerCase().includes(q) ?? false) ||
        (s.branch?.toLowerCase().includes(q) ?? false) ||
        String(s.semester ?? "").includes(q) ||
        (s.company_name?.toLowerCase().includes(q) ?? false) ||
        (s.designation?.toLowerCase().includes(q) ?? false) ||
        String(s.experience ?? "").includes(q)
      )
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name, undefined, { sensitivity: "base" }))

  function openAdd() {
    setFormData(EMPTY_FORM)
    setFormError(null)
    setAddOpen(true)
  }

  function openDetails(student: Student) {
    navigate(`/students/${student.id}`)
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
    setFormLoading(true)
    setFormError(null)
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        age: parsedAge,
        student_type: formData.student_type as "studying" | "working",
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
      }
      await createStudent(payload)
      setAddOpen(false)
      fetchStudents()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save student")
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage enrolled students</p>
        </div>
        <Button onClick={openAdd}>
          <UserPlus />
          Add Student
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name or phone…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filter students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="promoted">Promoted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="size-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="size-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium text-foreground">
                {search ? "No students match your search" : "No students yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {search
                  ? "Try a different name, email or phone number."
                  : "Add your first student to get started."}
              </p>
              {!search && (
                <Button variant="outline" onClick={openAdd} className="mt-4">
                  <UserPlus />
                  Add Student
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openDetails(student)}
                >
                  <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 shrink-0 text-sm font-semibold text-primary">
                    {student.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">{student.full_name}</p>
                      {(student.level ?? 1) >= 2 ? (
                        <Badge
                          variant="outline"
                          className="text-xs border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/15 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                        >
                          Promoted
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            student.active
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "border-red-500/20 bg-red-500/10 text-red-700 hover:bg-red-500/15 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
                          }`}
                        >
                          {student.active ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {student.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="size-3" />
                          {student.phone}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Age {student.age ?? "-"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {student.student_type
                          ? (student.student_type === "studying" ? "Studying" : "Working")
                          : "-"}
                      </span>
                      {student.student_type === "studying" && student.college_name && (
                        <span className="text-xs text-muted-foreground">
                          {student.college_name}
                        </span>
                      )}
                      {student.student_type === "studying" && student.branch && (
                        <span className="text-xs text-muted-foreground">
                          {student.branch}
                        </span>
                      )}
                      {student.student_type === "studying" && student.semester !== undefined && student.semester !== null && (
                        <span className="text-xs text-muted-foreground">
                          Semester {student.semester}
                        </span>
                      )}
                      {student.student_type === "working" && student.company_name && (
                        <span className="text-xs text-muted-foreground">
                          {student.company_name}
                        </span>
                      )}
                      {student.student_type === "working" && student.designation && (
                        <span className="text-xs text-muted-foreground">
                          {student.designation}
                        </span>
                      )}
                      {student.student_type === "working" && student.experience !== undefined && student.experience !== null && (
                        <span className="text-xs text-muted-foreground">
                          {student.experience} yrs
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddOpen(false)
          }
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
              <Label htmlFor="full_name">Full Name *</Label>
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
                type="tel"
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
                    student_type: value as "studying" | "working",
                    college_name: value === "studying" ? p.college_name : "",
                    branch: value === "studying" ? p.branch : "",
                    semester: value === "studying" ? p.semester : "",
                    company_name: value === "working" ? p.company_name : "",
                    designation: value === "working" ? p.designation : "",
                    experience: value === "working" ? p.experience : "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studying">Studying</SelectItem>
                  <SelectItem value="working">Working</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.student_type === "studying" && (
              <div className="space-y-2">
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
            {formData.student_type === "working" && (
              <div className="space-y-2">
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
            {formData.student_type === "studying" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch *</Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={(e) => setFormData((p) => ({ ...p, branch: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
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
              <>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData((p) => ({ ...p, designation: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
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
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAddOpen(false) }}
              disabled={formLoading}
            >
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
