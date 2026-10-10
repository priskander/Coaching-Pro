/**
 * pdf-export.js — PDF generation & export handling for Coaching Sheets and Action Forms.
 * Strictly excludes all instruction hints, tooltips, info icons, and explanatory text.
 */
import { guard } from './auth-session.js';

export function swapNotesTextareasForPdf() {
    document.querySelectorAll('#coachingNotesList textarea[data-notes-idx]').forEach(ta => {
        const div = document.createElement("div");
        div.className = "pdf-notes-render w-full border border-slate-300 rounded p-2 text-xs";
        div.style.whiteSpace = "pre-wrap";
        div.style.wordBreak = "break-word";
        div.style.minHeight = ta.offsetHeight + "px";
        div.textContent = ta.value;
        ta.insertAdjacentElement("afterend", div);
        ta.classList.add("pdf-swapped-out");
    });
}

export function restoreNotesTextareasAfterPdf() {
    document.querySelectorAll('#coachingNotesList .pdf-notes-render').forEach(div => div.remove());
    document.querySelectorAll('#coachingNotesList textarea.pdf-swapped-out').forEach(ta => ta.classList.remove("pdf-swapped-out"));
}

export function getPdfFilename() {
    const nameField = document.querySelector('[data-field="agentName"]');
    const agentName = (nameField && nameField.value.trim()) ? nameField.value.trim() : "Agent";
    const safeName = agentName.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    const dateStr = new Date().toISOString().split("T")[0];
    return "Coaching_Form_" + safeName + "_" + dateStr + ".pdf";
}

export function getPdfExportOptions(filename) {
    return {
        margin: 0.3,
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] }
    };
}

/**
 * Requirement 3: PDF Generation Rules
 * Completely exclude/hide all instruction hints, tooltips, info icons, and explanatory text.
 */
export function preparePdfExportDom(element) {
    element.classList.add("pdf-export-mode");
    // Ensure all tooltips, popups, and instruction hints are hidden
    element.querySelectorAll('.instruction-hint, .info-tooltip-wrap, .tooltip-popup, .pdf-exclude, .help-text, .btn-add-item, [role="tooltip"]')
        .forEach(el => el.style.setProperty('display', 'none', 'important'));
    swapNotesTextareasForPdf();
}

export function cleanupPdfExportDom(element) {
    element.classList.remove("pdf-export-mode");
    element.querySelectorAll('.instruction-hint, .info-tooltip-wrap, .tooltip-popup, .pdf-exclude, .help-text, .btn-add-item, [role="tooltip"]')
        .forEach(el => el.style.removeProperty('display'));
    restoreNotesTextareasAfterPdf();
}

export function saveToPDF() {
    if (!guard("coaching.export")) return;
    const btn = document.getElementById("savePdfBtn");
    const label = document.getElementById("savePdfBtnLabel");
    const element = document.getElementById("coachingForm");
    const filename = getPdfFilename();

    const originalLabel = label ? label.textContent : "Save to PDF";
    if (label) label.textContent = "Generating...";
    if (btn) {
        btn.disabled = true;
        btn.classList.add("opacity-70", "cursor-not-allowed");
    }
    preparePdfExportDom(element);

    window.html2pdf().set(getPdfExportOptions(filename)).from(element).save().then(function () {
        if (label) label.textContent = originalLabel;
        if (btn) {
            btn.disabled = false;
            btn.classList.remove("opacity-70", "cursor-not-allowed");
        }
        cleanupPdfExportDom(element);
    }).catch(function (err) {
        console.error(err);
        if (label) label.textContent = originalLabel;
        if (btn) {
            btn.disabled = false;
            btn.classList.remove("opacity-70", "cursor-not-allowed");
        }
        cleanupPdfExportDom(element);
        alert("Something went wrong generating the PDF. Please try again or use the Print button.");
    });
}

export function generatePdfBlob() {
    const element = document.getElementById("coachingForm");
    const filename = getPdfFilename();
    preparePdfExportDom(element);

    return window.html2pdf().set(getPdfExportOptions(filename)).from(element).outputPdf("blob").then(function (blob) {
        cleanupPdfExportDom(element);
        return { blob: blob, filename: filename };
    }).catch(function (err) {
        cleanupPdfExportDom(element);
        throw err;
    });
}

export function sendEmailWithForm() {
    if (!guard("coaching.edit")) return;
    const btn = document.getElementById("sendEmailBtn");
    const label = document.getElementById("sendEmailBtnLabel");
    const originalLabel = label ? label.textContent : "Send Email";
    if (label) label.textContent = "Preparing...";
    if (btn) {
        btn.disabled = true;
        btn.classList.add("opacity-70", "cursor-not-allowed");
    }

    function resetButton() {
        if (label) label.textContent = originalLabel;
        if (btn) {
            btn.disabled = false;
            btn.classList.remove("opacity-70", "cursor-not-allowed");
        }
    }

    generatePdfBlob().then(function (result) {
        const nameField = document.querySelector('[data-field="agentName"]');
        const agentName = (nameField && nameField.value.trim()) ? nameField.value.trim() : "the agent";
        const dtField = document.getElementById("coachingDateTime");
        const dateLabel = dtField && dtField.value ? dtField.value.replace("T", " ") : new Date().toLocaleDateString();
        const subject = "Coaching Form - " + agentName + " - " + dateLabel;

        let sharedDirectly = false;
        if (navigator.share && navigator.canShare) {
            try {
                const file = new File([result.blob], result.filename, { type: "application/pdf" });
                if (navigator.canShare({ files: [file] })) {
                    sharedDirectly = true;
                    return navigator.share({
                        files: [file],
                        title: subject,
                        text: "Coaching form for " + agentName + " attached."
                    }).then(function () {
                        resetButton();
                    }).catch(function (shareErr) {
                        resetButton();
                        if (shareErr && shareErr.name !== "AbortError") console.error(shareErr);
                    });
                }
            } catch (e) {
                sharedDirectly = false;
            }
        }

        if (!sharedDirectly) {
            const url = URL.createObjectURL(result.blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 2000);

            const body = "Hi,\n\nPlease find the coaching form for " + agentName + ".\n\n" +
                "The PDF (\"" + result.filename + "\") was downloaded to your device — please attach it here before sending.\n\nThanks.";
            window.location.href = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
            resetButton();
        }
    }).catch(function (err) {
        console.error(err);
        resetButton();
        alert("Something went wrong preparing the email. Please try Save to PDF instead.");
    });
}

if (typeof window !== "undefined") {
    window.saveToPDF = saveToPDF;
    window.sendEmailWithForm = sendEmailWithForm;
    window.generatePdfBlob = generatePdfBlob;
    window.swapNotesTextareasForPdf = swapNotesTextareasForPdf;
    window.restoreNotesTextareasAfterPdf = restoreNotesTextareasAfterPdf;
}
