import React from 'react';
import { IconButton, Tooltip, Button } from '@material-ui/core';
import {
  Power as PluginsLibraryIcon,
  LocalGroceryStore as PluginsStoreIcon,
} from '@material-ui/icons';
import { registerWindow } from 'ignite-gui';
import ItchLogo from './logo-logo.svg';

const VIEW_URL = 'https://itch.io';

const style = {
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  toolbar: {
    width: '100%',
    height: 48,
    overflow: 'auto',
    textAlign: 'center',
  },
  view: {
    width: '100%',
    height: 'calc(100% - 48px)',
    overflow: 'auto',
    margin: 0,
    padding: 0,
    border: 0,
    backgroundColor: 'rgb(15, 15, 15)',
  },
  logo: {
    width: 24,
    height: 24,
  },
};

class ItchWindow extends React.Component {
  constructor(props) {
    super(props);

    const storage = props.storage();
    storage.url = storage.url || null;
    this.state = {};
  }

  goto(url) {
    const storage = this.props.storage();
    storage.url = url || null;
    this.setState({});
  }

  render() {
    const url = this.props.storage().url || VIEW_URL;

    return (
      <div style={style.container}>
        <div style={style.toolbar}>
          <Tooltip title="Itch.io main page">
            <IconButton
              color="primary"
              onClick={() => this.goto(VIEW_URL)}
            >
              <ItchLogo style={style.logo} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Plugins on marketplace">
            <IconButton
              color="primary"
              onClick={() => this.goto(`${VIEW_URL}/games/tag-ignite-editor-plugin`)}
            >
              <PluginsStoreIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Your personal library">
            <IconButton
              color="primary"
              onClick={() => this.goto(`${VIEW_URL}/my-collections`)}
            >
              <PluginsLibraryIcon />
            </IconButton>
          </Tooltip>
        </div>
        <webview style={style.view} src={url} />
      </div>
    );
  }
}

registerWindow('Itch.io', ItchWindow);
