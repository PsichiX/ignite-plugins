const { ignite } = editor;

export function query(query, data) {
  if (query === 'editor-loaded') {
    console.log('EDITOR HAS LOADED');
    ignite('~%IGNITE_ID%~', 'alert', { message: 'WEWOWEWOWEWO!!!' });
  } else if (query === 'alert') {
    console.log(data.message);
    ignite('?', 'ping');
  } else if (query === 'ping') {
    console.log('pong');
  }
}
