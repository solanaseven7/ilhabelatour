/* Ilhabela Tour — métricas do site (visitas e cliques de Instagram/WhatsApp por operador).
   Os eventos vão para o Google Apps Script ligado à planilha "Ilha Tour Data". */
window.METRICAS_URL = 'https://script.google.com/macros/s/AKfycbyASOL0zy6tcdzIL_PnpvGUBoiuTgbtNL0UPzZtTefChbxKyc6515vj9rP7Sw7iMQpOKw/exec';   // URL do App da Web (termina em /exec)

(function () {
  var ENDPOINT = window.METRICAS_URL;
  var CAT = { mar: 'Barco', terra: 'Jeep' };
  window.itMetrica = function () {};
  if (!ENDPOINT || /\/painel/.test(location.pathname)) return;
  if (/^(localhost|127\.)/.test(location.hostname)) return;   // nao conta testes locais

  var sid;
  try {
    sid = sessionStorage.getItem('it_sid');
    if (!sid) { sid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); sessionStorage.setItem('it_sid', sid); }
  } catch (_) { sid = 'x' + Math.random().toString(36).slice(2, 12); }

  var disp = window.matchMedia && matchMedia('(max-width: 900px), (hover: none)').matches ? 'mobile' : 'desktop';
  var pg = /blog/.test(location.pathname) ? 'blog' : 'inicio';

  function enviar(d) {
    d.sid = sid; d.disp = disp; d.pg = pg;
    var corpo = JSON.stringify(d);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([corpo], { type: 'text/plain;charset=UTF-8' }))) return;
    } catch (_) {}
    try { fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: corpo }); } catch (_) {}
  }

  // usado pelo site: itMetrica('wa' | 'ig', 'Nome do operador', 'mar' | 'terra')
  window.itMetrica = function (t, op, cat) {
    enviar({ t: t, op: op || 'Ilhabela Tour (site)', cat: CAT[cat] || cat || '' });
  };

  // 1 visita por carregamento de página
  var ref = '';
  try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (_) {}
  if (ref === location.hostname) ref = '';
  enviar({ t: 'visita', ref: ref || 'direto' });

  // cliques em Instagram / WhatsApp (fase de captura: os botoes dos cards param a propagacao)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var t = /instagram\.com/i.test(h) ? 'ig' : (/wa\.me|whatsapp\.com/i.test(h) ? 'wa' : '');
    if (!t) return;
    // WhatsApp dos operadores abre o formulario de reserva antes; conta quando a pessoa e enviada ao WhatsApp
    if (t === 'wa' && a.matches('a.btn-wa, a.modal-wa') && /wa\.me\/\d+/.test(h)) return;

    var op = '', cat = '';
    var card = a.closest('.card-row');
    if (card) { op = card.getAttribute('data-name'); cat = card.getAttribute('data-cat'); }
    else if (a.closest('#card-modal') && window.__itCard) { op = window.__itCard.getAttribute('data-name'); cat = window.__itCard.getAttribute('data-cat'); }
    window.itMetrica(t, op, cat);
  }, true);
})();
