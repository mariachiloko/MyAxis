exports.handler = async (event) => {
  const routeKey = event?.routeKey || "";

  if (routeKey === "GET /health" || event?.rawPath === "/health") {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        service: "MyAxis",
        route: "health"
      })
    };
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ok: true,
      service: "MyAxis",
      message: "API scaffold is online."
    })
  };
};
