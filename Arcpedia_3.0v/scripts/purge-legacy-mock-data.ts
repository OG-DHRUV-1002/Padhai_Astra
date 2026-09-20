/**
 * Data Migration Specialist — Task: Legacy Mock Data Purge
 *
 * Deletes demo/placeholder data that predates the Arcpedia + Campus Nexus
 * unification, so old mock records (e.g. the "Tony Stark" demo user, sample
 * courses/quizzes seeded during early prototyping) don't collide with or
 * pollute the new unified Firestore database.
 *
 * SAFETY: defaults to --dry-run. Nothing is deleted unless you pass --execute.
 * Always run --dry-run first and read the printed counts before executing.
 *
 * Usage (this repo uses tsx, not ts-node — see genkit:dev in package.json):
 *   npx tsx scripts/purge-legacy-mock-data.ts --dry-run
 *   npx tsx scripts/purge-legacy-mock-data.ts --execute
 *
 * REQUIRED SETUP — this repo does not have firebase-admin installed yet:
 *   npm install --save-dev firebase-admin
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing at a service
 * account JSON with Firestore access (do NOT hardcode the path/key here).
 * Get this from Firebase Console > Project Settings > Service Accounts >
 * Generate new private key. Store it outside the repo, add its path to
 * .env.local (which is already gitignored), and load it before running:
 *   export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/serviceAccountKey.json"
 */

import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, WriteBatch, QueryDocumentSnapshot } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}

const db = getFirestore();

// Known markers of legacy/demo data from the pre-unification prototypes.
// Extend this list if you find other demo artifacts during the dry run.
const LEGACY_MARKERS: Record<string, { field: string; values: string[] }> = {
  // Matches all 3 hardcoded demo accounts in src/context/student-context.tsx
  // (DEFAULT_ACCOUNTS) by email, not name — 'Tony Stark' alone would miss
  // the teacher and student demo accounts.
  users: { field: 'email', values: ['admin@stark.edu', 'strange@stark.edu', 'peter@stark.edu'] },
  courses: { field: 'id', values: ['cj', 'dsa', 'se', 'pcs', 'os'] },
  quizzes: { field: 'id', values: ['quiz1', 'quiz2', 'quiz3'] },
  announcements: { field: 'id', values: ['ann1', 'ann2'] },
  upcomingEvents: { field: 'id', values: ['evt1', 'evt2', 'evt3'] },
  forumPosts: { field: 'id', values: ['post1', 'post2', 'post3', 'post4', 'post5', 'post6'] },
  memoryItems: { field: 'id', values: ['mem1'] },
};

async function purgeCollection(
  collectionName: string,
  field: string,
  values: string[],
  execute: boolean
): Promise<number> {
  const collectionRef = db.collection(collectionName);
  let matchCount = 0;

  // Firestore 'in' queries max out at 30 values — chunk defensively even though
  // our current lists are small, so this keeps working as markers grow.
  const chunks: string[][] = [];
  for (let i = 0; i < values.length; i += 30) {
    chunks.push(values.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    const snapshot = await collectionRef.where(field, 'in', chunk).get();
    matchCount += snapshot.size;

    if (snapshot.empty) continue;

    console.log(`  Found ${snapshot.size} legacy doc(s) in '${collectionName}' matching ${field} in [${chunk.join(', ')}]`);
    snapshot.forEach((doc: QueryDocumentSnapshot) => console.log(`    - ${doc.id}`));

    if (execute) {
      const batch: WriteBatch = db.batch();
      snapshot.forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));
      await batch.commit();
      console.log(`  Deleted ${snapshot.size} doc(s) from '${collectionName}'.`);
    }
  }

  return matchCount;
}

async function main() {
  const execute = process.argv.includes('--execute');
  const dryRun = !execute;

  console.log(dryRun ? 'Running in DRY RUN mode — nothing will be deleted.\n' : 'Running in EXECUTE mode — matched documents WILL be deleted.\n');

  let totalMatched = 0;

  for (const [collectionName, { field, values }] of Object.entries(LEGACY_MARKERS)) {
    console.log(`Checking collection: ${collectionName}`);
    const count = await purgeCollection(collectionName, field, values, execute);
    totalMatched += count;
  }

  console.log(`\n${dryRun ? 'Would delete' : 'Deleted'} ${totalMatched} legacy mock document(s) total.`);

  if (dryRun && totalMatched > 0) {
    console.log('Re-run with --execute to actually delete these.');
  }
}

main().catch((err) => {
  console.error('Purge script failed:', err);
  process.exit(1);
});
