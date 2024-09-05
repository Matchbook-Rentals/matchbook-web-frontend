// app/api/sse/route.js

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamically rendered

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || 'defaultId';

  // Set headers for SSE
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  // Create a response with the correct headers
  const response = new Response(
    (function () {
      let counter = 0;
      const stream = new ReadableStream({
        start(controller) {
          // This function is called when the stream starts
          const intervalId = setInterval(() => {
            counter++;
            const data = `event: message\ndata: {"time": ${Date.now()}, "id": "${id}", "counter": ${counter}}\n\n`;
            controller.enqueue(data);
            if (counter >= 10) {
              clearInterval(intervalId);
              controller.close(); // Close the stream after 10 messages
            }
          }, 1000);

          // Cleanup
          request.signal.onabort = () => {
            clearInterval(intervalId);
            controller.close();
          };
        },
        cancel() {
          console.log('SSE Connection closed by client');
        },
      });
      return stream;
    })(),
    { headers }
  );

  return response;
}