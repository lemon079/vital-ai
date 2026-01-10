import { NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/chat/file-processor';

export async function POST(req: Request) {
    try {
        const { fileData, fileName } = await req.json();

        if (!fileData) {
            return NextResponse.json({ error: "No file data provided." }, { status: 400 });
        }

        const savedFile = await saveUploadedFile(fileData, fileName);

        return NextResponse.json({
            success: true,
            filePath: savedFile.filePath,
            fileUrl: savedFile.fileUrl,
            originalName: fileName
        });

    } catch (error) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
    }
}
