import { cn } from "@/lib/utils";
import type { Difficulty } from "@/data/mock";

export function DifficultyBadge({ d }: { d: Difficulty }) {
  const styles = {
    Easy: "bg-success/15 text-success border-success/30",
    Medium: "bg-warning/15 text-warning border-warning/40",
    Hard: "bg-destructive/15 text-destructive border-destructive/40",
  }[d];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border", styles)}>
      {d}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Accepted: "bg-success/15 text-success border-success/30",
    "Wrong Answer": "bg-destructive/15 text-destructive border-destructive/40",
    TLE: "bg-warning/15 text-warning border-warning/40",
    "Runtime Error": "bg-destructive/15 text-destructive border-destructive/40",
    Published: "bg-success/15 text-success border-success/30",
    Draft: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border", map[status] ?? "bg-muted text-muted-foreground border-border")}>
      {status}
    </span>
  );
}
