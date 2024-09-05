import MessageInterface from './message-interface';
import { getAllConversations } from '@/app/actions/conversations';

export default async function MessagePage() {
  const conversations = await getAllConversations();
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl text-center font-bold mb-4">Messages</h1>
      <MessageInterface conversations={conversations} />
    </div>
  );
}
