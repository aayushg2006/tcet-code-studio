import { Link } from "react-router-dom";

import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ContestStatus = "Live" | "Upcoming" | "Ended";
type ContestType = "Rated" | "Practice";

type Contest = {
  id: string;
  title: string;
  startTime: string;
  duration: string;
  status: ContestStatus;
  type: ContestType;
  participants: number;
};

const mockContests: Contest[] = [
  {
    id: "tp-assessment-01",
    title: "T&P Technical Screening Round 1",
    startTime: "May 13, 2026 • 2:00 PM",
    duration: "90 mins",
    status: "Live",
    type: "Rated",
    participants: 214,
  },
  {
    id: "dsa-marathon-04",
    title: "DSA Practice Marathon #4",
    startTime: "May 15, 2026 • 5:30 PM",
    duration: "120 mins",
    status: "Upcoming",
    type: "Practice",
    participants: 186,
  },
  {
    id: "tp-mock-drive-02",
    title: "T&P Mock Placement Drive #2",
    startTime: "May 10, 2026 • 10:00 AM",
    duration: "180 mins",
    status: "Ended",
    type: "Rated",
    participants: 243,
  },
  {
    id: "aptitude-bootcamp-01",
    title: "Aptitude + Coding Warmup",
    startTime: "May 09, 2026 • 6:00 PM",
    duration: "60 mins",
    status: "Ended",
    type: "Practice",
    participants: 129,
  },
];

function getContestCta(status: ContestStatus): string {
  if (status === "Live") {
    return "Enter Contest";
  }
  if (status === "Upcoming") {
    return "Register";
  }
  return "Upsolve";
}

function renderContestCards(contests: Contest[]) {
  if (contests.length === 0) {
    return <Card className="border border-border bg-background p-5 text-sm text-muted-foreground shadow-none">No contests in this section.</Card>;
  }

  return (
    <div className="grid gap-4">
      {contests.map((contest) => (
        <Card key={contest.id} className="border border-border bg-background p-5 shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{contest.title}</h3>
                <Badge className={contest.type === "Rated" ? "bg-blue-600 text-white hover:bg-blue-600" : ""}>
                  {contest.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Time: {contest.startTime}</p>
              <p className="text-sm text-muted-foreground">
                Duration: {contest.duration} • Participants: {contest.participants}
              </p>
            </div>

            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to={`/student/contests/${contest.id}`}>{getContestCta(contest.status)}</Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Contests() {
  const liveContests = mockContests.filter((contest) => contest.status === "Live");
  const upcomingContests = mockContests.filter((contest) => contest.status === "Upcoming");
  const pastContests = mockContests.filter((contest) => contest.status === "Ended");

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold">Contests</h1>
            <p className="mt-1 text-sm text-muted-foreground">Official T&P Assessments and Practice Rounds.</p>
          </div>

          <Tabs defaultValue="live" className="space-y-4">
            <TabsList>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            <TabsContent value="live">{renderContestCards(liveContests)}</TabsContent>
            <TabsContent value="upcoming">{renderContestCards(upcomingContests)}</TabsContent>
            <TabsContent value="past">{renderContestCards(pastContests)}</TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}

