# SupPort

This is the JavaScript component to the [SupPort Elm Package](https://github.com/ursi/support). The documentation for using SupPort on the Elm side is in that package.

To get up and running with SupPort on the JS side, start by importing the `SupPort` function and creating your port handling function.

```js
import SupPort from '@ursi/support';

const app = Elm.Main.init()

const port = SupPort(app.ports);
```

## Full API

### `port(portName, handler [, inOnly [, useOutOnly]])`

* `portName`: This is a `string` that is equal to the first part of your In/Out port pair.
* `handler`: This is an object whose keys correspond to the strings passed to the `SupPort.out` function (in Elm), and whose values are functions that take the `Json.Encode.Value`s passed to `SupPort.out` as their arguments.

    The `handler` methods can return 4 different things:
    * **A 2-tuple (array):** The 2 values correspond to the appropriate value in the `List ( String, Decoder Msg )` passed into `SupPort.in_` in Elm.

        e.g. `['NumberReceived', 5]`
    * **Just a string:** This is shorthand for sending a tuple using the given string and having the data equal to `null`.

    * **A function:** This is the most general case. The returned function takes in, as its only argument, a function of two arguments. These two arguments correspond to the appropriate value in the `List ( String, Decoder Msg )` passed into `SupPort.in_` in Elm.

        e.g.
        ```js
        port(`timer`, {
            StartTimer() {
                return send => {
                    setInterval(() => send(`TimeReceived`, Date.now()), 1000);
                }
            };
        });
        ```
    * **undefined:** If nothing (`undefined`), is returned SupPort will not attempt to send any information back to Elm.

    The value of `this` in each of the `handler` methods is `handler`, so data can be shared between them without using the global scope.
* `inOnly`: This is an object used to specify values that are sent into Elm without first needing to be set up by a value coming out of Elm. Maybe you just want to listen to the `scroll` event of the window at all times.

    Usually, the keys of this object represent the string part of data going into Elm. The values are functions that take 2 functions as their arguments.
    * `send`: This function takes a single argument - a value to be passed into Elm. The string that accompanies this value will be the name of the method.
    * `sendTo`: This function doesn't restrict which message you're sending back in. It takes 2 arguments. The first is a string, the second the value to be passed into Elm.

    Here is how you could write out the `scroll` example above:

    ```js
    port(`ports`, {}, {
        Scrolled(send) {
            addEventListener(`scroll`, function() {send(this.scrollY);});
        }
    });
    ```
* `useOutOnly`: If you only want to send values out of Elm, you can set this to `true` so that `port` doesn't throw an error when it can't find your in-port.
