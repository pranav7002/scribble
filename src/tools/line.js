import { dist } from "../utils";
import { resizeRect } from "./rect";

export const hitTestLine = (el, x, y) => {
    let d1 = dist(el.x1, el.y1, x, y);
    let d2 = dist(x, y, el.x2, el.y2);
    let len = dist(el.x1, el.y1, el.x2, el.y2);
    if (d1 + d2 - len < 1) return true;

    return false
}

export const renderLine = (el, ctx) => {
    ctx.save();
    ctx.lineWidth = el.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = el.color || "#000";
    ctx.globalAlpha = el.opacity;

    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();

    ctx.restore();
}

export const moveLine = (el, dx, dy) => {
    el.x1 += dx
    el.y1 += dy
    el.x2 += dx
    el.y2 += dy
}

export const resizeLine = resizeRect

export const getBoundsLine = (el) => {
    return {
        x1: Math.min(el.x1, el.x2),
        y1: Math.min(el.y1, el.y2),
        x2: Math.max(el.x1, el.x2),
        y2: Math.max(el.y1, el.y2),
    };
}