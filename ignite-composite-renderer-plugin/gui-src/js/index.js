let compositeRenderer = null;
let compositeRendererReady = [];

window.compositeRendererInstance = () => compositeRenderer;
window.compositeRenderer = () => new Promise((resolve, _reject) => {
  if (!!compositeRenderer) {
    resolve(compositeRenderer);
  } else {
    compositeRendererReady.push(mod => resolve(mod));
  }
});

import('../pkg/index.js')
  .then(mod => {
    compositeRenderer = mod;
    for (const cb of compositeRendererReady) {
      cb(mod);
    }
    compositeRendererReady = [];
  }).catch(console.error);

import './CompositeRendererWidget';
