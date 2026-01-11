
import { prisma } from '@/lib/db/client';
import { lab_flag, message_role } from '@/lib/generated/prisma/client';

// --- Profiles ---

export async function createProfile(userId: string, name?: string, age?: number, gender?: string) {
    const profile = await prisma.profiles.create({
        data: {
            user_id: userId,
            name,
            age,
            gender
        },
        select: { id: true }
    });
    return profile.id;
}

// --- Reports ---

export async function createReport(userId: string, patientGender?: string, patientAge?: number) {
    const report = await prisma.reports.create({
        data: {
            user_id: userId,
            patient_gender: patientGender,
            patient_age: patientAge,
            analyzed_at: new Date()
        },
        select: { id: true }
    });
    return report.id;
}

// --- Lab Results ---

import { LabResultData } from '@/types/labs';

export async function saveLabResults(reportId: string, results: LabResultData[]) {
    if (results.length === 0) return;

    // Map string flag to enum
    const mapFlag = (f: string): lab_flag => {
        const validFlags: lab_flag[] = ['NORMAL', 'LOW', 'HIGH', 'CRITICAL', 'CRITICAL_HIGH', 'CRITICAL_LOW', 'UNDETERMINED'];
        return validFlags.includes(f as lab_flag) ? (f as lab_flag) : 'UNDETERMINED';
    };

    const data = results.map(res => ({
        report_id: reportId,
        test_name: res.test_name,
        value: res.value,
        unit: res.unit,
        flag: mapFlag(res.flag),
        specimen: res.specimen,
        reference_low: res.reference_low,
        reference_high: res.reference_high,
        reference_unit: res.reference_unit,
        gender: (res.gender === 'male' || res.gender === 'female' || res.gender === 'any') ? res.gender : null
    }));

    await prisma.lab_results.createMany({
        data
    });
}

// Kept for signature compatibility but uses same logic
export async function saveLabResultsAsync(results: LabResultData[]) {
    // This function was originally writing without a report_id.
    // In Prisma schema, report_id is nullable (String?), so we can create these as standalone if needed.
    if (results.length === 0) return;

    const mapFlag = (f: string): lab_flag => {
        const validFlags: lab_flag[] = ['NORMAL', 'LOW', 'HIGH', 'CRITICAL', 'CRITICAL_HIGH', 'CRITICAL_LOW', 'UNDETERMINED'];
        return validFlags.includes(f as lab_flag) ? (f as lab_flag) : 'UNDETERMINED';
    };

    const data = results.map(res => ({
        test_name: res.test_name,
        value: res.value,
        unit: res.unit,
        flag: mapFlag(res.flag),
        specimen: res.specimen,
        reference_low: res.reference_low,
        reference_high: res.reference_high,
        reference_unit: res.reference_unit,
        gender: (res.gender === 'male' || res.gender === 'female' || res.gender === 'any') ? res.gender : null
    }));

    await prisma.lab_results.createMany({
        data
    });
}

// --- Chats & Messages ---

export async function getOrCreateChat(chatId: string | null, userId: string, reportId?: string): Promise<string> {
    if (chatId) {
        return chatId;
    }

    // Create new chat
    const chat = await prisma.chats.create({
        data: {
            user_id: userId,
            report_id: reportId || null,
        },
        select: { id: true }
    });
    return chat.id;
}

export async function saveMessage(chatId: string, role: 'user' | 'assistant', content: string) {
    await prisma.messages.create({
        data: {
            chat_id: chatId,
            role: role.toUpperCase() as message_role,
            content
        }
    });
}

export async function saveMessageAsync(chatId: string, role: 'user' | 'assistant', content: string) {
    await prisma.messages.create({
        data: {
            chat_id: chatId,
            role: role.toUpperCase() as message_role,
            content
        }
    });
}

export async function getUserChats(userId: string): Promise<any[]> {
    const chats = await prisma.chats.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
            id: true,
            created_at: true,
            messages: {
                orderBy: { created_at: 'asc' },
                take: 1,
                select: { content: true }
            }
        }
    });

    return chats.map(c => ({
        id: c.id,
        created_at: c.created_at,
        title: c.messages[0]?.content || "New Chat"
    }));
}

import { Message } from '@/types/chat';

export async function getChatMessages(chatId: string): Promise<{ messages: Message[], fileUrl?: string }> {
    const msgs = await prisma.messages.findMany({
        where: { chat_id: chatId },
        orderBy: { created_at: 'asc' },
        select: {
            role: true,
            content: true,
            created_at: true
        }
    });

    // Get file path from report linked to chat
    const chat = await prisma.chats.findUnique({
        where: { id: chatId },
        include: {
            reports: {
                select: { file_path: true }
            }
        }
    });

    const fileUrl = chat?.reports?.file_path;

    // Convert role to lowercase for frontend compatibility if needed
    const formattedMsgs: Message[] = msgs.map(m => ({
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
        // Assuming no fileInfo stored in DB messages yet, or we'd map it here
    }));

    return { messages: formattedMsgs, fileUrl: fileUrl || undefined };
}
