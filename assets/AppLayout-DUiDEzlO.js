import{k as H,j as X,r as x,G as Y,p as r,g,d as l,e as d,u as T,l as w,v as M,w as e,f as p,s as D,y as F,t as K,H as _,c as B,x as R,o as N,i as k,A as Q,m as W,h as $,J as ee,I as q,D as E,a as te}from"./index-BPilSjmz.js";/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=t=>{for(const s in t)if(s.startsWith("aria-")||s==="role"||s==="title")return!0;return!1};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=t=>t==="";/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=(...t)=>t.filter((s,o,a)=>!!s&&s.trim()!==""&&a.indexOf(s)===o).join(" ").trim();/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(s,o,a)=>a?a.toUpperCase():o.toLowerCase());/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const le=t=>{const s=oe(t);return s.charAt(0).toUpperCase()+s.slice(1)};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var C={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=({name:t,iconNode:s,absoluteStrokeWidth:o,"absolute-stroke-width":a,strokeWidth:h,"stroke-width":i,size:c=C.width,color:v=C.stroke,...m},{slots:y})=>H("svg",{...C,...m,width:c,height:c,stroke:v,"stroke-width":O(o)||O(a)||o===!0||a===!0?Number(h||i||C["stroke-width"])*24/Number(c):h||i||C["stroke-width"],class:se("lucide",m.class,...t?[`lucide-${U(le(t))}-icon`,`lucide-${U(t)}`]:["lucide-icon"]),...!y.default&&!ae(m)&&{"aria-hidden":"true"}},[...s.map(b=>H(...b)),...y.default?[y.default()]:[]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=(t,s)=>(o,{slots:a,attrs:h})=>H(re,{...h,...o,iconNode:s,name:t},a);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ne=n("chevron-down",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ce=n("chevron-left",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=n("chevron-right",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ie=n("database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ue=n("file-stack",[["path",{d:"M11 21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1",key:"likhh7"}],["path",{d:"M16 16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1",key:"17ky3x"}],["path",{d:"M21 6a2 2 0 0 0-.586-1.414l-2-2A2 2 0 0 0 17 2h-3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1z",key:"1hyeo0"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pe=n("file-text",[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he=n("folder-cog",[["path",{d:"M10.3 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.98a2 2 0 0 1 1.69.9l.66 1.2A2 2 0 0 0 12 6h8a2 2 0 0 1 2 2v3.3",key:"128dxu"}],["path",{d:"m14.305 19.53.923-.382",key:"3m78fa"}],["path",{d:"m15.228 16.852-.923-.383",key:"npixar"}],["path",{d:"m16.852 15.228-.383-.923",key:"5xggr7"}],["path",{d:"m16.852 20.772-.383.924",key:"dpfhf9"}],["path",{d:"m19.148 15.228.383-.923",key:"1reyyz"}],["path",{d:"m19.53 21.696-.382-.924",key:"1goivc"}],["path",{d:"m20.772 16.852.924-.383",key:"htqkph"}],["path",{d:"m20.772 19.148.924.383",key:"9w9pjp"}],["circle",{cx:"18",cy:"18",r:"3",key:"1xkwt0"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ye=n("folder-open",[["path",{d:"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",key:"usdka0"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ke=n("graduation-cap",[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ve=n("history",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=n("layout-list",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}],["path",{d:"M14 4h7",key:"3xa0d5"}],["path",{d:"M14 9h7",key:"1icrd9"}],["path",{d:"M14 15h7",key:"1mj8o2"}],["path",{d:"M14 20h7",key:"11slyb"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge=n("loader-circle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const me=n("log-in",[["path",{d:"m10 17 5-5-5-5",key:"1bsop3"}],["path",{d:"M15 12H3",key:"6jk70r"}],["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=n("log-out",[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=n("moon",[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const we=n("refresh-cw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=n("search",[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Me=n("settings",[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ce=n("shield-check",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=n("sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Se=n("user-minus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le=n("user",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const je=n("users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=n("x",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),nt=[{key:"students",label:"學生列表",route:"/students"},{key:"groups",label:"組別列表",route:"/groups"},{key:"remove-student",label:"學生更動",route:"/changes/remove-student"},{key:"group-change",label:"組別異動",route:"/changes/group-change"},{key:"documents",label:"文件處理",route:"/documents"},{key:"data",label:"資料管理",route:"/data"},{key:"audit-logs",label:"異動紀錄",route:"/audit-logs"}],P="page-permissions",z={students:{viewer:!0,editor:!0},groups:{viewer:!0,editor:!0},"remove-student":{viewer:!1,editor:!0},"group-change":{viewer:!1,editor:!0},documents:{viewer:!1,editor:!0},data:{viewer:!1,editor:!0},"audit-logs":{viewer:!1,editor:!0}};function He(){try{const t=localStorage.getItem(P);if(t)return{...structuredClone(z),...JSON.parse(t)}}catch{}return null}const ze=X("permissions",()=>{const t=x(He()??structuredClone(z));function s(){localStorage.setItem(P,JSON.stringify(t.value))}function o(i,c){var v;return c==="super_admin"?!0:((v=t.value[i])==null?void 0:v[c])??!1}function a(i,c){c!=="super_admin"&&(t.value[i][c]=!t.value[i][c],s())}function h(){t.value=structuredClone(z),s()}return{perms:t,canAccess:o,toggle:a,reset:h}}),Ie={class:"mb-1"},Ve={class:"pl-2 mt-0.5 flex flex-col gap-0.5"},A={__name:"SidebarGroup",props:{label:{type:String,required:!0},icon:{type:[Object,Function],required:!0},collapsed:{type:Boolean,default:!1}},setup(t){const o=`sidebar-group:${t.label}`,a=x(localStorage.getItem(o)!=="false");Y(a,i=>localStorage.setItem(o,i));function h(){a.value=!a.value}return(i,c)=>(r(),g("div",Ie,[l("button",{onClick:h,class:"w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a3347]/30 cursor-pointer"},[(r(),d(T(t.icon),{class:"w-4 h-4 flex-shrink-0"})),l("span",{class:w(["flex-1 text-left transition-all duration-150",t.collapsed?"opacity-0 w-0 overflow-hidden":"opacity-100"])},M(t.label),3),t.collapsed?p("",!0):(r(),d(e(ne),{key:0,class:w(["w-3 h-3 text-slate-400 transition-transform duration-200",a.value?"rotate-0":"-rotate-90"])},null,8,["class"]))]),l("div",{class:w(["overflow-hidden transition-all duration-200",a.value||t.collapsed?"max-h-96":"max-h-0"])},[l("div",Ve,[D(i.$slots,"default")])],2)]))}},qe={key:0,class:"absolute left-full ml-2 px-2 py-1 bg-white dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] rounded text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg"},Ee={key:1,class:"absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-600 dark:bg-cyan-400 rounded-full"},f={__name:"SidebarItem",props:{to:{type:String,required:!0},label:{type:String,required:!0},icon:{type:[Object,Function],required:!0},collapsed:{type:Boolean,default:!1}},setup(t){const s=t,o=F(),a=B(()=>o.path===s.to||o.path.startsWith(s.to+"/"));return(h,i)=>{const c=K("RouterLink");return r(),d(c,{to:t.to,class:w(["flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group relative cursor-pointer",a.value?"bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-400 font-semibold border border-blue-200 dark:border-cyan-800/50":"text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2a3347]/50"])},{default:_(()=>[(r(),d(T(t.icon),{class:"w-4 h-4 flex-shrink-0"})),l("span",{class:w(["truncate transition-all duration-150",t.collapsed?"opacity-0 w-0 overflow-hidden":"opacity-100"])},M(t.label),3),t.collapsed?(r(),g("span",qe,M(t.label),1)):p("",!0),a.value?(r(),g("span",Ee)):p("",!0)]),_:1},8,["to","class"])}}},Oe={class:"flex items-center gap-3 px-3 h-14 border-b border-slate-200 dark:border-[#2a3347]"},Ue={class:"flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1"},Te={__name:"AppSidebar",setup(t){const s=R(),o=ze(),a=x(!1);N(()=>{const i=localStorage.getItem("sidebar-collapsed");i!==null&&(a.value=i==="true")});function h(){a.value=!a.value,localStorage.setItem("sidebar-collapsed",a.value)}return(i,c)=>(r(),g("aside",{class:w(["flex flex-col border-r transition-all duration-150 flex-shrink-0 bg-white dark:bg-[#161b27] border-slate-200 dark:border-[#2a3347]",a.value?"w-14":"w-56"])},[l("div",Oe,[k(e(ke),{class:"w-5 h-5 text-blue-600 dark:text-cyan-400 flex-shrink-0"}),l("span",{class:w(["font-bold text-blue-600 dark:text-cyan-400 text-sm tracking-wide transition-all duration-150",a.value?"opacity-0 w-0 overflow-hidden":"opacity-100"])},"畢業專題",2)]),l("nav",Ue,[k(A,{label:"瀏覽",icon:e(_e),collapsed:a.value},{default:_(()=>[e(o).canAccess("students",e(s).role)?(r(),d(f,{key:0,to:"/students",label:"學生列表",icon:e(je),collapsed:a.value},null,8,["icon","collapsed"])):p("",!0),e(o).canAccess("groups",e(s).role)?(r(),d(f,{key:1,to:"/groups",label:"組別列表",icon:e(be),collapsed:a.value},null,8,["icon","collapsed"])):p("",!0)]),_:1},8,["icon","collapsed"]),e(o).canAccess("remove-student",e(s).role)||e(o).canAccess("group-change",e(s).role)?(r(),d(A,{key:0,label:"基本操作",icon:e(we),collapsed:a.value},{default:_(()=>[e(o).canAccess("remove-student",e(s).role)?(r(),d(f,{key:0,to:"/changes/remove-student",label:"學生更動",icon:e(Se),collapsed:a.value},null,8,["icon","collapsed"])):p("",!0),e(o).canAccess("group-change",e(s).role)?(r(),d(f,{key:1,to:"/changes/group-change",label:"組別異動",icon:e(he),collapsed:a.value},null,8,["icon","collapsed"])):p("",!0)]),_:1},8,["icon","collapsed"])):p("",!0),e(o).canAccess("documents",e(s).role)?(r(),d(A,{key:1,label:"文件",icon:e(ue),collapsed:a.value},{default:_(()=>[k(f,{to:"/documents",label:"文件處理",icon:e(pe),collapsed:a.value},null,8,["icon","collapsed"])]),_:1},8,["icon","collapsed"])):p("",!0),e(o).canAccess("data",e(s).role)||e(o).canAccess("audit-logs",e(s).role)?(r(),d(A,{key:2,label:"資料",icon:e(ie),collapsed:a.value},{default:_(()=>[e(o).canAccess("data",e(s).role)?(r(),d(f,{key:0,to:"/data",label:"資料管理",icon:e(ye),collapsed:a.value},null,8,["icon","collapsed"])):p("",!0),e(o).canAccess("audit-logs",e(s).role)?(r(),d(f,{key:1,to:"/audit-logs",label:"異動紀錄",icon:e(ve),collapsed:a.value},null,8,["icon","collapsed"])):p("",!0)]),_:1},8,["icon","collapsed"])):p("",!0),e(s).isSuperAdmin?(r(),d(A,{key:3,label:"帳號",icon:e(Le),collapsed:a.value},{default:_(()=>[k(f,{to:"/accounts",label:"帳號管理",icon:e(Me),collapsed:a.value},null,8,["icon","collapsed"]),k(f,{to:"/permissions",label:"權限設定",icon:e(Ce),collapsed:a.value},null,8,["icon","collapsed"])]),_:1},8,["icon","collapsed"])):p("",!0)]),l("button",{onClick:h,class:"flex items-center justify-center h-10 border-t border-slate-200 dark:border-[#2a3347] text-slate-400 dark:text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors text-sm cursor-pointer"},[a.value?(r(),d(e(de),{key:1,class:"w-4 h-4"})):(r(),d(e(ce),{key:0,class:"w-4 h-4"}))])],2))}},De={class:"flex items-center justify-between h-14 px-6 flex-shrink-0 bg-white dark:bg-[#161b27] border-b border-slate-200 dark:border-[#2a3347]"},Fe={class:"text-slate-700 dark:text-slate-200 text-sm font-semibold tracking-wide"},Be={class:"flex items-center gap-3"},Re=["title"],Ne={class:"relative","data-login-panel":""},Pe={key:0,class:"flex items-center gap-2"},Ge={class:"flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347]"},Je={class:"text-xs text-slate-600 dark:text-slate-300 font-mono max-w-[140px] truncate"},Ze={key:0,class:"absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg z-50 bg-white dark:bg-[#1a2235] border border-slate-200 dark:border-[#2a3347]"},Xe={class:"flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-[#2a3347]"},Ye={class:"space-y-1"},Ke=["disabled"],Qe={class:"space-y-1"},We=["disabled"],et={key:0,class:"text-xs text-red-500 dark:text-red-400"},tt=["disabled"],at={__name:"AppTopbar",setup(t){const s=Q(),o=R(),a=F(),h={"/students":"學生列表","/groups":"組別列表","/changes/remove-student":"學生更動","/data":"資料管理","/audit-logs":"異動紀錄","/accounts":"帳號管理","/permissions":"權限設定","/about":"關於此系統"},i=B(()=>h[a.path]??"弘光多遊系畢業專題"),c=x(!1),v=x(""),m=x(""),y=x(""),b=x(!1);function G(){c.value=!0,y.value=""}function j(){c.value=!1,v.value="",m.value="",y.value="",b.value=!1}async function J(){if(!v.value||!m.value){y.value="請填寫帳號與密碼";return}b.value=!0,y.value="";try{await o.signIn(v.value,m.value),j()}catch(S){y.value=S.message??"登入失敗，請確認帳號密碼"}finally{b.value=!1}}async function Z(){await o.signOut()}function I(S){c.value&&!S.target.closest("[data-login-panel]")&&j()}return N(()=>document.addEventListener("mousedown",I)),W(()=>document.removeEventListener("mousedown",I)),(S,u)=>{var V;return r(),g("header",De,[l("h1",Fe,M(i.value),1),l("div",Be,[l("button",{onClick:u[0]||(u[0]=L=>e(s).toggle()),class:"w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-cyan-400 hover:text-blue-600 dark:hover:text-cyan-400",title:e(s).isDark?"切換淺色模式":"切換深色模式"},[e(s).isDark?(r(),d(e(Ae),{key:0,class:"w-4 h-4"})):(r(),d(e(xe),{key:1,class:"w-4 h-4"}))],8,Re),l("div",Ne,[e(o).isLoggedIn?(r(),g("div",Pe,[l("div",Ge,[l("span",{class:w(["w-2 h-2 rounded-full",e(o).isEditor?"bg-blue-600 dark:bg-cyan-400":"bg-slate-400 dark:bg-slate-500"])},null,2),l("span",Je,M(((V=e(o).user)==null?void 0:V.email)??e(o).role.toUpperCase()),1)]),l("button",{onClick:Z,class:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] text-slate-500 dark:text-slate-400 hover:border-red-400 dark:hover:border-red-400 hover:text-red-500 dark:hover:text-red-400"},[k(e(fe),{class:"w-3.5 h-3.5"}),u[3]||(u[3]=$(" 登出 ",-1))])])):(r(),g("button",{key:1,onClick:G,class:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-blue-600 dark:bg-cyan-500 text-white hover:bg-blue-700 dark:hover:bg-cyan-400"},[k(e(me),{class:"w-3.5 h-3.5"}),u[4]||(u[4]=$(" 登入 ",-1))])),k(te,{"enter-active-class":"transition-all duration-150 ease-out","enter-from-class":"opacity-0 translate-y-1","enter-to-class":"opacity-100 translate-y-0","leave-active-class":"transition-all duration-100 ease-in","leave-from-class":"opacity-100 translate-y-0","leave-to-class":"opacity-0 translate-y-1"},{default:_(()=>[c.value?(r(),g("div",Ze,[l("div",Xe,[u[5]||(u[5]=l("span",{class:"text-sm font-semibold text-slate-700 dark:text-slate-200"},"登入帳號",-1)),l("button",{onClick:j,class:"w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3347]"},[k(e($e),{class:"w-3.5 h-3.5"})])]),l("form",{onSubmit:ee(J,["prevent"]),class:"p-4 space-y-3"},[l("div",Ye,[u[6]||(u[6]=l("label",{class:"text-xs text-slate-500 dark:text-slate-400"},"帳號",-1)),q(l("input",{"onUpdate:modelValue":u[1]||(u[1]=L=>v.value=L),type:"text",autocomplete:"email",placeholder:"帳號 / 電子郵件",class:"input w-full text-sm",disabled:b.value},null,8,Ke),[[E,v.value]])]),l("div",Qe,[u[7]||(u[7]=l("label",{class:"text-xs text-slate-500 dark:text-slate-400"},"密碼",-1)),q(l("input",{"onUpdate:modelValue":u[2]||(u[2]=L=>m.value=L),type:"password",autocomplete:"current-password",placeholder:"••••••••",class:"input w-full text-sm",disabled:b.value},null,8,We),[[E,m.value]])]),y.value?(r(),g("p",et,M(y.value),1)):p("",!0),l("button",{type:"submit",disabled:b.value,class:"w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-blue-600 dark:bg-cyan-500 text-white hover:bg-blue-700 dark:hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"},[b.value?(r(),d(e(ge),{key:0,class:"w-4 h-4 animate-spin"})):p("",!0),$(" "+M(b.value?"登入中…":"登入"),1)],8,tt)],32)])):p("",!0)]),_:1})])])])}}},st={class:"flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-slate-200"},ot={class:"flex flex-col flex-1 min-w-0"},lt={class:"flex-1 overflow-y-auto p-6"},ct={__name:"AppLayout",setup(t){return(s,o)=>(r(),g("div",st,[k(Te),l("div",ot,[k(at),l("main",lt,[D(s.$slots,"default")])])]))}};export{ne as C,pe as F,ke as G,ve as H,be as L,nt as P,we as R,_e as S,Se as U,$e as X,ct as _,de as a,ge as b,je as c,n as d,ze as u};
