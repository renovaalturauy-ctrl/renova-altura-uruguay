(function () {
  "use strict";

  /* ── Helpers ── */
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[RENOVA:" + name + "]", e); }
  }

  /* ──────────────────────────────────────────
     SPLASH
  ────────────────────────────────────────── */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    function hide() { splash.classList.add("is-out"); }
    if (document.readyState === "complete") {
      setTimeout(hide, 700);
    } else {
      window.addEventListener("load", function () { setTimeout(hide, 600); });
    }
    setTimeout(hide, 4000); // JS safety
  }

  /* ──────────────────────────────────────────
     CURSOR (desktop only)
  ────────────────────────────────────────── */
  function initCursor() {
    if (!fineHover) return;
    var cursor = $(".cursor");
    if (!cursor) return;
    var dot  = $(".cursor-dot",  cursor);
    var ring = $(".cursor-ring", cursor);
    if (!dot || !ring) return;

    var mx = 0, my = 0, rx = 0, ry = 0;
    var firstMove = false;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform  = "translate3d(" + mx + "px," + my + "px,0) translate(-50%,-50%)";
      if (!firstMove) {
        firstMove = true;
        rx = mx; ry = my;
        ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
        cursor.classList.add("is-ready");
      }
    });

    // Smooth ring follow
    (function loop() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();

    // Hover state on interactive elements
    var HOVERABLES = "a, button, .service-card, .sector-badge, .gallery-item, .feature-item";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(HOVERABLES)) document.body.classList.add("cursor-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(HOVERABLES)) document.body.classList.remove("cursor-hover");
    });
  }

  /* ──────────────────────────────────────────
     NAV — transparent → solid + mobile menu
  ────────────────────────────────────────── */
  function initNav() {
    var header  = $("#header");
    var burger  = $("#navBurger");
    var menu    = $("#navMenu");
    if (!header) return;

    // Solid on scroll
    function onScroll() {
      if (window.scrollY > 40) {
        header.classList.add("is-solid");
      } else {
        header.classList.remove("is-solid");
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Mobile burger
    if (burger && menu) {
      burger.addEventListener("click", function () {
        var isOpen = menu.classList.toggle("is-open");
        burger.classList.toggle("is-open", isOpen);
        burger.setAttribute("aria-expanded", String(isOpen));
      });
      // Close on link click
      $$("a", menu).forEach(function (a) {
        a.addEventListener("click", function () {
          menu.classList.remove("is-open");
          burger.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  /* ──────────────────────────────────────────
     SMOOTH ANCHOR SCROLL
  ────────────────────────────────────────── */
  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"), 10) || 80;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navH,
        behavior: "smooth"
      });
    });
  }

  /* ──────────────────────────────────────────
     SCROLL REVEALS (IntersectionObserver)
  ────────────────────────────────────────── */
  function initReveals() {
    var items = $$(".reveal");
    if (!items.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -4% 0px" });

    items.forEach(function (el) { io.observe(el); });

    // Safety: force-reveal visible items after 1.5s
    setTimeout(function () {
      items.forEach(function (el) {
        if (!el.classList.contains("is-visible")) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight + 200) {
            el.classList.add("is-visible");
          }
        }
      });
    }, 1500);
  }

  /* ──────────────────────────────────────────
     HERO SCROLL HINT — fade out on scroll
  ────────────────────────────────────────── */
  function initHeroScrollHint() {
    var hint = $(".hero-scroll-hint");
    if (!hint) return;
    window.addEventListener("scroll", function () {
      var progress = Math.min(1, window.scrollY / 200);
      hint.style.opacity = String(0.5 * (1 - progress));
    }, { passive: true });
  }

  /* ──────────────────────────────────────────
     HERO PARALLAX (GSAP + ScrollTrigger)
  ────────────────────────────────────────── */
  function initHeroParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    var overlay = $(".hero-overlay");
    var content = $(".hero-content");
    if (!overlay || !content) return;

    gsap.to(overlay, {
      opacity: 0.95,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.to(content, {
      y: 80,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "60% top",
        scrub: true
      }
    });
  }

  /* ──────────────────────────────────────────
     GALLERY LIGHTBOX
  ────────────────────────────────────────── */
  function initGallery() {
    var items = $$(".gallery-item");
    if (!items.length) return;

    // Build lightbox
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Imagen ampliada");
    lb.innerHTML = '<button class="lightbox-close" aria-label="Cerrar">&times;</button><img class="lightbox-img" src="" alt="" />';
    document.body.appendChild(lb);

    var lbImg   = lb.querySelector(".lightbox-img");
    var lbClose = lb.querySelector(".lightbox-close");

    function open(img) {
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lb.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(function () { lbImg.src = ""; }, 400);
    }

    items.forEach(function (item) {
      item.addEventListener("click", function () {
        var img = item.querySelector("img");
        if (img) open(img);
      });
    });
    lbClose.addEventListener("click", close);
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("is-open")) close();
    });
  }

  /* ──────────────────────────────────────────
     CONTACT FORM — send via WhatsApp
  ────────────────────────────────────────── */
  function initForm() {
    var form = $("#contactForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      form.classList.add("is-sending");
      var btn = $("#submitBtn", form);
      if (btn) btn.disabled = true;

      // Build WhatsApp message from form data
      var nombre   = ($("#nombre",   form) || {}).value || "";
      var empresa  = ($("#empresa",  form) || {}).value || "";
      var emailVal = ($("#email",    form) || {}).value || "";
      var tel      = ($("#telefono", form) || {}).value || "";
      var servicio = ($("#servicio", form) || {}).selectedOptions[0]
                     ? ($("#servicio", form) || {}).selectedOptions[0].text : "";
      var mensaje  = ($("#mensaje",  form) || {}).value || "";

      var lines = [
        "Hola RENOVA, me interesa solicitar un presupuesto.",
        "Nombre: " + nombre,
        empresa ? "Empresa: " + empresa : "",
        "Email: " + emailVal,
        tel      ? "Teléfono: " + tel : "",
        "Servicio: " + servicio,
        mensaje  ? "Mensaje: " + mensaje : ""
      ].filter(Boolean).join("\n");

      var waURL = "https://wa.me/59892588755?text=" + encodeURIComponent(lines);

      setTimeout(function () {
        form.classList.remove("is-sending");
        form.classList.add("is-sent");
        window.open(waURL, "_blank", "noopener,noreferrer");
        // Reset after delay
        setTimeout(function () {
          form.classList.remove("is-sent");
          form.reset();
          if (btn) btn.disabled = false;
        }, 4000);
      }, 900);
    });
  }

  /* ──────────────────────────────────────────
     GSAP STAGGER REVEALS (enhanced)
  ────────────────────────────────────────── */
  function initGsapAnimations() {
    if (!window.gsap || !window.ScrollTrigger) return;

    // Service cards stagger
    var cards = $$(".service-card");
    if (cards.length) {
      gsap.fromTo(cards,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.07, duration: 0.7, ease: "expo.out",
          scrollTrigger: {
            trigger: ".services-grid",
            start: "top 80%"
          }
        }
      );
      // Remove CSS reveal class from cards since GSAP handles them
      cards.forEach(function (c) { c.classList.remove("reveal"); c.classList.add("is-visible"); });
    }
  }

  /* ──────────────────────────────────────────
     COUNTER ANIMATION
  ────────────────────────────────────────── */
  function initCounters() {
    var counters = $$("[data-count-to]");
    if (!counters.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el  = e.target;
        var end = parseFloat(el.dataset.countTo);
        var dec = (String(end).split(".")[1] || "").length;
        var dur = 1200;
        var start = performance.now();
        (function tick(now) {
          var progress = Math.min((now - start) / dur, 1);
          var ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = (end * ease).toFixed(dec);
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = end.toFixed(dec);
        })(start);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ──────────────────────────────────────────
     TESTIMONIOS — Carrusel premium
     - Flechas, dots, swipe táctil, autoplay con pausa
  ────────────────────────────────────────── */
  function initTestimonials() {
    var stage = document.querySelector("[data-testimonials]");
    if (!stage) return;

    var track  = stage.querySelector("[data-track]");
    var slides = $$("[data-slide]", track);
    var prev   = stage.querySelector("[data-prev]");
    var next   = stage.querySelector("[data-next]");
    var dots   = $$("[data-dot]", stage);
    var current = stage.querySelector("[data-current]");
    var total   = stage.querySelector("[data-total]");
    if (!track || !slides.length) return;

    var index = 0;
    var count = slides.length;
    var AUTOPLAY_MS = 7500;
    var autoplayTimer = null;
    var isPointerDown = false;
    var startX = 0;
    var deltaX = 0;
    var dragging = false;
    var trackBaseX = 0;

    if (total) total.textContent = String(count).padStart(2, "0");

    function pad(n) { return String(n + 1).padStart(2, "0"); }

    function update(animated) {
      track.style.transition = animated === false ? "none" : "";
      track.style.transform  = "translate3d(" + (-index * 100) + "%,0,0)";

      slides.forEach(function (s, i) {
        s.classList.toggle("is-active", i === index);
        s.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === index);
        d.setAttribute("aria-selected", i === index ? "true" : "false");
      });
      if (current) current.textContent = pad(index);
    }

    function go(i) {
      index = ((i % count) + count) % count;
      update(true);
      restartAutoplay();
    }
    function nextSlide() { go(index + 1); }
    function prevSlide() { go(index - 1); }

    /* Controls */
    if (prev) prev.addEventListener("click", prevSlide);
    if (next) next.addEventListener("click", nextSlide);
    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { go(i); });
    });

    /* Keyboard (only when stage is in view) */
    document.addEventListener("keydown", function (e) {
      var rect = stage.getBoundingClientRect();
      var inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft")  prevSlide();
    });

    /* Touch / pointer swipe */
    function pointerDown(e) {
      isPointerDown = true;
      dragging = false;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      deltaX = 0;
      trackBaseX = -index * track.offsetWidth;
      track.style.transition = "none";
      stopAutoplay();
    }
    function pointerMove(e) {
      if (!isPointerDown) return;
      var x = (e.touches ? e.touches[0].clientX : e.clientX);
      deltaX = x - startX;
      if (Math.abs(deltaX) > 8) dragging = true;
      var pct = ((trackBaseX + deltaX) / track.offsetWidth) * 100;
      track.style.transform = "translate3d(" + pct + "%,0,0)";
    }
    function pointerUp() {
      if (!isPointerDown) return;
      isPointerDown = false;
      track.style.transition = "";
      var threshold = track.offsetWidth * 0.18;
      if (deltaX < -threshold) nextSlide();
      else if (deltaX > threshold) prevSlide();
      else update(true);
      deltaX = 0;
    }

    track.addEventListener("touchstart", pointerDown, { passive: true });
    track.addEventListener("touchmove",  pointerMove, { passive: true });
    track.addEventListener("touchend",   pointerUp);
    track.addEventListener("touchcancel",pointerUp);

    track.addEventListener("mousedown", function (e) {
      pointerDown(e); e.preventDefault();
    });
    window.addEventListener("mousemove", pointerMove);
    window.addEventListener("mouseup",   pointerUp);

    // Prevent accidental link clicks after a drag
    track.addEventListener("dragstart", function (e) { e.preventDefault(); });
    track.addEventListener("click", function (e) {
      if (dragging) { e.preventDefault(); e.stopPropagation(); dragging = false; }
    }, true);

    /* Autoplay */
    function startAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = setInterval(nextSlide, AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
    }
    function restartAutoplay() { stopAutoplay(); startAutoplay(); }

    stage.addEventListener("mouseenter", stopAutoplay);
    stage.addEventListener("mouseleave", startAutoplay);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAutoplay(); else startAutoplay();
    });

    /* Init */
    update(false);
    startAutoplay();
  }

  /* ──────────────────────────────────────────
     BOOT
  ────────────────────────────────────────── */
  function boot() {
    safe(initSplash,         "splash");
    safe(initCursor,         "cursor");
    safe(initNav,            "nav");
    safe(initSmoothScroll,   "smoothScroll");
    safe(initReveals,        "reveals");
    safe(initHeroScrollHint, "heroHint");
    safe(initGallery,        "gallery");
    safe(initForm,           "form");
    safe(initCounters,       "counters");
    safe(initTestimonials,   "testimonials");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initHeroParallax,   "heroParallax");
      safe(initGsapAnimations, "gsapAnimations");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
