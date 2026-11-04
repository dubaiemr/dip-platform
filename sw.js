/* Service worker — تنبيهات لوحة الشرطة */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// عند الضغط على الإشعار: افتح اللوحة (أو ركّز عليها) على الطلب نفسه
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const d = e.notification.data || {}, id = d.id || "", page = d.page || "police.html";
  const url = new URL(page + (id ? "#req=" + id : ""), self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.includes(page)) { w.postMessage({ open: id }); return w.focus(); }
    }
    return self.clients.openWindow(url);
  })());
});

// جاهز لاستقبال Web Push لاحقاً (عند ربط خادم إشعارات)
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "طلب جديد", body: e.data && e.data.text() }; }
  const sos = !!d.urgent;
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || (sos ? "🚨 بلاغ طارئ" : "📥 طلب جديد"), {
      body: d.body || "", tag: d.id || "dip", data: { id: d.id }, renotify: true, requireInteraction: sos,
      icon: sos ? "assets/img/icons/police-sos-192.png" : "assets/img/icons/police-192.png", badge: "assets/img/icons/badge-96.png",
      vibrate: sos ? [400, 150, 400, 150, 400] : [200]
    }),
    self.navigator && self.navigator.setAppBadge ? self.navigator.setAppBadge() : null
  ]));
});
