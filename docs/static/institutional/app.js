const menu = document.querySelector('#menu_ham1');
const openButton = document.querySelector('#open');
const closeButton = document.querySelector('#close');
function toggleMenu(show) {
  menu.classList.toggle('invisible', !show); menu.classList.toggle('visible', show);
  openButton.classList.toggle('invisible', show); openButton.classList.toggle('visible', !show);
  closeButton.classList.toggle('invisible', !show); closeButton.classList.toggle('visible', show);
  openButton.setAttribute('aria-expanded', String(show));
}
openButton.addEventListener('click', () => toggleMenu(true));
closeButton.addEventListener('click', () => toggleMenu(false));
document.addEventListener('keydown', e => { if(e.key === 'Escape') toggleMenu(false); });
const tabs = [...document.querySelectorAll('[data-tab]')];
function selectTab(index) {
  tabs.forEach((a,i) => {
    a.setAttribute('aria-selected', String(i === index));
    a.parentElement.classList.toggle('jwts_tabberactive', i === index);
    document.getElementById(`panel-${i}`).classList.toggle('jwts_tabbertabhide', i !== index);
  });
}
tabs.forEach((a,i) => {
  a.addEventListener('click', e => {e.preventDefault(); selectTab(i);});
  a.addEventListener('keydown', e => {
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    e.preventDefault();
    const n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    selectTab(n); tabs[n].focus();
  });
});
// Controles locais de acessibilidade, sem serviços externos.
const access = document.createElement('button');
access.className='access-button'; access.textContent='♿'; access.setAttribute('aria-label','Opciones de accesibilidad');
access.setAttribute('aria-expanded','false');
const panel = document.createElement('aside'); panel.className='access-panel'; panel.hidden=true;
panel.innerHTML='<strong>Opciones de accesibilidad</strong><button data-action="larger">Aumentar texto</button><button data-action="smaller">Reducir texto</button><button data-action="contrast">Alto contraste</button><button data-action="reset">Restaurar</button><button data-action="close">Cerrar</button>';
document.body.append(access,panel);
access.onclick=()=>{panel.hidden=!panel.hidden; access.setAttribute('aria-expanded',String(!panel.hidden));};
let scale=100;
panel.addEventListener('click', e=>{
  const action=e.target.dataset.action;
  if(action==='larger') scale=Math.min(150,scale+10);
  if(action==='smaller') scale=Math.max(80,scale-10);
  if(action==='contrast') document.body.classList.toggle('high-contrast');
  if(action==='reset'){scale=100;document.body.classList.remove('high-contrast');}
  if(action==='close'){panel.hidden=true;access.setAttribute('aria-expanded','false');access.focus();}
  document.documentElement.style.fontSize=scale+'%';
});
