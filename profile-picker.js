// ============================================================
// Study Hub — Profile Picker
// Photos are stored locally in IndexedDB. Never uploaded anywhere.
// ============================================================

const DB_NAME = "study-hub-media";
const STORE   = "photos";

// ---------- IndexedDB helpers ----------
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function getPhoto(key) {
  if (!key) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => reject(req.error);
  });
}

async function setPhoto(key, dataUrl) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function deletePhoto(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

// ---------- Load profiles and render ----------
let profiles = [];

async function loadProfiles() {
  const res = await fetch("data/profiles.json");
  const data = await res.json();
  profiles = data.profiles;
}

async function renderGrid() {
  const grid = document.getElementById("profileGrid");
  grid.innerHTML = "";

  for (const p of profiles) {
    const card = document.createElement("button");
    card.className = "profile-card";
    card.style.borderColor = p.colour || "#ccc";

    const avatar = document.createElement("div");
    avatar.className = "profile-avatar";
    avatar.style.background = p.colour || "#eee";

    const photo = await getPhoto(p.photoKey);
    if (photo) {
      avatar.style.backgroundImage = `url(${photo})`;
      avatar.textContent = "";
    } else {
      avatar.textContent = p.emoji || "👤";
    }

    const name = document.createElement("div");
    name.className = "profile-name";
    name.textContent = p.name;

    const cls = document.createElement("div");
    cls.className = "profile-class";
    cls.textContent = p.className || "";

    card.appendChild(avatar);
    card.appendChild(name);
    card.appendChild(cls);

    card.addEventListener("click", () => selectProfile(p));
    grid.appendChild(card);
  }
}

// ---------- Selecting a profile ----------
function selectProfile(profile) {
  // Save the WHOLE profile object so the app can personalize
  localStorage.setItem("activeProfile", JSON.stringify(profile));

  if (profile.class) {
    window.location.href = `index.html?class=${profile.class}&profile=${profile.id}`;
  } else {
    window.location.href = "class-picker.html";
  }
}

// ---------- Photo management ----------
function openPhotoModal() {
  document.getElementById("photoModal").classList.remove("hidden");
  renderPhotoList();
}

function closePhotoModal() {
  document.getElementById("photoModal").classList.add("hidden");
  renderGrid();
}

async function renderPhotoList() {
  const list = document.getElementById("photoList");
  list.innerHTML = "";

  for (const p of profiles) {
    if (!p.photoKey) continue;

    const row = document.createElement("div");
    row.className = "photo-row";

    const photo = await getPhoto(p.photoKey);
    if (photo) {
      const img = document.createElement("img");
      img.src = photo;
      row.appendChild(img);
    } else {
      const mini = document.createElement("div");
      mini.className = "mini-avatar";
      mini.textContent = p.emoji || "👤";
      row.appendChild(mini);
    }

    const nameEl = document.createElement("div");
    nameEl.className = "row-name";
    nameEl.textContent = p.name;
    row.appendChild(nameEl);

    const btn = document.createElement("button");
    btn.textContent = photo ? "Change" : "Add photo";
    btn.onclick = () => pickPhotoFor(p);
    row.appendChild(btn);

    if (photo) {
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.className = "remove";
      removeBtn.onclick = async () => {
        await deletePhoto(p.photoKey);
        renderPhotoList();
      };
      row.appendChild(removeBtn);
    }

    list.appendChild(row);
  }
}

let pendingProfile = null;

function pickPhotoFor(profile) {
  pendingProfile = profile;
  document.getElementById("photoInput").click();
}

async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file || !pendingProfile) return;

  const dataUrl = await resizeImage(file, 512);
  await setPhoto(pendingProfile.photoKey, dataUrl);

  event.target.value = "";
  pendingProfile = null;
  renderPhotoList();
}

function resizeImage(file, maxSize) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Boot ----------
(async function init() {
  await loadProfiles();
  await renderGrid();

  document.getElementById("managePhotosBtn").addEventListener("click", openPhotoModal);
  document.getElementById("closeModalBtn").addEventListener("click", closePhotoModal);
  document.getElementById("photoInput").addEventListener("change", handlePhotoUpload);

  document.getElementById("photoModal").addEventListener("click", (e) => {
    if (e.target.id === "photoModal") closePhotoModal();
  });
})();