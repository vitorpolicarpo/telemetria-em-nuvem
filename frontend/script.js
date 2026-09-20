/* Telemetria Veicular — SPA (3 telas) com envio simulado para a nuvem
   'telemetria_v1'          -> rascunho local (o que o usuário está digitando)
   'telemetria_resultado_v1' -> "resposta da nuvem" (dado já processado, usado pelo dashboard)
*/
const CHAVE = 'telemetria_v1';
const CHAVE_RESULTADO = 'telemetria_resultado_v1';
const MAX_ESCALA = 240; // km/h no velocímetro

let estado = carregar() || {
  car: null,               // {modelo, placa, km}
  rows: [novaLinha(0)],    // {tempo, vel, temp, rpm} — strings enquanto digita
};

function novaLinha(tempo) { return { tempo: String(tempo), vel: '', temp: '', rpm: '' }; }
function carregar() { try { return JSON.parse(localStorage.getItem(CHAVE)); } catch { return null; } }
function salvar() { localStorage.setItem(CHAVE, JSON.stringify(estado)); }

const $ = id => document.getElementById(id);
const fmt = (n, c = 2) => Number(n).toFixed(c);

/* ---------- navegação entre telas ---------- */
function mostrar(nome) {
  ['cadastro', 'entrada', 'dashboard'].forEach(v => $('view-' + v).classList.add('hidden'));
  $('view-' + nome).classList.remove('hidden');
  window.scrollTo(0, 0);
}

/* ---------- cadastro do veículo ---------- */
$('btn-cadastrar').onclick = () => {
  const modelo = $('cad-modelo').value.trim();
  const placa = $('cad-placa').value.trim().toUpperCase();
  const km = parseFloat($('cad-km').value);
  if (!modelo || !placa || !(km >= 0)) {
    $('cad-erro').textContent = 'Preencha modelo, placa e quilometragem válidos.';
    $('cad-erro').classList.remove('hidden');
    return;
  }
  $('cad-erro').classList.add('hidden');
  estado.car = { modelo, placa, km };
  salvar(); renderVeiculo(); mostrar('entrada'); renderTabela();
};

/* ---------- veículo / quilometragem ---------- */
function renderVeiculo() {
  const c = estado.car; if (!c) return;
  $('chip-veiculo').textContent = `🚗 ${c.modelo} • ${c.placa}`;
  $('chip-veiculo').classList.remove('hidden');
  $('km-modelo').textContent = c.modelo; $('km-placa').textContent = c.placa;
  $('dash-modelo').textContent = c.modelo; $('dash-placa').textContent = c.placa;
  const kmTxt = c.km.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  $('km-valor').textContent = kmTxt; $('dash-km').textContent = kmTxt;
}
$('btn-km').onclick = () => {
  const km = parseFloat($('km-novo').value);
  if (!(km >= 0)) return;
  estado.car.km = km; $('km-novo').value = '';
  salvar(); renderVeiculo();
};

/* ---------- tabela de medições ---------- */
function aceleracoes(linhas) {
  // a = Δv / Δt, v convertida de km/h para m/s; primeira leitura = 0
  return linhas.map((r, i) => {
    if (i === 0) return 0;
    const dt = r.tempo - linhas[i - 1].tempo;
    if (dt <= 0) return NaN;
    return ((r.vel - linhas[i - 1].vel) / 3.6) / dt;
  });
}

function linhasNumericas() {
  return estado.rows
    .map(r => ({ tempo: parseFloat(r.tempo), vel: parseFloat(r.vel), temp: parseFloat(r.temp), rpm: parseFloat(r.rpm) }))
    .filter(r => !isNaN(r.tempo) && !isNaN(r.vel) && !isNaN(r.temp))
    .sort((a, b) => a.tempo - b.tempo);
}

function renderTabela() {
  const tb = $('tbody'); tb.innerHTML = '';
  estado.rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="seq">#${i + 1}</td>
      <td><input data-f="tempo" type="number" step="0.01" min="0" value="${r.tempo}"></td>
      <td><input data-f="vel" type="number" step="0.1" min="0" value="${r.vel}" placeholder="0"><span class="unid">km/h</span></td>
      <td><input data-f="temp" type="number" step="0.5" value="${r.temp}" placeholder="0"><span class="unid">°C</span></td>
      <td class="acel-calc" data-acel>—</td>
      <td><input data-f="rpm" type="number" step="10" min="0" value="${r.rpm}" placeholder="0"><span class="unid">rpm</span></td>
      <td><button class="btn-del" title="Remover linha">🗑</button></td>`;
    tr.querySelectorAll('input').forEach(inp =>
      inp.addEventListener('input', () => { estado.rows[i][inp.dataset.f] = inp.value; salvar(); atualizarAceleracaoColuna(); }));
    tr.querySelector('.btn-del').onclick = () => {
      estado.rows.splice(i, 1);
      if (!estado.rows.length) estado.rows.push(novaLinha(0));
      salvar(); renderTabela();
    };
    tb.appendChild(tr);
  });
  atualizarAceleracaoColuna();
}

function atualizarAceleracaoColuna() {
  const linhas = linhasNumericas();
  const acels = aceleracoes(linhas);
  $('tbody').querySelectorAll('[data-acel]').forEach((td, i) => {
    const r = estado.rows[i];
    const t = parseFloat(r.tempo), v = parseFloat(r.vel);
    if (isNaN(t) || isNaN(v)) { td.textContent = '—'; return; }
    const j = linhas.findIndex(l => l.tempo === t && l.vel === v);
    const a = j >= 0 ? acels[j] : NaN;
    td.textContent = isNaN(a) ? 'erro' : fmt(a);
  });
}

$('btn-add').onclick = () => {
  const ult = linhasNumericas().at(-1);
  estado.rows.push(novaLinha(ult ? fmt(ult.tempo + 0.5) : 0));
  salvar(); renderTabela();
};
$('btn-limpar').onclick = () => { estado.rows = [novaLinha(0)]; salvar(); renderTabela(); $('aviso-erro').classList.add('hidden'); };

/* ---------- validação ---------- */
function validar() {
  const linhas = linhasNumericas();
  const trs = $('tbody').querySelectorAll('tr');
  trs.forEach(tr => {
    tr.classList.remove('erro-linha');
    tr.querySelectorAll('input').forEach(inp => inp.classList.remove('campo-erro'));
  });
  const problemas = [];

  estado.rows.forEach((r, i) => {
    const t = parseFloat(r.tempo), v = parseFloat(r.vel), tp = parseFloat(r.temp);
    if (isNaN(t)) problemas.push({ i, field: 'tempo', msg: `#${i + 1} tempo ausente` });
    if (isNaN(v)) problemas.push({ i, field: 'vel', msg: `#${i + 1} velocidade ausente` });
    else if (v < 0 || v > MAX_ESCALA) problemas.push({ i, field: 'vel', msg: `#${i + 1} velocidade fora da faixa` });
    if (isNaN(tp)) problemas.push({ i, field: 'temp', msg: `#${i + 1} temperatura ausente` });
    else if (tp < -20 || tp > 150) problemas.push({ i, field: 'temp', msg: `#${i + 1} temperatura fora da faixa` });
  });
  for (let k = 1; k < linhas.length; k++)
    if (linhas[k].tempo <= linhas[k - 1].tempo) {
      const i = estado.rows.findIndex(r => parseFloat(r.tempo) === linhas[k].tempo);
      problemas.push({ i, field: 'tempo', msg: `#${i + 1} instante não cresce` });
    }

  const aviso = $('aviso-erro');
  if (problemas.length) {
    problemas.forEach(p => {
      trs[p.i]?.classList.add('erro-linha');
      trs[p.i]?.querySelector(`[data-f="${p.field}"]`)?.classList.add('campo-erro');
    });
    const linhasErro = [...new Set(problemas.map(p => p.i + 1))];
    const plural = linhasErro.length > 1;
    aviso.style.color = '';
    aviso.textContent = `Há ${problemas.length} erro${problemas.length > 1 ? 's' : ''} crítico${problemas.length > 1 ? 's' : ''} identificado${problemas.length > 1 ? 's' : ''} na${plural ? 's' : ''} medição${plural ? 'ões' : ''} #${linhasErro.join(', #')}.`;
    aviso.classList.remove('hidden');
    return null;
  }
  aviso.classList.add('hidden');
  return linhas;
}

$('btn-validar').onclick = () => {
  const ok = validar();
  const aviso = $('aviso-erro');
  if (ok) { aviso.textContent = '✔ Dados válidos — prontos para enviar.'; aviso.style.color = 'var(--verde-claro)'; aviso.classList.remove('hidden'); }
  else aviso.style.color = '';
};

/* ---------- envio para a nuvem ----------
   Hoje isto é simulado (setTimeout). Quando o backend existir, troque o
   corpo desta função por um fetch('.../api/telemetria', {method:'POST', body: payload})
   e resolva a Promise com a resposta processada pelo servidor. */
function distanciaPercorrida(linhas) {
  // integração trapezoidal: v em km/h, tempo em segundos -> distância em km
  let dist = 0;
  for (let i = 1; i < linhas.length; i++) {
    const dt = linhas[i].tempo - linhas[i - 1].tempo;
    const vMedia = (linhas[i].vel + linhas[i - 1].vel) / 2;
    dist += vMedia * (dt / 3600);
  }
  return dist;
}

function processarLocalmente(linhas) {
  const acels = aceleracoes(linhas);
  const dist = distanciaPercorrida(linhas);
  estado.car.km += dist;
  salvar();
  renderVeiculo();
  const acelsMedidas = acels.slice(1); // índice 0 é sempre 0 por definição (sem leitura anterior)
  return {
    car: { ...estado.car },
    linhas,
    stats: {
      velMedia: linhas.reduce((s, r) => s + r.vel, 0) / linhas.length,
      vMax: Math.max(...linhas.map(r => r.vel)),
      tempMedia: linhas.reduce((s, r) => s + r.temp, 0) / linhas.length,
      acelMedia: acelsMedidas.length ? acelsMedidas.reduce((s, a) => s + a, 0) / acelsMedidas.length : 0,
      acels,
      distPercorrida: dist,
    },
    geradoEm: Date.now(),
  };
}

function enviarParaNuvem(linhas) {
  return new Promise(resolve => setTimeout(() => resolve(processarLocalmente(linhas)), 900));
}

$('btn-compilar').onclick = async () => {
  const linhas = validar();
  if (!linhas || !linhas.length) return;

  const btn = $('btn-compilar');
  const avisoNuvem = $('aviso-nuvem');
  btn.disabled = true;
  const textoOriginal = btn.textContent;
  btn.textContent = 'Enviando para a nuvem…';
  avisoNuvem.textContent = 'Enviando medições para processamento na nuvem…';
  avisoNuvem.classList.remove('hidden');

  const resultado = await enviarParaNuvem(linhas);
  localStorage.setItem(CHAVE_RESULTADO, JSON.stringify(resultado));

  avisoNuvem.classList.add('hidden');
  btn.disabled = false;
  btn.textContent = textoOriginal;

  mostrar('dashboard');
  renderDashboard(resultado);
};
$('btn-voltar').onclick = () => { mostrar('entrada'); renderTabela(); };

/* ---------- dashboard ---------- */
let animId = null;

function renderDashboard(resultado) {
  renderVeiculo();
  const { linhas, stats } = resultado;

  animarVelocimetro(stats.velMedia);
  $('st-acel').textContent = fmt(stats.acelMedia);
  $('st-vmax').textContent = Math.round(stats.vMax);
  $('st-temp').textContent = Math.round(stats.tempMedia);
  $('bar-acel').style.width = Math.min(Math.abs(stats.acelMedia) / 8 * 100, 100) + '%';
  $('bar-vmax').style.width = Math.min(stats.vMax / MAX_ESCALA * 100, 100) + '%';
  $('bar-temp').style.width = Math.min(stats.tempMedia / 150 * 100, 100) + '%';

  desenharGrafico($('g-vel'), linhas.map(r => [r.tempo, r.vel]), '#4ade80', 'km/h');
  desenharGrafico($('g-acel'), linhas.map((r, i) => [r.tempo, stats.acels[i]]), '#60a5fa', 'm/s²');
  desenharGrafico($('g-temp'), linhas.map(r => [r.tempo, r.temp]), '#f59e0b', '°C');
}

function animarVelocimetro(alvo) {
  cancelAnimationFrame(animId);
  const ponteiro = $('ponteiro'), num = $('vel-media-num');
  const inicio = performance.now(), DUR = 900;
  const de = parseFloat(num.dataset.v || 0);
  function frame(t) {
    const p = Math.min((t - inicio) / DUR, 1);
    const e = 1 - Math.pow(1 - p, 3); // ease-out cúbico
    const v = de + (alvo - de) * e;
    const frac = Math.min(v / MAX_ESCALA, 1);
    ponteiro.setAttribute('transform', `rotate(${-120 + frac * 240} 150 150)`);
    num.textContent = Math.round(v);
    if (p < 1) animId = requestAnimationFrame(frame); else num.dataset.v = alvo;
  }
  animId = requestAnimationFrame(frame);
}

/* ticks do velocímetro — marcas a cada 20, número só a cada 40 (menos poluição visual) */
(function ticks() {
  const g = $('ticks');
  const CX = 150, CY = 150, R_OUT = 122, R_LBL = 84;
  for (let m = 0; m <= 12; m++) {
    const valor = m * 20;
    const principal = m % 2 === 0;
    const ang = (-210 + m * 20) * Math.PI / 180;
    const rIn = principal ? 100 : 111;
    const x1 = CX + R_OUT * Math.cos(ang), y1 = CY + R_OUT * Math.sin(ang);
    const x2 = CX + rIn * Math.cos(ang), y2 = CY + rIn * Math.sin(ang);
    g.innerHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${principal ? '#c8d0da' : '#454f5c'}" stroke-width="${principal ? 2.5 : 1.2}"/>`;
    if (principal) {
      g.innerHTML += `<text x="${CX + R_LBL * Math.cos(ang)}" y="${CY + R_LBL * Math.sin(ang)}" fill="#8b96a3" font-size="14" font-weight="700" font-family="JetBrains Mono" text-anchor="middle" dominant-baseline="middle">${valor}</text>`;
    }
  }
})();

/* ---------- gráficos (canvas puro) ---------- */
$('btn-graficos').onclick = () => {
  const g = $('graficos');
  g.classList.toggle('hidden');
  $('btn-graficos').textContent = g.classList.contains('hidden') ? 'Mostrar gráficos ▾' : 'Esconder gráficos ▴';
};

function desenharGrafico(cv, pts, cor, unid) {
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth || 320, h = 220;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const P = { l: 44, r: 14, t: 14, b: 30 };
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  let yMin = Math.min(...ys, 0), yMax = Math.max(...ys);
  if (yMax === yMin) yMax = yMin + 1;
  const X = v => P.l + (v - xMin) / ((xMax - xMin) || 1) * (w - P.l - P.r);
  const Y = v => h - P.b - (v - yMin) / (yMax - yMin) * (h - P.t - P.b);

  ctx.strokeStyle = '#1f2733'; ctx.fillStyle = '#8b96a3';
  ctx.font = '10px JetBrains Mono'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { // grade horizontal
    const y = P.t + i * (h - P.t - P.b) / 4, val = yMax - i * (yMax - yMin) / 4;
    ctx.beginPath(); ctx.moveTo(P.l, y); ctx.lineTo(w - P.r, y); ctx.stroke();
    ctx.fillText(val.toFixed(1), 6, y + 3);
  }
  if (yMin < 0) { ctx.strokeStyle = '#454f5c'; ctx.beginPath(); ctx.moveTo(P.l, Y(0)); ctx.lineTo(w - P.r, Y(0)); ctx.stroke(); }

  ctx.strokeStyle = cor; ctx.lineWidth = 2; ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])));
  ctx.stroke();
  pts.forEach(p => { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 3.5, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#8b96a3';
  pts.forEach(p => ctx.fillText(String(p[0]), X(p[0]) - 8, h - 10));
  ctx.fillText(unid, w - P.r - 34, P.t + 2);
}

/* ---------- boot ---------- */
if (!estado.car) {
  mostrar('cadastro');
} else {
  renderVeiculo();
  if (!estado.rows.length) estado.rows = [novaLinha(0)];
  renderTabela();
  mostrar('entrada');
}