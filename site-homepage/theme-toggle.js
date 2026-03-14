/* Theme Toggle - Automated Insights
   Light theme default, dark mode toggle, persisted in localStorage */
(function() {
  var STORAGE_KEY = 'ai-theme';

  function getPreferred() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function apply(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(STORAGE_KEY, theme);
    var btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.textContent = theme === 'dark' ? '\u2600' : '\u263E';
    }
  }

  // Apply immediately to prevent flash
  var current = getPreferred();
  apply(current);

  // Create toggle button when DOM is ready
  function createToggle() {
    if (document.querySelector('.theme-toggle')) {
      return;
    }
    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.addEventListener('click', function() {
      var now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(now);
    });
    document.body.appendChild(btn);
    apply(getPreferred());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createToggle);
  } else {
    createToggle();
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        apply(e.matches ? 'dark' : 'light');
      }
    });
  }
})();
