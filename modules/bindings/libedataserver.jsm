
Components.utils.import("resource://gre/modules/ctypes.jsm");

Components.utils.import("resource://edscalendar/bindings/glib.jsm");
Components.utils.import("resource://edscalendar/bindings/gio.jsm");
Components.utils.import("resource://edscalendar/bindings/libical.jsm");
Components.utils.import("resource://edscalendar/bindings/libecal.jsm");
Components.utils.import("resource://edscalendar/utils.jsm");

var EXPORTED_SYMBOLS = ["libedataserver"];

var libedataserver =
    {

      binaries : [ "libedataserver-1.2.so.17", "libedataserver-1.2.so.18", "libedataserver-1.2.so" ],

      lib : null,

      init : function() {
        addLogger(this, "libedataserver");
        for (let path of this.binaries) {
          try {
            this.lib = ctypes.open(path);
            this.LOG("Opened " + path);
            break;
          } catch (err) {
            this.WARN("Failed to open " + path + ": " + err);
          }
        }

        this.declareESourceBackend();
        this.declareESourceRegistry();
        this.declareESourceCalendar();
        this.declareESourceTaskList();
        this.declareEClient();
        this.declareEUid();
      },

      declareESourceBackend : function() {
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

        this.e_source_backend_get_backend_name =
            this.lib.declare(
                "e_source_backend_get_backend_name",
                ctypes.default_abi,
                glib.gchar.ptr,
                libecal.ESource.ptr);

      },

      declareESourceRegistry : function() {

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
              libecal.ESource.ptr);
        
        this.e_source_registry_commit_source_sync =
            this.lib.declare(
                "e_source_registry_commit_source_sync",
                ctypes.default_abi,
                glib.gboolean,
                this.ESourceRegistry.ptr,
                libecal.ESource.ptr,
                gio.GCancellable.ptr,
                glib.GError.ptr.ptr);

        this.e_source_registry_ref_source =
            this.lib.declare(
                "e_source_registry_ref_source",
                ctypes.default_abi,
                libecal.ESource.ptr,
                this.ESourceRegistry.ptr,
                glib.gchar.ptr);

      },

      declareESourceCalendar : function() {
        this.ESourceCalendar = {
          E_SOURCE_EXTENSION_CALENDAR : "Calendar"
        };

      },
      
      declareESourceTaskList : function() {
        this.ESourceTaskList = {
            E_SOURCE_EXTENSION_TASK_LIST : "Task List"
          };
        
      },
      
      declareEClient : function() {
        // Structures
        this._EClient = new ctypes.StructType("_EClient");
        this.EClient = this._EClient;
        
        // Methods
        this.e_client_get_source =
          this.lib.declare(
              "e_client_get_source",
              ctypes.default_abi,
              libecal.ESource.ptr,
              this.EClient.ptr);

      },

      
      declareEUid : function() {
        this.e_uid_new =
          this.lib.declare(
              "e_uid_new",
              ctypes.default_abi,
              glib.gchar.ptr);

      },
      

      shutdown : function() {
        this.lib.close();
      }
    };
