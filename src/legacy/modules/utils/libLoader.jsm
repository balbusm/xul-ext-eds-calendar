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

const { moduleRegistry } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/moduleRegistry.jsm");
moduleRegistry.registerModule(__URI__);

const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { XPCOMUtils } = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
const { AddonManager } = ChromeUtils.import("resource://gre/modules/AddonManager.jsm");
const { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");
const { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");

const { LoadingLibException } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/exceptions.jsm");
const { addLogger } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/logger.jsm");

const EXPORTED_SYMBOLS = ["loadLib"];


function loadLib(libName, startFromABI, tryNextABIs = 30) {
  var lib = null;
  var maxABI = startFromABI + tryNextABIs;
  for (let abi = startFromABI; abi <= maxABI; abi++) {
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

addLogger(this, "libLoader");
