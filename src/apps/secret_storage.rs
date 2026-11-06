//! Required native authenticated encryption and exact errors for shared app secret persistence; platform keys never leave this owner.
use super::*;
use veyndo_app_storage::secrets as shared;
pub(super) struct Crypto;
impl shared::Crypto for Crypto {
    type Error = Error;
    fn seal(&self, binding: &str, plaintext: &str) -> Result<String> {
        veyndo::inference::settings::seal(binding, plaintext).map_err(|_| {
            Error(
                StatusCode::SERVICE_UNAVAILABLE,
                "Platform secret encryption is unavailable".into(),
            )
        })
    }
    fn open(&self, binding: &str, ciphertext: &str) -> Result<String> {
        veyndo::inference::settings::open(binding, ciphertext).map_err(|_| {
            Error(
                StatusCode::SERVICE_UNAVAILABLE,
                "App secret cannot be decrypted; check the platform key".into(),
            )
        })
    }
}
pub(super) fn error(value: shared::SecretError<Error>) -> Error {
    match value {
        shared::SecretError::Database(e) => e.into(),
        shared::SecretError::Invalid(s) => bad(s),
        shared::SecretError::Conflict(s) => conflict(s),
        shared::SecretError::Crypto(e) => e,
    }
}
pub(super) async fn metadata(
    a: &App,
    tenant: &str,
    app: &str,
    kind: &str,
) -> Result<Option<shared::Metadata>> {
    let mut tx = a.db.begin().await?;
    let row = shared::metadata(&mut tx, veyndo_app_storage::Scope { tenant, app }, kind).await?;
    tx.commit().await?;
    Ok(row)
}
