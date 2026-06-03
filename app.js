import defaultConfig from "./config.example.js";

const STORAGE_KEYS = {
  selectedWorkspace: "workspace-dashboard:selected",
  importedConfig: "workspace-dashboard:imported-config",
  uiOverrides: "workspace-dashboard:ui-overrides",
  theme: "workspace-dashboard:theme",
  layout: "workspace-dashboard:layout",
  calendarView: "workspace-dashboard:calendar-view",
  calendarAnchor: "workspace-dashboard:calendar-anchor",
  scheduleDay: "workspace-dashboard:schedule-day",
  captureMode: "workspace-dashboard:capture-mode",
  captureFollow: "workspace-dashboard:capture-follow",
  captureFollowSide: "workspace-dashboard:capture-follow-side",
  captureAssistant: "workspace-dashboard:capture-assistant",
  motivationVisible: "workspace-dashboard:motivation-visible",
  homeMenuDay: "workspace-dashboard:home-menu-day",
  calendarConnection: "workspace-dashboard:calendar-connection",
  calendarCache: "workspace-dashboard:calendar-cache",
  hiddenCalendarEvents: "workspace-dashboard:hidden-calendar-events",
  calendarTodos: "workspace-dashboard:calendar-todos",
  backendApiBaseUrl: "workspace-dashboard:backend-api-base-url",
  backendApiToken: "workspace-dashboard:backend-api-token",
  cognitoSettings: "workspace-dashboard:cognito-settings",
  cognitoSession: "workspace-dashboard:cognito-session",
  cognitoTransaction: "workspace-dashboard:cognito-transaction"
};

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOME_MENU_SLOTS = ["Breakfast", "Lunch", "Dinner"];
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const GOOGLE_GIS_SRC = "https://accounts.google.com/gsi/client";
const HOME_CALENDAR_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const MOTIVATION_QUOTES = [
  "Keep the next step small and visible.",
  "You do not need perfect, you need moving.",
  "One useful rep today changes the shape of tomorrow.",
  "Make the next thing obvious, then do that.",
  "Small progress still counts when it is consistent.",
  "Clear work builds confidence faster than worry does.",
  "You are allowed to grow in public, one step at a time.",
  "Start before the doubt gets a vote.",
  "Progress is quieter than fear, but it lasts longer.",
  "You can build this one careful piece at a time."
];
const DEFAULT_LAYOUT = {
  order: ["hero", "capture", "schedule", "calendar", "kanban", "spotlight"],
  spans: {
    hero: 12,
    capture: 6,
    schedule: 6,
    calendar: 8,
    kanban: 8,
    spotlight: 8,
  }
};
const LAYOUT_SPANS = [4, 6, 8, 12];
const LEGACY_DEFAULT_LAYOUT_ORDER = ["hero", "schedule", "calendar", "kanban", "spotlight", "goals", "capture"];

let localConfig = await loadLocalConfig();
let runtimeConfig = loadRuntimeConfig();
let importedConfig = readStoredJson(STORAGE_KEYS.importedConfig, {});
let uiOverrides = readStoredJson(STORAGE_KEYS.uiOverrides, {});
let config = mergeDashboardConfig(defaultConfig, importedConfig, runtimeConfig, localConfig, uiOverrides);
let layoutState = normalizeLayoutState(readStoredJson(STORAGE_KEYS.layout, null));

const appState = {
  workspaceId: localStorage.getItem(STORAGE_KEYS.selectedWorkspace) || config.defaultWorkspace || config.workspaces[0].id,
  flashcardIndex: 0,
  answerVisible: false,
  drawerMode: "closed",
  editorWorkspaceId: config.defaultWorkspace || config.workspaces[0].id,
  editingTask: null,
  editingSchedule: null,
  editingEvent: null,
  editingStory: null,
  editingFlashcard: null,
  widgetMoveSourceId: null,
  homeCalendarSyncInFlight: false,
  theme: getInitialTheme(),
  motivationVisible: getInitialMotivationVisibility(),
  motivationQuote: "",
  motivationQuoteRequestId: 0,
  calendarView: getStoredCalendarView(),
  calendarAnchor: getStoredCalendarAnchor(),
  scheduleDay: getStoredScheduleDay()
};

const tabsEl = document.getElementById("workspace-tabs");
const datePillEl = document.getElementById("date-pill");
const scheduleListEl = document.getElementById("schedule-list");
const scheduleRangeLabelEl = document.getElementById("schedule-range-label");
const scheduleRangeDetailEl = document.getElementById("schedule-range-detail");
const calendarGridEl = document.getElementById("calendar-grid");
const kanbanBoardEl = document.getElementById("kanban-board");
const kanbanTitleEl = document.getElementById("kanban-title");
const kanbanHintEl = document.getElementById("kanban-hint");
const spotlightEl = document.getElementById("spotlight");
const spotlightHintEl = document.getElementById("spotlight-hint");
const capturePanelEl = document.getElementById("capture-panel");
const captureWidgetEl = document.querySelector('[data-widget-id="capture"]');
const backupMenuEl = document.querySelector(".backup-menu");
const exportButtonEl = document.getElementById("export-backup");
const importButtonEl = document.getElementById("import-backup");
const backupFileEl = document.getElementById("backup-file");
const themeToggleEl = document.getElementById("theme-toggle");
const motivationToggleEl = document.getElementById("motivation-toggle");
const motivationTileEl = document.getElementById("motivation-sticky");
const layoutEl = document.querySelector ? document.querySelector(".layout") : null;
const motivationQuoteEl = document.getElementById("motivation-quote");
const settingsOpenEl = document.getElementById("settings-open");
const settingsCloseEl = document.getElementById("settings-close");
const drawerBackdropEl = document.getElementById("drawer-backdrop");
const settingsDrawerEl = document.getElementById("settings-drawer");
const calendarNewEl = document.getElementById("calendar-new");
const calendarViewWeekEl = document.getElementById("calendar-view-week");
const calendarViewMonthEl = document.getElementById("calendar-view-month");
const taskNewEl = document.getElementById("task-new");
const scheduleNewEl = document.getElementById("schedule-new");
const schedulePrevEl = document.getElementById("schedule-prev");
const scheduleNextEl = document.getElementById("schedule-next");
const flashcardNewEl = document.getElementById("flashcard-new");
const spotlightTitleEl = document.getElementById("spotlight-title");
const drawerTitleEl = document.getElementById("drawer-title");
const drawerWorkspaceSectionEl = document.getElementById("drawer-workspace-section");
const backendSyncFormEl = document.getElementById("backend-sync-form");
const backendSyncBaseUrlEl = document.getElementById("backend-sync-base-url");
const backendSyncSaveEl = document.getElementById("backend-sync-save");
const backendSyncCurrentEl = document.getElementById("backend-sync-current");
const backendSyncClearEl = document.getElementById("backend-sync-clear");
const backendSyncStatusEl = document.getElementById("backend-sync-status");
const cognitoSettingsFormEl = document.getElementById("cognito-settings-form");
const cognitoRegionEl = document.getElementById("cognito-region");
const cognitoUserPoolIdEl = document.getElementById("cognito-user-pool-id");
const cognitoClientIdEl = document.getElementById("cognito-client-id");
const cognitoHostedUiDomainEl = document.getElementById("cognito-hosted-ui-domain");
const cognitoRedirectUriEl = document.getElementById("cognito-redirect-uri");
const cognitoLogoutUriEl = document.getElementById("cognito-logout-uri");
const cognitoSaveEl = document.getElementById("cognito-save");
const cognitoLoginEl = document.getElementById("cognito-login");
const cognitoLogoutEl = document.getElementById("cognito-logout");
const cognitoStatusEl = document.getElementById("cognito-status");
const homeCalendarSectionEl = document.getElementById("home-calendar-section");
const drawerTaskSectionEl = document.getElementById("drawer-task-section");
const drawerScheduleSectionEl = document.getElementById("drawer-schedule-section");
const drawerCalendarSectionEl = document.getElementById("drawer-calendar-section");
const drawerStorySectionEl = document.getElementById("drawer-story-section");
const drawerFlashcardSectionEl = document.getElementById("drawer-flashcard-section");
const workspaceSettingsFormEl = document.getElementById("workspace-settings-form");
const workspaceSettingsWorkspaceEl = document.getElementById("workspace-settings-workspace");
const workspaceSettingsLabelEl = document.getElementById("workspace-settings-label");
const workspaceSettingsTitleEl = document.getElementById("workspace-settings-title");
const workspaceSettingsDescriptionEl = document.getElementById("workspace-settings-description");
const workspaceSettingsAccentEl = document.getElementById("workspace-settings-accent");
const workspaceSettingsAccent2El = document.getElementById("workspace-settings-accent2");
const workspaceSettingsDefaultEl = document.getElementById("workspace-settings-default");
const workspaceSettingsResetEl = document.getElementById("workspace-settings-reset");
const homeCalendarFormEl = document.getElementById("home-calendar-form");
const homeCalendarClientIdEl = document.getElementById("home-calendar-client-id");
const homeCalendarCalendarIdEl = document.getElementById("home-calendar-calendar-id");
const homeCalendarEnabledEl = document.getElementById("home-calendar-enabled");
const homeCalendarSaveEl = document.getElementById("home-calendar-save");
const homeCalendarSyncEl = document.getElementById("home-calendar-sync");
const homeCalendarDisconnectEl = document.getElementById("home-calendar-disconnect");
const homeCalendarStatusEl = document.getElementById("home-calendar-status");
const taskFormEl = document.getElementById("task-form");
const taskFormCardIdEl = document.getElementById("task-form-card-id");
const taskFormWorkspaceEl = document.getElementById("task-form-workspace");
const taskFormColumnEl = document.getElementById("task-form-column");
const taskFormTitleEl = document.getElementById("task-form-title");
const taskFormDetailEl = document.getElementById("task-form-detail");
const taskFormTagEl = document.getElementById("task-form-tag");
const taskFormSubtasksEl = document.getElementById("task-form-subtasks");
const taskFormAddSubtaskEl = document.getElementById("task-form-add-subtask");
const taskFormClearEl = document.getElementById("task-form-clear");
const taskFormDeleteEl = document.getElementById("task-form-delete");
const scheduleFormEl = document.getElementById("schedule-form");
const scheduleFormItemIdEl = document.getElementById("schedule-form-item-id");
const scheduleFormWorkspaceEl = document.getElementById("schedule-form-workspace");
const scheduleFormDayEl = document.getElementById("schedule-form-day");
const scheduleFormTimeEl = document.getElementById("schedule-form-time");
const scheduleFormTitleEl = document.getElementById("schedule-form-title");
const scheduleFormDetailEl = document.getElementById("schedule-form-detail");
const scheduleFormClearEl = document.getElementById("schedule-form-clear");
const scheduleFormDeleteEl = document.getElementById("schedule-form-delete");
const calendarFormEl = document.getElementById("calendar-form");
const calendarFormEventIndexEl = document.getElementById("calendar-form-event-index");
const calendarFormWorkspaceEl = document.getElementById("calendar-form-workspace");
const calendarFormDayEl = document.getElementById("calendar-form-day");
const calendarFormTimeEl = document.getElementById("calendar-form-time");
const calendarFormTitleEl = document.getElementById("calendar-form-title");
const calendarFormDetailEl = document.getElementById("calendar-form-detail");
const calendarFormTypeEl = document.getElementById("calendar-form-type");
const calendarFormClearEl = document.getElementById("calendar-form-clear");
const calendarFormDeleteEl = document.getElementById("calendar-form-delete");
const flashcardFormEl = document.getElementById("flashcard-form");
const flashcardFormCardIdEl = document.getElementById("flashcard-form-card-id");
const flashcardFormWorkspaceEl = document.getElementById("flashcard-form-workspace");
const flashcardFormCategoryEl = document.getElementById("flashcard-form-category");
const flashcardFormQuestionEl = document.getElementById("flashcard-form-question");
const flashcardFormAnswerEl = document.getElementById("flashcard-form-answer");
const flashcardFormClearEl = document.getElementById("flashcard-form-clear");
const flashcardFormDeleteEl = document.getElementById("flashcard-form-delete");
const storyFormEl = document.getElementById("story-form");
const storyFormCardIdEl = document.getElementById("story-form-card-id");
const storyFormSubjectEl = document.getElementById("story-form-subject");
const storyFormParagraphEl = document.getElementById("story-form-paragraph");
const storyFormClearEl = document.getElementById("story-form-clear");
const storyFormDeleteEl = document.getElementById("story-form-delete");
const calendarPrevEl = document.getElementById("calendar-prev");
const calendarNextEl = document.getElementById("calendar-next");
const calendarRangeLabelEl = document.getElementById("calendar-range-label");
const calendarRangeDetailEl = document.getElementById("calendar-range-detail");

let currentDrag = null;

bootstrap();

function bootstrap() {
  applyThemeMode(appState.theme);
  renderDate();
  renderMotivation();
  renderTabs();
  populateEditorSelects();
  applyWidgetLayout();
  wireDrawerControls();
  wireThemeControls();
  wireCalendarControls();
  wireLayoutControls();
  wireBackupControls();
  wireCognitoAuthControls();
  wireBackendSyncControls();
  renderWorkspace(getWorkspace(appState.workspaceId));
  refreshMotivationQuote(getWorkspace(appState.workspaceId));
  handleCognitoRedirect().catch((error) => {
    console.warn("Unable to complete Cognito login.", error);
  });
  hydrateBackendAccountState().catch((error) => {
    console.warn("Unable to hydrate backend state.", error);
  });
}

function renderDate() {
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date());

  datePillEl.textContent = today;
}

function wireThemeControls() {
  themeToggleEl.addEventListener("click", toggleTheme);
  if (motivationToggleEl) {
    motivationToggleEl.addEventListener("click", toggleMotivationVisibility);
  }
  updateThemeToggleLabel();
  updateMotivationToggleLabel();
}

function wireCalendarControls() {
  calendarViewWeekEl.addEventListener("click", () => setCalendarView("week"));
  calendarViewMonthEl.addEventListener("click", () => setCalendarView("month"));
  calendarPrevEl.addEventListener("click", () => shiftCalendar(-1));
  calendarNextEl.addEventListener("click", () => shiftCalendar(1));
  schedulePrevEl.addEventListener("click", () => shiftScheduleDay(-1));
  scheduleNextEl.addEventListener("click", () => shiftScheduleDay(1));
}

function wireLayoutControls() {
  if (!layoutEl) {
    return;
  }

  layoutEl.addEventListener("dragstart", handleWidgetDragStart);
  layoutEl.addEventListener("dragover", handleWidgetDragOver);
  layoutEl.addEventListener("dragleave", handleWidgetDragLeave);
  layoutEl.addEventListener("drop", handleWidgetDrop);
  layoutEl.addEventListener("dragend", handleWidgetDragEnd);
  layoutEl.addEventListener("click", handleWidgetToolbarClick);
}

function populateEditorSelects() {
  const workspaceOptions = config.workspaces
    .map((workspace) => `<option value="${escapeHtml(workspace.id)}">${escapeHtml(workspace.label)}</option>`)
    .join("");

  const dayOptions = DAY_ORDER.map((day) => `<option value="${escapeHtml(day)}">${escapeHtml(day)}</option>`).join("");

  for (const selectEl of [workspaceSettingsWorkspaceEl, workspaceSettingsDefaultEl, taskFormWorkspaceEl, calendarFormWorkspaceEl, scheduleFormWorkspaceEl]) {
    selectEl.innerHTML = workspaceOptions;
  }
  flashcardFormWorkspaceEl.innerHTML = workspaceOptions;

  calendarFormDayEl.innerHTML = dayOptions;
  scheduleFormDayEl.innerHTML = dayOptions;
  renderColumnOptions(getWorkspace(appState.workspaceId).id);
  renderFlashcardOptions(getWorkspace(appState.workspaceId).id);
}

function renderColumnOptions(workspaceId) {
  const workspace = getWorkspace(workspaceId);
  taskFormColumnEl.innerHTML = workspace.kanban
    .map((column) => `<option value="${escapeHtml(column.id)}">${escapeHtml(column.title)}</option>`)
    .join("");
}

function wireDrawerControls() {
  settingsOpenEl.addEventListener("click", () => openDrawer("workspace"));
  settingsCloseEl.addEventListener("click", closeDrawer);
  drawerBackdropEl.addEventListener("click", closeDrawer);
  calendarNewEl.addEventListener("click", () => openCalendarEditor("", appState.workspaceId));
  taskNewEl.addEventListener("click", () => {
    if (appState.workspaceId === "home") {
      addHomeListItem(appState.workspaceId, "todos", "Add a home to-do");
      return;
    }
    openTaskEditor("", appState.workspaceId);
  });
  scheduleNewEl.addEventListener("click", () => openScheduleEditor("", appState.workspaceId, appState.scheduleDay));
  flashcardNewEl.addEventListener("click", () => {
    if (appState.workspaceId === "work") {
      openStoryEditor("", appState.workspaceId);
      return;
    }
    openFlashcardEditor("", appState.workspaceId);
  });
  workspaceSettingsFormEl.addEventListener("submit", handleWorkspaceSettingsSubmit);
  workspaceSettingsResetEl.addEventListener("click", resetWorkspaceOverrides);
  homeCalendarFormEl.addEventListener("submit", handleHomeCalendarSubmit);
  homeCalendarSyncEl.addEventListener("click", () => {
    handleHomeCalendarSyncClick().catch((error) => {
      console.warn("Home calendar sync click failed.", error);
    });
  });
  homeCalendarDisconnectEl.addEventListener("click", disconnectHomeGoogleCalendar);
  taskFormEl.addEventListener("submit", handleTaskSubmit);
  taskFormClearEl.addEventListener("click", () => openTaskEditor("", taskFormWorkspaceEl.value || appState.workspaceId));
  taskFormDeleteEl.addEventListener("click", deleteTaskFromEditor);
  taskFormAddSubtaskEl.addEventListener("click", addTaskSubtaskRow);
  taskFormSubtasksEl.addEventListener("click", (event) => {
    const deleteButton = event.target.closest('[data-action="remove-subtask"]');
    if (!deleteButton) {
      return;
    }

    removeTaskSubtaskRow(deleteButton.closest("[data-subtask-row]"));
  });
  scheduleFormEl.addEventListener("submit", handleScheduleSubmit);
  scheduleFormClearEl.addEventListener("click", () => openScheduleEditor("", scheduleFormWorkspaceEl.value || appState.workspaceId, scheduleFormDayEl.value || appState.scheduleDay));
  scheduleFormDeleteEl.addEventListener("click", deleteScheduleFromEditor);
  calendarFormEl.addEventListener("submit", handleCalendarSubmit);
  calendarFormClearEl.addEventListener("click", () => openCalendarEditor("", calendarFormWorkspaceEl.value || appState.workspaceId));
  calendarFormDeleteEl.addEventListener("click", deleteCalendarFromEditor);
  storyFormEl.addEventListener("submit", handleStorySubmit);
  storyFormClearEl.addEventListener("click", () => openStoryEditor("", appState.workspaceId));
  storyFormDeleteEl.addEventListener("click", deleteStoryFromEditor);
  flashcardFormEl.addEventListener("submit", handleFlashcardSubmit);
  flashcardFormClearEl.addEventListener("click", () => openFlashcardEditor("", flashcardFormWorkspaceEl.value || appState.workspaceId));
  flashcardFormDeleteEl.addEventListener("click", deleteFlashcardFromEditor);

  workspaceSettingsWorkspaceEl.addEventListener("change", () => {
    fillWorkspaceSettingsForm(workspaceSettingsWorkspaceEl.value);
  });

  taskFormWorkspaceEl.addEventListener("change", () => {
    renderColumnOptions(taskFormWorkspaceEl.value);
    taskFormCardIdEl.value = "";
    taskFormDeleteEl.disabled = true;
    fillTaskForm(taskFormWorkspaceEl.value, "");
  });

  scheduleFormWorkspaceEl.addEventListener("change", () => {
    scheduleFormItemIdEl.value = "";
    scheduleFormDeleteEl.disabled = true;
    fillScheduleForm(scheduleFormWorkspaceEl.value, "");
  });

  calendarFormWorkspaceEl.addEventListener("change", () => {
    calendarFormEventIndexEl.value = "";
    calendarFormDeleteEl.disabled = true;
    fillCalendarForm(calendarFormWorkspaceEl.value, "");
  });

  flashcardFormWorkspaceEl.addEventListener("change", () => {
    flashcardFormCardIdEl.value = "";
    flashcardFormDeleteEl.disabled = true;
    fillFlashcardForm(flashcardFormWorkspaceEl.value, "");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !settingsDrawerEl.classList.contains("hidden")) {
      closeDrawer();
    }
  });
}

function wireBackupControls() {
  exportButtonEl.addEventListener("click", () => {
    exportBackup();
    if (backupMenuEl) {
      backupMenuEl.open = false;
    }
  });
  importButtonEl.addEventListener("click", () => {
    backupFileEl.click();
    if (backupMenuEl) {
      backupMenuEl.open = false;
    }
  });
  backupFileEl.addEventListener("change", handleImportFile);
}

function wireBackendSyncControls() {
  if (!backendSyncFormEl) {
    return;
  }

  backendSyncFormEl.addEventListener("submit", handleBackendSyncSubmit);
  backendSyncCurrentEl?.addEventListener("click", handleBackendSyncCurrentClick);
  backendSyncClearEl?.addEventListener("click", handleBackendSyncClearClick);
  fillBackendSyncForm();
}

function wireCognitoAuthControls() {
  if (!cognitoSettingsFormEl) {
    return;
  }

  cognitoSettingsFormEl.addEventListener("submit", handleCognitoSettingsSubmit);
  cognitoLoginEl?.addEventListener("click", handleCognitoLoginClick);
  cognitoLogoutEl?.addEventListener("click", handleCognitoLogoutClick);
  fillCognitoSettingsForm();
}

function renderTabs() {
  tabsEl.innerHTML = "";
  const activeWorkspaceId = appState.workspaceId;

  for (const item of config.workspaces) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "workspace-tab";
    button.textContent = item.label;
    button.setAttribute("aria-pressed", String(item.id === activeWorkspaceId));
    button.addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEYS.selectedWorkspace, item.id);
      appState.workspaceId = item.id;
      appState.flashcardIndex = 0;
      appState.answerVisible = false;
      renderTabs();
      renderWorkspace(getWorkspace(item.id));
    });
    tabsEl.appendChild(button);
  }
}

function renderWorkspace(activeWorkspace) {
  applyTheme(activeWorkspace);
  const mergedCalendarEvents = getMergedCalendarEvents(activeWorkspace);
  renderSchedule(activeWorkspace.schedule, mergedCalendarEvents);
  renderCalendar(mergedCalendarEvents);
  renderKanban(activeWorkspace);
  renderStudyWidget(activeWorkspace);
  const spotlightPanel = spotlightEl?.closest(".widget-panel");
  if (spotlightPanel) {
    spotlightPanel.classList.toggle("hidden", activeWorkspace.id === "home");
  }
  maybeSyncHomeCalendar(activeWorkspace);
  renderCapture(activeWorkspace);
  renderColumnOptions(activeWorkspace.id);
  renderFlashcardOptions(activeWorkspace.id);
  refreshMotivationQuote(activeWorkspace);
  applyWidgetLayout();
  applyCaptureFollowLayout(activeWorkspace.id);
  syncDrawerSelections();
}

function renderSchedule(schedule, calendarEvents = []) {
  const workspace = getWorkspace(appState.workspaceId);
  const scheduleEntries = getScheduleState(workspace);
  const selectedDay = appState.scheduleDay;
  const selectedDate = getSelectedScheduleDate();
  const selectedSchedule = scheduleEntries
    .filter((item) => item.day === selectedDay)
    .map((item) => ({
      id: item.id,
      source: "schedule",
      time: item.time,
      title: item.title,
      detail: item.detail,
      day: item.day,
      payload: item
    }));
  const externalCalendarEvents = getEventsForDate(calendarEvents || [], selectedDate).map(({ event, index }) => ({
    id: `calendar-${index}`,
    source: event.source || "calendar",
    time: getCalendarEventTimeLabel(event),
    title: event.title,
    detail: event.detail,
    day: event.day,
    payload: { event, index }
  }));
  const timedExternalCalendarEvents = externalCalendarEvents.filter((item) => hasCalendarEventTime(item.payload.event));
  const calendarTodoItems = materializeCalendarTodos(workspace.id, externalCalendarEvents.filter((item) => !hasCalendarEventTime(item.payload.event)), selectedDate);
  const timeline = [...selectedSchedule, ...timedExternalCalendarEvents].sort((left, right) => {
    const timeCompare = String(left.time || "").localeCompare(String(right.time || ""));
    if (timeCompare !== 0) {
      return timeCompare;
    }
    if (left.source === right.source) {
      return String(left.title || "").localeCompare(String(right.title || ""));
    }
    return left.source === "calendar" || left.source === "google" ? -1 : 1;
  });

  if (scheduleRangeLabelEl) {
    scheduleRangeLabelEl.textContent = `${selectedDay}, ${formatLongDate(selectedDate)}`;
  }
  if (scheduleRangeDetailEl) {
    const todoCount = calendarTodoItems.length;
    scheduleRangeDetailEl.textContent = todoCount
      ? `${timeline.length} timed items and ${todoCount} to-dos for ${formatLongDate(selectedDate)}`
      : `${timeline.length} items for ${formatLongDate(selectedDate)} ordered by time`;
  }

  const emptyTimelineLabel = calendarTodoItems.length
    ? `No timed items for ${escapeHtml(selectedDay)}.`
    : `No items for ${escapeHtml(selectedDay)}.`;

  scheduleListEl.innerHTML = `
    <div class="schedule-list">
      ${
        timeline.length
          ? timeline
              .map(
                (item) => `
                  <article
                    class="stack-item ${item.source === "calendar" || item.source === "google" ? "stack-item--calendar" : "stack-item--schedule"}"
                    data-schedule-source="${escapeHtml(item.source)}"
                    data-schedule-item-id="${item.source === "schedule" ? escapeHtml(item.id) : ""}"
                    data-calendar-event-index="${item.source === "calendar" || item.source === "google" ? escapeHtml(String(item.payload.index)) : ""}"
                  >
                    <div class="stack-topline">
                      <span class="time-chip">${escapeHtml(formatDisplayTimeLabel(item.time) || "To-do")}</span>
                      <span class="tag-chip tag-chip--${escapeHtml(item.source === "calendar" || item.source === "google" ? calendarEventClass(item.payload.event.source || item.payload.event.type) : "schedule")}">${escapeHtml(item.source === "calendar" || item.source === "google" ? item.payload.event.sourceLabel || item.payload.event.type || "calendar" : "schedule")}</span>
                    </div>
                    <strong class="stack-title">${escapeHtml(item.title)}</strong>
                    <p class="stack-detail">${escapeHtml(item.detail)}</p>
                    <div class="calendar-event-actions">
                      ${
                        item.source === "schedule"
                          ? `<button class="mini-button" type="button" data-action="edit-timeline-item">Edit</button><button class="mini-button button-danger" type="button" data-action="delete-timeline-item">Delete</button>`
                          : item.source === "google"
                            ? `<button class="mini-button" type="button" data-action="edit-timeline-item">Open source</button><button class="mini-button button-danger" type="button" data-action="hide-timeline-item">Hide from dashboard</button>`
                            : `<button class="mini-button" type="button" data-action="edit-timeline-item">Edit</button><button class="mini-button button-danger" type="button" data-action="delete-timeline-item">Delete</button><button class="mini-button button-danger" type="button" data-action="hide-timeline-item">Hide from dashboard</button>`
                      }
                    </div>
                  </article>
                `
              )
              .join("")
          : `<div class="calendar-empty">${emptyTimelineLabel}</div>`
      }
    </div>
    ${
      calendarTodoItems.length
        ? `
          <div class="schedule-group">
            <div class="schedule-group-title">To-do</div>
            <div class="schedule-list schedule-list--todo">
              ${calendarTodoItems
                .map(
                  (todoItem) => `
                    <article
                      class="stack-item stack-item--calendar stack-item--todo ${todoItem.completed ? "is-complete" : ""}"
                      data-schedule-source="calendar-todo"
                      data-calendar-todo-id="${escapeHtml(todoItem.id)}"
                    >
                      <div class="stack-topline">
                        <span class="time-chip time-chip--todo">${todoItem.completed ? "Done" : "To-do"}</span>
                        <span class="tag-chip tag-chip--${escapeHtml(calendarEventClass(todoItem.source))}">${escapeHtml(todoItem.sourceLabel || "calendar")}</span>
                      </div>
                      <strong class="stack-title">${escapeHtml(todoItem.title)}</strong>
                      <p class="stack-detail">${escapeHtml(todoItem.detail)}</p>
                      <div class="calendar-event-actions">
                        <button class="mini-button" type="button" data-action="toggle-calendar-todo">${todoItem.completed ? "Undo" : "Check off"}</button>
                        ${
                          todoItem.source === "google"
                            ? `<button class="mini-button" type="button" data-action="open-calendar-todo-source">Open source</button>`
                            : ""
                        }
                        <button class="mini-button button-danger" type="button" data-action="delete-calendar-todo">Delete</button>
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>
          </div>
        `
        : ""
    }
  `;

  scheduleListEl.onclick = (event) => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
      return;
    }

    const itemCard = actionButton.closest("[data-schedule-source]");
    if (!itemCard) {
      return;
    }
    const source = itemCard.dataset.scheduleSource;

    switch (actionButton.dataset.action) {
      case "edit-timeline-item":
        if (source === "calendar") {
          const eventIndex = Number.parseInt(itemCard.dataset.calendarEventIndex || "", 10);
          if (Number.isInteger(eventIndex)) {
            openCalendarEditor(eventIndex, workspace.id);
          }
        } else if (source === "google") {
          const eventIndex = Number.parseInt(itemCard.dataset.calendarEventIndex || "", 10);
          if (Number.isInteger(eventIndex)) {
            openExternalCalendarEvent(workspace.id, eventIndex);
          }
        } else if (source === "schedule") {
          openScheduleEditor(itemCard.dataset.scheduleItemId, workspace.id);
        }
        break;
      case "delete-timeline-item":
        if (source === "calendar") {
          const eventIndex = Number.parseInt(itemCard.dataset.calendarEventIndex || "", 10);
          if (Number.isInteger(eventIndex)) {
            deleteCalendarEventByIndex(workspace.id, eventIndex);
          }
        } else if (source === "google") {
          window.alert("Google Calendar events are read-only here. Use Google Calendar to edit or delete them.");
        } else if (source === "schedule") {
          deleteScheduleItem(workspace.id, itemCard.dataset.scheduleItemId);
        }
        break;
      case "hide-timeline-item":
        if (source === "calendar" || source === "google") {
          const eventIndex = Number.parseInt(itemCard.dataset.calendarEventIndex || "", 10);
          const mergedEvents = getMergedCalendarEvents(workspace);
          const event = Number.isInteger(eventIndex) ? mergedEvents[eventIndex] : null;
          if (event) {
            hideCalendarEventFromDashboard(workspace.id, getCalendarEventHideKey(event));
          }
        }
        break;
      case "toggle-calendar-todo":
        if (source === "calendar-todo") {
          toggleCalendarTodoItem(workspace.id, itemCard.dataset.calendarTodoId);
        }
        break;
      case "delete-calendar-todo":
        if (source === "calendar-todo") {
          deleteCalendarTodoItem(workspace.id, itemCard.dataset.calendarTodoId);
        }
        break;
      case "open-calendar-todo-source":
        if (source === "calendar-todo") {
          const todoItem = getCalendarTodoItem(workspace.id, itemCard.dataset.calendarTodoId);
          if (todoItem?.source === "google" && todoItem.htmlLink) {
            window.open(todoItem.htmlLink, "_blank", "noopener,noreferrer");
          } else {
            window.alert("This to-do does not have an external source link.");
          }
        }
        break;
      default:
        break;
    }
  };
}

function renderMotivation() {
  if (!motivationQuoteEl) {
    return;
  }

  motivationQuoteEl.textContent = appState.motivationQuote || "";
  if (motivationTileEl) {
    motivationTileEl.classList.toggle("is-hidden", !appState.motivationVisible);
  }
  updateMotivationToggleLabel();
}

async function refreshMotivationQuote(workspace) {
  const requestId = appState.motivationQuoteRequestId + 1;
  appState.motivationQuoteRequestId = requestId;
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const nextQuote = await resolveAIText({
    mode: "motivation",
    workspace: normalizedWorkspace
  });
  if (requestId !== appState.motivationQuoteRequestId) {
    return;
  }

  appState.motivationQuote = nextQuote;
  renderMotivation();
}

async function resolveAIText({ mode, workspace, prompt = "", messages = [] }) {
  const endpoint = getAIEndpoint();
  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildAIRequest({ mode, workspace, prompt, messages }))
      });

      if (response.ok) {
        const payload = await response.json().catch(() => null);
        const text = extractAIText(payload, mode);
        if (text) {
          return text;
        }
      }
    } catch (error) {
      console.warn("AI endpoint failed, using fallback.", error);
    }
  }

  return mode === "motivation"
    ? generateLocalMotivationQuote(workspace)
    : generateLocalAssistantReply(workspace, prompt);
}

function getAIEndpoint() {
  const configured = String(config.aiEndpoint || config.motivationQuoteEndpoint || "").trim();
  return configured || "";
}

function buildAIRequest({ mode, workspace, prompt, messages }) {
  const summary = getWorkspaceAssistantSummary(workspace);
  return {
    mode,
    workspace: {
      id: workspace.id,
      label: workspace.label,
      title: workspace.title || "",
      description: workspace.description || ""
    },
    summary: {
      dayLabel: summary.dayLabel,
      nextAction: summary.nextAction,
      tasksSummary: summary.tasksSummary,
      scheduleSummary: summary.scheduleSummary,
      studySummary: summary.studySummary,
      storySummary: summary.storySummary,
      homeSummary: summary.homeSummary
    },
    prompt: String(prompt || ""),
    messages: Array.isArray(messages) ? messages.slice(-8) : [],
    style: mode === "motivation"
      ? "Short motivational quote, one sentence, practical and encouraging, no title, no markdown."
      : "Reply concisely and helpfully using the workspace context."
  };
}

function extractAIText(payload, mode) {
  if (!payload) {
    return "";
  }

  if (mode === "motivation" && typeof payload.quote === "string" && payload.quote.trim()) {
    return payload.quote.trim();
  }

  if (typeof payload.text === "string" && payload.text.trim()) {
    return payload.text.trim();
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (Array.isArray(payload.output)) {
    const text = payload.output
      .map((item) => item?.content)
      .flat()
      .map((content) => content?.text || content?.output_text || "")
      .filter(Boolean)
      .join(" ")
      .trim();
    if (text) {
      return text;
    }
  }

  return "";
}

function generateLocalMotivationQuote(workspace) {
  const index = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
  return MOTIVATION_QUOTES[index] || "Keep the next step small and visible.";
}

function generateLocalAssistantReply(workspace, prompt) {
  const normalizedPrompt = String(prompt || "").toLowerCase();
  const summary = getWorkspaceAssistantSummary(workspace);
  const nextAction = summary.nextAction || "No obvious next action yet.";

  if (normalizedPrompt.includes("summarize") || normalizedPrompt.includes("summary")) {
    return `${summary.dayLabel}. ${summary.tasksSummary} ${summary.scheduleSummary}`;
  }

  if (normalizedPrompt.includes("next") || normalizedPrompt.includes("what should i do")) {
    return `Your next action is ${nextAction} ${summary.scheduleSummary}`;
  }

  if (normalizedPrompt.includes("study")) {
    return summary.studySummary;
  }

  if (normalizedPrompt.includes("work story") || normalizedPrompt.includes("story")) {
    return summary.storySummary;
  }

  if (normalizedPrompt.includes("home") || normalizedPrompt.includes("menu") || normalizedPrompt.includes("grocery")) {
    return summary.homeSummary;
  }

  if (normalizedPrompt.includes("schedule")) {
    return summary.scheduleSummary;
  }

  if (normalizedPrompt.includes("task") || normalizedPrompt.includes("todo")) {
    return summary.tasksSummary;
  }

  return `${summary.dayLabel}. ${nextAction} I can also summarize tasks, schedule, study prompts, or work stories if you want.`;
}

async function sendAssistantMessage(workspaceId, prompt) {
  const input = String(prompt || "").trim();
  if (!input) {
    return;
  }

  const workspace = getWorkspace(workspaceId);
  const assistantState = getStoredCaptureAssistant(workspaceId);
  assistantState.messages.push({
    role: "user",
    content: input,
    createdAt: new Date().toISOString()
  });
  saveCaptureAssistant(workspaceId, assistantState);
  renderWorkspace(getWorkspace(appState.workspaceId));

  const reply = await resolveAIText({
    mode: "assistant",
    workspace,
    prompt: input,
    messages: assistantState.messages
  });

  const nextState = getStoredCaptureAssistant(workspaceId);
  nextState.messages.push({
    role: "assistant",
    content: reply,
    createdAt: new Date().toISOString()
  });
  saveCaptureAssistant(workspaceId, nextState);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function renderCalendar(events) {
  const anchor = new Date(appState.calendarAnchor);
  const isWeekView = appState.calendarView === "week";
  const renderData = isWeekView ? buildWeekView(events, anchor) : buildMonthView(events, anchor);

  if (calendarViewWeekEl) {
    calendarViewWeekEl.setAttribute("aria-pressed", String(isWeekView));
  }
  if (calendarViewMonthEl) {
    calendarViewMonthEl.setAttribute("aria-pressed", String(!isWeekView));
  }

  calendarRangeLabelEl.textContent = renderData.label;
  calendarRangeDetailEl.textContent = renderData.detail;
  calendarGridEl.classList.toggle("calendar-grid--week", isWeekView);
  calendarGridEl.classList.toggle("calendar-grid--month", !isWeekView);
  calendarGridEl.innerHTML = renderData.html;

  calendarGridEl.onclick = (event) => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
      return;
    }

    const card = actionButton.closest(".calendar-event");
    const day = actionButton.closest(".calendar-day");
    const eventIndex = Number.parseInt(card?.dataset.eventIndex || "", 10);
    const dayLabel = day?.dataset.day || DAY_ORDER[0];

    switch (actionButton.dataset.action) {
      case "edit-calendar":
        if (Number.isInteger(eventIndex)) {
          openCalendarEditor(eventIndex, appState.workspaceId);
        }
        break;
      case "open-source-calendar":
        if (card?.dataset.eventSource === "google") {
          openExternalCalendarEvent(appState.workspaceId, eventIndex);
        }
        break;
      case "delete-calendar":
        if (Number.isInteger(eventIndex)) {
          deleteCalendarEventByIndex(appState.workspaceId, eventIndex);
        }
        break;
      case "hide-calendar-event":
        if (card) {
          const mergedEvents = getMergedCalendarEvents(getWorkspace(appState.workspaceId));
          const event = mergedEvents[eventIndex];
          if (event) {
            hideCalendarEventFromDashboard(appState.workspaceId, getCalendarEventHideKey(event));
          }
        }
        break;
      case "toggle-calendar-event":
        if (card) {
          const collapsed = card.classList.toggle("calendar-event--collapsed");
          actionButton.textContent = collapsed ? "Expand" : "Collapse";
        }
        break;
      case "add-calendar-event":
        openCalendarEditor("", appState.workspaceId, dayLabel);
        break;
      default:
        break;
    }
  };
}

function calendarEventClass(type) {
  const normalized = String(type || "calendar").toLowerCase();
  const allowed = new Set([
    "work",
    "focus",
    "career",
    "admin",
    "review",
    "home",
    "study",
    "lab",
    "errand",
    "family",
    "practice",
    "build",
    "docs",
    "ops",
    "calendar",
    "google"
  ]);
  return allowed.has(normalized) ? normalized : "calendar";
}

function buildMonthView(events, anchor) {
  const monthStart = startOfMonth(anchor);
  const label = formatMonthYear(anchor);
  const firstWeekdayOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const totalCells = 42;
  const detail = "Month view";

  return {
    label,
    detail,
    html: Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - firstWeekdayOffset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return `<article class="calendar-day calendar-day--month calendar-day--blank" aria-hidden="true"></article>`;
      }

      const day = new Date(monthStart.getFullYear(), monthStart.getMonth(), dayNumber);
      const dayEvents = getEventsForDate(events, day);
      const isToday = sameDate(day, new Date());
      const dayKey = getDayLabel(day);
      return `
        <article class="calendar-day calendar-day--month ${isToday ? "calendar-day--today" : ""}" data-day="${escapeHtml(dayKey)}">
          <header>
            <span class="calendar-day-label">${escapeHtml(day.toLocaleDateString(undefined, { weekday: "short" }))}</span>
            <strong class="calendar-day-number">${escapeHtml(String(day.getDate()))}</strong>
          </header>
          <div class="stack-list">
            ${renderCalendarEvents(dayEvents, true, dayKey)}
          </div>
          <div class="calendar-day-actions">
            <button class="mini-button" type="button" data-action="add-calendar-event">Add event</button>
          </div>
        </article>
      `;
    }).join("")
  };
}

function buildWeekView(events, anchor) {
  const weekStart = startOfWeek(anchor);
  const weekEnd = addDays(weekStart, 6);
  const label = `${formatMonthDay(weekStart)} - ${formatMonthDay(weekEnd)}`;
  const detail = "Week view";

  return {
    label,
    detail,
    html: Array.from({ length: 7 }, (_, index) => {
      const day = addDays(weekStart, index);
      const dayEvents = getEventsForDate(events, day);
      const isToday = sameDate(day, new Date());
      const dayKey = getDayLabel(day);
      return `
        <article class="calendar-day calendar-day--week ${isToday ? "calendar-day--today" : ""}" data-day="${escapeHtml(dayKey)}">
          <header>
            <span class="calendar-day-label">${escapeHtml(day.toLocaleDateString(undefined, { weekday: "short" }))}</span>
            <strong class="calendar-day-number">${escapeHtml(formatMonthDay(day))}</strong>
          </header>
          <div class="stack-list">
            ${renderCalendarEvents(dayEvents, false, dayKey)}
          </div>
          <div class="calendar-day-actions">
            <button class="mini-button" type="button" data-action="add-calendar-event">Add event</button>
          </div>
        </article>
      `;
    }).join("")
  };
}

function renderCalendarEvents(dayEvents, compact = false, dayLabel = "") {
  if (!dayEvents.length) {
    return compact ? `<div class="calendar-empty">No events</div>` : `<div class="calendar-empty">No events</div>`;
  }

  const visibleEvents = compact ? dayEvents.slice(0, 2) : dayEvents;
  const overflowCount = compact ? Math.max(0, dayEvents.length - visibleEvents.length) : 0;

  return `
    ${visibleEvents
      .map(
        ({ event, index }) => `
          <article class="calendar-event ${calendarEventClass(event.type)} ${compact ? "calendar-event--collapsed" : ""}" data-event-index="${index}" data-day="${escapeHtml(dayLabel)}" data-event-type="${escapeHtml(event.type || "calendar")}" data-event-source="${escapeHtml(event.source || "calendar")}">
            <span class="calendar-event-time ${getCalendarEventTimeLabel(event) ? "" : "calendar-event-time--todo"}">${escapeHtml(formatDisplayTimeLabel(getCalendarEventTimeLabel(event)) || "To-do")}</span>
            <strong>${escapeHtml(event.title)}</strong>
            ${compact ? `<button class="mini-button" type="button" data-action="toggle-calendar-event">Expand</button>` : ""}
            <div class="calendar-event-body">
              <p>${escapeHtml(event.detail)}</p>
              <span class="tag-chip tag-chip--${calendarEventClass(event.source || event.type)}">${escapeHtml(event.sourceLabel || event.type || "calendar")}</span>
              <div class="calendar-event-actions">
                ${
                  event.source === "google"
                    ? `<button class="mini-button" type="button" data-action="open-source-calendar">Open source</button><button class="mini-button button-danger" type="button" data-action="hide-calendar-event">Hide from dashboard</button>`
                    : `<button class="mini-button" type="button" data-action="edit-calendar">Edit</button><button class="mini-button button-danger" type="button" data-action="delete-calendar">Delete</button><button class="mini-button button-danger" type="button" data-action="hide-calendar-event">Hide from dashboard</button>`
                }
              </div>
            </div>
          </article>
        `
      )
      .join("")}
    ${overflowCount ? `<div class="calendar-more">+${overflowCount} more</div>` : ""}
  `;
}

function shiftCalendar(direction) {
  const anchor = new Date(appState.calendarAnchor);
  if (appState.calendarView === "week") {
    anchor.setDate(anchor.getDate() + direction * 7);
  } else {
    anchor.setMonth(anchor.getMonth() + direction);
  }
  setCalendarAnchor(anchor);
}

function setCalendarView(view) {
  const nextView = view === "week" ? "week" : "month";
  appState.calendarView = nextView;
  localStorage.setItem(STORAGE_KEYS.calendarView, nextView);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function setCalendarAnchor(value) {
  const nextAnchor = normalizeDate(value);
  appState.calendarAnchor = nextAnchor.toISOString();
  localStorage.setItem(STORAGE_KEYS.calendarAnchor, formatDateKey(nextAnchor));
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function getStoredCalendarView() {
  const storedView = localStorage.getItem(STORAGE_KEYS.calendarView);
  return storedView === "month" ? "month" : "week";
}

function getStoredCalendarAnchor() {
  const storedAnchor = localStorage.getItem(STORAGE_KEYS.calendarAnchor);
  return normalizeDate(storedAnchor || new Date()).toISOString();
}

function getStoredScheduleDay() {
  const storedDay = localStorage.getItem(STORAGE_KEYS.scheduleDay);
  return DAY_ORDER.includes(storedDay) ? storedDay : getDayLabel(new Date());
}

function getSelectedScheduleDate() {
  const anchor = startOfWeek(new Date(appState.calendarAnchor));
  const dayIndex = DAY_ORDER.indexOf(appState.scheduleDay);
  return addDays(anchor, dayIndex === -1 ? 0 : dayIndex);
}

function renderKanban(workspace) {
  if (workspace.id === "home") {
    renderHomeWorkspace(workspace);
    return;
  }

  const state = getKanbanState(workspace);
  kanbanBoardEl.classList.remove("home-view");
  if (kanbanTitleEl) {
    kanbanTitleEl.textContent = "Kanban";
  }
  if (kanbanHintEl) {
    kanbanHintEl.textContent = "Drag cards between columns";
  }
  if (taskNewEl) {
    taskNewEl.textContent = "Add task";
  }
  kanbanBoardEl.innerHTML = workspace.kanban
    .map((column) => {
      const cards = state.columns[column.id] || [];
      return `
        <section class="kanban-column" data-column-id="${escapeHtml(column.id)}">
          <div class="column-title">${escapeHtml(column.title)}</div>
          ${cards
            .map(
              (card) => {
                const subtasks = Array.isArray(card.subtasks) ? card.subtasks : [];
                const completedSubtasks = subtasks.filter((item) => item.done).length;
                const allSubtasksDone = subtasks.length > 0 && completedSubtasks === subtasks.length;
                return `
                <article class="kanban-card ${subtasks.length ? "kanban-card--subtasks" : ""} ${allSubtasksDone ? "kanban-card--ready" : ""}" draggable="true" data-card-id="${escapeHtml(card.id)}" data-column-id="${escapeHtml(column.id)}">
                  <strong>${escapeHtml(card.title)}</strong>
                  <p class="stack-detail">${escapeHtml(card.detail)}</p>
                  <span class="tag-chip">${escapeHtml(card.tag)}</span>
                  ${
                    subtasks.length
                      ? `
                        <details class="kanban-subtasks" ${allSubtasksDone ? "" : "open"}>
                          <summary>
                            <span>Subtasks</span>
                            <span class="kanban-subtasks-count">${completedSubtasks}/${subtasks.length} done</span>
                          </summary>
                          <div class="kanban-subtasks-list">
                            ${subtasks
                              .map(
                                (subtask) => `
                                  <label class="kanban-subtask-item ${subtask.done ? "is-done" : ""}">
                                    <input type="checkbox" data-action="toggle-subtask" data-subtask-id="${escapeHtml(subtask.id)}" ${subtask.done ? "checked" : ""} />
                                    <span>${escapeHtml(subtask.title)}</span>
                                  </label>
                                `
                              )
                              .join("")}
                          </div>
                        </details>
                      `
                      : ""
                  }
                  <div class="kanban-card-actions">
                    <button class="mini-button" type="button" data-action="edit-task">Edit</button>
                    <button class="mini-button button-danger" type="button" data-action="delete-task">Delete</button>
                  </div>
                </article>
                `;
              }
            )
            .join("")}
        </section>
      `;
    })
    .join("");

  kanbanBoardEl.onmousedown = (event) => {
    if (event.target.closest("button, input, label, summary, textarea, select")) {
      return;
    }
    const cardEl = event.target.closest(".kanban-card");
    if (!cardEl) {
      return;
    }

    currentDrag = {
      cardId: cardEl.dataset.cardId,
      columnId: cardEl.dataset.columnId
    };
  };

  kanbanBoardEl.ondragstart = (event) => {
    if (event.target.closest("button, input, label, summary, textarea, select")) {
      event.preventDefault();
      return;
    }
    const cardEl = event.target.closest(".kanban-card");
    if (!cardEl) {
      return;
    }

    currentDrag = {
      cardId: cardEl.dataset.cardId,
      columnId: cardEl.dataset.columnId
    };
    cardEl.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(currentDrag));
  };

  kanbanBoardEl.ondragend = () => {
    currentDrag = null;
    kanbanBoardEl.querySelectorAll(".kanban-card").forEach((cardEl) => cardEl.classList.remove("is-dragging"));
    kanbanBoardEl.querySelectorAll(".kanban-column").forEach((columnEl) => columnEl.classList.remove("is-drop-target"));
  };

  kanbanBoardEl.ondragover = (event) => {
    event.preventDefault();
    const columnEl = event.target.closest(".kanban-column");
    if (columnEl) {
      columnEl.classList.add("is-drop-target");
    }
  };

  kanbanBoardEl.ondragleave = (event) => {
    const columnEl = event.target.closest(".kanban-column");
    if (columnEl) {
      columnEl.classList.remove("is-drop-target");
    }
  };

  kanbanBoardEl.ondrop = (event) => {
    event.preventDefault();
    const columnEl = event.target.closest(".kanban-column");
    if (columnEl) {
      columnEl.classList.remove("is-drop-target");
    }

    const dragPayload = readDragPayload(event);
    if (!dragPayload || !columnEl) {
      return;
    }

    const targetCard = event.target.closest(".kanban-card");
    moveKanbanCard(appState.workspaceId, dragPayload.columnId, dragPayload.cardId, columnEl.dataset.columnId, targetCard?.dataset.cardId || null);
  };

  kanbanBoardEl.onclick = (event) => {
    const button = event.target.closest('[data-action="edit-task"]');
    const deleteButton = event.target.closest('[data-action="delete-task"]');
    if (!button && !deleteButton) {
      return;
    }

    const cardEl = (button || deleteButton).closest(".kanban-card");
    if (!cardEl) {
      return;
    }

    if (deleteButton) {
      if (window.confirm("Delete this task?")) {
        deleteTaskFromBoard(appState.workspaceId, cardEl.dataset.cardId);
      }
      return;
    }

    openTaskEditor(cardEl.dataset.cardId, appState.workspaceId, cardEl.dataset.columnId);
  };

  kanbanBoardEl.onchange = (event) => {
    const subtaskToggle = event.target.closest('[data-action="toggle-subtask"]');
    if (!subtaskToggle) {
      return;
    }

    const cardEl = subtaskToggle.closest(".kanban-card");
    if (!cardEl) {
      return;
    }

    toggleKanbanSubtask(appState.workspaceId, cardEl.dataset.cardId, subtaskToggle.dataset.subtaskId);
  };
}

function renderHomeWorkspace(workspace) {
  const homeState = getHomeState(workspace);
  const selectedMenuDay = getStoredHomeMenuDay(workspace.id);
  const selectedMenu = Array.isArray(homeState.menuByDay?.[selectedMenuDay]) ? homeState.menuByDay[selectedMenuDay] : [];
  kanbanBoardEl.classList.add("home-view");
  if (kanbanTitleEl) {
    kanbanTitleEl.textContent = "Home";
  }
  if (kanbanHintEl) {
    kanbanHintEl.textContent = "To-do list, groceries, and menu";
  }
  if (taskNewEl) {
    taskNewEl.textContent = "Add to-do";
  }

  kanbanBoardEl.innerHTML = `
    <section class="home-board">
      <article class="home-card">
        <div class="home-card-header">
          <div>
            <div class="column-title">To-do list</div>
            <strong>${escapeHtml(homeState.todos.filter((item) => !item.done).length)} open</strong>
          </div>
          <button class="button button-compact" type="button" data-action="home-add-todo">Add to-do</button>
        </div>
        <div class="home-list">
          ${
            homeState.todos.length
              ? homeState.todos
                  .map(
                    (item) => `
                      <div class="home-item ${item.done ? "is-done" : ""}" data-home-item-id="${escapeHtml(item.id)}" data-home-list="todos">
                        <input type="checkbox" ${item.done ? "checked" : ""} data-action="home-toggle-item" />
                        <span>${escapeHtml(item.title)}</span>
                        <button class="mini-button button-danger" type="button" data-action="home-delete-item">Delete</button>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="calendar-empty">No home to-dos yet.</div>`
          }
        </div>
      </article>

      <article class="home-card">
        <div class="home-card-header">
          <div>
            <div class="column-title">Grocery list</div>
            <strong>${escapeHtml(homeState.groceries.filter((item) => !item.done).length)} open</strong>
          </div>
          <button class="button button-compact" type="button" data-action="home-add-grocery">Add grocery</button>
        </div>
        <div class="home-list">
          ${
            homeState.groceries.length
              ? homeState.groceries
                  .map(
                    (item) => `
                      <div class="home-item ${item.done ? "is-done" : ""}" data-home-item-id="${escapeHtml(item.id)}" data-home-list="groceries">
                        <input type="checkbox" ${item.done ? "checked" : ""} data-action="home-toggle-item" />
                        <span>${escapeHtml(item.title)}</span>
                        <button class="mini-button button-danger" type="button" data-action="home-delete-item">Delete</button>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="calendar-empty">No groceries yet.</div>`
          }
        </div>
      </article>

      <article class="home-card home-card--menu">
        <div class="home-card-header">
          <div>
            <div class="column-title">Daily menu</div>
            <strong>${escapeHtml(selectedMenuDay)} meals</strong>
          </div>
          <div class="home-day-switcher" role="tablist" aria-label="Menu day">
            ${DAY_ORDER.map(
              (day) => `
                <button class="button button-compact ${day === selectedMenuDay ? "is-active" : ""}" type="button" data-action="home-menu-day" data-home-menu-day="${escapeHtml(day)}">${escapeHtml(day)}</button>
              `
            ).join("")}
          </div>
        </div>
        <div class="home-menu">
          ${
            selectedMenu.length
              ? selectedMenu
                  .map(
                    (item) => `
                      <div class="home-menu-item" data-home-meal-id="${escapeHtml(item.id)}">
                        <div class="home-menu-item-header">
                          <span class="tag-chip tag-chip--home">${escapeHtml(item.meal || "Meal")}</span>
                          <span class="panel-hint">Auto-saved</span>
                        </div>
                        <label class="home-menu-field">
                          <span>Meal</span>
                          <input type="text" value="${escapeHtml(item.title || "")}" data-action="home-edit-meal" data-home-menu-field="title" data-home-menu-id="${escapeHtml(item.id)}" data-home-menu-day="${escapeHtml(selectedMenuDay)}" placeholder="Meal title" />
                        </label>
                        <label class="home-menu-field">
                          <span>Notes</span>
                          <textarea rows="2" data-action="home-edit-meal" data-home-menu-field="detail" data-home-menu-id="${escapeHtml(item.id)}" data-home-menu-day="${escapeHtml(selectedMenuDay)}" placeholder="Meal notes">${escapeHtml(item.detail || "")}</textarea>
                        </label>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="calendar-empty">No menu set yet.</div>`
          }
        </div>
      </article>
    </section>
  `;

  kanbanBoardEl.onclick = (event) => {
    const actionButton = event.target.closest("[data-action]");
    const itemEl = event.target.closest("[data-home-item-id]");

    if (!actionButton && !itemEl) {
      return;
    }

    switch (actionButton?.dataset.action) {
      case "home-add-todo":
        addHomeListItem(workspace.id, "todos", "Add a home to-do");
        break;
      case "home-add-grocery":
        addHomeListItem(workspace.id, "groceries", "Add a grocery");
        break;
      case "home-menu-day":
        if (actionButton.dataset.homeMenuDay) {
          setHomeMenuDay(workspace.id, actionButton.dataset.homeMenuDay);
        }
        break;
      case "home-toggle-item":
        if (itemEl) {
          toggleHomeListItem(workspace.id, itemEl.dataset.homeList, itemEl.dataset.homeItemId);
        }
        break;
      case "home-delete-item":
        if (itemEl) {
          deleteHomeListItem(workspace.id, itemEl.dataset.homeList, itemEl.dataset.homeItemId);
        }
        break;
      default:
        break;
    }
  };

  kanbanBoardEl.oninput = (event) => {
    const field = event.target.closest("[data-action='home-edit-meal']");
    if (!field) {
      return;
    }

    const day = field.dataset.homeMenuDay;
    const mealId = field.dataset.homeMenuId;
    const mealField = field.dataset.homeMenuField;
    if (!day || !mealId || !mealField) {
      return;
    }

    updateHomeMeal(workspace.id, day, mealId, {
      [mealField]: field.value
    });
  };
}

function renderStudyWidget(activeWorkspace) {
  if (activeWorkspace.id === "home") {
    spotlightEl.innerHTML = "";
    spotlightEl.classList.remove("spotlight--single");
    return;
  }

  const isFlashcardDeck = activeWorkspace.spotlight.type === "flashcards";
  if (isFlashcardDeck) {
    spotlightTitleEl.textContent = activeWorkspace.spotlight.title || "";
    spotlightHintEl.textContent = activeWorkspace.spotlight.hint || "";
  } else {
    spotlightHintEl.textContent = activeWorkspace.spotlight.title || "";
    spotlightTitleEl.textContent = activeWorkspace.spotlight.title || "";
  }

  if (isFlashcardDeck) {
    spotlightEl.classList.add("spotlight--single");
    renderFlashcards(activeWorkspace);
    return;
  }
  spotlightEl.classList.remove("spotlight--single");

  spotlightEl.innerHTML = `
    <article class="spotlight-card spotlight-card--accent">
      <div class="spotlight-title">${escapeHtml(activeWorkspace.spotlight.title)}</div>
      <p class="spotlight-answer">${escapeHtml(activeWorkspace.spotlight.body)}</p>
    </article>
  `;
}

function renderFlashcards(workspace) {
  const cards = getFlashcardsState(workspace);
  if (!cards.length) {
    spotlightEl.innerHTML = `
      <article class="spotlight-card spotlight-card--accent flashcard">
        <div class="spotlight-title">No cards yet</div>
        <div class="flashcard-question">${workspace.id === "work" ? "Add your first work story." : "Add your first study or interview question."}</div>
        <div class="flashcard-actions">
          <button class="button button-primary" id="flashcard-empty-add" type="button">${workspace.id === "work" ? "Add story" : "Add card"}</button>
        </div>
      </article>
    `;
    document.getElementById("flashcard-empty-add").addEventListener("click", () => {
      if (workspace.id === "work") {
        openStoryEditor("", workspace.id);
        return;
      }
      openFlashcardEditor("", workspace.id);
    });
    return;
  }

  const card = cards[appState.flashcardIndex % cards.length];
  const isStoryCard = card.category === "story";
  const cardLabel = card.category === "interview" ? "Interview question" : card.category === "story" ? "Work story" : "Study card";
  spotlightEl.innerHTML = isStoryCard
    ? `
      <article class="spotlight-card spotlight-card--accent flashcard" id="flashcard-surface" role="group" aria-label="Work story card">
        <div class="spotlight-title">${escapeHtml(cardLabel)}</div>
        <div class="flashcard-question">${escapeHtml(card.question)}</div>
        <div class="flashcard-answer is-visible">${escapeHtml(card.answer)}</div>
        <div class="flashcard-actions">
          <button class="button" id="prev-card" type="button" aria-label="Previous card">←</button>
          <button class="button" id="edit-card" type="button">Edit</button>
          <button class="button" id="next-card" type="button" aria-label="Next card">→</button>
        </div>
        <div class="spotlight-meta">
          <span class="tag-chip tag-chip--${escapeHtml(card.category)}">${escapeHtml(card.category)}</span>
        </div>
      </article>
    `
    : `
      <article class="spotlight-card spotlight-card--accent flashcard" id="flashcard-surface" role="button" tabindex="0" aria-label="Flashcard. Click the middle to reveal the answer.">
        <div class="spotlight-title">${escapeHtml(cardLabel)}</div>
        <div class="flashcard-question">${escapeHtml(card.question)}</div>
        <div class="flashcard-answer ${appState.answerVisible ? "is-visible" : ""}" id="flashcard-answer">${escapeHtml(card.answer)}</div>
        <div class="flashcard-actions">
          <button class="button" id="prev-card" type="button" aria-label="Previous card">←</button>
          <button class="button button-primary" id="toggle-answer" type="button">
            ${appState.answerVisible ? "Hide answer" : "Show answer"}
          </button>
          <button class="button" id="edit-card" type="button">Edit</button>
          <button class="button" id="next-card" type="button" aria-label="Next card">→</button>
        </div>
      </article>
    `;

  const toggleAnswer = () => {
    appState.answerVisible = !appState.answerVisible;
    renderFlashcards(workspace);
  };

  const stepCard = (direction) => {
    const nextIndex = (appState.flashcardIndex + direction + cards.length) % cards.length;
    appState.flashcardIndex = nextIndex;
    appState.answerVisible = false;
    renderFlashcards(workspace);
  };

  const toggleAnswerEl = document.getElementById("toggle-answer");
  if (toggleAnswerEl) {
    toggleAnswerEl.addEventListener("click", toggleAnswer);
  }
  document.getElementById("edit-card").addEventListener("click", () => {
    if (isStoryCard) {
      openStoryEditor(card.id, workspace.id);
      return;
    }
    openFlashcardEditor(card.id, workspace.id);
  });
  if (!isStoryCard) {
    document.getElementById("flashcard-surface").addEventListener("click", (event) => {
      if (event.target.closest("button")) {
        return;
      }
      toggleAnswer();
    });
    document.getElementById("flashcard-surface").addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleAnswer();
      }
    });
  }
  document.getElementById("next-card").addEventListener("click", () => stepCard(1));
  document.getElementById("prev-card").addEventListener("click", () => stepCard(-1));
}

function renderFlashcardOptions(workspaceId) {
  const workspace = getWorkspace(workspaceId);
  const cards = getFlashcardsState(workspace);
  const options = cards
    .map((card, index) => `<option value="${index}">${escapeHtml(card.category)}: ${escapeHtml(card.question.slice(0, 48))}</option>`)
    .join("");

  if (flashcardFormCardIdEl && !flashcardFormCardIdEl.value) {
    // keep the form stable; the select is only for workspace switching in the editor
  }

  return options;
}

function getFlashcardsState(workspace) {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const baseCards = normalizeFlashcards(normalizedWorkspace.spotlight?.cards || [], normalizedWorkspace.id);
  const storedCards = readStoredJson(getFlashcardStorageKey(normalizedWorkspace.id), null);
  if (!Array.isArray(storedCards)) {
    return baseCards;
  }

  return mergeFlashcardLists(baseCards, storedCards);
}

function saveFlashcardsState(workspaceId, cards) {
  localStorage.setItem(getFlashcardStorageKey(workspaceId), JSON.stringify(cards));
}

function mergeFlashcardLists(baseCards, storedCards) {
  const normalizedStored = normalizeFlashcards(storedCards);
  const byId = new Map(normalizedStored.map((card) => [card.id, card]));
  const ordered = [];

  for (const baseCard of baseCards) {
    if (byId.has(baseCard.id)) {
      ordered.push(byId.get(baseCard.id));
      byId.delete(baseCard.id);
    } else {
      ordered.push(baseCard);
    }
  }

  for (const card of byId.values()) {
    ordered.push(card);
  }

  return ordered.length ? ordered : normalizeFlashcards(baseCards);
}

function normalizeFlashcards(cards) {
  return cards.map((card, index) => ({
    id: card.id || `flashcard-${slugify(card.question || `card-${index + 1}`)}-${index + 1}`,
    question: card.question,
    answer: card.answer,
    category: card.category || "study"
  }));
}

function getFlashcardStorageKey(workspaceId) {
  return `workspace-dashboard:flashcards:${workspaceId}`;
}

function normalizeLayoutState(value) {
  const base = {
    order: [...DEFAULT_LAYOUT.order],
    spans: { ...DEFAULT_LAYOUT.spans }
  };

  if (!value || typeof value !== "object") {
    return base;
  }

  if (Array.isArray(value.order)) {
    const isLegacyDefaultOrder = value.order.length === LEGACY_DEFAULT_LAYOUT_ORDER.length &&
      value.order.every((widgetId, index) => widgetId === LEGACY_DEFAULT_LAYOUT_ORDER[index]);
    if (isLegacyDefaultOrder) {
      return base;
    }

    const nextOrder = [];
    for (const widgetId of value.order) {
      if (DEFAULT_LAYOUT.order.includes(widgetId) && !nextOrder.includes(widgetId)) {
        nextOrder.push(widgetId);
      }
    }
    for (const widgetId of DEFAULT_LAYOUT.order) {
      if (!nextOrder.includes(widgetId)) {
        nextOrder.push(widgetId);
      }
    }
    base.order = nextOrder;
  }

  if (value.spans && typeof value.spans === "object") {
    for (const widgetId of DEFAULT_LAYOUT.order) {
      const normalizedSpan = normalizeLayoutSpan(value.spans[widgetId], widgetId);
      base.spans[widgetId] = normalizedSpan;
    }
  }

  return base;
}

function normalizeLayoutSpan(value, widgetId) {
  if (widgetId === "hero") {
    return 12;
  }

  const numericValue = Number.parseInt(value, 10);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_LAYOUT.spans[widgetId] || 4;
  }

  const clamped = Math.min(12, Math.max(4, numericValue));
  return LAYOUT_SPANS.includes(clamped) ? clamped : 4;
}

function persistLayoutState() {
  localStorage.setItem(STORAGE_KEYS.layout, JSON.stringify(layoutState));
}

function applyWidgetLayout() {
  if (!layoutEl) {
    return;
  }

  layoutState = normalizeLayoutState(layoutState);
  const panels = Array.from(layoutEl.querySelectorAll(".widget-panel"));
  const panelById = new Map(panels.map((panel) => [panel.dataset.widgetId, panel]));
  layoutEl.classList.toggle("is-move-mode", Boolean(appState.widgetMoveSourceId));

  for (const widgetId of layoutState.order) {
    const panel = panelById.get(widgetId);
    if (!panel) {
      continue;
    }

    panel.draggable = true;
    panel.dataset.widgetSpan = String(layoutState.spans[widgetId] || 4);
    panel.classList.remove("span-4", "span-6", "span-8", "span-12");
    panel.classList.add(`span-${layoutState.spans[widgetId] || 4}`);
    panel.classList.toggle("is-move-source", widgetId === appState.widgetMoveSourceId);
    layoutEl.appendChild(panel);
  }

  for (const panel of panels) {
    panel.classList.toggle("is-dragging", false);
    panel.classList.toggle("is-drop-target", false);
    panel.classList.toggle("is-move-source", panel.dataset.widgetId === appState.widgetMoveSourceId);
  }

  updateWidgetMoveAffordances();
  updateWidgetToolbarLabels();
}

function handleWidgetToolbarClick(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) {
    return;
  }

  const widgetPanel = actionButton.closest(".widget-panel");
  if (!widgetPanel || !widgetPanel.dataset.widgetId) {
    return;
  }

  const widgetId = widgetPanel.dataset.widgetId;
  switch (actionButton.dataset.action) {
    case "toggle-widget-move":
      appState.widgetMoveSourceId = appState.widgetMoveSourceId === widgetId ? null : widgetId;
      applyWidgetLayout();
      break;
    case "move-widget":
      moveWidget(widgetId, Number.parseInt(actionButton.dataset.direction || "0", 10));
      appState.widgetMoveSourceId = null;
      applyWidgetLayout();
      break;
    case "move-widget-before":
      moveWidgetToTarget(appState.widgetMoveSourceId, widgetId, false);
      break;
    case "move-widget-after":
      moveWidgetToTarget(appState.widgetMoveSourceId, widgetId, true);
      break;
    case "toggle-widget-size":
      toggleWidgetSize(widgetId);
      break;
    default:
      break;
  }
}

function moveWidget(widgetId, direction) {
  const currentIndex = layoutState.order.indexOf(widgetId);
  if (currentIndex === -1) {
    return;
  }

  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= layoutState.order.length) {
    return;
  }

  const nextOrder = [...layoutState.order];
  const [widget] = nextOrder.splice(currentIndex, 1);
  nextOrder.splice(nextIndex, 0, widget);
  layoutState.order = nextOrder;
  persistLayoutState();
  applyWidgetLayout();
}

function moveWidgetToTarget(widgetId, targetWidgetId, insertAfter) {
  if (!widgetId || !targetWidgetId || widgetId === targetWidgetId) {
    return;
  }

  const currentIndex = layoutState.order.indexOf(widgetId);
  const targetIndex = layoutState.order.indexOf(targetWidgetId);
  if (currentIndex === -1 || targetIndex === -1) {
    return;
  }

  const nextOrder = layoutState.order.filter((item) => item !== widgetId);
  const baseIndex = nextOrder.indexOf(targetWidgetId);
  const insertionIndex = baseIndex === -1 ? nextOrder.length : baseIndex + (insertAfter ? 1 : 0);
  nextOrder.splice(insertionIndex, 0, widgetId);
  layoutState.order = nextOrder;
  appState.widgetMoveSourceId = null;
  persistLayoutState();
  applyWidgetLayout();
}

function toggleWidgetSize(widgetId) {
  if (widgetId === "hero") {
    return;
  }

  const defaultSpan = normalizeLayoutSpan(DEFAULT_LAYOUT.spans[widgetId], widgetId);
  const expandedSpan = getExpandedLayoutSpan(widgetId);
  const currentSpan = normalizeLayoutSpan(layoutState.spans[widgetId], widgetId);
  layoutState.spans[widgetId] = currentSpan === expandedSpan ? defaultSpan : expandedSpan;
  persistLayoutState();
  applyWidgetLayout();
}

function getExpandedLayoutSpan(widgetId) {
  const defaultSpan = normalizeLayoutSpan(DEFAULT_LAYOUT.spans[widgetId], widgetId);
  const currentIndex = LAYOUT_SPANS.indexOf(defaultSpan);
  const expandedIndex = Math.min(LAYOUT_SPANS.length - 1, currentIndex + 1);
  return LAYOUT_SPANS[expandedIndex];
}

function updateWidgetToolbarLabels() {
  if (!layoutEl) {
    return;
  }

  const panels = layoutEl.querySelectorAll(".widget-panel");
  panels.forEach((panel) => {
    const widgetId = panel.dataset.widgetId;
    const span = normalizeLayoutSpan(layoutState.spans[widgetId], widgetId);
    const defaultSpan = normalizeLayoutSpan(DEFAULT_LAYOUT.spans[widgetId], widgetId);
    const toggleButton = panel.querySelector('[data-action="toggle-widget-size"]');
    if (toggleButton) {
      toggleButton.textContent = span === getExpandedLayoutSpan(widgetId) ? "Compact" : "Expand";
      toggleButton.disabled = widgetId === "hero";
    }
    const moveButton = panel.querySelector('[data-action="toggle-widget-move"]');
    if (moveButton) {
      moveButton.textContent = appState.widgetMoveSourceId === widgetId ? "Cancel move" : "Move";
      moveButton.disabled = widgetId === "hero";
    }
    const moveTargets = panel.querySelectorAll('[data-action="move-widget-before"], [data-action="move-widget-after"]');
    moveTargets.forEach((button) => {
      const sourceId = appState.widgetMoveSourceId;
      const isTarget = Boolean(sourceId) && sourceId !== widgetId;
      button.disabled = !isTarget;
    });
  });
}

function updateWidgetMoveAffordances() {
  if (!layoutEl) {
    return;
  }

  const sourceId = appState.widgetMoveSourceId;
  layoutEl.querySelectorAll(".widget-panel").forEach((panel) => {
    const widgetId = panel.dataset.widgetId;
    let rail = panel.querySelector(".widget-move-rail");
    if (rail) {
      rail.remove();
    }

    if (!sourceId || sourceId === widgetId) {
      return;
    }

    rail = document.createElement("div");
    rail.className = "widget-move-rail";
    rail.innerHTML = `
      <button class="button button-compact widget-move-arrow" type="button" data-action="move-widget-before" aria-label="Move before ${escapeHtml(widgetId)}">← Before</button>
      <button class="button button-compact widget-move-arrow" type="button" data-action="move-widget-after" aria-label="Move after ${escapeHtml(widgetId)}">After →</button>
    `;
    panel.appendChild(rail);
  });
}

function handleWidgetDragStart(event) {
  const widgetPanel = event.target.closest(".widget-panel");
  if (
    !widgetPanel ||
    !widgetPanel.dataset.widgetId ||
    event.target.closest(".kanban-card") ||
    event.target.closest("input, textarea, select, button, a")
  ) {
    return;
  }

  currentDrag = {
    type: "widget",
    widgetId: widgetPanel.dataset.widgetId
  };

  widgetPanel.classList.add("is-dragging");
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(currentDrag));
  }
}

function handleWidgetDragOver(event) {
  const payload = readDragPayload(event);
  const widgetPanel = event.target.closest(".widget-panel");
  if (!payload || payload.type !== "widget" || !widgetPanel || !widgetPanel.dataset.widgetId) {
    return;
  }

  event.preventDefault();
  if (widgetPanel.dataset.widgetId !== payload.widgetId) {
    widgetPanel.classList.add("is-drop-target");
  }
}

function handleWidgetDragLeave(event) {
  const widgetPanel = event.target.closest(".widget-panel");
  if (widgetPanel) {
    widgetPanel.classList.remove("is-drop-target");
  }
}

function handleWidgetDrop(event) {
  const payload = readDragPayload(event);
  const widgetPanel = event.target.closest(".widget-panel");
  if (!payload || payload.type !== "widget" || !widgetPanel || !widgetPanel.dataset.widgetId) {
    return;
  }

  event.preventDefault();
  const targetWidgetId = widgetPanel.dataset.widgetId;
  if (targetWidgetId === payload.widgetId) {
    widgetPanel.classList.remove("is-drop-target");
    return;
  }

  const nextOrder = layoutState.order.filter((widgetId) => widgetId !== payload.widgetId);
  const targetIndex = nextOrder.indexOf(targetWidgetId);
  const insertionIndex = targetIndex === -1 ? nextOrder.length : targetIndex;
  nextOrder.splice(insertionIndex, 0, payload.widgetId);
  layoutState.order = nextOrder;
  widgetPanel.classList.remove("is-drop-target");
  persistLayoutState();
  applyWidgetLayout();
}

function handleWidgetDragEnd() {
  currentDrag = null;
  layoutEl?.querySelectorAll(".widget-panel").forEach((panel) => {
    panel.classList.remove("is-dragging", "is-drop-target");
  });
}

function renderCapture(workspace) {
  if (!capturePanelEl) {
    return;
  }

  const captureMode = getStoredCaptureMode(workspace.id);
  const captureFollow = getStoredCaptureFollow(workspace.id);
  const captureFollowSide = getStoredCaptureFollowSide(workspace.id);
  const noteValue = localStorage.getItem(workspace.scratchpadKey) || "";
  const calcValue = getStoredCaptureCalculatorValue(workspace.id);
  const boardState = getStoredCaptureBoard(workspace.id);
  const assistantState = getStoredCaptureAssistant(workspace.id);
  capturePanelEl.innerHTML = `
    <div class="capture-shell">
      <div class="capture-toggle" role="tablist" aria-label="Capture modes">
        <button class="button button-compact ${captureMode === "notes" ? "is-active" : ""}" type="button" data-capture-mode="notes">Notes</button>
        <button class="button button-compact ${captureMode === "calculator" ? "is-active" : ""}" type="button" data-capture-mode="calculator">Calculator</button>
        <button class="button button-compact ${captureMode === "board" ? "is-active" : ""}" type="button" data-capture-mode="board">Whiteboard</button>
        <button class="button button-compact ${captureMode === "assistant" ? "is-active" : ""}" type="button" data-capture-mode="assistant">Assistant</button>
      </div>
      <div class="capture-mode ${captureMode === "notes" ? "is-active" : ""}" data-capture-pane="notes">
        <label class="capture-label" for="capture-input">Brain dump something quickly. It stays in this browser.</label>
        <textarea id="capture-input" class="capture-input" rows="8" placeholder="${escapeHtml(workspace.captureHint)}">${escapeHtml(noteValue)}</textarea>
      </div>
      <div class="capture-mode ${captureMode === "calculator" ? "is-active" : ""}" data-capture-pane="calculator">
        <div class="capture-calculator">
          <input id="capture-calc-display" class="capture-calc-display" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${escapeHtml(calcValue)}" placeholder="0" />
          <div class="capture-calc-grid" aria-label="Calculator keypad">
            ${renderCalculatorButtons()}
          </div>
        </div>
      </div>
      <div class="capture-mode ${captureMode === "board" ? "is-active" : ""}" data-capture-pane="board">
        <div class="capture-board-toolbar">
          <span class="panel-hint">Draw with your mouse or trackpad.</span>
          <div class="capture-board-actions">
            <button class="button button-compact" type="button" data-capture-action="undo">Undo</button>
            <button class="button button-compact button-danger" type="button" data-capture-action="clear-board">Clear</button>
          </div>
        </div>
        <canvas id="capture-board" class="capture-board" width="960" height="320"></canvas>
      </div>
      <div class="capture-mode ${captureMode === "assistant" ? "is-active" : ""}" data-capture-pane="assistant">
        <div class="capture-assistant">
          <div class="capture-assistant-toolbar">
            <span class="panel-hint">Local mock assistant for now. It uses the current workspace context.</span>
            <div class="capture-assistant-actions">
              <button class="button button-compact" type="button" data-capture-action="assistant-summarize">Summarize day</button>
              <button class="button button-compact" type="button" data-capture-action="assistant-next">What next?</button>
              <button class="button button-compact button-danger" type="button" data-capture-action="assistant-clear">Clear chat</button>
            </div>
          </div>
          <div class="capture-assistant-transcript" id="capture-assistant-transcript" aria-live="polite">
            ${renderCaptureAssistantTranscript(assistantState.messages)}
          </div>
          <form class="capture-assistant-composer" id="capture-assistant-composer">
            <textarea
              id="capture-assistant-input"
              class="capture-assistant-input"
              rows="3"
              placeholder="Ask about your schedule, tasks, work stories, or next step..."
            ></textarea>
            <div class="capture-assistant-composer-actions">
              <span class="panel-hint">Try: “What should I do next?” or “Summarize my day.”</span>
              <button class="button button-primary" type="submit">Send</button>
            </div>
          </form>
        </div>
      </div>
      <div class="capture-follow-controls">
        <div class="capture-follow-side ${captureFollow ? "" : "is-disabled"}" aria-label="Capture side">
          <button class="button button-compact button-follow-side ${captureFollowSide === "left" ? "is-active" : ""}" type="button" data-capture-action="set-follow-side" data-follow-side="left">Left</button>
          <button class="button button-compact button-follow-side ${captureFollowSide === "right" ? "is-active" : ""}" type="button" data-capture-action="set-follow-side" data-follow-side="right">Right</button>
        </div>
        <button class="button button-compact button-follow ${captureFollow ? "is-active" : ""}" type="button" data-capture-action="toggle-follow" aria-label="${captureFollow ? "Release capture widget" : "Follow capture widget"}" title="${captureFollow ? "Release capture widget" : "Follow capture widget"}">
          <span class="button-follow-icon" aria-hidden="true">${captureFollow ? "↺" : "⊞"}</span>
        </button>
      </div>
    </div>
  `;

  const captureInput = capturePanelEl.querySelector("#capture-input");
  if (captureInput) {
    captureInput.addEventListener("input", () => {
      localStorage.setItem(workspace.scratchpadKey, captureInput.value);
    });
  }

  const displayEl = capturePanelEl.querySelector("#capture-calc-display");
  if (displayEl) {
    displayEl.addEventListener("input", () => {
      setCaptureCalculatorValue(workspace.id, displayEl.value);
    });
  }

  capturePanelEl.querySelectorAll("[data-capture-mode]").forEach((button) => {
    button.addEventListener("click", () => setCaptureMode(workspace.id, button.dataset.captureMode));
  });
  capturePanelEl.querySelectorAll('[data-capture-action="toggle-follow"]').forEach((button) => {
    button.addEventListener("click", () => setCaptureFollow(workspace.id, !captureFollow));
  });
  capturePanelEl.querySelectorAll('[data-capture-action="set-follow-side"]').forEach((button) => {
    button.addEventListener("click", () => {
      if (!getStoredCaptureFollow(workspace.id)) {
        setCaptureFollow(workspace.id, true);
      }
      setCaptureFollowSide(workspace.id, button.dataset.followSide);
    });
  });
  capturePanelEl.querySelectorAll('[data-capture-action="assistant-summarize"]').forEach((button) => {
    button.addEventListener("click", () => {
      sendAssistantMessage(workspace.id, "Summarize my day.");
    });
  });
  capturePanelEl.querySelectorAll('[data-capture-action="assistant-next"]').forEach((button) => {
    button.addEventListener("click", () => {
      sendAssistantMessage(workspace.id, "What should I do next?");
    });
  });
  capturePanelEl.querySelectorAll('[data-capture-action="assistant-clear"]').forEach((button) => {
    button.addEventListener("click", () => {
      clearCaptureAssistant(workspace.id);
      renderWorkspace(getWorkspace(appState.workspaceId));
    });
  });

  const assistantForm = capturePanelEl.querySelector("#capture-assistant-composer");
  const assistantInput = capturePanelEl.querySelector("#capture-assistant-input");
  if (assistantForm && assistantInput) {
    assistantForm.addEventListener("submit", (event) => {
      event.preventDefault();
      sendAssistantMessage(workspace.id, assistantInput.value);
      assistantInput.value = "";
    });
    assistantInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        assistantForm.requestSubmit();
      }
    });
  }

  wireCaptureCalculator(workspace.id);
  wireCaptureBoard(workspace.id, boardState);
  applyCaptureFollowLayout(workspace.id);
}

function getCaptureModeStorageKey(workspaceId) {
  return `${STORAGE_KEYS.captureMode}:${workspaceId}`;
}

function getStoredCaptureMode(workspaceId) {
  const storedMode = localStorage.getItem(getCaptureModeStorageKey(workspaceId));
  return storedMode === "calculator" || storedMode === "board" || storedMode === "assistant" ? storedMode : "notes";
}

function setCaptureMode(workspaceId, mode) {
  const nextMode = mode === "calculator" || mode === "board" || mode === "assistant" ? mode : "notes";
  localStorage.setItem(getCaptureModeStorageKey(workspaceId), nextMode);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function getCaptureFollowStorageKey(workspaceId) {
  return `${STORAGE_KEYS.captureFollow}:${workspaceId}`;
}

function getCaptureFollowSideStorageKey(workspaceId) {
  return `${STORAGE_KEYS.captureFollowSide}:${workspaceId}`;
}

function getStoredCaptureFollow(workspaceId) {
  return localStorage.getItem(getCaptureFollowStorageKey(workspaceId)) === "true";
}

function getStoredCaptureFollowSide(workspaceId) {
  const storedSide = localStorage.getItem(getCaptureFollowSideStorageKey(workspaceId));
  return storedSide === "left" ? "left" : "right";
}

function setCaptureFollow(workspaceId, enabled) {
  localStorage.setItem(getCaptureFollowStorageKey(workspaceId), enabled ? "true" : "false");
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function setCaptureFollowSide(workspaceId, side) {
  const nextSide = side === "left" ? "left" : "right";
  localStorage.setItem(getCaptureFollowSideStorageKey(workspaceId), nextSide);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function getCaptureCalculatorStorageKey(workspaceId) {
  return `workspace-dashboard:capture-calculator:${workspaceId}`;
}

function getStoredCaptureCalculatorValue(workspaceId) {
  return localStorage.getItem(getCaptureCalculatorStorageKey(workspaceId)) || "";
}

function setCaptureCalculatorValue(workspaceId, value) {
  localStorage.setItem(getCaptureCalculatorStorageKey(workspaceId), value);
}

function getCaptureBoardStorageKey(workspaceId) {
  return `workspace-dashboard:capture-board:${workspaceId}`;
}

function getCaptureAssistantStorageKey(workspaceId) {
  return `${STORAGE_KEYS.captureAssistant}:${workspaceId}`;
}

function getStoredCaptureBoard(workspaceId) {
  const stored = readStoredJson(getCaptureBoardStorageKey(workspaceId), null);
  return normalizeCaptureBoard(stored);
}

function saveCaptureBoard(workspaceId, state) {
  localStorage.setItem(getCaptureBoardStorageKey(workspaceId), JSON.stringify(state));
}

function getStoredCaptureAssistant(workspaceId) {
  return normalizeCaptureAssistant(readStoredJson(getCaptureAssistantStorageKey(workspaceId), null));
}

function saveCaptureAssistant(workspaceId, state) {
  localStorage.setItem(getCaptureAssistantStorageKey(workspaceId), JSON.stringify(normalizeCaptureAssistant(state)));
}

function clearCaptureAssistant(workspaceId) {
  localStorage.removeItem(getCaptureAssistantStorageKey(workspaceId));
}

function normalizeCaptureAssistant(value) {
  const messages = Array.isArray(value?.messages)
    ? value.messages
        .map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: String(message.content || "").trim(),
          createdAt: typeof message.createdAt === "string" ? message.createdAt : new Date().toISOString()
        }))
        .filter((message) => message.content.length > 0)
    : [];
  return { messages };
}

function renderCaptureAssistantTranscript(messages) {
  const entries = Array.isArray(messages) && messages.length ? messages : [];
  if (!entries.length) {
    return `
      <div class="capture-assistant-empty">
        <strong>Ask the workspace assistant</strong>
        <p>It can summarize your schedule, point to the next task, or help turn rough notes into something useful.</p>
      </div>
    `;
  }

  return entries
    .map((message) => {
      const roleClass = message.role === "assistant" ? "capture-assistant-message--assistant" : "capture-assistant-message--user";
      const label = message.role === "assistant" ? "Assistant" : "You";
      return `
        <article class="capture-assistant-message ${roleClass}">
          <div class="capture-assistant-message-meta">
            <span>${label}</span>
            <time>${escapeHtml(formatAssistantTimestamp(message.createdAt))}</time>
          </div>
          <div class="capture-assistant-message-body">${escapeHtml(message.content)}</div>
        </article>
      `;
    })
    .join("");
}

function formatAssistantTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });
}

function getWorkspaceAssistantSummary(workspace) {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const scheduleEntries = getScheduleState(normalizedWorkspace);
  const calendarEvents = getMergedCalendarEvents(normalizedWorkspace);
  const calendarTodos = getCalendarTodoState(normalizedWorkspace.id).filter((item) => item.dateKey === formatDateKey(getSelectedScheduleDate()) && !item.deleted);
  const combinedSchedule = scheduleEntries.filter((item) => item.day === appState.scheduleDay);
  const timedSchedule = combinedSchedule.filter((item) => String(item.time || "").trim());
  const todoSchedule = combinedSchedule.filter((item) => !String(item.time || "").trim());
  const dayCalendarEvents = calendarEvents.filter((event) => event.day === appState.scheduleDay);
  const timedCalendarEvents = dayCalendarEvents.filter((event) => hasCalendarEventTime(event));
  const nextItem = timedSchedule[0] || timedCalendarEvents[0] || todoSchedule[0] || calendarTodos[0] || null;
  const openTasks = getOpenTaskCount(normalizedWorkspace);
  const completedTasks = getCompletedTaskCount(normalizedWorkspace);
  const workStories = getFlashcardsState(normalizedWorkspace).filter((card) => card.category === "story");
  const studyCards = getFlashcardsState(normalizedWorkspace).filter((card) => card.category !== "story");
  const dayLabel = `${normalizedWorkspace.label}: ${formatLongDate(getSelectedScheduleDate())}`;
  return {
    dayLabel,
    nextAction: nextItem ? `${nextItem.time ? `${formatDisplayTimeLabel(nextItem.time)} ` : "To-do "}${nextItem.title}` : "there is no scheduled item at the top of the list.",
    tasksSummary: normalizedWorkspace.id === "home"
      ? `You have ${getHomeTodoCount(normalizedWorkspace)} unchecked home items and ${getHomeGroceryCount(normalizedWorkspace)} grocery items.`
      : `You have ${openTasks} open tasks and ${completedTasks} completed tasks in this workspace.`,
    scheduleSummary: nextItem
      ? `The next scheduled item is ${nextItem.time ? `${formatDisplayTimeLabel(nextItem.time)} ` : "To-do "}${nextItem.title}.`
      : "There is no scheduled item in the selected day yet.",
    studySummary: studyCards.length
      ? `Study mode has ${studyCards.length} interview cards ready.`
      : "There are no study cards in this workspace yet.",
    storySummary: workStories.length
      ? `${workStories.length} summary cards are ready.`
      : "There are no work story cards in this workspace yet.",
    homeSummary: normalizedWorkspace.id === "home"
      ? `Home menu is set for ${getStoredHomeMenuDay(normalizedWorkspace.id)} and the grocery list has ${getHomeGroceryCount(normalizedWorkspace)} items.`
      : "This workspace is not using home planning mode."
  };
}

function getOpenTaskCount(workspace) {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  if (normalizedWorkspace.id === "home") {
    const homeState = getHomeState(normalizedWorkspace);
    return homeState.todos.filter((item) => !item.done).length + homeState.groceries.filter((item) => !item.done).length;
  }

  const state = getKanbanState(normalizedWorkspace);
  return Object.values(state.columns || {}).reduce((sum, cards) => {
    return sum + cards.filter((card) => !isKanbanCardComplete(card)).length;
  }, 0);
}

function getCompletedTaskCount(workspace) {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  if (normalizedWorkspace.id === "home") {
    const homeState = getHomeState(normalizedWorkspace);
    return homeState.todos.filter((item) => item.done).length + homeState.groceries.filter((item) => item.done).length;
  }

  const state = getKanbanState(normalizedWorkspace);
  return Object.values(state.columns || {}).reduce((sum, cards) => {
    return sum + cards.filter((card) => isKanbanCardComplete(card)).length;
  }, 0);
}

function getHomeTodoCount(workspace) {
  const homeState = getHomeState(workspace);
  return homeState.todos.filter((item) => !item.done).length;
}

function getHomeGroceryCount(workspace) {
  const homeState = getHomeState(workspace);
  return homeState.groceries.filter((item) => !item.done).length;
}

function isKanbanCardComplete(card) {
  const subtasks = Array.isArray(card?.subtasks) ? card.subtasks : [];
  return subtasks.length ? subtasks.every((subtask) => Boolean(subtask.done)) : card?.columnId === "done";
}

function normalizeCaptureBoard(value) {
  const strokes = Array.isArray(value?.strokes)
    ? value.strokes.map((stroke) => ({
        color: typeof stroke.color === "string" ? stroke.color : "#7dd3fc",
        size: Number.isFinite(Number(stroke.size)) ? Math.min(24, Math.max(2, Number(stroke.size))) : 3,
        points: Array.isArray(stroke.points)
          ? stroke.points
              .map((point) => ({
                x: Number(point.x),
                y: Number(point.y)
              }))
              .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
          : []
      }))
    : [];
  return { strokes };
}

function wireCaptureCalculator(workspaceId) {
  const displayEl = capturePanelEl.querySelector("#capture-calc-display");
  if (!displayEl) {
    return;
  }

  const buttons = capturePanelEl.querySelectorAll("[data-calc-key]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.calcKey;
      const currentValue = displayEl.value;
      if (key === "clear") {
        displayEl.value = "";
      } else if (key === "back") {
        displayEl.value = currentValue.slice(0, -1);
      } else if (key === "equals") {
        displayEl.value = evaluateCalculatorExpression(currentValue);
      } else {
        displayEl.value = `${currentValue}${key}`;
      }
      setCaptureCalculatorValue(workspaceId, displayEl.value);
      displayEl.focus();
    });
  });

  displayEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    displayEl.value = evaluateCalculatorExpression(displayEl.value);
    setCaptureCalculatorValue(workspaceId, displayEl.value);
  });
}

function evaluateCalculatorExpression(value) {
  const expression = String(value || "").trim();
  if (!expression) {
    return "";
  }

  if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
    return "Error";
  }

  try {
    // The expression is sanitized to calculator characters only.
    const result = Function(`"use strict"; return (${expression});`)();
    return Number.isFinite(result) ? String(result) : "Error";
  } catch {
    return "Error";
  }
}

function renderCalculatorButtons() {
  const keys = [
    ["7", "8", "9", "÷"],
    ["4", "5", "6", "×"],
    ["1", "2", "3", "-"],
    ["0", ".", "%", "+"]
  ];
  const controls = [
    { label: "C", key: "clear" },
    { label: "⌫", key: "back" },
    { label: "=", key: "equals" }
  ];

  const buttonMarkup = keys
    .map((row) =>
      row
        .map((key) => {
          const mappedKey = key === "×" ? "*" : key === "÷" ? "/" : key;
          return `<button class="button button-compact capture-calc-key" type="button" data-calc-key="${escapeHtml(mappedKey)}">${escapeHtml(key)}</button>`;
        })
        .join("")
    )
    .join("");

  const controlMarkup = controls
    .map(
      (control) =>
        `<button class="button button-compact ${control.key === "equals" ? "button-primary" : ""} capture-calc-key" type="button" data-calc-key="${escapeHtml(control.key)}">${escapeHtml(control.label)}</button>`
    )
    .join("");

  return `${buttonMarkup}${controlMarkup}`;
}

function wireCaptureBoard(workspaceId, boardState) {
  const canvas = capturePanelEl.querySelector("#capture-board");
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  canvas.style.touchAction = "none";
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width || 960));
  const height = Math.max(220, Math.floor(rect.height || 320));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawCaptureBoard(context, boardState, width, height);

  const toolbar = capturePanelEl.querySelector(".capture-board-toolbar");
  toolbar?.querySelector('[data-capture-action="clear-board"]')?.addEventListener("click", () => {
    saveCaptureBoard(workspaceId, { strokes: [] });
    renderWorkspace(getWorkspace(appState.workspaceId));
  });
  toolbar?.querySelector('[data-capture-action="undo"]')?.addEventListener("click", () => {
    const nextState = normalizeCaptureBoard(getStoredCaptureBoard(workspaceId));
    nextState.strokes.pop();
    saveCaptureBoard(workspaceId, nextState);
    renderWorkspace(getWorkspace(appState.workspaceId));
  });

  let drawing = false;
  let currentStroke = null;

  const toPoint = (event) => {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    };
  };

  const redraw = () => {
    drawCaptureBoard(context, boardState, width, height);
  };

  const startStroke = (event) => {
    event.preventDefault();
    drawing = true;
    canvas.setPointerCapture?.(event.pointerId);
    currentStroke = {
      color: window.getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#7dd3fc",
      size: 3,
      points: [toPoint(event)]
    };
    boardState.strokes.push(currentStroke);
    redraw();
  };

  const moveStroke = (event) => {
    if (!drawing || !currentStroke) {
      return;
    }
    currentStroke.points.push(toPoint(event));
    redraw();
  };

  const endStroke = (event) => {
    if (!drawing) {
      return;
    }
    drawing = false;
    currentStroke = null;
    if (event?.pointerId !== undefined && canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    saveCaptureBoard(workspaceId, boardState);
    redraw();
  };

  canvas.addEventListener("pointerdown", startStroke);
  canvas.addEventListener("pointermove", moveStroke);
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);
}

function drawCaptureBoard(context, boardState, width, height) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,0.02)";
  context.fillRect(0, 0, width, height);
  const state = normalizeCaptureBoard(boardState);
  for (const stroke of state.strokes) {
    if (!stroke.points.length) {
      continue;
    }
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.size;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    stroke.points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.stroke();
  }
}

function applyCaptureFollowLayout(workspaceId) {
  if (!captureWidgetEl) {
    return;
  }

  const enabled = getStoredCaptureFollow(workspaceId);
  const side = getStoredCaptureFollowSide(workspaceId);
  const width = enabled ? "410px" : "0px";

  captureWidgetEl.draggable = !enabled;
  captureWidgetEl.classList.toggle("is-following", enabled);
  captureWidgetEl.dataset.captureFollowSide = side;
  document.body.classList.toggle("capture-follow-active", enabled);
  document.body.classList.toggle("capture-follow-side-left", enabled && side === "left");
  document.body.classList.toggle("capture-follow-side-right", enabled && side !== "left");
  document.body.style.setProperty("--capture-follow-width", width);
}

function getInitialTheme() {
  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyThemeMode(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  appState.theme = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
  updateThemeToggleLabel();
}

function toggleTheme() {
  applyThemeMode(appState.theme === "light" ? "dark" : "light");
}

function updateThemeToggleLabel() {
  if (!themeToggleEl) {
    return;
  }

  const nextTheme = appState.theme === "light" ? "dark" : "light";
  themeToggleEl.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
  themeToggleEl.setAttribute("title", `Switch to ${nextTheme} mode`);
  themeToggleEl.setAttribute("aria-pressed", String(appState.theme === "light"));
}

function getInitialMotivationVisibility() {
  const storedVisibility = localStorage.getItem(STORAGE_KEYS.motivationVisible);
  if (storedVisibility === "false") {
    return false;
  }

  return true;
}

function toggleMotivationVisibility() {
  applyMotivationVisibility(!appState.motivationVisible);
}

function applyMotivationVisibility(visible) {
  appState.motivationVisible = Boolean(visible);
  localStorage.setItem(STORAGE_KEYS.motivationVisible, String(appState.motivationVisible));
  if (motivationTileEl) {
    motivationTileEl.classList.toggle("is-hidden", !appState.motivationVisible);
  }
  updateMotivationToggleLabel();
}

function updateMotivationToggleLabel() {
  if (!motivationToggleEl) {
    return;
  }

  const nextAction = appState.motivationVisible ? "Hide" : "Show";
  motivationToggleEl.setAttribute("aria-label", `${nextAction} motivation quote`);
  motivationToggleEl.setAttribute("title", `${nextAction} motivation quote`);
  motivationToggleEl.setAttribute("aria-pressed", String(!appState.motivationVisible));
}

function openDrawer(mode = "workspace") {
  appState.drawerMode = mode;
  settingsDrawerEl.classList.remove("hidden");
  drawerBackdropEl.classList.remove("hidden");
  settingsDrawerEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  syncDrawerMode();
  if (mode === "workspace") {
    clearTransientEditorState();
    fillTaskForm(appState.workspaceId, "");
    fillCalendarForm(appState.workspaceId, "");
    fillStoryForm(appState.workspaceId, "");
    fillFlashcardForm(appState.workspaceId, "");
  }
  syncDrawerSelections();
  settingsCloseEl.focus();
}

function closeDrawer() {
  appState.drawerMode = "closed";
  settingsDrawerEl.classList.add("hidden");
  drawerBackdropEl.classList.add("hidden");
  settingsDrawerEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  clearTransientEditorState();
}

function clearTransientEditorState() {
  appState.editingTask = null;
  appState.editingSchedule = null;
  appState.editingEvent = null;
  appState.editingStory = null;
  appState.editingFlashcard = null;
  taskFormCardIdEl.value = "";
  scheduleFormItemIdEl.value = "";
  calendarFormEventIndexEl.value = "";
  storyFormCardIdEl.value = "";
  flashcardFormCardIdEl.value = "";
  taskFormDeleteEl.disabled = true;
  scheduleFormDeleteEl.disabled = true;
  calendarFormDeleteEl.disabled = true;
  storyFormDeleteEl.disabled = true;
  flashcardFormDeleteEl.disabled = true;
}

function syncDrawerSelections() {
  if (!settingsDrawerEl || settingsDrawerEl.classList.contains("hidden")) {
    return;
  }

  fillWorkspaceSettingsForm(workspaceSettingsWorkspaceEl.value || appState.workspaceId);
  fillBackendSyncForm();
  fillCognitoSettingsForm();
  if (appState.drawerMode === "workspace") {
    return;
  }
  if (appState.editingTask || taskFormCardIdEl.value) {
    fillTaskForm(taskFormWorkspaceEl.value || appState.workspaceId, taskFormCardIdEl.value || appState.editingTask?.cardId || "");
  }
  if (appState.editingSchedule || scheduleFormItemIdEl.value) {
    fillScheduleForm(
      scheduleFormWorkspaceEl.value || appState.workspaceId,
      scheduleFormItemIdEl.value || String(appState.editingSchedule?.itemId ?? ""),
      scheduleFormDayEl.value || appState.scheduleDay
    );
  }
  if (appState.editingEvent || calendarFormEventIndexEl.value) {
    fillCalendarForm(
      calendarFormWorkspaceEl.value || appState.workspaceId,
      calendarFormEventIndexEl.value || String(appState.editingEvent?.eventIndex ?? "")
    );
  }
  if (appState.editingStory || storyFormCardIdEl.value) {
    fillStoryForm(appState.workspaceId, storyFormCardIdEl.value || String(appState.editingStory?.cardId ?? ""));
  }
  if (appState.editingFlashcard || flashcardFormCardIdEl.value) {
    fillFlashcardForm(
      flashcardFormWorkspaceEl.value || appState.workspaceId,
      flashcardFormCardIdEl.value || String(appState.editingFlashcard?.cardId ?? "")
    );
  }
}

function syncDrawerMode() {
  const mode = appState.drawerMode;
  const isWorkspace = mode === "workspace" || mode === "settings";
  const isTask = mode === "task";
  const isSchedule = mode === "schedule";
  const isCalendar = mode === "calendar";
  const isStory = mode === "story";
  const isFlashcard = mode === "flashcard";

  drawerTitleEl.textContent = isWorkspace ? "Workspace settings" : isTask ? "Task editor" : isSchedule ? "Schedule editor" : isCalendar ? "Calendar editor" : isStory ? "Work story editor" : "Flashcard editor";
  drawerWorkspaceSectionEl.classList.toggle("hidden", !isWorkspace);
  drawerTaskSectionEl.classList.toggle("hidden", !isTask);
  drawerScheduleSectionEl.classList.toggle("hidden", !isSchedule);
  drawerCalendarSectionEl.classList.toggle("hidden", !isCalendar);
  drawerStorySectionEl.classList.toggle("hidden", !isStory);
  drawerFlashcardSectionEl.classList.toggle("hidden", !isFlashcard);
}

function fillWorkspaceSettingsForm(workspaceId) {
  const workspace = getWorkspace(workspaceId);
  workspaceSettingsWorkspaceEl.value = workspace.id;
  workspaceSettingsLabelEl.value = workspace.label || "";
  workspaceSettingsTitleEl.value = workspace.title || "";
  workspaceSettingsDescriptionEl.value = workspace.description || "";
  workspaceSettingsAccentEl.value = normalizeHexColor(workspace.accent || defaultConfig.workspaces[0].accent);
  workspaceSettingsAccent2El.value = normalizeHexColor(workspace.accent2 || defaultConfig.workspaces[0].accent2);
  workspaceSettingsDefaultEl.value = config.defaultWorkspace || defaultConfig.defaultWorkspace || config.workspaces[0].id;
  syncHomeCalendarSection(workspace);
}

function getBackendSyncConfig() {
  return {
    baseUrl: String(config.apiBaseUrl || localStorage.getItem(STORAGE_KEYS.backendApiBaseUrl) || "").trim().replace(/\/+$/, ""),
    accessToken: String(config.apiAccessToken || localStorage.getItem(STORAGE_KEYS.backendApiToken) || "").trim()
  };
}

function fillBackendSyncForm() {
  if (!backendSyncFormEl) {
    return;
  }

  const backendSync = getBackendSyncConfig();
  if (backendSyncBaseUrlEl) {
    backendSyncBaseUrlEl.value = backendSync.baseUrl;
  }
  if (backendSyncCurrentEl) {
    backendSyncCurrentEl.disabled = !backendSync.baseUrl;
  }
  if (backendSyncClearEl) {
    backendSyncClearEl.disabled = !backendSync.baseUrl;
  }
  updateBackendSyncStatus();
}

function updateBackendSyncStatus(message = "") {
  if (!backendSyncStatusEl) {
    return;
  }

  if (message) {
    backendSyncStatusEl.textContent = message;
    return;
  }

  const backendSync = getBackendSyncConfig();
  backendSyncStatusEl.textContent = backendSync.baseUrl
    ? `Cloud sync ready at ${backendSync.baseUrl}.`
    : "No cloud sync configured yet.";
}

function loadRuntimeConfig() {
  return window.__MYAXIS_RUNTIME_CONFIG__ || {};
}

function persistBackendSyncConfig({ baseUrl = "", accessToken = "" }) {
  const nextBaseUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
  const nextAccessToken = String(accessToken || "").trim();

  if (nextBaseUrl) {
    localStorage.setItem(STORAGE_KEYS.backendApiBaseUrl, nextBaseUrl);
  } else {
    localStorage.removeItem(STORAGE_KEYS.backendApiBaseUrl);
  }

  if (nextAccessToken) {
    localStorage.setItem(STORAGE_KEYS.backendApiToken, nextAccessToken);
  } else {
    localStorage.removeItem(STORAGE_KEYS.backendApiToken);
  }

  fillBackendSyncForm();
}

function handleBackendSyncSubmit(event) {
  event.preventDefault();
  persistBackendSyncConfig({
    baseUrl: backendSyncBaseUrlEl?.value || "",
    accessToken: ""
  });
  updateBackendSyncStatus("Cloud sync settings saved locally.");
}

async function handleBackendSyncCurrentClick() {
  const backendSync = getBackendSyncConfig();
  if (!backendSync.baseUrl) {
    window.alert("Save your cloud sync settings first.");
    return;
  }

  const authorizationToken = await resolveBackendAuthorizationToken().catch(() => "");
  if (!authorizationToken) {
    window.alert("Sign in with Cognito or add a backend token before syncing.");
    return;
  }

  const workspace = getWorkspace(appState.workspaceId);
  await syncWorkspaceSettingsToBackend(workspace.id);
  await syncWorkspaceStateToBackend(workspace.id);
  if (workspace.id === "home") {
    await syncHomeCalendarConnectionToBackend("home");
  }
  updateBackendSyncStatus(`Synced ${workspace.label || workspace.id} to cloud.`);
}

function handleBackendSyncClearClick() {
  if (!window.confirm("Clear the saved cloud sync URL and legacy token from this browser?")) {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.backendApiBaseUrl);
  localStorage.removeItem(STORAGE_KEYS.backendApiToken);
  fillBackendSyncForm();
}

function getStoredCognitoSettings() {
  return readStoredJson(STORAGE_KEYS.cognitoSettings, {});
}

function getCognitoSettings() {
  const stored = getStoredCognitoSettings();
  const redirectUri = String(stored.redirectUri || config.cognitoRedirectUri || `${window.location.origin}/`).trim();
  const logoutUri = String(stored.logoutUri || config.cognitoLogoutUri || `${window.location.origin}/`).trim();

  return {
    region: String(stored.region || config.cognitoRegion || "us-east-1").trim(),
    userPoolId: String(stored.userPoolId || config.cognitoUserPoolId || "").trim(),
    clientId: String(stored.clientId || config.cognitoClientId || "").trim(),
    hostedUiDomain: String(stored.hostedUiDomain || config.cognitoHostedUiDomain || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""),
    redirectUri,
    logoutUri
  };
}

function fillCognitoSettingsForm() {
  if (!cognitoSettingsFormEl) {
    return;
  }

  const settings = getCognitoSettings();
  if (cognitoRegionEl) {
    cognitoRegionEl.value = settings.region;
  }
  if (cognitoUserPoolIdEl) {
    cognitoUserPoolIdEl.value = settings.userPoolId;
  }
  if (cognitoClientIdEl) {
    cognitoClientIdEl.value = settings.clientId;
  }
  if (cognitoHostedUiDomainEl) {
    cognitoHostedUiDomainEl.value = settings.hostedUiDomain;
  }
  if (cognitoRedirectUriEl) {
    cognitoRedirectUriEl.value = settings.redirectUri;
  }
  if (cognitoLogoutUriEl) {
    cognitoLogoutUriEl.value = settings.logoutUri;
  }

  updateCognitoStatus();
}

function updateCognitoStatus(message = "") {
  if (!cognitoStatusEl) {
    return;
  }

  if (message) {
    cognitoStatusEl.textContent = message;
    return;
  }

  const settings = getCognitoSettings();
  const session = getStoredCognitoSession();
  if (!settings.clientId || !settings.hostedUiDomain || !settings.userPoolId) {
    cognitoStatusEl.textContent = "No Cognito sign-in configured yet.";
    return;
  }

  if (!session) {
    cognitoStatusEl.textContent = `Configured for ${settings.userPoolId}. Sign in to use cloud sync.`;
    return;
  }

  const userLabel = session.email || session.name || session.sub || "signed in";
  cognitoStatusEl.textContent = session.expiresAt && Date.now() < session.expiresAt
    ? `Signed in as ${userLabel}.`
    : session.refreshToken
      ? `Signed in as ${userLabel}; session will refresh when needed.`
      : `Signed in as ${userLabel}; please sign in again soon.`;
}

function persistCognitoSettings(settings) {
  const nextSettings = {
    region: String(settings.region || "").trim(),
    userPoolId: String(settings.userPoolId || "").trim(),
    clientId: String(settings.clientId || "").trim(),
    hostedUiDomain: String(settings.hostedUiDomain || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""),
    redirectUri: String(settings.redirectUri || "").trim() || `${window.location.origin}/`,
    logoutUri: String(settings.logoutUri || "").trim() || `${window.location.origin}/`
  };

  localStorage.setItem(STORAGE_KEYS.cognitoSettings, JSON.stringify(nextSettings));
  fillCognitoSettingsForm();
}

function handleCognitoSettingsSubmit(event) {
  event.preventDefault();
  persistCognitoSettings({
    region: cognitoRegionEl?.value || "",
    userPoolId: cognitoUserPoolIdEl?.value || "",
    clientId: cognitoClientIdEl?.value || "",
    hostedUiDomain: cognitoHostedUiDomainEl?.value || "",
    redirectUri: cognitoRedirectUriEl?.value || "",
    logoutUri: cognitoLogoutUriEl?.value || ""
  });
  updateCognitoStatus("Cognito settings saved locally.");
}

async function handleCognitoLoginClick() {
  const settings = getCognitoSettings();
  if (!settings.clientId || !settings.hostedUiDomain || !settings.userPoolId) {
    window.alert("Fill out the Cognito settings before signing in.");
    return;
  }

  const transaction = await createCognitoTransaction();
  localStorage.setItem(STORAGE_KEYS.cognitoTransaction, JSON.stringify(transaction));
  const authorizeUrl = new URL(`https://${settings.hostedUiDomain}/oauth2/authorize`);
  authorizeUrl.searchParams.set("client_id", settings.clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("redirect_uri", settings.redirectUri);
  authorizeUrl.searchParams.set("state", transaction.state);
  authorizeUrl.searchParams.set("code_challenge", transaction.codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  window.location.assign(authorizeUrl.toString());
}

async function handleCognitoLogoutClick() {
  const settings = getCognitoSettings();
  clearStoredCognitoSession();
  updateCognitoStatus("Signed out.");
  if (settings.clientId && settings.hostedUiDomain) {
    const logoutUrl = new URL(`https://${settings.hostedUiDomain}/logout`);
    logoutUrl.searchParams.set("client_id", settings.clientId);
    logoutUrl.searchParams.set("logout_uri", settings.logoutUri);
    window.location.assign(logoutUrl.toString());
  } else {
    fillCognitoSettingsForm();
  }
}

async function handleCognitoRedirect() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    const message = errorDescription || error;
    window.alert(`Cognito sign-in failed: ${message}`);
    updateCognitoStatus(`Sign-in failed: ${message}`);
    return;
  }

  if (!code || !state) {
    await maybeRefreshCognitoSession();
    return;
  }

  const transaction = readStoredJson(STORAGE_KEYS.cognitoTransaction, null);
  if (!transaction || transaction.state !== state) {
    window.alert("That sign-in session could not be verified. Try again.");
    return;
  }

  const settings = getCognitoSettings();
  const session = await exchangeCognitoCodeForSession(settings, code, transaction.codeVerifier);
  saveCognitoSession(session);
  localStorage.removeItem(STORAGE_KEYS.cognitoTransaction);
  url.search = "";
  window.history.replaceState({}, document.title, url.toString());
  fillCognitoSettingsForm();
  updateCognitoStatus("Signed in successfully.");
  await hydrateBackendAccountState();
}

function getStoredCognitoSession() {
  const session = readStoredJson(STORAGE_KEYS.cognitoSession, null);
  if (!session || typeof session !== "object") {
    return null;
  }

  if (!session.accessToken && !session.idToken) {
    return null;
  }

  return session;
}

function saveCognitoSession(session) {
  const normalized = normalizeCognitoSession(session);
  localStorage.setItem(STORAGE_KEYS.cognitoSession, JSON.stringify(normalized));
  fillCognitoSettingsForm();
}

function clearStoredCognitoSession() {
  localStorage.removeItem(STORAGE_KEYS.cognitoSession);
  localStorage.removeItem(STORAGE_KEYS.cognitoTransaction);
  fillCognitoSettingsForm();
}

function normalizeCognitoSession(session) {
  const claims = parseJwtClaims(session?.idToken || session?.accessToken || "");
  return {
    accessToken: String(session?.accessToken || "").trim(),
    idToken: String(session?.idToken || "").trim(),
    refreshToken: String(session?.refreshToken || "").trim(),
    expiresAt: Number(session?.expiresAt || 0),
    tokenType: String(session?.tokenType || "Bearer").trim(),
    scope: String(session?.scope || "").trim(),
    sub: String(claims.sub || "").trim(),
    email: String(claims.email || claims.username || "").trim(),
    name: String(claims.name || claims.preferred_username || claims.email || "").trim()
  };
}

function parseJwtClaims(token) {
  const parts = String(token || "").split(".");
  if (parts.length < 2) {
    return {};
  }

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

async function maybeRefreshCognitoSession() {
  const session = getStoredCognitoSession();
  const settings = getCognitoSettings();
  if (!session || !session.refreshToken || !settings.clientId || !settings.hostedUiDomain) {
    return session;
  }

  if (session.expiresAt && Date.now() < session.expiresAt - 60_000) {
    return session;
  }

  const refreshed = await refreshCognitoSession(settings, session.refreshToken);
  saveCognitoSession(refreshed);
  return refreshed;
}

async function resolveBackendAuthorizationToken() {
  const session = await maybeRefreshCognitoSession().catch(() => getStoredCognitoSession());
  if (session?.idToken) {
    return session.idToken;
  }
  if (session?.accessToken) {
    return session.accessToken;
  }
  const backendSync = getBackendSyncConfig();
  return backendSync.accessToken || "";
}

async function createCognitoTransaction() {
  const codeVerifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const codeChallenge = await sha256CodeChallenge(codeVerifier);
  return {
    state: base64UrlEncode(crypto.getRandomValues(new Uint8Array(16))),
    codeVerifier,
    codeChallenge
  };
}

async function exchangeCognitoCodeForSession(settings, code, codeVerifier) {
  const tokenUrl = new URL(`https://${settings.hostedUiDomain}/oauth2/token`);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: settings.clientId,
    code,
    redirect_uri: settings.redirectUri,
    code_verifier: codeVerifier
  });

  const response = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.error || "Unable to complete Cognito sign-in.");
  }

  return normalizeCognitoSession({
    accessToken: payload.access_token,
    idToken: payload.id_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Math.max(0, Number(payload.expires_in || 3600)) * 1000,
    tokenType: payload.token_type,
    scope: payload.scope
  });
}

async function refreshCognitoSession(settings, refreshToken) {
  const tokenUrl = new URL(`https://${settings.hostedUiDomain}/oauth2/token`);
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: settings.clientId,
    refresh_token: refreshToken
  });

  const response = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.error || "Unable to refresh Cognito session.");
  }

  return normalizeCognitoSession({
    accessToken: payload.access_token,
    idToken: payload.id_token || payload.access_token,
    refreshToken,
    expiresAt: Date.now() + Math.max(0, Number(payload.expires_in || 3600)) * 1000,
    tokenType: payload.token_type,
    scope: payload.scope
  });
}

async function sha256CodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(bytes) {
  let base64 = "";
  for (const byte of bytes) {
    base64 += String.fromCharCode(byte);
  }
  return btoa(base64).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hydrateBackendAccountState() {
  const backendSync = getBackendSyncConfig();
  if (!backendSync.baseUrl) {
    return null;
  }

  const payload = await backendRequest("/v1/me");
  if (!payload || !payload.ok) {
    return null;
  }

  let nextDefaultWorkspace = config.defaultWorkspace;
  let overridesChanged = false;

  if (Array.isArray(payload.workspaceSettings)) {
    const nextOverrides = readStoredJson(STORAGE_KEYS.uiOverrides, {});
    const nextWorkspaces = Array.isArray(nextOverrides.workspaces) ? [...nextOverrides.workspaces] : [];

    for (const item of payload.workspaceSettings) {
      const workspaceId = String(item?.workspaceId || "").trim();
      if (!workspaceId || !config.workspaces.some((workspace) => workspace.id === workspaceId)) {
        continue;
      }

      const settings = normalizeBackendWorkspaceSettings(item.settings);
      if (!Object.keys(settings).length) {
        continue;
      }

      const index = nextWorkspaces.findIndex((workspace) => workspace.id === workspaceId);
      const nextWorkspace = {
        ...(index === -1 ? { id: workspaceId } : nextWorkspaces[index]),
        ...settings,
        id: workspaceId
      };

      if (index === -1) {
        nextWorkspaces.push(nextWorkspace);
      } else {
        nextWorkspaces[index] = nextWorkspace;
      }

      if (settings.defaultWorkspace) {
        nextDefaultWorkspace = settings.defaultWorkspace;
      }

      overridesChanged = true;
    }

    if (overridesChanged) {
      uiOverrides = {
        ...nextOverrides,
        defaultWorkspace: nextDefaultWorkspace,
        workspaces: nextWorkspaces
      };
      persistUiOverrides();
    }
  }

  if (Array.isArray(payload.calendarConnections)) {
    for (const item of payload.calendarConnections) {
      const workspaceId = String(item?.workspaceId || "").trim();
      if (!workspaceId || !config.workspaces.some((workspace) => workspace.id === workspaceId)) {
        continue;
      }

      const connection = normalizeBackendCalendarConnection(item.connection);
      if (connection) {
        saveHomeCalendarConnection(workspaceId, connection);
      }
    }
  }

  if (Array.isArray(payload.workspaceStates)) {
    for (const item of payload.workspaceStates) {
      applyBackendWorkspaceRecord(item);
    }
  }

  if (overridesChanged) {
    config = mergeDashboardConfig(defaultConfig, importedConfig, runtimeConfig, localConfig, uiOverrides);
    populateEditorSelects();
  }

  fillBackendSyncForm();
  renderTabs();
  renderWorkspace(getWorkspace(appState.workspaceId));
  updateBackendSyncStatus("Cloud sync loaded from your account.");
  return payload;
}

async function syncWorkspaceSettingsToBackend(workspaceId) {
  const backendSync = getBackendSyncConfig();
  if (!backendSync.baseUrl) {
    return null;
  }

  const workspace = getWorkspace(workspaceId);
  const payload = {
    label: workspace.label || "",
    title: workspace.title || "",
    description: workspace.description || "",
    accent: workspace.accent || "",
    accent2: workspace.accent2 || "",
    defaultWorkspace: config.defaultWorkspace || ""
  };

  return backendRequest(`/v1/workspaces/${encodeURIComponent(workspaceId)}/settings`, {
    method: "PUT",
    body: payload
  });
}

async function syncWorkspaceStateToBackend(workspaceId) {
  const backendSync = getBackendSyncConfig();
  if (!backendSync.baseUrl) {
    return null;
  }

  const snapshot = getWorkspaceBackendSnapshot(workspaceId);
  return backendRequest(`/v1/workspaces/${encodeURIComponent(workspaceId)}/state`, {
    method: "PUT",
    body: snapshot
  });
}

async function syncHomeCalendarConnectionToBackend(workspaceId) {
  const backendSync = getBackendSyncConfig();
  if (!backendSync.baseUrl) {
    return null;
  }

  const connection = getHomeCalendarConnection(workspaceId);
  if (!connection.enabled || !connection.clientId) {
    return backendRequest(`/v1/workspaces/${encodeURIComponent(workspaceId)}/calendar-connection`, {
      method: "DELETE"
    }).catch(() => null);
  }

  return backendRequest(`/v1/workspaces/${encodeURIComponent(workspaceId)}/calendar-connection`, {
    method: "PUT",
    body: {
      provider: connection.provider || "google",
      enabled: Boolean(connection.enabled),
      clientId: connection.clientId,
      calendarId: connection.calendarId || "primary",
      label: getWorkspace(workspaceId).label || workspaceId,
      sourceWorkspaceId: workspaceId
    }
  });
}

async function backendRequest(path, options = {}) {
  const backendSync = getBackendSyncConfig();
  if (!backendSync.baseUrl) {
    return null;
  }

  const authorizationToken = await resolveBackendAuthorizationToken().catch(() => "");
  if (!authorizationToken) {
    return null;
  }

  const requestUrl = new URL(path, backendSync.baseUrl).toString();
  const requestOptions = async () => ({
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${authorizationToken}`,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let response = await fetch(requestUrl, await requestOptions());
  if (response.status === 401) {
    await maybeRefreshCognitoSession().catch(() => null);
    const refreshedToken = await resolveBackendAuthorizationToken().catch(() => "");
    if (!refreshedToken) {
      return null;
    }
    response = await fetch(requestUrl, {
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${refreshedToken}`,
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error || `Backend request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

function normalizeBackendWorkspaceSettings(settings) {
  if (!settings || typeof settings !== "object") {
    return {};
  }

  const normalized = {};

  if (String(settings.label || "").trim()) {
    normalized.label = String(settings.label).trim();
  }

  if (String(settings.title || "").trim()) {
    normalized.title = String(settings.title).trim();
  }

  if (String(settings.description || "").trim()) {
    normalized.description = String(settings.description).trim();
  }

  if (String(settings.accent || "").trim()) {
    normalized.accent = normalizeHexColor(settings.accent);
  }

  if (String(settings.accent2 || "").trim()) {
    normalized.accent2 = normalizeHexColor(settings.accent2);
  }

  for (const key of ["stats", "schedule", "kanban", "calendar", "goals"]) {
    if (Array.isArray(settings[key])) {
      normalized[key] = settings[key];
    }
  }

  if (settings.spotlight && typeof settings.spotlight === "object") {
    normalized.spotlight = settings.spotlight;
  }

  for (const key of ["quote", "captureHint", "scratchpadKey", "eyebrow"]) {
    if (String(settings[key] || "").trim()) {
      normalized[key] = String(settings[key]).trim();
    }
  }

  if (String(settings.defaultWorkspace || "").trim()) {
    normalized.defaultWorkspace = String(settings.defaultWorkspace).trim();
  }

  return normalized;
}

function normalizeBackendCalendarConnection(connection) {
  if (!connection || typeof connection !== "object") {
    return null;
  }

  return {
    provider: connection.provider === "google" ? "google" : "google",
    enabled: Boolean(connection.enabled),
    clientId: String(connection.clientId || "").trim(),
    calendarId: String(connection.calendarId || "primary").trim() || "primary",
    lastSyncAt: String(connection.lastSyncAt || ""),
    lastError: String(connection.lastError || "")
  };
}

function getWorkspaceBackendSnapshot(workspaceId) {
  const workspace = getWorkspace(workspaceId);
  return {
    workspace: {
      id: workspace.id,
      label: workspace.label || "",
      eyebrow: workspace.eyebrow || "",
      title: workspace.title || "",
      description: workspace.description || "",
      accent: workspace.accent || "",
      accent2: workspace.accent2 || "",
      stats: Array.isArray(workspace.stats) ? workspace.stats : [],
      schedule: Array.isArray(workspace.schedule) ? workspace.schedule : [],
      kanban: Array.isArray(workspace.kanban) ? workspace.kanban : [],
      calendar: Array.isArray(workspace.calendar) ? workspace.calendar : [],
      goals: Array.isArray(workspace.goals) ? workspace.goals : [],
      spotlight: workspace.spotlight && typeof workspace.spotlight === "object" ? workspace.spotlight : {},
      quote: workspace.quote || "",
      captureHint: workspace.captureHint || "",
      scratchpadKey: workspace.scratchpadKey || ""
    },
    state: {
      scratchpad: localStorage.getItem(workspace.scratchpadKey) || "",
      kanban: getKanbanState(workspace),
      schedule: getScheduleState(workspace),
      home: getHomeState(workspace),
      homeCalendarConnection: getHomeCalendarConnection(workspace.id),
      homeCalendarCache: getHomeCalendarCache(workspace.id),
      hiddenCalendarEvents: getHiddenCalendarEvents(workspace.id),
      calendarTodos: getCalendarTodoState(workspace.id),
      homeMenuDay: getStoredHomeMenuDay(workspace.id),
      captureMode: getStoredCaptureMode(workspace.id),
      captureFollow: getStoredCaptureFollow(workspace.id),
      captureFollowSide: getStoredCaptureFollowSide(workspace.id),
      captureAssistant: getStoredCaptureAssistant(workspace.id),
      flashcards: getFlashcardsState(workspace)
    }
  };
}

function applyBackendWorkspaceRecord(record) {
  if (!record || typeof record !== "object") {
    return;
  }

  const workspaceId = String(record.workspaceId || "").trim();
  if (!workspaceId || !config.workspaces.some((workspace) => workspace.id === workspaceId)) {
    return;
  }

  if (record.workspace && typeof record.workspace === "object") {
    const workspacePatch = normalizeBackendWorkspaceSettings(record.workspace);
    const patch = {
      id: workspaceId,
      ...workspacePatch
    };
    if (Object.keys(workspacePatch).length) {
      setWorkspaceOverride(workspaceId, patch);
    }
  }

  const state = record.state && typeof record.state === "object" ? record.state : {};
  const workspace = getWorkspace(workspaceId);

  if (typeof state.scratchpad === "string") {
    localStorage.setItem(workspace.scratchpadKey, state.scratchpad);
  }

  if (Array.isArray(state.kanban)) {
    saveKanbanState(workspaceId, state.kanban);
  }

  if (Array.isArray(state.schedule)) {
    saveScheduleState(workspaceId, normalizeScheduleEntries(state.schedule, workspaceId));
  }

  if (state.home && typeof state.home === "object") {
    saveHomeState(workspaceId, normalizeHomeState(state.home, workspace));
  }

  if (state.homeCalendarConnection && typeof state.homeCalendarConnection === "object") {
    saveHomeCalendarConnection(workspaceId, {
      provider: state.homeCalendarConnection.provider === "google" ? "google" : "google",
      enabled: Boolean(state.homeCalendarConnection.enabled),
      clientId: String(state.homeCalendarConnection.clientId || "").trim(),
      calendarId: String(state.homeCalendarConnection.calendarId || "primary").trim() || "primary",
      lastSyncAt: String(state.homeCalendarConnection.lastSyncAt || ""),
      lastError: String(state.homeCalendarConnection.lastError || "")
    });
  }

  if (Array.isArray(state.homeCalendarCache)) {
    saveHomeCalendarCache(workspaceId, state.homeCalendarCache);
  }

  if (Array.isArray(state.hiddenCalendarEvents)) {
    saveHiddenCalendarEvents(workspaceId, state.hiddenCalendarEvents);
  }

  if (Array.isArray(state.calendarTodos)) {
    saveCalendarTodoState(workspaceId, state.calendarTodos);
  }

  if (typeof state.homeMenuDay === "string" && DAY_ORDER.includes(state.homeMenuDay)) {
    localStorage.setItem(getHomeMenuDayStorageKey(workspaceId), state.homeMenuDay);
  }

  if (typeof state.captureFollow === "boolean") {
    localStorage.setItem(getCaptureFollowStorageKey(workspaceId), String(state.captureFollow));
  }

  if (state.captureFollowSide === "left" || state.captureFollowSide === "right") {
    localStorage.setItem(getCaptureFollowSideStorageKey(workspaceId), state.captureFollowSide);
  }

  if (state.captureMode === "notes" || state.captureMode === "calculator" || state.captureMode === "board" || state.captureMode === "assistant") {
    localStorage.setItem(getCaptureModeStorageKey(workspaceId), state.captureMode);
  }

  if (state.captureAssistant && typeof state.captureAssistant === "object") {
    saveCaptureAssistant(workspaceId, state.captureAssistant);
  }

  if (Array.isArray(state.flashcards)) {
    saveFlashcardsState(workspaceId, normalizeFlashcards(state.flashcards));
  }
}

function syncHomeCalendarSection(workspaceOrId) {
  if (!homeCalendarSectionEl) {
    return;
  }

  const workspace = typeof workspaceOrId === "string" ? getWorkspace(workspaceOrId) : normalizeWorkspace(workspaceOrId);
  const isHome = workspace.id === "home";
  homeCalendarSectionEl.classList.toggle("hidden", !isHome);
  if (!isHome) {
    return;
  }

  fillHomeCalendarForm(workspace.id);
}

function fillHomeCalendarForm(workspaceId) {
  const connection = getHomeCalendarConnection(workspaceId);
  if (homeCalendarClientIdEl) {
    homeCalendarClientIdEl.value = connection.clientId || "";
  }
  if (homeCalendarCalendarIdEl) {
    homeCalendarCalendarIdEl.value = connection.calendarId || "primary";
  }
  if (homeCalendarEnabledEl) {
    homeCalendarEnabledEl.checked = Boolean(connection.enabled);
  }
  if (homeCalendarSyncEl) {
    homeCalendarSyncEl.disabled = !connection.clientId;
  }
  if (homeCalendarDisconnectEl) {
    homeCalendarDisconnectEl.disabled = !connection.enabled && !connection.clientId && !getHomeCalendarCache(workspaceId).length;
  }
  if (homeCalendarStatusEl) {
    const status = connection.enabled
      ? connection.lastError
        ? `Sync error: ${connection.lastError}`
        : connection.lastSyncAt
          ? `Connected to Google Calendar. Last sync: ${formatRelativeSyncTime(connection.lastSyncAt)}`
          : "Connected to Google Calendar. Sync now to import events."
      : "No calendar connected yet.";
    homeCalendarStatusEl.textContent = status;
  }
}

function formatRelativeSyncTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function handleHomeCalendarSubmit(event) {
  event.preventDefault();
  if (workspaceSettingsWorkspaceEl.value !== "home") {
    return;
  }

  const connection = {
    provider: "google",
    enabled: Boolean(homeCalendarEnabledEl.checked),
    clientId: String(homeCalendarClientIdEl.value || "").trim(),
    calendarId: String(homeCalendarCalendarIdEl.value || "primary").trim() || "primary",
    lastSyncAt: getHomeCalendarConnection("home").lastSyncAt || "",
    lastError: getHomeCalendarConnection("home").lastError || ""
  };

  if (connection.enabled && !connection.clientId) {
    window.alert("Add your Google OAuth client ID before enabling sync.");
    return;
  }

  saveHomeCalendarConnection("home", connection);
  fillHomeCalendarForm("home");
  syncHomeCalendarConnectionToBackend("home").catch((error) => {
    console.warn("Unable to sync calendar connection to backend.", error);
    updateBackendSyncStatus("Saved locally. Backend sync needs attention.");
  });
}

async function handleHomeCalendarSyncClick() {
  const clientId = String(homeCalendarClientIdEl?.value || "").trim();
  const calendarId = String(homeCalendarCalendarIdEl?.value || "primary").trim() || "primary";

  if (!clientId) {
    window.alert("Add your Google OAuth client ID first.");
    return;
  }

  if (homeCalendarEnabledEl) {
    homeCalendarEnabledEl.checked = true;
  }

  saveHomeCalendarConnection("home", {
    ...getHomeCalendarConnection("home"),
    enabled: true,
    clientId,
    calendarId
  });
  fillHomeCalendarForm("home");
  syncHomeCalendarConnectionToBackend("home").catch((error) => {
    console.warn("Unable to sync calendar connection to backend.", error);
  });
  await syncHomeGoogleCalendar("home", { interactive: true });
}

function disconnectHomeGoogleCalendar() {
  clearHomeCalendarConnection("home");
  fillHomeCalendarForm("home");
  syncHomeCalendarConnectionToBackend("home").catch((error) => {
    console.warn("Unable to delete calendar connection from backend.", error);
  });
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function maybeSyncHomeCalendar(workspace) {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  if (normalizedWorkspace.id !== "home") {
    return;
  }

  const connection = getHomeCalendarConnection(normalizedWorkspace.id);
  if (!connection.enabled || !connection.clientId) {
    return;
  }

  const lastSyncAt = Date.parse(connection.lastSyncAt || "");
  const hasCache = getHomeCalendarCache(normalizedWorkspace.id).length > 0;
  if (hasCache && Number.isFinite(lastSyncAt) && Date.now() - lastSyncAt < HOME_CALENDAR_SYNC_INTERVAL_MS) {
    return;
  }

  syncHomeGoogleCalendar(normalizedWorkspace.id, { interactive: false }).catch((error) => {
    console.warn("Home calendar sync failed.", error);
  });
}

async function syncHomeGoogleCalendar(workspaceId, options = {}) {
  if (appState.homeCalendarSyncInFlight) {
    return;
  }

  const connection = getHomeCalendarConnection(workspaceId);
  if (!connection.enabled || !connection.clientId) {
    return;
  }

  appState.homeCalendarSyncInFlight = true;
  updateHomeCalendarStatus(workspaceId, "Syncing Google Calendar...");

  try {
    await loadGoogleIdentityScript();
    const token = await getGoogleCalendarAccessToken(connection.clientId, Boolean(options.interactive));
    const events = await fetchGoogleCalendarEvents(connection.calendarId, token.accessToken, appState.calendarAnchor);
    saveHomeCalendarCache(workspaceId, events);
    saveHomeCalendarConnection(workspaceId, {
      ...connection,
      lastSyncAt: new Date().toISOString(),
      lastError: ""
    });
    syncHomeCalendarConnectionToBackend(workspaceId).catch((error) => {
      console.warn("Unable to sync calendar connection to backend.", error);
    });
    if (workspaceId === appState.workspaceId) {
      renderWorkspace(getWorkspace(appState.workspaceId));
    } else {
      fillHomeCalendarForm(workspaceId);
    }
    updateHomeCalendarStatus(workspaceId, `Connected to Google Calendar. Last sync: ${formatRelativeSyncTime(new Date().toISOString())}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync Google Calendar.";
    saveHomeCalendarConnection(workspaceId, {
      ...connection,
      lastError: message
    });
    syncHomeCalendarConnectionToBackend(workspaceId).catch((syncError) => {
      console.warn("Unable to sync calendar connection error state to backend.", syncError);
    });
    updateHomeCalendarStatus(workspaceId, `Sync failed: ${message}`);
    if (options.interactive) {
      window.alert(message);
    }
  } finally {
    appState.homeCalendarSyncInFlight = false;
  }
}

function updateHomeCalendarStatus(workspaceId, message) {
  if (workspaceSettingsWorkspaceEl.value !== workspaceId || !homeCalendarStatusEl) {
    return;
  }

  homeCalendarStatusEl.textContent = message;
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (window.__googleIdentityScriptPromise) {
    return window.__googleIdentityScriptPromise;
  }

  window.__googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Google sign-in.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google sign-in."));
    document.head.appendChild(script);
  });

  return window.__googleIdentityScriptPromise;
}

function getGoogleCalendarTokenStorageKey(workspaceId) {
  return `${STORAGE_KEYS.calendarConnection}:token:${workspaceId}`;
}

function getStoredGoogleCalendarToken(workspaceId) {
  return readStoredJson(getGoogleCalendarTokenStorageKey(workspaceId), null);
}

function saveStoredGoogleCalendarToken(workspaceId, token) {
  localStorage.setItem(getGoogleCalendarTokenStorageKey(workspaceId), JSON.stringify(token));
}

function clearStoredGoogleCalendarToken(workspaceId) {
  localStorage.removeItem(getGoogleCalendarTokenStorageKey(workspaceId));
}

async function getGoogleCalendarAccessToken(clientId, interactive = false) {
  const storedToken = getStoredGoogleCalendarToken("home");
  if (storedToken && Number(storedToken.expiresAt) > Date.now() + 30000) {
    return storedToken;
  }

  const tokenResponse = await requestGoogleAccessToken(clientId, interactive);
  const token = {
    accessToken: tokenResponse.access_token,
    expiresAt: Date.now() + Math.max(0, Number(tokenResponse.expires_in || 3600)) * 1000
  };
  saveStoredGoogleCalendarToken("home", token);
  return token;
}

function requestGoogleAccessToken(clientId, interactive = false) {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error("Google sign-in is not available yet."));
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_CALENDAR_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        resolve(response);
      }
    });

    tokenClient.requestAccessToken({ prompt: interactive ? "consent" : "" });
  });
}

async function fetchGoogleCalendarEvents(calendarId, accessToken, anchorValue) {
  const anchor = normalizeDate(anchorValue || new Date());
  const timeMin = startOfMonth(addMonths(anchor, -1)).toISOString();
  const timeMax = startOfMonth(addMonths(anchor, 2)).toISOString();
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId || "primary")}/events`);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("showDeleted", "false");
  url.searchParams.set("maxResults", "2500");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Google Calendar request failed (${response.status})`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];
  return items.map((item) => normalizeGoogleCalendarEvent(item)).filter(Boolean);
}

function normalizeGoogleCalendarEvent(event) {
  const startDateTime = event?.start?.dateTime || null;
  const startDate = event?.start?.date || null;
  const isAllDay = Boolean(startDate && !startDateTime);
  const rawDate = startDateTime || (startDate ? `${startDate}T00:00:00` : "");
  const date = startDateTime ? parseCalendarDateTime(startDateTime) : normalizeDate(rawDate || new Date());
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    id: `google-${event.id || createStableId("google-event", event.summary || rawDate)}`,
    externalId: event.id || "",
    source: "google",
    sourceLabel: "Google",
    calendarId: event.organizer?.email || "primary",
    day: getDayLabel(date),
    dateKey: formatDateKey(date),
    time: isAllDay ? "" : formatClockTime(date),
    startDateTime,
    startDate,
    title: String(event.summary || "Untitled event").trim(),
    detail: String([event.location, event.description].filter(Boolean).join(" · ") || "Imported from Google Calendar").trim(),
    htmlLink: String(event.htmlLink || ""),
    allDay: isAllDay
  };
}

function hasCalendarEventTime(event) {
  return Boolean(getCalendarEventTimeLabel(event));
}

function getCalendarEventTimeLabel(event) {
  if (!event) {
    return "";
  }

  if (event.source === "google") {
    if (event.startDateTime) {
      const parsed = parseCalendarDateTime(event.startDateTime);
      if (!Number.isNaN(parsed.getTime())) {
        return formatClockTime(parsed);
      }
    }
    if (event.allDay || event.startDate) {
      return "";
    }
  }

  const rawTime = String(event.time || "").trim();
  return /^\d{1,2}:\d{2}$/.test(rawTime) ? normalizeTime(rawTime) : "";
}

function formatDisplayTimeLabel(timeValue) {
  const rawTime = String(timeValue || "").trim();
  if (!rawTime) {
    return "";
  }

  const match = rawTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return rawTime;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = match[2];
  if (Number.isNaN(hours)) {
    return rawTime;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
}

function normalizeCachedGoogleCalendarEvent(event) {
  if (!event || event.source !== "google") {
    return event;
  }

  const normalizedTime = getCalendarEventTimeLabel(event);
  const startDateTime = String(event.startDateTime || "").trim();
  const startDate = String(event.startDate || "").trim();
  return {
    ...event,
    time: normalizedTime,
    startDateTime,
    startDate,
    allDay: Boolean(event.allDay || (!normalizedTime && (startDate || startDateTime)))
  };
}

function parseCalendarDateTime(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getTime());
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(NaN) : parsed;
}

function addMonths(date, months) {
  const next = normalizeDate(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatClockTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function openExternalCalendarEvent(workspaceId, eventIndex) {
  const workspace = getWorkspace(workspaceId);
  const events = getMergedCalendarEvents(workspace);
  const event = events[eventIndex];
  if (!event || event.source !== "google" || !event.htmlLink) {
    window.alert("This imported event does not have an external link.");
    return;
  }

  window.open(event.htmlLink, "_blank", "noopener,noreferrer");
}

function fillTaskForm(workspaceId, cardId, columnId = "") {
  const workspace = getWorkspace(workspaceId);
  const state = getKanbanState(workspace);
  const cardEntry = cardId ? findKanbanCard(state, cardId) : null;
  const targetColumnId = cardEntry?.columnId || columnId || workspace.kanban[0]?.id || "";

  taskFormWorkspaceEl.value = workspace.id;
  renderColumnOptions(workspace.id);
  taskFormColumnEl.value = targetColumnId;
  taskFormCardIdEl.value = cardEntry?.card.id || "";
  taskFormTitleEl.value = cardEntry?.card.title || "";
  taskFormDetailEl.value = cardEntry?.card.detail || "";
  taskFormTagEl.value = cardEntry?.card.tag || "";
  taskFormDeleteEl.disabled = !cardEntry;
  renderTaskSubtaskEditor(cardEntry?.card.subtasks || []);

  if (!cardEntry && !cardId) {
    taskFormCardIdEl.value = "";
    taskFormTitleEl.value = "";
    taskFormDetailEl.value = "";
    taskFormTagEl.value = "";
    taskFormDeleteEl.disabled = true;
    taskFormColumnEl.value = workspace.kanban[0]?.id || "";
    renderTaskSubtaskEditor([]);
  }
}

function openTaskEditor(cardId = "", workspaceId = appState.workspaceId, columnId = "") {
  appState.drawerMode = "task";
  appState.editingTask = cardId ? { workspaceId, cardId } : null;
  appState.editingSchedule = null;
  appState.editingEvent = null;
  appState.editingFlashcard = null;
  openDrawer("task");
  fillTaskForm(workspaceId, cardId, columnId);
  taskFormEl.scrollIntoView({ block: "nearest" });
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const workspaceId = taskFormWorkspaceEl.value;
  const workspace = getWorkspace(workspaceId);
  const state = getKanbanState(workspace);
  let columnId = taskFormColumnEl.value;
  const subtasks = collectTaskSubtasks();
  const payload = {
    title: taskFormTitleEl.value.trim(),
    detail: taskFormDetailEl.value.trim(),
    tag: taskFormTagEl.value.trim(),
    subtasks
  };

  if (!payload.title || !payload.detail || !payload.tag) {
    window.alert("Fill out the task title, detail, and tag before saving.");
    return;
  }

  if (taskFormCardIdEl.value) {
    const location = findKanbanCard(state, taskFormCardIdEl.value);
    if (!location) {
      window.alert("The task to edit could not be found.");
      return;
    }

    location.card.title = payload.title;
    location.card.detail = payload.detail;
    location.card.tag = payload.tag;
    location.card.subtasks = payload.subtasks;

    if (location.columnId !== columnId) {
      if (!canMoveTaskToColumn(location.card, columnId, workspace)) {
        columnId = location.columnId;
      } else {
        state.columns[location.columnId] = state.columns[location.columnId].filter((card) => card.id !== location.card.id);
        state.columns[columnId] = [...(state.columns[columnId] || []), location.card];
      }
    }
  } else {
    const newCard = {
      id: createStableId("task", payload.title),
      ...payload
    };
    state.columns[columnId] = [...(state.columns[columnId] || []), newCard];
  }

  saveKanbanState(workspaceId, state);
  taskFormCardIdEl.value = "";
  taskFormDeleteEl.disabled = true;
  appState.editingTask = null;
  if (workspace.id === appState.workspaceId) {
    renderWorkspace(getWorkspace(appState.workspaceId));
  }
}

function deleteTaskFromEditor() {
  const cardId = taskFormCardIdEl.value;
  const workspaceId = taskFormWorkspaceEl.value;
  if (!cardId) {
    return;
  }

  const workspace = getWorkspace(workspaceId);
  const state = getKanbanState(workspace);
  const location = findKanbanCard(state, cardId);
  if (!location) {
    return;
  }

  state.columns[location.columnId] = state.columns[location.columnId].filter((card) => card.id !== cardId);
  saveKanbanState(workspaceId, state);
  appState.editingTask = null;
  openTaskEditor("", workspaceId);
  if (workspace.id === appState.workspaceId) {
    renderWorkspace(getWorkspace(appState.workspaceId));
  }
}

function deleteTaskFromBoard(workspaceId, cardId) {
  const workspace = getWorkspace(workspaceId);
  const state = getKanbanState(workspace);
  const location = findKanbanCard(state, cardId);
  if (!location) {
    return;
  }

  state.columns[location.columnId] = state.columns[location.columnId].filter((card) => card.id !== cardId);
  saveKanbanState(workspaceId, state);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function renderTaskSubtaskEditor(subtasks) {
  if (!taskFormSubtasksEl) {
    return;
  }

  const normalizedSubtasks = normalizeTaskSubtasks(subtasks);
  taskFormSubtasksEl.innerHTML = normalizedSubtasks.length
    ? normalizedSubtasks
        .map(
          (subtask) => `
            <div class="task-subtask-row" data-subtask-row data-subtask-id="${escapeHtml(subtask.id)}">
              <input class="task-subtask-check" type="checkbox" data-subtask-done ${subtask.done ? "checked" : ""} aria-label="Mark subtask done" />
              <input class="task-subtask-input" type="text" data-subtask-title value="${escapeHtml(subtask.title)}" placeholder="Subtask title" />
              <button class="mini-button button-danger" type="button" data-action="remove-subtask">Delete</button>
            </div>
          `
        )
        .join("")
    : `<div class="calendar-empty">No subtasks added yet.</div>`;
}

function collectTaskSubtasks() {
  if (!taskFormSubtasksEl) {
    return [];
  }

  return Array.from(taskFormSubtasksEl.querySelectorAll("[data-subtask-row]"))
    .map((row, index) => {
      const titleInput = row.querySelector("[data-subtask-title]");
      const doneInput = row.querySelector("[data-subtask-done]");
      return {
        id: row.dataset.subtaskId || createStableId("subtask", titleInput?.value || `subtask-${index + 1}`),
        title: String(titleInput?.value || "").trim(),
        done: Boolean(doneInput?.checked)
      };
    })
    .filter((item) => item.title);
}

function addTaskSubtaskRow() {
  if (!taskFormSubtasksEl) {
    return;
  }

  const row = document.createElement("div");
  row.className = "task-subtask-row";
  row.dataset.subtaskRow = "true";
  row.dataset.subtaskId = createStableId("subtask", "new");
  row.innerHTML = `
    <input class="task-subtask-check" type="checkbox" data-subtask-done aria-label="Mark subtask done" />
    <input class="task-subtask-input" type="text" data-subtask-title placeholder="Subtask title" />
    <button class="mini-button button-danger" type="button" data-action="remove-subtask">Delete</button>
  `;

  const emptyState = taskFormSubtasksEl.querySelector(".calendar-empty");
  if (emptyState) {
    emptyState.remove();
  }
  taskFormSubtasksEl.appendChild(row);
  row.querySelector("[data-subtask-title]")?.focus();
}

function removeTaskSubtaskRow(row) {
  if (!row) {
    return;
  }

  row.remove();
  if (!taskFormSubtasksEl.querySelector("[data-subtask-row]")) {
    taskFormSubtasksEl.innerHTML = `<div class="calendar-empty">No subtasks added yet.</div>`;
  }
}

function toggleKanbanSubtask(workspaceId, cardId, subtaskId) {
  const workspace = getWorkspace(workspaceId);
  const state = getKanbanState(workspace);
  const location = findKanbanCard(state, cardId);
  if (!location) {
    return;
  }

  const subtasks = Array.isArray(location.card.subtasks) ? [...location.card.subtasks] : [];
  const subtaskIndex = subtasks.findIndex((item) => item.id === subtaskId);
  if (subtaskIndex === -1) {
    return;
  }

  subtasks[subtaskIndex] = {
    ...subtasks[subtaskIndex],
    done: !subtasks[subtaskIndex].done
  };
  location.card.subtasks = subtasks;
  saveKanbanState(workspaceId, state);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function canMoveTaskToColumn(card, targetColumnId, workspace) {
  const targetColumnIndex = workspace.kanban.findIndex((column) => column.id === targetColumnId);
  const todoColumnIndex = workspace.kanban.findIndex((column) => column.id === "todo");
  const subtasks = Array.isArray(card.subtasks) ? card.subtasks : [];
  const blocked = subtasks.length && subtasks.some((item) => !item.done);
  if (!blocked) {
    return true;
  }

  const targetIsBeyondTodo = targetColumnIndex !== -1 && todoColumnIndex !== -1 && targetColumnIndex > todoColumnIndex;
  if (targetIsBeyondTodo) {
    window.alert("Complete all subtasks before moving this task out of To-do.");
    return false;
  }

  return true;
}

function getScheduleStorageKey(workspaceId) {
  return `workspace-dashboard:schedule:${workspaceId}`;
}

function getScheduleState(workspace) {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const baseEntries = normalizeScheduleEntries(normalizedWorkspace.schedule || [], normalizedWorkspace.id, true);
  const storedEntries = readStoredJson(getScheduleStorageKey(normalizedWorkspace.id), null);
  if (!Array.isArray(storedEntries)) {
    return baseEntries;
  }

  const sanitizedStoredEntries = normalizeScheduleEntries(storedEntries, normalizedWorkspace.id);
  if (sanitizedStoredEntries.length !== storedEntries.length) {
    saveScheduleState(normalizedWorkspace.id, sanitizedStoredEntries);
  }

  return mergeScheduleLists(baseEntries, sanitizedStoredEntries, normalizedWorkspace.id);
}

function saveScheduleState(workspaceId, entries) {
  localStorage.setItem(getScheduleStorageKey(workspaceId), JSON.stringify(entries));
}

function mergeScheduleLists(baseEntries, storedEntries, workspaceId) {
  const normalizedStored = normalizeScheduleEntries(storedEntries, workspaceId);
  const byId = new Map(normalizedStored.map((entry) => [entry.id, entry]));
  const ordered = [];

  for (const baseEntry of baseEntries) {
    if (byId.has(baseEntry.id)) {
      ordered.push(byId.get(baseEntry.id));
      byId.delete(baseEntry.id);
    } else {
      ordered.push(baseEntry);
    }
  }

  for (const entry of byId.values()) {
    ordered.push(entry);
  }

  return ordered.length ? ordered : baseEntries;
}

function normalizeScheduleEntries(entries, workspaceId, assignDefaultDays = false) {
  return (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry && entry.source !== "calendar")
    .map((entry, index) => ({
      id: entry.id || `schedule-${slugify(entry.title || `item-${index + 1}`)}-${index + 1}`,
      day: normalizeScheduleDay(entry.day, assignDefaultDays ? DAY_ORDER[index % DAY_ORDER.length] : appState.scheduleDay),
      time: normalizeTime(entry.time || "09:00"),
      title: String(entry.title || "").trim(),
      detail: String(entry.detail || "").trim(),
      source: "schedule",
      workspaceId
    }))
    .filter((entry) => entry.title && entry.detail);
}

function normalizeScheduleDay(day, fallbackDay = getStoredScheduleDay()) {
  return DAY_ORDER.includes(day) ? day : fallbackDay;
}

function fillScheduleForm(workspaceId, itemId, dayOverride = "", sourceDefaults = null) {
  const workspace = getWorkspace(workspaceId);
  const items = getScheduleState(workspace);
  const item = itemId ? items.find((entry) => entry.id === itemId) : null;

  scheduleFormWorkspaceEl.value = workspace.id;
  scheduleFormDayEl.value = dayOverride || item?.day || appState.scheduleDay || DAY_ORDER[0];
  scheduleFormItemIdEl.value = item?.id || "";
  scheduleFormTimeEl.value = normalizeTime(item?.time || sourceDefaults?.time || "09:00");
  scheduleFormTitleEl.value = item?.title || sourceDefaults?.title || "";
  scheduleFormDetailEl.value = item?.detail || sourceDefaults?.detail || "";
  scheduleFormDeleteEl.disabled = !item;
}

function openScheduleEditor(itemId = "", workspaceId = appState.workspaceId, dayOverride = "", sourceDefaults = null) {
  appState.drawerMode = "schedule";
  appState.editingTask = null;
  appState.editingSchedule = itemId ? { workspaceId, itemId } : null;
  appState.editingEvent = null;
  appState.editingFlashcard = null;
  openDrawer("schedule");
  fillScheduleForm(workspaceId, itemId, dayOverride, sourceDefaults);
  scheduleFormEl.scrollIntoView({ block: "nearest" });
}

function handleScheduleSubmit(event) {
  event.preventDefault();
  const workspaceId = scheduleFormWorkspaceEl.value;
  const workspace = getWorkspace(workspaceId);
  const entries = [...getScheduleState(workspace)];
  const payload = {
    day: scheduleFormDayEl.value,
    time: normalizeTime(scheduleFormTimeEl.value),
    title: scheduleFormTitleEl.value.trim(),
    detail: scheduleFormDetailEl.value.trim(),
    source: "schedule"
  };

  if (!payload.day || !payload.time || !payload.title || !payload.detail) {
    window.alert("Fill out the day, time, title, and detail before saving.");
    return;
  }

  if (scheduleFormItemIdEl.value) {
    const index = entries.findIndex((entry) => entry.id === scheduleFormItemIdEl.value);
    if (index === -1) {
      window.alert("The schedule item to edit could not be found.");
      return;
    }
    entries[index] = {
      ...entries[index],
      ...payload
    };
  } else {
    entries.unshift({
      id: createStableId("schedule", payload.title),
      ...payload
    });
  }

  saveScheduleState(workspaceId, entries);
  scheduleFormItemIdEl.value = "";
  scheduleFormDeleteEl.disabled = true;
  appState.editingTask = null;
  renderWorkspace(getWorkspace(appState.workspaceId));
  fillScheduleForm(workspaceId, "", scheduleFormDayEl.value || appState.scheduleDay);
}

function deleteScheduleFromEditor() {
  const workspaceId = scheduleFormWorkspaceEl.value;
  const workspace = getWorkspace(workspaceId);
  const entries = [...getScheduleState(workspace)];
  const itemId = scheduleFormItemIdEl.value;
  const index = entries.findIndex((entry) => entry.id === itemId);
  if (index === -1) {
    return;
  }

  entries.splice(index, 1);
  saveScheduleState(workspaceId, entries);
  appState.editingTask = null;
  renderWorkspace(getWorkspace(appState.workspaceId));
  fillScheduleForm(workspaceId, "", scheduleFormDayEl.value || appState.scheduleDay);
}

function deleteScheduleItem(workspaceId, itemId) {
  const workspace = getWorkspace(workspaceId);
  const entries = [...getScheduleState(workspace)];
  const index = entries.findIndex((entry) => entry.id === itemId);
  if (index === -1) {
    return;
  }

  entries.splice(index, 1);
  saveScheduleState(workspaceId, entries);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function getHomeStorageKey(workspaceId) {
  return `workspace-dashboard:home:${workspaceId}`;
}

function getHomeState(workspace) {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const baseState = normalizeHomeState(normalizedWorkspace);
  const storedState = readStoredJson(getHomeStorageKey(normalizedWorkspace.id), null);
  if (!storedState || typeof storedState !== "object") {
    return baseState;
  }

  const sanitizedStored = normalizeHomeState(storedState, normalizedWorkspace);
  if (JSON.stringify(sanitizedStored) !== JSON.stringify(storedState)) {
    saveHomeState(normalizedWorkspace.id, sanitizedStored);
  }

  return {
    todos: mergeHomeList(baseState.todos, sanitizedStored.todos),
    groceries: mergeHomeList(baseState.groceries, sanitizedStored.groceries),
    menuByDay: mergeHomeMenuByDay(baseState.menuByDay, sanitizedStored.menuByDay)
  };
}

function saveHomeState(workspaceId, state) {
  localStorage.setItem(getHomeStorageKey(workspaceId), JSON.stringify(state));
}

function getHomeCalendarConnectionStorageKey(workspaceId) {
  return `${STORAGE_KEYS.calendarConnection}:${workspaceId}`;
}

function getHomeCalendarCacheStorageKey(workspaceId) {
  return `${STORAGE_KEYS.calendarCache}:${workspaceId}`;
}

function getHomeCalendarConnection(workspaceId) {
  const stored = readStoredJson(getHomeCalendarConnectionStorageKey(workspaceId), null);
  if (!stored || typeof stored !== "object") {
    return {
      provider: "google",
      enabled: false,
      clientId: "",
      calendarId: "primary",
      lastSyncAt: "",
      lastError: ""
    };
  }

  return {
    provider: stored.provider === "google" ? "google" : "google",
    enabled: Boolean(stored.enabled),
    clientId: String(stored.clientId || "").trim(),
    calendarId: String(stored.calendarId || "primary").trim() || "primary",
    lastSyncAt: String(stored.lastSyncAt || ""),
    lastError: String(stored.lastError || "")
  };
}

function saveHomeCalendarConnection(workspaceId, connection) {
  localStorage.setItem(getHomeCalendarConnectionStorageKey(workspaceId), JSON.stringify(connection));
}

function getHomeCalendarCache(workspaceId) {
  const cached = readStoredJson(getHomeCalendarCacheStorageKey(workspaceId), []);
  const normalized = Array.isArray(cached) ? cached.map((event) => normalizeCachedGoogleCalendarEvent(event)) : [];
  if (JSON.stringify(normalized) !== JSON.stringify(cached)) {
    saveHomeCalendarCache(workspaceId, normalized);
  }
  return normalized;
}

function saveHomeCalendarCache(workspaceId, events) {
  const normalized = Array.isArray(events) ? events.map((event) => normalizeCachedGoogleCalendarEvent(event)) : [];
  localStorage.setItem(getHomeCalendarCacheStorageKey(workspaceId), JSON.stringify(normalized));
}

function clearHomeCalendarConnection(workspaceId) {
  localStorage.removeItem(getHomeCalendarConnectionStorageKey(workspaceId));
  localStorage.removeItem(getHomeCalendarCacheStorageKey(workspaceId));
  clearStoredGoogleCalendarToken(workspaceId);
}

function getHiddenCalendarEventsStorageKey(workspaceId) {
  return `${STORAGE_KEYS.hiddenCalendarEvents}:${workspaceId}`;
}

function getHiddenCalendarEvents(workspaceId) {
  const hidden = readStoredJson(getHiddenCalendarEventsStorageKey(workspaceId), []);
  return Array.isArray(hidden) ? hidden.filter((value) => typeof value === "string" && value.trim()) : [];
}

function saveHiddenCalendarEvents(workspaceId, eventIds) {
  const uniqueIds = Array.from(new Set((Array.isArray(eventIds) ? eventIds : []).filter((value) => typeof value === "string" && value.trim())));
  localStorage.setItem(getHiddenCalendarEventsStorageKey(workspaceId), JSON.stringify(uniqueIds));
}

function hideCalendarEventFromDashboard(workspaceId, eventKey) {
  if (!eventKey) {
    return;
  }

  const hidden = getHiddenCalendarEvents(workspaceId);
  if (!hidden.includes(eventKey)) {
    hidden.push(eventKey);
    saveHiddenCalendarEvents(workspaceId, hidden);
  }
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function isCalendarEventHidden(workspaceId, event) {
  if (!event) {
    return false;
  }

  const hidden = getHiddenCalendarEvents(workspaceId);
  const eventKey = getCalendarEventHideKey(event);
  return hidden.includes(eventKey);
}

function getCalendarEventHideKey(event) {
  if (!event) {
    return "";
  }

  const source = event.source || "calendar";
  const stableId = source === "google" && event.externalId ? event.externalId : event.id;
  return `${source}:${String(stableId || "")}`;
}

function getMergedCalendarEvents(workspace) {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const hiddenEventKeys = new Set(getHiddenCalendarEvents(normalizedWorkspace.id));
  const localEvents = Array.isArray(normalizedWorkspace.calendar)
    ? normalizedWorkspace.calendar.map((event, index) => ({
        ...event,
        id: event.id || `calendar-${index + 1}`,
        source: event.source || "calendar",
        sourceLabel: event.sourceLabel || "Calendar",
        dateKey: event.dateKey || ""
      }))
    : [];
  const connection = normalizedWorkspace.id === "home" ? getHomeCalendarConnection(normalizedWorkspace.id) : null;
  const syncedEvents = normalizedWorkspace.id === "home" && connection?.enabled
    ? getHomeCalendarCache(normalizedWorkspace.id).map((event, index) => normalizeCachedGoogleCalendarEvent({
        ...event,
        id: event.id || `google-${index + 1}`,
        source: event.source || "google",
        sourceLabel: event.sourceLabel || "Google",
        dateKey: event.dateKey || ""
      }))
    : [];

  return [...localEvents, ...syncedEvents].filter((event) => !hiddenEventKeys.has(getCalendarEventHideKey(event)));
}

function getCalendarTodoStorageKey(workspaceId) {
  return `${STORAGE_KEYS.calendarTodos}:${workspaceId}`;
}

function getCalendarTodoState(workspaceId) {
  const stored = readStoredJson(getCalendarTodoStorageKey(workspaceId), []);
  const normalized = normalizeCalendarTodoState(stored, workspaceId);
  if (JSON.stringify(normalized) !== JSON.stringify(stored)) {
    saveCalendarTodoState(workspaceId, normalized);
  }
  return normalized;
}

function saveCalendarTodoState(workspaceId, items) {
  const normalized = normalizeCalendarTodoState(items, workspaceId);
  localStorage.setItem(getCalendarTodoStorageKey(workspaceId), JSON.stringify(normalized));
}

function normalizeCalendarTodoState(items, workspaceId) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => ({
      id: String(item?.id || `calendar-todo-${index + 1}`),
      eventKey: String(item?.eventKey || "").trim(),
      source: item?.source === "google" ? "google" : "calendar",
      sourceLabel: String(item?.sourceLabel || (item?.source === "google" ? "Google" : "Calendar")).trim(),
      dateKey: String(item?.dateKey || "").trim(),
      title: String(item?.title || "").trim(),
      detail: String(item?.detail || "").trim(),
      completed: Boolean(item?.completed),
      completedAt: String(item?.completedAt || ""),
      deleted: Boolean(item?.deleted),
      htmlLink: String(item?.htmlLink || ""),
      workspaceId
    }))
    .filter((item) => item.eventKey || item.title);
}

function getCalendarTodoKey(event) {
  if (!event) {
    return "";
  }

  const source = event.source || "calendar";
  const stableId = source === "google" && event.externalId ? event.externalId : event.id;
  const dateKey = String(event.dateKey || "").trim();
  return `${source}:${String(stableId || "")}:${dateKey}`;
}

function materializeCalendarTodos(workspaceId, events, selectedDate) {
  const normalizedWorkspaceId = String(workspaceId || "");
  const targetDateKey = formatDateKey(selectedDate || new Date());
  const stored = getCalendarTodoState(normalizedWorkspaceId);
  const byKey = new Map(stored.map((item) => [item.eventKey, item]));
  let dirty = false;

  (Array.isArray(events) ? events : []).forEach((entry) => {
    const event = entry?.payload?.event || entry?.event || entry;
    if (!event || hasCalendarEventTime(event)) {
      return;
    }

    const eventKey = getCalendarTodoKey(event);
    if (!eventKey) {
      return;
    }

    const eventDateKey = String(event.dateKey || "").trim();
    if (eventDateKey && eventDateKey !== targetDateKey) {
      return;
    }

    const existing = byKey.get(eventKey);
    if (existing?.deleted) {
      byKey.set(eventKey, existing);
      return;
    }
    const nextItem = {
      id: existing?.id || createStableId("calendar-todo", event.title || eventKey),
      eventKey,
      source: event.source === "google" ? "google" : "calendar",
      sourceLabel: event.sourceLabel || (event.source === "google" ? "Google" : "Calendar"),
      dateKey: eventDateKey || targetDateKey,
      title: String(event.title || "").trim(),
      detail: String(event.detail || "").trim(),
      completed: Boolean(existing?.completed),
      completedAt: String(existing?.completedAt || ""),
      deleted: Boolean(existing?.deleted),
      htmlLink: String(event.htmlLink || existing?.htmlLink || "")
    };

    if (!existing || JSON.stringify(existing) !== JSON.stringify(nextItem)) {
      byKey.set(eventKey, nextItem);
      dirty = true;
    }
  });

  const normalized = Array.from(byKey.values())
    .filter((item) => item.dateKey === targetDateKey)
    .filter((item) => !item.deleted)
    .sort((left, right) => {
      const statusOrder = Number(left.completed) - Number(right.completed);
      if (statusOrder !== 0) {
        return statusOrder;
      }
      return String(left.title || "").localeCompare(String(right.title || ""));
    });

  if (dirty) {
    saveCalendarTodoState(normalizedWorkspaceId, Array.from(byKey.values()));
  }

  return normalized;
}

function toggleCalendarTodoItem(workspaceId, itemId) {
  const workspaceIdValue = String(workspaceId || "");
  const items = getCalendarTodoState(workspaceIdValue);
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) {
    return;
  }

  items[index] = {
    ...items[index],
    completed: !items[index].completed,
    completedAt: !items[index].completed ? new Date().toISOString() : ""
  };
  saveCalendarTodoState(workspaceIdValue, items);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function deleteCalendarTodoItem(workspaceId, itemId) {
  const workspaceIdValue = String(workspaceId || "");
  const items = getCalendarTodoState(workspaceIdValue);
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) {
    return;
  }

  items.splice(index, 1);
  saveCalendarTodoState(workspaceIdValue, items);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function getCalendarTodoItem(workspaceId, itemId) {
  const items = getCalendarTodoState(workspaceId);
  return items.find((item) => item.id === itemId) || null;
}

function normalizeHomeState(value, workspace = null) {
  const sourceWorkspace = workspace ? normalizeWorkspace(workspace) : null;
  const fallbackTodos = Array.isArray(sourceWorkspace?.todos) ? sourceWorkspace.todos : [];
  const fallbackGroceries = Array.isArray(sourceWorkspace?.groceries) ? sourceWorkspace.groceries : [];
  const fallbackMenu = normalizeHomeMenuByDay(sourceWorkspace?.menuByDay || sourceWorkspace?.dailyMenu || null);
  const todoSource = Array.isArray(value?.todos)
    ? value.todos
    : Array.isArray(sourceWorkspace?.kanban)
      ? sourceWorkspace.kanban.flatMap((column) => Array.isArray(column.cards) ? column.cards : []).map((card) => ({
          id: card.id,
          title: card.title,
          done: false
        }))
      : fallbackTodos;
  const grocerySource = Array.isArray(value?.groceries) ? value.groceries : fallbackGroceries;
  const menuSource = value?.menuByDay || value?.dailyMenu || fallbackMenu;

  return {
    todos: normalizeHomeItems(todoSource),
    groceries: normalizeHomeItems(grocerySource),
    menuByDay: normalizeHomeMenuByDay(menuSource, fallbackMenu)
  };
}

function normalizeHomeItems(items) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    id: item.id || `home-item-${index + 1}-${slugify(item.title || "item")}`,
    title: String(item.title || "").trim(),
    done: Boolean(item.done)
  }));
}

function mergeHomeList(baseItems, storedItems) {
  const normalizedStored = normalizeHomeItems(storedItems);
  const byId = new Map(normalizedStored.map((item) => [item.id, item]));
  const ordered = [];

  for (const baseItem of normalizeHomeItems(baseItems)) {
    if (byId.has(baseItem.id)) {
      ordered.push(byId.get(baseItem.id));
      byId.delete(baseItem.id);
    } else {
      ordered.push(baseItem);
    }
  }

  for (const item of byId.values()) {
    ordered.push(item);
  }

  return ordered;
}

function mergeHomeMenuByDay(baseMenuByDay, storedMenuByDay) {
  const normalizedBase = normalizeHomeMenuByDay(baseMenuByDay);
  const normalizedStored = normalizeHomeMenuByDay(storedMenuByDay, normalizedBase);

  return DAY_ORDER.reduce((accumulator, day) => {
    accumulator[day] = mergeHomeMenuDayMeals(normalizedBase[day], normalizedStored[day], day);
    return accumulator;
  }, {});
}

function getHomeMenuDayStorageKey(workspaceId) {
  return `${STORAGE_KEYS.homeMenuDay}:${workspaceId}`;
}

function getStoredHomeMenuDay(workspaceId) {
  const storedDay = localStorage.getItem(getHomeMenuDayStorageKey(workspaceId));
  return DAY_ORDER.includes(storedDay) ? storedDay : getDayLabel(new Date());
}

function setHomeMenuDay(workspaceId, day) {
  const nextDay = DAY_ORDER.includes(day) ? day : DAY_ORDER[0];
  localStorage.setItem(getHomeMenuDayStorageKey(workspaceId), nextDay);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function updateHomeMeal(workspaceId, day, mealId, patch) {
  const workspace = getWorkspace(workspaceId);
  const state = getHomeState(workspace);
  const menuByDay = normalizeHomeMenuByDay(state.menuByDay);
  const targetDay = DAY_ORDER.includes(day) ? day : DAY_ORDER[0];
  const meals = Array.isArray(menuByDay[targetDay]) ? [...menuByDay[targetDay]] : [];
  const index = meals.findIndex((item) => item.id === mealId);
  if (index === -1) {
    return;
  }

  meals[index] = {
    ...meals[index],
    ...patch
  };
  const nextState = {
    ...state,
    menuByDay: {
      ...menuByDay,
      [targetDay]: meals
    }
  };
  saveHomeState(workspaceId, nextState);
}

function normalizeHomeMenuByDay(menuSource, fallbackSource = null) {
  const fallback = buildHomeMenuByDay(fallbackSource);
  const source = menuSource && typeof menuSource === "object" && !Array.isArray(menuSource) ? menuSource : null;
  const sourceMenu = Array.isArray(menuSource) ? menuSource : null;

  if (sourceMenu) {
    return DAY_ORDER.reduce((accumulator, day) => {
      accumulator[day] = normalizeHomeMenuDayMeals(sourceMenu, day);
      return accumulator;
    }, {});
  }

  return DAY_ORDER.reduce((accumulator, day) => {
    const sourceMeals = source?.[day] || fallback?.[day] || [];
    accumulator[day] = normalizeHomeMenuDayMeals(sourceMeals, day);
    return accumulator;
  }, {});
}

function buildHomeMenuByDay(source) {
  if (!source) {
    return null;
  }

  const normalized = normalizeHomeMenuByDay(source);
  return DAY_ORDER.reduce((accumulator, day) => {
    accumulator[day] = normalized[day] || [];
    return accumulator;
  }, {});
}

function normalizeHomeMeals(items, day = "") {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    id: item.id || `home-meal-${day.toLowerCase() || "day"}-${index + 1}-${slugify(item.meal || "meal")}`,
    meal: item.meal || `Meal ${index + 1}`,
    title: String(item.title || "").trim(),
    detail: String(item.detail || "").trim()
  }));
}

function normalizeHomeMenuDayMeals(items, day = "") {
  const normalizedItems = normalizeHomeMeals(items, day);
  const byMeal = new Map();
  normalizedItems.forEach((item, index) => {
    const slotKey = HOME_MENU_SLOTS.find((slot) => slugify(item.meal) === slugify(slot));
    if (slotKey && !byMeal.has(slotKey)) {
      byMeal.set(slotKey, item);
      return;
    }

    if (!slotKey && index < HOME_MENU_SLOTS.length) {
      const fallbackSlot = HOME_MENU_SLOTS[index];
      if (!byMeal.has(fallbackSlot)) {
        byMeal.set(fallbackSlot, {
          ...item,
          meal: fallbackSlot
        });
      }
    }
  });

  return HOME_MENU_SLOTS.map((slot, index) => {
    const existing = byMeal.get(slot);
    return existing || {
      id: `home-meal-${day.toLowerCase() || "day"}-${index + 1}-${slugify(slot)}`,
      meal: slot,
      title: "",
      detail: ""
    };
  });
}

function mergeHomeMenuDayMeals(baseMeals, storedMeals, day = "") {
  const canonicalMeals = normalizeHomeMenuDayMeals(baseMeals, day);
  const storedBySlot = new Map();

  for (const meal of normalizeHomeMenuDayMeals(storedMeals, day)) {
    const slot = HOME_MENU_SLOTS.find((candidate) => slugify(meal.meal) === slugify(candidate));
    if (!slot || storedBySlot.has(slot)) {
      continue;
    }

    storedBySlot.set(slot, meal);
  }

  return HOME_MENU_SLOTS.map((slot, index) => storedBySlot.get(slot) || canonicalMeals[index]);
}

function addHomeListItem(workspaceId, listName, placeholder) {
  const title = window.prompt(placeholder);
  if (!title) {
    return;
  }

  const workspace = getWorkspace(workspaceId);
  const state = getHomeState(workspace);
  const nextItem = {
    id: createStableId("home", title),
    title: title.trim(),
    done: false
  };
  const nextState = {
    ...state,
    [listName]: [...state[listName], nextItem]
  };
  saveHomeState(workspaceId, nextState);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function toggleHomeListItem(workspaceId, listName, itemId) {
  const workspace = getWorkspace(workspaceId);
  const state = getHomeState(workspace);
  const list = Array.isArray(state[listName]) ? [...state[listName]] : [];
  const index = list.findIndex((item) => item.id === itemId);
  if (index === -1) {
    return;
  }

  list[index] = {
    ...list[index],
    done: !list[index].done
  };
  const nextState = {
    ...state,
    [listName]: list
  };
  saveHomeState(workspaceId, nextState);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function deleteHomeListItem(workspaceId, listName, itemId) {
  const workspace = getWorkspace(workspaceId);
  const state = getHomeState(workspace);
  const list = Array.isArray(state[listName]) ? [...state[listName]] : [];
  const nextList = list.filter((item) => item.id !== itemId);
  const nextState = {
    ...state,
    [listName]: nextList
  };
  saveHomeState(workspaceId, nextState);
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function shiftScheduleDay(direction) {
  const currentIndex = DAY_ORDER.indexOf(appState.scheduleDay);
  const nextIndex = (currentIndex + direction + DAY_ORDER.length) % DAY_ORDER.length;
  appState.scheduleDay = DAY_ORDER[nextIndex];
  localStorage.setItem(STORAGE_KEYS.scheduleDay, appState.scheduleDay);
  const workspace = getWorkspace(appState.workspaceId);
  renderSchedule(workspace.schedule, getMergedCalendarEvents(workspace));
}

function fillCalendarForm(workspaceId, eventIndexValue, dayOverride = "") {
  const workspace = getWorkspace(workspaceId);
  const eventIndex = Number.parseInt(eventIndexValue, 10);
  const event = Number.isInteger(eventIndex) ? workspace.calendar?.[eventIndex] : null;

  calendarFormWorkspaceEl.value = workspace.id;
  calendarFormEventIndexEl.value = Number.isInteger(eventIndex) ? String(eventIndex) : "";
  calendarFormDayEl.value = dayOverride || event?.day || DAY_ORDER[0];
  calendarFormTimeEl.value = normalizeTime(event?.time || "09:00");
  calendarFormTitleEl.value = event?.title || "";
  calendarFormDetailEl.value = event?.detail || "";
  calendarFormTypeEl.value = event?.type || "calendar";
  calendarFormDeleteEl.disabled = !event;
}

function openCalendarEditor(eventIndex = "", workspaceId = appState.workspaceId, dayOverride = "") {
  appState.drawerMode = "calendar";
  appState.editingEvent = Number.isInteger(eventIndex) ? { workspaceId, eventIndex } : null;
  appState.editingTask = null;
  appState.editingSchedule = null;
  appState.editingFlashcard = null;
  openDrawer("calendar");
  fillCalendarForm(workspaceId, eventIndex, dayOverride);
  calendarFormEl.scrollIntoView({ block: "nearest" });
}

function handleCalendarSubmit(event) {
  event.preventDefault();
  const workspaceId = calendarFormWorkspaceEl.value;
  const workspace = getWorkspace(workspaceId);
  const events = Array.isArray(workspace.calendar) ? [...workspace.calendar] : [];
  const payload = {
    day: calendarFormDayEl.value,
    time: normalizeTime(calendarFormTimeEl.value),
    title: calendarFormTitleEl.value.trim(),
    detail: calendarFormDetailEl.value.trim(),
    type: calendarFormTypeEl.value.trim()
  };

  if (!payload.title || !payload.detail || !payload.type) {
    window.alert("Fill out the event title, detail, and type before saving.");
    return;
  }

  const eventIndex = Number.parseInt(calendarFormEventIndexEl.value, 10);
  if (Number.isInteger(eventIndex) && events[eventIndex]) {
    events[eventIndex] = payload;
  } else {
    events.push(payload);
  }

  setWorkspaceOverride(workspaceId, { calendar: events });
  calendarFormEventIndexEl.value = "";
  appState.editingEvent = null;
  renderWorkspace(getWorkspace(appState.workspaceId));
  fillCalendarForm(workspaceId, "");
}

function deleteCalendarFromEditor() {
  const workspaceId = calendarFormWorkspaceEl.value;
  const workspace = getWorkspace(workspaceId);
  const events = Array.isArray(workspace.calendar) ? [...workspace.calendar] : [];
  const eventIndex = Number.parseInt(calendarFormEventIndexEl.value, 10);
  if (!Number.isInteger(eventIndex) || !events[eventIndex]) {
    return;
  }

  events.splice(eventIndex, 1);
  setWorkspaceOverride(workspaceId, { calendar: events });
  appState.editingEvent = null;
  renderWorkspace(getWorkspace(appState.workspaceId));
  fillCalendarForm(workspaceId, "");
}

function deleteCalendarEventByIndex(workspaceId, eventIndex) {
  const workspace = getWorkspace(workspaceId);
  const events = Array.isArray(workspace.calendar) ? [...workspace.calendar] : [];
  if (!events[eventIndex]) {
    return;
  }

  events.splice(eventIndex, 1);
  setWorkspaceOverride(workspaceId, { calendar: events });
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function fillFlashcardForm(workspaceId, cardId) {
  const workspace = getWorkspace(workspaceId);
  const cards = getFlashcardsState(workspace);
  const card = cardId ? cards.find((item) => item.id === cardId) : null;

  flashcardFormWorkspaceEl.value = workspace.id;
  flashcardFormCardIdEl.value = card?.id || "";
  flashcardFormCategoryEl.value = card?.category || "study";
  flashcardFormQuestionEl.value = card?.question || "";
  flashcardFormAnswerEl.value = card?.answer || "";
  flashcardFormDeleteEl.disabled = !card;
}

function fillStoryForm(workspaceId, cardId) {
  const workspace = getWorkspace(workspaceId);
  const cards = getFlashcardsState(workspace);
  const card = cardId ? cards.find((item) => item.id === cardId) : null;

  storyFormCardIdEl.value = card?.id || "";
  storyFormSubjectEl.value = card?.question || "";
  storyFormParagraphEl.value = card?.answer || "";
  storyFormDeleteEl.disabled = !card;
}

function openFlashcardEditor(cardId = "", workspaceId = appState.workspaceId) {
  appState.drawerMode = "flashcard";
  appState.editingFlashcard = cardId ? { workspaceId, cardId } : null;
  appState.editingTask = null;
  appState.editingSchedule = null;
  appState.editingEvent = null;
  openDrawer("flashcard");
  fillFlashcardForm(workspaceId, cardId);
  flashcardFormEl.scrollIntoView({ block: "nearest" });
}

function openStoryEditor(cardId = "", workspaceId = appState.workspaceId) {
  const targetWorkspaceId = "work";
  appState.drawerMode = "story";
  appState.editingStory = cardId ? { workspaceId: targetWorkspaceId, cardId } : null;
  appState.editingTask = null;
  appState.editingSchedule = null;
  appState.editingEvent = null;
  appState.editingFlashcard = null;
  openDrawer("story");
  fillStoryForm(targetWorkspaceId, cardId);
  storyFormEl.scrollIntoView({ block: "nearest" });
}

function handleFlashcardSubmit(event) {
  event.preventDefault();
  const workspaceId = flashcardFormWorkspaceEl.value;
  const workspace = getWorkspace(workspaceId);
  const cards = [...getFlashcardsState(workspace)];
  const category = flashcardFormCategoryEl.value;
  const payload = {
    question: flashcardFormQuestionEl.value.trim(),
    answer: flashcardFormAnswerEl.value.trim(),
    category
  };

  if (!payload.question || !payload.category || (category !== "story" && !payload.answer)) {
    window.alert(category === "story" ? "Fill out the story card question and category before saving." : "Fill out the question, answer, and category before saving.");
    return;
  }

  if (category === "story") {
    payload.answer = "";
  }

  if (flashcardFormCardIdEl.value) {
    const index = cards.findIndex((card) => card.id === flashcardFormCardIdEl.value);
    if (index === -1) {
      window.alert("The flashcard to edit could not be found.");
      return;
    }
    cards[index] = {
      ...cards[index],
      ...payload
    };
  } else {
    cards.unshift({
      id: createStableId("flashcard", payload.question),
      ...payload
    });
  }

  saveFlashcardsState(workspaceId, cards);
  flashcardFormCardIdEl.value = "";
  flashcardFormDeleteEl.disabled = true;
  appState.editingFlashcard = null;
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function handleStorySubmit(event) {
  event.preventDefault();
  const workspaceId = "work";
  const workspace = getWorkspace(workspaceId);
  const cards = [...getFlashcardsState(workspace)];
  const payload = {
    question: storyFormSubjectEl.value.trim(),
    answer: storyFormParagraphEl.value.trim(),
    category: "story"
  };

  if (!payload.question || !payload.answer) {
    window.alert("Fill out the subject and paragraph before saving.");
    return;
  }

  if (storyFormCardIdEl.value) {
    const index = cards.findIndex((card) => card.id === storyFormCardIdEl.value);
    if (index === -1) {
      window.alert("The story card to edit could not be found.");
      return;
    }
    cards[index] = {
      ...cards[index],
      ...payload
    };
  } else {
    cards.unshift({
      id: createStableId("story", payload.question),
      ...payload
    });
  }

  saveFlashcardsState(workspaceId, cards);
  storyFormCardIdEl.value = "";
  storyFormDeleteEl.disabled = true;
  storyFormSubjectEl.value = "";
  storyFormParagraphEl.value = "";
  appState.editingStory = null;
  renderWorkspace(getWorkspace(appState.workspaceId));
}

function deleteFlashcardFromEditor() {
  const workspaceId = flashcardFormWorkspaceEl.value;
  const workspace = getWorkspace(workspaceId);
  const cards = [...getFlashcardsState(workspace)];
  const cardId = flashcardFormCardIdEl.value;
  const index = cards.findIndex((card) => card.id === cardId);
  if (index === -1) {
    return;
  }

  cards.splice(index, 1);
  saveFlashcardsState(workspaceId, cards);
  appState.editingFlashcard = null;
  renderWorkspace(getWorkspace(appState.workspaceId));
  fillFlashcardForm(workspaceId, "");
}

function deleteStoryFromEditor() {
  const workspaceId = "work";
  const cards = [...getFlashcardsState(getWorkspace(workspaceId))];
  const cardId = storyFormCardIdEl.value;
  const index = cards.findIndex((card) => card.id === cardId);
  if (index === -1) {
    return;
  }

  cards.splice(index, 1);
  saveFlashcardsState(workspaceId, cards);
  appState.editingStory = null;
  storyFormCardIdEl.value = "";
  storyFormDeleteEl.disabled = true;
  storyFormSubjectEl.value = "";
  storyFormParagraphEl.value = "";
  renderWorkspace(getWorkspace(appState.workspaceId));
  fillStoryForm(workspaceId, "");
}

function handleWorkspaceSettingsSubmit(event) {
  event.preventDefault();
  const workspaceId = workspaceSettingsWorkspaceEl.value;
  const defaultWorkspace = workspaceSettingsDefaultEl.value;
  const patch = {
    id: workspaceId,
    label: workspaceSettingsLabelEl.value.trim(),
    title: workspaceSettingsTitleEl.value.trim(),
    description: workspaceSettingsDescriptionEl.value.trim(),
    accent: normalizeHexColor(workspaceSettingsAccentEl.value),
    accent2: normalizeHexColor(workspaceSettingsAccent2El.value)
  };

  if (!patch.label || !patch.title || !patch.description) {
    window.alert("Fill out the workspace label, title, and description before saving.");
    return;
  }

  setWorkspaceOverride(workspaceId, patch);
  setAppDefaultWorkspace(defaultWorkspace);
  config = mergeDashboardConfig(defaultConfig, importedConfig, runtimeConfig, localConfig, uiOverrides);
  populateEditorSelects();
  renderTabs();
  renderWorkspace(getWorkspace(appState.workspaceId));
  syncWorkspaceSettingsToBackend(workspaceId).catch((error) => {
    console.warn("Unable to sync workspace settings to backend.", error);
    updateBackendSyncStatus("Saved locally. Backend sync needs attention.");
  });
}

function resetWorkspaceOverrides() {
  if (!window.confirm("Reset all custom workspace overrides stored in this browser?")) {
    return;
  }

  uiOverrides = {};
  localStorage.removeItem(STORAGE_KEYS.uiOverrides);
  config = mergeDashboardConfig(defaultConfig, importedConfig, runtimeConfig, localConfig, uiOverrides);
  populateEditorSelects();
  renderTabs();
  renderWorkspace(getWorkspace(appState.workspaceId));
  fillWorkspaceSettingsForm(appState.workspaceId);
  fillBackendSyncForm();
}

function setWorkspaceOverride(workspaceId, patch) {
  const nextOverrides = readStoredJson(STORAGE_KEYS.uiOverrides, {});
  const workspaces = Array.isArray(nextOverrides.workspaces) ? [...nextOverrides.workspaces] : [];
  const normalizedPatch = {
    ...patch,
    id: workspaceId
  };
  const index = workspaces.findIndex((workspace) => workspace.id === workspaceId);

  if (index === -1) {
    workspaces.push(normalizedPatch);
  } else {
    workspaces[index] = {
      ...workspaces[index],
      ...normalizedPatch
    };
  }

  uiOverrides = {
    ...nextOverrides,
    workspaces
  };

  persistUiOverrides();
}

function setAppDefaultWorkspace(workspaceId) {
  uiOverrides = {
    ...(uiOverrides || {}),
    defaultWorkspace: workspaceId
  };
  persistUiOverrides();
}

function persistUiOverrides() {
  localStorage.setItem(STORAGE_KEYS.uiOverrides, JSON.stringify(uiOverrides));
  config = mergeDashboardConfig(defaultConfig, importedConfig, runtimeConfig, localConfig, uiOverrides);
}

function findKanbanCard(state, cardId) {
  for (const [columnId, cards] of Object.entries(state.columns)) {
    const cardIndex = cards.findIndex((card) => card.id === cardId);
    if (cardIndex !== -1) {
      return {
        columnId,
        cardIndex,
        card: cards[cardIndex]
      };
    }
  }

  return null;
}

function groupCalendarEvents(events) {
  const grouped = new Map(DAY_ORDER.map((day) => [day, []]));
  events.forEach((event, index) => {
    const day = normalizeEventDay(event.day);
    grouped.get(day).push({ event, index });
  });
  return grouped;
}

function createStableId(prefix, value) {
  const timestamp = Date.now().toString(36);
  const entropy = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${slugify(value)}-${timestamp}-${entropy}`;
}

function normalizeTime(value) {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return "09:00";
  }

  const hours = Math.min(23, Math.max(0, Number.parseInt(match[1], 10)));
  const minutes = Math.min(59, Math.max(0, Number.parseInt(match[2], 10)));
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeHexColor(value) {
  const fallback = defaultConfig.workspaces[0].accent;
  const hex = String(value || fallback).trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }
  return fallback;
}

function exportBackup() {
  const snapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    config: sanitizeForExport(config),
    state: {
      selectedWorkspace: appState.workspaceId,
      motivationVisible: appState.motivationVisible,
      layout: layoutState,
      calendarView: appState.calendarView,
      calendarAnchor: appState.calendarAnchor,
      scheduleDay: appState.scheduleDay,
      workspaces: config.workspaces.map((workspace) => ({
        id: workspace.id,
        scratchpad: localStorage.getItem(workspace.scratchpadKey) || "",
        kanban: getKanbanState(workspace),
        schedule: getScheduleState(workspace),
        home: getHomeState(workspace),
        homeCalendarConnection: getHomeCalendarConnection(workspace.id),
        homeCalendarCache: getHomeCalendarCache(workspace.id),
        hiddenCalendarEvents: getHiddenCalendarEvents(workspace.id),
        calendarTodos: getCalendarTodoState(workspace.id),
        homeMenuDay: getStoredHomeMenuDay(workspace.id),
        captureMode: getStoredCaptureMode(workspace.id),
        captureFollow: getStoredCaptureFollow(workspace.id),
        captureFollowSide: getStoredCaptureFollowSide(workspace.id),
        captureAssistant: getStoredCaptureAssistant(workspace.id),
        flashcards: getFlashcardsState(workspace)
      }))
    }
  };

  const fileBlob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(fileBlob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `workspace-dashboard-backup-${formatDateStamp(new Date())}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function importBackup(payload) {
  if (payload && typeof payload === "object") {
    if (payload.config) {
      localStorage.setItem(STORAGE_KEYS.importedConfig, JSON.stringify(payload.config));
      importedConfig = readStoredJson(STORAGE_KEYS.importedConfig, {});
      config = mergeDashboardConfig(defaultConfig, importedConfig, runtimeConfig, localConfig, uiOverrides);
      populateEditorSelects();
    }

    if (payload.state) {
      applyStateBackup(payload.state);
    }

    appState.workspaceId = getWorkspaceIdOrFallback(payload.state?.selectedWorkspace || appState.workspaceId);
    localStorage.setItem(STORAGE_KEYS.selectedWorkspace, appState.workspaceId);
    appState.flashcardIndex = 0;
    appState.answerVisible = false;
    renderTabs();
    renderWorkspace(getWorkspace(appState.workspaceId));
    return;
  }

  throw new Error("Invalid backup payload");
}

function applyStateBackup(state) {
  if (state.selectedWorkspace) {
    localStorage.setItem(STORAGE_KEYS.selectedWorkspace, state.selectedWorkspace);
  }

  if (state.layout) {
    layoutState = normalizeLayoutState(state.layout);
    persistLayoutState();
  }

  if (typeof state.motivationVisible === "boolean") {
    applyMotivationVisibility(state.motivationVisible);
  }

  if (state.calendarView === "week" || state.calendarView === "month") {
    appState.calendarView = state.calendarView;
    localStorage.setItem(STORAGE_KEYS.calendarView, state.calendarView);
  }

  if (state.calendarAnchor) {
    appState.calendarAnchor = normalizeDate(state.calendarAnchor).toISOString();
    localStorage.setItem(STORAGE_KEYS.calendarAnchor, formatDateKey(state.calendarAnchor));
  }

  if (DAY_ORDER.includes(state.scheduleDay)) {
    appState.scheduleDay = state.scheduleDay;
    localStorage.setItem(STORAGE_KEYS.scheduleDay, state.scheduleDay);
  }

  if (Array.isArray(state.workspaces)) {
    for (const workspaceState of state.workspaces) {
      const workspaceExists = config.workspaces.some((workspace) => workspace.id === workspaceState.id);
      if (!workspaceExists) {
        continue;
      }
      const workspace = getWorkspace(workspaceState.id);

      if (typeof workspaceState.scratchpad === "string") {
        localStorage.setItem(workspace.scratchpadKey, workspaceState.scratchpad);
      }

      if (workspaceState.kanban) {
        saveKanbanState(workspaceState.id, workspaceState.kanban);
      }

      if (Array.isArray(workspaceState.schedule)) {
        saveScheduleState(workspaceState.id, normalizeScheduleEntries(workspaceState.schedule, workspaceState.id));
      }

      if (workspaceState.home && typeof workspaceState.home === "object") {
        saveHomeState(workspaceState.id, normalizeHomeState(workspaceState.home, workspace));
      }

      if (workspaceState.homeCalendarConnection && typeof workspaceState.homeCalendarConnection === "object") {
        saveHomeCalendarConnection(workspaceState.id, {
          provider: workspaceState.homeCalendarConnection.provider === "google" ? "google" : "google",
          enabled: Boolean(workspaceState.homeCalendarConnection.enabled),
          clientId: String(workspaceState.homeCalendarConnection.clientId || "").trim(),
          calendarId: String(workspaceState.homeCalendarConnection.calendarId || "primary").trim() || "primary",
          lastSyncAt: String(workspaceState.homeCalendarConnection.lastSyncAt || ""),
          lastError: String(workspaceState.homeCalendarConnection.lastError || "")
        });
      }

      if (Array.isArray(workspaceState.homeCalendarCache)) {
        saveHomeCalendarCache(workspaceState.id, workspaceState.homeCalendarCache);
      }

      if (Array.isArray(workspaceState.hiddenCalendarEvents)) {
        saveHiddenCalendarEvents(workspaceState.id, workspaceState.hiddenCalendarEvents);
      }

      if (Array.isArray(workspaceState.calendarTodos)) {
        saveCalendarTodoState(workspaceState.id, workspaceState.calendarTodos);
      }

      if (typeof workspaceState.homeMenuDay === "string" && DAY_ORDER.includes(workspaceState.homeMenuDay)) {
        localStorage.setItem(getHomeMenuDayStorageKey(workspaceState.id), workspaceState.homeMenuDay);
      }

      if (typeof workspaceState.captureFollow === "boolean") {
        localStorage.setItem(getCaptureFollowStorageKey(workspaceState.id), String(workspaceState.captureFollow));
      }

      if (workspaceState.captureFollowSide === "left" || workspaceState.captureFollowSide === "right") {
        localStorage.setItem(getCaptureFollowSideStorageKey(workspaceState.id), workspaceState.captureFollowSide);
      }

      if (workspaceState.captureMode === "notes" || workspaceState.captureMode === "calculator" || workspaceState.captureMode === "board" || workspaceState.captureMode === "assistant") {
        localStorage.setItem(getCaptureModeStorageKey(workspaceState.id), workspaceState.captureMode);
      }

      if (workspaceState.captureAssistant && typeof workspaceState.captureAssistant === "object") {
        saveCaptureAssistant(workspaceState.id, workspaceState.captureAssistant);
      }

      if (Array.isArray(workspaceState.flashcards)) {
        saveFlashcardsState(workspaceState.id, normalizeFlashcards(workspaceState.flashcards));
      }
    }
  }
}

function getWorkspace(workspaceId) {
  const workspace = config.workspaces.find((item) => item.id === workspaceId) || config.workspaces[0];
  return normalizeWorkspace(workspace);
}

function getWorkspaceIdOrFallback(workspaceId) {
  return config.workspaces.some((workspace) => workspace.id === workspaceId)
    ? workspaceId
    : config.workspaces[0].id;
}

function getKanbanState(workspace) {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const storedState = readStoredJson(getKanbanStorageKey(normalizedWorkspace.id), null);
  return mergeKanbanState(normalizedWorkspace, storedState);
}

function saveKanbanState(workspaceId, state) {
  localStorage.setItem(getKanbanStorageKey(workspaceId), JSON.stringify(state));
}

function moveKanbanCard(workspaceId, fromColumnId, cardId, toColumnId, beforeCardId) {
  if (fromColumnId === toColumnId && cardId === beforeCardId) {
    return;
  }

  const workspace = getWorkspace(workspaceId);
  const state = getKanbanState(workspace);
  const sourceCards = state.columns[fromColumnId] || [];
  const card = sourceCards.find((item) => item.id === cardId);
  if (!card) {
    return;
  }

  if (!canMoveTaskToColumn(card, toColumnId, workspace)) {
    renderKanban(workspace);
    return;
  }

  state.columns[fromColumnId] = sourceCards.filter((item) => item.id !== cardId);

  const targetCards = fromColumnId === toColumnId ? state.columns[toColumnId] : [...(state.columns[toColumnId] || [])];
  const targetIndex = beforeCardId ? targetCards.findIndex((item) => item.id === beforeCardId) : targetCards.length;
  const insertionIndex = targetIndex < 0 ? targetCards.length : targetIndex;
  targetCards.splice(insertionIndex, 0, card);
  state.columns[toColumnId] = targetCards;

  saveKanbanState(workspaceId, state);
  renderKanban(workspace);
}

function mergeKanbanState(workspace, storedState) {
  const normalizedColumns = workspace.kanban.map((column) => ({
    id: column.id,
    cards: normalizeCards(column.cards, column.id)
  }));

  const baseState = {
    columns: Object.fromEntries(normalizedColumns.map((column) => [column.id, column.cards]))
  };

  if (!storedState || typeof storedState !== "object" || !storedState.columns) {
    return baseState;
  }

  const mergedColumns = {};
  for (const column of workspace.kanban) {
    const baseCards = baseState.columns[column.id] || [];
    const storedCards = Array.isArray(storedState.columns[column.id]) ? storedState.columns[column.id] : [];
    mergedColumns[column.id] = mergeCardLists(baseCards, storedCards, column.id);
  }

  return { columns: mergedColumns };
}

function mergeCardLists(baseCards, storedCards, columnId) {
  const normalizedStored = normalizeCards(storedCards, columnId);
  const byId = new Map(normalizedStored.map((card) => [card.id, card]));
  const ordered = [];

  for (const baseCard of baseCards) {
    if (byId.has(baseCard.id)) {
      ordered.push(byId.get(baseCard.id));
      byId.delete(baseCard.id);
    } else {
      ordered.push(baseCard);
    }
  }

  for (const card of byId.values()) {
    ordered.push(card);
  }

  return ordered;
}

function normalizeCards(cards, columnId) {
  return cards.map((card, index) => ({
    id: card.id || `${columnId}-${slugify(card.title)}-${index + 1}`,
    title: card.title,
    detail: card.detail,
    tag: card.tag,
    subtasks: normalizeTaskSubtasks(card.subtasks)
  }));
}

function normalizeTaskSubtasks(subtasks) {
  return (Array.isArray(subtasks) ? subtasks : [])
    .map((subtask, index) => ({
      id: subtask.id || `subtask-${index + 1}-${slugify(subtask.title || "item")}`,
      title: String(subtask.title || "").trim(),
      done: Boolean(subtask.done)
    }))
    .filter((subtask) => subtask.title);
}

function normalizeEventDay(day) {
  return DAY_ORDER.includes(day) ? day : DAY_ORDER[0];
}

function groupByDay(events) {
  const grouped = new Map(DAY_ORDER.map((day) => [day, []]));
  for (const event of events) {
    const day = normalizeEventDay(event.day);
    grouped.get(day).push(event);
  }
  return grouped;
}

function getEventsForDayLabel(events, dayLabel) {
  return (events || [])
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => matchesCalendarDay(event, dayLabel))
    .sort((left, right) => String(left.event.time || "").localeCompare(String(right.event.time || "")));
}

function getEventsForDate(events, date) {
  const dayLabel = getDayLabel(date);
  const dateKey = formatDateKey(date);
  return events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => matchesCalendarDate(event, dayLabel, dateKey))
    .sort((left, right) => String(left.event.time || "").localeCompare(String(right.event.time || "")));
}

function matchesCalendarDay(event, dayLabel) {
  if (!event) {
    return false;
  }

  if (event.dateKey && event.dateKey === dayLabel) {
    return true;
  }

  return normalizeEventDay(event.day) === dayLabel;
}

function matchesCalendarDate(event, dayLabel, dateKey) {
  if (!event) {
    return false;
  }

  if (event.dateKey) {
    return event.dateKey === dateKey;
  }

  return normalizeEventDay(event.day) === dayLabel;
}

function getDayLabel(date) {
  const weekdayIndex = date.getDay();
  return DAY_ORDER[(weekdayIndex + 6) % 7];
}

function startOfWeek(date) {
  const next = normalizeDate(date);
  const dayIndex = next.getDay();
  const offset = (dayIndex + 6) % 7;
  next.setDate(next.getDate() - offset);
  return next;
}

function startOfMonth(date) {
  const next = normalizeDate(date);
  next.setDate(1);
  return next;
}

function addDays(date, days) {
  const next = normalizeDate(date);
  next.setDate(next.getDate() + days);
  return next;
}

function sameDate(left, right) {
  return formatDateKey(left) === formatDateKey(right);
}

function formatMonthDay(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function formatLongDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

function formatMonthYear(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });
}

function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDateKey(date) {
  return normalizeDate(date).toISOString().slice(0, 10);
}

function applyTheme(workspaceData) {
  const root = document.documentElement.style;
  root.setProperty("--accent", workspaceData.accent || defaultConfig.workspaces[0].accent);
  root.setProperty("--accent-2", workspaceData.accent2 || defaultConfig.workspaces[0].accent2);
  root.setProperty("--bg-glow", colorToRgba(workspaceData.accent || defaultConfig.workspaces[0].accent, 0.16));
}

async function loadLocalConfig() {
  try {
    const module = await import("./config.local.js");
    return module.default || module;
  } catch {
    return {};
  }
}

function mergeDashboardConfig(base, ...overrides) {
  const merged = {
    ...base,
    workspaces: [...base.workspaces]
  };
  const topLevelKeys = [
    "defaultWorkspace",
    "aiEndpoint",
    "motivationQuoteEndpoint",
    "apiBaseUrl",
    "apiAccessToken",
    "cognitoRegion",
    "cognitoUserPoolId",
    "cognitoClientId",
    "cognitoHostedUiDomain",
    "cognitoRedirectUri",
    "cognitoLogoutUri"
  ];

  for (const override of overrides) {
    if (!override || typeof override !== "object") {
      continue;
    }

    for (const key of topLevelKeys) {
      if (typeof override[key] === "string" && override[key].trim()) {
        merged[key] = override[key];
      }
    }

    if (!Array.isArray(override.workspaces)) {
      continue;
    }

    for (const workspace of override.workspaces) {
      const normalizedWorkspace = {
        ...workspace,
        id: workspace.id || slugify(workspace.label || `workspace-${merged.workspaces.length + 1}`)
      };
      const index = merged.workspaces.findIndex((item) => item.id === normalizedWorkspace.id);
      if (index === -1) {
        merged.workspaces.push(normalizedWorkspace);
      } else {
        merged.workspaces[index] = {
          ...merged.workspaces[index],
          ...normalizedWorkspace
        };
      }
    }
  }

  return merged;
}

function readDragPayload(event) {
  if (currentDrag) {
    return currentDrag;
  }

  try {
    const data = event.dataTransfer.getData("text/plain");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function sanitizeForExport(value) {
  return JSON.parse(JSON.stringify(value));
}

function readStoredJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getKanbanStorageKey(workspaceId) {
  return `workspace-dashboard:kanban:${workspaceId}`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function colorToRgba(hex, alpha) {
  const cleaned = hex.replace("#", "");
  const normalized = cleaned.length === 3 ? cleaned.split("").map((char) => char + char).join("") : cleaned;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function formatDateStamp(date) {
  return date.toISOString().slice(0, 10);
}

function normalizeWorkspace(workspace) {
  const normalizedKanban = Array.isArray(workspace.kanban)
    ? workspace.kanban.map((column, index) => ({
        ...column,
        id: column.id || `column-${index + 1}`,
        cards: normalizeCards(Array.isArray(column.cards) ? column.cards : [], column.id || `column-${index + 1}`)
      }))
    : [];

  const normalizedCalendar = Array.isArray(workspace.calendar)
    ? workspace.calendar.map((event) => ({
        ...event,
        day: normalizeEventDay(event.day)
      }))
    : [];

  return {
    ...workspace,
    kanban: normalizedKanban,
    calendar: normalizedCalendar
  };
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));
      importBackup(payload);
    } catch (error) {
      console.error("Unable to import backup.", error);
      window.alert("That file could not be imported. Use a JSON backup exported from this dashboard.");
    } finally {
      backupFileEl.value = "";
    }
  };
  reader.readAsText(file);
}
