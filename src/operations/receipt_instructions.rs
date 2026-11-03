//! Four-language invoice recipient footer from the immutable native receipt snapshot; cancellations never request payment.
use crate::Value;
pub(super) fn lines(v: &Value, index: usize) -> Vec<String> {
    let i = &v["instructions"];
    if i["kind"] != "bank_transfer" {
        return vec![];
    }
    let word = |v: [&str; 4]| v[index.min(3)].to_owned();
    let mut lines = vec![
        String::new(),
        word([
            "Invoice payment details",
            "Angaben zum Rechnungskauf",
            "Informations du paiement sur facture",
            "Datos del pago por factura",
        ]),
    ];
    if v["simulated"] == true {
        lines.push(word([
            "Simulated bank details. Do not transfer money.",
            "Simulierte Bankdaten. Bitte kein Geld überweisen.",
            "Coordonnées simulées. Ne transférez pas d'argent.",
            "Datos simulados. No transfieras dinero.",
        ]));
    }
    for (key, labels) in [
        (
            "accountHolderName",
            ["Recipient", "Empfänger", "Bénéficiaire", "Destinatario"],
        ),
        ("bankName", ["Bank", "Bank", "Banque", "Banco"]),
        ("iban", ["IBAN", "IBAN", "IBAN", "IBAN"]),
        ("bic", ["BIC", "BIC", "BIC", "BIC"]),
        (
            "paymentReference",
            [
                "Payment reference",
                "Verwendungszweck",
                "Référence du paiement",
                "Referencia del pago",
            ],
        ),
    ] {
        lines.push(format!(
            "{}: {}",
            word(labels),
            i[key].as_str().unwrap_or("")
        ));
    }
    lines
}
