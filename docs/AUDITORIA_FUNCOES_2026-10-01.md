# Auditoria de funções — 01/10/2026

*Sem código novo. Feita lendo o código e varrendo todas as funções exportadas do motor (`src/game`, `src/tactics`) para ver quais têm um chamador na tela. A lista por tela e botão está em `docs/MAPA_FUNCOES.md`; este documento responde a outras quatro perguntas: o que funciona, o que existe sem botão, o que não precisa de botão e o que falta.*

**Método e limites.** Das 399 funções exportadas do motor: **223** são chamadas por alguma tela (App/componentes); **141** são usadas só por outras partes do motor ou pelos testes (internas); **35** não têm nenhum chamador (§3 e §4). "Tem chamador" não prova que o fluxo funciona de ponta a ponta: o que está provado é o que tem teste automático (489 testes) ou verificação em Chrome headless, e **nada disso substitui o seu playteste**.

---

## 1. Funcional e com botão (ver as telas em MAPA_FUNCOES.md)

| Área | O que funciona | Prova |
|---|---|---|
| Cenas | Cena → mapas, importar mapa, UVTT (importar/exportar), 2D/isométrica, andares, grade | testes + headless |
| Elenco | Lista, selecionar/centralizar/tirar seleção, editar PV/PM/Defesa/condições/montaria, controle por jogador, aura/luz, voo/escavação, itens/baús/tesouros com editor | testes + headless |
| Tokens | Biblioteca no navegador e na conta, vínculo a ficha, ameaça, objeto e JSON | testes + headless |
| Ambiente | Clima (chuva, neve, cinzas, névoa), Fog manual, Luz (cada fonte), Visão dos jogadores, Paredes (à mão + automáticas fracas), Portas | testes + headless |
| Combate | Mover, Agir, Magia, Itens, Condição, Esperar, PV/PM, testes de resistência, iniciativa editável, mesa de rolagens, reação com prompt, turno da IA ("Executar turno da IA"), prévia de casas alcançáveis | testes (a tela de combate **não foi revista pelo usuário** depois das últimas mudanças) |
| Exploração | Perícias (rolam e mostram o resultado), equipamentos, magias, hotkeys 1–5 | teste + headless |
| Mestre | Viagem, encontro aleatório, sala online (submenu), macros globais, gatilhos, desfazer/refazer | testes |
| Som | Jukebox com loop, soundboard, Freesound, sincronizados | testes |
| Rede | Criar/entrar na sala, mestre autoridade, recorte por jogador | testes; validado à mão com 2 navegadores |

## 2. Existe no motor, mas **não tem botão** (confirmado na varredura)

| # | Função | Situação |
|---|---|---|
| 1 | **Sair da sala online** (`leaveMultiplayer`) | só o painel de criar/entrar existe; não há "Sair" |
| 2 | **Restaurar um backup / importar pacote da mesa** (`importScenePackage`) | existe só o download do backup; o módulo de importação (`tactics/io/modernRpgImporters.ts`) **não é importado por ninguém** |
| 3 | **Editar uma ameaça própria depois de criada** (`updateCustomThreat`) | só criar e apagar |
| 4 | ~~Recortar a imagem do token~~ | **feito em 01/10**: janela Novo token, com a imagem arrastada sob o círculo fixo |
| 5 | ~~Colar imagem da área de transferência~~ | **feito em 01/10**: Ctrl+V / botão "Colar imagem" em Cenas e mapas (mídia) e na janela Novo token |
| 6 | **Mover uma área já desenhada** (`translateGeometry`) e **selecionar os tokens dentro de uma área** (`tokensInCells`) | sem botão |
| 7 | **Régua com vários pontos** (`pathLegs`) | a régua só mede A→B |
| 8 | **Importar ameaça por função própria** (`importThreat`) | o formulário "Nova ameaça" tem o seu próprio importador de JSON; a função não é usada |

Do registro de pendências antigo (`MATRIZ_ORIGEM_NOVA_FUSAO.md` §14–18), ainda valem: baú fechado não bloqueia o movimento; não há armadilha de porta que dispare em quem abre; montaria sem arte (cavaleiro e montaria empilhados na mesma casa); o bestiário não passa a velocidade de escavação (`burrowM`) ao token.

## 3. **Não precisam de botão** (automáticas ou internas)

- **Cálculo de visão e fog** (`vision.ts`), luz, exploração ao mover.
- **Regras do T20 aplicadas sozinhas**: efeitos das condições a cada turno, RD por tipo, duração de efeitos (termina no turno do conjurador), classificação e interpretação de magias e textos de regra, círculo por classe, economia de ação, resolução de testes de resistência.
- **Reações** (a janela abre sozinha e o jogador escolhe no prompt), gatilhos de cena, invocações.
- **Sincronização**: rede (recorte por jogador, sinais, áudio em pedaços), histórico de desfazer, persistência local, PV/PM token ↔ ficha (`tokenVitalsSync`), atualização do token quando a ficha muda.
- **Identidade e sessão** dos jogadores (reentrada na sala).
- **Ponte de testes** (e2e).

## 4. Código sem nenhum chamador (35) — candidato a limpeza, **não mexi**

Legado da tela antiga: `game/official.ts` (`sheetToToken`, `sheetToUnit`, `persistUnitVitals`, `onOfficialChange`), `actionForCharacter`, `actionForThreat`, `isArmadaOpenMessage`, `importArmadaScene`, `exportArmadaResult`. Sobras: `getTokens`, `getActiveSceneId`, `cellsToMeters`, `isApplyingHistory`, `knownPlayerPeerId`, `deleteBarrier`, `speeds`, `movementRangeM`, `onTacticalEvent`, `orderSummonGroup`, `damageCategory`, e funções que só os testes usam (`clearHistory`, `historySizes`, `visibleOnFloor`, `jukeboxElement`, `classifyRange/Execution/Duration`). Apagar qualquer uma exige a sua confirmação.

## 5. O que falta fazer

**A. Pedido seu e ainda aberto**
1. Escala do mapa ligada ao zoom (hoje a barra é texto fixo, escondida por padrão).
2. "+" de perícias/equipamentos e escolher quais perícias aparecem.
3. Hotkeys de macro de ficha (montar cavalo, trocar arma).
4. ~~Equipamento arrastado ao mapa cair aos pés do token~~ **feito em 01/10** (botão ↓ e arrastar para o mapa).
5. Configuração completa de ficha/inventário no combate (hoje só marcas).
6. Diário com filtros (aguarda o seu print).
7. Modo Expandido: **o botão agora funciona** (interior azul-marinho, título em relevo, orbe do d20); faltam a moldura de lava com dragões e os botões em relevo, que dependem de imagens geradas.
8. Importar campanha/one-shot inteiro (mapas, tokens, paredes, diário): hoje só personagens e nomes entram.
9. Lobby da Mesa = página "T20 Online" do Portal e "Abrir mesa online" direto na sala (decidido; **não confirmei se foi feito**).
10. Escolher o ponto no mapa ao adicionar ameaça do bestiário (hoje: posição livre).

**B. Do §2 desta auditoria**: Sair da sala, restaurar backup, editar ameaça própria, recorte e colar de imagem, mover área, selecionar por área.

**C. Qualidade**
11. Detecção de paredes por imagem: fraca em mapas ilustrados (decisão: deixar IA para depois do playteste).
12. Presets de luz do V3 (fogueira, lanterna, escuridão mágica) não restaurados por completo.
13. Só 25 magias têm efeito automático; 24 sem teste; poderes de classe/raça sem efeito automático.
14. Isométrica: paredes, portas, luzes e régua só no 2D.
15. "Rodando por cima" em Cenas e mapas: **não reproduzido** (pode ser os botões "Girar" da isométrica; aguardando descrição).

**D. Processo**
16. **Nada do que foi feito em 30/09 e 01/10 foi conferido por você na sua tela** (Elenco, Ambiente, Bestiário, Tokens, perícias, paredes).
17. Refazer a suíte e2e (os 7 testes antigos falham por seletores da tela antiga).
18. Matriz das 72 seções do contrato ainda sem marcação seção a seção; `docs/ENTREGA_CONFERENCIA.md` por escrever.
19. Agente de IA (assistente + Knowledge Pack): **adiado para depois do playtest**.

## 5b. Correção de 01/10 (tarde): combate e seleção
O playteste do usuário achou um defeito grave, já corrigido e testado (headless + `combatReinicio.test.tsx`): o botão "Encerrar combate" não encerrava o combate (só trocava a tela), o que travava a exploração, prendia o painel direito e reaproveitava a ordem de iniciativa antiga. Ver `CLAUDE.md`.

## 6. Sugestão para o playteste
Testar nesta ordem: Elenco (adicionar herói/ameaça, selecionar/tirar seleção, baú) → Ambiente (portas, luz, visão) → exploração (perícias, hotkeys) → combate completo → sala online com 2 navegadores. Anotar o que falhar com o modo (2D/isométrica), o papel (mestre/jogador) e, se possível, um print.
