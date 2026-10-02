/** Tipos das tabelas reais de tesouro do Tormenta20 (tabelas.js, copiado de public/espolio). */
export interface TesouroND {
  nd: string;
  /** [faixa de d%, resultado], ex.: ["21-70", "3d8x10 T$"] */
  dinheiro: [string, string][];
  itens: [string, string][];
}

export const TESOURO_ND: TesouroND[];

/** Gravador opcional das rolagens de sub-tabela (rótulo, valor sorteado, valor ajustado). */
export function setRollRecorder(fn: ((label: string, value: number, adjusted?: number) => void) | null): void;

export function getRiquezaMenor(bonus?: number): string;
export function getRiquezaMedia(bonus?: number): string;
export function getRiquezaMaior(bonus?: number): string;
export function getPocao(bonus?: number): string;
export function getDiverso(): string;
export function getEquipamento(): string;
export function getMelhoria(): string;
export function getMelhoria2(): string;
export function getMelhoria3(): string;
export function getMelhoria4(): string;
export function getMagicoMenor(): string;
export function getMagicoMedio(): string;
export function getMagicoMaior(): string;
