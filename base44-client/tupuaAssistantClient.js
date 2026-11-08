export async function sendTupuaAssistantMessage(base44, input) {
  if (!base44?.functions?.invoke) {
    throw new Error("The authenticated Base44 client is not available.");
  }
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("Enter a message first.");
  }
  if (input.length > 12_000) {
    throw new Error("Message exceeds the 12,000-character limit.");
  }
  const response = await base44.functions.invoke("tupuaAssistant", { input: input.trim() });
  const payload = response?.data ?? response;
  if (payload?.error) {
    throw new Error(payload.error.message || "The assistant request failed.");
  }
  const answer = payload?.data?.text;
  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("The assistant returned an empty response.");
  }
  return answer;
}
