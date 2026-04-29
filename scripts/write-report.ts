import type { Transform } from "codemod:ast-grep"
import type TSX from "codemod:ast-grep/langs/tsx"

import { RAINBOWKIT_IMPORT } from "./shared/constants"
import { appendReportComment } from "./shared/report"

const transform: Transform<TSX> = (root) => {
  const source = root.root().text()
  if (!source.includes(RAINBOWKIT_IMPORT)) return null

  return appendReportComment(source, [
    {
      kind: "manual-follow-up",
      message: "Review RainbowKit compatibility and connector output shape.",
    },
  ])
}

export default transform
