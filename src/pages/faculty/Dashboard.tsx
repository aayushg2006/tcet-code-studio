import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/Badges";
import { facultyStats, facultySubmissions, leaderboard } from "@/data/mock";
import { FilePlus2, ListChecks, FileCode2, Trophy, BookOpen, Users, Activity, Target } from "lucide-react";

const stats = [
  { label: "Problems Created", value: facultyStats.problemsCreated, icon: BookOpen },
  { label: "Total Submissions", value: facultyStats.totalSubmissions.toLocaleString(), icon: Activity },
  { label: "Active Students", value: facultyStats.activeStudents, icon: Users },
  { label: "Avg. Accuracy", value: `${facultyStats.avgAccuracy}%`, icon: Target },
];

const actions = [
  { to: "/faculty/create-problem", label: "Create Problem", icon: FilePlus2, primary: true },
  { to: "/faculty/problems", label: "Manage Problems", icon: ListChecks },
  { to: "/faculty/submissions", label: "View Submissions", icon: FileCode2 },
  { to: "/faculty/leaderboard", label: "View Leaderboard", icon: Trophy },
];

export default function FacultyDashboard() {
  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-accent text-sm font-semibold uppercase tracking-widest">Faculty Console</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">Welcome, Prof. Sharma</h1>
            <p className="text-muted-foreground mt-1">Curate problems, monitor progress, recognize excellence.</p>
          </div>
          <Link to="/faculty/create-problem">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground"><FilePlus2 className="h-4 w-4 mr-2" /> New Problem</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label} className="p-5 shadow-card border-l-4 border-l-accent">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase tracking-wider font-semibold">{s.label}</span>
                <s.icon className="h-5 w-5 text-accent" />
              </div>
              <div className="font-display text-3xl font-bold mt-2">{s.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map(a => (
            <Link key={a.to} to={a.to}>
              <Card className={`p-5 shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5 h-full ${a.primary ? "bg-gradient-hero text-primary-foreground dark:bg-card dark:text-foreground" : ""}`}>
                <a.icon className={`h-7 w-7 ${a.primary ? "text-accent" : "text-accent"}`} />
                <div className="font-display text-lg font-bold mt-3">{a.label}</div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-card overflow-hidden">
            <div className="p-6 pb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Recent Submissions</h2>
              <Link to="/faculty/submissions" className="text-sm text-accent hover:underline">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-secondary-foreground text-left">
                  <tr><th className="px-4 py-2 font-semibold">Student</th><th className="px-4 py-2 font-semibold">Problem</th><th className="px-4 py-2 font-semibold">Status</th><th className="px-4 py-2 font-semibold text-right">Time</th></tr>
                </thead>
                <tbody>
                  {facultySubmissions.slice(0, 6).map(s => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-2"><div className="font-medium">{s.student}</div><div className="text-xs text-muted-foreground font-mono-code">{s.roll}</div></td>
                      <td className="px-4 py-2">{s.problem}</td>
                      <td className="px-4 py-2"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-2 text-right text-xs text-muted-foreground font-mono-code">{s.at.split(" ")[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">Top Students</h2>
              <Link to="/faculty/leaderboard" className="text-sm text-accent hover:underline">All</Link>
            </div>
            <ol className="space-y-3">
              {leaderboard.slice(0, 5).map(s => (
                <li key={s.rank} className="flex items-center gap-3">
                  <span className="font-display font-bold w-6 text-accent">#{s.rank}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground font-mono-code">{s.roll}</div>
                  </div>
                  <span className="text-xs font-mono-code font-semibold">{s.score}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
