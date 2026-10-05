/** Stable per-person colour slot (0-5) from a member id; worlds map slots to their own palette (--c0..--c5). */
export function personSlot(memberId: string): number {
  let h = 0;
  for (let i = 0; i < memberId.length; i++) h = (h * 31 + memberId.charCodeAt(i)) >>> 0;
  return h % 6;
}
