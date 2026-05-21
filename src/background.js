/* globals chrome */
import setupNetRequestRules, { transformMatchReplace } from "./netRequestRules.js";

let allRuleGroups = [];
let readyPromise;

const reloadData = async ({ rebuildDNR = false } = {}) => {
    const existingData = await chrome.storage.local.get({ ruleGroups: [] });
    const ruleGroups = existingData.ruleGroups;

    const fileIds = {};
    ruleGroups.forEach(group => {
        (group.rules || []).forEach(rule => {
            if (rule.type === 'fileInject') {
                fileIds[`f${rule.id}`] = '';
            }
        });
    });

    if (Object.keys(fileIds).length > 0) {
        const files = await chrome.storage.local.get(fileIds);
        ruleGroups.forEach(group => {
            (group.rules || []).forEach(rule => {
                if (rule.type === 'fileInject') {
                    rule.file = files[`f${rule.id}`] || '';
                }
            });
        });
    }

    allRuleGroups = ruleGroups;

    if (rebuildDNR) {
        for (const group of ruleGroups) {
            try {
                await setupNetRequestRules(group);
            } catch (e) {
                console.error("Failed to rebuild DNR for group", group.id, e);
            }
        }
    }
};
readyPromise = reloadData({ rebuildDNR: true });

chrome.runtime.onInstalled.addListener(() => {
    readyPromise = reloadData({ rebuildDNR: true });
});


const actions = {
    sync: () => {
        readyPromise = reloadData();
    }
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    // console.log("BG ON MESSAGE!", request);
    let sentResponse = false;
    const mySendResponse = (...args) => {
        sentResponse = true;
        sendResponse(...args);
    };
    const action = actions[request.action];
    if (action) {
        await action(request, sender, mySendResponse);
        if (!sentResponse) {
            sendResponse();
        }
        // !!!Important!!! Need to return true for sendResponse to work.
        return true;
    }
    console.error(`BG message handler: No action named ${request.action}`);
});

chrome.action.onClicked.addListener(function() {
    // open or focus options page.
    const optionsUrl = chrome.runtime.getURL("src/devtoolstab.html");
    chrome.tabs.query({}, function(extensionTabs) {
        let found = false;
        for (let i = 0, len = extensionTabs.length; i < len; i++) {
            if (optionsUrl === extensionTabs[i].url) {
                found = true;
                chrome.tabs.update(extensionTabs[i].id, {selected: true});
                break;
            }
        }
        if (found === false) {
            chrome.tabs.create({url: optionsUrl});
        }
    });
});

console.log("hi bg9");

// eslint-disable-next-line no-unused-vars
const urlMatches = (matchStr, url) => {
    const result = transformMatchReplace(matchStr);
    let regex;
    try {
        regex = new RegExp(result.match);
    } catch {}
    return regex && regex.test(url);
};

chrome.webNavigation.onCommitted.addListener(async (details) => {
    try {
        await readyPromise;
    } catch {}
    for (const ruleGroup of allRuleGroups) {
        if (!ruleGroup.on) continue;
        const rules = ruleGroup.rules || [];
        for (const rule of rules) {
            if (!(rule.on && rule.type === "fileInject" && urlMatches(rule.match, details.url))) continue;
            try {
                if (rule.fileType === "js") {
                    await chrome.scripting.executeScript({
                        target: { tabId: details.tabId, frameIds: [details.frameId] },
                        func: code => {
                            const el = document.createElement('script');
                            el.textContent = code;
                            (document.head || document.documentElement).appendChild(el);
                            el.remove();
                        },
                        args: [rule.file],
                        world: 'MAIN',
                    });
                } else if (rule.fileType === 'css') {
                    await chrome.scripting.insertCSS({
                        target: { tabId: details.tabId },
                        css: rule.file,
                        origin: "USER"
                    });
                }
            } catch (e) {
                console.warn(`fileInject rule ${rule.id} failed on ${details.url}:`, e.message);
            }
        }
    }
});
