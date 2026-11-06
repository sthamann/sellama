//! Preserve native problem kinds, revision-conflict status and escaped JSON pointers across the pure model boundary.
use super::*;
pub(crate) fn error(error: veyndo_app_model::Error) -> Error {
    match error.kind {
        veyndo_app_model::Kind::Bad => bad(error.message),
        veyndo_app_model::Kind::Conflict => conflict(&error.message),
        veyndo_app_model::Kind::Validation => {
            Error::validation(error.pointer.as_deref().unwrap_or(""), error.message)
        }
    }
}
