/* Browser presentation and input. Open index.html directly to play. */
(() => {
  'use strict';
  const {Game, WIDTH, HEIGHT, SPRITES, COLORS} = SpaceAttack;
  const $ = id => document.getElementById(id);
  const game = new Game();
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const keys = new Set();
  let highScore = 0, muted = false, audio, lastTime = 0, visualTime = 0, bannerTimer = 0, shake = 0, lastHud = '';
  try { highScore = Number(localStorage.getItem('space-attack-high')) || 0; muted = localStorage.getItem('space-attack-muted') === 'true'; } catch {}
  const stars = Array.from({length:65}, () => ({x:Math.random()*WIDTH,y:Math.random()*HEIGHT,s:Math.random()>.87?2:1,speed:4+Math.random()*13,opacity:.12+Math.random()*.3}));
  const format = n => String(n).padStart(6,'0');
  function sprite(context,type,x,y,scale=3,frame=0) {
    context.fillStyle=COLORS[type];
    SPRITES[type].forEach((row,iy)=> [...row].forEach((pixel,ix)=> {
      if(pixel==='1') { let px=ix; if(frame && type<3 && iy>=6) px=8-ix; context.fillRect(Math.round(x+(px-4.5)*scale),Math.round(y+(iy-4)*scale),scale,scale); }
    }));
  }
  document.querySelectorAll('[data-sprite]').forEach(el=>sprite(el.getContext('2d'),Number(el.dataset.sprite),18,13,3));
  function initAudio() {
    try { if(!audio) audio=new (window.AudioContext||window.webkitAudioContext)(); if(audio.state==='suspended') audio.resume().catch(()=>{}); } catch {}
  }
  function tone(freq,duration=.07,type='square',volume=.025,endFreq=freq) {
    if(muted || !audio || audio.state!=='running') return;
    const oscillator=audio.createOscillator(), gain=audio.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(freq,audio.currentTime);oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),audio.currentTime+duration);
    gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+duration);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  function updateSound() { $('sound').setAttribute('aria-pressed',String(!muted));$('sound-label').textContent=muted?'SOUND OFF':'SOUND ON'; }
  function toggleSound() { muted=!muted;initAudio();updateSound();try{localStorage.setItem('space-attack-muted',String(muted));}catch{} }
  function saveHighScore() {
    if(game.score>highScore) {highScore=game.score;try{localStorage.setItem('space-attack-high',String(highScore));}catch{}}
  }
  function updateHud() {
    const signature=`${game.score}/${game.wave}/${game.lives}/${highScore}`;
    if(signature===lastHud)return;
    lastHud=signature;
    $('score').textContent=format(game.score);$('high-score').textContent=format(Math.max(highScore,game.score));
    $('wave').textContent=String(game.wave).padStart(2,'0');
    $('health').querySelectorAll('i').forEach((el,i)=>el.classList.toggle('empty',i>=game.lives));
    $('health').setAttribute('aria-label',`${game.lives} shields remaining`);$('health-text').textContent=`${game.lives} / 3`;
    $('sector').innerHTML=`SECTOR ${String(game.wave).padStart(2,'0')} <span class="muted">/ DEEP SPACE</span>`;
  }
  function startGame() {
    initAudio();keys.clear();game.start();$('overlay').hidden=true;$('pause').disabled=false;$('pause').innerHTML='Ⅱ <span>PAUSE</span>';
    $('pause').setAttribute('aria-label','Pause game');$('status').textContent='MISSION ACTIVE';lastTime=performance.now();updateHud();
    if(document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }
  function showOverlay(mode) {
    $('overlay').hidden=false;
    const paused=mode==='paused';
    $('overlay-tag').textContent=paused?'TAKE A BREATHER, PILOT.':'TRANSMISSION LOST';
    $('hero-ship').style.display=paused?'':'none';
    $('overlay-title').innerHTML=paused?'MISSION<br>PAUSED':'GAME<br>OVER';
    $('overlay-copy').innerHTML=paused?'The galaxy can wait a moment.<br>Jump back in when you’re ready.':`FINAL SCORE <strong class="mint">${format(game.score)}</strong><br>WAVE ${String(game.wave).padStart(2,'0')} REACHED · ${game.score>=highScore && game.score>0?'HIGH SCORE!':'EARTH NEEDS ANOTHER HERO.'}`;
    $('start').innerHTML=paused?'RESUME GAME <span>↗</span>':'PLAY AGAIN <span>↗</span>';
    $('enter-hint').innerHTML=paused?'PRESS <kbd>P</kbd> OR <kbd>ENTER</kbd> TO RESUME':'OR PRESS <kbd>ENTER</kbd> TO RESTART';
    $('status').textContent=paused?'MISSION PAUSED':'SIGNAL LOST';
  }
  function togglePause() {
    if(!['playing','paused'].includes(game.mode)) return;
    game.pause();keys.clear();
    if(game.mode==='paused') {showOverlay('paused');$('pause').innerHTML='▶ <span>RESUME</span>';$('pause').setAttribute('aria-label','Resume game');}
    else {$('overlay').hidden=true;$('status').textContent='MISSION ACTIVE';$('pause').innerHTML='Ⅱ <span>PAUSE</span>';$('pause').setAttribute('aria-label','Pause game');lastTime=performance.now();}
  }
  $('start').addEventListener('click',()=>game.mode==='paused'?togglePause():startGame());
  $('pause').addEventListener('click',()=>{togglePause();$('pause').blur();});
  $('sound').addEventListener('click',()=>{toggleSound();$('sound').blur();});
  $('fullscreen').addEventListener('click',async()=>{
    try {if(document.fullscreenElement) await document.exitFullscreen();else await $('cabinet').requestFullscreen();} catch { $('fullscreen').title='Fullscreen is unavailable in this browser'; }
    $('fullscreen').blur();
  });
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');});
  const mapped = new Set(['ArrowLeft','ArrowRight','KeyA','KeyD','Space','Enter','KeyP','Escape','KeyM']);
  window.addEventListener('keydown',event=>{
    if(!mapped.has(event.code)) return;
    // Let keyboard users activate the focused button with Enter or Space.
    if(event.target instanceof HTMLButtonElement && ['Enter','Space'].includes(event.code)) return;
    event.preventDefault();
    if(!event.repeat) {
      if(event.code==='Enter') {if(game.mode==='ready'||game.mode==='over')startGame();else if(game.mode==='paused')togglePause();}
      if(event.code==='KeyP'||event.code==='Escape') togglePause();
      if(event.code==='KeyM') toggleSound();
    }
    if(game.mode==='playing') keys.add(event.code);
  });
  window.addEventListener('keyup',event=>keys.delete(event.code));
  function focusLost() {keys.clear();if(game.mode==='playing')togglePause();}
  window.addEventListener('pagehide',saveHighScore);
  window.addEventListener('blur',focusLost);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)focusLost();});
  document.querySelectorAll('[data-key]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(button.dataset.key);});
    for(const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event,()=>keys.delete(button.dataset.key));
  });
  function events() {
    for(const event of game.events) {
      if(event.type==='shot') tone(900,.06,'square',.012,240);
      if(event.type==='kill') tone(180,.1,'sawtooth',.018,45);
      if(event.type==='hurt') {tone(110,.3,'sawtooth',.045,25);shake=.24;}
      if(event.type==='wave') {$('wave-banner').textContent=`WAVE ${String(event.wave).padStart(2,'0')}`;bannerTimer=1.6;tone(440,.2,'triangle',.04,880);}
      if(event.type==='clear') {$('wave-banner').textContent='SECTOR CLEAR · +500';bannerTimer=2;tone(660,.4,'triangle',.04,1320);saveHighScore();}
      if(event.type==='over') {saveHighScore();showOverlay('over');$('pause').disabled=true;$('wave-banner').textContent='';bannerTimer=0;tone(240,.7,'sawtooth',.04,30);}
    }
    game.events=[];
  }
  function render(dt) {
    ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.fillStyle='#030605';ctx.fillRect(0,0,WIDTH,HEIGHT);
    const running=game.mode==='playing';
    for(const star of stars) {
      if(running || game.mode==='ready') star.y=(star.y+star.speed*dt)%HEIGHT;
      ctx.globalAlpha=star.opacity;ctx.fillStyle='#a9cbb6';ctx.fillRect(Math.floor(star.x),Math.floor(star.y),star.s,star.s);
    }
    ctx.globalAlpha=1;ctx.save();
    if(shake>0 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {ctx.translate((Math.random()-.5)*7,(Math.random()-.5)*7);shake-=dt;}
    if(game.mode==='ready') {
      ctx.globalAlpha=.35;
      for(const e of game.enemies) sprite(ctx,e.type,e.baseX+Math.sin(visualTime*.5)*20,e.baseY,2,Math.floor(visualTime*2)%2);
      ctx.globalAlpha=.65;sprite(ctx,3,WIDTH/2,HEIGHT-35,3);ctx.globalAlpha=1;
    } else {
      for(const e of game.enemies) sprite(ctx,e.type,e.x,e.y,3,Math.floor(game.time*3)%2);
      ctx.fillStyle='#e2fff1';for(const b of game.shots){ctx.fillRect(Math.round(b.x-1),Math.round(b.y-6),3,13);ctx.fillStyle='#8af3df33';ctx.fillRect(Math.round(b.x-3),Math.round(b.y+7),7,7);ctx.fillStyle='#e2fff1';}
      ctx.fillStyle='#ff9b70';for(const b of game.hostile){ctx.fillRect(Math.round(b.x-2),Math.round(b.y-5),4,10);ctx.fillStyle='#ff565b44';ctx.fillRect(Math.round(b.x-3),Math.round(b.y-9),6,5);ctx.fillStyle='#ff9b70';}
      if(game.lives>0 && (!game.player.invulnerable || Math.floor(game.player.invulnerable*12)%2===0)) {
        sprite(ctx,3,game.player.x,game.player.y,3);
        ctx.fillStyle=Math.floor(game.time*12)%2?'#efc777':'#8af3df';ctx.fillRect(Math.round(game.player.x-3),game.player.y+13,6,Math.floor(game.time*12)%2?7:4);
      }
      for(const p of game.particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),3,3);}ctx.globalAlpha=1;
    }
    ctx.restore();
  }
  function frame(time) {
    const dt=Math.min((time-lastTime)/1000||0,.04);lastTime=time;
    if(game.mode!=='paused')visualTime+=dt;
    game.update(dt,{left:keys.has('ArrowLeft')||keys.has('KeyA'),right:keys.has('ArrowRight')||keys.has('KeyD'),fire:keys.has('Space')});
    events();
    if(game.mode==='playing' && bannerTimer>0) {bannerTimer-=dt;if(bannerTimer<=0)$('wave-banner').textContent='';}
    updateHud();render(dt);requestAnimationFrame(frame);
  }
  game.events=[];updateSound();updateHud();requestAnimationFrame(frame);
})();
