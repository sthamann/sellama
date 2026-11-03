//! Native payment operation descriptions, composed by the canonical operation registry.
pub(crate) const CAPABILITIES: &[(&str, &str)] = &[
    (
        "checkout.payment.instructions",
        "Read recipient instructions for the original customer checkout",
    ),
    (
        "merchant.payment.instructions",
        "Read owned invoice recipient instructions with order and PII access",
    ),
    (
        "merchant.payment",
        "Explicitly approved idempotent provider command",
    ),
    (
        "merchant.payment.details",
        "Read native payment history and provider transaction fees",
    ),
    (
        "merchant.payment.providers",
        "Read installed payment contracts and merchant account readiness",
    ),
    (
        "merchant.payment.onboarding",
        "Approved provider onboarding scoped to merchant and sales channel",
    ),
];
