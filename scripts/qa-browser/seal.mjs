import {randomBytes,publicEncrypt,createCipheriv} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
// Only ciphertext may leave the runner; the private key is never in this repository.
const key=randomBytes(32),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
const tar=execFileSync('tar',['-czf','-','-C','artifacts/browser-private','.'],{maxBuffer:100*1024*1024});
const ciphertext=Buffer.concat([cipher.update(tar),cipher.final()]);
mkdirSync('artifacts/browser-sealed',{recursive:true});
writeFileSync('artifacts/browser-sealed/evidence.enc',JSON.stringify({version:1,algorithm:'RSA-OAEP-SHA256/AES-256-GCM',key:publicEncrypt({key:readFileSync(new URL('./evidence-public.pem',import.meta.url)),oaepHash:'sha256'},key).toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:ciphertext.toString('base64')}));
