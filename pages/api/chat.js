export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { messages, model, temperature, max_tokens } = req.body || {};

  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "Missing server environment variable: ZHIPU_API_KEY. Please set it in Vercel project settings.",
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Request body must include messages[]" });
  }

  const finalModel = model || "glm-4-flash-250414";
  const finalTemperature =
    typeof temperature === "number" ? temperature : 0.6;
  const finalMaxTokens =
    typeof max_tokens === "number" ? max_tokens : 1024;

  try {
    const upstreamRes = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: finalModel,
        messages,
        temperature: finalTemperature,
        max_tokens: finalMaxTokens,
        stream: false,
      }),
    });

    const data = await upstreamRes.json().catch(() => null);

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        error: data?.error?.message || "GLM API request failed",
        details: data,
      });
    }

    const reply = data?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({
      error: "Server error while calling GLM API",
      details: err?.message || String(err),
    });
  }
}

