import { renderSelectionUI, loadImage } from "../utils.js";

export const hitTestImage = (el, x, y) => {

  const { x1, y1, x2, y2 } = getBoundsImage(el);

  return x >= x1 && x <= x2 && y >= y1 && y <= y2;
}

export const renderImage = (el, ctx) => {
  ctx.save();

  if (el.state === "image") {
    const { x1, y1, x2, y2 } = getBoundsImage(el);
    ctx.drawImage(el.data.img, x1, y1, x2 - x1, y2 - y1);
  } else if (el.state === "placeholder") {
    renderSelectionUI(getBoundsImage(el), ctx, {
      showHandles: true,
      color: "#000000",
      padding: 0,
      handleSize: 6,
    });
  }

  ctx.restore();
};

export const moveImage = (el, dx, dy) => {
  el.x1 += dx
  el.y1 += dy
  el.x2 += dx
  el.y2 += dy
}

export const getBoundsImage = (el) => {
  return {
    x1: Math.min(el.x1, el.x2),
    y1: Math.min(el.y1, el.y2),
    x2: Math.max(el.x1, el.x2),
    y2: Math.max(el.y1, el.y2),
  };
}

export const fetchImage = (el) => {
  let url = `https://picsum.photos/${Math.abs(el.x2 - el.x1)}/${Math.abs(el.y2 - el.y1)}`;
  el.data.url = url;

  return loadImage(el.data.url).then((img) => {
    el.data.img = img;
    el.state = "image";
  });
}

