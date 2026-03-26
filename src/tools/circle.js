import { dist } from "../utils";
import { resizeRect } from "./rect";

export const hitTestCircle = (el, x, y) => {
  let r = dist(el.x1, el.y1, el.x2, el.y2);
  let distFromCenter = dist(el.x1, el.y1, x, y);
  if (distFromCenter < r) return true;
  return false
}

export const renderCircle = (el, ctx) => {
  ctx.save();
  ctx.lineWidth = el.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = el.color || "#000";
  ctx.globalAlpha = el.opacity;

  let rad = dist(el.x1, el.y1, el.x2, el.y2);
  ctx.beginPath();
  ctx.arc(el.x1, el.y1, rad, 0, 2 * Math.PI, true);
  ctx.stroke();

  ctx.restore();
}

export const moveCircle = (el, dx, dy) => {
  el.x1 += dx
  el.y1 += dy
  el.x2 += dx
  el.y2 += dy
}

export const resizeCircle = resizeRect

export const getBoundsCircle = (el) => {
  let r = dist(el.x1, el.y1, el.x2, el.y2);
  return {
    x1: el.x1 - r,
    y1: el.y1 - r,
    x2: el.x1 + 2 * r,
    y2: el.y1 + 2 * r,
  };
}
