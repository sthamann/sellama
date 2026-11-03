"""Original compact GLB furniture fixture with embedded geometry and two material variants; no external assets."""
import json,struct

def glb(doc, binary=b''):
    data=json.dumps(doc,separators=(',',':')).encode();data+=b' '*((-len(data))%4)
    tail=struct.pack('<I4s',len(binary),b'BIN\0')+binary if binary else b''
    return b'glTF'+struct.pack('<III4s',2,20+len(data)+len(tail),len(data),b'JSON')+data+tail

def model(wide=False):
    positions=[];normals=[];indices=[]
    # A stool assembled from five cuboids, authored as native test data.
    boxes=[((0,.5,0),(1.4 if wide else 1,.15,.8))]+[((x,0,z),(.13,.9,.13))for x in [-.37,.37]for z in [-.27,.27]]
    faces=[((1,0,0),[(1,-1,-1),(1,1,-1),(1,1,1),(1,-1,1)]),((-1,0,0),[(-1,-1,1),(-1,1,1),(-1,1,-1),(-1,-1,-1)]),((0,1,0),[(-1,1,-1),(-1,1,1),(1,1,1),(1,1,-1)]),((0,-1,0),[(-1,-1,1),(-1,-1,-1),(1,-1,-1),(1,-1,1)]),((0,0,1),[(1,-1,1),(1,1,1),(-1,1,1),(-1,-1,1)]),((0,0,-1),[(-1,-1,-1),(-1,1,-1),(1,1,-1),(1,-1,-1)])]
    for center,size in boxes:
        for normal,vertices in faces:
            start=len(positions)//3
            for vertex in vertices:
                positions.extend(c+v*s/2 for c,v,s in zip(center,vertex,size));normals.extend(normal)
            indices.extend(start+i for i in [0,1,2,0,2,3])
    p=struct.pack('<'+'f'*len(positions),*positions);n=struct.pack('<'+'f'*len(normals),*normals);i=struct.pack('<'+'H'*len(indices),*indices);binary=p+n+i;binary+=b'\0'*((-len(binary))%4)
    doc={'asset':{'version':'2.0','generator':'Veyndo original test fixture'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0}],'extensionsUsed':['KHR_materials_variants'],'extensions':{'KHR_materials_variants':{'variants':[{'name':'Oak'},{'name':'Ocean'}]}},'buffers':[{'byteLength':len(binary)}],'bufferViews':[{'buffer':0,'byteOffset':0,'byteLength':len(p),'target':34962},{'buffer':0,'byteOffset':len(p),'byteLength':len(n),'target':34962},{'buffer':0,'byteOffset':len(p)+len(n),'byteLength':len(i),'target':34963}],'accessors':[{'bufferView':0,'componentType':5126,'count':len(positions)//3,'type':'VEC3','min':[-.7,-.45,-.4],'max':[.7,.575,.4]},{'bufferView':1,'componentType':5126,'count':len(normals)//3,'type':'VEC3'},{'bufferView':2,'componentType':5123,'count':len(indices),'type':'SCALAR'}],'materials':[{'name':name,'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':0,'roughnessFactor':.6}}for name,color in [('Oak',[.55,.28,.1,1]),('Ocean',[.025,.25,.6,1])]],'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1},'indices':2,'material':0,'extensions':{'KHR_materials_variants':{'mappings':[{'material':0,'variants':[0]},{'material':1,'variants':[1]}]}}}]}]}
    return glb(doc,binary)
