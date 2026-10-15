//config
let space=18;









function setup() {
  createCanvas(windowWidth, windowHeight);
  // noLoop()
  background(0);
}

function draw() {
  background(0, 40);

  stroke(255,10)
  for(xx=0; xx<width; xx+=space){
    for(yy=0; yy<height; yy+=space){

      let randNum = random(30)

      // square(xx==,yy, space)
      stroke(random(255), random(255), random(255))
      
      if(randNum < 2.5){
        line(xx,yy,xx+space,yy+space)
      }
      else if (randNum<5) {
        // line(xx,yy,xx+space,yy)
      }
      else if (randNum < 8.5) {
        line(xx,yy,xx,yy+space)
      }
      // if (randNum > 9.8) {
      //   circle(xx+(space/2), yy+(space/2), space/3)
      // }
    }
  }
}
