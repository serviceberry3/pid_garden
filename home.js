var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
ctx.beginPath();

//current fill point of garden, used for coloring
var currentFillPt = 0;

var gardenTopLeftX = 30;
var gardenTopLeftY = 500;
var gardenBottomRtX = 830;
var gardenBottomRtY = 900;

var gardenWidth = gardenBottomRtX - gardenTopLeftX;
var gardenHeight = gardenBottomRtY - gardenTopLeftY;

//span tag displaying current moisture value
var moistureVal = document.getElementById("moisture_val");
var onOffBtn = document.getElementById("onoffbtn");

//desired moisture level and actual moisture level
var desired = 0, actual = 0;

var runPid = false;

class PIDCtrl
{
  constructor(p, i, d)
  {
    console.log("Setting this.Kp to ", p);
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
    this.integError += error * this.dt;
    this.compP = error * this.Kp;
    this.compI = this.integError * this.Ki;
    this.compD = ((error - this.lastError) / this.dt) * this.Kd;
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

let ctrl = new PIDCtrl(1, 1, 1);



//draw rectangle symbolizing the garden : x, y, width, height
ctx.rect(gardenTopLeftX, gardenTopLeftY, gardenBottomRtX - gardenTopLeftX, gardenBottomRtY - gardenTopLeftY);

//draw some text in the garden
ctx.fillText("My garden", 400, 800);

//draw to screen
ctx.stroke();

function addDrop() {
    console.log("addDrop() called");

    ctx.fillStyle = "#0000BB";
    ctx.fillRect(gardenTopLeftX, gardenBottomRtY - currentFillPt, gardenWidth, 1);

    let newMoistureVal = currentFillPt / gardenHeight * 100;
    actual = currentFillPt / gardenHeight * 100;

    moistureVal.innerHTML = newMoistureVal;

    currentFillPt++;
}

function removeDrop() {

}

function setDesired() {
    desired = document.getElementById("desired").value;

    console.log("Desired is ", desired);

    if (desired != actual) {
        pidLoop();
    }
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


function pidLoop() {
    console.log("Running pidLoop()");


    var prevTime = Date.now();

    var i = 0
    while (actual != desired) {
        //console.log("ComponentP() returns", ctrl.ComponentP());
        sleep(ctrl.ComponentP());

        //add drop of water to the garden
        //requestAnimationFrame(addDrop);
        requestAnimationFrame(addDrop);
        //addDrop();
        
        timeElapsed = Date.now() - prevTime;
        console.log("Time elapsed was", timeElapsed);

        ctrl.Update(desired - (desired - actual), timeElapsed);

        //get time in ms
        prevTime = Date.now();
        i++;
    }
}

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



//window.onload = loop;



