// DynamoDB single-table store (production). Uses the DocumentClient so
// repositories work with plain JS objects. Table schema (created by infra):
//   pk (HASH), sk (RANGE)
//   GSI1: gsi1pk (HASH), gsi1sk (RANGE)
//   GSI2: gsi2pk (HASH), gsi2sk (RANGE)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConflictError } from '../lib/errors.js';
import { env, awsClientConfig } from '../config/env.js';

function buildUpdate({ set, add }) {
  const names = {};
  const values = {};
  const sets = [];
  const adds = [];
  let i = 0;
  for (const [field, val] of Object.entries(set || {})) {
    const n = `#s${i}`;
    const v = `:s${i}`;
    names[n] = field;
    values[v] = val;
    sets.push(`${n} = ${v}`);
    i++;
  }
  for (const [field, delta] of Object.entries(add || {})) {
    const n = `#a${i}`;
    const v = `:a${i}`;
    names[n] = field;
    values[v] = delta;
    adds.push(`${n} ${v}`);
    i++;
  }
  const parts = [];
  if (sets.length) parts.push(`SET ${sets.join(', ')}`);
  if (adds.length) parts.push(`ADD ${adds.join(', ')}`);
  return { UpdateExpression: parts.join(' '), names, values };
}

function buildCondition(condition, names, values) {
  if (!condition) return undefined;
  if (condition.notExists) return 'attribute_not_exists(pk)';
  if (condition.exists) return 'attribute_exists(pk)';
  if (condition.field !== undefined) {
    names['#c'] = condition.field;
    values[':cval'] = condition.equals;
    return '#c = :cval';
  }
  return undefined;
}

export function createDynamoStore() {
  const client = new DynamoDBClient(awsClientConfig());
  const doc = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
  const TableName = env.ddbTableName;

  const isConditionalFail = (e) =>
    e?.name === 'ConditionalCheckFailedException' ||
    e?.name === 'TransactionCanceledException';

  return {
    async getItem(pk, sk) {
      const { Item } = await doc.send(new GetCommand({ TableName, Key: { pk, sk } }));
      return Item ?? null;
    },

    async putItem(item, { condition } = {}) {
      const names = {};
      const values = {};
      const ConditionExpression = buildCondition(condition, names, values);
      try {
        await doc.send(
          new PutCommand({
            TableName,
            Item: item,
            ...(ConditionExpression ? { ConditionExpression } : {}),
            ...(Object.keys(names).length ? { ExpressionAttributeNames: names } : {}),
            ...(Object.keys(values).length ? { ExpressionAttributeValues: values } : {}),
          })
        );
      } catch (e) {
        if (isConditionalFail(e)) throw new ConflictError('Conditional check failed on put');
        throw e;
      }
      return item;
    },

    async updateItem(pk, sk, { set, add, condition } = {}) {
      const { UpdateExpression, names, values } = buildUpdate({ set, add });
      const ConditionExpression = buildCondition(condition, names, values);
      try {
        const { Attributes } = await doc.send(
          new UpdateCommand({
            TableName,
            Key: { pk, sk },
            UpdateExpression,
            ...(ConditionExpression ? { ConditionExpression } : {}),
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
            ReturnValues: 'ALL_NEW',
          })
        );
        return Attributes;
      } catch (e) {
        if (isConditionalFail(e)) throw new ConflictError('Conditional check failed on update');
        throw e;
      }
    },

    async deleteItem(pk, sk) {
      await doc.send(new DeleteCommand({ TableName, Key: { pk, sk } }));
    },

    async query({ pk, skPrefix, index, indexPk, indexSkPrefix, limit, scanForward = true }) {
      const pkAttr = index ? `${index}pk` : 'pk';
      const skAttr = index ? `${index}sk` : 'sk';
      const wantPk = index ? indexPk : pk;
      const prefix = index ? indexSkPrefix : skPrefix;

      const names = { '#pk': pkAttr };
      const values = { ':pk': wantPk };
      let KeyConditionExpression = '#pk = :pk';
      if (prefix) {
        names['#sk'] = skAttr;
        values[':skp'] = prefix;
        KeyConditionExpression += ' AND begins_with(#sk, :skp)';
      }
      const { Items } = await doc.send(
        new QueryCommand({
          TableName,
          ...(index ? { IndexName: index.toUpperCase() } : {}),
          KeyConditionExpression,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
          ScanIndexForward: scanForward,
          ...(limit ? { Limit: limit } : {}),
        })
      );
      return Items ?? [];
    },

    async scan({ typeEquals } = {}) {
      const params = { TableName };
      if (typeEquals) {
        params.FilterExpression = '#e = :e';
        params.ExpressionAttributeNames = { '#e': 'entity' };
        params.ExpressionAttributeValues = { ':e': typeEquals };
      }
      const { Items } = await doc.send(new ScanCommand(params));
      return Items ?? [];
    },

    async transactWrite(actions) {
      const TransactItems = actions.map((a) => {
        if (a.type === 'put') {
          const names = {};
          const values = {};
          const ce = buildCondition(a.condition, names, values);
          return {
            Put: {
              TableName,
              Item: a.item,
              ...(ce ? { ConditionExpression: ce } : {}),
              ...(Object.keys(names).length ? { ExpressionAttributeNames: names } : {}),
              ...(Object.keys(values).length ? { ExpressionAttributeValues: values } : {}),
            },
          };
        }
        if (a.type === 'update') {
          const { UpdateExpression, names, values } = buildUpdate({ set: a.set, add: a.add });
          const ce = buildCondition(a.condition, names, values);
          return {
            Update: {
              TableName,
              Key: { pk: a.pk, sk: a.sk },
              UpdateExpression,
              ...(ce ? { ConditionExpression: ce } : {}),
              ExpressionAttributeNames: names,
              ExpressionAttributeValues: values,
            },
          };
        }
        // delete
        return { Delete: { TableName, Key: { pk: a.pk, sk: a.sk } } };
      });

      try {
        await doc.send(new TransactWriteCommand({ TransactItems }));
      } catch (e) {
        if (isConditionalFail(e)) {
          throw new ConflictError('Transaction cancelled: conditional check failed');
        }
        throw e;
      }
    },
  };
}
