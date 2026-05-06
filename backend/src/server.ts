import express from "express";
import { db } from "./firebase";

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