require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(express.static('.'));

// 每 IP 24 小时限制 20 次请求
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 20,
  message: { error: '今日 20 次生成机会已用完，明天再来吧！' }
});

// 初始化 Gemini AI 客户端
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/game', limiter, async (req, res) => {
  try {
    const { command } = req.body;
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `你是一个 Canvas 游戏开发助手。根据用户指令生成游戏 JS 代码。
严格仅返回 JSON 格式：{"gameTitle":"名称","jsCode":"完整的 JS 代码，直接基于 id 为 gameCanvas 的 canvas 绘制，用自执行函数包裹，清理函数挂在 window.__destroyCurrentGame"}
用户指令：${command}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    res.json({ success: true, jsCode: data.jsCode });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || '生成失败' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`服务已启动：http://localhost:${PORT}`));