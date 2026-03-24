//TOOL CATEGORIES:
// 1. SHAPE
// line, rectangle, circle, triangle
// 2. FREEHAND
// brush

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
let selectedElements = []

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

  currentCanvasState = "EDITING"

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
  else if (currentTool === 'selection-tool') {
    selectedElements = getSelectedElement()
  }

})

canvas.addEventListener("mousemove", (e) => {
  if (currentCanvasState !== 'EDITING') return

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
        let rad = dist(x1, y1, x2, y2)
        ctx.beginPath()
        ctx.arc(x1, y1, rad, 0, 2 * Math.PI, true)
        ctx.stroke()
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

const getSelectedElements = ({ clientX, clientY }) => {
  elements.forEach((el) => {
    if (el.toolCategory === 'SHAPE') {

      let { x1, y1, x2, y2 } = getDiagonalCorners(el)

      if (el.tool === 'rect-tool') {
        if ((clientX >= x1 && clientX <= x2) && (clientY >= y1 && clientY <= y2)) {
          selectedElements.push(el)
        }
      }
      if (el.tool === 'line-tool') {
        let dist1 = dist(x1, y1, clientX, clientY)
        let dist2 = dist(clientX, clientY, x2, y2)
        let len = dist(x1, y1, x2, y2)

        if ((dist1 + dist2 - len) < 1) {
          selectedElements.push(el)
        }
      }
      if (el.tool === 'circle-tool') {
        let rad = dist(x1, y1, x2, y2)
        let distFromCenter = dist(x1, y1, clientX, clientY)

        if (distFromCenter < rad) {
          selectedElements.push(el)
        }
      }
      if (el.tool === 'triangle-tool') {
        let x3 = (x1 + x2) / 2
        let y3 = y2

        // area of triangle ABC 
        let A = area (x1, y1, x2, y2, x3, y3); 
        // area of triangle PBC 
        let A1 = area (x, y, x2, y2, x3, y3); 
        // area of triangle PAC 
        let A2 = area (x1, y1, x, y, x3, y3); 
        // area of triangle PAB    
        let A3 = area (x1, y1, x2, y2, clientX, clientY); 
        if (A === A1 + A2 + A3) {
          selectedElements.push(el)
        } 
      }
    }
  })
}

const getDiagonalCorners = ({ x1, y1, x2, y2 }) => {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)

  return {
    x1: minX,
    y1: minY,
    x2: maxX,
    y2: maxY
  }
}

const dist = (x1, y1, x2, y2) => {
  let dx = x2 - x1
  let dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

const area = (x1, y1, x2, y2, x3, y3) => {
  //Heron's formula
  return Math.abs((x1*(y2-y3) + x2*(y3-y1)+ x3*(y1-y2))/2.0); 
}