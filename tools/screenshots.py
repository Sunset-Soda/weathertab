"""Regenerates the website screenshots from docs/demo.html. Needs: pip install playwright && playwright install chromium"""
import pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'img'
def clock(h):
    return f"(()=>{{const R=Date;const off=(new R(2026,10,12,{h},30)).getTime()-R.now();class D extends R{{constructor(...a){{a.length?super(...a):super(R.now()+off)}}static now(){{return R.now()+off}}}}window.Date=D}})()"
SHOTS = [('hero', 22, {'theme': 'mocha', 'accent': '#cba6f7', 'photoMode': 'tokyo', 'fx': 'none'}, None),
         ('nord', 22, {'theme': 'nord', 'accent': '#88c0d0', 'photoMode': 'auckland', 'fx': 'stars'}, None),
         ('latte', 11, {'theme': 'latte', 'accent': '#8839ef', 'photoMode': 'paris', 'fx': 'none'}, None),
         ('dracula', 19, {'theme': 'dracula', 'accent': '#ff79c6', 'photoMode': 'newyork', 'fx': 'none'}, None),
         ('settings', 22, {'theme': 'macchiato', 'photoMode': 'tokyo'}, 'Appearance')]
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, hour, st, tab in SHOTS:
        pg = b.new_page(viewport={'width': 1440, 'height': 900})
        pg.add_init_script(clock(hour))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'data:')) else r.abort())
        pg.goto((ROOT / 'docs' / 'demo.html').as_uri())
        pg.evaluate("s=>{const c=JSON.parse(localStorage.getItem('weathertab_settings')||'{}');localStorage.setItem('weathertab_settings',JSON.stringify(Object.assign(c,s)))}", st)
        pg.reload(); pg.wait_for_timeout(1200)
        if tab:
            pg.click('#settingsBtn'); pg.click(f'#settingsNav button:has-text("{tab}")'); pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT / f'{name}.png')); pg.close()
    b.close()
