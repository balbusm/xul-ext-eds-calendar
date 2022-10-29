# EDS Calendar Integration

EDS Calendar Integration is a Thunderbird add-on. It synchronizes Evolution Data Server with Thunderbird calendar. Gnome Date and Time applet uses EDS to show calendar events. Thanks to this add-on one will get nice system notifications about upcoming events.

Available on Mozilla add-on page:
https://addons.thunderbird.net/en-US/thunderbird/addon/eds-calendar-integration

License: GPL License (v2)

Based on [Evolution Data Server Provider](https://code.launchpad.net/~mconley/edscalprovider/trunk) and [Evolution Mirror](https://addons.thunderbird.net/en-US/thunderbird/addon/evolution-mirror)

## Having issues?
If you have any issues please collect logs and attach them to the issue.  

To enable addon logging:
1. In Thunderbird go to Menu > Tools > Developer Tools > Debug Addons
1. Find "Eds Calendar Integration"
1. Go to Inspect > Storage > Extension Storage
1. Set `logging.enabled: true` (false is default)
1. In Thunderbird go to Menu (three dashes) > Preferences > Advanced > Config Editor
1. Make sure `browser.dom.window.dump.enabled` is set to true
1. Close Thunderbird
1. Start Thunderbird from terminal
1. Logs should start displaying on the screen

## Development setup
### Setup Thunderbird
1. Create a file
```
<YOUR_THUNDERBIRD_PROFILE>/extensions/{e6696d02-466a-11e3-a162-04e36188709b}
```
Example:
```
/home/<MY_HOME>/.thunderbird/ak1vcja3.default-release/extensions/{e6696d02-466a-11e3-a162-04e36188709b}
```

2. In file `{e6696d02-466a-11e3-a162-04e36188709b}` add path to your repository.<br />
Example:
```
/home/<MY_HOME>/xul-ext-eds-calendar/src
```

### Setup build environment
1. Install Node.js 18.x

### Build commands
1. First time build
   ```
   npm install
   npm run build 
   ```
1. Clean build
   ```
   npm run rebuild
   ```

### Running add-on in Thunderbird
To start addon-in Thunderbird run:
```
thunderbird -purgecaches --devtools
```
`purgecaches` - makes sure that Thunderbird doesn't cache add-on<br />
`devtools` - starts developer toolbox on startup

#### Useful shortcuts: 
CTRL + SHIFT + I - opens developer toolbox<br/>
CTRL + SHIFT + J - opens console log

### Logging and Debugging

In order to enable logging:
1. Go to Menu > Tools > Developer Tools > Debug Addons
2. Find "Eds Calendar Integration"
3. Go to Inspect > Storage > Extension Storage
4. Set `logging.enabled: true`

To enable startup debugging set `debugging: true`.<br/>
It will enable wait loop so there is time to attach debugger.

Alternative approach is to edit `perf.js` file and set `forceReload: true`.<br/>
Config will be reloaded on each startup.

## More questions?
[See FAQ for more](https://github.com/balbusm/xul-ext-eds-calendar/wiki/FAQ)
