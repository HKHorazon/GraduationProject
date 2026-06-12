import{k as D,j as ie,r as h,G as ue,p as r,g as k,d as s,e as c,u as Y,l as A,v as C,w as e,f as i,s as Q,y as W,t as pe,H as j,c as ee,x as te,o as ae,i as v,A as he,m as ve,h as I,J as N,I as P,D as q,a as G}from"./index-D84bMrAz.js";/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ye=t=>{for(const l in t)if(l.startsWith("aria-")||l==="role"||l==="title")return!0;return!1};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J=t=>t==="";/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ke=(...t)=>t.filter((l,o,a)=>!!l&&l.trim()!==""&&a.indexOf(l)===o).join(" ").trim();/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(l,o,a)=>a?a.toUpperCase():o.toLowerCase());/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=t=>{const l=be(t);return l.charAt(0).toUpperCase()+l.slice(1)};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var O={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const me=({name:t,iconNode:l,absoluteStrokeWidth:o,"absolute-stroke-width":a,strokeWidth:y,"stroke-width":p,size:u=O.width,color:x=O.stroke,...w},{slots:b})=>D("svg",{...O,...w,width:u,height:u,stroke:x,"stroke-width":J(o)||J(a)||o===!0||a===!0?Number(y||p||O["stroke-width"])*24/Number(u):y||p||O["stroke-width"],class:ke("lucide",w.class,...t?[`lucide-${Z(xe(t))}-icon`,`lucide-${Z(t)}`]:["lucide-icon"]),...!b.default&&!ye(w)&&{"aria-hidden":"true"}},[...l.map(m=>D(...m)),...b.default?[b.default()]:[]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=(t,l)=>(o,{slots:a,attrs:y})=>D(me,{...y,...o,iconNode:l,name:t},a);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=d("chevron-down",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=d("chevron-left",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge=d("chevron-right",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const we=d("database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=d("file-input",[["path",{d:"M4 11V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1",key:"1q9hii"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M2 15h10",key:"jfw4w8"}],["path",{d:"m9 18 3-3-3-3",key:"112psh"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Me=d("file-output",[["path",{d:"M4.226 20.925A2 2 0 0 0 6 22h12a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v3.127",key:"wfxp4w"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"m5 11-3 3",key:"1dgrs4"}],["path",{d:"m5 17-3-3h10",key:"1mvvaf"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ce=d("file-stack",[["path",{d:"M11 21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1",key:"likhh7"}],["path",{d:"M16 16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1",key:"17ky3x"}],["path",{d:"M21 6a2 2 0 0 0-.586-1.414l-2-2A2 2 0 0 0 17 2h-3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1z",key:"1hyeo0"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=d("folder-cog",[["path",{d:"M10.3 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.98a2 2 0 0 1 1.69.9l.66 1.2A2 2 0 0 0 12 6h8a2 2 0 0 1 2 2v3.3",key:"128dxu"}],["path",{d:"m14.305 19.53.923-.382",key:"3m78fa"}],["path",{d:"m15.228 16.852-.923-.383",key:"npixar"}],["path",{d:"m16.852 15.228-.383-.923",key:"5xggr7"}],["path",{d:"m16.852 20.772-.383.924",key:"dpfhf9"}],["path",{d:"m19.148 15.228.383-.923",key:"1reyyz"}],["path",{d:"m19.53 21.696-.382-.924",key:"1goivc"}],["path",{d:"m20.772 16.852.924-.383",key:"htqkph"}],["path",{d:"m20.772 19.148.924.383",key:"9w9pjp"}],["circle",{cx:"18",cy:"18",r:"3",key:"1xkwt0"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Se=d("folder-open",[["path",{d:"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",key:"usdka0"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const je=d("graduation-cap",[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le=d("history",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=d("key-round",[["path",{d:"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",key:"1s6t7t"}],["circle",{cx:"16.5",cy:"7.5",r:".5",fill:"currentColor",key:"w0ekpg"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=d("layout-list",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}],["path",{d:"M14 4h7",key:"3xa0d5"}],["path",{d:"M14 9h7",key:"1icrd9"}],["path",{d:"M14 15h7",key:"1mj8o2"}],["path",{d:"M14 20h7",key:"11slyb"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=d("loader-circle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He=d("log-in",[["path",{d:"m10 17 5-5-5-5",key:"1bsop3"}],["path",{d:"M15 12H3",key:"6jk70r"}],["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ze=d("log-out",[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ie=d("moon",[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pe=d("refresh-cw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qe=d("search",[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe=d("settings",[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ue=d("shield-check",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ee=d("sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Te=d("user-minus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const De=d("user",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe=d("users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X=d("x",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),Vt=[{key:"students",label:"學生列表",route:"/students"},{key:"groups",label:"組別列表",route:"/groups"},{key:"remove-student",label:"學生更動",route:"/changes/remove-student"},{key:"group-change",label:"組別異動",route:"/changes/group-change"},{key:"documents",label:"文件輸入",route:"/documents"},{key:"documents-export",label:"文件輸出",route:"/documents/export"},{key:"data",label:"資料管理",route:"/data"},{key:"audit-logs",label:"異動紀錄",route:"/audit-logs"}],le="page-permissions",F={students:{viewer:!0,editor:!0},groups:{viewer:!0,editor:!0},"remove-student":{viewer:!1,editor:!0},"group-change":{viewer:!1,editor:!0},documents:{viewer:!1,editor:!0},"documents-export":{viewer:!1,editor:!0},data:{viewer:!1,editor:!0},"audit-logs":{viewer:!1,editor:!0}};function Re(){try{const t=localStorage.getItem(le);if(t)return{...structuredClone(F),...JSON.parse(t)}}catch{}return null}const Be=ie("permissions",()=>{const t=h(Re()??structuredClone(F));function l(){localStorage.setItem(le,JSON.stringify(t.value))}function o(p,u){var x;return u==="super_admin"?!0:((x=t.value[p])==null?void 0:x[u])??!1}function a(p,u){u!=="super_admin"&&(t.value[p][u]=!t.value[p][u],l())}function y(){t.value=structuredClone(F),l()}return{perms:t,canAccess:o,toggle:a,reset:y}}),Ne={class:"mb-1"},Ge={class:"pl-2 mt-0.5 flex flex-col gap-0.5"},U={__name:"SidebarGroup",props:{label:{type:String,required:!0},icon:{type:[Object,Function],required:!0},collapsed:{type:Boolean,default:!1}},setup(t){const o=`sidebar-group:${t.label}`,a=h(localStorage.getItem(o)!=="false");ue(a,p=>localStorage.setItem(o,p));function y(){a.value=!a.value}return(p,u)=>(r(),k("div",Ne,[s("button",{onClick:y,class:"w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a3347]/30 cursor-pointer"},[(r(),c(Y(t.icon),{class:"w-4 h-4 flex-shrink-0"})),s("span",{class:A(["flex-1 text-left transition-all duration-150",t.collapsed?"opacity-0 w-0 overflow-hidden":"opacity-100"])},C(t.label),3),t.collapsed?i("",!0):(r(),c(e(se),{key:0,class:A(["w-3 h-3 text-slate-400 transition-transform duration-200",a.value?"rotate-0":"-rotate-90"])},null,8,["class"]))]),s("div",{class:A(["overflow-hidden transition-all duration-200",a.value||t.collapsed?"max-h-96":"max-h-0"])},[s("div",Ge,[Q(p.$slots,"default")])],2)]))}},Je={key:0,class:"absolute left-full ml-2 px-2 py-1 bg-white dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] rounded text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg"},Ze={key:1,class:"absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-600 dark:bg-cyan-400 rounded-full"},g={__name:"SidebarItem",props:{to:{type:String,required:!0},label:{type:String,required:!0},icon:{type:[Object,Function],required:!0},collapsed:{type:Boolean,default:!1}},setup(t){const l=t,o=W(),a=ee(()=>o.path===l.to);return(y,p)=>{const u=pe("RouterLink");return r(),c(u,{to:t.to,class:A(["flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group relative cursor-pointer",a.value?"bg-blue-50 dark:bg-cyan-900/20 text-blue-700 dark:text-cyan-400 font-semibold border border-blue-200 dark:border-cyan-800/50":"text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2a3347]/50"])},{default:j(()=>[(r(),c(Y(t.icon),{class:"w-4 h-4 flex-shrink-0"})),s("span",{class:A(["truncate transition-all duration-150",t.collapsed?"opacity-0 w-0 overflow-hidden":"opacity-100"])},C(t.label),3),t.collapsed?(r(),k("span",Je,C(t.label),1)):i("",!0),a.value?(r(),k("span",Ze)):i("",!0)]),_:1},8,["to","class"])}}},Ke={class:"flex items-center gap-3 px-3 h-14 border-b border-slate-200 dark:border-[#2a3347]"},Xe={class:"flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1"},Ye={__name:"AppSidebar",setup(t){const l=te(),o=Be(),a=h(!1);ae(()=>{const p=localStorage.getItem("sidebar-collapsed");p!==null&&(a.value=p==="true")});function y(){a.value=!a.value,localStorage.setItem("sidebar-collapsed",a.value)}return(p,u)=>(r(),k("aside",{class:A(["flex flex-col border-r transition-all duration-150 flex-shrink-0 bg-white dark:bg-[#161b27] border-slate-200 dark:border-[#2a3347]",a.value?"w-14":"w-56"])},[s("div",Ke,[v(e(je),{class:"w-5 h-5 text-blue-600 dark:text-cyan-400 flex-shrink-0"}),s("span",{class:A(["font-bold text-blue-600 dark:text-cyan-400 text-sm tracking-wide transition-all duration-150",a.value?"opacity-0 w-0 overflow-hidden":"opacity-100"])},"畢業專題",2)]),s("nav",Xe,[v(U,{label:"瀏覽",icon:e(qe),collapsed:a.value},{default:j(()=>[e(o).canAccess("students",e(l).role)?(r(),c(g,{key:0,to:"/students",label:"學生列表",icon:e(Fe),collapsed:a.value},null,8,["icon","collapsed"])):i("",!0),e(o).canAccess("groups",e(l).role)?(r(),c(g,{key:1,to:"/groups",label:"組別列表",icon:e(Ve),collapsed:a.value},null,8,["icon","collapsed"])):i("",!0)]),_:1},8,["icon","collapsed"]),e(o).canAccess("remove-student",e(l).role)||e(o).canAccess("group-change",e(l).role)?(r(),c(U,{key:0,label:"基本操作",icon:e(Pe),collapsed:a.value},{default:j(()=>[e(o).canAccess("remove-student",e(l).role)?(r(),c(g,{key:0,to:"/changes/remove-student",label:"學生更動",icon:e(Te),collapsed:a.value},null,8,["icon","collapsed"])):i("",!0),e(o).canAccess("group-change",e(l).role)?(r(),c(g,{key:1,to:"/changes/group-change",label:"組別異動",icon:e(Ae),collapsed:a.value},null,8,["icon","collapsed"])):i("",!0)]),_:1},8,["icon","collapsed"])):i("",!0),e(o).canAccess("documents",e(l).role)||e(o).canAccess("documents-export",e(l).role)?(r(),c(U,{key:1,label:"文件",icon:e(Ce),collapsed:a.value},{default:j(()=>[e(o).canAccess("documents",e(l).role)?(r(),c(g,{key:0,to:"/documents",label:"文件輸入",icon:e(_e),collapsed:a.value},null,8,["icon","collapsed"])):i("",!0),e(o).canAccess("documents-export",e(l).role)?(r(),c(g,{key:1,to:"/documents/export",label:"文件輸出",icon:e(Me),collapsed:a.value},null,8,["icon","collapsed"])):i("",!0)]),_:1},8,["icon","collapsed"])):i("",!0),e(o).canAccess("data",e(l).role)||e(o).canAccess("audit-logs",e(l).role)?(r(),c(U,{key:2,label:"資料",icon:e(we),collapsed:a.value},{default:j(()=>[e(o).canAccess("data",e(l).role)?(r(),c(g,{key:0,to:"/data",label:"資料管理",icon:e(Se),collapsed:a.value},null,8,["icon","collapsed"])):i("",!0),e(o).canAccess("audit-logs",e(l).role)?(r(),c(g,{key:1,to:"/audit-logs",label:"異動紀錄",icon:e(Le),collapsed:a.value},null,8,["icon","collapsed"])):i("",!0)]),_:1},8,["icon","collapsed"])):i("",!0),e(l).isSuperAdmin?(r(),c(U,{key:3,label:"帳號",icon:e(De),collapsed:a.value},{default:j(()=>[v(g,{to:"/accounts",label:"帳號管理",icon:e(Oe),collapsed:a.value},null,8,["icon","collapsed"]),v(g,{to:"/permissions",label:"權限設定",icon:e(Ue),collapsed:a.value},null,8,["icon","collapsed"])]),_:1},8,["icon","collapsed"])):i("",!0)]),s("button",{onClick:y,class:"flex items-center justify-center h-10 border-t border-slate-200 dark:border-[#2a3347] text-slate-400 dark:text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors text-sm cursor-pointer"},[a.value?(r(),c(e(ge),{key:1,class:"w-4 h-4"})):(r(),c(e(fe),{key:0,class:"w-4 h-4"}))])],2))}},Qe={class:"flex items-center justify-between h-14 px-6 flex-shrink-0 bg-white dark:bg-[#161b27] border-b border-slate-200 dark:border-[#2a3347]"},We={class:"text-slate-700 dark:text-slate-200 text-sm font-semibold tracking-wide"},et={class:"flex items-center gap-3"},tt=["title"],at={class:"relative","data-login-panel":""},st={key:0,class:"flex items-center gap-2","data-pwd-panel":""},lt={class:"relative"},ot={class:"text-xs text-slate-600 dark:text-slate-300 font-mono max-w-[140px] truncate"},rt={key:0,class:"absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg z-50 bg-white dark:bg-[#1a2235] border border-slate-200 dark:border-[#2a3347]"},nt={class:"flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-[#2a3347]"},dt={class:"text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"},ct={class:"space-y-1"},it=["disabled"],ut={class:"space-y-1"},pt=["disabled"],ht={class:"space-y-1"},vt=["disabled"],yt={key:0,class:"text-xs text-red-500 dark:text-red-400"},kt={key:1,class:"text-xs text-emerald-600 dark:text-emerald-400"},bt=["disabled"],xt={key:0,class:"absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg z-50 bg-white dark:bg-[#1a2235] border border-slate-200 dark:border-[#2a3347]"},mt={class:"flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-[#2a3347]"},ft={class:"space-y-1"},gt=["disabled"],wt={class:"space-y-1"},_t=["disabled"],Mt={key:0,class:"text-xs text-red-500 dark:text-red-400"},Ct=["disabled"],At={__name:"AppTopbar",setup(t){const l=he(),o=te(),a=W(),y={"/students":"學生列表","/groups":"組別列表","/changes/remove-student":"學生更動","/changes/group-change":"組別異動","/documents":"文件輸入","/documents/export":"文件輸出","/data":"資料管理","/audit-logs":"異動紀錄","/accounts":"帳號管理","/permissions":"權限設定","/about":"關於此系統"},p=ee(()=>y[a.path]??"弘光多遊系畢業專題"),u=h(!1),x=h(""),w=h(""),b=h(""),m=h(!1);function oe(){u.value=!0,b.value=""}function E(){u.value=!1,x.value="",w.value="",b.value="",m.value=!1}async function re(){if(!x.value||!w.value){b.value="請填寫帳號與密碼";return}m.value=!0,b.value="";try{await o.signIn(x.value,w.value),E()}catch(V){b.value=V.message??"登入失敗，請確認帳號密碼"}finally{m.value=!1}}async function ne(){await o.signOut()}const L=h(!1),H=h(""),$=h(""),z=h(""),_=h(""),S=h(!1),M=h(!1);function de(){L.value=!L.value,L.value&&(_.value="",S.value=!1)}function T(){L.value=!1,H.value="",$.value="",z.value="",_.value="",S.value=!1,M.value=!1}async function ce(){if(!H.value||!$.value||!z.value){_.value="請填寫所有欄位";return}if($.value.length<6){_.value="新密碼至少 6 個字元";return}if($.value!==z.value){_.value="兩次輸入的新密碼不一致";return}M.value=!0,_.value="";try{await o.changePassword(H.value,$.value),S.value=!0,setTimeout(T,1200)}catch(V){_.value=V.message??"密碼變更失敗"}finally{M.value=!1}}function R(V){u.value&&!V.target.closest("[data-login-panel]")&&E(),L.value&&!V.target.closest("[data-pwd-panel]")&&T()}return ae(()=>document.addEventListener("mousedown",R)),ve(()=>document.removeEventListener("mousedown",R)),(V,n)=>{var B;return r(),k("header",Qe,[s("h1",We,C(p.value),1),s("div",et,[s("button",{onClick:n[0]||(n[0]=f=>e(l).toggle()),class:"w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-cyan-400 hover:text-blue-600 dark:hover:text-cyan-400",title:e(l).isDark?"切換淺色模式":"切換深色模式"},[e(l).isDark?(r(),c(e(Ee),{key:0,class:"w-4 h-4"})):(r(),c(e(Ie),{key:1,class:"w-4 h-4"}))],8,tt),s("div",at,[e(o).isLoggedIn?(r(),k("div",st,[s("div",lt,[s("button",{onClick:de,class:"flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] hover:border-blue-400 dark:hover:border-cyan-400",title:"修改密碼"},[s("span",{class:A(["w-2 h-2 rounded-full",e(o).isEditor?"bg-blue-600 dark:bg-cyan-400":"bg-slate-400 dark:bg-slate-500"])},null,2),s("span",ot,C(((B=e(o).user)==null?void 0:B.username)??e(o).role.toUpperCase()),1),v(e(se),{class:A(["w-3 h-3 text-slate-400 transition-transform",L.value?"rotate-180":""])},null,8,["class"])]),v(G,{"enter-active-class":"transition-all duration-150 ease-out","enter-from-class":"opacity-0 translate-y-1","enter-to-class":"opacity-100 translate-y-0","leave-active-class":"transition-all duration-100 ease-in","leave-from-class":"opacity-100 translate-y-0","leave-to-class":"opacity-0 translate-y-1"},{default:j(()=>[L.value?(r(),k("div",rt,[s("div",nt,[s("span",dt,[v(e($e),{class:"w-4 h-4 text-blue-600 dark:text-cyan-400"}),n[6]||(n[6]=I(" 修改密碼 ",-1))]),s("button",{onClick:T,class:"w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3347]"},[v(e(X),{class:"w-3.5 h-3.5"})])]),s("form",{onSubmit:N(ce,["prevent"]),class:"p-4 space-y-3"},[s("div",ct,[n[7]||(n[7]=s("label",{class:"text-xs text-slate-500 dark:text-slate-400"},"舊密碼",-1)),P(s("input",{"onUpdate:modelValue":n[1]||(n[1]=f=>H.value=f),type:"password",autocomplete:"current-password",placeholder:"••••••••",class:"input w-full text-sm",disabled:M.value||S.value},null,8,it),[[q,H.value]])]),s("div",ut,[n[8]||(n[8]=s("label",{class:"text-xs text-slate-500 dark:text-slate-400"},"新密碼（至少 6 個字元）",-1)),P(s("input",{"onUpdate:modelValue":n[2]||(n[2]=f=>$.value=f),type:"password",autocomplete:"new-password",placeholder:"••••••••",class:"input w-full text-sm",disabled:M.value||S.value},null,8,pt),[[q,$.value]])]),s("div",ht,[n[9]||(n[9]=s("label",{class:"text-xs text-slate-500 dark:text-slate-400"},"確認新密碼",-1)),P(s("input",{"onUpdate:modelValue":n[3]||(n[3]=f=>z.value=f),type:"password",autocomplete:"new-password",placeholder:"••••••••",class:"input w-full text-sm",disabled:M.value||S.value},null,8,vt),[[q,z.value]])]),_.value?(r(),k("p",yt,C(_.value),1)):i("",!0),S.value?(r(),k("p",kt,"密碼已更新")):i("",!0),s("button",{type:"submit",disabled:M.value||S.value,class:"w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-blue-600 dark:bg-cyan-500 text-white hover:bg-blue-700 dark:hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"},[M.value?(r(),c(e(K),{key:0,class:"w-4 h-4 animate-spin"})):i("",!0),I(" "+C(M.value?"更新中…":"更新密碼"),1)],8,bt)],32)])):i("",!0)]),_:1})]),s("button",{onClick:ne,class:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-slate-100 dark:bg-[#1e2535] border border-slate-200 dark:border-[#2a3347] text-slate-500 dark:text-slate-400 hover:border-red-400 dark:hover:border-red-400 hover:text-red-500 dark:hover:text-red-400"},[v(e(ze),{class:"w-3.5 h-3.5"}),n[10]||(n[10]=I(" 登出 ",-1))])])):(r(),k("button",{key:1,onClick:oe,class:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-blue-600 dark:bg-cyan-500 text-white hover:bg-blue-700 dark:hover:bg-cyan-400"},[v(e(He),{class:"w-3.5 h-3.5"}),n[11]||(n[11]=I(" 登入 ",-1))])),v(G,{"enter-active-class":"transition-all duration-150 ease-out","enter-from-class":"opacity-0 translate-y-1","enter-to-class":"opacity-100 translate-y-0","leave-active-class":"transition-all duration-100 ease-in","leave-from-class":"opacity-100 translate-y-0","leave-to-class":"opacity-0 translate-y-1"},{default:j(()=>[u.value?(r(),k("div",xt,[s("div",mt,[n[12]||(n[12]=s("span",{class:"text-sm font-semibold text-slate-700 dark:text-slate-200"},"登入帳號",-1)),s("button",{onClick:E,class:"w-6 h-6 flex items-center justify-center rounded-md transition-colors cursor-pointer text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3347]"},[v(e(X),{class:"w-3.5 h-3.5"})])]),s("form",{onSubmit:N(re,["prevent"]),class:"p-4 space-y-3"},[s("div",ft,[n[13]||(n[13]=s("label",{class:"text-xs text-slate-500 dark:text-slate-400"},"帳號",-1)),P(s("input",{"onUpdate:modelValue":n[4]||(n[4]=f=>x.value=f),type:"text",autocomplete:"email",placeholder:"帳號 / 電子郵件",class:"input w-full text-sm",disabled:m.value},null,8,gt),[[q,x.value]])]),s("div",wt,[n[14]||(n[14]=s("label",{class:"text-xs text-slate-500 dark:text-slate-400"},"密碼",-1)),P(s("input",{"onUpdate:modelValue":n[5]||(n[5]=f=>w.value=f),type:"password",autocomplete:"current-password",placeholder:"••••••••",class:"input w-full text-sm",disabled:m.value},null,8,_t),[[q,w.value]])]),b.value?(r(),k("p",Mt,C(b.value),1)):i("",!0),s("button",{type:"submit",disabled:m.value,class:"w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-blue-600 dark:bg-cyan-500 text-white hover:bg-blue-700 dark:hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"},[m.value?(r(),c(e(K),{key:0,class:"w-4 h-4 animate-spin"})):i("",!0),I(" "+C(m.value?"登入中…":"登入"),1)],8,Ct)],32)])):i("",!0)]),_:1})])])])}}},St={class:"flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-slate-200"},jt={class:"flex flex-col flex-1 min-w-0"},Lt={class:"flex-1 overflow-y-auto p-6"},Ht={__name:"AppLayout",setup(t){return(l,o)=>(r(),k("div",St,[v(Ye),s("div",jt,[v(At),s("main",Lt,[Q(l.$slots,"default")])])]))}};export{se as C,je as G,Le as H,Ve as L,Vt as P,Pe as R,qe as S,Te as U,X,Ht as _,fe as a,ge as b,K as c,Fe as d,d as e,Be as u};
