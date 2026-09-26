// ===================================================
// P5 STUDY HUB — APP LOGIC
// ===================================================

// ---------- CONFIG ----------
const STORAGE_KEYS = {
  theme: "p5hub.theme",
  progress: "p5hub.progress",
  history: "p5hub.history",
  pace: "p5hub.pace"
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

let quizPace = loadPace();       // "manual" or "timed"
let nextTimer = null;             // handle for auto-advance timer

let progress = loadProgress();
let quizHistory = loadHistory();

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

  try {
    showLoading();
    subjectsData = await fetchJSON("data/subjects.json");
    const maths = subjectsData.subjects.find(s => s.id === "maths");
    currentSubject = await fetchJSON(maths.file);
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

  // Show the procedure on the back of the card, if present
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

  // Show the step-by-step working
  showProcedure(q ? q.procedure : null, q ? q.explain : "");

  progress.totalAnswered += 1;
  if (isRight) progress.totalCorrect += 1;
  saveProgress();

  // Reveal Next button and scroll working into view
  const nextBtn = $("nextQuestionBtn");
  nextBtn.classList.remove("hidden");
  setTimeout(() => {
    nextBtn.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 120);

  // If timed mode, auto-advance after 5 seconds
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
// LISTENERS
// ===================================================
function attachGlobalListeners() {
  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => {
      const active = document.querySelector(".screen.active").id;
      if (active === "screen-topic") showScreen("screen-home");
      else if (active === "screen-study" || active === "screen-quiz") showScreen("screen-topic");
      else if (active === "screen-progress") showScreen("screen-home");
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

  // Next question button (manual pace)
  $("nextQuestionBtn").addEventListener("click", advanceQuiz);

  // Pace toggle
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
      saveProgress();
      saveHistory();
      renderProgress();
    }
  });

  $("themeBtn").addEventListener("click", openThemeModal);
  $("themeClose").addEventListener("click", closeThemeModal);
  $("themeModal").addEventListener("click", e => {
    if (e.target.id === "themeModal") closeThemeModal();
  });

  document.addEventListener("keydown", e => {
    if (!$("screen-study").classList.contains("active")) return;
    if (e.key === "ArrowRight") nextCard();
    if (e.key === "ArrowLeft") prevCard();
    if (e.key === " ") { e.preventDefault(); flipCard(); }
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