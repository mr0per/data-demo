let data;
let country;
let textX, textY;
let scale;

async function setup() {
    createCanvas(windowWidth, windowHeight);
    data = await loadJSON('worldHappiness2024.json');
    scale = width * 0.01; 
    textAlign(CENTER, CENTER);
}

function draw() {
    background(220);
    for (let i = 0; i < data.length; i++) {
        let happinessAmt = data[i] ["Ladder score"];
        let countryName = data[i] ["Country name"];
        let Generosity = data[i] ["Generosity"];
        let circX = random(width);
        let circY = random(height);
        let circS = happinessAmt * scale;
        textX = circX;
        textY = circY - circS /2;
        let textS = width * 0.01;
        fill(255);
        circle(circX, circY, circS);
        fill(0);
        noStroke();
        textSize(textS);
        text(countryName, textX, textY-textS/2);

        if (Generosity > 0.2) {
            smileyFace(circX, circY, true);
        } else {           
             smileyFace(circX, circY, false);
        }
    }
}

function smileyFace(x, y, smileOn) {
    let w = width * 0.02;
    let h = height * 0.03;
    noFill();
    stroke(0);
    strokeWeight(width*0.001);
    if (smileOn) {
        arc(x, y, w, h, 0, PI);
    } else {
        arc(x, y + h/2, w, h, PI, 0);
    }
    
    fill(0);
    circle(x - w*0.15, y - h*0.03, w*0.1);
    circle(x + w*0.15, y - h*0.03, w*0.1);
    noFill();
}
