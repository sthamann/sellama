-- Sessions are observed cart contexts with current consent, not people or HTTP request counts.
, measured AS (
 SELECT e.*,CASE WHEN e.created_at>=($3::date::timestamp AT TIME ZONE $6) THEN 'current' ELSE 'previous' END AS period,
 EXISTS(SELECT 1 FROM scoped s WHERE s.cart_id=e.cart_id
 AND ((e.created_at>=($3::date::timestamp AT TIME ZONE $6))=(s.created_at>=($3::date::timestamp AT TIME ZONE $6)))) AS converted
 FROM events e WHERE e.created_at>=($2::date::timestamp AT TIME ZONE $6) AND e.created_at<($4::date::timestamp AT TIME ZONE $6)
), totals AS (
 SELECT period,count(*) AS events,count(*) FILTER(WHERE kind='page_view') AS pageviews,
 count(DISTINCT session) AS visits,count(DISTINCT session) FILTER(WHERE kind='product_view') AS viewed,
 count(DISTINCT session) FILTER(WHERE kind='cart_add') AS added,count(DISTINCT session) FILTER(WHERE kind='checkout_start') AS checkout,
 count(DISTINCT session) FILTER(WHERE converted) AS converted FROM measured GROUP BY period
), daily AS (
 SELECT date_trunc($5,created_at AT TIME ZONE $6)::date::text AS day,count(DISTINCT session) AS visits,
 count(DISTINCT session) FILTER(WHERE converted) AS converted,count(*) FILTER(WHERE kind='page_view') AS pageviews
 FROM measured WHERE period='current' GROUP BY 1 ORDER BY 1
), channels AS (
 SELECT channel_id AS channel,count(DISTINCT session) AS visits,count(DISTINCT session) FILTER(WHERE converted) AS converted
 FROM measured WHERE period='current' GROUP BY channel_id ORDER BY channel_id
), coverage AS (
 SELECT channel,(now()-make_interval(days=>days)) AS since,days FROM policies ORDER BY channel
)
SELECT jsonb_build_object('totals',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM totals t),'[]'),
 'daily',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM daily t),'[]'),
 'channels',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM channels t),'[]'),
 'coverage',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM coverage t),'[]'),
 'basis','observed_cart_contexts','captured',now()::text)
