const { Mistral } = require('@mistralai/mistralai');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 加载环境变量
try {
    require('dotenv').config();
} catch (e) {
    // dotenv不是必需的，如果不存在就跳过
}

const server = http.createServer();
const port = process.env.PORT || 3000;

// 从环境变量获取API密钥
const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
    console.error('Error: MISTRAL_API_KEY environment variable is required');
    process.exit(1);
}

const client = new Mistral({ apiKey: apiKey });

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// 处理静态文件
function serveStaticFile(filePath, response) {
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.ico':
            contentType = 'image/x-icon';
            break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                response.writeHead(404, { 'Content-Type': 'text/plain' });
                response.end('File not found');
            } else {
                response.writeHead(500, { 'Content-Type': 'text/plain' });
                response.end('Server error');
            }
        } else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
}

server.on('request', async (request, response) => {
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;

    // 设置CORS头
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        response.writeHead(200);
        response.end();
        return;
    }

    // 路由处理
    if (pathname === '/' || pathname === '/index.html') {
        serveStaticFile('./public/index.html', response);
    } else if (pathname === '/style.css') {
        serveStaticFile('./public/style.css', response);
    } else if (pathname === '/script.js') {
        serveStaticFile('./public/script.js', response);
    } else if (pathname === '/api/chat' && request.method === 'POST') {
        await handleChatRequest(request, response);
    } else {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.end('Page not found');
    }
});

// 处理聊天请求 - 支持SSE
async function handleChatRequest(request, response) {
    let body = '';
    request.on('data', chunk => {
        body += chunk.toString();
    });

    request.on('end', async () => {
        try {
            const { message } = JSON.parse(body);
            
            if (!message) {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Message is required' }));
                return;
            }

            // 设置SSE头
            response.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });

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
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
    });
}

