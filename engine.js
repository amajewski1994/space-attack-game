/* Pure game simulation: no DOM, dependencies, or assets. */
(function (root) {
  'use strict';
  const WIDTH = 720, HEIGHT = 480;
  const SPRITES = [
    ['100000001','010000010','001111100','011111110','110110011','111111111','001000100','010101010'],
    ['001000100','000101000','001111100','011010110','111111111','101111101','101000101','000101000'],
    ['100000001','101000101','111101111','011111110','001111100','000111000','001010100','010000010'],
    ['000010000','000111000','000111000','001111100','001010100','111010111','111111111','110000011']
  ];
  const COLORS = ['#ff565b', '#8bf19c', '#f0d774', '#8af3df'];
  const POINTS = [100, 200, 400];
  const intersects = (a, b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
  class Game {
    constructor(random = Math.random) { this.random = random; this.mode = 'ready'; this.reset(); this.mode = 'ready'; }
    reset() {
      this.score = 0; this.wave = 0; this.lives = 3; this.time = 0;
      this.player = {x: WIDTH / 2, y: HEIGHT - 39, w: 23, h: 20, invulnerable: 0};
      this.shots = []; this.hostile = []; this.particles = []; this.events = [];
      this.fireCooldown = 0; this.transition = 0; this.nextWave();
    }
    start() { this.reset(); this.mode = 'playing'; }
    pause() { if (this.mode === 'playing') this.mode = 'paused'; else if (this.mode === 'paused') this.mode = 'playing'; }
    nextWave() {
      this.wave++; this.enemies = []; this.hostile = []; this.shots = [];
      this.waveTime = 0; this.attackClock = 1.8; this.diveClock = 3; this.transition = 0;
      for (let row = 0; row < 5; row++) {
        const count = row === 0 ? 2 : row === 1 ? 6 : 10;
        for (let col = 0; col < count; col++) {
          const type = row === 0 ? 2 : row === 1 ? 1 : 0;
          const baseX = WIDTH / 2 + (col - (count - 1) / 2) * 43;
          this.enemies.push({x:baseX, y:38 + row * 32, baseX, baseY:38 + row * 32, type, w:27, h:24, diving:false, diveTime:0});
        }
      }
      this.events.push({type:'wave', wave:this.wave});
    }
    burst(x,y,color,count=16) {
      for(let i=0;i<count;i++) { const angle=this.random()*Math.PI*2, speed=25+this.random()*110; this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.3+this.random()*.4,color}); }
    }
    hitPlayer() {
      if(this.player.invulnerable > 0 || this.mode !== 'playing') return;
      this.lives--; this.player.invulnerable = 1.9;
      this.burst(this.player.x,this.player.y,COLORS[3],28); this.events.push({type:'hurt'});
      if(this.lives <= 0) { this.mode='over'; this.events.push({type:'over'}); }
    }
    update(dt, keys = {}) {
      if(this.mode !== 'playing') return;
      dt = Math.min(dt, .04); this.time += dt; this.waveTime += dt;
      this.player.invulnerable = Math.max(0,this.player.invulnerable-dt);
      this.fireCooldown -= dt;
      const movement = Number(!!keys.right) - Number(!!keys.left);
      this.player.x = Math.max(20,Math.min(WIDTH-20,this.player.x + movement*325*dt));
      if(keys.fire && this.fireCooldown <= 0 && !this.transition) {
        this.shots.push({x:this.player.x,y:this.player.y-17,w:4,h:13});
        this.fireCooldown = .19; this.events.push({type:'shot'});
      }
      this.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;});
      this.particles=this.particles.filter(p=>p.life>0);
      if(this.transition) { this.transition-=dt; if(this.transition<=0) this.nextWave(); return; }
      const sway = Math.sin(this.waveTime*(.6+Math.min(this.wave,20)*.035))*92;
      for(const e of this.enemies) {
        if(e.diving) {
          e.diveTime+=dt;
          e.y+= (105+Math.min(this.wave,25)*13)*dt;
          e.x=e.diveX+Math.sin(e.diveTime*3.4)*62+e.drift*e.diveTime;
          e.x=Math.max(17,Math.min(WIDTH-17,e.x));
          if(e.y>HEIGHT+30) { e.diving=false; e.y=e.baseY; }
        } else { e.x=e.baseX+sway; e.y=e.baseY+Math.sin(this.waveTime*1.4+e.baseX)*3; }
      }
      this.attackClock-=dt; this.diveClock-=dt;
      if(this.attackClock<=0 && this.enemies.length) {
        // Stretch the fire ramp: wave 1 stays the same; wave 6 gets the
        // former wave 3 volleys, projectile speed, and firing interval.
        const fireLevel=1+(this.wave-1)*.4;
        const attackers=1+Math.min(3,Math.floor(fireLevel/3));
        for(let i=0;i<attackers;i++) {
          const e=this.enemies[Math.floor(this.random()*this.enemies.length)];
          const speed=155+Math.min(25,fireLevel)*12;
          const dx=this.player.x-e.x,dy=Math.max(90,this.player.y-e.y),len=Math.hypot(dx,dy);
          this.hostile.push({x:e.x,y:e.y+12,w:5,h:11,vx:dx/len*speed*.65,vy:dy/len*speed});
        }
        this.attackClock=Math.max(.32,1.3-fireLevel*.065)+this.random()*.3;
      }
      if(this.diveClock<=0 && this.enemies.length) {
        const ready=this.enemies.filter(e=>!e.diving);
        if(ready.length) { const e=ready[Math.floor(this.random()*ready.length)]; e.diving=true;e.diveTime=0;e.diveX=e.x;e.drift=(this.player.x-e.x)*.18; }
        this.diveClock=Math.max(.55,2.4-this.wave*.13);
      }
      for(const b of this.shots) {
        b.y-=560*dt;
        const enemy=this.enemies.find(e=>!e.dead && intersects(b,e));
        if(enemy) { enemy.dead=true;b.dead=true;this.score+=POINTS[enemy.type];this.burst(enemy.x,enemy.y,COLORS[enemy.type]);this.events.push({type:'kill',points:POINTS[enemy.type]}); }
      }
      this.enemies=this.enemies.filter(e=>!e.dead);
      this.shots=this.shots.filter(b=>!b.dead && b.y>-20);
      for(const b of this.hostile) {
        b.x+=b.vx*dt;b.y+=b.vy*dt;
        if(intersects(b,this.player)) { b.dead=true;this.hitPlayer(); }
      }
      for(const e of this.enemies) if(intersects(e,this.player)) { this.hitPlayer();e.diving=false;e.y=e.baseY; }
      this.hostile=this.hostile.filter(b=>!b.dead && b.y<HEIGHT+20 && b.x>-20 && b.x<WIDTH+20);
      if(!this.enemies.length && this.mode==='playing') { this.transition=2.2;this.hostile=[];this.shots=[];this.score+=500;this.events.push({type:'clear'}); }
    }
  }
  const api={Game,WIDTH,HEIGHT,SPRITES,COLORS,POINTS,intersects};
  if(typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.SpaceAttack=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
