window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 720;
    let enemies = []
    let score = 0;
    let gameOver = false;

    class InputHandler {
        constructor(){
            this.keys = [];
            window.addEventListener('keydown', e => {
                if ((   e.key === 'ArrowDown' ||
                        e.key === 'ArrowUp' ||
                        e.key ==='ArrowLeft' ||
                        e.key === 'ArrowRight') 
                        && this.keys.indexOf(e.key) === -1){
                    this.keys.push(e.key);
                }
                
            });
            window.addEventListener('keyup', e =>{
                if (    e.key === 'ArrowDown' ||
                        e.key === 'ArrowUp' ||
                        e.key ==='ArrowLeft' ||
                        e.key === 'ArrowRight'){
                    this.keys.splice(this.keys.lastIndexOf(e.key), 1);
                }
                
            });
        }
    }

    class Player {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 200;
            this.height = 200;
            this.x = 0;
            this.y = this.gameHeight - this.height;
            this.image = document.getElementById('playerImage');
            this.framex = 0;
            this.maxFrame = 8;
            this.framey = 0;
            this.fps = 20;
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fps;
            this.speed = 0;
            this.vy = 0;
            this.weight = 1;
        }
        draw(context){
            context.drawImage(this.image, this.framex * this.width, this.framey * this.height, 
                this.width, this.height, this.x, this.y, this.width, this.height);
        }
        update(input, deltaTime, enemies){
            enemies.forEach(enemy => {
                const dx = (enemy.x + enemy.width/2) - (this.x + this.width/2);
                const dy = (enemy.y + enemy.height/2) - (this.y + this.height/2);
                const distance = Math.sqrt(dx*dx+dy*dy);
                if (distance < enemy.width/2 + this.width/2){
                    gameOver = true;
                }
            })

            if (this.frameTimer > this.frameInterval){
                if (this.framex >= this.maxFrame) this.framex = 0;
                else this.framex++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
            

            if (input.keys.indexOf('ArrowRight') > -1) {
                this.speed = 5;
            } else if (input.keys.indexOf('ArrowLeft') > -1){
                this.speed = -5;
            } else if (input.keys.indexOf('ArrowUp') > -1 && this.onGround()) {
                this.vy -= 32;
            } else {
                this.speed = 0;
            }

            this.x += this.speed;
            if (this.x < 0) this.x = 0;
            else if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;

            this.y += this.vy;
            if (!this.onGround()){
                this.vy += this.weight;
                this.maxFrame = 5;
                this.framey = 1;
            } else {
                this.vy = 0;
                this.maxFrame = 8;
                this.framey = 0;
            }
            if (this.y > this.gameHeight - this.height) this.y > this.gameHeight - this.height;
        }
        onGround(){
            return this.y >= this.gameHeight - this.height;
        }
}

    class Background {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document.getElementById('backgroundImage');
            this.x = 0;
            this.y = 0;
            this.width = 2400;
            this.height = 720;
            this.speed = 7;
        }
        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
        }
        update(){
            this.x -= this.speed;
            if (this.x < 0 - this.width) this.x = 0;
        }
    }

    class Enemy {
        constructor(){
            //this.gameWidth = gameWidth;
            //this.gameHeight = gameHeight;
            //this.width = 300;
            //this.height = 200;
            //this.image = document.getElementById('enemyImage');
            //this.x = this.gameWidth;
            //this.y = this.gameHeight - this.height;
            this.framex = 0;
            this.framey = 0;
            //this.maxFrame = 5;
            this.fps = 10;
            this.frameTimer = 0;
            this.frameInterval = 1000/this.fps;
            this.speed = 9;
            this.markedForDeletion = false;
        }
        draw(context){
            context.drawImage(this.image, this.framex * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height,);
        }

        update(deltaTime){
            if (this.frameTimer > this.frameInterval){
                if (this.framex >= this.maxFrame) this.framex = 0;
                else this.framex++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
            
            this.x -= this.speed;
            if (this.x < 0 - this.width) {
                this.markedForDeletion = true;
                score++;
            }
        }
    }

    class FlyingEnemy extends Enemy {
        constructor(game){
            super();
            this.game = game;
            this.width = 160;
            this.height = 100;
            this.x = 200;
            this.y = 200;
            this.speedx = 2;
            this.maxFrame = 5;
            this.image = document.getElementById('enemyBat');
        }
        update(deltaTime){
            super.update(deltaTime);
            
        }
    }

    class GroundEnemy extends Enemy {

    }

    class ClimbingEnemy extends Enemy {

    }

    function handleEnemies(deltaTime){
        if (enemyTimer > enemyInterval + randomEnemyInterval){
            enemies.push(new Enemy(canvas.width, canvas.height));
            randomEnemyInterval = Math.random() * 1000 + 500;
            enemyTimer = 0;
        } else {
            enemyTimer += deltaTime;
        }
        enemies.forEach(enemy => {
            enemy.draw(ctx);
            enemy.update(deltaTime);
        });
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    }

    function displayStatusText(context){
        context.font = '40px Helvetica';
        context.fillStyle = 'black';
        context.fillText('Score: ' + score, 20, 50);
        context.fillStyle = 'white';
        context.fillText('Score: ' + score, 22, 52);
        if (gameOver){
            context.textAlign = 'center';
            context.fillStyle = 'black';
            context.fillText('Game Over! Try Again!', canvas.width/2, 200);
            context.textAlign = 'center';
            context.fillStyle = 'white';
            context.fillText('Game Over! Try Again!', canvas.width/2 + 2, 202);
        }
    }

    const input = new InputHandler();
    const player = new Player(canvas.width, canvas.height);
    const background = new Background(canvas.width, canvas.height)

    let lastTime = 0;
    let enemyTimer = 0;
    let enemyInterval = 1000;
    let randomEnemyInterval = Math.random() * 1000 + 500;

    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0,0, canvas.width, canvas.height);
        background.draw(ctx);
        background.update();
        player.draw(ctx);
        player.update(input, deltaTime, enemies);
        handleEnemies(deltaTime);
        displayStatusText(ctx);
        if (!gameOver) requestAnimationFrame(animate);
        
    }
   animate(0);
})