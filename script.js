function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
(async function () {
  const modules = ["js/controller.js", "js/mount.js", "js/app.js"];
  for (const src of modules) await loadScript(src);
})();
