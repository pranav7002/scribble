import {
    renderRect,
    hitTestRect,
    moveRect,
    resizeRect,
    getBoundsRect,
} from "./tools/rect";

import {
    renderLine,
    hitTestLine,
    moveLine,
    resizeLine,
    getBoundsLine,
} from "./tools/line";

import {
    renderCircle,
    hitTestCircle,
    moveCircle,
    resizeCircle,
    getBoundsCircle,
} from "./tools/circle";

import {
    renderTriangle,
    hitTestTriangle,
    moveTriangle,
    resizeTriangle,
    getBoundsTriangle,
} from "./tools/triangle";

import {
    renderSolidBrush,
    hitTestBrush,
    moveBrushPoint,
    getBoundsBrush,
} from "./tools/solid-brush";

import {
    renderDashedBrush,
} from "./tools/dashed-brush";

import {
    renderDottedBrush,
} from "./tools/dotted-brush";

import {
    renderImage,
    hitTestImage,
    moveImage,
    resizeImage,
    getBoundsImage,
    fetchImage,
    refectchImages,
} from "./tools/image";

import {
    renderTextbox,
    hitTestTextbox,
    moveTextbox,
    resizeTextbox,
    getBoundsTextbox,
    textboxKeydownHandler,
    textboxMouseupHandler,
    defocusTextbox,
} from "./tools/textbox";

import {
    renderSelectionUI,
    getResizeHandle,
    dist,
    area,
} from "./utils";

//CONSTANTS

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const allToolInputs = document.querySelectorAll("input[type='radio']");
const allColors = document.querySelectorAll(".color");
const allOpacity = document.querySelectorAll(".opacity-btn");
const strokeSlider = document.getElementById("stroke");
const clearBtn = document.getElementById("clear-tool");

// STATE VARIABLES

//CANVAS STATE
let elements = [];
let selectedElements = [];
let currentCanvasState = "IDLE";
let currentTool = "NONE";
let movement = new Map();
let resizeHandle
let activeTextBox = {
    element: null,
    before: "",
    after: "",
};

//COSMETIC STATE
let currentColor = "#0C8EF4";
let currentWidth = 15;
let currentOpacity = 0.6;

// RENDER

const renderElement = (el, ctx) => {
    if (el.tool === "rect-tool") return renderRect(el, ctx);
    if (el.tool === "line-tool") return renderLine(el, ctx);
    if (el.tool === "circle-tool") return renderCircle(el, ctx);
    if (el.tool === "triangle-tool") return renderTriangle(el, ctx);

    if (el.tool === "brush-tool") return renderSolidBrush(el, ctx);
    if (el.tool === "dash-brush-tool") return renderDashedBrush(el, ctx);
    if (el.tool === "dotted-brush-tool") return renderDottedBrush(el, ctx);

    if (el.tool === "image-tool") return renderImage(el, ctx);
    if (el.tool === "text-tool") return renderTextbox(el, ctx);
};

const render = (elements, selectedElements, ctx) => {
    elements.forEach(el => {
        renderElement(el);
    })

    selectedElements.forEach(el => {
        renderSelectionUI(el, ctx, {
            showHandles: true,
            color: "rgb(12, 142, 244)",
            padding: 6,
            handleSize: 8,
        })
    });
}


// SELECTION 

const isHit = (el, x, y) => {
    if (el.tool === "rect-tool") return hitTestRect(el, x, y);
    if (el.tool === "line-tool") return hitTestLine(el, x, y);
    if (el.tool === "circle-tool") return hitTestCircle(el, x, y);
    if (el.tool === "triangle-tool") return hitTestTriangle(el, x, y);

    if (el.tool === "brush-tool" || el.tool === "dash-brush-tool" || el.tool === "dotted-brush-tool") return hitTestBrush(el, x, y);

    if (el.tool === "image-tool") return hitTestImage(el, x, y);
    if (el.tool === "text-tool") return hitTestTextbox(el, x, y);
}

const getSelectedElements = (elements, x, y) => {
    let selected = []

    elements.forEach(el => {
        if (isHit(el, x, y)) selected.push(el)
    })

    return selected
};

//MOVEMENT

const getOffsets = (selectedElements, x, y) => {
    selectedElements.forEach(el => {
        if (el.tool === "brush-tool" || el.tool === "dash-brush-tool" || el.tool === "dotted-brush-tool") {
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
    if (el.tool === "rect-tool") return moveRect(el, dx, dy);
    if (el.tool === "line-tool") return moveLine(el, dx, dy);
    if (el.tool === "circle-tool") return moveCircle(el, dx, dy);
    if (el.tool === "triangle-tool") return moveTriangle(el, dx, dy);

    if (el.tool === "brush-tool" || el.tool === "dash-brush-tool" || el.tool === "dotted-brush-tool") return moveBrush(el, dx, dy);

    if (el.tool === "image-tool") return moveImage(el, dx, dy);
    if (el.tool === "text-tool") return moveTextbox(el, dx, dy);
};

const move = (selectedElements, x, y) => {
    selectedElements.forEach(el => {
        const data = movement.get(el);

        if (
            el.tool === "brush-tool" ||
            el.tool === "dash-brush-tool" ||
            el.tool === "dotted-brush-tool"
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
    if (el.tool === "rect-tool") return resizeRect(el, handle, x, y);
    if (el.tool === "line-tool") return resizeLine(el, handle, x, y);
    if (el.tool === "circle-tool") return resizeCircle(el, handle, x, y);
    if (el.tool === "triangle-tool") return resizeTriangle(el, handle, x, y);
    if (el.tool === "image-tool") return resizeImage(el, handle, x, y);

    if (el.tool === "brush-tool" || el.tool === "dash-brush-tool" || el.tool === "dotted-brush-tool") return;
    if (el.tool === "text-tool") return;
}

// ELEMENT CREATION 

const createElement = (x, y) => {
    const baseStyle = {
        color: currentColor,
        opacity: currentOpacity,
        fill: null,
        width: currentWidth
    };

    if (
        currentTool === "rect-tool" ||
        currentTool === "line-tool" ||
        currentTool === "circle-tool" ||
        currentTool === "triangle-tool"
    ) {
        return {
            x1: x, y1: y, x2: x, y2: y,
            style: baseStyle,
            tool: currentTool,
        };
    }

    if (
        currentTool === "brush-tool" ||
        currentTool === "dash-brush-tool" ||
        currentTool === "dotted-brush-tool"
    ) {
        return {
            points: [{ x, y }],
            style: baseStyle,
            tool: currentTool
        };
    }

    if (currentTool === "image-tool") {
        return {
            x1: x, y1: y, x2: x, y2: y,
            tool: currentTool,
            state: "placeholder",
            data: {
                url: "",
                bitmap: null,
            }
        };
    }

    if (currentTool === "text-tool") {
        return {
            x1: x, y1: y, x2: x, y2: y,
            tool: currentTool,
            style: {
                color: currentColor,
                opacity: currentOpacity,
            },
            state: "placeholder",
        };
    }

    return null;
}


// EVENTS

allColors.forEach((color) => {
    color.addEventListener("click", (e) => {
        currentColor = getComputedStyle(e.target).backgroundColor;
    });
});

allOpacity.forEach((opacity) => {
    opacity.addEventListener("click", (e) => {
        currentOpacity = Number(e.target.dataset.opacity);
    });
});

strokeSlider.addEventListener("input", (e) => {
    currentWidth = Number(e.target.value);
});

clearBtn.addEventListener("click", () => {
    if (elements.length === 0) return;
    elements = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.setItem("scribbleElements", JSON.stringify(elements));
});

allToolInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
        clearSelection();
        currentTool = e.target.id;
        if (
            e.target.id === "brush-tool" ||
            e.target.id === "dash-brush-tool" ||
            e.target.id === "dotted-brush-tool"
        ) {
            currentToolCategory = "FREEHAND";
        } else if (e.target.id === "selection-tool") {
            currentToolCategory = "SELECTION";
        } else if (e.target.id === "image-tool") {
            currentToolCategory = "IMAGE";
        } else if (e.target.id === "text-tool") {
            currentToolCategory = "TEXT";
        } else {
            currentToolCategory = "SHAPE";
        }
        console.log(currentTool);
    });
});

canvas.addEventListener("mousedown", (e) => {
    if (currentTool === "NONE") return;

    if (activeTextBox.element) {
        let corners = getDiagonalCorners(activeTextBox.element);
        if (
            !isTextBoxHit(
                corners.x1,
                corners.y1,
                corners.x2,
                corners.y2,
                e.clientX,
                e.clientY,
            )
        ) {
            activeTextBox.element.state = "typed";
            let el = activeTextBox.element;
            let { x1, y1, x2, y2 } = getDiagonalCorners(el);
            ctx.font = `${y2 - y1 - 2}px Pixelify Sans`;
            let width = ctx.measureText(el.text).width;
            el.x2 = x1 + width;
            activeTextBox = {
                element: null,
                before: "",
                after: "",
            };
            ctx.font = "0px";
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            render();
            return;
        }
    }

    currentCanvasState = "EDITING";

    if (currentTool === "selection-tool") {
        resizingKey = "REVERT";
        if (selectedElements.length === 1) {
            resizingKey = getResizeHandle(
                e.clientX,
                e.clientY,
                getBounds(selectedElements[0]),
            );
        }

        if (!resizingKey) {
            selectedElements = getSelectedElements(e);
            selectedElements.forEach((el) => {
                if (
                    el.toolCategory === "SHAPE" ||
                    el.toolCategory === "TEXT" ||
                    el.toolCategory === "IMAGE"
                ) {
                    let offsetX = e.clientX - el.x1;
                    let offsetY = e.clientY - el.y1;
                    movement.set(el, { offsetX, offsetY });
                } else if (el.toolCategory === "FREEHAND") {
                    let offsets = [];
                    el.points.forEach((p) => {
                        offsets.push({ x: p.x - e.clientX, y: p.y - e.clientY });
                    });
                    movement.set(el, offsets);
                }
            });
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        render();
        return;
    } else if (currentToolCategory === "SHAPE") {
        elements.push({
            x1: e.clientX,
            y1: e.clientY,
            x2: e.clientX,
            y2: e.clientY,
            width: currentWidth,
            color: currentColor,
            opacity: currentOpacity,
            tool: currentTool,
            toolCategory: currentToolCategory,
        });
    } else if (currentToolCategory === "FREEHAND") {
        elements.push({
            x1: e.clientX,
            y1: e.clientY,
            points: [{ x: e.clientX, y: e.clientY }],
            width: currentWidth,
            color: currentColor,
            opacity: currentOpacity,
            tool: currentTool,
            toolCategory: currentToolCategory,
        });
    } else if (currentToolCategory === "IMAGE") {
        elements.push({
            x1: e.clientX,
            y1: e.clientY,
            x2: e.clientX,
            y2: e.clientY,
            url: "",
            bitmap: "",
            state: "placeholder",
            tool: currentTool,
            toolCategory: currentToolCategory,
        });
    } else if (currentToolCategory === "TEXT") {
        elements.push({
            x1: e.clientX,
            y1: e.clientY,
            x2: e.clientX,
            y2: e.clientY,
            text: "",
            color: currentColor,
            state: "placeholder",
            tool: currentTool,
            toolCategory: currentToolCategory,
        });
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (currentCanvasState !== "EDITING") return;

    if (currentTool === "selection-tool") {
        if (resizingKey !== "REVERT") {
            resizeElement(el, resizeHandle, e.clientX, e.clientY)
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            render();
            return;
        }

        selectedElements.forEach((el) => {
            if (
                el.toolCategory === "SHAPE" ||
                el.toolCategory === "TEXT" ||
                el.toolCategory === "IMAGE"
            ) {
                let { offsetX, offsetY } = movement.get(el);
                let dx = e.clientX - el.x1 - offsetX;
                let dy = e.clientY - el.y1 - offsetY;
                el.x1 += dx;
                el.x2 += dx;
                el.y1 += dy;
                el.y2 += dy;
            } else if (el.toolCategory === "FREEHAND") {
                let offsets = movement.get(el);
                for (let i = 0; i < el.points.length; i++) {
                    el.points[i].x = e.clientX + offsets[i].x;
                    el.points[i].y = e.clientY + offsets[i].y;
                }
            }
        });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        render();
        return;
    }

    let el = elements[elements.length - 1];
    if (currentToolCategory === "SHAPE") {
        el.x2 = e.clientX;
        el.y2 = e.clientY;
    } else if (currentToolCategory === "FREEHAND") {
        el.points.push({ x: e.clientX, y: e.clientY });
    } else if (currentToolCategory === "IMAGE") {
        el.x2 = e.clientX;
        el.y2 = e.clientY;
    } else if (currentToolCategory === "TEXT") {
        el.x2 = e.clientX;
        el.y2 = e.clientY;
        // let { x1, y1, x2, y2 } = getDiagonalCorners(x1, y1, clientX, clientY)
        // el.x1 = x1
        // el.x2 = x2
        // el.y1 = y1
        // el.y2 = y2
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    render();
});

canvas.addEventListener("mouseup", () => {
    if (currentTool === "selection-tool") { // ← ADD THIS
        currentCanvasState = "IDLE";
        resizingKey = "REVERT";
        movement.clear();
        return;
    }

    let el = elements[elements.length - 1];
    if (el.tool === "image-tool") {
        el.state = "image";
        let url = `https://picsum.photos/${Math.abs(el.x2 - el.x1)}/${Math.abs(el.y2 - el.y1)}`;
        el.url = url;

        loadImage(el.url).then((bitmap) => {
            el.bitmap = bitmap;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            render();
        });
    } else if (el.tool === "text-tool" && el.state === "placeholder") {
        el.state = "typing";
        activeTextBox = {
            element: el,
            before: el.text,
            after: "",
        };
    }

    currentCanvasState = "IDLE";
    resizingKey = "REVERT";
    movement.clear();
    localStorage.setItem("scribbleElements", JSON.stringify(elements));
});

// Cursor style
canvas.addEventListener("mousemove", (e) => {
    if (currentTool !== "selection-tool") {
        canvas.style.cursor = "default";
        return;
    }
    if (selectedElements.length === 0) {
        canvas.style.cursor = "default";
        return;
    }
    let handle = getResizeHandle(
        e.clientX,
        e.clientY,
        getBounds(selectedElements[0]),
    );
    canvas.style.cursor = handle !== "REVERT" ? "nwse-resize" : "move";
});

addEventListener("keydown", (e) => {
    if (!activeTextBox.element) return;
    let before = activeTextBox.before;
    let after = activeTextBox.after;

    let maxWidth = Math.abs(activeTextBox.element.x2 - activeTextBox.element.x1);

    if (e.key.length === 1) {
        let newText = activeTextBox.element.text + e.key;
        ctx.font = `${activeTextBox.element.y2 - activeTextBox.element.y1 - 2}px Pixelify Sans`;
        let width = ctx.measureText(newText).width;
        if (width <= maxWidth) {
            before = before + e.key;
        }
    } else if (e.key === "Backspace") {
        before = before.slice(0, before.length - 1);
    } else if (e.key === "ArrowRight") {
        before = before + after.slice(0, 1);
        after = after.slice(1);
    } else if (e.key === "ArrowLeft") {
        after = before.slice(before.length - 1) + after;
        before = before.slice(0, before.length - 1);
    }

    activeTextBox.element.text = before + after;

    activeTextBox.before = before;
    activeTextBox.after = after;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    render();
});

// INITAL LOADING FROM LOCAL STORAGE

const savedElements = localStorage.getItem("scribbleElements");

if (savedElements) {
    elements = JSON.parse(savedElements);

    let promises = [];

    elements.forEach((el) => {
        if (el.toolCategory === "IMAGE" && el.url) {
            promises.push(
                loadImage(el.url).then((bitmap) => {
                    el.bitmap = bitmap;
                }),
            );
        }
    });

    Promise.all(promises).then(() => render());
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
    render();
};