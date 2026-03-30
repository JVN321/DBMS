import {
  Activity,
  Database,
  Eye,
  Layers,
  Lock,
  Network,
  ShieldAlert,
  Server,
  Zap
} from "lucide-react";

export const SLIDES = [
  {
    id: "slide1",
    navLabel: "Title Slide",
    kicker: "Course: Database Management Systems",
    title: "Blockchain Transaction Graph Analysis using Neo4j",
    mainIdea: "Project Team Members (Muthoot Institute of Technology and Science):",
    bullets: [
      "Aman Antony Regno MUT24CA013",
      "John Varghese Nettady MUT24CA044",
      "Sam Sunny Regno MUT24CA064",
      "Sangeetha Shalom Saji MUT24CA065"
    ],
    icon: Database,
  },
  {
    id: "slide2",
    navLabel: "Problem Definition",
    kicker: "02 Context",
    title: "Relational DBs vs Graph Theory",
    mainIdea: "Blockchain data spans millions of nested interactions. SQL struggles with variable deep path tracing.",
    bullets: [
      "Multi-Hop JOINs: RDBMS architectures exponentially decay in performance when scaling beyond 3-degree peer connections.",
      "First-Class Entities: Graph databases natively map edges (transactions) and nodes (wallets) into index-free adjacency structures.",
      "Real-Time Capabilities: Neo4j operates $O(1)$ edge traversal enabling immediate algorithmic fraud detection matrices."
    ],
    icon: Activity,
  },
  {
    id: "slide3",
    navLabel: "Architecture Engine",
    kicker: "03 Infrastructure",
    title: "System Architecture Pipeline",
    mainIdea: "High throughput data normalization pushing linear records into multi-dimensional vectors.",
    bullets: [
      "Parsing Layer: Normalizes precision WEI/ETH cryptographic strings via streaming CSV protocols parsing 100k+ inputs seamlessly.",
      "Idempotent Validation: Guarantees 0% collision duplication across graph updates leveraging declarative Cypher streams.",
      "Client Output: Serializes Neo4j nested HashMaps into flat array buffers required for clustered WebGL shader manipulation."
    ],
    code: "File Buffer -> Parser Config -> Fastify Pipeline -> Neo4j Subgraph Execution -> React Three.js Engine",
    icon: Server,
  },
  {
    id: "slide4",
    navLabel: "Graph Schema Map",
    kicker: "04 Data Blueprint",
    title: "Nodes, Labels & Relations",
    mainIdea: "Structuring chaotic ledger actions into strictly mapped network topologies.",
    bullets: [
      "Entity Labels: (:Wallet), (:Coin {symbol: \x27BTC\x27 | \x27ETH\x27}), (:User)",
      "Properties Maps: Temporal boundaries (timestamp strings), Financial payloads (lossless amount mappings), unique hashing (txid strings).",
      "Relation Semantics: Many-to-Many directed multigraph connections meaning Wallets can hold unlimited unique :TRANSFER edges scaling perfectly."
    ],
    code: "(Wallet Nodes) --[:TRANSFER {txid, value, time}]--> (Wallet Nodes)\n         |\n         +----[:USES_PROTOCOL]----> (Distributed Ledger Coin)",
    icon: Network,
  },
  {
    id: "slide5",
    navLabel: "ACID Ingestion",
    kicker: "05 DB Ingestion Code",
    title: "Idempotent Cypher Pipelines",
    mainIdea: "Advanced declarative graph modeling ensuring ACID compliance during massive parallel block syncing.",
    bullets: [
      "Schema Constraints: UNIQUE assertions mapped explicitly over `Wallet.address` boundaries securing data integrity limits.",
      "Parallel Execution: Bulk transaction payloads UNWIND efficiently over single-thread cycles drastically minimizing connection/IO overhead.",
      "No-Duplicate Guarantees: Natively handles partial retries by resolving properties purely via isolated MERGE logic parameters."
    ],
    code: "UNWIND $transactions AS tx\nMERGE (from:Wallet {address: tx.wallet_from})\nMERGE (to:Wallet {address: tx.wallet_to})\nMERGE (from)-[t:TRANSFER {txid: tx.transaction_id}]->(to)",
    icon: Database,
  },
  {
    id: "slide6",
    navLabel: "Analytical Queries",
    kicker: "06 Deep Dive",
    title: "Graph Detection Queries",
    mainIdea: "Exploiting Graph Theory paths evaluating behavior normally impossible in structured SQL mapping.",
    bullets: [
      "Rapid Path Iterations: Tracks A -> B -> C temporal movements directly comparing node timestamps under 60-second heuristic windows.",
      "Density Mappings: Simultaneously executing OPTIONAL IN/OUT edge counting loops determining exact topological graph centering arrays.",
      "Zero N+1 Query Cascade: Processes 10,000+ conditional aggregations directly on the backend engine before single serialized response delivery."
    ],
    icon: Zap,
    subSlides: [
      {
        id: "ss1",
        title: "1. Circular Transfers",
        type: "Risk type: circular",
        description: "Finds wallets that are the start and end of a transfer chain — money that eventually loops back to its origin, a classic layering pattern.",
        code: `MATCH path = (w:Wallet)-[:TRANSFER*2..6]->(w)
WITH w, path, length(path) AS depth
ORDER BY depth ASC
LIMIT toInteger($limit)
RETURN
  w.address AS address, depth,
  [n IN nodes(path) | n.address] AS cycle`
      },
      {
        id: "ss2",
        title: "2. High Fan-Out",
        type: "Risk type: fanout",
        description: "Finds wallets that send money to an unusually large number of distinct recipients — indicative of a distribution hub, peel-chain, or automated scattering.",
        code: `MATCH (w:Wallet)-[t:TRANSFER]->()
WITH w, count(t) AS outDegree, sum(t.amount) AS totalSent
WHERE outDegree >= toInteger($threshold)
RETURN w.address AS address, outDegree, totalSent
ORDER BY outDegree DESC
LIMIT toInteger($limit)`
      },
      {
        id: "ss3",
        title: "3. High Fan-In",
        type: "Risk type: fanin",
        description: "Finds wallets that receive from an unusually large number of distinct senders — indicative of a consolidation sink, collection address, or exchange deposit wallet.",
        code: `MATCH ()-[t:TRANSFER]->(w:Wallet)
WITH w, count(t) AS inDegree, sum(t.amount) AS totalReceived
WHERE inDegree >= toInteger($threshold)
RETURN w.address AS address, inDegree, totalReceived
ORDER BY inDegree DESC
LIMIT toInteger($limit)`
      },
      {
        id: "ss4",
        title: "4. Rapid Transfers",
        type: "Risk type: rapid",
        description: "Finds three-wallet chains (A → B → C) where the second transfer happens within a short time window of the first — a pattern consistent with funds quickly being passed on.",
        code: `MATCH (a:Wallet)-[t1:TRANSFER]->(b:Wallet)-[t2:TRANSFER]->(c:Wallet)
WHERE a <> c
  AND toInteger(t2.timestamp) - toInteger(t1.timestamp) >= 0
  AND toInteger(t2.timestamp) - toInteger(t1.timestamp) <= toInteger($windowSeconds)
RETURN a.address AS from, b.address AS via, c.address AS to`
      },
      {
        id: "ss5",
        title: "5. Dense Clusters",
        type: "Risk type: cluster",
        description: "Finds wallets that are highly connected in both directions — high in-degree and high out-degree simultaneously. These are central nodes in tight transaction clusters.",
        code: `MATCH (w:Wallet)
OPTIONAL MATCH (w)-[out:TRANSFER]->()
WITH w, count(out) AS outDeg
OPTIONAL MATCH ()-[inr:TRANSFER]->(w)
WITH w, outDeg, count(inr) AS inDeg
WHERE outDeg >= toInteger($threshold) AND inDeg >= toInteger($threshold)
RETURN w.address AS address, outDeg, inDeg`
      },
      {
        id: "ss6",
        title: "6. Composite Risk Score",
        type: "Multi-factor Scoring",
        description: "Computes a composite 0–100 risk score based on Fan-out, Fan-in, Cycle involvement, and Total degree directly inside Neo4j.",
        code: `MATCH (w:Wallet {address: $address})
OPTIONAL MATCH (w)-[out:TRANSFER]->()
WITH w, count(out) AS outDeg
OPTIONAL MATCH ()-[inr:TRANSFER]->(w)
WITH w, outDeg, count(inr) AS inDeg
OPTIONAL MATCH path = (w)-[:TRANSFER*2..4]->(w)
WITH w, outDeg, inDeg, count(path) AS cycles
RETURN outDeg, inDeg, cycles`
      },
      {
        id: "ss7",
        title: "7. Client-side Community Detection",
        type: "Algorithm: Louvain Modularity",
        description: "Community detection runs entirely in JavaScript on the client's WebGL browser engine using Louvain modularity optimisation to colorize nodes.",
        code: `// Iteratively moves each node to the neighbouring
// community that produces the greatest modularity gain ΔQ
logVolume = Math.log10(transaction_volume_sum + 1);
nodes: [{id, riskScore, clusterId}] -> edges: [{link, target, weight}]`
      }
    ]
  },
  {
    id: "slide7",
    navLabel: "Algorithms (Frontend)",
    kicker: "07 Client Computations",
    title: "Community Algorithms & Scale",
    mainIdea: "Bridging physical backend traversal logic straight into live browser mathematical configurations.",
    bullets: [
      "Louvain Modularity: Dynamically assigns structural sub-graph nodes into tight programmatic rings instantly mapping money laundering behavior.",
      "Weighted Spatial Indexing: Scales node physical dimensions and visual custom Glow intensities linearly down using a Log10 thresholding function.",
      "Visual Whale Prevention: Restricts visual distortion ensuring $100M wallets dont geographically consume/overlap $1k laundering instances."
    ],
    code: "logVolume = Math.log10(transaction_volume_sum + 1);\nnodes: [{id, riskScore, clusterId}] -> edges: [{link, target, weight}]",
    icon: Eye,
  },
  {
    id: "slide8",
    navLabel: "Thread Detection",
    kicker: "08 Security Models",
    title: "Heuristic Threat Signatures",
    mainIdea: "Active system engines generating automated flags identifying sophisticated malicious financial structures.",
    bullets: [
      "Layering (Circular Loops): Employs deep variable-length pattern matching isolating loops ranging from 2->6 hops effectively neutralizing ping-pongs.",
      "Smurfing Distributions: Employs Fan-Out metric sweeps to highlight illegal distribution Hubs feeding thousands of sub-network wallets.",
      "Risk Automation Algorithm: Calculates absolute system limits weighting Cycles highest (30%), scaling against aggregate In/Out density properties."
    ],
    code: "MATCH path = (w)-[:TRANSFER*2..6]->(w) // Deep Laundering Path Scan\nOVERALL_SCORE = Min(100, FanOut(25) + FanIn(25) + Cycles(30) + Density(20))",
    icon: ShieldAlert,
  },
  {
    id: "slide9",
    navLabel: "Summary",
    kicker: "09 Conclusion",
    title: "Graph Dominance Limits",
    mainIdea: "Network-native algorithms radically expand human visibility into structurally hidden payload behaviors.",
    bullets: [
      "Scale & Speed: Native indexes efficiently limit and structure operations infinitely scaling alongside expanding Distributed Ledger logs.",
      "Cryptocurrency & Beyond: Model adapts cleanly to conventional Banking Ledgers, Corporate hierarchies, and decentralized Web3 topologies.",
      "DBMS Efficiency: Neo4j operates smoothly tracking highly chaotic datasets resolving relationships seamlessly visually in standard UX pipelines."
    ],
    icon: Layers,
  },
  {
    id: "slide10",
    navLabel: "Questions",
    kicker: "10 Finish",
    title: "Presentation Complete",
    mainIdea: "Thank you for listening.",
    bullets: [],
    icon: Lock,
  }
];

