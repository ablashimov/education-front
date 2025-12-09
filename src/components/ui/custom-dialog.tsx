import { useEffect, useRef } from "react";

export default function FullScreenDialog({ open, onClose, title, children }: any) {
    // ESC для закрытия
    useEffect(() => {
        if (!open) return;

        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open) return null;

    const stop = (e) => e.stopPropagation();

    return (
        <>
        <div
            onClick={onClose}
            className="dialog-overlay"
        />

            <div
                onClick={stop}
                style={{
                    position: "absolute",
                    top: "50%",
                    right: 0,
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    bottom: 0,
                    zIndex: 1000,
                    width: "calc(100vw - 300px)",
                    height: "calc(100vh - 300px)",
                }}
                className="
          bg-gray-50 rounded-xl shadow-xl border
          w-[80vw] h-[80vh]
          flex flex-col overflow-hidden
        "
            >
                <div className="p-4 border-b bg-white shrink-0 flex justify-between items-center">
                    <h2 className="text-lg font-medium">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded hover:bg-gray-100 transition"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </div>
            </>
    );
}
