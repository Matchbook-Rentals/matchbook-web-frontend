import MessagesPageClient from './messages-page-client';
import { getAllConversations } from '@/app/actions/conversations';
import { auth, currentUser } from '@clerk/nextjs/server';
import { APP_PAGE_MARGIN } from '@/constants/styles';
import { headers } from 'next/headers';

export default async function MessagePage() {
  let conversations = await getAllConversations();
  let authUser = await currentUser();
  let user = {
    id: authUser?.id,
    imageUrl: authUser?.imageUrl,
  }
  if (!user.id) {
    return (<p> please log in </p>)
  }
  if (!conversations) {
    conversations = [];
  }

  // Detect mobile device using user-agent
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Compute isAdmin server-side
  const isAdmin = authUser?.publicMetadata?.role === 'admin' || authUser?.publicMetadata?.role === 'admin_dev';

  return (
    <div className={` ${APP_PAGE_MARGIN} mx-auto`}>
      <div className="h-[calc(100dvh-80px)] overflow-hidden">
        <MessagesPageClient
          conversations={conversations}
          user={user}
          initialIsMobile={isMobileDevice}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
