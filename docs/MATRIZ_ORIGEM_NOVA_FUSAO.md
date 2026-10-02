# MATRIZ DE ORIGEM — NOVA FUSÃO

Fase 1 do `PLANO_CANONICO_NOVA_FUSAO_CLAUDE.md`. **Somente auditoria: nenhum código foi alterado para produzir este documento.**
Data: 29/09/2026. Baseado em leitura direta dos arquivos (não em auditorias antigas). Onde algo não foi lido de fato, está escrito **não verificado**.

## 1. Onde cada fonte está

| Fonte | Local | Papel canônico |
|---|---|---|
| **Destino (árvore de trabalho)** | `MesaOnline-entrega-atualizada-2026-09-29-v3/FUSAO-EM-ANDAMENTO/` | Mesa Online: BOARD, exploração, multiplayer, motor tático, visual travado |
| **V5 (zip)** | `MesaOnline-V5-estrutura-integral-2026-09-29.zip` | Mesmo destino + `SkinRuntimeProjection.tsx` (ver §2) |
| **ModernRPG** | `ModernRPG-2026-09-23.zip` (extraído em temporário) | Portal, conta, campanhas, ficha, oficina, PDF, compêndio, dados |
| **V3 Tactics** | `ModernRPG-V3-TACTICS/` (`tactics-src/` e `src/features/tactics/`) | Experiência de interação do combate |
| **Legado** | `FUSAO-EM-ANDAMENTO/Vtt/app.js` (20.160 linhas) = `public/vtt/app.js` do ModernRPG | Funções históricas ainda ausentes |
| **Arte-final 2026.8** | `MesaOnline-arte-final-2026.8.zip` | Só referência visual (não lida nesta fase) |
| Pacote de prompts | `tormenta20-tactics-jogo-completov3.zip` | Só `prompts-arena/`, `index.html`, `campanha.json`; sem código |

## 2. Decisão que precisa de confirmação antes da fusão

A árvore de trabalho atual **já diverge do zip V5**: ela foi feita sobre o v3 original e recebeu (a) ligação dos dados reais à máscara por contexto (`mesaSkin/runtime.ts` + `mesa/skinRuntime.ts`), (b) palco real do mapa (`mesa/MapStage.tsx`), (c) gaveta posicionada (`mesaSkinDrawerHost.css`), (d) `Personagem/Ficha/Inventário` sem abrir janela e com Inventário → Compêndio, (e) ocupação de casas T20 e condição Amedrontado.
O zip V5 fez outro caminho: `SkinRuntimeProjection.tsx` (altera o HTML da máscara depois de renderizar, só cobre os slots pintados), `Inventário/Fichas/Personagem` abrindo o Portal em outra aba, e importação automática das fichas guardadas como tokens.
**Proposta:** manter esta árvore como destino; trazer do V5 apenas (1) os testes novos de `appSmoke`, (2) a importação automática de fichas guardadas como tokens, (3) as correções de texto em `docs/`. Descartar `SkinRuntimeProjection` (duplica o que o contexto já faz) e os redirecionamentos ao Portal (contradizem a regra de nunca abrir outra janela).

## 3. Legenda

Ação: `MANTER`, `PORTAR`, `ADAPTAR`, `INTEGRAR`, `USAR COMO REFERÊNCIA`, `DESCARTAR`, `NÃO LOCALIZADA`.
Coluna "Destino" = árvore de trabalho atual.

## 4. Portal e personagens

| Função | Destino (V5+) | V3 | ModernRPG | Legado | Fonte escolhida | Motivo | Ação |
|---|---|---|---|---|---|---|---|
| Portal, rotas, campanhas, one-shots | só lobby (`mesa/MesaLobby.tsx`); Portal é placeholder | `src/App.tsx` (cópia do portal) | `src/App.tsx`, `src/components/views/*`, `campaigns/*` | — | ModernRPG | dono canônico; a Mesa só recebe `?sala=` | INTEGRAR (fase Portal) |
| Login, conta, compartilhamento | — | — | `src/lib/auth/*`, `components/auth/*`, `server/`, `db/` | — | ModernRPG | fora do escopo tático | INTEGRAR (fase Portal) |
| Lista de personagens | `Libraries.tsx` (importar JSON) | `roster/ModernRpgCharacters.tsx` | `components/views/CharactersListView.tsx` | — | ModernRPG | fonte canônica | INTEGRAR |
| Ficha completa (ver/editar) | **inalcançável**: `ficha-modernrpg/sheet/*` não é montado | — | `components/sheet/T20CharacterSheet.tsx` | — | ModernRPG (cópia já em `ficha-modernrpg/`) | código existe no destino; falta montar dentro da gaveta, sem janela | INTEGRAR |
| Oficina de Heróis | `ficha-modernrpg/workshop/*` (inalcançável) | — | `components/workshop/CharacterBuilderWorkshop.tsx` | — | ModernRPG | idem | INTEGRAR |
| PDF → ficha | `ficha-modernrpg/pdf/*` (inalcançável) | `importers/sheetPdf.ts`, `tactics-src/pdf-import.ts` | `lib/pdf/*` | — | ModernRPG | parser canônico | INTEGRAR |
| Importar VTT (Foundry/Roll20) | `ficha-modernrpg/vtt/importVtt.ts` (inalcançável) | — | `lib/vtt/importVtt.ts` | — | ModernRPG | — | INTEGRAR |
| Persistência de fichas | `ficha-modernrpg/characterRoute.ts` (`tormenta20_online_characters_v2`) | `adapters/portalStore.ts` | `App.tsx` stores | — | Destino | já unificada | MANTER |
| Ficha ↔ token | `integration/modernRpgCharacterBridge.ts`, `tokenVitalsSync.ts` | `adapters/CharacterAdapter.ts` | `types/sheet.ts` | — | Destino | ponte já testada | MANTER |
| PV/PM/condições voltam à ficha | `persistTokenVitalsToSheet` (`tokenVitalsSync.ts`) | `CombatAdapters.ts` | — | `_syncCondToLinkedSheet` (`app.js:11989`) | Destino | equivalente já ligado | MANTER |
| Compêndio | `mesa/CompendiumPanel.tsx`, `game/compendium.ts` | `wardrobe/Libraries.tsx` | `components/views/CompendiumView.tsx` | — | Destino | painel já dentro da gaveta | MANTER |
| Bestiário / catálogo de ameaças | `tactics/data/bestiaryAdapter.ts` | `adapters/ThreatAdapter.ts` | `lib/t20/vtt/ameacas.json` (mesmo JSON em `ficha-modernrpg/t20/vtt/`) | — | Destino | mesmo catálogo | MANTER |
| **Imagens das ameaças** | manifesto aponta `../threat-images/*`; **pasta ausente** | `threatImageManifest.json` | `public/threat-images/` (496 arquivos, só no zip) | `threat-images.js` | ModernRPG | arquivos só existem no zip | PORTAR (copiar pasta) |
| Catálogo de magias/poderes/itens | `ficha-modernrpg/t20/vtt/*.json` | `spellRegistry.ts` | `lib/t20/vtt/*.json` | — | Destino | idênticos | MANTER |

## 5. Mesa / exploração (fonte: destino)

| Função | Destino | V3 | ModernRPG | Legado | Fonte escolhida | Ação |
|---|---|---|---|---|---|---|
| BOARD, cenas, mapa, tokens | `game/vttBridge.ts`, `game/types.ts` | `adapters/vttBridge.ts` (bridge) | — | `app.js` BOARD/SCENES | Destino | MANTER |
| Multiplayer PeerJS, autoridade, snapshot por peer | `game/multiplayer.ts`, `vttBridge.ts` (`wireStateForPeer`) | — | — | `app.js` (peers) | Destino | MANTER |
| Persistência e reentrada | `vttBridge.ts`, `peerIdentity.ts` | — | — | — | Destino | MANTER |
| Distância T20 (1,5 m, diagonal dupla) | `game/distance.ts` | `tactics-src/game/rules.ts` (Chebyshev, só comparação) | — | — | Destino | MANTER (exceção documentada) |
| Palco do mapa, câmera (roda/botão direito) | `mesa/MapStage.tsx` (novo) | `BattleBoard.tsx` | — | — | Destino | MANTER |
| Fog, visão, luz, darkvision, andares | `game/vision.ts`, `floors.ts` | `NativeLayers.tsx` (auras/formas) | — | `adicionarCelulasAuraLight` (`app.js:6887`) | Destino | MANTER |
| Paredes, portas, objetos, shapes, gatilhos | `mapTools.ts`, `shapes.ts`, `triggers.ts`, `boardTools.ts` | — | — | — | Destino | MANTER |
| Clima e partículas | `board.weather` + `WeatherLayer` em `MapStage.tsx` | — | — | — | Destino | MANTER |
| Undo/redo, chat/whisper, diário, macros | `history.ts`, `macros.ts`, `MesaGlobalPanel.tsx` | `DiceTray.tsx` (referência) | — | — | Destino | MANTER |
| Régua (dois cliques) | `MapStage.tsx` + `mapTools.ts` | `TableTools.tsx` (12 linhas) | — | **régua com waypoints** `app.js:5846`, `12577` | Destino agora; waypoints do legado | MANTER; USAR COMO REFERÊNCIA (waypoints) |
| **Ping** | `mapTools.ts` `firePing` (só local) | — | — | `triggerBoardPing` `app.js:7334` (sincroniza) | Legado (algoritmo) → multiplayer do destino | ADAPTAR |
| Jukebox | `game/jukebox.ts` (local) | — | — | `app.js` (broadcast de faixa) | Destino + legado | ADAPTAR (sync) |
| **Soundboard** | `SOUNDBOARD` sem arquivos | — | — | `loadSoundboard` `app.js:14863`, Freesound `Vtt/api/buscar-audios.js` | Legado | PORTAR (busca por URL/Freesound; chave configurável pelo usuário, nunca a do legado) |
| UVTT | import: `game/uvtt.ts` | — | — | só import (`app.js:15734`) | Destino | MANTER; export = **NÃO LOCALIZADA** |
| Auras | tipo `AuraSpec` no motor; sem entrada | `NativeLayers.tsx` | — | `preencherFormAuras` `app.js:3832` | Destino (motor) + legado (formulário) | ADAPTAR (entrada) |
| Terreno, elevação | `mapTools.ts` (pincel), `movement.ts` | `BattleBoard`, `iso-layout.ts` | — | — | Destino | MANTER |
| Voo | motor: `movement.ts` modo `fly`; **sem entrada** | `CommandMenu.tsx` (voo) | — | — | V3 (UX) + destino (motor) | ADAPTAR |
| Montaria | campo `mountId`; sem entrada | — | — | `montaria-update` `app.js:1195` | Legado + destino | ADAPTAR |
| Baú/espólio | `BoardObject.contents` | adapters (loot) | `public/espolio/` (não lido) | **não localizado** por função | Destino | ADAPTAR; legado NÃO LOCALIZADA |
| Alinhar mapa importado ao grid (Mestre) | **ausente** | — | — | **não localizado** | — | NÃO LOCALIZADA |
| Centralizar câmera, arrastar o token, atribuir hotkeys | **ausentes** | referência de UX | — | — | — | NÃO LOCALIZADA (criar sobre `MapStage` e `Panels`) |

## 6. Condições (você pediu para achar todas)

| Aspecto | Destino | V3 | ModernRPG | Legado | Fonte escolhida | Ação |
|---|---|---|---|---|---|---|
| **Catálogo com descrição e efeito** (35 condições: Abalado, Agarrado, Alquebrado, Apavorado, Atordoado, Caído, Cego, Confuso, Debilitado, Desprevenido, Doente, **Em Chamas**, Enfeitiçado, Enjoado, Enredado, Envenenado, Esmorecido, Exausto, Fascinado, Fatigado, Fraco, Frustrado, Imóvel, Inconsciente, Indefeso, Lento, Ofuscado, Paralisado, Pasmo, Petrificado, Sangrando, Sobrecarregado, Surdo, Surpreendido, Vulnerável) | só nomes (23 na lista, 18 nos selos); sem descrição | — | textos em `poderes.json`/`magias.json` | **`CONDITION_INFO` `app.js:2258`**, emojis `2297`, chaves da ficha `COND_BOARD_TO_SHEET` `11970` | Legado (dados) | PORTAR |
| Estado da condição no token | `BoardToken.conditions` | — | ficha `conditions` | — | Destino | MANTER |
| Duração/expiração por turno | `expireEffectsAtTurn` (efeitos); condições soltas sem contador | — | — | `combatTickConditionsOnLeaveCurrentTurn` `app.js:2372` | Legado (algoritmo) | ADAPTAR |
| Efeito mecânico (ex.: Abalado −2, Apavorado −5) | **ausente** | — | — | texto em `CONDITION_INFO`; **efeitos só descritos**, aplicação no cliente do jogador em `applyPlayerConditionEffects` `app.js:12012` (cego/surdo/ofuscado) | Legado + destino | ADAPTAR (decisão de regras: quais viram número) |
| Selo no token | `game/conditionBadges.ts` (18 padrões) | — | — | `_atualizarOverlayCondicao` `12029` | Destino | MANTER; ampliar tabela com o catálogo |
| Sincronizar com a ficha | `tokenVitalsSync.ts` | — | — | `_syncCondToLinkedSheet` `11989` | Destino | MANTER |

## 7. Combate: interação (V3) sobre o motor do destino

| Interação | Destino hoje | V3 (fonte de UX) | Fonte escolhida | Ação |
|---|---|---|---|---|
| Menu de comandos com páginas `root/act/spell/item/reaction/targeting/confirm-action/confirm-move/cast` | `mesaSkin/MesaSkinActionDialog.tsx` (Mover/Agir/Magia/Itens/Condição/Esperar); **sem** páginas de reação, confirmações e cast | `combat/CommandMenu.tsx` `type CommandPage` (linha 17) | V3 para o fluxo; destino para executar | ADAPTAR dentro do diálogo existente |
| Células alcançáveis, alvo, área, movimento pendente | **ausente no palco** | `BattleBoard.tsx`: `reachable`, `targetable`, `areaCells`, `pendingMove` | V3 (UX) + `movement.ts` | PORTAR para `MapStage` |
| Confirmar movimento (custo e rota) | move imediato | `CommandMenu` página `confirm-move` | V3 | ADAPTAR |
| Escolha de alvo respeitando alcance | lista sem filtro de alcance (`TargetChooser`) | `CommandMenu` página `targeting` | V3 + `targeting.ts` | ADAPTAR |
| Conjuração com aprimoramentos | motor pronto (`interpretation/spellCasting.ts`); **UI só no código morto** `tactics/CastPanel.tsx` | `CastPanel.tsx` | V3 (UX) + destino (motor) | INTEGRAR (montar) |
| Reações | motor `reactiveTriggers.ts`; **sem página** | `CommandMenu` página `reaction`, "também fora do turno" | V3 (UX) | ADAPTAR |
| Executar turno da IA | `tactics/engine/ai.ts` só planeja (`aiPlan`, `applyAiMovement`); chamado apenas pelo código morto | `TacticsApp.tsx:552` `runEnemyAi` (mover, reavaliar, agir, encerrar) | destino (motor) + V3 (fluxo) | ADAPTAR (completar execução) |
| Mesa de rolagens / log | `RollTable` (máscara) + diário | `DiceTray.tsx` | Destino | MANTER |
| ISO tático | `tactics/iso-layout.ts`, `IsometricMapCanvas.tsx` (código morto) | `IsometricMapCanvas.tsx`, `iso-layout.ts` | V3 (referência) | USAR COMO REFERÊNCIA (adiado) |

## 8. Motor tático (fonte de verdade: destino)

Conferido no código: movimento (Dijkstra, terreno difícil ×2, bloqueado, elevação, paredes/portas/cantos, ocupação por lado), economia de ações, ataque (20/1 natural, crítico, flanqueamento +2, cobertura +5), saves com meio dano, RD (maior de magia + soma de poderes), 25 magias em `SPELL_EFFECTS`, 3 reativos, 1 invocação (6 esqueletos), log. **Ação: MANTER.**
Diferenças documentadas e aceitas: distância diagonal dupla T20 (V3 usa Chebyshev) e custo de elevação pela diferença de altura (V3: +1 fixo por nível).
Não localizado como magia: **Amedrontar** (existe só como condição; ver §6).

## 9. Código morto no destino (para classificar)

`components/ArmadaNextTable.tsx`, `BattleBoard.tsx`, `CommandMenu.tsx`, `IsometricMapCanvas.tsx`, `mesa/{CombatModeTransition,ContextPlaceholder,InitiativeRail,LeftToolRail,MapToolbar,MesaTopBar,RecentRollsBar,TokenContextPanel}.tsx`, `components/tactics/TacticsWorkspace.tsx`, `tactics/engine/sync.ts`, `tactics/io/modernRpgImporters.ts`, `tactics/iso-layout.ts`, `game/{official,senses}.ts`, `utils/cn.ts` e toda a pasta `ficha-modernrpg/` (nenhum módulo é alcançado a partir de `src/main.tsx`).
Proposta: reaproveitar o que traz função (`ai.ts`, `conditionBadges.ts`, `senses.ts`, `CastPanel`, `ficha-modernrpg/*`, lógica de `TokenContextPanel`) e só depois apagar o resto, um item por vez e com confirmação.

## 10. Decisões do usuário (29/09/2026)

1. **Destino:** manter esta árvore. Do V5 entram só os testes, a importação automática das fichas guardadas e as correções de texto. Os redirecionamentos para o Portal oficial são **desejados**: Personagem/Ficha → ficha oficial; Fichas → `#/personagens`; Inventário completo → ficha oficial (a ficha contém o inventário).
2. **Condições:** as descrições do legado (`Vtt/app.js:2258`) definem o efeito. Ver §11.
3. **Portal:** entra já, como página isolada (`/`), com a Mesa em `/mesa/`.
4. **Regra máxima:** o visual do V5 não muda. Nada de moldura, cor ou estilo do VTT ou do ModernRPG entra na Mesa; só dados e comportamento. Único elemento novo autorizado: selos de condição sobre o token.

## 11. Efeito mecânico das condições (derivado de `CONDITION_INFO`, `Vtt/app.js:2258`)

| Grupo | Condições | Efeito no motor |
|---|---|---|
| Penalidade numérica em perícias/ataque/Defesa | Abalado −2 perícias; Apavorado −5 perícias; Esmorecido −5 (INT/SAB/CAR); Frustrado −2 (INT/SAB/CAR); Fraco −2 (FOR/DES/CON); Debilitado −5 (FOR/DES/CON); Ofuscado −2 ataque e Percepção; Vulnerável −2 Defesa; Desprevenido −5 Defesa e Reflexos; Indefeso −10 Defesa e Reflexos falha; Caído −5 Defesa corpo a corpo, +5 à distância, −5 ataque corpo a corpo; Agarrado/Enredado −2 ataque | aplicar como modificador em ataque, Defesa e testes (`combat.ts`, `saves.ts`, `targeting.ts`) |
| Compostas (viram outras) | Exausto = Debilitado + Lento + Vulnerável; Fatigado = Fraco + Vulnerável; Agarrado = Desprevenido + Imóvel; Enredado = Lento + Vulnerável; Cego = Desprevenido + Lento; Paralisado = Imóvel + Indefeso; Petrificado = Inconsciente + RD 8; Indefeso/Surpreendido/Atordoado = Desprevenido | expandir na aplicação, sem duplicar estado |
| Escalada | Abalado→Apavorado; Fraco→Debilitado→Inconsciente; Fatigado→Exausto→Inconsciente; Frustrado→Esmorecido; Exausto→Inconsciente | ao aplicar a mesma condição de novo |
| Bloqueio de ação | Atordoado, Pasmo, Surpreendido, Inconsciente (sem reações), Fascinado (só observar) | `actionEconomy.ts` recusa ações |
| Movimento | Lento ÷2; Imóvel 0; Caído 1,5 m; Sobrecarregado −3 m; Enjoado 1 ação padrão OU de movimento | `movement.ts`, `actionEconomy.ts` |
| Início do turno | Em Chamas 1d6 fogo (ação padrão apaga); Sangrando teste CON CD 15 (falha: 1d6 e continua); Confuso 1d6 (1: anda 1d8; 2-3: nada; 4-5: ataca o mais próximo; 6: termina) | gancho de início de turno em `runtimeCommands.ts` |
| Só descritivas | Doente, Envenenado (depende do veneno), Alquebrado (+1 PM por habilidade), Enfeitiçado, Surdo (−5 Iniciativa) | registrar; Alquebrado e Surdo têm número simples |

Ação: PORTAR (fonte: descrições do legado; motor: destino). Ainda **não implementado**.

## 12. Registro de execução (Fase 2 em andamento)

| Item | Estado |
|---|---|
| Ocupação de casas T20 (aliado atravessável, inimigo bloqueia) | feito, testado |
| Amedrontado na lista de condições | feito |
| Dados reais na máscara (contexto), palco real do mapa, gavetas posicionadas | feito |
| Selos de condição sobre o token | feito (autorizado) |
| Visual: emblema "P", vinheta, brasas e tocha restaurados; sem moldura; grade invisível fora da ferramenta de terreno | feito |
| Redirecionamentos ao Portal oficial (rotas reais `#/personagens`, ficha ativa) | feito, testado |
| Importação automática das fichas guardadas como tokens | feito, testado |
| Bestiário: +244 ameaças (Duelo de Dragões, Guerra Artoniana, Breves Jornadas), só dados | feito, testado |
| Bestiário: 486 imagens locais em `public/threat-images/`, resolvidas por `threatImage()` | feito, testado |
| Portal isolado em `/` (`src/portal/`, CSS próprio), Mesa em `/mesa/`, build com duas entradas | feito, build ok |
| Portal: arquivos de `public/` (ferramentas e imagens) copiados | feito |
| Efeitos numéricos das condições (§11) | feito e testado (`game/conditionEffects.ts`, `game/conditionInfo.ts`, `tactics/engine/conditionTicks.ts`): ataque, Defesa (corpo a corpo/distância), Reflexos e falha automática, perícias por atributo, ações bloqueadas, Enjoado, deslocamento, RD do Petrificado, Em Chamas e Sangrando no início do turno, Confuso (registro). Amedrontado = Abalado. **Ainda pendente:** escalada ao repetir a condição, duração por turno, Alquebrado (+1 PM), Surdo (−5 Iniciativa), Confuso agindo de fato, Doente/Envenenado/Enfeitiçado |
| Interação V3 (§7): células alcançáveis, confirmação, reação, cast, IA | feito e testado, sem novo botão nem estilo: prévia do movimento (casas alcançáveis nas cores azuis da própria máscara, distância/custo e confirmação no segundo clique) em `mesa/MapStage.tsx`; no diálogo de combate (`mesaSkin/MesaSkinActionDialog.tsx`): alvos filtrados por alcance e linha de efeito com distância, confirmação da ação (custo, ataque, CD, dano), escolha de vários alvos, aprimoramentos de magia (custo calculado por `spellCasting.ts`), reações também fora do turno (runtime aceita `kind: reaction` fora do turno; uma por rodada) e "Executar turno da IA" (`tactics/engine/ai.ts` `runAiTurn`, só Mestre). **Ainda pendente:** aviso automático de reação quando o evento acontece, alternância racial do cast, 2D/ISO do V3 |
| Alinhar mapa (só Mestre): ferramenta em Macros → Mapa e objetos; arrasta a imagem sobre a grade, ao soltar grava `offsetX/offsetY` no mapa da cena (sincroniza) e a ferramenta se desarma; Shift + roda muda a escala; campos numéricos em Cenas e mapas | feito e testado (`game/mapView.ts`, `mesa/MapStage.tsx`) |
| Importar mapa em imagem (JPEG/PNG): grade sugerida pelo tamanho da imagem (célula de 70 px, 4 a 200), com colunas/linhas editáveis; UVTT segue trazendo a própria grade | feito e testado |
| Palco se ajusta ao tamanho de qualquer mapa (zoom mínimo baixo, células sempre quadradas) e volta a enquadrar ao trocar de cena | feito e testado |
| Focar: botão do canto do palco leva o token selecionado ao centro da tela (onde estiver no mapa); sem seleção ou já centrado, enquadra o mapa inteiro; também em Elenco → Centralizar | feito e testado |
| Gaveta fecha sozinha ao escolher mover, mão, régua, ping ou alinhar (pincéis mantêm as opções) | feito |
| Hotkeys: arrastar item da mochila para o slot grava; botão direito limpa; teclas 1 a 5 usam o item (`game/hotkeys.ts`, `mesaSkin/Panels.tsx`, `App.tsx`) | feito, testado |
| Arrastar o próprio token: mostra as casas alcançáveis e move ao soltar (exploração e movimento tático, mesmas regras e permissões) | feito (`mesa/MapStage.tsx`); testado só pelas regras, não por arrasto real |
| Régua com waypoints: cada clique acrescenta um ponto, distância somada pela regra da cena, Esc limpa (`game/ruler.ts`) | feito, testado |
| Sinais de rede efêmeros (`game/signals.ts`, `multiplayer.ts`): ping sincronizado para todos; o Mestre valida e reenvia; faixa e som só do Mestre | feito, regras testadas (rede real não testada) |
| Jukebox sincronizado (`game/jukeboxSync.ts`): o Mestre publica play/pausa/troca/loop, jogadores aplicam; volume é local; quem entra depois recebe a faixa atual. **Todos ouvem**: link/YouTube toca em cada navegador; arquivo do computador é enviado em pedaços pela sala (`game/sharedAudio.ts`, até 25 MB) e remontado em cada jogador | feito, testado (envio pela rede real não testado, só a montagem dos pedaços) |
| Jukebox: 5 faixas preparadas (nome do evento + link do YouTube/áudio ou arquivo do computador, play/pausa em cada); YouTube pelo player oficial escondido; arquivo guardado no navegador (IndexedDB) | feito, testado (YouTube real depende de internet e de o vídeo permitir incorporação) |
| Soundboard: efeitos curtos prontos gerados no navegador (plim, espada, porta abrindo, impacto, magia, moedas) + busca no Freesound com a chave do próprio usuário; o Mestre toca para todos | feito, testado |
| Exportar UVTT (`game/uvttExport.ts`): mapa, grade, paredes, portas/janelas, luzes e alinhamento; ida e volta com o importador | feito, testado |

### Pedidos do usuário adiados (fazer depois, ordem dele)
1. **Campanhas inteiras em VTT** dentro de "Minhas campanhas": importar campanha completa (formato de módulo do Foundry, ex.: `C:\\RPG\\AI tste\\aventura-coracao-de-rubi`), **privada por conta** (só quem importou vê), além de personagens prontos em VTT.
2. **Campanhas oficiais jogáveis** oferecidas em "Minhas campanhas" ("aproveite e jogue uma das campanhas oficiais"): Coração de Rubi, A Libertação de Valkaria e uma terceira a definir. Hoje o Portal só tem a Libertação como Painel do Mestre (`public/libertacao`).
3. **One-shots** no mesmo estilo (oferecer one-shots prontos).
4. Ignorar: `foundry-armada` (mesa 3D, não é campanha) e `campanhas-exemplo` (usuário não se lembra do conteúdo).
Onde está o material do Coração de Rubi: `C:\\RPG\\AI tste\\aventura-coracao-de-rubi\\aventura-coracao-de-rubi` (repositório git de módulo do Foundry, 3,8 MB, com `packs/`) e o mesmo em zip (1 MB) em `C:\\RPG\\AI tste\\VTTArmada\\AGENT-MODERNRPG\\campanhas-exemplo\\aventura-coracao-de-rubi.zip` — ou seja, `campanhas-exemplo` só contém essa aventura. Ao lado dele (`AGENT-MODERNRPG`) há também `bestiario`, `fichas`, `mapas` e `compendio`, a conferir quando esse trabalho começar.
Nota: UVTT (`.dd2vtt`/`.uvtt`) é formato de **mapa** (imagem + grade + paredes/portas/luzes); campanha inteira usa outro formato.

Achado: o `ameacas.json` principal já tem **9 ids repetidos** (gnoll-filibusteiro, capelao-de-guerra, otyugh, serpe, finntroll-feitor, manticora, nagah-mistica, cultista-de-sszzaas, reishid). Não corrigido.

## 13. Correção de origem: Tática embutida do ModernRPG-2026-09-23 (29/09/2026)

O ModernRPG-2026-09-23 não é só o Portal: carrega uma Tática/VTT avançada (`public/vtt/armada-tactics.js`, `reactive-triggers.js`, `spell-effects.js`, `summon-effects.js`, `tactics-ui.js`, `tactics-src/`, testes em `tests-mesa/`). Correção do que estava rotulado como "V3":

| Função | Origem que a comprova | Destino V5 |
|---|---|---|
| Reação automática (gatilhos reativos) | ModernRPG: `public/vtt/reactive-triggers.js`, `armada-tactics.js`, `tests-mesa/reaction-tests.json` (V3 só refatorou) | `tactics/engine/reactiveTriggers.ts` (já portado) |
| Conjuração racial (`castPreview`, `castSpell`, marca por token) | ModernRPG: `armada-tactics.js` (`castContext`, `castPlan`, `runCast`), CastPanel, testes `spell-effects-tests` | `tactics/interpretation/spellCasting.ts` + `castContext.ts`; marca em `BoardToken.tacticsRacial` |
| Círculo máximo por classe e nível (`CIRCLE_LEVELS`) | ModernRPG: `armada-tactics.js` | `tactics/interpretation/castCircle.ts` |
| Aprimoramentos curados com bônus (25 magias, 80 aprimoramentos) | ModernRPG: `spell-effects.js` (`ArmadaSpellEffects`) | `tactics/data/spellEnhancements.json`; mods aplicados via `augmentMods` em `spellEffects.ts` |
| Limite de PM por magia = nível; muda/truque/limiteBonus/requerCirculo | ModernRPG: `castPlan` | `computeCastPlan` |

**Decisão confirmada pelo usuário (reconfirmada em 29/09/2026):** na magia racial, o círculo máximo é o círculo da própria magia; aprimoramentos com `requerCirculo` são recusados em magia racial.

Testes: `tests/castRules.test.ts`. Auditoria função por função da Tática embutida (aiPlan, tickEffects, turnPlan, reachable, summon etc.) ainda pendente: `docs/AUDITORIA_TATICA_MODERNRPG.md` a criar.

## 14. Pendências (29/09/2026, ao fechar o bloco Portal integrado)

Regra: o Portal `src/portal/` não é modificado (a Oficina de Heróis é considerada perfeita; conferi que `components/workshop` é idêntico ao do ModernRPG-2026-09-23). A ponte ficha → token do ModernRPG (`resolveFichaToken`, `characterSheetToLegacyFullData`) já existe no V5 em `integration/modernRpgCharacterBridge.ts`.

**A. Do esqueleto (verificar função por função)**
1. Menu de entrada de Voo, Montaria, Auras e Baú/espólio (motor existe, falta a entrada pelos controles já existentes; espólio: legado não localizado).
2. Prompt de reação ao jogador (o motor reage sozinho; falta a página de reação do V3 quando a reação depende de escolha).
3. Visão 2D/ISO do V3 (adiada por você).
4. Poderes e magias: trabalho à parte (tipo de dano lido do texto das magias, 24 magias de `spell-effects-tests.json`, duração rolada, remoção manual de efeito, poderes de classe/raça).
5. Passar de novo pelas 72 seções do contrato e marcar cada uma como feita/parcial/ausente (a última varredura completa foi antes do bloco de condições e combate).

**B. Portal integrado**
6. Percurso real Portal → criar mesa → Mesa → voltar ao Portal, com personagem aparecendo como token: as peças existem (mesma chave de armazenamento, Portal abre `/mesa/?sala=`, redirecionamentos da Mesa ao Portal), mas eu não terminei de percorrer o fluxo no navegador.
7. Login/conta/compartilhamento (`lib/auth`, Supabase, `server/`, `db/`): copiados, sem verificar funcionamento em nenhum ambiente.
8. Build de produção com as duas entradas foi feito antes; refazer após os últimos blocos.

**C. Adiados por você**
9. Importar campanha inteira em VTT (Foundry) em "Minhas campanhas", privada por conta.
10. Campanhas oficiais jogáveis (Coração de Rubi, Libertação de Valkaria, terceira a definir) e one-shots no mesmo estilo.
11. Importar personagens prontos em VTT.

**D. Sem teste real (só regras testadas)**
12. Transferência de áudio pela rede, YouTube real, busca real no Freesound, ping/jukebox entre navegadores diferentes, arrastar o token com o mouse em partida em rede.

**E. Achados não corrigidos**
13. (Resolvido em 29/09/2026 por decisão do usuário: ficou a versão de Ameaças de Arton; 9 entradas do Livro Básico removidas de `ficha-modernrpg/t20/vtt/ameacas.json`; cópia de segurança fora do projeto. A cópia do Portal em `src/portal/lib/t20/vtt/` não foi tocada.) 9 ids repetidos em `ameacas.json` (gnoll-filibusteiro, capelao-de-guerra, otyugh, serpe, finntroll-feitor, manticora, nagah-mistica, cultista-de-sszzaas, reishid).
14. (Confirmado pelo usuário) RD com ataque de dois tipos (Corte/Perfuração): vale se um dos tipos combinar.
15. (Revisado em 29/09/2026) NÃO há definição oficial de "cinco naturezas de magia" no código original; dano/cura/buff/invocação/utilitário é convenção interna da aplicação (mapeada em `ActionEffect`) e não deve ser apresentada como regra do T20. Ver `spellClassification.ts`.

## 15. Portal integrado: fechamento (29/09/2026)

O usuário vai apagar todas as outras fontes ao terminar; por isso tudo o que a Mesa e o Portal usam fica dentro deste projeto.

| Item | Estado |
|---|---|
| Build de produção com duas entradas (Portal `/`, Mesa `/mesa/`) | feito, `npm run build` ok |
| Personagens do Portal viram tokens na Mesa (mesma chave `tormenta20_online_characters_v2`), com dados reais | verificado no navegador (3 personagens) |
| Botão Personagem da Mesa abre a ficha oficial **do personagem selecionado** no Portal | corrigido (`src/portalLink.ts` marca o personagem ativo antes de abrir; o Portal não foi alterado); `tests/portalLink.test.ts` |
| Backend de conta, mesas online, campanhas e livros (`server/auth.js`, `index.js`, `store.js`) e esquema SQL (`db/`) | copiado de `ModernRPG-V3-TACTICS` (não existia no zip de 23/09); `express` e `cors` declarados; `npm run server` (porta 4000, a que o Portal usa por padrão). Testado: cadastro, `/auth/me`, criação de mesa. `server/data/db.json` e `secret.key` também copiados do original (1 conta; as demais listas vazias); `server/data/` está no `.gitignore` |
| Oficina de Heróis, ficha, PDF, importar VTT | ficam no Portal, sem alteração (Oficina idêntica à do ModernRPG) |
| Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) | opcional; sem chaves o Portal usa o backend local; não testado |
| Login pela tela do Portal (Entrar → conta → cabeçalho mostra o e-mail, token guardado) | verificado no navegador com o servidor local |
| "Voltar ao Portal" da Mesa | verificado: volta a `/` e a sessão continua |

## 16. Pendências separadas (29/09/2026)

### A. Motor já existente: falta expor, integrar ou testar na interface
1. Voo (`movement.ts`, modo `fly`), Montaria (`mountId`), Auras (`AuraSpec`), Baú/espólio (`BoardObject.contents`): falta a entrada pelos controles já existentes da Mesa.
2. Reações: `reactiveTriggers.ts` reage sozinho; falta a página/prompt de reação ao jogador quando ela depende de escolha.
3. Magias: as 25 magias curadas, os gatilhos reativos e as invocações existem no motor; falta cobertura de teste das outras 24 magias de `spell-effects-tests.json` e a exposição em filtro/lista de magias (sem fixar classificação oficial, ver item 15).
4. Rede, áudio e mídia (ping, jukebox, arquivo do computador, YouTube, Freesound): implementados, sem teste real entre navegadores/internet.
5. Conta e mesas online (backend copiado): funcionam localmente; Supabase opcional, não testado.
6. Passar de novo pelas 72 seções do contrato marcando feito/parcial/ausente.

### B. Funcionalidade realmente ausente: precisa ser implementada
7. Visão 2D/ISO do V3.
8. Importar campanha inteira em VTT (Foundry) para "Minhas campanhas", privada por conta.
9. Campanhas oficiais jogáveis (Coração de Rubi, Libertação de Valkaria, terceira a definir) e one-shots no mesmo estilo.
10. Importar personagens prontos em VTT.
11. Poderes de classe e raça e magias fora das 25 curadas (efeito automático, tipo de dano estruturado, duração rolada, remoção manual de efeito): trabalho à parte.
12. Espólio: função do legado não localizada.

## 17. Rodada de 29/09/2026 (noite): o que entrou, o que escolhemos mudar e a lista do que falta

### 17.1 Entrou nesta rodada (tsc ok, 330 testes, trava visual ok)
| Item | Onde | Verificação |
|---|---|---|
| Montaria (montar/desmontar, par anda junto, casa livre ao descer, até 3 quadrados, mesmo lado, permissão por dono) | `game/mount.ts`, `tactics/engine/mountCommands.ts`, `moveToken` em `vttBridge.ts`, painel Elenco em `MesaGlobalPanel.tsx` | `tests/mount.test.ts` |
| Aura e luz do token (Tocha 6 m, Lanterna 9 m, Fogueira 12 m, raio, ativa, ilumina) e realce das casas da aura no palco | painel Elenco (`AuraSection`), `MapStage.tsx`, `mesaSkinDrawerHost.css` | motor de luz já testado; entrada só conferida no tsc |
| Prompt de reação (pausa o ataque/magia hostil contra herói ou token de jogador com reação e PM; usar ou não; IA espera) | `tactics/engine/reactionWindow.ts`, `runtimeCommands.ts`, `ai.ts`, `components/mesa/ReactionPrompt.tsx`, `CombatState.pendingReaction` | `tests/reactionWindow.test.ts` (5 casos) |
| Importar personagem pronto de VTT (Foundry/Roll20 → ficha → token com `modernRpgCharacterId`) | `ficha-modernrpg/vtt/importVtt.ts` (botão do Portal, sem alteração) + ponte da Mesa | `tests/vttCharacterImport.test.ts` |
| Visão 2D/isométrica (V3 religado) | `components/IsometricMapCanvas.tsx` (sem filtro nem vinheta do V3), `tactics/iso-layout.ts`, `components/mesa/IsoStage.tsx`, `game/isoView.ts`, seção "Visão do mapa" em Cenas e mapas | `tests/isoView.test.ts`; conferido no navegador (arte dedicada e projeção do mapa 2D, tokens V5 de pé) |

### 17.2 O que escolhemos mudar (decisões registradas)
1. **Efeito por rodadas** termina no início do turno do **conjurador**; o prazo vem do descritor da magia.
2. **RD por tipo** só reduz dano exatamente desse tipo (RD 5 a corte; resistência a fogo 15); RD sem tipo reduz tudo; ataque de dois tipos é reduzido se um deles combinar.
3. **Naturezas de magia** são convenção interna da aplicação, não regra do T20.
4. **Ameaças duplicadas**: ficam as de "Ameaças de Arton" (9 entradas do Livro Básico removidas). A cópia do bestiário em `src/portal/` não foi tocada.
5. **Portal não é modificado** (Oficina perfeita); a Mesa liga a ele. Projeto **autocontido**: backend `server/` e `db/` copiados de `ModernRPG-V3-TACTICS`, com `server/data` original.
6. **Montaria**: sem a regra de "tamanhos diferentes" do legado (tokens do V5 não têm tamanho); cavaleiro e montaria dividem a casa.
7. **Reação**: só reações escolhíveis sobre si mesmo abrem o prompt; Santuário, Arma Espiritual e RD de poder continuam automáticos.
8. **Isométrica**: religar o V3, mas sem o visual dele (filtro, vinheta, cartões de token); tokens do 2D em pé; faces laterais das células elevadas vêm do canvas. Uso adiado pelo usuário.
9. **Trava visual**: só olhar e disposição; dados, textos e controles em gavetas são livres.

### 17.3 Lista do que falta
**A. Já existe (motor ou legado): só expor, integrar ou testar**
- Visão (Visão no Escuro, penumbra, luz, fogueira, alcance) e névoa: `game/vision.ts` completo; conferir se a entrada de tipo e alcance de visão por token está no painel Elenco.
- Portas abertas/fechadas/trancadas: existem (`BoardWall.open/locked`, painel de portas). Faltam CD e teste.
- Baú posicionável: existe (`BoardObject`: `opened`, `locked`, `contents`, `interactBoardObject`); o legado "Baú" é só o navegador de itens.
- Ficha da ameaça: 611 de 611 têm `tesouro` ("Metade", "Padrão"...) e o token recebe `loot` (`parseLoot`).
- Voo/escavação: a ficha já importa `flySpeed`/`burrowSpeed`; o bestiário só passa o voo (`burrowM` falta em `bestiaryAdapter.ts`).
- Testes da UI de conjuração (só a regra de custo/círculo está testada).
- Rede real: áudio, YouTube, Freesound, ping, jukebox, arrastar token entre navegadores.
- Conta/mesas online: funcionam localmente; Supabase opcional, sem teste.
- Matriz final das 72 seções (feito/parcial/ausente).

**B. Precisa ser criado (sugestão, nada disso existe pronto)**
1. **Baú interativo** (era muito bom no legado): objeto/token baú configurado como mini-macro: conteúdo, trancado, CD, armadilha; o jogador faz o teste para abrir; se trancado o baú treme e avisa; ao abrir mostra o conteúdo, com animação simples e fixa (itens/dinheiro representativos, não precisa ser exata). Base: `BoardObject` + `interactBoardObject`.
2. **Portas com CD** (abrir/forçar, CD de magia), no mesmo estilo de mini-macro.
3. **Espólio**: (a) portar o cálculo de `public/espolio` (tabelas de tesouro T20) para um módulo da Mesa; (b) ao derrotar a ameaça, usar o `tesouro` da ficha e gerar o espólio; (c) botão "criar baú de espólio" na posição do monstro (como o `lootToChest` do V3).
4. **Gatilho de local com música ou macro**: hoje gatilhos só aplicam condição; criar ação "tocar faixa do Jukebox / rodar macro" ao entrar na área.
5. **Reação**: hoje só sobre si mesmo; reações com alvo em outro (ex.: ataque oportuno) ficam manuais.
6. **Montaria**: o cavaleiro fica sobre a montaria na mesma casa (dois tokens empilhados); falta separar visualmente (arte de cavaleiro sobre montaria).

**C. Realmente ausente (nenhuma base pronta)**
- Importar campanha inteira do Foundry para "Minhas campanhas", privada por conta.
- Campanhas oficiais jogáveis (Coração de Rubi, Libertação de Valkaria, terceira a definir) e one-shots no mesmo estilo.
- Poderes de classe e raça e magias fora das 25 curadas (efeito automático, tipo de dano estruturado, duração rolada, remoção manual de efeito).
- Na visão isométrica: paredes, portas, luzes e régua ainda só são desenhadas no 2D; a arte isométrica da cena "Ponte da Tormenta Rubra" é da taverna (dado herdado, não combina com o mapa 2D).

**D. Limpeza pendente (precisa da confirmação do usuário)**
- `src/isoView.css` (arquivo meu que ficou sem uso) e `.playwright-mcp/` (capturas de teste) podem ser apagados.

## 18. Baú interativo, portas com CD e espólio (29/09/2026, noite)

Ordem pedida pelo usuário: baú com CD e armadilha → portas com a mesma arquitetura → espólio com a tabela real de `public/espolio`. Tsc ok, 369 testes, trava visual ok, build ok; conferido no navegador.

**Regras do Tormenta20 usadas (ditas pelo usuário e conferidas em `magias.json`/`itens.json`)**
- Abrir fechadura = teste de **Ladinagem**, CD **20** simples (porta de loja), **25** média (prisão, baú), **30** superior (cofre, câmara do tesouro); **ação completa** e **gazua**; sem gazua **–5**.
- Arrombar também vale com teste de **Força** (atributo) contra a mesma CD.
- **Misticismo** serve para reconhecer armadilha; a única magia que ajuda é **Tranca Arcana** (+10 na CD de Força/Ladinagem; o aprimoramento que abre custa +1 PM; aprimoramento "+5 CD" custa 5). Percepção para procurar armadilha foi mantida como segunda via (não confirmado como regra).
- Correção: a primeira versão tinha "tranca mágica dissipada por Misticismo" e forçar com Atletismo; ambos removidos.

**Baú** (`game/chest.ts`, `tactics/engine/objectCommands.ts`, `components/mesa/ObjectDialog.tsx`, `ObjectEditor.tsx`, `ChestReveal.tsx`): objeto da cena configurado pelo Mestre como mini-macro (nome, conteúdo, trancado, CD por predefinição 20/25/30 ou livre, Tranca Arcana, armadilha com CD de achar/desarmar, dano, tipo de dano, resistência, condição). Jogador clica no baú no mapa, escolhe quem interage (casa adjacente) e tenta: abrir, arrombar, forçar, procurar/reconhecer armadilha, desarmar, abrir/trancar com Tranca Arcana. Trancado: treme e avisa. Abrir: revela o conteúdo com animação simples (cartões) para todos e dispara a armadilha armada. O jogador nunca recebe CD, conteúdo fechado nem números da armadilha (`wireStateForPeer`).
**Portas** (`DoorDialog.tsx`, `DoorEditor.tsx`): mesma arquitetura, CD padrão 20; janelas incluídas; clique na porta no mapa (ferramenta de seleção).
**Espólio** (`game/espolio/tabelas.js` = `data.js` + `data_itens.js` + `sub_tabelas.js` de `public/espolio`, sem alteração; `espolio.ts`, `threatLoot.ts`): lógica de `rolarMissao` portada; o `tesouro` da ficha decide Nenhum/Metade/Padrão/Dobro (Triplo = 3 rolagens, extensão nossa); ND lido da ficha (½, ¼, "ND 5", S e S+ = 20). Ao derrotar uma ameaça do bestiário cai um baú "Espólio de X" na casa dela, com moedas, itens e o equipamento/material que a ficha cita; botão "Criar baú de espólio" no painel Elenco (Mestre) para criar ou refazer. O baú fica acima do token caído para poder ser clicado.

**Escolhas nossas** (registradas): CDs predefinidas por tipo de fechadura; baú de espólio nasce destrancado e sem armadilha; Tranca Arcana só ajuda quem conhece a magia (lista de magias da ficha ou ações do token); jogador não vê a Tranca Arcana; 2D ("2D" da tabela) mostra as duas opções ("A ou B") em vez do cartão de escolha da página; "espaços da riqueza" da página não foram portados.

**Ainda pendente deste bloco**: baú fechado ainda não bloqueia o movimento (o V3 pedia); a armadilha só dispara em quem abre (não há armadilha de porta); pegar o conteúdo do baú para a mochila da ficha não existe (o conteúdo é só mostrado); a gazua só é reconhecida se estiver no equipamento da ficha oficial; a animação do conteúdo é fixa e simples, como você pediu.

### 18.1 Ajustes pedidos pelo usuário depois do baú (29/09/2026)
- **Percepção** procura armadilha; **Ladinagem** desarma; **Misticismo** detecta se há **magia** no baú ou na porta (a Tranca Arcana), não armadilha. **Todas as CDs são definidas pelo Mestre** (CD de Percepção e de desarmar na armadilha; CD de Misticismo no objeto com magia; CD da fechadura). O jogador só passa a saber da magia depois de detectá-la (`magicRevealed`); a resposta é a mesma quando não há magia.
- **Pegar o conteúdo**: no baú aberto o jogador marca itens (ou "Pegar tudo") e eles saem do baú. O que foi pego fica em `pendingLoot` no token e quem tem a ficha oficial (navegador do jogador; o Mestre só para tokens sem jogador conectado) aplica na mochila e avisa o Mestre para limpar (`LootClaimer`, `game/espolio/lootToSheet.ts`). Moedas viram T$ no dinheiro da ficha (1 TC = 0,1 T$; 1 TO = 10 T$); itens do catálogo entram com espaços, preço e categoria do catálogo; o resto entra como Item Geral com o texto do baú; repetidos empilham. Sem ficha vinculada no navegador, a pendência só é limpa (o que foi pego fica no chat).
- **Gazua**: só conta se estiver no equipamento da ficha oficial (confirmado); uma gazua pega do baú passa a contar.
- Limites conhecidos: arma pega entra no equipamento, não na lista de ataques da ficha; itens de riqueza aparecem com o texto da tabela ("4d4 (10 T$) (ágata...)"), sem sorteio do valor exato.

### 18.2 Fechamento do bloco baú/porta/espólio (29/09/2026)
- **Baú fechado bloqueia o movimento** (`movementBlocked` em `tactics/engine/movement.ts` e `moveToken`): não anda sobre ele nem por ele; aberto passa; item e tesouro no chão não bloqueiam; quem já está sobre o baú sai. Voo e escavação passam.
- **Porta com armadilha**: mesma armadilha do baú (`TrapEditor`), dispara em quem abre; Percepção procura, Ladinagem desarma; o jogador só vê o aviso depois de revelada.
- **Arma pega** entra também na lista de ataques da ficha; **riqueza** agora tem valor exato sorteado (dado × multiplicador) e um objeto dos exemplos ("Ágata (T$ 12)").
- **Tesouro no legado**: no `Vtt/app.js` o campo Tesouro só aparece como texto (notas do token e ficha do bestiário); o sorteio existe só em `public/espolio`, já portado. O texto do Tesouro agora aparece também no cartão do bestiário da Mesa.
