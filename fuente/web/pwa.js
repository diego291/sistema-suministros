/* Aplicación instalable: registra el service worker y avisa cuando hay una versión nueva */
(function () {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  var recargando = false;
  function hayFormularioAbierto() { var m = document.getElementById('modal'); return m && !m.classList.contains('hidden'); }
  function aviso(sw) {
    if (document.getElementById('pwaUpd')) return;
    var d = document.createElement('div'); d.id = 'pwaUpd'; d.className = 'toast ok';
    d.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99;display:flex;gap:10px;align-items:center';
    d.innerHTML = '🔄 Hay una versión nueva del sistema <button class="btn sm">Actualizar ahora</button>';
    d.querySelector('button').onclick = function () { sw.postMessage('activar'); };
    document.body.appendChild(d);
  }
  navigator.serviceWorker.register('sw.js').then(function (reg) {
    function revisar(sw) { if (!sw) return; sw.addEventListener('statechange', function () { if (sw.state === 'installed' && navigator.serviceWorker.controller) { hayFormularioAbierto() ? aviso(sw) : sw.postMessage('activar'); } }); }
    if (reg.waiting && navigator.serviceWorker.controller) aviso(reg.waiting);
    reg.addEventListener('updatefound', function () { revisar(reg.installing); });
    setInterval(function () { reg.update(); }, 30 * 60 * 1000);
  });
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (recargando) return; recargando = true; location.reload(); });
})();
