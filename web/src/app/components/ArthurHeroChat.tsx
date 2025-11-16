'use client';

import { useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMessageContent(text: string) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, '<br />');
}

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${role}-${Date.now()}`;
  return { id, role, content };
}

const INTRO_MESSAGE =
  "Hey, I see you.\n\nYou’ve tried to change before. This time we’re doing it differently: tiny steps, clear rules, and no shame when you fall off. Ask me where to start, what’s live on the site, or how the documentary and apps fit together.";

export function ArthurHeroChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', INTRO_MESSAGE),
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage = createMessage('user', trimmed);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/arthur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach Arthur');
      }

      const data = (await response.json()) as { assistantMessage?: string };
      const replyContent =
        data.assistantMessage ??
        "I’m having trouble reaching my brain right now, but the headline is: this site is about systems over willpower, the documentary on YouTube, and tools like Promptly to help you run your own version.";

      setMessages((prev) => [...prev, createMessage('assistant', replyContent)]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        createMessage(
          'assistant',
          "Something glitched on my side. For now, you can still explore the documentary on YouTube and the Promptly app from the cards below."
        ),
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const latestAssistantMessage =
    (
      messages
        .slice()
        .reverse()
        .find((message) => message.role === 'assistant') ?? messages[0]
    )?.content ?? INTRO_MESSAGE;

  return (
    <div className="chat-shell" aria-label="Chat with Arthur about this site">
      <div className="chat-header">
        <div className="chat-avatar">
          <span role="img" aria-label="Robot emoji">
            🤖
          </span>
        </div>
        <div>
          <div className="chat-header-title">Arthur, your AI life coach</div>
          <div className="chat-header-sub">
            Non-judgmental. Always on. Built for restarts.
          </div>
        </div>
      </div>
      <div className="chat-message">
        <div
          dangerouslySetInnerHTML={{
            __html: formatMessageContent(latestAssistantMessage),
          }}
        />
        {isSending && (
          <div className="chat-thinking">
            <span role="img" aria-label="Arthur thinking">
              🤖
            </span>
            <span>Arthur is thinking about the best way to guide you…</span>
          </div>
        )}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask where to start or what’s live…"
          aria-label="Message Arthur"
          disabled={isSending}
        />
        <button
          type="button"
          className="chat-input-button"
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12L4 4l16 8-16 8 1-8 9-0.02z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
