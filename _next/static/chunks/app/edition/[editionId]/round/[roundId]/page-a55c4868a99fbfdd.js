(globalThis.webpackChunk_N_E=globalThis.webpackChunk_N_E||[]).push([[1820],{61571:(e,t,n)=>{Promise.resolve().then(n.bind(n,55840)),Promise.resolve().then(n.t.bind(n,72972,23)),Promise.resolve().then(n.bind(n,62710))},27648:(e,t,n)=>{"use strict";n.d(t,{default:()=>l.a});var r=n(72972),l=n.n(r)},55775:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"default",{enumerable:!0,get:function(){return a}});let r=n(47043);n(57437),n(2265);let l=r._(n(15602));function a(e,t){var n;let r={loading:e=>{let{error:t,isLoading:n,pastDelay:r}=e;return null}};"function"==typeof e&&(r.loader=e);let a={...r,...t};return(0,l.default)({...a,modules:null==(n=a.loadableGenerated)?void 0:n.modules})}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},81523:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"BailoutToCSR",{enumerable:!0,get:function(){return l}});let r=n(18993);function l(e){let{reason:t,children:n}=e;if("undefined"==typeof window)throw new r.BailoutToCSRError(t);return n}},15602:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"default",{enumerable:!0,get:function(){return o}});let r=n(57437),l=n(2265),a=n(81523),i=n(70049);function s(e){return{default:e&&"default"in e?e.default:e}}let d={loader:()=>Promise.resolve(s(()=>null)),loading:null,ssr:!0},o=function(e){let t={...d,...e},n=(0,l.lazy)(()=>t.loader().then(s)),o=t.loading;function c(e){let s=o?(0,r.jsx)(o,{isLoading:!0,pastDelay:!0,error:null}):null,d=t.ssr?(0,r.jsxs)(r.Fragment,{children:["undefined"==typeof window?(0,r.jsx)(i.PreloadCss,{moduleIds:t.modules}):null,(0,r.jsx)(n,{...e})]}):(0,r.jsx)(a.BailoutToCSR,{reason:"next/dynamic",children:(0,r.jsx)(n,{...e})});return(0,r.jsx)(l.Suspense,{fallback:s,children:d})}return c.displayName="LoadableComponent",c}},70049:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"PreloadCss",{enumerable:!0,get:function(){return a}});let r=n(57437),l=n(20544);function a(e){let{moduleIds:t}=e;if("undefined"!=typeof window)return null;let n=(0,l.getExpectedRequestStore)("next/dynamic css"),a=[];if(n.reactLoadableManifest&&t){let e=n.reactLoadableManifest;for(let n of t){if(!e[n])continue;let t=e[n].files.filter(e=>e.endsWith(".css"));a.push(...t)}}return 0===a.length?null:(0,r.jsx)(r.Fragment,{children:a.map(e=>(0,r.jsx)("link",{precedence:"dynamic",rel:"stylesheet",href:n.assetPrefix+"/_next/"+encodeURI(e),as:"style"},e))})}},62710:(e,t,n)=>{"use strict";n.d(t,{RoundTable:()=>c});var r=n(57437),l=n(27648),a=n(2265),i=n(50742),s=n(2139),d=n(10044);let o=(0,a.createContext)(void 0);function c(e){let{round:t}=e;return(0,r.jsx)(o.Provider,{value:t,children:(0,r.jsx)(d.i,{data:t.ranking,header:u,row:m,className:"grid-cols-[repeat(5,auto)_repeat(var(--cols),4rem)_4.5rem]"})})}function u(){let e=(0,a.useContext)(o);return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("div",{children:"Rank"}),(0,r.jsx)("div",{children:"Reg. rank"}),(0,r.jsx)("div",{children:"Teams"}),(0,r.jsx)("div",{children:"Institute"}),(0,r.jsx)("div",{children:"Region"}),(0,r.jsx)("div",{children:"Total"}),e.tasks.map(t=>(0,r.jsx)("div",{children:(0,r.jsx)(l.default,{href:"/edition/".concat(e.ed_num,"/round/").concat(e.id,"/").concat(t.name),className:"link block w-full truncate",children:t.name})},t.name))]})}function m(e){let{item:t}=e,n=(0,a.useContext)(o);return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("div",{children:t.rank}),(0,r.jsx)("div",{children:t.rank_reg}),(0,r.jsx)("div",{className:"min-w-32 text-wrap break-words text-sm",children:(0,r.jsx)(l.default,{href:"/edition/".concat(n.ed_num,"/team/").concat(t.team.id),className:"link",children:t.team.name})}),(0,r.jsx)("div",{className:"min-w-48 text-wrap text-sm",children:(0,r.jsx)(l.default,{href:"/region/".concat(t.team.region,"/").concat(t.team.inst_id),className:"link",children:t.team.institute})}),(0,r.jsx)("div",{children:(0,r.jsx)(l.default,{href:"/region/".concat(t.team.region),children:(0,r.jsx)(i.Y,{id:t.team.region,name:t.team.fullregion,className:"inline-block"})})}),(0,r.jsx)("div",{children:t.total}),t.scores.map((e,t)=>(0,r.jsx)(s.B,{score:e,maxScore:100,className:"min-w-16"},t))]})}},50742:(e,t,n)=>{"use strict";n.d(t,{Y:()=>a});var r=n(57437),l=n(61994);function a(e){let{id:t,name:n,className:a}=e;return(0,r.jsx)("img",{src:"/images/regions/".concat(t.toUpperCase(),".svg"),alt:"Flag of ".concat(n),className:(0,l.Z)("size-8 object-contain",a)})}},2139:(e,t,n)=>{"use strict";n.d(t,{B:()=>a});var r=n(57437),l=n(61994);function a(e){let{score:t,maxScore:n,className:a}=e;if(null===t||null===n)return t;let i=Math.floor(t/n*100);return(0,r.jsx)("span",{className:(0,l.Z)("block rounded-box text-black border border-black/10",a,{"font-bold":100===i,"bg-emerald-600":i>90,"bg-emerald-500":i>75&&i<=90,"bg-emerald-400":i>60&&i<=75,"bg-emerald-300":i>45&&i<=60,"bg-emerald-200":i>30&&i<=45,"bg-emerald-100":i>15&&i<=30,"bg-emerald-50":i<=15}),children:t})}},10044:(e,t,n)=>{"use strict";n.d(t,{i:()=>u});var r=n(57437),l=n(55775),a=n.n(l),i=n(61994),s=n(98328),d=n.n(s);let o=a()(()=>Promise.all([n.e(9745),n.e(5575)]).then(n.bind(n,5575)),{loadableGenerated:{webpack:()=>[5575]},ssr:!1});function c(e){let{data:t,header:n,row:l,className:a}=e;return(0,r.jsx)("div",{className:d().outerContainer,children:(0,r.jsx)("div",{className:(0,i.Z)(d().innerContainer,"w-min"),children:(0,r.jsx)("div",{className:(0,i.Z)(d().scroller,"w-min",a),children:(0,r.jsxs)("div",{className:"w-min",children:[(0,r.jsx)("div",{children:(0,r.jsx)(n,{})}),(0,r.jsx)("div",{className:d().list,children:t.map((e,t)=>(0,r.jsx)("div",{className:d().item,children:(0,r.jsx)(l,{item:e})},t))}),(0,r.jsx)("div",{})]})})})})}function u(e){return e.data.length>=20?(0,r.jsx)(o,{...e}):(0,r.jsx)(c,{...e})}},98328:e=>{e.exports={outerContainer:"table_outerContainer__mAPsd",innerContainer:"table_innerContainer__pk0tB",scroller:"table_scroller__Qv6IK",list:"table_list__XtHL_",item:"table_item__KEkbM"}}},e=>{var t=t=>e(e.s=t);e.O(0,[3,5840,2972,2971,2117,1744],()=>t(61571)),_N_E=e.O()}]);
//# sourceMappingURL=page-a55c4868a99fbfdd.js.map