(async function(){
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const STORAGE_KEY = 'stackforge-linux-arena-v1';
  const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"completed":{},"hints":{},"arenaEnd":null}');
  let challenges = [];
  let solutions = {};
  let current = null;
  let vm = null;
  let hintIndex = 0;
  let timerHandle = null;

  const term = new Terminal({
    cursorBlink:true,
    convertEol:true,
    fontFamily:'ui-monospace, SFMono-Regular, Consolas, monospace',
    fontSize:14,
    theme:{background:'#03090d',foreground:'#d8e7ef',cursor:'#50e3a4',selectionBackground:'#23485a'}
  });
  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.open($('#terminal'));
  fitAddon.fit();
  window.addEventListener('resize',()=>fitAddon.fit());

  vm = new StackForgeLinuxVM({terminal:term,onStatus:setVmStatus});
  vm.boot();

  try {
    const res = await fetch('data/challenges.json', {cache:'no-store'});
    if(!res.ok) throw new Error('Could not load challenge data.');
    challenges = await res.json();
    const answerRes = await fetch('data/answers.json', {cache:'no-store'});
    if(answerRes.ok) solutions = await answerRes.json();
    renderStats();
    renderList();
    selectChallenge(challenges[0]);
  } catch (e) {
    $('#taskTitle').textContent='Challenge data failed to load';
    $('#taskDescription').textContent=e.message + ' Serve this folder through HTTP/HTTPS instead of opening index.html directly.';
  }

  function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateScore(); }
  function totalScore(){ return Object.values(state.completed||{}).reduce((n,x)=>n+(x.points||0),0); }
  function updateScore(){ $('#scoreValue').textContent=totalScore(); }

  function setVmStatus(status, message=''){
    const el=$('#vmState');
    if(status==='ready'){
      el.classList.add('ready'); el.innerHTML='<i></i> Linux VM: ready';
      $('#checkBtn').disabled=false;
      if(current) setupCurrent(false);
    } else if(status==='error') {
      el.classList.remove('ready'); el.innerHTML='<i></i> Linux VM: failed';
      el.title=message;
      $('#checkBtn').disabled=true;
      feedback(`Linux VM failed to start: ${message} Reload the page to retry.`,'bad');
    } else { el.classList.remove('ready'); el.innerHTML='<i></i> Linux VM: booting'; }
  }

  function levelClass(level){return level.toLowerCase();}
  function renderStats(){
    const levels=['Basic','Intermediate','Advanced','Pro'];
    $('#levelStats').innerHTML=levels.map(l=>{
      const total=challenges.filter(c=>c.level===l).length;
      const done=challenges.filter(c=>c.level===l && state.completed[c.id]).length;
      return `<div class="stat"><b>${done}/${total}</b><small>${l}</small></div>`;
    }).join('');
    updateScore();
  }

  function renderList(){
    const q=$('#searchInput').value.trim().toLowerCase();
    const level=$('#levelFilter').value;
    const filtered=challenges.filter(c=>(level==='All'||c.level===level) && (!q || `${c.id} ${c.title} ${c.category} ${c.description} ${c.commandHint}`.toLowerCase().includes(q)));
    $('#challengeList').innerHTML=filtered.map(c=>`
      <button class="challenge-item ${current&&current.id===c.id?'active':''} ${state.completed[c.id]?'solved':''}" data-id="${c.id}">
        <span class="challenge-num">${c.number.toString().padStart(3,'0')}</span>
        <span class="challenge-name">${escapeHtml(c.title)}<small>${escapeHtml(c.level)} · ${escapeHtml(c.category)}</small></span>
        <span class="challenge-points">${state.completed[c.id]?'✓ ':''}${c.points}p</span>
      </button>`).join('') || '<p style="padding:12px;color:#95a8b7">No tasks match this filter.</p>';
    $$('.challenge-item').forEach(btn=>btn.addEventListener('click',()=>{
      const c=challenges.find(x=>x.id===btn.dataset.id); if(c) selectChallenge(c);
    }));
  }

  async function selectChallenge(c){
    current=c; hintIndex=0;
    $('#taskLevel').textContent=c.level;
    $('#taskCategory').textContent=c.category;
    $('#taskId').textContent=c.id;
    $('#taskPoints').textContent=c.points;
    $('#taskTitle').textContent=c.title;
    $('#taskDescription').textContent=c.description;
    $('#taskObjective').innerHTML=inlineCode(c.objective);
    $('#feedback').className='feedback'; $('#feedback').textContent='';
    $('#hintBox').hidden=true; $('#hintBox').textContent='';
    updateCompletionBadge(); renderList();
    if(vm.ready) await setupCurrent(false);
  }

  async function setupCurrent(showMessage=true){
    if(!current || !vm.ready) return;
    setBusy(true,'Preparing task workspace…');
    try{
      const setup=`cd /root; rm -rf /root/lab; mkdir -p /root/lab; ${current.setup || 'cd /root/lab'}; cd /root/lab`;
      await vm.runCommand(setup);
      term.clear();
      term.writeln(`\x1b[1;36m${current.id}\x1b[0m — ${current.title}`);
      term.writeln('\x1b[2mWorkspace ready: /root/lab\x1b[0m\r\n');
      term.write('\x1b[1;32mroot@stackforge:/root/lab# \x1b[0m');
      if(showMessage) feedback('Task reset. The lab files have been restored.','');
      refreshFiles();
    }catch(e){ feedback(e.message,'bad'); }
    finally{ setBusy(false); vm.focus(); }
  }

  async function checkSolution(){
    if(!current || !vm.ready) return;
    setBusy(true,'Checking Linux state…');
    try{
      const result=await vm.runCommand(current.check);
      if(result.code===0){
        if(!state.completed[current.id]){
          const hintsUsed=state.hints[current.id]||0;
          const earned=Math.max(1,current.points-(hintsUsed*5));
          state.completed[current.id]={points:earned,at:new Date().toISOString()};
          persist(); renderStats(); renderList();
          toast(`Solved ${current.id} +${earned} points`,'good');
        }
        updateCompletionBadge();
        feedback(`✓ Correct. Flag captured: ${current.flag}`,'good');
      } else {
        feedback('Not solved yet. The required Linux state/output does not match the objective.','bad');
      }
    }catch(e){ feedback(e.message,'bad'); }
    finally{ setBusy(false); }
  }

  function showHint(){
    if(!current) return;
    const hints=current.hints||[];
    if(!hints.length) return;
    const i=Math.min(hintIndex,hints.length-1);
    $('#hintBox').hidden=false;
    $('#hintBox').innerHTML=`<strong>Hint ${i+1}/${hints.length}:</strong> ${escapeHtml(hints[i])}`;
    hintIndex=Math.min(hintIndex+1,hints.length);
    state.hints[current.id]=Math.max(state.hints[current.id]||0,hintIndex);
    persist();
  }

  function showHelp(){
    if(!current) return;
    $('#helpTitle').textContent=`${current.id} — ${current.title}`;
    $('#helpObjective').innerHTML=`<strong>Goal:</strong> ${inlineCode(current.objective)}`;
    const hints=current.hints||[];
    $('#helpHints').innerHTML=hints.length
      ? `<strong>Helpful clues</strong><ol>${hints.map(h=>`<li>${escapeHtml(h)}</li>`).join('')}</ol>`
      : '<strong>Helpful clue:</strong> Read the objective carefully and inspect the Files tab.';
    $('#answerReveal').hidden=true;
    $('#revealAnswerBtn').hidden=false;
    $('#answerCommand').textContent=solutions[current.id]||'No exact command is available for this task.';
    $('#helpDialog').showModal();
  }

  function revealAnswer(){
    if(!current) return;
    $('#answerReveal').hidden=false;
    $('#revealAnswerBtn').hidden=true;
    state.hints[current.id]=Math.max(state.hints[current.id]||0,(current.hints||[]).length);
    persist();
  }

  async function copyAnswer(){
    const command=solutions[current&&current.id];
    if(!command) return toast('No answer is available for this task.');
    try{
      await navigator.clipboard.writeText(command);
      toast('Command copied. Paste it after the terminal prompt.','good');
    }catch(e){
      toast('Copy was blocked. Select the command and copy it manually.');
    }
  }

  function updateCompletionBadge(){
    const solved=!!(current&&state.completed[current.id]);
    const el=$('#completionBadge');
    el.textContent=solved?`Solved · ${state.completed[current.id].points} pts`:'Not solved';
    el.classList.toggle('solved',solved);
  }

  function setBusy(busy,msg=''){
    $('#checkBtn').disabled=busy || !vm.ready;
    $('#resetBtn').disabled=busy;
    $('#nextBtn').disabled=busy;
    if(msg) feedback(msg,'');
  }

  function feedback(text,type){ const el=$('#feedback'); el.className='feedback '+(type||''); el.textContent=text; }
  function toast(text,type=''){ const el=$('#toast'); el.textContent=text; el.className='toast show '+type; clearTimeout(el._t); el._t=setTimeout(()=>el.className='toast',2400); }
  function escapeHtml(s=''){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
  function inlineCode(s=''){return escapeHtml(s).replace(/`([^`]+)`/g,'<code>$1</code>');}

  async function refreshFiles(){
    if(!vm.ready || vm.busy) return;
    try{
      const r=await vm.runCommand("find /root/lab -maxdepth 3 -print | sort");
      $('#fileTree').textContent=r.output || '/root/lab';
    }catch(e){ $('#fileTree').textContent=e.message; }
  }

  function sanitizeFilename(name){
    name=name.trim().replace(/\\/g,'/');
    if(!/^[A-Za-z0-9._/-]+$/.test(name) || name.includes('..') || name.startsWith('/')) throw new Error('Use a relative filename such as solution.sh or scripts/check.sh.');
    return name;
  }

  async function saveEditor(){
    if(!vm.ready) return toast('Linux VM is still booting.');
    try{
      const name=sanitizeFilename($('#editorFilename').value);
      const content=$('#scriptEditor').value;
      const bytes=new TextEncoder().encode(content);
      let binary=''; bytes.forEach(b=>binary+=String.fromCharCode(b));
      const b64=btoa(binary);
      const dir=name.includes('/')?name.slice(0,name.lastIndexOf('/')):'';
      const cmd=`cd /root/lab; ${dir?`mkdir -p '${dir}'; `:''}printf %s '${b64}' | base64 -d > '${name}'; ${$('#makeExecutable').checked?`chmod u+x '${name}'`:'true'}`;
      await vm.runCommand(cmd); toast(`Saved ${name}`,'good'); refreshFiles();
    }catch(e){ toast(e.message); }
  }

  async function runEditor(){
    try{
      await saveEditor();
      const name=sanitizeFilename($('#editorFilename').value);
      switchTab('terminal');
      term.writeln('');
      vm.sendLine(`cd /root/lab && ./'${name}'`);
      vm.focus();
    }catch(e){ toast(e.message); }
  }

  function switchTab(tab){
    $$('.ide-tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
    $$('.ide-pane').forEach(x=>x.classList.remove('active'));
    $(`#pane-${tab}`).classList.add('active');
    if(tab==='terminal'){setTimeout(()=>{fitAddon.fit();vm.focus();},0);} if(tab==='files')refreshFiles();
  }

  function nextChallenge(){
    if(!current)return; const i=challenges.findIndex(c=>c.id===current.id); selectChallenge(challenges[(i+1)%challenges.length]);
  }

  function previousChallenge(){
    if(!current)return; const i=challenges.findIndex(c=>c.id===current.id); selectChallenge(challenges[(i-1+challenges.length)%challenges.length]);
  }

  function clearTerminal(){
    term.clear();
    vm.focus();
    toast('Terminal display cleared. Your task files were not changed.','good');
  }

  function cancelCommand(){
    if(!vm.interrupt()) return toast('The Linux VM is not ready yet.');
    vm.focus();
    toast('Sent Ctrl+C to stop the current command.','good');
  }

  function exportProgress(){
    const payload={exportedAt:new Date().toISOString(),score:totalScore(),completed:state.completed,hints:state.hints};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='stackforge-linux-progress.json'; a.click(); URL.revokeObjectURL(a.href);
  }

  function startArena(){
    state.arenaEnd=Date.now()+60*60*1000; persist(); startTimer(); toast('60-minute arena started.','good');
  }
  function startTimer(){
    clearInterval(timerHandle);
    const tick=()=>{
      if(!state.arenaEnd){$('#timerValue').textContent='60:00';return;}
      const left=Math.max(0,state.arenaEnd-Date.now());
      const m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);
      $('#timerValue').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if(left<=0){clearInterval(timerHandle);state.arenaEnd=null;persist();toast('Arena time ended. Export your progress.');}
    }; tick(); timerHandle=setInterval(tick,1000);
  }

  $('#searchInput').addEventListener('input',renderList);
  $('#levelFilter').addEventListener('change',renderList);
  $('#checkBtn').addEventListener('click',checkSolution);
  $('#hintBtn').addEventListener('click',showHint);
  $('#helpBtn').addEventListener('click',showHelp);
  $('#closeHelpBtn').addEventListener('click',()=>$('#helpDialog').close());
  $('#revealAnswerBtn').addEventListener('click',revealAnswer);
  $('#copyAnswerBtn').addEventListener('click',copyAnswer);
  $('#resetBtn').addEventListener('click',()=>setupCurrent(true));
  $('#previousBtn').addEventListener('click',previousChallenge);
  $('#nextBtn').addEventListener('click',nextChallenge);
  $('#clearTerminalBtn').addEventListener('click',clearTerminal);
  $('#cancelCommandBtn').addEventListener('click',cancelCommand);
  $('#refreshFilesBtn').addEventListener('click',refreshFiles);
  $('#saveEditorBtn').addEventListener('click',saveEditor);
  $('#runEditorBtn').addEventListener('click',runEditor);
  $('#exportBtn').addEventListener('click',exportProgress);
  $('#arenaBtn').addEventListener('click',startArena);
  $$('.ide-tab').forEach(t=>t.addEventListener('click',()=>switchTab(t.dataset.tab)));
  startTimer();
})();
