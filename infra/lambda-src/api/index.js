const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand
} = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

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
