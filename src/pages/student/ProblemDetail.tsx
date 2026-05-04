import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Play,
  Send,
  ChevronLeft,
  FileCode2,
  Settings,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DifficultyBadge, StatusBadge } from "@/components/Badges";
import { getProblem } from "@/data/mock";
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

export default function ProblemDetail() {
  const { id = "p001" } = useParams();
  const problem = getProblem(id);
  const testCases = problem.examples;
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
      setResult({
        ok: true,
        runtime: "4 ms",
        memory: "8.1 MB",
        passed: testCases.length,
        total: testCases.length,
      });
    }, 900);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="border-b border-border bg-card">
        <div className="container flex h-12 items-center justify-between">
          <Link to="/student/problems" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
            <ChevronLeft className="h-4 w-4" /> Back to problems
          </Link>
          <div className="hidden text-xs text-muted-foreground md:block">
            Time limit: {problem.timeLimit}s {"\u2022"} Memory: {problem.memoryLimit} MB
          </div>
        </div>
      </div>

      <div className="flex-1 gap-0 p-2 lg:grid lg:grid-cols-12 lg:gap-2 lg:p-3">
        <Card className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6 shadow-card lg:col-span-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-display text-2xl font-bold">{problem.title}</h1>
            <DifficultyBadge d={problem.difficulty} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {problem.tags.map((tag) => (
              <span key={tag} className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>

          <section className="mt-6 space-y-5 text-sm leading-relaxed">
            <div>
              <h3 className="mb-1 font-display text-base font-semibold">Description</h3>
              <p className="text-muted-foreground">{problem.statement}</p>
            </div>
            <div>
              <h3 className="mb-1 font-display text-base font-semibold">Input Format</h3>
              <p className="text-muted-foreground">{problem.inputFormat}</p>
            </div>
            <div>
              <h3 className="mb-1 font-display text-base font-semibold">Output Format</h3>
              <p className="text-muted-foreground">{problem.outputFormat}</p>
            </div>
            <div>
              <h3 className="mb-1 font-display text-base font-semibold">Examples</h3>
              <div className="space-y-2">
                {testCases
                  .filter((testCase) => !testCase.hidden)
                  .map((testCase, index) => (
                    <div key={`${testCase.input}-${index}`} className="rounded-md bg-secondary p-3 font-mono-code text-xs">
                      <div>
                        <span className="text-accent">Input:</span> {testCase.input}
                      </div>
                      <div>
                        <span className="text-accent">Output:</span> {testCase.output}
                      </div>
                      {testCase.explanation && <div className="mt-2 text-muted-foreground">{testCase.explanation}</div>}
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h3 className="mb-1 font-display text-base font-semibold">Constraints</h3>
              <ul className="list-disc space-y-1 pl-5 font-mono-code text-xs text-muted-foreground">
                {problem.constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </div>
          </section>
        </Card>

        <div className="mt-2 flex flex-col gap-2 lg:col-span-5 lg:mt-0">
          <Card className="flex flex-1 flex-col overflow-hidden shadow-card">
            <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-3 py-2">
              <div className="flex items-center gap-2">
                <select
                  value={lang}
                  onChange={(event) => setLang(event.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                >
                  <option>C++</option>
                  <option>Python</option>
                  <option>Java</option>
                  <option>JavaScript</option>
                </select>
                <div className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 text-xs">
                  <FileCode2 className="h-3 w-3 text-accent" />
                  <span className="font-mono-code">Solution.cpp</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCode(starter)} aria-label="Reset">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Settings">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid min-h-[360px] flex-1 grid-cols-[3rem_1fr] bg-[hsl(220_50%_8%)] font-mono-code text-sm text-[hsl(40_30%_92%)] dark:bg-background">
              <div className="select-none border-r border-[hsl(220_30%_18%)] py-3 pr-2 text-right text-xs text-[hsl(220_15%_50%)]">
                {code.split("\n").map((_, index) => (
                  <div key={index} className="leading-6">
                    {index + 1}
                  </div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                spellCheck={false}
                className="w-full resize-none bg-transparent p-3 text-sm leading-6 outline-none"
              />
            </div>
            <div className="flex items-center justify-between border-t border-border bg-secondary/50 px-3 py-1.5 font-mono-code text-[11px] text-muted-foreground">
              <span>Ln {code.split("\n").length}, Col 1</span>
              <span>UTF-8 {"\u2022"} LF {"\u2022"} {lang}</span>
            </div>
          </Card>

          <Card className="flex items-center justify-between gap-2 p-3 shadow-card">
            <div className="text-xs text-muted-foreground">
              {result ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" /> All sample tests passed
                </span>
              ) : (
                "Run code to see results"
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => run(false)} disabled={running}>
                <Play className="mr-1 h-4 w-4" /> Run
              </Button>
              <Button onClick={() => run(true)} disabled={running} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Send className="mr-1 h-4 w-4" /> Submit
              </Button>
            </div>
          </Card>
        </div>

        <Card className="mt-2 flex flex-col overflow-hidden shadow-card lg:col-span-3 lg:mt-0">
          <div className="flex border-b border-border bg-secondary/50">
            {(["tests", "console", "subs"] as const).map((section) => (
              <button
                key={section}
                onClick={() => setTab(section)}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  tab === section ? "border-b-2 border-accent bg-background text-accent" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {section === "tests" ? "Test Cases" : section === "console" ? "Console" : "Submissions"}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {tab === "tests" && (
              <>
                {result && (
                  <div
                    className={cn(
                      "rounded-md border p-3",
                      result.ok
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-destructive/30 bg-destructive/10 text-destructive",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={result.ok ? "Accepted" : "Wrong Answer"} />
                      <span className="font-mono-code text-xs">
                        {result.passed}/{result.total} passed
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 font-mono-code text-xs text-foreground">
                      <div className="rounded bg-background p-2">
                        <div className="text-muted-foreground">Runtime</div>
                        {result.runtime}
                      </div>
                      <div className="rounded bg-background p-2">
                        <div className="text-muted-foreground">Memory</div>
                        {result.memory}
                      </div>
                    </div>
                  </div>
                )}
                {testCases.map((testCase, index) => (
                  <div key={`${testCase.input}-${index}`} className="rounded-md border border-border p-3">
                    <div className="mb-2 text-xs font-semibold">Case {index + 1}</div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Input</label>
                    <textarea
                      defaultValue={testCase.input}
                      className="mt-1 w-full rounded border border-border bg-secondary px-2 py-1.5 font-mono-code text-xs"
                      rows={2}
                    />
                    <label className="mt-2 block text-[11px] uppercase tracking-wider text-muted-foreground">Expected</label>
                    <div className="mt-1 rounded bg-secondary px-2 py-1.5 font-mono-code text-xs">{testCase.output}</div>
                    {result && (
                      <>
                        <label className="mt-2 block text-[11px] uppercase tracking-wider text-muted-foreground">Actual</label>
                        <div className="mt-1 rounded bg-success/10 px-2 py-1.5 font-mono-code text-xs text-success">
                          {testCase.output}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
            {tab === "console" && (
              <pre className="whitespace-pre-wrap font-mono-code text-xs text-muted-foreground">
                {running
                  ? "$ Running solution against sample tests..."
                  : result
                    ? "$ Compilation successful\n$ Test 1 passed (2ms)\n$ Test 2 passed (1ms)\n$ Test 3 passed (1ms)\n$ Done."
                    : "// stdout will appear here"}
              </pre>
            )}
            {tab === "subs" && (
              <div className="space-y-2">
                {[
                  { s: "Accepted", t: "just now", r: "4 ms" },
                  { s: "Wrong Answer", t: "5 min ago", r: "\u2014" },
                  { s: "Accepted", t: "yesterday", r: "6 ms" },
                ].map((submission, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                    <StatusBadge status={submission.s} />
                    <span className="font-mono-code text-muted-foreground">{submission.r}</span>
                    <span className="text-muted-foreground">{submission.t}</span>
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
