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

export const getResizeHandle = (clientX, clientY, bounds) => {
    const { x1, y1, width, height } = bounds;
    const size = 15;

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

export const loadImage = async (url) => {
    const response = await fetch(url);
    const blob = response.ok && await response.blob();
    return createImageBitmap(blob);
}

export const renderSelectionUI = (el, ctx, options = {}) => {
    const {
        showHandles = true,
        color = "rgb(12, 142, 244)",
        padding = 6,
        handleSize = 8,
    } = options;

    const x1 = Math.min(el.x1, el.x2);
    const y1 = Math.min(el.y1, el.y2);
    const x2 = Math.max(el.x1, el.x2);
    const y2 = Math.max(el.y1, el.y2);

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

