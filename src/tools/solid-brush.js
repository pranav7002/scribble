import { dist } from "../utils.js";

export const hitTestBrush = (el, x, y) => {
  for (let i = 0; i < el.points.length - 1; i++) {
    let p1 = el.points[i];
    let p2 = el.points[i + 1];
    let len = dist(p1.x, p1.y, p2.x, p2.y);
    let d1 = dist(p1.x, p1.y, x, y);
    let d2 = dist(x, y, p2.x, p2.y);
    if (Math.abs(d1 + d2 - len) < 5) {
      return true;
    }
  }
  return false
}

export const renderSolidBrush = (el, ctx) => {
  ctx.save();
  ctx.lineWidth = el.style.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = el.style.color || "#000";
  ctx.globalAlpha = el.style.opacity;

  ctx.beginPath();
  let { x, y } = el.points[0];
  ctx.moveTo(x, y);
  for (let i = 1; i < el.points.length; i++) {
    let { x, y } = el.points[i];
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.restore();
}

export const moveBrush = (el, dx, dy) => {
  el.points.forEach(p => {
    p.x += dx;
    p.y += dy;
  })
}

export const getBoundsBrush = (el) => {
  let minX = el.points[0].x;
  let maxX = el.points[0].x;
  let minY = el.points[0].y;
  let maxY = el.points[0].y;

  for (let i = 1; i < el.points.length; i++) {
    minX = Math.min(minX, el.points[i].x);
    minY = Math.min(minY, el.points[i].y);
    maxX = Math.max(maxX, el.points[i].x);
    maxY = Math.max(maxY, el.points[i].y);
  }

  return { x1: minX, y1: minY, x2: maxX, y2: maxY };
}
