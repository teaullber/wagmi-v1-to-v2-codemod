import type { Transform } from "codemod:ast-grep"
import type Json from "codemod:ast-grep/langs/json"

import { TARGET_DEP_VERSIONS } from "./shared/constants"

type PackageJson = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

function sortObject(value: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
  )
}

const transform: Transform<Json> = (root) => {
  const source = root.root().text()
  const pkg = JSON.parse(source) as PackageJson
  const dependencies = { ...(pkg.dependencies ?? {}) }
  let changed = false

  for (const [name, version] of Object.entries(TARGET_DEP_VERSIONS)) {
    if (dependencies[name] !== version) {
      dependencies[name] = version
      changed = true
    }
  }

  if (!changed) return null

  pkg.dependencies = sortObject(dependencies)
  return `${JSON.stringify(pkg, null, 2)}\n`
}

export default transform
