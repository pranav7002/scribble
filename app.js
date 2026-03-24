//TOOL CATEGORIES:
// 1. SHAPE
// line, rectangle, circle, triangle
// 2. FREEHAND
// brush

//declerations
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const allToolInputs = document.querySelectorAll("input[type='radio']");
const allColors = document.querySelectorAll(".color");
const allOpacity = document.querySelectorAll(".opacity-btn");
const strokeSlider = document.getElementById("stroke");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let elements = [];
let currentCanvasState = "IDLE";
let currentTool = "NONE";
let currentToolCategory = "NONE";
let selectedElements = [];
let resizingKey = "REVERT";
let movement = new Map();
let currentColor = "#000000"; // default black
let currentWidth = 3; // default stroke width
let currentOpacity = 1; // default opaque

//events
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

allToolInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
        currentTool = e.target.id;
        if (
            e.target.id === "brush-tool" ||
            e.target.id === "dash-brush-tool" ||
            e.target.id === "dotted-brush-tool"
        ) {
            currentToolCategory = "FREEHAND";
        } else if (e.target.id === "selection-tool") {
            currentToolCategory = "SELECTION";
        } else {
            currentToolCategory = "SHAPE";
        }
        console.log(currentTool);
    });
});

canvas.addEventListener("mousedown", (e) => {
    if (currentTool === "NONE") return;

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
                if (el.toolCategory === "SHAPE") {
                    let offsetX = e.clientX - el.x1;
                    let offsetY = e.clientY - el.y1;
                    movement.set(el, { offsetX, offsetY });
                } else if (el.toolCategory === "FREEHAND") {
                    let offsets = [];
                    el.points.forEach((p) => {
                        let offsetX = p.x - e.clientX;
                        let offsetY = p.y - e.clientY;
                        offsets.push({ x: offsetX, y: offsetY });
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
            if (el.toolCategory === "SHAPE") {
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
        let x = e.clientX;
        let y = e.clientY;
        el.points.push({ x, y });
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    render();
});

canvas.addEventListener("mouseup", (e) => {
    currentCanvasState = "IDLE";
    resizingKey = "REVERT";
    movement.clear();
});

//render function
const render = () => {
    // coords are (x1, y1), (x1, y2) (x2, y1) (x2, y2)

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
                ctx.setLineDash([10, 15]);
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
                ctx.setLineDash([0.5, 10]);
                ctx.beginPath();
                let { x, y } = element.points[0];
                ctx.moveTo(x, y);
                for (let i = 1; i < element.points.length; i++) {
                    let { x, y } = element.points[i];
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        }
        ctx.restore();
    });
    selectedElements.forEach((el) => {
        let { x1, y1, width, height } = getBounds(el);
        renderSelectionOutline(x1 - 5, y1 - 5, width + 10, height + 10);
    });
};

//get selection function
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

                if (d1 + d2 - len < 1) {
                    selected.push(el);
                }
            }
            if (el.tool === "circle-tool") {
                let rad = dist(x1, y1, x2, y2);
                let distFromCenter = dist(x1, y1, clientX, clientY);

                if (distFromCenter < rad) {
                    selected.push(el);
                }
            }
            if (el.tool === "triangle-tool") {
                let x3 = (x1 + x2) / 2;
                let y3 = y2;

                // area of triangle ABC
                let A = area(x1, y1, x2, y1, x3, y3);
                // area of triangle PBC
                let A1 = area(clientX, clientY, x2, y1, x3, y3);
                // area of triangle PAC
                let A2 = area(x1, y1, clientX, clientY, x3, y3);
                // area of triangle PAB
                let A3 = area(x1, y1, x2, y1, clientX, clientY);
                if (Math.abs(A - (A1 + A2 + A3)) < 0.1) {
                    selected.push(el);
                }
            }
        }
        if (el.toolCategory === "FREEHAND") {
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
        }
    });
    return selected;
};

//get bounds function
const getBounds = (element) => {
    let { x1, y1, x2, y2 } = getDiagonalCorners(element);

    if (
        element.tool === "rect-tool" ||
        element.tool === "line-tool" ||
        element.tool === "triangle-tool"
    ) {
        return {
            x1,
            y1,
            width: x2 - x1,
            height: y2 - y1,
        };
    }

    if (element.tool === "circle-tool") {
        let r = dist(element.x1, element.y1, element.x2, element.y2);

        return {
            x1: element.x1 - r,
            y1: element.y1 - r,
            width: 2 * r,
            height: 2 * r,
        };
    }
    if (
        element.tool === "brush-tool" ||
        element.tool === "dotted-brush-tool" ||
        element.tool === "dash-brush-tool"
    ) {
        let minX = element.points[0].x;
        let maxX = element.points[0].x;
        let minY = element.points[0].y;
        let maxY = element.points[0].y;

        for (let i = 1; i < element.points.length; i++) {
            minX = Math.min(minX, element.points[i].x);
            minY = Math.min(minY, element.points[i].y);
            maxX = Math.max(maxX, element.points[i].x);
            maxY = Math.max(maxY, element.points[i].y);
        }

        return {
            x1: minX,
            y1: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    }
};

const getDiagonalCorners = ({ x1, y1, x2, y2 }) => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    return {
        x1: minX,
        y1: minY,
        x2: maxX,
        y2: maxY,
    };
};

//utils
const dist = (x1, y1, x2, y2) => {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
};

const area = (x1, y1, x2, y2, x3, y3) => {
    //Heron's formula
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2.0);
};

const renderSelectionOutline = (x1, y1, width, height) => {
    ctx.strokeStyle = "#0000FF";
    ctx.strokeRect(x1, y1, width, height);
    ctx.strokeStyle = "#000000";
};

const getResizeHandle = (clientX, clientY, bounds) => {
    const { x1, y1, width, height } = bounds;
    const size = 8;

    const handles = {
        tl: [x1, y1],
        tr: [x1 + width, y1],
        bl: [x1, y1 + height],
        br: [x1 + width, y1 + height],
    };

    for (let key in handles) {
        let [x, y] = handles[key];

        if (Math.abs(clientX - x) < size && Math.abs(clientY - y) < size) {
            return key;
        }
    }

    return "REVERT";
};
