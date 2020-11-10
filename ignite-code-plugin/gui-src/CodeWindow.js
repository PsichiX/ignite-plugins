import React from 'react';
import {
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@material-ui/core';
import {
  Fullscreen as FullscreenIcon,
  Save as SaveIcon,
  SaveAlt as SaveAllIcon,
  Refresh as ReloadIcon,
  Close as CloseIcon,
} from '@material-ui/icons';
import { registerWindow } from 'ignite-gui';
import { ignite, on, off } from 'ignite-editor';
import ace from "ace-builds/src-noconflict/ace";
ace.config.set('useWorker', false);
ace.config.set('loadWorkerFromBlob', false);
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-jsx';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/mode-toml';
import 'ace-builds/src-noconflict/mode-rust';
import 'ace-builds/src-noconflict/mode-sh';
import 'ace-builds/src-noconflict/mode-batchfile';
import 'ace-builds/src-noconflict/theme-monokai';
import AceEditor from 'react-ace';

const langs = {
  'html': { tabSize: 2 },
  'jsx': { tabSize: 2 },
  'css': { tabSize: 2 },
  'json': { tabSize: 2 },
  'yaml': { tabSize: 2 },
  'toml': { tabSize: 4 },
  'rust': { tabSize: 4 },
  'sh': { tabSize: 4 },
  'batchfile': { tabSize: 4 },
};

function getFileLang(filePath) {
  if (filePath.endsWith('.htm') || filePath.endsWith('.html')) {
    return 'html';
  } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    return 'jsx';
  } else if (filePath.endsWith('.css')) {
    return 'css';
  } else if (filePath.endsWith('.json')) {
    return 'json';
  } else if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) {
    return 'yaml';
  } else if (filePath.endsWith('.toml')) {
    return 'toml';
  } else if (filePath.endsWith('.rs')) {
    return 'rust';
  } else if (filePath.endsWith('.sh')) {
    return 'sh';
  } else if (filePath.endsWith('.bat')) {
    return 'batchfile';
  }
}

const extensionsList = [
  '.htm',
  '.html',
  '.js',
  '.jsx',
  '.css',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.rs',
  '.sh',
  '.bat',
  '?',
];
for (const extension of extensionsList) {
  window.editor.emit('gui/register-file-opener', extension, 'ignite-code-plugin');
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
  editor: {
    width: '100%',
    height: 'calc(100% - 82px)',
    overflow: 'hidden',
    position: 'relative',
    flexGrow: 1,
  },
};

class CodeEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
    this._onChange = this.onChange.bind(this);
  }

  onChange(code) {
    this.props.storage().fileContents.set(this.props.path, code);
    this.setState({});
  }

  render() {
    const { hidden, lang, path } = this.props;
    const code = this.props.storage().fileContents.get(path) || '';
    const mode = lang in langs ? lang : undefined;
    const langMeta = lang in langs ? langs[lang] : { tabSize: 4 };

    return !hidden ? (
      <AceEditor
        mode={mode}
        theme="monokai"
        name={path}
        value={code}
        tabSize={langMeta.tabSize}
        onChange={this._onChange}
        style={style.editor}
        setOptions={{
          useWorker: false,
          showLineNumbers: true,
        }}
      />
    ) : null;
  }
}

class CodeWindow extends React.Component {
  constructor(props) {
    super(props);

    const storage = props.storage();
    storage.fileContents = storage.fileContents || new Map();
    storage.openFiles = storage.openFiles || [];
    storage.active = storage.active || 0;
    this.state = {};
    this._onTabChange = this.onTabChange.bind(this);
    this._onGoFullscreen = this.onGoFullscreen.bind(this);
    this._onSave = this.onSave.bind(this);
    this._onSaveAll = this.onSaveAll.bind(this);
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

  onSave() {
    const { active, openFiles, fileContents } = this.props.storage();
    if (active >= 0 && active < openFiles.length) {
      const path = openFiles[active].path;
      const contents = fileContents.get(path) || '';
      ignite('ignite-code-plugin', 'save-file', { path, contents });
    }
  }

  onSaveAll() {
    const { openFiles, fileContents } = this.props.storage();
    let promise = null;
    for (const item of openFiles) {
      let p = new Promise((resolve, reject) => {
        const { path } = item;
        const contents = fileContents.get(path) || '';
        try {
          ignite('ignite-code-plugin', 'save-file', { path, contents });
          resolve();
        } catch {
          reject();
        }
      });
      if (!!promise) {
        promise.then(p);
      }
      promise = p;
    }
  }

  onReload() {
    const { active, openFiles } = this.props.storage();
    if (active >= 0 && active < openFiles.length) {
      const path = openFiles[active].path;
      ignite('ignite-code-plugin', 'open-file', path);
    }
  }

  onClose() {
    const storage = this.props.storage();
    const { active, openFiles, fileContents } = storage;
    if (active >= 0 && active < openFiles.length) {
      const path = openFiles[active].path;
      openFiles.splice(active, 1);
      fileContents.delete(path);
      storage.active = Math.max(0, Math.min(active, openFiles.length - 1));
      this.setState({});
    }
  }

  onOpenFile({ path, name, contents }) {
    const storage = this.props.storage();
    const { openFiles, fileContents } = storage;
    const found = openFiles.find(item => item.path === path);
    let active = storage.active;
    if (!found) {
      openFiles.push({ path, name });
      active = openFiles.length - 1;
    } else {
      active = openFiles.indexOf(found);
    }
    fileContents.set(path, contents);
    storage.active = active;
    this.setState({});
  }

  componentDidMount() {
    this._onOpenFileToken = on('gui/ignite-code-plugin/open-file', this._onOpenFile);

    const { openFiles } = this.props.storage();
    if (!!openFiles && Array.isArray(openFiles)) {
      for (const item of openFiles) {
        if (!!item.path) {
          ignite('ignite-code-plugin', 'open-file', item.path);
        }
      }
    }
  }

  componentWillUnmount() {
    off(this._onOpenFileToken);
  }

  render() {
    const { active, openFiles } = this.props.storage();
    const disabled = openFiles.length <= 0;
    const tabs = openFiles.map((file, index) => {
      const title = file.name;
      return <Tab key={index} label={title} />;
    });
    const editors = openFiles.map((item, index) => {
      return (
        <CodeEditor
          key={index}
          hidden={active !== index}
          path={item.path}
          lang={getFileLang(item.path)}
          storage={this.props.storage}
        />
      );
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
          <Tooltip title="Save file">
            <span>
              <IconButton
                color="primary"
                disabled={disabled}
                onClick={this._onSave}
              >
                <SaveIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Save all open files">
            <span>
              <IconButton
                color="primary"
                disabled={disabled}
                onClick={this._onSaveAll}
              >
                <SaveAllIcon />
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

registerWindow('Code', CodeWindow);
