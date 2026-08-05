import { saveUploadedFile } from '@/lib/services/processing';
import { createReport } from '@/lib/services/reports';
import { enqueueReportProcessing } from '@/lib/services/job-queue';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { fileData, fileName } = await req.json();

        if (!fileData) {
            return NextResponse.json({ error: "No file data provided." }, { status: 400 });
        }

        // Get userId from cookie
        const cookieStore = await cookies();
        const userIdCookie = cookieStore.get('userId');
        const userId = userIdCookie?.value;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
        }

        // Save file to disk
        const savedFile = await saveUploadedFile(fileData, fileName);

        // Create Report record in DB with status = "uploaded"
        const report = await createReport({
            userId,
            fileUri: savedFile.filePath,
            sourceLabName: undefined,
        });

        // Enqueue background processing job
        const job = await enqueueReportProcessing(report.id);

        return NextResponse.json({
            success: true,
            reportId: report.id,
            jobId: job.jobId,
            filePath: savedFile.filePath,
            fileUrl: savedFile.fileUrl,
            originalName: fileName,
            status: report.status,
        });

    } catch (error) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
    }
}
