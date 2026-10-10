// Cartela de Bingo Acessível — Uesley Gomes.
// Mesmo contrato do frontend: GET /health; POST /recognize com FormData, campo image.
// Corrige o envio ao modelo existente, sem recriar a arquitetura ou aceitar licenças automaticamente.
const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';
const VERSION = 'bingo-vision-v2';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store'
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
}
function extract(value) {
  if (value && typeof value === 'object' && (Array.isArray(value.grid) || typeof value.error === 'string')) return value;
  const text = typeof value === 'string' ? value : typeof value?.response === 'string' ? value.response : typeof value?.result?.response === 'string' ? value.result.response : '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('A IA não devolveu uma transcrição JSON.');
  return JSON.parse(match[0]);
}
function validateGrid(parsed) {
  if (parsed?.uncertain === true || (Array.isArray(parsed?.uncertain_cells) && parsed.uncertain_cells.length)) throw new Error('A IA não confirmou todos os números.');
  const grid = parsed?.grid;
  if (!Array.isArray(grid) || grid.length !== 5 || grid.some(row => !Array.isArray(row) || row.length !== 5)) throw new Error('A IA não devolveu cinco linhas de cinco casas.');
  const numbers = [];
  const normalized = grid.map((row, r) => row.map((value, c) => {
    if (r === 2 && c === 2 && (value === null || (typeof value === 'string' && /^(free|livre)$/i.test(value.trim())))) return null;
    if (typeof value !== 'number' && !(typeof value === 'string' && /^[1-9]\d?$/.test(value.trim()))) throw new Error('Há uma casa ilegível ou inválida.');
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 99) throw new Error('Há números fora do intervalo de 1 a 99.');
    numbers.push(number); return number;
  }));
  if ((numbers.length !== 24 && numbers.length !== 25) || new Set(numbers).size !== numbers.length) throw new Error('Há números repetidos ou casas ausentes.');
  return normalized;
}
function validSignature(bytes, type) {
  if (type === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (type === 'image/webp') return bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80;
  return false;
}
const prompt = `Transcreva a única cartela física de bingo desta imagem. Preserve cada posição visual, da esquerda para a direita e de cima para baixo, sem ordenar ou completar números.
Responda somente um objeto JSON com a propriedade grid: uma matriz de exatamente 5 linhas, cada uma com 5 casas. Cada casa deve conter o número inteiro que está visível, de 1 a 99. Os números não se repetem.
Somente a casa central, linha 3 coluna 3, pode ser null, e somente quando estiver claramente identificada como FREE ou LIVRE. Se houver um número no centro, transcreva esse número.
Não deduza uma casa a partir da sequência dos outros números. Não crie uma cartela de exemplo. Não interprete títulos, números de série ou texto fora da grade como casas.
Se a imagem não mostrar uma única cartela 5 por 5 completa, ou se qualquer casa estiver cortada, desfocada, vazia ou incerta, não devolva grid. Responda {"error":"Não foi possível ler toda a cartela com segurança. Tire outra foto com a cartela inteira, boa iluminação e sem reflexos."}.`;

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (path === '/health' && request.method === 'GET') return json({ ok: true, aiConfigured: typeof env.AI?.run === 'function', version: VERSION, model: MODEL });
    if (path !== '/recognize') return json({ ok: false, error: 'Rota não encontrada. Use GET /health ou POST /recognize.' }, 404);
    if (request.method !== 'POST') return json({ ok: false, error: 'Use POST para reconhecer a fotografia.' }, 405);
    if (typeof env.AI?.run !== 'function') return json({ ok: false, code: 'AI_NOT_CONFIGURED', error: 'O vínculo AI não está configurado no Worker.' }, 503);
    if (!/^multipart\/form-data\s*;/i.test(request.headers.get('Content-Type') || '')) return json({ ok: false, error: 'Envie multipart/form-data com a fotografia no campo image.' }, 415);
    const declaredLength = Number(request.headers.get('Content-Length'));
    if (declaredLength > MAX_IMAGE_BYTES + 1024 * 1024) return json({ ok: false, error: 'Imagem maior que 8 MB.' }, 413);
    let file;
    try { file = (await request.formData()).get('image'); }
    catch { return json({ ok: false, error: 'O formulário da fotografia está inválido.' }, 400); }
    if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return json({ ok: false, error: 'Envie uma imagem JPEG, PNG ou WebP no campo image.' }, 400);
    if (!file.size) return json({ ok: false, error: 'A fotografia está vazia.' }, 400);
    if (file.size > MAX_IMAGE_BYTES) return json({ ok: false, error: 'Imagem maior que 8 MB.' }, 413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!validSignature(bytes, file.type)) return json({ ok: false, error: 'O arquivo não tem o formato de imagem informado.' }, 400);
    let output;
    try {
      // Workers AI espera image no nível superior, junto de prompt; não em messages[].content[].
      output = await env.AI.run(MODEL, { prompt, image: Array.from(bytes), max_tokens: 768, temperature: 0 });
    } catch (error) {
      console.error('Recognition model error', error);
      const message = String(error?.message || '');
      if (/license|licen[cs]e|agree|agreement|terms of use/i.test(message)) return json({ ok: false, code: 'MODEL_LICENSE_REQUIRED', error: 'O modelo de visão exige que o responsável pela conta Cloudflare aceite a licença da Meta. O aplicativo não pode concluir o reconhecimento antes disso.' }, 503);
      return json({ ok: false, code: 'AI_UNAVAILABLE', error: 'O serviço de inteligência artificial não conseguiu processar a foto. Tente novamente mais tarde.' }, 502);
    }
    try {
      const parsed = extract(output);
      if (parsed.error) return json({ ok: false, error: String(parsed.error).slice(0, 600) }, 422);
      return json({ ok: true, grid: validateGrid(parsed), version: VERSION });
    } catch {
      return json({ ok: false, error: 'O reconhecimento não produziu uma cartela válida e completa. Nenhum número foi preenchido. Tire outra foto.' }, 422);
    }
  }
};
