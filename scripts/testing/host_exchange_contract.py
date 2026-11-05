"""Keep exported host inputs connected to native deserialization fields and admission schemas."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
contract=json.loads((ROOT/'extensions/sdk/host-exchange-v1.json').read_text())
assert contract['version']==1
schemas=contract['operations']
assert set(schemas)=={'record_action','channel','channel_product','order_import','job_enqueue','job_claim','job_progress'}
text=(ROOT/'src/commerce/external_order_input.rs').read_text()
def fields(name):
    body=re.search(r'struct '+name+r' \{(.*?)\n}',text,re.S)[1]
    return {re.sub(r'_([a-z])',lambda m:m[1].upper(),f) for f in re.findall(r'pub (\w+):',body)}
order=schemas['order_import']['inputSchema']
assert set(order['properties'])==fields('Input')
assert set(order['properties']['lines']['items']['properties'])==fields('Line')
assert set(order['properties']['shipping']['properties'])==fields('Amount')
address=(ROOT/'src/commerce/types.rs').read_text()
body=re.search(r'struct Address \{(.*?)\n}',address,re.S)[1]
expected={re.sub(r'_([a-z])',lambda m:m[1].upper(),f) for f in re.findall(r'pub (\w+):',body)}
assert set(order['properties']['billingAddress']['properties'])==expected
assert order['properties']['billingAddress']==order['properties']['shippingAddress']
print('PASS host contract fields agree with native order/line/amount/address DTOs and versioned job admission')
