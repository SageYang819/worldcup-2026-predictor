import { useState, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, ReferenceLine } from "recharts";

// ── 颜色 ──────────────────────────────────────────────────────
const C = {
  bg:"#070E1C",surface:"#0D1525",card:"#122030",border:"#1B2E48",
  accent:"#22C55E",blue:"#60A5FA",orange:"#F97316",yellow:"#FBBF24",
  purple:"#A78BFA",lime:"#84CC16",red:"#F87171",text:"#F1F5F9",muted:"#94A3B8",dim:"#475569",
};
function eloToStrength(elo, t={}) {
  const base = Math.max(58, Math.min(92, 58 + (elo - 1700) / 550 * 34));
  return Math.round(base + Math.min(4,(t.titles||0)*0.8+(t.wcApps||0)*0.05) + (t.home?3:0));
}
const tc = s => s>=88?"#22C55E":s>=83?"#84CC16":s>=78?"#FBBF24":s>=73?"#F97316":"#94A3B8";
const cs = (ex={}) => ({background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,...ex});
const pill = c => ({display:"inline-block",padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:600,background:c+"28",color:c});

// ── 16支特色球队（带完整统计）─────────────────────────────────
const FEATURED_TEAMS = [
  {n:"西班牙",  f:"🇪🇸",c:"ESP",elo:2171,eloRank:1, rChg:0, conf:"UEFA",  att:91,def:88,mid:94,exp:85,form:93,titles:1, wa:16,home:false},
  {n:"阿根廷",  f:"🇦🇷",c:"ARG",elo:2113,eloRank:2, rChg:0, conf:"CONMEBOL",att:91,def:84,mid:85,exp:94,form:89,titles:3, wa:18,home:false},
  {n:"法国",    f:"🇫🇷",c:"FRA",elo:2063,eloRank:3, rChg:0, conf:"UEFA",  att:93,def:88,mid:90,exp:88,form:87,titles:2, wa:16,home:false},
  {n:"英格兰",  f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",c:"ENG",elo:2042,eloRank:4, rChg:0, conf:"UEFA",  att:88,def:87,mid:84,exp:80,form:88,titles:1, wa:16,home:false},
  {n:"哥伦比亚",f:"🇨🇴",c:"COL",elo:1998,eloRank:5, rChg:2, conf:"CONMEBOL",att:79,def:74,mid:77,exp:74,form:82,titles:0, wa:7, home:false},
  {n:"巴西",    f:"🇧🇷",c:"BRA",elo:1979,eloRank:6, rChg:1, conf:"CONMEBOL",att:87,def:84,mid:86,exp:91,form:82,titles:5, wa:22,home:false},
  {n:"葡萄牙",  f:"🇵🇹",c:"POR",elo:1976,eloRank:7, rChg:1, conf:"UEFA",  att:86,def:82,mid:83,exp:82,form:85,titles:0, wa:9, home:false},
  {n:"荷兰",    f:"🇳🇱",c:"NED",elo:1959,eloRank:8, rChg:2, conf:"UEFA",  att:83,def:81,mid:82,exp:80,form:83,titles:0, wa:11,home:false},
  {n:"克罗地亚",f:"🇭🇷",c:"CRO",elo:1933,eloRank:9, rChg:5, conf:"UEFA",  att:76,def:77,mid:81,exp:87,form:74,titles:0, wa:7, home:false},
  {n:"德国",    f:"🇩🇪",c:"GER",elo:1910,eloRank:12,rChg:4, conf:"UEFA",  att:82,def:82,mid:82,exp:87,form:80,titles:4, wa:20,home:false},
  {n:"日本",    f:"🇯🇵",c:"JPN",elo:1879,eloRank:16,rChg:3, conf:"AFC",   att:75,def:74,mid:77,exp:71,form:79,titles:0, wa:8, home:false},
  {n:"塞内加尔",f:"🇸🇳",c:"SEN",elo:1869,eloRank:17,rChg:14,conf:"CAF",   att:73,def:75,mid:73,exp:69,form:76,titles:0, wa:4, home:false},
  {n:"比利时",  f:"🇧🇪",c:"BEL",elo:1849,eloRank:20,rChg:3, conf:"UEFA",  att:78,def:75,mid:76,exp:79,form:71,titles:0, wa:14,home:false},
  {n:"摩洛哥",  f:"🇲🇦",c:"MAR",elo:1832,eloRank:23,rChg:1, conf:"CAF",   att:74,def:82,mid:76,exp:72,form:78,titles:0, wa:7, home:false},
  {n:"墨西哥",  f:"🇲🇽",c:"MEX",elo:1762,eloRank:29,rChg:-2,conf:"CONCACAF",att:72,def:72,mid:74,exp:78,form:70,titles:0,wa:17,home:true},
  {n:"美国",    f:"🇺🇸",c:"USA",elo:1726,eloRank:33,rChg:2, conf:"CONCACAF",att:72,def:72,mid:71,exp:65,form:74,titles:0,wa:11,home:true},
];

// ── 附加球队种子数据（可按最新信息自行更新）──────────────────
const EXTRA_RAW = [
  ["厄瓜多尔","🇪🇨","ECU",1933,"CONMEBOL"],["挪威",    "🇳🇴","NOR",1922,"UEFA"],
  ["瑞士",    "🇨🇭","SUI",1897,"UEFA"],   ["乌拉圭",  "🇺🇾","URU",1890,"CONMEBOL"],
  ["土耳其",  "🇹🇷","TUR",1880,"UEFA"],   ["瑞典",    "🇸🇪","SWE",1820,"UEFA"],
  ["韩国",    "🇰🇷","KOR",1830,"AFC"],    ["澳大利亚","🇦🇺","AUS",1810,"AFC"],
  ["奥地利",  "🇦🇹","AUT",1808,"UEFA"],   ["苏格兰",  "🏴󠁧󠁢󠁳󠁣󠁴󠁿","SCO",1790,"UEFA"],
  ["象牙海岸","🇨🇮","CIV",1775,"CAF"],    ["突尼斯",  "🇹🇳","TUN",1760,"CAF"],
  ["捷克",    "🇨🇿","CZE",1755,"UEFA"],   ["埃及",    "🇪🇬","EGY",1740,"CAF"],
  ["波黑",    "🇧🇦","BIH",1720,"UEFA"],   ["阿尔及利亚","🇩🇿","ALG",1720,"CAF"],
  ["加拿大",  "🇨🇦","CAN",1682,"CONCACAF",true],["伊朗","🇮🇷","IRN",1702,"AFC"],
  ["巴拉圭",  "🇵🇾","PAR",1710,"CONMEBOL"],["加纳",   "🇬🇭","GHA",1700,"CAF"],
  ["南非",    "🇿🇦","RSA",1690,"CAF"],   ["乌兹别克斯坦","🇺🇿","UZB",1680,"AFC"],
  ["佛得角",  "🇨🇻","CPV",1655,"CAF"],   ["刚果民主","🇨🇩","COD",1630,"CAF"],
  ["卡塔尔",  "🇶🇦","QAT",1620,"AFC"],   ["伊拉克",  "🇮🇶","IRQ",1643,"AFC"],
  ["约旦",    "🇯🇴","JOR",1640,"AFC"],   ["巴拿马",  "🇵🇦","PAN",1620,"CONCACAF"],
  ["新西兰",  "🇳🇿","NZL",1560,"OFC"],   ["海地",    "🇭🇹","HTI",1540,"CONCACAF"],
  ["沙特阿拉伯","🇸🇦","KSA",1680,"AFC"], ["库拉索",  "🇨🇼","CUW",1580,"CONCACAF"],
];
const EXTRA_TEAMS = EXTRA_RAW.map(([n,f,c,e,cf,h])=>({
  n,f,c,elo:e,conf:cf,home:!!h,titles:0,wa:4,
  strength:eloToStrength(e,{titles:0,wa:4,home:!!h}),
}));
// 统一字段别名
const normTeam = t => ({ ...t,
  name: t.n||t.name, flag: t.f||t.flag, code: t.c||t.code,
  exp: t.exp||t.wa||5, wcApps: t.wa||t.wcApps||5,
  strength: t.strength ?? eloToStrength(t.elo, t),
});
const ALL_TEAMS_BASE = [...FEATURED_TEAMS.map(normTeam), ...EXTRA_TEAMS.map(normTeam)];

// ── 分组种子数据（示例赛程，可按官方结果更新）────────────────
const REAL_GROUPS = [
  {id:"A",teams:["MEX","KOR","RSA","CZE"]},
  {id:"B",teams:["CAN","BIH","QAT","SUI"]},
  {id:"C",teams:["BRA","MAR","SCO","HTI"]},
  {id:"D",teams:["USA","PAR","AUS","TUR"]},
  {id:"E",teams:["GER","ECU","CIV","CUW"]},
  {id:"F",teams:["NED","JPN","SWE","TUN"]},
  {id:"G",teams:["BEL","EGY","IRN","NZL"]},
  {id:"H",teams:["ESP","URU","KSA","CPV"]},
  {id:"I",teams:["FRA","SEN","IRQ","NOR"]},
  {id:"J",teams:["ARG","ALG","AUT","JOR"]},
  {id:"K",teams:["POR","COL","UZB","COD"]},
  {id:"L",teams:["ENG","CRO","GHA","PAN"]},
];

// ── 已知战绩种子数据（可在界面粘贴JSON覆盖）────────────────
const SEED_RESULTS = [
  {grp:"A",a:"MEX",b:"RSA",gA:2,gB:0,date:"6/11",note:"3张红牌，Quinones+Jimenez"},
  {grp:"A",a:"KOR",b:"CZE",gA:2,gB:1,date:"6/11",note:"韩国逆转"},
  {grp:"B",a:"CAN",b:"BIH",gA:1,gB:1,date:"6/12",note:"Larin补时扳平"},
  // USA vs PAR: 上半时 3-0（Balogun双响），比赛结果将通过AI获取
];

// ── 历史回测数据 ───────────────────────────────────────────────
const HIST=[
  {yr:2022,st:"决赛",a:"ARG",b:"FRA",eA:2143,eB:2004,r90:"D"},
  {yr:2022,st:"半决赛",a:"ARG",b:"CRO",eA:2100,eB:1956,r90:"A"},
  {yr:2022,st:"半决赛",a:"FRA",b:"MAR",eA:2004,eB:1864,r90:"A"},
  {yr:2022,st:"四分之一",a:"MAR",b:"POR",eA:1832,eB:1970,r90:"A"},
  {yr:2022,st:"四分之一",a:"ENG",b:"FRA",eA:2042,eB:2004,r90:"B"},
  {yr:2022,st:"四分之一",a:"NED",b:"ARG",eA:1938,eB:2100,r90:"D"},
  {yr:2022,st:"四分之一",a:"CRO",b:"BRA",eA:1933,eB:1979,r90:"D"},
  {yr:2022,st:"16强",a:"MAR",b:"ESP",eA:1832,eB:2103,r90:"D"},
  {yr:2022,st:"16强",a:"BRA",b:"KOR",eA:1979,eB:1830,r90:"A"},
  {yr:2022,st:"16强",a:"ENG",b:"SEN",eA:2042,eB:1869,r90:"A"},
  {yr:2018,st:"决赛",a:"FRA",b:"CRO",eA:1965,eB:1949,r90:"A"},
  {yr:2018,st:"半决赛",a:"FRA",b:"BEL",eA:1965,eB:1907,r90:"A"},
  {yr:2018,st:"半决赛",a:"CRO",b:"ENG",eA:1949,eB:1936,r90:"A"},
  {yr:2018,st:"四分之一",a:"BEL",b:"BRA",eA:1907,eB:2007,r90:"A"},
  {yr:2018,st:"四分之一",a:"FRA",b:"URU",eA:1965,eB:1861,r90:"A"},
  {yr:2018,st:"16强",a:"FRA",b:"ARG",eA:1965,eB:1955,r90:"A"},
  {yr:2014,st:"决赛",a:"GER",b:"ARG",eA:2007,eB:1978,r90:"A"},
  {yr:2014,st:"半决赛",a:"BRA",b:"GER",eA:2056,eB:2007,r90:"B"},
  {yr:2014,st:"半决赛",a:"NED",b:"ARG",eA:1978,eB:1978,r90:"D"},
  {yr:2014,st:"四分之一",a:"GER",b:"FRA",eA:2007,eB:1889,r90:"A"},
  {yr:2014,st:"四分之一",a:"ARG",b:"BEL",eA:1978,eB:1839,r90:"A"},
  {yr:2010,st:"决赛",a:"ESP",b:"NED",eA:2044,eB:1938,r90:"A"},
  {yr:2010,st:"半决赛",a:"ESP",b:"GER",eA:2044,eB:1981,r90:"A"},
  {yr:2010,st:"半决赛",a:"URU",b:"NED",eA:1826,eB:1938,r90:"B"},
  {yr:2010,st:"四分之一",a:"GER",b:"ARG",eA:1981,eB:1944,r90:"A"},
  {yr:2006,st:"决赛",a:"ITA",b:"FRA",eA:1975,eB:1994,r90:"D"},
  {yr:2006,st:"半决赛",a:"GER",b:"ITA",eA:1953,eB:1975,r90:"B"},
  {yr:2006,st:"半决赛",a:"FRA",b:"POR",eA:1994,eB:1904,r90:"A"},
];

// ── 泊松模型 ──────────────────────────────────────────────────
const LF=[0]; for(let i=1;i<=12;i++) LF.push(LF[i-1]+Math.log(i));
function pPMF(k,λ){return(k<0||k>12||λ<=0)?0:Math.exp(-λ+k*Math.log(λ)-LF[k]);}
function mProbs(eA,eB,B=1.2,K=0.45){
  const d=(eA-eB)/400,lA=B*Math.exp(K*d),lB=B*Math.exp(-K*d);
  let w=0,dr=0,l=0;
  for(let i=0;i<=8;i++) for(let j=0;j<=8;j++){
    const p=pPMF(i,lA)*pPMF(j,lB);
    if(i>j)w+=p; else if(i===j)dr+=p; else l+=p;
  }
  const t=w+dr+l; return{w:w/t,d:dr/t,l:l/t};
}
function poisSim(λ){if(λ<=0)return 0;let L=Math.exp(-λ),k=0,p=1;do{k++;p*=Math.random();}while(p>L);return k-1;}
function simMatchP(a,b,ko=false){
  const eA=a.elo+(a.home?100:0),eB=b.elo+(b.home?100:0);
  const d=(eA-eB)/400,lA=1.2*Math.exp(0.45*d),lB=1.2*Math.exp(-0.45*d);
  let gA=poisSim(lA),gB=poisSim(lB);
  if(ko&&gA===gB){gA+=poisSim(lA/3);gB+=poisSim(lB/3);
    if(gA===gB){Math.random()<Math.max(0.3,Math.min(0.7,0.5+0.1*d))?gA++:gB++;}}
  return{gA,gB,winner:gA>gB?a:gA<gB?b:null};
}

// ── 贝叶斯ELO更新（K=60 for WC）─────────────────────────────
function calcEloUpdates(teamMap, results, K=60){
  const deltas={};
  const currentElo=code=>(deltas[code]?.newElo ?? teamMap[code]?.elo ?? 1700);
  results.forEach(m=>{
    const eA=currentElo(m.a),eB=currentElo(m.b);
    const sA=m.gA>m.gB?1:m.gA===m.gB?0.5:0;
    const eExp=1/(1+Math.pow(10,(eB-eA)/400));
    const delta=Math.round(K*(sA-eExp));
    deltas[m.a]={oldElo:teamMap[m.a]?.elo??eA,newElo:eA+delta,delta:+delta,match:`${m.a} vs ${m.b}`};
    deltas[m.b]={oldElo:teamMap[m.b]?.elo??eB,newElo:eB-delta,delta:-delta,match:`${m.a} vs ${m.b}`};
  });
  return deltas;
}

// ── 含真实战绩的小组赛仿真 ────────────────────────────────────
function simGroupWithResults(teamCodes, teamMap, playedResults){
  const st=teamCodes.map(c=>{const t=teamMap[c];return{...(t||{code:c,name:c,flag:"🌍",elo:1700}),pts:0,gf:0,ga:0,gd:0};});
  // 先填入已知结果
  playedResults.forEach(m=>{
    if(!teamCodes.includes(m.a)||!teamCodes.includes(m.b))return;
    const iA=st.findIndex(t=>t.code===m.a),iB=st.findIndex(t=>t.code===m.b);
    if(iA<0||iB<0)return;
    st[iA].gf+=m.gA;st[iA].ga+=m.gB;st[iA].gd+=m.gA-m.gB;
    st[iB].gf+=m.gB;st[iB].ga+=m.gA;st[iB].gd+=m.gB-m.gA;
    if(m.gA>m.gB)st[iA].pts+=3; else if(m.gA<m.gB)st[iB].pts+=3; else{st[iA].pts++;st[iB].pts++;}
  });
  // 再仿真剩余场次
  for(let i=0;i<4;i++) for(let j=i+1;j<4;j++){
    const played=playedResults.some(m=>(m.a===st[i].code&&m.b===st[j].code)||(m.a===st[j].code&&m.b===st[i].code));
    if(played)continue;
    const{gA,gB}=simMatchP(st[i],st[j],false);
    st[i].gf+=gA;st[i].ga+=gB;st[i].gd+=gA-gB;
    st[j].gf+=gB;st[j].ga+=gA;st[j].gd+=gB-gA;
    if(gA>gB)st[i].pts+=3; else if(gA<gB)st[j].pts+=3; else{st[i].pts++;st[j].pts++;}
  }
  return st.sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
}

function simFullTournament(teamMap, playedResults){
  const groupResults=REAL_GROUPS.map(g=>simGroupWithResults(g.teams,teamMap,playedResults));
  const top=[],thirds=[];
  groupResults.forEach((st,gi)=>{
    top.push({...st[0],grp:gi,pos:1},{...st[1],grp:gi,pos:2});
    thirds.push({...st[2],grp:gi,pos:3});
  });
  thirds.sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
  const adv=[...top,...thirds.slice(0,8).map(t=>({...t,pos:"3rd✓"}))];
  adv.sort((a,b)=>b.pts-a.pts||b.elo-a.elo);
  const n=adv.length;
  const ord=[0,31,15,16,7,24,8,23,3,28,12,19,4,27,11,20,1,30,14,17,6,25,9,22,2,29,13,18,5,26,10,21];
  let bracket=ord.map(i=>adv[Math.min(i,n-1)]);
  while(bracket.length>1){
    const nx=[];
    for(let i=0;i<bracket.length;i+=2){
      const{gA,gB,winner}=simMatchP(bracket[i],bracket[i+1],true);
      nx.push(winner||(Math.random()<0.5?bracket[i]:bracket[i+1]));
    }
    bracket=nx;
  }
  return bracket[0];
}

// ── Brier分数 ─────────────────────────────────────────────────
function calcBrier(λ=1.2){
  const byYear={};let tot=0,n=0;
  HIST.forEach(m=>{
    const{w,d,l}=mProbs(m.eA,m.eB,λ);
    const ow=m.r90==="A"?1:0,od=m.r90==="D"?1:0,ol=m.r90==="B"?1:0;
    const bs=(1/3)*((w-ow)**2+(d-od)**2+(l-ol)**2);
    if(!byYear[m.yr])byYear[m.yr]={s:0,n:0};
    byYear[m.yr].s+=bs;byYear[m.yr].n++;tot+=bs;n++;
  });
  return{
    overall:parseFloat((tot/n).toFixed(4)),
    byYear:Object.entries(byYear).map(([yr,v])=>({yr:+yr,bs:parseFloat((v.s/v.n).toFixed(4))})),
    matches:HIST.map(m=>{const{w,d,l}=mProbs(m.eA,m.eB,λ);
      const ow=m.r90==="A"?1:0,od=m.r90==="D"?1:0,ol=m.r90==="B"?1:0;
      return{...m,pw:(w*100).toFixed(1),pd:(d*100).toFixed(1),pl:(l*100).toFixed(1),
        bs:parseFloat(((1/3)*((w-ow)**2+(d-od)**2+(l-ol)**2)).toFixed(4))};
    })
  };
}

function validateResultsJson(text, teamMap){
  const arr=JSON.parse(text);
  if(!Array.isArray(arr))throw new Error("JSON必须是数组");
  return arr.map((m,i)=>{
    const a=String(m.a||"").toUpperCase(),b=String(m.b||"").toUpperCase();
    if(!m.grp)throw new Error(`第 ${i+1} 场缺少 grp`);
    if(!teamMap[a]||!teamMap[b])throw new Error(`第 ${i+1} 场球队代码无效：${a || "?"} vs ${b || "?"}`);
    const gA=Number(m.gA),gB=Number(m.gB);
    if(!Number.isInteger(gA)||!Number.isInteger(gB)||gA<0||gB<0)throw new Error(`第 ${i+1} 场比分必须是非负整数`);
    return{grp:String(m.grp).toUpperCase(),a,b,gA,gB,date:m.date||"?",note:m.note||""};
  });
}

// ═══════════════════════════════════════════════════════════════
// TAB: 赛况先验（导入战绩 + 贝叶斯ELO更新）
// ═══════════════════════════════════════════════════════════════
function LiveDataTab({teams, setTeams, results, setResults}){
  const [resultJson,setResultJson]=useState(()=>JSON.stringify(SEED_RESULTS,null,2));
  const [importStatus,setImportStatus]=useState("");
  const [importErr,setImportErr]=useState("");

  const teamMap=useMemo(()=>Object.fromEntries(teams.map(t=>[t.code,t])),[teams]);
  const eloUpdates=useMemo(()=>calcEloUpdates(teamMap,results),[teamMap,results]);

  const handleImport=()=>{
    setImportErr("");setImportStatus("");
    try{
      const arr=validateResultsJson(resultJson,teamMap);
      setResults(arr);
      setImportStatus(`已导入 ${arr.length} 场结果 · ${new Date().toLocaleTimeString("zh-CN")}`);
    }catch(e){
      setImportErr(`${e.message}`);
    }
  };
  const loadSeed=()=>{
    setResultJson(JSON.stringify(SEED_RESULTS,null,2));
    setResults(SEED_RESULTS);
    setImportErr("");
    setImportStatus("已恢复内置种子战绩");
  };

  const applyEloUpdates=()=>{
    setTeams(prev=>prev.map(t=>{
      const upd=eloUpdates[t.code];
      if(!upd)return t;
      const newElo=upd.newElo;
      return{...t,elo:newElo,strength:eloToStrength(newElo,t),eloUpdated:true,eloBase:t.eloBase??t.elo};
    }));
  };
  const resetElo=()=>setTeams(prev=>prev.map(t=>t.eloBase?{...t,elo:t.eloBase,strength:eloToStrength(t.eloBase,t),eloUpdated:false,eloBase:undefined}:t));

  const updatedCount=Object.keys(eloUpdates).length;
  const appliedCount=teams.filter(t=>t.eloUpdated).length;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* 状态栏 */}
      <div style={{...cs(),display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,padding:"14px 20px"}}>
        <div>
          <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>📡 赛况先验 · 导入战绩 → ELO更新</div>
          <div style={{fontSize:12,color:C.muted}}>将已知比赛结果作为先验概率更新各队ELO，仿真只模拟剩余场次</div>
          {importStatus&&<div style={{fontSize:11,color:C.lime,marginTop:3}}>{importStatus}</div>}
          {importErr&&<div style={{fontSize:11,color:C.red,marginTop:2}}>⚠ {importErr}</div>}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={handleImport} style={{background:C.blue,color:"#000",border:"none",borderRadius:8,padding:"9px 16px",fontWeight:700,fontSize:12,cursor:"pointer"}}>
            导入赛果 JSON
          </button>
          <button onClick={loadSeed} style={{background:C.surface,color:C.muted,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 16px",fontWeight:700,fontSize:12,cursor:"pointer"}}>
            恢复种子数据
          </button>
          {updatedCount>0&&appliedCount===0&&<button onClick={applyEloUpdates} style={{background:C.accent,color:"#000",border:"none",borderRadius:8,padding:"9px 16px",fontWeight:700,fontSize:12,cursor:"pointer"}}>⚡ 应用ELO更新 ({updatedCount}队)</button>}
          {appliedCount>0&&<button onClick={resetElo} style={{background:C.surface,color:C.muted,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 16px",fontWeight:700,fontSize:12,cursor:"pointer"}}>↩ 还原ELO</button>}
        </div>
      </div>

      <div style={cs()}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:8}}>赛果 JSON 导入</div>
        <textarea value={resultJson} onChange={e=>setResultJson(e.target.value)} spellCheck={false}
          style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:12,fontFamily:"monospace",fontSize:12,lineHeight:1.5}}/>
        <div style={{fontSize:11,color:C.muted,marginTop:8}}>格式：数组；字段包含 grp, a, b, gA, gB，可选 date, note。球队代码需匹配内置代码。</div>
      </div>

      {/* 战绩 + ELO影响 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={cs()}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>已知比赛结果</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:14}}>{results.length}场已完成 · 可在上方粘贴JSON更新</div>
          {results.length===0&&<div style={{textAlign:"center",color:C.dim,padding:"20px 0",fontSize:13}}>暂无已知结果</div>}
          {results.map((m,i)=>{
            const tA=teamMap[m.a],tB=teamMap[m.b];
            const upA=eloUpdates[m.a],upB=eloUpdates[m.b];
            return(
              <div key={i} style={{borderBottom:`1px solid ${C.border}`,padding:"10px 0",display:"flex",gap:8,alignItems:"center"}}>
                <span style={{...pill("#94A3B8"),fontSize:10,flexShrink:0}}>组{m.grp} · {m.date}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:16}}>{tA?.flag||"🌍"}</span>
                    <span style={{fontSize:13,fontWeight:600}}>{m.gA}</span>
                    <span style={{fontSize:11,color:C.dim}}>:</span>
                    <span style={{fontSize:13,fontWeight:600}}>{m.gB}</span>
                    <span style={{fontSize:16}}>{tB?.flag||"🌍"}</span>
                    <span style={{fontSize:12}}>{m.a} vs {m.b}</span>
                  </div>
                  {m.note&&<div style={{fontSize:11,color:C.muted}}>{m.note}</div>}
                </div>
                <div style={{textAlign:"right",fontSize:11}}>
                  {upA&&<div style={{color:upA.delta>0?C.accent:C.red}}>{m.a} {upA.delta>0?"+":""}{upA.delta}</div>}
                  {upB&&<div style={{color:upB.delta>0?C.accent:C.red}}>{m.b} {upB.delta>0?"+":""}{upB.delta}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={cs()}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>ELO后验更新（贝叶斯先验）</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:14}}>K=60（WC标准），预期结果与实际差值 × K</div>
          {Object.entries(eloUpdates).length===0&&<div style={{textAlign:"center",color:C.dim,padding:"20px 0",fontSize:13}}>输入战绩后显示ELO变化</div>}
          {Object.entries(eloUpdates).map(([code,upd],i)=>{
            const t=teamMap[code];
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:18,flexShrink:0}}>{t?.flag||"🌍"}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{t?.name||code}</div>
                  <div style={{fontSize:11,color:C.muted}}>{upd.oldElo} → {upd.newElo}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={{...pill(upd.delta>0?C.accent:upd.delta<0?C.red:C.muted),fontSize:12}}>
                    {upd.delta>0?"+":""}{upd.delta}
                  </span>
                  {teams.find(t2=>t2.code===code)?.eloUpdated&&<div style={{fontSize:10,color:C.accent,marginTop:2}}>✓已应用</div>}
                </div>
              </div>
            );
          })}
          {appliedCount>0&&<div style={{marginTop:12,padding:"8px 12px",background:C.accent+"18",borderRadius:8,border:`1px solid ${C.accent}`,fontSize:12,color:C.accent}}>
            ✅ {appliedCount}支球队ELO已更新，蒙特卡洛仿真将使用新评分
          </div>}
        </div>
      </div>

      {/* 真实12组概况 */}
      <div style={cs()}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>
          分组种子数据
          <span style={{color:C.muted,fontWeight:400,fontSize:12,marginLeft:10}}>灰色=初始ELO · 彩色=战绩更新后</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {REAL_GROUPS.map(g=>(
            <div key={g.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:12}}>
              <div style={{fontWeight:700,fontSize:13,color:C.accent,marginBottom:8}}>组 {g.id}</div>
              {g.teams.map(code=>{
                const t=teams.find(t2=>t2.code===code);
                const res=results.filter(r=>(r.a===code||r.b===code));
                const pts=res.reduce((acc,r)=>{
                  if(r.a===code)return acc+(r.gA>r.gB?3:r.gA===r.gB?1:0);
                  return acc+(r.gB>r.gA?3:r.gB===r.gA?1:0);
                },0);
                return(
                  <div key={code} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",borderBottom:`1px solid ${C.border}22`}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:14}}>{t?.flag||"🌍"}</span>
                      <span style={{fontSize:11}}>{t?.name||code}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {results.some(r=>r.a===code||r.b===code)&&<span style={{fontSize:11,fontWeight:700,color:C.yellow}}>{pts}分</span>}
                      <span style={{fontSize:10,color:t?.eloUpdated?C.accent:C.dim}}>{t?.elo||"?"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Brier说明 */}
      <div style={{...cs(),padding:14,background:C.surface,border:`1px dashed ${C.border}`}}>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.8}}>
          <span style={{color:C.accent,fontWeight:600}}>贝叶斯先验更新原理：</span>
          每场已知结果会修正各队ELO。公式：<span style={{fontFamily:"monospace",color:C.yellow}}>ΔELO = K × (S − E)</span>，其中 S=实际结果（1/0.5/0），E=ELO预期胜率，K=60（世界杯标准系数）。
          <br/>更新后的ELO作为后验分布用于剩余比赛仿真，使模型随赛事进程动态收敛。
          <br/><span style={{color:C.muted}}>例：墨西哥 2-0 南非（大胜预期内），ELO小幅上调 +{eloUpdates["MEX"]?.delta||"?"}；韩国 2-1 捷克（轻度冷门），上调较多。</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: 历史回测
// ═══════════════════════════════════════════════════════════════
function BacktestTab(){
  const [λ,setλ]=useState(1.2);
  const brier=useMemo(()=>calcBrier(λ),[λ]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={cs()}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:14}}>历史Brier分数 · 拟合λ参数</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          {[{v:brier.overall,l:"总体Brier",c:brier.overall<0.19?C.accent:brier.overall<0.21?C.yellow:C.red},{v:"0.222",l:"随机基准",c:C.blue},{v:λ.toFixed(2),l:"当前λ",c:C.lime},{v:HIST.length,l:"样本场次",c:C.muted}].map((s,i)=>(
            <div key={i} style={{...cs({padding:14}),textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <input type="range" min={0.8} max={1.8} step={0.05} value={λ} onChange={e=>setλ(+e.target.value)} style={{width:"100%",accentColor:C.lime}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.dim,marginTop:3}}>
          <span>0.8（保守）</span><span>最优λ≈1.2</span><span>1.8（进攻型）</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={cs()}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>各届Brier分数</div>
          <div style={{height:190}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brier.byYear} margin={{left:0,right:10,top:0,bottom:0}}>
                <XAxis dataKey="yr" tick={{fill:C.muted,fontSize:12}} tickLine={false} axisLine={{stroke:C.border}}/>
                <YAxis domain={[0.1,0.28]} tick={{fill:C.muted,fontSize:11}} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>[v,"Brier"]}/>
                <ReferenceLine y={0.222} stroke={C.blue} strokeDasharray="4 4"/>
                <Bar dataKey="bs" radius={[4,4,0,0]}>{brier.byYear.map((d,i)=><Cell key={i} fill={d.bs<0.2?C.accent:C.orange}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cs()}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>胜率分布 · 泊松 vs 实际</div>
          <div style={{height:190}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[-400,-300,-200,-100,0,100,200,300,400].map(d=>({d,win:+(mProbs(1800+d,1800).w*100).toFixed(1),draw:+(mProbs(1800+d,1800).d*100).toFixed(1)}))} margin={{left:0,right:10,top:0,bottom:0}}>
                <XAxis dataKey="d" tick={{fill:C.muted,fontSize:10}} tickLine={false} axisLine={{stroke:C.border}}/>
                <YAxis tick={{fill:C.muted,fontSize:10}} tickLine={false} axisLine={false} tickFormatter={v=>v+"%"}/>
                <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}}/>
                <Line type="monotone" dataKey="win" stroke={C.accent} strokeWidth={2} dot={false} name="胜率"/>
                <Line type="monotone" dataKey="draw" stroke={C.blue} strokeWidth={2} dot={false} name="平局率"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div style={cs()}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>历史比赛预测明细</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
              {["年份","阶段","主","客","胜/平/负","实际","Brier"].map((h,i)=><th key={i} style={{textAlign:i>3?"center":"left",padding:"5px 8px",color:C.muted,fontWeight:600}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {brier.matches.map((m,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?"transparent":C.surface+"60"}}>
                  <td style={{padding:"4px 8px",color:C.muted}}>{m.yr}</td>
                  <td style={{padding:"4px 8px"}}>{m.st}</td>
                  <td style={{padding:"4px 8px"}}>{m.a}</td>
                  <td style={{padding:"4px 8px"}}>{m.b}</td>
                  <td style={{padding:"4px 8px",textAlign:"center"}}>
                    <span style={{color:C.accent}}>{m.pw}%</span><span style={{color:C.dim}}> / </span>
                    <span style={{color:C.blue}}>{m.pd}%</span><span style={{color:C.dim}}> / </span>
                    <span style={{color:C.orange}}>{m.pl}%</span>
                  </td>
                  <td style={{padding:"4px 8px",textAlign:"center"}}>
                    <span style={pill(m.r90==="A"?C.accent:m.r90==="D"?C.blue:C.orange)}>
                      {m.r90==="A"?m.a+" 胜":m.r90==="D"?"平":m.b+" 胜"}
                    </span>
                  </td>
                  <td style={{padding:"4px 8px",textAlign:"center",fontWeight:600,color:m.bs<0.15?C.accent:m.bs>0.25?C.red:C.yellow}}>{m.bs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: 队伍评分
// ═══════════════════════════════════════════════════════════════
function TeamsTab({teams,setTeams,selTeam,setSelTeam}){
  const [eloJson,setEloJson]=useState("");
  const [eloStatus,setEloStatus]=useState("内置ELO种子数据 · 可手动导入更新");
  const [eloErr,setEloErr]=useState("");
  const handleEloImport=()=>{
    setEloErr("");
    try{
      const arr=JSON.parse(eloJson);
      if(!Array.isArray(arr))throw new Error("JSON必须是数组");
      let count=0;
      setTeams(prev=>prev.map(t=>{
        const f=arr.find(d=>String(d.code||"").toUpperCase()===t.code);
        if(!f)return t;
        const elo=Number(f.elo);
        if(!Number.isFinite(elo))throw new Error(`${t.code} 的 elo 无效`);
        count++;
        return{...t,elo,strength:eloToStrength(elo,t),eloUpdated:false,eloBase:undefined};
      }));
      setEloStatus(`已导入 ${count} 支球队ELO · ${new Date().toLocaleTimeString("zh-CN")}`);
    }catch(e){setEloErr(e.message);}
  };
  const featured=teams.filter(t=>t.att).sort((a,b)=>b.elo-a.elo);
  const radarData=["att","def","mid","exp","form"].map(k=>({subject:{att:"进攻",def:"防守",mid:"中场",exp:"经验",form:"状态"}[k],value:selTeam?.[k]||70}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{...cs(),display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px"}}>
        <div><div style={{fontWeight:600,fontSize:13,marginBottom:2}}>ELO数据源</div>
          <div style={{fontSize:12,color:C.muted}}>{eloStatus}</div>
          {eloErr&&<div style={{fontSize:11,color:C.red,marginTop:2}}>⚠ {eloErr}</div>}
        </div>
        <button onClick={handleEloImport} disabled={!eloJson.trim()} style={{background:eloJson.trim()?C.accent:C.dim,color:eloJson.trim()?"#000":C.muted,border:"none",borderRadius:8,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:eloJson.trim()?"pointer":"not-allowed"}}>
          导入ELO JSON
        </button>
      </div>
      <div style={cs()}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:8}}>ELO JSON 导入</div>
        <textarea value={eloJson} onChange={e=>setEloJson(e.target.value)} placeholder='[{"code":"ESP","elo":2171},{"code":"ARG","elo":2113}]' spellCheck={false}
          style={{background:C.surface,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:12,fontFamily:"monospace",fontSize:12,lineHeight:1.5}}/>
        <div style={{fontSize:11,color:C.muted,marginTop:8}}>可只导入部分球队；未出现的球队会保留当前ELO。</div>
      </div>
      <div style={cs()}>
        <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>16支热门球队 · 点击查看详情</div>
        <div style={{height:380}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featured} layout="vertical" margin={{left:82,right:55,top:0,bottom:0}}>
              <XAxis type="number" domain={[1600,2250]} tick={{fill:C.muted,fontSize:11}} tickLine={false} axisLine={{stroke:C.border}}/>
              <YAxis type="category" dataKey="name" tick={{fill:C.text,fontSize:12}} tickLine={false} axisLine={false} width={82}
                tickFormatter={v=>{const t=featured.find(t2=>t2.name===v);return t?`${t.flag} ${v}`:v;}}/>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={(v,n,p)=>[`${v}${p.payload.eloUpdated?" (已更新)":""}`,`ELO`]}/>
              <Bar dataKey="elo" radius={[0,4,4,0]} onClick={d=>setSelTeam(d)}>
                {featured.map((t,i)=><Cell key={i} fill={tc(t.strength)} cursor="pointer" opacity={selTeam?.code===t.code?1:0.72} strokeWidth={t.eloUpdated?2:0} stroke={C.accent}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {selTeam&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={cs()}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{selTeam.flag} {selTeam.name} 雷达</div>
          <div style={{height:240}}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}>
                <PolarGrid stroke={C.border}/>
                <PolarAngleAxis dataKey="subject" tick={{fill:C.muted,fontSize:12}}/>
                <PolarRadiusAxis domain={[60,100]} tick={false} axisLine={false}/>
                <Radar dataKey="value" stroke={tc(selTeam.strength)} fill={tc(selTeam.strength)} fillOpacity={0.25} strokeWidth={2}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cs()}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>{selTeam.flag} {selTeam.name}</div>
          {[["当前ELO",selTeam.elo+(selTeam.eloUpdated?" ⚡":""),""],["进攻",selTeam.att,""],["防守",selTeam.def,""],["中场",selTeam.mid,""],["经验",selTeam.exp,""],["状态",selTeam.form,""],["冠军",selTeam.titles,"次"]].map(([l,v,u],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
              <span style={{color:C.muted}}>{l}</span>
              <span style={{fontWeight:600,color:i===0&&selTeam.eloUpdated?C.accent:i===0?tc(selTeam.strength):C.text}}>{v}</span>
            </div>
          ))}
          {selTeam.eloUpdated&&<div style={{marginTop:8,fontSize:11,color:C.accent,background:C.accent+"18",borderRadius:6,padding:"6px 10px"}}>⚡ ELO已因赛事结果更新（+K×(S-E)）</div>}
        </div>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: 蒙特卡洛仿真
// ═══════════════════════════════════════════════════════════════
function MCTab({teamMap, liveResults, running, progress, nSims, setNSims, runSim, results}){
  const playedCount=liveResults.length;
  const eloUpdatedCount=Object.values(teamMap).filter(t=>t.eloUpdated).length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[{v:"12",l:"分组种子",c:C.accent},{v:playedCount,l:"已知场次",c:C.blue},{v:`${72-playedCount}`,l:"待仿真场次",c:C.orange},{v:eloUpdatedCount||"--",l:"ELO已更新队",c:eloUpdatedCount?C.lime:C.dim}].map((s,i)=>(
          <div key={i} style={{...cs({padding:14}),textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      {(playedCount>0||eloUpdatedCount>0)&&(
        <div style={{...cs({padding:12}),background:C.accent+"10",border:`1px solid ${C.accent}40`}}>
          <div style={{fontSize:13,color:C.accent,fontWeight:600,marginBottom:4}}>✅ 先验数据已加载</div>
          <div style={{fontSize:12,color:C.muted}}>
            {playedCount>0&&`${playedCount} 场已知结果将作为确定事件（不再重新仿真）`}
            {eloUpdatedCount>0&&`${playedCount>0?" · ":""} ${eloUpdatedCount} 支球队ELO因赛事结果已更新，后验ELO驱动剩余仿真`}
          </div>
        </div>
      )}
      <div style={cs()}>
        <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>仿真参数</div>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:13,color:C.muted}}>仿真次数</span>
            <span style={{fontSize:14,fontWeight:700,color:C.accent}}>{nSims.toLocaleString()}</span>
          </div>
          <input type="range" min={1000} max={20000} step={500} value={nSims} onChange={e=>setNSims(+e.target.value)} disabled={running} style={{width:"100%",accentColor:C.accent}}/>
        </div>
        {running&&<div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:12,color:C.muted}}>仿真进度</span>
            <span style={{fontSize:12,fontWeight:700,color:C.accent}}>{progress}%</span>
          </div>
          <div style={{height:8,background:C.surface,borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",background:C.accent,width:`${progress}%`,borderRadius:99,transition:"width 0.2s"}}/>
          </div>
        </div>}
        <button onClick={runSim} disabled={running} style={{width:"100%",background:running?C.dim:C.accent,color:running?C.muted:"#000",border:"none",borderRadius:8,padding:"13px 0",fontSize:15,fontWeight:700,cursor:running?"not-allowed":"pointer"}}>
          {running?`⏳ 仿真中 ${progress}%`:"▶ 运行完整蒙特卡洛（分组种子+先验战绩）"}
        </button>
      </div>
      {results&&(
        <div style={cs()}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>仿真结果 — 冠军概率</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>{nSims.toLocaleString()}次 · 分组种子 · {playedCount}场先验 · 泊松进球</div>
          <div style={{height:320}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results.slice(0,16)} margin={{left:10,right:20,top:0,bottom:48}}>
                <XAxis dataKey="name" tick={{fill:C.text,fontSize:11}} tickLine={false} axisLine={{stroke:C.border}}
                  tickFormatter={v=>{const t=Object.values(teamMap).find(t2=>t2.name===v);return t?`${t.flag} ${v}`:v;}}
                  angle={-40} textAnchor="end"/>
                <YAxis tick={{fill:C.muted,fontSize:11}} tickLine={false} axisLine={false} tickFormatter={v=>v.toFixed(0)+"%"}/>
                <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>[v.toFixed(1)+"%","冠军概率"]}/>
                <Bar dataKey="pct" radius={[4,4,0,0]}>{results.slice(0,16).map((t,i)=><Cell key={i} fill={tc(t.strength||70)}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function WorldCupPredictor(){
  const [teams, setTeams] = useState(ALL_TEAMS_BASE);
  const [liveResults, setLiveResults] = useState(SEED_RESULTS);
  const [tab, setTab] = useState(3); // 默认打开赛况先验
  const [simResults, setSimResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [nSims, setNSims] = useState(5000);
  const [selTeam, setSelTeam] = useState(ALL_TEAMS_BASE.find(t=>t.code==="ESP"));

  // 将当前战绩的ELO更新合并进teamMap
  const teamMap = useMemo(()=>{
    const map = Object.fromEntries(teams.map(t=>[t.code, t]));
    return map;
  }, [teams]);

  const runSim = useCallback(async()=>{
    setRunning(true); setProgress(0); setSimResults(null);
    const wins = {}; teams.forEach(t=>(wins[t.code]=0));
    const CHUNK = 80; let done = 0;
    while(done < nSims){
      await new Promise(r=>setTimeout(r, 0));
      const b = Math.min(CHUNK, nSims - done);
      for(let i = 0; i < b; i++) wins[simFullTournament(teamMap, liveResults).code]++;
      done += b; setProgress(Math.round(done/nSims*100));
    }
    const res = teams.filter(t=>wins[t.code]>0)
      .map(t=>({...t,wins:wins[t.code],pct:wins[t.code]/nSims*100}))
      .sort((a,b)=>b.wins-a.wins).slice(0,20);
    setSimResults(res); setRunning(false);
  }, [nSims, teamMap, liveResults, teams]);

  const TABS = ["📐 框架","🔬 特征","📊 球队","📡 赛况先验","🎲 仿真","📈 回测","🏆 结果"];

  const ResultsTab=()=>{
    if(!simResults)return(
      <div style={{...cs(),textAlign:"center",padding:56}}>
        <div style={{fontSize:48,marginBottom:14}}>🎲</div>
        <div style={{fontSize:18,fontWeight:600,marginBottom:8}}>尚未运行仿真</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:24}}>先在「赛况先验」加载战绩，再运行「蒙特卡洛仿真」</div>
        <button onClick={()=>setTab(4)} style={{background:C.accent,color:"#000",border:"none",borderRadius:8,padding:"10px 28px",fontWeight:700,fontSize:14,cursor:"pointer"}}>前往运行 →</button>
      </div>
    );
    const medals=["🥇","🥈","🥉"],topPct=simResults[0]?.pct||1;
    return(
      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        <div style={cs()}>
          <div style={{fontWeight:700,fontSize:16,marginBottom:24}}>🏆 冠军热门（含 {liveResults.length} 场先验数据）</div>
          <div style={{display:"flex",justifyContent:"center",alignItems:"flex-end",gap:16}}>
            {[simResults[1],simResults[0],simResults[2]].map((t,i)=>{
              const rank=i===0?1:i===1?0:2,heights=[170,210,140];
              return(<div key={i} style={{textAlign:"center",width:128}}>
                <div style={{fontSize:30,marginBottom:4}}>{t.flag}</div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:1}}>{t.name}</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>ELO {t.elo}{t.eloUpdated?" ⚡":""}</div>
                <div style={{fontSize:24,fontWeight:800,color:tc(t.strength||70),marginBottom:10}}>{t.pct.toFixed(1)}%</div>
                <div style={{height:heights[i],background:C.surface,border:`2px solid ${i===1?C.accent:C.border}`,borderRadius:"8px 8px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:42}}>{medals[rank]}</div>
              </div>);
            })}
          </div>
        </div>
        <div style={cs()}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>完整概率排行榜</div>
          {simResults.slice(0,16).map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<15?`1px solid ${C.border}`:"none"}}>
              <div style={{width:26,fontSize:13,color:i<3?"#FFD700":C.dim,fontWeight:700,textAlign:"center"}}>{i<3?medals[i]:`${i+1}.`}</div>
              <div style={{fontSize:19}}>{t.flag}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{t.name} {t.eloUpdated&&<span style={{color:C.accent,fontSize:10}}>⚡已更新</span>}</div>
                <div style={{fontSize:11,color:C.muted}}>ELO {t.elo} · 组{REAL_GROUPS.find(g=>g.teams.includes(t.code))?.id||"?"}</div>
              </div>
              <div style={{width:90}}><div style={{height:4,background:C.surface,borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",background:tc(t.strength||70),width:`${(t.pct/topPct)*100}%`,borderRadius:99}}/>
              </div></div>
              <div style={{width:50,textAlign:"right",fontSize:14,fontWeight:800,color:tc(t.strength||70),fontVariantNumeric:"tabular-nums"}}>{t.pct.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 24px",display:"flex",alignItems:"center",gap:14}}>
        <span style={{fontSize:28}}>⚽</span>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,letterSpacing:0}}>2026 FIFA 世界杯预测 · 离线先验版</div>
          <div style={{fontSize:11,color:C.muted}}>分组种子 · 已知战绩作先验 · 贝叶斯ELO更新 · 泊松仿真剩余场次</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <span style={pill(C.accent)}>📡 离线可用</span>
          {liveResults.length>0&&<span style={pill(C.blue)}>{liveResults.length}场先验</span>}
        </div>
      </div>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",padding:"0 16px",overflowX:"auto"}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{padding:"9px 14px",background:"none",border:"none",cursor:"pointer",whiteSpace:"nowrap",fontSize:12,fontWeight:500,color:tab===i?C.accent:C.muted,borderBottom:tab===i?`2px solid ${C.accent}`:"2px solid transparent"}}>{t}</button>
        ))}
      </div>
      <div style={{padding:"20px 24px",maxWidth:1100,margin:"0 auto"}}>
        {tab===0&&<div style={cs()}>
          <div style={{fontWeight:700,fontSize:16,marginBottom:14}}>贝叶斯先验更新流程</div>
          {[["🎱","分组种子","48队12组示例结构，数据可在源码中替换"],
            ["📡","战绩先验","已知结果作确定事件，剩余比赛用泊松仿真"],
            ["⚡","ELO后验","K=60公式更新各队ELO：ΔELO = K×(S − E)"],
            ["🎲","蒙特卡洛","N次仿真，每次混合已知结果+泊松随机场次"],
            ["📊","动态更新","每轮过后导入最新赛果，预测自动收敛"]].map(([icon,t,d],i)=>(
            <div key={i} style={{display:"flex",gap:14,padding:"10px 0",borderBottom:i<4?`1px solid ${C.border}`:"none"}}>
              <span style={{fontSize:26,flexShrink:0}}>{icon}</span>
              <div><div style={{fontWeight:600,fontSize:14,marginBottom:3}}>{t}</div><div style={{fontSize:12,color:C.muted}}>{d}</div></div>
            </div>
          ))}
        </div>}
        {tab===1&&<div style={cs()}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:10}}>泊松模型公式</div>
          <div style={{background:C.surface,borderRadius:8,padding:"14px 18px",border:`1px solid ${C.border}`,fontFamily:"monospace",fontSize:13,lineHeight:2.4}}>
            <span style={{color:C.muted}}>λ_A</span> = <span style={{color:C.accent}}>1.2 · exp(0.45 · (ELO_A − ELO_B) / 400)</span><br/>
            <span style={{color:C.muted}}>进球</span> ~ <span style={{color:"#84CC16"}}>Poisson(λ)</span>　<span style={{color:C.muted}}>ELO更新</span>：<span style={{color:C.yellow}}>ΔELO = 60 × (S − 1/(1+10^(ΔE/400)))</span><br/>
            <span style={{color:C.muted}}>主场</span>：<span style={{color:C.blue}}>+100 ELO</span>　<span style={{color:C.muted}}>加时</span>：<span style={{color:C.orange}}>λ/3</span>　<span style={{color:C.muted}}>点球</span>：<span style={{color:C.orange}}>50%±bias</span>
          </div>
        </div>}
        {tab===2&&<TeamsTab teams={teams} setTeams={setTeams} selTeam={selTeam} setSelTeam={setSelTeam}/>}
        {tab===3&&<LiveDataTab teams={teams} setTeams={setTeams} results={liveResults} setResults={setLiveResults}/>}
        {tab===4&&<MCTab teamMap={teamMap} liveResults={liveResults} running={running} progress={progress} nSims={nSims} setNSims={setNSims} runSim={runSim} results={simResults}/>}
        {tab===5&&<BacktestTab/>}
        {tab===6&&<ResultsTab/>}
      </div>
    </div>
  );
}
