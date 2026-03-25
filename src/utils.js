import { ctx } from "./constants.js";

export const dist = (x1, y1, x2, y2) => {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
};

export const area = (x1, y1, x2, y2, x3, y3) => {
    // Heron's formula
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2.0);
};

export const getDiagonalCorners = ({ x1, y1, x2, y2 }) => {
    return {
        x1: Math.min(x1, x2),
        y1: Math.min(y1, y2),
        x2: Math.max(x1, x2),
        y2: Math.max(y1, y2),
    };
};

export const getBounds = (element) => {
    let { x1, y1, x2, y2 } = getDiagonalCorners(element);

    if (
        element.tool === "rect-tool" ||
        element.tool === "line-tool" ||
        element.tool === "triangle-tool"
    ) {
        return { x1, y1, width: x2 - x1, height: y2 - y1 };
    }

    if (element.tool === "circle-tool") {
        let r = dist(element.x1, element.y1, element.x2, element.y2);
        return { x1: element.x1 - r, y1: element.y1 - r, width: 2 * r, height: 2 * r };
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

        return { x1: minX, y1: minY, width: maxX - minX, height: maxY - minY };
    }
};

export const renderSelectionOutline = (x1, y1, width, height) => {
    ctx.strokeStyle = "#0000FF";
    ctx.setLineDash([10, 15]);
    ctx.strokeRect(x1, y1, width, height);
    ctx.strokeStyle = "#000000";
};

export const getResizeHandle = (clientX, clientY, bounds) => {
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
