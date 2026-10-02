# ModernRPG — Fusão definitiva

Projeto unificado criado a partir das cinco fontes de referência do repositório MesaOnline.

## Executar

```bash
npm install
npm run dev -- --host 0.0.0.0
npm run typecheck
npm test
npm run build
node --check Vtt/app.js
```

## Contrato de estado único

- Personagens: `tormenta20_online_characters_v2`
- Personagem ativo: `tormenta20_online_characters_v2:active`
- Vínculo: `BOARD.tokens[].modernRpgCharacterId = CharacterSheet.id`
- Mesa: `src/game/vttBridge.ts`
  - `BOARD`
  - `SCENES`
  - `combatState`
- Tokens persistentes: somente `BOARD.tokens`
- `TacticalUnitView`: projeção efêmera de renderização, nunca persistida
- Exploração 2D, combate 2D e combate isométrico usam o mesmo BOARD
- Multiplayer: `src/game/multiplayer.ts`; os componentes não instanciam PeerJS

## Fluxo principal

```text
Portal ModernRPG
  ├─ Ficha oficial / Oficina
  ├─ Campanhas / Compêndio
  └─ MesaLobby
       └─ ArmadaNextTable (exploração)
            └─ Tactics V3 (combate)
                 └─ ArmadaNextTable (mesmos tokens e mapa)
```

## Motor tático

Os algoritmos extraídos das fontes avançadas ficam em `src/tactics/engine/`:

- movimento, terreno difícil, elevação, voo, paredes, portas e cantos;
- economia de ações;
- IA do Mestre;
- Fortitude, Reflexos e Vontade;
- alcance, cobertura, flanqueamento e linha de efeito;
- efeitos específicos de magias com fallback no interpretador V3;
- eventos reativos e RD por fonte;
- invocações reais em `BOARD.tokens`;
- ameaças personalizadas persistentes com remoção por `hidden`;
- sincronização pelo PeerJS único.

O teste de regressão de **Criar Mortos-Vivos** confirma a criação de seis tokens reais, com grupo único e desconto de PM.

## Compatibilidade VTT

`Vtt/app.js` permanece baseado no esqueleto de `ModernRPG-atual`, conserva a bridge de `CharacterSheet.id` e possui apenas uma função efetiva `renomearCena(id)`. O produto React usa a bridge TypeScript editável; o HUD legado da Arena V2 não é montado como interface final.
