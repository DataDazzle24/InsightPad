import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
// Screens a saved official diff; never executes SQL or authorizes migration.
export function screenSchemaDiff(text){
 const findings=[];
 if(!text.trim())findings.push('EMPTY_DIFF: obtain authenticated official diff and schema revision');
 const sql=text.replace(/--[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
 if(/\b(?:UPDATE|DELETE|INSERT|MERGE|TRUNCATE|DROP)\b/i.test(sql))findings.push('DATA_OR_DESTRUCTIVE_CHANGE: manual review required');
 if(/\bSET\s+NOT\s+NULL\b|\bDEFAULT\b/i.test(sql))findings.push('BACKFILL_OR_REQUIRED_VALUE: manual review required');
 for(const table of ['categories','subcategories']){
  const add=new RegExp(`ALTER\\s+TABLE\\s+(?:"?public"?\\.)?"?${table}"?\\s+ADD\\s+(?:COLUMN\\s+)?"?name_key"?\\s+(?:character\\s+varying|varchar)\\s*\\(300\\)`,'i');
  if(!add.test(sql))findings.push(`VERIFY_COLUMN_${table}: nullable varchar(300) addition not recognized`);
 }
 return {status:findings.length?'REVIEW_REQUIRED':'ADDITIVE_COLUMNS_RECOGNIZED_REVIEW_STILL_REQUIRED',findings,
 requiredChecks:['exact DEV project/service, source SHA and existing schema revision','unique indexes/constraints and nullable name_key columns','no automatic backfill, destructive or unrelated changes','read-only preflight and CTO disposition of real collisions','separate migration authorization; this tool executes nothing']};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.length!==3)throw new Error('Usage: node scripts/review-schema-diff.mjs <saved-official-diff>');
 console.log(JSON.stringify(screenSchemaDiff(readFileSync(process.argv[2],'utf8')),null,2));
}
