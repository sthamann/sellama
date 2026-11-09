//! Native preparation performs original cart/channel/package admission before taking commerce locks.
use super::state::Prepared;
use crate::{
    App, RequestContext, Result, apps, bad, checkout_products, commerce, load_cart, marketing,
    sandbox_cache,
};
pub(super) async fn run(a: &App, h: &RequestContext, key: &str) -> Result<Prepared> {
    if key.len() < 8 || key.len() > 128 {
        return Err(bad("Idempotency-Key must contain 8..128 characters"));
    }
    let admitted = load_cart(a, h).await?;
    let prepared_apps = apps::prepare_configurations(a, &admitted).await?;
    let prepared_hooks = apps::prepare_hooks(a, &admitted.tenant).await?;
    for i in &admitted.data.items {
        marketing::admit_product(a, h, &i.id).await?;
    }
    let (initial_config, _) = commerce::config(a, &admitted.tenant).await?;
    let prepared_policy = if initial_config.is_business(&admitted.data.group) {
        Some(sandbox_cache::prepare(a, &admitted.tenant).await?)
    } else {
        None
    };
    let (language_chain, locale_chain) = checkout_products::language(a, &admitted).await?;

    Ok(Prepared {
        admitted,
        prepared_apps,
        prepared_hooks,
        prepared_policy,
        language_chain,
        locale_chain,
    })
}
