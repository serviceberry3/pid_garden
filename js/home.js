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
  ctx.fillText("My garden", 400, 200);

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




