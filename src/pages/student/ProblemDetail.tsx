import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DifficultyBadge, StatusBadge } from "@/components/Badges";
import { getProblem } from "@/data/mock";
import { Play, Send, ChevronLeft, FileCode2, Settings, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const starter = `// Solution.cpp
#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int,int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int need = target - nums[i];
            if (seen.count(need)) return {seen[need], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};
`;

const testCases = [
  { input: "nums = [2,7,11,15], target = 9", expected: "[0,1]" },
  { input: "nums = [3,2,4], target = 6", expected: "[1,2]" },
  { input: "nums = [3,3], target = 6", expected: "[0,1]" },
];

export default function ProblemDetail() {
  const { id = "p001" } = useParams();
  const problem = getProblem(id);
  const [code, setCode] = useState(starter);
  const [lang, setLang] = useState("C++");
  const [tab, setTab] = useState<"tests" | "console" | "subs">("tests");
  const [result, setResult] = useState<null | { ok: boolean; runtime: string; memory: string; passed: number; total: number }>(null);
  const [running, setRunning] = useState(false);

  const run = (submit = false) => {
    setRunning(true);
    setResult(null);
    setTab(submit ? "tests" : "console");
    setTimeout(() => {
      setRunning(false);
      setResult({ ok: true, runtime: "4 ms", memory: "8.1 MB", passed: testCases.length, total: testCases.length });
    }, 900);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="border-b border-border bg-card">
        <div className="container flex items-center justify-between h-12">
          <Link to="/student/problems" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
            <ChevronLeft className="h-4 w-4" /> Back to problems
          </Link>
          <div className="text-xs text-muted-foreground hidden md:block">Time limit: 1s · Memory: 256 MB</div>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-12 gap-0 lg:gap-2 p-2 lg:p-3">
        {/* LEFT — problem */}
        <Card className="lg:col-span-4 p-6 shadow-card overflow-y-auto max-h-[calc(100vh-12rem)]">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-display text-2xl font-bold">{problem.title}</h1>
            <DifficultyBadge d={problem.difficulty} />
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {problem.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{t}</span>)}
          </div>

          <section className="mt-6 space-y-5 text-sm leading-relaxed">
            <div>
              <h3 className="font-display font-semibold text-base mb-1">Description</h3>
              <p className="text-muted-foreground">Given an array of integers <code className="font-mono-code text-foreground">nums</code> and an integer <code className="font-mono-code text-foreground">target</code>, return indices of the two numbers such that they add up to <code className="font-mono-code text-foreground">target</code>. Each input has exactly one solution; you may not use the same element twice.</p>
            </div>
            <div>
              <h3 className="font-display font-semibold text-base mb-1">Input Format</h3>
              <p className="text-muted-foreground">First line: array of n integers. Second line: target integer.</p>
            </div>
            <div>
              <h3 className="font-display font-semibold text-base mb-1">Output Format</h3>
              <p className="text-muted-foreground">A list of two indices [i, j] in any order.</p>
            </div>
            <div>
              <h3 className="font-display font-semibold text-base mb-1">Examples</h3>
              <div className="space-y-2">
                {testCases.slice(0,2).map((t,i) => (
                  <div key={i} className="rounded-md bg-secondary p-3 font-mono-code text-xs">
                    <div><span className="text-accent">Input:</span> {t.input}</div>
                    <div><span className="text-accent">Output:</span> {t.expected}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-display font-semibold text-base mb-1">Constraints</h3>
              <ul className="text-muted-foreground font-mono-code text-xs space-y-1 list-disc pl-5">
                <li>2 ≤ nums.length ≤ 10⁴</li>
                <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
                <li>Only one valid answer exists.</li>
              </ul>
            </div>
          </section>
        </Card>

        {/* CENTER — editor */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <Card className="flex-1 flex flex-col overflow-hidden shadow-card">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
              <div className="flex items-center gap-2">
                <select value={lang} onChange={e => setLang(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium">
                  <option>C++</option><option>Python</option><option>Java</option><option>JavaScript</option>
                </select>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-border text-xs">
                  <FileCode2 className="h-3 w-3 text-accent" />
                  <span className="font-mono-code">Solution.cpp</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCode(starter)} aria-label="Reset"><RotateCcw className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Settings"><Settings className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-[3rem_1fr] font-mono-code text-sm bg-[hsl(220_50%_8%)] text-[hsl(40_30%_92%)] dark:bg-background min-h-[360px]">
              <div className="text-right pr-2 py-3 text-xs text-[hsl(220_15%_50%)] select-none border-r border-[hsl(220_30%_18%)]">
                {code.split("\n").map((_, i) => <div key={i} className="leading-6">{i + 1}</div>)}
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                className="w-full bg-transparent p-3 outline-none resize-none leading-6 text-sm"
              />
            </div>
            <div className="px-3 py-1.5 border-t border-border bg-secondary/50 text-[11px] text-muted-foreground flex items-center justify-between font-mono-code">
              <span>Ln {code.split("\n").length}, Col 1</span>
              <span>UTF-8 · LF · {lang}</span>
            </div>
          </Card>

          {/* Action bar */}
          <Card className="p-3 shadow-card flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              {result ? <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> All sample tests passed</span> : "Run code to see results"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => run(false)} disabled={running}><Play className="h-4 w-4 mr-1" /> Run</Button>
              <Button onClick={() => run(true)} disabled={running} className="bg-accent hover:bg-accent/90 text-accent-foreground"><Send className="h-4 w-4 mr-1" /> Submit</Button>
            </div>
          </Card>
        </div>

        {/* RIGHT — tests/console */}
        <Card className="lg:col-span-3 flex flex-col shadow-card overflow-hidden">
          <div className="flex border-b border-border bg-secondary/50">
            {(["tests","console","subs"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn(
                "flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                tab === t ? "bg-background text-accent border-b-2 border-accent" : "text-muted-foreground hover:text-foreground"
              )}>
                {t === "tests" ? "Test Cases" : t === "console" ? "Console" : "Submissions"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {tab === "tests" && (
              <>
                {result && (
                  <div className={cn("rounded-md p-3 border", result.ok ? "bg-success/10 border-success/30 text-success" : "bg-destructive/10 border-destructive/30 text-destructive")}>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={result.ok ? "Accepted" : "Wrong Answer"} />
                      <span className="font-mono-code text-xs">{result.passed}/{result.total} passed</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono-code text-foreground">
                      <div className="rounded bg-background p-2"><div className="text-muted-foreground">Runtime</div>{result.runtime}</div>
                      <div className="rounded bg-background p-2"><div className="text-muted-foreground">Memory</div>{result.memory}</div>
                    </div>
                  </div>
                )}
                {testCases.map((t, i) => (
                  <div key={i} className="rounded-md border border-border p-3">
                    <div className="text-xs font-semibold mb-2">Case {i + 1}</div>
                    <label className="text-[11px] uppercase text-muted-foreground tracking-wider">Input</label>
                    <textarea defaultValue={t.input} className="mt-1 w-full text-xs font-mono-code rounded bg-secondary px-2 py-1.5 border border-border" rows={2} />
                    <label className="text-[11px] uppercase text-muted-foreground tracking-wider mt-2 block">Expected</label>
                    <div className="mt-1 text-xs font-mono-code rounded bg-secondary px-2 py-1.5">{t.expected}</div>
                    {result && <>
                      <label className="text-[11px] uppercase text-muted-foreground tracking-wider mt-2 block">Actual</label>
                      <div className="mt-1 text-xs font-mono-code rounded bg-success/10 text-success px-2 py-1.5">{t.expected}</div>
                    </>}
                  </div>
                ))}
              </>
            )}
            {tab === "console" && (
              <pre className="font-mono-code text-xs text-muted-foreground whitespace-pre-wrap">{running ? "$ Running solution against sample tests..." : result ? "$ Compilation successful\n$ Test 1 passed (2ms)\n$ Test 2 passed (1ms)\n$ Test 3 passed (1ms)\n$ Done." : "// stdout will appear here"}</pre>
            )}
            {tab === "subs" && (
              <div className="space-y-2">
                {[{s:"Accepted",t:"just now",r:"4 ms"},{s:"Wrong Answer",t:"5 min ago",r:"—"},{s:"Accepted",t:"yesterday",r:"6 ms"}].map((s,i)=>(
                  <div key={i} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                    <StatusBadge status={s.s} />
                    <span className="font-mono-code text-muted-foreground">{s.r}</span>
                    <span className="text-muted-foreground">{s.t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
