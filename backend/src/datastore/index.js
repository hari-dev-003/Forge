// Datastore — DynamoDB single-table store (the only backend).
import { createDynamoStore } from './dynamoStore.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

let store = null;

export function getStore() {
  if (!store) {
    store = createDynamoStore();
    logger.info('Datastore: DynamoDB', { table: env.ddbTableName, region: env.awsRegion });
  }
  return store;
}

/** Kept for entrypoint compatibility (server.js / lambda.js call it at startup). */
export async function initStore() {
  return getStore();
}

export default getStore;
