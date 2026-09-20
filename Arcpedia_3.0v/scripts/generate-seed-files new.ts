/**
 * Data Migration Specialist — Task: JSON Seed File Generation
 *
 * Reads the existing typed mock data (src/lib/data.ts) and converts it into
 * plain JSON seed files shaped for Firestore: one file per collection, each
 * containing an object keyed by document ID (so it can be loaded directly
 * with `db.collection(name).doc(id).set(data)` per entry, or via the
 * Firebase emulator's import format).
 *
 * Run this from the Arcpedia_3.0v project root (so the relative import to
 * src/lib/data resolves). This repo uses tsx, not ts-node:
 *   npx tsx scripts/generate-seed-files.ts
 *
 * Output lands in ./seed/*.json — review these by hand before using them to
 * seed production. This script does NOT write to Firestore itself — no
 * upload script is provided yet; uploading the reviewed JSON is a separate
 * step you still need to write or do manually via the Firebase console.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  mockCourses,
  mockUpcomingEvents,
  mockAnnouncements,
  mockQuizzes,
  mockForumPosts,
  mockForumReplies,
  mockMemoryItems,
} from '../src/lib/data';

const OUTPUT_DIR = path.join(__dirname, '..', 'seed');

/** Firestore doesn't accept raw JS Date objects in a JSON file — convert to ISO strings. */
function serializeDates<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => (val instanceof Date ? val.toISOString() : val))
  );
}

/** Converts an array of records with an `id` field into a Firestore-style {id: doc} map. */
function toDocMap<T extends { id: string }>(records: T[]): Record<string, T> {
  const map: Record<string, T> = {};
  for (const record of records) {
    map[record.id] = record;
  }
  return map;
}

function writeSeedFile(name: string, data: unknown) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const filePath = path.join(OUTPUT_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(serializeDates(data), null, 2));
  console.log(`Wrote ${filePath}`);
}

function main() {
  writeSeedFile('courses', toDocMap(mockCourses));
  writeSeedFile('upcomingEvents', toDocMap(mockUpcomingEvents));
  writeSeedFile('announcements', toDocMap(mockAnnouncements));
  writeSeedFile('quizzes', toDocMap(mockQuizzes));
  writeSeedFile('forumPosts', toDocMap(mockForumPosts));
  writeSeedFile('forumReplies', mockForumReplies); // already keyed by post ID
  writeSeedFile('memoryItems', toDocMap(mockMemoryItems));

  console.log('\nSeed generation complete. Review the files in ./seed/ before uploading.');
  console.log('These are placeholder/sample-shaped records — replace with real content before using in production.');
}

main();
