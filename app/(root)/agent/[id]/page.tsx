import AgentClientPage from "@/components/agent-client-page";
import { getChatMessages } from "@/lib/services/chat";
import { Message } from "@/types/chat";

export const dynamic = 'force-dynamic';

export default async function AgentChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const userId = 'guest-user';

    const initialHistory: any[] = []; // History disabled
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
        />
    )
}