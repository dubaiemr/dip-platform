/* ============================================================
   لوحة استلام طلبات الهيئات الدبلوماسية — شرطة دبي
   ============================================================ */
(function () {
  "use strict";
  const { SERVICES, CATEGORIES, MISSIONS, FACILITIES, FAC_TYPES, SOURCES, STATUSES, UNITS, svc, unitFor, fmtDate, makePermitCode, esc, slaInfo, fmtDur, Store, HOUR, DAY } = DIP;
  const $ = s => document.querySelector(s);

  let sites = [], siteMode = "flags";
  let all = [], officer = "ضابط المناوبة", rangeDays = 30, view = "dash", known = null, openId = null, bigMap = null, mapLayer = null;

  /* ---------- الدخول ---------- */
  function renderLogin() {
    $("#loginForm").innerHTML = Store.picker ? `
      <div class="field"><label>اسم الموظف</label><input id="lgName" value="ضابط المناوبة"></div>
      <button class="btn btn-p" style="width:100%">دخول</button>
      <div class="hint">تشغيل تجريبي: سجّل الدخول بأي اسم دون كلمة مرور.</div>` : `
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
    $("#who").innerHTML = `<button class="act notif" id="notifBtn"></button>
      <div class="menu-wrap"><button class="act" id="menuBtn" title="القائمة">${UI.ic("user")}<span>${esc(name)}</span><svg class="ic" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M6 9l6 6 6-6"/></svg></button>
        <div class="menu" id="menu" hidden>
          <div class="mh">${UI.ic("user")} ${esc(name)}</div>
          <button id="seedBtn">${UI.ic("refresh")} تحميل البيانات التجريبية</button>
          <button id="clearBtn" class="danger">${UI.ic("trash")} مسح كل الطلبات</button>
          <button id="logoutBtn">${UI.ic("logout")} تسجيل الخروج</button>
        </div></div>`;
    $("#menuBtn").onclick = e => { e.stopPropagation(); $("#menu").hidden = !$("#menu").hidden; };
    document.addEventListener("click", e => { if (!e.target.closest(".menu-wrap")) $("#menu").hidden = true; });
    $("#logoutBtn").onclick = async () => { try { sessionStorage.removeItem("dip-officer"); } catch (e) {} await Store.signOut(); location.reload(); };
    $("#seedBtn").onclick = () => confirmBox("تحميل البيانات التجريبية",
      Store.mode === "local" ? "ستُستبدل جميع الطلبات الحالية في هذا المتصفح ببيانات تجريبية جاهزة." : "ستُضاف مجموعة من الطلبات التجريبية إلى قاعدة البيانات، وتظهر فوراً في المنصتين.",
      "تحميل", async () => { if (Store.mode === "local") await Store.reset(); else await Store.seed(); UI.toast("تم تحميل البيانات التجريبية"); });
    $("#clearBtn").onclick = () => confirmBox("مسح كل الطلبات",
      "سيُحذف جميع الطلبات والبلاغات والتقارير من المنصتين (بوابة الهيئات الدبلوماسية ولوحة الشرطة)، لتبدأ التجربة من الصفر. لا يمكن التراجع عن هذا الإجراء. كشف القنصليات ومواقعها لا يتأثر.",
      "مسح الكل", async () => { await Store.clear(); known = new Set(); UI.toast("تم مسح جميع الطلبات — المنصتان جاهزتان لتجربة جديدة"); }, true);
    Alerts.init();
    Store.subscribe(list => {
      all = list.slice().sort((a, b) => (b.urgent && b.status !== "completed") - (a.urgent && a.status !== "completed") || b.createdAt - a.createdAt);
      detectNew();
      render();
    });
    Store.subscribeSites(list => { sites = list; if (view === "map") renderMap(); });
    setInterval(() => { if (view === "reqs") renderRows(); renderSos(); }, 30e3);
  }
  // نافذة تأكيد داخلية بدل confirm()
  function confirmBox(title, text, okLabel, onOk, danger) {
    openModal(`<div class="modal-h ${danger ? "sos" : ""}"><h3>${UI.ic(danger ? "trash" : "refresh")}<span>${title}</span></h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <div class="modal-b"><p style="margin:0">${text}</p></div>
      <div class="modal-f"><button class="btn btn-o" data-close>إلغاء</button><button class="btn ${danger ? "btn-r" : "btn-p"}" id="okBtn">${okLabel}</button></div>`);
    $("#okBtn").onclick = async () => { $("#okBtn").disabled = true; try { await onOk(); } catch (e) { UI.toast(e.message, "err"); } closeModal(); };
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
        else if (/iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone) UI.toast("في أجهزة آيفون: أضف اللوحة إلى الشاشة الرئيسية أولاً، ثم فعّل التنبيهات من داخلها", "warn");
        else UI.toast("لم يُسمح بالتنبيهات — يرجى تفعيلها من إعدادات المتصفح", "warn");
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
    test() { this.show("✅ تم تفعيل التنبيهات", { body: "سيصلك إشعار مع كل طلب جديد، وإشعار مميز للبلاغات الطارئة.", tag: "test", icon: "assets/img/icons/police-192.png", badge: "assets/img/icons/badge-96.png" }); },
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
      if (tc) { if (sos) { tc.content = "#c53030"; tc.dataset.alert = "1"; } else { delete tc.dataset.alert; tc.content = document.documentElement.dataset.theme === "dark" ? "#031a10" : "#ffffff"; } }
    }
  };

  /* ---------- التنقل ---------- */
  function show(v) {
    view = v;
    document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.view === v));
    ["dash", "reqs", "map", "reports", "verify"].forEach(x => $("#v-" + x).hidden = x !== v);
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
    if (view === "reports") renderReports();
    if (view === "map" && bigMap) renderMap();
    const nr = needReport().length; $("#repCnt").textContent = nr; $("#repCnt").classList.toggle("show", nr > 0);
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
    const reports = L.filter(r => r.report).length;
    const needRep = L.filter(r => !r.report && ["completed", "inprogress"].includes(r.status) && ["security", "emergency"].includes(r.category)).length;
    const k = (ic, l, v, s, bar, hl) => `<div class="card kpi ${hl ? "hl" : ""}"><div class="l">${UI.ic(ic)} ${l}</div><div class="v">${v}</div><div class="s">${s}</div>${bar != null ? `<div class="bar"><i style="width:${bar}%"></i></div>` : ""}</div>`;
    $("#kpis").innerHTML =
      k("list", "إجمالي الطلبات", L.length, `${open.length} مفتوح · ${done.length} مكتمل`, null, true) +
      k("clock", "الالتزام بمهلة الإنجاز", `${slaPct}<small>%</small>`, "المستهدف 95%", slaPct) +
      k("report", "تقارير التنفيذ", `${reports}<small>/ ${needRep + reports}</small>`, needRep ? `${needRep} مهمة بانتظار التقرير` : "جميع المهام موثقة بتقارير", (needRep + reports) ? Math.round(reports / (needRep + reports) * 100) : 0) +
      k("star", "رضا المتعاملين", `${satPct}<small>%</small>`, `${rated.length} تقييم`, satPct) +
      k("bell", "طلبات بانتظار الإجراء", L.filter(r => r.status === "new").length, `${L.filter(r => r.unit === "coord").length} بانتظار توزيع المنسق الرئيسي`) +
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
  Object.entries(UNITS).forEach(([id, u]) => $("#fUnit").insertAdjacentHTML("beforeend", `<option value="${id}">${u.ar}</option>`));
  ["#q", "#fStatus", "#fCat", "#fUnit", "#fOpen"].forEach(s => $(s).addEventListener("input", renderRows));

  function slaTag(r) {
    const s = slaInfo(r);
    if (s.done) return `<span class="sla-tag done">${r.status === "completed" ? (s.late ? "أُنجز متأخراً" : "أُنجز ضمن المهلة") : "—"}</span>`;
    const cls = s.late ? "late" : s.left < r.slaHours * HOUR * 0.25 ? "warn" : "ok";
    return `<span class="sla-tag ${cls}">${s.late ? "متأخر " + fmtDur(-s.left) : fmtDur(s.left)}</span>`;
  }
  function renderRows() {
    const q = $("#q").value.trim().toLowerCase(), st = $("#fStatus").value, cat = $("#fCat").value, un = $("#fUnit").value, onlyOpen = $("#fOpen").checked;
    const L = all.filter(r => (!st || r.status === st) && (!cat || r.category === cat) && (!un || r.unit === un) && (!onlyOpen || !["completed", "rejected"].includes(r.status))
      && (!q || (r.ref + r.missionName + svc(r.serviceId).ar).toLowerCase().includes(q)));
    $("#rows").innerHTML = L.map(r => `<tr class="row ${r.urgent && !["completed", "rejected"].includes(r.status) ? "urgent" : ""}" data-id="${r.id}">
      <td class="num" dir="ltr" style="text-align:start">${r.status === "new" ? '<span class="new-dot"></span>' : ""}${esc(r.ref)}</td>
      <td>${esc(r.missionName)}</td>
      <td>${r.urgent ? `<span class="chip red">${UI.ic("alert")} طارئ</span> ` : ""}${esc(svc(r.serviceId).ar)}</td>
      <td class="muted">${r.unit === "coord" ? `<span class="src-tag">${UI.ic("route")} بانتظار التوزيع</span>` : esc((UNITS[r.unit] || {}).ar || "")}</td>
      <td class="num">${fmtDate(r.createdAt)}</td>
      <td>${slaTag(r)}</td>
      <td>${UI.statusBadge(r.status)}</td></tr>`).join("") || `<tr><td colspan="7" class="empty">لا توجد طلبات مطابقة.</td></tr>`;
    $("#rows").querySelectorAll("tr.row").forEach(tr => tr.onclick = () => openDetail(tr.dataset.id));
  }

  /* ---------- تفاصيل الطلب والإجراءات ---------- */
  let miniMap = null;
  function openModal(html) { if (miniMap) { miniMap.destroy(); miniMap = null; } $("#modal").innerHTML = html; $("#modal").classList.add("open"); $("#ov").classList.add("open"); $("#modal").querySelectorAll("[data-close]").forEach(b => b.onclick = closeModal); }
  function closeModal() { $("#modal").classList.remove("open"); $("#ov").classList.remove("open"); openId = null; repOpen = false; if (miniMap) { miniMap.destroy(); miniMap = null; } }
  $("#ov").onclick = closeModal;
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
  let repOpen = false;

  const WHERE = { cons: "مقر القنصلية", res: "منزل القنصل", other: "موقع آخر" };
  const canReport = r => ["inprogress", "completed"].includes(r.status);

  function openDetail(id, refresh) {
    const r = all.find(x => x.id === id); if (!r) return;
    if (refresh && repOpen) return;                // لا نعيد الرسم أثناء تعبئة التقرير
    const keepScroll = refresh ? $("#modal").scrollTop : 0;
    openId = id;
    const s = svc(r.serviceId), m = MISSIONS[r.missionId] || {};
    const rows = s.fields.filter(f => f.type !== "map").map(f => `<dt>${esc(f.ar.replace(/\s*\(.*\)$/, ""))}</dt><dd>${esc(r.fields[f.k] || "—")}</dd>`).join("")
      + (r.urgent ? `<dt>نوع البلاغ</dt><dd>${esc(r.fields.type)}</dd><dt>مكان البلاغ</dt><dd>${esc((r.location && r.location.label) || WHERE[r.fields.where] || "—")}</dd><dt>الوصف</dt><dd>${esc(r.fields.desc || "—")}</dd>` : "")
      + (r.attachments && r.attachments.length ? `<dt>المرفقات</dt><dd>${r.attachments.map(esc).join("\n")}</dd>` : "");
    const hist = r.history.slice().reverse().map(h => `<li style="--c:${STATUSES[h.status].color}"><b>${STATUSES[h.status].ar}</b>${h.note ? ` — ${esc(h.note)}` : ""}<div class="t">${fmtDate(h.at)} · ${esc(h.by)}</div></li>`).join("");
    const notes = (r.notes || []).map(n => `<li style="--c:#94a3b8"><b>ملاحظة داخلية</b> — ${esc(n.text)}<div class="t">${fmtDate(n.at)} · ${esc(n.by)}</div></li>`).join("");
    const hasMap = r.location && r.location.lat != null;
    const photo = (r.photos || [])[0];

    // الإجراءات المتاحة حسب الحالة
    let acts = "";
    if (r.unit === "coord") acts = "";
    else if (r.urgent) {
      if (r.status === "new") acts = `<button class="btn btn-r" data-go="inprogress">${UI.ic("alert")} مباشرة البلاغ</button>`;
      else if (r.status === "inprogress") acts = `<button class="btn btn-p" data-go="completed">${UI.ic("check")} إغلاق البلاغ</button>`;
    } else {
      if (r.status === "new") acts = `<button class="btn btn-p" data-go="review">${UI.ic("check")} استلام الطلب</button>`;
      if (r.status === "review") acts = `<button class="btn btn-p" data-go="approved">${UI.ic("check")} اعتماد${s.permit ? " وإصدار التصريح" : ""}</button><button class="btn btn-o" id="rejBtn" style="color:var(--red)">${UI.ic("x")} اعتذار</button>`;
      if (r.status === "approved") acts = `<button class="btn btn-p" data-go="inprogress">${UI.ic("send")} بدء التنفيذ</button>`;
      if (r.status === "inprogress") acts = `<button class="btn btn-p" data-go="completed">${UI.ic("check")} إكمال الطلب</button>`;
    }
    const closed = ["completed", "rejected"].includes(r.status);
    const si = slaInfo(r);
    const sugg = r.suggestedUnit || unitFor(s);
    const unitOpts = sel => Object.entries(UNITS).filter(([k]) => k !== "coord").map(([k, u]) => `<option value="${k}" ${k === sel ? "selected" : ""}>${u.ar}${k === sugg ? " (مقترح حسب الاختصاص)" : ""}</option>`).join("");

    const rep = r.report;
    const repHtml = rep ? `
      <div class="report-card"><div class="rh"><b>${UI.ic("report")} تقرير التنفيذ</b><span style="display:flex;gap:6px">
        <button class="btn btn-gold btn-sm" id="repPrint">${UI.ic("download")} تحميل التقرير</button><button class="btn btn-sm btn-o" style="background:#fff" id="repEdit">تعديل</button></span></div>
        <div class="rb">
          <div class="rep-grid"><div><span class="k">تاريخ التنفيذ</span><b>${esc(rep.date || "—")}</b></div><div><span class="k">الوقت</span><b class="num">${esc(rep.tfrom || "")} — ${esc(rep.tto || "")}</b></div>
            <div><span class="k">عدد الأفراد</span><b class="num">${esc(rep.members || "—")}</b></div><div><span class="k">عدد الدوريات</span><b class="num">${esc(rep.patrols || "—")}</b></div></div>
          <span class="k">قائد المهمة</span><p>${esc(rep.leader || "—")}</p>
          <span class="k">ملخص التنفيذ</span><p>${esc(rep.summary || "—")}</p>
          ${rep.remarks ? `<span class="k">الملاحظات</span><p>${esc(rep.remarks)}</p>` : ""}
          ${rep.recs ? `<span class="k">التوصيات</span><p>${esc(rep.recs)}</p>` : ""}
          ${rep.photos && rep.photos.length ? `<div class="gallery">${rep.photos.map(p => `<img src="${p}" alt="">`).join("")}</div>` : ""}
          <div class="k" style="margin-top:8px">أعدّه: ${esc(rep.by)} · ${fmtDate(rep.at)}</div>
        </div></div>` : (canReport(r) ? `<div class="box" style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <span>${UI.ic("report")} لم يُرفع تقرير التنفيذ لهذه المهمة بعد.</span><button class="btn btn-gold btn-sm" id="repNew">${UI.ic("report")} تعبئة تقرير التنفيذ</button></div>` : "");

    openModal(`
      <div class="modal-h ${r.urgent ? "sos" : ""}"><h3>${UI.ic(CATEGORIES[s.cat].icon)}<span>${esc(s.ar)}<span class="sub">${esc(r.missionName)} · ${esc(CATEGORIES[s.cat].ar)}</span></span></h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <div class="modal-b">
        <div class="det-top"><div><div class="muted" style="font-size:12px">رقم الطلب</div><div class="ref">${esc(r.ref)}</div>
          <span class="src-tag ${r.source === "direct" ? "direct" : ""}">${UI.ic(r.source === "direct" ? "alert" : "route")} ${esc((SOURCES[r.source] || SOURCES.mofa).ar)}</span></div>
          <div style="display:flex;gap:8px;align-items:center">${slaTag(r)} ${UI.statusBadge(r.status)}</div></div>
        ${hasMap || photo ? `<div class="media2" ${!photo && !r.urgent ? 'style="grid-template-columns:1fr"' : ""}>
          ${hasMap ? `<div class="mini-map" id="miniMap"></div>` : ""}
          ${photo || r.urgent ? `<div class="photo">${photo ? `<img src="${photo}" alt="${r.urgent ? "صورة البلاغ" : "صورة مرفقة بالطلب"}" id="sosPhoto">${r.photos.length > 1 ? `<div class="more gallery">${r.photos.slice(1).map(x => `<img src="${x}" alt="">`).join("")}</div>` : ""}` : `<div class="none">${UI.ic("camera")}لم تُرفق صورة مع البلاغ</div>`}</div>` : ""}
        </div>` : ""}
        ${r.unit === "coord" ? `<div class="box route-box"><h4>${UI.ic("route")} توزيع الطلب — المنسق الرئيسي</h4>
          <p class="muted" style="margin:0 0 10px;font-size:13px">ورد هذا الطلب من منصة وزارة الخارجية. اختر الجهة المختصة لتوجيهه إليها.</p>
          <div class="act-row" style="margin:0"><select class="inp" id="routeSel">${unitOpts(sugg)}</select><button class="btn btn-p btn-sm" id="routeBtn">${UI.ic("send")} توزيع</button></div></div>` : ""}
        <div class="cols">
          <div class="box">
            <h4>${UI.ic("list")} بيانات الطلب</h4>
            <dl class="kv">
              <dt>البعثة</dt><dd>${esc(r.missionName)}</dd>
              <dt>القنصل العام</dt><dd>${esc(m.consul || "—")}</dd>
              <dt>ضابط الاتصال</dt><dd>${esc(m.officer || "—")} · <span class="num" dir="ltr">${esc(m.phone || "")}</span></dd>
              <dt>تاريخ التقديم</dt><dd>${fmtDate(r.createdAt)}</dd>
              <dt>المهلة</dt><dd>${r.slaHours < 1 ? Math.round(r.slaHours * 60) + " دقيقة" : r.slaHours + " ساعة"} (حتى ${fmtDate(si.due)})</dd>
              <dt>الجهة المختصة</dt><dd>${esc((UNITS[r.unit] || {}).ar || "")}</dd>
              ${rows}
              ${r.permitCode && r.status !== "rejected" ? `<dt>رمز التصريح</dt><dd class="num" dir="ltr" style="text-align:start;letter-spacing:.1em">${esc(r.permitCode)}</dd>` : ""}
              ${r.rejectReason ? `<dt>سبب الاعتذار</dt><dd style="color:var(--red)">${esc(r.rejectReason)}</dd>` : ""}
              ${r.rating ? `<dt>تقييم البعثة</dt><dd style="color:var(--gold)">${"★".repeat(r.rating)}<span style="opacity:.25">${"★".repeat(5 - r.rating)}</span> ${esc(r.ratingNote || "")}</dd>` : ""}
            </dl>
          </div>
          <div class="box">
            <h4>${UI.ic("clock")} سجل الطلب</h4>
            <ul class="hist">${notes}${hist}</ul>
          </div>
        </div>
        ${!closed && r.unit !== "coord" ? `<div class="box act-box"><h4>${UI.ic("check")} الإجراء</h4>
          <div class="actions">${acts}</div>
          <div class="act-row" id="rejRow" hidden><input class="inp" id="rejReason" placeholder="سبب الاعتذار (يظهر للبعثة)"><button class="btn btn-r btn-sm" id="rejGo">تأكيد الاعتذار</button></div>
          <div class="act-row"><select class="inp" id="unitSel">${unitOpts(r.unit)}</select><button class="btn btn-o btn-sm" id="fwdBtn">تحويل</button></div>
          <div class="act-row"><input class="inp" id="noteInp" placeholder="ملاحظة داخلية (لا تظهر للبعثة)"><button class="btn btn-o btn-sm" id="noteBtn">إضافة</button></div>
        </div>` : ""}
        <div id="repZone">${repHtml}</div>
      </div>`);
    $("#modal").scrollTop = keepScroll;
    UI.bindGallery($("#modal"));
    const sp = $("#sosPhoto"); if (sp) sp.onclick = () => { const lb = document.createElement("div"); lb.className = "lightbox"; lb.innerHTML = `<img src="${sp.src}">`; lb.onclick = () => lb.remove(); document.body.appendChild(lb); };

    if (hasMap) {
      const host = $("#miniMap");
      UI.emap(host, [r.location.lat, r.location.lng], 16).then(mp => {
        if (!document.body.contains(host)) { mp.destroy(); return; }
        if (miniMap) miniMap.destroy();
        miniMap = mp;
        if (r.urgent && !["completed", "rejected"].includes(r.status)) mp.point(r.location.lat, r.location.lng, { kind: "sos", size: 30, pulse: true });
        else mp.marker(r.location.lat, r.location.lng, { kind: r.urgent ? "sos" : r.status === "completed" ? "done" : "req", size: 30 });
      }).catch(() => { host.innerHTML = '<div class="empty">تتطلب الخارطة اتصالاً بالإنترنت.</div>'; });
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
    const rg = $("#rejGo"); if (rg) rg.onclick = () => { const why = $("#rejReason").value.trim(); if (!why) { UI.toast("يرجى كتابة سبب الاعتذار", "warn"); return; } go("rejected", { rejectReason: why }, why); };
    const routeBtn = $("#routeBtn"); if (routeBtn) routeBtn.onclick = async () => {
      const u = $("#routeSel").value, now = Date.now();
      await Store.update(r.id, { unit: u, routedAt: now, updatedAt: now, history: r.history.concat([{ status: "new", at: now, by: officer + " (المنسق الرئيسي)", note: "وُجِّه إلى " + UNITS[u].ar }]) });
      UI.toast("تم توزيع الطلب على " + UNITS[u].ar);
    };
    const fb = $("#fwdBtn"); if (fb) fb.onclick = async () => {
      const u = $("#unitSel").value; if (u === r.unit) return;
      await Store.update(r.id, { unit: u, updatedAt: Date.now(), notes: (r.notes || []).concat([{ text: "حُوِّل إلى " + UNITS[u].ar, at: Date.now(), by: officer }]) });
      UI.toast("تم تحويل الطلب إلى " + UNITS[u].ar);
    };
    const nb = $("#noteBtn"); if (nb) nb.onclick = async () => {
      const tx = $("#noteInp").value.trim(); if (!tx) return;
      await Store.update(r.id, { notes: (r.notes || []).concat([{ text: tx, at: Date.now(), by: officer }]) });
    };
    const rn = $("#repNew") || $("#repEdit"); if (rn) rn.onclick = () => reportForm(r);
    const rp = $("#repPrint"); if (rp) rp.onclick = () => printReport(r);
  }

  /* ---------- تقرير التنفيذ ---------- */
  function reportForm(r) {
    repOpen = true;
    const p = r.report || {}, photos = (p.photos || []).slice();
    const today = new Date().toISOString().slice(0, 10);
    const thumbs = () => photos.map((x, i) => `<span style="position:relative"><img class="thumb" src="${x}"><button type="button" class="x-btn" data-rm="${i}" style="position:absolute;top:-8px;inset-inline-end:-8px;width:22px;height:22px">${UI.ic("x")}</button></span>`).join("");
    $("#repZone").innerHTML = `
      <form class="box" id="repForm" style="margin-top:14px;border-color:var(--gold)"><h4>${UI.ic("report")} تقرير التنفيذ</h4>
        <div class="grid2">
          <div class="field"><label>تاريخ التنفيذ</label><input type="date" name="date" value="${esc(p.date || r.fields.date || today)}" required></div>
          <div class="field"><label>قائد المهمة</label><input name="leader" value="${esc(p.leader || officer)}" required></div>
          <div class="field"><label>وقت البدء</label><input type="time" name="tfrom" value="${esc(p.tfrom || "")}"></div>
          <div class="field"><label>وقت الانتهاء</label><input type="time" name="tto" value="${esc(p.tto || "")}"></div>
          <div class="field"><label>عدد الأفراد المشاركين</label><input type="number" min="0" name="members" value="${esc(p.members || "")}"></div>
          <div class="field"><label>عدد الدوريات</label><input type="number" min="0" name="patrols" value="${esc(p.patrols || "")}"></div>
          <div class="field full"><label>ملخص التنفيذ <span class="rq">*</span></label><textarea name="summary" required placeholder="وصف موجز لما نُفِّذ ونتائج المهمة">${esc(p.summary || "")}</textarea></div>
          <div class="field full"><label>الملاحظات</label><textarea name="remarks">${esc(p.remarks || "")}</textarea></div>
          <div class="field full"><label>التوصيات</label><textarea name="recs">${esc(p.recs || "")}</textarea></div>
          <div class="field full"><label>صور المهمة (حتى 4 صور)</label>
            <div class="ph-pick"><label class="btn btn-o btn-sm">${UI.ic("camera")} إضافة صور<input type="file" id="repPh" accept="image/*" multiple></label><span id="repThumbs" class="ph-pick">${thumbs()}</span></div></div>
        </div>
        <div class="actions" style="margin-top:12px;justify-content:flex-end"><button type="button" class="btn btn-o" id="repCancel">إلغاء</button><button class="btn btn-p">${UI.ic("check")} حفظ التقرير</button></div>
      </form>`;
    const redraw = () => { $("#repThumbs").innerHTML = thumbs(); $("#repThumbs").querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { photos.splice(+b.dataset.rm, 1); redraw(); }); };
    redraw();
    $("#repForm").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#repPh").onchange = async e => {
      for (const f of [...e.target.files]) { if (photos.length >= 4) break; try { photos.push(await UI.compressImage(f, 900, 0.55)); } catch (err) {} }
      redraw();
    };
    $("#repCancel").onclick = () => { repOpen = false; openDetail(r.id); };
    $("#repForm").onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target), rep = { photos, by: officer, at: Date.now() };
      ["date", "leader", "tfrom", "tto", "members", "patrols", "summary", "remarks", "recs"].forEach(k => rep[k] = (fd.get(k) || "").toString().trim());
      try {
        await Store.update(r.id, { report: rep, updatedAt: Date.now(), notes: (r.notes || []).concat([{ text: "رُفع تقرير التنفيذ", at: Date.now(), by: officer }]) });
        repOpen = false; UI.toast("تم حفظ تقرير التنفيذ");
        setTimeout(() => openDetail(r.id), 150);
      } catch (err) { UI.toast("تعذّر الحفظ: " + err.message, "err"); }
    };
  }

  // تقرير قابل للتحميل بالهوية المؤسسية (طباعة / حفظ PDF)
  const toData = url => fetch(url).then(x => x.blob()).then(b => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); })).catch(() => url);
  async function printReport(r) {
    const w = window.open("", "_blank");
    if (!w) { UI.toast("يرجى السماح بالنوافذ المنبثقة لتحميل التقرير", "warn"); return; }
    w.document.write('<p style="font-family:sans-serif;text-align:center;margin-top:40px">جارٍ إعداد التقرير…</p>');
    const rep = r.report, s = svc(r.serviceId), m = MISSIONS[r.missionId] || {};
    const dir = location.href.replace(/[^/]*$/, "") + "assets/img/";
    const [lDp, lAcis, lGov] = await Promise.all(["logo-dubai-police.png", "logo-acis.png", "logo-gov-dubai.png"].map(n => toData(dir + n)));
    const row = (k, v) => v ? `<tr><th>${k}</th><td>${esc(v)}</td></tr>` : "";
    const fields = s.fields.filter(f => f.type !== "map").map(f => row(f.ar.replace(/\s*\(.*\)$/, ""), r.fields[f.k])).join("")
      + (r.urgent ? row("نوع البلاغ", r.fields.type) + row("مكان البلاغ", r.location && r.location.label) + row("وصف البلاغ", r.fields.desc) : "");
    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير تنفيذ — ${esc(r.ref)}</title>
<style>
@font-face{font-family:B;font-weight:400;src:local("29LT Bukra Regular"),local("29LT Bukra")}@font-face{font-family:B;font-weight:700;src:local("29LT Bukra Bold")}
@page{size:A4;margin:14mm 12mm 18mm}*{box-sizing:border-box}body{font-family:B,"Dubai","Segoe UI",Tahoma,sans-serif;color:#1d2a24;margin:0;padding-bottom:34px;font-size:12.5px;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact}.ph img,.txt,table{break-inside:avoid}
.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #00492c;padding-bottom:10px}
.hd .r{display:flex;align-items:center;gap:12px}.hd img{height:48px}.hd .sep{width:1.5px;height:42px;background:#018556}
.hd .d b{display:block;font-size:14px}.hd .d small{font-size:8.5px;color:#5d6b64;font-weight:700}
h1{font-size:19px;text-align:center;color:#00492c;margin:16px 0 2px}.sub{text-align:center;color:#5d6b64;margin-bottom:14px}
.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}.meta div{border:1px solid #d6e3db;border-radius:8px;padding:6px 9px}.meta span{display:block;font-size:10.5px;color:#5d6b64}.meta b{font-size:12.5px}
h2{font-size:13.5px;color:#fff;background:#00492c;padding:5px 12px;border-radius:6px;margin:14px 0 8px}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #d6e3db;padding:6px 9px;text-align:right;vertical-align:top}th{background:#f1f7f4;width:28%;font-weight:700}
.txt{border:1px solid #d6e3db;border-radius:8px;padding:8px 11px;white-space:pre-line;margin-bottom:8px}.txt b{display:block;color:#00492c;font-size:11.5px}
.ph{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.ph img{width:100%;height:190px;object-fit:cover;border-radius:8px;border:1.5px solid #cfa562}
.sign{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:22px}.sign div{border-top:1px dashed #9db3a7;padding-top:6px;text-align:center;color:#5d6b64}
.ft{position:fixed;bottom:0;left:0;right:0;border-top:2px solid #00492c;padding-top:5px;display:flex;justify-content:space-between;font-size:10px;color:#5d6b64}
.ft b{color:#00492c}
@media screen{.ft{position:static;margin-top:22px}body{max-width:900px;margin:0 auto;padding:20px}}
</style></head><body>
<div class="hd"><div class="r"><img src="${lDp}"><span class="sep"></span><img src="${lAcis}" style="height:52px"><div class="d"><b>إدارة أمن الهيئات والمنشآت الحيوية</b><small>AUTHORITIES &amp; CRITICAL INFRASTRUCTURE SECURITY</small></div></div><img src="${lGov}"></div>
<h1>تقرير تنفيذ مهمة — ${esc(s.ar)}</h1><div class="sub">${esc(r.missionName)}</div>
<div class="meta"><div><span>رقم الطلب</span><b dir="ltr">${esc(r.ref)}</b></div><div><span>تاريخ التنفيذ</span><b>${esc(rep.date || "—")}</b></div><div><span>الوقت</span><b>${esc(rep.tfrom || "")} — ${esc(rep.tto || "")}</b></div><div><span>الجهة المختصة</span><b>${esc((UNITS[r.unit] || {}).ar || "")}</b></div></div>
<h2>بيانات الطلب</h2><table>${row("البعثة", r.missionName)}${row("القنصل العام", m.consul)}${row("ضابط الاتصال", (m.officer || "") + " — " + (m.phone || ""))}${row("مصدر الطلب", (SOURCES[r.source] || SOURCES.mofa).ar)}${row("تاريخ التقديم", fmtDate(r.createdAt))}${fields}</table>
<h2>تفاصيل التنفيذ</h2><table>${row("قائد المهمة", rep.leader)}${row("عدد الأفراد المشاركين", rep.members)}${row("عدد الدوريات", rep.patrols)}${row("حالة الطلب", STATUSES[r.status].ar)}</table>
<div class="txt" style="margin-top:8px"><b>ملخص التنفيذ</b>${esc(rep.summary || "—")}</div>
${rep.remarks ? `<div class="txt"><b>الملاحظات</b>${esc(rep.remarks)}</div>` : ""}${rep.recs ? `<div class="txt"><b>التوصيات</b>${esc(rep.recs)}</div>` : ""}
${rep.photos && rep.photos.length ? `<h2>صور المهمة</h2><div class="ph">${rep.photos.map(p => `<img src="${p}">`).join("")}</div>` : ""}
<div class="sign"><div>أعدّه: ${esc(rep.by)}<br>${fmtDate(rep.at)}</div><div>اعتماد رئيس القسم</div></div>
<div class="ft"><span>القيادة العامة لشرطة دبي — الإدارة العامة لأمن الهيئات والمنشآت والطوارئ</span><b>حراسة | تأمين | استجابة</b></div>
<script>window.onload=()=>setTimeout(()=>print(),600)<\/script></body></html>`;
    w.document.open(); w.document.write(html); w.document.close();
  }

  /* ---------- الخارطة ---------- */
  let bigMapP = null, sitesSig = "";
  const TYPE_AR = { consulate: "قنصلية", res: "منزل قنصل" };
  const hasXY = st => typeof st.lat === "number" && typeof st.lng === "number" && !isNaN(st.lat) && !isNaN(st.lng);
  const inDubai = (lat, lng) => lat > 24.6 && lat < 25.45 && lng > 54.85 && lng < 56.25;
  const normName = x => String(x || "").replace(/[ً-ْ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, " ").trim();
  const countryAr = code => UI.countryName(code) || code;
  let FLAG_CODES = null;
  const flagCodes = async () => FLAG_CODES || (FLAG_CODES = await fetch("assets/img/flags/codes.json").then(r => r.json()).catch(() => []));

  async function renderMap() {
    const placed = sites.filter(hasXY).length, un = sites.length - placed;
    $("#unplacedBtn").hidden = !un; $("#unplacedBtn").innerHTML = `${UI.ic("pin")} مواقع غير محددة <b class="num">(${un})</b>`;
    $("#sitesNote").textContent = `عدد المواقع على الخارطة: ${placed} من ${sites.length} · تتجمع الأعلام المتقاربة عند الابتعاد، وتظهر منفردة عند التقريب على مستوى دبي.`;
    if (!bigMap) {
      try { bigMap = await (bigMapP = bigMapP || UI.emap("bigMap", [25.2, 55.27], 11)); }
      catch (e) { bigMapP = null; $("#bigMap").innerHTML = '<div class="empty">تتطلب الخارطة اتصالاً بالإنترنت.</div>'; return; }
    }
    const sig = JSON.stringify(sites) + siteMode;
    if (sig !== sitesSig) { sitesSig = sig; await bigMap.sites(sites, { mode: siteMode, onClick: sitePopup }); }
    bigMap.clear();
    // ترتيب الرسم: المكتمل أولاً ثم الجاري ثم الطارئ، والأحدث فوق الأقدم — وتظهر كشارة على زاوية العلم
    const rank = r => r.status === "completed" ? 0 : r.urgent ? 2 : 1;
    all.filter(r => r.location && r.location.lat != null && r.status !== "rejected")
      .sort((x, y) => rank(x) - rank(y) || (x.createdAt || 0) - (y.createdAt || 0)).forEach(r => {
      const open = r.status !== "completed", sos = r.urgent && open;
      bigMap.point(r.location.lat, r.location.lng, { kind: sos ? "sos" : open ? "req" : "done", size: sos ? 28 : 22, dx: 13, dy: 12, pulse: sos, onClick: () => openDetail(r.id) });
    });
    const flagLg = `<img src="${UI.flagSrc("ae")}" alt="" style="width:24px;height:18px;border:1.5px solid #fff;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,.4)">`;
    $("#legend").innerHTML = `<span>${flagLg}هيئة دبلوماسية</span><span><i style="background:#A8821F;width:14px;height:14px;border:2px solid #fff"></i>منزل قنصل</span><span><i style="background:#0A5C3C;width:18px;height:18px;border:2px solid #fff;box-shadow:0 0 0 1px #0A5C3C"></i>مجموعة مواقع</span>`
      + ["req", "done", "sos"].map(k => `<span>${UI.tileSvg(k, 20)}${UI.MAPK[k].l}</span>`).join("");
  }

  // أدوات الخارطة
  document.querySelectorAll("#siteMode button").forEach(b => b.onclick = () => {
    siteMode = b.dataset.m; document.querySelectorAll("#siteMode button").forEach(x => x.classList.toggle("on", x === b)); renderMap();
  });
  $("#addSiteBtn").onclick = () => siteForm();
  $("#unplacedBtn").onclick = () => unplacedList();
  $("#expBtn").onclick = () => exportSites();
  $("#impBtn").onclick = () => { $("#impFile").value = ""; $("#impFile").click(); };
  $("#impFile").onchange = e => { const f = e.target.files[0]; if (f) importSites(f); };

  function sitePopup(st) {
    const tip = bigMap.showTip(`<button class="tip-x" data-tx>${UI.ic("x")}</button>
      <div class="tip-h"><img src="${UI.flagSrc(st.code)}" alt=""><div><b>${esc(st.name)}</b><small>${TYPE_AR[st.type] || "قنصلية"} · ${esc(countryAr(st.code))}</small></div></div>
      <span>${UI.ic("pin")} ${esc(st.area || "—")}</span>${st.address ? `<span>${esc(st.address)}</span>` : ""}
      <span class="num" dir="ltr" style="text-align:end">${st.lat.toFixed(6)}, ${st.lng.toFixed(6)}</span>
      <div class="tip-a"><a class="btn btn-gold btn-sm" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${st.lat},${st.lng}">${UI.ic("pin")} فتح في خرائط جوجل</a>
        <button class="btn btn-o btn-sm" data-te>تعديل</button><button class="btn btn-o btn-sm" data-td style="color:var(--red)">${UI.ic("trash")}</button></div>`, st.lat, st.lng);
    tip.classList.add("site");
    tip.querySelector("[data-tx]").onclick = () => bigMap.hideTip();
    tip.querySelector("[data-te]").onclick = () => { bigMap.hideTip(); siteForm(st); };
    tip.querySelector("[data-td]").onclick = () => { bigMap.hideTip(); deleteSite(st); };
  }

  async function saveSites(list) { try { await Store.saveSites(list); } catch (e) { UI.toast("تعذر الحفظ: " + e.message, "err"); throw e; } }
  function deleteSite(st) {
    confirmBox("حذف موقع", `سيُحذف «${esc(st.name)}» من الكشف والخارطة.`, "حذف", async () => { await saveSites(sites.filter(x => x.id !== st.id)); UI.toast("تم حذف الموقع"); }, true);
  }

  async function siteForm(st) {
    const edit = !!st; st = st || { type: "consulate", name: "", code: "", area: "", address: "", lat: null, lng: null };
    const codes = await flagCodes();
    const opts = codes.map(c => [c, UI.countryName(c)]).filter(x => x[1]).sort((a, b) => a[1].localeCompare(b[1], "ar"));
    openModal(`<div class="modal-h"><h3>${UI.ic("pin")}<span>${edit ? "تعديل موقع" : "إضافة موقع"}</span></h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <div class="modal-b"><div class="grid2">
        <div class="field"><label>النوع</label><div class="seg wide" id="sfType"><button data-t="consulate" class="${st.type !== "res" ? "on" : ""}">قنصلية</button><button data-t="res" class="${st.type === "res" ? "on" : ""}">منزل قنصل</button></div></div>
        <div class="field"><label>الدولة</label><div class="sf-cty"><img id="sfFlag" alt=""><select id="sfCode"><option value="">— اختر الدولة —</option>${opts.map(([c, n]) => `<option value="${c.toUpperCase()}" ${c.toUpperCase() === String(st.code).toUpperCase() ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div></div>
        <div class="field full"><label>الاسم <span class="rq">*</span></label><input id="sfName" value="${esc(st.name)}" placeholder="مثال: القنصلية العامة لـ…"></div>
        <div class="field"><label>المنطقة</label><input id="sfArea" value="${esc(st.area || "")}"></div>
        <div class="field"><label>العنوان</label><input id="sfAddr" value="${esc(st.address || "")}"></div>
        <div class="field"><label>خط العرض</label><input id="sfLat" dir="ltr" inputmode="decimal" value="${hasXY(st) ? st.lat : ""}" placeholder="25.2..."></div>
        <div class="field"><label>خط الطول</label><input id="sfLng" dir="ltr" inputmode="decimal" value="${hasXY(st) ? st.lng : ""}" placeholder="55.3..."></div>
        <div class="field full"><label>أو اضغط على الخارطة لتحديد الموقع</label><div id="sfMap" class="mapbox" style="height:260px"></div></div>
      </div></div>
      <div class="modal-f"><button class="btn btn-o" data-close>إلغاء</button><button class="btn btn-p" id="sfSave">${UI.ic("check")} حفظ</button></div>`);
    let type = st.type === "res" ? "res" : "consulate";
    document.querySelectorAll("#sfType button").forEach(b => b.onclick = () => { type = b.dataset.t; document.querySelectorAll("#sfType button").forEach(x => x.classList.toggle("on", x === b)); });
    const flag = () => { const c = $("#sfCode").value; $("#sfFlag").src = c ? UI.flagSrc(c) : ""; $("#sfFlag").style.visibility = c ? "visible" : "hidden"; };
    $("#sfCode").onchange = flag; flag();
    let mm = null;
    const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
    UI.emap("sfMap", hasXY(st) ? [st.lat, st.lng] : [25.2, 55.27], hasXY(st) ? 15 : 10).then(m => {
      mm = m; miniMap = m;
      if (hasXY(st)) m.marker(st.lat, st.lng, { draggable: true });
      m.onPick((la, ln) => { $("#sfLat").value = la.toFixed(6); $("#sfLng").value = ln.toFixed(6); });
    }).catch(() => { $("#sfMap").innerHTML = '<div class="empty">تعذر تحميل الخارطة — أدخل الإحداثيات يدوياً.</div>'; });
    const moveMk = () => { const la = num($("#sfLat").value), ln = num($("#sfLng").value); if (mm && la != null && ln != null) { mm.marker(la, ln, { draggable: true }); mm.goTo(la, ln, 15); } };
    $("#sfLat").onchange = moveMk; $("#sfLng").onchange = moveMk;
    $("#sfSave").onclick = async () => {
      const name = $("#sfName").value.trim(), code = $("#sfCode").value, la = num($("#sfLat").value), ln = num($("#sfLng").value);
      if (!name) return UI.toast("يرجى إدخال الاسم", "warn");
      if (!code) return UI.toast("يرجى اختيار الدولة", "warn");
      if ((la == null) !== (ln == null)) return UI.toast("يرجى إدخال خط العرض وخط الطول معاً", "warn");
      if (la != null && !inDubai(la, ln)) return UI.toast("الإحداثيات خارج حدود إمارة دبي", "warn");
      const rec = Object.assign({}, st, { type, name, code, area: $("#sfArea").value.trim(), address: $("#sfAddr").value.trim(), lat: la, lng: ln, updatedAt: Date.now(), updatedBy: officer });
      if (!edit) rec.id = (type === "res" ? "h-" : "s-") + code.toLowerCase() + "-" + Date.now().toString(36);
      const dup = sites.find(x => x.id !== rec.id && normName(x.name) === normName(name) && (x.type || "consulate") === type);
      if (dup) return UI.toast("يوجد موقع بالاسم نفسه في الكشف", "warn");
      $("#sfSave").disabled = true;
      try { await saveSites(edit ? sites.map(x => x.id === rec.id ? rec : x) : sites.concat(rec)); closeModal(); UI.toast(edit ? "تم حفظ التعديل" : "تمت إضافة الموقع");
        if (la != null && bigMap) bigMap.goTo(la, ln, 15.5); } catch (e) { $("#sfSave").disabled = false; }
    };
  }

  function unplacedList() {
    const L = sites.filter(x => !hasXY(x));
    openModal(`<div class="modal-h"><h3>${UI.ic("pin")}<span>مواقع غير محددة</span></h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <div class="modal-b"><p class="muted" style="margin-top:0">مواقع في الكشف بلا إحداثيات، فلا تظهر على الخارطة.</p>
      <div class="site-list">${L.map(x => `<div class="site-row"><img src="${UI.flagSrc(x.code)}" alt=""><div><b>${esc(x.name)}</b><small>${esc([x.area, x.address].filter(Boolean).join(" — ") || "—")}</small></div><button class="btn btn-o btn-sm" data-e="${x.id}">تحديد الموقع</button></div>`).join("") || '<div class="empty">لا توجد مواقع غير محددة.</div>'}</div></div>`);
    document.querySelectorAll("#modal [data-e]").forEach(b => b.onclick = () => siteForm(sites.find(x => x.id === b.dataset.e)));
  }

  /* ---------- Excel ---------- */
  let xlsxP = null;
  const loadXLSX = () => xlsxP || (xlsxP = new Promise((res, rej) => {
    if (window.XLSX) return res(window.XLSX);
    const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    sc.onload = () => res(window.XLSX); sc.onerror = () => { xlsxP = null; rej(new Error("تعذر تحميل مكتبة Excel")); }; document.head.appendChild(sc);
  }));
  const COLS = [["name", ["اسم الهيئة الدبلوماسية", "الاسم", "اسم الموقع", "اسم الهيئة"]], ["code", ["رمز الدولة", "الرمز"]], ["type", ["النوع"]],
    ["sectorMain", ["القطاع الرئيسي"]], ["sector", ["القطاع"]], ["area", ["المنطقة"]], ["address", ["العنوان"]], ["makani", ["رقم مكاني"]],
    ["lat", ["خط العرض"]], ["lng", ["خط الطول"]], ["note", ["ملاحظات"]]];

  async function exportSites() {
    try {
      const X = await loadXLSX();
      const head = ["م", "اسم الهيئة الدبلوماسية", "النوع", "رمز الدولة", "الدولة", "القطاع الرئيسي", "القطاع", "المنطقة", "العنوان", "رقم مكاني", "خط العرض", "خط الطول", "ملاحظات"];
      const rows = sites.map((x, i) => [i + 1, x.name, TYPE_AR[x.type] || "قنصلية", x.code, countryAr(x.code), x.sectorMain || "", x.sector || "", x.area || "", x.address || "", x.makani || "",
        hasXY(x) ? x.lat : "—", hasXY(x) ? x.lng : "—", x.note || ""]);
      const d = new Date(), stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const ws = X.utils.aoa_to_sheet([["كشف مواقع الهيئات الدبلوماسية بإمارة دبي"], [`إدارة أمن الهيئات والمنشآت الحيوية • الإجمالي: ${sites.length} • تاريخ التصدير: ${stamp}`], head, ...rows]);
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: head.length - 1 } }];
      ws["!cols"] = [5, 42, 12, 10, 18, 12, 10, 18, 40, 14, 12, 12, 30].map(w => ({ wch: w }));
      ws["!views"] = [{ RTL: true }];
      const wb = X.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] }; X.utils.book_append_sheet(wb, ws, "القنصليات");
      X.writeFile(wb, `كشف القنصليات ومواقعها ${stamp}.xlsx`);
    } catch (e) { UI.toast(e.message, "err"); }
  }

  async function importSites(file) {
    let X; try { X = await loadXLSX(); } catch (e) { return UI.toast(e.message, "err"); }
    const codes = new Set((await flagCodes()).map(c => c.toUpperCase()));
    const wb = X.read(await file.arrayBuffer(), { type: "array" });
    const aoa = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "", raw: true });
    const hi = aoa.findIndex(r => r.some(c => COLS[0][1].includes(String(c).trim())));
    if (hi < 0) return UI.toast("لم يُعثر على عمود الاسم في الملف (مثل «اسم الهيئة الدبلوماسية»)", "err");
    const hdr = aoa[hi].map(c => String(c).trim()), idx = {};
    COLS.forEach(([k, names]) => { const i = hdr.findIndex(h => names.includes(h)); if (i > -1) idx[k] = i; });
    if (idx.code == null || idx.lat == null || idx.lng == null) return UI.toast("الملف يجب أن يحتوي على الأعمدة: الاسم، رمز الدولة، خط العرض، خط الطول", "err");
    const num = v => { if (typeof v === "number") return v; const n = parseFloat(String(v).replace(/[^\d.\-]/g, "")); return isNaN(n) ? null : n; };
    const out = [];
    aoa.slice(hi + 1).forEach((r, k) => {
      const g = key => idx[key] != null ? r[idx[key]] : "";
      const name = String(g("name")).trim(); if (!name) return;
      const code = String(g("code")).trim().toUpperCase(), lat = num(g("lat")), lng = num(g("lng"));
      const type = /منزل/.test(String(g("type"))) ? "res" : "consulate";
      const errs = [];
      if (lat == null || lng == null) errs.push("إحداثيات ناقصة");
      else if (!inDubai(lat, lng)) errs.push("إحداثيات خارج دبي");
      if (!codes.has(code)) errs.push(code ? "رمز دولة غير معروف" : "رمز الدولة ناقص");
      const rec = { type, name, code, sectorMain: String(g("sectorMain")).trim(), sector: String(g("sector")).trim(), area: String(g("area")).trim(), address: String(g("address")).trim(), makani: String(g("makani")).trim(), lat, lng, note: String(g("note")).trim() };
      const dup = sites.find(x => normName(x.name) === normName(name) && (x.type || "consulate") === type);
      out.push({ row: hi + k + 2, rec, errs, dup, act: dup ? "update" : "add" });
    });
    const ok = out.filter(x => !x.errs.length), bad = out.filter(x => x.errs.length), dups = ok.filter(x => x.dup), news = ok.filter(x => !x.dup);
    openModal(`<div class="modal-h"><h3>${UI.ic("download")}<span>معاينة الإدراج من Excel</span></h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <div class="modal-b">
        <div class="imp-sum"><div><b class="num">${news.length}</b>موقع جديد</div><div><b class="num">${dups.length}</b>موجود مسبقاً</div><div class="${bad.length ? "bad" : ""}"><b class="num">${bad.length}</b>صفوف بها أخطاء</div></div>
        ${dups.length ? `<h4 class="imp-h">مواقع موجودة بالاسم نفسه <span class="imp-all"><button class="btn btn-o btn-sm" data-all="update">تحديث الكل</button><button class="btn btn-o btn-sm" data-all="skip">تجاوز الكل</button></span></h4>
          <div class="site-list">${dups.map((x, i) => `<div class="site-row"><img src="${UI.flagSrc(x.rec.code)}" alt=""><div><b>${esc(x.rec.name)}</b><small>صف ${x.row}</small></div>
            <div class="seg" data-d="${i}"><button data-a="update" class="on">تحديث</button><button data-a="skip">تجاوز</button></div></div>`).join("")}</div>` : ""}
        ${bad.length ? `<h4 class="imp-h">صفوف لن تُضاف</h4><div class="site-list">${bad.map(x => `<div class="site-row err"><span class="num">صف ${x.row}</span><div><b>${esc(x.rec.name)}</b><small>${x.errs.join(" · ")}</small></div></div>`).join("")}</div>` : ""}
      </div>
      <div class="modal-f"><button class="btn btn-o" data-close>إلغاء</button><button class="btn btn-p" id="impGo" ${news.length + dups.length ? "" : "disabled"}>${UI.ic("check")} تنفيذ الإدراج</button></div>`);
    const paint = () => document.querySelectorAll("#modal [data-d]").forEach(sg => sg.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.a === dups[+sg.dataset.d].act)));
    document.querySelectorAll("#modal [data-d] button").forEach(b => b.onclick = () => { dups[+b.parentNode.dataset.d].act = b.dataset.a; paint(); });
    document.querySelectorAll("#modal [data-all]").forEach(b => b.onclick = () => { dups.forEach(x => x.act = b.dataset.all); paint(); });
    $("#impGo").onclick = async () => {
      let list = sites.slice(), nAdd = 0, nUp = 0;
      news.forEach(x => { list.push(Object.assign({ id: (x.rec.type === "res" ? "h-" : "s-") + x.rec.code.toLowerCase() + "-" + Math.random().toString(36).slice(2, 8), updatedAt: Date.now(), updatedBy: officer }, x.rec)); nAdd++; });
      dups.filter(x => x.act === "update").forEach(x => { list = list.map(s0 => s0.id === x.dup.id ? Object.assign({}, s0, x.rec, { updatedAt: Date.now(), updatedBy: officer }) : s0); nUp++; });
      $("#impGo").disabled = true;
      try { await saveSites(list); closeModal(); UI.toast(`تمت إضافة ${nAdd} وتحديث ${nUp} موقع`); } catch (e) { $("#impGo").disabled = false; }
    };
  }

  /* ---------- تبويب التقارير ---------- */
  var repTab = "done";
  function needReport() { return all.filter(r => !r.report && ["completed", "inprogress"].includes(r.status) && ["security", "emergency"].includes(r.category)); }
  document.querySelectorAll("#repTabs button").forEach(b => b.onclick = () => { repTab = b.dataset.r; document.querySelectorAll("#repTabs button").forEach(x => x.classList.toggle("on", x === b)); renderReports(); });
  function renderReports() {
    if (repTab === "done") {
      const L = all.filter(r => r.report).sort((a, b) => (b.report.at || 0) - (a.report.at || 0));
      $("#repHead").innerHTML = "<tr><th>رقم الطلب</th><th>الهيئة الدبلوماسية</th><th>المهمة</th><th>تاريخ التنفيذ</th><th>قائد المهمة</th><th>أعدّه</th><th></th></tr>";
      $("#repRows").innerHTML = L.map(r => `<tr class="row" data-id="${r.id}">
        <td class="num" dir="ltr" style="text-align:start;white-space:nowrap">${esc(r.ref)}</td><td>${esc(r.missionName)}</td>
        <td>${r.urgent ? `<span class="chip red">${UI.ic("alert")} طارئ</span> ` : ""}${esc(svc(r.serviceId).ar)}</td>
        <td class="num" style="white-space:nowrap">${esc((r.report.date || "—").split("-").reverse().join("/"))}</td><td>${esc(r.report.leader || "—")}</td><td class="muted">${esc(r.report.by || "")}</td>
        <td><div style="display:flex;gap:6px;justify-content:flex-end"><button class="btn btn-o btn-sm" data-open="${r.id}">فتح</button> <button class="btn btn-gold btn-sm" data-dl="${r.id}">${UI.ic("download")} تحميل</button></div></td></tr>`).join("")
        || `<tr><td colspan="7" class="empty">لا توجد تقارير مرفوعة بعد.</td></tr>`;
    } else {
      const L = needReport().sort((a, b) => b.updatedAt - a.updatedAt);
      $("#repHead").innerHTML = "<tr><th>رقم الطلب</th><th>الهيئة الدبلوماسية</th><th>المهمة</th><th>الحالة</th><th>آخر تحديث</th><th></th></tr>";
      $("#repRows").innerHTML = L.map(r => `<tr class="row" data-id="${r.id}">
        <td class="num" dir="ltr" style="text-align:start;white-space:nowrap">${esc(r.ref)}</td><td>${esc(r.missionName)}</td>
        <td>${r.urgent ? `<span class="chip red">${UI.ic("alert")} طارئ</span> ` : ""}${esc(svc(r.serviceId).ar)}</td>
        <td>${UI.statusBadge(r.status)}</td><td class="num">${fmtDate(r.updatedAt)}</td>
        <td><button class="btn btn-gold btn-sm" data-fill="${r.id}">${UI.ic("report")} تعبئة التقرير</button></td></tr>`).join("")
        || `<tr><td colspan="6" class="empty">جميع المهام موثقة بتقارير.</td></tr>`;
    }
    $("#repRows").querySelectorAll("tr.row").forEach(tr => tr.onclick = e => {
      const id = tr.dataset.id, t = e.target.closest("button");
      if (t && t.dataset.dl) { printReport(all.find(x => x.id === id)); return; }
      openDetail(id);
      if (t && t.dataset.fill) setTimeout(() => { const b = $("#repNew"); if (b) b.click(); }, 120);
    });
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
