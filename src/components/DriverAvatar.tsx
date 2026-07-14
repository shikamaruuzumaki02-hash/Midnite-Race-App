"use client";

type DriverAvatarProps = {
  gamertag: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

const SIZE_CLASSES: Record<string, string> = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-16 h-16 text-base",
  xl: "w-20 h-20 text-lg",
};

const PALETTE = [
  "#ff5a1f", // ember
  "#3ddc97", // checkpoint
  "#4f8cff",
  "#c44fff",
  "#ffb84f",
  "#ff4d6a",
  "#4fd9ff",
];

function colorFromName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

function initialsFromGamertag(gamertag: string) {
  const cleaned = gamertag.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export default function DriverAvatar({ gamertag, avatarUrl, size = "md" }: DriverAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={gamertag}
        crossOrigin="anonymous"
        className={`${sizeClass} rounded-md object-cover border border-asphalt-border flex-shrink-0`}
      />
    );
  }

  const bgColor = colorFromName(gamertag);

  return (
    <div
      className={`${sizeClass} rounded-md flex items-center justify-center font-display font-medium flex-shrink-0 border border-asphalt-border`}
      style={{ backgroundColor: `${bgColor}26`, color: bgColor }}
    >
      {initialsFromGamertag(gamertag)}
    </div>
  );
}
