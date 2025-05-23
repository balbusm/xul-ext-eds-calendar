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
const { moduleRegistry } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/utils/moduleRegistry.sys.mjs");
moduleRegistry.registerModule(import.meta.url);

const { classes: Cc, interfaces: Ci, results: Cr } = Components;

const { XPCOMUtils } = ChromeUtils.importESModule("resource://gre/modules/XPCOMUtils.sys.mjs");
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");

const { edsPreferences } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/utils/edsPreferences.sys.mjs");

const Services = globalThis.Services;

var gBase = null;


function formatLogMessage(aType, aDomain, aStr) {
  return `${new Date().toISOString()} ${aType.toUpperCase()}  ${aDomain} : ${aStr}`;
}

function formatStackMessage(stack) {
  return `\nSource: ${stack.sourceName}:${stack.lineNumber}`
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
      const message = formatLogMessage("log", this.domain, aStr);
      const stack = getStackDetails(aException);
      const stackMessage = formatStackMessage(stack);

      if (aException) {
        console.log(message, aException, stackMessage);
      } else {
        console.log(message, stackMessage);
      }
    }
  }

  warn(aStr, aException) {
    const message = formatLogMessage("warn", this.domain, aStr);

    const stack = getStackDetails(aException);
    const stackMessage = formatStackMessage(stack);

    if (aException) {
      console.warn(message, aException, stackMessage);
    } else {
      console.warn(message, stackMessage);
    }

  }

  error(aStr, aException) {
    const message = formatLogMessage("error", this.domain, aStr);

    const stack = getStackDetails(aException);
    const stackMessage = formatStackMessage(stack);

    if (aException) {
      console.error(message, aException, stackMessage);
    } else {
      console.error(message, stackMessage);
    }

  }
}

export function addLogger(aTarget, aDomain) {
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

  /* eslint-disable */
  ["log", "warn", "error"].forEach(function(name) {
    let upper = name.toUpperCase();
    delete aTarget[upper];
    aTarget[upper] = function() {
      logger[name].apply(logger, arguments);
    };
  });
  /* eslint-enable */
}

function init() {
  let uri = Services.io.newURI(import.meta.url, null, null);
  if (uri.scheme != "resource") {
    throw Error("This only works properly from resource URI's at the moment");
  }

  gBase = uri.host;
}

export function maskVariable(variable) {
  let resultVariable = variable;
  if (edsPreferences.isLoggingMasked()) {
    resultVariable = "***";
  }
  return resultVariable;
}

init();
