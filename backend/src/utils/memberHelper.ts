/**
 * Member discount and points calculation helper
 */

export interface MemberLevelConfig {
  discountPercent: number;
  maxDiscount: number; // Maximum discount amount in VND
  pointsPer10k: number; // Points earned per 10,000 VND
  upgradeThreshold?: number; // Points needed to upgrade to next level
}

export const MEMBER_LEVELS: Record<string, MemberLevelConfig> = {
  bronze: {
    discountPercent: 2,
    maxDiscount: 20000,
    pointsPer10k: 5, // 5 point per 10,000 VND
    upgradeThreshold: 500, // Upgrade to Silver at 500 points
  },
  silver: {
    discountPercent: 5,
    maxDiscount: 50000,
    pointsPer10k: 10, // 10 points per 10,000 VND
    upgradeThreshold: 1000, // Upgrade to Gold at 1000 points
  },
  gold: {
    discountPercent: 8,
    maxDiscount: 100000,
    pointsPer10k: 15, // 15 points per 10,000 VND
    upgradeThreshold: 2000, // Upgrade to Platinum at 2000 points
  },
  platinum: {
    discountPercent: 12,
    maxDiscount: 200000,
    pointsPer10k: 20, // 20 points per 10,000 VND
    // No upgrade threshold - highest level
  },
};

/**
 * Calculate discount amount based on member level and order total
 */
export function calculateMemberDiscount(
  level: string,
  orderTotal: number
): number {
  const config = MEMBER_LEVELS[level];
  if (!config) {
    return 0;
  }

  const discount = (orderTotal * config.discountPercent) / 100;
  return Math.min(discount, config.maxDiscount);
}

/**
 * Calculate points to be awarded based on member level and final amount
 */
export function calculatePointsToAdd(
  level: string,
  finalAmount: number
): number {
  const config = MEMBER_LEVELS[level];
  if (!config) {
    return 0;
  }

  // Calculate points: (finalAmount / 10000) * pointsPer10k
  const points = Math.floor((finalAmount / 10000) * config.pointsPer10k);
  return points;
}

/**
 * Determine if member should be upgraded based on total points
 */
export function getUpgradeLevel(points: number): string | null {
  if (points >= 2000) {
    return "platinum";
  } else if (points >= 1000) {
    return "gold";
  } else if (points >= 500) {
    return "silver";
  }
  return null;
}
