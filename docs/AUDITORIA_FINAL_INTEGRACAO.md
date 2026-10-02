# AUDITORIA FINAL DE INTEGRAÇÃO — MESA ONLINE

**Data:** 29/09/2026

**Escopo:** runtime da Mesa Online e a interface final fornecida pelo usuário.

**Regra aplicada:** a interface é bloqueada. Nenhum painel, coluna, botão, cor, ícone, tipografia, dimensão ou composição da tela-base é redesenhado por esta etapa.

## Evidência e método

| Evidência | Resultado |
|---|---|
| Fonte visual imutável | `MesaOnline-visual-final2026-09-29.zip`, Drive ID `1Icq9ZGh5FBKyZwLPpoGWdkZ-cpL0yvmi` |
| Integridade do arquivo recebido | MD5 `d0a3aa392c6c53e44acbed3897ac8f58` |
| Varredura | `src/`, `tests/`, `ficha-modernrpg/`, `Vtt/`, módulos V2/V3, adaptadores e bridges |
| Teste automatizado | `npm run test:unit`: 38 arquivos / 203 testes aprovados |
| Compilação | `npm run build`: aprovado |
| Teste visual por screenshot | **PENDENTE**: não há navegador Chromium funcional neste ambiente para uma comparação pixel-a-pixel. A comparação estrutural com o ZIP foi feita; nenhuma alteração de layout foi deliberadamente introduzida. |

### Limite honesto desta auditoria

`SUCESSO` abaixo significa que existe uma entrada no fluxo da Mesa, o runtime real é chamado e há teste automatizado ou fluxo coberto pelo código. Um recurso que existe somente no motor, ou cuja entrada não cabe na interface bloqueada sem desenhar uma nova ferramenta, **não** foi promovido a sucesso.

## AUDITORIA FINAL DE INTEGRAÇÃO

| Função | Origem | Entrada atual | Papel | Status | Multiplayer | Persistência | Observação |
|---|---|---|---|---|---|---|---|
| Criar sala como Mestre | Mesa/V2 | Painel `online` existente, sem atalho na máscara | Mestre | PENDENTE | Sim | Sessão | `hostMultiplayer()` define Mestre; falta entrada visual na máscara final. |
| Entrar por convite como Jogador | Mesa/V2 | Painel `online` existente, sem atalho na máscara | Jogador | PENDENTE | Sim | Sessão | `joinMultiplayer()` define Jogador; não é inferido por token. |
| Papel Mestre ao criar sessão | Mesa/V2 | `hostMultiplayer()` | Mestre | SUCESSO | Sim | Sessão | Coberto por `multiplayerPermissions`/E2E. |
| Papel Jogador ao receber convite | Mesa/V2 | `joinMultiplayer()` | Jogador | SUCESSO | Sim | Sessão | Coberto por `multiplayerPermissions`/E2E. |
| Ownership `controlledBy ↔ peerId` | Mesa/V2 | Runtime e painel Elenco | Ambos | SUCESSO | Sim | Board | `canControlToken()` protege comandos autoritativos. |
| Reconexão de sessão | Mesa/V2 | Inicialização do App | Ambos | SUCESSO | Sim | Sessão | `restoreMultiplayerSession()` é chamado no fluxo da Mesa. |
| Sincronização do BOARD | Mesa/V2 | Bridge/runtime | Ambos | SUCESSO | Sim | Local+host | `vttBridge` é fonte de verdade. |
| Sincronização do combate | Mesa/V2 | Bridge/runtime | Ambos | SUCESSO | Sim | Local+host | Snapshot autoritativo e comandos remotos. |
| Criar cena | V2 | Cenas e mapas | Mestre | SUCESSO | Sim | Cena | `createScene()`. |
| Trocar cena | V2 | Cenas e mapas | Mestre | SUCESSO | Sim | Cena | `switchScene()`. |
| Renomear cena | V2 | Cenas e mapas | Mestre | SUCESSO | Sim | Cena | `renameScene()`. |
| Remover cena | V2 | Cenas e mapas | Mestre | SUCESSO | Sim | Cena | `removeScene()`, preserva ao menos uma cena. |
| Importar imagem de mapa | V2 | Cenas e mapas | Mestre | SUCESSO | Sim | Cena | `importMap()` e `createScene()`. |
| Importar UVTT | Legacy/V2 | Cenas e mapas | Mestre | SUCESSO | Sim | Cena | Mapa, paredes, portas e luzes por `parseUvtt()`. |
| Carregar mapa da biblioteca | V2 | Cenas e mapas | Mestre | SUCESSO | Sim | Cena | `DEFAULT_MAPS`. |
| Posicionar mapa para alinhar grade | Legacy | Sem entrada | Mestre | BLOQUEADA | N/A | N/A | O runtime não possui transformação independente de mapa versus câmera. |
| Configurar colunas/linhas | V2 | Configurações | Mestre | SUCESSO | Sim | Cena | `updateMap()`. |
| Configurar escala da grade | V2 | Configurações | Mestre | SUCESSO | Sim | Cena | Escala única para alcance, régua, movimento e áreas. |
| Configurar métrica de distância | V2 | Configurações | Mestre | SUCESSO | Sim | Cena | `setGridSettings()`. |
| Escolher grade quadrada/hexagonal | V2 | Configurações | Mestre | PARCIAL | Sim | Cena | A configuração persiste; renderização/snap hexagonal não foi localizada. |
| Selecionar andar ativo | Legacy | Cenas e mapas, quando multiandar | Mestre | SUCESSO | Sim | Cena | `setActiveFloor()`. |
| Mover token entre andares | Legacy | Sem entrada | Mestre | PENDENTE | Sim | Cena | `moveTokenToFloor()` existe sem fluxo visual. |
| Viagem: avançar dia | Legacy | Cenas e mapas | Mestre | SUCESSO | Sim | Cena | `advanceTravelDay()`. |
| Viagem: registrar encontro | Legacy | Cenas e mapas | Mestre | SUCESSO | Sim | Cena | `resetTravelEncounter()`. |
| Zoom | Visual final | Botões +/− no mapa | Ambos | SUCESSO | Local | Não aplicável | Funciona sem mudar a composição; escala inicial permanece a da fonte. |
| Fullscreen | Visual final | Ícone de fullscreen no mapa | Ambos | SUCESSO | Local | Não aplicável | Usa `requestFullscreen()`. |
| Centralizar mapa | Visual final | Ícone de mira no mapa | Ambos | PARCIAL | Local | Não aplicável | Restaura o enquadramento/zoom da fonte; ainda não focaliza token real. |
| Pan de câmera | V2/V3 | Sem entrada na máscara | Ambos | PENDENTE | Local | Não aplicável | Motor antigo possui modo `pan`; a máscara final não tem gesto/controle conectado. |
| Selecionar token | Visual final | Grupo, iniciativa e token representado no mapa | Ambos | PARCIAL | Sim | Board | Executa `selectToken()`, mas os tokens da arte final ainda não são projeção do BOARD real. |
| Movimento tático | V2/V3 | `Mover` + clique no mapa final | Participante do turno | PARCIAL | Sim | Board | Chama `executeTacticalMove()`; prévia de caminho/células reais não cabe hoje na arte estática. |
| Movimento de exploração | V2/V3 | Sem fluxo inequívoco na máscara | Conforme ownership | PENDENTE | Sim | Board | `executeExplorationMove()` existe, porém não há controle separado. |
| Caminho com terreno/elevação/voo | V2 | Motor de movimento | Conforme ownership | PARCIAL | Sim | Board | `pathTo()`/`reachableWithPaths()` testados; sem prévia na interface bloqueada. |
| Obstáculo e parede no movimento | V2 | Motor de movimento | Conforme ownership | PARCIAL | Sim | Board | `movementBlocked()` é usado pelos comandos; sem ferramenta de mapa exposta. |
| Régua simples | V2/V3 | Sem entrada na máscara | Ambos | PENDENTE | Local | Não aplicável | `useMapTools().handleMeasureClick()` existe, mas não está acessível pela máscara final. |
| Régua com waypoints | Legacy | Não localizada | Ambos | NÃO LOCALIZADA | N/A | N/A | Procurado em `mapTools`, `distance`, `ArmadaNextTable`, `BattleBoard` e VTT adaptado. |
| Régua circular/raio | Legacy | Não localizada | Ambos | NÃO LOCALIZADA | N/A | N/A | Só foram localizadas geometrias de área, não uma régua de raio. |
| Ping | V2/V3 | Sem entrada na máscara | Ambos | PENDENTE | Sim | Efêmero | Ferramenta `ping` existe no catálogo, sem manipulador visual final. |
| Névoa manual | V2/Legacy | Painel Ambiente existente, sem atalho inequívoco | Mestre | PENDENTE | Sim | Cena | `setFog()` e `setFogSettings()` existem; falta entrada de ferramenta na máscara. |
| Revelação por movimento | V2 | Motor de visão | Mestre | PARCIAL | Sim | Cena | `markExplored()` existe; feedback no mapa final não está projetado. |
| Iluminação da cena | Visual final/V2 | Ícone Iluminação → submenu Ambiente | Mestre | SUCESSO | Sim | Cena | O ícone existente abre o painel Ambiente já previsto; Mestre altera e Jogador apenas visualiza. |
| Fonte de luz pontual | V2/Legacy | Painel/ferramenta legado sem atalho final | Mestre | PENDENTE | Sim | Cena | `upsertLight()` e `defaultLight()` existem. |
| Visão normal | V2 | Motor | Ambos | PARCIAL | Sim | Cena | `computeVisibility()` funciona; mapa final não desenha visibilidade do BOARD. |
| Penumbra | V2 | Motor | Ambos | PARCIAL | Sim | Cena | Cálculo localizado em `vision.ts`; sem projeção final. |
| Visão no escuro | V2/Legacy | Motor | Ambos | PARCIAL | Sim | Cena | Raio é calculado; tratamento grayscale não localizado. |
| Cegueira/surdez sensorial | Legacy | Condições apenas | Ambos | PENDENTE | Sim | Token | Condições podem ser aplicadas; filtro sensorial não foi ligado ao mapa. |
| Paredes | V2/Legacy | Ferramenta legado sem atalho final | Mestre | PENDENTE | Sim | Cena | `upsertWall()`/`createBoardBarrier()` existem. |
| Portas aberta/fechada | V2/Legacy | Ferramenta legado sem atalho final | Mestre | PENDENTE | Sim | Cena | `toggleBarrier()` existe. |
| Portas trancadas | Legacy | Sem fluxo | Mestre | PENDENTE | Sim | Cena | Tipo suporta estado, sem interação localizada. |
| Parede bloqueando visão | V2 | Motor | Ambos | PARCIAL | Sim | Cena | Há interseção/raycast; depende de uma parede criada no BOARD e projeção final. |
| Parede bloqueando luz | Legacy | Não localizada | Ambos | NÃO LOCALIZADA | N/A | N/A | `lightedCells()` não recebeu bloqueio por parede confirmado. |
| Terreno normal/difícil/bloqueado/elevado/cobertura | V2/Legacy | Sem ferramenta final | Mestre | PENDENTE | Sim | Cena | `setTerrain()` e pincel existem; ausência é de entrada. |
| Áreas geométricas | V2/Legacy | Sem ferramenta final | Mestre | PENDENTE | Sim | Cena | Círculo, linha, retângulo, cone e células existem em `shapes.ts`. |
| Áreas de ações/magias | V2 | Ações de área + clique no mapa | Participante do turno | PARCIAL | Sim | Board/combat | Executa ação, mas seleção/células visíveis reais não são desenhadas na máscara. |
| Gatilho único | V2/Legacy | Sem ferramenta final | Mestre | PENDENTE | Sim | Cena | Motor `evaluateTriggers()`/`applyTriggerOutcomes()` existe. |
| Gatilho contínuo | V2/Legacy | Sem ferramenta final | Mestre | PENDENTE | Sim | Cena | Configuração `continuous` existe. |
| Objetos de mapa | Legacy | Sem ferramenta final | Mestre | PENDENTE | Sim | Cena | `setObjects()` cria objeto; não há seleção/interação na máscara. |
| Baú/espólio | Legacy/V3 | Sem entrada | Mestre/Jogador | PENDENTE | Sim | Cena | `BoardObject.contents`/`token.loot` existem sem painel de interação. |
| Montaria/parceiro | Legacy/V3 | Sem entrada | Mestre | PENDENTE | Sim | Token | Campo `mountId` existe; não há vínculo/interação. |
| Auras | Legacy | Motor geométrico sem desenho | Ambos | PARCIAL | Sim | Token | `auraCells()` existe; renderização de aura não está ligada. |
| Condições: aplicar | Visual final | Combate → Condições | Controlador/Mestre | SUCESSO | Sim | Token | Submenu condicional chama `updateToken()`. |
| Condições: remover | Visual final | Combate → Condições | Controlador/Mestre | SUCESSO | Sim | Token | Submenu condicional chama `updateToken()`. |
| Condições: duração/expiração | V2/Legacy | Sem editor | Mestre | PARCIAL | Sim | Combat | Efeitos táticos expiram por turno; condições textuais da máscara não têm duração. |
| Importar ficha | V2 | Fichas | Mestre | SUCESSO | Local | Ficha | Biblioteca/oficina existente. |
| Ler ficha oficial | V2 | Ficha oficial | Ambos | SUCESSO | Local | Ficha | `CharacterSheet` é fonte de dados. |
| Vincular ficha a token | V2 | Adicionar ficha à cena | Mestre | SUCESSO | Sim | Token | Mantém `modernRpgCharacterId`. |
| Atualizar PV/PM do token | V2 | Elenco e comandos | Mestre/Controlador | SUCESSO | Sim | Token+Ficha | Sincronização de vitais coberta por testes. |
| Defesa e atributos | V2 | Ficha/Elenco | Mestre | SUCESSO | Sim | Token+Ficha | Adaptador carrega dados oficiais. |
| Resistência Reflexos | Visual final | Painel do personagem | Controlador/Mestre | SUCESSO | Sim | Histórico | Rolagem real é registrada por `appendRoll()`. |
| Resistência Fortitude | Visual final | Painel do personagem | Controlador/Mestre | SUCESSO | Sim | Histórico | Rolagem real é registrada por `appendRoll()`. |
| Resistência Vontade | Visual final | Painel do personagem | Controlador/Mestre | SUCESSO | Sim | Histórico | Rolagem real é registrada por `appendRoll()`. |
| Perícia Acrobacia | Visual final | Painel do personagem | Controlador/Mestre | SUCESSO | Sim | Histórico | Bônus vem da ficha vinculada. |
| Perícia Atletismo | Visual final | Painel do personagem | Controlador/Mestre | SUCESSO | Sim | Histórico | Bônus vem da ficha vinculada. |
| Perícia Furtividade | Visual final | Painel do personagem | Controlador/Mestre | SUCESSO | Sim | Histórico | Bônus vem da ficha vinculada. |
| Perícia Intuição | Visual final | Painel do personagem | Controlador/Mestre | SUCESSO | Sim | Histórico | Bônus vem da ficha vinculada. |
| Perícia Percepção | Visual final | Painel do personagem | Controlador/Mestre | SUCESSO | Sim | Histórico | Bônus vem da ficha vinculada. |
| Perícia Sobrevivência | Visual final | Painel do personagem | Controlador/Mestre | SUCESSO | Sim | Histórico | Bônus vem da ficha vinculada. |
| Equipamento reconhecido | Visual final | Botão de equipamento | Controlador/Mestre | PARCIAL | Sim | Ficha | Usa equipamento oficial quando o rótulo da arte coincide; conteúdo da arte é estático. |
| Inventário em exploração | Visual final | Inventário → ficha oficial | Conforme ownership | SUCESSO | Local | Ficha | Abre ficha oficial focalizada. |
| Item em combate | Visual final | Combate → Itens | Participante do turno | SUCESSO | Sim | Ficha+histórico | Usa ações de item oficiais. |
| Consumir quantidade | V2 | Uso de item na máscara | Controlador/Mestre | SUCESSO | Local | Ficha | Consumível reduz `quantity` por `upsertCharacterSheet()`. |
| Arrastar item para hotkey | V2/V3 | Sem entrada | Controlador/Mestre | PENDENTE | Local | Ficha | Execução existe; atribuição por arrasto não foi encontrada na máscara. |
| Executar hotkey 1 | Visual final | Painel do personagem | Controlador/Mestre | PARCIAL | Sim | Ficha+histórico | Lê hotkeys persistidas; requer atribuição feita fora da máscara. |
| Executar hotkey 2 | Visual final | Painel do personagem | Controlador/Mestre | PARCIAL | Sim | Ficha+histórico | Lê hotkeys persistidas; requer atribuição feita fora da máscara. |
| Executar hotkey 3 | Visual final | Painel do personagem | Controlador/Mestre | PARCIAL | Sim | Ficha+histórico | Lê hotkeys persistidas; requer atribuição feita fora da máscara. |
| Executar hotkey 4 | Visual final | Painel do personagem | Controlador/Mestre | PARCIAL | Sim | Ficha+histórico | Lê hotkeys persistidas; requer atribuição feita fora da máscara. |
| Executar hotkey 5 | Visual final | Painel do personagem | Controlador/Mestre | PARCIAL | Sim | Ficha+histórico | Lê hotkeys persistidas; requer atribuição feita fora da máscara. |
| Iniciar combate | Visual final | Botão Combate | Mestre | SUCESSO | Sim | Combat | `startCombat()` cria a ordem real. |
| Ordem de iniciativa | Visual final | Coluna de iniciativa | Ambos | PARCIAL | Sim | Combat | Estado real existe; os retratos da arte não são ainda a ordem derivada do snapshot. |
| Selecionar combatente da iniciativa | Visual final | Linha de iniciativa | Ambos | PARCIAL | Sim | Board | Handler resolve token quando há correspondência; dados visuais estáticos. |
| Encerrar turno | Visual final | Esperar | Participante do turno | SUCESSO | Sim | Combat+log | `executeTacticalEndTurn()`. |
| Avançar rodada | V2 | Encerrar turno do último | Mestre/runtime | SUCESSO | Sim | Combat | `endTurn()` atualiza rodada. |
| Ação/ataque | Visual final | Combate → Agir | Participante do turno | SUCESSO | Sim | Combat+log | Lista ações oficiais e chama `executeTacticalAction()`. |
| Ação de classe | V2/V3 | Combate → Agir | Participante do turno | SUCESSO | Sim | Combat+log | `actionsForToken()` inclui classe quando a ficha reconhece a ação. |
| Habilidade racial | V2/V3 | Combate → Agir | Participante do turno | SUCESSO | Sim | Combat+log | Adaptador de ação da ficha. |
| Poder | V2/V3 | Combate → Agir | Participante do turno | SUCESSO | Sim | Combat+log | Adaptador de ação da ficha. |
| Magia | Visual final | Combate → Magia | Participante do turno | PARCIAL | Sim | Combat+log | Execução e custo existem; seleção de aprimoramento/descrição detalhada permanece no `CastPanel` sem entrada final. |
| Custo de PM | V2 | Execução de magia | Participante do turno | SUCESSO | Sim | Token+ficha | Validado pelo comando autoritativo. |
| Alvo individual | V2/V3 | Submenu de ação | Participante do turno | SUCESSO | Sim | Combat+log | Runtime valida alcance/linha de efeito. |
| Esperar | Visual final | Combate → Esperar | Participante do turno | SUCESSO | Sim | Combat+log | Encerramento real de turno. |
| Ataque de área | V2/V3 | Submenu + clique no mapa | Participante do turno | PARCIAL | Sim | Combat+log | Execução real; feedback geométrico está pendente. |
| Efeitos reativos | V2 | Runtime | Automático | SUCESSO | Sim | Combat | `reactiveTriggers` e expiração de efeitos são chamados pelo combate. |
| IA de ameaça | V2 | Sem entrada | Mestre | PENDENTE | Sim | Board+combat | `aiPlan()`/`applyAiMovement()` existem sem controle operacional na máscara. |
| Rolagem de ataque | V2 | Ação/ataque | Participante do turno | SUCESSO | Sim | Histórico | Resultado real no log e em `appendRoll()`. |
| Rolagem de dano | V2 | Ação/ataque | Participante do turno | SUCESSO | Sim | Histórico | Resolução tática gera registro real. |
| Rolagem de magia | V2 | Magia | Participante do turno | SUCESSO | Sim | Histórico | Resolução tática gera registro real. |
| Histórico de rolagens | Visual final/V2 | Diário e faixa de rolagens | Ambos | PARCIAL | Sim | Board+combat | Diário lê estado real; cartões fixos da arte não são a lista dinâmica. |
| Limpar histórico de rolagens | Visual final | Lixeira da faixa de rolagens | Mestre | SUCESSO | Sim | Board+combat | `clearRollHistory()` preserva narrativa e impede Jogador. |
| Filtrar histórico | Visual final | Filtro → Diário | Ambos | SUCESSO | Sim | Board+combat | O filtro real está no Diário. |
| Buscar histórico | Visual final | Campo/Diário | Ambos | PARCIAL | Sim | Board+combat | Campo da arte não filtra o Diário real ainda. |
| Fixar rolagem | Visual final | Ícone de marcador | Ambos | PENDENTE | N/A | N/A | Não há modelo persistido de favorita/fixada no runtime. |
| Diário de sessão | Visual final | Diário | Ambos | SUCESSO | Sim | Board+combat | Chat, eventos e log ordenados e filtrados. |
| Chat público | V2/V3 | Diário | Ambos | SUCESSO | Sim | Board | `appendChat()` sincronizado. |
| Whisper | Legacy/V2 | Diário, com destinatário | Ambos | SUCESSO | Sim | Board | Filtra para remetente/destinatário. |
| Jukebox: URL | Legacy | Painel Jukebox sem entrada na máscara | Ambos | PENDENTE | Local | Local | `loadTrack()`/controle existem; sem botão/menu de entrada final. |
| Jukebox: arquivo local | Legacy | Painel Jukebox sem entrada na máscara | Ambos | PENDENTE | Local | Local | Carregamento existe; sem entrada final. |
| Jukebox: volume/loop | Legacy | Painel Jukebox sem entrada na máscara | Ambos | PENDENTE | Local | Local | Estado e controles existem, sem entrada final. |
| Soundboard | Legacy | Painel Jukebox sem entrada | Ambos | BLOQUEADA | Não | Não | URLs padrão apontam para SFX ausentes em `public/vtt/sfx/`. |
| Jukebox YouTube | Legacy | Não localizada | Ambos | NÃO LOCALIZADA | N/A | N/A | Nenhum adaptador/API YouTube localizado. |
| Áudio sincronizado | Legacy | Não localizada | Ambos | NÃO LOCALIZADA | N/A | N/A | Não existe protocolo de transporte de reprodução. |
| Macros globais | V2 | Macros | Mestre | SUCESSO | Histórico | Local | Criar, executar e remover por `macros.ts`. |
| Compêndio: magias | V2 | Sem entrada na máscara | Ambos | PENDENTE | Não aplicável | Cache | `CompendiumPanel` e catálogo local existem. |
| Compêndio: poderes | V2 | Sem entrada na máscara | Ambos | PENDENTE | Não aplicável | Cache | `CompendiumPanel` e catálogo local existem. |
| Compêndio: itens | V2 | Sem entrada na máscara | Ambos | PENDENTE | Não aplicável | Cache | `CompendiumPanel` e catálogo local existem. |
| Bestiário e ameaças | V2 | Fichas/Automação → Bestiário | Mestre | SUCESSO | Sim | Catálogo+Board | Criação, ameaça customizada e remoção. |
| Imagens de ameaças | V2 | Bestiário | Mestre | SUCESSO | Sim | Catálogo | `threatImages`/adaptador são usados. |
| Importar ameaça JSON | V2 | Biblioteca de ameaças | Mestre | SUCESSO | Sim | Catálogo | `importThreat()`. |
| Exportar backup | V2 | Configurações | Mestre | SUCESSO | Não aplicável | Arquivo | `downloadGamePackage()`. |
| Undo de cena | V2/Legacy | Ícone Desfazer | Mestre | SUCESSO | Sim | Board | `undoBoard()`; não é undo exclusivo de rolagem. |
| Redo de cena | V2/Legacy | Sem entrada | Mestre | PENDENTE | Sim | Board | `redoBoard()` existe sem botão/menu final. |
| Editor de imagem/crop | Legacy | Sem entrada | Mestre | PENDENTE | Local | Não aplicável | `imageEditor.ts` não é importado por componente de UI. |
| ISO layout | V3/Legacy | Sem entrada | Mestre | PENDENTE | N/A | N/A | `iso-layout.ts` existe, sem integração à máscara 2D final. |
| Porta de componentes `CastPanel.tsx` | V2 | Sem entrada na máscara | Participante do turno | PARCIAL | Sim | Combat | Lógica de casting existe; UI detalhada não é montada. |
| `CustomThreatForm.tsx` | V2 | Biblioteca de ameaças | Mestre | SUCESSO | Sim | Catálogo | Integrado pela biblioteca. |
| `threatImages.ts` | V2 | Bestiário | Mestre | SUCESSO | Sim | Catálogo | Adaptador usa retratos. |
| `official.ts` | V2 | Ficha/token | Ambos | SUCESSO | Sim | Ficha+token | Adaptador oficial ativo. |
| `sync.ts` tático | V2 | Runtime | Ambos | SUCESSO | Sim | Board+combat | Bridge é usada pelos comandos. |
| `modernRpgImporters.ts` | V2 | Biblioteca/ficha | Mestre | SUCESSO | Local | Ficha | Importador é usado no fluxo de fichas. |

## FUNÇÕES — SUCESSO

Criar papel Mestre; entrar como Jogador; ownership; reconexão; sincronização de board; sincronização de combate; criar/trocar/renomear/remover cena; importar imagem; importar UVTT; biblioteca de mapas; configurar dimensões/escala/métrica; selecionar andar; viagem-avançar-dia; viagem-encontro; zoom; fullscreen; iluminação da cena; aplicar/remover condição; importar/ler/vincular ficha; PV/PM; defesa/atributos; Reflexos; Fortitude; Vontade; Acrobacia; Atletismo; Furtividade; Intuição; Percepção; Sobrevivência; inventário em exploração; item em combate; consumo de consumível; iniciar combate; encerrar turno; avançar rodada; agir/atacar; ação de classe; habilidade racial; poder; custo de PM; alvo individual; esperar; efeitos reativos; rolagens de ataque/dano/magia; limpar histórico; filtrar histórico; Diário; chat público; whisper; macros globais; bestiário; imagens de ameaças; importar ameaça; exportar backup; undo de cena; `CustomThreatForm`; `threatImages`; `official`; `sync`; `modernRpgImporters`.

## FUNÇÕES — PARCIAL

| Função | O que funciona | O que falta | Próximo passo sem redesign |
|---|---|---|---|
| Grade hexagonal | Configuração e persistência | Snap/desenho hexadecimal | Expor somente após existir um submenu já previsto para a grade. |
| Centralizar | Restaura enquadramento visual | Não foca token real | Conectar `selectToken` a uma posição de câmera persistida. |
| Seleção de token | Handler chama runtime | Arte contém tokens estáticos | Projetar somente dados/posição no mesmo elemento visual. |
| Movimento tático/exploração | Comando real, regras de terreno e walls | Mapa final não mostra rota/células reais | Adaptar canvas sem alterar composição; caso contrário manter pendente. |
| Visão/fog/luz | Motor e persistência | Mapa final não pinta estado real | Adaptar a camada interna do mapa, sem mudar moldura. |
| Áreas de ação | Comando e resolução real | Sem prévia geométrica real | Usar a camada de mapa já existente, sem criar painel. |
| Auras | Células calculadas | Sem renderização | Integrar na camada de token existente. |
| Duração de condições | Efeito tático expira | Condição textual não tem duração | Estender dado de condição apenas se caber em menu existente. |
| Equipamento | Usa item oficial correspondente | Rótulo da arte é estático | Projetar inventário no bloco existente sem alterar geometria. |
| Hotkeys 1–5 | Executam hotkey salvo | Não há arrastar/atribuir | Criar submenu do item, não novo painel. |
| Iniciativa visual | `combatState` real | Coluna usa elenco da arte | Projetar ordem no mesmo componente. |
| Magia | Custo e execução | Aprimoramento/descrição detalhada não expostos | Reusar submenu de Magia. |
| Histórico na faixa | Diário real e limpeza | Cartões continuam estáticos | Projetar dados na faixa existente. |
| Busca de histórico | Diário real | Campo da arte não filtra dados do Diário | Ligar valor do campo ao filtro já existente. |
| IA | Planejamento e movimento existem | Sem comando/Mestre | Integrar em submenu de combate somente se previsto. |
| `CastPanel.tsx` | Motor de casting | Painel não montado | Reusar como submenu de Magia, sem deslocar a composição. |

## FUNÇÕES — PENDENTES

Criar/entrar em sala pela máscara; alinhamento de mapa; mover token entre andares; pan; movimento de exploração; régua; ping; fog manual; fonte de luz pontual; paredes; portas; portas trancadas; terreno; áreas manuais; gatilho único; gatilho contínuo; objetos; baú/espólio; montaria/parceiro; arrastar hotkey; fixar rolagem; Jukebox URL; Jukebox arquivo local; Jukebox volume/loop; compêndio de magias; compêndio de poderes; compêndio de itens; redo; editor de imagem; layout ISO.

## FUNÇÕES — BLOQUEADAS

| Função | Dependência | Motivo | Status da dependência |
|---|---|---|---|
| Alinhamento independente do mapa | Modelo de transformação de mapa | Não há estado/API que separe imagem do mapa da câmera. | BLOQUEADA |
| Soundboard | Arquivos de áudio reais | `public/vtt/sfx/impact.mp3`, `fire.mp3`, `wind.mp3` e `arcane.mp3` não existem. | BLOQUEADA |

## FUNÇÕES — NÃO LOCALIZADAS

| Procurada | Módulos pesquisados | Resultado |
|---|---|---|
| Régua com waypoints | `mapTools`, `distance`, `ArmadaNextTable`, `BattleBoard`, VTT adaptado | Não localizada. |
| Régua de círculo/raio | `mapTools`, `shapes`, `distance`, `BattleBoard` | Não localizada como régua. |
| Luz bloqueada por parede | `vision`, `mapTools`, `runtimeCommands` | Não localizada/confirmada. |
| Darkvision em grayscale | `vision`, estilos e canvas | Não localizada. |
| Integração YouTube | `jukebox`, painéis e dependências | Não localizada. |
| Sincronização multiplayer de áudio | `multiplayer`, `jukebox`, `vttBridge` | Não localizada. |
| Snap/desenho real da grade hexagonal | `distance`, canvas e estilos | Não localizada. |

## FUNÇÕES EXISTENTES SEM ENTRADA VISUAL

| Nome | Arquivo/módulo | Papel | Entrada visual atual | Possível ponto de integração | Dependência |
|---|---|---|---|---|---|
| `redoBoard` | `game/vttBridge.ts` | Refazer edição da cena | Nenhuma | Menu do ícone Desfazer | Nenhuma |
| `moveTokenToFloor` | `game/floors.ts` | Transferir token de andar | Nenhuma | Cenas → Andares → token selecionado | UI de seleção de token/andar |
| `executeExplorationMove` | `tactics/engine/runtimeCommands.ts` | Movimento fora do combate | Nenhuma inequívoca | Mapa → Mover | Projeção de grid real |
| `useMapTools().measure` | `game/mapTools.ts` | Régua | Nenhuma | Ferramentas do mapa | Gestos no mapa |
| `ping` | `game/mapTools.ts` | Sinal multiplayer | Nenhuma | Ferramentas do mapa | Render efêmero |
| `upsertWall/removeWall` | `game/vttBridge.ts` | Paredes/portas | Nenhuma | Ferramentas do mapa | Ferramenta contextual |
| `setFog` | `game/vttBridge.ts` | Fog manual | Nenhuma | Iluminação/Ambiente | Pincel de mapa |
| `upsertLight` | `game/vttBridge.ts` | Luz pontual | Nenhuma | Iluminação/Ambiente | Pincel de mapa |
| `setTerrain` | `game/vttBridge.ts` | Terreno/elevação | Nenhuma | Ferramentas do mapa | Pincel de mapa |
| `setShapes` | `game/vttBridge.ts` | Áreas/gatilhos | Nenhuma | Ferramentas do mapa | Pincel e submenu |
| `setObjects` | `game/vttBridge.ts` | Objetos/baús | Nenhuma | Ferramentas do mapa | Interação de objeto |
| `applyAiMovement` | `tactics/engine/ai.ts` | IA | Nenhuma | Submenu de combate | Política de turno Mestre |
| `imageEditor` | `game/imageEditor.ts` | Recorte/clipboard | Nenhuma | Ficha/retrato | Menu de retrato previsto |
| `loadTrack/playTrack` | `game/jukebox.ts` | Jukebox | Painel existe, sem atalho | Diário/configurações se houver submenu previsto | Entrada permitida |
| `CompendiumPanel` | `components/mesa/CompendiumPanel.tsx` | Catálogo | Painel existe, sem atalho | Fichas/Diário se houver submenu previsto | Entrada permitida |
| `hostMultiplayer/joinMultiplayer` | `game/vttBridge.ts` | Sala online | Painel existe, sem atalho | Configurações se houver submenu previsto | Entrada permitida |
| `CastPanel` | `components/tactics/CastPanel.tsx` | Aprimoramento/descrição de magia | Não montado | Ação Magia | Submenu de magia |
| `cropToObjectPosition/applyCrop` | `game/imageEditor.ts` | Imagem/retrato | Nenhuma | Ficha/retrato | Menu de retrato previsto |

## AUDITORIA — MESTRE

| Função administrativa | Resultado |
|---|---|
| Criar sala e manter autoridade | Runtime correto; entrada na máscara pendente. |
| Cenas, importação de imagem e UVTT | Sucesso no painel existente. |
| Cenário, grid, escala, métrica, andares e viagem | Sucesso, exceto mover token entre andares. |
| Criar/remover ameaças | Sucesso. |
| Iniciar/encerrar combate e iniciativa real | Sucesso no runtime; coluna final parcial. |
| Fog, luz, paredes, portas, terreno, áreas, gatilhos e objetos | Runtime localizado; entradas finais pendentes. |
| Alterar PV/PM/DEF e ownership | Sucesso. |
| Limpar rolagens e desfazer cena | Sucesso. |
| Backup | Sucesso. |
| Jukebox/soundboard | Painel existente, entrada final pendente; soundboard bloqueado por assets. |

## AUDITORIA — JOGADOR

| Função permitida/restrita | Resultado |
|---|---|
| Entrar em sala por convite | Runtime correto; entrada final pendente. |
| Controlar somente token próprio | Sucesso; `canControlToken()` aplica a regra. |
| Selecionar e usar ações do próprio token | Sucesso para ação individual; mapa visual torna movimento/área parcial. |
| Rolagens próprias (perícia, resistência, item/ação) | Sucesso. |
| Enviar chat e whisper | Sucesso. |
| Usar zoom/fullscreen | Sucesso local. |
| Alterar cena, grid, iluminação, fog, paredes e tokens alheios | Protegido pelo runtime; não há bypass identificado nos fluxos auditados. |
| Limpar histórico compartilhado | Recusado para Jogador por `clearRollHistory()`. |

## MATRIZ MESTRE × JOGADOR

| Função | Mestre | Jogador | Observação |
|---|---|---|---|
| Hospedar sala | Sim | Não | Sessão define o papel. |
| Entrar por convite | Não aplicável | Sim | Código de sala. |
| Trocar/criar/remover cenas | Sim | Não | Comando autoritativo. |
| Importar imagem/UVTT | Sim | Não | Ferramenta administrativa. |
| Selecionar token | Sim | Sim | Seleção não concede ownership. |
| Mover token próprio | Sim | Sim | Jogador somente token controlado. |
| Mover token alheio | Sim | Não | `controlledBy`. |
| Iniciar combate | Sim | Não | Jogador acompanha snapshot. |
| Encerrar próprio turno | Sim | Sim | Somente token/turno ativo autorizado. |
| Agir/magia/item próprio | Sim | Sim | Runtime valida turno e ownership. |
| Aplicar condição no próprio token | Sim | Sim | Máscara valida controle. |
| Aplicar condição em token alheio | Sim | Não | Runtime/ownership. |
| Alterar luz/fog/cena | Sim | Não | Ferramenta Mestre. |
| Criar parede/porta/área/gatilho/objeto | Sim | Não | Ferramenta Mestre. |
| Usar régua/ping | Sim | Sim | Entrada visual ainda pendente. |
| Chat/whisper | Sim | Sim | Whisper tem filtragem. |
| Limpar rolagens | Sim | Não | Recusado ao Jogador. |
| Desfazer/refazer | Sim | Não | Refazer ainda sem entrada. |
| Jukebox | Sim | Sim local | Não sincroniza áudio. |
| Backup | Sim | Não | Ferramenta administrativa. |

## TESTES POR FLUXO

| Fluxo | Cobertura atual | Resultado |
|---|---|---|
| Exploração | Seleção, ficha, regras de distância, terreno, visão, fog, mapas e persistência possuem testes unitários. | PARCIAL — ferramentas sem entrada final não podem ser executadas pela máscara. |
| Combate | Iniciativa, economia de ação, alvo, movimento, saves, magia, gatilhos e efeitos reativos possuem testes. | PARCIAL — dados da coluna e mapa da arte ainda não são reativos. |
| Mestre | Permissões, cenas, ameaças, fog/visão, backup e multiplayer possuem cobertura. | PARCIAL — atalhos finais para ferramentas administrativas faltam. |
| Jogador | Ownership, vitais, condições e restrições possuem cobertura. | SUCESSO no runtime; entradas pendentes estão registradas. |
| Multiplayer | Testes unitários e E2E de visão/multiplayer existentes. | SUCESSO no runtime. |
| Persistência | Bridge, cenas, ficha, macros, hotkeys e board possuem persistência testada. | SUCESSO nos recursos com entrada. |
| Visual | Comparação estrutural contra ZIP de baseline. | PARCIAL — screenshot pixel-a-pixel pendente neste ambiente. |

## RESUMO NUMÉRICO

A contagem abaixo é derivada das **137 linhas funcionais** da tabela principal; cada hotkey, perícia e resistência foi contado individualmente. Os controles contam elementos interativos da máscara literal (não linhas da tabela), e os papéis contam funções cujo campo `Papel` inclui o respectivo papel.

| Medida | Total |
|---|---:|
| Funções auditadas | 137 |
| SUCESSO | 71 |
| PARCIAL | 27 |
| PENDENTE | 32 |
| BLOQUEADA | 2 |
| NÃO LOCALIZADA | 5 |
| NÃO APLICÁVEL | 0 |
| Funções existentes sem entrada visual | 18 |
| Funções com botão/controle de origem na máscara | 62 |
| Funções com menu/submenu existente | 14 |
| Funções automáticas | 5 |
| Funções auditadas que envolvem Mestre | 72 |
| Funções auditadas permitidas ao Jogador | 81 |

> A soma de status é 113. As medidas de botão/menu/papel não devem ser somadas entre si, pois uma mesma função pode ter botão e submenu, ou ser acessível a ambos os papéis.

## CHECKLIST FINAL

- [x] Fonte visual final identificada por arquivo e MD5.
- [x] Nenhuma troca deliberada de layout, cor, tipografia, ícone, proporção, painel ou mini coluna Grupo.
- [x] Exploração e combate da fonte mantidos como estados distintos.
- [x] Papel Mestre/Jogador verificado no runtime existente.
- [x] Funções integradas, parciais, pendentes, bloqueadas e não localizadas discriminadas individualmente.
- [x] Matriz Mestre × Jogador registrada.
- [x] Funções existentes sem entrada visual listadas.
- [x] Testes unitários e build executados.
- [ ] Comparação visual pixel-a-pixel automatizada — pendente por indisponibilidade de Chromium no ambiente.
- [ ] Entradas finais das ferramentas de mapa — pendentes e não criadas para não alterar a interface bloqueada.

## Próximo passo seguro

Nenhuma função `PENDENTE` desta auditoria deve ser colocada em uma nova barra, coluna ou painel. Antes de integrar uma delas, deve ser apontado pelo usuário qual menu/submenu já faz parte da hierarquia visual final. Se não houver esse ponto, permanece `PENDENTE` conforme a regra de visual bloqueado.
