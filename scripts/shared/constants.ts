export const TARGET_DEP_VERSIONS = {
  wagmi: "^2.12.0",
  viem: "^2.21.0",
  "@tanstack/react-query": "^5.59.0",
} as const

export const HOOK_RENAMES: Record<string, string> = {
  useContractRead: "useReadContract",
  useContractReads: "useReadContracts",
  useContractWrite: "useWriteContract",
  useWaitForTransaction: "useWaitForTransactionReceipt",
} as const

export const CONNECTOR_IMPORT_RENAMES = [
  {
    from: 'import { InjectedConnector } from "wagmi/connectors/injected"',
    to: 'import { injected } from "wagmi/connectors"',
    className: "InjectedConnector",
    factoryName: "injected",
  },
  {
    from: 'import { MetaMaskConnector } from "wagmi/connectors/metaMask"',
    to: 'import { metaMask } from "wagmi/connectors"',
    className: "MetaMaskConnector",
    factoryName: "metaMask",
  },
] as const

export const RAINBOWKIT_IMPORT = "@rainbow-me/rainbowkit"
