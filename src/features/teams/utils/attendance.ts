import type { ID } from '../../../shared/types/common';
import type { Player } from '../../players/types';
import type { LineupResponse } from '../types';

export interface AttendanceSummary {
  /** Réponse au sondage de chaque joueur qui a répondu (true : il vient). */
  responseById: Map<ID, boolean>;
  /** Ont dit « je viens » alors que la composition était pleine, du premier au dernier arrivé. */
  waitlist: Player[];
  /** Ont dit « je ne viens pas » (et n'ont pas été ajoutés à la main depuis). */
  declined: Player[];
  /** Habitués ni dans la composition ni ayant répondu : ceux à relancer. */
  pending: Player[];
}

/** Où en est le sondage du prochain match, pour les joueurs existants du groupe. */
export function summarizeAttendance(
  players: Player[],
  lineupIds: Set<ID>,
  responses: LineupResponse[],
): AttendanceSummary {
  const responseById = new Map(responses.map((response) => [response.playerId, response.attending]));
  const respondedAt = new Map(responses.map((response) => [response.playerId, response.respondedAt.getTime()]));
  const outsideLineup = players.filter((player) => !lineupIds.has(player.id));

  return {
    responseById,
    waitlist: outsideLineup
      .filter((player) => responseById.get(player.id) === true)
      .sort((a, b) => respondedAt.get(a.id)! - respondedAt.get(b.id)!),
    declined: outsideLineup.filter((player) => responseById.get(player.id) === false),
    pending: outsideLineup.filter((player) => !player.isGuest && !responseById.has(player.id)),
  };
}
