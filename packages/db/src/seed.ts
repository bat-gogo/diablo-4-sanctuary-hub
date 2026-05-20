import 'dotenv/config';
import { getDb } from './index';

async function main() {
  const db = getDb();

  // TODO: populate users, skills, items, characters, builds, buildSkills,
  // partyRequests, comments, votes with faker. Target ~10k builds for the
  // scalability assessment criterion (see exam doc).
  console.log('Seed placeholder — implement me.');
  void db;
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
