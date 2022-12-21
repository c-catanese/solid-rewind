import log from "./logger";

const debugMode = false; // turn on debug messages
let initComplete = false; // may not be needed. This just makes sure we don't init more than once as a fail-safe.

// function to send message to devtool
export function sendData( data, type ) {
  // stringify data (in case it's an objec or array)
  const payload = (typeof data === 'object') ? JSON.stringify(data) : data;
  postMessageToDebugger(payload, type)
}

// format the data into an object with the from, type and payload. Send it.
function postMessageToDebugger (payload, type) {
  const msgObj = { from: "FROM_PAGE", type, payload };
  // this should be send on something besides the window.
  window.postMessage(msgObj, "*");
  if (debugMode) log(['message sent from page', msgObj], 'sender.js' ); //console.log('c% sender.js - ', 'color:orange; font-weight:bold', 'message sent from page', msgObj)
}

// Initilize the sender. This should only ever be run once.
export function senderInit () {
  if (initComplete) return;
  // listen elsehwere than the window. Make a div and listen there perhase
  if (debugMode) log(['integrated-devtool: message listener setup'], 'sender.js' );
  // if (debugMode) console.log('c% sender.js - ', 'color:orange; font-weight:bold', 'integrated-devtool: message listener setup');

  // there will only be one listener which recieves messages and delegates out events
  window.addEventListener("message", (event) => {
    // only pay attetion to messages from the devtool
    if (event.data.from === "FROM_DEVTOOL" ) {
      if (debugMode) log(['message from devtool', event.data], 'sender.js');
      // if (debugMode) console.log('c% sender.js - ', 'color:orange; font-weight:bold', 'message from devtool', event.data);

      // dispatch an event with the 'type' as the message type. Listeners can then grab it
      const msgRecievedEvent = new CustomEvent(event.data.type, {
        detail: { ...event.data } 
      });
      document.dispatchEvent(msgRecievedEvent);
    }
  }, false);

  // send message to client to erase any saved state if the page refreshes
  window.onbeforeunload = function(event) {
    // return confirm("Confirm refresh");
    sendData( undefined, 'RESET_STATE' )
  };
}

// function to call to listen for messages from dev tool
export function listenFor ( type, callback ) {
  // pass along only the payload to the callback
  document.addEventListener( type, (data) => callback(data.detail) );
}