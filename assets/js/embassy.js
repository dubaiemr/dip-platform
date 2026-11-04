/* ============================================================
   بوابة الهيئات الدبلوماسية — تقديم الطلبات ومتابعتها
   ============================================================ */
(function () {
  "use strict";
  const { SERVICES, CATEGORIES, MISSIONS, STATUSES, FLOW, svc, fmtDate, makeRef, esc, Store, HOUR, DAY } = DIP;
  const $ = s => document.querySelector(s);

  /* ---------- الترجمة ---------- */
  const T = {
    ar: {
      portal: "بوابة الهيئات الدبلوماسية", portalTag: "المنصة الإلكترونية الموحدة",
      navHome: "الخدمات", navReq: "طلباتي",
      loginTitle: "تسجيل دخول البعثة", loginSub: "منصة موحدة لخدمات شرطة دبي الأمنية والمرورية والإدارية للهيئات الدبلوماسية.",
      mission: "البعثة الدبلوماسية", email: "البريد الإلكتروني", password: "كلمة المرور", login: "دخول",
      localHint: "تشغيل تجريبي: اختر أي بعثة وهمية من القائمة وادخل بدون كلمة مرور.",
      welcome: "أهلاً بكم في بوابة الخدمات", sos: "بلاغ طارئ", sosSub: "يصل فوراً إلى غرفة العمليات",
      catalog: "دليل الخدمات", searchSvc: "ابحث عن خدمة…", all: "الكل",
      sTotal: "إجمالي الطلبات", sOpen: "طلبات جارية", sDone: "طلبات مكتملة", sPermits: "تصاريح سارية",
      hrs: "ساعة", min: "دقيقة", within: "مدة الإنجاز", permit: "يصدر تصريح رقمي", req: "قدّم الطلب",
      myReqs: "طلباتي", noReqs: "ما فيه طلبات في هذا التصنيف.", open: "جارية", done: "مكتملة", rejected: "مرفوضة",
      newReq: "طلب جديد", autoData: "بيانات البعثة (تعبئة تلقائية)", officer: "ضابط الاتصال", phone: "الهاتف", type: "النوع",
      attach: "المرفقات", attachHint: "في التشغيل التجريبي ينحفظ اسم الملف فقط.", submit: "إرسال الطلب", cancel: "إلغاء",
      mapHint: "اضغط على الخارطة لتحديد الموقع.", required: "عبّ الحقول المطلوبة.", sent: "تم إرسال الطلب بنجاح — رقم الطلب: ",
      details: "تفاصيل الطلب", ref: "رقم الطلب", service: "الخدمة", submitted: "تاريخ التقديم", unit: "الجهة المختصة",
      status: "الحالة", history: "سجل الطلب", rejectReason: "سبب الرفض",
      permitT: "تصريح رقمي", permitNo: "رمز التصريح", permitHint: "يُبرز للدورية أو البوابة للتحقق منه.", print: "طباعة",
      rateT: "قيّم الخدمة", rateNote: "ملاحظة (اختياري)", rateSend: "إرسال التقييم", rated: "شكراً لتقييمكم", yourRating: "تقييمكم",
      emT: "بلاغ طارئ", emSub: "البلاغ يصل مباشرة لغرفة العمليات مع موقعكم.", emType: "نوع البلاغ",
      emTypes: ["تهديد أمني", "تجمهر أمام المقر", "حادث داخل المقر", "أخرى"], emDesc: "وصف مختصر", emSend: "إرسال البلاغ الآن",
      emSent: "تم إرسال البلاغ — غرفة العمليات تتابع الحالة الآن", locating: "جاري تحديد الموقع…",
      natT: "يوم وطني قريب", natTxt: (d) => `باقي ${d} يوم على اليوم الوطني لدولتكم. تبون تقدمون طلب تأمين الفعالية من الحين؟`, natBtn: "تقديم طلب تأمين فعالية",
      logout: "خروج", lateFor: "متأخر", leftFor: "متبقي على المهلة"
    },
    en: {
      portal: "Diplomatic Missions Portal", portalTag: "Unified e-Services Platform",
      navHome: "Services", navReq: "My requests",
      loginTitle: "Mission sign-in", loginSub: "One platform for Dubai Police security, traffic and administrative services to diplomatic missions.",
      mission: "Diplomatic mission", email: "Email", password: "Password", login: "Sign in",
      localHint: "Pilot mode: choose any sample mission and sign in without a password.",
      welcome: "Welcome to the services portal", sos: "Emergency", sosSub: "Goes straight to the Command Center",
      catalog: "Service catalogue", searchSvc: "Search services…", all: "All",
      sTotal: "Total requests", sOpen: "In progress", sDone: "Completed", sPermits: "Active permits",
      hrs: "hrs", min: "min", within: "Service time", permit: "Digital permit", req: "Request",
      myReqs: "My requests", noReqs: "No requests here.", open: "Open", done: "Completed", rejected: "Rejected",
      newReq: "New request", autoData: "Mission details (auto-filled)", officer: "Liaison officer", phone: "Phone", type: "Type",
      attach: "Attachments", attachHint: "Pilot mode stores the file name only.", submit: "Submit request", cancel: "Cancel",
      mapHint: "Click on the map to set the location.", required: "Please complete the required fields.", sent: "Request submitted — reference: ",
      details: "Request details", ref: "Reference", service: "Service", submitted: "Submitted", unit: "Handled by",
      status: "Status", history: "History", rejectReason: "Rejection reason",
      permitT: "Digital permit", permitNo: "Permit code", permitHint: "Show it to the patrol or gate for verification.", print: "Print",
      rateT: "Rate this service", rateNote: "Comment (optional)", rateSend: "Send rating", rated: "Thank you for your feedback", yourRating: "Your rating",
      emT: "Emergency report", emSub: "Your report and location go straight to the Command Center.", emType: "Report type",
      emTypes: ["Security threat", "Gathering outside premises", "Incident on premises", "Other"], emDesc: "Short description", emSend: "Send report now",
      emSent: "Report sent — the Command Center is following up now", locating: "Locating…",
      natT: "National day coming up", natTxt: (d) => `${d} days to your National Day. Would you like to request event security now?`, natBtn: "Request event security",
      logout: "Sign out", lateFor: "Overdue", leftFor: "Time left"
    }
  };
  let lang = "ar";
  try { lang = localStorage.getItem("dip-lang") || "ar"; } catch (e) {}
  const t = k => T[lang][k];
  const nm = o => (lang === "en" ? o.en : o.ar);

  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
    document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.dataset.t); });
    document.querySelectorAll("[data-tp]").forEach(el => { el.placeholder = t(el.dataset.tp); });
    $("#langLbl").textContent = lang === "en" ? "عربي" : "English";
    document.title = t("portal") + " | " + (lang === "en" ? "Dubai Police" : "شرطة دبي");
  }

  /* ---------- الحالة ---------- */
  let missionId = null, all = [], unsub = null, curCat = "all", reqFilter = "all", lastStatuses = {};

  /* ---------- تسجيل الدخول ---------- */
  function renderLogin() {
    const f = $("#loginForm");
    if (Store.picker) {
      f.innerHTML = `
        <div class="field"><label>${t("mission")}</label>
          <select id="lgMission">${Object.entries(MISSIONS).map(([id, m]) => `<option value="${id}">${esc(nm(m))}</option>`).join("")}</select></div>
        <button class="btn btn-p" style="width:100%">${t("login")}</button>
        <div class="hint">${t("localHint")}</div>`;
    } else {
      f.innerHTML = `
        <div class="field"><label>${t("email")}</label><input id="lgEmail" type="email" required dir="ltr"></div>
        <div class="field"><label>${t("password")}</label><input id="lgPass" type="password" required dir="ltr"></div>
        <button class="btn btn-p" style="width:100%">${t("login")}</button>`;
    }
  }
  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (Store.picker) { enter($("#lgMission").value); try { sessionStorage.setItem("dip-mission", $("#lgMission").value); } catch (e) {} return; }
    try {
      const email = $("#lgEmail").value.trim().toLowerCase();
      const mid = (window.APP_CONFIG.embassyAccounts || {})[email];
      if (!mid) { UI.toast("هذا الحساب غير مسجل كبعثة دبلوماسية في config.js", "err"); return; }
      await Store.signIn(email, $("#lgPass").value);
    } catch (err) { UI.toast("بيانات الدخول غير صحيحة", "err"); }
  });

  function enter(mid) {
    missionId = mid;
    $("#loginView").hidden = true; $("#app").hidden = false; $("#nav").hidden = false; $("#who").hidden = false;
    renderWho();
    if (unsub) unsub();
    unsub = Store.subscribe(list => {
      all = list.filter(r => r.missionId === missionId).sort((a, b) => b.createdAt - a.createdAt);
      notifyChanges();
      renderAll();
    }, missionId);
  }
  function renderWho() {
    $("#who").innerHTML = `${UI.ic("user")}<span>${esc(nm(MISSIONS[missionId]))}</span>
      <button class="act" id="logoutBtn" title="${t("logout")}">${UI.ic("logout")}</button>`;
    $("#logoutBtn").onclick = async () => { try { sessionStorage.removeItem("dip-mission"); } catch (e) {} await Store.signOut(); location.reload(); };
  }
  // تنبيه عند تغيّر حالة طلب من جهة الشرطة
  function notifyChanges() {
    const first = !Object.keys(lastStatuses).length;
    all.forEach(r => {
      if (!first && lastStatuses[r.id] && lastStatuses[r.id] !== r.status) {
        UI.toast(`${r.ref}: ${nm(STATUSES[r.status])}`);
      }
      lastStatuses[r.id] = r.status;
    });
  }

  /* ---------- العرض ---------- */
  function renderAll() { renderHome(); renderRequests(); }

  function renderHome() {
    const m = MISSIONS[missionId];
    $("#missionName").textContent = nm(m);
    $("#missionMeta").innerHTML = `
      <span>${UI.ic("user")} ${t("officer")}: ${esc(m.officer)}</span>
      <span>${UI.ic("bell")} ${t("phone")}: <span class="num" dir="ltr">${esc(m.phone)}</span></span>`;

    const open = all.filter(r => !["completed", "rejected"].includes(r.status)).length;
    const done = all.filter(r => r.status === "completed").length;
    const permits = all.filter(r => r.permitCode && r.status !== "rejected").length;
    const st = (ic, v, l) => `<div class="card stat"><div class="ico">${UI.ic(ic)}</div><div><div class="v">${v}</div><div class="l">${l}</div></div></div>`;
    $("#myStats").innerHTML = st("list", all.length, t("sTotal")) + st("clock", open, t("sOpen")) + st("check", done, t("sDone")) + st("qr", permits, t("sPermits"));

    // تذكير اليوم الوطني
    const days = daysToNatDay(m.natDay);
    $("#natDay").innerHTML = days !== null && days <= 45 ? `
      <div class="natday"><div class="ico">${UI.ic("calendar")}</div>
        <div class="txt"><b>${t("natT")}</b><div class="muted">${t("natTxt")(days)}</div></div>
        <button class="btn btn-gold" id="natBtn">${t("natBtn")}</button></div>` : "";
    const nb = $("#natBtn"); if (nb) nb.onclick = () => openForm("s2", { event: lang === "en" ? "National Day reception" : "احتفال اليوم الوطني", date: natDate(m.natDay) });

    // التصنيفات
    const cats = [["all", { ar: t("all"), en: t("all"), icon: "list" }]].concat(Object.entries(CATEGORIES).filter(([k]) => k !== "emergency"));
    $("#cats").innerHTML = cats.map(([k, c]) => `<button data-cat="${k}" class="${curCat === k ? "on" : ""}">${UI.ic(c.icon)}${esc(nm(c))}</button>`).join("");
    $("#cats").querySelectorAll("button").forEach(b => b.onclick = () => { curCat = b.dataset.cat; renderHome(); });
    renderServices();
  }
  function renderServices() {
    const q = ($("#svcSearch").value || "").trim().toLowerCase();
    const list = SERVICES.filter(s => !s.hidden && (curCat === "all" || s.cat === curCat) &&
      (!q || (s.ar + s.en + s.dAr + s.dEn).toLowerCase().includes(q)));
    $("#svcGrid").innerHTML = list.map(s => `
      <div class="card svc" data-id="${s.id}" tabindex="0">
        <div class="top"><div class="ico">${UI.ic(CATEGORIES[s.cat].icon)}</div>
          <div><div class="cat">${esc(nm(CATEGORIES[s.cat]))}</div><h3>${esc(nm(s))}</h3></div></div>
        <p>${esc(lang === "en" ? s.dEn : s.dAr)}</p>
        <div class="bot"><span>${UI.ic("clock")} ${t("within")}: <b class="num">${s.sla}</b> ${t("hrs")}</span>
          ${s.permit ? `<span>${UI.ic("qr")} ${t("permit")}</span>` : `<span class="go">${t("req")} ←</span>`}</div>
      </div>`).join("") || `<div class="empty">—</div>`;
    $("#svcGrid").querySelectorAll(".svc").forEach(c => { c.onclick = () => openForm(c.dataset.id); c.onkeydown = e => { if (e.key === "Enter") openForm(c.dataset.id); }; });
  }
  $("#svcSearch").addEventListener("input", renderServices);

  function daysToNatDay(md) {
    if (!md) return null;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    let d = new Date(`${now.getFullYear()}-${md}T00:00:00`);
    if (d < now) d = new Date(`${now.getFullYear() + 1}-${md}T00:00:00`);
    return Math.round((d - now) / DAY);
  }
  function natDate(md) { const n = new Date(); let y = n.getFullYear(); if (new Date(`${y}-${md}T00:00:00`) < n) y++; return `${y}-${md}`; }

  function stepsHtml(r) {
    if (r.status === "rejected") {
      return `<div class="steps">${["new", "review", "rejected"].map((s, i) => `<div class="step ${i < 2 ? "done" : "rej"}"><div class="dot">${UI.ic(i < 2 ? "check" : "x")}</div>${esc(nm(STATUSES[s]))}</div>`).join("")}</div>`;
    }
    const idx = FLOW.indexOf(r.status);
    return `<div class="steps">${FLOW.map((s, i) => `<div class="step ${i < idx || r.status === "completed" ? "done" : ""} ${i === idx && r.status !== "completed" ? "cur" : ""}"><div class="dot">${i < idx || r.status === "completed" ? UI.ic("check") : ""}</div>${esc(nm(STATUSES[s]))}</div>`).join("")}</div>`;
  }

  function renderRequests() {
    const fl = [["all", t("all")], ["open", t("open")], ["completed", t("done")], ["rejected", t("rejected")]];
    $("#reqFilters").innerHTML = fl.map(([k, l]) => `<button data-f="${k}" class="${reqFilter === k ? "on" : ""}">${l}</button>`).join("");
    $("#reqFilters").querySelectorAll("button").forEach(b => b.onclick = () => { reqFilter = b.dataset.f; renderRequests(); });
    const list = all.filter(r => reqFilter === "all" || (reqFilter === "open" ? !["completed", "rejected"].includes(r.status) : r.status === reqFilter));
    $("#reqList").innerHTML = list.map(r => {
      const s = svc(r.serviceId);
      return `<div class="card req ${r.urgent ? "urgent" : ""}" data-id="${r.id}">
        <div><div class="ttl">${r.urgent ? `<span class="chip red">${UI.ic("alert")} ${t("sos")}</span>` : ""}${esc(nm(s))}</div>
          <div class="sub"><span class="num" dir="ltr">${esc(r.ref)}</span><span>${fmtDate(r.createdAt)}</span><span>${esc(nm(DIP.UNITS[r.unit]))}</span></div></div>
        <div class="side">${UI.statusBadge(r.status, lang)}${r.permitCode && r.status !== "rejected" ? `<span class="chip">${UI.ic("qr")} ${t("permitT")}</span>` : ""}
          ${r.status === "completed" && !r.rating ? `<span class="chip" style="color:#9a6b1f">${UI.ic("star")} ${t("rateT")}</span>` : ""}</div>
        ${stepsHtml(r)}
      </div>`;
    }).join("") || `<div class="card empty">${t("noReqs")}</div>`;
    $("#reqList").querySelectorAll(".req").forEach(c => c.onclick = () => openDetail(c.dataset.id));
  }

  /* ---------- التنقل ---------- */
  function show(view) {
    document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.view === view));
    $("#v-home").hidden = view !== "home"; $("#v-requests").hidden = view !== "requests";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelectorAll("#nav button").forEach(b => b.onclick = () => show(b.dataset.view));

  /* ---------- النافذة المنبثقة ---------- */
  let map = null;
  function openModal(html) { $("#modal").innerHTML = html; $("#modal").classList.add("open"); $("#ov").classList.add("open"); $("#modal").scrollTop = 0; }
  function closeModal() { $("#modal").classList.remove("open"); $("#ov").classList.remove("open"); if (map) { map.remove(); map = null; } }
  $("#ov").onclick = closeModal;
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  function fieldHtml(f, pre) {
    const L = (lang === "en" ? f.en : f.ar) + (f.req ? ' <span class="rq">*</span>' : "");
    const v = esc(pre[f.k] || "");
    const full = ["textarea", "map"].includes(f.type) ? "full" : "";
    if (f.type === "map") return `<div class="field full"><label>${L}</label><div class="mapbox" id="fMap"></div><div class="map-note" id="mapNote">${t("mapHint")}</div></div>`;
    if (f.type === "textarea") return `<div class="field ${full}"><label>${L}</label><textarea name="${f.k}" ${f.req ? "required" : ""}>${v}</textarea></div>`;
    if (f.type === "select") return `<div class="field"><label>${L}</label><select name="${f.k}" ${f.req ? "required" : ""}>${f.opts.map(o => `<option value="${esc(o[0])}">${esc(lang === "en" ? o[1] : o[0])}</option>`).join("")}</select></div>`;
    return `<div class="field"><label>${L}</label><input name="${f.k}" type="${f.type}" value="${v}" ${f.req ? "required" : ""} ${f.type === "number" ? 'min="0"' : ""}></div>`;
  }

  function openForm(sid, pre = {}) {
    const s = svc(sid), m = MISSIONS[missionId];
    let loc = null;
    openModal(`
      <div class="modal-h"><h3>${UI.ic(CATEGORIES[s.cat].icon)} ${esc(nm(s))}</h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <form id="reqForm">
        <div class="modal-b">
          <div class="auto"><div class="t">${UI.ic("check")} ${t("autoData")}</div>
            <div><span>${t("mission")}</span>${esc(nm(m))}</div><div><span>${t("officer")}</span>${esc(m.officer)}</div><div><span>${t("phone")}</span><span class="num" dir="ltr" style="color:inherit;font-size:13px">${esc(m.phone)}</span></div></div>
          <div class="grid2">${s.fields.map(f => fieldHtml(f, pre)).join("")}
            <div class="field full"><label>${t("attach")}</label><input type="file" id="fFiles" multiple><div class="map-note">${t("attachHint")}</div></div>
          </div>
        </div>
        <div class="modal-f"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p">${UI.ic("send")} ${t("submit")}</button></div>
      </form>`);
    $("#modal").querySelectorAll("[data-close]").forEach(b => b.onclick = closeModal);

    if (s.fields.some(f => f.type === "map") && window.L) {
      setTimeout(() => {
        map = L.map("fMap").setView([m.lat, m.lng], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
        let mk = null;
        map.on("click", e => {
          loc = { lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5), label: "" };
          if (mk) mk.setLatLng(e.latlng); else mk = L.marker(e.latlng).addTo(map);
          $("#mapNote").innerHTML = `${UI.ic("check")} <span class="num" dir="ltr">${loc.lat}, ${loc.lng}</span>`;
        });
      }, 60);
    } else if (s.fields.some(f => f.type === "map")) {
      $("#fMap").outerHTML = `<input name="locText" class="inp" required placeholder="${lang === "en" ? "Address" : "العنوان"}">`;
      $("#mapNote").remove();
    }

    $("#reqForm").onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target), fields = {};
      s.fields.forEach(f => { if (f.type !== "map") fields[f.k] = (fd.get(f.k) || "").toString().trim(); });
      if (fd.get("locText")) loc = { lat: null, lng: null, label: fd.get("locText") };
      if (s.fields.some(f => f.type === "map") && !loc) { UI.toast(t("mapHint"), "warn"); return; }
      const now = Date.now();
      const r = {
        ref: makeRef(), missionId, missionName: m.ar, serviceId: sid, category: s.cat, unit: CATEGORIES[s.cat].unit,
        fields, location: loc, attachments: [...$("#fFiles").files].map(f => f.name),
        status: "new", urgent: false, slaHours: s.sla, createdAt: now, updatedAt: now,
        history: [{ status: "new", at: now, by: m.ar, note: "" }], notes: []
      };
      try { await Store.add(r); closeModal(); UI.toast(t("sent") + r.ref); show("requests"); }
      catch (err) { UI.toast(err.message, "err"); }
    };
  }

  function openDetail(id) {
    const r = all.find(x => x.id === id); if (!r) return;
    const s = svc(r.serviceId);
    const rows = s.fields.filter(f => f.type !== "map").map(f => `<dt>${esc((lang === "en" ? f.en : f.ar).replace(/\s*\(.*\)$/, ""))}</dt><dd>${esc(r.fields[f.k] || "—")}</dd>`).join("")
      + (r.urgent ? `<dt>${t("emType")}</dt><dd>${esc(r.fields.type)}</dd><dt>${t("emDesc")}</dt><dd>${esc(r.fields.desc || "—")}</dd>` : "")
      + (r.location ? `<dt>${lang === "en" ? "Location" : "الموقع"}</dt><dd class="num" dir="ltr" style="text-align:start">${r.location.lat != null ? r.location.lat + ", " + r.location.lng : esc(r.location.label)}</dd>` : "")
      + (r.attachments && r.attachments.length ? `<dt>${t("attach")}</dt><dd>${r.attachments.map(esc).join("\n")}</dd>` : "");
    const hist = r.history.slice().reverse().map(h => `<li style="--c:${STATUSES[h.status].color}"><b>${esc(nm(STATUSES[h.status]))}</b>${h.note ? ` — ${esc(h.note)}` : ""}<div class="t">${fmtDate(h.at)} · ${esc(h.by)}</div></li>`).join("");
    const permit = r.permitCode && ["approved", "inprogress", "completed"].includes(r.status) ? `
      <div class="permit" id="permitCard"><div class="ph"><b>${t("permitT")} — ${esc(nm(s))}</b><img src="assets/img/logo-dubai-police-white.png" alt="" style="height:26px"></div>
        <div class="pb"><div class="qr" id="qr"></div>
          <div><div class="muted" style="font-size:12px">${t("permitNo")}</div><div class="code">${esc(r.permitCode)}</div>
            <div style="margin-top:6px;font-size:13px">${esc(nm(MISSIONS[r.missionId]))}</div>
            <div class="muted" style="font-size:12px">${esc(r.fields.date || r.fields.from || "")} · ${t("permitHint")}</div>
            <button class="btn btn-o btn-sm no-print" style="margin-top:10px" id="printBtn">${UI.ic("print")} ${t("print")}</button></div></div></div>` : "";
    const rate = r.status === "completed" ? (r.rating ? `
      <div class="rate-box"><b>${t("yourRating")}</b><div class="stars" style="justify-content:flex-start">${[1, 2, 3, 4, 5].map(i => `<button class="${i <= r.rating ? "on" : ""}" disabled>${UI.ic("star")}</button>`).join("")}</div>${r.ratingNote ? `<div class="muted">${esc(r.ratingNote)}</div>` : ""}</div>` : `
      <div class="rate-box"><b>${t("rateT")}</b><div class="stars" id="stars" style="justify-content:flex-start">${[1, 2, 3, 4, 5].map(i => `<button data-v="${i}">${UI.ic("star")}</button>`).join("")}</div>
        <div class="field" style="margin-top:8px"><input id="rateNote" placeholder="${t("rateNote")}"></div>
        <button class="btn btn-gold btn-sm" style="margin-top:10px" id="rateBtn" disabled>${t("rateSend")}</button></div>`) : "";

    openModal(`
      <div class="modal-h"><h3>${UI.ic(CATEGORIES[s.cat].icon)} ${esc(nm(s))}</h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <div class="modal-b">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
          <div><span class="muted" style="font-size:12px">${t("ref")}</span><div class="num bold" dir="ltr" style="font-size:18px;text-align:start">${esc(r.ref)}</div></div>
          ${UI.statusBadge(r.status, lang)}</div>
        ${stepsHtml(r)}
        ${r.status === "rejected" && r.rejectReason ? `<div class="chip red" style="margin-top:12px;white-space:normal;padding:8px 12px">${t("rejectReason")}: ${esc(r.rejectReason)}</div>` : ""}
        ${permit}
        <div class="sec-h" style="margin-top:22px"><h2>${t("details")}</h2></div>
        <dl class="kv"><dt>${t("submitted")}</dt><dd>${fmtDate(r.createdAt)}</dd><dt>${t("unit")}</dt><dd>${esc(nm(DIP.UNITS[r.unit]))}</dd>${rows}</dl>
        ${rate}
        <div class="sec-h"><h2>${t("history")}</h2></div>
        <ul class="hist">${hist}</ul>
      </div>`);
    $("#modal").querySelectorAll("[data-close]").forEach(b => b.onclick = closeModal);
    if ($("#qr") && !window.QRCode) $("#qr").remove();
    if ($("#qr") && window.QRCode) new QRCode($("#qr"), { text: `DUBAI POLICE | DIP PERMIT | ${r.permitCode} | ${r.ref}`, width: 118, height: 118, colorDark: "#00492c" });
    const pb = $("#printBtn"); if (pb) pb.onclick = () => printPermit();
    const stars = $("#stars");
    if (stars) {
      let v = 0;
      stars.querySelectorAll("button").forEach(b => b.onclick = () => { v = +b.dataset.v; stars.querySelectorAll("button").forEach(x => x.classList.toggle("on", +x.dataset.v <= v)); $("#rateBtn").disabled = false; });
      $("#rateBtn").onclick = async () => { await Store.update(r.id, { rating: v, ratingNote: $("#rateNote").value.trim() }); UI.toast(t("rated")); closeModal(); };
    }
  }
  function printPermit() {
    const w = window.open("", "_blank", "width=700,height=600");
    w.document.write(`<html dir="rtl"><head><title>Permit</title><link rel="stylesheet" href="${location.href.replace(/[^/]*$/, "")}assets/css/style.css"><link rel="stylesheet" href="${location.href.replace(/[^/]*$/, "")}assets/css/embassy.css"></head><body style="padding:30px;background:#fff">${$("#permitCard").outerHTML}<script>setTimeout(()=>print(),500)<\/script></body></html>`);
    w.document.close();
  }

  /* ---------- البلاغ الطارئ ---------- */
  $("#sosBtn").onclick = () => {
    const m = MISSIONS[missionId];
    let loc = { lat: m.lat, lng: m.lng, label: "مقر البعثة" };
    openModal(`
      <div class="modal-h" style="background:var(--red-l)"><h3 style="color:var(--red)">${UI.ic("alert")} ${t("emT")}</h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <form id="emForm"><div class="modal-b">
        <p class="muted" style="margin-top:0">${t("emSub")}</p>
        <div class="field"><label>${t("emType")}</label><div class="em-types">${t("emTypes").map((x, i) => `<label><input type="radio" name="type" value="${esc(x)}" ${i === 0 ? "checked" : ""}> ${esc(x)}</label>`).join("")}</div></div>
        <div class="field" style="margin-top:14px"><label>${t("emDesc")}</label><textarea name="desc"></textarea></div>
        <div class="map-note" id="emLoc">${UI.ic("map")} ${t("locating")}</div>
      </div>
      <div class="modal-f"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-r">${UI.ic("alert")} ${t("emSend")}</button></div></form>`);
    $("#modal").querySelectorAll("[data-close]").forEach(b => b.onclick = closeModal);
    const showLoc = () => { const el = $("#emLoc"); if (el) el.innerHTML = `${UI.ic("map")} <span class="num" dir="ltr">${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</span> (${esc(loc.label)})`; };
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => { loc = { lat: p.coords.latitude, lng: p.coords.longitude, label: lang === "en" ? "Device location" : "موقع الجهاز" }; showLoc(); }, showLoc, { timeout: 6000 });
    else showLoc();
    $("#emForm").onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target), now = Date.now(), s = svc("e1");
      const r = {
        ref: makeRef().replace("DIP", "SOS"), missionId, missionName: m.ar, serviceId: "e1", category: "emergency", unit: "ops",
        fields: { type: fd.get("type"), desc: (fd.get("desc") || "").toString().trim() }, location: loc, attachments: [],
        status: "new", urgent: true, slaHours: s.sla, createdAt: now, updatedAt: now,
        history: [{ status: "new", at: now, by: m.ar, note: "بلاغ طارئ" }], notes: []
      };
      try { await Store.add(r); closeModal(); UI.toast(t("emSent"), "err"); show("requests"); } catch (err) { UI.toast(err.message, "err"); }
    };
  };

  /* ---------- اللغة ---------- */
  $("#langBtn").onclick = () => {
    lang = lang === "ar" ? "en" : "ar"; try { localStorage.setItem("dip-lang", lang); } catch (e) {}
    applyLang(); if (missionId) { renderWho(); renderAll(); } else renderLogin();
  };

  /* ---------- التشغيل ---------- */
  (async function start() {
    applyLang();
    try { await Store.init(); } catch (err) { UI.toast(err.message, "err"); }
    $("#banner").innerHTML = UI.modeBanner();
    renderLogin();
    if (Store.picker) {
      let saved = null; try { saved = sessionStorage.getItem("dip-mission"); } catch (e) {}
      if (saved && MISSIONS[saved]) enter(saved);
    } else {
      Store.onAuth(u => {
        if (!u) return;
        const mid = (window.APP_CONFIG.embassyAccounts || {})[(u.email || "").toLowerCase()];
        if (mid) enter(mid); else { UI.toast("هذا الحساب ليس حساب بعثة", "err"); Store.signOut(); }
      });
    }
  })();
})();
