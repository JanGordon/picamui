import { v4 as uuidv4 } from 'uuid';

export type frwkNode = appFrwkNode | appFrwkTextNode

enum nodeType {
    basic,
    text
}

export type lengthConfig = {
    lengthOfShared: number // multiplier for this nodes width compared with normal shared width
    length: number // widthOfShared = 0 if this is used. normal width 
}


export class styleGroup {
    members: appFrwkNode[] = []
    checksum = 0
    private styles: ([string, string])[]
    className = uuidv4()
    constructor(styles: ([string, string])[], className?: string) {
        this.styles = styles
        if (className) {
            this.className = className
        }
    }
    set(style: [string, string]) {
        this.styles.push(style)
        this.checksum++
    }
    getCss(): string {
        var s = ""
        for (let i of this.styles) {
            s+=`${i[0]} {${i[1]}}`
        }
        return s
    }
}



export function shared(multiplier: number): (self: appFrwkNode)=>lengthConfig  {
    return (self: appFrwkNode)=>{return {length: 0, lengthOfShared: multiplier}}
}

export function px(pixels: number): (self: appFrwkNode)=>lengthConfig  {
    return (self: appFrwkNode)=>{return {length: pixels, lengthOfShared: 0}}
}

export function percentWidth(percent: number): (self: appFrwkNode)=>lengthConfig  {
    return (self: appFrwkNode)=>{return {length: self.parent!.width * percent, lengthOfShared: 0}}
}

export function percentHeight(percent: number): (self: appFrwkNode)=>lengthConfig  {
    return (self: appFrwkNode)=>{return {length: self.parent!.height * percent, lengthOfShared: 0}}
}


export function rerenderBasics(node: appFrwkNode) {
    node.changes = []
    node.htmlNode.style.cssText = computeStyles(node.styles)
    node.updateDimensions()
    node.htmlNode.className = node.classes.join(" ")
    
    for (let i of node.styleGroups) {
        node.htmlNode.classList.add(i.className)
    }
    addStyleGroupStylesToDOM(node.styleGroups)
    for (let i of node.children) {
        if (i.htmlNode || (i as appFrwkTextNode).textNode) {
            i.rerender()
        } else {
            i.render(node.htmlNode)
        }
    }
}

export function renderBasics(node: appFrwkNode, element: HTMLElement) {
    node.updateDimensionsBlindly()
    
    node.htmlNode = element
    node.htmlNode.style.cssText = computeStyles(node.styles)
    for (let i of node.changes) {
        i()
    }
    node.changes = []

    for (let i of node.onMountQueue) {
        i()
    }
    node.onMountQueue = []
}

export class appFrwkNode {
    htmlNode: HTMLElement
    onMountQueue: (()=>void)[] = []
    nodeType = nodeType.basic
    styles: string[][] = []
    styleGroups: styleGroup[] = []
    flag = new Map<string, any>([])
    classes: string[] = []
    changes: (()=>void)[] = []
    setFlag(key: string, val: any) {
        this.flag.set(key, val)
        return this
    }

    addClass(className: string) {
        
        this.changes.push(()=>{
            this.htmlNode.classList.add(className)
        })
        let index = this.classes.indexOf(className)
        if (index == -1) {
            //no exist
            this.classes.push(className)
        }
        
        return this
    }
    hasClass(className: string) {
        if (this.htmlNode) {
            return this.htmlNode.classList.contains(className)
        }
        return false
    }
    toggleClass(className: string) {
        this.changes.push(()=>{
            this.htmlNode.classList.toggle(className)
        })
        let index = this.classes.indexOf(className)
        if (index == -1) {
            //no exist
            this.classes.push(className)
        } else {
            this.classes.splice(index)
        }
        return this
    }
    removeClass(className: string) {
        this.changes.push(()=>{
            this.htmlNode.classList.remove(className)
        })
        let index = this.classes.indexOf(className)
        if (index != -1) {
            this.classes.splice(index)
        }
        return this
    }
    applyStyle(styles: string[]) {
        this.styles.push(styles)
        this.changes.push(()=>{
            this.htmlNode.style.cssText += computeStyles([styles])
        })
        return this
    }
    addToStyleGroup(group: styleGroup) {
        this.changes.push(()=>{
            this.htmlNode.classList.add(group.className)
            addStyleGroupStylesToDOM([group])
        })
        this.styleGroups.push(group)
        group.members.push(this)
        return this
    }
    constructor(children: frwkNode[]) {
        this.children = children
        for (let i of children) {
            i.parent = this
            this.changes.push(()=>{
                i.render(this.htmlNode)
            })
        }
    }
    addEventListener(event: string, callback: (self: this, event: Event)=>void) {
        if (this.htmlNode) {
            this.htmlNode.addEventListener(event, (e)=>callback(this, e))
        } else {
            this.onMountQueue.push(()=>{
                this.htmlNode.addEventListener(event, (e)=>callback(this, e))
            })
        }
        return this
    }
    children: frwkNode[] = []
    addChildren(children: frwkNode[]) {
        for (let i of children) {
            i.parent = this
            this.children.push(i)
            this.changes.push(()=>{
                i.render(this.htmlNode)
            })
        }
    }

    removeChild(child: frwkNode) {
        this.children.splice(this.children.indexOf(child))
        this.changes.push(()=>{
            this.htmlNode.removeChild(child.htmlNode)
        })
        // It could be worth adding a rerender queue for optomisation
    }

    parent: appFrwkNode | undefined


    render(target: HTMLElement) {
        let element = document.createElement("div")
        renderBasics(this, element)
        target.appendChild(element)
    }
    
    renderNewChildren(children: frwkNode[]) {
        this.addChildren(children)
        computeDimensions(this, true)
        if (this.htmlNode) {
            for (let i of children) {
                i.render(this.htmlNode)
            }
        }
    }
    rerender() {
        rerenderBasics(this)
    }
    updateDimensions() {
        computeDimensions(this, true)
        this.updateDimensionsBlindly()
        
    }
    updateDimensionsBlindly() {
        const d = ()=>{
            if (this.width > 0) {
                this.htmlNode.style.width = this.width + "px"
            }
            if (this.height > 0) {
                this.htmlNode.style.height = this.height + "px"
            }
        }
        if (this.htmlNode) {
            d()
        } else {
            this.onMountQueue.push(d)
        }
        for (let i of this.children) {
            i.updateDimensionsBlindly()
        }
        
    }
    widthExpression: (self: appFrwkNode)=>lengthConfig
    heightExpression: (self: appFrwkNode)=>lengthConfig
    width: number = -1 // width in px
    height: number = -1 // width in px
    setWidth(expression: (self: appFrwkNode)=>lengthConfig, test?:boolean) {
        if (test) {
        }
        this.widthExpression = expression
        return this
    }
    getWidth() {return this.width}
    setHeight(expression: (self: appFrwkNode)=>lengthConfig) {
        this.heightExpression = expression
        return this
    }
    getHeight() {return this.height}


    lightRerender() {
        this.updateDimensions()
        if (this.htmlNode) {
            for (let i of this.changes) {
                i()
            }
            this.changes = []

        } else {
            console.error("I haven't been rendered yet")
        }
        for (let i of this.children) {
            if (i.nodeType == nodeType.text) {
                if (!(i as appFrwkTextNode).textNode) {
                    i.render(this.htmlNode);
                    (i as appFrwkTextNode).changes = []
                }
            } else {
                if (i.htmlNode) {
                    i.lightRerender()
                } else {
                    i.render(this.htmlNode)
                    i.changes = []
                }
            }   
        }
        
        
        
    }
    applyLastChange() {
        if (this.changes.length > 0) {
            this.changes[this.changes.length-1]()
        }
        this.changes.pop()
    }
}


export function computeStyles(styles: string[][]) {
    let styleString = ""
    for (let i of styles) {
        for (let rule of i) {
            styleString+=rule
        }
    }
    return styleString
}



export function computeDimensions(rootNode: appFrwkNode, recursive?: boolean) {
    // computes dimensions of all descendants of rootNode (not rootNode itself)
    let widthSharers :appFrwkNode[] = []
    let totalWidthSharersLength = 0
    let totalWidthNotSharersLength = 0
    let heightSharers :appFrwkNode[] = []
    let totalHeightSharersLength = 0
    let totalHeightNotSharersLength = 0

    let allDimensionSharers: appFrwkNode[] = []

    for (let i of rootNode.children) {
        if (i.nodeType == nodeType.basic) {
            i = i as appFrwkNode
            var isDimensionsSharer = false
            if (i.widthExpression != undefined) {
                let width = i.widthExpression(i)
                if (width.lengthOfShared == 0) {
                    // just use normal px length
                    i.width = width.length
                    totalWidthNotSharersLength+=width.length
                } else {
                    isDimensionsSharer = true
                    widthSharers.push(i)
                    totalWidthSharersLength+=width.lengthOfShared
                }
            }
            if (i.heightExpression != undefined) {
                let height = i.heightExpression(i)
                if (height.lengthOfShared == 0) {
                    // just use normal px length
                    i.height = height.length
                    totalHeightNotSharersLength+=height.length
                } else {
                    isDimensionsSharer = true
                    heightSharers.push(i)
                    totalHeightSharersLength+=height.lengthOfShared
                }
            }
            
            if (isDimensionsSharer) {
                allDimensionSharers.push(i)
            } else if (recursive) {
                computeDimensions(i, true)
            }
        }
        
    }
    let widthOfStandardSharedWidth = (rootNode.width - totalWidthNotSharersLength) / totalWidthSharersLength
    for (let i of widthSharers) {
        i.width = i.widthExpression(i).lengthOfShared*widthOfStandardSharedWidth
    }

    let heightOfStandardSharedHeight = (rootNode.height - totalHeightNotSharersLength) / totalHeightSharersLength
    for (let i of heightSharers) {
        i.height = i.heightExpression(i).lengthOfShared*heightOfStandardSharedHeight
    }
    if (recursive) {
        for (let i of allDimensionSharers) {
            computeDimensions(i, true)
        }
    }
    
}

export class appFrwkTextNode extends appFrwkNode {
    constructor(content: string) {
        super([])
        this.content = content
    }
    textNode: Text
    render(target: HTMLElement): void {
        let n = document.createTextNode(this.content)
        this.textNode = n
        target.appendChild(n)
    }
    rerender(): void {
        this.textNode.data = this.content
    }
    nodeType = nodeType.text
    content: string
}

var allStyleGroups: styleGroup[] = []
export function addStyleGroupStylesToDOM(styleGroups: styleGroup[]) {
    for (let s of styleGroups) {
        var exists = false
        for (let index = 0; index < allStyleGroups.length; index++) {
            if (s == allStyleGroups[index]) {
                if (s.checksum != allStyleGroups[index].checksum) {
                    // style has been modified
                    (document.head.querySelector(`#${s.className}`) as HTMLStyleElement).innerHTML = s.getCss()
                    
                }
                exists = true
            }
        }
        if (!exists) {
            let styleElement = document.createElement("style")
            styleElement.id = s.className
            styleElement.innerHTML = s.getCss()
            document.head.appendChild(styleElement)
            allStyleGroups.push(s)
        }
    }
}

const resizeElement = document.createElement("div")
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
`
resizeElement.innerText = "Resizing"
document.body.appendChild(resizeElement)
export function renderApp(node: appFrwkNode, target: HTMLElement, resizeListener?: ()=>void) {
    node.applyStyle(["width: 100%;", "height: 100%; overflow: hidden;"])

    node.width = document.body.clientWidth
    node.height = document.body.clientHeight
    const onResize = ()=>{

        resizeElement.style.display = "none"
        node.width = document.body.clientWidth
        node.height = document.body.clientHeight
        node.updateDimensions()
        if (resizeListener) {
            resizeListener()
        }
    }
    var doit;

    addEventListener("resize", ()=>{
        resizeElement.style.display = "flex"
        clearTimeout(doit);
        doit = setTimeout(onResize, 100);
        
        
    })
    
    node.updateDimensions()
    target.style.overflow = "hidden"
    node.render(target)
}

