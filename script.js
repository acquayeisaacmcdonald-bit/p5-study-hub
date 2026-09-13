// =========================================================
// 1. DATA & STORAGE
// =========================================================

const DEFAULT_CARDS = [
  { question: "What is the capital of Ghana?", answer: "Accra", category: "Geography", difficulty: "easy" },
  { question: "What is 7 × 8?", answer: "56", category: "Math", difficulty: "easy" },
  { question: "Who wrote 'Things Fall Apart'?", answer: "Chinua Achebe", category: "Literature", difficulty: "medium" },
  { question: "What is the chemical symbol for water?", answer: "H₂O", category: "Science", difficulty: "easy" },
  { question: "What year did Ghana gain independence?", answer: "1957", category: "History", difficulty: "medium" },
  { question: "What is the derivative of sin(x)?", answer: "cos(x)", category: "Math", difficulty: "hard" },
  { question: "What is the largest planet in our solar system?", answer: "Jupiter", category: "Science", difficulty: "easy" },
  { question: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci", category: "Art", difficulty: "medium" }
];

const STORAGE_KEYS = {
  cards: "flashcards.cards",
  history: "flashcards.history"
};

// Load from localStorage, or fall back to defaults
function loadCards() {
  const raw = localStorage.getItem(STORAGE_KEYS.cards);
  if (!raw) return [...DEFAULT_CARDS];
  try { return JSON.parse(raw); } catch { return [...DEFAULT_CARDS]; }
}
function saveCards() {
  localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(cards));
}

function loadHistory() {
  const raw = localStorage.getItem(STORAGE_KEYS.history);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
function saveHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(quizHistory));
}

let cards = loadCards();
let quizHistory = loadHistory();

// =========================================================
// 2. TABS
// =========================================================

const tabButtons = document.querySelectorAll(".tab");
const tabPanels = document.querySelectorAll(".tab-panel");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabPanels.forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");

    if (btn.dataset.tab === "manage") renderCardList();
    if (btn.dataset.tab === "stats") renderStats();
    if (btn.dataset.tab === "study") renderStudyCard();
  });
});

// =========================================================
// 3. STUDY MODE
// =========================================================

let studyDeck = [];
let studyIndex = 0;

const cardEl = document.getElementById("card");
const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const frontBadge = document.getElementById("frontBadge");
const backBadge = document.getElementById("backBadge");
const progressEl = document.getElementById("progress");

const studyCategory = document.getElementById("studyCategory");
const studyDifficulty = document.getElementById("studyDifficulty");

function buildStudyDeck() {
  const cat = studyCategory.value;
  const diff = studyDifficulty.value;
  studyDeck = cards.filter(c =>
    (cat === "all" || c.category === cat) &&
    (diff === "all" || c.difficulty === diff)
  );
  studyIndex = 0;
}

function renderStudyCard() {
  buildStudyDeck();

  if (studyDeck.length === 0) {
    questionEl.textContent = "No cards match your filters.";
    answerEl.textContent = "Try different filters or add cards.";
    frontBadge.textContent = "";
    backBadge.textContent = "";
    progressEl.textContent = "0 of 0";
    return;
  }

  const card = studyDeck[studyIndex];
  questionEl.textContent = card.question;
  answerEl.textContent = card.answer;
  frontBadge.textContent = `${card.category} • ${card.difficulty}`;
  backBadge.textContent = card.category;
  progressEl.textContent = `Card ${studyIndex + 1} of ${studyDeck.length}`;
  cardEl.classList.remove("flipped");
}

function flipCard() { cardEl.classList.toggle("flipped"); }
function nextCard() {
  if (studyDeck.length === 0) return;
  studyIndex = (studyIndex + 1) % studyDeck.length;
  renderStudyCard();
}
function prevCard() {
  if (studyDeck.length === 0) return;
  studyIndex = (studyIndex - 1 + studyDeck.length) % studyDeck.length;
  renderStudyCard();
}

document.getElementById("nextBtn").addEventListener("click", nextCard);
document.getElementById("prevBtn").addEventListener("click", prevCard);
document.getElementById("flipBtn").addEventListener("click", flipCard);
cardEl.addEventListener("click", flipCard);
studyCategory.addEventListener("change", renderStudyCard);
studyDifficulty.addEventListener("change", renderStudyCard);

// Keyboard shortcuts
document.addEventListener("keydown", e => {
  if (!document.getElementById("study").classList.contains("active")) return;
  if (e.key === "ArrowRight") nextCard();
  if (e.key === "ArrowLeft") prevCard();
  if (e.key === " ") { e.preventDefault(); flipCard(); }
});

// =========================================================
// 4. QUIZ MODE
// =========================================================

let quizDeck = [];
let quizIndex = 0;
let quizScore = 0;
let quizLocked = false;

const quizSetup = document.getElementById("quizSetup");
const quizPlay = document.getElementById("quizPlay");
const quizResult = document.getElementById("quizResult");
const quizCategory = document.getElementById("quizCategory");
const quizDifficulty = document.getElementById("quizDifficulty");
const quizLength = document.getElementById("quizLength");
const quizProgress = document.getElementById("quizProgress");
const quizQuestion = document.getElementById("quizQuestion");
const quizOptions = document.getElementById("quizOptions");
const quizFeedback = document.getElementById("quizFeedback");

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startQuiz() {
  const cat = quizCategory.value;
  const diff = quizDifficulty.value;
  const pool = cards.filter(c =>
    (cat === "all" || c.category === cat) &&
    (diff === "all" || c.difficulty === diff)
  );

  if (pool.length < 2) {
    alert("You need at least 2 cards in this filter to run a quiz.");
    return;
  }

  const requested = Math.max(1, Math.min(parseInt(quizLength.value) || 5, pool.length));
  quizDeck = shuffle(pool).slice(0, requested);
  quizIndex = 0;
  quizScore = 0;
  quizLocked = false;

  quizSetup.classList.add("hidden");
  quizResult.classList.add("hidden");
  quizPlay.classList.remove("hidden");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  quizLocked = false;
  quizFeedback.textContent = "";
  const current = quizDeck[quizIndex];

  quizProgress.textContent = `Question ${quizIndex + 1} of ${quizDeck.length}`;
  quizQuestion.textContent = current.question;

  // Build options: correct answer + 3 distractors from other cards
  const distractors = shuffle(
    cards.filter(c => c.answer !== current.answer).map(c => c.answer)
  ).slice(0, 3);

  const options = shuffle([current.answer, ...distractors]);

  quizOptions.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleAnswer(btn, opt, current.answer));
    quizOptions.appendChild(btn);
  });
}

function handleAnswer(btn, chosen, correct) {
  if (quizLocked) return;
  quizLocked = true;

  const buttons = quizOptions.querySelectorAll(".quiz-option");
  buttons.forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
  });

  if (chosen === correct) {
    quizScore++;
    quizFeedback.textContent = "✅ Correct!";
    quizFeedback.style.color = "#34d399";
  } else {
    btn.classList.add("wrong");
    quizFeedback.textContent = `❌ Wrong — the answer is "${correct}"`;
    quizFeedback.style.color = "#f87171";
  }

  setTimeout(() => {
    quizIndex++;
    if (quizIndex < quizDeck.length) {
      renderQuizQuestion();
    } else {
      finishQuiz();
    }
  }, 1200);
}

function finishQuiz() {
  quizPlay.classList.add("hidden");
  quizResult.classList.remove("hidden");

  const pct = Math.round((quizScore / quizDeck.length) * 100);
  document.getElementById("finalScore").textContent =
    `You scored ${quizScore} / ${quizDeck.length} (${pct}%)`;

  let msg = "";
  if (pct === 100) msg = "Perfect! 🏆";
  else if (pct >= 80) msg = "Excellent work! 🌟";
  else if (pct >= 60) msg = "Good effort — keep practicing!";
  else msg = "Keep going, you'll get there! 💪";
  document.getElementById("scoreMessage").textContent = msg;

  // Save to history
  quizHistory.unshift({
    date: new Date().toLocaleString(),
    score: quizScore,
    total: quizDeck.length,
    pct
  });
  quizHistory = quizHistory.slice(0, 20); // keep last 20
  saveHistory();
}

document.getElementById("startQuizBtn").addEventListener("click", startQuiz);
document.getElementById("restartQuizBtn").addEventListener("click", () => {
  quizResult.classList.add("hidden");
  quizSetup.classList.remove("hidden");
});

// =========================================================
// 5. MANAGE CARDS
// =========================================================

const addCardForm = document.getElementById("addCardForm");
const cardList = document.getElementById("cardList");
const cardCount = document.getElementById("cardCount");

addCardForm.addEventListener("submit", e => {
  e.preventDefault();
  const newCard = {
    question: document.getElementById("newQuestion").value.trim(),
    answer: document.getElementById("newAnswer").value.trim(),
    category: document.getElementById("newCategory").value.trim() || "General",
    difficulty: document.getElementById("newDifficulty").value
  };
  if (!newCard.question || !newCard.answer) return;

  cards.push(newCard);
  saveCards();
  addCardForm.reset();
  document.getElementById("newDifficulty").value = "medium";
  renderCardList();
  populateCategoryDropdowns();
});

function renderCardList() {
  cardCount.textContent = cards.length;
  cardList.innerHTML = "";

  if (cards.length === 0) {
    cardList.innerHTML = '<p style="opacity:0.6;text-align:center;padding:12px">No cards yet.</p>';
    return;
  }

  cards.forEach((c, i) => {
    const item = document.createElement("div");
    item.className = "card-item";
    item.innerHTML = `
      <div class="card-item-info">
        <div class="card-item-q">${escapeHtml(c.question)}</div>
        <div class="card-item-meta">${escapeHtml(c.category)} • ${c.difficulty}</div>
      </div>
      <button data-index="${i}">Delete</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      cards.splice(i, 1);
      saveCards();
      renderCardList();
      populateCategoryDropdowns();
    });
    cardList.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Reset to default cards? This will delete your custom cards.")) {
    cards = [...DEFAULT_CARDS];
    saveCards();
    renderCardList();
    populateCategoryDropdowns();
  }
});

// =========================================================
// 6. STATS
// =========================================================

function renderStats() {
  document.getElementById("statTotalCards").textContent = cards.length;
  document.getElementById("statQuizzes").textContent = quizHistory.length;

  if (quizHistory.length === 0) {
    document.getElementById("statBest").textContent = "0%";
    document.getElementById("statAvg").textContent = "0%";
  } else {
    const best = Math.max(...quizHistory.map(h => h.pct));
    const avg = Math.round(
      quizHistory.reduce((sum, h) => sum + h.pct, 0) / quizHistory.length
    );
    document.getElementById("statBest").textContent = `${best}%`;
    document.getElementById("statAvg").textContent = `${avg}%`;
  }

  const historyEl = document.getElementById("quizHistory");
  historyEl.innerHTML = "";
  if (quizHistory.length === 0) {
    historyEl.innerHTML = '<li class="empty">No quizzes taken yet.</li>';
  } else {
    quizHistory.forEach(h => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${h.date}</span><span>${h.score}/${h.total} (${h.pct}%)</span>`;
      historyEl.appendChild(li);
    });
  }
}

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  if (confirm("Clear all quiz history?")) {
    quizHistory = [];
    saveHistory();
    renderStats();
  }
});

// =========================================================
// 7. INIT
// =========================================================

function populateCategoryDropdowns() {
  const categories = ["all", ...new Set(cards.map(c => c.category))];
  [studyCategory, quizCategory].forEach(sel => {
    const current = sel.value;
    sel.innerHTML = "";
    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat === "all" ? "All categories" : cat;
      sel.appendChild(opt);
    });
    if (categories.includes(current)) sel.value = current;
  });
}

function init() {
  populateCategoryDropdowns();
  renderStudyCard();
  renderCardList();
}

init();