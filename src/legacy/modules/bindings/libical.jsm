/* ***** BEGIN LICENSE BLOCK *****
 * EDS Calendar Integration
 * Copyright: 2021 Mateusz Balbus <balbusm@gmail.com>
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

const { moduleRegistry } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/moduleRegistry.jsm");
moduleRegistry.registerModule(__URI__);

const { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");
const { loadLib } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/libLoader.jsm");
const { edslib } = ChromeUtils.import("resource://edscalendar/legacy/modules/bindings/edslib.jsm");
const { libicalGlib } = ChromeUtils.import("resource://edscalendar/legacy/modules/bindings/libical-glib.jsm");
const { libicalOld } = ChromeUtils.import("resource://edscalendar/legacy/modules/bindings/libical-old.jsm");
const { addLogger } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/logger.jsm");


const EXPORTED_SYMBOLS = ["libical"];

const libical = {

	lib: null,

	init: function() {
		if (this.lib) {
			return;
		}
        addLogger(this, "libical");
        if (edslib.isOldEdsLib()) {
            this.lib = libicalOld;
        } else {
            this.lib = libicalGlib;
        }
        this.lib.init();
		this.exposeFuntions();
	},

	exposeFuntions: function() {
        Object
            .getOwnPropertyNames(this.lib)
            .filter(name => (name !== "constructor" && !this[name]))
            .forEach(name => {
                this[name] = this.lib[name];
            });
	},

};
