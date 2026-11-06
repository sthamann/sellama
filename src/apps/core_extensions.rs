//! Namespaced core-object extension contracts; native records, rights and app storage keep their owners.
#[cfg(test)]
use super::Manifest;
use super::{Entity, model_contract};
use crate::{RequestContext, Result, auth};

pub(crate) use veyndo_app_model::Object;

#[cfg(test)]
pub(super) fn validate(m: &Manifest) -> Result<()> {
    veyndo_app_model::object_extensions::validate(&m.entities, &m.actions, &m.permissions)
        .map_err(model_contract::error)
}

pub(crate) fn access(e: &Entity, h: &RequestContext, write: bool) -> Result<()> {
    if let Some(x) = &e.extends {
        for scope in x.object.scopes(write) {
            auth::permit(h, scope)?;
        }
    }
    Ok(())
}

pub(crate) fn configuration(e: &Entity) -> bool {
    let object = e.extends.as_ref().map(|x| x.object);
    crate::verified_kernel::app_configuration_release_admissible(
        e.extends.is_some(),
        object == Some(Object::Product),
        object == Some(Object::Company),
        e.operational == Some(true),
    )
}

pub(super) fn compatible(old: &Entity, next: &Entity) -> Result<()> {
    veyndo_app_model::evolution::compatible(old, next).map_err(model_contract::error)
}

pub(crate) async fn descriptions(
    a: &crate::App,
    h: &RequestContext,
    object: Object,
) -> Result<serde_json::Value> {
    super::extension_projection::descriptions(a, h, object).await
}

/// Native lists and details share one bounded, permission-filtered app projection.
pub(crate) async fn attach(
    a: &crate::App,
    h: &RequestContext,
    object: Object,
    rows: &mut [serde_json::Value],
) -> Result<()> {
    super::extension_projection::attach(a, h, object, rows).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    fn package(object: Object) -> Manifest {
        serde_json::from_value(json!({
            "id":"native_notes","version":"1.0.0","coreApi":"1","runtime":"declarative",
            "name":{"en-GB":"Notes"},"permissions":["data.read","data.write"],
            "entities":[{"name":"notes","extends":{"version":1,"object":object,"field":"owner"},
                "fields":[{"name":"owner","kind":"string","required":true,"indexed":true,"unique":true,"coreReference":object.reference()}]}],
            "actions":[{"name":"read","description":"Read","handler":"list","entity":"notes","inputSchema":{"type":"object"},"requiredPermissions":object.scopes(false)},
                {"name":"write","description":"Write","handler":"save","entity":"notes","inputSchema":{"type":"object"},"requiredPermissions":object.scopes(true)}]
        })).unwrap()
    }
    #[test]
    fn native_bindings_need_native_rights_and_unique_private_anchors() {
        for object in [
            Object::Product,
            Object::Customer,
            Object::Order,
            Object::Company,
        ] {
            let m = package(object);
            assert!(validate(&m).is_ok());
            let mut unsafe_m = m.clone();
            unsafe_m.entities[0].fields[0].unique = false;
            assert!(validate(&unsafe_m).is_err());
            unsafe_m = m.clone();
            unsafe_m.entities[0].public_read = true;
            assert!(validate(&unsafe_m).is_err());
            unsafe_m = m.clone();
            unsafe_m.actions[0].required_permissions.clear();
            assert!(validate(&unsafe_m).is_err());
            unsafe_m = m.clone();
            unsafe_m.entities[0].extends = None;
            assert!(compatible(&m.entities[0], &unsafe_m.entities[0]).is_err());
        }
    }
    #[test]
    fn old_packages_keep_their_serialized_identity() {
        let mut m = package(Object::Product);
        m.entities[0].extends = None;
        assert!(
            !serde_json::to_value(&m).unwrap()["entities"][0]
                .as_object()
                .unwrap()
                .contains_key("extends")
        );
        assert!(
            serde_json::to_value(&m).unwrap()["entities"][0]
                .get("operational")
                .is_none()
        );
    }
    #[test]
    fn operational_receipts_do_not_become_release_configuration() {
        let mut m = package(Object::Product);
        let original = m.entities[0].clone();
        m.entities[0].operational = Some(true);
        assert!(!configuration(&m.entities[0]));
        assert!(compatible(&m.entities[0], &original).is_err());
        assert!(compatible(&original, &m.entities[0]).is_ok());
    }
}
