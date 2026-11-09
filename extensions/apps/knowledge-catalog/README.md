# Knowledge catalog sync

This opt-in service package subscribes to product creation, updates and
selected publication in Veyndo. Core sends the product ID through the
existing app event queue. Knowledge then uses an approved `products.read`
callback to fetch the latest content. The private synchronization action
can refresh an existing product by ID.

See [setup and verification](../../../docs/knowledge-component.md#synchronize-a-veyndo-catalog)
for the service configuration, scopes and catalog limits.
