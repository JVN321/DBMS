# DBMS — Distributed Blockchain Monitoring System

Graph-based blockchain transaction monitoring and fraud detection platform built with **Next.js**, **Fastify**, **Neo4j**, and **Cytoscape.js**.

---

## Table of Contents

1. [What is This App?](#what-is-this-app)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Getting Started](#getting-started)
5. [Authentication & User Roles](#authentication--user-roles)
6. [Setting Up the First Admin](#setting-up-the-first-admin)
7. [Admin Features](#admin-features)
8. [User (Regular) Features](#user-regular-features)
9. [Graph Explorer](#graph-explorer)
10. [Suspicious Activity Detection](#suspicious-activity-detection)
11. [Wallet Inspector](#wallet-inspector)
12. [Environment Variables](#environment-variables)
13. [API Endpoints](#api-endpoints)
14. [Troubleshooting](#troubleshooting)

---

## What is This App?

DBMS is a tool for visualizing and analyzing blockchain transactions. It shows:

- **Who sent money to whom** on the blockchain in an interactive graph
- **Which wallets might be suspicious** based on transaction patterns
- **Connections between wallets** and potential fraud rings
- **Risk scores for wallets** to identify potentially dangerous accounts

---

## Project Structure

```
DBMS/
├── backend/                  # Fastify API server (port 4000)
│   ├── middleware/           # Auth middleware
│   ├── neo4j/                # Neo4j driver & schema
│   ├── ingestion/            # CSV/JSON parsers
│   ├── services/             # Detection, ingestion, graph transforms
│   ├── routes/               # REST endpoints
│   ├── scripts/              # Utility scripts (create_admin, etc.)
│   └── server.js             # Entry point
└── frontend/                 # Next.js app (port 3000)
    ├── app/                  # App Router pages & components
    ├── lib/                  # API client, auth context
    └── public/               # Static assets & sample data
```

---

## Prerequisites

- **Node.js** 18+
- **Neo4j Desktop** running on `bolt://localhost:7687`

---

## Getting Started

### 1. Backend

```bash
cd backend
cp .env.example .env   # edit with your Neo4j credentials and a strong JWT_SECRET
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

### 3. Create an Admin Account (required before first use)

See [Setting Up the First Admin](#setting-up-the-first-admin) below.

### 4. Load Sample Data

Log in as admin, navigate to **Upload** in the sidebar, and upload `sample_data/sample_data.csv`.

---

## Authentication & User Roles

DBMS uses **JWT-based authentication** (tokens expire after 24 hours). Every user needs an account to access the app.

There are two roles:

| Role | Who is it for |
|---|---|
| `admin` | System administrators — can upload data, manage users, clear the database, and access all admin panels |
| `user` | Analysts — can view graphs, inspect wallets, search for patterns, and run path analysis; **cannot** upload or manage data |

Tokens are stored in `localStorage` under the key `auth_token`. The sidebar and pages automatically adapt to the logged-in role.

---

## Setting Up the First Admin

The database starts empty — there are no users yet. You must create the first admin account manually using the provided script before anyone can log in.

### Step 1 — Ensure the backend `.env` is configured

`backend/.env` must have valid Neo4j credentials and a strong `JWT_SECRET`:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=neo4j
JWT_SECRET=change-this-to-a-long-random-string
PORT=4000
```

> **Security note:** Never leave `JWT_SECRET` as the default value in production. Use a random string of at least 32 characters.

### Step 2 — Run the create_admin script

```bash
cd backend
node scripts/create_admin.js <username> <password> <email>
```

**Example:**

```bash
node scripts/create_admin.js admin MyStr0ngPass! admin@example.com
```

**Arguments:**

| Argument | Default | Description |
|---|---|---|
| `username` | `admin` | Login username |
| `password` | `admin123` | Login password (min 6 characters) |
| `email` | `admin@example.com` | Admin email address |

**What the script does:**
- If the username **does not exist**: creates a new `admin`-role user with the given credentials
- If the username **already exists**: promotes it to `admin` role and optionally updates the password if one is supplied

### Step 3 — Log in

Open `http://localhost:3000`, click **Sign In**, enter the credentials you just created.

### Promoting an Existing User to Admin

If you already have a user account and want to make it an admin:

```bash
# promote without changing password
node scripts/create_admin.js existingUsername

# promote and set a new password
node scripts/create_admin.js existingUsername newPassword
```

Or from the admin panel in the UI: **Admin → User Management → edit the user → set role to Admin**.

### Changing the Admin Password

There is no password-reset UI yet. To reset the password for any user, re-run the script:

```bash
node scripts/create_admin.js admin NewPassword123!
```

---

## Admin Features

Admins have access to a dedicated **Admin** section in the sidebar, plus all regular user features.

### Admin Dashboard (`/admin`)

Overview of system activity:
- Total requests processed, error count, upload count
- Quick-links to all admin sub-pages

### User Management (`/admin/users`)

A table of all registered users with the ability to:

| Action | Description |
|---|---|
| **Edit role** | Promote a user to `admin` or demote back to `user` |
| **Edit email** | Update a user's email address |
| **Ban / Unban** | Prevent a banned user from logging in |
| **Delete** | Permanently remove a user (cannot delete the `admin` account) |

> Banned users receive a 401 error on their next request and cannot log back in until unbanned.

### Upload Data (`/upload`)

Only admins can upload transaction data. Supported formats:

- **CSV** — columns: `wallet_from`, `wallet_to`, `amount`, `coin_type`, `timestamp` (and optional `txid`)
- **JSON** — array of objects with the same fields

After upload the graph and statistics refresh automatically.

### Upload History (`/admin/uploads`)

A log of every file upload — filename, uploader, timestamp, number of records ingested, and any errors.

### System Logs (`/admin/logs`)

Full request/event audit log viewable and filterable by date, user, and event type.

### System Settings (`/admin/settings`)

Configure global platform limits:

| Setting | Default | Description |
|---|---|---|
| `max_upload_size_mb` | 50 | Maximum file size for uploads |
| `max_users` | 100 | Maximum number of registered users |
| `api_rate_limit` | 1000 | Max API requests per window |
| `api_rate_window_minutes` | 60 | Rate-limit window in minutes |
| `maintenance_mode` | false | Disables non-admin access when enabled |

### Clear Database

From the Upload page, admins can **Clear Database** to wipe all wallet nodes and transactions from Neo4j. This action is irreversible — use it only when reloading fresh data.

---

## User (Regular) Features

Regular users can access everything except admin panels and uploads.

### Dashboard (`/`)

- **Total wallets** — number of unique wallet addresses loaded
- **Total transactions** — number of transfer edges in the graph
- **High / Medium / Low risk wallets** — breakdown by risk score bands

### Graph Explorer (`/graph`)

Interactive visualization of the entire transaction network. See [Graph Explorer](#graph-explorer) section for details.

### Suspicious Activity (`/suspicious`)

Automated fraud-pattern detection across the loaded data. See [Suspicious Activity Detection](#suspicious-activity-detection).

### Wallet Inspector (`/wallet/[address]`)

Deep-dive into any individual wallet. See [Wallet Inspector](#wallet-inspector).

### Profile (`/user`)

- View account details (username, email, role)
- Change display preferences

---

## Graph Explorer

The Graph Explorer (`/graph`) is the main investigation workspace.

### Selecting Wallets to Visualize

The **Wallet(s)** chip input in the header lets you visualize one or more wallets at the same time:

1. Type a wallet address and press **Enter** or **comma** to add it as a chip
2. Press **Backspace** to remove the last chip, or click **×** on a chip to remove it individually
3. Up to **10 wallets** can be added — the graph shows the combined 1-hop neighborhood of all of them
4. Leave empty to load the full global graph (subject to the node limit)
5. Click **Apply** to reload

All wallets you add are **highlighted in red** in both 2D and 3D views. When exactly one wallet is added, the 3D camera automatically flies to it after the simulation settles.

> Navigating here via the **Visualize** button on the Suspicious Activity page automatically pre-fills the selected wallet.

### Filters

| Control | Description |
|---|---|
| **Coin** | Filter edges to a specific coin type (e.g. `BTC`, `ETH`) |
| **Wallet(s)** | Ego-center the graph on one or more addresses |
| **Node limit** | Max number of nodes to fetch (10–1000, default 200) |
| **Apply** | Reload the graph with current filters |

### 2D / 3D Toggle

- **2D** — Cytoscape.js force-directed layout with cola physics; good for smaller graphs
- **3D** — Three.js + 3d-force-graph WebGL renderer; better for large networks

### 3D-only Controls

| Control | Description |
|---|---|
| **Vol-threshold** | Hide nodes below this normalized volume percentile (0–100%) |
| **Risk / Cluster** | Colour nodes by risk score (red = high) or community cluster |
| **Timeline** | Animate edges in chronological transaction order |
| **Force / Fraud Layout** | Switch between free-spring and fraud-pattern-aligned layout |
| **Lite Mode** | Reduce particle effects for better performance |
| **Viz Settings** | Per-user persisted sliders for fog density, particle speed/count, glow intensity, and orbit speed |

### Path Finder

Find the shortest transaction chain between two wallets:

1. Enter a **From** address and a **To** address in the path finder bar
2. Click **Find Path**
3. The graph reloads showing only the path — nodes and edges on the path are highlighted in amber

### Tooltips

- **Hover a node** — shows address, volume, risk score, cluster, and fraud pattern
- **Hover a connection** — shows sender, receiver, amount, coin type, timestamp, and transaction ID

### Node Click

Clicking a wallet node opens its Wallet Inspector page (`/wallet/[address]`).

---

## Suspicious Activity Detection

The Suspicious Activity page (`/suspicious`) runs automated fraud-pattern detection.

### Pattern Types

| Pattern | Description |
|---|---|
| **Circular** | Wallets that form transaction cycles — indicative of circular laundering |
| **Fan-out** | One wallet sending to many others rapidly — distribution / scam pattern |
| **Fan-in** | Many wallets funnelling into one — collection point |
| **Hub** | High-degree wallets acting as exchange hubs |
| **Mixer** | Wallets with both high in-degree and out-degree — mixing service |

### Actions

- **Search bar** — Filter wallets by address in the results list
- **Copy button** — Click the copy icon next to any address to copy it to your clipboard
- **Visualize button** — Opens the Graph Explorer centred on that wallet

---

## Wallet Inspector

Clicking any wallet address (in the graph, suspicious page, or path results) opens a detail page at `/wallet/[address]`.

### What You See

| Section | Details |
|---|---|
| **Header** | Full address, risk score badge, fraud pattern label |
| **Stats** | Total volume, transaction count, connected wallets |
| **2D / 3D Graph** | 1-hop neighbourhood graph with the inspected wallet highlighted in red and camera centred on it |
| **Transaction Table** | Paginated list of all transactions — txid, counterparty address, amount, coin, timestamp |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `NEO4J_URI` | `bolt://localhost:7687` | Neo4j connection URI |
| `NEO4J_USER` | `neo4j` | Neo4j username |
| `NEO4J_PASSWORD` | — | Neo4j password (**required**) |
| `NEO4J_DATABASE` | `neo4j` | Neo4j database name |
| `JWT_SECRET` | `your-secret-key-change-in-production` | Secret for signing JWTs (**change this**) |
| `PORT` | `4000` | Backend server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API URL |

---

## API Endpoints

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user account |
| `POST` | `/auth/login` | Public | Log in and receive a JWT |
| `GET` | `/auth/me` | User | Get current user info |
| `POST` | `/auth/refresh` | User | Refresh JWT |
| `POST` | `/auth/logout` | User | Invalidate session |

### Users (Admin only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/users` | List all users |
| `GET` | `/users/:username` | Get one user |
| `PUT` | `/users/:username` | Update role or email |
| `POST` | `/users/:username/ban` | Ban or unban a user |
| `DELETE` | `/users/:username` | Delete a user |

### Data

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/upload-transactions` | **Admin** | Upload CSV/JSON transaction file |
| `DELETE` | `/clear-database` | **Admin** | Wipe all nodes and relationships |
| `GET` | `/stats` | User | Dashboard statistics |
| `GET` | `/graph` | User | Transaction graph (`?limit`, `?coin_type`, `?address`, `?addresses`) |
| `GET` | `/wallet/:address` | User | Wallet details + transactions |
| `GET` | `/transactions/path` | User | Shortest path between two wallets (`?from`, `?to`) |
| `GET` | `/suspicious` | User | Fraud pattern detection (`?type`, `?threshold`, `?limit`) |

### Admin

| Method | Path | Description |
|---|---|---|
| `GET` | `/settings` | Read system settings |
| `PUT` | `/settings` | Update system settings |
| `GET` | `/logs` | Read audit log |
| `GET` | `/logs/stats/system` | System activity summary |

---

## Troubleshooting

### `useSearchParams is not defined` / `useAuth is not defined`

These are missing import errors in the frontend. Ensure you are running the latest code — the imports should be at the top of `app/graph/page.js`:

```js
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
```

### Frontend can't connect to backend

- Verify `http://localhost:4000/health` returns `{ status: "ok" }`
- Check `.env.local` has the correct `NEXT_PUBLIC_API_URL`
- Ensure CORS in `backend/.env` matches the frontend origin

### Neo4j connection fails

- Confirm Neo4j Desktop is running and the database is active
- Verify `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` in `backend/.env`
- Try restarting Neo4j Desktop

### "Admin access required" shown on Upload page

You are logged in as a regular user. Either [promote your account to admin](#promoting-an-existing-user-to-admin) or log in with an admin account.

### JWT errors / "Invalid or expired token"

Tokens expire after 24 hours. Log out and log back in. If the issue persists, ensure `JWT_SECRET` has not changed between restarts.

### Graph shows no data

- Upload transaction data via the Upload page (admin required)
- Check the node limit is not set too low
- Try clearing filters and clicking **Apply**

### Port 3000 or 4000 already in use

```bash
# find and kill the process on that port (Windows)
netstat -ano | findstr :4000
taskkill /PID <pid> /F
```

Or change the port in `backend/.env` (`PORT=4001`) and update `NEXT_PUBLIC_API_URL` accordingly.


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
