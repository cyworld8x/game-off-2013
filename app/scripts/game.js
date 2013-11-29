(function() {
  window.Game = {
    init: function() {
      var Q;
      this.Q = Q = Quintus({
        development: true,
        audioSupported: ['ogg', 'mp3']
      });
      Q.include("Sprites, Scenes, Input, Touch, UI, 2D, Anim, Audio");
      Q.setup({
        maximize: true,
        upsampleWidth: 640,
        upsampleHeight: 320
      });
      Q.controls().touch();
      Q.enableSound();
      Game.storageKey = "zombieGame:availableLevel";
      Game.availableLevel = localStorage.getItem(Game.storageKey) || 1;
      this.SPRITE_NONE = 0;
      this.SPRITE_PLAYER = 1;
      this.SPRITE_TILES = 2;
      this.SPRITE_ENEMY = 4;
      this.SPRITE_BULLET = 8;
      this.SPRITE_PLAYER_COLLECTIBLE = 16;
      this.SPRITE_HUMAN = 32;
      this.SPRITE_ZOMBIE_PLAYER = 64;
      this.SPRITE_ALL = 0xFFFF;
      this.prepareAssets();
      this.initStats();
      Q.tilePos = function(col, row, otherParams) {
        var position;
        if (otherParams == null) {
          otherParams = {};
        }
        position = {
          x: col * Game.assets.map.tileSize + Game.assets.map.tileSize / 2,
          y: row * Game.assets.map.tileSize + Game.assets.map.tileSize / 2
        };
        return Q._extend(position, otherParams);
      };
    },
    prepareAssets: function() {
      var assetsAsArray, audioAsArray;
      this.assets = {
        characters: {
          dataAsset: "characters.json",
          sheet: "characters.png"
        },
        items: {
          dataAsset: "items.json",
          sheet: "items.png"
        },
        hud: {
          dataAsset: "hud.json",
          sheet: "hud.png"
        },
        map: {
          sheet: "map_tiles.png",
          bg: "bg.png"
        },
        level1: {
          dataAsset: "level1.tmx"
        },
        level2: {
          dataAsset: "level2.tmx"
        },
        level3: {
          dataAsset: "level3.tmx"
        },
        level4: {
          dataAsset: "level4.tmx"
        },
        level5: {
          dataAsset: "level5.tmx"
        },
        level6: {
          dataAsset: "level6.tmx"
        }
      };
      this.audio = {
        zombieMode: "zombie_mode.mp3",
        playerBg: "player_bg.mp3",
        zombieNotice: "zombie_notice.mp3",
        gunShot: "gun_shot.mp3",
        collected: "collected.mp3",
        playerHit: "player_hit.mp3",
        humanCreated: "human_created.mp3"
      };
      Game.isMuted = false;
      assetsAsArray = [];
      this.objValueToArray(this.assets, assetsAsArray);
      this.assets.map.sheetName = "tiles";
      this.assets.map.tileSize = 70;
      audioAsArray = [];
      this.objValueToArray(this.audio, audioAsArray);
      return this.assets.all = assetsAsArray.concat(audioAsArray);
    },
    objValueToArray: function(obj, array) {
      var key, value, _results;
      _results = [];
      for (key in obj) {
        value = obj[key];
        if (typeof value === 'string') {
          _results.push(array.push(value));
        } else {
          _results.push(this.objValueToArray(value, array));
        }
      }
      return _results;
    },
    initStats: function() {
      var stats;
      this.Q.stats = stats = new Stats();
      stats.setMode(0);
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.left = '0px';
      stats.domElement.style.top = '140px';
      return document.body.appendChild(stats.domElement);
    },
    stageLevel: function(number) {
      var Q;
      if (number == null) {
        number = 1;
      }
      Q = this.Q;
      Q.state.reset({
        enemiesCounter: 0,
        lives: 3,
        bullets: 0,
        hasKey: false,
        hasGun: false,
        currentLevel: number
      });
      Game.currentLevelData = {
        zombies: {
          healed: 0,
          available: 0
        },
        health: {
          collected: 0,
          available: 0
        },
        bullets: {
          waisted: 0,
          available: 0
        },
        zombieModeFound: false
      };
      Q.input.touchControls();
      Q.clearStages();
      Q.stageScene("level" + number, {
        sort: true
      });
      Q.stageScene("hud", 1, {
        sort: true
      });
      return Game.infoLabel.intro();
    },
    stageLevelSelectScreen: function() {
      if (this.Q.state.get("currentLevel") === 6) {
        this.stageEndScreen();
        return;
      }
      this.Q.input.disableTouchControls();
      this.Q.clearStages();
      return this.Q.stageScene("levelSelect");
    },
    stageEndLevelScreen: function() {
      this.Q.input.disableTouchControls();
      this.Q.clearStages();
      return this.Q.stageScene("levelSummary", Game.currentLevelData);
    },
    stageStartScreen: function() {
      this.Q.clearStages();
      return this.Q.stageScene("start");
    },
    stageEndScreen: function() {
      this.Q.clearStages();
      return this.Q.stageScene("end");
    },
    stageControlsScreen: function() {
      this.Q.clearStages();
      return this.Q.stageScene("controls");
    },
    setCameraTo: function(stage, toFollowObj) {
      return stage.follow(toFollowObj, {
        x: true,
        y: true
      }, {
        minX: 0,
        maxX: Game.map.p.w,
        minY: 0,
        maxY: Game.map.p.h
      });
    }
  };

  Game.init();

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.AudioManager = {
    collection: [],
    muted: false,
    add: function(audio, options) {
      var alreadyAdded, item;
      item = {
        audio: audio,
        options: options
      };
      if ((options != null ? options.loop : void 0) === true) {
        alreadyAdded = this.find(audio);
        if (alreadyAdded === false) {
          this.collection.push(item);
        }
      }
      if (!this.muted) {
        return Q.audio.play(item.audio, item.options);
      }
    },
    remove: function(audio) {
      var indexToRemove;
      indexToRemove = null;
      indexToRemove = this.find(audio);
      if (indexToRemove >= 0) {
        Q.audio.stop(this.collection[indexToRemove].audio);
        return this.collection.splice(indexToRemove, 1);
      }
    },
    find: function(audio) {
      var index, item, _i, _len, _ref;
      _ref = this.collection;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        item = _ref[index];
        if (item.audio === audio) {
          return index;
        }
      }
      return false;
    },
    playAll: function() {
      var item, _i, _len, _ref, _results;
      _ref = this.collection;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        _results.push(Q.audio.play(item.audio, item.options));
      }
      return _results;
    },
    stopAll: function() {
      return Q.audio.stop();
    },
    clear: function() {
      return this.collection = [];
    },
    mute: function() {
      this.muted = true;
      return this.stopAll();
    },
    unmute: function() {
      this.muted = false;
      return this.playAll();
    }
  };

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.component("gun", {
    added: function() {
      var p;
      Q.input.on("fire", this.entity, "fireGun");
      p = this.entity.p;
      p.sheet = "player_with_gun";
      p.sprite = "playerWithGun";
      this.entity.play("stand");
      if (Q.state.get("bullets") > 0) {
        p.noOfBullets = Q.state.get("bullets");
      }
      return p.nextFireTimeout = 0;
    },
    destroyed: function() {
      return Q.input.off("fire", this.entity);
    },
    extend: {
      gunStep: function(dt) {
        if (this.p.nextFireTimeout > 0) {
          return this.p.nextFireTimeout = Math.max(this.p.nextFireTimeout - dt, 0);
        }
      },
      fireGun: function() {
        var bullet, delta;
        if (this.p.nextFireTimeout === 0) {
          this.p.nextFireTimeout = 0.5;
          if (this.p.noOfBullets > 0) {
            if (this.p.direction === "left") {
              delta = -15;
            } else {
              delta = 15;
            }
            Q.AudioManager.add(Game.audio.gunShot);
            bullet = this.stage.insert(new Q.Bullet({
              x: this.p.x + delta,
              y: this.p.y + 3,
              direction: this.p.direction
            }));
          } else {
            Game.infoLabel.outOfBullets();
          }
          this.p.noOfBullets -= 1;
          if (this.p.noOfBullets >= 0) {
            return Q.state.set("bullets", this.p.noOfBullets);
          }
        }
      }
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.component("zombieAI", {
    added: function() {
      var p;
      p = this.entity.p;
      if (p.startLeft === true) {
        p.vx = 60;
      } else {
        p.vx = -60;
      }
      return p.audioTimeout = 0;
    },
    extend: {
      zombieStep: function(dt) {
        var dirX, ground, nextTile;
        this.canSeeThePlayer();
        if (this.canSeeThePlayerObj.status) {
          this.p.canSeeThePlayerTimeout = 3;
          if (this.canSeeThePlayerObj.playAudio) {
            if (this.p.audioTimeout === 0) {
              Q.AudioManager.add(Game.audio.zombieNotice);
              this.play("attack", 10);
              this.p.audioTimeout = 10;
            }
          }
          if ((this.canSeeThePlayerObj.left && this.p.vx > 0) || (this.canSeeThePlayerObj.right && this.p.vx < 0)) {
            this.p.vx = -this.p.vx;
          }
        } else {
          this.p.canSeeThePlayerTimeout = Math.max(this.p.canSeeThePlayerTimeout - dt, 0);
        }
        this.p.audioTimeout = Math.max(this.p.audioTimeout - dt, 0);
        dirX = this.p.vx / Math.abs(this.p.vx);
        ground = Q.stage().locate(this.p.x, this.p.y + this.p.h / 2 + 1, Game.SPRITE_TILES);
        nextTile = Q.stage().locate(this.p.x + dirX * this.p.w / 2 + dirX, this.p.y + this.p.h / 2 + 1, Game.SPRITE_TILES);
        if (!nextTile && ground && !this.canSeeThePlayerObj.status && this.p.canSeeThePlayerTimeout === 0) {
          this.p.vx = -this.p.vx;
        }
        return this.flip();
      },
      flip: function() {
        if (this.p.vx > 0) {
          return this.p.flip = false;
        } else {
          return this.p.flip = "x";
        }
      },
      canSeeThePlayer: function() {
        var isCloseFromLeft, isCloseFromRight, isTheSameY, lineOfSight, oldObj, player;
        player = Game.player.p;
        lineOfSight = 350;
        oldObj = this.canSeeThePlayerObj;
        this.canSeeThePlayerObj = {
          playAudio: true,
          status: false
        };
        if ((oldObj != null ? oldObj.status : void 0) === true) {
          this.canSeeThePlayerObj.playAudio = false;
        }
        if (Game.player.isDestroyed != null) {
          return;
        }
        isTheSameY = player.y > this.p.y - 10 && player.y < this.p.y + 10;
        this.canSeeThePlayerObj.left = isCloseFromLeft = (player.x > this.p.x - lineOfSight) && player.x < this.p.x;
        this.canSeeThePlayerObj.right = isCloseFromRight = (player.x < this.p.x + lineOfSight) && player.x > this.p.x;
        if (isTheSameY && (isCloseFromLeft || isCloseFromRight)) {
          this.canSeeThePlayerObj.status = true;
        } else {
          this.canSeeThePlayerObj.status = false;
          this.canSeeThePlayerObj.playAudio = true;
        }
      }
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.load(Game.assets.all, function() {
    Q.sheet(Game.assets.map.sheetName, Game.assets.map.sheet, {
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize
    });
    Q.compileSheets(Game.assets.characters.sheet, Game.assets.characters.dataAsset);
    Q.compileSheets(Game.assets.items.sheet, Game.assets.items.dataAsset);
    Q.compileSheets(Game.assets.hud.sheet, Game.assets.hud.dataAsset);
    return Game.stageStartScreen();
  }, {
    progressCallback: function(loaded, total) {
      var container, element;
      element = document.getElementById("loading-progress");
      element.style.width = Math.floor(loaded / total * 100) + "%";
      if (loaded === total) {
        container = document.getElementById("loading");
        return container.parentNode.removeChild(container);
      }
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("controls", function(stage) {
    var button, column1Container, column2Container, column3Container, columnInP, columnWidth, columnsNo, gutterX, gutterXinP, marginX, marginXinP, marginY, step1text1, step1text2;
    marginY = Q.height * 0.25;
    marginXinP = 20;
    gutterXinP = 8;
    columnsNo = 3;
    columnInP = (100 - (marginXinP * 2) - (columnsNo - 1) * gutterXinP) / columnsNo;
    marginX = Q.width * marginXinP * 0.01;
    gutterX = Q.width * gutterXinP * 0.01;
    columnWidth = Q.width * columnInP * 0.01;
    Q.AudioManager.stopAll();
    Q.AudioManager.clear();
    stage.insert(new Q.UI.Text({
      x: Q.width / 2,
      y: marginY / 2,
      label: "How to heal’em in three steps",
      color: "#f2da38",
      family: "Jolly Lodger",
      size: 60
    }));
    column1Container = stage.insert(new Q.UI.Container({
      x: marginX + columnWidth / 2,
      y: Q.height / 2
    }));
    column2Container = stage.insert(new Q.UI.Container({
      x: column1Container.p.x + gutterX + columnWidth,
      y: Q.height / 2
    }));
    column3Container = stage.insert(new Q.UI.Container({
      x: column2Container.p.x + gutterX + columnWidth,
      y: Q.height / 2
    }));
    step1text1 = column1Container.insert(new Q.UI.Text({
      x: 0,
      y: -140,
      label: "1st",
      color: "#ec655d",
      family: "Boogaloo",
      size: 26
    }));
    step1text2 = column1Container.insert(new Q.UI.Text({
      x: 0,
      y: -100,
      label: "Move with arrows",
      color: "#9ca2ae",
      family: "Boogaloo",
      size: 30
    }));
    column1Container.insert(new Q.Sprite({
      x: 0,
      y: 0,
      sheet: "ui_controls_1"
    }));
    column2Container.insert(new Q.UI.Text({
      x: 0,
      y: step1text1.p.y,
      label: "2st",
      color: "#ec655d",
      family: "Boogaloo",
      size: 26
    }));
    column2Container.insert(new Q.UI.Text({
      x: 0,
      y: step1text2.p.y,
      label: "Find Healing Gun",
      color: "#9ca2ae",
      family: "Boogaloo",
      size: 30
    }));
    column2Container.insert(new Q.Sprite({
      x: 0,
      y: 0,
      sheet: "ui_controls_2"
    }));
    column3Container.insert(new Q.UI.Text({
      x: 0,
      y: step1text1.p.y,
      label: "3st",
      color: "#ec655d",
      family: "Boogaloo",
      size: 26
    }));
    column3Container.insert(new Q.UI.Text({
      x: 0,
      y: step1text2.p.y,
      label: "Use your Gun!",
      color: "#9ca2ae",
      family: "Boogaloo",
      size: 30
    }));
    column3Container.insert(new Q.Sprite({
      x: 0,
      y: 0,
      sheet: "ui_controls_3"
    }));
    button = stage.insert(new Q.UI.Button({
      x: Q.width / 2,
      y: Q.height - marginY,
      w: Q.width / 2,
      h: 70,
      fill: "#c4da4a",
      radius: 10,
      fontColor: "#353b47",
      font: "400 58px Jolly Lodger",
      label: "Give me some zombies",
      keyActionName: "confirm",
      type: Q.SPRITE_UI | Q.SPRITE_DEFAULT
    }));
    return button.on("click", function(e) {
      return Game.stageLevel(1);
    });
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("end", function(stage) {
    var button, marginY;
    marginY = Q.height * 0.2;
    Q.AudioManager.stopAll();
    stage.insert(new Q.UI.Text({
      x: Q.width / 2,
      y: marginY / 2,
      label: "The End",
      size: 30,
      color: "#fff",
      family: "Ubuntu"
    }));
    stage.insert(new Q.UI.Text({
      x: Q.width / 2,
      y: marginY / 2 + 100,
      label: "You did it! If you like the game give us some feedback.",
      size: 30,
      color: "#fff",
      family: "Ubuntu"
    }));
    button = stage.insert(new Q.UI.Button({
      x: Q.width / 2,
      y: marginY / 2 + 350,
      fill: "#CCCCCC",
      label: "Play again",
      keyActionName: "confirm",
      type: Q.SPRITE_UI | Q.SPRITE_DEFAULT
    }));
    button.on("click", function(e) {
      return Game.stageLevelSelectScreen();
    });
    return Q.state.set("currentLevel", 0);
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("hud", function(stage) {
    var bulletsContainer, bulletsImg, enemiesContainer, healthContainer, healthImg, infoContainer, keyContainer, keyImg, playerAvatar;
    playerAvatar = stage.insert(new Q.UI.PlayerAvatar());
    infoContainer = stage.insert(new Q.UI.Container({
      y: 40,
      fill: "#fff"
    }));
    Game.infoLabel = infoContainer.insert(new Q.UI.InfoLabel({
      container: infoContainer,
      offsetLeft: playerAvatar.p.w
    }));
    enemiesContainer = stage.insert(new Q.UI.Container({
      y: 40,
      fill: "#232322"
    }));
    enemiesContainer.insert(new Q.UI.EnemiesCounter());
    enemiesContainer.fit(0, 8);
    enemiesContainer.p.x = Q.width - enemiesContainer.p.w / 2 - 60;
    stage.insert(new Q.UI.EnemiesAvatar());
    bulletsContainer = stage.insert(new Q.UI.Container({
      y: 40,
      fill: "#232322"
    }));
    bulletsImg = bulletsContainer.insert(new Q.UI.BulletsImg());
    bulletsContainer.insert(new Q.UI.BulletsCounter({
      img: bulletsImg.p
    }));
    bulletsContainer.fit(0, 8);
    bulletsContainer.p.x = enemiesContainer.p.x - enemiesContainer.p.w / 2 - bulletsContainer.p.w / 2 - 20 + 30;
    healthContainer = stage.insert(new Q.UI.Container({
      y: 40,
      fill: "#232322"
    }));
    healthImg = healthContainer.insert(new Q.UI.HealthImg());
    healthContainer.insert(new Q.UI.HealthCounter({
      img: healthImg.p
    }));
    healthContainer.fit(0, 8);
    healthContainer.p.x = bulletsContainer.p.x - bulletsContainer.p.w / 2 - healthContainer.p.w / 2 - 20;
    keyContainer = stage.insert(new Q.UI.Container({
      y: 40,
      fill: "#232322"
    }));
    keyImg = keyContainer.insert(new Q.UI.InventoryKey());
    keyContainer.fit(5, 8);
    keyContainer.p.x = healthContainer.p.x - healthContainer.p.w / 2 - keyContainer.p.w / 2 - 34;
    stage.insert(new Q.UI.PauseButton());
    return stage.insert(new Q.UI.MenuButton());
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("level1", function(stage) {
    var background, enemies, items, map, player;
    Game.map = map = new Q.TileLayer({
      type: Game.SPRITE_TILES,
      layerIndex: 0,
      dataAsset: Game.assets.level1.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 2
    });
    stage.collisionLayer(map);
    background = new Q.TileLayer({
      layerIndex: 1,
      type: Game.SPRITE_NONE,
      dataAsset: Game.assets.level1.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 1
    });
    stage.insert(background);
    Game.player = player = stage.insert(new Q.Player(Q.tilePos(3.5, 9)));
    stage.add("viewport");
    Game.setCameraTo(stage, player);
    enemies = [["Zombie", Q.tilePos(14, 9)]];
    stage.loadAssets(enemies);
    items = [
      ["Key", Q.tilePos(14.5, 9)], ["Door", Q.tilePos(27, 9)], [
        "Gun", Q.tilePos(14.5, 3, {
          bullets: 3
        })
      ], ["Heart", Q.tilePos(14.5, 15)]
    ];
    stage.loadAssets(items);
    Game.currentLevelData.health.available = stage.lists.Heart.length;
    return Game.currentLevelData.zombies.available = stage.lists.Zombie.length;
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("level2", function(stage) {
    var background, enemies, items, map, player, random, randomItems;
    Game.map = map = new Q.TileLayer({
      type: Game.SPRITE_TILES,
      layerIndex: 0,
      dataAsset: Game.assets.level2.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 2
    });
    stage.collisionLayer(map);
    background = new Q.TileLayer({
      layerIndex: 1,
      type: Game.SPRITE_NONE,
      dataAsset: Game.assets.level2.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 1
    });
    stage.insert(background);
    Game.player = player = stage.insert(new Q.Player(Q.tilePos(2.5, 9)));
    stage.add("viewport");
    Game.setCameraTo(stage, player);
    enemies = [
      ["Zombie", Q.tilePos(9, 6)], [
        "Zombie", Q.tilePos(8, 12, {
          startLeft: true
        })
      ], [
        "Zombie", Q.tilePos(20, 6, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(21, 12)]
    ];
    stage.loadAssets(enemies);
    randomItems = [
      {
        health: Q.tilePos(14.5, 15),
        key: Q.tilePos(14.5, 3)
      }, {
        health: Q.tilePos(14.5, 3),
        key: Q.tilePos(14.5, 15)
      }
    ];
    random = Math.floor(Math.random() * 2);
    items = [
      ["Key", randomItems[random].key], ["Door", Q.tilePos(27, 9)], [
        "Gun", Q.tilePos(14.5, 9, {
          bullets: 6
        })
      ], ["Heart", randomItems[random].health]
    ];
    stage.loadAssets(items);
    Game.currentLevelData.health.available = stage.lists.Heart.length;
    return Game.currentLevelData.zombies.available = stage.lists.Zombie.length;
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("level3", function(stage) {
    var background, enemies, items, map, player, random, randomItems;
    Game.map = map = new Q.TileLayer({
      type: Game.SPRITE_TILES,
      layerIndex: 0,
      dataAsset: Game.assets.level3.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 2
    });
    stage.collisionLayer(map);
    background = new Q.TileLayer({
      layerIndex: 1,
      type: Game.SPRITE_NONE,
      dataAsset: Game.assets.level3.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 1
    });
    stage.insert(background);
    Game.player = player = stage.insert(new Q.Player(Q.tilePos(24.5, 14)));
    stage.add("viewport");
    Game.setCameraTo(stage, player);
    enemies = [
      ["Zombie", Q.tilePos(8, 11)], [
        "Zombie", Q.tilePos(9, 17, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(18, 5)], ["Zombie", Q.tilePos(19, 23)], ["Zombie", Q.tilePos(31, 5)], ["Zombie", Q.tilePos(30, 23)], ["Zombie", Q.tilePos(41, 11)], [
        "Zombie", Q.tilePos(42, 17, {
          startLeft: true
        })
      ]
    ];
    stage.loadAssets(enemies);
    randomItems = [
      {
        door: Q.tilePos(46.5, 14),
        key: Q.tilePos(2.5, 14)
      }, {
        door: Q.tilePos(2.5, 14),
        key: Q.tilePos(46.5, 14)
      }
    ];
    random = Math.floor(Math.random() * 2);
    items = [
      ["Key", randomItems[random].key], ["Door", randomItems[random].door], ["ExitSign", randomItems[random].exitSign], [
        "Gun", Q.tilePos(24.5, 2, {
          bullets: 10
        })
      ], ["Heart", Q.tilePos(8, 5)], ["Heart", Q.tilePos(41.5, 5)], ["Heart", Q.tilePos(24.5, 26)]
    ];
    stage.loadAssets(items);
    Game.currentLevelData.health.available = stage.lists.Heart.length;
    return Game.currentLevelData.zombies.available = stage.lists.Zombie.length;
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("level4", function(stage) {
    var background, bullets, doorKeyPositions, enemies, gunPositions, items, map, player, random;
    Game.map = map = new Q.TileLayer({
      type: Game.SPRITE_TILES,
      layerIndex: 0,
      dataAsset: Game.assets.level4.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 2
    });
    stage.collisionLayer(map);
    background = new Q.TileLayer({
      layerIndex: 1,
      type: Game.SPRITE_NONE,
      dataAsset: Game.assets.level4.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 1
    });
    stage.insert(background);
    Game.player = player = stage.insert(new Q.Player(Q.tilePos(49.5, 21)));
    stage.add("viewport");
    Game.setCameraTo(stage, player);
    enemies = [
      ["Zombie", Q.tilePos(17, 15)], [
        "Zombie", Q.tilePos(16, 27, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(27, 20)], ["Zombie", Q.tilePos(38, 9)], ["Zombie", Q.tilePos(39, 33)], ["Zombie", Q.tilePos(50, 15)], [
        "Zombie", Q.tilePos(49, 27, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(61, 9)], ["Zombie", Q.tilePos(60, 33)], ["Zombie", Q.tilePos(72, 21)], [
        "Zombie", Q.tilePos(82, 15, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(81, 27)]
    ];
    stage.loadAssets(enemies);
    doorKeyPositions = [
      {
        door: Q.tilePos(50, 3),
        sign: Q.tilePos(48, 3),
        key: Q.tilePos(49.5, 39),
        heart1: Q.tilePos(5, 21),
        heart2: Q.tilePos(94, 21)
      }, {
        door: Q.tilePos(49, 39),
        sign: Q.tilePos(51, 39),
        key: Q.tilePos(49.5, 3),
        heart1: Q.tilePos(5, 21),
        heart2: Q.tilePos(94, 21)
      }, {
        door: Q.tilePos(4, 21),
        sign: Q.tilePos(6, 21),
        key: Q.tilePos(94, 21),
        heart1: Q.tilePos(49.5, 39),
        heart2: Q.tilePos(49.5, 3)
      }, {
        door: Q.tilePos(95, 21),
        sign: Q.tilePos(93, 21),
        key: Q.tilePos(5, 21),
        heart1: Q.tilePos(49.5, 39),
        heart2: Q.tilePos(49.5, 3)
      }
    ];
    bullets = 14;
    gunPositions = [
      Q.tilePos(38, 15, {
        bullets: bullets
      }), Q.tilePos(62, 15, {
        bullets: bullets
      }), Q.tilePos(37, 27, {
        bullets: bullets
      }), Q.tilePos(62, 27, {
        bullets: bullets
      })
    ];
    random = Math.floor(Math.random() * 4);
    items = [["Key", doorKeyPositions[random].key], ["Door", doorKeyPositions[random].door], ["ExitSign", doorKeyPositions[random].sign], ["Gun", gunPositions[random]], ["Heart", doorKeyPositions[random].heart1], ["Heart", doorKeyPositions[random].heart2], ["Heart", Q.tilePos(4.5, 6)], ["Heart", Q.tilePos(7.5, 39)], ["Heart", Q.tilePos(94.5, 7)], ["Heart", Q.tilePos(92.5, 37)]];
    stage.loadAssets(items);
    Game.currentLevelData.health.available = stage.lists.Heart.length;
    return Game.currentLevelData.zombies.available = stage.lists.Zombie.length;
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("level5", function(stage) {
    var background, bullets, doorKeyPositions, enemies, gunPositions, items, map, player, random;
    Game.map = map = new Q.TileLayer({
      type: Game.SPRITE_TILES,
      layerIndex: 0,
      dataAsset: Game.assets.level5.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 2
    });
    stage.collisionLayer(map);
    background = new Q.TileLayer({
      layerIndex: 1,
      type: Game.SPRITE_NONE,
      dataAsset: Game.assets.level5.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 1
    });
    stage.insert(background);
    Game.player = player = stage.insert(new Q.Player(Q.tilePos(49.5, 21)));
    stage.add("viewport");
    Game.setCameraTo(stage, player);
    enemies = [
      ["Zombie", Q.tilePos(17, 15)], [
        "Zombie", Q.tilePos(16, 27, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(27, 20)], ["Zombie", Q.tilePos(38, 9)], [
        "Zombie", Q.tilePos(39, 15, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(39, 27)], [
        "Zombie", Q.tilePos(39, 33, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(50, 15)], [
        "Zombie", Q.tilePos(49, 27, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(61, 9)], [
        "Zombie", Q.tilePos(60, 15, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(60, 27)], [
        "Zombie", Q.tilePos(60, 33, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(72, 21)], [
        "Zombie", Q.tilePos(82, 15, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(81, 27)]
    ];
    stage.loadAssets(enemies);
    doorKeyPositions = [
      {
        door: Q.tilePos(50, 3),
        sign: Q.tilePos(48, 3),
        key: Q.tilePos(49.5, 39),
        heart1: Q.tilePos(5, 21),
        heart2: Q.tilePos(94, 21)
      }, {
        door: Q.tilePos(49, 39),
        sign: Q.tilePos(51, 39),
        key: Q.tilePos(49.5, 3),
        heart1: Q.tilePos(5, 21),
        heart2: Q.tilePos(94, 21)
      }, {
        door: Q.tilePos(4, 21),
        sign: Q.tilePos(6, 21),
        key: Q.tilePos(94, 21),
        heart1: Q.tilePos(49.5, 39),
        heart2: Q.tilePos(49.5, 3)
      }, {
        door: Q.tilePos(95, 21),
        sign: Q.tilePos(93, 21),
        key: Q.tilePos(5, 21),
        heart1: Q.tilePos(49.5, 39),
        heart2: Q.tilePos(49.5, 3)
      }
    ];
    bullets = 18;
    gunPositions = [
      Q.tilePos(38, 15, {
        bullets: bullets
      }), Q.tilePos(62, 15, {
        bullets: bullets
      }), Q.tilePos(37, 27, {
        bullets: bullets
      }), Q.tilePos(62, 27, {
        bullets: bullets
      })
    ];
    random = Math.floor(Math.random() * 4);
    items = [["Key", doorKeyPositions[random].key], ["Door", doorKeyPositions[random].door], ["ExitSign", doorKeyPositions[random].sign], ["Gun", gunPositions[random]], ["Heart", doorKeyPositions[random].heart1], ["Heart", doorKeyPositions[random].heart2], ["Heart", Q.tilePos(4.5, 6)], ["Heart", Q.tilePos(7.5, 39)], ["Heart", Q.tilePos(94.5, 7)], ["Heart", Q.tilePos(92.5, 37)]];
    stage.loadAssets(items);
    Game.currentLevelData.health.available = stage.lists.Heart.length;
    return Game.currentLevelData.zombies.available = stage.lists.Zombie.length;
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("level6", function(stage) {
    var background, bullets, doorKeyPositions, enemies, gunPositions, items, map, player, random;
    Game.map = map = new Q.TileLayer({
      type: Game.SPRITE_TILES,
      layerIndex: 0,
      dataAsset: Game.assets.level6.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 2
    });
    stage.collisionLayer(map);
    background = new Q.TileLayer({
      layerIndex: 1,
      type: Game.SPRITE_NONE,
      dataAsset: Game.assets.level6.dataAsset,
      sheet: Game.assets.map.sheetName,
      tileW: Game.assets.map.tileSize,
      tileH: Game.assets.map.tileSize,
      z: 1
    });
    stage.insert(background);
    Game.player = player = stage.insert(new Q.Player(Q.tilePos(49.5, 21)));
    stage.add("viewport");
    Game.setCameraTo(stage, player);
    enemies = [
      ["Zombie", Q.tilePos(17, 15)], [
        "Zombie", Q.tilePos(16, 21, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(17, 27)], [
        "Zombie", Q.tilePos(27, 9, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(28, 15)], [
        "Zombie", Q.tilePos(27, 27, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(28, 33)], ["Zombie", Q.tilePos(38, 9)], [
        "Zombie", Q.tilePos(39, 21, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(39, 33)], ["Zombie", Q.tilePos(50, 9)], [
        "Zombie", Q.tilePos(49, 15, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(50, 27)], [
        "Zombie", Q.tilePos(49, 33, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(61, 9)], [
        "Zombie", Q.tilePos(60, 21, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(60, 33)], ["Zombie", Q.tilePos(72, 9)], [
        "Zombie", Q.tilePos(71, 15, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(72, 21)], [
        "Zombie", Q.tilePos(71, 27, {
          startLeft: true
        })
      ], ["Zombie", Q.tilePos(72, 33)], ["Zombie", Q.tilePos(80, 15)], ["Zombie", Q.tilePos(85, 27)]
    ];
    stage.loadAssets(enemies);
    doorKeyPositions = [
      {
        door: Q.tilePos(50, 3),
        sign: Q.tilePos(48, 3),
        key: Q.tilePos(49.5, 39),
        heart1: Q.tilePos(5, 21),
        heart2: Q.tilePos(94, 21)
      }, {
        door: Q.tilePos(49, 39),
        sign: Q.tilePos(51, 39),
        key: Q.tilePos(49.5, 3),
        heart1: Q.tilePos(5, 21),
        heart2: Q.tilePos(94, 21)
      }, {
        door: Q.tilePos(4, 21),
        sign: Q.tilePos(6, 21),
        key: Q.tilePos(94, 21),
        heart1: Q.tilePos(49.5, 39),
        heart2: Q.tilePos(49.5, 3)
      }, {
        door: Q.tilePos(95, 21),
        sign: Q.tilePos(93, 21),
        key: Q.tilePos(5, 21),
        heart1: Q.tilePos(49.5, 39),
        heart2: Q.tilePos(49.5, 3)
      }
    ];
    bullets = 26;
    gunPositions = [
      Q.tilePos(27.5, 9, {
        bullets: bullets
      }), Q.tilePos(27.5, 33, {
        bullets: bullets
      }), Q.tilePos(71.5, 9, {
        bullets: bullets
      }), Q.tilePos(71.5, 33, {
        bullets: bullets
      })
    ];
    random = Math.floor(Math.random() * 4);
    items = [["Key", doorKeyPositions[random].key], ["Door", doorKeyPositions[random].door], ["ExitSign", doorKeyPositions[random].sign], ["Gun", gunPositions[random]], ["Heart", doorKeyPositions[random].heart1], ["Heart", doorKeyPositions[random].heart2], ["Heart", Q.tilePos(4.5, 6)], ["Heart", Q.tilePos(7.5, 39)], ["Heart", Q.tilePos(94.5, 7)], ["Heart", Q.tilePos(92.5, 37)]];
    stage.loadAssets(items);
    Game.currentLevelData.health.available = stage.lists.Heart.length;
    return Game.currentLevelData.zombies.available = stage.lists.Zombie.length;
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("levelSelect", function(stage) {
    var audioButton, columnInP, columnWidth, columnsNo, enabled, gutterX, gutterXinP, gutterY, gutterYinP, h, item, marginX, marginXinP, marginY, marginYinP, rowHeight, w, x, y, _i;
    marginXinP = 20;
    marginYinP = 20;
    gutterXinP = 8;
    gutterYinP = 14;
    columnsNo = 3;
    columnInP = (100 - (marginXinP * 2) - (columnsNo - 1) * gutterXinP) / columnsNo;
    marginX = Q.width * marginXinP * 0.01;
    gutterX = Q.width * gutterXinP * 0.01;
    columnWidth = Q.width * columnInP * 0.01;
    marginY = Q.height * marginYinP * 0.01;
    gutterY = Q.height * gutterYinP * 0.01;
    rowHeight = Q.height * 0.22;
    x = marginX + columnWidth / 2;
    y = marginY + rowHeight / 2;
    w = columnWidth;
    h = rowHeight;
    for (item = _i = 0; _i <= 5; item = ++_i) {
      if (item % columnsNo === 0) {
        x = marginX + columnWidth / 2;
        if (item > 0) {
          y += rowHeight + gutterY;
        }
      }
      enabled = item + 1 <= Game.availableLevel ? true : false;
      stage.insert(new Q.UI.LevelButton({
        level: item + 1,
        x: x,
        y: y,
        w: w,
        h: h,
        enabled: enabled
      }));
      x += columnWidth + gutterX;
    }
    stage.insert(new Q.UI.Text({
      x: Q.width / 2,
      y: marginY / 2,
      label: "Everything begins here!",
      color: "#f2da38",
      family: "Jolly Lodger",
      size: 60
    }));
    Q.AudioManager.stopAll();
    Q.AudioManager.clear();
    audioButton = stage.insert(new Q.UI.AudioButton({
      y: marginY / 2
    }));
    return audioButton.p.x = Q.width - marginX - audioButton.p.w / 2;
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("levelSummary", function(stage) {
    var button, marginY;
    marginY = Q.height * 0.2;
    Q.AudioManager.stopAll();
    stage.insert(new Q.UI.Text({
      x: Q.width / 2,
      y: marginY / 2,
      label: "Well done! Let's see the level summary:",
      size: 30,
      color: "#fff",
      family: "Ubuntu"
    }));
    if (stage.options.health) {
      stage.insert(new Q.UI.Text({
        x: Q.width / 2,
        y: marginY / 2 + 100,
        label: "Health collected: " + stage.options.health.collected + "/" + stage.options.health.available,
        size: 30,
        color: "#fff",
        family: "Ubuntu"
      }));
    }
    if (stage.options.zombies) {
      stage.insert(new Q.UI.Text({
        x: Q.width / 2,
        y: marginY / 2 + 150,
        label: "Zombies healed: " + stage.options.zombies.healed + "/" + stage.options.zombies.available,
        size: 30,
        color: "#fff",
        family: "Ubuntu"
      }));
    }
    if (stage.options.bullets) {
      stage.insert(new Q.UI.Text({
        x: Q.width / 2,
        y: marginY / 2 + 200,
        label: "Bullets waisted: " + stage.options.bullets.waisted + "/" + stage.options.bullets.available,
        size: 30,
        color: "#fff",
        family: "Ubuntu"
      }));
    }
    if (stage.options.zombieModeFound != null) {
      stage.insert(new Q.UI.Text({
        x: Q.width / 2,
        y: marginY / 2 + 250,
        label: "Zombie Mode: " + (stage.options.zombieModeFound ? "done" : "not found"),
        size: 30,
        color: "#fff",
        family: "Ubuntu"
      }));
    }
    button = stage.insert(new Q.UI.Button({
      x: Q.width / 2,
      y: marginY / 2 + 350,
      fill: "#CCCCCC",
      label: "Play Next",
      keyActionName: "confirm",
      type: Q.SPRITE_UI | Q.SPRITE_DEFAULT
    }));
    button.on("click", function(e) {
      return Game.stageLevelSelectScreen();
    });
    if (Q.state.get("currentLevel") >= Game.availableLevel) {
      Game.availableLevel = Q.state.get("currentLevel") + 1;
      return localStorage.setItem(Game.storageKey, Game.availableLevel);
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.scene("start", function(stage) {
    var button, titleContainer;
    titleContainer = stage.insert(new Q.UI.Container({
      x: Q.width / 2,
      y: Q.height / 2
    }));
    titleContainer.insert(new Q.UI.Text({
      x: 0,
      y: -100,
      label: "Heal'em all",
      color: "#f2da38",
      family: "Jolly Lodger",
      size: 120
    }));
    titleContainer.insert(new Q.UI.Text({
      x: 0,
      y: -20,
      label: "There's a cure for zombies",
      color: "#ec655d",
      family: "Jolly Lodger",
      size: 40
    }));
    titleContainer.fit();
    button = titleContainer.insert(new Q.UI.Button({
      x: 0,
      y: 80,
      w: Q.width / 3,
      h: 70,
      fill: "#c4da4a",
      radius: 10,
      fontColor: "#353b47",
      font: "400 58px Jolly Lodger",
      label: "Continue",
      keyActionName: "confirm",
      type: Q.SPRITE_UI | Q.SPRITE_DEFAULT
    }));
    return button.on("click", function(e) {
      return Game.stageLevelSelectScreen();
    });
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.Sprite.extend('Background', {
    init: function(p) {
      var ratio;
      this._super(p, {
        x: 0,
        y: 0,
        z: 0,
        asset: Game.assets.map.bg,
        type: Q.SPRITE_NONE
      });
      this.imgEl = this.asset();
      ratio = this.imgEl.width / this.imgEl.height;
      this.imgEl.width = Q.width + 10;
      this.imgEl.height = this.imgEl.width * ratio;
      this.p.deltaX = (this.imgEl.width - Q.width) / 2;
      return this.p.deltaY = (this.imgEl.height - Q.height) / 2;
    },
    draw: function(ctx) {
      var offsetX, offsetY, viewport;
      viewport = this.stage.viewport;
      if (viewport) {
        offsetX = viewport.centerX - Q.width / 2;
        offsetY = viewport.centerY - Q.height / 2;
      } else {
        offsetX = 0;
        offsetY = 0;
      }
      return ctx.drawImage(this.imgEl, offsetX - this.p.deltaX, offsetY - this.p.deltaY, this.imgEl.width, this.imgEl.height);
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.animations("human", {
    intro: {
      frames: [0, 1, 2, 3],
      rate: 0.7,
      next: "stand"
    },
    stand: {
      frames: [4, 5, 6],
      rate: 1 / 3
    },
    outro: {
      frames: [3, 2, 1, 0],
      rate: 0.8,
      loop: false,
      trigger: "outro"
    }
  });

  Q.Sprite.extend("Human", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        vx: 0,
        z: 20,
        timeInvincible: 4,
        sheet: "human",
        sprite: "human",
        type: Game.SPRITE_HUMAN,
        collisionMask: Game.SPRITE_TILES,
        sensor: true
      });
      this.add("2d, animation");
      this.play("intro");
      Q.AudioManager.add(Game.audio.humanCreated);
      this.on("sensor", this, "sensor");
      return this.on("outro", this, "die");
    },
    step: function(dt) {
      if (this.p.timeInvincible > 0) {
        return this.p.timeInvincible = Math.max(this.p.timeInvincible - dt, 0);
      }
    },
    sensor: function(obj) {
      if (obj.isA("Zombie") && this.p.timeInvincible === 0) {
        obj.play("attack", 10);
        return this.play("outro");
      }
    },
    die: function() {
      var randomBool, zombie;
      this.destroy();
      randomBool = Math.floor(Math.random() * 2);
      zombie = this.stage.insert(new Q.Zombie({
        x: this.p.x,
        y: this.p.y,
        startLeft: randomBool
      }));
      return zombie.p.wasHuman = true;
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.animations("player", {
    stand: {
      frames: [2],
      rate: 1
    },
    run: {
      frames: [0, 2, 4, 2],
      rate: 1 / 4
    },
    hit: {
      frames: [3],
      loop: false,
      rate: 1,
      next: "stand"
    },
    jump: {
      frames: [1, 3, 5, 3],
      rate: 1 / 3
    }
  });

  Q.animations("playerWithGun", {
    stand: {
      frames: [2],
      rate: 1
    },
    run: {
      frames: [0, 2, 4, 2],
      rate: 1 / 4
    },
    hit: {
      frames: [1],
      loop: false,
      rate: 1,
      next: "stand"
    },
    jump: {
      frames: [1],
      rate: 1
    }
  });

  Q.Sprite.extend("Player", {
    init: function(p) {
      this._super(p, {
        lifePoints: Q.state.get("lives"),
        timeInvincible: 0,
        timeToNextSave: 0,
        x: 0,
        y: 0,
        z: 100,
        savedPosition: {},
        hasKey: false,
        sheet: "player",
        sprite: "player",
        type: Game.SPRITE_PLAYER,
        collisionMask: Game.SPRITE_TILES | Game.SPRITE_ENEMY | Game.SPRITE_PLAYER_COLLECTIBLE
      });
      this.add("2d, platformerControls, animation");
      if (Q.state.get("hasGun")) {
        this.add("gun");
      }
      this.p.jumpSpeed = -660;
      this.p.speed = 330;
      this.p.savedPosition.x = this.p.x;
      this.p.savedPosition.y = this.p.y;
      Q.AudioManager.add(Game.audio.playerBg, {
        loop: true
      });
      this.on("bump.left, bump.right, bump.bottom, bump.top", this, "collision");
      return this.on("player.outOfMap", this, "restore");
    },
    step: function(dt) {
      if (this.p.direction === "left") {
        this.p.flip = "x";
        this.p.points = [[-15, -50], [25, -50], [25, 50], [-15, 50]];
      }
      if (this.p.direction === "right") {
        this.p.flip = false;
        this.p.points = [[-25, -50], [15, -50], [15, 50], [-25, 50]];
      }
      if (this.p.x > Game.map.p.w) {
        this.p.x = Game.map.p.w;
      }
      if (this.p.x < 0) {
        this.p.x = 0;
      }
      if (this.p.timeToNextSave > 0) {
        this.p.timeToNextSave = Math.max(this.p.timeToNextSave - dt, 0);
      }
      if (this.p.timeToNextSave === 0) {
        this.savePosition();
        this.p.timeToNextSave = 2;
      }
      if (this.p.timeInvincible > 0) {
        this.p.timeInvincible = Math.max(this.p.timeInvincible - dt, 0);
      }
      if (this.p.vy > 1100) {
        this.p.willBeDead = true;
      }
      if (this.p.willBeDead && this.p.vy < 1100) {
        this.updateLifePoints();
        this.p.willBeDead = false;
      }
      if (this.p.y > Game.map.p.h) {
        this.updateLifePoints();
        this.trigger("player.outOfMap");
        this.p.willBeDead = false;
      }
      if (this.p.vy !== 0) {
        this.play("jump");
      } else if (this.p.vx !== 0) {
        this.play("run");
      } else {
        this.play("stand");
      }
      if (this.gunStep != null) {
        return this.gunStep(dt);
      }
    },
    collision: function(col) {
      if (col.obj.isA("Zombie") && this.p.timeInvincible === 0) {
        this.updateLifePoints();
        col.obj.play("attack", 10);
        return this.p.timeInvincible = 1;
      }
    },
    savePosition: function() {
      var dirX, ground;
      dirX = this.p.vx / Math.abs(this.p.vx);
      ground = Q.stage().locate(this.p.x, this.p.y + this.p.h / 2 + 1, Game.SPRITE_TILES);
      if (ground) {
        this.p.savedPosition.x = this.p.x;
        return this.p.savedPosition.y = this.p.y;
      }
    },
    updateLifePoints: function(newLives) {
      var zombiePlayer,
        _this = this;
      if (newLives != null) {
        this.p.lifePoints += newLives;
      } else {
        this.p.lifePoints -= 1;
        Game.infoLabel.lifeLost();
        this.play("hit", 1);
        Q.AudioManager.add(Game.audio.playerHit);
        if (this.p.lifePoints <= 0) {
          Game.infoLabel.zombieModeOn();
          zombiePlayer = this.stage.insert(new Q.ZombiePlayer({
            x: (function() {
              if (_this.p.y > Game.map.p.h) {
                return _this.p.savedPosition.x;
              } else {
                return _this.p.x;
              }
            })(),
            y: (function() {
              if (_this.p.y > Game.map.p.h) {
                return _this.p.savedPosition.y;
              } else {
                return _this.p.y;
              }
            })()
          }));
          Game.setCameraTo(this.stage, zombiePlayer);
          this.destroy();
        }
        if (this.p.lifePoints === 1) {
          Game.infoLabel.lifeLevelLow();
        }
      }
      return Q.state.set("lives", this.p.lifePoints);
    },
    restore: function() {
      this.p.x = this.p.savedPosition.x;
      return this.p.y = this.p.savedPosition.y;
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.animations("zombie", {
    stand: {
      frames: [4],
      rate: 1
    },
    run: {
      frames: [0, 4, 8, 12],
      rate: 0.4
    },
    hit: {
      frames: [13],
      loop: false,
      rate: 1,
      next: "run"
    },
    attack: {
      frames: [1, 5, 9, 13],
      loop: false,
      rate: 1 / 2,
      next: "run"
    },
    fall: {
      frames: [3, 7, 11, 15, 15, 15, 15],
      rate: 1 / 5,
      loop: false,
      next: "run"
    }
  });

  Q.Sprite.extend("Zombie", {
    init: function(p) {
      this._super(p, {
        lifePoints: 1,
        x: 0,
        y: 0,
        vx: 0,
        z: 20,
        sheet: "zombie",
        sprite: "zombie",
        canSeeThePlayerTimeout: 0,
        type: Game.SPRITE_ENEMY,
        collisionMask: Game.SPRITE_TILES | Game.SPRITE_PLAYER | Game.SPRITE_BULLET | Game.SPRITE_HUMAN
      });
      Q.state.inc("enemiesCounter", 1);
      this.add("2d, animation, zombieAI");
      this.on("hit", this, "collision");
      this.on("bump.right", this, "hitFromRight");
      return this.on("bump.left", this, "hitFromLeft");
    },
    collision: function(col) {
      if (col.obj.isA("Bullet")) {
        this.play("hit");
        return this.decreaseLifePoints();
      }
    },
    hitFromRight: function(col) {
      return this.p.vx = col.impact;
    },
    hitFromLeft: function(col) {
      return this.p.vx = -col.impact;
    },
    step: function(dt) {
      if (this.zombieStep != null) {
        this.zombieStep(dt);
      }
      if (this.p.y > Game.map.p.h) {
        this.die(false);
      }
      if (this.p.vy !== 0) {
        return this.play("fall");
      } else {
        return this.play("run");
      }
    },
    decreaseLifePoints: function() {
      this.p.lifePoints -= 1;
      if (this.p.lifePoints <= 0) {
        return this.die();
      }
    },
    die: function(turnToHuman) {
      if (turnToHuman == null) {
        turnToHuman = true;
      }
      this.destroy();
      if (!this.p.wasHuman && turnToHuman) {
        this.stage.insert(new Q.Human({
          x: this.p.x,
          y: this.p.y
        }));
      }
      return Q.state.dec("enemiesCounter", 1);
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.animations("zombiePlayer", {
    stand: {
      frames: [1],
      rate: 1
    },
    run: {
      frames: [0, 1, 2, 3],
      rate: 1 / 3
    },
    jump: {
      frames: [0],
      rate: 1
    }
  });

  Q.Sprite.extend("ZombiePlayer", {
    init: function(p) {
      this._super(p, {
        timeToNextSave: 0,
        x: 0,
        y: 0,
        z: 100,
        savedPosition: {},
        sheet: "zombie_player",
        sprite: "zombiePlayer",
        type: Game.SPRITE_ZOMBIE_PLAYER,
        collisionMask: Game.SPRITE_TILES | Game.SPRITE_PLAYER_COLLECTIBLE
      });
      this.add("2d, platformerControls, animation");
      this.p.jumpSpeed = -500;
      this.p.speed = 140;
      this.p.savedPosition.x = this.p.x;
      this.p.savedPosition.y = this.p.y;
      Game.infoLabel.zombieModeOnNext();
      Game.currentLevelData.zombieModeFound = true;
      Q.AudioManager.remove(Game.audio.playerBg);
      Q.AudioManager.add(Game.audio.zombieMode, {
        loop: true
      });
      return this.on("player.outOfMap", this, "die");
    },
    step: function(dt) {
      if (this.p.direction === "left") {
        this.p.flip = "x";
      }
      if (this.p.direction === "right") {
        this.p.flip = false;
      }
      if (this.p.y > Game.map.p.h) {
        this.trigger("player.outOfMap");
      }
      if (this.p.x > Game.map.p.w) {
        this.p.x = Game.map.p.w;
      }
      if (this.p.x < 0) {
        this.p.x = 0;
      }
      if (this.p.timeToNextSave > 0) {
        this.p.timeToNextSave = Math.max(this.p.timeToNextSave - dt, 0);
      }
      if (this.p.timeToNextSave === 0) {
        this.savePosition();
        this.p.timeToNextSave = 4;
      }
      if (this.p.vy !== 0) {
        return this.play("jump");
      } else if (this.p.vx !== 0) {
        return this.play("run");
      } else {
        return this.play("stand");
      }
    },
    savePosition: function() {
      var dirX, ground;
      dirX = this.p.vx / Math.abs(this.p.vx);
      ground = Q.stage().locate(this.p.x, this.p.y + this.p.h / 2 + 1, Game.SPRITE_TILES);
      if (ground) {
        this.p.savedPosition.x = this.p.x;
        return this.p.savedPosition.y = this.p.y;
      }
    },
    die: function() {
      var player;
      Q.state.set("lives", 3);
      Game.player = player = this.stage.insert(new Q.Player({
        x: this.p.savedPosition.x,
        y: this.p.savedPosition.y
      }));
      Game.setCameraTo(this.stage, player);
      Game.infoLabel.zombieModeOff();
      Q.AudioManager.remove(Game.audio.zombieMode);
      return this.destroy();
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.BulletsCounter = Q.UI.Text.extend("UI.BulletsCounter", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        label: Q.state.get("bullets") + "",
        size: 34,
        color: "#f2da38",
        family: "Boogaloo"
      });
      this.p.x = -this.p.img.w / 2 - this.p.w / 2 - 5;
      return Q.state.on("change.bullets", this, "updateLabel");
    },
    updateLabel: function(bullets) {
      return this.p.label = bullets + "";
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.BulletsImg = Q.Sprite.extend("Q.UI.BulletsImg", {
    init: function(p) {
      return this._super(p, {
        x: 0,
        y: 0,
        sheet: "hud_bullets"
      });
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.EnemiesAvatar = Q.Sprite.extend("Q.UI.EnemiesAvatar", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        sheet: "hud_zombie"
      });
      this.p.x = Q.width - this.p.w / 2;
      return this.p.y = this.p.h / 2 + 8;
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.EnemiesCounter = Q.UI.Text.extend("UI.EnemiesCounter", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        label: Q.state.get("enemiesCounter") + "",
        size: 34,
        color: "#c4da4a",
        family: "Boogaloo"
      });
      this.p.w = 60;
      return Q.state.on("change.enemiesCounter", this, "updateLabel");
    },
    updateLabel: function(enemiesCounter) {
      return this.p.label = enemiesCounter + "";
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.HealthCounter = Q.UI.Text.extend("UI.HealthCounter", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        label: Q.state.get("lives") + "",
        size: 34,
        color: "#ec655d",
        family: "Boogaloo"
      });
      this.p.x = -this.p.img.w / 2 - this.p.w / 2 - 5;
      return Q.state.on("change.lives", this, "updateLabel");
    },
    updateLabel: function(lives) {
      return this.p.label = lives + "";
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.HealthImg = Q.Sprite.extend("Q.UI.HealthImg", {
    init: function(p) {
      return this._super(p, {
        x: 0,
        y: 0,
        sheet: "hud_health"
      });
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.InfoLabel = Q.UI.Text.extend("UI.InfoLabel", {
    init: function(p, defaultProps) {
      return this._super(p, {
        x: 0,
        y: 0,
        label: "",
        color: "#222221",
        size: 24,
        family: "Boogaloo"
      });
    },
    afterLabelChange: function() {
      this.calcSize();
      this.p.container.p.x = this.p.offsetLeft + this.p.w / 2 + 10;
      this.p.container.fit(5, 10);
      return Q._generatePoints(this);
    },
    intro: function() {
      this.p.label = "I need to find the way out of here";
      return this.afterLabelChange();
    },
    keyNeeded: function() {
      this.p.label = "I need the key";
      return this.afterLabelChange();
    },
    doorOpen: function() {
      this.p.label = "Nice! Now I need to 'jump' inside the door";
      return this.afterLabelChange();
    },
    gunFound: function() {
      this.p.label = "I found the gun, I can shoot pressing Spacebar";
      return this.afterLabelChange();
    },
    outOfBullets: function() {
      this.p.label = "I'm out of ammo";
      return this.afterLabelChange();
    },
    keyFound: function() {
      this.p.label = "I found the key, now I need to find the the door";
      return this.afterLabelChange();
    },
    clear: function() {
      this.p.label = "";
      return this.afterLabelChange();
    },
    lifeLevelLow: function() {
      this.p.label = "I need to be more careful";
      return this.afterLabelChange();
    },
    extraLifeFound: function() {
      this.p.label = "I feel better now!";
      return this.afterLabelChange();
    },
    lifeLost: function() {
      this.p.label = "That hurts!";
      return this.afterLabelChange();
    },
    zombieModeOn: function() {
      this.p.label = "I was bitten. I'm turning. Nooo!";
      return this.afterLabelChange();
    },
    zombieModeOnNext: function() {
      this.p.label = "I need to kill myself";
      return this.afterLabelChange();
    },
    zombieModeOff: function() {
      this.p.label = "Ok, back to businness";
      return this.afterLabelChange();
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.InventoryKey = Q.Sprite.extend("Q.UI.InventoryKey", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        sheet: "hud_key_empty"
      });
      return Q.state.on("change.hasKey", this, "updateSheet");
    },
    updateSheet: function(hasKey) {
      if (hasKey === true) {
        return this.p.sheet = "hud_key_collected";
      } else {
        return this.p.sheet = "hud_key_empty";
      }
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.PlayerAvatar = Q.Sprite.extend("Q.UI.PlayerAvatar", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        sheet: "hud_player"
      });
      this.p.x = this.p.w / 2;
      return this.p.y = this.p.h / 2;
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.RadialGradient = Q.Sprite.extend("Q.UI.RadialGradient", {
    init: function(p) {
      this._super(p, {
        x: Q.width / 2,
        y: Q.height / 2,
        w: Q.width,
        h: Q.height
      });
      return console.log(this.p);
    },
    draw: function(ctx) {
      var rad;
      rad = ctx.createRadialGradient(0, 0, this.p.w / 3, 0, 0, this.p.w / 2 + this.p.w / 4);
      rad.addColorStop(0, 'rgba(0,0,0,0)');
      rad.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = rad;
      ctx.fillRect(-this.p.cx, -this.p.cy, this.p.w, this.p.h);
      return ctx.fill();
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.Sprite.extend("Bullet", {
    init: function(p) {
      this._super(p, {
        color: "red",
        range: Q.width / 2,
        w: 5,
        h: 5,
        speed: 700,
        gravity: 0,
        type: Game.SPRITE_BULLET,
        collisionMask: Game.SPRITE_TILES | Game.SPRITE_ENEMY
      });
      this.add("2d");
      this.p.initialX = this.p.x;
      this.p.initialY = this.p.y;
      return this.on("hit", this, "collision");
    },
    draw: function(ctx) {
      ctx.fillStyle = this.p.color;
      return ctx.fillRect(-this.p.cx, -this.p.cy, this.p.w, this.p.h);
    },
    step: function(dt) {
      if (this.p.direction === "left") {
        this.p.vx = -this.p.speed;
      } else {
        this.p.vx = this.p.speed;
      }
      if (this.p.x > Game.map.width || this.p.x < 0) {
        this.die();
      }
      if (this.p.x > this.p.initialX + this.p.range || this.p.x < this.p.initialX - this.p.range) {
        return this.die();
      }
    },
    collision: function(col) {
      this.p.x -= col.separate[0];
      this.p.y -= col.separate[1];
      if (col.obj.isA("Zombie")) {
        return this.destroy();
      } else {
        return this.die();
      }
    },
    die: function() {
      Game.currentLevelData.bullets.waisted += 1;
      return this.destroy();
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.Sprite.extend("Door", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        z: 10,
        sheet: "door_closed",
        opened: false,
        type: Game.SPRITE_PLAYER_COLLECTIBLE,
        sensor: true
      });
      this.p.y -= this.p.h / 2 - Game.assets.map.tileSize / 2;
      return this.on("sensor", this, "sensor");
    },
    sensor: function(obj) {
      if (obj.isA("Player")) {
        if ((Q.state.get("hasKey")) && !this.p.opened) {
          Q.state.set("hasKey", false);
          this.p.opened = true;
          this.p.sheet = "door_open";
          return Game.infoLabel.doorOpen();
        } else if (!this.p.opened) {
          return Game.infoLabel.keyNeeded();
        } else if (this.p.opened && (Q.inputs['up'] || Q.inputs['action'])) {
          obj.destroy();
          Game.currentLevelData.zombies.healed = this.stage.lists.Human != null ? this.stage.lists.Human.length : 0;
          return Game.stageEndLevelScreen();
        }
      }
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.Sprite.extend("ExitSign", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        z: 10,
        sheet: "exit_sign",
        type: Game.SPRITE_NONE
      });
      return this.p.y -= this.p.h / 2 - Game.assets.map.tileSize / 2;
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.Sprite.extend("Gun", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        z: 10,
        sheet: "gun",
        type: Game.SPRITE_PLAYER_COLLECTIBLE,
        sensor: true,
        bullets: 6
      });
      this.p.y -= 15;
      return this.on("sensor", this, "sensor");
    },
    sensor: function(obj) {
      if (obj.isA("Player")) {
        Q.state.set("hasGun", true);
        obj.add("gun");
        Game.infoLabel.gunFound();
        obj.p.noOfBullets = this.p.bullets;
        Q.state.set("bullets", this.p.bullets);
        Game.currentLevelData.bullets.available = this.p.bullets;
        Q.AudioManager.add(Game.audio.collected);
        return this.destroy();
      }
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.Sprite.extend("Heart", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        z: 10,
        sheet: "heart",
        type: Game.SPRITE_PLAYER_COLLECTIBLE,
        sensor: true
      });
      this.p.y -= 15;
      return this.on("sensor", this, "sensor");
    },
    sensor: function(obj) {
      if (obj.isA("Player")) {
        obj.updateLifePoints(1);
        Game.infoLabel.extraLifeFound();
        Q.AudioManager.add(Game.audio.collected);
        this.destroy();
        return Game.currentLevelData.health.collected += 1;
      }
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.Sprite.extend("Key", {
    init: function(p) {
      this._super(p, {
        x: 0,
        y: 0,
        z: 10,
        sheet: "key",
        type: Game.SPRITE_PLAYER_COLLECTIBLE,
        sensor: true
      });
      this.p.y -= 15;
      return this.on("sensor", this, "sensor");
    },
    sensor: function(obj) {
      if (obj.isA("Player")) {
        Q.state.set("hasKey", true);
        Game.infoLabel.keyFound();
        Q.AudioManager.add(Game.audio.collected);
        return this.destroy();
      }
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.AudioButton = Q.UI.Button.extend("UI.AudioButton", {
    init: function(p) {
      var _this = this;
      this._super(p, {
        x: 0,
        y: 0,
        type: Q.SPRITE_UI | Q.SPRITE_DEFAULT,
        sheet: "hud_audio_on_button",
        keyActionName: "mute"
      });
      if (Game.isMuted) {
        this.p.sheet = "hud_audio_off_button";
      } else {
        this.p.sheet = "hud_audio_on_button";
      }
      return this.on('click', function() {
        if (!Game.isMuted) {
          Q.AudioManager.mute();
          _this.p.sheet = "hud_audio_off_button";
          return Game.isMuted = true;
        } else {
          Q.AudioManager.unmute();
          _this.p.sheet = "hud_audio_on_button";
          return Game.isMuted = false;
        }
      });
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.LevelButton = Q.UI.Button.extend("UI.LevelButton", {
    init: function(p) {
      var _this = this;
      this._super(p, {
        type: Q.SPRITE_UI | Q.SPRITE_DEFAULT,
        sheet: "ui_level_button",
        fontColor: "#595f5f",
        font: "400 70px Jolly Lodger"
      });
      this.p.label = this.p.level;
      this.p.sheetW = 172;
      this.p.sheetH = 130;
      this.p.cx = this.p.sheetW / 2;
      this.p.cy = this.p.sheetH / 2;
      if (this.p.enabled === false) {
        this.p.sheet = "ui_level_button_locked";
        this.p.label = false;
      }
      return this.on('click', function() {
        if (_this.p.enabled) {
          if (_this.p.level > 1) {
            return Game.stageLevel(_this.p.level);
          } else {
            return Game.stageControlsScreen();
          }
        }
      });
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.MenuButton = Q.UI.Button.extend("UI.MenuButton", {
    init: function(p) {
      var _this = this;
      this._super(p, {
        x: Q.width - 30,
        y: 170,
        z: 100,
        type: Q.SPRITE_UI | Q.SPRITE_DEFAULT,
        sheet: "hud_settings_button",
        keyActionName: "escape"
      });
      return this.on('click', function() {
        return Game.stageLevelSelectScreen();
      });
    }
  });

}).call(this);

(function() {
  var Q;

  Q = Game.Q;

  Q.UI.PauseButton = Q.UI.Button.extend("UI.PauseButton", {
    init: function(p) {
      var pausedScreen, pausedText,
        _this = this;
      this._super(p, {
        x: Q.width - 30,
        y: 110,
        z: 100,
        type: Q.SPRITE_UI | Q.SPRITE_DEFAULT,
        sheet: "hud_pause_button",
        isPaused: false,
        keyActionName: "pause"
      });
      pausedScreen = new Q.UI.Container({
        x: Q.width / 2,
        y: Q.height / 2,
        w: Q.width,
        h: Q.height,
        z: 50,
        fill: "rgba(0,0,0,0.5)"
      });
      pausedText = new Q.UI.Text({
        x: 0,
        y: 0,
        label: "Paused",
        color: "#f2da38",
        family: "Jolly Lodger",
        size: 100
      });
      return this.on('click', function() {
        if (!_this.isPaused) {
          Q.stage().pause();
          Q.AudioManager.stopAll();
          _this.isPaused = true;
          _this.stage.insert(pausedScreen);
          return pausedScreen.insert(pausedText);
        } else {
          Q.stage().unpause();
          if (!Game.isMuted) {
            Q.AudioManager.playAll();
          }
          _this.isPaused = false;
          return _this.stage.remove(pausedScreen);
        }
      });
    }
  });

}).call(this);
