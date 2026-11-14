import {randomBytes,publicEncrypt,createCipheriv} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,createReadStream,createWriteStream,appendFileSync,renameSync,rmSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {join} from 'node:path';
// Only ciphertext may leave the runner; the private key is never in this repository.
// Stream the archive into encryption: expanded browser proof must not hit a
// subprocess maxBuffer or leave a plaintext archive on disk.
process.umask(0o077);
const key=randomBytes(32),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
const directory='artifacts/browser-sealed';mkdirSync(directory,{recursive:true});
const temporary=mkdtempSync(join(directory,'.seal-')),encrypted=join(temporary,'ciphertext'),envelope=join(temporary,'envelope');
const tar=spawn('tar',['-czf','-','-C','artifacts/browser-private','.'],{stdio:['ignore','pipe','ignore']});
const completed=new Promise((resolve,reject)=>{tar.once('error',()=>reject(new Error('Evidence archiver could not start')));tar.once('close',code=>code===0?resolve():reject(new Error('Evidence archive failed; private originals remain on the runner')))});
try{
 await Promise.all([pipeline(tar.stdout,cipher,createWriteStream(encrypted,{flags:'wx',mode:0o600})),completed]);
 const header={version:1,algorithm:'RSA-OAEP-SHA256/AES-256-GCM',key:publicEncrypt({key:readFileSync(process.env.QA_EVIDENCE_PUBLIC_KEY||new URL('./evidence-public.pem',import.meta.url)),oaepHash:'sha256'},key).toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64')};
 writeFileSync(envelope,JSON.stringify(header).slice(0,-1)+',"data":"',{flag:'wx',mode:0o600});
 let carry=Buffer.alloc(0);
 const base64=new Transform({
  transform(chunk,_encoding,callback){const data=carry.length?Buffer.concat([carry,chunk]):chunk,complete=data.length-data.length%3;if(complete)this.push(data.subarray(0,complete).toString('base64'));carry=Buffer.from(data.subarray(complete));callback()},
  flush(callback){if(carry.length)this.push(carry.toString('base64'));callback()},
 });
 await pipeline(createReadStream(encrypted),base64,createWriteStream(envelope,{flags:'a',mode:0o600}));
 appendFileSync(envelope,'"}');renameSync(envelope,join(directory,'evidence.enc'));
}finally{
 if(tar.exitCode===null)tar.kill();
 rmSync(temporary,{recursive:true,force:true});
}
