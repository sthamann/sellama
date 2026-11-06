//! Native currency/content/asset policy adapters for the shared pure field validator.
use super::*;
pub(super) struct Policy;
impl veyndo_app_model::fields::ValuePolicy for Policy {
    fn locale(&self, key: &str) -> bool {
        commerce::valid_locale_key(key)
    }
    fn money(&self, value: &Value) -> bool {
        money(value)
    }
    fn richtext(&self, value: &Value) -> bool {
        assets::validate_rich(value).is_ok()
    }
    fn relations(&self, value: &Value) -> bool {
        relations::valid(value)
    }
}
pub(super) fn validate(e: &Entity, value: &Value) -> Result<()> {
    veyndo_app_model::fields::validate(e, value, &Policy).map_err(model_contract::error)
}
#[cfg(test)]
fn value(f: &Field, value: &Value) -> bool {
    veyndo_app_model::fields::value(f, value, &Policy)
}
fn money(v: &Value) -> bool {
    let Ok(m) = serde_json::from_value::<veyndo::money::Money>(v.clone()) else {
        return false;
    };
    currencies::scale(m.currency().code())==Some(m.currency().scale())
        && v.as_object().is_some_and(|o|o.len()==2)
        && v["currency"].as_object().is_some_and(|o|o.len()==2)
        // JSON clients must not lose precision. Larger amounts require a future string minor-unit wire revision.
        && m.minor().unsigned_abs()<=9_007_199_254_740_991
}
pub(super) async fn references(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    e: &Entity,
    v: &Value,
) -> Result<()> {
    for f in e
        .fields
        .iter()
        .filter(|f| matches!(f.kind.as_str(), "image" | "file"))
    {
        let Some(id) = v[&f.name].as_str() else {
            continue;
        };
        let owned:bool=sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM product_assets WHERE tenant=$1 AND id=$2 AND ($3<> 'image' OR mime LIKE 'image/%') AND (NOT $4 OR public AND kind='attachment'))").bind(t).bind(id).bind(&f.kind).bind(e.public_read).fetch_one(&mut **tx).await?;
        if !owned {
            return Err(bad(
                "App asset is missing, private, or belongs to another shop",
            ));
        }
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    fn field(kind: &str) -> Field {
        serde_json::from_value(json!({"name":"value","kind":kind})).unwrap()
    }
    #[test]
    fn exact_typed_values_reject_coercion_invalid_dates_and_currency_scale() {
        for (kind, v) in [
            ("date", json!("2026-02-29")),
            ("datetime", json!("2026-10-08")),
            ("decimal", json!(0.1)),
            ("decimal", json!("1e3")),
            (
                "money",
                json!({"minor":123,"currency":{"code":"JPY","scale":2}}),
            ),
            (
                "richtext",
                json!({"en":[{"type":"image","url":"javascript:alert(1)"}]}),
            ),
        ] {
            assert!(!value(&field(kind), &v));
        }
        for (kind, v) in [
            ("date", json!("2024-02-29")),
            ("datetime", json!("2026-10-08T12:00:00Z")),
            ("decimal", json!("123456789012345678.12345678")),
            (
                "money",
                json!({"minor":123,"currency":{"code":"JPY","scale":0}}),
            ),
        ] {
            assert!(value(&field(kind), &v));
        }
    }
}
