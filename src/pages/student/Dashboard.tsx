import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, DifficultyBadge } from "@/components/Badges";
import { announcements, problems, recentSubmissions, studentProfile } from "@/data/mock";
import { Trophy, Target, CheckCircle2, Activity, ArrowRight, Sparkles, Flame } from "lucide-react";

const stats = [
  { label: "Problems Solved", value: studentProfile.solved, icon: CheckCircle2, accent: "text-success" },
  { label: "Submissions", value: studentProfile.submissions, icon: Activity, accent: "text-accent" },
  { label: "Current Rank", value: `#${studentProfile.rank}`, icon: Trophy, accent: "text-gold" },
  { label: "Accuracy", value: `${studentProfile.accuracy}%`, icon: Target, accent: "text-primary dark:text-accent" },
];

export default function StudentDashboard() {
  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        {/* Welcome */}
        <Card className="overflow-hidden border-0 shadow-elevated">
          <div className="bg-gradient-hero text-primary-foreground dark:bg-card dark:text-foreground p-8 relative">
            <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-accent text-sm font-semibold uppercase tracking-widest">Namaste, Aarav</p>
                <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">Ready to climb the ranks today?</h1>
                <p className="font-deva text-accent mt-2">॥ शास्त्रं कोडः तीर्थं चेतः ॥</p>
              </div>
              <div className="flex gap-3">
                <Link to="/student/problems"><Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">Start Solving <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                <Link to="/student/leaderboard"><Button size="lg" variant="outline" className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 dark:text-foreground dark:border-border dark:hover:bg-secondary">Leaderboard</Button></Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.label} className="p-5 shadow-card hover:shadow-elevated transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.accent}`} />
              </div>
              <div className="mt-3 font-display text-3xl font-bold">{s.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent submissions */}
          <Card className="lg:col-span-2 p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">Recent Submissions</h2>
              <Link to="/student/profile" className="text-sm text-accent hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {recentSubmissions.map(s => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{s.problem}</div>
                    <div className="text-xs text-muted-foreground">{s.lang} · {s.time}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono-code text-muted-foreground">{s.runtime}</span>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold flex items-center gap-2"><Flame className="h-4 w-4 text-accent" /> {studentProfile.streak}-day streak</span>
                <span className="text-xs text-muted-foreground">Goal: 60 days</span>
              </div>
              <Progress value={(studentProfile.streak / 60) * 100} className="h-2" />
            </div>
          </Card>

          {/* Announcements */}
          <Card className="p-6 shadow-card">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Announcements</h2>
            <ul className="space-y-4">
              {announcements.map(a => (
                <li key={a.id} className="border-l-2 border-accent pl-3">
                  <div className="text-xs uppercase tracking-wider text-accent font-semibold">{a.tag}</div>
                  <div className="text-sm font-medium leading-snug mt-0.5">{a.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{a.date}</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Recommended */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Recommended for You</h2>
            <Link to="/student/problems" className="text-sm text-accent hover:underline">Browse all</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {problems.slice(2, 5).map(p => (
              <Link to={`/student/problems/${p.id}`} key={p.id}>
                <Card className="p-4 hover:border-accent transition-colors h-full">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{p.title}</h3>
                    <DifficultyBadge d={p.difficulty} />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {p.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{t}</span>)}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">Acceptance · {p.acceptance}%</div>
                </Card>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
