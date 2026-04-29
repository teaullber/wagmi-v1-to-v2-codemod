import { WagmiProvider } from "wagmi"

export function Providers({ children, config }: any) {
  return <WagmiProvider config={config}>{children}</WagmiProvider>
}
