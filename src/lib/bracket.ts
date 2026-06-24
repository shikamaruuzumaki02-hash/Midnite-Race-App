import type { TournamentEntry, Match } from "@/types/database";

/**
 * Tamanhos de chave suportados por enquanto.
 * Qualquer outro número de pilotos inscritos é rejeitado na geração.
 */
export const SUPPORTED_BRACKET_SIZES = [4, 8, 16] as const;

/**
 * Nomes de rodada, na ordem em que acontecem, para cada tamanho de chave.
 * O índice 0 é a primeira rodada (a que tem mais partidas).
 */
const ROUND_NAMES_BY_SIZE: Record<number, string[]> = {
  4: ["Semifinal", "Final"],
  8: ["Quartas", "Semifinal", "Final"],
  16: ["Oitavas", "Quartas", "Semifinal", "Final"],
};

export type BracketPair = {
  driverAId: string;
  driverBId: string;
};

/**
 * Retorna a lista de nomes de rodada esperada para um determinado número
 * de pilotos inscritos (ex: 8 -> ["Quartas", "Semifinal", "Final"]).
 * Lança erro se o número não for suportado.
 */
export function getRoundSequence(numPlayers: number): string[] {
  const sequence = ROUND_NAMES_BY_SIZE[numPlayers];
  if (!sequence) {
    throw new Error(
      `Número de pilotos não suportado para chave de mata-mata: ${numPlayers}. ` +
        `Use exatamente ${SUPPORTED_BRACKET_SIZES.join(", ")} pilotos.`
    );
  }
  return sequence;
}

/**
 * Dado o nome da rodada atual e o número de pilotos do torneio,
 * retorna o nome da próxima rodada, ou null se a atual já era a Final.
 */
export function getNextRoundName(currentRound: string, numPlayers: number): string | null {
  const sequence = getRoundSequence(numPlayers);
  const currentIndex = sequence.indexOf(currentRound);
  if (currentIndex === -1) {
    throw new Error(
      `Nome de rodada desconhecido: "${currentRound}". Esperado um de: ${sequence.join(", ")}`
    );
  }
  const nextIndex = currentIndex + 1;
  if (nextIndex >= sequence.length) return null;
  return sequence[nextIndex];
}

/**
 * Valida se o número de pilotos inscritos é um tamanho de chave suportado.
 * Retorna uma mensagem de erro amigável em português, ou null se estiver tudo certo.
 */
export function validateEntryCount(numEntries: number): string | null {
  if (SUPPORTED_BRACKET_SIZES.includes(numEntries as 4 | 8 | 16)) return null;

  const sorted = [...SUPPORTED_BRACKET_SIZES].sort((a, b) => a - b);
  const closest = sorted.reduce((best, size) =>
    Math.abs(size - numEntries) < Math.abs(best - numEntries) ? size : best
  );

  if (numEntries < sorted[0]) {
    return `É preciso ter pelo menos ${sorted[0]} pilotos inscritos para gerar a chave (hoje há ${numEntries}).`;
  }

  return (
    `A chave de mata-mata só funciona com exatamente ${sorted.join(", ")} pilotos inscritos. ` +
    `Hoje há ${numEntries} pilotos inscritos — o mais próximo seria ${closest}. ` +
    `Inscreva ou remova pilotos até bater um desses números.`
  );
}

/**
 * Gera os confrontos da primeira rodada a partir das entries inscritas,
 * usando o campo "seed" para definir o emparelhamento clássico de chave
 * (1 vs N, 2 vs N-1, etc.), minimizando que os melhores seeds se encontrem cedo.
 *
 * Pilotos sem seed definido (null) são tratados como seed mais alto (entram no final da ordem).
 */
export function generateFirstRoundPairs(entries: TournamentEntry[]): BracketPair[] {
  const numEntries = entries.length;
  const validationError = validateEntryCount(numEntries);
  if (validationError) throw new Error(validationError);

  // Ordena por seed (menor = mais bem ranqueado). Sem seed vai para o fim.
  const sorted = [...entries].sort((a, b) => {
    const seedA = a.seed ?? Number.MAX_SAFE_INTEGER;
    const seedB = b.seed ?? Number.MAX_SAFE_INTEGER;
    return seedA - seedB;
  });

  const n = sorted.length;
  const pairs: BracketPair[] = [];

  // Emparelhamento padrão de chave: posição i contra posição (n - 1 - i)
  for (let i = 0; i < n / 2; i++) {
    const top = sorted[i];
    const bottom = sorted[n - 1 - i];
    pairs.push({ driverAId: top.driver_id, driverBId: bottom.driver_id });
  }

  return pairs;
}

/**
 * Dado todas as partidas de uma rodada que acabou de fechar (todas com winner_id
 * preenchido), retorna os pares de confronto da próxima rodada, mantendo a ordem
 * do bracket (vencedor da partida 1 contra vencedor da partida 2, etc.).
 *
 * As partidas devem estar ordenadas na mesma ordem em que foram criadas
 * (ordem de geração da rodada anterior), não por data/horário.
 */
export function pairWinnersForNextRound(roundMatches: Match[]): BracketPair[] {
  const incomplete = roundMatches.filter((m) => !m.winner_id);
  if (incomplete.length > 0) {
    throw new Error(
      "Ainda há partidas sem vencedor definido nesta rodada. " +
        "Lance o resultado de todas antes de avançar a chave."
    );
  }

  const winners = roundMatches.map((m) => m.winner_id as string);

  if (winners.length % 2 !== 0) {
    throw new Error(
      "Número ímpar de vencedores — não é possível parear a próxima rodada. " +
        "Verifique se todas as partidas da rodada atual foram geradas corretamente."
    );
  }

  const pairs: BracketPair[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    pairs.push({ driverAId: winners[i], driverBId: winners[i + 1] });
  }
  return pairs;
}

/**
 * Verifica se todas as partidas de uma rodada já têm vencedor definido,
 * ou seja, se a rodada está pronta para gerar a próxima.
 */
export function isRoundComplete(roundMatches: Match[]): boolean {
  return roundMatches.length > 0 && roundMatches.every((m) => !!m.winner_id);
}
