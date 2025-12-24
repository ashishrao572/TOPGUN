export interface Quarter {
  quarter: string;
  financialYear: number;
}

export function getCurrentIndianQuarter(): Quarter;
export function getPreviousIndianQuarter(steps?: number): Quarter;

declare const _default: {
  getCurrentIndianQuarter: typeof getCurrentIndianQuarter;
  getPreviousIndianQuarter: typeof getPreviousIndianQuarter;
};

export default _default;
