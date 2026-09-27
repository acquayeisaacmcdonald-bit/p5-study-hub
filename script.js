// ===================================================
// P5 STUDY HUB — APP LOGIC
// ===================================================

// ---------- CONFIG ----------
const STORAGE_KEYS = {
  theme: "p5hub.theme",
  progress: "p5hub.progress",
  history: "p5hub.history",
  pace: "p5hub.pace",
  typing: "p5hub.typing",
  study: "p5hub.study",
  playerName: "p5hub.playerName",
  mathSprintBest: "p5hub.mathSprintBest"
};

const STUDY_REQUIRED_MIN = 45;
const STUDY_REQUIRED_SEC = STUDY_REQUIRED_MIN * 60;
const UNLOCK_DURATION_MS = 12 * 60 * 60 * 1000;
const MATH_SPRINT_SECONDS = 30;

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

// ---------- STUDY TRACKER STATE ----------
let studyTracker = loadStudyTracker();
let studyTickInterval = null;

// ---------- PLAYER PROFILE ----------
let playerName = loadPlayerName();

// ---------- MATH SPRINT STATE ----------
let msMode = null;           // "solo" | "two"
let msPlayers = [];          // [{ name, score }]
let msCurrentPlayerIndex = 0;
let msRoundActive = false;
let msTimerInterval = null;
let msTimeLeft = 0;
let msCurrentQuestion = null;
let msQuestionLocked = false;
// ---------- MEMORY MATCH STATE ----------
let mmMode = null;              // "solo" | "two"
let mmPlayers = [];             // [{ name, pairs }]
let mmCurrentPlayerIndex = 0;
let mmBoard = [];               // array of { id, pairId, text, matched }
let mmFirstPick = null;         // index of first flipped card
let mmLocked = false;
let mmMoves = 0;
let mmStartTime = null;
let mmTimerInterval = null;
let mmPairsFound = 0;
let mmTotalPairs = 0;
let mmExtraTurn = false;        // for 2-player: did the current player score a match?

const MM_PAIR_POOL = [
  { a: "1/2", b: "0.5" },
  { a: "7 × 8", b: "56" },
  { a: "100", b: "10²" },
  { a: "H₂O", b: "Water" },
  { a: "O₂", b: "Oxygen" },
  { a: "9 × 9", b: "81" },
  { a: "Quick", b: "Fast" },
  { a: "Big", b: "Large" },
  { a: "25%", b: "1/4" },
  { a: "12 ÷ 3", b: "4" },
  { a: "Happy", b: "Glad" },
  { a: "Sun", b: "Star" },
  { a: "3²", b: "9" },
  { a: "5 + 5", b: "10" },
  { a: "Ice", b: "Frozen water" }
];

// ---------- SPELLING BEE STATE ----------
let sbLevel = null;              // "easy" | "medium" | "hard"
let sbMode = null;               // "solo" | "two"
let sbPlayers = [];              // [{ name, score }]
let sbCurrentPlayerIndex = 0;
let sbWords = [];                // array of words for the round
let sbWordIndex = 0;
let sbRoundActive = false;
let sbWordLocked = false;
let sbRoundLength = 10;

// Word pools for each level
const SB_WORDS = {
  easy: [
    "cat", "dog", "sun", "run", "book", "tree", "fish", "bird", "milk", "hand",
    "blue", "green", "happy", "water", "house", "friend", "school", "teacher"
  ],
  medium: [
    "garden", "subtract", "courage", "morning", "country", "village", "picture",
    "kitchen", "library", "journey", "machine", "measure", "teacher", "greater",
    "brother", "weather", "however", "instead", "understand", "important"
  ],
  hard: [
    "photosynthesis", "government", "multiplication", "subtraction", "community",
    "environment", "mathematics", "punctuation", "citizenship", "encyclopedia",
    "electricity", "experiment", "information", "neighbourhood", "responsibility",
    "communication", "organisation", "pronunciation", "vocabulary", "arithmetic"
  ]
};

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
function loadPlayerName() {
  return localStorage.getItem(STORAGE_KEYS.playerName) || "";
}
function savePlayerName(name) {
  localStorage.setItem(STORAGE_KEYS.playerName, name);
}
function loadMathSprintBest() {
  const v = localStorage.getItem(STORAGE_KEYS.mathSprintBest);
  return v ? parseInt(v, 10) : 0;
}
function saveMathSprintBest(score) {
  const current = loadMathSprintBest();
  if (score > current) {
    localStorage.setItem(STORAGE_KEYS.mathSprintBest, String(score));
  }
}

// ---------- STUDY TRACKER ----------
function loadStudyTracker() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.study));
    if (!raw) return { secondsToday: 0, unlockedAt: null, unlocksTotal: 0, lastUpdate: Date.now() };
    return {
      secondsToday: raw.secondsToday || 0,
      unlockedAt: raw.unlockedAt || null,
      unlocksTotal: raw.unlocksTotal || 0,
      lastUpdate: raw.lastUpdate || Date.now()
    };
  } catch {
    return { secondsToday: 0, unlockedAt: null, unlocksTotal: 0, lastUpdate: Date.now() };
  }
}
function saveStudyTracker() {
  studyTracker.lastUpdate = Date.now();
  localStorage.setItem(STORAGE_KEYS.study, JSON.stringify(studyTracker));
}

function checkStudyReset() {
  if (studyTracker.unlockedAt) {
    const elapsed = Date.now() - studyTracker.unlockedAt;
    if (elapsed >= UNLOCK_DURATION_MS) {
      studyTracker.secondsToday = 0;
      studyTracker.unlockedAt = null;
      saveStudyTracker();
    }
  }
}

function isGamesUnlocked() {
  checkStudyReset();
  return studyTracker.unlockedAt !== null;
}

function getStudyProgressFraction() {
  if (isGamesUnlocked()) return 1;
  return Math.min(1, studyTracker.secondsToday / STUDY_REQUIRED_SEC);
}

function getUnlockTimeRemainingMs() {
  if (!studyTracker.unlockedAt) return 0;
  const elapsed = Date.now() - studyTracker.unlockedAt;
  return Math.max(0, UNLOCK_DURATION_MS - elapsed);
}

function startStudyTimer() {
  if (studyTickInterval) return;
  studyTickInterval = setInterval(() => {
    const active = document.querySelector(".screen.active");
    if (!active) return;
    const id = active.id;

    if (id === "screen-study" || id === "screen-quiz" || id === "screen-typing") {
      if (isGamesUnlocked()) return;
      studyTracker.secondsToday += 1;
      if (studyTracker.secondsToday >= STUDY_REQUIRED_SEC) {
        studyTracker.unlockedAt = Date.now();
        studyTracker.unlocksTotal += 1;
      }
      saveStudyTracker();
      updateStudyBanner();
      updateGamesScreen();
    }
  }, 1000);
}

function stopStudyTimer() {
  if (studyTickInterval) {
    clearInterval(studyTickInterval);
    studyTickInterval = null;
  }
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

  if (id !== "screen-study" && id !== "screen-quiz" && id !== "screen-typing") {
    saveStudyTracker();
  }

  updateStudyBanner();

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
  attachGamesListeners();
  attachMathSprintListeners();
  attachMemoryMatchListeners();
  attachSpellingBeeListeners();
  attachNameListeners();
  warmUpVoices();

  checkStudyReset();
  startStudyTimer();
  updateStudyBanner();
  updateGreeting();

  // Name prompt on first visit
  if (!playerName) {
    setTimeout(() => {
      $("nameModal").classList.remove("hidden");
    }, 600);
  }

  try {
    showLoading();
    subjectsData = await fetchJSON("data/subjects.json");
    const maths = subjectsData.subjects.find(s => s.id === "maths");
    currentSubject = await fetchJSON(maths.file);

    try {
      offlineDictionary = await fetchJSON("data/dictionary.json");
    } catch (dictErr) {
      console.warn("Offline dictionary not available:", dictErr.message);
      offlineDictionary = null;
    }

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
// PLAYER NAME
// ===================================================
function updateGreeting() {
  const hour = new Date().getHours();
  let text = "Welcome";
  if (hour < 12) text = "Good morning";
  else if (hour < 17) text = "Good afternoon";
  else text = "Good evening";

  if (playerName) {
    $("greeting").textContent = `${text}, ${playerName}! 👋`;
  } else {
    $("greeting").textContent = `${text}! Ready to study? 👋`;
  }
}

function attachNameListeners() {
  const saveBtn = $("nameSaveBtn");
  const skipBtn = $("nameSkipBtn");
  const changeBtn = $("changeNameBtn");
  const input = $("nameInput");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const val = (input.value || "").trim();
      if (val) {
        playerName = val;
        savePlayerName(val);
      }
      $("nameModal").classList.add("hidden");
      updateGreeting();
      updateProgressNameDisplay();
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      $("nameModal").classList.add("hidden");
    });
  }

  if (changeBtn) {
    changeBtn.addEventListener("click", () => {
      $("nameInput").value = playerName;
      $("nameModal").classList.remove("hidden");
    });
  }

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveBtn.click();
      }
    });
  }
}

function updateProgressNameDisplay() {
  const el = $("progressName");
  if (el) el.textContent = playerName || "Player";
}

// ===================================================
// HOME
// ===================================================
function renderHome() {
  renderSubjects();
  renderHomeTopics();
  renderTools();
  updateGreeting();
  updateStudyBanner();
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
    { id: "typing",     icon: "⌨️", name: "Typing Course", tag: typingData ? "Ready" : "Unavailable", available: !!typingData },
    { id: "games",      icon: "🎮", name: "Games", tag: isGamesUnlocked() ? "Unlocked" : "Locked", available: true }
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
    if (t.available && t.id === "games") {
      card.addEventListener("click", () => {
        showScreen("screen-games");
        updateGamesScreen();
      });
    }
    grid.appendChild(card);
  });
}

// ===================================================
// STUDY BANNER
// ===================================================
function updateStudyBanner() {
  const banner = $("studyBanner");
  const bannerIcon = $("studyBannerIcon");
  const bannerText = $("studyBannerText");
  const fill = $("studyProgressFill");
  if (!banner || !bannerText) return;

  if (isGamesUnlocked()) {
    banner.classList.add("unlocked");
    fill.classList.add("unlocked");
    bannerIcon.textContent = "🎮";
    const msLeft = getUnlockTimeRemainingMs();
    const h = Math.floor(msLeft / 3600000);
    const m = Math.floor((msLeft % 3600000) / 60000);
    bannerText.textContent = `Games unlocked for ${h}h ${m}m`;
  } else {
    banner.classList.remove("unlocked");
    fill.classList.remove("unlocked");
    bannerIcon.textContent = "🔒";
    const secondsLeft = Math.max(0, STUDY_REQUIRED_SEC - studyTracker.secondsToday);
    const minLeft = Math.ceil(secondsLeft / 60);
    bannerText.textContent = `Study ${minLeft} more min to unlock games`;
    fill.style.width = `${getStudyProgressFraction() * 100}%`;
  }
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

function flipCard() { $("card").classList.toggle("flipped"); }
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

  const studyMin = Math.floor(studyTracker.secondsToday / 60);
  $("statStudyMinutes").textContent = studyMin;
  $("statGamesPlayed").textContent = studyTracker.unlocksTotal;

  updateProgressNameDisplay();

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
function applyTheme(id) { document.body.className = `theme-${id}`; }

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
function closeThemeModal() { $("themeModal").classList.add("hidden"); }

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
    calcDisplay = "0"; calcExpression = ""; calcPrev = null; calcOp = null; calcWaitForNext = false;
    return renderCalc();
  }
  if (value === "back") {
    calcDisplay = calcDisplay.length > 1 ? calcDisplay.slice(0, -1) : "0";
    updateExprAfterDigit();
    return renderCalc();
  }
  if (value === "equals") return calcEquals();
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
    if (calcWaitForNext) { calcDisplay = "0."; calcWaitForNext = false; }
    else if (!calcDisplay.includes(".")) calcDisplay += ".";
    updateExprAfterDigit();
    return renderCalc();
  }
  if (calcWaitForNext) { calcDisplay = value; calcWaitForNext = false; }
  else calcDisplay = calcDisplay === "0" ? value : calcDisplay + value;
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
  calcPrev = null; calcOp = null; calcWaitForNext = true;
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
// DICTIONARY
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
  if (!offlineDictionary) { renderFallbackDictionary(word); return; }
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
  const clean = String(word).replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  if (!clean) return;
  try { window.speechSynthesis.cancel(); } catch (e) {}
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
  } catch (e) {}
  if (btn) {
    btn.classList.add("playing");
    const clear = () => btn.classList.remove("playing");
    utterance.onend = clear;
    utterance.onerror = clear;
    setTimeout(clear, 10000);
  }
  setTimeout(() => {
    try { window.speechSynthesis.speak(utterance); }
    catch (e) { console.error("speechSynthesis.speak failed:", e); }
  }, 60);
}

function attachDictionaryListeners() {
  const input = $("dictInput");
  const btn = $("dictSearchBtn");
  if (!input || !btn) return;
  btn.addEventListener("click", () => lookupWord(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); lookupWord(input.value); }
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

function renderTypingTarget(text) {
  const targetEl = $("typingTarget");
  targetEl.innerHTML = "";
  const typed = $("typingInput").value;
  for (let i = 0; i < text.length; i++) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = text[i] === " " ? "\u00A0" : text[i];
    if (i < typed.length) {
      if (typed[i] === text[i]) span.classList.add("correct");
      else span.classList.add("incorrect");
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
  if (!typingStartTime && typed.length > 0) typingStartTime = Date.now();
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) correct++;
  typingCorrectCount = correct;
  typingTypedCount = typed.length;
  renderTypingTarget(text);
  updateTypingStats();
  if (typed === text) finishTypingLesson();
}

function updateTypingStats() {
  const accuracy = typingTypedCount === 0 ? 100 : Math.round((typingCorrectCount / typingTypedCount) * 100);
  $("typingAccuracy").textContent = `${accuracy}%`;
  $("typingProgress").textContent = `${typingTypedCount}/${typingLevel ? typingLevel.lessons[typingLessonIndex].text.length : 0}`;
  const elapsed = typingStartTime ? (Date.now() - typingStartTime) / 1000 : 0;
  const wpm = elapsed > 1 ? Math.round((typingCorrectCount / 5) / (elapsed / 60)) : 0;
  $("typingWpm").textContent = wpm;
}

function finishTypingLesson() {
  typingDone = true;
  $("typingInput").disabled = true;
  const elapsed = typingStartTime ? (Date.now() - typingStartTime) / 1000 : 1;
  const wpm = Math.round((typingCorrectCount / 5) / (elapsed / 60));
  typingStats.lessonsDone += 1;
  if (wpm > typingStats.bestWpm) typingStats.bestWpm = wpm;
  saveTypingStats();
  $("typingNextBtn").textContent = "Next Lesson →";
  $("typingNextBtn").disabled = false;
}

function nextTypingLesson() {
  if (!typingLevel) return;
  if (typingLessonIndex < typingLevel.lessons.length - 1) {
    typingLessonIndex++;
    startTypingLesson();
  } else {
    openTyping();
  }
}

function restartTypingLesson() { startTypingLesson(); }

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
// GAMES HUB
// ===================================================
function updateGamesScreen() {
  const lockedEl = $("gamesLocked");
  const unlockedEl = $("gamesUnlocked");
  if (!lockedEl || !unlockedEl) return;

  if (isGamesUnlocked()) {
    lockedEl.classList.add("hidden");
    unlockedEl.classList.remove("hidden");
    const msLeft = getUnlockTimeRemainingMs();
    const h = Math.floor(msLeft / 3600000);
    const m = Math.floor((msLeft % 3600000) / 60000);
    $("gamesUnlockedMsg").textContent = `You earned this! Time remaining: ${h}h ${m}m.`;
    renderGamesGrid();
  } else {
    unlockedEl.classList.add("hidden");
    lockedEl.classList.remove("hidden");
    const secondsLeft = Math.max(0, STUDY_REQUIRED_SEC - studyTracker.secondsToday);
    const minLeft = Math.ceil(secondsLeft / 60);
    const doneMin = Math.floor(studyTracker.secondsToday / 60);
    $("gamesLockedMsg").textContent = `Study for ${STUDY_REQUIRED_MIN} minutes to unlock games.`;
    $("gamesLockedTime").textContent = `${doneMin} / ${STUDY_REQUIRED_MIN} min • ${minLeft} more to go`;
    $("gamesProgressFill").style.width = `${getStudyProgressFraction() * 100}%`;
  }
}

function renderGamesGrid() {
  const grid = $("gamesGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const games = [
    { id: "mathsprint", icon: "⏱️", name: "Math Sprint", tag: "Ready", available: true },
    { id: "memorymatch", icon: "🧠", name: "Memory Match", tag: "Ready", available: true },
    { id: "spellingbee", icon: "🐝", name: "Spelling Bee", tag: "Ready", available: true },
    { id: "tables", icon: "🔢", name: "Times Tables", tag: "Coming soon", available: false }
  ];
  games.forEach(g => {
    const card = el("button", "game-card" + (g.available ? "" : " disabled"));
    card.disabled = !g.available;
    card.innerHTML = `
      <span class="game-icon">${g.icon}</span>
      <span class="game-name">${g.name}</span>
      <span class="game-tag">${g.tag}</span>
    `;
    if (g.available && g.id === "mathsprint") {
      card.addEventListener("click", () => {
        showScreen("screen-mathsprint");
        openMathSprint();
      });
    }    if (g.available && g.id === "memorymatch") {
      card.addEventListener("click", () => {
        showScreen("screen-memorymatch");
        openMemoryMatch();
      });
    }    if (g.available && g.id === "spellingbee") {
      card.addEventListener("click", () => {
        showScreen("screen-spellingbee");
        openSpellingBee();
      });
    }
    grid.appendChild(card);
  });
}

function attachGamesListeners() {
  const goStudyBtn = $("gamesGoStudyBtn");
  if (goStudyBtn) goStudyBtn.addEventListener("click", () => showScreen("screen-home"));
}

// ===================================================
// MATH SPRINT
// ===================================================
function openMathSprint() {
  msMode = null;
  msPlayers = [];
  msCurrentPlayerIndex = 0;
  msRoundActive = false;
  clearInterval(msTimerInterval);
  $("msModePicker").classList.remove("hidden");
  $("msTwoSetup").classList.add("hidden");
  $("msPassScreen").classList.add("hidden");
  $("msPlay").classList.add("hidden");
  $("msRoundResult").classList.add("hidden");
}

function startMathSprintSolo() {
  msMode = "solo";
  msPlayers = [{ name: playerName || "Player", score: 0 }];
  msCurrentPlayerIndex = 0;
  $("msModePicker").classList.add("hidden");
  startMathSprintRound();
}

function startMathSprintTwo() {
  const p2 = ($("msP2Input").value || "").trim() || "Player 2";
  msMode = "two";
  msPlayers = [
    { name: playerName || "Player 1", score: 0 },
    { name: p2, score: 0 }
  ];
  msCurrentPlayerIndex = 0;
  $("msTwoSetup").classList.add("hidden");
  showPassScreen();
}

function showPassScreen() {
  $("msPlay").classList.add("hidden");
  $("msRoundResult").classList.add("hidden");
  $("msPassScreen").classList.remove("hidden");
  $("msPassName").textContent = msPlayers[msCurrentPlayerIndex].name;
}

function startMathSprintRound() {
  $("msPassScreen").classList.add("hidden");
  $("msPlay").classList.remove("hidden");
  $("msRoundResult").classList.add("hidden");

  msRoundActive = true;
  msQuestionLocked = false;
  msTimeLeft = MATH_SPRINT_SECONDS;
  $("msTimer").textContent = msTimeLeft;
  $("msTimer").classList.remove("warning");
  $("msCurrentPlayer").textContent = msPlayers[msCurrentPlayerIndex].name;
  $("msScore").textContent = msPlayers[msCurrentPlayerIndex].score;

  nextMathSprintQuestion();

  clearInterval(msTimerInterval);
  msTimerInterval = setInterval(() => {
    msTimeLeft--;
    $("msTimer").textContent = msTimeLeft;
    if (msTimeLeft <= 10) $("msTimer").classList.add("warning");
    if (msTimeLeft <= 0) {
      clearInterval(msTimerInterval);
      endMathSprintRound();
    }
  }, 1000);
}

function generateMathQuestion() {
  const ops = ["+", "-", "×", "÷"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;

  switch (op) {
    case "+":
      a = Math.floor(Math.random() * 90) + 10;
      b = Math.floor(Math.random() * 90) + 10;
      answer = a + b;
      break;
    case "-":
      a = Math.floor(Math.random() * 90) + 10;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case "×":
      a = Math.floor(Math.random() * 11) + 2;
      b = Math.floor(Math.random() * 11) + 2;
      answer = a * b;
      break;
    case "÷":
      b = Math.floor(Math.random() * 10) + 2;
      answer = Math.floor(Math.random() * 10) + 2;
      a = b * answer;
      break;
  }

  const options = new Set([answer]);
  while (options.size < 4) {
    const delta = Math.floor(Math.random() * 20) - 10;
    const wrong = answer + delta;
    if (wrong !== answer && wrong > 0) options.add(wrong);
  }

  return {
    question: `${a} ${op} ${b}`,
    answer: answer,
    options: shuffle([...options])
  };
}

function nextMathSprintQuestion() {
  msCurrentQuestion = generateMathQuestion();
  msQuestionLocked = false;
  $("msQuestion").textContent = msCurrentQuestion.question;

  const container = $("msOptions");
  container.innerHTML = "";
  msCurrentQuestion.options.forEach(opt => {
    const btn = el("button", "ms-option");
    btn.textContent = opt;
    btn.addEventListener("click", () => handleMathSprintAnswer(btn, opt));
    container.appendChild(btn);
  });
}

function handleMathSprintAnswer(btn, chosen) {
  if (msQuestionLocked || !msRoundActive) return;
  msQuestionLocked = true;

  const correct = msCurrentQuestion.answer;
  const buttons = $("msOptions").querySelectorAll(".ms-option");
  buttons.forEach(b => {
    b.disabled = true;
    if (parseInt(b.textContent, 10) === correct) b.classList.add("correct");
  });

  if (chosen === correct) {
    msPlayers[msCurrentPlayerIndex].score++;
    $("msScore").textContent = msPlayers[msCurrentPlayerIndex].score;
  } else {
    btn.classList.add("wrong");
  }

  setTimeout(() => {
    if (msRoundActive) nextMathSprintQuestion();
  }, 350);
}

function endMathSprintRound() {
  msRoundActive = false;
  clearInterval(msTimerInterval);
  $("msPlay").classList.add("hidden");
  $("msRoundResult").classList.remove("hidden");

  const score = msPlayers[msCurrentPlayerIndex].score;

  if (msMode === "solo") {
    const best = loadMathSprintBest();
    saveMathSprintBest(score);
    const isNewBest = score > best;

    $("msResultIcon").textContent = isNewBest ? "🏆" : "🎉";
    $("msResultTitle").textContent = isNewBest ? "New best score!" : "Time's up!";
    $("msResultMsg").textContent = isNewBest
      ? `You scored ${score} points — beating your old record of ${best}!`
      : `You scored ${score} points. Best: ${Math.max(score, best)}.`;
    $("msNextBtn").textContent = "Done";
  } else {
    const isLastPlayer = msCurrentPlayerIndex >= msPlayers.length - 1;

    if (!isLastPlayer) {
      $("msResultIcon").textContent = "🎯";
      $("msResultTitle").textContent = `${msPlayers[msCurrentPlayerIndex].name} scored ${score}!`;
      $("msResultMsg").textContent = `Pass the device to ${msPlayers[msCurrentPlayerIndex + 1].name}.`;
      $("msNextBtn").textContent = `Pass to ${msPlayers[msCurrentPlayerIndex + 1].name} →`;
    } else {
      // Final result — determine winner
      const p1 = msPlayers[0];
      const p2 = msPlayers[1];
      let winner;
      if (p1.score > p2.score) winner = p1;
      else if (p2.score > p1.score) winner = p2;
      else winner = null;

      $("msResultIcon").textContent = winner ? "🏆" : "🤝";
      $("msResultTitle").textContent = winner ? `${winner.name} wins!` : "It's a tie!";
      $("msResultMsg").textContent = `${p1.name}: ${p1.score} — ${p2.name}: ${p2.score}`;
      $("msNextBtn").textContent = "Play Again";
    }
  }
}

function handleMathSprintNext() {
  if (msMode === "solo") {
    openMathSprint();
    return;
  }
  // Two-player: advance to next player or restart
  const isLastPlayer = msCurrentPlayerIndex >= msPlayers.length - 1;
  if (!isLastPlayer) {
    msCurrentPlayerIndex++;
    showPassScreen();
  } else {
    openMathSprint();
  }
}

function handleMathSprintPlayAgain() {
  if (msMode === "solo") startMathSprintSolo();
  else if (msMode === "two") {
    msPlayers.forEach(p => p.score = 0);
    msCurrentPlayerIndex = 0;
    $("msRoundResult").classList.add("hidden");
    showPassScreen();
  }
}

function attachMathSprintListeners() {
  const soloBtn = $("msSoloBtn");
  const twoBtn = $("msTwoBtn");
  const backToModes = $("msBackToModes");
  const startTwoBtn = $("msStartTwoBtn");
  const readyBtn = $("msReadyBtn");
  const nextBtn = $("msNextBtn");
  const playAgainBtn = $("msPlayAgainBtn");

  if (soloBtn) soloBtn.addEventListener("click", startMathSprintSolo);
  if (twoBtn) {
    twoBtn.addEventListener("click", () => {
      $("msModePicker").classList.add("hidden");
      $("msTwoSetup").classList.remove("hidden");
      $("msP2Input").value = "";
      setTimeout(() => $("msP2Input").focus(), 100);
    });
  }
  if (backToModes) {
    backToModes.addEventListener("click", () => {
      $("msTwoSetup").classList.add("hidden");
      $("msModePicker").classList.remove("hidden");
    });
  }
  if (startTwoBtn) startTwoBtn.addEventListener("click", startMathSprintTwo);
  if (readyBtn) readyBtn.addEventListener("click", startMathSprintRound);
  if (nextBtn) nextBtn.addEventListener("click", handleMathSprintNext);
  if (playAgainBtn) playAgainBtn.addEventListener("click", handleMathSprintPlayAgain);
}

// ===================================================
// GLOBAL LISTENERS
// ===================================================
function attachGlobalListeners() {
  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => {
      const active = document.querySelector(".screen.active").id;
      if (active === "screen-topic") showScreen("screen-home");
      else if (active === "screen-study" || active === "screen-quiz") showScreen("screen-topic");
      else if (active === "screen-progress" ||
               active === "screen-calculator" ||
               active === "screen-dictionary" ||
               active === "screen-typing" ||
               active === "screen-games") showScreen("screen-home");
      else if (active === "screen-mathsprint") {
        clearInterval(msTimerInterval);
        msRoundActive = false;
        showScreen("screen-games");
      }
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
    if (confirm("Clear all your progress, study time, and quiz history?")) {
      progress = { totalAnswered: 0, totalCorrect: 0, bestPercent: 0 };
      quizHistory = [];
      typingStats = { lessonsDone: 0, bestWpm: 0 };
      studyTracker = { secondsToday: 0, unlockedAt: null, unlocksTotal: 0, lastUpdate: Date.now() };
      saveProgress();
      saveHistory();
      saveTypingStats();
      saveStudyTracker();
      updateStudyBanner();
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
// MEMORY MATCH
// ===================================================
function openMemoryMatch() {
  mmMode = null;
  mmPlayers = [];
  mmCurrentPlayerIndex = 0;
  mmFirstPick = null;
  mmLocked = false;
  mmMoves = 0;
  mmPairsFound = 0;
  mmExtraTurn = false;
  clearInterval(mmTimerInterval);
  mmStartTime = null;

  $("mmModePicker").classList.remove("hidden");
  $("mmTwoSetup").classList.add("hidden");
  $("mmPassScreen").classList.add("hidden");
  $("mmPlay").classList.add("hidden");
  $("mmResult").classList.add("hidden");
}

function startMemoryMatchSolo() {
  mmMode = "solo";
  mmPlayers = [{ name: playerName || "Player", pairs: 0 }];
  mmCurrentPlayerIndex = 0;
  mmTotalPairs = 6;
  $("mmModePicker").classList.add("hidden");
  buildMemoryBoard();
}

function startMemoryMatchTwo() {
  const p2 = ($("mmP2Input").value || "").trim() || "Player 2";
  mmMode = "two";
  mmPlayers = [
    { name: playerName || "Player 1", pairs: 0 },
    { name: p2, pairs: 0 }
  ];
  mmCurrentPlayerIndex = 0;
  mmTotalPairs = 6;
  $("mmTwoSetup").classList.add("hidden");
  showMemoryPassScreen();
}

function showMemoryPassScreen() {
  $("mmPlay").classList.add("hidden");
  $("mmResult").classList.add("hidden");
  $("mmPassScreen").classList.remove("hidden");
  $("mmPassName").textContent = mmPlayers[mmCurrentPlayerIndex].name;
}

function buildMemoryBoard() {
  $("mmPassScreen").classList.add("hidden");
  $("mmPlay").classList.remove("hidden");
  $("mmResult").classList.add("hidden");

  // Pick pairs randomly
  const pairs = shuffle([...MM_PAIR_POOL]).slice(0, mmTotalPairs);

  // Build cards array — each pair has 2 cards
  mmBoard = [];
  pairs.forEach((pair, pairId) => {
    mmBoard.push({ pairId, text: pair.a, matched: false });
    mmBoard.push({ pairId, text: pair.b, matched: false });
  });
  mmBoard = shuffle(mmBoard);

  // Reset state
  mmFirstPick = null;
  mmLocked = false;
  mmMoves = 0;
  mmPairsFound = 0;
  mmExtraTurn = false;
  mmStartTime = Date.now();

  renderMemoryBoard();
  updateMemoryTopbar();
  renderMemoryScores();

  clearInterval(mmTimerInterval);
  mmTimerInterval = setInterval(updateMemoryTopbar, 500);
}

function renderMemoryBoard() {
  const board = $("mmBoard");
  board.innerHTML = "";

  mmBoard.forEach((card, index) => {
    const btn = el("button", "mm-card" + (card.matched ? " matched" : ""));
    btn.dataset.index = index;
    btn.innerHTML = `
      <div class="mm-card-inner mm-front">?</div>
      <div class="mm-card-inner mm-back">${card.text}</div>
    `;
    btn.addEventListener("click", () => handleMemoryCardClick(index));
    board.appendChild(btn);
  });
}

function updateMemoryTopbar() {
  const nameEl = $("mmCurrentPlayer");
  const metaEl = $("mmMeta");
  if (!nameEl || !metaEl) return;

  nameEl.textContent = mmPlayers[mmCurrentPlayerIndex]?.name || "Player";

  const elapsed = mmStartTime ? Math.floor((Date.now() - mmStartTime) / 1000) : 0;
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;
  metaEl.textContent = `Moves: ${mmMoves} • ${timeStr}`;
}

function renderMemoryScores() {
  const scores = $("mmScores");
  if (!scores) return;
  scores.innerHTML = "";
  if (mmMode !== "two") return;

  mmPlayers.forEach((p, i) => {
    const div = el("div", "mm-score" + (i === mmCurrentPlayerIndex ? " active" : ""));
    div.innerHTML = `
      <span class="mm-score-name">${p.name}</span>
      <span class="mm-score-val">${p.pairs} pairs</span>
    `;
    scores.appendChild(div);
  });
}

function handleMemoryCardClick(index) {
  if (mmLocked) return;
  const card = mmBoard[index];
  if (card.matched) return;

  const cardEl = document.querySelector(`.mm-card[data-index="${index}"]`);
  if (!cardEl || cardEl.classList.contains("flipped")) return;

  // Flip the card
  cardEl.classList.add("flipped");

  // First pick
  if (mmFirstPick === null) {
    mmFirstPick = index;
    return;
  }

  // Second pick
  mmMoves++;
  const firstCard = mmBoard[mmFirstPick];
  const firstEl = document.querySelector(`.mm-card[data-index="${mmFirstPick}"]`);

  if (firstCard.pairId === card.pairId) {
    // Match!
    firstCard.matched = true;
    card.matched = true;
    firstEl.classList.add("matched");
    cardEl.classList.add("matched");
    mmPairsFound++;

    if (mmMode === "two") {
      mmPlayers[mmCurrentPlayerIndex].pairs++;
      mmExtraTurn = true;
    } else {
      mmPlayers[0].pairs++;
    }

    mmFirstPick = null;
    renderMemoryScores();
    updateMemoryTopbar();

    if (mmPairsFound >= mmTotalPairs) {
      setTimeout(endMemoryMatch, 600);
    }
  } else {
    // No match — flip back after a delay
    mmLocked = true;
    setTimeout(() => {
      firstEl.classList.remove("flipped");
      cardEl.classList.remove("flipped");
      mmFirstPick = null;
      mmLocked = false;

      if (mmMode === "two" && !mmExtraTurn) {
        // Next player's turn
        mmCurrentPlayerIndex = (mmCurrentPlayerIndex + 1) % mmPlayers.length;
        updateMemoryTopbar();
        renderMemoryScores();
      }
      mmExtraTurn = false;
    }, 900);
  }
}

function endMemoryMatch() {
  clearInterval(mmTimerInterval);
  $("mmPlay").classList.add("hidden");
  $("mmResult").classList.remove("hidden");

  const elapsed = mmStartTime ? Math.floor((Date.now() - mmStartTime) / 1000) : 0;
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;

  if (mmMode === "solo") {
    $("mmResultIcon").textContent = "🎉";
    $("mmResultTitle").textContent = "All pairs found!";
    $("mmResultMsg").textContent = `Finished in ${mmMoves} moves (${timeStr}).`;
  } else {
    const p1 = mmPlayers[0];
    const p2 = mmPlayers[1];
    let winner;
    if (p1.pairs > p2.pairs) winner = p1;
    else if (p2.pairs > p1.pairs) winner = p2;
    else winner = null;

    $("mmResultIcon").textContent = winner ? "🏆" : "🤝";
    $("mmResultTitle").textContent = winner ? `${winner.name} wins!` : "It's a tie!";
    $("mmResultMsg").textContent = `${p1.name}: ${p1.pairs} pairs — ${p2.name}: ${p2.pairs} pairs (${mmMoves} total moves)`;
  }
}

function attachMemoryMatchListeners() {
  const soloBtn = $("mmSoloBtn");
  const twoBtn = $("mmTwoBtn");
  const backToModes = $("mmBackToModes");
  const startTwoBtn = $("mmStartTwoBtn");
  const readyBtn = $("mmReadyBtn");
  const quitBtn = $("mmQuitBtn");
  const restartBtn = $("mmRestartBtn");
  const playAgainBtn = $("mmPlayAgainBtn");
  const doneBtn = $("mmDoneBtn");

  if (soloBtn) soloBtn.addEventListener("click", startMemoryMatchSolo);
  if (twoBtn) {
    twoBtn.addEventListener("click", () => {
      $("mmModePicker").classList.add("hidden");
      $("mmTwoSetup").classList.remove("hidden");
      $("mmP2Input").value = "";
      setTimeout(() => $("mmP2Input").focus(), 100);
    });
  }
  if (backToModes) {
    backToModes.addEventListener("click", () => {
      $("mmTwoSetup").classList.add("hidden");
      $("mmModePicker").classList.remove("hidden");
    });
  }
  if (startTwoBtn) startTwoBtn.addEventListener("click", startMemoryMatchTwo);
  if (readyBtn) readyBtn.addEventListener("click", buildMemoryBoard);
  if (quitBtn) quitBtn.addEventListener("click", () => {
    clearInterval(mmTimerInterval);
    showScreen("screen-games");
  });
  if (restartBtn) restartBtn.addEventListener("click", () => {
    clearInterval(mmTimerInterval);
    openMemoryMatch();
  });
  if (playAgainBtn) playAgainBtn.addEventListener("click", () => {
    if (mmMode === "solo") startMemoryMatchSolo();
    else if (mmMode === "two") {
      mmPlayers.forEach(p => p.pairs = 0);
      mmCurrentPlayerIndex = 0;
      showMemoryPassScreen();
    }
  });
  if (doneBtn) doneBtn.addEventListener("click", () => {
    clearInterval(mmTimerInterval);
    showScreen("screen-games");
  });
}// ===================================================
// SPELLING BEE
// ===================================================
function openSpellingBee() {
  sbLevel = null;
  sbMode = null;
  sbPlayers = [];
  sbCurrentPlayerIndex = 0;
  sbWords = [];
  sbWordIndex = 0;
  sbRoundActive = false;
  sbWordLocked = false;

  $("sbSetup").classList.remove("hidden");
  $("sbTwoSetup").classList.add("hidden");
  $("sbPassScreen").classList.add("hidden");
  $("sbPlay").classList.add("hidden");
  $("sbResult").classList.add("hidden");

  // Reset level selection
  document.querySelectorAll(".sb-level-card").forEach(c => c.classList.remove("selected"));
  // Default to easy
  selectSpellingLevel("easy");
}

function selectSpellingLevel(level) {
  sbLevel = level;
  document.querySelectorAll(".sb-level-card").forEach(c => {
    c.classList.toggle("selected", c.dataset.level === level);
  });
}

function startSpellingBeeSolo() {
  if (!sbLevel) return;
  sbMode = "solo";
  sbPlayers = [{ name: playerName || "Player", score: 0 }];
  sbCurrentPlayerIndex = 0;
  prepareSpellingRound();
  $("sbSetup").classList.add("hidden");
  startSpellingPlay();
}

function startSpellingBeeTwo() {
  if (!sbLevel) return;
  const p2 = ($("sbP2Input").value || "").trim() || "Player 2";
  sbMode = "two";
  sbPlayers = [
    { name: playerName || "Player 1", score: 0 },
    { name: p2, score: 0 }
  ];
  sbCurrentPlayerIndex = 0;
  prepareSpellingRound();
  $("sbTwoSetup").classList.add("hidden");
  showSpellingPassScreen();
}

function prepareSpellingRound() {
  // Pick words at random from the level's pool
  const pool = SB_WORDS[sbLevel] || SB_WORDS.easy;
  const shuffled = shuffle([...pool]);
  sbWords = shuffled.slice(0, Math.min(sbRoundLength, shuffled.length));
  sbWordIndex = 0;
}

function showSpellingPassScreen() {
  $("sbPlay").classList.add("hidden");
  $("sbResult").classList.add("hidden");
  $("sbPassScreen").classList.remove("hidden");
  $("sbPassName").textContent = sbPlayers[sbCurrentPlayerIndex].name;
}

function startSpellingPlay() {
  $("sbPassScreen").classList.add("hidden");
  $("sbPlay").classList.remove("hidden");
  $("sbResult").classList.add("hidden");
  sbRoundActive = true;
  sbWordLocked = false;
  sbWordIndex = 0;
  renderSpellingWord();
}

function renderSpellingWord() {
  if (sbWordIndex >= sbWords.length) {
    endSpellingRound();
    return;
  }

  sbWordLocked = false;
  const word = sbWords[sbWordIndex];

  $("sbCurrentPlayer").textContent = sbPlayers[sbCurrentPlayerIndex].name;
  $("sbProgressLabel").textContent = `Word ${sbWordIndex + 1} of ${sbWords.length}`;

  const input = $("sbInput");
  input.value = "";
  input.disabled = false;
  input.classList.remove("correct", "wrong");
  $("sbFeedback").textContent = "";
  $("sbFeedback").className = "sb-feedback";

  // Auto-play the word after a short delay
  setTimeout(() => {
    if (sbRoundActive) speakWord(word, $("sbPlayBtn"));
  }, 200);

  setTimeout(() => input.focus(), 100);
}

function handleSpellingSubmit() {
  if (sbWordLocked || !sbRoundActive) return;

  const input = $("sbInput");
  const typed = (input.value || "").trim().toLowerCase();
  const correct = sbWords[sbWordIndex].toLowerCase();

  if (!typed) return;

  sbWordLocked = true;
  input.disabled = true;

  if (typed === correct) {
    sbPlayers[sbCurrentPlayerIndex].score++;
    input.classList.add("correct");
    $("sbFeedback").textContent = "✅ Correct!";
    $("sbFeedback").className = "sb-feedback correct";
  } else {
    input.classList.add("wrong");
    $("sbFeedback").textContent = `❌ Correct spelling: ${correct}`;
    $("sbFeedback").className = "sb-feedback wrong";
  }

  // Next word after a delay
  setTimeout(() => {
    if (!sbRoundActive) return;

    if (sbMode === "two") {
      // Alternate players each word
      sbCurrentPlayerIndex = (sbCurrentPlayerIndex + 1) % sbPlayers.length;
    }

    sbWordIndex++;

    if (sbWordIndex >= sbWords.length) {
      endSpellingRound();
    } else {
      if (sbMode === "two") {
        // Show pass screen between turns
        showSpellingPassScreen();
        // But we need to auto-resume from pass screen
        // Rebind ready button for this flow
        const readyBtn = $("sbReadyBtn");
        readyBtn.onclick = () => startSpellingPlay();
      } else {
        renderSpellingWord();
      }
    }
  }, 1400);
}

function handleSpellingSkip() {
  if (sbWordLocked || !sbRoundActive) return;
  sbWordLocked = true;

  const correct = sbWords[sbWordIndex].toLowerCase();
  $("sbInput").classList.add("wrong");
  $("sbInput").disabled = true;
  $("sbFeedback").textContent = `Skipped — correct spelling: ${correct}`;
  $("sbFeedback").className = "sb-feedback wrong";

  setTimeout(() => {
    if (!sbRoundActive) return;
    if (sbMode === "two") {
      sbCurrentPlayerIndex = (sbCurrentPlayerIndex + 1) % sbPlayers.length;
    }
    sbWordIndex++;
    if (sbWordIndex >= sbWords.length) endSpellingRound();
    else if (sbMode === "two") {
      showSpellingPassScreen();
      $("sbReadyBtn").onclick = () => startSpellingPlay();
    } else {
      renderSpellingWord();
    }
  }, 1400);
}

function endSpellingRound() {
  sbRoundActive = false;
  $("sbPlay").classList.add("hidden");
  $("sbResult").classList.remove("hidden");

  if (sbMode === "solo") {
    const score = sbPlayers[0].score;
    const total = sbWords.length;
    const pct = Math.round((score / total) * 100);

    let title = "Well done!";
    let icon = "🎉";
    if (pct === 100) { title = "Perfect!"; icon = "🏆"; }
    else if (pct >= 80) { title = "Excellent!"; icon = "🌟"; }
    else if (pct >= 60) { title = "Good job!"; icon = "👍"; }
    else { title = "Keep practising!"; icon = "💪"; }

    $("sbResultIcon").textContent = icon;
    $("sbResultTitle").textContent = title;
    $("sbResultMsg").textContent = `You got ${score} of ${total} correct (${pct}%).`;
  } else {
    const p1 = sbPlayers[0];
    const p2 = sbPlayers[1];
    let winner;
    if (p1.score > p2.score) winner = p1;
    else if (p2.score > p1.score) winner = p2;
    else winner = null;

    $("sbResultIcon").textContent = winner ? "🏆" : "🤝";
    $("sbResultTitle").textContent = winner ? `${winner.name} wins!` : "It's a tie!";
    $("sbResultMsg").textContent = `${p1.name}: ${p1.score} — ${p2.name}: ${p2.score}`;
  }
}

function attachSpellingBeeListeners() {
  document.querySelectorAll(".sb-level-card").forEach(card => {
    card.addEventListener("click", () => selectSpellingLevel(card.dataset.level));
  });

  const soloBtn = $("sbSoloBtn");
  const twoBtn = $("sbTwoBtn");
  const backBtn = $("sbBackToSetup");
  const startTwoBtn = $("sbStartTwoBtn");
  const readyBtn = $("sbReadyBtn");
  const submitBtn = $("sbSubmitBtn");
  const skipBtn = $("sbSkipBtn");
  const playBtn = $("sbPlayBtn");
  const input = $("sbInput");
  const playAgainBtn = $("sbPlayAgainBtn");
  const doneBtn = $("sbDoneBtn");

  if (soloBtn) soloBtn.addEventListener("click", startSpellingBeeSolo);
  if (twoBtn) {
    twoBtn.addEventListener("click", () => {
      $("sbSetup").classList.add("hidden");
      $("sbTwoSetup").classList.remove("hidden");
      $("sbP2Input").value = "";
      setTimeout(() => $("sbP2Input").focus(), 100);
    });
  }
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      $("sbTwoSetup").classList.add("hidden");
      $("sbSetup").classList.remove("hidden");
    });
  }
  if (startTwoBtn) startTwoBtn.addEventListener("click", startSpellingBeeTwo);
  if (readyBtn) {
    readyBtn.addEventListener("click", () => startSpellingPlay());
  }
  if (submitBtn) submitBtn.addEventListener("click", handleSpellingSubmit);
  if (skipBtn) skipBtn.addEventListener("click", handleSpellingSkip);
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (sbRoundActive && !sbWordLocked) {
        speakWord(sbWords[sbWordIndex], playBtn);
      }
    });
  }
  if (input) {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSpellingSubmit();
      }
    });
  }
  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => {
      if (sbMode === "solo") startSpellingBeeSolo();
      else if (sbMode === "two") {
        sbPlayers.forEach(p => p.score = 0);
        sbCurrentPlayerIndex = 0;
        prepareSpellingRound();
        showSpellingPassScreen();
        $("sbReadyBtn").onclick = () => startSpellingPlay();
      }
    });
  }
  if (doneBtn) doneBtn.addEventListener("click", () => showScreen("screen-games"));
}
// ===================================================
// GO
// ===================================================
boot();