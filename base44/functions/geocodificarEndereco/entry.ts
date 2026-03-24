import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Normaliza CEP para apenas 8 dígitos numéricos
function normalizarCep(cep) {
  return (cep || '').replace(/\D/g, '').padStart(8, '0').slice(0, 8);
}

// Delay para evitar rate limit do Nominatim
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Busca no Nominatim com log
async function buscarNominatim(query, descricao, delayMs = 0) {
  if (delayMs > 0) await sleep(delayMs);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br&accept-language=pt-BR`;
  console.log(`[geocodificar] Tentativa: ${descricao} | query: ${query}`);
  const resp = await fetch(url, { headers: { 'User-Agent': 'NinjaGO-Delivery-App' } });
  if (!resp.ok) {
    console.log(`[geocodificar] Falha HTTP ${resp.status} para: ${descricao}`);
    if (resp.status === 429) await sleep(2000); // espera extra em caso de rate limit
    return null;
  }
  const data = await resp.json();
  if (data && data.length > 0) {
    console.log(`[geocodificar] Sucesso em: ${descricao} | lat=${data[0].lat} lng=${data[0].lon}`);
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  }
  console.log(`[geocodificar] Sem resultado para: ${descricao}`);
  return null;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { latitude, longitude, endereco } = payload;

    // ─── GEOCODIFICAÇÃO REVERSA: lat/lng → endereço ───────────────────────────
    if (latitude && longitude) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR&addressdetails=1`,
        { headers: { 'User-Agent': 'NinjaGO-Delivery-App' } }
      );

      const data = await response.json();

      if (!data || data.error) {
        return Response.json({ success: false, error: 'Não foi possível obter o endereço para esta localização' });
      }

      const address = data.address || {};
      return Response.json({
        success: true,
        endereco: {
          cep: normalizarCep(address.postcode || ''),
          logradouro: address.road || address.street || address.pedestrian || '',
          numero: address.house_number || '',
          bairro: address.suburb || address.neighbourhood || address.district || address.city_district || '',
          cidade: address.city || address.town || address.village || address.municipality || '',
          estado: address.state_code || address.state || '',
          latitude,
          longitude
        }
      });
    }

    // ─── GEOCODIFICAÇÃO DIRETA: endereço/CEP → lat/lng ────────────────────────
    if (!endereco) {
      return Response.json({ success: false, error: 'Endereço não informado' }, { status: 400 });
    }

    console.log(`[geocodificar] Entrada recebida: "${endereco}"`);

    // Extrair CEP da string de entrada (se houver)
    const cepMatch = endereco.match(/\b(\d{5}-?\d{3})\b/);
    const cepNormalizado = cepMatch ? normalizarCep(cepMatch[1]) : null;

    // Extrair cidade/estado da string (heurística: penúltimo e antepenúltimo segmentos)
    const partes = endereco.split(',').map(s => s.trim()).filter(Boolean);
    const cidade = partes.find(p => !p.match(/^\d/) && p.length > 3 && !p.match(/^(SP|RJ|MG|RS|PR|SC|BA|CE|PE|GO|AM|PA|MA|PI|RN|PB|SE|AL|TO|MS|MT|RO|RR|AC|AP|DF)$/i)) || '';
    const estado = partes.find(p => p.match(/^[A-Z]{2}$/)) || '';

    let resultado = null;
    let precisao = 'exato';

    // Tentativa 1: endereço completo como enviado
    resultado = await buscarNominatim(endereco, 'endereço completo original');

    // Tentativa 2: CEP isolado + Brasil
    if (!resultado && cepNormalizado) {
      resultado = await buscarNominatim(`${cepNormalizado} Brasil`, `CEP isolado (${cepNormalizado})`, 1000);
    }

    // Tentativa 3: CEP + cidade (se extraída)
    if (!resultado && cepNormalizado && cidade) {
      resultado = await buscarNominatim(`${cepNormalizado} ${cidade} Brasil`, `CEP + cidade`, 1000);
    }

    // Tentativa 4: primeiros 3 segmentos do endereço (rua, número, bairro)
    if (!resultado && partes.length > 3) {
      const enderecoReduzido = partes.slice(0, 3).join(', ');
      resultado = await buscarNominatim(enderecoReduzido, 'endereço reduzido (3 segmentos)', 1000);
    }

    // Tentativa 5: apenas rua + cidade + estado
    if (!resultado && partes.length >= 2 && (cidade || estado)) {
      precisao = 'aproximado';
      const enderecoBasico = [partes[0], cidade, estado, 'Brasil'].filter(Boolean).join(', ');
      resultado = await buscarNominatim(enderecoBasico, 'rua + cidade + estado', 1000);
    }

    // Tentativa 6: apenas cidade + estado (fallback amplo — impreciso)
    if (!resultado && cidade && estado) {
      precisao = 'cidade';
      resultado = await buscarNominatim(`${cidade} ${estado} Brasil`, 'cidade + estado (fallback amplo)', 1000);
    }

    if (resultado) {
      return Response.json({ success: true, precisao, ...resultado });
    }

    console.log(`[geocodificar] Todas as tentativas falharam para: "${endereco}"`);
    return Response.json({
      success: false,
      error: 'CEP ou endereço não encontrado. Verifique os dados e tente novamente.'
    });

  } catch (error) {
    console.error('[geocodificar] Erro interno:', error.message);
    return Response.json({ success: false, error: 'Erro interno ao processar geocodificação' }, { status: 500 });
  }
});