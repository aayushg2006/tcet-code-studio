import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ContestType = "Rated" | "Practice";
type BuilderQuestionType = "MCQ" | "MSQ" | "Coding";
type CodingDifficulty = "Easy" | "Medium" | "Hard";

type ContestMetadata = {
  title: string;
  startTime: string;
  duration: string;
  type: ContestType;
};

type BaseQuestion = {
  id: string;
  type: BuilderQuestionType;
  points: number;
};

type CodingQuestion = BaseQuestion & {
  type: "Coding";
  problemTitle: string;
  difficulty: CodingDifficulty;
  problemStatement: string;
  constraints: string;
  sampleInput: string;
  expectedOutput: string;
};

type ChoiceQuestion = BaseQuestion & {
  type: "MCQ" | "MSQ";
  statement: string;
  options: string[];
  correctAnswer: string;
  correctAnswers: string[];
};

type BuilderQuestion = CodingQuestion | ChoiceQuestion;

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

function createQuestion(type: BuilderQuestionType): BuilderQuestion {
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (type === "Coding") {
    return {
      id,
      type,
      problemTitle: "",
      difficulty: "Easy",
      problemStatement: "",
      constraints: "",
      sampleInput: "",
      expectedOutput: "",
      points: 100,
    };
  }

  return {
    id,
    type,
    statement: "",
    options: ["", "", "", ""],
    correctAnswer: "A",
    correctAnswers: [],
    points: 10,
  };
}

export default function CreateContest() {
  const [metadata, setMetadata] = useState<ContestMetadata>({
    title: "",
    startTime: "",
    duration: "",
    type: "Rated",
  });
  const [questions, setQuestions] = useState<BuilderQuestion[]>([]);

  const totalPoints = useMemo(
    () => questions.reduce((acc, question) => acc + (Number.isFinite(question.points) ? question.points : 0), 0),
    [questions],
  );

  const addQuestion = (type: BuilderQuestionType) => {
    setQuestions((current) => [...current, createQuestion(type)]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((current) => current.filter((question) => question.id !== id));
  };

  const updateQuestion = (id: string, updater: (question: BuilderQuestion) => BuilderQuestion) => {
    setQuestions((current) => current.map((question) => (question.id === id ? updater(question) : question)));
  };

  const handleSubmit = () => {
    const payload = {
      ...metadata,
      duration: Number(metadata.duration),
      questions,
    };

    console.log("Create contest payload:", payload);
    toast.success("Contest payload prepared successfully");
  };

  return (
    <AppLayout>
      <div className="container space-y-6 py-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Create Contest</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure contest metadata and build mixed question sets.</p>
        </div>

        <Card className="space-y-4 border border-border bg-background p-6 shadow-none">
          <h2 className="text-lg font-semibold">Contest Metadata</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={metadata.title}
                onChange={(event) => setMetadata((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g. T&P Assessment Round 3"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <Input
                type="datetime-local"
                value={metadata.startTime}
                onChange={(event) => setMetadata((current) => ({ ...current, startTime: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                min={1}
                value={metadata.duration}
                onChange={(event) => setMetadata((current) => ({ ...current, duration: event.target.value }))}
                placeholder="120"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contest Type</label>
              <Select value={metadata.type} onValueChange={(value: ContestType) => setMetadata((current) => ({ ...current, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rated">Rated</SelectItem>
                  <SelectItem value="Practice">Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="space-y-5 border border-border bg-background p-6 shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Question Builder</h2>
            <p className="text-sm text-muted-foreground">
              {questions.length} question{questions.length === 1 ? "" : "s"} • {totalPoints} pts total
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => addQuestion("MCQ")}>
              Add MCQ
            </Button>
            <Button variant="outline" onClick={() => addQuestion("MSQ")}>
              Add MSQ
            </Button>
            <Button variant="outline" onClick={() => addQuestion("Coding")}>
              Add Coding Problem
            </Button>
          </div>

          <div>
            {questions.length === 0 && (
              <Card className="border border-dashed border-border p-4 text-sm text-muted-foreground shadow-none">
                No questions added yet.
              </Card>
            )}

            {questions.map((question, index) => (
              <Card key={question.id} className="mb-4 border border-border p-4 shadow-none last:mb-0">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      Q{index + 1} • {question.type}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeQuestion(question.id)}>
                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </div>

                {question.type === "Coding" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Problem Title</label>
                      <Input
                        value={question.problemTitle}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) =>
                            current.type === "Coding"
                              ? { ...current, problemTitle: event.target.value }
                              : current,
                          )
                        }
                        placeholder="e.g. Reverse a Linked List"
                      />
                    </div>

                    <div className="space-y-2 md:max-w-xs">
                      <label className="text-sm font-medium">Difficulty</label>
                      <Select
                        value={question.difficulty}
                        onValueChange={(value: CodingDifficulty) =>
                          updateQuestion(question.id, (current) =>
                            current.type === "Coding" ? { ...current, difficulty: value } : current,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Problem Statement</label>
                      <Textarea
                        className="min-h-[100px]"
                        value={question.problemStatement}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) =>
                            current.type === "Coding"
                              ? { ...current, problemStatement: event.target.value }
                              : current,
                          )
                        }
                        placeholder="Instructions for the student"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Constraints</label>
                      <Textarea
                        value={question.constraints}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) =>
                            current.type === "Coding"
                              ? { ...current, constraints: event.target.value }
                              : current,
                          )
                        }
                        placeholder="e.g. 1 <= N <= 10^5"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sample Input</label>
                        <Textarea
                          value={question.sampleInput}
                          onChange={(event) =>
                            updateQuestion(question.id, (current) =>
                              current.type === "Coding"
                                ? { ...current, sampleInput: event.target.value }
                                : current,
                            )
                          }
                          placeholder="Input example"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Expected Output</label>
                        <Textarea
                          value={question.expectedOutput}
                          onChange={(event) =>
                            updateQuestion(question.id, (current) =>
                              current.type === "Coding"
                                ? { ...current, expectedOutput: event.target.value }
                                : current,
                            )
                          }
                          placeholder="Output example"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:max-w-xs">
                      <label className="text-sm font-medium">Points</label>
                      <Input
                        type="number"
                        min={1}
                        value={question.points}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            points: Number(event.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Question Statement</label>
                      <Textarea
                        value={question.statement}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) =>
                            current.type === "MCQ" || current.type === "MSQ"
                              ? { ...current, statement: event.target.value }
                              : current,
                          )
                        }
                        placeholder="Enter the question statement"
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {OPTION_KEYS.map((optionKey, optionIndex) => (
                        <div key={optionKey} className="space-y-2">
                          <label className="text-sm font-medium">Option {optionKey}</label>
                          <Input
                            value={question.options[optionIndex] ?? ""}
                            onChange={(event) =>
                              updateQuestion(question.id, (current) => {
                                if (current.type !== "MCQ" && current.type !== "MSQ") {
                                  return current;
                                }

                                const nextOptions = [...current.options];
                                nextOptions[optionIndex] = event.target.value;
                                return { ...current, options: nextOptions };
                              })
                            }
                            placeholder={`Option ${optionKey}`}
                          />
                        </div>
                      ))}
                    </div>

                    {question.type === "MCQ" ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Correct Answer</label>
                          <Select
                            value={question.correctAnswer}
                            onValueChange={(value) =>
                              updateQuestion(question.id, (current) =>
                                current.type === "MCQ" ? { ...current, correctAnswer: value } : current,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select correct option" />
                            </SelectTrigger>
                            <SelectContent>
                              {OPTION_KEYS.map((key) => (
                                <SelectItem key={key} value={key}>
                                  {key}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Points</label>
                          <Input
                            type="number"
                            min={1}
                            value={question.points}
                            onChange={(event) =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                points: Number(event.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Correct Answers</label>
                          <div className="mt-2 grid gap-2 md:grid-cols-4">
                            {OPTION_KEYS.map((key) => {
                              const checked = question.correctAnswers.includes(key);
                              return (
                                <label key={key} className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(nextChecked) =>
                                      updateQuestion(question.id, (current) => {
                                        if (current.type !== "MSQ") {
                                          return current;
                                        }

                                        const normalizedChecked = Boolean(nextChecked);
                                        const nextAnswers = normalizedChecked
                                          ? [...current.correctAnswers, key]
                                          : current.correctAnswers.filter((answer) => answer !== key);

                                        return { ...current, correctAnswers: nextAnswers };
                                      })
                                    }
                                  />
                                  <span>Option {key}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2 md:max-w-xs">
                          <label className="text-sm font-medium">Points</label>
                          <Input
                            type="number"
                            min={1}
                            value={question.points}
                            onChange={(event) =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                points: Number(event.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSubmit}>
            Create Contest
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
