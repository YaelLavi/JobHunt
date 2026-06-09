(function () {
  'use strict';

  var steps = SITE_CONTENT.steps;
  var intro = SITE_CONTENT.intro;
  var current = -1;

  var el = {
    groups:    document.getElementById('sidebarGroups'),
    card:      document.getElementById('contentCard'),
    main:      document.getElementById('main-content'),
    prev:      document.getElementById('prevBtn'),
    next:      document.getElementById('nextBtn'),
    progLabel: document.getElementById('progressLabel'),
    progFill:  document.getElementById('progressFill'),
    homeBtn:   document.getElementById('introBtn'),
    sidebar:   document.getElementById('sidebar'),
    backdrop:  document.getElementById('sidebarOverlay'),
    menuBtn:   document.getElementById('menuToggle'),
    chip:      document.getElementById('mobileProgress'),
    chipLabel: document.getElementById('mobileProgressStep'),
    chipTitle: document.getElementById('mobileProgressTitle'),
    chipFill:  document.getElementById('mobileProgressFill')
  };

  // ── Build grouped sidebar links ─────────────────────────
  var groups = [];
  var groupMap = {};
  steps.forEach(function (step, i) {
    var g = step.group || 'שלבים';
    if (!(g in groupMap)) { groupMap[g] = groups.length; groups.push({ name: g, items: [] }); }
    groups[groupMap[g]].items.push(i);
  });

  var links = [];
  groups.forEach(function (group) {
    var wrap = document.createElement('div');

    var lbl = document.createElement('p');
    lbl.className = 'group-label';
    lbl.textContent = group.name;
    wrap.appendChild(lbl);

    var list = document.createElement('div');
    list.className = 'group-list';
    list.setAttribute('role', 'list');

    group.items.forEach(function (i) {
      var s = steps[i];
      var btn = document.createElement('button');
      btn.className = 'nav-link';
      btn.dataset.index = i;
      btn.innerHTML = '<i class="ti ' + s.icon + '" aria-hidden="true"></i><span>' + s.title + '</span>';
      btn.addEventListener('click', function () { goTo(i, true); });
      list.appendChild(btn);
      links.push(btn);
    });

    wrap.appendChild(list);
    el.groups.appendChild(wrap);
  });

  // ── Sidebar open/close ──────────────────────────────────
  function openSidebar() {
    el.sidebar.classList.add('open');
    el.backdrop.classList.add('on');
    el.menuBtn.setAttribute('aria-expanded', 'true');
  }
  function closeSidebar() {
    el.sidebar.classList.remove('open');
    el.backdrop.classList.remove('on');
    el.menuBtn.setAttribute('aria-expanded', 'false');
  }
  el.menuBtn.addEventListener('click', function () {
    el.sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  el.backdrop.addEventListener('click', closeSidebar);
  if (el.chip) el.chip.addEventListener('click', openSidebar);

  window.addEventListener('resize', function () {
    if (window.innerWidth > 880) closeSidebar();
  });

  // ── Render ──────────────────────────────────────────────
  function renderIntro() {
    el.card.innerHTML =
      '<span class="eyebrow"><i class="ti ti-sparkles" aria-hidden="true"></i>לפני שיוצאים לדרך</span>' +
      '<h1 class="step-title"><span class="step-icon"><i class="ti ti-compass" aria-hidden="true"></i></span><span>ברוכים הבאים למסע</span></h1>' +
      '<div class="step-body">' + intro.html + '</div>';
    bumpAnimation();
  }

  function renderStep(i) {
    var s = steps[i];
    el.card.innerHTML =
      '<span class="eyebrow"><i class="ti ' + s.icon + '" aria-hidden="true"></i>' + s.group + '</span>' +
      '<h1 class="step-title"><span class="step-icon"><i class="ti ' + s.icon + '" aria-hidden="true"></i></span><span>' + s.title + '</span></h1>' +
      '<div class="step-body">' + s.html + '</div>';
    bumpAnimation();
  }

  function bumpAnimation() {
    el.card.style.animation = 'none';
    void el.card.offsetWidth;
    el.card.style.animation = '';
  }

  // ── Nav buttons ─────────────────────────────────────────
  function updateNav() {
    el.prev.disabled = (current <= -1);
    if (current === steps.length - 1) {
      el.next.innerHTML = '<span>חזרה למבוא</span><i class="ti ti-refresh" aria-hidden="true"></i>';
    } else {
      el.next.innerHTML = '<span>לשלב הבא</span><i class="ti ti-arrow-left" aria-hidden="true"></i>';
    }
  }

  // ── Progress ────────────────────────────────────────────
  function updateProgress() {
    var total = steps.length;
    var label, title, pct;
    if (current === -1) {
      label = 'מבוא — ' + total + ' שלבים';
      title = 'ברוכים הבאים למסע';
      pct = 0;
    } else {
      label = 'שלב ' + (current + 1) + ' מתוך ' + total;
      title = steps[current].title;
      pct = Math.round(((current + 1) / total) * 100);
    }
    el.progLabel.textContent = label;
    el.progFill.style.width = pct + '%';
    if (el.chipLabel) el.chipLabel.textContent = label;
    if (el.chipTitle) el.chipTitle.textContent = title;
    if (el.chipFill)  el.chipFill.style.width  = pct + '%';
  }

  // ── Active link ─────────────────────────────────────────
  function updateLinks() {
    links.forEach(function (btn) {
      var i = Number(btn.dataset.index);
      btn.classList.toggle('active', i === current);
      btn.classList.toggle('done',   i <  current);
      btn.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  }

  // ── Navigate ────────────────────────────────────────────
  function goTo(index, userAction) {
    current = Math.max(-1, Math.min(steps.length - 1, index));
    if (current === -1) renderIntro(); else renderStep(current);
    updateNav();
    updateProgress();
    updateLinks();
    if (userAction) {
      closeSidebar();
      el.main.focus({ preventScroll: false });
      try { el.main.scrollIntoView({ behavior: "smooth", block: "start" }); } catch(e) {}
    }
  }

  el.prev.addEventListener('click', function () { goTo(current - 1, true); });
  el.next.addEventListener('click', function () {
    goTo(current === steps.length - 1 ? -1 : current + 1, true);
  });
  el.homeBtn.addEventListener('click', function () { goTo(-1, true); });

  goTo(-1, false);
})();
