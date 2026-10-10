# Auditoria e correção — Cartela de Bingo Acessível

Criador: Uesley Gomes. Sessão de 9 de outubro de 2026, data local de Fortaleza.

## Resultado e limite da entrega

O arquivo final tem o nome **index.html**. O endereço público do Worker está incorporado. A interface foi corrigida e executada em navegador, com 75 verificações automatizadas aprovadas. Também foi preparada uma correção separada para o **worker.js**, mantendo o Worker existente, o mesmo modelo e o vínculo AI.

**O reconhecimento real ainda não está comprovado.** Foi enviada uma imagem de cartela com números conhecidos ao serviço público. POST /recognize retornou HTTP 404 com `{"ok":false,"error":"Rota não encontrada."}`. Não houve uma grade reconhecida para comparar com os números da imagem. Os testes locais de integração usam uma resposta de IA simulada e não medem a precisão do modelo.

Nenhuma publicação, alteração de repositório ou alteração da conta Cloudflare foi realizada. Não houve acesso autenticado à conta privada e não foram solicitadas credenciais.

## Arquivos examinados

Foram lidos integralmente os dois HTMLs, worker.js, wrangler.jsonc, README.md, LEIA-ME.txt e Relatorio-Cartela-Bingo.md. Também foi baixado o HTML servido pelo GitHub Pages: seus bytes eram iguais aos do index.html original.

Repositório: https://github.com/uesleygomes-a11y/cartela-bingo-acessivel

Aplicativo: https://uesleygomes-a11y.github.io/cartela-bingo-acessivel/

Worker: https://cartela-bingo-acessivel.uesleygomes.workers.dev/

## Diagnóstico baseado em código e execução

1. **A versão publicada não incorpora o endereço.** index.html começa com endereço vazio se o navegador não tiver uma configuração anterior. Isso reproduz a condição que causa a mensagem pedindo configurar o Worker. O arquivo index.html.html contém o endereço padrão, mas não é o arquivo de entrada servido na raiz do GitHub Pages.
2. **Não existem erros de sintaxe JavaScript nos dois HTMLs examinados.** Os scripts inline e o worker.js original passaram em node --check. A suspeita de sintaxe não foi confirmada.
3. **A marcação perde o foco nos dois HTMLs.** Cada clique recria todos os botões com replaceChildren. O navegador confirmou que o elemento ativo passa para BODY depois de marcar. Na correção, só o estado do botão existente é atualizado.
4. **A validação original aceita tipos impróprios.** Number(true) pode virar 1 e uma lista com um número pode virar esse número. Um teste reproduziu a aceitação de true como 1 em uma grade sem duplicação. A correção aceita somente inteiros de 1 a 99 ou strings numéricas simples, além do centro livre explícito.
5. **A inicialização dependia de localStorage sem tratamento.** Um bloqueio de armazenamento podia interromper a instalação dos eventos. A correção funciona com SecurityError de armazenamento, utiliza o endereço padrão e ignora a chave antiga v1.
6. **Os dois HTMLs não possuem regras de quina, direções ou cartela cheia, nem leitura dos restantes.** O próprio LEIA-ME.txt confirma essa ausência. Esses recursos foram implementados sobre a interface existente, sem substituir a arquitetura.
7. **O serviço público não cumpre o contrato do worker.js do GitHub.** GET /health e POST /recognize retornaram 404. O código do GitHub define essas rotas. A resposta e os cabeçalhos publicados também diferem: o serviço anuncia métodos POST,OPTIONS, enquanto o código do GitHub anuncia GET, POST, OPTIONS. Isso comprova uma incompatibilidade de comportamento; o código exato implantado só pode ser comparado no painel privado ou com uma publicação identificada.
8. **A chamada de visão do código do GitHub usa um campo de imagem incompatível com o formato documentado.** Ela coloca type:image/image:bytes dentro de messages[].content[]. A correção usa prompt e image no nível superior. O tipo oficial do modelo permite image como number[] ou string nesse nível; a variante multimodal em messages usa image_url, não image. Esse problema foi verificado contra a documentação e os tipos oficiais, e reproduzido com uma simulação que verifica o contrato. A inferência da Cloudflare não pôde ser executada nesta sessão.
9. **CORS não foi demonstrado como causa principal do 404.** Com User-Agent explícito, OPTIONS /recognize respondeu 204 e Access-Control-Allow-Origin:*. POST /recognize respondeu JSON 404 com esse mesmo cabeçalho. Requisições com o User-Agent padrão do Python também receberam 403/error code:1010; esse bloqueio do cliente não foi tratado como prova de falha do código do aplicativo.

## Diferença entre os dois HTMLs

| Item | index.html original | index.html.html |
| --- | --- | --- |
| Endereço inicial | localStorage v1 ou vazio | localStorage v1 ou endereço público padrão |
| Captura, repetição e prévia | Presentes | Iguais |
| Redução da imagem e envio multipart | Presentes | Iguais |
| Validação 5×5 e marcação | Presentes | Iguais, inclusive os problemas |
| Leitura dos marcados | Presente | Igual |
| Regras e leitura dos restantes | Ausentes | Ausentes |
| Sintaxe JavaScript | Válida | Válida |

A diferença de código consiste em uma única linha que acrescenta DEFAULT_WORKER. Nenhuma outra funcionalidade foi adicionada ou removida entre esses dois arquivos.

## Correções entregues

- Endereço padrão embutido, com configuração avançada opcional preservada e restauração do padrão. A pessoa não precisa digitar o endereço para usar o aplicativo.
- Captura e repetição da mesma fotografia, preparação de JPEG com lado máximo de 1600 pixels e alternativa compatível com navegadores sem createImageBitmap.
- Cancelamento, limite de espera, proteção contra resposta atrasada e bloqueio de novas capturas durante reconhecimento.
- Erros anunciados por role=alert; uma região polite/atomic para mensagens de estado. Percentuais artificiais não são utilizados.
- Grade preservando posições, com 24 números e LIVRE ou 25 números com centro numérico. Sem preenchimento de casas ausentes, valores padrão ou reordenação.
- Marcações em botões nativos, aria-pressed, posições no nome acessível, símbolo de marcado além da cor e foco preservado.
- Leitura dos marcados, dos restantes e da cartela por linhas.
- Direções horizontais, verticais, diagonais ou todas; quina opcional, centro opcional na quina e bingo de cartela cheia opcional.
- Se o centro não valer na quina, linhas que atravessam o centro ficam excluídas das quinas. Essa escolha não altera cartela cheia. Com quina desativada, linhas válidas são anunciadas como linha completa. A regra aparece em texto na interface.
- Vitórias simultâneas agrupadas em uma mensagem, sem repetir uma vitória ao marcar outro número. Bingo de cartela cheia tem prioridade. Contagem de aproximação à quina somente quando não há uma linha já completa.
- Uma foto inválida preserva as marcações da partida atual; há um botão para retomá-la. Uma nova leitura válida substitui a cartela, conforme o aviso apresentado antes da confirmação.
- Alto contraste, foco visível, controles confortáveis, estrutura semântica, refluxo e grade com rolagem própria quando o texto é ampliado.
- Worker corrigido com validação de entrada, assinatura de imagem, tamanho, grade, duplicação, incerteza e respostas de erro. A licença do modelo não é aceita automaticamente.

## Contrato de API da correção

| Requisição | Entrada | Saída |
| --- | --- | --- |
| GET /health | Sem imagem | ok:true, aiConfigured:boolean, version:bingo-vision-v2 e nome do modelo. Confirma o vínculo, não o reconhecimento. |
| OPTIONS | Pré-verificação CORS | HTTP 204, origem *, métodos GET/POST/OPTIONS e Content-Type permitido. |
| POST /recognize | multipart/form-data, campo image, JPEG/PNG/WebP até 8 MB | HTTP 200, ok:true e grid 5×5 com posições preservadas. |
| Foto ilegível/grade inválida | Mesma entrada | HTTP 422, mensagem de erro, sem grid. |
| Sem vínculo AI/licença necessária | — | HTTP 503, código de erro e explicação. |
| Falha do modelo | — | HTTP 502, mensagem acessível. |

O frontend envia JPEG e deixa o navegador montar o cabeçalho multipart com boundary. O Worker chama o modelo @cf/meta/llama-3.2-11b-vision-instruct com prompt, image:number[], max_tokens:768 e temperature:0. A resposta é validada no servidor e novamente no navegador. wrangler.jsonc já aponta para worker.js e para o vínculo AI; não foi necessário criar outro Worker ou mudar a arquitetura.

## Testes executados

Ambiente: Linux; Node 24.19.0; Chromium 138.0.7204.0; Playwright 1.62.1. O navegador Chromium padrão não pôde ser baixado, e foi utilizado @sparticuz/chromium 138.0.2. As opções que desabilitam a segurança de origem foram removidas da execução do navegador.

- Sintaxe dos dois scripts originais, do Worker original, do script final e do Worker corrigido: aprovada por node --check.
- HTML final: aprovado em html-validate, configuração recommended, sem desligar regras na execução final. Referências a IDs, unicidade, nome e ausência de arquivos externos necessários também foram conferidos.
- 75 verificações automatizadas: aprovadas, zero falhas na execução final.
- Fluxo integrado local: seleção de JPEG real no input → decodificação pelo navegador → conversão JPEG → multipart → execução do handler corrigido → resposta de IA simulada → grade exata. Os 25 espaços coincidiram com a matriz conhecida.
- Regras: cinco horizontais, cinco verticais, duas diagonais, centro livre e numérico, centro excluído, direções desativadas e cartela cheia de 24/25 números.
- Entrada inválida, grade incompleta, duplicação, incerteza, falha de rede, HTTP 404, resposta sem JSON, cancelamento e timeout: rejeição/recuperação aprovadas. O teste de timeout acelera o relógio; o limite do arquivo entregue permanece 60 segundos.
- Foco ao marcar/desmarcar, Tab, Espaço e Enter: aprovados.
- Larguras 320, 360, 390, 850 e 1280 pixels; fonte a 200% em 320 pixels: página sem rolagem horizontal. A grade bidimensional tem rolagem própria quando necessário. Capturas foram inspecionadas visualmente.
- Cinco execuções axe-core com tags WCAG A/AA até 2.2: inicial, confirmação, partida/configuração, texto ampliado e erro. Zero violações e zero verificações incompletas na execução final, incluindo contraste.
- Console: nenhum erro inesperado de JavaScript. Falhas de rede provocadas intencionalmente foram registradas separadamente.
- Serviço público: GET /health 404; GET /recognize 404; OPTIONS /recognize 204; POST /recognize com imagem de cartela conhecida 404. Esses resultados não equivalem a sucesso do reconhecimento.

A imagem de teste tem 1100×1260 pixels, cinco linhas e cinco colunas, 24 números no intervalo de 1 a 99 e centro LIVRE. Foi desenhada para possuir gabarito exato; não é uma fotografia de papel capturada por celular.

## Limitações restantes

- Não houve reconhecimento real concluído pelo serviço Cloudflare. É necessária uma publicação compatível do Worker e uma resposta real que coincida com todos os números e posições de uma cartela conhecida.
- Não houve uso humano de TalkBack, VoiceOver ou NVDA, nem abertura da câmera física no Samsung S25 ou iPhone. A semântica e o teclado foram testados, mas essas combinações precisam de validação em dispositivo.
- As verificações axe não constituem certificação ou auditoria exaustiva de conformidade WCAG 2.2 AA.
- Rejeitar grades inválidas não mede a precisão de uma grade bem formada. Um modelo de visão pode transcrever um número incorretamente sem violar o formato; a qualidade só será conhecida com testes de imagens reais e gabarito.
- Orientação automática de enquadramento em câmera ao vivo não existe nesta entrega. Há instruções e repetição de fotografia.
- HEIC/HEIF depende da capacidade de decodificação do navegador. Se ele não conseguir abrir a imagem, o aplicativo solicita outra foto em JPEG ou PNG.
- A partida é mantida enquanto a página estiver aberta. Fechar/recarregar não salva o progresso; os dois HTMLs examinados também não possuíam salvamento, PWA ou reconhecimento offline.
- O vínculo AI e eventual aceitação prévia da licença na conta só podem ser confirmados depois de publicar e executar a inferência. O arquivo trata esses erros, mas não modifica configurações privadas.

## Publicação curta e segura

1. No repositório existente, abra Add file → Upload files e envie o arquivo baixado index.html na raiz, em main. Confirme que a lista mostra index.html e que ele substitui o arquivo existente. Confirme o commit. Não adicione outra extensão ao nome.
2. No Worker Cloudflare existente, publique o conteúdo do worker.js corrigido, mantendo o vínculo Workers AI com o nome AI. Apenas colocar worker.js no GitHub Pages não implanta o backend.
3. Para comprovar qual correção está publicada, GET /health deve devolver version:bingo-vision-v2 e aiConfigured:true. Depois abra o aplicativo e faça o teste de uma cartela física com gabarito conhecido. O teste de conexão isolado não comprova OCR.
4. Após substituir index.html, o antigo index.html.html fica obsoleto. Ele pode ser removido em um commit separado; o aplicativo na raiz não depende dele.

Essas ações de publicação dependem da conta autenticada do proprietário. Os arquivos desta entrega estão completos e com os nomes exatos, sem exigir renomear extensões no Windows.

Sugestão de título do commit: Corrige integração com Worker e acessibilidade da cartela

Descrição: Configura a conexão padrão, preserva o foco na marcação, valida a grade e implementa regras de quina e bingo. Interface e Worker de referência verificados por sintaxe, HTML, navegador e 75 testes automatizados; reconhecimento real pendente da publicação compatível do backend.

## Referências primárias

- Cloudflare, modelo e parâmetros: https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/
- Cloudflare, chamada de visão com imagem no nível superior: https://developers.cloudflare.com/workers-ai/guides/tutorials/llama-vision-tutorial/
- Tipos oficiais @cloudflare/workers-types, versão 5.20261010.1: Ai_Cf_Meta_Llama_3_2_11B_Vision_Instruct_Prompt.image permite number[] ou string; messages[].content utiliza image_url. Pacote oficial mantido no repositório https://github.com/cloudflare/workerd

## Integridade dos arquivos entregues

| Arquivo | Bytes | SHA-256 |
| --- | ---: | --- |
| index.html | 26465 | fbf62dc31849ed4a85157e5638c3a3f49eedd528a6ac0099767ee57d9ea98802 |
| worker.js | 7115 | c786b743764223b3fe4e4d437e9cfe2eebcae7688e98fd67000a5b7244ffe38f |

## Registro dos 75 casos da execução final

| Nº | Verificação | Resultado |
| ---: | --- | --- |
| 1 | HTML recomendado: estrutura válida e sem IDs duplicados | Aprovada |
| 2 | HTML único, endereço incorporado, sem recursos externos ou arquivos ausentes | Aprovada |
| 3 | Regressão: chamada do modelo original falha no contrato documentado | Aprovada |
| 4 | API health identifica versão e vínculo AI, sem afirmar reconhecimento | Aprovada |
| 5 | API CORS em OPTIONS, 404 e 405 | Aprovada |
| 6 | API: falta de vínculo AI é 503 | Aprovada |
| 7 | API multipart: bytes preservados, prompt/image superiores e centro LIVRE | Aprovada |
| 8 | API aceita centro numérico e 25 números sem alterar posições | Aprovada |
| 9 | API rejeita tipo errado, campo ausente, assinatura falsa, arquivo vazio e corpo inválido | Aprovada |
| 10 | API rejeita imagem acima de 8 MB | Aprovada |
| 11 | API rejeita erro da IA sem gerar números | Aprovada |
| 12 | API rejeita JSON inválido sem gerar números | Aprovada |
| 13 | API rejeita sem grade sem gerar números | Aprovada |
| 14 | API rejeita grade incompleta sem gerar números | Aprovada |
| 15 | API rejeita incerteza sem gerar números | Aprovada |
| 16 | API rejeita casa incerta sem gerar números | Aprovada |
| 17 | API trata falha e licença do modelo sem aceitar termos automaticamente | Aprovada |
| 18 | Navegador inicia sem configurar URL e ignora endereço antigo inválido | Aprovada |
| 19 | Imagem decodificada no navegador → JPEG real → multipart → Worker local com IA simulada → grade exata | Aprovada |
| 20 | Marcar/desmarcar preserva o elemento e o foco; Tab e Espaço/Enter funcionam | Aprovada |
| 21 | Centro LIVRE é preenchido e não aceita marcação manual | Aprovada |
| 22 | Validação estrita de 24/25 números, ordem, strings e centro | Aprovada |
| 23 | Rejeita célula inválida true | Aprovada |
| 24 | Rejeita célula inválida false | Aprovada |
| 25 | Rejeita célula inválida [] | Aprovada |
| 26 | Rejeita célula inválida [3] | Aprovada |
| 27 | Rejeita célula inválida {} | Aprovada |
| 28 | Rejeita célula inválida "" | Aprovada |
| 29 | Rejeita célula inválida "03" | Aprovada |
| 30 | Rejeita célula inválida "3.0" | Aprovada |
| 31 | Rejeita célula inválida "3e0" | Aprovada |
| 32 | Rejeita célula inválida "3abc" | Aprovada |
| 33 | Rejeita célula inválida "FREE" | Aprovada |
| 34 | Rejeita célula inválida null | Aprovada |
| 35 | Rejeita célula inválida 0 | Aprovada |
| 36 | Rejeita célula inválida 100 | Aprovada |
| 37 | Rejeita célula inválida -1 | Aprovada |
| 38 | Rejeita célula inválida 1.5 | Aprovada |
| 39 | Rejeita duplicados, grade ausente e qualquer declaração de incerteza | Aprovada |
| 40 | Regra: quina h0 preserva posições | Aprovada |
| 41 | Regra: quina h1 preserva posições | Aprovada |
| 42 | Regra: quina h2 preserva posições | Aprovada |
| 43 | Regra: quina h3 preserva posições | Aprovada |
| 44 | Regra: quina h4 preserva posições | Aprovada |
| 45 | Regra: quina v0 preserva posições | Aprovada |
| 46 | Regra: quina v1 preserva posições | Aprovada |
| 47 | Regra: quina v2 preserva posições | Aprovada |
| 48 | Regra: quina v3 preserva posições | Aprovada |
| 49 | Regra: quina v4 preserva posições | Aprovada |
| 50 | Regra: quina d1 preserva posições | Aprovada |
| 51 | Regra: quina d2 preserva posições | Aprovada |
| 52 | Regras: centro livre/número, centro excluído e direções desativadas | Aprovada |
| 53 | Regras: cartela cheia tem 24 ou 25 números e respeita configuração | Aprovada |
| 54 | Anúncios: contagem 3, 2, 1 e quina única, sem repetir vitória em outro número | Aprovada |
| 55 | Anúncios: vitórias simultâneas agrupadas e bingo tem prioridade | Aprovada |
| 56 | Botões de leitura anunciam marcados, restantes e linhas sem incluir LIVRE como número | Aprovada |
| 57 | Nova foto inválida mantém a partida e oferece retomada | Aprovada |
| 58 | Repetir exatamente a mesma fotografia funciona pelo seletor nativo | Aprovada |
| 59 | Interface recupera de not-found sem gerar cartela | Aprovada |
| 60 | Interface recupera de not-json sem gerar cartela | Aprovada |
| 61 | Interface recupera de network-error sem gerar cartela | Aprovada |
| 62 | Interface recupera de uncertain sem gerar cartela | Aprovada |
| 63 | Cancelar reconhecimento descarta resposta atrasada e impede requisição concorrente | Aprovada |
| 64 | Timeout de reconhecimento é recuperável (relógio acelerado, limite de produção 60s) | Aprovada |
| 65 | Aplicativo opera quando localStorage lança SecurityError | Aprovada |
| 66 | Regressão reproduzida no HTML original: marcação perde foco e booleano vira número | Aprovada |
| 67 | Fluxo com 25 números permite marcar e desmarcar a pedra central | Aprovada |
| 68 | Regras selecionadas pela interface: quina/centro/direções/cartela cheia | Aprovada |
| 69 | axe WCAG A/AA até 2.2: partida e configuração | Aprovada |
| 70 | Layout: 320/360/390/850/1280 px e texto 200%, sem overflow da página | Aprovada |
| 71 | axe WCAG A/AA: texto ampliado | Aprovada |
| 72 | axe WCAG A/AA: tela inicial e confirmação | Aprovada |
| 73 | axe WCAG A/AA: erro de reconhecimento | Aprovada |
| 74 | Teste de conexão usa /health e distingue vínculo AI de reconhecimento | Aprovada |
| 75 | Sem erros JavaScript inesperados no navegador | Aprovada |
