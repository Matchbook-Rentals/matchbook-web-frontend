# Messageing section of our app

Fetches conversations using server action

Displays them in a converation-list.tsx (ConversationList) with the important caveat that a conversation is created on 3 points (not just two userids) but two userIds and a listingId as we want users to be able to be clear about which property they are communicating about

Connects to websocket using socket.io

Sends messages using socket.io to our (ts_server/server.js) socket server. the socket server passes messaged onto both recipient and our backend for saving to database

Message is caught bia socket.io and client side handlign puts it in the appropriate conversation

BUG! Messages are briefly appearing as doubled upon being caught. I am not sure where this is coming from but I am afraid it might be that we are placing messages into ocnversations based on userIds and not convoId.
