# The Nothing

POC of a back-to-the-roots idea of building a website by writing crude HTML code with native attributes for event handlers like ```onmouseover=""``` or ```onsubmit=""```. There are no built-in abstractions for dom nodes, events or styling. What you write in your component renderer in ES6 is what you will get in DOM. It's similar to web components.

The POC library in `nothing.js` only takes 50 lines of code and consists of `State`, `makeCallback` and `makeIterator`(for lists). There's no build step and there are no dependencies.

## Basic component with state

```javascript
const Header = function (parent) {
  const state = new State({ title: 'Default component title', parent })
  state.render = () => `<h1 style="color: #aaa;">${state.title}</h1>`
  return state.getUpdater()
}
```

## Composition

```javascript
const App = function (parent) {
  const state = new State({ parent })
  // Due to no preprocessing each component must be instantiated before being used in render(),
  // here the default options before loading dynamic content can be set
  const header = Header({ title: 'Default app title' })
  state.render = () => {
    // This part gets executed on every rerender
    return `<div>
      ${header({ title: 'Dynamic title' })}
    </div>`
  }
  return state.getUpdater()
}
```

## Event handlers

In `todo.js` you'll find the below `TodoItem` component. onclick is a regular HTML attribute

```javascript
const TodoItem = function () {
  const state = new State({ caption: '' })
  state.render = () => `<li>
    ${state.caption}
    <button id="${state.id}" onclick="${state.remove}">Done</button>
  </li>`
  return state.getUpdater()
}
```

state.remove is a pointer to a callback passed by the parent. `makeCallback` is the crucial function exporting a local handler so it can be accessed by the resulting HTML with it's native handler declaration attribute

```javascript
const remove = makeCallback((event) => {
  state.set('items', state.items.filter(item => item.id !== event.target.getAttribute('id')))
})
```

## Demo
Clone this repo and run ```npm start```

### Files
  - index.html - the starting point
  - nothing.js - the engine
  - todo.js - the app

## For lazy people
[JSFiddle demo](https://jsfiddle.net/ay1mr80e/)
