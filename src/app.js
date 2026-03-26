import {
    renderRect,
    hitTestRect,
    moveRect,
    resizeRect,
    getBoundsRect,
} from "./tools/rect.js";

import {
    renderLine,
    hitTestLine,
    moveLine,
    resizeLine,
    getBoundsLine,
} from "./tools/line.js";

import {
    renderCircle,
    hitTestCircle,
    moveCircle,
    resizeCircle,
    getBoundsCircle,
} from "./tools/circle.js";

import {
    renderTriangle,
    hitTestTriangle,
    moveTriangle,
    resizeTriangle,
    getBoundsTriangle,
} from "./tools/triangle.js";

import {
    renderSolidBrush,
    hitTestBrush,
    moveBrush,
    getBoundsBrush,
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
    getBoundsImage,
    fetchImage,
    refetchImages,
} from "./tools/image.js";

import {
    renderTextbox,
    hitTestTextbox,
    moveTextbox,
    resizeTextbox,
    getBoundsTextbox,
    textboxKeydownHandler,
    textboxMouseupHandler,
    defocusTextbox,
} from "./tools/textbox.js";

import {
    renderSelectionUI,
    getResizeHandle,
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
        renderElement(el, ctx);
    })

    selectedElements.forEach(el => {
        renderSelectionUI(getBounds(el), ctx, {
            showHandles: true,
            color: "rgb(12, 142, 244)",
            padding: 6,
            handleSize: 8,
        })
    });

    ctx.restore()
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
    if (el.tool === "rect-tool") return hitTestRect(el, x, y);
    if (el.tool === "line-tool") return hitTestLine(el, x, y);
    if (el.tool === "circle-tool") return hitTestCircle(el, x, y);
    if (el.tool === "triangle-tool") return hitTestTriangle(el, x, y);

    if (el.tool === "brush-tool" || el.tool === "dash-brush-tool" || el.tool === "dotted-brush-tool") return hitTestBrush(el, x, y);

    if (el.tool === "image-tool") return hitTestImage(el, x, y);
    if (el.tool === "text-tool") return hitTestTextbox(el, x, y);
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

// BOUNDS

const getBounds = (el) => {
    if (el.tool === "rect-tool") return getBoundsRect(el);
    if (el.tool === "line-tool") return getBoundsLine(el);
    if (el.tool === "circle-tool") return getBoundsCircle(el);
    if (el.tool === "triangle-tool") return getBoundsTriangle(el);
    if (el.tool === "image-tool") return getBoundsImage(el);
    if (el.tool === "text-tool") return getBoundsTextbox(el);
    if (
        el.tool === "brush-tool" ||
        el.tool === "dash-brush-tool" ||
        el.tool === "dotted-brush-tool"
    ) return getBoundsBrush(el);
};

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
            state: "placeholder",
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
        if (selectedElements.length === 1) {
            resizeHandle = getResizeHandle(e.clientX, e.clientY, getBounds(selectedElements[0]));
        }
        if (resizeHandle) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            render(elements, selectedElements, ctx);
            console.log(resizeHandle)
            return;
        } else if (!resizeHandle) {
            selectedElements = getSelectedElements(elements, e.clientX, e.clientY);
            getOffsets(selectedElements, e.clientX, e.clientY);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            render(elements, selectedElements, ctx);
            return;
        }
    } else {
        const el = createElement(e.clientX, e.clientY);
        elements.push(el);
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (currentCanvasState !== "EDITING") return;

    if (currentTool === "selection-tool") {
        if (resizeHandle) {
            resizeElement(selectedElements[0], resizeHandle, e.clientX, e.clientY);
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
        return;
    }

    let el = elements[elements.length - 1];
    if (el.tool === "image-tool") {
        fetchImage(el);
    } else if (el.tool === "text-tool" && el.state === "placeholder") {
        activeTextBox = textboxMouseupHandler(el)
    }

    currentCanvasState = "IDLE";
    resizeHandle = null;
    movement.clear();
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
    let handle = getResizeHandle(
        e.clientX,
        e.clientY,
        getBounds(selectedElements[0]),
    );
    canvas.style.cursor = handle && handle !== "REVERT" ? "nwse-resize" : "move";
});

// INITAL LOADING FROM LOCAL STORAGE

const savedElements = localStorage.getItem("scribbleElements");

if (savedElements) {
    elements = JSON.parse(savedElements);

    let promises = [];

    elements.forEach((el) => {
        if (el.tool === "image-tool" && el.data?.url) {
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

