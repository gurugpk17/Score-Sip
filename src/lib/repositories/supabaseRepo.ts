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

  async getPlayers(): Promise<Player[]> {
    const { data, error } = await this.client
      .from('players')
      .select('*')
      .order('seat_number', { ascending: true });

    if (error) {
      console.error('[SupabasePlayerRepository] getPlayers error:', error);
      throw error;
    }

    return (data || []).map(mapPlayerDbToDomain);
  }

  async savePlayers(players: Player[]): Promise<void> {
    if (players.length === 0) return;

    const inserts = players.map(mapPlayerDomainToDb);
    const { error } = await this.client.from('players').upsert(inserts, {
      onConflict: 'id'
    });

    if (error) {
      console.error('[SupabasePlayerRepository] savePlayers error:', error);
      throw error;
    }
  }

  async createPlayer(player: Player): Promise<Player> {
    const insert = mapPlayerDomainToDb(player);
    const { error } = await this.client.from('players').upsert(insert, {
      onConflict: 'id'
    });

    if (error) {
      console.error('[SupabasePlayerRepository] createPlayer error:', error);
      throw error;
    }

    return player;
  }

  async deletePlayer(playerId: string): Promise<void> {
    const { error } = await this.client
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) {
      console.error('[SupabasePlayerRepository] deletePlayer error:', error);
      throw error;
    }
  }
}

export class SupabaseSessionRepository implements ISessionRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getSessions(): Promise<GameSession[]> {
    const { data: sessionRows, error: sErr } = await this.client
      .from('sessions')
      .select('*')
      .order('started_at', { ascending: false });

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

  async getSessionById(id: string): Promise<GameSession | null> {
    const sessions = await this.getSessions();
    return sessions.find(s => s.id === id) || null;
  }

  async saveSession(session: GameSession): Promise<void> {
    // 1. Ensure master players exist in players table
    if (session.players.length > 0) {
      const playerInserts = session.players.map(mapPlayerDomainToDb);
      await this.client.from('players').upsert(playerInserts, { onConflict: 'id' });
    }

    // 2. Upsert session master row
    const sessionInsert = mapSessionDomainToDb(session);
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
      const photoInserts = session.photos.map(mapPhotoDomainToDb);
      await this.client.from('game_photos').upsert(photoInserts, { onConflict: 'id' });
    }
  }

  async saveSessions(sessions: GameSession[]): Promise<void> {
    for (const session of sessions) {
      await this.saveSession(session);
    }
  }

  async getActiveSessionId(): Promise<string | null> {
    const { data } = await this.client
      .from('app_settings')
      .select('value')
      .eq('key', 'active_session_id')
      .maybeSingle();

    if (data && typeof data.value === 'string') {
      return data.value;
    }
    return null;
  }

  async setActiveSessionId(id: string | null): Promise<void> {
    await this.client.from('app_settings').upsert({
      key: 'active_session_id',
      value: (id || '') as unknown as Database['public']['Tables']['app_settings']['Insert']['value']
    });
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

    // Save score
    const scoreId = `${roundId}_${playerId}`;
    await this.client.from('round_scores').upsert(
      {
        id: scoreId,
        round_id: roundId,
        session_id: sessionId,
        player_id: playerId,
        base_score: score.baseScore,
        multiplier: score.multiplier,
        final_score: score.finalScore,
        score_type: score.scoreType,
        entered: score.entered
      },
      { onConflict: 'id' }
    );
  }

  async finalizeSession(session: GameSession, results: SessionResult[]): Promise<void> {
    const finalizedSession: GameSession = {
      ...session,
      status: 'completed',
      completedAt: new Date().toISOString(),
      isFinalized: true,
      results
    };
    await this.saveSession(finalizedSession);
    await this.setActiveSessionId(null);
  }
}

export class SupabaseStatsRepository implements IStatsRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getPlayerStats(): Promise<Record<string, PlayerStats>> {
    const { data, error } = await this.client.from('player_stats').select('*');
    if (error) {
      console.error('[SupabaseStatsRepository] getPlayerStats error:', error);
      throw error;
    }

    const map: Record<string, PlayerStats> = {};
    for (const row of data || []) {
      map[row.player_id] = mapStatsDbToDomain(row);
    }
    return map;
  }

  async savePlayerStats(stats: Record<string, PlayerStats>): Promise<void> {
    const inserts = Object.values(stats).map(mapStatsDomainToDb);
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
    results: SessionResult[]
  ): Promise<Record<string, PlayerStats>> {
    // Idempotency: verify session is not already finalized
    if (session.isFinalized) {
      return currentStats;
    }

    const updated = updatePlayerStatistics(currentStats, session, results);
    await this.savePlayerStats(updated);
    return updated;
  }
}

export class SupabasePhotoRepository implements IPhotoRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getPhotosForSession(sessionId: string): Promise<GamePhoto[]> {
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

  async getAllPhotos(): Promise<GamePhoto[]> {
    const { data, error } = await this.client
      .from('game_photos')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('[SupabasePhotoRepository] getAllPhotos error:', error);
      throw error;
    }

    return (data || []).map(mapPhotoDbToDomain);
  }

  async savePhotoMetadata(photo: GamePhoto): Promise<void> {
    const insert = mapPhotoDomainToDb(photo);
    const { error } = await this.client.from('game_photos').upsert(insert, {
      onConflict: 'id'
    });

    if (error) {
      console.error('[SupabasePhotoRepository] savePhotoMetadata error:', error);
      throw error;
    }
  }

  async deletePhoto(sessionId: string, photoId: string, storagePath?: string): Promise<void> {
    // 1. Delete DB record
    const { error } = await this.client.from('game_photos').delete().eq('id', photoId);
    if (error) {
      console.error('[SupabasePhotoRepository] deletePhoto error:', error);
      throw error;
    }

    // 2. If storagePath refers to bucket, delete from storage
    if (storagePath && storagePath.includes(STORAGE_BUCKET_GAME_SNAPS)) {
      try {
        const fullPath = `${sessionId}/${photoId}_full.jpg`;
        const thumbPath = `${sessionId}/${photoId}_thumb.jpg`;
        await this.client.storage
          .from(STORAGE_BUCKET_GAME_SNAPS)
          .remove([fullPath, thumbPath]);
      } catch (err) {
        console.warn('[SupabasePhotoRepository] Storage file cleanup warning:', err);
      }
    }
  }

  async uploadPhoto(
    sessionId: string,
    photoId: string,
    fileOrBase64: File | string,
    thumbnailDataUrl?: string
  ): Promise<{ storagePath: string; thumbnailUrl: string }> {
    const fullPath = `${sessionId}/${photoId}_full.jpg`;
    const thumbPath = `${sessionId}/${photoId}_thumb.jpg`;

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
