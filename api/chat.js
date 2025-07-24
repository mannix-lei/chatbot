const { Mistral } = require('@mistralai/mistralai');

// 从环境变量获取API密钥
const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
    console.error('Error: MISTRAL_API_KEY environment variable is required');
}

const client = new Mistral({ apiKey: apiKey });

module.exports = async (request, response) => {
    // 设置CORS头
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { message } = request.body;
        
        if (!message) {
            response.status(400).json({ error: 'Message is required' });
            return;
        }

        // 设置SSE头
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');

        // 发送开始事件
        response.write('data: {"type": "start"}\n\n');

        try {
            // 调用Mistral API
            const chatResponse = await client.chat.complete({
                model: 'devstral-medium-latest',
                messages: [{ role: 'user', content: message }],
            });

            const content = chatResponse.choices[0].message.content;
            
            // 逐字符发送以实现真正的打字机效果
            for (let i = 0; i < content.length; i++) {
                const char = content[i];
                response.write(`data: ${JSON.stringify({ type: 'token', content: char })}\n\n`);
                
                // 根据字符类型调整延迟
                let delay = 30; // 默认延迟
                if (char === '.' || char === '!' || char === '?') {
                    delay = 200; // 句号等标点符号后稍长延迟
                } else if (char === ',' || char === '；' || char === '：') {
                    delay = 100; // 逗号等稍短延迟
                } else if (char === ' ') {
                    delay = 50; // 空格稍短延迟
                } else if (/[\u4e00-\u9fa5]/.test(char)) {
                    delay = 60; // 中文字符稍长延迟
                }
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            // 发送结束事件
            response.write('data: {"type": "end"}\n\n');
            response.end();

        } catch (error) {
            console.error('Mistral API Error:', error);
            response.write(`data: ${JSON.stringify({ type: 'error', content: 'Sorry, there was an error processing your request.' })}\n\n`);
            response.end();
        }

    } catch (error) {
        console.error('Request processing error:', error);
        response.status(400).json({ error: 'Invalid request' });
    }
}
