(globalThis.webpackChunk_N_E=globalThis.webpackChunk_N_E||[]).push([[3185],{44904:(e,t,n)=>{Promise.resolve().then(n.bind(n,14888)),Promise.resolve().then(n.bind(n,98087)),Promise.resolve().then(n.bind(n,47239)),Promise.resolve().then(n.bind(n,55840)),Promise.resolve().then(n.t.bind(n,72972,23)),Promise.resolve().then(n.t.bind(n,88003,23)),Promise.resolve().then(n.t.bind(n,2778,23)),Promise.resolve().then(n.bind(n,67462)),Promise.resolve().then(n.bind(n,65433))},47239:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});let r=n(57437),a=n(2265);t.default=function(e){let{html:t,height:n=null,width:i=null,children:o,dataNtpc:l=""}=e;return(0,a.useEffect)(()=>{l&&performance.mark("mark_feature_usage",{detail:{feature:"next-third-parties-".concat(l)}})},[l]),(0,r.jsxs)(r.Fragment,{children:[o,t?(0,r.jsx)("div",{style:{height:null!=n?"".concat(n,"px"):"auto",width:null!=i?"".concat(i,"px"):"auto"},"data-ntpc":l,dangerouslySetInnerHTML:{__html:t}}):null]})}},14888:(e,t,n)=>{"use strict";let r;Object.defineProperty(t,"__esModule",{value:!0}),t.sendGAEvent=t.GoogleAnalytics=void 0;let a=n(57437),i=n(2265),o=function(e){return e&&e.__esModule?e:{default:e}}(n(48667));t.GoogleAnalytics=function(e){let{gaId:t,dataLayerName:n="dataLayer"}=e;return void 0===r&&(r=n),(0,i.useEffect)(()=>{performance.mark("mark_feature_usage",{detail:{feature:"next-third-parties-ga"}})},[]),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(o.default,{id:"_next-ga-init",dangerouslySetInnerHTML:{__html:"\n          window['".concat(n,"'] = window['").concat(n,"'] || [];\n          function gtag(){window['").concat(n,"'].push(arguments);}\n          gtag('js', new Date());\n\n          gtag('config', '").concat(t,"');")}}),(0,a.jsx)(o.default,{id:"_next-ga",src:"https://www.googletagmanager.com/gtag/js?id=".concat(t)})]})},t.sendGAEvent=function(){for(var e=arguments.length,t=Array(e),n=0;n<e;n++)t[n]=arguments[n];if(void 0===r){console.warn("@next/third-parties: GA has not been initialized");return}window[r]?window[r].push(arguments):console.warn("@next/third-parties: GA dataLayer ".concat(r," does not exist"))}},98087:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.sendGTMEvent=t.GoogleTagManager=void 0;let r=n(57437),a=n(2265),i=function(e){return e&&e.__esModule?e:{default:e}}(n(48667)),o="dataLayer";t.GoogleTagManager=function(e){let{gtmId:t,dataLayerName:n="dataLayer",auth:l,preview:s,dataLayer:u}=e;o=n;let d="dataLayer"!==n?"&l=".concat(n):"";return(0,a.useEffect)(()=>{performance.mark("mark_feature_usage",{detail:{feature:"next-third-parties-gtm"}})},[]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(i.default,{id:"_next-gtm-init",dangerouslySetInnerHTML:{__html:"\n      (function(w,l){\n        w[l]=w[l]||[];\n        w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});\n        ".concat(u?"w[l].push(".concat(JSON.stringify(u),")"):"","\n      })(window,'").concat(n,"');")}}),(0,r.jsx)(i.default,{id:"_next-gtm","data-ntpc":"GTM",src:"https://www.googletagmanager.com/gtm.js?id=".concat(t).concat(d).concat(l?"&gtm_auth=".concat(l):"").concat(s?"&gtm_preview=".concat(s,"&gtm_cookies_win=x"):"")})]})},t.sendGTMEvent=(e,t)=>{let n=t||o;window[n]=window[n]||[],window[n].push(e)}},48667:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a.a});var r=n(88003),a=n.n(r),i={};for(let e in r)"default"!==e&&(i[e]=()=>r[e]);n.d(t,i)},8221:(e,t)=>{"use strict";let n;Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var n in t)Object.defineProperty(e,n,{enumerable:!0,get:t[n]})}(t,{DOMAttributeNames:function(){return r},default:function(){return o},isEqualNode:function(){return i}});let r={acceptCharset:"accept-charset",className:"class",htmlFor:"for",httpEquiv:"http-equiv",noModule:"noModule"};function a(e){let{type:t,props:n}=e,a=document.createElement(t);for(let e in n){if(!n.hasOwnProperty(e)||"children"===e||"dangerouslySetInnerHTML"===e||void 0===n[e])continue;let i=r[e]||e.toLowerCase();"script"===t&&("async"===i||"defer"===i||"noModule"===i)?a[i]=!!n[e]:a.setAttribute(i,n[e])}let{children:i,dangerouslySetInnerHTML:o}=n;return o?a.innerHTML=o.__html||"":i&&(a.textContent="string"==typeof i?i:Array.isArray(i)?i.join(""):""),a}function i(e,t){if(e instanceof HTMLElement&&t instanceof HTMLElement){let n=t.getAttribute("nonce");if(n&&!e.getAttribute("nonce")){let r=t.cloneNode(!0);return r.setAttribute("nonce",""),r.nonce=n,n===e.nonce&&e.isEqualNode(r)}}return e.isEqualNode(t)}function o(){return{mountedInstances:new Set,updateHead:e=>{let t={};e.forEach(e=>{if("link"===e.type&&e.props["data-optimized-fonts"]){if(document.querySelector('style[data-href="'+e.props["data-href"]+'"]'))return;e.props.href=e.props["data-href"],e.props["data-href"]=void 0}let n=t[e.type]||[];n.push(e),t[e.type]=n});let r=t.title?t.title[0]:null,a="";if(r){let{children:e}=r.props;a="string"==typeof e?e:Array.isArray(e)?e.join(""):""}a!==document.title&&(document.title=a),["meta","base","link","style","script"].forEach(e=>{n(e,t[e]||[])})}}}n=(e,t)=>{let n=document.getElementsByTagName("head")[0],r=n.querySelector("meta[name=next-head-count]"),o=Number(r.content),l=[];for(let t=0,n=r.previousElementSibling;t<o;t++,n=(null==n?void 0:n.previousElementSibling)||null){var s;(null==n?void 0:null==(s=n.tagName)?void 0:s.toLowerCase())===e&&l.push(n)}let u=t.map(a).filter(e=>{for(let t=0,n=l.length;t<n;t++)if(i(l[t],e))return l.splice(t,1),!1;return!0});l.forEach(e=>{var t;return null==(t=e.parentNode)?void 0:t.removeChild(e)}),u.forEach(e=>n.insertBefore(e,r)),r.content=(o-l.length+u.length).toString()},("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},88003:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var n in t)Object.defineProperty(e,n,{enumerable:!0,get:t[n]})}(t,{default:function(){return v},handleClientScriptLoad:function(){return m},initScriptLoader:function(){return y}});let r=n(47043),a=n(53099),i=n(57437),o=r._(n(54887)),l=a._(n(2265)),s=n(48701),u=n(8221),d=n(63515),c=new Map,f=new Set,g=["onLoad","onReady","dangerouslySetInnerHTML","children","onError","strategy","stylesheets"],p=e=>{if(o.default.preinit){e.forEach(e=>{o.default.preinit(e,{as:"style"})});return}if("undefined"!=typeof window){let t=document.head;e.forEach(e=>{let n=document.createElement("link");n.type="text/css",n.rel="stylesheet",n.href=e,t.appendChild(n)})}},h=e=>{let{src:t,id:n,onLoad:r=()=>{},onReady:a=null,dangerouslySetInnerHTML:i,children:o="",strategy:l="afterInteractive",onError:s,stylesheets:d}=e,h=n||t;if(h&&f.has(h))return;if(c.has(t)){f.add(h),c.get(t).then(r,s);return}let m=()=>{a&&a(),f.add(h)},y=document.createElement("script"),_=new Promise((e,t)=>{y.addEventListener("load",function(t){e(),r&&r.call(this,t),m()}),y.addEventListener("error",function(e){t(e)})}).catch(function(e){s&&s(e)});for(let[n,r]of(i?(y.innerHTML=i.__html||"",m()):o?(y.textContent="string"==typeof o?o:Array.isArray(o)?o.join(""):"",m()):t&&(y.src=t,c.set(t,_)),Object.entries(e))){if(void 0===r||g.includes(n))continue;let e=u.DOMAttributeNames[n]||n.toLowerCase();y.setAttribute(e,r)}"worker"===l&&y.setAttribute("type","text/partytown"),y.setAttribute("data-nscript",l),d&&p(d),document.body.appendChild(y)};function m(e){let{strategy:t="afterInteractive"}=e;"lazyOnload"===t?window.addEventListener("load",()=>{(0,d.requestIdleCallback)(()=>h(e))}):h(e)}function y(e){e.forEach(m),[...document.querySelectorAll('[data-nscript="beforeInteractive"]'),...document.querySelectorAll('[data-nscript="beforePageRender"]')].forEach(e=>{let t=e.id||e.getAttribute("src");f.add(t)})}function _(e){let{id:t,src:n="",onLoad:r=()=>{},onReady:a=null,strategy:u="afterInteractive",onError:c,stylesheets:g,...p}=e,{updateScripts:m,scripts:y,getIsSsr:_,appDir:v,nonce:b}=(0,l.useContext)(s.HeadManagerContext),w=(0,l.useRef)(!1);(0,l.useEffect)(()=>{let e=t||n;w.current||(a&&e&&f.has(e)&&a(),w.current=!0)},[a,t,n]);let x=(0,l.useRef)(!1);if((0,l.useEffect)(()=>{!x.current&&("afterInteractive"===u?h(e):"lazyOnload"===u&&("complete"===document.readyState?(0,d.requestIdleCallback)(()=>h(e)):window.addEventListener("load",()=>{(0,d.requestIdleCallback)(()=>h(e))})),x.current=!0)},[e,u]),("beforeInteractive"===u||"worker"===u)&&(m?(y[u]=(y[u]||[]).concat([{id:t,src:n,onLoad:r,onReady:a,onError:c,...p}]),m(y)):_&&_()?f.add(t||n):_&&!_()&&h(e)),v){if(g&&g.forEach(e=>{o.default.preinit(e,{as:"style"})}),"beforeInteractive"===u)return n?(o.default.preload(n,p.integrity?{as:"script",integrity:p.integrity,nonce:b,crossOrigin:p.crossOrigin}:{as:"script",nonce:b,crossOrigin:p.crossOrigin}),(0,i.jsx)("script",{nonce:b,dangerouslySetInnerHTML:{__html:"(self.__next_s=self.__next_s||[]).push("+JSON.stringify([n,{...p,id:t}])+")"}})):(p.dangerouslySetInnerHTML&&(p.children=p.dangerouslySetInnerHTML.__html,delete p.dangerouslySetInnerHTML),(0,i.jsx)("script",{nonce:b,dangerouslySetInnerHTML:{__html:"(self.__next_s=self.__next_s||[]).push("+JSON.stringify([0,{...p,id:t}])+")"}}));"afterInteractive"===u&&n&&o.default.preload(n,p.integrity?{as:"script",integrity:p.integrity,nonce:b,crossOrigin:p.crossOrigin}:{as:"script",nonce:b,crossOrigin:p.crossOrigin})}return null}Object.defineProperty(_,"__nextScript",{value:!0});let v=_;("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},2778:()=>{},67462:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>r});let r={src:"/_next/static/media/logo-dark.2be77b14.svg",height:50,width:139,blurWidth:0,blurHeight:0}},65433:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>r});let r={src:"/_next/static/media/logo-light.c63565ff.svg",height:50,width:139,blurWidth:0,blurHeight:0}}},e=>{var t=t=>e(e.s=t);e.O(0,[3,2461,5840,2972,2971,2117,1744],()=>t(44904)),_N_E=e.O()}]);
//# sourceMappingURL=layout-a7e430e3aee01c6e.js.map