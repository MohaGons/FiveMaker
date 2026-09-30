import type { ID } from '../../../shared/types/common';
import type { Match } from '../../matches/types';
import type { Team } from '../types';
import { DEFAULT_TEAM_COLORS, TEAM_COLOR_OPTIONS } from './teamColors';

const LONG_DATE = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

function colorEmoji(team: Team, index: number): string {
  const color = team.color ?? DEFAULT_TEAM_COLORS[index];
  return TEAM_COLOR_OPTIONS.find((option) => option.value === color)?.emoji ?? '⚽';
}

function formatTeam(team: Team, index: number): string {
  const players = team.players.map((player) => `• ${player.name}`).join('\n');
  return `${colorEmoji(team, index)} *${team.name}* (${team.players.length})\n${players}`;
}

function formatScorers(match: Match): string[] {
  const names = new Map<ID, string>(
    [...match.teams[0].players, ...match.teams[1].players].map((player) => [player.id, player.name]),
  );
  const lines: string[] = [];

  const scorers = Object.entries(match.playerStats)
    .filter(([, stats]) => stats.goals > 0)
    .sort(([, a], [, b]) => b.goals - a.goals)
    .map(([id, stats]) => `${names.get(id) ?? '?'}${stats.goals > 1 ? ` (${stats.goals})` : ''}`);
  if (scorers.length > 0) lines.push(`🥅 Buteurs : ${scorers.join(', ')}`);

  const mvpName = match.mvpPlayerId ? names.get(match.mvpPlayerId) : undefined;
  if (mvpName) lines.push(`⭐ Homme du match : ${mvpName}`);

  return lines;
}

/**
 * Texte prêt à coller dans un groupe WhatsApp (*gras* au format WhatsApp).
 * Sans match : juste les équipes. Match à venir : date, heure et lieu. Match joué : score et buteurs en plus.
 */
export function formatTeamsMessage(teams: [Team, Team], match?: Match): string {
  const sections: string[] = [];

  if (!match) {
    sections.push('⚽ *Les équipes du five*');
  } else if (match.status === 'completed' && match.score) {
    const [teamA, teamB] = match.teams;
    sections.push(
      [
        `⚽ *Résultat du five — ${LONG_DATE.format(match.playedAt)}*`,
        `${colorEmoji(teamA, 0)} ${teamA.name} *${match.score.teamA} – ${match.score.teamB}* ${teamB.name} ${colorEmoji(teamB, 1)}`,
        ...formatScorers(match),
      ].join('\n'),
    );
  } else {
    const time = match.status === 'scheduled' ? ` à ${TIME.format(match.playedAt)}` : '';
    sections.push(
      [
        `⚽ *Five — ${LONG_DATE.format(match.playedAt)}${time}*`,
        ...(match.location ? [`📍 ${match.location}`] : []),
      ].join('\n'),
    );
  }

  sections.push(formatTeam(teams[0], 0), formatTeam(teams[1], 1));
  return sections.join('\n\n');
}

/** Ouvre WhatsApp (appli sur mobile, WhatsApp Web sur ordinateur) avec le message pré-rempli. */
export function getWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
