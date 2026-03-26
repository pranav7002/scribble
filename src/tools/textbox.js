import { renderSelectionUI, getDiagonalCorners } from "../utils.js";

export const hitTestTextbox = (el, x, y) => {
	const { x1, y1, x2, y2 } = getBoundsTextbox(el);
	return x >= x1 && x <= x2 && y >= y1 && y <= y2;
};

export const renderTextbox = (el, ctx, activeTextBox = { element: null, before: "", after: "" }) => {
	ctx.save();
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.strokeStyle = el.style.color;
	ctx.globalAlpha = el.style.opacity;

	let { x1, y1, x2, y2, state } = el;

	if (state === "placeholder") {
		renderSelectionUI(getBoundsTextbox(el), ctx, {
			showHandles: true,
			color: "#000000",
			padding: 0,
			handleSize: 6,
		});

		({ x1, y1, x2, y2 } = getDiagonalCorners(el));
		let height = y2 - y1;

		ctx.fillStyle = "rgb(12, 142, 244)";
		ctx.font = `${height - 2}px Pixelify Sans`;
		ctx.fillText("|", x1, y2);

	} else if (state === "typing") {

		let before = activeTextBox.before;
		let after = activeTextBox.after;

		renderSelectionUI(getBoundsTextbox(el), ctx, {
			showHandles: false,
			color: "#000000",
			padding: 0,
			handleSize: 0,
		});

		({ x1, y1, x2, y2 } = getDiagonalCorners(el));
		let height = y2 - y1;

		ctx.font = `${height - 2}px Pixelify Sans`;
		ctx.fillStyle = el.style.color;
		ctx.fillText(before, x1, y2);

		let offset = ctx.measureText(before).width;

		ctx.fillStyle = "rgb(12, 142, 244)";
		ctx.fillText("|", x1 + offset, y2);

		ctx.fillStyle = el.style.color;
		offset = ctx.measureText(before + "|").width;
		ctx.fillText(after, x1 + offset, y2);

	} else if (state === "typed") {

		({ x1, y1, x2, y2 } = getDiagonalCorners(el));
		let height = y2 - y1;

		ctx.font = `${height - 2}px Pixelify Sans`;
		ctx.fillStyle = el.style.color;
		ctx.fillText(el.data.text, x1, y2);
	}

	ctx.restore();
};

export const moveTextbox = (el, dx, dy) => {
	el.x1 += dx
	el.y1 += dy
	el.x2 += dx
	el.y2 += dy
}

export const resizeTextbox = (el, handle, x, y) => {
}

export const getBoundsTextbox = (el) => {
	return {
		x1: Math.min(el.x1, el.x2),
		y1: Math.min(el.y1, el.y2),
		x2: Math.max(el.x1, el.x2),
		y2: Math.max(el.y1, el.y2),
	};
}

export const textboxKeydownHandler = (key, activeTextBox, ctx) => {

	let before = activeTextBox.before;
	let after = activeTextBox.after;

	let maxWidth = Math.abs(activeTextBox.element.x2 - activeTextBox.element.x1);

	if (key.length === 1) {
		let newText = before + key + after;

		ctx.font = `${activeTextBox.element.y2 - activeTextBox.element.y1 - 2}px Pixelify Sans`;
		let width = ctx.measureText(newText).width;

		if (width <= maxWidth) {
			before = before + key;
		}

	} else if (key === "Backspace") {
		before = before.slice(0, before.length - 1);

	} else if (key === "ArrowRight") {
		if (after.length) {
			before = before + after[0];
			after = after.slice(1);
		}

	} else if (key === "ArrowLeft") {
		if (before.length) {
			after = before.slice(before.length - 1) + after;
			before = before.slice(0, before.length - 1);
		}
	}

	activeTextBox.element.data.text = before + after;

	activeTextBox.before = before;
	activeTextBox.after = after;

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export const textboxMouseupHandler = (el, activeTextBox) => {
	if (el.state === "placeholder") {
		el.state = "typing";
		return {
			element: el,
			before: el.data.text,
			after: "",
		};
	}
	return activeTextBox;
}

export const defocusTextbox = (el, ctx, activeTextBox) => {
	el.state = "typed";

	let { x1, y1, x2, y2 } = getBoundsTextbox(el);

	ctx.font = `${y2 - y1 - 2}px Pixelify Sans`;
	let width = ctx.measureText(el.data.text).width;

	el.x2 = x1 + width;

	ctx.font = "0px";
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	return {
		element: null,
		before: "",
		after: "",
	};
};