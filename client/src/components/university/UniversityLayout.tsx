import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronLeft,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
  BarChart3,
  BookMarked,
  UserCheck,
  FileText,
  School,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Course Catalog", href: "/student/catalog", icon: BookOpen },
  { label: "My Courses", href: "/student/courses", icon: BookMarked },
  { label: "Timetable", href: "/student/timetable", icon: Calendar },
  { label: "Grades & GPA", href: "/student/grades", icon: ClipboardList },
  { label: "Profile", href: "/student/profile", icon: User },
];

const lecturerNav: NavItem[] = [
  { label: "Dashboard", href: "/lecturer/dashboard", icon: LayoutDashboard },
  { label: "My Courses", href: "/lecturer/courses", icon: BookOpen },
  { label: "Profile", href: "/lecturer/profile", icon: User },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Semesters", href: "/admin/semesters", icon: Calendar },
  { label: "Enrollments", href: "/admin/enrollments", icon: UserCheck },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

function getRoleNav(role?: string): NavItem[] {
  if (role === "admin") return adminNav;
  if (role === "lecturer") return lecturerNav;
  return studentNav;
}

function getRoleLabel(role?: string): string {
  if (role === "admin") return "Administrator";
  if (role === "lecturer") return "Lecturer";
  return "Student";
}

function getRoleColor(role?: string): string {
  if (role === "admin") return "bg-red-100 text-red-700";
  if (role === "lecturer") return "bg-purple-100 text-purple-700";
  return "bg-blue-100 text-blue-700";
}

interface UniversityLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function UniversityLayout({ children, title }: UniversityLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = getRoleNav(user?.role);

  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: notifications = [] } = trpc.notifications.list.useQuery();
  const markRead = trpc.notifications.markRead.useMutation();
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });
  const utils = trpc.useUtils();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">UniPortal</p>
          <p className="text-xs text-sidebar-foreground/60 truncate">University System</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/30 flex items-center justify-center text-sidebar-foreground text-xs font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name ?? "User"}</p>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", getRoleColor(user?.role))}>
              {getRoleLabel(user?.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-sidebar flex-col shrink-0 border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-sidebar flex flex-col z-50">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            {title && <h1 className="text-base font-semibold text-foreground hidden sm:block">{title}</h1>}
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => markAllRead.mutate()}
                    >
                      Mark all read
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-72">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={cn("flex flex-col items-start gap-1 py-2.5 cursor-pointer", !n.isRead && "bg-accent/50")}
                        onClick={() => {
                          markRead.mutate({ id: n.id });
                          utils.notifications.unreadCount.invalidate();
                          utils.notifications.list.invalidate();
                        }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                          <span className="text-xs font-medium truncate">{n.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 pl-3.5">{n.message}</p>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-24 truncate">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
