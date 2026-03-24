const canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d")
const allInputs = document.querySelectorAll("input")
const lineCheckbox = document.getElementById("line-tool")
const rectCheckbox = document.getElementById("rect-tool")
const circleCheckbox = document.getElementById("circle-tool")
const triangleCheckbox = document.getElementById("triangle-tool")
const brushCheckbox = document.getElementById('brush-tool')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

let elements = []
let currentCanvasState = 'IDLE'
let currentTool = 'NONE'
let currentToolCategory = 'NONE'

allInputs.forEach((input) => {
  input.addEventListener("change", (e) => {
    currentTool = e.target.id
    if (e.target.id === 'brush-tool') {
      currentToolCategory = 'FREEHAND'      
    }
    else {
      currentToolCategory = 'SHAPE'
    }
    console.log(currentTool)
  })
})

canvas.addEventListener("mousedown", (e) => {
  if (currentTool === 'NONE') return

  currentCanvasState = "DRAWING"

  if (currentToolCategory === 'SHAPE') {
  elements.push({
      x1: e.clientX,
      y1: e.clientY,
      x2: e.clientX,
      y2: e.clientY,
      tool: currentTool,
      toolCategory: currentToolCategory
    })
  }
  else if (currentToolCategory === 'FREEHAND') {
    elements.push({
      x1: e.clientX,
      y1: e.clientY,
      points: [{x: e.clientX, y: e.clientY}],
      tool: currentTool,
      toolCategory: currentToolCategory
    })
  } 

})

canvas.addEventListener("mousemove", (e) => {
  if (currentCanvasState === 'IDLE') return

  let el = elements[elements.length - 1]

  if (currentToolCategory === 'SHAPE') {
    el.x2 = e.clientX
    el.y2 = e.clientY  
  } 
  else if (currentToolCategory === 'FREEHAND') {
    let x = e.clientX
    let y = e.clientY
    el.points.push({x, y})
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  render()
})

canvas.addEventListener("mouseup", (e) => {
  currentCanvasState = 'IDLE'
})

// coords are (x1, y1), (x1, y2) (x2, y1) (x2, y2)

const render = () => {
  elements.forEach((element) => {
    if (element.toolCategory === 'SHAPE') {
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
      if (tool === 'triangle-tool') {
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y1)
        ctx.lineTo((x1 + x2) / 2, y2)
        ctx.closePath()
        ctx.stroke()
      }
    }
    else if (element.toolCategory === 'FREEHAND') {
      ctx.beginPath()
      let {x, y} = element.points[0]
      ctx.moveTo(x, y)
      for (let i = 1; i < element.points.length; i++) {
        let {x, y} = element.points[i]
        ctx.lineTo(x, y)
      }
      ctx.stroke()
      console.log(element.points)
    }
  })  
}