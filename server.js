require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const { OpenAI } = require('openai');

const app = express();
app.use(express.json());
app.use(express.static('.')); // 直接把当前文件夹里的网页加载出来

// 1. 限制每个 IP 每天只能调用 20 次
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24小时
  max: 20,                       // 20次
  message: { error: '今日 20 次生成机会已用完，明天再来吧！' }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

// 2. 接收指令并调用 AI
app.post('/api/game', limiter, async (req, res) => {
  try {
    const { command } = req.body;
    
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat', // 也可以换成其他大模型
      messages: [
        {
          role: 'system',
          content: `你是一个Canvas游戏开发助手。根据用户指令生成游戏JS代码。
仅返回JSON：{"gameTitle":"名称","jsCode":"完整的JS代码，直接基于id为gameCanvas的canvas绘制，用自执行函数包裹，清理函数挂在 window.__destroyCurrentGame"}`
        },
        { role: 'user', content: command }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    res.json({ success: true, jsCode: result.jsCode });

  } catch (err) {
    res.status(500).json({ error: err.message || '生成失败' });
  }
});

app.listen(3000, () => console.log('服务已启动：http://localhost:3000'));