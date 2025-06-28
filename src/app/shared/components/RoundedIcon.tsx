interface RoundedIconProps {
  icon: React.ReactNode;
  iconSize?: number;
  foregroundHexColor: string;
  backgroundHexColor: string;
}

export function RoundedIcon({
  icon,
  iconSize = 24,
  foregroundHexColor,
  backgroundHexColor,
}: RoundedIconProps) {
  return (
    <div
      className={`flex items-center justify-center w-16 h-16 rounded-full bg-[${backgroundHexColor}] text-[${foregroundHexColor}]`}
    >
      <span className={`w-${iconSize} h-${iconSize}`}>{icon}</span>
    </div>
  );
}
