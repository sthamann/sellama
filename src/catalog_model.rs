//! Hydrate the shared Commerce product contract through the native tenant-scoped database.
use crate::*;
pub(crate) use veyndo::catalog::Product;
pub(crate) fn product(r: &sqlx::postgres::PgRow) -> Product {
    Product {
        extra: r.get("extra"),
        parent_id: r.get("parent_id"),
        options: r.get("options"),
        media: r.get("media"),
        properties: r.get("properties"),
        delivery_days: r.get("delivery_days"),
        id: r.get("id"),
        product_number: r
            .get::<Option<String>, _>("product_number")
            .unwrap_or_else(|| r.get("id")),
        name: r.get("name"),
        category: r.get("category"),
        description: r.get("description"),
        price: r.get("price"),
        tax_rate: r.get("tax_rate"),
        stock: r.get("stock"),
        revision: r.get("revision"),
        list_price: r.get("list_price"),
        regulation_price: r.get("regulation_price"),
        advanced_prices: serde_json::from_value(r.get::<Value, _>("advanced_prices"))
            .unwrap_or_default(),
        min_purchase: r.get::<i32, _>("min_purchase") as u32,
        purchase_steps: r.get::<i32, _>("purchase_steps") as u32,
        max_purchase: r.get::<Option<i32>, _>("max_purchase").map(|v| v as u32),
        reference_price: r
            .get::<Option<Value>, _>("reference_price")
            .and_then(|v| serde_json::from_value(v).ok()),
    }
}
pub(crate) async fn prototype_products(a: &App, t: &str) -> Result<Vec<Product>> {
    Ok(sqlx::query(
        "SELECT * FROM products WHERE tenant=$1 AND parent_id IS NULL AND active ORDER BY id LIMIT 101",
    )
    .bind(t)
    .fetch_all(&a.db)
    .await?
    .iter()
    .map(product)
    .collect())
}
