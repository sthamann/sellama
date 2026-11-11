//! Portable customer contact and address contracts; credentials, identity and PII authorization belong to hosts.
mod address;
mod contact;
pub use address::Address;
pub use contact::Contact;
#[cfg(test)]
mod contract_tests;

/// Original wire default for older addresses, not an admission of a selling country.
pub fn country_default() -> String {
    "DE".into()
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ValidationError(&'static str);
impl ValidationError {
    fn new(message: &'static str) -> Self {
        Self(message)
    }
}
impl std::fmt::Display for ValidationError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(self.0)
    }
}
impl std::error::Error for ValidationError {}
