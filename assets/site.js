/* Riccardo Cammarata, portfolio interactions.
   Everything is an enhancement. Every page renders in full without it. */

(function () {
  "use strict";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var slice = function (x) { return [].slice.call(x); };

  /* ---------- headline phrase swap ---------- */
  var messy = document.getElementById("messy"), word = document.getElementById("word");
  if (messy) {
    var off = [[-2.4,-1.5,-4],[1.9,1.1,3],[-1.3,2.1,-3],[2.5,-1.3,4],[-1.7,.9,-2]], k = 0;
    messy.innerHTML = messy.textContent.split("").map(function (ch) {
      if (ch === " ") return " ";
      var o = off[k++ % off.length];
      return '<span style="transform:translate(' + o[0] + 'px,' + o[1] + 'px) rotate(' + o[2] + 'deg)">' + ch + "</span>";
    }).join("");
  }
  if (word) {
    var tidy = word.querySelector(".t");
    function sizeWord() {
      word.dataset.a = messy.offsetWidth;
      word.dataset.b = tidy.offsetWidth;
      if (!word.matches(":hover")) word.style.width = messy.offsetWidth + "px";
    }
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(sizeWord);
    setTimeout(sizeWord, 700);
    addEventListener("resize", sizeWord);
    word.addEventListener("mouseenter", function(){ word.style.width = word.dataset.b + "px"; });
    word.addEventListener("mouseleave", function(){ word.style.width = word.dataset.a + "px"; });
    word.addEventListener("focus", function(){ word.style.width = word.dataset.b + "px"; });
    word.addEventListener("blur", function(){ word.style.width = word.dataset.a + "px"; });
  }

  /* ---------- skills deck, with a fifth card that flips ---------- */
  var deck = document.getElementById("deck"), dots = document.getElementById("dots");
  if (deck) {
    var cards = slice(deck.querySelectorAll(".dk")), n = cards.length, pos = 0, busy = false;
    function paint() {
      cards.forEach(function (c, idx) {
        var rel = (idx - pos + n) % n;
        c.style.setProperty("--i", rel);
        c.dataset.i = rel;
      });
      if (dots) [].forEach.call(dots.children, function (d, i) { d.classList.toggle("on", i === pos % n); });
      deck.classList.toggle("has-finale", cards[pos % n].classList.contains("finale"));
    }
    function burst() {
      var box = deck.getBoundingClientRect();
      var cols = ["#5B8CFF", "#A78BFA", "#FBBF24", "#FB7185", "#34D399"];
      for (var i = 0; i < 16; i++) {
        var s = document.createElement("span");
        s.className = "fxbit";
        var ang = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 90;
        s.style.cssText = "left:" + (box.left + box.width / 2) + "px;top:" + (box.top + box.height / 2) +
          "px;color:" + cols[(Math.random() * cols.length) | 0] +
          ";font-size:" + (11 + Math.random() * 10).toFixed(0) + "px;position:fixed;z-index:40";
        s.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
        s.style.setProperty("--dy", (Math.sin(ang) * dist).toFixed(1) + "px");
        s.style.setProperty("--speak", "0.95");
        s.style.setProperty("--slife", "1.4s");
        s.textContent = String((Math.random() * 10) | 0);
        document.body.appendChild(s);
        (function (el) { setTimeout(function () { el.remove(); }, 1400); })(s);
      }
    }
    function next() {
      if (busy) return;
      busy = true;
      var leaving = cards[pos % n];
      leaving.classList.add("out");
      setTimeout(function () {
        leaving.classList.remove("out");
        pos = (pos + 1) % n;
        paint();
        if (!reduced && cards[pos % n].classList.contains("finale")) {
          deck.classList.add("flipping");
          setTimeout(function () { deck.classList.remove("flipping"); burst(); }, 360);
        }
        busy = false;
      }, 440);
    }
    deck.addEventListener("click", next);
    deck.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); }
    });
    paint();
  }

  /* ---------- the effort frame -----------------------------------------------
     The border is drawn at the card's real pixel size, so the corners stay round
     at every width. Two runs open from a broken V at the top and close at the
     bottom; pathLength=100 keeps the dash maths independent of the size.       */
  var frame = document.getElementById("effortFrame"), bigcard = document.getElementById("bigcard");
  if (frame && bigcard) {
    var drawFrame = function () {
      var W = bigcard.clientWidth, H = bigcard.clientHeight;
      if (!W || !H) return;
      var i = 1.5, r = 18, x0 = i, y0 = i, x1 = W - i, y1 = H - i, cx = W / 2, g = 32, dep = 17;
      if (W < 300) { g = 20; }
      var dL = "M" + (cx - g) + " " + y0 + " H" + (x0 + r) + " A" + r + " " + r + " 0 0 0 " + x0 + " " + (y0 + r) +
               " V" + (y1 - r) + " A" + r + " " + r + " 0 0 0 " + (x0 + r) + " " + y1 + " H" + cx;
      var dR = "M" + (cx + g) + " " + y0 + " H" + (x1 - r) + " A" + r + " " + r + " 0 0 1 " + x1 + " " + (y0 + r) +
               " V" + (y1 - r) + " A" + r + " " + r + " 0 0 1 " + (x1 - r) + " " + y1 + " H" + cx;
      /* the V is deliberately left open at the tip */
      var dN = "M" + (cx - g) + " " + y0 + " L" + (cx - 7) + " " + (y0 + dep) +
               " M" + (cx + 7) + " " + (y0 + dep) + " L" + (cx + g) + " " + y0;
      frame.setAttribute("viewBox", "0 0 " + W + " " + H);
      frame.querySelectorAll(".rl").forEach(function (p) { p.setAttribute("d", dL); });
      frame.querySelectorAll(".rr").forEach(function (p) { p.setAttribute("d", dR); });
      frame.querySelector(".notch").setAttribute("d", dN);
    };
    drawFrame();
    if ("ResizeObserver" in window) new ResizeObserver(drawFrame).observe(bigcard);
    else addEventListener("resize", drawFrame);
  }

  /* ---------- the effort panel: the numbers, the bit, and the correction ---------- */
  var big = document.getElementById("bigeffort");
  if (big) {
    var joke = document.getElementById("effortJoke");
    var pc = big.querySelector(".pc .n");
    var card = document.getElementById("bigcard");
    var eye = document.getElementById("statEye"), know = document.getElementById("statKnow");
    var script = [
      "yes, the maths is wrong.",
      "yes, it's the joke.",
      "I know it's lame.",
      "it's okay.",
      "it's still the joke.",
      "…fine. let me fix the other two."
    ];

    function countTo(el, from, to, ms, suffix) {
      var t0 = performance.now();
      requestAnimationFrame(function step(t) {
        var p = Math.min((t - t0) / ms, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (to - from) * e) + (suffix || "");
        if (p < 1) requestAnimationFrame(step);
      });
    }
    function setStat(box, val) {
      box.querySelector(".v").textContent = val + "%";
      box.querySelector(".fill").style.width = val + "%";
    }

    /* Armed by hand, not by scroll. Scrolling past used to start the whole bit
       whether you were looking at it or not, so by the time you stopped it was
       three lines in. Now it waits: hover, tap, focus, or Enter. */
    var started = false;
    function arm() {
      if (started) return;
      started = true;
      big.classList.add("armed");
      big.removeAttribute("role");
      big.removeAttribute("aria-label");

      if (reduced) {
        setStat(eye, 30); setStat(know, 70);
        pc.textContent = "110";
        joke.textContent = "the maths is wrong. that is the joke. go and look at the work ↓";
        (card || big).classList.add("done");
        return;
      }

      setTimeout(function () { setStat(eye, 35); }, 200);
      setTimeout(function () { setStat(know, 75); }, 420);
      countTo(pc, 0, 113, 1300);
      setTimeout(function () { countTo(pc, 113, 110, 300); }, 1650);

      var i = 0;
      var run = setInterval(function () {
        if (i >= script.length) {
          clearInterval(run);
          joke.style.opacity = 0;
          setTimeout(function () {
            setStat(eye, 30);
            setStat(know, 70);
            (card || big).classList.add("done");
            joke.textContent = "there. now go and look at the actual work ↓";
            joke.style.opacity = "";
          }, 320);
          return;
        }
        joke.style.opacity = 0;
        (function (txt) {
          setTimeout(function () { joke.textContent = txt; joke.style.opacity = ""; }, 150);
        })(script[i]);
        i++;
      }, 1600);
    }

    big.addEventListener("pointerenter", arm);
    big.addEventListener("focusin", arm);
    big.addEventListener("click", arm);
    big.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); arm(); }
    });
  }

  /* ---------- pictures ---------------------------------------------------------
     The screenshots on this site run from 0.5 to 3.7 wide. Cropping them to one
     ratio cut the content off, so each group picks one frame ratio from its own
     images and the picture is contained inside it. The leftover space used to be
     filled with a blurred copy of the image, which is exactly why no two frames
     were the same colour; it is one flat panel colour in CSS now.               */
  function whenLoaded(imgs, done) {
    var left = imgs.length;
    if (!left) return done();
    imgs.forEach(function (img) {
      var fired = false;
      function tick() { if (fired) return; fired = true; if (!--left) done(); }
      if (img.complete) tick();
      else { img.addEventListener("load", tick); img.addEventListener("error", tick); }
    });
  }

  slice(document.querySelectorAll(".shots, .ba-pair")).forEach(function (group) {
    var imgs = [];
    slice(group.querySelectorAll("figure")).forEach(function (fig) {
      var img = fig.querySelector("img");
      if (!img) return;
      imgs.push(img);
      if (!img.parentNode.classList || !img.parentNode.classList.contains("fr")) {
        var fr = document.createElement("span");
        fr.className = "fr";
        img.parentNode.insertBefore(fr, img);
        fr.appendChild(img);
      }
    });
    if (group.classList.contains("shots") && !group.classList.contains("single")) {
      group.style.setProperty("--cols", String(Math.min(imgs.length, 3) || 1));
    }
    whenLoaded(imgs, function () {
      var rs = imgs.map(function (i) {
        return i.naturalWidth && i.naturalHeight ? i.naturalWidth / i.naturalHeight : 0;
      }).filter(Boolean).sort(function (a, b) { return a - b; });
      if (!rs.length) return;
      /* the median, clamped, so one freak panorama does not squash the row.
         a group of one has nothing to line up with, so it keeps its own ratio
         and the frame ends where the picture does instead of leaving a band. */
      var med = rs[(rs.length - 1) >> 1];
      var ar = rs.length === 1 ? Math.max(0.6, Math.min(3.6, med))
                               : Math.max(0.95, Math.min(1.9, med));
      group.style.setProperty("--ar", ar.toFixed(3));

      /* One ratio for a whole row means an image that does not share it gets
         contained inside a frame far bigger than itself, which is why some of
         these came out looking tiny. Three cases:
           close to the frame  -> fill it, losing a sliver off the edges
           much wider          -> take the whole row at its own ratio, because a
                                  wide code strip squeezed into a square cell is
                                  the one that ended up unreadable
           much taller         -> stay contained. cropping a tall screenshot cuts
                                  the bottom of a list off, and that is content. */
      /* a before/after pair is a left and a right and must stay that way: no
         widening, no reordering. taking the wide one out of the row put the
         after on the left and the before on the right. */
      var pair = group.classList.contains("ba-pair");
      var wide = [];
      imgs.forEach(function (i) {
        if (!i.naturalWidth || !i.naturalHeight) return;
        var fr = i.parentNode, fig = fr.parentNode;
        var r = i.naturalWidth / i.naturalHeight, off = Math.log(r / ar);
        if (!pair && off > 0.42 && imgs.length > 1) {
          fig.classList.add("wide");
          fr.style.setProperty("--ar", Math.min(3.6, r).toFixed(3));
          wide.push(fig);
        } else if (off > -0.15) {
          fr.classList.add("fill");
        }
      });
      /* A full-width figure in the middle of the row breaks it in two and leaves
         the others sitting alone in column one. Send them to the end and count
         the columns off what is left, so the row above them still fills up. */
      if (wide.length) {
        wide.forEach(function (fig) { group.appendChild(fig); });
        if (!group.classList.contains("single")) {
          group.style.setProperty("--cols", String(Math.max(1, Math.min(3, imgs.length - wide.length))));
        }
      }
      /* and do not blow a small picture up past its own pixels to fill a frame */
      if (group.classList.contains("single") && imgs[0] && imgs[0].naturalWidth) {
        group.style.maxWidth = Math.round(imgs[0].naturalWidth * 1.15) + "px";
      }
    });
  });

  /* ---------- drag to compare ---------- */
  document.querySelectorAll(".cmp").forEach(function (cmp) {
    var dragging = false;
    function set(p) {
      p = Math.max(0, Math.min(100, p));
      cmp.style.setProperty("--x", p + "%");
      cmp.setAttribute("aria-valuenow", Math.round(p));
    }
    function pct(e) { var r = cmp.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; }
    cmp.addEventListener("pointerdown", function (e) {
      e.preventDefault(); dragging = true;
      try { cmp.setPointerCapture(e.pointerId); } catch (_) {}
      set(pct(e));
    });
    cmp.addEventListener("pointermove", function (e) { if (dragging) { e.preventDefault(); set(pct(e)); } });
    function stop(e) {
      if (!dragging) return;
      dragging = false;
      try { cmp.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    cmp.addEventListener("pointerup", stop);
    cmp.addEventListener("pointercancel", stop);
    cmp.addEventListener("lostpointercapture", function () { dragging = false; });
    addEventListener("pointerup", function () { dragging = false; });
    cmp.addEventListener("keydown", function (e) {
      var c = parseFloat(cmp.getAttribute("aria-valuenow")) || 42;
      if (e.key === "ArrowLeft") { e.preventDefault(); set(c - 4); }
      if (e.key === "ArrowRight") { e.preventDefault(); set(c + 4); }
    });
    if (!reduced && "IntersectionObserver" in window) {
      var seen2 = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          seen2.unobserve(e.target);
          var s = performance.now();
          requestAnimationFrame(function nudge(t) {
            if (dragging) return;
            var p = Math.min((t - s) / 1000, 1);
            set(42 + Math.sin(p * Math.PI) * 16);
            if (p < 1) requestAnimationFrame(nudge); else set(42);
          });
        });
      }, { threshold: .4 });
      seen2.observe(cmp);
    }
  });

  /* ---------- the before/after that closes every project ---------- */
  document.querySelectorAll(".reveal-compare").forEach(function (rc) {
    if (!rc.querySelector(".rc-grip")) {
      var g = document.createElement("span");
      g.className = "rc-grip";
      g.setAttribute("aria-hidden", "true");
      g.textContent = "⇄";
      rc.appendChild(g);
    }
    var dragging = false, moved = 0, startX = 0;
    function set(p) {
      p = Math.max(0, Math.min(100, p));
      rc.style.setProperty("--wipe", p + "%");
      rc.classList.toggle("revealed", p > 50);
    }
    function pct(e) { var r = rc.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; }
    function toggle() { set(rc.classList.contains("revealed") ? 0 : 100); }
    rc.addEventListener("pointerdown", function (e) {
      dragging = true; moved = 0; startX = e.clientX;
      rc.classList.add("dragging");
      try { rc.setPointerCapture(e.pointerId); } catch (_) {}
    });
    rc.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      moved = Math.max(moved, Math.abs(e.clientX - startX));
      if (moved > 4) set(pct(e));
    });
    function end(e) {
      if (!dragging) return;
      dragging = false;
      rc.classList.remove("dragging");
      if (moved <= 4) toggle(); else set(pct(e));
    }
    rc.addEventListener("pointerup", end);
    rc.addEventListener("pointercancel", end);
    addEventListener("pointerup", function () { dragging = false; rc.classList.remove("dragging"); });
    rc.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      if (e.key === "ArrowRight") { e.preventDefault(); set(100); }
      if (e.key === "ArrowLeft") { e.preventDefault(); set(0); }
    });
  });

  /* ---------- lightbox ---------- */
  (function () {
    var figs = document.querySelectorAll(".shots figure, .ba-pair figure");
    if (!figs.length) return;
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = '<button class="lb-close" aria-label="Close">&times;</button>' +
      '<figure><div class="lb-toggle"><button class="before" type="button">Before</button>' +
      '<button class="after" type="button">After</button></div>' +
      '<img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lb);
    var img = lb.querySelector("img"), cap = lb.querySelector("figcaption");
    var toggle = lb.querySelector(".lb-toggle");
    var btnB = lb.querySelector(".before"), btnA = lb.querySelector(".after");
    var pair = null, last = null;
    function setPair(which) {
      if (!pair) return;
      var isB = which === "before";
      btnB.classList.toggle("on", isB);
      btnA.classList.toggle("on", !isB);
      img.src = isB ? pair.b : pair.a;
      cap.textContent = isB ? pair.bc : pair.ac;
    }
    function close() { lb.classList.remove("show"); if (last) last.focus(); }
    btnB.addEventListener("click", function (e) { e.stopPropagation(); setPair("before"); });
    btnA.addEventListener("click", function (e) { e.stopPropagation(); setPair("after"); });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("show")) close();
    });
    figs.forEach(function (fig) {
      fig.classList.add("zoomable");
      fig.tabIndex = 0;
      fig.setAttribute("role", "button");
      function open() {
        last = fig;
        var group = fig.closest(".ba-pair");
        var b = group && group.querySelector(".before img");
        var a = group && group.querySelector(".after img");
        if (b && a) {
          var bc = group.querySelector(".before figcaption"), ac = group.querySelector(".after figcaption");
          pair = { b: b.src, a: a.src, bc: bc ? bc.textContent : "Before", ac: ac ? ac.textContent : "After" };
          toggle.classList.add("on");
          setPair(fig.classList.contains("before") ? "before" : "after");
        } else {
          pair = null;
          toggle.classList.remove("on");
          var own = fig.querySelector("img"), oc = fig.querySelector("figcaption");
          img.src = own ? own.src : "";
          cap.textContent = oc ? oc.textContent : "";
        }
        lb.classList.add("show");
        lb.querySelector(".lb-close").focus();
      }
      fig.addEventListener("click", open);
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
  })();

  /* code tour tabs */
  document.querySelectorAll(".code-tour").forEach(function (ct) {
    var tabs = ct.querySelectorAll(".ct-tab"), panels = ct.querySelectorAll(".ct-panel");
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("on"); });
        panels.forEach(function (p) { p.classList.remove("on"); });
        tab.classList.add("on");
        if (panels[i]) panels[i].classList.add("on");
      });
    });
  });

  /* ---------- project and about pages arrive as you scroll ---------- */
  (function () {
    var content = document.getElementById("quarto-document-content");
    if (!content || reduced || !("IntersectionObserver" in window)) return;
    var sel = ".info-card,.shots figure,.ba-pair figure,.math-box,.featured-new,.thesis-highlight," +
      ".codeblock,.code-tour,.data-table,.card-soft,.progress-card,.reveal-compare," +
      ".principles .p-card,.timeline .t-item,.gallery .g-item,.chips,.still-here,.before-after .pane";
    var items = slice(content.querySelectorAll(sel));
    items.forEach(function (el) { el.classList.add("rv"); });

    /* siblings come in one after the other rather than all at once */
    [".info-grid", ".shots", ".ba-pair", ".principles", ".gallery", ".timeline", ".before-after"]
      .forEach(function (g) {
        slice(content.querySelectorAll(g)).forEach(function (c) {
          [].forEach.call(c.children, function (ch, i) { ch.style.setProperty("--rvd", (i * 0.09).toFixed(2) + "s"); });
        });
      });

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.classList.add("on");
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.concat(slice(content.querySelectorAll("h2"))).forEach(function (el) { io.observe(el); });
  })();

  /* ---------- easter eggs ---------- */

  /* the pill remembers where else I have been */
  (function () {
    var here = document.getElementById("here"), city = document.getElementById("city");
    if (!here || !city) return;
    var lab = here.querySelector(".lab");
    var past = ["Rome", "Milan", "New York", "Palermo"], busy = false;
    function cycle() {
      if (busy) return;
      busy = true;
      lab.textContent = "Previously in:";
      var i = 0;
      var t = setInterval(function () {
        city.textContent = past[i++];
        if (i < past.length) return;
        clearInterval(t);
        setTimeout(function () {
          lab.textContent = "Currently living in:";
          city.textContent = "Amsterdam";
          busy = false;
        }, 850);
      }, 560);
    }
    here.addEventListener("click", cycle);
    here.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycle(); }
    });
  })();

  /* the Konami code, which does exactly as much as it promises */
  (function () {
    var seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    var at = 0;
    addEventListener("keydown", function (e) {
      at = (e.key === seq[at] || e.key.toLowerCase() === seq[at]) ? at + 1 : 0;
      if (at !== seq.length) return;
      at = 0;
      var note = document.createElement("div");
      note.textContent = "you found it. nothing happens, but well done.";
      note.style.cssText = "position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:9999;" +
        "background:#EAEEF9;color:#0A0E17;font-weight:600;font-size:.9rem;padding:.6rem 1rem;" +
        "border-radius:99px;box-shadow:0 12px 30px rgba(0,0,0,.6)";
      document.body.appendChild(note);
      setTimeout(function () { note.remove(); }, 3200);
      document.body.dataset.party = "1";
    });
  })();

  if (window.console && console.log) {
    console.log("%c hello. %c you opened the console, which means we would probably get on.\n" +
      " built by hand with Quarto, too much SCSS, and a Playwright suite that keeps me honest.\n" +
      " github.com/Ris8-it",
      "background:#5B8CFF;color:#0A0E17;font-weight:700;padding:2px 6px;border-radius:4px",
      "color:#A3ADC9");
  }

  /* ---------- ambient ---------- */
  if (reduced) return;
  var field = document.createElement("div");
  field.id = "field";
  document.body.appendChild(field);

  var cols = ["#5B8CFF", "#A78BFA", "#FBBF24", "#FB7185", "#34D399"];
  var bits = ["€", "%", "Σ", "Δ", "↑", "↓", "0", "1", "7", "9", "$", "×", "+"];

  function pop(x, y, c) {
    var n = 3 + ((Math.random() * 3) | 0);
    for (var j = 0; j < n; j++) {
      var s = document.createElement("span");
      s.className = "fxbit";
      var ang = Math.random() * Math.PI * 2, dist = 24 + Math.random() * 42;
      s.style.cssText = "left:" + x + "px;top:" + y + "px;color:" + c +
        ";font-size:" + (9 + Math.random() * 7).toFixed(0) + "px";
      s.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
      s.style.setProperty("--dy", (Math.sin(ang) * dist - 14).toFixed(1) + "px");
      s.style.setProperty("--speak", (0.3 + Math.random() * 0.24).toFixed(2));
      var life = 1.1 + Math.random() * 0.8;
      s.style.setProperty("--slife", life + "s");
      s.textContent = bits[(Math.random() * bits.length) | 0];
      field.appendChild(s);
      (function (el, ms) { setTimeout(function () { el.remove(); }, ms); })(s, life * 1000);
    }
  }

  function hex() {
    if (document.hidden || field.querySelectorAll(".hex").length > 11) return;
    var d = document.createElement("div");
    d.className = "hex";
    var size = 26 + Math.random() * 58, life = 2.8 + Math.random() * 2.2;
    var c = cols[(Math.random() * cols.length) | 0];
    var lx = Math.random() * 95, ty = Math.random() * 92;
    d.style.cssText = "width:" + size + "px;height:" + (size * 1.14) + "px;left:" + lx + "vw;top:" + ty + "vh";
    d.style.setProperty("--life", life + "s");
    /* kept low on purpose: it should be atmosphere, not competition */
    d.style.setProperty("--peak", (0.14 + Math.random() * 0.14).toFixed(2));
    d.innerHTML = '<svg viewBox="0 0 60 68" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M30 2 L56 17 L56 51 L30 66 L4 51 L4 17 Z" fill="none" stroke="' + c + '" stroke-width="1.2"/></svg>';
    field.appendChild(d);
    var bursts = Math.random() < 0.38;
    setTimeout(function () {
      if (bursts) pop(innerWidth * lx / 100 + size / 2, innerHeight * ty / 100 + size * 0.57, c);
      d.remove();
    }, life * 1000);
  }

  var curves = [
    "M0,86 Q30,4 60,86",
    "M0,10 C22,60 40,78 60,84",
    "M0,48 C10,10 20,86 30,48 C40,10 50,86 60,48",
    "M0,78 L14,62 L26,68 L38,40 L48,46 L60,16"
  ];
  function plot() {
    if (document.hidden || field.querySelectorAll(".plot").length > 0) return;
    var d = document.createElement("div");
    d.className = "plot";
    var w = 110 + Math.random() * 120, life = 6 + Math.random() * 3;
    var c = cols[(Math.random() * cols.length) | 0];
    d.style.cssText = "width:" + w + "px;height:" + (w * 0.8) + "px;left:" +
      (Math.random() * 86) + "vw;top:" + (Math.random() * 82) + "vh";
    d.style.setProperty("--plife", life + "s");
    d.style.setProperty("--ppeak", (0.12 + Math.random() * 0.1).toFixed(2));
    d.innerHTML = '<svg viewBox="0 0 60 90" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + curves[(Math.random() * curves.length) | 0] + '" stroke="' + c +
      '" stroke-width="1.2" style="--len:200"/></svg>';
    field.appendChild(d);
    setTimeout(function () { d.remove(); }, life * 1000);
  }

  /* every so often a pair of glasses falls quietly down the page */
  function drifter() {
    if (document.hidden || field.querySelector(".drift")) return;
    var d = document.createElement("div");
    d.className = "drift";
    var w = 52 + Math.random() * 46, life = 15 + Math.random() * 9;
    d.style.cssText = "width:" + w + "px;left:" + (5 + Math.random() * 85) + "vw;top:0";
    d.style.setProperty("--dlife", life + "s");
    d.style.setProperty("--dpeak", (0.09 + Math.random() * 0.07).toFixed(2));
    d.innerHTML = '<svg viewBox="0 0 120 46" xmlns="http://www.w3.org/2000/svg">' +
      '<rect class="lens" x="6" y="12" width="40" height="26" rx="7"/>' +
      '<rect class="lens" x="74" y="12" width="40" height="26" rx="7"/>' +
      '<path class="bridge" d="M46 22 Q60 16 74 22"/>' +
      '<path class="arm" d="M6 20 L0 15"/><path class="arm" d="M114 20 L120 15"/></svg>';
    field.appendChild(d);
    setTimeout(function () { d.remove(); }, life * 1000);
  }

  for (var i = 0; i < 5; i++) setTimeout(hex, i * 200);
  setInterval(hex, 520);
  setTimeout(plot, 2600);
  setInterval(plot, 8000);
  setTimeout(drifter, 7000);
  setInterval(function () { if (Math.random() < 0.55) drifter(); }, 24000);
})();
