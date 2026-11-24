export class Payment {
 constructor(price,method,tender=0){this.price=price;this.method=method;this.tender=method==='cash'?tender:price;this.received=false;this.change=[];this.paid=false;this.printProgress=0;this.receiptGiven=false}
 get ready(){return this.paid&&this.receiptGiven}
 print(dt){if(this.paid&&!this.receiptGiven)this.printProgress=Math.min(1,this.printProgress+Math.max(0,Math.min(dt,.1))/1.1)}
 handReceipt(){if(!this.paid||this.printProgress<1||this.receiptGiven)return false;this.receiptGiven=true;return true}
 get due(){return this.tender-this.price}
 get selected(){return this.change.reduce((a,b)=>a+b,0)}
 receive(){if(this.method!=='cash'||this.received||this.paid||this.tender<this.price)return false;this.received=true;return true}
 add(value){if(!this.received||this.paid||![100,500,1000,5000].includes(value)||this.change.length>=20)return false;this.change.push(value);return true}
 undo(){if(!this.paid)this.change.pop()}
 give(){if(this.method!=='cash'||!this.received||this.paid||this.selected!==this.due)return false;this.paid=true;return true}
 tap(){if(this.method!=='card'||this.paid)return false;this.paid=true;return true}
}
