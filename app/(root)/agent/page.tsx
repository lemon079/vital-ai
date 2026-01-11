import AgentClientPage from "@/components/agent-client-page";

export const dynamic = 'force-dynamic';

export default async function AgentPage() {
    const userId = 'guest-user';

    // History fetching disabled for simplified mode
    const initialHistory: any[] = [];

    return <AgentClientPage initialHistory={initialHistory} userId={userId} />;
}