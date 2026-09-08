require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Slot = require("./models/Slot");
const Admin = require("./models/Admin");

const Application = require("./models/Application");

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

async function clearDatabase() {
  console.log("[seed] Clearing existing applications and slots...");
  const appRes = await Application.deleteMany({});
  const slotRes = await Slot.deleteMany({});
  console.log(`[seed] Deleted ${appRes.deletedCount} applications and ${slotRes.deletedCount} slots.`);
}

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
  const passwordHash = await Admin.hashPassword(password);

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.name = name;
    await existing.save();
    console.log(`[seed] Admin account refreshed for ${email}.`);
    return;
  }

  await Admin.create({ name, email, passwordHash });
  console.log(`[seed] Admin account created for ${email}.`);
  console.log("[seed] Password initialized from .env.");
}

async function run() {
  await connectDB();

  const isClear =
    process.argv.includes("--clear") ||
    process.argv.includes("--reset") ||
    process.env.CLEAR_DB === "true";

  if (isClear) {
    await clearDatabase();
  }

  await seedSlots();
  await seedAdmin();
  await mongoose.disconnect();
  console.log("[seed] Database seeding completed successfully.");
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});

