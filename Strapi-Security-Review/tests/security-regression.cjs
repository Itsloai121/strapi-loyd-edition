'use strict';
// Focused tests with boundary mocks; not a running Strapi integration suite.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require(process.env.AUDIT_TYPESCRIPT_PATH || 'typescript');
const root=process.argv[2]||process.cwd(); const results=[];
function load(rel,stubs={},globals={},append='') {
 let text=fs.readFileSync(path.join(root,rel),'utf8');
 if(rel.endsWith('.ts'))text=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const m={exports:{}}; const ctx={module:m,exports:m.exports,require:(id)=>id in stubs?stubs[id]:require(id),__dirname:path.dirname(path.join(root,rel)),console,process,Buffer,URL,AbortSignal,Response,fetch,...globals};
 vm.runInNewContext(text+'\n'+append,ctx,{filename:rel});return m.exports;
}
function envFor(values={}) { const e=(k,d)=>k in values?values[k]:d;e.int=(k,d)=>Number(e(k,d));e.bool=(k,d)=>e(k,d);e.array=(k,d)=>k in values?values[k].split(','):d;return e; }
async function test(name,f){await f();results.push({name,status:'Pass'});}
(async()=>{
 let options;const cors=load('packages/core/core/src/middlewares/cors.ts',{'@koa/cors':o=>{options=o;return o;}});
 await test('CORS default denies untrusted origin and disables credentials',async()=>{cors.cors({});assert.equal(options.credentials,false);assert.equal(await options.origin({get:()=> 'https://untrusted.example'}),'');});
 await test('CORS exact allowlist preserves trusted credentialed clients',async()=>{cors.cors({origin:['https://trusted.example'],credentials:true});assert.equal(await options.origin({get:()=> 'https://trusted.example'}),'https://trusted.example');assert.equal(await options.origin({get:()=> 'https://trusted.example.evil.invalid'}),'');});
 await test('CORS refuses wildcard credentials including dynamic origins',async()=>{for(const origin of ['*',()=>['*']]){cors.cors({origin,credentials:true});await assert.rejects(options.origin({get:()=> 'https://untrusted.example'}),/explicit origin allowlist/);}});
 await test('CORS rejects null, absent and missing-config origins',async()=>{assert.equal(await cors.matchOrigin('null','*'),'');assert.equal(await cors.matchOrigin(undefined,'*'),'');assert.equal(await cors.matchOrigin('https://untrusted.example',undefined),'');});
 const db=load('examples/getstarted/config/database.js');
 await test('Default SQLite requires no SQL password',()=>assert.equal(db({env:envFor()}).connection.client,'sqlite'));
 await test('SQL password required; configured host and port honored',()=>{assert.throws(()=>db({env:envFor({DB:'postgres'})}),/DATABASE_PASSWORD/);const d=db({env:envFor({DB:'postgres',DATABASE_PASSWORD:'test-only',DATABASE_PORT:'5544',DATABASE_HOST:'127.0.0.1'})});assert.equal(d.connection.connection.port,5544);assert.equal(d.connection.connection.host,'127.0.0.1');});
 await test('SQL port bounds reject invalid values',()=>{for(const p of ['0','-1','65536','NaN','1.5'])assert.throws(()=>db({env:envFor({DB:'mysql',DATABASE_PASSWORD:'test-only',DATABASE_PORT:p})}),/DATABASE_PORT/);});
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../change-manifest.json'),'utf8'));
 await test('Changed SQL templates permit SQLite and reject missing SQL passwords',()=>{
  for(const item of manifest.filter(x=>/\/config\/database\.(ts|js)$/.test(x.path)&&!x.path.includes('getstarted'))){
   const config=load(item.path,{'@strapi/database':{isDatabaseClientKind:x=>['sqlite','mysql','postgres'].includes(x)}});const factory=config.default||config;
   assert.equal(factory({env:envFor({DATABASE_CLIENT:'sqlite'})}).connection.client,'sqlite',item.path);
   assert.throws(()=>factory({env:envFor({DATABASE_CLIENT:'mysql'})}),/DATABASE_PASSWORD/,item.path);
   assert.equal(factory({env:envFor({DATABASE_CLIENT:'mysql',DATABASE_PASSWORD:'test-only'})}).connection.client,'mysql');
  }
 });
 await test('Changed secret-bearing admin configs reject missing secrets',()=>{
  for(const item of manifest.filter(x=>/\/config\/admin\.(ts|js)$/.test(x.path))){const c=load(item.path);assert.throws(()=>(c.default||c)({env:envFor()}),/32 characters/,item.path);}
 });
 await test('Changed server configs use loopback and require strong app keys',()=>{
  for(const item of manifest.filter(x=>/\/config\/server\.(ts|js)$/.test(x.path))){
   const c=load(item.path,{'./src/cron-tasks':{}});const config=(c.default||c)({env:envFor({APP_KEYS:'a'.repeat(32)+','+'b'.repeat(32)})});assert.equal(config.host,'127.0.0.1',item.path);
   if(fs.readFileSync(path.join(root,item.path),'utf8').includes('APP_KEYS requires'))assert.throws(()=>(c.default||c)({env:envFor()}),/APP_KEYS/,item.path);
  }
 });
 let currentEnv=process.env.NODE_ENV;process.env.NODE_ENV='production';
 const gql=load('packages/plugins/graphql/server/src/config/default-config.ts').default;process.env.NODE_ENV=currentEnv;
 await test('GraphQL production defaults bound depth and pagination; disable batching/introspection',()=>{assert.equal(gql.depthLimit,10);assert.equal(gql.maxLimit,100);assert.equal(gql.apolloServer.introspection,false);assert.equal(gql.apolloServer.allowBatchedHttpRequests,false);assert.equal(gql.apolloServer.csrfPrevention,true);});
 class ApplicationError extends Error{};class ValidationError extends Error{};
 let addresses=[{address:'203.0.113.8',family:4}],fetchCalls=0;
 const fileGlobals={strapi:{fetch:async(u,opts)=>{fetchCalls++;assert.equal(opts.redirect,'error');throw new Error('mock fetch stopped');}}};
 const file=load('packages/core/upload/server/src/services/file.ts',{
  'dns/promises':{lookup:async()=>addresses},'fs-extra':{},'lodash':{cloneDeep:structuredClone},
  '@strapi/utils':{errors:{ApplicationError},file:{bytesToHumanReadable:n=>String(n)}},'../constants':{},'../utils':{}
 },fileGlobals,'exports.auditFetch=fetchUrlToInputFile;');
 await test('URL import denies private, metadata, unspecified, CGNAT and mapped IPv4 destinations',async()=>{
  for(const address of ['127.0.0.1','10.0.0.1','169.254.169.254','0.0.0.0','100.64.1.1','::1','::','fc00::1','::ffff:127.0.0.1']){
   addresses=[{address,family:address.includes(':')?6:4}];const before=fetchCalls;await assert.rejects(file.auditFetch('https://test.invalid/file','/tmp'),/blocked address/);assert.equal(fetchCalls,before,address);
  }
 });
 await test('URL import rejects any private address in a mixed DNS answer',async()=>{addresses=[{address:'203.0.113.8',family:4},{address:'10.0.0.1',family:4}];await assert.rejects(file.auditFetch('https://test.invalid/file','/tmp'),/blocked address/);});
 await test('URL import passes redirect:error to fetch and rejects non-HTTP protocols',async()=>{addresses=[{address:'203.0.113.8',family:4}];await assert.rejects(file.auditFetch('https://test.invalid/file','/tmp'),/mock fetch stopped/);await assert.rejects(file.auditFetch('file:///etc/passwd','/tmp'),/protocol/);});
 let user,editCalls=[],revokeFails=true;
 const strapi={getModel:()=>({}),contentAPI:{sanitize:{output:async x=>x}},config:{get:(k,d)=>k==='plugin::users-permissions.jwtManagement'?'refresh':k==='plugin::users-permissions.sessions'?{}:d},db:{query:()=>({findOne:async()=>user})},log:{error:()=>{}},sessionManager:()=>({invalidateRefreshToken:async()=>{if(revokeFails)throw new Error('mock DB failure');},generateRefreshToken:async()=>({token:'mock-refresh'}),generateAccessToken:async()=>({token:'mock-access'})})};
 const auth=load('packages/plugins/users-permissions/server/src/controllers/auth.js',{
  lodash:{},'@strapi/utils':{errors:{ApplicationError,ValidationError,ForbiddenError:Error}},'../utils':{getService:()=>({edit:async(id,data)=>editCalls.push(data)})},
  '../utils/refresh-cookie-options':{},'./validation/auth':{validateResetPasswordBody:async x=>x}
 },{strapi})({strapi});
 function ctx(){return {state:{user:{id:1}},request:{body:{scope:'all',password:'test-only',passwordConfirmation:'test-only',code:'test-only'},header:{}},cookies:{get:()=>null},send:()=>{}};}
 await test('Logout fails visibly when server-side revocation throws',async()=>{await assert.rejects(auth.logout(ctx()),/Logout could not be completed/);});
 await test('Logout succeeds only when mocked revocation completes',async()=>{revokeFails=false;await auth.logout(ctx());});
 await test('Reset rejects missing, expired, boundary and invalid expiry without changing password',async()=>{
  for(const expiry of [undefined,'2000-01-01T00:00:00Z',new Date(Date.now()-1).toISOString(),'invalid']){user={id:1,resetPasswordTokenExpiresAt:expiry};const before=editCalls.length;await assert.rejects(auth.resetPassword(ctx()),/Incorrect code/);assert.equal(editCalls.length,before);}
 });
 await test('Reset accepts valid link and clears token and expiry',async()=>{user={id:1,resetPasswordTokenExpiresAt:new Date(Date.now()+600000).toISOString()};await auth.resetPassword(ctx());assert.equal(editCalls.at(-1).resetPasswordToken,null);assert.equal(editCalls.at(-1).resetPasswordTokenExpiresAt,null);});
 await test('Changed JS/TS files parse (syntax only, not typecheck)',()=>{
  for(const item of manifest.filter(x=>/\.(ts|js)$/.test(x.path))){const source=fs.readFileSync(path.join(root,item.path),'utf8');const out=ts.transpileModule(source,{fileName:item.path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});const errors=(out.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,item.path+JSON.stringify(errors.map(e=>e.messageText)));}
 });
 console.log(JSON.stringify({scope:'Isolated source-level regression tests with mocks. No deployed-app, Docker, database, or full type-check verification.',tests:results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
