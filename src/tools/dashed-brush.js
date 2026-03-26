import { dist } from "../utils";
import { hitTestBrush, getBoundsBrush, moveBrush } from "./solid-brush";


export const hitTestDashedBrush = hitTestBrush

export const renderDashedBrush = (el, ctx) => {
  ctx.save();
  ctx.lineWidth = el.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = el.color || "#000";
  ctx.globalAlpha = el.opacity;

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

export const moveDashedBrush = moveBrush

export const resize = (el, handle, x, y) => {
}

export const getBoundsDashedBrush = getBoundsBrush
