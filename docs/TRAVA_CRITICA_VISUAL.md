# TRAVA CRÍTICA — VISUAL DA MESA ONLINE

## Ordem de precedência

A máscara visual final fornecida pelo usuário é um artefato congelado. Esta regra tem precedência sobre conveniência de implementação, refatoração, melhorias de UX e novas funções.

**Não mudar o visual significa não mudar:**

- estrutura/markup da máscara;
- CSS, layout, composição, posição, tamanho, tipografia, cor, ícone ou imagem;
- hover, foco, seleção, ativo, destaque e demais estados puramente visuais;
- barras, colunas, rails, cards, modais e botões-base;
- a mini-coluna **Grupo**.

Se uma função não couber em um controle ou submenu contextual já permitido, seu status é **PENDENTE**. Não se cria um novo botão para "resolver" a ausência de entrada.

## Arquivos imutáveis da máscara

O manifesto `scripts/visual-lock.manifest.json` protege por SHA-256:

- todo o diretório `src/components/mesaSkin/`, inclusive imagens fornecidas;
- `src/mesa-theme.css`;
- `src/index.css`.

A verificação também falha caso qualquer arquivo seja adicionado ou removido do diretório da máscara.

## Verificação obrigatória

Execute antes de validar, commitar ou enviar alterações:

```bash
npm run check:visual-lock
npm run test:unit
npm run build
```

`test:unit` e `build` já chamam `check:visual-lock` automaticamente. Portanto uma alteração no visual bloqueado interrompe os dois fluxos.

## Única exceção

Somente uma instrução explícita do usuário para substituir o baseline visual pode autorizar a atualização do manifesto. A atualização exige registrar o novo arquivo-fonte, checksum e justificativa de equivalência/alteração aprovada antes de alterar `visual-lock.manifest.json`.

A ligação de uma função existente pode alterar apenas código de motor, handlers e dados fora da máscara. Uma gaveta/submenu já autorizado pode trocar seu **conteúdo contextual** sem mexer no layout, estilos ou composição da máscara fechada.
