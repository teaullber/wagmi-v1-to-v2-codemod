import { WagmiConfig } from "wagmi"

export function Providers({ children, client }: any) {
  return <WagmiConfig client={client}>{children}</WagmiConfig>
}
