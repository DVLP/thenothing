// Framework starts here, takes 50 lines of code(many things are removed from this POC for readability). Todo app starts at line 53
// Pure HTML attributes, direct events and dom elements
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

function copyvDom(node, nodeTarget) { // kind of virtual dom(real dom but outside of the render tree)
  node.childNodes.forEach((nd, i) => nodeTarget.childNodes[i] && copyvDom(nd, nodeTarget.childNodes[i]))
  if (node.innerHTML === undefined && node.data !== nodeTarget.data) nodeTarget.data = node.data // text nodes
  if (node.innerHTML !== undefined && node.innerHTML !== nodeTarget.innerHTML) nodeTarget.innerHTML = node.innerHTML
}

// TODO APP STARTS HERE
const TodoItem = function () {
  const state = new State({ caption: '' })
  state.render = () => `<li>
    ${state.caption}
    <button id="${state.id}" onclick="${state.remove}">Done</button>
  </li>`
  return state.getUpdater()
}

const TodoApp = function () {
  const state = new State({ val: '', items: [
    { id: uid(), caption: 'Read this list' },
    { id: uid(), caption: 'Combat urge to use this framework in production' },
  )
  const remove = makeCallback((event) => {
    state.set('items', state.items.filter(item => item.id !== event.target.getAttribute('id')))
  })
  const todoItem = makeIterator(TodoItem)
  const onCaptionChange = makeCallback((event) => state.val = event.target.value)
  const onTodoCreate = makeCallback((event) => {
    event.preventDefault()
    const newItems = state.items.slice()
    newItems.push({ id: uid(), caption: state.val })
    state.set('items', newItems)
    state.set('val', '')
  })
  state.render = () => `<div>
    <h1>To-do</h1>
    <ul>${state.items.map(item => todoItem({ ...item, remove })).join('')}</ul>
    <h3>New</h3>
    <form onsubmit="${onTodoCreate}">
      <input value="${state.val}"} onchange="${onCaptionChange}">
      <button>Add</button>
    </form>
  </div>`
  return state.getUpdater()
}

const vDom = document.createElement('div')
let rootMod = TodoApp()
function updateApp() {
  vDom.innerHTML = rootMod()
  copyvDom(vDom, document.body)
}
updateApp()
