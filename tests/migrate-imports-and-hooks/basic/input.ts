import { useContractRead, useContractReads, useContractWrite, useWaitForTransaction } from "wagmi"

export function useExample() {
  useContractRead({ address: "0x0", abi: [], functionName: "balanceOf" })
  useContractReads({ contracts: [] })
  useContractWrite()
  useWaitForTransaction({ hash: "0x1" })
}
