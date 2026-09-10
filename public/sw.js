self.addEventListener("push", (event) => {
  let payload = {
    title: "Novo alerta no AcadIA",
    body: "Abra a Central de alertas para conferir.",
    href: "/alertas",
    icon: "/acadia-logo.jpeg",
    tag: "acadia-alert",
  };

  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Mantém a mensagem segura padrão quando o payload não é JSON válido.
  }

  let href = "/alertas";
  try {
    const candidate = new URL(payload.href, self.location.origin);
    if (candidate.origin === self.location.origin) {
      href = `${candidate.pathname}${candidate.search}${candidate.hash}`;
    }
  } catch {
    // Links inválidos nunca saem da origem do AcadIA.
  }

  event.waitUntil(self.registration.showNotification(String(payload.title).slice(0, 200), {
    body: String(payload.body).slice(0, 800),
    data: { href },
    icon: payload.icon === "/acadia-logo.jpeg" ? payload.icon : "/acadia-logo.jpeg",
    tag: String(payload.tag).slice(0, 64),
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/alertas";
  const destination = new URL(href, self.location.origin);

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
    for (const client of windows) {
      if (new URL(client.url).origin !== self.location.origin) continue;
      await client.navigate(destination.href);
      return client.focus();
    }
    return self.clients.openWindow(destination.href);
  })());
});
