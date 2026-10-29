#!/usr/bin/env python3
"""Arma la aplicación web (GitHub Pages) a partir de fuente/.

  python3 herramientas/build_web.py            -> crea la carpeta sitio/

La MISMA fuente (fuente/apps-script) sirve para Apps Script (se copia tal cual al editor)
y para la web. Aquí solo se separan los archivos y se agregan manifest, service worker e íconos.
"""
import hashlib, json, os, re, shutil, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAS = os.path.join(RAIZ, 'fuente', 'apps-script')
WEB = os.path.join(RAIZ, 'fuente', 'web')
OUT = os.path.join(RAIZ, sys.argv[1] if len(sys.argv) > 1 else 'sitio')
JS = ['AppCore', 'AppModules', 'AppHome', 'AppReports', 'AppOps', 'AppConfig']

def leer(p): return open(p, encoding='utf-8').read()
def interior(txt, tag):
    a, b = txt.index('<%s>' % tag) + len(tag) + 2, txt.rindex('</%s>' % tag)
    return txt[a:b].strip('\n') + '\n'

cfg = json.loads(leer(os.path.join(WEB, 'config.json')))
if re.search(r'[0-9a-f]{32}', json.dumps(cfg)):
    sys.exit('ERROR: config.json parece contener una clave. Nunca publique la clave de acceso.')

if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(os.path.join(OUT, 'js')); os.makedirs(os.path.join(OUT, 'css'))

archivos = {}
archivos['css/styles.css'] = interior(leer(os.path.join(GAS, 'Styles.html')), 'style')
for n in JS:
    archivos['js/%s.js' % n.lower()] = interior(leer(os.path.join(GAS, n + '.html')), 'script')
archivos['js/pwa.js'] = leer(os.path.join(WEB, 'pwa.js'))
archivos['config.js'] = 'window.__BOOT = %s;\n' % json.dumps({'mode': 'web', 'apiUrl': cfg.get('apiUrl', ''), 'token': ''})
manifest = {
    'name': cfg['nombre'], 'short_name': cfg['nombre_corto'], 'lang': 'es', 'start_url': './', 'scope': './',
    'display': 'standalone', 'background_color': '#0f1420', 'theme_color': cfg['color'],
    'icons': [{'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
              {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
              {'src': 'icons/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}
archivos['manifest.webmanifest'] = json.dumps(manifest, ensure_ascii=False, indent=2)

version = hashlib.sha1(''.join(archivos[k] for k in sorted(archivos)).encode()).hexdigest()[:10]
v = '?v=' + version

idx = leer(os.path.join(GAS, 'Index.html'))
idx = idx.replace('<base target="_top">\n', '')
idx = idx.replace("<?!= include('Styles'); ?>", '<link rel="stylesheet" href="css/styles.css%s">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="%s">\n<link rel="icon" href="icons/icon-192.png">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">' % (v, cfg['color']))
idx = idx.replace('<script>window.__BOOT = <?!= boot ?>;</script>', '<script src="config.js%s"></script>' % v)
for n in JS:
    idx = idx.replace("<?!= include('%s'); ?>" % n, '<script src="js/%s.js%s"></script>' % (n.lower(), v))
idx = idx.replace('</body>', '<script src="js/pwa.js%s"></script>\n</body>' % v)
if '<?' in idx: sys.exit('ERROR: quedó una etiqueta de plantilla de Apps Script en index.html')
archivos['index.html'] = idx

for k, txt in archivos.items():
    open(os.path.join(OUT, k), 'w', encoding='utf-8').write(txt)
shutil.copytree(os.path.join(WEB, 'icons'), os.path.join(OUT, 'icons'))
lista = ['./', './index.html'] + ['./' + k + (v if k.endswith(('.js', '.css')) and k != 'config.js' else '') for k in sorted(archivos) if k not in ('index.html',)]
lista = [x.replace('config.js', 'config.js' + v) for x in lista] + ['./icons/icon-192.png', './icons/icon-512.png']
sw = leer(os.path.join(WEB, 'sw.js')).replace('__VERSION__', version).replace('__ARCHIVOS__', json.dumps(lista))
open(os.path.join(OUT, 'sw.js'), 'w', encoding='utf-8').write(sw)
open(os.path.join(OUT, '.nojekyll'), 'w').write('')

# Seguridad: nada de datos personales ni claves en lo publicado
prohibido = [r'window\.__SEED\s*=\s*\{', r'"rows":\s*\[\{"k":', r'"token":\s*"[0-9a-f]{32}"']
for raiz, _, fs in os.walk(OUT):
    for f in fs:
        if f.endswith(('.js', '.html', '.json', '.webmanifest', '.css')):
            t = leer(os.path.join(raiz, f))
            for p in prohibido:
                if re.search(p, t): sys.exit('ERROR: %s contiene datos que no deben publicarse (%s)' % (f, p))
print('Sitio listo en', os.path.relpath(OUT, RAIZ), '· versión', version, '·', len(archivos) + 1, 'archivos')
