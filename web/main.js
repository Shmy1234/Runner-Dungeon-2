const INTRO = 0;
const GAME = 1;
const TUTORIAL = 2;
const COMPLETE = 3;
const DEATH = 4;

const BASE_W = 800;
const BASE_H = 800;

const wallColor = 0xff33fe00 | 0;
const exitColor = 0xfffe00e9 | 0;

const packColor = (r, g, b, a = 255) => ((a << 24) | (r << 16) | (g << 8) | b) | 0;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

async function loadMask(src) {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height);
  return { data, width: img.width, height: img.height };
}

class Button {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  hit(x, y) {
    return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
  }
  draw(ctx, img) {
    ctx.drawImage(img, this.x, this.y, this.w, this.h);
  }
}

class Player {
  constructor(x, y, w, h, images, keys) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.keys = keys;
    this.timer = 0;
    this.idleLeft = images.idleLeft;
    this.idleRight = images.idleRight;
    this.idle = this.idleRight;
    this.runLeft = [];
    this.runRight = [];
    for (let i = 1; i <= 4; i += 1) {
      const runLeftPic = images[`runLeft${i}`];
      const runRightPic = images[`runRight${i}`];
      for (let j = 0; j < 4; j += 1) {
        this.runLeft.push(runLeftPic);
        this.runRight.push(runRightPic);
      }
    }
  }
  draw(ctx) {
    const u = this.keys["ArrowUp"];
    const d = this.keys["ArrowDown"];
    const l = this.keys["ArrowLeft"];
    const r = this.keys["ArrowRight"];
    if (!u && !d && !l && !r) {
      this.timer = 0;
      ctx.drawImage(this.idle, this.x, this.y, this.w, this.h);
    } else if (u || d) {
      const frames = this.idle === this.idleLeft ? this.runLeft : this.runRight;
      ctx.drawImage(frames[this.timer], this.x, this.y, this.w, this.h);
      this.timer += 1;
    } else if (r) {
      this.idle = this.idleRight;
      ctx.drawImage(this.runRight[this.timer], this.x, this.y, this.w, this.h);
      this.timer += 1;
    } else if (l) {
      this.idle = this.idleLeft;
      ctx.drawImage(this.runLeft[this.timer], this.x, this.y, this.w, this.h);
      this.timer += 1;
    }
    if (this.timer >= this.runLeft.length) {
      this.timer = 0;
    }
  }
}

class Spikes {
  constructor(limit, type, level, x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.px = x;
    this.py = y;
    this.level = level;
    this.type = type;
    this.limit = limit;
    this.distance = 0;
    this.moving = 2;
  }
  moveByPlayer(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
  move() {
    if (this.type === 2) {
      this.x += this.moving;
    }
    if (this.type === 3) {
      this.y += this.moving;
    }
    this.distance += this.moving;
    if (Math.abs(this.distance) === this.limit) {
      this.moving *= -1;
    }
  }
  reset() {
    this.x = this.px;
    this.y = this.py;
    this.distance = 0;
    this.moving = 2;
  }
}

class SpikesOrganizer {
  constructor(spikeImg) {
    this.spikes = [];
    this.spikeImg = spikeImg;
  }
  add(s) {
    this.spikes.push(s);
  }
  move() {
    this.spikes.forEach((s) => s.move());
  }
  moveByPlayer(dx, dy) {
    this.spikes.forEach((s) => s.moveByPlayer(dx, dy));
  }
  death(level, x, y, w, h) {
    return this.spikes.some((s) => {
      if (s.level !== level) return false;
      const separated =
        x > s.x + s.w || x + w < s.x || y > s.y + s.h || y + h < s.y;
      return !separated;
    });
  }
  reset() {
    this.spikes.forEach((s) => s.reset());
  }
  draw(ctx, level) {
    this.spikes.forEach((s) => {
      if (s.level === level) {
        ctx.drawImage(this.spikeImg, s.x, s.y, s.w, s.h);
      }
    });
  }
}

class Ghost {
  constructor(level, d, x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.px = x;
    this.py = y;
    this.level = level;
    this.direction = 1;
    this.moving = 1;
  }
  moveByPlayer(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
  move(px, py) {
    if (Math.abs(px - this.x) <= 400 && Math.abs(py - this.y) <= 400) {
      if (this.x > px) {
        this.x -= this.moving;
        this.direction = -1;
      }
      if (px > this.x) {
        this.x += this.moving;
        this.direction = 1;
      }
      if (this.y > py) {
        this.y -= this.moving;
      }
      if (py > this.y) {
        this.y += this.moving;
      }
    }
  }
  reset() {
    this.x = this.px;
    this.y = this.py;
    this.direction = 1;
  }
}

class GhostOrganizer {
  constructor(leftImg, rightImg) {
    this.ghosts = [];
    this.leftImg = leftImg;
    this.rightImg = rightImg;
  }
  add(g) {
    this.ghosts.push(g);
  }
  move(px, py) {
    this.ghosts.forEach((g) => g.move(px, py));
  }
  moveByPlayer(dx, dy) {
    this.ghosts.forEach((g) => g.moveByPlayer(dx, dy));
  }
  death(level, x, y, w, h) {
    return this.ghosts.some((g) => {
      if (g.level !== level) return false;
      const separated =
        x > g.x + g.w || x + w < g.x || y > g.y + g.h || y + h < g.y;
      return !separated;
    });
  }
  reset() {
    this.ghosts.forEach((g) => g.reset());
  }
  draw(ctx, level) {
    this.ghosts.forEach((g) => {
      if (g.level === level) {
        const img = g.direction === 1 ? this.leftImg : this.rightImg;
        ctx.drawImage(img, g.x, g.y, g.w, g.h);
      }
    });
  }
}

class Level {
  constructor(masks, pics, spikeImg) {
    this.masks = masks;
    this.pics = pics;
    this.spikeImg = spikeImg;
    this.up = "ArrowUp";
    this.down = "ArrowDown";
    this.left = "ArrowLeft";
    this.right = "ArrowRight";
    this.x = 0;
    this.y = 0;
    this.px = 0;
    this.py = 0;
    this.level = 1;
  }
  levelChange(l) {
    this.level = l;
  }
  reset() {
    this.x = this.px;
    this.y = this.py;
  }
  colorForLevel() {
    switch (this.level) {
      case 1:
        return this.masks.level1;
      case 2:
        return this.masks.level2;
      case 3:
        return this.masks.level3;
      default:
        return this.masks.level4;
    }
  }
  clear(xx, yy, w, h) {
    const { data, width, height } = this.colorForLevel();
    const dx = xx - this.x;
    const dy = yy - this.y;
    const coords = [
      [dx, dy],
      [dx + w, dy],
      [dx, dy + h],
      [dx + w, dy + h],
    ];
    for (const [cx, cy] of coords) {
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) {
        return false;
      }
      const idx = (Math.floor(cy) * width + Math.floor(cx)) * 4;
      const c = packColor(
        data.data[idx],
        data.data[idx + 1],
        data.data[idx + 2],
        data.data[idx + 3]
      );
      if (c === wallColor) {
        return false;
      }
    }
    return true;
  }
  exit(xx, yy) {
    const { data, width, height } = this.colorForLevel();
    const dx = xx + this.px - this.x;
    const dy = yy + this.py - this.y;
    if (dx < 0 || dy < 0 || dx >= width || dy >= height) return false;
    const idx = (Math.floor(dy) * width + Math.floor(dx)) * 4;
    const c = packColor(
      data.data[idx],
      data.data[idx + 1],
      data.data[idx + 2],
      data.data[idx + 3]
    );
    if (c !== exitColor) {
      return false;
    }
    if (this.level === 4) {
      this.levelChange(1);
    } else if (this.level === 3) {
      this.levelChange(4);
    } else if (this.level === 2) {
      this.levelChange(3);
    } else {
      this.levelChange(2);
    }
    return true;
  }
  move(spikes, ghosts, keys, xx, yy, w, h) {
    if (keys[this.up] && this.clear(xx, yy - 6, w, h)) {
      this.y += 6;
      spikes.moveByPlayer(0, 6);
      ghosts.moveByPlayer(0, 6);
    }
    if (keys[this.down] && this.clear(xx, yy + 6, w, h)) {
      this.y -= 6;
      spikes.moveByPlayer(0, -6);
      ghosts.moveByPlayer(0, -6);
    }
    if (keys[this.left] && this.clear(xx - 6, yy, w, h)) {
      this.x += 6;
      spikes.moveByPlayer(6, 0);
      ghosts.moveByPlayer(6, 0);
    }
    if (keys[this.right] && this.clear(xx + 6, yy, w, h)) {
      this.x -= 6;
      spikes.moveByPlayer(-6, 0);
      ghosts.moveByPlayer(-6, 0);
    }
  }
  draw(ctx) {
    const pic =
      this.level === 1
        ? this.pics.level1
        : this.level === 2
        ? this.pics.level2
        : this.level === 3
        ? this.pics.level3
        : this.pics.level4;
    ctx.drawImage(pic, this.x, this.y);
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.baseWidth = BASE_W;
    this.baseHeight = BASE_H;
    this.currentScale = 1;
    this.dpr = window.devicePixelRatio || 1;
    this.keys = {};
    this.screen = INTRO;
    this.level = 1;
    this.hearts = 4;
    this.last = 0;
    this.assets = null;
    this.player = null;
    this.button1 = new Button(300, 450, 200, 60);
    this.button2 = new Button(300, 550, 200, 60);
    this.levelBackground = null;
    this.spikesOrganizer = null;
    this.ghostOrganizer = null;
    this.setupResize();
    this.setupInput();
    this.init();
  }

  setupResize() {
    const resize = () => {
      const fit = Math.min(
        window.innerWidth / this.baseWidth,
        window.innerHeight / this.baseHeight
      );
      this.currentScale = fit;
      this.dpr = window.devicePixelRatio || 1;
      this.canvas.style.width = `${this.baseWidth * fit}px`;
      this.canvas.style.height = `${this.baseHeight * fit}px`;
      this.canvas.width = Math.floor(this.baseWidth * fit * this.dpr);
      this.canvas.height = Math.floor(this.baseHeight * fit * this.dpr);
      this.ctx.setTransform(fit * this.dpr, 0, 0, fit * this.dpr, 0, 0);
    };
    window.addEventListener("resize", resize);
    resize();
  }

  setupInput() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
    this.canvas.addEventListener("mousedown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / this.currentScale;
      const y = (e.clientY - rect.top) / this.currentScale;
      this.onClick(x, y);
    });
  }

  async init() {
    this.assets = await this.loadAssets();
    this.player = new Player(
      250,
      385,
      40,
      35,
      this.assets.playerImages,
      this.keys
    );
    this.spikesOrganizer = new SpikesOrganizer(this.assets.spikePic);
    this.ghostOrganizer = new GhostOrganizer(
      this.assets.ghostLeft,
      this.assets.ghostRight
    );
    this.levelBackground = new Level(
      this.assets.masks,
      this.assets.levelPics,
      this.assets.spikePic
    );
    this.initSpikes();
    this.initGhosts();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  initSpikes() {
    const add = (s) => this.spikesOrganizer.add(s);
    add(new Spikes(130, 2, 1, 400, 390, 60, 42));
    add(new Spikes(40, 3, 2, 500, 185, 60, 42));
    add(new Spikes(30, 3, 2, 500, 620, 60, 42));
    add(new Spikes(40, 3, 2, 920, 185, 60, 42));
    add(new Spikes(30, 3, 2, 920, 620, 60, 42));
    add(new Spikes(150, 2, 2, 1450, 650, 60, 42));
    add(new Spikes(150, 2, 2, 1450, 200, 60, 42));
    add(new Spikes(150, 2, 2, 1700, 600, 60, 42));
    add(new Spikes(150, 2, 2, 1700, 250, 60, 42));
    add(new Spikes(130, 2, 3, 470, 180, 100, 45));
    add(new Spikes(130, 2, 3, 470, 400, 100, 45));
    add(new Spikes(130, 2, 3, 470, 620, 100, 45));
    add(new Spikes(150, 3, 3, 1615, 400, 90, 45));
    add(new Spikes(150, 3, 3, 1900, 400, 100, 45));
    add(new Spikes(250, 2, 3, 2600, 210, 100, 45));
    add(new Spikes(200, 2, 3, 2600, 580, 100, 45));
    add(new Spikes(600, 3, 4, 200, 500, 100, 45));
    add(new Spikes(600, 3, 4, 1200, 500, 100, 45));
    add(new Spikes(400, 3, 4, 1600, 500, 100, 45));
    add(new Spikes(200, 2, 4, 2200, 1000, 100, 45));
    add(new Spikes(100, 3, 4, 2850, 300, 100, 45));
    add(new Spikes(80, 3, 4, 2600, 900, 100, 45));
    add(new Spikes(150, 2, 4, 2200, 1380, 100, 45));
    add(new Spikes(150, 2, 4, 2600, 1500, 100, 45));
  }

  initGhosts() {
    const add = (g) => this.ghostOrganizer.add(g);
    add(new Ghost(2, 1, 1200, 390, 32, 40));
    add(new Ghost(2, 1, 1800, 600, 32, 40));
    add(new Ghost(3, 1, 1000, 390, 32, 40));
    add(new Ghost(3, 1, 2400, 390, 32, 40));
    add(new Ghost(3, 1, 3800, 400, 32, 40));
    add(new Ghost(4, 1, 150, 300, 32, 40));
    add(new Ghost(4, 1, 1640, 900, 32, 40));
    add(new Ghost(4, 1, 1640, 250, 32, 40));
    add(new Ghost(4, 1, 2700, 800, 32, 40));
    add(new Ghost(4, 1, 2300, 300, 32, 40));
  }

  async loadAssets() {
    const [
      level1Mask,
      level2Mask,
      level3Mask,
      level4Mask,
      level1Pic,
      level2Pic,
      level3Pic,
      level4Pic,
      introBackground,
      tutorialBackground,
      deathBackground,
      completeBackground,
      startPic,
      restartPic,
      tutorialPic,
      menuPic,
      star,
      greyStar,
      heart,
      darkness,
      spikePic,
      ghostLeft,
      ghostRight,
      idleLeft,
      idleRight,
      ...runs
    ] = await Promise.all([
      loadMask("./images/Level_1_Mask.png"),
      loadMask("./images/Level_2_Mask.png"),
      loadMask("./images/Level_3_Mask.png"),
      loadMask("./images/Level_4_Mask.png"),
      loadImage("./images/Level_1_Background.png"),
      loadImage("./images/Level_2_Background.png"),
      loadImage("./images/Level_3_Background.png"),
      loadImage("./images/Level_4_Background.png"),
      loadImage("./images/Castle.png"),
      loadImage("./images/Instructions.png"),
      loadImage("./images/death_background.png"),
      loadImage("./images/complete_background.png"),
      loadImage("./images/start.png"),
      loadImage("./images/restart.png"),
      loadImage("./images/tutorial.png"),
      loadImage("./images/menu.png"),
      loadImage("./images/star.png"),
      loadImage("./images/grey_star.png"),
      loadImage("./images/heart.png"),
      loadImage("./images/darkness.png"),
      loadImage("./images/spikes.png"),
      loadImage("./images/ghost_left.png"),
      loadImage("./images/ghost_right.png"),
      loadImage("./images/idle_left.png"),
      loadImage("./images/idle_right.png"),
      loadImage("./images/Knight_runLeft_1.png"),
      loadImage("./images/Knight_runLeft_2.png"),
      loadImage("./images/Knight_runLeft_3.png"),
      loadImage("./images/Knight_runLeft_4.png"),
      loadImage("./images/Knight_runRight_1.png"),
      loadImage("./images/Knight_runRight_2.png"),
      loadImage("./images/Knight_runRight_3.png"),
      loadImage("./images/Knight_runRight_4.png"),
    ]);

    return {
      masks: {
        level1: level1Mask,
        level2: level2Mask,
        level3: level3Mask,
        level4: level4Mask,
      },
      levelPics: { level1: level1Pic, level2: level2Pic, level3: level3Pic, level4: level4Pic },
      introBackground,
      tutorialBackground,
      deathBackground,
      completeBackground,
      startPic,
      restartPic,
      tutorialPic,
      menuPic,
      star,
      greyStar,
      heart,
      darkness,
      spikePic,
      ghostLeft,
      ghostRight,
      playerImages: {
        idleLeft,
        idleRight,
        runLeft1: runs[0],
        runLeft2: runs[1],
        runLeft3: runs[2],
        runLeft4: runs[3],
        runRight1: runs[4],
        runRight2: runs[5],
        runRight3: runs[6],
        runRight4: runs[7],
      },
    };
  }

  onClick(x, y) {
    if (this.button1.hit(x, y)) {
      if (this.screen === INTRO || this.screen === DEATH || this.screen === COMPLETE) {
        this.screen = GAME;
        this.level = 1;
        this.hearts = 4;
      }
    }
    if (this.button2.hit(x, y)) {
      if (this.screen === INTRO) {
        this.screen = TUTORIAL;
      } else if (this.screen === COMPLETE || this.screen === DEATH || this.screen === TUTORIAL) {
        this.screen = INTRO;
        this.level = 1;
        this.hearts = 4;
      }
    }
  }

  death() {
    this.hearts -= 1;
    this.levelBackground.reset();
    this.ghostOrganizer.reset();
    this.spikesOrganizer.reset();
    if (this.hearts <= 0) {
      this.screen = DEATH;
      this.level = 1;
      this.levelBackground.levelChange(1);
    }
  }

  moveGame() {
    this.levelBackground.move(
      this.spikesOrganizer,
      this.ghostOrganizer,
      this.keys,
      this.player.x,
      this.player.y,
      this.player.w,
      this.player.h
    );
    this.spikesOrganizer.move();
    this.ghostOrganizer.move(this.player.x, this.player.y);
    if (
      this.spikesOrganizer.death(
        this.levelBackground.level,
        this.player.x,
        this.player.y,
        this.player.w,
        this.player.h
      ) ||
      this.ghostOrganizer.death(
        this.levelBackground.level,
        this.player.x,
        this.player.y,
        this.player.w,
        this.player.h
      )
    ) {
      this.death();
    }
    if (this.levelBackground.exit(this.player.x, this.player.y)) {
      this.levelBackground.reset();
      this.ghostOrganizer.reset();
      this.spikesOrganizer.reset();
      if (this.level === 4) {
        this.screen = COMPLETE;
        this.level = 1;
      } else if (this.level === 3) {
        this.level = 4;
      } else if (this.level === 2) {
        this.level = 3;
      } else {
        this.level = 2;
      }
      this.levelBackground.levelChange(this.level);
    }
  }

  drawIntro() {
    const g = this.ctx;
    g.drawImage(this.assets.introBackground, 0, 0, 800, 800);
    g.fillStyle = "black";
    g.font = "bold 170px Arial";
    g.fillText("RUNNER", 50, 350);
    g.fillStyle = "orange";
    g.fillText("RUNNER", 40, 340);
    this.button1.draw(g, this.assets.startPic);
    this.button2.draw(g, this.assets.tutorialPic);
  }

  drawGame() {
    const g = this.ctx;
    g.fillStyle = "black";
    g.fillRect(0, 0, 800, 800);
    this.levelBackground.draw(g);
    this.spikesOrganizer.draw(g, this.levelBackground.level);
    this.ghostOrganizer.draw(g, this.levelBackground.level);
    this.player.draw(g);
    g.drawImage(this.assets.darkness, 0, 0, 800, 800);
    if (this.hearts > 0) {
      g.drawImage(this.assets.heart, 40, 30, 100, 100);
    }
    if (this.hearts > 1) {
      g.drawImage(this.assets.heart, 180, 30, 100, 100);
    }
    if (this.hearts > 2) {
      g.drawImage(this.assets.heart, 320, 30, 100, 100);
    }
    if (this.hearts > 3) {
      g.drawImage(this.assets.heart, 460, 30, 100, 100);
    }
  }

  drawTutorial() {
    const g = this.ctx;
    g.drawImage(this.assets.tutorialBackground, 0, 0, 800, 800);
    g.fillStyle = "black";
    g.font = "bold 120px Arial";
    g.fillText("Tutorial", 200, 200);
    g.fillStyle = "blue";
    g.fillText("Tutorial", 208, 190);
    this.button2.draw(g, this.assets.menuPic);
  }

  drawComplete() {
    const g = this.ctx;
    g.drawImage(this.assets.completeBackground, 0, 0, 800, 800);
    if (this.hearts === 4) {
      g.drawImage(this.assets.star, 50, 50, 200, 200);
      g.drawImage(this.assets.star, 300, 50, 200, 200);
      g.drawImage(this.assets.star, 550, 50, 200, 200);
    } else if (this.hearts === 3) {
      g.drawImage(this.assets.star, 50, 50, 200, 200);
      g.drawImage(this.assets.star, 300, 50, 200, 200);
      g.drawImage(this.assets.greyStar, 560, 50, 200, 200);
    } else if (this.hearts === 2) {
      g.drawImage(this.assets.star, 50, 50, 200, 200);
      g.drawImage(this.assets.greyStar, 300, 50, 200, 200);
      g.drawImage(this.assets.greyStar, 550, 50, 200, 200);
    } else {
      g.drawImage(this.assets.greyStar, 50, 50, 200, 200);
      g.drawImage(this.assets.greyStar, 300, 50, 200, 200);
      g.drawImage(this.assets.greyStar, 550, 50, 200, 200);
    }
    g.fillStyle = "black";
    g.font = "bold 70px Arial";
    g.fillText("Congratulations", 160, 410);
    g.fillStyle = "yellow";
    g.fillText("Congratulations", 154, 400);
    this.button1.draw(g, this.assets.restartPic);
    this.button2.draw(g, this.assets.menuPic);
  }

  drawDeath() {
    const g = this.ctx;
    g.drawImage(this.assets.deathBackground, 0, 0, 800, 800);
    g.fillStyle = "black";
    g.font = "bold 130px Arial";
    g.fillText("Try Again", 100, 350);
    g.fillStyle = "blue";
    g.fillText("Try Again", 108, 342);
    this.button1.draw(g, this.assets.restartPic);
    this.button2.draw(g, this.assets.menuPic);
  }

  draw() {
    if (!this.assets) return;
    if (this.screen === INTRO) this.drawIntro();
    else if (this.screen === GAME) this.drawGame();
    else if (this.screen === TUTORIAL) this.drawTutorial();
    else if (this.screen === COMPLETE) this.drawComplete();
    else if (this.screen === DEATH) this.drawDeath();
  }

  loop(timestamp) {
    if (this.screen === GAME) {
      this.moveGame();
    }
    this.draw();
    this.last = timestamp;
    requestAnimationFrame((ts) => this.loop(ts));
  }
}

const canvas = document.getElementById("game");
new Game(canvas);
