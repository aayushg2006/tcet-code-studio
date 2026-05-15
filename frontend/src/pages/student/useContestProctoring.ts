import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { contestsApi } from "@/api/services";
import type { ContestAttempt, ContestProctoringPayload } from "@/api/types";

interface UseContestProctoringOptions {
  contestId: string;
  pathname: string;
  attempt: ContestAttempt | null;
  onAttemptUpdate: (attempt: ContestAttempt) => void;
}

const COOLDOWN_MS = 1500;

export function useContestProctoring({
  contestId,
  pathname,
  attempt,
  onAttemptUpdate,
}: UseContestProctoringOptions) {
  const cooldownsRef = useRef<Record<string, number>>({});
  const sawFullscreenRef = useRef(false);

  useEffect(() => {
    if (document.fullscreenElement) {
      sawFullscreenRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!attempt || attempt.status !== "ACTIVE") {
      return;
    }

    const shouldSkip = (bucket: string) => {
      const now = Date.now();
      const previous = cooldownsRef.current[bucket] ?? 0;
      if (now - previous < COOLDOWN_MS) {
        return true;
      }

      cooldownsRef.current[bucket] = now;
      return false;
    };

    const sendEvent = async (payload: ContestProctoringPayload, bucket: string, warning: string) => {
      if (shouldSkip(bucket)) {
        return;
      }

      try {
        const response = await contestsApi.recordProctorEvent(contestId, payload, pathname);
        onAttemptUpdate(response.attempt);
        const updated = response.attempt;
        const suffix =
          updated.status === "AUTO_SUBMITTED"
            ? " Attempt auto-submitted."
            : ` Violation ${updated.violationCount}/3.`;
        toast.warning(`${warning}${suffix}`);
      } catch (error) {
        toast.error((error as Error).message || "Failed to record proctoring event");
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void sendEvent({ type: "VISIBILITY_LOSS", details: "Document hidden" }, "switch", "Tab switch detected.");
      }
    };

    const onBlur = () => {
      void sendEvent({ type: "TAB_SWITCH", details: "Window blurred" }, "switch", "Focus left the contest window.");
    };

    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        sawFullscreenRef.current = true;
        return;
      }

      if (sawFullscreenRef.current) {
        void sendEvent(
          { type: "FULLSCREEN_EXIT", details: "Exited fullscreen" },
          "fullscreen",
          "Fullscreen exit detected.",
        );
      }
    };

    const onCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      void sendEvent({ type: "COPY", details: "Copy blocked" }, "clipboard", "Copy is not allowed during the contest.");
    };

    const onCut = (event: ClipboardEvent) => {
      event.preventDefault();
      void sendEvent({ type: "CUT", details: "Cut blocked" }, "clipboard", "Cut is not allowed during the contest.");
    };

    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      void sendEvent({ type: "PASTE", details: "Paste blocked" }, "clipboard", "Paste is not allowed during the contest.");
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      void sendEvent(
        { type: "CONTEXT_MENU", details: "Context menu blocked" },
        "contextmenu",
        "Context menu is disabled during the contest.",
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "PrintScreen") {
        void sendEvent(
          { type: "PRINT_SCREEN", details: "PrintScreen pressed" },
          "printscreen",
          "Screenshot key detected.",
        );
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [attempt, contestId, onAttemptUpdate, pathname]);
}
