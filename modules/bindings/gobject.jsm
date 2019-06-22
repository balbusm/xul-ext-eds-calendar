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

var { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");
var edsUtils = ChromeUtils.import("resource://edscalendar/utils.jsm");

var { glib } = ChromeUtils.import("resource://edscalendar/bindings/glib.jsm");


var EXPORTED_SYMBOLS = ["gobject"];

var gobject =
{

  lib: null,

  init: function () {

    edsUtils.addLogger(this, "gobject");
    this.lib = edsUtils.loadLib("libgobject-2.0.so", 0);

    this.declareGObject();
  },


  declareGObject: function () {

    this._GObject = new ctypes.StructType("_GObject");
    this.GObject = this._GObject;

    this.g_object_unref = this.lib.declare("g_object_unref",
      ctypes.default_abi,
      ctypes.void_t, // return
      glib.gpointer); // mem

  },

  shutdown: function () {
    this.lib.close();
  }
};
