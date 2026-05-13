import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { AppLayout } from "@/components/AppLayout";
import { submissionsApi, userApi } from "@/api/services";
import { SubmissionActivityHeatmap } from "@/components/SubmissionActivityHeatmap";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const difficultyData = [
  { name: "Easy", value: 45, color: "#22c55e" },
  { name: "Medium", value: 30, color: "#eab308" },
  { name: "Hard", value: 10, color: "#ef4444" },
];

const languageData = [
  { name: "Java", count: 65 },
  { name: "Python", count: 15 },
  { name: "C++", count: 5 },
];

const recentAcceptedSubmissions = [
  { title: "Two Sum Variant", language: "Java", when: "Today, 10:42 AM" },
  { title: "Binary Search Bounds", language: "Python", when: "Yesterday, 7:18 PM" },
  { title: "Graph BFS Reachability", language: "C++", when: "Yesterday, 11:09 AM" },
  { title: "Prefix Sum Queries", language: "Java", when: "2 days ago" },
];

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

function statCard(label: string, value: string | number) {
  return (
    <Card className="border border-border bg-background p-5 shadow-none">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-bold leading-none">{value}</p>
    </Card>
  );
}

export default function StudentProfile() {
  const { email: emailParam } = useParams();
  const targetEmail = emailParam ? decodeURIComponent(emailParam) : null;
  const isFacultyView = Boolean(targetEmail);
  const pathname = isFacultyView ? `/faculty/students/${encodeURIComponent(targetEmail!)}` : "/student/profile";

  const { data: userData, isLoading, isError, error } = useQuery({
    queryKey: ["student-profile", targetEmail ?? "self"],
    queryFn: () => (isFacultyView && targetEmail ? userApi.getByEmail(targetEmail, pathname) : userApi.me(pathname)),
  });

  const { data: submissionsData } = useQuery({
    queryKey: ["student-profile-submissions", targetEmail ?? "self"],
    queryFn: () =>
      submissionsApi.list(
        {
          pageSize: 1000,
          userEmail: isFacultyView ? targetEmail ?? undefined : undefined,
        },
        pathname,
      ),
    enabled: Boolean(userData?.user),
  });

  const submissions = useMemo(
    () => [...(submissionsData?.items ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [submissionsData?.items],
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container py-8 text-muted-foreground">Loading profile...</div>
      </AppLayout>
    );
  }

  if (isError || !userData?.user) {
    return (
      <AppLayout>
        <div className="container py-8 text-destructive">{(error as Error)?.message || "Failed to load profile"}</div>
      </AppLayout>
    );
  }

  const profile = userData.user;
  const initials = initialsFromName(profile.name, profile.email);

  return (
    <AppLayout>
      <div className="container space-y-6 bg-slate-50 py-8 dark:bg-background">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold">Academic Profile Dashboard</h1>
          <p className="text-sm text-muted-foreground">Student identity, endorsement profile, and performance snapshot.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-4">
            <Card className="relative border border-border bg-background p-6 shadow-none">
              <Badge className="absolute right-6 top-6 border-0 bg-green-600 text-white hover:bg-green-600">
                ✓ Verified Profile
              </Badge>

              <div className="flex items-center gap-4 pt-8">
                <Avatar className="h-14 w-14 border border-border">
                  <AvatarFallback className="bg-slate-100 font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold">{profile.name ?? "Student"}</p>
                  <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Roll Number</span>
                  <span className="font-medium">{profile.rollNumber ?? "Not set"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{profile.department ?? "Not set"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Semester</span>
                  <span className="font-medium">{profile.semester ?? "Not set"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">GitHub</span>
                  <a
                    href={profile.githubUrl ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-[62%] truncate font-medium text-primary hover:underline"
                  >
                    {profile.githubUrl ?? "Not set"}
                  </a>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">LinkedIn</span>
                  <a
                    href={profile.linkedInUrl ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-[62%] truncate font-medium text-primary hover:underline"
                  >
                    {profile.linkedInUrl ?? "Not set"}
                  </a>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6 md:col-span-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {statCard("Global Rank", profile.rank ? `#${profile.rank}` : "N/A")}
              {statCard("Total Solved", profile.problemsSolved)}
              {statCard("Accuracy", `${profile.accuracy}%`)}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="border border-border bg-background p-5 shadow-none">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Problem Difficulty</h2>
                <div className="mt-4 flex items-center justify-center">
                  <PieChart width={260} height={220}>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      outerRadius={78}
                      innerRadius={45}
                      dataKey="value"
                      strokeWidth={1}
                    >
                      {difficultyData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </div>
              </Card>

              <Card className="border border-border bg-background p-5 shadow-none">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Language Proficiency</h2>
                <div className="mt-4 overflow-x-auto">
                  <BarChart width={320} height={220} data={languageData}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </div>
              </Card>
            </div>

            <Card className="border border-border bg-background shadow-none">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Submission Activity</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center overflow-x-auto pb-6">
                <SubmissionActivityHeatmap submissions={submissions} />
              </CardContent>
            </Card>

            <Card className="border border-border bg-background p-5 shadow-none">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
              <div className="mt-4 overflow-hidden rounded-md border border-border">
                <div className="grid grid-cols-12 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <div className="col-span-6">Problem</div>
                  <div className="col-span-3">Language</div>
                  <div className="col-span-3">Status</div>
                </div>
                {recentAcceptedSubmissions.map((entry) => (
                  <div key={`${entry.title}-${entry.when}`} className="grid grid-cols-12 border-t border-border px-4 py-3 text-sm">
                    <div className="col-span-6">
                      <p className="font-medium">{entry.title}</p>
                      <p className="text-xs text-muted-foreground">{entry.when}</p>
                    </div>
                    <div className="col-span-3 self-center">{entry.language}</div>
                    <div className="col-span-3 self-center">
                      <Badge variant="secondary" className="border border-green-200 bg-green-50 text-green-700 shadow-none dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                        Accepted
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
