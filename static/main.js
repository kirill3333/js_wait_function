'use strict'

function waitFor(...args) {
    console.log('start waiting');

    let waiters = [];
    let promises = [];
    let xhrs = [];
    let stopWaiting  = false;

    let originalSetTimeout = window.setTimeout;

    window.setTimeout = function(...args) {

        let waiterId = waiters.length;
        waiters.push(false);

        console.log(`Waiter ${waiterId}`)

        let originalCallBack = args[0];
        let newCallback = function() {
            console.log(`Callback ${waiterId}`)

            try {
                originalCallBack.call(this);
            } catch(e) {
                console.log(e);
                stopWaiting = true;
            }

            waiters[waiterId] = true;
            window.setTimeout = originalSetTimeout;
        }
        args[0] = newCallback;

        originalSetTimeout.apply(this, args);
    }

    let originalXHR = window.XMLHttpRequest;

    class _XMLHttpRequest extends window.XMLHttpRequest {
        constructor(...args) {
            super((args && args.length > 0) ? args[0] : {});
            xhrs.push(this);
        }
    }

    window.XMLHttpRequest = _XMLHttpRequest;

    for (let func of args) {
        try {
            let result = func();
            if (result && Object.getPrototypeOf(result) === Promise.prototype) {
                promises.push(result);
            }
        } catch(e) {
            console.log(e);
            stopWaiting = true;
        }
    }

    return Promise.all(promises).then(result => {
        console.log('all promises resolved');
        return new Promise((resolve, reject) => {
            let waiter = function() {
                if ((waiters.every((waiter) => {return waiter}) && xhrs.every((xhr) => {return xhr.readyState == 4})) || stopWaiting) {
                    window.setTimeout = originalSetTimeout;
                    window.XMLHttpRequest = originalXHR;
                    resolve();
                    console.log('finish');
                } else {
                    console.log('wait...');
                    originalSetTimeout(waiter, 100);
                }
            }
            waiter();
        })


    }, error => {
        window.setTimeout = originalSetTimeout;
        window.XMLHttpRequest = originalXHR;

        console.log(error);
    });
}

function simpleFunction() {
    console.log('simple function')
}

function promiseFunction() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log('promise resolved');
            resolve();
        }, 300);
    })
}

function xhrFunction() {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', 'xhr', true);
    xhr.onload = function() {
        console.log(this.responseText);
    }
    xhr.send();
}

function timeOutFunction() {
    setTimeout(() => {
        console.log('timeout')
    }, 1000);

    setTimeout(() => {
        console.log('timeout1')
    }, 500);
}

function errorFunction() {
    setTimeout(() => {
        throw new Error();
    }, 1500);
}

waitFor(xhrFunction, simpleFunction, timeOutFunction, promiseFunction).then(() => {
    console.log('next functionality');
});
