'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RequireAuth } from '../components/RequireAuth';

type Mode = 'improve-existing' | 'new';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};


const INTRO_MESSAGE: Record<Mode | 'choose', string> = {
  choose:
    'Start by choosing whether you want to improve an existing prompt or build one from scratch. I’ll interview you and keep a live draft here.',
  'improve-existing':
    'Paste the prompt you have (or the part that feels weak) and tell me what you’re trying to do. I’ll ask questions and rewrite it with you.',
  new:
    'Tell me what you’re trying to do and what usually gets in the way. I’ll ask clarifying questions so we can build the prompt together.',
};

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${role}-${Date.now()}`;
  return { id, role, content };
}

function normalizeContent(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed?.assistantMessage === 'string') {
        return parsed.assistantMessage;
      }
      if (typeof parsed?.content === 'string') {
        return parsed.content;
      }
    } catch {
      return text;
    }
  }
  return text;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMessageContent(text: string) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre>${code.replace(/\n/g, '<br />')}</pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />');
}

export default function PromptlyPage() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', INTRO_MESSAGE.choose),
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSelectMode = (value: Mode) => {
    setMode(value);
    setMessages([createMessage('assistant', INTRO_MESSAGE[value])]);
  };

  const handleSend = async () => {
    if (!mode || !input.trim()) {
      return;
    }

    const userMessage = createMessage('user', input.trim());
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/promptly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach Promptly');
      }

      const data = (await response.json()) as {
        assistantMessage: string;
      };

      const assistantReply =
        data.assistantMessage ||
        'Got it — I’ll keep asking questions so we can shape this prompt.';

      setMessages((prev) => [...prev, createMessage('assistant', assistantReply)]);

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        createMessage(
          'assistant',
          'Something went wrong reaching Promptly. Check your connection and try again.'
        ),
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    if (!mode) {
      setMessages([createMessage('assistant', INTRO_MESSAGE.choose)]);
      setInput('');
      return;
    }
    setMessages([createMessage('assistant', INTRO_MESSAGE[mode])]);
    setInput('');
  };

  return (
    <RequireAuth
      title="Log in to use Promptly"
      description="Promptly lives inside the members area. Sign in to keep building prompts with Arthur."
      redirectTo="/promptly"
      requirePatron
      patronMessage="Promptly is available to current Patreon supporters. Link your membership to keep building prompts."
    >
      <main className="promptly-page">
      <section className="wrapper app-shell promptly-hero">
        <div className="promptly-back-wrap">
          <Link className="promptly-back-link" href="/" aria-label="Back to home">
            ← Back to My Life, By AI
          </Link>
        </div>
        <div className="promptly-hero-card">
          <span className="hero-eyebrow">Prompt help without the hype</span>
          <h1>Promptly helps you talk to ChatGPT like a person, not a vending machine.</h1>
          <p className="hero-support">
            Tell me what you&apos;re trying to do, what keeps tripping you up, or paste the prompt you already
            have. I&apos;ll diagnose what&apos;s missing (context, role, rubric, etc.), pick the best technique from the
            Prompt Guide, and build the prompt with you.
          </p>
          <p className="hero-support">
            When you like what you see, copy the prompt block below and drop it straight into ChatGPT.
          </p>
          <div className="promptly-mode-grid">
            <button
              className="promptly-mode-card"
              data-active={mode === 'improve-existing'}
              type="button"
              onClick={() => handleSelectMode('improve-existing')}
            >
              <h3>Improve an existing prompt</h3>
              <p>
                Paste the prompt you&apos;re using now. Promptly will inspect it, suggest what&apos;s missing, and
                rewrite it with clarifying questions.
              </p>
            </button>
            <button
              className="promptly-mode-card"
              data-active={mode === 'new'}
              type="button"
              onClick={() => handleSelectMode('new')}
            >
              <h3>Build from scratch</h3>
              <p>
                Start with your goal. Promptly will interview you for context, constraints, roles, and desired
                outputs before drafting anything.
              </p>
            </button>
          </div>
        </div>
      </section>

      <section className="wrapper app-shell promptly-layout">
        <div className="prompt-chat">
          <div className="prompt-messages" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`prompt-message ${message.role}`}
                dangerouslySetInnerHTML={{ __html: formatMessageContent(normalizeContent(message.content)) }}
              />
            ))}
          </div>
          <div className="prompt-input-row">
            <textarea
              placeholder={
                mode
                  ? 'Share what you’ve tried, what you’re stuck on, or the next detail I should know.'
                  : 'Choose a mode above to get started.'
              }
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={!mode || isSending}
            />
            <button
              className="prompt-send"
              type="button"
              onClick={handleSend}
              disabled={!mode || isSending || !input.trim()}
            >
              {isSending ? 'Thinking…' : 'Send'}
            </button>
          </div>
          <div className="prompt-actions">
            <button className="prompt-reset" type="button" onClick={handleReset} disabled={isSending}>
              Refresh
            </button>
          </div>
          <p className="prompt-note">Refresh keeps your mode selection and clears the conversation for a new prompt.</p>
        </div>
      </section>
      </main>
    </RequireAuth>
  );
}
