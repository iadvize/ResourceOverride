import { mainSuggest } from "./suggest.js";
import {
    instanceTemplate,
    getNextRuleId,
    makeFieldRequired,
    deleteButtonIsSure,
    deleteButtonIsSureReset,
    fadeOut,
    shortenUrl,
    setupRuleAccordion,
    forgetRuleUiState
} from "./util.js";

/* globals chrome */

const overrideTemplate = document.getElementById("overrideTemplate");

const createWebOverrideMarkup = async (savedData, saveFunc) => {
    savedData = savedData || {};
    saveFunc = saveFunc || (() => {});

    let rid = savedData.id;
    if (!rid) {
        const allData = await chrome.storage.local.get({ ruleGroups: [] });
        rid = getNextRuleId(allData.ruleGroups);
    }
    const override = instanceTemplate(overrideTemplate);
    override.id = `r${rid}`;
    const aliasInput = override.querySelector(".aliasInput");
    const matchInput = override.querySelector(".matchInput");
    const replaceInput = override.querySelector(".replaceInput");
    const ruleOnOff = override.querySelector(".onoffswitch-checkbox");
    const deleteBtn = override.querySelector(".sym-btn");

    aliasInput.value = savedData.alias || "";
    matchInput.value = savedData.match || "";
    replaceInput.value = savedData.replace || "";
    makeFieldRequired(matchInput);
    makeFieldRequired(replaceInput);
    ruleOnOff.checked = savedData.on === false ? false : true;

    if (savedData.on === false) {
        override.classList.add("disabled");
    }

    deleteBtn.addEventListener("click", () => {
        if (!deleteButtonIsSure(deleteBtn)) {
            return;
        }
        override.style.transition = "none";
        fadeOut(override);
        setTimeout(() => {
            override.remove();
            forgetRuleUiState(rid);
            saveFunc({ removeIds: [rid] });
        }, 300);
    });

    deleteBtn.addEventListener("mouseout", () => {
        deleteButtonIsSureReset(deleteBtn);
    });

    mainSuggest.init(matchInput);

    aliasInput.addEventListener("keyup", saveFunc);
    matchInput.addEventListener("keyup", saveFunc);
    replaceInput.addEventListener("keyup", saveFunc);

    const changeOnOffSwitch = () => {
        if (ruleOnOff.checked) {
            override.classList.remove("disabled");
        } else {
            override.classList.add("disabled");
        }
        saveFunc();
    };
    ruleOnOff.addEventListener("click", changeOnOffSwitch);
    ruleOnOff.addEventListener("change", changeOnOffSwitch);

    setupRuleAccordion(override, rid, () => `${shortenUrl(matchInput.value)} \u2192 ${shortenUrl(replaceInput.value)}`, !savedData.id);

    return override;
};

export default createWebOverrideMarkup;
