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

const fileInjectTemplate = document.getElementById("fileInjectTemplate");

const createFileInjectMarkup = async (savedData, saveFunc) => {
    savedData = savedData || {};
    saveFunc = saveFunc || (() => {});

    let rid = savedData.id;
    if (!rid) {
        const allData = await chrome.storage.local.get({ ruleGroups: [] });
        rid = getNextRuleId(allData.ruleGroups);
    }
    const override = instanceTemplate(fileInjectTemplate);
    override.id = `r${rid}`;
    const aliasInput = override.querySelector(".aliasInput");
    const matchInput = override.querySelector(".matchInput");
    const fileName = override.querySelector(".fileName");
    const fileType = override.querySelector(".fileTypeSelect");
    const editBtn = override.querySelector(".edit-btn");
    const ruleOnOff = override.querySelector(".onoffswitch-checkbox");
    const deleteBtn = override.querySelector(".sym-btn");

    aliasInput.value = savedData.alias || "";
    matchInput.value = savedData.match || "";
    makeFieldRequired(matchInput);
    fileName.value = savedData.fileName || "";
    fileType.value = savedData.fileType || "js";
    ruleOnOff.checked = savedData.on === false ? false : true;

    if (savedData.on === false) {
        override.classList.add("disabled");
    }

    editBtn.addEventListener("click", () => {
        openEditor(rid, fileName.value, true);
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
            saveFunc();
        }, 300);
    });

    deleteBtn.addEventListener("mouseout", () => {
        deleteButtonIsSureReset(deleteBtn);
    });

    aliasInput.addEventListener("keyup", saveFunc);
    matchInput.addEventListener("keyup", saveFunc);
    fileName.addEventListener("keyup", saveFunc);
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
    fileType.addEventListener("change", saveFunc);

    setupRuleAccordion(override, rid, () => `${fileType.value.toUpperCase()} on ${shortenUrl(matchInput.value)}`, !savedData.id);

    return override;
};

export default createFileInjectMarkup;
