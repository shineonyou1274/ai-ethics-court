// Stage the entire fetched shared tree so future test dependencies are included.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,dirname} from 'node:path';import assert from 'node:assert/strict';
const root=new URL('../../',import.meta.url);
const git=args=>execFileSync('git',args,{cwd:root});
const hasShared=ref=>{try{return git(['ls-tree','--name-only',ref,'--','shared/test.mjs']).toString().trim()!==''}catch{return false}};
const ref=hasShared('origin/main')?'origin/main':hasShared('origin/claude/focused-davinci-c033wr')?'origin/claude/focused-davinci-c033wr':'HEAD';
assert.ok(hasShared(ref),'No shared contract found in origin/main, Claude or HEAD');
console.log('Contract source: '+ref);
const paths=git(['ls-tree','-r','--name-only','-z',ref,'--','shared/']).toString().split('\0').filter(Boolean);
assert.ok(paths.includes('shared/test.mjs'));
const dir=mkdtempSync(join(tmpdir(),'barista-contract-'));
try{
 for(const path of paths){mkdirSync(dirname(join(dir,path)),{recursive:true});writeFileSync(join(dir,path),git(['show',`${ref}:${path}`]));}
 for(const name of ['workday.js','collect.js','design.css']){
  const copy=readFileSync(new URL('../dist/shared/'+name,import.meta.url));
  assert.deepEqual(copy,readFileSync(join(dir,'shared',name)),`${name} must equal fetched Claude contract`);
  const target=join(dir,'barista-day/dist/shared',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,copy);
 }
 execFileSync(process.execPath,['shared/test.mjs'],{cwd:dir,stdio:'inherit'});
}finally{rmSync(dir,{recursive:true,force:true})}
console.log('PASS: entire fetched shared tree, all three actual copies identical; repository shared/ untouched.');
