import { useEffect, useState, useCallback } from "react"
import {
  Search,
  UserPlus,
  MoreHorizontal,
  Pencil,
  UserCheck,
  UserX,
  AlertCircle,
  Users,
  Loader2,
  Phone,
  Mail,
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  getStudents,
  createStudent,
  updateStudent,
  setStudentStatus,
} from "@/services/api"
import type { Student } from "@/types"

type FilterTab = "all" | "active" | "inactive"

interface StudentFormData {
  full_name: string
  email: string
  phone: string
}

const EMPTY_FORM: StudentFormData = { full_name: "", email: "", phone: "" }

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>("all")
  const [search, setSearch] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState<StudentFormData>(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [toggleTarget, setToggleTarget] = useState<Student | null>(null)
  const [toggleLoading, setToggleLoading] = useState(false)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const active = filter === "all" ? undefined : filter === "active"
      const data = await getStudents(active)
      setStudents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students")
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.full_name.toLowerCase().includes(q) ||
      (s.email?.toLowerCase().includes(q) ?? false) ||
      (s.phone?.includes(q) ?? false)
    )
  })

  function openAdd() {
    setFormData(EMPTY_FORM)
    setFormError(null)
    setAddOpen(true)
  }

  function openEdit(student: Student) {
    setFormData({
      full_name: student.full_name,
      email: student.email ?? "",
      phone: student.phone ?? "",
    })
    setFormError(null)
    setEditStudent(student)
  }

  async function handleSave() {
    if (!formData.full_name.trim()) {
      setFormError("Full name is required")
      return
    }
    setFormLoading(true)
    setFormError(null)
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      }
      if (editStudent) {
        await updateStudent(editStudent.id, payload)
      } else {
        await createStudent(payload)
      }
      setAddOpen(false)
      setEditStudent(null)
      fetchStudents()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save student")
    } finally {
      setFormLoading(false)
    }
  }

  async function handleToggleStatus() {
    if (!toggleTarget) return
    setToggleLoading(true)
    try {
      await setStudentStatus(toggleTarget.id, !toggleTarget.active)
      setToggleTarget(null)
      fetchStudents()
    } catch {
      // ignore
    } finally {
      setToggleLoading(false)
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
                placeholder="Search by name, email or phone…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
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
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
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
                      {student.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="size-3" />
                          {student.email}
                        </span>
                      )}
                      {student.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="size-3" />
                          {student.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(student)}>
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setToggleTarget(student)}
                        className={student.active ? "text-destructive focus:text-destructive" : ""}
                      >
                        {student.active ? (
                          <>
                            <UserX className="size-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="size-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={addOpen || editStudent !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddOpen(false)
            setEditStudent(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editStudent ? "Edit Student" : "Add Student"}</DialogTitle>
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
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="priya@example.com"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 555 000 0000"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
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
              {editStudent ? "Save Changes" : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirmation */}
      <AlertDialog open={toggleTarget !== null} onOpenChange={(o) => !o && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.active ? "Deactivate Student" : "Activate Student"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.active
                ? `${toggleTarget?.full_name} will no longer appear in attendance checklists.`
                : `${toggleTarget?.full_name} will appear in attendance checklists again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={toggleLoading}
              className={toggleTarget?.active ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {toggleLoading && <Loader2 className="size-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
