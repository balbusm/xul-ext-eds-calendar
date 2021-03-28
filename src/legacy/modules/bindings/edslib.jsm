/* ***** BEGIN LICENSE BLOCK *****
 * EDS Calendar Integration
 * Copyright: 2011 Philipp Kewisch <mozilla@kewis.ch>
 * Copyright: 2014-2015 Mateusz Balbus <balbusm@gmail.com>
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

const { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");
const { addLogger } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/logger.jsm");
const { loadLib } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/libLoader.jsm");
const { LoadingLibException } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/exceptions.jsm");

const EXPORTED_SYMBOLS = ["edslib"];

const edslib = {

  loadEdsLib: function() {
    try {
      addLogger(this, "edslib");
      return loadLib("libecal-2.0.so", 1);
    } catch (ex) {
      if (!ex instanceof LoadingLibException) {
        throw ex;
      }
      let reason = this.investigateLoadingLibException();
      if (reason === null) {
        throw ex;
      }
      this.ERROR(reason);
      throw new LoadingLibException(reason);
    }
  },

  investigateLoadingLibException: function() {
    let lib12 = this.loadOldEdsLib();
    if (lib12 === null) {
      return null;
    }
    let reason = "Library libecal-2.0.so not available. Detected not suported libecal-1.2.so. EdsCalendar >= v0.8 requires at least EDS 3.33.2. Try EdsCalendar < v0.8";
    lib12.close();
    return reason;
  },

  loadOldEdsLib: function() {
    try {
      return loadLib("libecal-1.2.so", 17);
    } catch (ex) {
      return null;
    }
  },

};
