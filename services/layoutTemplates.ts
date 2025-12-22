
import { GridStyle } from "../types";

// Helper to create simple grid areas string
const areas = (rows: string[]) => rows.map(r => `"${r}"`).join(' ');

/**
 * A library of professional photo layouts.
 * Keys are the number of photos (1-9).
 */
export const LAYOUT_TEMPLATES: Record<number, GridStyle[]> = {
  1: [
    { // Full Bleed
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
      gridTemplateAreas: '"img0"',
    },
    { // Centered with padding (simulated by generic logic usually, but here as specific layout)
      gridTemplateColumns: '1fr 4fr 1fr',
      gridTemplateRows: '1fr 4fr 1fr',
      gridTemplateAreas: '". . ." ". img0 ." ". . ."',
    }
  ],
  2: [
    { // Horizontal Split
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr 1fr',
      gridTemplateAreas: areas(['img0', 'img1']),
    },
    { // Vertical Split
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr',
      gridTemplateAreas: areas(['img0 img1']),
    },
    { // Diagonal / Offset (Creative)
      gridTemplateColumns: '2fr 1fr',
      gridTemplateRows: '1fr 2fr',
      gridTemplateAreas: areas(['img0 img1', 'img0 .']),
      isAiGenerated: false
    },
    { // Big Top, Small Bottom
      gridTemplateColumns: '1.618fr 1fr', // Golden ratio
      gridTemplateRows: '1fr',
      gridTemplateAreas: areas(['img0 img1']),
    },
  ],
  3: [
    { // 1 Top, 2 Bottom
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1.5fr 1fr',
      gridTemplateAreas: areas(['img0 img0', 'img1 img2']),
    },
    { // 1 Left, 2 Right
      gridTemplateColumns: '1.5fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gridTemplateAreas: areas(['img0 img1', 'img0 img2']),
    },
    { // 3 Vertical Columns
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '1fr',
      gridTemplateAreas: areas(['img0 img1 img2']),
    },
    { // Bento Box Style
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gridTemplateAreas: areas(['img0 img1', 'img2 img1']),
    },
    // --- TEMPLATE: 3 Vertical Parallelograms (Columns) ---
    {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
      gridTemplateAreas: '"img0"',
      customWrapperStyle: {
        0: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0 0, 40% 0, 25% 100%, 0% 100%)', zIndex: 1 },
        1: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(40.5% 0, 80% 0, 65% 100%, 25.5% 100%)', zIndex: 2 },
        2: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(80.5% 0, 100% 0, 100% 100%, 65.5% 100%)', zIndex: 3 }
      },
      shapeBounds: {
        0: { xPercent: 0, yPercent: 0, wPercent: 40, hPercent: 100 },
        1: { xPercent: 25.5, yPercent: 0, wPercent: 54.5, hPercent: 100 },
        2: { xPercent: 65.5, yPercent: 0, wPercent: 34.5, hPercent: 100 }
      },
      allowUnsafePan: true
    },
    // --- TEMPLATE: 3 Horizontal Parallelograms (Rows) ---
    {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
      gridTemplateAreas: '"img0"',
      customWrapperStyle: {
        0: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0 0, 100% 0, 80% 33%, 0 33%)', zIndex: 3 },
        1: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0 33.5%, 80% 33.5%, 100% 66%, 20% 66%)', zIndex: 2 },
        2: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(20% 66.5%, 100% 66.5%, 100% 100%, 0 100%)', zIndex: 1 }
      },
      shapeBounds: {
        0: { xPercent: 0, yPercent: 0, wPercent: 100, hPercent: 33 },
        1: { xPercent: 0, yPercent: 33.5, wPercent: 100, hPercent: 32.5 },
        2: { xPercent: 0, yPercent: 66.5, wPercent: 100, hPercent: 33.5 }
      },
      allowUnsafePan: true
    }
  ],
  4: [
    { // Classic 2x2
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gridTemplateAreas: areas(['img0 img1', 'img2 img3']),
    },
    { // 1 Big Left, 3 Right Stack
      gridTemplateColumns: '2fr 1fr',
      gridTemplateRows: '1fr 1fr 1fr',
      gridTemplateAreas: areas(['img0 img1', 'img0 img2', 'img0 img3']),
    },
    { // 1 Top Big, 3 Bottom
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '2fr 1fr',
      gridTemplateAreas: areas(['img0 img0 img0', 'img1 img2 img3']),
    },
    { // Center Hero
      gridTemplateColumns: '1fr 2fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gridTemplateAreas: areas(['img0 img1 img2', 'img0 img1 img3']),
    },
    { // Mosaic
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '2fr 1fr 1fr',
      gridTemplateAreas: areas(['img0 img1', 'img0 img2', 'img3 img2']),
    },
    // --- TEMPLATE: 4-Photo Geometric Mosaic (Solid Parallelograms) - ORIGINAL 0 DEG ---
    {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
      gridTemplateAreas: '"img0"',
      customWrapperStyle: {
        // img0: Left Trapezoid
        0: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0% 0%, 28% 0%, 18% 100%, 0% 100%)', zIndex: 1 },
        // img1: Center Left Parallelogram
        1: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(28.3% 0%, 53% 0%, 43% 100%, 18.3% 100%)', zIndex: 2 },
        // img2: Center Right Parallelogram
        2: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(53.3% 0%, 78% 0%, 68% 100%, 43.3% 100%)', zIndex: 2 },
        // img3: Right Trapezoid
        3: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(78.3% 0%, 100% 0%, 100% 100%, 68.3% 100%)', zIndex: 1 }
      },
      shapeBounds: {
        0: { xPercent: 0, yPercent: 0, wPercent: 28, hPercent: 100 },
        1: { xPercent: 18.3, yPercent: 0, wPercent: 34.7, hPercent: 100 },
        2: { xPercent: 43.3, yPercent: 0, wPercent: 34.7, hPercent: 100 },
        3: { xPercent: 68.3, yPercent: 0, wPercent: 31.7, hPercent: 100 }
      },
      allowUnsafePan: true
    },
    // --- TEMPLATE: 4-Photo Geometric Mosaic - ROTATED 90 DEG (Horizontal Strips /) ---
    {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
      gridTemplateAreas: '"img0"',
      customWrapperStyle: {
        0: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0% 0%, 100% 0%, 100% 18%, 0% 28%)', zIndex: 1 },
        1: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0% 28.3%, 100% 18.3%, 100% 43%, 0% 53%)', zIndex: 2 },
        2: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0% 53.3%, 100% 43.3%, 100% 68%, 0% 78%)', zIndex: 2 },
        3: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0% 78.3%, 100% 68.3%, 100% 100%, 0% 100%)', zIndex: 1 }
      },
      shapeBounds: {
        0: { xPercent: 0, yPercent: 0, wPercent: 100, hPercent: 28 },
        1: { xPercent: 0, yPercent: 18.3, wPercent: 100, hPercent: 34.7 },
        2: { xPercent: 0, yPercent: 43.3, wPercent: 100, hPercent: 34.7 },
        3: { xPercent: 0, yPercent: 68.3, wPercent: 100, hPercent: 31.7 }
      },
      allowUnsafePan: true
    },
    // --- TEMPLATE: 4-Photo Geometric Mosaic - ROTATED 180 DEG (Vertical Strips \) ---
    {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
      gridTemplateAreas: '"img0"',
      customWrapperStyle: {
        0: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0% 0%, 18% 0%, 28% 100%, 0% 100%)', zIndex: 1 },
        1: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(18.3% 0%, 43% 0%, 53% 100%, 28.3% 100%)', zIndex: 2 },
        2: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(43.3% 0%, 68% 0%, 78% 100%, 53.3% 100%)', zIndex: 2 },
        3: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(68.3% 0%, 100% 0%, 100% 100%, 78.3% 100%)', zIndex: 1 }
      },
      shapeBounds: {
        0: { xPercent: 0, yPercent: 0, wPercent: 28, hPercent: 100 },
        1: { xPercent: 18.3, yPercent: 0, wPercent: 34.7, hPercent: 100 },
        2: { xPercent: 43.3, yPercent: 0, wPercent: 34.7, hPercent: 100 },
        3: { xPercent: 68.3, yPercent: 0, wPercent: 31.7, hPercent: 100 }
      },
      allowUnsafePan: true
    },
    // --- TEMPLATE: 4-Photo Geometric Mosaic - ROTATED 270 DEG (Horizontal Strips \) ---
    {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
      gridTemplateAreas: '"img0"',
      customWrapperStyle: {
        0: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0% 0%, 100% 0%, 100% 28%, 0% 18%)', zIndex: 1 },
        1: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0% 18.3%, 100% 28.3%, 100% 53%, 0% 43%)', zIndex: 2 },
        2: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0% 43.3%, 100% 53.3%, 100% 78%, 0% 68%)', zIndex: 2 },
        3: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0% 68.3%, 100% 78.3%, 100% 100%, 0% 100%)', zIndex: 1 }
      },
      shapeBounds: {
        0: { xPercent: 0, yPercent: 0, wPercent: 100, hPercent: 28 },
        1: { xPercent: 0, yPercent: 18.3, wPercent: 100, hPercent: 34.7 },
        2: { xPercent: 0, yPercent: 43.3, wPercent: 100, hPercent: 34.7 },
        3: { xPercent: 0, yPercent: 68.3, wPercent: 100, hPercent: 31.7 }
      },
      allowUnsafePan: true
    }
  ],
  5: [
    { // 1 Big, 4 Small Grid
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gridTemplateRows: '2fr 1fr',
      gridTemplateAreas: areas(['img0 img0 img1 img2', 'img0 img0 img3 img4']),
    },
    { // 2 Top, 3 Bottom
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gridTemplateAreas: areas(['img0 img0 img1', 'img2 img3 img4']),
    },
    { // Masonry-ish
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr 1fr',
      gridTemplateAreas: areas(['img0 img1', 'img0 img2', 'img3 img4']),
    },
    // --- TEMPLATE: 4 Rectangles + Center Circle Overlay ---
    {
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gridTemplateAreas: '"img0 img1" "img2 img3"',
      // img4 is absolutely positioned over the others
      customWrapperStyle: {
        4: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '50%',
          height: 'auto',
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          zIndex: 10,
          border: '4px solid white',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }
      },
    },
    // --- TEMPLATE: 5-Photo Geometric Mosaic ---
    {
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
      gridTemplateAreas: '"img0"',
      customWrapperStyle: {
        // img0: Left Solid Trapezoid
        0: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(0% 0%, 28% 0%, 18% 100%, 0% 100%)', zIndex: 1 },
        // img1: Center Left Solid Parallelogram
        1: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(28.3% 0%, 53% 0%, 43% 100%, 18.3% 100%)', zIndex: 2 },
        // img2: Center Right Solid Parallelogram
        2: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(53.3% 0%, 78% 0%, 68% 100%, 43.3% 100%)', zIndex: 2 },
        // img3: Right Top Trapezoid (Split 1)
        3: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(78.3% 0%, 100% 0%, 100% 49.8%, 73.3% 49.8%)', zIndex: 1 },
        // img4: Right Bottom Trapezoid (Split 2)
        4: { gridArea: '1 / 1 / -1 / -1', clipPath: 'polygon(73.3% 50.2%, 100% 50.2%, 100% 100%, 68.3% 100%)', zIndex: 1 }
      },
      shapeBounds: {
        0: { xPercent: 0, yPercent: 0, wPercent: 28, hPercent: 100 },
        1: { xPercent: 18.3, yPercent: 0, wPercent: 34.7, hPercent: 100 },
        2: { xPercent: 43.3, yPercent: 0, wPercent: 34.7, hPercent: 100 },
        3: { xPercent: 73.3, yPercent: 0, wPercent: 26.7, hPercent: 49.8 },
        4: { xPercent: 68.3, yPercent: 50.2, wPercent: 31.7, hPercent: 49.8 }
      },
      allowUnsafePan: true
    },
    // --- TEMPLATE: Scrapbook Collage Style (Rustic Frames) - CENTERED ---
    {
      // 24x24 Grid for centered precision
      gridTemplateColumns: 'repeat(24, 1fr)',
      gridTemplateRows: 'repeat(24, 1fr)',
      gridTemplateAreas: '"."',
      customWrapperStyle: {
        // Top Left: Rope Frame (Dashed) - Landscape orientation
        0: {
          gridArea: '4 / 4 / 11 / 12',
          zIndex: 2,
          transform: 'rotate(-4deg)',
          border: '4px dashed #d4a373',
          boxShadow: '3px 5px 10px rgba(0,0,0,0.2)',
          backgroundColor: '#fff',
        },
        // Top Right: Wood Slice (Circle) - Square
        1: {
          gridArea: '4 / 15 / 11 / 22',
          zIndex: 2,
          borderRadius: '50%',
          border: '6px solid #8d6e63',
          boxShadow: '3px 5px 10px rgba(0,0,0,0.2)',
          backgroundColor: '#fff',
        },
        // Center: Main Image - Square-ish, Centered in the middle 
        2: {
          gridArea: '7 / 7 / 19 / 19',
          zIndex: 1,
          border: '8px solid white',
          boxShadow: '0 4px 25px rgba(0,0,0,0.15)',
        },
        // Bottom Left: Polaroid Style - Portrait
        3: {
          gridArea: '14 / 4 / 22 / 11',
          zIndex: 3,
          transform: 'rotate(-3deg)',
          backgroundColor: 'white',
          borderTop: '10px solid white',
          borderLeft: '10px solid white',
          borderRight: '10px solid white',
          borderBottom: '45px solid white',
          boxShadow: '4px 6px 15px rgba(0,0,0,0.25)',
        },
        // Bottom Right: Wood Frame - Landscape
        4: {
          gridArea: '15 / 14 / 21 / 22',
          zIndex: 2,
          transform: 'rotate(2deg)',
          border: '10px ridge #5d4037',
          boxShadow: '4px 6px 12px rgba(0,0,0,0.3)',
        }
      },
      allowUnsafePan: true
    }
  ],
  6: [
    { // Classic 2x3
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr 1fr',
      gridTemplateAreas: areas(['img0 img1', 'img2 img3', 'img4 img5']),
    },
    { // Classic 3x2
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gridTemplateAreas: areas(['img0 img1 img2', 'img3 img4 img5']),
    },
    { // Center Focus
      gridTemplateColumns: '1fr 2fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gridTemplateAreas: areas(['img0 img1 img2', 'img3 img1 img4', 'img5 img5 img5']),
    },
    { // 1 Big, 5 Surround
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '2fr 1fr',
      gridTemplateAreas: areas(['img0 img0 img1', 'img2 img3 img4', 'img5 img5 img5']),
    }
  ]
};

// Fallback generator for N photos if no template exists
export const getFallbackLayout = (count: number): GridStyle => {
  const cols = Math.ceil(Math.sqrt(count));
  // Create a basic sequential grid area string
  let imgIndex = 0;

  // Calculate exact rows needed
  const rows = Math.ceil(count / cols);

  const gridRows = [];

  for (let r = 0; r < rows; r++) {
    let rowStr = '"';
    for (let c = 0; c < cols; c++) {
      if (imgIndex < count) {
        rowStr += `img${imgIndex} `;
        imgIndex++;
      } else {
        // If we run out of photos but have grid cells left, stretch the LAST photo
        rowStr += `img${count - 1} `;
      }
    }
    rowStr = rowStr.trim() + '"';
    gridRows.push(rowStr);
  }

  return {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gridTemplateAreas: gridRows.join(' '),
    isAiGenerated: false
  };
};

export const getLayoutsForCount = (count: number): GridStyle[] => {
  const specific = LAYOUT_TEMPLATES[count] || [];
  return [...specific, getFallbackLayout(count)];
};
