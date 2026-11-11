//! Native legacy price projection from exact imported minor-unit amounts; provider authority remains outside this adapter.
use crate::{Value, json};
pub(super) use veyndo_commerce::external_order::PaidOrder as Input;
use veyndo_commerce::external_order::SourceAmount;
pub(super) fn source_price(amount: &SourceAmount, scale: u8, quantity: u32) -> Value {
    let factor = 10_i64.pow(scale.into()) as f64;
    let gross = amount.gross_minor as f64 / factor;
    json!({"unitPrice":gross/f64::from(quantity),"totalPrice":gross,
          "totalMinor":amount.gross_minor.to_string(),"taxMinor":amount.tax_minor.to_string(),
          "calculatedTaxes":[{"tax":amount.tax_minor as f64/factor,"taxRate":f64::from(amount.tax_rate_basis_points)/100.,"price":gross}]})
}
