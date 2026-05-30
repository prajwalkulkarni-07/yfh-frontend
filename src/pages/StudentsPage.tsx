import { useEffect, useState, useCallback } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  getStudentDetails,
} from "@/services/api"
import type { Student, StudentDetailsResponse, StudentSessionDetail } from "@/types"
import { format } from "date-fns"

interface StudentFormData {
  full_name: string
  phone: string
  age: string
  student_type: "studying" | "working" | ""
  institution_name: string
  company_name: string
}

const EMPTY_FORM: StudentFormData = {
  full_name: "",
  phone: "",
  age: "",
  student_type: "",
  institution_name: "",
  company_name: "",
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [formData, setFormData] = useState<StudentFormData>(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsData, setDetailsData] = useState<StudentDetailsResponse | null>(null)

  const formatSessionDate = (value: string | null | undefined) => {
    if (!value) return "-"
    const dateObj = new Date(value.includes("T") ? value : `${value}T00:00:00`)
    if (Number.isNaN(dateObj.getTime())) return "-"
    return format(dateObj, "MMM d, yyyy")
  }


  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStudents()
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

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.full_name.toLowerCase().includes(q) ||
      (s.phone?.includes(q) ?? false) ||
      (s.institution_name?.toLowerCase().includes(q) ?? false) ||
      (s.company_name?.toLowerCase().includes(q) ?? false)
    )
  })

  function openAdd() {
    setFormData(EMPTY_FORM)
    setFormError(null)
    setAddOpen(true)
  }

  async function openDetails(student: Student) {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const data = await getStudentDetails(student.id)
      setDetailsData(data)
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Failed to load student details")
    } finally {
      setDetailsLoading(false)
    }
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
    if (formData.student_type === "studying" && !formData.institution_name.trim()) {
      setFormError("School/College name is required")
      return
    }
    if (formData.student_type === "working" && !formData.company_name.trim()) {
      setFormError("Company name is required")
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
        institution_name:
          formData.student_type === "studying"
            ? formData.institution_name.trim()
            : undefined,
        company_name:
          formData.student_type === "working"
            ? formData.company_name.trim()
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
                      <Badge
                        variant={student.active ? "default" : "secondary"}
                        className={`text-xs ${student.active ? "bg-primary/15 text-primary hover:bg-primary/20 border-0" : ""}`}
                      >
                        {student.active ? "Active" : "Inactive"}
                      </Badge>
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
                      {student.student_type === "studying" && student.institution_name && (
                        <span className="text-xs text-muted-foreground">
                          {student.institution_name}
                        </span>
                      )}
                      {student.student_type === "working" && student.company_name && (
                        <span className="text-xs text-muted-foreground">
                          {student.company_name}
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
                placeholder="e.g. Priya Sharma"
                value={formData.full_name}
                onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 555 000 0000"
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
                placeholder="18"
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
                    institution_name: value === "studying" ? p.institution_name : "",
                    company_name: value === "working" ? p.company_name : "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studying">Studying</SelectItem>
                  <SelectItem value="working">Working</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.student_type === "studying" && (
              <div className="space-y-2">
                <Label htmlFor="institution_name">School/College Name *</Label>
                <Input
                  id="institution_name"
                  placeholder="e.g. XYZ College"
                  value={formData.institution_name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, institution_name: e.target.value }))
                  }
                />
              </div>
            )}
            {formData.student_type === "working" && (
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  placeholder="e.g. ABC Pvt Ltd"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, company_name: e.target.value }))
                  }
                />
              </div>
            )}
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAddOpen(false); setEditStudent(null) }}
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
              View the student profile and class attendance.
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
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium text-foreground">{detailsData.student.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-foreground">{detailsData.student.phone ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="text-sm font-medium text-foreground">{detailsData.student.age ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium text-foreground">
                    {detailsData.student.student_type
                      ? (detailsData.student.student_type === "studying" ? "Studying" : "Working")
                      : "-"}
                  </p>
                </div>
                {detailsData.student.student_type === "studying" && detailsData.student.institution_name && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">School/College</p>
                    <p className="text-sm font-medium text-foreground">{detailsData.student.institution_name}</p>
                  </div>
                )}
                {detailsData.student.student_type === "working" && detailsData.student.company_name && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-medium text-foreground">{detailsData.student.company_name}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Class Attendance</p>
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
                          {row.status === "present" ? formatSessionDate(row.attended_on) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
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
