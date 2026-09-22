import { NEW_DEPOSIT_CURRENCY } from "./deposit.ts"
import { assertConsumerAccess, type AccessIdentity } from "./circulation-domain.ts"

export type DepositStatus = "not_collected" | "paid" | "return_recorded"

export type PaymentAttemptStatus = "pending" | "paid" | "failed"

export type PayableBorrow = {
  consumerUserId: string
  status: "active" | "returned"
  depositMinor: number
  depositCurrency: string
  depositStatus: DepositStatus
}

export type PaymentAttemptDraft = {
  borrowId: string
  consumerUserId: string
  providerReference: string
  status: "pending"
  amountMinor: number
  currency: "NGN"
  authorizationUrl: null
}

export type PaymentLedger = {
  attempt: {
    id: string
    providerReference: string
    status: PaymentAttemptStatus
    amountMinor: number
    currency: string
    consumerUserId: string
  }
  deposit: {
    status: DepositStatus
    currency: string
    minor: number
  }
  processedEventDigests: string[]
}

export function assertConsumerMayInitializePayment(user: AccessIdentity, borrow: PayableBorrow): void {
  assertConsumerAccess(user, borrow.consumerUserId)
  if (borrow.status !== "active") throw new Error("This borrow is already returned.")
  if (borrow.depositMinor <= 0) throw new Error("This borrow has no NGN deposit to collect.")
  if (borrow.depositCurrency !== NEW_DEPOSIT_CURRENCY) {
    throw new Error("Paystack test-mode checkout is only available for NGN deposits.")
  }
  if (borrow.depositStatus === "paid") throw new Error("This deposit is already paid.")
}

export function createPaymentAttemptDraft(input: {
  borrowId: string
  consumerUserId: string
  depositMinor: number
  depositCurrency: string
}): PaymentAttemptDraft {
  if (input.depositCurrency !== NEW_DEPOSIT_CURRENCY) {
    throw new Error("Paystack test-mode checkout is only available for NGN deposits.")
  }
  if (!Number.isSafeInteger(input.depositMinor) || input.depositMinor <= 0) {
    throw new Error("This borrow has no NGN deposit to collect.")
  }
  return {
    borrowId: input.borrowId,
    consumerUserId: input.consumerUserId,
    providerReference: `retray_${crypto.randomUUID().replaceAll("-", "")}`,
    status: "pending",
    amountMinor: input.depositMinor,
    currency: NEW_DEPOSIT_CURRENCY,
    authorizationUrl: null,
  }
}

export function paystackInitializeBody(input: {
  email: string
  attempt: PaymentAttemptDraft
  callbackUrl: string
}): { email: string; amount: number; currency: "NGN"; reference: string; callback_url: string } {
  return {
    email: input.email,
    amount: input.attempt.amountMinor,
    currency: input.attempt.currency,
    reference: input.attempt.providerReference,
    callback_url: input.callbackUrl,
  }
}

export function applyBrowserPaymentCallback(ledger: PaymentLedger): PaymentLedger {
  return ledger
}

export function applyPaystackChargeSuccess(
  ledger: PaymentLedger,
  event: {
    event?: string
    data?: { id?: number | string; reference?: string; amount?: number; currency?: string; status?: string }
  },
  eventDigest: string,
): { ledger: PaymentLedger; duplicate: boolean } | null {
  if (ledger.processedEventDigests.includes(eventDigest)) {
    return { ledger, duplicate: true }
  }
  if (event.event !== "charge.success" || event.data?.status !== "success") return null
  if (event.data.reference !== ledger.attempt.providerReference) return null
  if (event.data.amount !== ledger.attempt.amountMinor) return null
  if (event.data.currency !== ledger.attempt.currency) return null
  if (ledger.attempt.currency !== NEW_DEPOSIT_CURRENCY) return null
  if (ledger.attempt.status === "paid" && ledger.deposit.status === "paid") {
    return {
      duplicate: true,
      ledger: {
        ...ledger,
        processedEventDigests: [...ledger.processedEventDigests, eventDigest],
      },
    }
  }
  return {
    duplicate: false,
    ledger: {
      attempt: { ...ledger.attempt, status: "paid" },
      deposit: { ...ledger.deposit, status: "paid" },
      processedEventDigests: [...ledger.processedEventDigests, eventDigest],
    },
  }
}
