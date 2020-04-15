import {errorHeader, noPortError, msgError} from './errors.js';

function SupPort(portsObj) {
	return (portBaseName, handler, inOnly = {}, useOutOnly = false) => {
		const
			inPortName = portBaseName + `In`,
			outPortName = portBaseName + `Out`,
			inPort = portsObj[inPortName],
			outPort = portsObj[outPortName];

		let send;
		if (useOutOnly) {
			send = msg => {
				throw `${errorHeader(portBaseName, msg)}

	You tried to send some data back into Elm, but this port is set up as "out only".

	This means that the 4th argument you passed into the port handling function was 'true'.
	Try removing that.`
			}
		} else {
			if (inPort === undefined) {
				throw noPortError(portsObj, inPortName, `in`);
			} else {
				const portSend = inPort.send;
				send = (msg, data, from) => {
					if (typeof msg === `string`)
						portSend({msg, data});
					else
						throw msgError(portBaseName, from);
				};

				Object.entries(inOnly).map(([msg, sendFunction]) => {
					sendFunction(
						data => send(msg, data, msg),
						(inMsg, data) => send(inMsg, data, msg)
					);
				});
			}
		}


		if (outPort === undefined) {
			if (!isEmpty(handler))
				throw noPortError(portsObj, outPortName, `out`);
		} else {
			outPort.subscribe(async ({msg, data}) => {
				const func = handler[msg];

				if (func === undefined) {
					throw `${errorHeader(portBaseName)}

'${msg}' is not a valid message name.`;
				} else {
					const in_ = await func.call(handler, data);

					if (Array.isArray(in_)) {
						send(in_[0], in_[1], msg);
					} else if (typeof in_ === `string`) {
						send(in_, null, msg);
					} else if (typeof in_ === `function`) {
						in_((inMsg, inData) => send(inMsg, inData, msg));
					}
				}
			});
		}
	}
};


function isEmpty(obj) {
	return Object.keys(obj).length === 0;
}

export default SupPort;
