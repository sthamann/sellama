//! Signed publisher namespaces and tenant-local dependency/version gates. Operator service access still requires its separate exact digest pin.
use super::*;
use base64::{Engine as _, engine::general_purpose::STANDARD};
use veyndo_app_model::distribution as shared;
#[cfg(test)]
use veyndo_app_model::distribution::Distribution;
fn message(m: &Manifest) -> Vec<u8> {
    veyndo_app_model::manifest::signature_message(m).expect("Signed package")
}
pub(super) struct NativeVerifier<'a>(pub(super) &'a Value);
impl shared::SignatureVerifier for NativeVerifier<'_> {
    type Error = Error;
    fn verify_signature(&self, m: &Manifest) -> Result<()> {
        let d = m.distribution.as_ref().expect("Signed package");
        let public = self.0[&d.publisher][&d.key_id].as_str().ok_or(Error(
            StatusCode::FORBIDDEN,
            "Publisher key is not registered by the operator".into(),
        ))?;
        let key = STANDARD
            .decode(public)
            .map_err(|_| bad("Invalid registered publisher public key"))?;
        let signature = STANDARD
            .decode(&d.signature)
            .map_err(|_| bad("Invalid package signature encoding"))?;
        ring::signature::UnparsedPublicKey::new(&ring::signature::ED25519, key)
            .verify(&message(m), &signature)
            .map_err(|_| {
                Error(
                    StatusCode::FORBIDDEN,
                    "Package signature does not match its content".into(),
                )
            })?;
        Ok(())
    }
}
fn verify(m: &Manifest, keys: &Value) -> Result<()> {
    shared::verify(m, &NativeVerifier(keys)).map_err(|e| match e {
        shared::VerifyError::Model(e) => model_contract::error(e),
        shared::VerifyError::Host(e) => e,
    })
}
pub(super) fn unsigned_namespace(m: &Manifest) -> Result<()> {
    // A local unsigned app cannot occupy a registered publisher's namespace.
    if m.distribution.is_none()
        && crate::runtime_config::get()
            .publishers
            .as_object()
            .unwrap()
            .keys()
            .any(|publisher| m.id.starts_with(&format!("{publisher}_")))
    {
        return Err(Error(
            StatusCode::FORBIDDEN,
            "Registered publisher namespaces require signed packages".into(),
        ));
    }
    Ok(())
}
pub(super) async fn dependencies(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    m: &Manifest,
) -> Result<()> {
    let Some(d) = &m.distribution else {
        return Ok(());
    };
    for dep in &d.dependencies {
        let row=sqlx::query("SELECT manifest,version FROM app_packages WHERE tenant=$1 AND id=$2 AND active FOR SHARE").bind(t).bind(&dep.app).fetch_optional(&mut **tx).await?.ok_or(conflict("Install and activate required app dependencies first"))?;
        let prior: Manifest = serde_json::from_value(row.get("manifest"))
            .map_err(|_| bad("Invalid dependency package"))?;
        verify(&prior, &crate::runtime_config::get().publishers)?;
        shared::require_version(dep, &prior, &row.get::<String, _>("version"))
            .map_err(model_contract::error)?;
    }
    // Upgrading an existing dependency cannot silently break active installed dependants.
    let rows =
        sqlx::query("SELECT manifest FROM app_packages WHERE tenant=$1 AND id<>$2 AND active")
            .bind(t)
            .bind(&m.id)
            .fetch_all(&mut **tx)
            .await?;
    let installed: Vec<Value> = rows.into_iter().map(|r| r.get("manifest")).collect();
    shared::validate_graph(m, &installed).map_err(model_contract::error)
}
/// Offline signing shares the server canonical representation. The 32-byte seed is supplied on stdin, never logged.
pub(crate) fn sign_package() {
    use ring::signature::KeyPair;
    use std::io::Read;
    let path = env::args()
        .nth(2)
        .expect("Usage: veyndo --sign-app MANIFEST.json < BASE64_SEED_FILE");
    let mut m: Manifest = serde_json::from_slice(&std::fs::read(path).expect("Read manifest"))
        .expect("Typed manifest");
    assert!(
        m.distribution.is_some(),
        "Add publisher/keyId/channel/distribution metadata first"
    );
    let mut secret = String::new();
    std::io::stdin()
        .take(100)
        .read_to_string(&mut secret)
        .expect("Read seed from stdin");
    let mut bytes = STANDARD
        .decode(secret.trim())
        .expect("Base64 32-byte Ed25519 seed");
    secret.clear();
    let pair =
        ring::signature::Ed25519KeyPair::from_seed_unchecked(&bytes).expect("32-byte Ed25519 seed");
    bytes.fill(0);
    m.distribution.as_mut().unwrap().signature = STANDARD.encode(pair.sign(&message(&m)).as_ref());
    // Public material is useful to register the publisher; private material is never emitted.
    println!(
        "{}",
        json!({"manifest":m,"publicKey":STANDARD.encode(pair.public_key().as_ref())})
    );
}
#[cfg(test)]
mod tests {
    use super::*;
    use ring::signature::KeyPair;
    #[test]
    fn publisher_signature_covers_permissions_and_channel() {
        let seed = [7u8; 32];
        let key = ring::signature::Ed25519KeyPair::from_seed_unchecked(&seed).unwrap();
        let mut m: Manifest = serde_json::from_str(include_str!(
            "../../extensions/apps/engraving/manifest.json"
        ))
        .unwrap();
        m.id = "fixture_engraving".into();
        m.distribution = Some(Distribution {
            publisher: "fixture".into(),
            key_id: "first".into(),
            signature: String::new(),
            channel: "stable".into(),
            dependencies: vec![],
        });
        m.distribution.as_mut().unwrap().signature =
            STANDARD.encode(key.sign(&message(&m)).as_ref());
        let keys = json!({"fixture":{"first":STANDARD.encode(key.public_key().as_ref())}});
        assert!(verify(&m, &keys).is_ok());
        m.permissions.push("customers.pii".into());
        assert!(verify(&m, &keys).is_err());
        m.permissions.pop();
        m.distribution.as_mut().unwrap().channel = "beta".into();
        assert!(verify(&m, &keys).is_err());
        assert!(verify(&m, &json!({})).is_err());
    }
}
