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

const { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { cal } = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");

const { ExtensionAPI } = ExtensionCommon;

this.edscalendar = class extends ExtensionAPI {
  edsCalendarClient;

  onStartup() {
    Services.io
      .getProtocolHandler("resource")
      .QueryInterface(Ci.nsIResProtocolHandler)
      .setSubstitution("edscalendar", this.extension.rootURI);

    let { edsCalendarClient } = ChromeUtils.import(
      "resource://edscalendar/legacy/modules/edsCalendarClient.jsm"
    );
    this.edsCalendarClient = edsCalendarClient;
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) {
      return;
    }

    this.edsCalendarClient.shutdown();
    this.edsCalendarClient = null;

    Services.io
      .getProtocolHandler("resource")
      .QueryInterface(Ci.nsIResProtocolHandler)
      .setSubstitution("edscalendar", null);

    Services.obs.notifyObservers(null, "startupcache-invalidate");
  }

  getAPI(context) {
    return {
      edscalendar: {
        async startEdsCalendarSync() {
            this.edsCalendarClient.startEdsCalendarSync();
        },
      },
    };
  }
};
