import{c as n}from"./AppLayout-DNSbuR3U.js";import{o as m,m as f,p as s,g as r,d as y,i as u,w as g,H as b,F as w,q as _,l as C,e as z,u as B,f as l,h as E,v as L,a as N,r as p}from"./index-DWaoa25R.js";/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=n("chevron-up",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=n("chevrons-up-down",[["path",{d:"m7 15 5 5 5-5",key:"1hf1tw"}],["path",{d:"m7 9 5-5 5 5",key:"sgt6xg"}]]);/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=n("ellipsis",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]]),D={key:0,class:"absolute right-0 top-full mt-1 min-w-[140px] z-40 rounded-lg shadow-lg bg-white dark:bg-[#1a2235] border border-slate-200 dark:border-[#2a3347] py-1"},T=["onClick","disabled"],U={key:0,class:"px-3 py-2 text-xs text-slate-400 dark:text-slate-600"},P={__name:"TableActionMenu",props:{actions:{type:Array,default:()=>[]}},setup(c){const a=p(!1),o=p(null);function v(e){e.stopPropagation(),a.value=!a.value}function h(e,d){d.stopPropagation(),!e.disabled&&(a.value=!1,e.handler())}function i(e){a.value&&o.value&&!o.value.contains(e.target)&&(a.value=!1)}return m(()=>document.addEventListener("mousedown",i)),f(()=>document.removeEventListener("mousedown",i)),(e,d)=>(s(),r("div",{ref_key:"wrapper",ref:o,class:"relative inline-block"},[y("button",{onClick:v,class:"w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a3347]"},[u(g(V),{class:"w-4 h-4"})]),u(N,{"enter-active-class":"transition-all duration-100 ease-out","enter-from-class":"opacity-0 scale-95","enter-to-class":"opacity-100 scale-100","leave-active-class":"transition-all duration-75 ease-in","leave-from-class":"opacity-100 scale-100","leave-to-class":"opacity-0 scale-95"},{default:b(()=>[a.value?(s(),r("div",D,[(s(!0),r(w,null,_(c.actions,(t,k)=>(s(),r("button",{key:k,onClick:x=>h(t,x),disabled:t.disabled,class:C(["w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors",t.disabled?"text-slate-300 dark:text-slate-600 cursor-not-allowed":t.danger?"text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer":"text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#2a3347] cursor-pointer"])},[t.icon?(s(),z(B(t.icon),{key:0,class:"w-3.5 h-3.5 flex-shrink-0"})):l("",!0),E(" "+L(t.label),1)],10,T))),128)),c.actions.length===0?(s(),r("div",U," 暫無可用操作 ")):l("",!0)])):l("",!0)]),_:1})],512))}};export{F as C,P as _,M as a};
