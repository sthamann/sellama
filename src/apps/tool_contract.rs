//! Installed app tools share native wire metadata and validate declared results without disclosing provider payloads.
use super::*;
pub(crate) async fn app_tools(a: &App, h: &RequestContext) -> Result<Vec<Value>> {
    app_tools_for(a, h, false).await
}

pub(crate) async fn app_tools_for(
    a: &App,
    h: &RequestContext,
    public_only: bool,
) -> Result<Vec<Value>> {
    if h.principal.agent_key.is_some() {
        return Ok(Vec::new());
    }
    let mut tools = vec![];
    for m in super::registry::active_manifests(a, h).await? {
        let digest = m
            .surfaces
            .iter()
            .any(|s| mcp_views::location(&s.location))
            .then(|| approval::canonical_digest(&m));
        for action in &m.actions {
            if (!public_only || action.public)
                && verified_kernel::app_tool_admissible(
                    action.mcp != Some(false),
                    super::gateway::action_authorized(a, h, action),
                )
            {
                let input_schema = m
                    .entities
                    .iter()
                    .find(|entity| {
                        action.handler == "list" && action.entity.as_deref() == Some(&entity.name)
                    })
                    .map(|entity| {
                        veyndo_app_model::query_contract::list_input_schema(
                            entity,
                            &action.input_schema,
                        )
                    })
                    .unwrap_or_else(|| action.input_schema.clone());
                let mut tool = capabilities::ToolContract::describe(
                    &format!("app.{}.{}", m.id, action.name),
                    &action.description,
                    &input_schema,
                    action.output_schema.as_ref(),
                    super::surfaces::readonly(action),
                );
                if let Some(digest) = &digest
                    && let Some(s) = m.surfaces.iter().find(|s| {
                        s.actions.first() == Some(&action.name) && mcp_views::available(a, h, &m, s)
                    })
                {
                    tool["_meta"] =
                        json!({"ui":{"resourceUri":mcp_views::uri(&tenant(h)?, &m, s, digest)}});
                }
                tools.push(tool);
            }
        }
    }
    Ok(tools)
}
pub(super) fn checked_output(action: &Action, result: Value) -> Result<Value> {
    if let Some(schema) = &action.output_schema {
        input_schema::validate_value(schema, &result).map_err(|_| Error::output_contract())?;
    }
    Ok(result)
}
