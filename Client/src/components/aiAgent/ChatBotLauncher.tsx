import UserLogo from "@/assets/icons/chatbotIcon.png";
import { useState } from "react";
import ChatWindow from "./ChatWindow";

export default function ChatbotLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-12 h-12  shadow-xl rounded-full flex items-center justify-center"
      >
        <img src={UserLogo} alt="Chatbot" className="w-12 h-12" />
      </button>

      {open && <ChatWindow onClose={() => setOpen(false)} />}
    </div>
  );
}
