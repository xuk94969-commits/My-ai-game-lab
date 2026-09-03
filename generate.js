// 告诉 Vercel 允许函数运行最多 60 秒（解决超时报错）
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  // 设置 CORS 跨域响应头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: '缺少 API Key' });
    }

    const isBearerToken = apiKey.startsWith("AQ.");

    const targetUrl = isBearerToken 
      ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (isBearerToken) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const systemInstruction = `你是一个 Canvas JavaScript 游戏专家。
只输出可直接在 JavaScript 中运行的代码，不要包含任何 markdown 标记（如 \`\`\`javascript）、不要包含 HTML，也不要包含任何解释。
必须在全局生成 canvas 上绘制游戏，canvas 的 id 为 "gameCanvas"。
在游戏开始或重新加载时，必须定义 window.__destroyCurrentGame 方法用于清理定时器和事件监听。`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemInstruction },
              { text: prompt }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ error: error.message || '内部服务器错误' });
  }
}