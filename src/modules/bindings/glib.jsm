
var EXPORTED_SYMBOLS = ["glib"];

var glib =
    {

      glibPath : "libglib-2.0.so.0",

      lib : null,

      init : function() {

        Components.utils.import("resource://gre/modules/ctypes.jsm");

        this.lib = ctypes.open(this.glibPath);

        // Structures
        this.GQuark = ctypes.uint32_t;
        this.gchar = ctypes.char;
        this.gshort = ctypes.short;
        this.glong = ctypes.long;
        this.gint = ctypes.int;
        this.gboolean = this.gint;
        this.guchar = ctypes.unsigned_char;
        this.gushort = ctypes.unsigned_short;
        this.gulong = ctypes.unsigned_long;
        this.guint = ctypes.unsigned_int;
        this.gfloat = ctypes.float;
        this.gdouble = ctypes.double;
        this.gpointer = ctypes.void_t.ptr;
        this.gconstpointer = ctypes.void_t.ptr;

        this.declareMemAlloc(this);
        this.declareGMainContext(this);
        this.declareGError(this);
        this.declareGList(this);

      },


      declareMemAlloc : function(parent) {

        // parent.g_object_unref = parent.lib.declare("g_object_unref",
        // ctypes.default_abi,
        // ctypes.void_t, // return
        // glib.gpointer); // mem

        parent.g_free = parent.lib.declare("g_free",
            ctypes.default_abi,
            ctypes.void_t, // return
            glib.gpointer); // mem

      },

      declareGMainContext : function (parent) {
        parent._GMainContext = new ctypes.StructType("_GMainContext");
        parent.GMainContext = parent._GMainContext;
      },

      declareGError : function(parent) {
        parent._GError = new ctypes.StructType("_GError", [{domain: glib.GQuark}, 
                                                           {code: glib.gint}, 
                                                           {message: glib.gchar.ptr}]);
        parent.GError = parent._GError;
      },

      declareGList : function(parent) {

        parent._GList = new ctypes.StructType("_Glist");
        parent._GList.define([ 
                              { data : glib.gpointer }, 
                              {	next : parent._GList.ptr },
                              {	prev : parent._GList.ptr }
                              ]);

        parent.GList = parent._GList;

        // Methods
        parent.g_list_alloc = parent.lib.declare("g_list_alloc",
            ctypes.default_abi, parent.GList.ptr);

        parent.g_list_free_full = parent.lib.declare("g_list_free_full",
            ctypes.default_abi, ctypes.void_t, parent.GList.ptr, glib.gpointer);

        parent.g_list_length = parent.lib.declare("g_list_length",
            ctypes.default_abi, glib.guint, parent.GList.ptr);

        parent.createGList = function () {
          return parent.g_list_alloc();
        };

        parent.GList.freeFull = function() {
          parent.g_list_free_full(this, glib.g_object_unref);
        };

        parent.GList.lenght = function() {
          return parent.g_list_length(this);
        };


      },


      debug: function (aMessage) {
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage("GLib (" + new Date() + " ):\n\t" + aMessage);
        window.dump("GLib: (" + new Date() + " ):\n\t" + aMessage + "\n");
      },

      shutdown: function() {
        this.lib.close();
      }
    };
