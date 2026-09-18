const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '..', 'node_modules', '@prisma', 'client'));
const prisma = new PrismaClient();

async function resetProgramState() {
  console.log('=== STARTING PROGRAM STATE RESET ===\n');

  // Perform deletion and creation inside a Prisma transaction to guarantee atomicity & respect FK constraints
  await prisma.$transaction(async (tx) => {
    console.log('1. Clearing program activity tables in foreign key deletion order...');

    // 1. Child tables referencing ExtraTask / Submission / User
    const extraTaskSubmissionsDeleted = await tx.extraTaskSubmission.deleteMany({});
    console.log(`   - Deleted ${extraTaskSubmissionsDeleted.count} ExtraTaskSubmission records.`);

    const assignedExtraTasksDeleted = await tx.assignedExtraTask.deleteMany({});
    console.log(`   - Deleted ${assignedExtraTasksDeleted.count} AssignedExtraTask records.`);

    const submissionsDeleted = await tx.submission.deleteMany({});
    console.log(`   - Deleted ${submissionsDeleted.count} Submission records.`);

    const badgesDeleted = await tx.badge.deleteMany({});
    console.log(`   - Deleted ${badgesDeleted.count} Badge records.`);

    // 2. Parent table referencing Week
    const extraTasksDeleted = await tx.extraTask.deleteMany({});
    console.log(`   - Deleted ${extraTasksDeleted.count} ExtraTask records.`);

    // 3. Parent tables (Week, Announcement)
    const weeksDeleted = await tx.week.deleteMany({});
    console.log(`   - Deleted ${weeksDeleted.count} Week records.`);

    const announcementsDeleted = await tx.announcement.deleteMany({});
    console.log(`   - Deleted ${announcementsDeleted.count} Announcement records.`);

    console.log('\n2. Creating brand new active Week 1...');
    const deadlineDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newWeek = await tx.week.create({
      data: {
        weekNumber: 1,
        targetModule: 'installation and introduction',
        taskBrief: 'starting',
        isActive: true,
        deadline: deadlineDate,
      },
    });
    console.log(`   - Created Week 1 (id: ${newWeek.id}, deadline: ${newWeek.deadline.toISOString()}).`);

    console.log('\n3. Resetting student progress metrics...');
    const updatedUsers = await tx.user.updateMany({
      data: {
        streak: 0,
      },
    });
    console.log(`   - Reset progress metrics (streak = 0) for ${updatedUsers.count} user accounts.`);
  });

  console.log('\n=== VERIFICATION SUMMARY ===\n');

  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  const mentorCount = await prisma.user.count({ where: { role: 'MENTOR' } });
  const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
  const podCount = await prisma.pod.count();

  const totalWeeks = await prisma.week.count();
  const activeWeeks = await prisma.week.count({ where: { isActive: true } });

  const submissionCount = await prisma.submission.count();
  const extraTaskSubmissionCount = await prisma.extraTaskSubmission.count();
  const assignedExtraTaskCount = await prisma.assignedExtraTask.count();
  const extraTaskCount = await prisma.extraTask.count();
  const announcementCount = await prisma.announcement.count();
  const badgeCount = await prisma.badge.count();

  const studentsStreakGt0 = await prisma.user.count({ where: { role: 'STUDENT', streak: { gt: 0 } } });

  console.log('Users:');
  console.log(`- Admin count: ${adminCount}`);
  console.log(`- Mentor count: ${mentorCount}`);
  console.log(`- Student count: ${studentCount}`);

  console.log('\nPods:');
  console.log(`- Pod count: ${podCount}`);

  console.log('\nWeeks:');
  console.log(`- Total weeks: ${totalWeeks}`);
  console.log(`- Active weeks: ${activeWeeks}`);

  console.log('\nProgram Data:');
  console.log(`- Submission count: ${submissionCount}`);
  console.log(`- ExtraTaskSubmission count: ${extraTaskSubmissionCount}`);
  console.log(`- AssignedExtraTask count: ${assignedExtraTaskCount}`);
  console.log(`- ExtraTask count: ${extraTaskCount}`);
  console.log(`- Announcement count: ${announcementCount}`);
  console.log(`- Badge count: ${badgeCount}`);

  console.log('\nStudent Progress:');
  console.log(`- Students with streak > 0: ${studentsStreakGt0}`);
  console.log(`- Students with completed weeks > 0: ${await prisma.submission.count({ where: { status: 'COMPLETED' } })}`);

  console.log('\n========================================================');
  console.log('✅ PROGRAM STATE RESET COMPLETED SUCCESSFULLY.');
  console.log('========================================================\n');
}

resetProgramState()
  .catch((error) => {
    console.error('❌ Reset script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
