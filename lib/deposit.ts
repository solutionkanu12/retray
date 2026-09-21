export function parseExpectedDeposit(value: string): number {
  const amount = value.trim()
  if (!amount) return 0
  if (!/^(?:0|[1-9]\d{0,3})(?:\.\d{1,2})?$/.test(amount)) {
    throw new Error("Enter a valid expected deposit between 0 and 9999.99.")
  }
  const [whole, fraction = ""] = amount.split(".")
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
}
