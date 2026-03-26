import { area } from "../utils.js";
import { resizeRect } from "./rect.js";

export const hitTestTriangle = (el, x, y) => {
  let { x1, y1, x2, y2 } = getBoundsTriangle(el)

  let x3 = (x1 + x2) / 2;
  let y3 = y2;
  let A = area(x1, y1, x2, y1, x3, y3);
  let A1 = area(x, y, x2, y1, x3, y3);
  let A2 = area(x1, y1, x, y, x3, y3);
  let A3 = area(x1, y1, x2, y1, x, y);
  if (Math.abs(A - (A1 + A2 + A3)) < 0.1) return true;

  return false
}

export const renderTriangle = (el, ctx) => {
  ctx.save();
  ctx.lineWidth = el.style.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = el.style.color || "#000";
  ctx.globalAlpha = el.style.opacity;

  ctx.beginPath();
  ctx.moveTo(el.x1, el.y1);
  ctx.lineTo(el.x2, el.y1);
  ctx.lineTo((el.x1 + el.x2) / 2, el.y2);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

export const moveTriangle = (el, dx, dy) => {
  el.x1 += dx
  el.y1 += dy
  el.x2 += dx
  el.y2 += dy
}

export const resizeTriangle = resizeRect

export const getBoundsTriangle = (el) => {
  return {
    x1: Math.min(el.x1, el.x2),
    y1: Math.min(el.y1, el.y2),
    x2: Math.max(el.x1, el.x2),
    y2: Math.max(el.y1, el.y2),
  };
}