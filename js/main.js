/* Toothly, interactions and accessibility behaviour. No dependencies. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }



  /* ---------- Desktop nav: two indicators ----------
     .nav__ghost  faint highlight that follows hover / keyboard focus
     .nav__pill   white "selected" pill: sits on the current page, moves only on click
     Both are driven by a small damped spring so moves stay smooth when interrupted. */
  var deskMenu = $(".nav > .nav__menu");
  if (deskMenu) {
    var navEl = deskMenu.parentElement;
    var links = $$(".nav__link", deskMenu);
    var current = $(".nav__link[aria-current=page]", deskMenu);
    function makeIndicator(cls, K, C) {
      var el = document.createElement("span"); el.className = cls; el.setAttribute("aria-hidden", "true");
      deskMenu.insertBefore(el, deskMenu.firstChild);
      var st = { x: 0, w: 0, vx: 0, vw: 0, tx: 0, tw: 0 }, raf = null, last = 0, placed = false;
      function paint() { el.style.width = st.w.toFixed(2) + "px"; el.style.transform = "translate3d(" + st.x.toFixed(2) + "px,0,0)"; }
      function step(t) {
        var dt = Math.min(0.032, (t - last) / 1000 || 0.016); last = t;
        st.vx += (K * (st.tx - st.x) - C * st.vx) * dt; st.vw += (K * (st.tw - st.w) - C * st.vw) * dt;
        st.x += st.vx * dt; st.w += st.vw * dt; paint();
        if (Math.abs(st.tx - st.x) < 0.1 && Math.abs(st.vx) < 0.1 && Math.abs(st.tw - st.w) < 0.1 && Math.abs(st.vw) < 0.1) {
          st.x = st.tx; st.w = st.tw; st.vx = st.vw = 0; paint(); raf = null;
        } else raf = requestAnimationFrame(step);
      }
      return {
        el: el,
        to: function (link, instant) {
          var m = deskMenu.getBoundingClientRect(), r = link.getBoundingClientRect();
          st.tx = r.left - m.left - deskMenu.clientLeft; st.tw = r.width;
          if (instant || !placed || reduceMotion.matches) {
            st.x = st.tx; st.w = st.tw; st.vx = st.vw = 0; paint(); placed = true;
            if (raf) { cancelAnimationFrame(raf); raf = null; }
          } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
        }
      };
    }
    var ghost = makeIndicator("nav__ghost", 520, 40);   // quick, no overshoot
    var pill = makeIndicator("nav__pill", 420, 30);     // a touch of spring
    var hovered = null, keyboard = false, hideTimer = null;
    navEl.classList.add("has-pill");

    function showGhost(link, viaKeyboard) {
      clearTimeout(hideTimer);
      hovered = link;
      links.forEach(function (l) { l.classList.toggle("is-hover", l === link); });
      var onSelected = link === (pill.selected || current);
      ghost.to(link, !ghost.el.classList.contains("is-on"));
      ghost.el.classList.toggle("is-on", !onSelected || viaKeyboard);
      ghost.el.classList.toggle("is-focus", !!viaKeyboard);
    }
    function hideGhost() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        hovered = null; links.forEach(function (l) { l.classList.remove("is-hover"); });
        ghost.el.classList.remove("is-on", "is-focus");
      }, 90);
    }
    function select(link, instant) {
      pill.selected = link;
      links.forEach(function (l) { l.classList.toggle("is-target", l === link); });
      pill.to(link, instant);
      pill.el.classList.add("is-ready");
    }

    document.addEventListener("keydown", function (e) { if (e.key === "Tab") keyboard = true; });
    document.addEventListener("pointerdown", function () { keyboard = false; });
    links.forEach(function (l) {
      l.addEventListener("pointerenter", function () { showGhost(l, false); });
      l.addEventListener("focus", function () { if (keyboard) showGhost(l, true); });
      l.addEventListener("blur", function () { hideGhost(); });
      l.addEventListener("pointerdown", function () {
        select(l); pill.el.classList.add("is-pressed");
        ghost.el.classList.remove("is-on");
      });
    });
    ["pointerup", "pointercancel", "dragend"].forEach(function (ev) {
      document.addEventListener(ev, function () { pill.el.classList.remove("is-pressed"); });
    });
    deskMenu.addEventListener("pointerleave", hideGhost);
    function relayout() { if (pill.selected) pill.to(pill.selected, true); if (hovered) ghost.to(hovered, true); }
    window.addEventListener("resize", relayout);
    window.addEventListener("pageshow", function () { if (current) select(current, true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    if (current) select(current, true);
  }


  /* ---------- Live open / closed status (clinic time, San Francisco) ---------- */
  $$("[data-open-status]").forEach(function (status) {
    try {
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ""; };
      var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
      var mins = (Number(get("hour")) % 24) * 60 + Number(get("minute"));
      var close = day === 6 ? 15 * 60 : 18 * 60;
      var open = day >= 1 && mins >= 9 * 60 && mins < close;
      var txt = $("[data-open-text]", status);
      if (open) { status.classList.add("is-open"); txt.textContent = "Open now, until " + (day === 6 ? "3 PM" : "6 PM"); }
      else if (day === 0 || (day === 6 && mins >= close)) txt.textContent = "Closed now. Opens Monday at 9 AM";
      else if (mins < 9 * 60) txt.textContent = "Closed now. Opens today at 9 AM";
      else txt.textContent = "Closed now. Opens tomorrow at 9 AM";
    } catch (e) {}
  });

  /* ---------- About: filter dentists by specialty ---------- */
  $$("[data-team]").forEach(function (sec) {
    var chips = $$(".chip[data-filter]", sec), members = $$(".member[data-tags]", sec), live = $("[data-team-status]", sec);
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var f = c.getAttribute("data-filter"), shown = 0;
        chips.forEach(function (o) { o.setAttribute("aria-pressed", String(o === c)); });
        members.forEach(function (m) {
          var on = f === "all" || m.getAttribute("data-tags").split(" ").indexOf(f) > -1;
          m.classList.toggle("is-dim", !on); if (on) { shown++; m.classList.add("is-in"); }
        });
        if (live) live.textContent = shown + (shown === 1 ? " dentist" : " dentists") + " shown";
      });
    });
  });

  /* ---------- Sticky header ---------- */
  var header = $(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var navToggle = $(".nav__toggle");
  var navPanel = $("#nav-panel");
  function setNav(open) {
    if (!navToggle) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    navPanel.classList.toggle("is-open", open);
  }
  if (navToggle && navPanel) {
    navToggle.addEventListener("click", function () { setNav(navToggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") { setNav(false); navToggle.focus(); }
    });
    window.matchMedia("(min-width: 1025px)").addEventListener("change", function (m) { if (m.matches) setNav(false); });
  }

  /* ---------- Scroll reveal ---------- */
  $$("[data-stagger]").forEach(function (group) {
    $$(":scope > .reveal", group).forEach(function (el, i) { el.style.setProperty("--i", i); });
  });
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Count-up numbers ---------- */
  var counters = $$("[data-count]");
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    var suffix = el.getAttribute("data-suffix") || "";
    var start = null, dur = 1100;
    function frame(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (counters.length && "IntersectionObserver" in window && !reduceMotion.matches) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) {
      var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
      el.textContent = (0).toFixed(decimals) + (el.getAttribute("data-suffix") || "");
      cio.observe(el);
    });
  }

  /* ---------- How it works: disclosure list with optional autoplay ---------- */
  $$("[data-steps]").forEach(function (list) {
    var steps = $$(".step", list);
    var idx = Math.max(0, steps.findIndex(function (s) { return s.getAttribute("aria-expanded") === "true"; }));
    var timer = null, inView = false, userTook = false;
    var DUR = 5000;
    list.style.setProperty("--step-dur", DUR + "ms");

    function open(i, fromUser) {
      idx = i;
      steps.forEach(function (s, j) { s.setAttribute("aria-expanded", String(j === i)); });
      if (fromUser) { userTook = true; stop(); }
      else schedule();
    }
    function schedule() {
      clearTimeout(timer);
      return; // autoplay disabled: content changes only when the user asks
      list.classList.add("is-auto");
      // restart progress animation
      var bar = $(".step[aria-expanded=true] .step__progress i", list);
      if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
      timer = setTimeout(function () { open((idx + 1) % steps.length, false); }, DUR);
    }
    function stop() { clearTimeout(timer); list.classList.remove("is-auto"); }

    steps.forEach(function (s, i) {
      s.addEventListener("click", function () { open(i, true); });
    });
    list.addEventListener("mouseenter", function () { list.classList.add("is-paused"); clearTimeout(timer); });
    list.addEventListener("mouseleave", function () { list.classList.remove("is-paused"); schedule(); });
    list.addEventListener("focusin", function () { userTook = true; stop(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) schedule(); else stop();
      }, { threshold: 0.5 }).observe(list);
    }
  });


  /* ---------- Pricing: weekly / monthly / yearly ---------- */
  $$("[data-pricing]").forEach(function (section) {
    var PER = { weekly: "/week", monthly: "/month", yearly: "/year" };
    var plans = $$(".plan[data-plan]", section);
    function money(n) { return "$" + Number(n).toLocaleString("en-US"); }
    function render(period, animate) {
      plans.forEach(function (plan) {
        var amount = plan.getAttribute("data-" + period);
        var monthly = Number(plan.getAttribute("data-monthly"));
        var note = period === "yearly" ? "Billed yearly. Save " + money(monthly * 12 - Number(amount)) + "." : period === "weekly" ? "Billed weekly" : "Billed monthly";
        function apply() {
          $("[data-amount]", plan).textContent = money(amount);
          $("[data-per]", plan).textContent = PER[period];
          $("[data-note]", plan).textContent = note;
          var name = plan.getAttribute("data-plan");
          var btn = $("[data-choose]", plan);
          btn.setAttribute("aria-label", "Choose " + name + ", " + money(amount) + " per " + period.replace("ly", ""));
          btn.href = "contact.html?subject=" + encodeURIComponent(name + " plan") + "&billing=" + period + "#message";
          plan.classList.remove("is-swapping");
        }
        if (animate && !reduceMotion.matches) { plan.classList.add("is-swapping"); setTimeout(apply, 180); }
        else apply();
      });
    }
    $$("input[name=billing]", section).forEach(function (r) {
      r.addEventListener("change", function () { if (r.checked) render(r.value, true); });
    });
    var checked = $("input[name=billing]:checked", section);
    render(checked ? checked.value : "monthly", false);
  });

  /* ---------- FAQ accordion ---------- */
  $$(".faq__q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.closest(".faq__item").classList.toggle("is-open", !expanded);
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (panel) panel.setAttribute("aria-hidden", String(expanded));
    });
  });

  /* ---------- Testimonials: vertical carousel ---------- */
  $$("[data-testi]").forEach(function (wrap) {
    var viewport = $(".testi__viewport", wrap);
    var track = $(".testi__track", wrap);
    var cards = $$(".t-card", track);
    var prev = $("[data-prev]", wrap), next = $("[data-next]", wrap);
    var status = $("[data-testi-status]", wrap);
    var VISIBLE = 3, pos = 0;
    var max = Math.max(0, cards.length - VISIBLE);
    var desktop = window.matchMedia("(min-width: 1025px)");

    function render() {
      if (!desktop.matches) {
        track.style.transform = "";
        cards.forEach(function (c) { c.removeAttribute("aria-hidden"); c.removeAttribute("inert"); });
        return;
      }
      var offset = cards[pos].offsetTop - cards[0].offsetTop;
      track.style.transform = "translateY(" + (-offset) + "px)";
      cards.forEach(function (c, i) {
        var visible = i >= pos && i < pos + VISIBLE;
        if (visible) { c.removeAttribute("aria-hidden"); c.removeAttribute("inert"); }
        else { c.setAttribute("aria-hidden", "true"); c.setAttribute("inert", ""); }
      });
      var h = 0;
      for (var i = pos; i < Math.min(pos + VISIBLE, cards.length); i++) h += cards[i].offsetHeight;
      viewport.style.height = (h + 24 * (VISIBLE - 1)) + "px";
      prev.setAttribute("aria-disabled", String(pos === 0));
      next.setAttribute("aria-disabled", String(pos >= max));
      if (status) status.textContent = "Showing reviews " + (pos + 1) + " to " + Math.min(pos + VISIBLE, cards.length) + " of " + cards.length;
    }
    prev.addEventListener("click", function () { if (pos > 0) { pos--; render(); } });
    next.addEventListener("click", function () { if (pos < max) { pos++; render(); } });
    desktop.addEventListener("change", render);
    window.addEventListener("resize", render);
    window.addEventListener("load", render);
    render();
  });

  /* ---------- Horizontal carousel buttons (doctors) ---------- */
  $$("[data-carousel]").forEach(function (wrap) {
    var track = $(".carousel", wrap);
    var prev = $("[data-prev]", wrap), next = $("[data-next]", wrap);
    if (!track || !prev) return;
    function step() { var card = track.firstElementChild; return card ? card.getBoundingClientRect().width + 24 : 300; }
    function update() {
      prev.setAttribute("aria-disabled", String(track.scrollLeft <= 4));
      next.setAttribute("aria-disabled", String(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4));
    }
    prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: reduceMotion.matches ? "auto" : "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: reduceMotion.matches ? "auto" : "smooth" }); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* ---------- Video modal ---------- */
  var modal = $("#video-modal");
  if (modal && typeof modal.showModal === "function") {
    var opener = null;
    var video = $("video", modal);
    $$("[data-open-video]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        opener = btn;
        modal.showModal();
        if (video && video.readyState > 0) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      });
    });
    function close() { if (video) video.pause(); modal.close(); }
    $(".modal__close", modal).addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    modal.addEventListener("close", function () { if (video) video.pause(); if (opener) opener.focus(); });
    if (video) {
      video.addEventListener("error", showFallback, true);
      var src = $("source", video);
      if (src) src.addEventListener("error", showFallback);
    }
    function showFallback() { var fb = $(".modal__fallback", modal); if (fb) fb.hidden = false; if (video) video.hidden = true; }
  }

  /* ---------- Clinic hours: highlight today ---------- */
  var today = new Date().getDay(); // 0 = Sunday
  $$("[data-day]").forEach(function (row) {
    if (Number(row.getAttribute("data-day")) === today) {
      row.classList.add("is-today");
      var dt = $("dt", row);
      if (dt && !$(".today-pill", dt)) {
        var pill = document.createElement("span");
        pill.className = "today-pill";
        pill.textContent = "Today";
        dt.appendChild(pill);
      }
    }
  });

  /* ---------- Forms ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^[+()\-\s\d]{7,}$/;

  function fieldOf(input) { return input.closest(".field"); }
  function setError(input, msg) {
    var field = fieldOf(input);
    var err = field && $(".field__error", field);
    if (msg) {
      input.setAttribute("aria-invalid", "true");
      if (field) field.classList.add("is-invalid");
      if (err) err.textContent = msg;
    } else {
      input.removeAttribute("aria-invalid");
      if (field) field.classList.remove("is-invalid");
      if (err) err.textContent = "";
    }
  }
  function validate(input) {
    var v = (input.value || "").trim();
    var label = input.getAttribute("data-label") || "This field";
    if (input.required && !v) return label + " is required.";
    if (v && input.type === "email" && !EMAIL_RE.test(v)) return "Enter an email address like name@example.com.";
    if (v && input.type === "tel" && !PHONE_RE.test(v)) return "Enter a phone number with at least 7 digits.";
    if (v && input.type === "date") {
      var d = new Date(v + "T12:00:00");
      var t0 = new Date(); t0.setHours(0, 0, 0, 0);
      if (d < t0) return "Choose today or a future date.";
      if (d.getDay() === 0) return "We are closed on Sundays. Choose Monday to Saturday.";
    }
    if (v && input.minLength > 0 && v.length < input.minLength) return label + " needs at least " + input.minLength + " characters.";
    return "";
  }

  // Booking: date min = today, time slots follow clinic hours.
  $$("input[type=date][data-booking-date]").forEach(function (dateInput) {
    var now = new Date();
    var iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = iso;
    var form = dateInput.form;
    var time = form && $("select[data-booking-time]", form);
    function fillSlots() {
      if (!time) return;
      var keep = time.value;
      var v = dateInput.value;
      var day = v ? new Date(v + "T12:00:00").getDay() : -1;
      var end = day === 6 ? 15 : 18;
      time.innerHTML = "";
      var ph = document.createElement("option");
      ph.value = ""; ph.textContent = day === 0 ? "Closed on Sundays" : "Select a time";
      time.appendChild(ph);
      if (day === 0) { time.disabled = true; return; }
      time.disabled = false;
      for (var h = 9; h < end; h++) {
        [0, 30].forEach(function (m) {
          var o = document.createElement("option");
          var hh = String(h).padStart(2, "0") + ":" + (m ? "30" : "00");
          var h12 = ((h + 11) % 12) + 1;
          o.value = hh;
          o.textContent = h12 + ":" + (m ? "30" : "00") + (h < 12 ? " AM" : " PM");
          time.appendChild(o);
        });
      }
      if (keep && $("option[value='" + keep + "']", time)) time.value = keep;
    }
    dateInput.addEventListener("change", fillSlots);
    fillSlots();
  });

  // Preselect subject from ?service= on contact page
  var params = new URLSearchParams(location.search);
  var subj = $("select[name=subject]");
  if (subj && params.get("subject")) {
    var opt = $$("option", subj).find(function (o) { return o.value === params.get("subject"); });
    if (opt) subj.value = opt.value;
    var billing = params.get("billing");
    var msgBox = $("textarea[name=message]");
    if (billing && msgBox && !msgBox.value) {
      msgBox.value = "Hi, I’d like to join the Toothly membership, billed " + billing + ". ";
    }
  }

  $$("form[data-validate]").forEach(function (form) {
    var inputs = $$("input, select, textarea", form).filter(function (el) { return el.type !== "hidden" && el.type !== "submit"; });
    var status = $(".form-status", form);
    var submit = $("[type=submit]", form);

    inputs.forEach(function (input) {
      input.addEventListener("blur", function () { if (input.value) setError(input, validate(input)); });
      input.addEventListener("input", function () { if (input.getAttribute("aria-invalid") === "true") setError(input, validate(input)); });
      input.addEventListener("change", function () { if (input.getAttribute("aria-invalid") === "true") setError(input, validate(input)); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      inputs.forEach(function (input) {
        if (input.disabled) { if (input.required) { setError(input, "Choose another date first."); firstBad = firstBad || input; } return; }
        var msg = validate(input);
        setError(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      if (status) { status.className = "form-status"; status.textContent = ""; }
      if (firstBad) {
        var n = inputs.filter(function (i) { return i.getAttribute("aria-invalid") === "true"; }).length;
        if (status) {
          status.className = "form-status form-status--error is-visible";
          status.textContent = n === 1 ? "1 field needs your attention." : n + " fields need your attention.";
        }
        firstBad.focus();
        return;
      }
      // No backend in this build: simulate a request so the flow is testable.
      submit.setAttribute("aria-busy", "true");
      var label = submit.textContent;
      submit.textContent = "Sending…";
      setTimeout(function () {
        submit.removeAttribute("aria-busy");
        submit.textContent = label;
        var nameInput = $("input[name=name]", form);
        var first = nameInput ? nameInput.value.trim().split(" ")[0] : "";
        if (status) {
          status.className = "form-status form-status--success is-visible";
          status.textContent = form.getAttribute("data-success").replace("{name}", first ? ", " + first : "");
        }
        form.reset();
        inputs.forEach(function (i) { setError(i, ""); i.dispatchEvent(new Event("change")); });
        if (status) status.focus();
      }, 900);
    });
  });

  // Newsletter
  $$("form[data-subscribe]").forEach(function (form) {
    var input = $("input[type=email]", form);
    var msg = form.parentElement.querySelector(".subscribe__msg");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!EMAIL_RE.test(v)) {
        input.setAttribute("aria-invalid", "true");
        msg.className = "subscribe__msg is-error";
        msg.textContent = v ? "Enter an email address like name@example.com." : "Enter your email address to subscribe.";
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      msg.className = "subscribe__msg is-success";
      msg.textContent = "You’re in. Check your inbox for a confirmation email.";
      form.reset();
    });
  });

  /* ---------- Service details: switch content by ?service= ---------- */
  var detail = $("[data-service-detail]");
  var dataEl = $("#service-data");
  if (detail && dataEl) {
    var services = JSON.parse(dataEl.textContent);
    var slug = params.get("service");
    var s = services[slug];
    if (s) {
      document.title = s.title + " | Toothly Dental Clinic";
      $$("[data-s]").forEach(function (el) {
        var key = el.getAttribute("data-s");
        if (s[key] != null) el.textContent = s[key];
      });
      var offers = $("[data-s-offers]");
      if (offers && s.offers) {
        $$(".proc-card", offers).forEach(function (card, i) {
          var o = s.offers[i];
          if (!o) { card.hidden = true; return; }
          $("h3", card).textContent = o[0];
          $("p", card).textContent = o[1];
        });
      }
      $$("[data-related]").forEach(function (card) {
        if (card.getAttribute("data-related") === slug) card.hidden = true;
      });
      var visible = $$("[data-related]").filter(function (c) { return !c.hidden; });
      visible.forEach(function (c, i) { if (i > 2) c.hidden = true; });
      var book = $("[data-s-book]");
      if (book) book.href = "contact.html?subject=" + encodeURIComponent(s.title) + "#message";
    } else {
      var extra = $$("[data-related]");
      extra.forEach(function (c, i) { if (c.getAttribute("data-related") === "pediatric" || i > 3) c.hidden = true; });
      var shown = extra.filter(function (c) { return !c.hidden; });
      shown.forEach(function (c, i) { if (i > 2) c.hidden = true; });
    }
  }
})();
