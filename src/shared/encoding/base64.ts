/** Native file reads return base64; `atob` (Hermes / Node) decodes it to a binary string. */
export const base64ToBytes = (base64: string) => {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));

  return bytes;
};
