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
  /* Botón "Novedades" junto al título: muestra las últimas actualizaciones para leerlas con calma.
     Si hay mejoras que no ha visto, el botón muestra cuántas; al abrirlo se marcan como vistas. */
  function novedades() {
    fetch('version.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.cambios) return;
      var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
      var visto = null; try { visto = localStorage.getItem('novVisto'); } catch (e) { }
      if (!visto) { try { var a = JSON.parse(localStorage.getItem('verVista') || 'null'); visto = a && a.h; } catch (e) { } }
      var nuevos = 0; if (visto) { for (var k = 0; k < d.cambios.length && d.cambios[k].h !== visto; k++) nuevos++; if (nuevos === d.cambios.length) nuevos = Math.min(nuevos, 5); }
      var t = document.getElementById('title'); if (!t || document.getElementById('btnNov')) return;
      var b = document.createElement('button'); b.id = 'btnNov'; b.type = 'button'; b.className = 'btn sm'; b.title = 'Últimas actualizaciones del sistema';
      b.style.cssText = 'margin-left:10px;position:relative;white-space:nowrap';
      var pinta = function () { b.innerHTML = '🆕 Novedades' + (nuevos ? ' <span style="position:absolute;top:-7px;right:-7px;background:#d32f2f;color:#fff;border-radius:10px;font-size:10.5px;font-weight:700;padding:1px 6px">' + nuevos + '</span>' : ''); };
      pinta(); t.insertAdjacentElement('afterend', b);
      var fmt = function (f) { var p = String(f).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : f; };
      b.onclick = function (e) {
        e.stopPropagation(); var ex = document.getElementById('novPan'); if (ex) { ex.remove(); return; }
        var rc = b.getBoundingClientRect(), pan = document.createElement('div'); pan.id = 'novPan';
        pan.style.cssText = 'position:fixed;z-index:9999;top:' + (rc.bottom + 8) + 'px;left:' + Math.max(8, Math.min(rc.left, window.innerWidth - 460)) + 'px;width:450px;max-width:calc(100vw - 16px);max-height:70vh;overflow:auto;background:var(--card,#fff);color:var(--tx,#1d2433);border:1px solid var(--ln,#ddd);border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.35);padding:12px 14px;font-size:13px;line-height:1.45';
        var dias = {}, orden = [];
        d.cambios.forEach(function (c, i) { if (!dias[c.f]) { dias[c.f] = []; orden.push(c.f); } dias[c.f].push({ m: c.m, nuevo: i < nuevos }); });
        pan.innerHTML = '<div style="display:flex;align-items:center;margin-bottom:6px"><b style="font-size:14.5px">🆕 Últimas actualizaciones</b><span style="flex:1"></span><button type="button" style="border:0;background:transparent;color:inherit;font-size:16px;cursor:pointer">✕</button></div>'
          + orden.map(function (f) { return '<div style="font-size:11.5px;font-weight:700;color:var(--tx2,#666);margin:10px 0 4px;text-transform:uppercase;letter-spacing:.4px">' + fmt(f) + '</div><ul style="margin:0;padding-left:18px">' + dias[f].map(function (x) { return '<li style="margin-bottom:5px">' + (x.nuevo ? '<span style="background:#2e7d32;color:#fff;border-radius:8px;font-size:10px;font-weight:700;padding:0 6px;margin-right:5px">NUEVO</span>' : '') + esc(x.m) + '</li>'; }).join('') + '</ul>'; }).join('');
        document.body.appendChild(pan);
        pan.querySelector('button').onclick = function () { pan.remove(); };
        setTimeout(function () { document.addEventListener('mousedown', function fuera(ev) { if (!pan.contains(ev.target) && ev.target !== b) { pan.remove(); document.removeEventListener('mousedown', fuera); } }); }, 0);
        try { localStorage.setItem('novVisto', d.cambios[0] ? d.cambios[0].h : ''); } catch (e) { }
        nuevos = 0; pinta();
      };
    }).catch(function () { });
  }
  if (document.readyState === 'complete') setTimeout(novedades, 1200); else window.addEventListener('load', function () { setTimeout(novedades, 1200); });
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (recargando) return; recargando = true; location.reload(); });
})();
