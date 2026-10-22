import { mainSuggest } from "./suggest.js";
import { openEditor } from "./editor.js";
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

const fileOverrideTemplate = document.getElementById("fileOverrideTemplate");

const createFileOverrideMarkup = async (savedData, saveFunc) => {
    savedData = savedData || {};
    saveFunc = saveFunc || (() => {});

    let rid = savedData.id;
    if (!rid) {
        const allData = await chrome.storage.local.get({ ruleGroups: [] });
        rid = getNextRuleId(allData.ruleGroups);
    }
    const override = instanceTemplate(fileOverrideTemplate);
    override.id = `r${rid}`;
    const aliasInput = override.querySelector(".aliasInput");
    const matchInput = override.querySelector(".matchInput");
    const editBtn = override.querySelector(".edit-btn");
    const ruleOnOff = override.querySelector(".onoffswitch-checkbox");
    const deleteBtn = override.querySelector(".sym-btn");

    aliasInput.value = savedData.alias || "";
    matchInput.value = savedData.match || "";
    makeFieldRequired(matchInput);
    ruleOnOff.checked = savedData.on === false ? false : true;

    if (savedData.on === false) {
        override.classList.add("disabled");
    }

    editBtn.addEventListener("click", () => {
        openEditor(rid, matchInput.value, false);
    });

    deleteBtn.addEventListener("click", () => {
        if (!deleteButtonIsSure(deleteBtn)) {
            return;
        }

        override.style.transition = "none";
        fadeOut(override);
        setTimeout(() => {
            override.remove();
            forgetRuleUiState(rid);
            chrome.storage.local.remove(`f${rid}`);
            saveFunc({ removeIds: [rid] });
        }, 300);
    });

    deleteBtn.addEventListener("mouseout", () => {
        deleteButtonIsSureReset(deleteBtn);
    });

    mainSuggest.init(matchInput);

    aliasInput.addEventListener("keyup", saveFunc);
    matchInput.addEventListener("keyup", saveFunc);
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

    setupRuleAccordion(override, rid, () => `${shortenUrl(matchInput.value)} \u2192 file`, !savedData.id);

    return override;
};

export default createFileOverrideMarkup;
