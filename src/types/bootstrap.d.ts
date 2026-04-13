declare module "bootstrap" {
  export class Modal {
    static getInstance(element: Element): Modal | null;
    static getOrCreateInstance(element: Element): Modal;
    show(): void;
    hide(): void;
  }
}
