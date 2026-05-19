// ─── STATE ───────────────────────────────────────────────
const STORE_KEY = 'ceo_dashboard_v2';

function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}

function save(state) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

let state = load();

// Defaults
if (!state.goals1y) state.goals1y = [
    { id: 1, text: 'Erstes Geschäft aufbauen', done: false, tag: 'Business' },
    { id: 2, text: '10.000 € Sparrate erreichen', done: false, tag: 'Finanzen' },
    { id: 3, text: '3x pro Woche Sport treiben', done: true, tag: 'Health' },
];

if (!state.habits) state.habits = [
    { id: 1, name: 'Morgenroutine', days: [false,false,false,false,false,false,false] },
    { id: 2, name: 'Lesen 30min',   days: [false,false,false,false,false,false,false] },
    { id: 3, name: 'Sport',         days: [false,false,false,false,false,false,false] },
    { id: 4, name: 'Journaling',    days: [false,false,false,false,false,false,false] },
];

if (!state.kpis) state.kpis = [
    { id: 1, label: 'Umsatz / Monat',  value: '0', unit: '€',      color: '#c8a96e', trend: 'flat' },
    { id: 2, label: 'Nettowert',        value: '0', unit: '€',      color: '#7b68ee', trend: 'up'   },
    { id: 3, label: 'Sport-Einheiten',  value: '0', unit: 'Woche',  color: '#4ecdc4', trend: 'flat' },
    { id: 4, label: 'Lern-Stunden',     value: '0', unit: 'Monat',  color: '#6bcb77', trend: 'up'   },
];

// ─── DATE ────────────────────────────────────────────────
const now = new Date();
document.getElementById('currentDate').textContent =
    now.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const MONTHS_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
document.getElementById('focusMonth').textContent = MONTHS_DE[now.getMonth()];

// Month progress
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
const monthPct = Math.round((now.getDate() / daysInMonth) * 100);
document.getElementById('monthProg').textContent = monthPct + '%';
document.getElementById('fillMonth').style.width = monthPct + '%';

// ─── GOALS ───────────────────────────────────────────────
function renderGoals() {
    const list = document.getElementById('goals1y');
    list.innerHTML = '';
    state.goals1y.forEach(g => {
        const el = document.createElement('div');
        el.className = 'goal-item' + (g.done ? ' done' : '');
        el.innerHTML = `
      <div class="goal-check" onclick="toggleGoal(${g.id})"></div>
      <span class="goal-text" contenteditable="true" spellcheck="false"
        onblur="updateGoalText(${g.id}, this.textContent)">${g.text}</span>
      <span class="goal-tag">${g.tag}</span>
      <span style="color:var(--text-dim);font-size:11px;cursor:pointer;margin-left:6px" onclick="deleteGoal(${g.id})">✕</span>
    `;
        list.appendChild(el);
    });
    updateGoalProgress();
    computeScore();
}

function toggleGoal(id) {
    const g = state.goals1y.find(x => x.id === id);
    if (g) { g.done = !g.done; save(state); renderGoals(); }
}

function updateGoalText(id, text) {
    const g = state.goals1y.find(x => x.id === id);
    if (g) { g.text = text.trim(); save(state); }
}

function deleteGoal(id) {
    state.goals1y = state.goals1y.filter(x => x.id !== id);
    save(state); renderGoals();
}

function addGoal(type) {
    const inp = document.getElementById('input' + type);
    const text = inp.value.trim();
    if (!text) return;
    state.goals1y.push({ id: Date.now(), text, done: false, tag: 'Ziel' });
    inp.value = '';
    save(state); renderGoals();
}

function updateGoalProgress() {
    const total = state.goals1y.length;
    const done  = state.goals1y.filter(g => g.done).length;
    document.getElementById('prog1y').textContent = `${done} / ${total}`;
    document.getElementById('fill1y').style.width = total ? (done / total * 100) + '%' : '0%';
}

// ─── HABITS ──────────────────────────────────────────────
const DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];

function renderHabits() {
    const grid = document.getElementById('habitGrid');
    grid.innerHTML = '';

    // Header row
    const header = document.createElement('div');
    header.className = 'habit-row';
    header.innerHTML = `<div class="habit-name" style="color:var(--text-dim);font-size:11px">Gewohnheit</div>
    <div class="habit-dots">${DAYS.map(d => `<div style="width:22px;text-align:center;font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim)">${d}</div>`).join('')}</div>
    <div class="habit-streak" style="color:var(--text-dim);font-size:10px">🔥</div>`;
    grid.appendChild(header);

    state.habits.forEach(h => {
        const row = document.createElement('div');
        row.className = 'habit-row';
        const streak = calcStreak(h.days);
        row.innerHTML = `
      <div class="habit-name" contenteditable="true" spellcheck="false"
        onblur="updateHabitName(${h.id}, this.textContent)">${h.name}</div>
      <div class="habit-dots">
        ${h.days.map((d, i) => `<div class="habit-dot${d ? ' active' : ''}" onclick="toggleHabit(${h.id},${i})"></div>`).join('')}
      </div>
      <div class="habit-streak">${streak > 0 ? streak : '—'}</div>
    `;
        grid.appendChild(row);
    });
    computeScore();
}

function calcStreak(days) {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
        if (days[i]) s++; else break;
    }
    return s;
}

function toggleHabit(id, dayIdx) {
    const h = state.habits.find(x => x.id === id);
    if (h) { h.days[dayIdx] = !h.days[dayIdx]; save(state); renderHabits(); }
}

function updateHabitName(id, name) {
    const h = state.habits.find(x => x.id === id);
    if (h) { h.name = name.trim(); save(state); }
}

function addHabit() {
    const inp = document.getElementById('inputHabit');
    const name = inp.value.trim();
    if (!name) return;
    state.habits.push({ id: Date.now(), name, days: [false,false,false,false,false,false,false] });
    inp.value = '';
    save(state); renderHabits();
}

// ─── KPIs ─────────────────────────────────────────────────
function renderKPIs() {
    const grid = document.getElementById('kpiGrid');
    grid.innerHTML = '';
    state.kpis.forEach(k => {
        const card = document.createElement('div');
        card.className = 'card';
        const trendIcon  = k.trend === 'up' ? '↑' : k.trend === 'down' ? '↓' : '→';
        const trendClass = k.trend === 'up' ? 'trend-up' : k.trend === 'down' ? 'trend-down' : 'trend-flat';
        card.innerHTML = `
      <div class="kpi-label" contenteditable="true" spellcheck="false"
        onblur="updateKPI(${k.id},'label',this.textContent)">${k.label}</div>
      <input class="kpi-input" value="${k.value}" style="color:${k.color}"
        onchange="updateKPI(${k.id},'value',this.value)"
        oninput="updateKPI(${k.id},'value',this.value)">
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
        <span class="kpi-trend ${trendClass}">${trendIcon} ${k.unit}</span>
        <select style="background:var(--surface2);border:1px solid var(--border);color:var(--text-muted);
          font-family:'DM Mono',monospace;font-size:10px;border-radius:5px;padding:2px 6px;cursor:pointer;outline:none"
          onchange="updateKPI(${k.id},'trend',this.value)">
          <option value="up"${k.trend === 'up' ? ' selected' : ''}>↑ Steigt</option>
          <option value="flat"${k.trend === 'flat' ? ' selected' : ''}>→ Stabil</option>
          <option value="down"${k.trend === 'down' ? ' selected' : ''}>↓ Fällt</option>
        </select>
      </div>
    `;
        grid.appendChild(card);
    });
}

function updateKPI(id, field, val) {
    const k = state.kpis.find(x => x.id === id);
    if (k) { k[field] = val.trim(); save(state); if (field === 'trend') renderKPIs(); }
}

// ─── SCORE ────────────────────────────────────────────────
function computeScore() {
    const total = state.goals1y.length || 1;
    const done  = state.goals1y.filter(g => g.done).length;
    const goalPct = Math.round(done / total * 100);

    const totalDots  = state.habits.reduce((a, h) => a + h.days.length, 0) || 1;
    const activeDots = state.habits.reduce((a, h) => a + h.days.filter(Boolean).length, 0);
    const habitPct   = Math.round(activeDots / totalDots * 100);

    const kpiOk  = state.kpis.filter(k => parseFloat(k.value) > 0).length;
    const kpiPct = Math.round(kpiOk / (state.kpis.length || 1) * 100);

    const visionText = document.getElementById('visionText').textContent.trim();
    const visionOk   = visionText.length > 40 && !visionText.startsWith('Wer bin ich') ? 100 : 20;

    const score = Math.round(goalPct * 0.3 + habitPct * 0.3 + kpiPct * 0.2 + visionOk * 0.2);

    document.getElementById('scoreVal').textContent = score;
    const circumference = 251.3;
    const offset = circumference - (score / 100) * circumference;
    document.getElementById('scoreRing').style.strokeDashoffset = offset;

    document.getElementById('sr-goals').textContent  = `${done}/${total} (${goalPct}%)`;
    document.getElementById('sr-habits').textContent = `${activeDots}/${totalDots} (${habitPct}%)`;
    document.getElementById('sr-kpi').textContent    = `${kpiOk}/${state.kpis.length} aktiv`;
    document.getElementById('sr-vision').textContent = visionOk === 100 ? '✓ Definiert' : '○ Offen';
}

// ─── PERSIST NOTES ────────────────────────────────────────
const noteEl = document.getElementById('lifeNote');
if (state.lifeNote) noteEl.value = state.lifeNote;
noteEl.addEventListener('input', () => { state.lifeNote = noteEl.value; save(state); });

// Vision text
const visionEl = document.getElementById('visionText');
if (state.visionText) visionEl.textContent = state.visionText;
visionEl.addEventListener('blur', () => { state.visionText = visionEl.textContent; save(state); computeScore(); });

// Focus word
const focusWordEl = document.getElementById('focusWord');
if (state.focusWord) focusWordEl.textContent = state.focusWord;
focusWordEl.addEventListener('blur', () => { state.focusWord = focusWordEl.textContent; save(state); });

// ─── INIT ─────────────────────────────────────────────────
renderGoals();
renderHabits();
renderKPIs();
computeScore();
