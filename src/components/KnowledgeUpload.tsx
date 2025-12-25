import { useState } from "react";
import { X, UploadCloud, Check } from "lucide-react";

const API_URL = "http://localhost:8000/api/v1";

interface KnowledgeUploadProps {
    agentId: string;
    onClose: () => void;
}

export function KnowledgeUpload({ agentId, onClose }: KnowledgeUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);
        setSuccess(false);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_URL}/agents/${agentId}/knowledge/upload`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            setSuccess(true);
            setTimeout(onClose, 1500); // Close after success
        } catch (err) {
            console.error(err);
            alert("Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-4">Upload Knowledge</h2>
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-indigo-500 transition-colors bg-gray-800/50">
                    {success ? (
                        <div className="text-green-400 flex flex-col items-center animate-in fade-in zoom-in">
                            <div className="w-12 h-12 bg-green-400/20 rounded-full flex items-center justify-center mb-2">
                                <Check className="w-6 h-6" />
                            </div>
                            <span className="font-medium">Uploaded Successfully!</span>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-white">Click to upload</p>
                                <p className="text-sm text-gray-500">PDF, TXT support</p>
                            </div>
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                        </>
                    )}
                    {uploading && <div className="text-sm text-indigo-400 animate-pulse">Uploading...</div>}
                </div>
            </div>
        </div>
    );
}
