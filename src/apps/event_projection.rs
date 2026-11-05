//! Native installed-Manifest adapter for shared event admission and privacy projections; queue and current authority remain native.
use super::*;
pub(super) fn context(m: &Manifest) -> veyndo_app_model::events::Context<'_> {
    veyndo_app_model::events::Context {
        id: &m.id,
        events: &m.events,
        permissions: &m.permissions,
        event_filters: &m.event_filters,
    }
}
pub(super) fn eligible(m: &Manifest, kind: &str, data: &Value) -> bool {
    veyndo_app_model::subscriptions::eligible(&context(m), kind, data)
}
#[cfg(test)]
fn subscribed(m: &Manifest, kind: &str) -> bool {
    veyndo_app_model::subscriptions::subscribed(&context(m), kind)
}
pub(super) fn payload(m: &Manifest, kind: &str, data: Value) -> Value {
    veyndo_app_model::subscriptions::payload(&context(m), kind, data)
}
pub(super) fn validate(m: &Manifest) -> Result<()> {
    veyndo_app_model::subscriptions::validate(&context(m)).map_err(model_contract::error)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn recipient_instructions_need_explicit_financial_and_pii_consent() {
        let mut m: Manifest = serde_json::from_str(approval::built_in("slack").unwrap()).unwrap();
        let value = json!({"orderId":"o","attemptId":"a","paymentInstructions":{"iban":"private"},"order":{"email":"private"}});
        let minimized = json!({"orderId":"o","attemptId":"a"});
        assert_eq!(
            payload(&m, "payment.instructions.available", value.clone()),
            minimized
        );
        m.permissions.push("customers.pii".into());
        assert_eq!(
            payload(&m, "payment.instructions.available", value.clone()),
            minimized
        );
        m.permissions.retain(|p| p != "customers.pii");
        m.permissions.push("payments.instructions.read".into());
        assert_eq!(
            payload(&m, "payment.instructions.available", value.clone()),
            minimized
        );
        m.permissions.push("customers.pii".into());
        assert_eq!(
            payload(&m, "payment.instructions.available", value.clone()),
            value
        );
    }
    #[test]
    fn fulfillment_events_keep_links_but_never_project_addresses_or_tokens() {
        let mut m: Manifest = serde_json::from_str(approval::built_in("slack").unwrap()).unwrap();
        m.permissions.push("customers.pii".into());
        let data = json!({"orderId":"o","deliveryId":"p","documentId":"d","kind":"shipping_label","sourceApp":"carrier","order":{"shippingAddress":{"name":"private"}},"trackingCode":"private","token":"private"});
        assert_eq!(
            payload(&m, "delivery.split", data.clone()),
            json!({"orderId":"o","deliveryId":"p","kind":"shipping_label"})
        );
        assert_eq!(
            payload(&m, "document.created", data),
            json!({"orderId":"o","documentId":"d","kind":"shipping_label","sourceApp":"carrier"})
        );
    }
    #[test]
    fn intelligence_requires_scoped_subscription_and_projects_no_private_evidence() {
        let mut m: Manifest = serde_json::from_str(approval::built_in("slack").unwrap()).unwrap();
        m.events = vec!["intelligence.experiment.result".into()];
        m.permissions = vec!["events.read".into(), "knowledge.read".into()];
        assert!(!subscribed(&m, "intelligence.experiment.result"));
        m.permissions.push("events:intelligence.*".into());
        assert!(subscribed(&m, "intelligence.experiment.result"));
        let data = json!({"id":"experiment", "channelId":"default", "causalUpliftProven":false,
            "actor":"private-user", "email":"private@example.test", "evidence":{"quote":"private support mail"}});
        assert_eq!(
            payload(&m, "intelligence.experiment.result", data),
            json!({"id":"experiment", "channelId":"default", "causalUpliftProven":false})
        );
        m.permissions.push("customers.pii".into());
        assert_eq!(
            payload(
                &m,
                "intelligence.claim.reviewed",
                json!({"claimId":"claim","state":"confirmed","actor":"private-user"})
            ),
            json!({"claimId":"claim","state":"confirmed"})
        );
    }
    #[test]
    fn pos_events_require_explicit_scope_and_minimize_cashier_identity() {
        let mut m: Manifest = serde_json::from_str(approval::built_in("slack").unwrap()).unwrap();
        m.events = vec!["pos.sale_completed".into()];
        m.permissions = vec!["events.read".into()];
        assert!(!subscribed(&m, "pos.sale_completed"));
        m.permissions.push("events:pos.*".into());
        assert!(subscribed(&m, "pos.sale_completed"));
        assert_eq!(
            payload(
                &m,
                "pos.sale_completed",
                json!({"orderId":"o","salesChannelId":"register","totalMinor":"100","cashierId":"private","tenderMinor":"200","email":"private@test"})
            ),
            json!({"orderId":"o","salesChannelId":"register","totalMinor":"100"})
        );
    }
    #[test]
    fn company_events_require_explicit_rights_and_never_include_buyer_data() {
        let mut m: Manifest = serde_json::from_str(approval::built_in("slack").unwrap()).unwrap();
        m.events = vec!["b2b.purchase_completed".into()];
        m.permissions = vec!["events.read".into(), "events:b2b.*".into()];
        let data = json!({"unitId":"unit","orderId":"order","customerId":"private", "email":"private@example.test","totalMinor":"100"});
        assert!(!subscribed(&m, "b2b.purchase_completed"));
        m.permissions.push("b2b.read".into());
        assert!(subscribed(&m, "b2b.purchase_completed"));
        assert_eq!(
            payload(&m, "b2b.purchase_completed", data),
            json!({"unitId":"unit","orderId":"order","totalMinor":"100"})
        );
    }
    #[test]
    fn coarse_events_do_not_disclose_customers_team_or_other_apps() {
        let mut m: Manifest = serde_json::from_str(approval::built_in("slack").unwrap()).unwrap();
        m.permissions = vec!["events.read".into()];
        for kind in [
            "customer.address_changed",
            "membership.updated",
            "app.other.changed",
        ] {
            m.events.push(kind.into());
            assert!(!subscribed(&m, kind));
        }
        let p = payload(
            &m,
            "order.placed",
            json!({"orderId":"own","totalMinor":100,"email":"private@example.test","address":{"street":"private"}}),
        );
        assert_eq!(p, json!({"orderId":"own","totalMinor":100}));
        m.permissions.push("customers.pii".into());
        assert_eq!(
            payload(
                &m,
                "order.placed",
                json!({"email":"consented@example.test"})
            ),
            json!({"email":"consented@example.test"})
        );
    }
}
