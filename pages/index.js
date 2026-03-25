import { useEffect, useMemo, useRef, useState } from "react";

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return "";
  }
}

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useState("你是一个有帮助的 AI 助手，回答清晰简洁。");
  const [model, setModel] = useState("glm-4-flash-250414");
  const [temperature, setTemperature] = useState(0.6);
  const [maxTokens, setMaxTokens] = useState(1024);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      content: "你好！输入你的问题，我会用智谱 GLM 帮你回答。",
      ts: Date.now(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const bottomRef = useRef(null);

  const requestMessages = useMemo(() => {
    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    return [{ role: "system", content: systemPrompt }, ...history];
  }, [messages, systemPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function onSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setErrorText("");

    // 由于 setMessages 是异步的，请求发出时显式把本轮用户消息带上
    const finalRequestMessages = [...requestMessages, { role: "user", content: text }];

    const userMsg = { role: "user", content: text, ts: Date.now() };
    const assistantMsg = {
      role: "assistant",
      content: "",
      ts: Date.now() + 1,
      _temp: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: finalRequestMessages,
          model,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }

      const reply = data?.reply ?? "";
      setMessages((prev) => {
        // 把刚才的临时 assistant 消息内容替换为真实回复
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i]._temp) {
            next[i] = { role: "assistant", content: reply || "（无回复）", ts: next[i].ts };
            break;
          }
        }
        return next;
      });
    } catch (err) {
      setErrorText(err?.message || "调用失败");
      setMessages((prev) => prev.filter((m) => !m._temp));
    } finally {
      setIsLoading(false);
    }
  }

  function onClear() {
    if (isLoading) return;
    setErrorText("");
    setMessages([
      {
        role: "assistant",
        content: "对话已清空。请继续提问。",
        ts: Date.now(),
      },
    ]);
    setInput("");
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="page">
      <div className="shell">
        <header className="top">
          <div className="title">
            <div className="name">GLM 聊天机器人</div>
            <div className="sub">Vercel 前端 + `/api/chat` 代理到智谱 GLM</div>
          </div>
          <div className="actions">
            <button className="btn ghost" onClick={onClear} disabled={isLoading}>
              清空对话
            </button>
          </div>
        </header>

        <div className="settings">
          <label className="field">
            <span className="label">模型</span>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="glm-4-flash-250414">glm-4-flash-250414（常用免费）</option>
              <option value="glm-4.7-flash">glm-4.7-flash</option>
              <option value="glm-4.7">glm-4.7</option>
              <option value="glm-5">glm-5</option>
            </select>
          </label>

          <label className="field">
            <span className="label">温度</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
            <span className="value">{temperature.toFixed(2)}</span>
          </label>

          <label className="field">
            <span className="label">max_tokens</span>
            <input
              type="number"
              min={128}
              max={8192}
              step={128}
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value || "1024", 10))}
            />
          </label>
        </div>

        <textarea
          className="systemPrompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={2}
          placeholder="系统提示词（可选）"
        />

        <main className="chat">
          {messages.map((m, idx) => (
            <div key={`${m.ts}-${idx}`} className={`msg ${m.role === "user" ? "user" : "assistant"}`}>
              <div className="bubble">
                <div className="content">{m.content}</div>
                <div className="meta">{m.role === "user" ? "你" : "助手"} {formatTime(m.ts)}</div>
              </div>
            </div>
          ))}
          {isLoading ? <div className="typing">正在生成…</div> : null}
          <div ref={bottomRef} />
        </main>

        <footer className="composer">
          <textarea
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="输入消息，Enter 发送（Shift+Enter 换行）"
            rows={2}
          />
          <button className="btn primary" onClick={onSend} disabled={isLoading || !input.trim()}>
            发送
          </button>
        </footer>

        {errorText ? <div className="error">{errorText}</div> : null}
      </div>
    </div>
  );
}

