import Breadcrumbs from '@/components/ui/breadcrumbs';
import MessageInterface from './message-interface';
import { getAllConversations } from '@/app/actions/conversations';
import { APP_PAGE_MARGIN } from '@/constants/styles';

export default async function MessagePage() {
  let conversations = await getAllConversations();
  if (!conversations) {
    conversations = [];
  }
  return (
    <div className={` mx-auto min-h-[calc(100vh-75px)]  sm:min-h-[calc(100vh-75px)] md:min-h-[calc(100vh-80px)]`}>
      <MessageInterface conversations={conversations} />
    </div>
  );
}
