//! Typed instructions from a validated graph. The host evaluates facts and performs effects.
use crate::{Graph, Node};

/// Executable nodes expose borrowed payloads. Graph-only consumers can implement just `Node`.
pub trait ExecutableNode: Node {
    type Condition;
    type Config;

    fn directive(&self) -> Directive<'_, Self::Condition, Self::Config>;
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Branches<'a> {
    pub on_true: Option<&'a str>,
    pub on_false: Option<&'a str>,
}

impl<'a> Branches<'a> {
    pub fn select(self, matched: bool) -> Option<&'a str> {
        if matched { self.on_true } else { self.on_false }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Directive<'a, C, A> {
    Branch {
        condition: &'a C,
        branches: Branches<'a>,
    },
    Effect {
        action: &'a str,
        config: &'a A,
        next: Option<&'a str>,
    },
    Defer {
        seconds: u64,
        next: Option<&'a str>,
    },
    Stop,
}

impl<'a, C, A> Directive<'a, C, A> {
    /// Use the same targets for validation and execution.
    pub fn successors(&self) -> [Option<&'a str>; 2] {
        match *self {
            Self::Branch { branches, .. } => [branches.on_true, branches.on_false],
            Self::Effect { next, .. } | Self::Defer { next, .. } => [next, None],
            Self::Stop => [None, None],
        }
    }
}

impl<'a, N: ExecutableNode> Graph<'a, N> {
    /// Resolve the exact cursor. An unknown cursor does not fall back to the entry.
    pub fn directive(&self, cursor: &str) -> Option<Directive<'a, N::Condition, N::Config>> {
        self.get(cursor).map(ExecutableNode::directive)
    }
}
