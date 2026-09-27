/**
 * Curated developer & engineering prompt templates for NexAI Prompt Vault.
 * Each template includes dynamic {{variable}} placeholders ready for one-click variable filling.
 */

export const PROMPT_CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'development', label: 'Development' },
  { id: 'architecture', label: 'Architecture & DB' },
  { id: 'debugging', label: 'Debugging & Security' },
  { id: 'documentation', label: 'Documentation' },
];

export const STARTER_PROMPTS = [
  {
    _id: 'starter-code-review',
    isStarter: true,
    title: 'Senior Code Reviewer',
    category: 'development',
    description: 'Thorough, constructive review focusing on edge cases, security, performance, and clean code principles.',
    variables: ['language', 'code', 'focus_areas'],
    tags: ['coding', 'code-review', 'best-practices'],
    template: `You are an expert senior software engineer conducting a rigorous yet constructive code review.

Language/Stack: {{language}}
Specific Focus Areas: {{focus_areas}}

Review the following code:
\`\`\`{{language}}
{{code}}
\`\`\`

Provide your review structured as follows:
1. **Executive Summary**: Overall assessment of the implementation quality and architecture.
2. **Critical Bugs & Security Concerns**: Any potential memory leaks, race conditions, edge-case crashes, or vulnerabilities.
3. **Performance & Scalability**: Time/space complexity bottlenecks and optimization suggestions.
4. **Clean Code & Idiomatic Best Practices**: Naming, readability, maintainability, and standard framework conventions.
5. **Refactored Code**: Provide the improved code snippet with concise explanations for each change.`,
  },
  {
    _id: 'starter-refactor-clean-code',
    isStarter: true,
    title: 'Refactoring & Clean Code Specialist',
    category: 'development',
    description: 'Transform legacy or nested code into modular, maintainable, SOLID-compliant code.',
    variables: ['language', 'code', 'constraints'],
    tags: ['refactor', 'clean-code', 'solid'],
    template: `Act as a principal software architect specializing in clean code and software design patterns.

Refactor the following {{language}} code according to SOLID principles, DRY, and high maintainability:
\`\`\`{{language}}
{{code}}
\`\`\`

Constraints & Requirements:
{{constraints}}

Guidelines:
- Break down monolithic functions into focused, single-responsibility units.
- Eliminate deep nesting via guard clauses and early returns.
- Improve naming conventions for variables, methods, and types.
- Provide the final refactored code followed by a bulleted breakdown of the key architectural improvements made.`,
  },
  {
    _id: 'starter-unit-test-generator',
    isStarter: true,
    title: 'Comprehensive Unit & Edge Case Suite',
    category: 'development',
    description: 'Generates thorough unit tests covering happy paths, edge cases, boundary conditions, and mock dependencies.',
    variables: ['test_framework', 'code_under_test'],
    tags: ['testing', 'unit-tests', 'qa'],
    template: `Generate a production-ready, high-coverage unit test suite using {{test_framework}}.

Code to test:
\`\`\`
{{code_under_test}}
\`\`\`

Requirements:
1. **Happy Path Tests**: Typical expected usage with assertions.
2. **Boundary & Edge Cases**: Empty inputs, extreme values, null/undefined, and off-by-one checks.
3. **Error & Exception Handling**: Verify that invalid states and exceptions are thrown and caught gracefully.
4. **Mocking & Isolation**: Mock external I/O, API calls, or database adapters appropriately.
5. Provide self-contained runnable test code with clear test descriptions (describe/it or test syntax).`,
  },
  {
    _id: 'starter-system-design',
    isStarter: true,
    title: 'System Architecture & Design Spec',
    category: 'architecture',
    description: 'Produces a robust distributed system architecture document with trade-offs, data flow, and tech stack choices.',
    variables: ['system_name', 'requirements', 'scale_and_traffic'],
    tags: ['architecture', 'system-design', 'distributed-systems'],
    template: `You are a Principal Cloud & Distributed Systems Architect. Design a scalable, resilient system architecture for: {{system_name}}.

Key Requirements & Constraints:
{{requirements}}

Anticipated Traffic & Scale:
{{scale_and_traffic}}

Produce a comprehensive architecture blueprint covering:
1. **High-Level Architecture**: Core components, service boundaries, and data flow.
2. **Data Storage & Modeling**: Database selections (SQL vs NoSQL vs Vector), schema philosophy, and caching strategy (Redis/Memcached).
3. **API & Communication Protocols**: REST, GraphQL, gRPC, or event-driven message queues (Kafka/RabbitMQ).
4. **Scalability & High Availability**: Load balancing, horizontal scaling, partition strategy, and disaster recovery.
5. **Key Trade-Offs & Bottlenecks**: Explicit CAP theorem trade-offs, consistency model, and cost considerations.`,
  },
  {
    _id: 'starter-sql-optimizer',
    isStarter: true,
    title: 'SQL Query & Index Optimizer',
    category: 'architecture',
    description: 'Analyze slow database queries, suggest index strategies, and rewrite for minimal execution cost.',
    variables: ['database_dialect', 'schema_context', 'slow_query'],
    tags: ['database', 'sql', 'performance'],
    template: `You are an expert Database Administrator and Performance Engineer.

Database Engine: {{database_dialect}}

Schema & Existing Indexes:
\`\`\`sql
{{schema_context}}
\`\`\`

Slow Query:
\`\`\`sql
{{slow_query}}
\`\`\`

Please provide:
1. **Bottleneck Analysis**: Identify full table scans, Cartesian joins, unindexed WHERE/JOIN clauses, or sorting overhead.
2. **Optimized Query**: The rewritten SQL query with explanations for each optimization.
3. **Recommended Index Strategy**: Exact \`CREATE INDEX\` statements with reasoning for composite or partial indexes.
4. **Estimated Performance Impact**: Expected improvement in query plan execution and cache utilization.`,
  },
  {
    _id: 'starter-bug-investigator',
    isStarter: true,
    title: 'Bug Root Cause Analysis & Fix',
    category: 'debugging',
    description: 'Diagnose complex runtime errors, unexpected behavior, and stack traces with targeted fix solutions.',
    variables: ['error_or_stacktrace', 'relevant_code', 'environment_details'],
    tags: ['debugging', 'troubleshooting', 'root-cause'],
    template: `Act as a senior software debugger. Investigate the following bug and determine the root cause and resolution.

Error Message / Stack Trace:
\`\`\`
{{error_or_stacktrace}}
\`\`\`

Relevant Source Code:
\`\`\`
{{relevant_code}}
\`\`\`

Environment Details:
{{environment_details}}

Provide:
1. **Root Cause Analysis (RCA)**: Exact explanation of why and where the failure occurred.
2. **Immediate Patch**: The corrected code snippet resolving the issue safely.
3. **Regression Prevention**: What safeguards, type assertions, or validation should be added to prevent recurrence.`,
  },
  {
    _id: 'starter-security-audit',
    isStarter: true,
    title: 'Security Vulnerability & OWASP Audit',
    category: 'debugging',
    description: 'Scan code for security flaws, injection vectors, authentication loopholes, and data leaks.',
    variables: ['framework_stack', 'code_to_audit'],
    tags: ['security', 'owasp', 'audit'],
    template: `Conduct a professional security audit on the following {{framework_stack}} code.

Source Code:
\`\`\`
{{code_to_audit}}
\`\`\`

Inspect the code against OWASP Top 10 vulnerabilities, including:
- Injection (SQL, Command, XSS)
- Broken Authentication & Session Management
- Sensitive Data Exposure & Insecure Logging
- Broken Access Control & IDOR
- Security Misconfiguration

Output format:
- **Severity Rating**: [Low | Medium | High | Critical] for each identified issue.
- **Vulnerability Explanation**: How an attacker could exploit it.
- **Secure Remediation**: Sanitized and patched code implementation.`,
  },
  {
    _id: 'starter-api-doc-generator',
    isStarter: true,
    title: 'API Endpoint Documentation Drafter',
    category: 'documentation',
    description: 'Generates pristine developer documentation for REST endpoints, with parameters, request/response JSON, and status codes.',
    variables: ['endpoint_method_and_path', 'handler_or_controller_code'],
    tags: ['documentation', 'api', 'openapi'],
    template: `You are a technical writer for developer platforms. Create comprehensive API documentation for the following endpoint:

Endpoint: {{endpoint_method_and_path}}

Handler / Controller Code:
\`\`\`
{{handler_or_controller_code}}
\`\`\`

Document this endpoint in clean Markdown format including:
1. **Overview & Description**: Purpose and authentication requirements (Bearer token, API key).
2. **Request Parameters / Headers**: Path params, query params, and headers.
3. **Request Body Schema**: JSON example with field descriptions and validation constraints.
4. **Responses**:
   - \`200 OK\` / \`201 Created\` with exact JSON payload.
   - \`400 Bad Request\`, \`401 Unauthorized\`, \`404 Not Found\`, \`500 Internal Error\` payloads.
5. **cURL Example**: Fully formed curl command to test the endpoint.`,
  },
];
