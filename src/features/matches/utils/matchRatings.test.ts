import { describe, expect, it } from 'vitest';
import { makeMatch, makePlayer } from '../../../test/factories';
import { applyRatings, areRatingsOpen, pickMvp } from './matchRatings';

const players = ['a', 'b', 'c'].map((id) => makePlayer(id));
const match = makeMatch({ teamA: [players[0]], teamB: [players[1], players[2]], score: [1, 0] });

describe('pickMvp', () => {
  it('ne désigne personne sans notes', () => {
    expect(pickMvp(match, {})).toBeUndefined();
  });

  it('écarte un joueur qui n\'a pas assez de votes', () => {
    const ratings = { a: { average: 5, votes: 1 }, b: { average: 4, votes: 3 } };

    expect(pickMvp(match, ratings)).toBe('b');
  });

  it('abaisse le minimum de votes au maximum reçu', () => {
    const ratings = { a: { average: 5, votes: 2 }, b: { average: 4, votes: 2 } };

    expect(pickMvp(match, ratings)).toBe('a');
  });

  it('départage par le nombre de votes, puis par les buts', () => {
    expect(pickMvp(match, { a: { average: 4, votes: 3 }, b: { average: 4, votes: 4 } })).toBe('b');

    const withGoals = { ...match, playerStats: { c: { goals: 2, assists: 0 } } };
    expect(pickMvp(withGoals, { b: { average: 4, votes: 3 }, c: { average: 4, votes: 3 } })).toBe('c');
  });
});

describe('areRatingsOpen', () => {
  const now = new Date(2026, 5, 10);

  it('ouvre les votes jusqu\'à la date de clôture', () => {
    expect(areRatingsOpen({ ...match, ratingsCloseAt: new Date(2026, 5, 11) }, now)).toBe(true);
    expect(areRatingsOpen({ ...match, ratingsCloseAt: new Date(2026, 5, 9) }, now)).toBe(false);
  });

  it('ferme les votes des anciens matchs et des matchs non joués', () => {
    expect(areRatingsOpen(match, now)).toBe(false);
    expect(areRatingsOpen({ ...match, status: 'scheduled', ratingsCloseAt: new Date(2026, 5, 11) }, now)).toBe(false);
  });
});

describe('applyRatings', () => {
  it('ajoute les moyennes et désigne l\'homme du match', () => {
    const [rated] = applyRatings(
      [match],
      [{ match_id: match.id, player_id: 'a', average: 4.5, votes: 3 }],
      new Map([[match.id, 2]]),
      new Map([[match.id, 1]]),
    );

    expect(rated).toMatchObject({
      ratings: { a: { average: 4.5, votes: 3 } },
      openVoters: 2,
      myRatingsCount: 1,
      mvpPlayerId: 'a',
    });
  });

  it('garde l\'homme du match choisi à la main sur un ancien match sans notes', () => {
    const [rated] = applyRatings([{ ...match, mvpPlayerId: 'c' }], [], new Map(), new Map());

    expect(rated.mvpPlayerId).toBe('c');
  });
});
