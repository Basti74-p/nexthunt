/**
 * Utility: compute area in hectares from a GeoJSON boundary string using turf.js
 * Falls back to 0 if parsing fails.
 */

let turfArea = null;

async function getTurfArea() {
  if (turfArea) return turfArea;
  const turf = await import('https://esm.sh/@turf/turf@6.5.0');
  turfArea = turf.area;
  return turfArea;
}

/**
 * Calculate area in hectares from a boundary_geojson string.
 * @param {string} boundaryGeojson - JSON string of a GeoJSON Polygon or FeatureCollection
 * @returns {Promise<number>} area in hectares, or 0 on failure
 */
export async function calcFlaecheHa(boundaryGeojson) {
  if (!boundaryGeojson) return 0;
  try {
    const area = await getTurfArea();
    const gj = JSON.parse(boundaryGeojson);
    let feature;
    if (gj.type === 'FeatureCollection') {
      feature = gj.features?.[0];
    } else if (gj.type === 'Polygon') {
      feature = { type: 'Feature', geometry: gj };
    } else {
      feature = gj;
    }
    if (!feature) return 0;
    const sqm = area(feature);
    return Math.round((sqm / 10000) * 100) / 100; // hectares, 2 decimals
  } catch {
    return 0;
  }
}