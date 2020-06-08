const
	{
		errorHeader,
		noPortError,
		msgError
	} = require(`./test/errors`),
	SupPort = require(`./test/index`).default;

const
	inOnlyPorts = {testIn: {send: () => {}}},
	outOnlyPorts = {testOut: {subscribe: () => {}}},
	mockPorts = {
		testOut: {subscribe: jest.fn()},
		testIn: {send: jest.fn()},
		otherPortOut: {subscribe: 1},
		otherPortIn: {send: 1},
	};

describe(`in subscribe handler`, () => {
	beforeAll(() => {
		mockPorts.testOut.subscribe.mockClear();
		SupPort(mockPorts)(`test`, {Test: () => `Port`}, {}, true);
	});

	test(`invalid message`, () => {
		const [[handler]] = mockPorts.testOut.subscribe.mock.calls;
		return expect(handler({msg: `Test2`}))
			.rejects
			.toBe(`${errorHeader(`test`)}

'Test2' is not a valid message name.`
		)
	});

	test(`out-only but there is an attempt to send a message back in`, () => {
		const [[handler]] = mockPorts.testOut.subscribe.mock.calls;
		return expect(handler({msg: `Test`})).rejects.toBe(`${errorHeader(`test`, `Port`)}

	You tried to send some data back into Elm, but this port is set up as "out only".

	This means that the 4th argument you passed into the port handling function was 'true'.
	Try removing that.`
		)
	});
});

describe(`sending in values`, () => {
	beforeEach(() => {
		mockPorts.testOut.subscribe.mockClear();
		mockPorts.testIn.send.mockClear();
	});

	test(`string`, async () => {
		SupPort(mockPorts)(`test`, {Test: () => `Port`});

		const [[handler]] = mockPorts.testOut.subscribe.mock.calls;

		await handler({msg: `Test`});

		expect(mockPorts.testIn.send.mock.calls[0][0])
			.toEqual({msg: `Port`, data: null});
	});

	test(`tuple (array)`, async () => {
		SupPort(mockPorts)(`test`, {
			Test(data) {return [`Port`, data];}
		});

		const [[handler]] = mockPorts.testOut.subscribe.mock.calls;

		await handler({msg: `Test`, data: 1});

		expect(mockPorts.testIn.send.mock.calls[0][0])
			.toEqual({msg: `Port`, data: 1});
	});

	test(`function`, async () => {
		SupPort(mockPorts)(`test`, {
			Test(data) {return send => send(`Port`, data);}
		});

		const [[handler]] = mockPorts.testOut.subscribe.mock.calls;

		await handler({msg: `Test`, data: 1});

		expect(mockPorts.testIn.send.mock.calls[0][0])
			.toEqual({msg: `Port`, data: 1});
	});

	describe(`message errors`, () => {
		test(`tuple (array)`, () => {
			SupPort(mockPorts)(`test`, {
				Test(data) {return [data];}
			});

			const [[handler]] = mockPorts.testOut.subscribe.mock.calls;

			return expect(handler({msg: `Test`, data: 1}))
				.rejects
				.toBe(msgError(`test`, `Test`));

		});

		test(`function`, async () => {
			SupPort(mockPorts)(`test`, {
				Test(data) {return send => send(data);}
			});

			const [[handler]] = mockPorts.testOut.subscribe.mock.calls;

			return expect(handler({msg: `Test`, data: 1}))
				.rejects
				.toBe(msgError(`test`, `Test`));
		});
	});

	describe(`in-only`, () => {
		test(`send`, async () => {
			SupPort(mockPorts)(`test`, {}, {
				Test(send) {send(1);}
			});

			expect(mockPorts.testIn.send.mock.calls[0][0])
				.toEqual({msg: `Test`, data: 1});
		});

		test(`sendTo`, async () => {
			SupPort(mockPorts)(`test`, {}, {
				_(_, sendTo) {sendTo(`Port`, 1);}
			});

			expect(mockPorts.testIn.send.mock.calls[0][0])
				.toEqual({msg: `Port`, data: 1});
		});

		test(`message error`, async () => {
			expect(() => {
				SupPort(mockPorts)(`test`, {}, {
					_(_, sendTo) {sendTo(1);}
				})
			}).toThrow(msgError(`test`, `_`));
		});
	});
});

test(`both ports undefined`, () => {
	expect(() => SupPort({})(`test`, {}))
		.toThrow(noPortError({}, `testIn`, `in`));
});

test(`in-port undefined but not set to out-only`, () => {
	expect(() => SupPort(outOnlyPorts)(`test`, {}))
		.toThrow(noPortError(outOnlyPorts, `testIn`, `in`));
});

test(`in-port undefined but set to out-only`, () => {
	expect(SupPort(outOnlyPorts)(`test`, {}, {}, true))
		.toBe(undefined);
});

test(`out-port undefined but handler not empty`, () => {
	expect(() => SupPort(inOnlyPorts)(`test`, {a: 1}))
		.toThrow(noPortError(inOnlyPorts, `testOut`, `out`));
});

test(`out-port undefined but handler empty`, () => {
	expect(SupPort(inOnlyPorts)(`test`, {}))
		.toBe(undefined);
});

describe(`error messages`, () => {
	test(`error header`, () => {
		expect(errorHeader(1, 2, 3)).toBe(`SupPort Error: 1 -> 2 -> 3`);
	});

	describe(`no port errors`, () => {
		test(`in`, () => {
			expect(noPortError(mockPorts, `testIn`, `in`))
				.toBe(`${errorHeader(`There is no "testIn" port`)}

To use SupPort, ports have to use the naming convention "portName(In|Out)".
Out-ports are for sending values out of Elm.
In-ports are for sending values into Elm.

To use an out-port by itself, pass 'true' as the 4th argument to your port handling function.

Your in-ports are:
	otherPortIn
	testIn`
				)
		});

		test(`out`, () => {
			expect(noPortError(mockPorts, `testOut`, `out`))
				.toBe(`${errorHeader(`There is no "testOut" port`)}

To use SupPort, ports have to use the naming convention "portName(In|Out)".
Out-ports are for sending values out of Elm.
In-ports are for sending values into Elm.

To use an in-port by itself, pass an empty object as the 2nd argument to your port handling function.

Your out-ports are:
	otherPortOut
	testOut`
				)
		});
	});
})
