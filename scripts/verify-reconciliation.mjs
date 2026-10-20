import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const recoveredAncestor = '80f21c65a0ed3e07b0f9c29bebd07d2479b0735b';
const exclusions = ['AJU-PDV-06','AJU-PDV-07','AJU-EST-17','AJU-EST-21','AJU-EST-24','AJU-EST-25','AJU-CAT-15','AJU-SUB-12','AJU-SUB-15','AJU-SUB-16'];
const approvedAdditional = new Set(['PREP-DEC017','OBS-018-AG03-001','ADD-018-001','ADD-018-002','ADD-018-003','ADD-018-004',...Array.from({length:8},(_,i)=>`SEC-2026-${String(i+1).padStart(3,'0')}`),...Array.from({length:3},(_,i)=>`DES-2026-${String(i+1).padStart(3,'0')}`)]);
const protectedPaths = ['frontend/src/utils/salesOffline.ts','frontend/src/hooks/useDialogAccessibility.ts','frontend/src/components/PosApprovalsModal.tsx'];
export function validateScope(policy, changed) {
  if (policy.decision !== 'DEC-019' || policy.ancestor !== recoveredAncestor) throw new Error('Invalid decision/immutable ancestor');
  const expected = { PDV:5, DASH:13, EST:21, PROD:2, CAT:14, SUB:13 };
  const ids = new Set(policy.matrixIds);
  const expectedIds = Object.entries({PDV:7,DASH:13,EST:25,PROD:2,CAT:15,SUB:16}).flatMap(([module,size])=>Array.from({length:size},(_,i)=>`AJU-${module}-${String(i+1).padStart(2,'0')}`)).filter(id=>!exclusions.includes(id));
  if (expectedIds.some(id=>!ids.has(id)) || policy.additionalIds.some(id=>!approvedAdditional.has(id))) throw new Error('Unapproved requirement ID');
  if (ids.size !== 68 || policy.matrixIds.length !== 68 || exclusions.some(id => ids.has(id))) throw new Error('Invalid frozen scope of 68');
  for (const [module, count] of Object.entries(expected)) {
    if ([...ids].filter(id => new RegExp(`^AJU-${module}-\\d{2}$`).test(id)).length !== count) throw new Error('Invalid module IDs');
  }
  const valid = new Set([...ids,...policy.additionalIds]);
  for (const [path, entry] of Object.entries(policy.paths)) {
    if (!/^(frontend|functions|dataconnect|docs|scripts|\.github)\//.test(path) && path !== '.gitignore') throw new Error('Invalid scoped path');
    if (path.endsWith('/') || /[\\*?\[\]{}\x00]/.test(path) || path.split('/').includes('..') || /(^|\/)\.env/.test(path)) throw new Error('Only exact non-secret file paths are permitted');
    if (!entry.reason?.trim() || !entry.ids?.length || entry.ids.some(id => !valid.has(id))) throw new Error(`Unjustified path: ${path}`);
  }
  const outside = changed.filter(path => !Object.hasOwn(policy.paths,path));
  if (outside.length) throw new Error(`Change outside approved scope: ${outside.join(', ')}`);
  return true;
}
export function verifyRepository(root, working = false) {
  const git = (...args) => execFileSync('git', args, {cwd:root,encoding:'utf8'}).trim();
  git('merge-base','--is-ancestor',recoveredAncestor,'HEAD');
  const read = path => working ? readFileSync(resolve(root,path),'utf8') : git('show',`HEAD:${path}`);
  const policy = JSON.parse(read('scripts/reconciliation-scope.json'));
  const changed = git('diff','--name-only','--no-renames',recoveredAncestor,...(working?[]:['HEAD'])).split('\n').filter(Boolean);
  if (working) changed.push(...git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean));
  validateScope(policy,changed);
  if (JSON.stringify(policy.bytePreserved) !== JSON.stringify(protectedPaths)) throw new Error('Protected capabilities policy changed');
  for (const path of protectedPaths) {
    if (Object.hasOwn(policy.paths,path)) throw new Error(`Protected path requires a separately reviewed policy change: ${path}`);
    if (git('show',`${recoveredAncestor}:${path}`) !== read(path).trim()) throw new Error(`Recovered capability changed: ${path}`);
  }
  // Authorized files may change intentionally; existing operation/type names must survive.
  for (const path of ['dataconnect/app/queries.gql','dataconnect/app/mutations.gql','dataconnect/schema/schema.gql']) {
    const pattern = /^(?:query|mutation|type)\s+(\w+)/gm;
    const old = [...git('show',`${recoveredAncestor}:${path}`).matchAll(pattern)].map(m=>m[1]);
    const current = new Set([...read(path).matchAll(pattern)].map(m=>m[1]));
    if (old.some(name=>!current.has(name))) throw new Error(`Existing contract removed: ${path}`);
  }
  console.log(`Recovered ancestor verified; ${new Set(changed).size} exact scoped paths justified by 68 IDs/additional corrections. Intentional changes require regression; deployed compatibility is not inferred.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyRepository(resolve(dirname(fileURLToPath(import.meta.url)),'..'),process.argv.includes('--working-tree'));
}
