class ChatBot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.autoResizeTextarea();
        this.updateCharCount();
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        // 发送按钮点击事件
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // 输入框键盘事件
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 输入框输入事件
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateCharCount();
            this.updateSendButton();
        });

        // 粘贴事件
        this.messageInput.addEventListener('paste', () => {
            setTimeout(() => {
                this.autoResizeTextarea();
                this.updateCharCount();
            }, 0);
        });
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
    }

    updateCharCount() {
        const charCount = document.querySelector('.char-count');
        const length = this.messageInput.value.length;
        charCount.textContent = `${length}/1000`;
        
        if (length > 900) {
            charCount.style.color = 'var(--error-color)';
        } else if (length > 800) {
            charCount.style.color = 'var(--warning-color)';
        } else {
            charCount.style.color = 'var(--text-muted)';
        }
    }

    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message) {
            this.showToast('请输入消息内容', 'warning');
            return;
        }

        if (message.length > 1000) {
            this.showToast('消息长度不能超过1000字符', 'error');
            return;
        }

        // 显示用户消息
        this.addMessage(message, 'user');
        
        // 清空输入框
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.updateCharCount();
        this.updateSendButton();

        // 显示打字指示器
        const typingId = this.showTypingIndicator();

        try {
            // 发送消息到服务器
            await this.sendToServer(message, typingId);
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator(typingId);
            this.showToast('发送消息失败，请重试', 'error');
        }
    }

    async sendToServer(message, typingId) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 处理SSE流
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let botMessageId = null;
            let fullContent = '';
            let displayedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.type === 'start') {
                                // 隐藏打字指示器，开始显示实际回复
                                this.hideTypingIndicator(typingId);
                                botMessageId = this.addMessage('', 'bot');
                            } else if (data.type === 'token') {
                                // 累加完整内容
                                fullContent += data.content;
                                
                                // 实现打字机效果：逐字符显示
                                await this.animateTextUpdate(botMessageId, displayedContent, fullContent);
                                displayedContent = fullContent;
                            } else if (data.type === 'end') {
                                // 确保最终内容完全显示，并移除光标效果
                                if (botMessageId) {
                                    if (displayedContent !== fullContent) {
                                        this.updateMessage(botMessageId, fullContent);
                                    }
                                    this.finishTyping(botMessageId);
                                }
                                break;
                            } else if (data.type === 'error') {
                                // 处理错误
                                this.hideTypingIndicator(typingId);
                                this.addMessage(data.content || '抱歉，处理您的请求时出现了错误。', 'bot');
                                this.showToast('AI回复时出现错误', 'error');
                                return;
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error in sendToServer:', error);
            throw error;
        }
    }

    // 动画化文本更新，实现平滑的打字机效果
    async animateTextUpdate(messageId, currentText, targetText) {
        if (currentText === targetText) return;
        
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;

        const messageTextElement = messageElement.querySelector('.message-content p');
        if (!messageTextElement) return;

        // 添加打字机效果类
        messageElement.classList.add('typing-message');

        // 计算需要添加的文本
        const newText = targetText.slice(currentText.length);
        
        // 逐字符添加，创建真正的打字机效果
        for (let i = 0; i < newText.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 25)); // 控制打字速度
            const partialText = currentText + newText.slice(0, i + 1);
            messageTextElement.textContent = partialText;
            this.scrollToBottom();
        }
    }

    // 完成打字机效果
    finishTyping(messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.classList.remove('typing-message');
        }
    }

    addMessage(content, type) {
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const time = this.formatTime(new Date());
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${type}-message`;
        messageWrapper.id = messageId;

        const avatar = document.createElement('div');
        avatar.className = `avatar ${type}-avatar`;
        
        if (type === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        } else {
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
        }

        const message = document.createElement('div');
        message.className = 'message';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('p');
        messageText.textContent = content;
        messageContent.appendChild(messageText);

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = time;

        message.appendChild(messageContent);
        message.appendChild(messageTime);

        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(message);

        this.chatMessages.appendChild(messageWrapper);
        this.scrollToBottom();

        return messageId;
    }

    updateMessage(messageId, content) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            const messageText = messageElement.querySelector('.message-content p');
            if (messageText) {
                messageText.textContent = content;
                this.scrollToBottom();
            }
        }
    }

    // 新增：打字机效果更新消息
    updateMessageWithTypewriter(messageId, newContent, speed = 30) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;

        const messageText = messageElement.querySelector('.message-content p');
        if (!messageText) return;

        const currentContent = messageText.textContent;
        
        // 如果新内容比当前内容长，添加打字机效果
        if (newContent.length > currentContent.length) {
            const addedText = newContent.slice(currentContent.length);
            this.typewriterEffect(messageText, currentContent, addedText, speed);
        } else {
            // 直接更新内容
            messageText.textContent = newContent;
            this.scrollToBottom();
        }
    }

    // 打字机效果实现
    typewriterEffect(element, baseContent, newText, speed = 30) {
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < newText.length) {
                element.textContent = baseContent + newText.slice(0, index + 1);
                index++;
                this.scrollToBottom();
            } else {
                clearInterval(typeInterval);
            }
        }, speed);
    }

    showTypingIndicator() {
        const typingId = 'typing_' + Date.now();
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper bot-message';
        messageWrapper.id = typingId;

        const avatar = document.createElement('div');
        avatar.className = 'avatar bot-avatar';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';

        const message = document.createElement('div');
        message.className = 'message';

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        
        const typingText = document.createElement('span');
        typingText.textContent = 'AI正在思考';
        
        const typingDots = document.createElement('div');
        typingDots.className = 'typing-dots';
        typingDots.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

        typingIndicator.appendChild(typingText);
        typingIndicator.appendChild(typingDots);
        message.appendChild(typingIndicator);

        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(message);

        this.chatMessages.appendChild(messageWrapper);
        this.scrollToBottom();

        return typingId;
    }

    hideTypingIndicator(typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    formatTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) {
            return '刚刚';
        } else if (diffMins < 60) {
            return `${diffMins}分钟前`;
        } else if (diffMins < 1440) {
            const diffHours = Math.floor(diffMins / 60);
            return `${diffHours}小时前`;
        } else {
            return date.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    showToast(message, type = 'info') {
        this.toastMessage.textContent = message;
        this.toast.className = `toast ${type} show`;
        
        // 自动隐藏
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    showWelcomeMessage() {
        // 欢迎消息已在HTML中静态添加
        this.scrollToBottom();
    }

    showLoading() {
        this.loadingOverlay.classList.add('show');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('show');
    }
}

// 页面加载完成后初始化聊天机器人
document.addEventListener('DOMContentLoaded', () => {
    window.chatBot = new ChatBot();
    
    // 添加一些键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + / 聚焦到输入框
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            window.chatBot.messageInput.focus();
        }
        
        // Escape 清空输入框
        if (e.key === 'Escape' && document.activeElement === window.chatBot.messageInput) {
            window.chatBot.messageInput.value = '';
            window.chatBot.autoResizeTextarea();
            window.chatBot.updateCharCount();
            window.chatBot.updateSendButton();
        }
    });
});

// 导出为全局变量以便调试
window.ChatBot = ChatBot;
