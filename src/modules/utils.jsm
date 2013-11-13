const { classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components;

const NS_PREFBRANCH_PREFCHANGE_TOPIC_ID = "nsPref:changed";

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyGetter(this, "ctypes", function() {
  Cu.import("resource://gre/modules/ctypes.jsm");
  return ctypes;
});

var EXPORTED_SYMBOLS = ["CTypesUtils", "addLogger", "SimpleObjectWrapper"];

var gBase;
var gLogPrefRoot;
var gBindNow = false;
var gCallbacks = {};

function formatLogMessage(aType, aDomain, aStr, aException) {
  let message = aType.toUpperCase() + " " + aDomain + ": " + aStr;
  if (aException)
    return message + ": " + aException;
  return message;
}

function getStackDetails(aException) {
  // Defensively wrap all this to ensure that failing to get the message source
  // doesn't stop the message from being logged
  try {
    if (aException) {
      if (aException instanceof Ci.nsIException) {
        return {
          sourceName: aException.filename,
          lineNumber: aException.lineNumber
        };
      }

      return {
        sourceName: aException.fileName,
        lineNumber: aException.lineNumber
      };
    }

    let stackFrame = Components.stack.caller.caller.caller;
    return {
      sourceName: stackFrame.filename,
      lineNumber: stackFrame.lineNumber
    };
  }
  catch (e) {
    return {
      sourceName: null,
      lineNumber: 0
    };
  }
}

function Logger(aDomain) {
  this.domain = aDomain;

  this.setupPrefObserver();
}

Logger.prototype = {
  branch: null,
  domain: null,

  setupPrefObserver: function Logger_setupPrefObserver() {
    if (!gLogPrefRoot || this.branch) {
      return;
    }

    this.branch = Services.prefs.getBranch(gLogPrefRoot);
    this.branch.addObserver("", this, false);

    this.observe(this.branch, NS_PREFBRANCH_PREFCHANGE_TOPIC_ID, null);
  },

  observe: function Logger_observe(aSubject, aTopic, aData) {
    try {
      if (aSubject != this.branch) {
        throw Cr.NS_ERROR_FAILURE;
      }

      if (aTopic == NS_PREFBRANCH_PREFCHANGE_TOPIC_ID) {
        let domains = aSubject.getCharPref("domains").split(/\s*,\s*/);
        this._debugLogEnabled = (aSubject.getBoolPref("enabled") &&
                                 (domains.indexOf(this.domain) != -1 ||
                                  domains.indexOf("all") != -1));
      }
    } catch(e) { this._debugLogEnabled = false; }
  },

  _debugLogEnabled: false,
  get debugLogEnabled() {
    if (!this.branch) {
      this.setupPrefObserver();
      if (!this.branch) {
        return false;
      }
    }

    return this._debugLogEnabled;
  },

  log: function Logger_log(aStr, aException) {
    if (this.debugLogEnabled) {
      let message = formatLogMessage("log", this.domain, aStr, aException);
      Services.console.logStringMessage(message);
      dump("*** " + message + "\n");
    }
  },

  warn: function Logger_warn(aStr, aException) {
    let message = formatLogMessage("warn", this.domain, aStr, aException);

    let stack = getStackDetails(aException);

    let consoleMessage = Cc["@mozilla.org/scripterror;1"].
                         createInstance(Ci.nsIScriptError);
    consoleMessage.init(message, stack.sourceName, null, stack.lineNumber, 0,
                        Ci.nsIScriptError.warningFlag, "component javascript");
    Services.console.logMessage(consoleMessage);

    if (this.debugLogEnabled) {
      dump("*** " + message + "\n");
    }
  },

  error: function Logger_error(aStr, aException) {
    let message = formatLogMessage("error", this.domain, aStr, aException);

    let stack = getStackDetails(aException);

    let consoleMessage = Cc["@mozilla.org/scripterror;1"].
                         createInstance(Ci.nsIScriptError);
    consoleMessage.init(message, stack.sourceName, null, stack.lineNumber, 0,
                        Ci.nsIScriptError.errorFlag, "component javascript");
    Services.console.logMessage(consoleMessage);

    if (this.debugLogEnabled) {
      dump("*** " + message + "\n");
    }
  }
};

function addLogger(aTarget, aDomain) {
  if (typeof(aTarget) != "object") {
    throw Error("Must pass an object on which to add logging functions");
  }

  let domain;
  if (aDomain) {
    if (typeof(aDomain) != "string") {
      throw Error("Invalid type for domain");
    }

    domain = gBase + "." + aDomain;
  }

  if (!domain) {
    domain = gBase;
  }

  if (!domain) {
    throw Error("Must specify a log domain");
  }

  let logger = new Logger(domain);

  ["log", "warn", "error"].forEach(function(name) {
    upper = name.toUpperCase();
    delete aTarget[upper];
    aTarget[upper] = function() {
      logger[name].apply(logger, arguments);
    };
  });
}

function init() {
  let uri = Services.io.newURI(__URI__, null, null);
  if (uri.scheme != "resource") {
    throw Error("This only works properly from resource URI's at the moment");
  }

  gBase = uri.host;
  gLogPrefRoot = "extensions." + gBase + ".logging.";

  gBindNow = Cc["@mozilla.org/process/environment;1"]
             .getService(Ci.nsIEnvironment).exists("CTYPES_UTILS_BIND_NOW");
}

function CTypesLibrary(aName, aABIs, aDefines) {
  LOG("Attempting to load library " + aName);
  try {
    if (typeof(aName) != "string") {
      throw Error("Invalid library name");
    }

    if (typeof(aABIs) == "number") {
      aABIs = [ aABIs ];
    }

    if (typeof(aABIs) != "object") {
      throw Error("Invalid range of library ABI's");
    }

    if (typeof(aDefines) != "function") {
      throw Error("Invalid defines function");
    }

    var library;
    var abi;

    for each (let i in aABIs) {
      let soname = "lib" + aName + ".so." + i.toString();
      try {
        library = ctypes.open(soname);
        abi = i;
        LOG("Found lib" + aName + ".so." + i.toString());
        break;
      } catch(e) {}
    }

    Object.defineProperty(this, "close", {
      value: function CTypesUtils_close() {
        library.close();
        abi = -1;
      },
      enumerable: true
    });

    Object.defineProperty(this, "available", {
      get: function() { return abi != -1; },
      enumerable: true
    });

    Object.defineProperty(this, "ABI", {
      get: function() { return abi; },
      enumerable: true
    });

    if (!library) {
      abi = -1;
      LOG("Library does not exist");
      return;
    }

    var self = this;
    var lazy = {};

    function abiMatch(aABIs) {
      if (typeof(aABIs) == "number") {
        aABIs = [ aABIs ];
      }

      return aABIs.some(function(aABI) {
        return abi == aABI;
      });
    }

    function declare(aSymbol, aRetType, aArgTypes) {
      try {
        let args = [];
        args.push(aSymbol);
        args.push(ctypes.default_abi);
        args.push(aRetType);
        if (aArgTypes) {
          aArgTypes.forEach(function(type) {
            args.push(type);
          });
        }

        let func = library.declare.apply(library, args);
        LOG("Loaded symbol " + aSymbol + " in lib" + aName + ".so."
            + abi.toString());
        return func;
      } catch (ex) {
        LOG("Failed to bind symbol " + aSymbol + " in lib" + aName + ".so."
            + abi.toString() + ": " + ex);
        return null;
      }
    }

    function declareWithWrapper(aSymbol, aWrapper, aRetType, aArgTypes,
                                aNativeSymbol) {
      var wrappee = declare(aNativeSymbol ? aNativeSymbol : aSymbol,
                            aRetType, aArgTypes);

      if (!wrappee) {
        return null;
      }

      return function() {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift(wrappee);

        return aWrapper.apply(self, args);
      }
    }

    var lib = {
      /**
       * Bind to a function from the native library. The function is
       * attached to the resultant JS object using the specified symbol name
       *
       * @param  aSymbol
       *         The name of the function
       * @param  aRetType
       *         The native function return type
       * @param  aArgTypes (optional)
       *         An array of native argument types
       */
      bind: function CTypesUtils_lib_bind(aSymbol, aRetType, aArgTypes) {
        Object.defineProperty(self, aSymbol, {
          value: declare(aSymbol, aRetType, aArgTypes),
          enumerable: true
        });
      },

      /**
       * Lazily bind to a function from the native library. The function
       * is attached to the resultant JS object using the specified symbol name
       *
       * @param  aSymbol
       *         The name of the function
       * @param  aRetType
       *         The native function return type
       * @param  aArgTypes (optional)
       *         An array of native argument types
       */
      lazy_bind: function CTypesUtils_lib_lazy_bind(aSymbol, aRetType,
                                                    aArgTypes) {
        if (gBindNow) {
          this.bind(aSymbol, aRetType, aArgTypes);
          return;
        }

        Object.defineProperty(self, aSymbol, {
          get: function() { return lazy[aSymbol]; },
          enumerable: true
        });

        XPCOMUtils.defineLazyGetter(lazy, aSymbol, function() {
          return declare(aSymbol, aRetType, aArgTypes);
        });
      },

      /**
       * Lazily bind to a function from the native library, and only allow it
       * to be called via the specified wrapper function. This results in a
       * function being attached to the resultant JS object using the specified
       * symbol name.
       *
       * @param  aSymbol
       *         The name to use to expose the resulting function to JS
       * @param  aWrapper
       *         A wrapper function, which will invoke the native function.
       *         This is invoked with the native ctypes function as
       *         arguments[0], and the function parameters as arguments[1..n]
       * @param  aRetType
       *         The native function return type
       * @param  aArgTypes (optional)
       *         An array of native argument types
       * @param  aNativeSymbol (optional)
       *         The name of the function exposed by the native library.
       *         If omitted, use aSymbol
       */
      lazy_bind_with_wrapper:
        function CTypesUtils_lib_lazy_bind_with_wrapper(aSymbol, aWrapper,
                                                        aRetType, aArgTypes,
                                                        aNativeSymbol) {
        if (gBindNow) {
          this.bind_with_wrapper(aSymbol, aWrapper, aRetType, aArgTypes,
                                 aNativeSymbol);
          return;
        }

        Object.defineProperty(self, aSymbol, {
          get: function() { return lazy[aSymbol]; },
          enumerable: true
        });

        XPCOMUtils.defineLazyGetter(lazy, aSymbol, function() {
          return declareWithWrapper(aSymbol, aWrapper, aRetType, aArgTypes,
                                    aNativeSymbol);
        });
      },

      /**
       * Lazily bind to a function from the native library, but only for
       * the specified ABI versions. The function is attached to the
       * resultant JS object using the specified symbol name
       *
       * @param  aSymbol
       *         The name of the function
       * @param  aABIs
       *         The ABI versions for which to bind this function. Can
       *         be a number or list
       * @param  aRetType
       *         The native function return type
       * @param  aArgTypes (optional)
       *         An array of native argument types
       */
      lazy_bind_for_abis: function CTypesUtils_lib_lazy_bind_for_abis(aSymbol,
                                                                      aABIs,
                                                                      aRetType,
                                                                      aArgTypes) {
        if (abiMatch(aABIs)) {
          this.lazy_bind(aSymbol, aRetType, aArgTypes);
        }
      },

     /**
       * Lazily bind to a function from the native library and only allow it
       * to be called via the specified wrapper function, but only for the
       * specified ABI versions. This results in a function being attached to
       * the resultant JS object using the specified symbol name.
       *
       * @param  aSymbol
       *         The name to use to expose the resulting function to JS
       * @param  aABIs
       *         The ABI versions for which to bind this function. Can
       *         be a number or list
       * @param  aWrapper
       *         A wrapper function, which will invoke the native function.
       *         This is invoked with the native ctypes function as
       *         arguments[0], and the function parameters as arguments[1..n]
       * @param  aRetType
       *         The native function return type
       * @param  aArgTypes (optional)
       *         An array of native argument types
       * @param  aNativeSymbol (optional)
       *         The name of the function exposed by the native library.
       *         If omitted, use aSymbol
       */
      lazy_bind_for_abis_with_wrapper:
        function CTypesUtils_lib_lazy_bind_for_abis_with_wrapper(aSymbol, aABIs,
                                                                 aWrapper,
                                                                 aRetType,
                                                                 aArgTypes,
                                                                 aNativeSymbol) {
        if (abiMatch(aABIs)) {
          this.lazy_bind_with_wrapper(aSymbol, aWrapper, aRetType, aArgTypes,
                                      aNativeSymbol);
        }
      },

      /**
       * Bind to a function from the native library, and only allow it
       * to be called via the specified wrapper function. This results in a
       * function being attached to the resultant JS object using the specified
       * symbol name.
       *
       * @param  aSymbol
       *         The name to use to expose the resulting function to JS
       * @param  aWrapper
       *         A wrapper function, which will invoke the native function.
       *         This is invoked with the native ctypes function as
       *         arguments[0], and the function parameters as arguments[1..n]
       * @param  aRetType
       *         The native function return type
       * @param  aArgTypes (optional)
       *         An array of native argument types
       * @param  aNativeSymbol (optional)
       *         The name of the function exposed by the native library.
       *         If omitted, use aSymbol
       */
      bind_with_wrapper: function CTypesUtils_lib_bind_with_wrapper(aSymbol,
                                                                    aWrapper,
                                                                    aRetType,
                                                                    aArgTypes,
                                                                    aNativeSymbol) {
        Object.defineProperty(self, aSymbol, {
          value: declareWithWrapper(aSymbol, aWrapper, aRetType, aArgTypes,
                                    aNativeSymbol),
          enumerable: true
        });
      },

      /**
       * Bind to a function from the native library, but only for
       * the specified ABI versions. The function is attached to the
       * resultant JS object using the specified symbol name
       *
       * @param  aSymbol
       *         The name of the function
       * @param  aABIs
       *         The ABI versions for which to bind this function. Can
       *         be a number or list
       * @param  aRetType
       *         The native function return type
       * @param  aArgTypes (optional)
       *         An array of native argument types
       */
      bind_for_abis: function CTypesUtils_lib_bind_for_abis(aSymbol, aABIs,
                                                            aRetType,
                                                            aArgTypes) {
        if (abiMatch(aABIs)) {
          this.bind(aSymbol, aRetType, aArgTypes)
        }
      }
    };

    aDefines.call(this, lib);
  } catch(e) {
    ERROR("Failed to create ctypes library", e);
    this.ABI = -1;
  }
}

init();
addLogger(this, "utils");

var CTypesUtils = Object.create({}, {
  /**
   * Load a native library with ctypes and map native symbols to JS symbols
   *
   * @param  aName
   *         The library basename to load. This is the library SO name
   *         without the "lib" prefix, ".so" suffix or version suffix
   * @param  aABIs
   *         The library ABI's to try and load. This can be specified as
   *         an array, or an integer if you only maintain compatibility with
   *         one version. The first ABI in the list which exists on the
   *         system will be loaded
   * @param  aDefines
   *         A callback function to map JS symbols to native symbols. The
   *         callback will be called with the destination object as the "this"
   *         object, and a single parameter providing various helpers for
   *         binding functions
   * @return A JS object containing the resulting ctypes implementations
   */
  newLibrary: { value: function CTypesUtils_newLibrary(aName, aABIs, aDefines) {
    return new CTypesLibrary(aName, aABIs, aDefines);
  }},

  /**
   * Define a set of enums on the specified target object
   *
   * @param  aTarget
   *         The object on which to place the enums
   * @param  aName
   *         The C type name for this enum
   * @param  aStart
   *         The value of the first enum
   * @param  aEnums
   *         An array of strings
   */
  defineEnums: { value: function CTypesUtils_defineEnums(aTarget, aName, aStart,
                                                         aEnums) {
    Object.defineProperty(aTarget, aName,
                          { value: ctypes.unsigned_int,
                            enumerable: true });
    Object.defineProperty(aTarget, aName + "Enums",
                          { value: new Object(),
                            enumerable: true });
    aEnums.forEach(function(aEnum) {
      Object.defineProperty(aTarget[aName + "Enums"], aEnum, {
        value: aEnums.indexOf(aEnum) + aStart,
        enumerable: true
      });
    });

    Object.defineProperty(aTarget[aName + "Enums"], "toEnum", {
      value: function(aId) { return aEnums[aId - aStart]; },
      enumerable: true
    });
  }},

  /**
   * Define a set of flags on the specified target object
   *
   * @param  aTarget
   *         The object on which to place the enums
   * @param  aName
   *         The C type name for this enum
   * @param  aStart
   *         The ln2 value of the first flag
   * @param  aFlags
   *         An array of strings
   */
  defineFlags: { value: function CTypesUtils_defineFlags(aTarget, aName, aStart,
                                                         aFlags) {
    Object.defineProperty(aTarget, aName,
                          { value: ctypes.unsigned_int,
                           enumerable: true });
    Object.defineProperty(aTarget, aName + "Flags",
                          { value: new Object(),
                            enumerable: true });
    aFlags.forEach(function(aFlag) {
      Object.defineProperty(aTarget[aName + "Flags"], aFlag, {
        value: (function() {
          let i = aFlags.indexOf(aFlag) + aStart;
          return i == 0 ? 0 : 1 << i-1;
        })(),
        enumerable: true
      });
    });
  }},

  defineSimple: { value: function CTypesUtils_defineSimple(aTarget, aName,
                                                           aValue) {
    Object.defineProperty(aTarget, aName, { value: aValue, enumerable: true });
  }},

  wrapCallback: { value: function CTypesUtils_wrapCallback(aCallback, aOptions) {

    function CallbackRootData(aJSFunc) {
      this.jsfunc = aJSFunc;
      this.refcnt = 1;
    }

    if (typeof(aCallback) != "function" ||
        aCallback instanceof ctypes.CData) {
      throw Error("Callback must be a JS function");
    }

    if (typeof(aOptions) != "object" ||
        (!aOptions.type && !aOptions.rettype) ||
        (aOptions.type && aOptions.rettype)) {
      throw Error("FunctionType or return CType must be specified");
    }

    if (aOptions.singleshot && !aOptions.root) {
      throw Error("Single shot mode only makes sense when rooting the callback");
    }

    if (aOptions.root &&
        aCallback._wrapper != undefined &&
        "constructor" in aCallback._wrapper &&
        (aCallback._wrapper.constructor.targetType
         instanceof ctypes.FunctionType) &&
        aCallback._wrapper in gCallbacks &&
        gCallbacks[aCallback._wrapper].jsfunc == aCallback) {
      gCallbacks[aCallback._wrapper].refcnt++;
      return aCallback._wrapper;
    }

    var wrapper = function() {
      try {
        if (aOptions.singleshot) {
          CTypesUtils.unrootCallback(wrapper);
        }
        return aCallback.apply(null, arguments);
      } catch(e) { ERROR("Callback threw", e); }
    };

    let type;
    if (aOptions.type) {
      type = aOptions.type;
    } else {
      type = ctypes.FunctionType(ctypes.default_abi, aOptions.rettype,
                                 aOptions.argtypes ? aOptions.argtypes : []).ptr;
    }
    wrapper = type(wrapper);

    if (aOptions.root) {
      LOG("Rooting " + wrapper);
      aCallback._wrapper = wrapper;
      gCallbacks[wrapper] = new CallbackRootData(aCallback);
    }

    return wrapper;
  }},

  unrootCallback: { value: function CTypesUtils_unrootCallback(aCallback) {
    if (typeof(aCallback) != "function") {
      throw Error("aCallback is not a function");
    }

    if (aCallback._wrapper != undefined &&
        !(aCallback instanceof ctypes.CData)) {
      this.unrootCallback(aCallback._wrapper);
      delete aCallback._wrapper;
      return;
    }

    if (!("constructor" in aCallback) ||
        !(aCallback.constructor.targetType instanceof ctypes.FunctionType)) {
      throw Error("aCallback is not a ctypes FunctionType");
    }

    if (!(aCallback in gCallbacks)) {
      throw Error("aCallback cannot be found in our roots");
    }

    if (gCallbacks[aCallback].refcnt <= 0) {
      ERROR("Ugh, why is this callback still rooted");
    }

    if (--gCallbacks[aCallback].refcnt <= 0) {
      LOG("Unrooting " + aCallback);
      delete gCallbacks[aCallback];
    }
  }},

  callbackIsRooted: { value: function CTypesUtils_callbackIsRooted(aCallback) {
    if (typeof(aCallback) != "function") {
      return false;
    }

    if (aCallback._wrapper != undefined &&
        !(aCallback instanceof ctypes.CData)) {
      return this.callbackIsRooted(aCallback._wrapper);
    }

    if (!("constructor" in aCallback) ||
        !(aCallback.constructor.targetType instanceof ctypes.FunctionType)) {
      return false;
    }

    if (aCallback in gCallbacks) {
      return true;
    }

    return false;
  }}
});

/**
 * Wrap the specified object, and return an object which only
 * exposes the properties listed in the source object's
 * "__exposedProps__" member
 *
 * @param  aObject
 *         Source object to wrap
 * @return Wrapped object
 */
function SimpleObjectWrapper(aObject) {

  if (!("__exposedProps__" in aObject)) {
    throw Error("__exposedProps__ missing from object");
  }

  function Wrapper() {
    aObject.__exposedProps__.forEach(function(prop) {

      // The property could be in our prototype chain
      let descriptor;
      let object = aObject;
      while (!descriptor && object) {
        descriptor = Object.getOwnPropertyDescriptor(object, prop);
        object = Object.getPrototypeOf(object);
      }

      if (!descriptor) {
        throw Error("Property " + prop + " was not found on object, or in " +
                    "objects prototype chain");
      }

      let d = {};
      if ("value" in descriptor && typeof(descriptor.value) == "function") {
        // Wrap the source function
        d.value = function() {
          return aObject[prop].apply(aObject, arguments);
        };
      } else {
        // Wrap the source getter/setter
        // For data values, add our own getter/setter on the wrapper
        if ("get" in descriptor || "value" in descriptor) {
          d.get = function() {
            return aObject[prop];
          };
        }

        if ("set" in descriptor || ("value" in descriptor &&
                                    descriptor.writable)) {
          d.set = function(aIn) {
            aObject[prop] = aIn;
          };
        }
      }

      if (!("value" in d) && !("get" in d) && !("set" in d)) {
        throw Error("Cannot wrap property " + prop +
                    " which has no value, getter or setter");
      }

      // "enumerable" is the only other attribute we care about. We
      // don't care about "configurable", as we're going to seal the object
      // anyway
      d.enumerable = descriptor.enumerable;
      Object.defineProperty(this, prop, d);
    }, this);

    Object.seal(this);
  }

  return new Wrapper();
}
