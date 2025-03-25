import Breadcrumbs from '@/components/ui/breadcrumbs';
import MessageInterface from './message-interface';
import { getAllConversations } from '@/app/actions/conversations';
import { APP_PAGE_MARGIN } from '@/constants/styles';

export default async function MessagePage() {
  const conversations = await getAllConversations();
  return (
    <div className={`${APP_PAGE_MARGIN} mx-auto min-h-[calc(100vh-65px)] sm:min-h-[calc(100vh-65px)] md:min-h-[calc(100vh-80px)]`}>
      <MessageInterface conversations={conversations} />
    </div>
  );
}
