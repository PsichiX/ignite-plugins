import React from 'react';
import { registerWidget } from 'ignite-gui';
import * as mod from '../pkg/index_bg';

mod.main_js();

const style = {
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    border: 0,
    backgroundColor: 'rgb(15, 15, 15)',
  },
};

class CompositeRendererWidget extends React.Component {
  constructor(props) {
    super(props);

    if (!!props.storage) {
      const { storage } = props;
      storage.id = storage.id || null;
      storage.cameraId = storage.cameraId || null;
      this.state = {};
    } else {
      this.state = {
        id: null,
        cameraId: null,
      };
    }
    this._onFrame = this.onFrame.bind(this);
    this._handle = null;
    this._canvasRef = React.createRef();
  }

  componentDidMount() {
    const { props, _canvasRef } = this;
    const { defaultRenderState } = props;

    this._writeStorage(storage => {
      storage.id = mod.renderer_create(_canvasRef.current, defaultRenderState);
      storage.cameraId = mod.camera_create(storage.id || '');
    });

    this._handle = window.requestAnimationFrame(this._onFrame);
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this._handle);
    this._handle = null;

    this._readStorage(storage => {
      mod.renderer_destroy(storage.id || '');
    });
  }

  onFrame() {
    this._readStorage(storage => {
      mod.renderer_refresh(storage.id || '', false);
    });

    this._handle = window.requestAnimationFrame(this._onFrame);
  }

  renderCommands(data) {
    this._readStorage(storage => {
      data = Array.isArray(data) ? { default: data } : data;
      mod.render_commands(storage.id || '', data);
    });
  }

  setCamera(data) {
    this._readStorage(storage => {
      mod.camera_set(storage.id, storage.cameraId, data);
    });
  }

  getCamera(id) {
    return this._readStorage(storage => {
      return mod.camera_state(storage.id, id);
    });
  }

  cameraScreenToWorldSpace(id, x, y) {
    return this._readStorage(storage => {
      return mod.camera_screen_to_world_space(storage.id, id, x, y);
    });
  }

  cameraWorldToScreenSpace(id, x, y) {
    return this._readStorage(storage => {
      return mod.camera_world_to_screen_space(storage.id, id, x, y);
    });
  }

  addImageResource(id, resource) {
    return this._readStorage(storage => {
      return mod.add_image_resource(storage.id, id, resource);
    });
  }

  loadImageResource(id, url) {
    const img = new Image();
    img.src = url;
    return img.decode().then(() => this.addImageResource(id, img));
  }

  removeImageResource(id) {
    return this._readStorage(storage => {
      return mod.remove_image_resource(storage.id, id);
    });
  }

  addFontFaceResource(id, resource) {
    return this._readStorage(storage => {
      return mod.add_fontface_resource(storage.id, id, resource);
    });
  }

  loadFontFaceResource(id, url, descriptors) {
    const font = new FontFace(id, url, descriptors);
    return font.load().then(() => {
      window.fonts.add(font);
      return this.addFontFaceResource(id, font);
    });
  }

  removeFontFaceResource(id) {
    return this._readStorage(storage => {
      window.fonts.add(font);
      return mod.remove_fontface_resource(storage.id, id);
    });
  }

  _readStorage(cb) {
    if (!!this.props.storage) {
      return cb(this.props.storage());
    } else {
      return cb(this.state);
    }
  }

  _writeStorage(cb) {
    if (!!this.props.storage) {
      return cb(this.props.storage());
    } else {
      const result = cb(this.state);
      this.setState(this.state);
      return result;
    }
  }

  render() {
    return (
      <canvas ref={this._canvasRef} style={style.container} />
    );
  }
}

registerWidget('Composite Renderer', CompositeRendererWidget);

// import { registerWindow } from 'ignite-gui';
//
// class CompositeRendererWindow extends React.Component {
//   render() {
//     return (
//       <CompositeRendererWidget />
//     );
//   }
// }
//
// registerWindow('CompositeRenderer', CompositeRendererWindow);
