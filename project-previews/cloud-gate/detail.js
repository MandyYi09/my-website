// Only the offline gallery bake opts into thumbnail tessellation.
export const cardDetail = new URLSearchParams(location.search).get('detail') === 'card';
export const segments = (count, minimum = 4) => cardDetail ? Math.max(minimum, Math.round(count * .35)) : count;
