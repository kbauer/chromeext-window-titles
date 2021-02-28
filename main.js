/* -*- coding: iso-safe -*- */

'use strict';

// CONFIG
const DEBUG = false;
const UPDATE_INTERVAL_MS = 3_000;

// INSTALL HANDLERS
updateTitle();
window.setInterval(() => updateTitle(), UPDATE_INTERVAL_MS);
chrome.tabs.onActivated.addListener( () => updateTitle() );
//window.setTimeout(() => location.reload(), 1000);


function asPromise(func) {
    // Given a function that expects a callback function as its sole argument,
    // return an equivalent promise.
    return new Promise(
        function(resolve, reject) {
            func(resolve);
        }
    );
}


async function updateTitle() {
    DEBUG && console.log(
        "____________________________________________________________\n"
        + "Updating title...");
    const activeTabs = await asPromise(cb=>chrome.tabs.query({active:true}, cb));
    const tasks = [];
    for(const activeTab of activeTabs) {
        const windowTabs = await asPromise(cb=>chrome.tabs.getAllInWindow(activeTab.windowId, cb));
        const titleTab = (function() {
            const s = windowTabs[0].title;
            if(s.match(/\[(.*)]/)) {
                return windowTabs[0];
            } else {
                return null;
            }
        })();

        // Generate task list
        for(const tab of windowTabs) {
            let m;
            if( titleTab && tab.id == titleTab.id ) {
                DEBUG && logtab(tab, "SKIP_TITLE_TAB");
            }
            else if (tab.url.match(/^chrome:/)) {
                // Cannot access chrome:// urls with content scripts.
                DEBUG && logtab(tab, "SKIP_CHROME_URL");
            }
            else if (titleTab && tab.id == activeTab.id) {
                if(tab.title.startsWith(titleTab.title)) {
                    DEBUG && logtab(tab, "KEEP_PREFIX");
                }
                else {
                    logtab(tab, "ADD_PREFIX");
                    updateTabTitle(tab, titleTab.title + " " + tab.title);
                }
            }
            else if(m = tab.title.match(/^\[.*]\s*(.*)$/)) {
                logtab(tab, "REM_PREFIX");
                updateTabTitle(tab, m[1]);
            }
            else {
                DEBUG && logtab(tab, "NOTHING");
            }

        }

    }
}

function logtab(tab, msg) {
    console.log("TabLog:", msg, JSON.stringify(tab.title));
}

function updateTabTitle(tab, newTitle) {
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


chrome.tabs.onActivated.addListener(async function (info) {
    const tab = await asPromise(cb => chrome.tabs.get(info.tabId, cb));
    console.log("ACTIVATED", tab.id, tab.title);
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo) {
    const tab = await asPromise(cb => chrome.tabs.get(tabId, cb));
    const parts = [`CHANGE for ${tab.id} ${tab.title}`];
    for(const key in changeInfo) {
        parts.push(`\n\t${key}: ${JSON.stringify(changeInfo[key])}`);
    }
    console.log(parts.join(""));
});
