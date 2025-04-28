import { useContext, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { chatWithGemini } from "@/lib/chatWithGemini";
import { X } from "lucide-react";

interface ChatWindowProps {
  onClose: () => void;
}

interface ChatMessage {
  text: string;
  sender: "user" | "bot";
}

export default function ChatWindow({ onClose }: ChatWindowProps) {
  const auth = useAuth();
  const { organization } = useContext(OrganizationsContext);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    const orgId = organization?.id ? Number(organization?.id) : 0;
    
    setMessages((prev) => [...prev, { text: userMsg, sender: "user" }]);
    setInput("");
  
    const response = await chatWithGemini(userMsg, orgId);
    setMessages((prev) => [...prev, { text: response, sender: "bot" }]);
  };
  

  return (
    <div className="fixed bottom-20 left-4 w-80 bg-white rounded-2xl shadow-xl z-50 border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted">
        <div className="font-semibold">צ׳אט חדש</div>
        <button onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="p-4 flex-1 overflow-y-auto text-sm space-y-2 text-right">
        <div className="bg-muted p-2 rounded-xl w-fit self-start">
          היי {auth.user?.name || "משתמש"}! איך אני יכול לעזור?
        </div>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-xl w-fit whitespace-pre-line ${
              msg.sender === "user"
                ? "self-end ml-auto text-white"
                : "self-start bg-muted"
            }`}
            style={msg.sender === "user" ? { backgroundColor: "var(--accent)" } : {}}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-2 border-t flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="שאל הכל..."
          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none"
        />
      </div>
    </div>
  );
}