import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../public/live-refresh.js', import.meta.url), 'utf8');
const { createPoller, patchNode, startLivePage } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function clock() {
  const timers = new Map(); let id = 0;
  return { timers, setTimer(fn, delay) {timers.set(++id,{fn,delay});return id;}, clearTimer(id) {timers.delete(id);}, async tick() {const [id,timer]=timers.entries().next().value;timers.delete(id);await timer.fn();} };
}
const defaults = {interval:180000,retry:[360000,720000,900000],timeout:20000};

test('timer waits for configured interval, pauses hidden pages and checks once on return',async()=>{
  const time=clock();let visible=true;let calls=0;
  const poller=createPoller({...defaults,...time,isVisible:()=>visible,refresh:async()=>{calls++;}});
  poller.start();assert.equal(calls,0);assert.equal([...time.timers.values()][0].delay,180000);
  visible=false;poller.pause();assert.equal(time.timers.size,0);
  visible=true;await poller.wake();assert.equal(calls,1);assert.equal([...time.timers.values()][0].delay,180000);
  poller.stop();assert.equal(time.timers.size,0);
});

test('overlapping wakes cannot start concurrent requests and hiding aborts in-flight work',async()=>{
  const time=clock();let calls=0;let finish;let signal;
  const poller=createPoller({...defaults,...time,isVisible:()=>true,refresh:async s=>{calls++;signal=s;await new Promise(resolve=>finish=resolve);}});
  const running=poller.wake();await poller.wake();assert.equal(calls,1);
  poller.pause();assert.equal(signal.aborted,true);finish();await running;
  assert.equal(time.timers.size,0);poller.stop();
});

test('network failures back off at 360/720/900 seconds then recover to configured cadence',async()=>{
  const time=clock();let failing=true;
  const poller=createPoller({...defaults,...time,isVisible:()=>true,refresh:async()=>{if(failing)throw new Error('offline');}});
  for(const delay of [360000,720000,900000,900000]) {await poller.wake();assert.equal([...time.timers.values()][0].delay,delay);}
  failing=false;await poller.wake();assert.equal([...time.timers.values()][0].delay,180000);poller.stop();
});

test('timeout aborts a request and terminal stop schedules no further work',async()=>{
  const time=clock();let signal;
  const poller=createPoller({...defaults,...time,isVisible:()=>true,refresh:async s=>{signal=s;await new Promise((resolve,reject)=>s.addEventListener('abort',()=>reject(s.reason)));}});
  const running=poller.wake();assert.equal([...time.timers.values()][0].delay,20000);
  await time.tick();await running;assert.equal(signal.aborted,true);assert.equal([...time.timers.values()][0].delay,360000);
  poller.stop();await poller.wake();assert.equal(time.timers.size,0);
});

// Minimal DOM fixture exercises node identity and mutations, without emulating HTML parsing.
class Node {
  constructor(tag, attrs={}, children=[]) {this.nodeType=tag===null?3:1;this.tagName=tag;this.nodeValue=tag===null?attrs:null;this.attrs=tag===null?{}:{...attrs};this.childNodes=[];this.mutations=0;for(const child of children)this.insertBefore(child,null);this.mutations=0;}
  get id(){return this.attrs.id ?? '';}
  get attributes(){return Object.entries(this.attrs).map(([name,value])=>({name,value}));}
  get firstChild(){return this.childNodes[0] ?? null;}
  get nextSibling(){const nodes=this.parentNode?.childNodes ?? [];return nodes[nodes.indexOf(this)+1] ?? null;}
  getAttribute(name){return this.attrs[name] ?? null;}
  hasAttribute(name){return name in this.attrs;}
  setAttribute(name,value){this.attrs[name]=value;this.mutations++;}
  removeAttribute(name){delete this.attrs[name];this.mutations++;}
  insertBefore(child,before){if(child===before)return;child.remove();const index=before?this.childNodes.indexOf(before):this.childNodes.length;this.childNodes.splice(index,0,child);child.parentNode=this;this.mutations++;}
  remove(){if(this.parentNode){this.removals=(this.removals??0)+1;const parent=this.parentNode;parent.childNodes.splice(parent.childNodes.indexOf(this),1);parent.mutations++;this.parentNode=null;}}
  cloneNode(){return new Node(this.tagName,this.nodeType===3?this.nodeValue:this.attrs,this.childNodes.map(n=>n.cloneNode(true)));}
  isEqualNode(other){return this.nodeType===other.nodeType && this.tagName===other.tagName && this.nodeValue===other.nodeValue && JSON.stringify(this.attrs)===JSON.stringify(other.attrs) && this.childNodes.length===other.childNodes.length && this.childNodes.every((n,i)=>n.isEqualNode(other.childNodes[i]));}
}
const text=value=>new Node(null,value);
const element=(tag,attrs={},children=[])=>new Node(tag,attrs,children);

test('unchanged fragments make no mutations and changed rows retain node identity when reordered',()=>{
  const row1=element('TR',{id:'live-topic-1'},[text('old')]);const row2=element('TR',{id:'live-topic-2'},[text('stable')]);
  const root=element('TBODY',{},[row1,row2]);patchNode(root,root.cloneNode(true));assert.equal(root.mutations,0);
  patchNode(root,element('TBODY',{},[row2.cloneNode(true),element('TR',{id:'live-topic-1'},[text('new')])]));
  assert.equal(root.childNodes[0],row2);assert.equal(root.childNodes[1],row1);assert.equal(row1.firstChild.nodeValue,'new');
});

test('reply drafts and their exact nodes survive post updates and a composer disappearing from the server view',()=>{
  const draft=element('TEXTAREA',{},[text('initial')]);draft.value='unsent draft';
  const composer=element('DIV',{id:'reply-10','data-live-preserve':'reply-10'},[draft]);
  const children=element('DIV',{class:'fb-children'},[element('DIV',{id:'post-11'},[text('existing reply')])]);
  const root=element('DIV',{},[element('DIV',{class:'fb-body'},[text('old body')]),composer,children]);
  patchNode(root,element('DIV',{},[element('DIV',{class:'fb-body'},[text('edited body')]),element('DIV',{class:'fb-children'},[element('DIV',{id:'post-11'},[text('existing reply')]),element('DIV',{id:'post-12'},[text('new reply')])])]));
  assert.equal(root.childNodes[1],composer);assert.equal(composer.firstChild,draft);assert.equal(draft.value,'unsent draft');
  assert.equal(root.childNodes[2],children);assert.equal(children.childNodes.length,2);
});


test('adding an edit history block before an active composer never moves the composer node',()=>{
  const composer=element('DIV',{id:'reply-10','data-live-preserve':'reply-10'},[element('TEXTAREA')]);
  const root=element('DIV',{},[element('DIV',{class:'fb-body'},[text('body')]),composer,element('DIV',{class:'fb-children'})]);
  patchNode(root,element('DIV',{},[element('DIV',{class:'fb-body'},[text('edited')]),element('DIV',{class:'fb-edit-history'},[text('Edited now')]),composer.cloneNode(true),element('DIV',{class:'fb-children'})]));
  assert.equal(root.childNodes[2],composer);
  assert.equal(composer.removals??0,0,'moving a focused composer would drop native browser focus');
});


function pageFixture(t, responses, {displayed=true,failRead=false,composers=[],links=[]}={}) {
  const previous=globalThis.DOMParser;
  globalThis.DOMParser=class {};
  t.after(()=>{if(previous===undefined)delete globalThis.DOMParser;else globalThis.DOMParser=previous;});
  const requests=[];
  const status={hidden:true,textContent:''};
  const content={querySelectorAll:selector=>selector==='[data-live-preserve]'?composers:selector.includes('a[href$="/new"]')?links:[],contains:()=>displayed};
  const doc={hidden:false,body:{dataset:{liveKind:'thread',liveKey:'1',liveViewer:'1',liveLastPost:'10',liveCsrf:'csrf',liveInterval:'180000',liveRetry:'360000,720000,900000',liveTimeout:'20000'}},
    getElementById:id=>id==='live-content'?content:id==='live-status'?status:id==='post-11'&&displayed?{}:null,addEventListener:()=>{},createElement:()=>({dataset:{}})};
  const win={location:{href:'https://bbs.example/thread/1'},scrollX:0,scrollY:0,innerHeight:800,addEventListener:()=>{}};
  let reads=0;
  const poller=startLivePage(doc,win,async(url,options)=>{
    requests.push({url,options});
    if(url.endsWith('/read')) {reads++;if(failRead&&reads===1)throw new Error('temporary network failure');return {status:204,ok:true};}
    const next=responses.shift();
    return {status:next.status??200,ok:(next.status??200)===200,headers:{get:()=> 'etag'},json:async()=>({title:'Topic',viewerId:1,regions:[],locked:false,lastPostId:10,...next})};
  });
  t.after(()=>poller.stop());
  return {poller,requests,status,doc};
}

test('unchanged 200 and 304 responses do not write title, status or page attributes',async t=>{
  const {poller,status,doc}=pageFixture(t,[{}, {status:304}]);
  let writes=0;
  Object.defineProperty(status,'hidden',{get:()=>true,set:()=>{writes++;}});
  Object.defineProperty(doc,'title',{get:()=> 'Topic — Bitcoin Purity BBS',set:()=>{writes++;}});
  Object.defineProperty(doc.body.dataset,'liveLocked',{get:()=> '0',set:()=>{writes++;}});
  await poller.wake();await poller.wake();
  assert.equal(writes,0);
});

test('unchanged snapshots never acknowledge reads and displayed progress is acknowledged once',async t=>{
  const {poller,requests}=pageFixture(t,[{}, {lastPostId:11}, {status:304}]);
  await poller.wake();assert.equal(requests.filter(r=>r.url.endsWith('/read')).length,0);
  await poller.wake();assert.equal(requests.filter(r=>r.url.endsWith('/read')).length,1);
  const read=requests.find(r=>r.url.endsWith('/read'));
  assert.deepEqual(JSON.parse(read.options.body),{lastPostId:11,csrf_token:'csrf'});
  await poller.wake();assert.equal(requests.filter(r=>r.url.endsWith('/read')).length,1);
});

test('failed display and changed identities never acknowledge unseen content',async t=>{
  const first=pageFixture(t,[{lastPostId:11}],{displayed:false});await first.poller.wake();
  assert.equal(first.requests.filter(r=>r.url.endsWith('/read')).length,0);
  const second=pageFixture(t,[{lastPostId:11,viewerId:2}]);await second.poller.wake();
  assert.equal(second.requests.filter(r=>r.url.endsWith('/read')).length,0);
  assert.match(second.status.textContent,/login status has changed/);
});

test('a failed acknowledgement retries displayed progress even when the next snapshot is unchanged',async t=>{
  const {poller,requests}=pageFixture(t,[{lastPostId:11},{status:304}],{failRead:true});
  await poller.wake();await poller.wake();assert.equal(requests.filter(r=>r.url.endsWith('/read')).length,2);
});

test('locks, deleted reply targets and expired sessions disable submission while retaining drafts',async t=>{
  let deleted=false;let notice=null;
  const button={disabled:false};
  const link={href:'/board/example/new',removeAttribute(name){delete this[name];},setAttribute(name,value){this[name]=value;}};
  const draft={value:'Unsent reply'};
  const composer={closest:()=>({dataset:{postDeleted:deleted?'1':'0'}}),querySelectorAll:()=>[button],querySelector:()=>notice,appendChild:node=>{notice=node;},draft};
  const {poller,status,requests}=pageFixture(t,[{locked:true},{locked:false},{},{viewerId:null}],{composers:[composer],links:[link]});
  await poller.wake();assert.equal(button.disabled,true);assert.match(notice.textContent,/draft has been kept/);
  await poller.wake();assert.equal(button.disabled,false);assert.equal(notice.hidden,true);
  deleted=true;await poller.wake();assert.equal(button.disabled,true);assert.equal(draft.value,'Unsent reply');
  deleted=false;await poller.wake();assert.equal(button.disabled,true);assert.match(status.textContent,/login status has changed/);
  assert.equal(link.href,undefined);assert.equal(link['aria-disabled'],'true');
  const count=requests.length;await poller.wake();assert.equal(requests.length,count);
});
