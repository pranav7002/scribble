import { dist } from "../utils.js";

export const hitTestCircle = (el, x, y) => {
  let r = dist(el.x1, el.y1, el.x2, el.y2);
  let distFromCenter = dist(el.x1, el.y1, x, y);
  if (distFromCenter < r) return true;
  return false
}

export const renderCircle = (el, ctx) => {
  ctx.save();
  ctx.lineWidth = el.style.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = el.style.opacity;

  let rad = dist(el.x1, el.y1, el.x2, el.y2);
  ctx.beginPath();
  ctx.arc(el.x1, el.y1, rad, 0, 2 * Math.PI, true);
  if (el.style.paintMode === "fill") {
    ctx.fillStyle = el.style.color || "#000";
    ctx.fill();
  } else {
    ctx.strokeStyle = el.style.color || "#000";
    ctx.stroke();
  }

  ctx.restore();
}

export const moveCircle = (el, dx, dy) => {
  el.x1 += dx
  el.y1 += dy
  el.x2 += dx
  el.y2 += dy
}

export const getBoundsCircle = (el) => {
  let r = dist(el.x1, el.y1, el.x2, el.y2);
  return {
    x1: el.x1 - r,
    y1: el.y1 - r,
    x2: el.x1 + r,
    y2: el.y1 + r,
  };
}
