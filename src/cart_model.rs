//! Bind the shared cart contract to native contexts and hydrate tenant-scoped stored carts.
use crate::*;

pub(crate) use veyndo::cart::Item;
pub(crate) type Cart = veyndo::cart::Cart<
    pos::Discount,
    b2b::Context,
    apps::Configuration,
    commerce::CheckoutSelection,
>;
#[derive(Clone)]
pub(crate) struct StoredCart {
    pub(crate) id: String,
    pub(crate) tenant: String,
    pub(crate) token: String,
    pub(crate) data: Cart,
    pub(crate) revision: i64,
    pub(crate) status: String,
}
pub(crate) fn stored(r: &sqlx::postgres::PgRow) -> Result<StoredCart> {
    let mut data: Value = r.get("data");
    apps::upgrade_cart(&mut data);
    Ok(StoredCart {
        id: r.get("id"),
        tenant: r.get("tenant"),
        token: r.get("token"),
        data: serde_json::from_value(data).map_err(|e| bad(e.to_string()))?,
        revision: r.get("revision"),
        status: r.get("status"),
    })
}
