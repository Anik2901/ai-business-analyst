# Mermaid Diagram Rules

Five diagrams across the Architecture and Flow-Diagram documents. Keep every diagram **valid** and **specific to the product** (never a generic template). Node IDs must be consistent (define `auth_svc`, reference `auth_svc`). Every `subgraph` closes with `end`. Quote edge labels containing spaces. Prefer a smaller correct diagram over a large broken one.

---

## Architecture Diagram — `graph TD`

- **5 subgraphs:** `Client Layer`, `API Layer`, `Service Layer`, `Data Layer`, `External Services`.
- **≥ 12 nodes**, snake_case IDs. Shapes: `[Service]` rectangle · `[(Database)]` cylinder · `{{External}}` hexagon · `(Cache)` rounded.
- **Every edge labeled** with the interaction (`-->|"REST/JSON"|`, `-->|"JWT validation"|`, `-->|"SQL queries"|`).
- Include: CDN/static host, load balancer/API gateway, auth service, ≥ 2 product-specific business services, primary DB, cache, file/object storage (if relevant), ≥ 2 external integrations, message queue/event bus (if relevant).
- **classDef** at the end and apply with `class`:
  - `classDef frontend fill:#42A5F5,stroke:#1565C0,color:#fff`
  - `classDef backend fill:#66BB6A,stroke:#2E7D32,color:#fff`
  - `classDef database fill:#FFA726,stroke:#E65100,color:#fff`
  - `classDef external fill:#AB47BC,stroke:#6A1B9A,color:#fff`

```mermaid
graph TD
    subgraph Client_Layer["Client Layer"]
        web_app[Web Application]
        mobile_app[Mobile App]
    end
    subgraph API_Layer["API Layer"]
        cdn[CDN / Static Host]
        api_gw[API Gateway]
        lb[Load Balancer]
    end
    subgraph Service_Layer["Service Layer"]
        auth_svc[Auth Service]
        core_svc[Core Service]
        notify_svc[Notification Service]
    end
    subgraph Data_Layer["Data Layer"]
        main_db[(PostgreSQL)]
        redis_cache(Redis Cache)
        s3_storage[(S3 Storage)]
    end
    subgraph External["External Services"]
        stripe{{Stripe}}
        email{{SendGrid}}
    end
    web_app -->|"HTTPS"| cdn
    cdn -->|"API calls"| lb
    mobile_app -->|"REST/JSON"| lb
    lb -->|"Route"| api_gw
    api_gw -->|"JWT check"| auth_svc
    api_gw -->|"Business logic"| core_svc
    core_svc -->|"SQL queries"| main_db
    core_svc -->|"Cache R/W"| redis_cache
    core_svc -->|"File upload"| s3_storage
    core_svc -->|"Payment"| stripe
    notify_svc -->|"Email"| email
    core_svc -->|"Events"| notify_svc
    classDef frontend fill:#42A5F5,stroke:#1565C0,color:#fff
    classDef backend fill:#66BB6A,stroke:#2E7D32,color:#fff
    classDef database fill:#FFA726,stroke:#E65100,color:#fff
    classDef external fill:#AB47BC,stroke:#6A1B9A,color:#fff
    class web_app,mobile_app frontend
    class auth_svc,core_svc,notify_svc,api_gw,lb backend
    class main_db,redis_cache,s3_storage database
    class stripe,email,cdn external
```

## Database Schema — `erDiagram`

- **≥ 6 entities**, UPPER_CASE singular names. Each: `id` PK, `created_at`/`updated_at` timestamps, 3–8 domain fields. Types: string, int, uuid, timestamp, boolean, text, decimal, jsonb.
- **Relationships with cardinality + a label:** `||--o{` one-to-zero-or-many · `||--|{` one-to-one-or-many · `}o--o{` many-to-many · `||--||` one-to-one. e.g. `USER ||--o{ ORDER : "places"`.
- Include: a User/Account entity with auth fields, ≥ 2 core domain entities, a junction table if any M:N exists, an audit/activity-log entity, a config/settings entity.

```mermaid
erDiagram
    USER {
        uuid id PK
        string email
        string password_hash
        string name
        timestamp created_at
        timestamp updated_at
    }
    ORDER {
        uuid id PK
        uuid user_id FK
        decimal total
        string status
        timestamp created_at
    }
    USER ||--o{ ORDER : "places"
```

## User Journey — `journey`

- `title` + **≥ 4 product-specific sections** (e.g. Discovery, Registration, First Use — not "Phase 1").
- **4–6 tasks per section**, format `Task: score: Actor` (score 1–5). **≥ 16 tasks total.** Scores must vary realistically; **≥ 2 tasks score 2–3** to show real pain points. Actor = the primary persona.
- Tells a real arc: initial excitement → setup friction → core-use satisfaction → drop-off points.

```mermaid
journey
    title User Registration Flow
    section Discovery
      Visit landing page: 5: User
      Read product features: 4: User
      Click Sign Up: 5: User
    section Registration
      Fill registration form: 3: User
      Verify email address: 4: User
      Complete onboarding: 4: User
    section First Use
      Explore dashboard: 5: User
      Create first item: 4: User
      Invite team member: 3: User
```

## API Sequence — `sequenceDiagram`

- **≥ 6 participants** with descriptive names (Client, API Gateway, Auth, [product service], DB, Cache, External) — names must match the architecture diagram.
- Show the PRIMARY use case end-to-end: auth check → validation → business logic → persistence → response, plus cache interactions.
- Use `activate`/`deactivate`, **≥ 3 `Note right of`** annotations, **≥ 1 `alt`** error block, **≥ 1 `opt`** block, dashed `-->>` returns. **≥ 20 messages.** Show auth-fail / validation-fail / DB-unavailable handling.

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant Auth as Auth Service
    participant Svc as Core Service
    participant DB as Database
    participant Cache as Redis
    C->>GW: POST /api/orders
    GW->>Auth: Validate JWT
    Auth-->>GW: Token valid
    GW->>Svc: Forward request
    activate Svc
    Svc->>Cache: Check cached data
    Cache-->>Svc: Cache miss
    Svc->>DB: Query data
    DB-->>Svc: Results
    Svc->>DB: Insert order
    DB-->>Svc: Confirmed
    deactivate Svc
    Svc-->>GW: 201 Created
    GW-->>C: Order response
    Note right of Svc: Async notification
    alt Payment fails
        Svc-->>GW: 402 Payment Required
        GW-->>C: Error response
    end
```

## Data Flow — `flowchart TD` (top-down, reads like a real flow)

- **≥ 10 nodes**, descriptive IDs. Shapes: `[/Input/]` parallelogram · `[Process]` rectangle · `{Decision}` diamond · `[(Database)]` cylinder · `[[Queue]]` subroutine · `([Cache])` stadium.
- **Label every edge** with the data/action (`-->|"JSON payload"|`). **≥ 2 decision nodes.** Show the full lifecycle: entry → validation → auth → business logic → persistence → cache → response, plus ≥ 1 error/retry path.
- Same `classDef` styling (input/process/decision/storage/error) applied with `class`.

```mermaid
flowchart TD
    input[/User Request/]
    validate[Validate Input]
    auth{Auth Valid?}
    process[Process Request]
    db[(Database)]
    cache([Cache])
    response[/Response/]
    err[/Error Response/]
    input -->|"JSON"| validate
    validate -->|"valid"| auth
    validate -->|"invalid"| err
    auth -->|"Yes"| process
    auth -->|"No"| err
    process -->|"query"| db
    process -->|"check"| cache
    db -->|"result"| process
    process -->|"200 OK"| response
    classDef input fill:#E3F2FD,stroke:#1565C0,color:#000
    classDef process fill:#E8F5E9,stroke:#2E7D32,color:#000
    classDef decision fill:#FFF3E0,stroke:#E65100,color:#000
    classDef storage fill:#FCE4EC,stroke:#AD1457,color:#000
    classDef error fill:#FFEBEE,stroke:#C62828,color:#000
    class input,response input
    class validate,process process
    class auth decision
    class db,cache storage
    class err error
```
