import { describe, expect, it } from 'vitest';
import { makePlayer } from '../../../test/factories';
import type { Player } from '../../players/types';
import type { LineupResponse } from '../types';
import { summarizeAttendance } from './attendance';

function respond(playerId: string, attending: boolean, minute: number): LineupResponse {
  return { playerId, attending, respondedAt: new Date(2026, 9, 1, 20, minute) };
}

const names = (players: Player[]) => players.map((player) => player.id);

describe('summarizeAttendance', () => {
  const players = ['in', 'late', 'early', 'no', 'silent'].map((id) => makePlayer(id));
  const guest = { ...makePlayer('guest'), isGuest: true };

  it('range chaque joueur hors composition selon sa réponse', () => {
    const summary = summarizeAttendance([...players, guest], new Set(['in']), [
      respond('in', true, 0),
      respond('late', true, 30),
      respond('early', true, 10),
      respond('no', false, 5),
    ]);

    expect(names(summary.waitlist)).toEqual(['early', 'late']);
    expect(names(summary.declined)).toEqual(['no']);
    // Les invités ne font pas partie des habitués à relancer.
    expect(names(summary.pending)).toEqual(['silent']);
    expect(summary.responseById.get('in')).toBe(true);
    expect(summary.responseById.get('no')).toBe(false);
  });

  it('ne compte pas comme absent un joueur ajouté à la main après avoir dit non', () => {
    const summary = summarizeAttendance(players, new Set(['no']), [respond('no', false, 0)]);

    expect(summary.declined).toEqual([]);
    expect(summary.responseById.get('no')).toBe(false);
  });

  it('ignore les réponses de joueurs supprimés', () => {
    const summary = summarizeAttendance(players, new Set(), [respond('deleted', true, 0)]);

    expect(summary.waitlist).toEqual([]);
  });
});
