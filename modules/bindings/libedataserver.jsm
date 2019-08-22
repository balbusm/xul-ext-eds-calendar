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

var EXPORTED_SYMBOLS = ["libedataserver"];

var libedataserver =
{

    lib: null,

    init: function () {
        edsUtils.addLogger(this, "libedataserver");
        // Workaround to make sure that invalid version of libedataserver-1.2.so
        // is not loaded (libecal makes libedataserver load)
        this.lib = edsUtils.loadLib("libecal-1.2.so", 17);

        this.declareVersionChecking();
        this.declareESource();
        this.declareESourceRegistry();
        this.declareESourceBackend();
        this.declareESourceSelectable();
        this.declareESourceRegistry();
        this.declareESourceCalendar();
        this.declareESourceTaskList();
        this.declareEClient();
        this.declareEUid();
    },

    declareVersionChecking: function () {
        this.eds_check_version =
            this.lib.declare(
                "eds_check_version",
                ctypes.default_abi,
                glib.gchar.ptr,
                glib.gint,
                glib.gint,
                glib.gint);
    },

    declareESource: function () {

        // Structures
        this._ESource = new ctypes.StructType("_ESource");

        this.ESource = this._ESource;

        // Methods
        this.e_source_new_with_uid =
            this.lib.declare(
                "e_source_new_with_uid",
                ctypes.default_abi,
                this.ESource.ptr,
                glib.gchar.ptr,
                glib.GMainContext.ptr,
                glib.GError.ptr.ptr);

        this.e_source_get_extension =
            this.lib.declare(
                "e_source_get_extension",
                ctypes.default_abi,
                glib.gpointer,
                this.ESource.ptr,
                glib.gchar.ptr);

        this.e_source_set_display_name =
            this.lib.declare(
                "e_source_set_display_name",
                ctypes.default_abi,
                ctypes.void_t,
                this.ESource.ptr,
                glib.gchar.ptr);

        this.e_source_get_display_name =
            this.lib.declare("e_source_get_display_name",
                ctypes.default_abi,
                glib.gchar.ptr,
                this.ESource.ptr);

        this.e_source_dup_display_name =
            this.lib.declare("e_source_dup_display_name",
                ctypes.default_abi,
                glib.gchar.ptr,
                this.ESource.ptr);

        this.e_source_get_uid =
            this.lib.declare("e_source_get_uid",
                ctypes.default_abi,
                glib.gchar.ptr,
                this.ESource.ptr);

        this.e_source_dup_uid =
            this.lib.declare("e_source_dup_uid",
                ctypes.default_abi,
                glib.gchar.ptr,
                this.ESource.ptr);

        this.e_source_set_parent =
            this.lib.declare(
                "e_source_set_parent",
                ctypes.default_abi,
                ctypes.void_t,
                this.ESource.ptr,
                glib.gchar.ptr);

        this.e_source_get_uid =
            this.lib.declare("e_source_get_parent",
                ctypes.default_abi,
                glib.gchar.ptr,
                this.ESource.ptr);

        this.e_source_remove_sync =
            this.lib.declare("e_source_remove_sync",
                ctypes.default_abi,
                glib.gboolean, // return
                this.ESource.ptr, // source
                gio.GCancellable.ptr, // cancellable
                glib.GError.ptr.ptr); // error

    },

    declareESourceRegistry: function () {

        // Structures
        this._ESourceRegistry = new ctypes.StructType("_ESourceRegistry");
        this.ESourceRegistry = this._ESourceRegistry;

        // Methods
        this.e_source_registry_new_sync =
            this.lib.declare(
                "e_source_registry_new_sync",
                ctypes.default_abi,
                this.ESourceRegistry.ptr,
                gio.GCancellable.ptr,
                glib.GError.ptr.ptr);

        this.e_source_registry_list_sources =
            this.lib.declare(
                "e_source_registry_list_sources",
                ctypes.default_abi,
                glib.GList.ptr,
                this.ESourceRegistry.ptr,
                glib.gchar.ptr);

        this.e_source_registry_check_enabled =
            this.lib.declare(
                "e_source_registry_check_enabled",
                ctypes.default_abi,
                glib.gboolean,
                this.ESourceRegistry.ptr,
                libedataserver.ESource.ptr);

        this.e_source_registry_commit_source_sync =
            this.lib.declare(
                "e_source_registry_commit_source_sync",
                ctypes.default_abi,
                glib.gboolean,
                this.ESourceRegistry.ptr,
                libedataserver.ESource.ptr,
                gio.GCancellable.ptr,
                glib.GError.ptr.ptr);

        this.e_source_registry_ref_source =
            this.lib.declare(
                "e_source_registry_ref_source",
                ctypes.default_abi,
                libedataserver.ESource.ptr,
                this.ESourceRegistry.ptr,
                glib.gchar.ptr);

    },

    declareESourceBackend: function () {
        // Structures
        this._ESourceBackend = new ctypes.StructType("_ESourceBackend");
        this.ESourceBackend = this._ESourceBackend;

        // ESourceBackend
        this.e_source_backend_set_backend_name =
            this.lib.declare(
                "e_source_backend_set_backend_name",
                ctypes.default_abi,
                ctypes.void_t,
                this.ESourceBackend.ptr,
                glib.gchar.ptr);

        this.e_source_backend_dup_backend_name =
            this.lib.declare(
                "e_source_backend_dup_backend_name",
                ctypes.default_abi,
                glib.gchar.ptr,
                this.ESourceBackend.ptr);

    },

    declareESourceSelectable: function () {
        // Structures
        this._ESourceSelectable = new ctypes.StructType("_ESourceSelectable");
        this.ESourceSelectable = this._ESourceSelectable;

        // ESourceSelectable
        this.e_source_selectable_set_color =
            this.lib.declare(
                "e_source_selectable_set_color",
                ctypes.default_abi,
                ctypes.void_t,
                this.ESourceSelectable.ptr,
                glib.gchar.ptr);

        this.e_source_selectable_dup_color =
            this.lib.declare(
                "e_source_selectable_dup_color",
                ctypes.default_abi,
                glib.gchar.ptr,
                this.ESourceSelectable.ptr);

    },

    declareESourceRegistry: function () {

        // Structures
        this._ESourceRegistry = new ctypes.StructType("_ESourceRegistry");
        this.ESourceRegistry = this._ESourceRegistry;

        // Methods
        this.e_source_registry_new_sync =
            this.lib.declare(
                "e_source_registry_new_sync",
                ctypes.default_abi,
                this.ESourceRegistry.ptr,
                gio.GCancellable.ptr,
                glib.GError.ptr.ptr);

        this.e_source_registry_list_sources =
            this.lib.declare(
                "e_source_registry_list_sources",
                ctypes.default_abi,
                glib.GList.ptr,
                this.ESourceRegistry.ptr,
                glib.gchar.ptr);

        this.e_source_registry_check_enabled =
            this.lib.declare(
                "e_source_registry_check_enabled",
                ctypes.default_abi,
                glib.gboolean,
                this.ESourceRegistry.ptr,
                libedataserver.ESource.ptr);

        this.e_source_registry_commit_source_sync =
            this.lib.declare(
                "e_source_registry_commit_source_sync",
                ctypes.default_abi,
                glib.gboolean,
                this.ESourceRegistry.ptr,
                libedataserver.ESource.ptr,
                gio.GCancellable.ptr,
                glib.GError.ptr.ptr);

        this.e_source_registry_ref_source =
            this.lib.declare(
                "e_source_registry_ref_source",
                ctypes.default_abi,
                libedataserver.ESource.ptr,
                this.ESourceRegistry.ptr,
                glib.gchar.ptr);

    },

    declareESourceCalendar: function () {
        this.ESourceCalendar = {
            E_SOURCE_EXTENSION_CALENDAR: "Calendar"
        };

    },

    declareESourceTaskList: function () {
        this.ESourceTaskList = {
            E_SOURCE_EXTENSION_TASK_LIST: "Task List"
        };

    },

    declareEClient: function () {
        // Structures
        this._EClient = new ctypes.StructType("_EClient");
        this.EClient = this._EClient;

        // Methods
        this.e_client_get_source =
            this.lib.declare(
                "e_client_get_source",
                ctypes.default_abi,
                libedataserver.ESource.ptr,
                this.EClient.ptr);

    },


    declareEUid: function () {
        this.e_uid_new =
            this.lib.declare(
                "e_uid_new",
                ctypes.default_abi,
                glib.gchar.ptr);

    },


    shutdown: function () {
        this.lib.close();
    }
};
