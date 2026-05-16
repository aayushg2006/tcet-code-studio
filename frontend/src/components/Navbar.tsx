import { Link, NavLink, useLocation } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { userApi } from "@/api/services";
import type { UserRole } from "@/api/types";

const linksByRole: Record<UserRole, Array<{ to: string; label: string }>> = {
  STUDENT: [
    { to: "/student/dashboard", label: "Dashboard" },
    { to: "/student/problems", label: "Problems" },
    { to: "/student/contests", label: "Contests" },
    { to: "/student/leaderboard", label: "Leaderboard" },
    { to: "/student/profile", label: "Profile" },
  ],
  FACULTY: [
    { to: "/faculty/dashboard", label: "Dashboard" },
    { to: "/faculty/problems", label: "Manage" },
    { to: "/faculty/create-problem", label: "Create" },
    { to: "/faculty/contests", label: "Contests" },
    { to: "/faculty/submissions", label: "Submissions" },
    { to: "/faculty/leaderboard", label: "Leaderboard" },
    { to: "/faculty/profile", label: "Profile" },
  ],
};

function getAvatarFallback(name: string | null | undefined, role: UserRole): string {
  if (!name) {
    return role === "FACULTY" ? "FC" : "ST";
  }

  const initials = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || (role === "FACULTY" ? "FC" : "ST");
}

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const userQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => userApi.me(pathname, { suppressAuthRedirect: true }),
    retry: false,
    staleTime: 30_000,
  });

  const fallbackRole: UserRole = pathname.startsWith("/faculty") ? "FACULTY" : "STUDENT";
  const role = userQuery.data?.user.role ?? fallbackRole;
  const links = linksByRole[role];
  const showLinks = pathname.startsWith("/student") || pathname.startsWith("/faculty");
  const avatarText = getAvatarFallback(userQuery.data?.user.name, role);

  const handleLogout = () => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.clear();
    sessionStorage.clear();
    queryClient.removeQueries({ queryKey: ["auth"] });
    queryClient.removeQueries({ queryKey: ["user"] });
    queryClient.clear();
    const authUrl = (import.meta.env.VITE_MOCK_SSO_URL as string | undefined)?.trim() || "http://localhost:4000";
    window.location.href = `${authUrl.replace(/\/+$/, "")}/logout?callbackUrl=${encodeURIComponent(window.location.origin)}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-gradient-hero text-primary-foreground dark:bg-card dark:text-foreground">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src="/logo.png" alt="TCET Coding Platform logo" className="h-10 w-10 rounded-md bg-background object-cover ring-2 ring-accent/40" />
          <div className="hidden md:flex flex-col leading-tight">
            <span className="font-display text-base font-bold tracking-tight">TCET Coding Platform</span>
            <span className="font-deva text-[11px] text-accent">॥ शास्त्रं कोडः तीर्थं चेतः ॥</span>
          </div>
        </Link>

        <nav className="ml-6 hidden lg:flex items-center gap-1">
          {showLinks && links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => cn(
                "px-3 py-2 rounded-none text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 dark:text-foreground/70 dark:hover:bg-secondary"
              )}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {showLinks && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-white/10 dark:text-foreground dark:hover:bg-secondary"
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              Logout
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="text-primary-foreground hover:bg-white/10 dark:text-foreground dark:hover:bg-secondary"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Avatar className="h-9 w-9 ring-2 ring-accent/50">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
              {avatarText}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
