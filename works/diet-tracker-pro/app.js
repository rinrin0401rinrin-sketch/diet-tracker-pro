const STORAGE_KEY = "diet-tracker-pro-meals";
const GOAL_KEY = "diet-tracker-pro-goal";
const WATER_KEY = "diet-tracker-pro-water";
const BASAL_KEY = "diet-tracker-pro-basal";
const ACTIVITY_KEY = "diet-tracker-pro-activity";
const DEFAULT_GOAL = 1800;
const DEFAULT_BASAL = 1450;
const WATER_GOAL = 2000;
const MAX_IMAGE_SIZE = 900;
const WEEKDAYS = ["Sun/日", "Mon/月", "Tue/火", "Wed/水", "Thu/木", "Fri/金", "Sat/土"];

const form = document.querySelector("#mealForm");
const goalForm = document.querySelector("#goalForm");
const mealList = document.querySelector("#mealList");
const emptyState = document.querySelector("#emptyState");
const resetDay = document.querySelector("#resetDay");
const calorieBar = document.querySelector("#calorieBar");
const saveStatus = document.querySelector("#saveStatus");
const installCard = document.querySelector("#installCard");
const dismissInstall = document.querySelector("#dismissInstall");
const installAction = document.querySelector("#installAction");
const installTitle = document.querySelector("#installTitle");
const installMessage = document.querySelector("#installMessage");
const calendarGrid = document.querySelector("#calendarGrid");
const calendarTitle = document.querySelector("#calendarTitle");
const selectedDateLabel = document.querySelector("#selectedDateLabel");
const todayButton = document.querySelector("#todayButton");
const prevMonth = document.querySelector("#prevMonth");
const nextMonth = document.querySelector("#nextMonth");
const prevYear = document.querySelector("#prevYear");
const nextYear = document.querySelector("#nextYear");
const screenshotPanel = document.querySelector("#screenshotPanel");
const screenshotStatus = document.querySelector("#screenshotStatus");
const screenshotPreview = document.querySelector("#screenshotPreview");
const screenshotImage = document.querySelector("#screenshotImage");
const clearImage = document.querySelector("#clearImage");
const estimatePanel = document.querySelector("#estimatePanel");
const estimateStatus = document.querySelector("#estimateStatus");
const adjustmentStatus = document.querySelector("#adjustmentStatus");
const detailDialog = document.querySelector("#detailDialog");
const detailContent = document.querySelector("#detailContent");
const waterForm = document.querySelector("#waterForm");
const waterTotal = document.querySelector("#waterTotal");
const waterFill = document.querySelector("#waterFill");
const waterDateLabel = document.querySelector("#waterDateLabel");
const waterReset = document.querySelector("#waterReset");
const activityForm = document.querySelector("#activityForm");
const stepTotal = document.querySelector("#stepTotal");
const activityDateLabel = document.querySelector("#activityDateLabel");
const activityReset = document.querySelector("#activityReset");
const totalRow = document.querySelector("#totalRow");
const limitBalanceRow = document.querySelector("#limitBalanceRow");
const limitBalanceLabel = document.querySelector("#limitBalanceLabel");
const calorieStatCard = document.querySelector("#calorieStatCard");

const fields = {
  date: document.querySelector("#dateInput"),
  name: document.querySelector("#mealName"),
  type: document.querySelector("#mealType"),
  calories: document.querySelector("#calories"),
  protein: document.querySelector("#protein"),
  carbs: document.querySelector("#carbs"),
  fat: document.querySelector("#fat"),
  goal: document.querySelector("#goalInput"),
  basal: document.querySelector("#basalInput"),
  image: document.querySelector("#mealImage"),
  water: document.querySelector("#waterInput"),
  steps: document.querySelector("#stepsInput"),
};

const totals = {
  calories: document.querySelector("#statCalories"),
  protein: document.querySelector("#statProtein"),
  carbs: document.querySelector("#statCarbs"),
  fat: document.querySelector("#statFat"),
  railCalories: document.querySelector("#calorieTotal"),
  railGoal: document.querySelector("#calorieGoal"),
  net: document.querySelector("#netCalories"),
};

const draft = {
  calories: document.querySelector("#draftCalories"),
  statCalories: document.querySelector("#statCaloriesDraft"),
  proteinBar: document.querySelector("#proteinBar"),
  fatBar: document.querySelector("#fatBar"),
  carbBar: document.querySelector("#carbBar"),
  proteinRatio: document.querySelector("#proteinRatio"),
  fatRatio: document.querySelector("#fatRatio"),
  carbRatio: document.querySelector("#carbRatio"),
};

const adjustment = {
  calories: document.querySelector("#adjustCalories"),
  protein: document.querySelector("#adjustProtein"),
  carbs: document.querySelector("#adjustCarbs"),
  fat: document.querySelector("#adjustFat"),
};

const estimateBaseDisplay = {
  calories: document.querySelector("#baseCalories"),
  protein: document.querySelector("#baseProtein"),
  carbs: document.querySelector("#baseCarbs"),
  fat: document.querySelector("#baseFat"),
};

let meals = loadMeals();
let hydration = loadHydration();
let activity = loadActivity();
let calorieGoal = loadGoal();
let basalCalories = loadBasal();
let selectedDate = getTodayKey();
let visibleMonth = selectedDate.slice(0, 7);
let pendingImage = null;
let deferredInstallPrompt = null;
let estimateBase = {
  calories: 250,
  protein: 20,
  carbs: 8,
  fat: 6,
};

fields.goal.value = String(calorieGoal);
fields.basal.value = String(basalCalories);
fields.date.value = selectedDate;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js?v=26").catch(() => {
      saveStatus.textContent = "Saved in browser / ブラウザに保存";
    });
  });
}

setupAppShellMode();
setupInstallHint();
setupScreenshotInput();
setupEstimateButtons();
render();

function loadMeals() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((meal) => ({
      ...meal,
      dateKey: meal.dateKey || getTodayKey(),
      imageData: meal.imageData || "",
      imageName: meal.imageName || "",
    }));
  } catch {
    return [];
  }
}

function saveMeals() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
    flashSaveStatus("Saved / 保存済み");
  } catch {
    flashSaveStatus("Could not save / 保存できませんでした");
  }
}

function loadHydration() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WATER_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveHydration() {
  try {
    localStorage.setItem(WATER_KEY, JSON.stringify(hydration));
    flashSaveStatus("Water saved / 水分を保存");
  } catch {
    flashSaveStatus("Could not save water / 水分を保存できませんでした");
  }
}

function loadActivity() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveActivity() {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
    flashSaveStatus("Activity saved / 活動を保存");
  } catch {
    flashSaveStatus("Could not save activity / 活動を保存できませんでした");
  }
}

function loadGoal() {
  try {
    const saved = readNumber(localStorage.getItem(GOAL_KEY));
    return saved > 0 ? Math.round(saved) : DEFAULT_GOAL;
  } catch {
    return DEFAULT_GOAL;
  }
}

function loadBasal() {
  try {
    const saved = readNumber(localStorage.getItem(BASAL_KEY));
    return saved > 0 ? Math.round(saved) : DEFAULT_BASAL;
  } catch {
    return DEFAULT_BASAL;
  }
}

function saveGoal() {
  const nextGoal = Math.max(Math.round(readNumber(fields.goal.value)), 1);
  calorieGoal = nextGoal;
  fields.goal.value = String(nextGoal);

  try {
    localStorage.setItem(GOAL_KEY, String(nextGoal));
  } catch {
    // The value still updates in memory if browser storage is unavailable.
  }

  flashSaveStatus("Daily limit updated / 目標を更新");
  renderTotals();
  renderCalendar();
}

function saveBasal() {
  const nextBasal = Math.max(Math.round(readNumber(fields.basal.value)), 1);
  basalCalories = nextBasal;
  fields.basal.value = String(nextBasal);

  try {
    localStorage.setItem(BASAL_KEY, String(nextBasal));
  } catch {
    // The value still updates in memory if browser storage is unavailable.
  }

  flashSaveStatus("Burn guide saved / 目安を保存");
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

function readSignedNumber(value) {
  const parsed = Number(toHalfWidth(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeNumericField(field, allowDecimal = true) {
  const normalized = toHalfWidth(field.value);
  field.value = allowDecimal ? normalized : normalized.replace(/\..*$/, "");
}

function readFormNumber(formData, key) {
  return readNumber(formData.get(key));
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getTodayKey() {
  const now = new Date();
  return formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function formatDateKey(year, month, date) {
  return `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
}

function formatDateLabel(dateKey) {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }
  const english = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const japanese = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
  return `${english} / ${japanese}`;
}

function formatMonthLabel(year, month) {
  const date = new Date(year, month - 1, 1);
  const english = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
  const japanese = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
  }).format(date);
  return `${english} / ${japanese}`;
}

function parseDateKey(dateKey) {
  const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function getMealsForDate(dateKey) {
  return meals.filter((meal) => meal.dateKey === dateKey);
}

function getTotalsForDate(dateKey) {
  return getMealsForDate(dateKey).reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
      carbs: sum.carbs + meal.carbs,
      fat: sum.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function getWaterForDate(dateKey) {
  return Math.max(Math.round(readNumber(hydration[dateKey])), 0);
}

function getActivityForDate(dateKey) {
  const entry = activity[dateKey] || {};
  return {
    steps: Math.max(Math.round(readNumber(entry.steps)), 0),
  };
}

function formatSteps(value) {
  return Math.round(value).toLocaleString("en-US");
}

function formatCalendarSteps(value) {
  if (value >= 10000) {
    return `${Math.round(value / 1000)}k stp`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k stp`;
  }
  return `${value} stp`;
}

function flashSaveStatus(message = "Saved / 保存済み") {
  saveStatus.textContent = message;
  window.clearTimeout(flashSaveStatus.timer);
  flashSaveStatus.timer = window.setTimeout(() => {
    syncSaveStatus();
  }, 1400);
}

function isStandaloneMode() {
  return Boolean(window.navigator.standalone) || window.matchMedia("(display-mode: standalone)").matches;
}

function syncSaveStatus() {
  saveStatus.textContent = navigator.onLine
    ? "Saved on device / 端末に保存済み"
    : "Offline mode / オフライン利用中";
}

function applyShellClasses() {
  const standalone = isStandaloneMode();
  document.body.classList.toggle("is-standalone", standalone);
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

function getDraftMeal() {
  const protein = readNumber(fields.protein.value);
  const fat = readNumber(fields.fat.value);
  const carbs = readNumber(fields.carbs.value);
  const calories = readNumber(fields.calories.value);
  const macroCalories = protein * 4 + fat * 9 + carbs * 4;
  return { calories, protein, fat, carbs, macroCalories };
}

function getRatio(value, total) {
  if (total <= 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

function renderDraft() {
  const meal = getDraftMeal();
  const proteinCalories = meal.protein * 4;
  const fatCalories = meal.fat * 9;
  const carbCalories = meal.carbs * 4;
  const ratioBase = meal.macroCalories || meal.calories;
  const proteinRatio = getRatio(proteinCalories, ratioBase);
  const fatRatio = getRatio(fatCalories, ratioBase);
  const carbRatio = getRatio(carbCalories, ratioBase);

  draft.calories.textContent = Math.round(meal.calories);
  draft.statCalories.textContent = `Draft / 入力中 +${Math.round(meal.calories)} kcal`;
  draft.proteinBar.style.width = `${Math.min(proteinRatio, 100)}%`;
  draft.fatBar.style.width = `${Math.min(fatRatio, 100)}%`;
  draft.carbBar.style.width = `${Math.min(carbRatio, 100)}%`;
  draft.proteinRatio.textContent = `${formatMacro(meal.protein)}g / ${proteinRatio}%`;
  draft.fatRatio.textContent = `${formatMacro(meal.fat)}g / ${fatRatio}%`;
  draft.carbRatio.textContent = `${formatMacro(meal.carbs)}g / ${carbRatio}%`;
}

function getCurrentMealInputs() {
  return {
    calories: readNumber(fields.calories.value),
    protein: readNumber(fields.protein.value),
    carbs: readNumber(fields.carbs.value),
    fat: readNumber(fields.fat.value),
  };
}

function formatInputNumber(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function setEstimateBase(nextBase) {
  estimateBase = {
    calories: Math.max(Math.round(readNumber(nextBase.calories)), 0),
    protein: readNumber(nextBase.protein),
    carbs: readNumber(nextBase.carbs),
    fat: readNumber(nextBase.fat),
  };
  renderEstimateBase();
}

function renderEstimateBase() {
  estimateBaseDisplay.calories.textContent = Math.round(estimateBase.calories);
  estimateBaseDisplay.protein.textContent = formatMacro(estimateBase.protein);
  estimateBaseDisplay.carbs.textContent = formatMacro(estimateBase.carbs);
  estimateBaseDisplay.fat.textContent = formatMacro(estimateBase.fat);
}

function resetAdjustmentInputs() {
  Object.values(adjustment).forEach((field) => {
    field.value = "0";
  });
}

function getAdjustmentValues() {
  return {
    calories: readSignedNumber(adjustment.calories.value),
    protein: readSignedNumber(adjustment.protein.value),
    carbs: readSignedNumber(adjustment.carbs.value),
    fat: readSignedNumber(adjustment.fat.value),
  };
}

function applyAdjustmentToFields() {
  const diff = getAdjustmentValues();
  fields.calories.value = String(Math.max(Math.round(estimateBase.calories + diff.calories), 0));
  fields.protein.value = formatInputNumber(Math.max(estimateBase.protein + diff.protein, 0));
  fields.carbs.value = formatInputNumber(Math.max(estimateBase.carbs + diff.carbs, 0));
  fields.fat.value = formatInputNumber(Math.max(estimateBase.fat + diff.fat, 0));
  renderDraft();
}

function setDefaultDraftValues() {
  fields.calories.value = "250";
  fields.protein.value = "20";
  fields.carbs.value = "8";
  fields.fat.value = "6";
  setEstimateBase(getCurrentMealInputs());
  resetAdjustmentInputs();
  adjustmentStatus.textContent = "Photo estimate values fill kcal and PFC. Add a manual diff if needed. 概算値に足し引きしたい差分を入力できます。";
  renderDraft();
}

function formatMacro(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function renderTotals() {
  const day = getTotalsForDate(selectedDate);
  const foodCalories = Math.round(day.calories);
  const totalCalories = foodCalories;
  const balance = calorieGoal - totalCalories;
  const percent = Math.min((totalCalories / calorieGoal) * 100, 100);

  totals.calories.textContent = foodCalories;
  totals.protein.textContent = formatMacro(day.protein);
  totals.carbs.textContent = formatMacro(day.carbs);
  totals.fat.textContent = formatMacro(day.fat);
  totals.railCalories.textContent = totalCalories;
  totals.railGoal.textContent = calorieGoal;
  limitBalanceLabel.textContent = balance < 0 ? "Over by / 超過" : "Remaining / 残り";
  totals.net.textContent = Math.abs(balance);
  limitBalanceRow.classList.toggle("is-over", balance < 0);
  totalRow.classList.toggle("is-over", totalCalories > calorieGoal);
  calorieStatCard.classList.toggle("is-over", totalCalories > calorieGoal);

  calorieBar.style.width = `${percent}%`;
  calorieBar.style.background = totalCalories > calorieGoal ? "var(--danger)" : "var(--cyan)";
}

function renderWater() {
  const amount = getWaterForDate(selectedDate);
  const percent = Math.min((amount / WATER_GOAL) * 100, 100);
  waterTotal.textContent = amount;
  waterFill.style.height = `${percent}%`;
  waterDateLabel.textContent = formatDateLabel(selectedDate);
}

function renderActivity() {
  const dayActivity = getActivityForDate(selectedDate);
  stepTotal.textContent = formatSteps(dayActivity.steps);
  activityDateLabel.textContent = formatDateLabel(selectedDate);
  fields.steps.value = dayActivity.steps ? String(dayActivity.steps) : "8000";
}

function renderMeals() {
  mealList.innerHTML = "";
  const selectedMeals = getMealsForDate(selectedDate);
  emptyState.hidden = selectedMeals.length > 0;

  selectedMeals.forEach((meal) => {
    const item = document.createElement("li");
    item.className = "meal-row";

    const text = document.createElement("div");
    const title = document.createElement("h3");
    const detail = document.createElement("p");
    const calories = document.createElement("strong");
    const actions = document.createElement("div");
    const detailButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    title.textContent = meal.name;
    detail.textContent = `${meal.type} / ${formatDateLabel(meal.dateKey)} / P ${formatMacro(meal.protein)}g / C ${formatMacro(meal.carbs)}g / F ${formatMacro(meal.fat)}g`;
    calories.textContent = `${Math.round(meal.calories)} kcal`;

    actions.className = "meal-actions";
    detailButton.className = meal.imageData ? "image-detail-button" : "detail-button";
    detailButton.type = "button";
    detailButton.innerHTML = meal.imageData
      ? '<span class="shot-icon mini" aria-hidden="true"></span><span>Details / 詳細</span>'
      : "<span>Details / 詳細</span>";
    detailButton.addEventListener("click", () => openMealDetail(meal));

    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete / 削除";
    deleteButton.setAttribute("aria-label", `Delete ${meal.name} / ${meal.name}を削除`);
    deleteButton.addEventListener("click", () => {
      meals = meals.filter((entry) => entry.id !== meal.id);
      saveMeals();
      render();
    });

    text.appendChild(title);
    text.appendChild(detail);
    actions.appendChild(detailButton);
    actions.appendChild(deleteButton);
    item.appendChild(text);
    item.appendChild(calories);
    item.appendChild(actions);
    mealList.appendChild(item);
  });
}

function renderCalendar() {
  const [year, month] = visibleMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0).getDate();
  const offset = firstDay.getDay();

  calendarTitle.textContent = formatMonthLabel(year, month);
  calendarGrid.innerHTML = "";

  WEEKDAYS.forEach((day) => {
    const label = document.createElement("span");
    label.className = "calendar-weekday";
    label.textContent = day;
    calendarGrid.appendChild(label);
  });

  for (let i = 0; i < offset; i += 1) {
    const blank = document.createElement("span");
    blank.className = "calendar-blank";
    calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const dateKey = formatDateKey(year, month, day);
    const total = getTotalsForDate(dateKey);
    const count = getMealsForDate(dateKey).length;
    const water = getWaterForDate(dateKey);
    const dayActivity = getActivityForDate(dateKey);
    const button = document.createElement("button");

    button.type = "button";
    button.className = "calendar-day";
    if (dateKey === selectedDate) {
      button.classList.add("is-selected");
    }
    if (count > 0) {
      button.classList.add("has-meal");
    }
    if (water > 0) {
      button.classList.add("has-water");
    }
    if (dayActivity.steps > 0) {
      button.classList.add("has-activity");
    }
    const badges = [
      count ? `${Math.round(total.calories)} kcal` : "",
      water ? `${water} ml` : "",
      dayActivity.steps ? formatCalendarSteps(dayActivity.steps) : "",
    ].filter(Boolean);
    button.innerHTML = `<span>${day}</span><small>${badges.join(" / ")}</small>`;
    button.setAttribute("aria-label", `Select ${formatDateLabel(dateKey)} / ${formatDateLabel(dateKey)}を選択`);
    button.title = formatDateLabel(dateKey);
    button.addEventListener("click", () => setSelectedDate(dateKey));
    calendarGrid.appendChild(button);
  }
}

function syncDateControls() {
  const selectedWestern = formatDateLabel(selectedDate);

  selectedDateLabel.textContent = selectedWestern;
  fields.date.value = selectedDate;
}

function render() {
  renderTotals();
  renderMeals();
  renderDraft();
  renderEstimateBase();
  renderCalendar();
  renderWater();
  renderActivity();
  syncDateControls();
}

function setSelectedDate(dateKey) {
  if (!parseDateKey(dateKey)) {
    return;
  }
  selectedDate = dateKey;
  visibleMonth = dateKey.slice(0, 7);
  render();
}

function setVisibleMonth(monthKey) {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return;
  }
  visibleMonth = monthKey;
  const [year, month] = monthKey.split("-").map(Number);
  const selected = parseDateKey(selectedDate);
  const date = selected ? selected.getDate() : 1;
  const lastDate = new Date(year, month, 0).getDate();
  selectedDate = formatDateKey(year, month, Math.min(date, lastDate));
  render();
}

function moveMonth(delta) {
  const [year, month] = visibleMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  setVisibleMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
}

function moveYear(delta) {
  const [year, month] = visibleMonth.split("-").map(Number);
  setVisibleMonth(`${year + delta}-${String(month).padStart(2, "0")}`);
}

function addWater(amount) {
  const current = getWaterForDate(selectedDate);
  hydration[selectedDate] = Math.max(current + amount, 0);
  saveHydration();
  renderWater();
  renderCalendar();
}

function setActivity(steps) {
  const nextSteps = Math.max(Math.round(steps), 0);
  activity[selectedDate] = {
    steps: nextSteps,
  };
  saveActivity();
  renderActivity();
  renderCalendar();
}

function addSteps(amount) {
  const current = getActivityForDate(selectedDate);
  const nextSteps = current.steps + amount;
  setActivity(nextSteps);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  normalizeNumericField(fields.calories, false);
  normalizeNumericField(fields.protein);
  normalizeNumericField(fields.carbs);
  normalizeNumericField(fields.fat);

  const formData = new FormData(form);
  const typedName = String(formData.get("mealName") || "").trim();
  const mealType = String(formData.get("mealType"));
  const dateKey = selectedDate;
  const name = typedName || "Meal entry / 食事記録";

  selectedDate = dateKey;
  visibleMonth = dateKey.slice(0, 7);
  meals.unshift({
    id: createId(),
    dateKey,
    name,
    type: mealType,
    calories: readFormNumber(formData, "calories"),
    protein: readFormNumber(formData, "protein"),
    carbs: readFormNumber(formData, "carbs"),
    fat: readFormNumber(formData, "fat"),
    imageData: pendingImage ? pendingImage.dataUrl : "",
    imageName: pendingImage ? pendingImage.name : "",
  });

  saveMeals();
  form.reset();
  setDefaultDraftValues();
  clearPendingImage();
  render();
  try {
    fields.name.focus({ preventScroll: true });
  } catch {
    fields.name.focus();
  }
});

form.addEventListener("input", renderDraft);
form.addEventListener("change", renderDraft);

[fields.calories, fields.goal, fields.basal].forEach((field) => {
  field.addEventListener("change", () => normalizeNumericField(field, false));
});

[fields.protein, fields.carbs, fields.fat].forEach((field) => {
  field.addEventListener("change", () => normalizeNumericField(field));
});

adjustment.calories.addEventListener("input", applyAdjustmentToFields);
adjustment.calories.addEventListener("change", () => {
  normalizeNumericField(adjustment.calories, false);
  applyAdjustmentToFields();
});

[adjustment.protein, adjustment.carbs, adjustment.fat].forEach((field) => {
  field.addEventListener("input", applyAdjustmentToFields);
  field.addEventListener("change", () => {
    normalizeNumericField(field);
    applyAdjustmentToFields();
  });
});

goalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  normalizeNumericField(fields.goal, false);
  saveGoal();
});

fields.goal.addEventListener("input", () => {
  const previewGoal = Math.max(Math.round(readNumber(fields.goal.value)), 1);
  calorieGoal = previewGoal;
  renderTotals();
});

fields.goal.addEventListener("change", saveGoal);

fields.basal.addEventListener("input", () => {
  basalCalories = Math.max(Math.round(readNumber(fields.basal.value)), 1);
});

fields.basal.addEventListener("change", saveBasal);

fields.date.addEventListener("change", () => {
  if (fields.date.value) {
    setSelectedDate(fields.date.value);
  }
});

todayButton.addEventListener("click", () => setSelectedDate(getTodayKey()));

prevMonth.addEventListener("click", () => moveMonth(-1));
nextMonth.addEventListener("click", () => moveMonth(1));
prevYear.addEventListener("click", () => moveYear(-1));
nextYear.addEventListener("click", () => moveYear(1));

waterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  normalizeNumericField(fields.water, false);
  addWater(Math.round(readNumber(fields.water.value)));
});

document.querySelectorAll("[data-water-add]").forEach((button) => {
  button.addEventListener("click", () => {
    addWater(Math.round(readNumber(button.dataset.waterAdd)));
  });
});

fields.water.addEventListener("change", () => normalizeNumericField(fields.water, false));

waterReset.addEventListener("click", () => {
  delete hydration[selectedDate];
  saveHydration();
  renderWater();
  renderCalendar();
});

activityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  normalizeNumericField(fields.steps, false);
  setActivity(readNumber(fields.steps.value));
});

document.querySelectorAll("[data-steps-add]").forEach((button) => {
  button.addEventListener("click", () => {
    addSteps(Math.round(readNumber(button.dataset.stepsAdd)));
  });
});

fields.steps.addEventListener("change", () => normalizeNumericField(fields.steps, false));

activityReset.addEventListener("click", () => {
  delete activity[selectedDate];
  saveActivity();
  fields.steps.value = "8000";
  renderActivity();
  renderCalendar();
});

resetDay.addEventListener("click", () => {
  meals = meals.filter((meal) => meal.dateKey !== selectedDate);
  delete hydration[selectedDate];
  delete activity[selectedDate];
  saveMeals();
  saveHydration();
  saveActivity();
  render();
});

function setupScreenshotInput() {
  screenshotPanel.addEventListener("click", (event) => {
    if (event.target === fields.image || event.target === clearImage) {
      return;
    }
    fields.image.click();
  });

  screenshotPanel.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fields.image.click();
    }
  });

  fields.image.addEventListener("change", () => {
    const file = fields.image.files && fields.image.files[0];
    if (file) {
      setPendingImage(file);
    }
  });

  clearImage.addEventListener("click", (event) => {
    event.stopPropagation();
    clearPendingImage();
  });

  document.addEventListener("paste", (event) => {
    const items = Array.from(event.clipboardData ? event.clipboardData.items : []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) {
      return;
    }
    const file = imageItem.getAsFile();
    if (file) {
      setPendingImage(file);
      flashSaveStatus("Photo pasted / 写真を貼り付けました");
    }
  });
}

function setPendingImage(file) {
  if (!file.type.startsWith("image/")) {
    flashSaveStatus("Choose an image file / 画像ファイルを選んでください");
    return;
  }

  compressImage(file)
    .then((dataUrl) => {
      pendingImage = { dataUrl, name: file.name || "Meal photo / 食事写真" };
      screenshotImage.src = dataUrl;
      screenshotPreview.hidden = false;
      clearImage.hidden = false;
      screenshotPanel.classList.add("has-image");
      estimatePanel.classList.add("has-image");
      estimatePanel.classList.remove("is-applied");
      estimateStatus.textContent = "Choose the closest portion size after checking the photo. 写真を見て近い量を選んでください。";
      screenshotStatus.textContent = "Photo added. It will be saved with this meal. 写真を追加しました。保存時に一緒に記録されます。";
    })
    .catch(() => {
      flashSaveStatus("Could not read image / 画像を読み込めませんでした");
    });
}

function clearPendingImage() {
  pendingImage = null;
  fields.image.value = "";
  screenshotImage.removeAttribute("src");
  screenshotPreview.hidden = true;
  clearImage.hidden = true;
  screenshotPanel.classList.remove("has-image");
  estimatePanel.classList.remove("has-image", "is-applied");
  estimateStatus.textContent = "Pick the closest portion size after checking the photo. 写真を見て近い量を選んでください。";
  screenshotStatus.textContent = "Paste a photo here, or choose one from your device. 写真を貼り付けるか選択できます。";
}

function setupEstimateButtons() {
  document.querySelectorAll("[data-estimate-calories]").forEach((button) => {
    button.addEventListener("click", () => {
      setEstimateBase({
        calories: button.dataset.estimateCalories || "0",
        protein: button.dataset.estimateProtein || "0",
        carbs: button.dataset.estimateCarbs || "0",
        fat: button.dataset.estimateFat || "0",
      });
      resetAdjustmentInputs();
      applyAdjustmentToFields();
      estimatePanel.classList.add("is-applied");
      estimateStatus.textContent = `${button.dataset.estimateLabel} applied to the inputs. 概算を入力欄に反映しました。`;
      adjustmentStatus.textContent = "Base values are reflected below. Enter a plus or minus diff to adjust. 下の差分にプラス・マイナスを入れると調整できます。";
      flashSaveStatus("Estimate applied / 概算を反映");
    });
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", reject);
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("error", reject);
      image.addEventListener("load", () => {
        const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      });
      image.src = reader.result;
    });
    reader.readAsDataURL(file);
  });
}

function openMealDetail(meal) {
  detailContent.innerHTML = "";

  const title = document.createElement("h2");
  const data = document.createElement("dl");
  title.textContent = meal.name;

  [
    ["Date / 日付", formatDateLabel(meal.dateKey)],
    ["Type / 区分", meal.type],
    ["Calories / カロリー", `${Math.round(meal.calories)} kcal`],
    ["Protein / たんぱく質", `${formatMacro(meal.protein)} g`],
    ["Carbs / 炭水化物", `${formatMacro(meal.carbs)} g`],
    ["Fat / 脂質", `${formatMacro(meal.fat)} g`],
  ].forEach(([label, value]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    data.appendChild(dt);
    data.appendChild(dd);
  });

  detailContent.appendChild(title);
  detailContent.appendChild(data);

  if (meal.imageData) {
    const image = document.createElement("img");
    image.className = "detail-image";
    image.src = meal.imageData;
    image.alt = `${meal.name} meal photo / ${meal.name}の食事写真`;
    detailContent.appendChild(image);
  }

  if (typeof detailDialog.showModal === "function") {
    detailDialog.showModal();
  } else {
    detailDialog.setAttribute("open", "");
  }
}

function setupInstallHint() {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = isStandaloneMode();
  const dismissed = localStorage.getItem("diet-tracker-pro-install-dismissed") === "true";

  function renderInstallHint() {
    const hasPrompt = Boolean(deferredInstallPrompt);
    const nextStandalone = isStandaloneMode();
    document.body.classList.toggle("is-standalone", nextStandalone);

    if (nextStandalone || dismissed || (!isIos && !hasPrompt)) {
      installCard.hidden = true;
      return;
    }

    installCard.hidden = false;
    installAction.hidden = !hasPrompt;

    if (isIos) {
      installTitle.textContent = "Install on iPhone / iPhoneに追加";
      installMessage.textContent = "Open this in Safari, tap Share, then Add to Home Screen. Safariで開いて共有からホーム画面に追加してください。";
      return;
    }

    if (hasPrompt) {
      installTitle.textContent = "Install Web App / Webアプリ化";
      installMessage.textContent = "Install this tracker for full-screen launch and offline access. フルスクリーン起動とオフライン利用のためインストールできます。";
      return;
    }

    installTitle.textContent = "Use on iPhone / iPhoneで使う";
    installMessage.textContent = "Open the hosted URL in Safari on your iPhone, then add it to the Home Screen. iPhoneのSafariでURLを開いてホーム画面に追加してください。";
  }

  renderInstallHint();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    renderInstallHint();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installCard.hidden = true;
    applyShellClasses();
  });

  if (installAction) {
    installAction.addEventListener("click", async () => {
      if (!deferredInstallPrompt) {
        return;
      }
      deferredInstallPrompt.prompt();
      try {
        await deferredInstallPrompt.userChoice;
      } catch {
        // The user can dismiss the prompt without breaking the app.
      }
      deferredInstallPrompt = null;
      renderInstallHint();
    });
  }

  dismissInstall.addEventListener("click", () => {
    localStorage.setItem("diet-tracker-pro-install-dismissed", "true");
    installCard.hidden = true;
  });
}
