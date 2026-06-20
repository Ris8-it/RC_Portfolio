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

  /* Hexfield: lightly fade hexagons in and out over the dot background */
  if (!reduced) {
    var field = document.createElement("div");
    field.id = "hexfield";
    document.body.appendChild(field);
    var hexSvg = '<svg width="100%" height="100%" viewBox="0 0 60 68" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M30 2 L56 17 L56 51 L30 66 L4 51 L4 17 Z" fill="none" stroke="COL" stroke-width="1.2"/></svg>';
    var hexPalette = [
      "rgba(79,209,197,0.85)",   // teal
      "rgba(139,155,255,0.8)",   // periwinkle
      "rgba(240,168,168,0.7)",   // coral
      "rgba(255,213,138,0.7)",   // amber
      "rgba(150,220,255,0.8)",   // sky
      "rgba(190,160,255,0.75)"   // violet
    ];
    function spawnHex() {
      if (field.children.length > 12) return;
      var el = document.createElement("div");
      el.className = "hex";
      var size = 22 + Math.random() * 60;
      var life = 1.2 + Math.random() * 1.4;
      var col = hexPalette[Math.floor(Math.random() * hexPalette.length)];
      el.style.width = size + "px"; el.style.height = (size * 1.13) + "px";
      el.style.left = (Math.random() * 96) + "vw";
      el.style.top = (Math.random() * 94) + "vh";
      el.style.setProperty("--life", life + "s");
      el.innerHTML = hexSvg.replace("COL", col);
      field.appendChild(el);
      setTimeout(function () { el.remove(); }, life * 1000);
    }
    setInterval(spawnHex, 360);
    spawnHex(); spawnHex(); spawnHex(); spawnHex();
  }

  /* Code tour: tab switching */
  document.querySelectorAll(".code-tour").forEach(function (ct) {
    var tabs = ct.querySelectorAll(".ct-tab");
    var panels = ct.querySelectorAll(".ct-panel");
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("on"); });
        panels.forEach(function (p) { p.classList.remove("on"); });
        tab.classList.add("on");
        if (panels[i]) panels[i].classList.add("on");
      });
    });
  });

  /* Lightbox: zoom images, link before/after pairs */
  (function () {
    var figs = document.querySelectorAll(".shots figure, .ba-pair figure");
    if (!figs.length) return;
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML =
      '<button class="lb-close" aria-label="Close">&times;</button>' +
      '<figure><div class="lb-toggle"><button class="before">Before</button><button class="after">After</button></div>' +
      '<img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector("figcaption");
    var lbToggle = lb.querySelector(".lb-toggle");
    var btnB = lb.querySelector(".lb-toggle .before");
    var btnA = lb.querySelector(".lb-toggle .after");
    var pairData = null;

    function setPairView(which) {
      if (!pairData) return;
      var isB = which === "before";
      btnB.classList.toggle("on", isB);
      btnA.classList.toggle("on", !isB);
      lbImg.src = isB ? pairData.beforeSrc : pairData.afterSrc;
      lbCap.textContent = isB ? pairData.beforeCap : pairData.afterCap;
    }
    function openSingle(src, cap) {
      pairData = null; lbToggle.classList.remove("on");
      lbImg.src = src; lbCap.textContent = cap || "";
      lb.classList.add("show");
    }
    function openPair(data, which) {
      pairData = data; lbToggle.classList.add("on");
      setPairView(which); lb.classList.add("show");
    }
    function close() { lb.classList.remove("show"); }

    btnB.addEventListener("click", function (e) { e.stopPropagation(); setPairView("before"); });
    btnA.addEventListener("click", function (e) { e.stopPropagation(); setPairView("after"); });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    figs.forEach(function (fig) {
      fig.classList.add("zoomable");
      var ico = document.createElement("span"); ico.className = "zoom-ico"; fig.appendChild(ico);
      var img = fig.querySelector("img");
      var cap = fig.querySelector("figcaption");
      var capText = cap ? cap.textContent : "";
      fig.addEventListener("click", function () {
        var pairEl = fig.closest(".ba-pair");
        if (pairEl) {
          var bImg = pairEl.querySelector(".before img");
          var aImg = pairEl.querySelector(".after img");
          var bCap = pairEl.querySelector(".before figcaption");
          var aCap = pairEl.querySelector(".after figcaption");
          if (bImg && aImg) {
            openPair({
              beforeSrc: bImg.src, afterSrc: aImg.src,
              beforeCap: bCap ? bCap.textContent : "Before",
              afterCap: aCap ? aCap.textContent : "After"
            }, fig.classList.contains("before") ? "before" : "after");
            return;
          }
        }
        openSingle(img ? img.src : "", capText);
      });
    });
  })();

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

  /* Reveal comparison: BEFORE is built of square cells that dissolve to reveal AFTER */
  document.querySelectorAll(".reveal-compare").forEach(function (rc) {
    var cells = rc.querySelector(".rc-cells");
    if (cells && !cells.children.length) {
      for (var i = 0; i < 32; i++) cells.appendChild(document.createElement("span"));
    }
    var spans = cells ? cells.querySelectorAll("span") : [];
    rc.addEventListener("click", function () {
      var revealing = !rc.classList.contains("revealed");
      var cols = 8;
      spans.forEach(function (s, i) {
        var c = i % cols, r = Math.floor(i / cols);
        // right edge dissolves first, left corners last
        var delay = revealing ? ((cols - 1 - c) * 45 + r * 20) : (c * 30);
        s.style.transitionDelay = delay + "ms";
      });
      rc.classList.toggle("revealed");
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
