const Context = (function () {

    const handlers = new Map();
    const bindings = new Map();
    const delayPattern = /^delay\(\d+\)$/;
    cacheBindings();


    function cacheBindings() {
        let boundElements = getAllBoundElements();

        for (const elem of boundElements) {
            const data_bind = elem.getAttribute("data-bind");
            const parsedbindings = parseBindings(data_bind);
            elem.setAttribute('data-grabbed', '');
            for (const bnd of parsedbindings) {
                for (const key in bnd) {
                    if (Object.prototype.hasOwnProperty.call(bnd, key)) {
                        const action = bnd[key];
                        const binding = {};
                        binding["target"] = elem;
                        binding["actions"] = action;
                        addEventBindings(key, binding);
                    }
                }

            }
        }

        document.addEventListener("DOMContentLoaded", (event) => {
            raiseEvent("autoRaise", {});
        });

        raiseEvent("immediatRaise", {});

        boundElements = null;
    }
    function raiseEvent(eventName, eventContext) {

        if (!bindings.has(eventName)) {
            return;
        }

        const eventBindings = bindings.get(eventName)

        for (const _binding of eventBindings) {

            const anyDelay = hasDelay(_binding.actions);
            if (anyDelay)
                handleEventWithDelay(_binding, anyDelay, eventContext)
            else
                handleEventImmidiatly(_binding, eventContext)
        }
    }


    function handleEventImmidiatly(binding, eventContext) {
        for (const action of binding.actions) {
            callIndividualAction(action, binding.target, eventContext)
        }
    }


    function handleEventWithDelay(binding, delayfunction, eventContext) {

        let delayfunc = parseFunctionCall(delayfunction);

        const delayValue = delayfunc.args[0];

        setTimeout(() => {

            for (const action of binding.actions) {
                if (action.match(delayPattern))
                    continue;
                callIndividualAction(action, binding.target, eventContext)
            }

        }, delayValue);

    }


    function callIndividualAction(action, target, eventContext) {
        const calls = parseFunctionCall(action);

        const args = getCallArguments(calls, eventContext);

        if (handlers.has(calls.functionName)) {
            let hdlr = handlers.get(calls.functionName);
            hdlr(...args);
            hdlr = null;
            return
        }

        executeAction(calls.functionName, args, target);
    }

    function hasDelay(bindingAcctions) {
        const result = bindingAcctions.find(c => delayPattern.test(c));
        return result;
    }

    function getValueByPath(obj, path) {
        const result = path.split(/[\.\[\]]/)
            .filter(part => part !== '')
            .reduce((current, key) => {
                const tmp = current && current[key] !== undefined ? current[key] : undefined;

                return tmp;
            }, obj);

        return result;
    }


    function getCallArguments(funcCallInfo, eventContext) {
        let args = [];
        if (funcCallInfo.args !== undefined && funcCallInfo.args != "") {

            args = funcCallInfo.args.map(c => {
                if (c.startsWith("ctx.")) {
                    const val = getValueByPath(eventContext, c.replace("ctx.", ""));
                    return val;
                } else {
                    return c;
                }
            });
        }

        return args;
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
        raiseEvent,
        cacheBindings

    };
})();

function getAllBoundElements() {
    return document.querySelectorAll('[data-bind]:not([data-grabbed])');
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
                inString = false;
                continue;
            }
            current += char;
        }
        else {
            if ((char === '"' || char === "'") && depth === 0) {
                inString = true;
                stringChar = char;
                continue;
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
