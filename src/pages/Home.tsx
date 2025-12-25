export function Home() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Welcome back, User</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
                    <h3 className="text-gray-400 text-sm font-medium">Total Agents</h3>
                    <p className="text-3xl font-bold mt-2">3</p>
                </div>
                <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
                    <h3 className="text-gray-400 text-sm font-medium">Conversations</h3>
                    <p className="text-3xl font-bold mt-2">12</p>
                </div>
            </div>
        </div>
    );
}
