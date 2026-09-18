// ⚠️ WARNING: Distribute credentials individually and delete scripts/output/ files once distribution is complete.
// Do not include scripts/output/ in any zip or export of this project.

const readline = require("readline");
const { execSync } = require("child_process");

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=== DB RESET SCRIPT ===");
  console.log("Fetching current record counts...\n");

  const counts = {
    users: await prisma.user.count(),
    pods: await prisma.pod.count(),
    weeks: await prisma.week.count(),
    submissions: await prisma.submission.count(),
    extraTaskSubmissions: await prisma.extraTaskSubmission.count(),
    badges: await prisma.badge.count(),
    announcements: await prisma.announcement.count(),
    extraTasks: await prisma.extraTask.count(),
    assignedExtraTasks: await prisma.assignedExtraTask.count(),
  };

  console.log("Current Record Summary to be DELETED:");
  console.table(counts);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve) => {
    rl.question(
      "\n⚠️ WARNING: This will reset the database and DELETE all records listed above!\nType 'yes' to confirm and proceed: ",
      (ans) => resolve(ans.trim().toLowerCase())
    );
  });
  rl.close();

  if (answer !== "yes") {
    console.log("\nReset cancelled. No data was deleted.");
    process.exit(0);
  }

  console.log("\nExecuting schema reset via Prisma ('npx prisma db push --force-reset')...");
  await prisma.$disconnect();

  try {
    execSync("npx prisma db push --force-reset", { stdio: "inherit" });
    console.log("\n✅ Database reset successfully! Schema recreated clean (no demo seed executed).");
  } catch (err) {
    console.error("\n❌ Database reset failed:", err.message);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
