import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Send, Bot, User, Copy, Check } from "lucide-react";
import { chatMessage, fetchSessions, fetchMessages } from "../lib/api";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const CopyButton = ({ text, className }: { text: string; className?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={clsx(
                "p-1 rounded hover:bg-white/10 transition-colors",
                className
            )}
            title="Copy to clipboard"
        >
            {copied ? (
                <Check size={14} className="text-green-500" />
            ) : (
                <Copy size={14} className="opacity-50 hover:opacity-100" />
            )}
        </button>
    );
};

export function Chat() {
    const { agentId } = useParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages.length]);

    useEffect(() => {
        if (agentId) {
            setMessages([]);
            setSessionId(null);
            loadHistory();
        }
    }, [agentId]);

    const loadHistory = async () => {
        if (!agentId) return;
        try {
            const sessions = await fetchSessions(agentId);
            if (sessions.length > 0) {
                const latestSession = sessions[0];
                setSessionId(latestSession.id);
                const history = await fetchMessages(latestSession.id);
                setMessages(history.map((m: any) => ({ role: m.role, content: m.content })));
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !agentId) return;

        const userMsg = { role: "user" as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await chatMessage(agentId, userMsg.content, messages, sessionId || undefined);

            const newSessionId = response.headers.get("X-Session-ID");
            if (newSessionId && newSessionId !== sessionId) {
                setSessionId(newSessionId);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            let assistantMsg = { role: "assistant" as const, content: "" };
            setMessages(prev => [...prev, assistantMsg]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    assistantMsg.content += chunk;

                    setMessages(prev => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1] = { ...assistantMsg };
                        return newMsgs;
                    });
                }
            }
        } catch (e) {
            console.error("Chat error", e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!agentId) {
        return <div className="flex h-full items-center justify-center text-gray-500">Select an agent to start chatting</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Bot className="w-6 h-6 text-indigo-500" />
                    Chat with Agent
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-4 mb-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={clsx("flex gap-4", msg.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={clsx(
                            "max-w-[80%] rounded-2xl p-4",
                            msg.role === "user"
                                ? "bg-indigo-600 text-white rounded-br-none"
                                : "bg-gray-800 text-gray-200 rounded-bl-none"
                        )}>
                            <div className="text-sm font-medium mb-1 flex items-center justify-between">
                                <div className="opacity-50 flex items-center gap-2">
                                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                                    {msg.role === "user" ? "You" : "Agent"}
                                </div>
                                <CopyButton text={msg.content} />
                            </div>

                            {msg.role === "user" ? (
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            ) : (
                                <div className="markdown-body text-sm">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || "");
                                                return !inline && match ? (
                                                    <div className="relative group">
                                                        <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <CopyButton
                                                                text={String(children).replace(/\n$/, "")}
                                                                className="bg-gray-800/80 backdrop-blur-sm"
                                                            />
                                                        </div>
                                                        <SyntaxHighlighter
                                                            style={vscDarkPlus}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            {...props}
                                                        >
                                                            {String(children).replace(/\n$/, "")}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                ) : (
                                                    <code className={clsx("bg-gray-700 px-1 py-0.5 rounded font-mono text-xs", className)} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            table({ children }) {
                                                return <table className="border-collapse border border-gray-600 my-2 w-full">{children}</table>;
                                            },
                                            th({ children }) {
                                                return <th className="border border-gray-600 px-2 py-1 bg-gray-700 font-bold">{children}</th>;
                                            },
                                            td({ children }) {
                                                return <td className="border border-gray-600 px-2 py-1">{children}</td>;
                                            },
                                            a({ href, children }) {
                                                return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>;
                                            }
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && messages.length % 2 !== 0 && (
                    <div className="flex gap-4 justify-start">
                        <div className="bg-gray-800 rounded-2xl p-4 rounded-bl-none animate-pulse">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-4 items-center bg-gray-900 border border-gray-800 p-2 rounded-xl">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent border-none text-white placeholder-gray-500 px-4 outline-none focus:ring-0"
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-3 rounded-lg transition-all"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
