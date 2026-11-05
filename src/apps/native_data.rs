//! App record translations use configured shop languages and field-level main-language inheritance.
use super::*;
pub(super) async fn validate_languages(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    e: &Entity,
    fields: &Value,
) -> Result<()> {
    let data: Value = sqlx::query_scalar("SELECT data FROM commerce_settings WHERE tenant=$1")
        .bind(t)
        .fetch_one(&mut **tx)
        .await?;
    let settings = commerce::decode_config(data)?;
    veyndo_app_model::language::validate(e, fields, &settings.locales, &settings.main_locale)
        .map_err(model_contract::error)
}
