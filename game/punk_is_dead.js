var PunkIsDead = Klass.extend({
  init: function() {
    this.foes = {};
    this.main_screens = {};
    this.fight_screens = {};
    this.frameCount = 0;
    this.currentScreen = 'intro';

    help.akihabaraInit({ width: 640, height: 480, zoom: 1, title: (getURLParam('name') ? getURLParam('name') : 'Punk Is Dead') });

    gbox.addBundle({ file: 'bundle.js?' + timestamp() });

    $aki.controls.watchKeys({
      B: function() {
        console.log('B pressed');
      },
      C: function() {
        debug.log('C pressed');
        battle_system.input('c');
      },
      SPACE: function() {
        the_game.nextScreen();
      },
      W: function() {
        the_game.win();
      },
      L: function() {
        the_game.lose();
      }
    });

    // The 'main' function is registered as a callback: this just says that when we're done with loadAll we should call 'main'
    gbox.setCallback(this.main);

    gbox._passKeysThrough = 1;

    // When everything is ready, the 'loadAll' downloads all the needed resources.
    gbox.loadAll();
  },

  defaultPlugins: function() {
    return 'plugins/defaultPlugins.json';
  },

  startGame: function() {
    the_game.player = addPlayer();

    addMap();

    battle_system = addBattleManager();

    makeFoe('sarah', { x: 200, y: 256 });
    makeFoe('chris', { x: 300, y: 256 });
    makeFoe('joe',   { x: 400, y: 256 });

    makeFightScreen('sarah');
    makeFightScreen('joe');
    makeFightScreen('chris');

    makeMainScreen('intro');
    makeMainScreen('tutorial');
    makeMainScreen('win');
    makeMainScreen('lose');
  },

  startBattle: function() {
    console.log('Battle started!');
    this.player.startBattle();
  },

  win: function() {
    this.changeScreen('win');
  },

  lose: function() {
    this.changeScreen('lose');
  },

  changeScreen: function(screen_name) {
    this.currentScreen = screen_name;
  },

  nextScreen: function() {
    if (this.currentScreen === 'intro') {
      this.currentScreen = 'tutorial';
    } else if (this.currentScreen === 'tutorial') {
      this.currentScreen = null;
    }
  },

  main: function() {
    // For Tutorial Part 3 we're adding 'background' to the next line.
    // The 'background' rendering group that we'll use for our map, and it will render before anything else because we put it first in this list
    var groups = ['background', 'staticboxes', 'boxes', 'disboxes', 'enemies', 'particles', 'player', 'battle', 'fights', 'game', 'buttons'];

    gbox.setGroups(groups);

    gbox.setAudioChannels({
      jump:  { volume: 0.1 },
      hit:   { volume: 0.3 },
      boom:  { volume: 0.3 },
      bgmix: { volume: 0.4 },
      bggtr: { volume: 0.4 }
    });

    // Create a new maingame into the "gamecycle" group. Will be called "gamecycle". From now, we've to "override" some of the maingame default actions.
    maingame = gamecycle.createMaingame('game', 'game');

    maingame.gameMenu = function() { return true; };
    maingame.gameIntroAnimation = function() { return true; };
    maingame.pressStartIntroAnimation = function() { return true; };
    maingame.gameTitleIntroAnimation = function() { return true; };
    maingame.endlevelIntroAnimation = function(reset) {
      if (reset) {
         toys.resetToy(this,"default-blinker");
      } else {
        return toys.text.blink(this,"default-blinker",gbox.getBufferContext(),{font:"small",text:"WELL DONE!",valign:gbox.ALIGN_MIDDLE,halign:gbox.ALIGN_CENTER,dx:0,dy:0,dw:gbox.getScreenW(),dh:gbox.getScreenH(),blinkspeed:5,times:10});
      }
    };

    // Game ending
    maingame.gameEndingIntroAnimation = function(reset) {
      if (reset) {
        toys.resetToy(this,"default-blinker");
      } else {
          for (var y = 0; y < 30; y++)
            for (var x = 0; x < 40; x++)
              if (game.level[y][x] == '2') help.setTileInMapAtPixel(gbox.getCanvasContext("map_canvas"),map,x*32,y*32,1,"map");
          gbox.getObject('player','player_id').resetGame();
    gbox.blitFade(gbox.getBufferContext(),{alpha:1});
          return toys.TOY_DONE;
      }
    };

    maingame.gameoverIntroAnimation = function(reset) {
       if (reset) {
        gbox.stopChannel("bgmusic");
        toys.resetToy(this,"default-blinker");
      } else {
        return toys.TOY_DONE;
      }
    };

    // This function will be called before the game starts running, so here is where we add our game elements
    maingame.initializeGame = the_game.startGame;

    map = generateMapObj();
    the_game.map = map;

    // We create a canvas that our map will be drawn to, seting its dimentions by using the map's width and height
    gbox.createCanvas('map_canvas', { w: map.w, h: map.h });

    gbox.createCanvas('bg_canvas', { w: map.w, h: map.h });

    gbox.blitTile(gbox.getCanvasContext('bg_canvas'), {
      tileset: 'city_background',
      tile:    0,
      dx:      0,
      dy:      0,
      fliph:   0,
      flipv:   0,
      camera:  gbox.getCamera(),
      alpha:   1
    });

    // We draw the map onto our 'map_canvas' canvas that we created above.
    // This means that the map's 'blit' function can simply draw the 'map_canvas' to the screen to render the map
    gbox.blitTilemap(gbox.getCanvasContext('map_canvas'), map);

    var audiolength = gbox.getAudioDuration('bgmix');
    console.log('audio: ' + audiolength);
    var f = gbox.getFps();
    console.log('fps: ' + f);

    gbox.go();
  }
});