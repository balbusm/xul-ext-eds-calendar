
Components.utils.import("resource://gre/modules/ctypes.jsm");

var EXPORTED_SYMBOLS = ["gio"];

var gio =
    {

      gioPath : "libgio-2.0.so",

      lib : null,

      init : function() {

        this.lib = ctypes.open(this.gioPath);
        this.declareGCancellable(this);
      },

      declareGCancellable : function(parent) {

        parent._GCancellable = new ctypes.StructType("_GCancellable");
        parent.GCancellable = parent._GCancellable;

        parent.g_cancellable_new = parent.lib.declare("g_cancellable_new", ctypes.default_abi, parent.GCancellable.ptr);
        parent.createGCancellable = function() {
          return parent.g_cancellable_new();
        };
      },

      shutdown : function() {
        this.lib.close();
      }
    };
