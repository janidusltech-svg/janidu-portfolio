const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
const topBtn = document.getElementById('topBtn');
const progressBar = document.getElementById('progressBar');

if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

function handleScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = `${progress}%`;
  if (topBtn) topBtn.classList.toggle('visible', scrollTop > 420);
}
window.addEventListener('scroll', handleScroll);
handleScroll();

if (topBtn) {
  topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealElements.forEach((el) => revealObserver.observe(el));

const resourceGrid = document.getElementById('resourceGrid');
const emptyState = document.getElementById('emptyState');
const filters = {
  year: document.getElementById('yearFilter'),
  semester: document.getElementById('semesterFilter'),
  module: document.getElementById('moduleFilter'),
  type: document.getElementById('typeFilter'),
};
let resources = [];

function resourceCard(item) {
  const actionLabel = item.type === 'Interactive Quiz' || item.type === 'Mock Exam' ? 'Open' : 'Download';
  const downloadAttr = item.type === 'Reference Sheet' || item.type === 'Notes' ? 'download' : '';
  return `
    <article class="resource-card reveal visible">
      <div class="resource-meta">
        <span>${item.year}</span>
        <span>${item.semester}</span>
        <span>${item.module}</span>
        <span>${item.type}</span>
      </div>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <div class="resource-actions">
        ${item.url ? `<a href="${item.url}" ${downloadAttr}>${actionLabel} Resource</a>` : `<a href="#" onclick="return false;" class="disabled-resource">Coming Soon</a>`}
      </div>
    </article>
  `;
}

function applyResourceFilters() {
  if (!resourceGrid) return;

  // Study Hub public version currently shows only Year 1 Semester 2.
  const year = filters.year?.value || 'Year 1';
  const semester = filters.semester?.value || 'Semester 2';
  const module = filters.module?.value || 'all';
  const type = filters.type?.value || 'all';

  const filtered = resources.filter((item) => {
    return (year === 'all' || item.year === year)
      && (semester === 'all' || item.semester === semester)
      && (module === 'all' || item.module === module)
      && (type === 'all' || item.type === type)
      && item.visible !== false;
  });

  resourceGrid.innerHTML = filtered.map(resourceCard).join('');
  if (emptyState) emptyState.style.display = filtered.length ? 'none' : 'block';
}

async function loadResources() {
  if (!resourceGrid) return;
  try {
    const res = await fetch('data/resources.json', { cache: 'no-store' });
    resources = await res.json();
  } catch (error) {
    resources = [];
    console.error('Could not load resources.json', error);
  }
  applyResourceFilters();
}

Object.values(filters).forEach((select) => {
  if (select) select.addEventListener('change', applyResourceFilters);
});

document.querySelectorAll('[data-filter-link]').forEach((link) => {
  link.addEventListener('click', () => {
    const [year, semester] = link.dataset.filterLink.split('|');
    if (filters.year) filters.year.value = year;
    if (filters.semester) filters.semester.value = semester;
    if (filters.module) filters.module.value = 'all';
    if (filters.type) filters.type.value = 'all';
    setTimeout(applyResourceFilters, 80);
  });
});

document.querySelectorAll('[data-module-jump]').forEach((card) => {
  card.addEventListener('click', () => {
    const module = card.dataset.moduleJump;
    if (filters.year) filters.year.value = 'Year 1';
    if (filters.semester) filters.semester.value = 'Semester 2';
    if (filters.module) filters.module.value = module;
    if (filters.type) filters.type.value = 'all';
    document.getElementById('resources')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(applyResourceFilters, 250);
  });
});

loadResources();
