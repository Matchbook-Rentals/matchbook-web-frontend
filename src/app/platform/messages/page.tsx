import Breadcrumbs from '@/components/ui/breadcrumbs';
import MessageInterface from './message-interface';
import { getAllConversations } from '@/app/actions/conversations';
import { APP_PAGE_MARGIN } from '@/constants/styles';

export default async function MessagePage() {
  const conversations = await getAllConversations();
  return (
    <div className={`${APP_PAGE_MARGIN} mx-auto min-h-[98vh]`}>
      <MessageInterface conversations={conversations} />
    </div>
  );
}
