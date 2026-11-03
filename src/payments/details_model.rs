//! Typed, PII-free provider transaction details; these observations never mutate native payment state.
use super::Attempt;
use crate::{Result, bad, currencies};
use serde::{Deserialize, Serialize};
#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Amount {
    pub amount_minor: i64,
    pub currency: String,
    pub currency_scale: u32,
}
#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Fee {
    pub kind: String,
    pub amount: Amount,
}
#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Entry {
    pub id: String,
    pub status: String,
    pub amount_minor: i64,
    pub currency: String,
    pub currency_scale: u32,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub final_capture: Option<bool>,
    #[serde(default)]
    pub fees: Vec<Fee>,
    pub fee: Option<Amount>,
    pub net: Option<Amount>,
}
#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Details {
    pub reference: String,
    pub status: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub captures: Vec<Entry>,
    pub authorizations: Vec<Entry>,
    pub refunds: Vec<Entry>,
}
fn status(s: &str) -> bool {
    !s.is_empty() && s.len() <= 40 && s.bytes().all(|b| b.is_ascii_uppercase() || b == b'_')
}
fn date(s: Option<&str>) -> bool {
    s.is_none_or(|s| s.len() <= 40 && chrono::DateTime::parse_from_rfc3339(s).is_ok())
}
impl Amount {
    fn validate(&self) -> Result<()> {
        if self.amount_minor < 0
            || self.amount_minor > 9_007_199_254_740_991
            || currencies::scale(&self.currency).map(u32::from) != Some(self.currency_scale)
        {
            return Err(bad("Invalid provider fee amount or currency precision"));
        }
        Ok(())
    }
}
impl Details {
    pub fn validate(&self, p: &Attempt) -> Result<()> {
        if p.provider_order.as_deref() != Some(&self.reference)
            || !status(&self.status)
            || !date(self.created_at.as_deref())
            || !date(self.updated_at.as_deref())
        {
            return Err(bad("Invalid provider transaction identity or date"));
        }
        for rows in [&self.captures, &self.authorizations, &self.refunds] {
            if rows.len() > 1000 {
                return Err(bad("Too many provider transaction entries"));
            }
            let mut seen = std::collections::HashSet::new();
            for row in rows {
                super::generic_receipts::reference(&crate::json!(row.id))?;
                if !seen.insert(&row.id)
                    || !status(&row.status)
                    || row.currency != p.currency
                    || row.currency_scale != p.currency_scale as u32
                    || row.amount_minor <= 0
                    || row.amount_minor > p.amount
                    || !date(row.created_at.as_deref())
                    || !date(row.updated_at.as_deref())
                {
                    return Err(bad("Invalid provider transaction entry"));
                }
                if row.fees.len() > 32 {
                    return Err(bad("Too many provider fee entries"));
                }
                for fee in &row.fees {
                    if !["provider", "platform"].contains(&fee.kind.as_str()) {
                        return Err(bad("Unknown transaction fee category"));
                    }
                    fee.amount.validate()?;
                }
                for amount in [&row.fee, &row.net].into_iter().flatten() {
                    amount.validate()?;
                }
            }
        }
        Ok(())
    }
}

#[cfg(test)]
#[path = "details_tests.rs"]
mod tests;
