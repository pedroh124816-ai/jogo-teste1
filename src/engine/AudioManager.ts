/**
 * Motor de Áudio 8-bit Chiptune e Efeitos Sonoros (Web Audio API).
 * Inspirado nos chips de som clássicos de 8-bits (NES 2A03 / Square Enix:
 * Dragon Quest e Final Fantasy), gerando músicas e efeitos proceduralmente
 * sem necessidade de arquivos externos.
 */

export type BgmTrackId =
  | 'none'
  | 'title'
  | 'overworld'
  | 'castle'
  | 'town'
  | 'cave'
  | 'shrine'
  | 'battle'
  | 'boss';

export type SfxId =
  | 'cursor'
  | 'confirm'
  | 'cancel'
  | 'error'
  | 'attack'
  | 'crit'
  | 'hit'
  | 'magic'
  | 'heal'
  | 'encounter'
  | 'chest'
  | 'victory'
  | 'level_up'
  | 'defeat'
  | 'inn'
  | 'coins'
  | 'stairs'
  | 'door';

interface NoteStep {
  /** Nota musical (ex: 'C4', 'F#4', 'R' para pausa) */
  note: string;
  /** Duração em passos de 16 avos (semicolcheias) */
  steps: number;
}

interface BgmDefinition {
  /** Duração de 1 passo (semicolcheia) em segundos */
  stepDuration: number;
  /** Canal 1: Melodia principal (onda quadrada) */
  lead: NoteStep[];
  /** Canal 2: Harmonia / Arpejo (onda quadrada suave ou triangular) */
  harmony: NoteStep[];
  /** Canal 3: Baixo (onda triangular) */
  bass: NoteStep[];
  leadWave?: OscillatorType;
  harmonyWave?: OscillatorType;
}

const NOTE_FREQS: Record<string, number> = {
  R: 0,
  C2: 65.41, 'C#2': 69.3, D2: 73.42, 'D#2': 77.78, Eb2: 77.78, E2: 82.41, F2: 87.31, 'F#2': 92.5, G2: 98.0, 'G#2': 103.83, Ab2: 103.83, A2: 110.0, 'A#2': 116.54, Bb2: 116.54, B2: 123.47,
  C3: 130.81, 'C#3': 138.59, D3: 146.83, 'D#3': 155.56, Eb3: 155.56, E3: 164.81, F3: 174.61, 'F#3': 185.0, G3: 196.0, 'G#3': 207.65, Ab3: 207.65, A3: 220.0, 'A#3': 233.08, Bb3: 233.08, B3: 246.94,
  C4: 261.63, 'C#4': 277.18, D4: 293.66, 'D#4': 311.13, Eb4: 311.13, E4: 329.63, F4: 349.23, 'F#4': 369.99, G4: 392.0, 'G#4': 415.3, Ab4: 415.3, A4: 440.0, 'A#4': 466.16, Bb4: 466.16, B4: 493.88,
  C5: 523.25, 'C#5': 554.37, D5: 587.33, 'D#5': 622.25, Eb5: 622.25, E5: 659.25, F5: 698.46, 'F#5': 739.99, G5: 783.99, 'G#5': 830.61, Ab5: 830.61, A5: 880.0, 'A#5': 932.33, Bb5: 932.33, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98,
};

/**
 * Composições 8-bit inspiradas nos clássicos da Square Enix (Final Fantasy / Dragon Quest).
 */
const BGM_TRACKS: Record<Exclude<BgmTrackId, 'none'>, BgmDefinition> = {
  // 1. PRELÚDIO DE LUMINÁRIO (Tela de Título e Abertura — Arpejo de Cristal + Melodia Nobre)
  title: {
    stepDuration: 0.13,
    leadWave: 'triangle',
    harmonyWave: 'square',
    lead: [
      { note: 'E5', steps: 6 }, { note: 'D5', steps: 2 }, { note: 'C5', steps: 4 }, { note: 'G4', steps: 4 },
      { note: 'A4', steps: 6 }, { note: 'B4', steps: 2 }, { note: 'C5', steps: 4 }, { note: 'E5', steps: 4 },
      { note: 'G5', steps: 6 }, { note: 'F5', steps: 2 }, { note: 'E5', steps: 4 }, { note: 'D5', steps: 4 },
      { note: 'C5', steps: 12 }, { note: 'R', steps: 4 },
    ],
    harmony: [
      { note: 'C4', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'E4', steps: 2 }, { note: 'G4', steps: 2 },
      { note: 'C5', steps: 2 }, { note: 'G4', steps: 2 }, { note: 'E4', steps: 2 }, { note: 'D4', steps: 2 },
      { note: 'A3', steps: 2 }, { note: 'B3', steps: 2 }, { note: 'C4', steps: 2 }, { note: 'E4', steps: 2 },
      { note: 'A4', steps: 2 }, { note: 'E4', steps: 2 }, { note: 'C4', steps: 2 }, { note: 'B3', steps: 2 },
      { note: 'F3', steps: 2 }, { note: 'A3', steps: 2 }, { note: 'C4', steps: 2 }, { note: 'F4', steps: 2 },
      { note: 'G3', steps: 2 }, { note: 'B3', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'G4', steps: 2 },
      { note: 'C4', steps: 2 }, { note: 'E4', steps: 2 }, { note: 'G4', steps: 2 }, { note: 'C5', steps: 2 },
      { note: 'E5', steps: 2 }, { note: 'C5', steps: 2 }, { note: 'G4', steps: 2 }, { note: 'E4', steps: 2 },
    ],
    bass: [
      { note: 'C3', steps: 16 },
      { note: 'A2', steps: 16 },
      { note: 'F2', steps: 8 }, { note: 'G2', steps: 8 },
      { note: 'C3', steps: 16 },
    ],
  },

  // 2. CAMPOS DE ALVORADA (Overworld — Tema Heroico de Jornada em Sol Maior)
  overworld: {
    stepDuration: 0.14,
    lead: [
      { note: 'G4', steps: 4 }, { note: 'D5', steps: 4 }, { note: 'B4', steps: 3 }, { note: 'C5', steps: 1 }, { note: 'D5', steps: 4 },
      { note: 'E5', steps: 4 }, { note: 'D5', steps: 4 }, { note: 'B4', steps: 4 }, { note: 'G4', steps: 4 },
      { note: 'A4', steps: 4 }, { note: 'B4', steps: 4 }, { note: 'C5', steps: 4 }, { note: 'A4', steps: 4 },
      { note: 'B4', steps: 6 }, { note: 'A4', steps: 2 }, { note: 'G4', steps: 6 }, { note: 'R', steps: 2 },
      { note: 'B4', steps: 4 }, { note: 'D5', steps: 4 }, { note: 'G5', steps: 6 }, { note: 'F#5', steps: 2 },
      { note: 'E5', steps: 4 }, { note: 'D5', steps: 4 }, { note: 'C5', steps: 4 }, { note: 'B4', steps: 4 },
      { note: 'A4', steps: 4 }, { note: 'B4', steps: 4 }, { note: 'C5', steps: 4 }, { note: 'D5', steps: 4 },
      { note: 'G4', steps: 12 }, { note: 'R', steps: 4 },
    ],
    harmony: [
      { note: 'B3', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'G4', steps: 2 }, { note: 'D4', steps: 2 },
      { note: 'B3', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'G4', steps: 2 }, { note: 'D4', steps: 2 },
      { note: 'C4', steps: 2 }, { note: 'E4', steps: 2 }, { note: 'G4', steps: 2 }, { note: 'E4', steps: 2 },
      { note: 'B3', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'G4', steps: 2 }, { note: 'D4', steps: 2 },
      { note: 'A3', steps: 2 }, { note: 'C4', steps: 2 }, { note: 'E4', steps: 2 }, { note: 'C4', steps: 2 },
      { note: 'A3', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'F#4', steps: 2 }, { note: 'D4', steps: 2 },
      { note: 'B3', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'G4', steps: 2 }, { note: 'D4', steps: 2 },
      { note: 'B3', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'G4', steps: 4 },
    ],
    bass: [
      { note: 'G2', steps: 4 }, { note: 'D3', steps: 4 }, { note: 'G2', steps: 4 }, { note: 'B2', steps: 4 },
      { note: 'C3', steps: 4 }, { note: 'G2', steps: 4 }, { note: 'G2', steps: 4 }, { note: 'D3', steps: 4 },
      { note: 'A2', steps: 4 }, { note: 'E3', steps: 4 }, { note: 'D3', steps: 4 }, { note: 'A2', steps: 4 },
      { note: 'G2', steps: 4 }, { note: 'D3', steps: 4 }, { note: 'G2', steps: 8 },
      { note: 'E3', steps: 4 }, { note: 'B2', steps: 4 }, { note: 'C3', steps: 4 }, { note: 'G2', steps: 4 },
      { note: 'C3', steps: 4 }, { note: 'D3', steps: 4 }, { note: 'E3', steps: 4 }, { note: 'G2', steps: 4 },
      { note: 'A2', steps: 4 }, { note: 'C3', steps: 4 }, { note: 'D3', steps: 4 }, { note: 'F#2', steps: 4 },
      { note: 'G2', steps: 4 }, { note: 'D3', steps: 4 }, { note: 'G2', steps: 8 },
    ],
  },

  // 3. SALÃO DO TRONO REAL (Castelo — Minueto Barroco Solene estilo Dragon Quest)
  castle: {
    stepDuration: 0.15,
    lead: [
      { note: 'D5', steps: 6 }, { note: 'C#5', steps: 2 }, { note: 'D5', steps: 4 }, { note: 'A4', steps: 4 },
      { note: 'B4', steps: 4 }, { note: 'G4', steps: 4 }, { note: 'A4', steps: 6 }, { note: 'R', steps: 2 },
      { note: 'B4', steps: 4 }, { note: 'C#5', steps: 4 }, { note: 'D5', steps: 4 }, { note: 'E5', steps: 4 },
      { note: 'F#5', steps: 6 }, { note: 'E5', steps: 2 }, { note: 'D5', steps: 6 }, { note: 'R', steps: 2 },
    ],
    harmony: [
      { note: 'F#4', steps: 4 }, { note: 'A4', steps: 4 }, { note: 'F#4', steps: 4 }, { note: 'D4', steps: 4 },
      { note: 'G4', steps: 4 }, { note: 'E4', steps: 4 }, { note: 'C#4', steps: 8 },
      { note: 'G4', steps: 4 }, { note: 'E4', steps: 4 }, { note: 'F#4', steps: 4 }, { note: 'A4', steps: 4 },
      { note: 'A4', steps: 4 }, { note: 'G4', steps: 4 }, { note: 'F#4', steps: 8 },
    ],
    bass: [
      { note: 'D3', steps: 8 }, { note: 'F#3', steps: 8 },
      { note: 'G3', steps: 4 }, { note: 'E3', steps: 4 }, { note: 'A2', steps: 8 },
      { note: 'G2', steps: 4 }, { note: 'A2', steps: 4 }, { note: 'B2', steps: 4 }, { note: 'C#3', steps: 4 },
      { note: 'D3', steps: 4 }, { note: 'A2', steps: 4 }, { note: 'D3', steps: 8 },
    ],
  },

  // 4. BRISA DA VILA (Cidades e Interiores — Tema Pastoral Acolhedor em Fá Maior)
  town: {
    stepDuration: 0.15,
    lead: [
      { note: 'A4', steps: 4 }, { note: 'C5', steps: 4 }, { note: 'F5', steps: 4 }, { note: 'E5', steps: 4 },
      { note: 'D5', steps: 4 }, { note: 'C5', steps: 4 }, { note: 'A4', steps: 6 }, { note: 'R', steps: 2 },
      { note: 'G4', steps: 4 }, { note: 'A4', steps: 4 }, { note: 'Bb4', steps: 4 }, { note: 'D5', steps: 4 },
      { note: 'C5', steps: 6 }, { note: 'A4', steps: 2 }, { note: 'G4', steps: 6 }, { note: 'R', steps: 2 },
      { note: 'A4', steps: 4 }, { note: 'C5', steps: 4 }, { note: 'F5', steps: 4 }, { note: 'E5', steps: 4 },
      { note: 'D5', steps: 4 }, { note: 'F5', steps: 4 }, { note: 'E5', steps: 4 }, { note: 'C5', steps: 4 },
      { note: 'Bb4', steps: 4 }, { note: 'A4', steps: 4 }, { note: 'G4', steps: 4 }, { note: 'E4', steps: 4 },
      { note: 'F4', steps: 12 }, { note: 'R', steps: 4 },
    ],
    harmony: [
      { note: 'F4', steps: 2 }, { note: 'C4', steps: 2 }, { note: 'A3', steps: 2 }, { note: 'C4', steps: 2 },
      { note: 'Bb3', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'F4', steps: 2 }, { note: 'D4', steps: 2 },
      { note: 'E4', steps: 2 }, { note: 'C4', steps: 2 }, { note: 'G3', steps: 2 }, { note: 'C4', steps: 2 },
      { note: 'F4', steps: 2 }, { note: 'C4', steps: 2 }, { note: 'A3', steps: 4 },
    ],
    bass: [
      { note: 'F2', steps: 8 }, { note: 'A2', steps: 8 },
      { note: 'Bb2', steps: 8 }, { note: 'F2', steps: 8 },
      { note: 'G2', steps: 8 }, { note: 'Bb2', steps: 8 },
      { note: 'C3', steps: 8 }, { note: 'C2', steps: 8 },
      { note: 'F2', steps: 8 }, { note: 'A2', steps: 8 },
      { note: 'Bb2', steps: 8 }, { note: 'C3', steps: 8 },
      { note: 'G2', steps: 8 }, { note: 'C3', steps: 8 },
      { note: 'F2', steps: 16 },
    ],
  },

  // 5. ECOS DA PROFUNDEZA (Cavernas, Minas e Subsolo — Tema Misterioso em Ré Menor)
  cave: {
    stepDuration: 0.16,
    leadWave: 'triangle',
    harmonyWave: 'square',
    lead: [
      { note: 'D4', steps: 4 }, { note: 'F4', steps: 4 }, { note: 'A4', steps: 4 }, { note: 'G#4', steps: 4 },
      { note: 'A4', steps: 6 }, { note: 'F4', steps: 2 }, { note: 'D4', steps: 6 }, { note: 'R', steps: 2 },
      { note: 'Bb4', steps: 4 }, { note: 'A4', steps: 4 }, { note: 'G4', steps: 4 }, { note: 'F4', steps: 4 },
      { note: 'E4', steps: 12 }, { note: 'R', steps: 4 },
    ],
    harmony: [
      { note: 'A3', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'F4', steps: 2 }, { note: 'D4', steps: 2 },
      { note: 'G#3', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'F4', steps: 2 }, { note: 'D4', steps: 2 },
      { note: 'G3', steps: 2 }, { note: 'Bb3', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'Bb3', steps: 2 },
      { note: 'A3', steps: 2 }, { note: 'C#4', steps: 2 }, { note: 'E4', steps: 2 }, { note: 'C#4', steps: 2 },
    ],
    bass: [
      { note: 'D2', steps: 4 }, { note: 'A2', steps: 4 }, { note: 'D2', steps: 4 }, { note: 'A2', steps: 4 },
      { note: 'D2', steps: 4 }, { note: 'F2', steps: 4 }, { note: 'D2', steps: 8 },
      { note: 'G2', steps: 4 }, { note: 'D3', steps: 4 }, { note: 'Bb2', steps: 4 }, { note: 'G2', steps: 4 },
      { note: 'A2', steps: 4 }, { note: 'E2', steps: 4 }, { note: 'A2', steps: 8 },
    ],
  },

  // 6. SANTUÁRIO DA LUZ (Templos e Refúgio das Raízes — Hino Etéreo em Mi Menor)
  shrine: {
    stepDuration: 0.16,
    leadWave: 'triangle',
    harmonyWave: 'square',
    lead: [
      { note: 'E5', steps: 8 }, { note: 'B4', steps: 4 }, { note: 'G4', steps: 4 },
      { note: 'A4', steps: 8 }, { note: 'B4', steps: 8 },
      { note: 'C5', steps: 4 }, { note: 'D5', steps: 4 }, { note: 'E5', steps: 4 }, { note: 'G5', steps: 4 },
      { note: 'F#5', steps: 12 }, { note: 'R', steps: 4 },
    ],
    harmony: [
      { note: 'E4', steps: 4 }, { note: 'G4', steps: 4 }, { note: 'B4', steps: 4 }, { note: 'G4', steps: 4 },
      { note: 'C4', steps: 4 }, { note: 'E4', steps: 4 }, { note: 'D4', steps: 4 }, { note: 'F#4', steps: 4 },
    ],
    bass: [
      { note: 'E2', steps: 16 },
      { note: 'A2', steps: 8 }, { note: 'G2', steps: 8 },
      { note: 'C3', steps: 8 }, { note: 'B2', steps: 8 },
      { note: 'B2', steps: 16 },
    ],
  },

  // 7. CONFRONTO DE ESPADAS (Batalha Normal — Ritmo Ágil em Lá Menor estilo Final Fantasy)
  battle: {
    stepDuration: 0.11,
    lead: [
      { note: 'A4', steps: 2 }, { note: 'A4', steps: 2 }, { note: 'C5', steps: 2 }, { note: 'A4', steps: 2 },
      { note: 'D5', steps: 2 }, { note: 'C5', steps: 2 }, { note: 'B4', steps: 2 }, { note: 'G4', steps: 2 },
      { note: 'A4', steps: 4 }, { note: 'E5', steps: 4 }, { note: 'D5', steps: 4 }, { note: 'C5', steps: 4 },
      { note: 'B4', steps: 2 }, { note: 'C5', steps: 2 }, { note: 'D5', steps: 4 }, { note: 'B4', steps: 4 }, { note: 'G4', steps: 4 },
      { note: 'A4', steps: 2 }, { note: 'B4', steps: 2 }, { note: 'C5', steps: 4 }, { note: 'E5', steps: 4 }, { note: 'F5', steps: 4 },
      { note: 'E5', steps: 4 }, { note: 'D5', steps: 4 }, { note: 'C5', steps: 4 }, { note: 'B4', steps: 4 },
      { note: 'A4', steps: 12 }, { note: 'R', steps: 4 },
    ],
    harmony: [
      { note: 'E4', steps: 2 }, { note: 'E4', steps: 2 }, { note: 'E4', steps: 2 }, { note: 'E4', steps: 2 },
      { note: 'F4', steps: 2 }, { note: 'E4', steps: 2 }, { note: 'D4', steps: 2 }, { note: 'B3', steps: 2 },
      { note: 'C4', steps: 4 }, { note: 'A4', steps: 4 }, { note: 'F4', steps: 4 }, { note: 'E4', steps: 4 },
      { note: 'D4', steps: 4 }, { note: 'G4', steps: 4 }, { note: 'D4', steps: 4 }, { note: 'B3', steps: 4 },
    ],
    bass: [
      { note: 'A2', steps: 2 }, { note: 'E3', steps: 2 }, { note: 'A2', steps: 2 }, { note: 'E3', steps: 2 },
      { note: 'G2', steps: 2 }, { note: 'D3', steps: 2 }, { note: 'G2', steps: 2 }, { note: 'D3', steps: 2 },
      { note: 'F2', steps: 2 }, { note: 'C3', steps: 2 }, { note: 'F2', steps: 2 }, { note: 'C3', steps: 2 },
      { note: 'G2', steps: 2 }, { note: 'D3', steps: 2 }, { note: 'E2', steps: 2 }, { note: 'B2', steps: 2 },
    ],
  },

  // 8. FÚRIA DA SOMBRA (Batalha de Chefe — Intenso e Dramático em Mi Menor)
  boss: {
    stepDuration: 0.095,
    lead: [
      { note: 'E4', steps: 2 }, { note: 'G4', steps: 2 }, { note: 'B4', steps: 2 }, { note: 'A#4', steps: 2 },
      { note: 'B4', steps: 4 }, { note: 'E5', steps: 4 },
      { note: 'D#5', steps: 2 }, { note: 'E5', steps: 2 }, { note: 'F#5', steps: 4 }, { note: 'B4', steps: 4 }, { note: 'C5', steps: 4 },
      { note: 'B4', steps: 2 }, { note: 'A4', steps: 2 }, { note: 'G4', steps: 4 }, { note: 'F#4', steps: 4 }, { note: 'D#4', steps: 4 },
      { note: 'E4', steps: 12 }, { note: 'R', steps: 4 },
    ],
    harmony: [
      { note: 'B3', steps: 2 }, { note: 'E4', steps: 2 }, { note: 'G4', steps: 2 }, { note: 'F#4', steps: 2 },
      { note: 'G4', steps: 4 }, { note: 'B4', steps: 4 },
      { note: 'A4', steps: 4 }, { note: 'C5', steps: 4 }, { note: 'G4', steps: 4 }, { note: 'E4', steps: 4 },
      { note: 'F#4', steps: 4 }, { note: 'E4', steps: 4 }, { note: 'D#4', steps: 4 }, { note: 'B3', steps: 4 },
      { note: 'B3', steps: 12 }, { note: 'R', steps: 4 },
    ],
    bass: [
      { note: 'E2', steps: 2 }, { note: 'B2', steps: 2 }, { note: 'E2', steps: 2 }, { note: 'B2', steps: 2 },
      { note: 'C3', steps: 2 }, { note: 'G2', steps: 2 }, { note: 'A2', steps: 2 }, { note: 'E2', steps: 2 },
      { note: 'B2', steps: 2 }, { note: 'F#2', steps: 2 }, { note: 'B2', steps: 2 }, { note: 'F#2', steps: 2 },
      { note: 'E2', steps: 2 }, { note: 'B2', steps: 2 }, { note: 'E2', steps: 4 },
    ],
  },
};

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmVolume = 0.8;
  private sfxVolume = 1.0;
  private muted = false;
  private unlocked = false;

  private currentTrack: BgmTrackId = 'none';
  private isPausedForJingle = false;
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  private jingleTimer: ReturnType<typeof setTimeout> | null = null;

  // Índices e tempos do sequenciador de 3 canais
  private nextLeadTime = 0;
  private nextHarmonyTime = 0;
  private nextBassTime = 0;
  private leadIndex = 0;
  private harmonyIndex = 0;
  private bassIndex = 0;

  constructor() {
    this.setupAutoUnlock();
  }

  /**
   * Desbloqueia o AudioContext automaticamente na primeira interação do usuário
   * (teclado ou clique), respeitando a política de autoplay dos navegadores.
   */
  private setupAutoUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.unlocked = true;
    };

    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 0.25;
        this.masterGain.connect(this.ctx.destination);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = this.bgmVolume;
        this.bgmGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.sfxVolume;
        this.sfxGain.connect(this.masterGain);
      } catch {
        return null;
      }
    }

    if (this.ctx.state === 'suspended' && this.unlocked) {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public getCurrentBgm(): Exclude<BgmTrackId, 'none'> | null {
    return this.currentTrack === 'none' ? null : this.currentTrack;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.25, this.ctx.currentTime);
    }
    if (this.muted) {
      this.stopScheduler();
    } else if (this.currentTrack !== 'none') {
      const trackToResume = this.currentTrack;
      this.currentTrack = 'none';
      this.playBgm(trackToResume);
    }
    return this.muted;
  }

  public setBgmVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  /**
   * Inicia ou troca a música de fundo (BGM). Se já estiver tocando a mesma faixa, mantém o fluxo.
   */
  public playBgm(track: BgmTrackId): void {
    if (track === this.currentTrack && this.schedulerTimer !== null && !this.isPausedForJingle) {
      return;
    }

    this.currentTrack = track;
    this.stopScheduler();

    if (track === 'none' || this.muted) {
      return;
    }

    const ctx = this.ensureContext();
    const now = ctx ? ctx.currentTime + 0.04 : 0;

    this.leadIndex = 0;
    this.harmonyIndex = 0;
    this.bassIndex = 0;
    this.nextLeadTime = now;
    this.nextHarmonyTime = now;
    this.nextBassTime = now;
    this.isPausedForJingle = false;

    if (typeof window !== 'undefined') {
      this.scheduleTick();
      this.schedulerTimer = setInterval(() => this.scheduleTick(), 50);
    }
  }

  public stopBgm(): void {
    this.currentTrack = 'none';
    this.stopScheduler();
  }

  private stopScheduler(): void {
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.jingleTimer !== null) {
      clearTimeout(this.jingleTimer);
      this.jingleTimer = null;
    }
    this.isPausedForJingle = false;
  }

  private scheduleTick(): void {
    if (this.muted || this.currentTrack === 'none' || this.isPausedForJingle) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    const def = BGM_TRACKS[this.currentTrack];
    if (!def) return;

    const now = ctx.currentTime;
    // Se o relógio ficou para trás (ex: aba em background), ressincroniza
    if (this.nextLeadTime < now - 0.3) {
      this.nextLeadTime = now + 0.02;
      this.nextHarmonyTime = now + 0.02;
      this.nextBassTime = now + 0.02;
    }

    const lookahead = 0.16;

    // 1. Canal Melodia Principal
    while (this.nextLeadTime < now + lookahead) {
      const step = def.lead[this.leadIndex % def.lead.length];
      const dur = step.steps * def.stepDuration;
      const freq = NOTE_FREQS[step.note] || 0;
      if (freq > 0) {
        this.playTone(
          freq,
          this.nextLeadTime,
          dur * 0.88,
          def.leadWave || 'square',
          0.11
        );
      }
      this.nextLeadTime += dur;
      this.leadIndex = (this.leadIndex + 1) % def.lead.length;
    }

    // 2. Canal Harmonia / Arpejo
    while (this.nextHarmonyTime < now + lookahead) {
      const step = def.harmony[this.harmonyIndex % def.harmony.length];
      const dur = step.steps * def.stepDuration;
      const freq = NOTE_FREQS[step.note] || 0;
      if (freq > 0) {
        this.playTone(
          freq,
          this.nextHarmonyTime,
          dur * 0.82,
          def.harmonyWave || 'square',
          0.055
        );
      }
      this.nextHarmonyTime += dur;
      this.harmonyIndex = (this.harmonyIndex + 1) % def.harmony.length;
    }

    // 3. Canal Baixo (Onda Triangular)
    while (this.nextBassTime < now + lookahead) {
      const step = def.bass[this.bassIndex % def.bass.length];
      const dur = step.steps * def.stepDuration;
      const freq = NOTE_FREQS[step.note] || 0;
      if (freq > 0) {
        this.playTone(freq, this.nextBassTime, dur * 0.9, 'triangle', 0.14);
      }
      this.nextBassTime += dur;
      this.bassIndex = (this.bassIndex + 1) % def.bass.length;
    }
  }

  /**
   * Pausa brevemente a BGM enquanto uma fanfarra (Vitória, Level Up, Baú, Estalagem) toca.
   */
  private pauseBgmForJingle(durationSec: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.jingleTimer !== null) {
      clearTimeout(this.jingleTimer);
      this.jingleTimer = null;
    }
    this.isPausedForJingle = true;
    this.jingleTimer = setTimeout(() => {
      this.jingleTimer = null;
      if (this.ctx) {
        const resumeTime = this.ctx.currentTime + 0.05;
        this.nextLeadTime = resumeTime;
        this.nextHarmonyTime = resumeTime;
        this.nextBassTime = resumeTime;
      }
      this.isPausedForJingle = false;
    }, Math.ceil(durationSec * 1000));
  }

  private playTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFreq?: number,
    channel: 'bgm' | 'sfx' = 'bgm'
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);
    }

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.008);
    gain.gain.setValueAtTime(volume * 0.85, startTime + Math.max(0.01, duration - 0.02));
    gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    const dest = channel === 'sfx' ? (this.sfxGain ?? this.masterGain) : (this.bgmGain ?? this.masterGain);
    gain.connect(dest);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  private playSfxTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFreq?: number
  ): void {
    this.playTone(freq, startTime, duration, type, volume, endFreq, 'sfx');
  }

  private playNoiseBurst(
    startTime: number,
    duration: number,
    volume: number,
    channel: 'bgm' | 'sfx' = 'sfx'
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Ruído LFSR 8-bit
    let lfsr = 0x7fff;
    for (let i = 0; i < bufferSize; i++) {
      const bit = ((lfsr >> 0) ^ (lfsr >> 1)) & 1;
      lfsr = (lfsr >> 1) | (bit << 14);
      data[i] = (lfsr & 1 ? 1 : -1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(gain);
    const dest = channel === 'sfx' ? (this.sfxGain ?? this.masterGain) : (this.bgmGain ?? this.masterGain);
    gain.connect(dest);
    noise.start(startTime);
  }

  private playSequence(
    notes: Array<{ note: string; dur: number; harmony?: string }>,
    type: OscillatorType = 'square',
    volume = 0.16,
    channel: 'bgm' | 'sfx' = 'sfx'
  ): number {
    const ctx = this.ensureContext();
    if (!ctx) return 0;

    let t = ctx.currentTime + 0.01;
    let total = 0;
    for (const item of notes) {
      const f = NOTE_FREQS[item.note] || 0;
      if (f > 0) {
        this.playTone(f, t, item.dur * 0.9, type, volume, undefined, channel);
      }
      if (item.harmony) {
        const hf = NOTE_FREQS[item.harmony] || 0;
        if (hf > 0) {
          this.playTone(hf, t, item.dur * 0.9, 'triangle', volume * 0.75, undefined, channel);
        }
      }
      t += item.dur;
      total += item.dur;
    }
    return total;
  }

  /**
   * Reproduz um efeito sonoro ou fanfarra 8-bit.
   */
  public playSfx(sfx: SfxId): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + 0.005;

    switch (sfx) {
      case 'cursor':
        this.playSfxTone(880, now, 0.035, 'square', 0.09);
        break;

      case 'confirm':
        this.playSfxTone(659.25, now, 0.045, 'square', 0.12);
        this.playSfxTone(987.77, now + 0.045, 0.07, 'square', 0.12);
        break;

      case 'cancel':
        this.playSfxTone(523.25, now, 0.045, 'square', 0.11);
        this.playSfxTone(392.0, now + 0.045, 0.065, 'square', 0.11);
        break;

      case 'error':
        this.playSfxTone(164.81, now, 0.08, 'sawtooth', 0.14);
        this.playSfxTone(130.81, now + 0.09, 0.12, 'sawtooth', 0.14);
        break;

      case 'stairs':
        this.playSfxTone(440, now, 0.05, 'triangle', 0.14, 220);
        this.playSfxTone(330, now + 0.06, 0.06, 'triangle', 0.14, 165);
        break;

      case 'door':
        // Estalo do trinco seguido pelo ranger/abrir da porta em 8-bit
        this.playNoiseBurst(now, 0.035, 0.14);
        this.playSfxTone(150, now, 0.04, 'triangle', 0.16, 100);
        this.playSfxTone(180, now + 0.045, 0.085, 'sawtooth', 0.13, 330);
        break;

      case 'coins':
        this.playSfxTone(987.77, now, 0.05, 'square', 0.14);
        this.playSfxTone(1318.51, now + 0.05, 0.16, 'square', 0.14);
        break;

      case 'attack':
        this.playNoiseBurst(now, 0.09, 0.18);
        this.playSfxTone(520, now, 0.09, 'square', 0.14, 140);
        break;

      case 'crit':
        this.playNoiseBurst(now, 0.14, 0.24);
        this.playSfxTone(880, now, 0.06, 'square', 0.18, 220);
        this.playSfxTone(1174.66, now + 0.06, 0.12, 'square', 0.18, 293.66);
        break;

      case 'hit':
        this.playNoiseBurst(now, 0.12, 0.22);
        this.playSfxTone(196, now, 0.12, 'sawtooth', 0.18, 65);
        break;

      case 'magic':
        for (let i = 0; i < 6; i++) {
          this.playSfxTone(440 + i * 110, now + i * 0.035, 0.05, 'square', 0.13);
        }
        break;

      case 'heal':
        this.playSequence(
          [
            { note: 'C5', dur: 0.07 },
            { note: 'E5', dur: 0.07 },
            { note: 'G5', dur: 0.07 },
            { note: 'C6', dur: 0.18 },
          ],
          'triangle',
          0.18
        );
        break;

      case 'encounter':
        for (let i = 0; i < 5; i++) {
          this.playSfxTone(300 + i * 95, now + i * 0.04, 0.045, 'sawtooth', 0.16, 180 + i * 60);
        }
        break;

      // Fanfarra de Baú / Descoberta de Item (estilo Dragon Quest / Final Fantasy)
      case 'chest': {
        const dur = this.playSequence(
          [
            { note: 'G4', dur: 0.09, harmony: 'B3' },
            { note: 'B4', dur: 0.09, harmony: 'D4' },
            { note: 'D5', dur: 0.09, harmony: 'G4' },
            { note: 'F#5', dur: 0.09, harmony: 'A4' },
            { note: 'G5', dur: 0.36, harmony: 'B4' },
          ],
          'square',
          0.17
        );
        this.pauseBgmForJingle(dur);
        break;
      }

      // Fanfarra de Vitória em Combate (estilo Final Fantasy / Dragon Quest)
      case 'victory': {
        const dur = this.playSequence(
          [
            { note: 'C5', dur: 0.11, harmony: 'E4' },
            { note: 'C5', dur: 0.11, harmony: 'E4' },
            { note: 'C5', dur: 0.11, harmony: 'E4' },
            { note: 'C5', dur: 0.28, harmony: 'E4' },
            { note: 'Ab4', dur: 0.24, harmony: 'C4' },
            { note: 'Bb4', dur: 0.24, harmony: 'D4' },
            { note: 'C5', dur: 0.16, harmony: 'E4' },
            { note: 'Bb4', dur: 0.1, harmony: 'D4' },
            { note: 'C5', dur: 0.48, harmony: 'E4' },
          ],
          'square',
          0.18
        );
        this.pauseBgmForJingle(dur);
        break;
      }

      // Fanfarra de Subir de Nível (Level Up clássico da Square Enix!)
      case 'level_up': {
        const dur = this.playSequence(
          [
            { note: 'G4', dur: 0.1, harmony: 'B3' },
            { note: 'B4', dur: 0.1, harmony: 'D4' },
            { note: 'D5', dur: 0.1, harmony: 'G4' },
            { note: 'G5', dur: 0.24, harmony: 'B4' },
            { note: 'E5', dur: 0.18, harmony: 'G4' },
            { note: 'F#5', dur: 0.18, harmony: 'A4' },
            { note: 'G5', dur: 0.5, harmony: 'B4' },
          ],
          'square',
          0.2
        );
        this.pauseBgmForJingle(dur);
        break;
      }

      // Jingle de Derrota em Combate
      case 'defeat': {
        this.stopBgm();
        this.playSequence(
          [
            { note: 'E4', dur: 0.22, harmony: 'G3' },
            { note: 'D#4', dur: 0.22, harmony: 'F#3' },
            { note: 'D4', dur: 0.22, harmony: 'F3' },
            { note: 'C#4', dur: 0.26, harmony: 'E3' },
            { note: 'C4', dur: 0.6, harmony: 'Eb3' },
          ],
          'sawtooth',
          0.15
        );
        break;
      }

      // Jingle de Descanso na Estalagem (Boa Noite clássico de JRPG)
      case 'inn': {
        const dur = this.playSequence(
          [
            { note: 'E5', dur: 0.16, harmony: 'G4' },
            { note: 'D5', dur: 0.16, harmony: 'F4' },
            { note: 'C5', dur: 0.22, harmony: 'E4' },
            { note: 'G4', dur: 0.22, harmony: 'C4' },
            { note: 'A4', dur: 0.18, harmony: 'F4' },
            { note: 'B4', dur: 0.18, harmony: 'G4' },
            { note: 'C5', dur: 0.45, harmony: 'E4' },
          ],
          'triangle',
          0.2
        );
        this.pauseBgmForJingle(dur);
        break;
      }
    }
  }
}

export const soundManager = new AudioManager();
