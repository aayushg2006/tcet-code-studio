import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers/create-test-app";

const facultyHeaders = {
  "x-mock-role": "FACULTY",
  "x-mock-email": "faculty1@tcetmumbai.in",
  "x-mock-name": "Prof. Mehta",
};

async function createProblem(app: Parameters<typeof request>[0], overrides: Record<string, unknown> = {}) {
  const response = await request(app)
    .post("/api/problems")
    .set(facultyHeaders)
    .send({
      title: "Two Sum Variant",
      statement: "Return the indices of the pair that adds to the target.",
      inputFormat: "Array and target",
      outputFormat: "Two indices",
      constraints: ["2 <= n <= 10^5"],
      difficulty: "Easy",
      tags: ["Array", "Hash Map"],
      timeLimitSeconds: 1,
      memoryLimitMb: 256,
      lifecycleState: "Published",
      sampleTestCases: [{ input: "2 7 11 15\n9", output: "0 1" }],
      hiddenTestCases: [{ input: "1 5 1 5\n10", output: "1 3" }],
      ...overrides,
    });

  expect(response.status).toBe(201);
  return response.body.problem;
}

describe("TCET Code Studio backend APIs", () => {
  it("auto-provisions users through mock auth and preserves the legacy profile route", async () => {
    const { app } = createTestApp();

    const currentUserResponse = await request(app).get("/api/users/me");
    expect(currentUserResponse.status).toBe(200);
    expect(currentUserResponse.body.user.email).toBe("student1@tcetmumbai.in");
    expect(currentUserResponse.body.user.role).toBe("STUDENT");
    expect(currentUserResponse.body.user.rating).toBe(0);
    expect(currentUserResponse.body.user.rank).toBe(1);

    const legacyProfileResponse = await request(app)
      .get("/api/user/profile")
      .set({
        "x-mock-role": "FACULTY",
        "x-mock-email": "faculty@tcetmumbai.in",
      });

    expect(legacyProfileResponse.status).toBe(200);
    expect(legacyProfileResponse.body.email).toBe("faculty@tcetmumbai.in");
    expect(legacyProfileResponse.body.role).toBe("FACULTY");
  });

  it("supports faculty problem workflows and redacts hidden cases from student detail responses", async () => {
    const { app } = createTestApp();

    const createdProblem = await createProblem(app, { lifecycleState: "Draft" });

    const initialStudentList = await request(app).get("/api/problems");
    expect(initialStudentList.status).toBe(200);
    expect(initialStudentList.body.items).toHaveLength(0);

    const publishResponse = await request(app)
      .patch(`/api/problems/${createdProblem.id}/state`)
      .set(facultyHeaders)
      .send({ lifecycleState: "Published" });

    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.problem.lifecycleState).toBe("Published");

    const studentList = await request(app).get("/api/problems");
    expect(studentList.status).toBe(200);
    expect(studentList.body.items).toHaveLength(1);
    expect(studentList.body.items[0].id).toBe(createdProblem.id);

    const studentDetail = await request(app).get(`/api/problems/${createdProblem.id}`);
    expect(studentDetail.status).toBe(200);
    expect(studentDetail.body.problem.sampleTestCases).toHaveLength(1);
    expect(studentDetail.body.problem.hiddenTestCases).toBeUndefined();
    expect(studentDetail.body.problem.examples).toHaveLength(1);

    const facultyDetail = await request(app)
      .get(`/api/problems/manage/${createdProblem.id}`)
      .set(facultyHeaders);

    expect(facultyDetail.status).toBe(200);
    expect(facultyDetail.body.problem.hiddenTestCases).toHaveLength(1);
  });

  it("keeps sample runs non-persistent and awards rating only for the first accepted unique solve", async () => {
    const { app, services } = createTestApp();
    const createdProblem = await createProblem(app);

    const runResponse = await request(app).post("/api/submissions/run").send({
      problemId: createdProblem.id,
      code: "print('accepted')",
      language: "python",
    });

    expect(runResponse.status).toBe(200);
    expect(runResponse.body.result.status).toBe("ACCEPTED");

    const initialSubmissionList = await request(app).get("/api/submissions");
    expect(initialSubmissionList.status).toBe(200);
    expect(initialSubmissionList.body.items).toHaveLength(0);

    const wrongAnswerResponse = await request(app).post("/api/submissions").send({
      problemId: createdProblem.id,
      code: "wrong_answer",
      language: "python",
    });

    expect(wrongAnswerResponse.status).toBe(202);
    const wrongAnswerSubmission = await services.submissionService.processQueuedSubmission(
      wrongAnswerResponse.body.submission_id,
      "test-job-1",
    );
    expect(wrongAnswerSubmission.status).toBe("WRONG_ANSWER");
    expect(wrongAnswerSubmission.ratingAwarded).toBe(0);

    const acceptedResponse = await request(app).post("/api/submissions").send({
      problemId: createdProblem.id,
      code: "accepted",
      language: "python",
    });

    expect(acceptedResponse.status).toBe(202);
    const acceptedSubmission = await services.submissionService.processQueuedSubmission(
      acceptedResponse.body.submission_id,
      "test-job-2",
    );
    expect(acceptedSubmission.status).toBe("ACCEPTED");
    expect(acceptedSubmission.ratingAwarded).toBe(100);

    const repeatedAcceptedResponse = await request(app).post("/api/submissions").send({
      problemId: createdProblem.id,
      code: "accepted again",
      language: "python",
    });

    expect(repeatedAcceptedResponse.status).toBe(202);
    const repeatedAcceptedSubmission = await services.submissionService.processQueuedSubmission(
      repeatedAcceptedResponse.body.submission_id,
      "test-job-3",
    );
    expect(repeatedAcceptedSubmission.ratingAwarded).toBe(0);

    const currentUserResponse = await request(app).get("/api/users/me");
    expect(currentUserResponse.status).toBe(200);
    expect(currentUserResponse.body.user.rating).toBe(100);
    expect(currentUserResponse.body.user.problemsSolved).toBe(1);
    expect(currentUserResponse.body.user.submissionCount).toBe(3);
    expect(currentUserResponse.body.user.acceptedSubmissionCount).toBe(2);
    expect(currentUserResponse.body.user.accuracy).toBeCloseTo(66.67, 2);

    const manageDetail = await request(app)
      .get(`/api/problems/manage/${createdProblem.id}`)
      .set(facultyHeaders);

    expect(manageDetail.status).toBe(200);
    expect(manageDetail.body.problem.totalSubmissions).toBe(3);
    expect(manageDetail.body.problem.acceptanceRate).toBeCloseTo(66.67, 2);
  });

  it("normalizes execution language aliases and rejects editor-only submission languages", async () => {
    const { app } = createTestApp();
    const createdProblem = await createProblem(app);

    const aliasRunResponse = await request(app).post("/api/submissions/run").send({
      problemId: createdProblem.id,
      code: "accepted",
      language: "py",
    });

    expect(aliasRunResponse.status).toBe(200);
    expect(aliasRunResponse.body.result.language).toBe("python");

    const editorOnlyRunResponse = await request(app).post("/api/submissions/run").send({
      problemId: createdProblem.id,
      code: "accepted",
      language: "react",
    });

    expect(editorOnlyRunResponse.status).toBe(400);
    expect(editorOnlyRunResponse.body.message).toBe("Validation failed");
  });

  it("excludes faculty from the leaderboard, breaks rating ties by accuracy, and scopes submissions correctly", async () => {
    const { app, services } = createTestApp();
    const facultyProfileResponse = await request(app).get("/api/users/me").set(facultyHeaders);
    expect(facultyProfileResponse.status).toBe(200);
    expect(facultyProfileResponse.body.user.rank).toBeNull();

    const easyProblemOne = await createProblem(app, { title: "Easy Rating Problem A", difficulty: "Easy" });
    const easyProblemTwo = await createProblem(app, { title: "Easy Rating Problem B", difficulty: "Easy" });
    const mediumProblem = await createProblem(app, { title: "Medium Rating Problem", difficulty: "Medium" });

    const firstStudentAcceptedOne = await request(app).post("/api/submissions").send({
      problemId: easyProblemOne.id,
      code: "accepted",
      language: "python",
    });
    expect(firstStudentAcceptedOne.status).toBe(202);
    await services.submissionService.processQueuedSubmission(firstStudentAcceptedOne.body.submission_id, "test-job-4");

    const firstStudentAcceptedTwo = await request(app).post("/api/submissions").send({
      problemId: easyProblemTwo.id,
      code: "accepted",
      language: "python",
    });
    expect(firstStudentAcceptedTwo.status).toBe(202);
    await services.submissionService.processQueuedSubmission(firstStudentAcceptedTwo.body.submission_id, "test-job-5");

    const firstStudentWrongAnswer = await request(app).post("/api/submissions").send({
      problemId: easyProblemOne.id,
      code: "wrong_answer",
      language: "python",
    });
    expect(firstStudentWrongAnswer.status).toBe(202);
    await services.submissionService.processQueuedSubmission(firstStudentWrongAnswer.body.submission_id, "test-job-6");

    const secondStudentHeaders = {
      "x-mock-email": "student2@tcetmumbai.in",
      "x-mock-role": "STUDENT",
      "x-mock-name": "Student Two",
    };

    const secondStudentSubmission = await request(app)
      .post("/api/submissions")
      .set(secondStudentHeaders)
      .send({
        problemId: mediumProblem.id,
        code: "accepted",
        language: "python",
      });

    expect(secondStudentSubmission.status).toBe(202);
    const processedSecondStudentSubmission = await services.submissionService.processQueuedSubmission(
      secondStudentSubmission.body.submission_id,
      "test-job-7",
    );

    const leaderboardResponse = await request(app).get("/api/leaderboard");
    expect(leaderboardResponse.status).toBe(200);
    expect(leaderboardResponse.body.items.map((item: { email: string }) => item.email)).not.toContain(
      "faculty1@tcetmumbai.in",
    );
    expect(leaderboardResponse.body.items[0].email).toBe("student2@tcetmumbai.in");
    expect(leaderboardResponse.body.items[0].rating).toBe(200);
    expect(leaderboardResponse.body.items[0].accuracy).toBe(100);
    expect(leaderboardResponse.body.items[1].email).toBe("student1@tcetmumbai.in");
    expect(leaderboardResponse.body.items[1].rating).toBe(200);
    expect(leaderboardResponse.body.items[1].accuracy).toBeCloseTo(66.67, 2);
    expect(leaderboardResponse.body.items[1].problemsSolved).toBe(2);

    const studentSubmissionList = await request(app).get("/api/submissions");
    expect(studentSubmissionList.status).toBe(200);
    expect(studentSubmissionList.body.items).toHaveLength(3);
    expect(studentSubmissionList.body.items[0].userEmail).toBe("student1@tcetmumbai.in");

    const facultySubmissionList = await request(app)
      .get("/api/submissions")
      .set(facultyHeaders)
      .query({ userEmail: "student2@tcetmumbai.in" });

    expect(facultySubmissionList.status).toBe(200);
    expect(facultySubmissionList.body.items).toHaveLength(1);
    expect(facultySubmissionList.body.items[0].userEmail).toBe("student2@tcetmumbai.in");

    const forbiddenSubmissionDetail = await request(app).get(
      `/api/submissions/${processedSecondStudentSubmission.id}`,
    );
    expect(forbiddenSubmissionDetail.status).toBe(403);

    const csvExportResponse = await request(app).get("/api/leaderboard/export").set(facultyHeaders);
    expect(csvExportResponse.status).toBe(200);
    expect(csvExportResponse.text).toContain("student2@tcetmumbai.in");
    expect(csvExportResponse.text).not.toContain("faculty1@tcetmumbai.in");
    expect(csvExportResponse.text).toContain("rating");
  });
});
