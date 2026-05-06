import { db } from "./firebase";

async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // ================= USERS =================
    const users = [
      {
        email: "student1@tcet.com",
        name: "Soham Jain",
        role: "STUDENT",
        department: "AI&DS",
        uid: "TCET001",
        rating: 0,
        problemsSolved: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "faculty1@tcet.com",
        name: "Prof. Mehta",
        role: "FACULTY",
        department: "IT",
        rating: 0,
        problemsSolved: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    for (const user of users) {
      await db.collection("users").doc(user.email).set(user);
    }

    // ================= PROBLEMS =================
    const problems = [
      {
        id: "problem_001",
        title: "Hello World in C",
        objective: "Learn basic I/O in C",
        task: "Print Hello World and input string",

        inputFormat: "Single string input",
        outputFormat: "Print Hello World + input",
        constraints: "1 <= length <= 1000",

        sampleInput: "Welcome",
        sampleOutput: "Hello, World!\nWelcome",
        explanation: "Print static + dynamic input",

        testCases: [
          { input: "abc", output: "Hello, World!\nabc" },
          { input: "TCET", output: "Hello, World!\nTCET" }
        ],

        difficulty: "EASY",
        tags: ["C", "basics"],

        createdBy: "faculty1@tcet.com",
        createdByRole: "FACULTY",

        approved: true,

        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    for (const problem of problems) {
      await db.collection("problems").doc(problem.id).set(problem);
    }

    // ================= SUBMISSIONS =================
    const submissions = [
      {
        userEmail: "student1@tcet.com",
        problemId: "problem_001",

        code: "#include<stdio.h> ...",
        language: "c",

        status: "accepted",
        executionTime: 120,

        testCasesPassed: 2,
        totalTestCases: 2,

        createdAt: new Date(),
      }
    ];

    for (const sub of submissions) {
      await db.collection("submissions").add(sub);
    }

    // ================= LEADERBOARD =================
    const leaderboard = [
      {
        email: "student1@tcet.com",
        rating: 100,
        rank: 1,
        problemsSolved: 1,
        lastUpdated: new Date(),
      }
    ];

    for (const entry of leaderboard) {
      await db.collection("leaderboard").doc(entry.email).set(entry);
    }

    console.log("🔥 Database seeded successfully!");
  } catch (error) {
    console.error(error);
  }
}

seedDatabase();