//! Shared native commerce reports for Studio, workspace, API and agent reads; no second analytics ledger.
use crate::*;
pub(crate) mod config;
mod period;
mod traffic;
pub(crate) use config::schema;
pub(crate) fn visible(h: &RequestContext) -> bool {
    auth::allowed(h, "overview.read") || auth::allowed(h, "orders.read")
}
pub(crate) fn router() -> Router<App> {
    Router::new().secure_route("/api/merchant/reports", &[("POST", "read")], post(http))
}
async fn http(
    State(a): State<App>,
    h: RequestContext,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    Ok(Json(invoke(&a, &h, &v).await?))
}
pub(crate) async fn invoke(a: &App, h: &RequestContext, v: &Value) -> Result<Value> {
    let t = merchant(a, h)?;
    if !visible(h) {
        return Err(Error(
            StatusCode::FORBIDDEN,
            "Shop reporting permission required".into(),
        ));
    }
    let q: config::Query =
        serde_json::from_value(v.clone()).map_err(|_| bad("Invalid report filters"))?;
    q.validate()?;
    let (settings, _) = commerce::config(a, &t).await?;
    let currency = q
        .currency
        .as_deref()
        .unwrap_or(&settings.currencies.base_currency);
    let tz = q
        .timezone
        .parse::<chrono_tz::Tz>()
        .map_err(|_| bad("Invalid report timezone"))?;
    let earliest: Option<String> = sqlx::query_scalar(
        "SELECT (min(created_at) AT TIME ZONE $2)::date::text FROM orders WHERE tenant=$1",
    )
    .bind(&t)
    .bind(&q.timezone)
    .fetch_one(&a.db)
    .await?;
    let earliest = earliest.and_then(|d| chrono::NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok());
    let p = period::resolve(
        &q,
        chrono::Utc::now().with_timezone(&tz).date_naive(),
        earliest,
    )?;
    let mut tx = a.db.begin_read_snapshot().await?;
    let sql = format!(
        "{}{}",
        include_str!("reports/source.sql"),
        include_str!("reports/sales.sql")
    );
    let mut data: Value = sqlx::query_scalar(sqlx::AssertSqlSafe(sql.as_str()))
        .bind(&t)
        .bind(if q.compare { &p.previous } else { &p.from })
        .bind(&p.from)
        .bind(&p.to)
        .bind(&p.interval)
        .bind(&q.timezone)
        .bind(currency)
        .bind(&q.channel)
        .bind(&q.channel_type)
        .fetch_one(&mut *tx)
        .await?;
    let rows=sqlx::query("SELECT s.id,s.data->'name' AS name,s.data->>'kind' AS kind,o.data AS overrides FROM sales_channels s LEFT JOIN commerce_overrides o ON o.tenant=s.tenant AND o.channel_id=s.id WHERE s.tenant=$1 ORDER BY s.id LIMIT 501").bind(&t).fetch_all(&mut *tx).await?;
    if rows.len() > 500 {
        return Err(bad(
            "Report channel limit exceeded; select a smaller shop scope",
        ));
    }
    if q.channel
        .as_ref()
        .is_some_and(|id| !rows.iter().any(|r| r.get::<String, _>("id") == *id))
    {
        return Err(Error(
            StatusCode::NOT_FOUND,
            "Report channel not found".into(),
        ));
    }
    let (locale, chain) = language_context(a, h).await?;
    let channels=rows.iter().map(|r| {
        let id:String=r.get("id");let names:Value=r.get("name");
        let name=chain.iter().find_map(|l|names[l].as_str()).or_else(||names[&locale].as_str()).or_else(||names[&settings.main_locale].as_str()).unwrap_or(&id);
        json!({"id":id,"name":if auth::allowed(h,"channels.read"){name}else{&id},"kind":r.get::<Option<String>,_>("kind").unwrap_or_else(||"storefront".into())})
    }).collect::<Vec<_>>();
    let mut currencies=sqlx::query_scalar::<_,String>("SELECT DISTINCT coalesce(data#>>'{money,currency,code}',data#>>'{cart,price,currency}','EUR') FROM orders WHERE tenant=$1 ORDER BY 1 LIMIT 100").bind(&t).fetch_all(&mut *tx).await?;
    if !currencies.iter().any(|c| c == currency) {
        currencies.push(currency.to_string());
    }
    if !auth::allowed(h, "catalog.read") {
        data["products"] = json!([]);
    }
    let traffic = if auth::allowed(h, "knowledge.read") {
        traffic::read(&mut tx, &t, &q, &p, currency, &settings, &rows).await?
    } else {
        Value::Null
    };
    tx.commit().await?;
    data["traffic"] = traffic;
    let scale = data["currencyScale"]
        .as_i64()
        .unwrap_or(currencies::scale(currency).unwrap_or(2) as i64);
    data["filters"] = json!({"from":p.from,"toExclusive":p.to,"previousFrom":p.previous,"interval":p.interval,"timezone":q.timezone,"currency":currency,"currencyScale":scale,"channels":channels,"currencies":currencies});
    data["permissions"] = json!({"traffic":auth::allowed(h,"knowledge.read"),"products":auth::allowed(h,"catalog.read")});
    data["sandbox"] = json!(staging::parent(a, &t).await?.is_some());
    Ok(data)
}
