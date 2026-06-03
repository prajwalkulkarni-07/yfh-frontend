import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  MapPin,
  HandHeart,
  MoreHorizontal,
  Leaf,
  BookOpen,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type NavTab = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const yfhTabs: NavTab[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/students", label: "Students", icon: Users },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/trips", label: "Trips", icon: MapPin },
  { to: "/volunteering-service", label: "Volunteer", icon: HandHeart },
]

const gitaTabs: NavTab[] = [
  { to: "/gita/students", label: "Students", icon: Users },
  { to: "/gita/attendance", label: "Attendance", icon: CalendarCheck },
]

export function MobileNav() {
  const { portal, setPortal, signOut } = useAuth()
  const navigate = useNavigate()
  const activePortal = portal ?? "yfh"
  const tabs = activePortal === "gita" ? gitaTabs : yfhTabs

  const handlePortalSwitch = () => {
    const nextPortal = activePortal === "gita" ? "yfh" : "gita"
    setPortal(nextPortal)
    navigate(nextPortal === "gita" ? "/gita/students" : "/")
  }

  const handleSignOut = () => {
    signOut()
    navigate("/login")
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 px-1 text-xs transition-colors",
              isActive
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={cn(
                  "size-5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 px-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="size-5" />
            <span>More</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-52">
          <DropdownMenuItem onClick={handlePortalSwitch}>
            {activePortal === "gita" ? (
              <Leaf className="size-4" />
            ) : (
              <BookOpen className="size-4" />
            )}
            {activePortal === "gita" ? "Yoga for Happiness" : "Bhagavad Gita Classes"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
