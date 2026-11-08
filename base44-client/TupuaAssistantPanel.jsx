import React, { useState } from "react";
import { sendTupuaAssistantMessage } from "./tupuaAssistantClient.js";

export default function TupuaAssistantPanel({ base44 }) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (busy || !input.trim()) return;
    setBusy(true);
    setError("");
    setAnswer("");
    try {
      const result = await sendTupuaAssistantMessage(base44, input);
      setAnswer(result);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assistant request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Tupua assistant" className="rounded-xl border p-4 space-y-3">
      <h2 className="text-lg font-semibold">Tupua Assistant</h2>
      <p className="text-sm opacity-75">Pressing Send transmits your message to the Base44 backend and OpenAI for processing. This panel does not save chat history. Do not submit passwords, personal identifiers, confidential records, or sensitive financial or health information.</p>
      <form onSubmit={submit} className="space-y-2">
        <textarea value={input} onChange={(event) => setInput(event.target.value)}
          maxLength={12000} rows={4} required aria-label="Message"
          placeholder="What would you like help working on?"
          className="w-full rounded-lg border bg-transparent p-3" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs opacity-70">{input.length}/12,000</span>
          <button type="submit" disabled={busy || !input.trim()} className="rounded-lg px-4 py-2 disabled:opacity-50">
            {busy ? "Working…" : "Send"}
          </button>
        </div>
      </form>
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      {answer ? <div aria-live="polite" className="whitespace-pre-wrap rounded-lg border p-3">{answer}</div> : null}
    </section>
  );
}
