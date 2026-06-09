const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");
const {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand
} = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const bedrock = new BedrockRuntimeClient({});
const DEFAULT_AI_MODEL = process.env.AI_MODEL_DEFAULT || "amazon.nova-micro-v1:0";
const LOCAL_MOTIVATION_QUOTES = [
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

const TABLES = {
  users: process.env.USERS_TABLE,
  workspaceSettings: process.env.WORKSPACE_SETTINGS_TABLE,
  calendarConnections: process.env.CALENDAR_CONNECTIONS_TABLE,
  workspaceState: process.env.WORKSPACE_STATE_TABLE
};

exports.handler = async (event) => {
  try {
    const method = event?.requestContext?.http?.method || event?.httpMethod || "GET";
    const path = normalizePath(event);

    if (isHealthRoute(method, path)) {
      return jsonResponse(200, {
        ok: true,
        service: "MyAxis",
        route: "health"
      });
    }

    const user = getUserContext(event);
    if (!user) {
      return jsonResponse(401, { ok: false, error: "Unauthorized" });
    }

    await touchUserRecord(user);

    if (method === "GET" && path === "/v1/me") {
      return jsonResponse(200, await getMePayload(user));
    }

    if (method === "POST" && path === "/v1/ai") {
      return await handleAI(user, event);
    }

    const workspaceMatch = path.match(/^\/v1\/workspaces\/([^/]+)\/(settings|calendar-connection|state)$/);
    if (workspaceMatch) {
      const workspaceId = decodeURIComponent(workspaceMatch[1]);
      const resource = workspaceMatch[2];

      if (resource === "settings") {
        return await handleWorkspaceSettings(method, user, workspaceId, event);
      }

      if (resource === "calendar-connection") {
        return await handleCalendarConnection(method, user, workspaceId, event);
      }

      if (resource === "state") {
        return await handleWorkspaceState(method, user, workspaceId, event);
      }
    }

    return jsonResponse(404, {
      ok: false,
      error: "Not found"
    });
  } catch (error) {
    console.error("MyAxis API error", error);
    return jsonResponse(500, {
      ok: false,
      error: "Internal server error"
    });
  }
};

function normalizePath(event) {
  return String(event?.rawPath || event?.path || "/").replace(/\/+$/, "") || "/";
}

function isHealthRoute(method, path) {
  return method === "GET" && (path === "/health" || path === "/v1/health");
}

function getUserContext(event) {
  const claims = event?.requestContext?.authorizer?.jwt?.claims || event?.requestContext?.authorizer?.claims || {};
  const userId = claims.sub || claims.username || claims["cognito:username"] || "";

  if (!userId) {
    return null;
  }

  return {
    userId,
    email: claims.email || "",
    displayName: claims.name || claims.preferred_username || claims.email || userId
  };
}

async function touchUserRecord(user) {
  const now = new Date().toISOString();
  const existing = await ddb.send(
    new GetCommand({
      TableName: TABLES.users,
      Key: { userId: user.userId }
    })
  );

  await ddb.send(
    new PutCommand({
      TableName: TABLES.users,
      Item: {
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        lastSeenAt: now,
        updatedAt: now,
        createdAt: existing.Item?.createdAt || now
      }
    })
  );
}

async function getMePayload(user) {
  const [userRecord, settingsItems, connectionItems, stateItems] = await Promise.all([
    ddb.send(
      new GetCommand({
        TableName: TABLES.users,
        Key: { userId: user.userId }
      })
    ),
    queryByUser(TABLES.workspaceSettings, user.userId),
    queryByUser(TABLES.calendarConnections, user.userId),
    queryByUser(TABLES.workspaceState, user.userId)
  ]);

  return {
    ok: true,
    user: userRecord.Item || {
      userId: user.userId,
      email: user.email,
      displayName: user.displayName
    },
    workspaceSettings: settingsItems,
    calendarConnections: connectionItems,
    workspaceStates: stateItems
  };
}

async function handleAI(user, event) {
  const body = parseJsonBody(event);
  const mode = String(body?.mode || "assistant").trim() === "motivation" ? "motivation" : "assistant";
  const model = String(body?.model || DEFAULT_AI_MODEL || "").trim() || DEFAULT_AI_MODEL;
  const workspace = normalizeWorkspaceObject(body?.workspace);
  const summary = buildWorkspaceSummary(workspace, body?.summary);
  const prompt = String(body?.prompt || "").trim();
  const messages = normalizeAIMessages(body?.messages, prompt);

  try {
    const resultText = await invokeBedrockAI({
      mode,
      model,
      workspace,
      summary,
      prompt,
      messages,
      style: String(body?.style || "").trim()
    });

    if (mode === "motivation") {
      return jsonResponse(200, {
        ok: true,
        model,
        quote: resultText
      });
    }

    return jsonResponse(200, {
      ok: true,
      model,
      text: resultText
    });
  } catch (error) {
    console.warn("Bedrock AI failed, using local fallback.", error);
    const fallback = mode === "motivation"
      ? generateLocalMotivationQuote(workspace)
      : generateLocalAssistantReply(workspace, prompt, summary);
    return jsonResponse(200, mode === "motivation"
      ? { ok: true, model, quote: fallback, fallback: true }
      : { ok: true, model, text: fallback, fallback: true });
  }
}

function normalizeWorkspaceObject(workspace) {
  if (!workspace || typeof workspace !== "object") {
    return {};
  }

  const normalized = {};
  for (const key of ["id", "label", "title", "description"]) {
    if (String(workspace[key] || "").trim()) {
      normalized[key] = String(workspace[key]).trim();
    }
  }
  return normalized;
}

function buildWorkspaceSummary(workspace, summary) {
  const normalized = {};
  const source = summary && typeof summary === "object" ? summary : {};
  for (const key of ["dayLabel", "nextAction", "tasksSummary", "scheduleSummary", "studySummary", "storySummary", "homeSummary"]) {
    if (String(source[key] || "").trim()) {
      normalized[key] = String(source[key]).trim();
    }
  }

  if (!normalized.dayLabel) {
    normalized.dayLabel = "Today";
  }

  return normalized;
}

function normalizeAIMessages(messages, prompt) {
  const normalized = (Array.isArray(messages) ? messages : [])
    .map((message) => {
      const role = message?.role === "assistant" ? "assistant" : "user";
      const text = String(message?.content || "").trim();
      if (!text) {
        return null;
      }

      return {
        role,
        content: [{ text }]
      };
    })
    .filter(Boolean);

  if (!normalized.length && prompt) {
    normalized.push({
      role: "user",
      content: [{ text: prompt }]
    });
  }

  return normalized;
}

function generateLocalMotivationQuote(workspace) {
  const index = Math.floor(Math.random() * LOCAL_MOTIVATION_QUOTES.length);
  const quote = LOCAL_MOTIVATION_QUOTES[index] || "Keep the next step small and visible.";
  const workspaceLabel = workspace?.label || workspace?.title || workspace?.id || "workspace";
  return String(quote).replace(/\bworkspace\b/gi, workspaceLabel);
}

function buildAISystemPrompt({ mode, workspace, summary, style }) {
  const workspaceLabel = workspace.label || workspace.title || workspace.id || "workspace";
  const guidance = mode === "motivation"
    ? [
        "Write one short motivational sentence.",
        "Keep it practical, warm, and encouraging.",
        "Do not add a title, bullets, or markdown.",
        "Do not summarize the workspace unless it helps the quote."
      ]
    : [
        "Reply directly to the user's latest message.",
        "Be conversational and useful.",
        "Do not summarize the workspace, mention next action, or restate schedule unless the user asks for it.",
        "Do not add a title or markdown unless it helps."
      ];

  return [
    `You are the MyAxis assistant for the ${workspaceLabel} workspace.`,
    style || "",
    ...guidance
  ]
    .filter(Boolean)
    .join(" ");
}

async function invokeBedrockAI({ mode, model, workspace, summary, prompt, messages, style }) {
  const system = [{ text: buildAISystemPrompt({ mode, workspace, summary, style }) }];
  const conversation = Array.isArray(messages) && messages.length
    ? messages
    : [{
        role: "user",
        content: [{
          text: mode === "motivation"
            ? `Write a short motivational quote for the ${workspace.label || workspace.id || "workspace"} workspace.`
            : prompt || `Reply using the workspace context for the ${workspace.label || workspace.id || "workspace"} workspace.`
        }]
      }];

  const response = await bedrock.send(
    new ConverseCommand({
      modelId: model,
      messages: conversation,
      system,
      inferenceConfig: {
        maxTokens: mode === "motivation" ? 96 : 256,
        temperature: mode === "motivation" ? 0.8 : 0.4,
        topP: 0.9
      }
    })
  );

  const text = extractBedrockText(response);
  if (!text) {
    throw new Error("Bedrock returned no text.");
  }

  return text;
}

function generateLocalAssistantReply(workspace, prompt, summary) {
  const normalizedPrompt = String(prompt || "").toLowerCase();
  const nextAction = summary?.nextAction || "No obvious next action yet.";
  const dayLabel = summary?.dayLabel || `${workspace.label || workspace.title || workspace.id || "workspace"} today`;

  if (normalizedPrompt.includes("summarize") || normalizedPrompt.includes("summary")) {
    return `${dayLabel}. ${summary?.tasksSummary || ""} ${summary?.scheduleSummary || ""}`.trim();
  }

  if (normalizedPrompt.includes("next") || normalizedPrompt.includes("what should i do")) {
    return `Your next action is ${nextAction} ${summary?.scheduleSummary || ""}`.trim();
  }

  if (normalizedPrompt.includes("study")) {
    return summary?.studySummary || "There are no study cards in this workspace yet.";
  }

  if (normalizedPrompt.includes("work story") || normalizedPrompt.includes("story")) {
    return summary?.storySummary || "There are no work story cards in this workspace yet.";
  }

  if (normalizedPrompt.includes("home") || normalizedPrompt.includes("menu") || normalizedPrompt.includes("grocery")) {
    return summary?.homeSummary || "This workspace is not using home planning mode.";
  }

  if (normalizedPrompt.includes("schedule")) {
    return summary?.scheduleSummary || "There is no scheduled item in the selected day yet.";
  }

  if (normalizedPrompt.includes("task") || normalizedPrompt.includes("todo")) {
    return summary?.tasksSummary || "There are no tasks in this workspace yet.";
  }

  return `${dayLabel}. ${nextAction} I can also summarize tasks, schedule, study prompts, or work stories if you want.`;
}

function extractBedrockText(response) {
  const content = Array.isArray(response?.output?.message?.content) ? response.output.message.content : [];
  const text = content
    .map((item) => String(item?.text || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  if (text) {
    return text;
  }

  if (String(response?.output_text || "").trim()) {
    return String(response.output_text).trim();
  }

  return "";
}

async function handleWorkspaceSettings(method, user, workspaceId, event) {
  if (method === "GET") {
    const record = await getItem(TABLES.workspaceSettings, user.userId, workspaceId);
    return jsonResponse(200, {
      ok: true,
      workspaceId,
      settings: record?.settings || null,
      updatedAt: record?.updatedAt || null
    });
  }

  if (method === "PUT" || method === "POST") {
    const body = parseJsonBody(event);
    const settings = sanitizeWorkspaceSettings(body);
    const now = new Date().toISOString();

    await ddb.send(
      new PutCommand({
        TableName: TABLES.workspaceSettings,
        Item: {
          userId: user.userId,
          workspaceId,
          settings,
          updatedAt: now,
          createdAt: (await getItem(TABLES.workspaceSettings, user.userId, workspaceId))?.createdAt || now
        }
      })
    );

    return jsonResponse(200, {
      ok: true,
      workspaceId,
      settings,
      updatedAt: now
    });
  }

  if (method === "DELETE") {
    await ddb.send(
      new DeleteCommand({
        TableName: TABLES.workspaceSettings,
        Key: {
          userId: user.userId,
          workspaceId
        }
      })
    );

    return jsonResponse(200, {
      ok: true,
      workspaceId,
      deleted: true
    });
  }

  return methodNotAllowed(["GET", "PUT", "POST", "DELETE"]);
}

async function handleCalendarConnection(method, user, workspaceId, event) {
  if (method === "GET") {
    const record = await getItem(TABLES.calendarConnections, user.userId, workspaceId);
    return jsonResponse(200, {
      ok: true,
      workspaceId,
      connection: record?.connection || null,
      updatedAt: record?.updatedAt || null
    });
  }

  if (method === "PUT" || method === "POST") {
    const body = parseJsonBody(event);
    const connection = sanitizeCalendarConnection(body);
    const now = new Date().toISOString();

    await ddb.send(
      new PutCommand({
        TableName: TABLES.calendarConnections,
        Item: {
          userId: user.userId,
          workspaceId,
          connection,
          updatedAt: now,
          createdAt: (await getItem(TABLES.calendarConnections, user.userId, workspaceId))?.createdAt || now
        }
      })
    );

    return jsonResponse(200, {
      ok: true,
      workspaceId,
      connection,
      updatedAt: now
    });
  }

  if (method === "DELETE") {
    await ddb.send(
      new DeleteCommand({
        TableName: TABLES.calendarConnections,
        Key: {
          userId: user.userId,
          workspaceId
        }
      })
    );

    return jsonResponse(200, {
      ok: true,
      workspaceId,
      deleted: true
    });
  }

  return methodNotAllowed(["GET", "PUT", "POST", "DELETE"]);
}

async function handleWorkspaceState(method, user, workspaceId, event) {
  if (method === "GET") {
    const record = await getItem(TABLES.workspaceState, user.userId, workspaceId);
    return jsonResponse(200, {
      ok: true,
      workspaceId,
      workspace: record?.workspace || null,
      state: record?.state || null,
      updatedAt: record?.updatedAt || null
    });
  }

  if (method === "PUT" || method === "POST") {
    const body = parseJsonBody(event);
    const nextWorkspace = sanitizeWorkspaceObject(body.workspace);
    const nextState = sanitizeWorkspaceLocalState(body.state);
    const now = new Date().toISOString();

    await ddb.send(
      new PutCommand({
        TableName: TABLES.workspaceState,
        Item: {
          userId: user.userId,
          workspaceId,
          workspace: Object.keys(nextWorkspace).length ? nextWorkspace : null,
          state: Object.keys(nextState).length ? nextState : null,
          updatedAt: now,
          createdAt: (await getItem(TABLES.workspaceState, user.userId, workspaceId))?.createdAt || now
        }
      })
    );

    return jsonResponse(200, {
      ok: true,
      workspaceId,
      workspace: Object.keys(nextWorkspace).length ? nextWorkspace : null,
      state: Object.keys(nextState).length ? nextState : null,
      updatedAt: now
    });
  }

  if (method === "DELETE") {
    await ddb.send(
      new DeleteCommand({
        TableName: TABLES.workspaceState,
        Key: {
          userId: user.userId,
          workspaceId
        }
      })
    );

    return jsonResponse(200, {
      ok: true,
      workspaceId,
      deleted: true
    });
  }

  return methodNotAllowed(["GET", "PUT", "POST", "DELETE"]);
}

async function getItem(tableName, userId, workspaceId) {
  const response = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { userId, workspaceId }
    })
  );

  return response.Item || null;
}

async function queryByUser(tableName, userId) {
  const response = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    })
  );

  return response.Items || [];
}

function sanitizeWorkspaceSettings(body) {
  if (!body || typeof body !== "object") {
    return {};
  }

  return {
    label: stringValue(body.label),
    title: stringValue(body.title),
    description: stringValue(body.description),
    accent: stringValue(body.accent),
    accent2: stringValue(body.accent2),
    defaultWorkspace: String(body.defaultWorkspace || "").trim() || null
  };
}

function sanitizeCalendarConnection(body) {
  if (!body || typeof body !== "object") {
    return {};
  }

  const calendarIds = normalizeCalendarIds(body.calendarIds || body.calendarId);

  return {
    provider: String(body.provider || "google").trim() || "google",
    clientId: stringValue(body.clientId),
    calendarId: calendarIds[0] || stringValue(body.calendarId) || "primary",
    calendarIds,
    enabled: Boolean(body.enabled),
    label: stringValue(body.label),
    sourceWorkspaceId: stringValue(body.sourceWorkspaceId) || null
  };
}

function normalizeCalendarIds(value) {
  const list = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/[,\n]/)
        .map((item) => item.trim());

  const uniqueIds = Array.from(new Set(list.map((item) => String(item || "").trim()).filter(Boolean)));
  return uniqueIds.length ? uniqueIds : ["primary"];
}

function sanitizeWorkspaceObject(workspace) {
  if (!workspace || typeof workspace !== "object") {
    return {};
  }

  const next = {};
  const stringKeys = ["label", "title", "description", "eyebrow", "quote", "captureHint", "scratchpadKey"];
  for (const key of stringKeys) {
    if (String(workspace[key] || "").trim()) {
      next[key] = String(workspace[key]).trim();
    }
  }

  if (String(workspace.id || "").trim()) {
    next.id = String(workspace.id).trim();
  }

  if (String(workspace.accent || "").trim()) {
    next.accent = String(workspace.accent).trim();
  }

  if (String(workspace.accent2 || "").trim()) {
    next.accent2 = String(workspace.accent2).trim();
  }

  if (Array.isArray(workspace.stats)) {
    next.stats = workspace.stats;
  }

  if (Array.isArray(workspace.schedule)) {
    next.schedule = workspace.schedule;
  }

  if (Array.isArray(workspace.kanban)) {
    next.kanban = workspace.kanban;
  }

  if (Array.isArray(workspace.calendar)) {
    next.calendar = workspace.calendar;
  }

  if (Array.isArray(workspace.goals)) {
    next.goals = workspace.goals;
  }

  if (workspace.spotlight && typeof workspace.spotlight === "object") {
    next.spotlight = workspace.spotlight;
  }

  if (workspace.todos && typeof workspace.todos === "object") {
    next.todos = workspace.todos;
  }

  if (workspace.groceries && typeof workspace.groceries === "object") {
    next.groceries = workspace.groceries;
  }

  if (workspace.menuByDay && typeof workspace.menuByDay === "object") {
    next.menuByDay = workspace.menuByDay;
  }

  return next;
}

function sanitizeWorkspaceLocalState(state) {
  if (!state || typeof state !== "object") {
    return {};
  }

  const next = {};
  const stringKeys = ["scratchpad", "homeMenuDay", "captureMode", "captureFollowSide", "captureAssistant", "selectedScheduleDay"];
  for (const key of stringKeys) {
    if (String(state[key] || "").trim()) {
      next[key] = String(state[key]).trim();
    }
  }

  if (typeof state.captureFollow === "boolean") {
    next.captureFollow = state.captureFollow;
  }

  if (typeof state.captureCalculator === "string") {
    next.captureCalculator = state.captureCalculator;
  }

  if (state.captureBoard && typeof state.captureBoard === "object") {
    next.captureBoard = state.captureBoard;
  }

  if (Array.isArray(state.kanban)) {
    next.kanban = state.kanban;
  }

  if (Array.isArray(state.schedule)) {
    next.schedule = state.schedule;
  }

  if (Array.isArray(state.flashcards)) {
    next.flashcards = state.flashcards;
  }

  if (state.widgetVisibility && typeof state.widgetVisibility === "object") {
    next.widgetVisibility = state.widgetVisibility;
  }

  if (state.weatherSettings && typeof state.weatherSettings === "object") {
    next.weatherSettings = state.weatherSettings;
  }

  if (state.weatherCache && typeof state.weatherCache === "object") {
    next.weatherCache = state.weatherCache;
  }

  if (state.spotifySettings && typeof state.spotifySettings === "object") {
    next.spotifySettings = state.spotifySettings;
  }

  if (state.home && typeof state.home === "object") {
    next.home = state.home;
  }

  if (Array.isArray(state.hiddenCalendarEvents)) {
    next.hiddenCalendarEvents = state.hiddenCalendarEvents;
  }

  if (Array.isArray(state.calendarTodos)) {
    next.calendarTodos = state.calendarTodos;
  }

  if (state.homeCalendarConnection && typeof state.homeCalendarConnection === "object") {
    next.homeCalendarConnection = state.homeCalendarConnection;
  }

  if (Array.isArray(state.homeCalendarCache)) {
    next.homeCalendarCache = state.homeCalendarCache;
  }

  return next;
}

function stringValue(value) {
  return String(value || "").trim();
}

function parseJsonBody(event) {
  if (!event?.body) {
    return {};
  }

  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function methodNotAllowed(allowed) {
  return jsonResponse(405, {
    ok: false,
    error: "Method not allowed",
    allowed
  });
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type,authorization,x-amz-date,x-api-key,x-amz-security-token",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    },
    body: JSON.stringify(payload)
  };
}
