import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { AppLayout } from "@/components/AppLayout";
import { userApi } from "@/api/services";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ContestType = "Rated" | "Practice";

type ContestMeta = {
  id: string;
  title: string;
  type: ContestType;
};

type ProblemItem = {
  id: string;
  title: string;
  status: "Solved" | "Attempted" | "Unattempted";
  difficulty: "Easy" | "Medium" | "Hard";
};

type StandingEntry = {
  rank: number;
  name: string;
  email: string;
  solved: number;
  penaltyMins: number;
};

const mockContests: ContestMeta[] = [
  { id: "tp-assessment-01", title: "T&P Technical Screening Round 1", type: "Rated" },
  { id: "dsa-marathon-04", title: "DSA Practice Marathon #4", type: "Practice" },
  { id: "tp-mock-drive-02", title: "T&P Mock Placement Drive #2", type: "Rated" },
  { id: "aptitude-bootcamp-01", title: "Aptitude + Coding Warmup", type: "Practice" },
];

const mockProblems: ProblemItem[] = [
  { id: "A", title: "Two Sum", status: "Solved", difficulty: "Easy" },
  { id: "B", title: "Valid Parentheses", status: "Attempted", difficulty: "Medium" },
  { id: "C", title: "Shortest Path Check", status: "Unattempted", difficulty: "Hard" },
];

const mockStandings: StandingEntry[] = [
  { rank: 1, name: "Student Two", email: "student2@tcetmumbai.in", solved: 3, penaltyMins: 48 },
  { rank: 2, name: "Student One", email: "student1@tcetmumbai.in", solved: 3, penaltyMins: 57 },
  { rank: 3, name: "Riya Shah", email: "riya.shah@tcetmumbai.in", solved: 2, penaltyMins: 30 },
  { rank: 4, name: "Arjun Iyer", email: "arjun.iyer@tcetmumbai.in", solved: 2, penaltyMins: 41 },
  { rank: 5, name: "Mihir Patil", email: "mihir.patil@tcetmumbai.in", solved: 1, penaltyMins: 22 },
];

function difficultyBadgeClass(difficulty: ProblemItem["difficulty"]): string {
  if (difficulty === "Easy") return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
  if (difficulty === "Medium") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
  return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
}

function statusBadgeClass(status: ProblemItem["status"]): string {
  if (status === "Solved") return "bg-green-600 text-white hover:bg-green-600";
  if (status === "Attempted") return "bg-amber-500 text-white hover:bg-amber-500";
  return "bg-secondary text-secondary-foreground";
}

export default function ContestDetail() {
  const { id = "" } = useParams();
  const contest = mockContests.find((item) => item.id === id);
  const pathname = `/student/contests/${id}`;

  const { data: userData } = useQuery({
    queryKey: ["contest-detail-current-user", id],
    queryFn: () => userApi.me(pathname, { suppressAuthRedirect: true }),
    retry: false,
  });

  const highlightedEmail = userData?.user.email ?? "student1@tcetmumbai.in";
  const standings = useMemo(
    () => mockStandings.map((entry) => ({ ...entry, isCurrent: entry.email.toLowerCase() === highlightedEmail.toLowerCase() })),
    [highlightedEmail],
  );

  if (!contest) {
    return <Navigate to="/student/contests" replace />;
  }

  return (
    <AppLayout>
      <div className="container space-y-6 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold">{contest.title}</h1>
            <div className="flex items-center gap-2">
              <Badge className={contest.type === "Rated" ? "bg-blue-600 text-white hover:bg-blue-600" : ""}>
                {contest.type}
              </Badge>
              <Badge variant="outline" className="font-mono-code">
                01:45:20 Remaining
              </Badge>
            </div>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTitle>Proctoring Alert</AlertTitle>
          <AlertDescription>
            Environment Locked: Tab tracking is active. Exiting full-screen will flag your submission.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="problems" className="space-y-4">
          <TabsList>
            <TabsTrigger value="problems">Problems</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
          </TabsList>

          <TabsContent value="problems">
            <Card className="border border-border bg-background p-0 shadow-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[180px]">Difficulty</TableHead>
                    <TableHead className="w-[140px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProblems.map((problem) => (
                    <TableRow key={problem.id}>
                      <TableCell>
                        <Badge className={statusBadgeClass(problem.status)}>{problem.status}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {problem.id}. {problem.title}
                      </TableCell>
                      <TableCell>
                        <Badge className={difficultyBadgeClass(problem.difficulty)}>{problem.difficulty}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                          <Link to="/student/problems/1">Solve</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="standings">
            <Card className="border border-border bg-background p-0 shadow-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-[140px]">Solved</TableHead>
                    <TableHead className="w-[160px]">Penalty (Mins)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((entry) => (
                    <TableRow
                      key={entry.email}
                      className={cn(entry.isCurrent && "bg-primary/10 hover:bg-primary/10")}
                    >
                      <TableCell className="font-semibold">#{entry.rank}</TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.name}</div>
                        <div className="text-xs text-muted-foreground">{entry.email}</div>
                      </TableCell>
                      <TableCell>{entry.solved}</TableCell>
                      <TableCell className="font-mono-code">{entry.penaltyMins}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

