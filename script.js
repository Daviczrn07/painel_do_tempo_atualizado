const formBusca = document.getElementById('form-busca');
const campoCidade = document.getElementById('cidade');
const botaoBuscar = document.getElementById('botao-buscar');
const mensagem = document.getElementById('mensagem');
const resultado = document.getElementById('resultado');

const codigosClima = {
  0:  { descricao: 'Céu limpo', dia: '☀️', noite: '🌙' },
  1:  { descricao: 'Predominantemente limpo', dia: '🌤️', noite: '🌙' },
  2:  { descricao: 'Parcialmente nublado', dia: '⛅', noite: '☁️' },
  3:  { descricao: 'Nublado', dia: '☁️', noite: '☁️' },
  45: { descricao: 'Neblina', dia: '🌫️', noite: '🌫️' },
  48: { descricao: 'Neblina com geada', dia: '🌫️', noite: '🌫️' },
  51: { descricao: 'Garoa leve', dia: '🌦️', noite: '🌧️' },
  53: { descricao: 'Garoa moderada', dia: '🌦️', noite: '🌧️' },
  55: { descricao: 'Garoa intensa', dia: '🌧️', noite: '🌧️' },
  56: { descricao: 'Garoa congelante leve', dia: '🌧️', noite: '🌧️' },
  57: { descricao: 'Garoa congelante intensa', dia: '🌧️', noite: '🌧️' },
  61: { descricao: 'Chuva leve', dia: '🌦️', noite: '🌧️' },
  63: { descricao: 'Chuva moderada', dia: '🌧️', noite: '🌧️' },
  65: { descricao: 'Chuva forte', dia: '⛈️', noite: '⛈️' },
  66: { descricao: 'Chuva congelante leve', dia: '🌧️', noite: '🌧️' },
  67: { descricao: 'Chuva congelante forte', dia: '🌧️', noite: '🌧️' },
  71: { descricao: 'Neve leve', dia: '🌨️', noite: '🌨️' },
  73: { descricao: 'Neve moderada', dia: '🌨️', noite: '🌨️' },
  75: { descricao: 'Neve intensa', dia: '❄️', noite: '❄️' },
  77: { descricao: 'Grãos de neve', dia: '❄️', noite: '❄️' },
  80: { descricao: 'Pancadas de chuva leves', dia: '🌦️', noite: '🌧️' },
  81: { descricao: 'Pancadas de chuva moderadas', dia: '🌧️', noite: '🌧️' },
  82: { descricao: 'Pancadas de chuva violentas', dia: '⛈️', noite: '⛈️' },
  85: { descricao: 'Pancadas de neve leves', dia: '🌨️', noite: '🌨️' },
  86: { descricao: 'Pancadas de neve fortes', dia: '❄️', noite: '❄️' },
  95: { descricao: 'Trovoada', dia: '⛈️', noite: '⛈️' },
  96: { descricao: 'Trovoada com granizo leve', dia: '⛈️', noite: '⛈️' },
  99: { descricao: 'Trovoada com granizo forte', dia: '⛈️', noite: '⛈️' }
};

function mostrarMensagem(texto, tipo = '') {
  mensagem.textContent = texto;
  mensagem.className = tipo ? `mensagem ${tipo}` : 'mensagem';
}

function formatarNumero(valor) {
  return Math.round(valor);
}

async function buscarClima(cidadeDigitada) {
  // Primeiro, transforma o nome da cidade em coordenadas geográficas.
  const urlGeocodificacao = new URL('https://geocoding-api.open-meteo.com/v1/search');
  urlGeocodificacao.search = new URLSearchParams({
    name: cidadeDigitada,
    count: '1',
    language: 'pt',
    format: 'json'
  });

  const respostaLocal = await fetch(urlGeocodificacao);
  if (!respostaLocal.ok) {
    throw new Error('Não foi possível pesquisar essa cidade. Tente novamente.');
  }

  const dadosLocal = await respostaLocal.json();
  if (!dadosLocal.results || dadosLocal.results.length === 0) {
    throw new Error('Cidade não encontrada. Confira o nome e tente novamente.');
  }

  const local = dadosLocal.results[0];

  // Depois, consulta o clima usando latitude e longitude.
  const urlClima = new URL('https://api.open-meteo.com/v1/forecast');
  urlClima.search = new URLSearchParams({
    latitude: local.latitude,
    longitude: local.longitude,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '7',
    timezone: 'auto'
  });

  const respostaClima = await fetch(urlClima);
  if (!respostaClima.ok) {
    throw new Error('Não foi possível obter os dados do clima. Tente novamente.');
  }

  const dadosClima = await respostaClima.json();
  if (!dadosClima.current) {
    throw new Error('Os dados meteorológicos não estão disponíveis no momento.');
  }

  exibirClima(local, dadosClima.current, dadosClima.daily);
}

function exibirClima(local, atual, diario) {
  const condicao = codigosClima[atual.weather_code] || {
    descricao: 'Condição climática não identificada',
    dia: '🌡️',
    noite: '🌡️'
  };

  const partesLocal = [local.name, local.admin1, local.country].filter(Boolean);
  document.getElementById('nome-local').textContent = [...new Set(partesLocal)].join(' • ');
  document.getElementById('temperatura').textContent = formatarNumero(atual.temperature_2m);
  document.getElementById('sensacao').textContent = `${formatarNumero(atual.apparent_temperature)} °C`;
  document.getElementById('umidade').textContent = `${atual.relative_humidity_2m}%`;
  document.getElementById('vento').textContent = `${formatarNumero(atual.wind_speed_10m)} km/h`;
  document.getElementById('descricao').textContent = condicao.descricao;
  document.getElementById('icone-clima').textContent = atual.is_day ? condicao.dia : condicao.noite;

  const horario = atual.time ? new Date(atual.time) : new Date();
  document.getElementById('data-atualizacao').textContent =
    `Atualizado em ${horario.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;

  exibirPrevisao(diario);
  resultado.hidden = false;
}

function exibirPrevisao(diario) {
  const lista = document.getElementById('lista-previsao');
  lista.replaceChildren();

  if (!diario || !Array.isArray(diario.time)) {
    lista.textContent = 'Previsão semanal indisponível no momento.';
    return;
  }

  diario.time.forEach((data, indice) => {
    const clima = codigosClima[diario.weather_code[indice]] || {
      descricao: 'Condição não identificada', dia: '🌡️'
    };
    const dataLocal = new Date(`${data}T12:00:00`);
    const nomeDia = indice === 0 ? 'Hoje' :
      dataLocal.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

    const cartao = document.createElement('article');
    cartao.className = 'dia-previsao';

    const dia = document.createElement('span');
    dia.className = 'dia-nome';
    dia.textContent = nomeDia;

    const icone = document.createElement('span');
    icone.className = 'dia-icone';
    icone.textContent = clima.dia;
    icone.title = clima.descricao;
    icone.setAttribute('aria-label', clima.descricao);

    const maxima = document.createElement('strong');
    maxima.className = 'maxima';
    maxima.textContent = `${formatarNumero(diario.temperature_2m_max[indice])}°`;

    const minima = document.createElement('span');
    minima.className = 'minima';
    minima.textContent = `${formatarNumero(diario.temperature_2m_min[indice])}°`;

    const chuva = document.createElement('span');
    chuva.className = 'chuva';
    const chance = diario.precipitation_probability_max?.[indice];
    chuva.textContent = chance == null ? 'Chuva: --' : `Chuva ${chance}%`;

    cartao.append(dia, icone, maxima, minima, chuva);
    lista.appendChild(cartao);
  });
}

formBusca.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const cidade = campoCidade.value.trim();
  fecharSugestoes();

  if (!cidade) {
    resultado.hidden = true;
    mostrarMensagem('Digite o nome de uma cidade antes de buscar.', 'erro');
    campoCidade.focus();
    return;
  }

  botaoBuscar.disabled = true;
  botaoBuscar.textContent = 'Buscando...';
  resultado.hidden = true;
  mostrarMensagem('Carregando...');

  try {
    await buscarClima(cidade);
    mostrarMensagem('');
  } catch (erro) {
    resultado.hidden = true;
    mostrarMensagem(
      erro instanceof TypeError
        ? 'Falha na conexão. Verifique sua internet e tente novamente.'
        : erro.message,
      'erro'
    );
  } finally {
    botaoBuscar.disabled = false;
    botaoBuscar.textContent = 'Buscar clima';
  }
});


// Sugestões automáticas enquanto o usuário digita.
const listaSugestoes = document.getElementById('sugestoes');
let temporizadorSugestoes;
let ultimaBuscaSugestoes = 0;

function fecharSugestoes() {
  listaSugestoes.hidden = true;
  listaSugestoes.replaceChildren();
}

async function buscarSugestoes(termo) {
  const numeroBusca = ++ultimaBuscaSugestoes;
  if (termo.length < 2) {
    fecharSugestoes();
    return;
  }

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({
    name: termo, count: '5', language: 'pt', format: 'json'
  });

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) return;
    const dados = await resposta.json();
    if (numeroBusca !== ultimaBuscaSugestoes) return;

    listaSugestoes.replaceChildren();
    (dados.results || []).forEach((local) => {
      const item = document.createElement('li');
      item.setAttribute('role', 'option');
      item.tabIndex = 0;
      const detalhes = [local.admin1, local.country].filter(Boolean);
      item.textContent = detalhes.length
        ? `${local.name} — ${detalhes.join(', ')}`
        : local.name;

      const selecionar = () => {
        campoCidade.value = local.name;
        fecharSugestoes();
        formBusca.requestSubmit();
      };

      item.addEventListener('click', selecionar);
      item.addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          selecionar();
        }
      });
      listaSugestoes.appendChild(item);
    });
    listaSugestoes.hidden = listaSugestoes.children.length === 0;
  } catch {
    fecharSugestoes();
  }
}

campoCidade.addEventListener('input', () => {
  clearTimeout(temporizadorSugestoes);
  const termo = campoCidade.value.trim();
  temporizadorSugestoes = setTimeout(() => buscarSugestoes(termo), 300);
});

campoCidade.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') fecharSugestoes();
});

document.addEventListener('click', (evento) => {
  if (!formBusca.contains(evento.target)) fecharSugestoes();
});
