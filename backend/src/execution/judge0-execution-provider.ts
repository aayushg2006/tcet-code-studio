import type { ExecutableLanguage, SubmissionStatus } from "../shared/types/domain";
import type { ExecutionProvider, ExecutionRequest, ExecutionResult, ExecutionTestCase } from "./execution-provider";
import {
  Judge0Client,
  Judge0ClientError,
  type Judge0SubmissionResponse,
} from "./judge0-client";

const PROVIDER_NAME = "judge0";

const EDITOR_ONLY_BLOCKLIST = new Set(["vanilla", "react", "html", "css"]);

type LanguageIdMap = Record<ExecutableLanguage, number | null>;

interface TestExecutionOutcome {
  status: SubmissionStatus;
  runtimeMs: number;
  memoryKb: number;
  stdout?: string;
  stderr?: string;
}

export class Judge0ExecutionProvider implements ExecutionProvider {
  private readonly client: Judge0Client;

  private readonly fallbackLanguageIds: LanguageIdMap = {
    c: 103,
    cpp: 105,
    java: 91,
    javascript: 102,
    python: 113,
    ruby: 72,
    arduino: null,
    go: 107,
    rust: 108,
    csharp: 51,
    php: 98,
    typescript: 101,
    assembly8086: 45,
    kotlin: 111,
    swift: 83,
    dart: 90,
    scala: 112,
    elixir: 57,
    erlang: 58,
    racket: null,
  };

  private readonly preferredLanguageNames: Record<ExecutableLanguage, readonly string[]> = {
    c: ["C (GCC 14.1.0)", "C (GCC 9.2.0)", "C (GCC 8.3.0)", "C (GCC 7.4.0)"],
    cpp: ["C++ (GCC 14.1.0)", "C++ (GCC 9.2.0)", "C++ (GCC 8.3.0)", "C++ (GCC 7.4.0)"],
    java: ["Java (JDK 17.0.6)", "Java (OpenJDK 13.0.1)"],
    javascript: [
      "JavaScript (Node.js 22.08.0)",
      "JavaScript (Node.js 20.17.0)",
      "JavaScript (Node.js 18.15.0)",
      "JavaScript (Node.js 12.14.0)",
    ],
    python: [
      "Python (3.14.0)",
      "Python (3.13.2)",
      "Python (3.12.5)",
      "Python (3.11.2)",
      "Python (3.8.1)",
    ],
    ruby: ["Ruby (2.7.0)"],
    arduino: [],
    go: ["Go (1.23.5)", "Go (1.22.0)", "Go (1.18.5)", "Go (1.13.5)"],
    rust: ["Rust (1.85.0)", "Rust (1.40.0)"],
    csharp: ["C# (Mono 6.6.0.161)"],
    php: ["PHP (8.3.11)", "PHP (7.4.1)"],
    typescript: ["TypeScript (5.6.2)", "TypeScript (5.0.3)", "TypeScript (3.7.4)"],
    assembly8086: ["Assembly (NASM 2.14.02)"],
    kotlin: ["Kotlin (2.1.10)", "Kotlin (1.3.70)"],
    swift: ["Swift (5.2.3)"],
    dart: ["Dart (2.19.2)"],
    scala: ["Scala (3.4.2)", "Scala (2.13.2)"],
    elixir: ["Elixir (1.9.4)"],
    erlang: ["Erlang (OTP 22.2)"],
    racket: [],
  };

  constructor(client = new Judge0Client()) {
    this.client = client;
  }

  async executeRun(request: ExecutionRequest): Promise<ExecutionResult> {
    const sample = request.testCases[0];

    if (!sample) {
      return this.buildInternalErrorResult(0, "No sample test case configured.");
    }

    const languageId = await this.resolveLanguageId(request.language);
    const result = await this.executeTestCase(request, sample, languageId);

    return {
      status: result.status,
      runtimeMs: result.runtimeMs,
      memoryKb: result.memoryKb,
      passedCount: result.status === "ACCEPTED" ? 1 : 0,
      totalCount: 1,
      provider: PROVIDER_NAME,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  async executeSubmission(request: ExecutionRequest): Promise<ExecutionResult> {
    if (request.testCases.length === 0) {
      return this.buildInternalErrorResult(0, "No test cases configured.");
    }

    const languageId = await this.resolveLanguageId(request.language);
    const results = await Promise.all(
      request.testCases.map((testCase) => this.executeTestCase(request, testCase, languageId)),
    );

    const passedCount = results.filter((result) => result.status === "ACCEPTED").length;
    const runtimeMs = results.reduce((max, result) => Math.max(max, result.runtimeMs), 0);
    const memoryKb = results.reduce((max, result) => Math.max(max, result.memoryKb), 0);
    const status = this.selectFinalStatus(results);
    const diagnostic = this.pickAggregateDiagnostic(results, status);

    return {
      status,
      runtimeMs,
      memoryKb,
      passedCount,
      totalCount: results.length,
      provider: PROVIDER_NAME,
      stdout: diagnostic?.stdout,
      stderr: diagnostic?.stderr,
    };
  }

  private async resolveLanguageId(language: ExecutableLanguage): Promise<number> {
    this.assertLanguageAllowed(language);

    const fallbackId = this.fallbackLanguageIds[language];
    if (fallbackId === null) {
      throw new Error(`Judge0 does not provide a first-class mapping for "${language}".`);
    }

    try {
      const languages = await this.client.getLanguages();
      const preferredNames = this.preferredLanguageNames[language];

      for (const preferredName of preferredNames) {
        const match = languages.find((candidate) => candidate.name === preferredName);
        if (match) {
          return match.id;
        }
      }

      const fallbackMatch = languages.find((candidate) => candidate.id === fallbackId);
      if (fallbackMatch) {
        return fallbackMatch.id;
      }
    } catch (error) {
      if (!(error instanceof Judge0ClientError)) {
        throw error;
      }
    }

    return fallbackId;
  }

  private assertLanguageAllowed(language: ExecutableLanguage): void {
    if (EDITOR_ONLY_BLOCKLIST.has(language as string)) {
      throw new Error(`Editor-only language "${language}" must not be executed.`);
    }
  }

  private async executeTestCase(
    request: ExecutionRequest,
    testCase: ExecutionTestCase,
    languageId: number,
  ): Promise<TestExecutionOutcome> {
    try {
      const response = await this.client.createSubmission({
        source_code: request.code,
        language_id: languageId,
        stdin: testCase.input,
        expected_output: testCase.output,
        cpu_time_limit: request.timeLimitSeconds,
        wall_time_limit: Math.max(request.timeLimitSeconds * 2, request.timeLimitSeconds + 1),
        memory_limit: request.memoryLimitMb * 1024,
        enable_network: false,
        redirect_stderr_to_stdout: false,
      });

      return this.normalizeJudge0Response(response);
    } catch (error) {
      if (error instanceof Judge0ClientError) {
        return {
          status: "INTERNAL_ERROR",
          runtimeMs: 0,
          memoryKb: 0,
          stderr: "Judge0 request failed.",
        };
      }

      throw error;
    }
  }

  private normalizeJudge0Response(response: Judge0SubmissionResponse): TestExecutionOutcome {
    return {
      status: this.normalizeStatus(response.status.id),
      runtimeMs: this.parseRuntimeMs(response.time),
      memoryKb: response.memory ?? 0,
      stdout: response.stdout ?? undefined,
      stderr: this.extractDiagnostic(response) ?? undefined,
    };
  }

  private normalizeStatus(statusId: number): SubmissionStatus {
    switch (statusId) {
      case 3:
        return "ACCEPTED";
      case 4:
        return "WRONG_ANSWER";
      case 5:
        return "TIME_LIMIT_EXCEEDED";
      case 6:
        return "COMPILATION_ERROR";
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 14:
        return "RUNTIME_ERROR";
      case 13:
        return "INTERNAL_ERROR";
      case 1:
      case 2:
      default:
        return "INTERNAL_ERROR";
    }
  }

  private parseRuntimeMs(timeInSeconds: string | null): number {
    if (!timeInSeconds) {
      return 0;
    }

    const parsed = Number(timeInSeconds);
    return Number.isFinite(parsed) ? Math.round(parsed * 1000) : 0;
  }

  private extractDiagnostic(response: Judge0SubmissionResponse): string | null {
    return response.compile_output ?? response.stderr ?? response.message;
  }

  private selectFinalStatus(results: readonly TestExecutionOutcome[]): SubmissionStatus {
    if (results.some((result) => result.status === "INTERNAL_ERROR")) {
      return "INTERNAL_ERROR";
    }

    const priority: SubmissionStatus[] = [
      "COMPILATION_ERROR",
      "RUNTIME_ERROR",
      "TIME_LIMIT_EXCEEDED",
      "WRONG_ANSWER",
      "ACCEPTED",
    ];

    for (const status of priority) {
      if (results.some((result) => result.status === status)) {
        return status;
      }
    }

    return "INTERNAL_ERROR";
  }

  private pickAggregateDiagnostic(
    results: readonly TestExecutionOutcome[],
    finalStatus: SubmissionStatus,
  ): TestExecutionOutcome | undefined {
    return (
      results.find((result) => result.status === finalStatus && (result.stderr || result.stdout)) ??
      results.find((result) => result.stderr || result.stdout)
    );
  }

  private buildInternalErrorResult(totalCount: number, stderr: string): ExecutionResult {
    return {
      status: "INTERNAL_ERROR",
      runtimeMs: 0,
      memoryKb: 0,
      passedCount: 0,
      totalCount,
      provider: PROVIDER_NAME,
      stderr,
    };
  }
}
