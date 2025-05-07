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

const { ExtensionParent } = ChromeUtils.importESModule("resource://gre/modules/ExtensionParent.sys.mjs");
// EDS Calenadr ID
const EXTENSION_ID = "{e6696d02-466a-11e3-a162-04e36188709b}";

function getWXAPI(extension, name, sync = false) {
  function implementation(api) {
    let impl = api.getAPI({ extension })[name];

    if (name == "storage") {
      impl.local.get = (...args) => impl.local.callMethodInParentProcess("get", args);
      impl.local.set = (...args) => impl.local.callMethodInParentProcess("set", args);
      impl.local.remove = (...args) => impl.local.callMethodInParentProcess("remove", args);
      impl.local.clear = (...args) => impl.local.callMethodInParentProcess("clear", args);
    }
    return impl;
  }

  if (sync) {
    let api = extension.apiManager.getAPI(name, extension, "addon_parent");
    return implementation(api);
  } else {
    return extension.apiManager.asyncGetAPI(name, extension, "addon_parent").then(api => {
      return implementation(api);
    });
  }
}

export function getMessenger() {
  let extension = ExtensionParent.GlobalManager.getExtension(
    EXTENSION_ID
  );

  let messenger = {};
  ChromeUtils.defineLazyGetter(messenger, "storage", () => getWXAPI(extension, "storage", true));
  return messenger;
}
