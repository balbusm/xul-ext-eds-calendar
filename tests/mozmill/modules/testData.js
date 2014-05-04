

exports.testLongAddRemoveCalendars = {
  calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae-XYY", name: "testLongAddRemoveCalendars"}
};

exports.testLongAddRemoveItems = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae00", name: "testLongAddRemoveItems", type: "dummy" },
    item: "BEGIN:VCALENDAR\n" +
    "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
    "VERSION:2.0\n" +
    "BEGIN:VTIMEZONE\n" +
    "TZID:Europe/Warsaw\n" +
    "X-LIC-LOCATION:Europe/Warsaw\n" +
    "BEGIN:DAYLIGHT\n" +
    "TZOFFSETFROM:+0100\n" +
    "TZOFFSETTO:+0200\n" +
    "TZNAME:CEST\n" +
    "DTSTART:19700329T020000\n" +
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
    "END:DAYLIGHT\n" +
    "BEGIN:STANDARD\n" +
    "TZOFFSETFROM:+0200\n" +
    "TZOFFSETTO:+0100\n" +
    "TZNAME:CET\n" +
    "DTSTART:19701025T030000\n" +
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
    "END:STANDARD\n" +
    "END:VTIMEZONE\n" +
    "BEGIN:VEVENT\n" +
    "CREATED:20131220T225208Z\n" +
    "LAST-MODIFIED:20131220T225233Z\n" +
    "DTSTAMP:20131220T225233Z\n" +
    "UID:${uid}\n" +
    "SUMMARY:testItem\n" +
    "CATEGORIES:Birthday\n" +
    "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
    "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
    "LOCATION:loc\n" +
    "END:VEVENT\n" +
    "END:VCALENDAR"
};

exports.testAddNewCalendar = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae01", name: "testAddNewCalendar", type: "dummy"}
};

exports.testRemoveCalendar = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae02", name: "testRemoveCalendar", type: "dummy"}
};

exports.testAddItem = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae03", name: "testAddItemCal", type: "dummy" },
    item: "BEGIN:VCALENDAR\n" +
          "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
          "VERSION:2.0\n" +
          "BEGIN:VTIMEZONE\n" +
          "TZID:Europe/Warsaw\n" +
          "X-LIC-LOCATION:Europe/Warsaw\n" +
          "BEGIN:DAYLIGHT\n" +
          "TZOFFSETFROM:+0100\n" +
          "TZOFFSETTO:+0200\n" +
          "TZNAME:CEST\n" +
          "DTSTART:19700329T020000\n" +
          "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
          "END:DAYLIGHT\n" +
          "BEGIN:STANDARD\n" +
          "TZOFFSETFROM:+0200\n" +
          "TZOFFSETTO:+0100\n" +
          "TZNAME:CET\n" +
          "DTSTART:19701025T030000\n" +
          "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
          "END:STANDARD\n" +
          "END:VTIMEZONE\n" +
          "BEGIN:VEVENT\n" +
          "CREATED:20131220T225208Z\n" +
          "LAST-MODIFIED:20131220T225233Z\n" +
          "DTSTAMP:20131220T225233Z\n" +
          "UID:${uid}\n" +
          "SUMMARY:testItem1\n" +
          "CATEGORIES:Birthday\n" +
          "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
          "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
          "LOCATION:loc\n" +
          "END:VEVENT\n" +
          "END:VCALENDAR"

};

exports.testGetItem = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae04", name: "testGetItemCal", type: "dummy" },
    item : 
      "BEGIN:VCALENDAR\n" +
      "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
      "VERSION:2.0\n" +
      "BEGIN:VTIMEZONE\n" +
      "TZID:Europe/Warsaw\n" +
      "X-LIC-LOCATION:Europe/Warsaw\n" +
      "BEGIN:DAYLIGHT\n" +
      "TZOFFSETFROM:+0100\n" +
      "TZOFFSETTO:+0200\n" +
      "TZNAME:CEST\n" +
      "DTSTART:19700329T020000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
      "END:DAYLIGHT\n" +
      "BEGIN:STANDARD\n" +
      "TZOFFSETFROM:+0200\n" +
      "TZOFFSETTO:+0100\n" +
      "TZNAME:CET\n" +
      "DTSTART:19701025T030000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
      "END:STANDARD\n" +
      "END:VTIMEZONE\n" +
      "BEGIN:VEVENT\n" +
      "CREATED:20131220T225208Z\n" +
      "LAST-MODIFIED:20131220T225233Z\n" +
      "DTSTAMP:20131220T225233Z\n" +
      "UID:${uid}\n" +
      "SUMMARY:testItem1\n" +
      "CATEGORIES:Birthday\n" +
      "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
      "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
      "LOCATION:loc\n" +
      "END:VEVENT\n" +
      "END:VCALENDAR"

};

exports.testDeleteItem = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae05", name: "testDeleteItemCal", type: "dummy" },
    item : 
      "BEGIN:VCALENDAR\n" +
      "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
      "VERSION:2.0\n" +
      "BEGIN:VTIMEZONE\n" +
      "TZID:Europe/Warsaw\n" +
      "X-LIC-LOCATION:Europe/Warsaw\n" +
      "BEGIN:DAYLIGHT\n" +
      "TZOFFSETFROM:+0100\n" +
      "TZOFFSETTO:+0200\n" +
      "TZNAME:CEST\n" +
      "DTSTART:19700329T020000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
      "END:DAYLIGHT\n" +
      "BEGIN:STANDARD\n" +
      "TZOFFSETFROM:+0200\n" +
      "TZOFFSETTO:+0100\n" +
      "TZNAME:CET\n" +
      "DTSTART:19701025T030000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
      "END:STANDARD\n" +
      "END:VTIMEZONE\n" +
      "BEGIN:VEVENT\n" +
      "CREATED:20131220T225208Z\n" +
      "LAST-MODIFIED:20131220T225233Z\n" +
      "DTSTAMP:20131220T225233Z\n" +
      "UID:${uid}\n" +
      "SUMMARY:testItem1\n" +
      "CATEGORIES:Birthday\n" +
      "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
      "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
      "LOCATION:loc\n" +
      "END:VEVENT\n" +
      "END:VCALENDAR"
};

exports.testModifyItem = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae06", name: "testModifyItemCal", type: "dummy" },
    oldItem :
      "BEGIN:VCALENDAR\n" +
      "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
      "VERSION:2.0\n" +
      "BEGIN:VTIMEZONE\n" +
      "TZID:Europe/Warsaw\n" +
      "X-LIC-LOCATION:Europe/Warsaw\n" +
      "BEGIN:DAYLIGHT\n" +
      "TZOFFSETFROM:+0100\n" +
      "TZOFFSETTO:+0200\n" +
      "TZNAME:CEST\n" +
      "DTSTART:19700329T020000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
      "END:DAYLIGHT\n" +
      "BEGIN:STANDARD\n" +
      "TZOFFSETFROM:+0200\n" +
      "TZOFFSETTO:+0100\n" +
      "TZNAME:CET\n" +
      "DTSTART:19701025T030000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
      "END:STANDARD\n" +
      "END:VTIMEZONE\n" +
      "BEGIN:VEVENT\n" +
      "CREATED:20131220T225208Z\n" +
      "LAST-MODIFIED:20131220T225233Z\n" +
      "DTSTAMP:20131220T225233Z\n" +
      "UID:${uid}\n" +
      "SUMMARY:testItem1\n" +
      "CATEGORIES:Birthday\n" +
      "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
      "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
      "LOCATION:loc\n" +
      "END:VEVENT\n" +
      "END:VCALENDAR",
      
      newItem :
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20131220T225208Z\n" +
        "LAST-MODIFIED:20131220T225233Z\n" +
        "DTSTAMP:20131220T225233Z\n" +
        "UID:${uid}\n" +
        "SUMMARY:testItem1\n" +
        "CATEGORIES:Namesday\n" +
        "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
        "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
        "LOCATION:loc\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR"
};

exports.testAddRecurringItem = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae07", name: "testAddRecurringItemCal", type: "dummy" },
    item :
      "BEGIN:VCALENDAR\n" +
      "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
      "VERSION:2.0\n" +
      "BEGIN:VTIMEZONE\n" +
      "TZID:Europe/Warsaw\n" +
      "X-LIC-LOCATION:Europe/Warsaw\n" +
      "BEGIN:DAYLIGHT\n" +
      "TZOFFSETFROM:+0100\n" +
      "TZOFFSETTO:+0200\n" +
      "TZNAME:CEST\n" +
      "DTSTART:19700329T020000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
      "END:DAYLIGHT\n" +
      "BEGIN:STANDARD\n" +
      "TZOFFSETFROM:+0200\n" +
      "TZOFFSETTO:+0100\n" +
      "TZNAME:CET\n" +
      "DTSTART:19701025T030000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
      "END:STANDARD\n" +
      "END:VTIMEZONE\n" +
      "BEGIN:VEVENT\n" +
      "CREATED:20140110T202736Z\n" +
      "LAST-MODIFIED:20140110T202918Z\n" +
      "DTSTAMP:20140110T202918Z\n" +
      "UID:${uid}\n" +
      "SUMMARY:testItem1\n" +
      "ATTENDEE;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:mailto:testmail@gmail.com\n" +
      "ATTACH:http://google.com/\n" +
      "RRULE:FREQ=DAILY;UNTIL=20140124T210000Z\n" +
      "DTSTART;TZID=Europe/Warsaw:20140109T220000\n" +
      "DTEND;TZID=Europe/Warsaw:20140109T230000\n" +
      "TRANSP:OPAQUE\n" +
      "END:VEVENT\n" +
      "END:VCALENDAR"
};

exports.testAddAlertItem = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae08", name: "testAddAlertItemCal", type: "dummy" },
    item : 
      "BEGIN:VCALENDAR\n" +
      "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
      "VERSION:2.0\n" +
      "BEGIN:VTIMEZONE\n" +
      "TZID:Europe/Warsaw\n" +
      "X-LIC-LOCATION:Europe/Warsaw\n" +
      "BEGIN:DAYLIGHT\n" +
      "TZOFFSETFROM:+0100\n" +
      "TZOFFSETTO:+0200\n" +
      "TZNAME:CEST\n" +
      "DTSTART:19700329T020000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
      "END:DAYLIGHT\n" +
      "BEGIN:STANDARD\n" +
      "TZOFFSETFROM:+0200\n" +
      "TZOFFSETTO:+0100\n" +
      "TZNAME:CET\n" +
      "DTSTART:19701025T030000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
      "END:STANDARD\n" +
      "END:VTIMEZONE\n" +
      "BEGIN:VEVENT\n" +
      "CREATED:20140110T203927Z\n" +
      "LAST-MODIFIED:20140110T203955Z\n" +
      "DTSTAMP:20140110T203955Z\n" +
      "UID:${uid}\n" +
      "SUMMARY:testItem1\n" +
      "DTSTART;TZID=Europe/Warsaw:20140110T215500\n" +
      "DTEND;TZID=Europe/Warsaw:20140110T225500\n" +
      "DESCRIPTION:Description\n" +
      "BEGIN:VALARM\n" +
      "ACTION:DISPLAY\n" +
      "TRIGGER;VALUE=DURATION:-PT15M\n" +
      "DESCRIPTION:Default Mozilla Description\n" +
      "END:VALARM\n" +
      "END:VEVENT\n" +
      "END:VCALENDAR"

};

exports.testAddTodoItem = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae09", name: "testAddTodoItemCal", type: "dummy" },
    item : 
      "BEGIN:VCALENDAR\n" +
      "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
      "VERSION:2.0\n" +
      "BEGIN:VTIMEZONE\n" +
      "TZID:Europe/Warsaw\n" +
      "X-LIC-LOCATION:Europe/Warsaw\n" +
      "BEGIN:DAYLIGHT\n" +
      "TZOFFSETFROM:+0100\n" +
      "TZOFFSETTO:+0200\n" +
      "TZNAME:CEST\n" +
      "DTSTART:19700329T020000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
      "END:DAYLIGHT\n" +
      "BEGIN:STANDARD\n" +
      "TZOFFSETFROM:+0200\n" +
      "TZOFFSETTO:+0100\n" +
      "TZNAME:CET\n" +
      "DTSTART:19701025T030000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
      "END:STANDARD\n" +
      "END:VTIMEZONE\n" +
      "BEGIN:VTODO\n" +
      "CREATED:20140110T215005Z\n" +
      "LAST-MODIFIED:20140110T215112Z\n" +
      "DTSTAMP:20140110T215112Z\n" +
      "UID:${uid}\n" +
      "SUMMARY:testItem1\n" +
      "STATUS:IN-PROCESS\n" +
      "RRULE:FREQ=DAILY\n" +
      "CATEGORIES:Anniversary\n" +
      "CATEGORIES:Birthday\n" +
      "DTSTART;TZID=Europe/Warsaw:20140121T230000\n" +
      "DUE;TZID=Europe/Warsaw:20140121T230000\n" +
      "LOCATION:location\n" +
      "PERCENT-COMPLETE:17\n" +
      "DESCRIPTION:desc\n" +
      "BEGIN:VALARM\n" +
      "ACTION:DISPLAY\n" +
      "TRIGGER;VALUE=DURATION:-PT30M\n" +
      "DESCRIPTION:Default Mozilla Description\n" +
      "END:VALARM\n" +
      "END:VTODO\n" +
      "END:VCALENDAR"
};

exports.testAddEvolutionTodoItem = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae10", name: "testAddEvolutionTodoItemCal", type: "dummy" },
    item :
      "BEGIN:VCALENDAR\n" +
      "PRODID:-//Ximian//NONSGML Evolution Calendar//EN\n" +
      "VERSION:2.0\n" +
      "METHOD:PUBLISH\n" +
      "BEGIN:VTODO\n" +
      "UID:${uid}\n" +
      "DTSTAMP:20140112T181353Z\n" +
      "PERCENT-COMPLETE:0\n" +
      "PRIORITY:0\n" +
      "SUMMARY:testItem1\n" +
      "CLASS:PUBLIC\n" +
      "SEQUENCE:1\n" +
      "CREATED:20140112T181633Z\n" +
      "LAST-MODIFIED:20140112T181633Z\n" +
      "END:VTODO\n" +
      "END:VCALENDAR"
};

exports.testEditRecurrenceItem = {
        calendar :  { id: "f8192dac-61dc-11e3-a20e-010b628cae11", name: "testEditItemCal", type: "dummy" },
        oldParentItem : "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140502T093141Z\n" +
        "LAST-MODIFIED:20140502T093204Z\n" +
        "DTSTAMP:20140502T093204Z\n" +
        "UID:${uid}\n" +
        "SUMMARY:TestEvent\n" +
        "RRULE:FREQ=DAILY;UNTIL=20140406T100000Z\n" +
        "DTSTART;TZID=Europe/Warsaw:20140401T120000\n" +
        "DTEND;TZID=Europe/Warsaw:20140401T130000\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",
    
        newParentItem : "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140502T093141Z\n" +
        "LAST-MODIFIED:20140502T093936Z\n" +
        "DTSTAMP:20140502T093936Z\n" +
        "UID:${uid}\n" +
        "SUMMARY:TestEvent\n" +
        "RRULE:FREQ=DAILY;UNTIL=20140406T100000Z\n" +
        "DTSTART;TZID=Europe/Warsaw:20140401T120000\n" +
        "DTEND;TZID=Europe/Warsaw:20140401T130000\n" +
        "X-MOZ-GENERATION:1\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",

        newExceptionItem: "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140502T093917Z\n" +
        "LAST-MODIFIED:20140502T093936Z\n" +
        "DTSTAMP:20140502T093936Z\n" +
        "UID:${uid}\n" +
        "SUMMARY:TestEvent123\n" +
        "RECURRENCE-ID;TZID=Europe/Warsaw:20140402T120000\n" +
        "DTSTART;TZID=Europe/Warsaw:20140402T120000\n" +
        "DTEND;TZID=Europe/Warsaw:20140402T130000\n" +
        "X-MOZ-GENERATION:1\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR"
};

exports.testRemovalLastRecurrenceItem = {
    calendar : { id: "f8192dac-61dc-11e3-a20e-010b628cae12", name: "testRemovalItemCal", type: "dummy" },
    oldParentItem : "BEGIN:VCALENDAR\n" +
      "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
      "VERSION:2.0\n" +
      "BEGIN:VTIMEZONE\n" +
      "TZID:Europe/Warsaw\n" +
      "X-LIC-LOCATION:Europe/Warsaw\n" +
      "BEGIN:DAYLIGHT\n" +
      "TZOFFSETFROM:+0100\n" +
      "TZOFFSETTO:+0200\n" +
      "TZNAME:CEST\n" +
      "DTSTART:19700329T020000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
      "END:DAYLIGHT\n" +
      "BEGIN:STANDARD\n" +
      "TZOFFSETFROM:+0200\n" +
      "TZOFFSETTO:+0100\n" +
      "TZNAME:CET\n" +
      "DTSTART:19701025T030000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
      "END:STANDARD\n" +
      "END:VTIMEZONE\n" +
      "BEGIN:VEVENT\n" +
      "CREATED:20140502T093141Z\n" +
      "LAST-MODIFIED:20140502T093204Z\n" +
      "DTSTAMP:20140502T093204Z\n" +
      "UID:${uid}\n" +
      "SUMMARY:TestEvent\n" +
      "RRULE:FREQ=DAILY;UNTIL=20140406T100000Z\n" +
      "DTSTART;TZID=Europe/Warsaw:20140401T120000\n" +
      "DTEND;TZID=Europe/Warsaw:20140401T130000\n" +
      "END:VEVENT\n" +
      "END:VCALENDAR",

    newParentItem : "BEGIN:VCALENDAR\n" +
      "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
      "VERSION:2.0\n" +
      "BEGIN:VTIMEZONE\n" +
      "TZID:Europe/Warsaw\n" +
      "X-LIC-LOCATION:Europe/Warsaw\n" +
      "BEGIN:DAYLIGHT\n" +
      "TZOFFSETFROM:+0100\n" +
      "TZOFFSETTO:+0200\n" +
      "TZNAME:CEST\n" +
      "DTSTART:19700329T020000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
      "END:DAYLIGHT\n" +
      "BEGIN:STANDARD\n" +
      "TZOFFSETFROM:+0200\n" +
      "TZOFFSETTO:+0100\n" +
      "TZNAME:CET\n" +
      "DTSTART:19701025T030000\n" +
      "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
      "END:STANDARD\n" +
      "END:VTIMEZONE\n" +
      "BEGIN:VEVENT\n" +
      "CREATED:20140502T093141Z\n" +
      "LAST-MODIFIED:20140502T173828Z\n" +
      "DTSTAMP:20140502T173828Z\n" +
      "UID:${uid}\n" +
      "SUMMARY:TestEvent\n" +
      "RRULE:FREQ=DAILY;UNTIL=20140406T100000Z\n" +
      "EXDATE:20140406T100000Z\n" +
      "DTSTART;TZID=Europe/Warsaw:20140401T120000\n" +
      "DTEND;TZID=Europe/Warsaw:20140401T130000\n" +
      "X-MOZ-GENERATION:1\n" +
      "SEQUENCE:1\n" +
      "END:VEVENT\n" +
      "END:VCALENDAR"
};


exports.testEditRemovalRecurrenceItem = {
        calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae13", name: "testEditRemovalItemCal", type: "dummy" },
        oldParentItem : "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140502T093141Z\n" +
        "LAST-MODIFIED:20140502T093204Z\n" +
        "DTSTAMP:20140502T093204Z\n" +
        "UID:${uid}\n" +
        "SUMMARY:TestEvent\n" +
        "RRULE:FREQ=DAILY;UNTIL=20140406T100000Z\n" +
        "DTSTART;TZID=Europe/Warsaw:20140401T120000\n" +
        "DTEND;TZID=Europe/Warsaw:20140401T130000\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",
    
        newParentItem : "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140502T093141Z\n" +
        "LAST-MODIFIED:20140502T093936Z\n" +
        "DTSTAMP:20140502T093936Z\n" +
        "UID:${uid}\n" +
        "SUMMARY:TestEvent\n" +
        "RRULE:FREQ=DAILY;UNTIL=20140406T100000Z\n" +
        "DTSTART;TZID=Europe/Warsaw:20140401T120000\n" +
        "DTEND;TZID=Europe/Warsaw:20140401T130000\n" +
        "X-MOZ-GENERATION:1\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",

        newExceptionItem: "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140502T093917Z\n" +
        "LAST-MODIFIED:20140502T093936Z\n" +
        "DTSTAMP:20140502T093936Z\n" +
        "UID:${uid}\n" +
        "SUMMARY:TestEvent123\n" +
        "RECURRENCE-ID;TZID=Europe/Warsaw:20140402T120000\n" +
        "DTSTART;TZID=Europe/Warsaw:20140402T120000\n" +
        "DTEND;TZID=Europe/Warsaw:20140402T130000\n" +
        "X-MOZ-GENERATION:1\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",
        
        removalParentItem : "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "EXDATE:20140403T180000Z\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140502T093141Z\n" +
        "LAST-MODIFIED:20140502T093936Z\n" +
        "DTSTAMP:20140502T093936Z\n" +
        "UID:${uid}\n" +
        "SUMMARY:TestEvent\n" +
        "RRULE:FREQ=DAILY;UNTIL=20140406T100000Z\n" +
        "EXDATE:20140402T100000\n" +
        "DTSTART;TZID=Europe/Warsaw:20140401T120000\n" +
        "DTEND;TZID=Europe/Warsaw:20140401T130000\n" +
        "X-MOZ-GENERATION:2\n" +
        "SEQUENCE:1\n" + 
        "END:VEVENT\n" +
        "END:VCALENDAR"
};


exports.testEditRemovalAllRecurrenceItem = {
        calendar : { id: "f8192dac-61dc-11e3-a20e-010b628cae14", name: "testEditRemovalAllItemCal", type: "dummy" },
        oldParentItem : "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140502T093141Z\n" +
        "LAST-MODIFIED:20140502T093204Z\n" +
        "DTSTAMP:20140502T093204Z\n" +
        "UID:${uid}\n" +
        "SUMMARY:TestEvent\n" +
        "RRULE:FREQ=DAILY;UNTIL=20140406T100000Z\n" +
        "DTSTART;TZID=Europe/Warsaw:20140401T120000\n" +
        "DTEND;TZID=Europe/Warsaw:20140401T130000\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",
    
        newParentItem : "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140502T093141Z\n" +
        "LAST-MODIFIED:20140502T093936Z\n" +
        "DTSTAMP:20140502T093936Z\n" +
        "UID:${uid}\n" +
        "SUMMARY:TestEvent\n" +
        "RRULE:FREQ=DAILY;UNTIL=20140406T100000Z\n" +
        "DTSTART;TZID=Europe/Warsaw:20140401T120000\n" +
        "DTEND;TZID=Europe/Warsaw:20140401T130000\n" +
        "X-MOZ-GENERATION:1\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",

        newExceptionItem: "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140502T093917Z\n" +
        "LAST-MODIFIED:20140502T093936Z\n" +
        "DTSTAMP:20140502T093936Z\n" +
        "UID:${uid}\n" +
        "SUMMARY:TestEvent123\n" +
        "RECURRENCE-ID;TZID=Europe/Warsaw:20140402T120000\n" +
        "DTSTART;TZID=Europe/Warsaw:20140402T120000\n" +
        "DTEND;TZID=Europe/Warsaw:20140402T130000\n" +
        "X-MOZ-GENERATION:1\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR"
};

exports.testSetCalendarColor = {
    calendar : {id: "f8192dac-61dc-11e3-a20e-010b628cae15", name: "testSetCalendarColor", type: "dummy",
      properties : { color : "#FF0000"}
    }
};
