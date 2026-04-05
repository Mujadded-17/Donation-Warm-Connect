import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../styles/chatPanel.css";

type CurrentUser = {
  user_id?: number;
};

type Conversation = {
  user_id: number;
  name?: string;
  email?: string;
  profile_url?: string | null;
  user_type?: string;
  last_message?: string;
  last_message_time?: string;
  last_sender_id?: number;
};

type ChatMessage = {
  chat_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  create_time?: string;
};

type ChatPanelProps = {
  currentUser: CurrentUser | null;
  apiBase: string;
};

export default function ChatPanel({
  currentUser,
  apiBase,
}: ChatPanelProps): JSX.Element {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");

  const currentUserId = currentUser?.user_id;

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token") || "";
    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const selectedConversation = useMemo(() => {
    if (!selectedUserId) return null;
    return conversations.find((conversation) => conversation.user_id === selectedUserId) || null;
  }, [conversations, selectedUserId]);

  const loadConversations = async () => {
    if (!currentUserId) return;

    try {
      setIsLoadingConversations(true);
      const response = await axios.get(`${apiBase}/chat/conversations`, {
        headers: authHeaders,
      });

      const payload = response.data?.conversations;
      const list: Conversation[] = Array.isArray(payload) ? payload : [];
      setConversations(list);

      if (list.length === 0) {
        setSelectedUserId(null);
        setMessages([]);
        return;
      }

      setSelectedUserId((prev) => {
        if (prev && list.some((conversation) => conversation.user_id === prev)) {
          return prev;
        }
        return list[0].user_id;
      });
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setChatError("Failed to load conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (otherUserId: number, silent = false) => {
    if (!currentUserId) return;

    try {
      if (!silent) {
        setIsLoadingMessages(true);
      }
      const response = await axios.get(`${apiBase}/chat/messages/${otherUserId}`, {
        headers: authHeaders,
      });

      const payload = response.data?.messages;
      setMessages(Array.isArray(payload) ? payload : []);
      setChatError("");
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
      setChatError("Failed to load messages.");
    } finally {
      if (!silent) {
        setIsLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedUserId) return;
    loadMessages(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const conversationPoll = setInterval(() => {
      loadConversations();
    }, 10000);

    return () => clearInterval(conversationPoll);
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedUserId) return;

    const messagePoll = setInterval(() => {
      loadMessages(selectedUserId, true);
    }, 4000);

    return () => clearInterval(messagePoll);
  }, [selectedUserId]);

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUserId || !draft.trim()) {
      return;
    }

    try {
      setIsSending(true);
      await axios.post(
        `${apiBase}/chat/messages`,
        {
          receiver_id: selectedUserId,
          message: draft.trim(),
        },
        {
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
        }
      );

      setDraft("");
      await loadMessages(selectedUserId);
      await loadConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
      setChatError("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  if (!currentUserId) {
    return (
      <div className="cp-shell">
        <div className="cp-empty">Please login to use chat.</div>
      </div>
    );
  }

  return (
    <div className="cp-shell">
      <aside className="cp-list">
        <div className="cp-listHead">Messages</div>

        {isLoadingConversations ? (
          <div className="cp-muted">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="cp-muted">No chats yet. Chat starts after donor-receiver request flow.</div>
        ) : (
          conversations.map((conversation) => {
            const isActive = selectedUserId === conversation.user_id;

            return (
              <button
                type="button"
                key={conversation.user_id}
                className={`cp-userBtn ${isActive ? "isActive" : ""}`}
                onClick={() => setSelectedUserId(conversation.user_id)}
              >
                <div className="cp-userName">{conversation.name || conversation.email || "User"}</div>
                <div className="cp-userLast">{conversation.last_message || "No message"}</div>
                <div className="cp-userTime">{formatRelativeTime(conversation.last_message_time || "")}</div>
              </button>
            );
          })
        )}
      </aside>

      <section className="cp-chat">
        {selectedConversation ? (
          <>
            <header className="cp-chatHead">
              <div className="cp-chatTitle">{selectedConversation.name || selectedConversation.email || "Conversation"}</div>
              <div className="cp-chatSub">{selectedConversation.email || ""}</div>
            </header>

            <div className="cp-messages">
              {isLoadingMessages ? (
                <div className="cp-muted">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="cp-muted">Start a conversation.</div>
              ) : (
                messages.map((message) => {
                  const own = message.sender_id === currentUserId;
                  return (
                    <div
                      key={message.chat_id}
                      className={`cp-bubble ${own ? "isOwn" : "isOther"}`}
                    >
                      <div>{message.message}</div>
                      <div className="cp-bubbleTime">{formatRelativeTime(message.create_time || "")}</div>
                    </div>
                  );
                })
              )}
            </div>

            <form className="cp-composer" onSubmit={handleSendMessage}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                maxLength={1000}
              />
              <button type="submit" disabled={isSending || !draft.trim()}>
                {isSending ? "Sending..." : "Send"}
              </button>
            </form>
          </>
        ) : (
          <div className="cp-empty">Select a conversation to start chatting.</div>
        )}

        {chatError && <div className="cp-error">{chatError}</div>}
      </section>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString();
}
