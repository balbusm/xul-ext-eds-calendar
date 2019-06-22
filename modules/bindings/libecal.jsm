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

var { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");
var edsUtils = ChromeUtils.import("resource://edscalendar/utils.jsm");

var { glib } = ChromeUtils.import("resource://edscalendar/bindings/glib.jsm");
var { gio } = ChromeUtils.import("resource://edscalendar/bindings/gio.jsm");
var { libical } = ChromeUtils.import("resource://edscalendar/bindings/libical.jsm");
var { libedataserver } = ChromeUtils.import("resource://edscalendar/bindings/libedataserver.jsm");

var EXPORTED_SYMBOLS = ["libecal"];

var libecal =
{

  lib: null,

  init: function () {

    edsUtils.addLogger(this, "libecal");
    this.lib = edsUtils.loadLib("libecal-1.2.so", 17);

    this.declareECalClientSourceType();
    this.declareECalObjModType();
    this.declareECalClient();

  },

  declareECalObjModType: function () {
    // Enum
    this.ECalObjModType = {
      E_CAL_OBJ_MOD_THIS: 1 << 0,
      E_CAL_OBJ_MOD_THIS_AND_PRIOR: 1 << 1,
      E_CAL_OBJ_MOD_THIS_AND_FUTURE: 1 << 2,
      E_CAL_OBJ_MOD_ALL: 0x07,
      E_CAL_OBJ_MOD_ONLY_THIS: 1 << 3
    };
    this.ECalObjModType.type = ctypes.int;

  },

  declareECalClientSourceType: function () {
    // Enum
    this.ECalClientSourceType = {
      E_CAL_CLIENT_SOURCE_TYPE_EVENTS: 0,
      E_CAL_CLIENT_SOURCE_TYPE_TASKS: 1,
      E_CAL_CLIENT_SOURCE_TYPE_MEMOS: 2,
    };
    this.ECalClientSourceType.type = ctypes.int;
  },

  declareECalClient: function () {

    // Structures
    this._ECalClient = new ctypes.StructType("_ECalClient");
    this.ECalClient = this._ECalClient;
    this.DONT_WAIT = -1;

    // Methods
    this.declareECalClientConnectSync();

    this.e_cal_client_create_object_sync =
      this.lib.declare(
        "e_cal_client_create_object_sync",
        ctypes.default_abi,
        glib.gboolean,
        this.ECalClient.ptr,
        libical.icalcomponent.ptr,
        glib.gchar.ptr.ptr,
        gio.GCancellable.ptr,
        glib.GError.ptr.ptr);

    this.e_cal_client_add_timezone_sync =
      this.lib.declare(
        "e_cal_client_add_timezone_sync",
        ctypes.default_abi,
        glib.gboolean,
        this.ECalClient.ptr,
        libical.icaltimezone.ptr,
        gio.GCancellable.ptr,
        glib.GError.ptr.ptr);

    this.e_cal_client_get_object_sync =
      this.lib.declare(
        "e_cal_client_get_object_sync",
        ctypes.default_abi,
        glib.gboolean,
        this.ECalClient.ptr,
        glib.gchar.ptr,
        glib.gchar.ptr,
        libical.icalcomponent.ptr.ptr,
        gio.GCancellable.ptr,
        glib.GError.ptr.ptr);

    this.e_cal_client_remove_object_sync =
      this.lib.declare("e_cal_client_remove_object_sync",
        ctypes.default_abi, glib.gboolean, // return
        this.ECalClient.ptr, // client
        glib.gchar.ptr, // uid
        glib.gchar.ptr, // rid
        libecal.ECalObjModType.type, // mod
        gio.GCancellable.ptr, // cancellable
        glib.GError.ptr.ptr); // error

    this.e_cal_client_modify_object_sync =
      this.lib.declare("e_cal_client_modify_object_sync",
        ctypes.default_abi, glib.gboolean, // return
        this.ECalClient.ptr, // client
        libical.icalcomponent.ptr, // icalcomp
        libecal.ECalObjModType.type, // mod
        gio.GCancellable.ptr, // cancellable
        glib.GError.ptr.ptr); // error

    //    	this.e_cal_client_get_objects_for_uid_sync = this.lib.declare(
    //    			"e_cal_client_get_objects_for_uid_sync", ctypes.default_abi,
    //    			glib.gboolean, this.ECalClient.ptr, glib.gchar.ptr, glib.GSList.ptr.ptr,
    //    			gio.GCancellable.ptr, glib.GError.ptr.ptr);


  },

  declareECalClientConnectSync: function () {
    // e_cal_client_connect_sync has changed declaration over the time
    // newer version takes ECalClientSourceType, gint, GCancellable, GError
    // older version takes ECalClientSourceType, GCancellable, GError
    // check which version is used
    // create proxy for old version to ignore unnecessary argument
    var versionIssue = libedataserver.eds_check_version(3, 16, 0);
    if (versionIssue.isNull()) {
      this.LOG("Loading new declaration of e_cal_client_connect_sync...");
      this.e_cal_client_connect_sync = this.lib.declare(
        "e_cal_client_connect_sync",
        ctypes.default_abi,
        this.ECalClient.ptr,
        libedataserver.ESource.ptr,
        libecal.ECalClientSourceType.type,
        glib.gint,
        gio.GCancellable.ptr,
        glib.GError.ptr.ptr);

    } else {
      this.LOG("Loading old declaration of e_cal_client_connect_sync. Reason: "
        + versionIssue.readString());
      this._e_cal_client_connect_sync = this.lib.declare(
        "e_cal_client_connect_sync",
        ctypes.default_abi,
        this.ECalClient.ptr,
        libedataserver.ESource.ptr,
        libecal.ECalClientSourceType.type,
        gio.GCancellable.ptr,
        glib.GError.ptr.ptr);
      this.e_cal_client_connect_sync = function () {
        // copy args to array (shouldn't be in separate method)
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i) {
          //i is always valid index in the arguments object
          args[i] = arguments[i];
        }

        args.splice(2, 1);
        this.LOG("Calling e_cal_client_connect_sync without timeout");
        return this._e_cal_client_connect_sync.apply(this, args);
      }
    }
    this.LOG("Successfully loaded e_cal_client_connect_sync");

  },

  shutdown: function () {
    this.lib.close();
  }
};
