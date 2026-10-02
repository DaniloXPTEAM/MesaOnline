# Matriz de Fusão

Estado estrutural da fusão em **2026-09-26**. Esta matriz registra a procedência funcional — não autoriza copiar código novamente das cinco árvores-fonte, que permanecem somente como referência.

## Legenda

- **PORTADO** — a função original integra o runtime atual, adaptada quando necessário.
- **SUBSTITUÍDO** — o objetivo foi preservado, mas a implementação original foi trocada por uma fonte de verdade ou arquitetura já existente.
- **DESCARTADO** — implementação redundante, legada ou incompatível removida intencionalmente.
- **PARCIAL** — somente a parcela compatível e ainda necessária foi incorporada.
- **BLOQUEADO** — não há item nesta condição ao fechar esta matriz.

“Teste necessário” descreve a validação objetiva aplicável. Exclusões estruturais são validadas pelas buscas finais, não pela recriação de código morto em teste.

## 1. Aplicação, portal e navegação

| Função relevante | Fonte original | Arquivo original | Arquivo atual | Status | Teste existente/necessário |
|---|---|---|---|---|---|
| Bootstrap React/Vite | ModernRPG-atual | `src/main.tsx` | `src/main.tsx` | PORTADO | `npm run typecheck`; `npm run build` |
| Shell e roteamento principal | ModernRPG-atual | `src/App.tsx` | `src/App.tsx` | PORTADO | `tests/appSmoke.test.tsx` |
| Portal unificado (início, ficha, oficina, campanha, compêndio e mesa) | ModernRPG-2026-09-23 | `src/App.tsx` | `src/App.tsx` | SUBSTITUÍDO | `tests/appSmoke.test.tsx`; build |
| Entrada Mestre/Jogador e retomada local | ModernRPG-atual + VTT web | `src/App.tsx`; `Vtt/index.html` | `src/components/mesa/MesaLobby.tsx` | SUBSTITUÍDO | `tests/appSmoke.test.tsx`; `tests/e2e/multiplayer.spec.ts` |
| Exploração Armada | implement-threat-image-import | `src/components/ArmadaNextTable.tsx` | `src/components/ArmadaNextTable.tsx` | PORTADO | `tests/appSmoke.test.tsx` |
| Workspace de combate Tactics | ModernRPG-2026-09-23 | `tactics-src/App.tsx` | `src/components/tactics/TacticsWorkspace.tsx` | SUBSTITUÍDO | `tests/appSmoke.test.tsx`; E2E multiplayer |
| Troca exploração → combate → exploração sem recarga | ModernRPG-2026-09-23 | `public/vtt/tactics-ui.js` | `src/App.tsx`; `src/components/tactics/TacticsWorkspace.tsx` | SUBSTITUÍDO | `tests/appSmoke.test.tsx`; `tests/e2e/multiplayer.spec.ts` |
| Estilos consolidados do portal, Armada e Tactics | ModernRPG-atual + ModernRPG-2026-09-23 | `src/index.css`; `tactics-src/armada.css` | `src/index.css` | PARCIAL | inspeção visual + build; sem redesign nesta etapa |
| Documentos/páginas estáticas paralelas do portal antigo | ModernRPG-2026-09-23 | `public/*/index.html` | — | DESCARTADO | busca/inspeção: não montar microaplicações como segundo portal |
| Backend Supabase/autenticação paralelo | ModernRPG-2026-09-23 | `server/*`; `db/*` | — | DESCARTADO | inspeção arquitetural: aplicação atual não cria backend concorrente |

## 2. Ficha oficial, personagem e vínculo com token

| Função relevante | Fonte original | Arquivo original | Arquivo atual | Status | Teste existente/necessário |
|---|---|---|---|---|---|
| Modelo `CharacterSheet` | ModernRPG-Arena-atualv2 | `ModernRPG-atual/ficha-modernrpg/sheet.ts` | `ficha-modernrpg/sheet.ts` | PORTADO | `tests/characterTokenSync.test.ts` |
| Store oficial e personagem ativo | ModernRPG-Arena-atualv2 | `ModernRPG-atual/ficha-modernrpg/characterRoute.ts` | `ficha-modernrpg/characterRoute.ts` | PORTADO | `tests/characterTokenSync.test.ts`; busca das chaves proibidas |
| Tela oficial de ficha | ModernRPG-Arena-atualv2 | `ModernRPG-atual/ficha-modernrpg/sheet/T20CharacterSheet.tsx` | `ficha-modernrpg/sheet/T20CharacterSheet.tsx` | PORTADO | typecheck + build; smoke da rota de ficha |
| Rota e seleção de ficha por ID | ModernRPG-Arena-atualv2 | `ModernRPG-atual/ficha-modernrpg/sheet/FichaRoute.tsx` | `ficha-modernrpg/sheet/FichaRoute.tsx` | PORTADO | `tests/characterTokenSync.test.ts` |
| Edição da ficha | ModernRPG-Arena-atualv2 | `ModernRPG-atual/ficha-modernrpg/sheet/EditCharacterModal.tsx` | `ficha-modernrpg/sheet/EditCharacterModal.tsx` | PORTADO | typecheck + build |
| Oficina de personagem | ModernRPG-Arena-atualv2 | `ModernRPG-atual/ficha-modernrpg/workshop/CharacterBuilderWorkshop.tsx` | `ficha-modernrpg/workshop/CharacterBuilderWorkshop.tsx` | PORTADO | typecheck + build |
| Importação de PDF de ficha | ModernRPG-Arena-atualv2 | `ModernRPG-atual/ficha-modernrpg/pdf/*` | `ficha-modernrpg/pdf/*` | PORTADO | typecheck + build; amostras manuais de PDF continuam recomendadas |
| Importação de dados VTT na ficha oficial | ModernRPG-Arena-atualv2 | `ModernRPG-atual/ficha-modernrpg/vtt/importVtt.ts` | `ficha-modernrpg/vtt/importVtt.ts` | PORTADO | typecheck + build |
| Compêndio usado pela ficha (classes, raças, itens, poderes, magias etc.) | ModernRPG-Arena-atualv2 | `ModernRPG-atual/ficha-modernrpg/t20/vtt/*` | `ficha-modernrpg/t20/vtt/*` | PORTADO | build; carregamento dos catálogos em `src/App.tsx` |
| Regras derivadas e XP da ficha | ModernRPG-Arena-atualv2 | `ModernRPG-atual/ficha-modernrpg/t20/sheetRules.ts`; `xp.ts` | `ficha-modernrpg/t20/sheetRules.ts`; `xp.ts` | PORTADO | typecheck + build |
| Conversão ficha oficial → token | ModernRPG-Arena-atualv2 + ModernRPG-atual | `characterRoute.ts`; `src/game/types.ts` | `src/integration/modernRpgCharacterBridge.ts` | SUBSTITUÍDO | `tests/characterTokenSync.test.ts` |
| Vínculo estável `CharacterSheet.id` ↔ `token.modernRpgCharacterId` | ModernRPG-Arena-atualv2 | `characterRoute.ts`; integração VTT | `src/integration/modernRpgCharacterBridge.ts`; `src/game/types.ts` | PORTADO | `tests/characterTokenSync.test.ts` |
| Sincronização PV/PM ficha ↔ token | ModernRPG-Arena-atualv2 + VTT web | ficha oficial; `Vtt/app.js` | `src/integration/tokenVitalsSync.ts`; `src/game/vttBridge.ts` | SUBSTITUÍDO | `tests/characterTokenSync.test.ts`; E2E valida PV/PM entre pares |
| Lista interna de fichas do mestre | ModernRPG-2026-09-23 | `public/vtt/app.js` | — | DESCARTADO | busca final confirma ausência da chave e do vínculo legados |
| Página HTML paralela de ficha do VTT | ModernRPG-atual | `Vtt/` (página de ficha antiga) | — | DESCARTADO | busca final + ausência física; a rota oficial abre por ID |
| Store alternativo de fichas do protótipo | implement-threat-image-import | `src/modernrpg/store.ts` | — | DESCARTADO | busca final confirma que só existe o store oficial |

## 3. Runtime VTT, cenas e multiplayer

| Função relevante | Fonte original | Arquivo original | Arquivo atual | Status | Teste existente/necessário |
|---|---|---|---|---|---|
| Runtime VTT web consolidado | ModernRPG-atual | `Vtt/app.js` | `Vtt/app.js` | PORTADO | `node --check Vtt/app.js`; buscas estruturais |
| Tabuleiro único (`BOARD`) | ModernRPG-atual | `Vtt/app.js` | `Vtt/app.js`; `src/game/vttBridge.ts` | PORTADO | `tests/movement.test.ts`; E2E multiplayer |
| Adapter TypeScript sobre o runtime real | implement-threat-image-import | `src/game/vttBridge.ts` | `src/game/vttBridge.ts` | SUBSTITUÍDO | testes de engine + E2E; nenhum segundo tabuleiro |
| Persistência de token | ModernRPG-atual | `Vtt/app.js` | `Vtt/app.js`; `src/game/vttBridge.ts` | PORTADO | E2E valida movimento, vitais, condição e summon |
| Cenas, troca de cena e cena ativa | ModernRPG-atual | `Vtt/app.js` | `Vtt/app.js`; `src/game/vttBridge.ts` | PORTADO | `tests/e2e/multiplayer.spec.ts` |
| Mapa, terreno, paredes e zonas | ModernRPG-atual | `Vtt/app.js` | `Vtt/app.js`; `src/game/types.ts` | PORTADO | `tests/movement.test.ts`; `tests/targeting.test.ts` |
| Fog, luz, clima e andares | ModernRPG-atual | `Vtt/app.js` | `Vtt/app.js`; `src/game/vttBridge.ts` | PORTADO | node check + build; teste interativo ainda recomendado |
| Gateway PeerJS existente | ModernRPG-atual | `Vtt/app.js` | `src/game/multiplayer.ts`; `src/game/vttBridge.ts` | SUBSTITUÍDO | `tests/e2e/multiplayer.spec.ts` com PeerServer local |
| Autoridade do Mestre e comandos remotos do Jogador | ModernRPG-atual | `Vtt/app.js` | `src/game/multiplayer.ts`; `src/game/vttBridge.ts` | PORTADO | E2E em dois contextos isolados |
| Estado inicial demonstrativo persistente do protótipo | ModernRPG-2026-09-23 | `tactics-src/game/data.ts` | — | DESCARTADO | busca final confirma que tokens vêm exclusivamente de `BOARD.tokens` |
| Persistência paralela de `Unit[]`/`BattleMap` | implement-threat-image-import | `src/App.tsx` | — | DESCARTADO | revisão de `BattleBoard`; testes usam o runtime único |
| Ponte E2E condicionada ao modo de teste | — (infraestrutura de validação) | — | `src/testing/e2eBridge.ts`; `src/main.tsx` | PORTADO | carregada somente em `--mode e2e`; suíte Playwright |
| Endpoint PeerJS alternativo apenas para teste | — (infraestrutura de validação) | — | `src/game/multiplayer.ts`; `playwright.config.ts` | PORTADO | `tests/e2e/multiplayer.spec.ts` |

## 4. Projeção visual e ferramentas da mesa

| Função relevante | Fonte original | Arquivo original | Arquivo atual | Status | Teste existente/necessário |
|---|---|---|---|---|---|
| Projeção `BOARD.tokens` → unidades visuais | implement-threat-image-import | `src/components/BattleBoard.tsx` | `src/components/BattleBoard.tsx`; `src/integration/modernRpgCharacterBridge.ts` | SUBSTITUÍDO | `tests/characterTokenSync.test.ts`; smoke do App |
| Tabuleiro tático React | ModernRPG-2026-09-23 | `tactics-src/components/BattleBoard.tsx` | `src/components/BattleBoard.tsx` | PORTADO | `tests/movement.test.ts`; build |
| Canvas de mapa isométrico | ModernRPG-2026-09-23 | `tactics-src/components/IsometricMapCanvas.tsx` | `src/components/IsometricMapCanvas.tsx` | PORTADO | smoke do App; validação visual recomendada |
| Conversão de layout isométrico | ModernRPG-2026-09-23 | `tactics-src/components/iso-layout.ts` | `src/tactics/iso-layout.ts` | PORTADO | testes indiretos de movimento/targeting + build |
| Menu de comandos | ModernRPG-2026-09-23 | `tactics-src/components/CommandMenu.tsx` | `src/components/CommandMenu.tsx` | PORTADO | build; fluxo E2E usa comandos do runtime |
| Bandeja de dados | ModernRPG-2026-09-23 | `tactics-src/components/DiceTray.tsx` | `src/components/DiceTray.tsx` | PORTADO | build; testes de regras usam rolagens injetadas |
| Painel de conjuração | ModernRPG-2026-09-23 | `tactics-src/components/CastPanel.tsx` | `src/components/tactics/CastPanel.tsx` | PORTADO | `tests/spellEffects.test.ts`; build |
| Formulário de ameaça personalizada | ModernRPG-2026-09-23 | `tactics-src/components/CustomThreatForm.tsx` | `src/components/tactics/CustomThreatForm.tsx` | PORTADO | `tests/customThreats.test.ts` |
| Bibliotecas de personagens e ameaças | implement-threat-image-import | `src/components/Libraries.tsx` | `src/components/Libraries.tsx` | PORTADO | smoke do App + build |
| Imagem de ameaça no catálogo/importação | implement-threat-image-import | `src/modernrpg/bestiary.ts`; `src/components/Libraries.tsx` | `src/tactics/data/threatImages.ts`; `src/components/tactics/CustomThreatForm.tsx` | SUBSTITUÍDO | `tests/customThreats.test.ts`; build |
| Assets de mapas e sprites não duplicados | tormenta20-tactics-jogo-completov3 | `images/*` | `public/tactics/*`; `public/vtt/maps/*` | PARCIAL | comparação por hash feita na fusão; build |
| HUD legado sobreposto ao VTT | ModernRPG-atual | `Vtt/tactics.js` | — | DESCARTADO | cinco buscas finais dos seletores legados devem retornar zero |

## 5. Motor tático e regras

| Função relevante | Fonte original | Arquivo original | Arquivo atual | Status | Teste existente/necessário |
|---|---|---|---|---|---|
| Tipos de token, mapa, combate, efeitos e ações | ModernRPG-2026-09-23 | `tactics-src/game/types.ts` | `src/game/types.ts` | SUBSTITUÍDO | typecheck; suíte unitária completa |
| Catálogo de mapas e ameaças base | ModernRPG-2026-09-23 + Arena V2 | `tactics-src/game/data.ts`; `t20/vtt/ameacas.json` | `src/game/data.ts`; `src/tactics/data/bestiaryAdapter.ts` | SUBSTITUÍDO | `tests/customThreats.test.ts`; build |
| Catálogo de ações | ModernRPG-2026-09-23 | `tactics-src/game/actions.ts` | `src/game/actions.ts` | PORTADO | parser/efeitos/summon; build |
| Economia de ações | ModernRPG-2026-09-23 | `public/vtt/armada-tactics.js` | `src/tactics/engine/actionEconomy.ts` | SUBSTITUÍDO | `tests/actionEconomy.test.ts` |
| Movimento, alcance e terreno | ModernRPG-2026-09-23 | `public/vtt/armada-tactics.js`; `tests-mesa/test-tactical-rules.cjs` | `src/tactics/engine/movement.ts` | SUBSTITUÍDO | `tests/movement.test.ts` |
| Targeting, linha de efeito, cobertura e flanqueamento | ModernRPG-2026-09-23 | `public/vtt/armada-tactics.js` | `src/tactics/engine/targeting.ts` | SUBSTITUÍDO | `tests/targeting.test.ts` |
| Iniciativa, turnos, ataques e fim de combate | ModernRPG-2026-09-23 | `public/vtt/armada-tactics.js` | `src/tactics/engine/combat.ts` | SUBSTITUÍDO | `tests/appSmoke.test.tsx`; E2E valida iniciativa/entrada/encerramento |
| Testes de resistência Fortitude/Reflexos/Vontade | tormenta20-tactics-jogo-completov3 + ModernRPG-2026-09-23 | `index.html`; `public/vtt/spell-effects.js` | `src/tactics/engine/saves.ts` | SUBSTITUÍDO | `tests/saves.test.ts` |
| Dano, cura, RD e resistências | ModernRPG-2026-09-23 | `public/vtt/spell-effects.js` | `src/tactics/interpretation/modernRpgRules.ts`; `src/tactics/engine/combat.ts` | SUBSTITUÍDO | `tests/spellEffects.test.ts`; `tests/reactiveTriggers.test.ts` |
| Interpretador genérico V3 | tormenta20-tactics-jogo-completov3 | `index.html` | `src/tactics/interpretation/modernRpgRules.ts` | PORTADO | `tests/rulesParser.test.ts` |
| Adaptação textual de ações de personagem | ModernRPG-2026-09-23 | `public/vtt/armada-tactics.js` | `src/tactics/interpretation/characterActionAdapter.ts` | SUBSTITUÍDO | `tests/rulesParser.test.ts`; build |
| Pipeline efeito específico → parser V3 → fallback textual | ModernRPG-2026-09-23 | `public/vtt/spell-effects.js` | `src/tactics/engine/spellEffects.ts` | SUBSTITUÍDO | `tests/spellEffects.test.ts` |
| Gatilhos/reactions genéricos | ModernRPG-2026-09-23 | `public/vtt/reactive-triggers.js` | `src/tactics/engine/reactiveTriggers.ts` | PORTADO | `tests/reactiveTriggers.test.ts` |
| **Aparência Inofensiva** | ModernRPG-2026-09-23 | `public/vtt/reactive-triggers.js` | `src/tactics/engine/reactiveTriggers.ts`; `combat.ts` | PORTADO | teste dedicado em `tests/reactiveTriggers.test.ts` |
| **Desprezar os Covardes** | ModernRPG-2026-09-23 | `public/vtt/reactive-triggers.js` | `src/tactics/engine/reactiveTriggers.ts`; `combat.ts` | PORTADO | teste dedicado em `tests/reactiveTriggers.test.ts` |
| Santuário | ModernRPG-2026-09-23 | `public/vtt/spell-effects.js`; `reactive-triggers.js` | `src/tactics/engine/spellEffects.ts`; `reactiveTriggers.ts` | PORTADO | cobertura indireta da etapa pré-ataque; teste dedicado futuro recomendado |
| Arma Espiritual por reação/rodada | ModernRPG-2026-09-23 | `public/vtt/reactive-triggers.js` | `src/tactics/engine/reactiveTriggers.ts` | PORTADO | cobertura indireta do registro; teste dedicado futuro recomendado |
| Summons e ações de invocação | ModernRPG-2026-09-23 | `public/vtt/summon-effects.js` | `src/tactics/engine/summonEffects.ts` | PORTADO | `tests/summonEffects.test.ts`; E2E valida seis tokens reais |
| IA tática de ameaças | ModernRPG-2026-09-23 | `public/vtt/armada-tactics.js` | `src/tactics/engine/ai.ts` | PARCIAL | typecheck + build; teste determinístico futuro recomendado |
| Ferramentas de tabuleiro | ModernRPG-2026-09-23 | `public/vtt/armada-tactics.js` | `src/tactics/engine/boardTools.ts` | PORTADO | build; runtime VTT permanece fonte de verdade |
| Ameaças personalizadas e persistência do catálogo | implement-threat-image-import + ModernRPG-2026-09-23 | `src/modernrpg/bestiary.ts`; `public/vtt/armada-tactics.js` | `src/tactics/engine/customThreats.ts` | SUBSTITUÍDO | `tests/customThreats.test.ts` |
| Importação de herói/PDF para unidade tática | ModernRPG-2026-09-23 | `tactics-src/hero-import.ts`; `pdf-import.ts` | `src/tactics/io/modernRpgImporters.ts` | SUBSTITUÍDO | typecheck + build; ficha oficial continua sendo a origem persistente |
| Sincronização reativa dos adapters TypeScript | — (extração da fusão) | — | `src/tactics/engine/sync.ts` | PORTADO | suíte unitária + E2E |
| Motor JavaScript de 23/09 executado em paralelo | ModernRPG-2026-09-23 | `public/vtt/armada-tactics.js`; arquivos de efeitos | — | DESCARTADO | revisão de imports e build: somente algoritmos extraídos em TypeScript |
| Adapter tático JavaScript ainda não migrado | ModernRPG-atual | `Vtt/tactics.js` | `Vtt/tactics.js` | PARCIAL | `node --check Vtt/tactics.js`; buscas confirmam ausência de HUD/DOM legado |

## 6. Validação automatizada

| Função relevante | Fonte original | Arquivo original | Arquivo atual | Status | Teste existente/necessário |
|---|---|---|---|---|---|
| Fixtures canônicas de mapa/ficha/token/ação | — | — | `tests/helpers.ts` | PORTADO | usadas pela suíte Vitest |
| Smoke de navegação e troca de modo | ModernRPG-2026-09-23 | `tests-mesa/test-exploration-combat.cjs` | `tests/appSmoke.test.tsx` | SUBSTITUÍDO | 3 cenários Vitest |
| Testes de regras e integração | ModernRPG-2026-09-23 | `tests-mesa/test-*.cjs` | `tests/*.test.ts(x)` | SUBSTITUÍDO | `npm run test:unit` |
| Multiplayer Mestre + Jogador em contextos isolados | ModernRPG-2026-09-23 | `tests-mesa/test-tactics-network.cjs` | `tests/e2e/multiplayer.spec.ts` | SUBSTITUÍDO | Playwright + PeerServer local |
| Chromium reproduzível no sandbox sem download externo | — | — | `playwright.config.ts`; dependência `@sparticuz/chromium` | PORTADO | `npm run test:e2e` |
| Validação sintática dos adapters JavaScript | ModernRPG-atual | `Vtt/app.js`; `Vtt/tactics.js` | mesmos arquivos atuais | PORTADO | `node --check` em ambos |

## 7. Resumo de cobertura dos critérios

| Critério | Evidência atual |
|---|---|
| Vínculo da ficha oficial | `tests/characterTokenSync.test.ts` |
| PV/PM ficha ↔ token | `tests/characterTokenSync.test.ts` e E2E |
| Fortitude, Reflexos e Vontade | `tests/saves.test.ts` |
| Parser genérico V3 | `tests/rulesParser.test.ts` |
| Efeito específico e efeito genérico | `tests/spellEffects.test.ts` |
| Reaction trigger | `tests/reactiveTriggers.test.ts` |
| Economia de ações | `tests/actionEconomy.test.ts` |
| Targeting | `tests/targeting.test.ts` |
| Summon | `tests/summonEffects.test.ts` e E2E |
| Ameaça customizada | `tests/customThreats.test.ts` |
| Exploração ↔ combate sem reload | `tests/appSmoke.test.tsx` e E2E |
| Movimento, PV, PM, iniciativa, condição, summon, cena e combate multiplayer | `tests/e2e/multiplayer.spec.ts` |

Nenhuma função permanece **BLOQUEADA**. Itens **PARCIAIS** são deliberadamente limitados ao escopo compatível: não representam uma segunda fonte de verdade nem autorizam reintroduzir HUD, ficha, store, tabuleiro ou motor paralelos.
