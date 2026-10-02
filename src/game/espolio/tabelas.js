/* =========================================================
   ESPÓLIO — TABELAS REAIS DE TESOURO DO TORMENTA20
   Gerado a partir de public/espolio/data.js, data_itens.js e sub_tabelas.js
   (planilha oficial "T20 - Tabela de geração de tesouros"), na mesma ordem em
   que a página do Espólio os carrega. O conteúdo das tabelas e das funções
   getXxx() é o original; só foram acrescentados este cabeçalho e o `export`
   final. `registrarRolagem` (que no original grava o histórico da página)
   aqui repassa a um gravador opcional.
   ========================================================= */
let __gravador = null;
export function setRollRecorder(fn) { __gravador = fn; }
function registrarRolagem(rotulo, valor, ajustado) { if (__gravador) __gravador(rotulo, valor, ajustado); }

// ===== data.js (copiado de public/espolio/data.js, sem alteração) =====
/* =========================================================
   ESPÓLIO — DADOS DAS TABELAS DE TESOURO (TORMENTA20)
   =========================================================
   Fonte: T20 - Tabela de geração de tesouros (planilha oficial)
   e regras de Buscas (Livro Básico, Cap. 6).

   TESOURO_ND
   Cada entrada representa uma linha da tabela "Tesouro por ND".
   - nd: Nível de Desafio ("1/4", "1/2", "1".."20")
   - dinheiro: lista de [faixa d%, resultado]
   - itens: lista de [faixa d%, resultado]

   Sufixos usados nos resultados (mantidos como no livro):
   - "+%"  -> na rolagem de d% para o tipo de riqueza/poção, +20%
   - "2D"  -> na rolagem do tipo de equipamento/item mágico, role 2d6 e escolha um
   ========================================================= */

var TESOURO_ND = [
  {
    "nd": "1/4",
    "dinheiro": [
      [
        "01-30",
        "—"
      ],
      [
        "31-70",
        "1d6x10 TC"
      ],
      [
        "71-95",
        "1d4x100 TC"
      ],
      [
        "96-100",
        "1d6x10 T$"
      ]
    ],
    "itens": [
      [
        "01-50",
        "—"
      ],
      [
        "51-75",
        "Item diverso"
      ],
      [
        "76-100",
        "Equipamento"
      ]
    ]
  },
  {
    "nd": "1/2",
    "dinheiro": [
      [
        "01-25",
        "—"
      ],
      [
        "26-70",
        "2d6x10 TC"
      ],
      [
        "71-95",
        "2d8x10 T$"
      ],
      [
        "96-100",
        "1d4x100 T$"
      ]
    ],
    "itens": [
      [
        "01-45",
        "—"
      ],
      [
        "46-70",
        "Item diverso"
      ],
      [
        "71-100",
        "Equipamento"
      ]
    ]
  },
  {
    "nd": "1",
    "dinheiro": [
      [
        "01-20",
        "—"
      ],
      [
        "21-70",
        "3d8x10 T$"
      ],
      [
        "71-95",
        "4d12x10 T$"
      ],
      [
        "96-100",
        "1 riqueza menor"
      ]
    ],
    "itens": [
      [
        "01-40",
        "—"
      ],
      [
        "41-65",
        "Item diverso"
      ],
      [
        "66-90",
        "Equipamento"
      ],
      [
        "91-100",
        "1 poção"
      ]
    ]
  },
  {
    "nd": "2",
    "dinheiro": [
      [
        "01-15",
        "—"
      ],
      [
        "16-55",
        "3d10x10 T$"
      ],
      [
        "56-85",
        "2d4x100 T$"
      ],
      [
        "86-95",
        "2d6+1x100 T$"
      ],
      [
        "96-100",
        "1 riqueza menor"
      ]
    ],
    "itens": [
      [
        "01-30",
        "—"
      ],
      [
        "31-40",
        "Item diverso"
      ],
      [
        "41-70",
        "Equipamento"
      ],
      [
        "71-90",
        "1 poção"
      ],
      [
        "91-100",
        "Superior (1 melhoria)"
      ]
    ]
  },
  {
    "nd": "3",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-20",
        "4d12x10 T$"
      ],
      [
        "21-60",
        "1d4x100 T$"
      ],
      [
        "61-90",
        "1d8x10 TO"
      ],
      [
        "91-100",
        "1d3 riquezas menores"
      ]
    ],
    "itens": [
      [
        "01-25",
        "—"
      ],
      [
        "26-35",
        "Item diverso"
      ],
      [
        "36-60",
        "Equipamento"
      ],
      [
        "61-85",
        "1 poção"
      ],
      [
        "86-100",
        "Superior (1 melhoria)"
      ]
    ]
  },
  {
    "nd": "4",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-50",
        "1d6x100 T$"
      ],
      [
        "51-80",
        "1d12x100 T$"
      ],
      [
        "81-90",
        "1 riqueza menor +%"
      ],
      [
        "91-100",
        "1d3 riquezas menores +%"
      ]
    ],
    "itens": [
      [
        "01-20",
        "—"
      ],
      [
        "21-30",
        "Item diverso"
      ],
      [
        "31-55",
        "Equipamento 2D"
      ],
      [
        "56-80",
        "1 poção +%"
      ],
      [
        "81-100",
        "Superior (1 melhoria) 2D"
      ]
    ]
  },
  {
    "nd": "5",
    "dinheiro": [
      [
        "01-15",
        "—"
      ],
      [
        "16-65",
        "1d8x100 T$"
      ],
      [
        "66-95",
        "3d4x10 TO"
      ],
      [
        "96-100",
        "1 riqueza média"
      ]
    ],
    "itens": [
      [
        "01-20",
        "—"
      ],
      [
        "21-70",
        "1 poção"
      ],
      [
        "71-90",
        "Superior (1 melhoria)"
      ],
      [
        "91-100",
        "Superior (2 melhorias)"
      ]
    ]
  },
  {
    "nd": "6",
    "dinheiro": [
      [
        "01-15",
        "—"
      ],
      [
        "16-60",
        "2d6x100 T$"
      ],
      [
        "61-90",
        "2d10x100 T$"
      ],
      [
        "91-100",
        "1d3+1 riquezas menores"
      ]
    ],
    "itens": [
      [
        "01-20",
        "—"
      ],
      [
        "21-65",
        "1 poção +%"
      ],
      [
        "66-95",
        "Superior (1 melhoria)"
      ],
      [
        "96-100",
        "Superior (2 melhorias) 2D"
      ]
    ]
  },
  {
    "nd": "7",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-60",
        "2d8x100 T$"
      ],
      [
        "61-90",
        "2d12x10 TO"
      ],
      [
        "91-100",
        "1d4+1 riquezas menores"
      ]
    ],
    "itens": [
      [
        "01-20",
        "—"
      ],
      [
        "21-60",
        "1d3 poções"
      ],
      [
        "61-90",
        "Superior (2 melhorias)"
      ],
      [
        "91-100",
        "Superior (3 melhorias)"
      ]
    ]
  },
  {
    "nd": "8",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-55",
        "2d10x100 T$"
      ],
      [
        "56-95",
        "1d4+1 riquezas menores"
      ],
      [
        "96-100",
        "1 riqueza média+%"
      ]
    ],
    "itens": [
      [
        "01-20",
        "—"
      ],
      [
        "21-75",
        "1d3 poções"
      ],
      [
        "76-95",
        "Superior (2 melhorias)"
      ],
      [
        "96-100",
        "Superior (3 melhorias) 2D"
      ]
    ]
  },
  {
    "nd": "9",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-35",
        "1 riqueza média"
      ],
      [
        "36-85",
        "4d6x100 T$"
      ],
      [
        "86-100",
        "1d3 riquezas médias"
      ]
    ],
    "itens": [
      [
        "01-20",
        "—"
      ],
      [
        "21-70",
        "1 poção +%"
      ],
      [
        "71-95",
        "Superior (3 melhorias)"
      ],
      [
        "96-100",
        "Mágico (menor)"
      ]
    ]
  },
  {
    "nd": "10",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-30",
        "4d6x100 T$"
      ],
      [
        "31-85",
        "4d10x10 TO"
      ],
      [
        "86-100",
        "1d3+1 riquezas médias"
      ]
    ],
    "itens": [
      [
        "01-50",
        "—"
      ],
      [
        "51-75",
        "1d3+1 poções"
      ],
      [
        "76-90",
        "Superior (3 melhorias)"
      ],
      [
        "91-100",
        "Mágico (menor)"
      ]
    ]
  },
  {
    "nd": "11",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-45",
        "2d4x1.000 T$"
      ],
      [
        "46-85",
        "1d3 riquezas médias"
      ],
      [
        "86-100",
        "2d6x100 TO"
      ]
    ],
    "itens": [
      [
        "01-45",
        "—"
      ],
      [
        "46-70",
        "1d4+1 poções"
      ],
      [
        "71-90",
        "Superior (3 melhorias)"
      ],
      [
        "91-100",
        "Mágico (menor) 2D"
      ]
    ]
  },
  {
    "nd": "12",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-45",
        "1 riqueza média +%"
      ],
      [
        "46-80",
        "2d6x1.000 T$"
      ],
      [
        "81-100",
        "1d4+1 riquezas médias"
      ]
    ],
    "itens": [
      [
        "01-45",
        "—"
      ],
      [
        "46-70",
        "1d3+1 poções +%"
      ],
      [
        "71-85",
        "Superior (4 melhorias)"
      ],
      [
        "86-100",
        "Mágico (menor)"
      ]
    ]
  },
  {
    "nd": "13",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-45",
        "4d4x1.000 T$"
      ],
      [
        "46-80",
        "1d3+1 riquezas médias"
      ],
      [
        "81-100",
        "4d6x100 TO"
      ]
    ],
    "itens": [
      [
        "01-40",
        "—"
      ],
      [
        "41-65",
        "1d4+1 poções +%"
      ],
      [
        "66-95",
        "Superior (4 melhorias)"
      ],
      [
        "96-100",
        "Mágico (médio)"
      ]
    ]
  },
  {
    "nd": "14",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-45",
        "1d3+1 riquezas médias"
      ],
      [
        "46-80",
        "3d6x1.000 T$"
      ],
      [
        "81-100",
        "1 riqueza maior"
      ]
    ],
    "itens": [
      [
        "01-40",
        "—"
      ],
      [
        "41-65",
        "1d4+1 poções +%"
      ],
      [
        "66-90",
        "Superior (4 melhorias)"
      ],
      [
        "91-100",
        "Mágico (médio)"
      ]
    ]
  },
  {
    "nd": "15",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-45",
        "1 riqueza média+%"
      ],
      [
        "46-80",
        "2d10x1.000 T$"
      ],
      [
        "81-100",
        "1d4x1.000 TO"
      ]
    ],
    "itens": [
      [
        "01-35",
        "—"
      ],
      [
        "36-45",
        "1d6+1 poções"
      ],
      [
        "46-85",
        "Superior (4 melhorias) 2D"
      ],
      [
        "86-100",
        "Mágico (médio)"
      ]
    ]
  },
  {
    "nd": "16",
    "dinheiro": [
      [
        "01-10",
        "—"
      ],
      [
        "11-40",
        "3d6x1.000 T$"
      ],
      [
        "41-75",
        "3d10x100 TO"
      ],
      [
        "76-100",
        "1d3 riquezas maiores"
      ]
    ],
    "itens": [
      [
        "01-35",
        "—"
      ],
      [
        "36-45",
        "1d6+1 poções +%"
      ],
      [
        "46-80",
        "Superior (4 melhorias) 2D"
      ],
      [
        "81-100",
        "Mágico (médio)"
      ]
    ]
  },
  {
    "nd": "17",
    "dinheiro": [
      [
        "01-05",
        "—"
      ],
      [
        "06-40",
        "4d6x1.000 T$"
      ],
      [
        "41-75",
        "1d3 riquezas médias +%"
      ],
      [
        "76-100",
        "2d4x1.000 TO"
      ]
    ],
    "itens": [
      [
        "01-20",
        "—"
      ],
      [
        "21-40",
        "Mágico (menor)"
      ],
      [
        "41-80",
        "Mágico (médio)"
      ],
      [
        "81-100",
        "Mágico (maior)"
      ]
    ]
  },
  {
    "nd": "18",
    "dinheiro": [
      [
        "01-05",
        "—"
      ],
      [
        "06-40",
        "4d10x1.000 T$"
      ],
      [
        "41-75",
        "1 riqueza maior"
      ],
      [
        "76-100",
        "1d3+1 riquezas maiores"
      ]
    ],
    "itens": [
      [
        "01-15",
        "—"
      ],
      [
        "16-40",
        "Mágico (menor) 2D"
      ],
      [
        "41-70",
        "Mágico (médio)"
      ],
      [
        "71-100",
        "Mágico (maior)"
      ]
    ]
  },
  {
    "nd": "19",
    "dinheiro": [
      [
        "01-05",
        "—"
      ],
      [
        "06-40",
        "4d12x1.000 T$"
      ],
      [
        "41-75",
        "1 riqueza maior +%"
      ],
      [
        "76-100",
        "1d12x1.000 TO"
      ]
    ],
    "itens": [
      [
        "01-10",
        "—"
      ],
      [
        "11-40",
        "Mágico (menor) 2D"
      ],
      [
        "41-60",
        "Mágico (médio) 2D"
      ],
      [
        "61-100",
        "Mágico (maior)"
      ]
    ]
  },
  {
    "nd": "20",
    "dinheiro": [
      [
        "01-05",
        "—"
      ],
      [
        "06-40",
        "2d4x1.000 TO"
      ],
      [
        "41-75",
        "1d3 riquezas maiores"
      ],
      [
        "76-100",
        "1d3+1 riquezas maiores +%"
      ]
    ],
    "itens": [
      [
        "01-05",
        "—"
      ],
      [
        "06-40",
        "Mágico (menor) 2D"
      ],
      [
        "41-50",
        "Mágico (médio) 2D"
      ],
      [
        "51-100",
        "Mágico (maior) 2D"
      ]
    ]
  }
];


/* =========================================================
   BUSCAS (Livro Básico, Cap. 6 — Buscas)
   ========================================================= */

// Tabela 6-6: Desafios de Buscas (2d12 -> perícia sorteada + exemplo)
var BUSCA_DESAFIOS = {
  2:  { pericia: 'Misticismo',    exemplo: 'Decifrar uma runa' },
  3:  { pericia: 'Adestramento',  exemplo: 'Acalmar uma fera' },
  4:  { pericia: 'Conhecimento',  exemplo: 'Traduzir um texto antigo' },
  5:  { pericia: 'Enganação',     exemplo: 'Participar de uma intriga' },
  6:  { pericia: 'Cura',          exemplo: 'Tratar um veneno' },
  7:  { pericia: 'Iniciativa',    exemplo: 'Perseguir um bandido' },
  8:  { pericia: 'Intimidação',   exemplo: 'Negociar com um criminoso' },
  9:  { pericia: 'Investigação',  exemplo: 'Descobrir uma localização' },
  10: { pericia: 'Reflexos',      exemplo: 'Evitar um desmoronamento' },
  11: { pericia: 'Atletismo',     exemplo: 'Escalar um penhasco' },
  12: { pericia: 'Percepção',     exemplo: 'Evitar uma emboscada' },
  13: { pericia: 'Sobrevivência', exemplo: 'Atravessar os ermos' },
  14: { pericia: 'Fortitude',     exemplo: 'Tolerar clima ruim' },
  15: { pericia: 'Diplomacia',    exemplo: 'Negociar com um mercador' },
  16: { pericia: 'Furtividade',   exemplo: 'Infiltrar-se num lugar' },
  17: { pericia: 'Acrobacia',     exemplo: 'Atravessar uma ravina' },
  18: { pericia: 'Intuição',      exemplo: 'Elucidar um enigma' },
  19: { pericia: 'Vontade',       exemplo: 'Resistir a uma maldição' },
  20: { pericia: 'Luta',          exemplo: 'Defender-se de um monstro' },
  21: { pericia: 'Jogatina',      exemplo: 'Apostar com as fadas' },
  22: { pericia: 'Nobreza',       exemplo: 'Participar de um baile' },
  23: { pericia: 'Religião',      exemplo: 'Entender um presságio' },
  24: { pericia: 'Guerra',        exemplo: 'Atravessar um campo de batalha' }
};

// Tabela 6-7: Consequências de Buscas (sucessos -> castigos/recompensas)
var BUSCA_CONSEQUENCIAS = {
  0: { rotulo: '0 sucessos', castigos: 1, recompensas: 0 },
  1: { rotulo: '1 sucesso',  castigos: 0, recompensas: 0 },
  2: { rotulo: '2 sucessos', castigos: 0, recompensas: 1 },
  3: { rotulo: '3 sucessos', castigos: 0, recompensas: 2 }
};

// Tabela Recompensas & Castigos (1d6)
var BUSCA_TABELA_1D6 = [
  { // 1
    recompensa: { nome: 'Tesouro (riqueza)', desc: 'Você ganha uma riqueza, de acordo com seu nível.', tesouro: 'riqueza' },
    castigo:    { nome: 'Ruína (menor)', desc: 'Perde um quarto do dinheiro inicial do seu nível, em dinheiro ou itens (ou sofre Abalo, se não puder pagar).' }
  },
  { // 2
    recompensa: { nome: 'Favor', desc: 'Um NPC ou organização te deve um favor (ou a promessa de um), que o ajuda por uma cena.' },
    castigo:    { nome: 'Abalo', desc: 'Sua confiança é abalada: pontos de mana máximos −1 por nível de personagem na próxima aventura.' }
  },
  { // 3
    recompensa: { nome: 'Tesouro (item)', desc: 'Você ganha um item, de acordo com seu nível.', tesouro: 'item' },
    castigo:    { nome: 'Complicação', desc: 'Você sofre uma complicação que o afetará em algum momento futuro, a critério do mestre.' }
  },
  { // 4
    recompensa: { nome: 'Informação', desc: 'Você descobre uma informação valiosa relacionada à busca.' },
    castigo:    { nome: 'Ferimento', desc: 'Ferimento severo: pontos de vida máximos −1 por nível de personagem na próxima aventura. Cura não remove este efeito.' }
  },
  { // 5
    recompensa: { nome: 'Tesouro (ambos)', desc: 'Você ganha riqueza e item, de acordo com seu nível.', tesouro: 'ambos' },
    castigo:    { nome: 'Maldição', desc: 'Você sofre o efeito da magia Rogar Maldição na próxima aventura.' }
  },
  { // 6
    recompensa: { nome: 'Poder', desc: 'Você recebe um benefício de treinamento, definido aleatoriamente.' },
    castigo:    { nome: 'Ruína (maior)', desc: 'Perde metade do dinheiro inicial do seu nível, em dinheiro ou itens (ou sofre Abalo, se não puder pagar).' }
  }
];


// ===== data_itens.js (copiado de public/espolio/data_itens.js, sem alteração) =====
/* =========================================================
   ESPÓLIO — SUB-TABELAS DE ITENS (TORMENTA20)
   Geradas de: T20 - Tabela de geração de tesouros.xlsx
   ========================================================= */

/* ===== ITENS DIVERSOS ===== */
var ITENS_DIVERSOS = [
  { b: "01", n: "Ácido", l: "Tormenta20", p: 160 },
  { b: "02", n: "Água benta", l: "Tormenta20", p: 155 },
  { b: "03", n: "Alaúde élfico", l: "Tormenta20", p: 158 },
  { b: "04", n: "Algemas", l: "Tormenta20", p: 155 },
  { b: "05", n: "Baga-de-fogo", l: "Tormenta20", p: 160 },
  { b: "06-08", n: "Bálsamo restaurador", l: "Tormenta20", p: 160 },
  { b: "09", n: "Bandana", l: "Tormenta20", p: 159 },
  { b: "10", n: "Bandoleira de poções", l: "Tormenta20", p: 155 },
  { b: "11", n: "Bomba", l: "Tormenta20", p: 160 },
  { b: "12", n: "Botas reforçadas", l: "Tormenta20", p: 159 },
  { b: "13", n: "Camisa bufante", l: "Tormenta20", p: 159 },
  { b: "14", n: "Capa esvoaçante", l: "Tormenta20", p: 159 },
  { b: "15", n: "Capa pesada", l: "Tormenta20", p: 159 },
  { b: "16", n: "Casaco longo", l: "Tormenta20", p: 159 },
  { b: "17", n: "Chapéu arcano", l: "Tormenta20", p: 159 },
  { b: "18", n: "Coleção de livros", l: "Tormenta20", p: 158 },
  { b: "19", n: "Cosmético", l: "Tormenta20", p: 160 },
  { b: "20", n: "Dente-de-dragão", l: "Tormenta20", p: 161 },
  { b: "21", n: "Enfeite de elmo", l: "Tormenta20", p: 159 },
  { b: "22", n: "Elixir do amor", l: "Tormenta20", p: 160 },
  { b: "23", n: "Equipamento de viagem", l: "Tormenta20", p: 155 },
  { b: "24-26", n: "Essência de mana", l: "Tormenta20", p: 160 },
  { b: "27", n: "Estojo de disfarces", l: "Tormenta20", p: 158 },
  { b: "28", n: "Farrapos de ermitão", l: "Tormenta20", p: 159 },
  { b: "29", n: "Flauta mística", l: "Tormenta20", p: 158 },
  { b: "30", n: "Fogo alquímico", l: "Tormenta20", p: 160 },
  { b: "31", n: "Gorro de ervas", l: "Tormenta20", p: 159 },
  { b: "32", n: "Líquen lilás", l: "Tormenta20", p: 161 },
  { b: "33", n: "Luneta", l: "Tormenta20", p: 158 },
  { b: "34", n: "Luva de pelica", l: "Tormenta20", p: 159 },
  { b: "35", n: "Maleta de medicamentos", l: "Tormenta20", p: 158 },
  { b: "36", n: "Manopla", l: "Tormenta20", p: 159 },
  { b: "37", n: "Manto eclesiástico", l: "Tormenta20", p: 159 },
  { b: "38", n: "Mochila de aventureiro", l: "Tormenta20", p: 155 },
  { b: "39", n: "Musgo púrpura", l: "Tormenta20", p: 161 },
  { b: "40", n: "Organizador de pergaminhos", l: "Tormenta20", p: 155 },
  { b: "41", n: "Ossos de monstro", l: "Tormenta20", p: 161 },
  { b: "42", n: "Pó de cristal", l: "Tormenta20", p: 161 },
  { b: "43", n: "Pó de giz", l: "Tormenta20", p: 161 },
  { b: "44", n: "Pó do desaparecimento", l: "Tormenta20", p: 160 },
  { b: "45", n: "Robe místico", l: "Tormenta20", p: 159 },
  { b: "46", n: "Saco de sal", l: "Tormenta20", p: 161 },
  { b: "47", n: "Sapatos de camurça", l: "Tormenta20", p: 159 },
  { b: "48", n: "Seixo de âmbar", l: "Tormenta20", p: 161 },
  { b: "49", n: "Sela", l: "Tormenta20", p: 158 },
  { b: "50", n: "Tabardo", l: "Tormenta20", p: 159 },
  { b: "51", n: "Traje da corte", l: "Tormenta20", p: 159 },
  { b: "52", n: "Terra de cemitério", l: "Tormenta20", p: 161 },
  { b: "53", n: "Veste de seda", l: "Tormenta20", p: 159 },
  { b: "54", n: "Corda de teia", l: "Ameaças de Arton", p: 396 },
  { b: "55", n: "Dente de wisphago", l: "Ameaças de Arton", p: 396 },
  { b: "56", n: "Bomba de fumaça", l: "Ameaças de Arton", p: 396 },
  { b: "57", n: "Elixir quimérico", l: "Ameaças de Arton", p: 396 },
  { b: "58", n: "Éter elemental", l: "Ameaças de Arton", p: 396 },
  { b: "59", n: "Óleo de besouro", l: "Ameaças de Arton", p: 397 },
  { b: "60", n: "Água benta concentrada", l: "Deuses de Arton", p: 48 },
  { b: "61", n: "Aspersório", l: "Deuses de Arton", p: 48 },
  { b: "62", n: "Patuá", l: "Deuses de Arton", p: 49 },
  { b: "63", n: "Panfleto de aforismos", l: "Deuses de Arton", p: 49 },
  { b: "64", n: "Texto sagrado", l: "Deuses de Arton", p: 49 },
  { b: "65", n: "Hábito sacerdotal", l: "Deuses de Arton", p: 49 },
  { b: "66", n: "Manto de alto sacerdote", l: "Deuses de Arton", p: 49 },
  { b: "67", n: "Sandálias", l: "Deuses de Arton", p: 51 },
  { b: "68", n: "Piercing de umbigo", l: "Deuses de Arton", p: 51 },
  { b: "69", n: "Incenso", l: "Deuses de Arton", p: 52 },
  { b: "70", n: "Santa granada de mão", l: "Deuses de Arton", p: 52 },
  { b: "71", n: "Fitilho consagrado", l: "Deuses de Arton", p: 52 },
  { b: "72", n: "Pena de anjo", l: "Deuses de Arton", p: 52 },
  { b: "73", n: "Ábaco", l: "Heróis de Arton", p: 227 },
  { b: "74", n: "Ampulheta", l: "Heróis de Arton", p: 227 },
  { b: "75", n: "Astrolábio", l: "Heróis de Arton", p: 227 },
  { b: "76", n: "Bainha adornada", l: "Heróis de Arton", p: 227 },
  { b: "77", n: "Bússola", l: "Heróis de Arton", p: 227 },
  { b: "78", n: "Diagrama anatômico", l: "Heróis de Arton", p: 230 },
  { b: "79", n: "Estrepes", l: "Heróis de Arton", p: 230 },
  { b: "80", n: "Lampião de foco", l: "Heróis de Arton", p: 230 },
  { b: "81", n: "Leque", l: "Heróis de Arton", p: 230 },
  { b: "82", n: "Lupa", l: "Heróis de Arton", p: 230 },
  { b: "83", n: "Mapa (mestre define de qual região)", l: "Heróis de Arton", p: 230 },
  { b: "84", n: "Mecanismo de mola", l: "Heróis de Arton", p: 230 },
  { b: "85", n: "Mochila discreta", l: "Heróis de Arton", p: 230 },
  { b: "86", n: "Sinete", l: "Heróis de Arton", p: 231 },
  { b: "87", n: "Apito de caça", l: "Heróis de Arton", p: 231 },
  { b: "88", n: "Baralho marcado", l: "Heróis de Arton", p: 231 },
  { b: "89", n: "Clarim deheoni", l: "Heróis de Arton", p: 231 },
  { b: "90", n: "Pandeiro das estradas", l: "Heróis de Arton", p: 231 },
  { b: "91", n: "Camisolão", l: "Heróis de Arton", p: 232 },
  { b: "92", n: "Casaca de apetrechos", l: "Heróis de Arton", p: 232 },
  { b: "93", n: "Chapéu emplumado", l: "Heróis de Arton", p: 232 },
  { b: "94", n: "Elmo leve", l: "Heróis de Arton", p: 232 },
  { b: "95", n: "Elmo pesado", l: "Heróis de Arton", p: 232 },
  { b: "96", n: "Rondel", l: "Heróis de Arton", p: 233 },
  { b: "97", n: "Sapatos confortáveis", l: "Heróis de Arton", p: 233 },
  { b: "98", n: "Sapatos de salto alto", l: "Heróis de Arton", p: 233 },
  { b: "99", n: "Ácido concentrado", l: "Heróis de Arton", p: 234 },
  { b: "100", n: "Frasco abissal", l: "Heróis de Arton", p: 234 },
];

/* ===== EQUIPAMENTOS ===== */
var EQUIPAMENTOS = {
  bloco1: {
    titulo: "ARMAS",
    linhas: [
      { b: "01", n: "Açoite finntroll", l: "Ameaças de Arton", p: 392 },
      { b: "02", n: "Adaga", l: "Tormenta20", p: 146 },
      { b: "03", n: "Adaga oposta", l: "Heróis de Arton", p: 216 },
      { b: "04", n: "Agulha de Ahlen", l: "Heróis de Arton", p: 216 },
      { b: "05", n: "Alabarda", l: "Tormenta20", p: 146 },
      { b: "06", n: "Alfange", l: "Tormenta20", p: 146 },
      { b: "07", n: "Arcabuz", l: "Ameaças de Arton", p: 392 },
      { b: "08", n: "Arco curto", l: "Tormenta20", p: 146 },
      { b: "09", n: "Arco de guerra", l: "Heróis de Arton", p: 216 },
      { b: "10", n: "Arco longo", l: "Tormenta20", p: 146 },
      { b: "11", n: "Arco montado", l: "Heróis de Arton", p: 216 },
      { b: "12", n: "Arpão", l: "Ameaças de Arton", p: 392 },
      { b: "13", n: "Azagaia", l: "Tormenta20", p: 146 },
      { b: "14", n: "Bacamarte", l: "Ameaças de Arton", p: 392 },
      { b: "15", n: "Balas (20)", l: "Tormenta20", p: 151 },
      { b: "16", n: "Balestra", l: "Heróis de Arton", p: 216 },
      { b: "17", n: "Bastão lúdico", l: "Heróis de Arton", p: 216 },
      { b: "18", n: "Besta de mão", l: "Heróis de Arton", p: 216 },
      { b: "19", n: "Besta de repetição", l: "Heróis de Arton", p: 216 },
      { b: "20", n: "Besta dupla", l: "Heróis de Arton", p: 216 },
      { b: "21", n: "Besta leve", l: "Tormenta20", p: 146 },
      { b: "22", n: "Besta pesada", l: "Tormenta20", p: 146 },
      { b: "23", n: "Bico de corvo", l: "Heróis de Arton", p: 216 },
      { b: "24", n: "Boleadeira", l: "Heróis de Arton", p: 216 },
      { b: "25", n: "Bordão", l: "Tormenta20", p: 147 },
      { b: "26", n: "Canhão portátil", l: "Heróis de Arton", p: 217 },
      { b: "27", n: "Chakram", l: "Heróis de Arton", p: 217 },
      { b: "28", n: "Chicote", l: "Tormenta20", p: 147 },
      { b: "29", n: "Cimitarra", l: "Tormenta20", p: 147 },
      { b: "30", n: "Cinquedea", l: "Heróis de Arton", p: 217 },
      { b: "31", n: "Clava", l: "Tormenta20", p: 147 },
      { b: "32", n: "Clava-grão", l: "Heróis de Arton", p: 217 },
      { b: "33", n: "Corrente de espinhos", l: "Tormenta20", p: 147 },
      { b: "34", n: "Desmontador", l: "Heróis de Arton", p: 217 },
      { b: "35", n: "Dirk", l: "Heróis de Arton", p: 217 },
      { b: "36", n: "Espada bastarda", l: "Tormenta20", p: 147 },
      { b: "37", n: "Espada canora", l: "Heróis de Arton", p: 217 },
      { b: "38", n: "Espada curta", l: "Tormenta20", p: 148 },
      { b: "39", n: "Espada de execução", l: "Heróis de Arton", p: 217 },
      { b: "40", n: "Espada larga", l: "Heróis de Arton", p: 217 },
      { b: "41", n: "Espada longa", l: "Tormenta20", p: 148 },
      { b: "42", n: "Espada vespa", l: "Ameaças de Arton", p: 392 },
      { b: "43", n: "Espada-gadanho", l: "Heróis de Arton", p: 217 },
      { b: "44", n: "Espadim", l: "Heróis de Arton", p: 217 },
      { b: "45", n: "Flechas (20)", l: "Tormenta20", p: 151 },
      { b: "46", n: "Flechas de caça (20)", l: "Heróis de Arton", p: 223 },
      { b: "47", n: "Florete", l: "Tormenta20", p: 148 },
      { b: "48", n: "Foice", l: "Tormenta20", p: 148 },
      { b: "49", n: "Funda", l: "Tormenta20", p: 148 },
      { b: "50", n: "Gadanho", l: "Tormenta20", p: 148 },
      { b: "51", n: "Garrucha", l: "Heróis de Arton", p: 219 },
      { b: "52", n: "Gládio", l: "Ameaças de Arton", p: 392 },
      { b: "53", n: "Katana", l: "Tormenta20", p: 148 },
      { b: "54", n: "Khopesh", l: "Heróis de Arton", p: 219 },
      { b: "55", n: "Kimbata", l: "Heróis de Arton", p: 219 },
      { b: "56", n: "Lança", l: "Tormenta20", p: 148 },
      { b: "57", n: "Lança de falange", l: "Heróis de Arton", p: 220 },
      { b: "58", n: "Lança de fogo", l: "Ameaças de Arton", p: 392 },
      { b: "59", n: "Lança de justa", l: "Heróis de Arton", p: 220 },
      { b: "60", n: "Lança montada", l: "Tormenta20", p: 148 },
      { b: "61", n: "Maça", l: "Tormenta20", p: 149 },
      { b: "62", n: "Maça-estrela", l: "Heróis de Arton", p: 220 },
      { b: "63", n: "Machadinha", l: "Tormenta20", p: 149 },
      { b: "64", n: "Machado anão", l: "Tormenta20", p: 149 },
      { b: "65", n: "Machado de batalha", l: "Tormenta20", p: 149 },
      { b: "66", n: "Machado de guerra", l: "Tormenta20", p: 149 },
      { b: "67", n: "Machado de haste", l: "Heróis de Arton", p: 220 },
      { b: "68", n: "Machado táurico", l: "Tormenta20", p: 149 },
      { b: "69", n: "Malho", l: "Heróis de Arton", p: 220 },
      { b: "70", n: "Mangual", l: "Tormenta20", p: 149 },
      { b: "71", n: "Marrão", l: "Heróis de Arton", p: 221 },
      { b: "72", n: "Marreta", l: "Tormenta20", p: 149 },
      { b: "73", n: "Martelo de guerra", l: "Tormenta20", p: 149 },
      { b: "74", n: "Martelo leve", l: "Heróis de Arton", p: 221 },
      { b: "75", n: "Martelo longo", l: "Heróis de Arton", p: 221 },
      { b: "76", n: "Montante", l: "Tormenta20", p: 150 },
      { b: "77", n: "Montante cinético", l: "Heróis de Arton", p: 221 },
      { b: "78", n: "Mordida do diabo", l: "Ameaças de Arton", p: 393 },
      { b: "79", n: "Mosquete", l: "Tormenta20", p: 150 },
      { b: "80", n: "Neko-te", l: "Ameaças de Arton", p: 393 },
      { b: "81", n: "Pedras (20)", l: "Tormenta20", p: 151 },
      { b: "82", n: "Picareta", l: "Tormenta20", p: 150 },
      { b: "83", n: "Pique", l: "Tormenta20", p: 150 },
      { b: "84", n: "Pistola", l: "Tormenta20", p: 150 },
      { b: "85", n: "Pistola-punhal", l: "Ameaças de Arton", p: 393 },
      { b: "86", n: "Porrete", l: "Ameaças de Arton", p: 393 },
      { b: "87", n: "Presa de serpente", l: "Ameaças de Arton", p: 393 },
      { b: "88", n: "Rapieira", l: "Heróis de Arton", p: 221 },
      { b: "89", n: "Rede", l: "Tormenta20", p: 150 },
      { b: "90", n: "Serrilheira", l: "Heróis de Arton", p: 221 },
      { b: "91", n: "Shuriken", l: "Ameaças de Arton", p: 394 },
      { b: "92", n: "Sifão cáustico", l: "Heróis de Arton", p: 222 },
      { b: "93", n: "Tacape", l: "Tormenta20", p: 150 },
      { b: "94", n: "Tai-tai", l: "Heróis de Arton", p: 222 },
      { b: "95", n: "Tan-korak", l: "Heróis de Arton", p: 222 },
      { b: "96", n: "Tetsubo", l: "Ameaças de Arton", p: 394 },
      { b: "97", n: "Traque", l: "Ameaças de Arton", p: 394 },
      { b: "98", n: "Tridente", l: "Tormenta20", p: 150 },
      { b: "99", n: "Virotes (20)", l: "Tormenta20", p: 151 },
      { b: "100", n: "Zarabatana", l: "Ameaças de Arton", p: 394 },
    ]
  },
  bloco2: {
    titulo: "ARMADURAS & ESCUDOS",
    linhas: [
      { b: "01-02", n: "Armadura de chumbo", l: "Heróis de Arton", p: 223 },
      { b: "03-04", n: "Armadura de engenhoqueiro goblin", l: "Heróis de Arton", p: 223 },
      { b: "05-06", n: "Armadura de folhas", l: "Heróis de Arton", p: 223 },
      { b: "07-08", n: "Armadura de hussardo alado", l: "Heróis de Arton", p: 223 },
      { b: "09-10", n: "Armadura de justa", l: "Heróis de Arton", p: 223 },
      { b: "11", n: "Armadura de ossos", l: "Ameaças de Arton", p: 395 },
      { b: "12-13", n: "Armadura de pedra", l: "Heróis de Arton", p: 224 },
      { b: "14", n: "Armadura de quitina", l: "Ameaças de Arton", p: 395 },
      { b: "15-16", n: "Armadura sensual", l: "Heróis de Arton", p: 224 },
      { b: "17-20", n: "Brigantina", l: "Heróis de Arton", p: 224 },
      { b: "21-22", n: "Broquel", l: "Heróis de Arton", p: 224 },
      { b: "23-26", n: "Brunea", l: "Tormenta20", p: 154 },
      { b: "27-28", n: "Colete fora da lei", l: "Heróis de Arton", p: 226 },
      { b: "29-38", n: "Completa", l: "Tormenta20", p: 154 },
      { b: "39-42", n: "Cota de malha", l: "Tormenta20", p: 154 },
      { b: "43-44", n: "Cota de moedas", l: "Heróis de Arton", p: 226 },
      { b: "45-54", n: "Couraça", l: "Tormenta20", p: 154 },
      { b: "55-58", n: "Couro", l: "Tormenta20", p: 154 },
      { b: "59-64", n: "Couro batido", l: "Tormenta20", p: 154 },
      { b: "65", n: "Escudo de couro", l: "Ameaças de Arton", p: 395 },
      { b: "66", n: "Escudo de vime", l: "Heróis de Arton", p: 226 },
      { b: "67-74", n: "Escudo leve", l: "Tormenta20", p: 154 },
      { b: "75-82", n: "Escudo pesado", l: "Tormenta20", p: 154 },
      { b: "83-84", n: "Escudo torre", l: "Heróis de Arton", p: 226 },
      { b: "85-88", n: "Gibão de peles", l: "Tormenta20", p: 154 },
      { b: "89-92", n: "Loriga segmentada", l: "Tormenta20", p: 154 },
      { b: "93-98", n: "Meia armadura", l: "Tormenta20", p: 154 },
      { b: "99", n: "Sagna", l: "Heróis de Arton", p: 226 },
      { b: "100", n: "Veste de teia de aranha", l: "Ameaças de Arton", p: 395 },
    ]
  },
  bloco3: {
    titulo: "ESOTÉRICOS",
    linhas: [
      { b: "01-03", n: "Afiador solar", l: "Deuses de Arton", p: 51 },
      { b: "04-06", n: "Ankh solar", l: "Ameaças de Arton", p: 396 },
      { b: "07-10", n: "Báculo da retribuição", l: "Deuses de Arton", p: 51 },
      { b: "11-14", n: "Bolsa de pó", l: "Tormenta20", p: 159 },
      { b: "15-18", n: "Cajado arcano", l: "Tormenta20", p: 160 },
      { b: "19-22", n: "Cetro elemental", l: "Tormenta20", p: 160 },
      { b: "23-26", n: "Compasso mistico", l: "Heróis de Arton", p: 234 },
      { b: "27-30", n: "Contas de oração", l: "Deuses de Arton", p: 51 },
      { b: "31-34", n: "Costela de lich", l: "Tormenta20", p: 160 },
      { b: "35-38", n: "Dedo de ente", l: "Tormenta20", p: 160 },
      { b: "39-42", n: "Estola", l: "Deuses de Arton", p: 51 },
      { b: "43-46", n: "Flauta convocadora", l: "Heróis de Arton", p: 234 },
      { b: "47-50", n: "Frasco purificador", l: "Deuses de Arton", p: 51 },
      { b: "51-54", n: "Luva de ferro", l: "Tormenta20", p: 160 },
      { b: "55-58", n: "Mandala onírica", l: "Heróis de Arton", p: 234 },
      { b: "59-62", n: "Medalhão afiado", l: "Deuses de Arton", p: 51 },
      { b: "63-66", n: "Medalhão de prata", l: "Tormenta20", p: 160 },
      { b: "67-70", n: "Orbe cristalino", l: "Tormenta20", p: 160 },
      { b: "71-74", n: "Ostensório santificado", l: "Deuses de Arton", p: 51 },
      { b: "75-78", n: "Rede de almas", l: "Deuses de Arton", p: 52 },
      { b: "79-81", n: "Tomo de guerra", l: "Ameaças de Arton", p: 396 },
      { b: "82-84", n: "Tomo do rancor", l: "Ameaças de Arton", p: 396 },
      { b: "85-88", n: "Tomo hermético", l: "Tormenta20", p: 160 },
      { b: "89-92", n: "Turíbulo ungido", l: "Deuses de Arton", p: 52 },
      { b: "93-96", n: "Varinha arcana", l: "Tormenta20", p: 160 },
      { b: "97-100", n: "Varinha armamentista", l: "Heróis de Arton", p: 234 },
    ]
  },
};

/* ===== POÇÕES ===== */
var POCOES = [
  { b: "01", n: "Abençoar Alimentos (óleo)", v: 30, l: "Tormenta20", p: 178 },
  { b: "02", n: "Área Escorregadia (granada)", v: 30, l: "Tormenta20", p: 180 },
  { b: "03-04", n: "Arma Mágica (óleo)", v: 30, l: "Tormenta20", p: 181 },
  { b: "05", n: "Compreensão", v: 30, l: "Tormenta20", p: 184 },
  { b: "06-11", n: "Curar Ferimentos (2d8+2 PV)", v: 30, l: "Tormenta20", p: 189 },
  { b: "12-13", n: "Disfarce Ilusório", v: 30, l: "Tormenta20", p: 191 },
  { b: "14-15", n: "Escuridão (óleo)", v: 30, l: "Tormenta20", p: 193 },
  { b: "16-17", n: "Luz (óleo)", v: 30, l: "Tormenta20", p: 197 },
  { b: "18", n: "Névoa (granada)", v: 30, l: "Tormenta20", p: 200 },
  { b: "19", n: "Primor Atlético", v: 30, l: "Tormenta20", p: 201 },
  { b: "20", n: "Sono", v: 30, l: "Tormenta20", p: 207 },
  { b: "21-22", n: "Proteção Divina", v: 30, l: "Tormenta20", p: 202 },
  { b: "23-24", n: "Resistência a Energia", v: 30, l: "Tormenta20", p: 204 },
  { b: "25", n: "Suporte Ambiental", v: 30, l: "Tormenta20", p: 207 },
  { b: "26", n: "Tranca Arcana (óleo)", v: 30, l: "Tormenta20", p: 209 },
  { b: "27", n: "Visão Mística", v: 30, l: "Tormenta20", p: 211 },
  { b: "28", n: "Vitalidade Fantasma", v: 30, l: "Tormenta20", p: 211 },
  { b: "29", n: "Armadura Elemental", v: 30, l: "Heróis de Arton", p: 252 },
  { b: "30", n: "Desafio Corajoso", v: 30, l: "Heróis de Arton", p: 252 },
  { b: "31", n: "Discrição", v: 30, l: "Heróis de Arton", p: 253 },
  { b: "32", n: "Farejar Fortuna", v: 30, l: "Heróis de Arton", p: 254 },
  { b: "33", n: "Maaais Klunc", v: 30, l: "Heróis de Arton", p: 254 },
  { b: "34", n: "Ossos de Adamante", v: 30, l: "Heróis de Arton", p: 254 },
  { b: "35", n: "Punho de Mitral", v: 30, l: "Heróis de Arton", p: 254 },
  { b: "36", n: "Magia Dadivosa", v: 30, l: "Deuses de Arton", p: 62 },
  { b: "37", n: "Sigilo de Sszzaas", v: 30, l: "Deuses de Arton", p: 64 },
  { b: "38", n: "Sorriso da Fortuna", v: 30, l: "Deuses de Arton", p: 64 },
  { b: "39", n: "Toque de Megalokk", v: 30, l: "Deuses de Arton", p: 65 },
  { b: "40", n: "Voz da Razão", v: 30, l: "Deuses de Arton", p: 65 },
  { b: "41-42", n: "Escudo da Fé (aprimoramento para duração cena)", v: 120, l: "Tormenta20", p: 192 },
  { b: "43-44", n: "Alterar Tamanho", v: 270, l: "Tormenta20", p: 179 },
  { b: "45", n: "Aparência Perfeita", v: 270, l: "Tormenta20", p: 180 },
  { b: "46", n: "Armamento da Natureza (óleo)", v: 270, l: "Tormenta20", p: 181 },
  { b: "47-50", n: "Bola de Fogo (granada)", v: 270, l: "Tormenta20", p: 182 },
  { b: "51", n: "Camuflagem Ilusória", v: 270, l: "Tormenta20", p: 183 },
  { b: "52", n: "Concentração de Combate (aprimoramento para duração cena)", v: 270, l: "Tormenta20", p: 185 },
  { b: "53-56", n: "Curar Ferimentos (4d8+4 PV)", v: 270, l: "Tormenta20", p: 189 },
  { b: "57-58", n: "Físico Divino", v: 270, l: "Tormenta20", p: 193 },
  { b: "59", n: "Mente Divina", v: 270, l: "Tormenta20", p: 198 },
  { b: "60", n: "Metamorfose", v: 270, l: "Tormenta20", p: 198 },
  { b: "61-64", n: "Purificação", v: 270, l: "Tormenta20", p: 202 },
  { b: "65-66", n: "Velocidade", v: 270, l: "Tormenta20", p: 210 },
  { b: "67-68", n: "Vestimenta da Fé (óleo)", v: 270, l: "Tormenta20", p: 210 },
  { b: "69", n: "Voz Divina", v: 270, l: "Tormenta20", p: 211 },
  { b: "70-71", n: "Orientação (aprimoramento para duração cena; role o atributo afetado, sendo 1 = Força, 2 = Destreza e assim por diante)", v: 270, l: "Tormenta20", p: 200 },
  { b: "72", n: "Aura de Morte", v: 270, l: "Heróis de Arton", p: 252 },
  { b: "73", n: "Emular Magia", v: 270, l: "Heróis de Arton", p: 253 },
  { b: "74", n: "Punho de Mitral (aprimoramento para +2 em testes de ataque e margem de ameaça)", v: 270, l: "Heróis de Arton", p: 255 },
  { b: "75", n: "Viagem Onírica", v: 270, l: "Heróis de Arton", p: 255 },
  { b: "76", n: "Couraça de Allihanna (óleo)", v: 270, l: "Deuses de Arton", p: 60 },
  { b: "77", n: "Toque de Megalokk (aprimoramento para aumentar o dano das armas naturais em um passo e a margem de ameaça delas em +1 )", v: 480, l: "Deuses de Arton", p: 65 },
  { b: "78-79", n: "Arma Mágica (óleo; aprimoramento para bônus +3)", v: 750, l: "Tormenta20", p: 181 },
  { b: "80-81", n: "Proteção Divina (aprimoramento para bônus de +4)", v: 750, l: "Tormenta20", p: 202 },
  { b: "82", n: "Armadura Elemental (aprimoramento para 4d6 pontos de dano)", v: 750, l: "Heróis de Arton", p: 252 },
  { b: "83-88", n: "Curar Ferimentos (7d8+7 PV)", v: 1080, l: "Tormenta20", p: 189 },
  { b: "89-90", n: "Físico Divino (aprimoramento para três atributos)", v: 1080, l: "Tormenta20", p: 193 },
  { b: "91-92", n: "Invisibilidade (aprimoramento para duração cena)", v: 1080, l: "Tormenta20", p: 195 },
  { b: "93-94", n: "Pele de Pedra", v: 1080, l: "Tormenta20", p: 201 },
  { b: "95", n: "Potência Divina", v: 1080, l: "Tormenta20", p: 201 },
  { b: "96", n: "Voo", v: 1080, l: "Tormenta20", p: 211 },
  { b: "97", n: "Percepção Rubra (aprimoramento para aumentar bônus em +3)", v: 1080, l: "Deuses de Arton", p: 63 },
  { b: "98-100", n: "Bola de Fogo (granada; aprimoramento para 10d6 de dano)", v: 1470, l: "Tormenta20", p: 182 },
  { b: "101-110", n: "Curar Ferimentos (11d8+11 PV)", v: 3000, l: "Tormenta20", p: 189 },
  { b: "111-114", n: "Pele de Pedra (aprimoramento para pele de aço e RD 10)", v: 3000, l: "Tormenta20", p: 201 },
  { b: "115-116", n: "Premonição", v: 3000, l: "Tormenta20", p: 201 },
  { b: "117", n: "Viagem Onírica (aprimoramentos para falar e lançar magias)", v: 3000, l: "Heróis de Arton", p: 255 },
  { b: "118", n: "Potência Divina (aprimoramento para Força +6 e RD 15)", v: 6750, l: "Tormenta20", p: 201 },
  { b: "119", n: "Momento de Tormenta (granada; aprimoramento para +4 dados de dano do mesmo tipo)", v: 6750, l: "Ameaças de Arton", p: 404 },
  { b: "120", n: "Transformação em Dragão (aprimoramentos para atributos +4, asas, arma de mordida e dano de sopro de 12d6+12)", v: 28000, l: "Ameaças de Arton", p: 405 },
];

/* ===== SUPERIORES ===== */
var SUPERIORES = {
  bloco1: {
    titulo: "MELHORIAS DE ARMAS",
    linhas: [
      { b: "01-10", n: "Atroz*", l: "Tormenta20", p: 164 },
      { b: "11-12", n: "Banhada a ouro", l: "Tormenta20", p: 164 },
      { b: "13-20", n: "Certeira", l: "Tormenta20", p: 164 },
      { b: "21", n: "Conduíte", l: "Deuses de Arton", p: 54 },
      { b: "22-23", n: "Cravejada de gemas", l: "Tormenta20", p: 164 },
      { b: "24-31", n: "Cruel", l: "Tormenta20", p: 164 },
      { b: "32-33", n: "Discreta", l: "Tormenta20", p: 164 },
      { b: "34-38", n: "Equilibrada", l: "Tormenta20", p: 165 },
      { b: "39-42", n: "Farpada", l: "Heróis de Arton", p: 239 },
      { b: "43-44", n: "Guarda", l: "Heróis de Arton", p: 239 },
      { b: "45-48", n: "Harmonizada", l: "Tormenta20", p: 165 },
      { b: "49", n: "Incendiária", l: "Heróis de Arton", p: 239 },
      { b: "50-53", n: "Injeção alquímica", l: "Tormenta20", p: 165 },
      { b: "54-55", n: "Macabra", l: "Tormenta20", p: 165 },
      { b: "56-65", n: "Maciça", l: "Tormenta20", p: 165 },
      { b: "66-75", n: "Material especial**", l: "Tormenta20", p: 165 },
      { b: "76-79", n: "Mira telescópica", l: "Tormenta20", p: 166 },
      { b: "80-87", n: "Precisa", l: "Tormenta20", p: 166 },
      { b: "88-89", n: "Pressurizada", l: "Heróis de Arton", p: 240 },
      { b: "90-99", n: "Pungente*", l: "Tormenta20", p: 166 },
      { b: "100", n: "Usada", l: "Heróis de Arton", p: 240 },
    ]
  },
  bloco2: {
    titulo: "MELHORIAS DE ARMADURAS & ESCUDOS",
    linhas: [
      { b: "01-10", n: "Ajustada", l: "Tormenta20", p: 164 },
      { b: "11-14", n: "Balístico", l: "Heróis de Arton", p: 239 },
      { b: "15-18", n: "Banhada a ouro", l: "Tormenta20", p: 164 },
      { b: "19-22", n: "Cravejada de gemas", l: "Tormenta20", p: 164 },
      { b: "23-27", n: "Delicada", l: "Tormenta20", p: 164 },
      { b: "28-29", n: "Deslumbrante*", l: "Heróis de Arton", p: 239 },
      { b: "30-31", n: "Diligente", l: "Deuses de Arton", p: 54 },
      { b: "32-35", n: "Discreta", l: "Tormenta20", p: 164 },
      { b: "36-39", n: "Espinhos", l: "Tormenta20", p: 165 },
      { b: "40-43", n: "Injetora", l: "Heróis de Arton", p: 240 },
      { b: "44-47", n: "Inscrito", l: "Deuses de Arton", p: 54 },
      { b: "48-49", n: "Macabra", l: "Tormenta20", p: 165 },
      { b: "50-59", n: "Material especial**", l: "Tormenta20", p: 165 },
      { b: "60-64", n: "Polida", l: "Tormenta20", p: 166 },
      { b: "65-84", n: "Reforçada", l: "Tormenta20", p: 166 },
      { b: "85-95", n: "Selada", l: "Tormenta20", p: 166 },
      { b: "96-100", n: "Sob medida*", l: "Tormenta20", p: 166 },
    ]
  },
  bloco3: {
    titulo: "MELHORIAS DE ESOTÉRICOS",
    linhas: [
      { b: "01-03", n: "Banhado a ouro", l: "Tormenta20", p: 164 },
      { b: "04-18", n: "Canalizador", l: "Tormenta20", p: 164 },
      { b: "19-21", n: "Canônico", l: "Deuses de Arton", p: 54 },
      { b: "22-24", n: "Cravejado de gemas", l: "Tormenta20", p: 164 },
      { b: "25-28", n: "Discreto", l: "Tormenta20", p: 164 },
      { b: "29-43", n: "Energético", l: "Tormenta20", p: 165 },
      { b: "44-58", n: "Harmonizado", l: "Tormenta20", p: 165 },
      { b: "59-61", n: "Macabro", l: "Tormenta20", p: 165 },
      { b: "62-70", n: "Material especial**", l: "Tormenta20", p: 165 },
      { b: "71-80", n: "Poderoso", l: "Tormenta20", p: 166 },
      { b: "81-90", n: "Potencializador*", l: "Heróis de Arton", p: 240 },
      { b: "91-100", n: "Vigilante", l: "Tormenta20", p: 166 },
    ]
  },
};

/* ===== MÁGICOS (encantos) ===== */
var MAGICOS_ENCANTOS = {
  bloco1: {
    titulo: "ARMAS",
    linhas: [
      { b: "01", n: "Alvorada", l: "Heróis de Arton", p: 256 },
      { b: "02-05", n: "Ameaçadora", l: "Tormenta20", p: 335 },
      { b: "06", n: "Anátema", l: "Heróis de Arton", p: 256 },
      { b: "07-08", n: "Anticriatura", l: "Tormenta20", p: 335 },
      { b: "09", n: "Arremesso", l: "Tormenta20", p: 335 },
      { b: "10", n: "Assassina", l: "Tormenta20", p: 335 },
      { b: "11", n: "Brumosa", l: "Heróis de Arton", p: 256 },
      { b: "12", n: "Caçadora", l: "Tormenta20", p: 335 },
      { b: "13", n: "Cantante", l: "Heróis de Arton", p: 256 },
      { b: "14", n: "Ciclônica", l: "Heróis de Arton", p: 256 },
      { b: "15-18", n: "Congelante", l: "Tormenta20", p: 335 },
      { b: "19", n: "Conjuradora", l: "Tormenta20", p: 335 },
      { b: "20-23", n: "Corrosiva", l: "Tormenta20", p: 335 },
      { b: "24-25", n: "Crescente", l: "Heróis de Arton", p: 256 },
      { b: "26", n: "Cristalina", l: "Heróis de Arton", p: 256 },
      { b: "27", n: "Cronal*", l: "Heróis de Arton", p: 256 },
      { b: "28", n: "Cuidadora", l: "Heróis de Arton", p: 256 },
      { b: "29-30", n: "Dançarina", l: "Tormenta20", p: 335 },
      { b: "31-32", n: "Defensora", l: "Tormenta20", p: 335 },
      { b: "33", n: "Destruidora", l: "Tormenta20", p: 335 },
      { b: "34-35", n: "Dilacerante", l: "Tormenta20", p: 335 },
      { b: "36", n: "Drenante", l: "Tormenta20", p: 335 },
      { b: "37-40", n: "Elétrica", l: "Tormenta20", p: 335 },
      { b: "41", n: "Energética*", l: "Tormenta20", p: 335 },
      { b: "42-43", n: "Espreitadora", l: "Heróis de Arton", p: 256 },
      { b: "44-45", n: "Excruciante", l: "Tormenta20", p: 335 },
      { b: "46-49", n: "Flamejante", l: "Tormenta20", p: 335 },
      { b: "50-57", n: "Formidável", l: "Tormenta20", p: 336 },
      { b: "58-59", n: "Frenética", l: "Heróis de Arton", p: 256 },
      { b: "60", n: "Gárgula", l: "Heróis de Arton", p: 256 },
      { b: "61", n: "Horrenda", l: "Heróis de Arton", p: 256 },
      { b: "62", n: "Indignada", l: "Heróis de Arton", p: 256 },
      { b: "63", n: "Infestada", l: "Heróis de Arton", p: 256 },
      { b: "64", n: "Lancinante*", l: "Tormenta20", p: 336 },
      { b: "65-72", n: "Magnífica*", l: "Tormenta20", p: 336 },
      { b: "73", n: "Manáfaga", l: "Heróis de Arton", p: 256 },
      { b: "74-75", n: "Piedosa", l: "Tormenta20", p: 336 },
      { b: "76", n: "Profana", l: "Tormenta20", p: 336 },
      { b: "77", n: "Rebote", l: "Heróis de Arton", p: 256 },
      { b: "78", n: "Reflexiva", l: "Heróis de Arton", p: 257 },
      { b: "79", n: "Ressonante", l: "Heróis de Arton", p: 257 },
      { b: "80", n: "Sagrada", l: "Tormenta20", p: 336 },
      { b: "81-82", n: "Sanguinária", l: "Tormenta20", p: 336 },
      { b: "83", n: "Sepulcral", l: "Heróis de Arton", p: 257 },
      { b: "84", n: "Sombria", l: "Heróis de Arton", p: 257 },
      { b: "85", n: "Trovejante", l: "Tormenta20", p: 336 },
      { b: "86", n: "Tumular", l: "Tormenta20", p: 336 },
      { b: "87", n: "Vampírica", l: "Heróis de Arton", p: 257 },
      { b: "88-89", n: "Veloz", l: "Tormenta20", p: 336 },
      { b: "90", n: "Venenosa", l: "Tormenta20", p: 336 },
      { b: "91-100", n: "Arma específica", l: "Role na tabela abaixo", p: null },
    ]
  },
  bloco2: {
    titulo: "ARMADURAS & ESCUDOS",
    linhas: [
      { b: "01-02", n: "Abascanto", l: "Tormenta20", p: 338 },
      { b: "03-04", n: "Abençoado", l: "Tormenta20", p: 338 },
      { b: "05", n: "Abissal", l: "Heróis de Arton", p: 258 },
      { b: "06", n: "Acrobático", l: "Tormenta20", p: 338 },
      { b: "07-08", n: "Alado", l: "Tormenta20", p: 338 },
      { b: "09", n: "Ancorada*", l: "Heróis de Arton", p: 258 },
      { b: "10-11", n: "Animado**", l: "Tormenta20", p: 338 },
      { b: "12", n: "Anulador***", l: "Heróis de Arton", p: 258 },
      { b: "13", n: "Arbóreo", l: "Heróis de Arton", p: 258 },
      { b: "14-15", n: "Assustador", l: "Tormenta20", p: 338 },
      { b: "16", n: "Astuto", l: "Heróis de Arton", p: 258 },
      { b: "17", n: "Cáustica", l: "Tormenta20", p: 338 },
      { b: "18-27", n: "Defensor", l: "Tormenta20", p: 338 },
      { b: "28", n: "Densa*", l: "Heróis de Arton", p: 258 },
      { b: "29", n: "Égide", l: "Heróis de Arton", p: 258 },
      { b: "30", n: "Enraizada*", l: "Heróis de Arton", p: 258 },
      { b: "31", n: "Escorregadio", l: "Tormenta20", p: 338 },
      { b: "32-33", n: "Esmagador**", l: "Tormenta20", p: 339 },
      { b: "34", n: "Esmérico", l: "Heróis de Arton", p: 258 },
      { b: "35-36", n: "Estígio***", l: "Heróis de Arton", p: 258 },
      { b: "37", n: "Etéreo", l: "Heróis de Arton", p: 259 },
      { b: "38-39", n: "Fantasmagórico", l: "Tormenta20", p: 339 },
      { b: "40-43", n: "Fortificado", l: "Tormenta20", p: 339 },
      { b: "44", n: "Gélido", l: "Tormenta20", p: 339 },
      { b: "45", n: "Geomântico", l: "Heróis de Arton", p: 259 },
      { b: "46-55", n: "Guardião***", l: "Tormenta20", p: 339 },
      { b: "56-57", n: "Hipnótico", l: "Tormenta20", p: 339 },
      { b: "58", n: "Ilusório", l: "Tormenta20", p: 339 },
      { b: "59", n: "Incandescente", l: "Tormenta20", p: 339 },
      { b: "60-64", n: "Invulnerável", l: "Tormenta20", p: 339 },
      { b: "65", n: "Ligeira*", l: "Heróis de Arton", p: 259 },
      { b: "66-67", n: "Luminescente", l: "Heróis de Arton", p: 259 },
      { b: "68-72", n: "Opaco", l: "Tormenta20", p: 339 },
      { b: "73", n: "Prístino", l: "Heróis de Arton", p: 259 },
      { b: "74-78", n: "Protetor", l: "Tormenta20", p: 339 },
      { b: "79", n: "Purificador", l: "Heróis de Arton", p: 259 },
      { b: "80-81", n: "Reanimador", l: "Heróis de Arton", p: 259 },
      { b: "82-83", n: "Refletor", l: "Tormenta20", p: 339 },
      { b: "84", n: "Relampejante", l: "Tormenta20", p: 339 },
      { b: "85", n: "Reluzente", l: "Tormenta20", p: 339 },
      { b: "86", n: "Replicante", l: "Heróis de Arton", p: 259 },
      { b: "87", n: "Resiliente", l: "Heróis de Arton", p: 259 },
      { b: "88", n: "Sombrio", l: "Tormenta20", p: 339 },
      { b: "89", n: "Vórtice", l: "Heróis de Arton", p: 259 },
      { b: "90", n: "Zeloso", l: "Tormenta20", p: 339 },
      { b: "91-100", n: "Item específico", l: "Role na tabela abaixo", p: null },
    ]
  },
  bloco3: {
    titulo: "ESOTÉRICOS",
    linhas: [
      { b: "01-02", n: "Abafador", l: "Heróis de Arton", p: 260 },
      { b: "03-12", n: "Bélico", l: "Heróis de Arton", p: 260 },
      { b: "13-16", n: "Caridoso", l: "Heróis de Arton", p: 260 },
      { b: "17-20", n: "Chocante", l: "Heróis de Arton", p: 260 },
      { b: "21-30", n: "Clemente", l: "Heróis de Arton", p: 260 },
      { b: "31-32", n: "Contido", l: "Heróis de Arton", p: 260 },
      { b: "33-34", n: "Embusteiro", l: "Heróis de Arton", p: 260 },
      { b: "35-36", n: "Emergencial", l: "Heróis de Arton", p: 260 },
      { b: "37-40", n: "Encadeado", l: "Heróis de Arton", p: 260 },
      { b: "41-42", n: "Escultor", l: "Heróis de Arton", p: 260 },
      { b: "43-44", n: "Frugal", l: "Heróis de Arton", p: 261 },
      { b: "45-48", n: "Glacial", l: "Heróis de Arton", p: 261 },
      { b: "49-50", n: "Imperioso", l: "Heróis de Arton", p: 261 },
      { b: "51-52", n: "Implacável*", l: "Heróis de Arton", p: 261 },
      { b: "53-54", n: "Incriminador", l: "Heróis de Arton", p: 261 },
      { b: "55-61", n: "Inflamável", l: "Heróis de Arton", p: 261 },
      { b: "62-65", n: "Inquisidor", l: "Heróis de Arton", p: 261 },
      { b: "66-69", n: "Insistente", l: "Heróis de Arton", p: 261 },
      { b: "70-71", n: "Khalmyrita", l: "Heróis de Arton", p: 261 },
      { b: "72-81", n: "Majestoso*", l: "Heróis de Arton", p: 261 },
      { b: "82-83", n: "Nímbico", l: "Heróis de Arton", p: 261 },
      { b: "84", n: "Pulverizante*", l: "Heróis de Arton", p: 261 },
      { b: "85", n: "Retaliador", l: "Heróis de Arton", p: 261 },
      { b: "86-87", n: "Sanguessuga", l: "Heróis de Arton", p: 261 },
      { b: "88", n: "Traiçoeiro", l: "Heróis de Arton", p: 261 },
      { b: "89-90", n: "Verdugo", l: "Heróis de Arton", p: 261 },
      { b: "91-100", n: "Esotérico específico", l: "Role na tabela abaixo", p: null },
    ]
  },
};

/* ===== MÁGICOS — ITENS ESPECÍFICOS ===== */
var MAGICOS_ESPECIFICOS = {
  armas: {
    titulo: "ARMAS ESPECÍFICAS",
    linhas: [
      { b: "01-02", n: "Adaga da bruma", l: "Heróis de Arton", p: 257 },
      { b: "03", n: "Adaga ofídica", l: "Deuses de Arton", p: 58 },
      { b: "04", n: "Adaga sorrateira", l: "Deuses de Arton", p: 56 },
      { b: "05", n: "Alabarda da coragem", l: "Deuses de Arton", p: 57 },
      { b: "06", n: "Alfange dourado", l: "Deuses de Arton", p: 56 },
      { b: "07", n: "Alguma coisa de Nimb...", l: "Deuses de Arton", p: 58 },
      { b: "08-10", n: "Arco das sombras", l: "Heróis de Arton", p: 257 },
      { b: "11-12", n: "Arco do crepúsculo", l: "Heróis de Arton", p: 257 },
      { b: "13-15", n: "Arco do poder", l: "Tormenta20", p: 336 },
      { b: "16-18", n: "Avalanche", l: "Tormenta20", p: 337 },
      { b: "19-21", n: "Azagaia dos relâmpagos", l: "Tormenta20", p: 337 },
      { b: "22-23", n: "Azagaia fantasma", l: "Heróis de Arton", p: 257 },
      { b: "24-26", n: "Besta estelar", l: "Heróis de Arton", p: 257 },
      { b: "27-29", n: "Besta explosiva", l: "Tormenta20", p: 337 },
      { b: "30", n: "Bordão sabichão", l: "Deuses de Arton", p: 58 },
      { b: "31", n: "Cajado das matas", l: "Deuses de Arton", p: 55 },
      { b: "32", n: "Cimitarra solar", l: "Deuses de Arton", p: 56 },
      { b: "33-34", n: "Clava de lava", l: "Heróis de Arton", p: 257 },
      { b: "35-37", n: "Espada baronial", l: "Tormenta20", p: 337 },
      { b: "38-39", n: "Espada da tempestade", l: "Heróis de Arton", p: 257 },
      { b: "40-42", n: "Espada do guardião", l: "Heróis de Arton", p: 257 },
      { b: "43", n: "Espada imaculada", l: "Deuses de Arton", p: 59 },
      { b: "44", n: "Espada monástica", l: "Deuses de Arton", p: 57 },
      { b: "45-46", n: "Espada solar", l: "Heróis de Arton", p: 257 },
      { b: "47-49", n: "Espada sortuda", l: "Tormenta20", p: 337 },
      { b: "50-51", n: "Florete do vendaval", l: "Heróis de Arton", p: 258 },
      { b: "52-54", n: "Florete fugaz", l: "Tormenta20", p: 337 },
      { b: "55", n: "Katana da determinação", l: "Deuses de Arton", p: 57 },
      { b: "56-58", n: "Lâmina da luz", l: "Tormenta20", p: 338 },
      { b: "59-61", n: "Lança animalesca", l: "Tormenta20", p: 338 },
      { b: "62", n: "Lança da dominação", l: "Deuses de Arton", p: 56 },
      { b: "63-64", n: "Lança da fênix", l: "Heróis de Arton", p: 258 },
      { b: "65-67", n: "Língua do deserto", l: "Tormenta20", p: 338 },
      { b: "68-70", n: "Maça do terror", l: "Tormenta20", p: 338 },
      { b: "71", n: "Maça monstruosa", l: "Deuses de Arton", p: 58 },
      { b: "72", n: "Machado da bravura", l: "Deuses de Arton", p: 55 },
      { b: "73-74", n: "Machado da natureza", l: "Heróis de Arton", p: 258 },
      { b: "75-76", n: "Machado do abismo", l: "Heróis de Arton", p: 258 },
      { b: "77-79", n: "Machado do vulcão", l: "Heróis de Arton", p: 258 },
      { b: "80", n: "Machado lamnoriano", l: "Deuses de Arton", p: 59 },
      { b: "81-83", n: "Machado silvestre", l: "Tormenta20", p: 338 },
      { b: "84", n: "Mangual aventureiro", l: "Deuses de Arton", p: 59 },
      { b: "85-86", n: "Martelo da terra", l: "Heróis de Arton", p: 258 },
      { b: "87-89", n: "Martelo de Doherimm", l: "Tormenta20", p: 338 },
      { b: "90-91", n: "Martelo do titã", l: "Heróis de Arton", p: 258 },
      { b: "92-93", n: "Punhal das profundezas", l: "Heróis de Arton", p: 258 },
      { b: "94-96", n: "Punhal sszzaazita", l: "Tormenta20", p: 338 },
      { b: "97", n: "Tridente aquoso", l: "Deuses de Arton", p: 58 },
      { b: "98-100", n: "Vingadora sagrada", l: "Tormenta20", p: 338 },
    ]
  },
  armaduras: {
    titulo: "ARMADURAS & ESCUDOS ESPECÍFICOS",
    linhas: [
      { b: "01-04", n: "Armadura da luz", l: "Tormenta20", p: 340 },
      { b: "05-08", n: "Armadura das sombras profundas", l: "Heróis de Arton", p: 259 },
      { b: "09-12", n: "Armadura do dragão ancião", l: "Heróis de Arton", p: 259 },
      { b: "13-16", n: "Armadura do inverno perene", l: "Heróis de Arton", p: 259 },
      { b: "17-18", n: "Armadura do julgamento", l: "Deuses de Arton", p: 57 },
      { b: "19-22", n: "Baluarte anão", l: "Tormenta20", p: 340 },
      { b: "23-26", n: "Carapaça demoníaca", l: "Tormenta20", p: 340 },
      { b: "27-30", n: "Cota da serpente marinha", l: "Heróis de Arton", p: 259 },
      { b: "31-40", n: "Cota élfica", l: "Tormenta20", p: 340 },
      { b: "41-44", n: "Couraça do comando", l: "Tormenta20", p: 340 },
      { b: "45-48", n: "Couraça do guardião celeste", l: "Heróis de Arton", p: 259 },
      { b: "49-52", n: "Couro de monstro", l: "Tormenta20", p: 340 },
      { b: "53-56", n: "Escudo da ira vulcânica", l: "Heróis de Arton", p: 260 },
      { b: "57-60", n: "Escudo da luz estelar", l: "Heróis de Arton", p: 260 },
      { b: "61-64", n: "Escudo da natureza viva", l: "Heróis de Arton", p: 260 },
      { b: "65-68", n: "Escudo de Azgher", l: "Tormenta20", p: 340 },
      { b: "69-72", n: "Escudo do conjurador", l: "Tormenta20", p: 340 },
      { b: "73-76", n: "Escudo do eclipse", l: "Tormenta20", p: 340 },
      { b: "77-80", n: "Escudo do grifo", l: "Heróis de Arton", p: 260 },
      { b: "81-86", n: "Escudo do leão", l: "Tormenta20", p: 340 },
      { b: "87-90", n: "Escudo do trovão", l: "Heróis de Arton", p: 260 },
      { b: "91-94", n: "Escudo espinhoso", l: "Tormenta20", p: 340 },
      { b: "95-98", n: "Loriga do centurião", l: "Tormenta20", p: 340 },
      { b: "99-100", n: "Manto da noite", l: "Tormenta20", p: 340 },
    ]
  },
  esotericos: {
    titulo: "ESOTÉRICOS ESPECÍFICOS",
    linhas: [
      { b: "01-20", n: "Cajado da destruição", l: "Tormenta20", p: 337 },
      { b: "21-40", n: "Cajado da vida", l: "Tormenta20", p: 337 },
      { b: "41-45", n: "Cajado das marés", l: "Heróis de Arton", p: 262 },
      { b: "46-60", n: "Cajado do poder", l: "Tormenta20", p: 337 },
      { b: "61-75", n: "Cálice sagrado", l: "Heróis de Arton", p: 262 },
      { b: "76-85", n: "Relógio do arcanista", l: "Heróis de Arton", p: 262 },
      { b: "86-95", n: "Varinha da generosidade", l: "Deuses de Arton", p: 59 },
      { b: "96-100", n: "Varinha milenar", l: "Heróis de Arton", p: 262 },
    ]
  },
};

/* ===== MÁGICOS — ACESSÓRIOS ===== */
var MAGICOS_ACESSORIOS = {
  bloco1: {
    titulo: "ACESSÓRIOS MENORES",
    linhas: [
      { b: "01", n: "Algibeira mordedora", v: 1000, l: "Heróis de Arton", p: 263 },
      { b: "02", n: "Elixir da mente dividida", v: 1500, l: "Heróis de Arton", p: 265 },
      { b: "03", n: "Papiro das estrelas", v: 1500, l: "Heróis de Arton", p: 267 },
      { b: "04", n: "Anel do sustento", v: 3000, l: "Tormenta20", p: 342 },
      { b: "05-07", n: "Bainha mágica", v: 3000, l: "Tormenta20", p: 342 },
      { b: "08-09", n: "Corda da escalada", v: 3000, l: "Tormenta20", p: 343 },
      { b: "10", n: "Ferraduras da velocidade", v: 3000, l: "Tormenta20", p: 344 },
      { b: "11-12", n: "Garrafa da fumaça eterna", v: 3000, l: "Tormenta20", p: 344 },
      { b: "13-15", n: "Gema da luminosidade", v: 3000, l: "Tormenta20", p: 344 },
      { b: "16-18", n: "Manto élfico", v: 3000, l: "Tormenta20", p: 345 },
      { b: "19-21", n: "Mochila de carga", v: 3000, l: "Tormenta20", p: 345 },
      { b: "22-23", n: "Amuleto da visão etérea", v: 3000, l: "Heróis de Arton", p: 263 },
      { b: "24-25", n: "Cinturão do trobo", v: 3000, l: "Heróis de Arton", p: 264 },
      { b: "26-27", n: "Elixir da eternidade", v: 3000, l: "Heróis de Arton", p: 265 },
      { b: "28-29", n: "Pérola da nulificação", v: 3000, l: "Heróis de Arton", p: 267 },
      { b: "30-31", n: "Saco dos ventos silenciosos", v: 3000, l: "Heróis de Arton", p: 267 },
      { b: "32-36", n: "Brincos da sagacidade", v: 4500, l: "Tormenta20", p: 342 },
      { b: "37-41", n: "Luvas da delicadeza", v: 4500, l: "Tormenta20", p: 344 },
      { b: "42-46", n: "Manoplas da força do ogro", v: 4500, l: "Tormenta20", p: 344 },
      { b: "47-50", n: "Manto da resistência", v: 4500, l: "Tormenta20", p: 344 },
      { b: "51-55", n: "Manto do fascínio", v: 4500, l: "Tormenta20", p: 344 },
      { b: "56-60", n: "Pingente da sensatez", v: 4500, l: "Tormenta20", p: 345 },
      { b: "61-65", n: "Torque do vigor", v: 4500, l: "Tormenta20", p: 345 },
      { b: "66", n: "Monóculo da franqueza", v: 4500, l: "Heróis de Arton", p: 266 },
      { b: "67-68", n: "Chapéu do disfarce", v: 6000, l: "Tormenta20", p: 343 },
      { b: "69", n: "Flauta fantasma", v: 6000, l: "Tormenta20", p: 344 },
      { b: "70-71", n: "Lanterna da revelação", v: 6000, l: "Tormenta20", p: 344 },
      { b: "72-73", n: "Algibeira provedora", v: 6000, l: "Heróis de Arton", p: 263 },
      { b: "74-75", n: "Gaiola dos arcanos", v: 6000, l: "Heróis de Arton", p: 266 },
      { b: "76-77", n: "Lâmpada da ilusão impecável", v: 6000, l: "Heróis de Arton", p: 266 },
      { b: "78-79", n: "Pena da criação", v: 6000, l: "Heróis de Arton", p: 267 },
      { b: "80-81", n: "Corda da resignação", v: 7500, l: "Heróis de Arton", p: 265 },
      { b: "82-86", n: "Anel da proteção", v: 9000, l: "Tormenta20", p: 342 },
      { b: "87", n: "Anel do escudo mental", v: 9000, l: "Tormenta20", p: 342 },
      { b: "88", n: "Pingente da saúde", v: 9000, l: "Tormenta20", p: 345 },
      { b: "89", n: "Coroa de flores", v: 9000, l: "Deuses de Arton", p: 55 },
      { b: "90", n: "Jarro das profundezas", v: 9000, l: "Deuses de Arton", p: 58 },
      { b: "91", n: "Escrivaninha consagrada", v: 9000, l: "Deuses de Arton", p: 58 },
      { b: "92", n: "Anel da proteção mental", v: 9000, l: "Heróis de Arton", p: 263 },
      { b: "93", n: "Berço das fadas", v: 9000, l: "Heróis de Arton", p: 263 },
      { b: "94", n: "Chapéu dos truques infinitos", v: 9000, l: "Heróis de Arton", p: 264 },
      { b: "95", n: "Cinto da leveza graciosa", v: 9000, l: "Heróis de Arton", p: 264 },
      { b: "96", n: "Cristal da voz silenciosa", v: 9000, l: "Heróis de Arton", p: 265 },
      { b: "97", n: "Cristal do tempo célere", v: 9000, l: "Heróis de Arton", p: 265 },
      { b: "98", n: "Ocarina da melodia distante", v: 9000, l: "Heróis de Arton", p: 266 },
      { b: "99", n: "Olhos do corvo", v: 9000, l: "Heróis de Arton", p: 266 },
      { b: "100", n: "Pergaminho da verdade cósmica", v: 9000, l: "Heróis de Arton", p: 267 },
    ]
  },
  bloco2: {
    titulo: "ACESSÓRIOS MÉDIOS",
    linhas: [
      { b: "01", n: "Anel de telecinesia", v: 10500, l: "Tormenta20", p: 342 },
      { b: "02", n: "Bola de cristal", v: 10500, l: "Tormenta20", p: 342 },
      { b: "03", n: "Caveira maldita", v: 10500, l: "Tormenta20", p: 343 },
      { b: "04", n: "Instrumento da alegria", v: 10500, l: "Deuses de Arton", p: 57 },
      { b: "05", n: "Ampulheta da harmonia temporal", v: 10500, l: "Heróis de Arton", p: 263 },
      { b: "06", n: "Amuleto do amparo", v: 10500, l: "Heróis de Arton", p: 263 },
      { b: "07", n: "Caixa dos ecos perdidos", v: 10500, l: "Heróis de Arton", p: 264 },
      { b: "08", n: "Colar da perseverança", v: 10500, l: "Heróis de Arton", p: 264 },
      { b: "09", n: "Colar do tirano", v: 10500, l: "Heróis de Arton", p: 265 },
      { b: "10", n: "Óculos da revelação", v: 10500, l: "Heróis de Arton", p: 266 },
      { b: "11", n: "Colar das bolas de fogo", v: 12000, l: "Heróis de Arton", p: 265 },
      { b: "12", n: "Sandálias de Valkaria", v: 12000, l: "Heróis de Arton", p: 267 },
      { b: "13", n: "Véu diáfano", v: 13500, l: "Deuses de Arton", p: 57 },
      { b: "14", n: "Botas aladas", v: 15000, l: "Tormenta20", p: 342 },
      { b: "15", n: "Botas inquietas", v: 15000, l: "Deuses de Arton", p: 59 },
      { b: "16", n: "Pira póstera", v: 15000, l: "Deuses de Arton", p: 59 },
      { b: "17", n: "Anel do pacto oneroso", v: 15000, l: "Heróis de Arton", p: 263 },
      { b: "18", n: "Botas do andarilho das sombras", v: 15000, l: "Heróis de Arton", p: 263 },
      { b: "19", n: "Cálice das marés", v: 15000, l: "Heróis de Arton", p: 264 },
      { b: "20", n: "Cinto dos caminhos cruzados", v: 15000, l: "Heróis de Arton", p: 264 },
      { b: "21", n: "Pedra da passagem", v: 15000, l: "Heróis de Arton", p: 267 },
      { b: "22", n: "Pingente da dor partilhada", v: 15000, l: "Heróis de Arton", p: 267 },
      { b: "23-26", n: "Braceletes de bronze", v: 16500, l: "Tormenta20", p: 342 },
      { b: "27", n: "Capa nebulosa", v: 16500, l: "Heróis de Arton", p: 264 },
      { b: "28", n: "Espelho do outro lado", v: 18000, l: "Heróis de Arton", p: 265 },
      { b: "29-30", n: "Gema da purificação", v: 18000, l: "Heróis de Arton", p: 266 },
      { b: "31-32", n: "Máscara da raposa", v: 18000, l: "Heróis de Arton", p: 266 },
      { b: "33-36", n: "Anel da energia", v: 21000, l: "Tormenta20", p: 342 },
      { b: "37-40", n: "Anel da vitalidade", v: 21000, l: "Tormenta20", p: 342 },
      { b: "41-42", n: "Anel de invisibilidade", v: 21000, l: "Tormenta20", p: 342 },
      { b: "43-44", n: "Braçadeiras do arqueiro", v: 21000, l: "Tormenta20", p: 342 },
      { b: "45-46", n: "Brincos de Marah", v: 21000, l: "Tormenta20", p: 343 },
      { b: "47-48", n: "Faixas do pugilista", v: 21000, l: "Tormenta20", p: 344 },
      { b: "49-50", n: "Manto da aranha", v: 21000, l: "Tormenta20", p: 344 },
      { b: "51-52", n: "Vassoura voadora", v: 21000, l: "Tormenta20", p: 345 },
      { b: "53-54", n: "Símbolo abençoado", v: 21000, l: "Tormenta20", p: 345 },
      { b: "55", n: "Colar de presas", v: 21000, l: "Deuses de Arton", p: 57 },
      { b: "56", n: "Vestido noturno", v: 21000, l: "Deuses de Arton", p: 58 },
      { b: "57", n: "Anel da beleza ilusória", v: 21000, l: "Heróis de Arton", p: 263 },
      { b: "58", n: "Bastão do sonhador", v: 21000, l: "Heróis de Arton", p: 263 },
      { b: "59", n: "Colar da fúria monstruosa", v: 21000, l: "Heróis de Arton", p: 264 },
      { b: "60", n: "Coroa da floresta sussurrante", v: 21000, l: "Heróis de Arton", p: 265 },
      { b: "61", n: "Espelho da verdade", v: 21000, l: "Heróis de Arton", p: 265 },
      { b: "62", n: "Instrumentos da celeridade", v: 22500, l: "Heróis de Arton", p: 266 },
      { b: "63", n: "Máscara do predador", v: 22500, l: "Heróis de Arton", p: 266 },
      { b: "64-65", n: "Frigideira do chef anão", v: 24000, l: "Heróis de Arton", p: 266 },
      { b: "66", n: "Gema da santificação", v: 24000, l: "Heróis de Arton", p: 266 },
      { b: "67", n: "Cubo armadilha", v: 25000, l: "Deuses de Arton", p: 56 },
      { b: "68", n: "Caldeirão da vida", v: 25000, l: "Deuses de Arton", p: 57 },
      { b: "69-72", n: "Amuleto da robustez", v: 25500, l: "Tormenta20", p: 342 },
      { b: "73-74", n: "Botas velozes", v: 25500, l: "Tormenta20", p: 342 },
      { b: "75-78", n: "Cinto da força do gigante", v: 25500, l: "Tormenta20", p: 343 },
      { b: "79-82", n: "Coroa majestosa", v: 25500, l: "Tormenta20", p: 344 },
      { b: "83-86", n: "Estola da serenidade", v: 25500, l: "Tormenta20", p: 344 },
      { b: "87", n: "Manto do morcego", v: 25500, l: "Tormenta20", p: 344 },
      { b: "88-91", n: "Pulseiras da celeridade", v: 25500, l: "Tormenta20", p: 345 },
      { b: "92-95", n: "Tiara da sapiência", v: 25500, l: "Tormenta20", p: 345 },
      { b: "96-97", n: "Argolas místicas", v: 25500, l: "Deuses de Arton", p: 59 },
      { b: "98", n: "Bastão da grande harmonia", v: 25500, l: "Heróis de Arton", p: 263 },
      { b: "99", n: "Coroa da majestade distorcida", v: 25500, l: "Heróis de Arton", p: 265 },
      { b: "100", n: "Bracelete do coração vivaz", v: 27000, l: "Heróis de Arton", p: 264 },
    ]
  },
  bloco3: {
    titulo: "ACESSÓRIOS MAIORES",
    linhas: [
      { b: "01-02", n: "Elmo do teletransporte", v: 30000, l: "Tormenta20", p: 344 },
      { b: "03-04", n: "Gema da telepatia", v: 30000, l: "Tormenta20", p: 344 },
      { b: "05-06", n: "Gema elemental", v: 30000, l: "Tormenta20", p: 344 },
      { b: "07-11", n: "Manual da saúde corporal", v: 30000, l: "Tormenta20", p: 345 },
      { b: "12-16", n: "Manual do bom exercício", v: 30000, l: "Tormenta20", p: 345 },
      { b: "17-21", n: "Manual dos movimentos precisos", v: 30000, l: "Tormenta20", p: 345 },
      { b: "22-26", n: "Medalhão de Lena", v: 30000, l: "Tormenta20", p: 345 },
      { b: "27-31", n: "Tomo da compreensão", v: 30000, l: "Tormenta20", p: 345 },
      { b: "32-36", n: "Tomo da liderança e influência", v: 30000, l: "Tormenta20", p: 345 },
      { b: "37-41", n: "Tomo dos grandes pensamentos", v: 30000, l: "Tormenta20", p: 345 },
      { b: "42-44", n: "Anel da chama dançante", v: 30000, l: "Heróis de Arton", p: 263 },
      { b: "45-46", n: "Chapéu pensador", v: 30000, l: "Heróis de Arton", p: 264 },
      { b: "47-48", n: "Cinto da flecha veloz", v: 30000, l: "Heróis de Arton", p: 264 },
      { b: "49-50", n: "Gema da profanação", v: 30000, l: "Heróis de Arton", p: 266 },
      { b: "51-53", n: "Tomo da técnica definitiva", v: 30000, l: "Heróis de Arton", p: 267 },
      { b: "54-55", n: "Tapeçaria da guerra", v: 35000, l: "Deuses de Arton", p: 55 },
      { b: "56-57", n: "Braceletes da amizade intensa", v: 36000, l: "Heróis de Arton", p: 264 },
      { b: "58", n: "Cilício vivo", v: 37000, l: "Deuses de Arton", p: 55 },
      { b: "59", n: "Coração corrompido", v: 45000, l: "Deuses de Arton", p: 55 },
      { b: "60-61", n: "Coração do inverno", v: 45000, l: "Heróis de Arton", p: 265 },
      { b: "62-63", n: "Tomo dos companheiros", v: 45000, l: "Heróis de Arton", p: 267 },
      { b: "64-65", n: "Anel refletor", v: 51000, l: "Tormenta20", p: 342 },
      { b: "66-67", n: "Cinto do campeão", v: 51000, l: "Tormenta20", p: 343 },
      { b: "68-71", n: "Colar guardião", v: 51000, l: "Tormenta20", p: 343 },
      { b: "72-73", n: "Estatueta animista", v: 51000, l: "Tormenta20", p: 344 },
      { b: "74-75", n: "Anel da liberdade", v: 60000, l: "Tormenta20", p: 342 },
      { b: "76-77", n: "Tapete voador", v: 60000, l: "Tormenta20", p: 345 },
      { b: "78-79", n: "Chave dos planos", v: 60000, l: "Heróis de Arton", p: 264 },
      { b: "80-81", n: "Cinto da desmaterialização", v: 60000, l: "Heróis de Arton", p: 264 },
      { b: "82-85", n: "Braceletes de ouro", v: 64500, l: "Tormenta20", p: 342 },
      { b: "86-87", n: "Espelho da oposição", v: 75000, l: "Tormenta20", p: 344 },
      { b: "88-91", n: "Robe do arquimago", v: 90000, l: "Tormenta20", p: 345 },
      { b: "92-93", n: "Ossos dracônicos", v: 90000, l: "Deuses de Arton", p: 56 },
      { b: "94-95", n: "Orbe das tempestades", v: 97500, l: "Tormenta20", p: 345 },
      { b: "96-97", n: "Braçadeiras da força do colosso", v: 120000, l: "Heróis de Arton", p: 264 },
      { b: "98-99", n: "Anel da regeneração", v: 150000, l: "Tormenta20", p: 342 },
      { b: "100", n: "Espelho do aprisionamento", v: 150000, l: "Tormenta20", p: 344 },
    ]
  },
};

/* ===== RIQUEZAS (valor) ===== */
var RIQUEZAS = [
  { menor: [1, 25], media: null, maior: null, valor: "4d4 (10)", exemplo: "0,5 espaço: ágata trincada, anel de hematita, bule de chá com gravações em prata, 1d4+1 soldadinhos de chumbo do Exército do Reinado, jarro de mel, prato de bronze, tapeçaria simples sem moldura, tinta de tecido suficiente para uma roupa; 1 espaço: caixa com velas aromáticas, estandarte em algodão de um nobre menor, kobold de pelúcia em tamanho natural, roldana de ferro; 2 espaços: barrilete de óleo cru, espantalho imitando um hynne nobre, rolo de algodão tecido, tela para pintura; 5 espaços: barril de farinha ou gaiola com galinhas." },
  { menor: [26, 40], media: null, maior: null, valor: "1d4x10 (25)", exemplo: "0,5 espaço: colar de presas de bulette, livreto de poesia bucaneira, quartzo rosa, topázio; 1 espaço: ânfora de prata com símbolo de Marah (vale o dobro em um templo da deusa), caixa de tabaco, rolo de linho, urna de sais aromáticos (pode ser usada como ingrediente para preparados), saco com penas de hipossauro; 2 espaços: conjunto de talheres de prata, jarro de especiarias, como canela, gorad, pimenta ou sal; 5 espaços: candelabro de bronze, colchão de palha de boa qualidade; —: vaca leiteira (irá acompanhá-lo se você for treinado em Adestramento)" },
  { menor: [41, 55], media: [1, 10], maior: null, valor: "2d4x10 (50)", exemplo: "0,5 espaço: ampulheta, arreios de prata, barra de gorad, bracelete de ouro finamente trabalhado, cadeado de latão de boa qualidade, leque de bambu e seda, garrafa com água das profundezas do Mar Negro (supostamente possui propriedades mágicas); 1 espaço: bengala de ébano com uma cabeça de serpente de marfim, estatueta de osso entalhado, frutas exóticas (estragam em 2d4 dias), lamparina de ouro (vale o dobro para um devoto de Azgher), livro de crônicas roramarianas, livro de receitas campeiras de Namalkah, molde para fabricar velas, rolo de seda 2 espaço: brazeiro de latão decorado, cobertor para montaria, couro curtido de um burafonte, vaso de prata." },
  { menor: [56, 70], media: [11, 30], maior: null, valor: "4d6x10 (140)", exemplo: "0,5 espaço: ametista, cartas de um nobre falecido (seus descendentes podem pagar o dobro), frasco de tinta allavir, pente de madeira Tollon, pérola branca, suspensórios elegantes; 1 espaço: caixa com 5 pares de meias de seda, cálice de prata com gemas de lápis-lazúli, estojo com sinete e apetrechos burocráticos (vale o dobro para o proprietário original), lingote de prata, sapatilha élfica confortável, tiara sinuosa própria para uma medusa, traje de festa exclusivo (concede +2 em Diplomacia durante a primeira cena em que for usado); 2 espaços: alvo para disparos sofisticado (treinar nele fornece +1 em Pontaria até o fim da aventura, mas o destrói), bloco de gelo das Uivantes (derrete em 1d6+3 dias), estatueta de uma cocatriz com olhos de madrepérola; 5 espaços: tapeçaria grande e bem-feita de lã; 20 espaços: porta de madeira maciça finamente entalhada." },
  { menor: [71, 85], media: [31, 50], maior: [1, 5], valor: "1d6x100 (350)", exemplo: "0,5 espaço: alexandrita, pérola negra, peruca de crina de pégaso; 1 espaço: caleidoscópio de bronze com imagens doheritas, espada cerimonial ornada com prata e gema negra no cabo, toga tapistana com barra bordada em ouro, pente de prata com pedras preciosas, roda de queijo de seiva de galhada (rende 12 fatias; cada uma recupera 1d4+1 PV), sapatos de dança em couro de serpe; 2 espaços: relógio de parede kliren; 5 espaços: cadeira de madeira Tollon, cavalo de balanço com crina de verdade; 10 espaços: conjunto de velas de um galeão; —: carruagem (pode ser puxada por um animal de tração ou arrastada por um personagem como um item que ocupa 20 espaços)." },
  { menor: [86, 95], media: [51, 65], maior: [6, 15], valor: "2d6x100 (700)", exemplo: "0,5 espaço: baralho de Wyrt com tinta de ouro, bracelete banhado em adamante, condecoração militar da Guerra Artoniana; 1 espaço: escultura de vidro feito com areia de Halak-Tur, estatueta de Valkaria em prata azulada, pente em forma de dragão com olhos de gema vermelha, máscara teatral de marfim com pedras preciosas, réplica do machado Zakharin (portá-lo é crime no Reinado), vestido digno de uma princesa; 2 espaços: telescópio portátil; 5 espaços: barril de cerveja fina de Doherimm, harpa de madeira exótica com ornamentos de zircão e marfim; 10 espaços: tronco de madeira Tollon." },
  { menor: [96, 99], media: [66, 80], maior: [16, 25], valor: "2d8x100 (900)", exemplo: "0,5 espaço: brinco com uma joia de aço-rubi, opala negra, tapa-olho com um olho falso de safira; 1 espaço: luva bordada e adornada com gemas, pingente de opala vermelha com corrente de ouro; 2 espaços: gaiola de prata para falcoaria, lingote de ouro, pintura antiga; 5 espaços: barril de especiarias de Moreania; —: carroça cheia de mercadorias comuns (pode ser puxada por um animal de tração ou arrastada por um personagem como um item que ocupa 20 espaços)." },
  { menor: [100, 100], media: [81, 90], maior: [26, 40], valor: "4d10x100 (2.200)", exemplo: "0,5 espaço: esmeralda verde, pingente de safira; 1 espaço: caixinha de música de ouro, ovo de grifo (com tempo e cuidado, pode ser transformado em um parceiro grifo iniciante), tornozeleira com gemas; 2 espaços: manto bordado em veludo e seda com inúmeras pedras preciosas; 5 espaços: berço de madeira Tollon com detalhes em ouro, chafariz de mármore para fonte de jardim, conjunto de taças de cristal em caixote; 20 espaços: coluna de mármore em estilo neogórdio." },
  { menor: null, media: [91, 95], maior: [41, 60], valor: "6d12x100 (3.900)", exemplo: "0,5 espaços: anel de prata e safira, correntinha com pequenas pérolas rosas, diamante branco, pingente de ouro com um topázio em forma de Marah; 1 espaço: espelho feito na Pondsmânia (adiciona traços feéricos ao reflexo do usuário); 2 espaços: miniatura mecânica de um dragão feita por um inventor renomado, tábua de granito com reprodução da Tarvica em letras de ouro, vestido digno de uma rainha; 5 espaços: ídolo de ouro puro maciço, quadro élfico em estilo sobrenaturalista; 100 espaços: bloco de mármore bruto." },
  { menor: null, media: [96, 99], maior: [61, 75], valor: "2d10x1.000 (11.000)", exemplo: "0,5 espaço: anel de ouro e rubi, diamante vermelho; 1 espaço: tiara de mitral cravejada de rubis; 2 espaços: conjunto de taças de ouro decoradas com esmeraldas; 5 espaços: busto de Tanna-Toh esculpido por um artista famoso, globo de Arton com pedras preciosas marcando os pontos de interesse conhecidos; 10 espaços: quadro do arquimago Vectorius em tamanho natural; 20 espaços: piano em madeira Tollon com cordas de mitral e teclas de marfim de Galrasia, estátua dourada de Klunk." },
  { menor: null, media: [100, 100], maior: [76, 85], valor: "6d8x1.000 (27.000)", exemplo: "1 espaço: coroa de ouro adornada com centenas de gemas que pertenceu a um antigo monarca; 2 espaço: baú de mitral com coleção de diamantes, tapeçaria da Tormenta em estilo grigoriano (observá-la fornece 1 PM temporário para devotos de Aharadak uma vez por dia); 5 espaço: estatueta de gelo eterno com uma essência elemental agitada em seu interior; 20 espaços: meteorito de adamante bruto, sino de catedral de ouro maciço." },
  { menor: null, media: null, maior: [86, 95], valor: "1d10x10.000 (55.000)", exemplo: "1 espaço: elmo de matéria vermelha com detalhes em rubis e turmalinas; 10 espaços: altar religioso em granito e onix com inscrições em ouro, sarcófago de ouro cravejado de gemas; 20 espaços: arca de madeira reforçada repleta de lingotes de prata e ouro e pedras preciosas de vários tipos; —: carruagem de luxo em madeira Tollon banhada a ouro com detalhes em metais finos e pedras preciosas (pode ser puxada por um animal de tração ou arrastada por um personagem como um item que ocupa 20 espaços)." },
  { menor: null, media: null, maior: [96, 100], valor: "4d12x10.000 (260.000)", exemplo: "20 espaços: estátua titanoteica em aventurina de uma divindade do Panteão; —: uma sala forrada de moedas (mover todo esse dinheiro exige trabalhadores e carroças, ou outra ideia por parte dos jogadores, além de atrair a atenção de bandidos, coletores de impostos e aproveitadores de vários tipos)." },
];

/* ===== RIQUEZAS — ESPAÇOS (1d20) ===== */
var RIQUEZAS_ESPACOS = [
  { d: [1, 4], espacos: 0.5, desc: "Um item muito pequeno ou leve, como um anel, um par de brincos ou uma gema." },
  { d: [5, 8], espacos: 1.0, desc: "Um item comum, como um cálice, uma estatueta ou um par de braceletes." },
  { d: [9, 12], espacos: 2.0, desc: "Um item volumoso ou pesado, como uma arma de duas mãos ou um baú." },
  { d: [13, 15], espacos: 5.0, desc: "Um item muito volumoso ou pesado, como uma armadura completa ou um barril." },
  { d: [16, 17], espacos: 10.0, desc: "Um item extremamente volumoso ou pesado, como um quadro que ocupa uma parede inteira ou um busto de pedra." },
  { d: [18, 19], espacos: 20.0, desc: "Um item mais volumoso ou pesado que uma pessoa, como uma arca repleta de moedas ou uma estátua de pedra." },
  { d: [20, 20], espacos: 100.0, desc: "Algo tão volumoso ou pesado que só pode ser carregado por várias pessoas e/ou veículos, como uma coleção de estátuas em tamanho real." },
];

// ===== sub_tabelas.js (copiado de public/espolio/sub_tabelas.js, sem alteração) =====
/* =========================================================
   ESPÓLIO — SUB-TABELAS DE TESOURO
   Funções copiadas/reaproveitadas de calculadoraND_Tormenta
   (baseadas no Excel de tesouros T20 + expansões de Arton).
   ========================================================= */

// Seleciona item de uma tabela [[item, peso], ...] com bônus opcional
function rollTabela(tabela, bonus) {
	var total = 0;
	for (var i = 0; i < tabela.length; i++) total += tabela[i][1];
	var roll = Math.floor(Math.random() * total) + 1 + (bonus || 0);
	if (roll > total) roll = total;
	var acc = 0;
	for (var i = 0; i < tabela.length; i++) {
		acc += tabela[i][1];
		if (roll <= acc) {
			registrarRolagem('sub-tabela → ' + tabela[i][0], roll);
			return tabela[i][0];
		}
	}
	registrarRolagem('sub-tabela → ' + tabela[tabela.length - 1][0], roll);
	return tabela[tabela.length - 1][0];
}

// ─────────────── ITENS ESPECÍFICOS (d100) ───────────────
// Tabelas extraídas do xlsx oficial de tesouros T20.

var ARMAS_ESPECIFICAS = [
	["Adaga da bruma",2],
	["Adaga ofídica",1],
	["Adaga sorrateira",1],
	["Alabarda da coragem",1],
	["Alfange dourado",1],
	["Alguma coisa de Nimb...",1],
	["Arco das sombras",3],
	["Arco do crepúsculo",2],
	["Arco do poder",3],
	["Avalanche",3],
	["Azagaia dos relâmpagos",3],
	["Azagaia fantasma",2],
	["Besta estelar",3],
	["Besta explosiva",3],
	["Bordão sabichão",1],
	["Cajado das matas",1],
	["Cimitarra solar",1],
	["Clava de lava",2],
	["Espada baronial",3],
	["Espada da tempestade",2],
	["Espada do guardião",3],
	["Espada imaculada",1],
	["Espada monástica",1],
	["Espada solar",2],
	["Espada sortuda",3],
	["Florete do vendaval",2],
	["Florete fugaz",3],
	["Katana da determinação",1],
	["Lâmina da luz",3],
	["Lança animalesca",3],
	["Lança da dominação",1],
	["Lança da fênix",2],
	["Língua do deserto",3],
	["Maça do terror",3],
	["Maça monstruosa",1],
	["Machado da bravura",1],
	["Machado da natureza",2],
	["Machado do abismo",2],
	["Machado do vulcão",3],
	["Machado lamnoriano",1],
	["Machado silvestre",3],
	["Mangual aventureiro",1],
	["Martelo da terra",2],
	["Martelo de Doherimm",3],
	["Martelo do titã",2],
	["Punhal das profundezas",2],
	["Punhal sszzaazita",3],
	["Tridente aquoso",1],
	["Vingadora sagrada",3]
];

var ARMADURAS_ESPECIFICAS = [
	["Armadura da luz",4],
	["Armadura das sombras profundas",4],
	["Armadura do dragão ancião",4],
	["Armadura do inverno perene",4],
	["Armadura do julgamento",2],
	["Baluarte anão",4],
	["Carapaça demoníaca",4],
	["Cota da serpente marinha",4],
	["Cota élfica",10],
	["Couraça do comando",4],
	["Couraça do guardião celeste",4],
	["Couro de monstro",4],
	["Escudo da ira vulcânica",4],
	["Escudo da luz estelar",4],
	["Escudo da natureza viva",4],
	["Escudo de Azgher",4],
	["Escudo do conjurador",4],
	["Escudo do eclipse",4],
	["Escudo do grifo",4],
	["Escudo do leão",6],
	["Escudo do trovão",4],
	["Escudo espinhoso",4],
	["Loriga do centurião",4],
	["Manto da noite",2]
];

var ESOTERICOS_ESPECIFICOS = [
	["Cajado da destruição",20],
	["Cajado da vida",20],
	["Cajado das marés",5],
	["Cajado do poder",15],
	["Cálice sagrado",15],
	["Relógio do arcanista",10],
	["Varinha da generosidade",10],
	["Varinha milenar",5]
];

// Rola numa tabela de encantos; quando cai na faixa "específico",
// resolve de fato na tabela de itens específicos correspondente (tipo).
// tipo: 'arma', 'armadura' ou 'esoterico'
function rollTabelaComEspecifico(tabela, tipo) {
	var resultado = rollTabela(tabela);
	if (resultado.indexOf('específ') >= 0) {
		var tabelaEsp = tipo === 'arma' ? ARMAS_ESPECIFICAS :
		                tipo === 'armadura' ? ARMADURAS_ESPECIFICAS :
		                ESOTERICOS_ESPECIFICOS;
		resultado = '🏆 ' + rollTabela(tabelaEsp);
	}
	return resultado;
}

// Escolha entre dois resultados
function doisDados(funcaoExistente) {
	var resultado1 = funcaoExistente();
	var resultado2 = funcaoExistente();
	return "Escolha entre: " + resultado1 + " ou " + resultado2 + ".";
}

// ─────────────── MATERIAL ESPECIAL ───────────────
function getMaterialEspecial() {
	var materiais = ["aço-rubi", "adamante", "gelo eterno", "madeira Tollon", "matéria vermelha", "mitral"];
	return materiais[Math.floor(Math.random() * 6)];
}

// ─────────────── ITENS DIVERSOS (d100) ───────────────
function getDiverso() {
	var tabela = [
		["Ácido", 1], ["Água benta", 1], ["Alaúde élfico", 1], ["Algemas", 1],
		["Baga-de-fogo", 1], ["Bálsamo restaurador", 3], ["Bandana", 1],
		["Bandoleira de poções", 1], ["Bomba", 1], ["Botas reforçadas", 1],
		["Camisa bufante", 1], ["Capa esvoaçante", 1], ["Capa pesada", 1],
		["Casaco longo", 1], ["Chapéu arcano", 1], ["Coleção de livros", 1],
		["Cosmético", 1], ["Dente-de-dragão", 1], ["Enfeite de elmo", 1],
		["Elixir do amor", 1], ["Equipamento de viagem", 1], ["Essência de mana", 3],
		["Estojo de disfarces", 1], ["Farrapos de ermitão", 1], ["Flauta mística", 1],
		["Fogo alquímico", 1], ["Gorro de ervas", 1], ["Líquen lilás", 1],
		["Luneta", 1], ["Luva de pelica", 1], ["Maleta de medicamentos", 1],
		["Manopla", 1], ["Manto eclesiástico", 1], ["Mochila de aventureiro", 1],
		["Musgo púrpura", 1], ["Organizador de pergaminhos", 1], ["Ossos de monstro", 1],
		["Pó de cristal", 1], ["Pó de giz", 1], ["Pó do desaparecimento", 1],
		["Robe místico", 1], ["Saco de sal", 1], ["Sapatos de camurça", 1],
		["Seixo de âmbar", 1], ["Sela", 1], ["Tabardo", 1], ["Traje da corte", 1],
		["Terra de cemitério", 1], ["Veste de seda", 1],
		// Ameaças de Arton
		["Corda de teia", 1], ["Dente de wisphago", 1], ["Bomba de fumaça", 1],
		["Elixir quimérico", 1], ["Éter elemental", 1], ["Óleo de besouro", 1],
		// Deuses de Arton
		["Água benta concentrada", 1], ["Aspersório", 1], ["Patuá", 1],
		["Panfleto de aforismos", 1], ["Texto sagrado", 1], ["Hábito sacerdotal", 1],
		["Manto de alto sacerdote", 1], ["Sandálias", 1], ["Piercing de umbigo", 1],
		["Incenso", 1], ["Santa granada de mão", 1], ["Fitilho consagrado", 1],
		["Pena de anjo", 1],
		// Heróis de Arton
		["Ábaco", 1], ["Ampulheta", 1], ["Astrolábio", 1], ["Bainha adornada", 1],
		["Bússola", 1], ["Diagrama anatômico", 1], ["Estrepes", 1],
		["Lampião de foco", 1], ["Leque", 1], ["Lupa", 1],
		["Mapa (mestre define de qual região)", 1], ["Mecanismo de mola", 1],
		["Mochila discreta", 1], ["Sinete", 1], ["Apito de caça", 1],
		["Baralho marcado", 1], ["Clarim deheoni", 1], ["Pandeiro das estradas", 1],
		["Camisolão", 1], ["Casaca de apetrechos", 1], ["Chapéu emplumado", 1],
		["Elmo leve", 1], ["Elmo pesado", 1], ["Rondel", 1],
		["Sapatos confortáveis", 1], ["Sapatos de salto alto", 1],
		["Ácido concentrado", 1], ["Frasco abissal", 1]
	];
	return rollTabela(tabela);
}

// ─────────────── ARMAS (d100) ───────────────
function getArma() {
	var tabela = [
		["Açoite finntroll",1],["Adaga",1],["Adaga oposta",1],["Agulha de Ahlen",1],
		["Alabarda",1],["Alfange",1],["Arcabuz",1],["Arco curto",1],
		["Arco de guerra",1],["Arco longo",1],["Arco montado",1],["Arpão",1],
		["Azagaia",1],["Bacamarte",1],["Balas (20)",1],["Balestra",1],
		["Bastão lúdico",1],["Besta de mão",1],["Besta de repetição",1],
		["Besta dupla",1],["Besta leve",1],["Besta pesada",1],["Bico de corvo",1],
		["Boleadeira",1],["Bordão",1],["Canhão portátil",1],["Chakram",1],
		["Chicote",1],["Cimitarra",1],["Cinquedea",1],["Clava",1],["Clava-grão",1],
		["Corrente de espinhos",1],["Desmontador",1],["Dirk",1],
		["Espada bastarda",1],["Espada canora",1],["Espada curta",1],
		["Espada de execução",1],["Espada larga",1],["Espada longa",1],
		["Espada vespa",1],["Espada-gadanho",1],["Espadim",1],
		["Flechas (20)",1],["Flechas de caça (20)",1],["Florete",1],["Foice",1],
		["Funda",1],["Gadanho",1],["Garrucha",1],["Gládio",1],["Katana",1],
		["Khopesh",1],["Kimbata",1],["Lança",1],["Lança de falange",1],
		["Lança de fogo",1],["Lança de justa",1],["Lança montada",1],
		["Maça",1],["Maça-estrela",1],["Machadinha",1],["Machado anão",1],
		["Machado de batalha",1],["Machado de guerra",1],["Machado de haste",1],
		["Machado táurico",1],["Malho",1],["Mangual",1],["Marrão",1],
		["Marreta",1],["Martelo de guerra",1],["Martelo leve",1],
		["Martelo longo",1],["Montante",1],["Montante cinético",1],
		["Mordida do diabo",1],["Mosquete",1],["Neko-te",1],["Pedras (20)",1],
		["Picareta",1],["Pique",1],["Pistola",1],["Pistola-punhal",1],
		["Porrete",1],["Presa de serpente",1],["Rapieira",1],["Rede",1],
		["Serrilheira",1],["Shuriken",1],["Sifão cáustico",1],["Tacape",1],
		["Tai-tai",1],["Tan-korak",1],["Tetsubo",1],["Traque",1],
		["Tridente",1],["Virotes (20)",1],["Zarabatana",1]
	];
	return rollTabela(tabela);
}

// ─────────────── ARMADURAS & ESCUDOS (d100) ───────────────
function getArmadura() {
	var tabela = [
		["Armadura de chumbo",2],["Armadura de engenhoqueiro goblin",2],
		["Armadura de folhas",2],["Armadura de hussardo alado",2],
		["Armadura de justa",2],["Armadura de ossos",1],
		["Armadura de pedra",2],["Armadura de quitina",1],
		["Armadura sensual",2],["Brigantina",4],["Broquel",2],["Brunea",4],
		["Colete fora da lei",2],["Armadura Completa",10],["Cota de malha",4],
		["Cota de moedas",2],["Couraça",10],["Armadura de Couro",4],
		["Armadura de Couro batido",6],["Escudo de couro",1],
		["Escudo de vime",1],["Escudo leve",8],["Escudo pesado",8],
		["Escudo torre",2],["Gibão de peles",4],["Loriga segmentada",4],
		["Meia armadura",6],["Sagna",1],["Veste de teia de aranha",1]
	];
	return rollTabela(tabela);
}

// ─────────────── ESOTÉRICOS (d100) ───────────────
function getEsoterico() {
	var tabela = [
		["Afiador solar",3],["Ankh solar",3],["Báculo da retribuição",4],
		["Bolsa de pó",4],["Cajado arcano",4],["Cetro elemental",4],
		["Compasso místico",4],["Contas de oração",4],["Costela de lich",4],
		["Dedo de ente",4],["Estola",4],["Flauta convocadora",4],
		["Frasco purificador",4],["Luva de ferro",4],["Mandala onírica",4],
		["Medalhão afiado",4],["Medalhão de prata",4],["Orbe cristalino",4],
		["Ostensório santificado",4],["Rede de almas",4],["Tomo de guerra",3],
		["Tomo do rancor",3],["Tomo hermético",4],["Turíbulo ungido",4],
		["Varinha arcana",4],["Varinha armamentista",4]
	];
	return rollTabela(tabela);
}

// ─────────────── POÇÕES (d100 + bônus +% opcional) ───────────────
// Itens 101-120 só acessíveis com bonus=20 (+%)
function getPocao(bonus) {
	var tabela = [
		["Abençoar Alimentos (óleo) — T$ 30",1],
		["Área Escorregadia (granada) — T$ 30",1],
		["Arma Mágica (óleo) — T$ 30",2],
		["Poção de Compreensão — T$ 30",1],
		["Poção de Curar Ferimentos (2d8+2 PV) — T$ 30",6],
		["Poção de Disfarce Ilusório — T$ 30",2],
		["Escuridão (óleo) — T$ 30",2],
		["Luz (óleo) — T$ 30",2],
		["Névoa (granada) — T$ 30",1],
		["Poção de Primor Atlético — T$ 30",1],
		["Poção de Sono — T$ 30",1],
		["Poção de Proteção Divina — T$ 30",2],
		["Poção de Resistência a Energia — T$ 30",2],
		["Poção de Suporte Ambiental — T$ 30",1],
		["Tranca Arcana (óleo) — T$ 30",1],
		["Poção de Visão Mística — T$ 30",1],
		["Poção de Vitalidade Fantasma — T$ 30",1],
		["Poção de Armadura Elemental — T$ 30",1],
		["Poção de Desafio Corajoso — T$ 30",1],
		["Poção de Discrição — T$ 30",1],
		["Poção de Farejar Fortuna — T$ 30",1],
		["Poção de Maaais Klunc — T$ 30",1],
		["Poção de Ossos de Adamante — T$ 30",1],
		["Poção de Punho de Mitral — T$ 30",1],
		["Poção de Magia Dadivosa — T$ 30",1],
		["Poção de Sigilo de Sszzaas — T$ 30",1],
		["Poção de Sorriso da Fortuna — T$ 30",1],
		["Poção de Toque de Megalokk — T$ 30",1],
		["Poção de Voz da Razão — T$ 30",1],
		["Poção de Escudo da Fé (duração cena) — T$ 120",2],
		["Poção de Alterar Tamanho — T$ 270",2],
		["Poção de Aparência Perfeita — T$ 270",1],
		["Armamento da Natureza (óleo) — T$ 270",1],
		["Bola de Fogo (granada) — T$ 270",4],
		["Poção de Camuflagem Ilusória — T$ 270",1],
		["Poção de Concentração de Combate (duração cena) — T$ 270",1],
		["Poção de Curar Ferimentos (4d8+4 PV) — T$ 270",4],
		["Poção de Físico Divino — T$ 270",2],
		["Poção de Mente Divina — T$ 270",1],
		["Poção de Metamorfose — T$ 270",1],
		["Poção de Purificação — T$ 270",4],
		["Poção de Velocidade — T$ 270",2],
		["Vestimenta da Fé (óleo) — T$ 270",2],
		["Poção de Voz Divina — T$ 270",1],
		["Poção de Orientação (duração cena; role atributo: 1=For 2=Des 3=Con 4=Int 5=Sab 6=Car) — T$ 270",2],
		["Poção de Aura de Morte — T$ 270",1],
		["Poção de Emular Magia — T$ 270",1],
		["Poção de Punho de Mitral (+2 ataque e ameaça) — T$ 270",1],
		["Poção de Viagem Onírica — T$ 270",1],
		["Couraça de Allihanna (óleo) — T$ 270",1],
		["Poção de Toque de Megalokk (aprimorado) — T$ 480",1],
		["Arma Mágica (óleo, bônus +3) — T$ 750",2],
		["Poção de Proteção Divina (+4) — T$ 750",2],
		["Poção de Armadura Elemental (4d6 dano) — T$ 750",1],
		["Poção de Curar Ferimentos (7d8+7 PV) — T$ 1.080",6],
		["Poção de Físico Divino (três atributos) — T$ 1.080",2],
		["Poção de Invisibilidade (duração cena) — T$ 1.080",2],
		["Poção de Pele de Pedra — T$ 1.080",2],
		["Poção de Potência Divina — T$ 1.080",1],
		["Poção de Voo — T$ 1.080",1],
		["Poção de Percepção Rubra (+3) — T$ 1.080",1],
		["Bola de Fogo (granada, 10d6) — T$ 1.470",3],
		// 101-120: só acessíveis com +%
		["Poção de Curar Ferimentos (11d8+11 PV) — T$ 3.000",10],
		["Poção de Pele de Pedra (pele de aço, RD 10) — T$ 3.000",4],
		["Poção de Premonição — T$ 3.000",2],
		["Poção de Viagem Onírica (falar e lançar magias) — T$ 3.000",1],
		["Poção de Potência Divina (Força +6, RD 15) — T$ 6.750",1],
		["Momento de Tormenta (granada, aprimorado) — T$ 6.750",1],
		["Poção de Transformação em Dragão — T$ 28.000",1]
	];
	return rollTabela(tabela, bonus || 0);
}

// ─────────────── RIQUEZAS ───────────────
function getRiquezaMenor(bonus) {
	var tabela = [
		["4d4 (10 T$) — Ex.: ágata, hematita, barril de farinha",25],
		["1d4×10 (25 T$) — Ex.: quartzo rosa, topázio, caixa de tabaco",15],
		["2d4×10 (50 T$) — Ex.: bracelete de ouro trabalhado, estatueta de osso",15],
		["4d6×10 (140 T$) — Ex.: ametista, pérola branca, lingote de prata",15],
		["1d6×100 (350 T$) — Ex.: alexandrita, pérola negra, espada cerimonial de prata",15],
		["2d6×100 (700 T$) — Ex.: pente de dragão com gemas, harpa exótica",10],
		["2d8×100 (900 T$) — Ex.: opala negra, tapa-olho com safira falsa, lingote de ouro",4],
		["4d10×100 (2.200 T$) — Ex.: esmeralda verde, pingente de safira, caixinha de música",1]
	];
	return rollTabela(tabela, bonus || 0);
}

function getRiquezaMedia(bonus) {
	var tabela = [
		["2d4×10 (50 T$) — Ex.: bracelete de ouro, estatueta de osso",10],
		["4d6×10 (140 T$) — Ex.: ametista, pérola branca, lingote de prata",20],
		["1d6×100 (350 T$) — Ex.: alexandrita, pérola negra, espada cerimonial de prata",20],
		["2d6×100 (700 T$) — Ex.: pente de dragão com gemas, harpa exótica",15],
		["2d8×100 (900 T$) — Ex.: opala negra, tapa-olho com safira falsa, lingote de ouro",15],
		["4d10×100 (2.200 T$) — Ex.: esmeralda verde, pingente safira, caixinha de música",10],
		["6d12×100 (3.900 T$) — Ex.: anel de prata e safira, diamante branco",5],
		["2d10×1.000 (11.000 T$) — Ex.: anel de ouro e rubi, diamante vermelho",4],
		["6d8×1.000 (27.000 T$) — Ex.: coroa de ouro com centenas de gemas",1]
	];
	return rollTabela(tabela, bonus || 0);
}

function getRiquezaMaior(bonus) {
	var tabela = [
		["1d6×100 (350 T$) — Ex.: alexandrita, pérola negra, espada cerimonial de prata",5],
		["2d6×100 (700 T$) — Ex.: pente de dragão com gemas, harpa exótica",10],
		["2d8×100 (900 T$) — Ex.: opala negra, tapa-olho com safira falsa, lingote de ouro",10],
		["4d10×100 (2.200 T$) — Ex.: esmeralda, pingente de safira, caixinha de música",15],
		["6d12×100 (3.900 T$) — Ex.: anel de prata e safira, diamante branco",20],
		["2d10×1.000 (11.000 T$) — Ex.: anel de ouro e rubi, diamante vermelho",15],
		["6d8×1.000 (27.000 T$) — Ex.: coroa de ouro com centenas de gemas",10],
		["1d10×10.000 (55.000 T$) — Ex.: arca de madeira repleta de moedas",10],
		["4d12×10.000 (260.000 T$) — Uma sala forrada de moedas!",5]
	];
	return rollTabela(tabela, bonus || 0);
}

// ─────────────── MELHORIAS DE ARMAS (d100) ───────────────
function getMelhoriaArma() {
	var tabela = [
		["Atroz¹",10],["Banhada a ouro",2],["Certeira",8],
		["Conduíte",1],
		["Cravejada de gemas",2],["Cruel",8],["Discreta",2],["Equilibrada",5],
		["Farpada",4],
		["Guarda",2],
		["Harmonizada",4],["Incendiária",1],["Injeção alquímica",4],
		["Macabra",2],["Maciça",10],
		["Material especial",10],
		["Mira telescópica",4],["Precisa",8],
		["Pressurizada",2],
		["Pungente¹",10],
		["Usada",1]
	];
	var result = rollTabela(tabela);
	if (result === "Material especial") result += ": " + getMaterialEspecial();
	return result;
}

// ─────────────── MELHORIAS DE ARMADURAS (d100) ───────────────
function getMelhoriaArmadura() {
	var tabela = [
		["Ajustada",10],
		["Balístico",4],
		["Banhada a ouro",4],["Cravejada de gemas",4],["Delicada",5],
		["Deslumbrante¹",2],
		["Diligente",2],
		["Discreta",4],["Espinhos",4],
		["Injetora",4],
		["Inscrito",4],
		["Macabra",2],
		["Material especial",10],
		["Polida",5],["Reforçada",20],["Selada",11],["Sob medida¹",5]
	];
	var result = rollTabela(tabela);
	if (result === "Material especial") result += ": " + getMaterialEspecial();
	return result;
}

// ─────────────── MELHORIAS DE ESOTÉRICOS (d100) ───────────────
function getMelhoriaEsoterico() {
	var tabela = [
		["Banhado a ouro",3],["Canalizador",15],
		["Canônico",3],
		["Cravejado de gemas",3],["Discreto",4],
		["Energético",15],["Harmonizado",15],["Macabro",3],
		["Material especial",9],
		["Poderoso",10],
		["Potencializador¹",10],
		["Vigilante",10]
	];
	var result = rollTabela(tabela);
	if (result === "Material especial") result += ": " + getMaterialEspecial();
	return result;
}

// ─────────────── ENCANTOS DE ARMAS MÁGICAS (d100) ───────────────
function getArmaMagica() {
	var tabela = [
		["Alvorada",1],
		["Ameaçadora",4],
		["Anátema",1],
		["Anticriatura",2],["Arremesso",1],["Assassina",1],
		["Brumosa",1],
		["Caçadora",1],
		["Cantante",1],
		["Ciclônica",1],
		["Congelante",4],["Conjuradora",1],["Corrosiva",4],
		["Crescente",2],
		["Cristalina",1],
		["Cronal*",1],
		["Cuidadora",1],
		["Dançarina",2],["Defensora",2],["Destruidora",1],
		["Dilacerante",2],["Drenante",1],["Elétrica",4],
		["Energética*",1],
		["Espreitadora",2],
		["Excruciante",2],["Flamejante",4],["Formidável",8],
		["Frenética",2],
		["Gárgula",1],["Horrenda",1],["Indignada",1],["Infestada",1],
		["Lancinante*",1],
		["Magnífica*",8],
		["Manáfaga",1],
		["Piedosa",2],["Profana",1],
		["Rebote",1],
		["Reflexiva",1],
		["Ressonante",1],
		["Sagrada",1],["Sanguinária",2],
		["Sepulcral",1],
		["Sombria",1],
		["Trovejante",1],["Tumular",1],
		["Vampírica",1],
		["Veloz",2],["Venenosa",1],
		["Arma específica (role na tabela de Armas Mágicas)",10]
	];
	return rollTabelaComEspecifico(tabela, 'arma');
}

// ─────────────── ENCANTOS DE ARMADURAS MÁGICAS (d100) ───────────────
function getEncantoArmadura() {
	var tabela = [
		["Abascanto",2],["Abençoado",2],
		["Abissal",1],
		["Acrobático",1],["Alado",2],
		["Ancorada*",1],
		["Animado**",2],
		["Anulador***",1],
		["Arbóreo",1],
		["Assustador",2],
		["Astuto",1],
		["Cáustica",1],["Defensor",10],
		["Densa*",1],
		["Égide",1],
		["Enraizada*",1],
		["Escorregadio",1],
		["Esmagador**",2],
		["Esmérico",1],
		["Estígio***",2],
		["Etéreo",1],
		["Fantasmagórico",2],["Fortificado",4],["Gélido",1],
		["Geomântico",1],
		["Guardião***",10],
		["Hipnótico",2],["Ilusório",1],["Incandescente",1],["Invulnerável",5],
		["Ligeira*",1],
		["Luminescente",2],
		["Opaco",5],
		["Prístino",1],
		["Protetor",5],
		["Purificador",1],
		["Reanimador",2],
		["Refletor",2],["Relampejante",1],["Reluzente",1],
		["Replicante",1],
		["Resiliente",1],
		["Sombrio",1],
		["Vórtice",1],
		["Zeloso",1],
		["Armadura/Escudo específico (role na tabela de Armaduras Mágicas)",10]
	];
	return rollTabelaComEspecifico(tabela, 'armadura');
}

// ─────────────── ENCANTOS DE ESOTÉRICOS MÁGICOS (d100) ───────────────
function getEncantoEsoterico() {
	var tabela = [
		["Abafador",2],["Bélico",10],["Caridoso",4],["Chocante",4],
		["Clemente",10],["Contido",2],["Embusteiro",2],["Emergencial",2],
		["Encadeado",4],["Escultor",2],["Frugal",2],["Glacial",4],
		["Imperioso",2],
		["Implacável*",2],
		["Incriminador",2],["Inflamável",7],["Inquisidor",4],["Insistente",4],
		["Khalmyrita",2],
		["Majestoso*",10],
		["Nímbico",2],
		["Pulverizante*",1],
		["Retaliador",1],["Sanguessuga",2],["Traiçoeiro",1],["Verdugo",2],
		["Esotérico específico (role na tabela de Esotéricos Mágicos)",10]
	];
	return rollTabelaComEspecifico(tabela, 'esoterico');
}

// ─────────────── ACESSÓRIOS MENORES (d100) ───────────────
function getItemMenor() {
	var tabela = [
		["Algibeira mordedora (T$ 1.000)",1],["Elixir da mente dividida (T$ 1.500)",1],
		["Papiro das estrelas (T$ 1.500)",1],["Anel do sustento (T$ 3.000)",1],
		["Bainha mágica (T$ 3.000)",3],["Corda da escalada (T$ 3.000)",2],
		["Ferraduras da velocidade (T$ 3.000)",1],
		["Garrafa da fumaça eterna (T$ 3.000)",2],
		["Gema da luminosidade (T$ 3.000)",3],["Manto élfico (T$ 3.000)",3],
		["Mochila de carga (T$ 3.000)",3],
		["Amuleto da visão etérea (T$ 3.000)",2],["Cinturão do trobo (T$ 3.000)",2],
		["Elixir da eternidade (T$ 3.000)",2],["Pérola da nulificação (T$ 3.000)",2],
		["Saco dos ventos silenciosos (T$ 3.000)",2],
		["Brincos da sagacidade (T$ 4.500)",5],["Luvas da delicadeza (T$ 4.500)",5],
		["Manoplas da força do ogro (T$ 4.500)",5],
		["Manto da resistência (T$ 4.500)",4],["Manto do fascínio (T$ 4.500)",5],
		["Pingente da sensatez (T$ 4.500)",5],["Torque do vigor (T$ 4.500)",5],
		["Monóculo da franqueza (T$ 4.500)",1],["Chapéu do disfarce (T$ 6.000)",2],
		["Flauta fantasma (T$ 6.000)",1],["Lanterna da revelação (T$ 6.000)",2],
		["Algibeira provedora (T$ 6.000)",2],["Gaiola dos arcanos (T$ 6.000)",2],
		["Lâmpada da ilusão impecável (T$ 6.000)",2],
		["Pena da criação (T$ 6.000)",2],["Corda da resignação (T$ 7.500)",2],
		["Anel da proteção (T$ 9.000)",5],["Anel do escudo mental (T$ 9.000)",1],
		["Pingente da saúde (T$ 9.000)",1],["Coroa de flores (T$ 9.000)",1],
		["Jarro das profundezas (T$ 9.000)",1],
		["Escrivaninha consagrada (T$ 9.000)",1],
		["Anel da proteção mental (T$ 9.000)",1],["Berço das fadas (T$ 9.000)",1],
		["Chapéu dos truques infinitos (T$ 9.000)",1],
		["Cinto da leveza graciosa (T$ 9.000)",1],
		["Cristal da voz silenciosa (T$ 9.000)",1],
		["Cristal do tempo célere (T$ 9.000)",1],
		["Ocarina da melodia distante (T$ 9.000)",1],
		["Olhos do corvo (T$ 9.000)",1],
		["Pergaminho da verdade cósmica (T$ 9.000)",1]
	];
	return rollTabela(tabela);
}

// ─────────────── ACESSÓRIOS MÉDIOS (d100) ───────────────
function getItemMedio() {
	var tabela = [
		["Anel de telecinesia (T$ 10.500)",1],["Bola de cristal (T$ 10.500)",1],
		["Caveira maldita (T$ 10.500)",1],["Instrumento da alegria (T$ 10.500)",1],
		["Ampulheta da harmonia temporal (T$ 10.500)",1],
		["Amuleto do amparo (T$ 10.500)",1],
		["Caixa dos ecos perdidos (T$ 10.500)",1],
		["Colar da perseverança (T$ 10.500)",1],["Colar do tirano (T$ 10.500)",1],
		["Óculos da revelação (T$ 10.500)",1],
		["Colar das bolas de fogo (T$ 12.000)",1],
		["Sandálias de Valkaria (T$ 12.000)",1],["Véu diáfano (T$ 13.500)",1],
		["Botas aladas (T$ 15.000)",1],["Botas inquietas (T$ 15.000)",1],
		["Pira póstera (T$ 15.000)",1],["Anel do pacto oneroso (T$ 15.000)",1],
		["Botas do andarilho das sombras (T$ 15.000)",1],
		["Cálice das marés (T$ 15.000)",1],
		["Cinto dos caminhos cruzados (T$ 15.000)",1],
		["Pedra da passagem (T$ 15.000)",1],
		["Pingente da dor partilhada (T$ 15.000)",1],
		["Braceletes de bronze (T$ 16.500)",4],["Capa nebulosa (T$ 16.500)",1],
		["Espelho do outro lado (T$ 18.000)",1],
		["Gema da purificação (T$ 18.000)",2],["Máscara da raposa (T$ 18.000)",2],
		["Anel da energia (T$ 21.000)",4],["Anel da vitalidade (T$ 21.000)",4],
		["Anel de invisibilidade (T$ 21.000)",2],
		["Braçadeiras do arqueiro (T$ 21.000)",2],
		["Brincos de Marah (T$ 21.000)",2],["Faixas do pugilista (T$ 21.000)",2],
		["Manto da aranha (T$ 21.000)",2],["Vassoura voadora (T$ 21.000)",2],
		["Símbolo abençoado (T$ 21.000)",2],["Colar de presas (T$ 21.000)",1],
		["Vestido noturno (T$ 21.000)",1],["Anel da beleza ilusória (T$ 21.000)",1],
		["Bastão do sonhador (T$ 21.000)",1],
		["Colar da fúria monstruosa (T$ 21.000)",1],
		["Coroa da floresta sussurrante (T$ 21.000)",1],
		["Espelho da verdade (T$ 21.000)",1],
		["Instrumentos da celeridade (T$ 22.500)",1],
		["Máscara do predador (T$ 22.500)",1],
		["Frigideira do chef anão (T$ 24.000)",2],
		["Gema da santificação (T$ 24.000)",1],["Cubo armadilha (T$ 25.000)",1],
		["Caldeirão da vida (T$ 25.000)",1],
		["Amuleto da robustez (T$ 25.500)",4],["Botas velozes (T$ 25.500)",2],
		["Cinto da força do gigante (T$ 25.500)",4],
		["Coroa majestosa (T$ 25.500)",4],["Estola da serenidade (T$ 25.500)",4],
		["Manto do morcego (T$ 25.500)",1],
		["Pulseiras da celeridade (T$ 25.500)",4],
		["Tiara da sapiência (T$ 25.500)",4],
		["Argolas místicas (T$ 25.500)",2],
		["Bastão da grande harmonia (T$ 25.500)",1],
		["Coroa da majestade distorcida (T$ 25.500)",1],
		["Bracelete do coração vivaz (T$ 27.000)",1]
	];
	return rollTabela(tabela);
}

// ─────────────── ACESSÓRIOS MAIORES (d100) ───────────────
function getItemMaior() {
	var tabela = [
		["Elmo do teletransporte (T$ 30.000)",2],
		["Gema da telepatia (T$ 30.000)",2],["Gema elemental (T$ 30.000)",2],
		["Manual da saúde corporal (T$ 30.000)",5],
		["Manual do bom exercício (T$ 30.000)",5],
		["Manual dos movimentos precisos (T$ 30.000)",5],
		["Medalhão de Lena (T$ 30.000)",5],["Tomo da compreensão (T$ 30.000)",5],
		["Tomo da liderança e influência (T$ 30.000)",5],
		["Tomo dos grandes pensamentos (T$ 30.000)",5],
		["Anel da chama dançante (T$ 30.000)",3],
		["Chapéu pensador (T$ 30.000)",2],["Cinto da flecha veloz (T$ 30.000)",2],
		["Gema da profanação (T$ 30.000)",2],
		["Tomo da técnica definitiva (T$ 30.000)",3],
		["Tapeçaria da guerra (T$ 35.000)",2],
		["Braceletes da amizade intensa (T$ 36.000)",2],
		["Cilício vivo (T$ 37.000)",1],["Coração corrompido (T$ 45.000)",1],
		["Coração do inverno (T$ 45.000)",2],["Tomo dos companheiros (T$ 45.000)",2],
		["Anel refletor (T$ 51.000)",2],["Cinto do campeão (T$ 51.000)",2],
		["Colar guardião (T$ 51.000)",4],["estatueta animista (T$ 51.000)",2],
		["Anel da liberdade (T$ 60.000)",2],["Tapete voador (T$ 60.000)",2],
		["Chave dos planos (T$ 60.000)",2],
		["Cinto da desmaterialização (T$ 60.000)",2],
		["Braceletes de ouro (T$ 64.500)",4],
		["Espelho da oposição (T$ 75.000)",2],
		["Robe do arquimago (T$ 90.000)",4],["Ossos dracônicos (T$ 90.000)",2],
		["Orbe das tempestades (T$ 97.500)",2],
		["Braçadeiras da força do colosso (T$ 120.000)",2],
		["Anel da regeneração (T$ 150.000)",2],
		["Espelho do aprisionamento (T$ 150.000)",1]
	];
	return rollTabela(tabela);
}

// ─────────────── EQUIPAMENTO & SUPERIORES ───────────────
function getEquipamento() {
	var r = Math.random();
	if      (r < 0.5)   return getArma();
	else if (r < 0.875) return getArmadura();
	else                return getEsoterico();
}

function getMelhoria() {
	var r = Math.random();
	if      (r < 0.5)   return getArma()      + " [" + getMelhoriaArma()      + "]";
	else if (r < 0.875) return getArmadura()  + " [" + getMelhoriaArmadura()  + "]";
	else                return getEsoterico() + " [" + getMelhoriaEsoterico() + "]";
}

function getMelhoria2() {
	var r = Math.random();
	if (r < 0.5) {
		var m1 = getMelhoriaArma(), m2 = getMelhoriaArma();
		while (m2 === m1) m2 = getMelhoriaArma();
		return getArma() + " [" + m1 + " e " + m2 + "]";
	} else if (r < 0.875) {
		var m1 = getMelhoriaArmadura(), m2 = getMelhoriaArmadura();
		while (m2 === m1) m2 = getMelhoriaArmadura();
		return getArmadura() + " [" + m1 + " e " + m2 + "]";
	} else {
		var m1 = getMelhoriaEsoterico(), m2 = getMelhoriaEsoterico();
		while (m2 === m1) m2 = getMelhoriaEsoterico();
		return getEsoterico() + " [" + m1 + " e " + m2 + "]";
	}
}

function getMelhoria3() {
	var r = Math.random();
	if (r < 0.5) {
		var m1=getMelhoriaArma(),m2=getMelhoriaArma(),m3=getMelhoriaArma();
		while (m2===m1||m3===m1||m3===m2){m2=getMelhoriaArma();m3=getMelhoriaArma();}
		return getArma() + " [" + m1 + ", " + m2 + " e " + m3 + "]";
	} else if (r < 0.875) {
		var m1=getMelhoriaArmadura(),m2=getMelhoriaArmadura(),m3=getMelhoriaArmadura();
		while (m2===m1||m3===m1||m3===m2){m2=getMelhoriaArmadura();m3=getMelhoriaArmadura();}
		return getArmadura() + " [" + m1 + ", " + m2 + " e " + m3 + "]";
	} else {
		var m1=getMelhoriaEsoterico(),m2=getMelhoriaEsoterico(),m3=getMelhoriaEsoterico();
		while (m2===m1||m3===m1||m3===m2){m2=getMelhoriaEsoterico();m3=getMelhoriaEsoterico();}
		return getEsoterico() + " [" + m1 + ", " + m2 + " e " + m3 + "]";
	}
}

function getMelhoria4() {
	var r = Math.random();
	if (r < 0.5) {
		var m1=getMelhoriaArma(),m2=getMelhoriaArma(),m3=getMelhoriaArma(),m4=getMelhoriaArma();
		while(m2===m1||m3===m1||m3===m2||m4===m1||m4===m2||m4===m3){m2=getMelhoriaArma();m3=getMelhoriaArma();m4=getMelhoriaArma();}
		return getArma() + " [" + m1 + ", " + m2 + ", " + m3 + " e " + m4 + "]";
	} else if (r < 0.875) {
		var m1=getMelhoriaArmadura(),m2=getMelhoriaArmadura(),m3=getMelhoriaArmadura(),m4=getMelhoriaArmadura();
		while(m2===m1||m3===m1||m3===m2||m4===m1||m4===m2||m4===m3){m2=getMelhoriaArmadura();m3=getMelhoriaArmadura();m4=getMelhoriaArmadura();}
		return getArmadura() + " [" + m1 + ", " + m2 + ", " + m3 + " e " + m4 + "]";
	} else {
		var m1=getMelhoriaEsoterico(),m2=getMelhoriaEsoterico(),m3=getMelhoriaEsoterico(),m4=getMelhoriaEsoterico();
		while(m2===m1||m3===m1||m3===m2||m4===m1||m4===m2||m4===m3){m2=getMelhoriaEsoterico();m3=getMelhoriaEsoterico();m4=getMelhoriaEsoterico();}
		return getEsoterico() + " [" + m1 + ", " + m2 + ", " + m3 + " e " + m4 + "]";
	}
}

// ─────────────── ITENS MÁGICOS ───────────────
function getMagicoMenor() {
	var d6 = Math.floor(Math.random() * 6) + 1;
	if      (d6 <= 2) return getArma()     + " [" + getArmaMagica()     + "]";
	else if (d6 === 3) return getArmadura() + " [" + getEncantoArmadura() + "]";
	else if (d6 === 4) return getEsoterico() + " [" + getEncantoEsoterico() + "]";
	else               return getItemMenor();
}

function getMagicoMedio() {
	var d6 = Math.floor(Math.random() * 6) + 1;
	if      (d6 <= 2) return getArma()     + " [" + getArmaMagica()     + " + " + getArmaMagica()     + "]";
	else if (d6 === 3) return getArmadura() + " [" + getEncantoArmadura() + " + " + getEncantoArmadura() + "]";
	else if (d6 === 4) return getEsoterico() + " [" + getEncantoEsoterico() + " + " + getEncantoEsoterico() + "]";
	else               return getItemMedio();
}

function getMagicoMaior() {
	var d6 = Math.floor(Math.random() * 6) + 1;
	if      (d6 <= 2) return getArma()     + " [" + getArmaMagica()     + " + " + getArmaMagica()     + " + " + getArmaMagica()     + "]";
	else if (d6 === 3) return getArmadura() + " [" + getEncantoArmadura() + " + " + getEncantoArmadura() + " + " + getEncantoArmadura() + "]";
	else if (d6 === 4) return getEsoterico() + " [" + getEncantoEsoterico() + " + " + getEncantoEsoterico() + " + " + getEncantoEsoterico() + "]";
	else               return getItemMaior();
}

export { ARMADURAS_ESPECIFICAS, ARMAS_ESPECIFICAS, BUSCA_CONSEQUENCIAS, BUSCA_DESAFIOS, BUSCA_TABELA_1D6, EQUIPAMENTOS, ESOTERICOS_ESPECIFICOS, ITENS_DIVERSOS, MAGICOS_ACESSORIOS, MAGICOS_ENCANTOS, MAGICOS_ESPECIFICOS, POCOES, RIQUEZAS, RIQUEZAS_ESPACOS, SUPERIORES, TESOURO_ND, doisDados, getArma, getArmaMagica, getArmadura, getDiverso, getEncantoArmadura, getEncantoEsoterico, getEquipamento, getEsoterico, getItemMaior, getItemMedio, getItemMenor, getMagicoMaior, getMagicoMedio, getMagicoMenor, getMaterialEspecial, getMelhoria, getMelhoria2, getMelhoria3, getMelhoria4, getMelhoriaArma, getMelhoriaArmadura, getMelhoriaEsoterico, getPocao, getRiquezaMaior, getRiquezaMedia, getRiquezaMenor, rollTabela, rollTabelaComEspecifico };
