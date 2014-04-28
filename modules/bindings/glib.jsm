
Components.utils.import("resource://gre/modules/ctypes.jsm");

Components.utils.import("resource://edscalendar/utils.jsm");

var EXPORTED_SYMBOLS = ["glib"];

var glib =
    {

      binaries : ["libglib-2.0.so.0", "libglib-2.0.so"],

      lib : null,

      init : function() {

        addLogger(this, "glib");
        for (let path of this.binaries) {
          try {
            this.lib = ctypes.open(path);
            this.LOG("Opened " + path);
            break;
          } catch (err) {
            this.WARN("Failed to open " + path + ": " + err);
          }
        }
        
        this.declareGStructures();
        this.declareMemAlloc();
        this.declareGMainContext();
        this.declareGError();
        this.declareGList();
        this.declareGSList();

      },
      
      declareGStructures : function() {
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
      },


      declareMemAlloc : function() {

        this.g_free = this.lib.declare("g_free",
            ctypes.default_abi,
            ctypes.void_t, // return
            glib.gpointer); // mem

      },

      declareGMainContext : function () {
        this._GMainContext = new ctypes.StructType("_GMainContext");
        this.GMainContext = this._GMainContext;
      },

      declareGError : function() {
        this._GError = new ctypes.StructType("_GError", [{domain: glib.GQuark}, 
                                                           {code: glib.gint}, 
                                                           {message: glib.gchar.ptr}]);
        this.GError = this._GError;
        
        this.g_error_free = this.lib.declare("g_error_free", ctypes.default_abi,
            ctypes.void_t, this.GError.ptr);
      },

      declareGList : function() {

        this._GList = new ctypes.StructType("_Glist");
        this._GList.define([ 
                              { data : glib.gpointer }, 
                              {	next : this._GList.ptr },
                              {	prev : this._GList.ptr }
                              ]);

        this.GList = this._GList;

        // Methods
        this.g_list_alloc = this.lib.declare("g_list_alloc",
            ctypes.default_abi, this.GList.ptr);

        this.g_list_free_full = this.lib.declare("g_list_free_full",
            ctypes.default_abi, ctypes.void_t, this.GList.ptr, glib.gpointer);

        this.g_list_length = this.lib.declare("g_list_length",
            ctypes.default_abi, glib.guint, this.GList.ptr);

        this.g_list_next = function (list) {
          return list.isNull() ? this.GList.ptr : list.contents.next; 
        };

      },
      
      declareGSList : function() {

        this._GSList = new ctypes.StructType("_GSlist");
        this._GSList.define([ 
                              { data : glib.gpointer }, 
                              { next : this._GSList.ptr }
                              ]);

        this.GSList = this._GSList;

        // Methods
        this.g_slist_alloc = this.lib.declare("g_slist_alloc",
            ctypes.default_abi, this.GSList.ptr);

        this.g_slist_free_full = this.lib.declare("g_slist_free_full",
            ctypes.default_abi, ctypes.void_t, this.GSList.ptr, glib.gpointer);

        this.g_slist_length = this.lib.declare("g_slist_length",
            ctypes.default_abi, glib.guint, this.GSList.ptr);

        this.g_slist_next = function (list) {
          return list.isNull() ? NULL : list.next; 
        };

      },

      shutdown: function() {
        this.lib.close();
      }
    };
