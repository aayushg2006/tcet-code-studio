import { Trophy, Mail, GraduationCap, Flame } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/Badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { recentSubmissions, studentProfile } from "@/data/mock";

export default function StudentProfile() {
  const profile = studentProfile;

  return (
    <AppLayout>
      <div className="container space-y-6 py-8">
        <Card className="overflow-hidden shadow-elevated">
          <div className="h-40 bg-gradient-hero" />
          <div className="bg-card px-6 pb-6 pt-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Avatar className="-mt-16 h-24 w-24 shrink-0 border-4 border-background shadow-card sm:-mt-20">
                  <AvatarFallback className="bg-accent text-2xl font-bold text-accent-foreground">AM</AvatarFallback>
                </Avatar>

                <div className="space-y-2 pb-1">
                  <h1 className="font-display text-3xl font-bold leading-none md:text-4xl">{profile.name}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="font-mono-code">{profile.roll}</span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" /> {profile.branch} {"\u2022"} {profile.year}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" /> {profile.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="inline-flex self-start rounded-xl bg-gradient-accent px-4 py-2 font-bold text-accent-foreground lg:self-auto">
                <span className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" /> Rank #{profile.rank}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Solved", value: profile.solved },
            { label: "Submissions", value: profile.submissions },
            { label: "Accuracy", value: `${profile.accuracy}%` },
            { label: "Streak", value: `${profile.streak}d`, icon: Flame },
          ].map((stat) => (
            <Card key={stat.label} className="flex min-h-[120px] flex-col justify-between p-5 shadow-card">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.icon && <stat.icon className="h-3.5 w-3.5 text-accent" />} {stat.label}
              </div>
              <div className="font-display text-3xl font-bold leading-none">{stat.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)]">
          <Card className="p-6 shadow-card">
            <h2 className="mb-4 font-display text-xl font-bold">Submission History</h2>
            <div className="divide-y divide-border">
              {[...recentSubmissions, ...recentSubmissions].map((submission, index) => (
                <div key={`${submission.id}-${index}`} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">{submission.problem}</div>
                    <div className="text-xs text-muted-foreground">
                      {submission.lang} {"\u2022"} {submission.time}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-code text-xs text-muted-foreground">{submission.runtime}</span>
                    <StatusBadge status={submission.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <h2 className="mb-4 font-display text-xl font-bold">Badges &amp; Achievements</h2>
            <div className="space-y-3">
              {profile.badges.map((badge) => (
                <div
                  key={badge.name}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-accent"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-accent text-xl">
                    {badge.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{badge.name}</div>
                    <div className="text-xs text-muted-foreground">{badge.desc}</div>
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
