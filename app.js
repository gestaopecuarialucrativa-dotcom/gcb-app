/* GCB v1.0 — Gestão Catireiro Bovino */
/* Código comum a todos os clientes. Configuração vem do GCB_CONFIG no index.html */
if (typeof GCB_CONFIG === 'undefined') {
  var GCB_CONFIG = { cliente: 'default', nome: '', pin: '1234', pinConsultor: '9999', cfgGS: '' };
}


/* GCB v1.0 — Gestão Catireiro Bovino */

var STORE = 'gcb_v2';
var TD = new Date().toISOString().split('T')[0];

var S = {
  pin: '1234',
  pinConsultor: '9999',
  cfgGS: 'https://script.google.com/macros/s/AKfycbyyLVjylYvjW9HK0tUt4Ugs0eBHRavGRPUprniYDyOsWwBmnZ1PaSmO5KEv99cDvayi7A/exec',
  cfgNome: 'Raniery',
  compras: [],
  vendas: [],
  pessoas: [],
  mortes: [],
  isConsultor: false
};

/* ── Utils ── */
function salvarLocal(){try{var d=JSON.parse(localStorage.getItem(STORE)||'{}');Object.assign(d,{pin:S.pin,pinConsultor:S.pinConsultor,cfgGS:S.cfgGS,cfgNome:S.cfgNome,compras:S.compras,vendas:S.vendas,pessoas:S.pessoas,mortes:S.mortes});localStorage.setItem(STORE,JSON.stringify(d));}catch(e){}}
function carregarLocal(){try{var d=JSON.parse(localStorage.getItem(STORE)||'{}');if(d.pin)S.pin=d.pin;if(d.pinConsultor)S.pinConsultor=d.pinConsultor;if(d.cfgGS)S.cfgGS=d.cfgGS;if(d.cfgNome)S.cfgNome=d.cfgNome;if(d.compras)S.compras=d.compras;if(d.vendas)S.vendas=d.vendas;if(d.pessoas)S.pessoas=d.pessoas;if(d.mortes)S.mortes=d.mortes;}catch(e){}}
function R$(v){return'R$ '+(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmtD(iso){if(!iso)return'—';var p=String(iso).split('-');return p[2]+'/'+p[1]+'/'+p[0];}
function n(id){return parseFloat(document.getElementById(id).value)||0;}
function v(id,val){var el=document.getElementById(id);if(el)el.value=val;}
function gel(id){return document.getElementById(id);}
function showEl(id,s){var el=gel(id);if(el)el.style.display=s?'block':'none';}
function toast(msg,ms){var t=gel('toast');t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},ms||2200);}

/* ── PIN ── */
var _pin='', _modoConsultor=false;
function toggleModoConsultor(){_modoConsultor=!_modoConsultor;_pin='';renderDots();gel('login-modo-label').textContent=_modoConsultor?'PIN do consultor':'PIN de acesso';gel('pin-mode-btn').textContent=_modoConsultor?'Entrar como cliente':'Entrar como consultor';gel('pin-err').textContent='';}
function pinKey(k){if(_pin.length>=4)return;_pin+=k;renderDots();if(_pin.length===4)setTimeout(checkPin,180);}
function pinDel(){_pin=_pin.slice(0,-1);renderDots();}
function renderDots(){for(var i=0;i<4;i++){var d=gel('pd'+i);d.classList.remove('f','e');if(i<_pin.length)d.classList.add('f');}}
function pinReset(){_pin='';renderDots();gel('pin-err').textContent='';}
function checkPin(){
  var ok=false;
  if(_modoConsultor&&_pin===S.pinConsultor){S.isConsultor=true;ok=true;}
  else if(!_modoConsultor&&_pin===S.pin){S.isConsultor=false;ok=true;}
  if(ok){gel('login-screen').style.display='none';gel('app-screen').style.display='block';pinReset();iniciarApp();registrarAcesso();}
  else{for(var i=0;i<4;i++)gel('pd'+i).classList.add('e');gel('pin-err').textContent='PIN incorreto';setTimeout(pinReset,800);}
}
function logout(){S.isConsultor=false;gel('app-screen').style.display='none';gel('login-screen').style.display='block';pinReset();_modoConsultor=false;gel('login-modo-label').textContent='PIN de acesso';gel('pin-mode-btn').textContent='Entrar como consultor';}

/* ── App init ── */
function iniciarApp(){
  showEl('consultor-bar',S.isConsultor);
  showEl('card-conexao',S.isConsultor);
  showEl('card-pins',S.isConsultor);
  showEl('card-acessos',S.isConsultor);
  v('cfg-url',S.cfgGS||'');v('cfg-nome',S.cfgNome||'');
  // Abertura rapida: desenha JA com o que esta salvo no aparelho
  rHome();rCompras();rVendas();rPessoas();atualizarDatalist();
  // Depois, se tiver conexao, sincroniza em segundo plano e atualiza a tela
  if(S.cfgGS){
    toast('Atualizando...',2000);
    syncNuvem(function(){
      rHome();rCompras();rVendas();rPessoas();atualizarDatalist();
    });
    if(S.isConsultor) carregarAcessos();
  }
}

/* ── Tabs ── */
var tabAtual='home';
function goTab(t){
  tabAtual=t;
  ['home','compras','vendas','relatorio','cfg'].forEach(function(x){
    gel('tab-'+x).classList.toggle('on',x===t);
    gel('pg-'+x).classList.toggle('on',x===t);
  });
  var titulos={home:'Painel',compras:'Compras',vendas:'Vendas',relatorio:'Relatório',cfg:'Configurações'};
  gel('hdr-title').textContent=titulos[t]||'GCB';
  // FABs
  var fc=gel('fab-c'),fv=gel('fab-v');
  if(fc){fc.classList.toggle('vis',t==='compras');}
  if(fv){fv.classList.toggle('vis',t==='vendas');}
  if(t==='home')rHome();
  if(t==='compras')rCompras();
  if(t==='vendas')rVendas();
}

/* ── Modais ── */
function abrirModal(id){gel(id).classList.add('open');}
function fecharModal(id){gel(id).classList.remove('open');}

/* ── Modalidade compra ── */
var modC='perna';
function setModC(m){modC=m;gel('c-mod-perna').classList.toggle('on',m==='perna');gel('c-mod-peso').classList.toggle('on',m==='peso');showEl('c-peso-f',m==='peso');var el=gel('c-valtotal');el.readOnly=m==='peso';el.style.background=m==='peso'?'#f5f5f5':'#fff';calcCompra();}
var modV='perna';
function setModV(m){modV=m;gel('v-mod-perna').classList.toggle('on',m==='perna');gel('v-mod-peso').classList.toggle('on',m==='peso');showEl('v-peso-f',m==='peso');var el=gel('v-valtotal');el.readOnly=m==='peso';el.style.background=m==='peso'?'#f5f5f5':'#fff';calcVenda();}

function calcCompra(){
  if(modC==='peso'){var arr=n('c-arr'),va=n('c-valarr'),vt=arr*va;v('c-valtotal',vt>0?vt.toFixed(2):'');}
  var vt2=n('c-valtotal'),fr=n('c-frete'),co=n('c-comissao'),total=vt2+fr+co,cab=n('c-cab');
  if(total>0){showEl('c-resumo',true);gel('c-r-total').textContent=R$(total);gel('c-r-cab').textContent=cab>0?R$(total/cab)+' por cabeça':'';}
  else showEl('c-resumo',false);
}
function calcVenda(){
  if(modV==='peso'){var arr=n('v-arr'),va=n('v-valarr'),vt=arr*va;v('v-valtotal',vt>0?vt.toFixed(2):'');}
  var rec=n('v-valtotal'),fr=n('v-frete'),co=n('v-comissao'),desp=fr+co,liq=rec-desp;
  if(rec>0){var r=gel('v-resumo');r.style.display='block';r.style.background=liq>=0?'#e8f5e9':'#ffebee';gel('v-r-rec').textContent=R$(rec);gel('v-r-desp').textContent='− '+R$(desp);var le=gel('v-r-liq');le.textContent=R$(liq);le.style.color=liq>=0?'#1B5E20':'#B71C1C';}
  else showEl('v-resumo',false);
}

/* ── Abrir modais ── */
/* ── Seleção de categoria (pills) ── */
function selCat(prefix,cat,el){
  gel(prefix+'-cat-pills').querySelectorAll('.cat-pill').forEach(function(p){p.classList.remove('on');});
  el.classList.add('on');
  v(prefix+'-cat',cat);
}
function limparCatPills(prefix){
  gel(prefix+'-cat-pills').querySelectorAll('.cat-pill').forEach(function(p){p.classList.remove('on');});
  v(prefix+'-cat','');
}

function abrirModalCompra(){
  ['c-data','c-forn','c-cab','c-arr','c-valarr','c-valtotal','c-frete','c-comissao','c-obs'].forEach(function(x){v(x,'');});
  v('c-data',TD);setModC('perna');showEl('c-resumo',false);showEl('ok-compra',false);showEl('err-compra',false);
  limparCatPills('c');
  atualizarDatalist();abrirModal('modal-compra');
}
function abrirModalVenda(){
  ['v-data','v-comp','v-cab','v-refugo','v-arr','v-valarr','v-valtotal','v-frete','v-comissao','v-obs'].forEach(function(x){v(x,'');});
  v('v-data',TD);setModV('perna');showEl('v-resumo',false);showEl('ok-venda',false);showEl('err-venda',false);
  limparCatPills('v');
  atualizarDatalist();abrirModal('modal-venda');
}

/* ── Salvar ── */
function salvarCompra(){
  var cab=n('c-cab'),vt=n('c-valtotal'),cat=(gel('c-cat').value||'').trim();
  if(!cab||!vt||!cat){showEl('err-compra',true);setTimeout(function(){showEl('err-compra',false);},3000);return;}
  var r={id:Date.now(),dt:gel('c-data').value||TD,forn:(gel('c-forn').value||'').trim(),cat:cat,cab:cab,mod:modC,arr:n('c-arr'),valarr:n('c-valarr'),valtotal:vt,frete:n('c-frete'),comissao:n('c-comissao'),obs:(gel('c-obs').value||'').trim()};
  r.custoTotal=vt+r.frete+r.comissao;
  // Salva na planilha primeiro
  var dot=gel('sync-dot');dot.className='sdot sy';
  enviarNuvemComConfirm('compra',r,function(ok){
    if(ok){
      S.compras.unshift(r);salvarLocal();
      dot.className='sdot on';
      showEl('ok-compra',true);
      setTimeout(function(){fecharModal('modal-compra');rCompras();rHome();},1400);
    } else {
      // Sem internet: salva local e marca pendente
      S.compras.unshift(r);r._pendente=true;salvarLocal();
      dot.className='sdot off';
      showEl('ok-compra',true);
      setTimeout(function(){fecharModal('modal-compra');rCompras();rHome();toast('Salvo localmente — sincronizará quando tiver internet',3500);},1400);
    }
  });
}
function salvarVenda(){
  var cab=n('v-cab'),vt=n('v-valtotal'),cat=(gel('v-cat').value||'').trim();
  if(!cab||!vt||!cat){showEl('err-venda',true);setTimeout(function(){showEl('err-venda',false);},3000);return;}
  var r={id:Date.now(),dt:gel('v-data').value||TD,comp:(gel('v-comp').value||'').trim(),cat:cat,cab:cab,refugo:n('v-refugo'),mod:modV,arr:n('v-arr'),valarr:n('v-valarr'),valtotal:vt,frete:n('v-frete'),comissao:n('v-comissao'),obs:(gel('v-obs').value||'').trim()};
  r.recebidoLiq=vt-r.frete-r.comissao;
  var dot=gel('sync-dot');dot.className='sdot sy';
  enviarNuvemComConfirm('venda',r,function(ok){
    if(ok){
      S.vendas.unshift(r);salvarLocal();
      dot.className='sdot on';
      showEl('ok-venda',true);
      setTimeout(function(){fecharModal('modal-venda');rVendas();rHome();},1400);
    } else {
      S.vendas.unshift(r);r._pendente=true;salvarLocal();
      dot.className='sdot off';
      showEl('ok-venda',true);
      setTimeout(function(){fecharModal('modal-venda');rVendas();rHome();toast('Salvo localmente — sincronizará quando tiver internet',3500);},1400);
    }
  });
}
function salvarPessoa(){
  var nome=(gel('p-nome').value||'').trim();if(!nome)return;
  S.pessoas=S.pessoas.filter(function(p){return p.nome!==nome;});
  S.pessoas.push({nome:nome,tel:(gel('p-tel').value||'').trim(),cidade:(gel('p-cidade').value||'').trim()});
  salvarLocal();enviarNuvem('pessoa',S.pessoas[S.pessoas.length-1]);
  v('p-nome','');v('p-tel','');v('p-cidade','');rPessoas();atualizarDatalist();toast('Pessoa salva!');
}

/* ── Render ── */
function rCompras(){
  var busca=(gel('busca-compras').value||'').toLowerCase();
  var lista=S.compras.filter(function(r){return!busca||(r.forn||'').toLowerCase().includes(busca);});
  var el=gel('compras-lista');
  if(!lista.length){el.innerHTML=emptyHtml('Nenhuma compra'+(busca?' encontrada':' registrada'),'Toque em + para registrar');return;}
  el.innerHTML=lista.map(function(r){
    return '<div class="neg-row" onclick="verDet(\x27compra\x27,'+r.id+')" style="cursor:pointer">'
      +'<div><div class="neg-l">'+(r.forn||'—')+'</div>'
      +'<div class="neg-s">'+fmtD(r.dt)+' · '+r.cab+' cab. · <span class="pill pill-'+(r.mod==='peso'?'azul':'cinza')+'" style="font-size:10px">'+(r.mod==='peso'?r.arr+' @':'Na Perna')+'</span></div></div>'
      +'<div class="neg-v neg">'+R$(r.custoTotal)+'</div></div>';
  }).join('');
}
function rVendas(){
  var busca=(gel('busca-vendas').value||'').toLowerCase();
  var lista=S.vendas.filter(function(r){return!busca||(r.comp||'').toLowerCase().includes(busca);});
  var el=gel('vendas-lista');
  if(!lista.length){el.innerHTML=emptyHtml('Nenhuma venda'+(busca?' encontrada':' registrada'),'Toque em + para registrar');return;}
  el.innerHTML=lista.map(function(r){
    return '<div class="neg-row" onclick="verDet(\x27venda\x27,'+r.id+')" style="cursor:pointer">'
      +'<div><div class="neg-l">'+(r.comp||'—')+'</div>'
      +'<div class="neg-s">'+fmtD(r.dt)+' · '+r.cab+' cab.'+(r.refugo?' · <span class="pill pill-laranja" style="font-size:10px">'+r.refugo+' refugo</span>':'')+'</div></div>'
      +'<div class="neg-v">'+R$(r.recebidoLiq)+'</div></div>';
  }).join('');
}
function rPessoas(){
  var el=gel('pessoas-lista');
  if(!S.pessoas.length){el.innerHTML='<div style="font-size:12px;color:#bbb;text-align:center;padding:10px">Nenhuma pessoa cadastrada</div>';return;}
  el.innerHTML=S.pessoas.map(function(p,i){
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef2ec">'
      +'<div><div style="font-size:13px;font-weight:700">'+p.nome+'</div><div style="font-size:11px;color:#65766a">'+(p.cidade||'')+(p.tel?' · '+p.tel:'')+'</div></div>'
      +'<button onclick="S.pessoas.splice('+i+',1);salvarLocal();rPessoas();atualizarDatalist();" style="background:none;border:none;color:#ccc;cursor:pointer;padding:6px">'
      +'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>'
      +'</button></div>';
  }).join('');
}
function atualizarDatalist(){var dl=gel('dl-pessoas');if(dl)dl.innerHTML=S.pessoas.map(function(p){return'<option value="'+p.nome+'">';}).join('');}
function emptyHtml(t,s){return'<div class="empty"><div class="empty-t">'+t+'</div><div class="empty-s">'+s+'</div></div>';}

/* ── Dashboard ── */
function getFiltro(per){
  var hoje=new Date();hoje.setHours(23,59,59);
  var de=new Date();
  per=per||gel('home-per').value;
  if(per==='mes')de=new Date(hoje.getFullYear(),hoje.getMonth(),1);
  else if(per==='30'){de=new Date();de.setDate(de.getDate()-30);}
  else if(per==='ano')de=new Date(hoje.getFullYear(),0,1);
  else de=new Date('2000-01-01');
  return{de:de,ate:hoje};
}
function rHome(){
  var f=getFiltro();
  var cF=S.compras.filter(function(r){var d=new Date(r.dt+'T00:00:00');return d>=f.de&&d<=f.ate;});
  var vF=S.vendas.filter(function(r){var d=new Date(r.dt+'T00:00:00');return d>=f.de&&d<=f.ate;});
  var invest=cF.reduce(function(a,r){return a+(r.custoTotal||0);},0);
  var receb=vF.reduce(function(a,r){return a+(r.recebidoLiq||0);},0);
  var cabC=cF.reduce(function(a,r){return a+r.cab;},0);
  var cabV=vF.reduce(function(a,r){return a+r.cab;},0);
  // Custo Medio Ponderado por Categoria
  var cmvTotal=vF.reduce(function(a,venda){
    var cat=venda.cat||'';
    var comprasCat=S.compras.filter(function(c){return (c.cat||'')===(cat);});
    var investCat=comprasCat.reduce(function(s,c){return s+(c.custoTotal||0);},0);
    var cabCat=comprasCat.reduce(function(s,c){return s+c.cab;},0);
    var cpcCat=cabCat>0?investCat/cabCat:0;
    return a+(cpcCat*venda.cab);
  },0);
  var lucro=receb-cmvTotal;
  var margem=receb>0?(lucro/receb*100).toFixed(1):null;
  gel('d-invest').textContent=R$(invest);gel('d-invest-s').textContent=cF.length+' compra'+(cF.length!==1?'s':'');
  gel('d-receb').textContent=R$(receb);gel('d-receb-s').textContent=vF.length+' venda'+(vF.length!==1?'s':'');
  gel('d-lucro').textContent=R$(lucro);gel('d-margem').textContent=margem?'Margem: '+margem+'%':'Margem: —';
  // Gado em mão (descontando mortes)
  var totC=S.compras.reduce(function(a,r){return a+r.cab;},0);
  var totV=S.vendas.reduce(function(a,r){return a+r.cab;},0);
  var totM=S.mortes.reduce(function(a,r){return a+(r.cab||0);},0);
  var emMao=Math.max(0,totC-totV-totM);
  gel('d-emao-pill').textContent=emMao+' cab.';
  gel('d-emao-kpi').textContent=emMao+' cab.';
  if(totC>0){
    var html='';
    S.compras.slice(0,5).forEach(function(c){
      var mortesLote=S.mortes.filter(function(m){return m.compraId===c.id;}).reduce(function(a,m){return a+(m.cab||0);},0);
      var vendLote=Math.min(c.cab,totV);totV=Math.max(0,totV-c.cab);
      var saldo=Math.max(0,c.cab-vendLote-mortesLote);
      var cpc=c.cab>0?c.custoTotal/c.cab:0;
      var infoMorte=mortesLote>0?'<span style="color:#E65100;font-size:11px"> · '+mortesLote+' mort'+((mortesLote>1)?'es':'e')+'</span>':'';
      var diasNaFazenda=Math.floor((new Date()-new Date(c.dt+'T00:00:00'))/(1000*60*60*24));
      var corDias=diasNaFazenda>30?'#E65100':'#1B5E20';
      var sombraDias=diasNaFazenda>30?'0 2px 5px rgba(230,81,0,.3)':'0 2px 5px rgba(27,94,32,.22)';
      var alertaDias=diasNaFazenda>30?'<span style="font-size:10px;background:#fff3e0;color:#b34e00;padding:2px 7px;border-radius:8px;font-weight:700;margin-left:4px">⚠ parado</span>':'';
      var infoDiasRow='<div style="display:flex;align-items:center;gap:8px;border-top:1px solid #eef2ec;padding-top:8px;margin-top:6px">'
        +'<div style="background:'+corDias+';color:#fff;border-radius:8px;padding:5px 13px;font-size:13px;font-weight:800;box-shadow:'+sombraDias+'">'+diasNaFazenda+' dia'+(diasNaFazenda!==1?'s':'')+'</div>'
        +'<span style="font-size:11px;color:#65766a">na fazenda</span>'
        +alertaDias+'</div>';
      var catPill=c.cat?'<span style="background:#e8f5e9;color:#2E7D32;border:1px solid #a5d6a7;border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;margin-top:3px;display:inline-block">'+c.cat+'</span>':'';
      html+='<div class="neg-row" style="flex-direction:column;align-items:stretch"><div style="display:flex;align-items:flex-start;justify-content:space-between"><div><div class="neg-l">'+(c.forn||'—')+'</div>'
        +'<div class="neg-s">'+fmtD(c.dt)+' · '+R$(c.custoTotal)+' · '+R$(cpc)+'/cab'+infoMorte+'</div>'
        +(catPill?'<div style="margin-top:3px">'+catPill+'</div>':'')+'</div>'
        +(saldo>0?'<div class="pill pill-verde">'+saldo+' cab.</div>':'<div class="pill pill-verde">vendido</div>')
        +'</div>'+infoDiasRow+'</div>';
    });
    gel('d-emao-lista').innerHTML=html;
  } else gel('d-emao-lista').innerHTML=emptyHtml('Nenhum gado em mão','');
  // Últimas
  var ult=[];
  S.compras.slice(0,4).forEach(function(r){ult.push({dt:r.dt,tipo:'C',label:(r.forn||'—')+' — '+r.cab+' cab.',val:'-'+R$(r.custoTotal)});});
  S.vendas.slice(0,4).forEach(function(r){ult.push({dt:r.dt,tipo:'V',label:(r.comp||'—')+' — '+r.cab+' cab.',val:R$(r.recebidoLiq)});});
  ult.sort(function(a,b){return String(b.dt).localeCompare(String(a.dt));});ult=ult.slice(0,6);
  if(!ult.length){gel('d-ultimas').innerHTML=emptyHtml('Sem movimentações','');return;}
  gel('d-ultimas').innerHTML=ult.map(function(r){
    var isV=r.tipo==='V';
    var pillStyle=isV?'class="pill pill-verde" style="font-size:10px"':'style="font-size:10px;background:#eef1f4;color:#5a6b7a;border-radius:20px;padding:2px 8px;font-weight:700"';
    return'<div class="neg-row"><div><div style="display:flex;align-items:center;gap:5px"><span '+pillStyle+'>'+(isV?'Venda':'Compra')+'</span><span class="neg-l">'+r.label+'</span></div><div class="neg-s">'+fmtD(r.dt)+'</div></div><div class="neg-v" style="color:'+(isV?'#1B5E20':'#1a2c1a')+'">'+r.val+'</div></div>';
  }).join('');
}

/* ── Detalhe ── */
var _dTipo='',_dId=0;
function verDet(tipo,regId){
  var r=tipo==='compra'?S.compras.find(function(x){return x.id===regId;}):S.vendas.find(function(x){return x.id===regId;});
  if(!r)return;
  _dTipo=tipo;_dId=regId;
  var linhas=tipo==='compra'?[
    ['Data',fmtD(r.dt)],['Fornecedor',r.forn||'—'],['Cabeças',r.cab],
    ['Modalidade',r.mod==='peso'?'No Peso':'Na Perna'],
    r.mod==='peso'?['Arrobas',r.arr+' @']:null,
    r.mod==='peso'?['Valor/@',R$(r.valarr)]:null,
    ['Valor pago',R$(r.valtotal)],['Frete',R$(r.frete)],['Comissão',R$(r.comissao)],
    ['Custo total',R$(r.custoTotal),true],['Custo/cabeça',R$(r.custoTotal/r.cab)],
    r.obs?['Obs.',r.obs]:null
  ]:[
    ['Data',fmtD(r.dt)],['Comprador',r.comp||'—'],['Cabeças',r.cab],
    r.refugo?['Refugo',r.refugo+' cab.']:null,
    ['Modalidade',r.mod==='peso'?'No Peso':'Na Perna'],
    r.mod==='peso'?['Arrobas',r.arr+' @']:null,
    r.mod==='peso'?['Valor/@',R$(r.valarr)]:null,
    ['Valor recebido',R$(r.valtotal)],['Frete',R$(r.frete)],['Comissão',R$(r.comissao)],
    ['Líquido recebido',R$(r.recebidoLiq),true],
    r.obs?['Obs.',r.obs]:null
  ];
  var icone=tipo==='compra'?'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>':'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
  gel('det-tit').innerHTML=icone+' '+(tipo==='compra'?'Compra':'Venda')+'<span class="modal-close" onclick="fecharModal(\x27modal-det\x27)">&times;</span>';
  gel('det-body').innerHTML=linhas.filter(Boolean).map(function(r){return'<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eef2ec"><span style="font-size:12px;color:#65766a">'+r[0]+'</span><span style="font-size:13px;font-weight:'+(r[2]?'900':'700')+';color:'+(r[2]?'#1B5E20':'#1b2c1b')+'">'+r[1]+'</span></div>';}).join('');
  // Excluir: cliente e consultor podem apagar os proprios registros
  showEl('det-excluir-btn',true);
  abrirModal('modal-det');
}
function excluirReg(){
  if(!confirm('Excluir?'))return;
  if(_dTipo==='compra')S.compras=S.compras.filter(function(x){return x.id!==_dId;});
  else S.vendas=S.vendas.filter(function(x){return x.id!==_dId;});
  salvarLocal();enviarNuvem('excluir',{subtipo:_dTipo,id:_dId});
  fecharModal('modal-det');rCompras();rVendas();rHome();toast('Registro excluído');
}

/* ── Config ── */
function salvarCfg(){
  S.cfgGS=(gel('cfg-url').value||'').trim();
  S.cfgNome=(gel('cfg-nome').value||'').trim()||'Raniery';
  var pc=(gel('cfg-pin-c').value||'').trim();
  var pr=(gel('cfg-pin-r').value||'').trim();
  if(pc.length===4)S.pin=pc;
  if(pr.length===4)S.pinConsultor=pr;
  salvarLocal();
  if(S.cfgGS){
    var dados=encodeURIComponent(JSON.stringify({pinCliente:S.pin,pinConsultor:S.pinConsultor,nomeEmpresa:S.cfgNome}));
    chamarGS('setcfg',{data:dados},function(r){if(r&&r.ok)syncNuvem();});
  }
  showEl('ok-cfg',true);setTimeout(function(){showEl('ok-cfg',false);},2500);
}
function testarConexao(){
  if(!S.cfgGS){showEl('err-conexao',true);setTimeout(function(){showEl('err-conexao',false);},3000);return;}
  chamarGS('config',{},function(r){
    if(r&&r.ok){showEl('ok-conexao',true);setTimeout(function(){showEl('ok-conexao',false);},2500);}
    else{showEl('err-conexao',true);setTimeout(function(){showEl('err-conexao',false);},3000);}
  });
}
function sincronizarAgora(){syncNuvem();}

/* ── Relatórios ── */
var relTipo='resumo',relPer='mes';
function setRelTipo(t,btn){
  relTipo=t;
  document.querySelectorAll('#pg-relatorio .rel-pill').forEach(function(el){
    if(!el.id||!el.id.startsWith('rp-'))el.classList.remove('on');
  });
  if(btn)btn.classList.add('on');
}
function setRelPer(p){
  relPer=p;
  ['mes','30','ano','tudo','custom'].forEach(function(x){var el=gel('rp-'+x);if(el)el.classList.toggle('on',x===p);});
  showEl('rel-custom-datas',p==='custom');
}
function getRelFiltro(){
  var hoje=new Date();hoje.setHours(23,59,59);var de=new Date();
  if(relPer==='mes')de=new Date(hoje.getFullYear(),hoje.getMonth(),1);
  else if(relPer==='30'){de=new Date();de.setDate(de.getDate()-30);}
  else if(relPer==='ano')de=new Date(hoje.getFullYear(),0,1);
  else if(relPer==='custom'){
    var dv=gel('rel-de').value,av=gel('rel-ate').value;
    de=dv?new Date(dv+'T00:00:00'):new Date('2000-01-01');
    if(av)hoje=new Date(av+'T23:59:59');
  } else de=new Date('2000-01-01');
  return{de:de,ate:hoje};
}
function gerarRelatorio(){
  var f=getRelFiltro();
  var cF=S.compras.filter(function(r){var d=new Date(String(r.dt)+'T00:00:00');return d>=f.de&&d<=f.ate;});
  var vF=S.vendas.filter(function(r){var d=new Date(String(r.dt)+'T00:00:00');return d>=f.de&&d<=f.ate;});
  var periodoStr=relPer==='mes'?'Mês atual':relPer==='30'?'Últimos 30 dias':relPer==='ano'?'Este ano':relPer==='tudo'?'Histórico completo':'Período personalizado';
  var fn={resumo:relResumo,fornecedor:relFornecedor,comprador:relComprador,emao:relEmMao,ranking:relRanking,fluxo:relFluxo};
  var html=(fn[relTipo]||relResumo)(cF,vF,periodoStr);
  gel('pdf-titulo').textContent=periodoStr+' — '+(relTipo.charAt(0).toUpperCase()+relTipo.slice(1));
  gel('pdf-frame').srcdoc=html;
  gel('pdf-overlay').classList.add('open');
}

/* ── HTML base PDF ── */
function pdfBase(titulo,periodoStr,corpo){
  var nome=S.cfgNome||'Raniery';
  var hoje=new Date().toLocaleDateString('pt-BR');
  return'<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:13px;color:#1b2c1b;margin:0;padding:20px}table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:12px}th{background:#1B5E20;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:700}td{padding:7px 10px;border-bottom:1px solid #eef2ec}tr:nth-child(even) td{background:#f9fdf9}.box{background:#e8f5e9;border:1.5px solid #a5d6a7;border-radius:10px;padding:14px;margin-bottom:16px}.box-r{display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px}.tit{color:#1B5E20;font-size:15px;font-weight:900}.neg{color:#B71C1C}@media print{body{padding:10px}}</style></head><body>'
    +'<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1B5E20;padding-bottom:12px;margin-bottom:16px">'
    +'<div><div class="tit">GCB — Gestão Catireiro Bovino</div><div style="font-size:12px;color:#65766a">'+nome+'</div><div style="font-size:11px;color:#aaa">Emitido em '+hoje+'</div></div>'
    +'<div style="text-align:right"><div style="font-size:20px;font-weight:900;color:#1B5E20">'+titulo+'</div><div style="font-size:12px;color:#65766a">'+periodoStr+'</div></div></div>'
    +corpo
    +'<div style="font-size:10px;color:#bbb;text-align:center;margin-top:20px;border-top:1px solid #eee;padding-top:10px">GCB — Gestão Catireiro Bovino</div></body></html>';
}

function relResumo(cF,vF,ps){
  var invest=cF.reduce(function(a,r){return a+(r.custoTotal||0);},0);
  var receb=vF.reduce(function(a,r){return a+(r.recebidoLiq||0);},0);
  var cabC=cF.reduce(function(a,r){return a+r.cab;},0);
  var cabV=vF.reduce(function(a,r){return a+r.cab;},0);
  // Custo Medio Ponderado por Categoria
  var cmvTotal=vF.reduce(function(a,venda){
    var cat=venda.cat||'';
    var comprasCat=S.compras.filter(function(c){return (c.cat||'')===(cat);});
    var investCat=comprasCat.reduce(function(s,c){return s+(c.custoTotal||0);},0);
    var cabCat=comprasCat.reduce(function(s,c){return s+c.cab;},0);
    var cpcCat=cabCat>0?investCat/cabCat:0;
    return a+(cpcCat*venda.cab);
  },0);
  var lucro=receb-cmvTotal;
  var margem=receb>0?(lucro/receb*100).toFixed(1):'—';
  var corpo='<div class="box">'
    +'<div class="box-r"><span>Total investido (compras)</span><span class="neg" style="font-weight:800">'+R$(invest)+'</span></div>'
    +'<div class="box-r"><span>Cabeças compradas</span><span>'+cabC+'</span></div>'
    +'<div class="box-r"><span>Total recebido (vendas)</span><span style="font-weight:800">'+R$(receb)+'</span></div>'
    +'<div class="box-r"><span>Cabeças vendidas</span><span>'+cabV+'</span></div>'
    +'<div style="border-top:1.5px solid #a5d6a7;margin:10px 0"></div>'
    +'<div class="box-r"><span style="font-weight:800">Lucro líquido</span><span style="font-size:20px;font-weight:900;color:#1B5E20">'+R$(lucro)+'</span></div>'
    +'<div class="box-r"><span>Margem</span><span style="font-weight:700">'+margem+'%</span></div></div>'
    +(cF.length?'<div style="font-weight:800;color:#1B5E20;margin-bottom:8px">Compras ('+cF.length+')</div><table><thead><tr><th>Data</th><th>Fornecedor</th><th>Cab.</th><th>Modalidade</th><th>Custo total</th></tr></thead><tbody>'+cF.map(function(r){return'<tr><td>'+fmtD(r.dt)+'</td><td>'+(r.forn||'—')+'</td><td>'+r.cab+'</td><td>'+(r.mod==='peso'?r.arr+' @':'Na Perna')+'</td><td>'+R$(r.custoTotal)+'</td></tr>';}).join('')+'</tbody></table>':'')
    +(vF.length?'<div style="font-weight:800;color:#1B5E20;margin-bottom:8px">Vendas ('+vF.length+')</div><table><thead><tr><th>Data</th><th>Comprador</th><th>Cab.</th><th>Refugo</th><th>Recebido liq.</th></tr></thead><tbody>'+vF.map(function(r){return'<tr><td>'+fmtD(r.dt)+'</td><td>'+(r.comp||'—')+'</td><td>'+r.cab+'</td><td>'+(r.refugo||'—')+'</td><td>'+R$(r.recebidoLiq)+'</td></tr>';}).join('')+'</tbody></table>':'');
  return pdfBase('RESUMO',ps,corpo);
}

function relFornecedor(cF,vF,ps){
  var mapa={};
  cF.forEach(function(r){var k=r.forn||'(sem nome)';if(!mapa[k])mapa[k]={nome:k,compras:0,cab:0,custo:0};mapa[k].compras++;mapa[k].cab+=r.cab;mapa[k].custo+=r.custoTotal;});
  var linhas=Object.values(mapa).sort(function(a,b){return b.custo-a.custo;});
  var corpo='<table><thead><tr><th>Fornecedor</th><th>Compras</th><th>Cab.</th><th>Total investido</th><th>Custo/cab.</th></tr></thead><tbody>'
    +linhas.map(function(r){return'<tr><td>'+r.nome+'</td><td>'+r.compras+'</td><td>'+r.cab+'</td><td>'+R$(r.custo)+'</td><td>'+R$(r.cab>0?r.custo/r.cab:0)+'</td></tr>';}).join('')
    +'</tbody></table>';
  return pdfBase('POR FORNECEDOR',ps,corpo);
}

function relComprador(cF,vF,ps){
  var mapa={};
  vF.forEach(function(r){var k=r.comp||'(sem nome)';if(!mapa[k])mapa[k]={nome:k,vendas:0,cab:0,recebido:0,refugo:0};mapa[k].vendas++;mapa[k].cab+=r.cab;mapa[k].recebido+=r.recebidoLiq;mapa[k].refugo+=r.refugo||0;});
  var linhas=Object.values(mapa).sort(function(a,b){return b.recebido-a.recebido;});
  var corpo='<table><thead><tr><th>Comprador</th><th>Vendas</th><th>Cab.</th><th>Refugo</th><th>Total recebido</th></tr></thead><tbody>'
    +linhas.map(function(r){return'<tr><td>'+r.nome+'</td><td>'+r.vendas+'</td><td>'+r.cab+'</td><td>'+(r.refugo||'—')+'</td><td>'+R$(r.recebido)+'</td></tr>';}).join('')
    +'</tbody></table>';
  return pdfBase('POR COMPRADOR',ps,corpo);
}

function relEmMao(cF,vF,ps){
  var totC=S.compras.reduce(function(a,r){return a+r.cab;},0);
  var totV=S.vendas.reduce(function(a,r){return a+r.cab;},0);
  var emMao=Math.max(0,totC-totV);
  var custoTotal=S.compras.reduce(function(a,r){return a+r.custoTotal;},0);
  var vendido=S.vendas.reduce(function(a,r){return a+r.recebidoLiq;},0);
  var corpo='<div class="box">'
    +'<div class="box-r"><span>Total comprado (histórico)</span><span>'+totC+' cabeças</span></div>'
    +'<div class="box-r"><span>Total vendido</span><span>'+totV+' cabeças</span></div>'
    +'<div class="box-r"><span style="font-weight:800;color:#E65100">Gado em mão agora</span><span style="font-size:20px;font-weight:900;color:#E65100">'+emMao+' cab.</span></div>'
    +'<div class="box-r"><span>Custo médio do estoque</span><span>'+R$(totC>0?custoTotal/totC:0)+'/cab.</span></div>'
    +'</div>'
    +'<div style="font-weight:800;color:#1B5E20;margin-bottom:8px">Compras mais recentes em estoque</div>'
    +'<table><thead><tr><th>Data</th><th>Fornecedor</th><th>Cab.</th><th>Custo total</th><th>Custo/cab.</th></tr></thead><tbody>'
    +S.compras.slice(0,10).map(function(r){return'<tr><td>'+fmtD(r.dt)+'</td><td>'+(r.forn||'—')+'</td><td>'+r.cab+'</td><td>'+R$(r.custoTotal)+'</td><td>'+R$(r.custoTotal/r.cab)+'</td></tr>';}).join('')
    +'</tbody></table>';
  return pdfBase('GADO EM MÃO',ps,corpo);
}

function relRanking(cF,vF,ps){
  // Combinar compras e vendas por data próxima (simplificado: ranking de vendas por lucratividade estimada)
  var cusTot=cF.reduce(function(a,r){return a+r.custoTotal;},0);
  var cabTot=cF.reduce(function(a,r){return a+r.cab;},0);
  var cPorCab=cabTot>0?cusTot/cabTot:0;
  var negRanking=vF.map(function(r){
    var custoEst=cPorCab*r.cab;
    var lucro=r.recebidoLiq-custoEst;
    var margem=r.recebidoLiq>0?(lucro/r.recebidoLiq*100).toFixed(1):'—';
    return{dt:r.dt,comp:r.comp,cab:r.cab,recebido:r.recebidoLiq,custoEst:custoEst,lucro:lucro,margem:margem};
  }).sort(function(a,b){return b.lucro-a.lucro;});
  var corpo='<p style="font-size:12px;color:#65766a;margin-bottom:12px">Custo médio usado: '+R$(cPorCab)+'/cab. (baseado nas compras do período)</p>'
    +'<table><thead><tr><th>Pos.</th><th>Data</th><th>Comprador</th><th>Cab.</th><th>Recebido</th><th>Lucro est.</th><th>Margem</th></tr></thead><tbody>'
    +negRanking.map(function(r,i){return'<tr><td style="font-weight:900;color:'+(i<3?'#1B5E20':'#65766a')+'">'+(i+1)+'°</td><td>'+fmtD(r.dt)+'</td><td>'+(r.comp||'—')+'</td><td>'+r.cab+'</td><td>'+R$(r.recebido)+'</td><td style="font-weight:800;color:'+(r.lucro>=0?'#1B5E20':'#B71C1C')+'">'+R$(r.lucro)+'</td><td>'+r.margem+'%</td></tr>';}).join('')
    +'</tbody></table>';
  return pdfBase('RANKING DE NEGÓCIOS',ps,corpo);
}

function relFluxo(cF,vF,ps){
  var eventos=[];
  cF.forEach(function(r){eventos.push({dt:r.dt,tipo:'C',descr:(r.forn||'—')+' · '+r.cab+' cab.',val:-r.custoTotal});});
  vF.forEach(function(r){eventos.push({dt:r.dt,tipo:'V',descr:(r.comp||'—')+' · '+r.cab+' cab.',val:r.recebidoLiq});});
  eventos.sort(function(a,b){return String(a.dt).localeCompare(String(b.dt));});
  var saldo=0;
  var corpo='<table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor</th><th>Saldo acum.</th></tr></thead><tbody>'
    +eventos.map(function(r){saldo+=r.val;return'<tr><td>'+fmtD(r.dt)+'</td><td><span style="font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700;background:'+(r.tipo==='V'?'#e8f5e9':'#ffebee')+';color:'+(r.tipo==='V'?'#2E7D32':'#B71C1C')+'">'+(r.tipo==='V'?'Venda':'Compra')+'</span></td><td>'+r.descr+'</td><td style="font-weight:700;color:'+(r.val>=0?'#1B5E20':'#B71C1C')+'">'+R$(r.val)+'</td><td style="font-weight:700">'+R$(saldo)+'</td></tr>';}).join('')
    +'</tbody></table>';
  return pdfBase('FLUXO DE CAIXA',ps,corpo);
}

/* ── Nuvem ── */
/* ── Mortalidade ── */
function abrirModalMorte(){
  v('m-data',TD);
  gel('m-cab').value='';
  gel('m-motivo').value='';
  gel('m-prejuizo').textContent='R$ 0,00';
  gel('m-info-lote').textContent='—';
  // Popula select com compras que têm saldo em mão
  var sel=gel('m-compra');
  sel.innerHTML='<option value="">Selecione a compra...</option>';
  var vendR=S.vendas.reduce(function(a,r){return a+(r.cab||0);},0);
  S.compras.forEach(function(c){
    var mortesLote=S.mortes.filter(function(m){return m.compraId===c.id;}).reduce(function(a,m){return a+(m.cab||0);},0);
    var consumido=Math.min(c.cab,vendR);vendR=Math.max(0,vendR-c.cab);
    var saldo=Math.max(0,c.cab-consumido-mortesLote);
    if(saldo>0){
      var cpc=c.cab>0?(c.custoTotal/c.cab):0;
      var opt=document.createElement('option');
      opt.value=c.id;
      opt.textContent=(c.forn||'—')+' · '+fmtD(c.dt)+' · '+saldo+' cab. · '+R$(cpc)+'/cab';
      opt.dataset.cpc=cpc.toFixed(2);
      opt.dataset.saldo=saldo;
      sel.appendChild(opt);
    }
  });
  calcMorte();
  abrirModal('modal-morte');
}
function calcMorte(){
  var sel=gel('m-compra');
  var opt=sel.options[sel.selectedIndex];
  var cpc=opt&&opt.dataset.cpc?parseFloat(opt.dataset.cpc):0;
  var saldo=opt&&opt.dataset.saldo?parseInt(opt.dataset.saldo):0;
  if(cpc>0&&saldo>0){
    gel('m-info-lote').textContent='Custo/cabeça: '+R$(cpc)+' · Saldo disponível: '+saldo+' cab.';
  } else {
    gel('m-info-lote').textContent='—';
  }
  // Se campo vpc estiver vazio, pré-preenche com cpc do lote
  var vpcEl=gel('m-vpc');
  if(cpc>0&&!vpcEl.value) vpcEl.placeholder=cpc.toFixed(2);
  var vpc=parseFloat(vpcEl.value)||cpc;
  var cab=parseInt(gel('m-cab').value)||0;
  var prej=vpc*cab;
  gel('m-prejuizo').textContent=R$(prej);
}
function salvarMorte(){
  var sel=gel('m-compra');
  var compraId=parseInt(sel.value);
  var cab=parseInt(gel('m-cab').value)||0;
  var dt=gel('m-data').value||TD;
  var motivo=gel('m-motivo').value.trim();
  if(!compraId){toast('Selecione a compra');return;}
  if(cab<1){toast('Informe o nº de cabeças');return;}
  var opt=sel.options[sel.selectedIndex];
  var cpc=opt&&opt.dataset.cpc?parseFloat(opt.dataset.cpc):0;
  var saldo=opt&&opt.dataset.saldo?parseInt(opt.dataset.saldo):0;
  if(cab>saldo){toast('Mais cabeças do que o saldo do lote ('+saldo+')');return;}
  var vpcEl=gel('m-vpc');
  var vpc=parseFloat(vpcEl.value)||cpc;
  var prej=vpc*cab;
  var reg={id:Date.now(),compraId:compraId,dt:dt,cab:cab,vpc:vpc,prejuizo:prej,motivo:motivo};
  S.mortes.unshift(reg);
  salvarLocal();
  // Sincroniza com a planilha
  var dados=encodeURIComponent(JSON.stringify({tipo:'morte',reg:reg}));
  chamarGS('salvar',{data:dados},function(r){
    gel('sync-dot').className=r&&r.ok?'sdot on':'sdot off';
  });
  fecharModal('modal-morte');
  rHome();
  toast('Baixa por morte registrada — prejuízo '+R$(prej));
}

function registrarAcesso(){
  if(!S.cfgGS)return;
  var reg={dataHora:new Date().toLocaleString('pt-BR'),quem:S.isConsultor?'consultor':'cliente'};
  var dados=encodeURIComponent(JSON.stringify({tipo:'acesso',reg:reg}));
  chamarGS('salvar',{data:dados},function(){});
}
function carregarAcessos(){
  if(!S.cfgGS)return;
  var u=gel('acessos-ultimo');if(u)u.textContent='Carregando...';
  chamarGS('acessos',{},function(d){
    if(!d||!d.ok||!d.acessos){if(u)u.textContent='Nao foi possivel carregar os acessos.';return;}
    rAcessos(d.acessos);
  });
}
function rAcessos(lista){
  function escA(s){return String(s==null?'':s).replace(/[&<>]/g,function(c){return c==='&'?'&amp;':c==='<'?'&lt;':'&gt;';});}
  var ult=gel('acessos-ultimo'),box=gel('acessos-lista');
  if(!ult||!box)return;
  if(!lista.length){ult.textContent='Nenhum acesso registrado ainda.';box.innerHTML='';return;}
  var u=lista[0];
  ult.innerHTML='Ultimo acesso: <b>'+escA(u.DataHora||u.dataHora||'')+'</b> ('+escA(u.Quem||u.quem||'')+')';
  var h='';
  lista.slice(0,20).forEach(function(a){
    h+='<div style="display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid #e0e7e0;font-size:12px">'
      +'<span>'+escA(a.DataHora||a.dataHora||'')+'</span>'
      +'<span style="color:#65766a">'+escA(a.Quem||a.quem||'')+'</span></div>';
  });
  box.innerHTML=h;
}
function chamarGS(acao,params,cb){
  if(!S.cfgGS)return;
  var cbN='_gcb_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  var t=setTimeout(function(){delete window[cbN];},12000);
  window[cbN]=function(r){clearTimeout(t);delete window[cbN];if(cb)cb(r);};
  var url=S.cfgGS+'?acao='+acao+'&callback='+cbN;
  Object.keys(params).forEach(function(k){url+='&'+k+'='+params[k];});
  url+='&t='+Date.now();
  var sc=document.createElement('script');
  sc.src=url;
  sc.onerror=function(){clearTimeout(t);delete window[cbN];if(cb)cb(null);};
  document.body.appendChild(sc);
}
function enviarNuvem(tipo,reg){
  var dot=gel('sync-dot');dot.className='sdot sy';
  var dados=encodeURIComponent(JSON.stringify({tipo:tipo,reg:reg,subtipo:tipo==='excluir'?reg.subtipo:undefined,id:tipo==='excluir'?reg.id:undefined}));
  chamarGS('salvar',{data:dados},function(r){dot.className=r&&r.ok?'sdot on':'sdot off';});
}
function enviarNuvemComConfirm(tipo,reg,cb){
  if(!S.cfgGS){if(cb)cb(false);return;}
  var dados=encodeURIComponent(JSON.stringify({tipo:tipo,reg:reg}));
  chamarGS('salvar',{data:dados},function(r){if(cb)cb(r&&r.ok);});
}
function sincronizarPendentes(){
  if(!S.cfgGS) return;
  var pendentesC=S.compras.filter(function(r){return r._pendente;});
  var pendentesV=S.vendas.filter(function(r){return r._pendente;});
  if(!pendentesC.length&&!pendentesV.length) return;
  pendentesC.forEach(function(r){
    var dados=encodeURIComponent(JSON.stringify({tipo:'compra',reg:r}));
    chamarGS('salvar',{data:dados},function(ok){if(ok){r._pendente=false;salvarLocal();}});
  });
  pendentesV.forEach(function(r){
    var dados=encodeURIComponent(JSON.stringify({tipo:'venda',reg:r}));
    chamarGS('salvar',{data:dados},function(ok){if(ok){r._pendente=false;salvarLocal();}});
  });
}
function syncNuvem(cb){
  if(!S.cfgGS){toast('Configure a URL do Apps Script primeiro');if(cb)cb();return;}
  var dot=gel('sync-dot');dot.className='sdot sy';
  chamarGS('ler',{},function(d){
    if(!d||!d.ok){
      dot.className='sdot off';
      toast('Sem conexão — dados locais');
      if(cb)cb();
      return;
    }
    // Planilha é a fonte da verdade — substitui tudo
    S.compras=[];S.vendas=[];S.pessoas=[];S.mortes=[];
    if(d.compras&&d.compras.length){
      S.compras=d.compras.map(function(r){return{
        id:Number(r.ID||r.id),
        dt:String(r.Data||r.dt||'').split('T')[0],
        forn:r.Fornecedor||r.forn||'',
        cab:Number(r['Cabeças']||r.cab)||0,
        mod:r.Modalidade||r.mod||'perna',
        arr:Number(r.Arrobas||r.arr)||0,
        valarr:Number(r.ValorArroba||r.valarr)||0,
        valtotal:Number(r.ValorTotal||r.valtotal)||0,
        frete:Number(r.Frete||r.frete)||0,
        comissao:Number(r.Comissao||r.comissao)||0,
        custoTotal:Number(r.CustoTotal||r.custoTotal)||0,
        obs:r.Observacao||r.obs||''
      };});
    }
    if(d.vendas&&d.vendas.length){
      S.vendas=d.vendas.map(function(r){return{
        id:Number(r.ID||r.id),
        dt:String(r.Data||r.dt||'').split('T')[0],
        comp:r.Comprador||r.comp||'',
        cab:Number(r['Cabeças']||r.cab)||0,
        refugo:Number(r.Refugo||r.refugo)||0,
        mod:r.Modalidade||r.mod||'perna',
        arr:Number(r.Arrobas||r.arr)||0,
        valarr:Number(r.ValorArroba||r.valarr)||0,
        valtotal:Number(r.ValorTotal||r.valtotal)||0,
        frete:Number(r.Frete||r.frete)||0,
        comissao:Number(r.Comissao||r.comissao)||0,
        recebidoLiq:Number(r.RecebidoLiq||r.recebidoLiq)||0,
        obs:r.Observacao||r.obs||''
      };});
    }
    if(d.pessoas&&d.pessoas.length){
      S.pessoas=d.pessoas.map(function(r){return{
        nome:r.Nome||r.nome||'',
        tel:r.Telefone||r.tel||'',
        cidade:r.Cidade||r.cidade||''
      };});
    }
    if(d.mortes&&d.mortes.length){
      S.mortes=d.mortes.map(function(r){return{
        id:Number(r.ID||r.id)||0,
        compraId:Number(r.CompraId||r.compraId)||0,
        dt:String(r.Data||r.dt||'').split('T')[0],
        cab:Number(r['Cabeças']||r.cab)||0,
        vpc:Number(r.ValorPorCab||r.vpc)||0,
        prejuizo:Number(r.Prejuizo||r.prejuizo)||0,
        motivo:r.Motivo||r.motivo||''
      };});
    }
    if(d.config){
      if(d.config.pinCliente)S.pin=String(d.config.pinCliente);
      if(d.config.pinConsultor)S.pinConsultor=String(d.config.pinConsultor);
      if(d.config.nomeEmpresa)S.cfgNome=d.config.nomeEmpresa;
      if(d.config.cfgGS)S.cfgGS=d.config.cfgGS;
    }
    salvarLocal();
    dot.className='sdot on';
    toast('Dados atualizados!');
    if(cb)cb();
    else{rHome();rCompras();rVendas();rPessoas();atualizarDatalist();}
  });
}

/* ── Boot ── */
carregarLocal();
['modal-compra','modal-venda','modal-det','modal-morte'].forEach(function(mid){
  var el=gel(mid);if(el)el.addEventListener('click',function(e){if(e.target===el)fecharModal(mid);});
});
var fc=gel('fab-c');if(fc)fc.classList.add('vis');
// Sincronizar pendentes ao voltar online
window.addEventListener('online',function(){
  toast('Conexão restaurada — sincronizando...',2500);
  setTimeout(function(){sincronizarPendentes();syncNuvem();},1500);
});
