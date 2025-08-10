const Context = (function () {

    const handlers = new Map();
    const bindings = new Map();


    let boundElements = getAllBoundElements();

    for (const elem of boundElements) {
        const data_bind = elem.getAttribute("data-bind");
        const parsedbindings = parseBindings(data_bind);

        for (const bnd of parsedbindings) {

            for (const key in bnd) {
                if (Object.prototype.hasOwnProperty.call(bnd, key)) {
                    const element = bnd[key];
                    const binding = {};
                    binding["target"] = elem;
                    binding["actions"] = element;
                    addEventBindings(key, binding);
                }
            }

        }
    }
    boundElements = null;

    function raiseEvent(eventName) {

        if (!bindings.has(eventName)) {
            return;
        }

        const eventBindings = bindings.get(eventName)

        for (const binging of eventBindings) {

            for (const action of binging.actions) {

                let calls = parseFunctionCall(action);

                if (handlers.has(calls.functionName)) {
                    let hdlr = handlers.get(calls.functionName);
                    hdlr(...calls.args);
                    hdlr = null;
                    continue;
                }

                executeAction(calls.functionName, calls.args, binging.target);
                calls = null;
            }
        }
    }


    function addHandler(handler) {
        if (typeof handler !== "function") {
            throw new Error("handler nust be named function");
        }

        if (handler.name === "") {

            throw new Error("anonymouse function not allowd");
        }

        if (!handlers.has(handler.name)) {
            handlers.set(handler.name, handler);
        }
    }

    function addEventBindings(key, value) {
        if (!bindings.has(key)) {
            bindings.set(key, []);
        }
        bindings.get(key).push(value);
    }

    return {
        addHandler,
        handlers,
        raiseEvent

    };
})();

function getAllBoundElements() {
    return document.querySelectorAll('[data-bind]');
}


function executeAction(action, args, elem) {
    switch (action) {
        case 'show':
            elem.style.display = '';
            break;
        case 'hide':
            elem.style.display = 'none';
            break;
        case 'addClass':
            elem.classList.add(args[0]);
            break;
        case 'removeClass':
            elem.classList.remove(args[0]);
            break;
        case 'toggleClass':
            elem.classList.toggle(args[0]);
            break;
        case 'setText':
            elem.textContent = args[0] || '';
            break;
    }
}


function parseBindings(bindingStr) {

    let lines = bindingStr
        .split(';')
        .map(line => line.trim())
        .filter(Boolean);
    const result = [];

    for (const line of lines) {

        const eventLine = parseOnEventLine(line);
        result.push(eventLine);
    }
    lines = null;
    return result;
}

function parseOnEventLine(line) {
    const pattern = /^\s*on\s+([a-zA-Z_$][\w$]*)\s*:\s*(.+)$/;
    const match = line.match(pattern);

    if (!match) {
        return;
    }

    const eventName = match[1];
    const functionsPart = match[2];


    // جدا کردن چند فانکشن‌کال
    const calls = splitTopLevel(functionsPart, ',');
    const result = {};
    result[eventName] = calls;

    return result;
}

function parseFunctionCall(code) {
    const pattern = /^\s*([a-zA-Z_$][\w$]*)(?:\s*\((.*)\))?\s*$/;
    const match = code.match(pattern);

    const result = {};

    if (!match) {
        return;
    }

    const functionName = match[1];
    const argsRaw = match[2]?.trim();

    result["functionName"] = functionName;
    result["args"] = !argsRaw ? argsRaw : splitArguments(argsRaw);
    return result;

}

function splitArguments(input) {
    return splitTopLevel(input, ',');
}



function splitTopLevel(str) {
    let result = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < str.length; i++) {
        let char = str[i];
        
        if (inString) {
            if (char === stringChar && str[i - 1] !== '\\') {
                inString = false; // خروج از حالت رشته
                continue; // کوتیشن رو اضافه نمی‌کنیم
            }
            current += char; // کاراکترهای داخل رشته
        } 
        else {
            if ((char === '"' || char === "'") && depth === 0) {
                inString = true;
                stringChar = char;
                continue; // کوتیشن شروع رو اضافه نکن
            }
            if (char === '(') depth++;
            else if (char === ')') depth--;
            else if (char === ',' && depth === 0) {
                result.push(current.trim());
                current = '';
                continue;
            }
            current += char;
        }
    }
    if (current.trim()) result.push(current.trim());
    return result;
}
