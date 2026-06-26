export const brandColors = {
  black: "#000000",
  white: "#ffffff",
  primary: "#00bc6d",
  primaryLight: "#9fe5b1",
  surfaceDark: "#050505",
  surface: "#131415",
  surfaceElevated: "#222426",
  muted: "#9ba1a5",
  background: "#f5efec",
  link: "#0099ff",
  transparent: "transparent",
  overlayLight: "#0000004d",
  overlayStrong: "#000000b3",
} as const;

export type BrandColor = (typeof brandColors)[keyof typeof brandColors];

export const fontFamily =
  '"Thmanyah Serif Display", "Times New Roman", serif';
