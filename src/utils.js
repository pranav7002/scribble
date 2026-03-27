import { getBoundsBrush } from "./tools/solid-brush.js";
import { getBoundsCircle } from "./tools/circle.js";
import { getBoundsImage } from "./tools/image.js";
import { getBoundsLine } from "./tools/line.js";
import { getBoundsRect } from "./tools/rect.js";
import { getBoundsTextbox } from "./tools/textbox.js";
import { getBoundsTriangle } from "./tools/triangle.js";

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

export const getResizeHandle = (x, y, { x1, y1, x2, y2 }) => {
    const size = 15;

    const handles = {
        tl: [x1, y1],
        tr: [x2, y1],
        bl: [x1, y2],
        br: [x2, y2],
    };

    for (let key in handles) {
        let [hx, hy] = handles[key];
        if (Math.abs(x - hx) < size && Math.abs(y - hy) < size) {
            return key;
        }
    }

    return null;
};

export const loadImage = async (url) => {
    const response = await fetch(url);
    const blob = response.ok && await response.blob();
    return createImageBitmap(blob);
}

export const renderSelectionUI = ({ x1, y1, x2, y2 }, ctx, options = {}) => {
    const {
        roatationHandle = false,
        color = "rgb(12, 142, 244)",
        showHandles = true,
        padding = 6,
        handleSize = 8,
    } = options;

    if (roatationHandle) {
        const padding = 30
        const cx = (x1 + x2) / 2
        const cy = (y1 + y1) / 2

        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(cx - 6, cy - padding, 6, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.restore()

        return;
    }

    const width = x2 - x1;
    const height = y2 - y1;

    const px1 = x1 - padding;
    const py1 = y1 - padding;
    const pwidth = width + 2 * padding;
    const pheight = height + 2 * padding;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(px1, py1, pwidth, pheight);
    ctx.restore();

    if (!showHandles) return;

    const corners = [
        { x: px1, y: py1 },
        { x: px1 + pwidth, y: py1 },
        { x: px1, y: py1 + pheight },
        { x: px1 + pwidth, y: py1 + pheight },
    ];

    corners.forEach((c) => {
        const cx = c.x - handleSize / 2;
        const cy = c.y - handleSize / 2;

        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(cx, cy, handleSize, handleSize);
        ctx.restore();
    });
};

export const isHitRotationHandle = (el, x, y) => {
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

    let rothandle = {
        x: cx,
        y: cy - 30
    }

    if (Math.abs(x - rothandle.x) < 10 && Math.abs(y - rothandle.y)) return true

    return false
}

export const getBounds = (el) => {
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
