import type { Transform } from "codemod:ast-grep"
import type TSX from "codemod:ast-grep/langs/tsx"

import { CONNECTOR_IMPORT_RENAMES } from "./shared/constants"

const transform: Transform<TSX> = (root) => {
  const source = root.root().text()
  let next = source

  for (const rule of CONNECTOR_IMPORT_RENAMES) {
    next = next.replace(rule.from, rule.to)
    next = next.replace(
      new RegExp(`new ${rule.className}\\(([^)]*)\\)`, "g"),
      `${rule.factoryName}($1)`,
    )
  }

  next = next.replace(
    'import { injected } from "wagmi/connectors"\nimport { metaMask } from "wagmi/connectors"',
    'import { injected, metaMask } from "wagmi/connectors"',
  )

  return next === source ? null : next
}

export default transform
