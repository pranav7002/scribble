import {
    canvas,
    ctx,
    allToolInputs,
    allColors,
    allOpacity,
    strokeSlider,
    clearBtn,
} from "./constants.js";

import {
    dist,
    area,
    getDiagonalCorners,
    getBounds,
    renderSelectionOutline,
    getResizeHandle,
    loadImage,
    isTextBoxHit,
} from "./utils.js";

// MUTABLE STATE VARIABLES
export let elements = [];

let currentCanvasState = "IDLE";
let currentTool = "NONE";
let currentToolCategory = "NONE";
let selectedElements = [];
let resizingKey = "REVERT";
let movement = new Map();
let currentColor = "#0C8EF4";
let currentWidth = 15;
let currentOpacity = 0.6;
let activeTextBox = {
    element: null,
    before: "",
    after: "",
};

// RENDER

const render = () => {
    elements.forEach((element) => {
        ctx.save();
        ctx.lineWidth = element.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = element.color || "#000";
        ctx.globalAlpha = element.opacity;

        if (element.toolCategory === "SHAPE") {
            let { x1, y1, x2, y2, tool } = element;

            if (tool === "rect-tool") {
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            }
            if (tool === "line-tool") {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            if (tool === "circle-tool") {
                let rad = dist(x1, y1, x2, y2);
                ctx.beginPath();
                ctx.arc(x1, y1, rad, 0, 2 * Math.PI, true);
                ctx.stroke();
            }
            if (tool === "triangle-tool") {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y1);
                ctx.lineTo((x1 + x2) / 2, y2);
                ctx.closePath();
                ctx.stroke();
            }
        } else if (element.toolCategory === "FREEHAND") {
            if (element.tool === "brush-tool") {
                ctx.beginPath();
                let { x, y } = element.points[0];
                ctx.moveTo(x, y);
                for (let i = 1; i < element.points.length; i++) {
                    let { x, y } = element.points[i];
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            if (element.tool === "dash-brush-tool") {
                ctx.setLineDash([10, 20]);
                ctx.beginPath();
                let { x, y } = element.points[0];
                ctx.moveTo(x, y);
                for (let i = 1; i < element.points.length; i++) {
                    let { x, y } = element.points[i];
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            if (element.tool === "dotted-brush-tool") {
                ctx.setLineDash([0.5, 18]);
                ctx.beginPath();
                let { x, y } = element.points[0];
                ctx.moveTo(x, y);
                for (let i = 1; i < element.points.length; i++) {
                    let { x, y } = element.points[i];
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else if (element.toolCategory === "IMAGE") {
            let { x1, y1, x2, y2, state } = element;
            let width = Math.abs(x2 - x1);
            let height = Math.abs(y2 - y1);
            console.log(width, height);

            if (state === "image") {
                ctx.drawImage(element.bitmap, x1, y1, width, height);
            } else if (state === "placeholder") {
                let corners = [
                    { x: x1, y: y1 },
                    { x: x2, y: y2 },
                    { x: x1, y: y2 },
                    { x: x2, y: y1 },
                ];
                corners.forEach((c) => {
                    let side = 6;
                    let x = c.x - 3;
                    let y = c.y - 3;

                    ctx.save();
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(x, y, side, side);
                    ctx.restore();
                });

                ctx.setLineDash([4, 8]);
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = "#000000";
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            }
        } else if (element.toolCategory === "TEXT") {
            let { x1, y1, x2, y2, state } = element;
            if (state === "placeholder") {
                let corners = [
                    { x: x1, y: y1 },
                    { x: x2, y: y2 },
                    { x: x1, y: y2 },
                    { x: x2, y: y1 },
                ];
                corners.forEach((c) => {
                    let side = 6;
                    let x = c.x - 3;
                    let y = c.y - 3;

                    ctx.save();
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(x, y, side, side);
                    ctx.restore();
                });

                ctx.setLineDash([4, 8]);
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#000000";
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
                ({ x1, y1, x2, y2 } = getDiagonalCorners(element));
                let height = y2 - y1;
                ctx.fillStyle = "rgb(12, 142, 244)";
                ctx.font = `${height - 2}px Pixelify Sans`;
                ctx.fillText("|", x1, y2);
            } else if (state === "typing") {
                let before = activeTextBox.before;
                let after = activeTextBox.after;

                ctx.setLineDash([4, 8]);
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#000000";
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
                ({ x1, y1, x2, y2 } = getDiagonalCorners(element));
                let height = y2 - y1;
                ctx.font = `${height - 2}px Pixelify Sans`;
                ctx.fillStyle = element.color;
                ctx.fillText(before, x1, y2);
                let offset = ctx.measureText(before).width;
                ctx.fillStyle = "rgb(12, 142, 244)";
                ctx.fillText("|", x1 + offset, y2);
                ctx.fillStyle = element.color;
                offset = ctx.measureText(before + "|").width;
                ctx.fillText(after, x1 + offset, y2);
            } else if (state === "typed") {
                ({ x1, y1, x2, y2 } = getDiagonalCorners(element));
                let height = y2 - y1;
                ctx.font = `${height - 2}px Pixelify Sans`;
                ctx.fillStyle = element.color;
                ctx.fillText(element.text, x1, y2);
            }
        }
        ctx.restore();
    });

    selectedElements.forEach((el) => {
        let { x1, y1, width, height } = getBounds(el);
        renderSelectionOutline(x1 - 5, y1 - 5, width + 10, height + 10);
    });
};

// SELECTION HELPER

const getSelectedElements = ({ clientX, clientY }) => {
    let selected = [];

    elements.forEach((el) => {
        if (el.toolCategory === "SHAPE") {
            let { x1, y1, x2, y2 } = getDiagonalCorners(el);

            if (el.tool === "rect-tool") {
                if (clientX >= x1 && clientX <= x2 && clientY >= y1 && clientY <= y2) {
                    selected.push(el);
                }
            }
            if (el.tool === "line-tool") {
                let d1 = dist(x1, y1, clientX, clientY);
                let d2 = dist(clientX, clientY, x2, y2);
                let len = dist(x1, y1, x2, y2);
                if (d1 + d2 - len < 1) selected.push(el);
            }
            if (el.tool === "circle-tool") {
                let rad = dist(x1, y1, x2, y2);
                let distFromCenter = dist(x1, y1, clientX, clientY);
                if (distFromCenter < rad) selected.push(el);
            }
            if (el.tool === "triangle-tool") {
                let x3 = (x1 + x2) / 2;
                let y3 = y2;
                let A = area(x1, y1, x2, y1, x3, y3);
                let A1 = area(clientX, clientY, x2, y1, x3, y3);
                let A2 = area(x1, y1, clientX, clientY, x3, y3);
                let A3 = area(x1, y1, x2, y1, clientX, clientY);
                if (Math.abs(A - (A1 + A2 + A3)) < 0.1) selected.push(el);
            }
        } else if (el.toolCategory === "FREEHAND") {
            for (let i = 0; i < el.points.length - 1; i++) {
                let p1 = el.points[i];
                let p2 = el.points[i + 1];
                let len = dist(p1.x, p1.y, p2.x, p2.y);
                let d1 = dist(p1.x, p1.y, clientX, clientY);
                let d2 = dist(clientX, clientY, p2.x, p2.y);
                if (Math.abs(d1 + d2 - len) < 5) {
                    selected.push(el);
                    break;
                }
            }
        } else if (el.toolCategory === "IMAGE" || el.toolCategory === "TEXT") {
            let { x1, y1, x2, y2 } = getDiagonalCorners(el);
            if (clientX >= x1 && clientX <= x2 && clientY >= y1 && clientY <= y2) {
                selected.push(el);
            }
        }
    });

    return selected;
};

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

        if (resizingKey === "REVERT") {
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
            let el = selectedElements[0];
            if (el.toolCategory === "SHAPE") {
                if (resizingKey === "tl") {
                    el.x1 = e.clientX;
                    el.y1 = e.clientY;
                }
                if (resizingKey === "tr") {
                    el.x2 = e.clientX;
                    el.y1 = e.clientY;
                }
                if (resizingKey === "bl") {
                    el.x1 = e.clientX;
                    el.y2 = e.clientY;
                }
                if (resizingKey === "br") {
                    el.x2 = e.clientX;
                    el.y2 = e.clientY;
                }
            }
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

