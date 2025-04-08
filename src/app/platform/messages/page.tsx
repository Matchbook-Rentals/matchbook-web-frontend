import Breadcrumbs from '@/components/ui/breadcrumbs';
import MessageInterface from './message-interface';
import { getAllConversations } from '@/app/actions/conversations';
import { auth, currentUser } from '@clerk/nextjs/server';
import { APP_PAGE_MARGIN } from '@/constants/styles';

export default async function MessagePage() {
  // Get current user data
  const user = await currentUser();
  
  // Check if user is authenticated
  if (!user) {
    return (<p>Please log in</p>);
  }
  
  // Get conversations
  let conversations = await getAllConversations();
  if (!conversations) {
    conversations = [];
  }
  
  // Extract only the serializable user data we need
  const userData = {
    id: user.id,
    imageUrl: user.imageUrl,
    firstName: user.firstName,
    publicMetadata: user.publicMetadata
  };
  
  return (
    <div className={`mx-auto min-h-[calc(100vh-75px)] sm:min-h-[calc(100vh-75px)] md:min-h-[calc(100vh-80px)]`}>
      <MessageInterface 
        conversations={conversations} 
        userData={userData} 
      />
    </div>
  );
}
