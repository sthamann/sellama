//! Opaque native checkout states retain the original transaction and prepared package/language inputs.
use crate::{Sandbox, StoredCart, Value, apps, commerce};
use std::{collections::HashMap, sync::Arc};
pub(super) struct Prepared {
    pub admitted: StoredCart,
    pub prepared_apps: HashMap<String, Arc<Sandbox>>,
    pub prepared_hooks: apps::PreparedCheckoutHooks,
    pub prepared_policy: Option<Arc<Sandbox>>,
    pub language_chain: Vec<String>,
    pub locale_chain: Vec<String>,
}
pub(super) struct Locked {
    pub tx: sqlx::Transaction<'static, sqlx::Postgres>,
    pub cart: StoredCart,
    pub prepared: Prepared,
    pub fingerprint: String,
}
pub(super) struct Priced {
    pub q: Value,
    pub config: commerce::Settings,
    pub money: veyndo::money::Money,
    pub minor: i64,
    pub selected: commerce::CheckoutSelection,
    pub legal_snapshot: Value,
}
pub(super) struct Committed {
    pub order: Value,
    pub cart: StoredCart,
    pub method: String,
}
