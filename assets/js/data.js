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
    events: { ar: "لجنة تأمين الفعاليات", en: "Events Security Committee" },
    ops:    { ar: "غرفة العمليات", en: "Command & Control Center" },
    coord:  { ar: "المنسق الرئيسي", en: "Main Coordinator" }
  };
  // مصدر الطلب
  const SOURCES = {
    mofa:   { ar: "منصة وزارة الخارجية", en: "MOFA platform" },
    direct: { ar: "مباشر — زر الطوارئ", en: "Direct — emergency button" }
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
    { id: "s2", cat: "security", sla: 72, permit: false, unit: "events",
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

  /* ---------- كشف القنصليات (assets/js/sites.js) ---------- */
  const SITES0 = (window.DIP_SITES || []).map(x => Object.assign({}, x));
  const SITE = Object.fromEntries(SITES0.map(x => [x.id, x]));
  // تصحيحات تُطبَّق مرة واحدة على الكشف المحفوظ مسبقاً
  const SITES_VER = 2;
  const SITE_PATCHES = { 2: [{ id: "c-cn", lat: 25.255487, lng: 55.309726, note: "إحداثيات من خرائط جوجل (مجمع القناصل — أم هرير)" }] };
  function patchSites(list, from) {
    for (let v = (from || 1) + 1; v <= SITES_VER; v++) (SITE_PATCHES[v] || []).forEach(pt => { const x = list.find(y => y.id === pt.id); if (x) Object.assign(x, pt); });
    return list;
  }

  /* ---------- القنصليات المتاحة لتسجيل الدخول في التشغيل التجريبي ----------
     الأسماء والمواقع من الكشف · أسماء القناصل افتراضية · منزل القنصل داخل مبنى القنصلية */
  const LOGIN = {
    "c-us": { en: "Consulate General of the United States of America", consul: "السيد/ ماركوس فيلدر", officer: "السيد/ يوناس بيرغ", phone: "04 000 1101", natDay: "07-04" },
    "c-in": { en: "Consulate General of India", consul: "السيد/ رافاييل مونتيرو", officer: "السيدة/ صوفيا لاريا", phone: "04 000 1103", natDay: "08-15" },
    "c-fr": { en: "Consulate General of France", consul: "السيد/ داميان كروز", officer: "السيد/ بابلو ريفيرا", phone: "04 000 1107", natDay: "07-14" },
    "c-kr": { en: "Consulate General of the Republic of Korea", consul: "السيد/ أدريان بوبيسكو", officer: "السيدة/ إيوانا مارين", phone: "04 000 1109", natDay: "10-03" },
    "c-eg": { en: "Consulate General of the Arab Republic of Egypt", consul: "السيد/ هنري دوبوا", officer: "السيدة/ كلارا موريه", phone: "04 000 1110", natDay: "07-23" }
  };
  const MISSIONS = {};
  Object.entries(LOGIN).forEach(([id, x]) => {
    const st = SITE[id]; if (!st) return;
    MISSIONS[id] = Object.assign({ ar: st.name, type: "قنصلية عامة", code: st.code, area: st.area, address: st.address, lat: st.lat, lng: st.lng,
      cons: { lat: st.lat, lng: st.lng }, res: { lat: st.lat, lng: st.lng, same: true } }, x);
  });
  const FACILITIES = [], FAC_TYPES = {};

  /* ---------- الحالات ---------- */
  const STATUSES = {
    new:        { ar: "جديد", en: "Submitted", color: "#2563eb" },
    review:     { ar: "قيد الدراسة", en: "Under review", color: "#b7791f" },
    approved:   { ar: "معتمد", en: "Approved", color: "#018556" },
    inprogress: { ar: "قيد التنفيذ", en: "In progress", color: "#7c3aed" },
    completed:  { ar: "مكتمل", en: "Completed", color: "#00492c" },
    rejected:   { ar: "اعتذار", en: "Declined", color: "#c53030" }
  };
  const FLOW = ["new", "review", "approved", "inprogress", "completed"];

  /* ---------- أدوات مساعدة ---------- */
  const svc = id => SERVICES.find(s => s.id === id);
  const unitFor = s => s.unit || CATEGORIES[s.cat].unit;
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
    const s = d ? `${d} يوم ${h} س` : h ? `${h} س ${m} د` : `${m} د`;
    return (neg ? "-" : "") + s;
  }

  /* ---------- بيانات تجريبية للبداية ---------- */
  function seedRequests() {
    const now = Date.now();
    const mk = (mission, sid, ageH, status, fields, extra = {}) => {
      const s = svc(sid), created = now - ageH * HOUR, urgent = sid === "e1";
      const r = {
        id: "seed-" + Math.random().toString(36).slice(2, 10), ref: urgent ? makeRef().replace("DIP", "SOS") : makeRef(), missionId: mission,
        missionName: SITE[mission].name, serviceId: sid, category: s.cat, unit: extra.unit || unitFor(s), source: urgent ? "direct" : "mofa",
        fields, location: extra.location || null, attachments: [], photos: [],
        status: "new", urgent, slaHours: s.sla, createdAt: created, updatedAt: created,
        history: [{ status: "new", at: created, by: SITE[mission].name, note: urgent ? "بلاغ طارئ — وصل مباشرة" : "وارد من منصة وزارة الخارجية" }], notes: []
      };
      const idx = FLOW.indexOf(status);
      const steps = status === "rejected" ? ["review", "rejected"] : FLOW.slice(1, idx + 1);
      let t = created;
      if (!urgent && r.unit !== "coord") { t += 0.05 * s.sla * HOUR; r.history.push({ status: "new", at: t, by: "المنسق الرئيسي", note: "وُجِّه إلى " + UNITS[r.unit].ar }); }
      steps.forEach(st => {
        t += (extra.speed || 0.45) * s.sla * HOUR / steps.length;
        r.history.push({ status: st, at: Math.min(t, now - 60e3), by: "ضابط المناوبة", note: st === "rejected" ? "يتطلب الطلب مخاطبة رسمية عبر وزارة الخارجية." : "" });
      });
      r.status = status; r.updatedAt = r.history[r.history.length - 1].at;
      if (status === "rejected") r.rejectReason = "يتطلب الطلب مخاطبة رسمية عبر وزارة الخارجية.";
      if (s.permit && ["approved", "inprogress", "completed"].includes(status)) r.permitCode = makePermitCode();
      if (status === "completed") { r.completedAt = r.updatedAt; if (extra.rating) { r.rating = extra.rating; r.ratingNote = extra.ratingNote || ""; } }
      if (extra.report) r.report = Object.assign({ at: r.updatedAt, by: "ضابط المناوبة", photos: [] }, extra.report);
      return r;
    };
    const L = m => ({ lat: SITE[m].lat, lng: SITE[m].lng, label: "مقر القنصلية" });
    return [
      mk("c-gb", "s2", 3, "new", { event: "حفل استقبال رسمي", date: "2026-11-20", tfrom: "19:00", tto: "23:00", guests: "350", vip: "نعم", notes: "حضور القنصل العام وعدد من رؤساء البعثات" }, { location: L("c-gb"), unit: "coord" }),
      mk("c-ru", "a2", 1.5, "new", { guest: "وزير الخارجية", flight: "EK 0003", date: "2026-11-09", time: "08:40", count: "4" }, { unit: "coord" }),
      mk("c-sa", "a1", 7, "review", { delegation: "وفد وزارة التجارة", flight: "EK 0000", date: "2026-11-09", time: "14:30", terminal: "المبنى 3", count: "6" }),
      mk("c-de", "s3", 20, "approved", { area: "منطقة الميناء — البوابة 4", date: "2026-11-07", persons: "ماريا لوبيز\nخوان بيريز", plate: "دبلوماسي 1234", purpose: "زيارة سفينة ترفع علم الدولة" }),
      mk("c-pk", "t2", 26, "inprogress", { date: "2026-11-06", time: "09:00", fromLoc: "مقر القنصلية — ديرة", toLoc: "مركز دبي التجاري العالمي", cars: "4" }),
      mk("c-it", "s1", 40, "inprogress", { facility: "مقر القنصلية العامة", ftype: "مقر البعثة", from: "2026-11-05", to: "2026-11-08", reason: "زيارة رسمية لوفد رفيع المستوى" }, { location: L("c-it") }),
      mk("c-gb", "p1", 60, "completed", { inmate: "نزيل افتراضي (أ)", inmateNo: "", visitors: "القنصل العام\nالملحق القانوني", date: "2026-11-02" }, { rating: 5, ratingNote: "خدمة سريعة ومنظمة" }),
      mk("c-sa", "t1", 110, "completed", { kind: "تجديد", vehicle: "سيارة صالون — 2024", chassis: "XXXXXXXX0000", plate: "دبلوماسي 5678" }, { rating: 4 }),
      mk("c-jp", "a3", 130, "completed", { plate: "دبلوماسي 2211", driver: "سائق افتراضي", date: "2026-10-30", purpose: "استقبال وفد رسمي" }, { rating: 5, speed: 0.6 }),
      mk("c-tr", "s1", 200, "completed", { facility: "مقر القنصلية العامة", ftype: "مقر البعثة", from: "2026-10-25", to: "2026-10-28", reason: "زيارة رسمية لوزير الخارجية" },
        { location: L("c-tr"), rating: 4, speed: 0.9, report: { date: "2026-10-28", tfrom: "07:00", tto: "22:00", leader: "النقيب/ ضابط افتراضي", members: "8", patrols: "3", summary: "نُفِّذت خطة التأمين وفق المخطط، وتمت تغطية محيط المنزل على مدار فترة الزيارة دون تسجيل أي ملاحظات أمنية.", remarks: "تعاون ممتاز من ضابط الاتصال في البعثة.", recs: "التنسيق المسبق لمواقف المركبات المرافقة." } }),
      mk("c-de", "s2", 250, "completed", { event: "حفل استقبال رسمي", date: "2026-10-24", tfrom: "19:00", tto: "22:30", guests: "220", vip: "نعم", notes: "" },
        { location: L("c-de"), rating: 5, report: { date: "2026-10-24", tfrom: "17:30", tto: "23:00", leader: "الملازم أول/ ضابط افتراضي", members: "12", patrols: "4", summary: "تم تأمين موقع الفعالية والمداخل وتنظيم حركة الدخول، وانتهت الفعالية بسلام.", remarks: "ارتفاع الحضور عن العدد المتوقع بنسبة بسيطة.", recs: "زيادة عدد البوابات في الفعاليات التي يتجاوز حضورها 200 شخص." } }),
      mk("c-sa", "p3", 90, "rejected", { inmate: "نزيل افتراضي (ب)", kind: "تسليم مستندات", details: "تسليم وثائق سفر" }),
      mk("c-au", "s4", 300, "completed", { vipTitle: "رئيس البرلمان", arrive: "2026-10-22", days: "2", program: "زيارة رسمية ولقاءات" }, { location: L("c-au"), rating: 3, speed: 1.3 }),
      mk("c-ch", "e1", 140, "completed", { type: "تجمهر أمام المقر", desc: "تجمع عدد من الأشخاص أمام مدخل القنصلية.", where: "cons" }, { location: L("c-ch"), speed: 4,
        report: { date: "2026-10-31", tfrom: "10:05", tto: "10:50", leader: "ضابط المناوبة", members: "6", patrols: "2", summary: "وصلت الدوريات خلال 7 دقائق، وتم تفريق التجمع بهدوء دون إصابات أو أضرار.", remarks: "", recs: "تكثيف الدوريات في محيط القنصلية خلال الأسبوع." } }),
      mk("c-pk", "a4", 15, "review", { person: "دبلوماسي افتراضي", flight: "EK 0002", date: "2026-11-05", details: "تخليص إجراءات حقيبة دبلوماسية" })
    ];
  }

  /* ============================================================
     طبقة الحفظ — محلي
     ============================================================ */
  const LS_KEY = "dip-platform-requests-v1", SITES_KEY = "dip-sites-v1";
  const LocalStore = {
    mode: "local", picker: true,
    _subs: [],
    _read() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) { return null; } },
    _write(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {} this._emit(); },
    _emit() { const l = this._read() || []; this._subs.forEach(fn => fn(l)); },
    async init() {
      if (!this._read()) { this._write(seedRequests()); try { localStorage.setItem("dip-seed-v5", "1"); } catch (e) {} }
      else { try { if (!localStorage.getItem("dip-seed-v5")) { this._write(seedRequests()); localStorage.setItem("dip-seed-v5", "1"); } } catch (e) {} }
      window.addEventListener("storage", e => { if (e.key === LS_KEY) this._emit(); });
    },
    subscribe(fn) { this._subs.push(fn); fn(this._read() || []); return () => { this._subs = this._subs.filter(f => f !== fn); }; },
    async add(r) { const l = this._read() || []; r.id = "r-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6); l.push(r); this._write(l); return r; },
    async update(id, patch) { const l = this._read() || []; const i = l.findIndex(x => x.id === id); if (i > -1) { l[i] = Object.assign({}, l[i], patch); this._write(l); } },
    async reset() { this._write(seedRequests()); },
    async clear() { this._write([]); },
    async seed() { const l = this._read() || []; this._write(l.concat(seedRequests())); },
    // تسجيل الدخول في الوضع المحلي = اختيار الحساب فقط
    async signIn(id) { return { id }; },
    async signOut() {},
    // كشف المواقع
    _sitesRead() {
      try { const v = JSON.parse(localStorage.getItem(SITES_KEY) || "null");
        if (Array.isArray(v)) { const ver = +localStorage.getItem(SITES_KEY + "-ver") || 1;
          if (ver < SITES_VER) { patchSites(v, ver); localStorage.setItem(SITES_KEY, JSON.stringify(v)); localStorage.setItem(SITES_KEY + "-ver", SITES_VER); }
          return v; } } catch (e) {}
      return SITES0.map(x => Object.assign({}, x)); },
    _siteSubs: [],
    subscribeSites(fn) { this._siteSubs.push(fn); fn(this._sitesRead());
      if (!this._sitesBound) { this._sitesBound = true; window.addEventListener("storage", e => { if (e.key === SITES_KEY) { const l = this._sitesRead(); this._siteSubs.forEach(f => f(l)); } }); }
      return () => { this._siteSubs = this._siteSubs.filter(f => f !== fn); }; },
    async saveSites(list) { try { localStorage.setItem(SITES_KEY, JSON.stringify(list)); localStorage.setItem(SITES_KEY + "-ver", SITES_VER); } catch (e) {} this._siteSubs.forEach(f => f(list)); }
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
      return q.onSnapshot(snap => fn(snap.docs.filter(d => d.id[0] !== "_").map(d => Object.assign({ id: d.id }, d.data()))),
        err => { console.error(err); window.UI && UI.toast("خطأ في الاتصال بقاعدة البيانات: " + err.message, "err"); });
    },
    async add(r) { const ref = await this.db.collection("requests").add(r); r.id = ref.id; return r; },
    async update(id, patch) { await this.db.collection("requests").doc(id).update(patch); },
    async seed() { const b = this.db.batch(); seedRequests().forEach(r => { const id = r.id; delete r.id; b.set(this.db.collection("requests").doc(id), r); }); await b.commit(); },
    async clear() {
      const snap = await this.db.collection("requests").get();
      for (let i = 0; i < snap.docs.length; i += 400) { const b = this.db.batch(); snap.docs.slice(i, i + 400).forEach(d => { if (d.id[0] !== "_") b.delete(d.ref); }); await b.commit(); }
    },
    async signIn(email, pass) { if (this.picker) return { id: email }; return this.auth.signInWithEmailAndPassword(email, pass); },
    async signOut() { if (!this.picker) return this.auth.signOut(); },
    // كشف المواقع: مستند واحد داخل مجموعة الطلبات (requests/_sites) ضمن قواعد الحماية الحالية
    _sitesDoc() { return this.db.collection("requests").doc("_sites"); },
    subscribeSites(fn) {
      return this._sitesDoc().onSnapshot(d => {
        if (!d.exists) { this._sitesDoc().set({ list: SITES0, ver: SITES_VER, updatedAt: Date.now() }); fn(SITES0.map(x => Object.assign({}, x))); return; }
        const data = d.data(), list = (data.list || []).map(x => Object.assign({}, x));
        if ((data.ver || 1) < SITES_VER) { patchSites(list, data.ver || 1); this._sitesDoc().set({ list, ver: SITES_VER, updatedAt: Date.now() }).catch(() => {}); }
        fn(list);
      }, err => { console.error(err); window.UI && UI.toast("تعذر تحميل كشف المواقع: " + err.message, "err"); });
    },
    async saveSites(list) { await this._sitesDoc().set({ list: JSON.parse(JSON.stringify(list)), ver: SITES_VER, updatedAt: Date.now() }); }
  };

  const cfg = (window.APP_CONFIG && window.APP_CONFIG.firebase) || {};
  const Store = cfg.apiKey ? FireStore : LocalStore;

  window.DIP = { UNITS, SOURCES, CATEGORIES, SERVICES, MISSIONS, SITES0, SITE, FACILITIES, FAC_TYPES, STATUSES, FLOW, svc, unitFor, fmtDate, makeRef, makePermitCode, esc, slaInfo, fmtDur, HOUR, DAY, Store };
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
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    report: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
    house: '<path d="M3 11l9-7 9 7"/><path d="M6 9.5V20h12V9.5M10 20v-5h4v5"/>',
    pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'
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
  /* ضغط صورة قبل حفظها (تُحفظ داخل قاعدة البيانات في التشغيل التجريبي) */
  compressImage(file, max = 1000, q = 0.62) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { const img = new Image(); img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", q)); };
        img.onerror = rej; img.src = fr.result; };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  },
  /* ============================================================
     خرائط Esri (ArcGIS JS 4.30): «الشوارع ليلاً» + «أقمار صناعية»، بأسماء عربية
     ============================================================ */
  _esri: null,
  esri() {
    if (this._esri) return this._esri;
    this._esri = new Promise((res, rej) => {
      const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://js.arcgis.com/4.30/esri/themes/dark/main.css"; document.head.appendChild(css);
      const go = () => window.require(["esri/Map", "esri/views/MapView", "esri/Graphic", "esri/layers/GraphicsLayer", "esri/config", "esri/intl", "esri/layers/FeatureLayer"],
        (Map, MapView, Graphic, GraphicsLayer, config, intl, FeatureLayer) => { try { intl.setLocale("ar"); } catch (e) {} res({ Map, MapView, Graphic, GraphicsLayer, FeatureLayer }); }, rej);
      if (window.require && window.require.on) return go();
      const sc = document.createElement("script"); sc.src = "https://js.arcgis.com/4.30/"; sc.onload = go; sc.onerror = () => rej(new Error("تعذّر تحميل الخارطة")); document.head.appendChild(sc);
    });
    return this._esri;
  },
  // تعريب أسماء الشوارع والمناطق وإخفاء لوحات أرقام الطرق
  async _arabize(map) {
    try {
      await map.basemap.load();
      const layers = [...map.basemap.baseLayers.toArray(), ...map.basemap.referenceLayers.toArray()].filter(l => l.type === "vector-tile");
      for (const l of layers) {
        await l.load(); const st = l.currentStyleInfo && l.currentStyleInfo.style; if (!st) continue;
        for (const sl of st.layers) {
          const ic = sl.layout && sl.layout["icon-image"];
          if (sl.type === "symbol" && ic && /shield|route|highway|motorway|road/i.test(sl.id + " " + JSON.stringify(ic))) {
            const cur = l.getStyleLayer(sl.id); if (cur && (cur.layout.visibility || "visible") !== "none") { cur.layout.visibility = "none"; l.setStyleLayer(cur); } continue;
          }
          const tf = sl.layout && sl.layout["text-field"]; if (typeof tf !== "string" || !/\{_name/.test(tf)) continue;
          const want = tf.replace(/\{_name(_global|_en)?\}/g, "{_name_ar}");
          const cur = l.getStyleLayer(sl.id); if (cur && cur.layout["text-field"] !== want) { cur.layout["text-field"] = want; l.setStyleLayer(cur); }
        }
      }
    } catch (e) { console.warn("arabize", e); }
  },
  /* أيقونات الخريطة (النموذج د): بلاطات مستديرة الزوايا بتدرج وإطار ذهبي */
  MAPK: {
    mission: { c: "#0e8f5e", l: "هيئة دبلوماسية", g: '<path d="M4 21V9l8-5 8 5v12M9 21v-6h6v6M3 21h18" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
    res:     { c: "#0ea5a4", l: "منزل قنصل", g: '<path d="M3 11l9-7 9 7M6 9.5V20h12V9.5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
    fac:     { c: "#c9a24e", l: "منشأة هامة", g: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" fill="#fff"/>' },
    req:     { c: "#7c5cff", l: "طلب جارٍ", g: '<circle cx="12" cy="12" r="7.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 8v4.5l3 2" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>' },
    done:    { c: "#64748b", l: "طلب مكتمل", g: '<path d="M6 12.5l4 4 8-9" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
    sos:     { c: "#e53e3e", l: "بلاغ طارئ", g: '<path d="M12 4l9 16H3z" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 10v4M12 17v.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' },
    pick:    { c: "#e53e3e", l: "الموقع المحدد", g: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" fill="none" stroke="#fff" stroke-width="2.2"/><circle cx="12" cy="10" r="2.4" fill="#fff"/>' }
  },
  tileSvg(k, px = 32) {
    const d = this.MAPK[k] || this.MAPK.req, id = "g" + k + px;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 32 32"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.c}"/><stop offset="1" stop-color="${d.c}" stop-opacity=".72"/></linearGradient></defs><rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="url(#${id})" stroke="${k === "sos" || k === "pick" ? "#fff" : "#f3dd8f"}" stroke-width="2"/><g transform="translate(6 6) scale(.83)">${d.g}</g></svg>`;
  },
  tileUrl(k) { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(this.tileSvg(k, 64)); },
  /* ---------- أعلام الدول ---------- */
  flagSrc(code) { return "assets/img/flags/" + String(code || "").toLowerCase() + ".png"; },
  countryName(code) {
    try { if (!this._dn) this._dn = new Intl.DisplayNames(["ar"], { type: "region" }); const n = this._dn.of(String(code).toUpperCase()); return n && n !== String(code).toUpperCase() ? n : ""; } catch (e) { return ""; }
  },
  _flagCache: {},
  // رمز العلم على الخارطة: علم بإطار أبيض رفيع وظل خفيف، ومنزل القنصل بأيقونة بيت ذهبية على الزاوية
  flagMarker(code, type) {
    const key = code + "|" + type; if (this._flagCache[key]) return this._flagCache[key];
    return (this._flagCache[key] = new Promise(res => {
      const img = new Image(); img.crossOrigin = "anonymous";
      const draw = ok => {
        const S = 2, W = 30, H = 22, pad = 6, house = type === "res";
        const c = document.createElement("canvas"); c.width = (W + pad * 2 + (house ? 6 : 0)) * S; c.height = (H + pad * 2 + (house ? 6 : 0)) * S;
        const x = c.getContext("2d"); x.scale(S, S);
        const ox = pad + (house ? 6 : 0), oy = pad;
        x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 4; x.shadowOffsetY = 1.5;
        x.fillStyle = "#fff"; x.beginPath(); x.roundRect ? x.roundRect(ox - 1.6, oy - 1.6, W + 3.2, H + 3.2, 3) : x.rect(ox - 1.6, oy - 1.6, W + 3.2, H + 3.2); x.fill();
        x.shadowColor = "transparent";
        if (ok) x.drawImage(img, ox, oy, W, H); else { x.fillStyle = "#0A5C3C"; x.fillRect(ox, oy, W, H); }
        if (house) {
          const cx = ox - 1, cy = oy + H + 1, r = 7.5;
          x.fillStyle = "#A8821F"; x.strokeStyle = "#fff"; x.lineWidth = 1.6; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); x.stroke();
          x.strokeStyle = "#fff"; x.lineWidth = 1.5; x.lineJoin = "round"; x.beginPath();
          x.moveTo(cx - 4, cy - .3); x.lineTo(cx, cy - 4); x.lineTo(cx + 4, cy - .3); x.moveTo(cx - 2.8, cy - 1.2); x.lineTo(cx - 2.8, cy + 3.4); x.lineTo(cx + 2.8, cy + 3.4); x.lineTo(cx + 2.8, cy - 1.2); x.stroke();
        }
        res({ url: c.toDataURL("image/png"), width: c.width / S, height: c.height / S, xoffset: house ? -3 : 0, yoffset: house ? -3 : 0 });
      };
      img.onload = () => draw(true); img.onerror = () => draw(false); img.src = this.flagSrc(code);
    }));
  },
  /* إنشاء خارطة. يعيد كائناً مبسّطاً:
     marker(lat,lng,{draggable}) · onPick(cb) · point(lat,lng,opts) · clear() · goTo(lat,lng,z) · destroy() */
  async emap(el, center, zoom = 15) {
    const E = await this.esri();
    const host = typeof el === "string" ? document.getElementById(el) : el;
    if (!host) throw new Error("no map host");
    const map = new E.Map({ basemap: "streets-night-vector" });
    const pts = new E.GraphicsLayer(), top = new E.GraphicsLayer();
    map.addMany([pts, top]);
    const view = new E.MapView({ container: host, map, center: [center[1], center[0]], zoom, popupEnabled: false,
      ui: { components: ["zoom", "attribution"] }, constraints: { snapToZoom: false } });
    this._arabize(map);
    // زر التبديل: الشوارع ليلاً / أقمار صناعية
    const sw = document.createElement("button"); sw.type = "button"; sw.className = "map-night";
    const paint = () => { sw.innerHTML = map.basemap.id === "hybrid" || map.basemap.title === "hybrid" || sw.dataset.b === "hybrid" ? this.ic("map") + "الشوارع ليلاً" : this.ic("globe") + "أقمار صناعية"; };
    sw.onclick = () => { const toSat = sw.dataset.b !== "hybrid"; sw.dataset.b = toSat ? "hybrid" : "night"; map.basemap = toSat ? "hybrid" : "streets-night-vector"; paint(); this._arabize(map); };
    sw.dataset.b = "night"; paint(); view.ui.add(sw, "top-right");
    // بطاقة معلومات بسيطة
    const tip = document.createElement("div"); tip.className = "map-tip"; tip.hidden = true; host.appendChild(tip);
    const sym = (o = {}) => { const z = o.size || 26; return { type: "picture-marker", url: UI.tileUrl(o.kind || "req"), width: z + "px", height: z + "px", xoffset: o.dx || 0, yoffset: o.dy || 0 }; };
    // نبض أحمر للبلاغات الطارئة (طبقة HTML فوق الخارطة)
    const pulses = [];
    const placePulses = () => pulses.forEach(p => { const s = view.toScreen(p.pt); if (s) { p.el.style.left = (s.x + p.dx * 1.333) + "px"; p.el.style.top = (s.y - p.dy * 1.333) + "px"; } });
    /* طبقة القنصليات: أعلام/نقاط مع تجميع عند الابتعاد */
    let sitesL = null, sitesMode = "flags", sitesList = [], sitesOpt = {}, fanKey = "", fanFeats = [];
    const CLUSTER_MAX_SCALE = 70000;
    const cluster = () => ({ type: "cluster", clusterRadius: "50px", clusterMinSize: "24px", clusterMaxSize: "46px", popupEnabled: false,
      symbol: { type: "simple-marker", style: "circle", color: "#0A5C3C", outline: { color: [255, 255, 255, 0.95], width: 2 } },
      labelingInfo: [{ deconflictionStrategy: "none", labelPlacement: "center-center", labelExpressionInfo: { expression: "Text($feature.cluster_count, '#,###')" },
        symbol: { type: "text", color: "#ffffff", font: { weight: "bold", size: "12px", family: "Arial" } } }] });
    const syncCluster = () => { if (!sitesL) return; const want = view.scale > CLUSTER_MAX_SCALE; const has = !!sitesL.featureReduction; if (want !== has) sitesL.featureReduction = want ? cluster() : null; };
    // توزيع المواقع ذات الإحداثيات المتطابقة في دائرة صغيرة حول النقطة
    const fanGeom = (list) => {
      const groups = {}; list.forEach(st => { const k = st.lat.toFixed(6) + "," + st.lng.toFixed(6); (groups[k] = groups[k] || []).push(st); });
      const rM = 20 * (view.resolution || 10);
      const out = {};
      Object.values(groups).forEach(g => g.forEach((st, i) => {
        if (g.length < 2) { out[st.id] = [st.lat, st.lng]; return; }
        const a = (2 * Math.PI * i) / g.length - Math.PI / 2;
        out[st.id] = [st.lat + (rM * Math.sin(a)) / 111320, st.lng + (rM * Math.cos(a)) / (111320 * Math.cos(st.lat * Math.PI / 180))];
      }));
      return out;
    };
    let buildQ = Promise.resolve();
    const buildSites = () => (buildQ = buildQ.then(doBuild).catch(e => console.error("sites layer", e)));
    async function doBuild() {
      if (sitesL) { map.remove(sitesL); sitesL = null; }
      const placed = sitesList.filter(st => typeof st.lat === "number" && typeof st.lng === "number");
      const pos = fanGeom(placed);
      const feats = placed.map((st, i) => new E.Graphic({ geometry: { type: "point", longitude: pos[st.id][1], latitude: pos[st.id][0] },
        attributes: { oid: i + 1, sid: st.id, sym: (sitesMode === "flags" ? (st.code || "xx").toLowerCase() + "|" + (st.type || "consulate") : st.type || "consulate") } }));
      let renderer;
      if (sitesMode === "flags") {
        const keys = [...new Set(feats.map(f => f.attributes.sym))];
        const infos = await Promise.all(keys.map(async k => { const [code, type] = k.split("|"); const m = await UI.flagMarker(code, type);
          return { value: k, symbol: { type: "picture-marker", url: m.url, width: m.width + "px", height: m.height + "px", xoffset: m.xoffset, yoffset: m.yoffset } }; }));
        renderer = { type: "unique-value", field: "sym", uniqueValueInfos: infos, defaultSymbol: { type: "simple-marker", size: 12, color: "#0A5C3C", outline: { color: "#fff", width: 1.5 } } };
      } else {
        renderer = { type: "unique-value", field: "sym", uniqueValueInfos: [{ value: "res", symbol: { type: "simple-marker", size: 12, color: "#A8821F", outline: { color: "#fff", width: 1.5 } } }],
          defaultSymbol: { type: "simple-marker", size: 12, color: "#0A5C3C", outline: { color: "#fff", width: 1.5 } } };
      }
      sitesL = new E.FeatureLayer({ source: feats, objectIdField: "oid", geometryType: "point", spatialReference: { wkid: 4326 },
        fields: [{ name: "oid", type: "oid" }, { name: "sid", type: "string" }, { name: "sym", type: "string" }], outFields: ["*"], renderer, popupEnabled: false, title: "القنصليات" });
      map.add(sitesL, 0);
      const cnt = {}; placed.forEach(st => { const k = st.lat.toFixed(6) + "," + st.lng.toFixed(6); cnt[k] = (cnt[k] || 0) + 1; });
      fanFeats = feats.filter((f, i) => cnt[placed[i].lat.toFixed(6) + "," + placed[i].lng.toFixed(6)] > 1);
      fanKey = Math.round(view.zoom * 4) + "";
      syncCluster();
    }
    view.watch("stationary", st => {
      if (!st || !sitesL) return; syncCluster();
      const k = Math.round(view.zoom * 4) + "";
      if (k === fanKey || !fanFeats.length) return;
      fanKey = k;
      const pos = fanGeom(sitesList.filter(x => typeof x.lat === "number" && typeof x.lng === "number"));
      const upd = fanFeats.map(f => new E.Graphic({ geometry: { type: "point", longitude: pos[f.attributes.sid][1], latitude: pos[f.attributes.sid][0] }, attributes: Object.assign({}, f.attributes) }));
      sitesL.applyEdits({ updateFeatures: upd }).catch(() => buildSites());
    });
    let mk = null, pick = null, dragging = false;
    const api = {
      view, map,
      marker(lat, lng, o = {}) {
        if (mk) top.remove(mk);
        mk = new E.Graphic({ geometry: { type: "point", longitude: lng, latitude: lat }, symbol: sym(Object.assign({ kind: "pick", size: 30 }, o)), attributes: { _mk: 1 } });
        mk._drag = !!o.draggable; top.add(mk); return api;
      },
      onPick(cb) { pick = cb; return api; },
      point(lat, lng, o = {}) {
        const g = new E.Graphic({ geometry: { type: "point", longitude: lng, latitude: lat }, symbol: sym(o), attributes: { _i: 1 } }); g._o = o; pts.add(g);
        if (o.pulse) { const el = document.createElement("div"); el.className = "map-pulse"; el.innerHTML = "<i></i><i></i>"; host.appendChild(el); pulses.push({ el, pt: g.geometry, dx: o.dx || 0, dy: o.dy || 0 }); placePulses(); }
        return g;
      },
      clear() { pts.removeAll(); tip.hidden = true; pulses.splice(0).forEach(p => p.el.remove()); },
      async sites(list, o = {}) { sitesList = list || []; sitesOpt = o; if (o.mode) sitesMode = o.mode; await buildSites(); },
      async sitesMode(m) { sitesMode = m; await buildSites(); },
      showTip(html, lat, lng) { const p = view.toScreen(new E.Graphic({ geometry: { type: "point", longitude: lng, latitude: lat } }).geometry); tip.innerHTML = html; tip.hidden = false;
        if (p) { tip.style.left = p.x + "px"; tip.style.top = p.y + "px"; } return tip; },
      hideTip() { tip.hidden = true; },
      goTo(lat, lng, z) { view.goTo({ center: [lng, lat], zoom: z || view.zoom }, { duration: 600 }).catch(() => {}); },
      destroy() { try { view.destroy(); } catch (e) {} }
    };
    view.on("click", async e => {
      const h = await view.hitTest(e, { include: sitesL ? [pts, sitesL] : [pts] });
      const g = h.results.find(r => r.graphic && r.graphic._o);
      const sg = !g && h.results.find(r => r.graphic && r.graphic.layer === sitesL);
      if (sg) {
        const gr = sg.graphic;
        if (gr.isAggregate || (gr.attributes && gr.attributes.cluster_count)) { view.goTo({ target: gr.geometry, zoom: Math.max(view.zoom + 2, 13.2) }, { duration: 500 }).catch(() => {}); return; }
        const st = sitesList.find(x => x.id === gr.attributes.sid);
        if (st && sitesOpt.onClick) { sitesOpt.onClick(st, gr.geometry); return; }
      }
      if (g) {
        const o = g.graphic._o;
        if (o.onClick) { o.onClick(); return; }
        if (o.html) { const p = view.toScreen(g.graphic.geometry); tip.innerHTML = o.html; tip.style.left = p.x + "px"; tip.style.top = p.y + "px"; tip.hidden = false; }
        return;
      }
      tip.hidden = true;
      if (pick) { const p = e.mapPoint; api.marker(p.latitude, p.longitude, { draggable: mk && mk._drag }); pick(p.latitude, p.longitude); }
    });
    // سحب العلامة
    view.on("pointer-down", async e => {
      if (!mk || !mk._drag) return;
      const h = await view.hitTest(e, { include: [top] });
      dragging = h.results.some(r => r.graphic === mk);
    });
    view.on("drag", e => {
      if (!dragging) return;
      e.stopPropagation();
      const p = view.toMap(e); if (p) mk.geometry = p;
      if (e.action === "end") { dragging = false; if (pick && p) pick(p.latitude, p.longitude); }
    });
    view.watch("extent", () => { tip.hidden = true; placePulses(); });
    view.on("resize", () => setTimeout(placePulses, 50));
    await view.when();
    return api;
  },
  // تكبير الصور عند الضغط
  bindGallery(root) {
    (root || document).querySelectorAll(".gallery img").forEach(img => img.onclick = () => {
      const lb = document.createElement("div"); lb.className = "lightbox"; lb.innerHTML = `<img src="${img.src}" alt="">`;
      lb.onclick = () => lb.remove(); document.body.appendChild(lb);
    });
  },
  modeBanner() {
    if (DIP.Store.mode === "local") {
      return `<div class="mode-banner">${this.ic("alert")} وضع تجريبي محلي — البيانات افتراضية وتُحفظ في هذا المتصفح فقط. افتح المنصتين في تبويبين على الجهاز نفسه للتجربة، أو اربطهما بـ Firebase للتشغيل من أكثر من جهاز.</div>`;
    }
    return `<div class="mode-banner live">${this.ic("check")} متصل بقاعدة البيانات (تشغيل تجريبي — بيانات افتراضية فقط)</div>`;
  }
};
