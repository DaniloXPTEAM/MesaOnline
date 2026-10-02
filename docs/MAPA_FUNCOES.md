# Mesa Online (ModernRPG / Tormenta 20) — Mapa completo de funções

*Estado em 30/09/2026. Gerado a partir do código e dos testes desta pasta; o que não foi conferido na tela real está marcado.*

**Para quem é este documento:** uma pessoa de fora do projeto (pesquisador, designer ou desenvolvedor) que vai avaliar **o que existe, onde fica cada função na tela, o que falta e como organizar melhor**. Não precisa conhecer o código.

---

## 0. Como ler

| Marca | Significado |
|---|---|
| ✅ | Pronto e testado por teste automático (`npm run test:unit`: 74 arquivos, 472 testes passando) |
| 🟡 | Funciona em parte; o que falta está escrito ao lado |
| ❌ | Ainda não existe |
| 🔲 | A função existe no motor, mas **não tem botão/lugar na tela** (ou o lugar é inadequado) |
| 👁 | Feito, mas **o usuário ainda não conferiu na tela dele** depois da última mudança |
| 👑 | Só o Mestre usa (o jogador vê o botão escuro e desativado) |

**O que é o projeto:** uma mesa virtual de Tormenta 20 com três partes — **Portal** (site: fichas, Oficina de Heróis, compêndio, campanhas), **Mesa** (mapa, exploração, combate tático, multijogador) e um **servidor de contas** opcional. A Mesa e o Portal rodam na mesma pasta; as outras pastas de origem serão apagadas.

**Regras que valem sempre (do usuário):**
1. **Não mudar o visual V5** (a aparência da mesa levou 7 dias para ser feita). Mudanças de layout só quando o usuário autoriza item a item.
2. Ao importar de outra fonte, trazer **só dado e comportamento**, nunca moldura, cor ou estilo.
3. **Não modificar o Portal** (a Oficina de Heróis é considerada perfeita), salvo correção técnica autorizada.
4. **Projeto autocontido** (nada pode depender de pasta fora desta).
5. **Regras do T20 só com fonte** (livro, JSON do projeto ou palavra do usuário). O que é convenção nossa fica documentado como tal.
6. Ações destrutivas só com confirmação.

---

## 0b. Mudanças de 01/10 (noite) — leia antes das seções 2 e 3 (elas descrevem o estado anterior)
- **Barra esquerda** em ordem alfabética, 10 botões: **Ambientação** (antigo Objetos), Cenas e mapas, Compêndio, Diário, Elenco, Ferramenta de mestre, Macros, Música, Régua, Tokens. **Saíram** Personagem e Configurações (a engrenagem do cabeçalho abre Configurações).
- **Ícone do perfil** (canto de cima à direita) abre **Meus personagens**: lista as fichas, marca a em uso e a que já está no mapa; escolher um coloca o personagem em uso, seleciona o token (o Mestre o coloca no mapa se faltar) e o painel direito mostra o resumo da ficha dele. Para o Mestre o ícone é um **M dourado**. Botão ao lado de cada ficha abre a ficha completa no Portal.
- **Ambientação** (gaveta do antigo Objetos) agora reúne: ferramentas do mapa, áreas, objetos/portas já existentes, **Itens, baús, tesouros e Armadilha** (saíram do Elenco), **Armadilhas** (lista de todas as armadilhas da cena com estado, CDs e dano), **Luzes** (tocha, lanterna, fogueira, mágica; colocar no mapa e ajustar cada uma) e **Mídia na cena** (saiu de Cenas e mapas). O botão **Gatilhos** marca as casas; **o efeito de cada gatilho se configura em Macros** (lista "Gatilhos da cena": tipo, efeito, uma vez/contínuo, rearmar, remover).
- **Elenco** só tem heróis e ameaças. **Ambiente (sol)** não guarda mais as fontes de luz (só o nível de iluminação da cena).
- **Ferramenta de mestre → Viagem**: duração da viagem em dias, contador "dia X de N", mapa do encontro preparado, botão **Passar o dia e testar a sorte** junto dos contadores; quando há encontro aparece no **palco, para todos**, "Houve um encontro!" com a descrição sorteada, e o Mestre escolhe o mapa e vai até ele (só ele fecha).
- **Modos da Mesa** (Configurações): Minimalista e Expandido já alternam; o Expandido está em construção (ver `CLAUDE.md`, "Modos da Mesa").
- **Cenas e mapas**: ADICIONAR no alto (Nova cena pede o nome; Importar mapa pergunta a cena); Mídia saiu.
- Ainda pendente do pedido: o Mestre **não** vê a lista de Elenco com itens (ok), mas o item "ordem alfabética" vale só para a barra; nada foi feito sobre o "T20 Online" do lobby (descartado até você decidir).

## 1. Arquitetura em um parágrafo

Um **estado único** (`src/game/vttBridge.ts`) guarda mapa, tokens, cenas, combate, chat e Diário. A tela (a "máscara" V5, `src/components/mesaSkin/`) só **lê** esse estado e dispara ações. As gavetas laterais (`src/components/mesa/`) são as telas de configuração. O **motor tático** (`src/tactics/engine/`) aplica as regras (movimento, ataque, reação, magia, IA). No multijogador (**PeerJS**), o Mestre é a autoridade: o jogador manda comandos e recebe só o recorte que pode ver. As contas, campanhas e fichas online ficam no `server/` (porta 4000).

```
Portal (/)  ──────────►  Mesa (/mesa/)  ◄──────  Servidor de contas (opcional)
 fichas, Oficina,         lobby → exploração       login, campanhas,
 compêndio, campanhas     ⇄ combate                fichas, mesas, livros
```

---

## 2. Esqueleto da tela da Mesa (de cima para baixo, esquerda para direita)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ CABEÇALHO  ARMADA NEXUS RPG │ campanha │ Cenário atual │ [Combate] ◎ ☀ ↺ ⌂ ⚙ 👤 │
├────────┬─────────────────────────────────────────────────┬───────────────────┤
│ BARRA  │  (gaveta abre aqui, ao lado da barra)           │ PAINEL DIREITO     │
│ ESQUER │  PALCO DO MAPA (2D ou isométrico) + zoom        │ Exploração: ficha  │
│ DA     │  [régua/ping/pincéis desenham aqui]             │ Combate: ficha +   │
│ 12     │                                                 │ ações + iniciativa │
│ botões │                                                 │ + mesa de rolagens │
│ + d20  │                                                 │ + hotkeys          │
└────────┴─────────────────────────────────────────────────┴───────────────────┘
```

### 2.1 Cabeçalho

| Controle | O que faz | Estado |
|---|---|---|
| Logo ARMADA NEXUS RPG | Volta ao Portal | ✅ |
| Seletor de campanha / "Cenário atual" | Mostra campanha e cena; clicar abre **Cenas e mapas** | ✅ |
| **Combate** (vermelho) | Entra no combate; dentro vira **Encerrar combate** | ✅ 👁 |
| ◎ **Ping** | Liga/desliga o ping; clique no mapa marca o ponto para todos | ✅ *(novo, ainda não visto pelo usuário)* 👁 |
| ☀ **Iluminação da mesa** | Abre **Ambiente** (Clima, Fog, Luz, Visão, Paredes, Portas) | ✅ |
| ↺ **Desfazer** 👑 | Abre **Desfazer e refazer** | ✅ |
| ⌂ **Mapa da campanha** | Abre **Cenas e mapas** | ✅ |
| ⚙ **Preferências** | Abre **Configurações** | ✅ |
| 👤 Perfil | Abre a ficha do personagem em foco (Portal) | ✅ |

### 2.2 Barra esquerda (12 botões + d20)

| Botão | Gaveta que abre | Visível ao jogador? |
|---|---|---|
| **Cenas e mapas** | §3.1 | sim |
| **Personagem** | Ficha oficial do Portal (herói em foco) | sim |
| **Elenco** *(antes "Grupo")* | §3.2 | sim (jogador só vê a lista) |
| **Tokens** | §3.3 | sim |
| **Compêndio** | §3.4 | sim |
| **Música** | §3.5 (Jukebox) | sim |
| **Objetos** 👑 | §3.6 | escuro/desativado |
| **Régua** | Liga a medição A→B no mapa | sim |
| **Diário** | §3.7 | sim |
| **Macros** 👑 | §3.8 | escuro/desativado |
| **Ferramenta de mestre** 👑 | §3.9 | escuro/desativado |
| **Configurações** | §3.10 | sim |
| **d20 vermelho** (rodapé) | Abre a **Mesa de dados** ao lado do mapa (empurra o palco) | sim |

---

## 3. Gavetas — o que cada botão contém

### 3.1 Cenas e mapas
Estrutura nova: **Cena → vários mapas**.
- ✅ Lista de mapas **agrupados por cena** ("CENA 1 · 2 MAPAS"); mapas antigos caem em "Cena 1".
- ✅ **Nova cena**, **Novo mapa nesta cena**, nome da cena (renomeia a cena inteira), renomear mapa ativo.
- ✅ Importar mapa (imagem, com detecção de grade), importar/exportar **UVTT** (paredes e luzes), biblioteca de mapas prontos, remover cena atual.
- ✅ Seletor **2D / Isométrica** (a escolha é de cada jogador).
- ✅ Grade separada do mapa: escala, unidade, métrica, tipo de grade; **Andares** (vários pisos por mapa).
- 🟡 A arte isométrica dedicada só existe para a cena herdada da taverna; as outras caem no 2D.
- 🟡 Na isométrica, paredes, portas, luzes e régua **só aparecem no 2D**.
- ❓ O usuário relatou algo "rodando por cima" em Cenas e mapas (sobreposição visual). **Não foi investigado.**

### 3.2 Elenco (heróis, ameaças, itens, baús e tesouros)
- ✅ Lista de **Heróis** e **Ameaças** com PV/PM/DEF e dono (mestre/jogador). Clicar **seleciona e centraliza**; clicar de novo **tira a seleção**.
- ✅ Barra do token selecionado com **Centralizar** (ícone) e **Tirar seleção**.
- ✅ 👑 Botões **Personagem ou ficha** (janela de personagens: lista da campanha + importar JSON/PDF) e **Ameaça do bestiário** (janela do Bestiário).
- ✅ 👑 Editor do token: PV, PM, Defesa, Condições (com efeito mecânico), Montaria/parceiro, Criar baú do espólio, Remover da cena.
- ✅ 👑 "Mais opções do mestre": Visão (normal/penumbra/escuro) e alcance, **Controle do token** (qual jogador manda nele), imagem do token, modo de movimento (andar/voar/escavar), **Aura e luz** (Tocha 6 m, Lanterna 9 m, Fogueira 12 m, raio, ativa, ilumina).
- ✅ 👑 **Itens, baús e tesouros**: botões Item / Baú / Tesouro criam o objeto ao lado do token; editor: nome, trancado, CD da fechadura, Tranca Arcana, conteúdo, armadilha, remover.
- 🟡 Aura e Controle estão dentro de "Mais opções" por pedido anterior; o usuário pediu que **o jogador não veja nada disso** (já é assim) e que a organização melhore — *aguardando decisão de onde ficam em definitivo.*
- 👁 Tudo desta gaveta foi reorganizado hoje e **ainda não foi visto pelo usuário**.

### 3.3 Tokens (biblioteca pessoal)
- ✅ Importar imagens como tokens; arrastar/adicionar ao mapa; apagar.
- ✅ **Equipamento no chão** (01/10, 👁): cada item de Equipamentos/Mochila (e da aba Inventário do combate) tem um botão ↓ "Soltar no chão" e pode ser **arrastado para o mapa**; o item sai da ficha (1 unidade) e vira um objeto "item" com o nome e a descrição do item na casa do token ou onde foi solto; o Diário registra. Jogador pede ao Mestre (só na casa dele ou ao lado). Arrastar item para a hotkey já funcionava (testado no navegador).
- ✅ **Tokens na conta** (novo, 👁): com login no servidor de contas, os tokens importados vão para a conta (rotas `/api/tokens`, limites: 200 por usuário, ~1,5 MB por imagem, só PNG/JPG/WEBP/GIF) e aparecem em qualquer navegador; botão "Enviar N token(s) deste navegador para a conta"; ☁ marca o que já está na conta. Sem login ou sem servidor, continua só no navegador. Testes: `serverIsolation` (isolamento entre contas) e `tokenLibraryAccount`.
- ✅ **Vínculo do token** (novo, 👁): cada token da biblioteca tem um seletor "Vincular" — a uma **ficha (herói)** ou a uma **ameaça do bestiário**. "Adicionar ao mapa" então cria o token já com os dados dela (ficha: reaproveita o token do herói se já estiver no mapa e troca só a imagem; ameaça: PV, defesa, ações, tudo do bestiário) usando a imagem escolhida. O vínculo é gravado na conta (rota `PATCH /api/tokens/:id`) ou no navegador. Verificado ponta a ponta em Chrome headless. **Objeto da cena** (novo, 👁): o seletor tem "Objeto da cena → Item / Baú / Tesouro"; "Adicionar ao mapa" cria esse objeto ao lado do token selecionado (ou no centro), com o nome e a imagem do token. **JSON** (novo, 👁): botão "Ligar a um JSON" no cartão do token — JSON de **herói** (classe, raça, atributos, `personagem`…) entra na lista de fichas; JSON de **ameaça** (nome + PV) entra no catálogo como ameaça própria com ataque; o token passa a apontar para o que foi criado e a imagem vira o retrato. JSON que não é nem uma coisa nem outra é recusado com explicação.

### 3.3b Janela "Novo token" (01/10, 👁)
Botão **+ Novo token**, sempre o primeiro da caixa de tokens, abre a janela (criar) ou o clique no retrato de um token abre a mesma janela (editar). **Imagem sob um círculo fixo**: arrasta-se a imagem para enquadrar a cabeça ou o corpo, com controle de tamanho; escolher arquivo, arrastar arquivo para o círculo ou colar com Ctrl+V; o enquadramento vira uma imagem quadrada de 512 px. Campos: nome, tipo (herói/aliado ou ameaça), vínculo (ficha, ameaça, objeto), **dados da ameaça** (PV, PM, Defesa, tesouro; só aparecem para ameaça) e aura/luz (raio e cor). Botões: Salvar na biblioteca / Salvar e colocar no mapa. Os dados ficam no token da biblioteca (e na conta, com limpeza no servidor) e o token entra no mapa com eles. Origem das funções: `abrirFormToken` do VTT antigo (`Vtt/app.js`), só a organização; a aparência é da Mesa. Não portado do antigo: cor do anel (a Mesa define o anel pelo lado), tamanho em casas, camada, som do token, borda.

### 3.4 Compêndio
- ✅ Busca em magias, poderes e itens (dados do projeto); descrições completas.
- ✅ Botão **Bestiário** → mesma janela do Elenco: 855 ameaças com imagem local, busca por nome/tipo/ND, **Adicionar** ao mapa, e formulário **Nova ameaça** (imagem, importar JSON, nome, tipo e ND, PV/PM/Defesa, Iniciativa/Luta/Pontaria, dano, deslocamento).
- ✅ A janela do Bestiário foi refeita igual ao print do usuário (conferida por captura de tela headless).
- 🟡 Ao adicionar uma ameaça, ela entra numa **posição livre**; falta o usuário escolher o ponto no mapa.

### 3.5 Música (Jukebox)
- ✅ Tocar/Pausar/Parar, **Loop** (rotulado), volume, lista de faixas (YouTube ou arquivo), sincronizado entre todos os jogadores.
- ✅ **Soundboard** (efeitos), busca no **Freesound** (chave do usuário), recolhida.
- ✅ Usuário aprovou ("Música está ok").

### 3.6 Objetos 👑 (ferramentas de mapa)
- ✅ **Terreno** (difícil, bloqueado, cobertura, elevação, com pincel Adicionar/Apagar).
- ✅ **Área** (forma: círculo, retângulo, linha, cone…; dois cliques) e **Objetos** (cria baú no mapa por clique).
- ✅ Lista dos **objetos do andar** (abrir, trancar, configurar).
- ✅ Link **Andares** e **Editor de token** (volta ao Elenco).
- *Saíram daqui hoje, a pedido:* Ping (foi ao cabeçalho), Névoa e Luz (foram ao Ambiente), Parede e Portas (foram ao Ambiente), configuração do tipo de gatilho (foi a Macros).

### 3.6b Mídia na cena (01/10, 👁)
Em **Cenas e mapas → MÍDIA NA CENA** (só Mestre): importar **imagem ou vídeo** (PNG/JPG/WEBP/GIF até 10 MB; MP4/WEBM/OGG até 25 MB), **colar imagem** (botão ou Ctrl+V) e uma biblioteca no navegador do Mestre. **Mostrar** coloca a mídia por cima do mapa **para todos** (vídeo toca com som para todos); só o Mestre tem o **X** (e "Fechar para todos" na gaveta). O Diário registra "Foi mostrado o vídeo “nome”" / "Foi mostrada a imagem “nome”". O arquivo chega aos jogadores em pedaços pela sala, pelo mesmo caminho do áudio do computador (`sharedAudio.ts`, agora aceita imagem e vídeo), e quem entra depois recebe a mídia atual. A mídia não sobrevive a recarregar a página. **Não testado com dois navegadores** (a sala depende do servidor PeerJS externo); testado: estado, Diário, sobreposição como mestre e como jogador. Navegadores podem pedir um clique para liberar o som do vídeo (aparece "Tocar com som").

### 3.7 Diário
- ✅ Registro completo da sessão: chat, rolagens, combate, sistema; sussurros só para remetente/destinatário.
- ✅ Filtros; o Diário registra automaticamente entrada/saída de token e alterações.
- ❌ O usuário queria um desenho específico de Diário com filtros ("precisa do print") — **o print nunca chegou**.

### 3.8 Macros 👑
- ✅ **Macros globais** (nome + fórmula de dados) com rolagem.
- ✅ **Gatilhos**: construtor do tipo (Aplicar condição, Tocar música, Efeito sonoro, Mensagem no chat, Rolar macro), modo **Uma vez / Contínuo**, botão **Marcar gatilho no mapa**.
- 👁 O construtor mudou de lugar hoje (estava em Objetos).
- ❌ Gatilhos não têm lista editável por gatilho (só contagem de gatilhos e áreas).

### 3.9 Ferramenta de mestre 👑
- ✅ **Viagem**: contador de dias; "Testar sorte da viagem" rola d100 contra a chance (5% + 5% por dia sem encontro).
- ✅ **Sala online** (submenu, 👁): criar ou entrar numa sala por código (PeerJS), com botão de volta. Decisão do usuário: fica aqui, não em Configurações. O lobby inicial continua tendo criar/entrar.
- ✅ **Encontro aleatório**: ambiente (11 terrenos + regiões de Arton, 19 tabelas / 529 resultados) × patamar do grupo (Iniciante/Veterano/Campeão/Lenda) → descrição, quantidade rolada (ex.: "1d3 bandidos") → botão **Adicionar** coloca os tokens no mapa; sem criatura, cria token genérico; **Anunciar aos jogadores** manda ao chat. Fonte: `public/EncontrosAleatorios/data.js` (lógica do VTT antigo).

### 3.10 Configurações
- ✅ Modo da mesa: **Minimalista** (dourado e marrom, o padrão) e **Expandido** (interior azul-marinho, título dourado em relevo, orbe do d20 com garras; moldura de lava e dragões ainda por vir). Troca na hora e lembra a escolha.
- ✅ Escala do mapa (liga/desliga; começa desligada).
- ✅ Backup da mesa (baixar o pacote) e configurações de grade. *Restaurar um backup: não confirmei que haja botão.*
- 🔲 Painel **Combate e iniciativa** (rodada, ordem, recursos): existe no código, **sem botão** (o combate usa o painel direito).

### 3.11 Ambiente (botão ☀ do cabeçalho)
Menu com seis seções, cada uma com a sua tela (novo hoje, 👁):

| Seção | O que tem | Estado |
|---|---|---|
| **Clima** | Limpo, Chuva, Neve, Cinzas, Névoa | ✅ (neve e cinzas corrigidos; falta o usuário rever) |
| **Fog** | Cobrir mapa, revelar mapa, **pintar névoa à mão** (Adicionar/Apagar) | ✅ |
| **Luz** | Iluminação da cena (dia, penumbra, noite…); colocar luz no mapa; **configurar cada luz**: nome, alcance (m), potência, cor, acesa, remover | ✅ 🟡 *(presets "fogueira/lanterna/escuridão mágica" do V3 não foram todos restaurados)* |
| **Visão** | Fog dos jogadores ativo, mestre vê a prévia, escuridão só revelada por luzes, explorar ao mover, manter explorado em penumbra, visão própria (casas), opacidade | ✅ |
| **Paredes** | Desenhar paredes no mapa (pincel), lista de paredes com remover | ✅ 🟡 |
| **Portas** | Criar porta, lista com estado (aberta/fechada/trancada), abrir/fechar, trancar/destrancar, configurar (CD, armadilha) | ✅ |
| 🟡 **Paredes automáticas** (novo, 👁) | Em Paredes: "Detectar paredes pela imagem", modo *Áreas escuras viram parede* ou *Contornos fortes*, sensibilidade, limite de 600 segmentos, "Remover as automáticas"; uma única ação no histórico (desfazer volta). **É heurística nossa e fraca em mapas ilustrados**: no mapa "Ponte da Tormenta Rubra" o modo escuro marcou 47 segmentos (blocos escuros, não paredes reais) e o modo contornos não achou nada. Funciona melhor em masmorras de rocha preta; para mapas ilustrados o caminho confiável é o **UVTT**. Testes com imagens sintéticas (`autoWalls.test.ts`). |
| ✅ **Fog automático por paredes** | O fog dos jogadores **já era** calculado pela visão dos heróis com paredes e portas fechadas bloqueando (`game/vision.ts`); faltava só a entrada (as paredes). Na seção Fog agora há o texto do estado (quantas casas os heróis enxergam), o botão **Cobrir o que os heróis não veem** (copia o fog calculado para o fog manual editável) e **Esquecer áreas exploradas**. |

### 3.12 Desfazer e refazer 👑
- ✅ Histórico de edição da cena, desfazer/refazer.

---

## 4. Palco do mapa
- ✅ Mapa 2D e isométrico (`MapStage.tsx`, `IsoStage.tsx`), zoom (+/−/tela cheia). *Atalhos do mouse (botão do meio, Ctrl+roda) vinham da tela antiga; não reconferi nesta tela.*
- ✅ Tokens com PV, condições, aura, ícone de turno; clique seleciona; arrastar move com regras do T20 (diagonal dupla, terreno, ocupação, voo/escavação).
- ✅ **Régua**: clique em A e em B trava a medição; novo clique recomeça; botão direito/Esc limpa; número grande no topo.
- ✅ **Ping** (agora no cabeçalho).
- ✅ Clima animado (chuva, neve, cinzas, névoa).
- 🟡 **Escala do canto inferior esquerdo** não acompanha o zoom; fica **escondida por padrão** (liga em Configurações).
- 🔲 **Arrastar equipamento para o chão** ("cair aos pés do token") foi pedido e **não funcionou**; pendente.

---

## 5. Painel direito — Exploração
- ✅ Retrato, nome, PV/PM.
- ✅ Atributos FOR–CAR; **Perícias** (29 reais do T20, 2 colunas; clicar rola); **Equipamentos/Mochila** (2 colunas); **Magias** — seções recolhíveis por seta.
- ✅ **Hotkeys 1–5** (teclas 1–5 e F1–F5): item **ou** ataque/poder da ficha; arrastar item da mochila para o slot.
- 🟡 Botão "+" de perícias/equipamentos e **escolher quais perícias aparecem** (hoje mostra todas): pendente.
- 🟡 Hotkey que **monta cavalo** / **troca arma** (macros de ficha): decididas, **não feitas**.
- 👁 Conferir na tela do usuário.

## 6. Combate
Entrada pelo botão **Combate** do cabeçalho (transição animada); saída por **Encerrar combate**.

| Área | Funções | Estado |
|---|---|---|
| **Painel do personagem** | PV [n] Dano/Cura e PM [n] Gastar/Recuperar (aplica ao token em foco, só mestre ou dono, vai ao Diário); testes REF/FORT/VON | ✅ 👁 |
| **Abas**: Ações · Ficha · Inventário · Poderes | Ações: Mover, Agir, Magia, Itens, Condição, Esperar; Poderes: ativos e passivos separados (regra `isActivePower`), com Requisito/Fonte/Descrição do Compêndio; Ficha e Inventário: resumo + botão para a ficha completa | ✅ 👁 |
| **Marcar** o que aparece em Ações/Itens/Poderes | Caixas de marcar na ficha alimentam a aba Itens e as hotkeys | 🟡 (só marcas; configuração completa de ficha/inventário no combate ainda não) |
| **Ordem de iniciativa** | Número que cada um tirou à esquerda; **mestre edita clicando** (reordena) | ✅ |
| **Mesa de Rolagens** | Cartão fixo (atalho ao Diário + último acontecimento), cartões descritivos ("Teste de perícia: Acrobacia", "Atacou com …"), **fixar ao clicar** | ✅ |
| **Motor** | Alcance e linha de efeito, confirmação, **reação com prompt**, conjuração com aprimoramentos, magia racial, círculo por classe, RD por tipo, efeitos por rodada (terminam no turno do conjurador), condições com efeito mecânico, **IA** dos monstros, montaria, aura, espólio ao derrotar | ✅ (testes de motor); 🟡 só 25 magias estão "curadas" com efeito automático |
| Poderes de classe/raça e as **outras magias** | Efeito automático, tipo de dano estruturado, duração rolada | ❌ pendente (24 magias sem teste) |

## 7. Mesa de dados (botão d20)
- ✅ D3, D4, D6, D8, D10, D12, D20, D% (cada um com forma própria), modificador livre (+44), histórico com data e hora, d20 girando.

## 8. Multijogador
- ✅ Criar sala / entrar por código (lobby), reentrada, **o Mestre é a autoridade**, cada jogador recebe só o recorte que vê (fog, ocultos).
- ✅ Comandos do jogador (mover, agir, abrir baú…) passam pelo Mestre; permissões por token (`Controle`).
- ✅ Música, efeitos, ping e desenho sincronizados.
- ✅ Validado **à mão** com dois navegadores. ❌ **Não há teste automático de rede** (a suíte e2e antiga está quebrada; ver §11).
- ✅ Sala online dentro da Ferramenta de mestre (ver §3.9).

## 9. Portal (site) — não modificar
Telas (arquivos em `src/portal/components/views/`): Home, **Campanhas**, **Lista de personagens**, Ficha / **Oficina de Heróis**, **Compêndio**, **Homebrew**, **Livros públicos**, **Mesa online** (lista de mesas).
- ✅ Importação de herói por **PDF** (Modelo de Heróis completo), **JSON** e **JSON do VTT** — corrigida e testada com 3 PDFs reais.
- 🟡 Não lê: retrato do PDF e PDFs de outros modelos (só texto corrido).
- ✅ Itens do Portal dentro da Mesa **redirecionam** para a rota oficial (`openPortalRoute`).
- 🟡 Pendência de layout do **lobby**: o usuário decidiu que o lobby da Mesa vira a página "T20 Online" do Portal e que "Abrir mesa online" numa campanha abre direto a sala — **não confirmei se foi feito; conferir**.

## 10. Servidor de contas (`server/`, porta 4000, opcional)
Rotas existentes: cadastro/login/logout/"eu", **campanhas** (CRUD + compartilhar/descompartilhar), **personagens** (listar/salvar/apagar), **mesas** (criar/listar/código/atualizar/apagar/avaliar), **livros** (públicos e meus).
- ✅ **Tokens por usuário** (ver §3.3).
- 🟡 Supabase: só esquema e cliente; nenhuma tela usa.
- ⚠️ Dados em `server/data` (fazer cópia; **não publicar `secret.key`**).

---

## 11. Funções que existem mas **não têm botão/lugar** (🔲) — o ponto principal para o pesquisador
2. **Combate e iniciativa** como gaveta (rodada, recursos) — hoje só o painel direito.
3. **Arrastar equipamento ao mapa** (cair aos pés do token).
4. **Escolher o ponto de colocação** de ameaças/itens (hoje: posição livre automática).
5. **Lista editável de gatilhos** (só contador).
6. (feito, ver §3.11) paredes e fog automáticos; a qualidade da detecção em mapas ilustrados é o ponto fraco.
7. **Modo Expandido** da mesa (botão existe, desativado).
8. (feito) vínculo token ↔ ficha, ameaça, objeto da cena e JSON.
9. **Importar campanha/one-shot inteiro** do Foundry/VTT (mapas, tokens, paredes, diário): hoje só vira um rótulo; personagens e nomes de NPC entram, cenas não.
10. Ferramentas soltas em `public/` (calculadora de ND, forja, grimório, gerador…): **não verifiquei se há links para elas** no Portal ou na Mesa.

## 12. Pendências por prioridade
**Alta (o usuário pediu e ainda falta):** escala do mapa ligada ao zoom · configurar ficha/inventário no combate · "+" e escolha de perícias · hotkeys de macro (montar cavalo/trocar arma) · soltar item aos pés do token · Diário com filtros (aguarda print) · investigar "rodando por cima" em Cenas e mapas · conferir na tela do usuário tudo o que foi alterado hoje.
**Média:** melhorar a detecção de paredes em mapas ilustrados · presets de luz do V3 · Bestiário com escolha do ponto no mapa · lobby = página "T20 Online" · importar campanha inteira.
**Baixa / depois do visual:** modo Expandido · **refazer a suíte e2e** (os 7 testes antigos falham por seletores da tela antiga; decisão do usuário: refazer depois de o visual e as funções estarem prontos) · poderes/magias fora das 25 curadas · matriz das 72 seções do contrato · `docs/ENTREGA_CONFERENCIA.md`.

## 13. Perguntas abertas para decidir com o pesquisador
1. Onde ficam **Aura/luz do token** e **Controle do token** em definitivo (Elenco, clique direito no token, ou aba Luz do Ambiente)?
2. O **lobby** deve virar a página "T20 Online" do Portal? Em qual card entra "Mesa online"?
3. (decidido) Sala online: submenu da Ferramenta de mestre.
4. Cena → mapas: cada cena deve ter **estado compartilhado** (fog, luzes) ou cada mapa é independente (hoje é independente)?
5. A detecção de paredes por imagem é fraca em mapas ilustrados: vale investir em algo melhor (visão computacional/IA) ou manter UVTT + desenho à mão?
6. As ferramentas soltas do site (calculadora, forja, grimório) entram na Mesa ou ficam só no Portal?

## 14. Dependências externas em execução
PeerJS (`0.peerjs.com`), YouTube (iframe API), Freesound (chave do usuário). Fontes e pdf.js já são locais.

## 15. Onde está cada coisa (para quem for ler o código)
| Assunto | Arquivo |
|---|---|
| Estado único e comandos | `src/game/vttBridge.ts` |
| Tela V5 (máscara, travada visualmente) | `src/components/mesaSkin/**`, `src/index.css`, `src/mesa-theme.css` |
| Barra esquerda, cabeçalho | `mesaSkin/data.ts` (botões), `mesaSkin/components/Chrome.tsx` |
| Painéis direitos | `mesaSkin/components/Panels.tsx`, `MesaSkinTable.tsx` |
| Gavetas (tudo em §3) | `src/components/mesa/MesaGlobalPanel.tsx` |
| Ligação botão → ação | `src/App.tsx` (`handleSkinAction`) |
| Dados da tela | `src/components/mesa/skinRuntime.ts` |
| Mapa | `components/mesa/MapStage.tsx`, `IsoStage.tsx` |
| Bestiário / janela de personagens | `src/components/Libraries.tsx`, `tactics/CustomThreatForm.tsx` |
| Motor tático | `src/tactics/engine/*`, `src/tactics/interpretation/*` |
| Regras puras (baú, montaria, movimento, gatilhos, espólio, encontros, viagem) | `src/game/*` |
| Rede | `src/game/multiplayer.ts` |
| Servidor de contas | `server/` |
| Trava visual | `scripts/check-visual-lock.mjs`, `scripts/visual-lock.manifest.json` |
| Decisões e auditorias | `docs/MATRIZ_ORIGEM_NOVA_FUSAO.md`, `docs/AUDITORIA_TATICA_MODERNRPG.md`, `docs/TRAVA_CRITICA_VISUAL.md` |

## 16. Como rodar
`docs/EXECUCAO.md`. Testes: `npm run test:unit`; tipos: `npm run typecheck`; visual: `npm run check:visual-lock`; build: `npm run build`. A suíte `serverIsolation` às vezes falha quando rodada em paralelo com as outras e passa sozinha.
