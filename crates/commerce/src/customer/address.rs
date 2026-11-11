//! Shared address wire contract and original bounded syntax normalization; hosts retain geography admission.
use super::{ValidationError, country_default};
use serde::{Deserialize, Serialize};
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Address {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub first_name: String,
    #[serde(default)]
    pub last_name: String,
    #[serde(default)]
    pub salutation_id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub company: String,
    #[serde(default)]
    pub department: String,
    #[serde(default)]
    pub vat_id: String,
    pub street: String,
    #[serde(alias = "zipcode")]
    pub postal_code: String,
    pub city: String,
    #[serde(default = "country_default")]
    pub country: String,
    #[serde(default)]
    pub country_state_id: String,
    #[serde(default)]
    pub additional_address_line1: String,
    #[serde(default)]
    pub additional_address_line2: String,
    #[serde(default)]
    pub phone_number: String,
}
impl Address {
    pub fn validate(&mut self) -> Result<(), ValidationError> {
        if self.name.trim().is_empty() {
            self.name = format!("{} {}", self.first_name.trim(), self.last_name.trim())
                .trim()
                .into();
        }
        for s in [&self.name, &self.street, &self.postal_code, &self.city] {
            if s.trim().is_empty() || s.len() > 160 {
                return Err(ValidationError::new(
                    "Complete address fields required (maximum 160 characters)",
                ));
            }
        }
        if self.country.len() != 2 || !self.country.bytes().all(|c| c.is_ascii_uppercase()) {
            return Err(ValidationError::new(
                "Address country must be an ISO country code",
            ));
        }
        for s in [
            &self.first_name,
            &self.last_name,
            &self.salutation_id,
            &self.title,
            &self.company,
            &self.department,
            &self.vat_id,
            &self.country_state_id,
            &self.additional_address_line1,
            &self.additional_address_line2,
            &self.phone_number,
        ] {
            if s.len() > 160 || s.chars().any(|c| c.is_control()) {
                return Err(ValidationError::new("Invalid address field"));
            }
        }
        Ok(())
    }
}
