# DBMS — System Architecture & Presentation Diagrams

This document contains full architecture diagrams, component specifications, and data flow models for the **DBMS (Distributed Blockchain Monitoring & Fraud Detection System)**, structured for inclusion in presentation slides and documentation.

---

## 1. High-Level System Architecture Diagram

```mermaid
graph TB
    subgraph ClientLayer["Frontend Layer (Next.js 14 / Port 3000)"]
        UI["User Interface (React + Tailwind CSS)"]
        AuthCtx["Auth Context & LocalStorage Token"]
        
        subgraph VizEngines["Visualization Engines"]
            Cy2D["2D Renderer (Cytoscape.js + Cola)"]
            Three3D["3D Renderer (Three.js + 3d-force-graph WebGL)"]
        end
        
        APIClient["API Client (Fetch / REST)"]
    end

    subgraph ServerLayer["Backend Layer (Fastify Node.js API / Port 4000)"]
        Router["Fastify HTTP Router"]
        
        subgraph MiddlewareStack["Middleware & Security"]
            JWTAuth["JWT Authentication & RBAC"]
            CORS["CORS & Rate Limiting"]
            Multer["Multipart Data Parser (CSV/JSON)"]
        end
        
        subgraph CoreServices["Business Logic Services"]
            IngestSvc["Data Ingestion Service"]
            FraudSvc["Fraud Pattern Detection Service"]
            GraphSvc["Graph Transformation & Path Finder"]
            UserSvc["User Management & Audit Logging"]
        end

        Driver["Neo4j Official Driver (`neo4j-driver`)"]
    end

    subgraph DatabaseLayer["Data Persistence Layer (Neo4j Aura Cloud)"]
        subgraph GraphDB["Neo4j Graph Database Engine"]
            WalletNodes["(:Wallet) Nodes"]
            UserNodes["(:User) Nodes"]
            TxEdges["[:TRANSFER] Relationships"]
            LogNodes["(:AuditLog) Nodes"]
        end
    end

    %% Connections
    UI --> VizEngines
    UI --> AuthCtx
    VizEngines --> APIClient
    APIClient -- "HTTP / REST (JSON)" --> Router
    Router --> MiddlewareStack
    MiddlewareStack --> CoreServices
    CoreServices --> Driver
    Driver -- "Bolt Protocol (neo4j+s:// encrypted)" --> GraphDB
```

---

## 2. End-to-End Data Ingestion & Analysis Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Analyst
    participant FE as Next.js Frontend
    participant API as Fastify API
    participant Ingest as Ingestion Service
    participant Neo4j as Neo4j Aura Database
    participant Fraud as Fraud Detection Engine

    Admin->>FE: Upload CSV / JSON File
    FE->>API: POST /upload-transactions (Multipart Data)
    API->>API: Verify JWT & Admin Permissions
    API->>Ingest: Parse File Stream (PapaParse / JSON Parser)
    Ingest->>Ingest: Validate Schema (from_wallet, to_wallet, amount, timestamp)
    
    rect rgb(240, 248, 255)
        note over Ingest,Neo4j: Batch Transaction Processing
        Ingest->>Neo4j: UNWIND Batch MERGE (:Wallet) Nodes
        Ingest->>Neo4j: UNWIND Batch CREATE [:TRANSFER] Edges
    end
    
    Ingest-->>API: Return Ingestion Stats (Wallets created, Edges created)
    
    rect rgb(255, 250, 240)
        note over API,Fraud: Automated Background Analysis
        API->>Fraud: Execute Cypher Fraud Pattern Queries
        Fraud->>Neo4j: Detect Cycles, Fan-Out, Fan-In, Hubs, Mixers
        Fraud->>Neo4j: Update Node Risk Scores & Pattern Labels
    end
    
    API-->>FE: HTTP 200 OK + Summary Metrics
    FE->>Admin: Re-render Interactive 2D/3D Network Graph
```

---

## 3. Fraud Pattern Detection Logic & Classification Architecture

```mermaid
flowchart LR
    subgraph Inputs["Graph Analytics Queries (Cypher)"]
        Degrees["In-Degree / Out-Degree Ratios"]
        Cycles["Cycle Detection (1 to 4 hops)"]
        Vol["Transaction Volume Percentiles"]
        Velocity["Time Delta Between Transfers"]
    end

    subgraph Detector["Detection Engine Algorithms"]
        Circular["Circular Laundering (Cycles)"]
        FanOut["Fan-Out Distribution (Scams / Airdrop Abuse)"]
        FanIn["Fan-In Funneling (Collector Wallets)"]
        Hub["Hub Wallets (High-Volume Exchanges)"]
        Mixer["Mixer / Tumbler (High In + High Out Velocity)"]
    end

    subgraph Scoring["Risk Scoring Matrix"]
        ScoreCalc["Normalized Risk Score Calculation (0 - 100)"]
    end

    subgraph Classification["Visual Badges & Filter Categories"]
        HighRisk["🔴 High Risk (70 - 100)"]
        MedRisk["🟡 Medium Risk (40 - 69)"]
        LowRisk["🟢 Low Risk (0 - 39)"]
    end

    Inputs --> Detector
    Detector --> ScoreCalc
    ScoreCalc --> Classification
```

---

## 4. Frontend Component Hierarchy & State Flow

```mermaid
graph TD
    App["Next.js App Router Root"]
    AuthProvider["<AuthProvider> (JWT & User Context)"]
    
    subgraph Pages["Application Routes"]
        DashPage["/ (Main Dashboard)"]
        GraphPage["/graph (Graph Explorer)"]
        SuspPage["/suspicious (Fraud Pattern Analysis)"]
        WalletPage["/wallet/[address] (Wallet Inspector)"]
        AdminPage["/admin/* (Uploads, Logs, Users, Settings)"]
    end

    subgraph Components["Re-usable Component Library"]
        Header["Header & Real-Time IST Clock"]
        Sidebar["Sidebar Navigation (Role-aware)"]
        Graph2D["Cytoscape2DCanvas"]
        Graph3D["ForceGraph3DCanvas"]
        PathBar["PathFinder Bar"]
        VizSettings["VizSettings Modal (Fog, Orbit, Particles)"]
    end

    App --> AuthProvider
    AuthProvider --> Pages
    GraphPage --> Header
    GraphPage --> Sidebar
    GraphPage --> Graph2D
    GraphPage --> Graph3D
    GraphPage --> PathBar
    GraphPage --> VizSettings
```

---

## 5. Database Graph Schema (Neo4j Cypher Model)

```mermaid
erDiagram
    WALLET ||--o{ TRANSFER : sends
    TRANSFER }o--|| WALLET : receives
    USER ||--o{ AUDIT_LOG : generates

    WALLET {
        string address PK
        float risk_score
        string fraud_pattern
        float total_volume
        int tx_count
    }

    TRANSFER {
        string txid PK
        float amount
        string coin_type
        int timestamp
    }

    USER {
        string username PK
        string email
        string password_hash
        string role
        boolean is_banned
    }

    AUDIT_LOG {
        string id PK
        string username FK
        string action
        int timestamp
    }
```

---

## 6. Slide-by-Slide Presentation Summary

### Slide 1: System Overview
- **Name:** DBMS — Distributed Blockchain Monitoring & Fraud Detection Platform
- **Core Stack:** Next.js 14, Fastify (Node.js), Neo4j Cloud (Aura DB), Cytoscape.js, Three.js (3D WebGL).
- **Primary Value:** Real-time visual network analysis and automated detection of crypto laundering/scam patterns.

### Slide 2: Key Architecture Highlights
- **Decoupled Architecture:** Clean separation of concerns between Next.js client, RESTful Fastify API, and Neo4j Graph Engine.
- **Dual-Mode Graph Visualization:**
  - **2D Engine:** Cytoscape.js + Cola physics for precise structure inspection.
  - **3D Engine:** Three.js WebGL renderer for high-density, large-scale network visualization.
- **Enterprise-Grade Security:** JWT authentication with role-based access control (Admin vs. Analyst), request rate-limiting, and comprehensive audit logging.

### Slide 3: Fraud Detection Capabilities
- **Circular Laundering:** Uncovers multi-hop transaction loops designed to obscure origins.
- **Fan-Out & Fan-In Detection:** Identifies rapid distribution hubs and collection wallets.
- **Mixers & Tumblers:** Pinpoints high-velocity mixing services using graph degree metrics.
- **Path Finder:** Calculates shortest transaction paths between arbitrary wallets in real time.
