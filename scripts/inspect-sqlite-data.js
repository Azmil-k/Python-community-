const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, '..', 'prisma', 'dev.db'));

const tables = ['Pod', 'User', 'Week', 'Submission', 'Badge', 'Announcement', 'ExtraTask', 'AssignedExtraTask', 'ExtraTaskSubmission'];
for (const table of tables) {
  const count = db.prepare(`SELECT COUNT(*) as count FROM \`${table}\``).get().count;
  console.log(`${table}: ${count}`);
}
