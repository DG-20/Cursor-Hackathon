/* ══════════════════════════════════════════════
   exhale · app.js  — context-aware AI companion
══════════════════════════════════════════════ */

// ── STATE ────────────────────────────────────
let journal     = JSON.parse(localStorage.getItem('exhale_journal') || '[]');
let kanbanState = JSON.parse(localStorage.getItem('exhale_kanban')  || '{}');
// kanbanState = { taskId: 'todo'|'doing'|'done', ... }

let session     = null;
let panelOpen   = false;
let isRec       = false;
let recognition = null;
let rafId       = null;
let dragCardId  = null;
let apiStatus   = { whisper: false, claude: false };

// ── PALETTE ──────────────────────────────────
const PALETTE = {
  purple:{ fill:'rgba(80,40,160,0.22)', stroke:'rgba(140,100,240,0.48)', text:'#c8b0ff', glow:'rgba(100,60,200,0.22)' },
  rose:  { fill:'rgba(160,60,100,0.2)', stroke:'rgba(220,120,160,0.44)', text:'#f0b0c8', glow:'rgba(180,80,120,0.2)'  },
  teal:  { fill:'rgba(40,140,140,0.2)', stroke:'rgba(80,200,200,0.4)',   text:'#90e0e0', glow:'rgba(40,160,160,0.2)'  },
  amber: { fill:'rgba(160,120,40,0.2)', stroke:'rgba(220,170,60,0.4)',   text:'#e8c870', glow:'rgba(160,120,40,0.2)'  },
  blue:  { fill:'rgba(50,90,190,0.2)',  stroke:'rgba(100,150,240,0.4)',  text:'#90b8f0', glow:'rgba(50,90,180,0.2)'   },
  gray:  { fill:'rgba(80,80,100,0.18)', stroke:'rgba(150,150,180,0.35)', text:'#b8b8d0', glow:'rgba(80,80,120,0.15)'  },
};

const TIMING_STYLE = {
  now:   { bg:'rgba(200,80,80,0.1)',   text:'#f09090', dot:'#e07070' },
  today: { bg:'rgba(180,130,40,0.1)',  text:'#e8c870', dot:'#d4a840' },
  soon:  { bg:'rgba(40,150,150,0.1)',  text:'#90e0e0', dot:'#60c8c8' },
};

const TYPE_COLORS = {
  vent:   { bg:'rgba(120,80,220,0.12)', text:'#c0a8f0' },
  action: { bg:'rgba(40,150,150,0.12)', text:'#90e0e0' },
  mixed:  { bg:'rgba(180,130,40,0.1)',  text:'#e8c870' },
  crisis: { bg:'rgba(220,80,60,0.1)',   text:'#f09080' },
};

const TYPE_LABELS = { vent:'pure vent', action:'clarity + action', mixed:'mixed', crisis:'crisis' };

// Estimated time per timing category
const TIME_ESTIMATES = {
  now:   ['5 min','10 min','15 min'],
  today: ['20 min','30 min','45 min'],
  soon:  ['1 hr','2 hrs','this week'],
};

const WHISPERS = ['i can feel this…','something\'s here…','go on, i\'m with you…','i hear you…','this matters…','keep going…','i\'m listening…'];

// ── INIT ─────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initStars();
  initNav();
  initJournalFilters();
  checkApi();
  setGreeting();
});

function setGreeting() {
  const h = new Date().getHours();
  const g = h<5?'still awake?':h<12?'good morning':h<17?'good afternoon':h<21?'good evening':'good night';
  document.getElementById('greeting').textContent = g;
}

async function checkApi() {
  try {
    const r = await fetch('/api/health');
    const d = await r.json();
    apiStatus = d;
    const dot = document.getElementById('api-dot');
    const lbl = document.getElementById('api-label');
    if (d.claude) {
      dot.className = 'status-dot on';
      lbl.textContent = d.whisper ? 'voice + ai ready' : 'ai ready';
    } else {
      dot.className = 'status-dot off';
      lbl.textContent = 'demo mode';
    }
  } catch {
    document.getElementById('api-dot').className = 'status-dot off';
    document.getElementById('api-label').textContent = 'server offline';
  }
}

// ── STARS ────────────────────────────────────
function initStars() {
  const c = document.getElementById('stars'), ctx = c.getContext('2d');
  let stars = [], constellations = [];

  // Constellation data — sets of connected star indices
  const CONST_PATTERNS = [
    // Orion-like (7 stars)
    [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6]],
    // Dipper-like (6 stars)
    [[0,1],[1,2],[2,3],[3,4],[4,5],[3,0]],
    // Cross (5 stars)
    [[0,1],[1,2],[3,1],[1,4]],
    // Triangle cluster (4 stars)
    [[0,1],[1,2],[2,0],[0,3]],
    // Arc (5 stars)
    [[0,1],[1,2],[2,3],[3,4]],
  ];

  function resize(){ c.width=innerWidth; c.height=innerHeight; }

  function seed(){
    stars = Array.from({length:Math.floor(c.width*c.height/2400)},()=>({
      x:Math.random()*c.width, y:Math.random()*c.height,
      r:Math.random()*1.3+0.2, a:Math.random()*0.7+0.2,
      sp:0.0008+Math.random()*0.003, ph:Math.random()*Math.PI*2,
    }));

    // Place 6-10 constellation groups scattered across the sky
    constellations = [];
    const count = 6 + Math.floor(Math.random()*4);
    const pattern = CONST_PATTERNS;
    for (let i = 0; i < count; i++) {
      const pat = pattern[Math.floor(Math.random()*pattern.length)];
      const maxIdx = Math.max(...pat.flat());
      const cx = 80 + Math.random()*(c.width-160);
      const cy = 60 + Math.random()*(c.height-120);
      const spread = 60 + Math.random()*120;
      // Generate star positions for this constellation
      const pts = Array.from({length:maxIdx+1},()=>({
        x: cx + (Math.random()-0.5)*spread,
        y: cy + (Math.random()-0.5)*spread*0.7,
        r: 1.2 + Math.random()*1.2,
        a: 0.5 + Math.random()*0.4,
        sp: 0.0006 + Math.random()*0.0015,
        ph: Math.random()*Math.PI*2,
        isConst: true,
      }));
      constellations.push({ pts, edges: pat, opacity: 0.08 + Math.random()*0.1, baseOpacity: 0.08+Math.random()*0.1 });
    }
  }

  function draw(t){
    ctx.clearRect(0,0,c.width,c.height);

    // Draw constellation lines first (behind stars)
    constellations.forEach(con => {
      con.edges.forEach(([a,b]) => {
        const pa = con.pts[a], pb = con.pts[b];
        if (!pa||!pb) return;
        const lineA = con.opacity * (0.6 + 0.4*Math.sin(t*0.0004 + con.pts[0].ph));
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = `rgba(200,185,255,${lineA})`;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3,8]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    });

    // Draw regular background stars
    stars.forEach(s => {
      const a = s.a*(0.3+0.7*Math.sin(t*s.sp+s.ph));
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(215,205,255,${a})`; ctx.fill();
    });

    // Draw constellation stars (slightly brighter + occasional cross-hair glow)
    constellations.forEach(con => {
      con.pts.forEach((s,i) => {
        const a = s.a*(0.5+0.5*Math.sin(t*s.sp+s.ph));
        // Glow halo
        const grd = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*5);
        grd.addColorStop(0,`rgba(200,180,255,${a*0.35})`);
        grd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r*5,0,Math.PI*2);
        ctx.fillStyle=grd; ctx.fill();
        // Star dot
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(230,220,255,${a})`; ctx.fill();
        // Cross-hair on key stars (every 3rd)
        if (i%3===0) {
          const ca = a*0.3;
          ctx.strokeStyle=`rgba(200,180,255,${ca})`;
          ctx.lineWidth=0.5;
          const sz=s.r*4;
          ctx.beginPath(); ctx.moveTo(s.x-sz,s.y); ctx.lineTo(s.x+sz,s.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(s.x,s.y-sz); ctx.lineTo(s.x,s.y+sz); ctx.stroke();
        }
      });
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize',()=>{ resize(); seed(); });
  resize(); seed(); requestAnimationFrame(draw);
}

// ── PARTICLES (completion burst) ─────────────
const pCanvas = document.getElementById('particle-canvas');
const pCtx    = pCanvas.getContext('2d');
pCanvas.width = window.innerWidth; pCanvas.height = window.innerHeight;
window.addEventListener('resize', () => { pCanvas.width=innerWidth; pCanvas.height=innerHeight; });

let particles = [];
function spawnParticles(x, y) {
  const colors = ['#c8b0ff','#90e0e0','#e8c870','#f0b0c8','#90b8f0'];
  for (let i = 0; i < 36; i++) {
    const angle  = (Math.random() * Math.PI * 2);
    const speed  = 2 + Math.random() * 5;
    const color  = colors[Math.floor(Math.random() * colors.length)];
    const size   = 2 + Math.random() * 3;
    particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 2,
      life: 1, decay: 0.018 + Math.random()*0.015, color, size, type: Math.random()>0.5?'circle':'star' });
  }
  animateParticles();
}

let particleRaf = null;
function animateParticles() {
  if (particleRaf) cancelAnimationFrame(particleRaf);
  function step() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= p.decay;
      pCtx.globalAlpha = Math.max(0, p.life);
      pCtx.fillStyle   = p.color;
      if (p.type === 'circle') {
        pCtx.beginPath(); pCtx.arc(p.x, p.y, p.size, 0, Math.PI*2); pCtx.fill();
      } else {
        pCtx.font = `${p.size * 3}px serif`;
        pCtx.fillText('✦', p.x, p.y);
      }
      pCtx.globalAlpha = 1;
    });
    if (particles.length > 0) particleRaf = requestAnimationFrame(step);
    else pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  }
  particleRaf = requestAnimationFrame(step);
}

// ── NAV ──────────────────────────────────────
function initNav() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s-' + id).classList.add('active');
  if (id === 'journal') renderJournal();
  if (id === 'kanban')  renderKanban();
  if (id === 'trends')  renderTrends();
}

// ── VOICE ────────────────────────────────────
function toggleRec() { if (!isRec) startRec(); else stopRec(); }

function startRec() {
  hideError();
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showError('Live speech not supported here. Try Chrome or Edge, or type below.'); return; }

  recognition = new SR();
  recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
  let finalText = '';

  recognition.onresult = e => {
    let interim = ''; finalText = '';
    for (let i = 0; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
      else interim += e.results[i][0].transcript;
    }
    const combined = (finalText + interim).trim();
    const live = document.getElementById('live-transcript');
    live.textContent = combined; live.classList.toggle('show', combined.length > 0);
    document.getElementById('vent-input').value = combined;
    onInput();
  };

  recognition.onerror = e => {
    if (e.error === 'not-allowed') showError('Mic access denied. Check browser permissions.');
    else if (e.error !== 'aborted') showError('Speech error: ' + e.error);
    stopRec();
  };
  recognition.onend = () => { if (isRec) recognition.start(); };
  recognition.start();

  isRec = true;
  document.getElementById('orb').classList.add('listening');
  document.getElementById('orb-icon').textContent = '◉';
  const hint = document.getElementById('orb-hint');
  hint.textContent = 'listening… tap to stop'; hint.classList.add('live');
}

function stopRec() {
  if (recognition) { recognition.onend = null; recognition.stop(); recognition = null; }
  isRec = false;
  document.getElementById('orb').classList.remove('listening');
  document.getElementById('orb-icon').textContent = '◎';
  const hint = document.getElementById('orb-hint');
  hint.textContent = 'touch to speak'; hint.classList.remove('live');
}

function onInput() {
  const v = document.getElementById('vent-input').value.trim();
  document.getElementById('release-btn').disabled = v.length < 8;
  document.getElementById('whisper').textContent = v.length > 14 ? WHISPERS[Math.floor(Math.random()*WHISPERS.length)] : '';
}

// ── RELEASE ──────────────────────────────────
async function release() {
  const text = document.getElementById('vent-input').value.trim();
  if (!text || text.length < 8) return;
  if (isRec) stopRec();
  hideError();

  const live = document.getElementById('live-transcript');
  live.textContent = ''; live.classList.remove('show');

  const msgs = [
    ['reading between the lines…','hold still'],
    ['feeling into your words…','the cosmos is listening'],
    ['mapping what matters…','finding the threads'],
    ['almost there…','one last breath'],
  ];
  let mi = 0;
  showLoading(msgs[0][0], msgs[0][1]);
  const iv = setInterval(() => { mi=(mi+1)%msgs.length; document.getElementById('l-title').textContent=msgs[mi][0]; document.getElementById('l-sub').textContent=msgs[mi][1]; }, 2200);

  try {
    let result;
    if (!apiStatus.claude) {
      await new Promise(r => setTimeout(r, 2600));
      result = demoData(text);
    } else {
      const res = await fetch('/api/analyse', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text}) });
      if (!res.ok) throw new Error((await res.json()).error || 'Server error');
      result = await res.json();
    }
    // Attach stable IDs and estimated times to each action
    if (result.actions) {
      result.actions = result.actions.map((a, i) => ({
        ...a,
        id: `action_${Date.now()}_${i}`,
        estimatedTime: a.estimatedTime || TIME_ESTIMATES[a.timing || 'soon'][Math.floor(Math.random()*3)],
      }));
    }
    session = { ...result, rawText: text, date: new Date().toISOString() };
    // Auto-seed kanban immediately so board is populated without needing to save
    if (session.actions && session.actions.length) {
      session.actions.forEach(a => { if (!kanbanState[a.id]) kanbanState[a.id] = 'todo'; });
      saveKanban();
    }
    clearInterval(iv); hideLoading();
    renderMapScreen(session);
  } catch (err) {
    clearInterval(iv); hideLoading();
    showError('Something went wrong: ' + err.message);
    session = { ...demoData(text), rawText: text, date: new Date().toISOString() };
    if (session.actions && session.actions.length) {
      session.actions.forEach(a => { if (!kanbanState[a.id]) kanbanState[a.id] = 'todo'; });
      saveKanban();
    }
    renderMapScreen(session);
  }
}

// ── DEMO DATA ────────────────────────────────
// ── LOCAL NLP PARSER ─────────────────────────
// Reads actual text — builds context-specific mind map + actions without any API key
function demoData(text) {
  const raw = text;
  const t   = text.toLowerCase();

  // 1. EXTRACT CONCRETE TASKS
  const rawTasks = [];
  const p1 = /(?:still |also |going to |gonna )?(?:need to|have to|gotta|got to|should|must|want to|planning to|supposed to|trying to)\s+([^,.!?;\n]{4,60})/gi;
  let m;
  while ((m = p1.exec(raw)) !== null) {
    const task = m[1].trim().replace(/\s+/g,' ');
    if (task.length > 3) rawTasks.push(task);
  }

  const taskNouns = [
    ['meeting','meetings','meet','standup','sync'],
    ['gym','workout','exercise','run','running','lift','training','yoga'],
    ['email','emails','inbox','reply','message','slack'],
    ['report','presentation','deck','slides','proposal','document'],
    ['deadline','submission'],
    ['appointment','dentist','doctor','therapy'],
    ['groceries','shopping','errand','errands','chores','laundry'],
    ['study','homework','assignment','exam','test'],
    ['project','feature','ticket','bug','code','review','deploy'],
    ['interview','application'],
    ['call','phone','zoom'],
    ['sleep','rest','nap'],
    ['eat','lunch','dinner','breakfast','meal','food'],
  ];

  const foundNouns = [];
  taskNouns.forEach(group => {
    group.forEach(noun => {
      const re = new RegExp(`\\b${noun}s?\\b`, 'i');
      if (re.test(t)) {
        const sentRe = new RegExp(`[^.!?\\n]*\\b${noun}s?\\b[^.!?\\n]*`, 'i');
        const match  = sentRe.exec(raw);
        if (match) {
          const frag = match[0].trim().replace(/\s+/g,' ').slice(0,80);
          if (!rawTasks.some(rt => rt.toLowerCase().includes(noun)) &&
              !foundNouns.some(fn => fn.noun === group[0])) {
            foundNouns.push({ noun: group[0], fragment: frag });
          }
        }
      }
    });
  });

  // 2. DETECT EMOTION
  const signals = {
    anxious:    /anxious|anxiety|panic|stress|stressed|nervous|worried|worry|overwhelm|overwhelmed|spiral|dread/i.test(t),
    frustrated: /angry|frustrat|rage|pissed|annoyed|irritat|furious|hate|fed up/i.test(t),
    sad:        /\bsad\b|depress|grief|cry|crying|miss\b|lonely|alone|empty|hollow|hopeless/i.test(t),
    tired:      /tired|exhausted|drained|burnt out|burnout|no energy|can.?t keep up|worn out/i.test(t),
    busy:       /busy|lot to do|so much|too much|pile|juggl|a lot|many|multiple|maby|many/i.test(t),
  };

  const mood  = signals.anxious?'anxious':signals.frustrated?'frustrated':signals.sad?'heavy':signals.tired?'drained':signals.busy?'overwhelmed':'unsettled';
  const emoji = signals.anxious?'🌀':signals.frustrated?'🔥':signals.sad?'🌧':signals.tired?'🌑':signals.busy?'⚡':'✦';
  const intensity = (signals.anxious&&signals.busy)?5:(signals.frustrated||signals.anxious)?4:(signals.sad||signals.tired)?3:3;

  const allTaskTexts = [
    ...rawTasks.map(rt => ({ source:'explicit', text:rt })),
    ...foundNouns.map(fn => ({ source:'noun', text:fn.fragment, noun:fn.noun })),
  ];

  // Deduplicate
  const deduped = [];
  allTaskTexts.forEach(task => {
    const isDup = deduped.some(d =>
      d.text.toLowerCase().split(' ').filter(w=>w.length>4).some(w=>task.text.toLowerCase().includes(w))
    );
    if (!isDup) deduped.push(task);
  });

  const hasTasks   = deduped.length > 0;
  const hasEmotion = signals.anxious||signals.frustrated||signals.sad||signals.tired;
  const type = hasTasks && hasEmotion ? 'mixed' : hasTasks ? 'action' : 'vent';

  // 3. TIMING
  const timingFor = (taskText, idx) => {
    const tl = taskText.toLowerCase();
    if (/tomorrow|tonight|this evening|later today|eod|asap|right now|immediately|urgent/.test(tl)) return 'today';
    if (/this week|by friday|next few days|later this week/.test(tl)) return 'soon';
    if (/now|today|this morning|this afternoon/.test(tl)) return 'now';
    return idx === 0 ? 'now' : idx < 3 ? 'today' : 'soon';
  };

  const timeFor = (noun) => {
    const map = {
      meeting:'30-60 min', meetings:'30-60 min', standup:'15 min', sync:'15 min',
      gym:'60-90 min', workout:'60-90 min', exercise:'45 min', run:'30-45 min', training:'60 min', yoga:'60 min',
      email:'15 min', emails:'20-30 min', inbox:'20 min', slack:'10 min',
      report:'1-2 hrs', presentation:'2-3 hrs', deck:'2-3 hrs', slides:'1-2 hrs',
      groceries:'30-45 min', errand:'20-30 min', errands:'45 min', chores:'30 min', laundry:'20 min',
      study:'1-2 hrs', homework:'1-2 hrs', exam:'2-3 hrs',
      sleep:'8 hrs', lunch:'30 min', dinner:'45 min', meal:'30 min',
      call:'15-30 min', zoom:'30-60 min', phone:'15 min',
    };
    return map[noun] || TIME_ESTIMATES[timingFor('',1)][1];
  };

  const toAction = (taskText) => taskText
    .replace(/^(i |i'm |i am |i still |i also |i need to |i have to |i should |i gotta |i got to |i want to |i'm going to |gonna )/i,'')
    .replace(/^(need to |have to |should |must |gotta |got to )/i,'')
    .trim().replace(/^./,c=>c.toUpperCase());

  const whyFor = (task, noun) => {
    const tl = (task+' '+(noun||'')).toLowerCase();
    if (/meeting|call|sync|standup|zoom/.test(tl)) return 'Showing up present is the only requirement — just be there';
    if (/gym|workout|exercise|run|training|yoga/.test(tl)) return 'Movement resets the nervous system faster than rest does';
    if (/email|inbox|reply|message|slack/.test(tl)) return 'One reply clears more mental debt than the task itself weighs';
    if (/sleep|rest|nap/.test(tl)) return 'Nothing on the list gets better when you\'re running empty';
    if (/eat|food|meal|lunch|dinner|breakfast/.test(tl)) return 'Fuelling your body is infrastructure, not a reward';
    if (/report|presentation|deck|slides/.test(tl)) return 'Starting breaks the spell — the first 5 minutes are the hardest part';
    if (/groceries|errand|shopping|chore/.test(tl)) return 'Small logistics cleared = real mental space reclaimed';
    if (/study|homework|exam|assignment/.test(tl)) return 'One session of focused work compounds faster than it feels';
    return 'Getting this out of your head and into the world reduces its weight';
  };

  // 4. BUILD ACTIONS
  const actions = deduped.slice(0,6).map((task, i) => {
    const timing = timingFor(task.text, i);
    const noun   = task.noun||null;
    const cleaned = toAction(task.text);
    return {
      id:            `a_${Date.now()}_${i}`,
      text:          cleaned.length > 4 ? cleaned : task.text,
      timing,
      estimatedTime: noun ? timeFor(noun) : TIME_ESTIMATES[timing][Math.floor(Math.random()*3)],
      why:           whyFor(cleaned, noun),
    };
  });

  // 5. BUILD NODES
  const usedColors = new Set();
  const pickColor  = (p) => { if(!usedColors.has(p)){usedColors.add(p);return p;} const opts=['purple','rose','teal','amber','blue','gray'].filter(c=>!usedColors.has(c)); const c=opts[0]||'purple'; usedColors.add(c); return c; };

  const groups = {
    work:     deduped.filter(d=>/meeting|email|report|project|deadline|presentation|review|code|ticket|boss|manager|slack|work|standup|sync|zoom/i.test(d.text)),
    body:     deduped.filter(d=>/gym|workout|exercise|run|sleep|eat|food|meal|rest|health|yoga|training/i.test(d.text)),
    personal: deduped.filter(d=>/family|friend|partner|kids|parent|social|errand|grocery|shopping|chore|laundry/i.test(d.text)),
    mind:     deduped.filter(d=>/study|homework|read|learn|exam|course|book|assignment/i.test(d.text)),
  };

  const nodes = [];
  if (groups.work.length)     nodes.push({ label:'work & meetings', color:pickColor('purple'), emotion:signals.anxious?'pressing':'pending',   weight:2, children:groups.work.slice(0,2).map(d=>toAction(d.text).slice(0,22)) });
  if (groups.body.length)     nodes.push({ label:'body & health',   color:pickColor('teal'),   emotion:signals.tired?'depleted':'needed',      weight:2, children:groups.body.slice(0,2).map(d=>toAction(d.text).slice(0,22)) });
  if (groups.personal.length) nodes.push({ label:'personal',        color:pickColor('amber'),  emotion:'waiting',                              weight:1, children:groups.personal.slice(0,2).map(d=>toAction(d.text).slice(0,22)) });
  if (groups.mind.length)     nodes.push({ label:'learning',        color:pickColor('blue'),   emotion:'scheduled',                            weight:1, children:groups.mind.slice(0,2).map(d=>toAction(d.text).slice(0,22)) });
  if (signals.anxious&&nodes.length<4) nodes.push({ label:'mental load',   color:pickColor('purple'), emotion:'cycling',  weight:2, children:['looping thoughts','hard to switch off'] });
  if (signals.tired  &&nodes.length<4) nodes.push({ label:'exhaustion',    color:pickColor('teal'),   emotion:'depleted', weight:2, children:['low reserves','need rest'] });
  if (signals.sad    &&nodes.length<4) nodes.push({ label:'inner weight',  color:pickColor('rose'),   emotion:'tender',   weight:1, children:['sitting with it'] });
  if (nodes.length < 2) nodes.push({ label:'processing', color:'purple', emotion:'unfolding', weight:2, children:['still finding words'] });

  // 6. CENTER THEME
  const centerTheme = deduped.length>3?'a full plate':deduped.length>0&&signals.anxious?'pressure & tasks':deduped.length>0?'things to do':signals.tired?'running on empty':signals.sad?'quiet grief':signals.frustrated?'built-up tension':signals.anxious?'spiral of worry':'carrying this';

  // 7. REFLECTION
  const taskCount = deduped.length;
  const tc = taskCount>0?`You've got ${taskCount>4?'a lot':taskCount===1?'something':'a few things'} on your plate`:'';
  const reflection = type==='action'&&taskCount>0
    ? `${tc} — and saying it out loud is the first step to getting through it. None of this needs to happen all at once. Breaking it into steps makes it smaller than it feels right now.`
    : type==='mixed'
    ? `${signals.anxious?'The pressure of everything at once is real':signals.tired?'You sound tired beneath all of this':'There\'s a lot going on'}. ${tc?tc+', a':'A'}nd it makes sense that carrying it feels heavy. You don\'t have to solve it all today — just move one thing forward.`
    : signals.tired?'You sound genuinely exhausted — not just tired, but the kind of depleted that builds when you keep pushing without pausing. What you\'re feeling is your body asking for something it hasn\'t gotten enough of.'
    : signals.anxious?'That kind of mental spinning is exhausting in itself. The thoughts feel urgent but the urgency isn\'t always real. You\'ve held it in long enough — let it land here.'
    : signals.frustrated?'The frustration makes complete sense. Something isn\'t working the way it should and you\'ve been patient with it longer than you needed to be.'
    : signals.sad?'What you\'re feeling is real, and it deserves to be felt — not fixed, not explained away. You don\'t have to be okay right now.'
    : 'What you\'re carrying sounds genuinely heavy. It makes complete sense you needed to put it somewhere. You don\'t have to fix any of this right now.';

  // 8. JOURNAL PROMPT
  const journalPrompt = type==='action'&&deduped.length>0
    ? 'Of everything on your list, which one are you most quietly dreading — and what\'s underneath that?'
    : signals.anxious?'What\'s the thing your mind keeps returning to most, and what would it mean if that resolved?'
    : signals.tired?'What would you do differently tomorrow if you gave yourself full permission to protect your energy?'
    : signals.sad?'What would you say to a dear friend who felt exactly the way you do right now?'
    : 'What\'s one thing you\'d feel lighter without — and what would it take to put it down?';

  return { type, mood, mood_emoji:emoji, intensity, center_theme:centerTheme, nodes:nodes.slice(0,5), actions, reflection, journal_prompt:journalPrompt, crisis_resource:false };
}

// ── MAP RENDERER ─────────────────────────────
let mapNodes = [];

function renderMapScreen(d) {
  document.querySelector('.tab[data-tab="map"]').classList.add('visible');
  switchTab('map');

  const canvas = document.getElementById('map-canvas');
  const W = innerWidth, H = innerHeight - 56;
  canvas.width = W*devicePixelRatio; canvas.height = H*devicePixelRatio;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const isCrisis = d.type === 'crisis';
  const cx = isCrisis ? W*0.5 : W*0.42, cy = H*0.5;
  mapNodes = [];

  mapNodes.push({ x:cx, y:cy, bx:cx, by:cy, label:d.center_theme, type:'center', color:PALETTE.purple,
    phase:0, speed:0.25+(d.intensity||3)*0.02, amp:isCrisis?2:3+(d.intensity||3)*0.5,
    rx:72, ry:40, opacity:0, delay:0 });

  if (!isCrisis) {
    const nodes = d.nodes||[], n = nodes.length;
    const outerR = Math.min(W*0.22, H*0.27);
    nodes.forEach((nd, i) => {
      const angle = (i/n)*Math.PI*2 - Math.PI/2;
      const nx = cx+Math.cos(angle)*outerR, ny = cy+Math.sin(angle)*outerR;
      const c = PALETTE[nd.color]||PALETTE.purple, w = nd.weight||1;
      mapNodes.push({ x:nx, y:ny, bx:nx, by:ny, label:nd.label, type:'mid', parentIdx:0,
        color:c, emotion:nd.emotion, phase:Math.random()*Math.PI*2,
        speed:0.36+Math.random()*0.2+(d.intensity||3)*0.02, amp:5+w*1.5,
        rx:44+w*4, ry:26+w*2, opacity:0, delay:360+i*130 });
      const midIdx = mapNodes.length-1;
      (nd.children||[]).forEach((ch, j) => {
        const spread = (nd.children.length===1)?0:(j===0?-0.38:0.38);
        const cr = outerR+72, ca = angle+spread;
        mapNodes.push({ x:cx+Math.cos(ca)*cr, y:cy+Math.sin(ca)*cr, bx:cx+Math.cos(ca)*cr, by:cy+Math.sin(ca)*cr,
          label:ch, type:'child', parentIdx:midIdx, color:c,
          phase:Math.random()*Math.PI*2, speed:0.5+Math.random()*0.3, amp:7,
          rx:40, ry:22, opacity:0, delay:650+i*130+j*90 });
      });
    });
  }

  // Fill panel
  document.getElementById('p-emoji').textContent     = d.mood_emoji||'🌑';
  document.getElementById('p-mood').textContent      = d.mood||'—';
  document.getElementById('p-reflection').textContent = d.reflection||'';
  document.getElementById('p-prompt').textContent    = d.journal_prompt||'';
  document.getElementById('p-intensity').innerHTML   = Array.from({length:5},(_,i)=>`<div class="int-pip ${i<(d.intensity||3)?'lit':''}"></div>`).join('');

  const tt = { vent:'✦ pure expression — you needed to be heard', action:'✦ clarity + action', mixed:'✦ expression + gentle steps', crisis:'✦ you are not alone' };
  const tc = { vent:'rgba(100,210,160,0.55)', action:'rgba(232,200,112,0.6)', mixed:'rgba(180,150,255,0.55)', crisis:'rgba(240,140,120,0.7)' };
  const typeEl = document.getElementById('p-type-tag');
  typeEl.textContent = tt[d.type]||tt.vent; typeEl.style.color = tc[d.type]||tc.vent;

  const crisisSec = document.getElementById('p-crisis-sec');
  if (d.crisis_resource) {
    crisisSec.style.display = '';
    document.getElementById('p-crisis-text').textContent = d.reflection;
    document.getElementById('p-reflection').textContent = '';
  } else { crisisSec.style.display = 'none'; }

  const actSec = document.getElementById('p-actions-sec');
  if (d.actions && d.actions.length && !isCrisis) {
    actSec.style.display = '';
    document.getElementById('p-actions').innerHTML = d.actions.map(a => {
      const t = TIMING_STYLE[a.timing]||TIMING_STYLE.soon;
      return `<div class="action-row">
        <div class="action-dot" style="background:${t.dot}"></div>
        <div class="action-body">
          <div class="action-text">${a.text}</div>
          ${a.why?`<div class="action-why">${a.why}</div>`:''}
          <div class="action-meta">
            <span class="action-tag" style="background:${t.bg};color:${t.text}">${a.timing}</span>
            <span class="action-time">⏱ ${a.estimatedTime||''}</span>
          </div>
        </div>
      </div>`;
    }).join('');
  } else { actSec.style.display = 'none'; }

  const sb = document.getElementById('save-btn');
  sb.textContent = '✦ save to journal'; sb.classList.remove('saved');

  // Canvas animation
  if (rafId) cancelAnimationFrame(rafId);
  const t0 = performance.now();
  function draw(ts) {
    const elapsed = ts - t0;
    ctx.clearRect(0, 0, W, H);
    mapNodes.forEach(nd => {
      if (nd.parentIdx===undefined) return;
      const p = mapNodes[nd.parentIdx];
      if (!p||nd.opacity<0.01||p.opacity<0.01) return;
      ctx.globalAlpha = Math.min(nd.opacity,p.opacity)*0.2;
      ctx.beginPath(); ctx.moveTo(p.x,p.y);
      const mx=(p.x+nd.x)*0.5+(nd.y-p.y)*0.1, my=(p.y+nd.y)*0.5-(nd.x-p.x)*0.1;
      ctx.quadraticCurveTo(mx,my,nd.x,nd.y);
      ctx.strokeStyle=nd.color.stroke; ctx.lineWidth=0.65; ctx.setLineDash([2,9]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1;
    });
    mapNodes.forEach(nd => {
      if (elapsed<nd.delay){nd.opacity=0;return;}
      nd.opacity=Math.min(1,nd.opacity+0.02);
      nd.x=nd.bx+Math.sin(elapsed*0.001*nd.speed+nd.phase)*nd.amp;
      nd.y=nd.by+Math.cos(elapsed*0.001*nd.speed*0.7+nd.phase)*nd.amp*0.6;
      ctx.globalAlpha=nd.opacity;
      const grd=ctx.createRadialGradient(nd.x,nd.y,0,nd.x,nd.y,nd.rx+24);
      grd.addColorStop(0,nd.color.glow); grd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.ellipse(nd.x,nd.y,nd.rx+24,nd.ry+15,0,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
      ctx.beginPath(); ctx.ellipse(nd.x,nd.y,nd.rx,nd.ry,0,0,Math.PI*2);
      ctx.fillStyle=nd.color.fill; ctx.fill(); ctx.strokeStyle=nd.color.stroke; ctx.lineWidth=0.6; ctx.stroke();
      const fs=nd.type==='center'?12:nd.type==='mid'?10:9;
      ctx.font=`300 ${fs}px 'Jost',sans-serif`; ctx.fillStyle=nd.color.text; ctx.textAlign='center'; ctx.textBaseline='middle';
      const words=nd.label.split(' ');
      if(words.length<=2){ctx.fillText(nd.label,nd.x,nd.y);}
      else{const h=Math.ceil(words.length/2);ctx.fillText(words.slice(0,h).join(' '),nd.x,nd.y-7);ctx.fillText(words.slice(h).join(' '),nd.x,nd.y+7);}
      if(nd.emotion&&nd.type==='mid'){ctx.font=`200 8px 'Jost',sans-serif`;ctx.fillStyle=nd.color.stroke;ctx.fillText(nd.emotion,nd.x,nd.y+nd.ry+11);}
      ctx.globalAlpha=1;
    });
    rafId=requestAnimationFrame(draw);
  }
  rafId=requestAnimationFrame(draw);
  setTimeout(()=>openPanel(),1200);
}

function openPanel(){ panelOpen=true; document.getElementById('panel').classList.add('open'); document.getElementById('panel-toggle').textContent='hide reading ←'; }
function togglePanel(){ panelOpen=!panelOpen; document.getElementById('panel').classList.toggle('open',panelOpen); document.getElementById('panel-toggle').textContent=panelOpen?'hide reading ←':'your reading →'; }

// ── JOURNAL ──────────────────────────────────
function initJournalFilters() {
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderJournal(btn.dataset.filter);
    });
  });
}

function saveEntry() {
  if (!session) return;
  journal.unshift({ ...session, savedAt: new Date().toISOString() });
  if (journal.length > 200) journal = journal.slice(0,200);
  localStorage.setItem('exhale_journal', JSON.stringify(journal));
  // Seed kanban with any actions (default to todo)
  if (session.actions && session.actions.length) {
    session.actions.forEach(a => {
      if (!kanbanState[a.id]) kanbanState[a.id] = 'todo';
    });
    saveKanban();
  }
  const sb = document.getElementById('save-btn');
  sb.textContent = '✓ saved'; sb.classList.add('saved');
}

function renderJournal(filter = 'all') {
  const el = document.getElementById('entry-list');
  const filtered = filter === 'all' ? journal : journal.filter(e => e.type === filter);

  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state">${filter==='all'?'your reflections will live here':'no '+filter+' entries yet'}<br><small>start with a vent →</small></div>`;
    return;
  }

  el.innerHTML = filtered.map((e, i) => {
    const d   = new Date(e.savedAt||e.date);
    const ds  = d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    const tc  = TYPE_COLORS[e.type]||TYPE_COLORS.vent;
    const hasActions = e.actions && e.actions.length > 0;

    const actionChips = hasActions ? e.actions.slice(0,3).map(a => {
      const t = TIMING_STYLE[a.timing]||TIMING_STYLE.soon;
      return `<span class="action-chip-mini" style="background:${t.bg};color:${t.text}">${a.text.slice(0,30)}${a.text.length>30?'…':''}</span>`;
    }).join('') : '';

    return `<div class="entry-card" style="animation-delay:${i*45}ms" onclick="openEntryModal(${i+(filter==='all'?0:0)}, '${filter}')">
      <div class="entry-top">
        <span class="entry-date">${ds}</span>
        <div class="entry-badges">
          <span class="entry-badge" style="background:${tc.bg};color:${tc.text}">${e.mood_emoji||''} ${e.mood||''}</span>
          <span class="entry-type-pill" style="background:${tc.bg};color:${tc.text}">${TYPE_LABELS[e.type]||'vent'}</span>
        </div>
      </div>
      <div class="entry-preview">${(e.rawText||'').slice(0,160)}</div>
      ${actionChips ? `<div class="entry-actions-preview">${actionChips}</div>` : ''}
      <div class="entry-footer">
        <span class="entry-theme">✦ ${e.center_theme||''}</span>
        <div class="entry-stats">
          <span class="entry-stat">intensity <span>${e.intensity||'—'}/5</span></span>
          ${hasActions?`<span class="entry-stat"><span>${e.actions.length}</span> steps</span>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function openEntryModal(idx, filter) {
  const filtered = filter === 'all' ? journal : journal.filter(e => e.type === filter);
  const e = filtered[idx];
  if (!e) return;

  const d  = new Date(e.savedAt||e.date);
  const ds = d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const tc = TYPE_COLORS[e.type]||TYPE_COLORS.vent;

  document.getElementById('m-emoji').textContent = e.mood_emoji||'🌑';
  document.getElementById('m-mood').textContent  = e.mood||'';
  document.getElementById('m-date').textContent  = ds;
  document.getElementById('m-type').textContent  = TYPE_LABELS[e.type]||'vent';
  document.getElementById('m-type').style.background = tc.bg;
  document.getElementById('m-type').style.color      = tc.text;
  document.getElementById('m-theme').textContent     = e.center_theme||'';
  document.getElementById('m-raw').textContent       = e.rawText||'';
  document.getElementById('m-reflection').textContent = e.reflection||'';
  document.getElementById('m-prompt').textContent    = e.journal_prompt||'';

  const actSec = document.getElementById('m-actions-modal-sec');
  if (e.actions && e.actions.length) {
    actSec.style.display = '';
    document.getElementById('m-actions-list').innerHTML = e.actions.map(a => {
      const t = TIMING_STYLE[a.timing]||TIMING_STYLE.soon;
      return `<div class="modal-action-row">
        <div class="modal-action-dot" style="background:${t.dot}"></div>
        <div class="modal-action-body">
          <div class="modal-action-text">${a.text}</div>
          ${a.why?`<div class="modal-action-why">${a.why}</div>`:''}
          <div class="modal-action-meta">
            <span class="modal-action-tag" style="background:${t.bg};color:${t.text}">${a.timing}</span>
            <span class="modal-action-time">⏱ ${a.estimatedTime||''}</span>
          </div>
        </div>
      </div>`;
    }).join('');
  } else { actSec.style.display = 'none'; }

  document.getElementById('entry-modal').classList.add('open');
}

function closeEntryModal() { document.getElementById('entry-modal').classList.remove('open'); }
function closeModal(e) { if (e.target === document.getElementById('entry-modal')) closeEntryModal(); }

// ── KANBAN ───────────────────────────────────
function saveKanban() { localStorage.setItem('exhale_kanban', JSON.stringify(kanbanState)); }

function getAllActions() {
  // Collect all unique actions across all journal entries
  const seen = new Set(), actions = [];
  journal.forEach(e => {
    (e.actions||[]).forEach(a => {
      if (!seen.has(a.id)) { seen.add(a.id); actions.push({ ...a, sessionDate: e.date, sessionMood: e.mood, sessionEmoji: e.mood_emoji }); }
    });
  });
  // Also include current unsaved session
  if (session && session.actions) {
    session.actions.forEach(a => {
      if (!seen.has(a.id)) { seen.add(a.id); actions.push({ ...a, sessionDate: session.date, sessionMood: session.mood, sessionEmoji: session.mood_emoji }); }
    });
  }
  return actions;
}

function renderKanban() {
  const allActions = getAllActions();
  const empty = document.getElementById('kanban-empty');
  const board = document.getElementById('kanban-board');

  if (!allActions.length) {
    board.style.display = 'none'; empty.style.display = 'block'; return;
  }
  board.style.display = ''; empty.style.display = 'none';

  const cols = { todo: [], doing: [], done: [] };
  allActions.forEach(a => {
    const col = kanbanState[a.id] || 'todo';
    cols[col].push(a);
  });

  Object.entries(cols).forEach(([col, actions]) => {
    document.getElementById('count-' + col).textContent = actions.length;
    document.getElementById('cards-' + col).innerHTML = actions.map((a, i) => buildCard(a, col, i)).join('');
  });

  // Wire up drag events
  document.querySelectorAll('.k-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      dragCardId = card.dataset.id;
      setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dragCardId = null;
    });
  });
}

function buildCard(a, col, i) {
  const t = TIMING_STYLE[a.timing]||TIMING_STYLE.soon;
  const done = col === 'done';
  const checkIcon = done ? '✓' : '';
  return `<div class="k-card ${done?'done-card':''}" 
    draggable="true" 
    data-id="${a.id}"
    style="animation-delay:${i*40}ms">
    <div class="complete-glyph">✦</div>
    <div class="k-card-top">
      <div class="k-card-text">${a.text}</div>
      <div class="k-card-check ${done?'checked':''}" onclick="toggleCardDone(event,'${a.id}')">${checkIcon}</div>
    </div>
    <div class="k-card-meta">
      <span class="k-timing" style="background:${t.bg};color:${t.text}">${a.timing}</span>
      <span class="k-time"><span class="k-time-icon"></span> ${a.estimatedTime||''}</span>
    </div>
    ${a.why?`<div class="k-why">${a.why}</div>`:''}
    ${a.sessionEmoji?`<div class="k-source">${a.sessionEmoji} from ${new Date(a.sessionDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>`:''}
  </div>`;
}

function toggleCardDone(e, id) {
  e.stopPropagation();
  const currentCol = kanbanState[id] || 'todo';
  const newCol = currentCol === 'done' ? 'todo' : 'done';
  kanbanState[id] = newCol;
  saveKanban();
  if (newCol === 'done') triggerCompletion(e.target);
  renderKanban();
}

function triggerCompletion(el) {
  // Particle burst from card position
  const rect = el.closest('.k-card').getBoundingClientRect();
  const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
  spawnParticles(cx, cy);

  // Brief scale pop on card
  const card = el.closest('.k-card');
  if (card) {
    card.classList.add('completing');
    card.classList.add('showing-glyph');
    setTimeout(() => { card.classList.remove('completing'); card.classList.remove('showing-glyph'); }, 900);
  }
}

// Drag and drop
function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}
function onDrop(e, col) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!dragCardId) return;

  const prevCol = kanbanState[dragCardId];
  kanbanState[dragCardId] = col;
  saveKanban();

  if (col === 'done' && prevCol !== 'done') {
    // Burst from drop position
    spawnParticles(e.clientX, e.clientY);
  }
  renderKanban();
}

// ── TRENDS ───────────────────────────────────
function renderTrends() {
  const grid = document.getElementById('stats-grid');
  if (!journal.length) {
    grid.innerHTML=`<div style="grid-column:span 2" class="empty-state">patterns emerge as you use exhale<br><small>keep venting →</small></div>`;
    document.getElementById('mood-chart').style.display='none';
    document.getElementById('insight-card').style.display='none';
    return;
  }
  const total=journal.length, avgInt=(journal.reduce((s,e)=>s+(e.intensity||3),0)/total).toFixed(1);
  const streak=calcStreak(), moodCount={}, dayCount={};
  journal.forEach(e=>{
    if(e.mood) moodCount[e.mood]=(moodCount[e.mood]||0)+1;
    const day=new Date(e.savedAt||e.date).toLocaleDateString('en-US',{weekday:'long'});
    dayCount[day]=(dayCount[day]||0)+1;
  });
  const topMood=Object.entries(moodCount).sort((a,b)=>b[1]-a[1])[0]||['—',0];
  const topDay=Object.entries(dayCount).sort((a,b)=>b[1]-a[1])[0];
  grid.innerHTML=`
    <div class="stat-card"><div class="stat-label">sessions</div><div class="stat-val">${total}</div><div class="stat-desc">total reflections</div></div>
    <div class="stat-card"><div class="stat-label">avg intensity</div><div class="stat-val">${avgInt}<sub>/5</sub></div><div class="stat-desc">emotional weight</div></div>
    <div class="stat-card"><div class="stat-label">most felt</div><div class="stat-val" style="font-size:22px">${topMood[0]}</div><div class="stat-desc">${topMood[1]} session${topMood[1]!==1?'s':''}</div></div>
    <div class="stat-card"><div class="stat-label">streak</div><div class="stat-val">${streak}<sub>d</sub></div><div class="stat-desc">days in a row</div></div>`;
  if(topDay&&total>=3){document.getElementById('insight-card').style.display='';document.getElementById('insight-text').textContent=`Your most active venting days tend to be ${topDay[0]}s — that day carries something extra for you.`;}
  const barColors={anxious:'#9880d8',heavy:'#7070b8',overwhelmed:'#d090c0',frustrated:'#d08070',sad:'#7090c0',hopeful:'#70c8a0',tender:'#d090b8',lost:'#9090c0',raw:'#c080a0',numb:'#8888a8',grieving:'#8080b0',angry:'#d06060',hollow:'#808090',restless:'#b0a060'};
  const top6=Object.entries(moodCount).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxC=Math.max(...top6.map(x=>x[1]),1);
  document.getElementById('mood-chart').style.display='';
  document.getElementById('mood-bars').innerHTML=top6.map(([mood,count])=>`
    <div class="bar-row"><div class="bar-name">${mood}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${Math.round(count/maxC*100)}%;background:${barColors[mood]||'rgba(180,150,255,0.5)'}"></div></div>
    <div class="bar-n">${count}</div></div>`).join('');
}

function calcStreak() {
  if(!journal.length) return 0;
  const days=[...new Set(journal.map(e=>new Date(e.savedAt||e.date).toDateString()))].sort((a,b)=>new Date(b)-new Date(a));
  let s=1;
  for(let i=1;i<days.length;i++){if(Math.round((new Date(days[i-1])-new Date(days[i]))/86400000)===1)s++;else break;}
  return s;
}

// ── HELPERS ──────────────────────────────────
function showLoading(t,s){document.getElementById('l-title').textContent=t;document.getElementById('l-sub').textContent=s;document.getElementById('loading').classList.add('show')}
function hideLoading(){document.getElementById('loading').classList.remove('show')}
function showError(m){const el=document.getElementById('error-bar');el.textContent=m;el.classList.add('show')}
function hideError(){document.getElementById('error-bar').classList.remove('show')}

function resetAll() {
  if(rafId) cancelAnimationFrame(rafId);
  session=null; panelOpen=false;
  document.getElementById('panel').classList.remove('open');
  document.querySelector('.tab[data-tab="map"]').classList.remove('visible');
  document.getElementById('vent-input').value='';
  document.getElementById('release-btn').disabled=true;
  document.getElementById('whisper').textContent='';
  const live=document.getElementById('live-transcript');
  live.textContent=''; live.classList.remove('show');
  hideError(); switchTab('vent');
}

window.addEventListener('resize',()=>{ if(session) renderMapScreen(session); });