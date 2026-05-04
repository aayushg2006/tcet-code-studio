import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { leaderboard } from "@/data/mock";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function FacultyLeaderboard() {
  return (
    <AppLayout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold">Student Leaderboard</h1>
            <p className="text-muted-foreground mt-1">Track performance across the cohort.</p>
          </div>
          <Button variant="outline" onClick={() => toast.success("CSV export started (mock)")}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold w-16">Rank</th>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold text-right">Solved</th>
                  <th className="px-4 py-3 font-semibold text-right">Score</th>
                  <th className="px-4 py-3 font-semibold text-right">Accuracy</th>
                  <th className="px-4 py-3 font-semibold text-right">Submissions</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(s => (
                  <tr key={s.rank} className={`border-t border-border hover:bg-secondary/40 ${s.rank <= 3 ? "bg-accent/5" : ""}`}>
                    <td className="px-4 py-3 font-display font-bold text-accent">#{s.rank}</td>
                    <td className="px-4 py-3"><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground font-mono-code">{s.roll}</div></td>
                    <td className="px-4 py-3 text-right font-mono-code">{s.solved}</td>
                    <td className="px-4 py-3 text-right font-mono-code font-semibold">{s.score}</td>
                    <td className="px-4 py-3 text-right font-mono-code">{s.accuracy}%</td>
                    <td className="px-4 py-3 text-right font-mono-code">{Math.round(s.solved / (s.accuracy/100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
