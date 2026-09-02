export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, apiKey } = req.body;

  try {
    const isBearerToken = apiKey.startsWith("AQ.");
    const url = isBearerToken 
      ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const headers = { 'Content-Type': 'application/json' };
    if (isBearerToken) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const systemInstruction = `你是一个 Canvas JavaScript 游戏专家。
只输出可直接在 JavaScript 中运行的代码，不要包含任何 markdown 标记（如 \`\`\`javascript）、不要包含 HTML，也不要包含任何解释。
必须在全局生成 canvas 上绘制游戏，canvas 的 id 为 "gameCanvas"。
在游戏开始或重新加载时，必须定义 window.__destroyCurrentGame 方法用于清理定时器和事件监听。`;

    const googleRes = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemInstruction },
            { text: prompt }
          ]
        }]
      })
    });

    const data = await googleRes.json();
    return res.status(googleRes.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}