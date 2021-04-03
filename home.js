var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
ctx.beginPath();

//draw rectangle symbolizing the garden : x, y, width, height
ctx.rect(30, 500, 800, 400);
ctx.fillText("My garden", 400, 800);
ctx.stroke();

class PIDCtrl
{
  constructor(p, i, d)
  {
    this.Kp = p;
    this.Ki = i;
    this.Kd = d;
    this.ResetCtrl();
  }
  
  ResetCtrl()
  {
    this.lastError = 0.0;
    this.integError = 0.0;
  }
  
  Update(error, dt)
  {
    integError += error * dt;
    this.compP = error * Kp;
    this.compI = integError * Ki;
    this.compD = ((error - lastError) / dt) * Kd;
    lastError = error;
    return compP + compI + compD;
  }
  
  ComponentP() {
    return compP;
  }
  ComponentI() {
    return compI;
  }
  ComponentD() {
    return compD;
  }
}

class TestClass {

}



function pidLoop() {

}

function testFunc() {

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


let ctrl = new PIDCtrl();