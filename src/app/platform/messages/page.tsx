import Breadcrumbs from '@/components/ui/breadcrumbs';
import MessageInterface from './message-interface';
import { getAllConversations } from '@/app/actions/conversations';
import { PAGE_MARGIN } from '@/constants/styles';

export default async function MessagePage() {
  const conversations = await getAllConversations();
  return (
    <div className={` ${PAGE_MARGIN} mx-auto `}>
      <Breadcrumbs className='mb-2' links={[{label: 'Messages'}]} />
      <MessageInterface conversations={conversations} />
    </div>
  );
}
