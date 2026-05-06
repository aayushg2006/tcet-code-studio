import { AppLayout } from "@/components/AppLayout";
import { ProblemEditorForm } from "@/components/ProblemEditorForm";

export default function CreateProblem() {
  return (
    <AppLayout>
      <ProblemEditorForm
        heading="Create New Problem"
        description="Design a meaningful challenge for your students."
        submitLabel="Publish"
        submitMessage="Problem published!"
        draftMessage="Draft saved"
      />
    </AppLayout>
  );
}
