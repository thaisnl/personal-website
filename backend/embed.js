function initTwinBridge() {
    const ALLOWED_ORIGINS = __ALLOWED_ORIGINS__;
    let twinReady = false;
    const pendingPrompts = [];

    function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
            valueSetter.call(element, value);
        } else {
            element.value = value;
        }
    }

    function findTextarea() {
        return (
            document.querySelector('textarea[data-testid="textbox"]') ||
            document.querySelector(".gradio-container textarea") ||
            document.querySelector("textarea")
        );
    }

    function findSubmitButton(textarea) {
        if (!textarea) return null;

        const container = textarea.closest(".gradio-container") || document;
        return (
            container.querySelector('button[data-testid="submit-button"]') ||
            container.querySelector('button[aria-label="Submit"]') ||
            container.querySelector('button[aria-label="submit"]') ||
            container.querySelector('button[aria-label="Send"]') ||
            container.querySelector('button[aria-label="send"]') ||
            container.querySelector('button#submit') ||
            textarea.closest("form")?.querySelector("button[type='submit']") ||
            Array.from(container.querySelectorAll("button")).find((btn) => {
                const label = (btn.getAttribute("aria-label") || btn.textContent || "").toLowerCase();
                return (label.includes("submit") || label.includes("send") || label.includes("enviar")) && !btn.disabled;
            })
        );
    }

    function sendPrompt(text) {
        const textarea = findTextarea();
        if (!textarea) return false;

        textarea.focus();
        setNativeValue(textarea, text);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));

        setTimeout(() => {
            const submit = findSubmitButton(textarea);
            if (submit) {
                submit.click();
            } else {
                textarea.dispatchEvent(
                    new KeyboardEvent("keydown", {
                        key: "Enter",
                        code: "Enter",
                        keyCode: 13,
                        which: 13,
                        bubbles: true,
                    })
                );
            }
        }, 50);

        return true;
    }

    function flushPendingPrompts() {
        twinReady = true;
        while (pendingPrompts.length) {
            sendPrompt(pendingPrompts.shift());
        }
    }

    function handlePrompt(text) {
        if (!text) return;
        if (!twinReady) {
            pendingPrompts.push(text);
            return;
        }
        sendPrompt(text);
    }

    window.addEventListener("message", (event) => {
        if (!ALLOWED_ORIGINS.includes(event.origin)) return;

        const data = event.data || {};
        if (data.type !== "twin:prompt" || typeof data.text !== "string") return;

        handlePrompt(data.text.trim());
    });

    function notifyReady() {
        if (findTextarea()) {
            flushPendingPrompts();
            if (window.parent !== window) {
                window.parent.postMessage({ type: "twin:ready" }, "*");
            }
            return;
        }

        setTimeout(notifyReady, 250);
    }

    notifyReady();
}

initTwinBridge();
