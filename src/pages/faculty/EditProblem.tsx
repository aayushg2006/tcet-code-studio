import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Eye, FileText, Layers3 } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { DifficultyBadge, StatusBadge } from "@/components/Badges";
import { ProblemEditorForm } from "@/components/ProblemEditorForm";
import { Card } from "@/components/ui/card";
import { getFacultyProblem, getProblem } from "@/data/mock";

export default function EditProblem() {
  const { id = "p001" } = useParams();
  const problem = getProblem(id);
  const facultyProblem = getFacultyProblem(id);

  return (
    <AppLayout>
      <ProblemEditorForm
        key={problem.id}
        heading="Edit Problem"
        description={`Refine ${problem.title} while keeping the faculty console style, spacing, and publishing flow intact.`}
        submitLabel="Update Problem"
        submitMessage="Problem updated"
        draftMessage="Draft changes saved"
        initialProblem={problem}
        topSlot={
          <div className="space-y-3">
            <Link
              to={`/faculty/problems/${problem.id}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" /> Back to problem overview
            </Link>

            <Card className="grid gap-4 p-5 shadow-card md:grid-cols-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current State</div>
                <div className="flex items-center gap-2">
                  <DifficultyBadge d={problem.difficulty} />
                  <StatusBadge status={facultyProblem.status} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Layers3 className="h-3.5 w-3.5 text-accent" />
                  Topic Count
                </div>
                <div className="font-display text-2xl font-bold">{problem.tags.length}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Eye className="h-3.5 w-3.5 text-accent" />
                  Submissions
                </div>
                <div className="font-display text-2xl font-bold">{facultyProblem.totalSubmissions}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5 text-accent" />
                  Last Updated
                </div>
                <div className="font-mono-code text-sm font-semibold">{facultyProblem.lastUpdated}</div>
              </div>
              <div className="rounded-lg border border-border bg-secondary/35 px-4 py-3 text-sm text-muted-foreground md:col-span-4">
                <span className="mr-2 inline-flex items-center gap-1 font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-accent" /> Editing notes
                </span>
                Keep the description, constraints, and testcase coverage aligned with the student-facing preview before publishing updates.
              </div>
            </Card>
          </div>
        }
      />
    </AppLayout>
  );
}
