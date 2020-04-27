import React from 'react';
import { Button } from '@material-ui/core';
import { registerWidget } from 'ignite-gui';
import { ignite } from 'ignite-editor';

const HelloWorld = () => (
  <Button
    variant="contained"
    color="primary"
    onclick={() => ignite('~%IGNITE_ID%~', 'ping')}
  >
    Hello World
  </Button>
);

registerWidget('HelloWorld', HelloWorld);
