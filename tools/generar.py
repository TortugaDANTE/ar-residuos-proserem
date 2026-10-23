# Exporta los botes 3D a models/*.gltf usando Chromium headless (playwright).
import http.server,threading,os,functools
from playwright.sync_api import sync_playwright
raiz=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8766),functools.partial(http.server.SimpleHTTPRequestHandler,directory=raiz))
threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);pg=b.new_page()
    pg.on('console',lambda m:print(m.text))
    pg.goto('http://127.0.0.1:8766/tools/generar_botes.html');pg.wait_for_function('window.listo',timeout=60000)
    for k,v in pg.evaluate('window.salida').items():
        open(os.path.join(raiz,'models',f'bote_{k}.gltf'),'w').write(v);print(k,len(v))
    b.close()
