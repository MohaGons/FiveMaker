import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { CollisionDetection, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { PlayerCard } from '../../players/components/PlayerCard';
import type { Player } from '../../players/types';
import type { ID } from '../../../shared/types/common';
import type { Team } from '../types';
import type { GetLevel } from '../utils/balanceTeams';
import type { TeamLabel } from '../hooks/useTeamLabels';
import { parseDropId } from '../utils/dropTargets';
import { TeamColumn } from './TeamColumn';

interface TeamsBoardProps {
  teams: [Team, Team];
  labels: [TeamLabel, TeamLabel];
  getLevel?: GetLevel;
  onTeamsChange: (teams: [Team, Team]) => void;
  onLabelChange: (index: 0 | 1, change: Partial<TeamLabel>) => void;
}

/**
 * Sous le pointeur, un joueur est aussi dans la zone de son équipe : on privilégie le joueur (échange).
 * Hors de toute zone (ex. clavier), on retombe sur la zone la plus recouverte.
 */
const collisionDetection: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  const onPlayer = within.filter((collision) => parseDropId(String(collision.id))?.type === 'player');
  if (onPlayer.length > 0) return onPlayer;
  return within.length > 0 ? within : rectIntersection(args);
};

function findTeamIndex(teams: [Team, Team], playerId: ID): 0 | 1 | null {
  if (teams[0].players.some((player) => player.id === playerId)) return 0;
  if (teams[1].players.some((player) => player.id === playerId)) return 1;
  return null;
}

/**
 * Les deux équipes générées, ajustables à la main : glisser un joueur vers l'autre équipe le déplace,
 * le déposer sur un joueur de l'autre équipe échange les deux.
 */
export function TeamsBoard({ teams, labels, getLevel, onTeamsChange, onLabelChange }: TeamsBoardProps) {
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Appui long sur mobile, pour que le défilement de la page reste possible.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setActivePlayer([...teams[0].players, ...teams[1].players].find((player) => player.id === id) ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActivePlayer(null);
    if (!over) return;

    const playerId = String(active.id);
    const from = findTeamIndex(teams, playerId);
    if (from === null) return;

    const target = parseDropId(String(over.id));
    if (!target) return;

    const to = target.type === 'team' ? target.index : findTeamIndex(teams, target.playerId);
    // Dans la même équipe, l'ordre n'a pas d'importance (trié par niveau).
    if (to === null || to === from) return;

    const moved = teams[from].players.find((player) => player.id === playerId)!;
    const swapped =
      target.type === 'player' ? teams[to].players.find((player) => player.id === target.playerId) : undefined;

    const next: [Team, Team] = [...teams];
    next[from] = {
      ...teams[from],
      players: [...teams[from].players.filter((player) => player.id !== playerId), ...(swapped ? [swapped] : [])],
    };
    next[to] = {
      ...teams[to],
      players: [...teams[to].players.filter((player) => player.id !== swapped?.id), moved],
    };
    onTeamsChange(next);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActivePlayer(null)}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {([0, 1] as const).map((index) => (
          <TeamColumn
            key={index}
            index={index}
            team={teams[index]}
            getLevel={getLevel}
            nameInput={labels[index].name}
            onNameChange={(name) => onLabelChange(index, { name })}
            onColorChange={(color) => onLabelChange(index, { color })}
          />
        ))}
      </div>

      <DragOverlay>
        {activePlayer && (
          <div className="rotate-2 cursor-grabbing shadow-xl">
            <PlayerCard player={activePlayer} level={getLevel?.(activePlayer)} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
