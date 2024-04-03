(() => {
  // node_modules/uuid/dist/esm-browser/rng.js
  var getRandomValues;
  var rnds8 = new Uint8Array(16);
  function rng() {
    if (!getRandomValues) {
      getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
      if (!getRandomValues) {
        throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
      }
    }
    return getRandomValues(rnds8);
  }

  // node_modules/uuid/dist/esm-browser/stringify.js
  var byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
  }

  // node_modules/uuid/dist/esm-browser/native.js
  var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
  var native_default = {
    randomUUID
  };

  // node_modules/uuid/dist/esm-browser/v4.js
  function v4(options, buf, offset) {
    if (native_default.randomUUID && !buf && !options) {
      return native_default.randomUUID();
    }
    options = options || {};
    const rnds = options.random || (options.rng || rng)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return unsafeStringify(rnds);
  }
  var v4_default = v4;

  // node_modules/app-framework-opacity/lib.ts
  var styleGroup = class {
    constructor(styles, className) {
      this.members = [];
      this.checksum = 0;
      this.className = v4_default();
      this.styles = styles;
      if (className) {
        this.className = className;
      }
    }
    set(style) {
      this.styles.push(style);
      this.checksum++;
    }
    getCss() {
      var s = "";
      for (let i of this.styles) {
        s += `${i[0]} {${i[1]}}`;
      }
      return s;
    }
  };
  function rerenderBasics(node) {
    node.changes = [];
    node.htmlNode.style.cssText = computeStyles(node.styles);
    node.updateDimensions();
    node.htmlNode.className = node.classes.join(" ");
    for (let i of node.styleGroups) {
      node.htmlNode.classList.add(i.className);
    }
    addStyleGroupStylesToDOM(node.styleGroups);
    for (let i of node.children) {
      if (i.htmlNode || i.textNode) {
        i.rerender();
      } else {
        i.render(node.htmlNode);
      }
    }
  }
  function renderBasics(node, element) {
    node.updateDimensionsBlindly();
    node.htmlNode = element;
    node.htmlNode.style.cssText = computeStyles(node.styles);
    for (let i of node.changes) {
      i();
    }
    node.changes = [];
    for (let i of node.onMountQueue) {
      i();
    }
    node.onMountQueue = [];
  }
  var appFrwkNode = class {
    constructor(children) {
      this.onMountQueue = [];
      this.nodeType = 0 /* basic */;
      this.styles = [];
      this.styleGroups = [];
      this.flag = /* @__PURE__ */ new Map([]);
      this.classes = [];
      this.changes = [];
      this.children = [];
      this.width = -1;
      this.height = -1;
      this.children = children;
      for (let i of children) {
        i.parent = this;
        this.changes.push(() => {
          i.render(this.htmlNode);
        });
      }
    }
    setFlag(key, val) {
      this.flag.set(key, val);
      return this;
    }
    addClass(className) {
      this.changes.push(() => {
        this.htmlNode.classList.add(className);
      });
      let index = this.classes.indexOf(className);
      if (index == -1) {
        this.classes.push(className);
      }
      return this;
    }
    hasClass(className) {
      if (this.htmlNode) {
        return this.htmlNode.classList.contains(className);
      }
      return false;
    }
    toggleClass(className) {
      this.changes.push(() => {
        this.htmlNode.classList.toggle(className);
      });
      let index = this.classes.indexOf(className);
      if (index == -1) {
        this.classes.push(className);
      } else {
        this.classes.splice(index);
      }
      return this;
    }
    removeClass(className) {
      this.changes.push(() => {
        this.htmlNode.classList.remove(className);
      });
      let index = this.classes.indexOf(className);
      if (index != -1) {
        this.classes.splice(index);
      }
      return this;
    }
    applyStyle(styles) {
      this.styles.push(styles);
      this.changes.push(() => {
        this.htmlNode.style.cssText += computeStyles([styles]);
      });
      return this;
    }
    addToStyleGroup(group) {
      this.changes.push(() => {
        this.htmlNode.classList.add(group.className);
        addStyleGroupStylesToDOM([group]);
      });
      this.styleGroups.push(group);
      group.members.push(this);
      return this;
    }
    addEventListener(event, callback) {
      if (this.htmlNode) {
        this.htmlNode.addEventListener(event, (e) => callback(this, e));
      } else {
        this.onMountQueue.push(() => {
          this.htmlNode.addEventListener(event, (e) => callback(this, e));
        });
      }
      return this;
    }
    addChildren(children) {
      for (let i of children) {
        i.parent = this;
        this.children.push(i);
        this.changes.push(() => {
          i.render(this.htmlNode);
        });
      }
    }
    removeChild(child) {
      this.children.splice(this.children.indexOf(child));
      this.changes.push(() => {
        this.htmlNode.removeChild(child.htmlNode);
      });
    }
    render(target) {
      let element = document.createElement("div");
      renderBasics(this, element);
      target.appendChild(element);
    }
    renderNewChildren(children) {
      this.addChildren(children);
      computeDimensions(this, true);
      if (this.htmlNode) {
        for (let i of children) {
          i.render(this.htmlNode);
        }
      }
    }
    rerender() {
      rerenderBasics(this);
    }
    updateDimensions() {
      computeDimensions(this, true);
      this.updateDimensionsBlindly();
    }
    updateDimensionsBlindly() {
      const d = () => {
        if (this.width > 0) {
          this.htmlNode.style.width = this.width + "px";
        }
        if (this.height > 0) {
          this.htmlNode.style.height = this.height + "px";
        }
      };
      if (this.htmlNode) {
        d();
      } else {
        this.onMountQueue.push(d);
      }
      for (let i of this.children) {
        i.updateDimensionsBlindly();
      }
    }
    setWidth(expression, test) {
      if (test) {
      }
      this.widthExpression = expression;
      return this;
    }
    getWidth() {
      return this.width;
    }
    setHeight(expression) {
      this.heightExpression = expression;
      return this;
    }
    getHeight() {
      return this.height;
    }
    lightRerender() {
      this.updateDimensions();
      if (this.htmlNode) {
        for (let i of this.changes) {
          i();
        }
        this.changes = [];
      } else {
        console.error("I haven't been rendered yet");
      }
      for (let i of this.children) {
        if (i.nodeType == 1 /* text */) {
          if (!i.textNode) {
            i.render(this.htmlNode);
            i.changes = [];
          }
        } else {
          if (i.htmlNode) {
            i.lightRerender();
          } else {
            i.render(this.htmlNode);
            i.changes = [];
          }
        }
      }
    }
    applyLastChange() {
      if (this.changes.length > 0) {
        this.changes[this.changes.length - 1]();
      }
      this.changes.pop();
    }
  };
  function computeStyles(styles) {
    let styleString = "";
    for (let i of styles) {
      for (let rule of i) {
        styleString += rule;
      }
    }
    return styleString;
  }
  function computeDimensions(rootNode, recursive) {
    let widthSharers = [];
    let totalWidthSharersLength = 0;
    let totalWidthNotSharersLength = 0;
    let heightSharers = [];
    let totalHeightSharersLength = 0;
    let totalHeightNotSharersLength = 0;
    let allDimensionSharers = [];
    for (let i of rootNode.children) {
      if (i.nodeType == 0 /* basic */) {
        i = i;
        var isDimensionsSharer = false;
        if (i.widthExpression != void 0) {
          let width = i.widthExpression(i);
          if (width.lengthOfShared == 0) {
            i.width = width.length;
            totalWidthNotSharersLength += width.length;
          } else {
            isDimensionsSharer = true;
            widthSharers.push(i);
            totalWidthSharersLength += width.lengthOfShared;
          }
        }
        if (i.heightExpression != void 0) {
          let height = i.heightExpression(i);
          if (height.lengthOfShared == 0) {
            i.height = height.length;
            totalHeightNotSharersLength += height.length;
          } else {
            isDimensionsSharer = true;
            heightSharers.push(i);
            totalHeightSharersLength += height.lengthOfShared;
          }
        }
        if (isDimensionsSharer) {
          allDimensionSharers.push(i);
        } else if (recursive) {
          computeDimensions(i, true);
        }
      }
    }
    let widthOfStandardSharedWidth = (rootNode.width - totalWidthNotSharersLength) / totalWidthSharersLength;
    for (let i of widthSharers) {
      i.width = i.widthExpression(i).lengthOfShared * widthOfStandardSharedWidth;
    }
    let heightOfStandardSharedHeight = (rootNode.height - totalHeightNotSharersLength) / totalHeightSharersLength;
    for (let i of heightSharers) {
      i.height = i.heightExpression(i).lengthOfShared * heightOfStandardSharedHeight;
    }
    if (recursive) {
      for (let i of allDimensionSharers) {
        computeDimensions(i, true);
      }
    }
  }
  var allStyleGroups = [];
  function addStyleGroupStylesToDOM(styleGroups) {
    for (let s of styleGroups) {
      var exists = false;
      for (let index = 0; index < allStyleGroups.length; index++) {
        if (s == allStyleGroups[index]) {
          if (s.checksum != allStyleGroups[index].checksum) {
            document.head.querySelector(`#${s.className}`).innerHTML = s.getCss();
          }
          exists = true;
        }
      }
      if (!exists) {
        let styleElement = document.createElement("style");
        styleElement.id = s.className;
        styleElement.innerHTML = s.getCss();
        document.head.appendChild(styleElement);
        allStyleGroups.push(s);
      }
    }
  }
  var resizeElement = document.createElement("div");
  resizeElement.style.cssText = `
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: larger;
    background-color: white;
`;
  resizeElement.innerText = "Resizing";
  document.body.appendChild(resizeElement);
  function renderApp(node, target, resizeListener) {
    node.applyStyle(["width: 100%;", "height: 100%; overflow: hidden;"]);
    node.width = document.body.clientWidth;
    node.height = document.body.clientHeight;
    const onResize = () => {
      resizeElement.style.display = "none";
      node.width = document.body.clientWidth;
      node.height = document.body.clientHeight;
      node.updateDimensions();
      if (resizeListener) {
        resizeListener();
      }
    };
    var doit;
    addEventListener("resize", () => {
      resizeElement.style.display = "flex";
      clearTimeout(doit);
      doit = setTimeout(onResize, 100);
    });
    node.updateDimensions();
    target.style.overflow = "hidden";
    node.render(target);
  }

  // node_modules/app-framework-opacity/elements.ts
  var button = class extends appFrwkNode {
    constructor() {
      super(...arguments);
      this.name = "button";
      this.styles = [];
    }
    render(target) {
      let element = document.createElement("button");
      renderBasics(this, element);
      target.appendChild(element);
    }
  };
  var container = class extends appFrwkNode {
    constructor() {
      super(...arguments);
      this.name = "container";
    }
    render(target) {
      let element = document.createElement("div");
      renderBasics(this, element);
      target.appendChild(element);
    }
  };
  var video = class extends appFrwkNode {
    constructor() {
      super(...arguments);
      this.name = "video";
    }
    setSrc(src) {
      this.changes.push(() => {
        this.htmlNode.src = src;
      });
      return this;
    }
    setControls(on) {
      this.changes.push(() => {
        this.htmlNode.controls = on;
      });
      return this;
    }
    setAutoplay(on) {
      this.changes.push(() => {
        this.htmlNode.autoplay = on;
      });
      return this;
    }
    render(target) {
      let element = document.createElement("video");
      renderBasics(this, element);
      target.appendChild(element);
    }
  };

  // layout.ts
  var recButton = new styleGroup([
    [".recordbutton", `
        aspect-ratio: 1;
        border-radius: 100%;
        width: 5em;
        border: 2px solid white;
        transition: all 0.2s ease-in-out;
        position: relative;
        box-shadow: 0px 0px 0px 2.5em black inset;
        padding: 0;
    `],
    [".recordbutton:before", `
        content: "";
        width: 2em;
        aspect-ratio: 1;
        background-color: inherit;
        position: absolute;
        left: 50%;
        top: 50%;
        border-radius: 100%;
        transform: translateX(-50%) translateY(-50%);
        transition: all 0.2s ease-in-out;
    `],
    [".recordbutton.video.active:before", `
        border-radius: 0.2em;
        width: 2em;
        box-shadow: 0px 0px 30px 3px red;

        
    `],
    [".recordbutton.photo.active:before", `
        animation: take-photo ease-in-out 0.3s forwards;

        
    `],
    ["@keyframes take-photo", `
        0% {
            width: 2em;
        }
        50% {
            width: 100%;
        }
        100% {
            width: 2em;
        }
    `]
  ], "recordbutton");
  var buttonStyles = new styleGroup([
    [".button", `
        width: 3em;
        aspect-ratio: 1;
        background-color: white;
        background-position: center;
        background-repeat: no-repeat;
        
        border-radius: 8px;
        border: 1px solid white;
        z-index: 1;
        box-sizing: border-box;
        transition: all 0.2s;
        justify-self: end; 
    `]
  ], "button");
  var videoContainer = new container([]).applyStyle([
    "height: calc(100% - 2em);",
    "width: calc(100% - 8em);",
    "margin: 1em 0 1em 1em;",
    "display: grid;",
    "place-items: center;"
  ]);
  var app = new container([
    videoContainer,
    new container([
      new button([]).applyStyle(["background-color: white;"]).addToStyleGroup(recButton).addClass("photo").addEventListener("pointerdown", (self) => {
        self.addClass("active").applyLastChange();
        setTimeout(() => {
          navigator.vibrate(10);
        }, 150);
        setTimeout(() => {
          self.removeClass("active").applyLastChange();
        }, 300);
      }),
      new button([]).applyStyle(["background-color: red;"]).addToStyleGroup(recButton).addClass("video").addEventListener("pointerdown", (self) => {
        navigator.vibrate(200);
        self.toggleClass("active").applyLastChange();
      }),
      new button([]).applyStyle(["background-image: url('assets/adjust.svg');"]).addToStyleGroup(buttonStyles).applyStyle(["margin-top: auto;"]),
      new button([]).applyStyle(["background-image: url('assets/settings.svg');"]).addToStyleGroup(buttonStyles),
      new button([]).applyStyle(["background-image: url('assets/gallery.svg');"]).addToStyleGroup(buttonStyles)
    ]).applyStyle([
      "position: relative;",
      "display: flex;",
      "gap: 1em;",
      "padding: 1em;",
      "width: 5em;",
      "flex-direction: column;",
      "justify-content: start;",
      "align-items: center;"
    ])
  ]).applyStyle(["display: flex;", "background-color: black;"]);
  document.addEventListener("pointerdown", () => {
  });
  renderApp(app, document.getElementById("app"), () => {
    console.log("resize");
    resizeVideo(16, 9);
  });
  var vid = new video([]).applyStyle([
    "border: 1px solid white;",
    "border-radius: 1em;"
  ]).setSrc("/vidstream");
  function resizeVideo(wAspect, hAspect) {
    const maxWidth = videoContainer.htmlNode.clientWidth;
    const maxHeight = videoContainer.htmlNode.clientHeight;
    if (maxWidth / wAspect < maxHeight / hAspect) {
      vid.applyStyle([`width: ${maxWidth}px;`, `height: ${maxWidth / wAspect * hAspect}px;`]).applyLastChange();
    } else {
      vid.applyStyle([`width: ${maxHeight / hAspect * wAspect}px;`, `height: ${maxHeight}px;`]).applyLastChange();
    }
  }
  videoContainer.addChildren([vid]);
  videoContainer.applyLastChange();
  resizeVideo(16, 9);
  function connect() {
    var pc = new RTCPeerConnection();
    async function negotiate() {
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await new Promise((resolve) => {
          if (pc.iceGatheringState === "complete") {
            resolve();
          } else {
            const checkState = () => {
              if (pc.iceGatheringState === "complete") {
                pc.removeEventListener("icegatheringstatechange", checkState);
                resolve();
              }
            };
            pc.addEventListener("icegatheringstatechange", checkState);
          }
        });
        var offer_1 = pc.localDescription;
        const response = await fetch("/offer", {
          body: JSON.stringify({
            sdp: offer_1.sdp,
            type: offer_1.type
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        });
        const answer = await response.json();
        console.log(answer);
        return await pc.setRemoteDescription(answer);
      } catch (e) {
        alert(e);
      }
    }
    function start() {
      pc.addEventListener("track", (evt) => {
        console.log(evt);
        if (evt.track.kind == "video") {
          vid.htmlNode.srcObject = evt.streams[0];
        }
      });
      negotiate();
    }
    start();
  }
  connect();
})();
