const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { PrismaClient } = require('@prisma/client');

const sqliteDbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const prisma = new PrismaClient();
const sqliteDb = new DatabaseSync(sqliteDbPath);

function lowerDelegateName(modelName) {
  return modelName[0].toLowerCase() + modelName.slice(1);
}

function parsePrismaSchema(schemaText) {
  const modelPattern = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
  const models = {};

  for (const match of schemaText.matchAll(modelPattern)) {
    const modelName = match[1];
    const body = match[2];
    const lines = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//') && !line.startsWith('@@')); // Keep field lines only for parse

    const model = {
      name: modelName,
      tableName: modelName,
      fields: [],
      primaryKeyFields: [],
    };

    const tableMap = body.match(/@@map\((?:\s*)"([^"]+)"(?:\s*)\)/);
    if (tableMap) {
      model.tableName = tableMap[1];
    }

    for (const rawLine of lines) {
      const line = rawLine.replace(/\s*\/\/.*$/, '').trim();
      if (!line || line.startsWith('@@')) continue;
      const tokens = line.split(/\s+/);
      if (tokens.length < 2) continue;

      const fieldName = tokens[0];
      const fieldTypeToken = tokens[1];
      const isList = fieldTypeToken.endsWith('[]');
      const optional = fieldTypeToken.endsWith('?') || fieldTypeToken.endsWith('[]?');
      const baseType = fieldTypeToken.replace(/\?$/, '').replace(/\[\]$/, '');
      const relationMatch = line.match(/@relation\(([^)]*)\)/);
      const mapMatch = line.match(/@map\("([^"]+)"\)/);
      const dbName = mapMatch ? mapMatch[1] : fieldName;
      const isId = /@id\b/.test(line);
      const isUnique = /@unique\b/.test(line);
      const defaultMatch = line.match(/@default\(/);
      const isPrimaryKey = isId;

      const field = {
        name: fieldName,
        dbName,
        type: baseType,
        optional,
        isList,
        isId: isPrimaryKey,
        isUnique,
        hasDefault: Boolean(defaultMatch),
        relation: null,
      };

      if (isPrimaryKey) {
        model.primaryKeyFields.push(fieldName);
      }

      if (relationMatch) {
        const relationBody = relationMatch[1];
        const fieldsMatch = relationBody.match(/fields\s*:\s*\[([^\]]+)\]/);
        const referencesMatch = relationBody.match(/references\s*:\s*\[([^\]]+)\]/);
        if (fieldsMatch && referencesMatch) {
          const fieldsList = fieldsMatch[1].split(',').map((text) => text.trim());
          const referencesList = referencesMatch[1].split(',').map((text) => text.trim());
          const relationModel = baseType.replace(/\?$/, '').replace(/\[\]$/, '');
          field.relation = {
            model: relationModel,
            fields: fieldsList,
            references: referencesList,
          };
        }
      }

      model.fields.push(field);
    }

    const compositeKeyMatch = body.match(/@@id\s*\(([^)]+)\)/);
    if (compositeKeyMatch) {
      model.primaryKeyFields = compositeKeyMatch[1]
        .split(',')
        .map((item) => item.trim().replace(/\[|\]/g, ''));
    }

    if (!model.primaryKeyFields.length) {
      const idField = model.fields.find((field) => field.isId);
      if (idField) {
        model.primaryKeyFields = [idField.name];
      }
    }

    models[modelName] = model;
  }

  return models;
}

function buildDependencyGraph(models, includeOptional = true) {
  const edges = [];

  for (const model of Object.values(models)) {
    for (const field of model.fields) {
      if (!field.relation || !field.relation.fields.length) continue;
      if (!includeOptional && field.optional) continue;
      const referencedModel = field.relation.model;
      edges.push({
        from: referencedModel,
        to: model.name,
        fieldNames: field.relation.fields,
        optional: field.optional,
      });
    }
  }

  return edges;
}

function topologicalSort(modelNames, edges) {
  const incoming = Object.fromEntries(modelNames.map((name) => [name, 0]));
  const outgoing = {};
  for (const name of modelNames) outgoing[name] = [];
  for (const edge of edges) {
    incoming[edge.to] = (incoming[edge.to] || 0) + 1;
    outgoing[edge.from].push(edge);
  }

  const queue = modelNames.filter((name) => incoming[name] === 0);
  const order = [];
  while (queue.length) {
    const current = queue.shift();
    order.push(current);
    for (const edge of outgoing[current] || []) {
      incoming[edge.to] -= 1;
      if (incoming[edge.to] === 0) {
        queue.push(edge.to);
      }
    }
  }

  return { order, remainingEdges: edges.filter((edge) => incoming[edge.to] > 0) };
}

function deriveMigrationOrder(models) {
  const modelNames = Object.keys(models);
  const allEdges = buildDependencyGraph(models, true);
  let { order, remainingEdges } = topologicalSort(modelNames, allEdges);

  if (remainingEdges.length === 0) {
    return { order, deferredEdges: [] };
  }

  // Fall back to required-only ordering, deferring optional references.
  const requiredEdges = buildDependencyGraph(models, false);
  const optionalEdges = allEdges.filter((edge) => edge.optional);
  const result = topologicalSort(modelNames, requiredEdges);
  if (result.remainingEdges.length) {
    throw new Error(
      `Circular dependency detected in required foreign keys: ${result.remainingEdges
        .map((edge) => `${edge.to} -> ${edge.from} via ${edge.fieldNames.join(', ')}`)
        .join(', ')}`
    );
  }

  return { order: result.order, deferredEdges: optionalEdges };
}

function normalizeRow(row, model) {
  const normalized = {};

  for (const field of model.fields) {
    const rawValue = row[field.dbName] !== undefined ? row[field.dbName] : row[field.name];
    if (rawValue === undefined) {
      continue;
    }

    if (rawValue === null) {
      normalized[field.name] = null;
      continue;
    }

    switch (field.type) {
      case 'DateTime':
        normalized[field.name] = new Date(rawValue);
        break;
      case 'Boolean':
        normalized[field.name] = typeof rawValue === 'boolean' ? rawValue : rawValue === 1 || rawValue === '1';
        break;
      case 'Int':
        normalized[field.name] = typeof rawValue === 'number' ? rawValue : parseInt(rawValue, 10);
        break;
      case 'Float':
      case 'Decimal':
        normalized[field.name] = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
        break;
      default:
        normalized[field.name] = rawValue;
    }
  }

  return normalized;
}

function buildPrimaryKeyWhere(model, row) {
  const where = {};
  for (const pkField of model.primaryKeyFields) {
    where[pkField] = row[pkField];
  }
  return where;
}

async function ensureSQLiteTableExists(model) {
  const tableName = model.tableName;
  const statement = sqliteDb.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`);
  const result = statement.get(tableName);
  if (!result) {
    throw new Error(`SQLite table not found for model ${model.name}: ${tableName}`);
  }
}

async function fetchSQLiteRows(model) {
  const tableName = model.tableName;
  const statement = sqliteDb.prepare(`SELECT * FROM "${tableName}"`);
  const rows = statement.all();

  return rows.map((row) => normalizeRow(row, model));
}

async function countSQLiteRows(model) {
  const tableName = model.tableName;
  const statement = sqliteDb.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`);
  const result = statement.get();
  return result.count ?? 0;
}

async function countPostgresRows(delegate) {
  return prisma[delegate].count();
}

async function migrateModel(model, delegate, rows, deferredFieldNames, failures) {
  console.log(`Migrating ${model.name} (${rows.length} rows)`);
  const inserted = [];
  for (const row of rows) {
    const rowData = { ...row };
    const deferredData = {};
    const where = buildPrimaryKeyWhere(model, row);
    if (!Object.keys(where).length) {
      failures.push({ model: model.name, id: null, error: 'Missing primary key on row', row });
      continue;
    }

    for (const fieldName of deferredFieldNames) {
      if (fieldName in rowData && rowData[fieldName] != null) {
        deferredData[fieldName] = rowData[fieldName];
        rowData[fieldName] = null;
      }
    }

    const updateData = { ...rowData };
    for (const pkField of model.primaryKeyFields) {
      delete updateData[pkField];
    }

    try {
      await prisma.$transaction(async (tx) => {
        if (Object.keys(updateData).length > 0) {
          await tx[delegate].upsert({
            where,
            create: rowData,
            update: updateData,
          });
        } else {
          await tx[delegate].create({ data: rowData });
        }
      });
      if (Object.keys(deferredData).length) {
        inserted.push({ where, data: deferredData });
      }
    } catch (error) {
      if (Object.keys(updateData).length === 0 && /Unique constraint failed/.test(error.message)) {
        if (Object.keys(deferredData).length) {
          inserted.push({ where, data: deferredData });
        }
        continue;
      }
      failures.push({ model: model.name, id: where, error: error.message, row });
    }
  }
  return inserted;
}

async function applyDeferredUpdates(model, delegate, updates, failures) {
  if (!updates.length) return;
  console.log(`Applying deferred updates for ${model.name} (${updates.length} rows)`);
  for (const update of updates) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx[delegate].update({ where: update.where, data: update.data });
      });
    } catch (error) {
      failures.push({ model: model.name, id: update.where, error: error.message, update: update.data });
    }
  }
}

async function main() {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  const schemaText = fs.readFileSync(schemaPath, 'utf8');
  const models = parsePrismaSchema(schemaText);
  const { order, deferredEdges } = deriveMigrationOrder(models);

  const deferredFieldsByModel = deferredEdges.reduce((acc, edge) => {
    acc[edge.to] = acc[edge.to] || [];
    for (const fieldName of edge.fieldNames) {
      if (!acc[edge.to].includes(fieldName)) {
        acc[edge.to].push(fieldName);
      }
    }
    return acc;
  }, {});

  const modelRows = {};
  const sqliteCounts = {};
  for (const modelName of order) {
    const model = models[modelName];
    await ensureSQLiteTableExists(model);
    sqliteCounts[modelName] = await countSQLiteRows(model);
    modelRows[modelName] = await fetchSQLiteRows(model);
  }

  const deferredUpdatesByModel = {};
  const failures = [];

  for (const modelName of order) {
    const model = models[modelName];
    const delegate = lowerDelegateName(model.name);
    if (!prisma[delegate]) {
      throw new Error(`Prisma delegate not found for model ${model.name}`);
    }
    const rows = modelRows[modelName];
    const deferredFields = deferredFieldsByModel[modelName] || [];
    deferredUpdatesByModel[modelName] = await migrateModel(model, delegate, rows, deferredFields, failures);
  }

  for (const modelName of order) {
    const model = models[modelName];
    const delegate = lowerDelegateName(model.name);
    await applyDeferredUpdates(model, delegate, deferredUpdatesByModel[modelName] || [], failures);
  }

  console.log('\nVerification results');
  let countsMatch = true;
  for (const modelName of order) {
    const model = models[modelName];
    const delegate = lowerDelegateName(model.name);
    const postgresCount = await countPostgresRows(delegate);
    const sqliteCount = sqliteCounts[modelName];
    console.log(`Model: ${modelName}`);
    console.log(`  SQLite rows: ${sqliteCount}`);
    console.log(`  Postgres rows: ${postgresCount}`);
    if (sqliteCount !== postgresCount) {
      countsMatch = false;
    }
  }

  if (!countsMatch) {
    console.error('\nRow count mismatch detected. Migration will exit with failure.');
  }

  if (failures.length) {
    console.error('\nMigration completed with failures');
    for (const failure of failures) {
      console.error(`- Model: ${failure.model}, id: ${JSON.stringify(failure.id)}, error: ${failure.error}`);
    }
  } else if (countsMatch) {
    console.log('\nMigration completed successfully');
  } else {
    console.error('\nMigration completed with failures due to row count mismatch');
  }

  return countsMatch && failures.length === 0;
}

main()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
