/* ***** BEGIN LICENSE BLOCK *****
 * EDS Calendar Integration
 * Copyright: 2021 Mateusz Balbus <balbusm@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * The GNU General Public License as published by the Free Software Foundation,
 * version 2 is available at: <http://www.gnu.org/licenses/>
 *
 * ***** END LICENSE BLOCK ***** */
"use strict";
const { moduleRegistry } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/moduleRegistry.jsm");
moduleRegistry.registerModule(__URI__);

const { classes: Cc, interfaces: Ci, results: Cr } = Components;

const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { XPCOMUtils } = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
const { AddonManager } = ChromeUtils.import("resource://gre/modules/AddonManager.jsm");

const { edsPreferences } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/edsPreferences.jsm");

const EXPORTED_SYMBOLS = ["addLogger"];

var gBase = null;

function formatLogMessage(aType, aDomain, aStr, aException) {
  let message = `${new Date().toISOString()} ${aType.toUpperCase()}  ${aDomain} : ${aStr}`;
  if (aException) {
    return message + ": " + aException;
  }
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
  } catch (e) {
    return {
      sourceName: null,
      lineNumber: 0
    };
  }
}

class Logger {
  constructor(aDomain) {
    this.domain = aDomain;
    this.branch = null;
    this._debugLogEnabled = false;
    this.init();
  }

  init() {
    try {
      this._debugLogEnabled = false;

      let domains = edsPreferences.getLoggingDomains();
      let domainsList = domains.split(/\s*,\s*/);
      let loggingEnabled = edsPreferences.isLoggingEnabled();
      if (loggingEnabled &&
         (domains.indexOf(this.domain) != -1 ||
         domains.indexOf("all") != -1)) {
          this._debugLogEnabled = true;
       }
    } catch (e) { this._debugLogEnabled = false; }
  }

  get debugLogEnabled() {
    return this._debugLogEnabled;
  }

  log(aStr, aException) {
    if (this.debugLogEnabled) {
      let message = formatLogMessage("log", this.domain, aStr, aException);
      let stack = getStackDetails(aException);

      let consoleMessage = Cc["@mozilla.org/scripterror;1"]
                           .createInstance(Ci.nsIScriptError);
      consoleMessage.init(message, stack.sourceName, null, stack.lineNumber, 0,
                          Ci.nsIScriptError.infoFlag, "component javascript");
      Services.console.logMessage(consoleMessage);
      dump("*** " + message + "\n");
    }
  }

  warn(aStr, aException) {
    let message = formatLogMessage("warn", this.domain, aStr, aException);

    let stack = getStackDetails(aException);

    let consoleMessage = Cc["@mozilla.org/scripterror;1"]
                         .createInstance(Ci.nsIScriptError);
    consoleMessage.init(message, stack.sourceName, null, stack.lineNumber, 0,
                        Ci.nsIScriptError.warningFlag, "component javascript");
    Services.console.logMessage(consoleMessage);

    if (this.debugLogEnabled) {
      dump("*** " + message + "\n");
    }
  }

  error(aStr, aException) {
    let message = formatLogMessage("error", this.domain, aStr, aException);

    let stack = getStackDetails(aException);

    let consoleMessage = Cc["@mozilla.org/scripterror;1"]
                         .createInstance(Ci.nsIScriptError);
    consoleMessage.init(message, stack.sourceName, null, stack.lineNumber, 0,
                        Ci.nsIScriptError.errorFlag, "component javascript");
    Services.console.logMessage(consoleMessage);

    if (this.debugLogEnabled) {
      dump("*** " + message + "\n");
    }
  }
}

function addLogger(aTarget, aDomain) {
  if (typeof (aTarget) != "object") {
    throw Error("Must pass an object on which to add logging functions");
  }

  let domain;
  if (aDomain) {
    if (typeof (aDomain) != "string") {
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
}

init();
