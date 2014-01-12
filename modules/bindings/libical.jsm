
Components.utils.import("resource://gre/modules/ctypes.jsm");

var EXPORTED_SYMBOLS = ["libical"];

var libical = {

	icallibPath : "libical.so",

	lib : null,

	init : function() {


		this.lib = ctypes.open(this.icallibPath);

		this.declareICalComponentType();
		this.declareICalComponent();
		this.declareICalTimezone();

	},
	
	declareICalComponentType : function() {
		// Enum
		this.icalcomponent_kind = {
			ICAL_NO_COMPONENT : 0,
			ICAL_ANY_COMPONENT : 1,
			ICAL_XROOT_COMPONENT : 2,
			ICAL_XATTACH_COMPONENT : 3,
			ICAL_VEVENT_COMPONENT : 4,
			ICAL_VTODO_COMPONENT : 5,
			ICAL_VJOURNAL_COMPONENT : 6,
			ICAL_VCALENDAR_COMPONENT : 7,
			ICAL_VAGENDA_COMPONENT : 8,
			ICAL_VFREEBUSY_COMPONENT : 9,
			ICAL_VALARM_COMPONENT : 10,
			ICAL_XAUDIOALARM_COMPONENT : 11,
			ICAL_XDISPLAYALARM_COMPONENT : 12,
			ICAL_XEMAILALARM_COMPONENT : 13,
			ICAL_XPROCEDUREALARM_COMPONENT : 14,
			ICAL_VTIMEZONE_COMPONENT : 15,
			ICAL_XSTANDARD_COMPONENT : 16,
			ICAL_XDAYLIGHT_COMPONENT : 17,
			ICAL_X_COMPONENT : 18,
			ICAL_VSCHEDULE_COMPONENT : 19,
			ICAL_VQUERY_COMPONENT : 20,
			ICAL_VREPLY_COMPONENT : 21,
			ICAL_VCAR_COMPONENT : 22,
			ICAL_VCOMMAND_COMPONENT : 23,
			ICAL_XLICINVALID_COMPONENT : 24,
			ICAL_XLICMIMEPART_COMPONENT : 25

		};

		this.icalcomponent_kind.type = ctypes.int;

	},
	
	declareICalTimezone : function() {
		this._icaltimezone = new ctypes.StructType("_icaltimezone");
		this.icaltimezone = this._icaltimezone;

		this.icaltimezone_set_component = this.lib.declare(
				"icaltimezone_set_component", ctypes.default_abi, ctypes.int,
				this.icaltimezone.ptr, this.icalcomponent.ptr);
		
		this.icaltimezone_new = this.lib.declare("icaltimezone_new",
				ctypes.default_abi, this.icaltimezone.ptr);
		
	},
	
	declareICalComponent : function() {
		// Structures
		this.icalcomponent_impl = new ctypes.StructType("icalcomponent_impl");
		this.icalcomponent = this.icalcomponent_impl;

		// Methods
		this.icalcomponent_as_ical_string = this.lib.declare(
				"icalcomponent_as_ical_string", ctypes.default_abi,
				ctypes.char.ptr, this.icalcomponent.ptr);

		this.icalcomponent_as_ical_string_r = this.lib.declare(
				"icalcomponent_as_ical_string_r", ctypes.default_abi,
				ctypes.char.ptr, this.icalcomponent.ptr);

		this.icalcomponent_new_from_string = this.lib.declare(
				"icalcomponent_new_from_string", ctypes.default_abi,
				this.icalcomponent.ptr, ctypes.char.ptr);

		this.icalcomponent_get_first_component = this.lib.declare(
				"icalcomponent_get_first_component", ctypes.default_abi,
				this.icalcomponent.ptr, this.icalcomponent.ptr,
				this.icalcomponent_kind.type);

		this.icalcomponent_get_next_component = this.lib.declare(
				"icalcomponent_get_next_component", ctypes.default_abi,
				this.icalcomponent.ptr, this.icalcomponent.ptr,
				this.icalcomponent_kind.type);

		this.icalcomponent_isa = this.lib
				.declare("icalcomponent_isa", ctypes.default_abi,
						this.icalcomponent_kind.type, this.icalcomponent.ptr);
	},
	
	shutdown : function() {
		this.lib.close();
	}
};