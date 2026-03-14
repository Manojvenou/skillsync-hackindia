import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function RoomChat({ roomId, user }) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["roomMessages", roomId],
    queryFn: () => base44.entities.RoomMessage.filter({ room_id: roomId }, "created_date", 100),
    enabled: !!roomId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    await base44.entities.RoomMessage.create({
      room_id: roomId,
      sender_email: user.email,
      sender_name: user.full_name || "Anonymous",
      message: message.trim(),
    });
    setMessage("");
    queryClient.invalidateQueries({ queryKey: ["roomMessages", roomId] });
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center gap-2 p-4 border-b border-slate-200">
        <MessageCircle className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-slate-900">Group Chat</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_email === user?.email;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {!isMe && (
                    <span className="text-xs text-slate-500 mb-1 px-1">{msg.sender_name}</span>
                  )}
                  <div className={`rounded-2xl px-4 py-2 ${isMe ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  <span className="text-xs text-slate-400 mt-1 px-1">
                    {msg.created_date ? format(new Date(msg.created_date), "h:mm a") : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" disabled={!message.trim()} className="bg-indigo-600 hover:bg-indigo-700">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}