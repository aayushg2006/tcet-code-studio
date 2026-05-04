import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/Badges";
import { problems, type Difficulty } from "@/data/mock";
import { Search, CheckCircle2, Circle, CircleDot } from "lucide-react";

const allTags = Array.from(new Set(problems.flatMap(p => p.tags)));

export default function StudentProblems() {
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<Difficulty | "All">("All");
  const [tag, setTag] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");

  const filtered = useMemo(() => problems.filter(p => {
    if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (diff !== "All" && p.difficulty !== diff) return false;
    if (tag !== "All" && !p.tags.includes(tag)) return false;
    if (status !== "All" && p.status !== status) return false;
    return true;
  }), [q, diff, tag, status]);

  const StatusIcon = ({ s }: { s: string }) =>
    s === "solved" ? <CheckCircle2 className="h-4 w-4 text-success" />
    : s === "attempted" ? <CircleDot className="h-4 w-4 text-warning" />
    : <Circle className="h-4 w-4 text-muted-foreground" />;

  return (
    <AppLayout>
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Problem Set</h1>
          <p className="text-muted-foreground mt-1">Sharpen your skills, one problem at a time.</p>
        </div>

        <Card className="p-4 shadow-card">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search problems..." className="pl-9" />
            </div>
            <select value={diff} onChange={e => setDiff(e.target.value as any)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option>All</option><option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
            <select value={tag} onChange={e => setTag(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="All">All Topics</option>
              {allTags.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="All">All Status</option>
              <option value="solved">Solved</option>
              <option value="attempted">Attempted</option>
              <option value="todo">To Do</option>
            </select>
          </div>
        </Card>

        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold w-12">Status</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Difficulty</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Tags</th>
                  <th className="px-4 py-3 font-semibold text-right">Acceptance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3"><StatusIcon s={p.status} /></td>
                    <td className="px-4 py-3">
                      <Link to={`/student/problems/${p.id}`} className="font-medium hover:text-accent">{p.title}</Link>
                    </td>
                    <td className="px-4 py-3"><DifficultyBadge d={p.difficulty} /></td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-code text-xs">{p.acceptance}%</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No problems match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
