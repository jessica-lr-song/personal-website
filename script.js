(function () {
  var root = document.documentElement;
  var STORAGE_KEY = 'theme';

  var FILES = [
    { id: 'welcome', name: 'welcome.md', lang: 'Markdown', icon: 'icon-md', iconText: 'M' },
    { id: 'about', name: 'about.md', lang: 'Markdown', icon: 'icon-md', iconText: 'M' },
    { id: 'experience', name: 'experience.json', lang: 'JSON', icon: 'icon-json', iconText: '{ }' },
    { id: 'projects', name: 'projects.js', lang: 'JavaScript', icon: 'icon-js', iconText: 'JS' },
    { id: 'honors', name: 'honors.txt', lang: 'Plain Text', icon: 'icon-txt', iconText: '≣' },
    { id: 'skills', name: 'skills.yaml', lang: 'YAML', icon: 'icon-yaml', iconText: 'Y' },
    { id: 'contact', name: 'contact.sh', lang: 'Shell Script', icon: 'icon-sh', iconText: '>_' }
  ];
  var FILES_BY_ID = {};
  FILES.forEach(function (f) { FILES_BY_ID[f.id] = f; });

  /* ---------- theme ---------- */
  function applyStoredTheme() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') root.setAttribute('data-theme', stored);
    } catch (e) { /* localStorage unavailable */ }
  }
  function toggleTheme() {
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var current = root.getAttribute('data-theme') || (prefersDark ? 'dark' : 'light');
    var next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
  }
  applyStoredTheme();
  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  /* ---------- sidebar collapse (mobile) ---------- */
  var sidebar = document.getElementById('sidebar');
  var sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function () {
      var collapsed = sidebar.classList.toggle('is-collapsed');
      sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
    });
  }
  function isMobile() { return window.matchMedia('(max-width: 760px)').matches; }

  /* ---------- traffic light buttons ---------- */
  var ideEl = document.querySelector('.ide');
  var dotClose = document.getElementById('dotClose');
  var dotMinimize = document.getElementById('dotMinimize');
  var dotZoom = document.getElementById('dotZoom');
  var minimizedDock = document.getElementById('minimizedDock');
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function afterAnimation(anim, duration, cb) {
    var done = false;
    function fire() { if (done) return; done = true; cb(); }
    anim.onfinish = fire;
    setTimeout(fire, duration + 80);
  }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2400);
  }

  if (dotClose && ideEl) {
    dotClose.addEventListener('click', function () {
      ideEl.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }],
        { duration: 260, easing: 'ease-in-out' }
      );
      showToast('don’t leave me :(');
    });
  }

  if (dotMinimize && ideEl && minimizedDock) {
    dotMinimize.addEventListener('click', function () {
      var anim = ideEl.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0.04) translate(-160%, 420%)', opacity: 0 }
      ], { duration: 560, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      afterAnimation(anim, 560, function () {
        ideEl.style.display = 'none';
        anim.cancel();
        minimizedDock.hidden = false;
        var dockAnim = minimizedDock.animate(
          [{ transform: 'translateY(16px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
          { duration: 220, easing: 'ease-out' }
        );
        afterAnimation(dockAnim, 220, function () { dockAnim.cancel(); });
      });
    });
    minimizedDock.addEventListener('click', function () {
      minimizedDock.hidden = true;
      ideEl.style.display = '';
      var restoreAnim = ideEl.animate([
        { transform: 'scale(0.04) translate(-160%, 420%)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
      afterAnimation(restoreAnim, 320, function () { restoreAnim.cancel(); });
    });
  }

  function enterWindowed() {
    var w = Math.min(window.innerWidth * 0.94, 1440);
    var h = window.innerHeight * 0.88;
    var top = window.innerHeight * 0.04;
    var left = (window.innerWidth - w) / 2;
    ideEl.style.width = w + 'px';
    ideEl.style.height = h + 'px';
    ideEl.style.top = top + 'px';
    ideEl.style.left = left + 'px';
    ideEl.classList.add('is-windowed');
  }

  function exitWindowed() {
    ideEl.classList.remove('is-windowed');
    ideEl.style.width = '';
    ideEl.style.height = '';
    ideEl.style.top = '';
    ideEl.style.left = '';
  }

  if (dotZoom && ideEl) {
    dotZoom.addEventListener('click', function () {
      if (ideEl.classList.contains('is-windowed')) exitWindowed();
      else enterWindowed();
    });
  }

  /* ---------- drag the floating window by its titlebar ---------- */
  var titlebarEl = document.querySelector('.titlebar');
  if (titlebarEl && ideEl) {
    var dragState = null;
    titlebarEl.addEventListener('mousedown', function (e) {
      if (!ideEl.classList.contains('is-windowed')) return;
      if (e.target.closest('button')) return;
      var rect = ideEl.getBoundingClientRect();
      dragState = { startX: e.clientX, startY: e.clientY, startLeft: rect.left, startTop: rect.top };
      ideEl.classList.add('dragging-window');
      document.body.classList.add('dragging-window');
      e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragState) return;
      var minVisible = 120;
      var w = ideEl.offsetWidth;
      var newLeft = dragState.startLeft + (e.clientX - dragState.startX);
      var newTop = dragState.startTop + (e.clientY - dragState.startY);
      newLeft = Math.max(minVisible - w, Math.min(newLeft, window.innerWidth - minVisible));
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - 40));
      ideEl.style.left = newLeft + 'px';
      ideEl.style.top = newTop + 'px';
    });
    window.addEventListener('mouseup', function () {
      if (!dragState) return;
      dragState = null;
      ideEl.classList.remove('dragging-window');
      document.body.classList.remove('dragging-window');
    });
  }

  /* ---------- resize the floating window from any edge or corner ---------- */
  var RESIZE_MIN_W = 360;
  var RESIZE_MIN_H = 280;
  var resizeHandles = document.querySelectorAll('[data-resize]');
  if (resizeHandles.length && ideEl) {
    var resizeState = null;
    resizeHandles.forEach(function (handle) {
      handle.addEventListener('mousedown', function (e) {
        if (!ideEl.classList.contains('is-windowed')) return;
        var rect = ideEl.getBoundingClientRect();
        resizeState = {
          dir: handle.getAttribute('data-resize'),
          startX: e.clientX, startY: e.clientY,
          startW: rect.width, startH: rect.height,
          startLeft: rect.left, startTop: rect.top
        };
        ideEl.classList.add('dragging-window');
        document.body.classList.add('dragging-window');
        e.preventDefault();
        e.stopPropagation();
      });
    });
    window.addEventListener('mousemove', function (e) {
      if (!resizeState) return;
      var dir = resizeState.dir;
      var dx = e.clientX - resizeState.startX;
      var dy = e.clientY - resizeState.startY;
      var newW = resizeState.startW;
      var newH = resizeState.startH;
      var newLeft = resizeState.startLeft;
      var newTop = resizeState.startTop;

      if (dir.indexOf('e') !== -1) {
        var maxW = window.innerWidth - resizeState.startLeft - 8;
        newW = Math.min(maxW, Math.max(RESIZE_MIN_W, resizeState.startW + dx));
      }
      if (dir.indexOf('s') !== -1) {
        var maxH = window.innerHeight - resizeState.startTop - 8;
        newH = Math.min(maxH, Math.max(RESIZE_MIN_H, resizeState.startH + dy));
      }
      if (dir.indexOf('w') !== -1) {
        newW = Math.max(RESIZE_MIN_W, resizeState.startW - dx);
        newLeft = resizeState.startLeft + (resizeState.startW - newW);
      }
      if (dir.indexOf('n') !== -1) {
        newH = Math.max(RESIZE_MIN_H, resizeState.startH - dy);
        newTop = resizeState.startTop + (resizeState.startH - newH);
      }

      ideEl.style.width = newW + 'px';
      ideEl.style.height = newH + 'px';
      if (dir.indexOf('w') !== -1) ideEl.style.left = newLeft + 'px';
      if (dir.indexOf('n') !== -1) ideEl.style.top = newTop + 'px';
    });
    window.addEventListener('mouseup', function () {
      if (!resizeState) return;
      resizeState = null;
      ideEl.classList.remove('dragging-window');
      document.body.classList.remove('dragging-window');
    });
  }

  /* ---------- explorer folder collapse ---------- */
  var treeFolder = document.querySelector('.tree-folder');
  var fileTree = document.getElementById('fileTree');
  if (treeFolder && fileTree) {
    treeFolder.addEventListener('click', function () {
      treeFolder.classList.toggle('is-collapsed');
      fileTree.classList.toggle('is-collapsed');
    });
  }

  /* ---------- activity bar: switch sidebar panel ---------- */
  var activityButtons = {
    actExplorer: 'panelExplorer',
    actSearch: 'panelSearch',
    actGit: 'panelGit',
    actExt: 'panelExt'
  };
  function selectActivity(btnId) {
    Object.keys(activityButtons).forEach(function (id) {
      var btn = document.getElementById(id);
      var panel = document.getElementById(activityButtons[id]);
      var active = id === btnId;
      if (btn) btn.classList.toggle('is-active', active);
      if (panel) panel.hidden = !active;
    });
    if (sidebar && sidebar.classList.contains('is-collapsed') && !isMobile()) {
      sidebar.classList.remove('is-collapsed');
    }
  }
  Object.keys(activityButtons).forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', function () { selectActivity(id); });
  });

  /* ---------- file search ---------- */
  var fileSearch = document.getElementById('fileSearch');
  var searchResults = document.getElementById('searchResults');
  function renderSearch(query) {
    if (!searchResults) return;
    searchResults.innerHTML = '';
    var q = query.trim().toLowerCase();
    var matches = FILES.filter(function (f) { return !q || f.name.toLowerCase().indexOf(q) !== -1; });
    if (!matches.length) {
      var li = document.createElement('li');
      li.className = 'sidebar-empty';
      li.textContent = 'No matching files.';
      searchResults.appendChild(li);
      return;
    }
    matches.forEach(function (f) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.className = 'tree-file';
      btn.innerHTML = '<span class="file-icon ' + f.icon + '">' + f.iconText + '</span>' + f.name;
      btn.addEventListener('click', function () { openFile(f.id); });
      li.appendChild(btn);
      searchResults.appendChild(li);
    });
  }
  if (fileSearch) {
    fileSearch.addEventListener('input', function () { renderSearch(fileSearch.value); });
    renderSearch('');
  }

  /* ---------- minimap ---------- */
  var minimap = document.getElementById('minimap');
  var TOK_ORDER = ['tok-kw', 'tok-str', 'tok-com', 'tok-fn', 'tok-num', 'tok-prop', 'tok-var', 'tok-bold', 'tok-link', 'tok-punct'];

  function collectSegments(node, inheritedCls, out) {
    node.childNodes.forEach(function (child) {
      if (child.nodeType === Node.TEXT_NODE) {
        var text = child.textContent;
        if (text.length) out.push({ len: text.length, cls: inheritedCls, ws: /^\s*$/.test(text) });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        var cls = inheritedCls;
        for (var i = 0; i < TOK_ORDER.length; i++) {
          if (child.classList.contains(TOK_ORDER[i])) { cls = TOK_ORDER[i]; break; }
        }
        collectSegments(child, cls, out);
      }
    });
  }

  function renderMinimap(fileId) {
    if (!minimap) return;
    minimap.innerHTML = '';
    var lines = document.querySelectorAll('#pane-' + fileId + ' .code > .line > .txt');
    if (!lines.length) return;

    var lineData = [];
    var maxLen = 1;
    lines.forEach(function (txt) {
      var segments = [];
      collectSegments(txt, null, segments);
      var total = segments.reduce(function (sum, seg) { return sum + seg.len; }, 0);
      lineData.push({ segments: segments, total: total });
      if (total > maxLen) maxLen = total;
    });

    var frag = document.createDocumentFragment();
    lineData.forEach(function (ld) {
      var row = document.createElement('div');
      row.className = 'mm-row';
      if (ld.total > 0) {
        row.style.width = Math.min(100, (ld.total / maxLen) * 100) + '%';
        ld.segments.forEach(function (seg) {
          var span = document.createElement('span');
          span.style.width = ((seg.len / ld.total) * 100) + '%';
          span.style.background = seg.ws ? 'transparent' : (seg.cls ? 'var(--' + seg.cls + ')' : 'var(--text-dim)');
          row.appendChild(span);
        });
      }
      frag.appendChild(row);
    });
    minimap.appendChild(frag);
  }

  /* ---------- tabs / panes / tree: open file ---------- */
  var tabbar = document.getElementById('tabbar');
  var statusLang = document.getElementById('statusLang');

  function openFile(id, opts) {
    var file = FILES_BY_ID[id];
    if (!file) return;

    document.querySelectorAll('.pane').forEach(function (p) { p.classList.remove('is-active'); p.hidden = true; });
    var pane = document.getElementById('pane-' + id);
    if (pane) { pane.classList.add('is-active'); pane.hidden = false; }

    document.querySelectorAll('.tree-file').forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-file') === id);
    });

    var tab = tabbar ? tabbar.querySelector('.tab[data-file="' + id + '"]') : null;
    if (tab) {
      tab.classList.remove('is-closed');
      tab.hidden = false;
      tabbar.querySelectorAll('.tab').forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
    }

    if (statusLang) statusLang.textContent = file.lang;
    renderMinimap(id);

    if (!opts || !opts.skipHash) {
      history.replaceState(null, '', '#' + id);
    }
    if (isMobile() && sidebar && !(opts && opts.keepSidebar)) {
      sidebar.classList.add('is-collapsed');
    }
  }

  document.querySelectorAll('.tree-file').forEach(function (btn) {
    btn.addEventListener('click', function () { openFile(btn.getAttribute('data-file')); });
  });

  if (tabbar) {
    tabbar.addEventListener('click', function (e) {
      var closeBtn = e.target.closest('.tab-close');
      if (closeBtn) {
        e.stopPropagation();
        showToast('don’t leave me :(');
        return;
      }
      var tab = e.target.closest('.tab');
      if (tab) openFile(tab.getAttribute('data-file'), { keepSidebar: true });
    });
  }

  /* ---------- bottom panel ---------- */
  var panel = document.getElementById('panel');
  var panelCollapse = document.getElementById('panelCollapse');
  if (panelCollapse && panel) {
    panelCollapse.addEventListener('click', function () {
      panel.classList.toggle('is-collapsed');
    });
  }
  document.querySelectorAll('.panel-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-panel');
      document.querySelectorAll('.panel-tab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      document.querySelectorAll('.panel-view').forEach(function (v) {
        var active = v.id === 'view-' + target;
        v.classList.toggle('is-active', active);
        v.hidden = !active;
      });
      if (panel && panel.classList.contains('is-collapsed')) panel.classList.remove('is-collapsed');
      if (target === 'terminal' && termInput) termInput.focus();
    });
  });

  /* ---------- terminal ---------- */
  var termOutput = document.getElementById('termOutput');
  var termForm = document.getElementById('termForm');
  var termInput = document.getElementById('termInput');
  var panelBody = document.getElementById('panelBody');
  var cmdHistory = [];
  var historyIndex = 0;

  var CONTACT = {
    email: 'jessicasong@cmu.edu',
    github: 'https://github.com/jessica-lr-song',
    linkedin: 'https://www.linkedin.com/in/jessica-lr-song'
  };

  var HELP_ITEMS = [
    ['help', 'show this list'],
    ['ls', 'list files'],
    ['cat &lt;file&gt;', 'print a file’s contents'],
    ['open &lt;file|link&gt;', 'open a file in the editor, or github / linkedin / email'],
    ['whoami', 'print the current user'],
    ['pwd', 'print working directory'],
    ['date', 'print the current date'],
    ['echo &lt;text&gt;', 'print text ($EMAIL, $GITHUB, $LINKEDIN supported)'],
    ['contact', 'show contact info'],
    ['clear', 'clear the terminal']
  ];
  var HELP_COL = 20;
  var HELP_TEXT = HELP_ITEMS.map(function (item) {
    var plainLen = item[0].replace(/&lt;/g, '<').replace(/&gt;/g, '>').length;
    var pad = Math.max(2, HELP_COL - plainLen);
    return item[0] + new Array(pad + 1).join('&nbsp;') + item[1];
  });

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function scrollTerminalToBottom() {
    if (panelBody) panelBody.scrollTop = panelBody.scrollHeight;
  }

  function termAppend(html, cls) {
    if (!termOutput) return;
    var p = document.createElement('p');
    p.className = 'term-line' + (cls ? ' ' + cls : '');
    p.innerHTML = html;
    termOutput.appendChild(p);
  }

  function termPromptLine(cmdText) {
    if (!termOutput) return;
    var p = document.createElement('p');
    p.className = 'term-line term-input-row';
    p.innerHTML = '<span class="term-prompt">jessica@portfolio</span><span class="term-path">~</span><span class="term-dollar">%</span><span class="term-echo">' + escapeHtml(cmdText) + '</span>';
    termOutput.appendChild(p);
  }

  function linkHtml(url) {
    return '<a class="tok-a" href="' + url + '" target="_blank" rel="noopener">' + url.replace(/^https?:\/\//, '') + '</a>';
  }

  function catFile(id) {
    var lines = document.querySelectorAll('#pane-' + id + ' .code > .line > .txt');
    if (!lines.length) return null;
    var frag = document.createDocumentFragment();
    lines.forEach(function (txt) {
      var p = document.createElement('p');
      p.className = 'term-line';
      p.innerHTML = txt.innerHTML.trim() ? txt.innerHTML : '&nbsp;';
      frag.appendChild(p);
    });
    return frag;
  }

  function substituteVars(str) {
    return str
      .replace(/\$EMAIL\b/g, CONTACT.email)
      .replace(/\$GITHUB\b/g, CONTACT.github)
      .replace(/\$LINKEDIN\b/g, CONTACT.linkedin);
  }

  function handleOpen(arg) {
    var key = arg.toLowerCase();
    if (key === 'github') {
      window.open(CONTACT.github, '_blank', 'noopener');
      termAppend('→ opening ' + linkHtml(CONTACT.github), 'term-out');
      return;
    }
    if (key === 'linkedin') {
      window.open(CONTACT.linkedin, '_blank', 'noopener');
      termAppend('→ opening ' + linkHtml(CONTACT.linkedin), 'term-out');
      return;
    }
    if (key === 'email' || key === 'mailto') {
      window.location.href = 'mailto:' + CONTACT.email;
      termAppend('→ opening mail client for ' + CONTACT.email, 'term-out');
      return;
    }
    var fileId = key.replace(/\.\w+$/, '');
    if (FILES_BY_ID[fileId]) {
      openFile(fileId, { keepSidebar: true });
      termAppend('opened ' + FILES_BY_ID[fileId].name + ' in the editor.', 'term-out');
      return;
    }
    termAppend('open: cannot open ‘' + escapeHtml(arg) + '’: No such file or directory', 'term-error');
  }

  function runContact() {
    termAppend('My inbox is open.', 'term-out');
    termAppend(
      linkHtml(CONTACT.github) + ' &middot; ' + linkHtml(CONTACT.linkedin) +
      ' &middot; <a class="tok-a" href="mailto:' + CONTACT.email + '">' + CONTACT.email + '</a>',
      'term-out'
    );
  }

  function runCommand(raw) {
    var input = raw.trim();
    termPromptLine(raw);
    if (input) runParsedCommand(input);
    scrollTerminalToBottom();
  }

  function runParsedCommand(input) {
    cmdHistory.push(input);
    historyIndex = cmdHistory.length;

    var parts = input.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var arg = parts.slice(1).join(' ');
    var fileArg = arg.replace(/\.\w+$/, '').toLowerCase();

    switch (cmd) {
      case 'help':
        HELP_TEXT.forEach(function (l) { termAppend(l, 'term-out'); });
        break;

      case 'ls':
        termAppend(FILES.map(function (f) { return f.name; }).join('&nbsp;&nbsp;&nbsp;'), 'term-out');
        break;

      case 'pwd':
        termAppend('/Users/jessica/portfolio', 'term-out');
        break;

      case 'whoami':
        termAppend('jessica', 'term-out');
        break;

      case 'date':
        termAppend(new Date().toString(), 'term-out');
        break;

      case 'clear':
      case 'cls':
        termOutput.innerHTML = '';
        break;

      case 'echo':
        var echoed = escapeHtml(substituteVars(arg));
        termAppend(echoed === '' ? '&nbsp;' : echoed, 'term-out');
        break;

      case 'cat':
        if (!arg) { termAppend('usage: cat &lt;file&gt;', 'term-out'); break; }
        if (FILES_BY_ID[fileArg]) {
          var frag = catFile(fileArg);
          if (frag) termOutput.appendChild(frag);
        } else {
          termAppend('cat: ' + escapeHtml(arg) + ': No such file or directory', 'term-error');
        }
        break;

      case 'open':
        if (!arg) { termAppend('usage: open &lt;file|link&gt;', 'term-out'); break; }
        handleOpen(arg);
        break;

      case 'contact':
      case './contact.sh':
        runContact();
        break;

      case 'sudo':
        termAppend('jessica is not in the sudoers file. This incident will be reported.', 'term-error');
        break;

      case 'exit':
      case 'logout':
        termAppend('don’t leave me :(', 'term-out');
        break;

      default:
        termAppend('zsh: command not found: ' + escapeHtml(cmd), 'term-error');
    }
  }

  if (termForm && termInput) {
    termForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = termInput.value;
      termInput.value = '';
      runCommand(val);
    });
    termInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          termInput.value = cmdHistory[historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < cmdHistory.length - 1) {
          historyIndex++;
          termInput.value = cmdHistory[historyIndex];
        } else {
          historyIndex = cmdHistory.length;
          termInput.value = '';
        }
      } else if (e.key === 'Tab') {
        var val = termInput.value;
        var m = val.match(/^(cat|open)\s+(\S*)$/i);
        if (m) {
          e.preventDefault();
          var prefix = m[2].toLowerCase();
          var match = FILES.filter(function (f) {
            return f.name.toLowerCase().indexOf(prefix) === 0 || f.id.indexOf(prefix) === 0;
          })[0];
          if (match) termInput.value = m[1] + ' ' + match.name;
        }
      }
    });
  }

  if (panelBody) {
    panelBody.addEventListener('click', function () {
      var sel = window.getSelection();
      if (sel && sel.toString()) return;
      var activeView = document.querySelector('.panel-view.is-active');
      if (activeView && activeView.id === 'view-terminal' && termInput) termInput.focus();
    });
  }

  /* ---------- init from hash, handle back/forward ---------- */
  function initialFileFromHash() {
    var id = location.hash.replace('#', '');
    return FILES_BY_ID[id] ? id : 'welcome';
  }
  openFile(initialFileFromHash(), { skipHash: true, keepSidebar: true });
  window.addEventListener('hashchange', function () {
    openFile(initialFileFromHash(), { skipHash: true, keepSidebar: true });
  });

  /* ---------- collapse sidebar by default on mobile ---------- */
  if (isMobile() && sidebar) {
    sidebar.classList.add('is-collapsed');
    if (sidebarToggle) sidebarToggle.setAttribute('aria-expanded', 'false');
  }
})();
