/* ============================================================
   MicroPython Release Notes — shared behaviour
   Theme toggle, sidebar, scrollspy, copy-button, animated
   counters, contributors toggle. Per-page bespoke demos listen
   for the 'themechange' CustomEvent on document for redraws.
   ============================================================ */

// ===== Theme Toggle =====
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.innerHTML = next === 'dark' ? '&#9790;' : '&#9728;';
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
}

// ===== Mobile Sidebar Toggle =====
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

// ===== Scrollspy =====
function initScrollspy() {
  const sections = document.querySelectorAll('.section, .hero');
  const tocLinks = document.querySelectorAll('.toc a');
  if (!sections.length || !tocLinks.length) return;

  const scrollObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        tocLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('data-section') === id);
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach(section => scrollObserver.observe(section));

  // Close sidebar on mobile when clicking a TOC link
  tocLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');
      }
    });
  });
}

// ===== Copy Code =====
function copyCode(btn) {
  const pre = btn.closest('.code-block').querySelector('pre');
  const text = pre.textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// ===== Animated Counters =====
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'), 10);
        const duration = 1200;
        const start = performance.now();
        function tick(time) {
          const progress = Math.min((time - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(target * eased);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));
}

// ===== Contributors Toggle =====
function toggleContributors() {
  const list = document.getElementById('contributors-list');
  const btn = document.getElementById('contributors-btn');
  if (!list || !btn) return;
  list.classList.toggle('open');
  btn.textContent = list.classList.contains('open')
    ? 'Hide contributor list'
    : 'Show all contributors';
}

// ===== Port Tier Chart =====
// Filter the .tier-grid by clicking .tier-legend-btn[data-tier]. Used on
// the v1.27 page and on the /releases/ index "browse by port" widget.
function initTierChart() {
  const buttons = document.querySelectorAll('.tier-legend-btn');
  const nodes = document.querySelectorAll('.tier-node');
  if (!buttons.length || !nodes.length) return;

  function setFilter(tier) {
    buttons.forEach(b => b.classList.toggle('active', b.dataset.tier === tier));
    nodes.forEach(n => {
      n.classList.toggle('dimmed', tier !== 'all' && n.dataset.tier !== tier);
    });
  }
  buttons.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.tier)));
}

// ===== Bootstrap =====
document.addEventListener('DOMContentLoaded', () => {
  initScrollspy();
  initCounters();
  initTierChart();
});
