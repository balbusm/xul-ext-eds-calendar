/* ***** BEGIN LICENSE BLOCK *****
 * EDS Calendar Integration
 * Copyright: 2011 Philipp Kewisch <mozilla@kewis.ch>
 * Copyright: 2014 Mateusz Balbus <balbusm@gmail.com>
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
// Do not unload c libs as it causes crash
// moduleRegistry.registerModule(__URI__);

const { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");
const { addLogger } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/logger.jsm");
const { loadLib } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/libLoader.jsm");

const EXPORTED_SYMBOLS = ["gio"];

const gio =
{

  lib: null,

  init: function() {
    if (this.lib) {
      return;
    }
    addLogger(this, "gio");
    this.lib = loadLib("libgio-2.0.so", 0);

    this.declareGCancellable();
  },

  declareGCancellable: function() {
    this._GCancellable = new ctypes.StructType("_GCancellable");
    this.GCancellable = this._GCancellable;

    this.g_cancellable_new = this.lib.declare("g_cancellable_new", ctypes.default_abi, this.GCancellable.ptr);
    this.createGCancellable = function() {
      return this.g_cancellable_new();
    };
  },

  shutdown: function() {
    this.lib.close();
  }
};
