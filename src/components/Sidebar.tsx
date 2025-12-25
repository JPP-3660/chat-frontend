import { Link, useLocation } from "react-router-dom";
import { MessageSquare, Users, Settings, Home, PlusCircle } from "lucide-react";
import clsx from "clsx";

const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: MessageSquare, label: "Chat", path: "/chat" },
    { icon: Users, label: "My Agents", path: "/agents" },
    { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
    const location = useLocation();

    return (
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 text-gray-300">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">AI</span>
                    Nexus
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-indigo-600/10 text-white"
                                    : "hover:bg-gray-800 hover:text-white"
                            )}
                        >
                            <item.icon className={clsx("w-5 h-5", isActive ? "text-indigo-400" : "text-gray-400 group-hover:text-white")} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2.5 rounded-lg transition-all font-medium shadow-lg shadow-indigo-500/20">
                    <PlusCircle className="w-5 h-5" />
                    <span>New Chat</span>
                </button>
            </div>
        </aside>
    );
}
