// ==== INFO POPUP LOGIC ====
document.addEventListener("DOMContentLoaded", function () {
  // Prikaži popup kad se stranica učita
  const infoPopup = document.getElementById('infoPopup');
  infoPopup.classList.add('active');

  // Zatvori popup na klik
  const closeBtn = document.getElementById('closeInfoPopup');
  closeBtn.onclick = function () {
    infoPopup.classList.remove('active');
  };
});

// ==== GET TODAY'S WORD FROM BACKEND ====
function loadTodaysWord() {
  fetch('/api/todays-word')
    .then(res => res.json())
    .then(data => {
      document.getElementById('word').textContent = data.word || '...';
    });
}
loadTodaysWord();

// ==== PALETTE COLORS ====
const MAIN_COLORS = [
  { name: "Black",     color: "#000000" },
  { name: "White",     color: "#FFFFFF" },
  { name: "Gray",      color: "#888888" },
  { name: "Red",       color: "#E53935" },
  { name: "Pink",      color: "#E040FB" },
  { name: "Orange",    color: "#FF9800" },
  { name: "Yellow",    color: "#FFEB3B" },
  { name: "Green",     color: "#43A047" },
  { name: "Blue",      color: "#1E88E5" },
  { name: "Light Blue",color: "#80D8FF" },
  { name: "Purple",    color: "#8E24AA" },
  { name: "Brown",     color: "#8D6E63" }
];
const SPECIAL_COLORS = [
  { name: "Turquoise", color: "#00BFAE" },
  { name: "Gold",      color: "#FFD700" },
  { name: "Silver",    color: "#C0C0C0" },
  { name: "Bronze",    color: "#CD7F32" },
  { name: "Dark Green",color: "#00695C" },
  { name: "Dark Blue", color: "#0D47A1" },
  { name: "Magenta",   color: "#C71585" },
  { name: "Lime",      color: "#B9FF0A" },
  { name: "Beige",     color: "#F5F5DC" }
];

let currentColor = MAIN_COLORS[0].color;
let lastColor = currentColor;
let eraserMode = false;
let fillMode = false;

// Build palette
function buildPalette(rowElem, colorList, isSpecial=false) {
  colorList.forEach((col, idx) => {
    const swatch = document.createElement('button');
    swatch.className = 'swatch';
    swatch.style.background = col.color;
    swatch.title = col.name;
    swatch.dataset.color = col.color;
    if(idx === 0 && !isSpecial) swatch.classList.add('active');
    swatch.onclick = () => {
      setActiveSwatch(swatch);
      currentColor = col.color;
      lastColor = col.color;
      eraserMode = false;
      fillMode = false;
      document.getElementById('eraser').classList.remove('active');
      document.getElementById('fill').classList.remove('active');
      updateSelectedColorSwatch();
    };
    rowElem.appendChild(swatch);
  });
}
buildPalette(document.getElementById('palette-main'), MAIN_COLORS, false);
buildPalette(document.getElementById('palette-special'), SPECIAL_COLORS, true);

const customColorInput = document.getElementById('customColor');
customColorInput.value = "#FF1493";
customColorInput.oninput = (e) => {
  currentColor = e.target.value;
  lastColor = currentColor;
  setActiveSwatch(null);
  eraserMode = false;
  fillMode = false;
  document.getElementById('eraser').classList.remove('active');
  document.getElementById('fill').classList.remove('active');
  document.querySelector('.custom-color-btn').style.background = currentColor;
  updateSelectedColorSwatch();
};
function setActiveSwatch(activeBtn) {
  document.querySelectorAll('.swatch').forEach(btn => btn.classList.remove('active'));
  if (activeBtn) activeBtn.classList.add('active');
  document.querySelector('.custom-color-btn').style.background = customColorInput.value;
}

// ==== BACKGROUND PALETTE ====
let bgColor = "#FFFFFF";
let customBg = "#FFFAF0";
let gridOn = false;
let bgType = "color";
function buildBgPalette(rowElem, colorList, isSpecial=false) {
  colorList.forEach((col, idx) => {
    const swatch = document.createElement('button');
    swatch.className = 'bg-swatch';
    swatch.style.background = col.color;
    swatch.title = col.name;
    swatch.dataset.color = col.color;
    if(idx === 1 && !isSpecial) swatch.classList.add('active');
    swatch.onclick = () => {
      setActiveBgSwatch(swatch);
      bgType = "color";
      bgColor = col.color;
      drawBgCanvas();
      updateSelectedBgSwatch();
    };
    rowElem.appendChild(swatch);
  });
}
buildBgPalette(document.getElementById('bg-palette-main'), MAIN_COLORS, false);
buildBgPalette(document.getElementById('bg-palette-special'), SPECIAL_COLORS, true);

const customBgInput = document.getElementById('customBgColor');
customBgInput.value = "#FFFAF0";
customBgInput.oninput = (e) => {
  bgType = "custom";
  customBg = e.target.value;
  setActiveBgSwatch(null);
  document.querySelector('.custom-bg-btn').style.background = customBg;
  drawBgCanvas();
  updateSelectedBgSwatch();
};
function setActiveBgSwatch(activeBtn) {
  document.querySelectorAll('.bg-swatch').forEach(btn => btn.classList.remove('active'));
  if (activeBtn) activeBtn.classList.add('active');
  document.querySelector('.custom-bg-btn').style.background = customBgInput.value;
}
const gridCheckbox = document.getElementById('gridCheckbox');
gridCheckbox.onchange = function() {
  gridOn = this.checked;
  drawBgCanvas();
};

// ==== CANVAS SETUP ====
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
bgCanvas.width = 1200;
bgCanvas.height = 900;

const drawCanvas = document.getElementById('draw-canvas');
const ctx = drawCanvas.getContext('2d');
drawCanvas.width = 1200;
drawCanvas.height = 900;
ctx.lineCap = 'round';

function drawBgCanvas() {
  const isDark = document.body.classList.contains('dark');
  bgCtx.save();
  bgCtx.globalAlpha = 1;
  bgCtx.fillStyle = (bgType === "color") ? bgColor : (bgType === "custom" ? customBg : "#fff");
  bgCtx.fillRect(0,0,bgCanvas.width,bgCanvas.height);
  if(gridOn){
    bgCtx.strokeStyle = isDark ? "#333" : "#e0e0e0";
    bgCtx.lineWidth = 1;
    for(let x=0; x<bgCanvas.width; x+=40){
      bgCtx.beginPath();bgCtx.moveTo(x,0);bgCtx.lineTo(x,bgCanvas.height);bgCtx.stroke();
    }
    for(let y=0; y<bgCanvas.height; y+=40){
      bgCtx.beginPath();bgCtx.moveTo(0,y);bgCtx.lineTo(bgCanvas.width,y);bgCtx.stroke();
    }
  }
  bgCtx.restore();
}

// ==== BRUSH TYPES ====
const BRUSH_TYPES = [
  { id: "basic", label: "Četka" },
  { id: "calligraphy", label: "Četkica za kaligrafiju" },
  { id: "calligraphy-pen", label: "Olovka za kaligrafiju" },
  { id: "airbrush", label: "Airbrush" },
  { id: "oil", label: "Četkica za ulje" },
  { id: "crayon", label: "Masna bojica" },
  { id: "marker", label: "Marker" },
  { id: "pencil", label: "Obična olovka" },
  { id: "watercolor", label: "Četka za vodene boje" },
];
let currentBrushType = "basic";

// ==== BRUSH PICKER UI ====
function buildBrushPicker() {
  const brushPickerWrap = document.createElement("div");
  brushPickerWrap.className = "brush-picker-wrap";
  brushPickerWrap.innerHTML = `
    <label style="margin-bottom:5px;font-weight:600;" for="brushPicker">Brush</label>
    <div id="brushPicker"></div>
  `;
  // Smjesti ispod BG palete, iznad LineWidth
  const bgPalette = document.getElementById("bg-palette-special");
  if (bgPalette) {
    bgPalette.parentElement.parentElement.insertAdjacentElement("afterend", brushPickerWrap);
  }
  const brushPicker = brushPickerWrap.querySelector("#brushPicker");
  BRUSH_TYPES.forEach(brush => {
    const btn = document.createElement("button");
    btn.className = "brush-btn";
    btn.dataset.type = brush.id;
    btn.innerHTML = `<span>${brush.label}</span>`;
    btn.onclick = () => {
      document.querySelectorAll(".brush-btn").forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      currentBrushType = brush.id;
    };
    brushPicker.appendChild(btn);
    if (brush.id === currentBrushType) btn.classList.add('selected');
  });
}
document.addEventListener("DOMContentLoaded", buildBrushPicker);

// ==== TOOLS ====
const lineWidthInput = document.getElementById('lineWidth');
const lineWidthValue = document.getElementById('lineWidthValue');
let lineWidth = parseInt(lineWidthInput.value, 10);
lineWidthInput.oninput = (e) => {
  lineWidth = parseInt(e.target.value, 10);
  lineWidthValue.textContent = lineWidth;
};
const eraserBtn = document.getElementById('eraser');
eraserBtn.onclick = () => {
  eraserMode = !eraserMode;
  if (eraserMode) {
    eraserBtn.classList.add('active');
    setActiveSwatch(null);
    fillMode = false;
    document.getElementById('fill').classList.remove('active');
  } else {
    eraserBtn.classList.remove('active');
    currentColor = lastColor;
  }
};
const fillBtn = document.getElementById('fill');
fillBtn.onclick = () => {
  fillMode = !fillMode;
  if (fillMode) {
    fillBtn.classList.add('active');
    eraserMode = false;
    eraserBtn.classList.remove('active');
    setActiveSwatch && setActiveSwatch(null);
  } else {
    fillBtn.classList.remove('active');
  }
};
let fillTolerance = 16;
document.getElementById('fillTolerance').oninput = function(e) {
  fillTolerance = parseInt(e.target.value, 10);
  document.getElementById('fillToleranceValue').textContent = fillTolerance;
};
let expandFill = 0;
document.getElementById('expandFill').oninput = function(e) {
  expandFill = parseInt(e.target.value, 10);
  document.getElementById('expandFillValue').textContent = expandFill;
};

// ==== DRAWING ====
let actions = [];
let redoActions = [];
let isDrawing = false;
let currentPoints = [];
let previewImage = null;

// ---- Smoothing helper ----
function smoothPoints(points, windowSize = 4) {
  if (points.length <= 2) return points;
  const smoothed = [];
  for (let i = 0; i < points.length; i++) {
    let sumX = 0, sumY = 0, count = 0;
    for (let j = -Math.floor(windowSize/2); j <= Math.floor(windowSize/2); j++) {
      const idx = Math.min(points.length-1, Math.max(0, i+j));
      sumX += points[idx].x;
      sumY += points[idx].y;
      count++;
    }
    smoothed.push({x: sumX/count, y: sumY/count});
  }
  return smoothed;
}

// ---- Interpolation helper ----
function addInterpolatedPoints(points, x, y) {
  if (points.length === 0) {
    points.push({x, y});
    return;
  }
  const last = points[points.length - 1];
  const dist = Math.hypot(x - last.x, y - last.y);
  if (dist > 6) {
    const steps = Math.floor(dist / 4);
    for (let i = 1; i < steps; i++) {
      const nx = last.x + (x - last.x) * (i / steps);
      const ny = last.y + (y - last.y) * (i / steps);
      points.push({x: nx, y: ny});
    }
  }
  points.push({x, y});
}

// ==== BRUSH ENGINE ====
// Funkcije za različite četkice
function drawBrushStroke(ctx, points, color, width) {
  drawPolylineSmooth(ctx, points, color, width);
}
function drawCalligraphyBrush(ctx, points, color, width) {
  for (let i = 1; i < points.length; i++) {
    let p0 = points[i-1], p1 = points[i];
    let angle = Math.atan2(p1.y-p0.y, p1.x-p0.x);
    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(0, 0, width, width * 0.45, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
  }
}
function drawCalligraphyPen(ctx, points, color, width) {
  for (let i = 1; i < points.length; i++) {
    let p0 = points[i-1], p1 = points[i];
    let angle = Math.PI / 6;
    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(0, 0, width*0.7, width*0.25, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
  }
}
function drawAirbrush(ctx, points, color, width) {
  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < 12; j++) {
      let angle = Math.random() * 2 * Math.PI;
      let radius = Math.random() * width * 0.8;
      let dx = Math.cos(angle) * radius;
      let dy = Math.sin(angle) * radius;
      ctx.save();
      ctx.globalAlpha = 0.10 + Math.random() * 0.12;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(points[i].x + dx, points[i].y + dy, width * 0.23, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  }
}
function drawOilBrush(ctx, points, color, width) {
  for (let i = 1; i < points.length; i++) {
    ctx.save();
    ctx.globalAlpha = 0.32 + Math.random()*0.25;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * (0.8 + Math.random()*0.5);
    ctx.beginPath();
    ctx.moveTo(points[i-1].x, points[i-1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();
  }
}
function drawCrayon(ctx, points, color, width) {
  for (let i = 1; i < points.length; i++) {
    ctx.save();
    ctx.globalAlpha = 0.38 + Math.random()*0.15;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * (0.6 + Math.random()*0.3);
    ctx.setLineDash([1, Math.random()*4+1]);
    ctx.beginPath();
    ctx.moveTo(points[i-1].x, points[i-1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}
function drawMarker(ctx, points, color, width) {
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = color;
  ctx.lineWidth = width * 1.15;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i=1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.restore();
}
function drawPencil(ctx, points, color, width) {
  for (let i = 1; i < points.length; i++) {
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.random()*0.25;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * 0.5;
    ctx.beginPath();
    ctx.moveTo(points[i-1].x, points[i-1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();
  }
}
function drawWatercolor(ctx, points, color, width) {
  for (let i = 1; i < points.length; i++) {
    ctx.save();
    ctx.globalAlpha = 0.13 + Math.random()*0.19;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * (0.95 + Math.random()*0.25);
    ctx.beginPath();
    ctx.moveTo(points[i-1].x, points[i-1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();
  }
}

function drawByBrushType(ctx, points, color, width) {
  switch (currentBrushType) {
    case "basic": drawBrushStroke(ctx, points, color, width); break;
    case "calligraphy": drawCalligraphyBrush(ctx, points, color, width); break;
    case "calligraphy-pen": drawCalligraphyPen(ctx, points, color, width); break;
    case "airbrush": drawAirbrush(ctx, points, color, width); break;
    case "oil": drawOilBrush(ctx, points, color, width); break;
    case "crayon": drawCrayon(ctx, points, color, width); break;
    case "marker": drawMarker(ctx, points, color, width); break;
    case "pencil": drawPencil(ctx, points, color, width); break;
    case "watercolor": drawWatercolor(ctx, points, color, width); break;
    default: drawBrushStroke(ctx, points, color, width);
  }
}

// ---- Polyline draw with smoothing ----
function drawPolylineSmooth(ctx, points, color, lineWidth) {
  if (points.length < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i+1].x) / 2;
    const midY = (points[i].y + points[i+1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  ctx.lineTo(points[points.length-1].x, points[points.length-1].y);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

function renderAll() {
  ctx.clearRect(0,0,drawCanvas.width,drawCanvas.height);
  for (const act of actions) {
    if (act.type === "line") {
      drawByBrushType(ctx, act.points, act.color, act.width);
    } else if (act.type === "fill") {
      floodFill(ctx, act.x, act.y, hexToRgba(act.color), act.tolerance, act.expand);
    } else if (act.type === "clear") {
      ctx.clearRect(0,0,drawCanvas.width,drawCanvas.height);
    }
  }
}

document.getElementById('undo').onclick = () => {
  if (actions.length > 0) {
    redoActions.push(actions.pop());
    renderAll();
  }
};
document.getElementById('redo').onclick = () => {
  if (redoActions.length > 0) {
    actions.push(redoActions.pop());
    renderAll();
  }
};
window.addEventListener("keydown", function(e){
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); document.getElementById('undo').click();}
  if (e.ctrlKey && (e.key === 'y' || (e.key === 'Z' && e.shiftKey))) { e.preventDefault(); document.getElementById('redo').click();}
});

function getCanvasCoords(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = drawCanvas.width / rect.width;
  const scaleY = drawCanvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

let zoomLevel = 1;
const minZoom = 1, maxZoom = 3;
let panX = 0, panY = 0;
let isPanning = false, panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0;
let panMode = false;

// --- PATCH: reset pan if zoomLevel <= 1 ---
function updateTransform() {
  const wrap = document.getElementById('canvasWrap');
  const w = wrap.offsetWidth, h = wrap.offsetHeight;

  if (zoomLevel <= 1) {
    panX = 0;
    panY = 0;
    drawCanvas.style.transform = `scale(1)`;
    bgCanvas.style.transform = `scale(1)`;
    document.getElementById('zoomDisplay').textContent = `100%`;
    return;
  }

  const maxPanX = (w * (zoomLevel - 1)) / 2;
  const maxPanY = (h * (zoomLevel - 1)) / 2;

  panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  panY = Math.max(-maxPanY, Math.min(maxPanY, panY));

  drawCanvas.style.transform = `translate(${panX}px,${panY}px) scale(${zoomLevel})`;
  bgCanvas.style.transform = `translate(${panX}px,${panY}px) scale(${zoomLevel})`;
  document.getElementById('zoomDisplay').textContent = `${Math.round(zoomLevel * 100)}%`;
}

// --- PAN FIX (robust handlers) ---
window.addEventListener('keydown', function(e){
  if (e.code === 'Space') {
    panMode = true;
    document.body.style.cursor = 'grab';
    e.preventDefault();
  }
});
window.addEventListener('keyup', function(e){
  if (e.code === 'Space') {
    panMode = false;
    document.body.style.cursor = '';
    isPanning = false;
  }
});
drawCanvas.addEventListener('mousedown', function(e) {
  if (zoomLevel > 1 && panMode && e.button === 0) {
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panOriginX = panX;
    panOriginY = panY;
  } else if (e.button === 0 && !fillMode && !panMode) {
    isDrawing = true;
    currentPoints = [];
    const { x, y } = getCanvasCoords(e);
    currentPoints.push({x, y});
    previewImage = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    redoActions = [];
  }
});
drawCanvas.addEventListener('mousemove', function(e) {
  if (isPanning) {
    let dx = e.clientX - panStartX;
    let dy = e.clientY - panStartY;
    panX = panOriginX + dx;
    panY = panOriginY + dy;
    updateTransform();
  }
  if (!isDrawing || fillMode || panMode) return;
  const { x, y } = getCanvasCoords(e);
  addInterpolatedPoints(currentPoints, x, y);
  ctx.putImageData(previewImage, 0, 0);
  drawByBrushType(ctx, currentPoints, eraserMode
    ? (bgType === "color" ? bgColor : bgType === "custom" ? customBg : "#fff")
    : currentColor,
    lineWidth
  );
});
window.addEventListener('mouseup', function(e) {
  isPanning = false;
  if (isDrawing && !fillMode) {
    isDrawing = false;
    ctx.putImageData(previewImage, 0, 0);
    if (currentPoints.length === 1) {
      const pt = currentPoints[0];
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, lineWidth / 2, 0, 2 * Math.PI);
      ctx.fillStyle = eraserMode
        ? (bgType === "color" ? bgColor : bgType === "custom" ? customBg : "#fff")
        : currentColor;
      ctx.globalAlpha = 1;
      ctx.fill();
      ctx.restore();
    } else {
      drawByBrushType(ctx, currentPoints, eraserMode
        ? (bgType === "color" ? bgColor : bgType === "custom" ? customBg : "#fff")
        : currentColor,
        lineWidth
      );
    }
    actions.push({
      type: "line",
      points: currentPoints.slice(),
      color: eraserMode
        ? (bgType === "color" ? bgColor : bgType === "custom" ? customBg : "#fff")
        : currentColor,
      width: lineWidth,
      brush: currentBrushType
    });
    redoActions = [];
    currentPoints = [];
  }
});
drawCanvas.addEventListener('mouseleave', function(e) {
  isPanning = false;
  if (isDrawing && !fillMode) {
    isDrawing = false;
    ctx.putImageData(previewImage, 0, 0);
    if (currentPoints.length === 1) {
      const pt = currentPoints[0];
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, lineWidth / 2, 0, 2 * Math.PI);
      ctx.fillStyle = eraserMode
        ? (bgType === "color" ? bgColor : bgType === "custom" ? customBg : "#fff")
        : currentColor;
      ctx.globalAlpha = 1;
      ctx.fill();
      ctx.restore();
    } else {
      drawByBrushType(ctx, currentPoints, eraserMode
        ? (bgType === "color" ? bgColor : bgType === "custom" ? customBg : "#fff")
        : currentColor,
        lineWidth
      );
    }
    actions.push({
      type: "line",
      points: currentPoints.slice(),
      color: eraserMode
        ? (bgType === "color" ? bgColor : bgType === "custom" ? customBg : "#fff")
        : currentColor,
      width: lineWidth,
      brush: currentBrushType
    });
    redoActions = [];
    currentPoints = [];
  }
});

// ==== FILL TOOL ====
drawCanvas.addEventListener('click', function(e) {
  if (!fillMode) return;
  isDrawing = false;
  currentPoints = [];
  renderAll();
  const { x, y } = getCanvasCoords(e);
  floodFill(ctx, Math.floor(x), Math.floor(y), hexToRgba(currentColor), fillTolerance, expandFill);
  actions.push({
    type: "fill",
    x: Math.floor(x),
    y: Math.floor(y),
    color: currentColor,
    tolerance: fillTolerance,
    expand: expandFill
  });
  redoActions = [];
});

function floodFill(ctx, startX, startY, fillColor, tolerance = 16, expand = 0) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  const pixelPos = (startY * canvasWidth + startX) * 4;
  const targetColor = [data[pixelPos], data[pixelPos + 1], data[pixelPos + 2], data[pixelPos + 3]];

  if (colorMatch(targetColor, fillColor, tolerance)) return;

  function getPixelColor(x, y) {
    const idx = (y * canvasWidth + x) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  }
  function setPixelColor(x, y, color) {
    const idx = (y * canvasWidth + x) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];
    data[idx + 3] = 255;
  }

  const stack = [[startX, startY]];
  const filled = new Uint8Array(canvasWidth * canvasHeight);

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue;
    const idx = y * canvasWidth + x;
    if (filled[idx]) continue;
    filled[idx] = 1;

    const currentColor = getPixelColor(x, y);
    if (!colorMatch(currentColor, targetColor, tolerance)) continue;

    setPixelColor(x, y, fillColor);

    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }

  // EXPAND FILL
  if (expand > 0) {
    for (let r = 0; r < expand; r++) {
      let newFilled = filled.slice();
      for (let y = 0; y < canvasHeight; ++y) {
        for (let x = 0; x < canvasWidth; ++x) {
          if (filled[y * canvasWidth + x]) {
            let neighbors = [
              [x+1, y], [x-1, y], [x, y+1], [x, y-1],
              [x+1, y+1], [x-1, y-1], [x+1, y-1], [x-1, y+1]
            ];
            for (let [nx, ny] of neighbors) {
              if (
                nx >= 0 && nx < canvasWidth &&
                ny >= 0 && ny < canvasHeight &&
                !newFilled[ny * canvasWidth + nx]
              ) {
                newFilled[ny * canvasWidth + nx] = 1;
                setPixelColor(nx, ny, fillColor);
              }
            }
          }
        }
      }
      filled.set(newFilled);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function colorMatch(a, b, tolerance) {
  return (
    Math.abs(a[0] - b[0]) <= tolerance &&
    Math.abs(a[1] - b[1]) <= tolerance &&
    Math.abs(a[2] - b[2]) <= tolerance &&
    Math.abs(a[3] - b[3]) <= tolerance
  );
}
function hexToRgba(hex) {
  let c = hex.replace('#','');
  if (c.length===3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  let num = parseInt(c,16);
  return [num>>16 & 255, num>>8 & 255, num & 255, 255];
}

// ==== ZOOM ====
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const zoomResetBtn = document.getElementById('zoomReset');
zoomInBtn.onclick = () => {
  zoomLevel = Math.min(zoomLevel + 0.25, maxZoom);
  updateTransform();
};
zoomOutBtn.onclick = () => {
  zoomLevel = Math.max(zoomLevel - 0.25, minZoom);
  panX = 0; panY = 0;
  updateTransform();
};
zoomResetBtn.onclick = () => {
  zoomLevel = 1;
  panX = 0; panY = 0;
  updateTransform();
};
document.getElementById('canvasWrap').addEventListener('wheel', function(e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomLevel = Math.min(zoomLevel + 0.1, maxZoom);
    } else {
      zoomLevel = Math.max(zoomLevel - 0.1, minZoom);
    }
    updateTransform();
  }
}, { passive: false });

// ==== CLEAR ====
document.getElementById('clear').onclick = () => {
  actions.push({type: "clear"});
  redoActions = [];
  renderAll();
};

// ==== SHARE ====
document.getElementById('share').onclick = () => {
  document.getElementById('shareModal').style.display = 'flex';
  const todaysWord = document.getElementById('word').textContent;
  window._artImageData = (() => {
    const temp = document.createElement('canvas');
    temp.width = drawCanvas.width;
    temp.height = drawCanvas.height;
    const tctx = temp.getContext('2d');
    tctx.drawImage(bgCanvas,0,0);
    tctx.drawImage(drawCanvas,0,0);
    return temp.toDataURL('image/png');
  })();
  window._shareText = `Today's art crime "${todaysWord}" - #ArtCrimesGame\nPlay at: ${window.location.origin}`;
};

function downloadArtImage() {
  const a = document.createElement('a');
  a.href = window._artImageData;
  a.download = 'artcrimes.png';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

document.getElementById('shareTwitter').onclick = () => {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(window._shareText)}`);
};
document.getElementById('shareInstagram').onclick = () => {
  window.open(`https://www.instagram.com/`);
};
document.getElementById('shareFacebook').onclick = () => {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(window._shareText)}`);
};
document.getElementById('shareReddit').onclick = () => {
  window.open(`https://www.reddit.com/r/artcrimes/submit?title=${encodeURIComponent(window._shareText)}`);
};
document.getElementById('downloadImg').onclick = downloadArtImage;
document.getElementById('closeModal').onclick = () => {
  document.getElementById('shareModal').style.display = 'none';
};

// === TOUCH EVENTS FOR MOBILE ===
let isTouchPanning = false;
let touchPanStartX = 0, touchPanStartY = 0, touchPanOriginX = 0, touchPanOriginY = 0;

drawCanvas.addEventListener('touchstart', function(e) {
  if (zoomLevel > 1 && e.touches.length === 2) {
    isTouchPanning = true;
    touchPanStartX = e.touches[0].clientX;
    touchPanStartY = e.touches[0].clientY;
    touchPanOriginX = panX;
    touchPanOriginY = panY;
    return;
  }
  if (e.touches.length === 1) {
    e.preventDefault();
    isDrawing = true;
    currentPoints = [];
    const touch = e.touches[0];
    const { x, y } = getCanvasCoords(touch);
    currentPoints.push({x, y});
    previewImage = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    redoActions = [];
  }
}, { passive: false });

drawCanvas.addEventListener('touchmove', function(e) {
  if (isTouchPanning && zoomLevel > 1 && e.touches.length === 2) {
    e.preventDefault();
    let dx = e.touches[0].clientX - touchPanStartX;
    let dy = e.touches[0].clientY - touchPanStartY;
    panX = touchPanOriginX + dx;
    panY = touchPanOriginY + dy;
    updateTransform();
    return;
  }
  if (!isDrawing || e.touches.length !== 1) return;
  e.preventDefault();
  const touch = e.touches[0];
  const { x, y } = getCanvasCoords(touch);
  addInterpolatedPoints(currentPoints, x, y);
  ctx.putImageData(previewImage, 0, 0);
  drawByBrushType(ctx, currentPoints, eraserMode
    ? (bgType === "color" ? bgColor : bgType === "custom" ? customBg : "#fff")
    : currentColor,
    lineWidth
  );
}, { passive: false });

drawCanvas.addEventListener('touchend', function(e) {
  if (isTouchPanning && (e.touches.length < 2 || zoomLevel <= 1)) {
    isTouchPanning = false;
    return;
  }
  if (isDrawing && e.touches.length === 0) {
    e.preventDefault();
    isDrawing = false;
    ctx.putImageData(previewImage, 0, 0);
    if (currentPoints.length === 1) {
      const pt = currentPoints[0];
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, lineWidth / 2, 0, 2 * Math.PI);
      ctx.fillStyle = eraserMode
        ? (bgType === "color" ? bgColor : bgType === "custom" ? customBg : "#fff")
        : currentColor;
      ctx.globalAlpha = 1;
      ctx.fill();
      ctx.restore();
    } else {
      drawByBrushType(ctx, currentPoints, eraserMode
        ? (bgType === "color" ? bgColor : bgType === "custom" ? customBg : "#fff")
        : currentColor,
        lineWidth
      );
    }
    actions.push({
      type: "line",
      points: currentPoints.slice(),
      color: eraserMode
        ? (bgType === "color" ? bgColor : bgType === "custom" ? customBg : "#fff")
        : currentColor,
      width: lineWidth,
      brush: currentBrushType
    });
    redoActions = [];
    currentPoints = [];
  }
}, { passive: false });

// ==== Theme button sync (with theme.js) ====
function updateThemeBtn() {
  const themeBtn = document.getElementById('toggleDark');
  if (!themeBtn) return;
  themeBtn.textContent = document.body.classList.contains('dark') ? "☀️" : "🌙";
}
document.addEventListener("DOMContentLoaded", updateThemeBtn);
document.addEventListener("themeChange", updateThemeBtn);
window.setInterval(updateThemeBtn, 1000);

drawBgCanvas();
renderAll();
updateTransform();

// --- Modal logic (za palete) ---
function setupModal(openId, modalId, closeId) {
  const openBtn = document.getElementById(openId);
  const modal = document.getElementById(modalId);
  const closeBtn = document.getElementById(closeId);
  openBtn.onclick = () => modal.classList.remove('hidden');
  closeBtn.onclick = () => modal.classList.add('hidden');
  window.addEventListener('click', function(e){
    if (!modal.classList.contains('hidden') && !modal.contains(e.target) && e.target !== openBtn)
      modal.classList.add('hidden');
  });
}
setupModal('openColorPickerSwatch', 'colorPickerModal', 'closeColorPicker');
setupModal('openBgPickerSwatch', 'bgPickerModal', 'closeBgPicker');

// Update selected color/background swatch
function updateSelectedColorSwatch() {
  const swatchBtn = document.getElementById('openColorPickerSwatch');
  swatchBtn.style.background = currentColor;
}
function updateSelectedBgSwatch() {
  const bgSwatchBtn = document.getElementById('openBgPickerSwatch');
  bgSwatchBtn.style.background = bgType === "color" ? bgColor : customBg;
}
document.getElementById('openColorPickerSwatch').onclick = function() {
  document.getElementById('colorPickerModal').classList.remove('hidden');
};
document.getElementById('openBgPickerSwatch').onclick = function() {
  document.getElementById('bgPickerModal').classList.remove('hidden');
};
updateSelectedColorSwatch();
updateSelectedBgSwatch();
customColorInput.oninput && customColorInput.oninput();
customBgInput.oninput && customBgInput.oninput();
