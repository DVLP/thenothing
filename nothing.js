class State {
  constructor(params) {
    Object.keys(params).forEach(param => this.set(param, params[param]))
  }
  set(field, value) {
    if (this[field] === value) return
    this[field] = value
    this.dirty = true
    if (this.mounted && field !== 'html') this.onChange(field, value)
  }
  getUpdater() {
    return (props) => {
      props && Object.keys(props).forEach(key => this.set(key, props[key]))
      if (!this.mounted) {
        this.onMount && this.onMount()
        this.mounted = true
        this.onChange = (field, value) => {
          this.set('html', this.render())
          updateApp()
          this.dirty = false
        }
        this.set('html', this.render())
      }
      if (this.dirty) this.set('html', this.render())
      return this.html
    }
  }
}
const uid = () => Math.random().toString()
window.cbs = {}
function makeCallback (fn) {
  const hash = 'a' + uid()
  cbs[hash] = (param) => fn(param)
  return `window.cbs['${hash}'](event)`
}

function makeIterator(Module) {
  const entries = {}
  return (props) => {
    if (!props.id) props.id = 'key' + uid()
    if (!entries[props.id]) entries[props.id] = new Module(props)
    return entries[props.id](props)
  }
}

function copyvDom(node, nodeTarget) { // kind of virtual/shadow dom(real dom but outside of the render tree)
  node.childNodes.forEach((nd, i) => nodeTarget.childNodes[i] && copyvDom(nd, nodeTarget.childNodes[i]))
  if (node.innerHTML === undefined && node.data !== nodeTarget.data) nodeTarget.data = node.data // text nodes
  if (node.innerHTML !== undefined && node.innerHTML !== nodeTarget.innerHTML) nodeTarget.innerHTML = node.innerHTML
}
