export class State {
  constructor(params) {
    Object.keys(params).forEach(param => this[param] = params[param])
  }
  // isMounted = false
  // hasChanged = true
  // onChange = () => {}
  set = (field, value) => {
    if (this[field] === value) return
    this[field] = value
    if (Array.isArray(value)) {
      let push = value.push
      value.push = (item) => {
        push.call(value, item)
        this.hasChanged = true
        this.onChange(field, value)
      }
    }
    if (field !== 'parent') {
      this.hasChanged = true
      if (this.isMounted && field !== 'html') this.onChange(field, value)
    }
  }
  getUpdater() {
      return (props) => {
        this.currentProps = props
        // disabling magical inheritance of props in favor of passing them to onMount and render
        props && Object.keys(props).forEach(key => this.set(key, props[key]))
        if (props && props.parent) {
          this.parent = props.parent
        }
        if (!this.isMounted) {
          this.onMount && this.onMount(props)
          this.isMounted = true
          this.onChange = (field, value) => {
            this.set('html', this.render(props))
            let parent = this.parent
            // when a child change is detected trigger rerender all the way upwards
            while(parent) {
              if (parent.render) parent.set('html', parent.render(parent.currentProps))
              parent = parent.parent
            }
            this.hasChanged = false
          }
          this.set('html', this.render(props))
        } else if (this.hasChanged) {
          this.set('html', this.render(props))
        }
        return this.html
      }
    }
}

window.callbacks = {}
export function makeCallback (fn) {
  const hash = 'a' + Math.round(Math.random() * 100000000)
  callbacks[hash] = (param) => fn(param)
  return `window.callbacks['${hash}'](event)`
}

window.refs = {}
export function makeRef () {
  const hash = 'ref' + Math.round(Math.random() * 100000000)
  const refObj = {
    address: hash,
    current: null,
    virtual: null,
  }
  refs[hash] = (element, virtual) => {
    refObj.current = element
    refObj.virtual = virtual
  }
  return refObj
}

export function makeIterator(Module, parent) {
  const entries = {}
  return (props) => {
    if (!props.id) {
      console.warn('id is missing! monkey patching one')
      props.id = 'key' + Math.round(Math.random() * 100000000)
    }
    if (!entries[props.id]) entries[props.id] = new Module({ parent, ...props })
    return entries[props.id]({ parent, ...props })
  }
}

function deepMatchAndApply(node, nodeTarget, inRecursion) {
  let sameChildrenLength = false
  node.childNodes.forEach((nd, i) => {
    if (nodeTarget.childNodes.length === node.childNodes.length) {
      sameChildrenLength = true
      // only try updaing each item when number of children is unchanged, otherwise whole node will be rerendered
      nodeTarget.childNodes[i] && deepMatchAndApply(nd, nodeTarget.childNodes[i], true)
    }
  })
  if (node.innerHTML === undefined) {
    if (node.data !== nodeTarget.data) { // text nodes
      nodeTarget.data = node.data
      return
    }
  } else {
    // if (sameChildrenLength) {
      Array.prototype.forEach.call(node.attributes, attr => {
        if (attr.name === 'style') {
          Array.prototype.forEach.call(node.style, attrStyle => {
            const nodeAttrStyle = node.style[attrStyle]
            if (nodeAttrStyle !== nodeTarget.style[attrStyle]) {
              // applying styles based on "style" attribute, direct styling of refs also works
              nodeTarget.style[attrStyle] = nodeAttrStyle
            }
          })
        }
        const attrValue = node.getAttribute(attr.name)
        if (attrValue !== nodeTarget.getAttribute(attr.name)) {
          console.log('setting attribute', attr.name, attrValue)
          nodeTarget.setAttribute(attr.name, attrValue)
          if (attr.name === 'value') {
            nodeTarget.value = attrValue
          }
        }
        if (attr.name === 'ref') {
          // console.log('saving ref', nodeTarget)
          const address = attrValue
          window.refs[address](nodeTarget, node)
        }
      })
    // }
    if (node.innerHTML.replace(/ style="(.*)"/g, '') !== nodeTarget.innerHTML.replace(/ style="(.*)"/g, '')) {
      console.log('Reloading entire node(Individual changes didn\'t help or number of items changed)', nodeTarget)
      console.log(node.innerHTML, nodeTarget.innerHTML)
      nodeTarget.innerHTML = node.innerHTML
    }
  }
}

export function createNothing(App, domContainer) {
  const vDom = document.createElement('div')
  let app
  let debounceTimeout
  const appRoot = {
    render: () => {
      clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(() => {
        vDom.innerHTML = app()
        deepMatchAndApply(vDom, domContainer)
        console.log('Rerender')
      }, 1)
    },
    set: () => {}
  }
  app = App(appRoot)
  appRoot.render()
}
