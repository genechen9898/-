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
  screen: 'home',        // home | consent | declined | warmup | unitSelect | quiz | continue | finish
  consent: null,         // '同意' | '不同意'
  mood: null,
  index: 0,              // 目前目前單元題目 index
  questionIds: [],       // 依使用者選擇的單元產生題目順序
  selectedUnits: [],     // 使用者選擇的單元
  completedUnits: [],    // 已完成的單元
  lastCompletedUnit: null,
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
    case 'unitSelect': view = renderUnitSelect(); break;
    case 'quiz': view = renderQuiz(); break;
    case 'continue': view = renderContinue(); break;
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
    onclick: () => { state.screen = 'unitSelect'; render(); }
  }, '選擇想體驗的單元');
  next.disabled = !state.mood;
  wrap.appendChild(next);
  if (!state.mood) wrap.appendChild(el('p', { class: 'hint' }, '請先選擇一個選項（也可以選「拒答／不想回答」）。'));
  return wrap;
}

/* ------------------------------------------------------------
   4. 單元選擇頁：可複選
------------------------------------------------------------- */
const UNIT_OPTIONS = [
  { key: '感情', label: '感情', emoji: '💛' },
  { key: '家庭', label: '家庭', emoji: '🏠' },
  { key: '同儕', label: '同儕', emoji: '🤝' },
  { key: '學業', label: '學業', emoji: '📚' }
];

function renderUnitSelect() {
  const wrap = el('div', { class: 'screen' });
  wrap.appendChild(el('button', { class: 'back-link', onclick: () => { state.screen = 'warmup'; render(); } }, '← 上一步'));
  wrap.appendChild(el('h2', { class: 'page-title' }, '選擇想體驗的單元'));
  wrap.appendChild(el('p', { class: 'lead' }, '可以複選。每個單元完成後，還可以決定要不要繼續。'));

  const grid = el('div', { class: 'mood-grid' });
  UNIT_OPTIONS.forEach(unit => {
    const selected = state.selectedUnits.includes(unit.key);
    const completed = state.completedUnits.includes(unit.key);
    const card = el('button', {
      class: 'mood-card' + (selected ? ' selected' : ''),
      'aria-pressed': selected ? 'true' : 'false',
      onclick: () => {
        if (completed) return;
        if (state.selectedUnits.includes(unit.key)) {
          state.selectedUnits = state.selectedUnits.filter(x => x !== unit.key);
        } else {
          state.selectedUnits = [...state.selectedUnits, unit.key];
        }
        render();
      }
    }, [
      el('span', { class: 'mood-emoji' }, unit.emoji),
      el('span', { class: 'mood-text' }, completed ? `${unit.label}（已完成）` : unit.label)
    ]);
    if (completed) card.disabled = true;
    grid.appendChild(card);
  });
  wrap.appendChild(grid);

  const start = el('button', {
    class: 'btn btn-primary full',
    onclick: startSelectedUnits
  }, state.completedUnits.length ? '開始其他單元' : '開始體驗');
  start.disabled = !state.selectedUnits.some(x => !state.completedUnits.includes(x));
  wrap.appendChild(start);
  if (!state.selectedUnits.some(x => !state.completedUnits.includes(x))) {
    wrap.appendChild(el('p', { class: 'hint' }, '請至少選擇一個尚未完成的單元。'));
  }
  return wrap;
}

function startSelectedUnits() {
  const units = state.selectedUnits.filter(x => !state.completedUnits.includes(x));
  state.questionIds = units.flatMap(unit => QUESTIONS
    .filter(q => q.category === unit)
    .sort((a, b) => a.part - b.part)
    .map(q => q.id));
  state.index = 0;
  state.showAnalysis = !!state.answers[state.questionIds[0]];
  state.screen = 'quiz';
  render();
}

function currentQuestion() {
  return QUESTIONS.find(q => q.id === state.questionIds[state.index]);
}

function isUnitEnd() {
  const q = currentQuestion();
  const next = QUESTIONS.find(x => x.id === state.questionIds[state.index + 1]);
  return !next || next.category !== q.category;
}

function renderContinue() {
  const wrap = el('div', { class: 'screen center-screen' });
  wrap.appendChild(el('div', { class: 'hero-emoji' }, '🌱'));
  wrap.appendChild(el('h2', { class: 'page-title' }, `${state.lastCompletedUnit}單元完成`));
  wrap.appendChild(el('p', { class: 'lead' }, '你想繼續體驗其他單元嗎？'));

  const nextExists = state.index + 1 < state.questionIds.length;
  if (nextExists) {
    wrap.appendChild(el('button', {
      class: 'btn btn-primary full',
      onclick: () => { state.index++; state.showAnalysis = !!state.answers[state.questionIds[state.index]]; state.screen = 'quiz'; render(); }
    }, '繼續下一個已選單元'));
  }

  wrap.appendChild(el('button', {
    class: 'btn btn-ghost full',
    onclick: () => { state.screen = 'finish'; render(); }
  }, '不要繼續，直接送出'));

  wrap.appendChild(el('button', {
    class: 'btn btn-ghost full',
    onclick: () => { state.screen = 'unitSelect'; render(); }
  }, '選擇其他單元'));
  return wrap;
}

/* ------------------------------------------------------------
   4-5. 題目頁（Part 1 / Part 2 共用）
------------------------------------------------------------- */
function renderQuiz() {
  const q = currentQuestion();
  const answer = state.answers[q.id];
  const wrap = el('div', { class: 'screen' });

  // 進度
  const pct = Math.round(((state.index + 1) / state.questionIds.length) * 100);
  wrap.appendChild(el('div', { class: 'progress-head' }, [
    el('span', { class: 'part-chip' }, q.part === 1 ? 'Part 1' : 'Part 2'),
    el('span', { class: 'progress-num' }, `第 ${state.index + 1} 題／共 ${state.questionIds.length} 題`)
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
    state.showAnalysis = !!state.answers[state.questionIds[state.index]];
    render();
  } else {
    state.screen = 'unitSelect';
    render();
  }
}

function goNext() {
  const q = currentQuestion();
  if (!state.answers[q.id]) return;
  if (isUnitEnd()) {
    if (!state.completedUnits.includes(q.category)) state.completedUnits.push(q.category);
    state.lastCompletedUnit = q.category;
    state.screen = 'continue';
    render();
    return;
  }
  state.index++;
  state.showAnalysis = !!state.answers[state.questionIds[state.index]];
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

  // Part 2 是反思，不重複 Part 1 的四層解析，只顯示前後答案與一段短提醒。
  if (q.part === 2) {
    const part1 = QUESTIONS.find(x => x.sourceId === q.sourceId.replace('-P2', '-P1'));
    const part1Answer = part1 ? state.answers[part1.id] : null;
    const changed = part1Answer && part1Answer.code !== answer.code;
    box.appendChild(el('div', { class: 'analysis-head' }, [
      el('span', { class: 'analysis-badge' }, '角色反思'),
      el('span', { class: 'analysis-choice' }, `你選了 ${answer.code}`)
    ]));
    if (part1Answer) {
      box.appendChild(layer('回頭看看 Part 1', [
        el('p', {}, `Part 1 你選的是：${part1Answer.code}｜${part1Answer.text}`),
        el('p', { class: 'sub' }, changed ? '換個角色後，你的選擇出現變化。這可能代表你注意到不同位置的感受。' : '換個角色後，你的選擇沒有改變。你在兩個位置看見了相近的感受。')
      ]));
    }
    box.appendChild(layer('這次反思可以帶走什麼？', [
      el('p', {}, shortText(q.reflection, 150))
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
    el('p', {}, shortText(custom ? custom : tpl.self, 120))
  ]));

  box.appendChild(layer('第二層｜對方可能感受到什麼？', [el('p', {}, shortText(tpl.other, 100))]));

  box.appendChild(layer('第三層｜還有沒有其他說法？', [
    el('p', { class: 'sub' }, `例如：「${shortText(tpl.alt[0], 70)}」`)
  ]));

  box.appendChild(layer('第四層｜我想成為怎樣的人？', [
    el('p', { class: 'sub' }, '如果重新來一次，我希望自己怎麼回？')
  ]));

  box.appendChild(el('div', { class: 'quote' }, [
    el('span', {}, '💭'),
    el('p', {}, shortText(q.reflection, 150))
  ]));

  if (q.safetyFlag) {
    box.appendChild(el('div', { class: 'safety' }, [
      el('span', {}, '🛟'),
      el('p', {}, SAFETY_NOTICE)
    ]));
  }
  return box;
}

function shortText(text, max = 120) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  return value.length > max ? value.slice(0, max) + '…' : value;
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
    wrap.appendChild(el('a', {
      class: 'btn btn-primary full',
      href: 'mbti.html'
    }, '加碼探索：看看我的互動風格'));
    wrap.appendChild(el('p', { class: 'foot-note' }, '這是自願參加的趣味探索，不是正式 MBTI 測驗，也不會影響剛才的問卷。'));
    wrap.appendChild(el('button', { class: 'btn btn-ghost', onclick: resetAll }, '換下一位參與者'));
    return wrap;
  }

  wrap.appendChild(el('button', { class: 'back-link', onclick: () => { state.screen = 'quiz'; state.index = state.questionIds.length - 1; state.showAnalysis = true; render(); } }, '← 回上一題'));
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
    selected_units: state.selectedUnits.join('、'),
    final_feedback: state.feedbackDeclined ? '我不想回答' : (state.feedback || '').trim(),
    user_agent_optional: navigator.userAgent || ''
  };
  QUESTIONS.forEach(q => {
    const a = state.answers[q.id];
    // 未選到的單元或跳過的題目，一律記錄為拒答，避免試算表留下空白。
    payload[q.id] = a ? (a.isDecline ? 'E｜拒答／不想回答' : `${a.code}｜${a.text}`) : 'E｜拒答／不想回答';
    if (q.part === 2) {
      const p1 = QUESTIONS.find(x => x.sourceId === q.sourceId.replace('-P2', '-P1'));
      const p1Answer = p1 ? state.answers[p1.id] : null;
      payload[`part1_for_${q.id}`] = p1Answer ? p1Answer.code : 'E';
      payload[`changed_${q.id}`] = p1Answer && a ? (p1Answer.code !== a.code ? '是' : '否') : '未完成';
    }
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
  state.questionIds = [];
  state.selectedUnits = [];
  state.completedUnits = [];
  state.lastCompletedUnit = null;
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
  const q = currentQuestion();
  if (map[e.key]) {
    const o = q.options.find(x => x.code === map[e.key]);
    if (o) chooseOption(q, o);
  } else if (e.key === 'Enter') {
    if (state.answers[q.id]) goNext();
  }
});

render();
