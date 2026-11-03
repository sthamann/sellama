# Native merchant reports

`config.rs` validates the shared HTTP/MCP query and private report layouts.
`period.rs` resolves calendar windows in an IANA timezone and bounds chart points.
`source.sql` reads immutable order money, original cart channels and provider refunds;
`sales.sql` returns bounded summaries, buckets, channel ranks and product ranks.
`traffic.rs` reuses the behavior owner's exact eligible SQL and inherited legal
policy resolver; `traffic.sql` counts consented cart contexts, never API requests
or people. There is no new tracking identity, event ledger, table or worker.

The parent module admits current reporting rights and projects optional product,
channel-name and visitor fields by their existing domain permissions. Operational
sales/visits remain in their environment. Saved presentation preferences stay in
the existing personal live-shop workspace and never become release units.
