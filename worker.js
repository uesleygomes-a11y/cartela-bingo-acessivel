// Cartela de Bingo Acessível — correção diagnóstica v2.3
const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';
const VERSION = 'bingo-vision-v2.3';
const MAX_BYTES = 8 * 1024 * 1024;
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};
const reply = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{...CORS,'Content-Type':'application/json; charset=utf-8'}});
const errorReply=(status,code,stage,message,detail='',requestId='')=>reply({ok:false,code,stage,error:message,diagnostic:{detail:String(detail).slice(0,500),requestId},version:VERSION},status);
const PROMPT = `Leia a fotografia de uma cartela física de bingo. Transcreva as 5 linhas e 5 colunas na posição visual exata, sem ordenar, adivinhar ou completar números. Responda SOMENTE JSON: {"grid":[[1,2,3,4,5],[6,7,8,9,10],[11,12,null,14,15],[16,17,18,19,20],[21,22,23,24,25]]}. Os números do exemplo NÃO são a resposta; use apenas os da fotografia. Cada número deve estar entre 1 e 99 e não pode se repetir. Somente o centro pode ser null se estiver escrito LIVRE ou FREE. Se qualquer casa estiver ilegível ou a grade incompleta, responda {"error":"CARTELA_ILEGIVEL"} e NÃO invente números.`;
function parseModel(output) {
  if (output && typeof output === 'object' && (Array.isArray(output.grid)||output.error)) return output;
  const raw = typeof output === 'string' ? output : output?.response ?? output?.result?.response;
  if (typeof raw !== 'string' || !raw.trim()) throw Object.assign(new Error('Resposta vazia ou em formato inesperado da IA.'),{code:'AI_EMPTY_RESPONSE'});
  const start=raw.indexOf('{'),end=raw.lastIndexOf('}');
  if(start<0||end<start) throw Object.assign(new Error('A IA respondeu sem objeto JSON.'),{code:'AI_NO_JSON'});
  try {return JSON.parse(raw.slice(start,end+1));}
  catch {throw Object.assign(new Error('A IA retornou JSON inválido.'),{code:'AI_INVALID_JSON'});}
}
function validate(parsed) {
  if(parsed?.error) throw Object.assign(new Error('A IA não conseguiu ler a cartela com segurança: '+String(parsed.error).slice(0,150)),{code:'CARD_UNREADABLE'});
  if(parsed?.uncertain===true || parsed?.uncertain_cells?.length) throw Object.assign(new Error('A IA sinalizou casas incertas.'),{code:'UNCERTAIN_CELLS'});
  const grid=parsed?.grid;
  if(!Array.isArray(grid)||grid.length!==5||grid.some(r=>!Array.isArray(r)||r.length!==5)) throw Object.assign(new Error('A resposta não contém uma matriz 5 por 5.'),{code:'INVALID_GRID_SHAPE'});
  const seen=new Set();
  return grid.map((row,r)=>row.map((v,c)=>{
    if(r===2&&c===2&&(v===null||(typeof v==='string'&&/^(free|livre)$/i.test(v.trim()))))return null;
    if(!(typeof v==='number'||typeof v==='string'&&/^[1-9]\d?$/.test(v.trim()))) throw Object.assign(new Error(`Casa inválida na linha ${r+1}, coluna ${c+1}.`),{code:'INVALID_CELL'});
    const n=Number(v);
    if(!Number.isInteger(n)||n<1||n>99)throw Object.assign(new Error(`Número fora de 1 a 99 na linha ${r+1}, coluna ${c+1}.`),{code:'OUT_OF_RANGE'});
    if(seen.has(n))throw Object.assign(new Error(`Número ${n} repetido na linha ${r+1}, coluna ${c+1}.`),{code:'DUPLICATE_NUMBER'});
    seen.add(n);return n;
  }));
}
function signature(bytes,type){
 if(type==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(type==='image/png')return [137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
 if(type==='image/webp')return [82,73,70,70].every((n,i)=>bytes[i]===n)&&[87,69,66,80].every((n,i)=>bytes[i+8]===n);
 return false;
}
export default {async fetch(request,env){
 const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
 const requestId=crypto.randomUUID();
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 if(path==='/health'&&request.method==='GET')return reply({ok:true,aiConfigured:typeof env.AI?.run==='function',version:VERSION,model:MODEL});
 if(path!=='/recognize')return errorReply(404,'ROUTE_NOT_FOUND','routing','Rota não encontrada.','Use GET /health ou POST /recognize.',requestId);
 if(request.method!=='POST')return errorReply(405,'METHOD_NOT_ALLOWED','routing','A rota de reconhecimento exige POST.','',requestId);
 if(typeof env.AI?.run!=='function')return errorReply(503,'AI_NOT_CONFIGURED','configuration','O binding AI não está disponível no Worker.','Verifique o binding AI da implantação.',requestId);
 if(!/^multipart\/form-data\s*;/i.test(request.headers.get('content-type')||''))return errorReply(415,'INVALID_CONTENT_TYPE','upload','A imagem deve ser enviada como multipart/form-data.','Campo obrigatório: image.',requestId);
 let form;try{form=await request.formData();}catch(e){return errorReply(400,'INVALID_FORM','upload','O formulário da imagem não pôde ser lido.',e?.message,requestId);}
 const file=form.get('image');
 if(!(file instanceof File)||!['image/jpeg','image/png','image/webp'].includes(file.type))return errorReply(400,'INVALID_IMAGE','upload','Envie uma imagem JPEG, PNG ou WebP no campo image.','',requestId);
 if(!file.size||file.size>MAX_BYTES)return errorReply(413,'IMAGE_SIZE','upload','A imagem está vazia ou excede 8 MB.',`Tamanho: ${file.size} bytes`,requestId);
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(!signature(bytes,file.type))return errorReply(400,'IMAGE_SIGNATURE','upload','O conteúdo não corresponde ao formato informado.','',requestId);
 let output;
 try {output=await env.AI.run(MODEL,{prompt:PROMPT,image:Array.from(bytes),max_tokens:1024,temperature:0});}
 catch(e){console.error('AI_FAILURE',requestId,e);return errorReply(502,'AI_PROVIDER_ERROR','ai','A Cloudflare AI não conseguiu processar a fotografia.',e?.message||String(e),requestId);}
 let parsed;
 try{parsed=parseModel(output);}catch(e){console.error('AI_PARSE_FAILURE',requestId,e);return errorReply(422,e.code||'AI_PARSE_ERROR','parsing','A IA respondeu, mas a resposta não pôde ser interpretada.',e.message,requestId);}
 try{return reply({ok:true,grid:validate(parsed),version:VERSION,requestId});}
 catch(e){console.error('GRID_VALIDATION_FAILURE',requestId,e);return errorReply(422,e.code||'GRID_VALIDATION_ERROR','validation','A leitura não produziu uma cartela completa e confiável.',e.message,requestId);}
 }};
