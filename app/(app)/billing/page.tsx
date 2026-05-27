"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PlanTier {
  name: string;
  priceId: string;
  price: string;
  interval: string;
  features: string[];
  highlighted?: boolean;
}

const PLANS: PlanTier[] = [
  {
    name: "Starter",
    priceId: "price_starter_monthly",
    price: "$9",
    interval: "month",
    features: [
      "Self-guided training",
      "Progress tracking",
      "Workout logging",
    ],
  },
  {
    name: "Pro",
    priceId: "price_pro_monthly",
    price: "$29",
    interval: "month",
    features: [
      "Everything in Starter",
      "Coach pairing",
      "Form assessments",
      "Personalized notes",
    ],
    highlighted: true,
  },
  {
    name: "Elite",
    priceId: "price_elite_monthly",
    price: "$59",
    interval: "month",
    features: [
      "Everything in Pro",
      "Priority coaching",
      "Custom program design",
      "Weekly check-ins",
    ],
  },
];

export default function BillingPage() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_plan, subscription_period_end")
        .eq("id", user.id)
        .single();

      if (profile) {
        setSubscriptionStatus(profile.subscription_status);
        setSubscriptionPlan(profile.subscription_plan);
        setPeriodEnd(profile.subscription_period_end);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleCheckout(priceId: string) {
    setCheckoutLoading(priceId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to open billing portal");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPortalLoading(false);
    }
  }

  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";
  const currentPlan = PLANS.find((p) => p.priceId === subscriptionPlan);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-content-primary font-display">Billing</h1>
        <div className="h-48 bg-bg-elevated rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-content-primary font-display">Billing</h1>
        <p className="text-sm text-content-secondary mt-1">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Current subscription status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {isActive ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-content-muted" />
            )}
            <span className="text-sm font-medium text-content-primary">
              {isActive
                ? `Active — ${currentPlan?.name ?? "Subscribed"}`
                : "No active subscription"}
            </span>
          </div>
          {periodEnd && isActive && (
            <p className="text-xs text-content-secondary">
              Next billing date:{" "}
              {new Date(periodEnd).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          {isActive && (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-border-subtle rounded-lg text-sm font-medium text-content-primary hover:bg-bg-hover transition-colors disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              {portalLoading ? "Opening..." : "Manage Subscription"}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div>
        <h2 className="text-lg font-semibold text-content-primary mb-4">
          {isActive ? "Change Plan" : "Choose a Plan"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.priceId === subscriptionPlan;
            return (
              <Card
                key={plan.priceId}
                className={
                  plan.highlighted
                    ? "border-accent border-2"
                    : ""
                }
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-content-primary">
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-content-primary">
                      {plan.price}
                    </span>
                    <span className="text-sm text-content-muted">
                      /{plan.interval}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-content-secondary"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="w-full py-2 text-center text-sm font-medium text-content-muted border border-border-subtle rounded-lg">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.priceId)}
                      disabled={checkoutLoading !== null}
                      className="w-full py-2 px-4 bg-accent text-button-text rounded-lg hover:bg-accent-dim transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {checkoutLoading === plan.priceId
                        ? "Redirecting..."
                        : isActive
                          ? "Switch Plan"
                          : "Subscribe"}
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
