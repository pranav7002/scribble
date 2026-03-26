export const hitTestRect = (el, x, y) => {
	if (x >= el.x1 && x <= el.x2 && y >= el.y1 && y <= el.y2) {
		return true
	}
	return false
}

export const renderRect = (el, ctx) => {
	ctx.save();
	ctx.lineWidth = el.width;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.strokeStyle = el.color || "#000";
	ctx.globalAlpha = el.opacity;
	ctx.strokeRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
	ctx.restore();
}

export const moveRect = (el, dx, dy) => {
	el.x1 += dx
	el.y1 += dy
	el.x2 += dx
	el.y2 += dy
}

export const resizeRect = (el, handle, x, y) => {
  if (handle === "tl") { el.x1 = x; el.y1 = y; }
  if (handle === "tr") { el.x2 = x; el.y1 = y; }
  if (handle === "bl") { el.x1 = x; el.y2 = y; }
  if (handle === "br") { el.x2 = x; el.y2 = y; }
}

export const getBoundsRect = (el) => {
	return {
		x1: Math.min(el.x1, el.x2),
		y1: Math.min(el.y1, el.y2),
		x2: Math.max(el.x1, el.x2),
		y2: Math.max(el.y1, el.y2),
	};
}