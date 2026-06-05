export function getFlowDiagramsPrompt(
  chatContext: string,
  requirementsOutput: string,
  storiesOutput: string,
  architectureOutput: string
): string {
  return `You are a Senior Business Analyst creating detailed product and data flow diagrams. You excel at visualizing complex systems in ways that both technical and non-technical stakeholders can understand. Reference the architecture and user stories for accuracy — every participant, service, and data store in your diagrams must match what was defined in the architecture.

## Product Discussion
${chatContext}

## Requirements Documents
${requirementsOutput}

## User Stories
${storiesOutput}

## Architecture
${architectureOutput}

## Output Instructions

Generate 3 distinct diagrams that show how the system works from different perspectives. Each diagram must be specific to THIS product — not a generic template.

Return a JSON object:

{
  "userJourney": "A Mermaid journey diagram following the EXACT rules below",
  "apiSequence": "A Mermaid sequenceDiagram following the EXACT rules below",
  "dataFlow": "A Mermaid flowchart TD diagram following the EXACT rules below",
  "descriptions": {
    "userJourney": "CONCISE — 2 to 3 sentences only. Name the highest- and lowest-satisfaction moments and the single highest-leverage improvement. Do NOT write multiple paragraphs.",
    "apiSequence": "CONCISE — 2 to 3 sentences only. Why this flow/pattern was chosen and how the main error path is handled. Do NOT write multiple paragraphs.",
    "dataFlow": "CONCISE — 2 to 3 sentences only. Trace how data enters, transforms, is stored, and returns, plus the main error path. Do NOT write multiple paragraphs."
  }
}

## MERMAID DIAGRAM RULES — FOLLOW EXACTLY:

### User Journey (journey):

Produce a valid Mermaid journey diagram with ALL of the following:

1. Start with: journey
2. Add a title: title [Descriptive title for the primary user flow]

3. **3 to 4 sections** representing phases of the user's interaction:
   - Section names should be product-specific (e.g., "Discovery", "Registration", "First Purchase", "Ongoing Use")
   - NOT generic labels like "Phase 1", "Phase 2"

4. **2-3 tasks per section** with satisfaction scores (1-5):
   - Format: [Short task label]: [score]: [Actor]
   - Keep each task label SHORT — 2 to 4 words MAX (e.g. "Sign up", "Verify email", "First swap"). Long labels overflow the journey boxes and overlap each other.
   - Scores should realistically vary — not all 5s:
     - 5 = Delightful, exceeds expectations
     - 4 = Smooth, meets expectations
     - 3 = Acceptable, minor friction
     - 2 = Frustrating, notable friction
     - 1 = Broken or very painful
   - At least 2 tasks should score 2-3 to show realistic pain points
   - Actor should be the primary user persona name

5. **8 to 10 tasks total, MAX** — too many tasks cram the journey diagram and cause the labels to overlap and spill out of the boxes

6. **Story arc:** The journey should tell a realistic story — initial excitement, some friction during setup, satisfaction during core use, potential drop-off points

### API Sequence (sequenceDiagram):

Produce a valid Mermaid sequenceDiagram with ALL of the following:

1. Start with: sequenceDiagram

2. **Minimum 6 participants** using descriptive names:
   - participant Client as Web Browser
   - participant Gateway as API Gateway
   - participant Auth as Auth Service
   - participant Main as [Product-specific Service Name]
   - participant DB as PostgreSQL
   - participant Cache as Redis Cache
   - participant External as [Specific External Service]
   - Participant names must match the architecture diagram

3. **Show the complete flow** for the product's PRIMARY use case (the most important user story):
   - Include authentication check at the start
   - Show request validation
   - Show business logic execution
   - Show data persistence
   - Show response construction
   - Show cache interactions where relevant

4. **Use these features:**
   - activate/deactivate for service lifetimes
   - Note right of [participant]: [annotation] for important details (minimum 3 notes)
   - alt/else blocks for error handling (minimum 1 alt block showing error path)
   - opt blocks for optional steps (minimum 1 opt block)
   - Return arrows (-->>): use dashed arrows for responses

5. **Minimum 20 messages** (arrows) in the sequence

6. **Show realistic error handling:**
   - What happens when auth fails?
   - What happens when validation fails?
   - What happens when the database is unavailable?

### Data Flow (flowchart TD):

Produce a valid Mermaid flowchart TD (top-down) diagram with ALL of the following:

1. Start with: flowchart TD

2. **Minimum 10 nodes** with descriptive IDs:
   - Use different shapes for different types:
     - [/User Input/] — parallelogram for inputs
     - [Validation] — rectangle for processes
     - {Decision Point} — diamond for decisions
     - [(Database)] — cylinder for data stores
     - [[Queue/Buffer]] — subroutine for async processing
     - ([Cache]) — stadium for caches
   - Node IDs should be descriptive: user_input, validate_req, check_auth, query_db, etc.

3. **Label EVERY edge** with the data format or action:
   - user_input -->|"JSON payload"| validate_req
   - validate_req -->|"validated data"| check_auth
   - check_auth -->|"JWT token"| auth_result
   - Edges should describe WHAT data moves, not just that data moves

4. **Include decision nodes** (minimum 2):
   - {Auth Valid?} -->|"Yes"| proceed
   - {Auth Valid?} -->|"No"| error_response

5. **Show the complete data lifecycle:**
   - Data entry point (user action or API call)
   - Input validation and sanitization
   - Authentication/authorization check
   - Business logic processing
   - Data persistence
   - Cache update
   - Response formatting
   - Delivery to user

6. **Include error/retry paths:**
   - At least one error path showing how failures are handled
   - Show retry logic if applicable (e.g., for external API calls)

7. **Style classes** (add at the end):
   - classDef input fill:#E3F2FD,stroke:#1565C0,color:#000
   - classDef process fill:#E8F5E9,stroke:#2E7D32,color:#000
   - classDef decision fill:#FFF3E0,stroke:#E65100,color:#000
   - classDef storage fill:#FCE4EC,stroke:#AD1457,color:#000
   - classDef error fill:#FFEBEE,stroke:#C62828,color:#000
   - Apply classes to nodes: class user_input input

## EXAMPLE of valid journey diagram string:

journey\n    title User Registration Flow\n    section Discovery\n      Visit landing page: 5: User\n      Read product features: 4: User\n      Click Sign Up: 5: User\n    section Registration\n      Fill registration form: 3: User\n      Verify email address: 4: User\n      Complete onboarding: 4: User\n    section First Use\n      Explore dashboard: 5: User\n      Create first item: 4: User\n      Invite team member: 3: User

## EXAMPLE of valid sequenceDiagram string:

sequenceDiagram\n    participant C as Client\n    participant GW as API Gateway\n    participant Auth as Auth Service\n    participant Svc as Core Service\n    participant DB as Database\n    participant Cache as Redis\n    C->>GW: POST /api/orders\n    GW->>Auth: Validate JWT\n    Auth-->>GW: Token valid\n    GW->>Svc: Forward request\n    activate Svc\n    Svc->>Cache: Check cached data\n    Cache-->>Svc: Cache miss\n    Svc->>DB: Query data\n    DB-->>Svc: Results\n    Svc->>Cache: Update cache\n    Svc->>DB: Insert order\n    DB-->>Svc: Confirmed\n    deactivate Svc\n    Svc-->>GW: 201 Created\n    GW-->>C: Order response\n    Note right of Svc: Async notification\n    Svc-)Notify: Send confirmation\n    alt Payment fails\n        Svc-->>GW: 402 Payment Required\n        GW-->>C: Error response\n    end

## EXAMPLE of valid flowchart LR string:

flowchart TD\n    input[/User Request/]\n    validate[Validate Input]\n    auth{Auth Valid?}\n    process[Process Request]\n    db[(Database)]\n    cache([Cache])\n    response[/Response/]\n    err[/Error Response/]\n    input -->|"JSON"| validate\n    validate -->|"valid"| auth\n    validate -->|"invalid"| err\n    auth -->|"Yes"| process\n    auth -->|"No"| err\n    process -->|"query"| db\n    process -->|"check"| cache\n    db -->|"result"| process\n    process -->|"200 OK"| response\n    classDef input fill:#E3F2FD,stroke:#1565C0,color:#000\n    classDef process fill:#E8F5E9,stroke:#2E7D32,color:#000\n    classDef decision fill:#FFF3E0,stroke:#E65100,color:#000\n    classDef storage fill:#FCE4EC,stroke:#AD1457,color:#000\n    classDef error fill:#FFEBEE,stroke:#C62828,color:#000\n    class input,response input\n    class validate,process process\n    class auth decision\n    class db,cache storage\n    class err error

CRITICAL RULES:
- Return ONLY valid JSON. No markdown code fences. No text before or after the JSON.
- Node and edge labels must be PLAIN text: letters, numbers, and spaces ONLY. NEVER put parentheses, slashes, brackets, quotes, or colons inside a label — write "Web Push FCM" not "Web Push (FCM)". Special characters inside labels are the #1 cause of broken diagrams.
- Mermaid code must be a plain string with \\n for newlines (no \`\`\`mermaid fences).
- Use \\n for line breaks within the Mermaid string — do NOT use actual newlines inside JSON string values.
- Service names in diagrams MUST match the architecture diagram from the previous call.
- Every diagram must be specific to THIS product — not a generic template.
- All participants must be declared before use in sequenceDiagram, all node IDs must be consistent.`
}
