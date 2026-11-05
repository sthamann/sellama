//! Shared package fence prevents native record or document writes racing contract upgrades.
use super::*;
pub(crate) async fn lock_package_write(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    m: &Manifest,
) -> Result<()> {
    let installed = veyndo_app_storage::packages::lock(
        tx,
        veyndo_app_storage::Scope {
            tenant: t,
            app: &m.id,
        },
    )
    .await?;
    let current: Manifest = serde_json::from_value(
        installed.ok_or(conflict("App is no longer active; reopen its view"))?,
    )
    .map_err(|_| bad("Invalid installed app contract"))?;
    if approval::canonical_digest(&current) != approval::canonical_digest(m) {
        return Err(conflict(
            "App package changed during this write; reopen its view",
        ));
    }
    Ok(())
}
