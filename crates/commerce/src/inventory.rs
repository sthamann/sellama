//! Checked item quantities for inventory writes. Availability and locks belong to the host.
use crate::ValidationError;

/// One ordered batch for both the allocation ledger and the stock write.
/// The host still owns distinct product admission and transaction locking.
pub struct InventoryLines<'a> {
    ids: Vec<&'a str>,
    quantities: Vec<i32>,
}

impl<'a> InventoryLines<'a> {
    pub fn new(
        lines: impl ExactSizeIterator<Item = (&'a str, u32)>,
    ) -> Result<Self, ValidationError> {
        let mut batch = Self {
            ids: Vec::with_capacity(lines.len()),
            quantities: Vec::with_capacity(lines.len()),
        };
        for (id, quantity) in lines {
            let quantity = i32::try_from(quantity)
                .ok()
                .filter(|&value| value > 0)
                .ok_or(ValidationError::new("Invalid inventory quantity"))?;
            batch.ids.push(id);
            batch.quantities.push(quantity);
        }
        Ok(batch)
    }

    pub fn ids(&self) -> &[&'a str] {
        &self.ids
    }

    pub fn quantities(&self) -> &[i32] {
        &self.quantities
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn signed_quantities_preserve_line_alignment_without_wrapping() {
        let batch =
            InventoryLines::new([("lamp", 2), ("mug", i32::MAX as u32)].into_iter()).unwrap();
        assert_eq!(batch.ids(), ["lamp", "mug"]);
        assert_eq!(batch.quantities(), [2, i32::MAX]);
        for quantity in [0, i32::MAX as u32 + 1, u32::MAX] {
            assert!(InventoryLines::new([("lamp", quantity)].into_iter()).is_err());
        }
    }
}
