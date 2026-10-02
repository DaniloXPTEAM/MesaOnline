# Auditoria função por função: Tática embutida do ModernRPG-2026-09-23

Fonte auditada: `public/vtt/armada-tactics.js` (funções listadas por nome), `reactive-triggers.js`, `spell-effects.js`, `summon-effects.js`, testes em `tests-mesa/`.
Destino de tudo: runtime V5 (`src/tactics/**`, `src/game/**`). Só dados e comportamento entram; nada visual do ModernRPG.
Status: **Portado** (existe no V5), **Portado agora** (feito nesta rodada), **Equivalente** (V5 cobre de outro jeito), **Não portado**, **Fora de escopo** (é UI do ModernRPG, o V5 tem a sua).

Nota de método: a coluna "V5" cita o arquivo em que confirmei a função por busca no código. Onde escrevo "não confirmado", não abri o código para comparar o comportamento.

| Função ModernRPG (`armada-tactics.js`) | O que faz | Status | V5 |
|---|---|---|---|
| `castContext` | nível = limite de PM; círculo máximo pela classe; racial | Portado agora | `interpretation/castContext.ts`, `castCircle.ts` |
| `castPlan` | custo, bônus somados, muda/truque/limiteBonus/requerCirculo | Portado agora | `spellCasting.ts` `computeCastPlan` |
| `castInfo`, `castPreview` | dados para a tela de aprimoramentos | Portado (tela V5 já existia; ganhou linha racial) | `mesaSkin/MesaSkinActionDialog.tsx` `CastStep` |
| `setRacial`, `castSpell` | marca a magia como racial no token | Portado agora | `BoardToken.tacticsRacial`, `runtimeCommands.ts` `resolveAction` |
| `runCast` | resolve a magia com o plano | Portado | `runtimeCommands.ts` + `spellEffects.ts` (`augmentMods`) |
| `castCandidates` + campo `alvo` do registro (`lado`: aliados/inimigos/qualquer/si, `incluiSi`) | quem cada magia pode escolher como alvo | Portado agora | `interpretation/spellTargeting.ts` (regras em `data/spellEnhancements.json`), usado por `runtimeCommands.ts` `validTargetSide` e pelo TargetChooser; alcance e linha de efeito continuam do V5. Teste: `tests/spellTargeting.test.ts` |
| `rollDiceDuration`, `rollDamageFormula` | rola duração/dano | Portado agora | `rollFormula` e `parseDurationRounds` em `spellEffects.ts` (ex.: Hipnotismo 1d4 rodadas) |
| `checkReactiveTrigger` | reações automáticas (Santuário, Arma Espiritual, petrificado) | Portado | `engine/reactiveTriggers.ts` |
| `tickEffects` | efeitos por rodadas terminam no início do turno do **conjurador** | Portado agora | `expireEffectsAtTurn` (`reactiveTriggers.ts`) com `TacticalEffect.casterId`; prazo lido do descritor (`parseDurationRounds`, `spellEffects.ts`); teste em `tests/turnEffects.test.ts` |
| `removeEffect` | remove efeito do token | Equivalente | cancelamento por `cancels` em `spellEffects.ts`; remoção manual não confirmada |
| `parseSave`, `ArmadaSaves.resolve` | interpreta resistência e resolve teste | Portado | `inferActionFields` + `engine/saves.ts` |
| `aiPlan` | plano do turno da IA | Portado | `engine/ai.ts` `runAiTurn` (só ações que miram inimigo) |
| `turnPlan`, `reachable`, `move`, `range`, `speeds`, `execKind`, `powerKind` | economia de ação, alcance, deslocamento | Portado | `actionEconomy.ts`, `movement.ts` (`reachableCells`), `targeting.ts` |
| `runSummon`, `summonThreatFor`, `summonAttack`, `summonMove`, `findEmptyTilesNear` | invocações, ordens e posicionamento | Portado | `engine/summonEffects.ts` (`resolveSummonEffect`, `orderSummonGroup`, `availablePositions`) |
| `spawn`, `catalog`, `inspectThreat`, `threatArt` | bestiário e imagens | Portado (só dados) | `data/bestiaryAdapter.ts`, `threatImages.ts` |
| `addCustomThreat`, `removeCustomThreat`, `persistCustomThreats` | ameaças personalizadas | Portado | `game/actions.ts`, `CustomThreatForm.tsx` |
| `importHero` | ficha vira token | Portado | `modernRpgCharacterBridge.ts` `boardTokenFromCharacter` |
| `createScene`, `editScene`, `configure`, `setSprite`, `fog`, `sendMap`, `mapMeta`, `scene` | cena, mapa, névoa | Equivalente | `vttBridge.ts`, `MesaGlobalPanel.tsx`, `MapStage.tsx` |
| `startCombat`, `endTurn`, `endCombat`, `execute` | ciclo de combate | Equivalente | `vttBridge.ts`, `runtimeCommands.ts` |
| `tokenMenu`, `elementMenu`, `open`, `start`, `wrap`, `listen`, `syncSurface`, `owner`, `visible`, `source`, `skill`, `activeTokenId`, `snapshot`, `assertToken`, `toUnit` | menus e cola da interface/estado do ModernRPG | Fora de escopo | o V5 tem BOARD único e a própria pele |

| `range`, `execKind`, `powerKind` (alcance curto 9 m, médio 30 m, longo 90 m; execução padrão/completa/movimento/livre/reação) | classificação de alcance e execução | Portado agora | `interpretation/spellClassification.ts` (`classifyRange`, `classifyExecution`); os valores já existiam em `modernRpgRules.ts` |
| Duração da magia (instantânea, rodadas, cena, sustentada, longa) | classificação de permanência | Portado agora | `classifyDuration` |
| Natureza da magia | classificação usada pelo código | Classificação INTERNA da aplicação, não regra do T20 | `classifySpellEffect` mapeia para `ActionEffect` (`damage`, `heal`, `buff`, `summon`, `text`). Não existe no ModernRPG uma definição oficial de "cinco naturezas"; invocação, efeitos de magia e gatilhos reativos são sistemas próprios (`ArmadaSummonSpells`, `ArmadaSpellEffects`, `ArmadaReactiveTriggers`). Antes de criar filtro/UI de magias, localizar a fonte de verdade ou manter isto documentado como convenção interna |
| `tipoDano` e RD por tipo (Corte/Perfuração/Impacto; Ácido/Fogo/Frio/Eletricidade) | tipo de dano de arma e magia; RD geral ou por tipo; RD de magia não acumula, de poder acumula | Portado agora (tipos) / Portado (RD) | `DAMAGE_TYPES`, `damageTypesOf`, `spellDamageType` (magia sem campo estruturado: lido do texto); RD em `reactiveTriggers.ts` `damageReductionFor` |

## Testes de `tests-mesa/`

| Área | Situação |
|---|---|
| `reaction-tests.json` | regras portadas para `tests/reactiveTriggers.test.ts` (rodada anterior) |
| `spell-effects-tests.json` | círculo por classe e Bênção portados em `tests/castRules.test.ts`; os demais casos das 25 magias ainda não foram reescritos um a um |
| `cast-ui-tests.json` | comportamento coberto só em parte; teste de interface não portado |

## Pendências reais desta auditoria
1. (Resolvido em 29/09/2026, por decisão do usuário) Por padrão o efeito termina no início do turno do conjurador; o prazo vem do descritor da magia. Efeito sem conjurador no mapa vence no turno de quem o carrega.
2. Portar os testes restantes de `spell-effects-tests.json` (uma magia por vez).
3. Conferir a remoção manual de efeito no V5.
