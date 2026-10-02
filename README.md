# 🏰 MesaOnline — Mesa virtual de Tormenta 20

Portal e mesa virtual de **Tormenta 20** em um único projeto: fichas e Oficina de Heróis, compêndio, bestiário (855 ameaças), parceiros, campanhas, **mesa online** com exploração, combate tático e multijogador em tempo real.

- **Portal:** `/` (Oficina de Heróis, Meus Personagens, Parceiros, Mesa online, Livros, Compêndio, Raças, Classes, Equipamentos, Magias, Monstros, Homebrew)
- **Mesa:** `/mesa/` (abre direto na sala, a partir da página *Mesa online* do Portal)
- **Hospedagem:** site estático (`dist/`), qualquer hospedagem de arquivos (GitHub Pages, Cloudflare Pages, Netlify)
- **Dados das mesas online:** Supabase (só a tabela `mrpg_tables`); a sala ao vivo usa conexão direta entre navegadores (PeerJS)
- **Rodar local:** `npm install` e `npm run dev` (abra o endereço que o Vite mostrar; a Mesa fica em `/mesa/`)

## 🗂️ Estrutura

```
index.html, mesa/            ← entradas do Portal (/) e da Mesa (/mesa/)
src/
  portal/                    ← Portal (páginas, Oficina de Heróis, importação de PDF/JSON)  ⚠️ não modificar sem pedir
  App.tsx                    ← a Mesa (estado de cena, exploração, combate, multijogador)
  components/mesaSkin/       ← a "máscara" visual da Mesa (V5)           ⚠️ protegida pela trava visual
  components/mesa/           ← gavetas e diálogos da Mesa (Elenco, Ambientação, Tokens, Música, Dados…)
  game/                      ← estado e regras puras (vttBridge, movimento, montaria, tamanho, clima, áreas…)
  tactics/                   ← motor tático (movimento, combate, reações, magias, IA, baú/porta, montaria)
  modeColors.css, expandedMode.css ← os dois modos visuais (Minimalista e Expandido)
ficha-modernrpg/             ← compêndio T20 em dados (raças, classes, poderes, magias, itens, ameaças)
public/                      ← ferramentas estáticas e arte (ficha, forja, grimório, combate, dados, espólio,
                               encontros aleatórios, perigos, parceiros, libertação de Valkaria…), fontes, texturas
server/                      ← servidor opcional de contas/tokens (porta 4000); não roda em hospedagem estática
db/                          ← SQL do Supabase (supabase-mesas.sql e o rollback)
scripts/                     ← trava visual (check-visual-lock.mjs e o manifesto)
tests/                       ← testes (vitest) e e2e antigo (Playwright)
docs/                        ← execução, mapa de funções, matriz de origem, auditorias
Vtt/                         ← VTT legado (referência de funções; não faz parte do que roda)
```

## ⚠️ Regras do projeto (não quebre!)

1. **Não mudar o visual do V5.** A trava visual (`npm run check:visual-lock`, manifesto em `scripts/visual-lock.manifest.json`) protege só a aparência e a disposição de `src/components/mesaSkin/**`, `src/index.css` e `src/mesa-theme.css`. Texto, rótulos, dados e comportamento podem mudar; depois, regenerar o manifesto.
2. **Ao importar de outra fonte, traga só dado e comportamento**, nunca moldura, cor ou estilo.
3. **O Portal (`src/portal/`) não é modificado** sem pedido; a Oficina de Heróis é considerada perfeita.
4. **Projeto autocontido:** nada pode depender de caminho fora desta pasta. O que foi copiado e de onde está em `docs/`.
5. **Regras de Tormenta 20 só com fonte** (livro, JSON do projeto ou o que o dono do projeto definiu). Convenções nossas ficam documentadas como tal.
6. **Ações destrutivas** (apagar, enviar para o GitHub, alterar banco de produção) só com confirmação individual.

## 🎨 Modos da Mesa

Em *Configurações → Modo da mesa*:

| Modo | Estilo |
|---|---|
| **Minimalista** (padrão) | dourado e marrom-escuro |
| **Expandido** | azul-marinho profundo com textura de água, moldura de lava carmesim, dragões, cantos e ícones dourados, dados de cristal |

O modo vai em `<html data-table-mode>`. As cores de superfície são variáveis CSS (`var(--mx-…)`): não coloque cor solta nos componentes.

## 🧰 O que a Mesa faz

Cenas e mapas · Ambientação (itens, baús, armadilhas, luzes arrastáveis, áreas de efeito, mídia) · Elenco · Tokens (biblioteca, vínculo com ficha ou ameaça, GIF animado) · Música e efeitos (Jukebox sincronizado) · Régua · Ping · Diário · Macros e gatilhos · Clima (chuva, neve, cinzas, névoa, tormenta, tempestade) · Fog e visão · Viagem e encontros · Rolagem de dados · **Combate tático** (iniciativa, ações de movimento e padrão, reações, condições, magias, IA) · **Tamanho e ocupação de casas** (Grande 2×2, Enorme 3×3, Colossal 6×6) · **Montaria** (tamanho, distância de 1 casa, ação de movimento em combate) · Multijogador com o Mestre como autoridade.

## ▶️ Comandos

```bash
npm install
npm run dev            # servidor de desenvolvimento
npm run typecheck      # TypeScript
npm run test:unit      # trava visual + testes (vitest)
npm run build          # trava visual + typecheck + build em dist/
npm run preview        # serve o dist/ localmente
npm run server         # (opcional) servidor de contas/tokens na porta 4000
```

`dist/` traz o Portal em `/` e a Mesa em `/mesa/`. O Portal usa rotas com `#`, então não precisa de configuração de rota no servidor.

## 🔌 Serviços externos

| Serviço | Para quê | Sem ele |
|---|---|---|
| PeerJS (`0.peerjs.com`) | conexão inicial da sala ao vivo | a Mesa local funciona; a sala online não abre |
| Supabase | mesas online (`mrpg_tables`, funções `mrpg_table_*`) | a mesa é criada só no navegador |
| YouTube / Freesound | faixas do Jukebox e efeitos | arquivos próprios e efeitos prontos continuam |

Configuração do Supabase em `.env.local` (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, apenas a chave **pública**). Chaves secretas ficam só em `.env.admin.local` (nunca com prefixo `VITE_`; não publicar).

## 📚 Documentação

`docs/EXECUCAO.md` (como rodar e publicar) · `docs/MAPA_FUNCOES.md` (todas as funções, botões e pendências) · `docs/TRAVA_CRITICA_VISUAL.md` · `docs/MATRIZ_ORIGEM_NOVA_FUSAO.md` · `CLAUDE.md` (estado do projeto e decisões) · `README-FUSAO.md` e `FUSION_MATRIX.md` (histórico da fusão).
