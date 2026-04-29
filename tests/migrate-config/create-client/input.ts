import { createClient } from "wagmi"

export const client = createClient({
  autoConnect: true,
})
