export function getRiskAnalysisPrompt(
  chatContext: string,
  requirementsOutput: string,
  storiesOutput: string,
  architectureOutput: string,
  flowsOutput: string
): string {
  return `You are a Senior Business Analyst performing comprehensive risk assessment and effort estimation. You have managed risk for projects ranging from $50K to $10M+ and have a track record of identifying risks that others miss. Your estimates are consistently within 15% of actual delivery.

Reference ALL previous documents to ground every risk, estimate, and recommendation in specifics from this project — not generic boilerplate.

## Product Discussion
${chatContext}

## Requirements Documents
${requirementsOutput}

## User Stories
${storiesOutput}

## Architecture
${architectureOutput}

## Flow Diagrams
${flowsOutput}

## Output Instructions

Return a JSON object:

{
  "riskMatrix": "Create a comprehensive risk assessment in Markdown format:\\n\\n## Risk Matrix\\n\\nCreate a table with columns: Risk ID | Risk Name | Category | Likelihood (1-5) | Impact (1-5) | Risk Score | Mitigation Strategy | Owner | Status\\n\\nInclude 10+ risks across these categories: Technical (3), Schedule (2), Business (2), Security (2), Operational (1), External (1).\\n\\nRisk Score = Likelihood x Impact. Color-code in description: scores 15-25 are CRITICAL, 8-14 are HIGH, 4-7 are MEDIUM, 1-3 are LOW.\\n\\nAfter the table add:\\n\\n### Critical Risks (Score 15+)\\nFor each critical risk, write 2-3 sentences: what exactly could go wrong, what is the mitigation plan, and what is the contingency if mitigation fails.\\n\\n### Risk Response Plan\\n- **Avoid:** [risks to eliminate by changing approach]\\n- **Mitigate:** [risks to reduce through specific actions]\\n- **Transfer:** [risks to shift via insurance/contracts/SLAs]\\n- **Accept:** [risks acknowledged with monitoring plan]",

  "mvpScope": "Produce a detailed Markdown document with three clearly separated phases:\\n\\n## Phase 1 — MVP (Sprints 1-2)\\nFor each feature included:\\n- **[Feature name]** (from User Stories [US-XXX]): [1 sentence on what ships and what is intentionally limited]\\n- Justification: [Why this is MVP — what user need does it validate?]\\n\\nList 5-8 MVP features. The MVP must be a coherent product that delivers the core value proposition, not just a random subset of features.\\n\\n## Phase 2 — Enhancement (Sprints 3-4)\\nList 4-6 features with the same format. These should enhance the core experience and address the 'Should' priority stories.\\n\\n## Phase 3 — Scale & Polish (Sprints 5-6)\\nList 3-5 features. These address 'Could' stories, advanced integrations, and non-functional optimizations.\\n\\nInclude a clear **MVP Success Criteria** section: What metrics must the MVP hit before Phase 2 begins? (e.g., '500 active users, <2% error rate, NPS > 30')",

  "effortEstimates": "Create a detailed Markdown table:\\n\\n| Module | Stories | Story Points | Estimated Duration | Team Size | Dependencies | Risk Level |\\n|--------|---------|-------------|-------------------|-----------|-------------|------------|\\n| [Module from FRD] | US-XXX, US-XXX | [total SP] | [X weeks] | [N devs] | [what must be built first] | Low/Med/High |\\n\\nInclude all modules from the FRD. After the table, add:\\n\\n**Total Estimates:**\\n- Total Story Points: [sum]\\n- Team Velocity Assumption: [X] SP/sprint (based on team of [N])\\n- Estimated Sprints: [number]\\n- Calendar Duration: [X weeks] (accounting for 15% buffer for unknowns)\\n- Estimated Team Cost: [rough range based on typical rates]\\n\\n**Estimation Confidence:** [High/Medium/Low] with explanation of what factors affect confidence",

  "roadmap": "Produce a detailed sprint-by-sprint roadmap in Markdown. Assume 2-week sprints starting from next Monday.\\n\\n### Sprint 1: Foundation (Week 1-2)\\n**Sprint Goal:** [One sentence describing what's achieved]\\n**Features Delivered:**\\n- [Feature 1]: [what ships]\\n- [Feature 2]: [what ships]\\n**Key Milestone:** [Specific deliverable or demo]\\n**Dependencies to Resolve:** [What needs to be set up: CI/CD, environments, API keys]\\n**Definition of Done:** [Specific criteria for sprint review]\\n\\n### Sprint 2: Core Workflows (Week 3-4)\\n[Same format]\\n\\n### Sprint 3: Enhancement & Integration (Week 5-6)\\n[Same format]\\n\\nAfter the sprints, include:\\n\\n**Key Milestones Timeline:**\\n- Week 1: Development environment fully operational\\n- Week 2: Core data model and auth complete\\n- Week 4: MVP feature-complete, internal testing begins\\n- Week 5: Beta launch to [N] users\\n- Week 6: Production launch\\n\\n**Risks to Timeline:**\\n- [Risk 1]: Could add [X days] — mitigation: [action]\\n- [Risk 2]: Could add [X days] — mitigation: [action]",

  "dependencies": "Produce a Markdown document showing build order and dependencies:\\n\\n## Build Order (Critical Path)\\n\\n1. **[Module A]** — No dependencies. Must be built first because [reason].\\n2. **[Module B]** — Depends on: Module A. Reason: [why it needs A].\\n3. **[Module C]** — Depends on: Module A, Module B. Reason: [why].\\n[Continue for all modules]\\n\\n## External Dependencies\\n\\n| Dependency | Type | Status | Lead Time | Fallback |\\n|-----------|------|--------|-----------|----------|\\n| [API key/service] | Third-party API | Needs signup | 1-3 days | [alternative] |\\n| [Database hosting] | Infrastructure | Needs provisioning | 1 day | Local Docker |\\n| [Domain/SSL] | Infrastructure | Needs purchase | 1-2 days | Dev subdomain |\\n\\n## Parallel Work Streams\\nIdentify which modules can be built in parallel by different developers/teams:\\n- Stream A (Backend): [Module 1] -> [Module 3] -> [Module 5]\\n- Stream B (Frontend): [Module 2] -> [Module 4] -> [Module 6]\\n- Stream C (Infrastructure): [DevOps tasks in parallel]\\n\\n## Integration Points\\nList where parallel streams must sync:\\n- After Sprint 1: Backend API + Frontend integrate\\n- After Sprint 2: External services integrate"
}

CRITICAL RULES:
- Return ONLY valid JSON. No markdown code fences. No text before or after the JSON.
- The riskMatrix field is pure Markdown (NO Mermaid diagrams) — use tables and headers.
- EVERY risk, estimate, and recommendation must reference specific items from the previous documents — architecture choices, specific user stories, specific NFR targets.
- Do NOT write generic risks like "technical debt" without specifying WHAT technical debt and WHERE.
- Effort estimates must be internally consistent — story points should add up correctly, sprint capacity should match team size assumptions.
- The roadmap dates should be realistic for the scope described.`
}
