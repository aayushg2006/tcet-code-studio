import { Trophy, Mail, GraduationCap } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/Badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { userApi, submissionsApi } from "@/api/services";
import { toLanguageLabel, toStatusLabel } from "@/api/mappers";

function initialsFromName(name: string | null, email: string): string {
  if (!name) {
    return email.slice(0, 2).toUpperCase();
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString();
}

export default function StudentProfile() {
  const { data: userData, isLoading: userLoading, isError: userError, error: userErrorObj } = useQuery({
    queryKey: ["student-profile"],
    queryFn: () => userApi.me("/student/profile"),
  });

  const { data: submissionData, isLoading: submissionsLoading } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: () => submissionsApi.list({ pageSize: 50 }, "/student/profile"),
    enabled: Boolean(userData?.user),
  });

  const profile = userData?.user;
  const submissions = useMemo(
    () => [...(submissionData?.items ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [submissionData?.items],
  );

  if (userLoading) {
    return (
      <AppLayout>
        <div className="container py-8 text-muted-foreground">Loading profile...</div>
      </AppLayout>
    );
  }

  if (userError || !profile) {
    return (
      <AppLayout>
        <div className="container py-8 text-destructive">{(userErrorObj as Error)?.message || "Failed to load profile"}</div>
      </AppLayout>
    );
  }

  const avatarInitials = initialsFromName(profile.name, profile.email);

  return (
    <AppLayout>
      <div className="container space-y-6 py-8">
        <Card className="overflow-hidden shadow-elevated">
          <div className="h-40 bg-gradient-hero" />
          <div className="bg-card px-6 pb-6 pt-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Avatar className="-mt-16 h-24 w-24 shrink-0 border-4 border-background shadow-card sm:-mt-20">
                  <AvatarFallback className="bg-accent text-2xl font-bold text-accent-foreground">{avatarInitials}</AvatarFallback>
                </Avatar>

                <div className="space-y-2 pb-1">
                  <h1 className="font-display text-3xl font-bold leading-none md:text-4xl">{profile.name ?? "Student"}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="font-mono-code">{profile.uid ?? "TCET Student"}</span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" /> {profile.department ?? "Department unavailable"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" /> {profile.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="inline-flex self-start rounded-xl bg-gradient-accent px-4 py-2 font-bold text-accent-foreground lg:self-auto">
                <span className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" /> Rank {profile.rank ? `#${profile.rank}` : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Solved", value: profile.problemsSolved },
            { label: "Submissions", value: profile.submissionCount },
            { label: "Accepted", value: profile.acceptedSubmissionCount },
            { label: "Accuracy", value: `${profile.accuracy}%` },
          ].map((stat) => (
            <Card key={stat.label} className="flex min-h-[120px] flex-col justify-between p-5 shadow-card">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</div>
              <div className="font-display text-3xl font-bold leading-none">{stat.value}</div>
            </Card>
          ))}
        </div>

        <Card className="p-6 shadow-card">
          <h2 className="mb-4 font-display text-xl font-bold">Submission History</h2>
          <div className="divide-y divide-border">
            {submissionsLoading && <div className="py-4 text-sm text-muted-foreground">Loading submissions...</div>}
            {!submissionsLoading && submissions.length === 0 && (
              <div className="py-4 text-sm text-muted-foreground">No submissions yet.</div>
            )}
            {!submissionsLoading &&
              submissions.map((submission) => (
                <div key={submission.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">{submission.problemTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      {toLanguageLabel(submission.language)} {"\u2022"} {formatDate(submission.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-code text-xs text-muted-foreground">{submission.runtimeMs} ms</span>
                    <StatusBadge status={toStatusLabel(submission.status)} />
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
