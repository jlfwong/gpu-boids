/**
 * Call gl.getError() after each GL call, and provide
 * a stack trace.
 */
const wrapGlDebug = function(gl) {
  if (!GL_DEBUG) {
    return gl;
  }

  const GL_ERROR_TO_MSG = {};
  [
    'INVALID_ENUM',
    'INVALID_VALUE',
    'INVALID_OPERATION',
    'INVALID_FRAMEBUFFER_OPERATION',
    'OUT_OF_MEMORY',
    'CONTEXT_LOST_WEBGL'
  ].forEach(key => GL_ERROR_TO_MSG[gl[key]] = key);

  const check = () => {
    const err = gl.getError();
    if (err !== gl.NO_ERROR) {
      console.error(`GL Error Code ${err}: ${GL_ERROR_TO_MSG[err]}`);
    }
  };

  const ret = {};

  for (const key in gl) {
    if (key == 'getError') {
      ret[key] = gl[key].bind(gl);
    } else if (isFunction(gl[key])) {
      ret[key] = (...args) => {
        const ret = gl[key](...args);
        check();
        return ret;
      }
    } else {
      ret[key] = gl[key];
    }
  };

  return ret;
};

const isFunction = (functionToCheck) => {
 var getType = {};
 return (functionToCheck &&
         getType.toString.call(functionToCheck) === '[object Function]');
};

export default wrapGlDebug;
