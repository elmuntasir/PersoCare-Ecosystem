# Subscription and billing philosophy

## Pricing

Reflects business value, not infrastructure cost. Plans may consider
monthly patient volume, number of doctors, staff accounts, storage,
AI request quotas, and SMS credits. The platform recommends a plan
automatically based on onboarding information (e.g. Starter, Growth,
Professional, Enterprise) to reduce decision fatigue.

## Billing flow

```
Healthcare Organization
        ↓
Subscription Payment
        ↓
Platform Subscription Activated
        ↓
Organization Receives Invoice
        ↓
Developer Pays Infrastructure Providers Separately
```

Infrastructure providers are completely invisible to the customer.
Infrastructure costs are an internal expense and never appear on
customer invoices. This separation means infrastructure providers can
change without affecting customer billing.

## Independent accounting

Track separately: Revenue, Infrastructure Costs, AI Costs, SMS Costs,
Email Costs, Profit.
