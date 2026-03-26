export function formatDMS(decimal: number, isLat: boolean, secondsDigits = 1) {
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutes = Math.floor((abs - degrees) * 60);
  const seconds = (
    (abs - degrees - minutes / 60) *
    3600
  ).toFixed(secondsDigits);
  const direction = isLat
    ? decimal >= 0
      ? "N"
      : "S"
    : decimal >= 0
      ? "E"
      : "W";

  return `${degrees}°${minutes}'${seconds}"${direction}`;
}
