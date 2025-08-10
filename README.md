# Onify – Simple DOM Event Binding Helper

**Onify** is a small helper library for lightweight projects that makes it easy to handle custom DOM events with clean, readable HTML attributes.

No complex setup. No magic. Just simple event-to-handler mapping directly in your HTML.

---

## 📌 How It Works

Add a `data-bind` attribute to your HTML element and define your events and corresponding handlers inside it.

- Separate **different events** with `;`
- Separate **multiple handlers for the same event** with `,` (or by repeating the same event name — but using commas is cleaner)

---

## 📄 Example

```html
<div data-bind="
    on event1: customAlert('hello world'); 
    on event2: hide;
    on event3: show, setText('new text on event3'); 
    on event3: toggleClass('highlight')
">
    Div content
</div>
```
**What this does:**

- **event1** → Calls your custom `customAlert()` function (defined and registered by you).
- **event2** → Hides the element (`hide` is a built-in handler).
- **event3** → Runs 3 actions: Shows the element ,Sets new text and Toggles a highlight class


## ⚙️ Registering Custom Handlers

You can define your own handler functions and register them with Onify:

```javascript
function customAlert(message) {
  alert(message);
}

Context.addHandler(customAlert);
```
## ⚙ Built-in Handlers

Onify ships with a few simple built-in handlers:

- `show`
- `hide`
- `toggleClass(className)`
- `setText(text)`
- `addClass(className)`
- `removeClass(className)`

## 🚀 Full Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Onify Demo</title>
    <style>
        .highlight {
            background: yellow !important;
        }
    </style>
</head>
<body>

    <div id="mydiv" data-bind="
        on event1: customAlert('hello world');
        on event2: hide;
        on event3: show, setText('new text');
        on event3: toggleClass('highlight')
    ">
        My Content
    </div>

    <div style="display: none;" data-bind="on startAjax: show; on endAjax: hide">
        Loading...
    </div>

    <button onclick="Context.raiseEvent('event2')">Hide</button>
    <button onclick="Context.raiseEvent('event3')">Show</button>
    <button onclick="Context.raiseEvent('event1')">Alert</button>
    <button onclick="myAjaxCall()">Ajax Call</button>

    <script src="./eleOnify.js"></script>
    <script>
        Context.addHandler(customAlert);

        async function myAjaxCall() {
            Context.raiseEvent('startAjax');

            console.log("start ...");
            fetch('https://jsonplaceholder.typicode.com/posts/1')
                .then(response => {
                    if (!response.ok) throw new Error('Network error: ' + response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Data received:', data);
                })
                .catch(error => {
                    console.error('Error:', error);
                });

            console.log("start delay ...");
            await delay(5000);

            Context.raiseEvent('endAjax');
        }

        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        function customAlert(message) {
            alert(message);
        }
    </script>
</body>
</html>
```

## 📢 Why Use Onify?

**Readable HTML**  
See event bindings right in your markup.

**Quick Setup**  
No complicated configs.

**Customizable**  
Easily add your own event handlers.

**Lightweight**  
Perfect for small projects.
