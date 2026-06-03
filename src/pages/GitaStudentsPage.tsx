import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, AlertCircle, Users } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { getGitaStudents } from "@/services/api"
import type { Student } from "@/types"

export default function GitaStudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Bhagavad Gita Students</h1>
        <p className="text-sm text-muted-foreground mt-1">Promoted students list</p>
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
    </div>
  )
}
