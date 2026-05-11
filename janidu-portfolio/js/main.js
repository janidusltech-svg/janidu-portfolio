const progressBar = document.getElementById('progressBar');
const topBtn = document.getElementById('topBtn');
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = `${progress}%`;
  topBtn.classList.toggle('visible', scrollTop > 650);

  const heroPhoto = document.querySelector('.hero-photo');
  if (heroPhoto) {
    const move = Math.min(scrollTop * 0.08, 55);
    const rotate = Math.min(scrollTop * 0.004, 5);
    heroPhoto.style.transform = `translateY(${-move}px) rotate(${rotate}deg)`;
  }
});

topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const dockLinks = document.querySelectorAll('.side-dock a');
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = 'home';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 160;
    if (window.scrollY >= sectionTop) current = section.id;
  });
  dockLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
});
