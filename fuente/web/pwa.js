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
  /* Aviso en la esquina superior derecha cuando se instaló una versión nueva, con lo que cambió */
  function avisoActualizado() {
    fetch('version.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.v) return;
      var ant = null; try { ant = JSON.parse(localStorage.getItem('verVista') || 'null'); } catch (e) { }
      try { localStorage.setItem('verVista', JSON.stringify({ v: d.v, h: d.cambios && d.cambios[0] ? d.cambios[0].h : '' })); } catch (e) { }
      if (!ant || ant.v === d.v) return;
      var nuevos = []; (d.cambios || []).some(function (c) { if (c.h === ant.h) return true; nuevos.push(c); return false; });
      if (!nuevos.length && d.cambios && d.cambios[0]) nuevos = [d.cambios[0]];
      var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
      var corto = function (t) { t = String(t); return t.length > 120 ? t.slice(0, 118) + '…' : t; };
      var box = document.createElement('div'); box.id = 'avisoAct';
      box.style.cssText = 'position:fixed;top:14px;right:14px;z-index:9999;max-width:380px;background:var(--card,#fff);color:var(--tx,#1d2433);border:1px solid var(--ok,#2e7d32);border-left:5px solid var(--ok,#2e7d32);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.25);padding:11px 14px 11px 12px;font-size:13px;line-height:1.4;transition:opacity .4s,transform .4s;transform:translateY(-8px);opacity:0';
      box.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><b style="font-size:14px">✅ Sistema actualizado</b><span style="flex:1"></span><button type="button" aria-label="Cerrar" style="border:0;background:transparent;color:inherit;font-size:16px;cursor:pointer;line-height:1">✕</button></div>'
        + '<ul style="margin:6px 0 0;padding-left:18px">' + nuevos.slice(0, 4).map(function (c) { return '<li title="' + esc(c.m) + '">' + esc(corto(c.m)) + '</li>'; }).join('') + '</ul>'
        + (nuevos.length > 4 ? '<div style="opacity:.7;font-size:12px;margin-top:3px">y ' + (nuevos.length - 4) + ' mejora(s) más</div>' : '');
      document.body.appendChild(box);
      requestAnimationFrame(function () { box.style.opacity = '1'; box.style.transform = 'none'; });
      var cerrar = function () { box.style.opacity = '0'; box.style.transform = 'translateY(-8px)'; setTimeout(function () { box.remove(); }, 450); };
      box.querySelector('button').onclick = cerrar;
      var t = setTimeout(cerrar, 15000); box.onmouseenter = function () { clearTimeout(t); }; box.onmouseleave = function () { t = setTimeout(cerrar, 6000); };
    }).catch(function () { });
  }
  if (document.readyState === 'complete') setTimeout(avisoActualizado, 1500); else window.addEventListener('load', function () { setTimeout(avisoActualizado, 1500); });
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (recargando) return; recargando = true; location.reload(); });
})();
