//config
let space=12;




function setup() {
  createCanvas(windowWidth,windowHeight);
  // noLoop()
}

function draw() {
  background(220);
  //loopxx
  for(xx=0; xx<width; xx+=space){
    //loopyy
    for(yy=0; yy<height; yy+=space){
      //gridsline
      stroke(10)

      let r = random(100)

      if (r<33) {
        square(xx, yy, space)
      }
      else if (r<66) {
        circle(xx+(space/2), yy+(space/2), space)
      }
      // line(xx,yy,xx+space,yy+space)
      else {
        triangle(xx+(space/2), yy, xx, yy+space, xx+space, yy+space)
      }
    }
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}



// function draw() {
//   background(220);
//   //loopxx
//   for(xx=0; xx<width; xx+=space){
//     //loopyy
//     for(yy=0; yy<height; yy+=space){
//       //gridsline
//       stroke(10)
//       noStroke()
//       fill(0, 50)
//       let r = floor(random(1, 5))
//       console.log(r)

//       triangle(xx,yy, xx, yy+(space*r), xx+(space*r), yy+(space*r))

//     }
//   }
// }