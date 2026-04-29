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
