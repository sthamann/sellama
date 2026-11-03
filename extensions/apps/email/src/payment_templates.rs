//! Localized recipient instructions use native exact money and escaped template substitution; no mail implies paid status.
use super::*;
pub fn defaults() -> Value {
    serde_json::from_str(include_str!("payment-templates.json")).unwrap()
}
pub fn block(event: &Value, locale: &str) -> Result<String> {
    let Some(v) = event.get("paymentInstructions") else {
        return Ok(String::new());
    };
    let i = &v["instructions"];
    checked(
        i["kind"] == "bank_transfer",
        "Invoice recipient instructions required",
    )?;
    let minor = v["amountMinor"]
        .as_i64()
        .filter(|n| *n > 0)
        .ok_or(Error::Invalid("Invalid invoice amount"))?;
    let scale = v["currencyScale"]
        .as_u64()
        .and_then(|n| u8::try_from(n).ok())
        .ok_or(Error::Invalid("Invalid invoice currency scale"))?;
    let currency = crate::money::Currency::new(v["currency"].as_str().unwrap_or(""), scale)
        .map_err(Error::Invalid)?;
    let amount = crate::money::Money::new(minor, currency).decimal();
    let index = match locale {
        "de" => 1,
        "fr" => 2,
        "es" => 3,
        _ => 0,
    };
    let word = |s: [&'static str; 4]| s[index];
    let mut lines = vec![format!(
        "{}: {amount} {}",
        word([
            "Order amount",
            "Bestellbetrag",
            "Montant de la commande",
            "Importe del pedido"
        ]),
        text(v, "currency")
    )];
    if v["simulated"] == true {
        lines.push(
            word([
                "Simulated bank details. Do not transfer money.",
                "Simulierte Bankdaten. Bitte kein Geld überweisen.",
                "Coordonnées simulées. Ne transférez pas d'argent.",
                "Datos simulados. No transfieras dinero.",
            ])
            .into(),
        );
    }
    for (key, labels, max) in [
        (
            "accountHolderName",
            ["Recipient", "Empfänger", "Bénéficiaire", "Destinatario"],
            200,
        ),
        ("bankName", ["Bank", "Bank", "Banque", "Banco"], 200),
        ("iban", ["IBAN", "IBAN", "IBAN", "IBAN"], 34),
        ("bic", ["BIC", "BIC", "BIC", "BIC"], 11),
        (
            "paymentReference",
            [
                "Payment reference",
                "Verwendungszweck",
                "Référence du paiement",
                "Referencia del pago",
            ],
            140,
        ),
    ] {
        let value = i[key]
            .as_str()
            .filter(|s| !s.trim().is_empty() && s.len() <= max && !s.chars().any(char::is_control))
            .ok_or(Error::Invalid("Invalid invoice recipient field"))?;
        lines.push(format!("{}: {value}", word(labels)));
    }
    Ok(format!("\n\n{}", lines.join("\n")))
}

#[cfg(test)]
mod tests {
    use super::*;
    fn event() -> Value {
        json!({"order":{"orderNumber":"INV-1","orderCustomer":{"email":"buyer@example.test","firstName":"Ada"},"cart":{"locale":"de-DE"}},"paymentInstructions":{"amountMinor":7123,"currency":"KWD","currencyScale":3,"simulated":true,"instructions":{"kind":"bank_transfer","accountHolderName":"<Recipient>","bankName":"Test bank","iban":"DE89370400440532013000","bic":"DEUTDEFFXXX","paymentReference":"RF-123"}}})
    }
    #[test]
    fn invoice_mail_uses_exact_money_customer_language_and_escaped_recipient() {
        let mut s = config::Settings::default();
        let mut subjects = std::collections::BTreeSet::new();
        for locale in ["en", "de", "fr", "es"] {
            let mail = templates::payment(&json!({"event":event(),"locale":locale}), &s).unwrap();
            assert!(mail.text.contains("7.123 KWD"));
            assert!(mail.text.contains("RF-123"));
            subjects.insert(mail.subject);
        }
        assert_eq!(subjects.len(), 4);
        assert!(
            templates::payment(&json!({"event":event()}), &s)
                .unwrap()
                .subject
                .contains("Zahlungsangaben")
        );
        s.payment_templates.insert(
            "en".into(),
            config::Template {
                html: Some("<pre>{paymentInstructions}</pre>".into()),
                ..Default::default()
            },
        );
        let mail = templates::payment(&json!({"event":event(),"locale":"en"}), &s).unwrap();
        assert!(mail.html.contains("&lt;Recipient&gt;"));
        assert!(!mail.html.contains("<Recipient>"));
    }
    #[test]
    fn instruction_mail_rejects_missing_invalid_or_injected_evidence() {
        let s = config::Settings::default();
        assert!(templates::payment(&json!({"event":{}}), &s).is_err());
        for (field, value) in [
            ("amountMinor", json!(-1)),
            ("currencyScale", json!(7)),
            ("currency", json!("???")),
        ] {
            let mut e = event();
            e["paymentInstructions"][field] = value;
            assert!(block(&e, "de").is_err());
        }
        let mut e = event();
        e["paymentInstructions"]["instructions"]["bankName"] = json!("bank\nnew field");
        assert!(block(&e, "en").is_err());
    }
}
