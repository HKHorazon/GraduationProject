import{j as I,i as X,r as m,m as r,f as x,b as o,d as u,t as D,k as g,u as w,v as s,e as y,q as T,x as B,s as Y,G as M,c as N,w as P,o as R,h,z as Q,l as K,g as $,I as W,H as O,D as V,a as ee}from"./index-D7p_F2Ig.js";/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const te=e=>{for(const t in e)if(t.startsWith("aria-")||t==="role"||t==="title")return!0;return!1};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=e=>e==="";/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=(...e)=>e.filter((t,l,a)=>!!t&&t.trim()!==""&&a.indexOf(t)===l).join(" ").trim();/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,l,a)=>a?a.toUpperCase():l.toLowerCase());/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe=e=>{const t=se(e);return t.charAt(0).toUpperCase()+t.slice(1)};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var C={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const le=({name:e,iconNode:t,absoluteStrokeWidth:l,"absolute-stroke-width":a,strokeWidth:p,"stroke-width":i,size:c=C.width,color:v=C.stroke,...f},{slots:k})=>I("svg",{...C,...f,width:c,height:c,stroke:v,"stroke-width":z(l)||z(a)||l===!0||a===!0?Number(p||i||C["stroke-width"])*24/Number(c):p||i||C["stroke-width"],class:ae("lucide",f.class,...e?[`lucide-${H(oe(e))}-icon`,`lucide-${H(e)}`]:["lucide-icon"]),...!k.default&&!te(f)&&{"aria-hidden":"true"}},[...t.map(b=>I(...b)),...k.default?[k.default()]:[]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=(e,t)=>(l,{slots:a,attrs:p})=>I(le,{...p,...l,iconNode:t,name:e},a);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=n("chevron-down",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ne=n("chevron-left",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ce=n("chevron-right",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=n("database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ie=n("folder-open",[["path",{d:"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",key:"usdka0"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ue=n("graduation-cap",[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pe=n("layout-list",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}],["path",{d:"M14 4h7",key:"3xa0d5"}],["path",{d:"M14 9h7",key:"1icrd9"}],["path",{d:"M14 15h7",key:"1mj8o2"}],["path",{d:"M14 20h7",key:"11slyb"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he=n("loader-circle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ke=n("log-in",[["path",{d:"m10 17 5-5-5-5",key:"1bsop3"}],["path",{d:"M15 12H3",key:"6jk70r"}],["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ye=n("log-out",[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ve=n("moon",[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=n("refresh-cw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=n("search",[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=n("settings",[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const me=n("shield-check",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge=n("sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const we=n("user-minus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=n("user",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Me=n("users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ce=n("x",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),at=[{key:"students",label:"學生列表",route:"/students"},{key:"groups",label:"組別列表",route:"/groups"},{key:"remove-student",label:"移除學生出組",route:"/changes/remove-student"},{key:"data",label:"資料管理",route:"/data"}],F="page-permissions",U={students:{viewer:!0,editor:!0},groups:{viewer:!0,editor:!0},"remove-student":{viewer:!1,editor:!0},data:{viewer:!1,editor:!0}};function Se(){try{const e=localStorage.getItem(F);if(e)return JSON.parse(e)}catch{}return null}const Le=X("permissions",()=>{const e=m(Se()??structuredClone(U));function t(){localStorage.setItem(F,JSON.stringify(e.value))}function l(i,c){var v;return c==="super_admin"?!0:((v=e.value[i])==null?void 0:v[c])??!1}function a(i,c){c!=="super_admin"&&(e.value[i][c]=!e.value[i][c],t())}function p(){e.value=structuredClone(U),t()}return{perms:e,canAccess:l,toggle:a,reset:p}}),je={class:"mb-1"},Ae={class:"pl-2 mt-0.5 flex flex-col gap-0.5"},j={__name:"SidebarGroup",props:{label:{type:String,required:!0},icon:{type:[Object,Function],required:!0},collapsed:{type:Boolean,default:!1}},setup(e){const t=m(!0);function l(){t.value=!t.value}return(a,p)=>(r(),x("div",je,[o("button",{onClick:l,class:"w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a3347]/30 cursor-pointer"},[(r(),u(D(e.icon),{class:"w-4 h-4 flex-shrink-0"})),o("span",{class:g(["flex-1 text-left transition-all duration-150",e.collapsed?"opacity-0 w-0 overflow-hidden":"opacity-100"])},w(e.label),3),e.collapsed?y("",!0):(r(),u(s(re),{key:0,class:g(["w-3 h-3 text-slate-400 transition-transform duration-200",t.value?"rotate-0":"-rotate-90"])},null,8,["class"]))]),o("div",{class:g(["overflow-hidden transition-all duration-200",t.value||e.collapsed?"max-h-96":"max-h-0"])},[o("div",Ae,[T(a.$slots,"default")])],2)]))}},$e={key:0,class:"absolute left-full ml-2 px-2 py-1 bg-white dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] rounded text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg"},Ie={key:1,class:"absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-600 dark:bg-cyan-400 rounded-full"},_={__name:"SidebarItem",props:{to:{type:String,required:!0},label:{type:String,required:!0},icon:{type:[Object,Function],required:!0},collapsed:{type:Boolean,default:!1}},setup(e){const t=e,l=B(),a=N(()=>l.path===t.to||l.path.startsWith(t.to+"/"));return(p,i)=>{const c=Y("RouterLink");return r(),u(c,{to:e.to,class:g(["flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group relative cursor-pointer",a.value?"bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-400 font-semibold border border-blue-200 dark:border-cyan-800/50":"text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2a3347]/50"])},{default:M(()=>[(r(),u(D(e.icon),{class:"w-4 h-4 flex-shrink-0"})),o("span",{class:g(["truncate transition-all duration-150",e.collapsed?"opacity-0 w-0 overflow-hidden":"opacity-100"])},w(e.label),3),e.collapsed?(r(),x("span",$e,w(e.label),1)):y("",!0),a.value?(r(),x("span",Ie)):y("",!0)]),_:1},8,["to","class"])}}},qe={class:"flex items-center gap-3 px-3 h-14 border-b border-slate-200 dark:border-[#2a3347]"},Ee={class:"flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1"},Oe={__name:"AppSidebar",setup(e){const t=P(),l=Le(),a=m(!1);R(()=>{const i=localStorage.getItem("sidebar-collapsed");i!==null&&(a.value=i==="true")});function p(){a.value=!a.value,localStorage.setItem("sidebar-collapsed",a.value)}return(i,c)=>(r(),x("aside",{class:g(["flex flex-col border-r transition-all duration-150 flex-shrink-0 bg-white dark:bg-[#161b27] border-slate-200 dark:border-[#2a3347]",a.value?"w-14":"w-56"])},[o("div",qe,[h(s(ue),{class:"w-5 h-5 text-blue-600 dark:text-cyan-400 flex-shrink-0"}),o("span",{class:g(["font-bold text-blue-600 dark:text-cyan-400 text-sm tracking-wide transition-all duration-150",a.value?"opacity-0 w-0 overflow-hidden":"opacity-100"])},"畢業專題",2)]),o("nav",Ee,[h(j,{label:"瀏覽",icon:s(xe),collapsed:a.value},{default:M(()=>[s(l).canAccess("students",s(t).role)?(r(),u(_,{key:0,to:"/students",label:"學生列表",icon:s(Me),collapsed:a.value},null,8,["icon","collapsed"])):y("",!0),s(l).canAccess("groups",s(t).role)?(r(),u(_,{key:1,to:"/groups",label:"組別列表",icon:s(pe),collapsed:a.value},null,8,["icon","collapsed"])):y("",!0)]),_:1},8,["icon","collapsed"]),s(l).canAccess("remove-student",s(t).role)?(r(),u(j,{key:0,label:"異動",icon:s(be),collapsed:a.value},{default:M(()=>[h(_,{to:"/changes/remove-student",label:"移除學生出組",icon:s(we),collapsed:a.value},null,8,["icon","collapsed"])]),_:1},8,["icon","collapsed"])):y("",!0),s(l).canAccess("data",s(t).role)?(r(),u(j,{key:1,label:"資料",icon:s(de),collapsed:a.value},{default:M(()=>[h(_,{to:"/data",label:"資料管理",icon:s(ie),collapsed:a.value},null,8,["icon","collapsed"])]),_:1},8,["icon","collapsed"])):y("",!0),s(t).isSuperAdmin?(r(),u(j,{key:2,label:"帳號",icon:s(_e),collapsed:a.value},{default:M(()=>[h(_,{to:"/accounts",label:"帳號管理",icon:s(fe),collapsed:a.value},null,8,["icon","collapsed"]),h(_,{to:"/permissions",label:"權限設定",icon:s(me),collapsed:a.value},null,8,["icon","collapsed"])]),_:1},8,["icon","collapsed"])):y("",!0)]),o("button",{onClick:p,class:"flex items-center justify-center h-10 border-t border-slate-200 dark:border-[#2a3347] text-slate-400 dark:text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors text-sm cursor-pointer"},[a.value?(r(),u(s(ce),{key:1,class:"w-4 h-4"})):(r(),u(s(ne),{key:0,class:"w-4 h-4"}))])],2))}},Ve={class:"flex items-center justify-between h-14 px-6 flex-shrink-0 bg-white dark:bg-[#161b27] border-b border-slate-200 dark:border-[#2a3347]"},ze={class:"text-slate-700 dark:text-slate-200 text-sm font-semibold tracking-wide"},He={class:"flex items-center gap-3"},Ue=["title"],De={class:"relative","data-login-panel":""},Te={key:0,class:"flex items-center gap-2"},Be={class:"flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347]"},Ne={class:"text-xs text-slate-600 dark:text-slate-300 font-mono max-w-[140px] truncate"},Pe={key:0,class:"absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg z-50 bg-white dark:bg-[#1a2235] border border-slate-200 dark:border-[#2a3347]"},Re={class:"flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-[#2a3347]"},Fe={class:"space-y-1"},Ge=["disabled"],Je={class:"space-y-1"},Ze=["disabled"],Xe={key:0,class:"text-xs text-red-500 dark:text-red-400"},Ye=["disabled"],Qe={__name:"AppTopbar",setup(e){const t=Q(),l=P(),a=B(),p={"/students":"學生列表","/groups":"組別列表","/changes/remove-student":"移除學生出組","/data":"資料管理","/accounts":"帳號管理","/permissions":"權限設定"},i=N(()=>p[a.path]??"畢業專題管理系統"),c=m(!1),v=m(""),f=m(""),k=m(""),b=m(!1);function G(){c.value=!0,k.value=""}function A(){c.value=!1,v.value="",f.value="",k.value="",b.value=!1}async function J(){if(!v.value||!f.value){k.value="請填寫帳號與密碼";return}b.value=!0,k.value="";try{await l.signIn(v.value,f.value),A()}catch(S){k.value=S.message??"登入失敗，請確認帳號密碼"}finally{b.value=!1}}async function Z(){await l.signOut()}function q(S){c.value&&!S.target.closest("[data-login-panel]")&&A()}return R(()=>document.addEventListener("mousedown",q)),K(()=>document.removeEventListener("mousedown",q)),(S,d)=>{var E;return r(),x("header",Ve,[o("h1",ze,w(i.value),1),o("div",He,[o("button",{onClick:d[0]||(d[0]=L=>s(t).toggle()),class:"w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-cyan-400 hover:text-blue-600 dark:hover:text-cyan-400",title:s(t).isDark?"切換淺色模式":"切換深色模式"},[s(t).isDark?(r(),u(s(ge),{key:0,class:"w-4 h-4"})):(r(),u(s(ve),{key:1,class:"w-4 h-4"}))],8,Ue),o("div",De,[s(l).isLoggedIn?(r(),x("div",Te,[o("div",Be,[o("span",{class:g(["w-2 h-2 rounded-full",s(l).isEditor?"bg-blue-600 dark:bg-cyan-400":"bg-slate-400 dark:bg-slate-500"])},null,2),o("span",Ne,w(((E=s(l).user)==null?void 0:E.email)??s(l).role.toUpperCase()),1)]),o("button",{onClick:Z,class:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] text-slate-500 dark:text-slate-400 hover:border-red-400 dark:hover:border-red-400 hover:text-red-500 dark:hover:text-red-400"},[h(s(ye),{class:"w-3.5 h-3.5"}),d[3]||(d[3]=$(" 登出 ",-1))])])):(r(),x("button",{key:1,onClick:G,class:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-blue-600 dark:bg-cyan-500 text-white hover:bg-blue-700 dark:hover:bg-cyan-400"},[h(s(ke),{class:"w-3.5 h-3.5"}),d[4]||(d[4]=$(" 登入 ",-1))])),h(ee,{"enter-active-class":"transition-all duration-150 ease-out","enter-from-class":"opacity-0 translate-y-1","enter-to-class":"opacity-100 translate-y-0","leave-active-class":"transition-all duration-100 ease-in","leave-from-class":"opacity-100 translate-y-0","leave-to-class":"opacity-0 translate-y-1"},{default:M(()=>[c.value?(r(),x("div",Pe,[o("div",Re,[d[5]||(d[5]=o("span",{class:"text-sm font-semibold text-slate-700 dark:text-slate-200"},"登入帳號",-1)),o("button",{onClick:A,class:"w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3347]"},[h(s(Ce),{class:"w-3.5 h-3.5"})])]),o("form",{onSubmit:W(J,["prevent"]),class:"p-4 space-y-3"},[o("div",Fe,[d[6]||(d[6]=o("label",{class:"text-xs text-slate-500 dark:text-slate-400"},"帳號",-1)),O(o("input",{"onUpdate:modelValue":d[1]||(d[1]=L=>v.value=L),type:"text",autocomplete:"email",placeholder:"帳號 / 電子郵件",class:"input w-full text-sm",disabled:b.value},null,8,Ge),[[V,v.value]])]),o("div",Je,[d[7]||(d[7]=o("label",{class:"text-xs text-slate-500 dark:text-slate-400"},"密碼",-1)),O(o("input",{"onUpdate:modelValue":d[2]||(d[2]=L=>f.value=L),type:"password",autocomplete:"current-password",placeholder:"••••••••",class:"input w-full text-sm",disabled:b.value},null,8,Ze),[[V,f.value]])]),k.value?(r(),x("p",Xe,w(k.value),1)):y("",!0),o("button",{type:"submit",disabled:b.value,class:"w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-blue-600 dark:bg-cyan-500 text-white hover:bg-blue-700 dark:hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"},[b.value?(r(),u(s(he),{key:0,class:"w-4 h-4 animate-spin"})):y("",!0),$(" "+w(b.value?"登入中…":"登入"),1)],8,Ye)],32)])):y("",!0)]),_:1})])])])}}},Ke={class:"flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-slate-200"},We={class:"flex flex-col flex-1 min-w-0"},et={class:"flex-1 overflow-y-auto p-6"},st={__name:"AppLayout",setup(e){return(t,l)=>(r(),x("div",Ke,[h(Oe),o("div",We,[h(Qe),o("main",et,[T(t.$slots,"default")])])]))}};export{re as C,at as P,we as U,Ce as X,st as _,n as c,Le as u};
