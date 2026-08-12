(() => {
  "use strict";

  const STORAGE_KEY = "itsec.progress.v2";
  const THEME_KEY = "itsec.theme";
  const MISSION_COUNT = 16;

  const defaultState = () => ({
    tracker: {},
    missions: {},
    checks: {},
    portfolioUrl: "",
    quizBest: 0
  });

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return parsed && typeof parsed === "object"
        ? { ...defaultState(), ...parsed, tracker: parsed.tracker || {}, missions: parsed.missions || {}, checks: parsed.checks || {} }
        : defaultState();
    } catch (error) {
      console.warn("Course progress could not be loaded.", error);
      return defaultState();
    }
  }

  let state = loadState();
  let toastTimer;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Course progress could not be saved.", error);
    }
  }

  function showToast(message) {
    const toast = document.querySelector("[data-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  }

  function setTheme(theme) {
    const selected = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = selected;
    localStorage.setItem(THEME_KEY, selected);
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const next = selected === "dark" ? "light" : "dark";
      button.setAttribute("aria-label", `Switch to ${next} theme`);
      button.setAttribute("title", `Switch to ${next} theme`);
    });
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  const preferredTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(savedTheme || preferredTheme);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });
  });

  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("open", !open);
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const currentPage = document.body.dataset.page;
  document.querySelectorAll("[data-page-link]").forEach((link) => {
    const isCurrent = link.dataset.pageLink === currentPage;
    link.classList.toggle("active", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  setText("[data-year]", new Date().getFullYear());

  function missionIdFromTrackerKey(key) {
    const match = /^mission-(\d{2}):completed$/.exec(key || "");
    return match ? `mission-${match[1]}` : null;
  }

  function initializeProgressInputs() {
    document.querySelectorAll("[data-tracker-key]").forEach((input) => {
      const key = input.dataset.trackerKey;
      input.checked = Boolean(state.tracker[key]);
      if (input.dataset.bound) return;
      input.dataset.bound = "true";
      input.addEventListener("change", () => {
        state.tracker[key] = input.checked;
        const missionId = missionIdFromTrackerKey(key);
        if (missionId) {
          state.missions[missionId] = input.checked;
          document.querySelectorAll(`[data-mission-complete="${missionId}"]`).forEach((missionInput) => {
            missionInput.checked = input.checked;
          });
        }
        saveState();
        updateProgressDisplays();
      });
    });

    document.querySelectorAll("[data-track-key]").forEach((input) => {
      const key = input.dataset.trackKey;
      input.checked = Boolean(state.checks[key]);
      if (input.dataset.bound) return;
      input.dataset.bound = "true";
      input.addEventListener("change", () => {
        state.checks[key] = input.checked;
        saveState();
        updateProgressDisplays();
      });
    });

    document.querySelectorAll("[data-mission-complete]").forEach((input) => {
      const missionId = input.dataset.missionComplete;
      input.checked = Boolean(state.missions[missionId] || state.tracker[`${missionId}:completed`]);
      if (input.dataset.bound) return;
      input.dataset.bound = "true";
      input.addEventListener("change", () => {
        state.missions[missionId] = input.checked;
        state.tracker[`${missionId}:completed`] = input.checked;
        document.querySelectorAll(`[data-tracker-key="${missionId}:completed"]`).forEach((trackerInput) => {
          trackerInput.checked = input.checked;
        });
        saveState();
        updateProgressDisplays();
        showToast(input.checked ? "Mission marked complete on this device." : "Mission completion removed.");
      });
    });
  }

  function countTrue(object, suffix = "") {
    return Object.entries(object).filter(([key, value]) => value && (!suffix || key.endsWith(suffix))).length;
  }

  function updateProgressDisplays() {
    const completedMissions = Array.from({ length: MISSION_COUNT }, (_, index) => {
      const id = `mission-${String(index + 1).padStart(2, "0")}`;
      return Boolean(state.missions[id] || state.tracker[`${id}:completed`]);
    }).filter(Boolean).length;
    const missionPercent = Math.round((completedMissions / MISSION_COUNT) * 100);

    setText("[data-missions-completed]", completedMissions);
    setText("[data-overall-progress]", `${missionPercent}%`);
    setText("[data-progress-label]", `${missionPercent}% COMPLETE`);
    document.querySelectorAll("[data-progress-donut]").forEach((donut) => donut.style.setProperty("--progress", missionPercent));

    let dashboardStatus = "Ready to begin";
    if (missionPercent === 100) dashboardStatus = "Mission path complete";
    else if (missionPercent >= 75) dashboardStatus = "Capstone path active";
    else if (missionPercent >= 50) dashboardStatus = "Detection and response underway";
    else if (missionPercent >= 25) dashboardStatus = "Protection operations active";
    else if (missionPercent > 0) dashboardStatus = "Foundation in progress";
    setText("[data-dashboard-status]", dashboardStatus);

    const trackerInputs = Array.from(document.querySelectorAll("[data-tracker-key]"));
    const trackerTotal = trackerInputs.length || Object.keys(state.tracker).length;
    const trackerChecked = trackerInputs.length ? trackerInputs.filter((input) => input.checked).length : countTrue(state.tracker);
    const trackerPercent = trackerTotal ? Math.round((trackerChecked / trackerTotal) * 100) : 0;
    const started = countTrue(state.tracker, ":started");
    const completed = countTrue(state.tracker, ":completed");
    const canvas = countTrue(state.tracker, ":canvas");
    const checklistComplete = countTrue(state.checks);

    setText("[data-tracker-progress]", `${trackerPercent}%`);
    setText("[data-tracker-started]", started);
    setText("[data-tracker-complete-count]", completed);
    setText("[data-tracker-canvas-count]", canvas);
    setText("[data-tracker-completed]", completed + checklistComplete);
    setText("[data-quiz-best]", `${Number(state.quizBest || 0)}%`);
    setText("[data-portfolio-status]", state.portfolioUrl ? "Saved" : "Not saved");
  }

  initializeProgressInputs();
  updateProgressDisplays();

  const portfolioForm = document.querySelector("[data-portfolio-form]");
  const portfolioInput = document.querySelector("[data-portfolio-url]");
  const portfolioMessage = document.querySelector("[data-portfolio-message]");
  const savedPortfolioLink = document.querySelector("[data-saved-portfolio-link]");

  function renderPortfolioUrl() {
    if (portfolioInput) portfolioInput.value = state.portfolioUrl || "";
    if (!savedPortfolioLink) return;
    if (state.portfolioUrl) {
      savedPortfolioLink.href = state.portfolioUrl;
      savedPortfolioLink.hidden = false;
      savedPortfolioLink.textContent = "Open saved portfolio";
    } else {
      savedPortfolioLink.hidden = true;
      savedPortfolioLink.removeAttribute("href");
    }
  }

  renderPortfolioUrl();
  if (portfolioForm && portfolioInput) {
    portfolioForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = portfolioInput.value.trim();
      try {
        const url = new URL(value);
        const validProtocol = url.protocol === "https:";
        const validHost = url.hostname.toLowerCase().endsWith(".github.io") || url.hostname.toLowerCase() === "github.io";
        if (!validProtocol || !validHost) throw new Error("Use your published https://...github.io address.");
        state.portfolioUrl = url.href;
        state.checks["portfolio-published"] = true;
        saveState();
        initializeProgressInputs();
        renderPortfolioUrl();
        updateProgressDisplays();
        if (portfolioMessage) portfolioMessage.textContent = "Portfolio URL saved on this device. Submit the official link through Canvas when requested.";
        showToast("GitHub Pages URL saved locally.");
      } catch (error) {
        if (portfolioMessage) portfolioMessage.textContent = error.message || "Enter a valid GitHub Pages URL.";
        portfolioInput.focus();
      }
    });
  }

  function applyMissionFilters() {
    const cards = Array.from(document.querySelectorAll("[data-mission-card]"));
    if (!cards.length) return;
    const query = (document.querySelector("[data-mission-search]")?.value || "").trim().toLowerCase();
    const phase = document.querySelector('[data-mission-filter="phase"]')?.value || "all";
    const level = document.querySelector('[data-mission-filter="level"]')?.value || "all";
    let shown = 0;
    cards.forEach((card) => {
      const matchesQuery = !query || (card.dataset.search || "").includes(query) || card.textContent.toLowerCase().includes(query);
      const matchesPhase = phase === "all" || card.dataset.phase === phase;
      const matchesLevel = level === "all" || card.dataset.level === level;
      const visible = matchesQuery && matchesPhase && matchesLevel;
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    setText("[data-mission-result-count]", shown);
    const empty = document.querySelector("[data-mission-empty]");
    if (empty) empty.hidden = shown !== 0;
  }

  document.querySelectorAll("[data-mission-search], [data-mission-filter]").forEach((control) => {
    control.addEventListener(control.tagName === "INPUT" ? "input" : "change", applyMissionFilters);
  });
  document.querySelector("[data-clear-mission-filters]")?.addEventListener("click", () => {
    const search = document.querySelector("[data-mission-search]");
    if (search) search.value = "";
    document.querySelectorAll("[data-mission-filter]").forEach((select) => { select.value = "all"; });
    applyMissionFilters();
  });
  applyMissionFilters();

  function applyResourceFilters() {
    const cards = Array.from(document.querySelectorAll("[data-resource-card]"));
    if (!cards.length) return;
    const query = (document.querySelector("[data-resource-search]")?.value || "").trim().toLowerCase();
    const filters = {};
    document.querySelectorAll("[data-resource-filter]").forEach((select) => {
      filters[select.dataset.resourceFilter] = select.value;
    });
    let shown = 0;
    cards.forEach((card) => {
      const matchesQuery = !query || (card.dataset.search || "").includes(query) || card.textContent.toLowerCase().includes(query);
      const matchesFilters = Object.entries(filters).every(([key, value]) => value === "all" || card.dataset[key] === value);
      const visible = matchesQuery && matchesFilters;
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    setText("[data-resource-result-count]", shown);
    const empty = document.querySelector("[data-resource-empty]");
    if (empty) empty.hidden = shown !== 0;
  }

  const resourceParams = new URLSearchParams(window.location.search);
  const typeParam = resourceParams.get("type") || resourceParams.get("kind");
  const queryParam = resourceParams.get("q");
  if (typeParam) {
    const select = document.querySelector('[data-resource-filter="kind"]');
    if (select && Array.from(select.options).some((option) => option.value === typeParam)) select.value = typeParam;
  }
  if (queryParam) {
    const search = document.querySelector("[data-resource-search]");
    if (search) search.value = queryParam;
  }
  document.querySelectorAll("[data-resource-search], [data-resource-filter]").forEach((control) => {
    control.addEventListener(control.tagName === "INPUT" ? "input" : "change", applyResourceFilters);
  });
  document.querySelector("[data-clear-resource-filters]")?.addEventListener("click", () => {
    const search = document.querySelector("[data-resource-search]");
    if (search) search.value = "";
    document.querySelectorAll("[data-resource-filter]").forEach((select) => { select.value = "all"; });
    applyResourceFilters();
  });
  applyResourceFilters();

  document.querySelector("[data-export-tracker]")?.addEventListener("click", () => {
    const rows = [["Assignment", "Started", "Completed", "Submitted in Canvas", "Added to GitHub Portfolio"]];
    document.querySelectorAll("[data-tracker-row]").forEach((row) => {
      const label = row.querySelector("th")?.textContent.trim() || row.dataset.trackerRow;
      const values = ["started", "completed", "canvas", "portfolio"].map((status) => {
        const input = row.querySelector(`[data-tracker-key$=":${status}"]`);
        if (!input) return "Not applicable";
        return input.checked ? "Yes" : "No";
      });
      rows.push([label, ...values]);
    });
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "it-security-course-progress.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    showToast("Progress CSV exported.");
  });

  document.querySelector("[data-print-page]")?.addEventListener("click", () => window.print());
  document.querySelector("[data-reset-tracker]")?.addEventListener("click", () => {
    const confirmed = window.confirm("Reset all mission and assignment tracker checks saved in this browser? Portfolio setup checks and your saved URL will remain.");
    if (!confirmed) return;
    state.tracker = {};
    state.missions = {};
    saveState();
    document.querySelectorAll("[data-tracker-key], [data-mission-complete]").forEach((input) => { input.checked = false; });
    updateProgressDisplays();
    showToast("Mission and assignment progress reset.");
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.querySelector(button.dataset.copy);
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent.trim());
        showToast("Copied to clipboard.");
      } catch (error) {
        showToast("Copy was unavailable. Select the text manually.");
      }
    });
  });

  const questions = [
    {
      domain: "General Security Concepts",
      question: "A new file is downloaded from a trusted source. Which action best confirms that the file has not changed since the publisher released it?",
      options: ["Compare its cryptographic hash with the publisher's value", "Encrypt it with a new symmetric key", "Rename the file extension", "Move it to an isolated folder"],
      answer: 0,
      explanation: "A cryptographic hash provides an integrity check. Matching the trusted publisher value supports that the file has not been altered."
    },
    {
      domain: "General Security Concepts",
      question: "A security change causes a critical application to stop working. Which change-management element should guide the team back to the known working configuration?",
      options: ["Rollback plan", "Data classification", "Acceptable-use policy", "Risk appetite"],
      answer: 0,
      explanation: "A rollback or backout plan defines how to reverse a failed change and restore the prior state."
    },
    {
      domain: "General Security Concepts",
      question: "Which control most directly reduces unauthorized access by requiring two different categories of authentication evidence?",
      options: ["Multifactor authentication", "Single sign-on", "Password history", "Account federation"],
      answer: 0,
      explanation: "Multifactor authentication combines different factor types, such as something known and something possessed."
    },
    {
      domain: "Threats, Vulnerabilities, and Mitigations",
      question: "Many user accounts each receive one failed login attempt using the same common password. Which attack pattern best matches this evidence?",
      options: ["Password spraying", "Credential stuffing", "Brute force against one account", "Pass-the-hash"],
      answer: 0,
      explanation: "Password spraying tries a small number of common passwords across many accounts to avoid lockouts."
    },
    {
      domain: "Threats, Vulnerabilities, and Mitigations",
      question: "A vulnerability scanner reports a critical issue on an internal test server. What should an analyst do before treating the scanner score as the final priority?",
      options: ["Validate the finding and consider exposure, asset value, and existing controls", "Immediately shut down every system with the same operating system", "Ignore the issue because the server is internal", "Publish the full scan to a public repository"],
      answer: 0,
      explanation: "Scanner severity is an input. Analysts validate findings and add environmental context before setting remediation priority."
    },
    {
      domain: "Threats, Vulnerabilities, and Mitigations",
      question: "An email demands immediate payment, uses a look-alike sender domain, and asks the recipient to bypass the normal approval process. What is the best first response?",
      options: ["Report the message through the approved channel and verify the request independently", "Reply and ask the sender for a password", "Forward it to coworkers for opinions", "Open the attachment in the normal workstation"],
      answer: 0,
      explanation: "Urgency, domain imitation, and process bypass are social-engineering indicators. Report and verify using a separate trusted channel."
    },
    {
      domain: "Security Architecture",
      question: "A guest wireless device should reach the internet but not employee systems. Which design most directly enforces this requirement?",
      options: ["Place guests in a separate network segment with restrictive firewall rules", "Use the same network and hide the employee SSID", "Increase the employee password length only", "Disable logging on the wireless controller"],
      answer: 0,
      explanation: "Segmentation plus traffic-control rules limits trust and blocks guest access to internal resources."
    },
    {
      domain: "Security Architecture",
      question: "Leadership states that no more than 30 minutes of transaction data may be lost after a disruption. Which metric is being defined?",
      options: ["Recovery point objective", "Recovery time objective", "Mean time to repair", "Service-level objective"],
      answer: 0,
      explanation: "The recovery point objective defines the acceptable amount of data loss measured in time."
    },
    {
      domain: "Security Architecture",
      question: "Which protection is most appropriate for confidential files stored on a powered-off laptop?",
      options: ["Full-disk encryption", "Network segmentation", "Input validation", "DNS filtering"],
      answer: 0,
      explanation: "Full-disk encryption protects data at rest when the device is lost, stolen, or powered off."
    },
    {
      domain: "Security Operations",
      question: "A workstation shows signs of active ransomware encryption. Which action best represents immediate containment?",
      options: ["Isolate the workstation from the network while preserving needed evidence", "Delete all logs before they fill the disk", "Pay the ransom from the user's account", "Reconnect the device to test whether encryption continues"],
      answer: 0,
      explanation: "Isolation limits spread and command-and-control access. Evidence should be preserved according to the response plan."
    },
    {
      domain: "Security Operations",
      question: "An account was used from an unusual location. Which evidence should be reviewed first to establish the authentication timeline?",
      options: ["Identity-provider and authentication logs", "Printer supply records", "Software license invoices", "Cable inventory"],
      answer: 0,
      explanation: "Authentication and identity-provider logs show login times, sources, factors, failures, and session activity."
    },
    {
      domain: "Security Operations",
      question: "A user only needs read access to one shared folder. Which permission decision best follows least privilege?",
      options: ["Grant read access to that folder through the appropriate group", "Make the user a local administrator", "Give full control to the entire file server", "Share a privileged administrator account"],
      answer: 0,
      explanation: "Least privilege grants only the access required for the task, preferably through managed group membership."
    },
    {
      domain: "Security Program Management",
      question: "A company chooses not to operate a risky service and removes it entirely. Which risk response is this?",
      options: ["Avoidance", "Acceptance", "Transfer", "Mitigation"],
      answer: 0,
      explanation: "Risk avoidance removes the activity or condition that creates the risk."
    },
    {
      domain: "Security Program Management",
      question: "A vendor will store sensitive data. Which document should clearly define measurable availability and support commitments?",
      options: ["Service-level agreement", "Asset inventory", "Incident timeline", "Data-flow diagram"],
      answer: 0,
      explanation: "A service-level agreement defines measurable service commitments such as availability, response, and support targets."
    },
    {
      domain: "Security Program Management",
      question: "Which evidence best demonstrates that a phishing-awareness program is improving behavior over time?",
      options: ["A declining simulation click rate combined with faster reporting", "The number of posters printed", "The total length of the policy", "The number of security acronyms taught"],
      answer: 0,
      explanation: "Behavioral measures such as fewer unsafe clicks and faster reporting show whether users apply the training."
    }
  ];

  const quiz = {
    pool: [],
    index: 0,
    correct: 0,
    answered: 0,
    locked: false
  };

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const random = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[random]] = [copy[random], copy[index]];
    }
    return copy;
  }

  function renderQuizQuestion() {
    const card = document.querySelector("[data-quiz-card]");
    if (!card || !quiz.pool.length) return;
    const current = quiz.pool[quiz.index];
    quiz.locked = false;
    setText("[data-question-domain]", current.domain);
    setText("[data-question-number]", `Question ${quiz.index + 1} of ${quiz.pool.length}`);
    setText("[data-question-text]", current.question);
    const list = document.querySelector("[data-answer-list]");
    if (list) {
      list.innerHTML = current.options.map((option, index) => `
        <label>
          <input type="radio" name="quiz-answer" value="${index}">
          <span>${option}</span>
        </label>`).join("");
    }
    const feedback = document.querySelector("[data-quiz-feedback]");
    if (feedback) {
      feedback.hidden = true;
      feedback.className = "quiz-feedback";
      feedback.innerHTML = "";
    }
    const submit = document.querySelector("[data-submit-answer]");
    if (submit) submit.disabled = false;
    const next = document.querySelector("[data-next-question]");
    if (next) next.hidden = true;
    setText("[data-quiz-score]", `${quiz.correct} / ${quiz.answered}`);
  }

  function startQuiz() {
    const domain = document.querySelector("[data-quiz-domain]")?.value || "all";
    const filtered = domain === "all" ? questions : questions.filter((question) => question.domain === domain);
    quiz.pool = shuffle(filtered);
    quiz.index = 0;
    quiz.correct = 0;
    quiz.answered = 0;
    renderQuizQuestion();
    showToast(`Practice session started with ${quiz.pool.length} questions.`);
  }

  document.querySelector("[data-start-quiz]")?.addEventListener("click", startQuiz);
  document.querySelector("[data-quiz-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (quiz.locked || !quiz.pool.length) return;
    const selected = document.querySelector('input[name="quiz-answer"]:checked');
    if (!selected) {
      showToast("Choose an answer before checking it.");
      return;
    }
    quiz.locked = true;
    const current = quiz.pool[quiz.index];
    const selectedIndex = Number(selected.value);
    const correct = selectedIndex === current.answer;
    quiz.answered += 1;
    if (correct) quiz.correct += 1;
    document.querySelectorAll('input[name="quiz-answer"]').forEach((input) => { input.disabled = true; });
    const submit = document.querySelector("[data-submit-answer]");
    if (submit) submit.disabled = true;
    const feedback = document.querySelector("[data-quiz-feedback]");
    if (feedback) {
      feedback.hidden = false;
      feedback.classList.add(correct ? "correct" : "incorrect");
      feedback.innerHTML = `<h3>${correct ? "Correct" : "Review this concept"}</h3><p>${current.explanation}</p>`;
    }
    setText("[data-quiz-score]", `${quiz.correct} / ${quiz.answered}`);
    const percent = Math.round((quiz.correct / quiz.answered) * 100);
    if (percent > Number(state.quizBest || 0)) {
      state.quizBest = percent;
      saveState();
      updateProgressDisplays();
    }
    const next = document.querySelector("[data-next-question]");
    if (next) {
      next.hidden = false;
      next.textContent = quiz.index === quiz.pool.length - 1 ? "View session result" : "Next question";
    }
  });

  document.querySelector("[data-next-question]")?.addEventListener("click", () => {
    if (quiz.index < quiz.pool.length - 1) {
      quiz.index += 1;
      renderQuizQuestion();
      return;
    }
    const percent = quiz.answered ? Math.round((quiz.correct / quiz.answered) * 100) : 0;
    setText("[data-question-domain]", "Session complete");
    setText("[data-question-number]", `${quiz.correct} correct`);
    setText("[data-question-text]", `You scored ${percent}% on this practice session.`);
    const list = document.querySelector("[data-answer-list]");
    if (list) list.innerHTML = "";
    const feedback = document.querySelector("[data-quiz-feedback]");
    if (feedback) {
      feedback.hidden = false;
      feedback.className = "quiz-feedback";
      feedback.innerHTML = "<h3>Next step</h3><p>Review missed concepts, connect them to a course mission, and start another session when ready.</p>";
    }
    const submit = document.querySelector("[data-submit-answer]");
    if (submit) submit.disabled = true;
    const next = document.querySelector("[data-next-question]");
    if (next) next.hidden = true;
  });

  function openHashTarget() {
    const hash = window.location.hash;
    if (!hash) return;
    let target;
    try { target = document.querySelector(hash); } catch (error) { return; }
    if (!target) return;
    if (target.tagName === "DETAILS") target.open = true;
    const details = target.querySelector?.("details");
    if (details && target.matches("[data-mission-card]")) details.open = true;
  }
  window.addEventListener("hashchange", openHashTarget);
  openHashTarget();
})();
