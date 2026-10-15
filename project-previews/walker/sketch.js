/////config/////
const stepSize = 6
const stepsPerFrame = 120
const colorShift = 5
const speed = 100

////globals////
let x,y
let r,g,b
////sketch////





function setup() {
  createCanvas(windowWidth,windowHeight)
  background(0)
  frameRate(speed)
  x=width/2
  y=height/2

  r=random(255)
  g=random(255)
  b=random(255)
  /// set initital rgb colors
}

// a
function draw() {
  background(0,20);

  for (ii=0; ii< stepsPerFrame; ii++) {
    step()
  }
}

// ask about this function
function step() {
  let newX = random(x-stepSize,x+stepSize)
  let newY = random(y-stepSize,y+stepSize)

  if(newX<0){
    newX=0;
  }
  if(newX>width){
    newX=width;
  }

  if(newY<0){
    newY=0
  }
  if(newY>height){
    newY=height
  }

  let newR = random(r-colorShift, r+colorShift)
  let newG = random(g-colorShift, g+colorShift)
  let newB = random(b-colorShift, b+colorShift)
  
  if(newR<0) {
    newR = 0
  } 

  if(newR > 200) {
    newR = 200
  }


  if(newG<0) {
    newG = 0
  } 

  if(newG > 200) {
    newG = 200
  }

  if(newB<0) {
    newB = 0
  } 

  if(newB > 200) {
    newB = 200
  }

  

  // if()  greater 255 = 255

  stroke(newR,newG,newB)
  line(x,y,newX,newY)
  x=newX
  y=newY
  r = newR
  g = newG
  b=newB
  



  
  
}

