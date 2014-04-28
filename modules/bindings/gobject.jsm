
Components.utils.import("resource://gre/modules/ctypes.jsm");

Components.utils.import("resource://edscalendar/bindings/glib.jsm");
Components.utils.import("resource://edscalendar/utils.jsm");


var EXPORTED_SYMBOLS = ["gobject"];

var gobject =
    {

      binaries : ["libgobject-2.0.so.0", "libgobject-2.0.so" ],

      lib : null,

      init : function() {

        addLogger(this, "gobject");
        for (let path of this.binaries) {
          try {
            this.lib = ctypes.open(path);
            this.LOG("Opened " + path);
            break;
          } catch (err) {
            this.WARN("Failed to open " + path + ": " + err);
          }
        }
        this.declareGObject();
      },


      declareGObject : function() {

        this._GObject = new ctypes.StructType("_GObject");
        this.GObject = this._GObject;

        this.g_object_unref = this.lib.declare("g_object_unref",
         ctypes.default_abi,
         ctypes.void_t, // return
         glib.gpointer); // mem

      },

      shutdown: function() {
        this.lib.close();
      }
    };
