// Dummy data for TCET Coding Platform

export const announcements = [
  { id: 1, title: "Weekly Contest #42 — Sunday 10 AM", date: "2026-05-04", tag: "Contest" },
  { id: 2, title: "New DP track released by Prof. Sharma", date: "2026-05-02", tag: "New" },
  { id: 3, title: "Mid-sem coding evaluation deadline: May 10", date: "2026-04-30", tag: "Deadline" },
];

export type Difficulty = "Easy" | "Medium" | "Hard";

export const problems = [
  { id: "p001", title: "Two Sum", difficulty: "Easy" as Difficulty, tags: ["Array", "Hash Map"], acceptance: 78, status: "solved", submissions: 1240 },
  { id: "p002", title: "Reverse Linked List", difficulty: "Easy" as Difficulty, tags: ["Linked List"], acceptance: 71, status: "solved", submissions: 980 },
  { id: "p003", title: "Longest Substring Without Repeating", difficulty: "Medium" as Difficulty, tags: ["String", "Sliding Window"], acceptance: 42, status: "attempted", submissions: 1502 },
  { id: "p004", title: "Median of Two Sorted Arrays", difficulty: "Hard" as Difficulty, tags: ["Array", "Binary Search"], acceptance: 28, status: "todo", submissions: 612 },
  { id: "p005", title: "Valid Parentheses", difficulty: "Easy" as Difficulty, tags: ["Stack", "String"], acceptance: 81, status: "solved", submissions: 2310 },
  { id: "p006", title: "Merge K Sorted Lists", difficulty: "Hard" as Difficulty, tags: ["Heap", "Linked List"], acceptance: 35, status: "todo", submissions: 540 },
  { id: "p007", title: "Coin Change", difficulty: "Medium" as Difficulty, tags: ["DP"], acceptance: 49, status: "attempted", submissions: 1102 },
  { id: "p008", title: "Word Ladder", difficulty: "Hard" as Difficulty, tags: ["BFS", "Graph"], acceptance: 31, status: "todo", submissions: 478 },
  { id: "p009", title: "Number of Islands", difficulty: "Medium" as Difficulty, tags: ["DFS", "Graph"], acceptance: 56, status: "solved", submissions: 1320 },
  { id: "p010", title: "Climbing Stairs", difficulty: "Easy" as Difficulty, tags: ["DP"], acceptance: 84, status: "solved", submissions: 2780 },
  { id: "p011", title: "Course Schedule", difficulty: "Medium" as Difficulty, tags: ["Graph", "Topo Sort"], acceptance: 47, status: "todo", submissions: 902 },
  { id: "p012", title: "Trapping Rain Water", difficulty: "Hard" as Difficulty, tags: ["Array", "Two Pointers"], acceptance: 39, status: "attempted", submissions: 720 },
];

export const recentSubmissions = [
  { id: "s1", problem: "Two Sum", lang: "C++", status: "Accepted", runtime: "4 ms", time: "2 min ago" },
  { id: "s2", problem: "Coin Change", lang: "Python", status: "Wrong Answer", runtime: "—", time: "12 min ago" },
  { id: "s3", problem: "Number of Islands", lang: "Java", status: "Accepted", runtime: "18 ms", time: "1 h ago" },
  { id: "s4", problem: "Climbing Stairs", lang: "C++", status: "Accepted", runtime: "0 ms", time: "Yesterday" },
];

export const leaderboard = [
  { rank: 1, name: "Aarav Mehta", roll: "TCET21CO001", solved: 312, score: 9840, accuracy: 88 },
  { rank: 2, name: "Diya Patel", roll: "TCET21CO014", solved: 298, score: 9420, accuracy: 91 },
  { rank: 3, name: "Rohan Iyer", roll: "TCET21CO022", solved: 281, score: 9105, accuracy: 84 },
  { rank: 4, name: "Sara Khan", roll: "TCET22CO007", solved: 254, score: 8520, accuracy: 79 },
  { rank: 5, name: "Kabir Nair", roll: "TCET22CO033", solved: 241, score: 8210, accuracy: 82 },
  { rank: 6, name: "Aditi Joshi", roll: "TCET22CO041", solved: 233, score: 7990, accuracy: 76 },
  { rank: 7, name: "Vivaan Rao", roll: "TCET23CO005", solved: 220, score: 7640, accuracy: 81 },
  { rank: 8, name: "Isha Verma", roll: "TCET23CO011", solved: 211, score: 7390, accuracy: 78 },
  { rank: 9, name: "Arjun Singh", roll: "TCET23CO019", solved: 198, score: 7050, accuracy: 74 },
  { rank: 10, name: "Meera Shah", roll: "TCET23CO028", solved: 187, score: 6820, accuracy: 80 },
];

export const studentProfile = {
  name: "Aarav Mehta",
  roll: "TCET21CO001",
  branch: "Computer Engineering",
  year: "Final Year",
  email: "aarav.mehta@tcetmumbai.in",
  rank: 1,
  solved: 312,
  submissions: 1284,
  accuracy: 88,
  streak: 47,
  badges: [
    { name: "DP Master", icon: "🧠", desc: "Solved 50+ DP problems" },
    { name: "Graph Guru", icon: "🕸️", desc: "Solved 30+ graph problems" },
    { name: "100 Day Streak", icon: "🔥", desc: "Coded 100 days in a row" },
    { name: "Contest Winner", icon: "🏆", desc: "Topped Weekly Contest #38" },
    { name: "Early Bird", icon: "🌅", desc: "First 10 to solve a Hard" },
  ],
};

export const facultyStats = {
  problemsCreated: 47,
  totalSubmissions: 12480,
  activeStudents: 326,
  avgAccuracy: 67,
};

export const facultyProblems = problems.map((p, i) => ({
  ...p,
  status: i % 4 === 0 ? "Draft" : "Published",
  totalSubmissions: 100 + i * 87,
}));

export const facultySubmissions = [
  { id: "f1", student: "Aarav Mehta", roll: "TCET21CO001", problem: "Two Sum", lang: "C++", status: "Accepted", runtime: "4 ms", memory: "8.1 MB", at: "2026-05-04 10:21" },
  { id: "f2", student: "Diya Patel", roll: "TCET21CO014", problem: "Coin Change", lang: "Python", status: "Wrong Answer", runtime: "—", memory: "—", at: "2026-05-04 10:18" },
  { id: "f3", student: "Rohan Iyer", roll: "TCET21CO022", problem: "Number of Islands", lang: "Java", status: "Accepted", runtime: "18 ms", memory: "42 MB", at: "2026-05-04 10:05" },
  { id: "f4", student: "Sara Khan", roll: "TCET22CO007", problem: "Word Ladder", lang: "C++", status: "TLE", runtime: "—", memory: "—", at: "2026-05-04 09:51" },
  { id: "f5", student: "Kabir Nair", roll: "TCET22CO033", problem: "Trapping Rain Water", lang: "C++", status: "Accepted", runtime: "9 ms", memory: "10.4 MB", at: "2026-05-04 09:42" },
  { id: "f6", student: "Aditi Joshi", roll: "TCET22CO041", problem: "Course Schedule", lang: "Python", status: "Accepted", runtime: "120 ms", memory: "16 MB", at: "2026-05-04 09:30" },
  { id: "f7", student: "Vivaan Rao", roll: "TCET23CO005", problem: "Climbing Stairs", lang: "Java", status: "Runtime Error", runtime: "—", memory: "—", at: "2026-05-04 09:15" },
];

export function getProblem(id: string) {
  return problems.find(p => p.id === id) ?? problems[0];
}
