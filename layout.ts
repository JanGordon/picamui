import { appFrwkNode, px, renderApp, shared, styleGroup } from "app-framework-opacity";
import {button, container, image, video} from "app-framework-opacity/elements"


const recButton = new styleGroup([
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
], "recordbutton")

const buttonStyles = new styleGroup([
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
], "button")

const videoContainer = new container([
    
]).applyStyle([
    "height: calc(100% - 2em);",
    "width: calc(100% - 8em);",
    "margin: 1em 0 1em 1em;",
    "display: grid;",
    "place-items: center;"
          
])

async function galleryView() {
    var photos = await fetch("/allphotos")
    .then((res)=>{
        res.json()
    }) as String[]
    var photoNodes: appFrwkNode[] = []
    for (let p of photos) {
        photoNodes.push(new image([]).setSrc("/captures/photos/"+ p))
    }
    return photoNodes
}
var gallery = new container([]).applyStyle(["position: absolute;",
    "left: 50%;",
    "top: 50%;",
    "transform: translateX(-50%) translateY(-50%);",
    "display: none;",
    "width: calc(100% - 2em);",
    "height: calc(100% - 2em);",
    "background-color: grey;"
    ])

async function addGallery() {
    
    
    gallery.addChildren(await galleryView())
}


const app = new container([
    videoContainer,
    
    new container([
        new button([])
        .applyStyle(["background-color: white;"])
        .addToStyleGroup(recButton).addClass("photo")
        .addEventListener("pointerdown", (self)=>{
            self.addClass("active").applyLastChange()
            setTimeout(()=>{
                navigator.vibrate(10);
            },150)
            setTimeout(()=>{
                self.removeClass("active").applyLastChange() 
            }, 300)
        })
        ,
        new button([])
        .applyStyle(["background-color: red;"])
        .addToStyleGroup(recButton).addClass("video")
        .addEventListener("pointerdown", (self)=>{
            navigator.vibrate(200);
            self.toggleClass("active").applyLastChange()
        })
        ,
        new button([]).applyStyle(["background-image: url('assets/adjust.svg');"]).addToStyleGroup(buttonStyles).applyStyle(["margin-top: auto;"]),
        new button([]).applyStyle(["background-image: url('assets/settings.svg');"]).addToStyleGroup(buttonStyles),
        new button([]).applyStyle(["background-image: url('assets/gallery.svg');"]).addToStyleGroup(buttonStyles).addEventListener("click", async ()=>{
            if (gallery.htmlNode.style.display == "none") {
                gallery.applyStyle(["display: flex;"]).applyLastChange()

            } else {
                gallery.applyStyle(["display: none;"]).applyLastChange()
            }

        })
    ]).applyStyle([
        "position: relative;",
        "display: flex;",
        "gap: 1em;",
        "padding: 1em;",
        "width: 5em;",
        "flex-direction: column;",
        "justify-content: start;",
        "align-items: center;"

    ]),
    gallery
]).applyStyle(["display: flex;", "background-color: black;"])


document.addEventListener("pointerdown", ()=>{
    // document.body.requestFullscreen()
})
addGallery()

renderApp(app, document.getElementById("app")!, ()=>{
    console.log("resize")
    resizeVideo(16,9);
})

const vid = new image([]).applyStyle([
    "border: 1px solid white;",
    "border-radius: 1em;",
]).setSrc("/stream.mjpg")

function resizeVideo(wAspect: number, hAspect: number) {
    const maxWidth = videoContainer.htmlNode.clientWidth
    const maxHeight = videoContainer.htmlNode.clientHeight
    if (maxWidth/wAspect < maxHeight/hAspect) {
        //bottleneck is the width
        vid.applyStyle([`width: ${maxWidth}px;`, `height: ${(maxWidth/wAspect)* hAspect}px;`]).applyLastChange()
    } else {
        vid.applyStyle([`width: ${(maxHeight/hAspect)* wAspect}px;`, `height: ${maxHeight}px;`]).applyLastChange()

    }
}


videoContainer.addChildren([vid])
videoContainer.applyLastChange()
resizeVideo(16,9)

