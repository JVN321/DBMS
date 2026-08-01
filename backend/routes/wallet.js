import { getSession } from '../neo4j/driver.js';
import { calculateRiskAssessment } from '../services/detection.js';

export default async function walletRoutes(fastify) {
  fastify.get('/wallet/:address', async (request, reply) => {
    const { address } = request.params;
    const skip = parseInt(request.query.skip || '0', 10);
    const limit = parseInt(request.query.limit || '50', 10);
    const requestedDatasetId = request.query.dataset_id || null;

    const session = getSession();
    try {
      let summaryResult = null;

      // 1. Try matching with specific requested datasetId if provided
      if (requestedDatasetId) {
        summaryResult = await session.run(
          `MATCH (w:Wallet {address: $address, dataset_id: $requestedDatasetId})
           OPTIONAL MATCH (w)-[out:TRANSFER]->()
           WHERE out.dataset_id = $requestedDatasetId OR out.dataset_id IS NULL
           WITH w, count(out) AS outCount, COALESCE(sum(out.amount), 0) AS totalSent
           OPTIONAL MATCH ()-[inr:TRANSFER]->(w)
           WHERE inr.dataset_id = $requestedDatasetId OR inr.dataset_id IS NULL
           WITH w, outCount, totalSent, count(inr) AS inCount, COALESCE(sum(inr.amount), 0) AS totalReceived
           OPTIONAL MATCH (w)-[:USES]->(c:Coin)
           RETURN w.address AS address,
                  w.dataset_id AS dataset_id,
                  outCount, totalSent,
                  inCount, totalReceived,
                  collect(c.name) AS coins`,
          { address, requestedDatasetId }
        );
      }

      // 2. Fallback: match by address across any dataset if not found or datasetId not specified
      if (!summaryResult || summaryResult.records.length === 0) {
        summaryResult = await session.run(
          `MATCH (w:Wallet {address: $address})
           WITH w LIMIT 1
           OPTIONAL MATCH (w)-[out:TRANSFER]->()
           WHERE out.dataset_id = w.dataset_id OR out.dataset_id IS NULL
           WITH w, count(out) AS outCount, COALESCE(sum(out.amount), 0) AS totalSent
           OPTIONAL MATCH ()-[inr:TRANSFER]->(w)
           WHERE inr.dataset_id = w.dataset_id OR inr.dataset_id IS NULL
           WITH w, outCount, totalSent, count(inr) AS inCount, COALESCE(sum(inr.amount), 0) AS totalReceived
           OPTIONAL MATCH (w)-[:USES]->(c:Coin)
           RETURN w.address AS address,
                  w.dataset_id AS dataset_id,
                  outCount, totalSent,
                  inCount, totalReceived,
                  collect(c.name) AS coins`,
          { address }
        );
      }

      if (summaryResult.records.length === 0) {
        return reply.code(404).send({ error: 'Wallet not found' });
      }

      const s = summaryResult.records[0];
      const matchedDatasetId = s.get('dataset_id') || requestedDatasetId || 'shared';

      // Get paginated transactions
      const txResult = await session.run(
        `MATCH (w:Wallet {address: $address, dataset_id: $matchedDatasetId})-[t:TRANSFER]-(other:Wallet)
         WHERE t.dataset_id = $matchedDatasetId OR t.dataset_id IS NULL
         RETURN
           CASE WHEN startNode(t) = w THEN 'sent' ELSE 'received' END AS direction,
           other.address AS counterparty,
           t.amount AS amount,
           t.coin_type AS coin_type,
           t.timestamp AS timestamp,
           t.txid AS txid
         ORDER BY t.timestamp DESC
         SKIP toInteger($skip)
         LIMIT toInteger($limit)`,
        { address, matchedDatasetId, skip, limit }
      );

      const transactions = txResult.records.map((r) => ({
        direction: r.get('direction'),
        counterparty: r.get('counterparty'),
        amount: toNum(r.get('amount')),
        coin_type: r.get('coin_type'),
        timestamp: r.get('timestamp'),
        txid: r.get('txid'),
      }));

      const riskAssessment = await calculateRiskAssessment(address, session, matchedDatasetId);

      return {
        address: s.get('address'),
        datasetId: matchedDatasetId,
        totalSent: toNum(s.get('totalSent')),
        totalReceived: toNum(s.get('totalReceived')),
        outgoingCount: toNum(s.get('outCount')),
        incomingCount: toNum(s.get('inCount')),
        coins: s.get('coins'),
        riskScore: riskAssessment.score,
        riskType: riskAssessment.type,
        riskReasoning: riskAssessment.reasoning,
        riskDetails: riskAssessment.details,
        transactions,
        pagination: { skip, limit },
      };
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
