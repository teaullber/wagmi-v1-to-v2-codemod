# wagmi v1 to v2 Codemod

Codemod package for migrating React-based wagmi projects from v1 to v2 with a bias toward safe, mechanical transformations.

## What It Does

This package currently automates these migration surfaces:

- Upgrades direct dependencies in `package.json`
  - `wagmi` -> `^2.12.0`
  - `viem` -> `^2.21.0`
  - `@tanstack/react-query` -> `^5.59.0`
- Rewrites common config entrypoints
  - `createClient` -> `createConfig`
  - `WagmiConfig` -> `WagmiProvider`
- Rewrites a basic static `configureChains(...)` pattern into a `chains` + `transports` shape
- Renames a small set of common wagmi hooks
  - `useContractRead` -> `useReadContract`
  - `useContractReads` -> `useReadContracts`
  - `useContractWrite` -> `useWriteContract`
  - `useWaitForTransaction` -> `useWaitForTransactionReceipt`
- Rewrites a small set of common connector imports/usages
  - `InjectedConnector` -> `injected()`
  - `MetaMaskConnector` -> `metaMask()`
- Adds an inline migration note for RainbowKit imports so teams know to manually review compatibility

## Package Layout

- [codemod.yaml](/Users/bytedance/Desktop/未命名文件夹%202/codemod.yaml)
- [workflow.yaml](/Users/bytedance/Desktop/未命名文件夹%202/workflow.yaml)
- [package.json](/Users/bytedance/Desktop/未命名文件夹%202/package.json)
- [.gitignore](/Users/bytedance/Desktop/未命名文件夹%202/.gitignore)
- [scripts](/Users/bytedance/Desktop/未命名文件夹%202/scripts)
- [tests](/Users/bytedance/Desktop/未命名文件夹%202/tests)

## Requirements

- Node.js with `npx`
- A local target repository that uses wagmi v1
- Recommended: run on a clean git branch in the target repository

## Install / Run

Validate the package:

```bash
npm run validate
```

Run the workflow against a target repository:

```bash
npx codemod workflow run -w . -t /absolute/path/to/target-repo
```

If you want to iterate on one transform at a time, use JSSG tests:

```bash
npm run test:deps
npm run test:config
npm run test:hooks
npm run test:connectors
npm run test:report
```

Run the full local verification suite:

```bash
npm run test
```

## Recommended Migration Flow For Teams

1. Create a fresh branch in the application repository.
2. Run this codemod package against that repository.
3. Install updated dependencies.
4. Run the app's typecheck, tests, and build.
5. Search for inline `wagmi-v2-codemod-report` comments and resolve the flagged files.
6. Manually review any custom wrappers, connector setup, and RainbowKit integration.

## What Is Safe To Expect

This package is designed for high-confidence mechanical edits. It works best when the target codebase uses:

- top-level wagmi config modules
- direct React hook imports from `wagmi`
- common connector imports from `wagmi/connectors/*`
- static `configureChains([chainA, chainB], [publicProvider()])` patterns

## Manual Follow-Up Areas

The codemod intentionally does not try to fully automate these cases:

- custom wrapper hooks around wagmi APIs
- dynamic config builders with conditional object assembly
- complex connector factories
- RainbowKit version compatibility and downstream API adjustments
- business-specific abstractions that hide wagmi usage behind app-level helpers

## Known Limitations

- The `configureChains` migration only handles a basic static shape.
- Hook coverage is intentionally narrow in this first version.
- Connector migration currently handles only a small set of common connectors.
- The package updates direct dependencies, but does not guarantee every related third-party web3 package is compatible afterward.
- You should expect some manual cleanup in non-trivial apps.

## Validation Status

This package has been validated locally with:

- `npx --yes codemod workflow validate -w workflow.yaml`
- JSSG fixture tests for each transform under `tests/`
- a full workflow smoke run against a temporary sample project

