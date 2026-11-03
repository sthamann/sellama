"""Native planner presentation cannot navigate outside the current tenant or bypass domain rights."""
import uuid

def verify_navigation(call, behavior, passed):
    before = call('/api/merchant/products/lamp')['commerce']['price']
    behavior.update(mode='navigation-plan', navigation={'view':'productData','id':'lamp'})
    planned = call('/api/agent/chat', {'message':'Open the selected native product without changing it.', 'workspaceContext':{'view':'productData','selected':{'kind':'product','id':'lamp'}}, 'inference':{'provider':'openai'}})
    assert planned['messages'][-1]['data']['preview']['proposal']['navigation'] == behavior['navigation'], planned
    assert planned['messages'][-1]['data']['preview']['workspaceContext']['selected']['id']=='lamp'
    assert call('/api/merchant/products/lamp')['commerce']['price']==before
    for target in [{'view':'productData','id':'unavailable-foreign-record'}, {'view':'commerce','id':'lamp'}, {'view':'https://evil.example','id':None}, {'view':'productData','id':'lamp','tenant':'atelier'}]:
        behavior['navigation']=target
        rejected=call('/api/agent/chat',{'message':'Reject invalid native navigation.', 'inference':{'provider':'openai'}})
        assert rejected['messages'][-1]['data'].get('error') and not rejected['messages'][-1]['data'].get('taskId'), rejected
    suffix=uuid.uuid4().hex[:10]
    owner=call('/api/auth/register',{'workspaceId':'navigation-'+suffix,'name':'Navigation fixture','email':suffix+'@example.test','password':'Synthetic-navigation-2026!'},headers={})
    h={'Authorization':'Bearer '+owner['token'],'x-tenant':owner['workspace']}
    foreign='foreign_nav_'+suffix
    call('/api/merchant/products',{'id':foreign,'revision':0,'catalog':{'active':True,'parentId':None,'productNumber':foreign,'options':{},'categoryIds':[]},'commerce':{'price':15,'taxRate':19,'stock':10,'minPurchase':1,'purchaseSteps':1,'maxPurchase':None,'deliveryDays':2,'listPrice':None,'advancedPrices':[],'media':[],'properties':{}},'extra':{},'translations':{'en':{'name':'Foreign native fixture','description':'Other tenant only'}}},headers=h)
    behavior['navigation']={'view':'productData','id':foreign}
    rejected=call('/api/agent/chat',{'message':'Reject a real foreign product reference','inference':{'provider':'openai'}})
    assert rejected['messages'][-1]['data'].get('error'),rejected
    role='copilot_'+suffix
    call('/api/workspace/roles/'+role,{'revision':0,'data':{'name':{'en-GB':'Read products only'},'permissions':['assistant.use','catalog.read','orders.read','knowledge.read'],'active':True}},headers=h,method='PUT')
    invitation=call('/api/workspace/invitations',{'role':role,'email':'reader-'+suffix+'@example.test'},headers=h)
    reader=call('/api/auth/accept',{'invitationToken':invitation['token'],'name':'Restricted reader','password':'Synthetic-navigation-2026!'},headers={})
    rh={'Authorization':'Bearer '+reader['token'],'x-tenant':owner['workspace']}
    for target in [{'view':'commerce','id':None},{'view':'orders','id':None}]:
        behavior['navigation']=target
        rejected=call('/api/agent/chat',{'message':'Reject navigation without domain or PII rights','inference':{'provider':'openai'}},headers=rh)
        assert rejected['messages'][-1]['data'].get('error'),rejected
    behavior.update(mode='normal')
    passed('Persistent assistant navigation binds selected context, rejects foreign/malformed/URL targets and leaves product data unchanged')
