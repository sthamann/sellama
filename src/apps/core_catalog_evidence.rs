//! Product-only app callback projects current catalog text and enabled translations in one snapshot.
use super::*;

pub(super) async fn read(a: &App, tenant: &str, id: &str) -> Result<Value> {
    let (settings, _) = crate::commerce::config(a, tenant).await?;
    let product = sqlx::query_scalar(
        "SELECT jsonb_build_object(
          'id',p.id,'active',p.active,'locale',$3::text,
          'relationships',jsonb_build_object('parentId',p.parent_id,
            'crossSellingIds',CASE WHEN jsonb_typeof(p.extra->'crossSelling')='array'
              THEN p.extra->'crossSelling' ELSE '[]'::jsonb END),
          'title',coalesce(main.name,p.name),'content',coalesce(main.description,p.description),
          'translations',coalesce((SELECT jsonb_object_agg(l.locale,jsonb_build_object('title',tr.name,'content',tr.description))
           FROM product_translations tr JOIN languages l ON l.id=tr.language_id
           WHERE tr.tenant=p.tenant AND tr.product_id=p.id AND l.locale=ANY($4)
             AND l.locale<>$3 AND (tr.name IS NOT NULL OR tr.description IS NOT NULL)), '{}'::jsonb))
         FROM products p
         LEFT JOIN languages lang ON lang.locale=$3
         LEFT JOIN product_translations main ON main.tenant=p.tenant AND main.product_id=p.id AND main.language_id=lang.id
         WHERE p.tenant=$1 AND p.id=$2",
    )
    .bind(tenant).bind(id).bind(&settings.main_locale).bind(&settings.locales)
    .fetch_optional(&a.db).await?;
    Ok(product.unwrap_or_else(|| json!({"id":id,"active":false})))
}
