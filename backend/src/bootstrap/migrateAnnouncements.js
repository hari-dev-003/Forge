// One-off migration: copy announcements out of the main single table into the
// dedicated announcements table.
//
// Run once, after `npm run bootstrap` has created the new table:
//   npm run migrate:announcements            # copy
//   npm run migrate:announcements -- --purge # copy, then delete the originals
//
// Idempotent: re-running overwrites the copies with the same content. The
// originals are left in place unless --purge is passed, so the migration can be
// verified (and rolled back by pointing the repo at the old store) before any
// data is removed.
import { env, validateEnv } from '../config/env.js';
import { getStore, getAnnouncementStore } from '../datastore/index.js';
import { ensureAnnouncementsTable } from '../datastore/provision.js';
import { logger } from '../lib/logger.js';

const ENTITIES = ['ANNOUNCEMENT', 'ANNOUNCEMENT_READ'];

async function main() {
  validateEnv();
  const purge = process.argv.includes('--purge');

  await ensureAnnouncementsTable(env.ddbAnnouncementsTableName);

  const source = getStore();
  const target = getAnnouncementStore();

  let copied = 0;
  let purged = 0;

  for (const entity of ENTITIES) {
    const items = await source.scan({ typeEquals: entity });
    logger.info(`Found ${items.length} ${entity} item(s) in "${env.ddbTableName}".`);

    for (const item of items) {
      // Plain put (no notExists condition) so a partial previous run is simply
      // overwritten rather than throwing.
      await target.putItem(item);
      copied++;
    }

    if (purge) {
      for (const item of items) {
        await source.deleteItem(item.pk, item.sk);
        purged++;
      }
    }
  }

  logger.info(
    `Migration complete — copied ${copied} item(s) into "${env.ddbAnnouncementsTableName}"` +
      (purge ? `, deleted ${purged} from "${env.ddbTableName}".` : '. Originals left in place (pass --purge to remove).')
  );
  process.exit(0);
}

main().catch((e) => {
  logger.error('Announcement migration failed', { message: e.message, stack: e.stack });
  process.exit(1);
});
