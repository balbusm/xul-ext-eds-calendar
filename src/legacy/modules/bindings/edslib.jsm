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

  _edslib: null,
  _isOldEdsLib: null,

  loadEdsLib: function() {
    addLogger(this, "edslib");
    if (this._edslib !== null) {
      return this._edslib;
    }

    try {
      return this.loadNewEdsLib();
    } catch (ex) {
      if (!ex instanceof LoadingLibException) {
        throw ex;
      }
      return this.loadOldEdsLib();
    }
  },

  isOldEdsLib: function() {
    this.loadEdsLib();
    return this._isOldEdsLib;
  },

  loadNewEdsLib: function() {
    this._edslib = loadLib("libecal-2.0.so", 1);
    this._isOldEdsLib = false;
    return this._edslib;
  },

  loadOldEdsLib: function() {
    try {
      this._edslib = loadLib("libecal-1.2.so", 17);
      this._isOldEdsLib = true;
      return this._edslib;
    } catch (ex) {
      if (!ex instanceof LoadingLibException) {
        throw ex;
      }
      throw new LoadingLibException("Library libecal-2.0.so or libecal-1.2 not available. EdsCalendar requires EDS >= 0.8");
    }
  },

};
