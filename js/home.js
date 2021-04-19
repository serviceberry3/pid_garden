//get canvas on which to draw garden
var c = document.getElementById("gardenCanvas");
var ctx = c.getContext("2d");

//no image smoothing
ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.webkitImageSmoothingEnabled = false;

//set font for canvas
ctx.font = "50px sans-serif";

//start new path, empty list of subpaths
ctx.beginPath();

//current fill point of garden, used for coloring
var currentFillPt = 0;

var maxWaterError = .2;

//frequency at which to run PID loop, in ms
var pidFreq = 100;

var gardenTopLeftX = 150;
var gardenTopLeftY = 250;
var gardenBottomRtX = 900;
var gardenBottomRtY = 900;

//the PID controller
var ctrl = null;

//whether we should reset integral to 0 when error approaches 0
var SHOULD_RESET_INTEGRAL = true;

//+- range of error at which integral should be reset to 0
var INTEGRAL_RESET_THRESHOLD = 1;

var blue = "#0000BB";
var white = "#FFFFFF";
var lightBrown = "#D2691E";
var darkBrown = "#654321";
var black = "#000000";
var orange = "#FF4500";

var gardenWidth = gardenBottomRtX - gardenTopLeftX;
var gardenHeight = gardenBottomRtY - gardenTopLeftY;

//span tag displaying current moisture value
var moistureVal = document.getElementById("moisture_val");
var onOffBtn = document.getElementById("onoffbtn");
var currError = document.getElementById("error");

//desired moisture level and actual moisture level
var desiredMoisture = 0, actualMoisture = 0;

var runPid = false;

var data = '<!--svg is actually a **DOCUMENT**, similar to iframe-->' +
'<svg xmlns="http://www.w3.org/2000/svg" '+
'viewBox="0 0 7000 200">'+
    '<defs>'+
        '<style>.cls-1{fill:#5fb157;}.cls-2{fill:none;stroke:#221f20;stroke-miterlimit:10;}'+
        '</style>'+
    '</defs>'+
    '<g id="Calque_2" data-name="Calque 2">'+
    '<g id="Calque_1-2" data-name="Calque 1">'+
            '<path class="cls-1" d="M196.19,164.82v-95A259.28,259.28,0,0,1,206.61,25.4c1.84-5.6,4.06-11.4,8.55-15.23,3.67-3.13,8.45-4.58,'+
            '13.12-5.81C240.12,1.24,252.62-1,264.57,1.71S287.83,13,290.43,25a32,32,0,0,0-17.9,10.35c6.92,5.09,14,10.59,17.69,18.35S293,'+
            '72.12,285.86,77c-5.93,4.05-14,2.86-20.68.13s-12.79-6.84-19.81-8.39c-6.55-1.45-15.79,2.33-14.27,8.86,1.66,7.06,14.69,8.9,'+
            '13,16-7.43-2.18-15.26,3.16-19.11,9.87s-4.89,14.61-7.06,22c-3.9,13.34-11.44,25.26-18.93,37a33.37,33.37,0,0,1-7.57,13.31Q193.92,170.29,196.19,164.82Z"/>'+
            '<path class="cls-1" d="M159.53,83.94l-2,0c-.07-13.39-2.09-27.61-12.77-35-8.32-5.76-20-5.18-28.82-.28s-15.2,13.46-19.43,22.66c-4.6,10-7,'+
            '21.24-5.49,32.16,1.38,10,5.94,19.55,5.35,29.59s-10,20.73-19.4,17.2C69.43,147.46,67.29,138,66.25,130,52.67,128,42.14,144.32,28.4,144.15S7.23,'+
            '128.45,3,115.42C1,109.51-.87,102.86,1.86,97.27c1.72-3.52,5-6,8.22-8.17a170.69,170.69,0,0,1,49-23,32.46,32.46,0,0,0-27-16.68c24.35-14.46,'+
            '56.16-8.42,82-19.91,16.19-7.19,31-21.34,48.57-19.25,12.85,1.53,23.28,12,28.21,23.93s5.27,25.27,4.9,38.2c.11-.85.23-1.71.36-2.56v95q-2.28,'+
            '5.48-4.72,10.88l-.13.14a45.25,45.25,0,0,0-3.81,4.15,13.69,13.69,0,0,0-2.56,8.64h-.41a13.17,13.17,0,0,1-3.6-6.72h.52a20.27,20.27,0,0,0-3.83-9.11l2.67-.58a16.43,'+
            '16.43,0,0,1-1-9.29h-.05a79.88,79.88,0,0,0-10.1-57.52C164.94,98.64,159.53,91.89,159.53,83.94Z"/>'+
            '<path class="cls-1" d="M179.22,162.92h.05a16.43,16.43,0,0,0,1,9.29l-2.67.58c-4.59-6.47-12-11.77-15.52-18.85,3.15-8.61-3.19-19.52-12.35-20.76-10.57-1.44-19.21,'+
            '7.77-28.91,12.21-6.2,2.83-15.29,2.68-17.94-3.6-2.12-5,1.48-10.79,6.12-13.6s10.17-3.71,15.17-5.81,9.89-6.21,'+
            '10.12-11.63c-4.2-1.75-8.54-3.6-11.62-6.94s-4.57-8.63-2.22-12.52c1.56-2.59,4.46-4.07,7.33-5a32.58,32.58,0,0,1,27.89,4l1.75-.44c.05-1.94.08-3.92.06-5.92l2,'+
            '0c0,8,5.41,14.7,9.59,21.46A79.88,79.88,0,0,1,179.22,162.92Z"/>'+
            '<path class="cls-2" d="M161.78,154.83c.13-.29.25-.58.35-.88,'+
            '3.15-8.61-3.19-19.52-12.35-20.76-10.57-1.44-19.21,7.77-28.91,12.21-6.2,2.83-15.29,2.68-17.94-3.6-2.12-5,1.48-10.79,6.12-13.6s10.17-3.71,15.17-5.81,'+
            '9.89-6.21,10.12-11.63c-4.2-1.75-8.54-3.6-11.62-6.94s-4.57-8.63-2.22-12.52c1.56-2.59,4.46-4.07,7.33-5a32.58,32.58,0,0,1,27.89,4A25.52,25.52,0,0,1,157.94,92"/>'+
            '<path class="cls-2" d="M157.47,89.88c.05-1.94.08-3.92.06-5.92-.07-13.39-2.09-27.61-12.77-35-8.32-5.76-20-5.18-28.82-.28s-15.2,13.46-19.43,'+
            '22.66c-4.6,10-7,21.24-5.49,32.16,1.38,10,5.94,19.55,5.35,29.59s-10,20.73-19.4,17.2C69.43,147.46,67.29,138,66.25,130,52.67,128,42.14,144.32,28.4,'+
            '144.15S7.23,128.45,3,115.42C1,109.51-.87,102.86,1.86,97.27c1.72-3.52,5-6,8.22-8.17a170.69,170.69,0,0,1,49-23,32.46,32.46,0,0,0-27-16.68c24.35-14.46,'+
            '56.16-8.42,82-19.91,16.19-7.19,31-21.34,48.57-19.25,12.85,1.53,23.28,12,28.21,23.93s5.27,25.27,4.9,38.2c.11-.85.23-1.71.36-2.56A259.28,259.28,0,0,1,'+
            '206.61,25.4c1.84-5.6,4.06-11.4,8.55-15.23,3.67-3.13,8.45-4.58,13.12-5.81C240.12,1.24,252.62-1,264.57,1.71S287.83,13,290.43,25a32,32,0,0,0-17.9,'+
            '10.35c6.92,5.09,14,10.59,17.69,18.35S293,72.12,285.86,77c-5.93,4.05-14,2.86-20.68.13s-12.79-6.84-19.81-8.39c-6.55-1.45-15.79,2.33-14.27,8.86,1.66,'+
            '7.06,14.69,8.9,13,16-7.43-2.18-15.26,3.16-19.11,9.87s-4.89,14.61-7.06,22c-3.9,13.34-11.44,25.26-18.93,37,0,.09-.11.18-.17.27"/>'+
            '<path class="cls-2" d="M196.19,68.32v97.59"/>'+
            '<path class="cls-2" d="M159.53,83.92v0c0,8,5.41,14.7,9.59,21.46a79.88,79.88,0,0,1,10.1,57.52c-.1.53-.22,1.06-.34,1.59"/>'+
            '<path class="cls-2" d="M160.63,150a19.63,19.63,0,0,0,1.5,3.91c3.57,7.08,10.93,12.38,15.52,18.85a20.27,20.27,0,0,1,3.83,9.11"/>'+
            '<path class="cls-2" d="M197.48,161.74c-.42,1-.85,2.06-1.29,3.08q-2.28,5.48-4.72,10.88-1.46,3.3-3,6.58"/>'+
            '<path class="cls-2" d="M179.27,162.93a16.43, 16.43,0,0,0,1,9.29"/>'+
            '<path class="cls-2" d="M199.12,162.12c0,.09-.05.18-.08.27a33.37,33.37,0,0,1-7.57,13.31l-.13.14a45.25,45.25,0,0,0-3.81,4.15,13.69,'+
            '13.69,0,0,0-2.56,8.64,11.26,11.26,0,0,0,.24,2"/>'+
            '<path class="cls-2" d="M180.87,181.41l.09.51a13.17,13.17,0,0,0,3.6,6.72"/>'+
        '</g>'+
    '</g>'+
'</svg>';

//get URL to the DOM. window represents the browser's window
var DOMURL = window.URL || window.webkitURL || window;

//create new Image
var carrotTopImg = new Image();

//create new Blob, a file-like obj of immutable, raw data; they can be read as text or binary data, or converted into ReadableStream 
//so its methods can be used for processing the data. Can represent data that isn't necessarily in JS-native format. 
var svg = new Blob([data], {type: 'image/svg+xml'});

//create a URL for the svg file
//creates DOMString containing URL representing svg. The URL lifetime is tied to the doc in window on which it was created. 
//The new object URL represents the specified File object or Blob object
var url = DOMURL.createObjectURL(svg);

//A DOMString is a sequence of 16-bit unsigned ints, typically interpreted as UTF-16 code units. This corresponds exactly to JS primitive String type.
//When a DOMString is provided to JS, it maps directly to corresponding String.
//When a Web API accepts a DOMString, val provided will be stringified, using ToString abstract operation.

carrotTopImg.src = 'img/carrot_top.png';

//draw the garden once the image has loaded
carrotTopImg.onload = drawGarden;


class PIDCtrl
{
  constructor(p, i, d)
  {
    this.Kp = p;
    this.Ki = i;
    this.Kd = d;
    this.compP = 0;
    this.compI = 0;
    this.compD = 0;
    this.ResetCtrl();
  }
  
  ResetCtrl()
  {
    this.lastError = 0.0;
    this.integError = 0.0;
  }
  
  Update(error, dt)
  {
    //update error field
    currError.innerHTML = error;

    console.log("Abs error is ", Math.abs(error));

    //reset the integral component when error reaches low point, to avoid overshooting
    if (SHOULD_RESET_INTEGRAL && (Math.abs(error) < INTEGRAL_RESET_THRESHOLD)) {
      console.log("RESET INTEGRAL");
      this.integError = 0;
    }

    this.integError += error * dt;
    this.compP = error * this.Kp;
    this.compI = this.integError * this.Ki;
    this.compD = ((error - this.lastError) / dt) * this.Kd;
    this.lastError = error;
    return this.compP + this.compI + this.compD;
  }
  
  ComponentP() {
    return this.compP;
  }
  ComponentI() {
    return this.compI;
  }
  ComponentD() {
    return this.compD;
  }

  getKp() {
      return this.Kp;
  }

  getKi() {
      return this.Ki;
  }

  getKd() {
      return this.Kd;
  }
}

function drawGarden() {
  //black text
  ctx.fillStyle = black;

  //draw some text in the garden
  ctx.fillText("My garden", 400, 150);

  ctx.fillStyle = darkBrown;

  //draw garden details
  ctx.fillRect(gardenTopLeftX, gardenTopLeftY - 20, gardenBottomRtX - gardenTopLeftX, 50);

  //draw carrots
  ctx.strokeStyle = black;
  ctx.fillStyle = orange;

  //ctx.moveTo(gardenTopLeftX, gardenTopLeftY - 20);

  carrotWidth = 20;
  carrotHeight = 50;

  currentX = 0;
  currentY = 0;

  //draw the carrot flesh
  for (i = 1; i < 14; i++) {
    //starts a new path by emptying the list of sub-paths. (creates new path)
    ctx.beginPath();

    currentX = gardenTopLeftX + (50 * i);
    currentY = gardenTopLeftY - 30;

    //begins a new sub-path at the point specified by the given (x, y) coordinates
    ctx.moveTo(currentX, currentY);

    currentX = currentX + (carrotWidth / 2);
    currentY = currentY + carrotHeight;
    ctx.lineTo(currentX, currentY);

    currentX = currentX + (carrotWidth / 2);
    currentY = currentY - carrotHeight;
    ctx.lineTo(currentX, currentY);

    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }

  currentX = 0;
  currentY = 0;

  //draw the tops of the carrots
  for (i = 1; i < 14; i++) {
    currentX = gardenTopLeftX + (50 * i) - 20;
    currentY = gardenTopLeftY - 60;

    //draw a carrot top
    ctx.drawImage(carrotTopImg, currentX, currentY, 50, 50 * carrotTopImg.height / carrotTopImg.width);
  }

  
  //draw rectangle symbolizing the garden: x, y, width, height
  ctx.rect(gardenTopLeftX, gardenTopLeftY, gardenBottomRtX - gardenTopLeftX, gardenBottomRtY - gardenTopLeftY);

  //strokes (outlines) current or given path with the current stroke style
  //Strokes are aligned to center of a path, so half of stroke is drawn on inner side, and half on the outer side.
  //Stroke is drawn using non-zero winding rule, which means path intersections will still get filled
  ctx.stroke();

}

//draw garden once on page load
drawGarden();

//get a random int including [0...max-1] in range
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

//draw the water
function drawWater(finalWaterAmtToAdd) {
    //clear subpath list, start new path
    ctx.beginPath();

    //clear garden
    ctx.clearRect(gardenTopLeftX, gardenTopLeftY, gardenWidth, gardenHeight);

    //redraw garden outline and details
    drawGarden();

    //clip to garden
    ctx.clip();

    //clear subpath list again, start new path
    ctx.beginPath();

    fillY = gardenBottomRtY - (currentFillPt + finalWaterAmtToAdd);

    //go to left edge of canvas, appropriate y coord
    ctx.moveTo(gardenTopLeftX, fillY);

    //draw wavy top edge
    for (var x = gardenTopLeftX; x < gardenBottomRtX - 8; x += 20) {
        //adds quadratic Bézier curve to current sub-path, requires two points: a control pt and end pt. 
        //Starting pt is the latest point in the current path, which can be changed using moveTo() before creating curve
        ctx.quadraticCurveTo(x + 10,  //control pt x coord
          fillY + 15,
           x + 20,                    //end pt x coord
           fillY);
    }

    //line from top right to bottom rt
    ctx.lineTo(gardenBottomRtX, gardenBottomRtY);

    //line from bottom rt to bottom left
    ctx.lineTo(gardenTopLeftX, gardenBottomRtY);

    //close the path (close the gap with straight line) and fill with blue
    ctx.closePath();
    ctx.fillStyle = drawingColor;
    ctx.fill();
}

//add (or subtract) some amount of water from the garden
function addWater(amt) {
    //start new path, empty list of subpaths
    ctx.beginPath();

    console.log("addWater() called");

    //if amount is 0, return immediately
    if (amt == 0) {
      return;
    }

    //to simulate the error of an actual system, randomize some error on amt of water to add, selecting on (-.2, .2)
    randomWaterError = Math.random() * maxWaterError;
    console.log("randomWaterError is ", randomWaterError);

    //get 0 or 1 to determine sign
    sign = getRandomInt(2);

    //calculate final water amt to add to the system, factoring in the random error
    finalWaterAmtToAdd = (sign == 0) ? amt + randomWaterError : amt - randomWaterError;

    //draw the water in the garden
    drawWater(finalWaterAmtToAdd);
  
    currentFillPt += finalWaterAmtToAdd;
    console.log("After addWater(), new currentFillPt is ", currentFillPt, ", ...updating HTML");

    //calculate new soil moisture percentage after adding water
    let newMoistureVal = currentFillPt / gardenHeight * 100;
    actualMoisture = newMoistureVal;

    //set moisture val text to new value
    moistureVal.innerHTML = newMoistureVal;
}

function setDesired() {
    //get the desired values entered in input boxes
    desiredMoisture = document.getElementById("desiredMoisture").value;
    desiredP = document.getElementById("desiredP").value;
    desiredI = document.getElementById("desiredI").value;
    desiredD = document.getElementById("desiredD").value;

    console.log("Desired moist, p, i, d are", desiredMoisture, "%, ", desiredP, ",", desiredI, ",", desiredD);

    //generate new PID controller with desired constants
    ctrl = new PIDCtrl(desiredP, desiredI, desiredD);
}

//sleep (blocking) for number of milliseconds
function sleep(milliseconds) {
    console.log("Sleep of ", milliseconds, "ms requested");
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

//the control loop, which runs at frequency specified by pidFreq
function pidLoop() {
    //check if the PID has been turned on by the user
    if (runPid && (ctrl != null)) {
      console.log("Running PID");

      console.log("Integral component is", ctrl.ComponentI());

      //get time in ms and compare it to previous timestamp to find how much time elapses each PID loop
      timeElapsed = Date.now() - prevTime;
      console.log("Time elapsed was", timeElapsed);

      //update PID controller, then add some water to the garden, basing amt of water on controller output
      addWater(ctrl.Update(desiredMoisture - actualMoisture, timeElapsed));

      //get current timestamp to use for next loop iteration
      prevTime = Date.now();
    }
}

//turn PID controller on and off
function pidOnOffToggle() {
    if (runPid) {
        onOffBtn.innerHTML = "Turn on PID irrigation system";
    }
    else {
        onOffBtn.innerHTML = "Turn off PID irrigation system";
    }

    //flip runPid bool
    runPid = !runPid;
}

function setProcessVars(p, i, d)
{
  ctrl.Kp = p;
  ctrl.Ki = i;
  ctrl.Kd = d; 
  
  /*
  car.mass = mass;
  car.damping = 1.0 - damping;
  motorLimit = maxf;*/
}

//second canvas
var ctx2 = document.getElementById("interpCanvas").getContext("2d"),
x = 3.1, 
dx = 0.1;

ctx2.imageSmoothingEnabled = ctx2.mozImageSmoothingEnabled = ctx2.webkitImageSmoothingEnabled = false;
ctx2.font = "14px sans-serif";

(function loop() {
  //black
  ctx2.fillStyle = "#000";

  //clear out 350 x 50 rectangle
  ctx2.clearRect(0, 0, 350, 50);

  //fill a rectangle that's x by 1
  ctx2.fillRect(0, 0, x, 1); // forces pixel-alignment for demo

  //draw the canvas, with width of 4, height of 1, drawing image itself with width 200 and height 50 (4 50x50 squares)
  ctx2.drawImage(ctx2.canvas, 0 , 0, 4, 1, 0, 0, 200, 50);
  
  //add .1 to x
  x += dx;

  //oscillate
  if (x <= 3 || x >= 4) dx = -dx;

  info(x);

  //display length
  document.getElementById("interpLength").innerHTML = "Length: " + x.toFixed(2);
  
  //recursively repeat this fxn infinitely
  setTimeout(loop, 160)
})();


function info(x) {
  //red paint
  ctx2.fillStyle = "#f00";

  //display perceived length
  ctx2.fillText("Perceived length", 210, 19);

  //FIRST RED LINE

  //draw first red line, at appropriate length, height of 2
  ctx2.fillRect(0, 15, x * 50, 2);

  //draw first red line's end cap, at appropriate length, height of 7
  ctx2.fillRect(x * 50 - 1, 12, 2, 7);

  //=== true if both sides are same type AND same val
  //if x is the integer 3 exactly, set x to 3, otherwise set to 4
  x = (x === 3) ? 3 : 4;

  //display actual length
  ctx2.fillText("Actual length", 210, 40);

  //SECOND RED LINE

  //fill rectangle of dims (50 * x) by 2, starting 35 down
  //second red line
  ctx2.fillRect(0, 35, x * 50, 2);

  //second red line's end cap, height of 7
  ctx2.fillRect(x * 50 - 1, 32, 2, 7);
}

//get initial timestamp
var prevTime = Date.now();

//set the PID loop to run every pidFreq ms
setInterval(pidLoop, pidFreq);


var fillTestCanvas = document.getElementById("fillTestCanvas");
var ctx3 = fillTestCanvas.getContext("2d");
var cw = fillTestCanvas.width;
var ch = fillTestCanvas.height;
ctx3.lineCap = "round";

//set y to height of canvas - 10
var y = ch - 10;
var drawingColor = "#0092f9";
animate();

function animate() {
    //stop when y hits 0
    if (y > 0) {
        //only run animate() again if there's room left in the droplet
        requestAnimationFrame(animate);
    }

    //clear entire canvas
    ctx3.clearRect(0, 0, cw, ch);

    //Saves current drawing style state using stack so you can revert any change you make to it using restore().
    ctx3.save();

    //draw the droplet outline
    drawContainer(0, null, null);
    drawContainer(15, drawingColor, null);
    drawContainer(7, "white", "white");

    ctx3.save();

    //Creates clipping path from current sub-paths. Everything drawn after clip() is called appears inside clipping path only
    ctx3.clip();

    //draw the liquid inside/clipped to droplet outline
    drawLiquid();

    //Restores drawing style state to last element on 'state stack' saved by save()
    ctx3.restore();

    //restore to first state
    ctx3.restore();

    //up one pixel
    y--;
}

function drawLiquid() {
    ctx3.beginPath();

    //go to left edge of canvas, appropriate y coord
    ctx3.moveTo(0, y);

    //draw wavy top edge
    for (var x = 0; x < cw; x += 20) {
        ctx3.quadraticCurveTo(x + 10, y + 15, x + 20, y);
    }

    //line from top right to bottom rt
    ctx3.lineTo(cw, ch);

    //line from bottom rt to bottom left
    ctx3.lineTo(0, ch);

    //close the path and fill with blue
    ctx3.closePath();
    ctx3.fillStyle = drawingColor;
    ctx3.fill();
}

//draw outline of water drop
function drawContainer(linewidth, strokestyle, fillstyle) {
    ctx3.beginPath();
    ctx3.moveTo(109, 15);
    ctx3.bezierCurveTo(121, 36, 133, 57, 144, 78);
    ctx3.bezierCurveTo(160, 109, 176, 141, 188, 175);
    ctx3.bezierCurveTo(206, 226, 174, 272, 133, 284);
    ctx3.bezierCurveTo(79, 300, 24, 259, 25, 202);
    ctx3.bezierCurveTo(25, 188, 30, 174, 35, 161);
    ctx3.bezierCurveTo(53, 115, 76, 73, 100, 31);
    ctx3.bezierCurveTo(103, 26, 106, 21, 109, 15);
    ctx3.lineWidth = linewidth;
    ctx3.strokeStyle = strokestyle;
    ctx3.stroke();
    if (fillstyle) {
        ctx3.fillStyle = fillstyle;
        ctx3.fill();
    }
}




