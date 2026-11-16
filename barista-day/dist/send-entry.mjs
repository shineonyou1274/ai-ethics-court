import {inWorkdaySite} from './career.mjs';
import {loadRecords} from './shared/workday.js?v=20261115';
import {openSendDialog} from './send-records.mjs';
const entry=document.getElementById('sendFromStart');
if(entry){const refresh=()=>entry.hidden=loadRecords().length===0;refresh();addEventListener('storage',refresh);addEventListener('pageshow',refresh);entry.onclick=openSendDialog}

for(const link of document.querySelectorAll('.home-link'))link.hidden=!inWorkdaySite();
