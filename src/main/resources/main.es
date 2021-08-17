import {toStr} from '/lib/util';
import {run} from '/lib/xp/context';
import {connect} from '/lib/xp/node';
import {create as createRepo} from '/lib/xp/repo';
import {executeFunction} from '/lib/xp/task';


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

function task() {
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

		[{
			_name: 'a',
			_nodeType: NT_DOCUMENT,
			valid: true
		},{
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
		}].forEach(({
			_name,
			_nodeType,
			valid
		}) => {
			const createNodeParams = {
				_name,
				_nodeType,
				valid
			};
			log.info(`createNodeParams:${toStr(createNodeParams)}`);
			try {
				connection.delete(_name);
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

		[{
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
		});

	}); // run
} // task


executeFunction({
	description: '',
	func: task
});
