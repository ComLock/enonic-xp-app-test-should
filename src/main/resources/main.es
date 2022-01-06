import {toStr} from '/lib/util';
import {run} from '/lib/xp/context';
import {connect} from '/lib/xp/node';
import {create as createRepo} from '/lib/xp/repo';
import {executeFunction} from '/lib/xp/task';
import {
	instant,
	localDate,
	localDateTime,
	localTime,
	reference
} from '/lib/xp/value';

const PERMISSIONS = [{
	principal: 'role:system.admin',
	allow: [
		'READ',
		'CREATE',
		'MODIFY',
		'DELETE',
		'PUBLISH',
		'READ_PERMISSIONS',
		'WRITE_PERMISSIONS'
	],
	deny: []
}];

const NT_DOCUMENT = `${app.name}:document`;
const NT_COLLECTION = `${app.name}:collection`;

/*const TESTS_IS_INSTANT_TRUE = [
	'2011-12-03T10:15:30Z',
	'2011-12-03T10:15:30.1Z',
	'2011-12-03T10:15:30.12Z',
	'2011-12-03T10:15:30.123Z',
	'2011-12-03T10:15:30.1234Z',
	'2011-12-03T10:15:30.12345Z',
	'2011-12-03T10:15:30.123456Z',
	'2011-12-03T10:15:30.1234567Z',
	'2011-12-03T10:15:30.12345678Z',
	'2011-12-03T10:15:30.123456789Z',
	'2000-01-01T00:00:00Z',
	'9999-01-01T00:00:00Z',
	'2000-01-01T23:00:00Z',
	'2000-01-01T24:00:00Z', // Allowed
	'2000-01-01T00:59:00Z',
	'2000-01-01T00:00:59Z',
];
/*const TESTS_IS_INSTANT_FALSE = [
//'2000-00-01T00:00:00Z',
//'2000-01-00T00:00:00Z',
//'2000-13-01T00:00:00Z',
//'2000-01-32T00:00:00Z',
//'2000-01-01T24:00:01Z', // Nope
//'2000-01-01T25:00:00Z',
//'2000-01-01T00:60:00Z',
//'2000-01-01T00:00:60Z',
	'2002-12-31T23:00:00+01:00' // java.time.format.DateTimeParseException: Text '2002-12-31T23:00:00+01:00' could not be parsed at index 19
	'2011-12-03T10:15Z', // java.time.format.DateTimeParseException: Text '2011-12-03T10:15Z' could not be parsed at index 16
	'2011-12-03T10:15:30', // java.time.format.DateTimeParseException: Text '2011-12-03T10:15:30' could not be parsed at index 19
	'2011-12-03T10:15:30.1234567890Z', // java.time.format.DateTimeParseException: Text '2011-12-03T10:15:30.1234567890Z' could not be parsed at index 29
];*/

/*const TESTS_LOCAL_DATE_VALID = [
	'2011-12-03',
	'0000-01-01',
	'9999-12-31',
];*/

/*const TESTS_LOCAL_DATE_INVALID = [
	// Invalid format
	'0000-1-01', // Text '0000-1-01' could not be parsed at index 5 java.time.format.DateTimeParseException
	'0000-01-01T', // Text '0000-01-01T' could not be parsed, unparsed text found at index 10 java.time.format.DateTimeParseException
	// Valid format, but invalid date
	'0000-00-01', // Text '0000-00-01' could not be parsed: Invalid value for MonthOfYear (valid values 1 - 12): 0 java.time.format.DateTimeParseException
	'0000-01-00', // Text '0000-01-00' could not be parsed: Invalid value for DayOfMonth (valid values 1 - 28/31): 0 java.time.format.DateTimeParseException
	'0000-13-01', // Text '0000-13-01' could not be parsed: Invalid value for MonthOfYear (valid values 1 - 12): 13 java.time.format.DateTimeParseException
	'0000-01-32', // Text '0000-01-32' could not be parsed: Invalid value for DayOfMonth (valid values 1 - 28/31): 32 java.time.format.DateTimeParseException
];*/

/*const TESTS_LOCAL_DATE_TIME_VALID = [
	'2007-12-03T10:15:30',
	'0000-01-01T00:00:00',
	'9999-12-31T23:59:59',
	'0000-01-01T00:00', // Surprise, this is allowed
	'0000-01-01T00:00:00.', // Surprise, also allowed
	'0000-01-01T00:00:00.0',
	'0000-01-01T00:00:00.1',
	'0000-01-01T00:00:00.12',
	'0000-01-01T00:00:00.123',
	'0000-01-01T00:00:00.1234',
	'0000-01-01T00:00:00.12345',
	'0000-01-01T00:00:00.123456',
	'0000-01-01T00:00:00.1234567',
	'0000-01-01T00:00:00.12345678',
	'0000-01-01T00:00:00.123456789',
	'0000-01-01T00:00:00.000000000',
];*/
/*const TESTS_LOCAL_DATE_TIME_INVALID = [
	'0000-01-01', // Text '0000-01-01' could not be parsed at index 10 java.time.format.DateTimeParseException
	'0000-01-01T', // Text '0000-01-01T' could not be parsed at index 11 java.time.format.DateTimeParseException
	'0000-01-01T00', // Text '0000-01-01T00' could not be parsed at index 13 java.time.format.DateTimeParseException
	'0000-01-01T00:00.1', // Text '0000-01-01T00:00.1' could not be parsed, unparsed text found at index 16 java.time.format.DateTimeParseException
	'2007-12-03T10:15:30Z', // Text '2007-12-03T10:15:30Z' could not be parsed, unparsed text found at index 19 java.time.format.DateTimeParseException
	'0000-00-01T00:00:00', // Text '0000-00-01T00:00:00' could not be parsed: Invalid value for MonthOfYear (valid values 1 - 12): 0 java.time.format.DateTimeParseException
	'0000-01-00T00:00:00', // Text '0000-01-00T00:00:00' could not be parsed: Invalid value for DayOfMonth (valid values 1 - 28/31): 0 java.time.format.DateTimeParseException
	'0000-01-01T24:00:00', // Text '0000-01-01T24:00:00' could not be parsed: Invalid value for HourOfDay (valid values 0 - 23): 24 java.time.format.DateTimeParseException
	'0000-01-01T00:60:00', // Text '0000-01-01T00:60:00' could not be parsed: Invalid value for MinuteOfHour (valid values 0 - 59): 60 java.time.format.DateTimeParseException
	'0000-01-01T00:00:60', // Text '0000-01-01T00:00:60' could not be parsed: Invalid value for SecondOfMinute (valid values 0 - 59): 60 java.time.format.DateTimeParseException
	'0000-01-01T00:00:00.1234567890', // Text '0000-01-01T00:00:00.1234567890' could not be parsed, unparsed text found at index 29 java.time.format.DateTimeParseException
];*/

/*const TESTS_ISTIME_TRUE = [
	'10:15:30',
	'00:00:00',
	'00:00',
	'00:00:00.', // Allowed
	'00:00:00.1',
	'00:00:00.12',
	'00:00:00.123',
	'00:00:00.1234',
	'00:00:00.12345',
	'00:00:00.123456',
	'00:00:00.1234567',
	'00:00:00.12345678',
	'00:00:00.123456789',
];*/

/*const TESTS_ISTIME_FALSE = [
	'00', // java.time.format.DateTimeParseException: Text '00' could not be parsed at index 2
	'00:0',
	'0:00',
	'0:0:0',
	'00:00:00.1234567890', // Text '00:00:00.1234567890' could not be parsed, unparsed text found at index 18
	'25:00', // java.time.format.DateTimeParseException: Text '25:00' could not be parsed: Invalid value for HourOfDay (valid values 0 - 23): 25
	'00:60', // java.time.format.DateTimeParseException: Text '00:60' could not be parsed: Invalid value for MinuteOfHour (valid values 0 - 59): 60
	'00:00:60', // java.time.format.DateTimeParseException: Text '00:00:60' could not be parsed: Invalid value for SecondOfMinute (valid values 0 - 59): 60
	'00:00.1', // java.time.format.DateTimeParseException: Text '00:00.1' could not be parsed, unparsed text found at index 5
];*/

function task() {
	/*for (var i = 0; i < TESTS_IS_INSTANT_TRUE.length; i++) {
		const t = TESTS_IS_INSTANT_TRUE[i];
		log.info(`${t} | ${instant(t)}`);
	}*/
	/*for (var i = 0; i < TESTS_LOCAL_DATE_VALID.length; i++) {
		const t = TESTS_LOCAL_DATE_VALID[i];
		log.info(`${t} | ${localDate(t)}`);
	}*/
	/*for (var i = 0; i < TESTS_LOCAL_DATE_TIME_VALID.length; i++) {
		const t = TESTS_LOCAL_DATE_TIME_VALID[i];
		log.info(`${t} | ${localDateTime(t)}`);
	}*/
	/*for (var i = 0; i < TESTS_ISTIME_TRUE.length; i++) {
		const t = TESTS_ISTIME_TRUE[i];
		log.info(`${t} | ${localTime(t)}`);
	}*/
	run({
		repository: app.name,
		branch: 'master',
		principals: ['role:system.admin']
	}, () => {
		const createRepoParams = {
			id: app.name,
			rootPermissions: PERMISSIONS
		};
		log.info(`createRepoParams:${toStr(createRepoParams)}`);
		try {
			createRepo(createRepoParams);
		} catch (e) {
			log.error(`e:${toStr(e)}`);
		}
		const connectParams = {
			branch: 'master',
			repoId: app.name,
			principals: ['role:system.admin']
		};
		log.info(`connectParams:${toStr(connectParams)}`);
		const connection = connect(connectParams);

		const dateObject = new Date();

		[{
			_name: 'a',
			_nodeType: NT_DOCUMENT,
			dateObject,
			myInstant: instant(dateObject),
			myLocalDate: localDate(dateObject),
			myLocalDateTime: localDateTime(dateObject),
			myLocalTime: localTime(dateObject),
			notReference: '27b16315-0d0a-40ec-bdd0-de622b076b3a',
			reference: reference('27b16315-0d0a-40ec-bdd0-de622b076b3a'),
			valid: true
		}/*,{
			_name: 'b',
			_nodeType: NT_DOCUMENT,
			valid: false
		},{
			_name: 'c',
			_nodeType: NT_COLLECTION,
			valid: true
		},{
			_name: 'd',
			_nodeType: NT_COLLECTION,
			valid: false
		}*/].forEach(({
			_name,
			_nodeType,
			dateObject,
			myInstant,
			myLocalDate,
			myLocalDateTime,
			myLocalTime,
			notReference,
			reference,
			valid
		}) => {
			const createNodeParams = {
				_name,
				_nodeType,
				dateObject,
				myInstant,
				myLocalDate,
				myLocalDateTime,
				myLocalTime,
				notReference,
				reference,
				valid
			};
			log.info(`createNodeParams:${toStr(createNodeParams)}`);
			try {
				connection.delete(`/${_name}`);
			} catch (e) {
				log.error(`e:${toStr(e)}`);
			}
			try {
				const createdNode = connection.create(createNodeParams);
				log.info(`createdNode:${toStr(createdNode)}`);
			} catch (e) {
				log.error(`e:${toStr(e)}`);
			}
		});

		// Refresh the index for the current repoConnection. The index has two parts, search and storage. It is possible to index both or just one of them.
		connection.refresh();

		const node = connection.get('/a');
		log.info(`node:${toStr(node)}`);
		log.info(`toStr(node.reference):${toStr(node.reference)}`);
		log.info(`node.reference:${node.reference}`);
		log.info(node.reference);
		log.info(node.reference, node.reference);
		log.info(`typeof node.reference:${typeof node.reference}`);
		log.info(`typeof(node.reference):${typeof(node.reference)}`);
		log.info(`Object.prototype.toString.call(node.reference):${Object.prototype.toString.call(node.reference)}`);

		var System = Java.type("java.lang.System")
		log.info(`typeof(System):${typeof(System)}`); // function

		var HashMap = Java.type("java.util.HashMap")
		log.info(`typeof(HashMap):${typeof(HashMap)}`); // function
		log.info(`Object.prototype.toString.call(HashMap):${Object.prototype.toString.call(HashMap)}`); // [object jdk.dynalink.beans.StaticClass]

		/*[{
			count: -1,
			query: ''
		},{
			count: -1,
			filters: {
				boolean: {
					should: [{
						hasValue: {
							field: '_nodeType',
							values: [NT_DOCUMENT]
						}
					},{
						hasValue: {
							field: '_nodeType',
							values: [NT_COLLECTION]
						}
					}, {
						hasValue: {
							field: 'valid',
							values: [true]
						}
					}]
				}
			},
			query: ''
		},{
			count: -1,
			query: '',
			filters: {
				boolean: {
					must: [{
						boolean: {
							should: [{
								hasValue: {
									field: '_nodeType',
									values: [NT_DOCUMENT]
								}
							},{
								hasValue: {
									field: '_nodeType',
									values: [NT_COLLECTION]
								}
							}] // should
						} // boolean
					}, {
						boolean: {
							should: [{
								hasValue: {
									field: 'valid',
									values: [true]
								}
							}] // should
						} // boolean
					}] // must
				} // boolean
			} // filters
		}].forEach((params) => {
			const res = connection.query(params);
			res.hits = res.hits
				.map(({id}) => connection.get(id))
				.map(({
					_name,
					_nodeType,
					valid
				}) => ({
					_name,
					_nodeType,
					valid
				}));
			log.info(`params:${toStr(params)} res:${toStr(res)}`);
		});*/

	}); // run
} // task


executeFunction({
	description: '',
	func: task
});
