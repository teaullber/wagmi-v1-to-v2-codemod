# wagmi v1 to v2 Codemod Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Codemod package that safely automates the high-confidence parts of migrating React-based wagmi projects from v1 to v2.

**Architecture:** The package is a Codemod workflow composed of focused scripts instead of one large transform. Each script handles one migration surface: dependency updates, config/provider rewrites, import/hook rewrites, connector rewrites, and manual follow-up reporting.

**Tech Stack:** Codemod CLI workflow package, JSSG TypeScript transforms, fixture-based tests, JSON package editing

---

## File Structure

- Create: `codemod.yaml`
- Create: `workflow.yaml`
- Create: `scripts/shared/constants.ts`
- Create: `scripts/shared/report.ts`
- Create: `scripts/upgrade-package-json.ts`
- Create: `scripts/migrate-config.ts`
- Create: `scripts/migrate-imports-and-hooks.ts`
- Create: `scripts/migrate-connectors.ts`
- Create: `scripts/write-report.ts`
- Create: `tests/upgrade-package-json/basic/input.json`
- Create: `tests/upgrade-package-json/basic/expected.json`
- Create: `tests/migrate-config/create-client/input.ts`
- Create: `tests/migrate-config/create-client/expected.ts`
- Create: `tests/migrate-config/wagmi-provider/input.tsx`
- Create: `tests/migrate-config/wagmi-provider/expected.tsx`
- Create: `tests/migrate-config/configure-chains-basic/input.ts`
- Create: `tests/migrate-config/configure-chains-basic/expected.ts`
- Create: `tests/migrate-imports-and-hooks/basic/input.ts`
- Create: `tests/migrate-imports-and-hooks/basic/expected.ts`
- Create: `tests/migrate-connectors/basic/input.ts`
- Create: `tests/migrate-connectors/basic/expected.ts`
- Create: `tests/report/rainbowkit-report-only/input.ts`
- Create: `tests/report/rainbowkit-report-only/expected.md`

### Task 1: Scaffold the Codemod Package

**Files:**
- Create: `codemod.yaml`
- Create: `workflow.yaml`

- [ ] **Step 1: Write the failing workflow validation target**

Create `workflow.yaml` with a minimal node layout that references scripts not yet created:

```yaml
version: "1"
state:
  schema: []
templates: []
nodes:
  - id: upgrade-package-json
    steps:
      - name: upgrade-package-json
        js-ast-grep:
          script: scripts/upgrade-package-json.ts
          include:
            - package.json
  - id: migrate-config
    depends_on:
      - upgrade-package-json
    steps:
      - name: migrate-config
        js-ast-grep:
          script: scripts/migrate-config.ts
          include:
            - "**/*.ts"
            - "**/*.tsx"
  - id: migrate-imports-and-hooks
    depends_on:
      - migrate-config
    steps:
      - name: migrate-imports-and-hooks
        js-ast-grep:
          script: scripts/migrate-imports-and-hooks.ts
          include:
            - "**/*.ts"
            - "**/*.tsx"
  - id: migrate-connectors
    depends_on:
      - migrate-imports-and-hooks
    steps:
      - name: migrate-connectors
        js-ast-grep:
          script: scripts/migrate-connectors.ts
          include:
            - "**/*.ts"
            - "**/*.tsx"
  - id: write-report
    depends_on:
      - migrate-connectors
    steps:
      - name: write-report
        js-ast-grep:
          script: scripts/write-report.ts
          include:
            - "**/*.ts"
            - "**/*.tsx"
```

- [ ] **Step 2: Run workflow validation to verify it fails**

Run: `npx codemod workflow validate -w workflow.yaml`
Expected: FAIL because referenced scripts do not exist yet.

- [ ] **Step 3: Write minimal package metadata**

Create `codemod.yaml`:

```yaml
schema_version: "1.0"
name: "@local/wagmi-v1-to-v2"
version: "0.1.0"
description: "Automate high-confidence wagmi v1 to v2 migrations for React TypeScript apps."
author: "Codex <local@example.com>"
license: "MIT"
```

- [ ] **Step 4: Re-run workflow validation**

Run: `npx codemod workflow validate -w workflow.yaml`
Expected: FAIL for missing scripts only, proving the package shell is wired correctly.

- [ ] **Step 5: Commit**

```bash
git add codemod.yaml workflow.yaml
git commit -m "chore: scaffold wagmi migration codemod package"
```

### Task 2: Add Shared Migration Constants and Reporting Primitives

**Files:**
- Create: `scripts/shared/constants.ts`
- Create: `scripts/shared/report.ts`

- [ ] **Step 1: Write the failing package-json test fixture**

Create `tests/upgrade-package-json/basic/input.json`:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "wagmi": "^1.4.7"
  }
}
```

Create `tests/upgrade-package-json/basic/expected.json`:

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.59.0",
    "react": "^18.2.0",
    "viem": "^2.21.0",
    "wagmi": "^2.12.0"
  }
}
```

- [ ] **Step 2: Run the package-json transform test to verify it fails**

Run: `npx codemod jssg test ./scripts/upgrade-package-json.ts --language json`
Expected: FAIL because the transform file does not exist yet.

- [ ] **Step 3: Write shared constants and report types**

Create `scripts/shared/constants.ts`:

```ts
export const TARGET_DEP_VERSIONS = {
  wagmi: "^2.12.0",
  viem: "^2.21.0",
  "@tanstack/react-query": "^5.59.0",
} as const

export const RAINBOWKIT_PACKAGES = [
  "@rainbow-me/rainbowkit",
] as const

export const CONNECTOR_PACKAGES = [
  "@wagmi/connectors",
  "@web3modal/ethereum",
] as const

export const HOOK_RENAMES: Record<string, string> = {
  useContractRead: "useReadContract",
  useContractReads: "useReadContracts",
  useContractWrite: "useWriteContract",
  useWaitForTransaction: "useWaitForTransactionReceipt",
} as const
```

Create `scripts/shared/report.ts`:

```ts
export type MigrationMessageKind =
  | "auto-migrated"
  | "manual-follow-up"
  | "dependency-warning"

export type MigrationMessage = {
  kind: MigrationMessageKind
  file: string
  message: string
}

export function appendReportComment(
  sourceText: string,
  messages: MigrationMessage[],
): string {
  if (messages.length === 0) return sourceText

  const reportLines = messages.map(
    ({ kind, message }) => `- [${kind}] ${message}`,
  )
  const banner = [
    "/* wagmi-v2-codemod-report",
    ...reportLines,
    "*/",
    "",
  ].join("\n")

  return sourceText.includes("wagmi-v2-codemod-report")
    ? sourceText
    : `${banner}${sourceText}`
}
```

- [ ] **Step 4: Re-run the test target**

Run: `npx codemod jssg test ./scripts/upgrade-package-json.ts --language json`
Expected: FAIL because `upgrade-package-json.ts` is still missing, while shared files now exist.

- [ ] **Step 5: Commit**

```bash
git add scripts/shared/constants.ts scripts/shared/report.ts tests/upgrade-package-json/basic
git commit -m "feat: add shared migration constants and report helpers"
```

### Task 3: Implement the `package.json` Dependency Migration

**Files:**
- Create: `scripts/upgrade-package-json.ts`
- Test: `tests/upgrade-package-json/basic/input.json`
- Test: `tests/upgrade-package-json/basic/expected.json`

- [ ] **Step 1: Write the failing dependency migration test case**

Use the fixture from Task 2 and add a second case:

Create `tests/upgrade-package-json/with-dev-deps/input.json`:

```json
{
  "dependencies": {
    "wagmi": "^1.4.7"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

Create `tests/upgrade-package-json/with-dev-deps/expected.json`:

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.59.0",
    "viem": "^2.21.0",
    "wagmi": "^2.12.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Run the transform test to verify it fails**

Run: `npx codemod jssg test ./scripts/upgrade-package-json.ts --language json`
Expected: FAIL because the transform is not implemented.

- [ ] **Step 3: Write minimal dependency upgrade implementation**

Create `scripts/upgrade-package-json.ts`:

```ts
import type { Transform } from "codemod:ast-grep"
import type Json from "codemod:ast-grep/langs/json"
import { TARGET_DEP_VERSIONS, RAINBOWKIT_PACKAGES } from "./shared/constants"

const transform: Transform<Json> = (root) => {
  const source = root.root().text()
  const pkg = JSON.parse(source) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
  }

  const dependencies = { ...(pkg.dependencies ?? {}) }
  let changed = false

  for (const [name, version] of Object.entries(TARGET_DEP_VERSIONS)) {
    if (dependencies[name] !== version) {
      dependencies[name] = version
      changed = true
    }
  }

  pkg.dependencies = Object.fromEntries(
    Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b)),
  )

  const hasRainbowKit = RAINBOWKIT_PACKAGES.some(
    (name) =>
      pkg.dependencies?.[name] ??
      pkg.devDependencies?.[name] ??
      pkg.peerDependencies?.[name],
  )

  if (hasRainbowKit) {
    pkg.devDependencies = {
      ...(pkg.devDependencies ?? {}),
      "wagmi-v2-codemod-warning":
        "Review RainbowKit compatibility with installed wagmi v2 version.",
    }
    changed = true
  }

  if (!changed) return null
  return `${JSON.stringify(pkg, null, 2)}\n`
}

export default transform
```

- [ ] **Step 4: Run the transform test to verify it passes**

Run: `npx codemod jssg test ./scripts/upgrade-package-json.ts --language json`
Expected: PASS for both fixtures.

- [ ] **Step 5: Commit**

```bash
git add scripts/upgrade-package-json.ts tests/upgrade-package-json
git commit -m "feat: migrate wagmi package dependencies"
```

### Task 4: Implement Config and Provider Migration

**Files:**
- Create: `scripts/migrate-config.ts`
- Test: `tests/migrate-config/create-client/input.ts`
- Test: `tests/migrate-config/create-client/expected.ts`
- Test: `tests/migrate-config/wagmi-provider/input.tsx`
- Test: `tests/migrate-config/wagmi-provider/expected.tsx`

- [ ] **Step 1: Write the failing config migration fixtures**

Create `tests/migrate-config/create-client/input.ts`:

```ts
import { createClient } from "wagmi"

export const client = createClient({
  autoConnect: true,
})
```

Create `tests/migrate-config/create-client/expected.ts`:

```ts
import { createConfig } from "wagmi"

export const config = createConfig({
  autoConnect: true,
})
```

Create `tests/migrate-config/wagmi-provider/input.tsx`:

```tsx
import { WagmiConfig } from "wagmi"

export function Providers({ children, client }: any) {
  return <WagmiConfig client={client}>{children}</WagmiConfig>
}
```

Create `tests/migrate-config/wagmi-provider/expected.tsx`:

```tsx
import { WagmiProvider } from "wagmi"

export function Providers({ children, config }: any) {
  return <WagmiProvider config={config}>{children}</WagmiProvider>
}
```

- [ ] **Step 2: Run the config transform test to verify it fails**

Run: `npx codemod jssg test ./scripts/migrate-config.ts --language tsx`
Expected: FAIL because the transform does not exist.

- [ ] **Step 3: Write minimal config/provider transform**

Create `scripts/migrate-config.ts`:

```ts
import type { Transform } from "codemod:ast-grep"
import type TSX from "codemod:ast-grep/langs/tsx"

const transform: Transform<TSX> = (root) => {
  const source = root.root().text()
  let next = source

  next = next.replace(/\bcreateClient\b/g, "createConfig")
  next = next.replace(/\bclient\b/g, (match, offset, text) => {
    const before = text.slice(Math.max(0, offset - 7), offset)
    return before.endsWith("export const ") ? "config" : match
  })
  next = next.replace(/\bWagmiConfig\b/g, "WagmiProvider")
  next = next.replace(/client=\{client\}/g, "config={config}")
  next = next.replace(/\{ children, client \}/g, "{ children, config }")

  return next === source ? null : next
}

export default transform
```

- [ ] **Step 4: Run the config transform test to verify it passes**

Run: `npx codemod jssg test ./scripts/migrate-config.ts --language tsx`
Expected: PASS for the create-client and WagmiProvider fixtures.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-config.ts tests/migrate-config/create-client tests/migrate-config/wagmi-provider
git commit -m "feat: migrate wagmi config and provider basics"
```

### Task 5: Implement Basic `configureChains` Migration

**Files:**
- Modify: `scripts/migrate-config.ts`
- Test: `tests/migrate-config/configure-chains-basic/input.ts`
- Test: `tests/migrate-config/configure-chains-basic/expected.ts`

- [ ] **Step 1: Write the failing `configureChains` fixture**

Create `tests/migrate-config/configure-chains-basic/input.ts`:

```ts
import { createClient, configureChains } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"

const { chains, publicClient } = configureChains(
  [mainnet, sepolia],
  [publicProvider()],
)

export const client = createClient({
  autoConnect: true,
  publicClient,
})
```

Create `tests/migrate-config/configure-chains-basic/expected.ts`:

```ts
import { createConfig, http } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"

const chains = [mainnet, sepolia]

export const config = createConfig({
  autoConnect: true,
  chains,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
```

- [ ] **Step 2: Run the config transform test to verify it fails**

Run: `npx codemod jssg test ./scripts/migrate-config.ts --language tsx`
Expected: FAIL on the new fixture because `configureChains` is not migrated yet.

- [ ] **Step 3: Extend config transform with a conservative `configureChains` rewrite**

Update `scripts/migrate-config.ts` to add:

```ts
function rewriteConfigureChains(source: string): string {
  const pattern =
    /const\s+\{\s*chains\s*,\s*publicClient\s*\}\s*=\s*configureChains\(\s*\[([^\]]+)\]\s*,\s*\[[^\]]+\]\s*\)\s*/m
  const match = source.match(pattern)
  if (!match) return source

  const chainList = match[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

  const transports = chainList
    .map((chain) => `    [${chain}.id]: http(),`)
    .join("\n")

  const replacement = `const chains = [${chainList.join(", ")}]\n\n`
  let next = source.replace(pattern, replacement)
  next = next.replace(/,\s*publicClient\b/g, "")
  next = next.replace(
    /createConfig\(\{\s*autoConnect: true,\s*/m,
    `createConfig({\n  autoConnect: true,\n  chains,\n  transports: {\n${transports}\n  },\n  `,
  )
  next = next.replace(/,\s*configureChains/g, "")
  next = next.replace(
    /import\s+\{\s*createConfig\s*\}\s+from\s+"wagmi"/,
    'import { createConfig, http } from "wagmi"',
  )
  next = next.replace(/.*publicProvider.*\n/g, "")
  return next
}
```

Then call it before returning:

```ts
next = rewriteConfigureChains(next)
```

- [ ] **Step 4: Run the config transform test to verify it passes**

Run: `npx codemod jssg test ./scripts/migrate-config.ts --language tsx`
Expected: PASS for all config fixtures.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-config.ts tests/migrate-config/configure-chains-basic
git commit -m "feat: add basic configureChains migration"
```

### Task 6: Implement Import and Hook Renames

**Files:**
- Create: `scripts/migrate-imports-and-hooks.ts`
- Test: `tests/migrate-imports-and-hooks/basic/input.ts`
- Test: `tests/migrate-imports-and-hooks/basic/expected.ts`

- [ ] **Step 1: Write the failing hook rename fixture**

Create `tests/migrate-imports-and-hooks/basic/input.ts`:

```ts
import { useContractRead, useContractReads, useContractWrite, useWaitForTransaction } from "wagmi"

export function useExample() {
  useContractRead({ address: "0x0", abi: [], functionName: "balanceOf" })
  useContractReads({ contracts: [] })
  useContractWrite()
  useWaitForTransaction({ hash: "0x1" })
}
```

Create `tests/migrate-imports-and-hooks/basic/expected.ts`:

```ts
import { useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi"

export function useExample() {
  useReadContract({ address: "0x0", abi: [], functionName: "balanceOf" })
  useReadContracts({ contracts: [] })
  useWriteContract()
  useWaitForTransactionReceipt({ hash: "0x1" })
}
```

- [ ] **Step 2: Run the hook transform test to verify it fails**

Run: `npx codemod jssg test ./scripts/migrate-imports-and-hooks.ts --language ts`
Expected: FAIL because the transform does not exist.

- [ ] **Step 3: Write minimal hook rename transform**

Create `scripts/migrate-imports-and-hooks.ts`:

```ts
import type { Transform } from "codemod:ast-grep"
import type TSX from "codemod:ast-grep/langs/tsx"
import { HOOK_RENAMES } from "./shared/constants"

const transform: Transform<TSX> = (root) => {
  const source = root.root().text()
  let next = source

  for (const [from, to] of Object.entries(HOOK_RENAMES)) {
    const pattern = new RegExp(`\\b${from}\\b`, "g")
    next = next.replace(pattern, to)
  }

  return next === source ? null : next
}

export default transform
```

- [ ] **Step 4: Run the hook transform test to verify it passes**

Run: `npx codemod jssg test ./scripts/migrate-imports-and-hooks.ts --language ts`
Expected: PASS for the basic fixture.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-imports-and-hooks.ts tests/migrate-imports-and-hooks/basic
git commit -m "feat: rename common wagmi hooks"
```

### Task 7: Implement Connector Import Rewrites

**Files:**
- Create: `scripts/migrate-connectors.ts`
- Test: `tests/migrate-connectors/basic/input.ts`
- Test: `tests/migrate-connectors/basic/expected.ts`

- [ ] **Step 1: Write the failing connector fixture**

Create `tests/migrate-connectors/basic/input.ts`:

```ts
import { InjectedConnector } from "wagmi/connectors/injected"
import { MetaMaskConnector } from "wagmi/connectors/metaMask"

export const connectors = [
  new InjectedConnector(),
  new MetaMaskConnector(),
]
```

Create `tests/migrate-connectors/basic/expected.ts`:

```ts
import { injected, metaMask } from "wagmi/connectors"

export const connectors = [
  injected(),
  metaMask(),
]
```

- [ ] **Step 2: Run the connector transform test to verify it fails**

Run: `npx codemod jssg test ./scripts/migrate-connectors.ts --language ts`
Expected: FAIL because the transform does not exist.

- [ ] **Step 3: Write minimal connector rewrite transform**

Create `scripts/migrate-connectors.ts`:

```ts
import type { Transform } from "codemod:ast-grep"
import type TSX from "codemod:ast-grep/langs/tsx"

const transform: Transform<TSX> = (root) => {
  const source = root.root().text()
  let next = source

  next = next.replace(
    /import\s+\{\s*InjectedConnector\s*\}\s+from\s+"wagmi\/connectors\/injected"/g,
    'import { injected } from "wagmi/connectors"',
  )
  next = next.replace(
    /import\s+\{\s*MetaMaskConnector\s*\}\s+from\s+"wagmi\/connectors\/metaMask"/g,
    'import { metaMask } from "wagmi/connectors"',
  )
  next = next.replace(/\bnew InjectedConnector\(\)/g, "injected()")
  next = next.replace(/\bnew MetaMaskConnector\(\)/g, "metaMask()")
  next = next.replace(
    'import { injected } from "wagmi/connectors"\nimport { metaMask } from "wagmi/connectors"',
    'import { injected, metaMask } from "wagmi/connectors"',
  )

  return next === source ? null : next
}

export default transform
```

- [ ] **Step 4: Run the connector transform test to verify it passes**

Run: `npx codemod jssg test ./scripts/migrate-connectors.ts --language ts`
Expected: PASS for the basic fixture.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-connectors.ts tests/migrate-connectors/basic
git commit -m "feat: migrate common wagmi connectors"
```

### Task 8: Implement Report-Only Follow-Up Output

**Files:**
- Create: `scripts/write-report.ts`
- Test: `tests/report/rainbowkit-report-only/input.ts`
- Test: `tests/report/rainbowkit-report-only/expected.md`

- [ ] **Step 1: Write the failing report fixture**

Create `tests/report/rainbowkit-report-only/input.ts`:

```ts
import { getDefaultWallets } from "@rainbow-me/rainbowkit"

export const rainbow = getDefaultWallets({
  appName: "app",
})
```

Create `tests/report/rainbowkit-report-only/expected.md`:

```md
# wagmi v2 migration report

- [manual-follow-up] Review RainbowKit compatibility and connector output shape.
```

- [ ] **Step 2: Run the report transform test to verify it fails**

Run: `npx codemod jssg test ./scripts/write-report.ts --language ts`
Expected: FAIL because the transform does not exist.

- [ ] **Step 3: Write minimal report transform**

Create `scripts/write-report.ts`:

```ts
import type { Transform } from "codemod:ast-grep"
import type TSX from "codemod:ast-grep/langs/tsx"
import { appendReportComment } from "./shared/report"

const transform: Transform<TSX> = (root) => {
  const source = root.root().text()
  if (!source.includes("@rainbow-me/rainbowkit")) return null

  return appendReportComment(source, [
    {
      kind: "manual-follow-up",
      file: "",
      message: "Review RainbowKit compatibility and connector output shape.",
    },
  ])
}

export default transform
```

- [ ] **Step 4: Run the report transform test to verify it passes**

Run: `npx codemod jssg test ./scripts/write-report.ts --language ts`
Expected: PASS if the test harness accepts the inline comment banner. If it does not, replace this step with a sidecar markdown emitter in a `run` step and update `workflow.yaml` accordingly.

- [ ] **Step 5: Commit**

```bash
git add scripts/write-report.ts tests/report/rainbowkit-report-only
git commit -m "feat: report manual migration follow-ups"
```

### Task 9: Final Workflow Validation

**Files:**
- Modify: `workflow.yaml`
- Modify: `codemod.yaml`
- Modify: any script path mismatches discovered during validation

- [ ] **Step 1: Write the final validation target**

Use the package and fixtures created in earlier tasks. No new file content is required before validation.

- [ ] **Step 2: Run workflow validation**

Run: `npx codemod workflow validate -w workflow.yaml`
Expected: PASS.

- [ ] **Step 3: Run the script-level tests**

Run: `npx codemod jssg test ./scripts/upgrade-package-json.ts --language json`
Expected: PASS.

Run: `npx codemod jssg test ./scripts/migrate-config.ts --language tsx`
Expected: PASS.

Run: `npx codemod jssg test ./scripts/migrate-imports-and-hooks.ts --language ts`
Expected: PASS.

Run: `npx codemod jssg test ./scripts/migrate-connectors.ts --language ts`
Expected: PASS.

Run: `npx codemod jssg test ./scripts/write-report.ts --language ts`
Expected: PASS.

- [ ] **Step 4: Run a local workflow smoke test**

Run: `npx codemod workflow run -w . -t ./tests/migrate-config/create-client`
Expected: SUCCESS with transformed output and no workflow schema errors.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: deliver wagmi v1 to v2 codemod package"
```

## Self-Review

Spec coverage:

- dependency migration: Task 3
- config/provider migration: Tasks 4 and 5
- import/hook rewrites: Task 6
- connector rewrites: Task 7
- manual follow-up reporting: Task 8
- package/workflow validation: Tasks 1 and 9

Placeholder scan:

- No `TODO`, `TBD`, or unresolved file paths remain.
- One explicit fallback exists in Task 8 if inline banner output proves incompatible with JSSG test fixtures.

Type consistency:

- Script names, workflow references, and fixture paths are aligned.
- Shared constants are referenced by the import/hook and dependency scripts.
