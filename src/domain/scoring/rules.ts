import { GameConfig, GameVariantType } from '../models/types';

export const STANDARD_FULL_VALUE = 80;

export const PRESET_GAMES: Record<GameVariantType, (customConfig?: Partial<GameConfig>) => GameConfig> = {
  '7s': () => ({
    id: '7s-classic',
    name: "7s RUMMY",
    variant: '7s',
    roundCount: 7,
    multipliers: [2, 1, 1, 1, 1, 1, 2],
    fullPenaltyValue: STANDARD_FULL_VALUE,
    description: "R1 & R7 scores Double! Strategic endurance with high stakes turnover.",
    tagline: "Classic • 7 Rounds"
  }),
  '5s': () => ({
    id: '5s-quickfire',
    name: "5s RUMMY",
    variant: '5s',
    roundCount: 5,
    multipliers: [2, 1, 1, 1, 2],
    fullPenaltyValue: STANDARD_FULL_VALUE,
    description: "Fast-paced living room sprints. R1 & R5 double for rapid tables.",
    tagline: "Quick Fire • 5 Rounds"
  }),
  'ace': () => ({
    id: 'ace-classic',
    name: "ACE",
    variant: 'ace',
    roundCount: 5,
    multipliers: [1, 1, 1, 1, 1],
    fullPenaltyValue: 40,
    description: "1st: 0 pts, 2nd: 10 pts, 3rd: 20 pts... Drop your deadwood fast.",
    tagline: "Card Shedding"
  }),
  'custom': (customConfig?: Partial<GameConfig>) => {
    const rounds = customConfig?.roundCount || 6;
    const defaultMult = 1;
    const firstMult = customConfig?.multipliers?.[0] ?? 2;
    const lastMult = customConfig?.multipliers?.[rounds - 1] ?? 2;
    
    // Generate multipliers if not explicitly given
    const multipliers = customConfig?.multipliers || Array.from({ length: rounds }, (_, i) => {
      if (i === 0) return firstMult;
      if (i === rounds - 1) return lastMult;
      return defaultMult;
    });

    return {
      id: customConfig?.id || `custom-${Date.now()}`,
      name: customConfig?.name || "CUSTOM RUMMY",
      variant: 'custom',
      roundCount: rounds,
      multipliers,
      fullPenaltyValue: customConfig?.fullPenaltyValue ?? STANDARD_FULL_VALUE,
      description: customConfig?.description || "House rules custom configured for your card table.",
      tagline: `${rounds} Rounds • Custom House Rules`
    };
  }
};
