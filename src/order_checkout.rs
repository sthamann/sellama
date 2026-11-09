//! Native checkout entry used by Store API, Studio, agents and POS.
use crate::{App, RequestContext, Result, Value, checkout as owner};

pub(crate) async fn checkout(a: &App, h: &RequestContext, key: &str) -> Result<Value> {
    owner::execute(a, h, key, None).await
}
