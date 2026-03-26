import { getSession } from '../neo4j/driver.js';
import { adminMiddleware } from '../middleware/authMiddleware.js';
import { logEvent } from '../utils/logger.js';

export default async function adminRoutes(fastify) {
  fastify.delete('/clear-database', { onRequest: [adminMiddleware] }, async (request, reply) => {
    const session = getSession();
    try {
      // Delete all relationships first, then all nodes
      await session.run('MATCH ()-[r]->() DELETE r');
      const nodeResult = await session.run('MATCH (n) DELETE n RETURN count(n) AS deleted');
      const deleted = nodeResult.records[0]?.get('deleted');
      const count = (deleted && typeof deleted.toNumber === 'function')
        ? deleted.toNumber()
        : Number(deleted) || 0;

      await logEvent(request.user.username, 'clear_database', `Cleared complete entire database (${count} nodes deleted)`, request.ip);

      return { success: true, nodesDeleted: count };
    } finally {
      await session.close();
    }
  });

  // ── List all user datasets ─────────────────────────────────────────────────
  fastify.get('/admin/datasets', { onRequest: [adminMiddleware] }, async (request, reply) => {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (d:UserDataset)
         RETURN d ORDER BY d.created_at DESC`
      );

      const datasets = result.records.map((r) => {
        const d = r.get('d').properties;
        return {
          id: d.id,
          name: d.name,
          filename: d.filename,
          owner: d.owner,
          rowCount: toNum(d.row_count),
          createdAt: toNum(d.created_at),
        };
      });

      return { datasets };
    } finally {
      await session.close();
    }
  });

  // ── Delete a user's dataset (and all its Neo4j data) ────────────────────── 
  fastify.delete('/admin/datasets/:datasetId', { onRequest: [adminMiddleware] }, async (request, reply) => {
    const { datasetId } = request.params;
    const username = request.user.username;

    const session = getSession();
    try {
      const check = await session.run(
        'MATCH (d:UserDataset {id: $id}) RETURN d',
        { id: datasetId }
      );
      if (check.records.length === 0) {
        return reply.code(404).send({ error: 'Dataset not found' });
      }

      // Delete all TRANSFER relationships in this dataset
      await session.run(
        'MATCH ()-[t:TRANSFER {dataset_id: $datasetId}]->() DELETE t',
        { datasetId }
      );
      // Delete all Wallet nodes in this dataset (DETACH to handle residual rels)
      await session.run(
        'MATCH (w:Wallet {dataset_id: $datasetId}) DETACH DELETE w',
        { datasetId }
      );
      // Delete the UserDataset metadata node
      await session.run(
        'MATCH (d:UserDataset {id: $id}) DELETE d',
        { id: datasetId }
      );

      await logEvent(username, 'admin_delete_dataset', `Admin deleted dataset: ${datasetId}`, request.ip);

      return { success: true };
    } finally {
      await session.close();
    }
  });
}

function toNum(val) {
  if (val == null) return 0;
  if (typeof val === 'object' && typeof val.toNumber === 'function') return val.toNumber();
  return Number(val) || 0;
}
