import { appFrwkNode, frwkNode, renderBasics, rerenderBasics } from "./lib"

export class button extends appFrwkNode {
    name = "button"
    styles = [
        
    ]
    render(target: HTMLElement): void {
        let element = document.createElement("button")
        renderBasics(this, element)
        target.appendChild(element)
    }
}
export class container extends appFrwkNode {
    name = "container"
    render(target: HTMLElement): void {
        let element = document.createElement("div")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class canvas extends appFrwkNode {
    name = "canvas"
    canvas = document.createElement("canvas")
    render(target: HTMLElement): void {
        renderBasics(this, this.canvas)
        target.appendChild(this.canvas)
    }
    getContext(contextId: "2d", options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null;
    getContext(contextId: "bitmaprenderer", options?: ImageBitmapRenderingContextSettings): ImageBitmapRenderingContext | null;
    getContext(contextId: "webgl", options?: WebGLContextAttributes): WebGLRenderingContext | null;
    getContext(contextId: "webgl2", options?: WebGLContextAttributes): WebGL2RenderingContext | null;

    getContext(contextId: string, options?: (CanvasRenderingContext2DSettings | ImageBitmapRenderingContextSettings | WebGLRenderingContext | WebGL2RenderingContext)) {
        return this.canvas.getContext(contextId, options)
    }
}

export class unorderedList extends appFrwkNode {
    name = "unordered-list"
    render(target: HTMLElement): void {
        let element = document.createElement("ul")
        renderBasics(this, element)
        target.appendChild(element)
    }
    
}

export class listItem extends appFrwkNode {
    name = "list-item"
    render(target: HTMLElement): void {
        let element = document.createElement("li")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class orderedList extends appFrwkNode {
    name = "ordered-list"
    render(target: HTMLElement): void {
        let element = document.createElement("ol")
        renderBasics(this, element)
        target.appendChild(element)
    }
}
export class image extends appFrwkNode {
    name = "img"
    setSrc(src: string) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLImageElement).src = src
        })
        return this
    }
    render(target: HTMLElement): void {
        let element = document.createElement("img")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class video extends appFrwkNode {
    name = "video"
    setSrc(src: string) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLVideoElement).src = src
        })
        return this
    }
    setControls(on: boolean) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLVideoElement).controls = on
        })
        return this
    }
    autoplay: boolean
    setAutoplay(on: boolean) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLVideoElement).autoplay = on
        })
        return this
    }
    render(target: HTMLElement): void {
        let element = document.createElement("video")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class audio extends appFrwkNode {
    name = "audio"
    setSrc(src: string) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLAudioElement).src = src
        })
        return this
    }

    setControls(on: boolean) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLAudioElement).controls = on
        })
        return this
    }
    setAutoplay(on: boolean) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLAudioElement).autoplay = on
        })
        return this
    }
    render(target: HTMLElement): void {
        let element = document.createElement("audio")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class link extends appFrwkNode {
    name = "link"
    setTarget(link: string) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLAnchorElement).href = link
        })
        return this
    }
    render(target: HTMLElement): void {
        let element = document.createElement("a") as HTMLAnchorElement
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class paragraph extends appFrwkNode {
    name = "paragraph"
    render(target: HTMLElement): void {
        let element = document.createElement("p")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class header1 extends appFrwkNode {
    name = "header1"
    render(target: HTMLElement): void {
        let element = document.createElement("h1")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class header2 extends appFrwkNode {
    name = "header2"
    render(target: HTMLElement): void {
        let element = document.createElement("h2")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class textInput extends appFrwkNode {
    name = "textInput"
    render(target: HTMLElement): void {
        let element = document.createElement("input")
        element.type = "text"
        renderBasics(this, element)
        target.appendChild(element)
    }
    setValue(val: string) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLInputElement).value = val
        })
        return this
    }
}

export class rangeInput extends appFrwkNode {
    name = "rangeInput"
    render(target: HTMLElement): void {
        let element = document.createElement("input")
        element.type = "range"
        renderBasics(this, element)
        target.appendChild(element)
    }
    setRange(min: number, max: number) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLInputElement).min = String(min);
            (this.htmlNode as HTMLInputElement).max = String(max)
        })
        return this
    }
    setValue(val: string) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLInputElement).value = val
        })
        return this
    }
}
