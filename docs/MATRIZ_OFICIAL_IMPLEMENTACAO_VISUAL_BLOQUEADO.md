# MATRIZ OFICIAL DE IMPLEMENTAÇÃO — MESA ONLINE COM VISUAL BLOQUEADO

**Data:** 29/09/2026

**Regra superior:** a máscara visual final não é alvo de redesign. Esta matriz só permite handlers, estado, dados e menus/submenus condicionais abertos por controles já existentes. Não autoriza nova barra, coluna, painel fixo, troca de botão, deslocamento, alteração de cor, ícone, tipografia, dimensão, espaçamento ou composição.

## Regra de entrada

> **NÃO CRIAR 18 NOVOS BOTÕES.**
>
> Cada capacidade é exposta pelo ponto contextual existente mais próximo, respeitando papel, estado da mesa e exploração/combate. Um submenu pode existir somente depois de um controle-base já existente; fechado, ele não altera a composição da Mesa.

## FASE 1 — Exposição sem alteração visual estrutural

| Função | Motor existente | Ponto de entrada | Papel | Contexto | Comportamento esperado | O que NÃO fazer | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Chat público | `appendChat()` + `HistoryPanel` | **Diário** existente | Mestre e Jogador | Exploração e combate | Envia mensagem identificada e ela aparece no Diário compartilhado. | Não criar widget flutuante, coluna de chat ou chat paralelo. | Mensagem enviada pelo Diário chega ao snapshot e persiste na conversa. |
| Whisper | `appendChat()` + filtros `whisperTo/whisperFrom` | **Diário** existente | Mestre e Jogador | Exploração e combate com conexão | Remetente e destinatário veem o whisper; demais pares não o veem. | Não criar canal separado ou mostrar whisper público. | Filtro de destinatário e ocultação para terceiro funcionam. |
| Histórico de mesa | `HistoryPanel`, `combat.log`, `board.chat` e `combat.rolls` | **Diário** existente | Mestre e Jogador | Exploração e combate | Exibe conversa, sistema, combate e rolagens conforme permissão. | Não substituir a composição do Diário por lista nova. | Eventos reais aparecem ordenados e filtráveis. |
| Macros globais | `macros.ts` | **Macros** existente | Mestre | Exploração e combate | Criar, executar e remover fórmula persistida. | Não criar barra de macros permanente. | Macro válida registra rolagem no histórico. |
| Macros rápidas de token | `QuickMacros`, `appendRoll()` e ownership | **Macros** existente | Mestre e controlador do token | Token selecionado | Oferece ataque, Fortitude, Reflexos e Vontade reais. | Não rolar para token alheio ou inventar modificador. | Runtime bloqueia token não controlado e registra rolagem válida. |
| Compêndio — magias | `CompendiumPanel`/`compendium.ts` | **Inventário** existente | Mestre e Jogador | Exploração e combate | Inventário abre Compêndio com catálogo de magias. | Não adicionar novo ícone/rail para Compêndio. | Botão Inventário abre painel de Compêndio sem deslocar a máscara. |
| Compêndio — poderes | `CompendiumPanel`/`compendium.ts` | **Inventário** existente | Mestre e Jogador | Exploração e combate | Inventário abre Compêndio com catálogo de poderes. | Não misturar com inventário paralelo. | Catálogo de poderes pesquisável no painel já existente. |
| Compêndio — itens | `CompendiumPanel`/`compendium.ts` | **Inventário** existente | Mestre e Jogador | Exploração e combate | Inventário abre Compêndio com catálogo de itens. | Não remover o botão de Itens do combate. | Itens táticos continuam no botão **Itens** de combate. |
| Jukebox — faixa/arquivo | `jukebox.ts` | **Macros → Jukebox** | Mestre e Jogador local | Exploração e combate | Carrega URL ou arquivo local, toca, pausa e para. | Não criar botão de música na barra final. | Submenu Macros abre Jukebox e os controles alteram o estado real. |
| Jukebox — volume/loop | `setVolume()` e `setLoop()` | **Macros → Jukebox** | Mestre e Jogador local | Exploração e combate | Volume e loop atualizam a instância de áudio local. | Não alegar sincronização multiplayer de áudio. | Estado do player reflete volume/loop escolhido. |
| Soundboard | `playSfx()` | **Macros → Jukebox** | Mestre e Jogador local | Exploração e combate | Só pode ser habilitado se os assets de áudio existirem. | Não tratar botão sem asset como funcional. | **BLOQUEADO** até existirem `impact.mp3`, `fire.mp3`, `wind.mp3` e `arcane.mp3` em `public/vtt/sfx/`. |
| Undo | `undoBoard()`/`history.ts` | Ícone **Desfazer** existente | Mestre | Exploração e combate | Ícone abre submenu contextual do histórico e desfaz edição disponível. | Não adicionar botão solto de Undo. | Alteração de BOARD é revertida; Jogador não executa. |
| Redo | `redoBoard()`/`history.ts` | Ícone **Desfazer → Refazer** | Mestre | Exploração e combate | Mesmo ponto de entrada oferece refazer quando disponível. | Não criar segundo ícone no topo. | Edição desfeita pode ser refeita pelo Mestre. |

## FASE 2 — Contexto de Ambiente e Visão dentro de Macros

| Função | Motor existente | Ponto de entrada | Papel | Contexto | Comportamento esperado | O que NÃO fazer | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Fog por papel | `fogSettings()`, `setFogSettings()`, `visionForTokens()` | **Macros → Ambiente e visão** | Mestre configura; Jogador visualiza | Exploração e combate | Mestre ativa fog de jogador, prévia do Mestre, exploração por movimento e opacidade. | Não criar controle de fog fixo no mapa. | Configuração persiste e o runtime calcula visibilidade conforme papel. |
| Iluminação da cena | `setLighting()`, `boardLighting()` | Ícone **Iluminação** e **Macros → Ambiente e visão** | Mestre configura; Jogador visualiza | Exploração e combate | Mestre seleciona iluminação existente; Jogador não altera. | Não trocar o ícone de iluminação nem criar tema paralelo. | Snapshot atualiza iluminação e UI respeita permissão. |
| Fontes de luz | `upsertLight()` e visão | **Macros → Ambiente e visão**; ferramenta de mapa quando estiver validada | Mestre | Cena | Luzes da cena são habilitadas, desabilitadas e persistidas. | Não colocar novos controles permanentes sobre o mapa. | Fonte de luz altera `BOARD.lights` e influencia cálculo de visão. |
| Darkvision | `visionTypeFromText()`, `effectiveVisionRadius()` | **Macros → Ambiente e visão** | Ambos | Cena com ficha/token | Alcance de visão no escuro é calculado a partir do token. | Não marcar como grayscale se o render ainda não existe. | Cálculo de raio funciona; renderização grayscale permanece pendente. |
| Clima | `setWeather()` | **Macros → Ambiente e visão** | Mestre | Exploração e combate | Mestre escolhe Limpo, Chuva, Neve, Cinzas ou Névoa. | Não adicionar seletor de clima à máscara-base. | `board.weather` persiste e é sincronizado. |

## FASE 3 — Contexto de Mapa e Objeto dentro de Macros

| Função | Motor existente | Ponto de entrada | Papel | Contexto | Comportamento esperado | O que NÃO fazer | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Portas | `applyMapTool()`, `createBoardBarrier()`, `toggleBarrier()` | **Macros → Mapa e objetos → Portas** | Mestre | Cena | Arma a ferramenta; próximo clique no mapa cria ou alterna porta. | Não criar rail de ferramentas ou alterar mapa-base. | Clique altera `BOARD.walls` pelo comando existente e registra evento. |
| Áreas/células | `applyMapTool()`, `setShapes()` | **Macros → Mapa e objetos → Áreas** | Mestre | Cena | Arma área por célula; próximo clique cria/remove área. | Não desenhar painel permanente de área. | Shape é persistido no BOARD. |
| Shapes geométricos | `shapeCells()` | **Macros → Mapa e objetos → Áreas** | Mestre | Cena | Círculo, linha, retângulo e cone só serão expostos se houver submenu de parâmetros sem alterar a máscara. | Não inventar prévia visual incompatível. | **PENDENTE** até a seleção de forma e dois pontos ser integrada no submenu. |
| Gatilhos | `applyMapTool()`, `evaluateTriggers()`, `applyTriggerOutcomes()` | **Macros → Mapa e objetos → Gatilhos** | Mestre | Cena | Arma gatilho padrão; clique cria/remove marca de gatilho. | Não vender o marcador como automação completa se a configuração não foi escolhida. | Shape `trigger` é persistido; condição/modo avançados permanecem submenu pendente. |
| Gatilho único | `TRIGGER_CONDITIONS`, modo `once` | **Macros → Mapa e objetos → Gatilhos** | Mestre | Cena | Configuração padrão usa disparo único quando aplicável. | Não criar botão fixo por condição. | Disparo único é avaliado pelo motor quando configurado. |
| Gatilho contínuo | modo `continuous` | **Macros → Mapa e objetos → Gatilhos** | Mestre | Cena | Deve ser escolhido no submenu de configuração. | Não assumir contínuo por padrão. | **PENDENTE** até existir seleção contextual de modo. |
| Objetos | `applyMapTool()`, `setObjects()` | **Macros → Mapa e objetos → Objetos** | Mestre | Cena | Próximo clique posiciona objeto padrão persistido. | Não criar painel-base de objetos. | `BOARD.objects` recebe objeto no grid. |
| Baú/espólio | `BoardObject.contents`, `token.loot` | **Macros → Mapa e objetos** | Mestre/Jogador conforme acesso | Objeto selecionado | Exibir e consumir conteúdo exige submenu de interação de objeto. | Não declarar o objeto posicionado como baú interativo completo. | **PENDENTE** até seleção/abertura/remoção serem expostas. |
| Andares — selecionar | `setActiveFloor()` | **Macros → Mapa e objetos → Andares** | Mestre | Cena multiandar | Abre o painel existente de Cenas/Andares. | Não criar uma coluna de andares. | Andar ativo muda no BOARD. |
| Andares — mover token | `moveTokenToFloor()` | **Macros → Mapa e objetos → Andares** | Mestre | Token selecionado | Exige escolher token e destino dentro do submenu. | Não adicionar controle solto na máscara. | **PENDENTE** até a ação contextual estar ligada. |
| Editor de token | `updateToken()` e Elenco | **Macros → Mapa e objetos → Editor de token** | Mestre; Jogador somente próprio quando permitido | Token selecionado | Abre Elenco existente para PV, PM, DEF, ownership e ficha. | Não duplicar ficha nem criar painel de token fixo. | Atualização muda token oficial e sincroniza. |

## FASE 4 — Estados visuais automáticos derivados

| Estado automático | Fonte de verdade | Onde pode aparecer | Papel | Comportamento esperado | O que NÃO fazer | Critério de aceite |
|---|---|---|---|---|---|---|
| Overlay de condições | `BoardToken.conditions` | Camada interna do token existente | Ambos | Exibe condição/contador sem mover token, painel ou mapa. | Não criar coluna de condições. | **PENDENTE**: somente após a projeção do BOARD nos tokens da máscara. |
| Token selecionado | `selectedTokenIds` | Token/Grupo/Iniciativa existentes | Ambos | Destaque deriva de seleção real. | Não manter seleção decorativa estática. | **PARCIAL**: handler real existe; retratos da arte ainda são estáticos. |
| Turno ativo | `combat.activeTokenId` | Ordem e token existentes | Ambos | Destaque do turno deriva do combatState. | Não usar personagem ativo fixo da arte. | **PARCIAL**: runtime existe; coluna precisa projeção real. |
| PV/PM | `BOARD.tokens` e ficha vinculada | Painel de personagem/Grupo/Iniciativa existentes | Ambos | Barras e números derivam de dados reais. | Não manter valor decorativo quando houver token real. | **PARCIAL**: runtime/ficha sincronizam; máscara ainda tem valores literais. |
| Economia de ação | `combat.resources` | Ações de combate existentes | Participante do turno | Ação já gasta não deve executar novamente. | Não criar contador externo permanente. | **SUCESSO** no runtime; feedback literal da máscara é pendente. |
| Fog/visibilidade | `fogForVision()` e papel multiplayer | Camada interna do mapa existente | Ambos | Mestre e Jogador recebem visibilidade diferente. | Não criar segundo mapa para Jogador. | **PARCIAL**: cálculo e sincronização existem; projeção no mapa final permanece pendente. |
| Iluminação/clima | `board.lighting` e `board.weather` | Camada interna do mapa existente | Ambos | Cenário reage ao estado oficial. | Não criar tema visual paralelo. | **PENDENTE** até projeção interna preservando a arte. |
| Histórico de rolagens | `combat.rolls`, `board.chat`, `combat.log` | Diário e faixa já existentes | Ambos | Diário apresenta dados reais; faixa pode receber projeção sem mudar geometria. | Não criar tabela concorrente. | **PARCIAL**: Diário é real; cartões da faixa ainda são literais. |

## Bloqueio explícito — Soundboard

O Soundboard **não** deve ser classificado como entregue enquanto os arquivos abaixo não existirem e não forem verificados em reprodução:

- `public/vtt/sfx/impact.mp3`
- `public/vtt/sfx/fire.mp3`
- `public/vtt/sfx/wind.mp3`
- `public/vtt/sfx/arcane.mp3`

Até essa resolução, o status oficial é **BLOQUEADA POR ASSETS**.

## Critério global de aceite

1. O controle-base já existe na máscara final.
2. O submenu só aparece após esse controle e não desloca a composição fechada.
3. A ação chama o motor existente; não cria store, BOARD ou combate paralelo.
4. O runtime aplica permissões Mestre/Jogador.
5. O estado persiste/sincroniza quando o motor já prevê persistência/sincronização.
6. Uma função sem entrada clara permanece `PENDENTE`; não ganha botão novo por conveniência.
7. A validação inclui build, testes unitários e regressão visual estrutural contra a fonte bloqueada.
