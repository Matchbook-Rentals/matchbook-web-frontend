import MessageInterface from './message-interface';
import { getAllConversations } from '@/app/actions/conversations';
import { auth, currentUser } from '@clerk/nextjs/server';
import { APP_PAGE_MARGIN } from '@/constants/styles';
import { headers } from 'next/headers';

export default async function MessagePage() {
  let conversations = await getAllConversations();
  let authUser = await currentUser();
  let user = {id: authUser?.id}
  if (!user) {
    return (<p> please log in </p>)
  }
  if (!conversations) {
    conversations = [];
  }

  // Detect mobile device using user-agent
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return (
    <div className={` ${APP_PAGE_MARGIN} mx-auto min-h-[calc(100vh-75px)]  sm:min-h-[calc(100vh-75px)] md:min-h-[calc(100vh-80px)]`}>
      <MessageInterface conversations={conversations} user={user} initialIsMobile={isMobileDevice} />
    </div>
  );
}
