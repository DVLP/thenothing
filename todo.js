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
    { id: uid(), caption: 'Combat the urge to use this framework in production :)' },
  ]})
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
let app = TodoApp()
function updateApp() {
  vDom.innerHTML = app()
  copyvDom(vDom, document.body)
}
updateApp()
