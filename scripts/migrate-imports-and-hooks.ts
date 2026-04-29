import type { Transform } from "codemod:ast-grep"
import type TSX from "codemod:ast-grep/langs/tsx"

import { HOOK_RENAMES } from "./shared/constants"

const transform: Transform<TSX> = (root) => {
  const source = root.root().text()
  let next = source

  for (const [from, to] of Object.entries(HOOK_RENAMES)) {
    next = next.replace(new RegExp(`\\b${from}\\b`, "g"), to)
  }

  return next === source ? null : next
}

export default transform
