import { Link, NavLink, useLocation } from "react-router-dom";
import { Moon, Sun, GraduationCap, Briefcase } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const studentLinks = [
  { to: "/student/dashboard", label: "Dashboard" },
  { to: "/student/problems", label: "Problems" },
  { to: "/student/leaderboard", label: "Leaderboard" },
  { to: "/student/profile", label: "Profile" },
];
const facultyLinks = [
  { to: "/faculty/dashboard", label: "Dashboard" },
  { to: "/faculty/problems", label: "Manage" },
  { to: "/faculty/create-problem", label: "Create" },
  { to: "/faculty/submissions", label: "Submissions" },
  { to: "/faculty/leaderboard", label: "Leaderboard" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const isFaculty = pathname.startsWith("/faculty");
  const links = isFaculty ? facultyLinks : studentLinks;

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
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
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
          <div className="hidden sm:flex rounded-md border border-white/20 dark:border-border overflow-hidden">
            <Link to="/student/dashboard" className={cn("px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5", !isFaculty ? "bg-accent text-accent-foreground" : "hover:bg-white/10 dark:hover:bg-secondary")}>
              <GraduationCap className="h-3.5 w-3.5" /> Student
            </Link>
            <Link to="/faculty/dashboard" className={cn("px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5", isFaculty ? "bg-accent text-accent-foreground" : "hover:bg-white/10 dark:hover:bg-secondary")}>
              <Briefcase className="h-3.5 w-3.5" /> Faculty
            </Link>
          </div>

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
              {isFaculty ? "PS" : "AM"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
