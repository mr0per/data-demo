let rawData = [];
let countries = [];
let hoveredIndex = -1;
let selectedIndex = -1;
let dataLoadFailed = false;

const flagPalette = {
  red: "#d62828",
  white: "#f8f9fa",
  blue: "#003049",
  lightBlue: "#5fb0e8",
  green: "#2a9d8f",
  yellow: "#f4d35e",
  black: "#1b1f24",
  orange: "#f77f00"
};

const explicitFlagMap = {
  argentina: [flagPalette.lightBlue, flagPalette.white],
  australia: [flagPalette.blue, flagPalette.white],
  austria: [flagPalette.red, flagPalette.white],
  belgium: [flagPalette.black, flagPalette.yellow],
  brazil: [flagPalette.green, flagPalette.yellow],
  canada: [flagPalette.red, flagPalette.white],
  china: [flagPalette.red, flagPalette.yellow],
  colombia: [flagPalette.yellow, flagPalette.blue],
  denmark: [flagPalette.red, flagPalette.white],
  finland: [flagPalette.white, flagPalette.blue],
  france: [flagPalette.blue, flagPalette.red],
  germany: [flagPalette.black, flagPalette.red],
  greece: [flagPalette.blue, flagPalette.white],
  india: [flagPalette.orange, flagPalette.green],
  ireland: [flagPalette.green, flagPalette.orange],
  israel: [flagPalette.white, flagPalette.blue],
  italy: [flagPalette.green, flagPalette.red],
  japan: [flagPalette.white, flagPalette.red],
  mexico: [flagPalette.green, flagPalette.red],
  netherlands: [flagPalette.red, flagPalette.blue],
  newzealand: [flagPalette.blue, flagPalette.white],
  norway: [flagPalette.red, flagPalette.blue],
  poland: [flagPalette.white, flagPalette.red],
  portugal: [flagPalette.green, flagPalette.red],
  spain: [flagPalette.red, flagPalette.yellow],
  sweden: [flagPalette.blue, flagPalette.yellow],
  switzerland: [flagPalette.red, flagPalette.white],
  unitedkingdom: [flagPalette.blue, flagPalette.red],
  unitedstates: [flagPalette.red, flagPalette.blue]
};

function preload() {
  if (Array.isArray(window.WORLD_HAPPINESS_2024)) {
    rawData = window.WORLD_HAPPINESS_2024;
    dataLoadFailed = false;
    return;
  }

  rawData = loadJSON(
    "./data/worldHappiness2024.json",
    () => {
      dataLoadFailed = false;
    },
    () => {
      rawData = [];
      dataLoadFailed = true;
    }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Bungee");
  textAlign(CENTER, CENTER);
  buildCountries();
  computeGridLayout();
}

function draw() {
  drawBackgroundGradient();
  updateHoverState();

  for (let i = 0; i < countries.length; i++) {
    updateCountryPosition(i);
    drawCountryCircle(i);
  }

  if (selectedIndex === -1) {
    drawLegend();
  }

  if (countries.length === 0) {
    drawNoDataMessage();
  }
}

function buildCountries() {
  const source = Array.isArray(rawData) ? rawData : Object.values(rawData || {});
  const cleaned = source
    .map((row) => ({
      country: (row["Country name"] || "").trim(),
      score: Number(row["Ladder score"])
    }))
    .filter((row) => row.country && Number.isFinite(row.score));

  cleaned.sort((a, b) => a.country.localeCompare(b.country));

  const minScore = min(cleaned.map((d) => d.score));
  const maxScore = max(cleaned.map((d) => d.score));

  countries = cleaned.map((item, index) => {
    const baseRadius = map(item.score, minScore, maxScore, 12, 24);
    const palette = getFlagGradientForCountry(item.country);

    return {
      index,
      country: item.country,
      score: item.score,
      baseRadius,
      currentRadius: baseRadius,
      gridX: 0,
      gridY: 0,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      colorA: color(palette[0]),
      colorB: color(palette[1]),
      waveOffset: random(TWO_PI)
    };
  });
}

function computeGridLayout() {
  if (!countries.length) {
    return;
  }

  const margin = 14;
  const availableWidth = max(200, width - margin * 2);
  const availableHeight = max(200, height - margin * 2);

  const columns = max(
    1,
    ceil(sqrt((countries.length * availableWidth) / availableHeight))
  );
  const rows = ceil(countries.length / columns);

  const cellW = availableWidth / columns;
  const cellH = availableHeight / rows;
  const cellSize = min(cellW, cellH);

  const minScore = min(countries.map((c) => c.score));
  const maxScore = max(countries.map((c) => c.score));

  for (let i = 0; i < countries.length; i++) {
    countries[i].baseRadius = map(
      countries[i].score,
      minScore,
      maxScore,
      cellSize * 0.2,
      cellSize * 0.42
    );
  }

  const gridWidth = columns * cellSize;
  const gridHeight = rows * cellSize;

  const startX = margin;
  const startY = margin;

  for (let i = 0; i < countries.length; i++) {
    const col = i % columns;
    const row = floor(i / columns);

    const x = startX + col * cellSize + cellSize / 2;
    const y = startY + row * cellSize + cellSize / 2;

    countries[i].gridX = x;
    countries[i].gridY = y;
    countries[i].targetX = x;
    countries[i].targetY = y;

    if (countries[i].x === 0 && countries[i].y === 0) {
      countries[i].x = x;
      countries[i].y = y;
    }
  }

  const neededWidth = gridWidth + margin * 2;
  const neededHeight = gridHeight + margin * 2;

  if (neededWidth > width || neededHeight > height) {
    resizeCanvas(max(width, neededWidth), max(height, neededHeight));
  }
}

function updateHoverState() {
  hoveredIndex = -1;
  for (let i = countries.length - 1; i >= 0; i--) {
    const c = countries[i];
    const d = dist(mouseX, mouseY, c.x, c.y);
    if (d <= c.currentRadius) {
      hoveredIndex = i;
      break;
    }
  }
}

function updateCountryPosition(i) {
  const c = countries[i];
  const waveX = sin(frameCount * 0.02 + c.waveOffset) * 2.2;
  const waveY = cos(frameCount * 0.02 + c.waveOffset) * 2.2;

  if (selectedIndex === i) {
    c.targetX = width / 2;
    c.targetY = height / 2;
    c.currentRadius = lerp(c.currentRadius, c.baseRadius * 3.8, 0.11);
  } else {
    c.targetX = c.gridX + waveX;
    c.targetY = c.gridY + waveY;
    const hoverScale = hoveredIndex === i ? 1.12 : 1;
    c.currentRadius = lerp(c.currentRadius, c.baseRadius * hoverScale, 0.16);
  }

  c.x = lerp(c.x, c.targetX, 0.1);
  c.y = lerp(c.y, c.targetY, 0.1);
}

function drawCountryCircle(i) {
  const c = countries[i];
  const darkenHover = hoveredIndex === i && selectedIndex !== i;

  drawingContext.save();
  drawingContext.shadowBlur = selectedIndex === i ? 35 : 14;
  drawingContext.shadowColor = "rgba(0, 0, 0, 0.38)";
  noStroke();
  drawGradientCircle(c.x, c.y, c.currentRadius, c.colorA, c.colorB, darkenHover);
  drawingContext.restore();

  fill(245);
  if (selectedIndex === i) {
    textSize(30);
    text(c.country, c.x, c.y - 18);
    textSize(22);
    text(`Ladder score: ${c.score.toFixed(3)}`, c.x, c.y + 18);
  }
}

function drawGradientCircle(x, y, radius, colA, colB, darken) {
  const steps = 26;
  for (let i = steps; i >= 1; i--) {
    const t = i / steps;
    let col = lerpColor(colA, colB, 1 - t);
    if (darken) {
      col = lerpColor(col, color("#000000"), 0.22);
    }
    fill(col);
    circle(x, y, radius * 2 * t);
  }
}

function getFlagGradientForCountry(countryName) {
  const normalized = countryName.toLowerCase().replace(/[^a-z]/g, "");
  if (explicitFlagMap[normalized]) {
    return explicitFlagMap[normalized];
  }

  const combos = [
    [flagPalette.red, flagPalette.white],
    [flagPalette.blue, flagPalette.white],
    [flagPalette.green, flagPalette.yellow],
    [flagPalette.red, flagPalette.blue],
    [flagPalette.black, flagPalette.yellow],
    [flagPalette.orange, flagPalette.white]
  ];

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return combos[hash % combos.length];
}

function drawBackgroundGradient() {
  const topCol = color("#2a3358");
  const bottomCol = color("#4a2c63");

  for (let y = 0; y < height; y++) {
    const t = y / height;
    const c = lerpColor(topCol, bottomCol, t);
    stroke(c);
    line(0, y, width, y);
  }
  noStroke();
}

function mouseClicked() {
  if (hoveredIndex === -1) {
    selectedIndex = -1;
  } else if (selectedIndex === hoveredIndex) {
    selectedIndex = -1;
  } else {
    selectedIndex = hoveredIndex;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  computeGridLayout();
}

function drawLegend() {
  const panelW = 300;
  const panelH = 86;
  const x = width - panelW - 18;
  const y = 18;

  drawingContext.save();
  drawingContext.shadowBlur = 12;
  drawingContext.shadowColor = "rgba(0, 0, 0, 0.3)";
  noStroke();
  fill(16, 18, 33, 185);
  rect(x, y, panelW, panelH, 12);
  drawingContext.restore();

  textAlign(LEFT, TOP);
  fill(240);
  textSize(13);
  text("Hover: darkens + slight grow", x + 14, y + 14);
  text("Click: glide to center + show score", x + 14, y + 36);
  text("Click selected/empty space: reset", x + 14, y + 58);
  textAlign(CENTER, CENTER);
}

function drawNoDataMessage() {
  const msg1 = dataLoadFailed
    ? "Could not load data file."
    : "No data available to draw.";
  const msg2 = "Open this project through a local server, not file://";

  drawingContext.save();
  drawingContext.shadowBlur = 14;
  drawingContext.shadowColor = "rgba(0, 0, 0, 0.35)";
  noStroke();
  fill(18, 20, 36, 205);
  rect(width / 2 - 240, height / 2 - 62, 480, 124, 14);
  drawingContext.restore();

  textAlign(CENTER, CENTER);
  fill(248);
  textSize(24);
  text(msg1, width / 2, height / 2 - 16);
  textSize(14);
  text(msg2, width / 2, height / 2 + 20);
}