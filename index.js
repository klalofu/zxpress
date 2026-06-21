export default {
  async fetch(request, env) {

    if (request.method !== "POST") {
      return new Response("WORKS");
    }

    const update = await request.json();

    const chatId = update.message?.chat?.id;

    if (!chatId) {
      return new Response("ok");
    }

    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "Press Go! for start"
      })
    });

    return new Response("ok");
  }
}