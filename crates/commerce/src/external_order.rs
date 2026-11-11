//! Portable paid-order input and minor-unit reconciliation; host still verifies source authority and commits stock.
use crate::{ValidationError, customer::Address, verified_kernel};
use serde::{Deserialize, Serialize};
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PaidOrder {
    pub sales_channel_id: String,
    pub external_id: String,
    pub currency: String,
    pub locale: String,
    pub email: String,
    pub billing_address: Address,
    pub shipping_address: Address,
    pub lines: Vec<OrderLine>,
    pub shipping: SourceAmount,
    pub total_minor: i64,
    pub paid: bool,
}
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OrderLine {
    pub product_id: String,
    pub quantity: u32,
    pub amount: SourceAmount,
}
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SourceAmount {
    pub gross_minor: i64,
    pub tax_minor: i64,
    pub tax_rate_basis_points: u32,
}
impl SourceAmount {
    fn valid(&self) -> bool {
        let (Ok(gross), Ok(tax)) = (
            u64::try_from(self.gross_minor),
            u64::try_from(self.tax_minor),
        ) else {
            return false;
        };
        verified_kernel::external_amount_admissible(
            gross,
            tax,
            u64::from(self.tax_rate_basis_points),
        )
    }
}
impl PaidOrder {
    pub fn validate(&mut self) -> Result<(), ValidationError> {
        if self.sales_channel_id.is_empty()
            || self.sales_channel_id.len() > 100
            || self.external_id.is_empty()
            || self.external_id.len() > 100
            || self.external_id.chars().any(char::is_control)
            || self.lines.is_empty()
            || self.lines.len() > 24
            || self.email.len() > 254
            || !self.email.contains('@')
            || self.email.chars().any(char::is_control)
            || !self.shipping.valid()
        {
            return Err(ValidationError::new(
                "Complete paid source snapshot, contact and tax amounts required",
            ));
        }
        self.billing_address.validate()?;
        self.shipping_address.validate()?;
        let mut ids = std::collections::HashSet::new();
        let mut total = self.shipping.gross_minor;
        for l in &self.lines {
            if !(1..=10_000).contains(&l.quantity)
                || l.product_id.is_empty()
                || l.product_id.len() > 100
                || !ids.insert(&l.product_id)
                || !l.amount.valid()
            {
                return Err(ValidationError::new(
                    "Invalid or duplicate external order line",
                ));
            }
            total = total
                .checked_add(l.amount.gross_minor)
                .ok_or(ValidationError::new("External order amount overflow"))?;
        }
        let declared = u64::try_from(self.total_minor)
            .map_err(|_| ValidationError::new("Negative external order total"))?;
        let calculated = u64::try_from(total)
            .map_err(|_| ValidationError::new("Negative external order sum"))?;
        if !verified_kernel::external_paid_total_admissible(self.paid, calculated, declared) {
            return Err(ValidationError::new(
                "External order totals do not reconcile",
            ));
        }
        Ok(())
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn source_amount_boundaries_are_not_guessed() {
        let valid = |gross_minor, tax_minor, tax_rate_basis_points| {
            SourceAmount {
                gross_minor,
                tax_minor,
                tax_rate_basis_points,
            }
            .valid()
        };
        assert!(valid(0, 0, 0));
        assert!(valid(1_000_000_000_000, 1_000_000_000_000, 100_000));
        for (gross, tax, rate) in [
            (-1, 0, 0),
            (1, -1, 1),
            (1, 2, 1),
            (1, 1, 0),
            (1, 0, 100_001),
            (1_000_000_000_001, 0, 1),
            (i64::MAX, 0, 1),
        ] {
            assert!(!valid(gross, tax, rate));
        }
        assert!(!verified_kernel::external_paid_total_admissible(true, 0, 0));
        assert!(!verified_kernel::external_paid_total_admissible(true, 1, 2));
        assert!(!verified_kernel::external_paid_total_admissible(
            false, 1, 1
        ));
    }
    #[test]
    fn rejects_repricing_guesses_overflow_and_duplicate_stock() {
        let addr = json!({"name":"Test Buyer","street":"Lane 1","postalCode":"10115","city":"Berlin","country":"DE"});
        let mut v = json!({"salesChannelId":"market","externalId":"external-1","currency":"EUR","locale":"de-DE","email":"buyer@example.test","billingAddress":addr,"shippingAddress":addr,"lines":[{"productId":"lamp","quantity":2,"amount":{"grossMinor":2000,"taxMinor":319,"taxRateBasisPoints":1900}}],"shipping":{"grossMinor":0,"taxMinor":0,"taxRateBasisPoints":0},"totalMinor":2000,"paid":true});
        assert!(
            serde_json::from_value::<PaidOrder>(v.clone())
                .unwrap()
                .validate()
                .is_ok()
        );
        for (key, value) in [("paid", json!(false)), ("totalMinor", json!(1999))] {
            let mut badv = v.clone();
            badv[key] = value;
            assert!(
                serde_json::from_value::<PaidOrder>(badv)
                    .unwrap()
                    .validate()
                    .is_err()
            );
        }
        v["lines"][0]["amount"]["taxRateBasisPoints"] = json!(0);
        assert!(
            serde_json::from_value::<PaidOrder>(v.clone())
                .unwrap()
                .validate()
                .is_err()
        );
        v["lines"][0]["amount"]["taxRateBasisPoints"] = json!(1900);
        let duplicate = v["lines"][0].clone();
        v["lines"].as_array_mut().unwrap().push(duplicate);
        assert!(
            serde_json::from_value::<PaidOrder>(v)
                .unwrap()
                .validate()
                .is_err()
        );
    }
}
