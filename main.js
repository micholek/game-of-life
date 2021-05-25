const Controls = Object.freeze({
  start: document.getElementById('start'),
  pause: document.getElementById('pause'),
  stop: document.getElementById('stop'),
  interval_time: document.getElementById('interval_time'),
  presets: document.getElementById('presets'),
});

const generation_number = document.getElementById('generation_number');

const GameOptions = {
  ROW_SQUARES_NUMBER: 60,
  COL_SQUARES_NUMBER: 35,
  SQUARE_WIDTH: 25,
  DEFAULT_INTERVAL_TIME: 100,
  PRESETS: {
    blinker: [253, 254, 255],
    pulsar: [
      265, 271, 325, 331, 385, 386, 390, 391, 501, 502, 503, 506, 507, 509, 510,
      513, 514, 515, 563, 565, 567, 569, 571, 573, 625, 626, 630, 631, 745, 746,
      750, 751, 803, 805, 807, 809, 811, 813, 861, 862, 863, 866, 867, 869, 870,
      873, 874, 875, 985, 986, 990, 991, 1045, 1051, 1105, 1111,
    ],
    glider_gun: [
      816, 874, 876, 924, 925, 932, 933, 946, 947, 983, 987, 992, 993, 1006,
      1007, 1032, 1033, 1042, 1048, 1052, 1053, 1092, 1093, 1102, 1106, 1108,
      1109, 1114, 1116, 1162, 1168, 1176, 1223, 1227, 1284, 1285,
    ],
    handshake: [929, 930, 988, 990, 991, 1047, 1048, 1050, 1108, 1109],
  },
};

const GameState = Object.freeze({ Play: 1, Pause: 2, Stop: 3 });
const CellState = Object.freeze({ Alive: 1, Dead: 2 });

class Cell {
  constructor(x, y, width) {
    this.dead_cell_color = 'rgb(222, 221, 217)';
    this.alive_cell_color = 'rgb(248, 255, 31)';
    this.cell_color = this.dead_cell_color;
    this.border_color = 'rgb(242, 241, 237)';
    this.interval_id = null;
    this.x = x;
    this.y = y;
    this.x_pos = this.x * width;
    this.y_pos = this.y * width;
    this.width = width;
    this.state = CellState.Dead;
    this.interval_time = GameOptions.DEFAULT_INTERVAL_TIME;
  }

  clone() {
    const cloned_cell = new Cell(this.x, this.y, this.width);
    cloned_cell.state = this.state;
    return cloned_cell;
  }

  set_alive() {
    this.state = CellState.Alive;
    this.cell_color = this.alive_cell_color;
  }

  set_dead() {
    this.state = CellState.Dead;
    this.cell_color = this.dead_cell_color;
  }

  update(neighbor_cells) {
    const alive_neighbors_number = neighbor_cells.filter(
      (cell) => cell.state == CellState.Alive
    ).length;
    if (
      this.state === CellState.Alive &&
      (alive_neighbors_number < 2 || alive_neighbors_number > 3)
    ) {
      this.set_dead();
    }
    if (this.state === CellState.Dead && alive_neighbors_number === 3) {
      this.set_alive();
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.border_color;
    ctx.fillRect(this.x_pos, this.y_pos, this.width, this.width);
    ctx.fillStyle = this.cell_color;
    ctx.fillRect(
      this.x_pos + 1,
      this.y_pos + 1,
      this.width - 2,
      this.width - 2
    );
  }
}

class Game {
  constructor(preset = GameOptions.PRESETS.blinker) {
    this.canvas = document.getElementById('canvas');
    this.canvas.width =
      GameOptions.ROW_SQUARES_NUMBER * GameOptions.SQUARE_WIDTH;
    this.canvas.height =
      GameOptions.COL_SQUARES_NUMBER * GameOptions.SQUARE_WIDTH;
    this.ctx = this.canvas.getContext('2d');
    this.preset = preset;
    this.state = GameState.Stop;
    this.interval_time = GameOptions.DEFAULT_INTERVAL_TIME;
    this.reset();
  }

  reset() {
    this.generation_number = 0;
    generation_number.textContent = 0;
    this.load_preset_and_draw();
  }

  load_preset_and_draw() {
    this.cells = [];
    for (
      let index = 0;
      index < GameOptions.ROW_SQUARES_NUMBER * GameOptions.COL_SQUARES_NUMBER;
      index++
    ) {
      const x = index % GameOptions.ROW_SQUARES_NUMBER;
      const y = Math.floor(index / GameOptions.ROW_SQUARES_NUMBER);
      this.cells.push(new Cell(x, y, GameOptions.SQUARE_WIDTH));
      if (this.preset.includes(index)) {
        this.cells[index].set_alive();
      }
    }
    this.draw();
  }

  cell_neighbors(x, y) {
    const cells = this.old_cells;
    let neighbors = [];
    if (x > 0) {
      neighbors.push(cells[x - 1 + y * GameOptions.ROW_SQUARES_NUMBER]);
      if (y > 0) {
        neighbors.push(cells[x - 1 + (y - 1) * GameOptions.ROW_SQUARES_NUMBER]);
      }
      if (y < GameOptions.COL_SQUARES_NUMBER - 1) {
        neighbors.push(cells[x - 1 + (y + 1) * GameOptions.ROW_SQUARES_NUMBER]);
      }
    }
    if (x < GameOptions.ROW_SQUARES_NUMBER - 1) {
      neighbors.push(cells[x + 1 + y * GameOptions.ROW_SQUARES_NUMBER]);
      if (y > 0) {
        neighbors.push(cells[x + 1 + (y - 1) * GameOptions.ROW_SQUARES_NUMBER]);
      }
      if (y < GameOptions.COL_SQUARES_NUMBER - 1) {
        neighbors.push(cells[x + 1 + (y + 1) * GameOptions.ROW_SQUARES_NUMBER]);
      }
    }
    if (y > 0) {
      neighbors.push(cells[x + (y - 1) * GameOptions.ROW_SQUARES_NUMBER]);
    }
    if (y < GameOptions.COL_SQUARES_NUMBER - 1) {
      neighbors.push(cells[x + (y + 1) * GameOptions.ROW_SQUARES_NUMBER]);
    }
    return neighbors;
  }

  update() {
    this.old_cells = this.cells.map((cell) => cell.clone());
    for (const cell of this.cells) {
      cell.update(this.cell_neighbors(cell.x, cell.y));
    }
    this.generation_number++;
    generation_number.textContent = this.generation_number;
  }

  draw() {
    for (const cell of this.cells) {
      cell.draw(this.ctx);
    }
  }

  start() {
    if ([GameState.Pause, GameState.Stop].includes(this.state)) {
      this.state = GameState.Play;
      this.interval_id = setInterval(() => {
        game.update();
        game.draw();
      }, this.interval_time);
    }
  }

  pause() {
    if (this.state === GameState.Play) {
      this.state = GameState.Pause;
      clearInterval(this.interval_id);
    }
  }

  stop() {
    if ([GameState.Play, GameState.Pause].includes(this.state)) {
      this.state = GameState.Stop;
      clearInterval(this.interval_id);
      this.reset();
    }
  }
}

function init() {
  Controls.interval_time.value = GameOptions.DEFAULT_INTERVAL_TIME;
  Controls.start.onclick = () => {
    game.start();
  };
  Controls.interval_time.onchange = (event) => {
    game.interval_time = parseInt(event.target.value);
  };
  Controls.pause.onclick = () => {
    game.pause();
  };
  Controls.stop.onclick = () => {
    game.stop();
  };
  Controls.presets.onchange = (event) => {
    game.stop();
    game.preset = GameOptions.PRESETS[event.target.value];
    game.load_preset_and_draw();
  };
  for (const name of Object.keys(GameOptions.PRESETS)) {
    const option = document.createElement('option');
    option.value = name;
    option.text = name;
    Controls.presets.appendChild(option);
  }
}

let game = new Game(GameOptions.PRESETS.blinker);

init();
