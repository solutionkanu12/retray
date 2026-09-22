import { NEW_DEPOSIT_CURRENCY } from "./deposit.ts"
import { assertConsumerAccess, assertVenueAccess, type AccessIdentity } from "./circulation-domain.ts"

export type DepositStatus = "not_collected" | "paid" | "refunded" | "return_recorded"

export type PaymentAttemptStatus = "pending" | "paid" | "failed"

export type RefundStatus = "pending" | "refunded" | "failed"

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
    data?: { id?: number | string; reference?: string; amount?: number | string; currency?: string; status?: string }
  },
  eventDigest: string,
): { ledger: PaymentLedger; duplicate: boolean } | null {
  if (ledger.processedEventDigests.includes(eventDigest)) {
    return { ledger, duplicate: true }
  }
  if (event.event !== "charge.success" || event.data?.status !== "success") return null
  if (event.data.reference !== ledger.attempt.providerReference) return null
  if (Number(event.data.amount) !== ledger.attempt.amountMinor) return null
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

export type RefundablePayment = {
  venueOwnerUserId: string
  borrowStatus: "active" | "returned"
  depositStatus: DepositStatus
  payment: {
    id: string
    providerReference: string
    status: PaymentAttemptStatus
    amountMinor: number
    currency: string
  }
}

export type RefundRecord = {
  id: string
  paymentAttemptId: string
  providerReference: string | null
  status: RefundStatus
  amountMinor: number
  currency: string
}

export type RefundLedger = {
  refundable: RefundablePayment
  refund: RefundRecord | null
  processedEventDigests: string[]
}

export function assertBusinessMayRequestRefund(user: AccessIdentity, refundable: RefundablePayment): void {
  assertVenueAccess(user, refundable.venueOwnerUserId)
  if (refundable.depositStatus !== "paid" || refundable.payment.status !== "paid") {
    throw new Error("Only a paid deposit can be refunded.")
  }
  if (refundable.borrowStatus !== "returned") {
    throw new Error("The issued container must be returned before its deposit can be refunded.")
  }
  if (refundable.payment.currency !== NEW_DEPOSIT_CURRENCY) {
    throw new Error("Paystack test-mode refunds are only available for NGN deposits.")
  }
}

export function createPendingRefund(ledger: RefundLedger): { ledger: RefundLedger; created: boolean } {
  if (ledger.refund) return { ledger, created: false }
  const { payment } = ledger.refundable
  return {
    created: true,
    ledger: {
      ...ledger,
      refund: {
        id: `refund_${crypto.randomUUID().replaceAll("-", "")}`,
        paymentAttemptId: payment.id,
        providerReference: null,
        status: "pending",
        amountMinor: payment.amountMinor,
        currency: NEW_DEPOSIT_CURRENCY,
      },
    },
  }
}

export function applyBrowserRefundResponse(ledger: RefundLedger): RefundLedger {
  return ledger
}

export function applyPaystackRefundOutcome(
  ledger: RefundLedger,
  event: {
    event?: string
    data?: {
      transaction_reference?: string
      refund_reference?: string | number | null
      amount?: string | number
      currency?: string
      status?: string
    }
  },
  eventDigest: string,
): { ledger: RefundLedger; duplicate: boolean } | null {
  if (ledger.processedEventDigests.includes(eventDigest)) return { ledger, duplicate: true }
  const refund = ledger.refund
  const data = event.data
  if (!refund || !data) return null
  if (data.transaction_reference !== ledger.refundable.payment.providerReference) return null
  if (Number(data.amount) !== refund.amountMinor || data.currency !== refund.currency) return null
  const status = event.event === "refund.processed" && data.status === "processed"
    ? "refunded"
    : event.event === "refund.failed" && data.status === "failed"
      ? "failed"
      : null
  if (!status) return null
  if (refund.status !== "pending") {
    return {
      duplicate: true,
      ledger: { ...ledger, processedEventDigests: [...ledger.processedEventDigests, eventDigest] },
    }
  }
  return {
    duplicate: false,
    ledger: {
      ...ledger,
      refundable: {
        ...ledger.refundable,
        depositStatus: status === "refunded" ? "refunded" : ledger.refundable.depositStatus,
      },
      refund: { ...refund, status },
      processedEventDigests: [...ledger.processedEventDigests, eventDigest],
    },
  }
}
