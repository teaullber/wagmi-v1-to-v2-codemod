import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi"

export function useExample() {
  useReadContract({ address: "0x0", abi: [], functionName: "balanceOf" })
  useReadContracts({ contracts: [] })
  useWriteContract()
  useWaitForTransactionReceipt({ hash: "0x1" })
}
