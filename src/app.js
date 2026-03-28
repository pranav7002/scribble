import {
    renderRect,
    hitTestRect,
    moveRect,
} from "./tools/rect.js";

import {
    renderLine,
    hitTestLine,
    moveLine,
} from "./tools/line.js";

import {
    renderCircle,
    hitTestCircle,
    moveCircle,
} from "./tools/circle.js";

import {
    renderTriangle,
    hitTestTriangle,
    moveTriangle,
} from "./tools/triangle.js";

import {
    renderSolidBrush,
    hitTestBrush,
    moveBrush,
} from "./tools/solid-brush.js";

import {
    renderDashedBrush,
} from "./tools/dashed-brush.js";

import {
    renderDottedBrush,
} from "./tools/dotted-brush.js";

import {
    renderImage,
    hitTestImage,
    moveImage,
    fetchImage,
} from "./tools/image.js";

import {
    renderTextbox,
    hitTestTextbox,
    moveTextbox,
    textboxKeydownHandler,
    textboxMouseupHandler,
    defocusTextbox,
} from "./tools/textbox.js";

import {
    renderSelectionUI,
    getResizeHandle,
    getBounds,
    isHitRotationHandle,
    toLocalCoords,
    getOffsetAngle,
    loadImage,
    resize,
    diff
} from "./utils.js";

//CONSTANTS

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const allToolInputs = document.querySelectorAll("input[name='tool']");
const strokeSlider = document.getElementById("stroke-width");
const opacitySlider = document.getElementById("opacity");
const colorSelector = document.getElementById("color-selector");
const themeToggleBtn = document.getElementById("theme-toggle");
const clearBtn = document.getElementById("clear-tool");
const colorDisplay = document.getElementById("color-display")
const fillModeBtn = document.getElementById("paint-fill");
const strokeModeBtn = document.getElementById("paint-stroke");
const layerUpBtn = document.getElementById('layer-up')
const layerDownBtn = document.getElementById('layer-down')

//ENUMS
const canvasStates = {
    IDLE: 'IDLE',
    EDITING: 'EDITING'
}
const tools = {
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

const paintModes = {
    FILL: 'fill',
    STROKE: 'stroke'
}

const themes = {
    DARK: 'dark',
    LIGHT: 'light'
}

// STATE VARIABLES

//CANVAS STATE
let elements = [];
let selectedElements = [];
let currentCanvasState = canvasStates.IDLE;
let currentTool = tools.NONE;
let movement = new Map();
let resizeHandle = null;
let eraser = {
    erasing: false,
    toBeErased: []
}
let rotation = {
    rotating: false,
    startMouseAngle: 0,
    startElementAngle: 0,
};
let activeTextBox = {
    element: null,
    before: "",
    after: "",
};

// UNDO/REDO
let undoStack = []
let redoStack = []

//COSMETIC STATE
let currentColor = "#0C8EF4";
let currentWidth = 15;
let currentOpacity = 0.6;
let currentTheme = themes.LIGHT;
let currentPaintMode = paintModes.STROKE;

// RENDER

const renderElement = (el, ctx) => {
    if (el.tool === tools.RECT) return renderRect(el, ctx);
    if (el.tool === tools.LINE) return renderLine(el, ctx);
    if (el.tool === tools.CIRCLE) return renderCircle(el, ctx);
    if (el.tool === tools.TRIANGLE) return renderTriangle(el, ctx);

    if (el.tool === tools.BRUSH) return renderSolidBrush(el, ctx);
    if (el.tool === tools.DASHED_BRUSH) return renderDashedBrush(el, ctx);
    if (el.tool === tools.DOTTED_BRUSH) return renderDottedBrush(el, ctx);

    if (el.tool === tools.IMAGE) return renderImage(el, ctx);
    if (el.tool === tools.TEXT) return renderTextbox(el, ctx, activeTextBox);
};

const render = (elements, selectedElements, ctx) => {
    elements.forEach(el => {
        let { x1, y1, x2, y2 } = getBounds(el)
        let cx
        let cy

        if (el.tool === tools.CIRCLE) {
            cx = el.x1
            cy = el.y1
        } else {
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2
        }

        ctx.save()

        ctx.translate(cx, cy)
        ctx.rotate(el.angle)
        ctx.translate(-cx, -cy)
        renderElement(el, ctx);

        ctx.restore()
    })

    selectedElements.forEach(el => {
        let { x1, y1, x2, y2 } = getBounds(el)
        let cx
        let cy

        if (el.tool === tools.CIRCLE) {
            cx = el.x1
            cy = el.y1
        } else {
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2
        }

        ctx.save()

        ctx.translate(cx, cy)
        ctx.rotate(el.angle)
        ctx.translate(-cx, -cy)

        renderSelectionUI(getBounds(el), ctx, {
            showHandles: true,
            color: "rgb(12, 142, 244)",
            padding: 6,
            handleSize: 8,
        })
        renderSelectionUI(getBounds(el), ctx, {
            roatationHandle: true,
        })

        ctx.restore()
    });
    ctx.font = "0px"
}

// SIZE CANVAS TO MATCH CSS DISPLAY SIZE
const resizeCanvas = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    render(elements, selectedElements, ctx);
};
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
window.addEventListener("resize", resizeCanvas);


// SELECTION 

const isHit = (el, x, y) => {

    const { lx, ly } = toLocalCoords(el, x, y);

    if (el.tool === tools.RECT) return hitTestRect(el, lx, ly);
    if (el.tool === tools.LINE) return hitTestLine(el, lx, ly);
    if (el.tool === tools.CIRCLE) return hitTestCircle(el, lx, ly);
    if (el.tool === tools.TRIANGLE) return hitTestTriangle(el, lx, ly);

    if (el.tool === tools.BRUSH || el.tool === tools.DASHED_BRUSH || el.tool === tools.DOTTED_BRUSH) return hitTestBrush(el, lx, ly);

    if (el.tool === tools.IMAGE) return hitTestImage(el, lx, ly);
    if (el.tool === tools.TEXT) return hitTestTextbox(el, lx, ly);
}

const getSelectedElements = (elements, x, y) => {
    let selected = [];

    elements.forEach(el => {
        if (isHit(el, x, y)) selected.push(el);
    })

    return selected;
}

//MOVEMENT

const getOffsets = (selectedElements, x, y) => {
    selectedElements.forEach(el => {
        if (el.tool === tools.BRUSH || el.tool === tools.DASHED_BRUSH || el.tool === tools.DOTTED_BRUSH) {
            let offsets = [];
            el.points.forEach((p) => {
                offsets.push({ x: p.x - x, y: p.y - y });
            });
            movement.set(el, offsets);
        } else {
            let offsetX = x - el.x1;
            let offsetY = y - el.y1;
            movement.set(el, { offsetX, offsetY });
        }
    })
}

const moveElement = (el, dx, dy) => {
    if (el.tool === tools.RECT) return moveRect(el, dx, dy);
    if (el.tool === tools.LINE) return moveLine(el, dx, dy);
    if (el.tool === tools.CIRCLE) return moveCircle(el, dx, dy);
    if (el.tool === tools.TRIANGLE) return moveTriangle(el, dx, dy);

    if (el.tool === tools.BRUSH || el.tool === tools.DASHED_BRUSH || el.tool === tools.DOTTED_BRUSH) return moveBrush(el, dx, dy); // moveBrush imported from solid-brush

    if (el.tool === tools.IMAGE) return moveImage(el, dx, dy);
    if (el.tool === tools.TEXT) return moveTextbox(el, dx, dy);
};

const move = (selectedElements, x, y) => {
    selectedElements.forEach(el => {
        const data = movement.get(el);

        if (
            el.tool === tools.BRUSH ||
            el.tool === tools.DASHED_BRUSH ||
            el.tool === tools.DOTTED_BRUSH
        ) {
            // using first point as reference
            const first = el.points[0];
            const offset = data[0];

            const dx = x + offset.x - first.x;
            const dy = y + offset.y - first.y;

            moveBrush(el, dx, dy);

        } else {
            const { offsetX, offsetY } = data;

            const dx = x - offsetX - el.x1;
            const dy = y - offsetY - el.y1;

            moveElement(el, dx, dy);
        }
    });
};

// RESIZE

const resizeElement = (el, handle, x, y) => {
    if (el.tool === tools.RECT) return resize(el, handle, x, y);
    if (el.tool === tools.LINE) return resize(el, handle, x, y);
    if (el.tool === tools.CIRCLE) return resize(el, handle, x, y);
    if (el.tool === tools.TRIANGLE) return resize(el, handle, x, y);
    if (el.tool === tools.IMAGE) return resize(el, handle, x, y);

    if (el.tool === tools.BRUSH || el.tool === tools.DASHED_BRUSH || el.tool === tools.DOTTED_BRUSH) return;
    if (el.tool === tools.TEXT) return;
}

// ELEMENT CREATION 

const createElement = (x, y) => {
    const baseStyle = {
        color: currentColor,
        opacity: currentOpacity,
        paintMode: currentPaintMode,
        width: currentWidth
    };

    if (
        currentTool === tools.RECT ||
        currentTool === tools.LINE ||
        currentTool === tools.CIRCLE ||
        currentTool === tools.TRIANGLE
    ) {
        return {
            x1: x, y1: y, x2: x, y2: y,
            style: baseStyle,
            angle: 0,
            tool: currentTool,
        };
    }

    if (
        currentTool === tools.BRUSH ||
        currentTool === tools.DASHED_BRUSH ||
        currentTool === tools.DOTTED_BRUSH
    ) {
        return {
            points: [{ x, y }],
            style: baseStyle,
            angle: 0,
            tool: currentTool
        };
    }

    if (currentTool === tools.IMAGE) {
        return {
            x1: x, y1: y, x2: x, y2: y,
            tool: currentTool,
            angle: 0,
            state: "placeholder",
            data: {
                url: "",
                img: null,
            }
        };
    }

    if (currentTool === tools.TEXT) {
        return {
            x1: x, y1: y, x2: x, y2: y,
            tool: currentTool,
            state: "placeholder",
            angle: 0,
            style: {
                color: currentColor,
                opacity: currentOpacity,
            },
            data: {
                text: ""
            }
        };
    }

    return null;
}

//ERASER 

const eraserMouseDownHandler = (eraser) => {
    eraser.erasing = true
    eraser.toBeErased = []
}

const eraserMouseMoveHandler = (eraser, elements, x, y) => {
    if (!eraser.erasing) return
    const toBeErasedHistory = eraser.toBeErased
    eraser.toBeErased = []

    elements.forEach(el => {
        if (isHit(el, x, y)) {
            eraser.toBeErased.push(el)
        }
    })

    let { onlyA, onlyB } = diff(toBeErasedHistory, eraser.toBeErased)

    onlyA.forEach(el => {
        el.style.opacity *= 2;
    });
    onlyB.forEach(el => {
        el.style.opacity *= 0.5;
    });

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    render(elements, selectedElements, ctx);
}

const eraserMouseUpHandler = (eraser, elements) => {
    if (!eraser.erasing) return

    for (let i = elements.length - 1; i >= 0; i--) {
        for (let j = 0; j < eraser.toBeErased.length; j++) {
            if (elements[i] === eraser.toBeErased[j]) {
                elements.splice(i, 1)
                break
            }
        }
    }

    eraser.erasing = false
    eraser.toBeErased = []

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    render(elements, selectedElements, ctx);
}

// EVENTS

strokeSlider.addEventListener("input", (e) => {
    currentWidth = Number(e.target.value);
});
opacitySlider.addEventListener("input", (e) => {
    currentOpacity = Number(e.target.value);
});
colorSelector.addEventListener("input", (e) => {
    currentColor = e.target.value;
    if (colorDisplay) colorDisplay.innerText = currentColor
});
fillModeBtn.addEventListener("change", () => {
    currentPaintMode = paintModes.FILL;
});
strokeModeBtn.addEventListener("change", () => {
    currentPaintMode = paintModes.STROKE;
});
themeToggleBtn.addEventListener("click", () => {
    currentTheme = currentTheme === themes.DARK ? themes.LIGHT : themes.DARK;
    applyTheme(currentTheme);
    localStorage.setItem("scribbleTheme", currentTheme);
});
clearBtn.addEventListener("click", () => {
    if (elements.length === 0) return;
    updateHistory();
    elements = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.setItem("scribbleElements", JSON.stringify(elements));
});
allToolInputs.forEach(i => {
    i.addEventListener("change", (e) => {
        clearSelection();
        currentTool = e.target.id;
    });
});

canvas.addEventListener("mousedown", (e) => {
    if (currentTool === tools.NONE) return;

    if (currentTool === tools.ERASER) {
        updateHistory();
        currentCanvasState = canvasStates.EDITING;
        eraserMouseDownHandler(eraser);
        return;
    }

    if (activeTextBox.element) {
        if (!isHit(activeTextBox.element, e.clientX, e.clientY)) {
            updateHistory();
            activeTextBox = defocusTextbox(activeTextBox.element, ctx, activeTextBox);

            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            render(elements, selectedElements, ctx)
            return
        }
    }

    updateHistory();
    currentCanvasState = canvasStates.EDITING;

    if (currentTool === tools.SELECTION) {
        resizeHandle = null;
        rotation.rotating = false;

        if (selectedElements.length === 1) {
            const el = selectedElements[0];
            const { lx, ly } = toLocalCoords(el, e.clientX, e.clientY);

            resizeHandle = getResizeHandle(lx, ly, getBounds(el));
            rotation.rotating = isHitRotationHandle(el, lx, ly);

            if (resizeHandle || rotation.rotating) {
                if (rotation.rotating) {
                    rotation.startMouseAngle = getOffsetAngle(el, e.clientX, e.clientY);
                    rotation.startElementAngle = el.angle;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                render(elements, selectedElements, ctx);
                return;
            }
        }

        selectedElements = getSelectedElements(elements, e.clientX, e.clientY);

        getOffsets(selectedElements, e.clientX, e.clientY);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        render(elements, selectedElements, ctx);
        return;
    }
    else {
        const el = createElement(e.clientX, e.clientY);
        if (el) elements.push(el);
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (currentCanvasState !== canvasStates.EDITING) return;

    if (currentTool === tools.ERASER) {
        eraserMouseMoveHandler(eraser, elements, e.clientX, e.clientY)
        return;
    }

    if (currentTool === tools.SELECTION) {
        if (resizeHandle) {
            const el = selectedElements[0];
            const { lx, ly } = toLocalCoords(el, e.clientX, e.clientY);
            resizeElement(el, resizeHandle, lx, ly);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            render(elements, selectedElements, ctx);
            return;
        }
        if (rotation.rotating) {
            const el = selectedElements[0];

            let currentMouseAngle = getOffsetAngle(el, e.clientX, e.clientY);
            el.angle =
                rotation.startElementAngle +
                (currentMouseAngle - rotation.startMouseAngle);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            render(elements, selectedElements, ctx);
            return;
        }

        move(selectedElements, e.clientX, e.clientY);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        render(elements, selectedElements, ctx);
        return;
    }

    let el = elements[elements.length - 1];

    if (el.tool === tools.BRUSH || el.tool === tools.DASHED_BRUSH || el.tool === tools.DOTTED_BRUSH) {
        el.points.push({ x: e.clientX, y: e.clientY });
    } else {
        el.x2 = e.clientX;
        el.y2 = e.clientY;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    render(elements, selectedElements, ctx);
});

canvas.addEventListener("mouseup", () => {
    if (currentTool === tools.SELECTION) {
        currentCanvasState = canvasStates.IDLE;
        resizeHandle = null;
        movement.clear();
        rotation = {
            rotating: false,
            startMouseAngle: 0,
            startElementAngle: 0,
        };

        localStorage.setItem("scribbleElements", JSON.stringify(elements));
        return;
    }

    if (currentTool === tools.ERASER) {
        eraserMouseUpHandler(eraser, elements);
        currentCanvasState = canvasStates.IDLE;   // add this
        localStorage.setItem("scribbleElements", JSON.stringify(elements));
        return;                                   // avoid falling through
    }

    let el = elements[elements.length - 1];

    if (el.tool === tools.IMAGE) {
        currentCanvasState = canvasStates.IDLE;
        fetchImage(el).then(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            render(elements, selectedElements, ctx);
            localStorage.setItem("scribbleElements", JSON.stringify(elements));
        });
        return;
    }

    if (el.tool === tools.TEXT && el.state === "placeholder") {
        currentCanvasState = canvasStates.IDLE;
        resizeHandle = null;
        movement.clear();
        rotation = {
            rotating: false,
            startMouseAngle: 0,
            startElementAngle: 0,
        };

        activeTextBox = textboxMouseupHandler(el);
        return;
    }

    currentCanvasState = canvasStates.IDLE;
    resizeHandle = null;
    movement.clear();
    rotation = {
        rotating: false,
        startMouseAngle: 0,
        startElementAngle: 0,
    };

    localStorage.setItem("scribbleElements", JSON.stringify(elements));
});

const fetchImages = (els) => {
    let promises = [];
    els.forEach(el => {
        if (el.tool === tools.IMAGE && el.data.url)
            promises.push(loadImage(el.data.url).then(img => { el.data.img = img; }));
    });
    return Promise.all(promises);
};

addEventListener("keydown", (e) => {
    // tool shortcuts 1 to N, 0 for selection tool
    if (!activeTextBox.element && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const n = Number(e.key);
        if (e.key === "s") {
            const target = document.getElementById(tools.SELECTION)
            if (target) {
                target.checked = true;
                clearSelection();
                currentTool = tools.SELECTION
                return;
            }
        } else if (e.key === 'e') {
            const target = document.getElementById('eraser-tool')
            if (target) {
                target.checked = true;
                clearSelection();
                currentTool = tools.ERASER
                return;
            }
        } else if (Number.isInteger(n) && n >= 1) {
            const toolInputs = document.querySelectorAll("#sidebar-tools input[name='tool']");
            if (n <= toolInputs.length) {
                const target = toolInputs[n - 1];
                if (target) {
                    target.checked = true;
                    clearSelection();
                    currentTool = target.id;
                    return;
                }
            }
        }
    }

    // Undo
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        if (!undoStack.length) return;
        e.preventDefault();
        redoStack.push(JSON.parse(JSON.stringify(elements)));
        elements = undoStack.pop();
        selectedElements = [];
        fetchImages(elements).then(() => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            render(elements, selectedElements, ctx);
            localStorage.setItem("scribbleElements", JSON.stringify(elements));
        });
        return;
    }

    // Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        if (!redoStack.length) return;
        e.preventDefault();
        undoStack.push(JSON.parse(JSON.stringify(elements)));
        elements = redoStack.pop();
        selectedElements = [];
        fetchImages(elements).then(() => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            render(elements, selectedElements, ctx);
            localStorage.setItem("scribbleElements", JSON.stringify(elements));
        });
        return;
    }

    // Textbox input
    if (!activeTextBox.element) return;
    textboxKeydownHandler(e.key, activeTextBox, ctx);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    render(elements, selectedElements, ctx);
});

// Cursor style
canvas.addEventListener("mousemove", (e) => {
    if (currentTool !== tools.SELECTION) {
        canvas.style.cursor = "default";
        return;
    }
    if (selectedElements.length === 0) {
        canvas.style.cursor = "default";
        return;
    }
    if (selectedElements.length >= 1) {
        let { lx, ly } = toLocalCoords(selectedElements[0], e.clientX, e.clientY)
        let handle = getResizeHandle(
            lx,
            ly,
            getBounds(selectedElements[0]),
        );
        canvas.style.cursor = handle && handle !== "REVERT" ? "nwse-resize" : "move";
    }
});

// INITAL LOADING FROM LOCAL STORAGE

const savedElements = localStorage.getItem("scribbleElements");

if (savedElements) {
    elements = JSON.parse(savedElements);
    fetchImages(elements).then(() => render(elements, selectedElements, ctx));
}

const clearSelection = () => {
    if (activeTextBox.element) {
        activeTextBox.element.state = "typed";
        activeTextBox = {
            element: null,
            before: "",
            after: "",
        };
    }

    selectedElements = [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    render(elements, selectedElements, ctx);
}

const updateHistory = () => {
    const committed = elements.filter(el => el.state !== "placeholder");
    const snapshot = JSON.parse(JSON.stringify(committed));
    undoStack.push(snapshot);
    redoStack = [];
};

const applyTheme = (theme) => {
    document.body.dataset.theme = theme;
    themeToggleBtn.textContent = theme === themes.DARK ? themes.LIGHT : themes.DARK ;
};

const savedTheme = localStorage.getItem("scribbleTheme");
if (savedTheme === themes.DARK || savedTheme === themes.LIGHT) {
    currentTheme = savedTheme;
}
applyTheme(currentTheme);

if (strokeSlider) {
    currentWidth = Number(strokeSlider.value) || currentWidth;
}
if (opacitySlider) {
    currentOpacity = Number(opacitySlider.value) || currentOpacity;
}
if (colorSelector) {
    currentColor = colorSelector.value || currentColor;
}
if (colorDisplay) {
    colorDisplay.innerText = currentColor
}

if (fillModeBtn && fillModeBtn.checked) currentPaintMode = paintModes.FILL;
if (strokeModeBtn && strokeModeBtn.checked) currentPaintMode = paintModes.STROKE;

layerUpBtn.addEventListener("click", (e) => {
    if (selectedElements.length === 1) {
        const el = selectedElements[0]
        if (el === elements[elements.length - 1]) return
        let indexOfEl
        for (let i = 0; i < elements.length; i++) {
            if (elements[i] === el) {
                indexOfEl = i
                break
            }
        }
        let temp = el
        elements[indexOfEl] = elements[indexOfEl + 1]
        elements[indexOfEl + 1] = temp

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        render(elements, selectedElements, ctx);
    }
})

layerDownBtn.addEventListener("click", (e) => {
    if (selectedElements.length === 1) {
        const el = selectedElements[0]
        if (el === elements[0]) return
        let indexOfEl
        for (let i = 0; i < elements.length; i++) {
            if (elements[i] === el) {
                indexOfEl = i
                break
            }
        }
        let temp = el
        elements[indexOfEl] = elements[indexOfEl - 1]
        elements[indexOfEl - 1] = temp

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        render(elements, selectedElements, ctx);
    }
})