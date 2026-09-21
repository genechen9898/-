/* ============================================================
   青少年情緒 × 人際互動探索問卷 — 主程式
   ============================================================ */

/* ------------------------------------------------------------
   ⚙️ 設定區：請把你的 Google Apps Script Web App 網址貼在這裡
------------------------------------------------------------- */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwvSEREpRzyjY7oICWKZHinrk29ZGXgXuYdfQxXF7rnfOMwb1NZFe60Vl4WcAyBNkC7/exec';

/* ------------------------------------------------------------
   狀態
------------------------------------------------------------- */
const state = {
  screen: 'home',        // home | consent | declined | warmup | quiz | finish
  consent: null,         // '同意' | '不同意'
  mood: null,
  index: 0,              // 目前題目 index (0-21)
  answers: {},           // { Q01: {code, text, reactionType, isDecline} }
  showAnalysis: false,   // 目前這題是否已顯示解析
  feedback: '',
  feedbackDeclined: false,
  sending: false,
  sent: false,
  errorMsg: null,
  responseId: null
};

function makeResponseId() {
  const rnd = () => Math.random().toString(36).slice(2, 8);
  return 'anon-' + rnd() + rnd();
}

const root = document.getElementById('app');

/* ------------------------------------------------------------
   小工具
------------------------------------------------------------- */
function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c === null || c === undefined) return;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return n;
}

function render() {
  root.innerHTML = '';
  let view;
  switch (state.screen) {
    case 'home': view = renderHome(); break;
    case 'consent': view = renderConsent(); break;
    case 'declined': view = renderDeclined(); break;
    case 'warmup': view = renderWarmup(); break;
    case 'quiz': view = renderQuiz(); break;
    case 'finish': view = renderFinish(); break;
    default: view = renderHome();
  }
  root.appendChild(view);
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------
   1. 首頁
------------------------------------------------------------- */
function renderHome() {
  const wrap = el('div', { class: 'screen home' });
  wrap.appendChild(el('div', { class: 'hero' }, [
    el('div', { class: 'hero-emoji' }, '🫧'),
    el('h1', {}, '青少年情緒 × 人際互動探索'),
    el('p', { class: 'hero-sub' }, '從日常情境裡，看看自己的第一反應，也想想不同的回應可能帶來什麼感受。'),
    el('p', { class: 'hero-note' }, '沒有標準答案，也不是心理測驗。任何一題都可以選擇「拒答／不想回答」。')
  ]));

  wrap.appendChild(el('div', { class: 'btn-col' }, [
    el('button', { class: 'btn btn-primary', onclick: () => { state.screen = 'consent'; render(); } }, '開始體驗'),
    el('button', { class: 'btn btn-ghost', onclick: () => { state.screen = 'consent'; render(); } }, '活動說明與同意聲明')
  ]));

  wrap.appendChild(el('p', { class: 'foot-note' }, '本活動不蒐集姓名、電話、Email 或其他可辨識身分的資料。'));
  return wrap;
}

/* ------------------------------------------------------------
   2. 同意聲明頁
------------------------------------------------------------- */
function renderConsent() {
  const wrap = el('div', { class: 'screen' });
  wrap.appendChild(el('button', { class: 'back-link', onclick: () => { state.screen = 'home'; render(); } }, '← 回首頁'));
  wrap.appendChild(el('h2', { class: 'page-title' }, '活動說明與同意聲明'));

  const box = el('div', { class: 'consent-box' });
  [
    '這是一份「青少年情緒 × 人際互動探索」互動問卷，目的是讓參與者從日常情境中觀察自己的第一反應，並思考不同回應可能帶來的感受。',
    '本活動沒有標準答案，也不是心理測驗、人格診斷或心理治療。網站中的解析僅提供情境反思參考，不代表對參與者個人的判斷。',
    '參與方式完全出於自願。你可以選擇「拒答／不想回答」、跳過任何題目，或在任何時候停止使用。你不需要分享自己的真實經歷，也不需要向工作人員說明原因。',
    '本問卷不蒐集姓名、電話、Email 或其他可直接辨識身分的資料。填答資料將以匿名形式記錄，僅供活動統計、檢討與教育用途使用，不公開個別作答內容。',
    '如果題目讓你感到不舒服，請停止作答，並向現場工作人員、師長或信任的大人尋求協助。若遇到立即性的安全危險，請優先尋求現場大人或相關專業協助。'
  ].forEach(p => box.appendChild(el('p', {}, p)));
  wrap.appendChild(box);

  wrap.appendChild(el('p', { class: 'consent-ask' }, '請確認你已閱讀並理解以上內容：'));

  const agreeWrap = el('label', { class: 'check-row' + (state.consent === '同意' ? ' checked' : '') });
  const agreeBox = el('input', { type: 'checkbox', id: 'agree-check' });
  agreeBox.checked = state.consent === '同意';
  agreeBox.addEventListener('change', () => {
    state.consent = agreeBox.checked ? '同意' : null;
    render();
  });
  agreeWrap.appendChild(agreeBox);
  agreeWrap.appendChild(el('span', {}, '我已閱讀以上說明，並願意自願參加本活動'));
  wrap.appendChild(agreeWrap);

  const declineWrap = el('label', { class: 'check-row' });
  const declineBox = el('input', { type: 'checkbox' });
  declineBox.checked = false;
  declineBox.addEventListener('change', () => {
    if (declineBox.checked) {
      state.consent = '不同意';
      state.screen = 'declined';
      render();
    }
  });
  declineWrap.appendChild(declineBox);
  declineWrap.appendChild(el('span', {}, '我不同意參加'));
  wrap.appendChild(declineWrap);

  const startBtn = el('button', {
    class: 'btn btn-primary full',
    onclick: () => { state.screen = 'warmup'; render(); }
  }, '開始問卷');
  startBtn.disabled = state.consent !== '同意';
  wrap.appendChild(startBtn);

  if (state.consent !== '同意') {
    wrap.appendChild(el('p', { class: 'hint' }, '勾選同意後，才能開始問卷。'));
  }
  return wrap;
}

function renderDeclined() {
  const wrap = el('div', { class: 'screen center-screen' });
  wrap.appendChild(el('div', { class: 'hero-emoji' }, '🌱'));
  wrap.appendChild(el('h2', { class: 'page-title' }, '謝謝你閱讀活動說明'));
  wrap.appendChild(el('p', { class: 'lead' }, '你可以隨時離開本頁，不需要提供任何資料。'));
  wrap.appendChild(el('button', {
    class: 'btn btn-ghost',
    onclick: () => { state.consent = null; state.screen = 'home'; render(); }
  }, '回到首頁'));
  return wrap;
}

/* ------------------------------------------------------------
   3. 暖身頁
------------------------------------------------------------- */
function renderWarmup() {
  const wrap = el('div', { class: 'screen' });
  wrap.appendChild(el('button', { class: 'back-link', onclick: () => { state.screen = 'consent'; render(); } }, '← 上一步'));
  wrap.appendChild(el('h2', { class: 'page-title' }, '先看看現在的自己'));
  wrap.appendChild(el('p', { class: 'lead' }, '在開始之前，你現在的心情比較接近哪一個？'));

  const grid = el('div', { class: 'mood-grid' });
  MOOD_OPTIONS.forEach(m => {
    const btn = el('button', {
      class: 'mood-card' + (state.mood === m.value ? ' selected' : ''),
      'aria-pressed': state.mood === m.value ? 'true' : 'false',
      onclick: () => { state.mood = m.value; render(); }
    }, [
      el('span', { class: 'mood-emoji' }, m.emoji),
      el('span', { class: 'mood-text' }, m.value)
    ]);
    grid.appendChild(btn);
  });
  wrap.appendChild(grid);

  const next = el('button', {
    class: 'btn btn-primary full',
    onclick: () => { state.screen = 'quiz'; state.index = 0; state.showAnalysis = !!state.answers['Q01']; render(); }
  }, '進入 Part 1');
  next.disabled = !state.mood;
  wrap.appendChild(next);
  if (!state.mood) wrap.appendChild(el('p', { class: 'hint' }, '請先選擇一個選項（也可以選「拒答／不想回答」）。'));
  return wrap;
}

/* ------------------------------------------------------------
   4-5. 題目頁（Part 1 / Part 2 共用）
------------------------------------------------------------- */
function renderQuiz() {
  const q = QUESTIONS[state.index];
  const answer = state.answers[q.id];
  const wrap = el('div', { class: 'screen' });

  // 進度
  const pct = Math.round(((state.index + 1) / QUESTIONS.length) * 100);
  wrap.appendChild(el('div', { class: 'progress-head' }, [
    el('span', { class: 'part-chip' }, q.part === 1 ? 'Part 1' : 'Part 2'),
    el('span', { class: 'progress-num' }, `第 ${state.index + 1} 題／共 ${QUESTIONS.length} 題`)
  ]));
  wrap.appendChild(el('div', { class: 'bar-track' }, [el('div', { class: 'bar-fill', style: `width:${pct}%` })]));

  wrap.appendChild(el('h2', { class: 'part-title' }, q.part === 1 ? '如果是你，你會怎麼做？' : '換作是你，你希望別人怎麼做？'));
  wrap.appendChild(el('div', { class: 'q-card' }, [
    el('div', { class: 'q-cat' }, `${q.category}｜${q.title}`),
    el('p', { class: 'q-scenario' }, q.scenario)
  ]));

  // 選項
  const opts = el('div', { class: 'opts' });
  q.options.forEach(o => {
    const sel = answer && answer.code === o.code;
    const card = el('button', {
      class: 'opt' + (sel ? ' selected' : '') + (o.isDecline ? ' opt-decline' : ''),
      'aria-pressed': sel ? 'true' : 'false',
      onclick: () => chooseOption(q, o)
    }, [
      el('span', { class: 'opt-code' }, o.code),
      el('span', { class: 'opt-text' }, o.text)
    ]);
    opts.appendChild(card);
  });
  wrap.appendChild(opts);

  // 解析
  if (answer && state.showAnalysis) {
    wrap.appendChild(renderAnalysis(q, answer));
  }

  // 導覽
  const nav = el('div', { class: 'nav' });
  const prev = el('button', { class: 'btn btn-ghost', onclick: goPrev }, '← 上一題');
  const isLast = state.index === QUESTIONS.length - 1;
  const next = el('button', { class: 'btn btn-primary', onclick: goNext }, isLast ? '完成作答 →' : '下一題 →');
  next.disabled = !answer;
  nav.appendChild(prev);
  nav.appendChild(next);
  wrap.appendChild(nav);

  if (!answer) wrap.appendChild(el('p', { class: 'hint' }, '請選擇一個選項。如果不想回答，可以選 E。'));
  return wrap;
}

function chooseOption(q, o) {
  state.answers[q.id] = {
    code: o.code,
    text: o.text,
    reactionType: o.reactionType || null,
    isDecline: !!o.isDecline
  };
  state.showAnalysis = true;
  render();
  const box = document.querySelector('.analysis');
  if (box) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goPrev() {
  if (state.index > 0) {
    state.index--;
    state.showAnalysis = !!state.answers[QUESTIONS[state.index].id];
    render();
  } else {
    state.screen = 'warmup';
    render();
  }
}

function goNext() {
  const q = QUESTIONS[state.index];
  if (!state.answers[q.id]) return;
  if (state.index === QUESTIONS.length - 1) {
    state.screen = 'finish';
    render();
    return;
  }
  state.index++;
  state.showAnalysis = !!state.answers[QUESTIONS[state.index].id];
  render();
}

/* ------------------------------------------------------------
   四層解析
------------------------------------------------------------- */
function renderAnalysis(q, answer) {
  const box = el('div', { class: 'analysis' });

  // 拒答：不做任何分析
  if (answer.isDecline) {
    box.appendChild(el('div', { class: 'decline-note' }, [
      el('span', { class: 'decline-icon' }, '🤍'),
      el('p', {}, DECLINE_ANALYSIS_TEXT)
    ]));
    return box;
  }

  const tpl = CATEGORY_TEMPLATES[REACTION_CATEGORY_MAP[answer.reactionType]] || CATEGORY_TEMPLATES.SEEK_UNDERSTANDING;
  const custom = q.customSelf && q.customSelf[answer.code];

  box.appendChild(el('div', { class: 'analysis-head' }, [
    el('span', { class: 'analysis-badge' }, '情境反思'),
    el('span', { class: 'analysis-choice' }, `你選了 ${answer.code}`)
  ]));

  box.appendChild(layer('第一層｜我的選擇可能代表什麼？', [
    el('span', { class: 'tendency' }, tpl.label),
    el('p', {}, custom ? custom : tpl.self)
  ]));

  box.appendChild(layer('第二層｜對方可能感受到什麼？', [el('p', {}, tpl.other)]));

  box.appendChild(layer('第三層｜還有沒有其他說法？', [
    el('p', { class: 'sub' }, '以下是可以參考的說法之一，不是唯一正確答案：'),
    el('ul', {}, tpl.alt.map(a => el('li', {}, `「${a}」`)))
  ]));

  box.appendChild(layer('第四層｜我想成為怎樣的人？', [
    el('p', { class: 'sub' }, '如果重新來一次，我希望自己怎麼回？選擇權在你自己：'),
    el('ul', {}, LAYER_FOUR_PROMPTS.map(p => el('li', {}, p)))
  ]));

  box.appendChild(el('div', { class: 'quote' }, [
    el('span', {}, '💭'),
    el('p', {}, q.reflection)
  ]));

  if (q.part === 2) {
    box.appendChild(layer('角色交換，也可以想想看', [
      el('ul', {}, ROLE_SWAP_PROMPTS.map(p => el('li', {}, p)))
    ]));
  }

  if (q.safetyFlag) {
    box.appendChild(el('div', { class: 'safety' }, [
      el('span', {}, '🛟'),
      el('p', {}, SAFETY_NOTICE)
    ]));
  }
  return box;
}

function layer(title, children) {
  const b = el('div', { class: 'layer' });
  b.appendChild(el('h3', {}, title));
  children.forEach(c => b.appendChild(c));
  return b;
}

/* ------------------------------------------------------------
   6. 完成頁
------------------------------------------------------------- */
function renderFinish() {
  const wrap = el('div', { class: 'screen' });

  if (state.sent) {
    wrap.className = 'screen center-screen';
    wrap.appendChild(el('div', { class: 'hero-emoji' }, '🌤️'));
    wrap.appendChild(el('h2', { class: 'page-title' }, '謝謝你的參與'));
    wrap.appendChild(el('div', { class: 'sent-ok' }, '✓ 資料已成功送出'));
    wrap.appendChild(el('p', { class: 'lead' }, '你的選擇不代表你是怎樣的人，只代表你在某個情境下可能出現的一種反應。'));
    wrap.appendChild(el('button', { class: 'btn btn-ghost', onclick: resetAll }, '換下一位參與者'));
    return wrap;
  }

  wrap.appendChild(el('button', { class: 'back-link', onclick: () => { state.screen = 'quiz'; state.index = QUESTIONS.length - 1; state.showAnalysis = true; render(); } }, '← 回上一題'));
  wrap.appendChild(el('h2', { class: 'page-title' }, '最後一個小問題'));
  wrap.appendChild(el('p', { class: 'lead' }, '今天有沒有哪個想法讓你感到意外？'));
  wrap.appendChild(el('p', { class: 'sub' }, '這一題可以留白，也可以選擇不回答。'));

  const ta = el('textarea', {
    class: 'feedback-input',
    rows: '4',
    placeholder: '想到什麼都可以寫，也可以空白。',
    maxlength: '500'
  });
  ta.value = state.feedback;
  ta.disabled = state.feedbackDeclined;
  ta.addEventListener('input', () => { state.feedback = ta.value; });
  wrap.appendChild(ta);

  const noAnswer = el('label', { class: 'check-row' + (state.feedbackDeclined ? ' checked' : '') });
  const cb = el('input', { type: 'checkbox' });
  cb.checked = state.feedbackDeclined;
  cb.addEventListener('change', () => {
    state.feedbackDeclined = cb.checked;
    if (cb.checked) state.feedback = '';
    render();
  });
  noAnswer.appendChild(cb);
  noAnswer.appendChild(el('span', {}, '我不想回答'));
  wrap.appendChild(noAnswer);

  if (state.errorMsg) {
    wrap.appendChild(el('div', { class: 'error-box' }, state.errorMsg));
  }

  const submit = el('button', {
    class: 'btn btn-primary full',
    onclick: submitAll
  }, state.sending ? '' : '送出並完成');
  if (state.sending) {
    submit.appendChild(el('span', { class: 'spinner' }));
    submit.appendChild(el('span', {}, '送出中，請稍候…'));
  }
  submit.disabled = state.sending;
  wrap.appendChild(submit);

  wrap.appendChild(el('p', { class: 'foot-note' }, '送出的資料為匿名紀錄，不包含任何可辨識身分的資訊。'));
  return wrap;
}

/* ------------------------------------------------------------
   送出
------------------------------------------------------------- */
function buildPayload() {
  if (!state.responseId) state.responseId = makeResponseId();
  const payload = {
    response_id: state.responseId,
    submitted_at: new Date().toISOString(),
    consent: state.consent || '',
    mood: state.mood || '',
    final_feedback: state.feedbackDeclined ? '我不想回答' : (state.feedback || '').trim(),
    user_agent_optional: navigator.userAgent || ''
  };
  QUESTIONS.forEach(q => {
    const a = state.answers[q.id];
    payload[q.id] = a ? (a.isDecline ? '拒答／不想回答' : `${a.code}｜${a.text}`) : '';
  });
  return payload;
}

function submitAll() {
  if (state.sending || state.sent) return;   // 避免重複送出
  state.sending = true;
  state.errorMsg = null;
  render();

  const payload = buildPayload();

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    // 用 text/plain 避免瀏覽器對 Apps Script 發出 CORS 預檢請求
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json().catch(() => ({ ok: true }));
    })
    .then(data => {
      if (data && data.ok === false) throw new Error(data.error || 'server');
      state.sending = false;
      state.sent = true;
      render();
    })
    .catch(() => {
      state.sending = false;
      state.errorMsg = '目前網路不穩，資料可能尚未成功送出，請通知現場工作人員。';
      render();
    });
}

function resetAll() {
  state.screen = 'home';
  state.consent = null;
  state.mood = null;
  state.index = 0;
  state.answers = {};
  state.showAnalysis = false;
  state.feedback = '';
  state.feedbackDeclined = false;
  state.sending = false;
  state.sent = false;
  state.errorMsg = null;
  state.responseId = null;
  render();
}

/* ------------------------------------------------------------
   鍵盤輔助：1-5 選 A-E，Enter 下一題
------------------------------------------------------------- */
document.addEventListener('keydown', e => {
  if (state.screen !== 'quiz') return;
  const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
  const q = QUESTIONS[state.index];
  if (map[e.key]) {
    const o = q.options.find(x => x.code === map[e.key]);
    if (o) chooseOption(q, o);
  } else if (e.key === 'Enter') {
    if (state.answers[q.id]) goNext();
  }
});

render();
