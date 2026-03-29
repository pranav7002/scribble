//CONSTANTS

export const canvas = document.getElementById("canvas");
export const ctx = canvas.getContext("2d");
export const allToolInputs = document.querySelectorAll("input[name='tool']");
export const strokeSlider = document.getElementById("stroke-width");
export const opacitySlider = document.getElementById("opacity");
export const colorSelector = document.getElementById("color-selector");
export const themeToggleBtn = document.getElementById("theme-toggle");
export const clearBtn = document.getElementById("clear-tool");
export const colorDisplay = document.getElementById("color-display")
export const fillModeBtn = document.getElementById("paint-fill");
export const strokeModeBtn = document.getElementById("paint-stroke");
export const layerUpBtn = document.getElementById('layer-up')
export const layerDownBtn = document.getElementById('layer-down')
export const fillSelector = document.querySelector(".fill-section")

//ENUMS
export const canvasStates = {
    IDLE: 'IDLE',
    EDITING: 'EDITING'
}
export const tools = {
    NONE: 'NONE',
    ERASER: 'eraser-tool',
    RECT: 'rect-tool',
    LINE: 'line-tool',
    CIRCLE: 'circle-tool',
    TRIANGLE: 'triangle-tool',
    BRUSH: 'brush-tool',
    DASHED_BRUSH: 'dash-brush-tool',
    DOTTED_BRUSH: 'dotted-brush-tool',
    TEXT: 'text-tool',
    IMAGE: 'image-tool',
    SELECTION: 'selection-tool'
}

export const paintModes = {
    FILL: 'fill',
    STROKE: 'stroke'
}

export const themes = {
    DARK: 'dark',
    LIGHT: 'light'
}

export const textboxStates = {
  PLACEHOLDER: 'placeholder',
  TYPING: 'typing',
  TYPED: 'typed'
}