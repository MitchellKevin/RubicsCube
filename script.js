const cubeEl = document.querySelector('#cube');
const scene = document.querySelector('#scene');
let cube = []; // 3x3x3 array
const moves = []; // log voor solve
let animating = false;

// Kleuren van faces
const colors = {front:'orange', back:'red', left:'blue', right:'green', top:'white', bottom:'yellow'};

// Maak 1 cubie
function createCubie(x,y,z){
  const div = document.createElement('div');
  div.className = 'cubie';
  ['front','back','left','right','top','bottom'].forEach(f=>{
    const face = document.createElement('div');
    face.className = 'face '+f;
    face.style.background = colors[f];
    div.appendChild(face);
  });
  cubeEl.appendChild(div);
  return {el:div, x,y,z, orient:{...colors}};
}

// Init 3x3x3 cube
for(let z=0; z<3; z++){
  cube[z]=[];
  for(let y=0; y<3; y++){
    cube[z][y]=[];
    for(let x=0; x<3; x++){
      const c = createCubie(x,y,z);
      cube[z][y][x]=c;
      updateCubie(c);
    }
  }
}

// Update cubie positie en kleuren
function updateCubie(c){
  const spacing = 70;
  const x = (c.x-1)*spacing;
  const y = (c.y-1)*spacing;
  const z = (1-c.z)*spacing;
  c.el.style.transform = `translate3d(${x}px,${y}px,${z}px)`;
  for(let f in c.orient) c.el.querySelector('.'+f).style.background = c.orient[f];
}

// Draai matrix 90° clockwise
function rotateMatrix(mat, clockwise=true){
  const n = mat.length;
  const res = Array.from({length:n},()=>Array(n));
  for(let i=0;i<n;i++)
    for(let j=0;j<n;j++)
      res[clockwise? j:n-1-j][clockwise? n-1-i:i] = mat[i][j];
  return res;
}

// Draai orientatie van 1 cubie
function rotateCubie(c, axis, clockwise=true){
  const o=c.orient;
  const newO={...o};
  if(axis==='x'){
    clockwise ? (newO.top=o.back,newO.back=o.bottom,newO.bottom=o.front,newO.front=o.top)
              : (newO.top=o.front,newO.front=o.bottom,newO.bottom=o.back,newO.back=o.top);
  } else if(axis==='y'){
    clockwise ? (newO.front=o.left,newO.left=o.back,newO.back=o.right,newO.right=o.front)
              : (newO.front=o.right,newO.right=o.back,newO.back=o.left,newO.left=o.front);
  } else if(axis==='z'){
    clockwise ? (newO.top=o.left,newO.left=o.bottom,newO.bottom=o.right,newO.right=o.top)
              : (newO.top=o.right,newO.right=o.bottom,newO.bottom=o.left,newO.left=o.top);
  }
  c.orient=newO;
}

// Draai een laag
function rotateLayer(axis, index, clockwise=true){
  let mat;
  if(axis==='z'){
    mat = cube[index].map(r=>[...r]);
    mat = clockwise ? rotateMatrix(mat) : rotateMatrix(rotateMatrix(rotateMatrix(mat)));
    cube[index]=mat;
    for(let y=0;y<3;y++)
      for(let x=0;x<3;x++){
        const c=mat[y][x];
        c.x=x; c.y=y;
        rotateCubie(c,'z',clockwise);
        updateCubie(c);
      }
  } else if(axis==='x'){
    mat=[];
    for(let z=0;z<3;z++) mat[z]=[cube[z][0][index],cube[z][1][index],cube[z][2][index]];
    mat = clockwise ? rotateMatrix(mat) : rotateMatrix(rotateMatrix(rotateMatrix(mat)));
    for(let z=0;z<3;z++)
      for(let y=0;y<3;y++){
        cube[z][y][index]=mat[z][y];
        mat[z][y].y=y; mat[z][y].z=z;
        rotateCubie(mat[z][y],'x',clockwise);
        updateCubie(mat[z][y]);
      }
  } else if(axis==='y'){
    mat=[];
    for(let z=0;z<3;z++) mat[z]=[cube[z][index][0],cube[z][index][1],cube[z][index][2]];
    mat = clockwise ? rotateMatrix(mat) : rotateMatrix(rotateMatrix(rotateMatrix(mat)));
    for(let z=0;z<3;z++)
      for(let x=0;x<3;x++){
        cube[z][index][x]=mat[z][x];
        mat[z][x].x=x; mat[z][x].z=z;
        rotateCubie(mat[z][x],'y',clockwise);
        updateCubie(mat[z][x]);
      }
  }
}

// Functie voor buttons
function move(axis, layer, clockwise){
  rotateLayer(axis,layer,clockwise);
  moves.push({axis,layer,clockwise});
}

// Shuffle 1 move per keer
async function shuffleCube(){
  if(animating) return;
  animating=true;
  const options=[['z',0,true],['z',0,false],['z',2,true],['z',2,false],
                 ['x',0,true],['x',0,false],['x',2,true],['x',2,false],
                 ['y',0,true],['y',0,false],['y',2,true],['y',2,false]];
  for(let i=0;i<20;i++){
    const [axis,layer,clockwise]=options[Math.floor(Math.random()*options.length)];
    await new Promise(r=>{rotateLayer(axis,layer,clockwise); moves.push({axis,layer,clockwise}); setTimeout(r,250);});
  }
  animating=false;
}

// Solve 1 move per keer
async function solveCube(){
  if(animating) return;
  animating=true;
  for(let i=moves.length-1;i>=0;i--){
    const {axis,layer,clockwise}=moves[i];
    await new Promise(r=>{rotateLayer(axis,layer,!clockwise); setTimeout(r,250);});
  }
  moves.length=0;
  animating=false;
}

// Shuffle & Solve buttons
document.getElementById('shuffle').onclick=shuffleCube;
document.getElementById('solve').onclick=solveCube;

// Drag to rotate cube
let isDragging=false, lastX=0, lastY=0;
let cubeX=-30, cubeY=30;

scene.addEventListener('mousedown', e=>{isDragging=true; lastX=e.clientX; lastY=e.clientY;});
window.addEventListener('mouseup', ()=>isDragging=false);
window.addEventListener('mousemove', e=>{
  if(!isDragging) return;
  const dx=e.clientX-lastX;
  const dy=e.clientY-lastY;
  cubeX -= dy*0.5;
  cubeY += dx*0.5;
  cubeEl.style.transform = `rotateX(${cubeX}deg) rotateY(${cubeY}deg)`;
  lastX=e.clientX; lastY=e.clientY;
});

