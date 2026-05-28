import{i as q,l as o,f as y,b as s,d as u,s as I,j as x,t as m,u as l,e as v,p as O,r as g,w as D,q as Z,E as _,c as T,v as R,o as N,h as c,y as X,k as J,g as A,H as Q,G as E,C as U,a as Y}from"./index-DWyVqAoM.js";/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=t=>{for(const a in t)if(a.startsWith("aria-")||a==="role"||a==="title")return!0;return!1};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=t=>t==="";/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W=(...t)=>t.filter((a,e,n)=>!!a&&a.trim()!==""&&n.indexOf(a)===e).join(" ").trim();/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(a,e,n)=>n?n.toUpperCase():e.toLowerCase());/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const te=t=>{const a=ee(t);return a.charAt(0).toUpperCase()+a.slice(1)};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var M={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=({name:t,iconNode:a,absoluteStrokeWidth:e,"absolute-stroke-width":n,strokeWidth:i,"stroke-width":w,size:h=M.width,color:f=M.stroke,...b},{slots:p})=>q("svg",{...M,...b,width:h,height:h,stroke:f,"stroke-width":z(e)||z(n)||e===!0||n===!0?Number(i||w||M["stroke-width"])*24/Number(h):i||w||M["stroke-width"],class:W("lucide",b.class,...t?[`lucide-${B(te(t))}-icon`,`lucide-${B(t)}`]:["lucide-icon"]),...!p.default&&!K(b)&&{"aria-hidden":"true"}},[...a.map(k=>q(...k)),...p.default?[p.default()]:[]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=(t,a)=>(e,{slots:n,attrs:i})=>q(ae,{...i,...e,iconNode:a,name:t},n);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=r("chevron-down",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const le=r("chevron-left",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe=r("chevron-right",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=r("database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ne=r("folder-open",[["path",{d:"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",key:"usdka0"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=r("graduation-cap",[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ce=r("layout-list",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}],["path",{d:"M14 4h7",key:"3xa0d5"}],["path",{d:"M14 9h7",key:"1icrd9"}],["path",{d:"M14 15h7",key:"1mj8o2"}],["path",{d:"M14 20h7",key:"11slyb"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ie=r("loader-circle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ue=r("log-in",[["path",{d:"m10 17 5-5-5-5",key:"1bsop3"}],["path",{d:"M15 12H3",key:"6jk70r"}],["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pe=r("log-out",[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he=r("moon",[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ke=r("refresh-cw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ye=r("search",[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=r("settings",[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ve=r("sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=r("user-minus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=r("user",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge=r("users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const me=r("x",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),we={class:"mb-1"},_e={class:"pl-2 mt-0.5 flex flex-col gap-0.5"},$={__name:"SidebarGroup",props:{label:{type:String,required:!0},icon:{type:[Object,Function],required:!0},collapsed:{type:Boolean,default:!1}},setup(t){const a=g(!0);function e(){a.value=!a.value}return(n,i)=>(o(),y("div",we,[s("button",{onClick:e,class:"w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a3347]/30 cursor-pointer"},[(o(),u(I(t.icon),{class:"w-4 h-4 flex-shrink-0"})),s("span",{class:x(["flex-1 text-left transition-all duration-150",t.collapsed?"opacity-0 w-0 overflow-hidden":"opacity-100"])},m(t.label),3),t.collapsed?v("",!0):(o(),u(l(se),{key:0,class:x(["w-3 h-3 text-slate-400 transition-transform duration-200",a.value?"rotate-0":"-rotate-90"])},null,8,["class"]))]),s("div",{class:x(["overflow-hidden transition-all duration-200",a.value||t.collapsed?"max-h-96":"max-h-0"])},[s("div",_e,[O(n.$slots,"default")])],2)]))}},Me={key:0,class:"absolute left-full ml-2 px-2 py-1 bg-white dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] rounded text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg"},Ce={key:1,class:"absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-600 dark:bg-cyan-400 rounded-full"},C={__name:"SidebarItem",props:{to:{type:String,required:!0},label:{type:String,required:!0},icon:{type:[Object,Function],required:!0},collapsed:{type:Boolean,default:!1}},setup(t){const a=t,e=D(),n=T(()=>e.path===a.to||e.path.startsWith(a.to+"/"));return(i,w)=>{const h=Z("RouterLink");return o(),u(h,{to:t.to,class:x(["flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group relative cursor-pointer",n.value?"bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-400 font-semibold border border-blue-200 dark:border-cyan-800/50":"text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2a3347]/50"])},{default:_(()=>[(o(),u(I(t.icon),{class:"w-4 h-4 flex-shrink-0"})),s("span",{class:x(["truncate transition-all duration-150",t.collapsed?"opacity-0 w-0 overflow-hidden":"opacity-100"])},m(t.label),3),t.collapsed?(o(),y("span",Me,m(t.label),1)):v("",!0),n.value?(o(),y("span",Ce)):v("",!0)]),_:1},8,["to","class"])}}},Le={class:"flex items-center gap-3 px-3 h-14 border-b border-slate-200 dark:border-[#2a3347]"},je={class:"flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1"},$e={__name:"AppSidebar",setup(t){const a=R(),e=g(!1);N(()=>{const i=localStorage.getItem("sidebar-collapsed");i!==null&&(e.value=i==="true")});function n(){e.value=!e.value,localStorage.setItem("sidebar-collapsed",e.value)}return(i,w)=>(o(),y("aside",{class:x(["flex flex-col border-r transition-all duration-150 flex-shrink-0 bg-white dark:bg-[#161b27] border-slate-200 dark:border-[#2a3347]",e.value?"w-14":"w-56"])},[s("div",Le,[c(l(de),{class:"w-5 h-5 text-blue-600 dark:text-cyan-400 flex-shrink-0"}),s("span",{class:x(["font-bold text-blue-600 dark:text-cyan-400 text-sm tracking-wide transition-all duration-150",e.value?"opacity-0 w-0 overflow-hidden":"opacity-100"])},"畢業專題",2)]),s("nav",je,[c($,{label:"瀏覽",icon:l(ye),collapsed:e.value},{default:_(()=>[c(C,{to:"/students",label:"學生列表",icon:l(ge),collapsed:e.value},null,8,["icon","collapsed"]),c(C,{to:"/groups",label:"組別列表",icon:l(ce),collapsed:e.value},null,8,["icon","collapsed"])]),_:1},8,["icon","collapsed"]),l(a).isEditor?(o(),u($,{key:0,label:"異動",icon:l(ke),collapsed:e.value},{default:_(()=>[c(C,{to:"/changes/remove-student",label:"移除學生出組",icon:l(xe),collapsed:e.value},null,8,["icon","collapsed"])]),_:1},8,["icon","collapsed"])):v("",!0),l(a).isEditor?(o(),u($,{key:1,label:"資料",icon:l(re),collapsed:e.value},{default:_(()=>[c(C,{to:"/data",label:"資料管理",icon:l(ne),collapsed:e.value},null,8,["icon","collapsed"])]),_:1},8,["icon","collapsed"])):v("",!0),l(a).isSuperAdmin?(o(),u($,{key:2,label:"帳號",icon:l(fe),collapsed:e.value},{default:_(()=>[c(C,{to:"/accounts",label:"帳號管理",icon:l(be),collapsed:e.value},null,8,["icon","collapsed"])]),_:1},8,["icon","collapsed"])):v("",!0)]),s("button",{onClick:n,class:"flex items-center justify-center h-10 border-t border-slate-200 dark:border-[#2a3347] text-slate-400 dark:text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors text-sm cursor-pointer"},[e.value?(o(),u(l(oe),{key:1,class:"w-4 h-4"})):(o(),u(l(le),{key:0,class:"w-4 h-4"}))])],2))}},Se={class:"flex items-center justify-between h-14 px-6 flex-shrink-0 bg-white dark:bg-[#161b27] border-b border-slate-200 dark:border-[#2a3347]"},Ae={class:"text-slate-700 dark:text-slate-200 text-sm font-semibold tracking-wide"},qe={class:"flex items-center gap-3"},He=["title"],Ve={class:"relative","data-login-panel":""},Ee={key:0,class:"flex items-center gap-2"},Ue={class:"flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347]"},ze={class:"text-xs text-slate-600 dark:text-slate-300 font-mono max-w-[140px] truncate"},Be={key:0,class:"absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg z-50 bg-white dark:bg-[#1a2235] border border-slate-200 dark:border-[#2a3347]"},Ie={class:"flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-[#2a3347]"},Oe={class:"space-y-1"},De=["disabled"],Te={class:"space-y-1"},Re=["disabled"],Ne={key:0,class:"text-xs text-red-500 dark:text-red-400"},Fe=["disabled"],Ge={__name:"AppTopbar",setup(t){const a=X(),e=R(),n=D(),i={"/students":"學生列表","/groups":"組別列表","/changes/remove-student":"移除學生出組","/data":"資料管理","/accounts":"帳號管理"},w=T(()=>i[n.path]??"畢業專題管理系統"),h=g(!1),f=g(""),b=g(""),p=g(""),k=g(!1);function F(){h.value=!0,p.value=""}function S(){h.value=!1,f.value="",b.value="",p.value="",k.value=!1}async function G(){if(!f.value||!b.value){p.value="請填寫帳號與密碼";return}k.value=!0,p.value="";try{await e.signIn(f.value,b.value),S()}catch(L){p.value=L.message??"登入失敗，請確認帳號密碼"}finally{k.value=!1}}async function P(){await e.signOut()}function H(L){h.value&&!L.target.closest("[data-login-panel]")&&S()}return N(()=>document.addEventListener("mousedown",H)),J(()=>document.removeEventListener("mousedown",H)),(L,d)=>{var V;return o(),y("header",Se,[s("h1",Ae,m(w.value),1),s("div",qe,[s("button",{onClick:d[0]||(d[0]=j=>l(a).toggle()),class:"w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-cyan-400 hover:text-blue-600 dark:hover:text-cyan-400",title:l(a).isDark?"切換淺色模式":"切換深色模式"},[l(a).isDark?(o(),u(l(ve),{key:0,class:"w-4 h-4"})):(o(),u(l(he),{key:1,class:"w-4 h-4"}))],8,He),s("div",Ve,[l(e).isLoggedIn?(o(),y("div",Ee,[s("div",Ue,[s("span",{class:x(["w-2 h-2 rounded-full",l(e).isEditor?"bg-blue-600 dark:bg-cyan-400":"bg-slate-400 dark:bg-slate-500"])},null,2),s("span",ze,m(((V=l(e).user)==null?void 0:V.email)??l(e).role.toUpperCase()),1)]),s("button",{onClick:P,class:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] text-slate-500 dark:text-slate-400 hover:border-red-400 dark:hover:border-red-400 hover:text-red-500 dark:hover:text-red-400"},[c(l(pe),{class:"w-3.5 h-3.5"}),d[3]||(d[3]=A(" 登出 ",-1))])])):(o(),y("button",{key:1,onClick:F,class:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-blue-600 dark:bg-cyan-500 text-white hover:bg-blue-700 dark:hover:bg-cyan-400"},[c(l(ue),{class:"w-3.5 h-3.5"}),d[4]||(d[4]=A(" 登入 ",-1))])),c(Y,{"enter-active-class":"transition-all duration-150 ease-out","enter-from-class":"opacity-0 translate-y-1","enter-to-class":"opacity-100 translate-y-0","leave-active-class":"transition-all duration-100 ease-in","leave-from-class":"opacity-100 translate-y-0","leave-to-class":"opacity-0 translate-y-1"},{default:_(()=>[h.value?(o(),y("div",Be,[s("div",Ie,[d[5]||(d[5]=s("span",{class:"text-sm font-semibold text-slate-700 dark:text-slate-200"},"登入帳號",-1)),s("button",{onClick:S,class:"w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3347]"},[c(l(me),{class:"w-3.5 h-3.5"})])]),s("form",{onSubmit:Q(G,["prevent"]),class:"p-4 space-y-3"},[s("div",Oe,[d[6]||(d[6]=s("label",{class:"text-xs text-slate-500 dark:text-slate-400"},"帳號",-1)),E(s("input",{"onUpdate:modelValue":d[1]||(d[1]=j=>f.value=j),type:"text",autocomplete:"email",placeholder:"帳號 / 電子郵件",class:"input w-full text-sm",disabled:k.value},null,8,De),[[U,f.value]])]),s("div",Te,[d[7]||(d[7]=s("label",{class:"text-xs text-slate-500 dark:text-slate-400"},"密碼",-1)),E(s("input",{"onUpdate:modelValue":d[2]||(d[2]=j=>b.value=j),type:"password",autocomplete:"current-password",placeholder:"••••••••",class:"input w-full text-sm",disabled:k.value},null,8,Re),[[U,b.value]])]),p.value?(o(),y("p",Ne,m(p.value),1)):v("",!0),s("button",{type:"submit",disabled:k.value,class:"w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-blue-600 dark:bg-cyan-500 text-white hover:bg-blue-700 dark:hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"},[k.value?(o(),u(l(ie),{key:0,class:"w-4 h-4 animate-spin"})):v("",!0),A(" "+m(k.value?"登入中…":"登入"),1)],8,Fe)],32)])):v("",!0)]),_:1})])])])}}},Pe={class:"flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-slate-200"},Ze={class:"flex flex-col flex-1 min-w-0"},Xe={class:"flex-1 overflow-y-auto p-6"},Qe={__name:"AppLayout",setup(t){return(a,e)=>(o(),y("div",Pe,[c($e),s("div",Ze,[c(Ge),s("main",Xe,[O(a.$slots,"default")])])]))}};export{se as C,xe as U,me as X,Qe as _,r as c};
