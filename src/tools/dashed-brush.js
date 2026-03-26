import { dist } from "../utils.js";

export const renderDashedBrush = (el, ctx) => {
  ctx.save();
  ctx.lineWidth = el.style.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = el.style.color || "#000";
  ctx.globalAlpha = el.style.opacity;

  ctx.setLineDash([10, 20]);
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
