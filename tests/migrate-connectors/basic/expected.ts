import { injected, metaMask } from "wagmi/connectors"

export const connectors = [
  injected(),
  metaMask(),
]
