import { BANDS, UNKNOWN } from '@/lib/aqi-bands.g'

// US EPA AQI bands, colored with IQAir AirVisual's palette: each band is a
// pastel background (`bg`) paired with a darker same-hue text tone (`fg`),
// rendered as a filled tile like the AirVisual app. The band label must always
// be rendered with the color so meaning never rides on color alone.

// aqiInfo returns { label, bg, fg } for an AQI value.
export function aqiInfo(aqi) {
  if (aqi == null || Number.isNaN(aqi)) {
    return UNKNOWN
  }
  return BANDS.find((band) => aqi <= band.max)
}
