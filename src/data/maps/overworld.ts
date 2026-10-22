/**
 * Mapa do Overworld (Capítulo I: Vale de Luminário)
 * Dimensões: 32 colunas x 24 linhas (512 x 384 pixels).
 *
 * Legenda de caracteres:
 *   . = Grama
 *   * = Grama Florida
 *   T = Árvore (sólida)
 *   M = Montanha (sólida)
 *   ~ = Água (sólida, animada)
 *   # = Muralha de pedra (sólida)
 *   , = Caminho de terra (passável)
 *   = = Ponte de madeira (passável sobre o rio)
 *   S = Areia da margem (passável)
 *   D = Portão do castelo (passável)
 */

export const OVERWORLD_MAP_DATA = [
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM', // 0
  'MMMMMTTTT...~~~~~~~...TTTTTMMMMM', // 1
  'MMMTTTT.....~~~~~~~~.....TTTTMMM', // 2
  'MMTT........~~~~~~~~......TTTTMM', // 3
  'MTT...#####..SSSS~~~~......TTTTM', // 4 (Castelo)
  'MT...#.....#..SSS~~~~~......TTTM', // 5
  'MT...#.....#...SS~~~~~.......TTM', // 6
  'MT...#..D..#....S~~~~~.......TTM', // 7 (Portão D na col 8)
  'MT...#..,..#.....~~~~~.......TTM', // 8
  'MT......,........~~~~~.......TTM', // 9 (Estrada na col 8)
  'MT......,........~~~~~.......TTM', // 10
  'MTTT....,,,,,,===~~~~~,,.....TTM', // 11 (Ponte === cruzando o rio)
  'MTTT........,,...~~~~~,,.....TTM', // 12
  'MTTTT.......,,...~~~~~,,.....TTM', // 13
  'MMTTTT.....,,....~~~~~,,.....TTM', // 14
  'MMMTTT.....,,....~~~~~,,.....TTM', // 15
  'MMMMTT.....,,....~~~~~,,.....TTM', // 16
  'MMMMMT.....,,....~~~~~,,....TTTM', // 17
  'MMMMMT..***,,....~~~~~,,....TTTM', // 18 (Flores ***)
  'MMMMMT.****,,....~~~~~,,...TTTMM', // 19
  'MMMMMT..***,,....~~~~~,,...TTTMM', // 20
  'MMMMMTT....,,,...~~~~~,...TTTMMM', // 21
  'MMMMMMTTTTTTTTTT.~~~~~...TTTTMMM', // 22
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM', // 23
];
