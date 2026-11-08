//! Single-use checkout transfer for independent storefronts; no app-specific catalog or checkout rules.
use crate::*;
use axum::http::header::CACHE_CONTROL;

pub(crate) fn router() -> Router<App> {
    Router::new()
        .route("/checkout", get(crate::checkout_page::page))
        .route("/store-api/checkout/handoff", post(issue_http))
        .route("/store-api/checkout/handoff/consume", post(consume))
        .route("/store-api/checkout/handoff/recover", post(recover))
}

async fn issue_http(
    state: State<App>,
    h: RequestContext,
    body: Json<Value>,
) -> Result<impl IntoResponse> {
    Ok(([(CACHE_CONTROL, "no-store")], issue(state, h, body).await?))
}

pub(crate) async fn issue(
    State(a): State<App>,
    h: RequestContext,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    let t = tenant(&h)?;
    let _ = load_cart(&a, &h).await?;
    let mut tx = a.db.begin().await?;
    let r = sqlx::query("SELECT * FROM carts WHERE tenant=$1 AND token=$2 FOR UPDATE")
        .bind(&t)
        .bind(token(&h)?)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or(bad("Cart unavailable"))?;
    let c = stored(&r)?;
    pos::guard_cart(&h, &c)?;
    b2b::guard_conn(&mut tx, &h, &c).await?;
    if c.status != "open" || c.data.items.is_empty() || v["revision"].as_i64() != Some(c.revision) {
        return Err(conflict("Cart changed, empty or terminal"));
    }
    let ticket = uid();
    let parent = v["parentOrigin"].as_str();
    let recovery = if let Some(origin) = parent {
        checkout_page::registered_parent(&mut tx, &t, &c.data.sales_channel, origin).await?;
        Some(uid())
    } else {
        None
    };
    sqlx::query("DELETE FROM checkout_handoffs WHERE tenant=$1 AND greatest(expires_at,recovery_expires_at)<now()")
        .bind(&t)
        .execute(&mut *tx)
        .await?;
    sqlx::query("INSERT INTO checkout_handoffs(digest,tenant,cart_id,expires_at,recovery_digest,recovery_origin,recovery_expires_at) VALUES($1,$2,$3,now()+interval '10 minutes',$4,$5,CASE WHEN $4 IS NOT NULL THEN now()+interval '24 hours' END) ON CONFLICT(cart_id) DO UPDATE SET digest=EXCLUDED.digest,expires_at=EXCLUDED.expires_at,recovery_digest=EXCLUDED.recovery_digest,recovery_origin=EXCLUDED.recovery_origin,recovery_expires_at=EXCLUDED.recovery_expires_at,consumed_at=NULL")
        .bind(hash(&ticket)).bind(&t).bind(&c.id).bind(recovery.as_deref().map(hash)).bind(parent).execute(&mut *tx).await?;
    tx.commit().await?;
    let mut result =
        json!({"checkoutPath":checkout_path(&c, &ticket),"expiresInSeconds":600,"singleUse":true});
    if let Some(key) = recovery {
        result["recovery"] = json!({"cartId":c.id,"key":key});
    }
    Ok(Json(result))
}

fn checkout_path(c: &StoredCart, ticket: &str) -> String {
    format!(
        "/checkout?shop={}&channel={}&language={}#checkout/{ticket}",
        c.tenant, c.data.sales_channel, c.data.locale
    )
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Recovery {
    cart_id: String,
    key: String,
    parent_origin: String,
    #[serde(default)]
    reopen: bool,
}

fn unavailable() -> Error {
    Error(
        StatusCode::NOT_FOUND,
        "Hosted checkout recovery unavailable".into(),
    )
}

async fn recover(
    State(a): State<App>,
    h: RequestContext,
    Json(input): Json<Recovery>,
) -> Result<impl IntoResponse> {
    let t = tenant(&h)?;
    let channel = marketing::channel_id(&h);
    if [&input.cart_id, &input.key]
        .iter()
        .any(|s| s.len() != 32 || !s.bytes().all(|b| b.is_ascii_hexdigit()))
    {
        return Err(unavailable());
    }
    let mut tx = a.db.begin().await?;
    checkout_page::registered_parent(&mut tx, &t, channel, &input.parent_origin).await?;
    let digest = hash(&input.key);
    let row = sqlx::query("SELECT c.* FROM carts c JOIN checkout_handoffs h ON h.cart_id=c.id AND h.tenant=c.tenant WHERE c.tenant=$1 AND c.id=$2 AND h.recovery_digest=$3 AND h.recovery_origin=$4 AND h.recovery_expires_at>clock_timestamp() FOR UPDATE OF c")
        .bind(&t).bind(&input.cart_id).bind(&digest).bind(&input.parent_origin).fetch_optional(&mut *tx).await?
        .ok_or_else(unavailable)?;
    let c = stored(&row)?;
    let admitted: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM checkout_handoffs WHERE tenant=$1 AND cart_id=$2 AND recovery_digest=$3 AND recovery_origin=$4 AND recovery_expires_at>clock_timestamp())")
        .bind(&t).bind(&c.id).bind(&digest).bind(&input.parent_origin).fetch_one(&mut *tx).await?;
    if !admitted || c.data.sales_channel != channel {
        return Err(unavailable());
    }
    pos::guard_cart(&h, &c)?;
    b2b::guard_conn(&mut tx, &h, &c).await?;
    let result = if c.status == "completed" {
        let order = c
            .data
            .order
            .as_ref()
            .and_then(|o| o["id"].as_str())
            .ok_or_else(unavailable)?;
        json!({"state":"ordered","completion":{"cartId":c.id,"token":c.token,"orderId":order}})
    } else if c.status == "open" && input.reopen {
        let ticket = uid();
        // Fence the old frame before allowing a replacement ticket for this same cart.
        sqlx::query("UPDATE carts SET token=$1,revision=revision+1 WHERE tenant=$2 AND id=$3")
            .bind(uid())
            .bind(&t)
            .bind(&c.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("UPDATE checkout_handoffs SET digest=$1,expires_at=now()+interval '10 minutes',consumed_at=NULL WHERE tenant=$2 AND cart_id=$3")
            .bind(hash(&ticket)).bind(&t).bind(&c.id).execute(&mut *tx).await?;
        json!({"state":"open","checkoutPath":checkout_path(&c, &ticket)})
    } else if c.status == "open" {
        json!({"state":"open"})
    } else {
        return Err(unavailable());
    };
    tx.commit().await?;
    Ok(([(CACHE_CONTROL, "no-store")], Json(result)))
}
async fn consume(
    State(a): State<App>,
    h: RequestContext,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    let t = tenant(&h)?;
    let ticket = v["ticket"]
        .as_str()
        .filter(|s| s.len() == 32 && s.bytes().all(|b| b.is_ascii_hexdigit()))
        .ok_or(bad("Invalid checkout ticket"))?;
    let mut tx = a.db.begin().await?;
    // Lock the cart first, matching issue/order lock order. The secret remains only in the browser fragment.
    let r = sqlx::query("SELECT c.* FROM carts c JOIN checkout_handoffs h ON h.cart_id=c.id AND h.tenant=c.tenant WHERE h.tenant=$1 AND h.digest=$2 AND h.expires_at>now() AND h.consumed_at IS NULL FOR UPDATE OF c")
        .bind(&t).bind(hash(ticket)).fetch_optional(&mut *tx).await?
        .ok_or(Error(StatusCode::GONE,"Checkout ticket expired or already used".into()))?;
    let c = stored(&r)?;
    pos::guard_cart(&h, &c)?;
    b2b::guard_conn(&mut tx, &h, &c).await?;
    if c.data.sales_channel != marketing::channel_id(&h) {
        return Err(Error(
            StatusCode::FORBIDDEN,
            "Cart belongs to another sales channel".into(),
        ));
    }
    if c.status != "open" {
        return Err(conflict("Cart is terminal"));
    }
    let consumed = sqlx::query(
        "UPDATE checkout_handoffs SET consumed_at=clock_timestamp() WHERE tenant=$1 AND digest=$2 AND expires_at>clock_timestamp() AND consumed_at IS NULL",
    )
    .bind(&t)
    .bind(hash(ticket))
    .execute(&mut *tx)
    .await?
    .rows_affected();
    if consumed != 1 {
        return Err(Error(
            StatusCode::GONE,
            "Checkout ticket already used".into(),
        ));
    }
    let r = sqlx::query(
        "UPDATE carts SET token=$1,revision=revision+1 WHERE tenant=$2 AND id=$3 RETURNING *",
    )
    .bind(uid())
    .bind(&t)
    .bind(&c.id)
    .fetch_one(&mut *tx)
    .await?;
    let c = stored(&r)?;
    pos::guard_cart(&h, &c)?;
    b2b::guard_conn(&mut tx, &h, &c).await?;
    tx.commit().await?;
    Ok(Json(cart_json(&a, &c).await?))
}
