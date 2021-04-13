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

"use strict";

const { moduleRegistry } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/moduleRegistry.jsm");
moduleRegistry.registerModule(__URI__);

const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

const { edsPreferences } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/edsPreferences.jsm");
const { addLogger } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/logger.jsm");

const EXPORTED_SYMBOLS = ["asyncHelper"];

class AsyncHelper {
    constructor() {
        addLogger(this, "asyncHelper");
        this.initialDelay = edsPreferences.getInitialProcressingDelay();
        this.itemProcessingDelay = edsPreferences.getItemProcessingDelay();
        this.window = Services.wm.getMostRecentWindow("mail:3pane");
    }

    delayedAsyncLoop(collection, callback) {
        this.LOG(`Starting async loop with delay ${this.initialDelay} ms`);
        return new Promise((resolve, reject) => {
            this.setTimeout(() => { resolve(); }, this.initialDelay);
        }).then(() => this.asyncLoop(collection, callback));
    }

    asyncLoop(collection, callback) {
        var itemNumber = -1;
        const asyncLoopInternal = (resolve, reject) => {
            itemNumber++;
            if (itemNumber >= collection.length) {
                resolve();
                return;
            }
            var item = collection[itemNumber];
            callback(item);
            this.setTimeout(() => asyncLoopInternal(resolve, reject), this.itemProcessingDelay);
        };
        this.LOG(`Starting iterating items with delay on each item ${this.itemProcessingDelay} ms`);

        return new Promise(asyncLoopInternal);
    }

    setTimeout(...args) {
        this.window.setTimeout(...args);
    }
}

var asyncHelper = new AsyncHelper();