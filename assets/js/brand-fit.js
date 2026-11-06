/* يجعل اسم الإدارة بالإنجليزي بنفس عرض الاسم العربي تماماً (على أي جهاز وأي خط) */
(function () {
  function fit() {
    document.querySelectorAll(".brand-right .dept").forEach(d => {
      const ar = d.querySelector("b"), en = d.querySelector("small");
      if (!ar || !en) return;
      en.style.fontSize = "10px";
      const wa = ar.getBoundingClientRect().width, we = en.getBoundingClientRect().width;
      if (wa && we) en.style.fontSize = (10 * wa / we).toFixed(2) + "px";
    });
  }
  window.addEventListener("load", fit);
  window.addEventListener("resize", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  document.addEventListener("DOMContentLoaded", fit);
})();

/* الوضع الداكن: زر واحد في الشريط العلوي، ويُحفظ الاختيار على الجهاز */
(function () {
  const SUN = '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg class="ic" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
  const root = document.documentElement;
  function set(t) {
    if (t === "dark") root.dataset.theme = "dark"; else delete root.dataset.theme;
    try { localStorage.setItem("dip-theme", t); } catch (e) {}
    document.querySelectorAll(".theme-btn").forEach(b => { b.innerHTML = t === "dark" ? SUN : MOON; b.title = t === "dark" ? "الوضع الفاتح" : "الوضع الداكن"; });
    const tc = document.querySelector('meta[name="theme-color"]'); if (tc && !tc.dataset.alert) tc.content = t === "dark" ? "#031a10" : "#ffffff";
    document.dispatchEvent(new Event("themechange"));
  }
  function mount() {
    const host = document.querySelector(".appbar .in") || document.querySelector(".topnav .wrap");
    if (!host || host.querySelector(".theme-btn")) return;
    const b = document.createElement("button"); b.className = "act theme-btn"; b.type = "button";
    b.onclick = () => set(root.dataset.theme === "dark" ? "light" : "dark");
    const who = host.querySelector(".who, .btn");
    host.insertBefore(b, who || null);
    set(root.dataset.theme === "dark" ? "dark" : "light");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
