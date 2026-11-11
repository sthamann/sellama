//! Portable customer contact and address contracts; credentials, identity and PII authorization belong to hosts.
mod address;
mod contact;
pub use crate::ValidationError;
pub use address::Address;
pub use contact::Contact;
#[cfg(test)]
mod contract_tests;

/// Original wire default for older addresses, not an admission of a selling country.
pub fn country_default() -> String {
    "DE".into()
}
