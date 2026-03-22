# KimuntuX Integration Discovery Document
## Blockchain Backend → Team Platform Integration

**Author:** Allan (Blockchain Developer)
**Date:** 2026-03-20
**Branch:** Contracts
**Purpose:** Gather information needed to deploy and integrate the blockchain backend with the team's AWS infrastructure

---

## Current Status

| Component | Status |
|-----------|--------|
| Smart contracts | Deployed to Sepolia testnet |
| Blockchain service (Web3.py) | Complete, tested locally |
| FastAPI endpoints | Complete (`/api/v1/commissions/*`, `/api/v1/wallets/*`) |
| Database integration | Designed, needs team's schema |
| AWS deployment | Not started — needs Revanth's guidance |
| Auth integration | Not started — needs Revanth's patterns |

---

## Section 1: Questions for Revanth (Infrastructure Lead)

Questions are sorted **P0 (blocker)** → **P1 (needed soon)** → **P2 (nice to know)**.

### AWS Infrastructure

| Priority | Question | Why I need it |
|----------|----------|---------------|
| **P0** | How is the backend deployed? (EC2, ECS/Fargate, Lambda, Elastic Beanstalk?) | Determines my deployment target |
| **P0** | Is there a Docker image build + push pipeline? What registry? (ECR?) | I need to containerize my service the same way |
| **P0** | What VPC is the backend in? Can I deploy into the same VPC? | RDS and Redis are not publicly accessible — I must be in the same VPC |
| **P0** | What security groups does the backend use? Can my service be added to the same group, or should I create a new one? | Need DB + Redis access |
| **P1** | Is there an Application Load Balancer (ALB) or API Gateway routing to the backend? | Determines how I register my service's routes |
| **P1** | Is there a staging / development environment separate from production? | I need a safe place to test integration before going live |
| **P1** | What AWS region is everything in? | Needed for all AWS CLI/SDK calls |
| **P2** | What instance types / Fargate CPU+memory specs are used? | Helps me size my service appropriately |

### Database (PostgreSQL on RDS)

| Priority | Question | Why I need it |
|----------|----------|---------------|
| **P0** | What's the RDS endpoint (host + port)? And the database name? | Can't connect without this |
| **P0** | Should I use the same database or create a separate one? | Affects connection string and isolation |
| **P0** | How are DB credentials stored and rotated? (Secrets Manager, Parameter Store, plain env vars?) | Must use same pattern for security |
| **P0** | What's the primary key strategy for the `users` table? (UUID, auto-increment integer, something else?) | I need to FK to users from my blockchain tables |
| **P0** | What is the exact `users` table name and the column I should FK to? (e.g., `users.id`, `accounts.user_id`) | Core dependency for all my data models |
| **P0** | What migration tool do you use? (Alembic, Flyway, raw SQL, Django ORM?) | I've already set up Alembic — need to align or adapt |
| **P1** | Do you have an affiliates / affiliate_accounts table? What are its columns? | Commission records need an `affiliate_id` FK |
| **P1** | Is there any existing wallet, payment, or transaction table I should link to instead of creating new ones? | Avoid duplication |
| **P1** | What's your database naming convention? (snake_case tables? prefixes?) | Consistency — I'll match it |
| **P1** | Do I need DBA approval to create new tables, or can I run Alembic migrations directly? | Determines the migration workflow |
| **P1** | Is there a read replica I should use for read-heavy blockchain queries? | Performance |
| **P2** | What PostgreSQL version is running? | For any version-specific features |
| **P2** | What's the connection pool size limit per client? | I'll configure my asyncpg pool accordingly |

### Redis

| Priority | Question | Why I need it |
|----------|----------|---------------|
| **P0** | What's the Redis endpoint? (ElastiCache or self-hosted?) | Can't connect without this |
| **P1** | Are you using Redis for sessions, rate limiting, general caching — or all three? | I need to pick non-conflicting key prefixes |
| **P1** | Is Redis clustered or single-node? | Affects the Redis client config |
| **P2** | Any key prefix conventions? (e.g., `backend:*`, `session:*`) | I'll namespace my keys as `blockchain:*` to avoid collisions |

### Authentication & Authorization

| Priority | Question | Why I need it |
|----------|----------|---------------|
| **P0** | What auth mechanism is used? (JWT, sessions, API keys, OAuth?) | My endpoints must accept the same tokens |
| **P0** | Where is the auth validated? (Middleware? A shared library? An auth service?) | I need to plug into the same validation |
| **P0** | What does a valid JWT payload look like? What claims does it carry? (`user_id`, `role`, `affiliate_id`?) | My endpoints need to extract the calling user's identity |
| **P1** | Is there a shared auth library or package I can import? (GitHub package, internal pip package?) | Avoids reimplementing auth |
| **P1** | How are roles/permissions structured? Is there an "affiliate" role I need to check? | Commission endpoints should be affiliate-only |
| **P1** | Are there internal service-to-service API keys for backend→blockchain calls? | If Revanth's backend calls my service directly |

### CI/CD & Deployment Process

| Priority | Question | Why I need it |
|----------|----------|---------------|
| **P0** | What's the deploy process? (GitHub Actions, CodePipeline, manual scripts, other?) | I need to add my service to the pipeline |
| **P0** | Which branch triggers deployment to staging? To production? | I need to follow the same branching strategy |
| **P1** | Are there required checks before merge? (tests, linting, security scans?) | My service must pass the same gates |
| **P1** | How are environment variables / secrets deployed to the running containers? | Blockchain private keys must be handled securely |
| **P1** | How are database migrations run during deployment? (Pre-deploy hook, manual step, auto on startup?) | I need to wire Alembic into the same process |
| **P2** | Is there a `docker-compose` for local development that mirrors production? | Speeds up local integration testing |

### Logging & Monitoring

| Priority | Question | Why I need it |
|----------|----------|---------------|
| **P1** | Where do application logs go? (CloudWatch Logs, ELK, Datadog?) | I need to ship logs to the same destination |
| **P1** | What log format does the team use? (JSON structured? Plain text? What fields?) | I'll standardize my log format to match |
| **P1** | Is there an error tracking service? (Sentry DSN, Rollbar?) | I should use the same Sentry project |
| **P1** | Are there CloudWatch alarms or dashboards I should extend? | My blockchain health metrics should appear alongside existing metrics |
| **P2** | What's the on-call rotation? Who gets paged if the blockchain service goes down? | Operational knowledge |

---

## Section 2: Access I Need (from Revanth)

- [ ] **AWS Console access** — at minimum, read access to ECS/EC2, RDS, ElastiCache, CloudWatch in the team's account
- [ ] **RDS credentials** — a database user with `CREATE TABLE`, `INSERT`, `SELECT`, `UPDATE` rights (staging first, production later)
- [ ] **Redis endpoint + auth** — host, port, password (if any)
- [ ] **ECR repository** — push rights to the container registry so I can deploy my image
- [ ] **Staging environment** — a URL where I can test integration before production
- [ ] **Existing `.env` or Secrets Manager paths** — so I know which keys already exist and can add mine alongside them
- [ ] **Team's backend repository access** — to read the database models and API conventions directly rather than asking

---

## Section 3: Documentation to Request

1. **Architecture diagram** — AWS VPC layout, services, traffic flow
2. **Database schema** — Full ERD or at minimum the `users`/`affiliates`/`transactions` table definitions
3. **API spec** — OpenAPI/Swagger for the existing backend (so I can match URL structure, auth headers, response shapes)
4. **Auth flow diagram** — How a request is authenticated end-to-end
5. **Deployment runbook** — Steps to deploy a new service or add to existing service
6. **Environment variable list** — All env vars the current backend uses (names, not values)

---

## Section 4: Architecture Template (Fill In)

```
AWS Account: _______________
Region:      _______________

VPC
└── Private Subnet(s)
    ├── Backend Service
    │   ├── Type: [ ] EC2  [ ] ECS/Fargate  [ ] Lambda
    │   ├── Image registry: _______________
    │   ├── Number of instances/tasks: ___
    │   └── Listening port: ___
    │
    ├── Blockchain Service (MINE — to be added)
    │   ├── Same cluster? [ ] Yes  [ ] No — separate cluster: ___
    │   └── Port: 8000
    │
    ├── PostgreSQL (RDS)
    │   ├── Endpoint: _______________
    │   ├── Port: 5432
    │   ├── Database name: _______________
    │   └── Credentials via: [ ] Secrets Manager  [ ] Parameter Store  [ ] .env
    │
    └── Redis
        ├── Endpoint: _______________
        ├── Port: 6379
        └── Type: [ ] ElastiCache  [ ] Self-hosted  [ ] External

Load Balancer / API Gateway
├── Type: [ ] ALB  [ ] API Gateway  [ ] None
├── Backend routes: /api/*  → backend service
└── Blockchain routes: /api/v1/commissions/*  → blockchain service (or same backend?)
         /api/v1/wallets/*     →

CI/CD
├── Pipeline: _______________
├── Deploy trigger branch: _______________
└── Migration step: _______________

Logging
├── Destination: [ ] CloudWatch  [ ] ELK  [ ] Datadog  [ ] Other: ___
└── Format: [ ] JSON  [ ] Plain text

Error Tracking
└── Service: [ ] Sentry  [ ] Rollbar  [ ] None  DSN: _______________
```

---

## Section 5: Integration Strategy Recommendations

### Microservice vs Integrated Module

**Recommendation: Separate microservice deployed alongside the backend.**

| Factor | Separate Service | Integrated |
|--------|-----------------|------------|
| Web3 singleton isolation | ✅ No cross-contamination | ❌ Shared process, shared state |
| Independent scaling | ✅ Blockchain is I/O-bound | ❌ Must scale together |
| Independent deployment | ✅ Can redeploy blockchain without touching Revanth's service | ❌ Coupled deploys |
| Database sharing | ✅ Both can connect to the same RDS | ✅ Same |
| Blockchain private key isolation | ✅ Only blockchain service holds the key | ❌ Main service process has access |

The existing code in this repo is **already structured as a standalone FastAPI service**. The right move is to deploy it as a second ECS task (or EC2 instance) in the same VPC, routed via the load balancer.

### Handling Async Blockchain with Sync API

Blockchain transactions take 15–60+ seconds to confirm. Strategy:

1. **Immediate response (202 Accepted)** — endpoints already do this, returning `tx_hash` immediately
2. **Database persistence** — write a `pending` record to DB on submission so state survives restarts
3. **Background confirmation** — a FastAPI `BackgroundTask` polls `wait_for_receipt()` and updates the DB record
4. **Status polling endpoint** — callers check `GET /api/v1/commissions/tx/{tx_hash}/status` to get confirmation

This is already half-implemented. The missing pieces are the DB persistence layer and background task.

### Blockchain-to-Database Consistency Pattern

**Recommendation: Dual Write (Option C) with outbox pattern.**

```
Request arrives
│
├─► Write PENDING record to DB (with transaction_id for idempotency)
│
├─► Submit to blockchain → get tx_hash
│
├─► Update DB record with tx_hash (still PENDING)
│
└─► Background task polls blockchain → update DB to CONFIRMED or FAILED
```

Why not Option A (DB as cache) or Option B (DB as primary):
- Option A: Too many RPC calls; expensive and slow for reads
- Option B: Blockchain is the settlement layer — it must be the final arbiter
- Option C: DB gives fast reads; blockchain gives finality. The `transaction_id` field prevents duplicate submissions even if the process crashes between steps.

---

## Section 6: My Blockchain Service Environment Variables (To Add to Team's .env / Secrets Manager)

```bash
# Blockchain: RPC Providers
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<KEY>
SEPOLIA_RPC_FALLBACK=https://sepolia.infura.io/v3/<KEY>

# Blockchain: Platform Wallet (⚠️ HIGH SENSITIVITY — use Secrets Manager)
PLATFORM_PRIVATE_KEY=<64-char-hex>
PLATFORM_ADDRESS=<0x address>

# Blockchain: Contract Addresses
COMMISSION_CONTRACT_ADDRESS=<0x address>
WALLET_CONTRACT_ADDRESS=<0x address>

# Blockchain: Gas Config (sensible defaults, tunable)
GAS_LIMIT_BUFFER=1.2
MAX_GAS_PRICE_GWEI=100
TRANSACTION_TIMEOUT_SECONDS=180

# These should already exist in team's config — blockchain service reuses them:
DATABASE_URL=postgresql+asyncpg://user:pass@rds-endpoint:5432/kimuntux_db
REDIS_URL=redis://elasticache-endpoint:6379/0
```

---

*Fill in the architecture template above after meeting with Revanth. Updated version should be committed to this branch.*
