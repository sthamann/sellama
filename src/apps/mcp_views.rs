//! Publish revision-bound native MCP App views and authorize their read-only interactions.
use super::*;

pub(crate) use veyndo_app_model::surfaces::assistant_location as location;
pub(crate) const MIME: &str = "text/html;profile=mcp-app";
pub(crate) const EXTENSION: &str = "io.modelcontextprotocol/ui";

pub(super) struct Mode<'a> {
    read_only: bool,
    resource: Option<&'a str>,
}

pub(super) fn admit_tool(
    a: &App,
    h: &RequestContext,
    m: &Manifest,
    action: &Action,
    t: &str,
    mode: Mode<'_>,
) -> Result<()> {
    if h.principal.agent_key.is_some()
        || !verified_kernel::app_tool_admissible(
            action.mcp != Some(false),
            gateway::action_authorized(a, h, action),
        )
        || mode.read_only && !surfaces::readonly(action)
        || mode
            .resource
            .is_some_and(|uri| !matches(a, h, m, action, t, uri))
    {
        return Err(Error(
            StatusCode::NOT_FOUND,
            "App MCP tool not exposed".into(),
        ));
    }
    Ok(())
}

/// MCP opt-out applies to discovery and direct invocation, without disabling the UI/HTTP action.
pub(crate) async fn invoke_mcp(
    a: &App,
    h: &RequestContext,
    id: &str,
    name: &str,
    v: &Value,
) -> Result<Value> {
    gateway::invoke(
        a,
        h,
        id,
        name,
        v,
        Some(Mode {
            read_only: false,
            resource: None,
        }),
    )
    .await
}

pub(crate) async fn invoke_mcp_read(
    a: &App,
    h: &RequestContext,
    name: &str,
    v: &Value,
    resource: Option<&str>,
) -> Result<Value> {
    let (id, action) = name
        .strip_prefix("app.")
        .and_then(|name| name.split_once('.'))
        .ok_or(bad("Invalid app capability name"))?;
    gateway::invoke(
        a,
        h,
        id,
        action,
        v,
        Some(Mode {
            read_only: true,
            resource,
        }),
    )
    .await
}

pub(super) fn available(a: &App, h: &RequestContext, m: &Manifest, s: &Surface) -> bool {
    let private = s.location == "admin.assistant";
    location(&s.location)
        && h.principal.agent_key.is_none()
        && (!private || merchant(a, h).is_ok())
        && s.permission
            .as_deref()
            .is_none_or(|p| auth::permit(h, p).is_ok())
        && native_views::is_native(m, s)
        && s.actions.len() == 1
        && m.actions.iter().any(|action| {
            action.name == s.actions[0]
                && action.handler == "list"
                && action.mcp == Some(true)
                && action.public != private
                && gateway::action_authorized(a, h, action)
        })
}

pub(super) fn uri(tenant: &str, m: &Manifest, s: &Surface, digest: &str) -> String {
    format!("ui://veyndo/{tenant}/{}/{}/{digest}", m.id, s.id)
}

pub(super) fn matches(
    a: &App,
    h: &RequestContext,
    m: &Manifest,
    action: &Action,
    t: &str,
    requested: &str,
) -> bool {
    m.surfaces.iter().any(|s| {
        s.actions.first() == Some(&action.name)
            && available(a, h, m, s)
            && uri(t, m, s, &approval::canonical_digest(m)) == requested
    })
}

pub(crate) async fn list(a: &App, h: &RequestContext) -> Result<Vec<Value>> {
    let mut resources = Vec::new();
    if h.principal.agent_key.is_some() {
        return Ok(resources);
    }
    let Ok(t) = tenant(h) else {
        return Ok(resources);
    };
    for m in super::registry::active_manifests(a, h).await? {
        let mut surfaces = m
            .surfaces
            .iter()
            .filter(|s| available(a, h, &m, s))
            .peekable();
        if surfaces.peek().is_some() {
            let digest = approval::canonical_digest(&m);
            resources.extend(surfaces.map(|s| {
                json!({"uri":uri(&t,&m,s,&digest),"name":format!("{}.{}",m.id,s.id),
                       "mimeType":MIME})
            }));
        }
    }
    Ok(resources)
}

/// Only the server's executed tool trace can produce a conversation attachment.
pub(crate) fn attachments(trace: &[Value]) -> Vec<Value> {
    attachment_views(trace, true)
}

pub(crate) fn attachment_references(trace: &[Value]) -> Vec<Value> {
    attachment_views(trace, false)
}

fn attachment_views(trace: &[Value], include_result: bool) -> Vec<Value> {
    trace
        .iter()
        .enumerate()
        .rev()
        .filter_map(|(index, entry)| {
            let mut view = json!({
                "attachmentId":index,
                "resourceUri":entry["appView"].as_str()?,
                "arguments":entry["input"],
            });
            if include_result {
                view["result"] = json!({"structuredContent":entry["result"]});
            }
            Some(view)
        })
        .take(3)
        .collect()
}

pub(crate) async fn read(a: &App, h: &RequestContext, requested: &str) -> Result<Option<Value>> {
    let Some(path) = requested.strip_prefix("ui://veyndo/") else {
        return Ok(None);
    };
    let mut parts = path.split('/');
    let (Some(shop), Some(app), Some(id), Some(digest), None) = (
        parts.next(),
        parts.next(),
        parts.next(),
        parts.next(),
        parts.next(),
    ) else {
        return Ok(None);
    };
    let Ok(t) = tenant(h) else { return Ok(None) };
    if shop != t || digest.len() != 64 || h.principal.agent_key.is_some() {
        return Ok(None);
    }
    let m = match package(a, &t, app, true).await {
        Ok(m) => m,
        Err(error) if matches!(error.0, StatusCode::NOT_FOUND | StatusCode::CONFLICT) => {
            return Ok(None);
        }
        Err(error) => return Err(error),
    };
    let Some(s) = m
        .surfaces
        .iter()
        .find(|s| s.id == id && available(a, h, &m, s))
    else {
        return Ok(None);
    };
    if approval::canonical_digest(&m) != digest {
        return Ok(None);
    }
    let view = native_views::payload(&m, s).ok_or(bad("App view unavailable"))?;
    let (locale, _) = language_context(a, h).await?;
    let (settings, _) = commerce::config(a, &t).await?;
    let main = settings.main_locale.as_str();
    let locale_chain = [
        locale.as_str(),
        locale.split('-').next().unwrap_or(&locale),
        main,
        main.split('-').next().unwrap_or(main),
    ];
    let definition = json!({"label":s.label,"view":view["view"],"entities":view["entities"],
        "localeChain":locale_chain,"toolName":format!("app.{}.{}",m.id,s.actions[0]),
        "filter": choice_filter(&m, s, &view),
        "productReference": (s.location == "storefront.assistant").then(|| {
            view_entity(&m, s, &view)?.fields.iter()
                .find(|field| field.core_reference.as_deref() == Some("product"))
                .map(|field| &field.name)
        }).flatten()});
    Ok(Some(
        json!({"uri":requested,"mimeType":MIME,"text":document(&definition),
        "_meta":{"ui":{"csp":{"connectDomains":[],"resourceDomains":[]}},
                 "ai.veyndo/definition":definition}}),
    ))
}

fn view_entity<'a>(m: &'a Manifest, s: &Surface, view: &Value) -> Option<&'a Entity> {
    let action = m.actions.iter().find(|a| a.name == s.actions[0])?;
    let entity = m
        .entities
        .iter()
        .find(|e| Some(&e.name) == action.entity.as_ref())?;
    view["entities"]
        .as_array()?
        .iter()
        .any(|e| e["name"] == entity.name)
        .then_some(entity)
}

fn choice_filter(m: &Manifest, s: &Surface, view: &Value) -> Option<Value> {
    let action = m.actions.iter().find(|a| a.name == s.actions[0])?;
    let schema = &action.input_schema["properties"]["filter"];
    if schema["type"] != "object" {
        return None;
    }
    let entity = view_entity(m, s, view)?;
    let field = entity.fields.iter().find(|f| {
        f.indexed
            && f.kind == "string"
            && !f.translatable
            && !f.choices.is_empty()
            && f.references.is_none()
            && f.core_reference.is_none()
            && (schema["additionalProperties"] != false
                || schema["properties"][&f.name]["type"] == "string")
    })?;
    Some(json!({"name":field.name,"label":field.label,"choices":field.choices}))
}

pub(super) async fn shell() -> Response {
    // Static sandbox shell. It has no tenant data or access to the caller's session.
    super::ui_documents::sandboxed(document(&json!({})))
}

fn document(definition: &Value) -> String {
    // JSON inside an inert script element. Do not let app data terminate the element.
    let data = definition
        .to_string()
        .replace('<', "\\u003c")
        .replace('>', "\\u003e")
        .replace('&', "\\u0026");
    include_str!("mcp_view.html").replace("__APP_VIEW_DEFINITION__", &data)
}
