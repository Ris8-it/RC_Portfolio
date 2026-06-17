(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Listing cards join the reveal system */
  document.querySelectorAll(".quarto-grid-item").forEach(function (c) { c.classList.add("reveal-up"); });

  /* Scroll reveal with stagger */
  var els = document.querySelectorAll(".reveal-up");
  if (reduced || !("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el, i) {
      el.style.setProperty("--d", (i % 4) * 0.08 + "s");
      io.observe(el);
    });
  }

  /* Scroll progress + navbar state + back-to-top */
  var bar = document.createElement("div"); bar.id = "progress"; document.body.appendChild(bar);
  var top = document.createElement("button"); top.id = "toTop"; top.innerHTML = "&uarr;";
  top.setAttribute("aria-label", "Back to top"); document.body.appendChild(top);
  top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); });
  var nav = document.querySelector(".navbar");
  function onScroll() {
    var h = document.documentElement;
    var p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    bar.style.width = (p * 100) + "%";
    if (nav) nav.classList.toggle("scrolled", h.scrollTop > 30);
    top.classList.toggle("show", h.scrollTop > 600);
  }
  document.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* Email copy modal */
  var emailBtn = document.getElementById("emailBtn");
  var emailModal = document.getElementById("emailModal");
  if (emailBtn && emailModal) {
    var closeBtn = emailModal.querySelector(".email-close");
    var copyBtn = document.getElementById("emailCopy");
    var copied = document.getElementById("emailCopied");
    var addr = document.getElementById("emailAddr").textContent.trim();
    function openM() { emailModal.hidden = false; requestAnimationFrame(function () { emailModal.classList.add("show"); }); }
    function closeM() { emailModal.classList.remove("show"); setTimeout(function () { emailModal.hidden = true; if (copied) copied.classList.remove("show"); }, 250); }
    emailBtn.addEventListener("click", openM);
    if (closeBtn) closeBtn.addEventListener("click", closeM);
    emailModal.addEventListener("click", function (e) { if (e.target === emailModal) closeM(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !emailModal.hidden) closeM(); });
    if (copyBtn) copyBtn.addEventListener("click", function () {
      navigator.clipboard.writeText(addr).then(function () { if (copied) copied.classList.add("show"); });
    });
  }

  /* Image swap before/after toggles */
  document.querySelectorAll(".imgswap").forEach(function (sw) {
    var btnB = sw.querySelector(".toggle .before");
    var btnA = sw.querySelector(".toggle .after");
    var layB = sw.querySelector(".layer.before");
    var layA = sw.querySelector(".layer.after");
    var cap = sw.querySelector(".cap");
    function show(which) {
      var isB = which === "before";
      if (btnB) btnB.classList.toggle("on", isB);
      if (btnA) btnA.classList.toggle("on", !isB);
      if (layB) layB.classList.toggle("active", isB);
      if (layA) layA.classList.toggle("active", !isB);
      if (cap) cap.textContent = isB ? (sw.dataset.capBefore || "Before") : (sw.dataset.capAfter || "After");
    }
    if (btnB) btnB.addEventListener("click", function () { show("before"); });
    if (btnA) btnA.addEventListener("click", function () { show("after"); });
    show("after");
  });

  /* Reveal comparison: build grid cells, wipe right-to-left on click */
  document.querySelectorAll(".reveal-compare").forEach(function (rc) {
    var cells = rc.querySelector(".rc-cells");
    if (cells && !cells.children.length) {
      var cols = 8, rows = 4;
      for (var i = 0; i < cols * rows; i++) cells.appendChild(document.createElement("span"));
    }
    var spans = cells ? cells.querySelectorAll("span") : [];
    rc.addEventListener("click", function () {
      if (rc.classList.contains("revealed")) { // toggle back to before
        rc.classList.remove("revealed");
        spans.forEach(function (s) { s.style.transitionDelay = "0ms"; });
        return;
      }
      var cols = 8, rows = 4;
      spans.forEach(function (s, i) {
        var c = i % cols, r = Math.floor(i / cols);
        // right edge first, left corners last: delay grows toward the left
        var delay = (cols - 1 - c) * 45 + r * 20;
        s.style.transitionDelay = delay + "ms";
      });
      rc.classList.add("revealed");
    });
    rc.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); rc.click(); }
    });
  });

  if (reduced) {
    document.querySelectorAll(".reveal-compare").forEach(function (rc) { rc.classList.add("revealed"); });
    return;
  }

  /* Tile tilt + spotlight */
  document.querySelectorAll(".tile").forEach(function (tile) {
    var inner = tile.querySelector(".tile-inner");
    var front = tile.querySelector(".tile-face.front");
    tile.addEventListener("pointermove", function (e) {
      var r = tile.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tile.style.transform = "rotateX(" + ((0.5 - y) * 4) + "deg) rotateY(" + ((x - 0.5) * 4) + "deg)";
      if (front) { front.style.setProperty("--mx", x * 100 + "%"); front.style.setProperty("--my", y * 100 + "%"); }
    });
    tile.addEventListener("pointerleave", function () { tile.style.transform = ""; });
    /* snap-in zoom when entering a project */
    tile.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        if (inner) inner.style.transform = "rotateY(180deg) scale(1.04)";
        document.body.classList.add("leaving");
        setTimeout(function () { window.location = a.href; }, 240);
      });
    });
  });

  /* Magnetic CTA */
  document.querySelectorAll(".cta").forEach(function (btn) {
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      btn.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.1 + "px," +
        (e.clientY - r.top - r.height / 2) * 0.18 + "px)";
    });
    btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
  });

  /* Count-up stats */
  var nums = document.querySelectorAll(".kpi .num[data-to], .stat .num[data-to]");
  if (nums.length) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        seen.unobserve(e.target);
        var to = parseFloat(e.target.dataset.to), suf = e.target.dataset.suf || "";
        var t0 = performance.now();
        (function tick(t) {
          var k = Math.min((t - t0) / 1200, 1);
          k = 1 - Math.pow(1 - k, 3);
          e.target.textContent = Math.round(to * k) + suf;
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { seen.observe(n); });
  }

  /* Marquee: infinite scroll, items grow toward viewport centre */
  var mq = document.querySelector(".marquee .track");
  if (mq) {
    mq.innerHTML += mq.innerHTML; /* duplicate for seamless loop */
    var x = 0, paused = false, half = mq.scrollWidth / 2;
    mq.addEventListener("pointerenter", function () { paused = true; });
    mq.addEventListener("pointerleave", function () { paused = false; });
    var items = mq.querySelectorAll("a");
    (function loop() {
      if (!paused) {
        x -= 0.6; if (-x >= half) x = 0;
        mq.style.transform = "translateX(" + x + "px)";
      }
      var cx = window.innerWidth / 2;
      items.forEach(function (it) {
        var r = it.getBoundingClientRect();
        var d = Math.abs(r.left + r.width / 2 - cx);
        var s = Math.max(1, 1.16 - d / (cx * 2.2));
        it.style.transform = "scale(" + s + ")";
        it.classList.toggle("center", s > 1.1);
      });
      requestAnimationFrame(loop);
    })();
  }

  /* Fade-out page transition for nav links */
  document.querySelectorAll(".navbar a[href], .cta[href], a.cta-ghost[href]").forEach(function (a) {
    if (a.host !== location.host) return;
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      document.body.classList.add("leaving");
      setTimeout(function () { window.location = a.href; }, 220);
    });
  });
})();
