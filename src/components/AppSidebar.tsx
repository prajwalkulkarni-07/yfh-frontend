import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  MapPin,
  HandHeart,
  Leaf,
  LogOut,
  BookOpen,
  ArrowLeftRight,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const yfhNavItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/students", label: "Students", icon: Users },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/trips", label: "Schedule Trip", icon: MapPin },
  { to: "/volunteering-service", label: "Schedule Volunteering Service", icon: HandHeart },
  { to: "/reports", label: "Reports", icon: BarChart3 },
]

const gitaNavItems: NavItem[] = [
  { to: "/gita/students", label: "Students", icon: Users },
  { to: "/gita/attendance", label: "Attendance", icon: CalendarCheck },
]

export function AppSidebar() {
  const { user, signOut, portal, setPortal } = useAuth()
  const navigate = useNavigate()
  const activePortal = portal ?? "yfh"
  const navItems = activePortal === "gita" ? gitaNavItems : yfhNavItems

  function handleSignOut() {
    signOut()
    navigate("/login")
  }

  function handlePortalSwitch() {
    const nextPortal = activePortal === "gita" ? "yfh" : "gita"
    setPortal(nextPortal)
    navigate(nextPortal === "gita" ? "/gita/students" : "/")
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "A"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <div className="flex items-center gap-2 px-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/15 shrink-0">
            <Leaf className="size-4 text-primary" />
          </div>
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">
              {activePortal === "gita" ? "Bhagavad Gita Classes" : "Yoga for Happiness"}
            </span>
            <span className="text-xs text-muted-foreground truncate">Attendance Portal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild tooltip={label}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""
                      }
                    >
                      <Icon />
                      <span>{label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="justify-between"
              size="lg"
              onClick={handlePortalSwitch}
              tooltip={activePortal === "gita" ? "Switch to Yoga for Happiness" : "Switch to Bhagavad Gita Classes"}
            >
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="size-4" />
                <span className="text-sm">
                  {activePortal === "gita" ? "Yoga for Happiness" : "Bhagavad Gita Classes"}
                </span>
              </div>
              {activePortal === "gita" ? <Leaf className="size-4" /> : <BookOpen className="size-4" />}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="cursor-default hover:bg-transparent hover:text-sidebar-foreground">
              <div>
                <Avatar className="size-7 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/15 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-none min-w-0">
                  <span className="text-sm font-medium truncate">
                    {user?.name || user?.email || "Admin"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign out"
              className="text-destructive hover:text-destructive focus:text-destructive"
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
