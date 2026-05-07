import fs from "node:fs";
import admin from "firebase-admin";
import { env } from "./config/env";

function loadServiceAccount(): admin.ServiceAccount {
  const raw = fs.readFileSync(env.firebaseServiceAccountPath, "utf8");
  return JSON.parse(raw) as admin.ServiceAccount;
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
  });
}

export const db = admin.firestore();
