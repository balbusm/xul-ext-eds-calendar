/* ***** BEGIN LICENSE BLOCK *****
 * EDS Calendar Integration
 * Copyright: 2014-2021 Mateusz Balbus <balbusm@gmail.com>
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
"use strict";

const { moduleRegistry } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/moduleRegistry.jsm");
moduleRegistry.registerModule(__URI__);

const { getMessenger } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/apiAccess.jsm");

const EXPORTED_SYMBOLS = ["edsPreferences"];


class EdsPreferences {
    constructor() {
        this.messenger = getMessenger();
        this.prefs = null;
    }

    async load() {
        this.prefs = await this.messenger.storage.local.get();
    }

    getInitialProcressingDelay() {
        return this.prefs["processing.start.delay"];
    }

    getItemProcessingDelay() {
        return this.prefs["processing.item.delay"];
    }

    isDebugEnabled() {
        return this.prefs.debug;
    }

    getLoggingDomains() {
        return this.prefs["logging.domains"];
    }

    isLoggingEnabled() {
        return this.prefs["logging.enabled"];
    }
}

var edsPreferences = new EdsPreferences();
