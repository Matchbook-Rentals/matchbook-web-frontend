import Breadcrumbs from '@/components/ui/breadcrumbs';
import MessageInterface from './message-interface';
import { getAllConversations } from '@/app/actions/conversations';

export default async function MessagePage() {
  const conversations = await getAllConversations();
  return (
    <div className="container mx-auto p-4 ">
      <Breadcrumbs links={[{label: 'Messages'}]} />
      <MessageInterface conversations={conversations} />
    </div>
  );
}
