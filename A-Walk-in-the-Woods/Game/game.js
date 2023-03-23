
let game;

let gameOptions = {
    platformSpeedRange: [200, 200],
    mountainSpeed: 80,
    spawnRange: [80, 200],
    platformSizeRange: [90, 300],
    platformHeightRange: [-5, 5],
    platformHeighScale: 20,
    platformVerticalLimit: [0.4, 0.8],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
    jumps: 2,
    cookiePercent: 25,
    bearPercent: 25,
}

window.onload = function(){
    let gameConfig = {
        type: Phaser.Auto,
        width: 800,
        height: 500,
        scene: [preloadGame, playGame],
        backgroundColor: 0x0c88c7,

        physics: {
            default: "arcade"
        }
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}

class preloadGame extends Phaser.Scene{
    constructor(){
        super("PreloadGame");
    }
    preload(){
        this.load.image("platform", "platform.png");

        this.load.spritesheet("player", "hiking_girl_small.png", {
            frameWidth: 24,
            frameHeight: 48
        });
        this.load.spritesheet("cookie", "cookie.png", {
            frameWidth: 20,
            frameHeight: 20
        });
        this.load.spritesheet("bear", "sleeping_bear.png", {
            frameWidth: 48,
            frameHeight: 36
        });
        this.load.spritesheet("mountain", "mountain_bg2.png", {
            frameWidth: 512,
            frameHeight: 512
        });
        
    }

    create(){
        this.anims.create({
            key: "run",
            frames: this.anims.generateFrameNumbers("player", {
                start: 1,
                end: 4
            }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: "rotate",
            frames: this.anims.generateFrameNumbers("cookie", {
                start: 0,
                end: 5
            }),
            frameRate: 15,
            yoyo: true,
            repeat: -1
        });
        this.anims.create({
            key: "snore",
            frames: this.anims.generateFrameNumbers("bear", {
                start: 0,
                end: 3
            }),
            frameRate: 6,
            repeat: -1
        });

        this.scene.start("PlayGame");
    }
}

class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    create(){
        this.score = 0;
        this.scoreText;
        this.mountainGroup = this.add.group();

        this.platformGroup = this.add.group({
            removeCallback: function(platform){
                platform.scene.platformPool.add(platform)
            }
        });
        this.platformPool = this.add.group({
            removeCallback: function(platform){
                platform.scene.platformGroup.add(platform)
            }
        });
        this.cookieGroup = this.add.group({
            removeCallback: function(cookie){
                cookie.scene.cookiePool.add(cookie)
            }
        });

        this.cookiePool = this.add.group({
            removeCallback: function(cookie){
                cookie.scene.cookieGroup.add(cookie)
            }
        });
        this.bearGroup = this.add.group({
            removeCallback: function(bear){
                bear.scene.bearPool.add(bear)
            }
        });
        this.bearPool = this.add.group({
            removeCallback: function(bear){
                bear.scene.bearGroup.add(bear)
            }
        })


        this.addMountains()

        this.addedPlatforms = 0;
        this.playerJumps = 0;
    
        this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
        
        this.addPlatform(game.config.width, game.config.width/2, game.config.height * gameOptions.platformVerticalLimit[1]);

        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height * 0.7, "player");
        this.player.setGravityY(gameOptions.playerGravity);
        this.player.setDepth(2);

        this.dying = false;
   
        this.platformCollider = this.physics.add.collider(this.player, this.platformGroup, function(){
            if(!this.player.anims.isPlaying){
                this.player.anims.play("run");
            }
        }, null, this);


        this.physics.add.overlap(this.player, this.cookieGroup, function(player, cookie){
            this.addScore();
            this.tweens.add({
                targets: cookie,
                y: cookie.y - 100,
                alpha: 0,
                duration: 800,
                ease: "Cubic.easeOut",
                callbackScope: this,
                onComplete: function(){
                    this.cookieGroup.killAndHide(cookie);
                    this.cookieGroup.remove(cookie);
                }
            });
        }, null, this);

        this.physics.add.overlap(this.player, this.bearGroup, function(player, bear){
            this.dying = true;
            this.player.anims.stop();
            this.player.setFrame(2);
            this.player.body.setVelocityY(-200);
            this.physics.world.removeCollider(this.platformCollider)
        }, null, this);

        this.input.on("pointerdown", this.jump, this);
    }

    addScore(player, cookie){
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }

    addMountains(){
        let rightmostMountain = this.getRightmostMountain();
        if(rightmostMountain < game.config.width * 2){
            let mountain = this.physics.add.sprite(rightmostMountain + Phaser.Math.Between(100, 350), game.config.height + Phaser.Math.Between(0, 100), "mountain");
            mountain.setOrigin(0.5, 1);
            mountain.body.setVelocityX(gameOptions.mountainSpeed * -1)
            this.mountainGroup.add(mountain);
            if(Phaser.Math.Between(0, 1)){
                mountain.setDepth(1);
            }
            mountain.setFrame(Phaser.Math.Between(0, 3))
            this.addMountains()
        }
    }
    getRightmostMountain(){
        let rightmostMountain = -200;
        this.mountainGroup.getChildren().forEach(function(mountain){
            rightmostMountain = Math.max(rightmostMountain, mountain.x);
        })
        return rightmostMountain;
    }


    addPlatform(platformWidth, posX, posY){
        this.addedPlatforms++;
        let platform;
        if(this.platformPool.getLength()){
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.y = posY;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
            let newRatio = platformWidth / platform.displayWidth;
            platform.displayWidth = platformWidth;
            platform.tileScaleX = 1 / platform.scaleX;
        }
        else{
            platform = this.add.tileSprite(posX, posY, platformWidth, 32, "platform");
            this.physics.add.existing(platform);
            platform.body.setImmovable(true);
            platform.body.setVelocityX(Phaser.Math.Between(gameOptions.platformSpeedRange[0], gameOptions.platformSpeedRange[1]) * -1);
            platform.setDepth(2);
            this.platformGroup.add(platform);
        }
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);

        if(this.addedPlatforms > 1){
            if(Phaser.Math.Between(1, 100) <= gameOptions.cookiePercent){
                if(this.cookiePool.getLength()){
                    let cookie = this.cookiePool.getFirst();
                    cookie.x = posX;
                    cookie.y = posY - 96;
                    cookie.alpha = 1;
                    cookie.active = true;
                    cookie.visible = true;
                    this.cookiePool.remove(cookie);
                }
                else{
                    let cookie = this.physics.add.sprite(posX, posY - 96, "cookie");
                    cookie.setImmovable(true);
                    cookie.setVelocityX(platform.body.velocity.x);
                    cookie.anims.play("rotate");
                    cookie.setDepth(2);
                    this.cookieGroup.add(cookie);
                }
            }

            if(Phaser.Math.Between(1, 100) <= gameOptions.bearPercent){
                if(this.bearPool.getLength()){
                    let bear = this.bearPool.getFirst();
                    bear.x = posX - platformWidth / 2 + Phaser.Math.Between(1, platformWidth);
                    bear.y = posY - 32;
                    bear.alpha = 1;
                    bear.active = true;
                    bear.visible = true;
                    this.bearPool.remove(bear);
                }
                else{
                    let bear = this.physics.add.sprite(posX - platformWidth / 2 + Phaser.Math.Between(1, platformWidth), posY - 32, "bear");
                    bear.setImmovable(true);
                    bear.setVelocityX(platform.body.velocity.x);
                    bear.setSize(8, 2, true);
                    bear.anims.play("snore");
                    bear.setDepth(2);
                    this.bearGroup.add(bear);
                }
            }
            
            }
        }


    jump(){
        if((!this.dying) && (this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps))){
            if(this.player.body.touching.down){
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps++;

            this.player.anims.stop();
        }
    }
    update(){
        if(this.player.y > game.config.height){
            this.scene.start("PlayGame");
            this.score === 0;
        }
        this.player.x = gameOptions.playerStartPosition;

        let minDistance = game.config.width;
        let rightmostPlatformHeight = 0;
        this.platformGroup.getChildren().forEach(function(platform){
            let platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
            if(platformDistance < minDistance){
                minDistance = platformDistance;
                rightmostPlatformHeight = platform.y;
            }
            if(platform.x < - platform.displayWidth / 2){
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        this.cookieGroup.getChildren().forEach(function(cookie){
            if(cookie.x < - cookie.displayWidth / 2){
                this.cookieGroup.killAndHide(cookie);
                this.cookieGroup.remove(cookie);
            }
        }, this);
        this.bearGroup.getChildren().forEach(function(bear){
            if(bear.x < - bear.displayWidth / 2){
                this.bearGroup.killAndHide(bear);
                this.bearGroup.remove(bear);
            }
        }, this);


        this.mountainGroup.getChildren().forEach(function(mountain){
            if(mountain.x < - mountain.displayWidth){
                let rightmostMountain = this.getRightmostMountain();
                mountain.x = rightmostMountain + Phaser.Math.Between(100, 350);
                mountain.y = game.config.height + Phaser.Math.Between(0, 100);
                mountain.setFrame(Phaser.Math.Between(0, 3))
                if(Phaser.Math.Between(0, 1)){
                    mountain.setDepth(1);
                }
            }
        }, this);

        if(minDistance > this.nextPlatformDistance){
            let nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            let platformRandomHeight = gameOptions.platformHeighScale * Phaser.Math.Between(gameOptions.platformHeightRange[0], gameOptions.platformHeightRange[1]);
            let nextPlatformGap = rightmostPlatformHeight + platformRandomHeight;
            let minPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[0];
            let maxPlatformHeight = game.config.height * gameOptions.platformVerticalLimit[1];
            let nextPlatformHeight = Phaser.Math.Clamp(nextPlatformGap, minPlatformHeight, maxPlatformHeight);
            this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2, nextPlatformHeight);
        }
    }
};

function resize(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowHeight / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
