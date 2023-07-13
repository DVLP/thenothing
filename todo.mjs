import { createNothing, makeCallback, makeIterator, makeRef, State } from './index.mjs'

const TodoItem = function () {
  const state = new State({ counter: 0 })
  state.onMount = (props) => setInterval(() => {
    state.set('counter', state.counter + 1)
  }, 1000)
  state.render = (props) => `<li>
    ${props.caption}
    <span style="color: #aaa; font-size: 12px;">${state.counter}s ago</span>
    <button id="${props.id}" onclick="${props.removeItem}" style="border-radius: 5px; font-size: 12px;">Done</button>
  </li>`
  return state.getUpdater(state)
}

const Header = function (parent) { // Example of the simplest stateful component
  const state = new State({
    content: 'I\'m title',
    content2: '',
    parent,
  })
  state.onMount = (props) => {
    state.content2 = props.content
    setInterval(() => state.set('content2', state.content2 + '.'), 2000)
  }
  state.render = (props) => `<h1 style="font-size: 22px;">${props.content}</h1>`
  return state.getUpdater(state)
}

const TodoApp = function (parent) {
  const state = new State({ inputValue: '', items: [], parent, inputStyle: "background: #eee;" })
  const removeItem = makeCallback((event) => {
    state.set('items', state.items.filter(item => item.id !== event.target.getAttribute('id')))
  })
  state.onMount = () => {
    state.set('items', [
      { id: Math.random().toString(), caption: 'Read this list' }, { id: Math.random().toString(), caption: 'Go for a walk' },
      { id: Math.random().toString(), caption: 'Shave armpits' }, { id: Math.random().toString(), caption: 'Invade Taiwan' },
      { id: Math.random().toString(), caption: 'Combat instant urge to use this framework in production' },
    ])
  }
  const todoTitle = Header(state)
  const newtodoTitle = Header(state)
  const todoItem = makeIterator(TodoItem, state)
  const onCaptionChange = makeCallback((event) => state.inputValue = event.target.value)
  const inputRef = makeRef()
  const onSubmit = makeCallback((event) => {
    event.preventDefault()
    state.items.push({ id: Math.random().toString(), caption: state.inputValue })
    state.set('inputStyle', 'background: green')
    state.set('inputValue', '')
  })
  state.render = () => `<div style="font-family: sans-serif">
    ${todoTitle({ content: 'To do - To do - todo todo todo - todo todoooo' })}
    <ul style="list-style-position: inside; list-style-type: circle; padding-left: 10px;">
      ${state.items.map(item => { item.removeItem = removeItem; return todoItem(item) }).join('')}
    </ul>
    ${newtodoTitle({ content: 'New todo' })}
    <form onsubmit="${onSubmit}">
      <input value="${state.inputValue}"} ref="${inputRef.address}" onchange="${onCaptionChange}" style="${state.inputStyle}">
      <button>Create</button>
    </form>
  </div>`
  return state.getUpdater()
}

createNothing(TodoApp, document.getElementById('todo-app'))
