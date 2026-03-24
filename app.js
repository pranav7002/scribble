const canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d")
const allInputs = document.querySelectorAll("input")
const lineCheckbox = document.getElementById("line-tool")
const rectCheckbox = document.getElementById("rect-tool")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

let elements = []
let lastIndex = 0
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

  elements[lastIndex] = {
    x1: e.clientX,
    y1: e.clientY,
    x2: e.clientX,
    y2: e.clientY,
    tool: currentSelection
  }

  lastIndex++
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
    if (element.tool === 'rect-tool') {
      let { x1, y1, x2, y2 } = element
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
    }  
  })
}