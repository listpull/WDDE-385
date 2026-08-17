/* TechBridge site behavior — full build
   Powers: mobile menu, resource search, generic checklist tools (backup,
   cybersecurity, upgrade planner, file organizer, business checkup),
   the topic finder, the software comparison worksheet, the Compare Options
   selector, the contact form, and print/save for tool results.
   All content lives in data objects below so it can represent a real
   API without touching the HTML.
*/
(function () {
  'use strict';

  /* ============ Mobile menu ============ */
  var menuBtn = document.querySelector('.menu-button');
  var nav = document.querySelector('.site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ============ Resource Library data + search ============ */
  var RESOURCES = [
    { title: 'Backup Readiness Checklist', desc: 'See where your backup plan is strong and where it needs work.', url: 'tools.html#backup', tags: ['backup', 'storage', 'cloud', 'files', 'recovery', 'external drive'] },
    { title: 'Cybersecurity Basics Checklist', desc: 'A short list of security actions a small business should not skip.', url: 'security.html#cyber-checklist', tags: ['security', 'cybersecurity', 'passwords', 'mfa'] },
    { title: 'Compare Options', desc: 'Compare business software by cost, setup effort, access, team size, and main use.', url: 'compare.html', tags: ['compare', 'software', 'cost', 'project management', 'tools'] },
    { title: 'Business Technology Checkup', desc: 'A quick self-check across backup, security, software, and remote work.', url: 'tools.html#checkup', tags: ['checkup', 'assessment', 'planning'] },
    { title: 'Software Comparison Worksheet', desc: 'Work out what actually matters to your team before comparing tools.', url: 'tools.html#worksheet', tags: ['worksheet', 'software', 'comparison', 'priorities'] },
    { title: 'Technology Upgrade Planning Tool', desc: 'Plan an upgrade in stages without shutting down normal work.', url: 'tools.html#upgrade', tags: ['upgrade', 'planning', 'migration'] },
    { title: 'Shared Files Organization Planner', desc: 'Get shared files into a structure your whole team can find.', url: 'tools.html#files', tags: ['files', 'organization', 'shared drive'] },
    { title: 'Where Should I Start? Topic Finder', desc: 'Answer one question and get pointed to the right resource.', url: 'tools.html#finder', tags: ['topic finder', 'start', 'help'] },
    { title: 'Web Application Security', desc: 'Common threats to public websites and how to reduce them.', url: 'security.html', tags: ['security', 'https', 'forms', 'spam'] },
    { title: 'Responsive Web Design', desc: 'How TechBridge uses mobile-first design across phones, tablets, and desktops.', url: 'responsive-design.html', tags: ['responsive', 'mobile', 'design', 'flexbox', 'grid'] },
    { title: 'Website Optimization', desc: 'Performance techniques that keep pages fast on slow connections.', url: 'optimization.html', tags: ['performance', 'speed', 'optimization', 'core web vitals'] },
    { title: 'Accessibility and Inclusive Design', desc: 'Keyboard, screen reader, magnification, and other access needs.', url: 'accessibility.html', tags: ['accessibility', 'wcag', 'screen reader', 'keyboard'] },
    { title: 'Web Design and User Experience', desc: 'The hub for accessibility, performance, and responsive design topics.', url: 'user-experience.html', tags: ['web design', 'ux', 'user experience'] },
    { title: 'About TechBridge', desc: 'Who TechBridge is for and what the resource hub includes.', url: 'about.html', tags: ['about', 'mission', 'audience'] },
    { title: 'Contact and Feedback', desc: 'Suggest a topic, report an error, or report an accessibility issue.', url: 'contact.html', tags: ['contact', 'feedback', 'support'] }
  ];

  function normalize(s) { return (s || '').toLowerCase().trim(); }

  function searchResources(query) {
    var q = normalize(query);
    if (!q) return RESOURCES.slice();
    return RESOURCES.filter(function (r) {
      var hay = normalize(r.title + ' ' + r.desc + ' ' + r.tags.join(' '));
      return hay.indexOf(q) !== -1;
    });
  }

  function renderResults(list, results, query) {
    list.innerHTML = '';
    if (results.length === 0) {
      var li = document.createElement('li');
      li.textContent = 'No resources matched "' + query + '". Try a different word, such as backup, security, or compare.';
      list.appendChild(li);
      return;
    }
    results.forEach(function (r) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = r.url;
      a.textContent = r.title;
      var p = document.createElement('p');
      p.textContent = r.desc;
      li.appendChild(a);
      li.appendChild(p);
      list.appendChild(li);
    });
  }

  var heroSearch = document.querySelector('.hero form[data-search]');
  if (heroSearch) {
    heroSearch.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = heroSearch.querySelector('input[name="q"]');
      var q = input ? input.value.trim() : '';
      window.location.href = 'resources.html' + (q ? ('?q=' + encodeURIComponent(q)) : '');
    });
  }

  var list = document.querySelector('[data-list]');
  var librarySearch = document.querySelector('main form[data-search]');
  if (list && librarySearch) {
    var libInput = librarySearch.querySelector('input[name="q"]');
    var params = new URLSearchParams(window.location.search);
    var initialQ = params.get('q') || '';
    if (libInput) libInput.value = initialQ;
    renderResults(list, searchResources(initialQ), initialQ);
    librarySearch.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = libInput ? libInput.value.trim() : '';
      renderResults(list, searchResources(q), q);
    });
    if (libInput) {
      libInput.addEventListener('input', function () {
        renderResults(list, searchResources(libInput.value.trim()), libInput.value.trim());
      });
    }
  }

  /* ============ Generic checklist engine ============
     Any section with [data-tool] can hold checkboxes [data-check], a button
     [data-score], and three hidden outcome blocks marked
     data-level="high" | "mid" | "low" inside a container with [data-outcomes].
     Clicking the button tallies checked boxes and reveals the matching block. */
  function initChecklistTool(section) {
    var checks = section.querySelectorAll('[data-check]');
    var btn = section.querySelector('[data-score]');
    var outcomesBox = section.querySelector('[data-outcomes]');
    var scoreLine = section.querySelector('[data-score-line]');
    if (!btn || !outcomesBox || !checks.length) return;

    var outcomes = outcomesBox.querySelectorAll('[data-level]');

    btn.addEventListener('click', function () {
      var total = checks.length;
      var checked = 0;
      checks.forEach(function (c) { if (c.checked) checked++; });
      var ratio = checked / total;
      var level = ratio === 1 ? 'high' : (ratio >= 0.5 ? 'mid' : 'low');

      outcomes.forEach(function (block) {
        if (block.getAttribute('data-level') === level) {
          block.hidden = false;
          block.classList.add('show');
        } else {
          block.hidden = true;
          block.classList.remove('show');
        }
      });

      if (scoreLine) scoreLine.textContent = checked + ' of ' + total + ' items checked.';
      outcomesBox.hidden = false;
      outcomesBox.setAttribute('tabindex', '-1');
      outcomesBox.focus();
    });

    /* Print and save (download as a text file) once a result is shown */
    var printBtn = section.querySelector('[data-print]');
    var saveBtn = section.querySelector('[data-save]');
    if (printBtn) {
      printBtn.addEventListener('click', function () { window.print(); });
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var visible = outcomesBox.querySelector('[data-level].show') || outcomesBox.querySelector('[data-level]:not([hidden])');
        var text = (visible ? visible.textContent.trim() : outcomesBox.textContent.trim());
        var blob = new Blob([text], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (section.getAttribute('data-tool') || 'techbridge-result') + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  }
  document.querySelectorAll('[data-tool]').forEach(initChecklistTool);

  /* ============ Where Should I Start? topic finder ============ */
  var TOPIC_MAP = {
    'lost-files': { label: 'Backup Readiness Checklist', url: 'tools.html#backup', note: 'Start by checking whether your files actually have a working backup copy.' },
    'password-worry': { label: 'Cybersecurity Basics Checklist', url: 'security.html#cyber-checklist', note: 'A short list of security steps you can act on today.' },
    'new-software': { label: 'Compare Options', url: 'compare.html', note: 'Compare tools side by side before you commit to one.' },
    'slow-messy-site': { label: 'Web Design and User Experience hub', url: 'user-experience.html', note: 'Covers accessibility, speed, and responsive layout in one place.' },
    'not-sure': { label: 'Business Technology Checkup', url: 'tools.html#checkup', note: 'A broad self-check that points you to the right specific tool next.' }
  };
  var finderForm = document.querySelector('[data-finder]');
  if (finderForm) {
    var finderResult = document.querySelector('[data-finder-result]');
    finderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var choice = finderForm.querySelector('input[name="finder"]:checked');
      if (!choice) {
        finderResult.textContent = 'Choose the option that feels closest to your situation.';
        finderResult.hidden = false;
        return;
      }
      var match = TOPIC_MAP[choice.value];
      finderResult.innerHTML = 'Start here: <a href="' + match.url + '">' + match.label + '</a>. ' + match.note;
      finderResult.hidden = false;
      finderResult.setAttribute('tabindex', '-1');
      finderResult.focus();
    });
  }

  /* ============ Software comparison worksheet ============ */
  var WORKSHEET_OUTCOMES = {
    cost: { label: 'Cost control', note: 'Look for tools with a free tier or month-to-month pricing so you are not locked into an annual contract before you know it fits.' },
    setup: { label: 'Fast setup', note: 'Favor tools that let your team start working the same day, with templates or import from spreadsheets.' },
    collab: { label: 'Team collaboration', note: 'Prioritize shared access, comments, and permissions so the whole team can use the tool, not just one person.' },
    support: { label: 'Support and guidance', note: 'Look for tools with plain-language help docs or live chat support, since your team may not have in-house IT.' }
  };
  var worksheetForm = document.querySelector('[data-worksheet]');
  if (worksheetForm) {
    var worksheetResult = document.querySelector('[data-worksheet-result]');
    worksheetForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var choice = worksheetForm.querySelector('input[name="priority"]:checked');
      if (!choice) {
        worksheetResult.textContent = 'Choose the priority that matters most right now.';
        worksheetResult.hidden = false;
        return;
      }
      var picked = WORKSHEET_OUTCOMES[choice.value];
      worksheetResult.innerHTML = '<strong>Your top priority: ' + picked.label + '.</strong> ' + picked.note +
        ' When you open <a href="compare.html">Compare Options</a>, weigh that factor first.';
      worksheetResult.hidden = false;
      worksheetResult.setAttribute('tabindex', '-1');
      worksheetResult.focus();
    });
  }

  /* ============ Business technology checkup (scored by category) ============ */
  var checkupForm = document.querySelector('[data-checkup]');
  if (checkupForm) {
    var checkupResult = document.querySelector('[data-checkup-result]');
    var CATEGORY_LINKS = {
      backup: { label: 'Storage and Backup', url: 'tools.html#backup' },
      security: { label: 'Security', url: 'security.html#cyber-checklist' },
      software: { label: 'Compare Options', url: 'compare.html' },
      remote: { label: 'Web Design and User Experience', url: 'user-experience.html' }
    };
    checkupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var boxes = checkupForm.querySelectorAll('[data-check]');
      var totals = {};
      var checkedCounts = {};
      boxes.forEach(function (box) {
        var cat = box.getAttribute('data-cat');
        totals[cat] = (totals[cat] || 0) + 1;
        if (box.checked) checkedCounts[cat] = (checkedCounts[cat] || 0) + 1;
      });
      var weak = [];
      Object.keys(totals).forEach(function (cat) {
        var got = checkedCounts[cat] || 0;
        if (got / totals[cat] < 1) weak.push(cat);
      });
      var html = '<h3>Your checkup results</h3>';
      if (weak.length === 0) {
        html += '<p>Every area checks out. Revisit this checkup every few months since things change as your team grows.</p>';
      } else {
        html += '<p>These areas could use attention next:</p><ul>';
        weak.forEach(function (cat) {
          var link = CATEGORY_LINKS[cat];
          html += '<li><a href="' + link.url + '">' + link.label + '</a></li>';
        });
        html += '</ul>';
      }
      checkupResult.innerHTML = html;
      checkupResult.hidden = false;
      checkupResult.setAttribute('tabindex', '-1');
      checkupResult.focus();
    });
  }

  /* ============ Compare Options: category + two-option selector ============ */
  var COMPARISON_DATA = {
    'project-management': {
      label: 'Project management',
      options: {
        'all-in-one': { label: 'All-in-one platform', cost: 'Monthly per-user fee, often with a free tier for small teams', setup: 'A few hours to set up boards, but has a learning curve for new users', access: 'Web, desktop, and mobile apps', teamSize: 'Scales well from 5 to 50+ people', mainUse: 'Tracking projects, tasks, and deadlines in one shared place', goodFit: 'Good fit if your team already juggles several projects and needs one shared view.' },
        'simple-board': { label: 'Simple task board', cost: 'Usually free for small teams, low-cost paid tiers', setup: 'Minutes to create a board and start adding tasks', access: 'Web and mobile, works fine on a phone', teamSize: 'Best for teams under 15 people', mainUse: 'Quick visual tracking of what is being worked on', goodFit: 'Good fit if your team wants something simple with almost no setup time.' }
      }
    },
    'file-storage': {
      label: 'Shared file storage',
      options: {
        'cloud-storage': { label: 'Cloud storage service', cost: 'Monthly fee based on storage used, often with a free starter amount', setup: 'Install an app or use a browser, then move existing files over', access: 'Any device with internet access', teamSize: 'Works for any team size', mainUse: 'Storing and sharing files with automatic backup built in', goodFit: 'Good fit if your team needs to access files from different locations and devices.' },
        'local-server': { label: 'Local server with backup drive', cost: 'One-time hardware cost, no ongoing subscription', setup: 'Requires setup time and someone to maintain it', access: 'Fastest on-site, slower or unavailable remotely without extra setup', teamSize: 'Works best for a single office location', mainUse: 'Storing large files locally with a manual or scheduled backup', goodFit: 'Good fit if your team works from one location and has someone comfortable maintaining hardware.' }
      }
    },
    'team-communication': {
      label: 'Team communication',
      options: {
        'chat-platform': { label: 'Chat-based platform', cost: 'Free for small teams, paid tiers add storage and history', setup: 'Fast to set up, but channels need some organization to stay useful', access: 'Web, desktop, and mobile', teamSize: 'Works for teams of any size', mainUse: 'Quick day-to-day messages and file sharing in channels', goodFit: 'Good fit if your team needs fast back-and-forth communication during the day.' },
        'email-calendar': { label: 'Email and shared calendar', cost: 'Often already included with existing business email', setup: 'No new setup if you already use business email', access: 'Any device, very familiar to most users', teamSize: 'Works for any size, but gets messy with fast back-and-forth chat', teamSize2: '', mainUse: 'Formal communication, scheduling, and anything that needs a paper trail', goodFit: 'Good fit if your team prefers fewer new tools and mostly needs scheduling and formal messages.' }
      }
    }
  };

  var compareForm = document.querySelector('[data-compare]');
  if (compareForm) {
    var categorySelect = compareForm.querySelector('[name="category"]');
    var optionASelect = compareForm.querySelector('[name="optionA"]');
    var optionBSelect = compareForm.querySelector('[name="optionB"]');
    var tableBody = document.querySelector('[data-compare-body]');
    var goodFitBox = document.querySelector('[data-compare-fit]');
    var tableHeadA = document.querySelector('[data-th-a]');
    var tableHeadB = document.querySelector('[data-th-b]');

    function fillOptionSelects() {
      var cat = COMPARISON_DATA[categorySelect.value];
      [optionASelect, optionBSelect].forEach(function (sel, i) {
        sel.innerHTML = '';
        Object.keys(cat.options).forEach(function (key, idx) {
          var opt = document.createElement('option');
          opt.value = key;
          opt.textContent = cat.options[key].label;
          if (idx === i) opt.selected = true;
          sel.appendChild(opt);
        });
      });
    }

    function renderComparison() {
      var cat = COMPARISON_DATA[categorySelect.value];
      var a = cat.options[optionASelect.value];
      var b = cat.options[optionBSelect.value];
      if (!a || !b) return;
      tableHeadA.textContent = a.label;
      tableHeadB.textContent = b.label;
      var rows = [
        ['Cost', a.cost, b.cost],
        ['Setup effort', a.setup, b.setup],
        ['Access', a.access, b.access],
        ['Team size', a.teamSize, b.teamSize],
        ['Main use', a.mainUse, b.mainUse]
      ];
      tableBody.innerHTML = rows.map(function (r) {
        return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>';
      }).join('');
      goodFitBox.innerHTML = '<p><strong>' + a.label + ':</strong> ' + a.goodFit + '</p>' +
        '<p><strong>' + b.label + ':</strong> ' + b.goodFit + '</p>';
    }

    categorySelect.addEventListener('change', function () { fillOptionSelects(); renderComparison(); });
    optionASelect.addEventListener('change', renderComparison);
    optionBSelect.addEventListener('change', renderComparison);

    fillOptionSelects();
    renderComparison();
  }

  /* ============ Contact form validation ============ */
  var contactForm = document.querySelector('form[data-contact]');
  if (contactForm) {
    var status = document.querySelector('[data-status]');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    function markError(field) { if (field) field.setAttribute('aria-invalid', 'true'); }
    function clearError(field) { if (field) field.removeAttribute('aria-invalid'); }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.querySelector('#name');
      var email = contactForm.querySelector('#email');
      var reason = contactForm.querySelector('#reason');
      var message = contactForm.querySelector('#message');
      var honeypot = contactForm.querySelector('#company');
      var errors = [];

      [name, email, reason, message].forEach(clearError);

      if (honeypot && honeypot.value.trim()) { return; } /* silently drop likely bot submissions */

      if (!name.value.trim()) { errors.push('Enter your name.'); markError(name); }
      if (!email.value.trim() || !emailPattern.test(email.value.trim())) { errors.push('Enter a valid email address.'); markError(email); }
      if (!reason.value || reason.value === 'Choose one') { errors.push('Choose what you need help with.'); markError(reason); }
      if (!message.value.trim()) { errors.push('Enter a message.'); markError(message); }

      if (errors.length) {
        status.textContent = errors.join(' ');
        status.classList.remove('success');
        var firstInvalid = contactForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      status.textContent = 'Thanks. Your message has been sent. We usually respond within a few business days.';
      status.classList.add('success');
      contactForm.reset();
    });
  }
})();
