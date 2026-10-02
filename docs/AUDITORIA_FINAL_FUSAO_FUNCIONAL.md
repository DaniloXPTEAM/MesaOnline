# AUDITORIA FINAL — FUSÃO FUNCIONAL DA MESA ONLINE

**Projeto:** Armada Nexus RPG / Mesa Online

**Data:** 29/09/2026

**Baselines respeitados:** `9b1aa01`, `108ca38` e `932e6ef`.

## Regra de auditoria

A conclusão abaixo é funcional, não cosmética. Um submenu, botão ou texto não foi considerado suficiente por si só: cada item foi verificado contra o motor, o `BOARD`/cena, autoridade, persistência/sincronização e testes. Os arquivos da máscara permanecem sob o `visual-lock` e **não foram alterados**.

| Função | Antes | Implementado | Entrada usada | Mestre/Jogador | Testes | Status final |
|---|---|---|---|---|---|---|
| Fog por papel | Cálculo local; snapshot multiplayer entregava o BOARD integral. | Mestre calcula visão por peer antes da transmissão; BOARD redigido remove tokens, objetos, gatilhos, paredes, luzes, terreno, cenas e whispers não autorizados. Fog calculado permanece no snapshot do jogador. | Macros → Ambiente e visão | Mestre configura; Jogador recebe só sua projeção | `fusionSecurity`, `vision`, `tokenVisibility` | **PARCIAL** |
| Visão baseada em luz | CRUD de luz/parede e cálculo já existiam. | Visão combina token, alcance, iluminação, luzes/aura, parede/porta e andar; atualiza por mutação de token/luz/porta e broadcast. | Ambiente e visão / ferramenta contextual Luz | Mestre administra; Jogador consome resultado | `vision`, `tokenVisibility`, `fusionSecurity` | **PARCIAL** |
| Darkvision | Tipo de visão derivado da ficha e cálculo existente. | Ponte da CharacterSheet alimenta `visionType`; cadeia de visão usa darkvision no mesmo motor de luz/fog. | Ficha vinculada → Ambiente e visão | Propriedade do token; Mestre administra ficha | `tokenVisibility`, `vision` | **PARCIAL** |
| Portas | Criava/alternava barreira, sem lista contextual de estados. | Porta tem aberta/fechada/trancada, persiste no BOARD, sincroniza, afeta movimento e linha de visão; contexto mostra portas do andar e permite trancar/destrancar ao Mestre. | Macros → Mapa e objetos → Portas | Mestre; Jogador é rejeitado pelo runtime | `vision`, `movement`, `tokenVisibility` | **CONCLUÍDO** |
| Áreas / shapes avançados | Célula, círculo, retângulo, linha e cone existiam parcialmente. | Células são persistidas; círculo/retângulo/linha/cone usam dois pontos; motor ganhou polígono, geometria persistível, translação pura e consulta de tokens atingidos. | Macros → Mapa e objetos → Áreas | Mestre | `shapes`, `fusionSecurity` | **PARCIAL** |
| Gatilhos executáveis | Área persistia; entrada e saída eram tratadas no movimento. | Avalia entrada/saída, aplica/remove condição, persiste `triggered/appliedTokens`, registra no diário e sincroniza pelo BOARD. | Macros → Mapa e objetos → Gatilhos | Mestre configura; movimento autorizado dispara | `triggers`, `reactiveTriggers` | **PARCIAL** |
| Gatilhos contínuos | Modo persistido, com risco de remoção duplicada em áreas sobrepostas. | Reavalia no movimento e começo de turno; cada forma rastreia o token; áreas iguais não removem condição indevidamente nem deixam marcador órfão. | Macros → Mapa e objetos → Gatilhos → Contínuo | Mestre configura | `triggers`, `turnEffects` | **PARCIAL** |
| Objetos no mapa | Baú decorativo criado no BOARD. | Entidade mantém ID, posição, andar, estado aberto/trancado, conteúdo e imagem; tem interação/lock contextual de Mestre, persistência e sync. | Macros → Mapa e objetos → Objetos | Mestre | `fusionSecurity`, `appSmoke` | **PARCIAL** |
| Undo / Redo | Histórico de snapshots de edição existia. | Reforçada proteção de runtime para Jogador; sequência A→B→undo→undo→redo→redo coberta; alterações de cena são as únicas reversíveis. | Controle superior Desfazer → submenu | Mestre; Jogador não executa | `history` | **CONCLUÍDO** |
| Andares / multinível | Token, parede e luz já possuíam campo de andar parcial. | Formas/objetos entram no andar; visão, luz, paredes, colisão e snapshot do jogador são filtrados por andar; mover token troca estado espacial oficial; painel Cenas permite destino do token selecionado. | Macros → Mapa e objetos → Andares → Cenas | Mestre | `floorsImage`, `fusionSecurity`, `movement`, `vision` | **PARCIAL** |
| Viagem / passagem de dia | Motor de contador por cena disponível. | Avanço de dia, chance de encontro, reset após encontro, diário, persistência e sync permanecem no fluxo Exploração/Cenas. | Cenas e mapas → Viagem | Mestre | `travel` e bridge de runtime | **CONCLUÍDO** |
| Editor de imagem do token | Utilitários de data URL/recorte existiam sem ligação contextual. | Editor de token contextual aceita imagem local e grava `imageUrl/sprite` no token oficial, persistindo e sincronizando pelo bridge. | Macros → Mapa e objetos → Editor de token | Mestre | `floorsImage` (utilitários), `mesaPlayerControls` (autoridade) | **PARCIAL** |
| Overlay visual de condições | Motor e `conditionBadges` existem; máscara usa retratos/valores literais. | Motor segue funcional e independente da apresentação. | Nenhum novo ponto permitido | Ambos (dados) | `conditionBadges`, `mesaPlayerControls` | **PENDENTE POR VISUAL LOCK** |
| Partículas de clima | Estado de clima persistido no BOARD. | Ambiente já persiste/sincroniza clima; nenhuma camada visual foi adicionada. | Macros → Ambiente e visão | Mestre configura | `vision`/bridge de runtime | **PENDENTE POR VISUAL LOCK** |
| Soundboard | URLs existem no código, sem assets reais. | Nenhuma simulação/mocking criado. | Macros → Jukebox | Local quando houver assets | `jukebox` | **BLOQUEADA POR ASSETS** |
| Chat e whisper | Diário e bridge existentes; comando remoto descartava destinatário de whisper. | Chat identifica peer remetente; whisper autorizado preserva destinatário/remetente e snapshot redigido não vaza conversa privada. | Diário | Mestre e Jogador | `fusionSecurity`, `visionMultiplayer` | **CONCLUÍDO** |
| Compêndio | Painel/dados reais já ligados ao ponto Inventário. | Validado sem redesenho. | Inventário → Compêndio | Mestre e Jogador | `compendium`, `appSmoke` | **CONCLUÍDO** |
| Macros | Fórmula, rolagem e macros rápidas já ligadas. | Validadas no runtime e controles de token continuam exigindo ownership. | Macros | Mestre; Jogador no token autorizado | `macros`, `mesaPlayerControls` | **CONCLUÍDO** |
| Jukebox | URL/arquivo local, play/pause/stop/loop/volume funcionavam localmente. | Validada como áudio local; não é alegada sincronização de reprodução entre peers. | Macros → Jukebox | Local; Mestre define a ambientação por procedimento atual | `jukebox`, `appSmoke` | **PARCIAL** |

## Pendências objetivas

### Fog por papel, visão baseada em luz e Darkvision — PARCIAL
1. **Funciona:** cálculo autoritativo e redigido por peer, alcance, luz, obstáculos, portas, andares e darkvision no runtime.
2. **Falta:** projetar fog/iluminação/darkvision sobre a imagem da mesa que o usuário vê.
3. **Por que falta:** a única projeção visível é a máscara congelada; a alteração exigiria mudar `src/components/mesaSkin/**`, CSS protegido ou inserir uma camada visual não aprovada sobre a máscara.
4. **Módulos:** `src/game/vision.ts`, `src/game/vttBridge.ts`, `src/game/multiplayer.ts`; apresentação bloqueada em `src/components/mesaSkin/**`.
5. **Próximo passo:** somente com autorização explícita para uma camada visual independente e um novo baseline/hash visual.

### Shapes avançados — PARCIAL
1. **Funciona:** círculo, retângulo, linha, cone, célula e motor de polígono; células persistíveis, translação pura e consulta de tokens atingidos.
2. **Falta:** coleta/edição de múltiplos vértices, rotação interativa, arrastar/mover e exclusão por shape; ligar uma shape escolhida a uma AoE específica.
3. **Por que falta:** o fluxo contextual aprovado só garante um ou dois cliques; criar prévia/handles sobre o mapa violaria a trava visual. Não foi fingida uma edição incompleta como completa.
4. **Módulos:** `src/game/shapes.ts`, `src/game/mapTools.ts`, `src/components/mesa/MesaGlobalPanel.tsx`.
5. **Próximo passo:** aprovar uma interação de múltiplos pontos fora da máscara ou um novo baseline visual.

### Gatilhos executáveis e contínuos — PARCIAL
1. **Funciona:** entrada/saída, condição, modo único/contínuo, idempotência, reevalução no turno e persistência/sync.
2. **Falta:** ação configurável além de condição, gatilho explícito para abrir porta/ativar objeto/interagir e dano periódico.
3. **Por que falta:** o modelo existente de `ShapeTrigger` armazena condição, não uma ação arbitrária segura. Criar um segundo motor/event-bus seria arquitetura paralela.
4. **Módulos:** `src/game/triggers.ts`, `src/tactics/engine/runtimeCommands.ts`.
5. **Próximo passo:** estender o modelo existente com ações tipadas, uma por vez, e expô-las somente no submenu contextual existente.

### Objetos no mapa — PARCIAL
1. **Funciona:** identidade, posição, andar, conteúdo, lock, abrir/fechar, persistência e sincronização de entidade oficial.
2. **Falta:** dimensões visuais, ownership de objeto por Jogador e vínculo configurável a gatilhos.
3. **Por que falta:** o modelo atual de `BoardObject` não tem dimensão/permissão/vínculo; não foi inventado um segundo tipo de entidade.
4. **Módulos:** `src/game/types.ts`, `src/game/vttBridge.ts`, `src/game/mapTools.ts`.
5. **Próximo passo:** evoluir `BoardObject` com campos tipados e validar comandos remotos no Mestre.

### Andares / multinível — PARCIAL
1. **Funciona:** entidades têm andar; troca de token é espacial; colisão, luz, parede, visão e snapshot seguem o andar ativo.
2. **Falta:** projeção no mapa protegido e transições semânticas (escada/portal) com destino configurável.
3. **Por que falta:** a máscara não possui uma camada aprovada para desenhar entidades por andar ou alças de transição.
4. **Módulos:** `src/game/floors.ts`, `src/game/vision.ts`, `src/game/vttBridge.ts`.
5. **Próximo passo:** permitir uma interação contextual de transição ou definir dados de escada/portal no modelo atual.

### Editor de imagem — PARCIAL
1. **Funciona:** seleção de arquivo, data URL, aplicação no token, persistência e sync; motor de recorte continua disponível.
2. **Falta:** interface contextual para ajustar recorte, escala e posição antes de aplicar.
3. **Por que falta:** o motor de canvas existe, mas não há controles de recorte aprovados na gaveta atual; não foi criado um modal visual paralelo.
4. **Módulos:** `src/game/imageEditor.ts`, `src/components/mesa/MesaGlobalPanel.tsx`.
5. **Próximo passo:** aprovar controles de recorte na gaveta contextual existente sem tocar na máscara.

### Jukebox — PARCIAL
1. **Funciona:** URL/arquivo local, reprodução, pausa, parada, loop e volume.
2. **Falta:** sincronização de reprodução/URL/posição entre peers e autoridade remota explícita.
3. **Por que falta:** `HTMLAudioElement` é local e o bridge não possui protocolo de mídia/clock; não foi simulada sincronização inexistente.
4. **Módulos:** `src/game/jukebox.ts`, `src/game/multiplayer.ts`.
5. **Próximo passo:** adicionar comandos autoritativos de estado de faixa ao bridge antes de sincronizar players locais.

### Overlay visual de condições — PENDENTE POR VISUAL LOCK
1. **Funciona:** condições são estado oficial do token, aplicadas por ações/gatilhos e testadas.
2. **Falta:** badge/overlay automático sobre os tokens da máscara.
3. **Por que falta:** exige alterar ou sobrepor a máscara visual bloqueada.
4. **Módulos:** motor em `src/game/conditionBadges.ts`; apresentação em `src/components/mesaSkin/**` bloqueada.
5. **Próximo passo:** nova autorização e baseline visual antes de qualquer camada de apresentação.

### Partículas de clima — PENDENTE POR VISUAL LOCK
1. **Funciona:** clima é estado de cena persistente e sincronizado.
2. **Falta:** chuva, neve, névoa e cinzas renderizadas com intensidade.
3. **Por que falta:** a camada visual independente não existe; inserir partículas mudaria a composição da máscara congelada.
4. **Módulos:** `src/game/types.ts`, `src/game/vttBridge.ts`; render bloqueado.
5. **Próximo passo:** aprovar explicitamente uma camada de renderer fora da máscara.

### Soundboard — BLOQUEADA POR ASSETS
1. **Funciona:** Jukebox e chamadas de SFX reconhecem os quatro slots.
2. **Falta:** arquivos reais para reprodução.
3. **Por que falta:** não existem `public/vtt/sfx/impact.mp3`, `fire.mp3`, `wind.mp3` e `arcane.mp3`.
4. **Módulos:** `src/game/jukebox.ts`.
5. **Próximo passo:** receber e verificar os assets reais; não criar mocks/falsos.

## Verificação obrigatória

Os resultados finais desta etapa são registrados após executar, nesta ordem:

```bash
npm run check:visual-lock
npm run test:unit
npm run build
git diff --check
```

Nenhum arquivo protegido por `scripts/visual-lock.manifest.json` foi modificado nesta fusão.

**Resultado desta execução:**

- `npm run check:visual-lock` — aprovado; 20 arquivos protegidos conferidos.
- `npm run test:unit` — aprovado; **39 arquivos / 212 testes**.
- `npm run build` — aprovado; typecheck e build Vite concluídos.
- `git diff --check` — aprovado.

O jsdom ainda escreve o aviso conhecido e não fatal sobre `HTMLMediaElement.prototype.pause` durante os testes de Jukebox; não houve falha de teste.
