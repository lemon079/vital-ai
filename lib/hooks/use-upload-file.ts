import { useState } from 'react';
import { toast } from 'sonner';

interface UploadResult {
    success: boolean;
    filePath?: string;
    fileUrl?: string;
    originalName?: string;
}

export function useUploadFile() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const uploadFile = async (file: File): Promise<UploadResult | null> => {
        setIsUploading(true);
        setUploadError(null);

        try {
            // Convert to Base64
            const reader = new FileReader();

            const fileDataPromise = new Promise<{ type: string; content: string }>((resolve, reject) => {
                reader.onload = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    // Determine type based on MIME or extension
                    const type = file.type === 'application/pdf' ? 'pdf' : 'image';
                    // (Simplification based on existing logic supporting pdf/png)
                    resolve({ type, content: base64String });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const fileData = await fileDataPromise;

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileData,
                    fileName: file.name
                })
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error("Upload Hook Error:", error);
            setUploadError("Failed to upload file.");
            toast.error("File upload failed. Please try again.");
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading, uploadError };
}
