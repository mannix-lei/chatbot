// Cloudflare Workers API for chat functionality
export async function onRequestPost(context) {
    const { request, env } = context;
    
    // 设置CORS头
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { message } = await request.json();
        
        if (!message) {
            return new Response(
                JSON.stringify({ error: 'Message is required' }), 
                { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // 从环境变量获取API密钥
        const apiKey = env.MISTRAL_API_KEY;
        
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'API key not configured' }), 
                { 
                    status: 500, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // 设置SSE响应头
        const sseHeaders = {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        };

        // 创建可读流用于SSE
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        // 异步处理Mistral API调用
        (async () => {
            try {
                // 发送开始事件
                await writer.write(new TextEncoder().encode('data: {"type": "start"}\n\n'));

                // 调用Mistral AI API
                const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'devstral-medium-latest',
                        messages: [{ role: 'user', content: message }],
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Mistral API error: ${response.status}`);
                }

                const data = await response.json();
                const content = data.choices[0].message.content;

                // 逐字符发送以实现打字机效果
                for (let i = 0; i < content.length; i++) {
                    const char = content[i];
                    const tokenData = JSON.stringify({ type: 'token', content: char });
                    await writer.write(new TextEncoder().encode(`data: ${tokenData}\n\n`));
                    
                    // 根据字符类型调整延迟
                    let delay = 30;
                    if (char === '.' || char === '!' || char === '?') {
                        delay = 200;
                    } else if (char === ',' || char === '；' || char === '：') {
                        delay = 100;
                    } else if (char === ' ') {
                        delay = 50;
                    } else if (/[\u4e00-\u9fa5]/.test(char)) {
                        delay = 60;
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                // 发送结束事件
                await writer.write(new TextEncoder().encode('data: {"type": "end"}\n\n'));
                
            } catch (error) {
                console.error('Mistral API Error:', error);
                const errorData = JSON.stringify({ 
                    type: 'error', 
                    content: 'Sorry, there was an error processing your request.' 
                });
                await writer.write(new TextEncoder().encode(`data: ${errorData}\n\n`));
            } finally {
                await writer.close();
            }
        })();

        return new Response(readable, { headers: sseHeaders });

    } catch (error) {
        console.error('Request processing error:', error);
        return new Response(
            JSON.stringify({ error: 'Invalid request' }), 
            { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
}
