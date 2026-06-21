export default {
  async fetch(request, env) {

    const update = await request.json();

    if (!update.message?.chat?.id) {
      return new Response("ok");
    }

    await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: update.message.chat.id,
          text: "Press Go! for start"
        })
      }
    );

    return new Response("ok");
  }
}