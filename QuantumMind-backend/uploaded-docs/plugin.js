(function(){"use strict";try{if(typeof document!="undefined"){var e=document.createElement("style");e.appendChild(document.createTextNode('@import"https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap";@import"https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap";.react-slideshow-container{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;position:relative}.react-slideshow-container .nav{z-index:10;position:absolute;cursor:pointer}.react-slideshow-container .nav:first-of-type{left:0}.react-slideshow-container .nav:last-of-type{right:0}.react-slideshow-container .default-nav{height:30px;background:rgba(255,255,255,.6);width:30px;border:0;text-align:center;color:#fff;border-radius:50%;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center}.react-slideshow-container .default-nav:hover,.react-slideshow-container .default-nav:focus{background:#fff;color:#666;outline:0}.react-slideshow-container .default-nav.disabled:hover{cursor:not-allowed}.react-slideshow-container .default-nav:first-of-type{margin-right:-30px;border-right:0;border-top:0}.react-slideshow-container .default-nav:last-of-type{margin-left:-30px}.react-slideshow-container+ul.indicators{display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-wrap:wrap;flex-wrap:wrap;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;margin-top:20px}.react-slideshow-container+ul.indicators li{display:inline-block;position:relative;width:7px;height:7px;padding:5px;margin:0}.react-slideshow-container+ul.indicators .each-slideshow-indicator{border:0;opacity:.25;cursor:pointer;background:transparent;color:transparent}.react-slideshow-container+ul.indicators .each-slideshow-indicator:before{position:absolute;top:0;left:0;width:7px;height:7px;border-radius:50%;content:"";background:#000;text-align:center}.react-slideshow-container+ul.indicators .each-slideshow-indicator:hover,.react-slideshow-container+ul.indicators .each-slideshow-indicator.active{opacity:.75;outline:0}.react-slideshow-fadezoom-wrapper{width:100%;overflow:hidden}.react-slideshow-fadezoom-wrapper .react-slideshow-fadezoom-images-wrap{display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-wrap:wrap;flex-wrap:wrap}.react-slideshow-fadezoom-wrapper .react-slideshow-fadezoom-images-wrap>div{position:relative;opacity:0}.react-slideshow-wrapper .react-slideshow-fade-images-wrap>div[aria-hidden=true]{display:none}.react-slideshow-wrapper.slide{width:100%;overflow:hidden}.react-slideshow-wrapper .images-wrap{display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-wrap:wrap;flex-wrap:wrap}.react-slideshow-wrapper .images-wrap>div[aria-hidden=true]{display:none}:root{font-family:Inter,Avenir,Helvetica,Arial,sans-serif;font-size:16px;line-height:24px;font-weight:400;font-family:Montserrat,sans-serif;overflow:hidden;font-synthesis:none;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-text-size-adjust:100%}a{font-weight:500;color:#646cff;text-decoration:inherit;font-family:Montserrat,sans-serif}a:hover{color:#535bf2}body{margin:0;display:flex;place-items:center}h1{font-size:3.2em;line-height:1.1}button{border-radius:8px;border:1px solid transparent;padding:.6em 1.2em;font-size:1em;font-weight:500;font-family:inherit;background-color:#1a1a1a;cursor:pointer;transition:border-color .25s}button:hover{border-color:#646cff}@media (prefers-color-scheme: light){:root{color:#213547;background-color:#fff}a:hover{color:#747bff}button{background-color:#f9f9f9}}::-webkit-scrollbar{width:.1vw;background:rgb(255,255,255)}::-webkit-scrollbar-thumb{background:-webkit-linear-gradient(transparent,#30ff00);background:linear-gradient(transparent,#30ff00);border-radius:10px}::-webkit-scrollbar-thumb:hover{background:-webkit-linear-gradient(transparent,#00c6ff);background:linear-gradient(transparent,#00c6ff)}#widget-btn-bounce-animation{animation:bounce .5s;animation-direction:alternate;animation-timing-function:cubic-bezier(.5,.05,1,.5);animation-iteration-count:20}@keyframes bounce{0%{transform:translateZ(0)}to{transform:translate3d(0,30px,0)}}@-webkit-keyframes bounce{0%{-webkit-transform:translate3d(0,0,0);transform:translateZ(0)}to{-webkit-transform:translate3d(0,30px,0);transform:translate3d(0,30px,0)}}.each-slide-effect>div{display:flex;align-items:center;justify-content:center;background-size:cover;height:250px;width:"100%";margin:0 .5rem}.each-slide-effect span{padding:20px;font-size:20px;background:#efefef;text-align:center}.typewriter{animation:typing 3.5s steps(40,end),blink-caret .75s step-end infinite}@keyframes typing{0%{width:0}to{width:100%}}@keyframes blink-caret{0%,to{border-color:transparent}50%{border-color:orange}}.ticontainer{display:flex;align-items:center;justify-content:center;height:100%;width:100%}.tiblock{align-items:center;display:flex;height:24px}.ticontainer .tidot{background-color:#8a8a8b}.tidot{-webkit-animation:mercuryTypingAnimation 1.5s infinite ease-in-out;border-radius:50%;display:inline-block;height:10px;margin-right:2px;width:10px}@-webkit-keyframes mercuryTypingAnimation{0%{-webkit-transform:translateY(0px)}28%{-webkit-transform:translateY(-5px)}44%{-webkit-transform:translateY(0px)}}.tidot:nth-child(1){-webkit-animation-delay:.2s}.tidot:nth-child(2){-webkit-animation-delay:.3s}.tidot:nth-child(3){-webkit-animation-delay:.4s}')),document.head.appendChild(e)}}catch(t){console.error("vite-plugin-css-injected-by-js",t)}})();
function nC(e, t) {
  for (var n = 0; n < t.length; n++) {
    const r = t[n];
    if (typeof r != "string" && !Array.isArray(r)) {
      for (const o in r)
        if (o !== "default" && !(o in e)) {
          const i = Object.getOwnPropertyDescriptor(r, o);
          i && Object.defineProperty(e, o, i.get ? i : {
            enumerable: !0,
            get: () => r[o]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }));
}
var rC = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Tc(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function oC(e) {
  var t = e.default;
  if (typeof t == "function") {
    var n = function() {
      return t.apply(this, arguments);
    };
    n.prototype = t.prototype;
  } else
    n = {};
  return Object.defineProperty(n, "__esModule", { value: !0 }), Object.keys(e).forEach(function(r) {
    var o = Object.getOwnPropertyDescriptor(e, r);
    Object.defineProperty(n, r, o.get ? o : {
      enumerable: !0,
      get: function() {
        return e[r];
      }
    });
  }), n;
}
var Fs = {}, Pi = { exports: {} }, Qt = {}, x = { exports: {} }, xe = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ba = Symbol.for("react.element"), iC = Symbol.for("react.portal"), sC = Symbol.for("react.fragment"), aC = Symbol.for("react.strict_mode"), lC = Symbol.for("react.profiler"), cC = Symbol.for("react.provider"), uC = Symbol.for("react.context"), dC = Symbol.for("react.forward_ref"), fC = Symbol.for("react.suspense"), pC = Symbol.for("react.memo"), hC = Symbol.for("react.lazy"), Um = Symbol.iterator;
function mC(e) {
  return e === null || typeof e != "object" ? null : (e = Um && e[Um] || e["@@iterator"], typeof e == "function" ? e : null);
}
var vy = { isMounted: function() {
  return !1;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, yy = Object.assign, by = {};
function Oi(e, t, n) {
  this.props = e, this.context = t, this.refs = by, this.updater = n || vy;
}
Oi.prototype.isReactComponent = {};
Oi.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null)
    throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, e, t, "setState");
};
Oi.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function xy() {
}
xy.prototype = Oi.prototype;
function Ep(e, t, n) {
  this.props = e, this.context = t, this.refs = by, this.updater = n || vy;
}
var Rp = Ep.prototype = new xy();
Rp.constructor = Ep;
yy(Rp, Oi.prototype);
Rp.isPureReactComponent = !0;
var Hm = Array.isArray, wy = Object.prototype.hasOwnProperty, Tp = { current: null }, Sy = { key: !0, ref: !0, __self: !0, __source: !0 };
function Cy(e, t, n) {
  var r, o = {}, i = null, s = null;
  if (t != null)
    for (r in t.ref !== void 0 && (s = t.ref), t.key !== void 0 && (i = "" + t.key), t)
      wy.call(t, r) && !Sy.hasOwnProperty(r) && (o[r] = t[r]);
  var a = arguments.length - 2;
  if (a === 1)
    o.children = n;
  else if (1 < a) {
    for (var l = Array(a), c = 0; c < a; c++)
      l[c] = arguments[c + 2];
    o.children = l;
  }
  if (e && e.defaultProps)
    for (r in a = e.defaultProps, a)
      o[r] === void 0 && (o[r] = a[r]);
  return { $$typeof: ba, type: e, key: i, ref: s, props: o, _owner: Tp.current };
}
function gC(e, t) {
  return { $$typeof: ba, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function Pp(e) {
  return typeof e == "object" && e !== null && e.$$typeof === ba;
}
function vC(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(n) {
    return t[n];
  });
}
var Vm = /\/+/g;
function Wu(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? vC("" + e.key) : t.toString(36);
}
function hl(e, t, n, r, o) {
  var i = typeof e;
  (i === "undefined" || i === "boolean") && (e = null);
  var s = !1;
  if (e === null)
    s = !0;
  else
    switch (i) {
      case "string":
      case "number":
        s = !0;
        break;
      case "object":
        switch (e.$$typeof) {
          case ba:
          case iC:
            s = !0;
        }
    }
  if (s)
    return s = e, o = o(s), e = r === "" ? "." + Wu(s, 0) : r, Hm(o) ? (n = "", e != null && (n = e.replace(Vm, "$&/") + "/"), hl(o, t, n, "", function(c) {
      return c;
    })) : o != null && (Pp(o) && (o = gC(o, n + (!o.key || s && s.key === o.key ? "" : ("" + o.key).replace(Vm, "$&/") + "/") + e)), t.push(o)), 1;
  if (s = 0, r = r === "" ? "." : r + ":", Hm(e))
    for (var a = 0; a < e.length; a++) {
      i = e[a];
      var l = r + Wu(i, a);
      s += hl(i, t, n, l, o);
    }
  else if (l = mC(e), typeof l == "function")
    for (e = l.call(e), a = 0; !(i = e.next()).done; )
      i = i.value, l = r + Wu(i, a++), s += hl(i, t, n, l, o);
  else if (i === "object")
    throw t = String(e), Error("Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead.");
  return s;
}
function La(e, t, n) {
  if (e == null)
    return e;
  var r = [], o = 0;
  return hl(e, r, "", "", function(i) {
    return t.call(n, i, o++);
  }), r;
}
function yC(e) {
  if (e._status === -1) {
    var t = e._result;
    t = t(), t.then(function(n) {
      (e._status === 0 || e._status === -1) && (e._status = 1, e._result = n);
    }, function(n) {
      (e._status === 0 || e._status === -1) && (e._status = 2, e._result = n);
    }), e._status === -1 && (e._status = 0, e._result = t);
  }
  if (e._status === 1)
    return e._result.default;
  throw e._result;
}
var $t = { current: null }, ml = { transition: null }, bC = { ReactCurrentDispatcher: $t, ReactCurrentBatchConfig: ml, ReactCurrentOwner: Tp };
xe.Children = { map: La, forEach: function(e, t, n) {
  La(e, function() {
    t.apply(this, arguments);
  }, n);
}, count: function(e) {
  var t = 0;
  return La(e, function() {
    t++;
  }), t;
}, toArray: function(e) {
  return La(e, function(t) {
    return t;
  }) || [];
}, only: function(e) {
  if (!Pp(e))
    throw Error("React.Children.only expected to receive a single React element child.");
  return e;
} };
xe.Component = Oi;
xe.Fragment = sC;
xe.Profiler = lC;
xe.PureComponent = Ep;
xe.StrictMode = aC;
xe.Suspense = fC;
xe.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = bC;
xe.cloneElement = function(e, t, n) {
  if (e == null)
    throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var r = yy({}, e.props), o = e.key, i = e.ref, s = e._owner;
  if (t != null) {
    if (t.ref !== void 0 && (i = t.ref, s = Tp.current), t.key !== void 0 && (o = "" + t.key), e.type && e.type.defaultProps)
      var a = e.type.defaultProps;
    for (l in t)
      wy.call(t, l) && !Sy.hasOwnProperty(l) && (r[l] = t[l] === void 0 && a !== void 0 ? a[l] : t[l]);
  }
  var l = arguments.length - 2;
  if (l === 1)
    r.children = n;
  else if (1 < l) {
    a = Array(l);
    for (var c = 0; c < l; c++)
      a[c] = arguments[c + 2];
    r.children = a;
  }
  return { $$typeof: ba, type: e.type, key: o, ref: i, props: r, _owner: s };
};
xe.createContext = function(e) {
  return e = { $$typeof: uC, _currentValue: e, _currentValue2: e, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, e.Provider = { $$typeof: cC, _context: e }, e.Consumer = e;
};
xe.createElement = Cy;
xe.createFactory = function(e) {
  var t = Cy.bind(null, e);
  return t.type = e, t;
};
xe.createRef = function() {
  return { current: null };
};
xe.forwardRef = function(e) {
  return { $$typeof: dC, render: e };
};
xe.isValidElement = Pp;
xe.lazy = function(e) {
  return { $$typeof: hC, _payload: { _status: -1, _result: e }, _init: yC };
};
xe.memo = function(e, t) {
  return { $$typeof: pC, type: e, compare: t === void 0 ? null : t };
};
xe.startTransition = function(e) {
  var t = ml.transition;
  ml.transition = {};
  try {
    e();
  } finally {
    ml.transition = t;
  }
};
xe.unstable_act = function() {
  throw Error("act(...) is not supported in production builds of React.");
};
xe.useCallback = function(e, t) {
  return $t.current.useCallback(e, t);
};
xe.useContext = function(e) {
  return $t.current.useContext(e);
};
xe.useDebugValue = function() {
};
xe.useDeferredValue = function(e) {
  return $t.current.useDeferredValue(e);
};
xe.useEffect = function(e, t) {
  return $t.current.useEffect(e, t);
};
xe.useId = function() {
  return $t.current.useId();
};
xe.useImperativeHandle = function(e, t, n) {
  return $t.current.useImperativeHandle(e, t, n);
};
xe.useInsertionEffect = function(e, t) {
  return $t.current.useInsertionEffect(e, t);
};
xe.useLayoutEffect = function(e, t) {
  return $t.current.useLayoutEffect(e, t);
};
xe.useMemo = function(e, t) {
  return $t.current.useMemo(e, t);
};
xe.useReducer = function(e, t, n) {
  return $t.current.useReducer(e, t, n);
};
xe.useRef = function(e) {
  return $t.current.useRef(e);
};
xe.useState = function(e) {
  return $t.current.useState(e);
};
xe.useSyncExternalStore = function(e, t, n) {
  return $t.current.useSyncExternalStore(e, t, n);
};
xe.useTransition = function() {
  return $t.current.useTransition();
};
xe.version = "18.2.0";
(function(e) {
  e.exports = xe;
})(x);
const Pe = /* @__PURE__ */ Tc(x.exports), Bl = /* @__PURE__ */ nC({
  __proto__: null,
  default: Pe
}, [x.exports]);
var ky = { exports: {} }, Ey = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(e) {
  function t(_, z) {
    var F = _.length;
    _.push(z);
    e:
      for (; 0 < F; ) {
        var Y = F - 1 >>> 1, q = _[Y];
        if (0 < o(q, z))
          _[Y] = z, _[F] = q, F = Y;
        else
          break e;
      }
  }
  function n(_) {
    return _.length === 0 ? null : _[0];
  }
  function r(_) {
    if (_.length === 0)
      return null;
    var z = _[0], F = _.pop();
    if (F !== z) {
      _[0] = F;
      e:
        for (var Y = 0, q = _.length, pe = q >>> 1; Y < pe; ) {
          var ne = 2 * (Y + 1) - 1, ae = _[ne], le = ne + 1, X = _[le];
          if (0 > o(ae, F))
            le < q && 0 > o(X, ae) ? (_[Y] = X, _[le] = F, Y = le) : (_[Y] = ae, _[ne] = F, Y = ne);
          else if (le < q && 0 > o(X, F))
            _[Y] = X, _[le] = F, Y = le;
          else
            break e;
        }
    }
    return z;
  }
  function o(_, z) {
    var F = _.sortIndex - z.sortIndex;
    return F !== 0 ? F : _.id - z.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var i = performance;
    e.unstable_now = function() {
      return i.now();
    };
  } else {
    var s = Date, a = s.now();
    e.unstable_now = function() {
      return s.now() - a;
    };
  }
  var l = [], c = [], u = 1, f = null, h = 3, y = !1, d = !1, m = !1, w = typeof setTimeout == "function" ? setTimeout : null, g = typeof clearTimeout == "function" ? clearTimeout : null, p = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function v(_) {
    for (var z = n(c); z !== null; ) {
      if (z.callback === null)
        r(c);
      else if (z.startTime <= _)
        r(c), z.sortIndex = z.expirationTime, t(l, z);
      else
        break;
      z = n(c);
    }
  }
  function b(_) {
    if (m = !1, v(_), !d)
      if (n(l) !== null)
        d = !0, A(C);
      else {
        var z = n(c);
        z !== null && j(b, z.startTime - _);
      }
  }
  function C(_, z) {
    d = !1, m && (m = !1, g(T), T = -1), y = !0;
    var F = h;
    try {
      for (v(z), f = n(l); f !== null && (!(f.expirationTime > z) || _ && !$()); ) {
        var Y = f.callback;
        if (typeof Y == "function") {
          f.callback = null, h = f.priorityLevel;
          var q = Y(f.expirationTime <= z);
          z = e.unstable_now(), typeof q == "function" ? f.callback = q : f === n(l) && r(l), v(z);
        } else
          r(l);
        f = n(l);
      }
      if (f !== null)
        var pe = !0;
      else {
        var ne = n(c);
        ne !== null && j(b, ne.startTime - z), pe = !1;
      }
      return pe;
    } finally {
      f = null, h = F, y = !1;
    }
  }
  var E = !1, R = null, T = -1, O = 5, P = -1;
  function $() {
    return !(e.unstable_now() - P < O);
  }
  function B() {
    if (R !== null) {
      var _ = e.unstable_now();
      P = _;
      var z = !0;
      try {
        z = R(!0, _);
      } finally {
        z ? D() : (E = !1, R = null);
      }
    } else
      E = !1;
  }
  var D;
  if (typeof p == "function")
    D = function() {
      p(B);
    };
  else if (typeof MessageChannel < "u") {
    var I = new MessageChannel(), M = I.port2;
    I.port1.onmessage = B, D = function() {
      M.postMessage(null);
    };
  } else
    D = function() {
      w(B, 0);
    };
  function A(_) {
    R = _, E || (E = !0, D());
  }
  function j(_, z) {
    T = w(function() {
      _(e.unstable_now());
    }, z);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(_) {
    _.callback = null;
  }, e.unstable_continueExecution = function() {
    d || y || (d = !0, A(C));
  }, e.unstable_forceFrameRate = function(_) {
    0 > _ || 125 < _ ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : O = 0 < _ ? Math.floor(1e3 / _) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return h;
  }, e.unstable_getFirstCallbackNode = function() {
    return n(l);
  }, e.unstable_next = function(_) {
    switch (h) {
      case 1:
      case 2:
      case 3:
        var z = 3;
        break;
      default:
        z = h;
    }
    var F = h;
    h = z;
    try {
      return _();
    } finally {
      h = F;
    }
  }, e.unstable_pauseExecution = function() {
  }, e.unstable_requestPaint = function() {
  }, e.unstable_runWithPriority = function(_, z) {
    switch (_) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        _ = 3;
    }
    var F = h;
    h = _;
    try {
      return z();
    } finally {
      h = F;
    }
  }, e.unstable_scheduleCallback = function(_, z, F) {
    var Y = e.unstable_now();
    switch (typeof F == "object" && F !== null ? (F = F.delay, F = typeof F == "number" && 0 < F ? Y + F : Y) : F = Y, _) {
      case 1:
        var q = -1;
        break;
      case 2:
        q = 250;
        break;
      case 5:
        q = 1073741823;
        break;
      case 4:
        q = 1e4;
        break;
      default:
        q = 5e3;
    }
    return q = F + q, _ = { id: u++, callback: z, priorityLevel: _, startTime: F, expirationTime: q, sortIndex: -1 }, F > Y ? (_.sortIndex = F, t(c, _), n(l) === null && _ === n(c) && (m ? (g(T), T = -1) : m = !0, j(b, F - Y))) : (_.sortIndex = q, t(l, _), d || y || (d = !0, A(C))), _;
  }, e.unstable_shouldYield = $, e.unstable_wrapCallback = function(_) {
    var z = h;
    return function() {
      var F = h;
      h = z;
      try {
        return _.apply(this, arguments);
      } finally {
        h = F;
      }
    };
  };
})(Ey);
(function(e) {
  e.exports = Ey;
})(ky);
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ry = x.exports, qt = ky.exports;
function V(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++)
    t += "&args[]=" + encodeURIComponent(arguments[n]);
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var Ty = /* @__PURE__ */ new Set(), Ds = {};
function $o(e, t) {
  fi(e, t), fi(e + "Capture", t);
}
function fi(e, t) {
  for (Ds[e] = t, e = 0; e < t.length; e++)
    Ty.add(t[e]);
}
var nr = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Wd = Object.prototype.hasOwnProperty, xC = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, Ym = {}, Xm = {};
function wC(e) {
  return Wd.call(Xm, e) ? !0 : Wd.call(Ym, e) ? !1 : xC.test(e) ? Xm[e] = !0 : (Ym[e] = !0, !1);
}
function SC(e, t, n, r) {
  if (n !== null && n.type === 0)
    return !1;
  switch (typeof t) {
    case "function":
    case "symbol":
      return !0;
    case "boolean":
      return r ? !1 : n !== null ? !n.acceptsBooleans : (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-");
    default:
      return !1;
  }
}
function CC(e, t, n, r) {
  if (t === null || typeof t > "u" || SC(e, t, n, r))
    return !0;
  if (r)
    return !1;
  if (n !== null)
    switch (n.type) {
      case 3:
        return !t;
      case 4:
        return t === !1;
      case 5:
        return isNaN(t);
      case 6:
        return isNaN(t) || 1 > t;
    }
  return !1;
}
function _t(e, t, n, r, o, i, s) {
  this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = o, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = i, this.removeEmptyString = s;
}
var vt = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
  vt[e] = new _t(e, 0, !1, e, null, !1, !1);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
  var t = e[0];
  vt[t] = new _t(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
  vt[e] = new _t(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
  vt[e] = new _t(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
  vt[e] = new _t(e, 3, !1, e.toLowerCase(), null, !1, !1);
});
["checked", "multiple", "muted", "selected"].forEach(function(e) {
  vt[e] = new _t(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function(e) {
  vt[e] = new _t(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function(e) {
  vt[e] = new _t(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function(e) {
  vt[e] = new _t(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var Op = /[\-:]([a-z])/g;
function $p(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
  var t = e.replace(
    Op,
    $p
  );
  vt[t] = new _t(t, 1, !1, e, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
  var t = e.replace(Op, $p);
  vt[t] = new _t(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
  var t = e.replace(Op, $p);
  vt[t] = new _t(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function(e) {
  vt[e] = new _t(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
vt.xlinkHref = new _t("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function(e) {
  vt[e] = new _t(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function _p(e, t, n, r) {
  var o = vt.hasOwnProperty(t) ? vt[t] : null;
  (o !== null ? o.type !== 0 : r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (CC(t, n, o, r) && (n = null), r || o === null ? wC(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : o.mustUseProperty ? e[o.propertyName] = n === null ? o.type === 3 ? !1 : "" : n : (t = o.attributeName, r = o.attributeNamespace, n === null ? e.removeAttribute(t) : (o = o.type, n = o === 3 || o === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var ur = Ry.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, Fa = Symbol.for("react.element"), Uo = Symbol.for("react.portal"), Ho = Symbol.for("react.fragment"), Mp = Symbol.for("react.strict_mode"), Ud = Symbol.for("react.profiler"), Py = Symbol.for("react.provider"), Oy = Symbol.for("react.context"), Ip = Symbol.for("react.forward_ref"), Hd = Symbol.for("react.suspense"), Vd = Symbol.for("react.suspense_list"), Ap = Symbol.for("react.memo"), br = Symbol.for("react.lazy"), $y = Symbol.for("react.offscreen"), Km = Symbol.iterator;
function Hi(e) {
  return e === null || typeof e != "object" ? null : (e = Km && e[Km] || e["@@iterator"], typeof e == "function" ? e : null);
}
var Ve = Object.assign, Uu;
function cs(e) {
  if (Uu === void 0)
    try {
      throw Error();
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/);
      Uu = t && t[1] || "";
    }
  return `
` + Uu + e;
}
var Hu = !1;
function Vu(e, t) {
  if (!e || Hu)
    return "";
  Hu = !0;
  var n = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (t)
      if (t = function() {
        throw Error();
      }, Object.defineProperty(t.prototype, "props", { set: function() {
        throw Error();
      } }), typeof Reflect == "object" && Reflect.construct) {
        try {
          Reflect.construct(t, []);
        } catch (c) {
          var r = c;
        }
        Reflect.construct(e, [], t);
      } else {
        try {
          t.call();
        } catch (c) {
          r = c;
        }
        e.call(t.prototype);
      }
    else {
      try {
        throw Error();
      } catch (c) {
        r = c;
      }
      e();
    }
  } catch (c) {
    if (c && r && typeof c.stack == "string") {
      for (var o = c.stack.split(`
`), i = r.stack.split(`
`), s = o.length - 1, a = i.length - 1; 1 <= s && 0 <= a && o[s] !== i[a]; )
        a--;
      for (; 1 <= s && 0 <= a; s--, a--)
        if (o[s] !== i[a]) {
          if (s !== 1 || a !== 1)
            do
              if (s--, a--, 0 > a || o[s] !== i[a]) {
                var l = `
` + o[s].replace(" at new ", " at ");
                return e.displayName && l.includes("<anonymous>") && (l = l.replace("<anonymous>", e.displayName)), l;
              }
            while (1 <= s && 0 <= a);
          break;
        }
    }
  } finally {
    Hu = !1, Error.prepareStackTrace = n;
  }
  return (e = e ? e.displayName || e.name : "") ? cs(e) : "";
}
function kC(e) {
  switch (e.tag) {
    case 5:
      return cs(e.type);
    case 16:
      return cs("Lazy");
    case 13:
      return cs("Suspense");
    case 19:
      return cs("SuspenseList");
    case 0:
    case 2:
    case 15:
      return e = Vu(e.type, !1), e;
    case 11:
      return e = Vu(e.type.render, !1), e;
    case 1:
      return e = Vu(e.type, !0), e;
    default:
      return "";
  }
}
function Yd(e) {
  if (e == null)
    return null;
  if (typeof e == "function")
    return e.displayName || e.name || null;
  if (typeof e == "string")
    return e;
  switch (e) {
    case Ho:
      return "Fragment";
    case Uo:
      return "Portal";
    case Ud:
      return "Profiler";
    case Mp:
      return "StrictMode";
    case Hd:
      return "Suspense";
    case Vd:
      return "SuspenseList";
  }
  if (typeof e == "object")
    switch (e.$$typeof) {
      case Oy:
        return (e.displayName || "Context") + ".Consumer";
      case Py:
        return (e._context.displayName || "Context") + ".Provider";
      case Ip:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case Ap:
        return t = e.displayName || null, t !== null ? t : Yd(e.type) || "Memo";
      case br:
        t = e._payload, e = e._init;
        try {
          return Yd(e(t));
        } catch {
        }
    }
  return null;
}
function EC(e) {
  var t = e.type;
  switch (e.tag) {
    case 24:
      return "Cache";
    case 9:
      return (t.displayName || "Context") + ".Consumer";
    case 10:
      return (t._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return e = t.render, e = e.displayName || e.name || "", t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return t;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return Yd(t);
    case 8:
      return t === Mp ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if (typeof t == "function")
        return t.displayName || t.name || null;
      if (typeof t == "string")
        return t;
  }
  return null;
}
function Wr(e) {
  switch (typeof e) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return e;
    case "object":
      return e;
    default:
      return "";
  }
}
function _y(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function RC(e) {
  var t = _y(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
  if (!e.hasOwnProperty(t) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
    var o = n.get, i = n.set;
    return Object.defineProperty(e, t, { configurable: !0, get: function() {
      return o.call(this);
    }, set: function(s) {
      r = "" + s, i.call(this, s);
    } }), Object.defineProperty(e, t, { enumerable: n.enumerable }), { getValue: function() {
      return r;
    }, setValue: function(s) {
      r = "" + s;
    }, stopTracking: function() {
      e._valueTracker = null, delete e[t];
    } };
  }
}
function Da(e) {
  e._valueTracker || (e._valueTracker = RC(e));
}
function My(e) {
  if (!e)
    return !1;
  var t = e._valueTracker;
  if (!t)
    return !0;
  var n = t.getValue(), r = "";
  return e && (r = _y(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n ? (t.setValue(e), !0) : !1;
}
function jl(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u")
    return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function Xd(e, t) {
  var n = t.checked;
  return Ve({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n != null ? n : e._wrapperState.initialChecked });
}
function qm(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked != null ? t.checked : t.defaultChecked;
  n = Wr(t.value != null ? t.value : n), e._wrapperState = { initialChecked: r, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
}
function Iy(e, t) {
  t = t.checked, t != null && _p(e, "checked", t, !1);
}
function Kd(e, t) {
  Iy(e, t);
  var n = Wr(t.value), r = t.type;
  if (n != null)
    r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
  else if (r === "submit" || r === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? qd(e, t.type, n) : t.hasOwnProperty("defaultValue") && qd(e, t.type, Wr(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function Gm(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var r = t.type;
    if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null))
      return;
    t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
  }
  n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
}
function qd(e, t, n) {
  (t !== "number" || jl(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var us = Array.isArray;
function ri(e, t, n, r) {
  if (e = e.options, t) {
    t = {};
    for (var o = 0; o < n.length; o++)
      t["$" + n[o]] = !0;
    for (n = 0; n < e.length; n++)
      o = t.hasOwnProperty("$" + e[n].value), e[n].selected !== o && (e[n].selected = o), o && r && (e[n].defaultSelected = !0);
  } else {
    for (n = "" + Wr(n), t = null, o = 0; o < e.length; o++) {
      if (e[o].value === n) {
        e[o].selected = !0, r && (e[o].defaultSelected = !0);
        return;
      }
      t !== null || e[o].disabled || (t = e[o]);
    }
    t !== null && (t.selected = !0);
  }
}
function Gd(e, t) {
  if (t.dangerouslySetInnerHTML != null)
    throw Error(V(91));
  return Ve({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function Qm(e, t) {
  var n = t.value;
  if (n == null) {
    if (n = t.children, t = t.defaultValue, n != null) {
      if (t != null)
        throw Error(V(92));
      if (us(n)) {
        if (1 < n.length)
          throw Error(V(93));
        n = n[0];
      }
      t = n;
    }
    t == null && (t = ""), n = t;
  }
  e._wrapperState = { initialValue: Wr(n) };
}
function Ay(e, t) {
  var n = Wr(t.value), r = Wr(t.defaultValue);
  n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
}
function Jm(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function Ny(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function Qd(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml" ? Ny(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
}
var za, Ly = function(e) {
  return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, o) {
    MSApp.execUnsafeLocalFunction(function() {
      return e(t, n, r, o);
    });
  } : e;
}(function(e, t) {
  if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e)
    e.innerHTML = t;
  else {
    for (za = za || document.createElement("div"), za.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = za.firstChild; e.firstChild; )
      e.removeChild(e.firstChild);
    for (; t.firstChild; )
      e.appendChild(t.firstChild);
  }
});
function zs(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var xs = {
  animationIterationCount: !0,
  aspectRatio: !0,
  borderImageOutset: !0,
  borderImageSlice: !0,
  borderImageWidth: !0,
  boxFlex: !0,
  boxFlexGroup: !0,
  boxOrdinalGroup: !0,
  columnCount: !0,
  columns: !0,
  flex: !0,
  flexGrow: !0,
  flexPositive: !0,
  flexShrink: !0,
  flexNegative: !0,
  flexOrder: !0,
  gridArea: !0,
  gridRow: !0,
  gridRowEnd: !0,
  gridRowSpan: !0,
  gridRowStart: !0,
  gridColumn: !0,
  gridColumnEnd: !0,
  gridColumnSpan: !0,
  gridColumnStart: !0,
  fontWeight: !0,
  lineClamp: !0,
  lineHeight: !0,
  opacity: !0,
  order: !0,
  orphans: !0,
  tabSize: !0,
  widows: !0,
  zIndex: !0,
  zoom: !0,
  fillOpacity: !0,
  floodOpacity: !0,
  stopOpacity: !0,
  strokeDasharray: !0,
  strokeDashoffset: !0,
  strokeMiterlimit: !0,
  strokeOpacity: !0,
  strokeWidth: !0
}, TC = ["Webkit", "ms", "Moz", "O"];
Object.keys(xs).forEach(function(e) {
  TC.forEach(function(t) {
    t = t + e.charAt(0).toUpperCase() + e.substring(1), xs[t] = xs[e];
  });
});
function Fy(e, t, n) {
  return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || xs.hasOwnProperty(e) && xs[e] ? ("" + t).trim() : t + "px";
}
function Dy(e, t) {
  e = e.style;
  for (var n in t)
    if (t.hasOwnProperty(n)) {
      var r = n.indexOf("--") === 0, o = Fy(n, t[n], r);
      n === "float" && (n = "cssFloat"), r ? e.setProperty(n, o) : e[n] = o;
    }
}
var PC = Ve({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
function Jd(e, t) {
  if (t) {
    if (PC[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
      throw Error(V(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null)
        throw Error(V(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML))
        throw Error(V(61));
    }
    if (t.style != null && typeof t.style != "object")
      throw Error(V(62));
  }
}
function Zd(e, t) {
  if (e.indexOf("-") === -1)
    return typeof t.is == "string";
  switch (e) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return !1;
    default:
      return !0;
  }
}
var ef = null;
function Np(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var tf = null, oi = null, ii = null;
function Zm(e) {
  if (e = Sa(e)) {
    if (typeof tf != "function")
      throw Error(V(280));
    var t = e.stateNode;
    t && (t = Mc(t), tf(e.stateNode, e.type, t));
  }
}
function zy(e) {
  oi ? ii ? ii.push(e) : ii = [e] : oi = e;
}
function By() {
  if (oi) {
    var e = oi, t = ii;
    if (ii = oi = null, Zm(e), t)
      for (e = 0; e < t.length; e++)
        Zm(t[e]);
  }
}
function jy(e, t) {
  return e(t);
}
function Wy() {
}
var Yu = !1;
function Uy(e, t, n) {
  if (Yu)
    return e(t, n);
  Yu = !0;
  try {
    return jy(e, t, n);
  } finally {
    Yu = !1, (oi !== null || ii !== null) && (Wy(), By());
  }
}
function Bs(e, t) {
  var n = e.stateNode;
  if (n === null)
    return null;
  var r = Mc(n);
  if (r === null)
    return null;
  n = r[t];
  e:
    switch (t) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (r = !r.disabled) || (e = e.type, r = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !r;
        break e;
      default:
        e = !1;
    }
  if (e)
    return null;
  if (n && typeof n != "function")
    throw Error(V(231, t, typeof n));
  return n;
}
var nf = !1;
if (nr)
  try {
    var Vi = {};
    Object.defineProperty(Vi, "passive", { get: function() {
      nf = !0;
    } }), window.addEventListener("test", Vi, Vi), window.removeEventListener("test", Vi, Vi);
  } catch {
    nf = !1;
  }
function OC(e, t, n, r, o, i, s, a, l) {
  var c = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, c);
  } catch (u) {
    this.onError(u);
  }
}
var ws = !1, Wl = null, Ul = !1, rf = null, $C = { onError: function(e) {
  ws = !0, Wl = e;
} };
function _C(e, t, n, r, o, i, s, a, l) {
  ws = !1, Wl = null, OC.apply($C, arguments);
}
function MC(e, t, n, r, o, i, s, a, l) {
  if (_C.apply(this, arguments), ws) {
    if (ws) {
      var c = Wl;
      ws = !1, Wl = null;
    } else
      throw Error(V(198));
    Ul || (Ul = !0, rf = c);
  }
}
function _o(e) {
  var t = e, n = e;
  if (e.alternate)
    for (; t.return; )
      t = t.return;
  else {
    e = t;
    do
      t = e, (t.flags & 4098) !== 0 && (n = t.return), e = t.return;
    while (e);
  }
  return t.tag === 3 ? n : null;
}
function Hy(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null)
      return t.dehydrated;
  }
  return null;
}
function eg(e) {
  if (_o(e) !== e)
    throw Error(V(188));
}
function IC(e) {
  var t = e.alternate;
  if (!t) {
    if (t = _o(e), t === null)
      throw Error(V(188));
    return t !== e ? null : e;
  }
  for (var n = e, r = t; ; ) {
    var o = n.return;
    if (o === null)
      break;
    var i = o.alternate;
    if (i === null) {
      if (r = o.return, r !== null) {
        n = r;
        continue;
      }
      break;
    }
    if (o.child === i.child) {
      for (i = o.child; i; ) {
        if (i === n)
          return eg(o), e;
        if (i === r)
          return eg(o), t;
        i = i.sibling;
      }
      throw Error(V(188));
    }
    if (n.return !== r.return)
      n = o, r = i;
    else {
      for (var s = !1, a = o.child; a; ) {
        if (a === n) {
          s = !0, n = o, r = i;
          break;
        }
        if (a === r) {
          s = !0, r = o, n = i;
          break;
        }
        a = a.sibling;
      }
      if (!s) {
        for (a = i.child; a; ) {
          if (a === n) {
            s = !0, n = i, r = o;
            break;
          }
          if (a === r) {
            s = !0, r = i, n = o;
            break;
          }
          a = a.sibling;
        }
        if (!s)
          throw Error(V(189));
      }
    }
    if (n.alternate !== r)
      throw Error(V(190));
  }
  if (n.tag !== 3)
    throw Error(V(188));
  return n.stateNode.current === n ? e : t;
}
function Vy(e) {
  return e = IC(e), e !== null ? Yy(e) : null;
}
function Yy(e) {
  if (e.tag === 5 || e.tag === 6)
    return e;
  for (e = e.child; e !== null; ) {
    var t = Yy(e);
    if (t !== null)
      return t;
    e = e.sibling;
  }
  return null;
}
var Xy = qt.unstable_scheduleCallback, tg = qt.unstable_cancelCallback, AC = qt.unstable_shouldYield, NC = qt.unstable_requestPaint, Ge = qt.unstable_now, LC = qt.unstable_getCurrentPriorityLevel, Lp = qt.unstable_ImmediatePriority, Ky = qt.unstable_UserBlockingPriority, Hl = qt.unstable_NormalPriority, FC = qt.unstable_LowPriority, qy = qt.unstable_IdlePriority, Pc = null, Nn = null;
function DC(e) {
  if (Nn && typeof Nn.onCommitFiberRoot == "function")
    try {
      Nn.onCommitFiberRoot(Pc, e, void 0, (e.current.flags & 128) === 128);
    } catch {
    }
}
var kn = Math.clz32 ? Math.clz32 : jC, zC = Math.log, BC = Math.LN2;
function jC(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (zC(e) / BC | 0) | 0;
}
var Ba = 64, ja = 4194304;
function ds(e) {
  switch (e & -e) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return e & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return e;
  }
}
function Vl(e, t) {
  var n = e.pendingLanes;
  if (n === 0)
    return 0;
  var r = 0, o = e.suspendedLanes, i = e.pingedLanes, s = n & 268435455;
  if (s !== 0) {
    var a = s & ~o;
    a !== 0 ? r = ds(a) : (i &= s, i !== 0 && (r = ds(i)));
  } else
    s = n & ~o, s !== 0 ? r = ds(s) : i !== 0 && (r = ds(i));
  if (r === 0)
    return 0;
  if (t !== 0 && t !== r && (t & o) === 0 && (o = r & -r, i = t & -t, o >= i || o === 16 && (i & 4194240) !== 0))
    return t;
  if ((r & 4) !== 0 && (r |= n & 16), t = e.entangledLanes, t !== 0)
    for (e = e.entanglements, t &= r; 0 < t; )
      n = 31 - kn(t), o = 1 << n, r |= e[n], t &= ~o;
  return r;
}
function WC(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
      return t + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function UC(e, t) {
  for (var n = e.suspendedLanes, r = e.pingedLanes, o = e.expirationTimes, i = e.pendingLanes; 0 < i; ) {
    var s = 31 - kn(i), a = 1 << s, l = o[s];
    l === -1 ? ((a & n) === 0 || (a & r) !== 0) && (o[s] = WC(a, t)) : l <= t && (e.expiredLanes |= a), i &= ~a;
  }
}
function of(e) {
  return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function Gy() {
  var e = Ba;
  return Ba <<= 1, (Ba & 4194240) === 0 && (Ba = 64), e;
}
function Xu(e) {
  for (var t = [], n = 0; 31 > n; n++)
    t.push(e);
  return t;
}
function xa(e, t, n) {
  e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - kn(t), e[t] = n;
}
function HC(e, t) {
  var n = e.pendingLanes & ~t;
  e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
  var r = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var o = 31 - kn(n), i = 1 << o;
    t[o] = 0, r[o] = -1, e[o] = -1, n &= ~i;
  }
}
function Fp(e, t) {
  var n = e.entangledLanes |= t;
  for (e = e.entanglements; n; ) {
    var r = 31 - kn(n), o = 1 << r;
    o & t | e[r] & t && (e[r] |= t), n &= ~o;
  }
}
var $e = 0;
function Qy(e) {
  return e &= -e, 1 < e ? 4 < e ? (e & 268435455) !== 0 ? 16 : 536870912 : 4 : 1;
}
var Jy, Dp, Zy, e1, t1, sf = !1, Wa = [], Mr = null, Ir = null, Ar = null, js = /* @__PURE__ */ new Map(), Ws = /* @__PURE__ */ new Map(), wr = [], VC = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function ng(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      Mr = null;
      break;
    case "dragenter":
    case "dragleave":
      Ir = null;
      break;
    case "mouseover":
    case "mouseout":
      Ar = null;
      break;
    case "pointerover":
    case "pointerout":
      js.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Ws.delete(t.pointerId);
  }
}
function Yi(e, t, n, r, o, i) {
  return e === null || e.nativeEvent !== i ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: i, targetContainers: [o] }, t !== null && (t = Sa(t), t !== null && Dp(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, o !== null && t.indexOf(o) === -1 && t.push(o), e);
}
function YC(e, t, n, r, o) {
  switch (t) {
    case "focusin":
      return Mr = Yi(Mr, e, t, n, r, o), !0;
    case "dragenter":
      return Ir = Yi(Ir, e, t, n, r, o), !0;
    case "mouseover":
      return Ar = Yi(Ar, e, t, n, r, o), !0;
    case "pointerover":
      var i = o.pointerId;
      return js.set(i, Yi(js.get(i) || null, e, t, n, r, o)), !0;
    case "gotpointercapture":
      return i = o.pointerId, Ws.set(i, Yi(Ws.get(i) || null, e, t, n, r, o)), !0;
  }
  return !1;
}
function n1(e) {
  var t = uo(e.target);
  if (t !== null) {
    var n = _o(t);
    if (n !== null) {
      if (t = n.tag, t === 13) {
        if (t = Hy(n), t !== null) {
          e.blockedOn = t, t1(e.priority, function() {
            Zy(n);
          });
          return;
        }
      } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
        return;
      }
    }
  }
  e.blockedOn = null;
}
function gl(e) {
  if (e.blockedOn !== null)
    return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = af(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var r = new n.constructor(n.type, n);
      ef = r, n.target.dispatchEvent(r), ef = null;
    } else
      return t = Sa(n), t !== null && Dp(t), e.blockedOn = n, !1;
    t.shift();
  }
  return !0;
}
function rg(e, t, n) {
  gl(e) && n.delete(t);
}
function XC() {
  sf = !1, Mr !== null && gl(Mr) && (Mr = null), Ir !== null && gl(Ir) && (Ir = null), Ar !== null && gl(Ar) && (Ar = null), js.forEach(rg), Ws.forEach(rg);
}
function Xi(e, t) {
  e.blockedOn === t && (e.blockedOn = null, sf || (sf = !0, qt.unstable_scheduleCallback(qt.unstable_NormalPriority, XC)));
}
function Us(e) {
  function t(o) {
    return Xi(o, e);
  }
  if (0 < Wa.length) {
    Xi(Wa[0], e);
    for (var n = 1; n < Wa.length; n++) {
      var r = Wa[n];
      r.blockedOn === e && (r.blockedOn = null);
    }
  }
  for (Mr !== null && Xi(Mr, e), Ir !== null && Xi(Ir, e), Ar !== null && Xi(Ar, e), js.forEach(t), Ws.forEach(t), n = 0; n < wr.length; n++)
    r = wr[n], r.blockedOn === e && (r.blockedOn = null);
  for (; 0 < wr.length && (n = wr[0], n.blockedOn === null); )
    n1(n), n.blockedOn === null && wr.shift();
}
var si = ur.ReactCurrentBatchConfig, Yl = !0;
function KC(e, t, n, r) {
  var o = $e, i = si.transition;
  si.transition = null;
  try {
    $e = 1, zp(e, t, n, r);
  } finally {
    $e = o, si.transition = i;
  }
}
function qC(e, t, n, r) {
  var o = $e, i = si.transition;
  si.transition = null;
  try {
    $e = 4, zp(e, t, n, r);
  } finally {
    $e = o, si.transition = i;
  }
}
function zp(e, t, n, r) {
  if (Yl) {
    var o = af(e, t, n, r);
    if (o === null)
      rd(e, t, r, Xl, n), ng(e, r);
    else if (YC(o, e, t, n, r))
      r.stopPropagation();
    else if (ng(e, r), t & 4 && -1 < VC.indexOf(e)) {
      for (; o !== null; ) {
        var i = Sa(o);
        if (i !== null && Jy(i), i = af(e, t, n, r), i === null && rd(e, t, r, Xl, n), i === o)
          break;
        o = i;
      }
      o !== null && r.stopPropagation();
    } else
      rd(e, t, r, null, n);
  }
}
var Xl = null;
function af(e, t, n, r) {
  if (Xl = null, e = Np(r), e = uo(e), e !== null)
    if (t = _o(e), t === null)
      e = null;
    else if (n = t.tag, n === 13) {
      if (e = Hy(t), e !== null)
        return e;
      e = null;
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated)
        return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else
      t !== e && (e = null);
  return Xl = e, null;
}
function r1(e) {
  switch (e) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (LC()) {
        case Lp:
          return 1;
        case Ky:
          return 4;
        case Hl:
        case FC:
          return 16;
        case qy:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var Tr = null, Bp = null, vl = null;
function o1() {
  if (vl)
    return vl;
  var e, t = Bp, n = t.length, r, o = "value" in Tr ? Tr.value : Tr.textContent, i = o.length;
  for (e = 0; e < n && t[e] === o[e]; e++)
    ;
  var s = n - e;
  for (r = 1; r <= s && t[n - r] === o[i - r]; r++)
    ;
  return vl = o.slice(e, 1 < r ? 1 - r : void 0);
}
function yl(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function Ua() {
  return !0;
}
function og() {
  return !1;
}
function Jt(e) {
  function t(n, r, o, i, s) {
    this._reactName = n, this._targetInst = o, this.type = r, this.nativeEvent = i, this.target = s, this.currentTarget = null;
    for (var a in e)
      e.hasOwnProperty(a) && (n = e[a], this[a] = n ? n(i) : i[a]);
    return this.isDefaultPrevented = (i.defaultPrevented != null ? i.defaultPrevented : i.returnValue === !1) ? Ua : og, this.isPropagationStopped = og, this;
  }
  return Ve(t.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var n = this.nativeEvent;
    n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = Ua);
  }, stopPropagation: function() {
    var n = this.nativeEvent;
    n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = Ua);
  }, persist: function() {
  }, isPersistent: Ua }), t;
}
var $i = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
  return e.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, jp = Jt($i), wa = Ve({}, $i, { view: 0, detail: 0 }), GC = Jt(wa), Ku, qu, Ki, Oc = Ve({}, wa, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: Wp, button: 0, buttons: 0, relatedTarget: function(e) {
  return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
}, movementX: function(e) {
  return "movementX" in e ? e.movementX : (e !== Ki && (Ki && e.type === "mousemove" ? (Ku = e.screenX - Ki.screenX, qu = e.screenY - Ki.screenY) : qu = Ku = 0, Ki = e), Ku);
}, movementY: function(e) {
  return "movementY" in e ? e.movementY : qu;
} }), ig = Jt(Oc), QC = Ve({}, Oc, { dataTransfer: 0 }), JC = Jt(QC), ZC = Ve({}, wa, { relatedTarget: 0 }), Gu = Jt(ZC), ek = Ve({}, $i, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), tk = Jt(ek), nk = Ve({}, $i, { clipboardData: function(e) {
  return "clipboardData" in e ? e.clipboardData : window.clipboardData;
} }), rk = Jt(nk), ok = Ve({}, $i, { data: 0 }), sg = Jt(ok), ik = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, sk = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, ak = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function lk(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = ak[e]) ? !!t[e] : !1;
}
function Wp() {
  return lk;
}
var ck = Ve({}, wa, { key: function(e) {
  if (e.key) {
    var t = ik[e.key] || e.key;
    if (t !== "Unidentified")
      return t;
  }
  return e.type === "keypress" ? (e = yl(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? sk[e.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: Wp, charCode: function(e) {
  return e.type === "keypress" ? yl(e) : 0;
}, keyCode: function(e) {
  return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
}, which: function(e) {
  return e.type === "keypress" ? yl(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
} }), uk = Jt(ck), dk = Ve({}, Oc, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), ag = Jt(dk), fk = Ve({}, wa, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: Wp }), pk = Jt(fk), hk = Ve({}, $i, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), mk = Jt(hk), gk = Ve({}, Oc, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), vk = Jt(gk), yk = [9, 13, 27, 32], Up = nr && "CompositionEvent" in window, Ss = null;
nr && "documentMode" in document && (Ss = document.documentMode);
var bk = nr && "TextEvent" in window && !Ss, i1 = nr && (!Up || Ss && 8 < Ss && 11 >= Ss), lg = String.fromCharCode(32), cg = !1;
function s1(e, t) {
  switch (e) {
    case "keyup":
      return yk.indexOf(t.keyCode) !== -1;
    case "keydown":
      return t.keyCode !== 229;
    case "keypress":
    case "mousedown":
    case "focusout":
      return !0;
    default:
      return !1;
  }
}
function a1(e) {
  return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
}
var Vo = !1;
function xk(e, t) {
  switch (e) {
    case "compositionend":
      return a1(t);
    case "keypress":
      return t.which !== 32 ? null : (cg = !0, lg);
    case "textInput":
      return e = t.data, e === lg && cg ? null : e;
    default:
      return null;
  }
}
function wk(e, t) {
  if (Vo)
    return e === "compositionend" || !Up && s1(e, t) ? (e = o1(), vl = Bp = Tr = null, Vo = !1, e) : null;
  switch (e) {
    case "paste":
      return null;
    case "keypress":
      if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
        if (t.char && 1 < t.char.length)
          return t.char;
        if (t.which)
          return String.fromCharCode(t.which);
      }
      return null;
    case "compositionend":
      return i1 && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var Sk = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
function ug(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!Sk[e.type] : t === "textarea";
}
function l1(e, t, n, r) {
  zy(r), t = Kl(t, "onChange"), 0 < t.length && (n = new jp("onChange", "change", null, n, r), e.push({ event: n, listeners: t }));
}
var Cs = null, Hs = null;
function Ck(e) {
  b1(e, 0);
}
function $c(e) {
  var t = Ko(e);
  if (My(t))
    return e;
}
function kk(e, t) {
  if (e === "change")
    return t;
}
var c1 = !1;
if (nr) {
  var Qu;
  if (nr) {
    var Ju = "oninput" in document;
    if (!Ju) {
      var dg = document.createElement("div");
      dg.setAttribute("oninput", "return;"), Ju = typeof dg.oninput == "function";
    }
    Qu = Ju;
  } else
    Qu = !1;
  c1 = Qu && (!document.documentMode || 9 < document.documentMode);
}
function fg() {
  Cs && (Cs.detachEvent("onpropertychange", u1), Hs = Cs = null);
}
function u1(e) {
  if (e.propertyName === "value" && $c(Hs)) {
    var t = [];
    l1(t, Hs, e, Np(e)), Uy(Ck, t);
  }
}
function Ek(e, t, n) {
  e === "focusin" ? (fg(), Cs = t, Hs = n, Cs.attachEvent("onpropertychange", u1)) : e === "focusout" && fg();
}
function Rk(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown")
    return $c(Hs);
}
function Tk(e, t) {
  if (e === "click")
    return $c(t);
}
function Pk(e, t) {
  if (e === "input" || e === "change")
    return $c(t);
}
function Ok(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var Rn = typeof Object.is == "function" ? Object.is : Ok;
function Vs(e, t) {
  if (Rn(e, t))
    return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null)
    return !1;
  var n = Object.keys(e), r = Object.keys(t);
  if (n.length !== r.length)
    return !1;
  for (r = 0; r < n.length; r++) {
    var o = n[r];
    if (!Wd.call(t, o) || !Rn(e[o], t[o]))
      return !1;
  }
  return !0;
}
function pg(e) {
  for (; e && e.firstChild; )
    e = e.firstChild;
  return e;
}
function hg(e, t) {
  var n = pg(e);
  e = 0;
  for (var r; n; ) {
    if (n.nodeType === 3) {
      if (r = e + n.textContent.length, e <= t && r >= t)
        return { node: n, offset: t - e };
      e = r;
    }
    e: {
      for (; n; ) {
        if (n.nextSibling) {
          n = n.nextSibling;
          break e;
        }
        n = n.parentNode;
      }
      n = void 0;
    }
    n = pg(n);
  }
}
function d1(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? d1(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function f1() {
  for (var e = window, t = jl(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch {
      n = !1;
    }
    if (n)
      e = t.contentWindow;
    else
      break;
    t = jl(e.document);
  }
  return t;
}
function Hp(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
function $k(e) {
  var t = f1(), n = e.focusedElem, r = e.selectionRange;
  if (t !== n && n && n.ownerDocument && d1(n.ownerDocument.documentElement, n)) {
    if (r !== null && Hp(n)) {
      if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n)
        n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
      else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
        e = e.getSelection();
        var o = n.textContent.length, i = Math.min(r.start, o);
        r = r.end === void 0 ? i : Math.min(r.end, o), !e.extend && i > r && (o = r, r = i, i = o), o = hg(n, i);
        var s = hg(
          n,
          r
        );
        o && s && (e.rangeCount !== 1 || e.anchorNode !== o.node || e.anchorOffset !== o.offset || e.focusNode !== s.node || e.focusOffset !== s.offset) && (t = t.createRange(), t.setStart(o.node, o.offset), e.removeAllRanges(), i > r ? (e.addRange(t), e.extend(s.node, s.offset)) : (t.setEnd(s.node, s.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; e = e.parentNode; )
      e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++)
      e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
  }
}
var _k = nr && "documentMode" in document && 11 >= document.documentMode, Yo = null, lf = null, ks = null, cf = !1;
function mg(e, t, n) {
  var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  cf || Yo == null || Yo !== jl(r) || (r = Yo, "selectionStart" in r && Hp(r) ? r = { start: r.selectionStart, end: r.selectionEnd } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset }), ks && Vs(ks, r) || (ks = r, r = Kl(lf, "onSelect"), 0 < r.length && (t = new jp("onSelect", "select", null, t, n), e.push({ event: t, listeners: r }), t.target = Yo)));
}
function Ha(e, t) {
  var n = {};
  return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
}
var Xo = { animationend: Ha("Animation", "AnimationEnd"), animationiteration: Ha("Animation", "AnimationIteration"), animationstart: Ha("Animation", "AnimationStart"), transitionend: Ha("Transition", "TransitionEnd") }, Zu = {}, p1 = {};
nr && (p1 = document.createElement("div").style, "AnimationEvent" in window || (delete Xo.animationend.animation, delete Xo.animationiteration.animation, delete Xo.animationstart.animation), "TransitionEvent" in window || delete Xo.transitionend.transition);
function _c(e) {
  if (Zu[e])
    return Zu[e];
  if (!Xo[e])
    return e;
  var t = Xo[e], n;
  for (n in t)
    if (t.hasOwnProperty(n) && n in p1)
      return Zu[e] = t[n];
  return e;
}
var h1 = _c("animationend"), m1 = _c("animationiteration"), g1 = _c("animationstart"), v1 = _c("transitionend"), y1 = /* @__PURE__ */ new Map(), gg = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function Xr(e, t) {
  y1.set(e, t), $o(t, [e]);
}
for (var ed = 0; ed < gg.length; ed++) {
  var td = gg[ed], Mk = td.toLowerCase(), Ik = td[0].toUpperCase() + td.slice(1);
  Xr(Mk, "on" + Ik);
}
Xr(h1, "onAnimationEnd");
Xr(m1, "onAnimationIteration");
Xr(g1, "onAnimationStart");
Xr("dblclick", "onDoubleClick");
Xr("focusin", "onFocus");
Xr("focusout", "onBlur");
Xr(v1, "onTransitionEnd");
fi("onMouseEnter", ["mouseout", "mouseover"]);
fi("onMouseLeave", ["mouseout", "mouseover"]);
fi("onPointerEnter", ["pointerout", "pointerover"]);
fi("onPointerLeave", ["pointerout", "pointerover"]);
$o("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
$o("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
$o("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
$o("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
$o("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
$o("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var fs = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Ak = new Set("cancel close invalid load scroll toggle".split(" ").concat(fs));
function vg(e, t, n) {
  var r = e.type || "unknown-event";
  e.currentTarget = n, MC(r, t, void 0, e), e.currentTarget = null;
}
function b1(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var r = e[n], o = r.event;
    r = r.listeners;
    e: {
      var i = void 0;
      if (t)
        for (var s = r.length - 1; 0 <= s; s--) {
          var a = r[s], l = a.instance, c = a.currentTarget;
          if (a = a.listener, l !== i && o.isPropagationStopped())
            break e;
          vg(o, a, c), i = l;
        }
      else
        for (s = 0; s < r.length; s++) {
          if (a = r[s], l = a.instance, c = a.currentTarget, a = a.listener, l !== i && o.isPropagationStopped())
            break e;
          vg(o, a, c), i = l;
        }
    }
  }
  if (Ul)
    throw e = rf, Ul = !1, rf = null, e;
}
function Fe(e, t) {
  var n = t[hf];
  n === void 0 && (n = t[hf] = /* @__PURE__ */ new Set());
  var r = e + "__bubble";
  n.has(r) || (x1(t, e, 2, !1), n.add(r));
}
function nd(e, t, n) {
  var r = 0;
  t && (r |= 4), x1(n, e, r, t);
}
var Va = "_reactListening" + Math.random().toString(36).slice(2);
function Ys(e) {
  if (!e[Va]) {
    e[Va] = !0, Ty.forEach(function(n) {
      n !== "selectionchange" && (Ak.has(n) || nd(n, !1, e), nd(n, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[Va] || (t[Va] = !0, nd("selectionchange", !1, t));
  }
}
function x1(e, t, n, r) {
  switch (r1(t)) {
    case 1:
      var o = KC;
      break;
    case 4:
      o = qC;
      break;
    default:
      o = zp;
  }
  n = o.bind(null, t, n, e), o = void 0, !nf || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (o = !0), r ? o !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: o }) : e.addEventListener(t, n, !0) : o !== void 0 ? e.addEventListener(t, n, { passive: o }) : e.addEventListener(t, n, !1);
}
function rd(e, t, n, r, o) {
  var i = r;
  if ((t & 1) === 0 && (t & 2) === 0 && r !== null)
    e:
      for (; ; ) {
        if (r === null)
          return;
        var s = r.tag;
        if (s === 3 || s === 4) {
          var a = r.stateNode.containerInfo;
          if (a === o || a.nodeType === 8 && a.parentNode === o)
            break;
          if (s === 4)
            for (s = r.return; s !== null; ) {
              var l = s.tag;
              if ((l === 3 || l === 4) && (l = s.stateNode.containerInfo, l === o || l.nodeType === 8 && l.parentNode === o))
                return;
              s = s.return;
            }
          for (; a !== null; ) {
            if (s = uo(a), s === null)
              return;
            if (l = s.tag, l === 5 || l === 6) {
              r = i = s;
              continue e;
            }
            a = a.parentNode;
          }
        }
        r = r.return;
      }
  Uy(function() {
    var c = i, u = Np(n), f = [];
    e: {
      var h = y1.get(e);
      if (h !== void 0) {
        var y = jp, d = e;
        switch (e) {
          case "keypress":
            if (yl(n) === 0)
              break e;
          case "keydown":
          case "keyup":
            y = uk;
            break;
          case "focusin":
            d = "focus", y = Gu;
            break;
          case "focusout":
            d = "blur", y = Gu;
            break;
          case "beforeblur":
          case "afterblur":
            y = Gu;
            break;
          case "click":
            if (n.button === 2)
              break e;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            y = ig;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            y = JC;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            y = pk;
            break;
          case h1:
          case m1:
          case g1:
            y = tk;
            break;
          case v1:
            y = mk;
            break;
          case "scroll":
            y = GC;
            break;
          case "wheel":
            y = vk;
            break;
          case "copy":
          case "cut":
          case "paste":
            y = rk;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            y = ag;
        }
        var m = (t & 4) !== 0, w = !m && e === "scroll", g = m ? h !== null ? h + "Capture" : null : h;
        m = [];
        for (var p = c, v; p !== null; ) {
          v = p;
          var b = v.stateNode;
          if (v.tag === 5 && b !== null && (v = b, g !== null && (b = Bs(p, g), b != null && m.push(Xs(p, b, v)))), w)
            break;
          p = p.return;
        }
        0 < m.length && (h = new y(h, d, null, n, u), f.push({ event: h, listeners: m }));
      }
    }
    if ((t & 7) === 0) {
      e: {
        if (h = e === "mouseover" || e === "pointerover", y = e === "mouseout" || e === "pointerout", h && n !== ef && (d = n.relatedTarget || n.fromElement) && (uo(d) || d[rr]))
          break e;
        if ((y || h) && (h = u.window === u ? u : (h = u.ownerDocument) ? h.defaultView || h.parentWindow : window, y ? (d = n.relatedTarget || n.toElement, y = c, d = d ? uo(d) : null, d !== null && (w = _o(d), d !== w || d.tag !== 5 && d.tag !== 6) && (d = null)) : (y = null, d = c), y !== d)) {
          if (m = ig, b = "onMouseLeave", g = "onMouseEnter", p = "mouse", (e === "pointerout" || e === "pointerover") && (m = ag, b = "onPointerLeave", g = "onPointerEnter", p = "pointer"), w = y == null ? h : Ko(y), v = d == null ? h : Ko(d), h = new m(b, p + "leave", y, n, u), h.target = w, h.relatedTarget = v, b = null, uo(u) === c && (m = new m(g, p + "enter", d, n, u), m.target = v, m.relatedTarget = w, b = m), w = b, y && d)
            t: {
              for (m = y, g = d, p = 0, v = m; v; v = Io(v))
                p++;
              for (v = 0, b = g; b; b = Io(b))
                v++;
              for (; 0 < p - v; )
                m = Io(m), p--;
              for (; 0 < v - p; )
                g = Io(g), v--;
              for (; p--; ) {
                if (m === g || g !== null && m === g.alternate)
                  break t;
                m = Io(m), g = Io(g);
              }
              m = null;
            }
          else
            m = null;
          y !== null && yg(f, h, y, m, !1), d !== null && w !== null && yg(f, w, d, m, !0);
        }
      }
      e: {
        if (h = c ? Ko(c) : window, y = h.nodeName && h.nodeName.toLowerCase(), y === "select" || y === "input" && h.type === "file")
          var C = kk;
        else if (ug(h))
          if (c1)
            C = Pk;
          else {
            C = Rk;
            var E = Ek;
          }
        else
          (y = h.nodeName) && y.toLowerCase() === "input" && (h.type === "checkbox" || h.type === "radio") && (C = Tk);
        if (C && (C = C(e, c))) {
          l1(f, C, n, u);
          break e;
        }
        E && E(e, h, c), e === "focusout" && (E = h._wrapperState) && E.controlled && h.type === "number" && qd(h, "number", h.value);
      }
      switch (E = c ? Ko(c) : window, e) {
        case "focusin":
          (ug(E) || E.contentEditable === "true") && (Yo = E, lf = c, ks = null);
          break;
        case "focusout":
          ks = lf = Yo = null;
          break;
        case "mousedown":
          cf = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          cf = !1, mg(f, n, u);
          break;
        case "selectionchange":
          if (_k)
            break;
        case "keydown":
        case "keyup":
          mg(f, n, u);
      }
      var R;
      if (Up)
        e: {
          switch (e) {
            case "compositionstart":
              var T = "onCompositionStart";
              break e;
            case "compositionend":
              T = "onCompositionEnd";
              break e;
            case "compositionupdate":
              T = "onCompositionUpdate";
              break e;
          }
          T = void 0;
        }
      else
        Vo ? s1(e, n) && (T = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (T = "onCompositionStart");
      T && (i1 && n.locale !== "ko" && (Vo || T !== "onCompositionStart" ? T === "onCompositionEnd" && Vo && (R = o1()) : (Tr = u, Bp = "value" in Tr ? Tr.value : Tr.textContent, Vo = !0)), E = Kl(c, T), 0 < E.length && (T = new sg(T, e, null, n, u), f.push({ event: T, listeners: E }), R ? T.data = R : (R = a1(n), R !== null && (T.data = R)))), (R = bk ? xk(e, n) : wk(e, n)) && (c = Kl(c, "onBeforeInput"), 0 < c.length && (u = new sg("onBeforeInput", "beforeinput", null, n, u), f.push({ event: u, listeners: c }), u.data = R));
    }
    b1(f, t);
  });
}
function Xs(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function Kl(e, t) {
  for (var n = t + "Capture", r = []; e !== null; ) {
    var o = e, i = o.stateNode;
    o.tag === 5 && i !== null && (o = i, i = Bs(e, n), i != null && r.unshift(Xs(e, i, o)), i = Bs(e, t), i != null && r.push(Xs(e, i, o))), e = e.return;
  }
  return r;
}
function Io(e) {
  if (e === null)
    return null;
  do
    e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function yg(e, t, n, r, o) {
  for (var i = t._reactName, s = []; n !== null && n !== r; ) {
    var a = n, l = a.alternate, c = a.stateNode;
    if (l !== null && l === r)
      break;
    a.tag === 5 && c !== null && (a = c, o ? (l = Bs(n, i), l != null && s.unshift(Xs(n, l, a))) : o || (l = Bs(n, i), l != null && s.push(Xs(n, l, a)))), n = n.return;
  }
  s.length !== 0 && e.push({ event: t, listeners: s });
}
var Nk = /\r\n?/g, Lk = /\u0000|\uFFFD/g;
function bg(e) {
  return (typeof e == "string" ? e : "" + e).replace(Nk, `
`).replace(Lk, "");
}
function Ya(e, t, n) {
  if (t = bg(t), bg(e) !== t && n)
    throw Error(V(425));
}
function ql() {
}
var uf = null, df = null;
function ff(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var pf = typeof setTimeout == "function" ? setTimeout : void 0, Fk = typeof clearTimeout == "function" ? clearTimeout : void 0, xg = typeof Promise == "function" ? Promise : void 0, Dk = typeof queueMicrotask == "function" ? queueMicrotask : typeof xg < "u" ? function(e) {
  return xg.resolve(null).then(e).catch(zk);
} : pf;
function zk(e) {
  setTimeout(function() {
    throw e;
  });
}
function od(e, t) {
  var n = t, r = 0;
  do {
    var o = n.nextSibling;
    if (e.removeChild(n), o && o.nodeType === 8)
      if (n = o.data, n === "/$") {
        if (r === 0) {
          e.removeChild(o), Us(t);
          return;
        }
        r--;
      } else
        n !== "$" && n !== "$?" && n !== "$!" || r++;
    n = o;
  } while (n);
  Us(t);
}
function Nr(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType;
    if (t === 1 || t === 3)
      break;
    if (t === 8) {
      if (t = e.data, t === "$" || t === "$!" || t === "$?")
        break;
      if (t === "/$")
        return null;
    }
  }
  return e;
}
function wg(e) {
  e = e.previousSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var n = e.data;
      if (n === "$" || n === "$!" || n === "$?") {
        if (t === 0)
          return e;
        t--;
      } else
        n === "/$" && t++;
    }
    e = e.previousSibling;
  }
  return null;
}
var _i = Math.random().toString(36).slice(2), Mn = "__reactFiber$" + _i, Ks = "__reactProps$" + _i, rr = "__reactContainer$" + _i, hf = "__reactEvents$" + _i, Bk = "__reactListeners$" + _i, jk = "__reactHandles$" + _i;
function uo(e) {
  var t = e[Mn];
  if (t)
    return t;
  for (var n = e.parentNode; n; ) {
    if (t = n[rr] || n[Mn]) {
      if (n = t.alternate, t.child !== null || n !== null && n.child !== null)
        for (e = wg(e); e !== null; ) {
          if (n = e[Mn])
            return n;
          e = wg(e);
        }
      return t;
    }
    e = n, n = e.parentNode;
  }
  return null;
}
function Sa(e) {
  return e = e[Mn] || e[rr], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
}
function Ko(e) {
  if (e.tag === 5 || e.tag === 6)
    return e.stateNode;
  throw Error(V(33));
}
function Mc(e) {
  return e[Ks] || null;
}
var mf = [], qo = -1;
function Kr(e) {
  return { current: e };
}
function De(e) {
  0 > qo || (e.current = mf[qo], mf[qo] = null, qo--);
}
function Ne(e, t) {
  qo++, mf[qo] = e.current, e.current = t;
}
var Ur = {}, Rt = Kr(Ur), Ft = Kr(!1), bo = Ur;
function pi(e, t) {
  var n = e.type.contextTypes;
  if (!n)
    return Ur;
  var r = e.stateNode;
  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t)
    return r.__reactInternalMemoizedMaskedChildContext;
  var o = {}, i;
  for (i in n)
    o[i] = t[i];
  return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = o), o;
}
function Dt(e) {
  return e = e.childContextTypes, e != null;
}
function Gl() {
  De(Ft), De(Rt);
}
function Sg(e, t, n) {
  if (Rt.current !== Ur)
    throw Error(V(168));
  Ne(Rt, t), Ne(Ft, n);
}
function w1(e, t, n) {
  var r = e.stateNode;
  if (t = t.childContextTypes, typeof r.getChildContext != "function")
    return n;
  r = r.getChildContext();
  for (var o in r)
    if (!(o in t))
      throw Error(V(108, EC(e) || "Unknown", o));
  return Ve({}, n, r);
}
function Ql(e) {
  return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Ur, bo = Rt.current, Ne(Rt, e), Ne(Ft, Ft.current), !0;
}
function Cg(e, t, n) {
  var r = e.stateNode;
  if (!r)
    throw Error(V(169));
  n ? (e = w1(e, t, bo), r.__reactInternalMemoizedMergedChildContext = e, De(Ft), De(Rt), Ne(Rt, e)) : De(Ft), Ne(Ft, n);
}
var Gn = null, Ic = !1, id = !1;
function S1(e) {
  Gn === null ? Gn = [e] : Gn.push(e);
}
function Wk(e) {
  Ic = !0, S1(e);
}
function qr() {
  if (!id && Gn !== null) {
    id = !0;
    var e = 0, t = $e;
    try {
      var n = Gn;
      for ($e = 1; e < n.length; e++) {
        var r = n[e];
        do
          r = r(!0);
        while (r !== null);
      }
      Gn = null, Ic = !1;
    } catch (o) {
      throw Gn !== null && (Gn = Gn.slice(e + 1)), Xy(Lp, qr), o;
    } finally {
      $e = t, id = !1;
    }
  }
  return null;
}
var Go = [], Qo = 0, Jl = null, Zl = 0, nn = [], rn = 0, xo = null, Qn = 1, Jn = "";
function ro(e, t) {
  Go[Qo++] = Zl, Go[Qo++] = Jl, Jl = e, Zl = t;
}
function C1(e, t, n) {
  nn[rn++] = Qn, nn[rn++] = Jn, nn[rn++] = xo, xo = e;
  var r = Qn;
  e = Jn;
  var o = 32 - kn(r) - 1;
  r &= ~(1 << o), n += 1;
  var i = 32 - kn(t) + o;
  if (30 < i) {
    var s = o - o % 5;
    i = (r & (1 << s) - 1).toString(32), r >>= s, o -= s, Qn = 1 << 32 - kn(t) + o | n << o | r, Jn = i + e;
  } else
    Qn = 1 << i | n << o | r, Jn = e;
}
function Vp(e) {
  e.return !== null && (ro(e, 1), C1(e, 1, 0));
}
function Yp(e) {
  for (; e === Jl; )
    Jl = Go[--Qo], Go[Qo] = null, Zl = Go[--Qo], Go[Qo] = null;
  for (; e === xo; )
    xo = nn[--rn], nn[rn] = null, Jn = nn[--rn], nn[rn] = null, Qn = nn[--rn], nn[rn] = null;
}
var Xt = null, Yt = null, je = !1, Sn = null;
function k1(e, t) {
  var n = on(5, null, null, 0);
  n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
}
function kg(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, Xt = e, Yt = Nr(t.firstChild), !0) : !1;
    case 6:
      return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, Xt = e, Yt = null, !0) : !1;
    case 13:
      return t = t.nodeType !== 8 ? null : t, t !== null ? (n = xo !== null ? { id: Qn, overflow: Jn } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = on(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, Xt = e, Yt = null, !0) : !1;
    default:
      return !1;
  }
}
function gf(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function vf(e) {
  if (je) {
    var t = Yt;
    if (t) {
      var n = t;
      if (!kg(e, t)) {
        if (gf(e))
          throw Error(V(418));
        t = Nr(n.nextSibling);
        var r = Xt;
        t && kg(e, t) ? k1(r, n) : (e.flags = e.flags & -4097 | 2, je = !1, Xt = e);
      }
    } else {
      if (gf(e))
        throw Error(V(418));
      e.flags = e.flags & -4097 | 2, je = !1, Xt = e;
    }
  }
}
function Eg(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; )
    e = e.return;
  Xt = e;
}
function Xa(e) {
  if (e !== Xt)
    return !1;
  if (!je)
    return Eg(e), je = !0, !1;
  var t;
  if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !ff(e.type, e.memoizedProps)), t && (t = Yt)) {
    if (gf(e))
      throw E1(), Error(V(418));
    for (; t; )
      k1(e, t), t = Nr(t.nextSibling);
  }
  if (Eg(e), e.tag === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e)
      throw Error(V(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              Yt = Nr(e.nextSibling);
              break e;
            }
            t--;
          } else
            n !== "$" && n !== "$!" && n !== "$?" || t++;
        }
        e = e.nextSibling;
      }
      Yt = null;
    }
  } else
    Yt = Xt ? Nr(e.stateNode.nextSibling) : null;
  return !0;
}
function E1() {
  for (var e = Yt; e; )
    e = Nr(e.nextSibling);
}
function hi() {
  Yt = Xt = null, je = !1;
}
function Xp(e) {
  Sn === null ? Sn = [e] : Sn.push(e);
}
var Uk = ur.ReactCurrentBatchConfig;
function yn(e, t) {
  if (e && e.defaultProps) {
    t = Ve({}, t), e = e.defaultProps;
    for (var n in e)
      t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
var ec = Kr(null), tc = null, Jo = null, Kp = null;
function qp() {
  Kp = Jo = tc = null;
}
function Gp(e) {
  var t = ec.current;
  De(ec), e._currentValue = t;
}
function yf(e, t, n) {
  for (; e !== null; ) {
    var r = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, r !== null && (r.childLanes |= t)) : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t), e === n)
      break;
    e = e.return;
  }
}
function ai(e, t) {
  tc = e, Kp = Jo = null, e = e.dependencies, e !== null && e.firstContext !== null && ((e.lanes & t) !== 0 && (Lt = !0), e.firstContext = null);
}
function cn(e) {
  var t = e._currentValue;
  if (Kp !== e)
    if (e = { context: e, memoizedValue: t, next: null }, Jo === null) {
      if (tc === null)
        throw Error(V(308));
      Jo = e, tc.dependencies = { lanes: 0, firstContext: e };
    } else
      Jo = Jo.next = e;
  return t;
}
var fo = null;
function Qp(e) {
  fo === null ? fo = [e] : fo.push(e);
}
function R1(e, t, n, r) {
  var o = t.interleaved;
  return o === null ? (n.next = n, Qp(t)) : (n.next = o.next, o.next = n), t.interleaved = n, or(e, r);
}
function or(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; )
    e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
  return n.tag === 3 ? n.stateNode : null;
}
var xr = !1;
function Jp(e) {
  e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function T1(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
}
function Zn(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function Lr(e, t, n) {
  var r = e.updateQueue;
  if (r === null)
    return null;
  if (r = r.shared, (ke & 2) !== 0) {
    var o = r.pending;
    return o === null ? t.next = t : (t.next = o.next, o.next = t), r.pending = t, or(e, n);
  }
  return o = r.interleaved, o === null ? (t.next = t, Qp(r)) : (t.next = o.next, o.next = t), r.interleaved = t, or(e, n);
}
function bl(e, t, n) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
    var r = t.lanes;
    r &= e.pendingLanes, n |= r, t.lanes = n, Fp(e, n);
  }
}
function Rg(e, t) {
  var n = e.updateQueue, r = e.alternate;
  if (r !== null && (r = r.updateQueue, n === r)) {
    var o = null, i = null;
    if (n = n.firstBaseUpdate, n !== null) {
      do {
        var s = { eventTime: n.eventTime, lane: n.lane, tag: n.tag, payload: n.payload, callback: n.callback, next: null };
        i === null ? o = i = s : i = i.next = s, n = n.next;
      } while (n !== null);
      i === null ? o = i = t : i = i.next = t;
    } else
      o = i = t;
    n = { baseState: r.baseState, firstBaseUpdate: o, lastBaseUpdate: i, shared: r.shared, effects: r.effects }, e.updateQueue = n;
    return;
  }
  e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
}
function nc(e, t, n, r) {
  var o = e.updateQueue;
  xr = !1;
  var i = o.firstBaseUpdate, s = o.lastBaseUpdate, a = o.shared.pending;
  if (a !== null) {
    o.shared.pending = null;
    var l = a, c = l.next;
    l.next = null, s === null ? i = c : s.next = c, s = l;
    var u = e.alternate;
    u !== null && (u = u.updateQueue, a = u.lastBaseUpdate, a !== s && (a === null ? u.firstBaseUpdate = c : a.next = c, u.lastBaseUpdate = l));
  }
  if (i !== null) {
    var f = o.baseState;
    s = 0, u = c = l = null, a = i;
    do {
      var h = a.lane, y = a.eventTime;
      if ((r & h) === h) {
        u !== null && (u = u.next = {
          eventTime: y,
          lane: 0,
          tag: a.tag,
          payload: a.payload,
          callback: a.callback,
          next: null
        });
        e: {
          var d = e, m = a;
          switch (h = t, y = n, m.tag) {
            case 1:
              if (d = m.payload, typeof d == "function") {
                f = d.call(y, f, h);
                break e;
              }
              f = d;
              break e;
            case 3:
              d.flags = d.flags & -65537 | 128;
            case 0:
              if (d = m.payload, h = typeof d == "function" ? d.call(y, f, h) : d, h == null)
                break e;
              f = Ve({}, f, h);
              break e;
            case 2:
              xr = !0;
          }
        }
        a.callback !== null && a.lane !== 0 && (e.flags |= 64, h = o.effects, h === null ? o.effects = [a] : h.push(a));
      } else
        y = { eventTime: y, lane: h, tag: a.tag, payload: a.payload, callback: a.callback, next: null }, u === null ? (c = u = y, l = f) : u = u.next = y, s |= h;
      if (a = a.next, a === null) {
        if (a = o.shared.pending, a === null)
          break;
        h = a, a = h.next, h.next = null, o.lastBaseUpdate = h, o.shared.pending = null;
      }
    } while (1);
    if (u === null && (l = f), o.baseState = l, o.firstBaseUpdate = c, o.lastBaseUpdate = u, t = o.shared.interleaved, t !== null) {
      o = t;
      do
        s |= o.lane, o = o.next;
      while (o !== t);
    } else
      i === null && (o.shared.lanes = 0);
    So |= s, e.lanes = s, e.memoizedState = f;
  }
}
function Tg(e, t, n) {
  if (e = t.effects, t.effects = null, e !== null)
    for (t = 0; t < e.length; t++) {
      var r = e[t], o = r.callback;
      if (o !== null) {
        if (r.callback = null, r = n, typeof o != "function")
          throw Error(V(191, o));
        o.call(r);
      }
    }
}
var P1 = new Ry.Component().refs;
function bf(e, t, n, r) {
  t = e.memoizedState, n = n(r, t), n = n == null ? t : Ve({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
}
var Ac = { isMounted: function(e) {
  return (e = e._reactInternals) ? _o(e) === e : !1;
}, enqueueSetState: function(e, t, n) {
  e = e._reactInternals;
  var r = Ot(), o = Dr(e), i = Zn(r, o);
  i.payload = t, n != null && (i.callback = n), t = Lr(e, i, o), t !== null && (En(t, e, o, r), bl(t, e, o));
}, enqueueReplaceState: function(e, t, n) {
  e = e._reactInternals;
  var r = Ot(), o = Dr(e), i = Zn(r, o);
  i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Lr(e, i, o), t !== null && (En(t, e, o, r), bl(t, e, o));
}, enqueueForceUpdate: function(e, t) {
  e = e._reactInternals;
  var n = Ot(), r = Dr(e), o = Zn(n, r);
  o.tag = 2, t != null && (o.callback = t), t = Lr(e, o, r), t !== null && (En(t, e, r, n), bl(t, e, r));
} };
function Pg(e, t, n, r, o, i, s) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, i, s) : t.prototype && t.prototype.isPureReactComponent ? !Vs(n, r) || !Vs(o, i) : !0;
}
function O1(e, t, n) {
  var r = !1, o = Ur, i = t.contextType;
  return typeof i == "object" && i !== null ? i = cn(i) : (o = Dt(t) ? bo : Rt.current, r = t.contextTypes, i = (r = r != null) ? pi(e, o) : Ur), t = new t(n, i), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Ac, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = o, e.__reactInternalMemoizedMaskedChildContext = i), t;
}
function Og(e, t, n, r) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Ac.enqueueReplaceState(t, t.state, null);
}
function xf(e, t, n, r) {
  var o = e.stateNode;
  o.props = n, o.state = e.memoizedState, o.refs = P1, Jp(e);
  var i = t.contextType;
  typeof i == "object" && i !== null ? o.context = cn(i) : (i = Dt(t) ? bo : Rt.current, o.context = pi(e, i)), o.state = e.memoizedState, i = t.getDerivedStateFromProps, typeof i == "function" && (bf(e, t, i, n), o.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof o.getSnapshotBeforeUpdate == "function" || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (t = o.state, typeof o.componentWillMount == "function" && o.componentWillMount(), typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount(), t !== o.state && Ac.enqueueReplaceState(o, o.state, null), nc(e, n, o, r), o.state = e.memoizedState), typeof o.componentDidMount == "function" && (e.flags |= 4194308);
}
function qi(e, t, n) {
  if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
    if (n._owner) {
      if (n = n._owner, n) {
        if (n.tag !== 1)
          throw Error(V(309));
        var r = n.stateNode;
      }
      if (!r)
        throw Error(V(147, e));
      var o = r, i = "" + e;
      return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === i ? t.ref : (t = function(s) {
        var a = o.refs;
        a === P1 && (a = o.refs = {}), s === null ? delete a[i] : a[i] = s;
      }, t._stringRef = i, t);
    }
    if (typeof e != "string")
      throw Error(V(284));
    if (!n._owner)
      throw Error(V(290, e));
  }
  return e;
}
function Ka(e, t) {
  throw e = Object.prototype.toString.call(t), Error(V(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
}
function $g(e) {
  var t = e._init;
  return t(e._payload);
}
function $1(e) {
  function t(g, p) {
    if (e) {
      var v = g.deletions;
      v === null ? (g.deletions = [p], g.flags |= 16) : v.push(p);
    }
  }
  function n(g, p) {
    if (!e)
      return null;
    for (; p !== null; )
      t(g, p), p = p.sibling;
    return null;
  }
  function r(g, p) {
    for (g = /* @__PURE__ */ new Map(); p !== null; )
      p.key !== null ? g.set(p.key, p) : g.set(p.index, p), p = p.sibling;
    return g;
  }
  function o(g, p) {
    return g = zr(g, p), g.index = 0, g.sibling = null, g;
  }
  function i(g, p, v) {
    return g.index = v, e ? (v = g.alternate, v !== null ? (v = v.index, v < p ? (g.flags |= 2, p) : v) : (g.flags |= 2, p)) : (g.flags |= 1048576, p);
  }
  function s(g) {
    return e && g.alternate === null && (g.flags |= 2), g;
  }
  function a(g, p, v, b) {
    return p === null || p.tag !== 6 ? (p = fd(v, g.mode, b), p.return = g, p) : (p = o(p, v), p.return = g, p);
  }
  function l(g, p, v, b) {
    var C = v.type;
    return C === Ho ? u(g, p, v.props.children, b, v.key) : p !== null && (p.elementType === C || typeof C == "object" && C !== null && C.$$typeof === br && $g(C) === p.type) ? (b = o(p, v.props), b.ref = qi(g, p, v), b.return = g, b) : (b = El(v.type, v.key, v.props, null, g.mode, b), b.ref = qi(g, p, v), b.return = g, b);
  }
  function c(g, p, v, b) {
    return p === null || p.tag !== 4 || p.stateNode.containerInfo !== v.containerInfo || p.stateNode.implementation !== v.implementation ? (p = pd(v, g.mode, b), p.return = g, p) : (p = o(p, v.children || []), p.return = g, p);
  }
  function u(g, p, v, b, C) {
    return p === null || p.tag !== 7 ? (p = go(v, g.mode, b, C), p.return = g, p) : (p = o(p, v), p.return = g, p);
  }
  function f(g, p, v) {
    if (typeof p == "string" && p !== "" || typeof p == "number")
      return p = fd("" + p, g.mode, v), p.return = g, p;
    if (typeof p == "object" && p !== null) {
      switch (p.$$typeof) {
        case Fa:
          return v = El(p.type, p.key, p.props, null, g.mode, v), v.ref = qi(g, null, p), v.return = g, v;
        case Uo:
          return p = pd(p, g.mode, v), p.return = g, p;
        case br:
          var b = p._init;
          return f(g, b(p._payload), v);
      }
      if (us(p) || Hi(p))
        return p = go(p, g.mode, v, null), p.return = g, p;
      Ka(g, p);
    }
    return null;
  }
  function h(g, p, v, b) {
    var C = p !== null ? p.key : null;
    if (typeof v == "string" && v !== "" || typeof v == "number")
      return C !== null ? null : a(g, p, "" + v, b);
    if (typeof v == "object" && v !== null) {
      switch (v.$$typeof) {
        case Fa:
          return v.key === C ? l(g, p, v, b) : null;
        case Uo:
          return v.key === C ? c(g, p, v, b) : null;
        case br:
          return C = v._init, h(
            g,
            p,
            C(v._payload),
            b
          );
      }
      if (us(v) || Hi(v))
        return C !== null ? null : u(g, p, v, b, null);
      Ka(g, v);
    }
    return null;
  }
  function y(g, p, v, b, C) {
    if (typeof b == "string" && b !== "" || typeof b == "number")
      return g = g.get(v) || null, a(p, g, "" + b, C);
    if (typeof b == "object" && b !== null) {
      switch (b.$$typeof) {
        case Fa:
          return g = g.get(b.key === null ? v : b.key) || null, l(p, g, b, C);
        case Uo:
          return g = g.get(b.key === null ? v : b.key) || null, c(p, g, b, C);
        case br:
          var E = b._init;
          return y(g, p, v, E(b._payload), C);
      }
      if (us(b) || Hi(b))
        return g = g.get(v) || null, u(p, g, b, C, null);
      Ka(p, b);
    }
    return null;
  }
  function d(g, p, v, b) {
    for (var C = null, E = null, R = p, T = p = 0, O = null; R !== null && T < v.length; T++) {
      R.index > T ? (O = R, R = null) : O = R.sibling;
      var P = h(g, R, v[T], b);
      if (P === null) {
        R === null && (R = O);
        break;
      }
      e && R && P.alternate === null && t(g, R), p = i(P, p, T), E === null ? C = P : E.sibling = P, E = P, R = O;
    }
    if (T === v.length)
      return n(g, R), je && ro(g, T), C;
    if (R === null) {
      for (; T < v.length; T++)
        R = f(g, v[T], b), R !== null && (p = i(R, p, T), E === null ? C = R : E.sibling = R, E = R);
      return je && ro(g, T), C;
    }
    for (R = r(g, R); T < v.length; T++)
      O = y(R, g, T, v[T], b), O !== null && (e && O.alternate !== null && R.delete(O.key === null ? T : O.key), p = i(O, p, T), E === null ? C = O : E.sibling = O, E = O);
    return e && R.forEach(function($) {
      return t(g, $);
    }), je && ro(g, T), C;
  }
  function m(g, p, v, b) {
    var C = Hi(v);
    if (typeof C != "function")
      throw Error(V(150));
    if (v = C.call(v), v == null)
      throw Error(V(151));
    for (var E = C = null, R = p, T = p = 0, O = null, P = v.next(); R !== null && !P.done; T++, P = v.next()) {
      R.index > T ? (O = R, R = null) : O = R.sibling;
      var $ = h(g, R, P.value, b);
      if ($ === null) {
        R === null && (R = O);
        break;
      }
      e && R && $.alternate === null && t(g, R), p = i($, p, T), E === null ? C = $ : E.sibling = $, E = $, R = O;
    }
    if (P.done)
      return n(
        g,
        R
      ), je && ro(g, T), C;
    if (R === null) {
      for (; !P.done; T++, P = v.next())
        P = f(g, P.value, b), P !== null && (p = i(P, p, T), E === null ? C = P : E.sibling = P, E = P);
      return je && ro(g, T), C;
    }
    for (R = r(g, R); !P.done; T++, P = v.next())
      P = y(R, g, T, P.value, b), P !== null && (e && P.alternate !== null && R.delete(P.key === null ? T : P.key), p = i(P, p, T), E === null ? C = P : E.sibling = P, E = P);
    return e && R.forEach(function(B) {
      return t(g, B);
    }), je && ro(g, T), C;
  }
  function w(g, p, v, b) {
    if (typeof v == "object" && v !== null && v.type === Ho && v.key === null && (v = v.props.children), typeof v == "object" && v !== null) {
      switch (v.$$typeof) {
        case Fa:
          e: {
            for (var C = v.key, E = p; E !== null; ) {
              if (E.key === C) {
                if (C = v.type, C === Ho) {
                  if (E.tag === 7) {
                    n(g, E.sibling), p = o(E, v.props.children), p.return = g, g = p;
                    break e;
                  }
                } else if (E.elementType === C || typeof C == "object" && C !== null && C.$$typeof === br && $g(C) === E.type) {
                  n(g, E.sibling), p = o(E, v.props), p.ref = qi(g, E, v), p.return = g, g = p;
                  break e;
                }
                n(g, E);
                break;
              } else
                t(g, E);
              E = E.sibling;
            }
            v.type === Ho ? (p = go(v.props.children, g.mode, b, v.key), p.return = g, g = p) : (b = El(v.type, v.key, v.props, null, g.mode, b), b.ref = qi(g, p, v), b.return = g, g = b);
          }
          return s(g);
        case Uo:
          e: {
            for (E = v.key; p !== null; ) {
              if (p.key === E)
                if (p.tag === 4 && p.stateNode.containerInfo === v.containerInfo && p.stateNode.implementation === v.implementation) {
                  n(g, p.sibling), p = o(p, v.children || []), p.return = g, g = p;
                  break e;
                } else {
                  n(g, p);
                  break;
                }
              else
                t(g, p);
              p = p.sibling;
            }
            p = pd(v, g.mode, b), p.return = g, g = p;
          }
          return s(g);
        case br:
          return E = v._init, w(g, p, E(v._payload), b);
      }
      if (us(v))
        return d(g, p, v, b);
      if (Hi(v))
        return m(g, p, v, b);
      Ka(g, v);
    }
    return typeof v == "string" && v !== "" || typeof v == "number" ? (v = "" + v, p !== null && p.tag === 6 ? (n(g, p.sibling), p = o(p, v), p.return = g, g = p) : (n(g, p), p = fd(v, g.mode, b), p.return = g, g = p), s(g)) : n(g, p);
  }
  return w;
}
var mi = $1(!0), _1 = $1(!1), Ca = {}, Ln = Kr(Ca), qs = Kr(Ca), Gs = Kr(Ca);
function po(e) {
  if (e === Ca)
    throw Error(V(174));
  return e;
}
function Zp(e, t) {
  switch (Ne(Gs, t), Ne(qs, e), Ne(Ln, Ca), e = t.nodeType, e) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : Qd(null, "");
      break;
    default:
      e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Qd(t, e);
  }
  De(Ln), Ne(Ln, t);
}
function gi() {
  De(Ln), De(qs), De(Gs);
}
function M1(e) {
  po(Gs.current);
  var t = po(Ln.current), n = Qd(t, e.type);
  t !== n && (Ne(qs, e), Ne(Ln, n));
}
function eh(e) {
  qs.current === e && (De(Ln), De(qs));
}
var Ue = Kr(0);
function rc(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var n = t.memoizedState;
      if (n !== null && (n = n.dehydrated, n === null || n.data === "$?" || n.data === "$!"))
        return t;
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if ((t.flags & 128) !== 0)
        return t;
    } else if (t.child !== null) {
      t.child.return = t, t = t.child;
      continue;
    }
    if (t === e)
      break;
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e)
        return null;
      t = t.return;
    }
    t.sibling.return = t.return, t = t.sibling;
  }
  return null;
}
var sd = [];
function th() {
  for (var e = 0; e < sd.length; e++)
    sd[e]._workInProgressVersionPrimary = null;
  sd.length = 0;
}
var xl = ur.ReactCurrentDispatcher, ad = ur.ReactCurrentBatchConfig, wo = 0, He = null, it = null, lt = null, oc = !1, Es = !1, Qs = 0, Hk = 0;
function xt() {
  throw Error(V(321));
}
function nh(e, t) {
  if (t === null)
    return !1;
  for (var n = 0; n < t.length && n < e.length; n++)
    if (!Rn(e[n], t[n]))
      return !1;
  return !0;
}
function rh(e, t, n, r, o, i) {
  if (wo = i, He = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, xl.current = e === null || e.memoizedState === null ? Kk : qk, e = n(r, o), Es) {
    i = 0;
    do {
      if (Es = !1, Qs = 0, 25 <= i)
        throw Error(V(301));
      i += 1, lt = it = null, t.updateQueue = null, xl.current = Gk, e = n(r, o);
    } while (Es);
  }
  if (xl.current = ic, t = it !== null && it.next !== null, wo = 0, lt = it = He = null, oc = !1, t)
    throw Error(V(300));
  return e;
}
function oh() {
  var e = Qs !== 0;
  return Qs = 0, e;
}
function On() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return lt === null ? He.memoizedState = lt = e : lt = lt.next = e, lt;
}
function un() {
  if (it === null) {
    var e = He.alternate;
    e = e !== null ? e.memoizedState : null;
  } else
    e = it.next;
  var t = lt === null ? He.memoizedState : lt.next;
  if (t !== null)
    lt = t, it = e;
  else {
    if (e === null)
      throw Error(V(310));
    it = e, e = { memoizedState: it.memoizedState, baseState: it.baseState, baseQueue: it.baseQueue, queue: it.queue, next: null }, lt === null ? He.memoizedState = lt = e : lt = lt.next = e;
  }
  return lt;
}
function Js(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function ld(e) {
  var t = un(), n = t.queue;
  if (n === null)
    throw Error(V(311));
  n.lastRenderedReducer = e;
  var r = it, o = r.baseQueue, i = n.pending;
  if (i !== null) {
    if (o !== null) {
      var s = o.next;
      o.next = i.next, i.next = s;
    }
    r.baseQueue = o = i, n.pending = null;
  }
  if (o !== null) {
    i = o.next, r = r.baseState;
    var a = s = null, l = null, c = i;
    do {
      var u = c.lane;
      if ((wo & u) === u)
        l !== null && (l = l.next = { lane: 0, action: c.action, hasEagerState: c.hasEagerState, eagerState: c.eagerState, next: null }), r = c.hasEagerState ? c.eagerState : e(r, c.action);
      else {
        var f = {
          lane: u,
          action: c.action,
          hasEagerState: c.hasEagerState,
          eagerState: c.eagerState,
          next: null
        };
        l === null ? (a = l = f, s = r) : l = l.next = f, He.lanes |= u, So |= u;
      }
      c = c.next;
    } while (c !== null && c !== i);
    l === null ? s = r : l.next = a, Rn(r, t.memoizedState) || (Lt = !0), t.memoizedState = r, t.baseState = s, t.baseQueue = l, n.lastRenderedState = r;
  }
  if (e = n.interleaved, e !== null) {
    o = e;
    do
      i = o.lane, He.lanes |= i, So |= i, o = o.next;
    while (o !== e);
  } else
    o === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function cd(e) {
  var t = un(), n = t.queue;
  if (n === null)
    throw Error(V(311));
  n.lastRenderedReducer = e;
  var r = n.dispatch, o = n.pending, i = t.memoizedState;
  if (o !== null) {
    n.pending = null;
    var s = o = o.next;
    do
      i = e(i, s.action), s = s.next;
    while (s !== o);
    Rn(i, t.memoizedState) || (Lt = !0), t.memoizedState = i, t.baseQueue === null && (t.baseState = i), n.lastRenderedState = i;
  }
  return [i, r];
}
function I1() {
}
function A1(e, t) {
  var n = He, r = un(), o = t(), i = !Rn(r.memoizedState, o);
  if (i && (r.memoizedState = o, Lt = !0), r = r.queue, ih(F1.bind(null, n, r, e), [e]), r.getSnapshot !== t || i || lt !== null && lt.memoizedState.tag & 1) {
    if (n.flags |= 2048, Zs(9, L1.bind(null, n, r, o, t), void 0, null), ut === null)
      throw Error(V(349));
    (wo & 30) !== 0 || N1(n, t, o);
  }
  return o;
}
function N1(e, t, n) {
  e.flags |= 16384, e = { getSnapshot: t, value: n }, t = He.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, He.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
}
function L1(e, t, n, r) {
  t.value = n, t.getSnapshot = r, D1(t) && z1(e);
}
function F1(e, t, n) {
  return n(function() {
    D1(t) && z1(e);
  });
}
function D1(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !Rn(e, n);
  } catch {
    return !0;
  }
}
function z1(e) {
  var t = or(e, 1);
  t !== null && En(t, e, 1, -1);
}
function _g(e) {
  var t = On();
  return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Js, lastRenderedState: e }, t.queue = e, e = e.dispatch = Xk.bind(null, He, e), [t.memoizedState, e];
}
function Zs(e, t, n, r) {
  return e = { tag: e, create: t, destroy: n, deps: r, next: null }, t = He.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, He.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
}
function B1() {
  return un().memoizedState;
}
function wl(e, t, n, r) {
  var o = On();
  He.flags |= e, o.memoizedState = Zs(1 | t, n, void 0, r === void 0 ? null : r);
}
function Nc(e, t, n, r) {
  var o = un();
  r = r === void 0 ? null : r;
  var i = void 0;
  if (it !== null) {
    var s = it.memoizedState;
    if (i = s.destroy, r !== null && nh(r, s.deps)) {
      o.memoizedState = Zs(t, n, i, r);
      return;
    }
  }
  He.flags |= e, o.memoizedState = Zs(1 | t, n, i, r);
}
function Mg(e, t) {
  return wl(8390656, 8, e, t);
}
function ih(e, t) {
  return Nc(2048, 8, e, t);
}
function j1(e, t) {
  return Nc(4, 2, e, t);
}
function W1(e, t) {
  return Nc(4, 4, e, t);
}
function U1(e, t) {
  if (typeof t == "function")
    return e = e(), t(e), function() {
      t(null);
    };
  if (t != null)
    return e = e(), t.current = e, function() {
      t.current = null;
    };
}
function H1(e, t, n) {
  return n = n != null ? n.concat([e]) : null, Nc(4, 4, U1.bind(null, t, e), n);
}
function sh() {
}
function V1(e, t) {
  var n = un();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && nh(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
}
function Y1(e, t) {
  var n = un();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && nh(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
}
function X1(e, t, n) {
  return (wo & 21) === 0 ? (e.baseState && (e.baseState = !1, Lt = !0), e.memoizedState = n) : (Rn(n, t) || (n = Gy(), He.lanes |= n, So |= n, e.baseState = !0), t);
}
function Vk(e, t) {
  var n = $e;
  $e = n !== 0 && 4 > n ? n : 4, e(!0);
  var r = ad.transition;
  ad.transition = {};
  try {
    e(!1), t();
  } finally {
    $e = n, ad.transition = r;
  }
}
function K1() {
  return un().memoizedState;
}
function Yk(e, t, n) {
  var r = Dr(e);
  if (n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }, q1(e))
    G1(t, n);
  else if (n = R1(e, t, n, r), n !== null) {
    var o = Ot();
    En(n, e, r, o), Q1(n, t, r);
  }
}
function Xk(e, t, n) {
  var r = Dr(e), o = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (q1(e))
    G1(t, o);
  else {
    var i = e.alternate;
    if (e.lanes === 0 && (i === null || i.lanes === 0) && (i = t.lastRenderedReducer, i !== null))
      try {
        var s = t.lastRenderedState, a = i(s, n);
        if (o.hasEagerState = !0, o.eagerState = a, Rn(a, s)) {
          var l = t.interleaved;
          l === null ? (o.next = o, Qp(t)) : (o.next = l.next, l.next = o), t.interleaved = o;
          return;
        }
      } catch {
      } finally {
      }
    n = R1(e, t, o, r), n !== null && (o = Ot(), En(n, e, r, o), Q1(n, t, r));
  }
}
function q1(e) {
  var t = e.alternate;
  return e === He || t !== null && t === He;
}
function G1(e, t) {
  Es = oc = !0;
  var n = e.pending;
  n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
}
function Q1(e, t, n) {
  if ((n & 4194240) !== 0) {
    var r = t.lanes;
    r &= e.pendingLanes, n |= r, t.lanes = n, Fp(e, n);
  }
}
var ic = { readContext: cn, useCallback: xt, useContext: xt, useEffect: xt, useImperativeHandle: xt, useInsertionEffect: xt, useLayoutEffect: xt, useMemo: xt, useReducer: xt, useRef: xt, useState: xt, useDebugValue: xt, useDeferredValue: xt, useTransition: xt, useMutableSource: xt, useSyncExternalStore: xt, useId: xt, unstable_isNewReconciler: !1 }, Kk = { readContext: cn, useCallback: function(e, t) {
  return On().memoizedState = [e, t === void 0 ? null : t], e;
}, useContext: cn, useEffect: Mg, useImperativeHandle: function(e, t, n) {
  return n = n != null ? n.concat([e]) : null, wl(
    4194308,
    4,
    U1.bind(null, t, e),
    n
  );
}, useLayoutEffect: function(e, t) {
  return wl(4194308, 4, e, t);
}, useInsertionEffect: function(e, t) {
  return wl(4, 2, e, t);
}, useMemo: function(e, t) {
  var n = On();
  return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
}, useReducer: function(e, t, n) {
  var r = On();
  return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, r.queue = e, e = e.dispatch = Yk.bind(null, He, e), [r.memoizedState, e];
}, useRef: function(e) {
  var t = On();
  return e = { current: e }, t.memoizedState = e;
}, useState: _g, useDebugValue: sh, useDeferredValue: function(e) {
  return On().memoizedState = e;
}, useTransition: function() {
  var e = _g(!1), t = e[0];
  return e = Vk.bind(null, e[1]), On().memoizedState = e, [t, e];
}, useMutableSource: function() {
}, useSyncExternalStore: function(e, t, n) {
  var r = He, o = On();
  if (je) {
    if (n === void 0)
      throw Error(V(407));
    n = n();
  } else {
    if (n = t(), ut === null)
      throw Error(V(349));
    (wo & 30) !== 0 || N1(r, t, n);
  }
  o.memoizedState = n;
  var i = { value: n, getSnapshot: t };
  return o.queue = i, Mg(F1.bind(
    null,
    r,
    i,
    e
  ), [e]), r.flags |= 2048, Zs(9, L1.bind(null, r, i, n, t), void 0, null), n;
}, useId: function() {
  var e = On(), t = ut.identifierPrefix;
  if (je) {
    var n = Jn, r = Qn;
    n = (r & ~(1 << 32 - kn(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = Qs++, 0 < n && (t += "H" + n.toString(32)), t += ":";
  } else
    n = Hk++, t = ":" + t + "r" + n.toString(32) + ":";
  return e.memoizedState = t;
}, unstable_isNewReconciler: !1 }, qk = {
  readContext: cn,
  useCallback: V1,
  useContext: cn,
  useEffect: ih,
  useImperativeHandle: H1,
  useInsertionEffect: j1,
  useLayoutEffect: W1,
  useMemo: Y1,
  useReducer: ld,
  useRef: B1,
  useState: function() {
    return ld(Js);
  },
  useDebugValue: sh,
  useDeferredValue: function(e) {
    var t = un();
    return X1(t, it.memoizedState, e);
  },
  useTransition: function() {
    var e = ld(Js)[0], t = un().memoizedState;
    return [e, t];
  },
  useMutableSource: I1,
  useSyncExternalStore: A1,
  useId: K1,
  unstable_isNewReconciler: !1
}, Gk = { readContext: cn, useCallback: V1, useContext: cn, useEffect: ih, useImperativeHandle: H1, useInsertionEffect: j1, useLayoutEffect: W1, useMemo: Y1, useReducer: cd, useRef: B1, useState: function() {
  return cd(Js);
}, useDebugValue: sh, useDeferredValue: function(e) {
  var t = un();
  return it === null ? t.memoizedState = e : X1(t, it.memoizedState, e);
}, useTransition: function() {
  var e = cd(Js)[0], t = un().memoizedState;
  return [e, t];
}, useMutableSource: I1, useSyncExternalStore: A1, useId: K1, unstable_isNewReconciler: !1 };
function vi(e, t) {
  try {
    var n = "", r = t;
    do
      n += kC(r), r = r.return;
    while (r);
    var o = n;
  } catch (i) {
    o = `
Error generating stack: ` + i.message + `
` + i.stack;
  }
  return { value: e, source: t, stack: o, digest: null };
}
function ud(e, t, n) {
  return { value: e, source: null, stack: n != null ? n : null, digest: t != null ? t : null };
}
function wf(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function() {
      throw n;
    });
  }
}
var Qk = typeof WeakMap == "function" ? WeakMap : Map;
function J1(e, t, n) {
  n = Zn(-1, n), n.tag = 3, n.payload = { element: null };
  var r = t.value;
  return n.callback = function() {
    ac || (ac = !0, _f = r), wf(e, t);
  }, n;
}
function Z1(e, t, n) {
  n = Zn(-1, n), n.tag = 3;
  var r = e.type.getDerivedStateFromError;
  if (typeof r == "function") {
    var o = t.value;
    n.payload = function() {
      return r(o);
    }, n.callback = function() {
      wf(e, t);
    };
  }
  var i = e.stateNode;
  return i !== null && typeof i.componentDidCatch == "function" && (n.callback = function() {
    wf(e, t), typeof r != "function" && (Fr === null ? Fr = /* @__PURE__ */ new Set([this]) : Fr.add(this));
    var s = t.stack;
    this.componentDidCatch(t.value, { componentStack: s !== null ? s : "" });
  }), n;
}
function Ig(e, t, n) {
  var r = e.pingCache;
  if (r === null) {
    r = e.pingCache = new Qk();
    var o = /* @__PURE__ */ new Set();
    r.set(t, o);
  } else
    o = r.get(t), o === void 0 && (o = /* @__PURE__ */ new Set(), r.set(t, o));
  o.has(n) || (o.add(n), e = dE.bind(null, e, t, n), t.then(e, e));
}
function Ag(e) {
  do {
    var t;
    if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t)
      return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Ng(e, t, n, r, o) {
  return (e.mode & 1) === 0 ? (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = Zn(-1, 1), t.tag = 2, Lr(n, t, 1))), n.lanes |= 1), e) : (e.flags |= 65536, e.lanes = o, e);
}
var Jk = ur.ReactCurrentOwner, Lt = !1;
function Pt(e, t, n, r) {
  t.child = e === null ? _1(t, null, n, r) : mi(t, e.child, n, r);
}
function Lg(e, t, n, r, o) {
  n = n.render;
  var i = t.ref;
  return ai(t, o), r = rh(e, t, n, r, i, o), n = oh(), e !== null && !Lt ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~o, ir(e, t, o)) : (je && n && Vp(t), t.flags |= 1, Pt(e, t, r, o), t.child);
}
function Fg(e, t, n, r, o) {
  if (e === null) {
    var i = n.type;
    return typeof i == "function" && !hh(i) && i.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = i, eb(e, t, i, r, o)) : (e = El(n.type, null, r, t, t.mode, o), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (i = e.child, (e.lanes & o) === 0) {
    var s = i.memoizedProps;
    if (n = n.compare, n = n !== null ? n : Vs, n(s, r) && e.ref === t.ref)
      return ir(e, t, o);
  }
  return t.flags |= 1, e = zr(i, r), e.ref = t.ref, e.return = t, t.child = e;
}
function eb(e, t, n, r, o) {
  if (e !== null) {
    var i = e.memoizedProps;
    if (Vs(i, r) && e.ref === t.ref)
      if (Lt = !1, t.pendingProps = r = i, (e.lanes & o) !== 0)
        (e.flags & 131072) !== 0 && (Lt = !0);
      else
        return t.lanes = e.lanes, ir(e, t, o);
  }
  return Sf(e, t, n, r, o);
}
function tb(e, t, n) {
  var r = t.pendingProps, o = r.children, i = e !== null ? e.memoizedState : null;
  if (r.mode === "hidden")
    if ((t.mode & 1) === 0)
      t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, Ne(ei, Vt), Vt |= n;
    else {
      if ((n & 1073741824) === 0)
        return e = i !== null ? i.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, Ne(ei, Vt), Vt |= e, null;
      t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, r = i !== null ? i.baseLanes : n, Ne(ei, Vt), Vt |= r;
    }
  else
    i !== null ? (r = i.baseLanes | n, t.memoizedState = null) : r = n, Ne(ei, Vt), Vt |= r;
  return Pt(e, t, o, n), t.child;
}
function nb(e, t) {
  var n = t.ref;
  (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
}
function Sf(e, t, n, r, o) {
  var i = Dt(n) ? bo : Rt.current;
  return i = pi(t, i), ai(t, o), n = rh(e, t, n, r, i, o), r = oh(), e !== null && !Lt ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~o, ir(e, t, o)) : (je && r && Vp(t), t.flags |= 1, Pt(e, t, n, o), t.child);
}
function Dg(e, t, n, r, o) {
  if (Dt(n)) {
    var i = !0;
    Ql(t);
  } else
    i = !1;
  if (ai(t, o), t.stateNode === null)
    Sl(e, t), O1(t, n, r), xf(t, n, r, o), r = !0;
  else if (e === null) {
    var s = t.stateNode, a = t.memoizedProps;
    s.props = a;
    var l = s.context, c = n.contextType;
    typeof c == "object" && c !== null ? c = cn(c) : (c = Dt(n) ? bo : Rt.current, c = pi(t, c));
    var u = n.getDerivedStateFromProps, f = typeof u == "function" || typeof s.getSnapshotBeforeUpdate == "function";
    f || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (a !== r || l !== c) && Og(t, s, r, c), xr = !1;
    var h = t.memoizedState;
    s.state = h, nc(t, r, s, o), l = t.memoizedState, a !== r || h !== l || Ft.current || xr ? (typeof u == "function" && (bf(t, n, u, r), l = t.memoizedState), (a = xr || Pg(t, n, a, r, h, l, c)) ? (f || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount()), typeof s.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), s.props = r, s.state = l, s.context = c, r = a) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
  } else {
    s = t.stateNode, T1(e, t), a = t.memoizedProps, c = t.type === t.elementType ? a : yn(t.type, a), s.props = c, f = t.pendingProps, h = s.context, l = n.contextType, typeof l == "object" && l !== null ? l = cn(l) : (l = Dt(n) ? bo : Rt.current, l = pi(t, l));
    var y = n.getDerivedStateFromProps;
    (u = typeof y == "function" || typeof s.getSnapshotBeforeUpdate == "function") || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (a !== f || h !== l) && Og(t, s, r, l), xr = !1, h = t.memoizedState, s.state = h, nc(t, r, s, o);
    var d = t.memoizedState;
    a !== f || h !== d || Ft.current || xr ? (typeof y == "function" && (bf(t, n, y, r), d = t.memoizedState), (c = xr || Pg(t, n, c, r, h, d, l) || !1) ? (u || typeof s.UNSAFE_componentWillUpdate != "function" && typeof s.componentWillUpdate != "function" || (typeof s.componentWillUpdate == "function" && s.componentWillUpdate(r, d, l), typeof s.UNSAFE_componentWillUpdate == "function" && s.UNSAFE_componentWillUpdate(r, d, l)), typeof s.componentDidUpdate == "function" && (t.flags |= 4), typeof s.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof s.componentDidUpdate != "function" || a === e.memoizedProps && h === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || a === e.memoizedProps && h === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = d), s.props = r, s.state = d, s.context = l, r = c) : (typeof s.componentDidUpdate != "function" || a === e.memoizedProps && h === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || a === e.memoizedProps && h === e.memoizedState || (t.flags |= 1024), r = !1);
  }
  return Cf(e, t, n, r, i, o);
}
function Cf(e, t, n, r, o, i) {
  nb(e, t);
  var s = (t.flags & 128) !== 0;
  if (!r && !s)
    return o && Cg(t, n, !1), ir(e, t, i);
  r = t.stateNode, Jk.current = t;
  var a = s && typeof n.getDerivedStateFromError != "function" ? null : r.render();
  return t.flags |= 1, e !== null && s ? (t.child = mi(t, e.child, null, i), t.child = mi(t, null, a, i)) : Pt(e, t, a, i), t.memoizedState = r.state, o && Cg(t, n, !0), t.child;
}
function rb(e) {
  var t = e.stateNode;
  t.pendingContext ? Sg(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Sg(e, t.context, !1), Zp(e, t.containerInfo);
}
function zg(e, t, n, r, o) {
  return hi(), Xp(o), t.flags |= 256, Pt(e, t, n, r), t.child;
}
var kf = { dehydrated: null, treeContext: null, retryLane: 0 };
function Ef(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function ob(e, t, n) {
  var r = t.pendingProps, o = Ue.current, i = !1, s = (t.flags & 128) !== 0, a;
  if ((a = s) || (a = e !== null && e.memoizedState === null ? !1 : (o & 2) !== 0), a ? (i = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (o |= 1), Ne(Ue, o & 1), e === null)
    return vf(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? ((t.mode & 1) === 0 ? t.lanes = 1 : e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824, null) : (s = r.children, e = r.fallback, i ? (r = t.mode, i = t.child, s = { mode: "hidden", children: s }, (r & 1) === 0 && i !== null ? (i.childLanes = 0, i.pendingProps = s) : i = Dc(s, r, 0, null), e = go(e, r, n, null), i.return = t, e.return = t, i.sibling = e, t.child = i, t.child.memoizedState = Ef(n), t.memoizedState = kf, e) : ah(t, s));
  if (o = e.memoizedState, o !== null && (a = o.dehydrated, a !== null))
    return Zk(e, t, s, r, a, o, n);
  if (i) {
    i = r.fallback, s = t.mode, o = e.child, a = o.sibling;
    var l = { mode: "hidden", children: r.children };
    return (s & 1) === 0 && t.child !== o ? (r = t.child, r.childLanes = 0, r.pendingProps = l, t.deletions = null) : (r = zr(o, l), r.subtreeFlags = o.subtreeFlags & 14680064), a !== null ? i = zr(a, i) : (i = go(i, s, n, null), i.flags |= 2), i.return = t, r.return = t, r.sibling = i, t.child = r, r = i, i = t.child, s = e.child.memoizedState, s = s === null ? Ef(n) : { baseLanes: s.baseLanes | n, cachePool: null, transitions: s.transitions }, i.memoizedState = s, i.childLanes = e.childLanes & ~n, t.memoizedState = kf, r;
  }
  return i = e.child, e = i.sibling, r = zr(i, { mode: "visible", children: r.children }), (t.mode & 1) === 0 && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
}
function ah(e, t) {
  return t = Dc({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
}
function qa(e, t, n, r) {
  return r !== null && Xp(r), mi(t, e.child, null, n), e = ah(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
}
function Zk(e, t, n, r, o, i, s) {
  if (n)
    return t.flags & 256 ? (t.flags &= -257, r = ud(Error(V(422))), qa(e, t, s, r)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (i = r.fallback, o = t.mode, r = Dc({ mode: "visible", children: r.children }, o, 0, null), i = go(i, o, s, null), i.flags |= 2, r.return = t, i.return = t, r.sibling = i, t.child = r, (t.mode & 1) !== 0 && mi(t, e.child, null, s), t.child.memoizedState = Ef(s), t.memoizedState = kf, i);
  if ((t.mode & 1) === 0)
    return qa(e, t, s, null);
  if (o.data === "$!") {
    if (r = o.nextSibling && o.nextSibling.dataset, r)
      var a = r.dgst;
    return r = a, i = Error(V(419)), r = ud(i, r, void 0), qa(e, t, s, r);
  }
  if (a = (s & e.childLanes) !== 0, Lt || a) {
    if (r = ut, r !== null) {
      switch (s & -s) {
        case 4:
          o = 2;
          break;
        case 16:
          o = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          o = 32;
          break;
        case 536870912:
          o = 268435456;
          break;
        default:
          o = 0;
      }
      o = (o & (r.suspendedLanes | s)) !== 0 ? 0 : o, o !== 0 && o !== i.retryLane && (i.retryLane = o, or(e, o), En(r, e, o, -1));
    }
    return ph(), r = ud(Error(V(421))), qa(e, t, s, r);
  }
  return o.data === "$?" ? (t.flags |= 128, t.child = e.child, t = fE.bind(null, e), o._reactRetry = t, null) : (e = i.treeContext, Yt = Nr(o.nextSibling), Xt = t, je = !0, Sn = null, e !== null && (nn[rn++] = Qn, nn[rn++] = Jn, nn[rn++] = xo, Qn = e.id, Jn = e.overflow, xo = t), t = ah(t, r.children), t.flags |= 4096, t);
}
function Bg(e, t, n) {
  e.lanes |= t;
  var r = e.alternate;
  r !== null && (r.lanes |= t), yf(e.return, t, n);
}
function dd(e, t, n, r, o) {
  var i = e.memoizedState;
  i === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: o } : (i.isBackwards = t, i.rendering = null, i.renderingStartTime = 0, i.last = r, i.tail = n, i.tailMode = o);
}
function ib(e, t, n) {
  var r = t.pendingProps, o = r.revealOrder, i = r.tail;
  if (Pt(e, t, r.children, n), r = Ue.current, (r & 2) !== 0)
    r = r & 1 | 2, t.flags |= 128;
  else {
    if (e !== null && (e.flags & 128) !== 0)
      e:
        for (e = t.child; e !== null; ) {
          if (e.tag === 13)
            e.memoizedState !== null && Bg(e, n, t);
          else if (e.tag === 19)
            Bg(e, n, t);
          else if (e.child !== null) {
            e.child.return = e, e = e.child;
            continue;
          }
          if (e === t)
            break e;
          for (; e.sibling === null; ) {
            if (e.return === null || e.return === t)
              break e;
            e = e.return;
          }
          e.sibling.return = e.return, e = e.sibling;
        }
    r &= 1;
  }
  if (Ne(Ue, r), (t.mode & 1) === 0)
    t.memoizedState = null;
  else
    switch (o) {
      case "forwards":
        for (n = t.child, o = null; n !== null; )
          e = n.alternate, e !== null && rc(e) === null && (o = n), n = n.sibling;
        n = o, n === null ? (o = t.child, t.child = null) : (o = n.sibling, n.sibling = null), dd(t, !1, o, n, i);
        break;
      case "backwards":
        for (n = null, o = t.child, t.child = null; o !== null; ) {
          if (e = o.alternate, e !== null && rc(e) === null) {
            t.child = o;
            break;
          }
          e = o.sibling, o.sibling = n, n = o, o = e;
        }
        dd(t, !0, n, null, i);
        break;
      case "together":
        dd(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
  return t.child;
}
function Sl(e, t) {
  (t.mode & 1) === 0 && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
}
function ir(e, t, n) {
  if (e !== null && (t.dependencies = e.dependencies), So |= t.lanes, (n & t.childLanes) === 0)
    return null;
  if (e !== null && t.child !== e.child)
    throw Error(V(153));
  if (t.child !== null) {
    for (e = t.child, n = zr(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; )
      e = e.sibling, n = n.sibling = zr(e, e.pendingProps), n.return = t;
    n.sibling = null;
  }
  return t.child;
}
function eE(e, t, n) {
  switch (t.tag) {
    case 3:
      rb(t), hi();
      break;
    case 5:
      M1(t);
      break;
    case 1:
      Dt(t.type) && Ql(t);
      break;
    case 4:
      Zp(t, t.stateNode.containerInfo);
      break;
    case 10:
      var r = t.type._context, o = t.memoizedProps.value;
      Ne(ec, r._currentValue), r._currentValue = o;
      break;
    case 13:
      if (r = t.memoizedState, r !== null)
        return r.dehydrated !== null ? (Ne(Ue, Ue.current & 1), t.flags |= 128, null) : (n & t.child.childLanes) !== 0 ? ob(e, t, n) : (Ne(Ue, Ue.current & 1), e = ir(e, t, n), e !== null ? e.sibling : null);
      Ne(Ue, Ue.current & 1);
      break;
    case 19:
      if (r = (n & t.childLanes) !== 0, (e.flags & 128) !== 0) {
        if (r)
          return ib(e, t, n);
        t.flags |= 128;
      }
      if (o = t.memoizedState, o !== null && (o.rendering = null, o.tail = null, o.lastEffect = null), Ne(Ue, Ue.current), r)
        break;
      return null;
    case 22:
    case 23:
      return t.lanes = 0, tb(e, t, n);
  }
  return ir(e, t, n);
}
var sb, Rf, ab, lb;
sb = function(e, t) {
  for (var n = t.child; n !== null; ) {
    if (n.tag === 5 || n.tag === 6)
      e.appendChild(n.stateNode);
    else if (n.tag !== 4 && n.child !== null) {
      n.child.return = n, n = n.child;
      continue;
    }
    if (n === t)
      break;
    for (; n.sibling === null; ) {
      if (n.return === null || n.return === t)
        return;
      n = n.return;
    }
    n.sibling.return = n.return, n = n.sibling;
  }
};
Rf = function() {
};
ab = function(e, t, n, r) {
  var o = e.memoizedProps;
  if (o !== r) {
    e = t.stateNode, po(Ln.current);
    var i = null;
    switch (n) {
      case "input":
        o = Xd(e, o), r = Xd(e, r), i = [];
        break;
      case "select":
        o = Ve({}, o, { value: void 0 }), r = Ve({}, r, { value: void 0 }), i = [];
        break;
      case "textarea":
        o = Gd(e, o), r = Gd(e, r), i = [];
        break;
      default:
        typeof o.onClick != "function" && typeof r.onClick == "function" && (e.onclick = ql);
    }
    Jd(n, r);
    var s;
    n = null;
    for (c in o)
      if (!r.hasOwnProperty(c) && o.hasOwnProperty(c) && o[c] != null)
        if (c === "style") {
          var a = o[c];
          for (s in a)
            a.hasOwnProperty(s) && (n || (n = {}), n[s] = "");
        } else
          c !== "dangerouslySetInnerHTML" && c !== "children" && c !== "suppressContentEditableWarning" && c !== "suppressHydrationWarning" && c !== "autoFocus" && (Ds.hasOwnProperty(c) ? i || (i = []) : (i = i || []).push(c, null));
    for (c in r) {
      var l = r[c];
      if (a = o != null ? o[c] : void 0, r.hasOwnProperty(c) && l !== a && (l != null || a != null))
        if (c === "style")
          if (a) {
            for (s in a)
              !a.hasOwnProperty(s) || l && l.hasOwnProperty(s) || (n || (n = {}), n[s] = "");
            for (s in l)
              l.hasOwnProperty(s) && a[s] !== l[s] && (n || (n = {}), n[s] = l[s]);
          } else
            n || (i || (i = []), i.push(
              c,
              n
            )), n = l;
        else
          c === "dangerouslySetInnerHTML" ? (l = l ? l.__html : void 0, a = a ? a.__html : void 0, l != null && a !== l && (i = i || []).push(c, l)) : c === "children" ? typeof l != "string" && typeof l != "number" || (i = i || []).push(c, "" + l) : c !== "suppressContentEditableWarning" && c !== "suppressHydrationWarning" && (Ds.hasOwnProperty(c) ? (l != null && c === "onScroll" && Fe("scroll", e), i || a === l || (i = [])) : (i = i || []).push(c, l));
    }
    n && (i = i || []).push("style", n);
    var c = i;
    (t.updateQueue = c) && (t.flags |= 4);
  }
};
lb = function(e, t, n, r) {
  n !== r && (t.flags |= 4);
};
function Gi(e, t) {
  if (!je)
    switch (e.tailMode) {
      case "hidden":
        t = e.tail;
        for (var n = null; t !== null; )
          t.alternate !== null && (n = t), t = t.sibling;
        n === null ? e.tail = null : n.sibling = null;
        break;
      case "collapsed":
        n = e.tail;
        for (var r = null; n !== null; )
          n.alternate !== null && (r = n), n = n.sibling;
        r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
    }
}
function wt(e) {
  var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
  if (t)
    for (var o = e.child; o !== null; )
      n |= o.lanes | o.childLanes, r |= o.subtreeFlags & 14680064, r |= o.flags & 14680064, o.return = e, o = o.sibling;
  else
    for (o = e.child; o !== null; )
      n |= o.lanes | o.childLanes, r |= o.subtreeFlags, r |= o.flags, o.return = e, o = o.sibling;
  return e.subtreeFlags |= r, e.childLanes = n, t;
}
function tE(e, t, n) {
  var r = t.pendingProps;
  switch (Yp(t), t.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return wt(t), null;
    case 1:
      return Dt(t.type) && Gl(), wt(t), null;
    case 3:
      return r = t.stateNode, gi(), De(Ft), De(Rt), th(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (Xa(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, Sn !== null && (Af(Sn), Sn = null))), Rf(e, t), wt(t), null;
    case 5:
      eh(t);
      var o = po(Gs.current);
      if (n = t.type, e !== null && t.stateNode != null)
        ab(e, t, n, r, o), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
      else {
        if (!r) {
          if (t.stateNode === null)
            throw Error(V(166));
          return wt(t), null;
        }
        if (e = po(Ln.current), Xa(t)) {
          r = t.stateNode, n = t.type;
          var i = t.memoizedProps;
          switch (r[Mn] = t, r[Ks] = i, e = (t.mode & 1) !== 0, n) {
            case "dialog":
              Fe("cancel", r), Fe("close", r);
              break;
            case "iframe":
            case "object":
            case "embed":
              Fe("load", r);
              break;
            case "video":
            case "audio":
              for (o = 0; o < fs.length; o++)
                Fe(fs[o], r);
              break;
            case "source":
              Fe("error", r);
              break;
            case "img":
            case "image":
            case "link":
              Fe(
                "error",
                r
              ), Fe("load", r);
              break;
            case "details":
              Fe("toggle", r);
              break;
            case "input":
              qm(r, i), Fe("invalid", r);
              break;
            case "select":
              r._wrapperState = { wasMultiple: !!i.multiple }, Fe("invalid", r);
              break;
            case "textarea":
              Qm(r, i), Fe("invalid", r);
          }
          Jd(n, i), o = null;
          for (var s in i)
            if (i.hasOwnProperty(s)) {
              var a = i[s];
              s === "children" ? typeof a == "string" ? r.textContent !== a && (i.suppressHydrationWarning !== !0 && Ya(r.textContent, a, e), o = ["children", a]) : typeof a == "number" && r.textContent !== "" + a && (i.suppressHydrationWarning !== !0 && Ya(
                r.textContent,
                a,
                e
              ), o = ["children", "" + a]) : Ds.hasOwnProperty(s) && a != null && s === "onScroll" && Fe("scroll", r);
            }
          switch (n) {
            case "input":
              Da(r), Gm(r, i, !0);
              break;
            case "textarea":
              Da(r), Jm(r);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof i.onClick == "function" && (r.onclick = ql);
          }
          r = o, t.updateQueue = r, r !== null && (t.flags |= 4);
        } else {
          s = o.nodeType === 9 ? o : o.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = Ny(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = s.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = s.createElement(n, { is: r.is }) : (e = s.createElement(n), n === "select" && (s = e, r.multiple ? s.multiple = !0 : r.size && (s.size = r.size))) : e = s.createElementNS(e, n), e[Mn] = t, e[Ks] = r, sb(e, t, !1, !1), t.stateNode = e;
          e: {
            switch (s = Zd(n, r), n) {
              case "dialog":
                Fe("cancel", e), Fe("close", e), o = r;
                break;
              case "iframe":
              case "object":
              case "embed":
                Fe("load", e), o = r;
                break;
              case "video":
              case "audio":
                for (o = 0; o < fs.length; o++)
                  Fe(fs[o], e);
                o = r;
                break;
              case "source":
                Fe("error", e), o = r;
                break;
              case "img":
              case "image":
              case "link":
                Fe(
                  "error",
                  e
                ), Fe("load", e), o = r;
                break;
              case "details":
                Fe("toggle", e), o = r;
                break;
              case "input":
                qm(e, r), o = Xd(e, r), Fe("invalid", e);
                break;
              case "option":
                o = r;
                break;
              case "select":
                e._wrapperState = { wasMultiple: !!r.multiple }, o = Ve({}, r, { value: void 0 }), Fe("invalid", e);
                break;
              case "textarea":
                Qm(e, r), o = Gd(e, r), Fe("invalid", e);
                break;
              default:
                o = r;
            }
            Jd(n, o), a = o;
            for (i in a)
              if (a.hasOwnProperty(i)) {
                var l = a[i];
                i === "style" ? Dy(e, l) : i === "dangerouslySetInnerHTML" ? (l = l ? l.__html : void 0, l != null && Ly(e, l)) : i === "children" ? typeof l == "string" ? (n !== "textarea" || l !== "") && zs(e, l) : typeof l == "number" && zs(e, "" + l) : i !== "suppressContentEditableWarning" && i !== "suppressHydrationWarning" && i !== "autoFocus" && (Ds.hasOwnProperty(i) ? l != null && i === "onScroll" && Fe("scroll", e) : l != null && _p(e, i, l, s));
              }
            switch (n) {
              case "input":
                Da(e), Gm(e, r, !1);
                break;
              case "textarea":
                Da(e), Jm(e);
                break;
              case "option":
                r.value != null && e.setAttribute("value", "" + Wr(r.value));
                break;
              case "select":
                e.multiple = !!r.multiple, i = r.value, i != null ? ri(e, !!r.multiple, i, !1) : r.defaultValue != null && ri(
                  e,
                  !!r.multiple,
                  r.defaultValue,
                  !0
                );
                break;
              default:
                typeof o.onClick == "function" && (e.onclick = ql);
            }
            switch (n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                r = !!r.autoFocus;
                break e;
              case "img":
                r = !0;
                break e;
              default:
                r = !1;
            }
          }
          r && (t.flags |= 4);
        }
        t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
      }
      return wt(t), null;
    case 6:
      if (e && t.stateNode != null)
        lb(e, t, e.memoizedProps, r);
      else {
        if (typeof r != "string" && t.stateNode === null)
          throw Error(V(166));
        if (n = po(Gs.current), po(Ln.current), Xa(t)) {
          if (r = t.stateNode, n = t.memoizedProps, r[Mn] = t, (i = r.nodeValue !== n) && (e = Xt, e !== null))
            switch (e.tag) {
              case 3:
                Ya(r.nodeValue, n, (e.mode & 1) !== 0);
                break;
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 && Ya(r.nodeValue, n, (e.mode & 1) !== 0);
            }
          i && (t.flags |= 4);
        } else
          r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r), r[Mn] = t, t.stateNode = r;
      }
      return wt(t), null;
    case 13:
      if (De(Ue), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (je && Yt !== null && (t.mode & 1) !== 0 && (t.flags & 128) === 0)
          E1(), hi(), t.flags |= 98560, i = !1;
        else if (i = Xa(t), r !== null && r.dehydrated !== null) {
          if (e === null) {
            if (!i)
              throw Error(V(318));
            if (i = t.memoizedState, i = i !== null ? i.dehydrated : null, !i)
              throw Error(V(317));
            i[Mn] = t;
          } else
            hi(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
          wt(t), i = !1;
        } else
          Sn !== null && (Af(Sn), Sn = null), i = !0;
        if (!i)
          return t.flags & 65536 ? t : null;
      }
      return (t.flags & 128) !== 0 ? (t.lanes = n, t) : (r = r !== null, r !== (e !== null && e.memoizedState !== null) && r && (t.child.flags |= 8192, (t.mode & 1) !== 0 && (e === null || (Ue.current & 1) !== 0 ? at === 0 && (at = 3) : ph())), t.updateQueue !== null && (t.flags |= 4), wt(t), null);
    case 4:
      return gi(), Rf(e, t), e === null && Ys(t.stateNode.containerInfo), wt(t), null;
    case 10:
      return Gp(t.type._context), wt(t), null;
    case 17:
      return Dt(t.type) && Gl(), wt(t), null;
    case 19:
      if (De(Ue), i = t.memoizedState, i === null)
        return wt(t), null;
      if (r = (t.flags & 128) !== 0, s = i.rendering, s === null)
        if (r)
          Gi(i, !1);
        else {
          if (at !== 0 || e !== null && (e.flags & 128) !== 0)
            for (e = t.child; e !== null; ) {
              if (s = rc(e), s !== null) {
                for (t.flags |= 128, Gi(i, !1), r = s.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null; )
                  i = n, e = r, i.flags &= 14680066, s = i.alternate, s === null ? (i.childLanes = 0, i.lanes = e, i.child = null, i.subtreeFlags = 0, i.memoizedProps = null, i.memoizedState = null, i.updateQueue = null, i.dependencies = null, i.stateNode = null) : (i.childLanes = s.childLanes, i.lanes = s.lanes, i.child = s.child, i.subtreeFlags = 0, i.deletions = null, i.memoizedProps = s.memoizedProps, i.memoizedState = s.memoizedState, i.updateQueue = s.updateQueue, i.type = s.type, e = s.dependencies, i.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
                return Ne(Ue, Ue.current & 1 | 2), t.child;
              }
              e = e.sibling;
            }
          i.tail !== null && Ge() > yi && (t.flags |= 128, r = !0, Gi(i, !1), t.lanes = 4194304);
        }
      else {
        if (!r)
          if (e = rc(s), e !== null) {
            if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), Gi(i, !0), i.tail === null && i.tailMode === "hidden" && !s.alternate && !je)
              return wt(t), null;
          } else
            2 * Ge() - i.renderingStartTime > yi && n !== 1073741824 && (t.flags |= 128, r = !0, Gi(i, !1), t.lanes = 4194304);
        i.isBackwards ? (s.sibling = t.child, t.child = s) : (n = i.last, n !== null ? n.sibling = s : t.child = s, i.last = s);
      }
      return i.tail !== null ? (t = i.tail, i.rendering = t, i.tail = t.sibling, i.renderingStartTime = Ge(), t.sibling = null, n = Ue.current, Ne(Ue, r ? n & 1 | 2 : n & 1), t) : (wt(t), null);
    case 22:
    case 23:
      return fh(), r = t.memoizedState !== null, e !== null && e.memoizedState !== null !== r && (t.flags |= 8192), r && (t.mode & 1) !== 0 ? (Vt & 1073741824) !== 0 && (wt(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : wt(t), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(V(156, t.tag));
}
function nE(e, t) {
  switch (Yp(t), t.tag) {
    case 1:
      return Dt(t.type) && Gl(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return gi(), De(Ft), De(Rt), th(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
    case 5:
      return eh(t), null;
    case 13:
      if (De(Ue), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null)
          throw Error(V(340));
        hi();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return De(Ue), null;
    case 4:
      return gi(), null;
    case 10:
      return Gp(t.type._context), null;
    case 22:
    case 23:
      return fh(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var Ga = !1, kt = !1, rE = typeof WeakSet == "function" ? WeakSet : Set, ee = null;
function Zo(e, t) {
  var n = e.ref;
  if (n !== null)
    if (typeof n == "function")
      try {
        n(null);
      } catch (r) {
        Xe(e, t, r);
      }
    else
      n.current = null;
}
function Tf(e, t, n) {
  try {
    n();
  } catch (r) {
    Xe(e, t, r);
  }
}
var jg = !1;
function oE(e, t) {
  if (uf = Yl, e = f1(), Hp(e)) {
    if ("selectionStart" in e)
      var n = { start: e.selectionStart, end: e.selectionEnd };
    else
      e: {
        n = (n = e.ownerDocument) && n.defaultView || window;
        var r = n.getSelection && n.getSelection();
        if (r && r.rangeCount !== 0) {
          n = r.anchorNode;
          var o = r.anchorOffset, i = r.focusNode;
          r = r.focusOffset;
          try {
            n.nodeType, i.nodeType;
          } catch {
            n = null;
            break e;
          }
          var s = 0, a = -1, l = -1, c = 0, u = 0, f = e, h = null;
          t:
            for (; ; ) {
              for (var y; f !== n || o !== 0 && f.nodeType !== 3 || (a = s + o), f !== i || r !== 0 && f.nodeType !== 3 || (l = s + r), f.nodeType === 3 && (s += f.nodeValue.length), (y = f.firstChild) !== null; )
                h = f, f = y;
              for (; ; ) {
                if (f === e)
                  break t;
                if (h === n && ++c === o && (a = s), h === i && ++u === r && (l = s), (y = f.nextSibling) !== null)
                  break;
                f = h, h = f.parentNode;
              }
              f = y;
            }
          n = a === -1 || l === -1 ? null : { start: a, end: l };
        } else
          n = null;
      }
    n = n || { start: 0, end: 0 };
  } else
    n = null;
  for (df = { focusedElem: e, selectionRange: n }, Yl = !1, ee = t; ee !== null; )
    if (t = ee, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null)
      e.return = t, ee = e;
    else
      for (; ee !== null; ) {
        t = ee;
        try {
          var d = t.alternate;
          if ((t.flags & 1024) !== 0)
            switch (t.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                if (d !== null) {
                  var m = d.memoizedProps, w = d.memoizedState, g = t.stateNode, p = g.getSnapshotBeforeUpdate(t.elementType === t.type ? m : yn(t.type, m), w);
                  g.__reactInternalSnapshotBeforeUpdate = p;
                }
                break;
              case 3:
                var v = t.stateNode.containerInfo;
                v.nodeType === 1 ? v.textContent = "" : v.nodeType === 9 && v.documentElement && v.removeChild(v.documentElement);
                break;
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw Error(V(163));
            }
        } catch (b) {
          Xe(t, t.return, b);
        }
        if (e = t.sibling, e !== null) {
          e.return = t.return, ee = e;
          break;
        }
        ee = t.return;
      }
  return d = jg, jg = !1, d;
}
function Rs(e, t, n) {
  var r = t.updateQueue;
  if (r = r !== null ? r.lastEffect : null, r !== null) {
    var o = r = r.next;
    do {
      if ((o.tag & e) === e) {
        var i = o.destroy;
        o.destroy = void 0, i !== void 0 && Tf(t, n, i);
      }
      o = o.next;
    } while (o !== r);
  }
}
function Lc(e, t) {
  if (t = t.updateQueue, t = t !== null ? t.lastEffect : null, t !== null) {
    var n = t = t.next;
    do {
      if ((n.tag & e) === e) {
        var r = n.create;
        n.destroy = r();
      }
      n = n.next;
    } while (n !== t);
  }
}
function Pf(e) {
  var t = e.ref;
  if (t !== null) {
    var n = e.stateNode;
    switch (e.tag) {
      case 5:
        e = n;
        break;
      default:
        e = n;
    }
    typeof t == "function" ? t(e) : t.current = e;
  }
}
function cb(e) {
  var t = e.alternate;
  t !== null && (e.alternate = null, cb(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Mn], delete t[Ks], delete t[hf], delete t[Bk], delete t[jk])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
function ub(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Wg(e) {
  e:
    for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || ub(e.return))
          return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.flags & 2 || e.child === null || e.tag === 4)
          continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2))
        return e.stateNode;
    }
}
function Of(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = ql));
  else if (r !== 4 && (e = e.child, e !== null))
    for (Of(e, t, n), e = e.sibling; e !== null; )
      Of(e, t, n), e = e.sibling;
}
function $f(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
  else if (r !== 4 && (e = e.child, e !== null))
    for ($f(e, t, n), e = e.sibling; e !== null; )
      $f(e, t, n), e = e.sibling;
}
var ft = null, bn = !1;
function hr(e, t, n) {
  for (n = n.child; n !== null; )
    db(e, t, n), n = n.sibling;
}
function db(e, t, n) {
  if (Nn && typeof Nn.onCommitFiberUnmount == "function")
    try {
      Nn.onCommitFiberUnmount(Pc, n);
    } catch {
    }
  switch (n.tag) {
    case 5:
      kt || Zo(n, t);
    case 6:
      var r = ft, o = bn;
      ft = null, hr(e, t, n), ft = r, bn = o, ft !== null && (bn ? (e = ft, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : ft.removeChild(n.stateNode));
      break;
    case 18:
      ft !== null && (bn ? (e = ft, n = n.stateNode, e.nodeType === 8 ? od(e.parentNode, n) : e.nodeType === 1 && od(e, n), Us(e)) : od(ft, n.stateNode));
      break;
    case 4:
      r = ft, o = bn, ft = n.stateNode.containerInfo, bn = !0, hr(e, t, n), ft = r, bn = o;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!kt && (r = n.updateQueue, r !== null && (r = r.lastEffect, r !== null))) {
        o = r = r.next;
        do {
          var i = o, s = i.destroy;
          i = i.tag, s !== void 0 && ((i & 2) !== 0 || (i & 4) !== 0) && Tf(n, t, s), o = o.next;
        } while (o !== r);
      }
      hr(e, t, n);
      break;
    case 1:
      if (!kt && (Zo(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function"))
        try {
          r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
        } catch (a) {
          Xe(n, t, a);
        }
      hr(e, t, n);
      break;
    case 21:
      hr(e, t, n);
      break;
    case 22:
      n.mode & 1 ? (kt = (r = kt) || n.memoizedState !== null, hr(e, t, n), kt = r) : hr(e, t, n);
      break;
    default:
      hr(e, t, n);
  }
}
function Ug(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    n === null && (n = e.stateNode = new rE()), t.forEach(function(r) {
      var o = pE.bind(null, e, r);
      n.has(r) || (n.add(r), r.then(o, o));
    });
  }
}
function vn(e, t) {
  var n = t.deletions;
  if (n !== null)
    for (var r = 0; r < n.length; r++) {
      var o = n[r];
      try {
        var i = e, s = t, a = s;
        e:
          for (; a !== null; ) {
            switch (a.tag) {
              case 5:
                ft = a.stateNode, bn = !1;
                break e;
              case 3:
                ft = a.stateNode.containerInfo, bn = !0;
                break e;
              case 4:
                ft = a.stateNode.containerInfo, bn = !0;
                break e;
            }
            a = a.return;
          }
        if (ft === null)
          throw Error(V(160));
        db(i, s, o), ft = null, bn = !1;
        var l = o.alternate;
        l !== null && (l.return = null), o.return = null;
      } catch (c) {
        Xe(o, t, c);
      }
    }
  if (t.subtreeFlags & 12854)
    for (t = t.child; t !== null; )
      fb(t, e), t = t.sibling;
}
function fb(e, t) {
  var n = e.alternate, r = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if (vn(t, e), Pn(e), r & 4) {
        try {
          Rs(3, e, e.return), Lc(3, e);
        } catch (m) {
          Xe(e, e.return, m);
        }
        try {
          Rs(5, e, e.return);
        } catch (m) {
          Xe(e, e.return, m);
        }
      }
      break;
    case 1:
      vn(t, e), Pn(e), r & 512 && n !== null && Zo(n, n.return);
      break;
    case 5:
      if (vn(t, e), Pn(e), r & 512 && n !== null && Zo(n, n.return), e.flags & 32) {
        var o = e.stateNode;
        try {
          zs(o, "");
        } catch (m) {
          Xe(e, e.return, m);
        }
      }
      if (r & 4 && (o = e.stateNode, o != null)) {
        var i = e.memoizedProps, s = n !== null ? n.memoizedProps : i, a = e.type, l = e.updateQueue;
        if (e.updateQueue = null, l !== null)
          try {
            a === "input" && i.type === "radio" && i.name != null && Iy(o, i), Zd(a, s);
            var c = Zd(a, i);
            for (s = 0; s < l.length; s += 2) {
              var u = l[s], f = l[s + 1];
              u === "style" ? Dy(o, f) : u === "dangerouslySetInnerHTML" ? Ly(o, f) : u === "children" ? zs(o, f) : _p(o, u, f, c);
            }
            switch (a) {
              case "input":
                Kd(o, i);
                break;
              case "textarea":
                Ay(o, i);
                break;
              case "select":
                var h = o._wrapperState.wasMultiple;
                o._wrapperState.wasMultiple = !!i.multiple;
                var y = i.value;
                y != null ? ri(o, !!i.multiple, y, !1) : h !== !!i.multiple && (i.defaultValue != null ? ri(
                  o,
                  !!i.multiple,
                  i.defaultValue,
                  !0
                ) : ri(o, !!i.multiple, i.multiple ? [] : "", !1));
            }
            o[Ks] = i;
          } catch (m) {
            Xe(e, e.return, m);
          }
      }
      break;
    case 6:
      if (vn(t, e), Pn(e), r & 4) {
        if (e.stateNode === null)
          throw Error(V(162));
        o = e.stateNode, i = e.memoizedProps;
        try {
          o.nodeValue = i;
        } catch (m) {
          Xe(e, e.return, m);
        }
      }
      break;
    case 3:
      if (vn(t, e), Pn(e), r & 4 && n !== null && n.memoizedState.isDehydrated)
        try {
          Us(t.containerInfo);
        } catch (m) {
          Xe(e, e.return, m);
        }
      break;
    case 4:
      vn(t, e), Pn(e);
      break;
    case 13:
      vn(t, e), Pn(e), o = e.child, o.flags & 8192 && (i = o.memoizedState !== null, o.stateNode.isHidden = i, !i || o.alternate !== null && o.alternate.memoizedState !== null || (uh = Ge())), r & 4 && Ug(e);
      break;
    case 22:
      if (u = n !== null && n.memoizedState !== null, e.mode & 1 ? (kt = (c = kt) || u, vn(t, e), kt = c) : vn(t, e), Pn(e), r & 8192) {
        if (c = e.memoizedState !== null, (e.stateNode.isHidden = c) && !u && (e.mode & 1) !== 0)
          for (ee = e, u = e.child; u !== null; ) {
            for (f = ee = u; ee !== null; ) {
              switch (h = ee, y = h.child, h.tag) {
                case 0:
                case 11:
                case 14:
                case 15:
                  Rs(4, h, h.return);
                  break;
                case 1:
                  Zo(h, h.return);
                  var d = h.stateNode;
                  if (typeof d.componentWillUnmount == "function") {
                    r = h, n = h.return;
                    try {
                      t = r, d.props = t.memoizedProps, d.state = t.memoizedState, d.componentWillUnmount();
                    } catch (m) {
                      Xe(r, n, m);
                    }
                  }
                  break;
                case 5:
                  Zo(h, h.return);
                  break;
                case 22:
                  if (h.memoizedState !== null) {
                    Vg(f);
                    continue;
                  }
              }
              y !== null ? (y.return = h, ee = y) : Vg(f);
            }
            u = u.sibling;
          }
        e:
          for (u = null, f = e; ; ) {
            if (f.tag === 5) {
              if (u === null) {
                u = f;
                try {
                  o = f.stateNode, c ? (i = o.style, typeof i.setProperty == "function" ? i.setProperty("display", "none", "important") : i.display = "none") : (a = f.stateNode, l = f.memoizedProps.style, s = l != null && l.hasOwnProperty("display") ? l.display : null, a.style.display = Fy("display", s));
                } catch (m) {
                  Xe(e, e.return, m);
                }
              }
            } else if (f.tag === 6) {
              if (u === null)
                try {
                  f.stateNode.nodeValue = c ? "" : f.memoizedProps;
                } catch (m) {
                  Xe(e, e.return, m);
                }
            } else if ((f.tag !== 22 && f.tag !== 23 || f.memoizedState === null || f === e) && f.child !== null) {
              f.child.return = f, f = f.child;
              continue;
            }
            if (f === e)
              break e;
            for (; f.sibling === null; ) {
              if (f.return === null || f.return === e)
                break e;
              u === f && (u = null), f = f.return;
            }
            u === f && (u = null), f.sibling.return = f.return, f = f.sibling;
          }
      }
      break;
    case 19:
      vn(t, e), Pn(e), r & 4 && Ug(e);
      break;
    case 21:
      break;
    default:
      vn(
        t,
        e
      ), Pn(e);
  }
}
function Pn(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (ub(n)) {
            var r = n;
            break e;
          }
          n = n.return;
        }
        throw Error(V(160));
      }
      switch (r.tag) {
        case 5:
          var o = r.stateNode;
          r.flags & 32 && (zs(o, ""), r.flags &= -33);
          var i = Wg(e);
          $f(e, i, o);
          break;
        case 3:
        case 4:
          var s = r.stateNode.containerInfo, a = Wg(e);
          Of(e, a, s);
          break;
        default:
          throw Error(V(161));
      }
    } catch (l) {
      Xe(e, e.return, l);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function iE(e, t, n) {
  ee = e, pb(e);
}
function pb(e, t, n) {
  for (var r = (e.mode & 1) !== 0; ee !== null; ) {
    var o = ee, i = o.child;
    if (o.tag === 22 && r) {
      var s = o.memoizedState !== null || Ga;
      if (!s) {
        var a = o.alternate, l = a !== null && a.memoizedState !== null || kt;
        a = Ga;
        var c = kt;
        if (Ga = s, (kt = l) && !c)
          for (ee = o; ee !== null; )
            s = ee, l = s.child, s.tag === 22 && s.memoizedState !== null ? Yg(o) : l !== null ? (l.return = s, ee = l) : Yg(o);
        for (; i !== null; )
          ee = i, pb(i), i = i.sibling;
        ee = o, Ga = a, kt = c;
      }
      Hg(e);
    } else
      (o.subtreeFlags & 8772) !== 0 && i !== null ? (i.return = o, ee = i) : Hg(e);
  }
}
function Hg(e) {
  for (; ee !== null; ) {
    var t = ee;
    if ((t.flags & 8772) !== 0) {
      var n = t.alternate;
      try {
        if ((t.flags & 8772) !== 0)
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
              kt || Lc(5, t);
              break;
            case 1:
              var r = t.stateNode;
              if (t.flags & 4 && !kt)
                if (n === null)
                  r.componentDidMount();
                else {
                  var o = t.elementType === t.type ? n.memoizedProps : yn(t.type, n.memoizedProps);
                  r.componentDidUpdate(o, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
                }
              var i = t.updateQueue;
              i !== null && Tg(t, i, r);
              break;
            case 3:
              var s = t.updateQueue;
              if (s !== null) {
                if (n = null, t.child !== null)
                  switch (t.child.tag) {
                    case 5:
                      n = t.child.stateNode;
                      break;
                    case 1:
                      n = t.child.stateNode;
                  }
                Tg(t, s, n);
              }
              break;
            case 5:
              var a = t.stateNode;
              if (n === null && t.flags & 4) {
                n = a;
                var l = t.memoizedProps;
                switch (t.type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    l.autoFocus && n.focus();
                    break;
                  case "img":
                    l.src && (n.src = l.src);
                }
              }
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (t.memoizedState === null) {
                var c = t.alternate;
                if (c !== null) {
                  var u = c.memoizedState;
                  if (u !== null) {
                    var f = u.dehydrated;
                    f !== null && Us(f);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break;
            default:
              throw Error(V(163));
          }
        kt || t.flags & 512 && Pf(t);
      } catch (h) {
        Xe(t, t.return, h);
      }
    }
    if (t === e) {
      ee = null;
      break;
    }
    if (n = t.sibling, n !== null) {
      n.return = t.return, ee = n;
      break;
    }
    ee = t.return;
  }
}
function Vg(e) {
  for (; ee !== null; ) {
    var t = ee;
    if (t === e) {
      ee = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      n.return = t.return, ee = n;
      break;
    }
    ee = t.return;
  }
}
function Yg(e) {
  for (; ee !== null; ) {
    var t = ee;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            Lc(4, t);
          } catch (l) {
            Xe(t, n, l);
          }
          break;
        case 1:
          var r = t.stateNode;
          if (typeof r.componentDidMount == "function") {
            var o = t.return;
            try {
              r.componentDidMount();
            } catch (l) {
              Xe(t, o, l);
            }
          }
          var i = t.return;
          try {
            Pf(t);
          } catch (l) {
            Xe(t, i, l);
          }
          break;
        case 5:
          var s = t.return;
          try {
            Pf(t);
          } catch (l) {
            Xe(t, s, l);
          }
      }
    } catch (l) {
      Xe(t, t.return, l);
    }
    if (t === e) {
      ee = null;
      break;
    }
    var a = t.sibling;
    if (a !== null) {
      a.return = t.return, ee = a;
      break;
    }
    ee = t.return;
  }
}
var sE = Math.ceil, sc = ur.ReactCurrentDispatcher, lh = ur.ReactCurrentOwner, an = ur.ReactCurrentBatchConfig, ke = 0, ut = null, nt = null, ht = 0, Vt = 0, ei = Kr(0), at = 0, ea = null, So = 0, Fc = 0, ch = 0, Ts = null, It = null, uh = 0, yi = 1 / 0, qn = null, ac = !1, _f = null, Fr = null, Qa = !1, Pr = null, lc = 0, Ps = 0, Mf = null, Cl = -1, kl = 0;
function Ot() {
  return (ke & 6) !== 0 ? Ge() : Cl !== -1 ? Cl : Cl = Ge();
}
function Dr(e) {
  return (e.mode & 1) === 0 ? 1 : (ke & 2) !== 0 && ht !== 0 ? ht & -ht : Uk.transition !== null ? (kl === 0 && (kl = Gy()), kl) : (e = $e, e !== 0 || (e = window.event, e = e === void 0 ? 16 : r1(e.type)), e);
}
function En(e, t, n, r) {
  if (50 < Ps)
    throw Ps = 0, Mf = null, Error(V(185));
  xa(e, n, r), ((ke & 2) === 0 || e !== ut) && (e === ut && ((ke & 2) === 0 && (Fc |= n), at === 4 && Sr(e, ht)), zt(e, r), n === 1 && ke === 0 && (t.mode & 1) === 0 && (yi = Ge() + 500, Ic && qr()));
}
function zt(e, t) {
  var n = e.callbackNode;
  UC(e, t);
  var r = Vl(e, e === ut ? ht : 0);
  if (r === 0)
    n !== null && tg(n), e.callbackNode = null, e.callbackPriority = 0;
  else if (t = r & -r, e.callbackPriority !== t) {
    if (n != null && tg(n), t === 1)
      e.tag === 0 ? Wk(Xg.bind(null, e)) : S1(Xg.bind(null, e)), Dk(function() {
        (ke & 6) === 0 && qr();
      }), n = null;
    else {
      switch (Qy(r)) {
        case 1:
          n = Lp;
          break;
        case 4:
          n = Ky;
          break;
        case 16:
          n = Hl;
          break;
        case 536870912:
          n = qy;
          break;
        default:
          n = Hl;
      }
      n = wb(n, hb.bind(null, e));
    }
    e.callbackPriority = t, e.callbackNode = n;
  }
}
function hb(e, t) {
  if (Cl = -1, kl = 0, (ke & 6) !== 0)
    throw Error(V(327));
  var n = e.callbackNode;
  if (li() && e.callbackNode !== n)
    return null;
  var r = Vl(e, e === ut ? ht : 0);
  if (r === 0)
    return null;
  if ((r & 30) !== 0 || (r & e.expiredLanes) !== 0 || t)
    t = cc(e, r);
  else {
    t = r;
    var o = ke;
    ke |= 2;
    var i = gb();
    (ut !== e || ht !== t) && (qn = null, yi = Ge() + 500, mo(e, t));
    do
      try {
        cE();
        break;
      } catch (a) {
        mb(e, a);
      }
    while (1);
    qp(), sc.current = i, ke = o, nt !== null ? t = 0 : (ut = null, ht = 0, t = at);
  }
  if (t !== 0) {
    if (t === 2 && (o = of(e), o !== 0 && (r = o, t = If(e, o))), t === 1)
      throw n = ea, mo(e, 0), Sr(e, r), zt(e, Ge()), n;
    if (t === 6)
      Sr(e, r);
    else {
      if (o = e.current.alternate, (r & 30) === 0 && !aE(o) && (t = cc(e, r), t === 2 && (i = of(e), i !== 0 && (r = i, t = If(e, i))), t === 1))
        throw n = ea, mo(e, 0), Sr(e, r), zt(e, Ge()), n;
      switch (e.finishedWork = o, e.finishedLanes = r, t) {
        case 0:
        case 1:
          throw Error(V(345));
        case 2:
          oo(e, It, qn);
          break;
        case 3:
          if (Sr(e, r), (r & 130023424) === r && (t = uh + 500 - Ge(), 10 < t)) {
            if (Vl(e, 0) !== 0)
              break;
            if (o = e.suspendedLanes, (o & r) !== r) {
              Ot(), e.pingedLanes |= e.suspendedLanes & o;
              break;
            }
            e.timeoutHandle = pf(oo.bind(null, e, It, qn), t);
            break;
          }
          oo(e, It, qn);
          break;
        case 4:
          if (Sr(e, r), (r & 4194240) === r)
            break;
          for (t = e.eventTimes, o = -1; 0 < r; ) {
            var s = 31 - kn(r);
            i = 1 << s, s = t[s], s > o && (o = s), r &= ~i;
          }
          if (r = o, r = Ge() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * sE(r / 1960)) - r, 10 < r) {
            e.timeoutHandle = pf(oo.bind(null, e, It, qn), r);
            break;
          }
          oo(e, It, qn);
          break;
        case 5:
          oo(e, It, qn);
          break;
        default:
          throw Error(V(329));
      }
    }
  }
  return zt(e, Ge()), e.callbackNode === n ? hb.bind(null, e) : null;
}
function If(e, t) {
  var n = Ts;
  return e.current.memoizedState.isDehydrated && (mo(e, t).flags |= 256), e = cc(e, t), e !== 2 && (t = It, It = n, t !== null && Af(t)), e;
}
function Af(e) {
  It === null ? It = e : It.push.apply(It, e);
}
function aE(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && (n = n.stores, n !== null))
        for (var r = 0; r < n.length; r++) {
          var o = n[r], i = o.getSnapshot;
          o = o.value;
          try {
            if (!Rn(i(), o))
              return !1;
          } catch {
            return !1;
          }
        }
    }
    if (n = t.child, t.subtreeFlags & 16384 && n !== null)
      n.return = t, t = n;
    else {
      if (t === e)
        break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e)
          return !0;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
  }
  return !0;
}
function Sr(e, t) {
  for (t &= ~ch, t &= ~Fc, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var n = 31 - kn(t), r = 1 << n;
    e[n] = -1, t &= ~r;
  }
}
function Xg(e) {
  if ((ke & 6) !== 0)
    throw Error(V(327));
  li();
  var t = Vl(e, 0);
  if ((t & 1) === 0)
    return zt(e, Ge()), null;
  var n = cc(e, t);
  if (e.tag !== 0 && n === 2) {
    var r = of(e);
    r !== 0 && (t = r, n = If(e, r));
  }
  if (n === 1)
    throw n = ea, mo(e, 0), Sr(e, t), zt(e, Ge()), n;
  if (n === 6)
    throw Error(V(345));
  return e.finishedWork = e.current.alternate, e.finishedLanes = t, oo(e, It, qn), zt(e, Ge()), null;
}
function dh(e, t) {
  var n = ke;
  ke |= 1;
  try {
    return e(t);
  } finally {
    ke = n, ke === 0 && (yi = Ge() + 500, Ic && qr());
  }
}
function Co(e) {
  Pr !== null && Pr.tag === 0 && (ke & 6) === 0 && li();
  var t = ke;
  ke |= 1;
  var n = an.transition, r = $e;
  try {
    if (an.transition = null, $e = 1, e)
      return e();
  } finally {
    $e = r, an.transition = n, ke = t, (ke & 6) === 0 && qr();
  }
}
function fh() {
  Vt = ei.current, De(ei);
}
function mo(e, t) {
  e.finishedWork = null, e.finishedLanes = 0;
  var n = e.timeoutHandle;
  if (n !== -1 && (e.timeoutHandle = -1, Fk(n)), nt !== null)
    for (n = nt.return; n !== null; ) {
      var r = n;
      switch (Yp(r), r.tag) {
        case 1:
          r = r.type.childContextTypes, r != null && Gl();
          break;
        case 3:
          gi(), De(Ft), De(Rt), th();
          break;
        case 5:
          eh(r);
          break;
        case 4:
          gi();
          break;
        case 13:
          De(Ue);
          break;
        case 19:
          De(Ue);
          break;
        case 10:
          Gp(r.type._context);
          break;
        case 22:
        case 23:
          fh();
      }
      n = n.return;
    }
  if (ut = e, nt = e = zr(e.current, null), ht = Vt = t, at = 0, ea = null, ch = Fc = So = 0, It = Ts = null, fo !== null) {
    for (t = 0; t < fo.length; t++)
      if (n = fo[t], r = n.interleaved, r !== null) {
        n.interleaved = null;
        var o = r.next, i = n.pending;
        if (i !== null) {
          var s = i.next;
          i.next = o, r.next = s;
        }
        n.pending = r;
      }
    fo = null;
  }
  return e;
}
function mb(e, t) {
  do {
    var n = nt;
    try {
      if (qp(), xl.current = ic, oc) {
        for (var r = He.memoizedState; r !== null; ) {
          var o = r.queue;
          o !== null && (o.pending = null), r = r.next;
        }
        oc = !1;
      }
      if (wo = 0, lt = it = He = null, Es = !1, Qs = 0, lh.current = null, n === null || n.return === null) {
        at = 1, ea = t, nt = null;
        break;
      }
      e: {
        var i = e, s = n.return, a = n, l = t;
        if (t = ht, a.flags |= 32768, l !== null && typeof l == "object" && typeof l.then == "function") {
          var c = l, u = a, f = u.tag;
          if ((u.mode & 1) === 0 && (f === 0 || f === 11 || f === 15)) {
            var h = u.alternate;
            h ? (u.updateQueue = h.updateQueue, u.memoizedState = h.memoizedState, u.lanes = h.lanes) : (u.updateQueue = null, u.memoizedState = null);
          }
          var y = Ag(s);
          if (y !== null) {
            y.flags &= -257, Ng(y, s, a, i, t), y.mode & 1 && Ig(i, c, t), t = y, l = c;
            var d = t.updateQueue;
            if (d === null) {
              var m = /* @__PURE__ */ new Set();
              m.add(l), t.updateQueue = m;
            } else
              d.add(l);
            break e;
          } else {
            if ((t & 1) === 0) {
              Ig(i, c, t), ph();
              break e;
            }
            l = Error(V(426));
          }
        } else if (je && a.mode & 1) {
          var w = Ag(s);
          if (w !== null) {
            (w.flags & 65536) === 0 && (w.flags |= 256), Ng(w, s, a, i, t), Xp(vi(l, a));
            break e;
          }
        }
        i = l = vi(l, a), at !== 4 && (at = 2), Ts === null ? Ts = [i] : Ts.push(i), i = s;
        do {
          switch (i.tag) {
            case 3:
              i.flags |= 65536, t &= -t, i.lanes |= t;
              var g = J1(i, l, t);
              Rg(i, g);
              break e;
            case 1:
              a = l;
              var p = i.type, v = i.stateNode;
              if ((i.flags & 128) === 0 && (typeof p.getDerivedStateFromError == "function" || v !== null && typeof v.componentDidCatch == "function" && (Fr === null || !Fr.has(v)))) {
                i.flags |= 65536, t &= -t, i.lanes |= t;
                var b = Z1(i, a, t);
                Rg(i, b);
                break e;
              }
          }
          i = i.return;
        } while (i !== null);
      }
      yb(n);
    } catch (C) {
      t = C, nt === n && n !== null && (nt = n = n.return);
      continue;
    }
    break;
  } while (1);
}
function gb() {
  var e = sc.current;
  return sc.current = ic, e === null ? ic : e;
}
function ph() {
  (at === 0 || at === 3 || at === 2) && (at = 4), ut === null || (So & 268435455) === 0 && (Fc & 268435455) === 0 || Sr(ut, ht);
}
function cc(e, t) {
  var n = ke;
  ke |= 2;
  var r = gb();
  (ut !== e || ht !== t) && (qn = null, mo(e, t));
  do
    try {
      lE();
      break;
    } catch (o) {
      mb(e, o);
    }
  while (1);
  if (qp(), ke = n, sc.current = r, nt !== null)
    throw Error(V(261));
  return ut = null, ht = 0, at;
}
function lE() {
  for (; nt !== null; )
    vb(nt);
}
function cE() {
  for (; nt !== null && !AC(); )
    vb(nt);
}
function vb(e) {
  var t = xb(e.alternate, e, Vt);
  e.memoizedProps = e.pendingProps, t === null ? yb(e) : nt = t, lh.current = null;
}
function yb(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (e = t.return, (t.flags & 32768) === 0) {
      if (n = tE(n, t, Vt), n !== null) {
        nt = n;
        return;
      }
    } else {
      if (n = nE(n, t), n !== null) {
        n.flags &= 32767, nt = n;
        return;
      }
      if (e !== null)
        e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
      else {
        at = 6, nt = null;
        return;
      }
    }
    if (t = t.sibling, t !== null) {
      nt = t;
      return;
    }
    nt = t = e;
  } while (t !== null);
  at === 0 && (at = 5);
}
function oo(e, t, n) {
  var r = $e, o = an.transition;
  try {
    an.transition = null, $e = 1, uE(e, t, n, r);
  } finally {
    an.transition = o, $e = r;
  }
  return null;
}
function uE(e, t, n, r) {
  do
    li();
  while (Pr !== null);
  if ((ke & 6) !== 0)
    throw Error(V(327));
  n = e.finishedWork;
  var o = e.finishedLanes;
  if (n === null)
    return null;
  if (e.finishedWork = null, e.finishedLanes = 0, n === e.current)
    throw Error(V(177));
  e.callbackNode = null, e.callbackPriority = 0;
  var i = n.lanes | n.childLanes;
  if (HC(e, i), e === ut && (nt = ut = null, ht = 0), (n.subtreeFlags & 2064) === 0 && (n.flags & 2064) === 0 || Qa || (Qa = !0, wb(Hl, function() {
    return li(), null;
  })), i = (n.flags & 15990) !== 0, (n.subtreeFlags & 15990) !== 0 || i) {
    i = an.transition, an.transition = null;
    var s = $e;
    $e = 1;
    var a = ke;
    ke |= 4, lh.current = null, oE(e, n), fb(n, e), $k(df), Yl = !!uf, df = uf = null, e.current = n, iE(n), NC(), ke = a, $e = s, an.transition = i;
  } else
    e.current = n;
  if (Qa && (Qa = !1, Pr = e, lc = o), i = e.pendingLanes, i === 0 && (Fr = null), DC(n.stateNode), zt(e, Ge()), t !== null)
    for (r = e.onRecoverableError, n = 0; n < t.length; n++)
      o = t[n], r(o.value, { componentStack: o.stack, digest: o.digest });
  if (ac)
    throw ac = !1, e = _f, _f = null, e;
  return (lc & 1) !== 0 && e.tag !== 0 && li(), i = e.pendingLanes, (i & 1) !== 0 ? e === Mf ? Ps++ : (Ps = 0, Mf = e) : Ps = 0, qr(), null;
}
function li() {
  if (Pr !== null) {
    var e = Qy(lc), t = an.transition, n = $e;
    try {
      if (an.transition = null, $e = 16 > e ? 16 : e, Pr === null)
        var r = !1;
      else {
        if (e = Pr, Pr = null, lc = 0, (ke & 6) !== 0)
          throw Error(V(331));
        var o = ke;
        for (ke |= 4, ee = e.current; ee !== null; ) {
          var i = ee, s = i.child;
          if ((ee.flags & 16) !== 0) {
            var a = i.deletions;
            if (a !== null) {
              for (var l = 0; l < a.length; l++) {
                var c = a[l];
                for (ee = c; ee !== null; ) {
                  var u = ee;
                  switch (u.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Rs(8, u, i);
                  }
                  var f = u.child;
                  if (f !== null)
                    f.return = u, ee = f;
                  else
                    for (; ee !== null; ) {
                      u = ee;
                      var h = u.sibling, y = u.return;
                      if (cb(u), u === c) {
                        ee = null;
                        break;
                      }
                      if (h !== null) {
                        h.return = y, ee = h;
                        break;
                      }
                      ee = y;
                    }
                }
              }
              var d = i.alternate;
              if (d !== null) {
                var m = d.child;
                if (m !== null) {
                  d.child = null;
                  do {
                    var w = m.sibling;
                    m.sibling = null, m = w;
                  } while (m !== null);
                }
              }
              ee = i;
            }
          }
          if ((i.subtreeFlags & 2064) !== 0 && s !== null)
            s.return = i, ee = s;
          else
            e:
              for (; ee !== null; ) {
                if (i = ee, (i.flags & 2048) !== 0)
                  switch (i.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Rs(9, i, i.return);
                  }
                var g = i.sibling;
                if (g !== null) {
                  g.return = i.return, ee = g;
                  break e;
                }
                ee = i.return;
              }
        }
        var p = e.current;
        for (ee = p; ee !== null; ) {
          s = ee;
          var v = s.child;
          if ((s.subtreeFlags & 2064) !== 0 && v !== null)
            v.return = s, ee = v;
          else
            e:
              for (s = p; ee !== null; ) {
                if (a = ee, (a.flags & 2048) !== 0)
                  try {
                    switch (a.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Lc(9, a);
                    }
                  } catch (C) {
                    Xe(a, a.return, C);
                  }
                if (a === s) {
                  ee = null;
                  break e;
                }
                var b = a.sibling;
                if (b !== null) {
                  b.return = a.return, ee = b;
                  break e;
                }
                ee = a.return;
              }
        }
        if (ke = o, qr(), Nn && typeof Nn.onPostCommitFiberRoot == "function")
          try {
            Nn.onPostCommitFiberRoot(Pc, e);
          } catch {
          }
        r = !0;
      }
      return r;
    } finally {
      $e = n, an.transition = t;
    }
  }
  return !1;
}
function Kg(e, t, n) {
  t = vi(n, t), t = J1(e, t, 1), e = Lr(e, t, 1), t = Ot(), e !== null && (xa(e, 1, t), zt(e, t));
}
function Xe(e, t, n) {
  if (e.tag === 3)
    Kg(e, e, n);
  else
    for (; t !== null; ) {
      if (t.tag === 3) {
        Kg(t, e, n);
        break;
      } else if (t.tag === 1) {
        var r = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (Fr === null || !Fr.has(r))) {
          e = vi(n, e), e = Z1(t, e, 1), t = Lr(t, e, 1), e = Ot(), t !== null && (xa(t, 1, e), zt(t, e));
          break;
        }
      }
      t = t.return;
    }
}
function dE(e, t, n) {
  var r = e.pingCache;
  r !== null && r.delete(t), t = Ot(), e.pingedLanes |= e.suspendedLanes & n, ut === e && (ht & n) === n && (at === 4 || at === 3 && (ht & 130023424) === ht && 500 > Ge() - uh ? mo(e, 0) : ch |= n), zt(e, t);
}
function bb(e, t) {
  t === 0 && ((e.mode & 1) === 0 ? t = 1 : (t = ja, ja <<= 1, (ja & 130023424) === 0 && (ja = 4194304)));
  var n = Ot();
  e = or(e, t), e !== null && (xa(e, t, n), zt(e, n));
}
function fE(e) {
  var t = e.memoizedState, n = 0;
  t !== null && (n = t.retryLane), bb(e, n);
}
function pE(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var r = e.stateNode, o = e.memoizedState;
      o !== null && (n = o.retryLane);
      break;
    case 19:
      r = e.stateNode;
      break;
    default:
      throw Error(V(314));
  }
  r !== null && r.delete(t), bb(e, n);
}
var xb;
xb = function(e, t, n) {
  if (e !== null)
    if (e.memoizedProps !== t.pendingProps || Ft.current)
      Lt = !0;
    else {
      if ((e.lanes & n) === 0 && (t.flags & 128) === 0)
        return Lt = !1, eE(e, t, n);
      Lt = (e.flags & 131072) !== 0;
    }
  else
    Lt = !1, je && (t.flags & 1048576) !== 0 && C1(t, Zl, t.index);
  switch (t.lanes = 0, t.tag) {
    case 2:
      var r = t.type;
      Sl(e, t), e = t.pendingProps;
      var o = pi(t, Rt.current);
      ai(t, n), o = rh(null, t, r, e, o, n);
      var i = oh();
      return t.flags |= 1, typeof o == "object" && o !== null && typeof o.render == "function" && o.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, Dt(r) ? (i = !0, Ql(t)) : i = !1, t.memoizedState = o.state !== null && o.state !== void 0 ? o.state : null, Jp(t), o.updater = Ac, t.stateNode = o, o._reactInternals = t, xf(t, r, e, n), t = Cf(null, t, r, !0, i, n)) : (t.tag = 0, je && i && Vp(t), Pt(null, t, o, n), t = t.child), t;
    case 16:
      r = t.elementType;
      e: {
        switch (Sl(e, t), e = t.pendingProps, o = r._init, r = o(r._payload), t.type = r, o = t.tag = mE(r), e = yn(r, e), o) {
          case 0:
            t = Sf(null, t, r, e, n);
            break e;
          case 1:
            t = Dg(null, t, r, e, n);
            break e;
          case 11:
            t = Lg(null, t, r, e, n);
            break e;
          case 14:
            t = Fg(null, t, r, yn(r.type, e), n);
            break e;
        }
        throw Error(V(
          306,
          r,
          ""
        ));
      }
      return t;
    case 0:
      return r = t.type, o = t.pendingProps, o = t.elementType === r ? o : yn(r, o), Sf(e, t, r, o, n);
    case 1:
      return r = t.type, o = t.pendingProps, o = t.elementType === r ? o : yn(r, o), Dg(e, t, r, o, n);
    case 3:
      e: {
        if (rb(t), e === null)
          throw Error(V(387));
        r = t.pendingProps, i = t.memoizedState, o = i.element, T1(e, t), nc(t, r, null, n);
        var s = t.memoizedState;
        if (r = s.element, i.isDehydrated)
          if (i = { element: r, isDehydrated: !1, cache: s.cache, pendingSuspenseBoundaries: s.pendingSuspenseBoundaries, transitions: s.transitions }, t.updateQueue.baseState = i, t.memoizedState = i, t.flags & 256) {
            o = vi(Error(V(423)), t), t = zg(e, t, r, n, o);
            break e;
          } else if (r !== o) {
            o = vi(Error(V(424)), t), t = zg(e, t, r, n, o);
            break e;
          } else
            for (Yt = Nr(t.stateNode.containerInfo.firstChild), Xt = t, je = !0, Sn = null, n = _1(t, null, r, n), t.child = n; n; )
              n.flags = n.flags & -3 | 4096, n = n.sibling;
        else {
          if (hi(), r === o) {
            t = ir(e, t, n);
            break e;
          }
          Pt(e, t, r, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return M1(t), e === null && vf(t), r = t.type, o = t.pendingProps, i = e !== null ? e.memoizedProps : null, s = o.children, ff(r, o) ? s = null : i !== null && ff(r, i) && (t.flags |= 32), nb(e, t), Pt(e, t, s, n), t.child;
    case 6:
      return e === null && vf(t), null;
    case 13:
      return ob(e, t, n);
    case 4:
      return Zp(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = mi(t, null, r, n) : Pt(e, t, r, n), t.child;
    case 11:
      return r = t.type, o = t.pendingProps, o = t.elementType === r ? o : yn(r, o), Lg(e, t, r, o, n);
    case 7:
      return Pt(e, t, t.pendingProps, n), t.child;
    case 8:
      return Pt(e, t, t.pendingProps.children, n), t.child;
    case 12:
      return Pt(e, t, t.pendingProps.children, n), t.child;
    case 10:
      e: {
        if (r = t.type._context, o = t.pendingProps, i = t.memoizedProps, s = o.value, Ne(ec, r._currentValue), r._currentValue = s, i !== null)
          if (Rn(i.value, s)) {
            if (i.children === o.children && !Ft.current) {
              t = ir(e, t, n);
              break e;
            }
          } else
            for (i = t.child, i !== null && (i.return = t); i !== null; ) {
              var a = i.dependencies;
              if (a !== null) {
                s = i.child;
                for (var l = a.firstContext; l !== null; ) {
                  if (l.context === r) {
                    if (i.tag === 1) {
                      l = Zn(-1, n & -n), l.tag = 2;
                      var c = i.updateQueue;
                      if (c !== null) {
                        c = c.shared;
                        var u = c.pending;
                        u === null ? l.next = l : (l.next = u.next, u.next = l), c.pending = l;
                      }
                    }
                    i.lanes |= n, l = i.alternate, l !== null && (l.lanes |= n), yf(
                      i.return,
                      n,
                      t
                    ), a.lanes |= n;
                    break;
                  }
                  l = l.next;
                }
              } else if (i.tag === 10)
                s = i.type === t.type ? null : i.child;
              else if (i.tag === 18) {
                if (s = i.return, s === null)
                  throw Error(V(341));
                s.lanes |= n, a = s.alternate, a !== null && (a.lanes |= n), yf(s, n, t), s = i.sibling;
              } else
                s = i.child;
              if (s !== null)
                s.return = i;
              else
                for (s = i; s !== null; ) {
                  if (s === t) {
                    s = null;
                    break;
                  }
                  if (i = s.sibling, i !== null) {
                    i.return = s.return, s = i;
                    break;
                  }
                  s = s.return;
                }
              i = s;
            }
        Pt(e, t, o.children, n), t = t.child;
      }
      return t;
    case 9:
      return o = t.type, r = t.pendingProps.children, ai(t, n), o = cn(o), r = r(o), t.flags |= 1, Pt(e, t, r, n), t.child;
    case 14:
      return r = t.type, o = yn(r, t.pendingProps), o = yn(r.type, o), Fg(e, t, r, o, n);
    case 15:
      return eb(e, t, t.type, t.pendingProps, n);
    case 17:
      return r = t.type, o = t.pendingProps, o = t.elementType === r ? o : yn(r, o), Sl(e, t), t.tag = 1, Dt(r) ? (e = !0, Ql(t)) : e = !1, ai(t, n), O1(t, r, o), xf(t, r, o, n), Cf(null, t, r, !0, e, n);
    case 19:
      return ib(e, t, n);
    case 22:
      return tb(e, t, n);
  }
  throw Error(V(156, t.tag));
};
function wb(e, t) {
  return Xy(e, t);
}
function hE(e, t, n, r) {
  this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function on(e, t, n, r) {
  return new hE(e, t, n, r);
}
function hh(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function mE(e) {
  if (typeof e == "function")
    return hh(e) ? 1 : 0;
  if (e != null) {
    if (e = e.$$typeof, e === Ip)
      return 11;
    if (e === Ap)
      return 14;
  }
  return 2;
}
function zr(e, t) {
  var n = e.alternate;
  return n === null ? (n = on(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
}
function El(e, t, n, r, o, i) {
  var s = 2;
  if (r = e, typeof e == "function")
    hh(e) && (s = 1);
  else if (typeof e == "string")
    s = 5;
  else
    e:
      switch (e) {
        case Ho:
          return go(n.children, o, i, t);
        case Mp:
          s = 8, o |= 8;
          break;
        case Ud:
          return e = on(12, n, t, o | 2), e.elementType = Ud, e.lanes = i, e;
        case Hd:
          return e = on(13, n, t, o), e.elementType = Hd, e.lanes = i, e;
        case Vd:
          return e = on(19, n, t, o), e.elementType = Vd, e.lanes = i, e;
        case $y:
          return Dc(n, o, i, t);
        default:
          if (typeof e == "object" && e !== null)
            switch (e.$$typeof) {
              case Py:
                s = 10;
                break e;
              case Oy:
                s = 9;
                break e;
              case Ip:
                s = 11;
                break e;
              case Ap:
                s = 14;
                break e;
              case br:
                s = 16, r = null;
                break e;
            }
          throw Error(V(130, e == null ? e : typeof e, ""));
      }
  return t = on(s, n, t, o), t.elementType = e, t.type = r, t.lanes = i, t;
}
function go(e, t, n, r) {
  return e = on(7, e, r, t), e.lanes = n, e;
}
function Dc(e, t, n, r) {
  return e = on(22, e, r, t), e.elementType = $y, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
}
function fd(e, t, n) {
  return e = on(6, e, null, t), e.lanes = n, e;
}
function pd(e, t, n) {
  return t = on(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
}
function gE(e, t, n, r, o) {
  this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Xu(0), this.expirationTimes = Xu(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Xu(0), this.identifierPrefix = r, this.onRecoverableError = o, this.mutableSourceEagerHydrationData = null;
}
function mh(e, t, n, r, o, i, s, a, l) {
  return e = new gE(e, t, n, a, l), t === 1 ? (t = 1, i === !0 && (t |= 8)) : t = 0, i = on(3, null, null, t), e.current = i, i.stateNode = e, i.memoizedState = { element: r, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, Jp(i), e;
}
function vE(e, t, n) {
  var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: Uo, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
}
function Sb(e) {
  if (!e)
    return Ur;
  e = e._reactInternals;
  e: {
    if (_o(e) !== e || e.tag !== 1)
      throw Error(V(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (Dt(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(V(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (Dt(n))
      return w1(e, n, t);
  }
  return t;
}
function Cb(e, t, n, r, o, i, s, a, l) {
  return e = mh(n, r, !0, e, o, i, s, a, l), e.context = Sb(null), n = e.current, r = Ot(), o = Dr(n), i = Zn(r, o), i.callback = t != null ? t : null, Lr(n, i, o), e.current.lanes = o, xa(e, o, r), zt(e, r), e;
}
function zc(e, t, n, r) {
  var o = t.current, i = Ot(), s = Dr(o);
  return n = Sb(n), t.context === null ? t.context = n : t.pendingContext = n, t = Zn(i, s), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = Lr(o, t, s), e !== null && (En(e, o, s, i), bl(e, o, s)), s;
}
function uc(e) {
  if (e = e.current, !e.child)
    return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function qg(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function gh(e, t) {
  qg(e, t), (e = e.alternate) && qg(e, t);
}
function yE() {
  return null;
}
var kb = typeof reportError == "function" ? reportError : function(e) {
  console.error(e);
};
function vh(e) {
  this._internalRoot = e;
}
Bc.prototype.render = vh.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null)
    throw Error(V(409));
  zc(e, t, null, null);
};
Bc.prototype.unmount = vh.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    Co(function() {
      zc(null, e, null, null);
    }), t[rr] = null;
  }
};
function Bc(e) {
  this._internalRoot = e;
}
Bc.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = e1();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < wr.length && t !== 0 && t < wr[n].priority; n++)
      ;
    wr.splice(n, 0, e), n === 0 && n1(e);
  }
};
function yh(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function jc(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
}
function Gg() {
}
function bE(e, t, n, r, o) {
  if (o) {
    if (typeof r == "function") {
      var i = r;
      r = function() {
        var c = uc(s);
        i.call(c);
      };
    }
    var s = Cb(t, r, e, 0, null, !1, !1, "", Gg);
    return e._reactRootContainer = s, e[rr] = s.current, Ys(e.nodeType === 8 ? e.parentNode : e), Co(), s;
  }
  for (; o = e.lastChild; )
    e.removeChild(o);
  if (typeof r == "function") {
    var a = r;
    r = function() {
      var c = uc(l);
      a.call(c);
    };
  }
  var l = mh(e, 0, !1, null, null, !1, !1, "", Gg);
  return e._reactRootContainer = l, e[rr] = l.current, Ys(e.nodeType === 8 ? e.parentNode : e), Co(function() {
    zc(t, l, n, r);
  }), l;
}
function Wc(e, t, n, r, o) {
  var i = n._reactRootContainer;
  if (i) {
    var s = i;
    if (typeof o == "function") {
      var a = o;
      o = function() {
        var l = uc(s);
        a.call(l);
      };
    }
    zc(t, s, e, o);
  } else
    s = bE(n, t, e, o, r);
  return uc(s);
}
Jy = function(e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = ds(t.pendingLanes);
        n !== 0 && (Fp(t, n | 1), zt(t, Ge()), (ke & 6) === 0 && (yi = Ge() + 500, qr()));
      }
      break;
    case 13:
      Co(function() {
        var r = or(e, 1);
        if (r !== null) {
          var o = Ot();
          En(r, e, 1, o);
        }
      }), gh(e, 1);
  }
};
Dp = function(e) {
  if (e.tag === 13) {
    var t = or(e, 134217728);
    if (t !== null) {
      var n = Ot();
      En(t, e, 134217728, n);
    }
    gh(e, 134217728);
  }
};
Zy = function(e) {
  if (e.tag === 13) {
    var t = Dr(e), n = or(e, t);
    if (n !== null) {
      var r = Ot();
      En(n, e, t, r);
    }
    gh(e, t);
  }
};
e1 = function() {
  return $e;
};
t1 = function(e, t) {
  var n = $e;
  try {
    return $e = e, t();
  } finally {
    $e = n;
  }
};
tf = function(e, t, n) {
  switch (t) {
    case "input":
      if (Kd(e, n), t = n.name, n.type === "radio" && t != null) {
        for (n = e; n.parentNode; )
          n = n.parentNode;
        for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
          var r = n[t];
          if (r !== e && r.form === e.form) {
            var o = Mc(r);
            if (!o)
              throw Error(V(90));
            My(r), Kd(r, o);
          }
        }
      }
      break;
    case "textarea":
      Ay(e, n);
      break;
    case "select":
      t = n.value, t != null && ri(e, !!n.multiple, t, !1);
  }
};
jy = dh;
Wy = Co;
var xE = { usingClientEntryPoint: !1, Events: [Sa, Ko, Mc, zy, By, dh] }, Qi = { findFiberByHostInstance: uo, bundleType: 0, version: "18.2.0", rendererPackageName: "react-dom" }, wE = { bundleType: Qi.bundleType, version: Qi.version, rendererPackageName: Qi.rendererPackageName, rendererConfig: Qi.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ur.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
  return e = Vy(e), e === null ? null : e.stateNode;
}, findFiberByHostInstance: Qi.findFiberByHostInstance || yE, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.2.0-next-9e3b772b8-20220608" };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var Ja = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!Ja.isDisabled && Ja.supportsFiber)
    try {
      Pc = Ja.inject(wE), Nn = Ja;
    } catch {
    }
}
Qt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = xE;
Qt.createPortal = function(e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!yh(t))
    throw Error(V(200));
  return vE(e, t, null, n);
};
Qt.createRoot = function(e, t) {
  if (!yh(e))
    throw Error(V(299));
  var n = !1, r = "", o = kb;
  return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onRecoverableError !== void 0 && (o = t.onRecoverableError)), t = mh(e, 1, !1, null, null, n, !1, r, o), e[rr] = t.current, Ys(e.nodeType === 8 ? e.parentNode : e), new vh(t);
};
Qt.findDOMNode = function(e) {
  if (e == null)
    return null;
  if (e.nodeType === 1)
    return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(V(188)) : (e = Object.keys(e).join(","), Error(V(268, e)));
  return e = Vy(t), e = e === null ? null : e.stateNode, e;
};
Qt.flushSync = function(e) {
  return Co(e);
};
Qt.hydrate = function(e, t, n) {
  if (!jc(t))
    throw Error(V(200));
  return Wc(null, e, t, !0, n);
};
Qt.hydrateRoot = function(e, t, n) {
  if (!yh(e))
    throw Error(V(405));
  var r = n != null && n.hydratedSources || null, o = !1, i = "", s = kb;
  if (n != null && (n.unstable_strictMode === !0 && (o = !0), n.identifierPrefix !== void 0 && (i = n.identifierPrefix), n.onRecoverableError !== void 0 && (s = n.onRecoverableError)), t = Cb(t, null, e, 1, n != null ? n : null, o, !1, i, s), e[rr] = t.current, Ys(e), r)
    for (e = 0; e < r.length; e++)
      n = r[e], o = n._getVersion, o = o(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, o] : t.mutableSourceEagerHydrationData.push(
        n,
        o
      );
  return new Bc(t);
};
Qt.render = function(e, t, n) {
  if (!jc(t))
    throw Error(V(200));
  return Wc(null, e, t, !1, n);
};
Qt.unmountComponentAtNode = function(e) {
  if (!jc(e))
    throw Error(V(40));
  return e._reactRootContainer ? (Co(function() {
    Wc(null, null, e, !1, function() {
      e._reactRootContainer = null, e[rr] = null;
    });
  }), !0) : !1;
};
Qt.unstable_batchedUpdates = dh;
Qt.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
  if (!jc(n))
    throw Error(V(200));
  if (e == null || e._reactInternals === void 0)
    throw Error(V(38));
  return Wc(e, t, n, !1, r);
};
Qt.version = "18.2.0-next-9e3b772b8-20220608";
(function(e) {
  function t() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(t);
      } catch (n) {
        console.error(n);
      }
  }
  t(), e.exports = Qt;
})(Pi);
const Za = /* @__PURE__ */ Tc(Pi.exports);
var Qg = Pi.exports;
Fs.createRoot = Qg.createRoot, Fs.hydrateRoot = Qg.hydrateRoot;
var Eb = { exports: {} }, Rb = {};
/**
 * @license React
 * use-sync-external-store-shim.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var bi = x.exports;
function SE(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var CE = typeof Object.is == "function" ? Object.is : SE, kE = bi.useState, EE = bi.useEffect, RE = bi.useLayoutEffect, TE = bi.useDebugValue;
function PE(e, t) {
  var n = t(), r = kE({ inst: { value: n, getSnapshot: t } }), o = r[0].inst, i = r[1];
  return RE(function() {
    o.value = n, o.getSnapshot = t, hd(o) && i({ inst: o });
  }, [e, n, t]), EE(function() {
    return hd(o) && i({ inst: o }), e(function() {
      hd(o) && i({ inst: o });
    });
  }, [e]), TE(n), n;
}
function hd(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !CE(e, n);
  } catch {
    return !0;
  }
}
function OE(e, t) {
  return t();
}
var $E = typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u" ? OE : PE;
Rb.useSyncExternalStore = bi.useSyncExternalStore !== void 0 ? bi.useSyncExternalStore : $E;
(function(e) {
  e.exports = Rb;
})(Eb);
var Tb = { exports: {} }, Pb = {};
/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Uc = x.exports, _E = Eb.exports;
function ME(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var IE = typeof Object.is == "function" ? Object.is : ME, AE = _E.useSyncExternalStore, NE = Uc.useRef, LE = Uc.useEffect, FE = Uc.useMemo, DE = Uc.useDebugValue;
Pb.useSyncExternalStoreWithSelector = function(e, t, n, r, o) {
  var i = NE(null);
  if (i.current === null) {
    var s = { hasValue: !1, value: null };
    i.current = s;
  } else
    s = i.current;
  i = FE(function() {
    function l(y) {
      if (!c) {
        if (c = !0, u = y, y = r(y), o !== void 0 && s.hasValue) {
          var d = s.value;
          if (o(d, y))
            return f = d;
        }
        return f = y;
      }
      if (d = f, IE(u, y))
        return d;
      var m = r(y);
      return o !== void 0 && o(d, m) ? d : (u = y, f = m);
    }
    var c = !1, u, f, h = n === void 0 ? null : n;
    return [function() {
      return l(t());
    }, h === null ? void 0 : function() {
      return l(h());
    }];
  }, [t, n, r, o]);
  var a = AE(e, i[0], i[1]);
  return LE(function() {
    s.hasValue = !0, s.value = a;
  }, [a]), DE(a), a;
};
(function(e) {
  e.exports = Pb;
})(Tb);
function zE(e) {
  e();
}
let Ob = zE;
const BE = (e) => Ob = e, jE = () => Ob, Hr = /* @__PURE__ */ x.exports.createContext(null);
function $b() {
  return x.exports.useContext(Hr);
}
const WE = () => {
  throw new Error("uSES not initialized!");
};
let _b = WE;
const UE = (e) => {
  _b = e;
}, HE = (e, t) => e === t;
function VE(e = Hr) {
  const t = e === Hr ? $b : () => x.exports.useContext(e);
  return function(r, o = HE) {
    const {
      store: i,
      subscription: s,
      getServerState: a
    } = t(), l = _b(s.addNestedSub, i.getState, a || i.getState, r, o);
    return x.exports.useDebugValue(l), l;
  };
}
const Mi = /* @__PURE__ */ VE();
function k() {
  return k = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = arguments[t];
      for (var r in n)
        Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
    }
    return e;
  }, k.apply(this, arguments);
}
function Q(e, t) {
  if (e == null)
    return {};
  var n = {}, r = Object.keys(e), o, i;
  for (i = 0; i < r.length; i++)
    o = r[i], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
var Mb = { exports: {} }, _e = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var dt = typeof Symbol == "function" && Symbol.for, bh = dt ? Symbol.for("react.element") : 60103, xh = dt ? Symbol.for("react.portal") : 60106, Hc = dt ? Symbol.for("react.fragment") : 60107, Vc = dt ? Symbol.for("react.strict_mode") : 60108, Yc = dt ? Symbol.for("react.profiler") : 60114, Xc = dt ? Symbol.for("react.provider") : 60109, Kc = dt ? Symbol.for("react.context") : 60110, wh = dt ? Symbol.for("react.async_mode") : 60111, qc = dt ? Symbol.for("react.concurrent_mode") : 60111, Gc = dt ? Symbol.for("react.forward_ref") : 60112, Qc = dt ? Symbol.for("react.suspense") : 60113, YE = dt ? Symbol.for("react.suspense_list") : 60120, Jc = dt ? Symbol.for("react.memo") : 60115, Zc = dt ? Symbol.for("react.lazy") : 60116, XE = dt ? Symbol.for("react.block") : 60121, KE = dt ? Symbol.for("react.fundamental") : 60117, qE = dt ? Symbol.for("react.responder") : 60118, GE = dt ? Symbol.for("react.scope") : 60119;
function Zt(e) {
  if (typeof e == "object" && e !== null) {
    var t = e.$$typeof;
    switch (t) {
      case bh:
        switch (e = e.type, e) {
          case wh:
          case qc:
          case Hc:
          case Yc:
          case Vc:
          case Qc:
            return e;
          default:
            switch (e = e && e.$$typeof, e) {
              case Kc:
              case Gc:
              case Zc:
              case Jc:
              case Xc:
                return e;
              default:
                return t;
            }
        }
      case xh:
        return t;
    }
  }
}
function Ib(e) {
  return Zt(e) === qc;
}
_e.AsyncMode = wh;
_e.ConcurrentMode = qc;
_e.ContextConsumer = Kc;
_e.ContextProvider = Xc;
_e.Element = bh;
_e.ForwardRef = Gc;
_e.Fragment = Hc;
_e.Lazy = Zc;
_e.Memo = Jc;
_e.Portal = xh;
_e.Profiler = Yc;
_e.StrictMode = Vc;
_e.Suspense = Qc;
_e.isAsyncMode = function(e) {
  return Ib(e) || Zt(e) === wh;
};
_e.isConcurrentMode = Ib;
_e.isContextConsumer = function(e) {
  return Zt(e) === Kc;
};
_e.isContextProvider = function(e) {
  return Zt(e) === Xc;
};
_e.isElement = function(e) {
  return typeof e == "object" && e !== null && e.$$typeof === bh;
};
_e.isForwardRef = function(e) {
  return Zt(e) === Gc;
};
_e.isFragment = function(e) {
  return Zt(e) === Hc;
};
_e.isLazy = function(e) {
  return Zt(e) === Zc;
};
_e.isMemo = function(e) {
  return Zt(e) === Jc;
};
_e.isPortal = function(e) {
  return Zt(e) === xh;
};
_e.isProfiler = function(e) {
  return Zt(e) === Yc;
};
_e.isStrictMode = function(e) {
  return Zt(e) === Vc;
};
_e.isSuspense = function(e) {
  return Zt(e) === Qc;
};
_e.isValidElementType = function(e) {
  return typeof e == "string" || typeof e == "function" || e === Hc || e === qc || e === Yc || e === Vc || e === Qc || e === YE || typeof e == "object" && e !== null && (e.$$typeof === Zc || e.$$typeof === Jc || e.$$typeof === Xc || e.$$typeof === Kc || e.$$typeof === Gc || e.$$typeof === KE || e.$$typeof === qE || e.$$typeof === GE || e.$$typeof === XE);
};
_e.typeOf = Zt;
(function(e) {
  e.exports = _e;
})(Mb);
var Ab = Mb.exports, QE = {
  $$typeof: !0,
  render: !0,
  defaultProps: !0,
  displayName: !0,
  propTypes: !0
}, JE = {
  $$typeof: !0,
  compare: !0,
  defaultProps: !0,
  displayName: !0,
  propTypes: !0,
  type: !0
}, Nb = {};
Nb[Ab.ForwardRef] = QE;
Nb[Ab.Memo] = JE;
var ZE = { exports: {} }, Me = {};
/**
 * @license React
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Sh = Symbol.for("react.element"), Ch = Symbol.for("react.portal"), eu = Symbol.for("react.fragment"), tu = Symbol.for("react.strict_mode"), nu = Symbol.for("react.profiler"), ru = Symbol.for("react.provider"), ou = Symbol.for("react.context"), eR = Symbol.for("react.server_context"), iu = Symbol.for("react.forward_ref"), su = Symbol.for("react.suspense"), au = Symbol.for("react.suspense_list"), lu = Symbol.for("react.memo"), cu = Symbol.for("react.lazy"), tR = Symbol.for("react.offscreen"), Lb;
Lb = Symbol.for("react.module.reference");
function pn(e) {
  if (typeof e == "object" && e !== null) {
    var t = e.$$typeof;
    switch (t) {
      case Sh:
        switch (e = e.type, e) {
          case eu:
          case nu:
          case tu:
          case su:
          case au:
            return e;
          default:
            switch (e = e && e.$$typeof, e) {
              case eR:
              case ou:
              case iu:
              case cu:
              case lu:
              case ru:
                return e;
              default:
                return t;
            }
        }
      case Ch:
        return t;
    }
  }
}
Me.ContextConsumer = ou;
Me.ContextProvider = ru;
Me.Element = Sh;
Me.ForwardRef = iu;
Me.Fragment = eu;
Me.Lazy = cu;
Me.Memo = lu;
Me.Portal = Ch;
Me.Profiler = nu;
Me.StrictMode = tu;
Me.Suspense = su;
Me.SuspenseList = au;
Me.isAsyncMode = function() {
  return !1;
};
Me.isConcurrentMode = function() {
  return !1;
};
Me.isContextConsumer = function(e) {
  return pn(e) === ou;
};
Me.isContextProvider = function(e) {
  return pn(e) === ru;
};
Me.isElement = function(e) {
  return typeof e == "object" && e !== null && e.$$typeof === Sh;
};
Me.isForwardRef = function(e) {
  return pn(e) === iu;
};
Me.isFragment = function(e) {
  return pn(e) === eu;
};
Me.isLazy = function(e) {
  return pn(e) === cu;
};
Me.isMemo = function(e) {
  return pn(e) === lu;
};
Me.isPortal = function(e) {
  return pn(e) === Ch;
};
Me.isProfiler = function(e) {
  return pn(e) === nu;
};
Me.isStrictMode = function(e) {
  return pn(e) === tu;
};
Me.isSuspense = function(e) {
  return pn(e) === su;
};
Me.isSuspenseList = function(e) {
  return pn(e) === au;
};
Me.isValidElementType = function(e) {
  return typeof e == "string" || typeof e == "function" || e === eu || e === nu || e === tu || e === su || e === au || e === tR || typeof e == "object" && e !== null && (e.$$typeof === cu || e.$$typeof === lu || e.$$typeof === ru || e.$$typeof === ou || e.$$typeof === iu || e.$$typeof === Lb || e.getModuleId !== void 0);
};
Me.typeOf = pn;
(function(e) {
  e.exports = Me;
})(ZE);
function nR() {
  const e = jE();
  let t = null, n = null;
  return {
    clear() {
      t = null, n = null;
    },
    notify() {
      e(() => {
        let r = t;
        for (; r; )
          r.callback(), r = r.next;
      });
    },
    get() {
      let r = [], o = t;
      for (; o; )
        r.push(o), o = o.next;
      return r;
    },
    subscribe(r) {
      let o = !0, i = n = {
        callback: r,
        next: null,
        prev: n
      };
      return i.prev ? i.prev.next = i : t = i, function() {
        !o || t === null || (o = !1, i.next ? i.next.prev = i.prev : n = i.prev, i.prev ? i.prev.next = i.next : t = i.next);
      };
    }
  };
}
const Jg = {
  notify() {
  },
  get: () => []
};
function rR(e, t) {
  let n, r = Jg;
  function o(f) {
    return l(), r.subscribe(f);
  }
  function i() {
    r.notify();
  }
  function s() {
    u.onStateChange && u.onStateChange();
  }
  function a() {
    return Boolean(n);
  }
  function l() {
    n || (n = t ? t.addNestedSub(s) : e.subscribe(s), r = nR());
  }
  function c() {
    n && (n(), n = void 0, r.clear(), r = Jg);
  }
  const u = {
    addNestedSub: o,
    notifyNestedSubs: i,
    handleChangeWrapper: s,
    isSubscribed: a,
    trySubscribe: l,
    tryUnsubscribe: c,
    getListeners: () => r
  };
  return u;
}
const oR = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u", iR = oR ? x.exports.useLayoutEffect : x.exports.useEffect;
var uu = { exports: {} }, du = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var sR = x.exports, aR = Symbol.for("react.element"), lR = Symbol.for("react.fragment"), cR = Object.prototype.hasOwnProperty, uR = sR.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, dR = { key: !0, ref: !0, __self: !0, __source: !0 };
function Fb(e, t, n) {
  var r, o = {}, i = null, s = null;
  n !== void 0 && (i = "" + n), t.key !== void 0 && (i = "" + t.key), t.ref !== void 0 && (s = t.ref);
  for (r in t)
    cR.call(t, r) && !dR.hasOwnProperty(r) && (o[r] = t[r]);
  if (e && e.defaultProps)
    for (r in t = e.defaultProps, t)
      o[r] === void 0 && (o[r] = t[r]);
  return { $$typeof: aR, type: e, key: i, ref: s, props: o, _owner: uR.current };
}
du.Fragment = lR;
du.jsx = Fb;
du.jsxs = Fb;
(function(e) {
  e.exports = du;
})(uu);
const Et = uu.exports.Fragment, S = uu.exports.jsx, G = uu.exports.jsxs;
function fR({
  store: e,
  context: t,
  children: n,
  serverState: r
}) {
  const o = x.exports.useMemo(() => {
    const a = rR(e);
    return {
      store: e,
      subscription: a,
      getServerState: r ? () => r : void 0
    };
  }, [e, r]), i = x.exports.useMemo(() => e.getState(), [e]);
  return iR(() => {
    const {
      subscription: a
    } = o;
    return a.onStateChange = a.notifyNestedSubs, a.trySubscribe(), i !== e.getState() && a.notifyNestedSubs(), () => {
      a.tryUnsubscribe(), a.onStateChange = void 0;
    };
  }, [o, i]), /* @__PURE__ */ S((t || Hr).Provider, {
    value: o,
    children: n
  });
}
function Db(e = Hr) {
  const t = e === Hr ? $b : () => x.exports.useContext(e);
  return function() {
    const {
      store: r
    } = t();
    return r;
  };
}
const pR = /* @__PURE__ */ Db();
function hR(e = Hr) {
  const t = e === Hr ? pR : Db(e);
  return function() {
    return t().dispatch;
  };
}
const kh = /* @__PURE__ */ hR();
UE(Tb.exports.useSyncExternalStoreWithSelector);
BE(Pi.exports.unstable_batchedUpdates);
function zb(e) {
  var t = /* @__PURE__ */ Object.create(null);
  return function(n) {
    return t[n] === void 0 && (t[n] = e(n)), t[n];
  };
}
var mR = /^((children|dangerouslySetInnerHTML|key|ref|autoFocus|defaultValue|defaultChecked|innerHTML|suppressContentEditableWarning|suppressHydrationWarning|valueLink|abbr|accept|acceptCharset|accessKey|action|allow|allowUserMedia|allowPaymentRequest|allowFullScreen|allowTransparency|alt|async|autoComplete|autoPlay|capture|cellPadding|cellSpacing|challenge|charSet|checked|cite|classID|className|cols|colSpan|content|contentEditable|contextMenu|controls|controlsList|coords|crossOrigin|data|dateTime|decoding|default|defer|dir|disabled|disablePictureInPicture|download|draggable|encType|enterKeyHint|form|formAction|formEncType|formMethod|formNoValidate|formTarget|frameBorder|headers|height|hidden|high|href|hrefLang|htmlFor|httpEquiv|id|inputMode|integrity|is|keyParams|keyType|kind|label|lang|list|loading|loop|low|marginHeight|marginWidth|max|maxLength|media|mediaGroup|method|min|minLength|multiple|muted|name|nonce|noValidate|open|optimum|pattern|placeholder|playsInline|poster|preload|profile|radioGroup|readOnly|referrerPolicy|rel|required|reversed|role|rows|rowSpan|sandbox|scope|scoped|scrolling|seamless|selected|shape|size|sizes|slot|span|spellCheck|src|srcDoc|srcLang|srcSet|start|step|style|summary|tabIndex|target|title|translate|type|useMap|value|width|wmode|wrap|about|datatype|inlist|prefix|property|resource|typeof|vocab|autoCapitalize|autoCorrect|autoSave|color|incremental|fallback|inert|itemProp|itemScope|itemType|itemID|itemRef|on|option|results|security|unselectable|accentHeight|accumulate|additive|alignmentBaseline|allowReorder|alphabetic|amplitude|arabicForm|ascent|attributeName|attributeType|autoReverse|azimuth|baseFrequency|baselineShift|baseProfile|bbox|begin|bias|by|calcMode|capHeight|clip|clipPathUnits|clipPath|clipRule|colorInterpolation|colorInterpolationFilters|colorProfile|colorRendering|contentScriptType|contentStyleType|cursor|cx|cy|d|decelerate|descent|diffuseConstant|direction|display|divisor|dominantBaseline|dur|dx|dy|edgeMode|elevation|enableBackground|end|exponent|externalResourcesRequired|fill|fillOpacity|fillRule|filter|filterRes|filterUnits|floodColor|floodOpacity|focusable|fontFamily|fontSize|fontSizeAdjust|fontStretch|fontStyle|fontVariant|fontWeight|format|from|fr|fx|fy|g1|g2|glyphName|glyphOrientationHorizontal|glyphOrientationVertical|glyphRef|gradientTransform|gradientUnits|hanging|horizAdvX|horizOriginX|ideographic|imageRendering|in|in2|intercept|k|k1|k2|k3|k4|kernelMatrix|kernelUnitLength|kerning|keyPoints|keySplines|keyTimes|lengthAdjust|letterSpacing|lightingColor|limitingConeAngle|local|markerEnd|markerMid|markerStart|markerHeight|markerUnits|markerWidth|mask|maskContentUnits|maskUnits|mathematical|mode|numOctaves|offset|opacity|operator|order|orient|orientation|origin|overflow|overlinePosition|overlineThickness|panose1|paintOrder|pathLength|patternContentUnits|patternTransform|patternUnits|pointerEvents|points|pointsAtX|pointsAtY|pointsAtZ|preserveAlpha|preserveAspectRatio|primitiveUnits|r|radius|refX|refY|renderingIntent|repeatCount|repeatDur|requiredExtensions|requiredFeatures|restart|result|rotate|rx|ry|scale|seed|shapeRendering|slope|spacing|specularConstant|specularExponent|speed|spreadMethod|startOffset|stdDeviation|stemh|stemv|stitchTiles|stopColor|stopOpacity|strikethroughPosition|strikethroughThickness|string|stroke|strokeDasharray|strokeDashoffset|strokeLinecap|strokeLinejoin|strokeMiterlimit|strokeOpacity|strokeWidth|surfaceScale|systemLanguage|tableValues|targetX|targetY|textAnchor|textDecoration|textRendering|textLength|to|transform|u1|u2|underlinePosition|underlineThickness|unicode|unicodeBidi|unicodeRange|unitsPerEm|vAlphabetic|vHanging|vIdeographic|vMathematical|values|vectorEffect|version|vertAdvY|vertOriginX|vertOriginY|viewBox|viewTarget|visibility|widths|wordSpacing|writingMode|x|xHeight|x1|x2|xChannelSelector|xlinkActuate|xlinkArcrole|xlinkHref|xlinkRole|xlinkShow|xlinkTitle|xlinkType|xmlBase|xmlns|xmlnsXlink|xmlLang|xmlSpace|y|y1|y2|yChannelSelector|z|zoomAndPan|for|class|autofocus)|(([Dd][Aa][Tt][Aa]|[Aa][Rr][Ii][Aa]|x)-.*))$/, gR = /* @__PURE__ */ zb(
  function(e) {
    return mR.test(e) || e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) < 91;
  }
);
function vR(e) {
  if (e.sheet)
    return e.sheet;
  for (var t = 0; t < document.styleSheets.length; t++)
    if (document.styleSheets[t].ownerNode === e)
      return document.styleSheets[t];
}
function yR(e) {
  var t = document.createElement("style");
  return t.setAttribute("data-emotion", e.key), e.nonce !== void 0 && t.setAttribute("nonce", e.nonce), t.appendChild(document.createTextNode("")), t.setAttribute("data-s", ""), t;
}
var bR = /* @__PURE__ */ function() {
  function e(n) {
    var r = this;
    this._insertTag = function(o) {
      var i;
      r.tags.length === 0 ? r.insertionPoint ? i = r.insertionPoint.nextSibling : r.prepend ? i = r.container.firstChild : i = r.before : i = r.tags[r.tags.length - 1].nextSibling, r.container.insertBefore(o, i), r.tags.push(o);
    }, this.isSpeedy = n.speedy === void 0 ? !0 : n.speedy, this.tags = [], this.ctr = 0, this.nonce = n.nonce, this.key = n.key, this.container = n.container, this.prepend = n.prepend, this.insertionPoint = n.insertionPoint, this.before = null;
  }
  var t = e.prototype;
  return t.hydrate = function(r) {
    r.forEach(this._insertTag);
  }, t.insert = function(r) {
    this.ctr % (this.isSpeedy ? 65e3 : 1) === 0 && this._insertTag(yR(this));
    var o = this.tags[this.tags.length - 1];
    if (this.isSpeedy) {
      var i = vR(o);
      try {
        i.insertRule(r, i.cssRules.length);
      } catch {
      }
    } else
      o.appendChild(document.createTextNode(r));
    this.ctr++;
  }, t.flush = function() {
    this.tags.forEach(function(r) {
      return r.parentNode && r.parentNode.removeChild(r);
    }), this.tags = [], this.ctr = 0;
  }, e;
}(), St = "-ms-", dc = "-moz-", Re = "-webkit-", Bb = "comm", Eh = "rule", Rh = "decl", xR = "@import", jb = "@keyframes", wR = Math.abs, fu = String.fromCharCode, SR = Object.assign;
function CR(e, t) {
  return pt(e, 0) ^ 45 ? (((t << 2 ^ pt(e, 0)) << 2 ^ pt(e, 1)) << 2 ^ pt(e, 2)) << 2 ^ pt(e, 3) : 0;
}
function Wb(e) {
  return e.trim();
}
function kR(e, t) {
  return (e = t.exec(e)) ? e[0] : e;
}
function Te(e, t, n) {
  return e.replace(t, n);
}
function Nf(e, t) {
  return e.indexOf(t);
}
function pt(e, t) {
  return e.charCodeAt(t) | 0;
}
function ta(e, t, n) {
  return e.slice(t, n);
}
function $n(e) {
  return e.length;
}
function Th(e) {
  return e.length;
}
function el(e, t) {
  return t.push(e), e;
}
function ER(e, t) {
  return e.map(t).join("");
}
var pu = 1, xi = 1, Ub = 0, Ut = 0, tt = 0, Ii = "";
function hu(e, t, n, r, o, i, s) {
  return { value: e, root: t, parent: n, type: r, props: o, children: i, line: pu, column: xi, length: s, return: "" };
}
function Ji(e, t) {
  return SR(hu("", null, null, "", null, null, 0), e, { length: -e.length }, t);
}
function RR() {
  return tt;
}
function TR() {
  return tt = Ut > 0 ? pt(Ii, --Ut) : 0, xi--, tt === 10 && (xi = 1, pu--), tt;
}
function Kt() {
  return tt = Ut < Ub ? pt(Ii, Ut++) : 0, xi++, tt === 10 && (xi = 1, pu++), tt;
}
function Fn() {
  return pt(Ii, Ut);
}
function Rl() {
  return Ut;
}
function ka(e, t) {
  return ta(Ii, e, t);
}
function na(e) {
  switch (e) {
    case 0:
    case 9:
    case 10:
    case 13:
    case 32:
      return 5;
    case 33:
    case 43:
    case 44:
    case 47:
    case 62:
    case 64:
    case 126:
    case 59:
    case 123:
    case 125:
      return 4;
    case 58:
      return 3;
    case 34:
    case 39:
    case 40:
    case 91:
      return 2;
    case 41:
    case 93:
      return 1;
  }
  return 0;
}
function Hb(e) {
  return pu = xi = 1, Ub = $n(Ii = e), Ut = 0, [];
}
function Vb(e) {
  return Ii = "", e;
}
function Tl(e) {
  return Wb(ka(Ut - 1, Lf(e === 91 ? e + 2 : e === 40 ? e + 1 : e)));
}
function PR(e) {
  for (; (tt = Fn()) && tt < 33; )
    Kt();
  return na(e) > 2 || na(tt) > 3 ? "" : " ";
}
function OR(e, t) {
  for (; --t && Kt() && !(tt < 48 || tt > 102 || tt > 57 && tt < 65 || tt > 70 && tt < 97); )
    ;
  return ka(e, Rl() + (t < 6 && Fn() == 32 && Kt() == 32));
}
function Lf(e) {
  for (; Kt(); )
    switch (tt) {
      case e:
        return Ut;
      case 34:
      case 39:
        e !== 34 && e !== 39 && Lf(tt);
        break;
      case 40:
        e === 41 && Lf(e);
        break;
      case 92:
        Kt();
        break;
    }
  return Ut;
}
function $R(e, t) {
  for (; Kt() && e + tt !== 47 + 10; )
    if (e + tt === 42 + 42 && Fn() === 47)
      break;
  return "/*" + ka(t, Ut - 1) + "*" + fu(e === 47 ? e : Kt());
}
function _R(e) {
  for (; !na(Fn()); )
    Kt();
  return ka(e, Ut);
}
function MR(e) {
  return Vb(Pl("", null, null, null, [""], e = Hb(e), 0, [0], e));
}
function Pl(e, t, n, r, o, i, s, a, l) {
  for (var c = 0, u = 0, f = s, h = 0, y = 0, d = 0, m = 1, w = 1, g = 1, p = 0, v = "", b = o, C = i, E = r, R = v; w; )
    switch (d = p, p = Kt()) {
      case 40:
        if (d != 108 && pt(R, f - 1) == 58) {
          Nf(R += Te(Tl(p), "&", "&\f"), "&\f") != -1 && (g = -1);
          break;
        }
      case 34:
      case 39:
      case 91:
        R += Tl(p);
        break;
      case 9:
      case 10:
      case 13:
      case 32:
        R += PR(d);
        break;
      case 92:
        R += OR(Rl() - 1, 7);
        continue;
      case 47:
        switch (Fn()) {
          case 42:
          case 47:
            el(IR($R(Kt(), Rl()), t, n), l);
            break;
          default:
            R += "/";
        }
        break;
      case 123 * m:
        a[c++] = $n(R) * g;
      case 125 * m:
      case 59:
      case 0:
        switch (p) {
          case 0:
          case 125:
            w = 0;
          case 59 + u:
            y > 0 && $n(R) - f && el(y > 32 ? ev(R + ";", r, n, f - 1) : ev(Te(R, " ", "") + ";", r, n, f - 2), l);
            break;
          case 59:
            R += ";";
          default:
            if (el(E = Zg(R, t, n, c, u, o, a, v, b = [], C = [], f), i), p === 123)
              if (u === 0)
                Pl(R, t, E, E, b, i, f, a, C);
              else
                switch (h === 99 && pt(R, 3) === 110 ? 100 : h) {
                  case 100:
                  case 109:
                  case 115:
                    Pl(e, E, E, r && el(Zg(e, E, E, 0, 0, o, a, v, o, b = [], f), C), o, C, f, a, r ? b : C);
                    break;
                  default:
                    Pl(R, E, E, E, [""], C, 0, a, C);
                }
        }
        c = u = y = 0, m = g = 1, v = R = "", f = s;
        break;
      case 58:
        f = 1 + $n(R), y = d;
      default:
        if (m < 1) {
          if (p == 123)
            --m;
          else if (p == 125 && m++ == 0 && TR() == 125)
            continue;
        }
        switch (R += fu(p), p * m) {
          case 38:
            g = u > 0 ? 1 : (R += "\f", -1);
            break;
          case 44:
            a[c++] = ($n(R) - 1) * g, g = 1;
            break;
          case 64:
            Fn() === 45 && (R += Tl(Kt())), h = Fn(), u = f = $n(v = R += _R(Rl())), p++;
            break;
          case 45:
            d === 45 && $n(R) == 2 && (m = 0);
        }
    }
  return i;
}
function Zg(e, t, n, r, o, i, s, a, l, c, u) {
  for (var f = o - 1, h = o === 0 ? i : [""], y = Th(h), d = 0, m = 0, w = 0; d < r; ++d)
    for (var g = 0, p = ta(e, f + 1, f = wR(m = s[d])), v = e; g < y; ++g)
      (v = Wb(m > 0 ? h[g] + " " + p : Te(p, /&\f/g, h[g]))) && (l[w++] = v);
  return hu(e, t, n, o === 0 ? Eh : a, l, c, u);
}
function IR(e, t, n) {
  return hu(e, t, n, Bb, fu(RR()), ta(e, 2, -2), 0);
}
function ev(e, t, n, r) {
  return hu(e, t, n, Rh, ta(e, 0, r), ta(e, r + 1, -1), r);
}
function ci(e, t) {
  for (var n = "", r = Th(e), o = 0; o < r; o++)
    n += t(e[o], o, e, t) || "";
  return n;
}
function AR(e, t, n, r) {
  switch (e.type) {
    case xR:
    case Rh:
      return e.return = e.return || e.value;
    case Bb:
      return "";
    case jb:
      return e.return = e.value + "{" + ci(e.children, r) + "}";
    case Eh:
      e.value = e.props.join(",");
  }
  return $n(n = ci(e.children, r)) ? e.return = e.value + "{" + n + "}" : "";
}
function NR(e) {
  var t = Th(e);
  return function(n, r, o, i) {
    for (var s = "", a = 0; a < t; a++)
      s += e[a](n, r, o, i) || "";
    return s;
  };
}
function LR(e) {
  return function(t) {
    t.root || (t = t.return) && e(t);
  };
}
var FR = function(t, n, r) {
  for (var o = 0, i = 0; o = i, i = Fn(), o === 38 && i === 12 && (n[r] = 1), !na(i); )
    Kt();
  return ka(t, Ut);
}, DR = function(t, n) {
  var r = -1, o = 44;
  do
    switch (na(o)) {
      case 0:
        o === 38 && Fn() === 12 && (n[r] = 1), t[r] += FR(Ut - 1, n, r);
        break;
      case 2:
        t[r] += Tl(o);
        break;
      case 4:
        if (o === 44) {
          t[++r] = Fn() === 58 ? "&\f" : "", n[r] = t[r].length;
          break;
        }
      default:
        t[r] += fu(o);
    }
  while (o = Kt());
  return t;
}, zR = function(t, n) {
  return Vb(DR(Hb(t), n));
}, tv = /* @__PURE__ */ new WeakMap(), BR = function(t) {
  if (!(t.type !== "rule" || !t.parent || t.length < 1)) {
    for (var n = t.value, r = t.parent, o = t.column === r.column && t.line === r.line; r.type !== "rule"; )
      if (r = r.parent, !r)
        return;
    if (!(t.props.length === 1 && n.charCodeAt(0) !== 58 && !tv.get(r)) && !o) {
      tv.set(t, !0);
      for (var i = [], s = zR(n, i), a = r.props, l = 0, c = 0; l < s.length; l++)
        for (var u = 0; u < a.length; u++, c++)
          t.props[c] = i[l] ? s[l].replace(/&\f/g, a[u]) : a[u] + " " + s[l];
    }
  }
}, jR = function(t) {
  if (t.type === "decl") {
    var n = t.value;
    n.charCodeAt(0) === 108 && n.charCodeAt(2) === 98 && (t.return = "", t.value = "");
  }
};
function Yb(e, t) {
  switch (CR(e, t)) {
    case 5103:
      return Re + "print-" + e + e;
    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921:
    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005:
    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855:
    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return Re + e + e;
    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return Re + e + dc + e + St + e + e;
    case 6828:
    case 4268:
      return Re + e + St + e + e;
    case 6165:
      return Re + e + St + "flex-" + e + e;
    case 5187:
      return Re + e + Te(e, /(\w+).+(:[^]+)/, Re + "box-$1$2" + St + "flex-$1$2") + e;
    case 5443:
      return Re + e + St + "flex-item-" + Te(e, /flex-|-self/, "") + e;
    case 4675:
      return Re + e + St + "flex-line-pack" + Te(e, /align-content|flex-|-self/, "") + e;
    case 5548:
      return Re + e + St + Te(e, "shrink", "negative") + e;
    case 5292:
      return Re + e + St + Te(e, "basis", "preferred-size") + e;
    case 6060:
      return Re + "box-" + Te(e, "-grow", "") + Re + e + St + Te(e, "grow", "positive") + e;
    case 4554:
      return Re + Te(e, /([^-])(transform)/g, "$1" + Re + "$2") + e;
    case 6187:
      return Te(Te(Te(e, /(zoom-|grab)/, Re + "$1"), /(image-set)/, Re + "$1"), e, "") + e;
    case 5495:
    case 3959:
      return Te(e, /(image-set\([^]*)/, Re + "$1$`$1");
    case 4968:
      return Te(Te(e, /(.+:)(flex-)?(.*)/, Re + "box-pack:$3" + St + "flex-pack:$3"), /s.+-b[^;]+/, "justify") + Re + e + e;
    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return Te(e, /(.+)-inline(.+)/, Re + "$1$2") + e;
    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      if ($n(e) - 1 - t > 6)
        switch (pt(e, t + 1)) {
          case 109:
            if (pt(e, t + 4) !== 45)
              break;
          case 102:
            return Te(e, /(.+:)(.+)-([^]+)/, "$1" + Re + "$2-$3$1" + dc + (pt(e, t + 3) == 108 ? "$3" : "$2-$3")) + e;
          case 115:
            return ~Nf(e, "stretch") ? Yb(Te(e, "stretch", "fill-available"), t) + e : e;
        }
      break;
    case 4949:
      if (pt(e, t + 1) !== 115)
        break;
    case 6444:
      switch (pt(e, $n(e) - 3 - (~Nf(e, "!important") && 10))) {
        case 107:
          return Te(e, ":", ":" + Re) + e;
        case 101:
          return Te(e, /(.+:)([^;!]+)(;|!.+)?/, "$1" + Re + (pt(e, 14) === 45 ? "inline-" : "") + "box$3$1" + Re + "$2$3$1" + St + "$2box$3") + e;
      }
      break;
    case 5936:
      switch (pt(e, t + 11)) {
        case 114:
          return Re + e + St + Te(e, /[svh]\w+-[tblr]{2}/, "tb") + e;
        case 108:
          return Re + e + St + Te(e, /[svh]\w+-[tblr]{2}/, "tb-rl") + e;
        case 45:
          return Re + e + St + Te(e, /[svh]\w+-[tblr]{2}/, "lr") + e;
      }
      return Re + e + St + e + e;
  }
  return e;
}
var WR = function(t, n, r, o) {
  if (t.length > -1 && !t.return)
    switch (t.type) {
      case Rh:
        t.return = Yb(t.value, t.length);
        break;
      case jb:
        return ci([Ji(t, {
          value: Te(t.value, "@", "@" + Re)
        })], o);
      case Eh:
        if (t.length)
          return ER(t.props, function(i) {
            switch (kR(i, /(::plac\w+|:read-\w+)/)) {
              case ":read-only":
              case ":read-write":
                return ci([Ji(t, {
                  props: [Te(i, /:(read-\w+)/, ":" + dc + "$1")]
                })], o);
              case "::placeholder":
                return ci([Ji(t, {
                  props: [Te(i, /:(plac\w+)/, ":" + Re + "input-$1")]
                }), Ji(t, {
                  props: [Te(i, /:(plac\w+)/, ":" + dc + "$1")]
                }), Ji(t, {
                  props: [Te(i, /:(plac\w+)/, St + "input-$1")]
                })], o);
            }
            return "";
          });
    }
}, UR = [WR], HR = function(t) {
  var n = t.key;
  if (n === "css") {
    var r = document.querySelectorAll("style[data-emotion]:not([data-s])");
    Array.prototype.forEach.call(r, function(m) {
      var w = m.getAttribute("data-emotion");
      w.indexOf(" ") !== -1 && (document.head.appendChild(m), m.setAttribute("data-s", ""));
    });
  }
  var o = t.stylisPlugins || UR, i = {}, s, a = [];
  s = t.container || document.head, Array.prototype.forEach.call(
    document.querySelectorAll('style[data-emotion^="' + n + ' "]'),
    function(m) {
      for (var w = m.getAttribute("data-emotion").split(" "), g = 1; g < w.length; g++)
        i[w[g]] = !0;
      a.push(m);
    }
  );
  var l, c = [BR, jR];
  {
    var u, f = [AR, LR(function(m) {
      u.insert(m);
    })], h = NR(c.concat(o, f)), y = function(w) {
      return ci(MR(w), h);
    };
    l = function(w, g, p, v) {
      u = p, y(w ? w + "{" + g.styles + "}" : g.styles), v && (d.inserted[g.name] = !0);
    };
  }
  var d = {
    key: n,
    sheet: new bR({
      key: n,
      container: s,
      nonce: t.nonce,
      speedy: t.speedy,
      prepend: t.prepend,
      insertionPoint: t.insertionPoint
    }),
    nonce: t.nonce,
    inserted: i,
    registered: {},
    insert: l
  };
  return d.sheet.hydrate(a), d;
}, VR = !0;
function YR(e, t, n) {
  var r = "";
  return n.split(" ").forEach(function(o) {
    e[o] !== void 0 ? t.push(e[o] + ";") : r += o + " ";
  }), r;
}
var Xb = function(t, n, r) {
  var o = t.key + "-" + n.name;
  (r === !1 || VR === !1) && t.registered[o] === void 0 && (t.registered[o] = n.styles);
}, Kb = function(t, n, r) {
  Xb(t, n, r);
  var o = t.key + "-" + n.name;
  if (t.inserted[n.name] === void 0) {
    var i = n;
    do
      t.insert(n === i ? "." + o : "", i, t.sheet, !0), i = i.next;
    while (i !== void 0);
  }
};
function XR(e) {
  for (var t = 0, n, r = 0, o = e.length; o >= 4; ++r, o -= 4)
    n = e.charCodeAt(r) & 255 | (e.charCodeAt(++r) & 255) << 8 | (e.charCodeAt(++r) & 255) << 16 | (e.charCodeAt(++r) & 255) << 24, n = (n & 65535) * 1540483477 + ((n >>> 16) * 59797 << 16), n ^= n >>> 24, t = (n & 65535) * 1540483477 + ((n >>> 16) * 59797 << 16) ^ (t & 65535) * 1540483477 + ((t >>> 16) * 59797 << 16);
  switch (o) {
    case 3:
      t ^= (e.charCodeAt(r + 2) & 255) << 16;
    case 2:
      t ^= (e.charCodeAt(r + 1) & 255) << 8;
    case 1:
      t ^= e.charCodeAt(r) & 255, t = (t & 65535) * 1540483477 + ((t >>> 16) * 59797 << 16);
  }
  return t ^= t >>> 13, t = (t & 65535) * 1540483477 + ((t >>> 16) * 59797 << 16), ((t ^ t >>> 15) >>> 0).toString(36);
}
var KR = {
  animationIterationCount: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
}, qR = /[A-Z]|^ms/g, GR = /_EMO_([^_]+?)_([^]*?)_EMO_/g, qb = function(t) {
  return t.charCodeAt(1) === 45;
}, nv = function(t) {
  return t != null && typeof t != "boolean";
}, md = /* @__PURE__ */ zb(function(e) {
  return qb(e) ? e : e.replace(qR, "-$&").toLowerCase();
}), rv = function(t, n) {
  switch (t) {
    case "animation":
    case "animationName":
      if (typeof n == "string")
        return n.replace(GR, function(r, o, i) {
          return _n = {
            name: o,
            styles: i,
            next: _n
          }, o;
        });
  }
  return KR[t] !== 1 && !qb(t) && typeof n == "number" && n !== 0 ? n + "px" : n;
};
function ra(e, t, n) {
  if (n == null)
    return "";
  if (n.__emotion_styles !== void 0)
    return n;
  switch (typeof n) {
    case "boolean":
      return "";
    case "object": {
      if (n.anim === 1)
        return _n = {
          name: n.name,
          styles: n.styles,
          next: _n
        }, n.name;
      if (n.styles !== void 0) {
        var r = n.next;
        if (r !== void 0)
          for (; r !== void 0; )
            _n = {
              name: r.name,
              styles: r.styles,
              next: _n
            }, r = r.next;
        var o = n.styles + ";";
        return o;
      }
      return QR(e, t, n);
    }
    case "function": {
      if (e !== void 0) {
        var i = _n, s = n(e);
        return _n = i, ra(e, t, s);
      }
      break;
    }
  }
  if (t == null)
    return n;
  var a = t[n];
  return a !== void 0 ? a : n;
}
function QR(e, t, n) {
  var r = "";
  if (Array.isArray(n))
    for (var o = 0; o < n.length; o++)
      r += ra(e, t, n[o]) + ";";
  else
    for (var i in n) {
      var s = n[i];
      if (typeof s != "object")
        t != null && t[s] !== void 0 ? r += i + "{" + t[s] + "}" : nv(s) && (r += md(i) + ":" + rv(i, s) + ";");
      else if (Array.isArray(s) && typeof s[0] == "string" && (t == null || t[s[0]] === void 0))
        for (var a = 0; a < s.length; a++)
          nv(s[a]) && (r += md(i) + ":" + rv(i, s[a]) + ";");
      else {
        var l = ra(e, t, s);
        switch (i) {
          case "animation":
          case "animationName": {
            r += md(i) + ":" + l + ";";
            break;
          }
          default:
            r += i + "{" + l + "}";
        }
      }
    }
  return r;
}
var ov = /label:\s*([^\s;\n{]+)\s*(;|$)/g, _n, Ph = function(t, n, r) {
  if (t.length === 1 && typeof t[0] == "object" && t[0] !== null && t[0].styles !== void 0)
    return t[0];
  var o = !0, i = "";
  _n = void 0;
  var s = t[0];
  s == null || s.raw === void 0 ? (o = !1, i += ra(r, n, s)) : i += s[0];
  for (var a = 1; a < t.length; a++)
    i += ra(r, n, t[a]), o && (i += s[a]);
  ov.lastIndex = 0;
  for (var l = "", c; (c = ov.exec(i)) !== null; )
    l += "-" + c[1];
  var u = XR(i) + l;
  return {
    name: u,
    styles: i,
    next: _n
  };
}, JR = function(t) {
  return t();
}, Gb = Bl["useInsertionEffect"] ? Bl["useInsertionEffect"] : !1, ZR = Gb || JR, iv = Gb || x.exports.useLayoutEffect, Qb = /* @__PURE__ */ x.exports.createContext(
  typeof HTMLElement < "u" ? /* @__PURE__ */ HR({
    key: "css"
  }) : null
);
Qb.Provider;
var Jb = function(t) {
  return /* @__PURE__ */ x.exports.forwardRef(function(n, r) {
    var o = x.exports.useContext(Qb);
    return t(n, o, r);
  });
}, Zb = /* @__PURE__ */ x.exports.createContext({}), eT = /* @__PURE__ */ Jb(function(e, t) {
  var n = e.styles, r = Ph([n], void 0, x.exports.useContext(Zb)), o = x.exports.useRef();
  return iv(function() {
    var i = t.key + "-global", s = new t.sheet.constructor({
      key: i,
      nonce: t.sheet.nonce,
      container: t.sheet.container,
      speedy: t.sheet.isSpeedy
    }), a = !1, l = document.querySelector('style[data-emotion="' + i + " " + r.name + '"]');
    return t.sheet.tags.length && (s.before = t.sheet.tags[0]), l !== null && (a = !0, l.setAttribute("data-emotion", i), s.hydrate([l])), o.current = [s, a], function() {
      s.flush();
    };
  }, [t]), iv(function() {
    var i = o.current, s = i[0], a = i[1];
    if (a) {
      i[1] = !1;
      return;
    }
    if (r.next !== void 0 && Kb(t, r.next, !0), s.tags.length) {
      var l = s.tags[s.tags.length - 1].nextElementSibling;
      s.before = l, s.flush();
    }
    t.insert("", r, s, !1);
  }, [t, r.name]), null;
});
function Oh() {
  for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
    t[n] = arguments[n];
  return Ph(t);
}
var Ea = function() {
  var t = Oh.apply(void 0, arguments), n = "animation-" + t.name;
  return {
    name: n,
    styles: "@keyframes " + n + "{" + t.styles + "}",
    anim: 1,
    toString: function() {
      return "_EMO_" + this.name + "_" + this.styles + "_EMO_";
    }
  };
}, tT = gR, nT = function(t) {
  return t !== "theme";
}, sv = function(t) {
  return typeof t == "string" && t.charCodeAt(0) > 96 ? tT : nT;
}, av = function(t, n, r) {
  var o;
  if (n) {
    var i = n.shouldForwardProp;
    o = t.__emotion_forwardProp && i ? function(s) {
      return t.__emotion_forwardProp(s) && i(s);
    } : i;
  }
  return typeof o != "function" && r && (o = t.__emotion_forwardProp), o;
}, rT = function(t) {
  var n = t.cache, r = t.serialized, o = t.isStringTag;
  return Xb(n, r, o), ZR(function() {
    return Kb(n, r, o);
  }), null;
}, oT = function e(t, n) {
  var r = t.__emotion_real === t, o = r && t.__emotion_base || t, i, s;
  n !== void 0 && (i = n.label, s = n.target);
  var a = av(t, n, r), l = a || sv(o), c = !l("as");
  return function() {
    var u = arguments, f = r && t.__emotion_styles !== void 0 ? t.__emotion_styles.slice(0) : [];
    if (i !== void 0 && f.push("label:" + i + ";"), u[0] == null || u[0].raw === void 0)
      f.push.apply(f, u);
    else {
      f.push(u[0][0]);
      for (var h = u.length, y = 1; y < h; y++)
        f.push(u[y], u[0][y]);
    }
    var d = Jb(function(m, w, g) {
      var p = c && m.as || o, v = "", b = [], C = m;
      if (m.theme == null) {
        C = {};
        for (var E in m)
          C[E] = m[E];
        C.theme = x.exports.useContext(Zb);
      }
      typeof m.className == "string" ? v = YR(w.registered, b, m.className) : m.className != null && (v = m.className + " ");
      var R = Ph(f.concat(b), w.registered, C);
      v += w.key + "-" + R.name, s !== void 0 && (v += " " + s);
      var T = c && a === void 0 ? sv(p) : l, O = {};
      for (var P in m)
        c && P === "as" || T(P) && (O[P] = m[P]);
      return O.className = v, O.ref = g, /* @__PURE__ */ x.exports.createElement(x.exports.Fragment, null, /* @__PURE__ */ x.exports.createElement(rT, {
        cache: w,
        serialized: R,
        isStringTag: typeof p == "string"
      }), /* @__PURE__ */ x.exports.createElement(p, O));
    });
    return d.displayName = i !== void 0 ? i : "Styled(" + (typeof o == "string" ? o : o.displayName || o.name || "Component") + ")", d.defaultProps = t.defaultProps, d.__emotion_real = d, d.__emotion_base = o, d.__emotion_styles = f, d.__emotion_forwardProp = a, Object.defineProperty(d, "toString", {
      value: function() {
        return "." + s;
      }
    }), d.withComponent = function(m, w) {
      return e(m, k({}, n, w, {
        shouldForwardProp: av(d, w, !0)
      })).apply(void 0, f);
    }, d;
  };
}, iT = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "keygen",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "marquee",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  "circle",
  "clipPath",
  "defs",
  "ellipse",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "mask",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "svg",
  "text",
  "tspan"
], Ff = oT.bind();
iT.forEach(function(e) {
  Ff[e] = Ff(e);
});
const sT = Ff;
var ex = { exports: {} }, aT = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED", lT = aT, cT = lT;
function tx() {
}
function nx() {
}
nx.resetWarningCache = tx;
var uT = function() {
  function e(r, o, i, s, a, l) {
    if (l !== cT) {
      var c = new Error(
        "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
      );
      throw c.name = "Invariant Violation", c;
    }
  }
  e.isRequired = e;
  function t() {
    return e;
  }
  var n = {
    array: e,
    bigint: e,
    bool: e,
    func: e,
    number: e,
    object: e,
    string: e,
    symbol: e,
    any: e,
    arrayOf: t,
    element: e,
    elementType: e,
    instanceOf: t,
    node: e,
    objectOf: t,
    oneOf: t,
    oneOfType: t,
    shape: t,
    exact: t,
    checkPropTypes: nx,
    resetWarningCache: tx
  };
  return n.PropTypes = n, n;
};
ex.exports = uT();
function dT(e) {
  return e == null || Object.keys(e).length === 0;
}
function fT(e) {
  const {
    styles: t,
    defaultTheme: n = {}
  } = e;
  return /* @__PURE__ */ S(eT, {
    styles: typeof t == "function" ? (o) => t(dT(o) ? n : o) : t
  });
}
/** @license MUI v5.10.14
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function rx(e, t) {
  return sT(e, t);
}
const pT = (e, t) => {
  Array.isArray(e.__emotion_styles) && (e.__emotion_styles = t(e.__emotion_styles));
};
function ps(e) {
  return e !== null && typeof e == "object" && e.constructor === Object;
}
function Bt(e, t, n = {
  clone: !0
}) {
  const r = n.clone ? k({}, e) : e;
  return ps(e) && ps(t) && Object.keys(t).forEach((o) => {
    o !== "__proto__" && (ps(t[o]) && o in e && ps(e[o]) ? r[o] = Bt(e[o], t[o], n) : r[o] = t[o]);
  }), r;
}
function Vr(e) {
  let t = "https://mui.com/production-error/?code=" + e;
  for (let n = 1; n < arguments.length; n += 1)
    t += "&args[]=" + encodeURIComponent(arguments[n]);
  return "Minified MUI error #" + e + "; visit " + t + " for the full message.";
}
function N(e) {
  if (typeof e != "string")
    throw new Error(Vr(7));
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function lv(...e) {
  return e.reduce((t, n) => n == null ? t : function(...o) {
    t.apply(this, o), n.apply(this, o);
  }, () => {
  });
}
function ox(e, t = 166) {
  let n;
  function r(...o) {
    const i = () => {
      e.apply(this, o);
    };
    clearTimeout(n), n = setTimeout(i, t);
  }
  return r.clear = () => {
    clearTimeout(n);
  }, r;
}
function gd(e, t) {
  return /* @__PURE__ */ x.exports.isValidElement(e) && t.indexOf(e.type.muiName) !== -1;
}
function mt(e) {
  return e && e.ownerDocument || document;
}
function ko(e) {
  return mt(e).defaultView || window;
}
function Df(e, t) {
  typeof e == "function" ? e(t) : e && (e.current = t);
}
const hT = typeof window < "u" ? x.exports.useLayoutEffect : x.exports.useEffect, jn = hT;
let cv = 0;
function mT(e) {
  const [t, n] = x.exports.useState(e), r = e || t;
  return x.exports.useEffect(() => {
    t == null && (cv += 1, n(`mui-${cv}`));
  }, [t]), r;
}
const uv = Bl["useId"];
function Ra(e) {
  if (uv !== void 0) {
    const t = uv();
    return e != null ? e : t;
  }
  return mT(e);
}
function oa({
  controlled: e,
  default: t,
  name: n,
  state: r = "value"
}) {
  const {
    current: o
  } = x.exports.useRef(e !== void 0), [i, s] = x.exports.useState(t), a = o ? e : i, l = x.exports.useCallback((c) => {
    o || s(c);
  }, []);
  return [a, l];
}
function In(e) {
  const t = x.exports.useRef(e);
  return jn(() => {
    t.current = e;
  }), x.exports.useCallback((...n) => (0, t.current)(...n), []);
}
function Qe(...e) {
  return x.exports.useMemo(() => e.every((t) => t == null) ? null : (t) => {
    e.forEach((n) => {
      Df(n, t);
    });
  }, e);
}
let mu = !0, zf = !1, dv;
const gT = {
  text: !0,
  search: !0,
  url: !0,
  tel: !0,
  email: !0,
  password: !0,
  number: !0,
  date: !0,
  month: !0,
  week: !0,
  time: !0,
  datetime: !0,
  "datetime-local": !0
};
function vT(e) {
  const {
    type: t,
    tagName: n
  } = e;
  return !!(n === "INPUT" && gT[t] && !e.readOnly || n === "TEXTAREA" && !e.readOnly || e.isContentEditable);
}
function yT(e) {
  e.metaKey || e.altKey || e.ctrlKey || (mu = !0);
}
function vd() {
  mu = !1;
}
function bT() {
  this.visibilityState === "hidden" && zf && (mu = !0);
}
function xT(e) {
  e.addEventListener("keydown", yT, !0), e.addEventListener("mousedown", vd, !0), e.addEventListener("pointerdown", vd, !0), e.addEventListener("touchstart", vd, !0), e.addEventListener("visibilitychange", bT, !0);
}
function wT(e) {
  const {
    target: t
  } = e;
  try {
    return t.matches(":focus-visible");
  } catch {
  }
  return mu || vT(t);
}
function $h() {
  const e = x.exports.useCallback((o) => {
    o != null && xT(o.ownerDocument);
  }, []), t = x.exports.useRef(!1);
  function n() {
    return t.current ? (zf = !0, window.clearTimeout(dv), dv = window.setTimeout(() => {
      zf = !1;
    }, 100), t.current = !1, !0) : !1;
  }
  function r(o) {
    return wT(o) ? (t.current = !0, !0) : !1;
  }
  return {
    isFocusVisibleRef: t,
    onFocus: r,
    onBlur: n,
    ref: e
  };
}
function ix(e) {
  const t = e.documentElement.clientWidth;
  return Math.abs(window.innerWidth - t);
}
const ST = (e) => {
  const t = x.exports.useRef({});
  return x.exports.useEffect(() => {
    t.current = e;
  }), t.current;
}, sx = ST, CT = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px"
}, kT = CT;
function ax(e, t) {
  const n = k({}, t);
  return Object.keys(e).forEach((r) => {
    n[r] === void 0 && (n[r] = e[r]);
  }), n;
}
function me(e, t, n) {
  const r = {};
  return Object.keys(e).forEach(
    (o) => {
      r[o] = e[o].reduce((i, s) => (s && (i.push(t(s)), n && n[s] && i.push(n[s])), i), []).join(" ");
    }
  ), r;
}
const fv = (e) => e, ET = () => {
  let e = fv;
  return {
    configure(t) {
      e = t;
    },
    generate(t) {
      return e(t);
    },
    reset() {
      e = fv;
    }
  };
}, RT = ET(), lx = RT, TT = {
  active: "active",
  checked: "checked",
  completed: "completed",
  disabled: "disabled",
  error: "error",
  expanded: "expanded",
  focused: "focused",
  focusVisible: "focusVisible",
  required: "required",
  selected: "selected"
};
function he(e, t, n = "Mui") {
  const r = TT[t];
  return r ? `${n}-${r}` : `${lx.generate(e)}-${t}`;
}
function fe(e, t, n = "Mui") {
  const r = {};
  return t.forEach((o) => {
    r[o] = he(e, o, n);
  }), r;
}
function Os(e, t) {
  return t ? Bt(e, t, {
    clone: !1
  }) : e;
}
const _h = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536
}, pv = {
  keys: ["xs", "sm", "md", "lg", "xl"],
  up: (e) => `@media (min-width:${_h[e]}px)`
};
function Wn(e, t, n) {
  const r = e.theme || {};
  if (Array.isArray(t)) {
    const i = r.breakpoints || pv;
    return t.reduce((s, a, l) => (s[i.up(i.keys[l])] = n(t[l]), s), {});
  }
  if (typeof t == "object") {
    const i = r.breakpoints || pv;
    return Object.keys(t).reduce((s, a) => {
      if (Object.keys(i.values || _h).indexOf(a) !== -1) {
        const l = i.up(a);
        s[l] = n(t[a], a);
      } else {
        const l = a;
        s[l] = t[l];
      }
      return s;
    }, {});
  }
  return n(t);
}
function cx(e = {}) {
  var t;
  return ((t = e.keys) == null ? void 0 : t.reduce((r, o) => {
    const i = e.up(o);
    return r[i] = {}, r;
  }, {})) || {};
}
function ux(e, t) {
  return e.reduce((n, r) => {
    const o = n[r];
    return (!o || Object.keys(o).length === 0) && delete n[r], n;
  }, t);
}
function PT(e, ...t) {
  const n = cx(e), r = [n, ...t].reduce((o, i) => Bt(o, i), {});
  return ux(Object.keys(n), r);
}
function OT(e, t) {
  if (typeof e != "object")
    return {};
  const n = {}, r = Object.keys(t);
  return Array.isArray(e) ? r.forEach((o, i) => {
    i < e.length && (n[o] = !0);
  }) : r.forEach((o) => {
    e[o] != null && (n[o] = !0);
  }), n;
}
function yd({
  values: e,
  breakpoints: t,
  base: n
}) {
  const r = n || OT(e, t), o = Object.keys(r);
  if (o.length === 0)
    return e;
  let i;
  return o.reduce((s, a, l) => (Array.isArray(e) ? (s[a] = e[l] != null ? e[l] : e[i], i = l) : typeof e == "object" ? (s[a] = e[a] != null ? e[a] : e[i], i = a) : s[a] = e, s), {});
}
function Mh(e, t, n = !0) {
  if (!t || typeof t != "string")
    return null;
  if (e && e.vars && n) {
    const r = `vars.${t}`.split(".").reduce((o, i) => o && o[i] ? o[i] : null, e);
    if (r != null)
      return r;
  }
  return t.split(".").reduce((r, o) => r && r[o] != null ? r[o] : null, e);
}
function hv(e, t, n, r = n) {
  let o;
  return typeof e == "function" ? o = e(n) : Array.isArray(e) ? o = e[n] || r : o = Mh(e, n) || r, t && (o = t(o, r)), o;
}
function te(e) {
  const {
    prop: t,
    cssProperty: n = e.prop,
    themeKey: r,
    transform: o
  } = e, i = (s) => {
    if (s[t] == null)
      return null;
    const a = s[t], l = s.theme, c = Mh(l, r) || {};
    return Wn(s, a, (f) => {
      let h = hv(c, o, f);
      return f === h && typeof f == "string" && (h = hv(c, o, `${t}${f === "default" ? "" : N(f)}`, f)), n === !1 ? h : {
        [n]: h
      };
    });
  };
  return i.propTypes = {}, i.filterProps = [t], i;
}
function Gr(...e) {
  const t = e.reduce((r, o) => (o.filterProps.forEach((i) => {
    r[i] = o;
  }), r), {}), n = (r) => Object.keys(r).reduce((o, i) => t[i] ? Os(o, t[i](r)) : o, {});
  return n.propTypes = {}, n.filterProps = e.reduce((r, o) => r.concat(o.filterProps), []), n;
}
function $T(e) {
  const t = {};
  return (n) => (t[n] === void 0 && (t[n] = e(n)), t[n]);
}
const _T = {
  m: "margin",
  p: "padding"
}, MT = {
  t: "Top",
  r: "Right",
  b: "Bottom",
  l: "Left",
  x: ["Left", "Right"],
  y: ["Top", "Bottom"]
}, mv = {
  marginX: "mx",
  marginY: "my",
  paddingX: "px",
  paddingY: "py"
}, IT = $T((e) => {
  if (e.length > 2)
    if (mv[e])
      e = mv[e];
    else
      return [e];
  const [t, n] = e.split(""), r = _T[t], o = MT[n] || "";
  return Array.isArray(o) ? o.map((i) => r + i) : [r + o];
}), AT = ["m", "mt", "mr", "mb", "ml", "mx", "my", "margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "marginX", "marginY", "marginInline", "marginInlineStart", "marginInlineEnd", "marginBlock", "marginBlockStart", "marginBlockEnd"], NT = ["p", "pt", "pr", "pb", "pl", "px", "py", "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "paddingX", "paddingY", "paddingInline", "paddingInlineStart", "paddingInlineEnd", "paddingBlock", "paddingBlockStart", "paddingBlockEnd"], dx = [...AT, ...NT];
function Ta(e, t, n, r) {
  var o;
  const i = (o = Mh(e, t, !1)) != null ? o : n;
  return typeof i == "number" ? (s) => typeof s == "string" ? s : i * s : Array.isArray(i) ? (s) => typeof s == "string" ? s : i[s] : typeof i == "function" ? i : () => {
  };
}
function Ih(e) {
  return Ta(e, "spacing", 8);
}
function Ai(e, t) {
  if (typeof t == "string" || t == null)
    return t;
  const n = Math.abs(t), r = e(n);
  return t >= 0 ? r : typeof r == "number" ? -r : `-${r}`;
}
function LT(e, t) {
  return (n) => e.reduce((r, o) => (r[o] = Ai(t, n), r), {});
}
function FT(e, t, n, r) {
  if (t.indexOf(n) === -1)
    return null;
  const o = IT(n), i = LT(o, r), s = e[n];
  return Wn(e, s, i);
}
function DT(e, t) {
  const n = Ih(e.theme);
  return Object.keys(e).map((r) => FT(e, t, r, n)).reduce(Os, {});
}
function gu(e) {
  return DT(e, dx);
}
gu.propTypes = {};
gu.filterProps = dx;
function Pa(e) {
  return typeof e != "number" ? e : `${e}px solid`;
}
const zT = te({
  prop: "border",
  themeKey: "borders",
  transform: Pa
}), BT = te({
  prop: "borderTop",
  themeKey: "borders",
  transform: Pa
}), jT = te({
  prop: "borderRight",
  themeKey: "borders",
  transform: Pa
}), WT = te({
  prop: "borderBottom",
  themeKey: "borders",
  transform: Pa
}), UT = te({
  prop: "borderLeft",
  themeKey: "borders",
  transform: Pa
}), HT = te({
  prop: "borderColor",
  themeKey: "palette"
}), VT = te({
  prop: "borderTopColor",
  themeKey: "palette"
}), YT = te({
  prop: "borderRightColor",
  themeKey: "palette"
}), XT = te({
  prop: "borderBottomColor",
  themeKey: "palette"
}), KT = te({
  prop: "borderLeftColor",
  themeKey: "palette"
}), Ah = (e) => {
  if (e.borderRadius !== void 0 && e.borderRadius !== null) {
    const t = Ta(e.theme, "shape.borderRadius", 4), n = (r) => ({
      borderRadius: Ai(t, r)
    });
    return Wn(e, e.borderRadius, n);
  }
  return null;
};
Ah.propTypes = {};
Ah.filterProps = ["borderRadius"];
const qT = Gr(zT, BT, jT, WT, UT, HT, VT, YT, XT, KT, Ah), fx = qT, GT = te({
  prop: "displayPrint",
  cssProperty: !1,
  transform: (e) => ({
    "@media print": {
      display: e
    }
  })
}), QT = te({
  prop: "display"
}), JT = te({
  prop: "overflow"
}), ZT = te({
  prop: "textOverflow"
}), eP = te({
  prop: "visibility"
}), tP = te({
  prop: "whiteSpace"
}), px = Gr(GT, QT, JT, ZT, eP, tP), nP = te({
  prop: "flexBasis"
}), rP = te({
  prop: "flexDirection"
}), oP = te({
  prop: "flexWrap"
}), iP = te({
  prop: "justifyContent"
}), sP = te({
  prop: "alignItems"
}), aP = te({
  prop: "alignContent"
}), lP = te({
  prop: "order"
}), cP = te({
  prop: "flex"
}), uP = te({
  prop: "flexGrow"
}), dP = te({
  prop: "flexShrink"
}), fP = te({
  prop: "alignSelf"
}), pP = te({
  prop: "justifyItems"
}), hP = te({
  prop: "justifySelf"
}), mP = Gr(nP, rP, oP, iP, sP, aP, lP, cP, uP, dP, fP, pP, hP), hx = mP, Nh = (e) => {
  if (e.gap !== void 0 && e.gap !== null) {
    const t = Ta(e.theme, "spacing", 8), n = (r) => ({
      gap: Ai(t, r)
    });
    return Wn(e, e.gap, n);
  }
  return null;
};
Nh.propTypes = {};
Nh.filterProps = ["gap"];
const Lh = (e) => {
  if (e.columnGap !== void 0 && e.columnGap !== null) {
    const t = Ta(e.theme, "spacing", 8), n = (r) => ({
      columnGap: Ai(t, r)
    });
    return Wn(e, e.columnGap, n);
  }
  return null;
};
Lh.propTypes = {};
Lh.filterProps = ["columnGap"];
const Fh = (e) => {
  if (e.rowGap !== void 0 && e.rowGap !== null) {
    const t = Ta(e.theme, "spacing", 8), n = (r) => ({
      rowGap: Ai(t, r)
    });
    return Wn(e, e.rowGap, n);
  }
  return null;
};
Fh.propTypes = {};
Fh.filterProps = ["rowGap"];
const gP = te({
  prop: "gridColumn"
}), vP = te({
  prop: "gridRow"
}), yP = te({
  prop: "gridAutoFlow"
}), bP = te({
  prop: "gridAutoColumns"
}), xP = te({
  prop: "gridAutoRows"
}), wP = te({
  prop: "gridTemplateColumns"
}), SP = te({
  prop: "gridTemplateRows"
}), CP = te({
  prop: "gridTemplateAreas"
}), kP = te({
  prop: "gridArea"
}), EP = Gr(Nh, Lh, Fh, gP, vP, yP, bP, xP, wP, SP, CP, kP), mx = EP;
function Dh(e, t) {
  return t === "grey" ? t : e;
}
const RP = te({
  prop: "color",
  themeKey: "palette",
  transform: Dh
}), TP = te({
  prop: "bgcolor",
  cssProperty: "backgroundColor",
  themeKey: "palette",
  transform: Dh
}), PP = te({
  prop: "backgroundColor",
  themeKey: "palette",
  transform: Dh
}), OP = Gr(RP, TP, PP), gx = OP, $P = te({
  prop: "position"
}), _P = te({
  prop: "zIndex",
  themeKey: "zIndex"
}), MP = te({
  prop: "top"
}), IP = te({
  prop: "right"
}), AP = te({
  prop: "bottom"
}), NP = te({
  prop: "left"
}), vx = Gr($P, _P, MP, IP, AP, NP), LP = te({
  prop: "boxShadow",
  themeKey: "shadows"
}), yx = LP;
function Qr(e) {
  return e <= 1 && e !== 0 ? `${e * 100}%` : e;
}
const FP = te({
  prop: "width",
  transform: Qr
}), bx = (e) => {
  if (e.maxWidth !== void 0 && e.maxWidth !== null) {
    const t = (n) => {
      var r, o, i;
      return {
        maxWidth: ((r = e.theme) == null || (o = r.breakpoints) == null || (i = o.values) == null ? void 0 : i[n]) || _h[n] || Qr(n)
      };
    };
    return Wn(e, e.maxWidth, t);
  }
  return null;
};
bx.filterProps = ["maxWidth"];
const DP = te({
  prop: "minWidth",
  transform: Qr
}), zP = te({
  prop: "height",
  transform: Qr
}), BP = te({
  prop: "maxHeight",
  transform: Qr
}), jP = te({
  prop: "minHeight",
  transform: Qr
});
te({
  prop: "size",
  cssProperty: "width",
  transform: Qr
});
te({
  prop: "size",
  cssProperty: "height",
  transform: Qr
});
const WP = te({
  prop: "boxSizing"
}), UP = Gr(FP, bx, DP, zP, BP, jP, WP), xx = UP, HP = te({
  prop: "fontFamily",
  themeKey: "typography"
}), VP = te({
  prop: "fontSize",
  themeKey: "typography"
}), YP = te({
  prop: "fontStyle",
  themeKey: "typography"
}), XP = te({
  prop: "fontWeight",
  themeKey: "typography"
}), KP = te({
  prop: "letterSpacing"
}), qP = te({
  prop: "textTransform"
}), GP = te({
  prop: "lineHeight"
}), QP = te({
  prop: "textAlign"
}), JP = te({
  prop: "typography",
  cssProperty: !1,
  themeKey: "typography"
}), ZP = Gr(JP, HP, VP, YP, XP, KP, GP, QP, qP), wx = ZP, gv = {
  borders: fx.filterProps,
  display: px.filterProps,
  flexbox: hx.filterProps,
  grid: mx.filterProps,
  positions: vx.filterProps,
  palette: gx.filterProps,
  shadows: yx.filterProps,
  sizing: xx.filterProps,
  spacing: gu.filterProps,
  typography: wx.filterProps
}, Sx = {
  borders: fx,
  display: px,
  flexbox: hx,
  grid: mx,
  positions: vx,
  palette: gx,
  shadows: yx,
  sizing: xx,
  spacing: gu,
  typography: wx
}, eO = Object.keys(gv).reduce((e, t) => (gv[t].forEach((n) => {
  e[n] = Sx[t];
}), e), {});
function tO(...e) {
  const t = e.reduce((r, o) => r.concat(Object.keys(o)), []), n = new Set(t);
  return e.every((r) => n.size === Object.keys(r).length);
}
function nO(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function rO(e = Sx) {
  const t = Object.keys(e).reduce((o, i) => (e[i].filterProps.forEach((s) => {
    o[s] = e[i];
  }), o), {});
  function n(o, i, s) {
    const a = {
      [o]: i,
      theme: s
    }, l = t[o];
    return l ? l(a) : {
      [o]: i
    };
  }
  function r(o) {
    const {
      sx: i,
      theme: s = {}
    } = o || {};
    if (!i)
      return null;
    function a(l) {
      let c = l;
      if (typeof l == "function")
        c = l(s);
      else if (typeof l != "object")
        return l;
      if (!c)
        return null;
      const u = cx(s.breakpoints), f = Object.keys(u);
      let h = u;
      return Object.keys(c).forEach((y) => {
        const d = nO(c[y], s);
        if (d != null)
          if (typeof d == "object")
            if (t[y])
              h = Os(h, n(y, d, s));
            else {
              const m = Wn({
                theme: s
              }, d, (w) => ({
                [y]: w
              }));
              tO(m, d) ? h[y] = r({
                sx: d,
                theme: s
              }) : h = Os(h, m);
            }
          else
            h = Os(h, n(y, d, s));
      }), ux(f, h);
    }
    return Array.isArray(i) ? i.map(a) : a(i);
  }
  return r;
}
const Cx = rO();
Cx.filterProps = ["sx"];
const kx = Cx, oO = ["sx"], iO = (e) => {
  const t = {
    systemProps: {},
    otherProps: {}
  };
  return Object.keys(e).forEach((n) => {
    eO[n] ? t.systemProps[n] = e[n] : t.otherProps[n] = e[n];
  }), t;
};
function zh(e) {
  const {
    sx: t
  } = e, n = Q(e, oO), {
    systemProps: r,
    otherProps: o
  } = iO(n);
  let i;
  return Array.isArray(t) ? i = [r, ...t] : typeof t == "function" ? i = (...s) => {
    const a = t(...s);
    return ps(a) ? k({}, r, a) : r;
  } : i = k({}, r, t), k({}, o, {
    sx: i
  });
}
function Ex(e) {
  var t, n, r = "";
  if (typeof e == "string" || typeof e == "number")
    r += e;
  else if (typeof e == "object")
    if (Array.isArray(e))
      for (t = 0; t < e.length; t++)
        e[t] && (n = Ex(e[t])) && (r && (r += " "), r += n);
    else
      for (t in e)
        e[t] && (r && (r += " "), r += t);
  return r;
}
function Z() {
  for (var e, t, n = 0, r = ""; n < arguments.length; )
    (e = arguments[n++]) && (t = Ex(e)) && (r && (r += " "), r += t);
  return r;
}
const sO = ["values", "unit", "step"], aO = (e) => {
  const t = Object.keys(e).map((n) => ({
    key: n,
    val: e[n]
  })) || [];
  return t.sort((n, r) => n.val - r.val), t.reduce((n, r) => k({}, n, {
    [r.key]: r.val
  }), {});
};
function lO(e) {
  const {
    values: t = {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536
    },
    unit: n = "px",
    step: r = 5
  } = e, o = Q(e, sO), i = aO(t), s = Object.keys(i);
  function a(h) {
    return `@media (min-width:${typeof t[h] == "number" ? t[h] : h}${n})`;
  }
  function l(h) {
    return `@media (max-width:${(typeof t[h] == "number" ? t[h] : h) - r / 100}${n})`;
  }
  function c(h, y) {
    const d = s.indexOf(y);
    return `@media (min-width:${typeof t[h] == "number" ? t[h] : h}${n}) and (max-width:${(d !== -1 && typeof t[s[d]] == "number" ? t[s[d]] : y) - r / 100}${n})`;
  }
  function u(h) {
    return s.indexOf(h) + 1 < s.length ? c(h, s[s.indexOf(h) + 1]) : a(h);
  }
  function f(h) {
    const y = s.indexOf(h);
    return y === 0 ? a(s[1]) : y === s.length - 1 ? l(s[y]) : c(h, s[s.indexOf(h) + 1]).replace("@media", "@media not all and");
  }
  return k({
    keys: s,
    values: i,
    up: a,
    down: l,
    between: c,
    only: u,
    not: f,
    unit: n
  }, o);
}
const cO = {
  borderRadius: 4
}, uO = cO;
function dO(e = 8) {
  if (e.mui)
    return e;
  const t = Ih({
    spacing: e
  }), n = (...r) => (r.length === 0 ? [1] : r).map((i) => {
    const s = t(i);
    return typeof s == "number" ? `${s}px` : s;
  }).join(" ");
  return n.mui = !0, n;
}
const fO = ["breakpoints", "palette", "spacing", "shape"];
function Bh(e = {}, ...t) {
  const {
    breakpoints: n = {},
    palette: r = {},
    spacing: o,
    shape: i = {}
  } = e, s = Q(e, fO), a = lO(n), l = dO(o);
  let c = Bt({
    breakpoints: a,
    direction: "ltr",
    components: {},
    palette: k({
      mode: "light"
    }, r),
    spacing: l,
    shape: k({}, uO, i)
  }, s);
  return c = t.reduce((u, f) => Bt(u, f), c), c;
}
const pO = /* @__PURE__ */ x.exports.createContext(null), hO = pO;
function mO() {
  return x.exports.useContext(hO);
}
function gO(e) {
  return Object.keys(e).length === 0;
}
function jh(e = null) {
  const t = mO();
  return !t || gO(t) ? e : t;
}
const vO = Bh();
function Wh(e = vO) {
  return jh(e);
}
const yO = ["className", "component"];
function bO(e = {}) {
  const {
    defaultTheme: t,
    defaultClassName: n = "MuiBox-root",
    generateClassName: r,
    styleFunctionSx: o = kx
  } = e, i = rx("div", {
    shouldForwardProp: (a) => a !== "theme" && a !== "sx" && a !== "as"
  })(o);
  return /* @__PURE__ */ x.exports.forwardRef(function(l, c) {
    const u = Wh(t), f = zh(l), {
      className: h,
      component: y = "div"
    } = f, d = Q(f, yO);
    return /* @__PURE__ */ S(i, k({
      as: y,
      ref: c,
      className: Z(h, r ? r(n) : n),
      theme: u
    }, d));
  });
}
const xO = ["variant"];
function vv(e) {
  return e.length === 0;
}
function Rx(e) {
  const {
    variant: t
  } = e, n = Q(e, xO);
  let r = t || "";
  return Object.keys(n).sort().forEach((o) => {
    o === "color" ? r += vv(r) ? e[o] : N(e[o]) : r += `${vv(r) ? o : N(o)}${N(e[o].toString())}`;
  }), r;
}
const wO = ["name", "slot", "skipVariantsResolver", "skipSx", "overridesResolver"], SO = ["theme"], CO = ["theme"];
function Zi(e) {
  return Object.keys(e).length === 0;
}
function kO(e) {
  return typeof e == "string" && e.charCodeAt(0) > 96;
}
const EO = (e, t) => t.components && t.components[e] && t.components[e].styleOverrides ? t.components[e].styleOverrides : null, RO = (e, t) => {
  let n = [];
  t && t.components && t.components[e] && t.components[e].variants && (n = t.components[e].variants);
  const r = {};
  return n.forEach((o) => {
    const i = Rx(o.props);
    r[i] = o.style;
  }), r;
}, TO = (e, t, n, r) => {
  var o, i;
  const {
    ownerState: s = {}
  } = e, a = [], l = n == null || (o = n.components) == null || (i = o[r]) == null ? void 0 : i.variants;
  return l && l.forEach((c) => {
    let u = !0;
    Object.keys(c.props).forEach((f) => {
      s[f] !== c.props[f] && e[f] !== c.props[f] && (u = !1);
    }), u && a.push(t[Rx(c.props)]);
  }), a;
};
function $s(e) {
  return e !== "ownerState" && e !== "theme" && e !== "sx" && e !== "as";
}
const PO = Bh();
function OO(e = {}) {
  const {
    defaultTheme: t = PO,
    rootShouldForwardProp: n = $s,
    slotShouldForwardProp: r = $s,
    styleFunctionSx: o = kx
  } = e, i = (s) => {
    const a = Zi(s.theme) ? t : s.theme;
    return o(k({}, s, {
      theme: a
    }));
  };
  return i.__mui_systemSx = !0, (s, a = {}) => {
    pT(s, (b) => b.filter((C) => !(C != null && C.__mui_systemSx)));
    const {
      name: l,
      slot: c,
      skipVariantsResolver: u,
      skipSx: f,
      overridesResolver: h
    } = a, y = Q(a, wO), d = u !== void 0 ? u : c && c !== "Root" || !1, m = f || !1;
    let w, g = $s;
    c === "Root" ? g = n : c ? g = r : kO(s) && (g = void 0);
    const p = rx(s, k({
      shouldForwardProp: g,
      label: w
    }, y)), v = (b, ...C) => {
      const E = C ? C.map((P) => typeof P == "function" && P.__emotion_real !== P ? ($) => {
        let {
          theme: B
        } = $, D = Q($, SO);
        return P(k({
          theme: Zi(B) ? t : B
        }, D));
      } : P) : [];
      let R = b;
      l && h && E.push((P) => {
        const $ = Zi(P.theme) ? t : P.theme, B = EO(l, $);
        if (B) {
          const D = {};
          return Object.entries(B).forEach(([I, M]) => {
            D[I] = typeof M == "function" ? M(k({}, P, {
              theme: $
            })) : M;
          }), h(P, D);
        }
        return null;
      }), l && !d && E.push((P) => {
        const $ = Zi(P.theme) ? t : P.theme;
        return TO(P, RO(l, $), $, l);
      }), m || E.push(i);
      const T = E.length - C.length;
      if (Array.isArray(b) && T > 0) {
        const P = new Array(T).fill("");
        R = [...b, ...P], R.raw = [...b.raw, ...P];
      } else
        typeof b == "function" && b.__emotion_real !== b && (R = (P) => {
          let {
            theme: $
          } = P, B = Q(P, CO);
          return b(k({
            theme: Zi($) ? t : $
          }, B));
        });
      return p(R, ...E);
    };
    return p.withConfig && (v.withConfig = p.withConfig), v;
  };
}
function Tx(e) {
  const {
    theme: t,
    name: n,
    props: r
  } = e;
  return !t || !t.components || !t.components[n] || !t.components[n].defaultProps ? r : ax(t.components[n].defaultProps, r);
}
function $O({
  props: e,
  name: t,
  defaultTheme: n
}) {
  const r = Wh(n);
  return Tx({
    theme: r,
    name: t,
    props: e
  });
}
function Uh(e, t = 0, n = 1) {
  return Math.min(Math.max(t, e), n);
}
function _O(e) {
  e = e.slice(1);
  const t = new RegExp(`.{1,${e.length >= 6 ? 2 : 1}}`, "g");
  let n = e.match(t);
  return n && n[0].length === 1 && (n = n.map((r) => r + r)), n ? `rgb${n.length === 4 ? "a" : ""}(${n.map((r, o) => o < 3 ? parseInt(r, 16) : Math.round(parseInt(r, 16) / 255 * 1e3) / 1e3).join(", ")})` : "";
}
function Eo(e) {
  if (e.type)
    return e;
  if (e.charAt(0) === "#")
    return Eo(_O(e));
  const t = e.indexOf("("), n = e.substring(0, t);
  if (["rgb", "rgba", "hsl", "hsla", "color"].indexOf(n) === -1)
    throw new Error(Vr(9, e));
  let r = e.substring(t + 1, e.length - 1), o;
  if (n === "color") {
    if (r = r.split(" "), o = r.shift(), r.length === 4 && r[3].charAt(0) === "/" && (r[3] = r[3].slice(1)), ["srgb", "display-p3", "a98-rgb", "prophoto-rgb", "rec-2020"].indexOf(o) === -1)
      throw new Error(Vr(10, o));
  } else
    r = r.split(",");
  return r = r.map((i) => parseFloat(i)), {
    type: n,
    values: r,
    colorSpace: o
  };
}
function vu(e) {
  const {
    type: t,
    colorSpace: n
  } = e;
  let {
    values: r
  } = e;
  return t.indexOf("rgb") !== -1 ? r = r.map((o, i) => i < 3 ? parseInt(o, 10) : o) : t.indexOf("hsl") !== -1 && (r[1] = `${r[1]}%`, r[2] = `${r[2]}%`), t.indexOf("color") !== -1 ? r = `${n} ${r.join(" ")}` : r = `${r.join(", ")}`, `${t}(${r})`;
}
function MO(e) {
  e = Eo(e);
  const {
    values: t
  } = e, n = t[0], r = t[1] / 100, o = t[2] / 100, i = r * Math.min(o, 1 - o), s = (c, u = (c + n / 30) % 12) => o - i * Math.max(Math.min(u - 3, 9 - u, 1), -1);
  let a = "rgb";
  const l = [Math.round(s(0) * 255), Math.round(s(8) * 255), Math.round(s(4) * 255)];
  return e.type === "hsla" && (a += "a", l.push(t[3])), vu({
    type: a,
    values: l
  });
}
function Bf(e) {
  e = Eo(e);
  let t = e.type === "hsl" || e.type === "hsla" ? Eo(MO(e)).values : e.values;
  return t = t.map((n) => (e.type !== "color" && (n /= 255), n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4)), Number((0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2]).toFixed(3));
}
function IO(e, t) {
  const n = Bf(e), r = Bf(t);
  return (Math.max(n, r) + 0.05) / (Math.min(n, r) + 0.05);
}
function Ie(e, t) {
  return e = Eo(e), t = Uh(t), (e.type === "rgb" || e.type === "hsl") && (e.type += "a"), e.type === "color" ? e.values[3] = `/${t}` : e.values[3] = t, vu(e);
}
function ia(e, t) {
  if (e = Eo(e), t = Uh(t), e.type.indexOf("hsl") !== -1)
    e.values[2] *= 1 - t;
  else if (e.type.indexOf("rgb") !== -1 || e.type.indexOf("color") !== -1)
    for (let n = 0; n < 3; n += 1)
      e.values[n] *= 1 - t;
  return vu(e);
}
function sa(e, t) {
  if (e = Eo(e), t = Uh(t), e.type.indexOf("hsl") !== -1)
    e.values[2] += (100 - e.values[2]) * t;
  else if (e.type.indexOf("rgb") !== -1)
    for (let n = 0; n < 3; n += 1)
      e.values[n] += (255 - e.values[n]) * t;
  else if (e.type.indexOf("color") !== -1)
    for (let n = 0; n < 3; n += 1)
      e.values[n] += (1 - e.values[n]) * t;
  return vu(e);
}
function AO(e, t = 0.15) {
  return Bf(e) > 0.5 ? ia(e, t) : sa(e, t);
}
function NO(e, t, n, r, o) {
  const i = typeof window < "u" && typeof window.matchMedia < "u", [s, a] = x.exports.useState(() => o && i ? n(e).matches : r ? r(e).matches : t);
  return jn(() => {
    let l = !0;
    if (!i)
      return;
    const c = n(e), u = () => {
      l && a(c.matches);
    };
    return u(), c.addListener(u), () => {
      l = !1, c.removeListener(u);
    };
  }, [e, n, i]), s;
}
const Px = Bl["useSyncExternalStore"];
function LO(e, t, n, r) {
  const o = x.exports.useCallback(() => t, [t]), i = x.exports.useMemo(() => {
    if (r !== null) {
      const {
        matches: c
      } = r(e);
      return () => c;
    }
    return o;
  }, [o, e, r]), [s, a] = x.exports.useMemo(() => {
    if (n === null)
      return [o, () => () => {
      }];
    const c = n(e);
    return [() => c.matches, (u) => (c.addListener(u), () => {
      c.removeListener(u);
    })];
  }, [o, n, e]);
  return Px(a, s, i);
}
function FO(e, t = {}) {
  const n = jh(), r = typeof window < "u" && typeof window.matchMedia < "u", {
    defaultMatches: o = !1,
    matchMedia: i = r ? window.matchMedia : null,
    ssrMatchMedia: s = null,
    noSsr: a
  } = Tx({
    name: "MuiUseMediaQuery",
    props: t,
    theme: n
  });
  let l = typeof e == "function" ? e(n) : e;
  return l = l.replace(/^@media( ?)/m, ""), (Px !== void 0 ? LO : NO)(l, o, i, s, a);
}
function aa(e) {
  return typeof e == "string";
}
function hs(e, t, n) {
  return aa(e) ? t : k({}, t, {
    ownerState: k({}, t.ownerState, n)
  });
}
function DO(e, t = []) {
  if (e === void 0)
    return {};
  const n = {};
  return Object.keys(e).filter((r) => r.match(/^on[A-Z]/) && typeof e[r] == "function" && !t.includes(r)).forEach((r) => {
    n[r] = e[r];
  }), n;
}
function jf(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function yv(e) {
  if (e === void 0)
    return {};
  const t = {};
  return Object.keys(e).filter((n) => !(n.match(/^on[A-Z]/) && typeof e[n] == "function")).forEach((n) => {
    t[n] = e[n];
  }), t;
}
function zO(e) {
  const {
    getSlotProps: t,
    additionalProps: n,
    externalSlotProps: r,
    externalForwardedProps: o,
    className: i
  } = e;
  if (!t) {
    const y = Z(o == null ? void 0 : o.className, r == null ? void 0 : r.className, i, n == null ? void 0 : n.className), d = k({}, n == null ? void 0 : n.style, o == null ? void 0 : o.style, r == null ? void 0 : r.style), m = k({}, n, o, r);
    return y.length > 0 && (m.className = y), Object.keys(d).length > 0 && (m.style = d), {
      props: m,
      internalRef: void 0
    };
  }
  const s = DO(k({}, o, r)), a = yv(r), l = yv(o), c = t(s), u = Z(c == null ? void 0 : c.className, n == null ? void 0 : n.className, i, o == null ? void 0 : o.className, r == null ? void 0 : r.className), f = k({}, c == null ? void 0 : c.style, n == null ? void 0 : n.style, o == null ? void 0 : o.style, r == null ? void 0 : r.style), h = k({}, c, n, l, a);
  return u.length > 0 && (h.className = u), Object.keys(f).length > 0 && (h.style = f), {
    props: h,
    internalRef: c.ref
  };
}
const BO = ["elementType", "externalSlotProps", "ownerState"];
function la(e) {
  var t;
  const {
    elementType: n,
    externalSlotProps: r,
    ownerState: o
  } = e, i = Q(e, BO), s = jf(r, o), {
    props: a,
    internalRef: l
  } = zO(k({}, i, {
    externalSlotProps: s
  })), c = Qe(l, s == null ? void 0 : s.ref, (t = e.additionalProps) == null ? void 0 : t.ref);
  return hs(n, k({}, a, {
    ref: c
  }), o);
}
function jO(e) {
  const {
    badgeContent: t,
    invisible: n = !1,
    max: r = 99,
    showZero: o = !1
  } = e, i = sx({
    badgeContent: t,
    max: r
  });
  let s = n;
  n === !1 && t === 0 && !o && (s = !0);
  const {
    badgeContent: a,
    max: l = r
  } = s ? i : e, c = a && Number(a) > l ? `${l}+` : a;
  return {
    badgeContent: a,
    invisible: s,
    max: l,
    displayValue: c
  };
}
function WO(e) {
  return he("MuiBadge", e);
}
fe("MuiBadge", ["root", "badge", "invisible"]);
const UO = ["badgeContent", "component", "children", "invisible", "max", "slotProps", "slots", "showZero"], HO = (e) => {
  const {
    invisible: t
  } = e;
  return me({
    root: ["root"],
    badge: ["badge", t && "invisible"]
  }, WO, void 0);
}, VO = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const {
    component: r,
    children: o,
    max: i = 99,
    slotProps: s = {},
    slots: a = {},
    showZero: l = !1
  } = t, c = Q(t, UO), {
    badgeContent: u,
    max: f,
    displayValue: h,
    invisible: y
  } = jO(k({}, t, {
    max: i
  })), d = k({}, t, {
    badgeContent: u,
    invisible: y,
    max: f,
    showZero: l
  }), m = HO(d), w = r || a.root || "span", g = la({
    elementType: w,
    externalSlotProps: s.root,
    externalForwardedProps: c,
    additionalProps: {
      ref: n
    },
    ownerState: d,
    className: m.root
  }), p = a.badge || "span", v = la({
    elementType: p,
    externalSlotProps: s.badge,
    ownerState: d,
    className: m.badge
  });
  return /* @__PURE__ */ G(w, k({}, g, {
    children: [o, /* @__PURE__ */ S(p, k({}, v, {
      children: h
    }))]
  }));
}), YO = VO;
function bv(e) {
  return e.substring(2).toLowerCase();
}
function XO(e, t) {
  return t.documentElement.clientWidth < e.clientX || t.documentElement.clientHeight < e.clientY;
}
function KO(e) {
  const {
    children: t,
    disableReactTree: n = !1,
    mouseEvent: r = "onClick",
    onClickAway: o,
    touchEvent: i = "onTouchEnd"
  } = e, s = x.exports.useRef(!1), a = x.exports.useRef(null), l = x.exports.useRef(!1), c = x.exports.useRef(!1);
  x.exports.useEffect(() => (setTimeout(() => {
    l.current = !0;
  }, 0), () => {
    l.current = !1;
  }), []);
  const u = Qe(
    t.ref,
    a
  ), f = In((d) => {
    const m = c.current;
    c.current = !1;
    const w = mt(a.current);
    if (!l.current || !a.current || "clientX" in d && XO(d, w))
      return;
    if (s.current) {
      s.current = !1;
      return;
    }
    let g;
    d.composedPath ? g = d.composedPath().indexOf(a.current) > -1 : g = !w.documentElement.contains(
      d.target
    ) || a.current.contains(
      d.target
    ), !g && (n || !m) && o(d);
  }), h = (d) => (m) => {
    c.current = !0;
    const w = t.props[d];
    w && w(m);
  }, y = {
    ref: u
  };
  return i !== !1 && (y[i] = h(i)), x.exports.useEffect(() => {
    if (i !== !1) {
      const d = bv(i), m = mt(a.current), w = () => {
        s.current = !0;
      };
      return m.addEventListener(d, f), m.addEventListener("touchmove", w), () => {
        m.removeEventListener(d, f), m.removeEventListener("touchmove", w);
      };
    }
  }, [f, i]), r !== !1 && (y[r] = h(r)), x.exports.useEffect(() => {
    if (r !== !1) {
      const d = bv(r), m = mt(a.current);
      return m.addEventListener(d, f), () => {
        m.removeEventListener(d, f);
      };
    }
  }, [f, r]), /* @__PURE__ */ S(x.exports.Fragment, {
    children: /* @__PURE__ */ x.exports.cloneElement(t, y)
  });
}
const qO = ["input", "select", "textarea", "a[href]", "button", "[tabindex]", "audio[controls]", "video[controls]", '[contenteditable]:not([contenteditable="false"])'].join(",");
function GO(e) {
  const t = parseInt(e.getAttribute("tabindex"), 10);
  return Number.isNaN(t) ? e.contentEditable === "true" || (e.nodeName === "AUDIO" || e.nodeName === "VIDEO" || e.nodeName === "DETAILS") && e.getAttribute("tabindex") === null ? 0 : e.tabIndex : t;
}
function QO(e) {
  if (e.tagName !== "INPUT" || e.type !== "radio" || !e.name)
    return !1;
  const t = (r) => e.ownerDocument.querySelector(`input[type="radio"]${r}`);
  let n = t(`[name="${e.name}"]:checked`);
  return n || (n = t(`[name="${e.name}"]`)), n !== e;
}
function JO(e) {
  return !(e.disabled || e.tagName === "INPUT" && e.type === "hidden" || QO(e));
}
function ZO(e) {
  const t = [], n = [];
  return Array.from(e.querySelectorAll(qO)).forEach((r, o) => {
    const i = GO(r);
    i === -1 || !JO(r) || (i === 0 ? t.push(r) : n.push({
      documentOrder: o,
      tabIndex: i,
      node: r
    }));
  }), n.sort((r, o) => r.tabIndex === o.tabIndex ? r.documentOrder - o.documentOrder : r.tabIndex - o.tabIndex).map((r) => r.node).concat(t);
}
function e2() {
  return !0;
}
function t2(e) {
  const {
    children: t,
    disableAutoFocus: n = !1,
    disableEnforceFocus: r = !1,
    disableRestoreFocus: o = !1,
    getTabbable: i = ZO,
    isEnabled: s = e2,
    open: a
  } = e, l = x.exports.useRef(), c = x.exports.useRef(null), u = x.exports.useRef(null), f = x.exports.useRef(null), h = x.exports.useRef(null), y = x.exports.useRef(!1), d = x.exports.useRef(null), m = Qe(t.ref, d), w = x.exports.useRef(null);
  x.exports.useEffect(() => {
    !a || !d.current || (y.current = !n);
  }, [n, a]), x.exports.useEffect(() => {
    if (!a || !d.current)
      return;
    const v = mt(d.current);
    return d.current.contains(v.activeElement) || (d.current.hasAttribute("tabIndex") || d.current.setAttribute("tabIndex", -1), y.current && d.current.focus()), () => {
      o || (f.current && f.current.focus && (l.current = !0, f.current.focus()), f.current = null);
    };
  }, [a]), x.exports.useEffect(() => {
    if (!a || !d.current)
      return;
    const v = mt(d.current), b = (R) => {
      const {
        current: T
      } = d;
      if (T !== null) {
        if (!v.hasFocus() || r || !s() || l.current) {
          l.current = !1;
          return;
        }
        if (!T.contains(v.activeElement)) {
          if (R && h.current !== R.target || v.activeElement !== h.current)
            h.current = null;
          else if (h.current !== null)
            return;
          if (!y.current)
            return;
          let $ = [];
          if ((v.activeElement === c.current || v.activeElement === u.current) && ($ = i(d.current)), $.length > 0) {
            var O, P;
            const B = Boolean(((O = w.current) == null ? void 0 : O.shiftKey) && ((P = w.current) == null ? void 0 : P.key) === "Tab"), D = $[0], I = $[$.length - 1];
            B ? I.focus() : D.focus();
          } else
            T.focus();
        }
      }
    }, C = (R) => {
      w.current = R, !(r || !s() || R.key !== "Tab") && v.activeElement === d.current && R.shiftKey && (l.current = !0, u.current.focus());
    };
    v.addEventListener("focusin", b), v.addEventListener("keydown", C, !0);
    const E = setInterval(() => {
      v.activeElement.tagName === "BODY" && b();
    }, 50);
    return () => {
      clearInterval(E), v.removeEventListener("focusin", b), v.removeEventListener("keydown", C, !0);
    };
  }, [n, r, o, s, a, i]);
  const g = (v) => {
    f.current === null && (f.current = v.relatedTarget), y.current = !0, h.current = v.target;
    const b = t.props.onFocus;
    b && b(v);
  }, p = (v) => {
    f.current === null && (f.current = v.relatedTarget), y.current = !0;
  };
  return /* @__PURE__ */ G(x.exports.Fragment, {
    children: [/* @__PURE__ */ S("div", {
      tabIndex: a ? 0 : -1,
      onFocus: p,
      ref: c,
      "data-testid": "sentinelStart"
    }), /* @__PURE__ */ x.exports.cloneElement(t, {
      ref: m,
      onFocus: g
    }), /* @__PURE__ */ S("div", {
      tabIndex: a ? 0 : -1,
      onFocus: p,
      ref: u,
      "data-testid": "sentinelEnd"
    })]
  });
}
var jt = "top", dn = "bottom", fn = "right", Wt = "left", Hh = "auto", Oa = [jt, dn, fn, Wt], wi = "start", ca = "end", n2 = "clippingParents", Ox = "viewport", es = "popper", r2 = "reference", xv = /* @__PURE__ */ Oa.reduce(function(e, t) {
  return e.concat([t + "-" + wi, t + "-" + ca]);
}, []), $x = /* @__PURE__ */ [].concat(Oa, [Hh]).reduce(function(e, t) {
  return e.concat([t, t + "-" + wi, t + "-" + ca]);
}, []), o2 = "beforeRead", i2 = "read", s2 = "afterRead", a2 = "beforeMain", l2 = "main", c2 = "afterMain", u2 = "beforeWrite", d2 = "write", f2 = "afterWrite", p2 = [o2, i2, s2, a2, l2, c2, u2, d2, f2];
function Un(e) {
  return e ? (e.nodeName || "").toLowerCase() : null;
}
function hn(e) {
  if (e == null)
    return window;
  if (e.toString() !== "[object Window]") {
    var t = e.ownerDocument;
    return t && t.defaultView || window;
  }
  return e;
}
function Ro(e) {
  var t = hn(e).Element;
  return e instanceof t || e instanceof Element;
}
function ln(e) {
  var t = hn(e).HTMLElement;
  return e instanceof t || e instanceof HTMLElement;
}
function Vh(e) {
  if (typeof ShadowRoot > "u")
    return !1;
  var t = hn(e).ShadowRoot;
  return e instanceof t || e instanceof ShadowRoot;
}
function h2(e) {
  var t = e.state;
  Object.keys(t.elements).forEach(function(n) {
    var r = t.styles[n] || {}, o = t.attributes[n] || {}, i = t.elements[n];
    !ln(i) || !Un(i) || (Object.assign(i.style, r), Object.keys(o).forEach(function(s) {
      var a = o[s];
      a === !1 ? i.removeAttribute(s) : i.setAttribute(s, a === !0 ? "" : a);
    }));
  });
}
function m2(e) {
  var t = e.state, n = {
    popper: {
      position: t.options.strategy,
      left: "0",
      top: "0",
      margin: "0"
    },
    arrow: {
      position: "absolute"
    },
    reference: {}
  };
  return Object.assign(t.elements.popper.style, n.popper), t.styles = n, t.elements.arrow && Object.assign(t.elements.arrow.style, n.arrow), function() {
    Object.keys(t.elements).forEach(function(r) {
      var o = t.elements[r], i = t.attributes[r] || {}, s = Object.keys(t.styles.hasOwnProperty(r) ? t.styles[r] : n[r]), a = s.reduce(function(l, c) {
        return l[c] = "", l;
      }, {});
      !ln(o) || !Un(o) || (Object.assign(o.style, a), Object.keys(i).forEach(function(l) {
        o.removeAttribute(l);
      }));
    });
  };
}
const g2 = {
  name: "applyStyles",
  enabled: !0,
  phase: "write",
  fn: h2,
  effect: m2,
  requires: ["computeStyles"]
};
function Dn(e) {
  return e.split("-")[0];
}
var vo = Math.max, fc = Math.min, Si = Math.round;
function Wf() {
  var e = navigator.userAgentData;
  return e != null && e.brands ? e.brands.map(function(t) {
    return t.brand + "/" + t.version;
  }).join(" ") : navigator.userAgent;
}
function _x() {
  return !/^((?!chrome|android).)*safari/i.test(Wf());
}
function Ci(e, t, n) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  var r = e.getBoundingClientRect(), o = 1, i = 1;
  t && ln(e) && (o = e.offsetWidth > 0 && Si(r.width) / e.offsetWidth || 1, i = e.offsetHeight > 0 && Si(r.height) / e.offsetHeight || 1);
  var s = Ro(e) ? hn(e) : window, a = s.visualViewport, l = !_x() && n, c = (r.left + (l && a ? a.offsetLeft : 0)) / o, u = (r.top + (l && a ? a.offsetTop : 0)) / i, f = r.width / o, h = r.height / i;
  return {
    width: f,
    height: h,
    top: u,
    right: c + f,
    bottom: u + h,
    left: c,
    x: c,
    y: u
  };
}
function Yh(e) {
  var t = Ci(e), n = e.offsetWidth, r = e.offsetHeight;
  return Math.abs(t.width - n) <= 1 && (n = t.width), Math.abs(t.height - r) <= 1 && (r = t.height), {
    x: e.offsetLeft,
    y: e.offsetTop,
    width: n,
    height: r
  };
}
function Mx(e, t) {
  var n = t.getRootNode && t.getRootNode();
  if (e.contains(t))
    return !0;
  if (n && Vh(n)) {
    var r = t;
    do {
      if (r && e.isSameNode(r))
        return !0;
      r = r.parentNode || r.host;
    } while (r);
  }
  return !1;
}
function sr(e) {
  return hn(e).getComputedStyle(e);
}
function v2(e) {
  return ["table", "td", "th"].indexOf(Un(e)) >= 0;
}
function Jr(e) {
  return ((Ro(e) ? e.ownerDocument : e.document) || window.document).documentElement;
}
function yu(e) {
  return Un(e) === "html" ? e : e.assignedSlot || e.parentNode || (Vh(e) ? e.host : null) || Jr(e);
}
function wv(e) {
  return !ln(e) || sr(e).position === "fixed" ? null : e.offsetParent;
}
function y2(e) {
  var t = /firefox/i.test(Wf()), n = /Trident/i.test(Wf());
  if (n && ln(e)) {
    var r = sr(e);
    if (r.position === "fixed")
      return null;
  }
  var o = yu(e);
  for (Vh(o) && (o = o.host); ln(o) && ["html", "body"].indexOf(Un(o)) < 0; ) {
    var i = sr(o);
    if (i.transform !== "none" || i.perspective !== "none" || i.contain === "paint" || ["transform", "perspective"].indexOf(i.willChange) !== -1 || t && i.willChange === "filter" || t && i.filter && i.filter !== "none")
      return o;
    o = o.parentNode;
  }
  return null;
}
function $a(e) {
  for (var t = hn(e), n = wv(e); n && v2(n) && sr(n).position === "static"; )
    n = wv(n);
  return n && (Un(n) === "html" || Un(n) === "body" && sr(n).position === "static") ? t : n || y2(e) || t;
}
function Xh(e) {
  return ["top", "bottom"].indexOf(e) >= 0 ? "x" : "y";
}
function _s(e, t, n) {
  return vo(e, fc(t, n));
}
function b2(e, t, n) {
  var r = _s(e, t, n);
  return r > n ? n : r;
}
function Ix() {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
}
function Ax(e) {
  return Object.assign({}, Ix(), e);
}
function Nx(e, t) {
  return t.reduce(function(n, r) {
    return n[r] = e, n;
  }, {});
}
var x2 = function(t, n) {
  return t = typeof t == "function" ? t(Object.assign({}, n.rects, {
    placement: n.placement
  })) : t, Ax(typeof t != "number" ? t : Nx(t, Oa));
};
function w2(e) {
  var t, n = e.state, r = e.name, o = e.options, i = n.elements.arrow, s = n.modifiersData.popperOffsets, a = Dn(n.placement), l = Xh(a), c = [Wt, fn].indexOf(a) >= 0, u = c ? "height" : "width";
  if (!(!i || !s)) {
    var f = x2(o.padding, n), h = Yh(i), y = l === "y" ? jt : Wt, d = l === "y" ? dn : fn, m = n.rects.reference[u] + n.rects.reference[l] - s[l] - n.rects.popper[u], w = s[l] - n.rects.reference[l], g = $a(i), p = g ? l === "y" ? g.clientHeight || 0 : g.clientWidth || 0 : 0, v = m / 2 - w / 2, b = f[y], C = p - h[u] - f[d], E = p / 2 - h[u] / 2 + v, R = _s(b, E, C), T = l;
    n.modifiersData[r] = (t = {}, t[T] = R, t.centerOffset = R - E, t);
  }
}
function S2(e) {
  var t = e.state, n = e.options, r = n.element, o = r === void 0 ? "[data-popper-arrow]" : r;
  o != null && (typeof o == "string" && (o = t.elements.popper.querySelector(o), !o) || !Mx(t.elements.popper, o) || (t.elements.arrow = o));
}
const C2 = {
  name: "arrow",
  enabled: !0,
  phase: "main",
  fn: w2,
  effect: S2,
  requires: ["popperOffsets"],
  requiresIfExists: ["preventOverflow"]
};
function ki(e) {
  return e.split("-")[1];
}
var k2 = {
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto"
};
function E2(e) {
  var t = e.x, n = e.y, r = window, o = r.devicePixelRatio || 1;
  return {
    x: Si(t * o) / o || 0,
    y: Si(n * o) / o || 0
  };
}
function Sv(e) {
  var t, n = e.popper, r = e.popperRect, o = e.placement, i = e.variation, s = e.offsets, a = e.position, l = e.gpuAcceleration, c = e.adaptive, u = e.roundOffsets, f = e.isFixed, h = s.x, y = h === void 0 ? 0 : h, d = s.y, m = d === void 0 ? 0 : d, w = typeof u == "function" ? u({
    x: y,
    y: m
  }) : {
    x: y,
    y: m
  };
  y = w.x, m = w.y;
  var g = s.hasOwnProperty("x"), p = s.hasOwnProperty("y"), v = Wt, b = jt, C = window;
  if (c) {
    var E = $a(n), R = "clientHeight", T = "clientWidth";
    if (E === hn(n) && (E = Jr(n), sr(E).position !== "static" && a === "absolute" && (R = "scrollHeight", T = "scrollWidth")), E = E, o === jt || (o === Wt || o === fn) && i === ca) {
      b = dn;
      var O = f && E === C && C.visualViewport ? C.visualViewport.height : E[R];
      m -= O - r.height, m *= l ? 1 : -1;
    }
    if (o === Wt || (o === jt || o === dn) && i === ca) {
      v = fn;
      var P = f && E === C && C.visualViewport ? C.visualViewport.width : E[T];
      y -= P - r.width, y *= l ? 1 : -1;
    }
  }
  var $ = Object.assign({
    position: a
  }, c && k2), B = u === !0 ? E2({
    x: y,
    y: m
  }) : {
    x: y,
    y: m
  };
  if (y = B.x, m = B.y, l) {
    var D;
    return Object.assign({}, $, (D = {}, D[b] = p ? "0" : "", D[v] = g ? "0" : "", D.transform = (C.devicePixelRatio || 1) <= 1 ? "translate(" + y + "px, " + m + "px)" : "translate3d(" + y + "px, " + m + "px, 0)", D));
  }
  return Object.assign({}, $, (t = {}, t[b] = p ? m + "px" : "", t[v] = g ? y + "px" : "", t.transform = "", t));
}
function R2(e) {
  var t = e.state, n = e.options, r = n.gpuAcceleration, o = r === void 0 ? !0 : r, i = n.adaptive, s = i === void 0 ? !0 : i, a = n.roundOffsets, l = a === void 0 ? !0 : a, c = {
    placement: Dn(t.placement),
    variation: ki(t.placement),
    popper: t.elements.popper,
    popperRect: t.rects.popper,
    gpuAcceleration: o,
    isFixed: t.options.strategy === "fixed"
  };
  t.modifiersData.popperOffsets != null && (t.styles.popper = Object.assign({}, t.styles.popper, Sv(Object.assign({}, c, {
    offsets: t.modifiersData.popperOffsets,
    position: t.options.strategy,
    adaptive: s,
    roundOffsets: l
  })))), t.modifiersData.arrow != null && (t.styles.arrow = Object.assign({}, t.styles.arrow, Sv(Object.assign({}, c, {
    offsets: t.modifiersData.arrow,
    position: "absolute",
    adaptive: !1,
    roundOffsets: l
  })))), t.attributes.popper = Object.assign({}, t.attributes.popper, {
    "data-popper-placement": t.placement
  });
}
const T2 = {
  name: "computeStyles",
  enabled: !0,
  phase: "beforeWrite",
  fn: R2,
  data: {}
};
var tl = {
  passive: !0
};
function P2(e) {
  var t = e.state, n = e.instance, r = e.options, o = r.scroll, i = o === void 0 ? !0 : o, s = r.resize, a = s === void 0 ? !0 : s, l = hn(t.elements.popper), c = [].concat(t.scrollParents.reference, t.scrollParents.popper);
  return i && c.forEach(function(u) {
    u.addEventListener("scroll", n.update, tl);
  }), a && l.addEventListener("resize", n.update, tl), function() {
    i && c.forEach(function(u) {
      u.removeEventListener("scroll", n.update, tl);
    }), a && l.removeEventListener("resize", n.update, tl);
  };
}
const O2 = {
  name: "eventListeners",
  enabled: !0,
  phase: "write",
  fn: function() {
  },
  effect: P2,
  data: {}
};
var $2 = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
function Ol(e) {
  return e.replace(/left|right|bottom|top/g, function(t) {
    return $2[t];
  });
}
var _2 = {
  start: "end",
  end: "start"
};
function Cv(e) {
  return e.replace(/start|end/g, function(t) {
    return _2[t];
  });
}
function Kh(e) {
  var t = hn(e), n = t.pageXOffset, r = t.pageYOffset;
  return {
    scrollLeft: n,
    scrollTop: r
  };
}
function qh(e) {
  return Ci(Jr(e)).left + Kh(e).scrollLeft;
}
function M2(e, t) {
  var n = hn(e), r = Jr(e), o = n.visualViewport, i = r.clientWidth, s = r.clientHeight, a = 0, l = 0;
  if (o) {
    i = o.width, s = o.height;
    var c = _x();
    (c || !c && t === "fixed") && (a = o.offsetLeft, l = o.offsetTop);
  }
  return {
    width: i,
    height: s,
    x: a + qh(e),
    y: l
  };
}
function I2(e) {
  var t, n = Jr(e), r = Kh(e), o = (t = e.ownerDocument) == null ? void 0 : t.body, i = vo(n.scrollWidth, n.clientWidth, o ? o.scrollWidth : 0, o ? o.clientWidth : 0), s = vo(n.scrollHeight, n.clientHeight, o ? o.scrollHeight : 0, o ? o.clientHeight : 0), a = -r.scrollLeft + qh(e), l = -r.scrollTop;
  return sr(o || n).direction === "rtl" && (a += vo(n.clientWidth, o ? o.clientWidth : 0) - i), {
    width: i,
    height: s,
    x: a,
    y: l
  };
}
function Gh(e) {
  var t = sr(e), n = t.overflow, r = t.overflowX, o = t.overflowY;
  return /auto|scroll|overlay|hidden/.test(n + o + r);
}
function Lx(e) {
  return ["html", "body", "#document"].indexOf(Un(e)) >= 0 ? e.ownerDocument.body : ln(e) && Gh(e) ? e : Lx(yu(e));
}
function Ms(e, t) {
  var n;
  t === void 0 && (t = []);
  var r = Lx(e), o = r === ((n = e.ownerDocument) == null ? void 0 : n.body), i = hn(r), s = o ? [i].concat(i.visualViewport || [], Gh(r) ? r : []) : r, a = t.concat(s);
  return o ? a : a.concat(Ms(yu(s)));
}
function Uf(e) {
  return Object.assign({}, e, {
    left: e.x,
    top: e.y,
    right: e.x + e.width,
    bottom: e.y + e.height
  });
}
function A2(e, t) {
  var n = Ci(e, !1, t === "fixed");
  return n.top = n.top + e.clientTop, n.left = n.left + e.clientLeft, n.bottom = n.top + e.clientHeight, n.right = n.left + e.clientWidth, n.width = e.clientWidth, n.height = e.clientHeight, n.x = n.left, n.y = n.top, n;
}
function kv(e, t, n) {
  return t === Ox ? Uf(M2(e, n)) : Ro(t) ? A2(t, n) : Uf(I2(Jr(e)));
}
function N2(e) {
  var t = Ms(yu(e)), n = ["absolute", "fixed"].indexOf(sr(e).position) >= 0, r = n && ln(e) ? $a(e) : e;
  return Ro(r) ? t.filter(function(o) {
    return Ro(o) && Mx(o, r) && Un(o) !== "body";
  }) : [];
}
function L2(e, t, n, r) {
  var o = t === "clippingParents" ? N2(e) : [].concat(t), i = [].concat(o, [n]), s = i[0], a = i.reduce(function(l, c) {
    var u = kv(e, c, r);
    return l.top = vo(u.top, l.top), l.right = fc(u.right, l.right), l.bottom = fc(u.bottom, l.bottom), l.left = vo(u.left, l.left), l;
  }, kv(e, s, r));
  return a.width = a.right - a.left, a.height = a.bottom - a.top, a.x = a.left, a.y = a.top, a;
}
function Fx(e) {
  var t = e.reference, n = e.element, r = e.placement, o = r ? Dn(r) : null, i = r ? ki(r) : null, s = t.x + t.width / 2 - n.width / 2, a = t.y + t.height / 2 - n.height / 2, l;
  switch (o) {
    case jt:
      l = {
        x: s,
        y: t.y - n.height
      };
      break;
    case dn:
      l = {
        x: s,
        y: t.y + t.height
      };
      break;
    case fn:
      l = {
        x: t.x + t.width,
        y: a
      };
      break;
    case Wt:
      l = {
        x: t.x - n.width,
        y: a
      };
      break;
    default:
      l = {
        x: t.x,
        y: t.y
      };
  }
  var c = o ? Xh(o) : null;
  if (c != null) {
    var u = c === "y" ? "height" : "width";
    switch (i) {
      case wi:
        l[c] = l[c] - (t[u] / 2 - n[u] / 2);
        break;
      case ca:
        l[c] = l[c] + (t[u] / 2 - n[u] / 2);
        break;
    }
  }
  return l;
}
function ua(e, t) {
  t === void 0 && (t = {});
  var n = t, r = n.placement, o = r === void 0 ? e.placement : r, i = n.strategy, s = i === void 0 ? e.strategy : i, a = n.boundary, l = a === void 0 ? n2 : a, c = n.rootBoundary, u = c === void 0 ? Ox : c, f = n.elementContext, h = f === void 0 ? es : f, y = n.altBoundary, d = y === void 0 ? !1 : y, m = n.padding, w = m === void 0 ? 0 : m, g = Ax(typeof w != "number" ? w : Nx(w, Oa)), p = h === es ? r2 : es, v = e.rects.popper, b = e.elements[d ? p : h], C = L2(Ro(b) ? b : b.contextElement || Jr(e.elements.popper), l, u, s), E = Ci(e.elements.reference), R = Fx({
    reference: E,
    element: v,
    strategy: "absolute",
    placement: o
  }), T = Uf(Object.assign({}, v, R)), O = h === es ? T : E, P = {
    top: C.top - O.top + g.top,
    bottom: O.bottom - C.bottom + g.bottom,
    left: C.left - O.left + g.left,
    right: O.right - C.right + g.right
  }, $ = e.modifiersData.offset;
  if (h === es && $) {
    var B = $[o];
    Object.keys(P).forEach(function(D) {
      var I = [fn, dn].indexOf(D) >= 0 ? 1 : -1, M = [jt, dn].indexOf(D) >= 0 ? "y" : "x";
      P[D] += B[M] * I;
    });
  }
  return P;
}
function F2(e, t) {
  t === void 0 && (t = {});
  var n = t, r = n.placement, o = n.boundary, i = n.rootBoundary, s = n.padding, a = n.flipVariations, l = n.allowedAutoPlacements, c = l === void 0 ? $x : l, u = ki(r), f = u ? a ? xv : xv.filter(function(d) {
    return ki(d) === u;
  }) : Oa, h = f.filter(function(d) {
    return c.indexOf(d) >= 0;
  });
  h.length === 0 && (h = f);
  var y = h.reduce(function(d, m) {
    return d[m] = ua(e, {
      placement: m,
      boundary: o,
      rootBoundary: i,
      padding: s
    })[Dn(m)], d;
  }, {});
  return Object.keys(y).sort(function(d, m) {
    return y[d] - y[m];
  });
}
function D2(e) {
  if (Dn(e) === Hh)
    return [];
  var t = Ol(e);
  return [Cv(e), t, Cv(t)];
}
function z2(e) {
  var t = e.state, n = e.options, r = e.name;
  if (!t.modifiersData[r]._skip) {
    for (var o = n.mainAxis, i = o === void 0 ? !0 : o, s = n.altAxis, a = s === void 0 ? !0 : s, l = n.fallbackPlacements, c = n.padding, u = n.boundary, f = n.rootBoundary, h = n.altBoundary, y = n.flipVariations, d = y === void 0 ? !0 : y, m = n.allowedAutoPlacements, w = t.options.placement, g = Dn(w), p = g === w, v = l || (p || !d ? [Ol(w)] : D2(w)), b = [w].concat(v).reduce(function(ne, ae) {
      return ne.concat(Dn(ae) === Hh ? F2(t, {
        placement: ae,
        boundary: u,
        rootBoundary: f,
        padding: c,
        flipVariations: d,
        allowedAutoPlacements: m
      }) : ae);
    }, []), C = t.rects.reference, E = t.rects.popper, R = /* @__PURE__ */ new Map(), T = !0, O = b[0], P = 0; P < b.length; P++) {
      var $ = b[P], B = Dn($), D = ki($) === wi, I = [jt, dn].indexOf(B) >= 0, M = I ? "width" : "height", A = ua(t, {
        placement: $,
        boundary: u,
        rootBoundary: f,
        altBoundary: h,
        padding: c
      }), j = I ? D ? fn : Wt : D ? dn : jt;
      C[M] > E[M] && (j = Ol(j));
      var _ = Ol(j), z = [];
      if (i && z.push(A[B] <= 0), a && z.push(A[j] <= 0, A[_] <= 0), z.every(function(ne) {
        return ne;
      })) {
        O = $, T = !1;
        break;
      }
      R.set($, z);
    }
    if (T)
      for (var F = d ? 3 : 1, Y = function(ae) {
        var le = b.find(function(X) {
          var H = R.get(X);
          if (H)
            return H.slice(0, ae).every(function(W) {
              return W;
            });
        });
        if (le)
          return O = le, "break";
      }, q = F; q > 0; q--) {
        var pe = Y(q);
        if (pe === "break")
          break;
      }
    t.placement !== O && (t.modifiersData[r]._skip = !0, t.placement = O, t.reset = !0);
  }
}
const B2 = {
  name: "flip",
  enabled: !0,
  phase: "main",
  fn: z2,
  requiresIfExists: ["offset"],
  data: {
    _skip: !1
  }
};
function Ev(e, t, n) {
  return n === void 0 && (n = {
    x: 0,
    y: 0
  }), {
    top: e.top - t.height - n.y,
    right: e.right - t.width + n.x,
    bottom: e.bottom - t.height + n.y,
    left: e.left - t.width - n.x
  };
}
function Rv(e) {
  return [jt, fn, dn, Wt].some(function(t) {
    return e[t] >= 0;
  });
}
function j2(e) {
  var t = e.state, n = e.name, r = t.rects.reference, o = t.rects.popper, i = t.modifiersData.preventOverflow, s = ua(t, {
    elementContext: "reference"
  }), a = ua(t, {
    altBoundary: !0
  }), l = Ev(s, r), c = Ev(a, o, i), u = Rv(l), f = Rv(c);
  t.modifiersData[n] = {
    referenceClippingOffsets: l,
    popperEscapeOffsets: c,
    isReferenceHidden: u,
    hasPopperEscaped: f
  }, t.attributes.popper = Object.assign({}, t.attributes.popper, {
    "data-popper-reference-hidden": u,
    "data-popper-escaped": f
  });
}
const W2 = {
  name: "hide",
  enabled: !0,
  phase: "main",
  requiresIfExists: ["preventOverflow"],
  fn: j2
};
function U2(e, t, n) {
  var r = Dn(e), o = [Wt, jt].indexOf(r) >= 0 ? -1 : 1, i = typeof n == "function" ? n(Object.assign({}, t, {
    placement: e
  })) : n, s = i[0], a = i[1];
  return s = s || 0, a = (a || 0) * o, [Wt, fn].indexOf(r) >= 0 ? {
    x: a,
    y: s
  } : {
    x: s,
    y: a
  };
}
function H2(e) {
  var t = e.state, n = e.options, r = e.name, o = n.offset, i = o === void 0 ? [0, 0] : o, s = $x.reduce(function(u, f) {
    return u[f] = U2(f, t.rects, i), u;
  }, {}), a = s[t.placement], l = a.x, c = a.y;
  t.modifiersData.popperOffsets != null && (t.modifiersData.popperOffsets.x += l, t.modifiersData.popperOffsets.y += c), t.modifiersData[r] = s;
}
const V2 = {
  name: "offset",
  enabled: !0,
  phase: "main",
  requires: ["popperOffsets"],
  fn: H2
};
function Y2(e) {
  var t = e.state, n = e.name;
  t.modifiersData[n] = Fx({
    reference: t.rects.reference,
    element: t.rects.popper,
    strategy: "absolute",
    placement: t.placement
  });
}
const X2 = {
  name: "popperOffsets",
  enabled: !0,
  phase: "read",
  fn: Y2,
  data: {}
};
function K2(e) {
  return e === "x" ? "y" : "x";
}
function q2(e) {
  var t = e.state, n = e.options, r = e.name, o = n.mainAxis, i = o === void 0 ? !0 : o, s = n.altAxis, a = s === void 0 ? !1 : s, l = n.boundary, c = n.rootBoundary, u = n.altBoundary, f = n.padding, h = n.tether, y = h === void 0 ? !0 : h, d = n.tetherOffset, m = d === void 0 ? 0 : d, w = ua(t, {
    boundary: l,
    rootBoundary: c,
    padding: f,
    altBoundary: u
  }), g = Dn(t.placement), p = ki(t.placement), v = !p, b = Xh(g), C = K2(b), E = t.modifiersData.popperOffsets, R = t.rects.reference, T = t.rects.popper, O = typeof m == "function" ? m(Object.assign({}, t.rects, {
    placement: t.placement
  })) : m, P = typeof O == "number" ? {
    mainAxis: O,
    altAxis: O
  } : Object.assign({
    mainAxis: 0,
    altAxis: 0
  }, O), $ = t.modifiersData.offset ? t.modifiersData.offset[t.placement] : null, B = {
    x: 0,
    y: 0
  };
  if (!!E) {
    if (i) {
      var D, I = b === "y" ? jt : Wt, M = b === "y" ? dn : fn, A = b === "y" ? "height" : "width", j = E[b], _ = j + w[I], z = j - w[M], F = y ? -T[A] / 2 : 0, Y = p === wi ? R[A] : T[A], q = p === wi ? -T[A] : -R[A], pe = t.elements.arrow, ne = y && pe ? Yh(pe) : {
        width: 0,
        height: 0
      }, ae = t.modifiersData["arrow#persistent"] ? t.modifiersData["arrow#persistent"].padding : Ix(), le = ae[I], X = ae[M], H = _s(0, R[A], ne[A]), W = v ? R[A] / 2 - F - H - le - P.mainAxis : Y - H - le - P.mainAxis, ce = v ? -R[A] / 2 + F + H + X + P.mainAxis : q + H + X + P.mainAxis, re = t.elements.arrow && $a(t.elements.arrow), ie = re ? b === "y" ? re.clientTop || 0 : re.clientLeft || 0 : 0, de = (D = $ == null ? void 0 : $[b]) != null ? D : 0, se = j + W - de - ie, oe = j + ce - de, ue = _s(y ? fc(_, se) : _, j, y ? vo(z, oe) : z);
      E[b] = ue, B[b] = ue - j;
    }
    if (a) {
      var ge, we = b === "x" ? jt : Wt, ot = b === "x" ? dn : fn, Oe = E[C], ye = C === "y" ? "height" : "width", Je = Oe + w[we], Ke = Oe - w[ot], Ze = [jt, Wt].indexOf(g) !== -1, Ye = (ge = $ == null ? void 0 : $[C]) != null ? ge : 0, bt = Ze ? Je : Oe - R[ye] - T[ye] - Ye + P.altAxis, Mt = Ze ? Oe + R[ye] + T[ye] - Ye - P.altAxis : Ke, K = y && Ze ? b2(bt, Oe, Mt) : _s(y ? bt : Je, Oe, y ? Mt : Ke);
      E[C] = K, B[C] = K - Oe;
    }
    t.modifiersData[r] = B;
  }
}
const G2 = {
  name: "preventOverflow",
  enabled: !0,
  phase: "main",
  fn: q2,
  requiresIfExists: ["offset"]
};
function Q2(e) {
  return {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  };
}
function J2(e) {
  return e === hn(e) || !ln(e) ? Kh(e) : Q2(e);
}
function Z2(e) {
  var t = e.getBoundingClientRect(), n = Si(t.width) / e.offsetWidth || 1, r = Si(t.height) / e.offsetHeight || 1;
  return n !== 1 || r !== 1;
}
function e$(e, t, n) {
  n === void 0 && (n = !1);
  var r = ln(t), o = ln(t) && Z2(t), i = Jr(t), s = Ci(e, o, n), a = {
    scrollLeft: 0,
    scrollTop: 0
  }, l = {
    x: 0,
    y: 0
  };
  return (r || !r && !n) && ((Un(t) !== "body" || Gh(i)) && (a = J2(t)), ln(t) ? (l = Ci(t, !0), l.x += t.clientLeft, l.y += t.clientTop) : i && (l.x = qh(i))), {
    x: s.left + a.scrollLeft - l.x,
    y: s.top + a.scrollTop - l.y,
    width: s.width,
    height: s.height
  };
}
function t$(e) {
  var t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set(), r = [];
  e.forEach(function(i) {
    t.set(i.name, i);
  });
  function o(i) {
    n.add(i.name);
    var s = [].concat(i.requires || [], i.requiresIfExists || []);
    s.forEach(function(a) {
      if (!n.has(a)) {
        var l = t.get(a);
        l && o(l);
      }
    }), r.push(i);
  }
  return e.forEach(function(i) {
    n.has(i.name) || o(i);
  }), r;
}
function n$(e) {
  var t = t$(e);
  return p2.reduce(function(n, r) {
    return n.concat(t.filter(function(o) {
      return o.phase === r;
    }));
  }, []);
}
function r$(e) {
  var t;
  return function() {
    return t || (t = new Promise(function(n) {
      Promise.resolve().then(function() {
        t = void 0, n(e());
      });
    })), t;
  };
}
function o$(e) {
  var t = e.reduce(function(n, r) {
    var o = n[r.name];
    return n[r.name] = o ? Object.assign({}, o, r, {
      options: Object.assign({}, o.options, r.options),
      data: Object.assign({}, o.data, r.data)
    }) : r, n;
  }, {});
  return Object.keys(t).map(function(n) {
    return t[n];
  });
}
var Tv = {
  placement: "bottom",
  modifiers: [],
  strategy: "absolute"
};
function Pv() {
  for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
    t[n] = arguments[n];
  return !t.some(function(r) {
    return !(r && typeof r.getBoundingClientRect == "function");
  });
}
function i$(e) {
  e === void 0 && (e = {});
  var t = e, n = t.defaultModifiers, r = n === void 0 ? [] : n, o = t.defaultOptions, i = o === void 0 ? Tv : o;
  return function(a, l, c) {
    c === void 0 && (c = i);
    var u = {
      placement: "bottom",
      orderedModifiers: [],
      options: Object.assign({}, Tv, i),
      modifiersData: {},
      elements: {
        reference: a,
        popper: l
      },
      attributes: {},
      styles: {}
    }, f = [], h = !1, y = {
      state: u,
      setOptions: function(g) {
        var p = typeof g == "function" ? g(u.options) : g;
        m(), u.options = Object.assign({}, i, u.options, p), u.scrollParents = {
          reference: Ro(a) ? Ms(a) : a.contextElement ? Ms(a.contextElement) : [],
          popper: Ms(l)
        };
        var v = n$(o$([].concat(r, u.options.modifiers)));
        return u.orderedModifiers = v.filter(function(b) {
          return b.enabled;
        }), d(), y.update();
      },
      forceUpdate: function() {
        if (!h) {
          var g = u.elements, p = g.reference, v = g.popper;
          if (!!Pv(p, v)) {
            u.rects = {
              reference: e$(p, $a(v), u.options.strategy === "fixed"),
              popper: Yh(v)
            }, u.reset = !1, u.placement = u.options.placement, u.orderedModifiers.forEach(function(P) {
              return u.modifiersData[P.name] = Object.assign({}, P.data);
            });
            for (var b = 0; b < u.orderedModifiers.length; b++) {
              if (u.reset === !0) {
                u.reset = !1, b = -1;
                continue;
              }
              var C = u.orderedModifiers[b], E = C.fn, R = C.options, T = R === void 0 ? {} : R, O = C.name;
              typeof E == "function" && (u = E({
                state: u,
                options: T,
                name: O,
                instance: y
              }) || u);
            }
          }
        }
      },
      update: r$(function() {
        return new Promise(function(w) {
          y.forceUpdate(), w(u);
        });
      }),
      destroy: function() {
        m(), h = !0;
      }
    };
    if (!Pv(a, l))
      return y;
    y.setOptions(c).then(function(w) {
      !h && c.onFirstUpdate && c.onFirstUpdate(w);
    });
    function d() {
      u.orderedModifiers.forEach(function(w) {
        var g = w.name, p = w.options, v = p === void 0 ? {} : p, b = w.effect;
        if (typeof b == "function") {
          var C = b({
            state: u,
            name: g,
            instance: y,
            options: v
          }), E = function() {
          };
          f.push(C || E);
        }
      });
    }
    function m() {
      f.forEach(function(w) {
        return w();
      }), f = [];
    }
    return y;
  };
}
var s$ = [O2, X2, T2, g2, V2, B2, G2, C2, W2], a$ = /* @__PURE__ */ i$({
  defaultModifiers: s$
});
function l$(e) {
  return typeof e == "function" ? e() : e;
}
const c$ = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const {
    children: r,
    container: o,
    disablePortal: i = !1
  } = t, [s, a] = x.exports.useState(null), l = Qe(/* @__PURE__ */ x.exports.isValidElement(r) ? r.ref : null, n);
  return jn(() => {
    i || a(l$(o) || document.body);
  }, [o, i]), jn(() => {
    if (s && !i)
      return Df(n, s), () => {
        Df(n, null);
      };
  }, [n, s, i]), i ? /* @__PURE__ */ x.exports.isValidElement(r) ? /* @__PURE__ */ x.exports.cloneElement(r, {
    ref: l
  }) : r : /* @__PURE__ */ S(x.exports.Fragment, {
    children: s && /* @__PURE__ */ Pi.exports.createPortal(r, s)
  });
}), Dx = c$;
function u$(e) {
  return he("MuiPopperUnstyled", e);
}
fe("MuiPopperUnstyled", ["root"]);
const d$ = ["anchorEl", "children", "component", "direction", "disablePortal", "modifiers", "open", "ownerState", "placement", "popperOptions", "popperRef", "slotProps", "slots", "TransitionProps"], f$ = ["anchorEl", "children", "container", "direction", "disablePortal", "keepMounted", "modifiers", "open", "placement", "popperOptions", "popperRef", "style", "transition"];
function p$(e, t) {
  if (t === "ltr")
    return e;
  switch (e) {
    case "bottom-end":
      return "bottom-start";
    case "bottom-start":
      return "bottom-end";
    case "top-end":
      return "top-start";
    case "top-start":
      return "top-end";
    default:
      return e;
  }
}
function Hf(e) {
  return typeof e == "function" ? e() : e;
}
const h$ = () => me({
  root: ["root"]
}, u$, {}), m$ = {}, g$ = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r;
  const {
    anchorEl: o,
    children: i,
    component: s,
    direction: a,
    disablePortal: l,
    modifiers: c,
    open: u,
    ownerState: f,
    placement: h,
    popperOptions: y,
    popperRef: d,
    slotProps: m = {},
    slots: w = {},
    TransitionProps: g
  } = t, p = Q(t, d$), v = x.exports.useRef(null), b = Qe(v, n), C = x.exports.useRef(null), E = Qe(C, d), R = x.exports.useRef(E);
  jn(() => {
    R.current = E;
  }, [E]), x.exports.useImperativeHandle(d, () => C.current, []);
  const T = p$(h, a), [O, P] = x.exports.useState(T);
  x.exports.useEffect(() => {
    C.current && C.current.forceUpdate();
  }), jn(() => {
    if (!o || !u)
      return;
    const M = (_) => {
      P(_.placement);
    };
    Hf(o);
    let A = [{
      name: "preventOverflow",
      options: {
        altBoundary: l
      }
    }, {
      name: "flip",
      options: {
        altBoundary: l
      }
    }, {
      name: "onUpdate",
      enabled: !0,
      phase: "afterWrite",
      fn: ({
        state: _
      }) => {
        M(_);
      }
    }];
    c != null && (A = A.concat(c)), y && y.modifiers != null && (A = A.concat(y.modifiers));
    const j = a$(Hf(o), v.current, k({
      placement: T
    }, y, {
      modifiers: A
    }));
    return R.current(j), () => {
      j.destroy(), R.current(null);
    };
  }, [o, l, c, u, y, T]);
  const $ = {
    placement: O
  };
  g !== null && ($.TransitionProps = g);
  const B = h$(), D = (r = s != null ? s : w.root) != null ? r : "div", I = la({
    elementType: D,
    externalSlotProps: m.root,
    externalForwardedProps: p,
    additionalProps: {
      role: "tooltip",
      ref: b
    },
    ownerState: k({}, t, f),
    className: B.root
  });
  return /* @__PURE__ */ S(D, k({}, I, {
    children: typeof i == "function" ? i($) : i
  }));
}), v$ = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const {
    anchorEl: r,
    children: o,
    container: i,
    direction: s = "ltr",
    disablePortal: a = !1,
    keepMounted: l = !1,
    modifiers: c,
    open: u,
    placement: f = "bottom",
    popperOptions: h = m$,
    popperRef: y,
    style: d,
    transition: m = !1
  } = t, w = Q(t, f$), [g, p] = x.exports.useState(!0), v = () => {
    p(!1);
  }, b = () => {
    p(!0);
  };
  if (!l && !u && (!m || g))
    return null;
  const C = i || (r ? mt(Hf(r)).body : void 0);
  return /* @__PURE__ */ S(Dx, {
    disablePortal: a,
    container: C,
    children: /* @__PURE__ */ S(g$, k({
      anchorEl: r,
      direction: s,
      disablePortal: a,
      modifiers: c,
      ref: n,
      open: m ? !g : u,
      placement: f,
      popperOptions: h,
      popperRef: y
    }, w, {
      style: k({
        position: "fixed",
        top: 0,
        left: 0,
        display: !u && l && (!m || g) ? "none" : null
      }, d),
      TransitionProps: m ? {
        in: u,
        onEnter: v,
        onExited: b
      } : null,
      children: o
    }))
  });
}), y$ = v$;
function b$(e) {
  const t = mt(e);
  return t.body === e ? ko(e).innerWidth > t.documentElement.clientWidth : e.scrollHeight > e.clientHeight;
}
function Is(e, t) {
  t ? e.setAttribute("aria-hidden", "true") : e.removeAttribute("aria-hidden");
}
function Ov(e) {
  return parseInt(ko(e).getComputedStyle(e).paddingRight, 10) || 0;
}
function x$(e) {
  const n = ["TEMPLATE", "SCRIPT", "STYLE", "LINK", "MAP", "META", "NOSCRIPT", "PICTURE", "COL", "COLGROUP", "PARAM", "SLOT", "SOURCE", "TRACK"].indexOf(e.tagName) !== -1, r = e.tagName === "INPUT" && e.getAttribute("type") === "hidden";
  return n || r;
}
function $v(e, t, n, r, o) {
  const i = [t, n, ...r];
  [].forEach.call(e.children, (s) => {
    const a = i.indexOf(s) === -1, l = !x$(s);
    a && l && Is(s, o);
  });
}
function bd(e, t) {
  let n = -1;
  return e.some((r, o) => t(r) ? (n = o, !0) : !1), n;
}
function w$(e, t) {
  const n = [], r = e.container;
  if (!t.disableScrollLock) {
    if (b$(r)) {
      const s = ix(mt(r));
      n.push({
        value: r.style.paddingRight,
        property: "padding-right",
        el: r
      }), r.style.paddingRight = `${Ov(r) + s}px`;
      const a = mt(r).querySelectorAll(".mui-fixed");
      [].forEach.call(a, (l) => {
        n.push({
          value: l.style.paddingRight,
          property: "padding-right",
          el: l
        }), l.style.paddingRight = `${Ov(l) + s}px`;
      });
    }
    let i;
    if (r.parentNode instanceof DocumentFragment)
      i = mt(r).body;
    else {
      const s = r.parentElement, a = ko(r);
      i = (s == null ? void 0 : s.nodeName) === "HTML" && a.getComputedStyle(s).overflowY === "scroll" ? s : r;
    }
    n.push({
      value: i.style.overflow,
      property: "overflow",
      el: i
    }, {
      value: i.style.overflowX,
      property: "overflow-x",
      el: i
    }, {
      value: i.style.overflowY,
      property: "overflow-y",
      el: i
    }), i.style.overflow = "hidden";
  }
  return () => {
    n.forEach(({
      value: i,
      el: s,
      property: a
    }) => {
      i ? s.style.setProperty(a, i) : s.style.removeProperty(a);
    });
  };
}
function S$(e) {
  const t = [];
  return [].forEach.call(e.children, (n) => {
    n.getAttribute("aria-hidden") === "true" && t.push(n);
  }), t;
}
class C$ {
  constructor() {
    this.containers = void 0, this.modals = void 0, this.modals = [], this.containers = [];
  }
  add(t, n) {
    let r = this.modals.indexOf(t);
    if (r !== -1)
      return r;
    r = this.modals.length, this.modals.push(t), t.modalRef && Is(t.modalRef, !1);
    const o = S$(n);
    $v(n, t.mount, t.modalRef, o, !0);
    const i = bd(this.containers, (s) => s.container === n);
    return i !== -1 ? (this.containers[i].modals.push(t), r) : (this.containers.push({
      modals: [t],
      container: n,
      restore: null,
      hiddenSiblings: o
    }), r);
  }
  mount(t, n) {
    const r = bd(this.containers, (i) => i.modals.indexOf(t) !== -1), o = this.containers[r];
    o.restore || (o.restore = w$(o, n));
  }
  remove(t, n = !0) {
    const r = this.modals.indexOf(t);
    if (r === -1)
      return r;
    const o = bd(this.containers, (s) => s.modals.indexOf(t) !== -1), i = this.containers[o];
    if (i.modals.splice(i.modals.indexOf(t), 1), this.modals.splice(r, 1), i.modals.length === 0)
      i.restore && i.restore(), t.modalRef && Is(t.modalRef, n), $v(i.container, t.mount, t.modalRef, i.hiddenSiblings, !1), this.containers.splice(o, 1);
    else {
      const s = i.modals[i.modals.length - 1];
      s.modalRef && Is(s.modalRef, !1);
    }
    return r;
  }
  isTopModal(t) {
    return this.modals.length > 0 && this.modals[this.modals.length - 1] === t;
  }
}
function k$(e) {
  return he("MuiModal", e);
}
fe("MuiModal", ["root", "hidden"]);
const E$ = ["children", "classes", "closeAfterTransition", "component", "container", "disableAutoFocus", "disableEnforceFocus", "disableEscapeKeyDown", "disablePortal", "disableRestoreFocus", "disableScrollLock", "hideBackdrop", "keepMounted", "manager", "onBackdropClick", "onClose", "onKeyDown", "open", "onTransitionEnter", "onTransitionExited", "slotProps", "slots"], R$ = (e) => {
  const {
    open: t,
    exited: n,
    classes: r
  } = e;
  return me({
    root: ["root", !t && n && "hidden"]
  }, k$, r);
};
function T$(e) {
  return typeof e == "function" ? e() : e;
}
function P$(e) {
  return e.children ? e.children.props.hasOwnProperty("in") : !1;
}
const O$ = new C$(), $$ = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r, o;
  const {
    children: i,
    classes: s,
    closeAfterTransition: a = !1,
    component: l,
    container: c,
    disableAutoFocus: u = !1,
    disableEnforceFocus: f = !1,
    disableEscapeKeyDown: h = !1,
    disablePortal: y = !1,
    disableRestoreFocus: d = !1,
    disableScrollLock: m = !1,
    hideBackdrop: w = !1,
    keepMounted: g = !1,
    manager: p = O$,
    onBackdropClick: v,
    onClose: b,
    onKeyDown: C,
    open: E,
    onTransitionEnter: R,
    onTransitionExited: T,
    slotProps: O = {},
    slots: P = {}
  } = t, $ = Q(t, E$), [B, D] = x.exports.useState(!0), I = x.exports.useRef({}), M = x.exports.useRef(null), A = x.exports.useRef(null), j = Qe(A, n), _ = P$(t), z = (r = t["aria-hidden"]) != null ? r : !0, F = () => mt(M.current), Y = () => (I.current.modalRef = A.current, I.current.mountNode = M.current, I.current), q = () => {
    p.mount(Y(), {
      disableScrollLock: m
    }), A.current.scrollTop = 0;
  }, pe = In(() => {
    const we = T$(c) || F().body;
    p.add(Y(), we), A.current && q();
  }), ne = x.exports.useCallback(() => p.isTopModal(Y()), [p]), ae = In((we) => {
    M.current = we, we && (E && ne() ? q() : Is(A.current, z));
  }), le = x.exports.useCallback(() => {
    p.remove(Y(), z);
  }, [p, z]);
  x.exports.useEffect(() => () => {
    le();
  }, [le]), x.exports.useEffect(() => {
    E ? pe() : (!_ || !a) && le();
  }, [E, le, _, a, pe]);
  const X = k({}, t, {
    classes: s,
    closeAfterTransition: a,
    disableAutoFocus: u,
    disableEnforceFocus: f,
    disableEscapeKeyDown: h,
    disablePortal: y,
    disableRestoreFocus: d,
    disableScrollLock: m,
    exited: B,
    hideBackdrop: w,
    keepMounted: g
  }), H = R$(X), W = () => {
    D(!1), R && R();
  }, ce = () => {
    D(!0), T && T(), a && le();
  }, re = (we) => {
    we.target === we.currentTarget && (v && v(we), b && b(we, "backdropClick"));
  }, ie = (we) => {
    C && C(we), !(we.key !== "Escape" || !ne()) && (h || (we.stopPropagation(), b && b(we, "escapeKeyDown")));
  }, de = {};
  i.props.tabIndex === void 0 && (de.tabIndex = "-1"), _ && (de.onEnter = lv(W, i.props.onEnter), de.onExited = lv(ce, i.props.onExited));
  const se = (o = l != null ? l : P.root) != null ? o : "div", oe = la({
    elementType: se,
    externalSlotProps: O.root,
    externalForwardedProps: $,
    additionalProps: {
      ref: j,
      role: "presentation",
      onKeyDown: ie
    },
    className: H.root,
    ownerState: X
  }), ue = P.backdrop, ge = la({
    elementType: ue,
    externalSlotProps: O.backdrop,
    additionalProps: {
      "aria-hidden": !0,
      onClick: re,
      open: E
    },
    className: H.backdrop,
    ownerState: X
  });
  return !g && !E && (!_ || B) ? null : /* @__PURE__ */ S(Dx, {
    ref: ae,
    container: c,
    disablePortal: y,
    children: /* @__PURE__ */ G(se, k({}, oe, {
      children: [!w && ue ? /* @__PURE__ */ S(ue, k({}, ge)) : null, /* @__PURE__ */ S(t2, {
        disableEnforceFocus: f,
        disableAutoFocus: u,
        disableRestoreFocus: d,
        isEnabled: ne,
        open: E,
        children: /* @__PURE__ */ x.exports.cloneElement(i, de)
      })]
    }))
  });
}), _$ = $$, M$ = ["onChange", "maxRows", "minRows", "style", "value"];
function nl(e, t) {
  return parseInt(e[t], 10) || 0;
}
const I$ = {
  shadow: {
    visibility: "hidden",
    position: "absolute",
    overflow: "hidden",
    height: 0,
    top: 0,
    left: 0,
    transform: "translateZ(0)"
  }
};
function _v(e) {
  return e == null || Object.keys(e).length === 0;
}
const A$ = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const {
    onChange: r,
    maxRows: o,
    minRows: i = 1,
    style: s,
    value: a
  } = t, l = Q(t, M$), {
    current: c
  } = x.exports.useRef(a != null), u = x.exports.useRef(null), f = Qe(n, u), h = x.exports.useRef(null), y = x.exports.useRef(0), [d, m] = x.exports.useState({}), w = x.exports.useCallback(() => {
    const C = u.current, R = ko(C).getComputedStyle(C);
    if (R.width === "0px")
      return {};
    const T = h.current;
    T.style.width = R.width, T.value = C.value || t.placeholder || "x", T.value.slice(-1) === `
` && (T.value += " ");
    const O = R["box-sizing"], P = nl(R, "padding-bottom") + nl(R, "padding-top"), $ = nl(R, "border-bottom-width") + nl(R, "border-top-width"), B = T.scrollHeight;
    T.value = "x";
    const D = T.scrollHeight;
    let I = B;
    i && (I = Math.max(Number(i) * D, I)), o && (I = Math.min(Number(o) * D, I)), I = Math.max(I, D);
    const M = I + (O === "border-box" ? P + $ : 0), A = Math.abs(I - B) <= 1;
    return {
      outerHeightStyle: M,
      overflow: A
    };
  }, [o, i, t.placeholder]), g = (C, E) => {
    const {
      outerHeightStyle: R,
      overflow: T
    } = E;
    return y.current < 20 && (R > 0 && Math.abs((C.outerHeightStyle || 0) - R) > 1 || C.overflow !== T) ? (y.current += 1, {
      overflow: T,
      outerHeightStyle: R
    }) : C;
  }, p = x.exports.useCallback(() => {
    const C = w();
    _v(C) || m((E) => g(E, C));
  }, [w]), v = () => {
    const C = w();
    _v(C) || Pi.exports.flushSync(() => {
      m((E) => g(E, C));
    });
  };
  x.exports.useEffect(() => {
    const C = ox(() => {
      y.current = 0, u.current && v();
    }), E = ko(u.current);
    E.addEventListener("resize", C);
    let R;
    return typeof ResizeObserver < "u" && (R = new ResizeObserver(C), R.observe(u.current)), () => {
      C.clear(), E.removeEventListener("resize", C), R && R.disconnect();
    };
  }), jn(() => {
    p();
  }), x.exports.useEffect(() => {
    y.current = 0;
  }, [a]);
  const b = (C) => {
    y.current = 0, c || p(), r && r(C);
  };
  return /* @__PURE__ */ G(x.exports.Fragment, {
    children: [/* @__PURE__ */ S("textarea", k({
      value: a,
      onChange: b,
      ref: f,
      rows: i,
      style: k({
        height: d.outerHeightStyle,
        overflow: d.overflow ? "hidden" : null
      }, s)
    }, l)), /* @__PURE__ */ S("textarea", {
      "aria-hidden": !0,
      className: t.className,
      readOnly: !0,
      ref: h,
      tabIndex: -1,
      style: k({}, I$.shadow, s, {
        padding: 0
      })
    })]
  });
}), N$ = A$;
function L$(e, t) {
  return k({
    toolbar: {
      minHeight: 56,
      [e.up("xs")]: {
        "@media (orientation: landscape)": {
          minHeight: 48
        }
      },
      [e.up("sm")]: {
        minHeight: 64
      }
    }
  }, t);
}
const F$ = {
  black: "#000",
  white: "#fff"
}, da = F$, D$ = {
  50: "#fafafa",
  100: "#f5f5f5",
  200: "#eeeeee",
  300: "#e0e0e0",
  400: "#bdbdbd",
  500: "#9e9e9e",
  600: "#757575",
  700: "#616161",
  800: "#424242",
  900: "#212121",
  A100: "#f5f5f5",
  A200: "#eeeeee",
  A400: "#bdbdbd",
  A700: "#616161"
}, z$ = D$, B$ = {
  50: "#f3e5f5",
  100: "#e1bee7",
  200: "#ce93d8",
  300: "#ba68c8",
  400: "#ab47bc",
  500: "#9c27b0",
  600: "#8e24aa",
  700: "#7b1fa2",
  800: "#6a1b9a",
  900: "#4a148c",
  A100: "#ea80fc",
  A200: "#e040fb",
  A400: "#d500f9",
  A700: "#aa00ff"
}, Ao = B$, j$ = {
  50: "#ffebee",
  100: "#ffcdd2",
  200: "#ef9a9a",
  300: "#e57373",
  400: "#ef5350",
  500: "#f44336",
  600: "#e53935",
  700: "#d32f2f",
  800: "#c62828",
  900: "#b71c1c",
  A100: "#ff8a80",
  A200: "#ff5252",
  A400: "#ff1744",
  A700: "#d50000"
}, No = j$, W$ = {
  50: "#fff3e0",
  100: "#ffe0b2",
  200: "#ffcc80",
  300: "#ffb74d",
  400: "#ffa726",
  500: "#ff9800",
  600: "#fb8c00",
  700: "#f57c00",
  800: "#ef6c00",
  900: "#e65100",
  A100: "#ffd180",
  A200: "#ffab40",
  A400: "#ff9100",
  A700: "#ff6d00"
}, ts = W$, U$ = {
  50: "#e3f2fd",
  100: "#bbdefb",
  200: "#90caf9",
  300: "#64b5f6",
  400: "#42a5f5",
  500: "#2196f3",
  600: "#1e88e5",
  700: "#1976d2",
  800: "#1565c0",
  900: "#0d47a1",
  A100: "#82b1ff",
  A200: "#448aff",
  A400: "#2979ff",
  A700: "#2962ff"
}, Lo = U$, H$ = {
  50: "#e1f5fe",
  100: "#b3e5fc",
  200: "#81d4fa",
  300: "#4fc3f7",
  400: "#29b6f6",
  500: "#03a9f4",
  600: "#039be5",
  700: "#0288d1",
  800: "#0277bd",
  900: "#01579b",
  A100: "#80d8ff",
  A200: "#40c4ff",
  A400: "#00b0ff",
  A700: "#0091ea"
}, Fo = H$, V$ = {
  50: "#e8f5e9",
  100: "#c8e6c9",
  200: "#a5d6a7",
  300: "#81c784",
  400: "#66bb6a",
  500: "#4caf50",
  600: "#43a047",
  700: "#388e3c",
  800: "#2e7d32",
  900: "#1b5e20",
  A100: "#b9f6ca",
  A200: "#69f0ae",
  A400: "#00e676",
  A700: "#00c853"
}, Do = V$, Y$ = ["mode", "contrastThreshold", "tonalOffset"], Mv = {
  text: {
    primary: "rgba(0, 0, 0, 0.87)",
    secondary: "rgba(0, 0, 0, 0.6)",
    disabled: "rgba(0, 0, 0, 0.38)"
  },
  divider: "rgba(0, 0, 0, 0.12)",
  background: {
    paper: da.white,
    default: da.white
  },
  action: {
    active: "rgba(0, 0, 0, 0.54)",
    hover: "rgba(0, 0, 0, 0.04)",
    hoverOpacity: 0.04,
    selected: "rgba(0, 0, 0, 0.08)",
    selectedOpacity: 0.08,
    disabled: "rgba(0, 0, 0, 0.26)",
    disabledBackground: "rgba(0, 0, 0, 0.12)",
    disabledOpacity: 0.38,
    focus: "rgba(0, 0, 0, 0.12)",
    focusOpacity: 0.12,
    activatedOpacity: 0.12
  }
}, xd = {
  text: {
    primary: da.white,
    secondary: "rgba(255, 255, 255, 0.7)",
    disabled: "rgba(255, 255, 255, 0.5)",
    icon: "rgba(255, 255, 255, 0.5)"
  },
  divider: "rgba(255, 255, 255, 0.12)",
  background: {
    paper: "#121212",
    default: "#121212"
  },
  action: {
    active: da.white,
    hover: "rgba(255, 255, 255, 0.08)",
    hoverOpacity: 0.08,
    selected: "rgba(255, 255, 255, 0.16)",
    selectedOpacity: 0.16,
    disabled: "rgba(255, 255, 255, 0.3)",
    disabledBackground: "rgba(255, 255, 255, 0.12)",
    disabledOpacity: 0.38,
    focus: "rgba(255, 255, 255, 0.12)",
    focusOpacity: 0.12,
    activatedOpacity: 0.24
  }
};
function Iv(e, t, n, r) {
  const o = r.light || r, i = r.dark || r * 1.5;
  e[t] || (e.hasOwnProperty(n) ? e[t] = e[n] : t === "light" ? e.light = sa(e.main, o) : t === "dark" && (e.dark = ia(e.main, i)));
}
function X$(e = "light") {
  return e === "dark" ? {
    main: Lo[200],
    light: Lo[50],
    dark: Lo[400]
  } : {
    main: Lo[700],
    light: Lo[400],
    dark: Lo[800]
  };
}
function K$(e = "light") {
  return e === "dark" ? {
    main: Ao[200],
    light: Ao[50],
    dark: Ao[400]
  } : {
    main: Ao[500],
    light: Ao[300],
    dark: Ao[700]
  };
}
function q$(e = "light") {
  return e === "dark" ? {
    main: No[500],
    light: No[300],
    dark: No[700]
  } : {
    main: No[700],
    light: No[400],
    dark: No[800]
  };
}
function G$(e = "light") {
  return e === "dark" ? {
    main: Fo[400],
    light: Fo[300],
    dark: Fo[700]
  } : {
    main: Fo[700],
    light: Fo[500],
    dark: Fo[900]
  };
}
function Q$(e = "light") {
  return e === "dark" ? {
    main: Do[400],
    light: Do[300],
    dark: Do[700]
  } : {
    main: Do[800],
    light: Do[500],
    dark: Do[900]
  };
}
function J$(e = "light") {
  return e === "dark" ? {
    main: ts[400],
    light: ts[300],
    dark: ts[700]
  } : {
    main: "#ed6c02",
    light: ts[500],
    dark: ts[900]
  };
}
function Z$(e) {
  const {
    mode: t = "light",
    contrastThreshold: n = 3,
    tonalOffset: r = 0.2
  } = e, o = Q(e, Y$), i = e.primary || X$(t), s = e.secondary || K$(t), a = e.error || q$(t), l = e.info || G$(t), c = e.success || Q$(t), u = e.warning || J$(t);
  function f(m) {
    return IO(m, xd.text.primary) >= n ? xd.text.primary : Mv.text.primary;
  }
  const h = ({
    color: m,
    name: w,
    mainShade: g = 500,
    lightShade: p = 300,
    darkShade: v = 700
  }) => {
    if (m = k({}, m), !m.main && m[g] && (m.main = m[g]), !m.hasOwnProperty("main"))
      throw new Error(Vr(11, w ? ` (${w})` : "", g));
    if (typeof m.main != "string")
      throw new Error(Vr(12, w ? ` (${w})` : "", JSON.stringify(m.main)));
    return Iv(m, "light", p, r), Iv(m, "dark", v, r), m.contrastText || (m.contrastText = f(m.main)), m;
  }, y = {
    dark: xd,
    light: Mv
  };
  return Bt(k({
    common: k({}, da),
    mode: t,
    primary: h({
      color: i,
      name: "primary"
    }),
    secondary: h({
      color: s,
      name: "secondary",
      mainShade: "A400",
      lightShade: "A200",
      darkShade: "A700"
    }),
    error: h({
      color: a,
      name: "error"
    }),
    warning: h({
      color: u,
      name: "warning"
    }),
    info: h({
      color: l,
      name: "info"
    }),
    success: h({
      color: c,
      name: "success"
    }),
    grey: z$,
    contrastThreshold: n,
    getContrastText: f,
    augmentColor: h,
    tonalOffset: r
  }, y[t]), o);
}
const e_ = ["fontFamily", "fontSize", "fontWeightLight", "fontWeightRegular", "fontWeightMedium", "fontWeightBold", "htmlFontSize", "allVariants", "pxToRem"];
function t_(e) {
  return Math.round(e * 1e5) / 1e5;
}
const Av = {
  textTransform: "uppercase"
}, Nv = '"Roboto", "Helvetica", "Arial", sans-serif';
function n_(e, t) {
  const n = typeof t == "function" ? t(e) : t, {
    fontFamily: r = Nv,
    fontSize: o = 14,
    fontWeightLight: i = 300,
    fontWeightRegular: s = 400,
    fontWeightMedium: a = 500,
    fontWeightBold: l = 700,
    htmlFontSize: c = 16,
    allVariants: u,
    pxToRem: f
  } = n, h = Q(n, e_), y = o / 14, d = f || ((g) => `${g / c * y}rem`), m = (g, p, v, b, C) => k({
    fontFamily: r,
    fontWeight: g,
    fontSize: d(p),
    lineHeight: v
  }, r === Nv ? {
    letterSpacing: `${t_(b / p)}em`
  } : {}, C, u), w = {
    h1: m(i, 96, 1.167, -1.5),
    h2: m(i, 60, 1.2, -0.5),
    h3: m(s, 48, 1.167, 0),
    h4: m(s, 34, 1.235, 0.25),
    h5: m(s, 24, 1.334, 0),
    h6: m(a, 20, 1.6, 0.15),
    subtitle1: m(s, 16, 1.75, 0.15),
    subtitle2: m(a, 14, 1.57, 0.1),
    body1: m(s, 16, 1.5, 0.15),
    body2: m(s, 14, 1.43, 0.15),
    button: m(a, 14, 1.75, 0.4, Av),
    caption: m(s, 12, 1.66, 0.4),
    overline: m(s, 12, 2.66, 1, Av)
  };
  return Bt(k({
    htmlFontSize: c,
    pxToRem: d,
    fontFamily: r,
    fontSize: o,
    fontWeightLight: i,
    fontWeightRegular: s,
    fontWeightMedium: a,
    fontWeightBold: l
  }, w), h, {
    clone: !1
  });
}
const r_ = 0.2, o_ = 0.14, i_ = 0.12;
function ze(...e) {
  return [`${e[0]}px ${e[1]}px ${e[2]}px ${e[3]}px rgba(0,0,0,${r_})`, `${e[4]}px ${e[5]}px ${e[6]}px ${e[7]}px rgba(0,0,0,${o_})`, `${e[8]}px ${e[9]}px ${e[10]}px ${e[11]}px rgba(0,0,0,${i_})`].join(",");
}
const s_ = ["none", ze(0, 2, 1, -1, 0, 1, 1, 0, 0, 1, 3, 0), ze(0, 3, 1, -2, 0, 2, 2, 0, 0, 1, 5, 0), ze(0, 3, 3, -2, 0, 3, 4, 0, 0, 1, 8, 0), ze(0, 2, 4, -1, 0, 4, 5, 0, 0, 1, 10, 0), ze(0, 3, 5, -1, 0, 5, 8, 0, 0, 1, 14, 0), ze(0, 3, 5, -1, 0, 6, 10, 0, 0, 1, 18, 0), ze(0, 4, 5, -2, 0, 7, 10, 1, 0, 2, 16, 1), ze(0, 5, 5, -3, 0, 8, 10, 1, 0, 3, 14, 2), ze(0, 5, 6, -3, 0, 9, 12, 1, 0, 3, 16, 2), ze(0, 6, 6, -3, 0, 10, 14, 1, 0, 4, 18, 3), ze(0, 6, 7, -4, 0, 11, 15, 1, 0, 4, 20, 3), ze(0, 7, 8, -4, 0, 12, 17, 2, 0, 5, 22, 4), ze(0, 7, 8, -4, 0, 13, 19, 2, 0, 5, 24, 4), ze(0, 7, 9, -4, 0, 14, 21, 2, 0, 5, 26, 4), ze(0, 8, 9, -5, 0, 15, 22, 2, 0, 6, 28, 5), ze(0, 8, 10, -5, 0, 16, 24, 2, 0, 6, 30, 5), ze(0, 8, 11, -5, 0, 17, 26, 2, 0, 6, 32, 5), ze(0, 9, 11, -5, 0, 18, 28, 2, 0, 7, 34, 6), ze(0, 9, 12, -6, 0, 19, 29, 2, 0, 7, 36, 6), ze(0, 10, 13, -6, 0, 20, 31, 3, 0, 8, 38, 7), ze(0, 10, 13, -6, 0, 21, 33, 3, 0, 8, 40, 7), ze(0, 10, 14, -6, 0, 22, 35, 3, 0, 8, 42, 7), ze(0, 11, 14, -7, 0, 23, 36, 3, 0, 9, 44, 8), ze(0, 11, 15, -7, 0, 24, 38, 3, 0, 9, 46, 8)], a_ = s_, l_ = ["duration", "easing", "delay"], c_ = {
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)"
}, u_ = {
  shortest: 150,
  shorter: 200,
  short: 250,
  standard: 300,
  complex: 375,
  enteringScreen: 225,
  leavingScreen: 195
};
function Lv(e) {
  return `${Math.round(e)}ms`;
}
function d_(e) {
  if (!e)
    return 0;
  const t = e / 36;
  return Math.round((4 + 15 * t ** 0.25 + t / 5) * 10);
}
function f_(e) {
  const t = k({}, c_, e.easing), n = k({}, u_, e.duration);
  return k({
    getAutoHeightDuration: d_,
    create: (o = ["all"], i = {}) => {
      const {
        duration: s = n.standard,
        easing: a = t.easeInOut,
        delay: l = 0
      } = i;
      return Q(i, l_), (Array.isArray(o) ? o : [o]).map((c) => `${c} ${typeof s == "string" ? s : Lv(s)} ${a} ${typeof l == "string" ? l : Lv(l)}`).join(",");
    }
  }, e, {
    easing: t,
    duration: n
  });
}
const p_ = {
  mobileStepper: 1e3,
  fab: 1050,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500
}, h_ = p_, m_ = ["breakpoints", "mixins", "spacing", "palette", "transitions", "typography", "shape"];
function zx(e = {}, ...t) {
  const {
    mixins: n = {},
    palette: r = {},
    transitions: o = {},
    typography: i = {}
  } = e, s = Q(e, m_);
  if (e.vars)
    throw new Error(Vr(18));
  const a = Z$(r), l = Bh(e);
  let c = Bt(l, {
    mixins: L$(l.breakpoints, n),
    palette: a,
    shadows: a_.slice(),
    typography: n_(a, i),
    transitions: f_(o),
    zIndex: k({}, h_)
  });
  return c = Bt(c, s), c = t.reduce((u, f) => Bt(u, f), c), c;
}
const g_ = zx(), bu = g_, Tn = (e) => $s(e) && e !== "classes", Bx = $s, v_ = OO({
  defaultTheme: bu,
  rootShouldForwardProp: Tn
}), U = v_;
function ve({
  props: e,
  name: t
}) {
  return $O({
    props: e,
    name: t,
    defaultTheme: bu
  });
}
function y_(e) {
  return he("MuiSvgIcon", e);
}
fe("MuiSvgIcon", ["root", "colorPrimary", "colorSecondary", "colorAction", "colorError", "colorDisabled", "fontSizeInherit", "fontSizeSmall", "fontSizeMedium", "fontSizeLarge"]);
const b_ = ["children", "className", "color", "component", "fontSize", "htmlColor", "inheritViewBox", "titleAccess", "viewBox"], x_ = (e) => {
  const {
    color: t,
    fontSize: n,
    classes: r
  } = e, o = {
    root: ["root", t !== "inherit" && `color${N(t)}`, `fontSize${N(n)}`]
  };
  return me(o, y_, r);
}, w_ = U("svg", {
  name: "MuiSvgIcon",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, n.color !== "inherit" && t[`color${N(n.color)}`], t[`fontSize${N(n.fontSize)}`]];
  }
})(({
  theme: e,
  ownerState: t
}) => {
  var n, r, o, i, s, a, l, c, u, f, h, y, d, m, w, g, p;
  return {
    userSelect: "none",
    width: "1em",
    height: "1em",
    display: "inline-block",
    fill: "currentColor",
    flexShrink: 0,
    transition: (n = e.transitions) == null || (r = n.create) == null ? void 0 : r.call(n, "fill", {
      duration: (o = e.transitions) == null || (i = o.duration) == null ? void 0 : i.shorter
    }),
    fontSize: {
      inherit: "inherit",
      small: ((s = e.typography) == null || (a = s.pxToRem) == null ? void 0 : a.call(s, 20)) || "1.25rem",
      medium: ((l = e.typography) == null || (c = l.pxToRem) == null ? void 0 : c.call(l, 24)) || "1.5rem",
      large: ((u = e.typography) == null || (f = u.pxToRem) == null ? void 0 : f.call(u, 35)) || "2.1875rem"
    }[t.fontSize],
    color: (h = (y = (e.vars || e).palette) == null || (d = y[t.color]) == null ? void 0 : d.main) != null ? h : {
      action: (m = (e.vars || e).palette) == null || (w = m.action) == null ? void 0 : w.active,
      disabled: (g = (e.vars || e).palette) == null || (p = g.action) == null ? void 0 : p.disabled,
      inherit: void 0
    }[t.color]
  };
}), jx = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiSvgIcon"
  }), {
    children: o,
    className: i,
    color: s = "inherit",
    component: a = "svg",
    fontSize: l = "medium",
    htmlColor: c,
    inheritViewBox: u = !1,
    titleAccess: f,
    viewBox: h = "0 0 24 24"
  } = r, y = Q(r, b_), d = k({}, r, {
    color: s,
    component: a,
    fontSize: l,
    instanceFontSize: t.fontSize,
    inheritViewBox: u,
    viewBox: h
  }), m = {};
  u || (m.viewBox = h);
  const w = x_(d);
  return /* @__PURE__ */ G(w_, k({
    as: a,
    className: Z(w.root, i),
    focusable: "false",
    color: c,
    "aria-hidden": f ? void 0 : !0,
    role: f ? "img" : void 0,
    ref: n
  }, m, y, {
    ownerState: d,
    children: [o, f ? /* @__PURE__ */ S("title", {
      children: f
    }) : null]
  }));
});
jx.muiName = "SvgIcon";
const Fv = jx;
function Xn(e, t) {
  function n(r, o) {
    return /* @__PURE__ */ S(Fv, k({
      "data-testid": `${t}Icon`,
      ref: o
    }, r, {
      children: e
    }));
  }
  return n.muiName = Fv.muiName, /* @__PURE__ */ x.exports.memo(/* @__PURE__ */ x.exports.forwardRef(n));
}
const S_ = Xn(/* @__PURE__ */ S("path", {
  d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
}), "Person");
function C_(e) {
  return he("MuiAvatar", e);
}
fe("MuiAvatar", ["root", "colorDefault", "circular", "rounded", "square", "img", "fallback"]);
const k_ = ["alt", "children", "className", "component", "imgProps", "sizes", "src", "srcSet", "variant"], E_ = (e) => {
  const {
    classes: t,
    variant: n,
    colorDefault: r
  } = e;
  return me({
    root: ["root", n, r && "colorDefault"],
    img: ["img"],
    fallback: ["fallback"]
  }, C_, t);
}, R_ = U("div", {
  name: "MuiAvatar",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, t[n.variant], n.colorDefault && t.colorDefault];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: 40,
  height: 40,
  fontFamily: e.typography.fontFamily,
  fontSize: e.typography.pxToRem(20),
  lineHeight: 1,
  borderRadius: "50%",
  overflow: "hidden",
  userSelect: "none"
}, t.variant === "rounded" && {
  borderRadius: (e.vars || e).shape.borderRadius
}, t.variant === "square" && {
  borderRadius: 0
}, t.colorDefault && k({
  color: (e.vars || e).palette.background.default
}, e.vars ? {
  backgroundColor: e.vars.palette.Avatar.defaultBg
} : {
  backgroundColor: e.palette.mode === "light" ? e.palette.grey[400] : e.palette.grey[600]
}))), T_ = U("img", {
  name: "MuiAvatar",
  slot: "Img",
  overridesResolver: (e, t) => t.img
})({
  width: "100%",
  height: "100%",
  textAlign: "center",
  objectFit: "cover",
  color: "transparent",
  textIndent: 1e4
}), P_ = U(S_, {
  name: "MuiAvatar",
  slot: "Fallback",
  overridesResolver: (e, t) => t.fallback
})({
  width: "75%",
  height: "75%"
});
function O_({
  crossOrigin: e,
  referrerPolicy: t,
  src: n,
  srcSet: r
}) {
  const [o, i] = x.exports.useState(!1);
  return x.exports.useEffect(() => {
    if (!n && !r)
      return;
    i(!1);
    let s = !0;
    const a = new Image();
    return a.onload = () => {
      !s || i("loaded");
    }, a.onerror = () => {
      !s || i("error");
    }, a.crossOrigin = e, a.referrerPolicy = t, a.src = n, r && (a.srcset = r), () => {
      s = !1;
    };
  }, [e, t, n, r]), o;
}
const $_ = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiAvatar"
  }), {
    alt: o,
    children: i,
    className: s,
    component: a = "div",
    imgProps: l,
    sizes: c,
    src: u,
    srcSet: f,
    variant: h = "circular"
  } = r, y = Q(r, k_);
  let d = null;
  const m = O_(k({}, l, {
    src: u,
    srcSet: f
  })), w = u || f, g = w && m !== "error", p = k({}, r, {
    colorDefault: !g,
    component: a,
    variant: h
  }), v = E_(p);
  return g ? d = /* @__PURE__ */ S(T_, k({
    alt: o,
    src: u,
    srcSet: f,
    sizes: c,
    ownerState: p,
    className: v.img
  }, l)) : i != null ? d = i : w && o ? d = o[0] : d = /* @__PURE__ */ S(P_, {
    className: v.fallback
  }), /* @__PURE__ */ S(R_, k({
    as: a,
    ownerState: p,
    className: Z(v.root, s),
    ref: n
  }, y, {
    children: d
  }));
}), Wx = $_, __ = (e) => !e || !aa(e), Dv = __;
function M_(e) {
  return he("MuiBadge", e);
}
const I_ = fe("MuiBadge", [
  "root",
  "badge",
  "dot",
  "standard",
  "anchorOriginTopRight",
  "anchorOriginBottomRight",
  "anchorOriginTopLeft",
  "anchorOriginBottomLeft",
  "invisible",
  "colorError",
  "colorInfo",
  "colorPrimary",
  "colorSecondary",
  "colorSuccess",
  "colorWarning",
  "overlapRectangular",
  "overlapCircular",
  "anchorOriginTopLeftCircular",
  "anchorOriginTopLeftRectangular",
  "anchorOriginTopRightCircular",
  "anchorOriginTopRightRectangular",
  "anchorOriginBottomLeftCircular",
  "anchorOriginBottomLeftRectangular",
  "anchorOriginBottomRightCircular",
  "anchorOriginBottomRightRectangular"
]), mr = I_, A_ = ["anchorOrigin", "className", "component", "components", "componentsProps", "overlap", "color", "invisible", "max", "badgeContent", "slots", "slotProps", "showZero", "variant"], wd = 10, Sd = 4, N_ = (e) => {
  const {
    color: t,
    anchorOrigin: n,
    invisible: r,
    overlap: o,
    variant: i,
    classes: s = {}
  } = e, a = {
    root: ["root"],
    badge: ["badge", i, r && "invisible", `anchorOrigin${N(n.vertical)}${N(n.horizontal)}`, `anchorOrigin${N(n.vertical)}${N(n.horizontal)}${N(o)}`, `overlap${N(o)}`, t !== "default" && `color${N(t)}`]
  };
  return me(a, M_, s);
}, L_ = U("span", {
  name: "MuiBadge",
  slot: "Root",
  overridesResolver: (e, t) => t.root
})({
  position: "relative",
  display: "inline-flex",
  verticalAlign: "middle",
  flexShrink: 0
}), F_ = U("span", {
  name: "MuiBadge",
  slot: "Badge",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.badge, t[n.variant], t[`anchorOrigin${N(n.anchorOrigin.vertical)}${N(n.anchorOrigin.horizontal)}${N(n.overlap)}`], n.color !== "default" && t[`color${N(n.color)}`], n.invisible && t.invisible];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
  alignContent: "center",
  alignItems: "center",
  position: "absolute",
  boxSizing: "border-box",
  fontFamily: e.typography.fontFamily,
  fontWeight: e.typography.fontWeightMedium,
  fontSize: e.typography.pxToRem(12),
  minWidth: wd * 2,
  lineHeight: 1,
  padding: "0 6px",
  height: wd * 2,
  borderRadius: wd,
  zIndex: 1,
  transition: e.transitions.create("transform", {
    easing: e.transitions.easing.easeInOut,
    duration: e.transitions.duration.enteringScreen
  })
}, t.color !== "default" && {
  backgroundColor: (e.vars || e).palette[t.color].main,
  color: (e.vars || e).palette[t.color].contrastText
}, t.variant === "dot" && {
  borderRadius: Sd,
  height: Sd * 2,
  minWidth: Sd * 2,
  padding: 0
}, t.anchorOrigin.vertical === "top" && t.anchorOrigin.horizontal === "right" && t.overlap === "rectangular" && {
  top: 0,
  right: 0,
  transform: "scale(1) translate(50%, -50%)",
  transformOrigin: "100% 0%",
  [`&.${mr.invisible}`]: {
    transform: "scale(0) translate(50%, -50%)"
  }
}, t.anchorOrigin.vertical === "bottom" && t.anchorOrigin.horizontal === "right" && t.overlap === "rectangular" && {
  bottom: 0,
  right: 0,
  transform: "scale(1) translate(50%, 50%)",
  transformOrigin: "100% 100%",
  [`&.${mr.invisible}`]: {
    transform: "scale(0) translate(50%, 50%)"
  }
}, t.anchorOrigin.vertical === "top" && t.anchorOrigin.horizontal === "left" && t.overlap === "rectangular" && {
  top: 0,
  left: 0,
  transform: "scale(1) translate(-50%, -50%)",
  transformOrigin: "0% 0%",
  [`&.${mr.invisible}`]: {
    transform: "scale(0) translate(-50%, -50%)"
  }
}, t.anchorOrigin.vertical === "bottom" && t.anchorOrigin.horizontal === "left" && t.overlap === "rectangular" && {
  bottom: 0,
  left: 0,
  transform: "scale(1) translate(-50%, 50%)",
  transformOrigin: "0% 100%",
  [`&.${mr.invisible}`]: {
    transform: "scale(0) translate(-50%, 50%)"
  }
}, t.anchorOrigin.vertical === "top" && t.anchorOrigin.horizontal === "right" && t.overlap === "circular" && {
  top: "14%",
  right: "14%",
  transform: "scale(1) translate(50%, -50%)",
  transformOrigin: "100% 0%",
  [`&.${mr.invisible}`]: {
    transform: "scale(0) translate(50%, -50%)"
  }
}, t.anchorOrigin.vertical === "bottom" && t.anchorOrigin.horizontal === "right" && t.overlap === "circular" && {
  bottom: "14%",
  right: "14%",
  transform: "scale(1) translate(50%, 50%)",
  transformOrigin: "100% 100%",
  [`&.${mr.invisible}`]: {
    transform: "scale(0) translate(50%, 50%)"
  }
}, t.anchorOrigin.vertical === "top" && t.anchorOrigin.horizontal === "left" && t.overlap === "circular" && {
  top: "14%",
  left: "14%",
  transform: "scale(1) translate(-50%, -50%)",
  transformOrigin: "0% 0%",
  [`&.${mr.invisible}`]: {
    transform: "scale(0) translate(-50%, -50%)"
  }
}, t.anchorOrigin.vertical === "bottom" && t.anchorOrigin.horizontal === "left" && t.overlap === "circular" && {
  bottom: "14%",
  left: "14%",
  transform: "scale(1) translate(-50%, 50%)",
  transformOrigin: "0% 100%",
  [`&.${mr.invisible}`]: {
    transform: "scale(0) translate(-50%, 50%)"
  }
}, t.invisible && {
  transition: e.transitions.create("transform", {
    easing: e.transitions.easing.easeInOut,
    duration: e.transitions.duration.leavingScreen
  })
})), D_ = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r, o, i, s, a, l;
  const c = ve({
    props: t,
    name: "MuiBadge"
  }), {
    anchorOrigin: u = {
      vertical: "top",
      horizontal: "right"
    },
    className: f,
    component: h = "span",
    components: y = {},
    componentsProps: d = {},
    overlap: m = "rectangular",
    color: w = "default",
    invisible: g = !1,
    max: p,
    badgeContent: v,
    slots: b,
    slotProps: C,
    showZero: E = !1,
    variant: R = "standard"
  } = c, T = Q(c, A_), O = sx({
    anchorOrigin: u,
    color: w,
    overlap: m,
    variant: R
  });
  let P = g;
  g === !1 && (v === 0 && !E || v == null && R !== "dot") && (P = !0);
  const {
    color: $ = w,
    overlap: B = m,
    anchorOrigin: D = u,
    variant: I = R
  } = P ? O : c, M = k({}, c, {
    anchorOrigin: D,
    invisible: P,
    color: $,
    overlap: B,
    variant: I
  }), A = N_(M);
  let j;
  I !== "dot" && (j = v && Number(v) > p ? `${p}+` : v);
  const _ = (r = (o = b == null ? void 0 : b.root) != null ? o : y.Root) != null ? r : L_, z = (i = (s = b == null ? void 0 : b.badge) != null ? s : y.Badge) != null ? i : F_, F = (a = C == null ? void 0 : C.root) != null ? a : d.root, Y = (l = C == null ? void 0 : C.badge) != null ? l : d.badge;
  return /* @__PURE__ */ S(YO, k({
    invisible: g,
    badgeContent: j,
    showZero: E,
    max: p
  }, T, {
    slots: {
      root: _,
      badge: z
    },
    className: Z(F == null ? void 0 : F.className, A.root, f),
    slotProps: {
      root: k({}, F, Dv(_) && {
        as: h,
        ownerState: k({}, F == null ? void 0 : F.ownerState, {
          anchorOrigin: D,
          color: $,
          overlap: B,
          variant: I
        })
      }),
      badge: k({}, Y, {
        className: Z(A.badge, Y == null ? void 0 : Y.className)
      }, Dv(z) && {
        ownerState: k({}, Y == null ? void 0 : Y.ownerState, {
          anchorOrigin: D,
          color: $,
          overlap: B,
          variant: I
        })
      })
    },
    ref: n
  }));
}), z_ = D_;
function Mo() {
  return Wh(bu);
}
const B_ = (e) => {
  let t;
  return e < 1 ? t = 5.11916 * e ** 2 : t = 4.5 * Math.log(e + 1) + 2, (t / 100).toFixed(2);
}, zv = B_, j_ = zx(), W_ = bO({
  defaultTheme: j_,
  defaultClassName: "MuiBox-root",
  generateClassName: lx.generate
}), qe = W_;
function Vf(e, t) {
  return Vf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(r, o) {
    return r.__proto__ = o, r;
  }, Vf(e, t);
}
function Ux(e, t) {
  e.prototype = Object.create(t.prototype), e.prototype.constructor = e, Vf(e, t);
}
const Bv = {
  disabled: !1
}, pc = Pe.createContext(null);
var U_ = function(t) {
  return t.scrollTop;
}, ms = "unmounted", io = "exited", so = "entering", jo = "entered", Yf = "exiting", dr = /* @__PURE__ */ function(e) {
  Ux(t, e);
  function t(r, o) {
    var i;
    i = e.call(this, r, o) || this;
    var s = o, a = s && !s.isMounting ? r.enter : r.appear, l;
    return i.appearStatus = null, r.in ? a ? (l = io, i.appearStatus = so) : l = jo : r.unmountOnExit || r.mountOnEnter ? l = ms : l = io, i.state = {
      status: l
    }, i.nextCallback = null, i;
  }
  t.getDerivedStateFromProps = function(o, i) {
    var s = o.in;
    return s && i.status === ms ? {
      status: io
    } : null;
  };
  var n = t.prototype;
  return n.componentDidMount = function() {
    this.updateStatus(!0, this.appearStatus);
  }, n.componentDidUpdate = function(o) {
    var i = null;
    if (o !== this.props) {
      var s = this.state.status;
      this.props.in ? s !== so && s !== jo && (i = so) : (s === so || s === jo) && (i = Yf);
    }
    this.updateStatus(!1, i);
  }, n.componentWillUnmount = function() {
    this.cancelNextCallback();
  }, n.getTimeouts = function() {
    var o = this.props.timeout, i, s, a;
    return i = s = a = o, o != null && typeof o != "number" && (i = o.exit, s = o.enter, a = o.appear !== void 0 ? o.appear : s), {
      exit: i,
      enter: s,
      appear: a
    };
  }, n.updateStatus = function(o, i) {
    if (o === void 0 && (o = !1), i !== null)
      if (this.cancelNextCallback(), i === so) {
        if (this.props.unmountOnExit || this.props.mountOnEnter) {
          var s = this.props.nodeRef ? this.props.nodeRef.current : Za.findDOMNode(this);
          s && U_(s);
        }
        this.performEnter(o);
      } else
        this.performExit();
    else
      this.props.unmountOnExit && this.state.status === io && this.setState({
        status: ms
      });
  }, n.performEnter = function(o) {
    var i = this, s = this.props.enter, a = this.context ? this.context.isMounting : o, l = this.props.nodeRef ? [a] : [Za.findDOMNode(this), a], c = l[0], u = l[1], f = this.getTimeouts(), h = a ? f.appear : f.enter;
    if (!o && !s || Bv.disabled) {
      this.safeSetState({
        status: jo
      }, function() {
        i.props.onEntered(c);
      });
      return;
    }
    this.props.onEnter(c, u), this.safeSetState({
      status: so
    }, function() {
      i.props.onEntering(c, u), i.onTransitionEnd(h, function() {
        i.safeSetState({
          status: jo
        }, function() {
          i.props.onEntered(c, u);
        });
      });
    });
  }, n.performExit = function() {
    var o = this, i = this.props.exit, s = this.getTimeouts(), a = this.props.nodeRef ? void 0 : Za.findDOMNode(this);
    if (!i || Bv.disabled) {
      this.safeSetState({
        status: io
      }, function() {
        o.props.onExited(a);
      });
      return;
    }
    this.props.onExit(a), this.safeSetState({
      status: Yf
    }, function() {
      o.props.onExiting(a), o.onTransitionEnd(s.exit, function() {
        o.safeSetState({
          status: io
        }, function() {
          o.props.onExited(a);
        });
      });
    });
  }, n.cancelNextCallback = function() {
    this.nextCallback !== null && (this.nextCallback.cancel(), this.nextCallback = null);
  }, n.safeSetState = function(o, i) {
    i = this.setNextCallback(i), this.setState(o, i);
  }, n.setNextCallback = function(o) {
    var i = this, s = !0;
    return this.nextCallback = function(a) {
      s && (s = !1, i.nextCallback = null, o(a));
    }, this.nextCallback.cancel = function() {
      s = !1;
    }, this.nextCallback;
  }, n.onTransitionEnd = function(o, i) {
    this.setNextCallback(i);
    var s = this.props.nodeRef ? this.props.nodeRef.current : Za.findDOMNode(this), a = o == null && !this.props.addEndListener;
    if (!s || a) {
      setTimeout(this.nextCallback, 0);
      return;
    }
    if (this.props.addEndListener) {
      var l = this.props.nodeRef ? [this.nextCallback] : [s, this.nextCallback], c = l[0], u = l[1];
      this.props.addEndListener(c, u);
    }
    o != null && setTimeout(this.nextCallback, o);
  }, n.render = function() {
    var o = this.state.status;
    if (o === ms)
      return null;
    var i = this.props, s = i.children;
    i.in, i.mountOnEnter, i.unmountOnExit, i.appear, i.enter, i.exit, i.timeout, i.addEndListener, i.onEnter, i.onEntering, i.onEntered, i.onExit, i.onExiting, i.onExited, i.nodeRef;
    var a = Q(i, ["children", "in", "mountOnEnter", "unmountOnExit", "appear", "enter", "exit", "timeout", "addEndListener", "onEnter", "onEntering", "onEntered", "onExit", "onExiting", "onExited", "nodeRef"]);
    return /* @__PURE__ */ S(pc.Provider, {
      value: null,
      children: typeof s == "function" ? s(o, a) : Pe.cloneElement(Pe.Children.only(s), a)
    });
  }, t;
}(Pe.Component);
dr.contextType = pc;
dr.propTypes = {};
function zo() {
}
dr.defaultProps = {
  in: !1,
  mountOnEnter: !1,
  unmountOnExit: !1,
  appear: !1,
  enter: !0,
  exit: !0,
  onEnter: zo,
  onEntering: zo,
  onEntered: zo,
  onExit: zo,
  onExiting: zo,
  onExited: zo
};
dr.UNMOUNTED = ms;
dr.EXITED = io;
dr.ENTERING = so;
dr.ENTERED = jo;
dr.EXITING = Yf;
const Hx = dr;
function H_(e) {
  if (e === void 0)
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}
function Qh(e, t) {
  var n = function(i) {
    return t && x.exports.isValidElement(i) ? t(i) : i;
  }, r = /* @__PURE__ */ Object.create(null);
  return e && x.exports.Children.map(e, function(o) {
    return o;
  }).forEach(function(o) {
    r[o.key] = n(o);
  }), r;
}
function V_(e, t) {
  e = e || {}, t = t || {};
  function n(u) {
    return u in t ? t[u] : e[u];
  }
  var r = /* @__PURE__ */ Object.create(null), o = [];
  for (var i in e)
    i in t ? o.length && (r[i] = o, o = []) : o.push(i);
  var s, a = {};
  for (var l in t) {
    if (r[l])
      for (s = 0; s < r[l].length; s++) {
        var c = r[l][s];
        a[r[l][s]] = n(c);
      }
    a[l] = n(l);
  }
  for (s = 0; s < o.length; s++)
    a[o[s]] = n(o[s]);
  return a;
}
function ho(e, t, n) {
  return n[t] != null ? n[t] : e.props[t];
}
function Y_(e, t) {
  return Qh(e.children, function(n) {
    return x.exports.cloneElement(n, {
      onExited: t.bind(null, n),
      in: !0,
      appear: ho(n, "appear", e),
      enter: ho(n, "enter", e),
      exit: ho(n, "exit", e)
    });
  });
}
function X_(e, t, n) {
  var r = Qh(e.children), o = V_(t, r);
  return Object.keys(o).forEach(function(i) {
    var s = o[i];
    if (!!x.exports.isValidElement(s)) {
      var a = i in t, l = i in r, c = t[i], u = x.exports.isValidElement(c) && !c.props.in;
      l && (!a || u) ? o[i] = x.exports.cloneElement(s, {
        onExited: n.bind(null, s),
        in: !0,
        exit: ho(s, "exit", e),
        enter: ho(s, "enter", e)
      }) : !l && a && !u ? o[i] = x.exports.cloneElement(s, {
        in: !1
      }) : l && a && x.exports.isValidElement(c) && (o[i] = x.exports.cloneElement(s, {
        onExited: n.bind(null, s),
        in: c.props.in,
        exit: ho(s, "exit", e),
        enter: ho(s, "enter", e)
      }));
    }
  }), o;
}
var K_ = Object.values || function(e) {
  return Object.keys(e).map(function(t) {
    return e[t];
  });
}, q_ = {
  component: "div",
  childFactory: function(t) {
    return t;
  }
}, Jh = /* @__PURE__ */ function(e) {
  Ux(t, e);
  function t(r, o) {
    var i;
    i = e.call(this, r, o) || this;
    var s = i.handleExited.bind(H_(i));
    return i.state = {
      contextValue: {
        isMounting: !0
      },
      handleExited: s,
      firstRender: !0
    }, i;
  }
  var n = t.prototype;
  return n.componentDidMount = function() {
    this.mounted = !0, this.setState({
      contextValue: {
        isMounting: !1
      }
    });
  }, n.componentWillUnmount = function() {
    this.mounted = !1;
  }, t.getDerivedStateFromProps = function(o, i) {
    var s = i.children, a = i.handleExited, l = i.firstRender;
    return {
      children: l ? Y_(o, a) : X_(o, s, a),
      firstRender: !1
    };
  }, n.handleExited = function(o, i) {
    var s = Qh(this.props.children);
    o.key in s || (o.props.onExited && o.props.onExited(i), this.mounted && this.setState(function(a) {
      var l = k({}, a.children);
      return delete l[o.key], {
        children: l
      };
    }));
  }, n.render = function() {
    var o = this.props, i = o.component, s = o.childFactory, a = Q(o, ["component", "childFactory"]), l = this.state.contextValue, c = K_(this.state.children).map(s);
    return delete a.appear, delete a.enter, delete a.exit, i === null ? /* @__PURE__ */ S(pc.Provider, {
      value: l,
      children: c
    }) : /* @__PURE__ */ S(pc.Provider, {
      value: l,
      children: /* @__PURE__ */ S(i, {
        ...a,
        children: c
      })
    });
  }, t;
}(Pe.Component);
Jh.propTypes = {};
Jh.defaultProps = q_;
const G_ = Jh;
function Q_(e) {
  const {
    className: t,
    classes: n,
    pulsate: r = !1,
    rippleX: o,
    rippleY: i,
    rippleSize: s,
    in: a,
    onExited: l,
    timeout: c
  } = e, [u, f] = x.exports.useState(!1), h = Z(t, n.ripple, n.rippleVisible, r && n.ripplePulsate), y = {
    width: s,
    height: s,
    top: -(s / 2) + i,
    left: -(s / 2) + o
  }, d = Z(n.child, u && n.childLeaving, r && n.childPulsate);
  return !a && !u && f(!0), x.exports.useEffect(() => {
    if (!a && l != null) {
      const m = setTimeout(l, c);
      return () => {
        clearTimeout(m);
      };
    }
  }, [l, a, c]), /* @__PURE__ */ S("span", {
    className: h,
    style: y,
    children: /* @__PURE__ */ S("span", {
      className: d
    })
  });
}
const J_ = fe("MuiTouchRipple", ["root", "ripple", "rippleVisible", "ripplePulsate", "child", "childLeaving", "childPulsate"]), tn = J_, Z_ = ["center", "classes", "className"];
let xu = (e) => e, jv, Wv, Uv, Hv;
const Xf = 550, eM = 80, tM = Ea(jv || (jv = xu`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`)), nM = Ea(Wv || (Wv = xu`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`)), rM = Ea(Uv || (Uv = xu`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`)), oM = U("span", {
  name: "MuiTouchRipple",
  slot: "Root"
})({
  overflow: "hidden",
  pointerEvents: "none",
  position: "absolute",
  zIndex: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  borderRadius: "inherit"
}), iM = U(Q_, {
  name: "MuiTouchRipple",
  slot: "Ripple"
})(Hv || (Hv = xu`
  opacity: 0;
  position: absolute;

  &.${0} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${0};
    animation-duration: ${0}ms;
    animation-timing-function: ${0};
  }

  &.${0} {
    animation-duration: ${0}ms;
  }

  & .${0} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${0} {
    opacity: 0;
    animation-name: ${0};
    animation-duration: ${0}ms;
    animation-timing-function: ${0};
  }

  & .${0} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
    animation-name: ${0};
    animation-duration: 2500ms;
    animation-timing-function: ${0};
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`), tn.rippleVisible, tM, Xf, ({
  theme: e
}) => e.transitions.easing.easeInOut, tn.ripplePulsate, ({
  theme: e
}) => e.transitions.duration.shorter, tn.child, tn.childLeaving, nM, Xf, ({
  theme: e
}) => e.transitions.easing.easeInOut, tn.childPulsate, rM, ({
  theme: e
}) => e.transitions.easing.easeInOut), sM = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiTouchRipple"
  }), {
    center: o = !1,
    classes: i = {},
    className: s
  } = r, a = Q(r, Z_), [l, c] = x.exports.useState([]), u = x.exports.useRef(0), f = x.exports.useRef(null);
  x.exports.useEffect(() => {
    f.current && (f.current(), f.current = null);
  }, [l]);
  const h = x.exports.useRef(!1), y = x.exports.useRef(null), d = x.exports.useRef(null), m = x.exports.useRef(null);
  x.exports.useEffect(() => () => {
    clearTimeout(y.current);
  }, []);
  const w = x.exports.useCallback((b) => {
    const {
      pulsate: C,
      rippleX: E,
      rippleY: R,
      rippleSize: T,
      cb: O
    } = b;
    c((P) => [...P, /* @__PURE__ */ S(iM, {
      classes: {
        ripple: Z(i.ripple, tn.ripple),
        rippleVisible: Z(i.rippleVisible, tn.rippleVisible),
        ripplePulsate: Z(i.ripplePulsate, tn.ripplePulsate),
        child: Z(i.child, tn.child),
        childLeaving: Z(i.childLeaving, tn.childLeaving),
        childPulsate: Z(i.childPulsate, tn.childPulsate)
      },
      timeout: Xf,
      pulsate: C,
      rippleX: E,
      rippleY: R,
      rippleSize: T
    }, u.current)]), u.current += 1, f.current = O;
  }, [i]), g = x.exports.useCallback((b = {}, C = {}, E = () => {
  }) => {
    const {
      pulsate: R = !1,
      center: T = o || C.pulsate,
      fakeElement: O = !1
    } = C;
    if ((b == null ? void 0 : b.type) === "mousedown" && h.current) {
      h.current = !1;
      return;
    }
    (b == null ? void 0 : b.type) === "touchstart" && (h.current = !0);
    const P = O ? null : m.current, $ = P ? P.getBoundingClientRect() : {
      width: 0,
      height: 0,
      left: 0,
      top: 0
    };
    let B, D, I;
    if (T || b === void 0 || b.clientX === 0 && b.clientY === 0 || !b.clientX && !b.touches)
      B = Math.round($.width / 2), D = Math.round($.height / 2);
    else {
      const {
        clientX: M,
        clientY: A
      } = b.touches && b.touches.length > 0 ? b.touches[0] : b;
      B = Math.round(M - $.left), D = Math.round(A - $.top);
    }
    if (T)
      I = Math.sqrt((2 * $.width ** 2 + $.height ** 2) / 3), I % 2 === 0 && (I += 1);
    else {
      const M = Math.max(Math.abs((P ? P.clientWidth : 0) - B), B) * 2 + 2, A = Math.max(Math.abs((P ? P.clientHeight : 0) - D), D) * 2 + 2;
      I = Math.sqrt(M ** 2 + A ** 2);
    }
    b != null && b.touches ? d.current === null && (d.current = () => {
      w({
        pulsate: R,
        rippleX: B,
        rippleY: D,
        rippleSize: I,
        cb: E
      });
    }, y.current = setTimeout(() => {
      d.current && (d.current(), d.current = null);
    }, eM)) : w({
      pulsate: R,
      rippleX: B,
      rippleY: D,
      rippleSize: I,
      cb: E
    });
  }, [o, w]), p = x.exports.useCallback(() => {
    g({}, {
      pulsate: !0
    });
  }, [g]), v = x.exports.useCallback((b, C) => {
    if (clearTimeout(y.current), (b == null ? void 0 : b.type) === "touchend" && d.current) {
      d.current(), d.current = null, y.current = setTimeout(() => {
        v(b, C);
      });
      return;
    }
    d.current = null, c((E) => E.length > 0 ? E.slice(1) : E), f.current = C;
  }, []);
  return x.exports.useImperativeHandle(n, () => ({
    pulsate: p,
    start: g,
    stop: v
  }), [p, g, v]), /* @__PURE__ */ S(oM, k({
    className: Z(tn.root, i.root, s),
    ref: m
  }, a, {
    children: /* @__PURE__ */ S(G_, {
      component: null,
      exit: !0,
      children: l
    })
  }));
}), aM = sM;
function lM(e) {
  return he("MuiButtonBase", e);
}
const cM = fe("MuiButtonBase", ["root", "disabled", "focusVisible"]), uM = cM, dM = ["action", "centerRipple", "children", "className", "component", "disabled", "disableRipple", "disableTouchRipple", "focusRipple", "focusVisibleClassName", "LinkComponent", "onBlur", "onClick", "onContextMenu", "onDragLeave", "onFocus", "onFocusVisible", "onKeyDown", "onKeyUp", "onMouseDown", "onMouseLeave", "onMouseUp", "onTouchEnd", "onTouchMove", "onTouchStart", "tabIndex", "TouchRippleProps", "touchRippleRef", "type"], fM = (e) => {
  const {
    disabled: t,
    focusVisible: n,
    focusVisibleClassName: r,
    classes: o
  } = e, s = me({
    root: ["root", t && "disabled", n && "focusVisible"]
  }, lM, o);
  return n && r && (s.root += ` ${r}`), s;
}, pM = U("button", {
  name: "MuiButtonBase",
  slot: "Root",
  overridesResolver: (e, t) => t.root
})({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  boxSizing: "border-box",
  WebkitTapHighlightColor: "transparent",
  backgroundColor: "transparent",
  outline: 0,
  border: 0,
  margin: 0,
  borderRadius: 0,
  padding: 0,
  cursor: "pointer",
  userSelect: "none",
  verticalAlign: "middle",
  MozAppearance: "none",
  WebkitAppearance: "none",
  textDecoration: "none",
  color: "inherit",
  "&::-moz-focus-inner": {
    borderStyle: "none"
  },
  [`&.${uM.disabled}`]: {
    pointerEvents: "none",
    cursor: "default"
  },
  "@media print": {
    colorAdjust: "exact"
  }
}), hM = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiButtonBase"
  }), {
    action: o,
    centerRipple: i = !1,
    children: s,
    className: a,
    component: l = "button",
    disabled: c = !1,
    disableRipple: u = !1,
    disableTouchRipple: f = !1,
    focusRipple: h = !1,
    LinkComponent: y = "a",
    onBlur: d,
    onClick: m,
    onContextMenu: w,
    onDragLeave: g,
    onFocus: p,
    onFocusVisible: v,
    onKeyDown: b,
    onKeyUp: C,
    onMouseDown: E,
    onMouseLeave: R,
    onMouseUp: T,
    onTouchEnd: O,
    onTouchMove: P,
    onTouchStart: $,
    tabIndex: B = 0,
    TouchRippleProps: D,
    touchRippleRef: I,
    type: M
  } = r, A = Q(r, dM), j = x.exports.useRef(null), _ = x.exports.useRef(null), z = Qe(_, I), {
    isFocusVisibleRef: F,
    onFocus: Y,
    onBlur: q,
    ref: pe
  } = $h(), [ne, ae] = x.exports.useState(!1);
  c && ne && ae(!1), x.exports.useImperativeHandle(o, () => ({
    focusVisible: () => {
      ae(!0), j.current.focus();
    }
  }), []);
  const [le, X] = x.exports.useState(!1);
  x.exports.useEffect(() => {
    X(!0);
  }, []);
  const H = le && !u && !c;
  x.exports.useEffect(() => {
    ne && h && !u && le && _.current.pulsate();
  }, [u, h, ne, le]);
  function W(J, Ae, Le = f) {
    return In((en) => (Ae && Ae(en), !Le && _.current && _.current[J](en), !0));
  }
  const ce = W("start", E), re = W("stop", w), ie = W("stop", g), de = W("stop", T), se = W("stop", (J) => {
    ne && J.preventDefault(), R && R(J);
  }), oe = W("start", $), ue = W("stop", O), ge = W("stop", P), we = W("stop", (J) => {
    q(J), F.current === !1 && ae(!1), d && d(J);
  }, !1), ot = In((J) => {
    j.current || (j.current = J.currentTarget), Y(J), F.current === !0 && (ae(!0), v && v(J)), p && p(J);
  }), Oe = () => {
    const J = j.current;
    return l && l !== "button" && !(J.tagName === "A" && J.href);
  }, ye = x.exports.useRef(!1), Je = In((J) => {
    h && !ye.current && ne && _.current && J.key === " " && (ye.current = !0, _.current.stop(J, () => {
      _.current.start(J);
    })), J.target === J.currentTarget && Oe() && J.key === " " && J.preventDefault(), b && b(J), J.target === J.currentTarget && Oe() && J.key === "Enter" && !c && (J.preventDefault(), m && m(J));
  }), Ke = In((J) => {
    h && J.key === " " && _.current && ne && !J.defaultPrevented && (ye.current = !1, _.current.stop(J, () => {
      _.current.pulsate(J);
    })), C && C(J), m && J.target === J.currentTarget && Oe() && J.key === " " && !J.defaultPrevented && m(J);
  });
  let Ze = l;
  Ze === "button" && (A.href || A.to) && (Ze = y);
  const Ye = {};
  Ze === "button" ? (Ye.type = M === void 0 ? "button" : M, Ye.disabled = c) : (!A.href && !A.to && (Ye.role = "button"), c && (Ye["aria-disabled"] = c));
  const bt = Qe(n, pe, j), Mt = k({}, r, {
    centerRipple: i,
    component: l,
    disabled: c,
    disableRipple: u,
    disableTouchRipple: f,
    focusRipple: h,
    tabIndex: B,
    focusVisible: ne
  }), K = fM(Mt);
  return /* @__PURE__ */ G(pM, k({
    as: Ze,
    className: Z(K.root, a),
    ownerState: Mt,
    onBlur: we,
    onClick: m,
    onContextMenu: re,
    onFocus: ot,
    onKeyDown: Je,
    onKeyUp: Ke,
    onMouseDown: ce,
    onMouseLeave: se,
    onMouseUp: de,
    onDragLeave: ie,
    onTouchEnd: ue,
    onTouchMove: ge,
    onTouchStart: oe,
    ref: bt,
    tabIndex: c ? -1 : B,
    type: M
  }, Ye, A, {
    children: [s, H ? /* @__PURE__ */ S(aM, k({
      ref: z,
      center: i
    }, D)) : null]
  }));
}), Ei = hM;
function mM(e) {
  return he("MuiIconButton", e);
}
const gM = fe("MuiIconButton", ["root", "disabled", "colorInherit", "colorPrimary", "colorSecondary", "edgeStart", "edgeEnd", "sizeSmall", "sizeMedium", "sizeLarge"]), vM = gM, yM = ["edge", "children", "className", "color", "disabled", "disableFocusRipple", "size"], bM = (e) => {
  const {
    classes: t,
    disabled: n,
    color: r,
    edge: o,
    size: i
  } = e, s = {
    root: ["root", n && "disabled", r !== "default" && `color${N(r)}`, o && `edge${N(o)}`, `size${N(i)}`]
  };
  return me(s, mM, t);
}, xM = U(Ei, {
  name: "MuiIconButton",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, n.color !== "default" && t[`color${N(n.color)}`], n.edge && t[`edge${N(n.edge)}`], t[`size${N(n.size)}`]];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  textAlign: "center",
  flex: "0 0 auto",
  fontSize: e.typography.pxToRem(24),
  padding: 8,
  borderRadius: "50%",
  overflow: "visible",
  color: (e.vars || e).palette.action.active,
  transition: e.transitions.create("background-color", {
    duration: e.transitions.duration.shortest
  })
}, !t.disableRipple && {
  "&:hover": {
    backgroundColor: e.vars ? `rgba(${e.vars.palette.action.activeChannel} / ${e.vars.palette.action.hoverOpacity})` : Ie(e.palette.action.active, e.palette.action.hoverOpacity),
    "@media (hover: none)": {
      backgroundColor: "transparent"
    }
  }
}, t.edge === "start" && {
  marginLeft: t.size === "small" ? -3 : -12
}, t.edge === "end" && {
  marginRight: t.size === "small" ? -3 : -12
}), ({
  theme: e,
  ownerState: t
}) => {
  var n;
  const r = (n = (e.vars || e).palette) == null ? void 0 : n[t.color];
  return k({}, t.color === "inherit" && {
    color: "inherit"
  }, t.color !== "inherit" && t.color !== "default" && k({
    color: r == null ? void 0 : r.main
  }, !t.disableRipple && {
    "&:hover": k({}, r && {
      backgroundColor: e.vars ? `rgba(${r.mainChannel} / ${e.vars.palette.action.hoverOpacity})` : Ie(r.main, e.palette.action.hoverOpacity)
    }, {
      "@media (hover: none)": {
        backgroundColor: "transparent"
      }
    })
  }), t.size === "small" && {
    padding: 5,
    fontSize: e.typography.pxToRem(18)
  }, t.size === "large" && {
    padding: 12,
    fontSize: e.typography.pxToRem(28)
  }, {
    [`&.${vM.disabled}`]: {
      backgroundColor: "transparent",
      color: (e.vars || e).palette.action.disabled
    }
  });
}), wM = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiIconButton"
  }), {
    edge: o = !1,
    children: i,
    className: s,
    color: a = "default",
    disabled: l = !1,
    disableFocusRipple: c = !1,
    size: u = "medium"
  } = r, f = Q(r, yM), h = k({}, r, {
    edge: o,
    color: a,
    disabled: l,
    disableFocusRipple: c,
    size: u
  }), y = bM(h);
  return /* @__PURE__ */ S(xM, k({
    className: Z(y.root, s),
    centerRipple: !0,
    focusRipple: !c,
    disabled: l,
    ref: n,
    ownerState: h
  }, f, {
    children: i
  }));
}), Hn = wM;
function SM(e) {
  return he("MuiTypography", e);
}
fe("MuiTypography", ["root", "h1", "h2", "h3", "h4", "h5", "h6", "subtitle1", "subtitle2", "body1", "body2", "inherit", "button", "caption", "overline", "alignLeft", "alignRight", "alignCenter", "alignJustify", "noWrap", "gutterBottom", "paragraph"]);
const CM = ["align", "className", "component", "gutterBottom", "noWrap", "paragraph", "variant", "variantMapping"], kM = (e) => {
  const {
    align: t,
    gutterBottom: n,
    noWrap: r,
    paragraph: o,
    variant: i,
    classes: s
  } = e, a = {
    root: ["root", i, e.align !== "inherit" && `align${N(t)}`, n && "gutterBottom", r && "noWrap", o && "paragraph"]
  };
  return me(a, SM, s);
}, EM = U("span", {
  name: "MuiTypography",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, n.variant && t[n.variant], n.align !== "inherit" && t[`align${N(n.align)}`], n.noWrap && t.noWrap, n.gutterBottom && t.gutterBottom, n.paragraph && t.paragraph];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  margin: 0
}, t.variant && e.typography[t.variant], t.align !== "inherit" && {
  textAlign: t.align
}, t.noWrap && {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
}, t.gutterBottom && {
  marginBottom: "0.35em"
}, t.paragraph && {
  marginBottom: 16
})), Vv = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "h6",
  subtitle2: "h6",
  body1: "p",
  body2: "p",
  inherit: "p"
}, RM = {
  primary: "primary.main",
  textPrimary: "text.primary",
  secondary: "secondary.main",
  textSecondary: "text.secondary",
  error: "error.main"
}, TM = (e) => RM[e] || e, PM = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiTypography"
  }), o = TM(r.color), i = zh(k({}, r, {
    color: o
  })), {
    align: s = "inherit",
    className: a,
    component: l,
    gutterBottom: c = !1,
    noWrap: u = !1,
    paragraph: f = !1,
    variant: h = "body1",
    variantMapping: y = Vv
  } = i, d = Q(i, CM), m = k({}, i, {
    align: s,
    color: o,
    className: a,
    component: l,
    gutterBottom: c,
    noWrap: u,
    paragraph: f,
    variant: h,
    variantMapping: y
  }), w = l || (f ? "p" : y[h] || Vv[h]) || "span", g = kM(m);
  return /* @__PURE__ */ S(EM, k({
    as: w,
    ref: n,
    ownerState: m,
    className: Z(g.root, a)
  }, d));
}), gt = PM;
function Cn(e) {
  for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  throw Error("[Immer] minified error nr: " + e + (n.length ? " " + n.map(function(o) {
    return "'" + o + "'";
  }).join(",") : "") + ". Find the full error at: https://bit.ly/3cXEKWf");
}
function Yr(e) {
  return !!e && !!e[Be];
}
function ar(e) {
  var t;
  return !!e && (function(n) {
    if (!n || typeof n != "object")
      return !1;
    var r = Object.getPrototypeOf(n);
    if (r === null)
      return !0;
    var o = Object.hasOwnProperty.call(r, "constructor") && r.constructor;
    return o === Object || typeof o == "function" && Function.toString.call(o) === FM;
  }(e) || Array.isArray(e) || !!e[Jv] || !!(!((t = e.constructor) === null || t === void 0) && t[Jv]) || Zh(e) || em(e));
}
function To(e, t, n) {
  n === void 0 && (n = !1), Ni(e) === 0 ? (n ? Object.keys : di)(e).forEach(function(r) {
    n && typeof r == "symbol" || t(r, e[r], e);
  }) : e.forEach(function(r, o) {
    return t(o, r, e);
  });
}
function Ni(e) {
  var t = e[Be];
  return t ? t.i > 3 ? t.i - 4 : t.i : Array.isArray(e) ? 1 : Zh(e) ? 2 : em(e) ? 3 : 0;
}
function ui(e, t) {
  return Ni(e) === 2 ? e.has(t) : Object.prototype.hasOwnProperty.call(e, t);
}
function OM(e, t) {
  return Ni(e) === 2 ? e.get(t) : e[t];
}
function Vx(e, t, n) {
  var r = Ni(e);
  r === 2 ? e.set(t, n) : r === 3 ? (e.delete(t), e.add(n)) : e[t] = n;
}
function Yx(e, t) {
  return e === t ? e !== 0 || 1 / e == 1 / t : e != e && t != t;
}
function Zh(e) {
  return NM && e instanceof Map;
}
function em(e) {
  return LM && e instanceof Set;
}
function ao(e) {
  return e.o || e.t;
}
function tm(e) {
  if (Array.isArray(e))
    return Array.prototype.slice.call(e);
  var t = Kx(e);
  delete t[Be];
  for (var n = di(t), r = 0; r < n.length; r++) {
    var o = n[r], i = t[o];
    i.writable === !1 && (i.writable = !0, i.configurable = !0), (i.get || i.set) && (t[o] = { configurable: !0, writable: !0, enumerable: i.enumerable, value: e[o] });
  }
  return Object.create(Object.getPrototypeOf(e), t);
}
function nm(e, t) {
  return t === void 0 && (t = !1), rm(e) || Yr(e) || !ar(e) || (Ni(e) > 1 && (e.set = e.add = e.clear = e.delete = $M), Object.freeze(e), t && To(e, function(n, r) {
    return nm(r, !0);
  }, !0)), e;
}
function $M() {
  Cn(2);
}
function rm(e) {
  return e == null || typeof e != "object" || Object.isFrozen(e);
}
function zn(e) {
  var t = Qf[e];
  return t || Cn(18, e), t;
}
function _M(e, t) {
  Qf[e] || (Qf[e] = t);
}
function Kf() {
  return fa;
}
function Cd(e, t) {
  t && (zn("Patches"), e.u = [], e.s = [], e.v = t);
}
function hc(e) {
  qf(e), e.p.forEach(MM), e.p = null;
}
function qf(e) {
  e === fa && (fa = e.l);
}
function Yv(e) {
  return fa = { p: [], l: fa, h: e, m: !0, _: 0 };
}
function MM(e) {
  var t = e[Be];
  t.i === 0 || t.i === 1 ? t.j() : t.O = !0;
}
function kd(e, t) {
  t._ = t.p.length;
  var n = t.p[0], r = e !== void 0 && e !== n;
  return t.h.g || zn("ES5").S(t, e, r), r ? (n[Be].P && (hc(t), Cn(4)), ar(e) && (e = mc(t, e), t.l || gc(t, e)), t.u && zn("Patches").M(n[Be].t, e, t.u, t.s)) : e = mc(t, n, []), hc(t), t.u && t.v(t.u, t.s), e !== Xx ? e : void 0;
}
function mc(e, t, n) {
  if (rm(t))
    return t;
  var r = t[Be];
  if (!r)
    return To(t, function(i, s) {
      return Xv(e, r, t, i, s, n);
    }, !0), t;
  if (r.A !== e)
    return t;
  if (!r.P)
    return gc(e, r.t, !0), r.t;
  if (!r.I) {
    r.I = !0, r.A._--;
    var o = r.i === 4 || r.i === 5 ? r.o = tm(r.k) : r.o;
    To(r.i === 3 ? new Set(o) : o, function(i, s) {
      return Xv(e, r, o, i, s, n);
    }), gc(e, o, !1), n && e.u && zn("Patches").R(r, n, e.u, e.s);
  }
  return r.o;
}
function Xv(e, t, n, r, o, i) {
  if (Yr(o)) {
    var s = mc(e, o, i && t && t.i !== 3 && !ui(t.D, r) ? i.concat(r) : void 0);
    if (Vx(n, r, s), !Yr(s))
      return;
    e.m = !1;
  }
  if (ar(o) && !rm(o)) {
    if (!e.h.F && e._ < 1)
      return;
    mc(e, o), t && t.A.l || gc(e, o);
  }
}
function gc(e, t, n) {
  n === void 0 && (n = !1), e.h.F && e.m && nm(t, n);
}
function Ed(e, t) {
  var n = e[Be];
  return (n ? ao(n) : e)[t];
}
function Kv(e, t) {
  if (t in e)
    for (var n = Object.getPrototypeOf(e); n; ) {
      var r = Object.getOwnPropertyDescriptor(n, t);
      if (r)
        return r;
      n = Object.getPrototypeOf(n);
    }
}
function Cr(e) {
  e.P || (e.P = !0, e.l && Cr(e.l));
}
function Rd(e) {
  e.o || (e.o = tm(e.t));
}
function Gf(e, t, n) {
  var r = Zh(t) ? zn("MapSet").N(t, n) : em(t) ? zn("MapSet").T(t, n) : e.g ? function(o, i) {
    var s = Array.isArray(o), a = { i: s ? 1 : 0, A: i ? i.A : Kf(), P: !1, I: !1, D: {}, l: i, t: o, k: null, o: null, j: null, C: !1 }, l = a, c = pa;
    s && (l = [a], c = gs);
    var u = Proxy.revocable(l, c), f = u.revoke, h = u.proxy;
    return a.k = h, a.j = f, h;
  }(t, n) : zn("ES5").J(t, n);
  return (n ? n.A : Kf()).p.push(r), r;
}
function IM(e) {
  return Yr(e) || Cn(22, e), function t(n) {
    if (!ar(n))
      return n;
    var r, o = n[Be], i = Ni(n);
    if (o) {
      if (!o.P && (o.i < 4 || !zn("ES5").K(o)))
        return o.t;
      o.I = !0, r = qv(n, i), o.I = !1;
    } else
      r = qv(n, i);
    return To(r, function(s, a) {
      o && OM(o.t, s) === a || Vx(r, s, t(a));
    }), i === 3 ? new Set(r) : r;
  }(e);
}
function qv(e, t) {
  switch (t) {
    case 2:
      return new Map(e);
    case 3:
      return Array.from(e);
  }
  return tm(e);
}
function AM() {
  function e(i, s) {
    var a = o[i];
    return a ? a.enumerable = s : o[i] = a = { configurable: !0, enumerable: s, get: function() {
      var l = this[Be];
      return pa.get(l, i);
    }, set: function(l) {
      var c = this[Be];
      pa.set(c, i, l);
    } }, a;
  }
  function t(i) {
    for (var s = i.length - 1; s >= 0; s--) {
      var a = i[s][Be];
      if (!a.P)
        switch (a.i) {
          case 5:
            r(a) && Cr(a);
            break;
          case 4:
            n(a) && Cr(a);
        }
    }
  }
  function n(i) {
    for (var s = i.t, a = i.k, l = di(a), c = l.length - 1; c >= 0; c--) {
      var u = l[c];
      if (u !== Be) {
        var f = s[u];
        if (f === void 0 && !ui(s, u))
          return !0;
        var h = a[u], y = h && h[Be];
        if (y ? y.t !== f : !Yx(h, f))
          return !0;
      }
    }
    var d = !!s[Be];
    return l.length !== di(s).length + (d ? 0 : 1);
  }
  function r(i) {
    var s = i.k;
    if (s.length !== i.t.length)
      return !0;
    var a = Object.getOwnPropertyDescriptor(s, s.length - 1);
    if (a && !a.get)
      return !0;
    for (var l = 0; l < s.length; l++)
      if (!s.hasOwnProperty(l))
        return !0;
    return !1;
  }
  var o = {};
  _M("ES5", { J: function(i, s) {
    var a = Array.isArray(i), l = function(u, f) {
      if (u) {
        for (var h = Array(f.length), y = 0; y < f.length; y++)
          Object.defineProperty(h, "" + y, e(y, !0));
        return h;
      }
      var d = Kx(f);
      delete d[Be];
      for (var m = di(d), w = 0; w < m.length; w++) {
        var g = m[w];
        d[g] = e(g, u || !!d[g].enumerable);
      }
      return Object.create(Object.getPrototypeOf(f), d);
    }(a, i), c = { i: a ? 5 : 4, A: s ? s.A : Kf(), P: !1, I: !1, D: {}, l: s, t: i, k: l, o: null, O: !1, C: !1 };
    return Object.defineProperty(l, Be, { value: c, writable: !0 }), l;
  }, S: function(i, s, a) {
    a ? Yr(s) && s[Be].A === i && t(i.p) : (i.u && function l(c) {
      if (c && typeof c == "object") {
        var u = c[Be];
        if (u) {
          var f = u.t, h = u.k, y = u.D, d = u.i;
          if (d === 4)
            To(h, function(v) {
              v !== Be && (f[v] !== void 0 || ui(f, v) ? y[v] || l(h[v]) : (y[v] = !0, Cr(u)));
            }), To(f, function(v) {
              h[v] !== void 0 || ui(h, v) || (y[v] = !1, Cr(u));
            });
          else if (d === 5) {
            if (r(u) && (Cr(u), y.length = !0), h.length < f.length)
              for (var m = h.length; m < f.length; m++)
                y[m] = !1;
            else
              for (var w = f.length; w < h.length; w++)
                y[w] = !0;
            for (var g = Math.min(h.length, f.length), p = 0; p < g; p++)
              h.hasOwnProperty(p) || (y[p] = !0), y[p] === void 0 && l(h[p]);
          }
        }
      }
    }(i.p[0]), t(i.p));
  }, K: function(i) {
    return i.i === 4 ? n(i) : r(i);
  } });
}
var Gv, fa, om = typeof Symbol < "u" && typeof Symbol("x") == "symbol", NM = typeof Map < "u", LM = typeof Set < "u", Qv = typeof Proxy < "u" && Proxy.revocable !== void 0 && typeof Reflect < "u", Xx = om ? Symbol.for("immer-nothing") : ((Gv = {})["immer-nothing"] = !0, Gv), Jv = om ? Symbol.for("immer-draftable") : "__$immer_draftable", Be = om ? Symbol.for("immer-state") : "__$immer_state", FM = "" + Object.prototype.constructor, di = typeof Reflect < "u" && Reflect.ownKeys ? Reflect.ownKeys : Object.getOwnPropertySymbols !== void 0 ? function(e) {
  return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
} : Object.getOwnPropertyNames, Kx = Object.getOwnPropertyDescriptors || function(e) {
  var t = {};
  return di(e).forEach(function(n) {
    t[n] = Object.getOwnPropertyDescriptor(e, n);
  }), t;
}, Qf = {}, pa = { get: function(e, t) {
  if (t === Be)
    return e;
  var n = ao(e);
  if (!ui(n, t))
    return function(o, i, s) {
      var a, l = Kv(i, s);
      return l ? "value" in l ? l.value : (a = l.get) === null || a === void 0 ? void 0 : a.call(o.k) : void 0;
    }(e, n, t);
  var r = n[t];
  return e.I || !ar(r) ? r : r === Ed(e.t, t) ? (Rd(e), e.o[t] = Gf(e.A.h, r, e)) : r;
}, has: function(e, t) {
  return t in ao(e);
}, ownKeys: function(e) {
  return Reflect.ownKeys(ao(e));
}, set: function(e, t, n) {
  var r = Kv(ao(e), t);
  if (r != null && r.set)
    return r.set.call(e.k, n), !0;
  if (!e.P) {
    var o = Ed(ao(e), t), i = o == null ? void 0 : o[Be];
    if (i && i.t === n)
      return e.o[t] = n, e.D[t] = !1, !0;
    if (Yx(n, o) && (n !== void 0 || ui(e.t, t)))
      return !0;
    Rd(e), Cr(e);
  }
  return e.o[t] === n && typeof n != "number" && (n !== void 0 || t in e.o) || (e.o[t] = n, e.D[t] = !0, !0);
}, deleteProperty: function(e, t) {
  return Ed(e.t, t) !== void 0 || t in e.t ? (e.D[t] = !1, Rd(e), Cr(e)) : delete e.D[t], e.o && delete e.o[t], !0;
}, getOwnPropertyDescriptor: function(e, t) {
  var n = ao(e), r = Reflect.getOwnPropertyDescriptor(n, t);
  return r && { writable: !0, configurable: e.i !== 1 || t !== "length", enumerable: r.enumerable, value: n[t] };
}, defineProperty: function() {
  Cn(11);
}, getPrototypeOf: function(e) {
  return Object.getPrototypeOf(e.t);
}, setPrototypeOf: function() {
  Cn(12);
} }, gs = {};
To(pa, function(e, t) {
  gs[e] = function() {
    return arguments[0] = arguments[0][0], t.apply(this, arguments);
  };
}), gs.deleteProperty = function(e, t) {
  return gs.set.call(this, e, t, void 0);
}, gs.set = function(e, t, n) {
  return pa.set.call(this, e[0], t, n, e[0]);
};
var DM = function() {
  function e(n) {
    var r = this;
    this.g = Qv, this.F = !0, this.produce = function(o, i, s) {
      if (typeof o == "function" && typeof i != "function") {
        var a = i;
        i = o;
        var l = r;
        return function(m) {
          var w = this;
          m === void 0 && (m = a);
          for (var g = arguments.length, p = Array(g > 1 ? g - 1 : 0), v = 1; v < g; v++)
            p[v - 1] = arguments[v];
          return l.produce(m, function(b) {
            var C;
            return (C = i).call.apply(C, [w, b].concat(p));
          });
        };
      }
      var c;
      if (typeof i != "function" && Cn(6), s !== void 0 && typeof s != "function" && Cn(7), ar(o)) {
        var u = Yv(r), f = Gf(r, o, void 0), h = !0;
        try {
          c = i(f), h = !1;
        } finally {
          h ? hc(u) : qf(u);
        }
        return typeof Promise < "u" && c instanceof Promise ? c.then(function(m) {
          return Cd(u, s), kd(m, u);
        }, function(m) {
          throw hc(u), m;
        }) : (Cd(u, s), kd(c, u));
      }
      if (!o || typeof o != "object") {
        if ((c = i(o)) === void 0 && (c = o), c === Xx && (c = void 0), r.F && nm(c, !0), s) {
          var y = [], d = [];
          zn("Patches").M(o, c, y, d), s(y, d);
        }
        return c;
      }
      Cn(21, o);
    }, this.produceWithPatches = function(o, i) {
      if (typeof o == "function")
        return function(c) {
          for (var u = arguments.length, f = Array(u > 1 ? u - 1 : 0), h = 1; h < u; h++)
            f[h - 1] = arguments[h];
          return r.produceWithPatches(c, function(y) {
            return o.apply(void 0, [y].concat(f));
          });
        };
      var s, a, l = r.produce(o, i, function(c, u) {
        s = c, a = u;
      });
      return typeof Promise < "u" && l instanceof Promise ? l.then(function(c) {
        return [c, s, a];
      }) : [l, s, a];
    }, typeof (n == null ? void 0 : n.useProxies) == "boolean" && this.setUseProxies(n.useProxies), typeof (n == null ? void 0 : n.autoFreeze) == "boolean" && this.setAutoFreeze(n.autoFreeze);
  }
  var t = e.prototype;
  return t.createDraft = function(n) {
    ar(n) || Cn(8), Yr(n) && (n = IM(n));
    var r = Yv(this), o = Gf(this, n, void 0);
    return o[Be].C = !0, qf(r), o;
  }, t.finishDraft = function(n, r) {
    var o = n && n[Be], i = o.A;
    return Cd(i, r), kd(void 0, i);
  }, t.setAutoFreeze = function(n) {
    this.F = n;
  }, t.setUseProxies = function(n) {
    n && !Qv && Cn(20), this.g = n;
  }, t.applyPatches = function(n, r) {
    var o;
    for (o = r.length - 1; o >= 0; o--) {
      var i = r[o];
      if (i.path.length === 0 && i.op === "replace") {
        n = i.value;
        break;
      }
    }
    o > -1 && (r = r.slice(o + 1));
    var s = zn("Patches").$;
    return Yr(n) ? s(n, r) : this.produce(n, function(a) {
      return s(a, r);
    });
  }, e;
}(), Gt = new DM(), qx = Gt.produce;
Gt.produceWithPatches.bind(Gt);
Gt.setAutoFreeze.bind(Gt);
Gt.setUseProxies.bind(Gt);
Gt.applyPatches.bind(Gt);
Gt.createDraft.bind(Gt);
Gt.finishDraft.bind(Gt);
function zM(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Zv(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function e0(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Zv(Object(n), !0).forEach(function(r) {
      zM(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Zv(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Ct(e) {
  return "Minified Redux error #" + e + "; visit https://redux.js.org/Errors?code=" + e + " for the full message or use the non-minified dev environment for full errors. ";
}
var t0 = function() {
  return typeof Symbol == "function" && Symbol.observable || "@@observable";
}(), Td = function() {
  return Math.random().toString(36).substring(7).split("").join(".");
}, vc = {
  INIT: "@@redux/INIT" + Td(),
  REPLACE: "@@redux/REPLACE" + Td(),
  PROBE_UNKNOWN_ACTION: function() {
    return "@@redux/PROBE_UNKNOWN_ACTION" + Td();
  }
};
function BM(e) {
  if (typeof e != "object" || e === null)
    return !1;
  for (var t = e; Object.getPrototypeOf(t) !== null; )
    t = Object.getPrototypeOf(t);
  return Object.getPrototypeOf(e) === t;
}
function Gx(e, t, n) {
  var r;
  if (typeof t == "function" && typeof n == "function" || typeof n == "function" && typeof arguments[3] == "function")
    throw new Error(Ct(0));
  if (typeof t == "function" && typeof n > "u" && (n = t, t = void 0), typeof n < "u") {
    if (typeof n != "function")
      throw new Error(Ct(1));
    return n(Gx)(e, t);
  }
  if (typeof e != "function")
    throw new Error(Ct(2));
  var o = e, i = t, s = [], a = s, l = !1;
  function c() {
    a === s && (a = s.slice());
  }
  function u() {
    if (l)
      throw new Error(Ct(3));
    return i;
  }
  function f(m) {
    if (typeof m != "function")
      throw new Error(Ct(4));
    if (l)
      throw new Error(Ct(5));
    var w = !0;
    return c(), a.push(m), function() {
      if (!!w) {
        if (l)
          throw new Error(Ct(6));
        w = !1, c();
        var p = a.indexOf(m);
        a.splice(p, 1), s = null;
      }
    };
  }
  function h(m) {
    if (!BM(m))
      throw new Error(Ct(7));
    if (typeof m.type > "u")
      throw new Error(Ct(8));
    if (l)
      throw new Error(Ct(9));
    try {
      l = !0, i = o(i, m);
    } finally {
      l = !1;
    }
    for (var w = s = a, g = 0; g < w.length; g++) {
      var p = w[g];
      p();
    }
    return m;
  }
  function y(m) {
    if (typeof m != "function")
      throw new Error(Ct(10));
    o = m, h({
      type: vc.REPLACE
    });
  }
  function d() {
    var m, w = f;
    return m = {
      subscribe: function(p) {
        if (typeof p != "object" || p === null)
          throw new Error(Ct(11));
        function v() {
          p.next && p.next(u());
        }
        v();
        var b = w(v);
        return {
          unsubscribe: b
        };
      }
    }, m[t0] = function() {
      return this;
    }, m;
  }
  return h({
    type: vc.INIT
  }), r = {
    dispatch: h,
    subscribe: f,
    getState: u,
    replaceReducer: y
  }, r[t0] = d, r;
}
function jM(e) {
  Object.keys(e).forEach(function(t) {
    var n = e[t], r = n(void 0, {
      type: vc.INIT
    });
    if (typeof r > "u")
      throw new Error(Ct(12));
    if (typeof n(void 0, {
      type: vc.PROBE_UNKNOWN_ACTION()
    }) > "u")
      throw new Error(Ct(13));
  });
}
function WM(e) {
  for (var t = Object.keys(e), n = {}, r = 0; r < t.length; r++) {
    var o = t[r];
    typeof e[o] == "function" && (n[o] = e[o]);
  }
  var i = Object.keys(n), s;
  try {
    jM(n);
  } catch (a) {
    s = a;
  }
  return function(l, c) {
    if (l === void 0 && (l = {}), s)
      throw s;
    for (var u = !1, f = {}, h = 0; h < i.length; h++) {
      var y = i[h], d = n[y], m = l[y], w = d(m, c);
      if (typeof w > "u")
        throw c && c.type, new Error(Ct(14));
      f[y] = w, u = u || w !== m;
    }
    return u = u || i.length !== Object.keys(l).length, u ? f : l;
  };
}
function yc() {
  for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
    t[n] = arguments[n];
  return t.length === 0 ? function(r) {
    return r;
  } : t.length === 1 ? t[0] : t.reduce(function(r, o) {
    return function() {
      return r(o.apply(void 0, arguments));
    };
  });
}
function UM() {
  for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
    t[n] = arguments[n];
  return function(r) {
    return function() {
      var o = r.apply(void 0, arguments), i = function() {
        throw new Error(Ct(15));
      }, s = {
        getState: o.getState,
        dispatch: function() {
          return i.apply(void 0, arguments);
        }
      }, a = t.map(function(l) {
        return l(s);
      });
      return i = yc.apply(void 0, a)(o.dispatch), e0(e0({}, o), {}, {
        dispatch: i
      });
    };
  };
}
function Qx(e) {
  var t = function(r) {
    var o = r.dispatch, i = r.getState;
    return function(s) {
      return function(a) {
        return typeof a == "function" ? a(o, i, e) : s(a);
      };
    };
  };
  return t;
}
var Jx = Qx();
Jx.withExtraArgument = Qx;
const n0 = Jx;
var HM = globalThis && globalThis.__extends || function() {
  var e = function(t, n) {
    return e = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, o) {
      r.__proto__ = o;
    } || function(r, o) {
      for (var i in o)
        Object.prototype.hasOwnProperty.call(o, i) && (r[i] = o[i]);
    }, e(t, n);
  };
  return function(t, n) {
    if (typeof n != "function" && n !== null)
      throw new TypeError("Class extends value " + String(n) + " is not a constructor or null");
    e(t, n);
    function r() {
      this.constructor = t;
    }
    t.prototype = n === null ? Object.create(n) : (r.prototype = n.prototype, new r());
  };
}(), VM = globalThis && globalThis.__generator || function(e, t) {
  var n = { label: 0, sent: function() {
    if (i[0] & 1)
      throw i[1];
    return i[1];
  }, trys: [], ops: [] }, r, o, i, s;
  return s = { next: a(0), throw: a(1), return: a(2) }, typeof Symbol == "function" && (s[Symbol.iterator] = function() {
    return this;
  }), s;
  function a(c) {
    return function(u) {
      return l([c, u]);
    };
  }
  function l(c) {
    if (r)
      throw new TypeError("Generator is already executing.");
    for (; n; )
      try {
        if (r = 1, o && (i = c[0] & 2 ? o.return : c[0] ? o.throw || ((i = o.return) && i.call(o), 0) : o.next) && !(i = i.call(o, c[1])).done)
          return i;
        switch (o = 0, i && (c = [c[0] & 2, i.value]), c[0]) {
          case 0:
          case 1:
            i = c;
            break;
          case 4:
            return n.label++, { value: c[1], done: !1 };
          case 5:
            n.label++, o = c[1], c = [0];
            continue;
          case 7:
            c = n.ops.pop(), n.trys.pop();
            continue;
          default:
            if (i = n.trys, !(i = i.length > 0 && i[i.length - 1]) && (c[0] === 6 || c[0] === 2)) {
              n = 0;
              continue;
            }
            if (c[0] === 3 && (!i || c[1] > i[0] && c[1] < i[3])) {
              n.label = c[1];
              break;
            }
            if (c[0] === 6 && n.label < i[1]) {
              n.label = i[1], i = c;
              break;
            }
            if (i && n.label < i[2]) {
              n.label = i[2], n.ops.push(c);
              break;
            }
            i[2] && n.ops.pop(), n.trys.pop();
            continue;
        }
        c = t.call(e, n);
      } catch (u) {
        c = [6, u], o = 0;
      } finally {
        r = i = 0;
      }
    if (c[0] & 5)
      throw c[1];
    return { value: c[0] ? c[1] : void 0, done: !0 };
  }
}, bc = globalThis && globalThis.__spreadArray || function(e, t) {
  for (var n = 0, r = t.length, o = e.length; n < r; n++, o++)
    e[o] = t[n];
  return e;
}, YM = Object.defineProperty, XM = Object.defineProperties, KM = Object.getOwnPropertyDescriptors, r0 = Object.getOwnPropertySymbols, qM = Object.prototype.hasOwnProperty, GM = Object.prototype.propertyIsEnumerable, o0 = function(e, t, n) {
  return t in e ? YM(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
}, Br = function(e, t) {
  for (var n in t || (t = {}))
    qM.call(t, n) && o0(e, n, t[n]);
  if (r0)
    for (var r = 0, o = r0(t); r < o.length; r++) {
      var n = o[r];
      GM.call(t, n) && o0(e, n, t[n]);
    }
  return e;
}, Pd = function(e, t) {
  return XM(e, KM(t));
}, QM = function(e, t, n) {
  return new Promise(function(r, o) {
    var i = function(l) {
      try {
        a(n.next(l));
      } catch (c) {
        o(c);
      }
    }, s = function(l) {
      try {
        a(n.throw(l));
      } catch (c) {
        o(c);
      }
    }, a = function(l) {
      return l.done ? r(l.value) : Promise.resolve(l.value).then(i, s);
    };
    a((n = n.apply(e, t)).next());
  });
}, JM = typeof window < "u" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : function() {
  if (arguments.length !== 0)
    return typeof arguments[0] == "object" ? yc : yc.apply(null, arguments);
};
function ZM(e) {
  if (typeof e != "object" || e === null)
    return !1;
  var t = Object.getPrototypeOf(e);
  if (t === null)
    return !0;
  for (var n = t; Object.getPrototypeOf(n) !== null; )
    n = Object.getPrototypeOf(n);
  return t === n;
}
var eI = function(e) {
  HM(t, e);
  function t() {
    for (var n = [], r = 0; r < arguments.length; r++)
      n[r] = arguments[r];
    var o = e.apply(this, n) || this;
    return Object.setPrototypeOf(o, t.prototype), o;
  }
  return Object.defineProperty(t, Symbol.species, {
    get: function() {
      return t;
    },
    enumerable: !1,
    configurable: !0
  }), t.prototype.concat = function() {
    for (var n = [], r = 0; r < arguments.length; r++)
      n[r] = arguments[r];
    return e.prototype.concat.apply(this, n);
  }, t.prototype.prepend = function() {
    for (var n = [], r = 0; r < arguments.length; r++)
      n[r] = arguments[r];
    return n.length === 1 && Array.isArray(n[0]) ? new (t.bind.apply(t, bc([void 0], n[0].concat(this))))() : new (t.bind.apply(t, bc([void 0], n.concat(this))))();
  }, t;
}(Array);
function Jf(e) {
  return ar(e) ? qx(e, function() {
  }) : e;
}
function tI(e) {
  return typeof e == "boolean";
}
function nI() {
  return function(t) {
    return rI(t);
  };
}
function rI(e) {
  e === void 0 && (e = {});
  var t = e.thunk, n = t === void 0 ? !0 : t;
  e.immutableCheck, e.serializableCheck;
  var r = new eI();
  return n && (tI(n) ? r.push(n0) : r.push(n0.withExtraArgument(n.extraArgument))), r;
}
var oI = !0;
function iI(e) {
  var t = nI(), n = e || {}, r = n.reducer, o = r === void 0 ? void 0 : r, i = n.middleware, s = i === void 0 ? t() : i, a = n.devTools, l = a === void 0 ? !0 : a, c = n.preloadedState, u = c === void 0 ? void 0 : c, f = n.enhancers, h = f === void 0 ? void 0 : f, y;
  if (typeof o == "function")
    y = o;
  else if (ZM(o))
    y = WM(o);
  else
    throw new Error('"reducer" is a required argument, and must be a function or an object of functions that can be passed to combineReducers');
  var d = s;
  typeof d == "function" && (d = d(t));
  var m = UM.apply(void 0, d), w = yc;
  l && (w = JM(Br({
    trace: !oI
  }, typeof l == "object" && l)));
  var g = [m];
  Array.isArray(h) ? g = bc([m], h) : typeof h == "function" && (g = h(g));
  var p = w.apply(void 0, g);
  return Gx(y, u, p);
}
function jr(e, t) {
  function n() {
    for (var r = [], o = 0; o < arguments.length; o++)
      r[o] = arguments[o];
    if (t) {
      var i = t.apply(void 0, r);
      if (!i)
        throw new Error("prepareAction did not return an object");
      return Br(Br({
        type: e,
        payload: i.payload
      }, "meta" in i && { meta: i.meta }), "error" in i && { error: i.error });
    }
    return { type: e, payload: r[0] };
  }
  return n.toString = function() {
    return "" + e;
  }, n.type = e, n.match = function(r) {
    return r.type === e;
  }, n;
}
function Zx(e) {
  var t = {}, n = [], r, o = {
    addCase: function(i, s) {
      var a = typeof i == "string" ? i : i.type;
      if (a in t)
        throw new Error("addCase cannot be called with two reducers for the same action type");
      return t[a] = s, o;
    },
    addMatcher: function(i, s) {
      return n.push({ matcher: i, reducer: s }), o;
    },
    addDefaultCase: function(i) {
      return r = i, o;
    }
  };
  return e(o), [t, n, r];
}
function sI(e) {
  return typeof e == "function";
}
function aI(e, t, n, r) {
  n === void 0 && (n = []);
  var o = typeof t == "function" ? Zx(t) : [t, n, r], i = o[0], s = o[1], a = o[2], l;
  if (sI(e))
    l = function() {
      return Jf(e());
    };
  else {
    var c = Jf(e);
    l = function() {
      return c;
    };
  }
  function u(f, h) {
    f === void 0 && (f = l());
    var y = bc([
      i[h.type]
    ], s.filter(function(d) {
      var m = d.matcher;
      return m(h);
    }).map(function(d) {
      var m = d.reducer;
      return m;
    }));
    return y.filter(function(d) {
      return !!d;
    }).length === 0 && (y = [a]), y.reduce(function(d, m) {
      if (m)
        if (Yr(d)) {
          var w = d, g = m(w, h);
          return g === void 0 ? d : g;
        } else {
          if (ar(d))
            return qx(d, function(p) {
              return m(p, h);
            });
          var g = m(d, h);
          if (g === void 0) {
            if (d === null)
              return d;
            throw Error("A case reducer on a non-draftable value must not return undefined");
          }
          return g;
        }
      return d;
    }, f);
  }
  return u.getInitialState = l, u;
}
function lI(e, t) {
  return e + "/" + t;
}
function cI(e) {
  var t = e.name;
  if (!t)
    throw new Error("`name` is a required option for createSlice");
  typeof process < "u";
  var n = typeof e.initialState == "function" ? e.initialState : Jf(e.initialState), r = e.reducers || {}, o = Object.keys(r), i = {}, s = {}, a = {};
  o.forEach(function(u) {
    var f = r[u], h = lI(t, u), y, d;
    "reducer" in f ? (y = f.reducer, d = f.prepare) : y = f, i[u] = y, s[h] = y, a[u] = d ? jr(h, d) : jr(h);
  });
  function l() {
    var u = typeof e.extraReducers == "function" ? Zx(e.extraReducers) : [e.extraReducers], f = u[0], h = f === void 0 ? {} : f, y = u[1], d = y === void 0 ? [] : y, m = u[2], w = m === void 0 ? void 0 : m, g = Br(Br({}, h), s);
    return aI(n, function(p) {
      for (var v in g)
        p.addCase(v, g[v]);
      for (var b = 0, C = d; b < C.length; b++) {
        var E = C[b];
        p.addMatcher(E.matcher, E.reducer);
      }
      w && p.addDefaultCase(w);
    });
  }
  var c;
  return {
    name: t,
    reducer: function(u, f) {
      return c || (c = l()), c(u, f);
    },
    actions: a,
    caseReducers: i,
    getInitialState: function() {
      return c || (c = l()), c.getInitialState();
    }
  };
}
var uI = "ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW", dI = function(e) {
  e === void 0 && (e = 21);
  for (var t = "", n = e; n--; )
    t += uI[Math.random() * 64 | 0];
  return t;
}, fI = [
  "name",
  "message",
  "stack",
  "code"
], Od = function() {
  function e(t, n) {
    this.payload = t, this.meta = n;
  }
  return e;
}(), i0 = function() {
  function e(t, n) {
    this.payload = t, this.meta = n;
  }
  return e;
}(), pI = function(e) {
  if (typeof e == "object" && e !== null) {
    for (var t = {}, n = 0, r = fI; n < r.length; n++) {
      var o = r[n];
      typeof e[o] == "string" && (t[o] = e[o]);
    }
    return t;
  }
  return { message: String(e) };
}, wu = function() {
  function e(t, n, r) {
    var o = jr(t + "/fulfilled", function(c, u, f, h) {
      return {
        payload: c,
        meta: Pd(Br({}, h || {}), {
          arg: f,
          requestId: u,
          requestStatus: "fulfilled"
        })
      };
    }), i = jr(t + "/pending", function(c, u, f) {
      return {
        payload: void 0,
        meta: Pd(Br({}, f || {}), {
          arg: u,
          requestId: c,
          requestStatus: "pending"
        })
      };
    }), s = jr(t + "/rejected", function(c, u, f, h, y) {
      return {
        payload: h,
        error: (r && r.serializeError || pI)(c || "Rejected"),
        meta: Pd(Br({}, y || {}), {
          arg: f,
          requestId: u,
          rejectedWithValue: !!h,
          requestStatus: "rejected",
          aborted: (c == null ? void 0 : c.name) === "AbortError",
          condition: (c == null ? void 0 : c.name) === "ConditionError"
        })
      };
    }), a = typeof AbortController < "u" ? AbortController : function() {
      function c() {
        this.signal = {
          aborted: !1,
          addEventListener: function() {
          },
          dispatchEvent: function() {
            return !1;
          },
          onabort: function() {
          },
          removeEventListener: function() {
          },
          reason: void 0,
          throwIfAborted: function() {
          }
        };
      }
      return c.prototype.abort = function() {
      }, c;
    }();
    function l(c) {
      return function(u, f, h) {
        var y = r != null && r.idGenerator ? r.idGenerator(c) : dI(), d = new a(), m, w = new Promise(function(b, C) {
          return d.signal.addEventListener("abort", function() {
            return C({ name: "AbortError", message: m || "Aborted" });
          });
        }), g = !1;
        function p(b) {
          g && (m = b, d.abort());
        }
        var v = function() {
          return QM(this, null, function() {
            var b, C, E, R, T, O;
            return VM(this, function(P) {
              switch (P.label) {
                case 0:
                  return P.trys.push([0, 4, , 5]), R = (b = r == null ? void 0 : r.condition) == null ? void 0 : b.call(r, c, { getState: f, extra: h }), mI(R) ? [4, R] : [3, 2];
                case 1:
                  R = P.sent(), P.label = 2;
                case 2:
                  if (R === !1)
                    throw {
                      name: "ConditionError",
                      message: "Aborted due to condition callback returning false."
                    };
                  return g = !0, u(i(y, c, (C = r == null ? void 0 : r.getPendingMeta) == null ? void 0 : C.call(r, { requestId: y, arg: c }, { getState: f, extra: h }))), [4, Promise.race([
                    w,
                    Promise.resolve(n(c, {
                      dispatch: u,
                      getState: f,
                      extra: h,
                      requestId: y,
                      signal: d.signal,
                      abort: p,
                      rejectWithValue: function($, B) {
                        return new Od($, B);
                      },
                      fulfillWithValue: function($, B) {
                        return new i0($, B);
                      }
                    })).then(function($) {
                      if ($ instanceof Od)
                        throw $;
                      return $ instanceof i0 ? o($.payload, y, c, $.meta) : o($, y, c);
                    })
                  ])];
                case 3:
                  return E = P.sent(), [3, 5];
                case 4:
                  return T = P.sent(), E = T instanceof Od ? s(null, y, c, T.payload, T.meta) : s(T, y, c), [3, 5];
                case 5:
                  return O = r && !r.dispatchConditionRejection && s.match(E) && E.meta.condition, O || u(E), [2, E];
              }
            });
          });
        }();
        return Object.assign(v, {
          abort: p,
          requestId: y,
          arg: c,
          unwrap: function() {
            return v.then(hI);
          }
        });
      };
    }
    return Object.assign(l, {
      pending: i,
      rejected: s,
      fulfilled: o,
      typePrefix: t
    });
  }
  return e.withTypes = e, e;
}();
function hI(e) {
  if (e.meta && e.meta.rejectedWithValue)
    throw e.payload;
  if (e.error)
    throw e.error;
  return e.payload;
}
function mI(e) {
  return e !== null && typeof e == "object" && typeof e.then == "function";
}
var im = "listenerMiddleware";
jr(im + "/add");
jr(im + "/removeAll");
jr(im + "/remove");
var s0;
typeof queueMicrotask == "function" && queueMicrotask.bind(typeof window < "u" ? window : global);
AM();
function ew(e, t) {
  return function() {
    return e.apply(t, arguments);
  };
}
const { toString: tw } = Object.prototype, { getPrototypeOf: sm } = Object, am = ((e) => (t) => {
  const n = tw.call(t);
  return e[n] || (e[n] = n.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null)), fr = (e) => (e = e.toLowerCase(), (t) => am(t) === e), Su = (e) => (t) => typeof t === e, { isArray: Li } = Array, ha = Su("undefined");
function gI(e) {
  return e !== null && !ha(e) && e.constructor !== null && !ha(e.constructor) && Po(e.constructor.isBuffer) && e.constructor.isBuffer(e);
}
const nw = fr("ArrayBuffer");
function vI(e) {
  let t;
  return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? t = ArrayBuffer.isView(e) : t = e && e.buffer && nw(e.buffer), t;
}
const yI = Su("string"), Po = Su("function"), rw = Su("number"), lm = (e) => e !== null && typeof e == "object", bI = (e) => e === !0 || e === !1, $l = (e) => {
  if (am(e) !== "object")
    return !1;
  const t = sm(e);
  return (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) && !(Symbol.toStringTag in e) && !(Symbol.iterator in e);
}, xI = fr("Date"), wI = fr("File"), SI = fr("Blob"), CI = fr("FileList"), kI = (e) => lm(e) && Po(e.pipe), EI = (e) => {
  const t = "[object FormData]";
  return e && (typeof FormData == "function" && e instanceof FormData || tw.call(e) === t || Po(e.toString) && e.toString() === t);
}, RI = fr("URLSearchParams"), TI = (e) => e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function _a(e, t, { allOwnKeys: n = !1 } = {}) {
  if (e === null || typeof e > "u")
    return;
  let r, o;
  if (typeof e != "object" && (e = [e]), Li(e))
    for (r = 0, o = e.length; r < o; r++)
      t.call(null, e[r], r, e);
  else {
    const i = n ? Object.getOwnPropertyNames(e) : Object.keys(e), s = i.length;
    let a;
    for (r = 0; r < s; r++)
      a = i[r], t.call(null, e[a], a, e);
  }
}
function ow(e, t) {
  t = t.toLowerCase();
  const n = Object.keys(e);
  let r = n.length, o;
  for (; r-- > 0; )
    if (o = n[r], t === o.toLowerCase())
      return o;
  return null;
}
const iw = typeof self > "u" ? typeof global > "u" ? globalThis : global : self, sw = (e) => !ha(e) && e !== iw;
function Zf() {
  const { caseless: e } = sw(this) && this || {}, t = {}, n = (r, o) => {
    const i = e && ow(t, o) || o;
    $l(t[i]) && $l(r) ? t[i] = Zf(t[i], r) : $l(r) ? t[i] = Zf({}, r) : Li(r) ? t[i] = r.slice() : t[i] = r;
  };
  for (let r = 0, o = arguments.length; r < o; r++)
    arguments[r] && _a(arguments[r], n);
  return t;
}
const PI = (e, t, n, { allOwnKeys: r } = {}) => (_a(t, (o, i) => {
  n && Po(o) ? e[i] = ew(o, n) : e[i] = o;
}, { allOwnKeys: r }), e), OI = (e) => (e.charCodeAt(0) === 65279 && (e = e.slice(1)), e), $I = (e, t, n, r) => {
  e.prototype = Object.create(t.prototype, r), e.prototype.constructor = e, Object.defineProperty(e, "super", {
    value: t.prototype
  }), n && Object.assign(e.prototype, n);
}, _I = (e, t, n, r) => {
  let o, i, s;
  const a = {};
  if (t = t || {}, e == null)
    return t;
  do {
    for (o = Object.getOwnPropertyNames(e), i = o.length; i-- > 0; )
      s = o[i], (!r || r(s, e, t)) && !a[s] && (t[s] = e[s], a[s] = !0);
    e = n !== !1 && sm(e);
  } while (e && (!n || n(e, t)) && e !== Object.prototype);
  return t;
}, MI = (e, t, n) => {
  e = String(e), (n === void 0 || n > e.length) && (n = e.length), n -= t.length;
  const r = e.indexOf(t, n);
  return r !== -1 && r === n;
}, II = (e) => {
  if (!e)
    return null;
  if (Li(e))
    return e;
  let t = e.length;
  if (!rw(t))
    return null;
  const n = new Array(t);
  for (; t-- > 0; )
    n[t] = e[t];
  return n;
}, AI = ((e) => (t) => e && t instanceof e)(typeof Uint8Array < "u" && sm(Uint8Array)), NI = (e, t) => {
  const r = (e && e[Symbol.iterator]).call(e);
  let o;
  for (; (o = r.next()) && !o.done; ) {
    const i = o.value;
    t.call(e, i[0], i[1]);
  }
}, LI = (e, t) => {
  let n;
  const r = [];
  for (; (n = e.exec(t)) !== null; )
    r.push(n);
  return r;
}, FI = fr("HTMLFormElement"), DI = (e) => e.toLowerCase().replace(
  /[_-\s]([a-z\d])(\w*)/g,
  function(n, r, o) {
    return r.toUpperCase() + o;
  }
), a0 = (({ hasOwnProperty: e }) => (t, n) => e.call(t, n))(Object.prototype), zI = fr("RegExp"), aw = (e, t) => {
  const n = Object.getOwnPropertyDescriptors(e), r = {};
  _a(n, (o, i) => {
    t(o, i, e) !== !1 && (r[i] = o);
  }), Object.defineProperties(e, r);
}, BI = (e) => {
  aw(e, (t, n) => {
    if (Po(e) && ["arguments", "caller", "callee"].indexOf(n) !== -1)
      return !1;
    const r = e[n];
    if (!!Po(r)) {
      if (t.enumerable = !1, "writable" in t) {
        t.writable = !1;
        return;
      }
      t.set || (t.set = () => {
        throw Error("Can not rewrite read-only method '" + n + "'");
      });
    }
  });
}, jI = (e, t) => {
  const n = {}, r = (o) => {
    o.forEach((i) => {
      n[i] = !0;
    });
  };
  return Li(e) ? r(e) : r(String(e).split(t)), n;
}, WI = () => {
}, UI = (e, t) => (e = +e, Number.isFinite(e) ? e : t), HI = (e) => {
  const t = new Array(10), n = (r, o) => {
    if (lm(r)) {
      if (t.indexOf(r) >= 0)
        return;
      if (!("toJSON" in r)) {
        t[o] = r;
        const i = Li(r) ? [] : {};
        return _a(r, (s, a) => {
          const l = n(s, o + 1);
          !ha(l) && (i[a] = l);
        }), t[o] = void 0, i;
      }
    }
    return r;
  };
  return n(e, 0);
}, L = {
  isArray: Li,
  isArrayBuffer: nw,
  isBuffer: gI,
  isFormData: EI,
  isArrayBufferView: vI,
  isString: yI,
  isNumber: rw,
  isBoolean: bI,
  isObject: lm,
  isPlainObject: $l,
  isUndefined: ha,
  isDate: xI,
  isFile: wI,
  isBlob: SI,
  isRegExp: zI,
  isFunction: Po,
  isStream: kI,
  isURLSearchParams: RI,
  isTypedArray: AI,
  isFileList: CI,
  forEach: _a,
  merge: Zf,
  extend: PI,
  trim: TI,
  stripBOM: OI,
  inherits: $I,
  toFlatObject: _I,
  kindOf: am,
  kindOfTest: fr,
  endsWith: MI,
  toArray: II,
  forEachEntry: NI,
  matchAll: LI,
  isHTMLForm: FI,
  hasOwnProperty: a0,
  hasOwnProp: a0,
  reduceDescriptors: aw,
  freezeMethods: BI,
  toObjectSet: jI,
  toCamelCase: DI,
  noop: WI,
  toFiniteNumber: UI,
  findKey: ow,
  global: iw,
  isContextDefined: sw,
  toJSONObject: HI
};
function Ce(e, t, n, r, o) {
  Error.call(this), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack, this.message = e, this.name = "AxiosError", t && (this.code = t), n && (this.config = n), r && (this.request = r), o && (this.response = o);
}
L.inherits(Ce, Error, {
  toJSON: function() {
    return {
      message: this.message,
      name: this.name,
      description: this.description,
      number: this.number,
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      config: L.toJSONObject(this.config),
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  }
});
const lw = Ce.prototype, cw = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL"
].forEach((e) => {
  cw[e] = { value: e };
});
Object.defineProperties(Ce, cw);
Object.defineProperty(lw, "isAxiosError", { value: !0 });
Ce.from = (e, t, n, r, o, i) => {
  const s = Object.create(lw);
  return L.toFlatObject(e, s, function(l) {
    return l !== Error.prototype;
  }, (a) => a !== "isAxiosError"), Ce.call(s, e.message, t, n, r, o), s.cause = e, s.name = e.name, i && Object.assign(s, i), s;
};
var VI = typeof self == "object" ? self.FormData : window.FormData;
const YI = VI;
function ep(e) {
  return L.isPlainObject(e) || L.isArray(e);
}
function uw(e) {
  return L.endsWith(e, "[]") ? e.slice(0, -2) : e;
}
function l0(e, t, n) {
  return e ? e.concat(t).map(function(o, i) {
    return o = uw(o), !n && i ? "[" + o + "]" : o;
  }).join(n ? "." : "") : t;
}
function XI(e) {
  return L.isArray(e) && !e.some(ep);
}
const KI = L.toFlatObject(L, {}, null, function(t) {
  return /^is[A-Z]/.test(t);
});
function qI(e) {
  return e && L.isFunction(e.append) && e[Symbol.toStringTag] === "FormData" && e[Symbol.iterator];
}
function Cu(e, t, n) {
  if (!L.isObject(e))
    throw new TypeError("target must be an object");
  t = t || new (YI || FormData)(), n = L.toFlatObject(n, {
    metaTokens: !0,
    dots: !1,
    indexes: !1
  }, !1, function(m, w) {
    return !L.isUndefined(w[m]);
  });
  const r = n.metaTokens, o = n.visitor || u, i = n.dots, s = n.indexes, l = (n.Blob || typeof Blob < "u" && Blob) && qI(t);
  if (!L.isFunction(o))
    throw new TypeError("visitor must be a function");
  function c(d) {
    if (d === null)
      return "";
    if (L.isDate(d))
      return d.toISOString();
    if (!l && L.isBlob(d))
      throw new Ce("Blob is not supported. Use a Buffer instead.");
    return L.isArrayBuffer(d) || L.isTypedArray(d) ? l && typeof Blob == "function" ? new Blob([d]) : Buffer.from(d) : d;
  }
  function u(d, m, w) {
    let g = d;
    if (d && !w && typeof d == "object") {
      if (L.endsWith(m, "{}"))
        m = r ? m : m.slice(0, -2), d = JSON.stringify(d);
      else if (L.isArray(d) && XI(d) || L.isFileList(d) || L.endsWith(m, "[]") && (g = L.toArray(d)))
        return m = uw(m), g.forEach(function(v, b) {
          !(L.isUndefined(v) || v === null) && t.append(
            s === !0 ? l0([m], b, i) : s === null ? m : m + "[]",
            c(v)
          );
        }), !1;
    }
    return ep(d) ? !0 : (t.append(l0(w, m, i), c(d)), !1);
  }
  const f = [], h = Object.assign(KI, {
    defaultVisitor: u,
    convertValue: c,
    isVisitable: ep
  });
  function y(d, m) {
    if (!L.isUndefined(d)) {
      if (f.indexOf(d) !== -1)
        throw Error("Circular reference detected in " + m.join("."));
      f.push(d), L.forEach(d, function(g, p) {
        (!(L.isUndefined(g) || g === null) && o.call(
          t,
          g,
          L.isString(p) ? p.trim() : p,
          m,
          h
        )) === !0 && y(g, m ? m.concat(p) : [p]);
      }), f.pop();
    }
  }
  if (!L.isObject(e))
    throw new TypeError("data must be an object");
  return y(e), t;
}
function c0(e) {
  const t = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0"
  };
  return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function(r) {
    return t[r];
  });
}
function cm(e, t) {
  this._pairs = [], e && Cu(e, this, t);
}
const dw = cm.prototype;
dw.append = function(t, n) {
  this._pairs.push([t, n]);
};
dw.toString = function(t) {
  const n = t ? function(r) {
    return t.call(this, r, c0);
  } : c0;
  return this._pairs.map(function(o) {
    return n(o[0]) + "=" + n(o[1]);
  }, "").join("&");
};
function GI(e) {
  return encodeURIComponent(e).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
}
function fw(e, t, n) {
  if (!t)
    return e;
  const r = n && n.encode || GI, o = n && n.serialize;
  let i;
  if (o ? i = o(t, n) : i = L.isURLSearchParams(t) ? t.toString() : new cm(t, n).toString(r), i) {
    const s = e.indexOf("#");
    s !== -1 && (e = e.slice(0, s)), e += (e.indexOf("?") === -1 ? "?" : "&") + i;
  }
  return e;
}
class QI {
  constructor() {
    this.handlers = [];
  }
  use(t, n, r) {
    return this.handlers.push({
      fulfilled: t,
      rejected: n,
      synchronous: r ? r.synchronous : !1,
      runWhen: r ? r.runWhen : null
    }), this.handlers.length - 1;
  }
  eject(t) {
    this.handlers[t] && (this.handlers[t] = null);
  }
  clear() {
    this.handlers && (this.handlers = []);
  }
  forEach(t) {
    L.forEach(this.handlers, function(r) {
      r !== null && t(r);
    });
  }
}
const u0 = QI, pw = {
  silentJSONParsing: !0,
  forcedJSONParsing: !0,
  clarifyTimeoutError: !1
}, JI = typeof URLSearchParams < "u" ? URLSearchParams : cm, ZI = FormData, eA = (() => {
  let e;
  return typeof navigator < "u" && ((e = navigator.product) === "ReactNative" || e === "NativeScript" || e === "NS") ? !1 : typeof window < "u" && typeof document < "u";
})(), er = {
  isBrowser: !0,
  classes: {
    URLSearchParams: JI,
    FormData: ZI,
    Blob
  },
  isStandardBrowserEnv: eA,
  protocols: ["http", "https", "file", "blob", "url", "data"]
};
function tA(e, t) {
  return Cu(e, new er.classes.URLSearchParams(), Object.assign({
    visitor: function(n, r, o, i) {
      return er.isNode && L.isBuffer(n) ? (this.append(r, n.toString("base64")), !1) : i.defaultVisitor.apply(this, arguments);
    }
  }, t));
}
function nA(e) {
  return L.matchAll(/\w+|\[(\w*)]/g, e).map((t) => t[0] === "[]" ? "" : t[1] || t[0]);
}
function rA(e) {
  const t = {}, n = Object.keys(e);
  let r;
  const o = n.length;
  let i;
  for (r = 0; r < o; r++)
    i = n[r], t[i] = e[i];
  return t;
}
function hw(e) {
  function t(n, r, o, i) {
    let s = n[i++];
    const a = Number.isFinite(+s), l = i >= n.length;
    return s = !s && L.isArray(o) ? o.length : s, l ? (L.hasOwnProp(o, s) ? o[s] = [o[s], r] : o[s] = r, !a) : ((!o[s] || !L.isObject(o[s])) && (o[s] = []), t(n, r, o[s], i) && L.isArray(o[s]) && (o[s] = rA(o[s])), !a);
  }
  if (L.isFormData(e) && L.isFunction(e.entries)) {
    const n = {};
    return L.forEachEntry(e, (r, o) => {
      t(nA(r), o, n, 0);
    }), n;
  }
  return null;
}
const oA = {
  "Content-Type": void 0
};
function iA(e, t, n) {
  if (L.isString(e))
    try {
      return (t || JSON.parse)(e), L.trim(e);
    } catch (r) {
      if (r.name !== "SyntaxError")
        throw r;
    }
  return (n || JSON.stringify)(e);
}
const ku = {
  transitional: pw,
  adapter: ["xhr", "http"],
  transformRequest: [function(t, n) {
    const r = n.getContentType() || "", o = r.indexOf("application/json") > -1, i = L.isObject(t);
    if (i && L.isHTMLForm(t) && (t = new FormData(t)), L.isFormData(t))
      return o && o ? JSON.stringify(hw(t)) : t;
    if (L.isArrayBuffer(t) || L.isBuffer(t) || L.isStream(t) || L.isFile(t) || L.isBlob(t))
      return t;
    if (L.isArrayBufferView(t))
      return t.buffer;
    if (L.isURLSearchParams(t))
      return n.setContentType("application/x-www-form-urlencoded;charset=utf-8", !1), t.toString();
    let a;
    if (i) {
      if (r.indexOf("application/x-www-form-urlencoded") > -1)
        return tA(t, this.formSerializer).toString();
      if ((a = L.isFileList(t)) || r.indexOf("multipart/form-data") > -1) {
        const l = this.env && this.env.FormData;
        return Cu(
          a ? { "files[]": t } : t,
          l && new l(),
          this.formSerializer
        );
      }
    }
    return i || o ? (n.setContentType("application/json", !1), iA(t)) : t;
  }],
  transformResponse: [function(t) {
    const n = this.transitional || ku.transitional, r = n && n.forcedJSONParsing, o = this.responseType === "json";
    if (t && L.isString(t) && (r && !this.responseType || o)) {
      const s = !(n && n.silentJSONParsing) && o;
      try {
        return JSON.parse(t);
      } catch (a) {
        if (s)
          throw a.name === "SyntaxError" ? Ce.from(a, Ce.ERR_BAD_RESPONSE, this, null, this.response) : a;
      }
    }
    return t;
  }],
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: er.classes.FormData,
    Blob: er.classes.Blob
  },
  validateStatus: function(t) {
    return t >= 200 && t < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*"
    }
  }
};
L.forEach(["delete", "get", "head"], function(t) {
  ku.headers[t] = {};
});
L.forEach(["post", "put", "patch"], function(t) {
  ku.headers[t] = L.merge(oA);
});
const um = ku, sA = L.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]), aA = (e) => {
  const t = {};
  let n, r, o;
  return e && e.split(`
`).forEach(function(s) {
    o = s.indexOf(":"), n = s.substring(0, o).trim().toLowerCase(), r = s.substring(o + 1).trim(), !(!n || t[n] && sA[n]) && (n === "set-cookie" ? t[n] ? t[n].push(r) : t[n] = [r] : t[n] = t[n] ? t[n] + ", " + r : r);
  }), t;
}, d0 = Symbol("internals");
function ns(e) {
  return e && String(e).trim().toLowerCase();
}
function _l(e) {
  return e === !1 || e == null ? e : L.isArray(e) ? e.map(_l) : String(e);
}
function lA(e) {
  const t = /* @__PURE__ */ Object.create(null), n = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let r;
  for (; r = n.exec(e); )
    t[r[1]] = r[2];
  return t;
}
function cA(e) {
  return /^[-_a-zA-Z]+$/.test(e.trim());
}
function f0(e, t, n, r) {
  if (L.isFunction(r))
    return r.call(this, t, n);
  if (!!L.isString(t)) {
    if (L.isString(r))
      return t.indexOf(r) !== -1;
    if (L.isRegExp(r))
      return r.test(t);
  }
}
function uA(e) {
  return e.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (t, n, r) => n.toUpperCase() + r);
}
function dA(e, t) {
  const n = L.toCamelCase(" " + t);
  ["get", "set", "has"].forEach((r) => {
    Object.defineProperty(e, r + n, {
      value: function(o, i, s) {
        return this[r].call(this, t, o, i, s);
      },
      configurable: !0
    });
  });
}
class Eu {
  constructor(t) {
    t && this.set(t);
  }
  set(t, n, r) {
    const o = this;
    function i(a, l, c) {
      const u = ns(l);
      if (!u)
        throw new Error("header name must be a non-empty string");
      const f = L.findKey(o, u);
      (!f || o[f] === void 0 || c === !0 || c === void 0 && o[f] !== !1) && (o[f || l] = _l(a));
    }
    const s = (a, l) => L.forEach(a, (c, u) => i(c, u, l));
    return L.isPlainObject(t) || t instanceof this.constructor ? s(t, n) : L.isString(t) && (t = t.trim()) && !cA(t) ? s(aA(t), n) : t != null && i(n, t, r), this;
  }
  get(t, n) {
    if (t = ns(t), t) {
      const r = L.findKey(this, t);
      if (r) {
        const o = this[r];
        if (!n)
          return o;
        if (n === !0)
          return lA(o);
        if (L.isFunction(n))
          return n.call(this, o, r);
        if (L.isRegExp(n))
          return n.exec(o);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(t, n) {
    if (t = ns(t), t) {
      const r = L.findKey(this, t);
      return !!(r && (!n || f0(this, this[r], r, n)));
    }
    return !1;
  }
  delete(t, n) {
    const r = this;
    let o = !1;
    function i(s) {
      if (s = ns(s), s) {
        const a = L.findKey(r, s);
        a && (!n || f0(r, r[a], a, n)) && (delete r[a], o = !0);
      }
    }
    return L.isArray(t) ? t.forEach(i) : i(t), o;
  }
  clear() {
    return Object.keys(this).forEach(this.delete.bind(this));
  }
  normalize(t) {
    const n = this, r = {};
    return L.forEach(this, (o, i) => {
      const s = L.findKey(r, i);
      if (s) {
        n[s] = _l(o), delete n[i];
        return;
      }
      const a = t ? uA(i) : String(i).trim();
      a !== i && delete n[i], n[a] = _l(o), r[a] = !0;
    }), this;
  }
  concat(...t) {
    return this.constructor.concat(this, ...t);
  }
  toJSON(t) {
    const n = /* @__PURE__ */ Object.create(null);
    return L.forEach(this, (r, o) => {
      r != null && r !== !1 && (n[o] = t && L.isArray(r) ? r.join(", ") : r);
    }), n;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([t, n]) => t + ": " + n).join(`
`);
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(t) {
    return t instanceof this ? t : new this(t);
  }
  static concat(t, ...n) {
    const r = new this(t);
    return n.forEach((o) => r.set(o)), r;
  }
  static accessor(t) {
    const r = (this[d0] = this[d0] = {
      accessors: {}
    }).accessors, o = this.prototype;
    function i(s) {
      const a = ns(s);
      r[a] || (dA(o, s), r[a] = !0);
    }
    return L.isArray(t) ? t.forEach(i) : i(t), this;
  }
}
Eu.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent"]);
L.freezeMethods(Eu.prototype);
L.freezeMethods(Eu);
const tr = Eu;
function $d(e, t) {
  const n = this || um, r = t || n, o = tr.from(r.headers);
  let i = r.data;
  return L.forEach(e, function(a) {
    i = a.call(n, i, o.normalize(), t ? t.status : void 0);
  }), o.normalize(), i;
}
function mw(e) {
  return !!(e && e.__CANCEL__);
}
function Ma(e, t, n) {
  Ce.call(this, e == null ? "canceled" : e, Ce.ERR_CANCELED, t, n), this.name = "CanceledError";
}
L.inherits(Ma, Ce, {
  __CANCEL__: !0
});
const fA = null;
function pA(e, t, n) {
  const r = n.config.validateStatus;
  !n.status || !r || r(n.status) ? e(n) : t(new Ce(
    "Request failed with status code " + n.status,
    [Ce.ERR_BAD_REQUEST, Ce.ERR_BAD_RESPONSE][Math.floor(n.status / 100) - 4],
    n.config,
    n.request,
    n
  ));
}
const hA = er.isStandardBrowserEnv ? function() {
  return {
    write: function(n, r, o, i, s, a) {
      const l = [];
      l.push(n + "=" + encodeURIComponent(r)), L.isNumber(o) && l.push("expires=" + new Date(o).toGMTString()), L.isString(i) && l.push("path=" + i), L.isString(s) && l.push("domain=" + s), a === !0 && l.push("secure"), document.cookie = l.join("; ");
    },
    read: function(n) {
      const r = document.cookie.match(new RegExp("(^|;\\s*)(" + n + ")=([^;]*)"));
      return r ? decodeURIComponent(r[3]) : null;
    },
    remove: function(n) {
      this.write(n, "", Date.now() - 864e5);
    }
  };
}() : function() {
  return {
    write: function() {
    },
    read: function() {
      return null;
    },
    remove: function() {
    }
  };
}();
function mA(e) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
}
function gA(e, t) {
  return t ? e.replace(/\/+$/, "") + "/" + t.replace(/^\/+/, "") : e;
}
function gw(e, t) {
  return e && !mA(t) ? gA(e, t) : t;
}
const vA = er.isStandardBrowserEnv ? function() {
  const t = /(msie|trident)/i.test(navigator.userAgent), n = document.createElement("a");
  let r;
  function o(i) {
    let s = i;
    return t && (n.setAttribute("href", s), s = n.href), n.setAttribute("href", s), {
      href: n.href,
      protocol: n.protocol ? n.protocol.replace(/:$/, "") : "",
      host: n.host,
      search: n.search ? n.search.replace(/^\?/, "") : "",
      hash: n.hash ? n.hash.replace(/^#/, "") : "",
      hostname: n.hostname,
      port: n.port,
      pathname: n.pathname.charAt(0) === "/" ? n.pathname : "/" + n.pathname
    };
  }
  return r = o(window.location.href), function(s) {
    const a = L.isString(s) ? o(s) : s;
    return a.protocol === r.protocol && a.host === r.host;
  };
}() : function() {
  return function() {
    return !0;
  };
}();
function yA(e) {
  const t = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
  return t && t[1] || "";
}
function bA(e, t) {
  e = e || 10;
  const n = new Array(e), r = new Array(e);
  let o = 0, i = 0, s;
  return t = t !== void 0 ? t : 1e3, function(l) {
    const c = Date.now(), u = r[i];
    s || (s = c), n[o] = l, r[o] = c;
    let f = i, h = 0;
    for (; f !== o; )
      h += n[f++], f = f % e;
    if (o = (o + 1) % e, o === i && (i = (i + 1) % e), c - s < t)
      return;
    const y = u && c - u;
    return y ? Math.round(h * 1e3 / y) : void 0;
  };
}
function p0(e, t) {
  let n = 0;
  const r = bA(50, 250);
  return (o) => {
    const i = o.loaded, s = o.lengthComputable ? o.total : void 0, a = i - n, l = r(a), c = i <= s;
    n = i;
    const u = {
      loaded: i,
      total: s,
      progress: s ? i / s : void 0,
      bytes: a,
      rate: l || void 0,
      estimated: l && s && c ? (s - i) / l : void 0,
      event: o
    };
    u[t ? "download" : "upload"] = !0, e(u);
  };
}
const xA = typeof XMLHttpRequest < "u", wA = xA && function(e) {
  return new Promise(function(n, r) {
    let o = e.data;
    const i = tr.from(e.headers).normalize(), s = e.responseType;
    let a;
    function l() {
      e.cancelToken && e.cancelToken.unsubscribe(a), e.signal && e.signal.removeEventListener("abort", a);
    }
    L.isFormData(o) && er.isStandardBrowserEnv && i.setContentType(!1);
    let c = new XMLHttpRequest();
    if (e.auth) {
      const y = e.auth.username || "", d = e.auth.password ? unescape(encodeURIComponent(e.auth.password)) : "";
      i.set("Authorization", "Basic " + btoa(y + ":" + d));
    }
    const u = gw(e.baseURL, e.url);
    c.open(e.method.toUpperCase(), fw(u, e.params, e.paramsSerializer), !0), c.timeout = e.timeout;
    function f() {
      if (!c)
        return;
      const y = tr.from(
        "getAllResponseHeaders" in c && c.getAllResponseHeaders()
      ), m = {
        data: !s || s === "text" || s === "json" ? c.responseText : c.response,
        status: c.status,
        statusText: c.statusText,
        headers: y,
        config: e,
        request: c
      };
      pA(function(g) {
        n(g), l();
      }, function(g) {
        r(g), l();
      }, m), c = null;
    }
    if ("onloadend" in c ? c.onloadend = f : c.onreadystatechange = function() {
      !c || c.readyState !== 4 || c.status === 0 && !(c.responseURL && c.responseURL.indexOf("file:") === 0) || setTimeout(f);
    }, c.onabort = function() {
      !c || (r(new Ce("Request aborted", Ce.ECONNABORTED, e, c)), c = null);
    }, c.onerror = function() {
      r(new Ce("Network Error", Ce.ERR_NETWORK, e, c)), c = null;
    }, c.ontimeout = function() {
      let d = e.timeout ? "timeout of " + e.timeout + "ms exceeded" : "timeout exceeded";
      const m = e.transitional || pw;
      e.timeoutErrorMessage && (d = e.timeoutErrorMessage), r(new Ce(
        d,
        m.clarifyTimeoutError ? Ce.ETIMEDOUT : Ce.ECONNABORTED,
        e,
        c
      )), c = null;
    }, er.isStandardBrowserEnv) {
      const y = (e.withCredentials || vA(u)) && e.xsrfCookieName && hA.read(e.xsrfCookieName);
      y && i.set(e.xsrfHeaderName, y);
    }
    o === void 0 && i.setContentType(null), "setRequestHeader" in c && L.forEach(i.toJSON(), function(d, m) {
      c.setRequestHeader(m, d);
    }), L.isUndefined(e.withCredentials) || (c.withCredentials = !!e.withCredentials), s && s !== "json" && (c.responseType = e.responseType), typeof e.onDownloadProgress == "function" && c.addEventListener("progress", p0(e.onDownloadProgress, !0)), typeof e.onUploadProgress == "function" && c.upload && c.upload.addEventListener("progress", p0(e.onUploadProgress)), (e.cancelToken || e.signal) && (a = (y) => {
      !c || (r(!y || y.type ? new Ma(null, e, c) : y), c.abort(), c = null);
    }, e.cancelToken && e.cancelToken.subscribe(a), e.signal && (e.signal.aborted ? a() : e.signal.addEventListener("abort", a)));
    const h = yA(u);
    if (h && er.protocols.indexOf(h) === -1) {
      r(new Ce("Unsupported protocol " + h + ":", Ce.ERR_BAD_REQUEST, e));
      return;
    }
    c.send(o || null);
  });
}, Ml = {
  http: fA,
  xhr: wA
};
L.forEach(Ml, (e, t) => {
  if (e) {
    try {
      Object.defineProperty(e, "name", { value: t });
    } catch {
    }
    Object.defineProperty(e, "adapterName", { value: t });
  }
});
const SA = {
  getAdapter: (e) => {
    e = L.isArray(e) ? e : [e];
    const { length: t } = e;
    let n, r;
    for (let o = 0; o < t && (n = e[o], !(r = L.isString(n) ? Ml[n.toLowerCase()] : n)); o++)
      ;
    if (!r)
      throw r === !1 ? new Ce(
        `Adapter ${n} is not supported by the environment`,
        "ERR_NOT_SUPPORT"
      ) : new Error(
        L.hasOwnProp(Ml, n) ? `Adapter '${n}' is not available in the build` : `Unknown adapter '${n}'`
      );
    if (!L.isFunction(r))
      throw new TypeError("adapter is not a function");
    return r;
  },
  adapters: Ml
};
function _d(e) {
  if (e.cancelToken && e.cancelToken.throwIfRequested(), e.signal && e.signal.aborted)
    throw new Ma();
}
function h0(e) {
  return _d(e), e.headers = tr.from(e.headers), e.data = $d.call(
    e,
    e.transformRequest
  ), ["post", "put", "patch"].indexOf(e.method) !== -1 && e.headers.setContentType("application/x-www-form-urlencoded", !1), SA.getAdapter(e.adapter || um.adapter)(e).then(function(r) {
    return _d(e), r.data = $d.call(
      e,
      e.transformResponse,
      r
    ), r.headers = tr.from(r.headers), r;
  }, function(r) {
    return mw(r) || (_d(e), r && r.response && (r.response.data = $d.call(
      e,
      e.transformResponse,
      r.response
    ), r.response.headers = tr.from(r.response.headers))), Promise.reject(r);
  });
}
const m0 = (e) => e instanceof tr ? e.toJSON() : e;
function ma(e, t) {
  t = t || {};
  const n = {};
  function r(c, u, f) {
    return L.isPlainObject(c) && L.isPlainObject(u) ? L.merge.call({ caseless: f }, c, u) : L.isPlainObject(u) ? L.merge({}, u) : L.isArray(u) ? u.slice() : u;
  }
  function o(c, u, f) {
    if (L.isUndefined(u)) {
      if (!L.isUndefined(c))
        return r(void 0, c, f);
    } else
      return r(c, u, f);
  }
  function i(c, u) {
    if (!L.isUndefined(u))
      return r(void 0, u);
  }
  function s(c, u) {
    if (L.isUndefined(u)) {
      if (!L.isUndefined(c))
        return r(void 0, c);
    } else
      return r(void 0, u);
  }
  function a(c, u, f) {
    if (f in t)
      return r(c, u);
    if (f in e)
      return r(void 0, c);
  }
  const l = {
    url: i,
    method: i,
    data: i,
    baseURL: s,
    transformRequest: s,
    transformResponse: s,
    paramsSerializer: s,
    timeout: s,
    timeoutMessage: s,
    withCredentials: s,
    adapter: s,
    responseType: s,
    xsrfCookieName: s,
    xsrfHeaderName: s,
    onUploadProgress: s,
    onDownloadProgress: s,
    decompress: s,
    maxContentLength: s,
    maxBodyLength: s,
    beforeRedirect: s,
    transport: s,
    httpAgent: s,
    httpsAgent: s,
    cancelToken: s,
    socketPath: s,
    responseEncoding: s,
    validateStatus: a,
    headers: (c, u) => o(m0(c), m0(u), !0)
  };
  return L.forEach(Object.keys(e).concat(Object.keys(t)), function(u) {
    const f = l[u] || o, h = f(e[u], t[u], u);
    L.isUndefined(h) && f !== a || (n[u] = h);
  }), n;
}
const vw = "1.2.0", dm = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((e, t) => {
  dm[e] = function(r) {
    return typeof r === e || "a" + (t < 1 ? "n " : " ") + e;
  };
});
const g0 = {};
dm.transitional = function(t, n, r) {
  function o(i, s) {
    return "[Axios v" + vw + "] Transitional option '" + i + "'" + s + (r ? ". " + r : "");
  }
  return (i, s, a) => {
    if (t === !1)
      throw new Ce(
        o(s, " has been removed" + (n ? " in " + n : "")),
        Ce.ERR_DEPRECATED
      );
    return n && !g0[s] && (g0[s] = !0, console.warn(
      o(
        s,
        " has been deprecated since v" + n + " and will be removed in the near future"
      )
    )), t ? t(i, s, a) : !0;
  };
};
function CA(e, t, n) {
  if (typeof e != "object")
    throw new Ce("options must be an object", Ce.ERR_BAD_OPTION_VALUE);
  const r = Object.keys(e);
  let o = r.length;
  for (; o-- > 0; ) {
    const i = r[o], s = t[i];
    if (s) {
      const a = e[i], l = a === void 0 || s(a, i, e);
      if (l !== !0)
        throw new Ce("option " + i + " must be " + l, Ce.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (n !== !0)
      throw new Ce("Unknown option " + i, Ce.ERR_BAD_OPTION);
  }
}
const tp = {
  assertOptions: CA,
  validators: dm
}, gr = tp.validators;
class xc {
  constructor(t) {
    this.defaults = t, this.interceptors = {
      request: new u0(),
      response: new u0()
    };
  }
  request(t, n) {
    typeof t == "string" ? (n = n || {}, n.url = t) : n = t || {}, n = ma(this.defaults, n);
    const { transitional: r, paramsSerializer: o, headers: i } = n;
    r !== void 0 && tp.assertOptions(r, {
      silentJSONParsing: gr.transitional(gr.boolean),
      forcedJSONParsing: gr.transitional(gr.boolean),
      clarifyTimeoutError: gr.transitional(gr.boolean)
    }, !1), o !== void 0 && tp.assertOptions(o, {
      encode: gr.function,
      serialize: gr.function
    }, !0), n.method = (n.method || this.defaults.method || "get").toLowerCase();
    let s;
    s = i && L.merge(
      i.common,
      i[n.method]
    ), s && L.forEach(
      ["delete", "get", "head", "post", "put", "patch", "common"],
      (d) => {
        delete i[d];
      }
    ), n.headers = tr.concat(s, i);
    const a = [];
    let l = !0;
    this.interceptors.request.forEach(function(m) {
      typeof m.runWhen == "function" && m.runWhen(n) === !1 || (l = l && m.synchronous, a.unshift(m.fulfilled, m.rejected));
    });
    const c = [];
    this.interceptors.response.forEach(function(m) {
      c.push(m.fulfilled, m.rejected);
    });
    let u, f = 0, h;
    if (!l) {
      const d = [h0.bind(this), void 0];
      for (d.unshift.apply(d, a), d.push.apply(d, c), h = d.length, u = Promise.resolve(n); f < h; )
        u = u.then(d[f++], d[f++]);
      return u;
    }
    h = a.length;
    let y = n;
    for (f = 0; f < h; ) {
      const d = a[f++], m = a[f++];
      try {
        y = d(y);
      } catch (w) {
        m.call(this, w);
        break;
      }
    }
    try {
      u = h0.call(this, y);
    } catch (d) {
      return Promise.reject(d);
    }
    for (f = 0, h = c.length; f < h; )
      u = u.then(c[f++], c[f++]);
    return u;
  }
  getUri(t) {
    t = ma(this.defaults, t);
    const n = gw(t.baseURL, t.url);
    return fw(n, t.params, t.paramsSerializer);
  }
}
L.forEach(["delete", "get", "head", "options"], function(t) {
  xc.prototype[t] = function(n, r) {
    return this.request(ma(r || {}, {
      method: t,
      url: n,
      data: (r || {}).data
    }));
  };
});
L.forEach(["post", "put", "patch"], function(t) {
  function n(r) {
    return function(i, s, a) {
      return this.request(ma(a || {}, {
        method: t,
        headers: r ? {
          "Content-Type": "multipart/form-data"
        } : {},
        url: i,
        data: s
      }));
    };
  }
  xc.prototype[t] = n(), xc.prototype[t + "Form"] = n(!0);
});
const Il = xc;
class fm {
  constructor(t) {
    if (typeof t != "function")
      throw new TypeError("executor must be a function.");
    let n;
    this.promise = new Promise(function(i) {
      n = i;
    });
    const r = this;
    this.promise.then((o) => {
      if (!r._listeners)
        return;
      let i = r._listeners.length;
      for (; i-- > 0; )
        r._listeners[i](o);
      r._listeners = null;
    }), this.promise.then = (o) => {
      let i;
      const s = new Promise((a) => {
        r.subscribe(a), i = a;
      }).then(o);
      return s.cancel = function() {
        r.unsubscribe(i);
      }, s;
    }, t(function(i, s, a) {
      r.reason || (r.reason = new Ma(i, s, a), n(r.reason));
    });
  }
  throwIfRequested() {
    if (this.reason)
      throw this.reason;
  }
  subscribe(t) {
    if (this.reason) {
      t(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(t) : this._listeners = [t];
  }
  unsubscribe(t) {
    if (!this._listeners)
      return;
    const n = this._listeners.indexOf(t);
    n !== -1 && this._listeners.splice(n, 1);
  }
  static source() {
    let t;
    return {
      token: new fm(function(o) {
        t = o;
      }),
      cancel: t
    };
  }
}
const kA = fm;
function EA(e) {
  return function(n) {
    return e.apply(null, n);
  };
}
function RA(e) {
  return L.isObject(e) && e.isAxiosError === !0;
}
function yw(e) {
  const t = new Il(e), n = ew(Il.prototype.request, t);
  return L.extend(n, Il.prototype, t, { allOwnKeys: !0 }), L.extend(n, t, null, { allOwnKeys: !0 }), n.create = function(o) {
    return yw(ma(e, o));
  }, n;
}
const yt = yw(um);
yt.Axios = Il;
yt.CanceledError = Ma;
yt.CancelToken = kA;
yt.isCancel = mw;
yt.VERSION = vw;
yt.toFormData = Cu;
yt.AxiosError = Ce;
yt.Cancel = yt.CanceledError;
yt.all = function(t) {
  return Promise.all(t);
};
yt.spread = EA;
yt.isAxiosError = RA;
yt.AxiosHeaders = tr;
yt.formToJSON = (e) => hw(L.isHTMLForm(e) ? new FormData(e) : e);
yt.default = yt;
const Zr = yt, lo = wu(
  "fetch/visitor",
  async (e) => {
    try {
      return (await Zr.post(
        `${window.baseUrl}/api/widget/visitor`,
        {
          ...e.data
        },
        {
          headers: {
            Authorization: `Bearer ${e.token}`
          }
        }
      )).data;
    } catch (t) {
      console.log("error", t);
    }
  }
), bw = wu(
  "bot/details",
  async (e) => {
    try {
      return (await Zr.post(`${window.baseUrl}/api/widget?botId=${e}`, {
        mode: "live"
      })).data;
    } catch (t) {
      console.log("error", t);
    }
  }
);
wu("event/ads-and-offer", async (e) => {
  try {
    return console.log({ data: e }), (await Zr.post(
      `${window.baseUrl}/api/widget/click`,
      {
        ...e.data
      },
      {
        headers: {
          Authorization: `Bearer ${e.token}`
        }
      }
    )).data;
  } catch (t) {
    console.log("error", t);
  }
});
wu(
  "translate",
  async (e) => {
    try {
      return (await Zr.post(
        `https://www.google.com/inputtools/request?text=${e.text}&itc=${e.lang}-t-i0-und&num=13&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`
      )).data;
    } catch (t) {
      console.log("TRANSLATE API AXIOS ERROR >>> ", t);
    }
  }
);
const xw = cI({
  name: "bot",
  initialState: {
    botSettings: {},
    botStyles: {},
    accessToken: "",
    visitorId: "",
    botName: "",
    headerDetails: {},
    messages: [],
    adsArr: [],
    offersArr: [],
    languages: [],
    widgetToken: null,
    isSoundOn: !0,
    isLocation: !1
  },
  reducers: {
    addMessage: (e, t) => {
      e.messages.push(t.payload);
    },
    clearMessages: (e) => {
      e.messages = [];
    },
    toggleSound: (e, t) => {
      e.isSoundOn = t.payload;
    }
  },
  extraReducers: (e) => {
    e.addCase(lo.fulfilled, (t, n) => {
      var r, o;
      t.accessToken = (r = n.payload) == null ? void 0 : r.accessToken, t.visitorId = (o = n.payload) == null ? void 0 : o.visitorId;
    }), e.addCase(bw.fulfilled, (t, n) => {
      var r, o, i, s, a, l, c, u, f, h;
      t.botSettings = (r = n.payload) == null ? void 0 : r.botSettings, t.botStyles = (o = n.payload) == null ? void 0 : o.botStyles, t.botName = (i = n.payload) == null ? void 0 : i.botName, t.adsArr = (s = n.payload) == null ? void 0 : s.advertisement, t.offersArr = (a = n.payload) == null ? void 0 : a.offer, t.languages = (c = (l = n.payload) == null ? void 0 : l.botSettings) == null ? void 0 : c.languages, t.widgetToken = (u = n.payload) == null ? void 0 : u.accessToken, t.isLocation = (h = (f = n.payload) == null ? void 0 : f.botSettings) == null ? void 0 : h.isLocation;
    });
  }
}), { addMessage: v6, clearMessages: TA, toggleSound: PA } = xw.actions, OA = xw.reducer, As = /^[a-z0-9]+(-[a-z0-9]+)*$/, Ru = (e, t, n, r = "") => {
  const o = e.split(":");
  if (e.slice(0, 1) === "@") {
    if (o.length < 2 || o.length > 3)
      return null;
    r = o.shift().slice(1);
  }
  if (o.length > 3 || !o.length)
    return null;
  if (o.length > 1) {
    const a = o.pop(), l = o.pop(), c = {
      provider: o.length > 0 ? o[0] : r,
      prefix: l,
      name: a
    };
    return t && !Al(c) ? null : c;
  }
  const i = o[0], s = i.split("-");
  if (s.length > 1) {
    const a = {
      provider: r,
      prefix: s.shift(),
      name: s.join("-")
    };
    return t && !Al(a) ? null : a;
  }
  if (n && r === "") {
    const a = {
      provider: r,
      prefix: "",
      name: i
    };
    return t && !Al(a, n) ? null : a;
  }
  return null;
}, Al = (e, t) => e ? !!((e.provider === "" || e.provider.match(As)) && (t && e.prefix === "" || e.prefix.match(As)) && e.name.match(As)) : !1, ww = Object.freeze({
  left: 0,
  top: 0,
  width: 16,
  height: 16
}), wc = Object.freeze({
  rotate: 0,
  vFlip: !1,
  hFlip: !1
}), pm = Object.freeze({
  ...ww,
  ...wc
}), np = Object.freeze({
  ...pm,
  body: "",
  hidden: !1
});
function $A(e, t) {
  const n = {};
  !e.hFlip != !t.hFlip && (n.hFlip = !0), !e.vFlip != !t.vFlip && (n.vFlip = !0);
  const r = ((e.rotate || 0) + (t.rotate || 0)) % 4;
  return r && (n.rotate = r), n;
}
function v0(e, t) {
  const n = $A(e, t);
  for (const r in np)
    r in wc ? r in e && !(r in n) && (n[r] = wc[r]) : r in t ? n[r] = t[r] : r in e && (n[r] = e[r]);
  return n;
}
function _A(e, t) {
  const n = e.icons, r = e.aliases || {}, o = /* @__PURE__ */ Object.create(null);
  function i(s) {
    if (n[s])
      return o[s] = [];
    if (!(s in o)) {
      o[s] = null;
      const a = r[s] && r[s].parent, l = a && i(a);
      l && (o[s] = [a].concat(l));
    }
    return o[s];
  }
  return (t || Object.keys(n).concat(Object.keys(r))).forEach(i), o;
}
function MA(e, t, n) {
  const r = e.icons, o = e.aliases || {};
  let i = {};
  function s(a) {
    i = v0(r[a] || o[a], i);
  }
  return s(t), n.forEach(s), v0(e, i);
}
function Sw(e, t) {
  const n = [];
  if (typeof e != "object" || typeof e.icons != "object")
    return n;
  e.not_found instanceof Array && e.not_found.forEach((o) => {
    t(o, null), n.push(o);
  });
  const r = _A(e);
  for (const o in r) {
    const i = r[o];
    i && (t(o, MA(e, o, i)), n.push(o));
  }
  return n;
}
const IA = {
  provider: "",
  aliases: {},
  not_found: {},
  ...ww
};
function Md(e, t) {
  for (const n in t)
    if (n in e && typeof e[n] != typeof t[n])
      return !1;
  return !0;
}
function Cw(e) {
  if (typeof e != "object" || e === null)
    return null;
  const t = e;
  if (typeof t.prefix != "string" || !e.icons || typeof e.icons != "object" || !Md(e, IA))
    return null;
  const n = t.icons;
  for (const o in n) {
    const i = n[o];
    if (!o.match(As) || typeof i.body != "string" || !Md(i, np))
      return null;
  }
  const r = t.aliases || {};
  for (const o in r) {
    const i = r[o], s = i.parent;
    if (!o.match(As) || typeof s != "string" || !n[s] && !r[s] || !Md(i, np))
      return null;
  }
  return t;
}
const y0 = /* @__PURE__ */ Object.create(null);
function AA(e, t) {
  return {
    provider: e,
    prefix: t,
    icons: /* @__PURE__ */ Object.create(null),
    missing: /* @__PURE__ */ new Set()
  };
}
function Oo(e, t) {
  const n = y0[e] || (y0[e] = /* @__PURE__ */ Object.create(null));
  return n[t] || (n[t] = AA(e, t));
}
function hm(e, t) {
  return Cw(t) ? Sw(t, (n, r) => {
    r ? e.icons[n] = r : e.missing.add(n);
  }) : [];
}
function NA(e, t, n) {
  try {
    if (typeof n.body == "string")
      return e.icons[t] = {
        ...n
      }, !0;
  } catch {
  }
  return !1;
}
let ga = !1;
function kw(e) {
  return typeof e == "boolean" && (ga = e), ga;
}
function LA(e) {
  const t = typeof e == "string" ? Ru(e, !0, ga) : e;
  if (t) {
    const n = Oo(t.provider, t.prefix), r = t.name;
    return n.icons[r] || (n.missing.has(r) ? null : void 0);
  }
}
function FA(e, t) {
  const n = Ru(e, !0, ga);
  if (!n)
    return !1;
  const r = Oo(n.provider, n.prefix);
  return NA(r, n.name, t);
}
function DA(e, t) {
  if (typeof e != "object")
    return !1;
  if (typeof t != "string" && (t = e.provider || ""), ga && !t && !e.prefix) {
    let o = !1;
    return Cw(e) && (e.prefix = "", Sw(e, (i, s) => {
      s && FA(i, s) && (o = !0);
    })), o;
  }
  const n = e.prefix;
  if (!Al({
    provider: t,
    prefix: n,
    name: "a"
  }))
    return !1;
  const r = Oo(t, n);
  return !!hm(r, e);
}
const Ew = Object.freeze({
  width: null,
  height: null
}), Rw = Object.freeze({
  ...Ew,
  ...wc
}), zA = /(-?[0-9.]*[0-9]+[0-9.]*)/g, BA = /^-?[0-9.]*[0-9]+[0-9.]*$/g;
function b0(e, t, n) {
  if (t === 1)
    return e;
  if (n = n || 100, typeof e == "number")
    return Math.ceil(e * t * n) / n;
  if (typeof e != "string")
    return e;
  const r = e.split(zA);
  if (r === null || !r.length)
    return e;
  const o = [];
  let i = r.shift(), s = BA.test(i);
  for (; ; ) {
    if (s) {
      const a = parseFloat(i);
      isNaN(a) ? o.push(i) : o.push(Math.ceil(a * t * n) / n);
    } else
      o.push(i);
    if (i = r.shift(), i === void 0)
      return o.join("");
    s = !s;
  }
}
function jA(e, t) {
  const n = {
    ...pm,
    ...e
  }, r = {
    ...Rw,
    ...t
  }, o = {
    left: n.left,
    top: n.top,
    width: n.width,
    height: n.height
  };
  let i = n.body;
  [n, r].forEach((y) => {
    const d = [], m = y.hFlip, w = y.vFlip;
    let g = y.rotate;
    m ? w ? g += 2 : (d.push("translate(" + (o.width + o.left).toString() + " " + (0 - o.top).toString() + ")"), d.push("scale(-1 1)"), o.top = o.left = 0) : w && (d.push("translate(" + (0 - o.left).toString() + " " + (o.height + o.top).toString() + ")"), d.push("scale(1 -1)"), o.top = o.left = 0);
    let p;
    switch (g < 0 && (g -= Math.floor(g / 4) * 4), g = g % 4, g) {
      case 1:
        p = o.height / 2 + o.top, d.unshift("rotate(90 " + p.toString() + " " + p.toString() + ")");
        break;
      case 2:
        d.unshift("rotate(180 " + (o.width / 2 + o.left).toString() + " " + (o.height / 2 + o.top).toString() + ")");
        break;
      case 3:
        p = o.width / 2 + o.left, d.unshift("rotate(-90 " + p.toString() + " " + p.toString() + ")");
        break;
    }
    g % 2 === 1 && (o.left !== o.top && (p = o.left, o.left = o.top, o.top = p), o.width !== o.height && (p = o.width, o.width = o.height, o.height = p)), d.length && (i = '<g transform="' + d.join(" ") + '">' + i + "</g>");
  });
  const s = r.width, a = r.height, l = o.width, c = o.height;
  let u, f;
  return s === null ? (f = a === null ? "1em" : a === "auto" ? c : a, u = b0(f, l / c)) : (u = s === "auto" ? l : s, f = a === null ? b0(u, c / l) : a === "auto" ? c : a), {
    attributes: {
      width: u.toString(),
      height: f.toString(),
      viewBox: o.left.toString() + " " + o.top.toString() + " " + l.toString() + " " + c.toString()
    },
    body: i
  };
}
const WA = /\sid="(\S+)"/g, UA = "IconifyId" + Date.now().toString(16) + (Math.random() * 16777216 | 0).toString(16);
let HA = 0;
function VA(e, t = UA) {
  const n = [];
  let r;
  for (; r = WA.exec(e); )
    n.push(r[1]);
  return n.length && n.forEach((o) => {
    const i = typeof t == "function" ? t(o) : t + (HA++).toString(), s = o.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    e = e.replace(new RegExp('([#;"])(' + s + ')([")]|\\.[a-z])', "g"), "$1" + i + "$3");
  }), e;
}
const rp = /* @__PURE__ */ Object.create(null);
function YA(e, t) {
  rp[e] = t;
}
function op(e) {
  return rp[e] || rp[""];
}
function mm(e) {
  let t;
  if (typeof e.resources == "string")
    t = [e.resources];
  else if (t = e.resources, !(t instanceof Array) || !t.length)
    return null;
  return {
    resources: t,
    path: e.path || "/",
    maxURL: e.maxURL || 500,
    rotate: e.rotate || 750,
    timeout: e.timeout || 5e3,
    random: e.random === !0,
    index: e.index || 0,
    dataAfterTimeout: e.dataAfterTimeout !== !1
  };
}
const gm = /* @__PURE__ */ Object.create(null), rs = ["https://api.simplesvg.com", "https://api.unisvg.com"], Nl = [];
for (; rs.length > 0; )
  rs.length === 1 || Math.random() > 0.5 ? Nl.push(rs.shift()) : Nl.push(rs.pop());
gm[""] = mm({
  resources: ["https://api.iconify.design"].concat(Nl)
});
function XA(e, t) {
  const n = mm(t);
  return n === null ? !1 : (gm[e] = n, !0);
}
function vm(e) {
  return gm[e];
}
const KA = () => {
  let e;
  try {
    if (e = fetch, typeof e == "function")
      return e;
  } catch {
  }
};
let x0 = KA();
function qA(e, t) {
  const n = vm(e);
  if (!n)
    return 0;
  let r;
  if (!n.maxURL)
    r = 0;
  else {
    let o = 0;
    n.resources.forEach((s) => {
      o = Math.max(o, s.length);
    });
    const i = t + ".json?icons=";
    r = n.maxURL - o - n.path.length - i.length;
  }
  return r;
}
function GA(e) {
  return e === 404;
}
const QA = (e, t, n) => {
  const r = [], o = qA(e, t), i = "icons";
  let s = {
    type: i,
    provider: e,
    prefix: t,
    icons: []
  }, a = 0;
  return n.forEach((l, c) => {
    a += l.length + 1, a >= o && c > 0 && (r.push(s), s = {
      type: i,
      provider: e,
      prefix: t,
      icons: []
    }, a = l.length), s.icons.push(l);
  }), r.push(s), r;
};
function JA(e) {
  if (typeof e == "string") {
    const t = vm(e);
    if (t)
      return t.path;
  }
  return "/";
}
const ZA = (e, t, n) => {
  if (!x0) {
    n("abort", 424);
    return;
  }
  let r = JA(t.provider);
  switch (t.type) {
    case "icons": {
      const i = t.prefix, a = t.icons.join(","), l = new URLSearchParams({
        icons: a
      });
      r += i + ".json?" + l.toString();
      break;
    }
    case "custom": {
      const i = t.uri;
      r += i.slice(0, 1) === "/" ? i.slice(1) : i;
      break;
    }
    default:
      n("abort", 400);
      return;
  }
  let o = 503;
  x0(e + r).then((i) => {
    const s = i.status;
    if (s !== 200) {
      setTimeout(() => {
        n(GA(s) ? "abort" : "next", s);
      });
      return;
    }
    return o = 501, i.json();
  }).then((i) => {
    if (typeof i != "object" || i === null) {
      setTimeout(() => {
        n("next", o);
      });
      return;
    }
    setTimeout(() => {
      n("success", i);
    });
  }).catch(() => {
    n("next", o);
  });
}, eN = {
  prepare: QA,
  send: ZA
};
function tN(e) {
  const t = {
    loaded: [],
    missing: [],
    pending: []
  }, n = /* @__PURE__ */ Object.create(null);
  e.sort((o, i) => o.provider !== i.provider ? o.provider.localeCompare(i.provider) : o.prefix !== i.prefix ? o.prefix.localeCompare(i.prefix) : o.name.localeCompare(i.name));
  let r = {
    provider: "",
    prefix: "",
    name: ""
  };
  return e.forEach((o) => {
    if (r.name === o.name && r.prefix === o.prefix && r.provider === o.provider)
      return;
    r = o;
    const i = o.provider, s = o.prefix, a = o.name, l = n[i] || (n[i] = /* @__PURE__ */ Object.create(null)), c = l[s] || (l[s] = Oo(i, s));
    let u;
    a in c.icons ? u = t.loaded : s === "" || c.missing.has(a) ? u = t.missing : u = t.pending;
    const f = {
      provider: i,
      prefix: s,
      name: a
    };
    u.push(f);
  }), t;
}
function Tw(e, t) {
  e.forEach((n) => {
    const r = n.loaderCallbacks;
    r && (n.loaderCallbacks = r.filter((o) => o.id !== t));
  });
}
function nN(e) {
  e.pendingCallbacksFlag || (e.pendingCallbacksFlag = !0, setTimeout(() => {
    e.pendingCallbacksFlag = !1;
    const t = e.loaderCallbacks ? e.loaderCallbacks.slice(0) : [];
    if (!t.length)
      return;
    let n = !1;
    const r = e.provider, o = e.prefix;
    t.forEach((i) => {
      const s = i.icons, a = s.pending.length;
      s.pending = s.pending.filter((l) => {
        if (l.prefix !== o)
          return !0;
        const c = l.name;
        if (e.icons[c])
          s.loaded.push({
            provider: r,
            prefix: o,
            name: c
          });
        else if (e.missing.has(c))
          s.missing.push({
            provider: r,
            prefix: o,
            name: c
          });
        else
          return n = !0, !0;
        return !1;
      }), s.pending.length !== a && (n || Tw([e], i.id), i.callback(s.loaded.slice(0), s.missing.slice(0), s.pending.slice(0), i.abort));
    });
  }));
}
let rN = 0;
function oN(e, t, n) {
  const r = rN++, o = Tw.bind(null, n, r);
  if (!t.pending.length)
    return o;
  const i = {
    id: r,
    icons: t,
    callback: e,
    abort: o
  };
  return n.forEach((s) => {
    (s.loaderCallbacks || (s.loaderCallbacks = [])).push(i);
  }), o;
}
function iN(e, t = !0, n = !1) {
  const r = [];
  return e.forEach((o) => {
    const i = typeof o == "string" ? Ru(o, t, n) : o;
    i && r.push(i);
  }), r;
}
var sN = {
  resources: [],
  index: 0,
  timeout: 2e3,
  rotate: 750,
  random: !1,
  dataAfterTimeout: !1
};
function aN(e, t, n, r) {
  const o = e.resources.length, i = e.random ? Math.floor(Math.random() * o) : e.index;
  let s;
  if (e.random) {
    let E = e.resources.slice(0);
    for (s = []; E.length > 1; ) {
      const R = Math.floor(Math.random() * E.length);
      s.push(E[R]), E = E.slice(0, R).concat(E.slice(R + 1));
    }
    s = s.concat(E);
  } else
    s = e.resources.slice(i).concat(e.resources.slice(0, i));
  const a = Date.now();
  let l = "pending", c = 0, u, f = null, h = [], y = [];
  typeof r == "function" && y.push(r);
  function d() {
    f && (clearTimeout(f), f = null);
  }
  function m() {
    l === "pending" && (l = "aborted"), d(), h.forEach((E) => {
      E.status === "pending" && (E.status = "aborted");
    }), h = [];
  }
  function w(E, R) {
    R && (y = []), typeof E == "function" && y.push(E);
  }
  function g() {
    return {
      startTime: a,
      payload: t,
      status: l,
      queriesSent: c,
      queriesPending: h.length,
      subscribe: w,
      abort: m
    };
  }
  function p() {
    l = "failed", y.forEach((E) => {
      E(void 0, u);
    });
  }
  function v() {
    h.forEach((E) => {
      E.status === "pending" && (E.status = "aborted");
    }), h = [];
  }
  function b(E, R, T) {
    const O = R !== "success";
    switch (h = h.filter((P) => P !== E), l) {
      case "pending":
        break;
      case "failed":
        if (O || !e.dataAfterTimeout)
          return;
        break;
      default:
        return;
    }
    if (R === "abort") {
      u = T, p();
      return;
    }
    if (O) {
      u = T, h.length || (s.length ? C() : p());
      return;
    }
    if (d(), v(), !e.random) {
      const P = e.resources.indexOf(E.resource);
      P !== -1 && P !== e.index && (e.index = P);
    }
    l = "completed", y.forEach((P) => {
      P(T);
    });
  }
  function C() {
    if (l !== "pending")
      return;
    d();
    const E = s.shift();
    if (E === void 0) {
      if (h.length) {
        f = setTimeout(() => {
          d(), l === "pending" && (v(), p());
        }, e.timeout);
        return;
      }
      p();
      return;
    }
    const R = {
      status: "pending",
      resource: E,
      callback: (T, O) => {
        b(R, T, O);
      }
    };
    h.push(R), c++, f = setTimeout(C, e.rotate), n(E, t, R.callback);
  }
  return setTimeout(C), g;
}
function Pw(e) {
  const t = {
    ...sN,
    ...e
  };
  let n = [];
  function r() {
    n = n.filter((a) => a().status === "pending");
  }
  function o(a, l, c) {
    const u = aN(t, a, l, (f, h) => {
      r(), c && c(f, h);
    });
    return n.push(u), u;
  }
  function i(a) {
    return n.find((l) => a(l)) || null;
  }
  return {
    query: o,
    find: i,
    setIndex: (a) => {
      t.index = a;
    },
    getIndex: () => t.index,
    cleanup: r
  };
}
function w0() {
}
const Id = /* @__PURE__ */ Object.create(null);
function lN(e) {
  if (!Id[e]) {
    const t = vm(e);
    if (!t)
      return;
    const n = Pw(t), r = {
      config: t,
      redundancy: n
    };
    Id[e] = r;
  }
  return Id[e];
}
function cN(e, t, n) {
  let r, o;
  if (typeof e == "string") {
    const i = op(e);
    if (!i)
      return n(void 0, 424), w0;
    o = i.send;
    const s = lN(e);
    s && (r = s.redundancy);
  } else {
    const i = mm(e);
    if (i) {
      r = Pw(i);
      const s = e.resources ? e.resources[0] : "", a = op(s);
      a && (o = a.send);
    }
  }
  return !r || !o ? (n(void 0, 424), w0) : r.query(t, o, n)().abort;
}
const S0 = "iconify2", va = "iconify", Ow = va + "-count", C0 = va + "-version", $w = 36e5, uN = 168;
function ip(e, t) {
  try {
    return e.getItem(t);
  } catch {
  }
}
function ym(e, t, n) {
  try {
    return e.setItem(t, n), !0;
  } catch {
  }
}
function k0(e, t) {
  try {
    e.removeItem(t);
  } catch {
  }
}
function sp(e, t) {
  return ym(e, Ow, t.toString());
}
function ap(e) {
  return parseInt(ip(e, Ow)) || 0;
}
const Tu = {
  local: !0,
  session: !0
}, _w = {
  local: /* @__PURE__ */ new Set(),
  session: /* @__PURE__ */ new Set()
};
let bm = !1;
function dN(e) {
  bm = e;
}
let rl = typeof window > "u" ? {} : window;
function Mw(e) {
  const t = e + "Storage";
  try {
    if (rl && rl[t] && typeof rl[t].length == "number")
      return rl[t];
  } catch {
  }
  Tu[e] = !1;
}
function Iw(e, t) {
  const n = Mw(e);
  if (!n)
    return;
  const r = ip(n, C0);
  if (r !== S0) {
    if (r) {
      const a = ap(n);
      for (let l = 0; l < a; l++)
        k0(n, va + l.toString());
    }
    ym(n, C0, S0), sp(n, 0);
    return;
  }
  const o = Math.floor(Date.now() / $w) - uN, i = (a) => {
    const l = va + a.toString(), c = ip(n, l);
    if (typeof c == "string") {
      try {
        const u = JSON.parse(c);
        if (typeof u == "object" && typeof u.cached == "number" && u.cached > o && typeof u.provider == "string" && typeof u.data == "object" && typeof u.data.prefix == "string" && t(u, a))
          return !0;
      } catch {
      }
      k0(n, l);
    }
  };
  let s = ap(n);
  for (let a = s - 1; a >= 0; a--)
    i(a) || (a === s - 1 ? (s--, sp(n, s)) : _w[e].add(a));
}
function Aw() {
  if (!bm) {
    dN(!0);
    for (const e in Tu)
      Iw(e, (t) => {
        const n = t.data, r = t.provider, o = n.prefix, i = Oo(r, o);
        if (!hm(i, n).length)
          return !1;
        const s = n.lastModified || -1;
        return i.lastModifiedCached = i.lastModifiedCached ? Math.min(i.lastModifiedCached, s) : s, !0;
      });
  }
}
function fN(e, t) {
  const n = e.lastModifiedCached;
  if (n && n >= t)
    return n === t;
  if (e.lastModifiedCached = t, n)
    for (const r in Tu)
      Iw(r, (o) => {
        const i = o.data;
        return o.provider !== e.provider || i.prefix !== e.prefix || i.lastModified === t;
      });
  return !0;
}
function pN(e, t) {
  bm || Aw();
  function n(r) {
    let o;
    if (!Tu[r] || !(o = Mw(r)))
      return;
    const i = _w[r];
    let s;
    if (i.size)
      i.delete(s = Array.from(i).shift());
    else if (s = ap(o), !sp(o, s + 1))
      return;
    const a = {
      cached: Math.floor(Date.now() / $w),
      provider: e.provider,
      data: t
    };
    return ym(o, va + s.toString(), JSON.stringify(a));
  }
  t.lastModified && !fN(e, t.lastModified) || !Object.keys(t.icons).length || (t.not_found && (t = Object.assign({}, t), delete t.not_found), n("local") || n("session"));
}
function E0() {
}
function hN(e) {
  e.iconsLoaderFlag || (e.iconsLoaderFlag = !0, setTimeout(() => {
    e.iconsLoaderFlag = !1, nN(e);
  }));
}
function mN(e, t) {
  e.iconsToLoad ? e.iconsToLoad = e.iconsToLoad.concat(t).sort() : e.iconsToLoad = t, e.iconsQueueFlag || (e.iconsQueueFlag = !0, setTimeout(() => {
    e.iconsQueueFlag = !1;
    const {
      provider: n,
      prefix: r
    } = e, o = e.iconsToLoad;
    delete e.iconsToLoad;
    let i;
    if (!o || !(i = op(n)))
      return;
    i.prepare(n, r, o).forEach((a) => {
      cN(n, a, (l, c) => {
        if (typeof l != "object") {
          if (c !== 404)
            return;
          a.icons.forEach((u) => {
            e.missing.add(u);
          });
        } else
          try {
            const u = hm(e, l);
            if (!u.length)
              return;
            const f = e.pendingIcons;
            f && u.forEach((h) => {
              f.delete(h);
            }), pN(e, l);
          } catch (u) {
            console.error(u);
          }
        hN(e);
      });
    });
  }));
}
const gN = (e, t) => {
  const n = iN(e, !0, kw()), r = tN(n);
  if (!r.pending.length) {
    let l = !0;
    return t && setTimeout(() => {
      l && t(r.loaded, r.missing, r.pending, E0);
    }), () => {
      l = !1;
    };
  }
  const o = /* @__PURE__ */ Object.create(null), i = [];
  let s, a;
  return r.pending.forEach((l) => {
    const {
      provider: c,
      prefix: u
    } = l;
    if (u === a && c === s)
      return;
    s = c, a = u, i.push(Oo(c, u));
    const f = o[c] || (o[c] = /* @__PURE__ */ Object.create(null));
    f[u] || (f[u] = []);
  }), r.pending.forEach((l) => {
    const {
      provider: c,
      prefix: u,
      name: f
    } = l, h = Oo(c, u), y = h.pendingIcons || (h.pendingIcons = /* @__PURE__ */ new Set());
    y.has(f) || (y.add(f), o[c][u].push(f));
  }), i.forEach((l) => {
    const {
      provider: c,
      prefix: u
    } = l;
    o[c][u].length && mN(l, o[c][u]);
  }), t ? oN(t, r, i) : E0;
};
function vN(e, t) {
  const n = {
    ...e
  };
  for (const r in t) {
    const o = t[r], i = typeof o;
    r in Ew ? (o === null || o && (i === "string" || i === "number")) && (n[r] = o) : i === typeof n[r] && (n[r] = r === "rotate" ? o % 4 : o);
  }
  return n;
}
const yN = /[\s,]+/;
function bN(e, t) {
  t.split(yN).forEach((n) => {
    switch (n.trim()) {
      case "horizontal":
        e.hFlip = !0;
        break;
      case "vertical":
        e.vFlip = !0;
        break;
    }
  });
}
function xN(e, t = 0) {
  const n = e.replace(/^-?[0-9.]*/, "");
  function r(o) {
    for (; o < 0; )
      o += 4;
    return o % 4;
  }
  if (n === "") {
    const o = parseInt(e);
    return isNaN(o) ? 0 : r(o);
  } else if (n !== e) {
    let o = 0;
    switch (n) {
      case "%":
        o = 25;
        break;
      case "deg":
        o = 90;
    }
    if (o) {
      let i = parseFloat(e.slice(0, e.length - n.length));
      return isNaN(i) ? 0 : (i = i / o, i % 1 === 0 ? r(i) : 0);
    }
  }
  return t;
}
function wN(e, t) {
  let n = e.indexOf("xlink:") === -1 ? "" : ' xmlns:xlink="http://www.w3.org/1999/xlink"';
  for (const r in t)
    n += " " + r + '="' + t[r] + '"';
  return '<svg xmlns="http://www.w3.org/2000/svg"' + n + ">" + e + "</svg>";
}
function SN(e) {
  return e.replace(/"/g, "'").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\s+/g, " ");
}
function CN(e) {
  return 'url("data:image/svg+xml,' + SN(e) + '")';
}
const Nw = {
  ...Rw,
  inline: !1
}, kN = {
  xmlns: "http://www.w3.org/2000/svg",
  xmlnsXlink: "http://www.w3.org/1999/xlink",
  "aria-hidden": !0,
  role: "img"
}, EN = {
  display: "inline-block"
}, lp = {
  backgroundColor: "currentColor"
}, Lw = {
  backgroundColor: "transparent"
}, R0 = {
  Image: "var(--svg)",
  Repeat: "no-repeat",
  Size: "100% 100%"
}, T0 = {
  webkitMask: lp,
  mask: lp,
  background: Lw
};
for (const e in T0) {
  const t = T0[e];
  for (const n in R0)
    t[e + n] = R0[n];
}
const RN = {
  ...Nw,
  inline: !0
};
function P0(e) {
  return e + (e.match(/^[-0-9.]+$/) ? "px" : "");
}
const TN = (e, t, n, r) => {
  const o = n ? RN : Nw, i = vN(o, t), s = t.mode || "svg", a = {}, l = t.style || {}, c = {
    ...s === "svg" ? kN : {},
    ref: r
  };
  for (let g in t) {
    const p = t[g];
    if (p !== void 0)
      switch (g) {
        case "icon":
        case "style":
        case "children":
        case "onLoad":
        case "mode":
        case "_ref":
        case "_inline":
          break;
        case "inline":
        case "hFlip":
        case "vFlip":
          i[g] = p === !0 || p === "true" || p === 1;
          break;
        case "flip":
          typeof p == "string" && bN(i, p);
          break;
        case "color":
          a.color = p;
          break;
        case "rotate":
          typeof p == "string" ? i[g] = xN(p) : typeof p == "number" && (i[g] = p);
          break;
        case "ariaHidden":
        case "aria-hidden":
          p !== !0 && p !== "true" && delete c["aria-hidden"];
          break;
        default:
          o[g] === void 0 && (c[g] = p);
      }
  }
  const u = jA(e, i), f = u.attributes;
  if (i.inline && (a.verticalAlign = "-0.125em"), s === "svg") {
    c.style = {
      ...a,
      ...l
    }, Object.assign(c, f);
    let g = 0, p = t.id;
    return typeof p == "string" && (p = p.replace(/-/g, "_")), c.dangerouslySetInnerHTML = {
      __html: VA(u.body, p ? () => p + "ID" + g++ : "iconifyReact")
    }, /* @__PURE__ */ S("svg", {
      ...c
    });
  }
  const {
    body: h,
    width: y,
    height: d
  } = e, m = s === "mask" || (s === "bg" ? !1 : h.indexOf("currentColor") !== -1), w = wN(h, {
    ...f,
    width: y + "",
    height: d + ""
  });
  return c.style = {
    ...a,
    "--svg": CN(w),
    width: P0(f.width),
    height: P0(f.height),
    ...EN,
    ...m ? lp : Lw,
    ...l
  }, /* @__PURE__ */ S("span", {
    ...c
  });
};
kw(!0);
YA("", eN);
if (typeof document < "u" && typeof window < "u") {
  Aw();
  const e = window;
  if (e.IconifyPreload !== void 0) {
    const t = e.IconifyPreload, n = "Invalid IconifyPreload syntax.";
    typeof t == "object" && t !== null && (t instanceof Array ? t : [t]).forEach((r) => {
      try {
        (typeof r != "object" || r === null || r instanceof Array || typeof r.icons != "object" || typeof r.prefix != "string" || !DA(r)) && console.error(n);
      } catch {
        console.error(n);
      }
    });
  }
  if (e.IconifyProviders !== void 0) {
    const t = e.IconifyProviders;
    if (typeof t == "object" && t !== null)
      for (let n in t) {
        const r = "IconifyProviders[" + n + "] is invalid.";
        try {
          const o = t[n];
          if (typeof o != "object" || !o || o.resources === void 0)
            continue;
          XA(n, o) || console.error(r);
        } catch {
          console.error(r);
        }
      }
  }
}
class Fw extends Pe.Component {
  constructor(t) {
    super(t), this.state = {
      icon: null
    };
  }
  _abortLoading() {
    this._loading && (this._loading.abort(), this._loading = null);
  }
  _setData(t) {
    this.state.icon !== t && this.setState({
      icon: t
    });
  }
  _checkIcon(t) {
    const n = this.state, r = this.props.icon;
    if (typeof r == "object" && r !== null && typeof r.body == "string") {
      this._icon = "", this._abortLoading(), (t || n.icon === null) && this._setData({
        data: r
      });
      return;
    }
    let o;
    if (typeof r != "string" || (o = Ru(r, !1, !0)) === null) {
      this._abortLoading(), this._setData(null);
      return;
    }
    const i = LA(o);
    if (!i) {
      (!this._loading || this._loading.name !== r) && (this._abortLoading(), this._icon = "", this._setData(null), i !== null && (this._loading = {
        name: r,
        abort: gN([o], this._checkIcon.bind(this, !1))
      }));
      return;
    }
    if (this._icon !== r || n.icon === null) {
      this._abortLoading(), this._icon = r;
      const s = ["iconify"];
      o.prefix !== "" && s.push("iconify--" + o.prefix), o.provider !== "" && s.push("iconify--" + o.provider), this._setData({
        data: i,
        classes: s
      }), this.props.onLoad && this.props.onLoad(r);
    }
  }
  componentDidMount() {
    this._checkIcon(!1);
  }
  componentDidUpdate(t) {
    t.icon !== this.props.icon && this._checkIcon(!0);
  }
  componentWillUnmount() {
    this._abortLoading();
  }
  render() {
    const t = this.props, n = this.state.icon;
    if (n === null)
      return t.children ? t.children : /* @__PURE__ */ S("span", {});
    let r = t;
    return n.classes && (r = {
      ...t,
      className: (typeof t.className == "string" ? t.className + " " : "") + n.classes.join(" ")
    }), TN({
      ...pm,
      ...n.data
    }, r, t._inline, t._ref);
  }
}
const ct = Pe.forwardRef(function(t, n) {
  const r = {
    ...t,
    _ref: n,
    _inline: !1
  };
  return /* @__PURE__ */ S(Fw, {
    ...r
  });
});
Pe.forwardRef(function(t, n) {
  const r = {
    ...t,
    _ref: n,
    _inline: !0
  };
  return /* @__PURE__ */ S(Fw, {
    ...r
  });
});
const Dw = (e) => e.scrollTop;
function Sc(e, t) {
  var n, r;
  const {
    timeout: o,
    easing: i,
    style: s = {}
  } = e;
  return {
    duration: (n = s.transitionDuration) != null ? n : typeof o == "number" ? o : o[t.mode] || 0,
    easing: (r = s.transitionTimingFunction) != null ? r : typeof i == "object" ? i[t.mode] : i,
    delay: s.transitionDelay
  };
}
const PN = ["addEndListener", "appear", "children", "easing", "in", "onEnter", "onEntered", "onEntering", "onExit", "onExited", "onExiting", "style", "timeout", "TransitionComponent"];
function cp(e) {
  return `scale(${e}, ${e ** 2})`;
}
const ON = {
  entering: {
    opacity: 1,
    transform: cp(1)
  },
  entered: {
    opacity: 1,
    transform: "none"
  }
}, Ad = typeof navigator < "u" && /^((?!chrome|android).)*(safari|mobile)/i.test(navigator.userAgent) && /(os |version\/)15(.|_)4/i.test(navigator.userAgent), zw = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const {
    addEndListener: r,
    appear: o = !0,
    children: i,
    easing: s,
    in: a,
    onEnter: l,
    onEntered: c,
    onEntering: u,
    onExit: f,
    onExited: h,
    onExiting: y,
    style: d,
    timeout: m = "auto",
    TransitionComponent: w = Hx
  } = t, g = Q(t, PN), p = x.exports.useRef(), v = x.exports.useRef(), b = Mo(), C = x.exports.useRef(null), E = Qe(C, i.ref, n), R = (M) => (A) => {
    if (M) {
      const j = C.current;
      A === void 0 ? M(j) : M(j, A);
    }
  }, T = R(u), O = R((M, A) => {
    Dw(M);
    const {
      duration: j,
      delay: _,
      easing: z
    } = Sc({
      style: d,
      timeout: m,
      easing: s
    }, {
      mode: "enter"
    });
    let F;
    m === "auto" ? (F = b.transitions.getAutoHeightDuration(M.clientHeight), v.current = F) : F = j, M.style.transition = [b.transitions.create("opacity", {
      duration: F,
      delay: _
    }), b.transitions.create("transform", {
      duration: Ad ? F : F * 0.666,
      delay: _,
      easing: z
    })].join(","), l && l(M, A);
  }), P = R(c), $ = R(y), B = R((M) => {
    const {
      duration: A,
      delay: j,
      easing: _
    } = Sc({
      style: d,
      timeout: m,
      easing: s
    }, {
      mode: "exit"
    });
    let z;
    m === "auto" ? (z = b.transitions.getAutoHeightDuration(M.clientHeight), v.current = z) : z = A, M.style.transition = [b.transitions.create("opacity", {
      duration: z,
      delay: j
    }), b.transitions.create("transform", {
      duration: Ad ? z : z * 0.666,
      delay: Ad ? j : j || z * 0.333,
      easing: _
    })].join(","), M.style.opacity = 0, M.style.transform = cp(0.75), f && f(M);
  }), D = R(h), I = (M) => {
    m === "auto" && (p.current = setTimeout(M, v.current || 0)), r && r(C.current, M);
  };
  return x.exports.useEffect(() => () => {
    clearTimeout(p.current);
  }, []), /* @__PURE__ */ S(w, k({
    appear: o,
    in: a,
    nodeRef: C,
    onEnter: O,
    onEntered: P,
    onEntering: T,
    onExit: B,
    onExited: D,
    onExiting: $,
    addEndListener: I,
    timeout: m === "auto" ? null : m
  }, g, {
    children: (M, A) => /* @__PURE__ */ x.exports.cloneElement(i, k({
      style: k({
        opacity: 0,
        transform: cp(0.75),
        visibility: M === "exited" && !a ? "hidden" : void 0
      }, ON[M], d, i.props.style),
      ref: E
    }, A))
  }));
});
zw.muiSupportAuto = !0;
const Cc = zw, $N = ["components", "componentsProps", "slots", "slotProps"], _N = U(y$, {
  name: "MuiPopper",
  slot: "Root",
  overridesResolver: (e, t) => t.root
})({}), MN = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r;
  const o = jh(), i = ve({
    props: t,
    name: "MuiPopper"
  }), {
    components: s,
    componentsProps: a,
    slots: l,
    slotProps: c
  } = i, u = Q(i, $N), f = (r = l == null ? void 0 : l.root) != null ? r : s == null ? void 0 : s.Root;
  return /* @__PURE__ */ S(_N, k({
    direction: o == null ? void 0 : o.direction,
    slots: {
      root: f
    },
    slotProps: c != null ? c : a
  }, u, {
    ref: n
  }));
}), Bw = MN;
function IN(e) {
  return he("MuiTooltip", e);
}
const AN = fe("MuiTooltip", ["popper", "popperInteractive", "popperArrow", "popperClose", "tooltip", "tooltipArrow", "touch", "tooltipPlacementLeft", "tooltipPlacementRight", "tooltipPlacementTop", "tooltipPlacementBottom", "arrow"]), Or = AN, NN = ["arrow", "children", "classes", "components", "componentsProps", "describeChild", "disableFocusListener", "disableHoverListener", "disableInteractive", "disableTouchListener", "enterDelay", "enterNextDelay", "enterTouchDelay", "followCursor", "id", "leaveDelay", "leaveTouchDelay", "onClose", "onOpen", "open", "placement", "PopperComponent", "PopperProps", "slotProps", "slots", "title", "TransitionComponent", "TransitionProps"];
function LN(e) {
  return Math.round(e * 1e5) / 1e5;
}
const FN = (e) => {
  const {
    classes: t,
    disableInteractive: n,
    arrow: r,
    touch: o,
    placement: i
  } = e, s = {
    popper: ["popper", !n && "popperInteractive", r && "popperArrow"],
    tooltip: ["tooltip", r && "tooltipArrow", o && "touch", `tooltipPlacement${N(i.split("-")[0])}`],
    arrow: ["arrow"]
  };
  return me(s, IN, t);
}, DN = U(Bw, {
  name: "MuiTooltip",
  slot: "Popper",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.popper, !n.disableInteractive && t.popperInteractive, n.arrow && t.popperArrow, !n.open && t.popperClose];
  }
})(({
  theme: e,
  ownerState: t,
  open: n
}) => k({
  zIndex: (e.vars || e).zIndex.tooltip,
  pointerEvents: "none"
}, !t.disableInteractive && {
  pointerEvents: "auto"
}, !n && {
  pointerEvents: "none"
}, t.arrow && {
  [`&[data-popper-placement*="bottom"] .${Or.arrow}`]: {
    top: 0,
    marginTop: "-0.71em",
    "&::before": {
      transformOrigin: "0 100%"
    }
  },
  [`&[data-popper-placement*="top"] .${Or.arrow}`]: {
    bottom: 0,
    marginBottom: "-0.71em",
    "&::before": {
      transformOrigin: "100% 0"
    }
  },
  [`&[data-popper-placement*="right"] .${Or.arrow}`]: k({}, t.isRtl ? {
    right: 0,
    marginRight: "-0.71em"
  } : {
    left: 0,
    marginLeft: "-0.71em"
  }, {
    height: "1em",
    width: "0.71em",
    "&::before": {
      transformOrigin: "100% 100%"
    }
  }),
  [`&[data-popper-placement*="left"] .${Or.arrow}`]: k({}, t.isRtl ? {
    left: 0,
    marginLeft: "-0.71em"
  } : {
    right: 0,
    marginRight: "-0.71em"
  }, {
    height: "1em",
    width: "0.71em",
    "&::before": {
      transformOrigin: "0 0"
    }
  })
})), zN = U("div", {
  name: "MuiTooltip",
  slot: "Tooltip",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.tooltip, n.touch && t.touch, n.arrow && t.tooltipArrow, t[`tooltipPlacement${N(n.placement.split("-")[0])}`]];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  backgroundColor: e.vars ? e.vars.palette.Tooltip.bg : Ie(e.palette.grey[700], 0.92),
  borderRadius: (e.vars || e).shape.borderRadius,
  color: (e.vars || e).palette.common.white,
  fontFamily: e.typography.fontFamily,
  padding: "4px 8px",
  fontSize: e.typography.pxToRem(11),
  maxWidth: 300,
  margin: 2,
  wordWrap: "break-word",
  fontWeight: e.typography.fontWeightMedium
}, t.arrow && {
  position: "relative",
  margin: 0
}, t.touch && {
  padding: "8px 16px",
  fontSize: e.typography.pxToRem(14),
  lineHeight: `${LN(16 / 14)}em`,
  fontWeight: e.typography.fontWeightRegular
}, {
  [`.${Or.popper}[data-popper-placement*="left"] &`]: k({
    transformOrigin: "right center"
  }, t.isRtl ? k({
    marginLeft: "14px"
  }, t.touch && {
    marginLeft: "24px"
  }) : k({
    marginRight: "14px"
  }, t.touch && {
    marginRight: "24px"
  })),
  [`.${Or.popper}[data-popper-placement*="right"] &`]: k({
    transformOrigin: "left center"
  }, t.isRtl ? k({
    marginRight: "14px"
  }, t.touch && {
    marginRight: "24px"
  }) : k({
    marginLeft: "14px"
  }, t.touch && {
    marginLeft: "24px"
  })),
  [`.${Or.popper}[data-popper-placement*="top"] &`]: k({
    transformOrigin: "center bottom",
    marginBottom: "14px"
  }, t.touch && {
    marginBottom: "24px"
  }),
  [`.${Or.popper}[data-popper-placement*="bottom"] &`]: k({
    transformOrigin: "center top",
    marginTop: "14px"
  }, t.touch && {
    marginTop: "24px"
  })
})), BN = U("span", {
  name: "MuiTooltip",
  slot: "Arrow",
  overridesResolver: (e, t) => t.arrow
})(({
  theme: e
}) => ({
  overflow: "hidden",
  position: "absolute",
  width: "1em",
  height: "0.71em",
  boxSizing: "border-box",
  color: e.vars ? e.vars.palette.Tooltip.bg : Ie(e.palette.grey[700], 0.9),
  "&::before": {
    content: '""',
    margin: "auto",
    display: "block",
    width: "100%",
    height: "100%",
    backgroundColor: "currentColor",
    transform: "rotate(45deg)"
  }
}));
let ol = !1, Nd = null;
function il(e, t) {
  return (n) => {
    t && t(n), e(n);
  };
}
const jN = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r, o, i, s, a, l, c, u, f, h, y, d, m, w, g, p, v, b, C;
  const E = ve({
    props: t,
    name: "MuiTooltip"
  }), {
    arrow: R = !1,
    children: T,
    components: O = {},
    componentsProps: P = {},
    describeChild: $ = !1,
    disableFocusListener: B = !1,
    disableHoverListener: D = !1,
    disableInteractive: I = !1,
    disableTouchListener: M = !1,
    enterDelay: A = 100,
    enterNextDelay: j = 0,
    enterTouchDelay: _ = 700,
    followCursor: z = !1,
    id: F,
    leaveDelay: Y = 0,
    leaveTouchDelay: q = 1500,
    onClose: pe,
    onOpen: ne,
    open: ae,
    placement: le = "bottom",
    PopperComponent: X,
    PopperProps: H = {},
    slotProps: W = {},
    slots: ce = {},
    title: re,
    TransitionComponent: ie = Cc,
    TransitionProps: de
  } = E, se = Q(E, NN), oe = Mo(), ue = oe.direction === "rtl", [ge, we] = x.exports.useState(), [ot, Oe] = x.exports.useState(null), ye = x.exports.useRef(!1), Je = I || z, Ke = x.exports.useRef(), Ze = x.exports.useRef(), Ye = x.exports.useRef(), bt = x.exports.useRef(), [Mt, K] = oa({
    controlled: ae,
    default: !1,
    name: "Tooltip",
    state: "open"
  });
  let J = Mt;
  const Ae = Ra(F), Le = x.exports.useRef(), en = x.exports.useCallback(() => {
    Le.current !== void 0 && (document.body.style.WebkitUserSelect = Le.current, Le.current = void 0), clearTimeout(bt.current);
  }, []);
  x.exports.useEffect(() => () => {
    clearTimeout(Ke.current), clearTimeout(Ze.current), clearTimeout(Ye.current), en();
  }, [en]);
  const mn = (be) => {
    clearTimeout(Nd), ol = !0, K(!0), ne && !J && ne(be);
  }, no = In(
    (be) => {
      clearTimeout(Nd), Nd = setTimeout(() => {
        ol = !1;
      }, 800 + Y), K(!1), pe && J && pe(be), clearTimeout(Ke.current), Ke.current = setTimeout(() => {
        ye.current = !1;
      }, oe.transitions.duration.shortest);
    }
  ), Du = (be) => {
    ye.current && be.type !== "touchstart" || (ge && ge.removeAttribute("title"), clearTimeout(Ze.current), clearTimeout(Ye.current), A || ol && j ? Ze.current = setTimeout(() => {
      mn(be);
    }, ol ? j : A) : mn(be));
  }, _m = (be) => {
    clearTimeout(Ze.current), clearTimeout(Ye.current), Ye.current = setTimeout(() => {
      no(be);
    }, Y);
  }, {
    isFocusVisibleRef: Mm,
    onBlur: HS,
    onFocus: VS,
    ref: YS
  } = $h(), [, Im] = x.exports.useState(!1), Am = (be) => {
    HS(be), Mm.current === !1 && (Im(!1), _m(be));
  }, Nm = (be) => {
    ge || we(be.currentTarget), VS(be), Mm.current === !0 && (Im(!0), Du(be));
  }, Lm = (be) => {
    ye.current = !0;
    const Ht = T.props;
    Ht.onTouchStart && Ht.onTouchStart(be);
  }, Fm = Du, Dm = _m, XS = (be) => {
    Lm(be), clearTimeout(Ye.current), clearTimeout(Ke.current), en(), Le.current = document.body.style.WebkitUserSelect, document.body.style.WebkitUserSelect = "none", bt.current = setTimeout(() => {
      document.body.style.WebkitUserSelect = Le.current, Du(be);
    }, _);
  }, KS = (be) => {
    T.props.onTouchEnd && T.props.onTouchEnd(be), en(), clearTimeout(Ye.current), Ye.current = setTimeout(() => {
      no(be);
    }, q);
  };
  x.exports.useEffect(() => {
    if (!J)
      return;
    function be(Ht) {
      (Ht.key === "Escape" || Ht.key === "Esc") && no(Ht);
    }
    return document.addEventListener("keydown", be), () => {
      document.removeEventListener("keydown", be);
    };
  }, [no, J]);
  const qS = Qe(T.ref, YS, we, n);
  !re && re !== 0 && (J = !1);
  const Bi = x.exports.useRef({
    x: 0,
    y: 0
  }), zu = x.exports.useRef(), GS = (be) => {
    const Ht = T.props;
    Ht.onMouseMove && Ht.onMouseMove(be), Bi.current = {
      x: be.clientX,
      y: be.clientY
    }, zu.current && zu.current.update();
  }, ji = {}, Bu = typeof re == "string";
  $ ? (ji.title = !J && Bu && !D ? re : null, ji["aria-describedby"] = J ? Ae : null) : (ji["aria-label"] = Bu ? re : null, ji["aria-labelledby"] = J && !Bu ? Ae : null);
  const gn = k({}, ji, se, T.props, {
    className: Z(se.className, T.props.className),
    onTouchStart: Lm,
    ref: qS
  }, z ? {
    onMouseMove: GS
  } : {}), Wi = {};
  M || (gn.onTouchStart = XS, gn.onTouchEnd = KS), D || (gn.onMouseOver = il(Fm, gn.onMouseOver), gn.onMouseLeave = il(Dm, gn.onMouseLeave), Je || (Wi.onMouseOver = Fm, Wi.onMouseLeave = Dm)), B || (gn.onFocus = il(Nm, gn.onFocus), gn.onBlur = il(Am, gn.onBlur), Je || (Wi.onFocus = Nm, Wi.onBlur = Am));
  const QS = x.exports.useMemo(() => {
    var be;
    let Ht = [{
      name: "arrow",
      enabled: Boolean(ot),
      options: {
        element: ot,
        padding: 4
      }
    }];
    return (be = H.popperOptions) != null && be.modifiers && (Ht = Ht.concat(H.popperOptions.modifiers)), k({}, H.popperOptions, {
      modifiers: Ht
    });
  }, [ot, H]), Ui = k({}, E, {
    isRtl: ue,
    arrow: R,
    disableInteractive: Je,
    placement: le,
    PopperComponentProp: X,
    touch: ye.current
  }), ju = FN(Ui), zm = (r = (o = ce.popper) != null ? o : O.Popper) != null ? r : DN, Bm = (i = (s = (a = ce.transition) != null ? a : O.Transition) != null ? s : ie) != null ? i : Cc, jm = (l = (c = ce.tooltip) != null ? c : O.Tooltip) != null ? l : zN, Wm = (u = (f = ce.arrow) != null ? f : O.Arrow) != null ? u : BN, JS = hs(zm, k({}, H, (h = W.popper) != null ? h : P.popper, {
    className: Z(ju.popper, H == null ? void 0 : H.className, (y = (d = W.popper) != null ? d : P.popper) == null ? void 0 : y.className)
  }), Ui), ZS = hs(Bm, k({}, de, (m = W.transition) != null ? m : P.transition), Ui), eC = hs(jm, k({}, (w = W.tooltip) != null ? w : P.tooltip, {
    className: Z(ju.tooltip, (g = (p = W.tooltip) != null ? p : P.tooltip) == null ? void 0 : g.className)
  }), Ui), tC = hs(Wm, k({}, (v = W.arrow) != null ? v : P.arrow, {
    className: Z(ju.arrow, (b = (C = W.arrow) != null ? C : P.arrow) == null ? void 0 : b.className)
  }), Ui);
  return /* @__PURE__ */ G(x.exports.Fragment, {
    children: [/* @__PURE__ */ x.exports.cloneElement(T, gn), /* @__PURE__ */ S(zm, k({
      as: X != null ? X : Bw,
      placement: le,
      anchorEl: z ? {
        getBoundingClientRect: () => ({
          top: Bi.current.y,
          left: Bi.current.x,
          right: Bi.current.x,
          bottom: Bi.current.y,
          width: 0,
          height: 0
        })
      } : ge,
      popperRef: zu,
      open: ge ? J : !1,
      id: Ae,
      transition: !0
    }, Wi, JS, {
      popperOptions: QS,
      children: ({
        TransitionProps: be
      }) => /* @__PURE__ */ S(Bm, k({
        timeout: oe.transitions.duration.shorter
      }, be, ZS, {
        "data-foo": "bar",
        children: /* @__PURE__ */ G(jm, k({}, eC, {
          children: [re, R ? /* @__PURE__ */ S(Wm, k({}, tC, {
            ref: Oe
          })) : null]
        }))
      }))
    }))]
  });
}), up = jN;
function WN(e) {
  return he("MuiPaper", e);
}
fe("MuiPaper", ["root", "rounded", "outlined", "elevation", "elevation0", "elevation1", "elevation2", "elevation3", "elevation4", "elevation5", "elevation6", "elevation7", "elevation8", "elevation9", "elevation10", "elevation11", "elevation12", "elevation13", "elevation14", "elevation15", "elevation16", "elevation17", "elevation18", "elevation19", "elevation20", "elevation21", "elevation22", "elevation23", "elevation24"]);
const UN = ["className", "component", "elevation", "square", "variant"], HN = (e) => {
  const {
    square: t,
    elevation: n,
    variant: r,
    classes: o
  } = e, i = {
    root: ["root", r, !t && "rounded", r === "elevation" && `elevation${n}`]
  };
  return me(i, WN, o);
}, VN = U("div", {
  name: "MuiPaper",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, t[n.variant], !n.square && t.rounded, n.variant === "elevation" && t[`elevation${n.elevation}`]];
  }
})(({
  theme: e,
  ownerState: t
}) => {
  var n;
  return k({
    backgroundColor: (e.vars || e).palette.background.paper,
    color: (e.vars || e).palette.text.primary,
    transition: e.transitions.create("box-shadow")
  }, !t.square && {
    borderRadius: e.shape.borderRadius
  }, t.variant === "outlined" && {
    border: `1px solid ${(e.vars || e).palette.divider}`
  }, t.variant === "elevation" && k({
    boxShadow: (e.vars || e).shadows[t.elevation]
  }, !e.vars && e.palette.mode === "dark" && {
    backgroundImage: `linear-gradient(${Ie("#fff", zv(t.elevation))}, ${Ie("#fff", zv(t.elevation))})`
  }, e.vars && {
    backgroundImage: (n = e.vars.overlays) == null ? void 0 : n[t.elevation]
  }));
}), YN = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiPaper"
  }), {
    className: o,
    component: i = "div",
    elevation: s = 1,
    square: a = !1,
    variant: l = "elevation"
  } = r, c = Q(r, UN), u = k({}, r, {
    component: i,
    elevation: s,
    square: a,
    variant: l
  }), f = HN(u);
  return /* @__PURE__ */ S(VN, k({
    as: i,
    ownerState: u,
    className: Z(f.root, o),
    ref: n
  }, c));
}), Fi = YN;
function XN(e) {
  return he("MuiAlert", e);
}
const KN = fe("MuiAlert", ["root", "action", "icon", "message", "filled", "filledSuccess", "filledInfo", "filledWarning", "filledError", "outlined", "outlinedSuccess", "outlinedInfo", "outlinedWarning", "outlinedError", "standard", "standardSuccess", "standardInfo", "standardWarning", "standardError"]), O0 = KN, qN = Xn(/* @__PURE__ */ S("path", {
  d: "M20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.76,4 13.5,4.11 14.2, 4.31L15.77,2.74C14.61,2.26 13.34,2 12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0, 0 22,12M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z"
}), "SuccessOutlined"), GN = Xn(/* @__PURE__ */ S("path", {
  d: "M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"
}), "ReportProblemOutlined"), QN = Xn(/* @__PURE__ */ S("path", {
  d: "M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
}), "ErrorOutline"), JN = Xn(/* @__PURE__ */ S("path", {
  d: "M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20, 12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10, 10 0 0,0 12,2M11,17H13V11H11V17Z"
}), "InfoOutlined"), ZN = Xn(/* @__PURE__ */ S("path", {
  d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
}), "Close"), e5 = ["action", "children", "className", "closeText", "color", "components", "componentsProps", "icon", "iconMapping", "onClose", "role", "severity", "slotProps", "slots", "variant"], t5 = (e) => {
  const {
    variant: t,
    color: n,
    severity: r,
    classes: o
  } = e, i = {
    root: ["root", `${t}${N(n || r)}`, `${t}`],
    icon: ["icon"],
    message: ["message"],
    action: ["action"]
  };
  return me(i, XN, o);
}, n5 = U(Fi, {
  name: "MuiAlert",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, t[n.variant], t[`${n.variant}${N(n.color || n.severity)}`]];
  }
})(({
  theme: e,
  ownerState: t
}) => {
  const n = e.palette.mode === "light" ? ia : sa, r = e.palette.mode === "light" ? sa : ia, o = t.color || t.severity;
  return k({}, e.typography.body2, {
    backgroundColor: "transparent",
    display: "flex",
    padding: "6px 16px"
  }, o && t.variant === "standard" && {
    color: e.vars ? e.vars.palette.Alert[`${o}Color`] : n(e.palette[o].light, 0.6),
    backgroundColor: e.vars ? e.vars.palette.Alert[`${o}StandardBg`] : r(e.palette[o].light, 0.9),
    [`& .${O0.icon}`]: e.vars ? {
      color: e.vars.palette.Alert[`${o}IconColor`]
    } : {
      color: e.palette.mode === "dark" ? e.palette[o].main : e.palette[o].light
    }
  }, o && t.variant === "outlined" && {
    color: e.vars ? e.vars.palette.Alert[`${o}Color`] : n(e.palette[o].light, 0.6),
    border: `1px solid ${(e.vars || e).palette[o].light}`,
    [`& .${O0.icon}`]: e.vars ? {
      color: e.vars.palette.Alert[`${o}IconColor`]
    } : {
      color: e.palette.mode === "dark" ? e.palette[o].main : e.palette[o].light
    }
  }, o && t.variant === "filled" && k({
    fontWeight: e.typography.fontWeightMedium
  }, e.vars ? {
    color: e.vars.palette.Alert[`${o}FilledColor`],
    backgroundColor: e.vars.palette.Alert[`${o}FilledBg`]
  } : {
    backgroundColor: e.palette.mode === "dark" ? e.palette[o].dark : e.palette[o].main,
    color: e.palette.getContrastText(e.palette.mode === "dark" ? e.palette[o].dark : e.palette[o].main)
  }));
}), r5 = U("div", {
  name: "MuiAlert",
  slot: "Icon",
  overridesResolver: (e, t) => t.icon
})({
  marginRight: 12,
  padding: "7px 0",
  display: "flex",
  fontSize: 22,
  opacity: 0.9
}), o5 = U("div", {
  name: "MuiAlert",
  slot: "Message",
  overridesResolver: (e, t) => t.message
})({
  padding: "8px 0",
  minWidth: 0,
  overflow: "auto"
}), $0 = U("div", {
  name: "MuiAlert",
  slot: "Action",
  overridesResolver: (e, t) => t.action
})({
  display: "flex",
  alignItems: "flex-start",
  padding: "4px 0 0 16px",
  marginLeft: "auto",
  marginRight: -8
}), _0 = {
  success: /* @__PURE__ */ S(qN, {
    fontSize: "inherit"
  }),
  warning: /* @__PURE__ */ S(GN, {
    fontSize: "inherit"
  }),
  error: /* @__PURE__ */ S(QN, {
    fontSize: "inherit"
  }),
  info: /* @__PURE__ */ S(JN, {
    fontSize: "inherit"
  })
}, i5 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r, o, i, s, a, l;
  const c = ve({
    props: t,
    name: "MuiAlert"
  }), {
    action: u,
    children: f,
    className: h,
    closeText: y = "Close",
    color: d,
    components: m = {},
    componentsProps: w = {},
    icon: g,
    iconMapping: p = _0,
    onClose: v,
    role: b = "alert",
    severity: C = "success",
    slotProps: E = {},
    slots: R = {},
    variant: T = "standard"
  } = c, O = Q(c, e5), P = k({}, c, {
    color: d,
    severity: C,
    variant: T
  }), $ = t5(P), B = (r = (o = R.closeButton) != null ? o : m.CloseButton) != null ? r : Hn, D = (i = (s = R.closeIcon) != null ? s : m.CloseIcon) != null ? i : ZN, I = (a = E.closeButton) != null ? a : w.closeButton, M = (l = E.closeIcon) != null ? l : w.closeIcon;
  return /* @__PURE__ */ G(n5, k({
    role: b,
    elevation: 0,
    ownerState: P,
    className: Z($.root, h),
    ref: n
  }, O, {
    children: [g !== !1 ? /* @__PURE__ */ S(r5, {
      ownerState: P,
      className: $.icon,
      children: g || p[C] || _0[C]
    }) : null, /* @__PURE__ */ S(o5, {
      ownerState: P,
      className: $.message,
      children: f
    }), u != null ? /* @__PURE__ */ S($0, {
      ownerState: P,
      className: $.action,
      children: u
    }) : null, u == null && v ? /* @__PURE__ */ S($0, {
      ownerState: P,
      className: $.action,
      children: /* @__PURE__ */ S(B, k({
        size: "small",
        "aria-label": y,
        title: y,
        color: "inherit",
        onClick: v
      }, I, {
        children: /* @__PURE__ */ S(D, k({
          fontSize: "small"
        }, M))
      }))
    }) : null]
  }));
}), xm = i5;
var dp = { exports: {} }, fp = { exports: {} };
/*!
 * perfect-scrollbar v1.5.3
 * Copyright 2021 Hyunje Jun, MDBootstrap and Contributors
 * Licensed under MIT
 */
function An(e) {
  return getComputedStyle(e);
}
function At(e, t) {
  for (var n in t) {
    var r = t[n];
    typeof r == "number" && (r = r + "px"), e.style[n] = r;
  }
  return e;
}
function sl(e) {
  var t = document.createElement("div");
  return t.className = e, t;
}
var M0 = typeof Element < "u" && (Element.prototype.matches || Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector);
function $r(e, t) {
  if (!M0)
    throw new Error("No element matching method supported");
  return M0.call(e, t);
}
function ti(e) {
  e.remove ? e.remove() : e.parentNode && e.parentNode.removeChild(e);
}
function I0(e, t) {
  return Array.prototype.filter.call(
    e.children,
    function(n) {
      return $r(n, t);
    }
  );
}
var et = {
  main: "ps",
  rtl: "ps__rtl",
  element: {
    thumb: function(e) {
      return "ps__thumb-" + e;
    },
    rail: function(e) {
      return "ps__rail-" + e;
    },
    consuming: "ps__child--consume"
  },
  state: {
    focus: "ps--focus",
    clicking: "ps--clicking",
    active: function(e) {
      return "ps--active-" + e;
    },
    scrolling: function(e) {
      return "ps--scrolling-" + e;
    }
  }
}, jw = { x: null, y: null };
function Ww(e, t) {
  var n = e.element.classList, r = et.state.scrolling(t);
  n.contains(r) ? clearTimeout(jw[t]) : n.add(r);
}
function Uw(e, t) {
  jw[t] = setTimeout(
    function() {
      return e.isAlive && e.element.classList.remove(et.state.scrolling(t));
    },
    e.settings.scrollingThreshold
  );
}
function s5(e, t) {
  Ww(e, t), Uw(e, t);
}
var Ia = function(t) {
  this.element = t, this.handlers = {};
}, Hw = { isEmpty: { configurable: !0 } };
Ia.prototype.bind = function(t, n) {
  typeof this.handlers[t] > "u" && (this.handlers[t] = []), this.handlers[t].push(n), this.element.addEventListener(t, n, !1);
};
Ia.prototype.unbind = function(t, n) {
  var r = this;
  this.handlers[t] = this.handlers[t].filter(function(o) {
    return n && o !== n ? !0 : (r.element.removeEventListener(t, o, !1), !1);
  });
};
Ia.prototype.unbindAll = function() {
  for (var t in this.handlers)
    this.unbind(t);
};
Hw.isEmpty.get = function() {
  var e = this;
  return Object.keys(this.handlers).every(
    function(t) {
      return e.handlers[t].length === 0;
    }
  );
};
Object.defineProperties(Ia.prototype, Hw);
var Di = function() {
  this.eventElements = [];
};
Di.prototype.eventElement = function(t) {
  var n = this.eventElements.filter(function(r) {
    return r.element === t;
  })[0];
  return n || (n = new Ia(t), this.eventElements.push(n)), n;
};
Di.prototype.bind = function(t, n, r) {
  this.eventElement(t).bind(n, r);
};
Di.prototype.unbind = function(t, n, r) {
  var o = this.eventElement(t);
  o.unbind(n, r), o.isEmpty && this.eventElements.splice(this.eventElements.indexOf(o), 1);
};
Di.prototype.unbindAll = function() {
  this.eventElements.forEach(function(t) {
    return t.unbindAll();
  }), this.eventElements = [];
};
Di.prototype.once = function(t, n, r) {
  var o = this.eventElement(t), i = function(s) {
    o.unbind(n, i), r(s);
  };
  o.bind(n, i);
};
function al(e) {
  if (typeof window.CustomEvent == "function")
    return new CustomEvent(e);
  var t = document.createEvent("CustomEvent");
  return t.initCustomEvent(e, !1, !1, void 0), t;
}
function kc(e, t, n, r, o) {
  r === void 0 && (r = !0), o === void 0 && (o = !1);
  var i;
  if (t === "top")
    i = [
      "contentHeight",
      "containerHeight",
      "scrollTop",
      "y",
      "up",
      "down"
    ];
  else if (t === "left")
    i = [
      "contentWidth",
      "containerWidth",
      "scrollLeft",
      "x",
      "left",
      "right"
    ];
  else
    throw new Error("A proper axis should be provided");
  a5(e, n, i, r, o);
}
function a5(e, t, n, r, o) {
  var i = n[0], s = n[1], a = n[2], l = n[3], c = n[4], u = n[5];
  r === void 0 && (r = !0), o === void 0 && (o = !1);
  var f = e.element;
  e.reach[l] = null, f[a] < 1 && (e.reach[l] = "start"), f[a] > e[i] - e[s] - 1 && (e.reach[l] = "end"), t && (f.dispatchEvent(al("ps-scroll-" + l)), t < 0 ? f.dispatchEvent(al("ps-scroll-" + c)) : t > 0 && f.dispatchEvent(al("ps-scroll-" + u)), r && s5(e, l)), e.reach[l] && (t || o) && f.dispatchEvent(al("ps-" + l + "-reach-" + e.reach[l]));
}
function We(e) {
  return parseInt(e, 10) || 0;
}
function l5(e) {
  return $r(e, "input,[contenteditable]") || $r(e, "select,[contenteditable]") || $r(e, "textarea,[contenteditable]") || $r(e, "button,[contenteditable]");
}
function c5(e) {
  var t = An(e);
  return We(t.width) + We(t.paddingLeft) + We(t.paddingRight) + We(t.borderLeftWidth) + We(t.borderRightWidth);
}
var Wo = {
  isWebKit: typeof document < "u" && "WebkitAppearance" in document.documentElement.style,
  supportsTouch: typeof window < "u" && ("ontouchstart" in window || "maxTouchPoints" in window.navigator && window.navigator.maxTouchPoints > 0 || window.DocumentTouch && document instanceof window.DocumentTouch),
  supportsIePointer: typeof navigator < "u" && navigator.msMaxTouchPoints,
  isChrome: typeof navigator < "u" && /Chrome/i.test(navigator && navigator.userAgent)
};
function lr(e) {
  var t = e.element, n = Math.floor(t.scrollTop), r = t.getBoundingClientRect();
  e.containerWidth = Math.round(r.width), e.containerHeight = Math.round(r.height), e.contentWidth = t.scrollWidth, e.contentHeight = t.scrollHeight, t.contains(e.scrollbarXRail) || (I0(t, et.element.rail("x")).forEach(
    function(o) {
      return ti(o);
    }
  ), t.appendChild(e.scrollbarXRail)), t.contains(e.scrollbarYRail) || (I0(t, et.element.rail("y")).forEach(
    function(o) {
      return ti(o);
    }
  ), t.appendChild(e.scrollbarYRail)), !e.settings.suppressScrollX && e.containerWidth + e.settings.scrollXMarginOffset < e.contentWidth ? (e.scrollbarXActive = !0, e.railXWidth = e.containerWidth - e.railXMarginWidth, e.railXRatio = e.containerWidth / e.railXWidth, e.scrollbarXWidth = A0(
    e,
    We(e.railXWidth * e.containerWidth / e.contentWidth)
  ), e.scrollbarXLeft = We(
    (e.negativeScrollAdjustment + t.scrollLeft) * (e.railXWidth - e.scrollbarXWidth) / (e.contentWidth - e.containerWidth)
  )) : e.scrollbarXActive = !1, !e.settings.suppressScrollY && e.containerHeight + e.settings.scrollYMarginOffset < e.contentHeight ? (e.scrollbarYActive = !0, e.railYHeight = e.containerHeight - e.railYMarginHeight, e.railYRatio = e.containerHeight / e.railYHeight, e.scrollbarYHeight = A0(
    e,
    We(e.railYHeight * e.containerHeight / e.contentHeight)
  ), e.scrollbarYTop = We(
    n * (e.railYHeight - e.scrollbarYHeight) / (e.contentHeight - e.containerHeight)
  )) : e.scrollbarYActive = !1, e.scrollbarXLeft >= e.railXWidth - e.scrollbarXWidth && (e.scrollbarXLeft = e.railXWidth - e.scrollbarXWidth), e.scrollbarYTop >= e.railYHeight - e.scrollbarYHeight && (e.scrollbarYTop = e.railYHeight - e.scrollbarYHeight), u5(t, e), e.scrollbarXActive ? t.classList.add(et.state.active("x")) : (t.classList.remove(et.state.active("x")), e.scrollbarXWidth = 0, e.scrollbarXLeft = 0, t.scrollLeft = e.isRtl === !0 ? e.contentWidth : 0), e.scrollbarYActive ? t.classList.add(et.state.active("y")) : (t.classList.remove(et.state.active("y")), e.scrollbarYHeight = 0, e.scrollbarYTop = 0, t.scrollTop = 0);
}
function A0(e, t) {
  return e.settings.minScrollbarLength && (t = Math.max(t, e.settings.minScrollbarLength)), e.settings.maxScrollbarLength && (t = Math.min(t, e.settings.maxScrollbarLength)), t;
}
function u5(e, t) {
  var n = { width: t.railXWidth }, r = Math.floor(e.scrollTop);
  t.isRtl ? n.left = t.negativeScrollAdjustment + e.scrollLeft + t.containerWidth - t.contentWidth : n.left = e.scrollLeft, t.isScrollbarXUsingBottom ? n.bottom = t.scrollbarXBottom - r : n.top = t.scrollbarXTop + r, At(t.scrollbarXRail, n);
  var o = { top: r, height: t.railYHeight };
  t.isScrollbarYUsingRight ? t.isRtl ? o.right = t.contentWidth - (t.negativeScrollAdjustment + e.scrollLeft) - t.scrollbarYRight - t.scrollbarYOuterWidth - 9 : o.right = t.scrollbarYRight - e.scrollLeft : t.isRtl ? o.left = t.negativeScrollAdjustment + e.scrollLeft + t.containerWidth * 2 - t.contentWidth - t.scrollbarYLeft - t.scrollbarYOuterWidth : o.left = t.scrollbarYLeft + e.scrollLeft, At(t.scrollbarYRail, o), At(t.scrollbarX, {
    left: t.scrollbarXLeft,
    width: t.scrollbarXWidth - t.railBorderXWidth
  }), At(t.scrollbarY, {
    top: t.scrollbarYTop,
    height: t.scrollbarYHeight - t.railBorderYWidth
  });
}
function d5(e) {
  e.element, e.event.bind(e.scrollbarY, "mousedown", function(t) {
    return t.stopPropagation();
  }), e.event.bind(e.scrollbarYRail, "mousedown", function(t) {
    var n = t.pageY - window.pageYOffset - e.scrollbarYRail.getBoundingClientRect().top, r = n > e.scrollbarYTop ? 1 : -1;
    e.element.scrollTop += r * e.containerHeight, lr(e), t.stopPropagation();
  }), e.event.bind(e.scrollbarX, "mousedown", function(t) {
    return t.stopPropagation();
  }), e.event.bind(e.scrollbarXRail, "mousedown", function(t) {
    var n = t.pageX - window.pageXOffset - e.scrollbarXRail.getBoundingClientRect().left, r = n > e.scrollbarXLeft ? 1 : -1;
    e.element.scrollLeft += r * e.containerWidth, lr(e), t.stopPropagation();
  });
}
function f5(e) {
  N0(e, [
    "containerWidth",
    "contentWidth",
    "pageX",
    "railXWidth",
    "scrollbarX",
    "scrollbarXWidth",
    "scrollLeft",
    "x",
    "scrollbarXRail"
  ]), N0(e, [
    "containerHeight",
    "contentHeight",
    "pageY",
    "railYHeight",
    "scrollbarY",
    "scrollbarYHeight",
    "scrollTop",
    "y",
    "scrollbarYRail"
  ]);
}
function N0(e, t) {
  var n = t[0], r = t[1], o = t[2], i = t[3], s = t[4], a = t[5], l = t[6], c = t[7], u = t[8], f = e.element, h = null, y = null, d = null;
  function m(p) {
    p.touches && p.touches[0] && (p[o] = p.touches[0].pageY), f[l] = h + d * (p[o] - y), Ww(e, c), lr(e), p.stopPropagation(), p.type.startsWith("touch") && p.changedTouches.length > 1 && p.preventDefault();
  }
  function w() {
    Uw(e, c), e[u].classList.remove(et.state.clicking), e.event.unbind(e.ownerDocument, "mousemove", m);
  }
  function g(p, v) {
    h = f[l], v && p.touches && (p[o] = p.touches[0].pageY), y = p[o], d = (e[r] - e[n]) / (e[i] - e[a]), v ? e.event.bind(e.ownerDocument, "touchmove", m) : (e.event.bind(e.ownerDocument, "mousemove", m), e.event.once(e.ownerDocument, "mouseup", w), p.preventDefault()), e[u].classList.add(et.state.clicking), p.stopPropagation();
  }
  e.event.bind(e[s], "mousedown", function(p) {
    g(p);
  }), e.event.bind(e[s], "touchstart", function(p) {
    g(p, !0);
  });
}
function p5(e) {
  var t = e.element, n = function() {
    return $r(t, ":hover");
  }, r = function() {
    return $r(e.scrollbarX, ":focus") || $r(e.scrollbarY, ":focus");
  };
  function o(i, s) {
    var a = Math.floor(t.scrollTop);
    if (i === 0) {
      if (!e.scrollbarYActive)
        return !1;
      if (a === 0 && s > 0 || a >= e.contentHeight - e.containerHeight && s < 0)
        return !e.settings.wheelPropagation;
    }
    var l = t.scrollLeft;
    if (s === 0) {
      if (!e.scrollbarXActive)
        return !1;
      if (l === 0 && i < 0 || l >= e.contentWidth - e.containerWidth && i > 0)
        return !e.settings.wheelPropagation;
    }
    return !0;
  }
  e.event.bind(e.ownerDocument, "keydown", function(i) {
    if (!(i.isDefaultPrevented && i.isDefaultPrevented() || i.defaultPrevented) && !(!n() && !r())) {
      var s = document.activeElement ? document.activeElement : e.ownerDocument.activeElement;
      if (s) {
        if (s.tagName === "IFRAME")
          s = s.contentDocument.activeElement;
        else
          for (; s.shadowRoot; )
            s = s.shadowRoot.activeElement;
        if (l5(s))
          return;
      }
      var a = 0, l = 0;
      switch (i.which) {
        case 37:
          i.metaKey ? a = -e.contentWidth : i.altKey ? a = -e.containerWidth : a = -30;
          break;
        case 38:
          i.metaKey ? l = e.contentHeight : i.altKey ? l = e.containerHeight : l = 30;
          break;
        case 39:
          i.metaKey ? a = e.contentWidth : i.altKey ? a = e.containerWidth : a = 30;
          break;
        case 40:
          i.metaKey ? l = -e.contentHeight : i.altKey ? l = -e.containerHeight : l = -30;
          break;
        case 32:
          i.shiftKey ? l = e.containerHeight : l = -e.containerHeight;
          break;
        case 33:
          l = e.containerHeight;
          break;
        case 34:
          l = -e.containerHeight;
          break;
        case 36:
          l = e.contentHeight;
          break;
        case 35:
          l = -e.contentHeight;
          break;
        default:
          return;
      }
      e.settings.suppressScrollX && a !== 0 || e.settings.suppressScrollY && l !== 0 || (t.scrollTop -= l, t.scrollLeft += a, lr(e), o(a, l) && i.preventDefault());
    }
  });
}
function h5(e) {
  var t = e.element;
  function n(s, a) {
    var l = Math.floor(t.scrollTop), c = t.scrollTop === 0, u = l + t.offsetHeight === t.scrollHeight, f = t.scrollLeft === 0, h = t.scrollLeft + t.offsetWidth === t.scrollWidth, y;
    return Math.abs(a) > Math.abs(s) ? y = c || u : y = f || h, y ? !e.settings.wheelPropagation : !0;
  }
  function r(s) {
    var a = s.deltaX, l = -1 * s.deltaY;
    return (typeof a > "u" || typeof l > "u") && (a = -1 * s.wheelDeltaX / 6, l = s.wheelDeltaY / 6), s.deltaMode && s.deltaMode === 1 && (a *= 10, l *= 10), a !== a && l !== l && (a = 0, l = s.wheelDelta), s.shiftKey ? [-l, -a] : [a, l];
  }
  function o(s, a, l) {
    if (!Wo.isWebKit && t.querySelector("select:focus"))
      return !0;
    if (!t.contains(s))
      return !1;
    for (var c = s; c && c !== t; ) {
      if (c.classList.contains(et.element.consuming))
        return !0;
      var u = An(c);
      if (l && u.overflowY.match(/(scroll|auto)/)) {
        var f = c.scrollHeight - c.clientHeight;
        if (f > 0 && (c.scrollTop > 0 && l < 0 || c.scrollTop < f && l > 0))
          return !0;
      }
      if (a && u.overflowX.match(/(scroll|auto)/)) {
        var h = c.scrollWidth - c.clientWidth;
        if (h > 0 && (c.scrollLeft > 0 && a < 0 || c.scrollLeft < h && a > 0))
          return !0;
      }
      c = c.parentNode;
    }
    return !1;
  }
  function i(s) {
    var a = r(s), l = a[0], c = a[1];
    if (!o(s.target, l, c)) {
      var u = !1;
      e.settings.useBothWheelAxes ? e.scrollbarYActive && !e.scrollbarXActive ? (c ? t.scrollTop -= c * e.settings.wheelSpeed : t.scrollTop += l * e.settings.wheelSpeed, u = !0) : e.scrollbarXActive && !e.scrollbarYActive && (l ? t.scrollLeft += l * e.settings.wheelSpeed : t.scrollLeft -= c * e.settings.wheelSpeed, u = !0) : (t.scrollTop -= c * e.settings.wheelSpeed, t.scrollLeft += l * e.settings.wheelSpeed), lr(e), u = u || n(l, c), u && !s.ctrlKey && (s.stopPropagation(), s.preventDefault());
    }
  }
  typeof window.onwheel < "u" ? e.event.bind(t, "wheel", i) : typeof window.onmousewheel < "u" && e.event.bind(t, "mousewheel", i);
}
function m5(e) {
  if (!Wo.supportsTouch && !Wo.supportsIePointer)
    return;
  var t = e.element;
  function n(d, m) {
    var w = Math.floor(t.scrollTop), g = t.scrollLeft, p = Math.abs(d), v = Math.abs(m);
    if (v > p) {
      if (m < 0 && w === e.contentHeight - e.containerHeight || m > 0 && w === 0)
        return window.scrollY === 0 && m > 0 && Wo.isChrome;
    } else if (p > v && (d < 0 && g === e.contentWidth - e.containerWidth || d > 0 && g === 0))
      return !0;
    return !0;
  }
  function r(d, m) {
    t.scrollTop -= m, t.scrollLeft -= d, lr(e);
  }
  var o = {}, i = 0, s = {}, a = null;
  function l(d) {
    return d.targetTouches ? d.targetTouches[0] : d;
  }
  function c(d) {
    return d.pointerType && d.pointerType === "pen" && d.buttons === 0 ? !1 : !!(d.targetTouches && d.targetTouches.length === 1 || d.pointerType && d.pointerType !== "mouse" && d.pointerType !== d.MSPOINTER_TYPE_MOUSE);
  }
  function u(d) {
    if (!!c(d)) {
      var m = l(d);
      o.pageX = m.pageX, o.pageY = m.pageY, i = new Date().getTime(), a !== null && clearInterval(a);
    }
  }
  function f(d, m, w) {
    if (!t.contains(d))
      return !1;
    for (var g = d; g && g !== t; ) {
      if (g.classList.contains(et.element.consuming))
        return !0;
      var p = An(g);
      if (w && p.overflowY.match(/(scroll|auto)/)) {
        var v = g.scrollHeight - g.clientHeight;
        if (v > 0 && (g.scrollTop > 0 && w < 0 || g.scrollTop < v && w > 0))
          return !0;
      }
      if (m && p.overflowX.match(/(scroll|auto)/)) {
        var b = g.scrollWidth - g.clientWidth;
        if (b > 0 && (g.scrollLeft > 0 && m < 0 || g.scrollLeft < b && m > 0))
          return !0;
      }
      g = g.parentNode;
    }
    return !1;
  }
  function h(d) {
    if (c(d)) {
      var m = l(d), w = { pageX: m.pageX, pageY: m.pageY }, g = w.pageX - o.pageX, p = w.pageY - o.pageY;
      if (f(d.target, g, p))
        return;
      r(g, p), o = w;
      var v = new Date().getTime(), b = v - i;
      b > 0 && (s.x = g / b, s.y = p / b, i = v), n(g, p) && d.preventDefault();
    }
  }
  function y() {
    e.settings.swipeEasing && (clearInterval(a), a = setInterval(function() {
      if (e.isInitialized) {
        clearInterval(a);
        return;
      }
      if (!s.x && !s.y) {
        clearInterval(a);
        return;
      }
      if (Math.abs(s.x) < 0.01 && Math.abs(s.y) < 0.01) {
        clearInterval(a);
        return;
      }
      if (!e.element) {
        clearInterval(a);
        return;
      }
      r(s.x * 30, s.y * 30), s.x *= 0.8, s.y *= 0.8;
    }, 10));
  }
  Wo.supportsTouch ? (e.event.bind(t, "touchstart", u), e.event.bind(t, "touchmove", h), e.event.bind(t, "touchend", y)) : Wo.supportsIePointer && (window.PointerEvent ? (e.event.bind(t, "pointerdown", u), e.event.bind(t, "pointermove", h), e.event.bind(t, "pointerup", y)) : window.MSPointerEvent && (e.event.bind(t, "MSPointerDown", u), e.event.bind(t, "MSPointerMove", h), e.event.bind(t, "MSPointerUp", y)));
}
var g5 = function() {
  return {
    handlers: ["click-rail", "drag-thumb", "keyboard", "wheel", "touch"],
    maxScrollbarLength: null,
    minScrollbarLength: null,
    scrollingThreshold: 1e3,
    scrollXMarginOffset: 0,
    scrollYMarginOffset: 0,
    suppressScrollX: !1,
    suppressScrollY: !1,
    swipeEasing: !0,
    useBothWheelAxes: !1,
    wheelPropagation: !0,
    wheelSpeed: 1
  };
}, v5 = {
  "click-rail": d5,
  "drag-thumb": f5,
  keyboard: p5,
  wheel: h5,
  touch: m5
}, Aa = function(t, n) {
  var r = this;
  if (n === void 0 && (n = {}), typeof t == "string" && (t = document.querySelector(t)), !t || !t.nodeName)
    throw new Error("no element is specified to initialize PerfectScrollbar");
  this.element = t, t.classList.add(et.main), this.settings = g5();
  for (var o in n)
    this.settings[o] = n[o];
  this.containerWidth = null, this.containerHeight = null, this.contentWidth = null, this.contentHeight = null;
  var i = function() {
    return t.classList.add(et.state.focus);
  }, s = function() {
    return t.classList.remove(et.state.focus);
  };
  this.isRtl = An(t).direction === "rtl", this.isRtl === !0 && t.classList.add(et.rtl), this.isNegativeScroll = function() {
    var c = t.scrollLeft, u = null;
    return t.scrollLeft = -1, u = t.scrollLeft < 0, t.scrollLeft = c, u;
  }(), this.negativeScrollAdjustment = this.isNegativeScroll ? t.scrollWidth - t.clientWidth : 0, this.event = new Di(), this.ownerDocument = t.ownerDocument || document, this.scrollbarXRail = sl(et.element.rail("x")), t.appendChild(this.scrollbarXRail), this.scrollbarX = sl(et.element.thumb("x")), this.scrollbarXRail.appendChild(this.scrollbarX), this.scrollbarX.setAttribute("tabindex", 0), this.event.bind(this.scrollbarX, "focus", i), this.event.bind(this.scrollbarX, "blur", s), this.scrollbarXActive = null, this.scrollbarXWidth = null, this.scrollbarXLeft = null;
  var a = An(this.scrollbarXRail);
  this.scrollbarXBottom = parseInt(a.bottom, 10), isNaN(this.scrollbarXBottom) ? (this.isScrollbarXUsingBottom = !1, this.scrollbarXTop = We(a.top)) : this.isScrollbarXUsingBottom = !0, this.railBorderXWidth = We(a.borderLeftWidth) + We(a.borderRightWidth), At(this.scrollbarXRail, { display: "block" }), this.railXMarginWidth = We(a.marginLeft) + We(a.marginRight), At(this.scrollbarXRail, { display: "" }), this.railXWidth = null, this.railXRatio = null, this.scrollbarYRail = sl(et.element.rail("y")), t.appendChild(this.scrollbarYRail), this.scrollbarY = sl(et.element.thumb("y")), this.scrollbarYRail.appendChild(this.scrollbarY), this.scrollbarY.setAttribute("tabindex", 0), this.event.bind(this.scrollbarY, "focus", i), this.event.bind(this.scrollbarY, "blur", s), this.scrollbarYActive = null, this.scrollbarYHeight = null, this.scrollbarYTop = null;
  var l = An(this.scrollbarYRail);
  this.scrollbarYRight = parseInt(l.right, 10), isNaN(this.scrollbarYRight) ? (this.isScrollbarYUsingRight = !1, this.scrollbarYLeft = We(l.left)) : this.isScrollbarYUsingRight = !0, this.scrollbarYOuterWidth = this.isRtl ? c5(this.scrollbarY) : null, this.railBorderYWidth = We(l.borderTopWidth) + We(l.borderBottomWidth), At(this.scrollbarYRail, { display: "block" }), this.railYMarginHeight = We(l.marginTop) + We(l.marginBottom), At(this.scrollbarYRail, { display: "" }), this.railYHeight = null, this.railYRatio = null, this.reach = {
    x: t.scrollLeft <= 0 ? "start" : t.scrollLeft >= this.contentWidth - this.containerWidth ? "end" : null,
    y: t.scrollTop <= 0 ? "start" : t.scrollTop >= this.contentHeight - this.containerHeight ? "end" : null
  }, this.isAlive = !0, this.settings.handlers.forEach(function(c) {
    return v5[c](r);
  }), this.lastScrollTop = Math.floor(t.scrollTop), this.lastScrollLeft = t.scrollLeft, this.event.bind(this.element, "scroll", function(c) {
    return r.onScroll(c);
  }), lr(this);
};
Aa.prototype.update = function() {
  !this.isAlive || (this.negativeScrollAdjustment = this.isNegativeScroll ? this.element.scrollWidth - this.element.clientWidth : 0, At(this.scrollbarXRail, { display: "block" }), At(this.scrollbarYRail, { display: "block" }), this.railXMarginWidth = We(An(this.scrollbarXRail).marginLeft) + We(An(this.scrollbarXRail).marginRight), this.railYMarginHeight = We(An(this.scrollbarYRail).marginTop) + We(An(this.scrollbarYRail).marginBottom), At(this.scrollbarXRail, { display: "none" }), At(this.scrollbarYRail, { display: "none" }), lr(this), kc(this, "top", 0, !1, !0), kc(this, "left", 0, !1, !0), At(this.scrollbarXRail, { display: "" }), At(this.scrollbarYRail, { display: "" }));
};
Aa.prototype.onScroll = function(t) {
  !this.isAlive || (lr(this), kc(this, "top", this.element.scrollTop - this.lastScrollTop), kc(
    this,
    "left",
    this.element.scrollLeft - this.lastScrollLeft
  ), this.lastScrollTop = Math.floor(this.element.scrollTop), this.lastScrollLeft = this.element.scrollLeft);
};
Aa.prototype.destroy = function() {
  !this.isAlive || (this.event.unbindAll(), ti(this.scrollbarX), ti(this.scrollbarY), ti(this.scrollbarXRail), ti(this.scrollbarYRail), this.removePsClasses(), this.element = null, this.scrollbarX = null, this.scrollbarY = null, this.scrollbarXRail = null, this.scrollbarYRail = null, this.isAlive = !1);
};
Aa.prototype.removePsClasses = function() {
  this.element.className = this.element.className.split(" ").filter(function(t) {
    return !t.match(/^ps([-_].+|)$/);
  }).join(" ");
};
const y5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Aa
}, Symbol.toStringTag, { value: "Module" })), b5 = /* @__PURE__ */ oC(y5);
(function(e, t) {
  Object.defineProperty(t, "__esModule", {
    value: !0
  });
  var n = Object.assign || function(w) {
    for (var g = 1; g < arguments.length; g++) {
      var p = arguments[g];
      for (var v in p)
        Object.prototype.hasOwnProperty.call(p, v) && (w[v] = p[v]);
    }
    return w;
  }, r = function() {
    function w(g, p) {
      for (var v = 0; v < p.length; v++) {
        var b = p[v];
        b.enumerable = b.enumerable || !1, b.configurable = !0, "value" in b && (b.writable = !0), Object.defineProperty(g, b.key, b);
      }
    }
    return function(g, p, v) {
      return p && w(g.prototype, p), v && w(g, v), g;
    };
  }(), o = x.exports, i = c(o), s = ex.exports, a = b5, l = c(a);
  function c(w) {
    return w && w.__esModule ? w : { default: w };
  }
  function u(w, g) {
    var p = {};
    for (var v in w)
      g.indexOf(v) >= 0 || !Object.prototype.hasOwnProperty.call(w, v) || (p[v] = w[v]);
    return p;
  }
  function f(w, g) {
    if (!(w instanceof g))
      throw new TypeError("Cannot call a class as a function");
  }
  function h(w, g) {
    if (!w)
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return g && (typeof g == "object" || typeof g == "function") ? g : w;
  }
  function y(w, g) {
    if (typeof g != "function" && g !== null)
      throw new TypeError("Super expression must either be null or a function, not " + typeof g);
    w.prototype = Object.create(g && g.prototype, { constructor: { value: w, enumerable: !1, writable: !0, configurable: !0 } }), g && (Object.setPrototypeOf ? Object.setPrototypeOf(w, g) : w.__proto__ = g);
  }
  var d = {
    "ps-scroll-y": "onScrollY",
    "ps-scroll-x": "onScrollX",
    "ps-scroll-up": "onScrollUp",
    "ps-scroll-down": "onScrollDown",
    "ps-scroll-left": "onScrollLeft",
    "ps-scroll-right": "onScrollRight",
    "ps-y-reach-start": "onYReachStart",
    "ps-y-reach-end": "onYReachEnd",
    "ps-x-reach-start": "onXReachStart",
    "ps-x-reach-end": "onXReachEnd"
  };
  Object.freeze(d);
  var m = function(w) {
    y(g, w);
    function g(p) {
      f(this, g);
      var v = h(this, (g.__proto__ || Object.getPrototypeOf(g)).call(this, p));
      return v.handleRef = v.handleRef.bind(v), v._handlerByEvent = {}, v;
    }
    return r(g, [{
      key: "componentDidMount",
      value: function() {
        this.props.option && console.warn('react-perfect-scrollbar: the "option" prop has been deprecated in favor of "options"'), this._ps = new l.default(this._container, this.props.options || this.props.option), this._updateEventHook(), this._updateClassName();
      }
    }, {
      key: "componentDidUpdate",
      value: function(v) {
        this._updateEventHook(v), this.updateScroll(), v.className !== this.props.className && this._updateClassName();
      }
    }, {
      key: "componentWillUnmount",
      value: function() {
        var v = this;
        Object.keys(this._handlerByEvent).forEach(function(b) {
          var C = v._handlerByEvent[b];
          C && v._container.removeEventListener(b, C, !1);
        }), this._handlerByEvent = {}, this._ps.destroy(), this._ps = null;
      }
    }, {
      key: "_updateEventHook",
      value: function() {
        var v = this, b = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        Object.keys(d).forEach(function(C) {
          var E = v.props[d[C]], R = b[d[C]];
          if (E !== R) {
            if (R) {
              var T = v._handlerByEvent[C];
              v._container.removeEventListener(C, T, !1), v._handlerByEvent[C] = null;
            }
            if (E) {
              var O = function() {
                return E(v._container);
              };
              v._container.addEventListener(C, O, !1), v._handlerByEvent[C] = O;
            }
          }
        });
      }
    }, {
      key: "_updateClassName",
      value: function() {
        var v = this.props.className, b = this._container.className.split(" ").filter(function(C) {
          return C.match(/^ps([-_].+|)$/);
        }).join(" ");
        this._container && (this._container.className = "scrollbar-container" + (v ? " " + v : "") + (b ? " " + b : ""));
      }
    }, {
      key: "updateScroll",
      value: function() {
        this.props.onSync(this._ps);
      }
    }, {
      key: "handleRef",
      value: function(v) {
        this._container = v, this.props.containerRef(v);
      }
    }, {
      key: "render",
      value: function() {
        var v = this.props;
        v.className;
        var b = v.style;
        v.option, v.options, v.containerRef, v.onScrollY, v.onScrollX, v.onScrollUp, v.onScrollDown, v.onScrollLeft, v.onScrollRight, v.onYReachStart, v.onYReachEnd, v.onXReachStart, v.onXReachEnd;
        var C = v.component;
        v.onSync;
        var E = v.children, R = u(v, ["className", "style", "option", "options", "containerRef", "onScrollY", "onScrollX", "onScrollUp", "onScrollDown", "onScrollLeft", "onScrollRight", "onYReachStart", "onYReachEnd", "onXReachStart", "onXReachEnd", "component", "onSync", "children"]), T = C;
        return i.default.createElement(
          T,
          n({ style: b, ref: this.handleRef }, R),
          E
        );
      }
    }]), g;
  }(o.Component);
  t.default = m, m.defaultProps = {
    className: "",
    style: void 0,
    option: void 0,
    options: void 0,
    containerRef: function() {
    },
    onScrollY: void 0,
    onScrollX: void 0,
    onScrollUp: void 0,
    onScrollDown: void 0,
    onScrollLeft: void 0,
    onScrollRight: void 0,
    onYReachStart: void 0,
    onYReachEnd: void 0,
    onXReachStart: void 0,
    onXReachEnd: void 0,
    onSync: function(g) {
      return g.update();
    },
    component: "div"
  }, m.propTypes = {
    children: s.PropTypes.node.isRequired,
    className: s.PropTypes.string,
    style: s.PropTypes.object,
    option: s.PropTypes.object,
    options: s.PropTypes.object,
    containerRef: s.PropTypes.func,
    onScrollY: s.PropTypes.func,
    onScrollX: s.PropTypes.func,
    onScrollUp: s.PropTypes.func,
    onScrollDown: s.PropTypes.func,
    onScrollLeft: s.PropTypes.func,
    onScrollRight: s.PropTypes.func,
    onYReachStart: s.PropTypes.func,
    onYReachEnd: s.PropTypes.func,
    onXReachStart: s.PropTypes.func,
    onXReachEnd: s.PropTypes.func,
    onSync: s.PropTypes.func,
    component: s.PropTypes.string
  }, e.exports = t.default;
})(fp, fp.exports);
(function(e, t) {
  Object.defineProperty(t, "__esModule", {
    value: !0
  });
  var n = fp.exports, r = o(n);
  function o(i) {
    return i && i.__esModule ? i : { default: i };
  }
  t.default = r.default, e.exports = t.default;
})(dp, dp.exports);
const x5 = /* @__PURE__ */ Tc(dp.exports), w5 = Xn(/* @__PURE__ */ S("path", {
  d: "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"
}), "Cancel");
function S5(e) {
  return he("MuiChip", e);
}
const C5 = fe("MuiChip", ["root", "sizeSmall", "sizeMedium", "colorError", "colorInfo", "colorPrimary", "colorSecondary", "colorSuccess", "colorWarning", "disabled", "clickable", "clickableColorPrimary", "clickableColorSecondary", "deletable", "deletableColorPrimary", "deletableColorSecondary", "outlined", "filled", "outlinedPrimary", "outlinedSecondary", "filledPrimary", "filledSecondary", "avatar", "avatarSmall", "avatarMedium", "avatarColorPrimary", "avatarColorSecondary", "icon", "iconSmall", "iconMedium", "iconColorPrimary", "iconColorSecondary", "label", "labelSmall", "labelMedium", "deleteIcon", "deleteIconSmall", "deleteIconMedium", "deleteIconColorPrimary", "deleteIconColorSecondary", "deleteIconOutlinedColorPrimary", "deleteIconOutlinedColorSecondary", "deleteIconFilledColorPrimary", "deleteIconFilledColorSecondary", "focusVisible"]), Ee = C5, k5 = ["avatar", "className", "clickable", "color", "component", "deleteIcon", "disabled", "icon", "label", "onClick", "onDelete", "onKeyDown", "onKeyUp", "size", "variant"], E5 = (e) => {
  const {
    classes: t,
    disabled: n,
    size: r,
    color: o,
    iconColor: i,
    onDelete: s,
    clickable: a,
    variant: l
  } = e, c = {
    root: ["root", l, n && "disabled", `size${N(r)}`, `color${N(o)}`, a && "clickable", a && `clickableColor${N(o)}`, s && "deletable", s && `deletableColor${N(o)}`, `${l}${N(o)}`],
    label: ["label", `label${N(r)}`],
    avatar: ["avatar", `avatar${N(r)}`, `avatarColor${N(o)}`],
    icon: ["icon", `icon${N(r)}`, `iconColor${N(i)}`],
    deleteIcon: ["deleteIcon", `deleteIcon${N(r)}`, `deleteIconColor${N(o)}`, `deleteIcon${N(l)}Color${N(o)}`]
  };
  return me(c, S5, t);
}, R5 = U("div", {
  name: "MuiChip",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e, {
      color: r,
      iconColor: o,
      clickable: i,
      onDelete: s,
      size: a,
      variant: l
    } = n;
    return [{
      [`& .${Ee.avatar}`]: t.avatar
    }, {
      [`& .${Ee.avatar}`]: t[`avatar${N(a)}`]
    }, {
      [`& .${Ee.avatar}`]: t[`avatarColor${N(r)}`]
    }, {
      [`& .${Ee.icon}`]: t.icon
    }, {
      [`& .${Ee.icon}`]: t[`icon${N(a)}`]
    }, {
      [`& .${Ee.icon}`]: t[`iconColor${N(o)}`]
    }, {
      [`& .${Ee.deleteIcon}`]: t.deleteIcon
    }, {
      [`& .${Ee.deleteIcon}`]: t[`deleteIcon${N(a)}`]
    }, {
      [`& .${Ee.deleteIcon}`]: t[`deleteIconColor${N(r)}`]
    }, {
      [`& .${Ee.deleteIcon}`]: t[`deleteIcon${N(l)}Color${N(r)}`]
    }, t.root, t[`size${N(a)}`], t[`color${N(r)}`], i && t.clickable, i && r !== "default" && t[`clickableColor${N(r)})`], s && t.deletable, s && r !== "default" && t[`deletableColor${N(r)}`], t[l], t[`${l}${N(r)}`]];
  }
})(({
  theme: e,
  ownerState: t
}) => {
  const n = Ie(e.palette.text.primary, 0.26), r = e.palette.mode === "light" ? e.palette.grey[700] : e.palette.grey[300];
  return k({
    maxWidth: "100%",
    fontFamily: e.typography.fontFamily,
    fontSize: e.typography.pxToRem(13),
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    color: (e.vars || e).palette.text.primary,
    backgroundColor: (e.vars || e).palette.action.selected,
    borderRadius: 32 / 2,
    whiteSpace: "nowrap",
    transition: e.transitions.create(["background-color", "box-shadow"]),
    cursor: "default",
    outline: 0,
    textDecoration: "none",
    border: 0,
    padding: 0,
    verticalAlign: "middle",
    boxSizing: "border-box",
    [`&.${Ee.disabled}`]: {
      opacity: (e.vars || e).palette.action.disabledOpacity,
      pointerEvents: "none"
    },
    [`& .${Ee.avatar}`]: {
      marginLeft: 5,
      marginRight: -6,
      width: 24,
      height: 24,
      color: e.vars ? e.vars.palette.Chip.defaultAvatarColor : r,
      fontSize: e.typography.pxToRem(12)
    },
    [`& .${Ee.avatarColorPrimary}`]: {
      color: (e.vars || e).palette.primary.contrastText,
      backgroundColor: (e.vars || e).palette.primary.dark
    },
    [`& .${Ee.avatarColorSecondary}`]: {
      color: (e.vars || e).palette.secondary.contrastText,
      backgroundColor: (e.vars || e).palette.secondary.dark
    },
    [`& .${Ee.avatarSmall}`]: {
      marginLeft: 4,
      marginRight: -4,
      width: 18,
      height: 18,
      fontSize: e.typography.pxToRem(10)
    },
    [`& .${Ee.icon}`]: k({
      marginLeft: 5,
      marginRight: -6
    }, t.size === "small" && {
      fontSize: 18,
      marginLeft: 4,
      marginRight: -4
    }, t.iconColor === t.color && k({
      color: e.vars ? e.vars.palette.Chip.defaultIconColor : r
    }, t.color !== "default" && {
      color: "inherit"
    })),
    [`& .${Ee.deleteIcon}`]: k({
      WebkitTapHighlightColor: "transparent",
      color: e.vars ? `rgba(${e.vars.palette.text.primaryChannel} / 0.26)` : n,
      fontSize: 22,
      cursor: "pointer",
      margin: "0 5px 0 -6px",
      "&:hover": {
        color: e.vars ? `rgba(${e.vars.palette.text.primaryChannel} / 0.4)` : Ie(n, 0.4)
      }
    }, t.size === "small" && {
      fontSize: 16,
      marginRight: 4,
      marginLeft: -4
    }, t.color !== "default" && {
      color: e.vars ? `rgba(${e.vars.palette[t.color].contrastTextChannel} / 0.7)` : Ie(e.palette[t.color].contrastText, 0.7),
      "&:hover, &:active": {
        color: (e.vars || e).palette[t.color].contrastText
      }
    })
  }, t.size === "small" && {
    height: 24
  }, t.color !== "default" && {
    backgroundColor: (e.vars || e).palette[t.color].main,
    color: (e.vars || e).palette[t.color].contrastText
  }, t.onDelete && {
    [`&.${Ee.focusVisible}`]: {
      backgroundColor: e.vars ? `rgba(${e.vars.palette.action.selectedChannel} / calc(${e.vars.palette.action.selectedOpacity + e.vars.palette.action.focusOpacity}))` : Ie(e.palette.action.selected, e.palette.action.selectedOpacity + e.palette.action.focusOpacity)
    }
  }, t.onDelete && t.color !== "default" && {
    [`&.${Ee.focusVisible}`]: {
      backgroundColor: (e.vars || e).palette[t.color].dark
    }
  });
}, ({
  theme: e,
  ownerState: t
}) => k({}, t.clickable && {
  userSelect: "none",
  WebkitTapHighlightColor: "transparent",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: e.vars ? `rgba(${e.vars.palette.action.selectedChannel} / calc(${e.vars.palette.action.selectedOpacity + e.vars.palette.action.hoverOpacity}))` : Ie(e.palette.action.selected, e.palette.action.selectedOpacity + e.palette.action.hoverOpacity)
  },
  [`&.${Ee.focusVisible}`]: {
    backgroundColor: e.vars ? `rgba(${e.vars.palette.action.selectedChannel} / calc(${e.vars.palette.action.selectedOpacity + e.vars.palette.action.focusOpacity}))` : Ie(e.palette.action.selected, e.palette.action.selectedOpacity + e.palette.action.focusOpacity)
  },
  "&:active": {
    boxShadow: (e.vars || e).shadows[1]
  }
}, t.clickable && t.color !== "default" && {
  [`&:hover, &.${Ee.focusVisible}`]: {
    backgroundColor: (e.vars || e).palette[t.color].dark
  }
}), ({
  theme: e,
  ownerState: t
}) => k({}, t.variant === "outlined" && {
  backgroundColor: "transparent",
  border: e.vars ? `1px solid ${e.vars.palette.Chip.defaultBorder}` : `1px solid ${e.palette.mode === "light" ? e.palette.grey[400] : e.palette.grey[700]}`,
  [`&.${Ee.clickable}:hover`]: {
    backgroundColor: (e.vars || e).palette.action.hover
  },
  [`&.${Ee.focusVisible}`]: {
    backgroundColor: (e.vars || e).palette.action.focus
  },
  [`& .${Ee.avatar}`]: {
    marginLeft: 4
  },
  [`& .${Ee.avatarSmall}`]: {
    marginLeft: 2
  },
  [`& .${Ee.icon}`]: {
    marginLeft: 4
  },
  [`& .${Ee.iconSmall}`]: {
    marginLeft: 2
  },
  [`& .${Ee.deleteIcon}`]: {
    marginRight: 5
  },
  [`& .${Ee.deleteIconSmall}`]: {
    marginRight: 3
  }
}, t.variant === "outlined" && t.color !== "default" && {
  color: (e.vars || e).palette[t.color].main,
  border: `1px solid ${e.vars ? `rgba(${e.vars.palette[t.color].mainChannel} / 0.7)` : Ie(e.palette[t.color].main, 0.7)}`,
  [`&.${Ee.clickable}:hover`]: {
    backgroundColor: e.vars ? `rgba(${e.vars.palette[t.color].mainChannel} / ${e.vars.palette.action.hoverOpacity})` : Ie(e.palette[t.color].main, e.palette.action.hoverOpacity)
  },
  [`&.${Ee.focusVisible}`]: {
    backgroundColor: e.vars ? `rgba(${e.vars.palette[t.color].mainChannel} / ${e.vars.palette.action.focusOpacity})` : Ie(e.palette[t.color].main, e.palette.action.focusOpacity)
  },
  [`& .${Ee.deleteIcon}`]: {
    color: e.vars ? `rgba(${e.vars.palette[t.color].mainChannel} / 0.7)` : Ie(e.palette[t.color].main, 0.7),
    "&:hover, &:active": {
      color: (e.vars || e).palette[t.color].main
    }
  }
})), T5 = U("span", {
  name: "MuiChip",
  slot: "Label",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e, {
      size: r
    } = n;
    return [t.label, t[`label${N(r)}`]];
  }
})(({
  ownerState: e
}) => k({
  overflow: "hidden",
  textOverflow: "ellipsis",
  paddingLeft: 12,
  paddingRight: 12,
  whiteSpace: "nowrap"
}, e.size === "small" && {
  paddingLeft: 8,
  paddingRight: 8
}));
function L0(e) {
  return e.key === "Backspace" || e.key === "Delete";
}
const P5 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiChip"
  }), {
    avatar: o,
    className: i,
    clickable: s,
    color: a = "default",
    component: l,
    deleteIcon: c,
    disabled: u = !1,
    icon: f,
    label: h,
    onClick: y,
    onDelete: d,
    onKeyDown: m,
    onKeyUp: w,
    size: g = "medium",
    variant: p = "filled"
  } = r, v = Q(r, k5), b = x.exports.useRef(null), C = Qe(b, n), E = (j) => {
    j.stopPropagation(), d && d(j);
  }, R = (j) => {
    j.currentTarget === j.target && L0(j) && j.preventDefault(), m && m(j);
  }, T = (j) => {
    j.currentTarget === j.target && (d && L0(j) ? d(j) : j.key === "Escape" && b.current && b.current.blur()), w && w(j);
  }, O = s !== !1 && y ? !0 : s, P = O || d ? Ei : l || "div", $ = k({}, r, {
    component: P,
    disabled: u,
    size: g,
    color: a,
    iconColor: /* @__PURE__ */ x.exports.isValidElement(f) && f.props.color || a,
    onDelete: !!d,
    clickable: O,
    variant: p
  }), B = E5($), D = P === Ei ? k({
    component: l || "div",
    focusVisibleClassName: B.focusVisible
  }, d && {
    disableRipple: !0
  }) : {};
  let I = null;
  d && (I = c && /* @__PURE__ */ x.exports.isValidElement(c) ? /* @__PURE__ */ x.exports.cloneElement(c, {
    className: Z(c.props.className, B.deleteIcon),
    onClick: E
  }) : /* @__PURE__ */ S(w5, {
    className: Z(B.deleteIcon),
    onClick: E
  }));
  let M = null;
  o && /* @__PURE__ */ x.exports.isValidElement(o) && (M = /* @__PURE__ */ x.exports.cloneElement(o, {
    className: Z(B.avatar, o.props.className)
  }));
  let A = null;
  return f && /* @__PURE__ */ x.exports.isValidElement(f) && (A = /* @__PURE__ */ x.exports.cloneElement(f, {
    className: Z(B.icon, f.props.className)
  })), /* @__PURE__ */ G(R5, k({
    as: P,
    className: Z(B.root, i),
    disabled: O && u ? !0 : void 0,
    onClick: y,
    onKeyDown: R,
    onKeyUp: T,
    ref: C,
    ownerState: $
  }, D, v, {
    children: [M || A, /* @__PURE__ */ S(T5, {
      className: Z(B.label),
      ownerState: $,
      children: h
    }), I]
  }));
}), O5 = P5;
function eo({
  props: e,
  states: t,
  muiFormControl: n
}) {
  return t.reduce((r, o) => (r[o] = e[o], n && typeof e[o] > "u" && (r[o] = n[o]), r), {});
}
const $5 = /* @__PURE__ */ x.exports.createContext(), wm = $5;
function pr() {
  return x.exports.useContext(wm);
}
function _5(e) {
  return /* @__PURE__ */ S(fT, k({}, e, {
    defaultTheme: bu
  }));
}
function F0(e) {
  return e != null && !(Array.isArray(e) && e.length === 0);
}
function Sm(e, t = !1) {
  return e && (F0(e.value) && e.value !== "" || t && F0(e.defaultValue) && e.defaultValue !== "");
}
function M5(e) {
  return e.startAdornment;
}
function I5(e) {
  return he("MuiInputBase", e);
}
const A5 = fe("MuiInputBase", ["root", "formControl", "focused", "disabled", "adornedStart", "adornedEnd", "error", "sizeSmall", "multiline", "colorSecondary", "fullWidth", "hiddenLabel", "readOnly", "input", "inputSizeSmall", "inputMultiline", "inputTypeSearch", "inputAdornedStart", "inputAdornedEnd", "inputHiddenLabel"]), Ri = A5, N5 = ["aria-describedby", "autoComplete", "autoFocus", "className", "color", "components", "componentsProps", "defaultValue", "disabled", "disableInjectingGlobalStyles", "endAdornment", "error", "fullWidth", "id", "inputComponent", "inputProps", "inputRef", "margin", "maxRows", "minRows", "multiline", "name", "onBlur", "onChange", "onClick", "onFocus", "onKeyDown", "onKeyUp", "placeholder", "readOnly", "renderSuffix", "rows", "size", "slotProps", "slots", "startAdornment", "type", "value"], Pu = (e, t) => {
  const {
    ownerState: n
  } = e;
  return [t.root, n.formControl && t.formControl, n.startAdornment && t.adornedStart, n.endAdornment && t.adornedEnd, n.error && t.error, n.size === "small" && t.sizeSmall, n.multiline && t.multiline, n.color && t[`color${N(n.color)}`], n.fullWidth && t.fullWidth, n.hiddenLabel && t.hiddenLabel];
}, Ou = (e, t) => {
  const {
    ownerState: n
  } = e;
  return [t.input, n.size === "small" && t.inputSizeSmall, n.multiline && t.inputMultiline, n.type === "search" && t.inputTypeSearch, n.startAdornment && t.inputAdornedStart, n.endAdornment && t.inputAdornedEnd, n.hiddenLabel && t.inputHiddenLabel];
}, L5 = (e) => {
  const {
    classes: t,
    color: n,
    disabled: r,
    error: o,
    endAdornment: i,
    focused: s,
    formControl: a,
    fullWidth: l,
    hiddenLabel: c,
    multiline: u,
    readOnly: f,
    size: h,
    startAdornment: y,
    type: d
  } = e, m = {
    root: ["root", `color${N(n)}`, r && "disabled", o && "error", l && "fullWidth", s && "focused", a && "formControl", h === "small" && "sizeSmall", u && "multiline", y && "adornedStart", i && "adornedEnd", c && "hiddenLabel", f && "readOnly"],
    input: ["input", r && "disabled", d === "search" && "inputTypeSearch", u && "inputMultiline", h === "small" && "inputSizeSmall", c && "inputHiddenLabel", y && "inputAdornedStart", i && "inputAdornedEnd", f && "readOnly"]
  };
  return me(m, I5, t);
}, $u = U("div", {
  name: "MuiInputBase",
  slot: "Root",
  overridesResolver: Pu
})(({
  theme: e,
  ownerState: t
}) => k({}, e.typography.body1, {
  color: (e.vars || e).palette.text.primary,
  lineHeight: "1.4375em",
  boxSizing: "border-box",
  position: "relative",
  cursor: "text",
  display: "inline-flex",
  alignItems: "center",
  [`&.${Ri.disabled}`]: {
    color: (e.vars || e).palette.text.disabled,
    cursor: "default"
  }
}, t.multiline && k({
  padding: "4px 0 5px"
}, t.size === "small" && {
  paddingTop: 1
}), t.fullWidth && {
  width: "100%"
})), _u = U("input", {
  name: "MuiInputBase",
  slot: "Input",
  overridesResolver: Ou
})(({
  theme: e,
  ownerState: t
}) => {
  const n = e.palette.mode === "light", r = k({
    color: "currentColor"
  }, e.vars ? {
    opacity: e.vars.opacity.inputPlaceholder
  } : {
    opacity: n ? 0.42 : 0.5
  }, {
    transition: e.transitions.create("opacity", {
      duration: e.transitions.duration.shorter
    })
  }), o = {
    opacity: "0 !important"
  }, i = e.vars ? {
    opacity: e.vars.opacity.inputPlaceholder
  } : {
    opacity: n ? 0.42 : 0.5
  };
  return k({
    font: "inherit",
    letterSpacing: "inherit",
    color: "currentColor",
    padding: "4px 0 5px",
    border: 0,
    boxSizing: "content-box",
    background: "none",
    height: "1.4375em",
    margin: 0,
    WebkitTapHighlightColor: "transparent",
    display: "block",
    minWidth: 0,
    width: "100%",
    animationName: "mui-auto-fill-cancel",
    animationDuration: "10ms",
    "&::-webkit-input-placeholder": r,
    "&::-moz-placeholder": r,
    "&:-ms-input-placeholder": r,
    "&::-ms-input-placeholder": r,
    "&:focus": {
      outline: 0
    },
    "&:invalid": {
      boxShadow: "none"
    },
    "&::-webkit-search-decoration": {
      WebkitAppearance: "none"
    },
    [`label[data-shrink=false] + .${Ri.formControl} &`]: {
      "&::-webkit-input-placeholder": o,
      "&::-moz-placeholder": o,
      "&:-ms-input-placeholder": o,
      "&::-ms-input-placeholder": o,
      "&:focus::-webkit-input-placeholder": i,
      "&:focus::-moz-placeholder": i,
      "&:focus:-ms-input-placeholder": i,
      "&:focus::-ms-input-placeholder": i
    },
    [`&.${Ri.disabled}`]: {
      opacity: 1,
      WebkitTextFillColor: (e.vars || e).palette.text.disabled
    },
    "&:-webkit-autofill": {
      animationDuration: "5000s",
      animationName: "mui-auto-fill"
    }
  }, t.size === "small" && {
    paddingTop: 1
  }, t.multiline && {
    height: "auto",
    resize: "none",
    padding: 0,
    paddingTop: 0
  }, t.type === "search" && {
    MozAppearance: "textfield"
  });
}), F5 = /* @__PURE__ */ S(_5, {
  styles: {
    "@keyframes mui-auto-fill": {
      from: {
        display: "block"
      }
    },
    "@keyframes mui-auto-fill-cancel": {
      from: {
        display: "block"
      }
    }
  }
}), D5 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r;
  const o = ve({
    props: t,
    name: "MuiInputBase"
  }), {
    "aria-describedby": i,
    autoComplete: s,
    autoFocus: a,
    className: l,
    components: c = {},
    componentsProps: u = {},
    defaultValue: f,
    disabled: h,
    disableInjectingGlobalStyles: y,
    endAdornment: d,
    fullWidth: m = !1,
    id: w,
    inputComponent: g = "input",
    inputProps: p = {},
    inputRef: v,
    maxRows: b,
    minRows: C,
    multiline: E = !1,
    name: R,
    onBlur: T,
    onChange: O,
    onClick: P,
    onFocus: $,
    onKeyDown: B,
    onKeyUp: D,
    placeholder: I,
    readOnly: M,
    renderSuffix: A,
    rows: j,
    slotProps: _ = {},
    slots: z = {},
    startAdornment: F,
    type: Y = "text",
    value: q
  } = o, pe = Q(o, N5), ne = p.value != null ? p.value : q, {
    current: ae
  } = x.exports.useRef(ne != null), le = x.exports.useRef(), X = x.exports.useCallback((K) => {
  }, []), H = Qe(le, v, p.ref, X), [W, ce] = x.exports.useState(!1), re = pr(), ie = eo({
    props: o,
    muiFormControl: re,
    states: ["color", "disabled", "error", "hiddenLabel", "size", "required", "filled"]
  });
  ie.focused = re ? re.focused : W, x.exports.useEffect(() => {
    !re && h && W && (ce(!1), T && T());
  }, [re, h, W, T]);
  const de = re && re.onFilled, se = re && re.onEmpty, oe = x.exports.useCallback((K) => {
    Sm(K) ? de && de() : se && se();
  }, [de, se]);
  jn(() => {
    ae && oe({
      value: ne
    });
  }, [ne, oe, ae]);
  const ue = (K) => {
    if (ie.disabled) {
      K.stopPropagation();
      return;
    }
    $ && $(K), p.onFocus && p.onFocus(K), re && re.onFocus ? re.onFocus(K) : ce(!0);
  }, ge = (K) => {
    T && T(K), p.onBlur && p.onBlur(K), re && re.onBlur ? re.onBlur(K) : ce(!1);
  }, we = (K, ...J) => {
    if (!ae) {
      const Ae = K.target || le.current;
      if (Ae == null)
        throw new Error(Vr(1));
      oe({
        value: Ae.value
      });
    }
    p.onChange && p.onChange(K, ...J), O && O(K, ...J);
  };
  x.exports.useEffect(() => {
    oe(le.current);
  }, []);
  const ot = (K) => {
    le.current && K.currentTarget === K.target && le.current.focus(), P && P(K);
  };
  let Oe = g, ye = p;
  E && Oe === "input" && (j ? ye = k({
    type: void 0,
    minRows: j,
    maxRows: j
  }, ye) : ye = k({
    type: void 0,
    maxRows: b,
    minRows: C
  }, ye), Oe = N$);
  const Je = (K) => {
    oe(K.animationName === "mui-auto-fill-cancel" ? le.current : {
      value: "x"
    });
  };
  x.exports.useEffect(() => {
    re && re.setAdornedStart(Boolean(F));
  }, [re, F]);
  const Ke = k({}, o, {
    color: ie.color || "primary",
    disabled: ie.disabled,
    endAdornment: d,
    error: ie.error,
    focused: ie.focused,
    formControl: re,
    fullWidth: m,
    hiddenLabel: ie.hiddenLabel,
    multiline: E,
    size: ie.size,
    startAdornment: F,
    type: Y
  }), Ze = L5(Ke), Ye = z.root || c.Root || $u, bt = _.root || u.root || {}, Mt = z.input || c.Input || _u;
  return ye = k({}, ye, (r = _.input) != null ? r : u.input), /* @__PURE__ */ G(x.exports.Fragment, {
    children: [!y && F5, /* @__PURE__ */ G(Ye, k({}, bt, !aa(Ye) && {
      ownerState: k({}, Ke, bt.ownerState)
    }, {
      ref: n,
      onClick: ot
    }, pe, {
      className: Z(Ze.root, bt.className, l),
      children: [F, /* @__PURE__ */ S(wm.Provider, {
        value: null,
        children: /* @__PURE__ */ S(Mt, k({
          ownerState: Ke,
          "aria-invalid": ie.error,
          "aria-describedby": i,
          autoComplete: s,
          autoFocus: a,
          defaultValue: f,
          disabled: ie.disabled,
          id: w,
          onAnimationStart: Je,
          name: R,
          placeholder: I,
          readOnly: M,
          required: ie.required,
          rows: j,
          value: ne,
          onKeyDown: B,
          onKeyUp: D,
          type: Y
        }, ye, !aa(Mt) && {
          as: Oe,
          ownerState: k({}, Ke, ye.ownerState)
        }, {
          ref: H,
          className: Z(Ze.input, ye.className),
          onBlur: ge,
          onChange: we,
          onFocus: ue
        }))
      }), d, A ? A(k({}, ie, {
        startAdornment: F
      })) : null]
    }))]
  });
}), Cm = D5;
function z5(e) {
  return he("MuiInput", e);
}
const B5 = k({}, Ri, fe("MuiInput", ["root", "underline", "input"])), ll = B5;
function j5(e) {
  return he("MuiOutlinedInput", e);
}
const W5 = k({}, Ri, fe("MuiOutlinedInput", ["root", "notchedOutline", "input"])), vr = W5;
function U5(e) {
  return he("MuiFilledInput", e);
}
const H5 = k({}, Ri, fe("MuiFilledInput", ["root", "underline", "input"])), Bo = H5, V5 = Xn(/* @__PURE__ */ S("path", {
  d: "M7 10l5 5 5-5z"
}), "ArrowDropDown"), Y5 = ["addEndListener", "appear", "children", "easing", "in", "onEnter", "onEntered", "onEntering", "onExit", "onExited", "onExiting", "style", "timeout", "TransitionComponent"], X5 = {
  entering: {
    opacity: 1
  },
  entered: {
    opacity: 1
  }
}, K5 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = Mo(), o = {
    enter: r.transitions.duration.enteringScreen,
    exit: r.transitions.duration.leavingScreen
  }, {
    addEndListener: i,
    appear: s = !0,
    children: a,
    easing: l,
    in: c,
    onEnter: u,
    onEntered: f,
    onEntering: h,
    onExit: y,
    onExited: d,
    onExiting: m,
    style: w,
    timeout: g = o,
    TransitionComponent: p = Hx
  } = t, v = Q(t, Y5), b = x.exports.useRef(null), C = Qe(b, a.ref, n), E = (I) => (M) => {
    if (I) {
      const A = b.current;
      M === void 0 ? I(A) : I(A, M);
    }
  }, R = E(h), T = E((I, M) => {
    Dw(I);
    const A = Sc({
      style: w,
      timeout: g,
      easing: l
    }, {
      mode: "enter"
    });
    I.style.webkitTransition = r.transitions.create("opacity", A), I.style.transition = r.transitions.create("opacity", A), u && u(I, M);
  }), O = E(f), P = E(m), $ = E((I) => {
    const M = Sc({
      style: w,
      timeout: g,
      easing: l
    }, {
      mode: "exit"
    });
    I.style.webkitTransition = r.transitions.create("opacity", M), I.style.transition = r.transitions.create("opacity", M), y && y(I);
  }), B = E(d);
  return /* @__PURE__ */ S(p, k({
    appear: s,
    in: c,
    nodeRef: b,
    onEnter: T,
    onEntered: O,
    onEntering: R,
    onExit: $,
    onExited: B,
    onExiting: P,
    addEndListener: (I) => {
      i && i(b.current, I);
    },
    timeout: g
  }, v, {
    children: (I, M) => /* @__PURE__ */ x.exports.cloneElement(a, k({
      style: k({
        opacity: 0,
        visibility: I === "exited" && !c ? "hidden" : void 0
      }, X5[I], w, a.props.style),
      ref: C
    }, M))
  }));
}), Vw = K5;
function q5(e) {
  return he("MuiBackdrop", e);
}
fe("MuiBackdrop", ["root", "invisible"]);
const G5 = ["children", "component", "components", "componentsProps", "className", "invisible", "open", "slotProps", "slots", "transitionDuration", "TransitionComponent"], Q5 = (e) => {
  const {
    classes: t,
    invisible: n
  } = e;
  return me({
    root: ["root", n && "invisible"]
  }, q5, t);
}, J5 = U("div", {
  name: "MuiBackdrop",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, n.invisible && t.invisible];
  }
})(({
  ownerState: e
}) => k({
  position: "fixed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  right: 0,
  bottom: 0,
  top: 0,
  left: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  WebkitTapHighlightColor: "transparent"
}, e.invisible && {
  backgroundColor: "transparent"
})), Z5 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r, o, i;
  const s = ve({
    props: t,
    name: "MuiBackdrop"
  }), {
    children: a,
    component: l = "div",
    components: c = {},
    componentsProps: u = {},
    className: f,
    invisible: h = !1,
    open: y,
    slotProps: d = {},
    slots: m = {},
    transitionDuration: w,
    TransitionComponent: g = Vw
  } = s, p = Q(s, G5), v = k({}, s, {
    component: l,
    invisible: h
  }), b = Q5(v), C = (r = d.root) != null ? r : u.root;
  return /* @__PURE__ */ S(g, k({
    in: y,
    timeout: w
  }, p, {
    children: /* @__PURE__ */ S(J5, k({
      "aria-hidden": !0
    }, C, {
      as: (o = (i = m.root) != null ? i : c.Root) != null ? o : l,
      className: Z(b.root, f, C == null ? void 0 : C.className),
      ownerState: k({}, v, C == null ? void 0 : C.ownerState),
      classes: b,
      ref: n,
      children: a
    }))
  }));
}), Yw = Z5;
function eL(e) {
  return he("MuiButton", e);
}
const tL = fe("MuiButton", ["root", "text", "textInherit", "textPrimary", "textSecondary", "textSuccess", "textError", "textInfo", "textWarning", "outlined", "outlinedInherit", "outlinedPrimary", "outlinedSecondary", "outlinedSuccess", "outlinedError", "outlinedInfo", "outlinedWarning", "contained", "containedInherit", "containedPrimary", "containedSecondary", "containedSuccess", "containedError", "containedInfo", "containedWarning", "disableElevation", "focusVisible", "disabled", "colorInherit", "textSizeSmall", "textSizeMedium", "textSizeLarge", "outlinedSizeSmall", "outlinedSizeMedium", "outlinedSizeLarge", "containedSizeSmall", "containedSizeMedium", "containedSizeLarge", "sizeMedium", "sizeSmall", "sizeLarge", "fullWidth", "startIcon", "endIcon", "iconSizeSmall", "iconSizeMedium", "iconSizeLarge"]), cl = tL, nL = /* @__PURE__ */ x.exports.createContext({}), Xw = nL, rL = ["children", "color", "component", "className", "disabled", "disableElevation", "disableFocusRipple", "endIcon", "focusVisibleClassName", "fullWidth", "size", "startIcon", "type", "variant"], oL = (e) => {
  const {
    color: t,
    disableElevation: n,
    fullWidth: r,
    size: o,
    variant: i,
    classes: s
  } = e, a = {
    root: ["root", i, `${i}${N(t)}`, `size${N(o)}`, `${i}Size${N(o)}`, t === "inherit" && "colorInherit", n && "disableElevation", r && "fullWidth"],
    label: ["label"],
    startIcon: ["startIcon", `iconSize${N(o)}`],
    endIcon: ["endIcon", `iconSize${N(o)}`]
  }, l = me(a, eL, s);
  return k({}, s, l);
}, Kw = (e) => k({}, e.size === "small" && {
  "& > *:nth-of-type(1)": {
    fontSize: 18
  }
}, e.size === "medium" && {
  "& > *:nth-of-type(1)": {
    fontSize: 20
  }
}, e.size === "large" && {
  "& > *:nth-of-type(1)": {
    fontSize: 22
  }
}), iL = U(Ei, {
  shouldForwardProp: (e) => Tn(e) || e === "classes",
  name: "MuiButton",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, t[n.variant], t[`${n.variant}${N(n.color)}`], t[`size${N(n.size)}`], t[`${n.variant}Size${N(n.size)}`], n.color === "inherit" && t.colorInherit, n.disableElevation && t.disableElevation, n.fullWidth && t.fullWidth];
  }
})(({
  theme: e,
  ownerState: t
}) => {
  var n, r;
  return k({}, e.typography.button, {
    minWidth: 64,
    padding: "6px 16px",
    borderRadius: (e.vars || e).shape.borderRadius,
    transition: e.transitions.create(["background-color", "box-shadow", "border-color", "color"], {
      duration: e.transitions.duration.short
    }),
    "&:hover": k({
      textDecoration: "none",
      backgroundColor: e.vars ? `rgba(${e.vars.palette.text.primaryChannel} / ${e.vars.palette.action.hoverOpacity})` : Ie(e.palette.text.primary, e.palette.action.hoverOpacity),
      "@media (hover: none)": {
        backgroundColor: "transparent"
      }
    }, t.variant === "text" && t.color !== "inherit" && {
      backgroundColor: e.vars ? `rgba(${e.vars.palette[t.color].mainChannel} / ${e.vars.palette.action.hoverOpacity})` : Ie(e.palette[t.color].main, e.palette.action.hoverOpacity),
      "@media (hover: none)": {
        backgroundColor: "transparent"
      }
    }, t.variant === "outlined" && t.color !== "inherit" && {
      border: `1px solid ${(e.vars || e).palette[t.color].main}`,
      backgroundColor: e.vars ? `rgba(${e.vars.palette[t.color].mainChannel} / ${e.vars.palette.action.hoverOpacity})` : Ie(e.palette[t.color].main, e.palette.action.hoverOpacity),
      "@media (hover: none)": {
        backgroundColor: "transparent"
      }
    }, t.variant === "contained" && {
      backgroundColor: (e.vars || e).palette.grey.A100,
      boxShadow: (e.vars || e).shadows[4],
      "@media (hover: none)": {
        boxShadow: (e.vars || e).shadows[2],
        backgroundColor: (e.vars || e).palette.grey[300]
      }
    }, t.variant === "contained" && t.color !== "inherit" && {
      backgroundColor: (e.vars || e).palette[t.color].dark,
      "@media (hover: none)": {
        backgroundColor: (e.vars || e).palette[t.color].main
      }
    }),
    "&:active": k({}, t.variant === "contained" && {
      boxShadow: (e.vars || e).shadows[8]
    }),
    [`&.${cl.focusVisible}`]: k({}, t.variant === "contained" && {
      boxShadow: (e.vars || e).shadows[6]
    }),
    [`&.${cl.disabled}`]: k({
      color: (e.vars || e).palette.action.disabled
    }, t.variant === "outlined" && {
      border: `1px solid ${(e.vars || e).palette.action.disabledBackground}`
    }, t.variant === "outlined" && t.color === "secondary" && {
      border: `1px solid ${(e.vars || e).palette.action.disabled}`
    }, t.variant === "contained" && {
      color: (e.vars || e).palette.action.disabled,
      boxShadow: (e.vars || e).shadows[0],
      backgroundColor: (e.vars || e).palette.action.disabledBackground
    })
  }, t.variant === "text" && {
    padding: "6px 8px"
  }, t.variant === "text" && t.color !== "inherit" && {
    color: (e.vars || e).palette[t.color].main
  }, t.variant === "outlined" && {
    padding: "5px 15px",
    border: "1px solid currentColor"
  }, t.variant === "outlined" && t.color !== "inherit" && {
    color: (e.vars || e).palette[t.color].main,
    border: e.vars ? `1px solid rgba(${e.vars.palette[t.color].mainChannel} / 0.5)` : `1px solid ${Ie(e.palette[t.color].main, 0.5)}`
  }, t.variant === "contained" && {
    color: e.vars ? e.vars.palette.text.primary : (n = (r = e.palette).getContrastText) == null ? void 0 : n.call(r, e.palette.grey[300]),
    backgroundColor: (e.vars || e).palette.grey[300],
    boxShadow: (e.vars || e).shadows[2]
  }, t.variant === "contained" && t.color !== "inherit" && {
    color: (e.vars || e).palette[t.color].contrastText,
    backgroundColor: (e.vars || e).palette[t.color].main
  }, t.color === "inherit" && {
    color: "inherit",
    borderColor: "currentColor"
  }, t.size === "small" && t.variant === "text" && {
    padding: "4px 5px",
    fontSize: e.typography.pxToRem(13)
  }, t.size === "large" && t.variant === "text" && {
    padding: "8px 11px",
    fontSize: e.typography.pxToRem(15)
  }, t.size === "small" && t.variant === "outlined" && {
    padding: "3px 9px",
    fontSize: e.typography.pxToRem(13)
  }, t.size === "large" && t.variant === "outlined" && {
    padding: "7px 21px",
    fontSize: e.typography.pxToRem(15)
  }, t.size === "small" && t.variant === "contained" && {
    padding: "4px 10px",
    fontSize: e.typography.pxToRem(13)
  }, t.size === "large" && t.variant === "contained" && {
    padding: "8px 22px",
    fontSize: e.typography.pxToRem(15)
  }, t.fullWidth && {
    width: "100%"
  });
}, ({
  ownerState: e
}) => e.disableElevation && {
  boxShadow: "none",
  "&:hover": {
    boxShadow: "none"
  },
  [`&.${cl.focusVisible}`]: {
    boxShadow: "none"
  },
  "&:active": {
    boxShadow: "none"
  },
  [`&.${cl.disabled}`]: {
    boxShadow: "none"
  }
}), sL = U("span", {
  name: "MuiButton",
  slot: "StartIcon",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.startIcon, t[`iconSize${N(n.size)}`]];
  }
})(({
  ownerState: e
}) => k({
  display: "inherit",
  marginRight: 8,
  marginLeft: -4
}, e.size === "small" && {
  marginLeft: -2
}, Kw(e))), aL = U("span", {
  name: "MuiButton",
  slot: "EndIcon",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.endIcon, t[`iconSize${N(n.size)}`]];
  }
})(({
  ownerState: e
}) => k({
  display: "inherit",
  marginRight: -4,
  marginLeft: 8
}, e.size === "small" && {
  marginRight: -2
}, Kw(e))), lL = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = x.exports.useContext(Xw), o = ax(r, t), i = ve({
    props: o,
    name: "MuiButton"
  }), {
    children: s,
    color: a = "primary",
    component: l = "button",
    className: c,
    disabled: u = !1,
    disableElevation: f = !1,
    disableFocusRipple: h = !1,
    endIcon: y,
    focusVisibleClassName: d,
    fullWidth: m = !1,
    size: w = "medium",
    startIcon: g,
    type: p,
    variant: v = "text"
  } = i, b = Q(i, rL), C = k({}, i, {
    color: a,
    component: l,
    disabled: u,
    disableElevation: f,
    disableFocusRipple: h,
    fullWidth: m,
    size: w,
    type: p,
    variant: v
  }), E = oL(C), R = g && /* @__PURE__ */ S(sL, {
    className: E.startIcon,
    ownerState: C,
    children: g
  }), T = y && /* @__PURE__ */ S(aL, {
    className: E.endIcon,
    ownerState: C,
    children: y
  });
  return /* @__PURE__ */ G(iL, k({
    ownerState: C,
    className: Z(r.className, E.root, c),
    component: l,
    disabled: u,
    focusRipple: !h,
    focusVisibleClassName: Z(E.focusVisible, d),
    ref: n,
    type: p
  }, b, {
    classes: E,
    children: [R, s, T]
  }));
}), st = lL;
function cL(e) {
  return he("MuiButtonGroup", e);
}
const uL = fe("MuiButtonGroup", ["root", "contained", "outlined", "text", "disableElevation", "disabled", "fullWidth", "vertical", "grouped", "groupedHorizontal", "groupedVertical", "groupedText", "groupedTextHorizontal", "groupedTextVertical", "groupedTextPrimary", "groupedTextSecondary", "groupedOutlined", "groupedOutlinedHorizontal", "groupedOutlinedVertical", "groupedOutlinedPrimary", "groupedOutlinedSecondary", "groupedContained", "groupedContainedHorizontal", "groupedContainedVertical", "groupedContainedPrimary", "groupedContainedSecondary"]), kr = uL, dL = ["children", "className", "color", "component", "disabled", "disableElevation", "disableFocusRipple", "disableRipple", "fullWidth", "orientation", "size", "variant"], fL = (e, t) => {
  const {
    ownerState: n
  } = e;
  return [{
    [`& .${kr.grouped}`]: t.grouped
  }, {
    [`& .${kr.grouped}`]: t[`grouped${N(n.orientation)}`]
  }, {
    [`& .${kr.grouped}`]: t[`grouped${N(n.variant)}`]
  }, {
    [`& .${kr.grouped}`]: t[`grouped${N(n.variant)}${N(n.orientation)}`]
  }, {
    [`& .${kr.grouped}`]: t[`grouped${N(n.variant)}${N(n.color)}`]
  }, t.root, t[n.variant], n.disableElevation === !0 && t.disableElevation, n.fullWidth && t.fullWidth, n.orientation === "vertical" && t.vertical];
}, pL = (e) => {
  const {
    classes: t,
    color: n,
    disabled: r,
    disableElevation: o,
    fullWidth: i,
    orientation: s,
    variant: a
  } = e, l = {
    root: ["root", a, s === "vertical" && "vertical", i && "fullWidth", o && "disableElevation"],
    grouped: ["grouped", `grouped${N(s)}`, `grouped${N(a)}`, `grouped${N(a)}${N(s)}`, `grouped${N(a)}${N(n)}`, r && "disabled"]
  };
  return me(l, cL, t);
}, hL = U("div", {
  name: "MuiButtonGroup",
  slot: "Root",
  overridesResolver: fL
})(({
  theme: e,
  ownerState: t
}) => k({
  display: "inline-flex",
  borderRadius: (e.vars || e).shape.borderRadius
}, t.variant === "contained" && {
  boxShadow: (e.vars || e).shadows[2]
}, t.disableElevation && {
  boxShadow: "none"
}, t.fullWidth && {
  width: "100%"
}, t.orientation === "vertical" && {
  flexDirection: "column"
}, {
  [`& .${kr.grouped}`]: k({
    minWidth: 40,
    "&:not(:first-of-type)": k({}, t.orientation === "horizontal" && {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0
    }, t.orientation === "vertical" && {
      borderTopRightRadius: 0,
      borderTopLeftRadius: 0
    }, t.variant === "outlined" && t.orientation === "horizontal" && {
      marginLeft: -1
    }, t.variant === "outlined" && t.orientation === "vertical" && {
      marginTop: -1
    }),
    "&:not(:last-of-type)": k({}, t.orientation === "horizontal" && {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0
    }, t.orientation === "vertical" && {
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0
    }, t.variant === "text" && t.orientation === "horizontal" && {
      borderRight: e.vars ? `1px solid rgba(${e.vars.palette.common.onBackgroundChannel} / 0.23)` : `1px solid ${e.palette.mode === "light" ? "rgba(0, 0, 0, 0.23)" : "rgba(255, 255, 255, 0.23)"}`
    }, t.variant === "text" && t.orientation === "vertical" && {
      borderBottom: e.vars ? `1px solid rgba(${e.vars.palette.common.onBackgroundChannel} / 0.23)` : `1px solid ${e.palette.mode === "light" ? "rgba(0, 0, 0, 0.23)" : "rgba(255, 255, 255, 0.23)"}`
    }, t.variant === "text" && t.color !== "inherit" && {
      borderColor: e.vars ? `rgba(${e.vars.palette[t.color].mainChannel} / 0.5)` : Ie(e.palette[t.color].main, 0.5)
    }, t.variant === "outlined" && t.orientation === "horizontal" && {
      borderRightColor: "transparent"
    }, t.variant === "outlined" && t.orientation === "vertical" && {
      borderBottomColor: "transparent"
    }, t.variant === "contained" && t.orientation === "horizontal" && {
      borderRight: `1px solid ${(e.vars || e).palette.grey[400]}`,
      [`&.${kr.disabled}`]: {
        borderRight: `1px solid ${(e.vars || e).palette.action.disabled}`
      }
    }, t.variant === "contained" && t.orientation === "vertical" && {
      borderBottom: `1px solid ${(e.vars || e).palette.grey[400]}`,
      [`&.${kr.disabled}`]: {
        borderBottom: `1px solid ${(e.vars || e).palette.action.disabled}`
      }
    }, t.variant === "contained" && t.color !== "inherit" && {
      borderColor: (e.vars || e).palette[t.color].dark
    }, {
      "&:hover": k({}, t.variant === "outlined" && t.orientation === "horizontal" && {
        borderRightColor: "currentColor"
      }, t.variant === "outlined" && t.orientation === "vertical" && {
        borderBottomColor: "currentColor"
      })
    }),
    "&:hover": k({}, t.variant === "contained" && {
      boxShadow: "none"
    })
  }, t.variant === "contained" && {
    boxShadow: "none"
  })
})), mL = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiButtonGroup"
  }), {
    children: o,
    className: i,
    color: s = "primary",
    component: a = "div",
    disabled: l = !1,
    disableElevation: c = !1,
    disableFocusRipple: u = !1,
    disableRipple: f = !1,
    fullWidth: h = !1,
    orientation: y = "horizontal",
    size: d = "medium",
    variant: m = "outlined"
  } = r, w = Q(r, dL), g = k({}, r, {
    color: s,
    component: a,
    disabled: l,
    disableElevation: c,
    disableFocusRipple: u,
    disableRipple: f,
    fullWidth: h,
    orientation: y,
    size: d,
    variant: m
  }), p = pL(g), v = x.exports.useMemo(() => ({
    className: p.grouped,
    color: s,
    disabled: l,
    disableElevation: c,
    disableFocusRipple: u,
    disableRipple: f,
    fullWidth: h,
    size: d,
    variant: m
  }), [s, l, c, u, f, h, d, m, p.grouped]);
  return /* @__PURE__ */ S(hL, k({
    as: a,
    role: "group",
    className: Z(p.root, i),
    ref: n,
    ownerState: g
  }, w, {
    children: /* @__PURE__ */ S(Xw.Provider, {
      value: v,
      children: o
    })
  }));
}), gL = mL;
function vL(e) {
  return he("MuiCardMedia", e);
}
fe("MuiCardMedia", ["root", "media", "img"]);
const yL = ["children", "className", "component", "image", "src", "style"], bL = (e) => {
  const {
    classes: t,
    isMediaComponent: n,
    isImageComponent: r
  } = e;
  return me({
    root: ["root", n && "media", r && "img"]
  }, vL, t);
}, xL = U("div", {
  name: "MuiCardMedia",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e, {
      isMediaComponent: r,
      isImageComponent: o
    } = n;
    return [t.root, r && t.media, o && t.img];
  }
})(({
  ownerState: e
}) => k({
  display: "block",
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center"
}, e.isMediaComponent && {
  width: "100%"
}, e.isImageComponent && {
  objectFit: "cover"
})), wL = ["video", "audio", "picture", "iframe", "img"], SL = ["picture", "img"], CL = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiCardMedia"
  }), {
    children: o,
    className: i,
    component: s = "div",
    image: a,
    src: l,
    style: c
  } = r, u = Q(r, yL), f = wL.indexOf(s) !== -1, h = !f && a ? k({
    backgroundImage: `url("${a}")`
  }, c) : c, y = k({}, r, {
    component: s,
    isMediaComponent: f,
    isImageComponent: SL.indexOf(s) !== -1
  }), d = bL(y);
  return /* @__PURE__ */ S(xL, k({
    className: Z(d.root, i),
    as: s,
    role: !f && a ? "img" : void 0,
    ref: n,
    style: h,
    ownerState: y,
    src: f ? a || l : void 0
  }, u, {
    children: o
  }));
}), kL = CL;
function EL(e) {
  return he("PrivateSwitchBase", e);
}
fe("PrivateSwitchBase", ["root", "checked", "disabled", "input", "edgeStart", "edgeEnd"]);
const RL = ["autoFocus", "checked", "checkedIcon", "className", "defaultChecked", "disabled", "disableFocusRipple", "edge", "icon", "id", "inputProps", "inputRef", "name", "onBlur", "onChange", "onFocus", "readOnly", "required", "tabIndex", "type", "value"], TL = (e) => {
  const {
    classes: t,
    checked: n,
    disabled: r,
    edge: o
  } = e, i = {
    root: ["root", n && "checked", r && "disabled", o && `edge${N(o)}`],
    input: ["input"]
  };
  return me(i, EL, t);
}, PL = U(Ei)(({
  ownerState: e
}) => k({
  padding: 9,
  borderRadius: "50%"
}, e.edge === "start" && {
  marginLeft: e.size === "small" ? -3 : -12
}, e.edge === "end" && {
  marginRight: e.size === "small" ? -3 : -12
})), OL = U("input")({
  cursor: "inherit",
  position: "absolute",
  opacity: 0,
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
  margin: 0,
  padding: 0,
  zIndex: 1
}), $L = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const {
    autoFocus: r,
    checked: o,
    checkedIcon: i,
    className: s,
    defaultChecked: a,
    disabled: l,
    disableFocusRipple: c = !1,
    edge: u = !1,
    icon: f,
    id: h,
    inputProps: y,
    inputRef: d,
    name: m,
    onBlur: w,
    onChange: g,
    onFocus: p,
    readOnly: v,
    required: b,
    tabIndex: C,
    type: E,
    value: R
  } = t, T = Q(t, RL), [O, P] = oa({
    controlled: o,
    default: Boolean(a),
    name: "SwitchBase",
    state: "checked"
  }), $ = pr(), B = (z) => {
    p && p(z), $ && $.onFocus && $.onFocus(z);
  }, D = (z) => {
    w && w(z), $ && $.onBlur && $.onBlur(z);
  }, I = (z) => {
    if (z.nativeEvent.defaultPrevented)
      return;
    const F = z.target.checked;
    P(F), g && g(z, F);
  };
  let M = l;
  $ && typeof M > "u" && (M = $.disabled);
  const A = E === "checkbox" || E === "radio", j = k({}, t, {
    checked: O,
    disabled: M,
    disableFocusRipple: c,
    edge: u
  }), _ = TL(j);
  return /* @__PURE__ */ G(PL, k({
    component: "span",
    className: Z(_.root, s),
    centerRipple: !0,
    focusRipple: !c,
    disabled: M,
    tabIndex: null,
    role: void 0,
    onFocus: B,
    onBlur: D,
    ownerState: j,
    ref: n
  }, T, {
    children: [/* @__PURE__ */ S(OL, k({
      autoFocus: r,
      checked: o,
      defaultChecked: a,
      className: _.input,
      disabled: M,
      id: A && h,
      name: m,
      onChange: I,
      readOnly: v,
      ref: d,
      required: b,
      ownerState: j,
      tabIndex: C,
      type: E
    }, E === "checkbox" && R === void 0 ? {} : {
      value: R
    }, y)), O ? i : f]
  }));
}), _L = $L;
function ML(e) {
  return he("MuiCircularProgress", e);
}
fe("MuiCircularProgress", ["root", "determinate", "indeterminate", "colorPrimary", "colorSecondary", "svg", "circle", "circleDeterminate", "circleIndeterminate", "circleDisableShrink"]);
const IL = ["className", "color", "disableShrink", "size", "style", "thickness", "value", "variant"];
let Mu = (e) => e, D0, z0, B0, j0;
const yr = 44, AL = Ea(D0 || (D0 = Mu`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`)), NL = Ea(z0 || (z0 = Mu`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }

  100% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -125px;
  }
`)), LL = (e) => {
  const {
    classes: t,
    variant: n,
    color: r,
    disableShrink: o
  } = e, i = {
    root: ["root", n, `color${N(r)}`],
    svg: ["svg"],
    circle: ["circle", `circle${N(n)}`, o && "circleDisableShrink"]
  };
  return me(i, ML, t);
}, FL = U("span", {
  name: "MuiCircularProgress",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, t[n.variant], t[`color${N(n.color)}`]];
  }
})(({
  ownerState: e,
  theme: t
}) => k({
  display: "inline-block"
}, e.variant === "determinate" && {
  transition: t.transitions.create("transform")
}, e.color !== "inherit" && {
  color: (t.vars || t).palette[e.color].main
}), ({
  ownerState: e
}) => e.variant === "indeterminate" && Oh(B0 || (B0 = Mu`
      animation: ${0} 1.4s linear infinite;
    `), AL)), DL = U("svg", {
  name: "MuiCircularProgress",
  slot: "Svg",
  overridesResolver: (e, t) => t.svg
})({
  display: "block"
}), zL = U("circle", {
  name: "MuiCircularProgress",
  slot: "Circle",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.circle, t[`circle${N(n.variant)}`], n.disableShrink && t.circleDisableShrink];
  }
})(({
  ownerState: e,
  theme: t
}) => k({
  stroke: "currentColor"
}, e.variant === "determinate" && {
  transition: t.transitions.create("stroke-dashoffset")
}, e.variant === "indeterminate" && {
  strokeDasharray: "80px, 200px",
  strokeDashoffset: 0
}), ({
  ownerState: e
}) => e.variant === "indeterminate" && !e.disableShrink && Oh(j0 || (j0 = Mu`
      animation: ${0} 1.4s ease-in-out infinite;
    `), NL)), BL = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiCircularProgress"
  }), {
    className: o,
    color: i = "primary",
    disableShrink: s = !1,
    size: a = 40,
    style: l,
    thickness: c = 3.6,
    value: u = 0,
    variant: f = "indeterminate"
  } = r, h = Q(r, IL), y = k({}, r, {
    color: i,
    disableShrink: s,
    size: a,
    thickness: c,
    value: u,
    variant: f
  }), d = LL(y), m = {}, w = {}, g = {};
  if (f === "determinate") {
    const p = 2 * Math.PI * ((yr - c) / 2);
    m.strokeDasharray = p.toFixed(3), g["aria-valuenow"] = Math.round(u), m.strokeDashoffset = `${((100 - u) / 100 * p).toFixed(3)}px`, w.transform = "rotate(-90deg)";
  }
  return /* @__PURE__ */ S(FL, k({
    className: Z(d.root, o),
    style: k({
      width: a,
      height: a
    }, w, l),
    ownerState: y,
    ref: n,
    role: "progressbar"
  }, g, h, {
    children: /* @__PURE__ */ S(DL, {
      className: d.svg,
      ownerState: y,
      viewBox: `${yr / 2} ${yr / 2} ${yr} ${yr}`,
      children: /* @__PURE__ */ S(zL, {
        className: d.circle,
        style: m,
        ownerState: y,
        cx: yr,
        cy: yr,
        r: (yr - c) / 2,
        fill: "none",
        strokeWidth: c
      })
    })
  }));
}), qw = BL, jL = ["BackdropComponent", "BackdropProps", "closeAfterTransition", "children", "component", "components", "componentsProps", "disableAutoFocus", "disableEnforceFocus", "disableEscapeKeyDown", "disablePortal", "disableRestoreFocus", "disableScrollLock", "hideBackdrop", "keepMounted", "slotProps", "slots", "theme"], WL = (e) => e.classes, UL = U("div", {
  name: "MuiModal",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, !n.open && n.exited && t.hidden];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  position: "fixed",
  zIndex: (e.vars || e).zIndex.modal,
  right: 0,
  bottom: 0,
  top: 0,
  left: 0
}, !t.open && t.exited && {
  visibility: "hidden"
})), HL = U(Yw, {
  name: "MuiModal",
  slot: "Backdrop",
  overridesResolver: (e, t) => t.backdrop
})({
  zIndex: -1
}), VL = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r, o, i, s, a, l;
  const c = ve({
    name: "MuiModal",
    props: t
  }), {
    BackdropComponent: u = HL,
    BackdropProps: f,
    closeAfterTransition: h = !1,
    children: y,
    component: d,
    components: m = {},
    componentsProps: w = {},
    disableAutoFocus: g = !1,
    disableEnforceFocus: p = !1,
    disableEscapeKeyDown: v = !1,
    disablePortal: b = !1,
    disableRestoreFocus: C = !1,
    disableScrollLock: E = !1,
    hideBackdrop: R = !1,
    keepMounted: T = !1,
    slotProps: O,
    slots: P,
    theme: $
  } = c, B = Q(c, jL), [D, I] = x.exports.useState(!0), M = {
    closeAfterTransition: h,
    disableAutoFocus: g,
    disableEnforceFocus: p,
    disableEscapeKeyDown: v,
    disablePortal: b,
    disableRestoreFocus: C,
    disableScrollLock: E,
    hideBackdrop: R,
    keepMounted: T
  }, A = k({}, c, M, {
    exited: D
  }), j = WL(A), _ = (r = (o = P == null ? void 0 : P.root) != null ? o : m.Root) != null ? r : UL, z = (i = (s = P == null ? void 0 : P.backdrop) != null ? s : m.Backdrop) != null ? i : u, F = (a = O == null ? void 0 : O.root) != null ? a : w.root, Y = (l = O == null ? void 0 : O.backdrop) != null ? l : w.backdrop;
  return /* @__PURE__ */ S(_$, k({
    slots: {
      root: _,
      backdrop: z
    },
    slotProps: {
      root: () => k({}, jf(F, A), !aa(_) && {
        as: d,
        theme: $
      }),
      backdrop: () => k({}, f, jf(Y, A))
    },
    onTransitionEnter: () => I(!1),
    onTransitionExited: () => I(!0),
    ref: n
  }, B, {
    classes: j
  }, M, {
    children: y
  }));
}), Gw = VL;
function YL(e) {
  return he("MuiDialog", e);
}
const XL = fe("MuiDialog", ["root", "scrollPaper", "scrollBody", "container", "paper", "paperScrollPaper", "paperScrollBody", "paperWidthFalse", "paperWidthXs", "paperWidthSm", "paperWidthMd", "paperWidthLg", "paperWidthXl", "paperFullWidth", "paperFullScreen"]), Ld = XL, KL = /* @__PURE__ */ x.exports.createContext({}), Qw = KL, qL = ["aria-describedby", "aria-labelledby", "BackdropComponent", "BackdropProps", "children", "className", "disableEscapeKeyDown", "fullScreen", "fullWidth", "maxWidth", "onBackdropClick", "onClose", "open", "PaperComponent", "PaperProps", "scroll", "TransitionComponent", "transitionDuration", "TransitionProps"], GL = U(Yw, {
  name: "MuiDialog",
  slot: "Backdrop",
  overrides: (e, t) => t.backdrop
})({
  zIndex: -1
}), QL = (e) => {
  const {
    classes: t,
    scroll: n,
    maxWidth: r,
    fullWidth: o,
    fullScreen: i
  } = e, s = {
    root: ["root"],
    container: ["container", `scroll${N(n)}`],
    paper: ["paper", `paperScroll${N(n)}`, `paperWidth${N(String(r))}`, o && "paperFullWidth", i && "paperFullScreen"]
  };
  return me(s, YL, t);
}, JL = U(Gw, {
  name: "MuiDialog",
  slot: "Root",
  overridesResolver: (e, t) => t.root
})({
  "@media print": {
    position: "absolute !important"
  }
}), ZL = U("div", {
  name: "MuiDialog",
  slot: "Container",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.container, t[`scroll${N(n.scroll)}`]];
  }
})(({
  ownerState: e
}) => k({
  height: "100%",
  "@media print": {
    height: "auto"
  },
  outline: 0
}, e.scroll === "paper" && {
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
}, e.scroll === "body" && {
  overflowY: "auto",
  overflowX: "hidden",
  textAlign: "center",
  "&:after": {
    content: '""',
    display: "inline-block",
    verticalAlign: "middle",
    height: "100%",
    width: "0"
  }
})), e4 = U(Fi, {
  name: "MuiDialog",
  slot: "Paper",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.paper, t[`scrollPaper${N(n.scroll)}`], t[`paperWidth${N(String(n.maxWidth))}`], n.fullWidth && t.paperFullWidth, n.fullScreen && t.paperFullScreen];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  margin: 32,
  position: "relative",
  overflowY: "auto",
  "@media print": {
    overflowY: "visible",
    boxShadow: "none"
  }
}, t.scroll === "paper" && {
  display: "flex",
  flexDirection: "column",
  maxHeight: "calc(100% - 64px)"
}, t.scroll === "body" && {
  display: "inline-block",
  verticalAlign: "middle",
  textAlign: "left"
}, !t.maxWidth && {
  maxWidth: "calc(100% - 64px)"
}, t.maxWidth === "xs" && {
  maxWidth: e.breakpoints.unit === "px" ? Math.max(e.breakpoints.values.xs, 444) : `${e.breakpoints.values.xs}${e.breakpoints.unit}`,
  [`&.${Ld.paperScrollBody}`]: {
    [e.breakpoints.down(Math.max(e.breakpoints.values.xs, 444) + 32 * 2)]: {
      maxWidth: "calc(100% - 64px)"
    }
  }
}, t.maxWidth && t.maxWidth !== "xs" && {
  maxWidth: `${e.breakpoints.values[t.maxWidth]}${e.breakpoints.unit}`,
  [`&.${Ld.paperScrollBody}`]: {
    [e.breakpoints.down(e.breakpoints.values[t.maxWidth] + 32 * 2)]: {
      maxWidth: "calc(100% - 64px)"
    }
  }
}, t.fullWidth && {
  width: "calc(100% - 64px)"
}, t.fullScreen && {
  margin: 0,
  width: "100%",
  maxWidth: "100%",
  height: "100%",
  maxHeight: "none",
  borderRadius: 0,
  [`&.${Ld.paperScrollBody}`]: {
    margin: 0,
    maxWidth: "100%"
  }
})), t4 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiDialog"
  }), o = Mo(), i = {
    enter: o.transitions.duration.enteringScreen,
    exit: o.transitions.duration.leavingScreen
  }, {
    "aria-describedby": s,
    "aria-labelledby": a,
    BackdropComponent: l,
    BackdropProps: c,
    children: u,
    className: f,
    disableEscapeKeyDown: h = !1,
    fullScreen: y = !1,
    fullWidth: d = !1,
    maxWidth: m = "sm",
    onBackdropClick: w,
    onClose: g,
    open: p,
    PaperComponent: v = Fi,
    PaperProps: b = {},
    scroll: C = "paper",
    TransitionComponent: E = Vw,
    transitionDuration: R = i,
    TransitionProps: T
  } = r, O = Q(r, qL), P = k({}, r, {
    disableEscapeKeyDown: h,
    fullScreen: y,
    fullWidth: d,
    maxWidth: m,
    scroll: C
  }), $ = QL(P), B = x.exports.useRef(), D = (j) => {
    B.current = j.target === j.currentTarget;
  }, I = (j) => {
    !B.current || (B.current = null, w && w(j), g && g(j, "backdropClick"));
  }, M = Ra(a), A = x.exports.useMemo(() => ({
    titleId: M
  }), [M]);
  return /* @__PURE__ */ S(JL, k({
    className: Z($.root, f),
    closeAfterTransition: !0,
    components: {
      Backdrop: GL
    },
    componentsProps: {
      backdrop: k({
        transitionDuration: R,
        as: l
      }, c)
    },
    disableEscapeKeyDown: h,
    onClose: g,
    open: p,
    ref: n,
    onClick: I,
    ownerState: P
  }, O, {
    children: /* @__PURE__ */ S(E, k({
      appear: !0,
      in: p,
      timeout: R,
      role: "presentation"
    }, T, {
      children: /* @__PURE__ */ S(ZL, {
        className: Z($.container),
        onMouseDown: D,
        ownerState: P,
        children: /* @__PURE__ */ S(e4, k({
          as: v,
          elevation: 24,
          role: "dialog",
          "aria-describedby": s,
          "aria-labelledby": M
        }, b, {
          className: Z($.paper, b.className),
          ownerState: P,
          children: /* @__PURE__ */ S(Qw.Provider, {
            value: A,
            children: u
          })
        }))
      })
    }))
  }));
}), n4 = t4;
function r4(e) {
  return he("MuiDialogActions", e);
}
fe("MuiDialogActions", ["root", "spacing"]);
const o4 = ["className", "disableSpacing"], i4 = (e) => {
  const {
    classes: t,
    disableSpacing: n
  } = e;
  return me({
    root: ["root", !n && "spacing"]
  }, r4, t);
}, s4 = U("div", {
  name: "MuiDialogActions",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, !n.disableSpacing && t.spacing];
  }
})(({
  ownerState: e
}) => k({
  display: "flex",
  alignItems: "center",
  padding: 8,
  justifyContent: "flex-end",
  flex: "0 0 auto"
}, !e.disableSpacing && {
  "& > :not(:first-of-type)": {
    marginLeft: 8
  }
})), a4 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiDialogActions"
  }), {
    className: o,
    disableSpacing: i = !1
  } = r, s = Q(r, o4), a = k({}, r, {
    disableSpacing: i
  }), l = i4(a);
  return /* @__PURE__ */ S(s4, k({
    className: Z(l.root, o),
    ownerState: a,
    ref: n
  }, s));
}), l4 = a4;
function c4(e) {
  return he("MuiDialogContent", e);
}
fe("MuiDialogContent", ["root", "dividers"]);
function u4(e) {
  return he("MuiDialogTitle", e);
}
const d4 = fe("MuiDialogTitle", ["root"]), f4 = d4, p4 = ["className", "dividers"], h4 = (e) => {
  const {
    classes: t,
    dividers: n
  } = e;
  return me({
    root: ["root", n && "dividers"]
  }, c4, t);
}, m4 = U("div", {
  name: "MuiDialogContent",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, n.dividers && t.dividers];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  flex: "1 1 auto",
  WebkitOverflowScrolling: "touch",
  overflowY: "auto",
  padding: "20px 24px"
}, t.dividers ? {
  padding: "16px 24px",
  borderTop: `1px solid ${(e.vars || e).palette.divider}`,
  borderBottom: `1px solid ${(e.vars || e).palette.divider}`
} : {
  [`.${f4.root} + &`]: {
    paddingTop: 0
  }
})), g4 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiDialogContent"
  }), {
    className: o,
    dividers: i = !1
  } = r, s = Q(r, p4), a = k({}, r, {
    dividers: i
  }), l = h4(a);
  return /* @__PURE__ */ S(m4, k({
    className: Z(l.root, o),
    ownerState: a,
    ref: n
  }, s));
}), v4 = g4;
function y4(e) {
  return he("MuiDialogContentText", e);
}
fe("MuiDialogContentText", ["root"]);
const b4 = ["children", "className"], x4 = (e) => {
  const {
    classes: t
  } = e, r = me({
    root: ["root"]
  }, y4, t);
  return k({}, t, r);
}, w4 = U(gt, {
  shouldForwardProp: (e) => Tn(e) || e === "classes",
  name: "MuiDialogContentText",
  slot: "Root",
  overridesResolver: (e, t) => t.root
})({}), S4 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiDialogContentText"
  }), {
    className: o
  } = r, i = Q(r, b4), s = x4(i);
  return /* @__PURE__ */ S(w4, k({
    component: "p",
    variant: "body1",
    color: "text.secondary",
    ref: n,
    ownerState: i,
    className: Z(s.root, o)
  }, r, {
    classes: s
  }));
}), C4 = S4, k4 = ["className", "id"], E4 = (e) => {
  const {
    classes: t
  } = e;
  return me({
    root: ["root"]
  }, u4, t);
}, R4 = U(gt, {
  name: "MuiDialogTitle",
  slot: "Root",
  overridesResolver: (e, t) => t.root
})({
  padding: "16px 24px",
  flex: "0 0 auto"
}), T4 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiDialogTitle"
  }), {
    className: o,
    id: i
  } = r, s = Q(r, k4), a = r, l = E4(a), {
    titleId: c = i
  } = x.exports.useContext(Qw);
  return /* @__PURE__ */ S(R4, k({
    component: "h2",
    className: Z(l.root, o),
    ownerState: a,
    ref: n,
    variant: "h6",
    id: c
  }, s));
}), P4 = T4;
function O4(e) {
  return he("MuiDivider", e);
}
const $4 = fe("MuiDivider", ["root", "absolute", "fullWidth", "inset", "middle", "flexItem", "light", "vertical", "withChildren", "withChildrenVertical", "textAlignRight", "textAlignLeft", "wrapper", "wrapperVertical"]), W0 = $4, _4 = ["absolute", "children", "className", "component", "flexItem", "light", "orientation", "role", "textAlign", "variant"], M4 = (e) => {
  const {
    absolute: t,
    children: n,
    classes: r,
    flexItem: o,
    light: i,
    orientation: s,
    textAlign: a,
    variant: l
  } = e;
  return me({
    root: ["root", t && "absolute", l, i && "light", s === "vertical" && "vertical", o && "flexItem", n && "withChildren", n && s === "vertical" && "withChildrenVertical", a === "right" && s !== "vertical" && "textAlignRight", a === "left" && s !== "vertical" && "textAlignLeft"],
    wrapper: ["wrapper", s === "vertical" && "wrapperVertical"]
  }, O4, r);
}, I4 = U("div", {
  name: "MuiDivider",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, n.absolute && t.absolute, t[n.variant], n.light && t.light, n.orientation === "vertical" && t.vertical, n.flexItem && t.flexItem, n.children && t.withChildren, n.children && n.orientation === "vertical" && t.withChildrenVertical, n.textAlign === "right" && n.orientation !== "vertical" && t.textAlignRight, n.textAlign === "left" && n.orientation !== "vertical" && t.textAlignLeft];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  margin: 0,
  flexShrink: 0,
  borderWidth: 0,
  borderStyle: "solid",
  borderColor: (e.vars || e).palette.divider,
  borderBottomWidth: "thin"
}, t.absolute && {
  position: "absolute",
  bottom: 0,
  left: 0,
  width: "100%"
}, t.light && {
  borderColor: e.vars ? `rgba(${e.vars.palette.dividerChannel} / 0.08)` : Ie(e.palette.divider, 0.08)
}, t.variant === "inset" && {
  marginLeft: 72
}, t.variant === "middle" && t.orientation === "horizontal" && {
  marginLeft: e.spacing(2),
  marginRight: e.spacing(2)
}, t.variant === "middle" && t.orientation === "vertical" && {
  marginTop: e.spacing(1),
  marginBottom: e.spacing(1)
}, t.orientation === "vertical" && {
  height: "100%",
  borderBottomWidth: 0,
  borderRightWidth: "thin"
}, t.flexItem && {
  alignSelf: "stretch",
  height: "auto"
}), ({
  theme: e,
  ownerState: t
}) => k({}, t.children && {
  display: "flex",
  whiteSpace: "nowrap",
  textAlign: "center",
  border: 0,
  "&::before, &::after": {
    position: "relative",
    width: "100%",
    borderTop: `thin solid ${(e.vars || e).palette.divider}`,
    top: "50%",
    content: '""',
    transform: "translateY(50%)"
  }
}), ({
  theme: e,
  ownerState: t
}) => k({}, t.children && t.orientation === "vertical" && {
  flexDirection: "column",
  "&::before, &::after": {
    height: "100%",
    top: "0%",
    left: "50%",
    borderTop: 0,
    borderLeft: `thin solid ${(e.vars || e).palette.divider}`,
    transform: "translateX(0%)"
  }
}), ({
  ownerState: e
}) => k({}, e.textAlign === "right" && e.orientation !== "vertical" && {
  "&::before": {
    width: "90%"
  },
  "&::after": {
    width: "10%"
  }
}, e.textAlign === "left" && e.orientation !== "vertical" && {
  "&::before": {
    width: "10%"
  },
  "&::after": {
    width: "90%"
  }
})), A4 = U("span", {
  name: "MuiDivider",
  slot: "Wrapper",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.wrapper, n.orientation === "vertical" && t.wrapperVertical];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  display: "inline-block",
  paddingLeft: `calc(${e.spacing(1)} * 1.2)`,
  paddingRight: `calc(${e.spacing(1)} * 1.2)`
}, t.orientation === "vertical" && {
  paddingTop: `calc(${e.spacing(1)} * 1.2)`,
  paddingBottom: `calc(${e.spacing(1)} * 1.2)`
})), N4 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiDivider"
  }), {
    absolute: o = !1,
    children: i,
    className: s,
    component: a = i ? "div" : "hr",
    flexItem: l = !1,
    light: c = !1,
    orientation: u = "horizontal",
    role: f = a !== "hr" ? "separator" : void 0,
    textAlign: h = "center",
    variant: y = "fullWidth"
  } = r, d = Q(r, _4), m = k({}, r, {
    absolute: o,
    component: a,
    flexItem: l,
    light: c,
    orientation: u,
    role: f,
    textAlign: h,
    variant: y
  }), w = M4(m);
  return /* @__PURE__ */ S(I4, k({
    as: a,
    className: Z(w.root, s),
    role: f,
    ref: n,
    ownerState: m
  }, d, {
    children: i ? /* @__PURE__ */ S(A4, {
      className: w.wrapper,
      ownerState: m,
      children: i
    }) : null
  }));
}), L4 = N4, F4 = ["disableUnderline", "components", "componentsProps", "fullWidth", "hiddenLabel", "inputComponent", "multiline", "slotProps", "slots", "type"], D4 = (e) => {
  const {
    classes: t,
    disableUnderline: n
  } = e, o = me({
    root: ["root", !n && "underline"],
    input: ["input"]
  }, U5, t);
  return k({}, t, o);
}, z4 = U($u, {
  shouldForwardProp: (e) => Tn(e) || e === "classes",
  name: "MuiFilledInput",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [...Pu(e, t), !n.disableUnderline && t.underline];
  }
})(({
  theme: e,
  ownerState: t
}) => {
  var n;
  const r = e.palette.mode === "light", o = r ? "rgba(0, 0, 0, 0.42)" : "rgba(255, 255, 255, 0.7)", i = r ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.09)", s = r ? "rgba(0, 0, 0, 0.09)" : "rgba(255, 255, 255, 0.13)", a = r ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.12)";
  return k({
    position: "relative",
    backgroundColor: e.vars ? e.vars.palette.FilledInput.bg : i,
    borderTopLeftRadius: (e.vars || e).shape.borderRadius,
    borderTopRightRadius: (e.vars || e).shape.borderRadius,
    transition: e.transitions.create("background-color", {
      duration: e.transitions.duration.shorter,
      easing: e.transitions.easing.easeOut
    }),
    "&:hover": {
      backgroundColor: e.vars ? e.vars.palette.FilledInput.hoverBg : s,
      "@media (hover: none)": {
        backgroundColor: e.vars ? e.vars.palette.FilledInput.bg : i
      }
    },
    [`&.${Bo.focused}`]: {
      backgroundColor: e.vars ? e.vars.palette.FilledInput.bg : i
    },
    [`&.${Bo.disabled}`]: {
      backgroundColor: e.vars ? e.vars.palette.FilledInput.disabledBg : a
    }
  }, !t.disableUnderline && {
    "&:after": {
      borderBottom: `2px solid ${(n = (e.vars || e).palette[t.color || "primary"]) == null ? void 0 : n.main}`,
      left: 0,
      bottom: 0,
      content: '""',
      position: "absolute",
      right: 0,
      transform: "scaleX(0)",
      transition: e.transitions.create("transform", {
        duration: e.transitions.duration.shorter,
        easing: e.transitions.easing.easeOut
      }),
      pointerEvents: "none"
    },
    [`&.${Bo.focused}:after`]: {
      transform: "scaleX(1) translateX(0)"
    },
    [`&.${Bo.error}:after`]: {
      borderBottomColor: (e.vars || e).palette.error.main,
      transform: "scaleX(1)"
    },
    "&:before": {
      borderBottom: `1px solid ${e.vars ? `rgba(${e.vars.palette.common.onBackgroundChannel} / ${e.vars.opacity.inputUnderline})` : o}`,
      left: 0,
      bottom: 0,
      content: '"\\00a0"',
      position: "absolute",
      right: 0,
      transition: e.transitions.create("border-bottom-color", {
        duration: e.transitions.duration.shorter
      }),
      pointerEvents: "none"
    },
    [`&:hover:not(.${Bo.disabled}):before`]: {
      borderBottom: `1px solid ${(e.vars || e).palette.text.primary}`
    },
    [`&.${Bo.disabled}:before`]: {
      borderBottomStyle: "dotted"
    }
  }, t.startAdornment && {
    paddingLeft: 12
  }, t.endAdornment && {
    paddingRight: 12
  }, t.multiline && k({
    padding: "25px 12px 8px"
  }, t.size === "small" && {
    paddingTop: 21,
    paddingBottom: 4
  }, t.hiddenLabel && {
    paddingTop: 16,
    paddingBottom: 17
  }));
}), B4 = U(_u, {
  name: "MuiFilledInput",
  slot: "Input",
  overridesResolver: Ou
})(({
  theme: e,
  ownerState: t
}) => k({
  paddingTop: 25,
  paddingRight: 12,
  paddingBottom: 8,
  paddingLeft: 12
}, !e.vars && {
  "&:-webkit-autofill": {
    WebkitBoxShadow: e.palette.mode === "light" ? null : "0 0 0 100px #266798 inset",
    WebkitTextFillColor: e.palette.mode === "light" ? null : "#fff",
    caretColor: e.palette.mode === "light" ? null : "#fff",
    borderTopLeftRadius: "inherit",
    borderTopRightRadius: "inherit"
  }
}, e.vars && {
  "&:-webkit-autofill": {
    borderTopLeftRadius: "inherit",
    borderTopRightRadius: "inherit"
  },
  [e.getColorSchemeSelector("dark")]: {
    "&:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #266798 inset",
      WebkitTextFillColor: "#fff",
      caretColor: "#fff"
    }
  }
}, t.size === "small" && {
  paddingTop: 21,
  paddingBottom: 4
}, t.hiddenLabel && {
  paddingTop: 16,
  paddingBottom: 17
}, t.multiline && {
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0
}, t.startAdornment && {
  paddingLeft: 0
}, t.endAdornment && {
  paddingRight: 0
}, t.hiddenLabel && t.size === "small" && {
  paddingTop: 8,
  paddingBottom: 9
})), Jw = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r, o, i, s;
  const a = ve({
    props: t,
    name: "MuiFilledInput"
  }), {
    components: l = {},
    componentsProps: c,
    fullWidth: u = !1,
    inputComponent: f = "input",
    multiline: h = !1,
    slotProps: y,
    slots: d = {},
    type: m = "text"
  } = a, w = Q(a, F4), g = k({}, a, {
    fullWidth: u,
    inputComponent: f,
    multiline: h,
    type: m
  }), p = D4(a), v = {
    root: {
      ownerState: g
    },
    input: {
      ownerState: g
    }
  }, b = (y != null ? y : c) ? Bt(y != null ? y : c, v) : v, C = (r = (o = d.root) != null ? o : l.Root) != null ? r : z4, E = (i = (s = d.input) != null ? s : l.Input) != null ? i : B4;
  return /* @__PURE__ */ S(Cm, k({
    slots: {
      root: C,
      input: E
    },
    componentsProps: b,
    fullWidth: u,
    inputComponent: f,
    multiline: h,
    ref: n,
    type: m
  }, w, {
    classes: p
  }));
});
Jw.muiName = "Input";
const Zw = Jw;
function j4(e) {
  return he("MuiFormControl", e);
}
fe("MuiFormControl", ["root", "marginNone", "marginNormal", "marginDense", "fullWidth", "disabled"]);
const W4 = ["children", "className", "color", "component", "disabled", "error", "focused", "fullWidth", "hiddenLabel", "margin", "required", "size", "variant"], U4 = (e) => {
  const {
    classes: t,
    margin: n,
    fullWidth: r
  } = e, o = {
    root: ["root", n !== "none" && `margin${N(n)}`, r && "fullWidth"]
  };
  return me(o, j4, t);
}, H4 = U("div", {
  name: "MuiFormControl",
  slot: "Root",
  overridesResolver: ({
    ownerState: e
  }, t) => k({}, t.root, t[`margin${N(e.margin)}`], e.fullWidth && t.fullWidth)
})(({
  ownerState: e
}) => k({
  display: "inline-flex",
  flexDirection: "column",
  position: "relative",
  minWidth: 0,
  padding: 0,
  margin: 0,
  border: 0,
  verticalAlign: "top"
}, e.margin === "normal" && {
  marginTop: 16,
  marginBottom: 8
}, e.margin === "dense" && {
  marginTop: 8,
  marginBottom: 4
}, e.fullWidth && {
  width: "100%"
})), V4 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiFormControl"
  }), {
    children: o,
    className: i,
    color: s = "primary",
    component: a = "div",
    disabled: l = !1,
    error: c = !1,
    focused: u,
    fullWidth: f = !1,
    hiddenLabel: h = !1,
    margin: y = "none",
    required: d = !1,
    size: m = "medium",
    variant: w = "outlined"
  } = r, g = Q(r, W4), p = k({}, r, {
    color: s,
    component: a,
    disabled: l,
    error: c,
    fullWidth: f,
    hiddenLabel: h,
    margin: y,
    required: d,
    size: m,
    variant: w
  }), v = U4(p), [b, C] = x.exports.useState(() => {
    let D = !1;
    return o && x.exports.Children.forEach(o, (I) => {
      if (!gd(I, ["Input", "Select"]))
        return;
      const M = gd(I, ["Select"]) ? I.props.input : I;
      M && M5(M.props) && (D = !0);
    }), D;
  }), [E, R] = x.exports.useState(() => {
    let D = !1;
    return o && x.exports.Children.forEach(o, (I) => {
      !gd(I, ["Input", "Select"]) || Sm(I.props, !0) && (D = !0);
    }), D;
  }), [T, O] = x.exports.useState(!1);
  l && T && O(!1);
  const P = u !== void 0 && !l ? u : T;
  let $;
  const B = x.exports.useMemo(() => ({
    adornedStart: b,
    setAdornedStart: C,
    color: s,
    disabled: l,
    error: c,
    filled: E,
    focused: P,
    fullWidth: f,
    hiddenLabel: h,
    size: m,
    onBlur: () => {
      O(!1);
    },
    onEmpty: () => {
      R(!1);
    },
    onFilled: () => {
      R(!0);
    },
    onFocus: () => {
      O(!0);
    },
    registerEffect: $,
    required: d,
    variant: w
  }), [b, s, l, c, E, P, f, h, $, d, m, w]);
  return /* @__PURE__ */ S(wm.Provider, {
    value: B,
    children: /* @__PURE__ */ S(H4, k({
      as: a,
      ownerState: p,
      className: Z(v.root, i),
      ref: n
    }, g, {
      children: o
    }))
  });
}), Y4 = V4;
function X4(e) {
  return he("MuiFormControlLabel", e);
}
const K4 = fe("MuiFormControlLabel", ["root", "labelPlacementStart", "labelPlacementTop", "labelPlacementBottom", "disabled", "label", "error"]), ul = K4, q4 = ["checked", "className", "componentsProps", "control", "disabled", "disableTypography", "inputRef", "label", "labelPlacement", "name", "onChange", "slotProps", "value"], G4 = (e) => {
  const {
    classes: t,
    disabled: n,
    labelPlacement: r,
    error: o
  } = e, i = {
    root: ["root", n && "disabled", `labelPlacement${N(r)}`, o && "error"],
    label: ["label", n && "disabled"]
  };
  return me(i, X4, t);
}, Q4 = U("label", {
  name: "MuiFormControlLabel",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [{
      [`& .${ul.label}`]: t.label
    }, t.root, t[`labelPlacement${N(n.labelPlacement)}`]];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  verticalAlign: "middle",
  WebkitTapHighlightColor: "transparent",
  marginLeft: -11,
  marginRight: 16,
  [`&.${ul.disabled}`]: {
    cursor: "default"
  }
}, t.labelPlacement === "start" && {
  flexDirection: "row-reverse",
  marginLeft: 16,
  marginRight: -11
}, t.labelPlacement === "top" && {
  flexDirection: "column-reverse",
  marginLeft: 16
}, t.labelPlacement === "bottom" && {
  flexDirection: "column",
  marginLeft: 16
}, {
  [`& .${ul.label}`]: {
    [`&.${ul.disabled}`]: {
      color: (e.vars || e).palette.text.disabled
    }
  }
})), J4 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r;
  const o = ve({
    props: t,
    name: "MuiFormControlLabel"
  }), {
    className: i,
    componentsProps: s = {},
    control: a,
    disabled: l,
    disableTypography: c,
    label: u,
    labelPlacement: f = "end",
    slotProps: h = {}
  } = o, y = Q(o, q4), d = pr();
  let m = l;
  typeof m > "u" && typeof a.props.disabled < "u" && (m = a.props.disabled), typeof m > "u" && d && (m = d.disabled);
  const w = {
    disabled: m
  };
  ["checked", "name", "onChange", "value", "inputRef"].forEach((E) => {
    typeof a.props[E] > "u" && typeof o[E] < "u" && (w[E] = o[E]);
  });
  const g = eo({
    props: o,
    muiFormControl: d,
    states: ["error"]
  }), p = k({}, o, {
    disabled: m,
    labelPlacement: f,
    error: g.error
  }), v = G4(p), b = (r = h.typography) != null ? r : s.typography;
  let C = u;
  return C != null && C.type !== gt && !c && (C = /* @__PURE__ */ S(gt, k({
    component: "span"
  }, b, {
    className: Z(v.label, b == null ? void 0 : b.className),
    children: C
  }))), /* @__PURE__ */ G(Q4, k({
    className: Z(v.root, i),
    ownerState: p,
    ref: n
  }, y, {
    children: [/* @__PURE__ */ x.exports.cloneElement(a, w), C]
  }));
}), Z4 = J4;
function eF(e) {
  return he("MuiFormGroup", e);
}
fe("MuiFormGroup", ["root", "row", "error"]);
const tF = ["className", "row"], nF = (e) => {
  const {
    classes: t,
    row: n,
    error: r
  } = e;
  return me({
    root: ["root", n && "row", r && "error"]
  }, eF, t);
}, rF = U("div", {
  name: "MuiFormGroup",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, n.row && t.row];
  }
})(({
  ownerState: e
}) => k({
  display: "flex",
  flexDirection: "column",
  flexWrap: "wrap"
}, e.row && {
  flexDirection: "row"
})), oF = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiFormGroup"
  }), {
    className: o,
    row: i = !1
  } = r, s = Q(r, tF), a = pr(), l = eo({
    props: r,
    muiFormControl: a,
    states: ["error"]
  }), c = k({}, r, {
    row: i,
    error: l.error
  }), u = nF(c);
  return /* @__PURE__ */ S(rF, k({
    className: Z(u.root, o),
    ownerState: c,
    ref: n
  }, s));
}), iF = oF;
function sF(e) {
  return he("MuiFormHelperText", e);
}
const aF = fe("MuiFormHelperText", ["root", "error", "disabled", "sizeSmall", "sizeMedium", "contained", "focused", "filled", "required"]), U0 = aF;
var H0;
const lF = ["children", "className", "component", "disabled", "error", "filled", "focused", "margin", "required", "variant"], cF = (e) => {
  const {
    classes: t,
    contained: n,
    size: r,
    disabled: o,
    error: i,
    filled: s,
    focused: a,
    required: l
  } = e, c = {
    root: ["root", o && "disabled", i && "error", r && `size${N(r)}`, n && "contained", a && "focused", s && "filled", l && "required"]
  };
  return me(c, sF, t);
}, uF = U("p", {
  name: "MuiFormHelperText",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, n.size && t[`size${N(n.size)}`], n.contained && t.contained, n.filled && t.filled];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  color: (e.vars || e).palette.text.secondary
}, e.typography.caption, {
  textAlign: "left",
  marginTop: 3,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  [`&.${U0.disabled}`]: {
    color: (e.vars || e).palette.text.disabled
  },
  [`&.${U0.error}`]: {
    color: (e.vars || e).palette.error.main
  }
}, t.size === "small" && {
  marginTop: 4
}, t.contained && {
  marginLeft: 14,
  marginRight: 14
})), dF = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiFormHelperText"
  }), {
    children: o,
    className: i,
    component: s = "p"
  } = r, a = Q(r, lF), l = pr(), c = eo({
    props: r,
    muiFormControl: l,
    states: ["variant", "size", "disabled", "error", "filled", "focused", "required"]
  }), u = k({}, r, {
    component: s,
    contained: c.variant === "filled" || c.variant === "outlined",
    variant: c.variant,
    size: c.size,
    disabled: c.disabled,
    error: c.error,
    filled: c.filled,
    focused: c.focused,
    required: c.required
  }), f = cF(u);
  return /* @__PURE__ */ S(uF, k({
    as: s,
    ownerState: u,
    className: Z(f.root, i),
    ref: n
  }, a, {
    children: o === " " ? H0 || (H0 = /* @__PURE__ */ S("span", {
      className: "notranslate",
      children: "\u200B"
    })) : o
  }));
}), fF = dF;
function pF(e) {
  return he("MuiFormLabel", e);
}
const hF = fe("MuiFormLabel", ["root", "colorSecondary", "focused", "disabled", "error", "filled", "required", "asterisk"]), Ns = hF, mF = ["children", "className", "color", "component", "disabled", "error", "filled", "focused", "required"], gF = (e) => {
  const {
    classes: t,
    color: n,
    focused: r,
    disabled: o,
    error: i,
    filled: s,
    required: a
  } = e, l = {
    root: ["root", `color${N(n)}`, o && "disabled", i && "error", s && "filled", r && "focused", a && "required"],
    asterisk: ["asterisk", i && "error"]
  };
  return me(l, pF, t);
}, vF = U("label", {
  name: "MuiFormLabel",
  slot: "Root",
  overridesResolver: ({
    ownerState: e
  }, t) => k({}, t.root, e.color === "secondary" && t.colorSecondary, e.filled && t.filled)
})(({
  theme: e,
  ownerState: t
}) => k({
  color: (e.vars || e).palette.text.secondary
}, e.typography.body1, {
  lineHeight: "1.4375em",
  padding: 0,
  position: "relative",
  [`&.${Ns.focused}`]: {
    color: (e.vars || e).palette[t.color].main
  },
  [`&.${Ns.disabled}`]: {
    color: (e.vars || e).palette.text.disabled
  },
  [`&.${Ns.error}`]: {
    color: (e.vars || e).palette.error.main
  }
})), yF = U("span", {
  name: "MuiFormLabel",
  slot: "Asterisk",
  overridesResolver: (e, t) => t.asterisk
})(({
  theme: e
}) => ({
  [`&.${Ns.error}`]: {
    color: (e.vars || e).palette.error.main
  }
})), bF = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiFormLabel"
  }), {
    children: o,
    className: i,
    component: s = "label"
  } = r, a = Q(r, mF), l = pr(), c = eo({
    props: r,
    muiFormControl: l,
    states: ["color", "required", "focused", "disabled", "error", "filled"]
  }), u = k({}, r, {
    color: c.color || "primary",
    component: s,
    disabled: c.disabled,
    error: c.error,
    filled: c.filled,
    focused: c.focused,
    required: c.required
  }), f = gF(u);
  return /* @__PURE__ */ G(vF, k({
    as: s,
    ownerState: u,
    className: Z(f.root, i),
    ref: n
  }, a, {
    children: [o, c.required && /* @__PURE__ */ G(yF, {
      ownerState: u,
      "aria-hidden": !0,
      className: f.asterisk,
      children: ["\u2009", "*"]
    })]
  }));
}), xF = bF, wF = ["disableUnderline", "components", "componentsProps", "fullWidth", "inputComponent", "multiline", "slotProps", "slots", "type"], SF = (e) => {
  const {
    classes: t,
    disableUnderline: n
  } = e, o = me({
    root: ["root", !n && "underline"],
    input: ["input"]
  }, z5, t);
  return k({}, t, o);
}, CF = U($u, {
  shouldForwardProp: (e) => Tn(e) || e === "classes",
  name: "MuiInput",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [...Pu(e, t), !n.disableUnderline && t.underline];
  }
})(({
  theme: e,
  ownerState: t
}) => {
  let r = e.palette.mode === "light" ? "rgba(0, 0, 0, 0.42)" : "rgba(255, 255, 255, 0.7)";
  return e.vars && (r = `rgba(${e.vars.palette.common.onBackgroundChannel} / ${e.vars.opacity.inputUnderline})`), k({
    position: "relative"
  }, t.formControl && {
    "label + &": {
      marginTop: 16
    }
  }, !t.disableUnderline && {
    "&:after": {
      borderBottom: `2px solid ${(e.vars || e).palette[t.color].main}`,
      left: 0,
      bottom: 0,
      content: '""',
      position: "absolute",
      right: 0,
      transform: "scaleX(0)",
      transition: e.transitions.create("transform", {
        duration: e.transitions.duration.shorter,
        easing: e.transitions.easing.easeOut
      }),
      pointerEvents: "none"
    },
    [`&.${ll.focused}:after`]: {
      transform: "scaleX(1) translateX(0)"
    },
    [`&.${ll.error}:after`]: {
      borderBottomColor: (e.vars || e).palette.error.main,
      transform: "scaleX(1)"
    },
    "&:before": {
      borderBottom: `1px solid ${r}`,
      left: 0,
      bottom: 0,
      content: '"\\00a0"',
      position: "absolute",
      right: 0,
      transition: e.transitions.create("border-bottom-color", {
        duration: e.transitions.duration.shorter
      }),
      pointerEvents: "none"
    },
    [`&:hover:not(.${ll.disabled}):before`]: {
      borderBottom: `2px solid ${(e.vars || e).palette.text.primary}`,
      "@media (hover: none)": {
        borderBottom: `1px solid ${r}`
      }
    },
    [`&.${ll.disabled}:before`]: {
      borderBottomStyle: "dotted"
    }
  });
}), kF = U(_u, {
  name: "MuiInput",
  slot: "Input",
  overridesResolver: Ou
})({}), eS = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r, o, i, s;
  const a = ve({
    props: t,
    name: "MuiInput"
  }), {
    disableUnderline: l,
    components: c = {},
    componentsProps: u,
    fullWidth: f = !1,
    inputComponent: h = "input",
    multiline: y = !1,
    slotProps: d,
    slots: m = {},
    type: w = "text"
  } = a, g = Q(a, wF), p = SF(a), b = {
    root: {
      ownerState: {
        disableUnderline: l
      }
    }
  }, C = (d != null ? d : u) ? Bt(d != null ? d : u, b) : b, E = (r = (o = m.root) != null ? o : c.Root) != null ? r : CF, R = (i = (s = m.input) != null ? s : c.Input) != null ? i : kF;
  return /* @__PURE__ */ S(Cm, k({
    slots: {
      root: E,
      input: R
    },
    slotProps: C,
    fullWidth: f,
    inputComponent: h,
    multiline: y,
    ref: n,
    type: w
  }, g, {
    classes: p
  }));
});
eS.muiName = "Input";
const tS = eS;
function EF(e) {
  return he("MuiInputLabel", e);
}
fe("MuiInputLabel", ["root", "focused", "disabled", "error", "required", "asterisk", "formControl", "sizeSmall", "shrink", "animated", "standard", "filled", "outlined"]);
const RF = ["disableAnimation", "margin", "shrink", "variant", "className"], TF = (e) => {
  const {
    classes: t,
    formControl: n,
    size: r,
    shrink: o,
    disableAnimation: i,
    variant: s,
    required: a
  } = e, c = me({
    root: ["root", n && "formControl", !i && "animated", o && "shrink", r === "small" && "sizeSmall", s],
    asterisk: [a && "asterisk"]
  }, EF, t);
  return k({}, t, c);
}, PF = U(xF, {
  shouldForwardProp: (e) => Tn(e) || e === "classes",
  name: "MuiInputLabel",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [{
      [`& .${Ns.asterisk}`]: t.asterisk
    }, t.root, n.formControl && t.formControl, n.size === "small" && t.sizeSmall, n.shrink && t.shrink, !n.disableAnimation && t.animated, t[n.variant]];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  display: "block",
  transformOrigin: "top left",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%"
}, t.formControl && {
  position: "absolute",
  left: 0,
  top: 0,
  transform: "translate(0, 20px) scale(1)"
}, t.size === "small" && {
  transform: "translate(0, 17px) scale(1)"
}, t.shrink && {
  transform: "translate(0, -1.5px) scale(0.75)",
  transformOrigin: "top left",
  maxWidth: "133%"
}, !t.disableAnimation && {
  transition: e.transitions.create(["color", "transform", "max-width"], {
    duration: e.transitions.duration.shorter,
    easing: e.transitions.easing.easeOut
  })
}, t.variant === "filled" && k({
  zIndex: 1,
  pointerEvents: "none",
  transform: "translate(12px, 16px) scale(1)",
  maxWidth: "calc(100% - 24px)"
}, t.size === "small" && {
  transform: "translate(12px, 13px) scale(1)"
}, t.shrink && k({
  userSelect: "none",
  pointerEvents: "auto",
  transform: "translate(12px, 7px) scale(0.75)",
  maxWidth: "calc(133% - 24px)"
}, t.size === "small" && {
  transform: "translate(12px, 4px) scale(0.75)"
})), t.variant === "outlined" && k({
  zIndex: 1,
  pointerEvents: "none",
  transform: "translate(14px, 16px) scale(1)",
  maxWidth: "calc(100% - 24px)"
}, t.size === "small" && {
  transform: "translate(14px, 9px) scale(1)"
}, t.shrink && {
  userSelect: "none",
  pointerEvents: "auto",
  maxWidth: "calc(133% - 24px)",
  transform: "translate(14px, -9px) scale(0.75)"
}))), OF = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    name: "MuiInputLabel",
    props: t
  }), {
    disableAnimation: o = !1,
    shrink: i,
    className: s
  } = r, a = Q(r, RF), l = pr();
  let c = i;
  typeof c > "u" && l && (c = l.filled || l.focused || l.adornedStart);
  const u = eo({
    props: r,
    muiFormControl: l,
    states: ["size", "variant", "required"]
  }), f = k({}, r, {
    disableAnimation: o,
    formControl: l,
    shrink: c,
    size: u.size,
    variant: u.variant,
    required: u.required
  }), h = TF(f);
  return /* @__PURE__ */ S(PF, k({
    "data-shrink": c,
    ownerState: f,
    ref: n,
    className: Z(h.root, s)
  }, a, {
    classes: h
  }));
}), $F = OF, _F = /* @__PURE__ */ x.exports.createContext({}), pp = _F;
function MF(e) {
  return he("MuiList", e);
}
fe("MuiList", ["root", "padding", "dense", "subheader"]);
const IF = ["children", "className", "component", "dense", "disablePadding", "subheader"], AF = (e) => {
  const {
    classes: t,
    disablePadding: n,
    dense: r,
    subheader: o
  } = e;
  return me({
    root: ["root", !n && "padding", r && "dense", o && "subheader"]
  }, MF, t);
}, NF = U("ul", {
  name: "MuiList",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, !n.disablePadding && t.padding, n.dense && t.dense, n.subheader && t.subheader];
  }
})(({
  ownerState: e
}) => k({
  listStyle: "none",
  margin: 0,
  padding: 0,
  position: "relative"
}, !e.disablePadding && {
  paddingTop: 8,
  paddingBottom: 8
}, e.subheader && {
  paddingTop: 0
})), LF = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiList"
  }), {
    children: o,
    className: i,
    component: s = "ul",
    dense: a = !1,
    disablePadding: l = !1,
    subheader: c
  } = r, u = Q(r, IF), f = x.exports.useMemo(() => ({
    dense: a
  }), [a]), h = k({}, r, {
    component: s,
    dense: a,
    disablePadding: l
  }), y = AF(h);
  return /* @__PURE__ */ S(pp.Provider, {
    value: f,
    children: /* @__PURE__ */ G(NF, k({
      as: s,
      className: Z(y.root, i),
      ref: n,
      ownerState: h
    }, u, {
      children: [c, o]
    }))
  });
}), FF = LF, DF = fe("MuiListItemIcon", ["root", "alignItemsFlexStart"]), V0 = DF, zF = fe("MuiListItemText", ["root", "multiline", "dense", "inset", "primary", "secondary"]), Y0 = zF, BF = ["actions", "autoFocus", "autoFocusItem", "children", "className", "disabledItemsFocusable", "disableListWrap", "onKeyDown", "variant"];
function Fd(e, t, n) {
  return e === t ? e.firstChild : t && t.nextElementSibling ? t.nextElementSibling : n ? null : e.firstChild;
}
function X0(e, t, n) {
  return e === t ? n ? e.firstChild : e.lastChild : t && t.previousElementSibling ? t.previousElementSibling : n ? null : e.lastChild;
}
function nS(e, t) {
  if (t === void 0)
    return !0;
  let n = e.innerText;
  return n === void 0 && (n = e.textContent), n = n.trim().toLowerCase(), n.length === 0 ? !1 : t.repeating ? n[0] === t.keys[0] : n.indexOf(t.keys.join("")) === 0;
}
function os(e, t, n, r, o, i) {
  let s = !1, a = o(e, t, t ? n : !1);
  for (; a; ) {
    if (a === e.firstChild) {
      if (s)
        return !1;
      s = !0;
    }
    const l = r ? !1 : a.disabled || a.getAttribute("aria-disabled") === "true";
    if (!a.hasAttribute("tabindex") || !nS(a, i) || l)
      a = o(e, a, n);
    else
      return a.focus(), !0;
  }
  return !1;
}
const jF = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const {
    actions: r,
    autoFocus: o = !1,
    autoFocusItem: i = !1,
    children: s,
    className: a,
    disabledItemsFocusable: l = !1,
    disableListWrap: c = !1,
    onKeyDown: u,
    variant: f = "selectedMenu"
  } = t, h = Q(t, BF), y = x.exports.useRef(null), d = x.exports.useRef({
    keys: [],
    repeating: !0,
    previousKeyMatched: !0,
    lastTime: null
  });
  jn(() => {
    o && y.current.focus();
  }, [o]), x.exports.useImperativeHandle(r, () => ({
    adjustStyleForScrollbar: (v, b) => {
      const C = !y.current.style.width;
      if (v.clientHeight < y.current.clientHeight && C) {
        const E = `${ix(mt(v))}px`;
        y.current.style[b.direction === "rtl" ? "paddingLeft" : "paddingRight"] = E, y.current.style.width = `calc(100% + ${E})`;
      }
      return y.current;
    }
  }), []);
  const m = (v) => {
    const b = y.current, C = v.key, E = mt(b).activeElement;
    if (C === "ArrowDown")
      v.preventDefault(), os(b, E, c, l, Fd);
    else if (C === "ArrowUp")
      v.preventDefault(), os(b, E, c, l, X0);
    else if (C === "Home")
      v.preventDefault(), os(b, null, c, l, Fd);
    else if (C === "End")
      v.preventDefault(), os(b, null, c, l, X0);
    else if (C.length === 1) {
      const R = d.current, T = C.toLowerCase(), O = performance.now();
      R.keys.length > 0 && (O - R.lastTime > 500 ? (R.keys = [], R.repeating = !0, R.previousKeyMatched = !0) : R.repeating && T !== R.keys[0] && (R.repeating = !1)), R.lastTime = O, R.keys.push(T);
      const P = E && !R.repeating && nS(E, R);
      R.previousKeyMatched && (P || os(b, E, !1, l, Fd, R)) ? v.preventDefault() : R.previousKeyMatched = !1;
    }
    u && u(v);
  }, w = Qe(y, n);
  let g = -1;
  x.exports.Children.forEach(s, (v, b) => {
    !/* @__PURE__ */ x.exports.isValidElement(v) || v.props.disabled || (f === "selectedMenu" && v.props.selected || g === -1) && (g = b);
  });
  const p = x.exports.Children.map(s, (v, b) => {
    if (b === g) {
      const C = {};
      return i && (C.autoFocus = !0), v.props.tabIndex === void 0 && f === "selectedMenu" && (C.tabIndex = 0), /* @__PURE__ */ x.exports.cloneElement(v, C);
    }
    return v;
  });
  return /* @__PURE__ */ S(FF, k({
    role: "menu",
    ref: w,
    className: a,
    onKeyDown: m,
    tabIndex: o ? 0 : -1
  }, h, {
    children: p
  }));
}), WF = jF;
function UF(e) {
  return he("MuiPopover", e);
}
fe("MuiPopover", ["root", "paper"]);
const HF = ["onEntering"], VF = ["action", "anchorEl", "anchorOrigin", "anchorPosition", "anchorReference", "children", "className", "container", "elevation", "marginThreshold", "open", "PaperProps", "transformOrigin", "TransitionComponent", "transitionDuration", "TransitionProps"];
function K0(e, t) {
  let n = 0;
  return typeof t == "number" ? n = t : t === "center" ? n = e.height / 2 : t === "bottom" && (n = e.height), n;
}
function q0(e, t) {
  let n = 0;
  return typeof t == "number" ? n = t : t === "center" ? n = e.width / 2 : t === "right" && (n = e.width), n;
}
function G0(e) {
  return [e.horizontal, e.vertical].map((t) => typeof t == "number" ? `${t}px` : t).join(" ");
}
function Dd(e) {
  return typeof e == "function" ? e() : e;
}
const YF = (e) => {
  const {
    classes: t
  } = e;
  return me({
    root: ["root"],
    paper: ["paper"]
  }, UF, t);
}, XF = U(Gw, {
  name: "MuiPopover",
  slot: "Root",
  overridesResolver: (e, t) => t.root
})({}), KF = U(Fi, {
  name: "MuiPopover",
  slot: "Paper",
  overridesResolver: (e, t) => t.paper
})({
  position: "absolute",
  overflowY: "auto",
  overflowX: "hidden",
  minWidth: 16,
  minHeight: 16,
  maxWidth: "calc(100% - 32px)",
  maxHeight: "calc(100% - 32px)",
  outline: 0
}), qF = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiPopover"
  }), {
    action: o,
    anchorEl: i,
    anchorOrigin: s = {
      vertical: "top",
      horizontal: "left"
    },
    anchorPosition: a,
    anchorReference: l = "anchorEl",
    children: c,
    className: u,
    container: f,
    elevation: h = 8,
    marginThreshold: y = 16,
    open: d,
    PaperProps: m = {},
    transformOrigin: w = {
      vertical: "top",
      horizontal: "left"
    },
    TransitionComponent: g = Cc,
    transitionDuration: p = "auto",
    TransitionProps: {
      onEntering: v
    } = {}
  } = r, b = Q(r.TransitionProps, HF), C = Q(r, VF), E = x.exports.useRef(), R = Qe(E, m.ref), T = k({}, r, {
    anchorOrigin: s,
    anchorReference: l,
    elevation: h,
    marginThreshold: y,
    PaperProps: m,
    transformOrigin: w,
    TransitionComponent: g,
    transitionDuration: p,
    TransitionProps: b
  }), O = YF(T), P = x.exports.useCallback(() => {
    if (l === "anchorPosition")
      return a;
    const F = Dd(i), q = (F && F.nodeType === 1 ? F : mt(E.current).body).getBoundingClientRect();
    return {
      top: q.top + K0(q, s.vertical),
      left: q.left + q0(q, s.horizontal)
    };
  }, [i, s.horizontal, s.vertical, a, l]), $ = x.exports.useCallback((F) => ({
    vertical: K0(F, w.vertical),
    horizontal: q0(F, w.horizontal)
  }), [w.horizontal, w.vertical]), B = x.exports.useCallback((F) => {
    const Y = {
      width: F.offsetWidth,
      height: F.offsetHeight
    }, q = $(Y);
    if (l === "none")
      return {
        top: null,
        left: null,
        transformOrigin: G0(q)
      };
    const pe = P();
    let ne = pe.top - q.vertical, ae = pe.left - q.horizontal;
    const le = ne + Y.height, X = ae + Y.width, H = ko(Dd(i)), W = H.innerHeight - y, ce = H.innerWidth - y;
    if (ne < y) {
      const re = ne - y;
      ne -= re, q.vertical += re;
    } else if (le > W) {
      const re = le - W;
      ne -= re, q.vertical += re;
    }
    if (ae < y) {
      const re = ae - y;
      ae -= re, q.horizontal += re;
    } else if (X > ce) {
      const re = X - ce;
      ae -= re, q.horizontal += re;
    }
    return {
      top: `${Math.round(ne)}px`,
      left: `${Math.round(ae)}px`,
      transformOrigin: G0(q)
    };
  }, [i, l, P, $, y]), [D, I] = x.exports.useState(d), M = x.exports.useCallback(() => {
    const F = E.current;
    if (!F)
      return;
    const Y = B(F);
    Y.top !== null && (F.style.top = Y.top), Y.left !== null && (F.style.left = Y.left), F.style.transformOrigin = Y.transformOrigin, I(!0);
  }, [B]), A = (F, Y) => {
    v && v(F, Y), M();
  }, j = () => {
    I(!1);
  };
  x.exports.useEffect(() => {
    d && M();
  }), x.exports.useImperativeHandle(o, () => d ? {
    updatePosition: () => {
      M();
    }
  } : null, [d, M]), x.exports.useEffect(() => {
    if (!d)
      return;
    const F = ox(() => {
      M();
    }), Y = ko(i);
    return Y.addEventListener("resize", F), () => {
      F.clear(), Y.removeEventListener("resize", F);
    };
  }, [i, d, M]);
  let _ = p;
  p === "auto" && !g.muiSupportAuto && (_ = void 0);
  const z = f || (i ? mt(Dd(i)).body : void 0);
  return /* @__PURE__ */ S(XF, k({
    BackdropProps: {
      invisible: !0
    },
    className: Z(O.root, u),
    container: z,
    open: d,
    ref: n,
    ownerState: T
  }, C, {
    children: /* @__PURE__ */ S(g, k({
      appear: !0,
      in: d,
      onEntering: A,
      onExited: j,
      timeout: _
    }, b, {
      children: /* @__PURE__ */ S(KF, k({
        elevation: h
      }, m, {
        ref: R,
        className: Z(O.paper, m.className)
      }, D ? void 0 : {
        style: k({}, m.style, {
          opacity: 0
        })
      }, {
        ownerState: T,
        children: c
      }))
    }))
  }));
}), GF = qF;
function QF(e) {
  return he("MuiMenu", e);
}
fe("MuiMenu", ["root", "paper", "list"]);
const JF = ["onEntering"], ZF = ["autoFocus", "children", "disableAutoFocusItem", "MenuListProps", "onClose", "open", "PaperProps", "PopoverClasses", "transitionDuration", "TransitionProps", "variant"], e3 = {
  vertical: "top",
  horizontal: "right"
}, t3 = {
  vertical: "top",
  horizontal: "left"
}, n3 = (e) => {
  const {
    classes: t
  } = e;
  return me({
    root: ["root"],
    paper: ["paper"],
    list: ["list"]
  }, QF, t);
}, r3 = U(GF, {
  shouldForwardProp: (e) => Tn(e) || e === "classes",
  name: "MuiMenu",
  slot: "Root",
  overridesResolver: (e, t) => t.root
})({}), o3 = U(Fi, {
  name: "MuiMenu",
  slot: "Paper",
  overridesResolver: (e, t) => t.paper
})({
  maxHeight: "calc(100% - 96px)",
  WebkitOverflowScrolling: "touch"
}), i3 = U(WF, {
  name: "MuiMenu",
  slot: "List",
  overridesResolver: (e, t) => t.list
})({
  outline: 0
}), s3 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiMenu"
  }), {
    autoFocus: o = !0,
    children: i,
    disableAutoFocusItem: s = !1,
    MenuListProps: a = {},
    onClose: l,
    open: c,
    PaperProps: u = {},
    PopoverClasses: f,
    transitionDuration: h = "auto",
    TransitionProps: {
      onEntering: y
    } = {},
    variant: d = "selectedMenu"
  } = r, m = Q(r.TransitionProps, JF), w = Q(r, ZF), g = Mo(), p = g.direction === "rtl", v = k({}, r, {
    autoFocus: o,
    disableAutoFocusItem: s,
    MenuListProps: a,
    onEntering: y,
    PaperProps: u,
    transitionDuration: h,
    TransitionProps: m,
    variant: d
  }), b = n3(v), C = o && !s && c, E = x.exports.useRef(null), R = (P, $) => {
    E.current && E.current.adjustStyleForScrollbar(P, g), y && y(P, $);
  }, T = (P) => {
    P.key === "Tab" && (P.preventDefault(), l && l(P, "tabKeyDown"));
  };
  let O = -1;
  return x.exports.Children.map(i, (P, $) => {
    !/* @__PURE__ */ x.exports.isValidElement(P) || P.props.disabled || (d === "selectedMenu" && P.props.selected || O === -1) && (O = $);
  }), /* @__PURE__ */ S(r3, k({
    classes: f,
    onClose: l,
    anchorOrigin: {
      vertical: "bottom",
      horizontal: p ? "right" : "left"
    },
    transformOrigin: p ? e3 : t3,
    PaperProps: k({
      component: o3
    }, u, {
      classes: k({}, u.classes, {
        root: b.paper
      })
    }),
    className: b.root,
    open: c,
    ref: n,
    transitionDuration: h,
    TransitionProps: k({
      onEntering: R
    }, m),
    ownerState: v
  }, w, {
    children: /* @__PURE__ */ S(i3, k({
      onKeyDown: T,
      actions: E,
      autoFocus: o && (O === -1 || s),
      autoFocusItem: C,
      variant: d
    }, a, {
      className: Z(b.list, a.className),
      children: i
    }))
  }));
}), km = s3;
function a3(e) {
  return he("MuiMenuItem", e);
}
const l3 = fe("MuiMenuItem", ["root", "focusVisible", "dense", "disabled", "divider", "gutters", "selected"]), is = l3, c3 = ["autoFocus", "component", "dense", "divider", "disableGutters", "focusVisibleClassName", "role", "tabIndex", "className"], u3 = (e, t) => {
  const {
    ownerState: n
  } = e;
  return [t.root, n.dense && t.dense, n.divider && t.divider, !n.disableGutters && t.gutters];
}, d3 = (e) => {
  const {
    disabled: t,
    dense: n,
    divider: r,
    disableGutters: o,
    selected: i,
    classes: s
  } = e, l = me({
    root: ["root", n && "dense", t && "disabled", !o && "gutters", r && "divider", i && "selected"]
  }, a3, s);
  return k({}, s, l);
}, f3 = U(Ei, {
  shouldForwardProp: (e) => Tn(e) || e === "classes",
  name: "MuiMenuItem",
  slot: "Root",
  overridesResolver: u3
})(({
  theme: e,
  ownerState: t
}) => k({}, e.typography.body1, {
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  position: "relative",
  textDecoration: "none",
  minHeight: 48,
  paddingTop: 6,
  paddingBottom: 6,
  boxSizing: "border-box",
  whiteSpace: "nowrap"
}, !t.disableGutters && {
  paddingLeft: 16,
  paddingRight: 16
}, t.divider && {
  borderBottom: `1px solid ${(e.vars || e).palette.divider}`,
  backgroundClip: "padding-box"
}, {
  "&:hover": {
    textDecoration: "none",
    backgroundColor: (e.vars || e).palette.action.hover,
    "@media (hover: none)": {
      backgroundColor: "transparent"
    }
  },
  [`&.${is.selected}`]: {
    backgroundColor: e.vars ? `rgba(${e.vars.palette.primary.mainChannel} / ${e.vars.palette.action.selectedOpacity})` : Ie(e.palette.primary.main, e.palette.action.selectedOpacity),
    [`&.${is.focusVisible}`]: {
      backgroundColor: e.vars ? `rgba(${e.vars.palette.primary.mainChannel} / calc(${e.vars.palette.action.selectedOpacity} + ${e.vars.palette.action.focusOpacity}))` : Ie(e.palette.primary.main, e.palette.action.selectedOpacity + e.palette.action.focusOpacity)
    }
  },
  [`&.${is.selected}:hover`]: {
    backgroundColor: e.vars ? `rgba(${e.vars.palette.primary.mainChannel} / calc(${e.vars.palette.action.selectedOpacity} + ${e.vars.palette.action.hoverOpacity}))` : Ie(e.palette.primary.main, e.palette.action.selectedOpacity + e.palette.action.hoverOpacity),
    "@media (hover: none)": {
      backgroundColor: e.vars ? `rgba(${e.vars.palette.primary.mainChannel} / ${e.vars.palette.action.selectedOpacity})` : Ie(e.palette.primary.main, e.palette.action.selectedOpacity)
    }
  },
  [`&.${is.focusVisible}`]: {
    backgroundColor: (e.vars || e).palette.action.focus
  },
  [`&.${is.disabled}`]: {
    opacity: (e.vars || e).palette.action.disabledOpacity
  },
  [`& + .${W0.root}`]: {
    marginTop: e.spacing(1),
    marginBottom: e.spacing(1)
  },
  [`& + .${W0.inset}`]: {
    marginLeft: 52
  },
  [`& .${Y0.root}`]: {
    marginTop: 0,
    marginBottom: 0
  },
  [`& .${Y0.inset}`]: {
    paddingLeft: 36
  },
  [`& .${V0.root}`]: {
    minWidth: 36
  }
}, !t.dense && {
  [e.breakpoints.up("sm")]: {
    minHeight: "auto"
  }
}, t.dense && k({
  minHeight: 32,
  paddingTop: 4,
  paddingBottom: 4
}, e.typography.body2, {
  [`& .${V0.root} svg`]: {
    fontSize: "1.25rem"
  }
}))), p3 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiMenuItem"
  }), {
    autoFocus: o = !1,
    component: i = "li",
    dense: s = !1,
    divider: a = !1,
    disableGutters: l = !1,
    focusVisibleClassName: c,
    role: u = "menuitem",
    tabIndex: f,
    className: h
  } = r, y = Q(r, c3), d = x.exports.useContext(pp), m = x.exports.useMemo(() => ({
    dense: s || d.dense || !1,
    disableGutters: l
  }), [d.dense, s, l]), w = x.exports.useRef(null);
  jn(() => {
    o && w.current && w.current.focus();
  }, [o]);
  const g = k({}, r, {
    dense: m.dense,
    divider: a,
    disableGutters: l
  }), p = d3(r), v = Qe(w, n);
  let b;
  return r.disabled || (b = f !== void 0 ? f : -1), /* @__PURE__ */ S(pp.Provider, {
    value: m,
    children: /* @__PURE__ */ S(f3, k({
      ref: v,
      role: u,
      tabIndex: b,
      component: i,
      focusVisibleClassName: Z(p.focusVisible, c),
      className: Z(p.root, h)
    }, y, {
      ownerState: g,
      classes: p
    }))
  });
}), vs = p3;
function h3(e) {
  return he("MuiNativeSelect", e);
}
const m3 = fe("MuiNativeSelect", ["root", "select", "multiple", "filled", "outlined", "standard", "disabled", "icon", "iconOpen", "iconFilled", "iconOutlined", "iconStandard", "nativeInput"]), Em = m3, g3 = ["className", "disabled", "IconComponent", "inputRef", "variant"], v3 = (e) => {
  const {
    classes: t,
    variant: n,
    disabled: r,
    multiple: o,
    open: i
  } = e, s = {
    select: ["select", n, r && "disabled", o && "multiple"],
    icon: ["icon", `icon${N(n)}`, i && "iconOpen", r && "disabled"]
  };
  return me(s, h3, t);
}, rS = ({
  ownerState: e,
  theme: t
}) => k({
  MozAppearance: "none",
  WebkitAppearance: "none",
  userSelect: "none",
  borderRadius: 0,
  cursor: "pointer",
  "&:focus": k({}, t.vars ? {
    backgroundColor: `rgba(${t.vars.palette.common.onBackgroundChannel} / 0.05)`
  } : {
    backgroundColor: t.palette.mode === "light" ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)"
  }, {
    borderRadius: 0
  }),
  "&::-ms-expand": {
    display: "none"
  },
  [`&.${Em.disabled}`]: {
    cursor: "default"
  },
  "&[multiple]": {
    height: "auto"
  },
  "&:not([multiple]) option, &:not([multiple]) optgroup": {
    backgroundColor: (t.vars || t).palette.background.paper
  },
  "&&&": {
    paddingRight: 24,
    minWidth: 16
  }
}, e.variant === "filled" && {
  "&&&": {
    paddingRight: 32
  }
}, e.variant === "outlined" && {
  borderRadius: (t.vars || t).shape.borderRadius,
  "&:focus": {
    borderRadius: (t.vars || t).shape.borderRadius
  },
  "&&&": {
    paddingRight: 32
  }
}), y3 = U("select", {
  name: "MuiNativeSelect",
  slot: "Select",
  shouldForwardProp: Tn,
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.select, t[n.variant], {
      [`&.${Em.multiple}`]: t.multiple
    }];
  }
})(rS), oS = ({
  ownerState: e,
  theme: t
}) => k({
  position: "absolute",
  right: 0,
  top: "calc(50% - .5em)",
  pointerEvents: "none",
  color: (t.vars || t).palette.action.active,
  [`&.${Em.disabled}`]: {
    color: (t.vars || t).palette.action.disabled
  }
}, e.open && {
  transform: "rotate(180deg)"
}, e.variant === "filled" && {
  right: 7
}, e.variant === "outlined" && {
  right: 7
}), b3 = U("svg", {
  name: "MuiNativeSelect",
  slot: "Icon",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.icon, n.variant && t[`icon${N(n.variant)}`], n.open && t.iconOpen];
  }
})(oS), x3 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const {
    className: r,
    disabled: o,
    IconComponent: i,
    inputRef: s,
    variant: a = "standard"
  } = t, l = Q(t, g3), c = k({}, t, {
    disabled: o,
    variant: a
  }), u = v3(c);
  return /* @__PURE__ */ G(x.exports.Fragment, {
    children: [/* @__PURE__ */ S(y3, k({
      ownerState: c,
      className: Z(u.select, r),
      disabled: o,
      ref: s || n
    }, l)), t.multiple ? null : /* @__PURE__ */ S(b3, {
      as: i,
      ownerState: c,
      className: u.icon
    })]
  });
}), w3 = x3;
var Q0;
const S3 = ["children", "classes", "className", "label", "notched"], C3 = U("fieldset")({
  textAlign: "left",
  position: "absolute",
  bottom: 0,
  right: 0,
  top: -5,
  left: 0,
  margin: 0,
  padding: "0 8px",
  pointerEvents: "none",
  borderRadius: "inherit",
  borderStyle: "solid",
  borderWidth: 1,
  overflow: "hidden",
  minWidth: "0%"
}), k3 = U("legend")(({
  ownerState: e,
  theme: t
}) => k({
  float: "unset",
  width: "auto",
  overflow: "hidden"
}, !e.withLabel && {
  padding: 0,
  lineHeight: "11px",
  transition: t.transitions.create("width", {
    duration: 150,
    easing: t.transitions.easing.easeOut
  })
}, e.withLabel && k({
  display: "block",
  padding: 0,
  height: 11,
  fontSize: "0.75em",
  visibility: "hidden",
  maxWidth: 0.01,
  transition: t.transitions.create("max-width", {
    duration: 50,
    easing: t.transitions.easing.easeOut
  }),
  whiteSpace: "nowrap",
  "& > span": {
    paddingLeft: 5,
    paddingRight: 5,
    display: "inline-block",
    opacity: 0,
    visibility: "visible"
  }
}, e.notched && {
  maxWidth: "100%",
  transition: t.transitions.create("max-width", {
    duration: 100,
    easing: t.transitions.easing.easeOut,
    delay: 50
  })
})));
function E3(e) {
  const {
    className: t,
    label: n,
    notched: r
  } = e, o = Q(e, S3), i = n != null && n !== "", s = k({}, e, {
    notched: r,
    withLabel: i
  });
  return /* @__PURE__ */ S(C3, k({
    "aria-hidden": !0,
    className: t,
    ownerState: s
  }, o, {
    children: /* @__PURE__ */ S(k3, {
      ownerState: s,
      children: i ? /* @__PURE__ */ S("span", {
        children: n
      }) : Q0 || (Q0 = /* @__PURE__ */ S("span", {
        className: "notranslate",
        children: "\u200B"
      }))
    })
  }));
}
const R3 = ["components", "fullWidth", "inputComponent", "label", "multiline", "notched", "slots", "type"], T3 = (e) => {
  const {
    classes: t
  } = e, r = me({
    root: ["root"],
    notchedOutline: ["notchedOutline"],
    input: ["input"]
  }, j5, t);
  return k({}, t, r);
}, P3 = U($u, {
  shouldForwardProp: (e) => Tn(e) || e === "classes",
  name: "MuiOutlinedInput",
  slot: "Root",
  overridesResolver: Pu
})(({
  theme: e,
  ownerState: t
}) => {
  const n = e.palette.mode === "light" ? "rgba(0, 0, 0, 0.23)" : "rgba(255, 255, 255, 0.23)";
  return k({
    position: "relative",
    borderRadius: (e.vars || e).shape.borderRadius,
    [`&:hover .${vr.notchedOutline}`]: {
      borderColor: (e.vars || e).palette.text.primary
    },
    "@media (hover: none)": {
      [`&:hover .${vr.notchedOutline}`]: {
        borderColor: e.vars ? `rgba(${e.vars.palette.common.onBackgroundChannel} / 0.23)` : n
      }
    },
    [`&.${vr.focused} .${vr.notchedOutline}`]: {
      borderColor: (e.vars || e).palette[t.color].main,
      borderWidth: 2
    },
    [`&.${vr.error} .${vr.notchedOutline}`]: {
      borderColor: (e.vars || e).palette.error.main
    },
    [`&.${vr.disabled} .${vr.notchedOutline}`]: {
      borderColor: (e.vars || e).palette.action.disabled
    }
  }, t.startAdornment && {
    paddingLeft: 14
  }, t.endAdornment && {
    paddingRight: 14
  }, t.multiline && k({
    padding: "16.5px 14px"
  }, t.size === "small" && {
    padding: "8.5px 14px"
  }));
}), O3 = U(E3, {
  name: "MuiOutlinedInput",
  slot: "NotchedOutline",
  overridesResolver: (e, t) => t.notchedOutline
})(({
  theme: e
}) => {
  const t = e.palette.mode === "light" ? "rgba(0, 0, 0, 0.23)" : "rgba(255, 255, 255, 0.23)";
  return {
    borderColor: e.vars ? `rgba(${e.vars.palette.common.onBackgroundChannel} / 0.23)` : t
  };
}), $3 = U(_u, {
  name: "MuiOutlinedInput",
  slot: "Input",
  overridesResolver: Ou
})(({
  theme: e,
  ownerState: t
}) => k({
  padding: "16.5px 14px"
}, !e.vars && {
  "&:-webkit-autofill": {
    WebkitBoxShadow: e.palette.mode === "light" ? null : "0 0 0 100px #266798 inset",
    WebkitTextFillColor: e.palette.mode === "light" ? null : "#fff",
    caretColor: e.palette.mode === "light" ? null : "#fff",
    borderRadius: "inherit"
  }
}, e.vars && {
  "&:-webkit-autofill": {
    borderRadius: "inherit"
  },
  [e.getColorSchemeSelector("dark")]: {
    "&:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #266798 inset",
      WebkitTextFillColor: "#fff",
      caretColor: "#fff"
    }
  }
}, t.size === "small" && {
  padding: "8.5px 14px"
}, t.multiline && {
  padding: 0
}, t.startAdornment && {
  paddingLeft: 0
}, t.endAdornment && {
  paddingRight: 0
})), iS = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  var r, o, i, s, a;
  const l = ve({
    props: t,
    name: "MuiOutlinedInput"
  }), {
    components: c = {},
    fullWidth: u = !1,
    inputComponent: f = "input",
    label: h,
    multiline: y = !1,
    notched: d,
    slots: m = {},
    type: w = "text"
  } = l, g = Q(l, R3), p = T3(l), v = pr(), b = eo({
    props: l,
    muiFormControl: v,
    states: ["required"]
  }), C = k({}, l, {
    color: b.color || "primary",
    disabled: b.disabled,
    error: b.error,
    focused: b.focused,
    formControl: v,
    fullWidth: u,
    hiddenLabel: b.hiddenLabel,
    multiline: y,
    size: b.size,
    type: w
  }), E = (r = (o = m.root) != null ? o : c.Root) != null ? r : P3, R = (i = (s = m.input) != null ? s : c.Input) != null ? i : $3;
  return /* @__PURE__ */ S(Cm, k({
    slots: {
      root: E,
      input: R
    },
    renderSuffix: (T) => /* @__PURE__ */ S(O3, {
      ownerState: C,
      className: p.notchedOutline,
      label: h != null && h !== "" && b.required ? a || (a = /* @__PURE__ */ G(x.exports.Fragment, {
        children: [h, "\xA0", "*"]
      })) : h,
      notched: typeof d < "u" ? d : Boolean(T.startAdornment || T.filled || T.focused)
    }),
    fullWidth: u,
    inputComponent: f,
    multiline: y,
    ref: n,
    type: w
  }, g, {
    classes: k({}, p, {
      notchedOutline: null
    })
  }));
});
iS.muiName = "Input";
const sS = iS, _3 = Xn(/* @__PURE__ */ S("path", {
  d: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
}), "Star"), M3 = Xn(/* @__PURE__ */ S("path", {
  d: "M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"
}), "StarBorder");
function I3(e) {
  return he("MuiRating", e);
}
const A3 = fe("MuiRating", ["root", "sizeSmall", "sizeMedium", "sizeLarge", "readOnly", "disabled", "focusVisible", "visuallyHidden", "pristine", "label", "labelEmptyValueActive", "icon", "iconEmpty", "iconFilled", "iconHover", "iconFocus", "iconActive", "decimal"]), ss = A3, N3 = ["value"], L3 = ["className", "defaultValue", "disabled", "emptyIcon", "emptyLabelText", "getLabelText", "highlightSelectedOnly", "icon", "IconContainerComponent", "max", "name", "onChange", "onChangeActive", "onMouseLeave", "onMouseMove", "precision", "readOnly", "size", "value"];
function F3(e, t, n) {
  return e < t ? t : e > n ? n : e;
}
function D3(e) {
  const t = e.toString().split(".")[1];
  return t ? t.length : 0;
}
function zd(e, t) {
  if (e == null)
    return e;
  const n = Math.round(e / t) * t;
  return Number(n.toFixed(D3(t)));
}
const z3 = (e) => {
  const {
    classes: t,
    size: n,
    readOnly: r,
    disabled: o,
    emptyValueFocused: i,
    focusVisible: s
  } = e, a = {
    root: ["root", `size${N(n)}`, o && "disabled", s && "focusVisible", r && "readyOnly"],
    label: ["label", "pristine"],
    labelEmptyValue: [i && "labelEmptyValueActive"],
    icon: ["icon"],
    iconEmpty: ["iconEmpty"],
    iconFilled: ["iconFilled"],
    iconHover: ["iconHover"],
    iconFocus: ["iconFocus"],
    iconActive: ["iconActive"],
    decimal: ["decimal"],
    visuallyHidden: ["visuallyHidden"]
  };
  return me(a, I3, t);
}, B3 = U("span", {
  name: "MuiRating",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [{
      [`& .${ss.visuallyHidden}`]: t.visuallyHidden
    }, t.root, t[`size${N(n.size)}`], n.readOnly && t.readOnly];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  display: "inline-flex",
  position: "relative",
  fontSize: e.typography.pxToRem(24),
  color: "#faaf00",
  cursor: "pointer",
  textAlign: "left",
  WebkitTapHighlightColor: "transparent",
  [`&.${ss.disabled}`]: {
    opacity: (e.vars || e).palette.action.disabledOpacity,
    pointerEvents: "none"
  },
  [`&.${ss.focusVisible} .${ss.iconActive}`]: {
    outline: "1px solid #999"
  },
  [`& .${ss.visuallyHidden}`]: kT
}, t.size === "small" && {
  fontSize: e.typography.pxToRem(18)
}, t.size === "large" && {
  fontSize: e.typography.pxToRem(30)
}, t.readOnly && {
  pointerEvents: "none"
})), aS = U("label", {
  name: "MuiRating",
  slot: "Label",
  overridesResolver: (e, t) => t.label
})(({
  ownerState: e
}) => k({
  cursor: "inherit"
}, e.emptyValueFocused && {
  top: 0,
  bottom: 0,
  position: "absolute",
  outline: "1px solid #999",
  width: "100%"
})), j3 = U("span", {
  name: "MuiRating",
  slot: "Icon",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.icon, n.iconEmpty && t.iconEmpty, n.iconFilled && t.iconFilled, n.iconHover && t.iconHover, n.iconFocus && t.iconFocus, n.iconActive && t.iconActive];
  }
})(({
  theme: e,
  ownerState: t
}) => k({
  display: "flex",
  transition: e.transitions.create("transform", {
    duration: e.transitions.duration.shortest
  }),
  pointerEvents: "none"
}, t.iconActive && {
  transform: "scale(1.2)"
}, t.iconEmpty && {
  color: (e.vars || e).palette.action.disabled
})), W3 = U("span", {
  name: "MuiRating",
  slot: "Decimal",
  shouldForwardProp: (e) => Bx(e) && e !== "iconActive",
  overridesResolver: (e, t) => {
    const {
      iconActive: n
    } = e;
    return [t.decimal, n && t.iconActive];
  }
})(({
  iconActive: e
}) => k({
  position: "relative"
}, e && {
  transform: "scale(1.2)"
}));
function U3(e) {
  const t = Q(e, N3);
  return /* @__PURE__ */ S("span", k({}, t));
}
function J0(e) {
  const {
    classes: t,
    disabled: n,
    emptyIcon: r,
    focus: o,
    getLabelText: i,
    highlightSelectedOnly: s,
    hover: a,
    icon: l,
    IconContainerComponent: c,
    isActive: u,
    itemValue: f,
    labelProps: h,
    name: y,
    onBlur: d,
    onChange: m,
    onClick: w,
    onFocus: g,
    readOnly: p,
    ownerState: v,
    ratingValue: b,
    ratingValueRounded: C
  } = e, E = s ? f === b : f <= b, R = f <= a, T = f <= o, O = f === C, P = Ra(), $ = /* @__PURE__ */ S(j3, {
    as: c,
    value: f,
    className: Z(t.icon, E ? t.iconFilled : t.iconEmpty, R && t.iconHover, T && t.iconFocus, u && t.iconActive),
    ownerState: k({}, v, {
      iconEmpty: !E,
      iconFilled: E,
      iconHover: R,
      iconFocus: T,
      iconActive: u
    }),
    children: r && !E ? r : l
  });
  return p ? /* @__PURE__ */ S("span", k({}, h, {
    children: $
  })) : /* @__PURE__ */ G(x.exports.Fragment, {
    children: [/* @__PURE__ */ G(aS, k({
      ownerState: k({}, v, {
        emptyValueFocused: void 0
      }),
      htmlFor: P
    }, h, {
      children: [$, /* @__PURE__ */ S("span", {
        className: t.visuallyHidden,
        children: i(f)
      })]
    })), /* @__PURE__ */ S("input", {
      className: t.visuallyHidden,
      onFocus: g,
      onBlur: d,
      onChange: m,
      onClick: w,
      disabled: n,
      value: f,
      id: P,
      type: "radio",
      name: y,
      checked: O
    })]
  });
}
const H3 = /* @__PURE__ */ S(_3, {
  fontSize: "inherit"
}), V3 = /* @__PURE__ */ S(M3, {
  fontSize: "inherit"
});
function Y3(e) {
  return `${e} Star${e !== 1 ? "s" : ""}`;
}
const X3 = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    name: "MuiRating",
    props: t
  }), {
    className: o,
    defaultValue: i = null,
    disabled: s = !1,
    emptyIcon: a = V3,
    emptyLabelText: l = "Empty",
    getLabelText: c = Y3,
    highlightSelectedOnly: u = !1,
    icon: f = H3,
    IconContainerComponent: h = U3,
    max: y = 5,
    name: d,
    onChange: m,
    onChangeActive: w,
    onMouseLeave: g,
    onMouseMove: p,
    precision: v = 1,
    readOnly: b = !1,
    size: C = "medium",
    value: E
  } = r, R = Q(r, L3), T = Ra(d), [O, P] = oa({
    controlled: E,
    default: i,
    name: "Rating"
  }), $ = zd(O, v), B = Mo(), [{
    hover: D,
    focus: I
  }, M] = x.exports.useState({
    hover: -1,
    focus: -1
  });
  let A = $;
  D !== -1 && (A = D), I !== -1 && (A = I);
  const {
    isFocusVisibleRef: j,
    onBlur: _,
    onFocus: z,
    ref: F
  } = $h(), [Y, q] = x.exports.useState(!1), pe = x.exports.useRef(), ne = Qe(F, pe, n), ae = (oe) => {
    p && p(oe);
    const ue = pe.current, {
      right: ge,
      left: we
    } = ue.getBoundingClientRect(), {
      width: ot
    } = ue.firstChild.getBoundingClientRect();
    let Oe;
    B.direction === "rtl" ? Oe = (ge - oe.clientX) / (ot * y) : Oe = (oe.clientX - we) / (ot * y);
    let ye = zd(y * Oe + v / 2, v);
    ye = F3(ye, v, y), M((Je) => Je.hover === ye && Je.focus === ye ? Je : {
      hover: ye,
      focus: ye
    }), q(!1), w && D !== ye && w(oe, ye);
  }, le = (oe) => {
    g && g(oe);
    const ue = -1;
    M({
      hover: ue,
      focus: ue
    }), w && D !== ue && w(oe, ue);
  }, X = (oe) => {
    let ue = oe.target.value === "" ? null : parseFloat(oe.target.value);
    D !== -1 && (ue = D), P(ue), m && m(oe, ue);
  }, H = (oe) => {
    oe.clientX === 0 && oe.clientY === 0 || (M({
      hover: -1,
      focus: -1
    }), P(null), m && parseFloat(oe.target.value) === $ && m(oe, null));
  }, W = (oe) => {
    z(oe), j.current === !0 && q(!0);
    const ue = parseFloat(oe.target.value);
    M((ge) => ({
      hover: ge.hover,
      focus: ue
    }));
  }, ce = (oe) => {
    if (D !== -1)
      return;
    _(oe), j.current === !1 && q(!1);
    const ue = -1;
    M((ge) => ({
      hover: ge.hover,
      focus: ue
    }));
  }, [re, ie] = x.exports.useState(!1), de = k({}, r, {
    defaultValue: i,
    disabled: s,
    emptyIcon: a,
    emptyLabelText: l,
    emptyValueFocused: re,
    focusVisible: Y,
    getLabelText: c,
    icon: f,
    IconContainerComponent: h,
    max: y,
    precision: v,
    readOnly: b,
    size: C
  }), se = z3(de);
  return /* @__PURE__ */ G(B3, k({
    ref: ne,
    onMouseMove: ae,
    onMouseLeave: le,
    className: Z(se.root, o),
    ownerState: de,
    role: b ? "img" : null,
    "aria-label": b ? c(A) : null
  }, R, {
    children: [Array.from(new Array(y)).map((oe, ue) => {
      const ge = ue + 1, we = {
        classes: se,
        disabled: s,
        emptyIcon: a,
        focus: I,
        getLabelText: c,
        highlightSelectedOnly: u,
        hover: D,
        icon: f,
        IconContainerComponent: h,
        name: T,
        onBlur: ce,
        onChange: X,
        onClick: H,
        onFocus: W,
        ratingValue: A,
        ratingValueRounded: $,
        readOnly: b,
        ownerState: de
      }, ot = ge === Math.ceil(A) && (D !== -1 || I !== -1);
      if (v < 1) {
        const Oe = Array.from(new Array(1 / v));
        return /* @__PURE__ */ S(W3, {
          className: Z(se.decimal, ot && se.iconActive),
          ownerState: de,
          iconActive: ot,
          children: Oe.map((ye, Je) => {
            const Ke = zd(ge - 1 + (Je + 1) * v, v);
            return /* @__PURE__ */ S(J0, k({}, we, {
              isActive: !1,
              itemValue: Ke,
              labelProps: {
                style: Oe.length - 1 === Je ? {} : {
                  width: Ke === A ? `${(Je + 1) * v * 100}%` : "0%",
                  overflow: "hidden",
                  position: "absolute"
                }
              }
            }), Ke);
          })
        }, ge);
      }
      return /* @__PURE__ */ S(J0, k({}, we, {
        isActive: ot,
        itemValue: ge
      }), ge);
    }), !b && !s && /* @__PURE__ */ G(aS, {
      className: Z(se.label, se.labelEmptyValue),
      ownerState: de,
      children: [/* @__PURE__ */ S("input", {
        className: se.visuallyHidden,
        value: "",
        id: `${T}-empty`,
        type: "radio",
        name: T,
        checked: $ == null,
        onFocus: () => ie(!0),
        onBlur: () => ie(!1),
        onChange: X
      }), /* @__PURE__ */ S("span", {
        className: se.visuallyHidden,
        children: l
      })]
    })]
  }));
}), K3 = X3;
function q3(e) {
  return he("MuiSelect", e);
}
const G3 = fe("MuiSelect", ["select", "multiple", "filled", "outlined", "standard", "disabled", "focused", "icon", "iconOpen", "iconFilled", "iconOutlined", "iconStandard", "nativeInput"]), dl = G3;
var Z0;
const Q3 = ["aria-describedby", "aria-label", "autoFocus", "autoWidth", "children", "className", "defaultOpen", "defaultValue", "disabled", "displayEmpty", "IconComponent", "inputRef", "labelId", "MenuProps", "multiple", "name", "onBlur", "onChange", "onClose", "onFocus", "onOpen", "open", "readOnly", "renderValue", "SelectDisplayProps", "tabIndex", "type", "value", "variant"], J3 = U("div", {
  name: "MuiSelect",
  slot: "Select",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [
      {
        [`&.${dl.select}`]: t.select
      },
      {
        [`&.${dl.select}`]: t[n.variant]
      },
      {
        [`&.${dl.multiple}`]: t.multiple
      }
    ];
  }
})(rS, {
  [`&.${dl.select}`]: {
    height: "auto",
    minHeight: "1.4375em",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden"
  }
}), Z3 = U("svg", {
  name: "MuiSelect",
  slot: "Icon",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.icon, n.variant && t[`icon${N(n.variant)}`], n.open && t.iconOpen];
  }
})(oS), eD = U("input", {
  shouldForwardProp: (e) => Bx(e) && e !== "classes",
  name: "MuiSelect",
  slot: "NativeInput",
  overridesResolver: (e, t) => t.nativeInput
})({
  bottom: 0,
  left: 0,
  position: "absolute",
  opacity: 0,
  pointerEvents: "none",
  width: "100%",
  boxSizing: "border-box"
});
function ey(e, t) {
  return typeof t == "object" && t !== null ? e === t : String(e) === String(t);
}
function tD(e) {
  return e == null || typeof e == "string" && !e.trim();
}
const nD = (e) => {
  const {
    classes: t,
    variant: n,
    disabled: r,
    multiple: o,
    open: i
  } = e, s = {
    select: ["select", n, r && "disabled", o && "multiple"],
    icon: ["icon", `icon${N(n)}`, i && "iconOpen", r && "disabled"],
    nativeInput: ["nativeInput"]
  };
  return me(s, q3, t);
}, rD = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const {
    "aria-describedby": r,
    "aria-label": o,
    autoFocus: i,
    autoWidth: s,
    children: a,
    className: l,
    defaultOpen: c,
    defaultValue: u,
    disabled: f,
    displayEmpty: h,
    IconComponent: y,
    inputRef: d,
    labelId: m,
    MenuProps: w = {},
    multiple: g,
    name: p,
    onBlur: v,
    onChange: b,
    onClose: C,
    onFocus: E,
    onOpen: R,
    open: T,
    readOnly: O,
    renderValue: P,
    SelectDisplayProps: $ = {},
    tabIndex: B,
    value: D,
    variant: I = "standard"
  } = t, M = Q(t, Q3), [A, j] = oa({
    controlled: D,
    default: u,
    name: "Select"
  }), [_, z] = oa({
    controlled: T,
    default: c,
    name: "Select"
  }), F = x.exports.useRef(null), Y = x.exports.useRef(null), [q, pe] = x.exports.useState(null), {
    current: ne
  } = x.exports.useRef(T != null), [ae, le] = x.exports.useState(), X = Qe(n, d), H = x.exports.useCallback((K) => {
    Y.current = K, K && pe(K);
  }, []);
  x.exports.useImperativeHandle(X, () => ({
    focus: () => {
      Y.current.focus();
    },
    node: F.current,
    value: A
  }), [A]), x.exports.useEffect(() => {
    c && _ && q && !ne && (le(s ? null : q.clientWidth), Y.current.focus());
  }, [q, s]), x.exports.useEffect(() => {
    i && Y.current.focus();
  }, [i]), x.exports.useEffect(() => {
    if (!m)
      return;
    const K = mt(Y.current).getElementById(m);
    if (K) {
      const J = () => {
        getSelection().isCollapsed && Y.current.focus();
      };
      return K.addEventListener("click", J), () => {
        K.removeEventListener("click", J);
      };
    }
  }, [m]);
  const W = (K, J) => {
    K ? R && R(J) : C && C(J), ne || (le(s ? null : q.clientWidth), z(K));
  }, ce = (K) => {
    K.button === 0 && (K.preventDefault(), Y.current.focus(), W(!0, K));
  }, re = (K) => {
    W(!1, K);
  }, ie = x.exports.Children.toArray(a), de = (K) => {
    const J = ie.map((Le) => Le.props.value).indexOf(K.target.value);
    if (J === -1)
      return;
    const Ae = ie[J];
    j(Ae.props.value), b && b(K, Ae);
  }, se = (K) => (J) => {
    let Ae;
    if (!!J.currentTarget.hasAttribute("tabindex")) {
      if (g) {
        Ae = Array.isArray(A) ? A.slice() : [];
        const Le = A.indexOf(K.props.value);
        Le === -1 ? Ae.push(K.props.value) : Ae.splice(Le, 1);
      } else
        Ae = K.props.value;
      if (K.props.onClick && K.props.onClick(J), A !== Ae && (j(Ae), b)) {
        const Le = J.nativeEvent || J, en = new Le.constructor(Le.type, Le);
        Object.defineProperty(en, "target", {
          writable: !0,
          value: {
            value: Ae,
            name: p
          }
        }), b(en, K);
      }
      g || W(!1, J);
    }
  }, oe = (K) => {
    O || [
      " ",
      "ArrowUp",
      "ArrowDown",
      "Enter"
    ].indexOf(K.key) !== -1 && (K.preventDefault(), W(!0, K));
  }, ue = q !== null && _, ge = (K) => {
    !ue && v && (Object.defineProperty(K, "target", {
      writable: !0,
      value: {
        value: A,
        name: p
      }
    }), v(K));
  };
  delete M["aria-invalid"];
  let we, ot;
  const Oe = [];
  let ye = !1;
  (Sm({
    value: A
  }) || h) && (P ? we = P(A) : ye = !0);
  const Je = ie.map((K, J, Ae) => {
    if (!/* @__PURE__ */ x.exports.isValidElement(K))
      return null;
    let Le;
    if (g) {
      if (!Array.isArray(A))
        throw new Error(Vr(2));
      Le = A.some((mn) => ey(mn, K.props.value)), Le && ye && Oe.push(K.props.children);
    } else
      Le = ey(A, K.props.value), Le && ye && (ot = K.props.children);
    if (K.props.value === void 0)
      return /* @__PURE__ */ x.exports.cloneElement(K, {
        "aria-readonly": !0,
        role: "option"
      });
    const en = () => {
      if (A)
        return Le;
      const mn = Ae.find((no) => no.props.value !== void 0 && no.props.disabled !== !0);
      return K === mn ? !0 : Le;
    };
    return /* @__PURE__ */ x.exports.cloneElement(K, {
      "aria-selected": Le ? "true" : "false",
      onClick: se(K),
      onKeyUp: (mn) => {
        mn.key === " " && mn.preventDefault(), K.props.onKeyUp && K.props.onKeyUp(mn);
      },
      role: "option",
      selected: Ae[0].props.value === void 0 || Ae[0].props.disabled === !0 ? en() : Le,
      value: void 0,
      "data-value": K.props.value
    });
  });
  ye && (g ? Oe.length === 0 ? we = null : we = Oe.reduce((K, J, Ae) => (K.push(J), Ae < Oe.length - 1 && K.push(", "), K), []) : we = ot);
  let Ke = ae;
  !s && ne && q && (Ke = q.clientWidth);
  let Ze;
  typeof B < "u" ? Ze = B : Ze = f ? null : 0;
  const Ye = $.id || (p ? `mui-component-select-${p}` : void 0), bt = k({}, t, {
    variant: I,
    value: A,
    open: ue
  }), Mt = nD(bt);
  return /* @__PURE__ */ G(x.exports.Fragment, {
    children: [/* @__PURE__ */ S(J3, k({
      ref: H,
      tabIndex: Ze,
      role: "button",
      "aria-disabled": f ? "true" : void 0,
      "aria-expanded": ue ? "true" : "false",
      "aria-haspopup": "listbox",
      "aria-label": o,
      "aria-labelledby": [m, Ye].filter(Boolean).join(" ") || void 0,
      "aria-describedby": r,
      onKeyDown: oe,
      onMouseDown: f || O ? null : ce,
      onBlur: ge,
      onFocus: E
    }, $, {
      ownerState: bt,
      className: Z($.className, Mt.select, l),
      id: Ye,
      children: tD(we) ? Z0 || (Z0 = /* @__PURE__ */ S("span", {
        className: "notranslate",
        children: "\u200B"
      })) : we
    })), /* @__PURE__ */ S(eD, k({
      value: Array.isArray(A) ? A.join(",") : A,
      name: p,
      ref: F,
      "aria-hidden": !0,
      onChange: de,
      tabIndex: -1,
      disabled: f,
      className: Mt.nativeInput,
      autoFocus: i,
      ownerState: bt
    }, M)), /* @__PURE__ */ S(Z3, {
      as: y,
      className: Mt.icon,
      ownerState: bt
    }), /* @__PURE__ */ S(km, k({
      id: `menu-${p || ""}`,
      anchorEl: q,
      open: ue,
      onClose: re,
      anchorOrigin: {
        vertical: "bottom",
        horizontal: "center"
      },
      transformOrigin: {
        vertical: "top",
        horizontal: "center"
      }
    }, w, {
      MenuListProps: k({
        "aria-labelledby": m,
        role: "listbox",
        disableListWrap: !0
      }, w.MenuListProps),
      PaperProps: k({}, w.PaperProps, {
        style: k({
          minWidth: Ke
        }, w.PaperProps != null ? w.PaperProps.style : null)
      }),
      children: Je
    }))]
  });
}), oD = rD;
var ty, ny;
const iD = ["autoWidth", "children", "classes", "className", "defaultOpen", "displayEmpty", "IconComponent", "id", "input", "inputProps", "label", "labelId", "MenuProps", "multiple", "native", "onClose", "onOpen", "open", "renderValue", "SelectDisplayProps", "variant"], sD = (e) => {
  const {
    classes: t
  } = e;
  return t;
}, Rm = {
  name: "MuiSelect",
  overridesResolver: (e, t) => t.root,
  shouldForwardProp: (e) => Tn(e) && e !== "variant",
  slot: "Root"
}, aD = U(tS, Rm)(""), lD = U(sS, Rm)(""), cD = U(Zw, Rm)(""), lS = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    name: "MuiSelect",
    props: t
  }), {
    autoWidth: o = !1,
    children: i,
    classes: s = {},
    className: a,
    defaultOpen: l = !1,
    displayEmpty: c = !1,
    IconComponent: u = V5,
    id: f,
    input: h,
    inputProps: y,
    label: d,
    labelId: m,
    MenuProps: w,
    multiple: g = !1,
    native: p = !1,
    onClose: v,
    onOpen: b,
    open: C,
    renderValue: E,
    SelectDisplayProps: R,
    variant: T = "outlined"
  } = r, O = Q(r, iD), P = p ? w3 : oD, $ = pr(), D = eo({
    props: r,
    muiFormControl: $,
    states: ["variant"]
  }).variant || T, I = h || {
    standard: ty || (ty = /* @__PURE__ */ S(aD, {})),
    outlined: /* @__PURE__ */ S(lD, {
      label: d
    }),
    filled: ny || (ny = /* @__PURE__ */ S(cD, {}))
  }[D], M = k({}, r, {
    variant: D,
    classes: s
  }), A = sD(M), j = Qe(n, I.ref);
  return /* @__PURE__ */ S(x.exports.Fragment, {
    children: /* @__PURE__ */ x.exports.cloneElement(I, k({
      inputComponent: P,
      inputProps: k({
        children: i,
        IconComponent: u,
        variant: D,
        type: void 0,
        multiple: g
      }, p ? {
        id: f
      } : {
        autoWidth: o,
        defaultOpen: l,
        displayEmpty: c,
        labelId: m,
        MenuProps: w,
        onClose: v,
        onOpen: b,
        open: C,
        renderValue: E,
        SelectDisplayProps: k({
          id: f
        }, R)
      }, y, {
        classes: y ? Bt(A, y.classes) : A
      }, h ? h.props.inputProps : {})
    }, g && p && D === "outlined" ? {
      notched: !0
    } : {}, {
      ref: j,
      className: Z(I.props.className, a)
    }, !h && {
      variant: D
    }, O))
  });
});
lS.muiName = "Select";
const uD = lS;
function dD(e) {
  return he("MuiSnackbarContent", e);
}
fe("MuiSnackbarContent", ["root", "message", "action"]);
const fD = ["action", "className", "message", "role"], pD = (e) => {
  const {
    classes: t
  } = e;
  return me({
    root: ["root"],
    action: ["action"],
    message: ["message"]
  }, dD, t);
}, hD = U(Fi, {
  name: "MuiSnackbarContent",
  slot: "Root",
  overridesResolver: (e, t) => t.root
})(({
  theme: e
}) => {
  const t = e.palette.mode === "light" ? 0.8 : 0.98, n = AO(e.palette.background.default, t);
  return k({}, e.typography.body2, {
    color: e.vars ? e.vars.palette.SnackbarContent.color : e.palette.getContrastText(n),
    backgroundColor: e.vars ? e.vars.palette.SnackbarContent.bg : n,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    padding: "6px 16px",
    borderRadius: (e.vars || e).shape.borderRadius,
    flexGrow: 1,
    [e.breakpoints.up("sm")]: {
      flexGrow: "initial",
      minWidth: 288
    }
  });
}), mD = U("div", {
  name: "MuiSnackbarContent",
  slot: "Message",
  overridesResolver: (e, t) => t.message
})({
  padding: "8px 0"
}), gD = U("div", {
  name: "MuiSnackbarContent",
  slot: "Action",
  overridesResolver: (e, t) => t.action
})({
  display: "flex",
  alignItems: "center",
  marginLeft: "auto",
  paddingLeft: 16,
  marginRight: -8
}), vD = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiSnackbarContent"
  }), {
    action: o,
    className: i,
    message: s,
    role: a = "alert"
  } = r, l = Q(r, fD), c = r, u = pD(c);
  return /* @__PURE__ */ G(hD, k({
    role: a,
    square: !0,
    elevation: 6,
    className: Z(u.root, i),
    ownerState: c,
    ref: n
  }, l, {
    children: [/* @__PURE__ */ S(mD, {
      className: u.message,
      ownerState: c,
      children: s
    }), o ? /* @__PURE__ */ S(gD, {
      className: u.action,
      ownerState: c,
      children: o
    }) : null]
  }));
}), yD = vD;
function bD(e) {
  return he("MuiSnackbar", e);
}
fe("MuiSnackbar", ["root", "anchorOriginTopCenter", "anchorOriginBottomCenter", "anchorOriginTopRight", "anchorOriginBottomRight", "anchorOriginTopLeft", "anchorOriginBottomLeft"]);
const xD = ["onEnter", "onExited"], wD = ["action", "anchorOrigin", "autoHideDuration", "children", "className", "ClickAwayListenerProps", "ContentProps", "disableWindowBlurListener", "message", "onBlur", "onClose", "onFocus", "onMouseEnter", "onMouseLeave", "open", "resumeHideDuration", "TransitionComponent", "transitionDuration", "TransitionProps"], SD = (e) => {
  const {
    classes: t,
    anchorOrigin: n
  } = e, r = {
    root: ["root", `anchorOrigin${N(n.vertical)}${N(n.horizontal)}`]
  };
  return me(r, bD, t);
}, CD = U("div", {
  name: "MuiSnackbar",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, t[`anchorOrigin${N(n.anchorOrigin.vertical)}${N(n.anchorOrigin.horizontal)}`]];
  }
})(({
  theme: e,
  ownerState: t
}) => {
  const n = {
    left: "50%",
    right: "auto",
    transform: "translateX(-50%)"
  };
  return k({
    zIndex: (e.vars || e).zIndex.snackbar,
    position: "fixed",
    display: "flex",
    left: 8,
    right: 8,
    justifyContent: "center",
    alignItems: "center"
  }, t.anchorOrigin.vertical === "top" ? {
    top: 8
  } : {
    bottom: 8
  }, t.anchorOrigin.horizontal === "left" && {
    justifyContent: "flex-start"
  }, t.anchorOrigin.horizontal === "right" && {
    justifyContent: "flex-end"
  }, {
    [e.breakpoints.up("sm")]: k({}, t.anchorOrigin.vertical === "top" ? {
      top: 24
    } : {
      bottom: 24
    }, t.anchorOrigin.horizontal === "center" && n, t.anchorOrigin.horizontal === "left" && {
      left: 24,
      right: "auto"
    }, t.anchorOrigin.horizontal === "right" && {
      right: 24,
      left: "auto"
    })
  });
}), kD = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiSnackbar"
  }), o = Mo(), i = {
    enter: o.transitions.duration.enteringScreen,
    exit: o.transitions.duration.leavingScreen
  }, {
    action: s,
    anchorOrigin: {
      vertical: a,
      horizontal: l
    } = {
      vertical: "bottom",
      horizontal: "left"
    },
    autoHideDuration: c = null,
    children: u,
    className: f,
    ClickAwayListenerProps: h,
    ContentProps: y,
    disableWindowBlurListener: d = !1,
    message: m,
    onBlur: w,
    onClose: g,
    onFocus: p,
    onMouseEnter: v,
    onMouseLeave: b,
    open: C,
    resumeHideDuration: E,
    TransitionComponent: R = Cc,
    transitionDuration: T = i,
    TransitionProps: {
      onEnter: O,
      onExited: P
    } = {}
  } = r, $ = Q(r.TransitionProps, xD), B = Q(r, wD), D = k({}, r, {
    anchorOrigin: {
      vertical: a,
      horizontal: l
    }
  }), I = SD(D), M = x.exports.useRef(), [A, j] = x.exports.useState(!0), _ = In((...W) => {
    g && g(...W);
  }), z = In((W) => {
    !g || W == null || (clearTimeout(M.current), M.current = setTimeout(() => {
      _(null, "timeout");
    }, W));
  });
  x.exports.useEffect(() => (C && z(c), () => {
    clearTimeout(M.current);
  }), [C, c, z]);
  const F = () => {
    clearTimeout(M.current);
  }, Y = x.exports.useCallback(() => {
    c != null && z(E != null ? E : c * 0.5);
  }, [c, E, z]), q = (W) => {
    p && p(W), F();
  }, pe = (W) => {
    v && v(W), F();
  }, ne = (W) => {
    w && w(W), Y();
  }, ae = (W) => {
    b && b(W), Y();
  }, le = (W) => {
    g && g(W, "clickaway");
  }, X = (W) => {
    j(!0), P && P(W);
  }, H = (W, ce) => {
    j(!1), O && O(W, ce);
  };
  return x.exports.useEffect(() => {
    if (!d && C)
      return window.addEventListener("focus", Y), window.addEventListener("blur", F), () => {
        window.removeEventListener("focus", Y), window.removeEventListener("blur", F);
      };
  }, [d, Y, C]), x.exports.useEffect(() => {
    if (!C)
      return;
    function W(ce) {
      ce.defaultPrevented || (ce.key === "Escape" || ce.key === "Esc") && g && g(ce, "escapeKeyDown");
    }
    return document.addEventListener("keydown", W), () => {
      document.removeEventListener("keydown", W);
    };
  }, [A, C, g]), !C && A ? null : /* @__PURE__ */ S(KO, k({
    onClickAway: le
  }, h, {
    children: /* @__PURE__ */ S(CD, k({
      className: Z(I.root, f),
      onBlur: ne,
      onFocus: q,
      onMouseEnter: pe,
      onMouseLeave: ae,
      ownerState: D,
      ref: n,
      role: "presentation"
    }, B, {
      children: /* @__PURE__ */ S(R, k({
        appear: !0,
        in: C,
        timeout: T,
        direction: a === "top" ? "down" : "up",
        onEnter: H,
        onExited: X
      }, $, {
        children: u || /* @__PURE__ */ S(yD, k({
          message: m,
          action: s
        }, y))
      }))
    }))
  }));
}), ED = kD, RD = ["component", "direction", "spacing", "divider", "children"];
function TD(e, t) {
  const n = x.exports.Children.toArray(e).filter(Boolean);
  return n.reduce((r, o, i) => (r.push(o), i < n.length - 1 && r.push(/* @__PURE__ */ x.exports.cloneElement(t, {
    key: `separator-${i}`
  })), r), []);
}
const PD = (e) => ({
  row: "Left",
  "row-reverse": "Right",
  column: "Top",
  "column-reverse": "Bottom"
})[e], OD = ({
  ownerState: e,
  theme: t
}) => {
  let n = k({
    display: "flex",
    flexDirection: "column"
  }, Wn({
    theme: t
  }, yd({
    values: e.direction,
    breakpoints: t.breakpoints.values
  }), (r) => ({
    flexDirection: r
  })));
  if (e.spacing) {
    const r = Ih(t), o = Object.keys(t.breakpoints.values).reduce((l, c) => ((typeof e.spacing == "object" && e.spacing[c] != null || typeof e.direction == "object" && e.direction[c] != null) && (l[c] = !0), l), {}), i = yd({
      values: e.direction,
      base: o
    }), s = yd({
      values: e.spacing,
      base: o
    });
    typeof i == "object" && Object.keys(i).forEach((l, c, u) => {
      if (!i[l]) {
        const h = c > 0 ? i[u[c - 1]] : "column";
        i[l] = h;
      }
    }), n = Bt(n, Wn({
      theme: t
    }, s, (l, c) => ({
      "& > :not(style) + :not(style)": {
        margin: 0,
        [`margin${PD(c ? i[c] : e.direction)}`]: Ai(r, l)
      }
    })));
  }
  return n = PT(t.breakpoints, n), n;
}, $D = U("div", {
  name: "MuiStack",
  slot: "Root",
  overridesResolver: (e, t) => [t.root]
})(OD), _D = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiStack"
  }), o = zh(r), {
    component: i = "div",
    direction: s = "column",
    spacing: a = 0,
    divider: l,
    children: c
  } = o, u = Q(o, RD);
  return /* @__PURE__ */ S($D, k({
    as: i,
    ownerState: {
      direction: s,
      spacing: a
    },
    ref: n
  }, u, {
    children: l ? TD(c, l) : c
  }));
}), Nt = _D;
function MD(e) {
  return he("MuiSwitch", e);
}
const ID = fe("MuiSwitch", ["root", "edgeStart", "edgeEnd", "switchBase", "colorPrimary", "colorSecondary", "sizeSmall", "sizeMedium", "checked", "disabled", "input", "thumb", "track"]), Tt = ID, AD = ["className", "color", "edge", "size", "sx"], ND = (e) => {
  const {
    classes: t,
    edge: n,
    size: r,
    color: o,
    checked: i,
    disabled: s
  } = e, a = {
    root: ["root", n && `edge${N(n)}`, `size${N(r)}`],
    switchBase: ["switchBase", `color${N(o)}`, i && "checked", s && "disabled"],
    thumb: ["thumb"],
    track: ["track"],
    input: ["input"]
  }, l = me(a, MD, t);
  return k({}, t, l);
}, LD = U("span", {
  name: "MuiSwitch",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.root, n.edge && t[`edge${N(n.edge)}`], t[`size${N(n.size)}`]];
  }
})(({
  ownerState: e
}) => k({
  display: "inline-flex",
  width: 34 + 12 * 2,
  height: 14 + 12 * 2,
  overflow: "hidden",
  padding: 12,
  boxSizing: "border-box",
  position: "relative",
  flexShrink: 0,
  zIndex: 0,
  verticalAlign: "middle",
  "@media print": {
    colorAdjust: "exact"
  }
}, e.edge === "start" && {
  marginLeft: -8
}, e.edge === "end" && {
  marginRight: -8
}, e.size === "small" && {
  width: 40,
  height: 24,
  padding: 7,
  [`& .${Tt.thumb}`]: {
    width: 16,
    height: 16
  },
  [`& .${Tt.switchBase}`]: {
    padding: 4,
    [`&.${Tt.checked}`]: {
      transform: "translateX(16px)"
    }
  }
})), FD = U(_L, {
  name: "MuiSwitch",
  slot: "SwitchBase",
  overridesResolver: (e, t) => {
    const {
      ownerState: n
    } = e;
    return [t.switchBase, {
      [`& .${Tt.input}`]: t.input
    }, n.color !== "default" && t[`color${N(n.color)}`]];
  }
})(({
  theme: e
}) => ({
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 1,
  color: e.vars ? e.vars.palette.Switch.defaultColor : `${e.palette.mode === "light" ? e.palette.common.white : e.palette.grey[300]}`,
  transition: e.transitions.create(["left", "transform"], {
    duration: e.transitions.duration.shortest
  }),
  [`&.${Tt.checked}`]: {
    transform: "translateX(20px)"
  },
  [`&.${Tt.disabled}`]: {
    color: e.vars ? e.vars.palette.Switch.defaultDisabledColor : `${e.palette.mode === "light" ? e.palette.grey[100] : e.palette.grey[600]}`
  },
  [`&.${Tt.checked} + .${Tt.track}`]: {
    opacity: 0.5
  },
  [`&.${Tt.disabled} + .${Tt.track}`]: {
    opacity: e.vars ? e.vars.opacity.switchTrackDisabled : `${e.palette.mode === "light" ? 0.12 : 0.2}`
  },
  [`& .${Tt.input}`]: {
    left: "-100%",
    width: "300%"
  }
}), ({
  theme: e,
  ownerState: t
}) => k({
  "&:hover": {
    backgroundColor: e.vars ? `rgba(${e.vars.palette.action.activeChannel} / ${e.vars.palette.action.hoverOpacity})` : Ie(e.palette.action.active, e.palette.action.hoverOpacity),
    "@media (hover: none)": {
      backgroundColor: "transparent"
    }
  }
}, t.color !== "default" && {
  [`&.${Tt.checked}`]: {
    color: (e.vars || e).palette[t.color].main,
    "&:hover": {
      backgroundColor: e.vars ? `rgba(${e.vars.palette[t.color].mainChannel} / ${e.vars.palette.action.hoverOpacity})` : Ie(e.palette[t.color].main, e.palette.action.hoverOpacity),
      "@media (hover: none)": {
        backgroundColor: "transparent"
      }
    },
    [`&.${Tt.disabled}`]: {
      color: e.vars ? e.vars.palette.Switch[`${t.color}DisabledColor`] : `${e.palette.mode === "light" ? sa(e.palette[t.color].main, 0.62) : ia(e.palette[t.color].main, 0.55)}`
    }
  },
  [`&.${Tt.checked} + .${Tt.track}`]: {
    backgroundColor: (e.vars || e).palette[t.color].main
  }
})), DD = U("span", {
  name: "MuiSwitch",
  slot: "Track",
  overridesResolver: (e, t) => t.track
})(({
  theme: e
}) => ({
  height: "100%",
  width: "100%",
  borderRadius: 14 / 2,
  zIndex: -1,
  transition: e.transitions.create(["opacity", "background-color"], {
    duration: e.transitions.duration.shortest
  }),
  backgroundColor: e.vars ? e.vars.palette.common.onBackground : `${e.palette.mode === "light" ? e.palette.common.black : e.palette.common.white}`,
  opacity: e.vars ? e.vars.opacity.switchTrack : `${e.palette.mode === "light" ? 0.38 : 0.3}`
})), zD = U("span", {
  name: "MuiSwitch",
  slot: "Thumb",
  overridesResolver: (e, t) => t.thumb
})(({
  theme: e
}) => ({
  boxShadow: (e.vars || e).shadows[1],
  backgroundColor: "currentColor",
  width: 20,
  height: 20,
  borderRadius: "50%"
})), BD = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiSwitch"
  }), {
    className: o,
    color: i = "primary",
    edge: s = !1,
    size: a = "medium",
    sx: l
  } = r, c = Q(r, AD), u = k({}, r, {
    color: i,
    edge: s,
    size: a
  }), f = ND(u), h = /* @__PURE__ */ S(zD, {
    className: f.thumb,
    ownerState: u
  });
  return /* @__PURE__ */ G(LD, {
    className: Z(f.root, o),
    sx: l,
    ownerState: u,
    children: [/* @__PURE__ */ S(FD, k({
      type: "checkbox",
      icon: h,
      checkedIcon: h,
      ref: n,
      ownerState: u
    }, c, {
      classes: k({}, f, {
        root: f.switchBase
      })
    })), /* @__PURE__ */ S(DD, {
      className: f.track,
      ownerState: u
    })]
  });
}), jD = BD;
function WD(e) {
  return he("MuiTextField", e);
}
fe("MuiTextField", ["root"]);
const UD = ["autoComplete", "autoFocus", "children", "className", "color", "defaultValue", "disabled", "error", "FormHelperTextProps", "fullWidth", "helperText", "id", "InputLabelProps", "inputProps", "InputProps", "inputRef", "label", "maxRows", "minRows", "multiline", "name", "onBlur", "onChange", "onFocus", "placeholder", "required", "rows", "select", "SelectProps", "type", "value", "variant"], HD = {
  standard: tS,
  filled: Zw,
  outlined: sS
}, VD = (e) => {
  const {
    classes: t
  } = e;
  return me({
    root: ["root"]
  }, WD, t);
}, YD = U(Y4, {
  name: "MuiTextField",
  slot: "Root",
  overridesResolver: (e, t) => t.root
})({}), XD = /* @__PURE__ */ x.exports.forwardRef(function(t, n) {
  const r = ve({
    props: t,
    name: "MuiTextField"
  }), {
    autoComplete: o,
    autoFocus: i = !1,
    children: s,
    className: a,
    color: l = "primary",
    defaultValue: c,
    disabled: u = !1,
    error: f = !1,
    FormHelperTextProps: h,
    fullWidth: y = !1,
    helperText: d,
    id: m,
    InputLabelProps: w,
    inputProps: g,
    InputProps: p,
    inputRef: v,
    label: b,
    maxRows: C,
    minRows: E,
    multiline: R = !1,
    name: T,
    onBlur: O,
    onChange: P,
    onFocus: $,
    placeholder: B,
    required: D = !1,
    rows: I,
    select: M = !1,
    SelectProps: A,
    type: j,
    value: _,
    variant: z = "outlined"
  } = r, F = Q(r, UD), Y = k({}, r, {
    autoFocus: i,
    color: l,
    disabled: u,
    error: f,
    fullWidth: y,
    multiline: R,
    required: D,
    select: M,
    variant: z
  }), q = VD(Y), pe = {};
  z === "outlined" && (w && typeof w.shrink < "u" && (pe.notched = w.shrink), pe.label = b), M && ((!A || !A.native) && (pe.id = void 0), pe["aria-describedby"] = void 0);
  const ne = Ra(m), ae = d && ne ? `${ne}-helper-text` : void 0, le = b && ne ? `${ne}-label` : void 0, X = HD[z], H = /* @__PURE__ */ S(X, k({
    "aria-describedby": ae,
    autoComplete: o,
    autoFocus: i,
    defaultValue: c,
    fullWidth: y,
    multiline: R,
    name: T,
    rows: I,
    maxRows: C,
    minRows: E,
    type: j,
    value: _,
    id: ne,
    inputRef: v,
    onBlur: O,
    onChange: P,
    onFocus: $,
    placeholder: B,
    inputProps: g
  }, pe, p));
  return /* @__PURE__ */ G(YD, k({
    className: Z(q.root, a),
    disabled: u,
    error: f,
    fullWidth: y,
    ref: n,
    required: D,
    color: l,
    variant: z,
    ownerState: Y
  }, F, {
    children: [b != null && b !== "" && /* @__PURE__ */ S($F, k({
      htmlFor: ne,
      id: le
    }, w, {
      children: b
    })), M ? /* @__PURE__ */ S(uD, k({
      "aria-describedby": ae,
      id: ne,
      labelId: le,
      value: _,
      input: H
    }, A, {
      children: s
    })) : H, d && /* @__PURE__ */ S(fF, k({
      id: ae
    }, h, {
      children: d
    }))]
  }));
}), yo = XD;
function KD({
  link: e
}) {
  return /* @__PURE__ */ S(qe, {
    sx: {
      mt: 2,
      maxWidth: "100%"
    },
    children: /* @__PURE__ */ S("audio", {
      style: {
        width: "90%"
      },
      controls: !0,
      src: e
    })
  });
}
function qD({
  isSender: e,
  message: t,
  buttons: n,
  botStyles: r,
  socket: o,
  updatemyMessages: i,
  visitorId: s
}) {
  const a = async (c, u) => {
    if (c.preventDefault(), u.type === "text") {
      const f = {
        value: u.value,
        type: "text",
        senderId: s,
        time: new Date().toISOString(),
        id: new Date().getTime()
      };
      await o.emit("events", {
        event: "chat-message-bot",
        data: {
          message: u.value
        }
      }), i(f);
    } else if (u.type === "goto") {
      const f = {
        value: u.title,
        type: "text",
        senderId: s,
        time: new Date().toISOString(),
        id: new Date().getTime()
      };
      await o.emit("events", {
        event: "chat-message-bot",
        data: {
          message: u.value,
          type: "goto"
        }
      }), i(f);
    }
  }, l = {
    textTransform: "capitalize",
    color: (r == null ? void 0 : r.buttonTextColor) || "default",
    backgroundColor: r == null ? void 0 : r.buttonColor,
    "&:hover": {
      backgroundColor: "blue",
      color: "#fff"
    },
    borderColor: r.buttonColor,
    mb: 0.5
  };
  return /* @__PURE__ */ G("div", {
    style: {
      borderRadius: "0.3rem",
      width: "fit-content",
      minWidth: "90%",
      maxWidth: "90%",
      boxShadow: "0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)"
    },
    children: [t && /* @__PURE__ */ S(gt, {
      sx: {
        width: "fit-content",
        fontSize: "0.875rem",
        mt: 2,
        mb: 2,
        p: (c) => c.spacing(0, 1),
        borderTopLeftRadius: e ? void 0 : 0,
        borderTopRightRadius: e ? 0 : void 0,
        backgroundColor: e ? r.buttonColor : "background.paper",
        "&.hover:": {
          background: "text.primary",
          color: "#000"
        }
      },
      children: t
    }), /* @__PURE__ */ S(qe, {
      sx: {
        display: "flex",
        "& > *": {
          m: 0
        },
        width: "90%",
        margin: "0 auto"
      },
      children: /* @__PURE__ */ S(gL, {
        fullWidth: !0,
        orientation: "vertical",
        children: n.length > 0 && n.map((c, u) => {
          if ((c == null ? void 0 : c.type) === "phone")
            return /* @__PURE__ */ S(st, {
              sx: l,
              href: `tel:${c.value}`,
              children: c.title
            }, u);
          if ((c == null ? void 0 : c.type) === "goto")
            return /* @__PURE__ */ S(st, {
              sx: l,
              onClick: (f) => a(f, c),
              children: c.title
            }, u);
          if ((c == null ? void 0 : c.type) === "url")
            return /* @__PURE__ */ S(st, {
              sx: l,
              href: c.value,
              target: "_blank",
              rel: "noopener noreferrer",
              children: c.title
            }, u);
          if ((c == null ? void 0 : c.type) === "text")
            return /* @__PURE__ */ S(st, {
              sx: l,
              onClick: (f) => a(f, c),
              children: c.title
            }, u);
        })
      })
    })]
  });
}
function GD({
  socket: e,
  setIsFeedbackOpen: t,
  botStyles: n
}) {
  const [r, o] = x.exports.useState({
    rating: 0,
    comment: ""
  }), [i, s] = x.exports.useState(""), a = (u) => {
    u.preventDefault(), r.rating > 0 ? (e.emit("submit-feedback", {
      data: r
    }), t(!1), s("")) : s("Please give rating...");
  }, l = (u) => {
    o({
      ...r,
      [u.target.name]: u.target.value
    });
  }, c = {
    textTransform: "capitalize",
    color: (n == null ? void 0 : n.buttonTextColor) || "default",
    backgroundColor: n == null ? void 0 : n.buttonColor,
    "&:hover": {
      backgroundColor: "blue",
      color: "#fff"
    },
    borderColor: n.buttonColor,
    mb: 0.2
  };
  return /* @__PURE__ */ G("form", {
    onSubmit: a,
    style: {
      padding: "0.5rem",
      boxShadow: "0 0 3px grey",
      marginTop: "0.5rem",
      borderRadius: "0.3rem"
    },
    children: [i && /* @__PURE__ */ S(xm, {
      severity: "warning",
      children: i
    }), /* @__PURE__ */ G(Nt, {
      spacing: 1,
      direction: "column",
      width: "90%",
      margin: "0 auto",
      justifyContent: "center",
      alignItems: "center",
      children: [/* @__PURE__ */ S(gt, {
        variant: "overline",
        display: "block",
        gutterBottom: !0,
        sx: {
          fontSize: "1.1rem",
          color: "#000"
        },
        children: "Feedback"
      }), /* @__PURE__ */ S(K3, {
        name: "rating",
        onChange: l,
        defaultValue: 0,
        precision: 1,
        size: "large"
      }), /* @__PURE__ */ S(yo, {
        multiline: !0,
        rows: 3,
        fullWidth: !0,
        inputProps: {
          maxLength: "180"
        },
        onChange: l,
        name: "comment",
        placeholder: "Add your feedback message..."
      }), /* @__PURE__ */ S(st, {
        type: "submit",
        variant: "contained",
        size: "small",
        sx: c,
        children: "Submit"
      })]
    })]
  });
}
var cS = function() {
  if (typeof Map < "u")
    return Map;
  function e(t, n) {
    var r = -1;
    return t.some(function(o, i) {
      return o[0] === n ? (r = i, !0) : !1;
    }), r;
  }
  return function() {
    function t() {
      this.__entries__ = [];
    }
    return Object.defineProperty(t.prototype, "size", {
      get: function() {
        return this.__entries__.length;
      },
      enumerable: !0,
      configurable: !0
    }), t.prototype.get = function(n) {
      var r = e(this.__entries__, n), o = this.__entries__[r];
      return o && o[1];
    }, t.prototype.set = function(n, r) {
      var o = e(this.__entries__, n);
      ~o ? this.__entries__[o][1] = r : this.__entries__.push([n, r]);
    }, t.prototype.delete = function(n) {
      var r = this.__entries__, o = e(r, n);
      ~o && r.splice(o, 1);
    }, t.prototype.has = function(n) {
      return !!~e(this.__entries__, n);
    }, t.prototype.clear = function() {
      this.__entries__.splice(0);
    }, t.prototype.forEach = function(n, r) {
      r === void 0 && (r = null);
      for (var o = 0, i = this.__entries__; o < i.length; o++) {
        var s = i[o];
        n.call(r, s[1], s[0]);
      }
    }, t;
  }();
}(), hp = typeof window < "u" && typeof document < "u" && window.document === document, Ec = function() {
  return typeof global < "u" && global.Math === Math ? global : typeof self < "u" && self.Math === Math ? self : typeof window < "u" && window.Math === Math ? window : Function("return this")();
}(), QD = function() {
  return typeof requestAnimationFrame == "function" ? requestAnimationFrame.bind(Ec) : function(e) {
    return setTimeout(function() {
      return e(Date.now());
    }, 1e3 / 60);
  };
}(), JD = 2;
function ZD(e, t) {
  var n = !1, r = !1, o = 0;
  function i() {
    n && (n = !1, e()), r && a();
  }
  function s() {
    QD(i);
  }
  function a() {
    var l = Date.now();
    if (n) {
      if (l - o < JD)
        return;
      r = !0;
    } else
      n = !0, r = !1, setTimeout(s, t);
    o = l;
  }
  return a;
}
var ez = 20, tz = ["top", "right", "bottom", "left", "width", "height", "size", "weight"], nz = typeof MutationObserver < "u", rz = function() {
  function e() {
    this.connected_ = !1, this.mutationEventsAdded_ = !1, this.mutationsObserver_ = null, this.observers_ = [], this.onTransitionEnd_ = this.onTransitionEnd_.bind(this), this.refresh = ZD(this.refresh.bind(this), ez);
  }
  return e.prototype.addObserver = function(t) {
    ~this.observers_.indexOf(t) || this.observers_.push(t), this.connected_ || this.connect_();
  }, e.prototype.removeObserver = function(t) {
    var n = this.observers_, r = n.indexOf(t);
    ~r && n.splice(r, 1), !n.length && this.connected_ && this.disconnect_();
  }, e.prototype.refresh = function() {
    var t = this.updateObservers_();
    t && this.refresh();
  }, e.prototype.updateObservers_ = function() {
    var t = this.observers_.filter(function(n) {
      return n.gatherActive(), n.hasActive();
    });
    return t.forEach(function(n) {
      return n.broadcastActive();
    }), t.length > 0;
  }, e.prototype.connect_ = function() {
    !hp || this.connected_ || (document.addEventListener("transitionend", this.onTransitionEnd_), window.addEventListener("resize", this.refresh), nz ? (this.mutationsObserver_ = new MutationObserver(this.refresh), this.mutationsObserver_.observe(document, {
      attributes: !0,
      childList: !0,
      characterData: !0,
      subtree: !0
    })) : (document.addEventListener("DOMSubtreeModified", this.refresh), this.mutationEventsAdded_ = !0), this.connected_ = !0);
  }, e.prototype.disconnect_ = function() {
    !hp || !this.connected_ || (document.removeEventListener("transitionend", this.onTransitionEnd_), window.removeEventListener("resize", this.refresh), this.mutationsObserver_ && this.mutationsObserver_.disconnect(), this.mutationEventsAdded_ && document.removeEventListener("DOMSubtreeModified", this.refresh), this.mutationsObserver_ = null, this.mutationEventsAdded_ = !1, this.connected_ = !1);
  }, e.prototype.onTransitionEnd_ = function(t) {
    var n = t.propertyName, r = n === void 0 ? "" : n, o = tz.some(function(i) {
      return !!~r.indexOf(i);
    });
    o && this.refresh();
  }, e.getInstance = function() {
    return this.instance_ || (this.instance_ = new e()), this.instance_;
  }, e.instance_ = null, e;
}(), uS = function(e, t) {
  for (var n = 0, r = Object.keys(t); n < r.length; n++) {
    var o = r[n];
    Object.defineProperty(e, o, {
      value: t[o],
      enumerable: !1,
      writable: !1,
      configurable: !0
    });
  }
  return e;
}, Ti = function(e) {
  var t = e && e.ownerDocument && e.ownerDocument.defaultView;
  return t || Ec;
}, dS = Iu(0, 0, 0, 0);
function Rc(e) {
  return parseFloat(e) || 0;
}
function ry(e) {
  for (var t = [], n = 1; n < arguments.length; n++)
    t[n - 1] = arguments[n];
  return t.reduce(function(r, o) {
    var i = e["border-" + o + "-width"];
    return r + Rc(i);
  }, 0);
}
function oz(e) {
  for (var t = ["top", "right", "bottom", "left"], n = {}, r = 0, o = t; r < o.length; r++) {
    var i = o[r], s = e["padding-" + i];
    n[i] = Rc(s);
  }
  return n;
}
function iz(e) {
  var t = e.getBBox();
  return Iu(0, 0, t.width, t.height);
}
function sz(e) {
  var t = e.clientWidth, n = e.clientHeight;
  if (!t && !n)
    return dS;
  var r = Ti(e).getComputedStyle(e), o = oz(r), i = o.left + o.right, s = o.top + o.bottom, a = Rc(r.width), l = Rc(r.height);
  if (r.boxSizing === "border-box" && (Math.round(a + i) !== t && (a -= ry(r, "left", "right") + i), Math.round(l + s) !== n && (l -= ry(r, "top", "bottom") + s)), !lz(e)) {
    var c = Math.round(a + i) - t, u = Math.round(l + s) - n;
    Math.abs(c) !== 1 && (a -= c), Math.abs(u) !== 1 && (l -= u);
  }
  return Iu(o.left, o.top, a, l);
}
var az = function() {
  return typeof SVGGraphicsElement < "u" ? function(e) {
    return e instanceof Ti(e).SVGGraphicsElement;
  } : function(e) {
    return e instanceof Ti(e).SVGElement && typeof e.getBBox == "function";
  };
}();
function lz(e) {
  return e === Ti(e).document.documentElement;
}
function cz(e) {
  return hp ? az(e) ? iz(e) : sz(e) : dS;
}
function uz(e) {
  var t = e.x, n = e.y, r = e.width, o = e.height, i = typeof DOMRectReadOnly < "u" ? DOMRectReadOnly : Object, s = Object.create(i.prototype);
  return uS(s, {
    x: t,
    y: n,
    width: r,
    height: o,
    top: n,
    right: t + r,
    bottom: o + n,
    left: t
  }), s;
}
function Iu(e, t, n, r) {
  return { x: e, y: t, width: n, height: r };
}
var dz = function() {
  function e(t) {
    this.broadcastWidth = 0, this.broadcastHeight = 0, this.contentRect_ = Iu(0, 0, 0, 0), this.target = t;
  }
  return e.prototype.isActive = function() {
    var t = cz(this.target);
    return this.contentRect_ = t, t.width !== this.broadcastWidth || t.height !== this.broadcastHeight;
  }, e.prototype.broadcastRect = function() {
    var t = this.contentRect_;
    return this.broadcastWidth = t.width, this.broadcastHeight = t.height, t;
  }, e;
}(), fz = function() {
  function e(t, n) {
    var r = uz(n);
    uS(this, { target: t, contentRect: r });
  }
  return e;
}(), pz = function() {
  function e(t, n, r) {
    if (this.activeObservations_ = [], this.observations_ = new cS(), typeof t != "function")
      throw new TypeError("The callback provided as parameter 1 is not a function.");
    this.callback_ = t, this.controller_ = n, this.callbackCtx_ = r;
  }
  return e.prototype.observe = function(t) {
    if (!arguments.length)
      throw new TypeError("1 argument required, but only 0 present.");
    if (!(typeof Element > "u" || !(Element instanceof Object))) {
      if (!(t instanceof Ti(t).Element))
        throw new TypeError('parameter 1 is not of type "Element".');
      var n = this.observations_;
      n.has(t) || (n.set(t, new dz(t)), this.controller_.addObserver(this), this.controller_.refresh());
    }
  }, e.prototype.unobserve = function(t) {
    if (!arguments.length)
      throw new TypeError("1 argument required, but only 0 present.");
    if (!(typeof Element > "u" || !(Element instanceof Object))) {
      if (!(t instanceof Ti(t).Element))
        throw new TypeError('parameter 1 is not of type "Element".');
      var n = this.observations_;
      !n.has(t) || (n.delete(t), n.size || this.controller_.removeObserver(this));
    }
  }, e.prototype.disconnect = function() {
    this.clearActive(), this.observations_.clear(), this.controller_.removeObserver(this);
  }, e.prototype.gatherActive = function() {
    var t = this;
    this.clearActive(), this.observations_.forEach(function(n) {
      n.isActive() && t.activeObservations_.push(n);
    });
  }, e.prototype.broadcastActive = function() {
    if (!!this.hasActive()) {
      var t = this.callbackCtx_, n = this.activeObservations_.map(function(r) {
        return new fz(r.target, r.broadcastRect());
      });
      this.callback_.call(t, n, t), this.clearActive();
    }
  }, e.prototype.clearActive = function() {
    this.activeObservations_.splice(0);
  }, e.prototype.hasActive = function() {
    return this.activeObservations_.length > 0;
  }, e;
}(), fS = typeof WeakMap < "u" ? /* @__PURE__ */ new WeakMap() : new cS(), pS = function() {
  function e(t) {
    if (!(this instanceof e))
      throw new TypeError("Cannot call a class as a function.");
    if (!arguments.length)
      throw new TypeError("1 argument required, but only 0 present.");
    var n = rz.getInstance(), r = new pz(t, n, this);
    fS.set(this, r);
  }
  return e;
}();
[
  "observe",
  "unobserve",
  "disconnect"
].forEach(function(e) {
  pS.prototype[e] = function() {
    var t;
    return (t = fS.get(this))[e].apply(t, arguments);
  };
});
var hS = function() {
  return typeof Ec.ResizeObserver < "u" ? Ec.ResizeObserver : pS;
}(), Ls = {
  Linear: {
    None: function(e) {
      return e;
    }
  },
  Quadratic: {
    In: function(e) {
      return e * e;
    },
    Out: function(e) {
      return e * (2 - e);
    },
    InOut: function(e) {
      return (e *= 2) < 1 ? 0.5 * e * e : -0.5 * (--e * (e - 2) - 1);
    }
  },
  Cubic: {
    In: function(e) {
      return e * e * e;
    },
    Out: function(e) {
      return --e * e * e + 1;
    },
    InOut: function(e) {
      return (e *= 2) < 1 ? 0.5 * e * e * e : 0.5 * ((e -= 2) * e * e + 2);
    }
  },
  Quartic: {
    In: function(e) {
      return e * e * e * e;
    },
    Out: function(e) {
      return 1 - --e * e * e * e;
    },
    InOut: function(e) {
      return (e *= 2) < 1 ? 0.5 * e * e * e * e : -0.5 * ((e -= 2) * e * e * e - 2);
    }
  },
  Quintic: {
    In: function(e) {
      return e * e * e * e * e;
    },
    Out: function(e) {
      return --e * e * e * e * e + 1;
    },
    InOut: function(e) {
      return (e *= 2) < 1 ? 0.5 * e * e * e * e * e : 0.5 * ((e -= 2) * e * e * e * e + 2);
    }
  },
  Sinusoidal: {
    In: function(e) {
      return 1 - Math.cos(e * Math.PI / 2);
    },
    Out: function(e) {
      return Math.sin(e * Math.PI / 2);
    },
    InOut: function(e) {
      return 0.5 * (1 - Math.cos(Math.PI * e));
    }
  },
  Exponential: {
    In: function(e) {
      return e === 0 ? 0 : Math.pow(1024, e - 1);
    },
    Out: function(e) {
      return e === 1 ? 1 : 1 - Math.pow(2, -10 * e);
    },
    InOut: function(e) {
      return e === 0 ? 0 : e === 1 ? 1 : (e *= 2) < 1 ? 0.5 * Math.pow(1024, e - 1) : 0.5 * (-Math.pow(2, -10 * (e - 1)) + 2);
    }
  },
  Circular: {
    In: function(e) {
      return 1 - Math.sqrt(1 - e * e);
    },
    Out: function(e) {
      return Math.sqrt(1 - --e * e);
    },
    InOut: function(e) {
      return (e *= 2) < 1 ? -0.5 * (Math.sqrt(1 - e * e) - 1) : 0.5 * (Math.sqrt(1 - (e -= 2) * e) + 1);
    }
  },
  Elastic: {
    In: function(e) {
      return e === 0 ? 0 : e === 1 ? 1 : -Math.pow(2, 10 * (e - 1)) * Math.sin((e - 1.1) * 5 * Math.PI);
    },
    Out: function(e) {
      return e === 0 ? 0 : e === 1 ? 1 : Math.pow(2, -10 * e) * Math.sin((e - 0.1) * 5 * Math.PI) + 1;
    },
    InOut: function(e) {
      return e === 0 ? 0 : e === 1 ? 1 : (e *= 2, e < 1 ? -0.5 * Math.pow(2, 10 * (e - 1)) * Math.sin((e - 1.1) * 5 * Math.PI) : 0.5 * Math.pow(2, -10 * (e - 1)) * Math.sin((e - 1.1) * 5 * Math.PI) + 1);
    }
  },
  Back: {
    In: function(e) {
      var t = 1.70158;
      return e * e * ((t + 1) * e - t);
    },
    Out: function(e) {
      var t = 1.70158;
      return --e * e * ((t + 1) * e + t) + 1;
    },
    InOut: function(e) {
      var t = 2.5949095;
      return (e *= 2) < 1 ? 0.5 * (e * e * ((t + 1) * e - t)) : 0.5 * ((e -= 2) * e * ((t + 1) * e + t) + 2);
    }
  },
  Bounce: {
    In: function(e) {
      return 1 - Ls.Bounce.Out(1 - e);
    },
    Out: function(e) {
      return e < 1 / 2.75 ? 7.5625 * e * e : e < 2 / 2.75 ? 7.5625 * (e -= 1.5 / 2.75) * e + 0.75 : e < 2.5 / 2.75 ? 7.5625 * (e -= 2.25 / 2.75) * e + 0.9375 : 7.5625 * (e -= 2.625 / 2.75) * e + 0.984375;
    },
    InOut: function(e) {
      return e < 0.5 ? Ls.Bounce.In(e * 2) * 0.5 : Ls.Bounce.Out(e * 2 - 1) * 0.5 + 0.5;
    }
  }
}, ys;
typeof self > "u" && typeof process < "u" && process.hrtime ? ys = function() {
  var e = process.hrtime();
  return e[0] * 1e3 + e[1] / 1e6;
} : typeof self < "u" && self.performance !== void 0 && self.performance.now !== void 0 ? ys = self.performance.now.bind(self.performance) : Date.now !== void 0 ? ys = Date.now : ys = function() {
  return new Date().getTime();
};
var co = ys, mS = function() {
  function e() {
    this._tweens = {}, this._tweensAddedDuringUpdate = {};
  }
  return e.prototype.getAll = function() {
    var t = this;
    return Object.keys(this._tweens).map(function(n) {
      return t._tweens[n];
    });
  }, e.prototype.removeAll = function() {
    this._tweens = {};
  }, e.prototype.add = function(t) {
    this._tweens[t.getId()] = t, this._tweensAddedDuringUpdate[t.getId()] = t;
  }, e.prototype.remove = function(t) {
    delete this._tweens[t.getId()], delete this._tweensAddedDuringUpdate[t.getId()];
  }, e.prototype.update = function(t, n) {
    t === void 0 && (t = co()), n === void 0 && (n = !1);
    var r = Object.keys(this._tweens);
    if (r.length === 0)
      return !1;
    for (; r.length > 0; ) {
      this._tweensAddedDuringUpdate = {};
      for (var o = 0; o < r.length; o++) {
        var i = this._tweens[r[o]], s = !n;
        i && i.update(t, s) === !1 && !n && delete this._tweens[r[o]];
      }
      r = Object.keys(this._tweensAddedDuringUpdate);
    }
    return !0;
  }, e;
}(), ni = {
  Linear: function(e, t) {
    var n = e.length - 1, r = n * t, o = Math.floor(r), i = ni.Utils.Linear;
    return t < 0 ? i(e[0], e[1], r) : t > 1 ? i(e[n], e[n - 1], n - r) : i(e[o], e[o + 1 > n ? n : o + 1], r - o);
  },
  Bezier: function(e, t) {
    for (var n = 0, r = e.length - 1, o = Math.pow, i = ni.Utils.Bernstein, s = 0; s <= r; s++)
      n += o(1 - t, r - s) * o(t, s) * e[s] * i(r, s);
    return n;
  },
  CatmullRom: function(e, t) {
    var n = e.length - 1, r = n * t, o = Math.floor(r), i = ni.Utils.CatmullRom;
    return e[0] === e[n] ? (t < 0 && (o = Math.floor(r = n * (1 + t))), i(e[(o - 1 + n) % n], e[o], e[(o + 1) % n], e[(o + 2) % n], r - o)) : t < 0 ? e[0] - (i(e[0], e[0], e[1], e[1], -r) - e[0]) : t > 1 ? e[n] - (i(e[n], e[n], e[n - 1], e[n - 1], r - n) - e[n]) : i(e[o ? o - 1 : 0], e[o], e[n < o + 1 ? n : o + 1], e[n < o + 2 ? n : o + 2], r - o);
  },
  Utils: {
    Linear: function(e, t, n) {
      return (t - e) * n + e;
    },
    Bernstein: function(e, t) {
      var n = ni.Utils.Factorial;
      return n(e) / n(t) / n(e - t);
    },
    Factorial: function() {
      var e = [1];
      return function(t) {
        var n = 1;
        if (e[t])
          return e[t];
        for (var r = t; r > 1; r--)
          n *= r;
        return e[t] = n, n;
      };
    }(),
    CatmullRom: function(e, t, n, r, o) {
      var i = (n - e) * 0.5, s = (r - t) * 0.5, a = o * o, l = o * a;
      return (2 * t - 2 * n + i + s) * l + (-3 * t + 3 * n - 2 * i - s) * a + i * o + t;
    }
  }
}, Tm = function() {
  function e() {
  }
  return e.nextId = function() {
    return e._nextId++;
  }, e._nextId = 0, e;
}(), gS = new mS(), hz = function() {
  function e(t, n) {
    n === void 0 && (n = gS), this._object = t, this._group = n, this._isPaused = !1, this._pauseStart = 0, this._valuesStart = {}, this._valuesEnd = {}, this._valuesStartRepeat = {}, this._duration = 1e3, this._initialRepeat = 0, this._repeat = 0, this._yoyo = !1, this._isPlaying = !1, this._reversed = !1, this._delayTime = 0, this._startTime = 0, this._easingFunction = Ls.Linear.None, this._interpolationFunction = ni.Linear, this._chainedTweens = [], this._onStartCallbackFired = !1, this._id = Tm.nextId(), this._isChainStopped = !1, this._goToEnd = !1;
  }
  return e.prototype.getId = function() {
    return this._id;
  }, e.prototype.isPlaying = function() {
    return this._isPlaying;
  }, e.prototype.isPaused = function() {
    return this._isPaused;
  }, e.prototype.to = function(t, n) {
    return this._valuesEnd = Object.create(t), n !== void 0 && (this._duration = n), this;
  }, e.prototype.duration = function(t) {
    return this._duration = t, this;
  }, e.prototype.start = function(t) {
    if (this._isPlaying)
      return this;
    if (this._group && this._group.add(this), this._repeat = this._initialRepeat, this._reversed) {
      this._reversed = !1;
      for (var n in this._valuesStartRepeat)
        this._swapEndStartRepeatValues(n), this._valuesStart[n] = this._valuesStartRepeat[n];
    }
    return this._isPlaying = !0, this._isPaused = !1, this._onStartCallbackFired = !1, this._isChainStopped = !1, this._startTime = t !== void 0 ? typeof t == "string" ? co() + parseFloat(t) : t : co(), this._startTime += this._delayTime, this._setupProperties(this._object, this._valuesStart, this._valuesEnd, this._valuesStartRepeat), this;
  }, e.prototype._setupProperties = function(t, n, r, o) {
    for (var i in r) {
      var s = t[i], a = Array.isArray(s), l = a ? "array" : typeof s, c = !a && Array.isArray(r[i]);
      if (!(l === "undefined" || l === "function")) {
        if (c) {
          var u = r[i];
          if (u.length === 0)
            continue;
          u = u.map(this._handleRelativeValue.bind(this, s)), r[i] = [s].concat(u);
        }
        if ((l === "object" || a) && s && !c) {
          n[i] = a ? [] : {};
          for (var f in s)
            n[i][f] = s[f];
          o[i] = a ? [] : {}, this._setupProperties(s, n[i], r[i], o[i]);
        } else
          typeof n[i] > "u" && (n[i] = s), a || (n[i] *= 1), c ? o[i] = r[i].slice().reverse() : o[i] = n[i] || 0;
      }
    }
  }, e.prototype.stop = function() {
    return this._isChainStopped || (this._isChainStopped = !0, this.stopChainedTweens()), this._isPlaying ? (this._group && this._group.remove(this), this._isPlaying = !1, this._isPaused = !1, this._onStopCallback && this._onStopCallback(this._object), this) : this;
  }, e.prototype.end = function() {
    return this._goToEnd = !0, this.update(1 / 0), this;
  }, e.prototype.pause = function(t) {
    return t === void 0 && (t = co()), this._isPaused || !this._isPlaying ? this : (this._isPaused = !0, this._pauseStart = t, this._group && this._group.remove(this), this);
  }, e.prototype.resume = function(t) {
    return t === void 0 && (t = co()), !this._isPaused || !this._isPlaying ? this : (this._isPaused = !1, this._startTime += t - this._pauseStart, this._pauseStart = 0, this._group && this._group.add(this), this);
  }, e.prototype.stopChainedTweens = function() {
    for (var t = 0, n = this._chainedTweens.length; t < n; t++)
      this._chainedTweens[t].stop();
    return this;
  }, e.prototype.group = function(t) {
    return this._group = t, this;
  }, e.prototype.delay = function(t) {
    return this._delayTime = t, this;
  }, e.prototype.repeat = function(t) {
    return this._initialRepeat = t, this._repeat = t, this;
  }, e.prototype.repeatDelay = function(t) {
    return this._repeatDelayTime = t, this;
  }, e.prototype.yoyo = function(t) {
    return this._yoyo = t, this;
  }, e.prototype.easing = function(t) {
    return this._easingFunction = t, this;
  }, e.prototype.interpolation = function(t) {
    return this._interpolationFunction = t, this;
  }, e.prototype.chain = function() {
    for (var t = [], n = 0; n < arguments.length; n++)
      t[n] = arguments[n];
    return this._chainedTweens = t, this;
  }, e.prototype.onStart = function(t) {
    return this._onStartCallback = t, this;
  }, e.prototype.onUpdate = function(t) {
    return this._onUpdateCallback = t, this;
  }, e.prototype.onRepeat = function(t) {
    return this._onRepeatCallback = t, this;
  }, e.prototype.onComplete = function(t) {
    return this._onCompleteCallback = t, this;
  }, e.prototype.onStop = function(t) {
    return this._onStopCallback = t, this;
  }, e.prototype.update = function(t, n) {
    if (t === void 0 && (t = co()), n === void 0 && (n = !0), this._isPaused)
      return !0;
    var r, o, i = this._startTime + this._duration;
    if (!this._goToEnd && !this._isPlaying) {
      if (t > i)
        return !1;
      n && this.start(t);
    }
    if (this._goToEnd = !1, t < this._startTime)
      return !0;
    this._onStartCallbackFired === !1 && (this._onStartCallback && this._onStartCallback(this._object), this._onStartCallbackFired = !0), o = (t - this._startTime) / this._duration, o = this._duration === 0 || o > 1 ? 1 : o;
    var s = this._easingFunction(o);
    if (this._updateProperties(this._object, this._valuesStart, this._valuesEnd, s), this._onUpdateCallback && this._onUpdateCallback(this._object, o), o === 1)
      if (this._repeat > 0) {
        isFinite(this._repeat) && this._repeat--;
        for (r in this._valuesStartRepeat)
          !this._yoyo && typeof this._valuesEnd[r] == "string" && (this._valuesStartRepeat[r] = this._valuesStartRepeat[r] + parseFloat(this._valuesEnd[r])), this._yoyo && this._swapEndStartRepeatValues(r), this._valuesStart[r] = this._valuesStartRepeat[r];
        return this._yoyo && (this._reversed = !this._reversed), this._repeatDelayTime !== void 0 ? this._startTime = t + this._repeatDelayTime : this._startTime = t + this._delayTime, this._onRepeatCallback && this._onRepeatCallback(this._object), !0;
      } else {
        this._onCompleteCallback && this._onCompleteCallback(this._object);
        for (var a = 0, l = this._chainedTweens.length; a < l; a++)
          this._chainedTweens[a].start(this._startTime + this._duration);
        return this._isPlaying = !1, !1;
      }
    return !0;
  }, e.prototype._updateProperties = function(t, n, r, o) {
    for (var i in r)
      if (n[i] !== void 0) {
        var s = n[i] || 0, a = r[i], l = Array.isArray(t[i]), c = Array.isArray(a), u = !l && c;
        u ? t[i] = this._interpolationFunction(a, o) : typeof a == "object" && a ? this._updateProperties(t[i], s, a, o) : (a = this._handleRelativeValue(s, a), typeof a == "number" && (t[i] = s + (a - s) * o));
      }
  }, e.prototype._handleRelativeValue = function(t, n) {
    return typeof n != "string" ? n : n.charAt(0) === "+" || n.charAt(0) === "-" ? t + parseFloat(n) : parseFloat(n);
  }, e.prototype._swapEndStartRepeatValues = function(t) {
    var n = this._valuesStartRepeat[t], r = this._valuesEnd[t];
    typeof r == "string" ? this._valuesStartRepeat[t] = this._valuesStartRepeat[t] + parseFloat(r) : this._valuesStartRepeat[t] = this._valuesEnd[t], this._valuesEnd[t] = n;
  }, e;
}(), mz = "18.6.4", gz = Tm.nextId, Vn = gS, vz = Vn.getAll.bind(Vn), yz = Vn.removeAll.bind(Vn), bz = Vn.add.bind(Vn), xz = Vn.remove.bind(Vn), wz = Vn.update.bind(Vn), xn = {
  Easing: Ls,
  Group: mS,
  Interpolation: ni,
  now: co,
  Sequence: Tm,
  nextId: gz,
  Tween: hz,
  VERSION: mz,
  getAll: vz,
  removeAll: yz,
  add: bz,
  remove: xz,
  update: wz
};
function ya() {
  return ya = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = arguments[t];
      for (var r in n)
        Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
    }
    return e;
  }, ya.apply(this, arguments);
}
var vS = function(t, n) {
  return n && n < Pe.Children.count(t) ? n : 0;
}, Sz = function(t, n) {
  if (typeof window < "u" && Array.isArray(n))
    return n.find(function(r) {
      return r.breakpoint <= t;
    });
}, oy = {
  linear: xn.Easing.Linear.None,
  ease: xn.Easing.Quadratic.InOut,
  "ease-in": xn.Easing.Quadratic.In,
  "ease-out": xn.Easing.Quadratic.Out,
  cubic: xn.Easing.Cubic.InOut,
  "cubic-in": xn.Easing.Cubic.In,
  "cubic-out": xn.Easing.Cubic.Out
}, yS = function(t) {
  return t ? oy[t] : oy.linear;
}, bS = function(t, n, r) {
  var o = t.prevArrow, i = t.infinite, s = n <= 0 && !i, a = {
    "data-type": "prev",
    "aria-label": "Previous Slide",
    disabled: s,
    onClick: r
  };
  if (o)
    return /* @__PURE__ */ Pe.cloneElement(o, ya({
      className: (o.props.className || "") + " nav " + (s ? "disabled" : "")
    }, a));
  var l = "nav default-nav " + (s ? "disabled" : "");
  return /* @__PURE__ */ S("button", {
    ...Object.assign({
      type: "button",
      className: l
    }, a),
    children: /* @__PURE__ */ S("svg", {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      children: /* @__PURE__ */ S("path", {
        d: "M16.67 0l2.83 2.829-9.339 9.175 9.339 9.167-2.83 2.829-12.17-11.996z"
      })
    })
  });
}, xS = function(t, n, r) {
  var o = t.nextArrow, i = t.infinite, s = t.children, a = 1;
  "slidesToScroll" in t && (a = t.slidesToScroll || 1);
  var l = n >= Pe.Children.count(s) - a && !i, c = {
    "data-type": "next",
    "aria-label": "Next Slide",
    disabled: l,
    onClick: r
  };
  if (o)
    return /* @__PURE__ */ Pe.cloneElement(o, ya({
      className: (o.props.className || "") + " nav " + (l ? "disabled" : "")
    }, c));
  var u = "nav default-nav " + (l ? "disabled" : "");
  return /* @__PURE__ */ S("button", {
    ...Object.assign({
      type: "button",
      className: u
    }, c),
    children: /* @__PURE__ */ S("svg", {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      children: /* @__PURE__ */ S("path", {
        d: "M5 3l3.057-3 11.943 12-11.943 12-3.057-3 9-9z"
      })
    })
  });
}, Cz = function(t, n, r) {
  return /* @__PURE__ */ S("li", {
    children: /* @__PURE__ */ S("button", {
      ...Object.assign({
        type: "button",
        className: "each-slideshow-indicator " + (t ? "active" : "")
      }, r)
    })
  }, n);
}, kz = function(t, n, r, o) {
  return /* @__PURE__ */ Pe.cloneElement(o, ya({
    className: o.props.className + " " + (t ? "active" : ""),
    key: n
  }, r));
}, wS = function(t, n, r, o) {
  var i = t.children, s = t.indicators, a = 1;
  o ? a = o == null ? void 0 : o.settings.slidesToScroll : "slidesToScroll" in t && (a = t.slidesToScroll || 1);
  var l = Math.ceil(Pe.Children.count(i) / a);
  return /* @__PURE__ */ S("ul", {
    className: "indicators",
    children: Array.from({
      length: l
    }, function(c, u) {
      var f = {
        "data-key": u,
        "aria-label": "Go to slide " + (u + 1),
        onClick: r
      }, h = Math.floor((n + a - 1) / a) === u;
      return typeof s == "function" ? kz(h, u, f, s(u)) : Cz(h, u, f);
    })
  });
}, Au = {
  duration: 5e3,
  transitionDuration: 1e3,
  defaultIndex: 0,
  infinite: !0,
  autoplay: !0,
  indicators: !1,
  arrows: !0,
  pauseOnHover: !0,
  easing: "linear",
  canSwipe: !0,
  cssClass: "",
  responsive: []
}, Pm = /* @__PURE__ */ Pe.forwardRef(function(e, t) {
  var n = x.exports.useState(vS(e.children, e.defaultIndex)), r = n[0], o = n[1], i = x.exports.useRef(null), s = x.exports.useRef(null), a = x.exports.useRef(new xn.Group()), l = x.exports.useRef(), c = x.exports.useRef(), u = x.exports.useMemo(function() {
    return Pe.Children.count(e.children);
  }, [e.children]), f = x.exports.useCallback(function() {
    if (s.current && i.current) {
      var R = i.current.clientWidth, T = R * u;
      s.current.style.width = T + "px";
      for (var O = 0; O < s.current.children.length; O++) {
        var P = s.current.children[O];
        P && (P.style.width = R + "px", P.style.left = O * -R + "px", P.style.display = "block");
      }
    }
  }, [i, s, u]), h = x.exports.useCallback(function() {
    i.current && (c.current = new hS(function(R) {
      !R || f();
    }), c.current.observe(i.current));
  }, [i, f]), y = x.exports.useCallback(function() {
    var R = e.autoplay, T = e.children, O = e.duration, P = e.infinite;
    R && Pe.Children.count(T) > 1 && (P || r < Pe.Children.count(T) - 1) && (l.current = setTimeout(g, O));
  }, [e, r]);
  x.exports.useEffect(function() {
    return h(), function() {
      a.current.removeAll(), clearTimeout(l.current), d();
    };
  }, [h, a]), x.exports.useEffect(function() {
    clearTimeout(l.current), y();
  }, [r, e.autoplay, y]), x.exports.useEffect(function() {
    f();
  }, [u, f]), x.exports.useImperativeHandle(t, function() {
    return {
      goNext: function() {
        g();
      },
      goBack: function() {
        p();
      },
      goTo: function(T) {
        C(T);
      }
    };
  });
  var d = function() {
    c.current && i.current && c.current.unobserve(i.current);
  }, m = function() {
    e.pauseOnHover && clearTimeout(l.current);
  }, w = function() {
    var T = e.pauseOnHover, O = e.autoplay, P = e.duration;
    T && O && (l.current = setTimeout(function() {
      return g();
    }, P));
  }, g = function() {
    var T = e.children, O = e.infinite;
    !O && r === Pe.Children.count(T) - 1 || b((r + 1) % Pe.Children.count(T));
  }, p = function() {
    var T = e.children, O = e.infinite;
    !O && r === 0 || b(r === 0 ? Pe.Children.count(T) - 1 : r - 1);
  }, v = function(T) {
    var O = T.currentTarget;
    O.dataset.type === "prev" ? p() : g();
  }, b = function(T) {
    var O = a.current.getAll();
    if (!O.length) {
      var P;
      (P = s.current) != null && P.children[T] || (T = 0), clearTimeout(l.current);
      var $ = {
        opacity: 0,
        scale: 1
      }, B = function I() {
        requestAnimationFrame(I), a.current.update();
      };
      B();
      var D = new xn.Tween($, a.current).to({
        opacity: 1,
        scale: e.scale
      }, e.transitionDuration).onUpdate(function(I) {
        !s.current || (s.current.children[T].style.opacity = I.opacity, s.current.children[r].style.opacity = 1 - I.opacity, s.current.children[r].style.transform = "scale(" + I.scale + ")");
      }).start();
      D.easing(yS(e.easing)), D.onComplete(function() {
        s.current && (o(T), s.current.children[r].style.transform = "scale(1)"), typeof e.onChange == "function" && e.onChange(r, T);
      });
    }
  }, C = function(T) {
    T !== r && b(T);
  }, E = function(T) {
    var O = T.currentTarget;
    !O.dataset.key || parseInt(O.dataset.key) !== r && C(parseInt(O.dataset.key));
  };
  return /* @__PURE__ */ G("div", {
    dir: "ltr",
    "aria-roledescription": "carousel",
    children: [/* @__PURE__ */ G("div", {
      className: "react-slideshow-container " + (e.cssClass || ""),
      onMouseEnter: m,
      onMouseOver: m,
      onMouseLeave: w,
      children: [e.arrows && bS(e, r, v), /* @__PURE__ */ S("div", {
        className: "react-slideshow-fadezoom-wrapper " + e.cssClass,
        ref: i,
        children: /* @__PURE__ */ S("div", {
          className: "react-slideshow-fadezoom-images-wrap",
          ref: s,
          children: (Pe.Children.map(e.children, function(R) {
            return R;
          }) || []).map(function(R, T) {
            return /* @__PURE__ */ S("div", {
              style: {
                opacity: T === r ? "1" : "0",
                zIndex: T === r ? "1" : "0"
              },
              "data-index": T,
              "aria-roledescription": "slide",
              "aria-hidden": T === r ? "false" : "true",
              children: R
            }, T);
          })
        })
      }), e.arrows && xS(e, r, v)]
    }), e.indicators && wS(e, r, E)]
  });
});
Pm.defaultProps = Au;
var Ez = /* @__PURE__ */ Pe.forwardRef(function(e, t) {
  return /* @__PURE__ */ S(Pm, {
    ...Object.assign({}, e, {
      scale: 1,
      ref: t
    })
  });
});
Ez.defaultProps = Au;
var SS = /* @__PURE__ */ Pe.forwardRef(function(e, t) {
  return /* @__PURE__ */ S(Pm, {
    ...Object.assign({}, e, {
      ref: t
    })
  });
});
SS.defaultProps = Au;
var CS = /* @__PURE__ */ Pe.forwardRef(function(e, t) {
  var n = x.exports.useState(vS(e.children, e.defaultIndex)), r = n[0], o = n[1], i = x.exports.useState(0), s = i[0], a = i[1], l = x.exports.useRef(null), c = x.exports.useRef(null), u = x.exports.useRef(new xn.Group()), f = x.exports.useMemo(function() {
    return Sz(s, e.responsive);
  }, [s, e.responsive]), h = x.exports.useMemo(function() {
    return f ? f.settings.slidesToScroll : e.slidesToScroll || 1;
  }, [f, e.slidesToScroll]), y = x.exports.useMemo(function() {
    return f ? f.settings.slidesToShow : e.slidesToShow || 1;
  }, [f, e.slidesToShow]), d = x.exports.useMemo(function() {
    return Pe.Children.count(e.children);
  }, [e.children]), m = x.exports.useMemo(function() {
    return s / y;
  }, [s, y]), w = x.exports.useRef(), g = x.exports.useRef(), p, v = !1, b = 0, C = x.exports.useCallback(function() {
    if (c.current) {
      var X = s * c.current.children.length;
      c.current.style.width = X + "px";
      for (var H = 0; H < c.current.children.length; H++) {
        var W = c.current.children[H];
        W && (W.style.width = m + "px", W.style.display = "block");
      }
    }
  }, [s, m]), E = x.exports.useCallback(function() {
    l.current && (g.current = new hS(function(X) {
      !X || F();
    }), g.current.observe(l.current));
  }, [l]), R = x.exports.useCallback(function() {
    var X = e.autoplay, H = e.infinite, W = e.duration;
    X && (H || r < d - 1) && (w.current = setTimeout($, W));
  }, [e, d, r]);
  x.exports.useEffect(function() {
    C();
  }, [s, C]), x.exports.useEffect(function() {
    return E(), function() {
      u.current.removeAll(), clearTimeout(w.current), T();
    };
  }, [l, E, u]), x.exports.useEffect(function() {
    clearTimeout(w.current), R();
  }, [r, s, e.autoplay, R]), x.exports.useImperativeHandle(t, function() {
    return {
      goNext: function() {
        $();
      },
      goBack: function() {
        B();
      },
      goTo: function(H) {
        I(H);
      }
    };
  });
  var T = function() {
    g && l.current && g.current.unobserve(l.current);
  }, O = function() {
    e.pauseOnHover && clearTimeout(w.current);
  }, P = function(H) {
    if (e.canSwipe && v) {
      var W;
      if (window.TouchEvent && H.nativeEvent instanceof TouchEvent ? W = H.nativeEvent.touches[0].pageX : H.nativeEvent instanceof MouseEvent && (W = H.nativeEvent.clientX), W && p) {
        var ce = m * (r + ae()), re = W - p;
        if (!e.infinite && r === d - h && re < 0 || !e.infinite && r === 0 && re > 0)
          return;
        b = re, ce -= b, c.current.style.transform = "translate(-" + ce + "px)";
      }
    }
  }, $ = function() {
    if (!(!e.infinite && r === d - h)) {
      var H = M(r + h);
      pe(H);
    }
  }, B = function() {
    if (!(!e.infinite && r === 0)) {
      var H = r - h;
      H % h && (H = Math.ceil(H / h) * h), pe(H);
    }
  }, D = function(H) {
    var W = H.currentTarget;
    if (!!W.dataset.key) {
      var ce = parseInt(W.dataset.key);
      I(ce * h);
    }
  }, I = function(H) {
    pe(M(H));
  }, M = function(H) {
    return H < d && H + h > d && (d - h) % h ? d - h : H;
  }, A = function() {
    v ? q() : e.pauseOnHover && e.autoplay && (w.current = setTimeout($, e.duration));
  }, j = function(H) {
    var W = H.currentTarget.dataset;
    W.type === "next" ? $() : B();
  }, _ = function() {
    return Pe.Children.toArray(e.children).slice(-y).map(function(H, W) {
      return /* @__PURE__ */ S("div", {
        "data-index": W - y,
        "aria-roledescription": "slide",
        "aria-hidden": "true",
        children: H
      }, W - y);
    });
  }, z = function() {
    if (!(!e.infinite && y === h))
      return Pe.Children.toArray(e.children).slice(0, y).map(function(H, W) {
        return /* @__PURE__ */ S("div", {
          "data-index": d + W,
          "aria-roledescription": "slide",
          "aria-hidden": "true",
          children: H
        }, d + W);
      });
  }, F = function() {
    l.current && a(l.current.clientWidth);
  }, Y = function(H) {
    e.canSwipe && (window.TouchEvent && H.nativeEvent instanceof TouchEvent ? p = H.nativeEvent.touches[0].pageX : H.nativeEvent instanceof MouseEvent && (p = H.nativeEvent.clientX), clearTimeout(w.current), v = !0);
  }, q = function() {
    e.canSwipe && (v = !1, Math.abs(b) / s > 0.2 ? b < 0 ? $() : B() : Math.abs(b) > 0 && pe(r, 300));
  }, pe = function(H, W) {
    var ce = W || e.transitionDuration, re = r, ie = u.current.getAll();
    if (!!l.current) {
      var de = l.current.clientWidth / y;
      if (!ie.length) {
        clearTimeout(w.current);
        var se = {
          margin: -de * (re + ae()) + b
        }, oe = new xn.Tween(se, u.current).to({
          margin: -de * (H + ae())
        }, ce).onUpdate(function(ge) {
          c.current && (c.current.style.transform = "translate(" + ge.margin + "px)");
        }).start();
        oe.easing(yS(e.easing));
        var ue = function ge() {
          requestAnimationFrame(ge), u.current.update();
        };
        ue(), oe.onComplete(function() {
          b = 0;
          var ge = H;
          ge < 0 ? ge = d - h : ge >= d && (ge = 0), typeof e.onChange == "function" && e.onChange(r, ge), o(ge);
        });
      }
    }
  }, ne = function(H) {
    return H < r + y && H >= r;
  }, ae = function() {
    return e.infinite ? y : 0;
  }, le = {
    transform: "translate(-" + (r + ae()) * m + "px)"
  };
  return /* @__PURE__ */ G("div", {
    dir: "ltr",
    "aria-roledescription": "carousel",
    children: [/* @__PURE__ */ G("div", {
      className: "react-slideshow-container",
      onMouseEnter: O,
      onMouseOver: O,
      onMouseLeave: A,
      onMouseDown: Y,
      onMouseUp: q,
      onMouseMove: P,
      onTouchStart: Y,
      onTouchEnd: q,
      onTouchCancel: q,
      onTouchMove: P,
      children: [e.arrows && bS(e, r, j), /* @__PURE__ */ S("div", {
        className: "react-slideshow-wrapper slide " + (e.cssClass || ""),
        ref: l,
        children: /* @__PURE__ */ G("div", {
          className: "images-wrap",
          style: le,
          ref: c,
          children: [e.infinite && _(), (Pe.Children.map(e.children, function(X) {
            return X;
          }) || []).map(function(X, H) {
            var W = ne(H);
            return /* @__PURE__ */ S("div", {
              "data-index": H,
              className: W ? "active" : "",
              "aria-roledescription": "slide",
              "aria-hidden": W ? "false" : "true",
              children: X
            }, H);
          }), z()]
        })
      }), e.arrows && xS(e, r, j)]
    }), e.indicators && wS(e, r, D, f)]
  });
});
CS.defaultProps = Au;
const Rz = ({
  galleryArray: e,
  handleButtonFunction: t,
  socket: n,
  updatemyMessages: r,
  visitorId: o
}) => {
  const i = {
    prevArrow: /* @__PURE__ */ S(Hn, {
      size: "small",
      color: "primary",
      sx: {
        ml: 0,
        bgcolor: "#dcdcdca8"
      },
      children: /* @__PURE__ */ S(ct, {
        icon: "material-symbols:navigate-before",
        color: "#000",
        fontSize: 28,
        fontWeight: "bold"
      })
    }),
    nextArrow: /* @__PURE__ */ S(Hn, {
      size: "small",
      color: "primary",
      sx: {
        mr: 1.5,
        bgcolor: "#dcdcdca8"
      },
      children: /* @__PURE__ */ S(ct, {
        icon: "material-symbols:navigate-next",
        color: "#000",
        fontSize: 28,
        fontWeight: "bold"
      })
    })
  }, s = {
    width: "100%",
    backgroundColor: "#fff",
    border: "0",
    color: "#696CFF",
    borderRadius: "0",
    borderTop: "1px solid #696CFF",
    textTransform: "capitalize",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.9rem",
    fontWeight: 500
  }, a = async (l, c) => {
    if (l.preventDefault(), c.type === "text") {
      const u = {
        value: c.value,
        type: "text",
        senderId: o,
        time: new Date().toISOString(),
        id: new Date().getTime()
      };
      await n.emit("events", {
        event: "chat-message-bot",
        data: {
          message: c.value
        }
      }), r(u);
    } else if (c.type === "goto") {
      const u = {
        value: c.title,
        type: "text",
        senderId: o,
        time: new Date().toISOString(),
        id: new Date().getTime()
      };
      await n.emit("events", {
        event: "chat-message-bot",
        data: {
          message: c.value,
          type: "goto"
        }
      }), r(u);
    }
  };
  return /* @__PURE__ */ S(Et, {
    children: e && (e == null ? void 0 : e.length) > 0 && /* @__PURE__ */ S("div", {
      style: {
        maxWidth: "100%",
        marginTop: "0.5rem"
      },
      children: /* @__PURE__ */ S(CS, {
        slidesToScroll: 1.5,
        slidesToShow: 1.5,
        autoplay: !0,
        ...i,
        children: e.map((l, c) => /* @__PURE__ */ S("div", {
          className: "each-slide-effect",
          children: /* @__PURE__ */ G("div", {
            style: {
              width: "90%",
              height: "auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              margin: "0.4rem",
              boxShadow: "0 0 5px grey",
              borderRadius: "0.5rem"
            },
            children: [/* @__PURE__ */ S("img", {
              src: l == null ? void 0 : l.image,
              style: {
                objectFit: "cover",
                width: "100%",
                height: 200,
                borderTopLeftRadius: "0.5rem",
                borderTopRightRadius: "0.5rem"
              }
            }), /* @__PURE__ */ S("h4", {
              style: {
                margin: "0.2rem 0.2rem",
                padding: "0",
                fontFamily: "Inter, sans-serif",
                textAlign: "center"
              },
              children: l == null ? void 0 : l.title
            }), /* @__PURE__ */ S("p", {
              style: {
                fontSize: "0.8rem",
                textAlign: "justify",
                margin: "0 1rem",
                marginBottom: "1rem",
                lineHeight: "18px",
                fontFamily: "Inter, sans-serif",
                overflow: "hidden"
              },
              children: l == null ? void 0 : l.description
            }), (l == null ? void 0 : l.buttons) && l.buttons.length > 0 && /* @__PURE__ */ S("div", {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                width: "100%"
              },
              children: l == null ? void 0 : l.buttons.map((u, f) => {
                if ((u == null ? void 0 : u.type) === "phone")
                  return /* @__PURE__ */ S("button", {
                    style: s,
                    children: /* @__PURE__ */ S("a", {
                      href: `tel:${u.value}`,
                      children: u.title
                    })
                  }, f);
                if ((u == null ? void 0 : u.type) === "goto")
                  return /* @__PURE__ */ S("button", {
                    style: s,
                    onClick: (h) => a(h, u),
                    children: u.title
                  }, f);
                if ((u == null ? void 0 : u.type) === "url")
                  return /* @__PURE__ */ S("button", {
                    style: s,
                    children: /* @__PURE__ */ S("a", {
                      href: u.value,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      children: u.title
                    })
                  }, f);
                if ((u == null ? void 0 : u.type) === "text")
                  return /* @__PURE__ */ S("button", {
                    style: s,
                    onClick: (h) => a(h, u.value),
                    children: u == null ? void 0 : u.title
                  }, f);
              })
            })]
          })
        }, c))
      })
    })
  });
};
function Tz({
  isSender: e,
  image: t
}) {
  return /* @__PURE__ */ S(qe, {
    sx: {
      borderRadius: 1,
      width: "85%",
      fontSize: "0.875rem",
      m: 1,
      ml: e ? "auto" : void 0
    },
    children: /* @__PURE__ */ S("img", {
      src: t,
      style: {
        objectFit: "cover",
        maxWidth: "100%",
        height: 200,
        boxShadow: "0 0 5px grey",
        borderRadius: 1
      }
    })
  });
}
function Pz({
  isSender: e,
  message: t,
  botStyles: n
}) {
  return /* @__PURE__ */ S(gt, {
    sx: {
      borderRadius: "12px 14px 10px 12px",
      boxShadow: 1,
      fontFamily: "'Mulish', sans-serif",
      width: e ? "fit-content" : "65%",
      fontSize: "1rem",
      fontWeight: "500",
      p: (r) => r.spacing(1, 1),
      ml: e ? "auto" : void 0,
      borderTopLeftRadius: e ? void 0 : 0,
      borderTopRightRadius: e ? 0 : void 0,
      color: e ? (n == null ? void 0 : n.textColor) || "common.white" : "text.primary",
      backgroundColor: e ? (n == null ? void 0 : n.primaryColor) || "primary.main" : "background.paper"
    },
    children: /* @__PURE__ */ S("div", {
      dangerouslySetInnerHTML: {
        __html: t
      }
    })
  });
}
function Oz({
  isSender: e,
  message: t,
  buttons: n,
  botStyles: r,
  socket: o,
  updatemyMessages: i,
  visitorId: s
}) {
  const a = async (c, u) => {
    if (c.preventDefault(), u.type === "text") {
      const f = {
        value: u.value,
        type: "text",
        senderId: s,
        time: new Date().toISOString(),
        id: new Date().getTime()
      };
      await o.emit("events", {
        event: "chat-message-bot",
        data: {
          message: u.value
        }
      }), i(f);
    } else if (u.type === "goto") {
      const f = {
        value: u.title,
        type: "text",
        senderId: s,
        time: new Date().toISOString(),
        id: new Date().getTime()
      };
      await o.emit("events", {
        event: "chat-message-bot",
        data: {
          message: u.value,
          type: "goto"
        }
      }), i(f);
    }
  }, l = {
    textTransform: "capitalize",
    color: e ? "default" : r == null ? void 0 : r.buttonTextColor,
    backgroundColor: e ? "default" : r == null ? void 0 : r.buttonColor,
    "&:hover": {
      backgroundColor: "blue",
      color: "#fff"
    },
    borderColor: r.buttonColor
  };
  return /* @__PURE__ */ G("div", {
    style: {
      marginTop: "0.3rem",
      borderRadius: "0.4rem",
      width: "fit-content",
      minWidth: "90%",
      maxWidth: "15rem",
      padding: "0.2rem",
      boxShadow: "0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)"
    },
    children: [t && /* @__PURE__ */ S(gt, {
      sx: {
        width: "fit-content",
        fontSize: "0.875rem",
        mt: 2,
        mb: 2,
        p: (c) => c.spacing(0, 1),
        borderTopLeftRadius: e ? void 0 : 0,
        borderTopRightRadius: e ? 0 : void 0,
        color: "#000",
        backgroundColor: e ? r.buttonColor : "background.paper",
        "&.hover:": {
          background: "text.primary",
          color: "#000"
        }
      },
      children: t
    }), /* @__PURE__ */ S(L4, {}), /* @__PURE__ */ S(Nt, {
      direction: "row",
      justifyContent: "center",
      flex: 1,
      gap: 0.4,
      marginTop: 1,
      flexWrap: "wrap",
      width: "100%",
      children: n && n.map((c, u) => /* @__PURE__ */ S(st, {
        onClick: (f) => a(f, c),
        sx: {
          m: 0,
          p: 0,
          borderRadius: "50%",
          textTransform: "capitalize"
        },
        children: /* @__PURE__ */ S(O5, {
          label: c.title,
          color: "primary",
          variant: "outlined",
          sx: {
            fontSize: "0.7rem",
            cursor: "pointer",
            ...l
          }
        })
      }, u))
    })]
  });
}
const kS = ({
  adsSlideArray: e,
  widgetToken: t
}) => {
  var o;
  const n = {
    prevArrow: /* @__PURE__ */ S(Hn, {
      size: "small",
      color: "primary",
      sx: {
        ml: 1,
        bgcolor: "#dcdcdca8"
      },
      children: /* @__PURE__ */ S(ct, {
        icon: "material-symbols:navigate-before",
        color: "#000",
        fontSize: 28,
        fontWeight: "bold"
      })
    }),
    nextArrow: /* @__PURE__ */ S(Hn, {
      size: "small",
      color: "primary",
      sx: {
        mr: 1,
        bgcolor: "#dcdcdca8"
      },
      children: /* @__PURE__ */ S(ct, {
        icon: "material-symbols:navigate-next",
        color: "#000",
        fontSize: 28,
        fontWeight: "bold"
      })
    })
  }, r = async (i) => {
    try {
      return console.log({
        data: i
      }), (await Zr.post(`${window.baseUrl}/api/widget/click`, {
        ...i.data
      }, {
        headers: {
          Authorization: `Bearer ${i.token}`
        }
      })).data;
    } catch (s) {
      console.log("error", s);
    }
  };
  return /* @__PURE__ */ S(Et, {
    children: (e == null ? void 0 : e.posters) && ((o = e == null ? void 0 : e.posters) == null ? void 0 : o.length) > 0 && /* @__PURE__ */ S("div", {
      style: {
        maxWidth: "100%",
        marginTop: "0.5rem"
      },
      children: /* @__PURE__ */ S(SS, {
        scale: 1.4,
        autoplay: !0,
        ...n,
        children: e == null ? void 0 : e.posters.map((i, s) => /* @__PURE__ */ S("div", {
          onClick: (a) => {
            window.open(i.link, "_blank"), r({
              data: {
                type: "click-on-ads",
                tag: (i == null ? void 0 : i.tag) || "Unknown",
                id: e == null ? void 0 : e.id
              },
              token: t
            });
          },
          className: "each-slide-effect",
          children: /* @__PURE__ */ S("div", {
            style: {
              backgroundImage: `url(${i.image})`,
              position: "relative",
              backgroundPosition: "center"
            },
            children: /* @__PURE__ */ S("a", {
              href: i.link,
              onClick: () => r({
                data: {
                  type: "click-on-ads",
                  tag: (i == null ? void 0 : i.tag) || "Unknown",
                  id: e == null ? void 0 : e.id
                },
                token: t
              }),
              style: {
                position: "absolute",
                bottom: "0",
                width: "100%",
                backgroundColor: "#ffffff26",
                textAlign: "center"
              },
              target: "_blank",
              children: "Visit Now"
            })
          })
        }, s))
      })
    })
  });
};
function ES({
  offersArray: e,
  widgetToken: t
}) {
  const n = async (r) => {
    try {
      return (await Zr.post(`${window.baseUrl}/api/widget/click`, {
        ...r.data
      }, {
        headers: {
          Authorization: `Bearer ${r.token}`
        }
      })).data;
    } catch (o) {
      console.log("error", o);
    }
  };
  return /* @__PURE__ */ S(Et, {
    children: (e == null ? void 0 : e.cards) && e.cards.length > 0 && /* @__PURE__ */ G("div", {
      children: [/* @__PURE__ */ S(gt, {
        variant: "button",
        display: "block",
        sx: {
          ml: 1,
          mt: 2,
          fontWeight: "bold",
          textAlign: "center",
          textTransform: "uppercase"
        },
        gutterBottom: !0,
        children: e == null ? void 0 : e.title
      }), e.cards && e.cards.map((r, o) => /* @__PURE__ */ S("div", {
        style: {
          maxHeight: 200,
          margin: "0.4rem  auto",
          maxWidth: "95%",
          padding: "0.2rem",
          boxShadow: "0 0 3px grey",
          borderRadius: "0.2rem",
          position: "relative"
        },
        children: /* @__PURE__ */ G(Nt, {
          width: "100%",
          direction: "row",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          children: [/* @__PURE__ */ S(kL, {
            component: "img",
            sx: {
              width: "30%",
              height: 120,
              m: 1,
              borderRadius: 1,
              objectFit: "cover"
            },
            image: r.image,
            alt: "offer image"
          }), /* @__PURE__ */ G(Nt, {
            direction: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            width: "70%",
            maxHeight: 130,
            children: [/* @__PURE__ */ G(gt, {
              sx: {
                m: 0.5
              },
              children: [r.title, " ", /* @__PURE__ */ S(ct, {
                icon: "mdi:new-box",
                fontSize: 21,
                color: "red"
              })]
            }), /* @__PURE__ */ S(gt, {
              sx: {
                height: 90,
                width: "95%",
                overflow: "hidden",
                lineHeight: "18px",
                textAlign: "justify",
                ml: 1,
                fontSize: 13
              },
              children: r.description
            }), /* @__PURE__ */ S("a", {
              onClick: (i) => n({
                data: {
                  type: "click-on-offer",
                  tag: (r == null ? void 0 : r.tag) || "Unknown",
                  id: e == null ? void 0 : e.id
                },
                token: t
              }),
              style: {
                marginLeft: "0.3rem"
              },
              href: r.link,
              target: "_blank",
              children: "click here to know more"
            })]
          })]
        })
      }, o))]
    })
  });
}
function $z({
  location: e
}) {
  return /* @__PURE__ */ S(Nt, {
    width: "100%",
    padding: "0.5rem 0",
    children: /* @__PURE__ */ G(Nt, {
      direction: "column",
      justifyContent: "flex-start",
      alignItems: "center",
      width: "95%",
      padding: "0.5rem",
      sx: {
        boxShadow: "0 0 3px grey",
        borderRadius: 1
      },
      children: [/* @__PURE__ */ S("iframe", {
        id: "map",
        src: `https://maps.google.com/maps?q=${e == null ? void 0 : e.latitude},${e == null ? void 0 : e.longitude}&z=16&output=embed`,
        width: "98%",
        height: "200",
        allowFullScreen: !0,
        title: "map"
      }), /* @__PURE__ */ S(gt, {
        variant: "button",
        display: "block",
        gutterBottom: !0,
        sx: {
          textAlign: "center",
          width: "94%",
          textTransform: "capitalize",
          backgroundColor: "#9f99f978",
          padding: "0.5rem",
          borderBottomRightRadius: "0.5rem",
          borderBottomLeftRadius: "0.5rem"
        },
        children: /* @__PURE__ */ S("a", {
          href: `https://maps.google.com/maps?q=${e == null ? void 0 : e.latitude},${e == null ? void 0 : e.longitude}&z=16`,
          target: "_blank",
          children: "Visit us"
        })
      })]
    })
  });
}
function _z({
  link: e,
  type: t
}) {
  return /* @__PURE__ */ S(qe, {
    sx: {
      mt: 1,
      maxWidth: "100%"
    },
    children: /* @__PURE__ */ S("video", {
      style: {
        maxWidth: "95%",
        height: "15rem",
        borderRadius: "0.5rem"
      },
      controls: !0,
      children: /* @__PURE__ */ S("source", {
        src: e,
        type: `video/${t}`
      })
    })
  });
}
var RS = { exports: {} };
(function(e, t) {
  (function(r, o) {
    e.exports = o(x.exports);
  })(rC, function(n) {
    return function(r) {
      var o = {};
      function i(s) {
        if (o[s])
          return o[s].exports;
        var a = o[s] = {
          i: s,
          l: !1,
          exports: {}
        };
        return r[s].call(a.exports, a, a.exports, i), a.l = !0, a.exports;
      }
      return i.m = r, i.c = o, i.d = function(s, a, l) {
        i.o(s, a) || Object.defineProperty(s, a, { enumerable: !0, get: l });
      }, i.r = function(s) {
        typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(s, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(s, "__esModule", { value: !0 });
      }, i.t = function(s, a) {
        if (a & 1 && (s = i(s)), a & 8 || a & 4 && typeof s == "object" && s && s.__esModule)
          return s;
        var l = /* @__PURE__ */ Object.create(null);
        if (i.r(l), Object.defineProperty(l, "default", { enumerable: !0, value: s }), a & 2 && typeof s != "string")
          for (var c in s)
            i.d(l, c, function(u) {
              return s[u];
            }.bind(null, c));
        return l;
      }, i.n = function(s) {
        var a = s && s.__esModule ? function() {
          return s.default;
        } : function() {
          return s;
        };
        return i.d(a, "a", a), a;
      }, i.o = function(s, a) {
        return Object.prototype.hasOwnProperty.call(s, a);
      }, i.p = "", i(i.s = "./src/react-webcam.tsx");
    }({
      "./src/react-webcam.tsx": function(r, o, i) {
        i.r(o);
        var s = i("react"), a = function() {
          var h = function(y, d) {
            return h = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(m, w) {
              m.__proto__ = w;
            } || function(m, w) {
              for (var g in w)
                w.hasOwnProperty(g) && (m[g] = w[g]);
            }, h(y, d);
          };
          return function(y, d) {
            h(y, d);
            function m() {
              this.constructor = y;
            }
            y.prototype = d === null ? Object.create(d) : (m.prototype = d.prototype, new m());
          };
        }(), l = function() {
          return l = Object.assign || function(h) {
            for (var y, d = 1, m = arguments.length; d < m; d++) {
              y = arguments[d];
              for (var w in y)
                Object.prototype.hasOwnProperty.call(y, w) && (h[w] = y[w]);
            }
            return h;
          }, l.apply(this, arguments);
        }, c = function(h, y) {
          var d = {};
          for (var m in h)
            Object.prototype.hasOwnProperty.call(h, m) && y.indexOf(m) < 0 && (d[m] = h[m]);
          if (h != null && typeof Object.getOwnPropertySymbols == "function")
            for (var w = 0, m = Object.getOwnPropertySymbols(h); w < m.length; w++)
              y.indexOf(m[w]) < 0 && Object.prototype.propertyIsEnumerable.call(h, m[w]) && (d[m[w]] = h[m[w]]);
          return d;
        };
        (function() {
          typeof window > "u" || (navigator.mediaDevices === void 0 && (navigator.mediaDevices = {}), navigator.mediaDevices.getUserMedia === void 0 && (navigator.mediaDevices.getUserMedia = function(y) {
            var d = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            return d ? new Promise(function(m, w) {
              d.call(navigator, y, m, w);
            }) : Promise.reject(new Error("getUserMedia is not implemented in this browser"));
          }));
        })();
        function u() {
          return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        }
        var f = function(h) {
          a(y, h);
          function y(d) {
            var m = h.call(this, d) || this;
            return m.canvas = null, m.ctx = null, m.requestUserMediaId = 0, m.unmounted = !1, m.state = {
              hasUserMedia: !1
            }, m;
          }
          return y.prototype.componentDidMount = function() {
            var d = this, m = d.state, w = d.props;
            if (this.unmounted = !1, !u()) {
              w.onUserMediaError("getUserMedia not supported");
              return;
            }
            m.hasUserMedia || this.requestUserMedia(), w.children && typeof w.children != "function" && console.warn("children must be a function");
          }, y.prototype.componentDidUpdate = function(d) {
            var m = this.props;
            if (!u()) {
              m.onUserMediaError("getUserMedia not supported");
              return;
            }
            var w = JSON.stringify(d.audioConstraints) !== JSON.stringify(m.audioConstraints), g = JSON.stringify(d.videoConstraints) !== JSON.stringify(m.videoConstraints), p = d.minScreenshotWidth !== m.minScreenshotWidth, v = d.minScreenshotHeight !== m.minScreenshotHeight;
            (g || p || v) && (this.canvas = null, this.ctx = null), (w || g) && (this.stopAndCleanup(), this.requestUserMedia());
          }, y.prototype.componentWillUnmount = function() {
            this.unmounted = !0, this.stopAndCleanup();
          }, y.stopMediaStream = function(d) {
            d && (d.getVideoTracks && d.getAudioTracks ? (d.getVideoTracks().map(function(m) {
              d.removeTrack(m), m.stop();
            }), d.getAudioTracks().map(function(m) {
              d.removeTrack(m), m.stop();
            })) : d.stop());
          }, y.prototype.stopAndCleanup = function() {
            var d = this.state;
            d.hasUserMedia && (y.stopMediaStream(this.stream), d.src && window.URL.revokeObjectURL(d.src));
          }, y.prototype.getScreenshot = function(d) {
            var m = this, w = m.state, g = m.props;
            if (!w.hasUserMedia)
              return null;
            var p = this.getCanvas(d);
            return p && p.toDataURL(g.screenshotFormat, g.screenshotQuality);
          }, y.prototype.getCanvas = function(d) {
            var m = this, w = m.state, g = m.props;
            if (!this.video || !w.hasUserMedia || !this.video.videoHeight)
              return null;
            if (!this.ctx) {
              var p = this.video.videoWidth, v = this.video.videoHeight;
              if (!this.props.forceScreenshotSourceSize) {
                var b = p / v;
                p = g.minScreenshotWidth || this.video.clientWidth, v = p / b, g.minScreenshotHeight && v < g.minScreenshotHeight && (v = g.minScreenshotHeight, p = v * b);
              }
              this.canvas = document.createElement("canvas"), this.canvas.width = (d == null ? void 0 : d.width) || p, this.canvas.height = (d == null ? void 0 : d.height) || v, this.ctx = this.canvas.getContext("2d");
            }
            var C = this, E = C.ctx, R = C.canvas;
            return E && R && (g.mirrored && (E.translate(R.width, 0), E.scale(-1, 1)), E.imageSmoothingEnabled = g.imageSmoothing, E.drawImage(this.video, 0, 0, (d == null ? void 0 : d.width) || R.width, (d == null ? void 0 : d.height) || R.height), g.mirrored && (E.scale(-1, 1), E.translate(-R.width, 0))), R;
          }, y.prototype.requestUserMedia = function() {
            var d = this, m = this.props, w = function(v, b) {
              var C = {
                video: typeof b < "u" ? b : !0
              };
              m.audio && (C.audio = typeof v < "u" ? v : !0), d.requestUserMediaId++;
              var E = d.requestUserMediaId;
              navigator.mediaDevices.getUserMedia(C).then(function(R) {
                d.unmounted || E !== d.requestUserMediaId ? y.stopMediaStream(R) : d.handleUserMedia(null, R);
              }).catch(function(R) {
                d.handleUserMedia(R);
              });
            };
            if ("mediaDevices" in navigator)
              w(m.audioConstraints, m.videoConstraints);
            else {
              var g = function(v) {
                return { optional: [{ sourceId: v }] };
              }, p = function(v) {
                var b = v.deviceId;
                return typeof b == "string" ? b : Array.isArray(b) && b.length > 0 ? b[0] : typeof b == "object" && b.ideal ? b.ideal : null;
              };
              MediaStreamTrack.getSources(function(v) {
                var b = null, C = null;
                v.forEach(function(T) {
                  T.kind === "audio" ? b = T.id : T.kind === "video" && (C = T.id);
                });
                var E = p(m.audioConstraints);
                E && (b = E);
                var R = p(m.videoConstraints);
                R && (C = R), w(g(b), g(C));
              });
            }
          }, y.prototype.handleUserMedia = function(d, m) {
            var w = this.props;
            if (d || !m) {
              this.setState({ hasUserMedia: !1 }), w.onUserMediaError(d);
              return;
            }
            this.stream = m;
            try {
              this.video && (this.video.srcObject = m), this.setState({ hasUserMedia: !0 });
            } catch {
              this.setState({
                hasUserMedia: !0,
                src: window.URL.createObjectURL(m)
              });
            }
            w.onUserMedia(m);
          }, y.prototype.render = function() {
            var d = this, m = this, w = m.state, g = m.props, p = g.audio;
            g.forceScreenshotSourceSize, g.onUserMedia, g.onUserMediaError, g.screenshotFormat, g.screenshotQuality, g.minScreenshotWidth, g.minScreenshotHeight, g.audioConstraints, g.videoConstraints, g.imageSmoothing;
            var v = g.mirrored, b = g.style, C = b === void 0 ? {} : b, E = g.children, R = c(g, ["audio", "forceScreenshotSourceSize", "onUserMedia", "onUserMediaError", "screenshotFormat", "screenshotQuality", "minScreenshotWidth", "minScreenshotHeight", "audioConstraints", "videoConstraints", "imageSmoothing", "mirrored", "style", "children"]), T = v ? l(l({}, C), { transform: (C.transform || "") + " scaleX(-1)" }) : C, O = {
              getScreenshot: this.getScreenshot.bind(this)
            };
            return s.createElement(
              s.Fragment,
              null,
              s.createElement("video", l({ autoPlay: !0, src: w.src, muted: !p, playsInline: !0, ref: function(P) {
                d.video = P;
              }, style: T }, R)),
              E && E(O)
            );
          }, y.defaultProps = {
            audio: !1,
            forceScreenshotSourceSize: !1,
            imageSmoothing: !0,
            mirrored: !1,
            onUserMedia: function() {
            },
            onUserMediaError: function() {
            },
            screenshotFormat: "image/webp",
            screenshotQuality: 0.92
          }, y;
        }(s.Component);
        o.default = f;
      },
      react: function(r, o) {
        r.exports = n;
      }
    }).default;
  });
})(RS);
const Mz = /* @__PURE__ */ Tc(RS.exports);
let Iz = { data: "" }, Az = (e) => typeof window == "object" ? ((e ? e.querySelector("#_goober") : window._goober) || Object.assign((e || document.head).appendChild(document.createElement("style")), { innerHTML: " ", id: "_goober" })).firstChild : e || Iz, Nz = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g, Lz = /\/\*[^]*?\*\/|  +/g, iy = /\n+/g, Er = (e, t) => {
  let n = "", r = "", o = "";
  for (let i in e) {
    let s = e[i];
    i[0] == "@" ? i[1] == "i" ? n = i + " " + s + ";" : r += i[1] == "f" ? Er(s, i) : i + "{" + Er(s, i[1] == "k" ? "" : t) + "}" : typeof s == "object" ? r += Er(s, t ? t.replace(/([^,])+/g, (a) => i.replace(/(^:.*)|([^,])+/g, (l) => /&/.test(l) ? l.replace(/&/g, a) : a ? a + " " + l : l)) : i) : s != null && (i = /^--/.test(i) ? i : i.replace(/[A-Z]/g, "-$&").toLowerCase(), o += Er.p ? Er.p(i, s) : i + ":" + s + ";");
  }
  return n + (t && o ? t + "{" + o + "}" : o) + r;
}, Kn = {}, TS = (e) => {
  if (typeof e == "object") {
    let t = "";
    for (let n in e)
      t += n + TS(e[n]);
    return t;
  }
  return e;
}, Fz = (e, t, n, r, o) => {
  let i = TS(e), s = Kn[i] || (Kn[i] = ((l) => {
    let c = 0, u = 11;
    for (; c < l.length; )
      u = 101 * u + l.charCodeAt(c++) >>> 0;
    return "go" + u;
  })(i));
  if (!Kn[s]) {
    let l = i !== e ? e : ((c) => {
      let u, f, h = [{}];
      for (; u = Nz.exec(c.replace(Lz, "")); )
        u[4] ? h.shift() : u[3] ? (f = u[3].replace(iy, " ").trim(), h.unshift(h[0][f] = h[0][f] || {})) : h[0][u[1]] = u[2].replace(iy, " ").trim();
      return h[0];
    })(e);
    Kn[s] = Er(o ? { ["@keyframes " + s]: l } : l, n ? "" : "." + s);
  }
  let a = n && Kn.g ? Kn.g : null;
  return n && (Kn.g = Kn[s]), ((l, c, u, f) => {
    f ? c.data = c.data.replace(f, l) : c.data.indexOf(l) === -1 && (c.data = u ? l + c.data : c.data + l);
  })(Kn[s], t, r, a), s;
}, Dz = (e, t, n) => e.reduce((r, o, i) => {
  let s = t[i];
  if (s && s.call) {
    let a = s(n), l = a && a.props && a.props.className || /^go/.test(a) && a;
    s = l ? "." + l : a && typeof a == "object" ? a.props ? "" : Er(a, "") : a === !1 ? "" : a;
  }
  return r + o + (s == null ? "" : s);
}, "");
function Nu(e) {
  let t = this || {}, n = e.call ? e(t.p) : e;
  return Fz(n.unshift ? n.raw ? Dz(n, [].slice.call(arguments, 1), t.p) : n.reduce((r, o) => Object.assign(r, o && o.call ? o(t.p) : o), {}) : n, Az(t.target), t.g, t.o, t.k);
}
let PS, mp, gp;
Nu.bind({ g: 1 });
let cr = Nu.bind({ k: 1 });
function zz(e, t, n, r) {
  Er.p = t, PS = e, mp = n, gp = r;
}
function to(e, t) {
  let n = this || {};
  return function() {
    let r = arguments;
    function o(i, s) {
      let a = Object.assign({}, i), l = a.className || o.className;
      n.p = Object.assign({ theme: mp && mp() }, a), n.o = / *go\d+/.test(l), a.className = Nu.apply(n, r) + (l ? " " + l : ""), t && (a.ref = s);
      let c = e;
      return e[0] && (c = a.as || e, delete a.as), gp && c[0] && gp(a), PS(c, a);
    }
    return t ? t(o) : o;
  };
}
var Bz = (e) => typeof e == "function", vp = (e, t) => Bz(e) ? e(t) : e, jz = (() => {
  let e = 0;
  return () => (++e).toString();
})(), Wz = (() => {
  let e;
  return () => {
    if (e === void 0 && typeof window < "u") {
      let t = matchMedia("(prefers-reduced-motion: reduce)");
      e = !t || t.matches;
    }
    return e;
  };
})(), Uz = 20, Ll = /* @__PURE__ */ new Map(), Hz = 1e3, sy = (e) => {
  if (Ll.has(e))
    return;
  let t = setTimeout(() => {
    Ll.delete(e), Lu({ type: 4, toastId: e });
  }, Hz);
  Ll.set(e, t);
}, Vz = (e) => {
  let t = Ll.get(e);
  t && clearTimeout(t);
}, yp = (e, t) => {
  switch (t.type) {
    case 0:
      return { ...e, toasts: [t.toast, ...e.toasts].slice(0, Uz) };
    case 1:
      return t.toast.id && Vz(t.toast.id), { ...e, toasts: e.toasts.map((i) => i.id === t.toast.id ? { ...i, ...t.toast } : i) };
    case 2:
      let { toast: n } = t;
      return e.toasts.find((i) => i.id === n.id) ? yp(e, { type: 1, toast: n }) : yp(e, { type: 0, toast: n });
    case 3:
      let { toastId: r } = t;
      return r ? sy(r) : e.toasts.forEach((i) => {
        sy(i.id);
      }), { ...e, toasts: e.toasts.map((i) => i.id === r || r === void 0 ? { ...i, visible: !1 } : i) };
    case 4:
      return t.toastId === void 0 ? { ...e, toasts: [] } : { ...e, toasts: e.toasts.filter((i) => i.id !== t.toastId) };
    case 5:
      return { ...e, pausedAt: t.time };
    case 6:
      let o = t.time - (e.pausedAt || 0);
      return { ...e, pausedAt: void 0, toasts: e.toasts.map((i) => ({ ...i, pauseDuration: i.pauseDuration + o })) };
  }
}, Yz = [], Bd = { toasts: [], pausedAt: void 0 }, Lu = (e) => {
  Bd = yp(Bd, e), Yz.forEach((t) => {
    t(Bd);
  });
}, Xz = (e, t = "blank", n) => ({ createdAt: Date.now(), visible: !0, type: t, ariaProps: { role: "status", "aria-live": "polite" }, message: e, pauseDuration: 0, ...n, id: (n == null ? void 0 : n.id) || jz() }), Na = (e) => (t, n) => {
  let r = Xz(t, e, n);
  return Lu({ type: 2, toast: r }), r.id;
}, sn = (e, t) => Na("blank")(e, t);
sn.error = Na("error");
sn.success = Na("success");
sn.loading = Na("loading");
sn.custom = Na("custom");
sn.dismiss = (e) => {
  Lu({ type: 3, toastId: e });
};
sn.remove = (e) => Lu({ type: 4, toastId: e });
sn.promise = (e, t, n) => {
  let r = sn.loading(t.loading, { ...n, ...n == null ? void 0 : n.loading });
  return e.then((o) => (sn.success(vp(t.success, o), { id: r, ...n, ...n == null ? void 0 : n.success }), o)).catch((o) => {
    sn.error(vp(t.error, o), { id: r, ...n, ...n == null ? void 0 : n.error });
  }), e;
};
var Kz = cr`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`, qz = cr`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`, Gz = cr`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`, Qz = to("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || "#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Kz} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${qz} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${(e) => e.secondary || "#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${Gz} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`, Jz = cr`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`, Zz = to("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${(e) => e.secondary || "#e0e0e0"};
  border-right-color: ${(e) => e.primary || "#616161"};
  animation: ${Jz} 1s linear infinite;
`, eB = cr`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`, tB = cr`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`, nB = to("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || "#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${eB} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${tB} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${(e) => e.secondary || "#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`, rB = to("div")`
  position: absolute;
`, oB = to("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`, iB = cr`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`, sB = to("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${iB} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`, aB = ({ toast: e }) => {
  let { icon: t, type: n, iconTheme: r } = e;
  return t !== void 0 ? typeof t == "string" ? x.exports.createElement(sB, null, t) : t : n === "blank" ? null : x.exports.createElement(oB, null, x.exports.createElement(Zz, { ...r }), n !== "loading" && x.exports.createElement(rB, null, n === "error" ? x.exports.createElement(Qz, { ...r }) : x.exports.createElement(nB, { ...r })));
}, lB = (e) => `
0% {transform: translate3d(0,${e * -200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`, cB = (e) => `
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e * -150}%,-1px) scale(.6); opacity:0;}
`, uB = "0%{opacity:0;} 100%{opacity:1;}", dB = "0%{opacity:1;} 100%{opacity:0;}", fB = to("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`, pB = to("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`, hB = (e, t) => {
  let n = e.includes("top") ? 1 : -1, [r, o] = Wz() ? [uB, dB] : [lB(n), cB(n)];
  return { animation: t ? `${cr(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards` : `${cr(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)` };
};
x.exports.memo(({ toast: e, position: t, style: n, children: r }) => {
  let o = e.height ? hB(e.position || t || "top-center", e.visible) : { opacity: 0 }, i = x.exports.createElement(aB, { toast: e }), s = x.exports.createElement(pB, { ...e.ariaProps }, vp(e.message, e));
  return x.exports.createElement(fB, { className: e.className, style: { ...o, ...n, ...e.style } }, typeof r == "function" ? r({ icon: i, message: s }) : x.exports.createElement(x.exports.Fragment, null, i, s));
});
zz(x.exports.createElement);
Nu`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;
function mB({
  updatemyMessages: e,
  socket: t,
  isSender: n,
  visitorId: r,
  setIsCameraOpen: o
}) {
  const {
    accessToken: i,
    languages: s
  } = Mi((v) => v.bot), a = x.exports.useRef(null), [l, c] = x.exports.useState(null), [u, f] = x.exports.useState(), [h, y] = x.exports.useState(!0), [d, m] = x.exports.useState(!0), w = x.exports.useCallback(async () => {
    const v = a.current.getScreenshot();
    f(v), c(v), y(!1);
  }, [a]);
  function g(v) {
    const b = v.split(","), C = b[0].indexOf("base64") >= 0 ? atob(b[1]) : decodeURI(b[1]), E = b[0].split(":")[1].split(";")[0], R = new Uint8Array(C.length);
    for (let T = 0; T < C.length; T++)
      R[T] = C.charCodeAt(T);
    return new Blob([R], {
      type: E
    });
  }
  return /* @__PURE__ */ S(qe, {
    sx: {
      maxWidth: "100%",
      borderRadius: 10,
      margin: "0 auto",
      mt: 2
    },
    children: h ? /* @__PURE__ */ G(Et, {
      children: [/* @__PURE__ */ S(Mz, {
        audio: !1,
        ref: a,
        screenshotFormat: "image/jpeg",
        width: "100%",
        height: 300
      }), /* @__PURE__ */ G("div", {
        style: {
          textAlign: "center",
          width: "100%"
        },
        children: [/* @__PURE__ */ S(st, {
          onClick: w,
          type: "submit",
          variant: "contained",
          size: "small",
          children: "Submit"
        }), /* @__PURE__ */ S(st, {
          sx: {
            m: 1
          },
          onClick: (v) => o(!1),
          type: "submit",
          variant: "contained",
          size: "small",
          children: "close"
        })]
      })]
    }) : l && d ? /* @__PURE__ */ G(Et, {
      children: [" ", /* @__PURE__ */ S("img", {
        src: l
      }), /* @__PURE__ */ G("div", {
        style: {
          textAlign: "center",
          width: "100%"
        },
        children: [/* @__PURE__ */ S(st, {
          onClick: () => y(!0),
          type: "submit",
          variant: "contained",
          size: "small",
          children: "Recapture"
        }), /* @__PURE__ */ S(st, {
          sx: {
            m: 1
          },
          onClick: async () => {
            const v = g(u);
            try {
              const b = new FormData();
              b.append("file", v);
              const C = await Zr.post(`${window.baseUrl}/api/file`, b, {
                headers: {
                  Authorization: "Bearer " + i
                }
              }), E = {
                value: `${window.baseUrl}/api${C.data.url}`,
                type: "image",
                senderId: r,
                time: new Date().toISOString(),
                id: new Date().getTime()
              };
              return t == null || t.emit("events", {
                event: "chat-message-bot",
                data: {
                  message: E.value,
                  type: "image"
                }
              }), e(E), m(!1), o(!1), console.log("uploadFileServer to server", C), `${window.baseUrl}/api${C.data.url}`;
            } catch (b) {
              sn.error(b.response.data.message || b.message || "Failed...");
              return;
            }
          },
          type: "submit",
          variant: "contained",
          size: "small",
          children: "Upload"
        })]
      })]
    }) : /* @__PURE__ */ S(Et, {})
  });
}
const gB = U(x5)(({
  theme: e
}) => ({
  padding: e.spacing(1)
})), vB = (e) => {
  const {
    hidden: t,
    botStyles: n,
    visitorId: r,
    newMessages: o,
    soundAlert: i
  } = e, {
    isSoundOn: s
  } = Mi((p) => p.bot), a = x.exports.useRef(null), l = () => {
    a.current && (a.current.scrollTop = a.current.scrollHeight);
  }, c = () => {
    var E;
    let p = [];
    o.length && (p = o);
    const v = [];
    let b = (E = o[0]) != null && E.senderId ? o[0].senderId : "bot", C = {
      senderId: b,
      messages: []
    };
    return p.forEach((R, T) => {
      b === R.senderId ? C.messages.push(R) : (b = R.senderId, v.push(C), C = {
        senderId: b,
        messages: [R]
      }), T === p.length - 1 && v.push(C);
    }), v;
  };
  x.exports.useEffect(() => {
    o && o.length && l();
  }, [o]);
  const [u, f] = x.exports.useState(!1), [h, y] = x.exports.useState("");
  function d(p, v) {
    p === "webview" && (y(v), f(!0));
  }
  const m = () => {
    s && i.play();
  };
  return /* @__PURE__ */ S(Et, {
    children: /* @__PURE__ */ S(qe, {
      sx: {
        height: "calc(100% - 8.4375rem)"
      },
      children: /* @__PURE__ */ G(({
        children: p
      }) => t ? /* @__PURE__ */ S(qe, {
        ref: a,
        sx: {
          p: 2,
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden"
        },
        children: p
      }) : /* @__PURE__ */ S(gB, {
        ref: a,
        options: {
          wheelPropagation: !1
        },
        children: p
      }), {
        children: [(() => c().map((p, v) => {
          const b = p.senderId === r;
          return /* @__PURE__ */ G(qe, {
            sx: {
              display: "flex",
              flexDirection: b ? "row-reverse" : "row",
              mb: v !== c().length - 1 ? 4 : void 0,
              mt: 1.5
            },
            children: [/* @__PURE__ */ S("div", {
              children: /* @__PURE__ */ S(Wx, {
                alt: b ? "V" : "B",
                sx: {
                  width: 20,
                  height: 20,
                  m: 1,
                  mt: -2,
                  p: 0.4,
                  bgcolor: b ? "#757de8" : "#ff6333"
                },
                children: b ? /* @__PURE__ */ S(ct, {
                  icon: "mdi:user",
                  fontSize: 20
                }) : /* @__PURE__ */ S(ct, {
                  icon: "mdi:user",
                  fontSize: 20
                })
              })
            }), /* @__PURE__ */ G(qe, {
              className: "chat-body",
              sx: {
                maxWidth: ["calc(100% - 1.75rem)", "90%", "90 %"]
              },
              children: [p.messages.map((C, E) => /* @__PURE__ */ S(qe, {
                sx: {
                  "&:not(:last-of-type)": {
                    mb: 1
                  }
                },
                children: /* @__PURE__ */ G("div", {
                  children: [C.info && /* @__PURE__ */ S(xm, {
                    severity: C.info,
                    children: C.value
                  }), C.type === "text" && !(C != null && C.info) && (C == null ? void 0 : C.value) && (C == null ? void 0 : C.value.length) > 0 && /* @__PURE__ */ S(Pz, {
                    isSender: b,
                    botStyles: n,
                    message: C.value
                  }), C.type === "buttons" && /* @__PURE__ */ S(qD, {
                    socket: e.socket,
                    updatemyMessages: e.updatemyMessages,
                    botStyles: n,
                    isSender: b,
                    buttons: C.buttons || [],
                    message: C.value || "",
                    visitorId: r
                  }), C.type === "quick_reply" && /* @__PURE__ */ S(Oz, {
                    botStyles: n,
                    socket: e.socket,
                    updatemyMessages: e.updatemyMessages,
                    isSender: b,
                    buttons: C.buttons || [],
                    message: C.value || "",
                    visitorId: r,
                    handleButtonFunction: d
                  }), C.type === "image" && /* @__PURE__ */ S(Tz, {
                    isSender: b,
                    image: C.value || ""
                  }), C.type === "audio" && /* @__PURE__ */ S(KD, {
                    link: C.value
                  }), C.type === "video" && /* @__PURE__ */ S(_z, {
                    link: C.value,
                    type: C.format || "mp4"
                  }), C.type === "maps" && /* @__PURE__ */ S($z, {
                    location: C.location
                  }), C.type === "ads" && /* @__PURE__ */ S(kS, {
                    adsSlideArray: C == null ? void 0 : C.value,
                    ...e
                  }), C.type === "offer" && /* @__PURE__ */ S(ES, {
                    offersArray: C.value,
                    ...e
                  }), /* @__PURE__ */ S("div", {
                    style: {
                      width: "100%",
                      marginLeft: "-1rem"
                    },
                    children: C.type === "gallery" && /* @__PURE__ */ S(Rz, {
                      galleryArray: C == null ? void 0 : C.buttons,
                      ...e
                    })
                  })]
                })
              }, E)), !b && m()]
            })]
          }, v);
        }))(), e.isFeedbackOpen && /* @__PURE__ */ S(GD, {
          socket: e.socket,
          ...e
        }), e.isCameraOpen && /* @__PURE__ */ S(mB, {
          updatemyMessages: e.updatemyMessages,
          socket: e.socket,
          visitorId: r,
          ...e
        })]
      })
    })
  });
}, yB = U(qe)(({
  theme: e
}) => ({
  display: "flex",
  alignItems: "center",
  padding: e.spacing(1.25, 1),
  justifyContent: "space-between",
  borderRadius: e.shape.borderRadius,
  backgroundColor: e.palette.background.paper
})), bB = U("form")(({
  theme: e
}) => ({
  padding: e.spacing(0, 1, 1)
})), xB = (e) => {
  const {
    socket: t,
    botStyles: n,
    visitorId: r,
    setIsCameraOpen: o
  } = e, {
    accessToken: i,
    languages: s
  } = Mi((p) => p.bot), [a, l] = x.exports.useState(""), [c, u] = x.exports.useState(null), f = Boolean(c), [h, y] = x.exports.useState({}), d = () => {
    u(null);
  }, m = (p) => {
    p.preventDefault();
    const v = {
      value: a,
      type: "text",
      senderId: r,
      time: new Date().toISOString(),
      id: new Date().getTime()
    };
    t == null || t.emit("events", {
      event: "chat-message-bot",
      data: {
        message: v.value,
        language: h == null ? void 0 : h.code
      }
    }), e.updatemyMessages(v), l("");
  }, w = async (p) => {
    sn.error("Try to upload less than 2MB");
  }, g = async () => {
    const p = a.split(" "), v = p[p.length - 2];
    try {
      const b = await Zr.post(`https://www.google.com/inputtools/request?text=${v}&itc=${h.value}&num=13&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`);
      if (b.data.length > 1 && b.data[0] === "SUCCESS") {
        const C = b.data[1][0][1][0], R = p.slice(0, -2).join(" ") + " " + C + " ";
        l(R);
      }
    } catch (b) {
      console.log("TRANSLATE API AXIOS ERROR >>> ", b);
    }
  };
  return /* @__PURE__ */ S(bB, {
    onSubmit: m,
    sx: {
      bottom: 2,
      position: "absolute",
      width: "95%"
    },
    children: /* @__PURE__ */ G(yB, {
      children: [a === "" && /* @__PURE__ */ S(qe, {
        sx: {
          display: "flex",
          alignItems: "center"
        },
        children: /* @__PURE__ */ S(up, {
          placement: "top",
          title: "Attachment",
          arrow: !0,
          children: /* @__PURE__ */ G(Hn, {
            size: "large",
            component: "label",
            htmlFor: "upload-img",
            sx: {
              color: "text.primary"
            },
            children: [/* @__PURE__ */ S(ct, {
              icon: "bx:paperclip"
            }), /* @__PURE__ */ S("input", {
              hidden: !0,
              type: "file",
              accept: "image/*",
              id: "upload-img",
              onChange: (p) => w()
            })]
          })
        })
      }), /* @__PURE__ */ S(qe, {
        sx: {
          flexGrow: 1,
          display: "flex",
          alignItems: "center"
        },
        children: /* @__PURE__ */ S(yo, {
          fullWidth: !0,
          size: "medium",
          value: a,
          inputProps: {
            min: 1,
            maxLength: 180
          },
          onKeyUp: (p) => {
            p.keyCode === 32 && h !== "" && g();
          },
          required: !0,
          placeholder: "Type your message here\u2026",
          onChange: (p) => l(p.target.value),
          sx: {
            "& .Mui-focused": {
              boxShadow: 0
            },
            fontFamily: "'Mulish', sans-serif",
            "& .MuiOutlinedInput-input": {
              pl: 0
            },
            "& fieldset": {
              border: "0 !important"
            }
          }
        })
      }), /* @__PURE__ */ G(qe, {
        sx: {
          display: "flex",
          alignItems: "center"
        },
        children: [/* @__PURE__ */ G(km, {
          id: "demo-positioned-menu",
          "aria-labelledby": "demo-positioned-button",
          anchorEl: c,
          open: f,
          onClose: d,
          anchorOrigin: {
            vertical: "top",
            horizontal: "left"
          },
          sx: {
            mb: 10
          },
          transformOrigin: {
            vertical: "top",
            horizontal: "left"
          },
          children: [/* @__PURE__ */ G(Nt, {
            direction: "row",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            width: "100%",
            children: [/* @__PURE__ */ S(gt, {
              variant: "button",
              display: "block",
              gutterBottom: !0,
              sx: {
                p: 1,
                fontWeight: "bold",
                textTransform: "unset"
              },
              children: /* @__PURE__ */ S(ct, {
                icon: "mdi:language",
                fontSize: 21,
                color: "grey"
              })
            }), /* @__PURE__ */ S(gt, {
              variant: "button",
              display: "block",
              gutterBottom: !0,
              sx: {
                p: 1,
                fontWeight: "bold",
                textTransform: "unset"
              },
              children: "Convert into"
            })]
          }), s.map((p, v) => /* @__PURE__ */ S(vs, {
            value: p.value,
            selected: p.value === h.value,
            onClick: (b) => {
              y({
                ...p
              }), d();
            },
            sx: {
              textTransform: "capitalize"
            },
            children: p.label
          }, v))]
        }), /* @__PURE__ */ S(Hn, {
          type: "submit",
          children: /* @__PURE__ */ S(ct, {
            icon: "material-symbols:send",
            color: (n == null ? void 0 : n.primaryColor) || "blue"
          })
        })]
      })]
    })
  });
}, wB = U(jD)(({
  theme: e
}) => ({
  padding: 8,
  "& .MuiSwitch-track": {
    borderRadius: 22 / 2,
    "&:before, &:after": {
      content: '""',
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      width: 16,
      height: 16
    },
    "&:before": {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(e.palette.getContrastText(e.palette.primary.main))}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
      left: 12
    },
    "&:after": {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(e.palette.getContrastText(e.palette.primary.main))}" d="M19,13H5V11H19V13Z" /></svg>')`,
      right: 12
    }
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "none",
    width: 16,
    height: 16,
    margin: 2
  }
}));
function SB({
  isSound: e,
  setIsSound: t
}) {
  const n = kh(), {
    isSoundOn: r
  } = Mi((i) => i.bot);
  return /* @__PURE__ */ S(iF, {
    sx: {
      textAlign: "left"
    },
    children: /* @__PURE__ */ S(Z4, {
      control: /* @__PURE__ */ S(wB, {
        checked: r,
        onChange: (i) => {
          n(PA(i.target.checked));
        }
      }),
      label: "Alert Sound",
      labelPlacement: "end"
    })
  });
}
function CB(e) {
  const {
    anchorEl: t,
    open: n,
    handleClose: r,
    handleClearChat: o,
    handleCloseChat: i,
    handleOpenSendTranscriptDialog: s,
    isShow: a,
    messageArray: l
  } = e;
  return /* @__PURE__ */ S("div", {
    children: /* @__PURE__ */ G(km, {
      id: "more-option-menu",
      anchorEl: t,
      open: n,
      MenuListProps: {
        "aria-labelledby": "more-option-button"
      },
      onClose: r,
      children: [/* @__PURE__ */ S(vs, {
        onClick: o,
        children: "Clear Messages"
      }), /* @__PURE__ */ S(vs, {
        onClick: i,
        children: "Close Conversation"
      }), a.isShowChats && !a.isShowForm && l.length > 0 && /* @__PURE__ */ S(vs, {
        onClick: s,
        children: "Send Transcript"
      }), /* @__PURE__ */ S(vs, {
        children: /* @__PURE__ */ S(SB, {
          ...e
        })
      })]
    })
  });
}
function jd({
  handleStartConversation: e,
  saveState: t,
  loading: n,
  handleSkipConversation: r
}) {
  return /* @__PURE__ */ G("div", {
    style: {
      margin: "1 auto",
      textAlign: "center"
    },
    children: [/* @__PURE__ */ S(gt, {
      sx: {
        textAlign: "center",
        color: "#ffa100",
        fontWeight: "500",
        fontFamily: "'Montserrat', sans-serif",
        fontSize: "0.95rem",
        mb: 0.5
      },
      children: "Complete you information"
    }), /* @__PURE__ */ S("form", {
      style: {
        height: "100%",
        maxWidth: "80%",
        overflowY: "auto",
        margin: "0 auto"
      },
      onSubmit: e,
      children: /* @__PURE__ */ G(Nt, {
        direction: "column",
        alignItems: "space-between",
        justifyContent: "center",
        width: "90%",
        height: "100%",
        margin: "0 auto",
        children: [/* @__PURE__ */ S(yo, {
          label: "Name",
          size: "small",
          fullWidth: !0,
          placeholder: "Enter your name...",
          sx: {
            mb: 2
          },
          name: "name",
          onChange: t,
          type: "text",
          required: !0
        }), /* @__PURE__ */ S(yo, {
          label: "Mobile No",
          size: "small",
          fullWidth: !0,
          placeholder: "Enter your mobile no...",
          sx: {
            mb: 2
          },
          name: "phone",
          onChange: t,
          type: "number"
        }), /* @__PURE__ */ S(yo, {
          label: "Email Address",
          size: "small",
          fullWidth: !0,
          placeholder: "Enter you email address",
          name: "email",
          onChange: t,
          type: "email",
          required: !0
        }), /* @__PURE__ */ S("br", {}), n ? /* @__PURE__ */ S("div", {
          style: {
            width: "100%",
            textAlign: "center"
          },
          children: /* @__PURE__ */ S(qw, {
            color: "primary"
          })
        }) : /* @__PURE__ */ G(Et, {
          children: [/* @__PURE__ */ S(st, {
            type: "submit",
            variant: "contained",
            sx: {
              textTransform: "capitalize"
            },
            children: "Start Conversation"
          }), /* @__PURE__ */ S(st, {
            onClick: r,
            sx: {
              textTransform: "capitalize",
              mt: 1,
              fontWeight: "bold"
            },
            children: "Skip"
          })]
        })]
      })
    })]
  });
}
function kB({
  open: e,
  setOpen: t,
  socket: n,
  visitorId: r,
  handleClose: o
}) {
  const [i, s] = x.exports.useState({
    name: "",
    email: ""
  }), a = (c) => {
    s({
      ...i,
      [c.target.name]: c.target.value
    });
  };
  return /* @__PURE__ */ S("div", {
    children: /* @__PURE__ */ G(n4, {
      open: e,
      onClose: o,
      children: [/* @__PURE__ */ S(P4, {
        sx: {
          m: 0,
          p: 0,
          textAlign: "center"
        },
        children: "Send Transcript?"
      }), /* @__PURE__ */ G("form", {
        onSubmit: (c) => {
          c.preventDefault(), n.emit("send-transcript", {
            data: {
              name: i.name,
              email: i.email,
              visitorId: r
            }
          }), t(!1);
        },
        children: [/* @__PURE__ */ G(v4, {
          children: [/* @__PURE__ */ S(C4, {
            sx: {
              mt: -2,
              textAlign: "center"
            },
            children: "Please fill the below fields"
          }), /* @__PURE__ */ S(yo, {
            autoFocus: !0,
            margin: "dense",
            id: "name",
            onChange: a,
            name: "name",
            label: "Enter Name",
            type: "text",
            fullWidth: !0,
            required: !0,
            variant: "standard"
          }), /* @__PURE__ */ S(yo, {
            autoFocus: !0,
            onChange: a,
            margin: "dense",
            id: "email",
            name: "email",
            label: "Email Address",
            type: "email",
            required: !0,
            fullWidth: !0,
            variant: "standard"
          })]
        }), /* @__PURE__ */ G(l4, {
          children: [/* @__PURE__ */ S(st, {
            size: "small",
            onClick: o,
            children: "Cancel"
          }), /* @__PURE__ */ S(st, {
            variant: "contained",
            size: "small",
            type: "submit",
            children: "Send Transcript"
          })]
        })]
      })]
    })
  });
}
function ay({}) {
  return /* @__PURE__ */ G("div", {
    style: {
      marginTop: "10rem"
    },
    children: [/* @__PURE__ */ S("img", {
      src: "/widget-robot.png",
      width: "50%",
      height: "220px",
      style: {
        objectFit: "fill",
        opacity: "0.9"
      }
    }), /* @__PURE__ */ S("br", {}), /* @__PURE__ */ S("br", {})]
  });
}
const EB = (e) => {
  var re;
  const {
    hidden: t,
    setIsBotOpen: n,
    socket: r,
    updatemyMessages: o,
    visitorAccessToken: i,
    botStyles: s,
    botSettings: a,
    botName: l,
    botId: c,
    setLoadingBot: u,
    offersArr: f,
    adsArr: h,
    isShow: y,
    setIsShow: d,
    accessToken: m,
    widgetToken: w,
    newMessages: g,
    isLocation: p
  } = e, v = async (ie, de) => {
    var oe;
    const se = de || ((ue) => {
      ie();
    });
    if (navigator.permissions) {
      const ue = await ((oe = navigator == null ? void 0 : navigator.permissions) == null ? void 0 : oe.query({
        name: "geolocation"
      }));
      console.log("Location permission status: ", ue.state);
    }
    navigator.geolocation ? navigator.geolocation.getCurrentPosition(ie, se, {
      enableHighAccuracy: !0,
      timeout: 5e3,
      maximumAge: 0
    }) : ie();
  }, b = (re = document == null ? void 0 : document.getElementById("bizbot-widget")) == null ? void 0 : re.clientHeight, C = kh(), [E, R] = x.exports.useState({
    name: "",
    email: "",
    phone: 0
  }), T = (ie) => {
    R({
      ...E,
      [ie.target.name]: ie.target.value
    });
  }, [O, P] = x.exports.useState(!1), $ = async (ie) => {
    ie.preventDefault();
    const de = async (se) => {
      var oe, ue;
      P(!0), d({
        isShowForm: !1,
        isShowAds: !1,
        isShowChats: !1
      });
      try {
        await C(lo({
          data: {
            ...E,
            location: {
              longitude: (oe = se == null ? void 0 : se.coords) == null ? void 0 : oe.longitude,
              latitude: (ue = se == null ? void 0 : se.coords) == null ? void 0 : ue.latitude
            }
          },
          token: w
        })), localStorage.setItem("visitorData", JSON.stringify(E)), d({
          isShowForm: !1,
          isShowAds: !1,
          isShowChats: !0
        }), P(!1);
      } catch (ge) {
        P(!1), console.log({
          error: ge
        }), d({
          isShowForm: !0,
          isShowAds: !1,
          isShowChats: !1
        });
      }
    };
    if (p)
      v(de);
    else {
      P(!0), d({
        isShowForm: !1,
        isShowAds: !1,
        isShowChats: !1
      });
      try {
        await C(lo({
          data: {
            ...E
          },
          token: w
        })), localStorage.setItem("visitorData", JSON.stringify(E)), d({
          isShowForm: !1,
          isShowAds: !1,
          isShowChats: !0
        }), P(!1);
      } catch (se) {
        P(!1), console.log({
          error: se
        }), d({
          isShowForm: !0,
          isShowAds: !1,
          isShowChats: !1
        });
      }
    }
  }, B = async (ie) => {
    ie.preventDefault();
    const de = async (se) => {
      var oe, ue;
      P(!0), d({
        isShowForm: !1,
        isShowAds: !1,
        isShowChats: !1
      });
      try {
        await C(lo({
          data: {
            location: {
              longitude: (oe = se == null ? void 0 : se.coords) == null ? void 0 : oe.longitude,
              latitude: (ue = se == null ? void 0 : se.coords) == null ? void 0 : ue.latitude
            }
          },
          token: w
        })), d({
          isShowForm: !1,
          isShowAds: !1,
          isShowChats: !0
        }), P(!1);
      } catch (ge) {
        P(!1), d({
          isShowForm: !0,
          isShowAds: !1,
          isShowChats: !1
        }), console.log({
          error: ge
        });
      }
    };
    if (p)
      v(de);
    else {
      P(!0), d({
        isShowForm: !1,
        isShowAds: !1,
        isShowChats: !1
      });
      try {
        C(lo({
          token: w
        })), d({
          isShowForm: !1,
          isShowAds: !1,
          isShowChats: !0
        }), P(!1);
      } catch (se) {
        P(!1), d({
          isShowForm: !0,
          isShowAds: !1,
          isShowChats: !1
        }), console.log({
          error: se
        });
      }
    }
  }, [D, I] = x.exports.useState(null), M = Boolean(D), A = (ie) => {
    I(ie.currentTarget);
  }, j = () => {
    I(null);
  }, _ = (ie) => {
    C(TA()), j();
  }, z = (ie) => {
    n(!1);
  }, {
    visitorId: F
  } = Mi((ie) => ie.bot), [Y, q] = x.exports.useState(!1), pe = async () => {
    const ie = async (de) => {
      var se, oe;
      if (d({
        isShowForm: !1,
        isShowAds: !1,
        isShowChats: !1
      }), q(!0), m)
        d({
          isShowForm: !1,
          isShowAds: !1,
          isShowChats: !0
        }), q(!1);
      else if (c && C) {
        let ue = localStorage.getItem("visitorData");
        if (ue && ue !== "undefined") {
          u(!0);
          const ge = JSON.parse(ue);
          await C(lo({
            token: w,
            data: {
              ...ge,
              location: {
                longitude: (se = de == null ? void 0 : de.coords) == null ? void 0 : se.longitude,
                latitude: (oe = de == null ? void 0 : de.coords) == null ? void 0 : oe.latitude
              }
            }
          })), u(!1), d({
            isShowForm: !1,
            isShowAds: !1,
            isShowChats: !0
          }), q(!1);
          return;
        }
        if (ue === "undefined" || ue === null) {
          d({
            isShowForm: !0,
            isShowAds: !1,
            isShowChats: !1
          }), q(!1);
          return;
        }
      }
    };
    if (p)
      v(ie);
    else if (d({
      isShowForm: !1,
      isShowAds: !1,
      isShowChats: !1
    }), q(!0), m)
      d({
        isShowForm: !1,
        isShowAds: !1,
        isShowChats: !0
      }), q(!1);
    else if (c && C) {
      let de = localStorage.getItem("visitorData");
      if (de && de !== "undefined") {
        u(!0);
        const se = JSON.parse(de);
        await C(lo({
          token: w,
          data: {
            ...se
          }
        })), u(!1), d({
          isShowForm: !1,
          isShowAds: !1,
          isShowChats: !0
        }), q(!1);
        return;
      }
      if (de === "undefined" || de === null) {
        d({
          isShowForm: !0,
          isShowAds: !1,
          isShowChats: !1
        }), q(!1);
        return;
      }
    }
  };
  let ne = localStorage.getItem("visitorData"), ae = !1;
  ne && ne !== "undefined" && (ae = !0);
  const [le, X] = x.exports.useState(!1), H = () => {
    X(!0);
  }, W = () => {
    X(!1);
  };
  return (() => /* @__PURE__ */ G(qe, {
    sx: {
      maxWidth: "100%",
      height: b ? b - 170 : "90%",
      backgroundColor: "#f5f8fb",
      borderRadius: "5px",
      pb: 1,
      margin: "0 auto",
      overflow: "hidden"
    },
    children: [/* @__PURE__ */ G(qe, {
      sx: {
        py: 3,
        px: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: (s == null ? void 0 : s.primaryColor) || "#fff",
        color: (s == null ? void 0 : s.headerTextColor) || "#000",
        borderRadius: "5px 5px 0 0"
      },
      children: [/* @__PURE__ */ S(qe, {
        sx: {
          display: "flex",
          alignItems: "center"
        },
        children: /* @__PURE__ */ G(qe, {
          sx: {
            display: "flex",
            alignItems: "center",
            cursor: "pointer"
          },
          children: [/* @__PURE__ */ S(z_, {
            overlap: "circular",
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "right"
            },
            sx: {
              mr: 2
            },
            badgeContent: /* @__PURE__ */ S(qe, {
              component: "span",
              sx: {
                width: 8,
                height: 8,
                borderRadius: "50%",
                color: "paper.main",
                boxShadow: (ie) => `0 0 0 2px ${ie.palette.background.paper}`,
                backgroundColor: "paper.main"
              }
            }),
            children: /* @__PURE__ */ S(Wx, {
              src: (s == null ? void 0 : s.avatar) || "/logo.png",
              alt: a == null ? void 0 : a.botName,
              sx: {
                width: "2.375rem",
                height: "2.375rem"
              }
            })
          }), /* @__PURE__ */ G(qe, {
            sx: {
              display: "flex",
              flexDirection: "column",
              width: "100%"
            },
            children: [/* @__PURE__ */ S(gt, {
              sx: {
                fontWeight: 600,
                fontSize: "1rem",
                color: (s == null ? void 0 : s.headerTextColor) || "#000",
                textTransform: "unset"
              },
              children: l
            }), /* @__PURE__ */ S(gt, {
              variant: "caption",
              sx: {
                color: (s == null ? void 0 : s.headerTextColor) || "#000",
                opacity: 0.75
              },
              children: "Handling by Bot"
            })]
          })]
        })
      }), /* @__PURE__ */ S(qe, {
        sx: {
          display: "flex",
          alignItems: "center"
        },
        children: /* @__PURE__ */ G(Et, {
          children: [/* @__PURE__ */ S(up, {
            title: "Home",
            placement: "top",
            arrow: !0,
            children: /* @__PURE__ */ S(Hn, {
              onClick: (ie) => {
                g.length > 0 ? d({
                  isShowForm: !1,
                  isShowAds: !0,
                  isShowChats: !1,
                  isShowOffer: !1
                }) : d({
                  isShowForm: !1,
                  isShowAds: !0,
                  isShowChats: !1,
                  isShowOffer: !1
                });
              },
              size: "small",
              sx: {
                color: (s == null ? void 0 : s.headerTextColor) || "red",
                opacity: 8
              },
              children: /* @__PURE__ */ S(ct, {
                icon: "ic:round-home",
                fontSize: 24,
                fontWeight: "bold"
              })
            })
          }), /* @__PURE__ */ S(up, {
            title: "More",
            placement: "top",
            arrow: !0,
            children: /* @__PURE__ */ S(Hn, {
              id: "more-option-button",
              "aria-controls": M ? "more-option-menu" : void 0,
              "aria-haspopup": "true",
              "aria-expanded": M ? "true" : void 0,
              onClick: A,
              size: "small",
              sx: {
                color: (s == null ? void 0 : s.headerTextColor) || "text.secondary",
                opacity: 8
              },
              children: /* @__PURE__ */ S(ct, {
                icon: "ic:outline-more-vert",
                fontSize: 25,
                fontWeight: "bold"
              })
            })
          }), /* @__PURE__ */ S(CB, {
            anchorEl: D,
            open: M,
            handleClose: j,
            handleClearChat: _,
            handleCloseChat: z,
            handleOpenSendTranscriptDialog: H,
            isShow: y,
            messageArray: g,
            ...e
          })]
        })
      })]
    }), Y || !y.isShowAds && !y.isShowForm && !y.isShowChats && !y.isShowOffer && /* @__PURE__ */ S(Nt, {
      direction: "column",
      alignItems: "space-between",
      justifyContent: "center",
      width: "100%",
      height: b ? b - 170 : "65%",
      margin: "0 auto",
      children: /* @__PURE__ */ G("div", {
        style: {
          width: "100%",
          textAlign: "center"
        },
        children: [/* @__PURE__ */ S(ay, {}), g.length > 0 || ae ? /* @__PURE__ */ S(Nt, {
          direction: "row",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          marginTop: "2rem",
          children: /* @__PURE__ */ S(st, {
            variant: "contained",
            sx: {
              textTransform: "unset"
            },
            onClick: pe,
            startIcon: /* @__PURE__ */ S(ct, {
              icon: "mdi:message-group",
              fontSize: 20
            }),
            children: "continue Conversation"
          })
        }) : /* @__PURE__ */ S(jd, {
          loading: O,
          handleSkipConversation: B,
          handleStartConversation: $,
          saveState: T
        })]
      })
    }), y.isShowAds && /* @__PURE__ */ S("div", {
      style: {
        height: "85%",
        width: "100%",
        overflowY: "auto",
        position: "relative"
      },
      children: (h == null ? void 0 : h.posters) && h.posters.length > 0 ? /* @__PURE__ */ G(Et, {
        children: [/* @__PURE__ */ S(kS, {
          adsSlideArray: h,
          ...e
        }), /* @__PURE__ */ S(Nt, {
          direction: "row",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          marginTop: "2rem",
          children: g.length > 0 ? /* @__PURE__ */ S(st, {
            variant: "contained",
            sx: {
              textTransform: "unset"
            },
            onClick: pe,
            startIcon: /* @__PURE__ */ S(ct, {
              icon: "mdi:message-group",
              fontSize: 20
            }),
            children: "continue Conversation"
          }) : /* @__PURE__ */ G(Et, {
            children: [/* @__PURE__ */ S(ay, {}), /* @__PURE__ */ S(st, {
              variant: "contained",
              sx: {
                textTransform: "unset"
              },
              onClick: pe,
              startIcon: /* @__PURE__ */ S(ct, {
                icon: "mdi:message-group",
                fontSize: 20
              }),
              children: "Start Conversation"
            })]
          })
        })]
      }) : g.length > 0 ? /* @__PURE__ */ S(Nt, {
        direction: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        marginTop: "2rem",
        children: (g == null ? void 0 : g.length) > 0 && /* @__PURE__ */ S(st, {
          variant: "contained",
          sx: {
            textTransform: "unset"
          },
          onClick: pe,
          startIcon: /* @__PURE__ */ S(ct, {
            icon: "mdi:message-group",
            fontSize: 20
          }),
          children: "continue Conversation"
        })
      }) : /* @__PURE__ */ S(jd, {
        loading: O,
        handleSkipConversation: B,
        handleStartConversation: $,
        saveState: T
      })
    }), y.isShowOffer && /* @__PURE__ */ G("div", {
      style: {
        height: "85%",
        overflowY: "auto"
      },
      children: [/* @__PURE__ */ S(ES, {
        offersArray: f,
        ...e
      }), /* @__PURE__ */ S(Nt, {
        direction: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        marginTop: "2rem",
        children: /* @__PURE__ */ S(st, {
          variant: "contained",
          sx: {
            textTransform: "unset"
          },
          onClick: pe,
          startIcon: /* @__PURE__ */ S(ct, {
            icon: "mdi:message-group",
            fontSize: 20
          }),
          children: "Start Conversation"
        })
      })]
    }), y.isShowForm && !y.isShowChats && /* @__PURE__ */ S(jd, {
      loading: O,
      handleSkipConversation: B,
      handleStartConversation: $,
      saveState: T
    }), y.isShowChats && !y.isShowForm && /* @__PURE__ */ G(Et, {
      children: [/* @__PURE__ */ S(vB, {
        hidden: t,
        botStyles: s,
        updatemyMessages: o,
        socket: r,
        ...e
      }), /* @__PURE__ */ S(xB, {
        updatemyMessages: o,
        visitorAccessToken: i,
        socket: r,
        botStyles: s,
        ...e
      })]
    }), y.isShowAds && /* @__PURE__ */ G("footer", {
      style: {
        position: "absolute",
        bottom: "0",
        textAlign: "center",
        width: "100%",
        fontFamily: "'Montserrat', sans-serif",
        fontSize: "0.8rem"
      },
      children: ["Powered by ", /* @__PURE__ */ S("a", {
        href: "#",
        children: "bizbot.works"
      })]
    }), /* @__PURE__ */ S(kB, {
      open: le,
      handleClose: W,
      setOpen: X,
      socket: r,
      visitorId: F
    })]
  }))();
};
x.exports.forwardRef(function(t, n) {
  return /* @__PURE__ */ S(xm, {
    elevation: 6,
    ref: n,
    variant: "filled",
    ...t
  });
});
function RB(e) {
  const {
    isBotOpen: t,
    customStyle: n,
    customPosition: r,
    loadingBot: o,
    setIsBotOpen: i,
    botStyles: s
  } = e;
  return /* @__PURE__ */ S("div", {
    children: t ? /* @__PURE__ */ S("div", {
      style: {
        zIndex: 100,
        position: "fixed",
        boxShadow: "rgb(0 0 0 / 20%) 7px -2px 15px 3px",
        overflow: "hidden",
        margin: "0 auto",
        backgroundColor: "#fff",
        borderRadius: "2.1rem",
        height: "100vh",
        width: "100vw",
        ...n,
        ...r
      },
      children: o ? /* @__PURE__ */ S(Nt, {
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        children: /* @__PURE__ */ S(qw, {})
      }) : /* @__PURE__ */ S(EB, {
        ...e
      })
    }) : /* @__PURE__ */ S("div", {
      id: "widget-btn-bounce-animation",
      style: {
        position: "fixed",
        bottom: 40,
        ...r
      },
      onClick: () => i(!0),
      children: s.widgetAvatar ? /* @__PURE__ */ S("div", {
        style: {
          cursor: "pointer"
        },
        children: /* @__PURE__ */ S("img", {
          src: s.widgetAvatar,
          width: "60",
          height: "60",
          style: {
            objectFit: "scale-down",
            borderRadius: "50%"
          }
        })
      }) : /* @__PURE__ */ G(Et, {
        children: [/* @__PURE__ */ S(ED, {
          open: !0,
          autoHideDuration: 6e3,
          children: /* @__PURE__ */ S("span", {
            style: {
              transitionProperty: "opacity",
              boxShadow: "rgb(0 18 46 / 18%) 0px 2px 20px 0px",
              height: "35px",
              whiteSpace: "nowrap",
              fontSize: "17px",
              borderRadius: "16px",
              padding: "10px 15px",
              position: "relative",
              textAlign: "center",
              left: `${s.widgetPosition == "left" ? "50px" : "-300px"}`
            },
            children: " Hi! try advance Ai chat Bot "
          })
        }), /* @__PURE__ */ S(Hn, {
          sx: {
            p: 2,
            backgroundColor: "#fff",
            boxShadow: "0 0 5px grey"
          },
          onClick: () => i(!0),
          children: /* @__PURE__ */ S(ct, {
            icon: "material-symbols:chat",
            fontSize: 25,
            color: "#696CFF"
          })
        })]
      })
    })
  });
}
const Yn = /* @__PURE__ */ Object.create(null);
Yn.open = "0";
Yn.close = "1";
Yn.ping = "2";
Yn.pong = "3";
Yn.message = "4";
Yn.upgrade = "5";
Yn.noop = "6";
const Fl = /* @__PURE__ */ Object.create(null);
Object.keys(Yn).forEach((e) => {
  Fl[Yn[e]] = e;
});
const TB = { type: "error", data: "parser error" }, PB = typeof Blob == "function" || typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]", OB = typeof ArrayBuffer == "function", $B = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e && e.buffer instanceof ArrayBuffer, OS = ({ type: e, data: t }, n, r) => PB && t instanceof Blob ? n ? r(t) : ly(t, r) : OB && (t instanceof ArrayBuffer || $B(t)) ? n ? r(t) : ly(new Blob([t]), r) : r(Yn[e] + (t || "")), ly = (e, t) => {
  const n = new FileReader();
  return n.onload = function() {
    const r = n.result.split(",")[1];
    t("b" + r);
  }, n.readAsDataURL(e);
}, cy = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", bs = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let e = 0; e < cy.length; e++)
  bs[cy.charCodeAt(e)] = e;
const _B = (e) => {
  let t = e.length * 0.75, n = e.length, r, o = 0, i, s, a, l;
  e[e.length - 1] === "=" && (t--, e[e.length - 2] === "=" && t--);
  const c = new ArrayBuffer(t), u = new Uint8Array(c);
  for (r = 0; r < n; r += 4)
    i = bs[e.charCodeAt(r)], s = bs[e.charCodeAt(r + 1)], a = bs[e.charCodeAt(r + 2)], l = bs[e.charCodeAt(r + 3)], u[o++] = i << 2 | s >> 4, u[o++] = (s & 15) << 4 | a >> 2, u[o++] = (a & 3) << 6 | l & 63;
  return c;
}, MB = typeof ArrayBuffer == "function", $S = (e, t) => {
  if (typeof e != "string")
    return {
      type: "message",
      data: _S(e, t)
    };
  const n = e.charAt(0);
  return n === "b" ? {
    type: "message",
    data: IB(e.substring(1), t)
  } : Fl[n] ? e.length > 1 ? {
    type: Fl[n],
    data: e.substring(1)
  } : {
    type: Fl[n]
  } : TB;
}, IB = (e, t) => {
  if (MB) {
    const n = _B(e);
    return _S(n, t);
  } else
    return { base64: !0, data: e };
}, _S = (e, t) => {
  switch (t) {
    case "blob":
      return e instanceof ArrayBuffer ? new Blob([e]) : e;
    case "arraybuffer":
    default:
      return e;
  }
}, MS = String.fromCharCode(30), AB = (e, t) => {
  const n = e.length, r = new Array(n);
  let o = 0;
  e.forEach((i, s) => {
    OS(i, !1, (a) => {
      r[s] = a, ++o === n && t(r.join(MS));
    });
  });
}, NB = (e, t) => {
  const n = e.split(MS), r = [];
  for (let o = 0; o < n.length; o++) {
    const i = $S(n[o], t);
    if (r.push(i), i.type === "error")
      break;
  }
  return r;
}, IS = 4;
function rt(e) {
  if (e)
    return LB(e);
}
function LB(e) {
  for (var t in rt.prototype)
    e[t] = rt.prototype[t];
  return e;
}
rt.prototype.on = rt.prototype.addEventListener = function(e, t) {
  return this._callbacks = this._callbacks || {}, (this._callbacks["$" + e] = this._callbacks["$" + e] || []).push(t), this;
};
rt.prototype.once = function(e, t) {
  function n() {
    this.off(e, n), t.apply(this, arguments);
  }
  return n.fn = t, this.on(e, n), this;
};
rt.prototype.off = rt.prototype.removeListener = rt.prototype.removeAllListeners = rt.prototype.removeEventListener = function(e, t) {
  if (this._callbacks = this._callbacks || {}, arguments.length == 0)
    return this._callbacks = {}, this;
  var n = this._callbacks["$" + e];
  if (!n)
    return this;
  if (arguments.length == 1)
    return delete this._callbacks["$" + e], this;
  for (var r, o = 0; o < n.length; o++)
    if (r = n[o], r === t || r.fn === t) {
      n.splice(o, 1);
      break;
    }
  return n.length === 0 && delete this._callbacks["$" + e], this;
};
rt.prototype.emit = function(e) {
  this._callbacks = this._callbacks || {};
  for (var t = new Array(arguments.length - 1), n = this._callbacks["$" + e], r = 1; r < arguments.length; r++)
    t[r - 1] = arguments[r];
  if (n) {
    n = n.slice(0);
    for (var r = 0, o = n.length; r < o; ++r)
      n[r].apply(this, t);
  }
  return this;
};
rt.prototype.emitReserved = rt.prototype.emit;
rt.prototype.listeners = function(e) {
  return this._callbacks = this._callbacks || {}, this._callbacks["$" + e] || [];
};
rt.prototype.hasListeners = function(e) {
  return !!this.listeners(e).length;
};
const _r = (() => typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")())();
function AS(e, ...t) {
  return t.reduce((n, r) => (e.hasOwnProperty(r) && (n[r] = e[r]), n), {});
}
const FB = setTimeout, DB = clearTimeout;
function Fu(e, t) {
  t.useNativeTimers ? (e.setTimeoutFn = FB.bind(_r), e.clearTimeoutFn = DB.bind(_r)) : (e.setTimeoutFn = setTimeout.bind(_r), e.clearTimeoutFn = clearTimeout.bind(_r));
}
const zB = 1.33;
function BB(e) {
  return typeof e == "string" ? jB(e) : Math.ceil((e.byteLength || e.size) * zB);
}
function jB(e) {
  let t = 0, n = 0;
  for (let r = 0, o = e.length; r < o; r++)
    t = e.charCodeAt(r), t < 128 ? n += 1 : t < 2048 ? n += 2 : t < 55296 || t >= 57344 ? n += 3 : (r++, n += 4);
  return n;
}
class WB extends Error {
  constructor(t, n, r) {
    super(t), this.description = n, this.context = r, this.type = "TransportError";
  }
}
class NS extends rt {
  constructor(t) {
    super(), this.writable = !1, Fu(this, t), this.opts = t, this.query = t.query, this.readyState = "", this.socket = t.socket;
  }
  onError(t, n, r) {
    return super.emitReserved("error", new WB(t, n, r)), this;
  }
  open() {
    return (this.readyState === "closed" || this.readyState === "") && (this.readyState = "opening", this.doOpen()), this;
  }
  close() {
    return (this.readyState === "opening" || this.readyState === "open") && (this.doClose(), this.onClose()), this;
  }
  send(t) {
    this.readyState === "open" && this.write(t);
  }
  onOpen() {
    this.readyState = "open", this.writable = !0, super.emitReserved("open");
  }
  onData(t) {
    const n = $S(t, this.socket.binaryType);
    this.onPacket(n);
  }
  onPacket(t) {
    super.emitReserved("packet", t);
  }
  onClose(t) {
    this.readyState = "closed", super.emitReserved("close", t);
  }
}
const LS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""), bp = 64, UB = {};
let uy = 0, fl = 0, dy;
function fy(e) {
  let t = "";
  do
    t = LS[e % bp] + t, e = Math.floor(e / bp);
  while (e > 0);
  return t;
}
function FS() {
  const e = fy(+new Date());
  return e !== dy ? (uy = 0, dy = e) : e + "." + fy(uy++);
}
for (; fl < bp; fl++)
  UB[LS[fl]] = fl;
function DS(e) {
  let t = "";
  for (let n in e)
    e.hasOwnProperty(n) && (t.length && (t += "&"), t += encodeURIComponent(n) + "=" + encodeURIComponent(e[n]));
  return t;
}
function HB(e) {
  let t = {}, n = e.split("&");
  for (let r = 0, o = n.length; r < o; r++) {
    let i = n[r].split("=");
    t[decodeURIComponent(i[0])] = decodeURIComponent(i[1]);
  }
  return t;
}
let zS = !1;
try {
  zS = typeof XMLHttpRequest < "u" && "withCredentials" in new XMLHttpRequest();
} catch {
}
const VB = zS;
function BS(e) {
  const t = e.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!t || VB))
      return new XMLHttpRequest();
  } catch {
  }
  if (!t)
    try {
      return new _r[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch {
    }
}
function YB() {
}
const XB = function() {
  return new BS({
    xdomain: !1
  }).responseType != null;
}();
class KB extends NS {
  constructor(t) {
    if (super(t), this.polling = !1, typeof location < "u") {
      const r = location.protocol === "https:";
      let o = location.port;
      o || (o = r ? "443" : "80"), this.xd = typeof location < "u" && t.hostname !== location.hostname || o !== t.port, this.xs = t.secure !== r;
    }
    const n = t && t.forceBase64;
    this.supportsBinary = XB && !n;
  }
  get name() {
    return "polling";
  }
  doOpen() {
    this.poll();
  }
  pause(t) {
    this.readyState = "pausing";
    const n = () => {
      this.readyState = "paused", t();
    };
    if (this.polling || !this.writable) {
      let r = 0;
      this.polling && (r++, this.once("pollComplete", function() {
        --r || n();
      })), this.writable || (r++, this.once("drain", function() {
        --r || n();
      }));
    } else
      n();
  }
  poll() {
    this.polling = !0, this.doPoll(), this.emitReserved("poll");
  }
  onData(t) {
    const n = (r) => {
      if (this.readyState === "opening" && r.type === "open" && this.onOpen(), r.type === "close")
        return this.onClose({ description: "transport closed by the server" }), !1;
      this.onPacket(r);
    };
    NB(t, this.socket.binaryType).forEach(n), this.readyState !== "closed" && (this.polling = !1, this.emitReserved("pollComplete"), this.readyState === "open" && this.poll());
  }
  doClose() {
    const t = () => {
      this.write([{ type: "close" }]);
    };
    this.readyState === "open" ? t() : this.once("open", t);
  }
  write(t) {
    this.writable = !1, AB(t, (n) => {
      this.doWrite(n, () => {
        this.writable = !0, this.emitReserved("drain");
      });
    });
  }
  uri() {
    let t = this.query || {};
    const n = this.opts.secure ? "https" : "http";
    let r = "";
    this.opts.timestampRequests !== !1 && (t[this.opts.timestampParam] = FS()), !this.supportsBinary && !t.sid && (t.b64 = 1), this.opts.port && (n === "https" && Number(this.opts.port) !== 443 || n === "http" && Number(this.opts.port) !== 80) && (r = ":" + this.opts.port);
    const o = DS(t), i = this.opts.hostname.indexOf(":") !== -1;
    return n + "://" + (i ? "[" + this.opts.hostname + "]" : this.opts.hostname) + r + this.opts.path + (o.length ? "?" + o : "");
  }
  request(t = {}) {
    return Object.assign(t, { xd: this.xd, xs: this.xs }, this.opts), new Bn(this.uri(), t);
  }
  doWrite(t, n) {
    const r = this.request({
      method: "POST",
      data: t
    });
    r.on("success", n), r.on("error", (o, i) => {
      this.onError("xhr post error", o, i);
    });
  }
  doPoll() {
    const t = this.request();
    t.on("data", this.onData.bind(this)), t.on("error", (n, r) => {
      this.onError("xhr poll error", n, r);
    }), this.pollXhr = t;
  }
}
class Bn extends rt {
  constructor(t, n) {
    super(), Fu(this, n), this.opts = n, this.method = n.method || "GET", this.uri = t, this.async = n.async !== !1, this.data = n.data !== void 0 ? n.data : null, this.create();
  }
  create() {
    const t = AS(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    t.xdomain = !!this.opts.xd, t.xscheme = !!this.opts.xs;
    const n = this.xhr = new BS(t);
    try {
      n.open(this.method, this.uri, this.async);
      try {
        if (this.opts.extraHeaders) {
          n.setDisableHeaderCheck && n.setDisableHeaderCheck(!0);
          for (let r in this.opts.extraHeaders)
            this.opts.extraHeaders.hasOwnProperty(r) && n.setRequestHeader(r, this.opts.extraHeaders[r]);
        }
      } catch {
      }
      if (this.method === "POST")
        try {
          n.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch {
        }
      try {
        n.setRequestHeader("Accept", "*/*");
      } catch {
      }
      "withCredentials" in n && (n.withCredentials = this.opts.withCredentials), this.opts.requestTimeout && (n.timeout = this.opts.requestTimeout), n.onreadystatechange = () => {
        n.readyState === 4 && (n.status === 200 || n.status === 1223 ? this.onLoad() : this.setTimeoutFn(() => {
          this.onError(typeof n.status == "number" ? n.status : 0);
        }, 0));
      }, n.send(this.data);
    } catch (r) {
      this.setTimeoutFn(() => {
        this.onError(r);
      }, 0);
      return;
    }
    typeof document < "u" && (this.index = Bn.requestsCount++, Bn.requests[this.index] = this);
  }
  onError(t) {
    this.emitReserved("error", t, this.xhr), this.cleanup(!0);
  }
  cleanup(t) {
    if (!(typeof this.xhr > "u" || this.xhr === null)) {
      if (this.xhr.onreadystatechange = YB, t)
        try {
          this.xhr.abort();
        } catch {
        }
      typeof document < "u" && delete Bn.requests[this.index], this.xhr = null;
    }
  }
  onLoad() {
    const t = this.xhr.responseText;
    t !== null && (this.emitReserved("data", t), this.emitReserved("success"), this.cleanup());
  }
  abort() {
    this.cleanup();
  }
}
Bn.requestsCount = 0;
Bn.requests = {};
if (typeof document < "u") {
  if (typeof attachEvent == "function")
    attachEvent("onunload", py);
  else if (typeof addEventListener == "function") {
    const e = "onpagehide" in _r ? "pagehide" : "unload";
    addEventListener(e, py, !1);
  }
}
function py() {
  for (let e in Bn.requests)
    Bn.requests.hasOwnProperty(e) && Bn.requests[e].abort();
}
const jS = (() => typeof Promise == "function" && typeof Promise.resolve == "function" ? (t) => Promise.resolve().then(t) : (t, n) => n(t, 0))(), pl = _r.WebSocket || _r.MozWebSocket, hy = !0, qB = "arraybuffer", my = typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class GB extends NS {
  constructor(t) {
    super(t), this.supportsBinary = !t.forceBase64;
  }
  get name() {
    return "websocket";
  }
  doOpen() {
    if (!this.check())
      return;
    const t = this.uri(), n = this.opts.protocols, r = my ? {} : AS(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    this.opts.extraHeaders && (r.headers = this.opts.extraHeaders);
    try {
      this.ws = hy && !my ? n ? new pl(t, n) : new pl(t) : new pl(t, n, r);
    } catch (o) {
      return this.emitReserved("error", o);
    }
    this.ws.binaryType = this.socket.binaryType || qB, this.addEventListeners();
  }
  addEventListeners() {
    this.ws.onopen = () => {
      this.opts.autoUnref && this.ws._socket.unref(), this.onOpen();
    }, this.ws.onclose = (t) => this.onClose({
      description: "websocket connection closed",
      context: t
    }), this.ws.onmessage = (t) => this.onData(t.data), this.ws.onerror = (t) => this.onError("websocket error", t);
  }
  write(t) {
    this.writable = !1;
    for (let n = 0; n < t.length; n++) {
      const r = t[n], o = n === t.length - 1;
      OS(r, this.supportsBinary, (i) => {
        const s = {};
        try {
          hy && this.ws.send(i);
        } catch {
        }
        o && jS(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    typeof this.ws < "u" && (this.ws.close(), this.ws = null);
  }
  uri() {
    let t = this.query || {};
    const n = this.opts.secure ? "wss" : "ws";
    let r = "";
    this.opts.port && (n === "wss" && Number(this.opts.port) !== 443 || n === "ws" && Number(this.opts.port) !== 80) && (r = ":" + this.opts.port), this.opts.timestampRequests && (t[this.opts.timestampParam] = FS()), this.supportsBinary || (t.b64 = 1);
    const o = DS(t), i = this.opts.hostname.indexOf(":") !== -1;
    return n + "://" + (i ? "[" + this.opts.hostname + "]" : this.opts.hostname) + r + this.opts.path + (o.length ? "?" + o : "");
  }
  check() {
    return !!pl;
  }
}
const QB = {
  websocket: GB,
  polling: KB
}, JB = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, ZB = [
  "source",
  "protocol",
  "authority",
  "userInfo",
  "user",
  "password",
  "host",
  "port",
  "relative",
  "path",
  "directory",
  "file",
  "query",
  "anchor"
];
function xp(e) {
  const t = e, n = e.indexOf("["), r = e.indexOf("]");
  n != -1 && r != -1 && (e = e.substring(0, n) + e.substring(n, r).replace(/:/g, ";") + e.substring(r, e.length));
  let o = JB.exec(e || ""), i = {}, s = 14;
  for (; s--; )
    i[ZB[s]] = o[s] || "";
  return n != -1 && r != -1 && (i.source = t, i.host = i.host.substring(1, i.host.length - 1).replace(/;/g, ":"), i.authority = i.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), i.ipv6uri = !0), i.pathNames = e6(i, i.path), i.queryKey = t6(i, i.query), i;
}
function e6(e, t) {
  const n = /\/{2,9}/g, r = t.replace(n, "/").split("/");
  return (t.slice(0, 1) == "/" || t.length === 0) && r.splice(0, 1), t.slice(-1) == "/" && r.splice(r.length - 1, 1), r;
}
function t6(e, t) {
  const n = {};
  return t.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(r, o, i) {
    o && (n[o] = i);
  }), n;
}
class Rr extends rt {
  constructor(t, n = {}) {
    super(), t && typeof t == "object" && (n = t, t = null), t ? (t = xp(t), n.hostname = t.host, n.secure = t.protocol === "https" || t.protocol === "wss", n.port = t.port, t.query && (n.query = t.query)) : n.host && (n.hostname = xp(n.host).host), Fu(this, n), this.secure = n.secure != null ? n.secure : typeof location < "u" && location.protocol === "https:", n.hostname && !n.port && (n.port = this.secure ? "443" : "80"), this.hostname = n.hostname || (typeof location < "u" ? location.hostname : "localhost"), this.port = n.port || (typeof location < "u" && location.port ? location.port : this.secure ? "443" : "80"), this.transports = n.transports || ["polling", "websocket"], this.readyState = "", this.writeBuffer = [], this.prevBufferLen = 0, this.opts = Object.assign({
      path: "/engine.io",
      agent: !1,
      withCredentials: !1,
      upgrade: !0,
      timestampParam: "t",
      rememberUpgrade: !1,
      rejectUnauthorized: !0,
      perMessageDeflate: {
        threshold: 1024
      },
      transportOptions: {},
      closeOnBeforeunload: !0
    }, n), this.opts.path = this.opts.path.replace(/\/$/, "") + "/", typeof this.opts.query == "string" && (this.opts.query = HB(this.opts.query)), this.id = null, this.upgrades = null, this.pingInterval = null, this.pingTimeout = null, this.pingTimeoutTimer = null, typeof addEventListener == "function" && (this.opts.closeOnBeforeunload && (this.beforeunloadEventListener = () => {
      this.transport && (this.transport.removeAllListeners(), this.transport.close());
    }, addEventListener("beforeunload", this.beforeunloadEventListener, !1)), this.hostname !== "localhost" && (this.offlineEventListener = () => {
      this.onClose("transport close", {
        description: "network connection lost"
      });
    }, addEventListener("offline", this.offlineEventListener, !1))), this.open();
  }
  createTransport(t) {
    const n = Object.assign({}, this.opts.query);
    n.EIO = IS, n.transport = t, this.id && (n.sid = this.id);
    const r = Object.assign({}, this.opts.transportOptions[t], this.opts, {
      query: n,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    });
    return new QB[t](r);
  }
  open() {
    let t;
    if (this.opts.rememberUpgrade && Rr.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1)
      t = "websocket";
    else if (this.transports.length === 0) {
      this.setTimeoutFn(() => {
        this.emitReserved("error", "No transports available");
      }, 0);
      return;
    } else
      t = this.transports[0];
    this.readyState = "opening";
    try {
      t = this.createTransport(t);
    } catch {
      this.transports.shift(), this.open();
      return;
    }
    t.open(), this.setTransport(t);
  }
  setTransport(t) {
    this.transport && this.transport.removeAllListeners(), this.transport = t, t.on("drain", this.onDrain.bind(this)).on("packet", this.onPacket.bind(this)).on("error", this.onError.bind(this)).on("close", (n) => this.onClose("transport close", n));
  }
  probe(t) {
    let n = this.createTransport(t), r = !1;
    Rr.priorWebsocketSuccess = !1;
    const o = () => {
      r || (n.send([{ type: "ping", data: "probe" }]), n.once("packet", (f) => {
        if (!r)
          if (f.type === "pong" && f.data === "probe") {
            if (this.upgrading = !0, this.emitReserved("upgrading", n), !n)
              return;
            Rr.priorWebsocketSuccess = n.name === "websocket", this.transport.pause(() => {
              r || this.readyState !== "closed" && (u(), this.setTransport(n), n.send([{ type: "upgrade" }]), this.emitReserved("upgrade", n), n = null, this.upgrading = !1, this.flush());
            });
          } else {
            const h = new Error("probe error");
            h.transport = n.name, this.emitReserved("upgradeError", h);
          }
      }));
    };
    function i() {
      r || (r = !0, u(), n.close(), n = null);
    }
    const s = (f) => {
      const h = new Error("probe error: " + f);
      h.transport = n.name, i(), this.emitReserved("upgradeError", h);
    };
    function a() {
      s("transport closed");
    }
    function l() {
      s("socket closed");
    }
    function c(f) {
      n && f.name !== n.name && i();
    }
    const u = () => {
      n.removeListener("open", o), n.removeListener("error", s), n.removeListener("close", a), this.off("close", l), this.off("upgrading", c);
    };
    n.once("open", o), n.once("error", s), n.once("close", a), this.once("close", l), this.once("upgrading", c), n.open();
  }
  onOpen() {
    if (this.readyState = "open", Rr.priorWebsocketSuccess = this.transport.name === "websocket", this.emitReserved("open"), this.flush(), this.readyState === "open" && this.opts.upgrade && this.transport.pause) {
      let t = 0;
      const n = this.upgrades.length;
      for (; t < n; t++)
        this.probe(this.upgrades[t]);
    }
  }
  onPacket(t) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing")
      switch (this.emitReserved("packet", t), this.emitReserved("heartbeat"), t.type) {
        case "open":
          this.onHandshake(JSON.parse(t.data));
          break;
        case "ping":
          this.resetPingTimeout(), this.sendPacket("pong"), this.emitReserved("ping"), this.emitReserved("pong");
          break;
        case "error":
          const n = new Error("server error");
          n.code = t.data, this.onError(n);
          break;
        case "message":
          this.emitReserved("data", t.data), this.emitReserved("message", t.data);
          break;
      }
  }
  onHandshake(t) {
    this.emitReserved("handshake", t), this.id = t.sid, this.transport.query.sid = t.sid, this.upgrades = this.filterUpgrades(t.upgrades), this.pingInterval = t.pingInterval, this.pingTimeout = t.pingTimeout, this.maxPayload = t.maxPayload, this.onOpen(), this.readyState !== "closed" && this.resetPingTimeout();
  }
  resetPingTimeout() {
    this.clearTimeoutFn(this.pingTimeoutTimer), this.pingTimeoutTimer = this.setTimeoutFn(() => {
      this.onClose("ping timeout");
    }, this.pingInterval + this.pingTimeout), this.opts.autoUnref && this.pingTimeoutTimer.unref();
  }
  onDrain() {
    this.writeBuffer.splice(0, this.prevBufferLen), this.prevBufferLen = 0, this.writeBuffer.length === 0 ? this.emitReserved("drain") : this.flush();
  }
  flush() {
    if (this.readyState !== "closed" && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const t = this.getWritablePackets();
      this.transport.send(t), this.prevBufferLen = t.length, this.emitReserved("flush");
    }
  }
  getWritablePackets() {
    if (!(this.maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1))
      return this.writeBuffer;
    let n = 1;
    for (let r = 0; r < this.writeBuffer.length; r++) {
      const o = this.writeBuffer[r].data;
      if (o && (n += BB(o)), r > 0 && n > this.maxPayload)
        return this.writeBuffer.slice(0, r);
      n += 2;
    }
    return this.writeBuffer;
  }
  write(t, n, r) {
    return this.sendPacket("message", t, n, r), this;
  }
  send(t, n, r) {
    return this.sendPacket("message", t, n, r), this;
  }
  sendPacket(t, n, r, o) {
    if (typeof n == "function" && (o = n, n = void 0), typeof r == "function" && (o = r, r = null), this.readyState === "closing" || this.readyState === "closed")
      return;
    r = r || {}, r.compress = r.compress !== !1;
    const i = {
      type: t,
      data: n,
      options: r
    };
    this.emitReserved("packetCreate", i), this.writeBuffer.push(i), o && this.once("flush", o), this.flush();
  }
  close() {
    const t = () => {
      this.onClose("forced close"), this.transport.close();
    }, n = () => {
      this.off("upgrade", n), this.off("upgradeError", n), t();
    }, r = () => {
      this.once("upgrade", n), this.once("upgradeError", n);
    };
    return (this.readyState === "opening" || this.readyState === "open") && (this.readyState = "closing", this.writeBuffer.length ? this.once("drain", () => {
      this.upgrading ? r() : t();
    }) : this.upgrading ? r() : t()), this;
  }
  onError(t) {
    Rr.priorWebsocketSuccess = !1, this.emitReserved("error", t), this.onClose("transport error", t);
  }
  onClose(t, n) {
    (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing") && (this.clearTimeoutFn(this.pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), typeof removeEventListener == "function" && (removeEventListener("beforeunload", this.beforeunloadEventListener, !1), removeEventListener("offline", this.offlineEventListener, !1)), this.readyState = "closed", this.id = null, this.emitReserved("close", t, n), this.writeBuffer = [], this.prevBufferLen = 0);
  }
  filterUpgrades(t) {
    const n = [];
    let r = 0;
    const o = t.length;
    for (; r < o; r++)
      ~this.transports.indexOf(t[r]) && n.push(t[r]);
    return n;
  }
}
Rr.protocol = IS;
function n6(e, t = "", n) {
  let r = e;
  n = n || typeof location < "u" && location, e == null && (e = n.protocol + "//" + n.host), typeof e == "string" && (e.charAt(0) === "/" && (e.charAt(1) === "/" ? e = n.protocol + e : e = n.host + e), /^(https?|wss?):\/\//.test(e) || (typeof n < "u" ? e = n.protocol + "//" + e : e = "https://" + e), r = xp(e)), r.port || (/^(http|ws)$/.test(r.protocol) ? r.port = "80" : /^(http|ws)s$/.test(r.protocol) && (r.port = "443")), r.path = r.path || "/";
  const i = r.host.indexOf(":") !== -1 ? "[" + r.host + "]" : r.host;
  return r.id = r.protocol + "://" + i + ":" + r.port + t, r.href = r.protocol + "://" + i + (n && n.port === r.port ? "" : ":" + r.port), r;
}
const r6 = typeof ArrayBuffer == "function", o6 = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e.buffer instanceof ArrayBuffer, WS = Object.prototype.toString, i6 = typeof Blob == "function" || typeof Blob < "u" && WS.call(Blob) === "[object BlobConstructor]", s6 = typeof File == "function" || typeof File < "u" && WS.call(File) === "[object FileConstructor]";
function Om(e) {
  return r6 && (e instanceof ArrayBuffer || o6(e)) || i6 && e instanceof Blob || s6 && e instanceof File;
}
function Dl(e, t) {
  if (!e || typeof e != "object")
    return !1;
  if (Array.isArray(e)) {
    for (let n = 0, r = e.length; n < r; n++)
      if (Dl(e[n]))
        return !0;
    return !1;
  }
  if (Om(e))
    return !0;
  if (e.toJSON && typeof e.toJSON == "function" && arguments.length === 1)
    return Dl(e.toJSON(), !0);
  for (const n in e)
    if (Object.prototype.hasOwnProperty.call(e, n) && Dl(e[n]))
      return !0;
  return !1;
}
function a6(e) {
  const t = [], n = e.data, r = e;
  return r.data = wp(n, t), r.attachments = t.length, { packet: r, buffers: t };
}
function wp(e, t) {
  if (!e)
    return e;
  if (Om(e)) {
    const n = { _placeholder: !0, num: t.length };
    return t.push(e), n;
  } else if (Array.isArray(e)) {
    const n = new Array(e.length);
    for (let r = 0; r < e.length; r++)
      n[r] = wp(e[r], t);
    return n;
  } else if (typeof e == "object" && !(e instanceof Date)) {
    const n = {};
    for (const r in e)
      Object.prototype.hasOwnProperty.call(e, r) && (n[r] = wp(e[r], t));
    return n;
  }
  return e;
}
function l6(e, t) {
  return e.data = Sp(e.data, t), e.attachments = void 0, e;
}
function Sp(e, t) {
  if (!e)
    return e;
  if (e && e._placeholder === !0) {
    if (typeof e.num == "number" && e.num >= 0 && e.num < t.length)
      return t[e.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(e))
    for (let n = 0; n < e.length; n++)
      e[n] = Sp(e[n], t);
  else if (typeof e == "object")
    for (const n in e)
      Object.prototype.hasOwnProperty.call(e, n) && (e[n] = Sp(e[n], t));
  return e;
}
const c6 = 5;
var Se;
(function(e) {
  e[e.CONNECT = 0] = "CONNECT", e[e.DISCONNECT = 1] = "DISCONNECT", e[e.EVENT = 2] = "EVENT", e[e.ACK = 3] = "ACK", e[e.CONNECT_ERROR = 4] = "CONNECT_ERROR", e[e.BINARY_EVENT = 5] = "BINARY_EVENT", e[e.BINARY_ACK = 6] = "BINARY_ACK";
})(Se || (Se = {}));
class u6 {
  constructor(t) {
    this.replacer = t;
  }
  encode(t) {
    return (t.type === Se.EVENT || t.type === Se.ACK) && Dl(t) ? (t.type = t.type === Se.EVENT ? Se.BINARY_EVENT : Se.BINARY_ACK, this.encodeAsBinary(t)) : [this.encodeAsString(t)];
  }
  encodeAsString(t) {
    let n = "" + t.type;
    return (t.type === Se.BINARY_EVENT || t.type === Se.BINARY_ACK) && (n += t.attachments + "-"), t.nsp && t.nsp !== "/" && (n += t.nsp + ","), t.id != null && (n += t.id), t.data != null && (n += JSON.stringify(t.data, this.replacer)), n;
  }
  encodeAsBinary(t) {
    const n = a6(t), r = this.encodeAsString(n.packet), o = n.buffers;
    return o.unshift(r), o;
  }
}
class $m extends rt {
  constructor(t) {
    super(), this.reviver = t;
  }
  add(t) {
    let n;
    if (typeof t == "string") {
      if (this.reconstructor)
        throw new Error("got plaintext data when reconstructing a packet");
      n = this.decodeString(t), n.type === Se.BINARY_EVENT || n.type === Se.BINARY_ACK ? (this.reconstructor = new d6(n), n.attachments === 0 && super.emitReserved("decoded", n)) : super.emitReserved("decoded", n);
    } else if (Om(t) || t.base64)
      if (this.reconstructor)
        n = this.reconstructor.takeBinaryData(t), n && (this.reconstructor = null, super.emitReserved("decoded", n));
      else
        throw new Error("got binary data when not reconstructing a packet");
    else
      throw new Error("Unknown type: " + t);
  }
  decodeString(t) {
    let n = 0;
    const r = {
      type: Number(t.charAt(0))
    };
    if (Se[r.type] === void 0)
      throw new Error("unknown packet type " + r.type);
    if (r.type === Se.BINARY_EVENT || r.type === Se.BINARY_ACK) {
      const i = n + 1;
      for (; t.charAt(++n) !== "-" && n != t.length; )
        ;
      const s = t.substring(i, n);
      if (s != Number(s) || t.charAt(n) !== "-")
        throw new Error("Illegal attachments");
      r.attachments = Number(s);
    }
    if (t.charAt(n + 1) === "/") {
      const i = n + 1;
      for (; ++n && !(t.charAt(n) === "," || n === t.length); )
        ;
      r.nsp = t.substring(i, n);
    } else
      r.nsp = "/";
    const o = t.charAt(n + 1);
    if (o !== "" && Number(o) == o) {
      const i = n + 1;
      for (; ++n; ) {
        const s = t.charAt(n);
        if (s == null || Number(s) != s) {
          --n;
          break;
        }
        if (n === t.length)
          break;
      }
      r.id = Number(t.substring(i, n + 1));
    }
    if (t.charAt(++n)) {
      const i = this.tryParse(t.substr(n));
      if ($m.isPayloadValid(r.type, i))
        r.data = i;
      else
        throw new Error("invalid payload");
    }
    return r;
  }
  tryParse(t) {
    try {
      return JSON.parse(t, this.reviver);
    } catch {
      return !1;
    }
  }
  static isPayloadValid(t, n) {
    switch (t) {
      case Se.CONNECT:
        return typeof n == "object";
      case Se.DISCONNECT:
        return n === void 0;
      case Se.CONNECT_ERROR:
        return typeof n == "string" || typeof n == "object";
      case Se.EVENT:
      case Se.BINARY_EVENT:
        return Array.isArray(n) && n.length > 0;
      case Se.ACK:
      case Se.BINARY_ACK:
        return Array.isArray(n);
    }
  }
  destroy() {
    this.reconstructor && this.reconstructor.finishedReconstruction();
  }
}
class d6 {
  constructor(t) {
    this.packet = t, this.buffers = [], this.reconPack = t;
  }
  takeBinaryData(t) {
    if (this.buffers.push(t), this.buffers.length === this.reconPack.attachments) {
      const n = l6(this.reconPack, this.buffers);
      return this.finishedReconstruction(), n;
    }
    return null;
  }
  finishedReconstruction() {
    this.reconPack = null, this.buffers = [];
  }
}
const f6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  protocol: c6,
  get PacketType() {
    return Se;
  },
  Encoder: u6,
  Decoder: $m
}, Symbol.toStringTag, { value: "Module" }));
function wn(e, t, n) {
  return e.on(t, n), function() {
    e.off(t, n);
  };
}
const p6 = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  newListener: 1,
  removeListener: 1
});
class US extends rt {
  constructor(t, n, r) {
    super(), this.connected = !1, this.receiveBuffer = [], this.sendBuffer = [], this.ids = 0, this.acks = {}, this.flags = {}, this.io = t, this.nsp = n, r && r.auth && (this.auth = r.auth), this.io._autoConnect && this.open();
  }
  get disconnected() {
    return !this.connected;
  }
  subEvents() {
    if (this.subs)
      return;
    const t = this.io;
    this.subs = [
      wn(t, "open", this.onopen.bind(this)),
      wn(t, "packet", this.onpacket.bind(this)),
      wn(t, "error", this.onerror.bind(this)),
      wn(t, "close", this.onclose.bind(this))
    ];
  }
  get active() {
    return !!this.subs;
  }
  connect() {
    return this.connected ? this : (this.subEvents(), this.io._reconnecting || this.io.open(), this.io._readyState === "open" && this.onopen(), this);
  }
  open() {
    return this.connect();
  }
  send(...t) {
    return t.unshift("message"), this.emit.apply(this, t), this;
  }
  emit(t, ...n) {
    if (p6.hasOwnProperty(t))
      throw new Error('"' + t.toString() + '" is a reserved event name');
    n.unshift(t);
    const r = {
      type: Se.EVENT,
      data: n
    };
    if (r.options = {}, r.options.compress = this.flags.compress !== !1, typeof n[n.length - 1] == "function") {
      const s = this.ids++, a = n.pop();
      this._registerAckCallback(s, a), r.id = s;
    }
    const o = this.io.engine && this.io.engine.transport && this.io.engine.transport.writable;
    return this.flags.volatile && (!o || !this.connected) || (this.connected ? (this.notifyOutgoingListeners(r), this.packet(r)) : this.sendBuffer.push(r)), this.flags = {}, this;
  }
  _registerAckCallback(t, n) {
    const r = this.flags.timeout;
    if (r === void 0) {
      this.acks[t] = n;
      return;
    }
    const o = this.io.setTimeoutFn(() => {
      delete this.acks[t];
      for (let i = 0; i < this.sendBuffer.length; i++)
        this.sendBuffer[i].id === t && this.sendBuffer.splice(i, 1);
      n.call(this, new Error("operation has timed out"));
    }, r);
    this.acks[t] = (...i) => {
      this.io.clearTimeoutFn(o), n.apply(this, [null, ...i]);
    };
  }
  packet(t) {
    t.nsp = this.nsp, this.io._packet(t);
  }
  onopen() {
    typeof this.auth == "function" ? this.auth((t) => {
      this.packet({ type: Se.CONNECT, data: t });
    }) : this.packet({ type: Se.CONNECT, data: this.auth });
  }
  onerror(t) {
    this.connected || this.emitReserved("connect_error", t);
  }
  onclose(t, n) {
    this.connected = !1, delete this.id, this.emitReserved("disconnect", t, n);
  }
  onpacket(t) {
    if (t.nsp === this.nsp)
      switch (t.type) {
        case Se.CONNECT:
          if (t.data && t.data.sid) {
            const o = t.data.sid;
            this.onconnect(o);
          } else
            this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          break;
        case Se.EVENT:
        case Se.BINARY_EVENT:
          this.onevent(t);
          break;
        case Se.ACK:
        case Se.BINARY_ACK:
          this.onack(t);
          break;
        case Se.DISCONNECT:
          this.ondisconnect();
          break;
        case Se.CONNECT_ERROR:
          this.destroy();
          const r = new Error(t.data.message);
          r.data = t.data.data, this.emitReserved("connect_error", r);
          break;
      }
  }
  onevent(t) {
    const n = t.data || [];
    t.id != null && n.push(this.ack(t.id)), this.connected ? this.emitEvent(n) : this.receiveBuffer.push(Object.freeze(n));
  }
  emitEvent(t) {
    if (this._anyListeners && this._anyListeners.length) {
      const n = this._anyListeners.slice();
      for (const r of n)
        r.apply(this, t);
    }
    super.emit.apply(this, t);
  }
  ack(t) {
    const n = this;
    let r = !1;
    return function(...o) {
      r || (r = !0, n.packet({
        type: Se.ACK,
        id: t,
        data: o
      }));
    };
  }
  onack(t) {
    const n = this.acks[t.id];
    typeof n == "function" && (n.apply(this, t.data), delete this.acks[t.id]);
  }
  onconnect(t) {
    this.id = t, this.connected = !0, this.emitBuffered(), this.emitReserved("connect");
  }
  emitBuffered() {
    this.receiveBuffer.forEach((t) => this.emitEvent(t)), this.receiveBuffer = [], this.sendBuffer.forEach((t) => {
      this.notifyOutgoingListeners(t), this.packet(t);
    }), this.sendBuffer = [];
  }
  ondisconnect() {
    this.destroy(), this.onclose("io server disconnect");
  }
  destroy() {
    this.subs && (this.subs.forEach((t) => t()), this.subs = void 0), this.io._destroy(this);
  }
  disconnect() {
    return this.connected && this.packet({ type: Se.DISCONNECT }), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
  }
  close() {
    return this.disconnect();
  }
  compress(t) {
    return this.flags.compress = t, this;
  }
  get volatile() {
    return this.flags.volatile = !0, this;
  }
  timeout(t) {
    return this.flags.timeout = t, this;
  }
  onAny(t) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.push(t), this;
  }
  prependAny(t) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.unshift(t), this;
  }
  offAny(t) {
    if (!this._anyListeners)
      return this;
    if (t) {
      const n = this._anyListeners;
      for (let r = 0; r < n.length; r++)
        if (t === n[r])
          return n.splice(r, 1), this;
    } else
      this._anyListeners = [];
    return this;
  }
  listenersAny() {
    return this._anyListeners || [];
  }
  onAnyOutgoing(t) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.push(t), this;
  }
  prependAnyOutgoing(t) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.unshift(t), this;
  }
  offAnyOutgoing(t) {
    if (!this._anyOutgoingListeners)
      return this;
    if (t) {
      const n = this._anyOutgoingListeners;
      for (let r = 0; r < n.length; r++)
        if (t === n[r])
          return n.splice(r, 1), this;
    } else
      this._anyOutgoingListeners = [];
    return this;
  }
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  notifyOutgoingListeners(t) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const n = this._anyOutgoingListeners.slice();
      for (const r of n)
        r.apply(this, t.data);
    }
  }
}
function zi(e) {
  e = e || {}, this.ms = e.min || 100, this.max = e.max || 1e4, this.factor = e.factor || 2, this.jitter = e.jitter > 0 && e.jitter <= 1 ? e.jitter : 0, this.attempts = 0;
}
zi.prototype.duration = function() {
  var e = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var t = Math.random(), n = Math.floor(t * this.jitter * e);
    e = (Math.floor(t * 10) & 1) == 0 ? e - n : e + n;
  }
  return Math.min(e, this.max) | 0;
};
zi.prototype.reset = function() {
  this.attempts = 0;
};
zi.prototype.setMin = function(e) {
  this.ms = e;
};
zi.prototype.setMax = function(e) {
  this.max = e;
};
zi.prototype.setJitter = function(e) {
  this.jitter = e;
};
class Cp extends rt {
  constructor(t, n) {
    var r;
    super(), this.nsps = {}, this.subs = [], t && typeof t == "object" && (n = t, t = void 0), n = n || {}, n.path = n.path || "/socket.io", this.opts = n, Fu(this, n), this.reconnection(n.reconnection !== !1), this.reconnectionAttempts(n.reconnectionAttempts || 1 / 0), this.reconnectionDelay(n.reconnectionDelay || 1e3), this.reconnectionDelayMax(n.reconnectionDelayMax || 5e3), this.randomizationFactor((r = n.randomizationFactor) !== null && r !== void 0 ? r : 0.5), this.backoff = new zi({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    }), this.timeout(n.timeout == null ? 2e4 : n.timeout), this._readyState = "closed", this.uri = t;
    const o = n.parser || f6;
    this.encoder = new o.Encoder(), this.decoder = new o.Decoder(), this._autoConnect = n.autoConnect !== !1, this._autoConnect && this.open();
  }
  reconnection(t) {
    return arguments.length ? (this._reconnection = !!t, this) : this._reconnection;
  }
  reconnectionAttempts(t) {
    return t === void 0 ? this._reconnectionAttempts : (this._reconnectionAttempts = t, this);
  }
  reconnectionDelay(t) {
    var n;
    return t === void 0 ? this._reconnectionDelay : (this._reconnectionDelay = t, (n = this.backoff) === null || n === void 0 || n.setMin(t), this);
  }
  randomizationFactor(t) {
    var n;
    return t === void 0 ? this._randomizationFactor : (this._randomizationFactor = t, (n = this.backoff) === null || n === void 0 || n.setJitter(t), this);
  }
  reconnectionDelayMax(t) {
    var n;
    return t === void 0 ? this._reconnectionDelayMax : (this._reconnectionDelayMax = t, (n = this.backoff) === null || n === void 0 || n.setMax(t), this);
  }
  timeout(t) {
    return arguments.length ? (this._timeout = t, this) : this._timeout;
  }
  maybeReconnectOnOpen() {
    !this._reconnecting && this._reconnection && this.backoff.attempts === 0 && this.reconnect();
  }
  open(t) {
    if (~this._readyState.indexOf("open"))
      return this;
    this.engine = new Rr(this.uri, this.opts);
    const n = this.engine, r = this;
    this._readyState = "opening", this.skipReconnect = !1;
    const o = wn(n, "open", function() {
      r.onopen(), t && t();
    }), i = wn(n, "error", (s) => {
      r.cleanup(), r._readyState = "closed", this.emitReserved("error", s), t ? t(s) : r.maybeReconnectOnOpen();
    });
    if (this._timeout !== !1) {
      const s = this._timeout;
      s === 0 && o();
      const a = this.setTimeoutFn(() => {
        o(), n.close(), n.emit("error", new Error("timeout"));
      }, s);
      this.opts.autoUnref && a.unref(), this.subs.push(function() {
        clearTimeout(a);
      });
    }
    return this.subs.push(o), this.subs.push(i), this;
  }
  connect(t) {
    return this.open(t);
  }
  onopen() {
    this.cleanup(), this._readyState = "open", this.emitReserved("open");
    const t = this.engine;
    this.subs.push(wn(t, "ping", this.onping.bind(this)), wn(t, "data", this.ondata.bind(this)), wn(t, "error", this.onerror.bind(this)), wn(t, "close", this.onclose.bind(this)), wn(this.decoder, "decoded", this.ondecoded.bind(this)));
  }
  onping() {
    this.emitReserved("ping");
  }
  ondata(t) {
    try {
      this.decoder.add(t);
    } catch (n) {
      this.onclose("parse error", n);
    }
  }
  ondecoded(t) {
    jS(() => {
      this.emitReserved("packet", t);
    }, this.setTimeoutFn);
  }
  onerror(t) {
    this.emitReserved("error", t);
  }
  socket(t, n) {
    let r = this.nsps[t];
    return r || (r = new US(this, t, n), this.nsps[t] = r), r;
  }
  _destroy(t) {
    const n = Object.keys(this.nsps);
    for (const r of n)
      if (this.nsps[r].active)
        return;
    this._close();
  }
  _packet(t) {
    const n = this.encoder.encode(t);
    for (let r = 0; r < n.length; r++)
      this.engine.write(n[r], t.options);
  }
  cleanup() {
    this.subs.forEach((t) => t()), this.subs.length = 0, this.decoder.destroy();
  }
  _close() {
    this.skipReconnect = !0, this._reconnecting = !1, this.onclose("forced close"), this.engine && this.engine.close();
  }
  disconnect() {
    return this._close();
  }
  onclose(t, n) {
    this.cleanup(), this.backoff.reset(), this._readyState = "closed", this.emitReserved("close", t, n), this._reconnection && !this.skipReconnect && this.reconnect();
  }
  reconnect() {
    if (this._reconnecting || this.skipReconnect)
      return this;
    const t = this;
    if (this.backoff.attempts >= this._reconnectionAttempts)
      this.backoff.reset(), this.emitReserved("reconnect_failed"), this._reconnecting = !1;
    else {
      const n = this.backoff.duration();
      this._reconnecting = !0;
      const r = this.setTimeoutFn(() => {
        t.skipReconnect || (this.emitReserved("reconnect_attempt", t.backoff.attempts), !t.skipReconnect && t.open((o) => {
          o ? (t._reconnecting = !1, t.reconnect(), this.emitReserved("reconnect_error", o)) : t.onreconnect();
        }));
      }, n);
      this.opts.autoUnref && r.unref(), this.subs.push(function() {
        clearTimeout(r);
      });
    }
  }
  onreconnect() {
    const t = this.backoff.attempts;
    this._reconnecting = !1, this.backoff.reset(), this.emitReserved("reconnect", t);
  }
}
const as = {};
function zl(e, t) {
  typeof e == "object" && (t = e, e = void 0), t = t || {};
  const n = n6(e, t.path || "/socket.io"), r = n.source, o = n.id, i = n.path, s = as[o] && i in as[o].nsps, a = t.forceNew || t["force new connection"] || t.multiplex === !1 || s;
  let l;
  return a ? l = new Cp(r, t) : (as[o] || (as[o] = new Cp(r, t)), l = as[o]), n.query && !t.query && (t.query = n.queryKey), l.socket(n.path, t);
}
Object.assign(zl, {
  Manager: Cp,
  Socket: US,
  io: zl,
  connect: zl
});
function gy(e, t, n) {
  if (document.hasFocus())
    return;
  const r = new Notification("New message from BizBot Chatbot", {
    icon: n === "image" ? e : n === "audio" ? "/images/icons/audio.png" : n === "video" ? "/images/icons/video.png" : n === "location" ? "/images/icons/location.png" : n === "ads" || n === "offer" ? "/images/icons/ads.png" : n === "gallery" ? "/images/icons/gallery.png" : n === "feedback" ? "/images/icons/feedback.png" : "/images/icons/msg.png",
    body: `${t}: ${e}`
  });
  r.onclick = (o) => {
    window != null && window.focus && window.focus();
  };
}
function ls(e, t, n) {
  t && ("Notification" in window ? Notification.permission === "granted" ? gy(e, t, n) : Notification.permission !== "denied" && Notification.requestPermission((r) => {
    r === "granted" && gy(e, t, n), r === "denied" && console.log("Notification permission denied");
  }) : alert("This browser does not support system notifications!"));
}
const h6 = "/sound/alert.mp3";
function m6(e) {
  const [t, n] = x.exports.useState(!1), r = window.botId, o = FO("(max-width:480px)");
  x.exports.useEffect(() => {
    window.isOpenChat && n(window.isOpenChat);
  }, [window.isOpenChat]);
  const [i, s] = x.exports.useState(!1), a = x.exports.useRef(null), [l, c] = x.exports.useState(""), u = kh(), {
    accessToken: f,
    botStyles: h,
    botSettings: y,
    botName: d,
    offersArr: m,
    adsArr: w,
    widgetToken: g,
    isLocation: p
  } = Mi((X) => X.bot), [v, b] = x.exports.useState(!1), [C, E] = x.exports.useState(!1), R = {
    isShowForm: !1,
    isShowAds: !1,
    isShowChats: !1,
    isShowOffer: !1
  }, [T, O] = x.exports.useState(R);
  x.exports.useEffect(() => {
    r && u(bw(r));
  }, [r, u]), x.exports.useEffect(() => {
    var X;
    if (m && ((X = m == null ? void 0 : m.cards) == null ? void 0 : X.length) > 0 || w && w.length > 0) {
      O({
        isShowForm: !1,
        isShowAds: !0,
        isShowChats: !1
      });
      return;
    }
  }, [m, w]);
  const [P, $] = x.exports.useState([]), [B, D] = x.exports.useState(!1);
  x.exports.useEffect(() => {
    async function X() {
      const H = window.baseUrl;
      c(f);
      const W = zl(H, {
        path: "/socket.io/engage",
        auth: {
          token: f
        }
      });
      a.current = W, W.on("connect", () => {
        console.log("Connected", W.id), O({
          ...T,
          isShowChats: !0
        });
      }), W.onAny((ce, re) => {
      }), W.on("publish-ads", () => {
        j({
          type: "ads",
          value: w,
          time: new Date().getTime()
        }), ls(w == null ? void 0 : w.title, "Advertisement", "ads");
      }), W.on("publish-offer", () => {
        j({
          type: "offer",
          value: m,
          time: new Date().getTime()
        }), ls(m == null ? void 0 : m.title, "Offers", "offer");
      }), W.on("publish-feedback", () => {
        b(!0), ls("Please give us your valuable feedback", "Feedback", "feedback");
      }), W.on("chat-message-bot", (ce) => {
        var ie, de, se;
        A(ce.message), O({
          ...T,
          isShowChats: !0
        }), (ie = ce == null ? void 0 : ce.message) != null && ie.switchToAgent && sessionStorage.setItem("switchToAgent", "true");
        const re = sessionStorage.getItem("switchToAgent");
        ((de = ce == null ? void 0 : ce.message) == null ? void 0 : de.value) && re ? ls(ce.message.value, "Agent", ce.message.type) : ((se = ce == null ? void 0 : ce.message) == null ? void 0 : se.value) && !re && ls(ce.message.value, "Bot", ce.message.type);
      }), W.on("disconnect", () => {
        console.log("Disconnected");
      });
    }
    return f && X(), () => {
      var H;
      (H = a == null ? void 0 : a.current) == null || H.disconnect();
    };
  }, [f]), x.exports.useEffect(() => {
    s(t);
  }, [t]);
  const I = !0, M = new Audio(h6), A = (X) => {
    $((H) => [...H, X]);
  }, j = (X) => {
    $((H) => [...H, X]);
  }, _ = () => {
    const X = navigator.userAgent.toLowerCase();
    if (X.indexOf("safari") !== -1)
      return !(X.indexOf("chrome") > -1);
  }, [z, F] = x.exports.useState({
    right: o ? 0 : 20,
    bottom: o ? 20 : _() ? 50 : 40
  }), Y = {
    width: "100vw",
    height: "100vh",
    margin: "0 auto"
  }, q = {
    width: "460px",
    height: "85vh",
    right: 20,
    bottom: _() ? 100 : 40
  }, [pe, ne] = x.exports.useState(o ? Y : q), ae = !0;
  x.exports.useEffect(() => {
    if ((h == null ? void 0 : h.widgetPosition) === "left") {
      F({
        left: o ? "0px" : "5px",
        bottom: o ? "0px" : "20px"
      });
      let X = {
        customStyleDesktop: {
          width: "460px",
          height: "85vh",
          left: 20,
          bottom: 40
        },
        customStyleMobile: {
          width: "100vw",
          height: "100vh",
          margin: "0 auto"
        }
      };
      ne(o ? X.customStyleMobile : X.customStyleDesktop);
    }
  }, [h, o]);
  const le = {
    isBotOpen: i,
    loadingBot: C,
    mdAbove: I,
    setIsBotOpen: s,
    socket: a.current,
    updatemyMessages: j,
    visitorAccessToken: l,
    botSettings: y,
    botName: d,
    botId: r,
    isFeedbackOpen: v,
    setIsFeedbackOpen: b,
    setLoadingBot: E,
    isChatBotOpen: t,
    customStyle: pe,
    customPosition: z,
    hidden: ae,
    botStyles: h,
    offersArr: m,
    adsArr: w,
    isShow: T,
    setIsShow: O,
    accessToken: f,
    widgetToken: g,
    newMessages: P,
    isCameraOpen: B,
    setIsCameraOpen: D,
    soundAlert: M,
    isLocation: p
  };
  return /* @__PURE__ */ S("div", {
    id: "bizbot-widget",
    children: y && (Object == null ? void 0 : Object.keys(y).length) > 0 && (Object == null ? void 0 : Object.keys(h)) && /* @__PURE__ */ S(RB, {
      ...e,
      ...le
    })
  });
}
const g6 = iI({
  reducer: {
    bot: OA
  },
  middleware: (e) => e({
    serializableCheck: !1
  })
});
function kp({}) {
  return /* @__PURE__ */ S(fR, {
    store: g6,
    children: /* @__PURE__ */ S(m6, {})
  });
}
const y6 = () => {
  if (!document.getElementById("root")) {
    let n = document.createElement("div");
    n.id = "root", document.body.appendChild(n);
  }
  if (document == null ? void 0 : document.getElementById("bizbot-widget-root"))
    return Fs.createRoot(document.getElementById("bizbot-widget-root")).render(/* @__PURE__ */ S(Et, {
      children: /* @__PURE__ */ S(kp, {})
    }));
  {
    let n = document.createElement("div");
    return n.id = "bizbot-widget-root", document.body.appendChild(n), Fs.createRoot(document.getElementById("bizbot-widget-root")).render(/* @__PURE__ */ S(Et, {
      children: /* @__PURE__ */ S(kp, {})
    }));
  }
};
window.botId = "6486ea455a160902ee8b1a3f";
window.baseUrl = "http://localhost:4000";
window.isOpenChat = !0;
Fs.createRoot(document.getElementById("root")).render(/* @__PURE__ */ S(Et, {
  children: /* @__PURE__ */ S(kp, {})
}));
export {
  y6 as default
};
