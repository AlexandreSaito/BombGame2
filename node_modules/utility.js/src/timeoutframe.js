let lastTime

function request(callback) {
  let currTime = new Date().getTime(),
    timeToCall = Math.max(0, 16 - (currTime - lastTime)),
    reqId = setTimeout(() => {
      callback(currTime + timeToCall)
    }, timeToCall);
  lastTime = currTime + timeToCall
  return reqId
}

function cancel(reqId) {
  clearTimeout(reqId);
}

const timeoutframe = {
  request,
  cancel
}
export default timeoutframe
