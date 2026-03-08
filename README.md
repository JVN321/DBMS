# DBMS — Distributed Blockchain Monitoring System

Graph-based blockchain transaction monitoring and fraud detection platform built with **Next.js**, **Fastify**, **Neo4j**, and **Cytoscape.js**.

## What is This App?

DBMS is a tool that helps you visualize and analyze blockchain transactions. It shows you:
- **Who sent money to whom** on the blockchain in an interactive graph
- **Which wallets might be suspicious** based on transaction patterns
- **Connections between different wallets** and potential fraud rings
- **Risk scores for wallets** to identify potentially dangerous accounts

## Project Structure

```
crypto-sentinel/
├── backend/          # Fastify API server (port 4000)
│   ├── neo4j/        # Neo4j driver & schema
│   ├── ingestion/    # CSV/JSON parsers
│   ├── services/     # Detection, ingestion, graph transforms
│   ├── routes/       # REST endpoints
│   └── server.js     # Entry point
├── frontend/         # Next.js app (port 3000)
│   ├── app/          # App Router pages & components
│   ├── lib/          # API client
│   └── public/       # Static assets & sample data
└── README.md
```

## Prerequisites

- **Node.js** 18+
- **Neo4j Desktop** running on `bolt://localhost:7687`

## Getting Started

### 1. Backend

```bash
cd backend
cp .env.example .env   # then edit with your Neo4j credentials
npm install
npm run dev            # starts on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev            # starts on http://localhost:3000
```

### 3. Load Sample Data

Navigate to **http://localhost:3000/upload** and upload `frontend/public/sample-data.csv`.

## How to Use the App

### Step 1: Access the Dashboard
Open your browser and go to **http://localhost:3000**. You'll see the main dashboard with:
- **Statistics Panel**: Shows total wallets, transactions, and risk summary
- **Graph Visualization**: An interactive network showing all wallets and their connections
- **Search/Filter Options**: Tools to explore specific wallets or patterns

### Step 2: Upload Transaction Data
1. Click the **Upload** button (or navigate to `/upload`)
2. Choose a CSV or JSON file with transaction data
3. The file should have columns like: `from_wallet`, `to_wallet`, `amount`, `timestamp`
4. After upload, the graph updates automatically with new data

### Step 3: Explore the Graph
- **Click nodes** (circles) to see wallet details including risk scores
- **Drag nodes** to rearrange the graph for better visibility
- **Scroll to zoom** in and out
- **Hover over connections** to see transaction details
- **Search** for specific wallet addresses in the search bar

### Step 4: Analyze Wallets
Click on any wallet node to view:
- **Wallet Address**: The unique blockchain wallet identifier
- **Risk Score**: A numerical rating (0-100) indicating how likely this wallet is involved in suspicious activity (higher = more suspicious)
- **Transaction Count**: Total number of transactions involving this wallet
- **Balance**: Current amount of cryptocurrency in the wallet
- **Connected Wallets**: Other wallets this one has sent/received from

### Step 5: Find Suspicious Patterns
1. Navigate to the **Suspicious Patterns** page
2. The system automatically detects:
   - **Circular transactions**: Money transferred in a circle (possible money laundering)
   - **High-volume transfers**: Unusually large amounts moving between wallets
   - **Chain transactions**: Long sequences of transfers (possible hiding origin)
   - **Sudden spikes**: Wallets with rapid transaction increases

### Step 6: Check Wallet Paths
To understand the relationship between two wallets:
1. Click on a wallet and select **Find Path**
2. Choose another wallet
3. The app shows the shortest path of transactions connecting them
4. This reveals indirect relationships and transaction chains

## Understanding Key Terms

| Term | Meaning |
|------|---------|
| **Wallet** | A blockchain account that sends and receives cryptocurrency |
| **Transaction** | A transfer of cryptocurrency from one wallet to another |
| **Risk Score** | A number (0-100) estimating how likely a wallet is involved in fraud or illegal activity |
| **Node** | A visual dot in the graph representing a wallet |
| **Edge/Connection** | A line in the graph showing a transaction between two wallets |
| **Graph** | The visual network showing wallets and their transaction relationships |
| **Pattern Detection** | Automatic analysis finding suspicious transaction behaviors |

## What the Dashboard Shows

### Statistics Panel
- **Total Wallets**: Number of unique blockchain addresses loaded
- **Total Transactions**: Total number of transfers between wallets
- **High-Risk Wallets**: Count of wallets with risk scores above 70
- **Medium-Risk Wallets**: Count of wallets with risk scores between 40-70
- **Low-Risk Wallets**: Count of wallets with risk scores below 40

### Graph Colors
- **Red Nodes**: High-risk wallets (likely suspicious)
- **Yellow Nodes**: Medium-risk wallets
- **Green Nodes**: Low-risk wallets (likely safe)
- **Node Size**: Larger nodes = more transactions

### Connection Lines
- **Thick Lines**: Large transaction amounts
- **Thin Lines**: Small transaction amounts
- **Arrow Direction**: Shows which wallet sent the money (from tail to head)

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `NEO4J_URI` | `bolt://localhost:7687` | Neo4j connection URI |
| `NEO4J_USER` | `neo4j` | Neo4j username |
| `NEO4J_PASSWORD` | — | Neo4j password |
| `PORT` | `4000` | Server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API URL |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/stats` | Dashboard statistics |
| `POST` | `/upload-transactions` | Upload CSV/JSON transaction data |
| `GET` | `/graph` | Fetch graph data for visualization |
| `GET` | `/wallet/:address` | Wallet details with risk score |
| `GET` | `/transactions/path` | Shortest path between two wallets |
| `GET` | `/suspicious` | Detect suspicious patterns |

## Troubleshooting

### Issue: Frontend can't connect to backend
**Solution**:
- Verify backend is running on `http://localhost:4000`
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Check CORS settings in `backend/.env` allow `http://localhost:3000`

### Issue: Neo4j connection fails
**Solution**:
- Ensure Neo4j Desktop is running and database is active
- Verify connection URI is correct: `bolt://localhost:7687`
- Check Neo4j username and password in `backend/.env`
- Try restarting Neo4j Desktop

### Issue: Graph not displaying after upload
**Solution**:
- Check CSV/JSON format matches expected columns
- Verify file isn't corrupted
- Check browser console for JavaScript errors
- Clear browser cache and reload

### Issue: Risk scores showing as 0 or missing
**Solution**:
- The system needs minimum transaction data to calculate scores
- Upload more sample data
- Wait a few moments for calculations to complete

### Issue: Port 3000 or 4000 already in use
**Solution**:
- Change port in environment variables (`PORT` for backend, adjust frontend dev config)
- Or kill existing process using that port

## Common Questions

**Q: What blockchain does this support?**
A: Out of the box, DBMS can analyze transaction data from any blockchain in CSV/JSON format. It's not specific to one blockchain.

**Q: Can I use this for real blockchain data?**
A: Yes, if you export your blockchain transaction data as CSV/JSON with the required columns. Download transaction data from blockchain explorers or APIs.

**Q: How accurate are the risk scores?**
A: Risk scores are based on pattern detection algorithms. They indicate suspicion level but shouldn't be used as definitive proof—they're tools for investigation.

**Q: Can I delete wallets or transactions?**
A: Currently, the system loads data but doesn't have a delete function. Clear the Neo4j database and reload data if needed.

**Q: How often should I update the data?**
A: As often as you want. Upload new transaction data anytime to keep the graph current.

**Q: Can multiple people use this at once?**
A: Yes, it's a web app accessible to anyone on your network. Just share the frontend URL.
