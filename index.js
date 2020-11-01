const allowedNames = [
    'assert',
    'debug',
    'log',
    'info',
    'warn',
    'error',
    'dir',
    'dirxml',
    'exception',
    'group',
    'groupCollapsed',
    'groupEnd',
];

const timeStyle = 'color: grey; font-weight: normal;';

function now(t = new Date){
    return t.toLocaleString('ru-UA', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    }) + '.' + (`${t / 1000}`.split('.')[1] || 0)
}

function round(num, d){
    d = (10 ** d);
    return Math.floor(num / d) * d
}

function diff(t1, t2){
    t1 = t1 * 1;
    t2 = t2 * 1;
    const diff = t1 < t2 ? t2 - t1 : t1 - t2;
    const ms = diff - round(diff, 3);
    var a = (diff - ms) / 1000;
    const s = a - (Math.floor(a / 60) * 60);
    a = (a - s) / 60;
    const m = a - (Math.floor(a / 60) * 60);
    const h = (a - m) / 60;
    return `${h}:${m}:${s}.${ms}`
}

const _name = Symbol('[[name]]');
const _start = Symbol('[[start]]');
const _stack = Symbol('[[stack]]');
const _async = Symbol('[[async]]');
const _endSession = Symbol('[[endSession]]');

class AsyncConsole{
    constructor(){
        this[_start] = new Date;
        this[_stack] = [];
    }
    [_endSession](){
        const start = this[_start];
        const finish = new Date;
        console.group(`%c${this[_async] ? 'As' : 'S'}ync function logger for %c` + (this[_name] || 'anonymous') + ` %c(%cdone in ${diff(start, finish)}%c) @ ${now(start)} - ${now(finish)}`, 'font-weight: normal;', 'font-weight: bold;', timeStyle, 'color: #1162ce; font-weight: bold;', timeStyle);
        this[_stack].forEach(cb => cb());
        delete this[_stack];
        console.groupEnd()
    }
}

const productionConsole = Object.create(null);
function emptyFunction(){}

allowedNames.forEach(method => {
    AsyncConsole.prototype[method] = function(...args){
        const stack = this[_stack];
        stack.push(console.group.bind(null, `%c@ ${now()}`, timeStyle));
        stack.push(console[method].bind(null, ...args));
        stack.push(console.groupEnd)
    };
    productionConsole[method] = emptyFunction
});

module.exports = {
    default(func){
        return function(...args){
            const console = new AsyncConsole;
            const targetF = func(console);
            console[_name] = targetF.name;
            const res = targetF.apply(this, args);
            if(res && typeof res.then === 'function') return res.then(v => {
                console[_async] = true;
                console.log('return:', v);
                console[_endSession]();
                return v
            }); else {
                console.log('return:', res);
                console[_endSession]();
                return res
            }
        }
    },
    withName(name, f){
        return Object.defineProperty(f, 'name', { value: name })
    },
};

Object.defineProperty(module.exports, '__esModule', { value: true })
