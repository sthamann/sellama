//! Exercise graph validation independently of the commerce host.
use super::*;

struct Step(&'static str, [Option<&'static str>; 2]);

impl Node for Step {
    fn id(&self) -> &str {
        self.0
    }

    fn successors(&self) -> [Option<&str>; 2] {
        self.1
    }
}

fn validate(nodes: &[Step]) -> Result<Graph<'_, Step>, Invalid<&'static str>> {
    Graph::validate(
        "a",
        nodes,
        |id| !id.is_empty(),
        |node| {
            if node.0 == "forbidden" {
                Err("host policy")
            } else {
                Ok(())
            }
        },
    )
}

#[test]
fn two_branches_can_join_and_resume_by_id() {
    let nodes = [
        Step("end", [None, None]),
        Step("a", [Some("left"), Some("right")]),
        Step("right", [Some("end"), None]),
        Step("left", [Some("end"), None]),
    ];
    let graph = validate(&nodes).ok().unwrap();
    assert!(std::ptr::eq(graph.get("end").unwrap(), &nodes[0]));
    assert!(graph.get("missing").is_none());
}

#[test]
fn unsafe_graphs_and_host_policy_are_rejected() {
    for (nodes, expected) in [
        (vec![], Invalid::EntryOrSize),
        (
            vec![Step("a", [Some("b"), None])],
            Invalid::MissingSuccessor,
        ),
        (vec![Step("a", [Some("a"), None])], Invalid::Cycle),
        (
            vec![Step("a", [None, None]), Step("a", [None, None])],
            Invalid::NodeId,
        ),
        (
            vec![Step("a", [None, None]), Step("b", [None, None])],
            Invalid::Unreachable,
        ),
        (
            vec![Step("a", [None, None]), Step("forbidden", [None, None])],
            Invalid::Node("host policy"),
        ),
    ] {
        assert_eq!(validate(&nodes).err(), Some(expected));
    }
    let nodes = (0..101)
        .map(|_| Step("a", [None, None]))
        .collect::<Vec<_>>();
    assert_eq!(validate(&nodes).err(), Some(Invalid::EntryOrSize));
}
#[test]
fn catalog_v1_preserves_all_published_names_and_order() {
    use crate::catalog::{EVENTS, FLOW_ACTIONS, PIPELINE_ACTIONS, VERSION};

    let baseline = include_str!("../fixtures/catalog-v1.txt").trim_end();
    let published = [EVENTS, PIPELINE_ACTIONS, FLOW_ACTIONS];
    let mut groups = baseline.split("\n\n");
    for names in published {
        let previous = groups.next().unwrap().lines().collect::<Vec<_>>();
        if VERSION == 1 {
            assert_eq!(names, previous);
        } else {
            assert!(previous.into_iter().all(|name| names.contains(&name)));
        }
        assert_eq!(
            names.iter().collect::<std::collections::HashSet<_>>().len(),
            names.len()
        );
    }
    assert!(groups.next().is_none());
}
