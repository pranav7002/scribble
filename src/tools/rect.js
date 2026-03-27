export const hitTestRect = (el, x, y) => {
	let { x1, y1, x2, y2 } = getBoundsRect(el)
	if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
		return true
	}
	return false
}

export const renderRect = (el, ctx) => {
	ctx.save();
	ctx.lineWidth = el.style.width;
	ctx.globalAlpha = el.style.opacity;

	const width = el.x2 - el.x1;
	const height	 = el.y2 - el.y1;

	if (el.style.paintMode === "fill") {
		ctx.fillStyle = el.style.color || "#000";
		ctx.fillRect(el.x1, el.y1, width, height);
	} else {
		ctx.strokeStyle = el.style.color || "#000";
		ctx.strokeRect(el.x1, el.y1, width, height);
	}
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

