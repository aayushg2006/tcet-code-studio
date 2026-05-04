import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { leaderboard } from "@/data/mock";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const podiumIcons = [Trophy, Medal, Award];

export default function StudentLeaderboard() {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">The top minds at TCET this semester.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {top3.map((s, i) => {
            const Icon = podiumIcons[i];
            const colors = [
              "from-gold to-accent",
              "from-muted-foreground to-muted-foreground/60",
              "from-accent/80 to-accent/40",
            ][i];
            return (
              <Card key={s.rank} className={cn("p-6 shadow-elevated relative overflow-hidden", i === 0 && "md:scale-105")}>
                <div className={cn("absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-20", colors)} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <Icon className={cn("h-8 w-8", i === 0 ? "text-gold" : i === 1 ? "text-muted-foreground" : "text-accent")} />
                    <span className="font-display text-4xl font-bold text-muted-foreground/30">#{s.rank}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold mt-3">{s.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono-code">{s.roll}</p>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div><div className="text-lg font-bold">{s.solved}</div><div className="text-[10px] uppercase text-muted-foreground">Solved</div></div>
                    <div><div className="text-lg font-bold">{s.score}</div><div className="text-[10px] uppercase text-muted-foreground">Score</div></div>
                    <div><div className="text-lg font-bold">{s.accuracy}%</div><div className="text-[10px] uppercase text-muted-foreground">Accuracy</div></div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold w-16">Rank</th>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold text-right">Solved</th>
                  <th className="px-4 py-3 font-semibold text-right">Score</th>
                  <th className="px-4 py-3 font-semibold text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {rest.map(s => (
                  <tr key={s.rank} className="border-t border-border hover:bg-secondary/50">
                    <td className="px-4 py-3 font-display font-bold">#{s.rank}</td>
                    <td className="px-4 py-3"><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground font-mono-code">{s.roll}</div></td>
                    <td className="px-4 py-3 text-right font-mono-code">{s.solved}</td>
                    <td className="px-4 py-3 text-right font-mono-code font-semibold">{s.score}</td>
                    <td className="px-4 py-3 text-right font-mono-code">{s.accuracy}%</td>
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
