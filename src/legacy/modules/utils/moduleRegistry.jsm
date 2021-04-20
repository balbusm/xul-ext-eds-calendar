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

const EXPORTED_SYMBOLS = ["moduleRegistry"];

class ModuleRegistry {
    constructor() {
        this.registeredModules = new Set();
        this.registerModule(__URI__);
    }

    registerModule(module) {
        this.registeredModules.add(module);
    }

    shutdown() {
        for (let module of this.registeredModules) {
            Cu.unload(module);
        }
        this.registeredModules = null;
    }
}
const moduleRegistry = new ModuleRegistry();
