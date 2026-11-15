// Validate against Claude's fetched contract without merging or editing shared/.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';
const root=new URL('../../',import.meta.url),ref='origin/claude/focused-davinci-c033wr';
const read=path=>execFileSync('git',['show',`${ref}:${path}`],{cwd:root});
const latest=read('shared/workday.js');assert.deepEqual(readFileSync(new URL('../dist/shared/workday.js',import.meta.url)),latest,'copy must equal fetched Claude contract');
const dir=mkdtempSync(join(tmpdir(),'barista-contract-'));
try{mkdirSync(join(dir,'shared'));mkdirSync(join(dir,'barista-day/dist/shared'),{recursive:true});writeFileSync(join(dir,'shared/workday.js'),latest);writeFileSync(join(dir,'shared/test.mjs'),read('shared/test.mjs'));writeFileSync(join(dir,'barista-day/dist/shared/workday.js'),latest);execFileSync(process.execPath,['shared/test.mjs'],{cwd:dir,stdio:'inherit'});}finally{rmSync(dir,{recursive:true,force:true})}
console.log('PASS: latest fetched shared test and byte-identical copy; repository shared/ untouched.');
