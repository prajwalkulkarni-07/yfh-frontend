import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthContext, useAuthState } from "@/hooks/useAuth"
import AppLayout from "@/components/AppLayout"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import StudentsPage from "@/pages/StudentsPage"
import StudentDetailsPage from "@/pages/StudentDetailsPage"
import AttendancePage from "@/pages/AttendancePage"
import ReportsPage from "@/pages/ReportsPage"
import ScheduleTripPage from "@/pages/ScheduleTripPage"

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/:id" element={<StudentDetailsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/trips" element={<ScheduleTripPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
