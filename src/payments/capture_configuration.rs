//! Capture timing is versioned shop/channel configuration; every attempt freezes its admitted provider intent.
use crate::{Result, Value, apps, bad, commerce};

pub(super) fn intent<'a>(
    configured: Option<&'a str>,
    method: &'a super::ProviderMethod,
) -> Result<&'a str> {
    let intent = configured.unwrap_or(&method.intent);
    if !["capture", "authorize"].contains(&intent)
        || !method.capabilities.iter().any(|c| c == intent)
    {
        return Err(bad("Capture mode is not supported by this payment method"));
    }
    Ok(intent)
}
pub(crate) async fn validate(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    tenant: &str,
    settings: &commerce::Settings,
) -> Result<()> {
    let rows: Vec<Value> = sqlx::query_scalar(
        "SELECT manifest FROM app_packages WHERE tenant=$1 AND manifest ? 'paymentProvider'",
    )
    .bind(tenant)
    .fetch_all(&mut **tx)
    .await?;
    let manifests: Vec<apps::Manifest> = rows
        .into_iter()
        .map(serde_json::from_value)
        .collect::<std::result::Result<_, _>>()
        .map_err(|_| bad("Invalid installed payment provider"))?;
    for payment in settings
        .payments
        .iter()
        .filter(|p| p.capture_mode.is_some())
    {
        let method = manifests
            .iter()
            .find(|m| Some(&m.id) == payment.provider.as_ref())
            .and_then(|m| m.payment_provider.as_ref())
            .and_then(|p| {
                p.methods
                    .iter()
                    .find(|m| Some(&m.id) == payment.provider_method.as_ref())
            })
            .ok_or(bad(
                "Configured capture mode requires an installed payment provider",
            ))?;
        intent(payment.capture_mode.as_deref(), method)?;
    }
    Ok(())
}
