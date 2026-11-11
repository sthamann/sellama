//! Shared static validation errors carry no private values or transport authority.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ValidationError(&'static str);
impl ValidationError {
    pub(crate) fn new(message: &'static str) -> Self {
        Self(message)
    }
}
impl std::fmt::Display for ValidationError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(self.0)
    }
}
impl std::error::Error for ValidationError {}
