import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import { Send, Bot, User, Copy, Check, Paperclip, FileText, X as CloseIcon, Square, ChevronDown } from "lucide-react";
import { chatMessage, fetchSessions, fetchMessages, uploadFile } from "../lib/api";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
    role: "user" | "assistant";
    content: string;
    sources?: any[];
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

const SourcesList = ({ sources }: { sources: any[] }) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sources</div>
            <div className="flex flex-wrap gap-2">
                {sources.map((source, idx) => (
                    <a
                        key={idx}
                        href={source.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 transition-colors max-w-[200px]"
                    >
                        <span className="truncate flex-1 font-medium">{source.title}</span>
                        <span className="text-[10px] text-gray-500 shrink-0">↗</span>
                    </a>
                ))}
            </div>
        </div>
    );
};

const MessageItem = React.memo(({ msg }: { msg: Message }) => {
    return (
        <div className={clsx("flex gap-4", msg.role === "user" ? "justify-end" : "justify-start")}>
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
                            rehypePlugins={[rehypeRaw]}
                            urlTransform={(uri) => uri} // Allow all URIs including data:
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
                                a({ node, href, children, ...props }: any) {
                                    const isRelativeUpload = href?.startsWith("/uploads/");
                                    const isDataUri = href?.startsWith("data:");
                                    const fullHref = isRelativeUpload ? `http://localhost:8000${href}` : href;

                                    // Special styling for downloads (PDFs, CSVs, Data URIs)
                                    const isDownload = isRelativeUpload || isDataUri || props.download;

                                    return (
                                        <a
                                            href={fullHref}
                                            target={isDataUri ? undefined : "_blank"}
                                            rel="noopener noreferrer"
                                            {...props}
                                            className={clsx(
                                                "text-blue-400 hover:underline inline-flex items-center gap-1",
                                                isDownload && "bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-medium my-1"
                                            )}
                                        >
                                            {children}
                                            {isDownload && <FileText size={12} className="text-blue-400" />}
                                        </a>
                                    );
                                }
                            }}
                        >
                            {msg.content}
                        </ReactMarkdown>
                        <SourcesList sources={msg.sources || []} />
                    </div>
                )}
            </div>
        </div>
    );
});

export function Chat() {
    const { agentId } = useParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [attachedFile, setAttachedFile] = useState<{ name: string; path: string } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isOldLoading, setIsOldLoading] = useState(false);
    const [isPrepending, setIsPrepending] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const shouldScrollToBottomRef = useRef(true);
    const prevScrollHeightRef = useRef(0);


    const scrollToBottom = () => {
        if (shouldScrollToBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(scrollToBottom, [messages.length]);

    useLayoutEffect(() => {
        if (isPrepending && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight - prevScrollHeightRef.current;
            setIsPrepending(false);
        }
    }, [messages, isPrepending]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 300;
        setShowScrollBottom(!isNearBottom);
    };


    useEffect(() => {
        if (agentId) {
            setMessages([]);
            setSessionId(null);
            setHasMore(true);
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
                const history = await fetchMessages(latestSession.id, 0, 20);
                const formattedHistory = history.map((m: any) => ({
                    role: m.role,
                    content: m.content,
                    sources: m.metadata?.sources || []
                })).reverse(); // Reverse because backend returns DESC
                setMessages(formattedHistory);
                setHasMore(history.length === 20);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    const loadMoreMessages = async () => {
        if (!sessionId || isOldLoading || !hasMore) return;

        setIsOldLoading(true);
        shouldScrollToBottomRef.current = false;
        try {
            // Calculate skip based on currently loaded messages
            const skip = messages.length;
            const history = await fetchMessages(sessionId, skip, 20);

            if (history.length === 0) {
                setHasMore(false);
                return;
            }

            const formattedHistory = history.map((m: any) => ({
                role: m.role,
                content: m.content,
                sources: m.metadata?.sources || []
            })).reverse();

            // Save current scroll height to maintain position
            prevScrollHeightRef.current = containerRef.current?.scrollHeight || 0;
            setIsPrepending(true);

            setMessages(prev => [...formattedHistory, ...prev]);
            setHasMore(history.length === 20);

        } catch (e) {
            console.error("Failed to load more messages", e);
        } finally {
            setIsOldLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith(".pdf")) {
            alert("Only PDF files are allowed");
            return;
        }

        setIsUploading(true);
        try {
            const data = await uploadFile(file);
            setAttachedFile({ name: data.filename, path: data.path });
        } catch (error) {
            console.error(error);
            alert("Failed to upload file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
            setStatus(null);
        }
    };

    const handleSend = async () => {
        if (!input.trim() && !attachedFile) return;
        if (!agentId) return;

        let finalMessage = input;
        if (attachedFile) {
            finalMessage += `\n\n[Attached File: ${attachedFile.name}]\nPath: ${attachedFile.path}`;
        }

        const userMsg = { role: "user" as const, content: finalMessage };
        setMessages(prev => [...prev, userMsg]);
        shouldScrollToBottomRef.current = true;
        setInput("");
        setAttachedFile(null);
        setIsLoading(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await chatMessage(
                agentId,
                userMsg.content,
                messages,
                sessionId || undefined,
                controller.signal
            );

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

                    // Check for status markers
                    if (chunk.includes("[STATUS:")) {
                        const match = /\[STATUS: (.*?)\]/.exec(chunk);
                        if (match) {
                            const toolName = match[1];
                            setStatus(toolName === "web_search" ? "Searching the web..." :
                                toolName === "code_executor" ? "Executing code..." :
                                    `Using ${toolName}...`);
                            continue; // Don't add marker to message content
                        }
                    }

                    // Check for sources markers
                    if (chunk.includes("[SOURCES:")) {
                        const match = /\[SOURCES: (.*?)\]/.exec(chunk);
                        if (match) {
                            try {
                                const sources = JSON.parse(match[1]);
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    newMsgs[newMsgs.length - 1] = {
                                        ...newMsgs[newMsgs.length - 1],
                                        sources: sources
                                    };
                                    return newMsgs;
                                });
                            } catch (e) {
                                console.error("Failed to parse sources", e);
                            }
                            continue;
                        }
                    }

                    // Clear status if we get actual content
                    if (chunk.trim() && !chunk.startsWith(" ")) {
                        setStatus(null);
                    }

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
            abortControllerRef.current = null;
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

            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto space-y-6 pr-4 mb-4 relative"
            >
                {hasMore && messages.length >= 20 && (
                    <div className="flex justify-center pt-2">
                        <button
                            onClick={loadMoreMessages}
                            disabled={isOldLoading}
                            className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 transition-all disabled:opacity-50"
                        >
                            {isOldLoading ? "Loading..." : "Load older messages"}
                        </button>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <MessageItem key={idx} msg={msg} />
                ))}
                {isLoading && (
                    <div className="flex gap-4 justify-start items-center">
                        <div className="bg-gray-800 rounded-2xl p-4 rounded-bl-none animate-pulse text-indigo-400">
                            {status || "Thinking..."}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />

                {showScrollBottom && (
                    <button
                        onClick={() => {
                            shouldScrollToBottomRef.current = true;
                            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                            setShowScrollBottom(false);
                        }}
                        className="fixed bottom-24 right-12 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full shadow-lg transition-all animate-bounce flex items-center justify-center z-50 border border-indigo-400/30"
                        title="Scroll to bottom"
                    >
                        <ChevronDown size={20} />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {attachedFile && (
                    <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg w-fit border border-indigo-500/30">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs text-gray-300">{attachedFile.name}</span>
                        <button onClick={() => setAttachedFile(null)} className="text-gray-500 hover:text-white">
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    </div>
                )}
                <div className="flex gap-4 items-center bg-gray-900 border border-gray-800 p-2 rounded-xl">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isLoading}
                        className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <Paperclip className={clsx("w-5 h-5", isUploading && "animate-spin")} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        placeholder={isUploading ? "Uploading..." : "Type your message..."}
                        className="flex-1 bg-transparent border-none text-white placeholder-gray-500 px-4 outline-none focus:ring-0"
                    />
                    {isLoading ? (
                        <button
                            onClick={handleStop}
                            className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-lg transition-all"
                            title="Stop generation"
                        >
                            <Square className="w-5 h-5" fill="currentColor" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={isLoading || isUploading || (!input.trim() && !attachedFile)}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-3 rounded-lg transition-all"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
