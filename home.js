var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.webkitImageSmoothingEnabled = false;
ctx.font = "50px sans-serif";

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

//**** PID constants DEFINED HERE ****
var Kp = 0.12,
Ki = 0.00001;
Kd = 0.8;

var blue = "#0000BB";
var white = "#FFFFFF";

var gardenWidth = gardenBottomRtX - gardenTopLeftX;
var gardenHeight = gardenBottomRtY - gardenTopLeftY;

//span tag displaying current moisture value
var moistureVal = document.getElementById("moisture_val");
var onOffBtn = document.getElementById("onoffbtn");
var currError = document.getElementById("error");

//desired moisture level and actual moisture level
var desired = 0, actual = 0;

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
    if (Math.abs(error) < 3) {
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

let ctrl = new PIDCtrl(Kp, Ki, Kd);


//draw rectangle symbolizing the garden : x, y, width, height
ctx.rect(gardenTopLeftX, gardenTopLeftY, gardenBottomRtX - gardenTopLeftX, gardenBottomRtY - gardenTopLeftY);

//draw some text in the garden
ctx.fillText("My garden", 400, 200);

//draw to screen
ctx.stroke();

//get a random int including [0...max-1] in range
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function addWater(amt) {
    console.log("addWater() called");

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

    //if need to add water to system
    if (finalWaterAmtToAdd > 0) {
      ctx.fillStyle = blue;
      ctx.fillRect(gardenTopLeftX, gardenBottomRtY - (currentFillPt + finalWaterAmtToAdd), gardenWidth, finalWaterAmtToAdd);
    }
    else {
      ctx.fillStyle = white;
      ctx.fillRect(gardenTopLeftX, gardenBottomRtY - currentFillPt, gardenWidth, finalWaterAmtToAdd);
    }
  
    currentFillPt += finalWaterAmtToAdd;
    console.log("After addWater(), new currentFillPt is ", currentFillPt, ", ...updating HTML");

    //calculate new soil moisture percentage after adding water
    let newMoistureVal = currentFillPt / gardenHeight * 100;
    actual = newMoistureVal;

    //set moisture val text to new value
    moistureVal.innerHTML = newMoistureVal;
}

function setDesired() {
    //get the desired value entered in input box
    desired = document.getElementById("desired").value;

    console.log("Desired is ", desired);

    //start with fresh previous error and integral
    ctrl.ResetCtrl();
}

class TestClass {
    
}

//sleep (blocking) for number of milliseconds
function sleep(milliseconds) {
    console.log("Sleep of ", milliseconds, "ms requested");
    const date = Date.now();
    let currentDate = null;
    do {
        //console.log("Sleeping");
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

//the control loop, which runs at frequency specified by pidFreq
function pidLoop() {
    //check if the PID has been turned on by the user
    if (runPid) {
      console.log("Running PID");

      console.log("Integral component is", ctrl.ComponentI());

      //get time in ms and compare it to previous timestamp to find how much time elapses each PID loop
      timeElapsed = Date.now() - prevTime;
      console.log("Time elapsed was", timeElapsed);

      //update PID controller, then add some water to the garden, basing amt of water on controller output
      addWater(ctrl.Update(desired - actual, timeElapsed));

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

    runPid = !runPid;
}

function setProcessVars(p, i, d, mass, damping, maxf)
{
  ctrl.Kp = p;
  ctrl.Ki = i;
  ctrl.Kd = d; 
  
  car.mass = mass;
  car.damping = 1.0 - damping;
  motorLimit = maxf;
}

var ctx2 = document.querySelector("canvas").getContext("2d"),
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
  document.querySelector("div").innerHTML = "length: " + x.toFixed(2);
  
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


var prevTime = Date.now();
setInterval(pidLoop, pidFreq);




