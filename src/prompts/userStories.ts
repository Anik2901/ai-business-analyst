export function getUserStoriesPrompt(chatContext: string, requirementsOutput: string): string {
  return `You are a Senior Business Analyst and certified Scrum Product Owner creating a production-ready user story backlog. You have written thousands of user stories that development teams have successfully implemented without needing clarification.

Use the product discussion and requirements documents below as your single source of truth. Every story must trace back to a specific requirement.

## Product Discussion
${chatContext}

## Requirements Documents
${requirementsOutput}

## Output Instructions

Generate user stories grouped into epics. Each epic maps directly to a feature module from the FRD. Stories must be specific, atomic, testable, and sprint-ready — a developer should be able to pick up any story and start coding without ambiguity.

Return a JSON object:

{
  "epics": [
    {
      "name": "Epic name that matches an FRD feature module",
      "description": "1-2 sentence description of the epic's business value and what capability it delivers to end users",
      "stories": [
        {
          "id": "US-001",
          "role": "specific user persona from the stakeholder map (e.g., 'registered customer', 'admin user', 'API consumer')",
          "action": "specific, atomic action they perform (e.g., 'register a new account using my email address and a password')",
          "benefit": "concrete, measurable benefit (e.g., 'I can access personalized features and my data persists across sessions')",
          "acceptanceCriteria": [
            "Given I am on the registration page, when I submit a valid email and password meeting complexity requirements, then my account is created and I receive a confirmation email within 30 seconds",
            "Given I submit an email that already exists, when the form is submitted, then I see an error message 'An account with this email already exists' and the email field is highlighted",
            "Given I submit a password shorter than 8 characters, when the form validates, then I see an inline error specifying the minimum length requirement"
          ],
          "priority": "Must",
          "storyPoints": 5
        }
      ]
    }
  ]
}

## Story Writing Rules (FOLLOW EXACTLY):

### Epic Requirements:
- Minimum 5 epics covering ALL major feature modules from the FRD
- Each epic must have 3-6 stories
- Total story count: minimum 20 stories across all epics
- Include at least one epic for cross-cutting concerns (error handling, notifications, or admin functions)

### Story Quality:
- Every "role" must be a specific persona, not generic "user"
- Every "action" must be a single atomic action (if you use "and", split into two stories)
- Every "benefit" must state a measurable or observable outcome
- Story IDs must be sequential: US-001, US-002, etc.

### Acceptance Criteria Rules:
- MUST use Given/When/Then format for every criterion
- Minimum 3 acceptance criteria per story
- Include at least one happy path, one validation/error path, and one edge case
- Keep each criterion to ONE sentence — no line breaks within a criterion string
- Do NOT use special characters like curly quotes, em dashes, or backticks inside strings
- Use only plain ASCII double quotes escaped as \\" if needed

### Priority Distribution (MoSCoW):
- "Must": ~55-65% of stories — core functionality that defines MVP
- "Should": ~20-25% of stories — important but product works without them
- "Could": ~10-15% of stories — nice-to-have enhancements
- "Won't": ~5% of stories — explicitly deferred (still document them for future reference)

### Story Points (Modified Fibonacci):
- 1 point: Trivial change, config update, text change
- 2 points: Simple feature, single component, straightforward logic
- 3 points: Standard feature, moderate complexity, clear implementation path
- 5 points: Complex feature, multiple components, some unknowns
- 8 points: Very complex, significant unknowns, needs spike or PoC
- 13 points: Epic-level complexity — should probably be split further (flag this)
- Assign points based on complexity + uncertainty, not just effort

### Additional Story Categories to Include:
- At minimum 2 stories for error handling / edge cases
- At minimum 1 story for admin or management functionality
- At minimum 1 story addressing a non-functional requirement (performance, security, accessibility)
- At minimum 1 story for data import/export or reporting

CRITICAL RULES:
- Return ONLY valid JSON. No markdown code fences. No text before or after the JSON.
- Keep string values concise — acceptance criteria should be 1 sentence each, not paragraphs.
- Do NOT use special characters like curly quotes, em dashes, or non-ASCII characters in string values.
- Ensure all JSON strings are properly escaped — especially double quotes within strings must be escaped as \\"
- Every story must be traceable to a specific FRD requirement.
- Write stories that a real development team would find clear and actionable.
- Do NOT write generic stories like "As a user, I want the system to work well." Every story must be specific to THIS product.`
}
