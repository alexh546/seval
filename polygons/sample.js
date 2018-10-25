let cuboids = require('polygons')
let cluster = cuboids()

let size = [1, 1, 1]
let color_a = [240, 220, 220]
let block_a = [
  [0, 1, -2],
  [0, 0, -2],
  [0, 0, -1],
  [0, 0, 0],
  [0, 0, 1],
  [1, 0, 1],
]
let color_b = [220, 220, 240]
let block_b = [
  [2, 0, 1],
  [3, 0, 1],
  [3, 0, 0],
  [3, 0, -1],
  [3, 1, -1],
  [3, 2, -1],
  [3, 3, -1],
]

block_a.forEach(c => cluster.cuboid(c, size, 'a', color_a))
block_b.forEach(c => cluster.cuboid(c, size, 'b', color_b))

let canvas = document.getElementById('rotating-block-canvas')
let context = canvas.getContext('2d')
context.translate(400, 400) // Center origin (assume canvas width=800 and height=800)

let play = true
let depth = 800

let render = cuboids.transforms.bundle([
  cuboids.transforms.zsort([0, 0, -depth]),
  cuboids.transforms.shading([-1, 0, -1], 40, [0, 0, -depth]),
  draw,
])

cluster
  .scale([100, 100, 100])
  .center([0, 0, 500], polygon => polygon.name === 'a')
  .center([0, 0, 0], polygon => polygon.name === 'b')

canvas.ontouchstart = event => {
  var position = [event.changedTouches[0].pageX, event.changedTouches[0].pageY]
  var move
  play = false

  canvas.ontouchmove = event => {
    move = [event.changedTouches[0].pageX, event.changedTouches[0].pageY].map((e, i) => e - position[i])
    position = [event.changedTouches[0].pageX, event.changedTouches[0].pageY]
    cluster.rotate([move[1] * 0.01, -move[0] * 0.01, 0], [0, 0, 250]).apply(render)
  }

  document.ontouchend = event => {
    play = true
    animate()
  }
}

canvas.onmousedown = event => {
  var position = [event.pageX, event.pageY]
  var move
  play = false

  canvas.onmousemove = event => {
    move = [event.pageX, event.pageY].map((e, i) => e - position[i])
    position = [event.pageX, event.pageY]
    cluster.rotate([move[1] * 0.01, -move[0] * 0.01, 0], [0, 0, 250]).apply(render)
  }

  document.onmouseup = event => {
    canvas.onmousemove = undefined
    play = true
    animate()
  }
}

animate()

function animate () {
  if (play) window.requestAnimationFrame(animate)
  try {
    cluster
      .rotate(
        [0.005, 0.005, 0.005],
        [0, 0, 500],
        polygon => polygon.name === 'a')
      .rotate(
        [0.005, 0.005, -0.005],
        [0, 0, 0],
        polygon => polygon.name === 'b')
      .apply(render)
  } catch (error) {
    play = false
    console.log('stopped because exception')
    throw error
  }
}

function draw (polygons) {
  context.clearRect(-400, -400, 800, 800)
  polygons.forEach(polygon => {
    context.fillStyle = `rgb(${polygon.color[0]}, ${polygon.color[1]}, ${polygon.color[2]})`
    context.strokeStyle = 'white'
    context.beginPath()

    polygon.vectors.forEach(v => context.lineTo(v[0] / (v[2] + depth) * depth, v[1] / (v[2] + depth) * depth))

    context.closePath()
    context.fill()
    context.stroke()
  })
}