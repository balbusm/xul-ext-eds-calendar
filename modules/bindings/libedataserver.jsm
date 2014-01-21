
Components.utils.import("resource://gre/modules/ctypes.jsm");

Components.utils.import("resource://edscalendar/bindings/glib.jsm");
Components.utils.import("resource://edscalendar/bindings/gio.jsm");
Components.utils.import("resource://edscalendar/bindings/libical.jsm");
Components.utils.import("resource://edscalendar/bindings/libecal.jsm");

var EXPORTED_SYMBOLS = ["libedataserver"];

var libedataserver =
    {

      glibPath : "libedataserver-1.2.so.17",

      lib : null,

      init : function() {

        this.lib = ctypes.open(this.glibPath);

        this.declareESourceBackend(this);
        this.declareESourceRegistry(this);
        this.declareESourceCalendar(this);
        this.declareESourceTaskList(this);
        this.declareEClient(this);
        this.declareEUid(this);
      },

      declareESourceBackend : function(parent) {
        // Structures
        parent._ESourceBackend = new ctypes.StructType("_ESourceBackend");
        parent.ESourceBackend = parent._ESourceBackend;

        // ESourceBackend
        parent.e_source_backend_set_backend_name =
            parent.lib.declare(
                "e_source_backend_set_backend_name",
                ctypes.default_abi,
                ctypes.void_t,
                parent.ESourceBackend.ptr,
                glib.gchar.ptr);

        parent.e_source_backend_get_backend_name =
            parent.lib.declare(
                "e_source_backend_get_backend_name",
                ctypes.default_abi,
                glib.gchar.ptr,
                libecal.ESource.ptr);

      },

      declareESourceRegistry : function(parent) {

        // Structures
        parent._ESourceRegistry = new ctypes.StructType("_ESourceRegistry");
        parent.ESourceRegistry = parent._ESourceRegistry;

        // Methods
        parent.e_source_registry_new_sync =
            parent.lib.declare(
                "e_source_registry_new_sync",
                ctypes.default_abi,
                parent.ESourceRegistry.ptr,
                gio.GCancellable.ptr,
                glib.GError.ptr.ptr);

        parent.e_source_registry_list_sources =
            parent.lib.declare(
                "e_source_registry_list_sources",
                ctypes.default_abi,
                glib.GList.ptr,
                parent.ESourceRegistry.ptr,
                glib.gchar.ptr);

        parent.e_source_registry_commit_source_sync =
            parent.lib.declare(
                "e_source_registry_commit_source_sync",
                ctypes.default_abi,
                glib.gboolean,
                parent.ESourceRegistry.ptr,
                libecal.ESource.ptr,
                gio.GCancellable.ptr,
                glib.GError.ptr.ptr);

        parent.e_source_registry_ref_source =
            parent.lib.declare(
                "e_source_registry_ref_source",
                ctypes.default_abi,
                libecal.ESource.ptr,
                parent.ESourceRegistry.ptr,
                glib.gchar.ptr);

      },

      declareESourceCalendar : function(parent) {
        parent.ESourceCalendar = {
          E_SOURCE_EXTENSION_CALENDAR : "Calendar"
        };

      },
      
      declareESourceTaskList : function(parent) {
        parent.ESourceTaskList = {
            E_SOURCE_EXTENSION_TASK_LIST : "Task List"
          };
        
      },
      
      declareEClient : function(parent) {
        // Structures
        parent._EClient = new ctypes.StructType("_EClient");
        parent.EClient = parent._EClient;
        
        // Methods
        parent.e_client_get_source =
          parent.lib.declare(
              "e_client_get_source",
              ctypes.default_abi,
              libecal.ESource.ptr,
              parent.EClient.ptr);

      },

      
      declareEUid : function(parent) {
        parent.e_uid_new =
          parent.lib.declare(
              "e_uid_new",
              ctypes.default_abi,
              glib.gchar.ptr);

      },
      

      shutdown : function() {
        this.lib.close();
      }
    };
