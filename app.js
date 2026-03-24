const canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d")
const allInputs = document.querySelectorAll("input")
const lineCheckbox = document.getElementById("line-tool")
const rectCheckbox = document.getElementById("rect-tool")
const circleCheckbox = document.getElementById("circle-tool")
const triangleCheckbox = document.getElementById("triangle-tool")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

let elements = []
let currentState = 'idle'
let currentSelection = 'none'

allInputs.forEach((input) => {
  input.addEventListener("change", (e) => {
    currentSelection = e.target.id
    console.log(currentSelection)
  })
})

canvas.addEventListener("mousedown", (e) => {
  if (currentSelection === 'none') return

  currentState = "drawing"

  elements.push({
    x1: e.clientX,
    y1: e.clientY,
    x2: e.clientX,
    y2: e.clientY,
    tool: currentSelection
  })
})

canvas.addEventListener("mousemove", (e) => {
  if (currentState === 'idle') return

  let el = elements[elements.length - 1]
  el.x2 = e.clientX
  el.y2 = e.clientY

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  render()
})

canvas.addEventListener("mouseup", (e) => {
  currentState = 'idle'
})

const render = () => {
  elements.forEach((element) => {
    let { x1, y1, x2, y2, tool } = element

    if (tool === 'rect-tool') {
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
    }  
    if (tool === 'line-tool') {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    if (tool === 'circle-tool') {
      let dx = x2 - x1
      let dy = y2 - y1
      let rad = Math.sqrt(dx * dx + dy * dy)
      ctx.beginPath()
      ctx.arc(x1, y1, rad, 0, 2 * Math.PI, true)
      ctx.stroke()

      //try fixing this later
      // let x = Math.abs(x2 - x1) < Math.abs(y2 - y1) ? (x1 + x2)/2 : (x1 + (Math.abs(y2 - y1)))/2
      // let y = Math.abs(x2 - x1) < Math.abs(y2 - y1) ? (y1 + (Math.abs(x2 - x1)))/2 : (y1 + y2)/2
      // let rad = Math.abs(x2 - x1) < Math.abs(y2 - y1) ? Math.abs(x2 - x1) / 2 : Math.abs(y2 - y1) / 2
      // ctx.beginPath()
      // ctx.arc(x, y, rad, 0, 2 * Math.PI, true)
      // ctx.stroke()
    }
  })
}