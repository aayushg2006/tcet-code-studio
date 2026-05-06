import { useState, type ReactNode } from "react";
import { Save, Send, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { type Difficulty, type ProblemRecord } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EditableCase = {
  input: string;
  output: string;
  hidden: boolean;
};

type ProblemEditorFormProps = {
  heading: string;
  description: string;
  submitLabel: string;
  submitMessage: string;
  draftMessage: string;
  initialProblem?: ProblemRecord;
  topSlot?: ReactNode;
};

const defaultCases: EditableCase[] = [
  { input: "", output: "", hidden: false },
  { input: "", output: "", hidden: true },
];

export function ProblemEditorForm({
  heading,
  description,
  submitLabel,
  submitMessage,
  draftMessage,
  initialProblem,
  topSlot,
}: ProblemEditorFormProps) {
  const [title, setTitle] = useState(initialProblem?.title ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(initialProblem?.difficulty ?? "Easy");
  const [tags, setTags] = useState(initialProblem ? initialProblem.tags.join(", ") : "");
  const [statement, setStatement] = useState(initialProblem?.statement ?? "");
  const [inputFormat, setInputFormat] = useState(initialProblem?.inputFormat ?? "");
  const [outputFormat, setOutputFormat] = useState(initialProblem?.outputFormat ?? "");
  const [constraints, setConstraints] = useState(initialProblem ? initialProblem.constraints.join("\n") : "");
  const [timeLimit, setTimeLimit] = useState(initialProblem?.timeLimit ?? "1");
  const [memoryLimit, setMemoryLimit] = useState(initialProblem?.memoryLimit ?? "256");
  const [testCases, setTestCases] = useState<EditableCase[]>(
    initialProblem?.examples.map(({ input, output, hidden }) => ({ input, output, hidden })) ?? defaultCases,
  );

  const addCase = (hidden: boolean) => {
    setTestCases((current) => [...current, { input: "", output: "", hidden }]);
  };

  const removeCase = (index: number) => {
    setTestCases((current) => (current.length > 1 ? current.filter((_, caseIndex) => caseIndex !== index) : current));
  };

  const updateCase = (index: number, field: "input" | "output", value: string) => {
    setTestCases((current) =>
      current.map((testCase, caseIndex) =>
        caseIndex === index ? { ...testCase, [field]: value } : testCase,
      ),
    );
  };

  const saveDraft = () => {
    toast.success(draftMessage, {
      description: title ? `${title} has been saved in draft mode.` : undefined,
    });
  };

  const submitProblem = () => {
    toast.success(submitMessage, {
      description: title ? `${title} is ready for review.` : undefined,
    });
  };

  return (
    <div className="container max-w-5xl space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{heading}</h1>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveDraft}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submitProblem}>
            <Send className="mr-2 h-4 w-4" /> {submitLabel}
          </Button>
        </div>
      </div>

      {topSlot}

      <Card className="space-y-5 p-6 shadow-card">
        <h2 className="border-b border-border pb-2 font-display text-lg font-bold">Basic Info</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Problem Title</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Maximum Subarray Sum"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Difficulty</Label>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div>
            <Label>Tags / Topics (comma-separated)</Label>
            <Input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="Array, DP, Greedy"
              className="mt-1.5"
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-5 p-6 shadow-card">
        <h2 className="border-b border-border pb-2 font-display text-lg font-bold">Problem Description</h2>
        <div>
          <Label>Problem Statement</Label>
          <Textarea
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
            rows={6}
            placeholder="Describe the problem..."
            className="mt-1.5"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Input Format</Label>
            <Textarea
              value={inputFormat}
              onChange={(event) => setInputFormat(event.target.value)}
              rows={4}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Output Format</Label>
            <Textarea
              value={outputFormat}
              onChange={(event) => setOutputFormat(event.target.value)}
              rows={4}
              className="mt-1.5"
            />
          </div>
        </div>
        <div>
          <Label>Constraints</Label>
          <Textarea
            value={constraints}
            onChange={(event) => setConstraints(event.target.value)}
            rows={4}
            placeholder={"1 <= N <= 10^5\n1 <= A[i] <= 10^9"}
            className="mt-1.5 font-mono-code text-sm"
          />
        </div>
      </Card>

      <Card className="space-y-5 p-6 shadow-card">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="font-display text-lg font-bold">Test Cases</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => addCase(false)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Sample
            </Button>
            <Button size="sm" variant="outline" onClick={() => addCase(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Hidden
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {testCases.map((testCase, index) => (
            <div key={`${index}-${testCase.hidden ? "hidden" : "sample"}`} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  {testCase.hidden ? (
                    <EyeOff className="h-3.5 w-3.5 text-accent" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-success" />
                  )}
                  {testCase.hidden ? "Hidden" : "Sample"} Case {index + 1}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeCase(index)}
                  disabled={testCases.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-xs">Input</Label>
                  <Textarea
                    value={testCase.input}
                    onChange={(event) => updateCase(index, "input", event.target.value)}
                    rows={3}
                    className="mt-1 font-mono-code text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Expected Output</Label>
                  <Textarea
                    value={testCase.output}
                    onChange={(event) => updateCase(index, "output", event.target.value)}
                    rows={3}
                    className="mt-1 font-mono-code text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-5 p-6 shadow-card">
        <h2 className="border-b border-border pb-2 font-display text-lg font-bold">Limits</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Time Limit (seconds)</Label>
            <Input
              value={timeLimit}
              onChange={(event) => setTimeLimit(event.target.value)}
              type="number"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Memory Limit (MB)</Label>
            <Input
              value={memoryLimit}
              onChange={(event) => setMemoryLimit(event.target.value)}
              type="number"
              className="mt-1.5"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
