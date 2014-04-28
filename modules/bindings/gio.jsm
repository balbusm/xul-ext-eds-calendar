
Components.utils.import("resource://gre/modules/ctypes.jsm");

Components.utils.import("resource://edscalendar/utils.jsm");

var EXPORTED_SYMBOLS = ["gio"];

var gio =
    {

      binaries : ["libgio-2.0.so.0", "libgio-2.0.so"],

      lib : null,

      init : function() {

        addLogger(this, "gio");
        for (let path of this.binaries) {
          try {
            this.lib = ctypes.open(path);
            this.LOG("Opened " + path);
            break;
          } catch (err) {
            this.WARN("Failed to open " + path + ": " + err);
          }
        }
        this.declareGCancellable();
      },

      declareGCancellable : function() {

        this._GCancellable = new ctypes.StructType("_GCancellable");
        this.GCancellable = this._GCancellable;

        this.g_cancellable_new = this.lib.declare("g_cancellable_new", ctypes.default_abi, this.GCancellable.ptr);
        this.createGCancellable = function() {
          return this.g_cancellable_new();
        };
      },

      shutdown : function() {
        this.lib.close();
      }
    };
