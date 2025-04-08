import MessageInterface from './message-interface';
import { getAllConversations } from '@/app/actions/conversations';
import { auth, currentUser } from '@clerk/nextjs/server';

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
  return (
    <div className={` mx-auto min-h-[calc(100vh-75px)]  sm:min-h-[calc(100vh-75px)] md:min-h-[calc(100vh-80px)]`}>
      <MessageInterface conversations={conversations} user={user} />
    </div>
  );
}
