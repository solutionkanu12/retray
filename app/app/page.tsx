import { AccountOnboarding } from "@/components/account-onboarding"
import { ConsumerDashboard } from "@/components/consumer-dashboard"
import { OperatorDashboard } from "@/components/operator-dashboard"
import { ProductHeader } from "@/components/product-header"
import { getConsumerBorrows, getOperatorDashboard, syncAuthenticatedUser } from "@/lib/retray-data"

import { requireChatGPTUser } from "../chatgpt-auth"

type ProductPageProps = {
  searchParams: Promise<{
    venue?: string
    notice?: string
    error?: string
  }>
}

export default async function ProductPage(props: ProductPageProps) {
  try {
    return await renderProductPage(props)
  } catch (error) {
    console.error("ReTray product page failed", error)
    throw error
  }
}

async function renderProductPage({ searchParams }: ProductPageProps) {
  const params = await searchParams
  const identity = await requireChatGPTUser("/app")
  const user = await syncAuthenticatedUser({
    userId: identity.userId,
    email: identity.email,
    displayName: identity.displayName,
  })

  if (!user.accountType) {
    return <AccountOnboarding displayName={user.displayName} />
  }

  if (user.accountType === "business_operator") {
    const dashboard = await getOperatorDashboard(user, params.venue)
    return (
      <div className="product-shell">
        <ProductHeader accountLabel="Operator" displayName={user.displayName} venueName={dashboard.venue?.name} />
        <ProductMessage error={params.error} notice={params.notice} />
        <OperatorDashboard dashboard={dashboard} />
      </div>
    )
  }

  const consumerBorrows = await getConsumerBorrows(user)
  return (
    <div className="product-shell">
      <ProductHeader accountLabel="Consumer" displayName={user.displayName} />
      <ProductMessage error={params.error} notice={params.notice} />
      <ConsumerDashboard borrows={consumerBorrows} />
    </div>
  )
}

function ProductMessage({ error, notice }: { error?: string; notice?: string }) {
  const message = error ?? notice
  if (!message) return null
  return <p className={`product-message ${error ? "is-error" : ""}`} role={error ? "alert" : "status"}>{message}</p>
}
