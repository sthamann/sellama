-- One bounded aggregate result, no customer projection and no floating-point monetary accumulation.
, totals AS (
 SELECT CASE WHEN created_at>=($3::date::timestamp AT TIME ZONE $6) THEN 'current' ELSE 'previous' END AS period,
 count(*) AS orders,coalesce(sum(amount),0)::text AS revenue,coalesce(sum(refunds),0)::text AS refunds,
 coalesce(avg(amount),0)::text AS average,count(*) FILTER(WHERE simulated) AS simulated
 FROM scoped GROUP BY 1
), buckets AS (
 SELECT d::date AS day FROM generate_series(date_trunc($5,$3::date::timestamp),($4::date-1)::timestamp,('1 '||$5)::interval) d
), trend AS (
 SELECT b.day::text AS day,count(s.id) AS orders,coalesce(sum(s.amount),0)::text AS revenue,
 coalesce(sum(s.refunds),0)::text AS refunds,coalesce(avg(s.amount),0)::text AS average
 FROM buckets b LEFT JOIN scoped s ON s.created_at>=($3::date::timestamp AT TIME ZONE $6)
 AND date_trunc($5,s.created_at AT TIME ZONE $6)::date=b.day GROUP BY b.day ORDER BY b.day
), channels AS (
 SELECT channel,kind,count(*) AS orders,sum(amount)::text AS revenue,sum(refunds)::text AS refunds
 FROM scoped WHERE created_at>=($3::date::timestamp AT TIME ZONE $6) GROUP BY channel,kind ORDER BY sum(amount) DESC,channel LIMIT 100
), products AS (
 SELECT coalesce(l->>'referencedId',l->>'id') AS id,min(l->>'label') AS name,sum((l->>'quantity')::bigint)::text AS quantity,
 sum(coalesce((l#>>'{price,totalPrice}')::numeric,0))::text AS revenue,count(DISTINCT s.id) AS orders
 FROM scoped s CROSS JOIN LATERAL jsonb_array_elements(coalesce(s.data#>'{cart,lineItems}','[]')) l
 WHERE created_at>=($3::date::timestamp AT TIME ZONE $6) AND coalesce(l->>'type','product')='product'
 GROUP BY 1 ORDER BY sum(coalesce((l#>>'{price,totalPrice}')::numeric,0)) DESC,1 LIMIT 20
)
SELECT jsonb_build_object('currencyScale',(SELECT max(scale) FROM scoped),'totals',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM totals t),'[]'),
 'trend',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM trend t),'[]'),
 'channels',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM channels t),'[]'),
 'products',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM products t),'[]'))
