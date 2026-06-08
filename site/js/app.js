(function () {
  'use strict';

  // No persistence by design: every page load starts fresh at the intro.
  var steps = SITE_CONTENT.steps;
  var intro = SITE_CONTENT.intro;
  var current = -1; // -1 = intro screen

  var els = {
    sidebarGroups: document.getElementById('sidebarGroups'),
    timeline: document.getElementById('timeline'),
    contentCard: document.getElementById('contentCard'),
    main: document.getElementById('main-content'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    progressLabel: document.getElementById('progressLabel'),
    progressFill: document.getElementById('progressFill'),
    introBtn: document.getElementById('introBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    menuToggle: document.getElementById('menuToggle')
  };

  // ---- Build grouped sidebar (desktop) -------------------------------
  var groups = [];
  var groupIndex = {};
  steps.forEach(function (step, i) {
    var g = step.group || 'שלבים';
    if (!(g in groupIndex)) {
      groupIndex[g] = groups.length;
      groups.push({ name: g, items: [] });
    }
    groups[groupIndex[g]].items.push(i);
  });

  groups.forEach(function (group) {
    var wrap = document.createElement('div');

    var label = document.createElement('p');
    label.className = 'sidebar-group-label';
    label.textContent = group.name;
    wrap.appendChild(label);

    var list = document.createElement('div');
    list.className = 'sidebar-group-list';
    list.setAttribute('role', 'list');

    group.items.forEach(function (i) {
      var step = steps[i];
      var btn = document.createElement('button');
      btn.className = 'sidebar-link';
      btn.dataset.index = i;
      btn.innerHTML = '<i class="ti ' + step.icon + '" aria-hidden="true"></i><span>' + step.title + '</span>';
      btn.addEventListener('click', function () { goTo(i, true); });
      list.appendChild(btn);
    });

    wrap.appendChild(list);
    els.sidebarGroups.appendChild(wrap);
  });

  // ---- Build mobile timeline ------------------------------------------
  var timelineHeader = document.createElement('button');
  timelineHeader.className = 'timeline-expand';
  timelineHeader.setAttribute('aria-expanded', 'true');
  timelineHeader.innerHTML = '<i class="ti ti-chevron-down" aria-hidden="true"></i><span>ציר המסע — כל השלבים</span>';
  els.timeline.appendChild(timelineHeader);

  var track = document.createElement('div');
  track.className = 'timeline-track';
  track.setAttribute('role', 'list');

  var line = document.createElement('div');
  line.className = 'timeline-line';
  track.appendChild(line);

  var timelineItems = steps.map(function (step, i) {
    var btn = document.createElement('button');
    btn.className = 'timeline-item';
    btn.setAttribute('role', 'listitem');
    btn.dataset.index = i;

    var dot = document.createElement('span');
    dot.className = 'timeline-dot';
    dot.innerHTML = '<i class="ti ' + step.icon + '" aria-hidden="true"></i>';

    var lbl = document.createElement('span');
    lbl.className = 'timeline-label';
    lbl.textContent = step.title;

    btn.appendChild(dot);
    btn.appendChild(lbl);
    btn.addEventListener('click', function () { goTo(i, true); });
    track.appendChild(btn);
    return btn;
  });
  els.timeline.appendChild(track);

  timelineHeader.addEventListener('click', function () {
    var collapsed = els.timeline.classList.toggle('is-collapsed');
    timelineHeader.setAttribute('aria-expanded', String(!collapsed));
    timelineHeader.querySelector('span').textContent = collapsed
      ? 'ציר המסע — הצגה מלאה'
      : 'ציר המסע — כל השלבים';
  });

  // Collapse the timeline by default on small screens so the content
  // card is visible first; user can expand to browse all steps.
  function applyDefaultTimelineState() {
    if (window.innerWidth <= 880) {
      els.timeline.classList.add('is-collapsed');
      timelineHeader.setAttribute('aria-expanded', 'false');
      timelineHeader.querySelector('span').textContent = 'ציר המסע — הצגה מלאה';
    }
  }
  applyDefaultTimelineState();

  // ---- Sidebar (mobile drawer) open/close -----------------------------
  function openSidebar() {
    els.sidebar.classList.add('is-open');
    els.sidebarOverlay.classList.add('is-visible');
    els.menuToggle.setAttribute('aria-expanded', 'true');
  }
  function closeSidebar() {
    els.sidebar.classList.remove('is-open');
    els.sidebarOverlay.classList.remove('is-visible');
    els.menuToggle.setAttribute('aria-expanded', 'false');
  }
  els.menuToggle.addEventListener('click', function () {
    if (els.sidebar.classList.contains('is-open')) closeSidebar();
    else openSidebar();
  });
  els.sidebarOverlay.addEventListener('click', closeSidebar);

  // ---- Rendering -------------------------------------------------------
  function renderIntro() {
    els.contentCard.innerHTML =
      '<span class="step-eyebrow"><i class="ti ti-sparkles" aria-hidden="true"></i>לפני שיוצאים לדרך</span>' +
      '<h1 class="step-title">' +
        '<span class="step-title-icon"><i class="ti ti-compass" aria-hidden="true"></i></span>' +
        '<span>ברוכים הבאים למסע</span>' +
      '</h1>' +
      '<div class="step-body">' + intro.html + '</div>';
    restartCardAnimation();
    updateNav();
    updateProgress();
    setActiveLink();
  }

  function renderStep(i) {
    var step = steps[i];
    els.contentCard.innerHTML =
      '<span class="step-eyebrow"><i class="ti ' + step.icon + '" aria-hidden="true"></i>' + step.group + '</span>' +
      '<h1 class="step-title">' +
        '<span class="step-title-icon"><i class="ti ' + step.icon + '" aria-hidden="true"></i></span>' +
        '<span>' + step.title + '</span>' +
      '</h1>' +
      '<div class="step-body">' + step.html + '</div>';
    restartCardAnimation();
    updateNav();
    updateProgress();
    setActiveLink();
  }

  function restartCardAnimation() {
    els.contentCard.style.animation = 'none';
    // Force reflow to restart the animation
    void els.contentCard.offsetWidth;
    els.contentCard.style.animation = '';
  }

  function updateNav() {
    els.prevBtn.disabled = (current <= -1);
    if (current === steps.length - 1) {
      els.nextBtn.innerHTML = '<span>סיימתם — חזרה למבוא</span><i class="ti ti-refresh" aria-hidden="true"></i>';
    } else {
      els.nextBtn.innerHTML = '<span>לשלב הבא</span><i class="ti ti-arrow-left" aria-hidden="true"></i>';
    }
  }

  function updateProgress() {
    var stepNum = current + 1; // 0 = intro
    var total = steps.length;
    if (current === -1) {
      els.progressLabel.textContent = 'מבוא — ' + total + ' שלבים מחכים לכם';
      els.progressFill.style.width = '0%';
    } else {
      els.progressLabel.textContent = 'שלב ' + stepNum + ' מתוך ' + total;
      els.progressFill.style.width = Math.round((stepNum / total) * 100) + '%';
    }
  }

  function setActiveLink() {
    // sidebar
    var sidebarLinks = els.sidebarGroups.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(function (link) {
      var idx = Number(link.dataset.index);
      link.classList.toggle('is-active', idx === current);
      link.classList.toggle('is-done', idx < current);
      link.setAttribute('aria-current', idx === current ? 'true' : 'false');
    });
    // timeline
    timelineItems.forEach(function (item) {
      var idx = Number(item.dataset.index);
      item.classList.toggle('is-active', idx === current);
      item.classList.toggle('is-done', idx < current);
      item.setAttribute('aria-current', idx === current ? 'true' : 'false');
    });
    // scroll active timeline item into view when collapsed
    if (current > -1 && els.timeline.classList.contains('is-collapsed')) {
      var activeItem = timelineItems[current];
      if (activeItem && activeItem.scrollIntoView) {
        activeItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }

  function goTo(index, userInitiated) {
    current = Math.max(-1, Math.min(steps.length - 1, index));
    if (current === -1) renderIntro();
    else renderStep(current);

    if (userInitiated) {
      closeSidebar();
      if (els.main.focus) els.main.focus({ preventScroll: false });
      if (els.main.scrollIntoView) els.main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  els.prevBtn.addEventListener('click', function () { goTo(current - 1, true); });
  els.nextBtn.addEventListener('click', function () {
    if (current === steps.length - 1) goTo(-1, true);
    else goTo(current + 1, true);
  });
  els.introBtn.addEventListener('click', function () { goTo(-1, true); });

  window.addEventListener('resize', function () {
    // Re-evaluate collapse state only when crossing the breakpoint
    var isMobile = window.innerWidth <= 880;
    if (!isMobile) {
      els.timeline.classList.remove('is-collapsed');
      closeSidebar();
    }
  });

  // ---- Initial render ---------------------------------------------------
  goTo(-1, false);
})();
