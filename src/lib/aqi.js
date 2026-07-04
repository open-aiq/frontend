// US EPA AQI bands, colored with IQAir AirVisual's palette: each band is a
// pastel background (`bg`) paired with a darker same-hue text tone (`fg`),
// rendered as a filled tile like the AirVisual app. The band label must always
// be rendered with the color so meaning never rides on color alone.
const BANDS = [
  { max: 50, label: 'Good', bg: '#A8E05F', fg: '#718B3A' },
  { max: 100, label: 'Moderate', bg: '#FDD64B', fg: '#A57F23' },
  { max: 150, label: 'Unhealthy for Sensitive Groups', bg: '#FF9B57', fg: '#B25826' },
  { max: 200, label: 'Unhealthy', bg: '#FE6A69', fg: '#AF2C3B' },
  { max: 300, label: 'Very Unhealthy', bg: '#A97ABC', fg: '#634675' },
  { max: Infinity, label: 'Hazardous', bg: '#A87383', fg: '#683E51' },
]

// aqiInfo returns { label, bg, fg } for an AQI value.
export function aqiInfo(aqi) {
  if (aqi == null || Number.isNaN(aqi)) {
    return { label: 'Unknown', bg: '#E5E5E5', fg: '#525252' }
  }
  return BANDS.find((band) => aqi <= band.max)
}
