export type MigrationMessageKind =
  | "auto-migrated"
  | "manual-follow-up"
  | "dependency-warning"

export type MigrationMessage = {
  kind: MigrationMessageKind
  message: string
}

export function appendReportComment(
  sourceText: string,
  messages: MigrationMessage[],
): string {
  if (messages.length === 0) return sourceText
  if (sourceText.includes("wagmi-v2-codemod-report")) return sourceText

  const banner = [
    "/* wagmi-v2-codemod-report",
    ...messages.map(({ kind, message }) => `- [${kind}] ${message}`),
    "*/",
    "",
  ].join("\n")

  return `${banner}${sourceText}`
}
