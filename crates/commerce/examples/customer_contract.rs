//! Run contact normalization without a Core process, database, credentials or network.
use veyndo_commerce::customer::Contact;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut contact: Contact = serde_json::from_value(serde_json::json!({
        "name":"", "firstName":"Demo", "lastName":"Buyer",
        "address":{"street":"Example Street 1","postalCode":"12345","city":"Test City","firstName":"Demo","lastName":"Buyer"}
    }))?;
    contact.validate()?;
    println!("{}", serde_json::to_string_pretty(&contact)?);
    Ok(())
}
