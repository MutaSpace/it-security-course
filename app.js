const phaseData = [
  {
    index: "01",
    label: "PHASE 01",
    title: "Discover the environment",
    description: "Learn how security teams identify assets, classify information, map networks, and determine what must be protected first.",
    tags: ["Security controls", "Asset inventory", "Physical security", "Network mapping"],
    missions: [["01", "Security Team Onboarding"], ["02", "Asset Discovery"], ["03", "Network Redesign"]]
  },
  {
    index: "02",
    label: "PHASE 02",
    title: "Protect systems and data",
    description: "Apply access controls, encryption, secure architecture, vulnerability remediation, and system-hardening techniques to reduce attack opportunities.",
    tags: ["Identity and access", "Cryptography", "Hardening", "Vulnerability management"],
    missions: [["04", "Access Control Audit"], ["05", "Protect Sensitive Data"], ["06", "Social Engineering Defense"], ["08", "Vulnerability Assessment"], ["09", "System Hardening"]]
  },
  {
    index: "03",
    label: "PHASE 03",
    title: "Detect suspicious activity",
    description: "Collect and analyze logs, network traffic, alerts, and indicators to separate routine activity from evidence of a possible attack.",
    tags: ["Log analysis", "Packet analysis", "SIEM", "Alert tuning"],
    missions: [["07", "Suspicious Activity Investigation"], ["10", "Build the Monitoring Operation"], ["11", "Defend the Network"]]
  },
  {
    index: "04",
    label: "PHASE 04",
    title: "Respond and recover",
    description: "Use a structured incident-response process to contain threats, preserve evidence, restore operations, and improve the organization’s resilience.",
    tags: ["Incident response", "Evidence", "Backups", "Disaster recovery"],
    missions: [["12", "Incident Response"], ["13", "Business Continuity"], ["15", "Capstone Incident Injection"]]
  },
  {
    index: "05",
    label: "PHASE 05",
    title: "Lead the security program",
    description: "Translate technical findings into risk decisions, policy improvements, vendor requirements, and executive recommendations that leadership can act on.",
    tags: ["Risk management", "Governance", "Compliance", "Security communication"],
    missions: [["14", "Advise Leadership"], ["15", "Capstone Assessment"], ["16", "Executive Defense Briefing"]]
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

const phaseTabs = document.querySelectorAll("[data-phase]");
const phaseIndex = document.querySelector("[data-phase-index]");
const phaseLabel = document.querySelector("[data-phase-label]");
const phaseTitle = document.querySelector("[data-phase-title]");
const phaseDescription = document.querySelector("[data-phase-description]");
const phaseTags = document.querySelector("[data-phase-tags]");
const phaseMissions = document.querySelector("[data-phase-missions]");

function renderPhase(index) {
  const phase = phaseData[index];
  if (!phase) return;

  phaseIndex.textContent = phase.index;
  phaseLabel.textContent = phase.label;
  phaseTitle.textContent = phase.title;
  phaseDescription.textContent = phase.description;
  phaseTags.innerHTML = phase.tags.map((tag) => `<span>${tag}</span>`).join("");
  phaseMissions.innerHTML = phase.missions.map(([number, title]) => `<li><span>${number}</span>${title}</li>`).join("");

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
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + direction + phaseTabs.length) % phaseTabs.length;
    renderPhase(nextIndex);
    phaseTabs[nextIndex].focus();
  });
});

const yearElement = document.querySelector("[data-year]");
if (yearElement) yearElement.textContent = new Date().getFullYear();

const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll('.primary-nav a[href^="#"]:not(.nav-cta)');

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-35% 0px -55%", threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}
