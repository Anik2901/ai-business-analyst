# Document Structures

The exact required content for each of the 7 documents. Generate in order; each must stay consistent with the earlier ones. Output clean Markdown (tables, headers, bullets, bold). Diagrams follow [`diagrams.md`](diagrams.md).

> Quality bar for **every** field: specific (no "TBD"/boilerplate), real industry benchmarks (not invented stats), ~100+ words of substance, traceable to the intake or an earlier doc. Mark anything inferred as `[Assumption]` / `[Recommended]`.

---

## 1. BRD — Business Requirements Document

- **Executive Summary** — 2–3 paragraphs: (1) market context + a real statistic/market-size reference, (2) value proposition and why it wins, (3) expected business impact (revenue model, acquisition target, competitive advantage).
- **Business Objectives** — 4–5 **SMART** objectives, numbered. Each: specific metric, measurable target number, achievable rationale, relevance, time-bound deadline. e.g. "**Acquire 10,000 active users** within 6 months via [channel], measured by MAU."
- **Stakeholder Map** — Markdown table: `Stakeholder | Role | Key Interest | Influence (High/Med/Low) | Communication Frequency`. Include Product Owner, Engineering Lead, End Users (per persona), QA Lead, Business Sponsor, + domain-specific. Add a short RACI note.
- **Scope** — `## In Scope` (8–12 specific, estimable items) and `## Out of Scope` (5–8 excluded items, each with a one-line justification).
- **Success KPIs** — table: `KPI | Target | Measurement Method | Review Frequency | Owner`. 6–8 KPIs across acquisition, engagement/retention, performance, revenue, quality, satisfaction. Every target a specific number.
- **Constraints & Assumptions** — `## Constraints` (5–7 hard limits: budget, timeline, tech mandates, regulatory, capacity) and `## Assumptions` (5–7, each stating what happens if it proves false).

## 2. FRD — Functional Requirements Document

- **Feature Modules** — 4–6 modules, each: `### [Module]`, description, sub-features with user-facing behavior. Map to logical areas (Auth, Core Workflow, Dashboard/Analytics, Admin/Settings, Notifications, Integrations).
- **Input/Output Specs** — per module: input fields (name, type, required/optional, constraints), validation rules, success/failure outputs, a concrete valid request/response example.
- **Validation Rules** — 15+ rules by module: `RULE-001: [Module] — [desc]. Trigger: [when]. Action: [what].` Include edge cases.
- **Business Logic** — step-by-step workflows for 3–4 core processes: numbered steps, IF/THEN/ELSE decision points, data persistence, notifications, error handling.
- **API Contracts** — 8–12 REST endpoints by resource: method, path, description, auth, request body schema, success + error response schemas, pagination for lists, rate-limit notes.
- **Database Requirements** — 6+ entities: purpose, key fields (name/type/desc), relationships (has-many/belongs-to), indexes (and why), constraints (unique/not-null/FK).

## 3. NFR — Non-Functional Requirements

Each section with concrete, measurable targets:
- **Performance** — table `Metric | Target | Measurement`: API p95 < 200ms, LCP < 2.5s, DB query time, concurrent-users target, throughput; + caching/CDN strategy.
- **Security** — Authentication & Authorization (method, password policy, MFA, RBAC roles); Data Protection (AES-256 at rest, TLS 1.3 in transit, PII handling); OWASP Top 10 mitigations specific to the product.
- **Scalability** — horizontal (auto-scaling triggers, LB, read replicas), vertical (instance sizing), data (caching, CDN), growth targets at Month 1 / 6 / Year 1 with infra per tier.
- **Availability** — SLA 99.9%, maintenance windows, RTO < 1h, RPO < 15m, multi-AZ DR, automated backups, monitoring + alerting thresholds.
- **Compliance** — identify ALL regulations for the domain/geography; per regulation: requirements + technical controls (retention, audit logging, right-to-deletion, consent).
- **Accessibility** — WCAG 2.1 AA: Perceivable (alt text, contrast ≥ 4.5:1), Operable (keyboard, focus), Understandable (labels, errors), Robust (valid HTML, ARIA); testing plan (axe-core in CI + manual audits).

## 4. User Stories

Grouped into **epics** (each maps to an FRD module). Output JSON-like structure with: epic `name`, `description`, and `stories[]` where each story has `id` (US-001…), `role` (specific persona, never "user"), `action` (single atomic action — split on "and"), `benefit` (measurable), `acceptanceCriteria[]`, `priority`, `storyPoints`.

**Rules:**
- ≥ 5 epics covering all FRD modules; 3–6 stories each; **≥ 20 stories total**; include a cross-cutting epic (errors/notifications/admin).
- Acceptance criteria: **Given/When/Then**, ≥ 3 per story, including a happy path, a validation/error path, and an edge case. One sentence each, plain ASCII.
- **MoSCoW distribution:** Must ~55–65%, Should ~20–25%, Could ~10–15%, Won't ~5% (still documented).
- **Story points (modified Fibonacci):** 1 trivial · 2 simple · 3 standard · 5 complex · 8 very complex · 13 split-further (flag it). Based on complexity + uncertainty, not just effort.
- Also include ≥ 2 error/edge stories, ≥ 1 admin, ≥ 1 NFR-driven (perf/security/a11y), ≥ 1 import/export or reporting.

## 5. Architecture

- **Tech Stack** — Markdown by layer (Frontend, Backend, Database, Infrastructure, Third-Party). Each choice justified against a specific NFR or story; include an "Alternatives Considered" note for the 2–3 most critical choices.
- **Architecture Diagram** — Mermaid `graph TD` (see [`diagrams.md`](diagrams.md)).
- **Database Schema** — Mermaid `erDiagram` (see [`diagrams.md`](diagrams.md)).
- **Description** — 2–3 paragraphs: the architectural pattern chosen and why for *this* product; how it meets the key NFRs; trade-offs and what changes at 10× scale.

## 6. Flow Diagrams

- **User Journey** — Mermaid `journey`; **API Sequence** — Mermaid `sequenceDiagram`; **Data Flow** — Mermaid `flowchart TD`. Rules + examples in [`diagrams.md`](diagrams.md).
- **Descriptions** — for each diagram, a **concise** 2–3 sentence explanation (highest/lowest-satisfaction moment + biggest improvement for the journey; why-this-pattern + main error path for the sequence; how data enters/transforms/stores/returns + main error path for data flow). Do not write multi-paragraph walls.

## 7. Risk Analysis (Markdown only — no diagrams)

- **Risk Matrix** — table `Risk ID | Name | Category | Likelihood (1-5) | Impact (1-5) | Score | Mitigation | Owner | Status`. 10+ risks across Technical (3), Schedule (2), Business (2), Security (2), Operational (1), External (1). Score = L×I (15–25 CRITICAL, 8–14 HIGH, 4–7 MEDIUM, 1–3 LOW). Then `### Critical Risks` (2–3 sentences each) and a `### Risk Response Plan` (Avoid / Mitigate / Transfer / Accept).
- **MVP Scope** — 3 phases. Phase 1 MVP (5–8 features, each tied to US-IDs + justification + success criteria like "500 users, <2% error rate, NPS > 30"); Phase 2 Enhancement (4–6, the "Should" stories); Phase 3 Scale & Polish (3–5, "Could" + NFR optimizations).
- **Effort Estimates** — table `Module | Stories | Story Points | Duration | Team Size | Dependencies | Risk`. Then totals: total SP, velocity assumption, sprints, calendar duration (+15% buffer), rough cost range, confidence + factors.
- **Roadmap** — sprint-by-sprint (2-week sprints): per sprint goal, features delivered, key milestone, dependencies to resolve, definition of done. Then a milestones timeline + risks-to-timeline with day impacts.
- **Dependencies** — Build Order / critical path (numbered, with reasons), External Dependencies table (`Dependency | Type | Status | Lead Time | Fallback`), parallel work streams, integration sync points.

**Consistency:** effort must be internally consistent (story points add up, sprint capacity matches team size); every risk/estimate references specific items from earlier docs.
