const BA_ROLE = `You are a Senior Business Analyst with 15+ years of experience delivering executive-grade documentation for Fortune 500 companies and high-growth startups. You are producing professional documentation that will be reviewed by C-level stakeholders, engineering leads, and product managers.`

const QUALITY_RULES = `
CRITICAL RULES:
- Return ONLY valid JSON. No markdown code fences. No text before or after the JSON.
- Every single field must contain substantial, specific content — minimum 100 words per field.
- Use real-world benchmarks and industry standards, not made-up numbers.
- Reference specific details from the product discussion — do not write generic boilerplate.
- Write like a human BA delivering to a paying client, not like an AI generating filler.`

export function getBRDPrompt(chatContext: string): string {
  return `${BA_ROLE}

Based on the following product discussion, generate a complete Business Requirements Document (BRD).

## Product Discussion
${chatContext}

## Output Instructions

Return a JSON object with this structure. Each field contains rich Markdown content with headers, tables, bullet lists, and bold text for emphasis. Write as if delivering to real stakeholders — use specific numbers, concrete details, named stakeholder roles, and real-world benchmarks. NEVER use generic filler like "as needed" or "to be determined."

{
  "executiveSummary": "Write a 2-3 paragraph executive summary. Paragraph 1: Market context — what industry trend or user pain point creates the opportunity. Include a specific statistic or market size reference. Paragraph 2: Value proposition — what the product does and why it wins. Paragraph 3: Expected business impact — revenue model, user acquisition target, competitive advantage.",

  "businessObjectives": "Write 4-5 SMART objectives. Each must have: a specific metric, a measurable target number, an achievable rationale, relevance to business goals, and a time-bound deadline. Format as a numbered list. Example: '1. **Acquire 10,000 active users** within 6 months of launch by targeting [specific channel], measured by monthly active user count in analytics dashboard.'",

  "stakeholderMap": "Create a Markdown table with columns: Stakeholder | Role | Key Interest | Influence Level (High/Medium/Low) | Communication Frequency. Include at minimum: Product Owner, Engineering Lead, End Users (by persona), QA Lead, Business Sponsor, and any domain-specific stakeholders. Add a brief note below the table about the RACI matrix for key decisions.",

  "scope": "Create two clearly separated sections with ## headers:\\n\\n## In Scope\\nBullet list of 8-12 specific items that WILL be built in this release. Each item should be specific enough to estimate.\\n\\n## Out of Scope\\nBullet list of 5-8 items explicitly EXCLUDED with a brief justification for each.",

  "successKPIs": "Create a Markdown table with columns: KPI | Target | Measurement Method | Review Frequency | Owner. Include 6-8 KPIs spanning: user acquisition, engagement/retention, performance, revenue, quality, and user satisfaction. Every target must be a specific number.",

  "constraintsAssumptions": "Create two sections:\\n\\n## Constraints\\nNumbered list of 5-7 hard constraints including: budget, timeline, technology mandates, regulatory requirements, team capacity. Each with specific limits.\\n\\n## Assumptions\\nNumbered list of 5-7 assumptions. Each should state what happens if the assumption proves false."
}
${QUALITY_RULES}`
}

export function getFRDPrompt(chatContext: string, brdOutput: string): string {
  return `${BA_ROLE}

Based on the product discussion and BRD below, generate a complete Functional Requirements Document (FRD).

## Product Discussion
${chatContext}

## Business Requirements Document
${brdOutput}

## Output Instructions

Return a JSON object. Each field contains rich Markdown with detailed technical specifications.

{
  "featureModules": "For each of 4-6 major feature modules, write:\\n\\n### [Module Name]\\n**Description:** 1-2 sentences.\\n**Sub-features:**\\n- [Sub-feature 1]: Brief description with user-facing behavior\\n- [Sub-feature 2]: Brief description\\n\\nModules should map to logical product areas (Authentication, Core Workflow, Dashboard/Analytics, Admin/Settings, Notifications, Integrations, etc.).",

  "inputOutputSpecs": "For each feature module, create a structured list showing: Input fields (field name, data type, required/optional, constraints), Validation rules, Output on success and failure, Concrete example of valid request/response.",

  "validationRules": "Comprehensive list of 15+ business rules organized by module. Each rule: 'RULE-001: [Module] — [Description]. Trigger: [when]. Action: [what happens].' Include edge cases.",

  "businessLogic": "Step-by-step workflows for 3-4 core processes with numbered steps, decision points (IF/THEN/ELSE), data persistence, notifications, and error handling at each step.",

  "apiContracts": "8-12 REST API endpoints organized by resource. Each with: method, path, description, auth requirements, request body JSON schema, response schemas for success and error codes, pagination for list endpoints, rate limiting notes.",

  "databaseRequirements": "6+ entities with: purpose, key fields (name, type, description), relationships (has-many, belongs-to), indexes and why, constraints (unique, not-null, foreign keys)."
}
${QUALITY_RULES}`
}

export function getNFRPrompt(chatContext: string, brdOutput: string, frdOutput: string): string {
  return `${BA_ROLE}

Based on the product discussion, BRD, and FRD below, generate a complete Non-Functional Requirements (NFR) document.

## Product Discussion
${chatContext}

## Business Requirements Document
${brdOutput}

## Functional Requirements Document
${frdOutput}

## Output Instructions

Return a JSON object. Each field contains rich Markdown with specific, measurable requirements.

{
  "performance": "## Performance Requirements\\n\\nCreate a Markdown table: Metric | Target | Measurement Method. Include: API response time (p95 < 200ms), page load (LCP < 2.5s), DB query time, concurrent users target, throughput (req/sec). Add caching strategy and CDN requirements specific to this product.",

  "security": "## Security Requirements\\n\\n### Authentication & Authorization\\nSpecific auth method, password policy, MFA requirements, RBAC roles defined.\\n\\n### Data Protection\\nEncryption at rest (AES-256), transit (TLS 1.3), PII handling, API security.\\n\\n### OWASP Top 10\\nAddress each relevant OWASP risk with specific mitigations for this product.",

  "scalability": "## Scalability Strategy\\n\\nHorizontal scaling (auto-scaling triggers, load balancer, read replicas), vertical scaling (instance sizing), data scaling (caching layers, CDN), growth targets (Month 1, 6, Year 1 with infra requirements at each tier).",

  "availability": "## Availability & Reliability\\n\\nSLA: 99.9% uptime, maintenance windows, RTO < 1 hour, RPO < 15 minutes. DR: multi-AZ, automated backups, cross-region failover. Monitoring: health checks, alerting thresholds, on-call requirements.",

  "compliance": "## Compliance & Regulatory\\n\\nIdentify ALL applicable regulations for this product's domain and geography. For each: specific requirements and technical controls. Include data retention, audit logging, right to deletion, cookie consent.",

  "accessibility": "## Accessibility (WCAG 2.1 AA)\\n\\nPerceivable (alt text, color contrast >= 4.5:1), Operable (keyboard nav, focus indicators), Understandable (form labels, error messages), Robust (valid HTML, ARIA). Testing plan: axe-core in CI + monthly manual audit."
}
${QUALITY_RULES}`
}
