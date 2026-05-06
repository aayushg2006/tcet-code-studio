import express from "express";
import { db } from "./firebase";
import { authMiddleware } from "./middleware/auth";
import cookieParser from "cookie-parser";



const app = express();

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.get("/test-db", async (req, res) => {
  try {
    await db.collection("test").doc("demo").set({
      message: "Firebase connected 🚀",
      time: new Date(),
    });

    res.send("Database working ✅");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to DB");
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
app.use(cookieParser());
app.get("/api/user/profile", authMiddleware, async (req: any, res) => {
  const { email, role } = req.user;

  const userRef = db.collection("users").doc(email);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    await userRef.set({
      email,
      role,
      rating: 0,
      problemsSolved: 0,
      createdAt: new Date(),
    });
  }

  const userData = (await userRef.get()).data();

  res.json(userData);
});