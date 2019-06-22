const { classes: Cc, interfaces: Ci, results: Cr} = Components;

const NS_PREFBRANCH_PREFCHANGE_TOPIC_ID = "nsPref:changed";

var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { AddonManager } = ChromeUtils.import("resource://gre/modules/AddonManager.jsm");
var { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");

var { LoadingLibException } = ChromeUtils.import("resource://edscalendar/exceptions.jsm");

var EXPORTED_SYMBOLS = ["addLogger", "loadLib"];

var gBase;
var gLogPrefRoot;
var gBindNow = false;
var gCallbacks = {};

function formatLogMessage(aType, aDomain, aStr, aException) {
  let message = `${new Date().toISOString()} ${aType.toUpperCase()}  ${aDomain} : ${aStr}`;
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
    let upper = name.toUpperCase();
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


init();
addLogger(this, "utils");


function loadLib(libName, startFromABI, tryNextABIs = 30) {
  var lib = null;
  var maxABI = startFromABI + tryNextABIs;
  for (let abi = startFromABI; abi <= maxABI; abi++ ) {
    lib = tryLoadLib(libName + "." + abi);
    if (lib !== null) {
      return lib;
    }
  }
  // Last resort try without ABI
  lib = tryLoadLib(libName);
  if (lib !== null) {
    return lib;
  }
  throw new LoadingLibException("Unable to load library " + libName + " with any ABI from " + startFromABI + " to " + maxABI);
}

function tryLoadLib(libName) {
  try {
    let lib = ctypes.open(libName);
    LOG("Opened " + libName);
    return lib;
  } catch (err) {
    return null;
  }
}

