// Datastore — DynamoDB (the only backend).
//
// Two tables, both with the same key shape (pk HASH / sk RANGE, plus GSI1 and
// GSI2 on gsi1pk/gsi1sk and gsi2pk/gsi2sk):
//
//   getStore()              -> the main single table: users, meetings, points,
//                              leaderboard, config, audit.
//   getAnnouncementStore()  -> a dedicated announcements table holding every
//                              announcement plus its per-user read receipts.
//
// Announcements are split out because the admin management view scans the whole
// entity set and the viewer feed queries one hot GSI partition (ANN#FEED);
// keeping that off the main table stops broadcast reads from competing with
// meeting/points traffic and lets the two be scaled and backed up separately.
import { createDynamoStore } from './dynamoStore.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

let store = null;
let announcementStore = null;

export function getStore() {
  if (!store) {
    store = createDynamoStore({ tableName: env.ddbTableName });
    logger.info('Datastore: DynamoDB', { table: env.ddbTableName, region: env.awsRegion });
  }
  return store;
}

export function getAnnouncementStore() {
  if (!announcementStore) {
    announcementStore = createDynamoStore({ tableName: env.ddbAnnouncementsTableName });
    logger.info('Datastore: DynamoDB (announcements)', {
      table: env.ddbAnnouncementsTableName,
      region: env.awsRegion,
    });
  }
  return announcementStore;
}

/** Kept for entrypoint compatibility (server.js / lambda.js call it at startup). */
export async function initStore() {
  getStore();
  getAnnouncementStore();
  return store;
}

export default getStore;
