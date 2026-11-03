//! Model navigation names native views, never URLs or authority. Admission rechecks current rights and tenant-owned records.
use super::*;
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct Navigation {
    pub view: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
}
const VIEWS: &[(&str, &str)] = &[
    ("productData", "catalog.read"),
    ("orders", "orders.read"),
    ("customers", "customers.read"),
    ("overview", "overview.read"),
    ("knowledge", "knowledge.read"),
    ("commerce", "settings.read"),
    ("channels", "channels.read"),
    ("design", "channels.read"),
    ("automation", "automation.read"),
    ("apps", "apps.read"),
    ("storyfronts", "apps.read"),
    ("developers", "developer.read"),
    ("environments", "environments.read"),
    ("users", "team.manage"),
    ("b2b", "b2b.read"),
    ("pos", "pos.use"),
];
pub(crate) fn schema() -> Value {
    json!({"type":["object","null"],"additionalProperties":false,"properties":{
        "view":{"type":"string","enum":VIEWS.iter().map(|(v,_)|*v).collect::<Vec<_>>()},
        "id":{"type":["string","null"],"minLength":1,"maxLength":160}
    },"required":["view","id"]})
}
pub(crate) fn validate_view(
    target: Option<&Navigation>,
    view: Option<&super::view::View>,
) -> Result<()> {
    if let (Some(target), Some(view)) = (target, view) {
        let entity = match target.view.as_str() {
            "productData" => Some("products"),
            "orders" => Some("orders"),
            "customers" => Some("customers"),
            _ => None,
        };
        if entity.is_some_and(|entity| entity != view.entity) {
            return Err(bad(
                "Navigation and working view address different entities; preserve the verified navigation target and use its matching working-view entity",
            ));
        }
    }
    Ok(())
}
pub(crate) async fn admit(a: &App, h: &RequestContext, target: &Navigation) -> Result<()> {
    let right = VIEWS
        .iter()
        .find(|(v, _)| *v == target.view)
        .ok_or(bad("Unknown native view"))?
        .1;
    auth::permit(h, right)?;
    if ["orders", "customers"].contains(&target.view.as_str()) {
        auth::permit(h, "customers.pii")?;
    }
    if target.view == "design" {
        auth::permit(h, "catalog.read")?;
    }
    if let Some(id) = &target.id {
        if id.is_empty() || id.len() > 160 {
            return Err(bad("Invalid navigation reference"));
        }
        let query = match target.view.as_str() {
            "productData" => "SELECT EXISTS(SELECT 1 FROM products WHERE tenant=$1 AND id=$2)",
            "orders" => "SELECT EXISTS(SELECT 1 FROM orders WHERE tenant=$1 AND id=$2)",
            "customers" => "SELECT EXISTS(SELECT 1 FROM customers WHERE tenant=$1 AND id=$2)",
            _ => return Err(bad("This native view does not accept an entity reference")),
        };
        let exists: bool = sqlx::query_scalar(query)
            .bind(merchant(a, h)?)
            .bind(id)
            .fetch_one(&a.db)
            .await?;
        if !exists {
            return Err(bad("Navigation reference is unavailable in this shop"));
        }
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn product_navigation_cannot_open_an_order_working_view() {
        let target = Navigation {
            view: "productData".into(),
            id: Some("bag".into()),
        };
        let mut view = super::super::view::View {
            entity: "orders".into(),
            criteria: json!({}),
            components: vec!["records".into()],
        };
        assert!(validate_view(Some(&target), Some(&view)).is_err());
        view.entity = "products".into();
        assert!(validate_view(Some(&target), Some(&view)).is_ok());
        assert!(validate_view(None, Some(&view)).is_ok());
    }
    #[test]
    fn navigation_cannot_supply_urls_or_permissions() {
        apps::validate_native_input(&schema(), &json!({"view":"productData","id":"sku"})).unwrap();
        for value in [
            json!({"view":"https://example.com","id":null}),
            json!({"view":"orders","id":null,"tenant":"foreign"}),
            json!({"view":"commerce","id":null,"script":"alert(1)"}),
        ] {
            assert!(apps::validate_native_input(&schema(), &value).is_err());
        }
    }
}
