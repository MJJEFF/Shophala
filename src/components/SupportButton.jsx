import { MessageCircle } from "lucide-react";

export default function SupportButton() {
    return (
        <a
            href="https://wa.me/2349021780920?text=Hi%20Shophala%20Support%2C%20I%20need%20help%20with%20my%20store."
            target="_blank"
            rel = "noopener noreferrer"
            className = "fixed bottom-6 right-6 z-40 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-400 hover:scale-110 transition flex items-center justify-center"
            title = "Chat with Shophala Support"
        >
        <MessageCircle size={24} />
    </a >
  );
}