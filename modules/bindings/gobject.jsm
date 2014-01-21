
Components.utils.import("resource://edscalendar/bindings/glib.jsm");

Components.utils.import("resource://gre/modules/ctypes.jsm");

var EXPORTED_SYMBOLS = ["gobject"];

var gobject =
    {

      gobjectPath : "libgobject-2.0.so.0",

      lib : null,

      init : function() {

        this.lib = ctypes.open(this.gobjectPath);
        this.declareGObject(this);
      },


      declareGObject : function(parent) {

        parent._GObject = new ctypes.StructType("_GObject");
        parent.GObject = parent._GObject;

        parent.g_object_unref = parent.lib.declare("g_object_unref",
         ctypes.default_abi,
         ctypes.void_t, // return
         glib.gpointer); // mem

      },

      shutdown: function() {
        this.lib.close();
      }
    };
