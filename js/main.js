// ===================== Liberation War Archive — shared behaviors =====================

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initRevealOnScroll();
  initCounters();
  initFilters();
  initGallerySearch();
  initLightbox();
  initInterviewPlayers();
  initContactForm();
  initFileDrop();
});

/* ---------- mobile nav (Bootstrap) ---------- */
function initNav() {
  // mark active link based on current page
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav .nav-link").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });
}

/* ---------- scroll reveal ---------- */
function initRevealOnScroll() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  items.forEach((i) => io.observe(i));
}

/* ---------- animated stat counters ---------- */
function initCounters() {
  const stats = document.querySelectorAll(".stat .num[data-count]");
  if (!stats.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || "";
        let cur = 0;
        const step = Math.max(1, Math.round(target / 60));
        const tick = () => {
          cur += step;
          if (cur >= target) {
            el.textContent = target + suffix;
            return;
          }
          el.textContent = cur + suffix;
          requestAnimationFrame(tick);
        };
        tick();
        io.unobserve(el);
      });
    },
    { threshold: 0.4 },
  );
  stats.forEach((s) => io.observe(s));
}

/* ---------- generic filter buttons (documents / gallery) ---------- */
function initFilters() {
  const groups = document.querySelectorAll("[data-filter-group]");
  groups.forEach((group) => {
    const targetSelector = group.dataset.filterGroup;
    const items = document.querySelectorAll(targetSelector);
    group.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        group
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const cat = btn.dataset.filter;
        items.forEach((item) => {
          const show = cat === "all" || item.dataset.category === cat;
          item.style.display = show ? "" : "none";
        });
        announceCount(items);
      });
    });
  });
}

function announceCount(items) {
  const visible = Array.from(items).filter(
    (i) => i.style.display !== "none",
  ).length;
  const liveRegion = document.getElementById("result-count");
  if (liveRegion)
    liveRegion.textContent = `${visible} item${visible === 1 ? "" : "s"} shown`;
}

/* ---------- text search (documents & interviews pages) ---------- */
function initGallerySearch() {
  const input = document.querySelector("[data-search-target]");
  if (!input) return;
  const targetSelector = input.dataset.searchTarget;
  const items = document.querySelectorAll(targetSelector);
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    items.forEach((item) => {
      const text = item.innerText.toLowerCase();
      item.style.display = text.includes(q) ? "" : "none";
    });
    announceCount(items);
  });
}

/* ---------- lightbox for gallery images ---------- */
function initLightbox() {
  const lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;
  const imgs = Array.from(document.querySelectorAll(".gallery-item img"));
  const lbImg = lightbox.querySelector("img");
  const lbCap = lightbox.querySelector("figcaption");
  let idx = 0;

  function open(i) {
    idx = i;
    const src = imgs[idx];
    lbImg.src = src.src;
    lbImg.alt = src.alt;
    lbCap.textContent =
      src.closest(".gallery-item").querySelector(".cap")?.textContent ||
      src.alt;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  }
  function close() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
  }
  function step(dir) {
    idx = (idx + dir + imgs.length) % imgs.length;
    open(idx);
  }

  imgs.forEach((img, i) => img.addEventListener("click", () => open(i)));
  lightbox.querySelector(".lightbox-close")?.addEventListener("click", close);
  lightbox
    .querySelector(".lightbox-prev")
    ?.addEventListener("click", () => step(-1));
  lightbox
    .querySelector(".lightbox-next")
    ?.addEventListener("click", () => step(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
}

/* ---------- interview "play" simulation ----------
   No audio files are hosted in this static build. Pressing play
   animates a progress bar so the interaction can be demonstrated;
   the card also links out to the source archive for the real recording. */
function initInterviewPlayers() {
  document.querySelectorAll(".play-btn").forEach((btn) => {
    let playing = false;
    let raf;
    const bar = btn.closest(".play-row").querySelector(".progress span");
    const durationEl = btn.closest(".play-row").querySelector(".duration");
    const totalSeconds = parseInt(btn.dataset.duration || "180", 10);

    btn.addEventListener("click", () => {
      playing = !playing;
      btn.innerHTML = playing ? pauseIcon() : playIcon();
      btn.setAttribute(
        "aria-label",
        playing ? "Pause interview preview" : "Play interview preview",
      );
      if (playing) {
        let start =
          performance.now() -
          parseFloat(bar.dataset.progress || "0") * totalSeconds * 1000;
        const loop = (now) => {
          const elapsed = (now - start) / 1000;
          const pct = Math.min(1, elapsed / totalSeconds);
          bar.style.width = pct * 100 + "%";
          bar.dataset.progress = pct;
          const remaining = Math.max(0, totalSeconds - elapsed);
          durationEl.textContent = formatTime(remaining);
          if (pct < 1 && playing) {
            raf = requestAnimationFrame(loop);
          } else if (pct >= 1) {
            playing = false;
            btn.innerHTML = playIcon();
            durationEl.textContent = formatTime(totalSeconds);
            bar.dataset.progress = 0;
            bar.style.width = "0%";
          }
        };
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
      }
    });
  });
}
function formatTime(s) {
  const m = Math.floor(s / 60),
    sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function playIcon() {
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
}
function pauseIcon() {
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
}

/* ---------- contact / contribute form ---------- */
function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;
  const note = form.querySelector(".form-note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    // No backend is wired up in this static build — this simply
    // confirms receipt in the UI and clears the form.
    note.textContent =
      "Thank you. Your message has been recorded for the archive team — this demo form does not send data anywhere yet, so connect it to your server or a form service before going live.";
    note.classList.add("show");
    form.reset();
    document.querySelector(".file-list").textContent = "";
  });
}

/* ---------- drag-and-drop file field ---------- */
function initFileDrop() {
  const drop = document.querySelector(".file-drop");
  if (!drop) return;
  const input = drop.querySelector('input[type="file"]');
  const list = document.querySelector(".file-list");

  drop.addEventListener("click", () => input.click());
  drop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });
  ["dragenter", "dragover"].forEach((evt) =>
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.add("drag");
    }),
  );
  ["dragleave", "drop"].forEach((evt) =>
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.remove("drag");
    }),
  );
  drop.addEventListener("drop", (e) => {
    input.files = e.dataTransfer.files;
    renderFiles();
  });
  input.addEventListener("change", renderFiles);

  function renderFiles() {
    const names = Array.from(input.files).map((f) => f.name);
    list.textContent = names.length ? `Selected: ${names.join(", ")}` : "";
  }
}
