import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Bot, User, Loader2, Sparkles, Lightbulb, BookOpen, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

const suggestions = [
  { icon: Lightbulb, text: "Explain closures in JavaScript", color: "text-amber-500 bg-amber-50" },
  { icon: BookOpen, text: "Summarize key concepts of machine learning", color: "text-blue-500 bg-blue-50" },
  { icon: Code, text: "How do React hooks work?", color: "text-emerald-500 bg-emerald-50" },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input;
    if (!userMsg.trim()) return;

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const contextPrompt = newMessages
      .slice(-6)
      .map(m => `${m.role === "user" ? "Student" : "Assistant"}: ${m.content}`)
      .join("\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are SkillSync AI Learning Assistant - a helpful, encouraging tutor for students. 
You help explain concepts, answer learning questions, provide summaries, and suggest resources.
Keep answers clear, concise and well-structured using markdown formatting.

Conversation so far:
${contextPrompt}

Respond to the student's latest message helpfully:`,
    });

    setMessages([...newMessages, { role: "assistant", content: response }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Learning Assistant</h1>
          <p className="text-sm text-slate-500">Ask me anything about your studies</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-violet-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">How can I help you learn?</h2>
            <p className="text-slate-400 mb-8 max-w-sm">I can explain topics, answer questions, create summaries, and suggest learning resources.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.text)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition text-sm text-slate-600"
                >
                  <s.icon className={`w-4 h-4 ${s.color.split(" ")[0]}`} />
                  {s.text}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-slate-200"
              }`}>
                {msg.role === "user" ? (
                  <p className="text-sm">{msg.content}</p>
                ) : (
                  <ReactMarkdown className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-slate-200">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700 px-4">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}