import React, { useState, useEffect } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface SecureFileViewerProps {
    lessonId: number;
    fileId: number;
    fileType: 'pdf' | 'video';
    fileName: string;
}

export const SecureFileViewer: React.FC<SecureFileViewerProps> = ({
    lessonId,
    fileId,
    fileType,
    fileName,
}) => {
    const [docs, setDocs] = useState<{ uri: string; fileName: string; fileType?: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/lessons/${lessonId}/files/${fileId}`, {
                    responseType: 'blob',
                });

                const mimeType = fileType === 'pdf' ? 'application/pdf' : 'video/mp4';
                const blob = new Blob([response.data], { type: mimeType });
                const objectUrl = URL.createObjectURL(blob);

                setDocs([{
                    uri: objectUrl,
                    fileName: fileName,
                    fileType: mimeType
                }]);
            } catch (err) {
                console.error('Error fetching file:', err);
                setError('Failed to load file');
            } finally {
                setLoading(false);
            }
        };

        fetchFile();

        return () => {
            docs.forEach(doc => URL.revokeObjectURL(doc.uri));
        };
    }, [lessonId, fileId, fileType, fileName]); // Added docs to dependency array for cleanup

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 h-full">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-red-500 h-full">
                {error}
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-gray-100 overflow-hidden flex flex-col relative"
            onContextMenu={(e) => e.preventDefault()}
        >
            <DocViewer
                documents={docs}
                pluginRenderers={DocViewerRenderers}
                style={{ height: '100%', width: '100%' }}
                config={{
                    header: {
                        disableHeader: false,
                        disableFileName: false,
                        retainURLParams: false
                    },
                    pdfVerticalScrollByDefault: true,
                }}
            />
        </div>
    );
};
