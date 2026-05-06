import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/Badges";
import { facultySubmissions } from "@/data/mock";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye } from "lucide-react";

const sampleCode = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, t;
    cin >> n >> t;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    unordered_map<int,int> seen;
    for (int i = 0; i < n; ++i) {
        if (seen.count(t - a[i])) {
            cout << seen[t - a[i]] << " " << i;
            return 0;
        }
        seen[a[i]] = i;
    }
}
`;

export default function FacultySubmissions() {
  const [pf, setPf] = useState("All");
  const [sf, setSf] = useState("All");
  const [lf, setLf] = useState("All");
  const [view, setView] = useState<typeof facultySubmissions[0] | null>(null);

  const problems = Array.from(new Set(facultySubmissions.map(s => s.problem)));
  const statuses = Array.from(new Set(facultySubmissions.map(s => s.status)));
  const langs = Array.from(new Set(facultySubmissions.map(s => s.lang)));

  const filtered = useMemo(() => facultySubmissions.filter(s =>
    (pf === "All" || s.problem === pf) &&
    (sf === "All" || s.status === sf) &&
    (lf === "All" || s.lang === lf)
  ), [pf, sf, lf]);

  return (
    <AppLayout>
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Code Submissions</h1>
          <p className="text-muted-foreground mt-1">Inspect every submission across all problems.</p>
        </div>

        <Card className="p-4 shadow-card flex flex-wrap gap-3">
          <select value={pf} onChange={e => setPf(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>All</option>{problems.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={sf} onChange={e => setSf(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>All</option>{statuses.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={lf} onChange={e => setLf(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>All</option>{langs.map(p => <option key={p}>{p}</option>)}
          </select>
        </Card>

        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Problem</th>
                  <th className="px-4 py-3 font-semibold">Lang</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Runtime</th>
                  <th className="px-4 py-3 font-semibold text-right">Memory</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold text-right">Code</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-4 py-3"><div className="font-medium">{s.student}</div><div className="text-xs text-muted-foreground font-mono-code">{s.roll}</div></td>
                    <td className="px-4 py-3">{s.problem}</td>
                    <td className="px-4 py-3 font-mono-code text-xs">{s.lang}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-right font-mono-code text-xs">{s.runtime}</td>
                    <td className="px-4 py-3 text-right font-mono-code text-xs">{s.memory}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono-code">{s.at}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setView(s)}><Eye className="h-3.5 w-3.5 mr-1" /> View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">{view?.student} — {view?.problem}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 text-xs">
            {view && <StatusBadge status={view.status} />}
            <span className="font-mono-code text-muted-foreground">{view?.lang}</span>
            <span className="font-mono-code text-muted-foreground">{view?.runtime} · {view?.memory}</span>
          </div>
          <pre className="rounded-lg bg-[hsl(220_50%_8%)] text-[hsl(40_30%_92%)] p-4 text-xs font-mono-code overflow-auto max-h-96">
            {sampleCode}
          </pre>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
