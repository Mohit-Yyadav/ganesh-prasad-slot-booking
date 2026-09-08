const Application = require("../models/Application");

/**
 * Generates a human-friendly, unique application ID like GP-2026-000123.
 * Retries on the rare chance of a collision.
 */
async function generateApplicationId() {
  const year = new Date().getFullYear();
  const count = await Application.countDocuments({});
  let seq = count + 1;

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `GP-${year}-${String(seq).padStart(6, "0")}`;
    const exists = await Application.exists({ applicationId: candidate });
    if (!exists) return candidate;
    seq += 1;
  }

  // Fallback: timestamp-based, virtually collision-proof
  return `GP-${year}-${Date.now()}`;
}

module.exports = { generateApplicationId };
