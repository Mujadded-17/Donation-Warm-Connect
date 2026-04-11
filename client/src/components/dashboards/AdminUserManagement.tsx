import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../styles/chatPanel.css";
import "../../styles/adminDashboard.css";

type CurrentUser = {
  user_id?: number;
  name?: string;
  email?: string;
  user_type?: string;
} | null;

type ManagedUser = {
  user_id: number;
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  user_type?: string;
  profile_url?: string | null;
  is_banned?: boolean | number;
  ban_reason?: string | null;
  banned_at?: string | null;
};

type ChatMessage = {
  chat_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  create_time?: string;
};

type AdminUserManagementProps = {
  currentUser: CurrentUser;
  apiBase: string;
};

const DEFAULT_BAN_REASON = "You are banned for some illegal or inappropriate behaviours.";

export default function AdminUserManagement({ currentUser, apiBase }: AdminUserManagementProps): JSX.Element {
  const isAdmin = useMemo(() => {
    const role = String(currentUser?.user_type || "").toLowerCase();
    const email = String(currentUser?.email || "").toLowerCase();

    return role === "admin" || email === "silviaadmin@gmail.com";
  }, [currentUser?.email, currentUser?.user_type]);

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token") || "";

    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const selectedUser = useMemo(() => {
    return users.find((user) => user.user_id === selectedUserId) || null;
  }, [selectedUserId, users]);

  const loadUsers = async (query: string) => {
    if (!isAdmin || !currentUser?.user_id) {
      return;
    }

    try {
      setLoadingUsers(true);
      const response = await axios.get(`${apiBase}/admin/users/search`, {
        headers: authHeaders,
        params: { query },
      });

      const payload = response.data?.users;
      const list: ManagedUser[] = Array.isArray(payload) ? payload : [];
      setUsers(list);
      setError("");

      setSelectedUserId((previousId) => {
        if (previousId && list.some((user) => user.user_id === previousId)) {
          return previousId;
        }

        return list[0]?.user_id ?? null;
      });
    } catch (fetchError) {
      console.error("Failed to load managed users:", fetchError);
      setUsers([]);
      setSelectedUserId(null);
      setError("Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadMessages = async (otherUserId: number, silent = false) => {
    if (!currentUser?.user_id) {
      return;
    }

    try {
      if (!silent) {
        setLoadingMessages(true);
      }

      const response = await axios.get(`${apiBase}/chat/messages/${otherUserId}`, {
        headers: authHeaders,
      });

      const payload = response.data?.messages;
      setMessages(Array.isArray(payload) ? payload : []);
      setChatError("");
    } catch (fetchError) {
      console.error("Failed to load admin conversation:", fetchError);
      setMessages([]);
      setChatError("Failed to load messages.");
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    if (!isAdmin || !currentUser?.user_id) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadUsers(searchQuery.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery, isAdmin, currentUser?.user_id]);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }

    void loadMessages(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUserId || !currentUser?.user_id) {
      return;
    }

    const poll = window.setInterval(() => {
      void loadMessages(selectedUserId, true);
    }, 5000);

    return () => window.clearInterval(poll);
  }, [selectedUserId, currentUser?.user_id]);

  const updateUserInState = (updatedUser: ManagedUser) => {
    setUsers((previous) => previous.map((user) => (user.user_id === updatedUser.user_id ? updatedUser : user)));
  };

  const handleBanToggle = async (targetUser: ManagedUser) => {
    if (!isAdmin) {
      return;
    }

    try {
      setActionLoadingId(targetUser.user_id);

      const shouldBan = !targetUser.is_banned;
      const endpoint = shouldBan
        ? `${apiBase}/admin/users/${targetUser.user_id}/ban`
        : `${apiBase}/admin/users/${targetUser.user_id}/unban`;

      const response = await axios.put(
        endpoint,
        shouldBan ? { reason: DEFAULT_BAN_REASON } : {},
        {
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
        }
      );

      const payload = response.data?.user as ManagedUser | undefined;
      const mergedUser: ManagedUser = payload || {
        ...targetUser,
        is_banned: shouldBan,
        ban_reason: shouldBan ? DEFAULT_BAN_REASON : null,
        banned_at: shouldBan ? new Date().toISOString() : null,
      };

      updateUserInState(mergedUser);
      if (selectedUserId === targetUser.user_id) {
        setMessages((previous) => previous.slice());
      }
    } catch (banError) {
      console.error("Failed to update ban state:", banError);
      alert("Failed to update user status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUserId || !draft.trim()) {
      return;
    }

    try {
      setSending(true);
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
    } catch (sendError) {
      console.error("Failed to send admin message:", sendError);
      setChatError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return <div className="ad-empty">Admin access required.</div>;
  }

  return (
    <div className="cp-shell ad-user-shell">
      <aside className="cp-list ad-user-list">
        <div className="ad-user-search">
          <div className="cp-listHead">User Search</div>
          <input
            className="ad-user-searchInput"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search donors or receivers by name or email"
          />
          <div className="ad-user-searchHint">
            Only donors and receivers are shown here. Admins can chat and ban or unban users.
          </div>
        </div>

        {loadingUsers ? (
          <div className="cp-muted">Searching users...</div>
        ) : error ? (
          <div className="cp-error">{error}</div>
        ) : users.length === 0 ? (
          <div className="cp-muted">No users found.</div>
        ) : (
          users.map((user) => {
            const isSelected = selectedUserId === user.user_id;
            const isBanned = Boolean(user.is_banned);

            return (
              <div key={user.user_id} className={`ad-userRow ${isSelected ? "isActive" : ""}`}>
                <button
                  type="button"
                  className="ad-userRowMain"
                  onClick={() => setSelectedUserId(user.user_id)}
                >
                  <div className="ad-userRowTop">
                    <div>
                      <div className="cp-userName">{user.name || "Unnamed user"}</div>
                      <div className="cp-userLast">{user.email}</div>
                    </div>
                    <span className={`ad-userBadge ${isBanned ? "isBanned" : "isActive"}`}>
                      {isBanned ? "Banned" : String(user.user_type || "user").toUpperCase()}
                    </span>
                  </div>

                  <div className="ad-userRowMeta">
                    {user.phone ? <span>📞 {user.phone}</span> : <span>📞 No phone</span>}
                    {user.ban_reason ? <span>Ban reason recorded</span> : <span>Account active</span>}
                  </div>
                </button>

                <div className="ad-userRowActions">
                  <button
                    type="button"
                    className="ad-userActionBtn"
                    onClick={() => setSelectedUserId(user.user_id)}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    className={`ad-userActionBtn ${isBanned ? "isSecondary" : "isDanger"}`}
                    onClick={() => void handleBanToggle(user)}
                    disabled={actionLoadingId === user.user_id}
                  >
                    {actionLoadingId === user.user_id
                      ? "Working..."
                      : isBanned
                        ? "Unban"
                        : "Ban"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </aside>

      <section className="cp-chat ad-chatPanel">
        {selectedUser ? (
          <>
            <header className="cp-chatHead ad-chatHead">
              <div>
                <div className="cp-chatTitle">{selectedUser.name || selectedUser.email}</div>
                <div className="cp-chatSub">{selectedUser.email}</div>
              </div>

              <div className="ad-chatHeadActions">
                <span className={`ad-userBadge ${Boolean(selectedUser.is_banned) ? "isBanned" : "isActive"}`}>
                  {Boolean(selectedUser.is_banned) ? "Banned" : "Active"}
                </span>
                <button
                  type="button"
                  className="ad-userActionBtn"
                  onClick={() => void handleBanToggle(selectedUser)}
                  disabled={actionLoadingId === selectedUser.user_id}
                >
                  {Boolean(selectedUser.is_banned) ? "Unban" : "Ban"}
                </button>
              </div>
            </header>

            {Boolean(selectedUser.is_banned) && (
              <div className="ad-banNotice">
                <strong>User is banned.</strong>
                <span>{selectedUser.ban_reason || DEFAULT_BAN_REASON}</span>
              </div>
            )}

            <div className="cp-messages">
              {loadingMessages ? (
                <div className="cp-muted">Loading conversation...</div>
              ) : chatError ? (
                <div className="cp-error">{chatError}</div>
              ) : messages.length === 0 ? (
                <div className="cp-muted">No messages yet. Send the first note.</div>
              ) : (
                messages.map((message) => {
                  const own = message.sender_id === currentUser?.user_id;

                  return (
                    <div
                      key={message.chat_id}
                      className={`cp-bubble ${own ? "isOwn" : "isOther"}`}
                    >
                      <div>{message.message}</div>
                      <div className="cp-bubbleTime">{formatMessageTime(message.create_time || "")}</div>
                    </div>
                  );
                })
              )}
            </div>

            <form className="cp-composer" onSubmit={handleSendMessage}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Send a message to this user..."
                maxLength={1000}
              />
              <button type="submit" disabled={sending || !draft.trim()}>
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </>
        ) : (
          <div className="ad-chatEmpty">
            <div className="cp-empty">Search a user to start a private admin chat.</div>
          </div>
        )}
      </section>
    </div>
  );
}

function formatMessageTime(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
