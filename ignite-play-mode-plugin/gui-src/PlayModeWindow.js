import React from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import {
  PlayArrow as PlayIcon,
  OpenInBrowser as PlayExternalIcon,
  Stop as StopIcon,
  Build as BuildIcon,
  LocalShipping as BuildReleaseIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
  Eco as PauseIcon,
  Airplay as ResumeIcon,
  PhotoCamera as ScreenshotIcon,
  Fullscreen as FullscreenIcon,
  BugReport as DebugIcon,
} from '@material-ui/icons';
import { registerWindow } from 'ignite-gui';
import { ignite, on, off } from 'ignite-editor';

const VIEW_URL = 'http://localhost:19100';

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
    overflow: 'hiddden',
    margin: 0,
    padding: 0,
    border: 0,
    backgroundColor: 'rgb(15, 15, 15)',
  },
  noView: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
  },
};

class PlayModeWindow extends React.Component {
  constructor(props) {
    super(props);

    const storage = props.storage();
    storage.isRunning = storage.isRunning || false;
    storage.isReloading = storage.isReloading || false;
    storage.isBuilding = storage.isBuilding || false;
    storage.isPaused = storage.isPaused || false;
    this.state = {};
    this._onPlay = this.onPlay.bind(this);
    this._onStop = this.onStop.bind(this);
    this._onReload = this.onReload.bind(this);
    this._onPlayExternal = this.onPlayExternal.bind(this);
    this._onDebug = this.onDebug.bind(this);
    this._onBuild = this.onBuild.bind(this);
    this._onBuildRelease = this.onBuildRelease.bind(this);
    this._onTakeScreenshot = this.onTakeScreenshot.bind(this);
    this._onGoFullscreen = this.onGoFullscreen.bind(this);
    this._onGotMessage = this.onGotMessage.bind(this);
    this._onChange = this.onChange.bind(this);
    this._viewRef = React.createRef();
    this._periodicPreview = null;
  }

  onPlay() {
    const storage = this.props.storage();
    const { isRunning, isPaused } = storage;
    if (!isRunning) {
      ignite('ignite-play-mode-plugin', 'start');
      clearInterval(this._periodicPreview);
      this._periodicPreview = setInterval(() => this.takeScreenshot(true), 60000);
    } else {
      storage.isPaused = !isPaused;
      this.setState({});
    }
  }

  onStop() {
    clearInterval(this._periodicPreview);
    this._periodicPreview = null;
    const storage = this.props.storage();
    storage.isPaused = false;
    storage.isRunning = false;
    this.setState({});
    ignite('ignite-play-mode-plugin', 'stop');
  }

  onReload() {
    this.props.storage().isReloading = true;
    this.setState({});
  }

  onPlayExternal() {
    ignite('ignite-play-mode-plugin', 'launch');
  }

  onDebug() {
    const { current } = this._viewRef;
    if (!!current) {
      current.openDevTools();
    }
  }

  onBuild() {
    this.onStop();
    ignite('ignite-play-mode-plugin', 'build');
  }

  onBuildRelease() {
    this.onStop();
    ignite('ignite-play-mode-plugin', 'build-release');
  }

  onTakeScreenshot() {
    this.takeScreenshot();
  }

  takeScreenshot(preview) {
    const { isRunning, isBuilding, isPaused } = this.props.storage();
    if (!!isRunning && !isBuilding && !isPaused && !!this._viewRef.current) {
      this._viewRef.current.contentWindow.postMessage(
        { id: 'screenshot', preview },
        VIEW_URL,
      );
    }
  }

  onGoFullscreen() {
    if (!!this.props.storage().isRunning && !!this._viewRef.current) {
      const { current } = this._viewRef;
      if (!!current && !!current.requestFullscreen) {
        current.requestFullscreen().then(() => current.focus());
      }
    }
  }

  onGotMessage(event) {
    if (event.origin === VIEW_URL) {
      const { id } = event.data;
      if (id === 'screenshot') {
        const { data, preview } = event.data;
        if (!!data) {
          ignite('?', !!preview ? 'screenshot-preview' : 'screenshot', data);
        }
      }
    }
  }

  onChange(state) {
    const storage = this.props.storage();
    storage.isRunning = state.isRunning;
    storage.isBuilding = state.isBuilding;
    this.setState({});
  }

  componentDidMount() {
    this._onChangeToken = on('gui/ignite-play-mode-plugin/change', this._onChange);
    window.addEventListener('message', this._onGotMessage);
  }

  componentWillUnmount() {
    window.removeEventListener('message', this._onGotMessage);
    clearInterval(this._periodicPreview);
    this._periodicPreview = null;
    ignite('ignite-play-mode-plugin', 'stop');
    off(this._onChangeToken);
  }

  render() {
    const { isRunning, isReloading, isBuilding, isPaused } = this.props.storage();
    if (!!isReloading) {
      setTimeout(() => {
        this.props.storage().isReloading = false;
        this.setState({});
      }, 1);
    }

    return (
      <div style={style.container}>
        <div style={style.toolbar}>
          <Tooltip
            title={
              !!isRunning
                ? (!isPaused
                  ? 'Send view to background'
                  : 'Bring back from background')
                : 'Play in the view'
            }>
            <span>
              <IconButton
                color="primary"
                disabled={isReloading}
                onClick={this._onPlay}
              >
                {!isRunning
                  ? <PlayIcon />
                  : (!isPaused ? <PauseIcon /> : <ResumeIcon />)}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Stop playing in the view">
            <span>
              <IconButton
                color="primary"
                disabled={!isRunning || isReloading}
                onClick={this._onStop}
              >
                <StopIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Reload view content">
            <span>
              <IconButton
                color="primary"
                disabled={!isRunning || isPaused || isReloading}
                onClick={this._onReload}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Play in the browser">
            <span>
              <IconButton
                color="primary"
                disabled={true}
                onClick={this._onPlayExternal}
              >
                <PlayExternalIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Open debugger window">
            <span>
              <IconButton
                color="primary"
                disabled={!isRunning || isPaused || isReloading}
                onClick={this._onDebug}
              >
                <DebugIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Build game">
            <span>
              <IconButton
                color="primary"
                disabled={isRunning || isBuilding}
                onClick={this._onBuild}
              >
                <BuildIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Ship game">
            <span>
              <IconButton
                color="primary"
                disabled={isRunning || isBuilding}
                onClick={this._onBuildRelease}
              >
                <BuildReleaseIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Take screenshot">
            <span>
              <IconButton
                color="primary"
                disabled={!isRunning || isBuilding}
                onClick={this._onTakeScreenshot}
              >
                <ScreenshotIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Go fullscreen">
            <span>
              <IconButton
                color="primary"
                disabled={!isRunning || isBuilding}
                onClick={this._onGoFullscreen}
              >
                <FullscreenIcon />
              </IconButton>
            </span>
          </Tooltip>
        </div>
        {isRunning && !isReloading && !isPaused ? (
          <webview
            style={style.view}
            src="http://localhost:19100"
            ref={this._viewRef}
            onError={this._onStop}
          />
        ) : (
            <div style={{
              ...style.view,
              ...style.noView,
            }}>
              {!isPaused
                ? (
                  <Tooltip title="There is no game playing in the view">
                    <BlockIcon color="disabled" style={{ width: 96, height: 96 }} />
                  </Tooltip>
                )
                : (
                  <Tooltip title="Game is playing in the background">
                    <PauseIcon color="disabled" style={{ width: 96, height: 96 }} />
                  </Tooltip>
                )}
            </div>
          )}
      </div>
    );
  }
}

registerWindow('Play Mode', PlayModeWindow);
