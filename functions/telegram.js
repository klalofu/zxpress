export async function onRequestPost({ request, env }) {

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
      text: "Жми кнопку Go для старта"
    })
  });

  return new Response("ok");
}

export async function onRequest() {
  return new Response("WORKS");
}