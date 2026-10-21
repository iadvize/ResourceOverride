/* globals chrome */
import createOnOffSwitch from "./onOffSwitch.js";


export const getUiElements = (parentElement) => {
    const ui = {};
    parentElement.querySelectorAll('[id]').forEach((item) => {
        ui[item.id] = item;
    });
    return ui;
};

export const instanceTemplate = (template) => {
    const newDom = document.importNode(template.content, true).children[0];
    const switchDiv = newDom.querySelector(".switch");
    if (switchDiv) {
        switchDiv.appendChild(createOnOffSwitch());
    }
    return newDom;
};

export const createEl = (tagWithClasses, attrs = {}) => {
    const tagParts = tagWithClasses.split(".");
    const tagName = tagParts.shift();
    const newEl = document.createElement(tagName);
    if (tagParts.length) {
        newEl.className = tagParts.join(" ");
    }
    Object.keys(attrs).forEach(attr => {
        newEl.setAttribute(attr, attrs[attr]);
    });
    return newEl;
};

export const deleteButtonIsSure = (deleteBtn) => {
    if (!deleteBtn.dataset.isSure) {
        deleteBtn.dataset.isSure = 1;
        deleteBtn.dataset.originalHtml = deleteBtn.innerHTML;
        deleteBtn.textContent = "Sure?";
        return false;
    }
    return true;
};

export const deleteButtonIsSureReset = (deleteBtn) => {
    if (deleteBtn.dataset.originalHtml) {
        deleteBtn.innerHTML = deleteBtn.dataset.originalHtml;
    }
    delete deleteBtn.dataset.isSure;
    delete deleteBtn.dataset.originalHtml;
};

export const debounce = (fn, amt) => {
    let timeout;
    return (...args) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => fn(...args), amt);
    };
};

export const getNextGroupId = (groups) => {
    let maxId = 0;
    groups.forEach((group) => {
        maxId = Math.max(group.id || 0, maxId);
    });
    return maxId + 1;
};

export const getNextFileId = (nodeList) => {
    let maxId = 0;
    nodeList.forEach((el) => {
        const id = parseInt((el.dataset.fileId || "").substring(1), 10);
        if (!isNaN(id) && id > maxId) {
            maxId = id;
        }
    });
    return 'f' + (maxId + 1);
};

export const parseRuleId = (ruleId) => {
    if (ruleId.substring) {
        return parseInt(ruleId.substring(1));
    }
    return ruleId;
};

export const getNextRuleId = (ruleGroups) => {
    let maxId = 0;
    ruleGroups.forEach(group => {
        const rules = group.rules || [];
        rules.forEach(rule => {
            maxId = Math.max(rule.id || 0, maxId);
        });
    });
    return maxId + 1;
};

export const makeFieldRequired = (input) => {
    const checkRequiredField = () => {
        input.classList.toggle("invalid", input.value === "");
    };
    input.addEventListener("input", checkRequiredField);
    checkRequiredField();
};

export const shortenString = (str, limit) => {
    const over = str.length - limit;
    if (over > 0) {
        const halfPos = str.length / 2;
        const firstOffset = Math.floor(over / 2 + 2);
        const secondOffset = Math.ceil(over / 2 + 3);
        return str.substring(0, halfPos - firstOffset) + " ... " +
            str.substring(halfPos + secondOffset);
    }
    return str;
};

export const getTabResources = (cb) => {
    if (chrome.devtools && chrome.devtools.inspectedWindow && chrome.devtools.inspectedWindow.getResources) {
        chrome.devtools.inspectedWindow.getResources((resourceList) => {
            if (resourceList) {
                const filteredList = resourceList.filter((resource) => {
                    const url = resource.url.trim();
                    if (url) {
                        const validStart = (/^http/).test(url);
                        const invalidFormat = (/\.jpg$|\.jpeg$|\.gif$|\.png$/).test(url);
                        return validStart && !invalidFormat;
                    }
                    return false;
                }).map((resource) => {
                    return resource.url;
                });
                cb(filteredList.sort());
            }
        });
        return true;
    }
    return false;
};

export const fadeOut = (el, opts = {}) => {
    const duration = opts.duration || "0.3s";
    el.style.transition = `opacity ${duration}`;
    el.setAttribute("tabindex", "-1");
    el.classList.add("fadeOut");
};

export const fadeIn = (el, opts = {}) => {
    const duration = opts.duration || "0.3s";
    el.style.transition = `opacity ${duration}`;
    el.removeAttribute("tabindex");
    el.classList.remove("fadeOut");
};

export const toggleFade = (el, opts = {}) => {
    if (el.classList.contains("fadeOut")) {
        fadeIn(el, opts);
    } else {
        fadeOut(el, opts);
    }
};

export const showToast = (message) => {
    const generalToast = document.querySelector("#generalToast");
    generalToast.innerHTML = message;
    fadeIn(generalToast);
    setTimeout(() => {
        fadeOut(generalToast);
    }, 3500);
};

export const isChrome = () => navigator.userAgent.indexOf("Chrome") > -1;

export const parseHeaderDataStr = (headerDataStr) => {
    const ans = [];
    const rules = headerDataStr.split(";");
    const len = rules.length;
    for (let x = 0; x < len; x++) {
        const rule = rules[x];
        const ruleParts = rule.split(": ");
        if (ruleParts[0].indexOf("set") === 0) {
            if (ruleParts.length === 2) {
                ans.push({
                    operation: "set",
                    header: decodeURIComponent(ruleParts[0].substring(4)).toLowerCase(),
                    value: decodeURIComponent(ruleParts[1])
                });
            }
        } else if (ruleParts[0].indexOf("remove") === 0) {
            ans.push({
                operation: "remove",
                header: decodeURIComponent(ruleParts[0].substring(7)).toLowerCase()
            });
        }
    }
    return ans;
};

export const sendSyncMessage = () => chrome.runtime.sendMessage({ action: "sync" });

export const saveDataAndSync = async (data) => {
    await chrome.storage.local.set(data);
    // sending the sync message can just fail randomly. I have no idea why.
    sendSyncMessage().catch((e) => console.warn("Failed to sync.", e));
};

export const simpleError = (err) => {
    if (err.stack) {
        console.error("=== Printing Stack ===");
        console.error(err.stack);
    }
    console.error(err);
};

export const debug = (message) => {
    const debugDiv = document.getElementById("debug");
    const log = document.createElement("div");
    log.className = "debugLog";
    const timeArr = new Date().toString().split(" ");
    timeArr.shift();
    const time = timeArr.slice(0, 4).join(" ");
    log.textContent = `[${time}] ${message}`;
    debugDiv.appendChild(log);
};


// UI state (which groups are folded, which rules are unfolded). Kept apart from ruleGroups
// so it never triggers a rules sync.
let uiStatePromise;
const loadUiState = () => {
    uiStatePromise = uiStatePromise || chrome.storage.local.get({ uiState: {} }).then(res => res.uiState);
    return uiStatePromise;
};

const updateUiState = async (mutate) => {
    const uiState = await loadUiState();
    uiState.collapsedGroups = uiState.collapsedGroups || [];
    uiState.expandedRules = uiState.expandedRules || [];
    mutate(uiState);
    await chrome.storage.local.set({ uiState });
};

const toggleInList = (list, value, present) => {
    const idx = list.indexOf(value);
    if (present && idx === -1) {
        list.push(value);
    } else if (!present && idx > -1) {
        list.splice(idx, 1);
    }
};

export const forgetGroupUiState = (groupId) => updateUiState(s => toggleInList(s.collapsedGroups, groupId, false));

export const forgetRuleUiState = (ruleId) => updateUiState(s => toggleInList(s.expandedRules, ruleId, false));

// "https://*.iadvize.com/a/b.js" -> "*.iadvize.com/a/b.js"
export const shortenUrl = (url = "") => url.trim().replace(/^[a-z*]+:\/\//i, "");

export const setupGroupAccordion = async (domain, groupId) => {
    const toggle = domain.querySelector(".domainToggle");
    const rulesContainer = domain.querySelector(".overrideRules");
    const count = domain.querySelector(".ruleCount");

    const updateCount = () => {
        const nb = rulesContainer.querySelectorAll(".ruleContainer").length;
        count.textContent = `${nb} rule${nb === 1 ? "" : "s"}`;
    };
    updateCount();
    new MutationObserver(updateCount).observe(rulesContainer, { childList: true });

    const setCollapsed = (collapsed) => {
        domain.classList.toggle("collapsed", collapsed);
        toggle.setAttribute("aria-expanded", String(!collapsed));
    };
    const groupSwitch = domain.querySelector(".domainHeader .onoffswitch-checkbox");
    const uiState = await loadUiState();
    // A disabled group starts folded: nothing in it is active anyway.
    setCollapsed(!groupSwitch.checked || (uiState.collapsedGroups || []).includes(groupId));

    const changeCollapsed = (collapsed) => {
        setCollapsed(collapsed);
        updateUiState(s => toggleInList(s.collapsedGroups, groupId, collapsed));
    };

    toggle.addEventListener("click", () => changeCollapsed(!domain.classList.contains("collapsed")));

    // Fold the group when it gets disabled, unfold it when it gets enabled again.
    groupSwitch.addEventListener("change", () => changeCollapsed(!groupSwitch.checked));
};

// Rules are folded by default: only the head row shows, with a summary of the rule
// (from -> to) on the left and the alias next to the on/off switch on the right.
export const setupRuleAccordion = async (rule, ruleId, getSummary, startExpanded) => {
    const toggle = rule.querySelector(".ruleToggle");
    const summary = rule.querySelector(".ruleSummary");

    const refreshSummary = () => {
        const text = getSummary();
        summary.textContent = text;
        summary.title = text;
    };
    refreshSummary();
    rule.addEventListener("input", refreshSummary);
    rule.addEventListener("change", refreshSummary);

    const setExpanded = (expanded) => {
        rule.classList.toggle("collapsed", !expanded);
        toggle.setAttribute("aria-expanded", String(expanded));
    };
    setExpanded(startExpanded);

    const uiState = await loadUiState();
    if (startExpanded) {
        updateUiState(s => toggleInList(s.expandedRules, ruleId, true));
    } else {
        setExpanded((uiState.expandedRules || []).includes(ruleId));
    }

    const toggleRule = () => {
        const expanded = rule.classList.contains("collapsed");
        setExpanded(expanded);
        updateUiState(s => toggleInList(s.expandedRules, ruleId, expanded));
    };
    toggle.addEventListener("click", toggleRule);
    rule.querySelector(".typeBadge").addEventListener("click", toggleRule);
    summary.addEventListener("click", toggleRule);
};
