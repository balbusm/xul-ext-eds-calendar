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
