import React from 'react';
import {
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Tooltip,
  Fade,
  Divider,
  TextField,
  Switch,
} from '@material-ui/core';
import {
  Home as HomeIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Audiotrack as AudioIcon,
  Theaters as VideoIcon,
  Description as TextIcon,
  Tune as ConfigIcon,
  Code as CodeIcon,
  Web as WebIcon,
  GitHub as GitIcon,
} from '@material-ui/icons';
import { registerWindow } from 'ignite-gui';
import { ignite, on, off } from 'ignite-editor';

const style = {
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  path: {
    display: 'inline-flex',
    padding: 0,
    width: 'calc(100% - 54px)',
    height: 54,
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'nowrap',
    backgroundColor: 'transparent',
  },
  tune: {
    display: 'inline-flex',
    top: 0,
    right: 0,
    padding: 6,
  },
  filterType: {
    margin: 6,
    padding: 6,
  },
  iconActive: {
    color: window.gui.theme.palette.background.paper,
    backgroundColor: window.gui.theme.palette.primary.main,
  },
  entry: {
    width: 275,
    justifyContent: 'start',
    margin: 4,
  },
  content: {
    width: 'calc(100% - 48px)',
    height: 'calc(100% - 54px - 16px)',
    padding: '8px 24px',
    overflow: 'auto',
  },
  filters: {
    position: 'absolute',
    width: 300,
    maxWidth: '100%',
    height: 'calc(100% - 54px)',
    overflow: 'auto',
    top: 54,
    right: 0,
  },
  filterExcludeByType: {
    padding: 10,
  },
};

const icons = new Map();
const types = new Map();
icons.set('?', FileIcon);
icons.set('.png', ImageIcon);
icons.set('.jpg', ImageIcon);
icons.set('.jpeg', ImageIcon);
icons.set('.gif', ImageIcon);
icons.set('.svg', ImageIcon);
types.set('Image', ['.png', '.jpg', '.jpeg', '.gif', '.svg']);
icons.set('.mp3', AudioIcon);
icons.set('.ogg', AudioIcon);
icons.set('.wav', AudioIcon);
types.set('Audio', ['.mp3', '.ogg', '.wav']);
icons.set('.mp4', VideoIcon);
icons.set('.avi', VideoIcon);
icons.set('.webm', VideoIcon);
types.set('Video', ['.mp4', '.avi', '.webm']);
icons.set('.txt', TextIcon);
icons.set('.log', TextIcon);
icons.set('.md', TextIcon);
types.set('Text', ['.txt', '.log', '.md']);
icons.set('.toml', ConfigIcon);
icons.set('.yaml', ConfigIcon);
icons.set('.yml', ConfigIcon);
icons.set('.json', ConfigIcon);
types.set('Config', ['.toml', '.yaml', '.yml', '.json']);
icons.set('.rs', CodeIcon);
icons.set('.js', CodeIcon);
icons.set('.sh', CodeIcon);
icons.set('.bat', CodeIcon);
icons.set('.wasm', CodeIcon);
types.set('Code', ['.rs', '.js', '.sh', '.bat', '.wasm']);
icons.set('.html', WebIcon);
icons.set('.htm', WebIcon);
icons.set('.css', WebIcon);
types.set('Web', ['.html', '.html', '.css']);
icons.set('.gitignore', GitIcon);
types.set('Git', ['.gitignore']);

const openers = new Map();

function getIcon(fileName) {
  for (const [key, value] of icons.entries()) {
    if (fileName.endsWith(key)) {
      if (!value) {
        console.warn(`* Missing icon for: ${fileName}`);
      }
      return value || FileIcon;
    }
  }
  const result = icons.get('?');
  if (!result) {
    console.warn(`* Missing icon for: ${fileName}`);
  }
  return result || FileIcon;
}

function getTypesFilters(typeNames) {
  const result = [];
  for (const typeName of typeNames) {
    const extensions = types.get(typeName);
    if (!extensions) {
      console.warn(`* Missing extensions type: ${typeName}`);
    } else {
      for (const extension of extensions) {
        result.push(`*${extension}`);
      }
    }
  }
  return result;
}

function getFileOpeners(filePath) {
  return !!filePath
    ? Array.from(openers.entries())
      .filter(([key]) => key === '?' || filePath.endsWith(key))
      .filter(([key], _, arr) => key === '?' ? arr.length === 1 : true)
      .map(([_, value]) => value[value.length - 1])
    : []
}

on('gui/register-icon', (extension, type, widget) => {
  if (typeof extension === 'string') {
    if (typeof type === 'string') {
      if (widget instanceof React.Component) {
        icons.set(extension, widget);
        const icons = types.get(type);
        if (!icons) {
          types.set(type, [extension]);
        } else {
          icons.push(extension);
        }
      } else {
        console.error(
          `* File icon widget is not a React component: ${extension} (${type})`
        );
      }
    } else {
      console.error(`* File type is not a string: ${type} (${extension})`);
    }
  } else {
    console.error(`* File extension is not a string: ${extension}`);
  }
});

on('gui/register-file-opener', (extension, pluginName) => {
  if (typeof extension === 'string') {
    if (typeof pluginName === 'string') {
      const handlers = openers.get(extension);
      if (!handlers) {
        openers.set(extension, [pluginName]);
      } else {
        handlers.push(pluginName);
      }
    } else {
      console.error(`* Plugin name is not a string: ${pluginName}`);
    }
  } else {
    console.error(`* File extension is not a string: ${extension}`);
  }
});

const FileActionDialog = props => {
  const {
    filePath,
    onClose,
    isEdit,
    onRename,
    onCopy,
    onPaste,
    onDuplicate,
    onDelete,
  } = props;
  const items = getFileOpeners(filePath).map(pluginName => {
    return (
      <Button
        key={`open-with-${pluginName}`}
        color="primary"
        fullWidth={true}
        onClick={() => {
          ignite(pluginName, 'open-file', filePath);
          !!onClose && onClose();
        }}
      >
        {pluginName}
      </Button>
    );
  });
  return (
    <Dialog scroll="paper" open={!!filePath} onClose={onClose}>
      <DialogTitle>{filePath}</DialogTitle>
      <DialogContent>
        <Typography
          key="title"
          variant="button"
          color="secondary"
        >
          {!isEdit ? 'Open with' : 'Edit'}
        </Typography>
        {
          !isEdit ? items : [
            <Button
              key="rename"
              color="primary"
              fullWidth={true}
              disabled={!onRename}
              onClick={() => {
                onRename(filePath);
                !!onClose && onClose();
              }}
            >
              Rename
            </Button>,
            <Button
              key="copy"
              color="primary"
              fullWidth={true}
              disabled={!onCopy}
              onClick={() => {
                onCopy(filePath);
                !!onClose && onClose();
              }}
            >
              Copy
            </Button>,
            <Button
              key="paste"
              color="primary"
              fullWidth={true}
              disabled={!onPaste}
              onClick={() => {
                onPaste(filePath);
                !!onClose && onClose();
              }}
            >
              Paste
            </Button>,
            <Button
              key="duplicate"
              color="primary"
              fullWidth={true}
              disabled={!onDuplicate}
              onClick={() => {
                onDuplicate(filePath);
                !!onClose && onClose();
              }}
            >
              Duplicate
            </Button>,
            <Button
              key="delete"
              color="primary"
              fullWidth={true}
              disabled={!onDelete}
              onClick={() => {
                onDelete(filePath);
                !!onClose && onClose();
              }}
            >
              Delete
            </Button>,
          ]
        }
      </DialogContent>
    </Dialog>
  );
};

class RenameDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      oldPath: null,
      newPath: null,
    };
  }

  setupPath(filePath) {
    this.setState({ oldPath: filePath, newPath: filePath });
  }

  render() {
    const { onClose, onRename } = this.props;
    const { oldPath, newPath } = this.state;
    return (
      <Dialog scroll="paper" open={!!oldPath && !!newPath} onClose={onClose}>
        <DialogTitle>Rename: {oldPath}</DialogTitle>
        <DialogContent>
          <TextField
            label="New Path"
            variant="outlined"
            fullWidth={true}
            autoFocus={true}
            value={newPath || ''}
            onChange={() => this.setState({ newPath: event.target.value })}
          />
          <Button
            color="primary"
            disabled={!onRename}
            onClick={() => {
              onRename(oldPath, newPath);
              !!onClose && onClose();
            }}
          >
            Rename
          </Button>
          <Button
            color="primary"
            disabled={!onClose}
            onClick={() => onClose()}
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    );
  }
}

const EntryItem = props => {
  const {
    fileName,
    filePath,
    isDirectory,
    onOpen,
    onEdit,
    onSelect,
    isSelected,
  } = props;
  const icon = isDirectory ? FolderIcon : getIcon(fileName);

  return (
    <Tooltip title={filePath}>
      <Button
        color={isDirectory ? 'secondary' : 'primary'}
        size="large"
        variant={!!isSelected ? 'outlined' : 'text'}
        startIcon={React.createElement(icon)}
        onClick={!!onSelect ? () => onSelect(fileName) : null}
        onDoubleClick={!!onOpen ? () => onOpen(fileName) : null}
        onContextMenu={!!onEdit ? () => onEdit(fileName) : null}
        style={style.entry}
      >
        <Typography noWrap={true} variant="h6">{fileName}</Typography>
      </Button>
    </Tooltip>
  );
};

class AssetBrowserWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentPath: '',
      entries: null,
      tuneOpen: false,
      searchValue: '',
      searchLocal: false,
      excludeTypes: [],
      excludeFolders: false,
      openMenu: null,
      openMenuIsEdit: false,
      selected: [],
      copyPaths: null,
    };
    this._onEntries = this.onEntries.bind(this);
    this._onTuneToggle = this.onTuneToggle.bind(this);
    this._onSearchChange = this.onSearchChange.bind(this);
    this._onSearchLocal = this.onSearchLocal.bind(this);
    this._renameRef = React.createRef();
  }

  onEntries(entries) {
    entries.sort((a, b) => a.file_name.localeCompare(b.file_name));
    entries.sort((a, b) => {
      if (a.is_directory && !b.is_directory) {
        return -1;
      } else if (!a.is_directory && b.is_directory) {
        return 1;
      } else {
        0
      }
    });
    this.setState({ entries, selected: [] });
  }

  onTuneToggle() {
    this.setState({ tuneOpen: !this.state.tuneOpen });
  }

  onSearchChange(event) {
    const searchValue = event.target.value;
    this.setState({ searchValue });
    const { currentPath, searchLocal, excludeTypes, excludeFolders } = this.state;
    this.updateContent(currentPath, searchValue, searchLocal, excludeTypes, excludeFolders);
  }

  onSearchLocal(event) {
    const searchLocal = event.target.checked;
    this.setState({ searchLocal });
    const { currentPath, searchValue, excludeTypes, excludeFolders } = this.state;
    this.updateContent(currentPath, searchValue, searchLocal, excludeTypes, excludeFolders);
  }

  onExcludeType(name) {
    const excludeTypes = new Set(this.state.excludeTypes);
    if (excludeTypes.has(name)) {
      excludeTypes.delete(name);
    } else {
      excludeTypes.add(name);
    }
    this.setState({ excludeTypes: Array.from(excludeTypes) });
    const { currentPath, searchValue, searchLocal, excludeFolders } = this.state;
    this.updateContent(currentPath, searchValue, searchLocal, excludeTypes, excludeFolders);
  }

  onExcludeFolders() {
    const excludeFolders = !this.state.excludeFolders;
    this.setState({ excludeFolders });
    const { currentPath, searchValue, searchLocal, excludeTypes } = this.state;
    this.updateContent(currentPath, searchValue, searchLocal, excludeTypes, excludeFolders);
  }

  componentDidMount() {
    this._onEntriesToken = on('gui/ignite-asset-browser-plugin/entries', this._onEntries);
    this.goto('');
  }

  componentWillUnmount() {
    off(this._onEntriesToken);
  }

  selectFilePath(filePath) {
    const selected = new Set(this.state.selected);
    if (selected.has(filePath)) {
      selected.delete(filePath);
    } else {
      selected.add(filePath);
    }
    this.setState({ selected: Array.from(selected) });
  }

  goto(currentPath) {
    this.setState({ currentPath });
    const { searchValue, searchLocal, excludeTypes, excludeFolders } = this.state;
    this.updateContent(currentPath, searchValue, searchLocal, excludeTypes, excludeFolders);
  }

  openFileMenu(filePath) {
    const openers = getFileOpeners(filePath);
    if (openers.length === 1) {
      ignite(openers[0], 'open-file', filePath);
    } else {
      this.setState({ openMenu: filePath, openMenuIsEdit: false });
    }
  }

  openDirMenu() {
    this.setState({ openMenu: this.state.currentPath, openMenuIsEdit: true });
  }

  editFileMenu(filePath) {
    this.setState({ openMenu: filePath, openMenuIsEdit: true });
  }

  renamePath(oldPath, newPath) {
    ignite('ignite-asset-browser-plugin', 'rename', {
      old_path: oldPath,
      new_path: newPath,
    });
    this.goto(this.state.currentPath);
  }

  copyPasteFiles(filePaths) {
    ignite('ignite-asset-browser-plugin', 'copy-paste', {
      file_paths: Array.from(new Set(filePaths)),
      destination: this.state.currentPath,
    });
    this.goto(this.state.currentPath);
  }

  deleteFiles(filePaths) {
    ignite('ignite-asset-browser-plugin', 'delete', {
      file_paths: Array.from(new Set(filePaths))
    });
    this.goto(this.state.currentPath);
  }

  updateContent(currentPath, searchValue, searchLocal, excludeTypes, excludeFolders) {
    if (searchValue === '') {
      ignite('ignite-asset-browser-plugin', 'scan-dir', {
        excludes: getTypesFilters(excludeTypes),
        exclude_folders: excludeFolders,
        path: currentPath,
      });
    } else {
      ignite('ignite-asset-browser-plugin', 'find', {
        patterns: searchValue.split(',').map(item => item.trim()),
        excludes: getTypesFilters(excludeTypes),
        exclude_folders: excludeFolders,
        local: searchLocal,
        path: currentPath,
      });
    }
  }

  render() {
    const { projectPath } = this.props;
    if (!projectPath) {
      return null;
    }

    const {
      currentPath,
      entries,
      tuneOpen,
      searchValue,
      searchLocal,
      excludeTypes,
      excludeFolders,
      openMenu,
      openMenuIsEdit,
      selected,
      copyPaths,
    } = this.state;
    const parts = currentPath.split(/[\\/]/g).slice(1);
    const paths = parts.map((_part, i) => '/' + parts.slice(0, i + 1).join('/'));
    const items = !!entries ? entries.map(({ file_name, file_path, is_directory }, i) => (
      <EntryItem
        key={i}
        fileName={file_name}
        filePath={file_path}
        isDirectory={is_directory}
        isSelected={selected.includes(`${currentPath}/${file_name}`)}
        onSelect={() => this.selectFilePath(`${currentPath}/${file_name}`)}
        onOpen={
          is_directory
            ? () => this.goto(`${currentPath}/${file_name}`)
            : () => this.openFileMenu(`${currentPath}/${file_name}`)
        }
        onEdit={() => this.editFileMenu(`${currentPath}/${file_name}`)}
      />
    )) : null;
    const pathItems = parts.map((part, i) => [
      <Typography
        key={part + '-separator'}
        style={{ display: 'inline' }}
      >/</Typography>,
      <Button
        key={part}
        color={i < parts.length - 1 ? 'secondary' : 'primary'}
        style={{ display: 'inline' }}
        onClick={() => this.goto(paths[i])}
      >
        {part}
      </Button>
    ]);
    const typeItems = Array.from(types.keys()).map((type, i) => {
      const extensions = types.get(type);
      const icon = icons.get(extensions[0]) || FileIcon;
      const active = excludeTypes.includes(type);
      return (
        <Tooltip key={i} title={type}>
          <IconButton
            color="primary"
            style={
              active
                ? { ...style.filterType, ...style.iconActive }
                : style.filterType
            }
            onClick={() => this.onExcludeType(type)}
          >
            {React.createElement(icon)}
          </IconButton>
        </Tooltip>
      );
    });

    return (
      <div style={style.container}>
        <DialogTitle style={style.path}>
          <IconButton
            color="primary"
            onClick={() => this.goto('')}
          >
            <HomeIcon />
          </IconButton>
          {pathItems}
        </DialogTitle>
        <IconButton
          color="primary"
          style={tuneOpen ? { ...style.tune, ...style.iconActive } : style.tune}
          onClick={this._onTuneToggle}
        >
          <ConfigIcon />
        </IconButton>
        <DialogContent style={style.content}>
          {items}
        </DialogContent>
        <Fade in={tuneOpen}>
          <Paper elevation={8} style={style.filters}>
            <Divider />
            <TextField
              label="Search"
              variant="outlined"
              fullWidth={true}
              autoFocus={true}
              value={searchValue}
              onChange={this._onSearchChange}
            />
            <div>
              <Switch checked={searchLocal} onChange={this._onSearchLocal} />
              <Typography style={{ display: 'inline' }}>
                Search: {searchLocal ? 'Local' : 'Global'}
              </Typography>
            </div>
            <Typography
              color="textSecondary"
              style={style.filterExcludeByType}
            >
              Exclude by type
            </Typography>
            <div>
              <Tooltip title="Folders">
                <IconButton
                  color="primary"
                  style={
                    excludeFolders
                      ? { ...style.filterType, ...style.iconActive }
                      : style.filterType
                  }
                  onClick={() => this.onExcludeFolders()}
                >
                  <FolderIcon />
                </IconButton>
              </Tooltip>
              {typeItems}
            </div>
          </Paper>
        </Fade>
        <FileActionDialog
          filePath={openMenu}
          isEdit={openMenuIsEdit}
          onClose={() => this.openFileMenu(null)}
          onRename={filePath => !!this._renameRef.current && this._renameRef.current.setupPath(filePath)}
          onCopy={filePath => this.setState({ copyPaths: [...selected, filePath] })}
          onPaste={!!copyPaths ? () => this.copyPasteFiles(copyPaths) : null}
          onDuplicate={filePath => this.copyPasteFiles([...selected, filePath])}
          onDelete={filePath => this.deleteFiles([...selected, filePath])}
        />
        <RenameDialog
          ref={this._renameRef}
          onClose={() => !!this._renameRef.current && this._renameRef.current.setupPath(null)}
          onRename={(oldPath, newPath) => {
            this.renamePath(oldPath, newPath);
            this.setState({ renamePath: null })
          }}
        />
      </div >
    );
  }
}

registerWindow('Asset Browser', AssetBrowserWindow);
