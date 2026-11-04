/* ============================================================
   لوحة استلام طلبات الهيئات الدبلوماسية — شرطة دبي
   ============================================================ */
(function () {
  "use strict";
  const { SERVICES, CATEGORIES, MISSIONS, STATUSES, UNITS, svc, fmtDate, makePermitCode, esc, slaInfo, fmtDur, Store, HOUR, DAY } = DIP;
  const $ = s => document.querySelector(s);

  let all = [], officer = "ضابط المناوبة", rangeDays = 30, view = "dash", known = null, openId = null, bigMap = null, mapLayer = null;

  /* ---------- الدخول ---------- */
  function renderLogin() {
    $("#loginForm").innerHTML = Store.picker ? `
      <div class="field"><label>اسم الموظف</label><input id="lgName" value="ضابط المناوبة"></div>
      <button class="btn btn-p" style="width:100%">دخول</button>
      <div class="hint">تشغيل تجريبي: ادخل بأي اسم بدون كلمة مرور.</div>` : `
      <div class="field"><label>البريد الإلكتروني</label><input id="lgEmail" type="email" dir="ltr" required></div>
      <div class="field"><label>كلمة المرور</label><input id="lgPass" type="password" dir="ltr" required></div>
      <button class="btn btn-p" style="width:100%">دخول</button>`;
  }
  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (Store.picker) { const n = $("#lgName").value.trim() || "ضابط المناوبة"; try { sessionStorage.setItem("dip-officer", n); } catch (e) {} enter(n); return; }
    const email = $("#lgEmail").value.trim().toLowerCase();
    if (!(window.APP_CONFIG.policeAccounts || []).includes(email)) { UI.toast("هذا الحساب غير مسجل كموظف في config.js", "err"); return; }
    try { await Store.signIn(email, $("#lgPass").value); } catch (err) { UI.toast("بيانات الدخول غير صحيحة", "err"); }
  });

  function enter(name) {
    officer = name;
    $("#loginView").hidden = true; $("#app").hidden = false; $("#nav").hidden = false; $("#who").hidden = false;
    $("#who").innerHTML = `<button class="act notif" id="notifBtn"></button>${UI.ic("user")}<span>${esc(name)}</span>
      <button class="act" id="seedBtn" title="${Store.mode === "local" ? "إعادة البيانات التجريبية" : "إضافة بيانات تجريبية"}">${UI.ic("refresh")}</button>
      <button class="act" id="logoutBtn" title="خروج">${UI.ic("logout")}</button>`;
    $("#logoutBtn").onclick = async () => { try { sessionStorage.removeItem("dip-officer"); } catch (e) {} await Store.signOut(); location.reload(); };
    $("#seedBtn").onclick = async () => {
      if (!confirmBox()) return;
      if (Store.mode === "local") await Store.reset(); else await Store.seed();
      UI.toast("تم تحميل البيانات التجريبية");
    };
    Alerts.init();
    Store.subscribe(list => {
      all = list.slice().sort((a, b) => (b.urgent && b.status !== "completed") - (a.urgent && a.status !== "completed") || b.createdAt - a.createdAt);
      detectNew();
      render();
    });
    setInterval(() => { if (view === "reqs") renderRows(); renderSos(); }, 30e3);
  }
  // نافذة تأكيد داخلية بدل confirm()
  let confirmed = false;
  function confirmBox() {
    if (confirmed) { confirmed = false; return true; }
    openModal(`<div class="modal-h"><h3>${UI.ic("refresh")} البيانات التجريبية</h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <div class="modal-b">${Store.mode === "local" ? "سيتم حذف كل الطلبات الحالية في هذا المتصفح واستبدالها بالبيانات التجريبية." : "سيتم إضافة 12 طلب تجريبي إلى قاعدة البيانات."}</div>
      <div class="modal-f"><button class="btn btn-o" data-close>إلغاء</button><button class="btn btn-p" id="okBtn">متابعة</button></div>`);
    $("#okBtn").onclick = () => { closeModal(); confirmed = true; $("#seedBtn").click(); };
    return false;
  }

  // تنبيه عند وصول طلب جديد
  function detectNew() {
    const ids = new Set(all.map(r => r.id));
    if (known) {
      all.filter(r => !known.has(r.id)).forEach(r => {
        if (r.urgent) { UI.beep(); UI.toast(`بلاغ طارئ من ${r.missionName}`, "err"); }
        else UI.toast(`طلب جديد: ${svc(r.serviceId).ar} — ${r.missionName}`);
        Alerts.notify(r);
      });
    }
    known = ids;
  }

  /* ---------- التنبيهات: إشعارات + رقم على أيقونة التطبيق + تمييز الطوارئ ---------- */
  const Alerts = {
    reg: null,
    async init() {
      if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
        try { this.reg = await navigator.serviceWorker.register("sw.js"); } catch (e) {}
        navigator.serviceWorker.addEventListener("message", e => { if (e.data && e.data.open) openDetail(e.data.open); });
      }
      const m = location.hash.match(/req=([^&]+)/); if (m) setTimeout(() => openDetail(decodeURIComponent(m[1])), 1500);
      this.button();
    },
    supported() { return "Notification" in window; },
    button() {
      const b = $("#notifBtn"); if (!b) return;
      if (!this.supported()) { b.hidden = true; return; }
      const on = Notification.permission === "granted";
      b.classList.toggle("on", on);
      b.title = on ? "التنبيهات مفعّلة" : "تفعيل التنبيهات";
      b.innerHTML = UI.ic("bell") + `<span>${on ? "التنبيهات مفعّلة" : "تفعيل التنبيهات"}</span>`;
      b.onclick = async () => {
        if (Notification.permission === "granted") { this.test(); return; }
        const p = await Notification.requestPermission();
        if (p === "granted") { UI.toast("تم تفعيل التنبيهات"); this.test(); }
        else if (/iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone) UI.toast("في الآيفون: أضف اللوحة للشاشة الرئيسية أولاً، ثم فعّل التنبيهات من داخلها", "warn");
        else UI.toast("ما تم السماح بالتنبيهات — فعّلها من إعدادات المتصفح", "warn");
        this.button();
      };
    },
    async show(title, opts) {
      if (!this.supported() || Notification.permission !== "granted") return;
      try {
        const reg = this.reg || (navigator.serviceWorker && await navigator.serviceWorker.getRegistration());
        if (reg) await reg.showNotification(title, opts); else new Notification(title, opts);
      } catch (e) { try { new Notification(title, opts); } catch (e2) {} }
    },
    notify(r) {
      const s = svc(r.serviceId);
      this.show(r.urgent ? "🚨 بلاغ طارئ — " + r.missionName : "📥 طلب جديد — " + s.ar, {
        body: r.urgent ? `${r.fields.type || ""}${r.fields.desc ? " — " + r.fields.desc : ""}` : `${r.missionName}\n${r.ref}`,
        tag: r.id, data: { id: r.id, page: "police.html" }, renotify: true, requireInteraction: !!r.urgent, dir: "rtl", lang: "ar",
        icon: r.urgent ? "assets/img/icons/police-sos-192.png" : "assets/img/icons/police-192.png",
        badge: "assets/img/icons/badge-96.png", vibrate: r.urgent ? [400, 150, 400, 150, 400] : [200]
      });
    },
    test() { this.show("✅ التنبيهات شغالة", { body: "بيوصلك إشعار مع كل طلب جديد، وإشعار مميز للبلاغات الطارئة.", tag: "test", icon: "assets/img/icons/police-192.png", badge: "assets/img/icons/badge-96.png" }); },
    // رقم على أيقونة التطبيق + عنوان وأيقونة التبويب
    update() {
      const nNew = all.filter(r => r.status === "new").length;
      const sos = all.filter(r => r.urgent && !["completed", "rejected"].includes(r.status)).length;
      const n = nNew + all.filter(r => r.urgent && r.status === "inprogress").length;
      try { if (navigator.setAppBadge) { if (n) navigator.setAppBadge(n); else navigator.clearAppBadge(); } } catch (e) {}
      document.title = (sos ? `🚨 (${sos}) بلاغ طارئ | ` : nNew ? `(${nNew}) ` : "") + "لوحة استلام الطلبات | شرطة دبي";
      const fav = document.querySelector('link[rel="icon"]');
      if (fav) fav.href = sos ? "assets/img/icons/police-sos-64.png" : "assets/img/icons/police-64.png";
      const tc = document.querySelector('meta[name="theme-color"]');
      if (tc) tc.content = sos ? "#c53030" : "#ffffff";
    }
  };

  /* ---------- التنقل ---------- */
  function show(v) {
    view = v;
    document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.view === v));
    ["dash", "reqs", "map", "verify"].forEach(x => $("#v-" + x).hidden = x !== v);
    render();
    if (v === "map") setTimeout(renderMap, 50);
  }
  document.querySelectorAll("#nav button").forEach(b => b.onclick = () => show(b.dataset.view));

  function render() {
    const nNew = all.filter(r => r.status === "new").length;
    $("#newCnt").textContent = nNew; $("#newCnt").classList.toggle("show", nNew > 0);
    renderSos();
    Alerts.update();
    if (view === "dash") renderDash();
    if (view === "reqs") renderRows();
    if (view === "map" && bigMap) renderMap();
    if (openId) { const r = all.find(x => x.id === openId); if (r && $("#modal").classList.contains("open")) openDetail(openId, true); }
  }

  function renderSos() {
    const open = all.filter(r => r.urgent && !["completed", "rejected"].includes(r.status));
    $("#sosStrip").innerHTML = open.length ? `<div class="sos-strip"><div class="in">
      <b>${UI.ic("alert")} ${open.length === 1 ? "بلاغ طارئ مفتوح" : open.length + " بلاغات طارئة مفتوحة"}: ${esc(open[0].missionName)} — ${esc(open[0].fields.type || "")}</b>
      <span class="num" dir="ltr">${fmtDate(open[0].createdAt)}</span>
      <button class="btn btn-sm" id="sosOpen">فتح البلاغ</button></div></div>` : "";
    const b = $("#sosOpen"); if (b) b.onclick = () => openDetail(open[0].id);
  }

  /* ---------- المؤشرات ---------- */
  document.querySelectorAll("#range button").forEach(b => b.onclick = () => {
    rangeDays = +b.dataset.d; document.querySelectorAll("#range button").forEach(x => x.classList.toggle("on", x === b)); renderDash();
  });
  function inRange() { return rangeDays ? all.filter(r => r.createdAt >= Date.now() - rangeDays * DAY) : all; }

  function renderDash() {
    const L = inRange();
    $("#asOf").textContent = "آخر تحديث: " + fmtDate(Date.now()) + (rangeDays ? ` — آخر ${rangeDays} يوم` : " — كل الفترات");
    const done = L.filter(r => r.status === "completed");
    const open = L.filter(r => !["completed", "rejected"].includes(r.status));
    const inSla = done.filter(r => r.completedAt - r.createdAt <= r.slaHours * HOUR);
    const slaPct = done.length ? Math.round(inSla.length / done.length * 100) : 0;
    const avgH = done.length ? done.reduce((s, r) => s + (r.completedAt - r.createdAt), 0) / done.length / HOUR : 0;
    const rated = L.filter(r => r.rating);
    const satPct = rated.length ? Math.round(rated.reduce((s, r) => s + r.rating, 0) / rated.length / 5 * 100) : 0;
    const lateOpen = open.filter(r => slaInfo(r).late).length;
    const permits = L.filter(r => r.permitCode && r.status !== "rejected").length;
    const sos = L.filter(r => r.urgent).length;
    const k = (ic, l, v, s, bar, hl) => `<div class="card kpi ${hl ? "hl" : ""}"><div class="l">${UI.ic(ic)} ${l}</div><div class="v">${v}</div><div class="s">${s}</div>${bar != null ? `<div class="bar"><i style="width:${bar}%"></i></div>` : ""}</div>`;
    $("#kpis").innerHTML =
      k("list", "إجمالي الطلبات", L.length, `${open.length} مفتوح · ${done.length} مكتمل`, null, true) +
      k("clock", "الالتزام بمهلة الإنجاز", `${slaPct}<small>%</small>`, `المستهدف 95%`, slaPct) +
      k("chart", "متوسط زمن الإنجاز", `${avgH < 1 ? Math.round(avgH * 60) + "<small>دقيقة</small>" : avgH.toFixed(1) + "<small>ساعة</small>"}`, "من التقديم إلى الإكمال") +
      k("star", "رضا الهيئات الدبلوماسية", `${satPct}<small>%</small>`, `${rated.length} تقييم`, satPct) +
      k("bell", "طلبات جديدة بانتظار الاستلام", L.filter(r => r.status === "new").length, "تحتاج إجراء") +
      k("alert", "طلبات متجاوزة للمهلة", lateOpen, "من الطلبات المفتوحة") +
      k("qr", "تصاريح رقمية صادرة", permits, "قابلة للتحقق بـ QR") +
      k("alert", "بلاغات طارئة", sos, "خلال الفترة");

    // حسب نوع الخدمة
    const cats = Object.entries(CATEGORIES).map(([id, c]) => ({ l: c.ar, n: L.filter(r => r.category === id).length, c: id === "emergency" ? "#c53030" : null }));
    const mx = Math.max(1, ...cats.map(c => c.n));
    $("#byCat").innerHTML = cats.map(c => `<div class="hb"><span>${c.l}</span><div class="tr"><i style="width:${c.n / mx * 100}%;${c.c ? "--c:" + c.c : ""}"></i></div><span class="n">${c.n}</span></div>`).join("");
    // حسب الحالة
    const sts = Object.entries(STATUSES).map(([id, s]) => ({ l: s.ar, n: L.filter(r => r.status === id).length, c: s.color }));
    const ms = Math.max(1, ...sts.map(s => s.n));
    $("#byStatus").innerHTML = sts.map(s => `<div class="hb"><span>${s.l}</span><div class="tr"><i style="width:${s.n / ms * 100}%;--c:${s.c}"></i></div><span class="n">${s.n}</span></div>`).join("");
    // يومي
    const days = rangeDays || 30, buckets = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d0 = today.getTime() - i * DAY, d1 = d0 + DAY;
      const day = all.filter(r => r.createdAt >= d0 && r.createdAt < d1);
      buckets.push({ d: new Date(d0), n: day.length, u: day.filter(r => r.urgent).length });
    }
    const mb = Math.max(1, ...buckets.map(b => b.n));
    $("#trend").innerHTML = buckets.map(b => `<div class="c" title="${b.d.getDate()}/${b.d.getMonth() + 1}: ${b.n}">${b.n ? `<span>${b.n}</span>` : ""}<i style="height:${(b.n - b.u) / mb * 120}px"></i>${b.u ? `<i class="u" style="height:${b.u / mb * 120}px;border-radius:0"></i>` : ""}</div>`).join("")
      + "";
    $("#trend").insertAdjacentHTML("afterend", "");
    const x = $("#trendX"); if (x) x.remove();
    $("#trend").insertAdjacentHTML("afterend", `<div class="trend-x" id="trendX">${buckets.map((b, i) => `<span>${i % Math.ceil(days / 10) === 0 ? b.d.getDate() + "/" + (b.d.getMonth() + 1) : ""}</span>`).join("")}</div>`);
    // زمن الإنجاز مقابل المهلة
    const rows = Object.entries(CATEGORIES).filter(([id]) => id !== "emergency").map(([id, c]) => {
      const d = done.filter(r => r.category === id);
      const avg = d.length ? d.reduce((s, r) => s + (r.completedAt - r.createdAt), 0) / d.length / HOUR : 0;
      const sla = d.length ? d.reduce((s, r) => s + r.slaHours, 0) / d.length : (SERVICES.filter(s => s.cat === id).reduce((s, x) => s + x.sla, 0) / SERVICES.filter(s => s.cat === id).length);
      return { l: c.ar, avg, sla, n: d.length };
    });
    const mxh = Math.max(1, ...rows.map(r => Math.max(r.avg, r.sla)));
    $("#slaChart").innerHTML = rows.map(r => `<div class="sla-row"><span>${r.l}</span><div class="tr"><i class="${r.avg > r.sla ? "late" : ""}" style="width:${r.avg / mxh * 100}%"></i><b style="inset-inline-start:${r.sla / mxh * 100}%" title="المهلة"></b></div><span class="n">${r.n ? r.avg.toFixed(1) + " / " + Math.round(r.sla) + " س" : "—"}</span></div>`).join("")
      + `<div class="map-note">الشريط = متوسط الإنجاز · الخط الأسود = المهلة المحددة</div>`;
    // الرضا
    const dist = [5, 4, 3, 2, 1].map(s => ({ s, n: rated.filter(r => r.rating === s).length }));
    const md = Math.max(1, ...dist.map(d => d.n));
    $("#sat").innerHTML = `<div class="sat"><div class="ring" style="--p:${satPct}"><div><div><b>${satPct}%</b><br><small>نسبة الرضا</small></div></div></div>
      <ul>${dist.map(d => `<li><span>${"★".repeat(d.s)}</span><div class="tr"><i style="width:${d.n / md * 100}%"></i></div><span class="n">${d.n}</span></li>`).join("")}</ul></div>`;
  }

  /* ---------- قائمة الطلبات ---------- */
  Object.entries(STATUSES).forEach(([id, s]) => $("#fStatus").insertAdjacentHTML("beforeend", `<option value="${id}">${s.ar}</option>`));
  Object.entries(CATEGORIES).forEach(([id, c]) => $("#fCat").insertAdjacentHTML("beforeend", `<option value="${id}">${c.ar}</option>`));
  ["#q", "#fStatus", "#fCat", "#fOpen"].forEach(s => $(s).addEventListener("input", renderRows));

  function slaTag(r) {
    const s = slaInfo(r);
    if (s.done) return `<span class="sla-tag done">${r.status === "completed" ? (s.late ? "أُنجز متأخراً" : "أُنجز ضمن المهلة") : "—"}</span>`;
    const cls = s.late ? "late" : s.left < r.slaHours * HOUR * 0.25 ? "warn" : "ok";
    return `<span class="sla-tag ${cls}">${s.late ? "متأخر " + fmtDur(-s.left) : fmtDur(s.left)}</span>`;
  }
  function renderRows() {
    const q = $("#q").value.trim().toLowerCase(), st = $("#fStatus").value, cat = $("#fCat").value, onlyOpen = $("#fOpen").checked;
    const L = all.filter(r => (!st || r.status === st) && (!cat || r.category === cat) && (!onlyOpen || !["completed", "rejected"].includes(r.status))
      && (!q || (r.ref + r.missionName + svc(r.serviceId).ar).toLowerCase().includes(q)));
    $("#rows").innerHTML = L.map(r => `<tr class="row ${r.urgent && !["completed", "rejected"].includes(r.status) ? "urgent" : ""}" data-id="${r.id}">
      <td class="num" dir="ltr" style="text-align:start">${r.status === "new" ? '<span class="new-dot"></span>' : ""}${esc(r.ref)}</td>
      <td>${esc(r.missionName)}</td>
      <td>${r.urgent ? `<span class="chip red">${UI.ic("alert")} طارئ</span> ` : ""}${esc(svc(r.serviceId).ar)}</td>
      <td class="muted">${esc(UNITS[r.unit].ar)}</td>
      <td class="num">${fmtDate(r.createdAt)}</td>
      <td>${slaTag(r)}</td>
      <td>${UI.statusBadge(r.status)}</td></tr>`).join("") || `<tr><td colspan="7" class="empty">ما فيه طلبات مطابقة.</td></tr>`;
    $("#rows").querySelectorAll("tr.row").forEach(tr => tr.onclick = () => openDetail(tr.dataset.id));
  }

  /* ---------- تفاصيل الطلب والإجراءات ---------- */
  let miniMap = null;
  function openModal(html) { $("#modal").innerHTML = html; $("#modal").classList.add("open"); $("#ov").classList.add("open"); $("#modal").querySelectorAll("[data-close]").forEach(b => b.onclick = closeModal); }
  function closeModal() { $("#modal").classList.remove("open"); $("#ov").classList.remove("open"); openId = null; if (miniMap) { miniMap.remove(); miniMap = null; } }
  $("#ov").onclick = closeModal;
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  function openDetail(id, refresh) {
    const r = all.find(x => x.id === id); if (!r) return;
    const keepScroll = refresh ? $("#modal").scrollTop : 0;
    openId = id;
    const s = svc(r.serviceId), m = MISSIONS[r.missionId] || {};
    const rows = s.fields.filter(f => f.type !== "map").map(f => `<dt>${esc(f.ar.replace(/\s*\(.*\)$/, ""))}</dt><dd>${esc(r.fields[f.k] || "—")}</dd>`).join("")
      + (r.urgent ? `<dt>نوع البلاغ</dt><dd>${esc(r.fields.type)}</dd><dt>الوصف</dt><dd>${esc(r.fields.desc || "—")}</dd>` : "")
      + (r.attachments && r.attachments.length ? `<dt>المرفقات</dt><dd>${r.attachments.map(esc).join("\n")}</dd>` : "");
    const hist = r.history.slice().reverse().map(h => `<li style="--c:${STATUSES[h.status].color}"><b>${STATUSES[h.status].ar}</b>${h.note ? ` — ${esc(h.note)}` : ""}<div class="t">${fmtDate(h.at)} · ${esc(h.by)}</div></li>`).join("");
    const notes = (r.notes || []).map(n => `<li style="--c:#94a3b8"><b>ملاحظة داخلية</b> — ${esc(n.text)}<div class="t">${fmtDate(n.at)} · ${esc(n.by)}</div></li>`).join("");

    // الإجراءات المتاحة حسب الحالة
    let acts = "";
    if (r.urgent) {
      if (r.status === "new") acts = `<button class="btn btn-r" data-go="inprogress">${UI.ic("alert")} مباشرة البلاغ</button>`;
      else if (r.status === "inprogress") acts = `<button class="btn btn-p" data-go="completed">${UI.ic("check")} إغلاق البلاغ</button>`;
    } else {
      if (r.status === "new") acts = `<button class="btn btn-p" data-go="review">${UI.ic("check")} استلام الطلب</button>`;
      if (r.status === "review") acts = `<button class="btn btn-p" data-go="approved">${UI.ic("check")} اعتماد${s.permit ? " وإصدار التصريح" : ""}</button><button class="btn btn-o" id="rejBtn" style="color:var(--red);border-color:#f0c2c2">${UI.ic("x")} رفض</button>`;
      if (r.status === "approved") acts = `<button class="btn btn-p" data-go="inprogress">${UI.ic("send")} بدء التنفيذ</button>`;
      if (r.status === "inprogress") acts = `<button class="btn btn-p" data-go="completed">${UI.ic("check")} إكمال الطلب</button>`;
    }
    const closed = ["completed", "rejected"].includes(r.status);
    const si = slaInfo(r);

    openModal(`
      <div class="modal-h" ${r.urgent ? 'style="background:var(--red-l)"' : ""}><h3 ${r.urgent ? 'style="color:var(--red)"' : ""}>${UI.ic(CATEGORIES[s.cat].icon)} ${esc(s.ar)}</h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <div class="modal-b">
        <div class="det-top"><div><div class="muted" style="font-size:12px">رقم الطلب</div><div class="ref">${esc(r.ref)}</div></div>
          <div style="display:flex;gap:8px;align-items:center">${slaTag(r)} ${UI.statusBadge(r.status)}</div></div>
        <div class="cols">
          <div>
            <dl class="kv">
              <dt>البعثة</dt><dd>${esc(r.missionName)}</dd>
              <dt>ضابط الاتصال</dt><dd>${esc(m.officer || "—")} · <span class="num" dir="ltr">${esc(m.phone || "")}</span></dd>
              <dt>تاريخ التقديم</dt><dd>${fmtDate(r.createdAt)}</dd>
              <dt>المهلة</dt><dd>${r.slaHours < 1 ? Math.round(r.slaHours * 60) + " دقيقة" : r.slaHours + " ساعة"} (حتى ${fmtDate(si.due)})</dd>
              <dt>الجهة المختصة</dt><dd>${esc(UNITS[r.unit].ar)}</dd>
              ${rows}
              ${r.permitCode && r.status !== "rejected" ? `<dt>رمز التصريح</dt><dd class="num" dir="ltr" style="text-align:start;letter-spacing:.1em">${esc(r.permitCode)}</dd>` : ""}
              ${r.rejectReason ? `<dt>سبب الرفض</dt><dd style="color:var(--red)">${esc(r.rejectReason)}</dd>` : ""}
              ${r.rating ? `<dt>تقييم البعثة</dt><dd style="color:var(--gold)">${"★".repeat(r.rating)}<span style="color:#ddd">${"★".repeat(5 - r.rating)}</span> ${esc(r.ratingNote || "")}</dd>` : ""}
            </dl>
            ${r.location && r.location.lat != null ? `<div class="mini-map" id="miniMap"></div>` : r.location ? `<div class="chip" style="margin-top:10px">${UI.ic("map")} ${esc(r.location.label)}</div>` : ""}
          </div>
          <div>
            <h4 style="font-size:14px;margin-bottom:10px">سجل الطلب</h4>
            <ul class="hist">${notes}${hist}</ul>
          </div>
        </div>
        ${!closed ? `<div class="act-box"><h4>الإجراء</h4>
          <div class="actions">${acts}</div>
          <div class="act-row" id="rejRow" hidden><input class="inp" id="rejReason" placeholder="سبب الرفض (يظهر للبعثة)"><button class="btn btn-r btn-sm" id="rejGo">تأكيد الرفض</button></div>
          <div class="act-row"><select class="inp" id="unitSel">${Object.entries(UNITS).map(([k, u]) => `<option value="${k}" ${k === r.unit ? "selected" : ""}>${u.ar}</option>`).join("")}</select><button class="btn btn-o btn-sm" id="fwdBtn">تحويل</button></div>
          <div class="act-row"><input class="inp" id="noteInp" placeholder="ملاحظة داخلية (لا تظهر للبعثة)"><button class="btn btn-o btn-sm" id="noteBtn">إضافة</button></div>
        </div>` : ""}
      </div>`);
    $("#modal").scrollTop = keepScroll;

    if (r.location && r.location.lat != null && window.L) {
      setTimeout(() => {
        if (!$("#miniMap")) return;
        if (miniMap) miniMap.remove();
        miniMap = L.map("miniMap", { zoomControl: false }).setView([r.location.lat, r.location.lng], 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(miniMap);
        L.marker([r.location.lat, r.location.lng]).addTo(miniMap);
      }, 60);
    }

    const go = async (status, extra = {}, note = "") => {
      const now = Date.now();
      const patch = Object.assign({ status, updatedAt: now, history: r.history.concat([{ status, at: now, by: officer, note }]) }, extra);
      if (status === "approved" && s.permit && !r.permitCode) patch.permitCode = makePermitCode();
      if (status === "completed") patch.completedAt = now;
      await Store.update(r.id, patch);
      UI.toast(`تم تحديث الطلب ${r.ref}: ${STATUSES[status].ar}`);
    };
    $("#modal").querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
    const rb = $("#rejBtn"); if (rb) rb.onclick = () => { $("#rejRow").hidden = false; $("#rejReason").focus(); };
    const rg = $("#rejGo"); if (rg) rg.onclick = () => { const why = $("#rejReason").value.trim(); if (!why) { UI.toast("اكتب سبب الرفض", "warn"); return; } go("rejected", { rejectReason: why }, why); };
    const fb = $("#fwdBtn"); if (fb) fb.onclick = async () => {
      const u = $("#unitSel").value; if (u === r.unit) return;
      await Store.update(r.id, { unit: u, updatedAt: Date.now(), notes: (r.notes || []).concat([{ text: "تم التحويل إلى " + UNITS[u].ar, at: Date.now(), by: officer }]) });
      UI.toast("تم تحويل الطلب إلى " + UNITS[u].ar);
    };
    const nb = $("#noteBtn"); if (nb) nb.onclick = async () => {
      const tx = $("#noteInp").value.trim(); if (!tx) return;
      await Store.update(r.id, { notes: (r.notes || []).concat([{ text: tx, at: Date.now(), by: officer }]) });
    };
  }

  /* ---------- الخارطة ---------- */
  function renderMap() {
    if (!window.L) { $("#bigMap").innerHTML = '<div class="empty">الخارطة تحتاج اتصال بالإنترنت.</div>'; return; }
    if (!bigMap) {
      bigMap = L.map("bigMap").setView([25.23, 55.30], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(bigMap);
      mapLayer = L.layerGroup().addTo(bigMap);
    }
    mapLayer.clearLayers();
    const pin = (color, u) => L.divIcon({ className: "", html: `<div class="pin ${u ? "u" : ""}" style="background:${color}"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
    Object.entries(MISSIONS).forEach(([id, m]) => {
      L.marker([m.lat, m.lng], { icon: pin("#00492c") }).addTo(mapLayer).bindPopup(`<b>${esc(m.ar)}</b><br>منشأة دبلوماسية مؤمنة`);
    });
    all.filter(r => r.location && r.location.lat != null && !["rejected"].includes(r.status)).forEach(r => {
      const open = r.status !== "completed";
      const color = r.urgent && open ? "#c53030" : open ? "#d69e2e" : "#018556";
      L.marker([r.location.lat, r.location.lng], { icon: pin(color, r.urgent && open) }).addTo(mapLayer)
        .bindPopup(`<b>${esc(svc(r.serviceId).ar)}</b><br>${esc(r.missionName)}<br>${esc(r.ref)} · ${STATUSES[r.status].ar}`);
    });
    $("#legend").innerHTML = [["#00492c", "مقر بعثة مؤمن"], ["#d69e2e", "طلب جاري"], ["#018556", "طلب مكتمل"], ["#c53030", "بلاغ طارئ"]].map(([c, l]) => `<span><i style="background:${c}"></i>${l}</span>`).join("");
    bigMap.invalidateSize();
  }

  /* ---------- التحقق من التصريح ---------- */
  $("#vCode").addEventListener("input", e => { let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8); if (v.length > 4) v = v.slice(0, 4) + "-" + v.slice(4); e.target.value = v; });
  $("#vForm").onsubmit = e => {
    e.preventDefault();
    const code = $("#vCode").value.trim().toUpperCase();
    const r = all.find(x => x.permitCode === code);
    if (!r) { $("#vRes").innerHTML = `<div class="vres bad"><h3>${UI.ic("x")} تصريح غير موجود</h3>تأكد من الرمز، أو تواصل مع قسم أمن الهيئات الدبلوماسية والمنشآت الهامة.</div>`; return; }
    const valid = ["approved", "inprogress", "completed"].includes(r.status);
    $("#vRes").innerHTML = `<div class="vres ${valid ? "ok" : "bad"}"><h3>${UI.ic(valid ? "check" : "x")} ${valid ? "تصريح ساري" : "تصريح غير ساري"}</h3>
      <dl class="kv"><dt>الخدمة</dt><dd>${esc(svc(r.serviceId).ar)}</dd><dt>البعثة</dt><dd>${esc(r.missionName)}</dd>
      <dt>التاريخ</dt><dd>${esc(r.fields.date || "—")}</dd>${r.fields.persons || r.fields.visitors ? `<dt>الأشخاص</dt><dd>${esc(r.fields.persons || r.fields.visitors)}</dd>` : ""}
      ${r.fields.plate ? `<dt>المركبة</dt><dd>${esc(r.fields.plate)}</dd>` : ""}<dt>رقم الطلب</dt><dd class="num" dir="ltr" style="text-align:start">${esc(r.ref)}</dd></dl></div>`;
  };

  /* ---------- التشغيل ---------- */
  (async function start() {
    try { await Store.init(); } catch (err) { UI.toast(err.message, "err"); }
    $("#banner").innerHTML = UI.modeBanner();
    renderLogin();
    if (Store.picker) {
      let n = null; try { n = sessionStorage.getItem("dip-officer"); } catch (e) {}
      if (n) enter(n);
    } else {
      Store.onAuth(u => {
        if (!u) return;
        if ((window.APP_CONFIG.policeAccounts || []).includes((u.email || "").toLowerCase())) enter(u.email);
        else { UI.toast("هذا الحساب ليس من حسابات الموظفين", "err"); Store.signOut(); }
      });
    }
  })();
})();
