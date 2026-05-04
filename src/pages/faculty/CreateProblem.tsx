import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Send, Plus, Trash2, Eye, EyeOff } from "lucide-react";

type TC = { input: string; output: string; hidden: boolean };

export default function CreateProblem() {
  const [title, setTitle] = useState("");
  const [diff, setDiff] = useState("Easy");
  const [tags, setTags] = useState("");
  const [statement, setStatement] = useState("");
  const [inputFmt, setInputFmt] = useState("");
  const [outputFmt, setOutputFmt] = useState("");
  const [constraints, setConstraints] = useState("");
  const [timeLimit, setTimeLimit] = useState("1");
  const [memLimit, setMemLimit] = useState("256");
  const [tcs, setTcs] = useState<TC[]>([
    { input: "", output: "", hidden: false },
    { input: "", output: "", hidden: true },
  ]);

  const addTc = (hidden: boolean) => setTcs([...tcs, { input: "", output: "", hidden }]);
  const removeTc = (i: number) => setTcs(tcs.filter((_, j) => j !== i));
  const updateTc = (i: number, field: keyof TC, val: any) => setTcs(tcs.map((t, j) => j === i ? { ...t, [field]: val } : t));

  return (
    <AppLayout>
      <div className="container py-8 max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold">Create New Problem</h1>
            <p className="text-muted-foreground mt-1">Design a meaningful challenge for your students.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.success("Draft saved")}>
              <Save className="h-4 w-4 mr-2" /> Save Draft
            </Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => toast.success("Problem published!")}>
              <Send className="h-4 w-4 mr-2" /> Publish
            </Button>
          </div>
        </div>

        <Card className="p-6 shadow-card space-y-5">
          <h2 className="font-display text-lg font-bold border-b border-border pb-2">Basic Info</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Problem Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Maximum Subarray Sum" className="mt-1.5" />
            </div>
            <div>
              <Label>Difficulty</Label>
              <select value={diff} onChange={e => setDiff(e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
            <div>
              <Label>Tags / Topics (comma-separated)</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="Array, DP, Greedy" className="mt-1.5" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card space-y-5">
          <h2 className="font-display text-lg font-bold border-b border-border pb-2">Problem Description</h2>
          <div>
            <Label>Problem Statement</Label>
            <Textarea value={statement} onChange={e => setStatement(e.target.value)} rows={6} placeholder="Describe the problem..." className="mt-1.5" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Input Format</Label>
              <Textarea value={inputFmt} onChange={e => setInputFmt(e.target.value)} rows={4} className="mt-1.5" />
            </div>
            <div>
              <Label>Output Format</Label>
              <Textarea value={outputFmt} onChange={e => setOutputFmt(e.target.value)} rows={4} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Constraints</Label>
            <Textarea value={constraints} onChange={e => setConstraints(e.target.value)} rows={3} placeholder="1 ≤ N ≤ 10^5" className="mt-1.5 font-mono-code text-sm" />
          </div>
        </Card>

        <Card className="p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="font-display text-lg font-bold">Test Cases</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => addTc(false)}><Plus className="h-3.5 w-3.5 mr-1" /> Sample</Button>
              <Button size="sm" variant="outline" onClick={() => addTc(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Hidden</Button>
            </div>
          </div>
          <div className="space-y-4">
            {tcs.map((t, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {t.hidden ? <EyeOff className="h-3.5 w-3.5 text-accent" /> : <Eye className="h-3.5 w-3.5 text-success" />}
                    {t.hidden ? "Hidden" : "Sample"} Case {i + 1}
                  </span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeTc(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Input</Label>
                    <Textarea value={t.input} onChange={e => updateTc(i, "input", e.target.value)} rows={3} className="mt-1 font-mono-code text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Expected Output</Label>
                    <Textarea value={t.output} onChange={e => updateTc(i, "output", e.target.value)} rows={3} className="mt-1 font-mono-code text-xs" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-card space-y-5">
          <h2 className="font-display text-lg font-bold border-b border-border pb-2">Limits</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Time Limit (seconds)</Label>
              <Input value={timeLimit} onChange={e => setTimeLimit(e.target.value)} type="number" className="mt-1.5" />
            </div>
            <div>
              <Label>Memory Limit (MB)</Label>
              <Input value={memLimit} onChange={e => setMemLimit(e.target.value)} type="number" className="mt-1.5" />
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
