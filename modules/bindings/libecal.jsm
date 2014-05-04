
Components.utils.import("resource://gre/modules/ctypes.jsm");

Components.utils.import("resource://edscalendar/bindings/glib.jsm");
Components.utils.import("resource://edscalendar/bindings/gio.jsm");
Components.utils.import("resource://edscalendar/bindings/libical.jsm");
Components.utils.import("resource://edscalendar/utils.jsm");


var EXPORTED_SYMBOLS = ["libecal"];

var libecal =
    {

      binaries : [ "libecal-1.2.so.15", "libecal-1.2.so.16", "libecal-1.2.so" ],

      lib : null,

      init : function() {
        
        addLogger(this, "libecal");
        this.lib = loadLib(this.binaries);

        this.declareESource();
        this.declareECalClientSourceType();
        this.declareECalObjModType();
        this.declareECalClient();

      },

      declareESource : function() {

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

      declareECalObjModType : function() {
        // Enum
        this.ECalObjModType = {
          E_CAL_OBJ_MOD_THIS : 1 << 0,
          E_CAL_OBJ_MOD_THIS_AND_PRIOR : 1 << 1,
          E_CAL_OBJ_MOD_THIS_AND_FUTURE : 1 << 2,
          E_CAL_OBJ_MOD_ALL : 0x07,
          E_CAL_OBJ_MOD_ONLY_THIS : 1 << 3
        };
        this.ECalObjModType.type = ctypes.int;

      },

      declareECalClientSourceType : function() {
        // Enum
        this.ECalClientSourceType = {
          E_CAL_CLIENT_SOURCE_TYPE_EVENTS : 0,
          E_CAL_CLIENT_SOURCE_TYPE_TASKS : 1,
          E_CAL_CLIENT_SOURCE_TYPE_MEMOS : 2,
        };
        this.ECalClientSourceType.type = ctypes.int;
      },

      declareECalClient : function() {

        // Structures
        this._ECalClient = new ctypes.StructType("_ECalClient");
        this.ECalClient = this._ECalClient;

        // Methods
        this.e_cal_client_connect_sync =
            this.lib.declare(
                "e_cal_client_connect_sync",
                ctypes.default_abi,
                this.ECalClient.ptr,
                libecal.ESource.ptr,
                libecal.ECalClientSourceType.type,
                gio.GCancellable.ptr,
                glib.GError.ptr.ptr);

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

      shutdown : function() {
        this.lib.close();
      }
    };
