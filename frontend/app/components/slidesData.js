import {
  Activity,
  Database,
  Eye,
  Globe,
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
      "Aman Antony — MUT24CA013",
      "John Varghese Nettady — MUT24CA044",
      "Sam Sunny — MUT24CA064",
      "Sangeetha Shalom Saji — MUT24CA065"
    ],
    icon: Database,
  },
  {
    id: "slide2",
    navLabel: "Problem Definition",
    kicker: "02 — Why Not a Regular Database?",
    title: "Why Normal Databases Fall Short",
    mainIdea: "Blockchain has millions of wallet-to-wallet transfers. Traditional databases aren't built to trace these chains efficiently.",
    bullets: [
      "Chains of transfers: In a regular database, tracing money through 4–5 wallets requires multiple expensive joins — it gets slow very fast.",
      "Graphs are a natural fit: A graph database stores wallets as nodes and transfers as connections, making it natural to follow any path.",
      "Speed matters: Neo4j can jump from one wallet to the next in constant time, which means real-time fraud detection becomes possible."
    ],
    icon: Activity,
  },
  {
    id: "slide3",
    navLabel: "System Architecture",
    kicker: "03 — How the System Works",
    title: "End-to-End System Pipeline",
    mainIdea: "Data flows from a raw CSV file all the way to an interactive 3D graph in the browser — in a few steps.",
    bullets: [
      "Upload: The user uploads a CSV file of transactions. The backend reads and cleans this data.",
      "Store: Cleaned data is written into Neo4j as a graph — wallets become nodes, transfers become edges.",
      "Visualize: The frontend fetches the graph and renders it as an interactive 3D network in the browser."
    ],
    code: "CSV File → Backend Parser → Neo4j Graph Database → 3D Browser Visualization",
    icon: Server,
  },
  {
    id: "slide4",
    navLabel: "Graph Schema",
    kicker: "04 — Data Structure",
    title: "How the Data is Organised",
    mainIdea: "We model the blockchain as a network: wallets are the dots (nodes), and each transfer between them is an arrow (edge).",
    bullets: [
      "Nodes: Each wallet address is stored as a Wallet node. ",
      "Edges: Every transaction creates a TRANSFER arrow from one wallet to another, tagged with the amount, time, and transaction ID.",
      "Relationships: One wallet can send to many others, and receive from many others — the graph captures all of this naturally."
    ],
    code: "(Wallet A) --[:TRANSFER {amount, time, txid}]--> (Wallet B)\n                 |\n                 +----[:USES_PROTOCOL]----> (Coin: BTC / ETH)",
    icon: Network,
  },
  {
    id: "slide5",
    navLabel: "Data Ingestion",
    kicker: "05 — Writing Data to the Database",
    title: "Loading Transactions Safely",
    mainIdea: "We use Cypher (Neo4j's query language) to load thousands of transactions at once without creating duplicates.",
    bullets: [
      "Unique wallets: Before inserting, we check if a wallet already exists — if it does, we reuse it instead of creating a duplicate.",
      "Bulk loading: Transactions are processed in batches, which is much faster than inserting them one by one.",
      "Safe retries: If the upload fails halfway through, re-running it is safe — it won't create double entries."
    ],
    code: "UNWIND $transactions AS tx\nMERGE (from:Wallet {address: tx.wallet_from})\nMERGE (to:Wallet {address: tx.wallet_to})\nMERGE (from)-[t:TRANSFER {txid: tx.transaction_id}]->(to)",
    icon: Database,
  },
  {
    id: "slide6",
    navLabel: "Detection Queries",
    kicker: "06 — Finding Suspicious Patterns",
    title: "What the System Can Detect",
    mainIdea: "We run graph queries to automatically spot patterns that are common in money laundering and fraud.",
    bullets: [
      "Each detection type looks for a specific suspicious behaviour — circular transfers, unusual sending patterns, rapid pass-throughs, and more.",
      "These queries run directly in Neo4j and return results in real time.",
      "The results are then shown visually on the graph so the analyst can explore them."
    ],
    icon: Zap,
    subSlides: [
      {
        id: "ss1",
        title: "1. Circular Transfers",
        type: "Pattern: Money Looping Back",
        description: "Finds wallets where money goes out through a chain of transfers and eventually comes back to the same wallet. This is a classic layering technique in money laundering — moving funds in circles to hide the trail.",
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
        title: "2. High Fan-Out (Scattering)",
        type: "Pattern: One Sender → Many Recipients",
        description: "Finds wallets that send money to a very large number of different recipients. This is suspicious because it resembles 'smurfing' — breaking up a large amount and spreading it across many smaller wallets to avoid detection.",
        code: `MATCH (w:Wallet)-[t:TRANSFER]->()
WITH w, count(t) AS outDegree, sum(t.amount) AS totalSent
WHERE outDegree >= toInteger($threshold)
RETURN w.address AS address, outDegree, totalSent
ORDER BY outDegree DESC
LIMIT toInteger($limit)`
      },
      {
        id: "ss3",
        title: "3. High Fan-In (Collecting)",
        type: "Pattern: Many Senders → One Recipient",
        description: "Finds wallets that receive money from a very large number of different senders. This is the opposite of scattering — it looks like a collection point or aggregator, often seen in the final stage before funds are cashed out.",
        code: `MATCH ()-[t:TRANSFER]->(w:Wallet)
WITH w, count(t) AS inDegree, sum(t.amount) AS totalReceived
WHERE inDegree >= toInteger($threshold)
RETURN w.address AS address, inDegree, totalReceived
ORDER BY inDegree DESC
LIMIT toInteger($limit)`
      },
      {
        id: "ss4",
        title: "4. Rapid Pass-Through",
        type: "Pattern: A → B → C in seconds",
        description: "Finds three-wallet chains where money is passed from A to B, and then from B to C within a very short time window. This suggests B is not a real user — it's just a relay point to quickly move funds further along the chain.",
        code: `MATCH (a:Wallet)-[t1:TRANSFER]->(b:Wallet)-[t2:TRANSFER]->(c:Wallet)
WHERE a <> c
  AND toInteger(t2.timestamp) - toInteger(t1.timestamp) >= 0
  AND toInteger(t2.timestamp) - toInteger(t1.timestamp) <= toInteger($windowSeconds)
RETURN a.address AS from, b.address AS via, c.address AS to`
      },
      {
        id: "ss5",
        title: "5. Dense Clusters",
        type: "Pattern: Highly Connected Wallets",
        description: "Finds wallets that both send and receive from many others — they are heavily connected in both directions. These are central hubs in a transaction cluster and are strong candidates for further investigation.",
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
        type: "Scoring: 0–100 Risk Rating",
        description: "Combines all the signals — how many it sends to, how many it receives from, and whether it's part of a loop — into a single 0 to 100 risk score. Higher score means the wallet looks more suspicious overall.",
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
        title: "7. Automatic Grouping (Community Detection)",
        type: "Algorithm: Grouping Similar Wallets",
        description: "Groups wallets that frequently interact with each other into 'communities' and colors them the same on the graph. This runs entirely in the browser and makes it easy to visually spot clusters of activity at a glance.",
        code: `// Each wallet is assigned to the group that gives the
// biggest improvement in overall network structure (modularity).
logVolume = Math.log10(transaction_volume_sum + 1);
nodes: [{id, riskScore, clusterId}] -> edges: [{source, target, weight}]`
      }
    ]
  },
  {
    id: "slide7",
    navLabel: "Visualization",
    kicker: "07 — What You See in the Browser",
    title: "3D Graph Visualization",
    mainIdea: "The graph isn't just a static picture — it's a live, interactive 3D network where you can explore wallets, zoom in, and click to investigate.",
    bullets: [
      "Node size reflects volume: Wallets that have sent or received more money appear larger on screen, making big players easy to spot.",
      "Color shows community: Wallets that interact heavily with each other share the same color, revealing clusters of related activity.",
      "Balanced scale: We use a logarithmic scale so that very large wallets don't visually dominate and hide smaller suspicious ones."
    ],
    code: "nodeSize = Math.log10(transaction_volume + 1);\nnodes: [{id, riskScore, clusterId}] -> edges: [{source, target, weight}]",
    icon: Eye,
  },
  {
    id: "slide8",
    navLabel: "Threat Detection",
    kicker: "08 — Identifying Suspicious Behaviour",
    title: "How We Spot Money Laundering",
    mainIdea: "The system automatically flags wallets that show known money laundering patterns and gives each one a risk score.",
    bullets: [
      "Circular loops: Money that eventually returns to the starting wallet — a classic way to disguise the origin of funds.",
      "Smurfing (scattering): One wallet splitting and sending money to hundreds of others to avoid transaction limits and detection.",
      "Risk score formula: Combines fan-out (25%), fan-in (25%), cycles (30%), and overall connectivity (20%) into a 0–100 score."
    ],
    code: "MATCH path = (w)-[:TRANSFER*2..6]->(w)  // Detect circular money loops\nRISK_SCORE = Min(100, FanOut×25 + FanIn×25 + Cycles×30 + Connectivity×20)",
    icon: ShieldAlert,
  },
  {
    id: "slide9",
    navLabel: "SDG Alignment",
    kicker: "09 — Sustainable Development Goals",
    title: "Alignment with UN Sustainable Development Goals",
    mainIdea: "Graph-based financial intelligence directly supports global sustainability by combating illicit financial flows and fostering economic integrity.",
    bullets: [
      "SDG 16: Peace, Justice & Strong Institutions (Target 16.4) — Significantly reduces illicit financial flows, financial crime, and money laundering across decentralized networks.",
      "SDG 8: Decent Work & Economic Growth (Target 8.10) — Strengthens financial system integrity and trust in digital economies by ensuring transparent and secure transactions.",
      "SDG 9: Industry, Innovation & Infrastructure — Demonstrates technological innovation by applying graph database analytics and machine intelligence to modern financial security."
    ],
    icon: Globe,
  },
  {
    id: "slide10",
    navLabel: "Conclusion",
    kicker: "10 — What We Learned",
    title: "Why Graph Databases Win Here",
    mainIdea: "A graph database made it possible to do things that would be very difficult or slow with a regular database.",
    bullets: [
      "Speed at scale: Following chains of transfers stays fast even with millions of transactions — something traditional databases struggle with.",
      "Wider use cases: The same approach works for banking fraud, corporate ownership trees, and any domain where connections matter.",
      "Better insights: Relationships between wallets are first-class citizens in Neo4j, making it much easier to ask complex questions about the data."
    ],
    icon: Layers,
  },
  {
    id: "slide11",
    navLabel: "Questions",
    kicker: "11 — End",
    title: "Thank You",
    mainIdea: "We are happy to answer any questions.",
    bullets: [],
    icon: Lock,
  }
];
