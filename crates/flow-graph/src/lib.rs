//! Dependency-free validation and indexed lookup for bounded commerce flow graphs.
use std::collections::{HashMap, HashSet};

pub const MAX_NODES: usize = 100;

/// A condition has two successors, an action or delay has one, and a stop has none.
pub trait Node {
    fn id(&self) -> &str;
    fn successors(&self) -> [Option<&str>; 2];
}

#[derive(Debug, PartialEq, Eq)]
pub enum Invalid<E> {
    EntryOrSize,
    NodeId,
    Node(E),
    MissingSuccessor,
    Cycle,
    Unreachable,
}

/// A validated graph borrows its source nodes and indexes them once.
pub struct Graph<'a, N> {
    nodes: HashMap<&'a str, &'a N>,
}

impl<'a, N: Node> Graph<'a, N> {
    /// The host owns identifier syntax and condition/action policy.
    pub fn validate<E>(
        entry: &str,
        nodes: &'a [N],
        valid_id: impl Fn(&str) -> bool,
        check_node: impl Fn(&N) -> Result<(), E>,
    ) -> Result<Self, Invalid<E>> {
        if nodes.is_empty() || nodes.len() > MAX_NODES {
            return Err(Invalid::EntryOrSize);
        }
        let entry = nodes
            .iter()
            .map(Node::id)
            .find(|id| *id == entry)
            .ok_or(Invalid::EntryOrSize)?;
        let mut index = HashMap::with_capacity(nodes.len());
        for node in nodes {
            if !valid_id(node.id()) || index.insert(node.id(), node).is_some() {
                return Err(Invalid::NodeId);
            }
            check_node(node).map_err(Invalid::Node)?;
        }
        for node in nodes {
            if node
                .successors()
                .into_iter()
                .flatten()
                .any(|id| !index.contains_key(id))
            {
                return Err(Invalid::MissingSuccessor);
            }
        }
        let mut done = HashSet::with_capacity(nodes.len());
        if !visit(entry, &index, &mut HashSet::new(), &mut done) {
            return Err(Invalid::Cycle);
        }
        if done.len() != nodes.len() {
            return Err(Invalid::Unreachable);
        }
        Ok(Self { nodes: index })
    }

    pub fn get(&self, id: &str) -> Option<&'a N> {
        self.nodes.get(id).copied()
    }
}

// Only called after every successor resolves. Recursion is bounded by the node limit.
fn visit<'a, N: Node>(
    id: &'a str,
    index: &HashMap<&'a str, &'a N>,
    active: &mut HashSet<&'a str>,
    done: &mut HashSet<&'a str>,
) -> bool {
    if done.contains(id) {
        return true;
    }
    if !active.insert(id) {
        return false;
    }
    for edge in index[id].successors().into_iter().flatten() {
        if !visit(edge, index, active, done) {
            return false;
        }
    }
    active.remove(id);
    done.insert(id);
    true
}

#[cfg(test)]
mod tests;
