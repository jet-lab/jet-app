export function shortenPubkey(pubkey: string, halfLength = 4): string {
  return `${pubkey.substring(0, halfLength)}...${pubkey.substring(pubkey.length - halfLength)}`;
}