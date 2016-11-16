const Ship = require("./ship");
const Bullet = require('./bullet');
const Shield = require('./shield');
const ShieldPiece = require('./shield_piece');
const Star = require("./star");
const Util = require("./util");

const Game = function(options) {
  this.canvasSize = options.canvasSize;
  this.ctx = options.ctx;
  this.stars = [];
  this.defender = null;
  this.defenderLives = 2;
  this.score = 0;
  this.invaderShips = [];
  this.bullets = [];
  this.shields = [];
  this.shieldPieces = [];
  this.gameView = options.gameView;

  this.DIM_X = this.canvasSize[0];
  this.DIM_Y = this.canvasSize[1];

  this.addStars();
  this.addDefenderShip();
  this.addInvaderShips();
  this.addShields();
};

Game.BG_COLOR = "#000000";
Game.NUM_STARS = 40;

Game.prototype.randomPosition = function() {
  return [
    this.DIM_X * Math.random(),
    this.DIM_Y * Math.random()
  ];
};

Game.prototype.addStars = function() {
  for (let i = 0; i < Game.NUM_STARS; i++) {
    this.stars.push(new Star({
      id: i,
      color: "#ffffff",
      pos: this.randomPosition(),
      vel: Util.randomVec(8),
      game: this
    }));
  }
};

Game.prototype.addInvaderShips = function () {
  let invaderShipName;
  let invaderShipImage;
  let y = 80;

  for (let row = 0; row < 5; row++) {
    if (row < 1) {
      invaderShipName = 'invader';
      invaderShipImage = document.getElementById('invader-1');
    } else if (row < 3) {
      invaderShipName = 'soldier';
      invaderShipImage = document.getElementById('soldier-1');
    } else if (row > 2) {
      invaderShipName = 'grunt';
      invaderShipImage = document.getElementById('grunt-1');
    }

    for (let x = 1; x < 12; x++) {
      let invaderShip = new Ship ({
        name: invaderShipName,
        game: this,
        canvasSize: this.canvasSize,
        img: invaderShipImage,
        pos: [
          x * 50,
          y
        ],
        vel: [0.3, 0],
        side: 'invader'
      });
      this.invaderShips.push(invaderShip);
    }
    y += 40;
  }

};

Game.prototype.addShields = function() {
  for (let i = 0, x = .07; i < 5; i++, x += 0.2) {
    let shieldPosX = this.canvasSize[0] * x;
    let shieldPosY = this.canvasSize[1] * .8;

    let shield = new Shield ({
      id: i,
      pos: [shieldPosX, shieldPosY],
      radius: 15,
      color: "#00ff00",
      game: this
    });

    shield.draw(this.ctx);
    // this.shields.push(shield);
  }
};

Game.prototype.addDefenderShip = function() {
  const defender = new Ship ({
    name: 'defender',
    game: this,
    canvasSize: this.canvasSize,
    img: document.getElementById('defender'),
    pos: [
      (this.canvasSize[0] - 30) * .52,
      this.canvasSize[1] - 70
    ],
    vel: [0, 0],
    side: 'defender'
  });
  this.defender = defender;
};

Game.prototype.getAllObjects = function() {
  return [].concat(
    this.shieldPieces,
    this.bullets,
    this.invaderShips,
    this.stars
  );
};

Game.prototype.moveObjects = function() {
  this.getAllObjects().forEach(object => {
    object.move();
  });
};

Game.prototype.reverseAllInvaders = function() {
  this.invaderShips.forEach(invader => {
    invader.reverse();
  });
};

Game.prototype.wrap = function(pos) {
  let x = pos[0], y = pos[1];
  let maxX = this.DIM_X, maxY = this.DIM_Y;

  let wrappedX = Util.wrap(x, maxX);
  let wrappedY = Util.wrap(y, maxY);

  return [wrappedX, wrappedY];
};

Game.prototype.draw = function(ctx) {
  ctx.clearRect(0, 0, this.DIM_X, this.DIM_Y);
  ctx.fillStyle = Game.BG_COLOR;
  ctx.fillRect(0, 0, this.DIM_X, this.DIM_Y);

  this.defender.draw(ctx);

  this.getAllObjects().forEach(object => {
    object.draw(ctx);
  });
};

Game.prototype.lose = function() {
  this.ctx.clearRect(0, 0, this.DIM_X, this.DIM_Y);
  this.ctx.fillStyle = 'red';
  this.ctx.fillRect(0, 0, this.DIM_X, this.DIM_Y);
  this.gameView.stop();
};

Game.prototype.winRound = function() {
  if (this.invaderShips.length === 0) {
    this.addInvaderShips();
    this.defenderLives += 1;
  }
};

Game.prototype.isOutOfBounds = function (pos) {
  return (pos[0] < 0) || (pos[1] < 0) ||
    (pos[0] > this.DIM_X) || (pos[1] > this.DIM_Y);
};

Game.prototype.collisionObjects = function() {
  return [].concat(
    this.bullets,
    this.invaderShips,
    this.defender,
    this.shieldPieces
  );
};

// This method makes enemy ships shoot bullets
Game.prototype.enemyFire = function() {
  this.invaderShips.forEach(invader => {
    let fire = Math.random() * 5000;
    if (fire < 1) {
      invader.fireBullet();
      invader.currentBullet = false;
    }
  });
};

// This method makes enemy ships move faster with each one that dies
Game.prototype.increaseInvadersSpeed = function() {
  this.invaderShips.forEach(invader => {
    invader.increaseSpeed();
  });
};

Game.prototype.checkCollisions = function() {
  let collisionObjects = this.collisionObjects();
  for (var i = 0; i < collisionObjects.length; i++) {
    for (var j = 0; j < collisionObjects.length; j++) {

      let object1 = collisionObjects[i];
      let object2 = collisionObjects[j];

      let options = {
        ship: Ship,
        bullet: Bullet,
        shieldPiece: ShieldPiece,
        object1: object1,
        object2: object2
      };

      if (Util.validCollision(options)) {
        if (object1.isCollidedWith(object2)) {
          // collideWith handles logic for removing objects off of canvas
          object1.collideWith(object2);
        }
      }

    }
  }
};

Game.prototype.remove = function(object) {
  if (object instanceof Bullet) {
    this.bullets.splice(this.bullets.indexOf(object), 1);
  } else if (object instanceof Ship) {
    this.invaderShips.splice(this.invaderShips.indexOf(object), 1);
  } else if (object instanceof ShieldPiece) {
    this.shieldPieces.splice(this.shieldPieces.indexOf(object), 1);
  }
};

Game.prototype.step = function() {
  this.moveObjects();
  this.checkCollisions();
  this.enemyFire();
  this.winRound();
};

module.exports = Game;