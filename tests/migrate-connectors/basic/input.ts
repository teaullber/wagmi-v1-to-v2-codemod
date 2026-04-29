import { InjectedConnector } from "wagmi/connectors/injected"
import { MetaMaskConnector } from "wagmi/connectors/metaMask"

export const connectors = [
  new InjectedConnector(),
  new MetaMaskConnector(),
]
