const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const topBtn = document.getElementById("topBtn");
const progressBar = document.getElementById("progressBar");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });
}

function handleScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (progressBar) progressBar.style.width = `${progress}%`;
  if (topBtn) topBtn.classList.toggle("visible", scrollTop > 420);
}

window.addEventListener("scroll", handleScroll);
handleScroll();

if (topBtn) {
  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ==========================================
   REVEAL ANIMATION
========================================== */

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealElements.forEach((el) => revealObserver.observe(el));

/* ==========================================
   STUDY HUB RESOURCE SYSTEM
========================================== */

const resourceGrid = document.getElementById("resourceGrid");

const resourceViewToggle = document.getElementById("resourceViewToggle");
let showAllMobileResources = false;

const filters = {
  year: document.getElementById("yearFilter"),
  semester: document.getElementById("semesterFilter"),
  module: document.getElementById("moduleFilter"),
  type: document.getElementById("typeFilter"),
};

let resources = [];

function normalizeType(type) {
  if (!type) return "";
  if (type === "Interactive Quiz") return "Mock Exam";
  return type;
}

function resourceCard(item) {
  const displayType = normalizeType(item.type) || "Resource";
  const actionLabel = displayType === "Mock Exam" ? "Open" : "View";
  const downloadAttr = displayType === "Reference Sheet" ? "download" : "";

  const titleText = (item.title || "").toLowerCase();

  const needsWarning =
    titleText.includes("expected exam structure") ||
    titleText.includes("expected") ||
    item.url.includes("TW_Final_Exam_Structure_guess_ByJ");

  return `
    <article class="resource-card reveal visible">
      ${item.badge ? `<span class="new-badge">${item.badge}</span>` : ""}

      <div class="resource-meta">
        <span>${item.year}</span>
        <span>${item.semester}</span>
        <span>${item.module}</span>
        <span>${displayType}</span>
      </div>

      <h3>${item.title}</h3>
      <p>${item.description}</p>

      <div class="resource-actions">
        ${
          item.url
            ? `<a 
                href="${item.url}" 
                class="resource-link ${needsWarning ? "warning-resource-link" : ""}"
                data-url="${item.url}"
                data-title="${item.title}"
                data-module="${item.module}"
                data-type="${displayType}"
                ${downloadAttr}
              >
                ${actionLabel} Resource
              </a>`
            : `<a href="#" onclick="return false;" class="disabled-resource">Coming Soon</a>`
        }
      </div>
    </article>
  `;
}

function applyResourceFilters() {
  if (!resourceGrid) return;

  const year = filters.year?.value || "Year 1";
  const semester = filters.semester?.value || "Semester 2";
  const module = filters.module?.value || "all";
  const type = filters.type?.value || "all";

  const noFilterSelected = module === "all" && type === "all";

  // Default view: do not show all resources
  if (noFilterSelected) {
    resourceGrid.innerHTML = "";

    if (emptyState) {
      emptyState.style.display = "block";
      emptyState.innerHTML = `
        <h3>Select a module or resource type</h3>
        <p>
          Choose a module or resource type above to view available study resources.
        </p>
      `;
    }

    const resourceViewToggle = document.getElementById("resourceViewToggle");
    if (resourceViewToggle && resourceViewToggle.parentElement) {
      resourceViewToggle.parentElement.style.display = "none";
    }

    return;
  }

  const filtered = resources.filter((item) => {
    const itemType = normalizeType(item.type);

    return (
      (year === "all" || item.year === year) &&
      (semester === "all" || item.semester === semester) &&
      (module === "all" || item.module === module) &&
      (type === "all" || itemType === type) &&
      item.visible !== false
    );
  });

  resourceGrid.innerHTML = filtered.map(resourceCard).join("");

  if (typeof updateMobileResourceLimit === "function") {
    updateMobileResourceLimit(filtered.length);
  }

  if (emptyState) {
    if (filtered.length) {
      emptyState.style.display = "none";
    } else {
      emptyState.style.display = "block";
      emptyState.innerHTML = `
        <h3>No resources found</h3>
        <p>
          No resources are available for this selected module/type yet.
        </p>
      `;
    }
  }
}
function updateMobileResourceLimit(totalCount) {
  if (!resourceGrid || !resourceViewToggle) return;

  const cards = Array.from(resourceGrid.querySelectorAll(".resource-card"));
  const isMobile = window.matchMedia("(max-width: 760px)").matches;

  if (!isMobile) {
    cards.forEach((card) => card.classList.remove("mobile-hidden-resource"));
    resourceViewToggle.parentElement.style.display = "none";
    return;
  }

  if (totalCount <= 4) {
    cards.forEach((card) => card.classList.remove("mobile-hidden-resource"));
    resourceViewToggle.parentElement.style.display = "none";
    return;
  }

  resourceViewToggle.parentElement.style.display = "flex";

  cards.forEach((card, index) => {
    card.classList.toggle(
      "mobile-hidden-resource",
      !showAllMobileResources && index >= 4
    );
  });

  resourceViewToggle.innerHTML = showAllMobileResources
    ? 'Show Less Resources <span>↑</span>'
    : `View All Resources (${totalCount}) <span>↓</span>`;
}

async function loadResources() {
  if (!resourceGrid) return;

  try {
    const res = await fetch("data/resources.json", { cache: "no-store" });
    resources = await res.json();

    resources = resources.map((item) => ({
      ...item,
      type: normalizeType(item.type),
    }));
  } catch (error) {
    resources = [];
    console.error("Could not load resources.json", error);
  }

 applyResourceFilters();
markUpdatedModules();
}
function markUpdatedModules() {
  const newModules = new Set();

  resources.forEach((item) => {
    const badge = (item.badge || "").toLowerCase();

    if (
      item.visible !== false &&
      (badge === "new" || badge === "latest" || badge.includes("new"))
    ) {
      newModules.add(item.module);
    }
  });

  document.querySelectorAll("[data-module-jump]").forEach((card) => {
    const moduleName = card.dataset.moduleJump;

    if (!newModules.has(moduleName)) return;

    card.classList.add("module-has-new");

    if (!card.querySelector(".module-update-badge")) {
      const badge = document.createElement("span");
      badge.className = "module-update-badge";
      badge.textContent = "New";
      card.appendChild(badge);
    }
  });
}

Object.values(filters).forEach((select) => {
  if (select) {
    select.addEventListener("change", () => {
      showAllMobileResources = false;
      applyResourceFilters();
    });
  }
});

document.querySelectorAll("[data-filter-link]").forEach((link) => {
  link.addEventListener("click", () => {
    const [year, semester] = link.dataset.filterLink.split("|");

    if (filters.year) filters.year.value = year;
    if (filters.semester) filters.semester.value = semester;
    if (filters.module) filters.module.value = "all";
    if (filters.type) filters.type.value = "all";

    setTimeout(applyResourceFilters, 80);
  });
});

document.querySelectorAll("[data-module-jump]").forEach((card) => {
  card.addEventListener("click", () => {
    const module = card.dataset.moduleJump;

    if (filters.year) filters.year.value = "Year 1";
    if (filters.semester) filters.semester.value = "Semester 2";
    if (filters.module) filters.module.value = module;
    if (filters.type) filters.type.value = "all";

    document.getElementById("resources")?.scrollIntoView({ behavior: "smooth" });

    setTimeout(applyResourceFilters, 250);
  });
});

loadResources();

/* ==========================================
   MOBILE VIEW MORE YEARS
========================================== */

const viewYearsBtn = document.getElementById("viewYearsBtn");
const yearSection = document.getElementById("years");

if (viewYearsBtn && yearSection) {
  viewYearsBtn.addEventListener("click", () => {
    yearSection.classList.toggle("show-all-years");

    const isOpen = yearSection.classList.contains("show-all-years");

    viewYearsBtn.innerHTML = isOpen
      ? 'Hide Other Years <span>↑</span>'
      : 'View More Years <span>↓</span>';
  });
}

/* ==========================================
   GOOGLE ANALYTICS RESOURCE CLICK TRACKING
========================================== */

document.addEventListener("click", function (e) {
  const resourceLink = e.target.closest(".resource-link");

  if (!resourceLink) return;

  if (typeof gtag === "function") {
    gtag("event", "resource_click", {
      resource_title: resourceLink.dataset.title || "",
      module: resourceLink.dataset.module || "",
      resource_type: resourceLink.dataset.type || "",
      resource_url: resourceLink.getAttribute("href") || "",
    });
  }
});

/* ==========================================
   RESOURCE WARNING POPUP
========================================== */

document.addEventListener("click", function (e) {
  const warningLink = e.target.closest(".warning-resource-link");

  if (!warningLink) return;

  e.preventDefault();

  const resourcePopup = document.getElementById("resourcePopup");
  const popupOpenBtn = document.getElementById("popupOpenBtn");

  if (!resourcePopup || !popupOpenBtn) {
    console.log("Popup HTML not found. Check resourcePopup and popupOpenBtn IDs.");
    return;
  }

  const url = warningLink.dataset.url || warningLink.getAttribute("href");

  popupOpenBtn.href = url;
  resourcePopup.classList.add("active");
});

document.addEventListener("click", function (e) {
  const resourcePopup = document.getElementById("resourcePopup");

  if (
    e.target.id === "popupCloseBtn" ||
    e.target.id === "popupCancelBtn" ||
    e.target.id === "resourcePopup"
  ) {
    if (resourcePopup) {
      resourcePopup.classList.remove("active");
    }
  }
});

if (resourceViewToggle) {
  resourceViewToggle.addEventListener("click", () => {
    showAllMobileResources = !showAllMobileResources;

    const totalCount = resourceGrid
      ? resourceGrid.querySelectorAll(".resource-card").length
      : 0;

    updateMobileResourceLimit(totalCount);

    if (!showAllMobileResources) {
      document.getElementById("resources")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
}

window.addEventListener("resize", () => {
  const totalCount = resourceGrid
    ? resourceGrid.querySelectorAll(".resource-card").length
    : 0;

  updateMobileResourceLimit(totalCount);
});