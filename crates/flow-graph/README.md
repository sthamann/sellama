# Veyndo Flow Graph

Use this Rust crate to validate the structure of a flow before saving it or
resuming a worker. It has no dependencies beyond the standard library.
Pin the crate to a reviewed Veyndo Git revision when using it from another
workspace. The package name is `veyndo-flow-graph`.

```rust
use veyndo_flow_graph::{Graph, Node};

struct Stop(&'static str);

impl Node for Stop {
    fn id(&self) -> &str { self.0 }
    fn successors(&self) -> [Option<&str>; 2] { [None, None] }
}

let steps = [Stop("finish")];
let graph = Graph::validate("finish", &steps, |id| !id.is_empty(), |_| Ok::<(), ()>(()))?;
assert!(graph.get("finish").is_some());
# Ok::<(), veyndo_flow_graph::Invalid<()>>(())
```

The validator rejects oversized graphs, missing entry or successor IDs,
duplicate IDs, cycles and unreachable nodes. Supply your host's identifier
and node policy as callbacks. Veyndo uses its existing condition and action
validators and the verified delay limit. Its worker resolves persisted
cursors through the same validated graph. Authorization, event delivery and
actual execution belong to the host.

Run `cargo test --locked -p veyndo-flow-graph` from the workspace root.
[Automation guide](../../docs/automation-component.md#flow-graph-contract).
