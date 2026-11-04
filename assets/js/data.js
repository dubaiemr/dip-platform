/* ============================================================
   البيانات المشتركة + طبقة الحفظ (محلي / Firebase)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- الجهات المختصة ---------- */
  const UNITS = {
    dip:    { ar: "قسم أمن الهيئات الدبلوماسية والمنشآت الهامة", en: "Diplomatic Missions & Important Facilities Security Section" },
    traffic:{ ar: "الإدارة العامة للمرور", en: "General Department of Traffic" },
    airport:{ ar: "تشريفات المطار", en: "Airport Protocol" },
    prison: { ar: "الإدارة العامة للمؤسسات العقابية والإصلاحية", en: "Punitive & Correctional Establishments" },
    ops:    { ar: "غرفة العمليات", en: "Command & Control Center" }
  };

  /* ---------- تصنيفات الخدمات ---------- */
  const CATEGORIES = {
    security: { ar: "الخدمات الأمنية", en: "Security Services", icon: "shield", unit: "dip" },
    traffic:  { ar: "الخدمات المرورية", en: "Traffic Services", icon: "car", unit: "traffic" },
    airport:  { ar: "تشريفات المطار", en: "Airport Protocol", icon: "plane", unit: "airport" },
    prison:   { ar: "خدمات السجن المركزي", en: "Central Prison Services", icon: "building", unit: "prison" },
    emergency:{ ar: "البلاغات الطارئة", en: "Emergency Reports", icon: "alert", unit: "ops" }
  };

  /* ---------- الحقول المتكررة ---------- */
  const F = {
    date:   (k, ar, en) => ({ k, type: "date", ar, en, req: true }),
    time:   (k, ar, en) => ({ k, type: "time", ar, en, req: true }),
    text:   (k, ar, en, req = true) => ({ k, type: "text", ar, en, req }),
    num:    (k, ar, en) => ({ k, type: "number", ar, en, req: true }),
    area:   (k, ar, en, req = false) => ({ k, type: "textarea", ar, en, req }),
    sel:    (k, ar, en, opts) => ({ k, type: "select", ar, en, req: true, opts }),
    map:    () => ({ k: "location", type: "map", ar: "الموقع على الخارطة", en: "Location on map", req: true })
  };

  /* ---------- كتالوج الخدمات ---------- */
  const SERVICES = [
    // الأمنية
    { id: "s1", cat: "security", sla: 48, permit: false,
      ar: "طلب تأمين منشأة دبلوماسية", en: "Diplomatic Facility Security",
      dAr: "تأمين مقر البعثة أو سكن رئيس البعثة لفترة محددة.", dEn: "Securing the mission premises or the head of mission's residence for a set period.",
      fields: [F.text("facility", "اسم المنشأة", "Facility name"),
               F.sel("ftype", "نوع المنشأة", "Facility type", [["مقر البعثة","Mission premises"],["سكن رئيس البعثة","Head of mission residence"],["مقر مؤقت","Temporary premises"]]),
               F.date("from", "من تاريخ", "From"), F.date("to", "إلى تاريخ", "To"),
               F.map(), F.area("reason", "سبب الطلب", "Reason", true)] },
    { id: "s2", cat: "security", sla: 72, permit: false,
      ar: "طلب تأمين فعالية", en: "Event Security",
      dAr: "تأمين الاحتفالات واليوم الوطني والاستقبالات الرسمية.", dEn: "Securing national days, receptions and official events.",
      fields: [F.text("event", "اسم الفعالية", "Event name"), F.date("date", "تاريخ الفعالية", "Event date"),
               F.time("tfrom", "من الساعة", "From"), F.time("tto", "إلى الساعة", "To"),
               F.num("guests", "العدد المتوقع للحضور", "Expected attendees"),
               F.sel("vip", "حضور شخصيات هامة", "VIP attendance", [["لا","No"],["نعم","Yes"]]),
               F.map(), F.area("notes", "ملاحظات", "Notes")] },
    { id: "s3", cat: "security", sla: 24, permit: true,
      ar: "طلب تصريح دخول منطقة محظورة", en: "Restricted Area Entry Permit",
      dAr: "تصريح دخول لأعضاء البعثة إلى منطقة ذات طبيعة أمنية.", dEn: "Entry permit for mission members to a restricted area.",
      fields: [F.text("area", "المنطقة المطلوبة", "Requested area"), F.date("date", "تاريخ الدخول", "Entry date"),
               F.area("persons", "أسماء الأشخاص (كل اسم في سطر)", "Names (one per line)", true),
               F.text("plate", "رقم المركبة", "Vehicle plate", false), F.area("purpose", "الغرض من الدخول", "Purpose", true)] },
    { id: "s4", cat: "security", sla: 48, permit: false,
      ar: "طلب تأمين شخصية هامة", en: "VIP Protection",
      dAr: "مرافقة وتأمين الشخصيات الرسمية الزائرة خلال تواجدها.", dEn: "Protection for visiting officials during their stay.",
      fields: [F.text("vipTitle", "صفة الشخصية", "VIP title / position"), F.date("arrive", "تاريخ الوصول", "Arrival date"),
               F.num("days", "مدة الزيارة (أيام)", "Visit duration (days)"), F.map(),
               F.area("program", "برنامج الزيارة", "Visit programme", true)] },
    // المرورية
    { id: "t1", cat: "traffic", sla: 72, permit: false,
      ar: "إصدار وتجديد لوحات دبلوماسية", en: "Diplomatic Plates – Issue / Renew",
      dAr: "إصدار لوحات جديدة أو تجديد لوحات مركبات البعثة.", dEn: "Issue new or renew diplomatic vehicle plates.",
      fields: [F.sel("kind", "نوع الطلب", "Request type", [["إصدار جديد","New issue"],["تجديد","Renewal"]]),
               F.text("vehicle", "نوع المركبة وموديلها", "Vehicle make & model"), F.text("chassis", "رقم الشاصي", "Chassis no."),
               F.text("plate", "رقم اللوحة الحالي (للتجديد)", "Current plate (renewal)", false)] },
    { id: "t2", cat: "traffic", sla: 24, permit: false,
      ar: "طلب مرافقة مرورية لموكب", en: "Motorcade Traffic Escort",
      dAr: "مرافقة دوريات المرور لموكب البعثة.", dEn: "Traffic patrol escort for a mission motorcade.",
      fields: [F.date("date", "التاريخ", "Date"), F.time("time", "وقت الانطلاق", "Departure time"),
               F.text("fromLoc", "نقطة الانطلاق", "From"), F.text("toLoc", "الوجهة", "To"),
               F.num("cars", "عدد المركبات", "Number of vehicles")] },
    // تشريفات المطار
    { id: "a1", cat: "airport", sla: 24, permit: false,
      ar: "استقبال الوفود الدبلوماسية", en: "Delegation Reception",
      dAr: "استقبال الوفود الرسمية في مطار دبي.", dEn: "Receiving official delegations at Dubai Airport.",
      fields: [F.text("delegation", "اسم الوفد", "Delegation"), F.text("flight", "رقم الرحلة", "Flight no."),
               F.date("date", "تاريخ الوصول", "Arrival date"), F.time("time", "وقت الوصول", "Arrival time"),
               F.sel("terminal", "المبنى", "Terminal", [["المبنى 1","Terminal 1"],["المبنى 2","Terminal 2"],["المبنى 3","Terminal 3"]]),
               F.num("count", "عدد أعضاء الوفد", "Delegation size")] },
    { id: "a2", cat: "airport", sla: 24, permit: false,
      ar: "فتح صالة كبار الشخصيات", en: "VIP Lounge Opening",
      dAr: "حجز وفتح صالة كبار الشخصيات للشخصيات الرسمية.", dEn: "Opening the VIP lounge for official guests.",
      fields: [F.text("guest", "اسم الشخصية / الصفة", "Guest name / title"), F.text("flight", "رقم الرحلة", "Flight no."),
               F.date("date", "التاريخ", "Date"), F.time("time", "الوقت", "Time"), F.num("count", "عدد المرافقين", "Companions")] },
    { id: "a3", cat: "airport", sla: 12, permit: true,
      ar: "تصريح دخول مركبات لساحة المطار", en: "Airport Apron Vehicle Permit",
      dAr: "تصريح دخول مركبات البعثة إلى ساحة المطار.", dEn: "Permit for mission vehicles to access the airport apron.",
      fields: [F.text("plate", "رقم المركبة", "Vehicle plate"), F.text("driver", "اسم السائق", "Driver name"),
               F.date("date", "التاريخ", "Date"), F.text("purpose", "الغرض", "Purpose")] },
    { id: "a4", cat: "airport", sla: 12, permit: false,
      ar: "تسريع وتخليص معاملات الدبلوماسيين", en: "Fast-track Clearance",
      dAr: "تسريع إجراءات الدبلوماسيين في المطار.", dEn: "Fast-track airport procedures for diplomats.",
      fields: [F.text("person", "اسم الدبلوماسي", "Diplomat name"), F.text("flight", "رقم الرحلة", "Flight no."),
               F.date("date", "التاريخ", "Date"), F.area("details", "تفاصيل المعاملة", "Details", true)] },
    // السجن المركزي
    { id: "p1", cat: "prison", sla: 48, permit: true,
      ar: "تصريح زيارة رعايا في السجن المركزي", en: "Consular Prison Visit Permit",
      dAr: "تصريح زيارة البعثة لرعاياها النزلاء.", dEn: "Permit for consular visits to nationals in custody.",
      fields: [F.text("inmate", "اسم النزيل", "Inmate name"), F.text("inmateNo", "رقم النزيل (إن وجد)", "Inmate no. (if known)", false),
               F.area("visitors", "أسماء الزوار (كل اسم في سطر)", "Visitors (one per line)", true), F.date("date", "التاريخ المفضل", "Preferred date")] },
    { id: "p2", cat: "prison", sla: 48, permit: false,
      ar: "حجز غرفة زيارة خاصة", en: "Private Visit Room Booking",
      dAr: "تخصيص غرفة زيارة خاصة للهيئات الدبلوماسية.", dEn: "Private visit room for diplomatic missions.",
      fields: [F.date("date", "التاريخ", "Date"), F.time("time", "الوقت", "Time"), F.num("visitors", "عدد الزوار", "Number of visitors")] },
    { id: "p3", cat: "prison", sla: 72, permit: false,
      ar: "متابعة الإجراءات القانونية للنزلاء", en: "Inmate Legal Procedures",
      dAr: "تقديم ومتابعة الإجراءات القانونية للنزلاء التابعين للبعثة.", dEn: "Legal procedures for inmates affiliated with the mission.",
      fields: [F.text("inmate", "اسم النزيل", "Inmate name"),
               F.sel("kind", "نوع الإجراء", "Procedure", [["طلب معلومات عن القضية","Case information"],["توكيل محامٍ","Lawyer authorisation"],["تسليم مستندات","Document delivery"],["أخرى","Other"]]),
               F.area("details", "التفاصيل", "Details", true)] },
    // طارئ
    { id: "e1", cat: "emergency", sla: 0.25, permit: false, hidden: true,
      ar: "بلاغ طارئ", en: "Emergency report", dAr: "", dEn: "",
      fields: [] }
  ];

  /* ---------- البعثات التجريبية (بيانات وهمية) ---------- */
  const MISSIONS = {
    m1: { ar: "القنصلية العامة لجمهورية ألفا", en: "Consulate General of the Republic of Alpha", type: "قنصلية عامة",
          officer: "السيد/ أندرو مارتن", phone: "04 000 1101", natDay: "11-20", lat: 25.2445, lng: 55.3009 },
    m2: { ar: "القنصلية العامة لمملكة بيتا", en: "Consulate General of the Kingdom of Beta", type: "قنصلية عامة",
          officer: "السيدة/ لينا هوفمان", phone: "04 000 1102", natDay: "12-14", lat: 25.2353, lng: 55.3109 },
    m3: { ar: "القنصلية العامة لجمهورية غاما", en: "Consulate General of the Republic of Gamma", type: "قنصلية عامة",
          officer: "السيد/ كارلوس ريّس", phone: "04 000 1103", natDay: "03-08", lat: 25.2186, lng: 55.2775 },
    m4: { ar: "القنصلية العامة لاتحاد دلتا", en: "Consulate General of the Delta Federation", type: "قنصلية عامة",
          officer: "السيد/ هيروشي تاناكا", phone: "04 000 1104", natDay: "07-01", lat: 25.2602, lng: 55.3171 }
  };

  /* ---------- الحالات ---------- */
  const STATUSES = {
    new:        { ar: "جديد", en: "Submitted", color: "#2563eb" },
    review:     { ar: "قيد الدراسة", en: "Under review", color: "#b7791f" },
    approved:   { ar: "معتمد", en: "Approved", color: "#018556" },
    inprogress: { ar: "قيد التنفيذ", en: "In progress", color: "#7c3aed" },
    completed:  { ar: "مكتمل", en: "Completed", color: "#00492c" },
    rejected:   { ar: "مرفوض", en: "Rejected", color: "#c53030" }
  };
  const FLOW = ["new", "review", "approved", "inprogress", "completed"];

  /* ---------- أدوات مساعدة ---------- */
  const svc = id => SERVICES.find(s => s.id === id);
  const HOUR = 3600e3, DAY = 24 * HOUR;
  const pad = n => String(n).padStart(2, "0");
  function fmtDate(ms, withTime = true) {
    if (!ms) return "—";
    const d = new Date(ms);
    const s = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    return withTime ? `${s} – ${pad(d.getHours())}:${pad(d.getMinutes())}` : s;
  }
  function makeRef() {
    const d = new Date();
    return `DIP-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  function makePermitCode() {
    const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = "";
    for (let i = 0; i < 8; i++) s += c[Math.floor(Math.random() * c.length)];
    return s.slice(0, 4) + "-" + s.slice(4);
  }
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }
  // الوقت المتبقي على مهلة الإنجاز
  function slaInfo(r) {
    const due = r.createdAt + r.slaHours * HOUR;
    const end = r.completedAt || (["rejected"].includes(r.status) ? r.updatedAt : Date.now());
    const left = due - end;
    const done = !!r.completedAt || r.status === "rejected";
    return { due, left, late: left < 0, done };
  }
  function fmtDur(ms) {
    const neg = ms < 0; ms = Math.abs(ms);
    const d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / HOUR), m = Math.floor((ms % HOUR) / 60e3);
    const s = d ? `${d}ي ${h}س` : h ? `${h}س ${m}د` : `${m}د`;
    return (neg ? "-" : "") + s;
  }

  /* ---------- بيانات تجريبية للبداية ---------- */
  function seedRequests() {
    const now = Date.now();
    const mk = (mission, sid, ageH, status, fields, extra = {}) => {
      const s = svc(sid), created = now - ageH * HOUR;
      const r = {
        id: "seed-" + Math.random().toString(36).slice(2, 10), ref: makeRef(), missionId: mission,
        missionName: MISSIONS[mission].ar, serviceId: sid, category: s.cat, unit: CATEGORIES[s.cat].unit,
        fields, location: extra.location || null, attachments: extra.attachments || [],
        status: "new", urgent: sid === "e1", slaHours: s.sla, createdAt: created, updatedAt: created,
        history: [{ status: "new", at: created, by: MISSIONS[mission].ar, note: "" }], notes: []
      };
      const idx = FLOW.indexOf(status);
      const steps = status === "rejected" ? ["review", "rejected"] : FLOW.slice(1, idx + 1);
      let t = created;
      steps.forEach((st, i) => {
        t += (extra.speed || 0.45) * s.sla * HOUR / steps.length;
        r.history.push({ status: st, at: Math.min(t, now - 60e3), by: "ضابط المناوبة", note: st === "rejected" ? "الطلب يحتاج مخاطبة رسمية عن طريق وزارة الخارجية." : "" });
      });
      r.status = status; r.updatedAt = r.history[r.history.length - 1].at;
      if (status === "rejected") r.rejectReason = "الطلب يحتاج مخاطبة رسمية عن طريق وزارة الخارجية.";
      if (s.permit && ["approved", "inprogress", "completed"].includes(status)) r.permitCode = makePermitCode();
      if (status === "completed") { r.completedAt = r.updatedAt; if (extra.rating) { r.rating = extra.rating; r.ratingNote = extra.ratingNote || ""; } }
      return r;
    };
    const L = (m) => ({ lat: MISSIONS[m].lat + (Math.random() - .5) * .02, lng: MISSIONS[m].lng + (Math.random() - .5) * .02, label: "" });
    return [
      mk("m1", "s2", 3, "new", { event: "احتفال اليوم الوطني", date: "2026-11-20", tfrom: "19:00", tto: "23:00", guests: "350", vip: "نعم", notes: "حضور السفير وعدد من رؤساء البعثات" }, { location: L("m1") }),
      mk("m2", "a1", 7, "review", { delegation: "وفد وزارة التجارة", flight: "EK 0000", date: "2026-11-09", time: "14:30", terminal: "المبنى 3", count: "6" }),
      mk("m3", "s3", 20, "approved", { area: "منطقة الميناء – البوابة 4", date: "2026-11-07", persons: "ماريا لوبيز\nخوان بيريز", plate: "دبلوماسي 1234", purpose: "زيارة سفينة تحمل علم الدولة" }),
      mk("m4", "t2", 26, "inprogress", { date: "2026-11-06", time: "09:00", fromLoc: "مقر القنصلية – بر دبي", toLoc: "مركز دبي التجاري العالمي", cars: "4" }),
      mk("m1", "p1", 60, "completed", { inmate: "نزيل تجريبي (أ)", inmateNo: "", visitors: "القنصل العام\nالملحق القانوني", date: "2026-11-02" }, { rating: 5, ratingNote: "خدمة سريعة ومنظمة" }),
      mk("m2", "t1", 110, "completed", { kind: "تجديد", vehicle: "سيارة صالون – 2024", chassis: "XXXXXXXX0000", plate: "دبلوماسي 5678" }, { rating: 4 }),
      mk("m3", "a3", 130, "completed", { plate: "دبلوماسي 2211", driver: "سائق تجريبي", date: "2026-10-30", purpose: "استقبال وفد رسمي" }, { rating: 5, speed: 0.6 }),
      mk("m4", "s1", 200, "completed", { facility: "سكن القنصل العام", ftype: "سكن رئيس البعثة", from: "2026-10-25", to: "2026-10-28", reason: "زيارة رسمية لوزير الخارجية" }, { location: L("m4"), rating: 4, speed: 0.9 }),
      mk("m1", "a2", 250, "completed", { guest: "نائب وزير الخارجية", flight: "EK 0001", date: "2026-10-24", time: "02:15", count: "3" }, { rating: 5 }),
      mk("m2", "p3", 90, "rejected", { inmate: "نزيل تجريبي (ب)", kind: "تسليم مستندات", details: "تسليم وثائق سفر" }),
      mk("m3", "s4", 300, "completed", { vipTitle: "رئيس البرلمان", arrive: "2026-10-22", days: "2", program: "زيارة رسمية ولقاءات" }, { location: L("m3"), rating: 3, speed: 1.3 }),
      mk("m4", "a4", 15, "review", { person: "دبلوماسي تجريبي", flight: "EK 0002", date: "2026-11-05", details: "تخليص إجراءات حقيبة دبلوماسية" })
    ];
  }

  /* ============================================================
     طبقة الحفظ — محلي
     ============================================================ */
  const LS_KEY = "dip-platform-requests-v1";
  const LocalStore = {
    mode: "local", picker: true,
    _subs: [],
    _read() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) { return null; } },
    _write(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {} this._emit(); },
    _emit() { const l = this._read() || []; this._subs.forEach(fn => fn(l)); },
    async init() {
      if (!this._read()) this._write(seedRequests());
      window.addEventListener("storage", e => { if (e.key === LS_KEY) this._emit(); });
    },
    subscribe(fn) { this._subs.push(fn); fn(this._read() || []); return () => { this._subs = this._subs.filter(f => f !== fn); }; },
    async add(r) { const l = this._read() || []; r.id = "r-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6); l.push(r); this._write(l); return r; },
    async update(id, patch) { const l = this._read() || []; const i = l.findIndex(x => x.id === id); if (i > -1) { l[i] = Object.assign({}, l[i], patch); this._write(l); } },
    async reset() { this._write(seedRequests()); },
    async seed() { const l = this._read() || []; this._write(l.concat(seedRequests())); },
    // تسجيل الدخول في الوضع المحلي = اختيار الحساب فقط
    async signIn(id) { return { id }; },
    async signOut() {}
  };

  /* ============================================================
     طبقة الحفظ — Firebase (Firestore)
     ============================================================ */
  const FB_VER = "10.12.2";
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("تعذر تحميل " + src)); document.head.appendChild(s); });
  }
  const FireStore = {
    mode: "firebase",
    // دخول بالاختيار (Anonymous) في التشغيل التجريبي، أو بالبريد وكلمة المرور إذا useEmailLogin = true
    picker: !(window.APP_CONFIG && window.APP_CONFIG.useEmailLogin),
    db: null, auth: null,
    async init() {
      const base = `https://www.gstatic.com/firebasejs/${FB_VER}/`;
      await loadScript(base + "firebase-app-compat.js");
      await loadScript(base + "firebase-auth-compat.js");
      await loadScript(base + "firebase-firestore-compat.js");
      firebase.initializeApp(window.APP_CONFIG.firebase);
      this.db = firebase.firestore(); this.auth = firebase.auth();
      if (this.picker) {
        await new Promise(res => { const off = this.auth.onAuthStateChanged(() => { off(); res(); }); });
        if (!this.auth.currentUser) await this.auth.signInAnonymously();
      }
    },
    onAuth(fn) { return this.auth.onAuthStateChanged(fn); },
    subscribe(fn, missionId) {
      let q = this.db.collection("requests");
      if (missionId) q = q.where("missionId", "==", missionId);
      return q.onSnapshot(snap => fn(snap.docs.map(d => Object.assign({ id: d.id }, d.data()))),
        err => { console.error(err); window.UI && UI.toast("خطأ في الاتصال بقاعدة البيانات: " + err.message, "err"); });
    },
    async add(r) { const ref = await this.db.collection("requests").add(r); r.id = ref.id; return r; },
    async update(id, patch) { await this.db.collection("requests").doc(id).update(patch); },
    async seed() { const b = this.db.batch(); seedRequests().forEach(r => { const id = r.id; delete r.id; b.set(this.db.collection("requests").doc(id), r); }); await b.commit(); },
    async signIn(email, pass) { if (this.picker) return { id: email }; return this.auth.signInWithEmailAndPassword(email, pass); },
    async signOut() { if (!this.picker) return this.auth.signOut(); }
  };

  const cfg = (window.APP_CONFIG && window.APP_CONFIG.firebase) || {};
  const Store = cfg.apiKey ? FireStore : LocalStore;

  window.DIP = { UNITS, CATEGORIES, SERVICES, MISSIONS, STATUSES, FLOW, svc, fmtDate, makeRef, makePermitCode, esc, slaInfo, fmtDur, HOUR, DAY, Store };
})();

/* ============================================================
   أدوات الواجهة المشتركة
   ============================================================ */
window.UI = {
  icons: {
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
    car: '<path d="M5 17h14M6 17v2M18 17v2M4 13l2-5a2 2 0 0 1 1.9-1.4h8.2A2 2 0 0 1 18 8l2 5v4H4v-4z"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>',
    plane: '<path d="M10.5 13.5L3 11l1-2 8 1 4-5c1-1 2.5-1.5 3-1s0 2-1 3l-5 4 1 8-2 1-2.5-7.5z"/>',
    building: '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6M4 21h16M8 10h1M15 10h1M8 13h1M15 13h1"/>',
    alert: '<path d="M12 3l9.5 16.5h-19L12 3z"/><path d="M12 10v4M12 17.5v.01"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9L12 3z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
    clip: '<path d="M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'
  },
  ic(name, cls = "") { return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${this.icons[name] || ""}</svg>`; },
  toast(msg, kind = "ok") {
    let box = document.getElementById("toasts");
    if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.appendChild(box); }
    const t = document.createElement("div"); t.className = "toast " + kind; t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.classList.add("out"), 3800); setTimeout(() => t.remove(), 4300);
  },
  beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, .25, .5].forEach(d => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(.15, ctx.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d + .2); o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + .2); });
    } catch (e) {}
  },
  statusBadge(st, lang = "ar") {
    const s = DIP.STATUSES[st] || {};
    const x = window.I18N && window.I18N[lang] && window.I18N[lang].st[st];
    return `<span class="badge" style="--c:${s.color}">${lang === "ar" ? s.ar : (x || s.en)}</span>`;
  },
  modeBanner() {
    if (DIP.Store.mode === "local") {
      return `<div class="mode-banner">${this.ic("alert")} وضع تجريبي محلي — البيانات وهمية وتنحفظ في هذا المتصفح فقط. افتح المنصتين في تبويبين على نفس الجهاز للتجربة، أو اربطها بـ Firebase للتشغيل من أكثر من جهاز.</div>`;
    }
    return `<div class="mode-banner live">${this.ic("check")} متصل بقاعدة البيانات (تشغيل تجريبي — بيانات وهمية فقط)</div>`;
  }
};
