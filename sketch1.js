
let data;
let country, happiness;

async function setup() {
    createCanvas(windowWidth, windowHeight);
    data = await loadJSON("data/worldHappiness2024.json");
}

    
function draw() {
    background(220);

    if(data) {
        const rows = Array.isArray(data) ? data : Object.values(data);

        for(let i = 0; i < rows.length; i++) {

            let country = rows[i]["Country name"];
            let happiness = rows[i]["Ladder score"];
            let textX = random(width);
            let textY = random(height);
            let scale = width * 0.01;

            fill(255);
             circle(textX, textY, happiness * scale);

             textAlign(CENTER, CENTER);
             fill(0);
             text(country, textX, textY);
        }

        noLoop();
    }
}