import { useEffect, useMemo, useState } from "react"
import { CalendarDays, AlertCircle, Save, Users, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
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
import { createTrip, deleteTrip, getStudents, getTrips, updateTripParticipants } from "@/services/api"
import type { Student, Trip } from "@/types"

export default function ScheduleTripPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [tripDate, setTripDate] = useState<Date | null>(null)
  const [search, setSearch] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [details, setDetails] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])

  const toDateOnly = (value: string | null | undefined) => {
    if (!value) return null
    return value.split("T")[0]
  }

  const toDateFromTrip = (value: string | null | undefined) => {
    const dateOnly = toDateOnly(value)
    if (!dateOnly) return null
    const dateObj = new Date(`${dateOnly}T00:00:00`)
    return Number.isNaN(dateObj.getTime()) ? null : dateObj
  }

  const formatTripDateIST = (value: string | null | undefined) => {
    const dateOnly = toDateOnly(value)
    if (!dateOnly) return "-"
    const dateObj = new Date(`${dateOnly}T00:00:00+05:30`)
    if (Number.isNaN(dateObj.getTime())) return dateOnly
    return dateObj.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
  }

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId) ?? null,
    [trips, selectedTripId]
  )

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [studentsData, tripsData] = await Promise.all([
          getStudents(undefined, true, true),
          getTrips(),
        ])
        setStudents(studentsData)
        setTrips(tripsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trip data")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (!selectedTrip) return
    setError(null)
    setTripDate(toDateFromTrip(selectedTrip.trip_date))
    const participantIds = new Set(
      (selectedTrip.participants ?? []).map((participant) => participant.id)
    )
    setSelectedStudents(participantIds)
    setDetails(selectedTrip.details ?? "")
  }, [selectedTrip])

  // Combine eligible students with selected trip participants (for editing existing trips)
  const displayStudents = useMemo(() => {
    if (!selectedTrip) return students
    const participantSet = new Set(selectedTrip.participants?.map(p => p.id) || [])
    const participantStudents = selectedTrip.participants?.filter(p => !students.find(s => s.id === p.id)) || []
    return [...students, ...participantStudents].sort((a, b) => 
      a.full_name.localeCompare(b.full_name)
    )
  }, [students, selectedTrip])

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    return displayStudents.filter((student) => {
      if (!q) return true
      return (
        student.full_name.toLowerCase().includes(q) ||
        (student.phone?.includes(q) ?? false)
      )
    })
  }, [displayStudents, search])

  const resetForm = () => {
    setSelectedTripId(null)
    setTripDate(null)
    setSearch("")
    setSelectedStudents(new Set())
    setDetails("")
    setError(null)
  }

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else {
        next.add(studentId)
      }
      return next
    })
  }

  const handleSave = async () => {
    const dateKey = tripDate
      ? format(tripDate, "yyyy-MM-dd")
      : selectedTrip
        ? toDateOnly(selectedTrip.trip_date)
        : null

    if (!dateKey) {
      setError("Trip date is required")
      return
    }

    const studentIds = Array.from(selectedStudents)

    setSaving(true)
    setError(null)
    try {
      if (selectedTripId) {
        await updateTripParticipants(selectedTripId, studentIds, details, dateKey)
      } else {
        const created = await createTrip(dateKey, studentIds, details)
        setSelectedTripId(created.id)
      }

      const tripsData = await getTrips()
      setTrips(tripsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trip")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTripId) return
    setDeleting(true)
    setError(null)
    try {
      await deleteTrip(selectedTripId)
      setDeleteOpen(false)
      resetForm()
      const tripsData = await getTrips()
      setTrips(tripsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trip")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Schedule Trip</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plan trips and select participants. Trips stay editable after the date.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {selectedTrip ? "Edit Trip" : "New Trip"}
            </CardTitle>
            {selectedTrip && (
              <div className="flex items-center gap-2">
                <AlertDialog
                  open={deleteOpen}
                  onOpenChange={(open) => {
                    if (deleting) return
                    setDeleteOpen(open)
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All participants for this trip will be removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
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
                        {deleting ? "Deleting…" : "Delete Trip"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="outline" size="sm" onClick={resetForm}>
                  Create New
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trip Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-60 justify-between"
                  >
                    <span>{tripDate ? format(tripDate, "MMM d, yyyy") : "Select date"}</span>
                    <CalendarDays className="size-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={tripDate ?? undefined}
                    disabled={(date) => date < today}
                    onSelect={(date) => setTripDate(date ?? null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {selectedTrip && (
                <p className="text-xs text-muted-foreground">
                  Trip details, date, and participants remain editable.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Trip Details</Label>
              <Textarea
                placeholder="e.g. Trip to Mysuru, departure at 7:00 AM"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Participants</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedStudents.size} selected
                </span>
              </div>
              <Input
                placeholder="Search by name or phone"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div className="rounded-lg border border-border/60">
                <ScrollArea className="h-64">
                  {loading ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">Loading students…</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      {selectedTrip ? "No students found." : "No eligible students (students need at least 4 classes to be eligible for trips)."}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredStudents.map((student) => {
                        const checked = selectedStudents.has(student.id)
                        const isEligible = students.some(s => s.id === student.id)
                        return (
                          <label
                            key={student.id}
                            className="flex items-center gap-3 px-4 py-3 text-sm transition-colors cursor-pointer hover:bg-muted/40"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleStudent(student.id)}
                            />
                            <div className="flex flex-1 items-center justify-between gap-3">
                              <span className="font-medium text-foreground">{student.full_name}</span>
                              <div className="flex items-center gap-2">
                                {!isEligible && selectedTrip && (
                                  <span className="text-xs text-orange-500">Not eligible</span>
                                )}
                                <span className="text-xs text-muted-foreground">{student.phone}</span>
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving || loading}>
                <Save className="size-4" />
                {saving ? "Saving…" : selectedTrip ? "Update Trip" : "Schedule Trip"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scheduled Trips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading trips…</div>
            ) : trips.length === 0 ? (
              <div className="text-sm text-muted-foreground">No trips scheduled yet.</div>
            ) : (
              <div className="space-y-2">
                {trips.map((trip) => {
                  return (
                    <button
                      key={trip.id}
                      onClick={() => setSelectedTripId(trip.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                        trip.id === selectedTripId
                          ? "border-primary/40 bg-primary/10"
                          : "border-border/60 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatTripDateIST(trip.trip_date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {trip.participant_count ?? trip.participants?.length ?? 0} participants
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-500/15 dark:text-emerald-300">Open</Badge>
                          <Users className="size-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
