import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { createAgent, updateAgent } from "../lib/api";

interface AgentFormProps {
    onClose: () => void;
    onSuccess: (agent: any) => void;
    initialData?: any;
}

const AVAILABLE_TOOLS = [
    { id: "web_search", label: "Web Search (DuckDuckGo)" },
    { id: "calculator", label: "Calculator" },
    { id: "code_executor", label: "Code Executor (Python)" }
];

export function AgentForm({ onClose, onSuccess, initialData }: AgentFormProps) {
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [description, setDescription] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [model, setModel] = useState("gpt-oss:120b-cloud");
    const [tools, setTools] = useState<string[]>(["web_search", "calculator"]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setRole(initialData.role || "");
            setDescription(initialData.description || "");
            setSystemPrompt(initialData.system_prompt || "");
            if (initialData.model_config_data?.model) {
                setModel(initialData.model_config_data.model);
            }
            if (initialData.tools_config) {
                setTools(initialData.tools_config);
            }
        }
    }, [initialData]);

    const toggleTool = (toolId: string) => {
        setTools(prev =>
            prev.includes(toolId)
                ? prev.filter(t => t !== toolId)
                : [...prev, toolId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name,
                role,
                description,
                system_prompt: systemPrompt,
                model_config_data: { model },
                tools_config: tools,
                is_public: false
            };

            if (initialData) {
                await updateAgent(initialData.id, payload);
            } else {
                await createAgent(payload);
            }

            onSuccess(payload);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to save agent");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold">{initialData ? "Edit Agent" : "Create New Agent"}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Coding Tutor"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Model</label>
                        <input
                            type="text"
                            value={model}
                            onChange={e => setModel(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                            placeholder="e.g. gpt-4, llama3, gpt-oss:120b-cloud"
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter OpenAI model name or Ollama model tag.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Tools</label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TOOLS.map(tool => (
                                <button
                                    key={tool.id}
                                    type="button"
                                    onClick={() => toggleTool(tool.id)}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all border
                                        ${tools.includes(tool.id)
                                            ? "bg-indigo-600 border-indigo-500 text-white"
                                            : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"}
                                    `}
                                >
                                    {tools.includes(tool.id) && <Check size={14} />}
                                    {tool.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                        <input
                            type="text"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Python Expert"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                            placeholder="Short description..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">System Prompt</label>
                        <textarea
                            required
                            value={systemPrompt}
                            onChange={e => setSystemPrompt(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32 font-mono text-sm"
                            placeholder="You are a helpful assistant..."
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                        >
                            {loading ? "Saving..." : (initialData ? "Save Changes" : "Create Agent")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
