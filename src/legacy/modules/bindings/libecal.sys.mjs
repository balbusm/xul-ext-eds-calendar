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
const { moduleRegistry } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/utils/moduleRegistry.sys.mjs");
// Do not unload c libs as it causes crash
// moduleRegistry.registerModule(import.meta.url);

const { ctypes } = ChromeUtils.importESModule("resource://gre/modules/ctypes.sys.mjs");
const { addLogger } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/utils/logger.sys.mjs");
const { loadLib } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/utils/libLoader.sys.mjs");

const { glib } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/bindings/glib.sys.mjs");
const { gio } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/bindings/gio.sys.mjs");
const { libical } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/bindings/libical.sys.mjs");
const { libedataserver } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/bindings/libedataserver.sys.mjs");
const { edslib } = ChromeUtils.importESModule("resource://edscalendar/legacy/modules/bindings/edslib.sys.mjs");


export const libecal =
{

  lib: null,

  init: function() {
    if (this.lib) {
      return;
    }

    addLogger(this, "libecal");
    this.lib = edslib.loadEdsLib();

    this.declareECalClientSourceType();
    this.declareECalObjModType();
    this.declareECalClient();
  },

  declareECalObjModType: function() {
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

  declareECalClientSourceType: function() {
    // Enum
    this.ECalClientSourceType = {
      E_CAL_CLIENT_SOURCE_TYPE_EVENTS: 0,
      E_CAL_CLIENT_SOURCE_TYPE_TASKS: 1,
      E_CAL_CLIENT_SOURCE_TYPE_MEMOS: 2,
    };
    this.ECalClientSourceType.type = ctypes.int;
  },

  declareECalClient: function() {
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
  },

  declareECalClientConnectSync: function() {
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

    this.LOG("Successfully loaded e_cal_client_connect_sync");
  },

  shutdown: function() {
    this.lib.close();
  }
};
