import AgentClientPage from "@/components/agent-client-page";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getChatMessages, getUserChats, getUserProfile } from "@/lib/services/chat";
import { Message } from "@/types/chat";

export const dynamic = 'force-dynamic';

export default async function AgentChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        redirect('/login');
    }

    const initialHistory = await getUserChats(userId);
    const userProfile = await getUserProfile(userId);
    let initialMessages: Message[] = [];
    let initialFileUrl = null;

    try {
        // Fetch current chat only
        const chatData = await getChatMessages(id);

        if (chatData) {
            initialMessages = chatData.messages;
            initialFileUrl = chatData.fileUrl || null;
        }

    } catch (e) {
        console.error("Failed to fetch server data", e);
    }

    return (
        <AgentClientPage
            initialChatId={id}
            initialHistory={initialHistory}
            initialMessages={initialMessages}
            initialFileUrl={initialFileUrl}
            userId={userId}
            userProfile={userProfile || undefined}
        />
    );
}