"""Synthetic historical report fixtures use the same explicit local PostgreSQL test bridge as other native suites."""
import os,re,subprocess
from decimal import Decimal
from urllib.parse import urlsplit
from .database import psql

def verify(tenant,report):
    assert urlsplit(os.environ['BASE_URL']).hostname in ('127.0.0.1','localhost')
    assert re.fullmatch(r'reports-[a-f0-9]{9}',tenant)
    url=urlsplit(os.environ['DATABASE_URL'])
    command=psql(os.environ.get('TEST_DB_CONTAINER','veyndo-postgres-1'),url.username or 'commerce',os.environ.get('TEST_DATABASE',url.path.lstrip('/')),'-v','ON_ERROR_STOP=1','-At')
    def sql(value):
        subprocess.run(command,input=value,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
    sql(f"""WITH original AS (SELECT * FROM orders WHERE tenant='{tenant}' ORDER BY created_at LIMIT 1), fixtures AS (
     SELECT g::text AS n,now()-(g*3||' days')::interval AS time FROM generate_series(1,50)g
    ), newc AS (
     INSERT INTO carts(id,tenant,token,data,status) SELECT 'report-cart-{tenant}-'||f.n,'{tenant}','report-token-{tenant}-'||f.n,jsonb_set(c.data,'{{order}}','null'),'ordered' FROM original o JOIN carts c ON c.tenant=o.tenant AND c.id=o.cart_id CROSS JOIN fixtures f RETURNING id
    )
    INSERT INTO orders(id,tenant,cart_id,idempotency_key,fingerprint,data,created_at)
    SELECT 'report-order-{tenant}-'||f.n,'{tenant}','report-cart-{tenant}-'||f.n,'report-key-'||f.n,'fixture',
     jsonb_set(o.data,'{{id}}',to_jsonb('report-order-{tenant}-'||f.n)),f.time FROM original o CROSS JOIN fixtures f;""")
    all_time=report({'period':'all','interval':'month'})
    assert sum(v['orders']for v in all_time['totals'])==52
    assert len(all_time['trend'])>=5
    assert len(report({'period':'last90','interval':'week'})['trend'])>10
    sql(f"UPDATE orders SET data=jsonb_set(data,'{{state}}','\"cancelled\"') WHERE tenant='{tenant}' AND id='report-order-{tenant}-1'")
    assert sum(v['orders']for v in report({'period':'all'})['totals'])==51
    sql(f"UPDATE orders SET data=jsonb_set(jsonb_set(data,'{{money,currency}}','{{\"code\":\"JPY\",\"scale\":0}}'),'{{money,minor}}','1200') WHERE tenant='{tenant}' AND id='report-order-{tenant}-2'")
    yen=report({'period':'all','currency':'JPY'})
    assert Decimal(yen['totals'][0]['revenue'])==Decimal('1200')
    assert yen['filters']['currency']=='JPY' and yen['filters']['currencyScale']==0

    for kind,n in [('marketplace',3),('headless',4)]:
        sql(f"UPDATE carts SET data=jsonb_set(data,'{{sales_channel}}',to_jsonb('{kind}'::text)) WHERE tenant='{tenant}' AND id='report-cart-{tenant}-{n}'")
        grouped=report({'period':'all','channelType':kind})
        assert sum(v['orders']for v in grouped['totals'])==1
        assert grouped['channels'][0]['channel']==kind and grouped['channels'][0]['kind']==kind
