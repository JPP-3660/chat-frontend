export const BASE_URL = "http://localhost:8000";
const API_URL = `${BASE_URL}/api/v1`;

export async function fetchAgents() {
    const res = await fetch(`${API_URL}/agents`);
    if (!res.ok) throw new Error("Failed to fetch agents");
    return res.json();
}

export async function createAgent(agentData: any) {
    const res = await fetch(`${API_URL}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentData),
    });
    if (!res.ok) throw new Error("Failed to create agent");
    return res.json();
};


export async function updateAgent(agentId: string, agentData: any) {
    const res = await fetch(`${API_URL}/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentData),
    });
    if (!res.ok) throw new Error("Failed to update agent");
    return res.json();
}

export async function fetchSessions(agentId: string) {
    const res = await fetch(`${API_URL}/chat/sessions/${agentId}`);
    if (!res.ok) throw new Error("Failed to fetch sessions");
    return res.json();
}

export async function fetchMessages(sessionId: string, skip: number = 0, limit: number = 20) {
    const res = await fetch(`${API_URL}/chat/messages/${sessionId}?skip=${skip}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
}

export async function chatMessage(agentId: string, message: string, history: any[], sessionId?: string, signal?: AbortSignal) {
    // This returns a stream, handling in component
    const res = await fetch(`${API_URL}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, message, history, session_id: sessionId }),
        signal
    });
    return res;
}

export async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/files/upload`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload file");
    return res.json();
}
