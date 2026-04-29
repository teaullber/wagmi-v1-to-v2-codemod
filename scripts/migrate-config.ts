import type { Transform } from "codemod:ast-grep"
import type TSX from "codemod:ast-grep/langs/tsx"

function rewriteConfigureChains(source: string): string {
  const configureChainsPattern =
    /const\s+\{\s*chains\s*,\s*publicClient\s*\}\s*=\s*configureChains\(([\s\S]*?\n)\)\s*\n?/m
  const match = source.match(configureChainsPattern)
  if (!match) return source

  const chainArrayMatch = match[1].match(/\[([\s\S]*?)\]/)
  if (!chainArrayMatch) return source

  const chainItems = chainArrayMatch[1]
    .replace(/\s+/g, " ")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

  if (chainItems.length === 0) return source

  const transports = chainItems
    .map((chain) => `    [${chain}.id]: http(),`)
    .join("\n")

  let next = source.replace(
    configureChainsPattern,
    `const chains = [${chainItems.join(", ")}]\n\n`,
  )

  next = next.replace(
    /import\s+\{\s*createClient\s*,\s*configureChains\s*\}\s+from\s+"wagmi"/,
    'import { createConfig, http } from "wagmi"',
  )
  next = next.replace(
    /import\s+\{\s*configureChains\s*,\s*createClient\s*\}\s+from\s+"wagmi"/,
    'import { createConfig, http } from "wagmi"',
  )
  next = next.replace(
    /import\s+\{\s*createConfig\s*,\s*configureChains\s*\}\s+from\s+"wagmi"/,
    'import { createConfig, http } from "wagmi"',
  )
  next = next.replace(
    /import\s+\{\s*configureChains\s*,\s*createConfig\s*\}\s+from\s+"wagmi"/,
    'import { createConfig, http } from "wagmi"',
  )
  next = next.replace(
    /import\s+\{\s*createConfig\s*\}\s+from\s+"wagmi"/,
    'import { createConfig, http } from "wagmi"',
  )
  next = next.replace(/^.*wagmi\/providers\/public.*\n/gm, "")
  next = next.replace(/,\s*publicClient\b/g, "")
  next = next.replace(/publicClient,\s*\n/g, "")
  next = next.replace(
    /export const config = createConfig\(\{\s*autoConnect: true,\s*/m,
    `export const config = createConfig({\n  autoConnect: true,\n  chains,\n  transports: {\n${transports}\n  },\n  `,
  )
  next = next.replace(
    /export const client = createConfig\(\{\s*autoConnect: true,\s*/m,
    `export const config = createConfig({\n  autoConnect: true,\n  chains,\n  transports: {\n${transports}\n  },\n  `,
  )

  return next
}

function rewriteProvider(source: string): string {
  let next = source

  next = next.replace(/\bWagmiConfig\b/g, "WagmiProvider")
  next = next.replace(/\{ children, client \}/g, "{ children, config }")
  next = next.replace(/client=\{client\}/g, "config={config}")

  return next
}

function rewriteCreateConfig(source: string): string {
  let next = source

  next = next.replace(/\bcreateClient\b/g, "createConfig")
  next = next.replace(
    /import\s+\{\s*createClient\s*\}\s+from\s+"wagmi"/,
    'import { createConfig } from "wagmi"',
  )
  next = next.replace(/export const client = createConfig\(/g, "export const config = createConfig(")

  return next
}

const transform: Transform<TSX> = (root) => {
  const source = root.root().text()
  let next = source

  next = rewriteCreateConfig(next)
  next = rewriteProvider(next)
  next = rewriteConfigureChains(next)

  return next === source ? null : next
}

export default transform
