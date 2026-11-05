//! Translate storage-port failures into the existing native HTTP/MCP domain errors.
use super::*;
pub(super) fn error(value: veyndo_app_storage::Error) -> Error {
    match value {
        veyndo_app_storage::Error::Database(error) => error.into(),
        veyndo_app_storage::Error::Conflict(message) => conflict(message),
        veyndo_app_storage::Error::Quota(message) => {
            Error(StatusCode::TOO_MANY_REQUESTS, message.into())
        }
    }
}
