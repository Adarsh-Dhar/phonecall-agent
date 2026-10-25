self.addEventListener("push", (event) => {
  const data = event.data?.json?.() ?? {};

  // Handle custom payload types (handoff, agent_call_done)
  if (data.type === "handoff_request") {
    const options = {
      body: data.reason || "Your agent needs you on the line",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data: {
        url: `/calls?handoff=${data.handoffId}&call=${data.callId}`,
        type: "handoff_request",
        handoffId: data.handoffId,
        callId: data.callId,
      },
    };
    event.waitUntil(self.registration.showNotification("Your agent needs you", options));
    return;
  }

  if (data.type === "agent_call_done") {
    const options = {
      body: `Your agent finished a call with ${data.contactName || "a business"}. Outcome: ${data.outcome || "unknown"}`,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data: {
        url: "/calls",
        type: "agent_call_done",
      },
    };
    event.waitUntil(self.registration.showNotification("Agent call completed", options));
    return;
  }

  // Standard push notification
  const options = {
    body: data.body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: {
      url: data.url,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.notification.data?.url) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === event.notification.data.url && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});
