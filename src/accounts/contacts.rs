//! Native customer projection; shared contact syntax never grants identity or PII access.
use crate::*;
pub(crate) use veyndo_commerce::customer::Contact;
pub(crate) fn customer_value(r: &sqlx::postgres::PgRow) -> Value {
    json!({"id":r.get::<String,_>("id"),"customerNumber":r.get::<String,_>("customer_number"),"email":r.get::<String,_>("email"),"profile":r.get::<Value,_>("profile"),"company":r.get::<Option<String>,_>("company"),"customerGroup":r.get::<String,_>("group_name"),"active":r.get::<bool,_>("active"),"revision":r.get::<i64,_>("revision"),"defaultBillingAddressId":r.get::<Option<String>,_>("default_billing_address_id"),"defaultShippingAddressId":r.get::<Option<String>,_>("default_shipping_address_id"),"createdAt":r.get::<String,_>("created")})
}
