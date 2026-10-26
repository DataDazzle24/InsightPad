import {privateDecrypt,createDecipheriv} from 'node:crypto';import {readFileSync,writeFileSync} from 'node:fs';
const [keyFile,input,output]=process.argv.slice(2);if(!output)throw Error('Usage: node decrypt.mjs PRIVATE.pem evidence.enc OUTPUT.tar.gz');
const e=JSON.parse(readFileSync(input,'utf8'));if(e.version!==1||e.algorithm!=='RSA-OAEP-SHA256/AES-256-GCM')throw Error('Unsupported envelope');
const key=privateDecrypt({key:readFileSync(keyFile),oaepHash:'sha256'},Buffer.from(e.key,'base64'));
const d=createDecipheriv('aes-256-gcm',key,Buffer.from(e.iv,'base64'));d.setAuthTag(Buffer.from(e.tag,'base64'));
const plain=Buffer.concat([d.update(Buffer.from(e.data,'base64')),d.final()]);writeFileSync(output,plain,{mode:0o600});
