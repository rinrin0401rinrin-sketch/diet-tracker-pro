const STORAGE_KEY = "diet-tracker-pro-dashboard-v2";
const LEGACY_MEALS_KEY = "diet-tracker-pro-meals";
const LEGACY_WATER_KEY = "diet-tracker-pro-water";
const LEGACY_STEPS_KEY = "diet-tracker-pro-activity";
const INSTALL_DISMISS_KEY = "diet-tracker-pro-install-dismissed";

const saveStatus = document.querySelector("#saveStatus");
const selectedDateLabel = document.querySelector("#selectedDateLabel");
const monthLabel = document.querySelector("#monthLabel");
const calendarGrid = document.querySelector("#calendarGrid");
const dateInput = document.querySelector("#dateInput");
const todayButton = document.querySelector("#todayButton");
const prevMonth = document.querySelector("#prevMonth");
const nextMonth = document.querySelector("#nextMonth");
const resetDay = document.querySelector("#resetDay");
const clearAllData = document.querySelector("#clearAllData");
const calorieForm = document.querySelector("#calorieForm");
const waterForm = document.querySelector("#waterForm");
const caloriesValue = document.querySelector("#caloriesValue");
const waterValue = document.querySelector("#waterValue");
const caloriesInput = document.querySelector("#caloriesInput");
const waterInput = document.querySelector("#waterInput");
const clearCalories = document.querySelector("#clearCalories");
const clearWater = document.querySelector("#clearWater");
const installCard = document.querySelector("#installCard");
const installAction = document.querySelector("#installAction");
const dismissInstall = document.querySelector("#dismissInstall");
const installTitle = document.querySelector("#installTitle");
const installMessage = document.querySelector("#installMessage");

let entries = loadEntries();
let selectedDate = getTodayKey();
let visibleMonth = selectedDate.slice(0, 7);
let deferredInstallPrompt = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js?v=31").catch(() => {
      saveStatus.textContent = "Saved in browser";
    });
  });
}

setupAppShellMode();
setupInstallHint();
setupEvents();
render();

function loadEntries() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      return sanitizeEntries(JSON.parse(current));
    }
  } catch {
    // Fall through to migration.
  }

  return migrateLegacyEntries();
}

function migrateLegacyEntries() {
  const nextEntries = {};

  try {
    const meals = JSON.parse(localStorage.getItem(LEGACY_MEALS_KEY) || "[]");
    if (Array.isArray(meals)) {
      meals.forEach((meal) => {
        const dateKey = meal && meal.dateKey ? meal.dateKey : getTodayKey();
        const base = nextEntries[dateKey] || { calories: 0, steps: 0, water: 0 };
        base.calories += readNumber(meal.calories);
        nextEntries[dateKey] = base;
      });
    }
  } catch {
    // Ignore malformed legacy meal data.
  }

  try {
    const hydration = JSON.parse(localStorage.getItem(LEGACY_WATER_KEY) || "{}");
    if (hydration && typeof hydration === "object" && !Array.isArray(hydration)) {
      Object.entries(hydration).forEach(([dateKey, value]) => {
        const base = nextEntries[dateKey] || { calories: 0, steps: 0, water: 0 };
        base.water = readNumber(value);
        nextEntries[dateKey] = base;
      });
    }
  } catch {
    // Ignore malformed legacy hydration data.
  }

  try {
    const activity = JSON.parse(localStorage.getItem(LEGACY_STEPS_KEY) || "{}");
    if (activity && typeof activity === "object" && !Array.isArray(activity)) {
      Object.entries(activity).forEach(([dateKey, value]) => {
        const base = nextEntries[dateKey] || { calories: 0, steps: 0, water: 0 };
        base.steps = readNumber(value && value.steps);
        nextEntries[dateKey] = base;
      });
    }
  } catch {
    // Ignore malformed legacy activity data.
  }

  return sanitizeEntries(nextEntries);
}

function sanitizeEntries(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(raw).map(([dateKey, entry]) => [dateKey, sanitizeEntry(entry)])
  );
}

function sanitizeEntry(entry) {
  return {
    calories: Math.max(Math.round(readNumber(entry && entry.calories)), 0),
    steps: Math.max(Math.round(readNumber(entry && entry.steps)), 0),
    water: Math.max(Math.round(readNumber(entry && entry.water)), 0),
  };
}

function saveEntries(message = "Saved") {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    flashSaveStatus("Could not save");
    return;
  }

  flashSaveStatus(message);
}

function getEntry(dateKey) {
  return entries[dateKey] || { calories: 0, steps: 0, water: 0 };
}

function updateEntry(dateKey, patch, message) {
  const next = sanitizeEntry({ ...getEntry(dateKey), ...patch });
  if (next.calories === 0 && next.steps === 0 && next.water === 0) {
    delete entries[dateKey];
  } else {
    entries[dateKey] = next;
  }
  saveEntries(message);
  render();
}

function addToEntry(dateKey, key, amount, message) {
  const current = getEntry(dateKey);
  updateEntry(dateKey, { [key]: current[key] + amount }, message);
}

function resetSelectedDay() {
  delete entries[selectedDate];
  saveEntries("Day reset");
  render();
}

function clearStoredAppData() {
  const confirmed = window.confirm("Delete all Diet Tracker Pro records stored in this browser?");
  if (!confirmed) {
    return;
  }

  Object.keys(localStorage)
    .filter((key) => key.startsWith("diet-tracker-pro-"))
    .forEach((key) => localStorage.removeItem(key));
  entries = {};
  selectedDate = getTodayKey();
  visibleMonth = selectedDate.slice(0, 7);
  render();
  flashSaveStatus("All local data cleared");
}

function setupEvents() {
  dateInput.addEventListener("change", () => {
    if (!dateInput.value) {
      return;
    }
    setSelectedDate(dateInput.value);
  });

  todayButton.addEventListener("click", () => setSelectedDate(getTodayKey()));
  prevMonth.addEventListener("click", () => moveMonth(-1));
  nextMonth.addEventListener("click", () => moveMonth(1));
  resetDay.addEventListener("click", resetSelectedDay);
  clearAllData.addEventListener("click", clearStoredAppData);

  calorieForm.addEventListener("submit", (event) => {
    event.preventDefault();
    normalizeNumericField(caloriesInput, false);
    updateEntry(selectedDate, { calories: readNumber(caloriesInput.value) }, "Calories saved");
  });

  clearCalories.addEventListener("click", () => {
    updateEntry(selectedDate, { calories: 0 }, "Calories cleared");
  });

  waterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    normalizeNumericField(waterInput, false);
    addToEntry(selectedDate, "water", readNumber(waterInput.value), "Water added");
  });

  document.querySelectorAll("[data-water-add]").forEach((button) => {
    button.addEventListener("click", () => {
      addToEntry(selectedDate, "water", readNumber(button.dataset.waterAdd), "Water added");
    });
  });

  clearWater.addEventListener("click", () => {
    updateEntry(selectedDate, { water: 0 }, "Water cleared");
  });

  [caloriesInput, waterInput].forEach((field) => {
    field.addEventListener("change", () => normalizeNumericField(field, false));
  });
}

function render() {
  const entry = getEntry(selectedDate);
  selectedDateLabel.textContent = formatFullDate(selectedDate);
  dateInput.value = selectedDate;
  monthLabel.textContent = formatMonthLabel(visibleMonth);
  caloriesValue.textContent = formatNumber(entry.calories);
  waterValue.textContent = formatNumber(entry.water);
  caloriesInput.value = entry.calories > 0 ? String(entry.calories) : "1800";
  waterInput.value = "250";
  renderCalendar();
  syncSaveStatus();
}

function renderCalendar() {
  const [year, month] = visibleMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0).getDate();
  const offset = firstDay.getDay();
  const today = getTodayKey();

  calendarGrid.innerHTML = "";

  for (let i = 0; i < offset; i += 1) {
    const blank = document.createElement("span");
    blank.className = "calendar-blank";
    calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const dateKey = formatDateKey(year, month, day);
    const entry = getEntry(dateKey);
    const button = document.createElement("button");
    const markers = document.createElement("span");
    const dayNumber = document.createElement("span");

    button.type = "button";
    button.className = "calendar-day";
    if (dateKey === selectedDate) {
      button.classList.add("selected");
    }
    if (dateKey === today) {
      button.classList.add("today");
    }

    dayNumber.className = "day-number";
    dayNumber.textContent = String(day);

    markers.className = "calendar-markers";
    if (entry.calories > 0) {
      markers.appendChild(createMarker("calories", `Calories: ${formatNumber(entry.calories)} kcal`));
    }
    if (entry.water > 0) {
      markers.appendChild(createMarker("water", `Water: ${formatNumber(entry.water)} ml`));
    }

    button.title = `${formatFullDate(dateKey)} | ${formatTooltip(entry)}`;
    button.setAttribute("aria-label", formatFullDate(dateKey));
    button.addEventListener("click", () => setSelectedDate(dateKey));
    button.appendChild(dayNumber);
    button.appendChild(markers);
    calendarGrid.appendChild(button);
  }
}

function createMarker(type, label) {
  const marker = document.createElement("span");
  marker.className = `marker ${type}`;
  marker.title = label;
  return marker;
}

function formatTooltip(entry) {
  const parts = [
    `${formatNumber(entry.calories)} kcal`,
    `${formatNumber(entry.water)} ml`,
  ];
  return parts.join(" | ");
}

function setSelectedDate(dateKey) {
  if (!parseDateKey(dateKey)) {
    return;
  }
  selectedDate = dateKey;
  visibleMonth = dateKey.slice(0, 7);
  render();
}

function moveMonth(delta) {
  const [year, month] = visibleMonth.split("-").map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  visibleMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  const selected = parseDateKey(selectedDate);
  const selectedDay = selected ? selected.getDate() : 1;
  const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  selectedDate = formatDateKey(next.getFullYear(), next.getMonth() + 1, Math.min(selectedDay, maxDay));
  render();
}

function toHalfWidth(value) {
  return String(value || "")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[．。]/g, ".")
    .replace(/[，、]/g, ".")
    .replace(/[－ー―]/g, "-")
    .replace(/[＋]/g, "+")
    .replace(/　/g, " ")
    .trim();
}

function readNumber(value) {
  const parsed = Number(toHalfWidth(value));
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function normalizeNumericField(field, allowDecimal = false) {
  const normalized = toHalfWidth(field.value);
  field.value = allowDecimal ? normalized : normalized.replace(/\..*$/, "");
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateKey(dateKey) {
  const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function getTodayKey() {
  const now = new Date();
  return formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function formatFullDate(dateKey) {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, 1));
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("en-US");
}

function flashSaveStatus(message) {
  saveStatus.textContent = message;
  window.clearTimeout(flashSaveStatus.timer);
  flashSaveStatus.timer = window.setTimeout(() => {
    syncSaveStatus();
  }, 1400);
}

function syncSaveStatus() {
  saveStatus.textContent = navigator.onLine ? "Saved on this device" : "Offline mode";
}

function isStandaloneMode() {
  return Boolean(window.navigator.standalone) || window.matchMedia("(display-mode: standalone)").matches;
}

function applyShellClasses() {
  document.body.classList.toggle("is-standalone", isStandaloneMode());
  document.body.classList.toggle("is-ios", /iphone|ipad|ipod/i.test(navigator.userAgent));
  document.body.classList.toggle("is-offline", !navigator.onLine);
  syncSaveStatus();
}

function setupAppShellMode() {
  applyShellClasses();
  window.addEventListener("online", applyShellClasses);
  window.addEventListener("offline", applyShellClasses);

  const standaloneMedia = window.matchMedia("(display-mode: standalone)");
  if (typeof standaloneMedia.addEventListener === "function") {
    standaloneMedia.addEventListener("change", applyShellClasses);
  } else if (typeof standaloneMedia.addListener === "function") {
    standaloneMedia.addListener(applyShellClasses);
  }
}

function setupInstallHint() {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const dismissed = localStorage.getItem(INSTALL_DISMISS_KEY) === "true";

  function renderInstallCard() {
    const standalone = isStandaloneMode();
    const hasPrompt = Boolean(deferredInstallPrompt);

    if (standalone || dismissed || (!isIos && !hasPrompt)) {
      installCard.hidden = true;
      return;
    }

    installCard.hidden = false;
    installAction.hidden = !hasPrompt;

    if (isIos) {
      installTitle.textContent = "Install on iPhone";
      installMessage.textContent = "Open this page in Safari, tap Share, then choose Add to Home Screen.";
    } else {
      installTitle.textContent = "Install as Web App";
      installMessage.textContent = "Install this tracker for a full-screen launch and offline support.";
    }
  }

  renderInstallCard();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    renderInstallCard();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installCard.hidden = true;
    applyShellClasses();
  });

  installAction.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } catch {
      // The user can close the prompt without side effects.
    }
    deferredInstallPrompt = null;
    renderInstallCard();
  });

  dismissInstall.addEventListener("click", () => {
    localStorage.setItem(INSTALL_DISMISS_KEY, "true");
    installCard.hidden = true;
  });
}
