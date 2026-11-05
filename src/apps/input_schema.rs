//! Native API/MCP error adapter for the independent bounded schema validator.
use super::*;
pub(crate) fn validate(schema: &Value, value: &Value) -> Result<()> {
    veyndo_app_model::schema::validate(schema, value).map_err(model_contract::error)
}
pub(crate) fn validate_native(schema: &Value, value: &Value) -> Result<()> {
    veyndo_app_model::schema::validate_native(schema, value).map_err(model_contract::error)
}
pub(crate) fn validate_value(schema: &Value, value: &Value) -> Result<()> {
    veyndo_app_model::schema::validate_value(schema, value).map_err(model_contract::error)
}
pub(crate) fn validate_contract(schema: &Value) -> Result<()> {
    veyndo_app_model::schema::validate_contract(schema).map_err(model_contract::error)
}
#[cfg(test)]
#[path = "input_schema_tests.rs"]
mod tests;
