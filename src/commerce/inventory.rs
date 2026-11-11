//! All-checkout allocation ledger; release is idempotent and always uses persisted quantities, never edited order JSON.
use crate::Result;
use veyndo_commerce::inventory::InventoryLines;
pub(crate) async fn allocate(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    tenant: &str,
    lines: &InventoryLines<'_>,
    order: &str,
) -> Result<()> {
    sqlx::query("INSERT INTO order_inventory_reservations(tenant,order_id,product_id,quantity) SELECT $1,$2,id,quantity FROM unnest($3::text[],$4::int[]) AS items(id,quantity)")
        .bind(tenant).bind(order).bind(lines.ids()).bind(lines.quantities()).execute(&mut **tx).await?;
    Ok(())
}
pub(crate) async fn release(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    tenant: &str,
    order: &str,
) -> Result<()> {
    sqlx::query(include_str!("inventory_release.sql"))
        .bind(tenant)
        .bind(order)
        .execute(&mut **tx)
        .await?;
    Ok(())
}

/// Checkout already holds product locks in ID order; do not release/reacquire them here.
pub(crate) async fn consume(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    tenant: &str,
    lines: &InventoryLines<'_>,
) -> Result<()> {
    sqlx::query("UPDATE products p SET stock=p.stock-i.quantity,revision=p.revision+1 FROM unnest($2::text[],$3::int[]) AS i(id,quantity) WHERE p.tenant=$1 AND p.id=i.id")
        .bind(tenant).bind(lines.ids()).bind(lines.quantities()).execute(&mut **tx).await?;
    Ok(())
}
