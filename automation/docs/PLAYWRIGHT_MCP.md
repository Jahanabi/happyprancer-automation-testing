# Playwright MCP & AI Agent Investigation & Setup Guide

## 1. Executive Summary & Architectural Evaluation

As part of the Happy Prancer QA Automation initiative, we evaluated whether **Playwright MCP (Model Context Protocol)** and experimental **Playwright Agents** should be integrated into the test pipeline.

### Findings:
1. **Playwright MCP is an Interactive Developer / IDE Tool, Not a CI Test Runner**:
   - Playwright MCP provides an MCP-compliant server that allows LLM agents (such as Antigravity IDE, Claude Desktop, or Cursor) to inspect the DOM, click elements, take screenshots, and troubleshoot failures interactively.
   - **It is NOT a replacement for `@playwright/test`**: CI pipelines require deterministic, headless, parallel execution with strict assertions, trace recording, and HTML/Excel reporting. Relying on an interactive MCP server inside GitHub Actions introduces network instability, token costs, non-deterministic timings, and unvetted code execution.
2. **Decision**:
   - **Standard CI / Post-Merge**: Uses `@playwright/test` runner for deterministic execution.
   - **Local Developer & AI Pair-Programming**: Playwright MCP is fully documented and configured as an optional local sidecar tool, completely decoupled from ordinary test execution.

---

## 2. Compatibility & Version Verification

| Component | Target Version | Verification Status |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` (CI: Node 20, Local: Node 24) | ✅ Compatible |
| **Playwright Test** | `^1.48.0` / `1.64.1` | ✅ Verified |
| **MCP Protocol** | `@modelcontextprotocol/sdk` / `server-playwright` | ✅ Compatible via `npx` |

---

## 3. How to Configure and Run Playwright MCP Locally

Developers and QA engineers can run the Playwright MCP server on-demand for interactive troubleshooting:

### Option A: On-Demand Execution via npx
```bash
npx -y @modelcontextprotocol/server-playwright
```

### Option B: Antigravity IDE / Claude Desktop Configuration
Add the following snippet to your IDE's MCP configuration (`mcp_config.json`):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"],
      "env": {
        "HEADLESS": "true",
        "BROWSER": "chromium"
      }
    }
  }
}
```

---

## 4. Security & Credential Protection

1. **No Credentials in Environment**: Never supply production Cognito passwords or AWS secret keys to the MCP server.
2. **Sandboxed Context**: The MCP server operates in an ephemeral browser context without persisting cookies or local storage between sessions.
3. **Restricted Origins**: Ensure testing is directed only to local development servers (`http://localhost:3000`). Never point automation at unvetted third-party domains.

---

## 5. Playwright Agents Evaluation

- **Autonomous Agent Loops**: While autonomous agents can explore web pages, using them to execute or author production tests inside CI runs the risk of hallucinations, unpredictable test run times, and false positives/negatives.
- **Happy Prancer Hybrid Strategy**:
  - **Structured Code Diff Analysis** maps pull request changes to exact Happy Prancer modules (`Login`, `Signup`, `Home`, `Instructors`, `Gallery`, `UpcomingClasses`, etc.).
  - **Pluggable AI Provider** (`automation/scripts/ai-provider.ts`) uses strict JSON schemas to generate structured, auditable test cases.
  - **Deterministic Playwright Generator** transforms approved cases into verifiable TypeScript specs using established Page Object Models (`LoginPage`, `SignupPage`, etc.).
  - **Script Validation** ensures syntax, types, and discovery pass before any browser code is executed.
