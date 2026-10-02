# Como executar o projeto

Tudo o que a Mesa e o Portal usam está dentro desta pasta. Não é preciso nenhuma das outras pastas ou zips de origem.

## O que existe

| Parte | Endereço (desenvolvimento) | Código |
|---|---|---|
| **Portal** (fichas, Oficina de Heróis, campanhas, compêndio, contas) | `http://localhost:5173/` | `src/portal/`, entrada `index.html` |
| **Mesa** (mapa, exploração, combate tático, multijogador) | `http://localhost:5173/mesa/` | `src/`, entrada `mesa/index.html` |
| **Servidor de contas** (opcional: login, campanhas e personagens por conta, mesas públicas, livros) | `http://localhost:4000/api` | `server/`, esquema SQL em `db/` |

O Portal abre a Mesa (`/mesa/?campanha=...` ou `?sala=CÓDIGO`) e a Mesa volta ao Portal pelo botão "Voltar ao Portal". Os personagens ficam no navegador (`localStorage`, chave `tormenta20_online_characters_v2`) e são os mesmos nos dois lados.

## Pré-requisitos

- Node.js 20 ou mais novo (testado com 24) e npm.
- Internet só para: o corretor do multijogador (PeerJS), o YouTube do Jukebox e a busca do Freesound (ver "Dependências externas").

## Comandos

```bash
npm install                 # uma vez
npm run dev                 # Portal em / e Mesa em /mesa/ (Vite, porta 5173)
npm run server              # servidor de contas, porta 4000 (só se for usar login/conta)
npm run typecheck           # TypeScript
npm run test:unit           # confere o trava visual e roda todos os testes (Vitest)
npm run build               # confere o trava visual, o TypeScript e gera dist/
npm run preview             # serve dist/ em http://localhost:4173
npm run check:visual-lock   # só o trava visual
```

`npm run build` recusa gerar o pacote se algum arquivo protegido da máscara visual (V5) tiver mudado (`docs/TRAVA_CRITICA_VISUAL.md`).

## Jogar com outras pessoas

1. O **Mestre** abre a Mesa, clica em **Criar sala online** e passa o **código** (ou o endereço com `?sala=CÓDIGO`).
2. Cada **jogador** abre a Mesa, digita o código em **entrar por código** e clica em Entrar.
3. O Mestre atribui cada token ao jogador no painel Elenco ("Controle do token"). O jogador só move e usa o que é dele; todo o resto o Mestre decide.
4. Ao recarregar a página, o jogador reassume os próprios personagens (a identidade fica guardada por sala).

O Mestre é a autoridade: rolagens de baú/porta, reações, movimento e dano são resolvidos nele. Os jogadores recebem só o que enxergam (névoa, CDs e conteúdo fechado não vão para o navegador deles).

## Variáveis de ambiente (todas opcionais)

Crie `.env.local` na raiz para usá-las.

| Variável | Para quê | Padrão |
|---|---|---|
| `VITE_API_BASE` | endereço do servidor de contas | `http://localhost:4000` |
| `VITE_PORTAL_URL` | endereço do Portal para o botão "Voltar ao Portal" quando a Mesa e o Portal ficam em domínios diferentes | `/` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase (mesas online da página "Mesa online"; copiadas em 02/10 de `VTTArmada/ModernRPG/.env.local` para `.env.local` deste projeto) | cai no servidor local ou na mesa só no navegador |
| `SUPABASE_PROJECT_REF`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN` | só para aplicar SQL pelo terminal; copiadas de `foundry-armada/.env.local` para `.env.admin.local` (nunca com prefixo `VITE_`, não publicar) | — |
| `PORT` | porta do servidor de contas | `4000` |
| `MODERNRPG_DATA_DIR` | pasta onde o servidor guarda `db.json` e `secret.key` | `server/data` |

## Onde ficam os dados

- **Navegador** (por pessoa): personagens, cena e estado da Mesa, macros, faixas do Jukebox, arquivos de áudio locais (IndexedDB), chave do Freesound.
- **Servidor de contas** (`server/data/`): contas (senha em hash), campanhas e personagens por conta, mesas públicas e livros. `secret.key` assina os logins. **Faça cópia de segurança dessa pasta** e não a publique.

## Dependências externas em execução

| Serviço | Para quê | Sem ele |
|---|---|---|
| Corretor PeerJS (`0.peerjs.com`) | a conexão inicial da sala online | a Mesa local funciona; sala online não abre |
| YouTube (`youtube.com/iframe_api`) | faixas do Jukebox por link do YouTube | faixas por arquivo do computador ou link de áudio continuam |
| Freesound (`freesound.org`, com a chave do próprio usuário) | busca de efeitos sonoros | os 6 efeitos prontos e os arquivos próprios continuam |
| Imagens de mapa que o Mestre colar por link | mapas | mapas importados como arquivo continuam |

Fontes (Cinzel, Barlow, Inter) e o leitor de PDF (pdf.js) agora vêm de dentro do projeto (`public/fonts/`, pacote `pdfjs-dist`): a importação de PDF e a tipografia funcionam sem internet.

## Publicar

`npm run build` gera `dist/` com o Portal em `/` e a Mesa em `/mesa/`. Sirva `dist/` em qualquer servidor estático (com fallback para `index.html` desnecessário: o Portal usa rotas com `#`). O servidor de contas roda à parte (`npm run server`) e o Portal precisa saber o endereço dele (`VITE_API_BASE`).
