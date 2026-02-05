(function () {
  "use strict";

  // ── State ──
  let allWords = [];
  let filtered = [];
  let currentIndex = 0;
  let revealed = false;
  // mode: "en" = EN→CZ (show EN first, click reveals CZ side)
  // mode: "cz" = CZ→EN (show CZ side first, click reveals EN)
  let mode = "en";
  let activeFilter = "all";
  let savedVersion = null;

  // ── localStorage helpers ──
  const LS_RATINGS = "flashcards_ratings";
  const LS_VERSION = "flashcards_version";

  function loadLocalRatings() {
    try {
      return JSON.parse(localStorage.getItem(LS_RATINGS) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveLocalRating(en, rating) {
    const ratings = loadLocalRatings();
    ratings[en] = rating;
    localStorage.setItem(LS_RATINGS, JSON.stringify(ratings));
  }

  function getEffectiveRating(word) {
    const local = loadLocalRatings();
    return local[word.en] !== undefined ? local[word.en] : word.rating;
  }

  // ── DOM refs ──
  const counter = document.getElementById("counter");
  const card = document.getElementById("card");
  const sideEn = document.getElementById("sideEn");
  const sideCz = document.getElementById("sideCz");
  const enWord = document.getElementById("enWord");
  const enPron = document.getElementById("enPron");
  const enExample = document.getElementById("enExample");
  const czWord = document.getElementById("czWord");
  const czMeaning = document.getElementById("czMeaning");
  const czExample = document.getElementById("czExample");
  const ratingBar = document.getElementById("ratingBar");
  const banner = document.getElementById("banner");
  const cardArea = document.getElementById("cardArea");
  const modeBtn = document.getElementById("modeBtn");
  const modalOverlay = document.getElementById("modalOverlay");

  // ── Data loading ──
  async function loadData() {
    try {
      const [vocabRes, latestRes] = await Promise.all([
        fetch("data/vocab.json"),
        fetch("data/latest.json"),
      ]);
      allWords = await vocabRes.json();
      const latest = await latestRes.json();

      if (savedVersion && savedVersion !== latest.version) {
        banner.classList.add("visible");
      }
      savedVersion = latest.version;
      localStorage.setItem(LS_VERSION, latest.version);
    } catch (err) {
      console.error("Failed to load data:", err);
      cardArea.innerHTML =
        '<div class="empty-state">Could not load data. Are you online?</div>';
      return;
    }

    applyFilter();
    renderCard();
  }

  // ── Filtering ──
  function applyFilter() {
    filtered = allWords.filter((w) => {
      const r = getEffectiveRating(w);
      switch (activeFilter) {
        case "weak":
          return r <= 2;
        case "medium":
          return r === 3;
        case "strong":
          return r >= 4;
        default:
          return true;
      }
    });
    currentIndex = 0;
    revealed = false;
  }

  // ── Rendering ──
  function renderCard() {
    if (filtered.length === 0) {
      card.style.display = "none";
      cardArea.innerHTML =
        '<div class="empty-state">No cards match the filter.</div>';
      counter.textContent = "0 / 0";
      return;
    }

    // Restore card if hidden
    if (!cardArea.contains(card)) {
      cardArea.innerHTML = "";
      cardArea.appendChild(card);
    }
    card.style.display = "";

    const w = filtered[currentIndex];
    const r = getEffectiveRating(w);

    // Fill both sides with data
    enWord.textContent = w.en;
    enPron.textContent = w.pron || "";
    enExample.textContent = w.example || "";
    czWord.textContent = w.cz || "";
    czMeaning.textContent = w.meaning_en || "";
    czExample.textContent = w.example || "";

    // Show appropriate side based on mode
    revealed = false;
    showInitialSide();

    card.classList.remove("slide-left", "slide-right");
    counter.textContent = `${currentIndex + 1} / ${filtered.length}  (★${r})`;
  }

  function showInitialSide() {
    if (mode === "en") {
      // EN → CZ: show EN side first, example will show on CZ side
      sideEn.classList.add("visible");
      sideCz.classList.remove("visible");
      enExample.style.display = "none";
      czExample.style.display = "";
    } else {
      // CZ → EN: show CZ side first (without example - it's a hint!)
      sideEn.classList.remove("visible");
      sideCz.classList.add("visible");
      enExample.style.display = "";
      czExample.style.display = "none";
    }
  }

  function revealAnswer() {
    if (filtered.length === 0 || revealed) return;
    revealed = true;

    if (mode === "en") {
      // EN → CZ: reveal CZ side
      sideEn.classList.remove("visible");
      sideCz.classList.add("visible");
    } else {
      // CZ → EN: reveal EN side
      sideCz.classList.remove("visible");
      sideEn.classList.add("visible");
    }
  }

  // ── Navigation ──
  function goNext() {
    if (filtered.length === 0) return;
    currentIndex = (currentIndex + 1) % filtered.length;
    renderCard();
  }

  function goPrev() {
    if (filtered.length === 0) return;
    currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
    renderCard();
  }

  // ── Swipe ──
  let touchStartX = 0;
  let touchStartY = 0;

  cardArea.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  });

  cardArea.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) {
      // Tap or vertical scroll
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        revealAnswer();
      }
      return;
    }

    if (dx < 0) {
      card.classList.add("slide-left");
      setTimeout(goNext, 250);
    } else {
      card.classList.add("slide-right");
      setTimeout(goPrev, 250);
    }
  });

  // ── Card click (desktop) ──
  card.addEventListener("click", () => {
    revealAnswer();
  });

  // ── Keyboard ──
  document.addEventListener("keydown", (e) => {
    if (modalOverlay.classList.contains("visible")) return;

    switch (e.key) {
      case "ArrowRight":
        goNext();
        break;
      case "ArrowLeft":
        goPrev();
        break;
      case " ":
        e.preventDefault();
        revealAnswer();
        break;
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
        rateCurrentCard(parseInt(e.key));
        break;
    }
  });

  // ── Rating ──
  function rateCurrentCard(rating) {
    if (filtered.length === 0) return;
    const w = filtered[currentIndex];
    saveLocalRating(w.en, rating);
    goNext();
  }

  ratingBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".rating-btn");
    if (!btn) return;
    rateCurrentCard(parseInt(btn.dataset.rating));
  });

  // ── Filter buttons ──
  document.getElementById("controls").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;

    document.querySelectorAll("[data-filter]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    applyFilter();
    renderCard();
  });

  // ── Shuffle ──
  document.getElementById("shuffleBtn").addEventListener("click", () => {
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    currentIndex = 0;
    renderCard();
  });

  // ── Mode toggle ──
  modeBtn.addEventListener("click", () => {
    mode = mode === "en" ? "cz" : "en";
    modeBtn.textContent = mode === "en" ? "EN → CZ" : "CZ → EN";
    renderCard();
  });

  // ── Nav buttons ──
  document.getElementById("prevBtn").addEventListener("click", goPrev);
  document.getElementById("nextBtn").addEventListener("click", goNext);

  // ── Settings modal ──
  document.getElementById("settingsBtn").addEventListener("click", () => {
    modalOverlay.classList.add("visible");
  });

  document.getElementById("closeModal").addEventListener("click", () => {
    modalOverlay.classList.remove("visible");
  });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove("visible");
  });

  // ── Banner ──
  banner.addEventListener("click", () => {
    location.reload();
  });

  // ── Service Worker ──
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }

  // ── Init ──
  savedVersion = localStorage.getItem(LS_VERSION);
  loadData();
})();
