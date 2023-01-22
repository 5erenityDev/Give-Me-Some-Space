/*//////////////////////////////////////
            HELPER FUNCTIONS
//////////////////////////////////////*/

//gets a random integer from 0 to max(-1)
function getRandomInt(max)
{
    return Math.floor(Math.random() * Math.floor(max));
}

//generates an enemy with random stats
function randomlyGenerateEnemy()
{
    let id = Math.random();
    let position =
    {
        x: (game_width * Math.random()),
        y: (game_height * Math.round(Math.random()))
    };
    let speed = 1 + getRandomInt(3);
    let rotation_speed = getRandomInt(3) * 5 + 20;
    let limit = 1 + getRandomInt(3);
    let attack_speed = 1 + getRandomInt(3);
    enemy_list[id] = new Enemy(id, position, speed, rotation_speed, limit, attack_speed);
}

//generates a random upgrade that the player can pick up
function randomlyGenerateUpgrade()
{
    let id = Math.random();
    let position =
    {
        x: (game_width * Math.random()),
        y: (game_height * Math.random())
    };
    let state = getRandomInt(5);
    upgrade_list[id] = new Upgrade(id, position, state);
}

//generates either the player's or the enemies bullets
function GenerateBullet(entity)
{
    let id = Math.random();
    let position =
    {
        x: entity.position.x,
        y: entity.position.y
    };
    let color = entity.color;
    let state = entity.tag;
    bullet_list[id] = new Bullet(entity, id, position, color, state);
}

//resets all values to simulate a new game
function startNewGame()
{
    player.position.x = game_width / 2;
    player.position.y = game_height / 2;
    player.translation.x = 0;
    player.translation.y = 0;
    player.rotation = 0;
    player.rotation_speed = 30;
    player.hp = 3;
    player.score = 0;
    power.rotation_timer = 0;
    power.thruster_timer = 0;
    power.rapidfire_timer = 0;
    enemy_list = {};
    upgrade_list = {};
    bullet_list = {};
}

//prevents arrow key page scrolling
window.addEventListener("keydown", function (e)
{
    // space and arrow keys
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1)
    {
        e.preventDefault();
    }

}, false);


/*//////////////////////////////////////
            KEYBOARD INPUT
//////////////////////////////////////*/

class InputHandler
{
    constructor() {
        document.addEventListener("keydown", this.keydown, false);
        document.addEventListener("keyup", this.keyup, false);
    }

    //reads when a key is pressed and what key it is
    keydown(event) {
        let key = key_map[event.keyCode]
        input[key] = true
    }

    //reads when a key is released and what key it is
    keyup(event) {
        let key = key_map[event.keyCode]
        input[key] = false
    }
}


/*//////////////////////////////////////
               COLLISION
//////////////////////////////////////*/

class Collision
{
    constructor() {}

    //determines how far two entities are from eachother
    findDistance(entity1, entity2)
    {
        let vx = entity1.position.x - entity2.position.x;
        let vy = entity1.position.y - entity2.position.y;
        return Math.sqrt(vx * vx + vy * vy)
    }

    //returns true if the origins are within 25 pixels of eachother
    test(entity1, entity2)
    {
        let distance = this.findDistance(entity1, entity2);
        return distance < 25;
    }
}


/*//////////////////////////////////////
                PLAYER
//////////////////////////////////////*/

class Player
{
    constructor()
    {
        this.position =
        {
            x: (game_width / 2),
            y: (game_height / 2)
        };
        this.translation =
        {
            x: 0,
            y: 0
        };
        this.rotation = 0;
        this.speed = 5;
        this.rotation_speed = 50;
        this.limit = 10;
        this.turbo = 30;
        this.color = 'WHITE';
        this.hp = 3;
        this.score = 0;
        this.inv_frames = 100;
        this.attack_speed = 1;
        this.next_bullet = 0;
        this.tag = 'player';
    }


    update(ctx, delta_time, input)
    {
        if (player.hp > 0)
        {
            this.movement(delta_time, input);
            this.edges();
            this.draw(ctx);
        }
        else
        {
            this.colorChoice();
            this.position.x = 2000;
            this.position.y = 2000;
            ctx.textAlign = 'center';
            ctx.fillText("Game Over: " + "You Earned " +  this.score + " Points", game_width / 2, game_height / 2);
            ctx.fillText('Press "Enter" to restart', game_width / 2, game_height / 1.5);
            if (input.new_game)
                startNewGame();
            
        }
    }

    movement(delta_time, input)
    {
        //initialize acceleration variable
        this.acceleration =
        {
            x: this.speed * 0.2 * Math.cos((this.rotation - 90) * (Math.PI / 180)) / delta_time,
            y: this.speed * 0.2 * Math.sin((this.rotation - 90) * (Math.PI / 180)) / delta_time
        };

        if (this.rotation >= 360)
            this.rotation = 0;
        else if (this.rotation <= -360)
            this.rotation = 0;

        //calculates roatation
        if (input.left)
            this.rotation -= this.rotation_speed / delta_time;
        else if (input.right)
            this.rotation += this.rotation_speed / delta_time;

        //detects input for forwards/backwards movement and generates momentum
        if (input.up)
        {
            this.translation.x += this.acceleration.x;
            this.translation.y += this.acceleration.y;
        }
        else if (input.down)
        {
            this.translation.x -= this.acceleration.x;
            this.translation.y -= this.acceleration.y;
        }

        //limits the movement speed
        if (input.turbo && power.thruster_timer > 0)
        {
            if (this.translation.x > this.turbo)
                this.translation.x = this.turbo
            else if (this.translation.x < -this.turbo)
                this.translation.x = -this.turbo
            if (this.translation.y > this.turbo)
                this.translation.y = this.turbo
            else if (this.translation.y < -this.turbo)
                this.translation.y = -this.turbo
        }
        else
        {
            if (this.translation.x > this.limit)
                this.translation.x = this.limit
            else if (this.translation.x < -this.limit)
                this.translation.x = -this.limit
            if (this.translation.y > this.limit)
                this.translation.y = this.limit
            else if (this.translation.y < -this.limit)
                this.translation.y = -this.limit
        }

        //updates the players position by adding the amount it needs to be translated
        this.position.x += this.translation.x;
        this.position.y += this.translation.y;
    }

    edges()
    {
        //collision with the games edges
        if (this.position.x > game_width)
            this.position.x -= game_width;
        else if (this.position.x < 0)
            this.position.x += game_width;
        if (this.position.y > game_height)
            this.position.y -= game_height;
        else if (this.position.y < 0)
            this.position.y += game_height;
    }

    draw(ctx)
    {
        //sets up positioning
        ctx.save();                                         //saves and establishes the default state
        ctx.translate(this.position.x, this.position.y);    //sets position
        ctx.rotate((Math.PI / 180) * this.rotation);        //sets rotation

        //establishes how the lines should look
        ctx.strokeStyle = this.color;                       //sets color to class color so it can be easily changed
        if (this.inv_frames >= 100)
            ctx.lineWidth = 2.5
        else
            ctx.lineWidth = 1

        //path creation
        ctx.beginPath();                                    //begins path creation
        ctx.moveTo(0, 15);
        ctx.lineTo(5, 5);
        ctx.lineTo(10, 10);
        ctx.lineTo(0, -20);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-5, 5);
        ctx.closePath();                                    //returns line to bottom center

        //finalizing and restoring
        ctx.stroke();                                       //finalizes and renders the stroke
        ctx.restore();                                      //restores everything to the default state

        //HUD
        ctx.fillStyle = '#bde7fc';
        ctx.font = '50px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(this.hp + " HP", 10, 50);
        ctx.textAlign = 'right';
        ctx.fillText(this.score + " Points", game_width - 10, 50);
    }

    colorChoice()
    {
        switch (getRandomInt(8))
        {
            case 0: //white
                this.color = 'WHITE';
                break;
            case 1: //yellow
                this.color = 'YELLOW';
                break;
            case 2: //orange
                this.color = 'ORANGE';
                break;
            case 3: //green
                this.color = 'LIME';
                break;
            case 4: //grey
                this.color = 'LIGHTGREY';
                break;
            case 5: //blue
                this.color = 'CYAN';
                break;
            case 6: //purple
                this.color = 'PLUM';
                break;
            case 7: //pink
                this.color = 'MAGENTA';
                break;
        }
    }
}


/*//////////////////////////////////////
                 ENEMY
//////////////////////////////////////*/

class Enemy
{
    constructor(id, position, speed, rotation_speed, limit, attack_speed)
    {
        this.id = id;
        this.position =
        {
            x: position.x,
            y: position.y
        };
        this.translation =
        {
            x: 0,
            y: 0
        };
        this.rotation = 0;
        this.speed = speed;
        this.rotation_speed = rotation_speed;
        this.limit = limit;
        this.color = 'red';
        this.hp = 1;
        this.attack_speed = attack_speed;
        this.next_bullet = 0;
        this.tag = 'enemy';
    }
    update(ctx, delta_time) {

        this.movement(delta_time);
        this.edges(game_width, game_height);
        this.draw(ctx);
    }

    movement(delta_time) {
        //initialize acceleration variable
        this.acceleration =
        {
            x: this.speed * 0.2 * Math.cos((this.rotation - 90) * (Math.PI / 180)) / delta_time,
            y: this.speed * 0.2 * Math.sin((this.rotation - 90) * (Math.PI / 180)) / delta_time
        };

        //calculates if the rotation has gone over 360, if so it will set it back to zero
        if (this.rotation >= 360)
            this.rotation = 0;
        else if (this.rotation <= -360)
            this.rotation = 0;

        //calculates roatation
        if (player.position.x >= this.position.x && player.position.y <= this.position.y)             //quadrant 1
        {
            if (this.rotation >= 225 && this.rotation >= 0 || this.rotation >= -135 && this.rotation <= 0 || this.rotation >= 0 && this.rotation <= 45 || this.rotation >= -360 && this.rotation <= -315)
                this.rotation += this.rotation_speed / delta_time;
            else
                this.rotation -= this.rotation_speed / delta_time;
        }
        else if (player.position.x <= this.position.x && player.position.y <= this.position.y)        //quadrant 2
        {
            if (this.rotation >= -225 && this.rotation <= -45 || this.rotation >= 135 && this.rotation <= 315)
                this.rotation += this.rotation_speed / delta_time;
            else
                this.rotation -= this.rotation_speed / delta_time;
        }
        else if (player.position.x <= this.position.x && player.position.y >= this.position.y)        //quadrant 3
        {
            if (this.rotation <= 225 && this.rotation >= 45 || this.rotation <= -135 && this.rotation >= -315)
                this.rotation += this.rotation_speed / delta_time;
            else
                this.rotation -= this.rotation_speed / delta_time;
        }
        else if (player.position.x >= this.position.x && player.position.y >= this.position.y)        //quadrant 4
        {
            if (this.rotation <= -225 && this.rotation >= -360 || this.rotation <= 135 && this.rotation >= 0 || this.rotation >= -45 && this.rotation <= 0 || this.rotation >= 315 && this.rotation <= 360)
                this.rotation += this.rotation_speed / delta_time;
            else
                this.rotation -= this.rotation_speed / delta_time;
        }

        //detects input for forwards/backwards movement and generates momentum
        this.translation.x += this.acceleration.x;
        this.translation.y += this.acceleration.y;

        //limits the movement speed
        if (this.translation.x > this.limit)
            this.translation.x = this.limit;
        else if (this.translation.x < -this.limit)
            this.translation.x = -this.limit;
        if (this.translation.y > this.limit)
            this.translation.y = this.limit;
        else if (this.translation.y < -this.limit)
            this.translation.y = -this.limit;

        //updates the players position by adding the amount it needs to be translated
        this.position.x += this.translation.x;
        this.position.y += this.translation.y;
    }

    edges(game_width, game_height) {
        //collision with the games edges
        if (this.position.x > game_width)
            this.position.x -= game_width;
        else if (this.position.x < 0)
            this.position.x += game_width;
        if (this.position.y > game_height)
            this.position.y -= game_height;
        else if (this.position.y < 0)
            this.position.y += game_height;
    }

    draw(ctx) {
        //sets up positioning
        ctx.save()                                          //saves and establishes the default state
        ctx.translate(this.position.x, this.position.y);    //sets position
        ctx.rotate((Math.PI / 180) * this.rotation);        //sets rotation

        //establishes how the lines should look
        ctx.strokeStyle = this.color;                       //sets color to class color so it can be easily changed
        ctx.lineWidth = 2.5;

        //path creation
        ctx.beginPath();                                    //begins path creation
        ctx.moveTo(0, 15);
        ctx.lineTo(5, 5);
        ctx.lineTo(10, 10);
        ctx.lineTo(0, -20);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-5, 5);
        ctx.closePath();                                    //returns line to bottom center

        //finalizing and restoring
        ctx.stroke();                                       //finalizes and renders the stroke
        ctx.restore();                                      //restores everything to the default state
    }
}


/*//////////////////////////////////////
                BULLET
//////////////////////////////////////*/

class Bullet
{
    constructor(entity, id, position, color, state)
    {
        this.id = id
        this.position =
        {
            x: position.x,
            y: position.y
        };
        this.speed =
        {
            x: Math.cos((entity.rotation - 90)/ 180 * Math.PI) * 100,
            y: Math.sin((entity.rotation - 90)/ 180 * Math.PI) * 100
        };
        this.color = color;
        this.active = true;
        this.timer = 0;
        this.state = state;
        
    }


    update(ctx, delta_time, game_width, game_height)
    {
        this.movement(delta_time);
        this.edges(game_width, game_height);
        this.draw(ctx);
    }

    movement(delta_time)
    {
        //updates the players position by adding the amount it needs to be translated
        this.position.x += this.speed.x / delta_time;
        this.position.y += this.speed.y / delta_time;
    }

    edges()
    {
        //collision with the games edges
        if (this.position.x > game_width)
            this.position.x -= game_width;
        else if (this.position.x < 0)
            this.position.x += game_width;
        if (this.position.y > game_height)
            this.position.y -= game_height;
        else if (this.position.y < 0)
            this.position.y += game_height;
    }

    draw(ctx)
    {
        //sets up positioning
        ctx.save()                                          //saves and establishes the default state
        ctx.translate(this.position.x, this.position.y);    //sets position
        //establishes how the lines should look
        ctx.fillStyle = this.color;                         //sets color to class color so it can be easily changed

        //path creation
        ctx.fillRect(0, 0, 5, 5);                             //returns line to bottom center

        //finalizing and restoring
        ctx.restore();                                      //restores everything to the default state
    }

}


/*//////////////////////////////////////
                UPGRADES
//////////////////////////////////////*/

class Upgrade
{
    constructor(id, position, state)
    {
        this.id = id;
        this.position =
        {
            x: position.x,
            y: position.y
        };
        this.color = 'LIME';
        this.state = state;
        this.timer = 0;
    }


    update(ctx)
    {
        if (typeof (this.state) == 'number')
        {
            this.upgradeChoice();
        }
        else
        {
            this.draw(ctx);
        }
        
    }

    draw(ctx)
    {
        //sets up positioning
        ctx.save()                                          //saves and establishes the default state
        ctx.translate(this.position.x, this.position.y);    //sets position
        //establishes how the lines should look
        ctx.fillStyle = this.color;                         //sets color to class color so it can be easily changed

        //path creation
        ctx.fillRect(0, 0, 20, 20);                         //returns line to bottom center

        //finalizing and restoring
        ctx.restore();                                      //restores everything to the default state
    }

    upgradeChoice()
    {
        switch (this.state)
        {
            case 0: //healing - heals target 1 hp, can not go over 3
                this.color = 'LIME';
                this.state = 'HEALING';
                break;
            case 2: //rotation - faster ship rotation
                this.color = 'ORANGE';
                this.state = 'ROTATION';
                break;
            case 3: //thruster - hold shift for a speed boost
                this.color = 'YELLOW';
                this.state = 'THRUSTER';
                break;
            case 4: //rapid fire - has player fire at a rapid pace
                this.color = 'LIGHTGREY';
                this.state = 'RAPIDFIRE';
                break;
        }
    }

    powerup(power)
    {
        switch (this.state) 
        {
            case 'HEALING':
                if (player.hp < 3)
                    player.hp++;
                break;
            case 'MULTISHOT':
                power.multishot_timer = power.universal_time;
                break;
            case 'ROTATION':
                power.rotation_timer = power.universal_time;
                break;
            case 'THRUSTER':
                power.thruster_timer = power.universal_time;
                break;
            case 'RAPIDFIRE':
                power.rapidfire_timer = power.universal_time;
                break;
        }
    }
}


/*//////////////////////////////////////
                 POWER
//////////////////////////////////////*/

class Power
{
    constructor()
    {
        this.rotation_timer = 0;
        this.thruster_timer = 0;
        this.rapidfire_timer = 0;
        this.universal_time = 900;
    }

    update()
    {
        if (this.thruster_timer > 0)
            this.thruster()
        else
            player.speed = 5;
        if (this.rotation_timer > 0)
            this.rotation()
        else
            player.rotation_speed = 50;
        if (this.rapidfire_timer > 0)
            this.rapidfire()
        else
            player.attack_speed = 1
        
    }

    rotation()
    {
        this.rotation_timer--;
        player.rotation_speed = 100;
    }

    thruster()
    {
        if (input.turbo)
            player.speed = 10;
        else
            player.speed = 5;
        this.thruster_timer--;
    }

    rapidfire()
    {
        this.rapidfire_timer--;
        player.attack_speed = 5;
    }

}


/*//////////////////////////////////////
               VARIABLES
//////////////////////////////////////*/

let canvas = document.getElementById('gameWindow'),
    ctx = canvas.getContext('2d'),
    fps = 60,
    last_time = 0,
    to_remove = false,
    enemy_count = 0,
    next_upgrade = 0,
    input =
    {
        left: false,
        right: false,
        up: false,
        down: false,
        shoot: false,
        turbo: false,
        new_game: false
    };

var enemy_list = {},
    upgrade_list = {},
    bullet_list = {},
    game_width = canvas.width,
    game_height = canvas.height,
    key_map =
    {
        39: 'right',
        37: 'left',
        38: 'up',
        40: 'down',
        16: 'turbo',
        90: 'shoot',
        13: 'new_game',
    };

let player = new Player();
let collision = new Collision();
let power = new Power();
new InputHandler();


/*//////////////////////////////////////
               GAME LOOP
//////////////////////////////////////*/

function gameLoop(timestamp)
{
    //framerate calculation
    let delta_time = timestamp - last_time;
    last_time = timestamp;

    if (isNaN(delta_time))
        delta_time = 1;

    //clear screen to create new objects
    ctx.clearRect(0, 0, game_width, game_height);

    //update objects and test collision
    for (var key in enemy_list)
    {
        enemy_count++;
        enemy_list[key].update(ctx, delta_time);

        if (collision.test(player, enemy_list[key]) && player.inv_frames >= 100)
        {
            player.hp--;
            player.score++;
            to_remove = true;
            player.inv_frames--;
        }
        else if (player.inv_frames < 100 && player.inv_frames > 0)
            player.inv_frames--;
        else if (player.inv_frames <= 0)
            player.inv_frames = 100;     

        enemy_list[key].next_bullet += enemy_list[key].attack_speed;

        if (enemy_list[key].next_bullet > 500)
        {
            GenerateBullet(enemy_list[key]);
            enemy_list[key].next_bullet = 0;
        }

        if (to_remove)
        {
            delete enemy_list[key];
            to_remove = false;
        }
    }
    
    switch (enemy_count)
    {
        case 0:
            randomlyGenerateEnemy();
            randomlyGenerateEnemy();
            randomlyGenerateEnemy();
            break;
        case 1:
            randomlyGenerateEnemy();
            randomlyGenerateEnemy();
            break;
        case 2:
            randomlyGenerateEnemy();
            break;
    }

    enemy_count = 0;
    next_upgrade++;
    if (next_upgrade >= 500)
    {
        randomlyGenerateUpgrade();
        next_upgrade = 0;
    }

    for (var key in upgrade_list)
    {
        upgrade_list[key].update(ctx, delta_time);
        upgrade_list[key].timer++;
        if (upgrade_list[key].timer > 500)
            to_remove = true;
        if (collision.test(player, upgrade_list[key]))
        {
            upgrade_list[key].powerup(power);
            to_remove = true;
        }

        if (to_remove)
        {
            delete upgrade_list[key];
            to_remove = false;
        }
    }

    for (var key in bullet_list)
    {
        bullet_list[key].update(ctx, delta_time);
        bullet_list[key].timer++;
        if (bullet_list[key].timer > 100)
            to_remove = true;
        if (bullet_list[key].state == 'player')
        {
            for (var key2 in enemy_list)
            {
                if (collision.test(bullet_list[key], enemy_list[key2]))
                {
                    player.score++;
                    to_remove = true;
                    delete enemy_list[key2];
                    break;
                }
            }
        }
        else
        {
            if (collision.test(bullet_list[key], player) && player.inv_frames >= 100)
            {
                player.hp--;
                to_remove = true;
                player.inv_frames = 99;
            }
             
        }
        
        if (to_remove)
        {
            delete bullet_list[key];
            to_remove = false;
        }
    }
    if (player.inv_frames == 99)
        player.inv_frames--;
    else if (player.inv_frames < 100 && player.inv_frames > 0)
        player.inv_frames--;
    else if (player.inv_frames <= 0)
        player.inv_frames = 100;    

    player.next_bullet += player.attack_speed;

    if (input.shoot && player.next_bullet > 50)
    {
        GenerateBullet(player);
        player.next_bullet = 0;
    }
        
    player.update(ctx, delta_time, input, game_width, game_height);
    power.update();

    requestAnimationFrame(gameLoop);
}

gameLoop();
