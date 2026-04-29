# wagmi v1 -> v2 Codemod Design

Date: 2026-04-29

## Goal

Build a Codemod package that helps application teams migrate React-based wagmi projects from v1 to v2 with a bias toward safe, mechanical transformations.

Primary target:

- TypeScript / TSX repositories
- React hook usage
- wagmi config and provider wiring
- common connector and integration setup
- dependency updates in `package.json`

## Non-Goals

- Perfect zero-touch migration for every codebase
- Automatic repair of all downstream TypeScript errors
- Broad migration of unrelated web3 dependencies
- Risky rewrites that require business-specific intent

## Package Shape

The deliverable will be a standard Codemod package:

- `codemod.yaml`
- `workflow.yaml`
- `scripts/*.ts`
- `tests/**` fixtures

The workflow will orchestrate several focused transforms instead of one large script.

## Recommended Architecture

### 1. Dependency Upgrade Step

Purpose:

- Update `wagmi` to a v2 range
- Add or update `viem`
- Add or update `@tanstack/react-query`
- Flag potentially incompatible RainbowKit or connector packages

Implementation:

- JSSG or script-based JSON editing over `package.json`
- Conservative updates only for packages directly tied to wagmi v2 migration

### 2. Imports and Hooks Step

Purpose:

- Rewrite high-confidence wagmi imports
- Rename hooks or API references where the mapping is mechanical
- Remove stale imports after rewrites

Implementation:

- TS/TSX AST transforms
- Mapping table for known symbol migrations
- Reporting for symbols that cannot be safely migrated

### 3. Config Migration Step

Purpose:

- Migrate `createClient` to `createConfig`
- Replace `WagmiConfig` with `WagmiProvider`
- Detect `configureChains(...)` patterns and rewrite to `chains` + `transports`
- Convert common `publicClient` / `webSocketPublicClient` wiring shapes where the target form is statically derivable

Implementation:

- Focus on common top-level config modules and provider entrypoints
- Avoid rewriting dynamic factories that obscure final object shape

### 4. Connectors and Integrations Step

Purpose:

- Update common connector import locations and instantiation patterns
- Detect known RainbowKit integration surfaces
- Apply only high-confidence integration rewrites

Implementation:

- Mechanical source/import rewrites where possible
- Report-only behavior for version-sensitive or ambiguous integration code

### 5. Migration Report Step

Purpose:

- Summarize what changed
- List files and patterns that still need manual review
- Surface risky dependency combinations

Implementation:

- Emit a markdown or text report into the target repo
- Classify output as:
  - auto-migrated
  - requires manual follow-up
  - dependency compatibility warnings

## Automation Boundary

### Auto-Migrate

- `package.json` wagmi-related dependency updates
- `createClient` to `createConfig`
- `WagmiConfig` to `WagmiProvider`
- Common `configureChains` replacement skeletons
- High-frequency import and hook symbol rewrites
- Common `publicClient` and transport wiring migration
- Common connector import adjustments

### Report But Do Not Rewrite

- Custom wrapper hooks around wagmi
- Highly dynamic config builders
- RainbowKit combinations that depend on installed version compatibility
- Parameter reshaping that requires semantic judgment
- Cases where the target API shape is not statically obvious

### Do Not Handle in v1 of This Codemod

- Arbitrary business-specific abstractions
- Exhaustive third-party ecosystem upgrades
- Fully automatic resolution of all post-migration type errors

## Testing Strategy

The codemod should be developed test-first around fixtures.

Fixture groups:

- dependency-upgrade
- config-create-client-to-create-config
- provider-wagmi-config-to-provider
- configure-chains-basic
- hook-import-renames
- connector-import-renames
- rainbowkit-report-only
- custom-wrapper-report-only

Each fixture should include:

- `input.ts` or `input.tsx`
- `expected.ts` or `expected.tsx`

For `package.json` transforms:

- `input.json`
- `expected.json`

The first implementation target should be the config/provider path, since it is high-impact and comparatively deterministic.

## Initial Rule Priority

Implement in this order:

1. `package.json` dependency migration
2. `createClient` -> `createConfig`
3. `WagmiConfig` -> `WagmiProvider`
4. `configureChains` basic pattern migration
5. high-confidence import and hook renames
6. connector import rewrites
7. report generation for unsupported or ambiguous cases

## Validation

Development validation:

- fixture-based tests for each transform
- workflow validation through Codemod CLI

Runtime validation expectation for users:

- run codemod
- install dependencies
- run typecheck/tests in their app
- review generated migration report

## Open Constraints

- This workspace is currently an empty directory, so the package will be created from scratch
- The directory is not a git repository, so spec commit and repo-based history checks are unavailable here

## Implementation Outcome

After implementation, the deliverable should let a project team run one Codemod package locally and receive:

- automated edits for the safest wagmi v1 -> v2 migration steps
- upgraded direct dependencies
- a clear manual follow-up report for the remaining work
