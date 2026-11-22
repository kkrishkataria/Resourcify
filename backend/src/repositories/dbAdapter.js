import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config/aws.js';

/**
 * High-fidelity in-memory database adapter replicating DynamoDB TransactWriteItems
 * with strict conditional checking (attribute_not_exists) and mutex locking.
 */
export class LocalMemoryAdapter {
  constructor() {
    this.tables = new Map();
    this.lockMutex = Promise.resolve();
    this.ensureTables();
  }

  ensureTables() {
    const tableNames = Object.values(config.aws.tables);
    for (const name of tableNames) {
      if (!this.tables.has(name)) {
        this.tables.set(name, new Map());
      }
    }
  }

  getPrimaryKey(table, keyObj) {
    if (keyObj.lockKey !== undefined) return String(keyObj.lockKey);
    if (keyObj.id !== undefined) return String(keyObj.id);
    if (keyObj.email !== undefined) return String(keyObj.email);
    return Object.entries(keyObj)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('#');
  }

  getItemKey(table, item) {
    return this.getPrimaryKey(table, item);
  }

  async acquireLock() {
    let release;
    const nextLock = new Promise((resolve) => {
      release = resolve;
    });
    const currentLock = this.lockMutex;
    this.lockMutex = currentLock.then(() => nextLock);
    await currentLock;
    return release;
  }

  async get(table, key) {
    this.ensureTables();
    const tableMap = this.tables.get(table);
    if (!tableMap) return null;
    const pk = this.getPrimaryKey(table, key);
    const item = tableMap.get(pk);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async put(table, item, conditionExpression) {
    const release = await this.acquireLock();
    try {
      this.ensureTables();
      const tableMap = this.tables.get(table);
      const pk = this.getItemKey(table, item);

      if (conditionExpression && conditionExpression.includes('attribute_not_exists')) {
        if (tableMap.has(pk)) {
          const err = new Error('ConditionalCheckFailedException: The conditional request failed');
          err.name = 'ConditionalCheckFailedException';
          throw err;
        }
      }

      tableMap.set(pk, JSON.parse(JSON.stringify(item)));
    } finally {
      release();
    }
  }

  async delete(table, key) {
    const release = await this.acquireLock();
    try {
      this.ensureTables();
      const tableMap = this.tables.get(table);
      if (tableMap) {
        const pk = this.getPrimaryKey(table, key);
        tableMap.delete(pk);
      }
    } finally {
      release();
    }
  }

  async scan(table, filter) {
    this.ensureTables();
    const tableMap = this.tables.get(table);
    if (!tableMap) return [];
    const items = Array.from(tableMap.values()).map((v) => JSON.parse(JSON.stringify(v)));
    if (filter) {
      return items.filter(filter);
    }
    return items;
  }

  async query(table, params) {
    this.ensureTables();
    const tableMap = this.tables.get(table);
    if (!tableMap) return [];
    const items = Array.from(tableMap.values()).map((v) => JSON.parse(JSON.stringify(v)));

    return items.filter((item) => {
      for (const [key, val] of Object.entries(params.keyCondition)) {
        if (item[key] !== val) return false;
      }
      return true;
    });
  }

  /**
   * Atomic multi-item transaction. If any condition check fails,
   * transaction aborts completely with TransactionCanceledException.
   */
  async transactWrite(actions) {
    const release = await this.acquireLock();
    try {
      this.ensureTables();

      // Phase 1: Verify all conditions
      for (const action of actions) {
        if (action.Put) {
          const { TableName, Item, ConditionExpression } = action.Put;
          const tableMap = this.tables.get(TableName);
          if (!tableMap) throw new Error(`Table not found: ${TableName}`);
          const pk = this.getItemKey(TableName, Item);

          if (ConditionExpression && ConditionExpression.includes('attribute_not_exists')) {
            if (tableMap.has(pk)) {
              const err = new Error(`TransactionCanceledException: ConditionalCheckFailed for key ${pk}`);
              err.name = 'TransactionCanceledException';
              err.cancellationReasons = [{ Code: 'ConditionalCheckFailed', Message: `Item exists: ${pk}` }];
              throw err;
            }
          }
        }
      }

      // Phase 2: Apply writes atomically
      for (const action of actions) {
        if (action.Put) {
          const { TableName, Item } = action.Put;
          const tableMap = this.tables.get(TableName);
          const pk = this.getItemKey(TableName, Item);
          tableMap.set(pk, JSON.parse(JSON.stringify(Item)));
        } else if (action.Delete) {
          const { TableName, Key } = action.Delete;
          const tableMap = this.tables.get(TableName);
          if (tableMap) {
            const pk = this.getPrimaryKey(TableName, Key);
            tableMap.delete(pk);
          }
        } else if (action.Update) {
          const { TableName, Key, ExpressionAttributeValues } = action.Update;
          const tableMap = this.tables.get(TableName);
          if (tableMap) {
            const pk = this.getPrimaryKey(TableName, Key);
            const existing = tableMap.get(pk) || {};
            if (ExpressionAttributeValues) {
              for (const [k, v] of Object.entries(ExpressionAttributeValues)) {
                const prop = k.replace(/^:/, '');
                existing[prop] = v;
              }
            }
            tableMap.set(pk, existing);
          }
        }
      }
    } finally {
      release();
    }
  }

  async clearAll() {
    const release = await this.acquireLock();
    try {
      for (const tableMap of this.tables.values()) {
        tableMap.clear();
      }
    } finally {
      release();
    }
  }
}

/**
 * AWS SDK v3 DynamoDB DocumentClient implementation
 */
export class DynamoDbAdapter {
  constructor() {
    const client = new DynamoDBClient({
      region: config.aws.region,
      endpoint: config.aws.dynamodbEndpoint,
    });
    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  async get(table, key) {
    const res = await this.docClient.send(
      new GetCommand({
        TableName: table,
        Key: key,
      })
    );
    return res.Item || null;
  }

  async put(table, item, conditionExpression) {
    await this.docClient.send(
      new PutCommand({
        TableName: table,
        Item: item,
        ConditionExpression: conditionExpression,
      })
    );
  }

  async delete(table, key) {
    await this.docClient.send(
      new DeleteCommand({
        TableName: table,
        Key: key,
      })
    );
  }

  async scan(table, filter) {
    const res = await this.docClient.send(
      new ScanCommand({
        TableName: table,
      })
    );
    const items = res.Items || [];
    return filter ? items.filter(filter) : items;
  }

  async query(table, params) {
    const expressions = [];
    const attrNames = {};
    const attrValues = {};

    Object.entries(params.keyCondition).forEach(([k, v], idx) => {
      const alias = `#k${idx}`;
      const valAlias = `:v${idx}`;
      expressions.push(`${alias} = ${valAlias}`);
      attrNames[alias] = k;
      attrValues[valAlias] = v;
    });

    const res = await this.docClient.send(
      new QueryCommand({
        TableName: table,
        IndexName: params.indexName,
        KeyConditionExpression: expressions.join(' AND '),
        ExpressionAttributeNames: attrNames,
        ExpressionAttributeValues: attrValues,
      })
    );

    return res.Items || [];
  }

  async transactWrite(actions) {
    const input = {
      TransactItems: actions.map((act) => {
        if (act.Put) {
          return {
            Put: {
              TableName: act.Put.TableName,
              Item: act.Put.Item,
              ConditionExpression: act.Put.ConditionExpression,
              ExpressionAttributeNames: act.Put.ExpressionAttributeNames,
              ExpressionAttributeValues: act.Put.ExpressionAttributeValues,
            },
          };
        }
        if (act.Delete) {
          return {
            Delete: {
              TableName: act.Delete.TableName,
              Key: act.Delete.Key,
              ConditionExpression: act.Delete.ConditionExpression,
            },
          };
        }
        if (act.Update) {
          return {
            Update: {
              TableName: act.Update.TableName,
              Key: act.Update.Key,
              UpdateExpression: act.Update.UpdateExpression,
              ConditionExpression: act.Update.ConditionExpression,
              ExpressionAttributeNames: act.Update.ExpressionAttributeNames,
              ExpressionAttributeValues: act.Update.ExpressionAttributeValues,
            },
          };
        }
        throw new Error('Unsupported transaction action');
      }),
    };

    await this.docClient.send(new TransactWriteCommand(input));
  }
}

let dbAdapterInstance = null;

export function getDbAdapter() {
  if (!dbAdapterInstance) {
    if (config.dbMode === 'dynamodb') {
      dbAdapterInstance = new DynamoDbAdapter();
    } else {
      dbAdapterInstance = new LocalMemoryAdapter();
    }
  }
  return dbAdapterInstance;
}

export function setDbAdapter(adapter) {
  dbAdapterInstance = adapter;
}
