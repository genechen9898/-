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
  screen: 'home',        // home | consent | declined | warmup | unitSelect | quiz | continue | finish | personality
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
    case 'personality': view = renderPersonality(); break;
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
    wrap.appendChild(renderAnswerSummary());
    wrap.appendChild(renderSharedReflection());
    wrap.appendChild(el('button', {
      class: 'btn btn-primary full',
      onclick: () => { state.screen = 'personality'; render(); }
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
   完成後的本次作答摘要
   ------------------------------------------------------------
   只整理使用者實際選過的選項，不將選擇解讀成固定人格。
------------------------------------------------------------- */
function renderAnswerSummary() {
  const box = el('div', { class: 'analysis answer-summary' });
  const answered = QUESTIONS.filter(q => state.answers[q.id]);
  const answeredNormally = answered.filter(q => !state.answers[q.id].isDecline);
  const declined = answered.filter(q => state.answers[q.id].isDecline).length;

  box.appendChild(el('h3', {}, '本次作答摘要'));

  if (state.selectedUnits.length > 0) {
    box.appendChild(el('p', { class: 'sub' }, `你選擇體驗的單元：${state.selectedUnits.join('、')}`));
  }

  box.appendChild(el('p', { class: 'sub' },
    `共記錄 ${answered.length} 題，其中 ${answeredNormally.length} 題選擇了情境回應，${declined} 題選擇拒答或不想回答。`
  ));

  if (answeredNormally.length === 0) {
    box.appendChild(el('p', {}, '你這次沒有選擇任何情境回應，保留自己的感受與界線也是一種選擇。'));
    return box;
  }

  const part1 = answeredNormally.filter(q => q.part === 1);
  const part2 = answeredNormally.filter(q => q.part === 2);

  function appendPart(title, questions) {
    if (!questions.length) return;
    box.appendChild(el('h3', { class: 'summary-part-title' }, title));

    questions.forEach(q => {
      const answer = state.answers[q.id];
      const item = el('div', { class: 'summary-item' });
      item.appendChild(el('p', { class: 'summary-question' }, `${q.category}｜${q.title}`));
      item.appendChild(el('p', { class: 'summary-answer' }, `${answer.code}｜${answer.text}`));
      box.appendChild(item);
    });
  }

  appendPart('Part 1｜我的選擇', part1);
  appendPart('Part 2｜換位後的選擇', part2);

  if (part2.length > 0) {
    const changedCount = part2.filter(q => {
      const p1 = QUESTIONS.find(x => x.sourceId === q.sourceId.replace('-P2', '-P1'));
      return p1 && state.answers[p1.id] && state.answers[q.id].code !== state.answers[p1.id].code;
    }).length;

    box.appendChild(el('p', { class: 'sub summary-change' },
      `角色交換後，你有 ${changedCount} 題的選擇和 Part 1 不同。`
    ));
  }

  box.appendChild(el('p', { class: 'small' },
    '以上只是整理你在本次活動中的選擇，不代表你固定的個性，也沒有好壞之分。'
  ));

  return box;
}

/* ------------------------------------------------------------
   所有人一致看到的活動總結
------------------------------------------------------------- */
function renderSharedReflection() {
  const box = el('div', { class: 'analysis shared-reflection' });

  box.appendChild(el('h3', {}, '給你的活動總結'));
  box.appendChild(el('p', {}, '謝謝你完成這次情緒與人際互動探索。'));
  box.appendChild(el('p', {}, '每個情境都沒有唯一正確的答案。'));
  box.appendChild(el('p', {}, '有時候，我們會先保護自己；有時候，我們會先理解對方；也有時候，我們需要先讓自己冷靜一下。'));
  box.appendChild(el('p', {}, '下次在回應別人以前，可以試著：'));

  const steps = [
    '先放慢一下，不急著立刻回答。',
    '注意自己現在的感受和需要。',
    '想想看，如果我是對方，可能會有什麼感受？',
    '聽完對方的想法，再決定要怎麼回應。',
    '在照顧自己的同時，也尊重對方的感受與界線。'
  ];

  box.appendChild(el('ol', {}, steps.map(text => el('li', {}, text))));
  box.appendChild(el('p', {}, '同理心不代表一定要同意對方，而是願意先理解對方為什麼會這樣想。'));
  box.appendChild(el('p', {}, '你不需要每次都做出完美的回應，願意停下來想一想，本身就是一種練習。'));

  return box;
}

/* ------------------------------------------------------------
   7. 加碼探索：16 種互動風格與動物象徵
   ------------------------------------------------------------
   這不是正式 MBTI 測驗，只讓參與者自行選擇一個參考類型。
------------------------------------------------------------- */
const PERSONALITY_TYPES = [
  { code: 'INTJ', animal: '🦉 貓頭鷹', title: '分析觀察型', intro: '可能先觀察情況、找出原因，再決定如何回應。', items: ['可能先判斷對方是否在忙，不急著下結論。', '傾向找出問題核心，希望把事情釐清。', '可能用事實與邏輯減少雙方猜測。', '可能認為喜歡與交出隱私是兩回事。'] },
  { code: 'INTP', animal: '🐱 貓', title: '思考拆解型', intro: '可能把事情拆開分析，想了解背後原因與邏輯。', items: ['可能分析平常回覆狀況，思考今天為什麼不同。', '會先了解事情本身，想知道哪裡出了問題。', '可能追問誤會從哪裡開始。', '可能認為喜歡與證明是兩件事。'] },
  { code: 'ENTJ', animal: '🦁 獅子', title: '果斷處理型', intro: '可能重視效率與清楚界線，傾向直接面對問題。', items: ['可能先做自己的事，不讓訊息打亂節奏。', '傾向直接問清楚，盡快找到處理方式。', '可能直接說明事實，不喜歡一直猜測。', '可能清楚表達信任不是靠檢查手機建立的。'] },
  { code: 'ENTP', animal: '🦊 狐狸', title: '靈活辯證型', intro: '可能想到多種可能，透過討論重新理解事情。', items: ['可能想到很多原因，不急著認定答案。', '喜歡把問題拿出來討論，但也要留意語氣。', '可能想了解對方為何會這樣想。', '可能反問為什麼要用檢查來證明喜歡。'] },
  { code: 'INFJ', animal: '🦌 鹿', title: '深度理解型', intro: '可能先思考彼此感受，再決定怎麼回應。', items: ['可能反覆想是不是自己做錯，或對方發生了什麼。', '可能先整理情緒，再理解對方感受。', '會想知道對方為何形成這個理解。', '可能在乎對方，也希望保有自己的隱私。'] },
  { code: 'INFP', animal: '🦦 水獺', title: '感受連結型', intro: '可能重視關係中的感受，也需要時間整理情緒。', items: ['可能因關係變化而難過，開始懷疑對方的想法。', '很在意彼此感受，可能先消化再溝通。', '可能因本意沒有被理解而受傷。', '可能覺得真正的喜歡不需要一直證明。'] },
  { code: 'ENFJ', animal: '🐬 海豚', title: '關係修復型', intro: '可能主動關心對方，也重視把關係帶回理解。', items: ['可能先關心對方是不是發生了什麼。', '傾向主動溝通，希望彼此理解並修復。', '可能先理解對方，再說明自己的想法。', '願意表達感情，也重視慢慢建立信任。'] },
  { code: 'ENFP', animal: '🐕 黃金獵犬', title: '熱情連結型', intro: '可能很快注意到關係變化，希望彼此重新連結。', items: ['可能想到很多可能，也猶豫要不要主動關心。', '情緒過後，通常仍希望修復關係。', '可能想知道對方的想法，重新建立連結。', '可能表達在乎，也希望對方願意相信自己。'] },
  { code: 'ISTJ', animal: '🐘 大象', title: '穩定務實型', intro: '可能依照實際情況判斷，不希望事情停留在猜測。', items: ['可能先認為對方只是忙，選擇再等等。', '想把具體是哪件事說清楚。', '可能直接說明自己沒有那個意思。', '可能覺得喜歡不需要靠檢查手機證明。'] },
  { code: 'ISFJ', animal: '🐼 貓熊', title: '細膩照顧型', intro: '可能很注意對方感受，也容易回頭檢查自己是否做錯。', items: ['可能先想是不是自己讓對方不開心。', '可能反覆想自己是否說錯話，希望趕快和好。', '可能主動解釋，不希望朋友因誤會難過。', '可能為讓對方安心而配合，也要留意自己的壓力。'] },
  { code: 'ESTJ', animal: '🐯 老虎', title: '明確行動型', intro: '可能希望事情快點說清楚、做決定。', items: ['可能先做自己的事，有需要再直接問。', '想知道怎麼解決，不喜歡問題拖太久。', '可能直接把事情經過說清楚。', '可能表達在乎，但不接受不舒服的要求。'] },
  { code: 'ESFJ', animal: '🐝 蜜蜂', title: '關係照顧型', intro: '可能很在意氣氛與彼此感受，希望關係恢復平穩。', items: ['可能擔心對方是不是不開心，想主動關心。', '希望大家把話說開，讓關係回到平穩。', '可能先顧慮對方，再說明自己。', '可能願意給安全感，也要確認自己是否有壓力。'] },
  { code: 'ISTP', animal: '🐺 狼', title: '冷靜自主型', intro: '可能先保留自己的空間，等需要時再直接處理。', items: ['可能先認為對方在忙，晚一點再看。', '傾向直接說有問題就講，不喜歡一直猜。', '可能直接說明發生什麼，不繞太多圈。', '可能清楚表達喜歡與查看手機是兩回事。'] },
  { code: 'ISFP', animal: '🐿️ 松鼠', title: '溫和感受型', intro: '可能先把感受放在心裡，等情緒過後再決定要不要說。', items: ['表面可能裝沒事，但心裡仍會有些失落。', '可能先離開現場，等平靜後再說。', '可能因本意被誤解而感到受傷。', '可能不想傷害對方而配合，也要照顧自己的感受。'] },
  { code: 'ESTP', animal: '🐆 獵豹', title: '直接反應型', intro: '可能重視當下感受，傾向直接問、直接處理。', items: ['可能先做自己的事，晚點直接問清楚。', '傾向直接問到底怎麼了。', '可能很快解釋自己的想法。', '可能表達在乎，也保留個人空間。'] },
  { code: 'ESFP', animal: '🦚 孔雀', title: '氣氛感受型', intro: '可能很快注意到氣氛與他人反應，希望關係不要留下尷尬。', items: ['可能擔心對方是不是怎麼了，想主動問問看。', '很在意朋友是否還在生氣，希望快點和好。', '可能很在意別人怎麼看自己，急著解釋。', '可能為讓對方安心而配合，也可以確認自己的意願。'] }
];

function renderPersonality() {
  const wrap = el('div', { class: 'screen' });
  wrap.appendChild(el('button', {
    class: 'back-link',
    onclick: () => { state.screen = 'finish'; render(); }
  }, '← 回到完成頁'));

  wrap.appendChild(el('div', { class: 'hero' }, [
    el('div', { class: 'hero-emoji' }, '🧭'),
    el('h2', { class: 'page-title' }, '原來我是這樣的人'),
    el('p', { class: 'lead' }, '16 種互動風格與動物象徵'),
    el('div', { class: 'consent-box' }, [
      el('p', {}, '這不是正式 MBTI 測驗，也不是心理診斷或人格判定。'),
      el('p', {}, '請選一個你曾經測過，或覺得比較接近自己的類型，看看它在前面人際情境中可能呈現的互動風格。'),
      el('p', {}, '沒有哪一型比較好，也不代表你每次都會有相同反應。')
    ])
  ]));

  wrap.appendChild(el('h3', {}, '請選擇一個類型'));
  wrap.appendChild(el('p', { class: 'sub' }, '這是自願的加碼探索，不想選也可以直接結束。'));

  const grid = el('div', { class: 'mood-grid' });
  const result = el('div', { class: 'analysis', style: 'display:none' });

  PERSONALITY_TYPES.forEach(type => {
    const card = el('button', {
      class: 'mood-card',
      onclick: () => {
        grid.querySelectorAll('.mood-card').forEach(x => x.classList.remove('selected'));
        card.classList.add('selected');
        result.style.display = 'block';
        result.innerHTML = '';
        result.appendChild(el('div', { class: 'analysis-head' }, [
          el('span', { class: 'analysis-badge' }, `${type.animal}`),
          el('span', { class: 'analysis-choice' }, `${type.code}｜${type.title}`)
        ]));
        result.appendChild(el('p', {}, type.intro));
        const labels = ['喜歡的人沒有馬上回訊息', '跟朋友出現誤會或衝突', '站到對方的位置思考', '被要求證明自己在乎'];
        type.items.forEach((text, i) => {
          result.appendChild(layer(`${labels[i]}：`, [el('p', {}, text)]));
        });
        result.appendChild(el('div', { class: 'quote' }, [
          el('span', {}, '💭'),
          el('p', {}, '這只是本次活動提供的一種觀察角度。你可以保留符合自己的部分，也可以對不符合的地方保持好奇。')
        ]));
        result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, [
      el('span', { class: 'mood-emoji' }, type.animal.split(' ')[0]),
      el('span', { class: 'mood-text' }, `${type.code}｜${type.title}`),
      el('span', { class: 'sub' }, type.animal.slice(type.animal.indexOf(' ') + 1))
    ]);
    grid.appendChild(card);
  });

  wrap.appendChild(grid);
  wrap.appendChild(result);
  wrap.appendChild(el('button', {
    class: 'btn btn-ghost full',
    onclick: resetAll
  }, '結束並回到首頁'));

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
    payload[q.id] = a ? (a.isDecline ? `E｜${DECLINE_OPTION.text}` : `${a.code}｜${a.text}`) : `E｜${DECLINE_OPTION.text}`;
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
