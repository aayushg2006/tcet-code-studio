import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { DifficultyBadge, StatusBadge } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { facultyProblems } from "@/data/mock";

export default function ManageProblems() {
  const [rows, setRows] = useState(() => facultyProblems);

  const handleDelete = (problemId: string, problemTitle: string) => {
    setRows((current) => current.filter((problem) => problem.id !== problemId));
    toast.success("Problem removed from the list", {
      description: `${problemTitle} has been archived from this local faculty view.`,
    });
  };

  return (
    <AppLayout>
      <div className="container space-y-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Manage Problems</h1>
            <p className="mt-1 text-muted-foreground">Edit, publish, and review problem performance.</p>
          </div>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/faculty/create-problem">
              <Plus className="mr-2 h-4 w-4" /> New Problem
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-secondary-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Difficulty</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Tags</th>
                  <th className="px-4 py-3 text-right font-semibold">Submissions</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((problem) => (
                  <tr key={problem.id} className="border-t border-border transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <Link to={`/faculty/problems/${problem.id}`} className="font-medium transition-colors hover:text-accent">
                        {problem.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <DifficultyBadge d={problem.difficulty} />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {problem.tags.map((tag) => (
                          <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-code">{problem.totalSubmissions}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={problem.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" className="h-8 w-8" aria-label={`View ${problem.title}`}>
                          <Link to={`/faculty/problems/${problem.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${problem.title}`}>
                          <Link to={`/faculty/problems/${problem.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          aria-label={`Delete ${problem.title}`}
                          onClick={() => handleDelete(problem.id, problem.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No problems are currently available in this faculty list.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
