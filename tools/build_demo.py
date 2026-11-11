html=open('src/newtab.html').read()
css=open('src/newtab.css').read()
js=open('src/newtab.js').read().replace('localStorage','window.__ls')
orig="const iconifyUrl = (prefix, name) => `https://api.iconify.design/${prefix}/${name}.svg?height=64`;"
assert orig in js
js=js.replace(orig,"const iconifyUrl = (prefix, name) => prefix === 'mock' ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(window.__mockSvg(name)) : `https://api.iconify.design/${prefix}/${name}.svg?height=64`;")
shim='''<script>
(function () {
  // Preview-only shim: in-memory storage fallback, sample data, and fallbacks when the network is blocked.
  var ls;
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); ls = localStorage; }
  catch (e) {
    var m = {};
    ls = { getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } };
  }
  window.__ls = ls;
  if (ls.getItem('weathertab_settings') === null) {
    ls.setItem('weathertab_settings', JSON.stringify({ photoMode: 'tokyo', weather: { lat: -37.0, lon: 175.0, place: 'Sample City, Sample Region' } }));
  }
  var colours = { a: '#8aadf4', b: '#a6da95', c: '#f5a97f', d: '#c6a0f6', e: '#ed8796', f: '#8bd5ca' };
  window.__mockSvg = function (n) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64"><rect x="3" y="3" width="18" height="18" rx="5" fill="' + (colours[n] || '#999') + '"/></svg>';
  };
  function sample() {
    var days = [], d = new Date(), codes = [2, 61, 3, 0, 80, 95];
    for (var i = 0; i < 6; i++) { var x = new Date(d.getTime() + i * 864e5); days.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')); }
    return { current: { temperature_2m: 17.4, apparent_temperature: 16.1, relative_humidity_2m: 72, weather_code: 2, wind_speed_10m: 14.2, is_day: 1 },
      daily: { time: days, weather_code: codes, temperature_2m_max: [19, 17, 18, 22, 20, 16], temperature_2m_min: [10, 11, 9, 12, 11, 10], precipitation_probability_max: [20, 70, 30, 5, 60, 80] } };
  }
  var realFetch = window.fetch;
  function json(o) { return new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } }); }
  var fakeCity = { results: [{ name: 'Sample City', admin1: 'Sample Region', country: 'Nowhere', latitude: -37, longitude: 175 }] };
  var fakeIcons = { icons: ['mock:a', 'mock:b', 'mock:c', 'mock:d', 'mock:e', 'mock:f'] };
  function tryReal(args, fallback) {
    return realFetch.apply(window, args).then(function (r) { return r.ok ? r : fallback(); }).catch(fallback);
  }
  window.fetch = function (u) {
    u = String(u);
    var args = arguments;
    if (u.indexOf('geocoding-api') > -1) return tryReal(args, function () { return json(fakeCity); });
    if (u.indexOf('api.iconify.design/search') > -1) return tryReal(args, function () { return json(fakeIcons); });
    if (u.indexOf('api.open-meteo.com') > -1) {
      if (new URL(u).searchParams.get('latitude') === '-37') return Promise.resolve(json(sample()));
      return tryReal(args, function () { return json(sample()); });
    }
    return realFetch.apply(window, args);
  };
})();
</script>'''
out=html.replace('<link rel="stylesheet" href="newtab.css">','<style>\n'+css+'\n</style>')
out=out.replace('<script src="newtab.js"></script>',shim+'\n<script>\n'+js+'\n</script>')
assert 'newtab.css' not in out and 'newtab.js' not in out
open('docs/demo.html','w').write(out)
print('built', len(out))
