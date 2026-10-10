#!/usr/bin/env python3
import pathlib,re,sys,json
import yaml
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.')
results=[]
for rel in ['docker-compose.dev.yml','docker-compose.test.yml','examples/complex/docker-compose.dev.yml']:
 doc=yaml.safe_load((root/rel).read_text())
 for name,svc in doc['services'].items():
  assert ':?' in svc['image'], (rel,name,'image must be operator-pinned')
  env=svc.get('environment',{})
  for key,value in env.items():
   if 'PASSWORD' in key:assert ':?' in str(value),(rel,key)
  assert 'MYSQL_ROOT_HOST' not in env,(rel,'remote root must not be enabled')
  for mapping in svc.get('ports',[]):
   assert mapping.startswith('${DATABASE_BIND_ADDRESS:-127.0.0.1}:'),(rel,mapping)
   assert re.search(r'\$\{(?:POSTGRES|MYSQL|MARIADB)_PORT:-\d+\}',mapping),(rel,mapping)
 results.append({'name':rel,'status':'Pass'})
print(json.dumps({'scope':'Static YAML/interpolation policy checks, not docker compose execution or network verification','tests':results},indent=2))
