"use client";

// This is a pseudo-worker implementation or a utility to be used in a worker
// For simplicity in this environment, I'll implement it as a utility first.

export function decodeElevation(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

export function processSlopeTile(data: Uint8ClampedArray, width: number, height: number, lat: number, zoom: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const res = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Finite difference for slope
      let dzdx = 0;
      let dzdy = 0;
      
      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        const getElev = (ox: number, oy: number) => {
          const i = ((y + oy) * width + (x + ox)) * 4;
          return decodeElevation(data[i], data[i+1], data[i+2]);
        };
        
        dzdx = (getElev(1, 0) - getElev(-1, 0)) / (2 * res);
        dzdy = (getElev(0, 1) - getElev(0, -1)) / (2 * res);
      }
      
      const slope = Math.sqrt(dzdx*dzdx + dzdy*dzdy);
      const slopeDeg = Math.atan(slope) * 180 / Math.PI;
      
      // Palette from YAML §8.2
      let r = 0, g = 0, b = 0, a = 153; // 60% opacity (153/255)
      
      if (slopeDeg < 3) { r = 0; g = 255; b = 65; a = 51; } // Flat - Green 20%
      else if (slopeDeg < 10) { r = 0; g = 255; b = 65; a = 25; } // Gentle - Green 10%
      else if (slopeDeg < 20) { r = 255; g = 204; b = 0; a = 38; } // Moderate - Yellow 15%
      else if (slopeDeg < 30) { r = 255; g = 136; b = 0; a = 51; } // Steep - Amber 20%
      else if (slopeDeg < 45) { r = 255; g = 45; b = 45; a = 51; } // Severe - Red 20%
      else { r = 255; g = 45; b = 45; a = 89; } // Cliff - Red 35%
      
      output[idx] = r;
      output[idx+1] = g;
      output[idx+2] = b;
      output[idx+3] = a;
    }
  }
  return output;
}

export function processHypsoTile(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const elev = decodeElevation(data[idx], data[idx+1], data[idx+2]);
      
      let r = 0, g = 0, b = 0;
      const a = 102; // 40% opacity
      
      // Tactical Hypso Palette from YAML §8.2
      if (elev < 0) { r = 10; g = 22; b = 40; } // Sub-sea
      else if (elev < 10) { r = 18; g = 32; b = 26; } // Littoral
      else if (elev < 50) { r = 26; g = 46; b = 28; } // Low coastal
      else if (elev < 100) { r = 42; g = 52; b = 34; } // Lowland
      else if (elev < 250) { r = 58; g = 58; b = 34; } // Upland
      else if (elev < 500) { r = 74; g = 58; b = 26; } // Highland
      else if (elev < 1000) { r = 74; g = 42; b = 26; } // Montane
      else if (elev < 2000) { r = 58; g = 26; b = 26; } // Alpine
      else { r = 42; g = 18; b = 21; } // High alpine
      
      output[idx] = r;
      output[idx+1] = g;
      output[idx+2] = b;
      output[idx+3] = a;
    }
  }
  return output;
}
