import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export type FileData = {
    type: string;
    content: string; // base64
};

export type SavedFile = {
    filePath: string;
    description: string;
    fileUrl?: string;
}

export async function saveUploadedFile(fileData: FileData, originalName?: string): Promise<SavedFile> {
    try {
        const buffer = Buffer.from(fileData.content, 'base64');

        let fileName = '';
        if (originalName) {
            // Sanitize filename: remove non-alphanumeric chars (except . - _) and spaces
            const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
            const timestamp = Date.now();
            fileName = `${timestamp}-${sanitized}`;
        } else {
            fileName = `${crypto.randomUUID()}.${fileData.type === 'pdf' ? 'pdf' : 'png'}`;
        }

        // Save to public/uploads
        const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(publicUploadsDir, { recursive: true });

        const filePath = path.join(publicUploadsDir, fileName);
        await fs.writeFile(filePath, buffer);

        const publicUrl = `/uploads/${fileName}`;
        let extractedText = '';

        if (fileData.type === 'pdf') {
            return {
                filePath,
                description: `[SYSTEM: User uploaded a PDF: ${fileName}. View it in the split panel.]`,
                fileUrl: publicUrl
            };

        } else if (fileData.type === 'image') {
            return {
                filePath,
                description: `[SYSTEM: An image file has been uploaded to ${filePath}. (Image analysis not yet supported via tool, but file is saved.)]`,
                fileUrl: publicUrl
            };
        }

        return { filePath, description: '', fileUrl: publicUrl };

    } catch (error) {
        console.error('File saving error:', error);
        throw new Error('Failed to save uploaded file.');
    }
}
