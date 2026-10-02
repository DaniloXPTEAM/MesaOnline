// jsdom não implementa canvas; os testes de UI validam fluxo/estado, não pixels.
if (typeof HTMLCanvasElement !== "undefined") {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: () => null,
  });
}
