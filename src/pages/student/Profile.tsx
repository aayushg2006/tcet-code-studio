import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/Badges";
import { recentSubmissions, studentProfile } from "@/data/mock";
import { Trophy, Mail, GraduationCap, Flame } from "lucide-react";

export default function StudentProfile() {
  const p = studentProfile;
  return (
    <AppLayout>
      <div className="container py-8 space-y-6">
        <Card className="overflow-hidden shadow-elevated">
          <div className="bg-gradient-hero h-32" />
          <div className="px-6 pb-6 -mt-12 flex flex-col md:flex-row md:items-end gap-4">
            <Avatar className="h-24 w-24 ring-4 ring-background">
              <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-bold">AM</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-display text-3xl font-bold">{p.name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                <span className="font-mono-code">{p.roll}</span>
                <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {p.branch} · {p.year}</span>
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {p.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-accent text-accent-foreground font-bold">
              <Trophy className="h-5 w-5" /> Rank #{p.rank}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Solved", value: p.solved },
            { label: "Submissions", value: p.submissions },
            { label: "Accuracy", value: `${p.accuracy}%` },
            { label: "Streak", value: `${p.streak}d`, icon: Flame },
          ].map(s => (
            <Card key={s.label} className="p-5 shadow-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                {s.icon && <s.icon className="h-3.5 w-3.5 text-accent" />} {s.label}
              </div>
              <div className="font-display text-3xl font-bold mt-2">{s.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 shadow-card">
            <h2 className="font-display text-xl font-bold mb-4">Submission History</h2>
            <div className="divide-y divide-border">
              {[...recentSubmissions, ...recentSubmissions].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{s.problem}</div>
                    <div className="text-xs text-muted-foreground">{s.lang} · {s.time}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-code text-xs text-muted-foreground">{s.runtime}</span>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <h2 className="font-display text-xl font-bold mb-4">Badges & Achievements</h2>
            <div className="space-y-3">
              {p.badges.map(b => (
                <div key={b.name} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent transition-colors">
                  <div className="h-10 w-10 rounded-md bg-gradient-accent flex items-center justify-center text-xl">{b.icon}</div>
                  <div>
                    <div className="font-semibold text-sm">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
