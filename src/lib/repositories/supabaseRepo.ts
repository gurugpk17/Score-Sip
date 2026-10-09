import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../supabase/database.types';
import { STORAGE_BUCKET_GAME_SNAPS } from '../supabase/config';
import {
  GamePhoto,
  GameSession,
  Player,
  PlayerStats,
  RoundScore,
  SessionResult
} from '../../domain/models/types';
import {
  IPhotoRepository,
  IPlayerRepository,
  ISessionRepository,
  IStatsRepository
} from './types';
import {
  assembleSessionDomain,
  mapPhotoDbToDomain,
  mapPhotoDomainToDb,
  mapPlayerDbToDomain,
  mapPlayerDomainToDb,
  mapSessionDomainToDb,
  mapStatsDbToDomain,
  mapStatsDomainToDb
} from './mappers';
import { updatePlayerStatistics } from '../../domain/scoring/engine';

export class SupabasePlayerRepository implements IPlayerRepository {
  constructor(private client: SupabaseClient<Database>) {}

  private async getEffectiveUserId(userId?: string): Promise<string | undefined> {
    if (userId) return userId;
    try {
      const { data } = await this.client.auth.getUser();
      return data.user?.id;
    } catch {
      return undefined;
    }
  }

  async getPlayers(userId?: string): Promise<Player[]> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    let query = this.client
      .from('players')
      .select('*')
      .order('seat_number', { ascending: true });

    if (effectiveUserId) {
      query = query.eq('user_id', effectiveUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SupabasePlayerRepository] getPlayers error:', error);
      throw error;
    }

    return (data || []).map(mapPlayerDbToDomain);
  }

  async savePlayers(players: Player[], userId?: string): Promise<void> {
    if (players.length === 0) return;
    const effectiveUserId = await this.getEffectiveUserId(userId);

    const inserts = players.map(p => ({
      ...mapPlayerDomainToDb(p),
      user_id: p.userId || effectiveUserId || null
    }));

    const { error } = await this.client.from('players').upsert(inserts, {
      onConflict: 'id'
    });

    if (error) {
      console.error('[SupabasePlayerRepository] savePlayers error:', error);
      throw error;
    }
  }

  async createPlayer(player: Player, userId?: string): Promise<Player> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const insert = {
      ...mapPlayerDomainToDb(player),
      user_id: player.userId || effectiveUserId || null
    };

    const { error } = await this.client.from('players').upsert(insert, {
      onConflict: 'id'
    });

    if (error) {
      console.error('[SupabasePlayerRepository] createPlayer error:', error);
      throw error;
    }

    return { ...player, userId: effectiveUserId || player.userId };
  }

  async deletePlayer(playerId: string, userId?: string): Promise<void> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    let query = this.client
      .from('players')
      .delete()
      .eq('id', playerId);

    if (effectiveUserId) {
      query = query.eq('user_id', effectiveUserId);
    }

    const { error } = await query;

    if (error) {
      console.error('[SupabasePlayerRepository] deletePlayer error:', error);
      throw error;
    }
  }
}

export class SupabaseSessionRepository implements ISessionRepository {
  constructor(private client: SupabaseClient<Database>) {}

  private async getEffectiveUserId(userId?: string): Promise<string | undefined> {
    if (userId) return userId;
    try {
      const { data } = await this.client.auth.getUser();
      return data.user?.id;
    } catch {
      return undefined;
    }
  }

  async getSessions(userId?: string): Promise<GameSession[]> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    let query = this.client
      .from('sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (effectiveUserId) {
      query = query.eq('user_id', effectiveUserId);
    }

    const { data: sessionRows, error: sErr } = await query;

    if (sErr) {
      console.error('[SupabaseSessionRepository] getSessions error:', sErr);
      throw sErr;
    }

    if (!sessionRows || sessionRows.length === 0) {
      return [];
    }

    const sessionIds = sessionRows.map(s => s.id);

    // Fetch related records in parallel
    const [playersRes, roundsRes, scoresRes, resultsRes, photosRes] = await Promise.all([
      this.client.from('session_players').select('*').in('session_id', sessionIds),
      this.client.from('rounds').select('*').in('session_id', sessionIds),
      this.client.from('round_scores').select('*').in('session_id', sessionIds),
      this.client.from('session_results').select('*').in('session_id', sessionIds),
      this.client.from('game_photos').select('*').in('session_id', sessionIds)
    ]);

    const sessionPlayers = playersRes.data || [];
    const allRounds = roundsRes.data || [];
    const allScores = scoresRes.data || [];
    const allResults = resultsRes.data || [];
    const allPhotos = photosRes.data || [];

    // Fetch player master records for accurate names
    const playerIds = Array.from(new Set(sessionPlayers.map(sp => sp.player_id)));
    let playersMasterMap: Map<string, Player> = new Map();
    if (playerIds.length > 0) {
      const { data: pMaster } = await this.client.from('players').select('*').in('id', playerIds);
      if (pMaster) {
        playersMasterMap = new Map(pMaster.map(p => [p.id, mapPlayerDbToDomain(p)]));
      }
    }

    return sessionRows.map(sRow => {
      const spForThis = sessionPlayers.filter(sp => sp.session_id === sRow.id);
      const players: Player[] = spForThis.map(sp => {
        const master = playersMasterMap.get(sp.player_id);
        return {
          id: sp.player_id,
          userId: master?.userId || (sRow.user_id || undefined),
          name: master?.name || sp.initials || 'Player',
          seatNumber: sp.seat_number,
          isHost: sp.is_host ?? false,
          initials: sp.initials || master?.initials || '',
          avatarColor: sp.avatar_color || master?.avatarColor || '#10b981',
          avatarUrl: sp.avatar_url || master?.avatarUrl || undefined
        };
      }).sort((a, b) => a.seatNumber - b.seatNumber);

      const rForThis = allRounds.filter(r => r.session_id === sRow.id);
      const scForThis = allScores.filter(sc => sc.session_id === sRow.id);
      const resForThis = allResults.filter(res => res.session_id === sRow.id);
      const photosForThis = allPhotos.filter(ph => ph.session_id === sRow.id);

      return assembleSessionDomain({
        sessionRow: sRow,
        players,
        rounds: rForThis,
        scores: scForThis,
        results: resForThis,
        photos: photosForThis
      });
    });
  }

  async getSessionById(id: string, userId?: string): Promise<GameSession | null> {
    const sessions = await this.getSessions(userId);
    return sessions.find(s => s.id === id) || null;
  }

  async saveSession(session: GameSession, userId?: string): Promise<void> {
    const effectiveUserId = await this.getEffectiveUserId(userId || session.userId);

    // 1. Ensure master players exist in players table
    if (session.players.length > 0) {
      const playerInserts = session.players.map(p => ({
        ...mapPlayerDomainToDb(p),
        user_id: p.userId || effectiveUserId || null
      }));
      await this.client.from('players').upsert(playerInserts, { onConflict: 'id' });
    }

    // 2. Upsert session master row
    const sessionInsert = {
      ...mapSessionDomainToDb(session),
      user_id: effectiveUserId || null
    };

    const { error: sErr } = await this.client.from('sessions').upsert(sessionInsert, {
      onConflict: 'id'
    });
    if (sErr) {
      console.error('[SupabaseSessionRepository] saveSession error:', sErr);
      throw sErr;
    }

    // 3. Upsert session_players
    if (session.players.length > 0) {
      const spInserts = session.players.map(p => ({
        session_id: session.id,
        player_id: p.id,
        seat_number: p.seatNumber,
        is_host: p.isHost ?? false,
        initials: p.initials,
        avatar_color: p.avatarColor || '#10b981',
        avatar_url: p.avatarUrl || null
      }));
      await this.client.from('session_players').upsert(spInserts, {
        onConflict: 'session_id,player_id'
      });
    }

    // 4. Upsert rounds & round_scores
    if (session.rounds && session.rounds.length > 0) {
      const roundInserts = session.rounds.map(r => ({
        id: `${session.id}_r${r.roundNumber}`,
        session_id: session.id,
        round_number: r.roundNumber,
        multiplier: r.multiplier,
        is_completed: r.isCompleted
      }));
      await this.client.from('rounds').upsert(roundInserts, { onConflict: 'id' });

      const scoreInserts: Database['public']['Tables']['round_scores']['Insert'][] = [];
      for (const r of session.rounds) {
        const roundId = `${session.id}_r${r.roundNumber}`;
        for (const [playerId, sc] of Object.entries(r.scores)) {
          if (sc) {
            scoreInserts.push({
              id: `${roundId}_${playerId}`,
              round_id: roundId,
              session_id: session.id,
              player_id: playerId,
              base_score: sc.baseScore,
              multiplier: sc.multiplier,
              final_score: sc.finalScore,
              score_type: sc.scoreType,
              entered: sc.entered
            });
          }
        }
      }

      if (scoreInserts.length > 0) {
        await this.client.from('round_scores').upsert(scoreInserts, { onConflict: 'id' });
      }
    }

    // 5. Upsert results if present
    if (session.results && session.results.length > 0) {
      const resultInserts = session.results.map(res => ({
        id: `${session.id}_${res.playerId}`,
        session_id: session.id,
        player_id: res.playerId,
        player_name: res.playerName,
        total_score: res.totalScore,
        final_position: res.finalPosition,
        is_winner: res.isWinner,
        is_runner_up: res.isRunnerUp,
        is_tea_duty: res.isTeaDuty,
        dick_hands_count: res.dickHandsCount,
        busts_count: res.bustsCount
      }));
      await this.client.from('session_results').upsert(resultInserts, { onConflict: 'id' });
    }

    // 6. Upsert photos if present
    if (session.photos && session.photos.length > 0) {
      const photoInserts = session.photos.map(p => ({
        ...mapPhotoDomainToDb(p),
        user_id: p.userId || effectiveUserId || null
      }));
      await this.client.from('game_photos').upsert(photoInserts, { onConflict: 'id' });
    }
  }

  async saveSessions(sessions: GameSession[], userId?: string): Promise<void> {
    for (const session of sessions) {
      await this.saveSession(session, userId);
    }
  }

  async getActiveSessionId(userId?: string): Promise<string | null> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    let query = this.client
      .from('sessions')
      .select('id')
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1);

    if (effectiveUserId) {
      query = query.eq('user_id', effectiveUserId);
    }

    const { data } = await query.maybeSingle();
    return data?.id || null;
  }

  async setActiveSessionId(id: string | null, userId?: string): Promise<void> {
    // For backward compatibility, also keep app_settings synced when non-user
    if (!userId) {
      try {
        await this.client.from('app_settings').upsert({
          key: 'active_session_id',
          value: (id || '') as unknown as Database['public']['Tables']['app_settings']['Insert']['value']
        });
      } catch {
        // Ignore if app_settings is disabled/restricted
      }
    }
  }

  async saveRoundScore(
    sessionId: string,
    roundNumber: number,
    playerId: string,
    score: RoundScore
  ): Promise<void> {
    const roundId = `${sessionId}_r${roundNumber}`;
    // Ensure round exists
    await this.client.from('rounds').upsert(
      {
        id: roundId,
        session_id: sessionId,
        round_number: roundNumber,
        multiplier: score.multiplier,
        is_completed: false
      },
      { onConflict: 'id' }
    );

    // Upsert granular score entry
    const scoreId = `${roundId}_${playerId}`;
    const insertData: Database['public']['Tables']['round_scores']['Insert'] = {
      id: scoreId,
      round_id: roundId,
      session_id: sessionId,
      player_id: playerId,
      base_score: score.baseScore,
      multiplier: score.multiplier,
      final_score: score.finalScore,
      score_type: score.scoreType,
      entered: score.entered
    };

    const { error } = await this.client
      .from('round_scores')
      .upsert(insertData, { onConflict: 'id' });

    if (error) {
      console.error('[SupabaseSessionRepository] saveRoundScore error:', error);
      throw error;
    }
  }

  async finalizeSession(session: GameSession, results: SessionResult[]): Promise<void> {
    const effectiveUserId = await this.getEffectiveUserId(session.userId);
    const completedAt = new Date().toISOString();

    // 1. Update session status
    await this.client
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: completedAt,
        is_finalized: true
      })
      .eq('id', session.id);

    // 2. Insert finalized results
    const resultInserts = results.map(res => ({
      id: `${session.id}_${res.playerId}`,
      session_id: session.id,
      player_id: res.playerId,
      player_name: res.playerName,
      total_score: res.totalScore,
      final_position: res.finalPosition,
      is_winner: res.isWinner,
      is_runner_up: res.isRunnerUp,
      is_tea_duty: res.isTeaDuty,
      dick_hands_count: res.dickHandsCount,
      busts_count: res.bustsCount
    }));

    await this.client.from('session_results').upsert(resultInserts, { onConflict: 'id' });

    // 3. Clear active session
    await this.setActiveSessionId(null, effectiveUserId);
  }
}

export class SupabaseStatsRepository implements IStatsRepository {
  constructor(private client: SupabaseClient<Database>) {}

  private async getEffectiveUserId(userId?: string): Promise<string | undefined> {
    if (userId) return userId;
    try {
      const { data } = await this.client.auth.getUser();
      return data.user?.id;
    } catch {
      return undefined;
    }
  }

  async getPlayerStats(userId?: string): Promise<Record<string, PlayerStats>> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    let query = this.client.from('player_stats').select('*');

    if (effectiveUserId) {
      query = query.eq('user_id', effectiveUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SupabaseStatsRepository] getPlayerStats error:', error);
      throw error;
    }

    const result: Record<string, PlayerStats> = {};
    for (const row of data || []) {
      result[row.player_id] = mapStatsDbToDomain(row);
    }
    return result;
  }

  async savePlayerStats(stats: Record<string, PlayerStats>, userId?: string): Promise<void> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const inserts = Object.values(stats).map(s => ({
      ...mapStatsDomainToDb(s),
      user_id: s.userId || effectiveUserId || null
    }));
    if (inserts.length === 0) return;

    const { error } = await this.client.from('player_stats').upsert(inserts, {
      onConflict: 'player_id'
    });

    if (error) {
      console.error('[SupabaseStatsRepository] savePlayerStats error:', error);
      throw error;
    }
  }

  async updateStatsForSession(
    currentStats: Record<string, PlayerStats>,
    session: GameSession,
    results: SessionResult[],
    userId?: string
  ): Promise<Record<string, PlayerStats>> {
    if (session.isFinalized) {
      return currentStats;
    }

    const effectiveUserId = userId || session.userId;
    const updated = updatePlayerStatistics(currentStats, session, results);
    await this.savePlayerStats(updated, effectiveUserId);
    return updated;
  }
}

export class SupabasePhotoRepository implements IPhotoRepository {
  constructor(private client: SupabaseClient<Database>) {}

  private async getEffectiveUserId(userId?: string): Promise<string | undefined> {
    if (userId) return userId;
    try {
      const { data } = await this.client.auth.getUser();
      return data.user?.id;
    } catch {
      return undefined;
    }
  }

  async getPhotosForSession(sessionId: string, _userId?: string): Promise<GamePhoto[]> {
    const { data, error } = await this.client
      .from('game_photos')
      .select('*')
      .eq('session_id', sessionId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('[SupabasePhotoRepository] getPhotosForSession error:', error);
      throw error;
    }

    return (data || []).map(mapPhotoDbToDomain);
  }

  async getAllPhotos(userId?: string): Promise<GamePhoto[]> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    let query = this.client
      .from('game_photos')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (effectiveUserId) {
      query = query.eq('user_id', effectiveUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SupabasePhotoRepository] getAllPhotos error:', error);
      throw error;
    }

    return (data || []).map(mapPhotoDbToDomain);
  }

  async savePhotoMetadata(photo: GamePhoto, userId?: string): Promise<void> {
    const effectiveUserId = await this.getEffectiveUserId(userId || photo.userId);
    const insert = {
      ...mapPhotoDomainToDb(photo),
      user_id: effectiveUserId || null
    };

    const { error } = await this.client.from('game_photos').upsert(insert, {
      onConflict: 'id'
    });

    if (error) {
      console.error('[SupabasePhotoRepository] savePhotoMetadata error:', error);
      throw error;
    }
  }

  async deletePhoto(sessionId: string, photoId: string, storagePath?: string, userId?: string): Promise<void> {
    const { error } = await this.client.from('game_photos').delete().eq('id', photoId);
    if (error) {
      console.error('[SupabasePhotoRepository] deletePhoto error:', error);
      throw error;
    }

    if (storagePath && storagePath.includes(STORAGE_BUCKET_GAME_SNAPS)) {
      try {
        const effectiveUserId = await this.getEffectiveUserId(userId);
        const folder = effectiveUserId ? `${effectiveUserId}/${sessionId}` : sessionId;
        const fullPath = `${folder}/${photoId}_full.jpg`;
        const thumbPath = `${folder}/${photoId}_thumb.jpg`;
        await this.client.storage
          .from(STORAGE_BUCKET_GAME_SNAPS)
          .remove([fullPath, thumbPath, `${sessionId}/${photoId}_full.jpg`, `${sessionId}/${photoId}_thumb.jpg`]);
      } catch (err) {
        console.warn('[SupabasePhotoRepository] Storage file cleanup warning:', err);
      }
    }
  }

  async uploadPhoto(
    sessionId: string,
    photoId: string,
    fileOrBase64: File | string,
    thumbnailDataUrl?: string,
    userId?: string
  ): Promise<{ storagePath: string; thumbnailUrl: string }> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const folder = effectiveUserId ? `${effectiveUserId}/${sessionId}` : sessionId;
    const fullPath = `${folder}/${photoId}_full.jpg`;
    const thumbPath = `${folder}/${photoId}_thumb.jpg`;

    // Convert file / dataUrl to Blob
    const fullBlob = await this.toBlob(fileOrBase64);
    const thumbBlob = thumbnailDataUrl ? await this.toBlob(thumbnailDataUrl) : fullBlob;

    // Upload full image
    const { error: fullErr } = await this.client.storage
      .from(STORAGE_BUCKET_GAME_SNAPS)
      .upload(fullPath, fullBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (fullErr) {
      console.error('[SupabasePhotoRepository] Full upload failed:', fullErr);
      throw fullErr;
    }

    // Upload thumbnail
    await this.client.storage
      .from(STORAGE_BUCKET_GAME_SNAPS)
      .upload(thumbPath, thumbBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    // Get public URLs
    const { data: fullUrlData } = this.client.storage
      .from(STORAGE_BUCKET_GAME_SNAPS)
      .getPublicUrl(fullPath);

    const { data: thumbUrlData } = this.client.storage
      .from(STORAGE_BUCKET_GAME_SNAPS)
      .getPublicUrl(thumbPath);

    return {
      storagePath: fullUrlData.publicUrl,
      thumbnailUrl: thumbUrlData.publicUrl
    };
  }

  async toggleLike(photoId: string): Promise<number> {
    const { data: photo } = await this.client
      .from('game_photos')
      .select('likes')
      .eq('id', photoId)
      .single();

    const newLikes = (photo?.likes || 0) + 1;
    await this.client
      .from('game_photos')
      .update({ likes: newLikes })
      .eq('id', photoId);

    return newLikes;
  }

  private async toBlob(fileOrBase64: File | string): Promise<Blob> {
    if (fileOrBase64 instanceof Blob) {
      return fileOrBase64;
    }

    if (typeof fileOrBase64 === 'string') {
      const parts = fileOrBase64.split(',');
      const byteString = atob(parts[1] || parts[0]);
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mime });
    }

    throw new Error('Unsupported image format for upload');
  }
}
