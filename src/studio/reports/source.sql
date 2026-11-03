-- Native immutable order money and channel attribution. Every merchant/filter input is bound, not interpolated.
WITH base AS (
 SELECT o.id,o.cart_id,o.created_at,o.data,
 coalesce(o.data#>>'{money,currency,code}',o.data#>>'{cart,price,currency}','EUR') AS currency,
 coalesce((o.data#>>'{money,currency,scale}')::int,(o.data#>>'{cart,price,currencyScale}')::int,2) AS scale,
 coalesce(o.data#>>'{cart,salesChannelId}',c.data->>'sales_channel','default') AS channel,
 coalesce(sc.data->>'kind',CASE o.data->>'channel' WHEN 'pos' THEN 'pos' WHEN 'marketplace' THEN 'marketplace' ELSE 'storefront' END) AS kind,
 CASE WHEN o.data#>>'{money,minor}' IS NOT NULL THEN (o.data#>>'{money,minor}')::numeric/power(10::numeric,(o.data#>>'{money,currency,scale}')::int)
 ELSE coalesce((o.data#>>'{cart,price,totalPrice}')::numeric,0) END AS amount,
 coalesce(p.refunded_minor,0)::numeric/power(10::numeric,coalesce(p.currency_scale,2)) AS refunds,
 (o.data#>>'{payment,provider}'='simulated' OR coalesce(p.environment,'')='simulation') AS simulated
 FROM orders o LEFT JOIN carts c ON c.tenant=o.tenant AND c.id=o.cart_id
 LEFT JOIN sales_channels sc ON sc.tenant=o.tenant AND sc.id=coalesce(o.data#>>'{cart,salesChannelId}',c.data->>'sales_channel','default')
 LEFT JOIN payment_attempts p ON p.tenant=o.tenant AND p.id=o.data#>>'{payment,attemptId}'
 WHERE o.tenant=$1 AND o.created_at>=($2::date::timestamp AT TIME ZONE $6) AND o.created_at<($4::date::timestamp AT TIME ZONE $6)
 AND coalesce(o.data->>'state','placed') NOT IN ('cancelled','expired','payment_review')
 AND coalesce(o.data#>>'{payment,state}','') NOT IN ('failed','cancelled','expired')
), scoped AS (
 SELECT * FROM base WHERE currency=$7 AND ($8::text IS NULL OR channel=$8) AND ($9='all' OR kind=$9)
)
