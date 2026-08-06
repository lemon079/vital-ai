import AgentClientPage from "@/components/agent-client-page";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserChats, getUserProfile } from '@/lib/services/chat';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        redirect('/login');
    }

    const initialHistory = await getUserChats(userId);
    const userProfile = await getUserProfile(userId);

    return <AgentClientPage initialHistory={initialHistory} userId={userId} userProfile={userProfile || undefined} />;
}
