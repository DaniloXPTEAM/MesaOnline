/* One image registry for the original bestiary and the tactical table. */
(() => {
  const key='t20_threat_images';
  const localFiles=window.ARMADA_THREAT_IMAGE_FILES||{};
  const originals=new Map(Object.entries(localFiles).map(([url,file])=>[file,url]));
  const originalUrl=url=>originals.get(url)||url;
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const urlOf=v=>typeof v==='string'?v:v?.url||v?.imageUrl||v?.img||v?.imagem||'';
  const valid=url=>typeof url==='string'&&/^(https?:\/\/|data:image\/|\/?\.?\.?\/)/i.test(url);
  let lastRaw=null,index=new Map();
  function custom(){const raw=localStorage.getItem(key)||'{}';if(raw!==lastRaw){lastRaw=raw;index=new Map();try{for(const [name,value]of Object.entries(JSON.parse(raw)))if(valid(urlOf(value)))index.set(normalize(name),urlOf(value));}catch{}}return index;}
  function source(threat){
    const name=normalize(threat?.nome||threat?.name);const saved=custom().get(name);if(saved)return originalUrl(saved);
    const base=threat?.img||threat?.imagem||threat?.imageUrl||'';
    // Tokens already saved in a V2 scene may carry an uploaded portrait absent from the DB.
    const scenes=typeof SCENES==='undefined'?[]:SCENES;
    const tokens=typeof BOARD==='undefined'?[]:BOARD.tokens||[];
    for(const list of [tokens,...scenes.map(s=>s.tokens||[])]){const token=list.find(t=>normalize(t.bestiaryName||t.name)===name&&valid(t.imageUrl)&&originalUrl(t.imageUrl)!==base);if(token)return originalUrl(token.imageUrl);}
    return valid(base)?base:'';
  }
  function resolve(threat){const url=source(threat);return localFiles[url]||url;}
  function importImages(data){
    if(typeof myRole!=='undefined'&&myRole!=='mestre')throw Error('Somente o mestre importa a biblioteca.');
    const threats=typeof AMEACAS_DB==='undefined'?[]:AMEACAS_DB;
    const names=new Map(threats.map(t=>[normalize(t.nome),t.nome]));const entries=new Map();
    const add=(name,value)=>{const canonical=names.get(normalize(name)),url=urlOf(value);if(canonical&&valid(url))entries.set(canonical,{url,position:typeof value==='object'?value?.position||'50% 50%':'50% 50%'});};
    if(data?.images&&typeof data.images==='object')for(const [name,value]of Object.entries(data.images))add(name,value);
    if(data?.t20_threat_images)for(const [name,value]of Object.entries(data.t20_threat_images))add(name,value);
    const scan=items=>{for(const item of items||[]){add(item.bestiaryName||item.nome||item.name,item);if(Array.isArray(item.tokens))scan(item.tokens);}};
    if(Array.isArray(data))scan(data);else{scan(data?.threats);scan(data?.tokens);scan(data?.scenes);if(data?.nome||data?.name)add(data.nome||data.name,data);if(data&&typeof data==='object')for(const [name,value]of Object.entries(data))add(name,value);}
    if(!entries.size)throw Error('Nenhuma imagem associada às ameaças foi encontrada. Use a exportação de imagens/bestiário ou uma mesa salva do V2.');
    let previous={};try{previous=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
    const merged={...previous,...Object.fromEntries(entries)};
    // Commit storage first; a quota failure must not partially replace tokens.
    localStorage.setItem(key,JSON.stringify(merged));lastRaw=null;
    if(typeof BOARD!=='undefined')for(const t of BOARD.tokens||[]){const name=names.get(normalize(t.bestiaryName||t.name));if(!name||!entries.has(name))continue;const b=threats.find(b=>b.nome===name);if(!t.imageUrl||t.imageUrl===b?.img||t.imageUrl===b?.imagem||t.tacticsImageSource==='catalog'){t.imageUrl=entries.get(name).url;t.tacticsImageSource='catalog';t.tacticsCatalogImage=t.imageUrl;}}
    if(typeof boardSave==='function')boardSave();if(typeof syncBoardTokensToPlayers==='function')syncBoardTokensToPlayers();
    window.dispatchEvent(new Event('armada:change'));return entries.size;
  }
  function exportImages(){const images={};for(const t of typeof AMEACAS_DB==='undefined'?[]:AMEACAS_DB){const url=source(t);if(url)images[t.nome]={url};}return {type:'t20_threat_images',version:1,images};}
  window.ArmadaThreatImages={resolve,importImages,exportImages};
  window.addEventListener('storage',event=>{if(event.key===key){lastRaw=null;window.dispatchEvent(new Event('armada:change'));}});
})();
