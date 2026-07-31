// Idempotent DynamoDB table provisioning.
//
// The main `Forge` table is created by infra, but the announcements table was
// introduced later, so `npm run bootstrap` creates it on demand rather than
// requiring a separate infra step for existing deployments. Safe to re-run:
// an existing table is left untouched.
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { awsClientConfig } from '../config/env.js';
import { logger } from '../lib/logger.js';

const client = new DynamoDBClient(awsClientConfig());

export async function tableExists(TableName) {
  try {
    await client.send(new DescribeTableCommand({ TableName }));
    return true;
  } catch (e) {
    if (e.name === 'ResourceNotFoundException') return false;
    throw e;
  }
}

/**
 * Create a pk/sk table with a GSI1 (gsi1pk/gsi1sk) secondary index, matching
 * the shape `createDynamoStore` queries. On-demand billing so there is no
 * capacity to plan for.
 */
export async function ensureAnnouncementsTable(TableName) {
  if (await tableExists(TableName)) {
    logger.info(`DynamoDB table "${TableName}" already exists — skipping creation.`);
    return false;
  }

  logger.info(`Creating DynamoDB table "${TableName}"…`);
  try {
    await client.send(
      new CreateTableCommand({
        TableName,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          { AttributeName: 'pk', AttributeType: 'S' },
          { AttributeName: 'sk', AttributeType: 'S' },
          { AttributeName: 'gsi1pk', AttributeType: 'S' },
          { AttributeName: 'gsi1sk', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'pk', KeyType: 'HASH' },
          { AttributeName: 'sk', KeyType: 'RANGE' },
        ],
        GlobalSecondaryIndexes: [
          {
            // Feed index: gsi1pk='ANN#FEED', gsi1sk='<publishDate>#<id>'.
            // Read-receipt items carry no gsi1 attributes and are simply not
            // projected into this index, which is what we want.
            IndexName: 'GSI1',
            KeySchema: [
              { AttributeName: 'gsi1pk', KeyType: 'HASH' },
              { AttributeName: 'gsi1sk', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
  } catch (e) {
    // Lost a race with a concurrent bootstrap — that's a success for our purposes.
    if (e.name === 'ResourceInUseException') {
      logger.info(`DynamoDB table "${TableName}" already exists — skipping creation.`);
      return false;
    }
    throw e;
  }

  await waitUntilTableExists({ client, maxWaitTime: 300 }, { TableName });
  logger.info(`DynamoDB table "${TableName}" is ACTIVE.`);
  return true;
}

export default ensureAnnouncementsTable;
