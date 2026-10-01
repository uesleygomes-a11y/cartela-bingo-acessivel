# Validação técnica — versão 0.3.0

27/27 cenários sintéticos passaram na última regressão. Todas as leituras aceitas coincidiram exatamente com o vetor esperado, mantendo a posição linha/coluna. Casos de rejeição são conferidos como rejeitados, sem preencher valores ausentes. Isso não constitui taxa de precisão em fotografias reais.

Ambiente: Linux, Node 24.19.0, Playwright 1.62.1 controlando Chromium 138 empacotado @sparticuz/chromium 138.0.2; execução headless em computador. Renderização canvas com fontes do ambiente. O navegador padrão do Playwright não pôde ser baixado, e foi utilizado Chromium alternativo. Não é Android nem Samsung S25.

A duração inclui geração sintética, detecção e OCR no cenário. Primeiro reconhecimento aceito: 1446 ms; demais aceitos: 657–1000 ms. Servidor local, arquivos já locais e máquina de desenvolvimento. Sem promessa de desempenho em rede móvel, primeira instalação ou telefone. Modelo compacto separado foi comparado: 17/23 na bateria anterior; principal 22/23 naquela revisão. Por isso o compacto é apenas confirmação de células inconclusivas, nunca substituição geral.

## Última regressão

| Cenário | Resultado | Tempo neste ambiente |
| --- | --- | --- |
| frontal | Aceita, números e posições exatos | 1446 ms |
| inclinada | Aceita, números e posições exatos | 742 ms |
| perspectiva | Aceita, números e posições exatos | 793 ms |
| rotacao | Aceita, números e posições exatos | 736 ms |
| iluminacao | Aceita, números e posições exatos | 765 ms |
| colorida | Aceita, números e posições exatos | 800 ms |
| grandes | Aceita, números e posições exatos | 744 ms |
| menores | Aceita, números e posições exatos | 793 ms |
| FREE | Aceita, números e posições exatos | 751 ms |
| LIVRE | Aceita, números e posições exatos | 769 ms |
| desenho | Aceita, números e posições exatos | 722 ms |
| logo | Aceita, números e posições exatos | 717 ms |
| 25-central | Aceita, números e posições exatos | 748 ms |
| acima-75 | Aceita, números e posições exatos | 706 ms |
| 100 | Aceita, números e posições exatos | 728 ms |
| externos | Aceita, números e posições exatos | 657 ms |
| ruim | Rejeitada corretamente | 38 ms |
| ilegivel | Rejeitada corretamente | 487 ms |
| centro-ilegivel | Rejeitada corretamente | 544 ms |
| centro-100 | Aceita, números e posições exatos | 731 ms |
| centro-8 | Aceita, números e posições exatos | 794 ms |
| cartela-pequena | Aceita, números e posições exatos | 1000 ms |
| fonte-serif | Aceita, números e posições exatos | 779 ms |
| desfocada | Rejeitada corretamente | 58 ms |
| cortada | Rejeitada corretamente | 8041 ms |
| duplicados | Rejeitada corretamente | 807 ms |
| logo-desconhecido | Rejeitada corretamente | 605 ms |

FREE e LIVRE têm 24 números. Estrela usa símbolo preenchido ★ e confirmação geométrica. Logo usa texto ACME. Não foram ensaiados todos os desenhos ou logos possíveis. Os cenários frontal, 25-central, acima-75 e 100 compartilham a mesma cartela base; testes centro-100 e centro-8 usam permutações que alteram a posição dos números. Cartela pequena tem metade do lado da original, aproximadamente 12% da foto. Perspectiva usa homografia explícita; rotações +5° e −8°; iluminação adiciona sombra horizontal; fonte normal Arial, alternativa serif; fonte menor 38 e maior 82 pixels antes da transformação. Desfoque de 12 pixels; corte cobre parte da última coluna. Célula ilegível é simulada sem conteúdo numérico, inclusive no centro.

Nenhuma foto física de cartela foi validada. As imagens históricas recuperadas eram capturas de erros da interface, e não foram usadas como prova de reconhecimento.

## Interface, JavaScript e acessibilidade

- Sintaxe verificada por `node --check` em vision.js e no script inline do HTML.
- Fluxo integrado: seleção de PNG sintético pelo input file → reconhecimento → configuração; número 100 confirmado.
- Configuração e geração de 25 botões ou 24 mais casa LIVRE.
- Marcação/desmarcação por clique, `aria-pressed`, teclado TAB e Espaço, foco ao iniciar partida, detecção de quina horizontal e alternância do centro livre.
- Tokens inválidos (0, 101, texto com dígitos, múltiplos números, zero à esquerda, decimal) e duplicados rejeitados pela validação.
- Layout verificado em 320, 360 e 1280 pixels. Texto 200% em 320 pixels: sem rolagem da página na horizontal; a grade, uma estrutura bidimensional, usa região própria de rolagem para preservar números inteiros e posições.
- axe-core 4.10.3 nas telas inicial, configuração, partida e texto ampliado: zero violações reportadas para tags WCAG A/AA até 2.2. `color-contrast` permaneceu como verificação incompleta por causa de fundos em gradiente.
- Revisão visual humana das capturas, revisão de HTML e cálculo de contraste das cores declaradas. Não houve uso humano de leitor de tela.

## Evidências e pendências WCAG

| Critério | Evidência realizada | Limite |
| --- | --- | --- |
| 1.3.1 Informações e relações | headings, fieldset/legend, labels; auditoria axe | leitura real pendente |
| 1.4.1 Uso de cor | ✓ além da cor e estado aria-pressed | avaliar baixa visão no telefone |
| 1.4.3 Contraste | texto principal 13,54:1; secundário 9,95:1; verde secundário 8,82:1; texto do botão 7,04:1; erro 9,83:1, contra superfície mais clara | composição final/estados reais ainda exigem revisão completa |
| 1.4.4 Redimensionar texto | teste de fonte 200% e inspeção de imagem | zoom/pinch e fonte Android não testados |
| 1.4.10 Refluxo | página sem overflow em 320px; rolagem somente na grade essencialmente bidimensional | outros navegadores pendentes |
| 1.4.11 Contraste não textual | borda de casa 3,57:1; verde 6,12:1 contra fundo; foco amarelo 11,64:1 | forced colors e demais estados não testados em dispositivo |
| 2.1.1 Teclado | TAB e Espaço em número; controles HTML nativos | auditoria completa de todos os caminhos ainda necessária |
| 2.4.3 Ordem do foco | foco em título e navegação para região/primeiro número | TalkBack e fluxos de erro reais pendentes |
| 2.4.7 Foco visível | outline e capturas de tela | avaliação completa de dispositivos pendente |
| 2.5.3 Rótulo no nome | nome acessível inclui número e posição; botões com texto | validação por voz não realizada |
| 2.5.8 Tamanho de alvo | casas mínimo 44px no layout normal; inputs 24px | todas as combinações de ampliação pendentes |
| 3.3.1/3.3.2 Erros e instruções | erros explícitos, fieldsets e labels, OCR sem inventar | anúncios reais de erros pendentes |
| 4.1.2 Nome, papel e valor | botões nativos, radios/checkboxes e aria-pressed; axe | TalkBack/NVDA/VoiceOver pendentes |
| 4.1.3 Mensagens de status | região polite atômica única para etapas; percentuais contínuos removidos | qualidade/tempo dos anúncios só confirmáveis em leitor real |

Esta é uma matriz de evidências dos critérios abordados, não uma auditoria exaustiva de todos os critérios aplicáveis. Não declarar conformidade WCAG 2.2 AA com base nestes testes.

## Limitações materiais

- Centro com desenho ou logo desconhecido pode ser inconclusivo. Estrela e logo alfabético foram exercitados, mas a regra é heurística e precisa de validação de falsos positivos em dados reais, incluindo dígitos degradados e gráficos parecidos com números.
- Captura assistida ao vivo não implementada. Fotografias normais toleradas pelos testes não equivalem a orientação de enquadramento para pessoa cega.
- TalkBack, VoiceOver, NVDA, câmera nativa, gestos Android, rotação física, fotos HEIC, desfoque/reflexo real, rede instável e desempenho S25 não testados.
- Não há salvamento de partida após recarregar nem promessa de offline/PWA; o arquivo recebido também não tinha esses recursos.
- Uma captura inválida mantém a partida. Nova captura válida substitui o progresso após confirmação para quem já marcou números.
- Confiança OCR e concordância não garantem ausência de erros fora dos ensaios. Leituras numericamente divergentes, grades inconclusivas e centros ilegíveis são rejeitados.

A validação real final deve cobrir TalkBack e fotos físicas com números conhecidos, mantendo o celular fora do papel de depurador primário. O pacote é tecnicamente testado no ambiente descrito, com essas limitações explícitas.
