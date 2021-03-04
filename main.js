/* -*- coding: iso-safe -*- */

'use strict';

// CONFIG
const DEBUG = false;

if(location.hash === "#backgroundpage") {
    // INSTALL HANDLERS
    updateAllTitles();
    // try to keep in same order as documentation (alphabetical)
    chrome.tabs.onActivated.addListener((info) => updateAllTitlesOnWindow(info.windowId) );
    chrome.tabs.onAttached.addListener((tabId, attachInfo) => updateAllTitlesOnWindow(attachInfo.newWindowId));
    chrome.tabs.onCreated.addListener(tab => updateAllTitlesOnWindow(tab.windowId));
    chrome.tabs.onDetached.addListener((tabId, detachInfo) => updateAllTitlesOnWindow(detachInfo.oldWindowId));
    chrome.tabs.onMoved.addListener((tabId, moveInfo) => updateAllTitlesOnWindow(moveInfo.windowId));
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => updateAllTitlesOnWindow(removeInfo.windowId));
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => updateTitle(tabId));

    DEBUG && chrome.tabs.onActivated.addListener(async function (info) {
        const tab = await asPromise(cb => chrome.tabs.get(info.tabId, cb));
        console.log("ACTIVATED", tab.id, tab.title);
    });

    DEBUG && chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo) {
        const tab = await asPromise(cb => chrome.tabs.get(tabId, cb));
        const parts = [`CHANGE for ${tab.id} ${tab.title}`];
        for(const key in changeInfo) {
            parts.push(`\n\t${key}: ${JSON.stringify(changeInfo[key])}`);
        }
        console.log(parts.join(""));
    });
}
else if(location.hash === "#popuppage") {
    (async function handlePopupPage() {
        // For now: Require deleting old title tab manually. It may still be wanted after all.
        const newTitle = window.prompt("What title you do want to assign?");
        const div = create(null, "DIV");
        create(div, "TITLE", e => e.innerText = `[${newTitle}]`);
        create(div, "H1",    e => e.innerText = `[${newTitle}]`);
        const tab = asPromise(cb => chrome.tabs.create({
            url: `data:text/html,${div.innerHTML}`,
            index: 0
        }, cb));
    })();
}



// MAIN CODE
function asPromise(func) {
    // Given a function that expects a callback function as its sole argument,
    // return an equivalent promise.
    return new Promise(
        function(resolve, reject) {
            func(resolve);
        }
    );
}

function create(parent, tag, callback) {
    const element = document.createElement(tag);
    if(callback!==undefined) {
        callback(element);
    }
    if(parent!==null) {
        parent.appendChild(element);
    }
    return element;
}



async function getWindowTitle(windowId) {
    // Null indicates that there was no title tab.
    const tabs = await new Promise(cb => chrome.tabs.query({windowId}, cb));
    return ! tabs ? null : // when the window has been closed
        tabs[0].title.match(/^\[.*]$/) ? tabs[0].title :
        null;
}

async function updateTitle(tabId, overrideWindowTitle) {
    // Update title for tabId,
    // using either title obtained by getWindowTitle for the tabs windowId,
    // or overrideWindowTitle if it is defined.

    const tab = await new Promise(cb => chrome.tabs.get(tabId, cb));
    const windowTitle = overrideWindowTitle || await getWindowTitle(tab.windowId);
    const newTitle =
          // Unchanged: Tabs named [..*], may be (future) title tab.
          tab.title.match(/^\[.*]$/) ? tab.title :
          // Active tabs: Add window title prefix, if any.
          tab.active && windowTitle ? windowTitle + " " + tab.title.replace(/^\[.*?]\s*/, "") :
          // Otherwise: Remove prefix.
          tab.title.replace(/^\[.*?]\s*/, "");
    if(newTitle !== tab.title) {
        setTabTitle(tab, newTitle);
    }
}

async function updateAllTitlesOnWindow(windowId) {
    const title = await getWindowTitle(windowId);
    const tabs = await new Promise(cb => chrome.tabs.query({windowId}, cb));
    tabs.forEach(tab => updateTitle(tab.id));
}

async function updateAllTitles() {
    // Use that each window has one active tab.
    const activeTabs = await new Promise(cb => chrome.tabs.query({active:true}, cb));
    activeTabs.forEach(tab => updateAllTitlesOnWindow(tab.windowId));
}

function setTabTitle(tab, newTitle) {
    const msg = "Update title"
        +"\n\tFrom: " + JSON.stringify(tab.title)
        +"\n\tTo:   " + JSON.stringify(newTitle);
    console.log(msg);
    chrome.tabs.executeScript(tab.id, {
        code: `
            (function windowTitleUpdateTitleInjectedCode () {
                const newTitle = ${JSON.stringify(newTitle)};
                const msg = "Window_Title :: " + ${JSON.stringify(msg)};
                console.log(msg);
                document.title = newTitle;
            })();
        `
    });

}
