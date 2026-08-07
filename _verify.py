"""End to end check of the built site, served over HTTP at :8877."""

import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8877/"
SHOTS = Path(__file__).parent / "shots"
SHOTS.mkdir(exist_ok=True)

PAGES = ["index.html", "about.html", "projects/index.html",
         "projects/sap-dashboard.html", "projects/email-pipeline.html",
         "projects/invoice-checker.html", "projects/docs-system.html",
         "projects/crypto-regulation.html", "projects/cinema-model.html"]

ok = []
def chk(name, cond, detail=""):
    ok.append(bool(cond))
    print(("PASS" if cond else "FAIL") + f"  {name}" + (f"  {detail}" if detail else ""))

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge")

    # ---- every page loads clean ---------------------------------------
    links = set()
    for path in PAGES:
        pg = b.new_page(viewport={"width": 1440, "height": 1000})
        errs, bad = [], []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("requestfailed", lambda r: bad.append(r.url))
        pg.on("response", lambda r: bad.append(f"{r.status} {r.url}") if r.status >= 400 else None)
        pg.goto(BASE + path, wait_until="networkidle")
        pg.wait_for_timeout(1000)
        over = pg.evaluate("()=>document.documentElement.scrollWidth-document.documentElement.clientWidth")
        chk(f"{path:36} clean", not errs and not bad and over <= 0,
            f"js={len(errs)} bad={bad[:1]} overflow={over}")
        for h in pg.eval_on_selector_all("a[href]", "e=>e.map(x=>x.getAttribute('href'))"):
            if h and not h.startswith(("http", "mailto:", "#", "javascript:")):
                links.add((path, h))
        pg.close()

    dead = []
    for src, href in sorted(links):
        d = "/".join(src.split("/")[:-1])
        t = (d + "/" + href if d and not href.startswith("/") else href).lstrip("/").split("#")[0]
        if not t:
            continue
        try:
            urllib.request.urlopen(BASE + t, timeout=8)
        except Exception:
            dead.append(f"{src} -> {href}")
    chk("every internal link resolves", not dead, str(dead[:4]))

    # ---- homepage -----------------------------------------------------
    pg = b.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=2)
    pg.goto(BASE, wait_until="networkidle")
    pg.wait_for_timeout(3000)

    chk("hexagons running", pg.locator("#field .hex").count() > 0)
    # sparks only exist between a pop and the end of their fly-out, so poll rather
    # than sampling once and calling a miss a failure
    sparks = 0
    for _ in range(40):
        sparks = max(sparks, pg.locator("#field .fxbit").count())
        if sparks:
            break
        pg.wait_for_timeout(400)
    chk("finance sparks emitted", sparks > 0, f"seen={sparks}")

    # headline swap + glasses easter egg on the headline
    pre = pg.evaluate("()=>getComputedStyle(document.querySelector('.word .t')).opacity")
    pg.locator("#word").hover(); pg.wait_for_timeout(700)
    post = pg.evaluate("()=>getComputedStyle(document.querySelector('.word .t')).opacity")
    chk("headline phrase swaps", float(pre) < .1 and float(post) > .8, f"{pre} -> {post}")
    gl = pg.evaluate("()=>getComputedStyle(document.querySelector('.hero .hero-title .hgl')).opacity")
    chk("glasses appear over the headline", float(gl) > .8, f"opacity={gl}")
    pg.locator(".hero .hero-title").screenshot(path=str(SHOTS / "final-headline.png"))

    # deck: five cards, fifth is the finale
    chk("deck has five cards", pg.locator("#deck .dk").count() == 5)
    first = pg.locator('.dk[data-i="0"] .n').inner_text()
    for _ in range(4):
        pg.locator("#deck").click(); pg.wait_for_timeout(750)
    top = pg.locator('.dk[data-i="0"]')
    chk("fifth card is the finale", "finale" in (top.get_attribute("class") or ""),
        pg.locator('.dk[data-i="0"] .n').inner_text())
    pg.locator("#deck").screenshot(path=str(SHOTS / "final-deck5.png"))
    pg.locator("#deck").click(); pg.wait_for_timeout(750)
    chk("deck cycles back to the first", pg.locator('.dk[data-i="0"] .n').inner_text() == first)

    # The effort panel waits to be hovered. Checked on a page of its own, because
    # the deck sits directly above it and the earlier clicks leave the cursor in a
    # place where scrolling really does drag the panel under it, which is the
    # behaviour we want, not a failure.
    idle_pg = b.new_page(viewport={"width": 1440, "height": 1000})
    idle_pg.goto(BASE, wait_until="networkidle")
    idle_pg.evaluate("()=>document.getElementById('bigeffort').scrollIntoView({block:'center'})")
    idle_pg.wait_for_timeout(3500)
    idle = idle_pg.evaluate("""()=>({armed:document.getElementById('bigeffort').classList.contains('armed'),
                              pc:document.querySelector('.bigeffort .pc .n').textContent,
                              eye:document.querySelector('#statEye .v').textContent})""")
    chk("effort stays idle until hovered",
        not idle["armed"] and idle["pc"] == "0" and idle["eye"] == "—", str(idle))
    idle_pg.close()

    eff = pg.locator("#bigeffort")
    eff.hover(); pg.wait_for_timeout(2600)
    chk("hover arms the effort panel", pg.evaluate(
        "()=>document.getElementById('bigeffort').classList.contains('armed')"))
    pc = pg.locator("#bigeffort .pc .n").inner_text()
    chk("effort lands on 110", pc == "110", f"={pc}")
    e1 = pg.locator("#statEye .v").inner_text()
    k1 = pg.locator("#statKnow .v").inner_text()
    chk("starts at 35 and 75", e1 == "35%" and k1 == "75%", f"{e1} / {k1}")
    pg.wait_for_timeout(11500)   # let the whole bit play out
    e2 = pg.locator("#statEye .v").inner_text()
    k2 = pg.locator("#statKnow .v").inner_text()
    joke = pg.locator("#effortJoke").inner_text()
    chk("corrects itself to 30 and 70", e2 == "30%" and k2 == "70%", f"{e2} / {k2}")
    chk("ends by sending you to the work", "actual work" in joke, repr(joke))
    eff.screenshot(path=str(SHOTS / "final-effort.png"))

    # drag
    cmp = pg.locator(".cmp").first
    cmp.scroll_into_view_if_needed(); pg.wait_for_timeout(1500)
    box = cmp.bounding_box()
    x = lambda: float(cmp.get_attribute("aria-valuenow"))
    pg.mouse.move(box["x"] + box["width"] * .42, box["y"] + box["height"] / 2)
    pg.mouse.down()
    pg.mouse.move(box["x"] + box["width"] * .82, box["y"] + box["height"] / 2, steps=12)
    mid = x(); pg.mouse.up(); pg.wait_for_timeout(200)
    pg.mouse.move(box["x"] + box["width"] * .2, box["y"] + box["height"] / 2, steps=8)
    pg.wait_for_timeout(150)
    chk("drag follows then releases", mid > 72 and abs(x() - mid) < 2, f"{mid} -> {x()}")

    # every card image fills its frame, none letterboxed
    fit = pg.evaluate("""()=>{const bad=[];
      document.querySelectorAll('.shot img, .shots img, .ba-pair img').forEach(i=>{
        const s=getComputedStyle(i);
        if(s.objectFit!=='cover') bad.push(i.getAttribute('src'));});
      return bad;}""")
    chk("all project images crop to fill", not fit, str(fit[:3]))

    # Every contact tooltip has to survive the panel's overflow:hidden. The first
    # pill sits on the left edge and carries the longest string, so a bubble
    # centred on it used to lose 39px off the front of the address.
    cut = []
    for cls in ("mail", "li", "gh"):
        pg.locator(".c." + cls).hover()
        pg.wait_for_timeout(420)
        vis = pg.evaluate("""(c)=>{
          const t=document.querySelector('.c.'+c+' .reveal').getBoundingClientRect();
          const b=document.querySelector('.closing').getBoundingClientRect();
          return Math.round(100*(Math.min(t.right,b.right)-Math.max(t.left,b.left))/t.width);}""",
          cls)
        if vis < 100:
            cut.append(f"{cls}={vis}%")
    chk("no contact tooltip is clipped by the panel", not cut, str(cut))

    # the closing panel: rounded, and no dead column in the middle of it
    close = pg.evaluate("""()=>{const c=document.querySelector('.closing');
      if(!c) return null;
      const s=getComputedStyle(c), d=document.querySelector('.deep');
      const main=c.querySelector('.closing-main'), peek=c.querySelector('.peek');
      const pr=peek.getBoundingClientRect();
      return {radius:parseFloat(s.borderTopLeftRadius),
              band:getComputedStyle(d).backgroundColor,
              gap:Math.round(pr.left-main.getBoundingClientRect().right),
              rows:peek.querySelectorAll('.r').length,
              label:peek.querySelector('.h').textContent.trim()};}""")
    chk("closing is a rounded panel, not a band",
        close and close["radius"] >= 16 and close["band"] == "rgba(0, 0, 0, 0)", str(close))
    chk("closing card is just the link, no dash list",
        close and abs(close["gap"]) < 2 and close["rows"] == 0
        and close["label"].startswith("Find out more"), str(close))
    pg.close()

    # ---- projects listing is hand built, not Quarto's default grid -------
    pg = b.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=2)
    pg.goto(BASE + "projects/index.html", wait_until="networkidle"); pg.wait_for_timeout(1500)
    chk("projects page uses the site's own cards", pg.locator(".grid > .card").count() == 6,
        f"cards={pg.locator('.grid > .card').count()}")
    chk("no leftover Quarto listing markup",
        pg.locator(".quarto-listing, .quarto-grid-item, .listing-actions-group").count() == 0)
    chk("every listing card shows before and after",
        pg.locator(".grid > .card .lay.b img").count() == 6
        and pg.locator(".grid > .card .lay.a img").count() == 6)
    # one flat colour behind every frame, so no card carries its own brown or blue
    beds = pg.evaluate("""()=>[...new Set([...document.querySelectorAll('.shot .lay')]
        .map(l=>getComputedStyle(l).backgroundColor))]""")
    chk("every frame sits on the same colour", len(beds) == 1, str(beds))
    pg.close()

    # ---- about page ---------------------------------------------------
    pg = b.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=2)
    pg.goto(BASE + "about.html", wait_until="networkidle"); pg.wait_for_timeout(1500)
    chk("competitive record heading", "My competitive record" in pg.content())
    chk("ANYWAY is highlighted", pg.locator(".anyway").count() == 1)
    chk("still here section present", pg.locator(".still-here").count() == 1)
    chk("no contact form line", "contact form" not in pg.content())
    egg = pg.locator(".hgl-egg")
    egg.scroll_into_view_if_needed(); pg.wait_for_timeout(600)
    egg.hover(force=True); pg.wait_for_timeout(900)
    o = pg.evaluate("()=>getComputedStyle(document.querySelector('.hgl-egg .hgl')).opacity")
    chk("glasses easter egg on about", float(o) > .8, f"opacity={o}")
    pg.close()

    # ---- a case study: pairs line up, frames share one colour ------------
    pg = b.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=2)
    pg.goto(BASE + "projects/invoice-checker.html", wait_until="networkidle")
    pg.evaluate("()=>window.scrollTo(0,document.body.scrollHeight)"); pg.wait_for_timeout(1800)
    pair = pg.evaluate("""()=>[...document.querySelectorAll('.ba-pair')].map(p=>{
        const f=[...p.querySelectorAll('figure')].map(x=>Math.round(x.getBoundingClientRect().height));
        return f.length===2 ? Math.abs(f[0]-f[1]) : -1;})""")
    chk("before and after cards are the same height", pair and max(pair) <= 1, str(pair))
    beds = pg.evaluate("""()=>[...new Set([...document.querySelectorAll('.fr')]
        .map(f=>getComputedStyle(f).backgroundColor))]""")
    chk("case study frames share one colour", len(beds) == 1, str(beds))
    # nothing is left tiny: every framed picture uses most of the width it is given
    small = pg.evaluate("""()=>{const bad=[];
      document.querySelectorAll('.shots .fr, .ba-pair .fr').forEach(f=>{
        const i=f.querySelector('img'); if(!i||!i.naturalWidth) return;
        const fw=f.clientWidth, fh=f.clientHeight;
        // a .fill frame is cropped to the frame, so it uses all of it by definition
        const s=f.classList.contains('fill')
          ? Math.max(fw/i.naturalWidth, fh/i.naturalHeight)
          : Math.min(fw/i.naturalWidth, fh/i.naturalHeight);
        const used=Math.min(1,(i.naturalWidth*s)/fw)*Math.min(1,(i.naturalHeight*s)/fh);
        // a portrait shot in a landscape row always keeps side bands; the frames
        // all share one colour now, so those read as margin rather than as a gap
        if(used<0.62) bad.push([i.getAttribute('src'), Math.round(used*100)+'%']);});
      return bad;}""")
    chk("no picture is left small inside its frame", not small, str(small[:3]))
    chk("capstone star spins", pg.evaluate("""()=>{
        const s=document.querySelector('.th-star,.featured-new .fn-label .spark');
        return s ? getComputedStyle(s).animationName : 'none';}""") != "none")
    pg.close()

    # ---- nothing tints a screenshot a colour it never was ----------------
    pg = b.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=2)
    pg.goto(BASE, wait_until="networkidle"); pg.wait_for_timeout(1500)
    tinted = pg.evaluate("""()=>{const bad=[];
      const hot=/rgb\\(\\s*(9[0-9]|1\\d\\d|2\\d\\d)/;  // any strongly coloured channel mix
      [['.shot .lay.b','::after'],['.cmp .tint',''],['.fr','::after']].forEach(([sel,pe])=>{
        document.querySelectorAll(sel).forEach(el=>{
          const bg=getComputedStyle(el,pe||null).backgroundImage;
          if(/mix-blend/.test(getComputedStyle(el,pe||null).mixBlendMode)) {}
          // a colour cast shows up as a gradient stop with one channel far from the others
          const stops=bg.match(/rgba?\\([^)]+\\)/g)||[];
          stops.forEach(s=>{const n=s.match(/[\\d.]+/g).map(Number);
            if(n.length>=3 && Math.max(n[0],n[1],n[2])-Math.min(n[0],n[1],n[2])>60)
              bad.push(sel+pe+' '+s);});});});
      return [...new Set(bad)];}""")
    chk("no colour cast on any screenshot", not tinted, str(tinted[:3]))
    blend = pg.evaluate("""()=>[...document.querySelectorAll('.shot .lay.b')]
        .some(l=>getComputedStyle(l,'::after').mixBlendMode==='color')""")
    chk("before images are plain grey, not duotoned", not blend)
    pg.close()

    # ---- before/after pairs keep their order -----------------------------
    pg = b.new_page(viewport={"width": 1440, "height": 1000})
    pg.goto(BASE + "projects/docs-system.html", wait_until="networkidle")
    pg.evaluate("()=>window.scrollTo(0,document.body.scrollHeight)"); pg.wait_for_timeout(1800)
    order = pg.evaluate("""()=>[...document.querySelectorAll('.ba-pair')].map(p=>
        [...p.querySelectorAll('figure')].sort((a,b)=>
          a.getBoundingClientRect().left-b.getBoundingClientRect().left)
        .map(f=>f.className.split(' ')[0]).join('|'))""")
    chk("before is always on the left", all(o == "before|after" for o in order), str(order))
    pg.close()

    # ---- responsive ----------------------------------------------------
    for w in (320, 390, 768, 1024, 1440, 1920):
        pg = b.new_page(viewport={"width": w, "height": 900})
        pg.goto(BASE, wait_until="networkidle"); pg.wait_for_timeout(1600)
        o = pg.evaluate("()=>document.documentElement.scrollWidth-document.documentElement.clientWidth")
        chk(f"no overflow @{w}", o <= 0, f"{o}px")
        pg.close()

    # ---- screenshots ---------------------------------------------------
    for path, name, w, full in [("index.html", "final-home", 1440, True),
                                ("index.html", "final-top", 1440, False),
                                ("about.html", "final-about", 1440, True),
                                ("projects/index.html", "final-projects", 1440, True),
                                ("projects/sap-dashboard.html", "final-case", 1440, True),
                                ("index.html", "final-mobile", 390, True)]:
        pg = b.new_page(viewport={"width": w, "height": 1000}, device_scale_factor=2)
        pg.goto(BASE + path, wait_until="networkidle"); pg.wait_for_timeout(2600)
        if full:
            pg.evaluate("()=>window.scrollTo(0,document.body.scrollHeight)"); pg.wait_for_timeout(1200)
            pg.evaluate("()=>window.scrollTo(0,0)"); pg.wait_for_timeout(900)
        pg.screenshot(path=str(SHOTS / f"{name}.png"), full_page=full)
        pg.close()
    b.close()

print(f"\n{sum(ok)}/{len(ok)} passed")
