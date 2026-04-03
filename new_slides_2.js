const SLIDES = [
  {
    id: "slide1",
    navLabel: "Title Slide",
    kicker: "Course: Database Management Systems",
    title: "Blockchain Transaction Graph Analysis using Neo4j",
    mainIdea: "Name: Sam Sunny | Branch: B.Tech CSE (AI) | College: MITS",
    bullets: [],
    icon: Database,
  },
  {
    id: "slide2",
    navLabel: "Problem Statement",
    kicker: "02 Problem Statement",
    title: "Why Traditional RDBMS Struggles",
    mainIdea: "Blockchain data is highly relational + massive.",
    bullets: [
      "Deep relationship queries",
      "Path tracing",
      "Fraud detection patterns",
      "We need: Efficient graph traversal, Real-time analytics, Pattern detection"
    ],
    icon: Activity,
  },
  {
    id: "slide3",
    navLabel: "Why Graph DBs?",
    kicker: "03 Solution",
    title: "Why Graph Databases?",
    mainIdea: "Data is naturally a network. Relationships are first-class citizens.",
    bullets: [
      "Efficient for Path queries (A -> B -> C)",
      "Community detection",
      "Fraud pattern identification"
    ],
    code: "?? Solution: Neo4j Graph Database",
    icon: Network,
  },
  {
    id: "slide4",
    navLabel: "System Overview",
    kicker: "04 Architecture",
    title: "System Overview",
    mainIdea: "End-to-end pipeline from CSV to 3D Visualization",
    bullets: [
      "Batch ingestion (1000 records)",
      "Graph queries via Cypher",
      "Output: 2D / 3D visualization"
    ],
    code: "CSV -> Parser -> Validation -> Neo4j -> Query -> Transform -> Visualization",
    icon: Layers,
  },
  {
    id: "slide5",
    navLabel: "Data Model",
    kicker: "05 Entities",
    title: "Data Model (Entities)",
    mainIdea: "Nodes structure the core elements",
    bullets: [
      "Wallet: address (Primary Key)",
      "Coin: name (BTC, ETH)",
      "User: username, email, role"
    ],
    icon: Database,
  },
  {
    id: "slide6",
    navLabel: "Relationships",
    kicker: "06 Edges",
    title: "Network Relationships",
    mainIdea: "Connecting the nodes into a Directed Multigraph.",
    bullets: [
      "TRANSFER: Wallet -> Wallet",
      "Properties: txid, amount, timestamp, coin_type",
      "USES: Wallet -> Coin"
    ],
    code: "?? Forms a Directed Multigraph",
    icon: Network,
  },
  {
    id: "slide7",
    navLabel: "ER Representation",
    kicker: "07 Design",
    title: "ER Representation",
    mainIdea: "Many-to-many relationships. Multiple edges allowed between nodes.",
    bullets: [],
    code: "(Wallet) --TRANSFER--> (Wallet)\n   |\n   +----USES----> (Coin)\n\n(User)",
    icon: Layers,
  },
  {
    id: "slide8",
    navLabel: "Constraints",
    kicker: "08 Optimization",
    title: "Constraints & Indexing",
    mainIdea: "Designed to improve Query speed and Data integrity.",
    bullets: [
      "Constraints: Wallet.address -> UNIQUE, Coin.name -> UNIQUE, User.email -> UNIQUE",
      "Indexes: TRANSFER.timestamp, TRANSFER.txid"
    ],
    icon: Lock,
  },
  {
    id: "slide9",
    navLabel: "Data Ingestion",
    kicker: "09 Cypher",
    title: "Data Ingestion (Cypher)",
    mainIdea: "Uses MERGE for idempotency. Prevents duplicates. Batch processing.",
    bullets: [],
    code: "MERGE (from:Wallet {address: tx.wallet_from})\nMERGE (to:Wallet {address: tx.wallet_to})\nMERGE (from)-[t:TRANSFER {txid: tx.transaction_id}]->(to)",
    icon: Database,
  },
  {
    id: "slide10",
    navLabel: "Transformation",
    kicker: "10 Mapping",
    title: "Graph Transformation",
    mainIdea: "Backend to Frontend format conversion.",
    bullets: [
      "Deduplication using Maps",
      "Path extraction",
      "Property normalization"
    ],
    code: "nodes: [{id, label, riskScore}]\nedges: [{source, target, amount}]",
    icon: Activity,
  },
  {
    id: "slide11",
    navLabel: "Visualization",
    kicker: "11 Visuals",
    title: "Visualization Outputs (2D & 3D)",
    mainIdea: "?? Reveals hidden structures visually",
    bullets: [
      "2D: Cytoscape.js, Cola layout (force-based)",
      "3D: Three.js + d3-force, Z-axis = transaction volume"
    ],
    icon: Eye,
  },
  {
    id: "slide12",
    navLabel: "Force Layout",
    kicker: "12 Physics",
    title: "Force Directed Layout",
    mainIdea: "Nodes = particles, Edges = springs. ?? Produces natural clustering.",
    bullets: [
      "Repulsion (avoid overlap)",
      "Attraction (connected nodes)"
    ],
    icon: Network,
  },
  {
    id: "slide13",
    navLabel: "Volume Scaling",
    kicker: "13 Analytics",
    title: "Volume & Scaling",
    mainIdea: "Total transaction volume per node scaled using Log. ?? Prevents whale dominance",
    bullets: [
      "Used for Node size",
      "Glow intensity",
      "Z-axis mapping"
    ],
    code: "logVolume = log10(volume + 1)",
    icon: BarChart3,
  },
  {
    id: "slide14",
    navLabel: "Communities",
    kicker: "14 Algorithms",
    title: "Community Detection",
    mainIdea: "Algorithm: Louvain. Groups highly connected wallets based on modularity optimization.",
    bullets: [
      "Output: clusterId per node",
      "?? Detects hidden groups (fraud rings)"
    ],
    icon: Layers,
  },
  {
    id: "slide15",
    navLabel: "Risk System",
    kicker: "15 Security",
    title: "Risk Detection System",
    mainIdea: "Detects suspicious patterns in the transaction network.",
    bullets: [
      "Circular transactions",
      "High fan-out",
      "High fan-in",
      "Rapid transfers",
      "Dense clusters"
    ],
    icon: ShieldAlert,
  },
  {
    id: "slide16",
    navLabel: "Circular Loops",
    kicker: "16 Example",
    title: "Example: Circular Transfers",
    mainIdea: "Detects money loops. Used in money laundering.",
    bullets: [],
    code: "MATCH path = (w)-[:TRANSFER*2..6]->(w)",
    icon: Activity,
  },
  {
    id: "slide17",
    navLabel: "Hubs & Sinks",
    kicker: "17 Example",
    title: "Example: Fan-Out / Fan-In",
    mainIdea: "?? Indicates Distribution hubs and Collection wallets",
    bullets: [
      "Fan-Out: many outgoing edges",
      "Fan-In: many incoming edges"
    ],
    icon: Network,
  },
  {
    id: "slide18",
    navLabel: "Risk Score",
    kicker: "18 Scoring",
    title: "Risk Score Calculation",
    mainIdea: "?? Final score: 0-100",
    bullets: [
      "Fan-out: 25 pts",
      "Fan-in: 25 pts",
      "Cycles: 30 pts",
      "Degree: 20 pts"
    ],
    code: "Risk = FanOut + FanIn + Cycles + Degree\n(Max = 100)",
    icon: BarChart3,
  },
  {
    id: "slide19",
    navLabel: "Queries",
    kicker: "19 Abilities",
    title: "Query Capabilities",
    mainIdea: "?? Efficient traversal vs SQL joins",
    bullets: [
      "Shortest path",
      "Time filtering",
      "Subgraph extraction"
    ],
    code: "shortestPath((a)-[:TRANSFER*]->(b))",
    icon: Database,
  },
  {
    id: "slide20",
    navLabel: "Optimization",
    kicker: "20 Performance",
    title: "Performance Optimization",
    mainIdea: "?? Scales to large blockchain data",
    bullets: [
      "Batch ingestion (1000 rows)",
      "Indexed queries",
      "LIMIT clauses",
      "Bulk risk computation"
    ],
    icon: Clock,
  },
  {
    id: "slide21",
    navLabel: "Advantages",
    kicker: "21 Pros",
    title: "Advantages",
    mainIdea: "Why this stack shines.",
    bullets: [
      "Fast relationship queries",
      "Natural modeling of networks",
      "Real-time fraud detection",
      "Scalable visualization"
    ],
    icon: Activity,
  },
  {
    id: "slide22",
    navLabel: "Limitations",
    kicker: "22 Cons",
    title: "Limitations",
    mainIdea: "Things to look out for in graph computing.",
    bullets: [
      "Not ideal for tabular data",
      "Memory intensive",
      "Requires graph thinking"
    ],
    icon: ShieldAlert,
  },
  {
    id: "slide23",
    navLabel: "Applications",
    kicker: "23 Usage",
    title: "Real-World Applications",
    mainIdea: "Domains that benefit heavily.",
    bullets: [
      "Fraud detection",
      "Cryptocurrency analytics",
      "Social network analysis",
      "Recommendation systems"
    ],
    icon: Network,
  },
  {
    id: "slide24",
    navLabel: "Conclusion",
    kicker: "24 Summary",
    title: "Conclusion",
    mainIdea: "Graph DBs outperform relational DBs for connected data",
    bullets: [
      "Neo4j enables Efficient traversal and Pattern detection",
      "Visual analytics capabilities",
      "Ideal for blockchain systems"
    ],
    icon: Layers,
  },
  {
    id: "slide25",
    navLabel: "Thank You",
    kicker: "25 Finish",
    title: "Thank You",
    mainIdea: "Questions?",
    bullets: [],
    icon: Eye,
  }
];
