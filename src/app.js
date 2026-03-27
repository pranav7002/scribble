import {
    renderRect,
    hitTestRect,
    moveRect,
    resizeRect,
} from "./tools/rect.js";

import {
    renderLine,
    hitTestLine,
    moveLine,
    resizeLine,
} from "./tools/line.js";

import {
    renderCircle,
    hitTestCircle,
    moveCircle,
    resizeCircle,
} from "./tools/circle.js";

import {
    renderTriangle,
    hitTestTriangle,
    moveTriangle,
    resizeTriangle,
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
    resizeImage,
    fetchImage,
    refetchImages,
} from "./tools/image.js";

import {
    renderTextbox,
    hitTestTextbox,
    moveTextbox,
    resizeTextbox,
    textboxKeydownHandler,
    textboxMouseupHandler,
    defocusTextbox,
} from "./tools/textbox.js";

import {
    renderSelectionUI,
    getResizeHandle,
    getBounds,
    isHitRotationHandle,
    toLocalCoords
} from "./utils.js";

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
let resizeHandle = null;
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
    if (el.tool === "text-tool") return renderTextbox(el, ctx, activeTextBox);
};

const render = (elements, selectedElements, ctx) => {
    elements.forEach(el => {
        let { x1, y1, x2, y2 } = getBounds(el)
        let cx
        let cy

        if (el.tool === 'circle-tool') {
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

        if (el.tool === 'circle-tool') {
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

    if (el.tool === "rect-tool") return hitTestRect(el, lx, ly);
    if (el.tool === "line-tool") return hitTestLine(el, lx, ly);
    if (el.tool === "circle-tool") return hitTestCircle(el, lx, ly);
    if (el.tool === "triangle-tool") return hitTestTriangle(el, lx, ly);

    if (el.tool === "brush-tool" || el.tool === "dash-brush-tool" || el.tool === "dotted-brush-tool") return hitTestBrush(el, lx, ly);

    if (el.tool === "image-tool") return hitTestImage(el, lx, ly);
    if (el.tool === "text-tool") return hitTestTextbox(el, lx, ly);
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

    if (el.tool === "brush-tool" || el.tool === "dash-brush-tool" || el.tool === "dotted-brush-tool") return moveBrush(el, dx, dy); // moveBrush imported from solid-brush

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
            angle: 0,
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
            angle: 0,
            tool: currentTool
        };
    }

    if (currentTool === "image-tool") {
        return {
            x1: x, y1: y, x2: x, y2: y,
            tool: currentTool,
            angle: 0,
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
            state: "placeholder",
            angle: 0,
            style: {
                color: currentColor,
                opacity: currentOpacity,
            },
            state: "placeholder",
            data: {
                text: ""
            }
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
allToolInputs.forEach(i => {
    i.addEventListener("change", (e) => {
        clearSelection();
        currentTool = e.target.id;
    });
});

canvas.addEventListener("mousedown", (e) => {
    if (currentTool === "NONE") return;

    if (activeTextBox.element) {
        if (!isHit(activeTextBox.element, e.clientX, e.clientY)) {
            activeTextBox = defocusTextbox(activeTextBox.element, ctx, activeTextBox);

            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            render(elements, selectedElements, ctx)
            return
        }
    }

    currentCanvasState = "EDITING";

    if (currentTool === "selection-tool") {
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
        elements.push(el);
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (currentCanvasState !== "EDITING") return;

    if (currentTool === "selection-tool") {
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

    if (el.tool === "brush-tool" || el.tool === "dash-brush-tool" || el.tool === "dotted-brush-tool") {
        el.points.push({ x: e.clientX, y: e.clientY });
    } else {
        el.x2 = e.clientX;
        el.y2 = e.clientY;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    render(elements, selectedElements, ctx);
});

canvas.addEventListener("mouseup", () => {
    if (currentTool === "selection-tool") {
        currentCanvasState = "IDLE";
        resizeHandle = null;
        movement.clear();
        rotation = {
            rotating: false,
            startMouseAngle: 0,
            startElementAngle: 0,
        };
        return;
    }

    let el = elements[elements.length - 1];
    if (el.tool === "image-tool") {
        fetchImage(el).then(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            render(elements, selectedElements, ctx);
        });
    } else if (el.tool === "text-tool" && el.state === "placeholder") {
        activeTextBox = textboxMouseupHandler(el)
    }

    currentCanvasState = "IDLE";
    resizeHandle = null;
    movement.clear();
    rotation = {
        rotating: false,
        startMouseAngle: 0,
        startElementAngle: 0,
    };
    localStorage.setItem("scribbleElements", JSON.stringify(elements));
});

addEventListener("keydown", (e) => {
    if (!activeTextBox.element) return;

    textboxKeydownHandler(e.key, activeTextBox, ctx);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    render(elements, selectedElements, ctx);
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

    let promises = [];

    elements.forEach((el) => {
        if (el.tool === "image-tool" && el.data.url) {
            promises.push(
                refetchImages(el).then((bitmap) => {
                    el.data.bitmap = bitmap;
                }),
            );
        }
    });

    Promise.all(promises).then(() => render(elements, selectedElements, ctx));
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

const getOffsetAngle = (el, x, y) => {
    let { x1, y1, x2, y2 } = getBounds(el)
    let cx
    let cy

    if (el.tool === 'circle-tool') {
        cx = el.x1
        cy = el.y1
    } else {
        cx = (x1 + x2) / 2
        cy = (y1 + y2) / 2
    }

    return Math.atan2(y - cy, x - cx)
}