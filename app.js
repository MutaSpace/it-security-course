const phaseData = [
  {
    index: "01",
    label: "PHASE 01",
    title: "Discover the environment",
    description: "Learn how security teams identify assets, classify information, map networks, and determine what must be protected first.",
    tags: ["Security controls", "Asset inventory", "Physical security", "Network mapping"],
    missions: [["01", "Security Team Onboarding", "mission-01.html"], ["02", "Asset Discovery", "missions.html#mission-02"], ["03", "Network Redesign", "missions.html#mission-03"]]
  },
  {
    index: "02",
    label: "PHASE 02",
    title: "Protect systems and data",
    description: "Apply access controls, encryption, secure architecture, vulnerability remediation, and system-hardening techniques to reduce attack opportunities.",
    tags: ["Identity and access", "Cryptography", "Hardening", "Vulnerability management"],
    missions: [["04", "Access Control Audit", "missions.html#mission-04"], ["05", "Protect Sensitive Data", "missions.html#mission-05"], ["06", "Social Engineering Defense", "missions.html#mission-06"], ["08", "Vulnerability Assessment", "missions.html#mission-08"], ["09", "System Hardening", "missions.html#mission-09"]]
  },
  {
    index: "03",
    label: "PHASE 03",
    title: "Detect suspicious activity",
    description: "Collect and analyze logs, network traffic, alerts, and indicators to separate routine activity from evidence of a possible attack.",
    tags: ["Log analysis", "Packet analysis", "SIEM", "Alert tuning"],
    missions: [["07", "Suspicious Activity Investigation", "missions.html#mission-07"], ["10", "Build the Monitoring Operation", "missions.html#mission-10"], ["11", "Defend the Network", "missions.html#mission-11"]]
  },
  {
    index: "04",
    label: "PHASE 04",
    title: "Respond and recover",
    description: "Use a structured incident-response process to contain threats, preserve evidence, restore operations, and improve the organization's resilience.",
    tags: ["Incident response", "Evidence", "Backups", "Disaster recovery"],
    missions: [["12", "Incident Response", "missions.html#mission-12"], ["13", "Business Continuity", "missions.html#mission-13"], ["15", "Capstone Incident Injection", "missions.html#mission-15"]]
  },
  {
    index: "05",
    label: "PHASE 05",
    title: "Lead the security program",
    description: "Translate technical findings into risk decisions, policy improvements, vendor requirements, and executive recommendations that leadership can act on.",
    tags: ["Risk management", "Governance", "Compliance", "Security communication"],
    missions: [["14", "Advise Leadership", "missions.html#mission-14"], ["15", "Capstone Assessment", "missions.html#mission-15"], ["16", "Executive Defense Briefing", "missions.html#mission-16"]]
  }
];

const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("open", !isOpen);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const currentPage = document.body.dataset.page;
document.querySelectorAll("[data-page-link]").forEach((link) => {
  const isCurrent = link.dataset.pageLink === currentPage;
  link.classList.toggle("active", isCurrent);
  if (isCurrent) link.setAttribute("aria-current", "page");
  else link.removeAttribute("aria-current");
});

const phaseTabs = document.querySelectorAll("[data-phase]");
const phaseIndex = document.querySelector("[data-phase-index]");
const phaseLabel = document.querySelector("[data-phase-label]");
const phaseTitle = document.querySelector("[data-phase-title]");
const phaseDescription = document.querySelector("[data-phase-description]");
const phaseTags = document.querySelector("[data-phase-tags]");
const phaseMissions = document.querySelector("[data-phase-missions]");

function renderPhase(index) {
  const phase = phaseData[index];
  if (!phase || !phaseIndex || !phaseLabel || !phaseTitle || !phaseDescription || !phaseTags || !phaseMissions) return;

  phaseIndex.textContent = phase.index;
  phaseLabel.textContent = phase.label;
  phaseTitle.textContent = phase.title;
  phaseDescription.textContent = phase.description;
  phaseTags.innerHTML = phase.tags.map((tag) => `<span>${tag}</span>`).join("");
  phaseMissions.innerHTML = phase.missions.map(([number, title, href]) => `<li><a href="${href}"><span>${number}</span>${title}</a></li>`).join("");

  phaseTabs.forEach((tab, tabIndex) => {
    const isActive = tabIndex === index;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
  });
}

phaseTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => renderPhase(index));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + phaseTabs.length) % phaseTabs.length;
    renderPhase(nextIndex);
    phaseTabs[nextIndex].focus();
  });
});

if (phaseTabs.length) renderPhase(0);

const yearElement = document.querySelector("[data-year]");
if (yearElement) yearElement.textContent = new Date().getFullYear();

function openLinkedDetails() {
  const hash = window.location.hash;
  if (!hash) return;
  const target = document.querySelector(hash);
  if (target && target.tagName === "DETAILS") target.open = true;
}

document.querySelectorAll('a[href*="-details"]').forEach((link) => {
  link.addEventListener("click", () => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;
    const target = document.querySelector(href);
    if (target && target.tagName === "DETAILS") target.open = true;
  });
});

window.addEventListener("hashchange", openLinkedDetails);
openLinkedDetails();
