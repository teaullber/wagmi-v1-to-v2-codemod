/* wagmi-v2-codemod-report
- [manual-follow-up] Review RainbowKit compatibility and connector output shape.
*/
import { getDefaultWallets } from "@rainbow-me/rainbowkit"

export const rainbow = getDefaultWallets({
  appName: "app",
})
