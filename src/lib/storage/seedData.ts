import { GameSession, Player, PlayerStats } from '../../domain/models/types';
import { PRESET_GAMES } from '../../domain/scoring/rules';

export const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', name: 'Guru', seatNumber: 1, isHost: true, initials: 'G', avatarColor: '#10b981' },
  { id: 'p2', name: 'Arun', seatNumber: 2, initials: 'A', avatarColor: '#ffb95f' },
  { id: 'p3', name: 'Suresh', seatNumber: 3, initials: 'S', avatarColor: '#ff7a73' },
  { id: 'p4', name: 'Kumar', seatNumber: 4, initials: 'K', avatarColor: '#6ffbbe' },
  { id: 'p5', name: 'Dinesh', seatNumber: 5, initials: 'D', avatarColor: '#ffb4ab' }
];

export const INITIAL_STATS: Record<string, PlayerStats> = {
  'p1': {
    playerId: 'p1',
    playerName: 'Guru',
    sessionsPlayed: 15,
    wins: 8,
    runnerUps: 4,
    teaBought: 1,
    averageScore: 94,
    bestScore: 42,
    worstScore: 168,
    winRatio: 53,
    recentResults: ['win', 'win', 'podium', 'win', 'safe']
  },
  'p2': {
    playerId: 'p2',
    playerName: 'Arun',
    sessionsPlayed: 14,
    wins: 3,
    runnerUps: 6,
    teaBought: 2,
    averageScore: 112,
    bestScore: 68,
    worstScore: 182,
    winRatio: 21,
    recentResults: ['podium', 'safe', 'podium', 'win', 'safe']
  },
  'p3': {
    playerId: 'p3',
    playerName: 'Suresh',
    sessionsPlayed: 15,
    wins: 1,
    runnerUps: 2,
    teaBought: 8,
    averageScore: 148,
    bestScore: 84,
    worstScore: 236,
    winRatio: 7,
    recentResults: ['tea', 'safe', 'tea', 'podium', 'tea']
  },
  'p4': {
    playerId: 'p4',
    playerName: 'Kumar',
    sessionsPlayed: 12,
    wins: 2,
    runnerUps: 3,
    teaBought: 2,
    averageScore: 126,
    bestScore: 78,
    worstScore: 198,
    winRatio: 17,
    recentResults: ['podium', 'safe', 'win', 'safe', 'safe']
  },
  'p5': {
    playerId: 'p5',
    playerName: 'Dinesh',
    sessionsPlayed: 11,
    wins: 1,
    runnerUps: 2,
    teaBought: 3,
    averageScore: 134,
    bestScore: 88,
    worstScore: 208,
    winRatio: 9,
    recentResults: ['safe', 'tea', 'safe', 'podium', 'safe']
  }
};

export const INITIAL_COMPLETED_SESSION: GameSession = {
  id: 'session-match-042',
  name: 'Friday Night Brawl',
  gameConfig: PRESET_GAMES['7s'](),
  status: 'completed',
  players: INITIAL_PLAYERS,
  currentRoundNumber: 7,
  startedAt: new Date(Date.now() - 86400000).toISOString(),
  completedAt: new Date(Date.now() - 82800000).toISOString(),
  isFinalized: true,
  tableNote: 'Table #03 • Local Session Encrypted',
  photos: [
    {
      id: 'snap-1',
      sessionId: 'session-match-042',
      sessionName: 'Friday Night Brawl',
      gameName: '7s RUMMY',
      storagePath: 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=400&q=70',
      caption: 'The High-Stakes Showdown',
      subCaption: 'Intense declaration round at 01:14 AM',
      tag: 'ROUND 5 CARD FLIP',
      playerInitials: ['G', 'A', 'S'],
      uploadedAt: new Date(Date.now() - 84000000).toISOString(),
      likes: 12
    },
    {
      id: 'snap-2',
      sessionId: 'session-match-042',
      sessionName: 'Friday Night Brawl',
      gameName: '7s RUMMY',
      storagePath: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATGmJeRhEfqbyE-R1n2Zum84kEwKjMiEMwgRSRvfnRr3qLwwExRKgbtnNk3YHbizlFay2i3z-ok8mJgjAynO8Ms_l1ih_tuKeG-QZoH4P6kfMP2gnZJlOuPqUTDG7M5jD5BGlO6uo4RWebijnG41SzUe94rUKApAPiD4YoQRj6EH9OQ1BybTgtqmsDqgw9Sx62L16kLkgvpUY8rjluSylQNNxYN23TgEJvA3JZtdqW3x5wdFTAoQgx',
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATGmJeRhEfqbyE-R1n2Zum84kEwKjMiEMwgRSRvfnRr3qLwwExRKgbtnNk3YHbizlFay2i3z-ok8mJgjAynO8Ms_l1ih_tuKeG-QZoH4P6kfMP2gnZJlOuPqUTDG7M5jD5BGlO6uo4RWebijnG41SzUe94rUKApAPiD4YoQRj6EH9OQ1BybTgtqmsDqgw9Sx62L16kLkgvpUY8rjluSylQNNxYN23TgEJvA3JZtdqW3x5wdFTAoQgx',
      caption: 'Suresh on Chai Call',
      subCaption: '5 Cutting Chais incoming!',
      tag: 'Tea Duty',
      badge: 'Samosas',
      playerInitials: ['S'],
      uploadedAt: new Date(Date.now() - 83000000).toISOString(),
      likes: 8
    },
    {
      id: 'snap-3',
      sessionId: 'session-match-042',
      sessionName: 'Friday Night Brawl',
      gameName: '7s RUMMY',
      storagePath: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=70',
      caption: 'Table Champion',
      subCaption: '0 bust match clean sweep',
      tag: 'Guru Crowned',
      badge: 'MVP',
      playerInitials: ['G'],
      uploadedAt: new Date(Date.now() - 82800000).toISOString(),
      likes: 15
    }
  ],
  rounds: [
    {
      roundNumber: 1,
      multiplier: 2,
      isCompleted: true,
      scores: {
        'p1': { playerId: 'p1', baseScore: 0, multiplier: 2, finalScore: 0, scoreType: 'dick', entered: true },
        'p2': { playerId: 'p2', baseScore: 12, multiplier: 2, finalScore: 24, scoreType: 'custom', entered: true },
        'p3': { playerId: 'p3', baseScore: 20, multiplier: 2, finalScore: 40, scoreType: 'custom', entered: true },
        'p4': { playerId: 'p4', baseScore: 16, multiplier: 2, finalScore: 32, scoreType: 'custom', entered: true },
        'p5': { playerId: 'p5', baseScore: 9, multiplier: 2, finalScore: 18, scoreType: 'custom', entered: true }
      }
    },
    {
      roundNumber: 2,
      multiplier: 1,
      isCompleted: true,
      scores: {
        'p1': { playerId: 'p1', baseScore: 18, multiplier: 1, finalScore: 18, scoreType: 'custom', entered: true },
        'p2': { playerId: 'p2', baseScore: 0, multiplier: 1, finalScore: 0, scoreType: 'dick', entered: true },
        'p3': { playerId: 'p3', baseScore: 28, multiplier: 1, finalScore: 28, scoreType: 'custom', entered: true },
        'p4': { playerId: 'p4', baseScore: 45, multiplier: 1, finalScore: 45, scoreType: 'custom', entered: true },
        'p5': { playerId: 'p5', baseScore: 22, multiplier: 1, finalScore: 22, scoreType: 'custom', entered: true }
      }
    },
    {
      roundNumber: 3,
      multiplier: 2,
      isCompleted: true,
      scores: {
        'p1': { playerId: 'p1', baseScore: 0, multiplier: 2, finalScore: 0, scoreType: 'dick', entered: true },
        'p2': { playerId: 'p2', baseScore: 18, multiplier: 2, finalScore: 36, scoreType: 'custom', entered: true },
        'p3': { playerId: 'p3', baseScore: 26, multiplier: 2, finalScore: 52, scoreType: 'custom', entered: true },
        'p4': { playerId: 'p4', baseScore: 10, multiplier: 2, finalScore: 20, scoreType: 'custom', entered: true },
        'p5': { playerId: 'p5', baseScore: 22, multiplier: 2, finalScore: 44, scoreType: 'custom', entered: true }
      }
    },
    {
      roundNumber: 4,
      multiplier: 1,
      isCompleted: true,
      scores: {
        'p1': { playerId: 'p1', baseScore: 25, multiplier: 1, finalScore: 25, scoreType: 'custom', entered: true },
        'p2': { playerId: 'p2', baseScore: 15, multiplier: 1, finalScore: 15, scoreType: 'custom', entered: true },
        'p3': { playerId: 'p3', baseScore: 14, multiplier: 1, finalScore: 14, scoreType: 'custom', entered: true },
        'p4': { playerId: 'p4', baseScore: 0, multiplier: 1, finalScore: 0, scoreType: 'dick', entered: true },
        'p5': { playerId: 'p5', baseScore: 31, multiplier: 1, finalScore: 31, scoreType: 'custom', entered: true }
      }
    },
    {
      roundNumber: 5,
      multiplier: 1,
      isCompleted: true,
      scores: {
        'p1': { playerId: 'p1', baseScore: 34, multiplier: 1, finalScore: 34, scoreType: 'custom', entered: true },
        'p2': { playerId: 'p2', baseScore: 28, multiplier: 1, finalScore: 28, scoreType: 'custom', entered: true },
        'p3': { playerId: 'p3', baseScore: 26, multiplier: 1, finalScore: 26, scoreType: 'custom', entered: true },
        'p4': { playerId: 'p4', baseScore: 16, multiplier: 1, finalScore: 16, scoreType: 'custom', entered: true },
        'p5': { playerId: 'p5', baseScore: 0, multiplier: 1, finalScore: 0, scoreType: 'dick', entered: true }
      }
    },
    {
      roundNumber: 6,
      multiplier: 1,
      isCompleted: true,
      scores: {
        'p1': { playerId: 'p1', baseScore: 42, multiplier: 1, finalScore: 42, scoreType: 'custom', entered: true },
        'p2': { playerId: 'p2', baseScore: 0, multiplier: 1, finalScore: 0, scoreType: 'dick', entered: true },
        'p3': { playerId: 'p3', baseScore: 15, multiplier: 1, finalScore: 15, scoreType: 'custom', entered: true },
        'p4': { playerId: 'p4', baseScore: 27, multiplier: 1, finalScore: 27, scoreType: 'custom', entered: true },
        'p5': { playerId: 'p5', baseScore: 39, multiplier: 1, finalScore: 39, scoreType: 'custom', entered: true }
      }
    },
    {
      roundNumber: 7,
      multiplier: 2,
      isCompleted: true,
      scores: {
        'p1': { playerId: 'p1', baseScore: 11.5, multiplier: 2, finalScore: 23, scoreType: 'custom', entered: true },
        'p2': { playerId: 'p2', baseScore: 27.5, multiplier: 2, finalScore: 55, scoreType: 'custom', entered: true },
        'p3': { playerId: 'p3', baseScore: 14, multiplier: 2, finalScore: 28, scoreType: 'custom', entered: true },
        'p4': { playerId: 'p4', baseScore: 19, multiplier: 2, finalScore: 38, scoreType: 'custom', entered: true },
        'p5': { playerId: 'p5', baseScore: 13, multiplier: 2, finalScore: 26, scoreType: 'custom', entered: true }
      }
    }
  ],
  results: [
    {
      sessionId: 'session-match-042',
      playerId: 'p1',
      playerName: 'Guru',
      totalScore: 142,
      finalPosition: 1,
      isWinner: true,
      isRunnerUp: false,
      isTeaDuty: false,
      dickHandsCount: 2,
      bustsCount: 0
    },
    {
      sessionId: 'session-match-042',
      playerId: 'p2',
      playerName: 'Arun',
      totalScore: 158,
      finalPosition: 2,
      isWinner: false,
      isRunnerUp: true,
      isTeaDuty: false,
      dickHandsCount: 2,
      bustsCount: 0
    },
    {
      sessionId: 'session-match-042',
      playerId: 'p4',
      playerName: 'Kumar',
      totalScore: 178,
      finalPosition: 3,
      isWinner: false,
      isRunnerUp: false,
      isTeaDuty: false,
      dickHandsCount: 1,
      bustsCount: 0
    },
    {
      sessionId: 'session-match-042',
      playerId: 'p5',
      playerName: 'Dinesh',
      totalScore: 180,
      finalPosition: 4,
      isWinner: false,
      isRunnerUp: false,
      isTeaDuty: false,
      dickHandsCount: 1,
      bustsCount: 0
    },
    {
      sessionId: 'session-match-042',
      playerId: 'p3',
      playerName: 'Suresh',
      totalScore: 203,
      finalPosition: 5,
      isWinner: false,
      isRunnerUp: false,
      isTeaDuty: true,
      dickHandsCount: 0,
      bustsCount: 1
    }
  ]
};

export const SECOND_COMPLETED_SESSION: GameSession = {
  id: 'session-deepavali-018',
  name: 'Deepavali Special Table',
  gameConfig: PRESET_GAMES['5s'](),
  status: 'completed',
  players: INITIAL_PLAYERS,
  currentRoundNumber: 5,
  startedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  completedAt: new Date(Date.now() - 6 * 86400000 + 3600000).toISOString(),
  isFinalized: true,
  tableNote: 'Living Room Felts • Festive Night',
  photos: [
    {
      id: 'snap-4',
      sessionId: 'session-deepavali-018',
      sessionName: 'Deepavali Special Table',
      gameName: '5s RUMMY',
      storagePath: 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=400&q=70',
      caption: 'Festive Card Clash',
      subCaption: 'Diwali stakes were hot!',
      tag: 'Festive Night Series',
      playerInitials: ['G', 'A'],
      uploadedAt: new Date(Date.now() - 6 * 86400000 + 1000000).toISOString(),
      likes: 9
    },
    {
      id: 'snap-5',
      sessionId: 'session-deepavali-018',
      sessionName: 'Deepavali Special Table',
      gameName: '5s RUMMY',
      storagePath: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=70',
      caption: 'Mithai & Melds',
      subCaption: 'Pure sequences only',
      tag: 'Festive Night Series',
      playerInitials: ['K', 'D'],
      uploadedAt: new Date(Date.now() - 6 * 86400000 + 1500000).toISOString(),
      likes: 14
    },
    {
      id: 'snap-6',
      sessionId: 'session-deepavali-018',
      sessionName: 'Deepavali Special Table',
      gameName: '5s RUMMY',
      storagePath: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=400&q=70',
      caption: 'Warm Chais on the Deck',
      subCaption: '5 Cutting chais delivered',
      tag: 'Festive Night Series',
      playerInitials: ['S'],
      uploadedAt: new Date(Date.now() - 6 * 86400000 + 2000000).toISOString(),
      likes: 11
    }
  ],
  rounds: [],
  results: [
    {
      sessionId: 'session-deepavali-018',
      playerId: 'p2',
      playerName: 'Arun',
      totalScore: 92,
      finalPosition: 1,
      isWinner: true,
      isRunnerUp: false,
      isTeaDuty: false,
      dickHandsCount: 2,
      bustsCount: 0
    },
    {
      sessionId: 'session-deepavali-018',
      playerId: 'p1',
      playerName: 'Guru',
      totalScore: 104,
      finalPosition: 2,
      isWinner: false,
      isRunnerUp: true,
      isTeaDuty: false,
      dickHandsCount: 1,
      bustsCount: 0
    },
    {
      sessionId: 'session-deepavali-018',
      playerId: 'p3',
      playerName: 'Suresh',
      totalScore: 168,
      finalPosition: 5,
      isWinner: false,
      isRunnerUp: false,
      isTeaDuty: true,
      dickHandsCount: 0,
      bustsCount: 1
    }
  ]
};
