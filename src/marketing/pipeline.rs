//! A bounded acyclic flow graph models source-style true/false branches, ordered actions, delays and stop nodes.
use super::*;
use veyndo_flow_graph::{Graph, Invalid};
#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Pipeline {
    pub entry: String,
    pub nodes: Vec<Node>,
}
#[derive(Clone, Deserialize, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
pub(crate) enum Node {
    Condition {
        id: String,
        condition: rules::Condition,
        on_true: Option<String>,
        on_false: Option<String>,
    },
    Action {
        id: String,
        action: String,
        #[serde(default)]
        config: Value,
        next: Option<String>,
    },
    Delay {
        id: String,
        seconds: u64,
        next: Option<String>,
    },
    Stop {
        id: String,
    },
}
impl Node {
    pub(crate) fn id(&self) -> &str {
        match self {
            Self::Condition { id, .. }
            | Self::Action { id, .. }
            | Self::Delay { id, .. }
            | Self::Stop { id } => id,
        }
    }
}
impl veyndo_flow_graph::Node for Node {
    fn id(&self) -> &str {
        self.id()
    }
    fn successors(&self) -> [Option<&str>; 2] {
        match self {
            Self::Condition {
                on_true, on_false, ..
            } => [on_true.as_deref(), on_false.as_deref()],
            Self::Action { next, .. } | Self::Delay { next, .. } => [next.as_deref(), None],
            Self::Stop { .. } => [None, None],
        }
    }
}
impl Pipeline {
    pub(crate) fn validate(&self) -> Result<()> {
        self.graph().map(|_| ())
    }

    pub(crate) fn graph(&self) -> Result<Graph<'_, Node>> {
        Graph::validate(
            &self.entry,
            &self.nodes,
            apps::identifier,
            |node| match node {
                Node::Condition { condition, .. } => condition.validate(0),
                Node::Delay { seconds, .. }
                    if !veyndo::verified_kernel::flow_delay_admissible(*seconds) =>
                {
                    Err(bad("Flow delay exceeds 30 days"))
                }
                Node::Action { action, config, .. } => {
                    super::flow_actions::validate(action, config)
                }
                _ => Ok(()),
            },
        )
        .map_err(|error| match error {
            Invalid::EntryOrSize => bad(format!(
                "Flow needs an entry and 1..{} nodes",
                veyndo_flow_graph::MAX_NODES
            )),
            Invalid::NodeId => bad("Invalid or duplicate flow node"),
            Invalid::Node(error) => error,
            Invalid::MissingSuccessor => bad("Flow edge references an absent node"),
            Invalid::Cycle => bad("Flow graph contains a cycle"),
            Invalid::Unreachable => bad("Flow graph contains unreachable nodes"),
        })
    }
}
