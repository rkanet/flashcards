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
  let savedVersion = null;

  // ── localStorage helpers ──
  const LS_VERSION = "flashcards_version";

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
    filtered = allWords.slice();
    currentIndex = 0;
    revealed = false;
  }

  // ── Rendering ──
  function renderCard() {
    if (filtered.length === 0) {
      card.style.display = "none";
      cardArea.innerHTML =
        '<div class="empty-state">No cards available.</div>';
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

    counter.textContent = `${currentIndex + 1} / ${filtered.length}`;
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

  // ── Tinder-style Swipe ──
  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let isDragging = false;
  let isAnimating = false;
  const SWIPE_THRESHOLD = 80; // px to trigger swipe
  const ROTATION_FACTOR = 0.15; // rotation degrees per px

  function animateSwipeOut(direction, onComplete) {
    isAnimating = true;
    const flyOutX = direction * (window.innerWidth + 100);
    const flyOutRotation = direction * 25;

    card.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
    card.style.transform = `translateX(${flyOutX}px) rotate(${flyOutRotation}deg)`;
    card.style.opacity = "0";

    setTimeout(() => {
      // Hide card, reset position instantly
      card.style.visibility = "hidden";
      card.style.transition = "none";
      card.style.transform = "";
      card.style.opacity = "";

      // Change content
      onComplete();

      // Show new card (no animation - it's just there)
      requestAnimationFrame(() => {
        card.style.visibility = "";
        isAnimating = false;
      });
    }, 250);
  }

  cardArea.addEventListener("touchstart", (e) => {
    if (filtered.length === 0 || isAnimating) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchCurrentX = touchStartX;
    isDragging = true;
    card.style.transition = "none";
  }, { passive: true });

  cardArea.addEventListener("touchmove", (e) => {
    if (!isDragging || filtered.length === 0 || isAnimating) return;

    touchCurrentX = e.touches[0].clientX;
    const dx = touchCurrentX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    // If mostly vertical, don't interfere with scroll
    if (Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dx) < 20) return;

    // Prevent page scroll when swiping card
    e.preventDefault();

    // Move and rotate card with finger
    const rotation = dx * ROTATION_FACTOR;
    card.style.transform = `translateX(${dx}px) rotate(${rotation}deg)`;

    // Slight opacity change
    const opacity = Math.max(0.7, 1 - Math.abs(dx) / 400);
    card.style.opacity = opacity;
  }, { passive: false });

  cardArea.addEventListener("touchend", (e) => {
    if (!isDragging || filtered.length === 0 || isAnimating) return;
    isDragging = false;

    const dx = touchCurrentX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    // Check if it's a tap (minimal movement)
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      card.style.transition = "transform 0.15s ease, opacity 0.15s ease";
      card.style.transform = "";
      card.style.opacity = "";
      revealAnswer();
      return;
    }

    // If swipe is strong enough, fly out and show next card
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      const direction = dx > 0 ? 1 : -1;
      animateSwipeOut(direction, () => {
        if (direction < 0) {
          goNext();
        } else {
          goPrev();
        }
      });
    } else {
      // Snap back to center with spring effect
      card.style.transition = "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease";
      card.style.transform = "";
      card.style.opacity = "";
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
    }
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
