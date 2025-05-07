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

const { moduleRegistry } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/utils/moduleRegistry.sys.mjs");
moduleRegistry.registerModule(import.meta.url);

const { XPCOMUtils } = ChromeUtils.importESModule("resource://gre/modules/XPCOMUtils.sys.mjs");
const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
const { ctypes } = ChromeUtils.importESModule("resource://gre/modules/ctypes.sys.mjs");
const { ExtensionParent } = ChromeUtils.importESModule("resource://gre/modules/ExtensionParent.sys.mjs");

const { LoadingLibException } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/utils/exceptions.sys.mjs");
const { addLogger } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/utils/logger.sys.mjs");

const libLoaderContext = {};
addLogger(libLoaderContext, "libLoader");


export function loadLib(libName, startFromABI, tryNextABIs = 30) {
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
    libLoaderContext.LOG("Opened " + libName);
    return lib;
  } catch (err) {
    return null;
  }
}