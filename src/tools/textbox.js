export const hitTestTextbox = (el, x, y) => {
	const { x1, y1, x2, y2 } = getBoundsTextbox(el);
	return x >= x1 && x <= x2 && y >= y1 && y <= y2;
};

export const renderTextbox = (el, ctx) => {
	ctx.save();
	ctx.lineWidth = el.width;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.strokeStyle = el.color || "#000";
	ctx.globalAlpha = el.opacity;

	let { x1, y1, x2, y2, state } = el;

	if (state === "placeholder") {
		let corners = [
			{ x: x1, y: y1 },
			{ x: x2, y: y2 },
			{ x: x1, y: y2 },
			{ x: x2, y: y1 },
		];

		corners.forEach((c) => {
			let side = 6;
			let cx = c.x - 3;
			let cy = c.y - 3;

			ctx.save();
			ctx.fillStyle = "#000000";
			ctx.fillRect(cx, cy, side, side);
			ctx.restore();
		});

		ctx.setLineDash([4, 8]);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#000000";
		ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

		({ x1, y1, x2, y2 } = getDiagonalCorners(el));
		let height = y2 - y1;

		ctx.fillStyle = "rgb(12, 142, 244)";
		ctx.font = `${height - 2}px Pixelify Sans`;
		ctx.fillText("|", x1, y2);

	} else if (state === "typing") {

		let before = activeTextBox.before;
		let after = activeTextBox.after;

		ctx.setLineDash([4, 8]);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#000000";
		ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

		({ x1, y1, x2, y2 } = getDiagonalCorners(el));
		let height = y2 - y1;

		ctx.font = `${height - 2}px Pixelify Sans`;
		ctx.fillStyle = el.color;
		ctx.fillText(before, x1, y2);

		let offset = ctx.measureText(before).width;

		ctx.fillStyle = "rgb(12, 142, 244)";
		ctx.fillText("|", x1 + offset, y2);

		ctx.fillStyle = el.color;
		offset = ctx.measureText(before + "|").width;
		ctx.fillText(after, x1 + offset, y2);

	} else if (state === "typed") {

		({ x1, y1, x2, y2 } = getDiagonalCorners(el));
		let height = y2 - y1;

		ctx.font = `${height - 2}px Pixelify Sans`;
		ctx.fillStyle = el.color;
		ctx.fillText(el.text, x1, y2);
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

export const textboxKeydownHandler = (key, activeTextBox) => {

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

	activeTextBox.element.text = before + after;

	activeTextBox.before = before;
	activeTextBox.after = after;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	render();
};

export const textboxMouseupHandler = (el) => {
	if (el.state === "placeholder") {
		el.state = "typing";
		activeTextBox = {
			element: el,
			before: el.text,
			after: "",
		};
	}
}

export const defocusTextbox = (x, y) => {
	if (activeTextBox.element) {
		let el = activeTextBox.element;

		if (!hitTestTextbox(el, x, y)) {
			el.state = "typed";

			let { x1, y1, x2, y2 } = getDiagonalCorners(el);

			ctx.font = `${y2 - y1 - 2}px Pixelify Sans`;
			let width = ctx.measureText(el.text).width;

			el.x2 = x1 + width;

			activeTextBox = {
				element: null,
				before: "",
				after: "",
			};

			ctx.font = "0px";
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			render();
			return;
		}
	}
};