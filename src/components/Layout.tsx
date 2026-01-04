import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
    return (
        <div className="min-h-screen bg-black text-gray-100 flex">
            <Sidebar />
            <main className="ml-64 flex-1 h-screen overflow-y-auto bg-gray-950">
                <div className="w-full p-8 h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
