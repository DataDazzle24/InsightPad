import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('./install-chromium.sh',import.meta.url));
function run(mode,extra={}){
 const root=mkdtempSync(join(tmpdir(),'insightpad-browser-installer-')),bin=join(root,'bin');mkdirSync(bin);
 const write=(name,text)=>writeFileSync(join(bin,name),'#!/usr/bin/env bash\nset -eu\n'+text,{mode:0o700});
 try{
 write('timeout','echo "timeout:$1" >> "$PROBE_LOG"\nshift\nexec "$@"\n');
 write('node',`echo "node:$*:connection=$PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT" >> "$PROBE_LOG"
 if [[ "$2" == install-deps ]]; then exit "\${DEPS_RESULT:-0}"; fi
 count=0; [[ ! -f "$PROBE_COUNT" ]] || count=$(cat "$PROBE_COUNT")
 count=$((count+1)); echo "$count" > "$PROBE_COUNT"
 if [[ "$count" -le "\${FAIL_DOWNLOADS:-0}" ]]; then exit 62; fi
 `);
 write('sudo','echo "sudo:$*" >> "$PROBE_LOG"\nexit "${APT_RESULT:-0}"\n');
 const result=spawnSync('bash',[script,...(mode?[mode]:[])],{env:{...process.env,PATH:bin+':'+process.env.PATH,PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT:'45000',PROBE_LOG:join(root,'log'),PROBE_COUNT:join(root,'count'),...extra},encoding:'utf8'});
 assert.ifError(result.error);return{status:result.status,log:existsSync(join(root,'log'))?readFileSync(join(root,'log'),'utf8'):'',downloads:existsSync(join(root,'count'))?Number(readFileSync(join(root,'count'),'utf8')):0};
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('installs the same Chromium system libraries and PDF tools under separate bounds',()=>{const r=run('dependencies');assert.equal(r.status,0);assert.match(r.log,/timeout:180s/);assert.match(r.log,/install-deps chromium:connection=45000/);assert.match(r.log,/timeout:120s/);assert.match(r.log,/apt-get .*install -y poppler-utils/);assert.equal(r.downloads,0);});
test('dependency failures stop before PDF installation or browser download',()=>{const r=run('dependencies',{DEPS_RESULT:'77'});assert.equal(r.status,77);assert.doesNotMatch(r.log,/sudo:/);assert.equal(r.downloads,0);});
test('PDF dependency failure remains fatal',()=>assert.equal(run('dependencies',{APT_RESULT:'78'}).status,78));
test('successful pinned browser download runs once and retains its connection deadline',()=>{const r=run('browser');assert.equal(r.status,0);assert.equal(r.downloads,1);assert.match(r.log,/install chromium:connection=45000/);assert.doesNotMatch(r.log,/sudo:|install-deps/);});
test('retries one failed download and succeeds only after a successful installer',()=>{const r=run('browser',{FAIL_DOWNLOADS:'1'});assert.equal(r.status,0);assert.equal(r.downloads,2);assert.equal((r.log.match(/timeout:180s/g)||[]).length,2);});
test('two failures preserve a failing exit code and do not continue indefinitely',()=>{const r=run('browser',{FAIL_DOWNLOADS:'9'});assert.equal(r.status,62);assert.equal(r.downloads,2);});
test('unknown or missing provisioning mode cannot run another command',()=>{for(const mode of [undefined,'unapproved']){const r=run(mode);assert.equal(r.status,2);assert.equal(r.log,'');}});
