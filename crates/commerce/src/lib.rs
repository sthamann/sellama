//! Cart, product, amount and calculation contracts without transport or inference dependencies.
pub use veyndo_kernel::verified_kernel;
pub mod cart;
pub mod catalog;
pub mod customer;
pub mod discount;
pub mod money;
pub mod pricing;
