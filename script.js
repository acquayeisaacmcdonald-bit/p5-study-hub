// ===================================================
// P5 STUDY HUB — APP LOGIC
// ===================================================

// ---------- CONFIG ----------
const STORAGE_KEYS = {
  theme: "p5hub.theme",
  progress: "p5hub.progress",
  history: "p5hub.history",
  pace: "p5hub.pace",
  typing: "p5hub.typing"
};

const THEMES = [
  { id: "classic", name: "Classic",   colors: ["#1e3a8a", "#0f172a"] },
  { id: "rainbow", name: "Rainbow",   colors: ["#f97316", "#7c3aed"] },
  { id: "space",   name: "Space",     colors: ["#0f172a", "#000000"] },
  { id: "ocean",   name: "Ocean",     colors: ["#0e7490", "#082f49"] },
  { id: "forest",  name: "Forest",    colors: ["#15803d", "#052e16"] },
  { id: "ghana",   name: "Ghana",     colors: ["#166534", "#7f1d1d"] },
  { id: "sunrise", name: "Sunrise",   colors: ["#fb923c", "#7c2d12"] },
  { id: "sports",  name: "Sports",    colors: ["#1e40af", "#0c4a6e"] },
  { id: "safari",  name: "Safari",    colors: ["#b45309", "#451a03"] },
  { id: "purple",  name: "Purple",    colors: ["#7c3aed", "#2e1065"] },
  { id: "paper",   name: "Paper",     colors: ["#f5f5f4", "#e7e5e4"] }
];

// ---------- STATE ----------
let subjectsData = null;
let currentSubject = null;
let currentTopic = null;
let studyDeck = [];
let studyIndex = 0;
let quizDeck = [];
let quizIndex = 0;
let quizScore = 0;
let quizLocked = false;

let quizPace = loadPace();
let nextTimer = null;

let progress = loadProgress();
let quizHistory = loadHistory();

// ---------- CALCULATOR STATE ----------
let calcDisplay = "0";
let calcExpression = "";
let calcPrev = null;
let calcOp = null;
let calcWaitForNext = false;

// ---------- OFFLINE DICTIONARY ----------
let offlineDictionary = null;

// ---------- TYPING COURSE STATE ----------
let typingData = null;
let typingLevel = null;
let typingLessonIndex = 0;
let typingStartTime = null;
let typingCorrectCount = 0;
let typingTypedCount = 0;
let typingDone = false;
let typingStats = loadTypingStats();

// ---------- STORAGE HELPERS ----------
function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.progress)) || {
      totalAnswered: 0,
      totalCorrect: 0,
      bestPercent: 0
    };
  } catch {
    return { totalAnswered: 0, totalCorrect: 0, bestPercent: 0 };
  }
}
function saveProgress() {
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
}
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.history)) || [];
  } catch {
    return [];
  }
}
function saveHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(quizHistory));
}
function loadTheme() {
  return localStorage.getItem(STORAGE_KEYS.theme) || "classic";
}
function saveTheme(id) {
  localStorage.setItem(STORAGE_KEYS.theme, id);
}
function loadPace() {
  return localStorage.getItem(STORAGE_KEYS.pace) || "manual";
}
function savePace(p) {
  localStorage.setItem(STORAGE_KEYS.pace, p);
}
function loadTypingStats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.typing)) || {
      lessonsDone: 0,
      bestWpm: 0
    };
  } catch {
    return { lessonsDone: 0, bestWpm: 0 };
  }
}
function saveTypingStats() {
  localStorage.setItem(STORAGE_KEYS.typing, JSON.stringify(typingStats));
}

// ---------- DOM HELPERS ----------
const $ = (id) => document.getElementById(id);
const el = (tag, cls) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
};

// ---------- SCREEN MANAGEMENT ----------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");

  requestAnimationFrame(() => {
    const screen = $(id);
    if (screen.scrollHeight > window.innerHeight) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

// ---------- LOADING ----------
function showLoading() { $("loading").classList.remove("hidden"); }
function hideLoading() { $("loading").classList.add("hidden"); }

// ===================================================
// BOOT
// ===================================================
async function boot() {
  applyTheme(loadTheme());
  attachGlobalListeners();
  attachDictionaryListeners();
  attachTypingListeners();
  warmUpVoices();

  try {
    showLoading();
    subjectsData = await fetchJSON("data/subjects.json");
    const maths = subjectsData.subjects.find(s => s.id === "maths");
    currentSubject = await fetchJSON(maths.file);

    // Load offline dictionary (optional)
    try {
      offlineDictionary = await fetchJSON("data/dictionary.json");
    } catch (dictErr) {
      console.warn("Offline dictionary not available:", dictErr.message);
      offlineDictionary = null;
    }

    // Load typing course
    try {
      typingData = await fetchJSON("data/typing.json");
    } catch (typeErr) {
      console.warn("Typing course not available:", typeErr.message);
      typingData = null;
    }

    hideLoading();
    renderHome();
  } catch (err) {
    hideLoading();
    console.error(err);
    alert("Could not load study content. Please refresh the page.");
  }
}

async function fetchJSON(path) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${path}${sep}t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

// ===================================================
// HOME
// ===================================================
function renderHome() {
  renderSubjects();
  renderHomeTopics();
  renderTools();
  renderGreeting();
}

function renderGreeting() {
  const hour = new Date().getHours();
  let text = "Welcome";
  if (hour < 12) text = "Good morning";
  else if (hour < 17) text = "Good afternoon";
  else text = "Good evening";
  $("greeting").textContent = `${text}! Ready to study? 👋`;
}

function renderSubjects() {
  const grid = $("subjectGrid");
  grid.innerHTML = "";
  subjectsData.subjects.forEach(sub => {
    const card = el("button", "subject-card" + (sub.available ? "" : " disabled"));
    card.disabled = !sub.available;
    card.innerHTML = `
      <span class="subject-icon">${sub.icon}</span>
      <span>
        <span class="subject-name">${sub.name}</span>
        <span class="subject-tag">${sub.available ? "Available" : "Coming soon"}</span>
      </span>
    `;
    if (sub.available) {
      card.addEventListener("click", () => {
        renderHomeTopics();
        document.querySelector(".topic-list")?.scrollIntoView({ behavior: "smooth" });
      });
    }
    grid.appendChild(card);
  });
}

function renderHomeTopics() {
  const list = $("homeTopicList");
  list.innerHTML = "";
  currentSubject.topics.forEach(topic => {
    const item = el("button", "topic-item");
    item.innerHTML = `
      <span class="topic-item-left">
        <span class="topic-item-icon">${topic.icon || "📘"}</span>
        <span>
          <div class="topic-item-name">${topic.name}</div>
          <div class="topic-item-count">${topic.questions.length} questions</div>
        </span>
      </span>
      <span class="topic-item-arrow">›</span>
    `;
    item.addEventListener("click", () => openTopic(topic));
    list.appendChild(item);
  });
}

function renderTools() {
  const grid = $("toolsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const tools = [
    { id: "calculator", icon: "🧮", name: "Calculator", tag: "Ready", available: true },
    { id: "dictionary", icon: "📖", name: "Dictionary", tag: "Ready", available: true },
    { id: "pronounce",  icon: "🔊", name: "Pronunciator", tag: "Ready", available: true },
    { id: "typing",     icon: "⌨️", name: "Typing Course", tag: typingData ? "Ready" : "Unavailable", available: !!typingData }
  ];
  tools.forEach(t => {
    const card = el("button", "tool-card" + (t.available ? "" : " disabled"));
    card.disabled = !t.available;
    card.innerHTML = `
      <span class="tool-icon">${t.icon}</span>
      <span>
        <span class="tool-name">${t.name}</span>
        <span class="tool-tag">${t.tag}</span>
      </span>
    `;
    if (t.available && t.id === "calculator") {
      card.addEventListener("click", () => {
        showScreen("screen-calculator");
        renderCalc();
      });
    }
    if (t.available && t.id === "dictionary") {
      card.addEventListener("click", () => {
        showScreen("screen-dictionary");
        openDictionary();
      });
    }
    if (t.available && t.id === "pronounce") {
      card.addEventListener("click", () => {
        showScreen("screen-dictionary");
        openDictionary();
        setTimeout(() => {
          const input = $("dictInput");
          if (input) {
            input.placeholder = "Type any word to hear it pronounced";
            input.focus();
          }
        }, 200);
      });
    }
    if (t.available && t.id === "typing") {
      card.addEventListener("click", () => {
        showScreen("screen-typing");
        openTyping();
      });
    }
    grid.appendChild(card);
  });
}

// ===================================================
// TOPIC
// ===================================================
function openTopic(topic) {
  currentTopic = topic;
  $("topicTitle").textContent = topic.name;
  $("topicMeta").textContent = `${topic.questions.length} questions • ${currentSubject.subject}`;
  showScreen("screen-topic");
}

// ===================================================
// STUDY MODE
// ===================================================
function startStudy() {
  studyDeck = [...currentTopic.questions];
  studyIndex = 0;
  $("studyTopicLabel").textContent = `${currentSubject.subject} • ${currentTopic.name}`;
  renderStudyCard();
  showScreen("screen-study");
}

function renderStudyCard() {
  const q = studyDeck[studyIndex];
  $("question").textContent = q.q;
  $("answer").textContent = q.answer;
  $("frontBadge").textContent = "Question";
  $("backBadge").textContent = "Answer";
  $("progress").textContent = `Card ${studyIndex + 1} of ${studyDeck.length}`;
  $("card").classList.remove("flipped");

  const backEl = document.querySelector(".card-back");
  const old = backEl.querySelector(".card-procedure");
  if (old) old.remove();

  if (q.procedure || q.explain) {
    const box = document.createElement("div");
    box.className = "card-procedure";
    if (Array.isArray(q.procedure) && q.procedure.length > 0) {
      const title = document.createElement("div");
      title.className = "procedure-title";
      title.textContent = "📝 Working";
      box.appendChild(title);

      const ol = document.createElement("ol");
      q.procedure.forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        ol.appendChild(li);
      });
      box.appendChild(ol);
    } else {
      box.textContent = q.explain;
    }
    backEl.appendChild(box);
  }
}

function flipCard() {
  $("card").classList.toggle("flipped");
}
function nextCard() {
  studyIndex = (studyIndex + 1) % studyDeck.length;
  renderStudyCard();
}
function prevCard() {
  studyIndex = (studyIndex - 1 + studyDeck.length) % studyDeck.length;
  renderStudyCard();
}

// ===================================================
// QUIZ MODE
// ===================================================
function startQuiz() {
  quizDeck = shuffle([...currentTopic.questions]);
  quizIndex = 0;
  quizScore = 0;
  quizLocked = false;

  $("quizTopicLabel").textContent = `${currentSubject.subject} • ${currentTopic.name}`;
  $("quizPlay").classList.remove("hidden");
  $("quizResult").classList.add("hidden");
  refreshPaceLabel();
  renderQuizQuestion();
  showScreen("screen-quiz");
}

function renderQuizQuestion() {
  quizLocked = false;
  $("quizFeedback").textContent = "";
  $("quizFeedback").className = "quiz-feedback";
  hideProcedure();
  $("nextQuestionBtn").classList.add("hidden");
  clearTimeout(nextTimer);

  const q = quizDeck[quizIndex];
  $("quizProgress").textContent = `Question ${quizIndex + 1} of ${quizDeck.length}`;
  $("quizQuestion").textContent = q.q;

  const options = shuffle([...q.options]);
  const container = $("quizOptions");
  container.innerHTML = "";

  options.forEach(opt => {
    const btn = el("button", "quiz-option");
    btn.textContent = opt;
    btn.addEventListener("click", () => handleAnswer(btn, opt, q.answer, q));
    container.appendChild(btn);
  });
}

function handleAnswer(btn, chosen, correct, q) {
  if (quizLocked) return;
  quizLocked = true;

  const buttons = $("quizOptions").querySelectorAll(".quiz-option");
  buttons.forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
  });

  const isRight = chosen === correct;
  if (isRight) {
    quizScore++;
    $("quizFeedback").textContent = "✅ Correct!";
    $("quizFeedback").className = "quiz-feedback correct";
  } else {
    btn.classList.add("wrong");
    $("quizFeedback").textContent = `❌ Correct answer: ${correct}`;
    $("quizFeedback").className = "quiz-feedback wrong";
  }

  showProcedure(q ? q.procedure : null, q ? q.explain : "");

  progress.totalAnswered += 1;
  if (isRight) progress.totalCorrect += 1;
  saveProgress();

  const nextBtn = $("nextQuestionBtn");
  nextBtn.classList.remove("hidden");
  setTimeout(() => {
    nextBtn.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 120);

  clearTimeout(nextTimer);
  if (quizPace === "timed") {
    nextTimer = setTimeout(() => advanceQuiz(), 5000);
  }
}

function advanceQuiz() {
  clearTimeout(nextTimer);
  quizIndex++;
  if (quizIndex < quizDeck.length) {
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  $("quizPlay").classList.add("hidden");
  $("quizResult").classList.remove("hidden");

  const pct = Math.round((quizScore / quizDeck.length) * 100);
  $("finalScore").textContent = `${quizScore} / ${quizDeck.length}`;

  let title = "Well done!";
  let msg = "";
  if (pct === 100) { title = "Perfect! 🏆"; msg = "You got every single question right."; }
  else if (pct >= 80) { title = "Excellent! 🌟"; msg = "Great work — you really know this topic."; }
  else if (pct >= 60) { title = "Good job! 👍"; msg = "You're getting there. Keep practising."; }
  else { title = "Keep going! 💪"; msg = "Review the cards and try again. You'll improve."; }
  $("resultTitle").textContent = title;
  $("scoreMessage").textContent = msg;

  if (pct > progress.bestPercent) {
    progress.bestPercent = pct;
    saveProgress();
  }

  quizHistory.unshift({
    date: new Date().toLocaleString(),
    topic: currentTopic.name,
    score: quizScore,
    total: quizDeck.length,
    pct
  });
  quizHistory = quizHistory.slice(0, 20);
  saveHistory();
}

// ===================================================
// PACE TOGGLE
// ===================================================
function refreshPaceLabel() {
  const paceBtn = $("paceBtn");
  if (!paceBtn) return;
  paceBtn.textContent = quizPace === "timed" ? "⏱️ Timed (5s)" : "🐢 My pace";
}

function togglePace() {
  quizPace = quizPace === "timed" ? "manual" : "timed";
  savePace(quizPace);
  refreshPaceLabel();

  if (quizPace === "timed" && quizLocked && !$("nextQuestionBtn").classList.contains("hidden")) {
    clearTimeout(nextTimer);
    nextTimer = setTimeout(() => advanceQuiz(), 5000);
  } else {
    clearTimeout(nextTimer);
  }
}

// ===================================================
// PROCEDURE DISPLAY
// ===================================================
function showProcedure(procedure, explain) {
  const box = $("procedureBox");
  if (!box) return;
  box.innerHTML = "";

  const h = document.createElement("div");
  h.className = "procedure-title";
  h.textContent = "📝 Working";
  box.appendChild(h);

  if (Array.isArray(procedure) && procedure.length > 0) {
    const ol = document.createElement("ol");
    ol.className = "procedure-steps";
    procedure.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step;
      ol.appendChild(li);
    });
    box.appendChild(ol);
  } else if (explain) {
    const p = document.createElement("p");
    p.className = "procedure-explain";
    p.textContent = explain;
    box.appendChild(p);
  } else {
    box.appendChild(document.createTextNode("No working available."));
  }

  box.classList.remove("hidden");
}

function hideProcedure() {
  const box = $("procedureBox");
  if (box) {
    box.classList.add("hidden");
    box.innerHTML = "";
  }
}

// ===================================================
// PROGRESS SCREEN
// ===================================================
function renderProgress() {
  const accuracy = progress.totalAnswered === 0
    ? 0
    : Math.round((progress.totalCorrect / progress.totalAnswered) * 100);

  $("statTotalQuestions").textContent = progress.totalAnswered;
  $("statCorrect").textContent = progress.totalCorrect;
  $("statAccuracy").textContent = `${accuracy}%`;
  $("statBest").textContent = `${progress.bestPercent}%`;

  $("statTypingLessons").textContent = typingStats.lessonsDone;
  $("statTypingWpm").textContent = typingStats.bestWpm;

  const list = $("quizHistory");
  list.innerHTML = "";
  if (quizHistory.length === 0) {
    const li = el("li", "empty");
    li.textContent = "No quizzes taken yet.";
    list.appendChild(li);
    return;
  }
  quizHistory.forEach(h => {
    const li = el("li");
    li.innerHTML = `
      <span>
        <div>${h.topic}</div>
        <div class="hist-date">${h.date}</div>
      </span>
      <span>${h.score}/${h.total} (${h.pct}%)</span>
    `;
    list.appendChild(li);
  });
}

// ===================================================
// THEME
// ===================================================
function applyTheme(id) {
  document.body.className = `theme-${id}`;
}
function openThemeModal() {
  const grid = $("themeGrid");
  grid.innerHTML = "";
  const current = loadTheme();
  THEMES.forEach(t => {
    const btn = el("button", "theme-swatch" + (t.id === current ? " selected" : ""));
    btn.style.background = `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`;
    btn.innerHTML = `<span class="dot" style="background:${t.colors[0]}"></span>${t.name}`;
    btn.addEventListener("click", () => {
      saveTheme(t.id);
      applyTheme(t.id);
      grid.querySelectorAll(".theme-swatch").forEach(s => s.classList.remove("selected"));
      btn.classList.add("selected");
    });
    grid.appendChild(btn);
  });
  $("themeModal").classList.remove("hidden");
}
function closeThemeModal() {
  $("themeModal").classList.add("hidden");
}

// ===================================================
// CALCULATOR
// ===================================================
function renderCalc() {
  const displayEl = $("calcDisplay");
  if (!displayEl) return;

  if (calcExpression) {
    displayEl.innerHTML = `<span class="calc-expr">${calcExpression}</span>${calcDisplay}`;
  } else {
    displayEl.textContent = calcDisplay;
  }
  displayEl.scrollLeft = displayEl.scrollWidth;
}

function calcInput(value) {
  if (value === "clear") {
    calcDisplay = "0";
    calcExpression = "";
    calcPrev = null;
    calcOp = null;
    calcWaitForNext = false;
    return renderCalc();
  }
  if (value === "back") {
    calcDisplay = calcDisplay.length > 1 ? calcDisplay.slice(0, -1) : "0";
    updateExprAfterDigit();
    return renderCalc();
  }
  if (value === "equals") {
    return calcEquals();
  }
  if (value === "%") {
    const n = parseFloat(calcDisplay);
    if (!isNaN(n)) calcDisplay = formatNumber(n / 100);
    updateExprAfterDigit();
    return renderCalc();
  }
  if (["+", "-", "*", "/"].includes(value)) {
    const n = parseFloat(calcDisplay);
    if (calcOp && !calcWaitForNext) {
      const result = calcCompute(calcPrev, n, calcOp);
      calcDisplay = formatNumber(result);
      calcPrev = result;
    } else {
      calcPrev = n;
    }
    calcOp = value;
    calcWaitForNext = true;
    calcExpression = `${formatNumber(calcPrev)} ${displayOpSymbol(value)} `;
    return renderCalc();
  }
  if (value === ".") {
    if (calcWaitForNext) {
      calcDisplay = "0.";
      calcWaitForNext = false;
    } else if (!calcDisplay.includes(".")) {
      calcDisplay += ".";
    }
    updateExprAfterDigit();
    return renderCalc();
  }
  if (calcWaitForNext) {
    calcDisplay = value;
    calcWaitForNext = false;
  } else {
    calcDisplay = calcDisplay === "0" ? value : calcDisplay + value;
  }
  updateExprAfterDigit();
  renderCalc();
}

function calcCompute(a, b, op) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? NaN : a / b;
    default: return b;
  }
}

function calcEquals() {
  if (calcOp === null || calcPrev === null) return;
  const n = parseFloat(calcDisplay);
  const result = calcCompute(calcPrev, n, calcOp);
  calcExpression = `${formatNumber(calcPrev)} ${displayOpSymbol(calcOp)} ${formatNumber(n)} =`;
  calcDisplay = formatNumber(result);
  calcPrev = null;
  calcOp = null;
  calcWaitForNext = true;
  renderCalc();
}

function formatNumber(n) {
  if (isNaN(n)) return "Error";
  if (!isFinite(n)) return "∞";
  const rounded = parseFloat(n.toPrecision(12));
  return String(rounded);
}

function displayOpSymbol(op) {
  if (op === "*") return "×";
  if (op === "/") return "÷";
  if (op === "-") return "−";
  return op;
}

function updateExprAfterDigit() {
  if (!calcExpression) return;
  calcExpression = calcExpression.replace(/[\d.]+$/, "") + calcDisplay;
}

// ===================================================
// VOICE WARM-UP
// ===================================================
function warmUpVoices() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// ===================================================
// DICTIONARY + PRONUNCIATION (offline)
// ===================================================
function openDictionary() {
  const input = $("dictInput");
  const result = $("dictResult");
  const error = $("dictError");
  if (!input) return;
  input.value = "";
  result.classList.add("hidden");
  result.innerHTML = "";
  error.classList.add("hidden");
  error.textContent = "";
  setTimeout(() => input.focus(), 200);
}

function lookupWord(word) {
  const result = $("dictResult");
  const error = $("dictError");

  word = (word || "").trim().toLowerCase();
  if (!word) return;

  if (!/^[a-z\-' ]+$/.test(word)) {
    error.textContent = "Please enter a valid word (letters only).";
    error.classList.remove("hidden");
    result.classList.add("hidden");
    return;
  }

  error.classList.add("hidden");
  result.classList.remove("hidden");

  if (!offlineDictionary) {
    renderFallbackDictionary(word);
    return;
  }

  const words = word.split(/\s+/);
  const known = [];
  const unknown = [];

  words.forEach(w => {
    const clean = w.replace(/[^a-z\-']/g, "");
    if (offlineDictionary[clean]) {
      known.push({ word: clean, definition: offlineDictionary[clean] });
    } else {
      unknown.push(w);
    }
  });

  renderOfflineResult(word, known, unknown);
}

function renderFallbackDictionary(word) {
  const result = $("dictResult");
  result.innerHTML = "";

  const header = document.createElement("div");
  header.className = "dict-word-row";

  const wordEl = document.createElement("div");
  wordEl.className = "dict-word";
  wordEl.textContent = word;
  header.appendChild(wordEl);

  const pronounceBtn = document.createElement("button");
  pronounceBtn.className = "dict-pronounce";
  pronounceBtn.title = "Play pronunciation";
  pronounceBtn.textContent = "🔊";
  pronounceBtn.addEventListener("click", () => speakWord(word, pronounceBtn));
  header.appendChild(pronounceBtn);

  result.appendChild(header);

  const note = document.createElement("div");
  note.className = "dict-def";
  note.style.opacity = "0.7";
  note.style.marginTop = "10px";
  note.textContent = "Dictionary not loaded. You can still tap 🔊 to hear the word pronounced.";
  result.appendChild(note);
}

function renderOfflineResult(phrase, known, unknown) {
  const result = $("dictResult");
  result.innerHTML = "";

  const header = document.createElement("div");
  header.className = "dict-word-row";

  const wordEl = document.createElement("div");
  wordEl.className = "dict-word";
  wordEl.textContent = phrase;
  header.appendChild(wordEl);

  const pronounceBtn = document.createElement("button");
  pronounceBtn.className = "dict-pronounce";
  pronounceBtn.title = "Play pronunciation";
  pronounceBtn.textContent = "🔊";
  pronounceBtn.addEventListener("click", () => speakWord(phrase, pronounceBtn));
  header.appendChild(pronounceBtn);

  result.appendChild(header);

  if (known.length > 1) {
    const note = document.createElement("div");
    note.className = "dict-phonetic";
    note.textContent = `Meaning of each word in "${phrase}":`;
    result.appendChild(note);
  }

  if (known.length === 0) {
    const note = document.createElement("div");
    note.className = "dict-def";
    note.style.opacity = "0.7";
    note.style.marginTop = "10px";
    note.textContent = `No definition found for "${phrase}" yet. You can still tap 🔊 to hear it pronounced.`;
    result.appendChild(note);
    return;
  }

  known.forEach(k => {
    const block = document.createElement("div");
    block.className = "dict-meaning";

    const word = document.createElement("div");
    word.className = "dict-pos";
    word.textContent = k.word;
    block.appendChild(word);

    const def = document.createElement("div");
    def.className = "dict-def";
    def.textContent = k.definition;
    block.appendChild(def);

    result.appendChild(block);
  });

  if (unknown.length > 0) {
    const note = document.createElement("div");
    note.className = "dict-def";
    note.style.opacity = "0.6";
    note.style.marginTop = "12px";
    note.style.fontStyle = "italic";
    note.textContent = `Not yet in our dictionary: ${unknown.join(", ")}`;
    result.appendChild(note);
  }
}

function speakWord(word, btn) {
  if (!("speechSynthesis" in window)) {
    alert("Your browser does not support speech. Try a different browser.");
    return;
  }

  const clean = String(word)
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return;

  try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = "en-GB";
  utterance.rate = 0.85;
  utterance.pitch = 1;
  utterance.volume = 1;

  try {
    const voices = window.speechSynthesis.getVoices() || [];
    const preferred = voices.find(v => /en-GB|en_GB/i.test(v.lang)) ||
                      voices.find(v => /en-US|en_US/i.test(v.lang)) ||
                      voices.find(v => /^en/i.test(v.lang));
    if (preferred) {
      utterance.voice = preferred;
      utterance.lang = preferred.lang;
    }
  } catch (e) { /* default voice */ }

  if (btn) {
    btn.classList.add("playing");
    const clear = () => btn.classList.remove("playing");
    utterance.onend = clear;
    utterance.onerror = clear;
    setTimeout(clear, 10000);
  }

  setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("speechSynthesis.speak failed:", e);
    }
  }, 60);
}

function attachDictionaryListeners() {
  const input = $("dictInput");
  const btn = $("dictSearchBtn");
  if (!input || !btn) return;

  btn.addEventListener("click", () => lookupWord(input.value));

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupWord(input.value);
    }
  });
}

// ===================================================
// TYPING COURSE
// ===================================================
function openTyping() {
  const picker = $("typingLevelPicker");
  const lesson = $("typingLesson");
  picker.classList.remove("hidden");
  lesson.classList.add("hidden");
  renderTypingLevels();
}

function renderTypingLevels() {
  const container = $("typingLevels");
  container.innerHTML = "";
  if (!typingData || !typingData.levels) {
    container.innerHTML = '<p class="dict-error">Typing data unavailable.</p>';
    return;
  }
  typingData.levels.forEach((lvl, i) => {
    const card = el("button", "typing-level-card");
    card.innerHTML = `
      <span class="typing-level-icon">${lvl.icon || "⌨️"}</span>
      <span class="typing-level-info">
        <div class="typing-level-title">${lvl.name}</div>
        <div class="typing-level-desc">${lvl.desc || ""} • ${lvl.lessons.length} lessons</div>
      </span>
      <span class="typing-level-arrow">›</span>
    `;
    card.addEventListener("click", () => startTypingLevel(i));
    container.appendChild(card);
  });
}

function startTypingLevel(levelIndex) {
  typingLevel = typingData.levels[levelIndex];
  typingLessonIndex = 0;
  $("typingLevelPicker").classList.add("hidden");
  $("typingLesson").classList.remove("hidden");
  $("typingLevelName").textContent = typingLevel.name;
  startTypingLesson();
}

function startTypingLesson() {
  typingDone = false;
  typingCorrectCount = 0;
  typingTypedCount = 0;
  typingStartTime = null;

  const text = typingLevel.lessons[typingLessonIndex].text;
  $("typingLessonCount").textContent = `Lesson ${typingLessonIndex + 1} of ${typingLevel.lessons.length}`;
  $("typingInput").value = "";
  $("typingInput").disabled = false;
  $("typingNextBtn").disabled = false;

  renderTypingTarget(text, 0);
  updateTypingStats();

  setTimeout(() => $("typingInput").focus(), 100);
}

function renderTypingTarget(text, typedLength) {
  const targetEl = $("typingTarget");
  targetEl.innerHTML = "";
  const typed = $("typingInput").value;

  for (let i = 0; i < text.length; i++) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = text[i] === " " ? "\u00A0" : text[i];

    if (i < typed.length) {
      if (typed[i] === text[i]) {
        span.classList.add("correct");
      } else {
        span.classList.add("incorrect");
      }
    } else if (i === typed.length) {
      span.classList.add("current");
    }

    targetEl.appendChild(span);
  }
}

function handleTypingInput() {
  if (typingDone) return;

  const text = typingLevel.lessons[typingLessonIndex].text;
  const typed = $("typingInput").value;

  if (!typingStartTime && typed.length > 0) {
    typingStartTime = Date.now();
  }

  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === text[i]) correct++;
  }
  typingCorrectCount = correct;
  typingTypedCount = typed.length;

  renderTypingTarget(text, typed.length);
  updateTypingStats();

  if (typed === text) {
    finishTypingLesson();
  }
}

function updateTypingStats() {
  const accuracy = typingTypedCount === 0
    ? 100
    : Math.round((typingCorrectCount / typingTypedCount) * 100);
  $("typingAccuracy").textContent = `${accuracy}%`;
  $("typingProgress").textContent = `${typingTypedCount}/${typingLevel ? typingLevel.lessons[typingLessonIndex].text.length : 0}`;

  const elapsed = typingStartTime ? (Date.now() - typingStartTime) / 1000 : 0;
  const wpm = elapsed > 1
    ? Math.round((typingCorrectCount / 5) / (elapsed / 60))
    : 0;
  $("typingWpm").textContent = wpm;
}

function finishTypingLesson() {
  typingDone = true;
  $("typingInput").disabled = true;

  const accuracy = typingTypedCount === 0
    ? 100
    : Math.round((typingCorrectCount / typingTypedCount) * 100);
  const elapsed = typingStartTime ? (Date.now() - typingStartTime) / 1000 : 1;
  const wpm = Math.round((typingCorrectCount / 5) / (elapsed / 60));

  typingStats.lessonsDone += 1;
  if (wpm > typingStats.bestWpm) typingStats.bestWpm = wpm;
  saveTypingStats();

  // Visual: mark lesson as done, brief delay before user can advance
  $("typingNextBtn").textContent = "Next Lesson →";
  $("typingNextBtn").disabled = false;
}

function nextTypingLesson() {
  if (!typingLevel) return;
  if (typingLessonIndex < typingLevel.lessons.length - 1) {
    typingLessonIndex++;
    startTypingLesson();
  } else {
    // End of level — go back to level picker
    openTyping();
  }
}

function restartTypingLesson() {
  startTypingLesson();
}

function attachTypingListeners() {
  const input = $("typingInput");
  const nextBtn = $("typingNextBtn");
  const restartBtn = $("typingRestartBtn");
  if (!input) return;

  input.addEventListener("input", handleTypingInput);

  nextBtn.addEventListener("click", nextTypingLesson);
  restartBtn.addEventListener("click", restartTypingLesson);
}

// ===================================================
// LISTENERS
// ===================================================
function attachGlobalListeners() {
  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => {
      const active = document.querySelector(".screen.active").id;
      if (active === "screen-topic") showScreen("screen-home");
      else if (active === "screen-study" || active === "screen-quiz") showScreen("screen-topic");
      else if (active === "screen-progress" || active === "screen-calculator" || active === "screen-dictionary" || active === "screen-typing") showScreen("screen-home");
    });
  });

  $("modeStudy").addEventListener("click", startStudy);
  $("modeQuiz").addEventListener("click", startQuiz);

  $("flipBtn").addEventListener("click", flipCard);
  $("nextBtn").addEventListener("click", nextCard);
  $("prevBtn").addEventListener("click", prevCard);
  $("card").addEventListener("click", flipCard);

  $("retryQuizBtn").addEventListener("click", startQuiz);
  $("backHomeBtn").addEventListener("click", () => showScreen("screen-home"));

  $("nextQuestionBtn").addEventListener("click", advanceQuiz);

  $("paceBtn").addEventListener("click", togglePace);
  refreshPaceLabel();

  $("progressLink").addEventListener("click", () => {
    renderProgress();
    showScreen("screen-progress");
  });
  $("clearProgressBtn").addEventListener("click", () => {
    if (confirm("Clear all your progress and quiz history?")) {
      progress = { totalAnswered: 0, totalCorrect: 0, bestPercent: 0 };
      quizHistory = [];
      typingStats = { lessonsDone: 0, bestWpm: 0 };
      saveProgress();
      saveHistory();
      saveTypingStats();
      renderProgress();
    }
  });

  $("themeBtn").addEventListener("click", openThemeModal);
  $("themeClose").addEventListener("click", closeThemeModal);
  $("themeModal").addEventListener("click", e => {
    if (e.target.id === "themeModal") closeThemeModal();
  });

  document.querySelectorAll(".calc-btn").forEach(btn => {
    btn.addEventListener("click", () => calcInput(btn.dataset.calc));
  });

  document.addEventListener("keydown", e => {
    if ($("screen-study").classList.contains("active")) {
      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
      if (e.key === " ") { e.preventDefault(); flipCard(); }
      return;
    }
    if ($("screen-calculator").classList.contains("active")) {
      const k = e.key;
      if (/^[0-9]$/.test(k)) calcInput(k);
      else if (k === ".") calcInput(".");
      else if (["+", "-", "*", "/"].includes(k)) calcInput(k);
      else if (k === "Enter" || k === "=") { e.preventDefault(); calcInput("equals"); }
      else if (k === "Backspace") calcInput("back");
      else if (k === "Escape") calcInput("clear");
    }
  });
}

// ===================================================
// UTIL
// ===================================================
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===================================================
// GO
// ===================================================
boot();