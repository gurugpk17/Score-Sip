import {
  GameConfig,
  GamePhoto,
  GameRound,
  GameSession,
  Player,
  PlayerStats,
  RoundScore,
  SessionResult
} from '../../domain/models/types';
import { Database } from '../supabase/database.types';

type PlayerRow = Database['public']['Tables']['players']['Row'];
type PlayerInsert = Database['public']['Tables']['players']['Insert'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];
type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type SessionPlayerRow = Database['public']['Tables']['session_players']['Row'];
type RoundRow = Database['public']['Tables']['rounds']['Row'];
type RoundScoreRow = Database['public']['Tables']['round_scores']['Row'];
type SessionResultRow = Database['public']['Tables']['session_results']['Row'];
type PlayerStatsRow = Database['public']['Tables']['player_stats']['Row'];
type PlayerStatsInsert = Database['public']['Tables']['player_stats']['Insert'];
type GamePhotoRow = Database['public']['Tables']['game_photos']['Row'];
type GamePhotoInsert = Database['public']['Tables']['game_photos']['Insert'];

export function mapPlayerDbToDomain(row: PlayerRow): Player {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    name: row.name,
    seatNumber: row.seat_number,
    isHost: row.is_host,
    avatarUrl: row.avatar_url || undefined,
    initials: row.initials || row.name.charAt(0).toUpperCase(),
    avatarColor: row.avatar_color || '#10b981'
  };
}

export function mapPlayerDomainToDb(player: Player): PlayerInsert {
  return {
    id: player.id,
    user_id: player.userId || null,
    name: player.name,
    seat_number: player.seatNumber,
    is_host: player.isHost ?? false,
    avatar_url: player.avatarUrl || null,
    initials: player.initials || player.name.charAt(0).toUpperCase(),
    avatar_color: player.avatarColor || '#10b981'
  };
}

export function mapStatsDbToDomain(row: PlayerStatsRow): PlayerStats {
  const recentResults = Array.isArray(row.recent_results)
    ? (row.recent_results as ('win' | 'podium' | 'safe' | 'tea')[])
    : [];

  return {
    playerId: row.player_id,
    userId: row.user_id || undefined,
    playerName: row.player_name,
    sessionsPlayed: row.sessions_played,
    wins: row.wins,
    runnerUps: row.runner_ups,
    teaBought: row.tea_bought,
    averageScore: Number(row.average_score) || 0,
    bestScore: Number(row.best_score) || 0,
    worstScore: Number(row.worst_score) || 0,
    winRatio: Number(row.win_ratio) || 0,
    recentResults
  };
}

export function mapStatsDomainToDb(stats: PlayerStats): PlayerStatsInsert {
  return {
    player_id: stats.playerId,
    user_id: stats.userId || null,
    player_name: stats.playerName,
    sessions_played: stats.sessionsPlayed,
    wins: stats.wins,
    runner_ups: stats.runnerUps,
    tea_bought: stats.teaBought,
    average_score: stats.averageScore,
    best_score: stats.bestScore,
    worst_score: stats.worstScore,
    win_ratio: stats.winRatio,
    recent_results: stats.recentResults
  };
}

export function mapPhotoDbToDomain(row: GamePhotoRow): GamePhoto {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    sessionId: row.session_id,
    gameName: row.game_name,
    sessionName: row.session_name,
    storagePath: row.storage_path,
    thumbnailUrl: row.thumbnail_url || undefined,
    caption: row.caption,
    subCaption: row.sub_caption || undefined,
    tag: row.tag || undefined,
    badge: row.badge || undefined,
    playerInitials: row.player_initials || [],
    likes: row.likes || 0,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by || undefined
  };
}

export function mapPhotoDomainToDb(photo: GamePhoto): GamePhotoInsert {
  return {
    id: photo.id,
    user_id: photo.userId || null,
    session_id: photo.sessionId,
    game_name: photo.gameName,
    session_name: photo.sessionName,
    storage_path: photo.storagePath,
    thumbnail_url: photo.thumbnailUrl || null,
    caption: photo.caption,
    sub_caption: photo.subCaption || null,
    tag: photo.tag || null,
    badge: photo.badge || null,
    player_initials: photo.playerInitials || [],
    likes: photo.likes || 0,
    uploaded_at: photo.uploadedAt,
    uploaded_by: photo.uploadedBy || null
  };
}

export function mapSessionDomainToDb(session: GameSession): SessionInsert {
  return {
    id: session.id,
    user_id: session.userId || null,
    name: session.name,
    status: session.status,
    game_config: session.gameConfig as unknown as Database['public']['Tables']['sessions']['Insert']['game_config'],
    current_round_number: session.currentRoundNumber,
    started_at: session.startedAt,
    completed_at: session.completedAt || null,
    is_finalized: session.isFinalized,
    tea_settled: session.teaSettled || false,
    table_note: session.tableNote || null
  };
}

export function assembleSessionDomain(params: {
  sessionRow: SessionRow;
  players: Player[];
  rounds: RoundRow[];
  scores: RoundScoreRow[];
  results?: SessionResultRow[];
  photos?: GamePhotoRow[];
}): GameSession {
  const { sessionRow, players, rounds, scores, results, photos } = params;

  // Build rounds
  const roundsList: GameRound[] = rounds
    .sort((a, b) => a.round_number - b.round_number)
    .map(r => {
      const roundScoresForThisRound = scores.filter(s => s.round_id === r.id);
      const scoresMap: Record<string, RoundScore> = {};

      for (const sc of roundScoresForThisRound) {
        scoresMap[sc.player_id] = {
          playerId: sc.player_id,
          baseScore: Number(sc.base_score),
          multiplier: Number(sc.multiplier),
          finalScore: Number(sc.final_score),
          scoreType: sc.score_type,
          entered: sc.entered
        };
      }

      return {
        roundNumber: r.round_number,
        multiplier: Number(r.multiplier),
        scores: scoresMap,
        isCompleted: r.is_completed
      };
    });

  // Build results
  const sessionResults: SessionResult[] | undefined = results && results.length > 0
    ? results.map(res => ({
        sessionId: res.session_id,
        playerId: res.player_id,
        playerName: res.player_name,
        totalScore: Number(res.total_score),
        finalPosition: res.final_position,
        isWinner: res.is_winner,
        isRunnerUp: res.is_runner_up,
        isTeaDuty: res.is_tea_duty,
        dickHandsCount: res.dick_hands_count,
        bustsCount: res.busts_count
      }))
    : undefined;

  // Build photos
  const sessionPhotos: GamePhoto[] | undefined = photos && photos.length > 0
    ? photos.map(mapPhotoDbToDomain)
    : undefined;

  return {
    id: sessionRow.id,
    userId: sessionRow.user_id || undefined,
    name: sessionRow.name,
    gameConfig: sessionRow.game_config as unknown as GameConfig,
    status: sessionRow.status,
    players: players.length > 0 ? players : [],
    currentRoundNumber: sessionRow.current_round_number,
    rounds: roundsList,
    startedAt: sessionRow.started_at,
    completedAt: sessionRow.completed_at || undefined,
    isFinalized: sessionRow.is_finalized,
    teaSettled: sessionRow.tea_settled,
    tableNote: sessionRow.table_note || undefined,
    results: sessionResults,
    photos: sessionPhotos
  };
}
