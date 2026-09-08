require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Slot = require("./models/Slot");
const Admin = require("./models/Admin");

const DATES = [
  "2026-09-14",
  "2026-09-15",
  "2026-09-16",
  "2026-09-17",
  "2026-09-18",
  "2026-09-19",
  "2026-09-20",
  "2026-09-21",
  "2026-09-22",
  "2026-09-23",
  "2026-09-24",
  "2026-09-25",
];

const SESSIONS = ["morning", "evening"];

async function seedSlots() {
  const ops = [];
  for (const date of DATES) {
    for (const session of SESSIONS) {
      ops.push({
        updateOne: {
          filter: { date, session },
          update: { $setOnInsert: { date, session, status: "available" } },
          upsert: true,
        },
      });
    }
  }
  const result = await Slot.bulkWrite(ops);
  console.log(
    `[seed] Slots ready. Inserted: ${result.upsertedCount || 0}, existing untouched: ${
      DATES.length * SESSIONS.length - (result.upsertedCount || 0)
    }`
  );
}

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || "Portal Admin";

  if (!email || !password) {
    console.warn(
      "[seed] SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin account creation."
    );
    return;
  }

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`[seed] Admin account already exists for ${email} — skipping.`);
    return;
  }

  const passwordHash = await Admin.hashPassword(password);
  await Admin.create({ name, email, passwordHash });
  console.log(`[seed] Admin account created for ${email}.`);
  console.log("[seed] IMPORTANT: change this password after first login in production.");
}

async function run() {
  await connectDB();
  await seedSlots();
  await seedAdmin();
  await mongoose.disconnect();
  console.log("[seed] Done.");
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
