import React from 'react';
import {
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@material-ui/core';
import {
  Fullscreen as FullscreenIcon,
  AspectRatio as FillViewIcon,
  Refresh as ReloadIcon,
  Close as CloseIcon,
} from '@material-ui/icons';
import { registerWindow } from 'ignite-gui';
import { ignite, on, off, emit } from 'ignite-editor';

const extensionsList = [
  ['.png', 'image'],
  ['.jpg', 'image'],
  ['.jpeg', 'image'],
  ['.gif', 'image'],
  ['.svg', 'image'],
  ['.mp3', 'audio'],
  ['.ogg', 'audio'],
  ['.wav', 'audio'],
  ['.mp4', 'video'],
  ['.avi', 'video'],
  ['.webm', 'video'],
];
for (const extension of extensionsList) {
  emit('gui/register-file-opener', extension[0], 'ignite-media-plugin');
}

function getFileType(filePath) {
  for (const [extension, type] of extensionsList) {
    if (filePath.endsWith(extension)) {
      return type;
    }
  }
  return null;
}

const style = {
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    width: '100%',
    height: 48,
    overflow: 'auto',
    textAlign: 'center',
  },
  iconActive: {
    color: window.gui.theme.palette.background.paper,
    backgroundColor: window.gui.theme.palette.primary.main,
  },
  view: {
    width: '100%',
    height: 'calc(100% - 82px)',
    overflow: 'hidden',
    position: 'relative',
    flexGrow: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  }
};

class MediaWindow extends React.Component {
  constructor(props) {
    super(props);

    const storage = props.storage();
    storage.openFiles = storage.openFiles || [];
    storage.active = storage.active || 0;
    storage.isReloading = storage.isReloading || false;
    storage.fillView = storage.fillView || false;
    this.state = {};
    this._onTabChange = this.onTabChange.bind(this);
    this._onGoFullscreen = this.onGoFullscreen.bind(this);
    this._onToggleFillView = this.onToggleFillView.bind(this);
    this._onReload = this.onReload.bind(this);
    this._onClose = this.onClose.bind(this);
    this._onOpenFile = this.onOpenFile.bind(this);
    this._windowRef = React.createRef();
  }

  onTabChange(_event, index) {
    this.props.storage().active = index;
    this.setState({});
  }

  onGoFullscreen() {
    const { current } = this._windowRef;
    if (!current) {
      return;
    }

    if (!document.fullscreenElement) {
      current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  onToggleFillView() {
    const storage = this.props.storage();
    storage.fillView = !storage.fillView;
    this.setState({});
  }

  onReload() {
    this.props.storage().isReloading = true;
    this.setState({});
  }

  onClose() {
    const storage = this.props.storage();
    const { active, openFiles } = storage;
    if (active >= 0 && active < openFiles.length) {
      openFiles.splice(active, 1);
      storage.active = Math.max(0, Math.min(active, openFiles.length - 1));
      this.setState({});
    }
  }

  onOpenFile({ path, name, url }) {
    const storage = this.props.storage();
    const { openFiles } = storage;
    const found = openFiles.find(item => item.path === path);
    let active = storage.active;
    if (!found) {
      openFiles.push({ path, name, url });
      active = openFiles.length - 1;
    } else {
      active = openFiles.indexOf(found);
    }
    storage.active = active;
    this.setState({});
  }

  componentDidMount() {
    this._onOpenFileToken = on('gui/ignite-media-plugin/open-file', this._onOpenFile);

    const { openFiles } = this.props.storage();
    if (!!openFiles && Array.isArray(openFiles)) {
      for (const item of openFiles) {
        if (!!item.path) {
          ignite('ignite-media-plugin', 'open-file', item.path);
        }
      }
    }
  }

  componentWillUnmount() {
    off(this._onOpenFileToken);
  }

  render() {
    const { active, openFiles, isReloading, fillView } = this.props.storage();
    if (!!isReloading) {
      setTimeout(() => {
        this.props.storage().isReloading = false;
        this.setState({});
      }, 1);
    }
    const disabled = isReloading || openFiles.length <= 0;
    const tabs = openFiles.map((file, index) => {
      const title = file.name;
      return <Tab key={index} label={title} />;
    });
    const editors = openFiles.map((item, index) => {
      const type = getFileType(item.path);
      if (type === 'image') {
        return (
          <div
            key={index}
            hidden={active !== index}
            style={style.view}
          >
            <img
              src={item.url}
              style={{
                ...style.image,
                objectFit: fillView ? 'contain' : 'scale-down',
              }}
            />
          </div>
        );
      } else if (type === 'audio') {
        return (
          <audio
            key={index}
            hidden={active !== index}
            src={item.url}
            controls={true}
            style={style.view}
          />
        );
      } else if (type === 'video') {
        return (
          <video
            key={index}
            hidden={active !== index}
            src={item.url}
            controls={true}
            style={style.view}
          />
        );
      } else {
        return null;
      }
    });

    return (
      <div style={style.container} ref={this._windowRef}>
        <div style={style.toolbar}>
          <Tooltip title="Toggle fullscreen mode">
            <span>
              <IconButton
                color="primary"
                onClick={this._onGoFullscreen}
              >
                <FullscreenIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={fillView ? 'Original size' : 'Fill entire view'}>
            <span>
              <IconButton
                color="primary"
                onClick={this._onToggleFillView}
                style={fillView ? style.iconActive : undefined}
              >
                <FillViewIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Reload file from file system">
            <span>
              <IconButton
                color="primary"
                disabled={disabled}
                onClick={this._onReload}
              >
                <ReloadIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Close file">
            <span>
              <IconButton
                color="primary"
                disabled={disabled}
                onClick={this._onClose}
              >
                <CloseIcon />
              </IconButton>
            </span>
          </Tooltip>
        </div>
        <Tabs
          value={active}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          onChange={this._onTabChange}
        >
          {tabs}
        </Tabs>
        {editors}
      </div>
    );
  }
}

registerWindow('Media', MediaWindow);
