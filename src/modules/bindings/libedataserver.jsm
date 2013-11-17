
var EXPORTED_SYMBOLS = ["libedataserver"];

var libedataserver =
    {

      glibPath : "libedataserver-1.2.so.17",

      lib : null,

      init : function() {

        Components.utils.import("resource://gre/modules/ctypes.jsm");

        this.lib = ctypes.open(this.glibPath);

        this.declareESourceBackend(this);
        this.declareESourceRegistry(this);
        this.declareESourceCalendar(this);
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

      debug : function(aMessage) {
        var consoleService =
            Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage("Libedataserver (" + new Date() + " ):\n\t" + aMessage);
        window.dump("Libedataserver: (" + new Date() + " ):\n\t" + aMessage + "\n");
      },

      shutdown : function() {
        this.lib.close();
      }
    };
