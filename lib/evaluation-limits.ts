export const PLAN_DAILY_LIMITS: Record<string, number> = {
  free: Number(process.env.NEXT_PUBLIC_FREE_DAILY_EVALS) || 1,
  pro: Number(process.env.NEXT_PUBLIC_PRO_DAILY_EVALS) || 20,
  max: Number(process.env.NEXT_PUBLIC_MAX_DAILY_EVALS) || 99,
};

export function getPlanLimit(plan: string): number {
  return PLAN_DAILY_LIMITS[plan] ?? 1;
}
