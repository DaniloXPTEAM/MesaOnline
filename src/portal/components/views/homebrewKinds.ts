import { ITEM_CATEGORIES, SPELL_SCHOOLS } from "../../lib/t20/compendium";

export interface HomebrewField {
  key: string;
  label: string;
  kind: "text" | "textarea" | "number" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface HomebrewKind {
  id: string;
  label: string;
  icon: string;
  /** o arquivo (PDF/documento) é obrigatório neste tipo */
  fileRequired?: boolean;
  fields: HomebrewField[];
}

/** Cada tipo de material pede os dados que ele precisa para aparecer no site sem erros. */
export const HOMEBREW_KINDS: HomebrewKind[] = [
  { id: "documento", label: "Documento / PDF completo", icon: "📄", fileRequired: true, fields: [{ key: "conteudo", label: "O que o documento contém", kind: "textarea", required: true, placeholder: "Ex.: 12 raças, 3 classes e 40 poderes para Tormenta 20" }, { key: "paginas", label: "Nº de páginas", kind: "number" }] },
  { id: "raca", label: "Raça", icon: "🧬", fields: [
    { key: "tamanho", label: "Tamanho", kind: "select", options: ["Minúsculo", "Pequeno", "Médio", "Grande", "Enorme"], required: true },
    { key: "deslocamento", label: "Deslocamento (m)", kind: "number", required: true },
    { key: "atributos", label: "Modificadores de atributo", kind: "text", required: true, placeholder: "Ex.: FOR +1, CAR −1 ou +1 em dois atributos à escolha" },
    { key: "habilidades", label: "Habilidades raciais (nome: descrição)", kind: "textarea", required: true },
  ] },
  { id: "classe", label: "Classe / Distinção", icon: "⚔️", fields: [
    { key: "pv", label: "PV no 1º nível", kind: "number", required: true },
    { key: "pvNivel", label: "PV por nível", kind: "number", required: true },
    { key: "pm", label: "PM por nível", kind: "number", required: true },
    { key: "pericias", label: "Perícias (treinadas e quantidade extra)", kind: "text", required: true },
    { key: "proficiencias", label: "Proficiências", kind: "text" },
    { key: "habilidades", label: "Habilidades e poderes por nível", kind: "textarea", required: true },
  ] },
  { id: "poder", label: "Poder", icon: "💪", fields: [
    { key: "categoria", label: "Categoria", kind: "select", options: ["Combate", "Destino", "Magia", "Tormenta", "Concedido", "Racial", "Classe"], required: true },
    { key: "prerequisito", label: "Pré-requisito", kind: "text" },
    { key: "efeito", label: "Efeito", kind: "textarea", required: true },
  ] },
  { id: "magia", label: "Magia", icon: "✨", fields: [
    { key: "circulo", label: "Círculo", kind: "select", options: ["1", "2", "3", "4", "5"], required: true },
    { key: "tipo", label: "Tipo", kind: "select", options: ["Arcana", "Divina", "Universal"], required: true },
    { key: "escola", label: "Escola", kind: "select", options: [...SPELL_SCHOOLS], required: true },
    { key: "execucao", label: "Execução", kind: "text", required: true },
    { key: "alcance", label: "Alcance", kind: "text", required: true },
    { key: "alvo", label: "Alvo / Área / Efeito", kind: "text", required: true },
    { key: "duracao", label: "Duração", kind: "text", required: true },
    { key: "resistencia", label: "Resistência", kind: "text", placeholder: "Nenhuma, Fortitude anula..." },
    { key: "custo", label: "Custo (PM)", kind: "number", required: true },
    { key: "efeito", label: "Descrição / efeito", kind: "textarea", required: true },
    { key: "aprimoramentos", label: "Aprimoramentos", kind: "textarea" },
  ] },
  { id: "equipamento", label: "Equipamento / Item", icon: "🎒", fields: [
    { key: "categoria", label: "Categoria", kind: "select", options: [...ITEM_CATEGORIES], required: true },
    { key: "preco", label: "Preço (T$)", kind: "number", required: true },
    { key: "espacos", label: "Espaços", kind: "number", required: true },
    { key: "dano", label: "Dano (armas)", kind: "text", placeholder: "Ex.: 1d8" },
    { key: "critico", label: "Crítico (armas)", kind: "text", placeholder: "Ex.: 19/x2" },
    { key: "efeito", label: "Descrição / efeito", kind: "textarea", required: true },
  ] },
  { id: "ameaca", label: "Monstro / Ameaça", icon: "🐉", fields: [
    { key: "nd", label: "ND", kind: "text", required: true },
    { key: "tipoCriatura", label: "Tipo e tamanho", kind: "text", required: true, placeholder: "Ex.: Monstro Grande" },
    { key: "pv", label: "PV", kind: "number", required: true },
    { key: "defesa", label: "Defesa", kind: "number", required: true },
    { key: "ataques", label: "Ataques (nome, bônus, dano)", kind: "textarea", required: true },
    { key: "habilidades", label: "Habilidades", kind: "textarea" },
  ] },
  { id: "parceiro", label: "Parceiro", icon: "🐺", fields: [
    { key: "tipo", label: "Tipo de parceiro", kind: "select", options: ["Ajudante", "Combatente", "Fortão", "Guardião", "Médico", "Perseguidor", "Utilitário", "Montaria", "Familiar"], required: true },
    { key: "iniciante", label: "Bônus — Iniciante", kind: "textarea", required: true },
    { key: "veterano", label: "Bônus — Veterano", kind: "textarea", required: true },
    { key: "mestre", label: "Bônus — Mestre", kind: "textarea", required: true },
  ] },
  { id: "origem", label: "Origem / Divindade", icon: "📜", fields: [
    { key: "beneficios", label: "Benefícios (perícias e poderes)", kind: "textarea", required: true },
    { key: "itens", label: "Itens iniciais", kind: "text" },
  ] },
];
