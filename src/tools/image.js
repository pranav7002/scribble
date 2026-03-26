import { resizeRect } from "./rect";

export const hitTestImage = (el, x, y) => {

  const { x1, y1, x2, y2 } = getBoundsImage(el);

  return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  
  return false
}

export const renderImage = (el, ctx) => {
  ctx.save();
  ctx.lineWidth = el.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = el.color || "#000";
  ctx.globalAlpha = el.opacity;

  if (el.state === "image") {
    ctx.drawImage(el.bitmap, el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
  } else if (el.state === "placeholder") {
    let corners = [
      { x: el.x1, y: el.y1 },
      { x: el.x2, y: el.y2 },
      { x: el.x1, y: el.y2 },
      { x: el.x2, y: el.y1 },
    ];
    corners.forEach((c) => {
      let side = 6;
      let x = c.x - 3;
      let y = c.y - 3;

      ctx.save();
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, y, side, side);
      ctx.restore();
    });

    ctx.setLineDash([4, 8]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  }

  ctx.restore();
}

export const moveImage = (el, dx, dy) => {
  el.x1 += dx
  el.y1 += dy
  el.x2 += dx
  el.y2 += dy
}

export const resizeImage = resizeRect

export const getBoundsImage = (el) => {
  return {
    x1: Math.min(el.x1, el.x2),
    y1: Math.min(el.y1, el.y2),
    x2: Math.max(el.x1, el.x2),
    y2: Math.max(el.y1, el.y2),
  };
}

export const fetchImage = (el) => {
  el.state = "image";
  let url = `https://picsum.photos/${Math.abs(el.x2 - el.x1)}/${Math.abs(el.y2 - el.y1)}`;
  el.url = url;

  loadImage(el.url).then((bitmap) => {
    el.bitmap = bitmap;
  });
}

export const refectchImages = (elements) => {
    let promises = [];

    elements.forEach((el) => {
        if (el.toolCategory === "IMAGE" && el.url) {
            promises.push(
                loadImage(el.url).then((bitmap) => {
                    el.bitmap = bitmap;
                }),
            );
        }
    });

    Promise.all(promises).then(() => render());
}
