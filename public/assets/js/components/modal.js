// assets/js/components/modal.js
import { _$, on } from "../dom.js";


export class Md_Modal {
  constructor({ type = "info", title = "", message = "", buttons = [], overlayClose = true } = {}) {
    this.type = type;
    this.title = title;
    this.message = message;
    this.buttons = buttons.length ? buttons : this.getDefaultButtons(type);
    this.overlayClose = overlayClose;
    this.modal = this.buildModal();
    document.body.appendChild(this.modal);
  }

  getDefaultButtons(type) {
    switch (type) {
      case "confirm":
        return [
          { text: "Yes", className: "mv-primary", onClick: () => this.close() },
          { text: "No", className: "mv-danger-btn", onClick: () => this.close() }
        ];
      case "danger":
        return [{ text: "Ok", className: "mv-danger-btn", onClick: () => this.close() }];
      default:
        return [{ text: "Ok", className: "mv-primary", onClick: () => this.close() }];
    }
  }

  buildModal() {
    const overlay = _$("div", { className: "mv-overlay" });
    const container = _$("div", { className: `mv-modal mv-${this.type}` },
      _$("h2", { className: "mv-title" }, this.title),
      _$("p", { className: "mv-message" }, this.message)
    );

    const btnContainer = _$("div", { className: "mv-buttons" });
    this.buttons.forEach((btn) => {
      const button = _$("button", { className: btn.className, onclick: btn.onClick }, btn.text);
      btnContainer.appendChild(button);
    });

    container.appendChild(btnContainer);
    overlay.appendChild(container);

    if (this.overlayClose) {
      on(overlay, "click", (e) => {
        if (e.target === overlay) this.close();
      });
    }

    return overlay;
  }

  open() { this.modal.classList.add("active"); }
  close() { this.modal.remove(); }

  static info(title, message) { const m = new Md_Modal({ type: "info", title, message }); m.open(); return m; }
  static confirm(title, message, callback) {
    const m = new Md_Modal({
      type: "confirm",
      title,
      message,
      buttons: [
        { text: "Yes", className: "mv-primary", onClick: () => { m.close(); callback && callback(true); } },
        { text: "No", className: "mv-danger-btn", onClick: () => { m.close(); callback && callback(false); } }
      ]
    });
    m.open();
    return m;
  }
  static danger(title, message) { const m = new Md_Modal({ type: "danger", title, message }); m.open(); return m; }
}


// -------------------- Form Modal --------------------
export class Md_FormModal extends Md_Modal {
  constructor({ title = "", message = "", fields = [], onSubmit, overlayClose = true } = {}) {
    const form = _$("form", { className: "mv-form" });

    fields.forEach(field => {
      const wrapper = _$("div", { className: "mv-field" });
      const input = _$("input", {
        type: field.type || "text",
        name: field.name,
        placeholder: field.placeholder || "",
        required: field.required || false,
        className: "mv-input"
      });
      if (field.label) wrapper.appendChild(_$("label", {}, field.label));
      wrapper.appendChild(input);
      form.appendChild(wrapper);

      // Live validation + auto-submit
      on(input, "input", () => {
        const valid = field.validate ? field.validate(input.value) : input.checkValidity();
        input.classList.toggle("mv-invalid", !valid);
        input.classList.toggle("mv-valid", valid);

        if (field.autoSubmit && form.checkValidity()) this.handleSubmit(form, onSubmit);
      });
    });

    super({
      type: "confirm",
      title,
      message,
      buttons: [
        { text: "Submit", className: "mv-primary", onClick: () => this.handleSubmit(form, onSubmit) },
        { text: "Cancel", className: "mv-danger-btn", onClick: () => this.close() }
      ],
      overlayClose
    });

    const btnContainer = this.modal.querySelector(".mv-buttons");
    this.modal.querySelector(".mv-modal").insertBefore(form, btnContainer);

    this.form = form;
    this.onSubmit = onSubmit;
  }

  handleSubmit(form, callback) {
    const formData = {};
    let valid = true;

    Array.from(form.elements).forEach(input => {
      if (!input.checkValidity()) {
        valid = false;
        input.classList.add("mv-invalid");
      } else {
        input.classList.remove("mv-invalid");
        input.classList.add("mv-valid");
        formData[input.name] = input.value.trim();
      }
    });

    if (!valid) return;
    callback && callback(formData);
    this.close();
  }

  static open({ title, message, fields = [], overlayClose = true } = {}) {
    return new Promise(resolve => {
      new Md_FormModal({
        title,
        message,
        fields,
        overlayClose,
        onSubmit: data => resolve(data)
      }).open();
    });
  }

  static pin({ title = "Enter PIN", length = 6 } = {}) {
    const fields = Array.from({ length }, (_, i) => ({
      name: `pin${i+1}`,
      type: "number",
      required: true,
      autoSubmit: true,
      placeholder: "•"
    }));
    return Md_FormModal.open({ title, fields });
  }
}

// -------------------- Example usage --------------------
// Md_FormModal.pin({ length: 6 }).then(data => console.log(data));
// Md_FormModal.open({ title: "Custom Form", fields: [{ name: "email", type: "email", required: true }] }).then(console.log);