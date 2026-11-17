
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const store={events:'ocb_events',places:'ocb_places',diary:'ocb_diary',reels:'ocb_reels',spotify:'ocb_spotify',photos:'ocb_photos'};
const get=k=>{try{return JSON.parse(localStorage.getItem(store[k])||'[]')}catch(e){return[]}},put=(k,v)=>localStorage.setItem(store[k],JSON.stringify(v));
function go(page){$$('.page').forEach(x=>x.classList.toggle('active',x.id===page));$$('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===page));if(page==='calendar')renderCalendar();window.scrollTo({top:0,behavior:'smooth'})}
$$('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
let currentType='',editingDiaryId=null,diaryIndex=0,selectedDate=new Date().toISOString().slice(0,10),viewMonth=new Date();
const configs={
event:{title:'Add a calendar event',fields:[['title','Event name','text'],['date','Date','date'],['time','Time (optional)','time'],['description','Details','textarea']]},
place:{title:'Add a place to visit',fields:[['title','Place name','text'],['location','Area / address / link','text'],['description','Why do we want to go?','textarea']]},
diary:{title:'Write a diary entry',fields:[['title','Entry title','text'],['date','Date','date'],['description','Write your entry...','textarea'],['image','Add a picture (optional)','file'] ]},
reel:{title:'Save a reel to recreate',fields:[['title','Reel / idea name','text'],['url','Instagram / TikTok link','url'],['description','Notes / who does what','textarea']]}
};
function openForm(type,id=null){
 currentType=type;editingDiaryId=id;
 const c=configs[type],existing=id?get(type).find(x=>x.id===id):null;
 $('#modalTitle').textContent=existing?'Edit diary entry':c.title;
 if(type==='diary'){
  $('#fields').innerHTML=
   '<div class="formrow"><label>Entry title</label><input name="title" type="text" value="'+esc(existing?.title||'')+'" required></div>'+
   '<div class="formrow"><label>Date</label><input name="date" type="date" value="'+esc(existing?.date||'')+'"></div>'+
   '<div class="formrow"><label>Your diary entry</label><textarea name="description" placeholder="Write your memory...">'+esc(existing?.description||'')+'</textarea></div>'+
   '<div class="diary-editor"><div class="formrow"><label>Upload a picture</label><input id="diaryImageInput" name="image" type="file" accept="image/*"><p class="diary-editor-help">Drag your picture to position it, adjust its size and add stickers.</p></div>'+
   '<div class="diary-editor-stage" id="diaryEditorStage">'+
    (existing?.image?'<img data-art-kind="photo" alt="Photo being arranged" src="'+existing.image+'">':'<div class="diary-editor-placeholder">Your picture will appear here</div>')+
    '</div>'+
   '<div class="diary-editor-tools"><label for="diaryPhotoSize" style="margin:0">Photo size</label><input id="diaryPhotoSize" type="range" min="20" max="100" step="1" value="'+(existing?.art?.w||80)+'"><span id="diaryPhotoSizeValue">'+(existing?.art?.w||80)+'%</span></div>'+
   '<div class="diary-editor-tools" style="margin-top:12px"><span class="diary-editor-help" style="margin:0">Add a sticker</span>'+
    ['♡','☆','✦','✿','☁','♥','☀','✧'].map(ch=>'<button type="button" class="sticker-choice" data-sticker="'+ch+'">'+ch+'</button>').join('')+
    '<button type="button" class="ghost" id="removeSticker">Remove selected</button></div></div>';
  setupDiaryEditor(existing);
 }else{
  $('#fields').innerHTML=c.fields.map(([n,l,t])=>{
   const value=existing&&existing[n]&&t!=='file'?existing[n]:'';
   return '<div class="formrow"><label>'+l+'</label>'+
    (t==='textarea'?'<textarea name="'+n+'">'+esc(value)+'</textarea>':'<input name="'+n+'" type="'+t+'" value="'+esc(value||(n==='date'&&type==='event'?selectedDate:''))+'" '+(n==='title'?'required':'')+'>')+
    '</div>';
  }).join('');
 }
 $('#modal').classList.add('open');
}
$$('[data-add]').forEach(b=>b.onclick=()=>openForm(b.dataset.add));$('#addCalendarEvent').onclick=()=>openForm('event');$('#cancel').onclick=()=>$('#modal').classList.remove('open');$('#modal').onclick=e=>{if(e.target===$('#modal'))$('#modal').classList.remove('open')};
$('#entryForm').onsubmit=async e=>{
 e.preventDefault();
 const form=e.target,fd=new FormData(form),obj={};
 for(const [k,v] of fd.entries()){
  if(k==='image'){if(v&&v.size)obj.image=await fileData(v)}
  else obj[k]=v;
 }
 const a=get(currentType);
 if(currentType==='diary'){
  obj.art=readDiaryEditor();
  if(editingDiaryId){
   const index=a.findIndex(x=>x.id===editingDiaryId);
   if(index>=0)a[index]={...a[index],...obj,image:obj.image||a[index].image};
  }else a.unshift({...obj,id:Date.now()});
 }else if(editingDiaryId){
  const index=a.findIndex(x=>x.id===editingDiaryId);
  if(index>=0)a[index]={...a[index],...obj};
 }else a.unshift({...obj,id:Date.now()});
 put(currentType,a);
 editingDiaryId=null;
 $('#modal').classList.remove('open');
 form.reset();
 renderAll();
};
function fileData(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function list(k,target,empty,kind){const a=get(k);$(target).innerHTML=a.length?a.map(x=>'<div class="item"><div class="item-main"><strong>'+esc(x.title)+'</strong><small>'+esc(kind==='places'?(x.location||''):kind==='reels'?(x.url?'Saved link':''):((x.date||'')+(x.time?' · '+x.time:'')))+'</small>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+(x.url?'<p><a href="'+esc(x.url)+'" target="_blank" rel="noopener">Open saved reel ↗</a></p>':'')+'</div><div class="item-actions"><button data-delete="'+k+'" data-id="'+x.id+'">Remove</button></div></div>').join(''):'<div class="empty">'+empty+'</div>'}
function renderDiary(){const a=get('diary');if(diaryIndex>=a.length)diaryIndex=Math.max(0,a.length-1);const spread=$('#diarySpread');if(!a.length){$('#diaryCounter').textContent='OUR JOURNAL';$('#diaryPageCount').textContent='NO PAGES YET';spread.innerHTML='<div class="diary-empty" style="grid-column:1/-1">Our journal is still blank.<br>Start with a little memory, a date and a picture.</div>';$('#diaryPrev').disabled=true;$('#diaryNext').disabled=true;$('#diaryActions').innerHTML='';return}const x=a[diaryIndex],page=diaryIndex*2+1;$('#diaryCounter').textContent='ENTRY '+String(diaryIndex+1).padStart(2,'0')+' · '+a.length+' MEMORIES';$('#diaryPageCount').textContent='PAGES '+page+'–'+(page+1)+' OF '+(a.length*2);$('#diaryPrev').disabled=diaryIndex===0;$('#diaryNext').disabled=diaryIndex===a.length-1;spread.innerHTML='<div class="diary-page left"><div class="diary-date">'+esc(x.date||'A NOTE TO REMEMBER')+'</div><h3>'+esc(x.title)+'</h3><div class="diary-writing">'+esc(x.description||'This page is yours. Add a few words about this memory.')+'</div><span class="diary-page-number">'+page+'</span></div><div class="diary-page right">'+(x.image?'<div class="diary-photo-frame">'+diaryArtMarkup(x)+'</div>':'<div class="diary-photo-empty">A space for a photograph<br><small>Add one when editing this entry</small></div>')+'<span class="diary-page-number">'+(page+1)+'</span></div>';$('#diaryActions').innerHTML='<button class="ghost" id="editDiary">Edit this entry</button><button class="ghost" id="deleteDiary">Remove entry</button>';$('#editDiary').onclick=()=>openForm('diary',x.id);$('#deleteDiary').onclick=()=>{if(confirm('Remove this diary entry?')){put('diary',get('diary').filter(e=>e.id!==x.id));diaryIndex=Math.max(0,diaryIndex-1);renderAll()}}}
function renderCalendar(){const y=viewMonth.getFullYear(),m=viewMonth.getMonth(),first=new Date(y,m,1),start=new Date(y,m,1-first.getDay()),today=new Date(),fmt=new Intl.DateTimeFormat('en',{month:'long',year:'numeric'});$('#monthLabel').textContent=fmt.format(first);$('#calendarGrid').innerHTML=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>'<div class="weekday">'+d+'</div>').join('');const events=get('events');for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const key=localDate(d),same=events.filter(e=>e.date===key);const b=document.createElement('button');b.className='day'+(d.getMonth()!==m?' outside':'')+(key===localDate(today)?' today':'')+(key===selectedDate?' selected':'');b.innerHTML='<span class="day-number">'+d.getDate()+'</span>'+same.slice(0,2).map(e=>'<span class="event-dot">'+esc(e.title)+'</span>').join('')+(same.length>2?'<span class="event-dot">+'+(same.length-2)+' more</span>':'');b.onclick=()=>{selectedDate=key;renderCalendar()};$('#calendarGrid').appendChild(b)}const sd=new Date(selectedDate+'T12:00:00');$('#selectedLabel').textContent=sd.toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric',year:'numeric'});const todays=events.filter(e=>e.date===selectedDate);$('#dayEvents').innerHTML=todays.length?todays.map(e=>'<div class="item"><div class="item-main"><strong>'+esc(e.title)+'</strong><small>'+esc(e.time||'')+'</small>'+(e.description?'<p>'+esc(e.description)+'</p>':'')+'</div><div class="item-actions"><button data-delete="events" data-id="'+e.id+'">Remove</button></div></div>').join(''):'<div class="empty" style="padding:22px">Nothing planned for this day yet.</div>'}
function localDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
$('#prevMonth').onclick=()=>{viewMonth.setMonth(viewMonth.getMonth()-1);renderCalendar()};$('#nextMonth').onclick=()=>{viewMonth.setMonth(viewMonth.getMonth()+1);renderCalendar()};$('#todayMonth').onclick=()=>{viewMonth=new Date();selectedDate=localDate(new Date());renderCalendar()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(b){const k=b.dataset.delete;put(k,get(k).filter(x=>x.id!=b.dataset.id));renderAll()}});
function renderSpotify(){const a=get('spotify'),first=a[0];let embed='';if(first){try{const u=new URL(first.url);if(u.hostname.endsWith('spotify.com')){const p=u.pathname.split('/').filter(Boolean);if(p.length>=2&&p[0]!=='embed')embed='https://open.spotify.com/embed/'+p.slice(0,2).join('/')+'?utm_source=generator&theme=0'}}catch(e){}}$('#spotifyPlayer').innerHTML=embed?'<iframe title="Spotify player" src="'+esc(embed)+'" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>':'';$('#spotifyList').innerHTML=a.length?a.map(x=>'<div class="item"><div class="item-main"><strong>'+esc(x.name||'Our shared soundtrack')+'</strong><p><a href="'+esc(x.url)+'" target="_blank" rel="noopener">Open in Spotify ↗</a></p></div><div class="item-actions"><button data-spdel="'+x.id+'">Remove</button></div></div>').join(''):'<div class="empty">Our shared soundtrack starts here.</div>'}
$('#saveSpotify').onclick=()=>{const url=$('#spotifyUrl').value.trim();if(!/^https?:\/\/(open\.)?spotify\.com\//i.test(url)){alert('Please paste a valid Spotify link.');return}const a=get('spotify');a.unshift({id:Date.now(),url,name:$('#spotifyName').value.trim()});put('spotify',a);$('#spotifyUrl').value='';$('#spotifyName').value='';renderSpotify()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-spdel]');if(b){put('spotify',get('spotify').filter(x=>x.id!=b.dataset.spdel));renderSpotify()}});
$('#photoBtn').onclick=()=>$('#photoInput').click();$('#photoInput').onchange=async e=>{const a=get('photos');for(const f of e.target.files){if(f.type.startsWith('image/'))a.unshift({id:Date.now()+Math.random(),name:f.name,data:await fileData(f)})}put('photos',a);e.target.value='';renderPhotos()};
function renderPhotos(){const a=get('photos');$('#photos').innerHTML=a.length?a.map(x=>'<div class="photo"><img src="'+x.data+'" alt="'+esc(x.name)+'"><button data-phdel="'+x.id+'" aria-label="Remove photo">×</button></div>').join(''):'<div class="empty" style="grid-column:1/-1">No snapshots yet. Add the first one to our wall.</div>'}
document.addEventListener('click',e=>{const b=e.target.closest('[data-phdel]');if(b){put('photos',get('photos').filter(x=>x.id!=b.dataset.phdel));renderPhotos()}});
function renderAll(){renderDiary();list('places','#placesList','Our list of places is waiting.','places');list('reels','#reelsList','Save a reel or trend you want to try together.','reels');renderDiary();renderPhotos();renderSpotify();renderCalendar()}

// Diary photo editor: drag photos and stickers, resize photos, and save the layout with the entry.
let editorArt={x:10,y:10,w:80,stickers:[]},selectedSticker=-1;
function setupDiaryEditor(existing){
 editorArt={x:existing?.art?.x??10,y:existing?.art?.y??10,w:existing?.art?.w??80,stickers:(existing?.art?.stickers||[]).map(s=>({...s}))};
 selectedSticker=-1;
 const stage=$('#diaryEditorStage'),input=$('#diaryImageInput');
 input.onchange=async()=>{
  const file=input.files?.[0];if(!file)return;
  const src=await fileData(file);
  let img=stage.querySelector('img[data-art-kind="photo"]');
  if(!img){img=document.createElement('img');img.dataset.artKind='photo';img.alt='Photo being arranged';stage.querySelector('.diary-editor-placeholder')?.remove();stage.prepend(img)}
  img.src=src;editorArt.x=10;editorArt.y=10;editorArt.w=80;
  $('#diaryPhotoSize').value=80;$('#diaryPhotoSizeValue').textContent='80%';
  drawDiaryEditorImage();
 };
 $('#diaryPhotoSize').oninput=e=>{editorArt.w=Number(e.target.value);$('#diaryPhotoSizeValue').textContent=editorArt.w+'%';drawDiaryEditorImage()};
 $$('[data-sticker]').forEach(btn=>btn.onclick=()=>{
  editorArt.stickers.push({char:btn.dataset.sticker,x:50,y:50,size:34});
  selectedSticker=editorArt.stickers.length-1;drawDiaryEditorStickers();
 });
 $('#removeSticker').onclick=()=>{
  if(selectedSticker>=0){editorArt.stickers.splice(selectedSticker,1);selectedSticker=-1;drawDiaryEditorStickers()}
 };
 stage.onpointerdown=e=>{
  const target=e.target.closest('img[data-art-kind="photo"],.diary-editor-sticker');
  if(!target)return;
  const isPhoto=target.dataset.artKind==='photo',index=Number(target.dataset.index);
  if(!isPhoto)selectedSticker=index;
  const rect=stage.getBoundingClientRect(),startX=e.clientX,startY=e.clientY;
  const base=isPhoto?{x:editorArt.x,y:editorArt.y}:{x:editorArt.stickers[index].x,y:editorArt.stickers[index].y};
  target.setPointerCapture(e.pointerId);
  const move=ev=>{
   const dx=(ev.clientX-startX)/rect.width*100,dy=(ev.clientY-startY)/rect.height*100;
   if(isPhoto){
    editorArt.x=Math.max(-editorArt.w+5,Math.min(95,base.x+dx));
    editorArt.y=Math.max(-80,Math.min(95,base.y+dy));
    target.style.left=editorArt.x+'%';target.style.top=editorArt.y+'%';
   }else{
    editorArt.stickers[index].x=Math.max(0,Math.min(100,base.x+dx));
    editorArt.stickers[index].y=Math.max(0,Math.min(100,base.y+dy));
    target.style.left=editorArt.stickers[index].x+'%';target.style.top=editorArt.stickers[index].y+'%';
   }
  };
  const stop=()=>{target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',stop);target.removeEventListener('pointercancel',stop)};
  target.addEventListener('pointermove',move);
  target.addEventListener('pointerup',stop,{once:true});
  target.addEventListener('pointercancel',stop,{once:true});
 };
 drawDiaryEditorImage();drawDiaryEditorStickers();
}
function drawDiaryEditorImage(){
 const img=$('#diaryEditorStage img[data-art-kind="photo"]');if(!img)return;
 img.style.left=editorArt.x+'%';img.style.top=editorArt.y+'%';img.style.width=editorArt.w+'%';img.style.height='auto';
}
function drawDiaryEditorStickers(){
 const stage=$('#diaryEditorStage');if(!stage)return;
 stage.querySelectorAll('.diary-editor-sticker').forEach(el=>el.remove());
 editorArt.stickers.forEach((sticker,index)=>{
  const el=document.createElement('span');el.className='diary-editor-sticker'+(selectedSticker===index?' selected':'');
  el.dataset.index=index;el.textContent=sticker.char;
  el.style.left=sticker.x+'%';el.style.top=sticker.y+'%';el.style.fontSize=sticker.size+'px';
  stage.append(el);
 });
}
function readDiaryEditor(){return{...editorArt,stickers:editorArt.stickers.map(s=>({...s}))}}
function diaryArtMarkup(entry){
 if(!entry.image)return '';
 const art=entry.art||{x:10,y:10,w:80,stickers:[]};
 return '<div class="diary-photo-art"><img src="'+entry.image+'" alt="Photo for '+esc(entry.title)+'" style="left:'+Number(art.x??10)+'%;top:'+Number(art.y??10)+'%;width:'+Number(art.w||80)+'%">'+
  (art.stickers||[]).map(s=>'<span class="art-sticker" style="left:'+Number(s.x)+'%;top:'+Number(s.y)+'%;font-size:'+Number(s.size||34)+'px;color:#6b9ab5">'+esc(s.char)+'</span>').join('')+
  '</div>';
}
function diaryPageMarkup(entry,side,pageNo){
 if(side==='left')return '<div class="diary-date">'+esc(entry.date||'A NOTE TO REMEMBER')+'</div><h3>'+esc(entry.title)+'</h3><div class="diary-writing">'+esc(entry.description||'This page is yours. Add a few words about this memory.')+'</div><span class="diary-page-number">'+pageNo+'</span>';
 return (entry.image?'<div class="diary-photo-frame">'+diaryArtMarkup(entry)+'</div>':'<div class="diary-photo-empty">A space for a photograph<br><small>Add one when editing this entry</small></div>')+'<span class="diary-page-number">'+pageNo+'</span>';
}
function flipDiary(direction){
 const entries=get('diary');
 // The left control always moves to the previous entry; the right control always moves to the next.
 const step=direction==='backward'?-1:1;
 const nextIndex=diaryIndex+step;
 if(nextIndex<0||nextIndex>=entries.length)return;
 const spread=$('#diarySpread');
 if(spread.querySelector('.diary-turn-sheet'))return;

 // Forward: turn the right page toward the left. Backward: turn the left page toward the right.
 const turningSide=step===1?'right':'left';
 const revealSide=step===1?'left':'right';
 const frontPage=spread.querySelector('.diary-page.'+turningSide);
 if(!frontPage)return;

 const sheet=document.createElement('div');
 sheet.className='diary-turn-sheet '+(step===1?'turn-forward':'turn-backward');
 const front=frontPage.innerHTML;
 const revealedPageNumber=step===1?nextIndex*2+1:nextIndex*2+2;
 const back=diaryPageMarkup(entries[nextIndex],revealSide,revealedPageNumber);
 sheet.innerHTML='<div class="turn-face turn-front">'+front+'</div><div class="turn-face turn-back">'+back+'</div>';
 spread.appendChild(sheet);
 sheet.addEventListener('animationend',event=>{
  if(event.target!==sheet)return;
  diaryIndex=nextIndex;
  renderDiary();
 },{once:true});
}
$('#diaryPrev').onclick=()=>flipDiary('backward');$('#diaryNext').onclick=()=>flipDiary('forward');
renderAll();
