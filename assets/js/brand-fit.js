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
