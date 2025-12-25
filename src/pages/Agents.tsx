import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAgents } from "../lib/api";
import { MessageSquare, Plus, Upload, Settings } from "lucide-react";
import { AgentForm } from "../components/AgentForm";
import { KnowledgeUpload } from "../components/KnowledgeUpload";

export function Agents() {
    const [agents, setAgents] = useState<any[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<any>(null);
    const [uploadAgentId, setUploadAgentId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAgents = () => {
        setLoading(true);
        fetchAgents()
            .then(data => {
                setAgents(data);
                setError(null);
            })
            .catch(err => {
                console.error(err);
                setError("Failed to load agents. Ensure backend is running.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadAgents();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">My Agents</h1>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Agent
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                    <div key={agent.id} className="p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-500/50 transition-all group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-xl">
                                {agent.name.charAt(0)}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => setUploadAgentId(agent.id)}
                                    className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-lg"
                                    title="Upload Knowledge"
                                >
                                    <Upload className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setEditingAgent(agent)}
                                    className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-lg"
                                    title="Edit Agent"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                                <Link to={`/chat/${agent.id}`} className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-lg">
                                    <MessageSquare className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{agent.name}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{agent.description || "No description provided."}</p>
                        <div className="mt-4 flex gap-2">
                            <span className="px-2 py-1 rounded-md bg-gray-800 text-xs text-gray-400 font-mono">
                                {agent.model_config_data?.model || "gpt-oss:120b-cloud"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {loading && (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="p-6 bg-red-900/50 border border-red-800 rounded-xl text-red-200 text-center">
                    {error}
                </div>
            )}

            {!loading && !error && agents.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-xl text-gray-500">
                    No agents found. Create one to get started.
                </div>
            )}

            {(isCreateOpen || editingAgent) && (
                <AgentForm
                    onClose={() => {
                        setIsCreateOpen(false);
                        setEditingAgent(null);
                    }}
                    onSuccess={() => { loadAgents(); }}
                    initialData={editingAgent}
                />
            )}

            {uploadAgentId && (
                <KnowledgeUpload
                    agentId={uploadAgentId}
                    onClose={() => setUploadAgentId(null)}
                />
            )}
        </div>
    );
}
