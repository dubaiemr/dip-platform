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
      portal: "بوابة الهيئات الدبلوماسية", portalTag: "قسم أمن الهيئات الدبلوماسية والمنشآت الهامة",
      navHome: "الخدمات", navReq: "طلباتي",
      loginTitle: "تسجيل دخول البعثة", loginSub: "منصة موحدة لخدمات شرطة دبي الأمنية والمرورية والإدارية للهيئات الدبلوماسية.",
      mission: "البعثة الدبلوماسية", email: "البريد الإلكتروني", password: "كلمة المرور", login: "دخول",
      localHint: "تشغيل تجريبي: اختر أي بعثة افتراضية من القائمة، وسجّل الدخول دون كلمة مرور.",
      welcome: "أهلاً بكم في بوابة الخدمات", sos: "بلاغ طارئ", sosSub: "يصل فوراً إلى غرفة العمليات",
      catalog: "دليل الخدمات", searchSvc: "ابحث عن خدمة…", all: "الكل",
      sTotal: "إجمالي الطلبات", sOpen: "طلبات جارية", sDone: "طلبات مكتملة", sPermits: "تصاريح سارية",
      hrs: "ساعة", min: "دقيقة", within: "مدة الإنجاز", permit: "يصدر تصريح رقمي", req: "قدّم الطلب",
      myReqs: "طلباتي", noReqs: "لا توجد طلبات في هذا التصنيف.", open: "جارية", done: "مكتملة", rejected: "الاعتذارات",
      newReq: "طلب جديد", autoData: "بيانات البعثة (تعبئة تلقائية)", officer: "ضابط الاتصال", phone: "الهاتف", type: "النوع",
      attach: "المرفقات", attachHint: "تُرسل الصور (حتى 3 صور) وتظهر لشرطة دبي مع الطلب، أما بقية الملفات فيُحفظ اسمها فقط في التشغيل التجريبي.", submit: "إرسال الطلب", cancel: "إلغاء",
      mapHint: "اضغط على الخارطة لتحديد الموقع.", venueMap: "الفعالية خارج البعثة: يرجى تحديد موقعها على الخارطة.", required: "يرجى تعبئة الحقول المطلوبة.", sent: "تم إرسال الطلب بنجاح — رقم الطلب: ",
      details: "تفاصيل الطلب", ref: "رقم الطلب", service: "الخدمة", submitted: "تاريخ التقديم", unit: "الجهة المختصة",
      status: "الحالة", history: "سجل الطلب", rejectReason: "سبب الاعتذار",
      permitT: "تصريح رقمي", permitNo: "رمز التصريح", permitHint: "يُبرز للدورية أو البوابة للتحقق منه.", print: "طباعة",
      rateT: "قيّم الخدمة", rateNote: "ملاحظة (اختياري)", rateSend: "إرسال التقييم", rated: "شكراً لتقييمكم", yourRating: "تقييمكم",
      emT: "بلاغ طارئ", emSub: "يصل البلاغ مباشرة إلى غرفة العمليات في شرطة دبي مع الموقع المحدد.", emType: "نوع البلاغ",
      emTypes: ["تهديد أمني", "تجمهر أمام المقر", "حادث داخل المقر", "أخرى"], emDesc: "وصف مختصر", emSend: "إرسال البلاغ الآن",
      emSent: "تم إرسال البلاغ، وتتابع غرفة العمليات الحالة الآن", locating: "جارٍ تحديد الموقع…",
      natT: "يوم وطني قريب", natTxt: (d) => `يتبقى ${d} يوماً على اليوم الوطني لدولتكم. هل ترغبون في تقديم طلب تأمين الفعالية الآن؟`, natBtn: "تقديم طلب تأمين فعالية",
      logout: "خروج", lateFor: "متأخر", leftFor: "متبقي على المهلة", notifOff: "تفعيل التنبيهات", notifOn: "التنبيهات مفعّلة", notifTestT: "✅ تم تفعيل التنبيهات", notifTestB: "سيصلكم إشعار مع كل تحديث على طلباتكم.", notifDenied: "لم يُسمح بالتنبيهات — يرجى تفعيلها من إعدادات المتصفح", notifIos: "في أجهزة آيفون: يرجى إضافة البوابة إلى الشاشة الرئيسية أولاً، ثم تفعيل التنبيهات من داخلها", updT: "تحديث على طلبكم", address: "العنوان", location: "الموقع", deviceLoc: "موقع الجهاز", dp: "شرطة دبي", natEvent: "احتفال اليوم الوطني",
      consul: "القنصل العام", consAddr: "مقر القنصلية", resAddr: "منزل القنصل", resSame: "داخل مبنى القنصلية", resOther: "موقع مستقل",
      emWhere: "مكان البلاغ", emAtCons: "في مقر القنصلية", emAtRes: "في منزل القنصل", emAtOther: "موقع آخر (الموقع الحالي)",
      emDrag: "يمكن سحب العلامة على الخارطة لتعديل الموقع بدقة.", emPhoto: "إرفاق صورة (اختياري)", addPhoto: "إضافة صورة", noLoc: "تعذّر تحديد الموقع الحالي، فحُدِّد مقر القنصلية.",
      mofaNote: "تُرسل طلبات الخدمات عبر منصة وزارة الخارجية إلى المنسق الرئيسي في شرطة دبي، أما البلاغات الطارئة فتصل مباشرة إلى غرفة العمليات.", viaMofa: "عبر منصة وزارة الخارجية"
    },
    en: {
      portal: "Diplomatic Missions Portal", portalTag: "Diplomatic Missions & Important Facilities Security Section",
      navHome: "Services", navReq: "My requests",
      loginTitle: "Mission sign-in", loginSub: "One platform for Dubai Police security, traffic and administrative services to diplomatic missions.",
      mission: "Diplomatic mission", email: "Email", password: "Password", login: "Sign in",
      localHint: "Pilot mode: choose any sample mission and sign in without a password.",
      welcome: "Welcome to the services portal", sos: "Emergency", sosSub: "Goes straight to the Command Center",
      catalog: "Service catalogue", searchSvc: "Search services…", all: "All",
      sTotal: "Total requests", sOpen: "In progress", sDone: "Completed", sPermits: "Active permits",
      hrs: "hrs", min: "min", within: "Service time", permit: "Digital permit", req: "Request",
      myReqs: "My requests", noReqs: "No requests here.", open: "Open", done: "Completed", rejected: "Declined",
      newReq: "New request", autoData: "Mission details (auto-filled)", officer: "Liaison officer", phone: "Phone", type: "Type",
      attach: "Attachments", attachHint: "Photos (up to 3) are sent with the request and shown to Dubai Police; other files are stored by name only in pilot mode.", submit: "Submit request", cancel: "Cancel",
      mapHint: "Click on the map to set the location.", venueMap: "The event is outside the mission: please mark its location on the map.", required: "Please complete the required fields.", sent: "Request submitted — reference: ",
      details: "Request details", ref: "Reference", service: "Service", submitted: "Submitted", unit: "Handled by",
      status: "Status", history: "History", rejectReason: "Reason for declining",
      permitT: "Digital permit", permitNo: "Permit code", permitHint: "Show it to the patrol or gate for verification.", print: "Print",
      rateT: "Rate this service", rateNote: "Comment (optional)", rateSend: "Send rating", rated: "Thank you for your feedback", yourRating: "Your rating",
      emT: "Emergency report", emSub: "Your report and location go straight to the Command Center.", emType: "Report type",
      emTypes: ["Security threat", "Gathering outside premises", "Incident on premises", "Other"], emDesc: "Short description", emSend: "Send report now",
      emSent: "Report sent — the Command Center is following up now", locating: "Locating…",
      natT: "National day coming up", natTxt: (d) => `${d} days to your National Day. Would you like to request event security now?`, natBtn: "Request event security",
      logout: "Sign out", lateFor: "Overdue", leftFor: "Time left", notifOff: "Enable notifications", notifOn: "Notifications on", notifTestT: "✅ Notifications are on", notifTestB: "You will be notified of every update to your requests.", notifDenied: "Notifications were not allowed — enable them in browser settings", notifIos: "On iPhone: add the portal to your Home Screen first, then enable notifications from there", updT: "Update on your request", address: "Address", location: "Location", deviceLoc: "Device location", dp: "Dubai Police", natEvent: "National Day reception",
      consul: "Consul General", consAddr: "Consulate premises", resAddr: "Consul's residence", resSame: "inside the consulate building", resOther: "separate location",
      emWhere: "Location of the incident", emAtCons: "At the consulate", emAtRes: "At the consul's residence", emAtOther: "Another location (current position)",
      emDrag: "You can drag the marker on the map to adjust the exact location.", emPhoto: "Attach a photo (optional)", addPhoto: "Add photo", noLoc: "Current location unavailable; the consulate premises were selected.",
      mofaNote: "Service requests are sent through the MOFA platform to the Dubai Police main coordinator; emergency reports reach the Command Center directly.", viaMofa: "via the MOFA platform"
    }
  };
  // اللغات الإضافية من i18n.js
  const X = window.I18N || { langs: [["ar", "العربية"], ["en", "English"]] };
  X.langs.forEach(([code]) => {
    if (T[code] || !X[code]) return;
    const u = X[code].ui;
    T[code] = Object.assign({}, T.en, u, { natTxt: d => u.natTxt.replace("{d}", d) });
  });
  // ربط كل عنصر (تصنيف/حالة/جهة/خدمة) بمفتاحه للترجمة
  const KEY = new Map();
  Object.entries(CATEGORIES).forEach(([k, o]) => KEY.set(o, ["cat", k]));
  Object.entries(STATUSES).forEach(([k, o]) => KEY.set(o, ["st", k]));
  Object.entries(DIP.UNITS).forEach(([k, o]) => KEY.set(o, ["unit", k]));
  SERVICES.forEach(o => KEY.set(o, ["svc", o.id]));

  let lang = "ar";
  try { lang = localStorage.getItem("dip-lang") || "ar"; } catch (e) {}
  if (!T[lang]) lang = "ar";
  const t = k => T[lang][k];
  const nm = o => {
    if (lang === "ar") return o.ar;
    if (lang === "en" || !X[lang]) return o.en;
    const k = KEY.get(o); if (!k) return o.en;
    const v = X[lang][k[0]] && X[lang][k[0]][k[1]];
    return (Array.isArray(v) ? v[0] : v) || o.en;
  };
  const svcDesc = s => lang === "ar" ? s.dAr : lang === "en" || !X[lang] ? s.dEn : ((X[lang].svc[s.id] || [])[1] || s.dEn);
  const flabel = f => lang === "ar" ? f.ar : lang === "en" || !X[lang] ? f.en : (X[lang].f[f.k] || f.en);

  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.dataset.t); });
    document.querySelectorAll("[data-tp]").forEach(el => { el.placeholder = t(el.dataset.tp); });
    const sel = $("#langSel");
    if (!sel.options.length) sel.innerHTML = X.langs.filter(([c]) => T[c]).map(([c, n]) => `<option value="${c}">${n}</option>`).join("");
    sel.value = lang;
    document.title = t("portal") + " | " + t("dp");
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
    EAlerts.init();
    let firstLoad = true;
    unsub = Store.subscribe(list => {
      all = list.filter(r => r.missionId === missionId).sort((a, b) => b.createdAt - a.createdAt);
      if (firstLoad) { EAlerts.firstRun(); firstLoad = false; }
      notifyChanges();
      renderAll();
    }, missionId);
    if (unsubBc) unsubBc();
    let bcFirst = true;
    unsubBc = Store.subscribeBroadcasts(list => {
      bcs = list.filter(b => BC.isFor(b, missionId)).sort((a, b) => b.createdAt - a.createdAt);
      notifyBc(bcFirst); bcFirst = false;
      renderBc(); EAlerts.update();
    });
  }
  /* ---------- التعاميم وطلبات الطمأنة ---------- */
  let bcs = [], unsubBc = null;
  const BC_SEEN = () => "dip-bc-seen-" + missionId;
  const myResp = b => (b.responses || {})[missionId];
  const bcPending = () => bcs.filter(b => (b.type === "check" && b.status === "active" && !myResp(b)) || (b.type === "advisory" && !(b.reads || {})[missionId])).length;
  function notifyBc(first) {
    let seen = {}; try { seen = JSON.parse(localStorage.getItem(BC_SEEN()) || "{}"); } catch (e) {}
    bcs.forEach(b => {
      if (seen[b.id]) return; seen[b.id] = 1;
      if (first && Date.now() - b.createdAt > 6 * 3600e3) return;
      if (b.type === "check" && b.status !== "active") return;
      const title = b.type === "check" ? BC.ui(lang, "newChk") : BC.ui(lang, "newAdv");
      const body = b.type === "check" ? BC.ui(lang, "chkSub") : BC.title(b, lang) + "\n" + BC.text(b, lang);
      UI.toast(title, b.type === "check" ? "err" : ""); UI.beep && UI.beep();
      EAlerts.show(title, { body, tag: b.id, renotify: true, requireInteraction: b.type === "check", dir: lang === "ar" ? "rtl" : "ltr", lang, icon: "assets/img/icons/embassy-192.png", badge: "assets/img/icons/badge-96.png", data: { page: "embassy.html" } });
    });
    try { localStorage.setItem(BC_SEEN(), JSON.stringify(seen)); } catch (e) {}
  }
  function renderBc() {
    const el = $("#chkBanner"); if (!el) return;
    const act = bcs.find(b => b.type === "check" && b.status === "active");
    const u = k => BC.ui(lang, k);
    if (!act) el.innerHTML = "";
    else if (myResp(act)) {
      const r = myResp(act);
      el.innerHTML = `<div class="chk-done ${r.state}">${UI.ic(r.state === "help" ? "alert" : "check")}<span>${u(r.state === "help" ? "sentHelp" : "sentSafe")}</span><small class="num">${fmtDate(r.at)}</small></div>`;
    } else {
      const why = BC.reason(lang, act.reason);
      el.innerHTML = `<div class="chk-ban">
        <div class="t"><span class="pulse"></span><div><b>${esc(u("chkT"))}</b><span>${esc(u("chkSub"))}${why ? " — " + esc(why) : ""}</span>${act.msg && lang === "ar" ? `<span>${esc(act.msg)}</span>` : ""}</div></div>
        <input class="inp" id="chkNote" placeholder="${esc(u("note"))}">
        <div class="a"><button class="btn btn-safe" data-st="safe">${UI.ic("check")} ${esc(u("safe"))}</button><button class="btn btn-help" data-st="help">${UI.ic("alert")} ${esc(u("help"))}</button></div></div>`;
      el.querySelectorAll("[data-st]").forEach(b => b.onclick = async () => {
        el.querySelectorAll("button").forEach(x => x.disabled = true);
        try { await Store.setBroadcastField(act.id, ["responses", missionId], { state: b.dataset.st, note: $("#chkNote").value.trim(), at: Date.now(), by: MISSIONS[missionId].ar }); }
        catch (e) { UI.toast(e.message, "err"); el.querySelectorAll("button").forEach(x => x.disabled = false); }
      });
    }
    const adv = bcs.filter(b => b.type === "advisory").slice(0, 6), box = $("#advList");
    if (!box) return;
    box.innerHTML = adv.length ? `<div class="sec-h"><h2>${esc(u("sec"))}</h2></div><div class="adv-list">${adv.map(b => {
      const read = (b.reads || {})[missionId];
      return `<div class="card adv ${read ? "" : "new"}"><div class="h">${UI.ic("bell")}<b>${esc(BC.title(b, lang))}</b><small class="num">${fmtDate(b.createdAt)}</small></div>
        <p>${esc(BC.text(b, lang))}</p>${read ? "" : `<button class="btn btn-o btn-sm" data-rd="${b.id}">${UI.ic("check")} ${esc(u("ack"))}</button>`}</div>`;
    }).join("")}</div>` : "";
    box.querySelectorAll("[data-rd]").forEach(b => b.onclick = async () => { b.disabled = true; try { await Store.setBroadcastField(b.dataset.rd, ["reads", missionId], Date.now()); } catch (e) { b.disabled = false; } });
  }
  function renderWho() {
    const mn = esc(nm(MISSIONS[missionId]));
    $("#who").innerHTML = `<button class="act notif" id="notifBtn"></button>
      <div class="menu-wrap"><button class="act" id="menuBtn" title="${mn}">${UI.ic("user")}<span>${mn}</span><svg class="ic" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M6 9l6 6 6-6"/></svg></button>
        <div class="menu" id="menu" hidden>
          <div class="mh">${UI.ic("user")} ${mn}</div>
          <button id="logoutBtn">${UI.ic("logout")} ${t("logout")}</button>
        </div></div>`;
    $("#menuBtn").onclick = e => { e.stopPropagation(); $("#menu").hidden = !$("#menu").hidden; };
    if (!renderWho.bound) { renderWho.bound = true; document.addEventListener("click", e => { if (!e.target.closest(".menu-wrap") && $("#menu")) $("#menu").hidden = true; }); }
    EAlerts.button();
    $("#logoutBtn").onclick = async () => { try { sessionStorage.removeItem("dip-mission"); } catch (e) {} await Store.signOut(); location.reload(); };
  }
  // تنبيه عند تغيّر حالة طلب من جهة الشرطة
  function notifyChanges() {
    const first = !Object.keys(lastStatuses).length;
    all.forEach(r => {
      if (!first && lastStatuses[r.id] && lastStatuses[r.id] !== r.status) {
        UI.toast(`${r.ref}: ${nm(STATUSES[r.status])}`);
        EAlerts.notify(r);
      }
      lastStatuses[r.id] = r.status;
    });
    EAlerts.update();
  }

  /* ---------- تنبيهات البعثة: إشعار عند رد الشرطة + رقم على أيقونة التطبيق ---------- */
  const SEEN_KEY = () => "dip-seen-" + missionId;
  const EAlerts = {
    reg: null,
    async init() {
      if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
        try { this.reg = await navigator.serviceWorker.register("sw.js"); } catch (e) {}
        navigator.serviceWorker.addEventListener("message", e => { if (e.data && e.data.open) { show("requests"); openDetail(e.data.open); } });
      }
      const m = location.hash.match(/req=([^&]+)/); if (m) setTimeout(() => { show("requests"); openDetail(decodeURIComponent(m[1])); }, 1500);
      this.button();
    },
    ok() { return "Notification" in window; },
    button() {
      const b = $("#notifBtn"); if (!b) return;
      if (!this.ok()) { b.hidden = true; return; }
      const on = Notification.permission === "granted";
      b.classList.toggle("on", on);
      b.innerHTML = UI.ic("bell") + `<span>${on ? t("notifOn") : t("notifOff")}</span>`;
      b.onclick = async () => {
        if (Notification.permission === "granted") { this.test(); return; }
        const p = await Notification.requestPermission();
        if (p === "granted") this.test();
        else UI.toast(/iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone ? t("notifIos") : t("notifDenied"), "warn");
        this.button();
      };
    },
    async show(title, opts) {
      if (!this.ok() || Notification.permission !== "granted") return;
      try {
        const reg = this.reg || (navigator.serviceWorker && await navigator.serviceWorker.getRegistration());
        if (reg) await reg.showNotification(title, opts); else new Notification(title, opts);
      } catch (e) { try { new Notification(title, opts); } catch (e2) {} }
    },
    notify(r) {
      const st = nm(STATUSES[r.status]);
      const extra = r.status === "rejected" && r.rejectReason ? " — " + r.rejectReason : (r.permitCode && r.status === "approved" ? " — " + t("permitT") : "");
      this.show(`${t("updT")}: ${st}`, {
        body: `${nm(svc(r.serviceId))}\n${r.ref}${extra}`, tag: r.id, data: { id: r.id, page: "embassy.html" }, renotify: true,
        dir: lang === "ar" ? "rtl" : "ltr", lang, icon: "assets/img/icons/embassy-192.png", badge: "assets/img/icons/badge-96.png", vibrate: [200, 100, 200]
      });
    },
    test() { this.show(t("notifTestT"), { body: t("notifTestB"), tag: "test", icon: "assets/img/icons/embassy-192.png", badge: "assets/img/icons/badge-96.png" }); },
    // الرقم على الأيقونة = طلبات حدّثتها الشرطة ولم تُفتح بعد
    unseen() {
      let seen = {}; try { seen = JSON.parse(localStorage.getItem(SEEN_KEY()) || "{}"); } catch (e) {}
      return all.filter(r => r.history.length > 1 && (seen[r.id] || 0) < r.updatedAt);
    },
    markSeen(id) {
      let seen = {}; try { seen = JSON.parse(localStorage.getItem(SEEN_KEY()) || "{}"); } catch (e) {}
      const r = all.find(x => x.id === id); if (!r) return;
      seen[id] = r.updatedAt; try { localStorage.setItem(SEEN_KEY(), JSON.stringify(seen)); } catch (e) {}
      this.update();
    },
    firstRun() {
      // أول دخول: اعتبر كل الطلبات الحالية مقروءة حتى لا يظهر رقم قديم
      try { if (!localStorage.getItem(SEEN_KEY())) { const s = {}; all.forEach(r => s[r.id] = r.updatedAt); localStorage.setItem(SEEN_KEY(), JSON.stringify(s)); } } catch (e) {}
    },
    update() {
      const n = this.unseen().length + bcPending();
      try { if (navigator.setAppBadge) { if (n) navigator.setAppBadge(n); else navigator.clearAppBadge(); } } catch (e) {}
      const c = $("#updCnt"); if (c) { c.textContent = n; c.classList.toggle("show", n > 0); }
    }
  };

  /* ---------- العرض ---------- */
  function renderAll() { renderHome(); renderRequests(); renderBc(); }

  function renderHome() {
    const m = MISSIONS[missionId];
    $("#missionName").textContent = nm(m);
    $("#missionMeta").innerHTML = `
      <span>${UI.ic("user")} ${t("consul")}: ${esc(m.consul)}</span>
      <span>${UI.ic("user")} ${t("officer")}: ${esc(m.officer)}</span>
      <span>${UI.ic("bell")} ${t("phone")}: <span class="num" dir="ltr">${esc(m.phone)}</span></span>
      <span>${UI.ic("house")} ${t("resAddr")}: ${m.res.same ? t("resSame") : t("resOther")}</span>
      <span class="mofa">${UI.ic("route")} ${t("mofaNote")}</span>`;

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
    const nb = $("#natBtn"); if (nb) nb.onclick = () => openForm("s2", { event: t("natEvent"), date: natDate(m.natDay) });

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
        <p>${esc(svcDesc(s))}</p>
        <div class="bot"><span>${UI.ic("clock")} ${t("within")}: <b class="num">${s.sla}</b> ${t("hrs")}</span>
          ${s.permit ? `<span>${UI.ic("qr")} ${t("permit")}</span>` : `<span class="go">${t("req")} ${lang === "ar" ? "←" : "→"}</span>`}</div>
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
  function openModal(html) { if (map) { map.destroy(); map = null; } $("#modal").innerHTML = html; $("#modal").classList.add("open"); $("#ov").classList.add("open"); $("#modal").scrollTop = 0; }
  function closeModal() { $("#modal").classList.remove("open"); $("#ov").classList.remove("open"); if (map) { map.destroy(); map = null; } }
  $("#ov").onclick = closeModal;
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  function fieldHtml(f, pre) {
    const L = esc(flabel(f)) + (f.req ? ' <span class="rq">*</span>' : "");
    const v = esc(pre[f.k] || "");
    const full = ["textarea", "map"].includes(f.type) ? "full" : "";
    if (f.type === "map") return `<div class="field full"><label>${L}</label><div class="mapbox" id="fMap"></div><div class="map-note" id="mapNote">${t("mapHint")}</div></div>`;
    if (f.type === "textarea") return `<div class="field ${full}"><label>${L}</label><textarea name="${f.k}" ${f.req ? "required" : ""}>${v}</textarea></div>`;
    if (f.type === "select") return `<div class="field"><label>${L}</label><select name="${f.k}" ${f.req ? "required" : ""}>${f.opts.map(o => `<option value="${esc(o[0])}">${esc(lang === "ar" ? o[0] : o[1])}</option>`).join("")}</select></div>`;
    return `<div class="field"><label>${L}</label><input name="${f.k}" type="${f.type}" value="${v}" ${f.req ? "required" : ""} ${f.type === "number" ? 'min="0"' : ""}></div>`;
  }

  function openForm(sid, pre = {}) {
    const s = svc(sid), m = MISSIONS[missionId];
    let loc = null;
    openModal(`
      <div class="modal-h"><h3>${UI.ic(CATEGORIES[s.cat].icon)}<span>${esc(nm(s))}<span class="sub">${esc(nm(CATEGORIES[s.cat]))} · ${t("viaMofa")}</span></span></h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <form id="reqForm">
        <div class="modal-b">
          <div class="auto"><div class="t">${UI.ic("check")} ${t("autoData")}</div>
            <div><span>${t("mission")}</span>${esc(nm(m))}</div><div><span>${t("consul")}</span>${esc(m.consul)}</div><div><span>${t("officer")}</span>${esc(m.officer)}</div><div><span>${t("phone")}</span><span class="num" dir="ltr" style="color:inherit;font-size:13px">${esc(m.phone)}</span></div></div>
          <div class="grid2">${s.fields.map(f => fieldHtml(f, pre)).join("")}
            <div class="field full"><label>${t("attach")}</label><input type="file" id="fFiles" multiple><div class="map-note">${t("attachHint")}</div><div class="thumbs" id="fThumbs"></div></div>
          </div>
        </div>
        <div class="modal-f"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p">${UI.ic("send")} ${t("submit")}</button></div>
      </form>`);
    $("#modal").querySelectorAll("[data-close]").forEach(b => b.onclick = closeModal);

    if (s.fields.some(f => f.type === "map")) {
      UI.emap("fMap", [m.lat, m.lng], 14).then(mp => {
        if (!$("#fMap")) { mp.destroy(); return; }
        map = mp;
        mp.sites([{ id: missionId, type: "consulate", code: m.code, name: m.ar, lat: m.lat, lng: m.lng }], { mode: "flags" });
        mp.onPick((lat, lng) => {
          loc = { lat: +lat.toFixed(5), lng: +lng.toFixed(5), label: "" };
          $("#mapNote").innerHTML = `${UI.ic("check")} <span class="num" dir="ltr">${loc.lat}, ${loc.lng}</span>`;
        });
        // الموقع الافتراضي: مقر القنصلية، ويمكن تغييره بالضغط على الخارطة
        loc = { lat: m.lat, lng: m.lng, label: "مقر القنصلية" };
        mp.marker(m.lat, m.lng, { draggable: true });
        $("#mapNote").innerHTML = `${UI.ic("check")} ${esc(t("consAddr"))} — ${t("mapHint")}`;
      }).catch(() => {
        const el = $("#fMap"); if (!el) return;
        el.outerHTML = `<input name="locText" class="inp" required placeholder="${t("address")}">`;
        const n = $("#mapNote"); if (n) n.remove();
      });
    }

    const vSel = $("#reqForm select[name=venue]");
    if (vSel) vSel.onchange = () => { if (!["داخل مقر القنصلية", "منزل القنصل العام"].includes(vSel.value) && loc && loc.label === "مقر القنصلية" && $("#mapNote")) $("#mapNote").innerHTML = `${UI.ic("alert")} ${esc(t("venueMap"))}`; };
    // الصور المرفقة تُضغط وتُرسل مع الطلب (حتى 3 صور)، وبقية الملفات يُحفظ اسمها
    let photos = [];
    $("#fFiles").onchange = async ev => {
      photos = [];
      for (const f of [...ev.target.files]) { if (!/^image\//.test(f.type) || photos.length >= 3) continue; try { photos.push(await UI.compressImage(f, 1000, 0.6)); } catch (err) {} }
      $("#fThumbs").innerHTML = photos.map(x => `<img class="thumb" src="${x}" alt="">`).join("");
    };
    $("#reqForm").onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target), fields = {};
      s.fields.forEach(f => { if (f.type !== "map") fields[f.k] = (fd.get(f.k) || "").toString().trim(); });
      if (fd.get("locText")) loc = { lat: null, lng: null, label: fd.get("locText") };
      if (s.fields.some(f => f.type === "map") && !loc) { UI.toast(t("mapHint"), "warn"); return; }
      if (sid === "s2" && !["داخل مقر القنصلية", "منزل القنصل العام"].includes(fields.venue) && loc && loc.label === "مقر القنصلية") { UI.toast(t("venueMap"), "warn"); return; }
      const now = Date.now();
      const r = {
        ref: makeRef(), missionId, missionName: m.ar, serviceId: sid, category: s.cat, unit: "coord", suggestedUnit: DIP.unitFor(s, fields), source: "mofa",
        fields, location: loc, attachments: [...$("#fFiles").files].filter(f => !/^image\//.test(f.type)).map(f => f.name), photos,
        status: "new", urgent: false, slaHours: s.sla, createdAt: now, updatedAt: now,
        history: [{ status: "new", at: now, by: m.ar, note: "وارد من منصة وزارة الخارجية" }], notes: []
      };
      try { await Store.add(r); closeModal(); UI.toast(t("sent") + r.ref); show("requests"); }
      catch (err) { UI.toast(err.message, "err"); }
    };
  }

  function openDetail(id) {
    const r = all.find(x => x.id === id); if (!r) return;
    EAlerts.markSeen(id);
    const s = svc(r.serviceId);
    const rows = s.fields.filter(f => f.type !== "map").map(f => `<dt>${esc(flabel(f).replace(/\s*\(.*\)$/, ""))}</dt><dd>${esc(r.fields[f.k] || "—")}</dd>`).join("")
      + (r.urgent ? `<dt>${t("emType")}</dt><dd>${esc(r.fields.type)}</dd><dt>${t("emWhere")}</dt><dd>${esc(r.location && r.location.label || "—")}</dd><dt>${t("emDesc")}</dt><dd>${esc(r.fields.desc || "—")}</dd>` : "")
      + (r.location ? `<dt>${t("location")}</dt><dd class="num" dir="ltr" style="text-align:start">${r.location.lat != null ? r.location.lat + ", " + r.location.lng : esc(r.location.label)}</dd>` : "")
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
      <div class="modal-h ${r.urgent ? "sos" : ""}"><h3>${UI.ic(CATEGORIES[s.cat].icon)}<span>${esc(nm(s))}<span class="sub">${esc(nm(CATEGORIES[s.cat]))}</span></span></h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
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
        ${r.photos && r.photos.length ? `<div class="sec-h"><h2>${t("emPhoto").replace(/\s*\(.*\)$/, "")}</h2></div><div class="gallery">${r.photos.map(p => `<img src="${p}" alt="">`).join("")}</div>` : ""}
      </div>`);
    $("#modal").querySelectorAll("[data-close]").forEach(b => b.onclick = closeModal);
    UI.bindGallery($("#modal"));
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

  /* ---------- البلاغ الطارئ: مكان البلاغ + خارطة قابلة للتعديل + صورة ---------- */
  $("#sosBtn").onclick = () => {
    const m = MISSIONS[missionId];
    let where = "cons", loc = { lat: m.cons.lat, lng: m.cons.lng, label: T.ar.consAddr }, photo = null;
    const opt = (v, ic, l, sub) => `<label><input type="radio" name="where" value="${v}" ${v === "cons" ? "checked" : ""}><span class="ico">${UI.ic(ic)}</span><span><b>${l}</b>${sub ? `<small>${sub}</small>` : ""}</span></label>`;
    openModal(`
      <div class="modal-h sos"><h3>${UI.ic("alert")}<span>${t("emT")}<span class="sub">${t("sosSub")}</span></span></h3><button class="x-btn" data-close>${UI.ic("x")}</button></div>
      <form id="emForm"><div class="modal-b">
        <p class="muted" style="margin-top:0">${t("emSub")}</p>
        <div class="box"><h4>${UI.ic("pin")} ${t("emWhere")}</h4>
          <div class="em-where">${opt("cons", "building", t("emAtCons"), "")}${opt("res", "house", t("emAtRes"), m.res.same ? t("resSame") : t("resOther"))}${opt("other", "pin", t("emAtOther"), "")}</div>
          <div class="mapbox" id="emMap" style="margin-top:12px"></div>
          <div class="map-note" id="emLoc"></div>
        </div>
        <div class="box"><h4>${UI.ic("alert")} ${t("emType")}</h4><div class="em-types">${t("emTypes").map((x, i) => `<label><input type="radio" name="type" value="${esc(x)}" ${i === 0 ? "checked" : ""}><span>${esc(x)}</span></label>`).join("")}</div></div>
        <div class="box"><h4>${UI.ic("list")} ${t("emDesc")}</h4><div class="field"><textarea name="desc"></textarea></div></div>
        <div class="box"><h4>${UI.ic("camera")} ${t("emPhoto")}</h4>
          <div class="ph-pick"><label class="btn btn-o btn-sm">${UI.ic("camera")} ${t("addPhoto")}<input type="file" id="emPhoto" accept="image/*" capture="environment"></label><span id="emThumb"></span></div></div>
      </div>
      <div class="modal-f"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-r">${UI.ic("alert")} ${t("emSend")}</button></div></form>`);
    $("#modal").querySelectorAll("[data-close]").forEach(b => b.onclick = closeModal);
    const label = () => where === "cons" ? T.ar.consAddr : where === "res" ? T.ar.resAddr + (m.res.same ? " (" + T.ar.resSame + ")" : "") : T.ar.emAtOther;
    const showLoc = () => { const el = $("#emLoc"); if (el) el.innerHTML = `${UI.ic("map")} <span class="num" dir="ltr">${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</span> — ${t("emDrag")}`; };
    const place = (lat, lng) => {
      loc = { lat: +lat.toFixed(6), lng: +lng.toFixed(6), label: label() };
      if (map) { map.marker(lat, lng, { draggable: true }); map.goTo(lat, lng, 17); }
      showLoc();
    };
    place(m.cons.lat, m.cons.lng);
    UI.emap("emMap", [m.cons.lat, m.cons.lng], 17).then(mp => {
      if (!$("#emMap")) { mp.destroy(); return; }
      map = mp;
      mp.sites([{ id: missionId, type: "consulate", code: m.code, name: m.ar, lat: m.lat, lng: m.lng }], { mode: "flags" });
      mp.onPick((lat, lng) => { loc.lat = +lat.toFixed(6); loc.lng = +lng.toFixed(6); showLoc(); });
      place(loc.lat, loc.lng);
    }).catch(() => { const el = $("#emMap"); if (el) el.remove(); showLoc(); });
    $("#modal").querySelectorAll('input[name="where"]').forEach(r => r.onchange = () => {
      where = r.value;
      if (where === "cons") place(m.cons.lat, m.cons.lng);
      else if (where === "res") place(m.res.lat, m.res.lng);
      else {
        $("#emLoc").innerHTML = `${UI.ic("map")} ${t("locating")}`;
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => place(p.coords.latitude, p.coords.longitude),
          () => { UI.toast(t("noLoc"), "warn"); place(m.cons.lat, m.cons.lng); }, { timeout: 8000, enableHighAccuracy: true });
        else place(m.cons.lat, m.cons.lng);
      }
    });
    $("#emPhoto").onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { photo = await UI.compressImage(f, 1000, 0.6); $("#emThumb").innerHTML = `<img class="thumb" src="${photo}" alt="">`; } catch (err) { photo = null; }
    };
    $("#emForm").onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target), now = Date.now(), s = svc("e1");
      loc.label = label();
      const r = {
        ref: makeRef().replace("DIP", "SOS"), missionId, missionName: m.ar, serviceId: "e1", category: "emergency", unit: "ops", source: "direct",
        fields: { type: fd.get("type"), desc: (fd.get("desc") || "").toString().trim(), where }, location: loc, attachments: [], photos: photo ? [photo] : [],
        status: "new", urgent: true, slaHours: s.sla, createdAt: now, updatedAt: now,
        history: [{ status: "new", at: now, by: m.ar, note: "بلاغ طارئ — وصل مباشرة" }], notes: []
      };
      try { await Store.add(r); closeModal(); UI.toast(t("emSent"), "err"); show("requests"); } catch (err) { UI.toast(err.message, "err"); }
    };
  };

  /* ---------- اللغة ---------- */
  $("#langSel").onchange = e => {
    lang = e.target.value; try { localStorage.setItem("dip-lang", lang); } catch (err) {}
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
