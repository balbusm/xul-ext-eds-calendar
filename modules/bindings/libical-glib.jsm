/* ***** BEGIN LICENSE BLOCK *****
 * EDS Calendar Integration
 * Copyright: 2011 Philipp Kewisch <mozilla@kewis.ch>
 * Copyright: 2014 Mateusz Balbus <balbusm@gmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * The GNU General Public License as published by the Free Software Foundation,
 * version 2 is available at: <http://www.gnu.org/licenses/>
 *
 * ***** END LICENSE BLOCK ***** */

var { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");
var edsUtils = ChromeUtils.import("resource://edscalendar/utils.jsm");

var EXPORTED_SYMBOLS = ["libical"];

var libical = {

	lib: null,

	init: function () {
		edsUtils.addLogger(this, "libical");
		this.lib = edsUtils.loadLib("libical-glib.so", 3);

		this.declareICalComponentType();
		this.declareICalComponent();
		this.declareICalTimezone();

	},

	declareICalComponentType: function () {
		// Enum
		this.icalcomponent_kind = {
			ICAL_NO_COMPONENT: 0,
			ICAL_ANY_COMPONENT: 1,
			ICAL_XROOT_COMPONENT: 2,
			ICAL_XATTACH_COMPONENT: 3,
			ICAL_VEVENT_COMPONENT: 4,
			ICAL_VTODO_COMPONENT: 5,
			ICAL_VJOURNAL_COMPONENT: 6,
			ICAL_VCALENDAR_COMPONENT: 7,
			ICAL_VAGENDA_COMPONENT: 8,
			ICAL_VFREEBUSY_COMPONENT: 9,
			ICAL_VALARM_COMPONENT: 10,
			ICAL_XAUDIOALARM_COMPONENT: 11,
			ICAL_XDISPLAYALARM_COMPONENT: 12,
			ICAL_XEMAILALARM_COMPONENT: 13,
			ICAL_XPROCEDUREALARM_COMPONENT: 14,
			ICAL_VTIMEZONE_COMPONENT: 15,
			ICAL_XSTANDARD_COMPONENT: 16,
			ICAL_XDAYLIGHT_COMPONENT: 17,
			ICAL_X_COMPONENT: 18,
			ICAL_VSCHEDULE_COMPONENT: 19,
			ICAL_VQUERY_COMPONENT: 20,
			ICAL_VREPLY_COMPONENT: 21,
			ICAL_VCAR_COMPONENT: 22,
			ICAL_VCOMMAND_COMPONENT: 23,
			ICAL_XLICINVALID_COMPONENT: 24,
			ICAL_XLICMIMEPART_COMPONENT: 25

		};

		this.icalcomponent_kind.type = ctypes.int;

	},

	declareICalTimezone: function () {
		this._icaltimezone = new ctypes.StructType("_icaltimezone");
		this.icaltimezone = this._icaltimezone;

		this.icaltimezone_set_component = this.lib.declare(
			"i_cal_timezone_set_component", ctypes.default_abi, ctypes.int,
			this.icaltimezone.ptr, this.icalcomponent.ptr);

		this.icaltimezone_get_component = this.lib.declare("i_cal_timezone_get_component",
		 ctypes.default_abi, this.icalcomponent.ptr, this.icaltimezone.ptr);

		this.icaltimezone_new = this.lib.declare("i_cal_timezone_new",
			ctypes.default_abi, this.icaltimezone.ptr);

		this.icaltimezone_free = this.lib.declare("i_cal_timezone_free",
			ctypes.default_abi, ctypes.void_t, this.icaltimezone.ptr, ctypes.int);

	},

	declareICalComponent: function () {
		// Structures
		this.icalcomponent_impl = new ctypes.StructType("icalcomponent_impl");
		this.icalcomponent = this.icalcomponent_impl;

		// Methods
		this.icalcomponent_as_ical_string = this.lib.declare(
			"i_cal_component_as_ical_string", ctypes.default_abi,
			ctypes.char.ptr, this.icalcomponent.ptr);

		this.icalcomponent_as_ical_string_r = this.lib.declare(
			"i_cal_component_as_ical_string", ctypes.default_abi,
			ctypes.char.ptr, this.icalcomponent.ptr);

		this.icalcomponent_new_from_string = this.lib.declare(
			"i_cal_component_new_from_string", ctypes.default_abi,
			this.icalcomponent.ptr, ctypes.char.ptr);

		this.icalcomponent_get_first_component = this.lib.declare(
			"i_cal_component_get_first_component", ctypes.default_abi,
			this.icalcomponent.ptr, this.icalcomponent.ptr,
			this.icalcomponent_kind.type);

		this.icalcomponent_get_next_component = this.lib.declare(
			"i_cal_component_get_next_component", ctypes.default_abi,
			this.icalcomponent.ptr, this.icalcomponent.ptr,
			this.icalcomponent_kind.type);

		this.icalcomponent_get_description = this.lib.declare(
			"i_cal_component_get_description", ctypes.default_abi,
			ctypes.char.ptr, this.icalcomponent.ptr);

		this.icalcomponent_set_description = this.lib.declare(
			"i_cal_component_set_description", ctypes.default_abi,
			ctypes.void_t, this.icalcomponent.ptr, ctypes.char.ptr);

		this.icalcomponent_isa = this.lib
			.declare("i_cal_component_isa", ctypes.default_abi,
				this.icalcomponent_kind.type, this.icalcomponent.ptr);

		this.icalcomponent_free = this.lib
			.declare("i_cal_component_free", ctypes.default_abi,
				ctypes.void_t, this.icalcomponent.ptr);

	},

	shutdown: function () {
		this.lib.close();
	}
};
